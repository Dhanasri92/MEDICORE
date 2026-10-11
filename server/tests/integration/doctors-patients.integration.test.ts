import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Integration Tests: Doctors and Patients Management & Privacy Isolation', () => {
  let adminToken: string;
  let patientToken: string;
  let otherPatientToken: string;
  let doctorToken: string;
  let testDeptId: string;
  let createdDoctorId: string;
  let patientId1: string;
  let patientId2: string;

  beforeAll(async () => {
    // 1. Admin Login
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@medicore.hospital', password: 'Admin@123' });
    adminToken = adminRes.body.data.token;

    // 2. Doctor Login
    const docRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dr.gregory@medicore.hospital', password: 'Doctor@123' });
    doctorToken = docRes.body.data.token;

    // 3. Demo Patient Login
    const p1Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@medicore.hospital', password: 'Patient@123' });
    patientToken = p1Res.body.data.token;
    patientId1 = p1Res.body.data.user.patientId;

    // 4. Register a second distinct patient
    const p2Email = `second.patient.${Date.now()}@medicore.test`;
    const p2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: p2Email,
        password: 'Password@123',
        firstName: 'Second',
        lastName: 'Patient',
        phone: '+1 555-444-5555',
        dateOfBirth: '1988-11-10',
        gender: 'MALE',
      });
    otherPatientToken = p2Res.body.data.token;
    patientId2 = p2Res.body.data.user.patientId;

    // 5. Get a department ID
    const depts = await prisma.department.findFirst();
    testDeptId = depts!.id;
  });

  afterAll(async () => {
    if (createdDoctorId) {
      const doc = await prisma.doctor.findUnique({ where: { id: createdDoctorId } });
      if (doc) {
        await prisma.user.delete({ where: { id: doc.userId } });
      }
    }
    if (patientId2) {
      const p2 = await prisma.patient.findUnique({ where: { id: patientId2 } });
      if (p2) {
        await prisma.user.delete({ where: { id: p2.userId } });
      }
    }
    await prisma.$disconnect();
  });

  describe('Doctor Directory and Provisioning', () => {
    it('should allow public access to list doctors with pagination and filters', async () => {
      const res = await request(app).get('/api/doctors?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.doctors)).toBe(true);
      expect(res.body.data.pagination.page).toBe(1);
    });

    it('should search doctors by name or specialization', async () => {
      const res = await request(app).get('/api/doctors?search=Cardiology');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow admin to provision a new doctor account', async () => {
      const uniqueDocEmail = `prov.dr.${Date.now()}@medicore.hospital`;
      const res = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: uniqueDocEmail,
          password: 'DocPassword@123',
          firstName: 'Marcus',
          lastName: 'Vance',
          phone: '+1 555-777-8899',
          departmentId: testDeptId,
          specialization: 'Pulmonology',
          qualification: 'MD, FCCP',
          experienceYears: 12,
          consultationFee: 180.0,
          roomNumber: 'Suite 404',
          biography: 'Specialist in respiratory and intensive pulmonary medicine',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.specialization).toBe('Pulmonology');
      expect(res.body.data.consultationFee).toBe(180.0);
      createdDoctorId = res.body.data.id;
    });

    it('should reject doctor provisioning by unauthorized patient role with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          email: `fake.dr.${Date.now()}@medicore.hospital`,
          password: 'Password@123',
          firstName: 'Impostor',
          lastName: 'Doc',
          departmentId: testDeptId,
          specialization: 'Surgery',
          qualification: 'None',
          consultationFee: 100,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to update doctor profile and duty availability', async () => {
      const res = await request(app)
        .patch(`/api/doctors/${createdDoctorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          consultationFee: 195.0,
          roomNumber: 'Suite 405',
          isAvailable: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.consultationFee).toBe(195.0);
      expect(res.body.data.roomNumber).toBe('Suite 405');
      expect(res.body.data.isAvailable).toBe(false);
    });

    it('should reject doctor profile update by patient role with HTTP 403', async () => {
      const res = await request(app)
        .patch(`/api/doctors/${createdDoctorId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ consultationFee: 10.0 });

      expect(res.status).toBe(403);
    });
  });

  describe('Patient Privacy & Record Isolation Boundaries', () => {
    it('should allow staff (admin, doctor) to query patient directory', async () => {
      const adminRes = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      expect(Array.isArray(adminRes.body.data.patients)).toBe(true);

      const docRes = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(docRes.status).toBe(200);
    });

    it('PRIVACY LEAK TEST: should block patients from browsing the patient directory with HTTP 403', async () => {
      const res = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow patient to retrieve their OWN clinical profile', async () => {
      const res = await request(app)
        .get(`/api/patients/${patientId1}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(patientId1);
    });

    it('CROSS-PATIENT PRIVACY: should forbid patient from accessing ANOTHER patient profile with HTTP 403', async () => {
      // Patient 1 attempts to access Patient 2's profile
      const res = await request(app)
        .get(`/api/patients/${patientId2}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('should allow authorized doctor to view patient clinical profile', async () => {
      const res = await request(app)
        .get(`/api/patients/${patientId1}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(patientId1);
    });
  });
});
