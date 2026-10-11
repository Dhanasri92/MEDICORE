import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Integration Tests: Clinical Records, Itemized Prescriptions & Privacy Restrictions', () => {
  let adminToken: string;
  let doctorToken: string;
  let patientToken: string;
  let otherPatientToken: string;
  let testDoctorId: string;
  let testPatientId: string;
  let otherPatientId: string;

  let activeApptId: string;
  let cancelledApptId: string;
  let createdRecordId: string;

  beforeAll(async () => {
    // 1. Admin login
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@medicore.hospital', password: 'Admin@123' });
    adminToken = adminRes.body.data.token;

    // 2. Doctor login
    const docRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dr.gregory@medicore.hospital', password: 'Doctor@123' });
    doctorToken = docRes.body.data.token;
    testDoctorId = docRes.body.data.user.doctorId;

    // 3. Primary patient login
    const patientRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@medicore.hospital', password: 'Patient@123' });
    patientToken = patientRes.body.data.token;
    testPatientId = patientRes.body.data.user.patientId;

    // 4. Secondary patient registration
    const p2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `clin.privacy.${Date.now()}@medicore.test`,
        password: 'Password@123',
        firstName: 'Secret',
        lastName: 'Patient',
        phone: '+1 555-333-2211',
        dateOfBirth: '1985-06-15',
        gender: 'FEMALE',
      });
    otherPatientToken = p2Res.body.data.token;
    otherPatientId = p2Res.body.data.user.patientId;

    // 5. Create an active confirmed appointment
    const date1 = '2026-12-22';
    await prisma.appointment.deleteMany({
      where: { doctorId: testDoctorId, appointmentDate: date1 },
    });
    const apptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: testDoctorId,
        appointmentDate: date1,
        timeSlot: '11:30',
        reasonForVisit: 'Hypertension and dizziness evaluation',
      });
    activeApptId = apptRes.body.data.id;

    // 6. Create a cancelled appointment to test rejection
    const appt2Res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: testDoctorId,
        appointmentDate: date1,
        timeSlot: '12:00',
        reasonForVisit: 'Cancelled follow up',
      });
    cancelledApptId = appt2Res.body.data.id;
    await request(app)
      .post(`/api/appointments/${cancelledApptId}/cancel`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ cancellationReason: 'Unable to attend' });
  });

  afterAll(async () => {
    const ids = [activeApptId, cancelledApptId].filter(Boolean);
    if (ids.length > 0) {
      await prisma.medicalRecord.deleteMany({
        where: { appointmentId: { in: ids } },
      });
      await prisma.appointment.deleteMany({
        where: { id: { in: ids } },
      });
    }
    await prisma.$disconnect();
  });

  describe('Consultation Documentation & Prescription Generation', () => {
    it('should reject unauthorized patient attempting to create clinical record with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: activeApptId,
          diagnosis: 'Self diagnosis',
          symptoms: 'Feeling sick',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject documenting consultation for a CANCELLED appointment with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          appointmentId: cancelledApptId,
          diagnosis: 'Essential Hypertension',
          symptoms: 'Headache',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('cancelled appointment');
    });

    it('should allow physician to document consultation and issue prescription (POST /api/medical-records)', async () => {
      const res = await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          appointmentId: activeApptId,
          diagnosis: 'Essential Stage 1 Hypertension',
          symptoms: 'Bilateral throbbing headache, dizziness upon standing',
          physicalExamination: 'BP: 145/92 mmHg, Heart Rate: 78 bpm, Regular S1/S2',
          treatmentPlan: 'Lifestyle modifications, low sodium diet, initiate ACE inhibitor',
          prescription: {
            notes: 'Monitor home blood pressure readings daily in morning and evening',
            items: [
              {
                medicineName: 'Lisinopril',
                dosage: '10 mg',
                frequency: 'Once daily in the morning',
                duration: '30 Days',
                instructions: 'Take with or without food. Report dry cough if persistent.',
              },
              {
                medicineName: 'Hydrochlorothiazide',
                dosage: '12.5 mg',
                frequency: 'Once daily',
                duration: '30 Days',
                instructions: 'Take in morning to prevent nocturia.',
              },
            ],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.record.diagnosis).toBe('Essential Stage 1 Hypertension');
      expect(res.body.data.prescription).toBeDefined();
      expect(res.body.data.prescription.items.length).toBe(2);

      createdRecordId = res.body.data.record.id;

      // Verify appointment is marked COMPLETED
      const apptCheck = await prisma.appointment.findUnique({ where: { id: activeApptId } });
      expect(apptCheck?.status).toBe('COMPLETED');
    });

    it('should reject duplicate consultation creation on the same appointment with HTTP 409', async () => {
      const res = await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          appointmentId: activeApptId,
          diagnosis: 'Duplicate entry',
          symptoms: 'Same symptoms',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already been documented');
    });
  });

  describe('Medical Record Access Control & Privacy', () => {
    it('should allow patient to retrieve their own medical records (GET /api/medical-records/mine)', async () => {
      const res = await request(app)
        .get('/api/medical-records/mine')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((r: any) => r.id === createdRecordId)).toBe(true);
    });

    it('should allow patient to inspect their own medical record detail (GET /api/medical-records/:id)', async () => {
      const res = await request(app)
        .get(`/api/medical-records/${createdRecordId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdRecordId);
      expect(res.body.data.prescription.items.length).toBe(2);
    });

    it('DATA PRIVACY VIOLATION TEST: should block another patient from accessing record with HTTP 403', async () => {
      const res = await request(app)
        .get(`/api/medical-records/${createdRecordId}`)
        .set('Authorization', `Bearer ${otherPatientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('should allow doctor to view clinical history for specific patient (GET /api/medical-records/patient/:id)', async () => {
      const res = await request(app)
        .get(`/api/medical-records/patient/${testPatientId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Prescriptions Retrieval', () => {
    it('should allow patient to view issued prescriptions (GET /api/prescriptions/mine)', async () => {
      const res = await request(app)
        .get('/api/prescriptions/mine')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].items.length).toBeGreaterThan(0);
    });

    it('should allow doctor to view issued prescriptions queue (GET /api/prescriptions/doctor)', async () => {
      const res = await request(app)
        .get('/api/prescriptions/doctor')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
