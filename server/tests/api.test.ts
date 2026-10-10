import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('MediCore Hospital Management API Suite', () => {
  let adminToken: string;
  let patientToken: string;
  let testDoctorId: string;
  let testPatientId: string;

  beforeAll(async () => {
    // 1. Login as Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@medicore.hospital',
        password: 'Admin@123',
      });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // 2. Login as Demo Patient
    const patientRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'patient@medicore.hospital',
        password: 'Patient@123',
      });
    expect(patientRes.status).toBe(200);
    patientToken = patientRes.body.data.token;
    testPatientId = patientRes.body.data.user.patientId;

    // 3. Obtain a Doctor ID
    const docsRes = await request(app).get('/api/doctors');
    expect(docsRes.status).toBe(200);
    testDoctorId = docsRes.body.data.doctors[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Health and Public Endpoints', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });

    it('should list departments', async () => {
      const res = await request(app).get('/api/departments');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should list doctors with pagination', async () => {
      const res = await request(app).get('/api/doctors?limit=5');
      expect(res.status).toBe(200);
      expect(res.body.data.doctors.length).toBeGreaterThan(0);
      expect(res.body.data.pagination.page).toBe(1);
    });
  });

  describe('2. Authentication & Authorization Boundaries', () => {
    it('should reject invalid login credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@medicore.hospital',
          password: 'WrongPassword123',
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated access to protected routes', async () => {
      const res = await request(app).get('/api/analytics/admin');
      expect(res.status).toBe(401);
    });

    it('should prevent patient from accessing admin audit logs (Least Privilege RBAC)', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(403);
    });

    it('should register a new patient successfully', async () => {
      const uniqueEmail = `test.patient.${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: 'Password@123',
          firstName: 'Jonathan',
          lastName: 'Doe',
          phone: '+1 555-019-2831',
          dateOfBirth: '1990-05-14',
          gender: 'MALE',
          bloodGroup: 'O+',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(uniqueEmail);

      // Attempt duplicate registration with same email
      const dupRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: 'Password@123',
          firstName: 'Jonathan',
          lastName: 'Doe',
          phone: '+1 555-019-2831',
          dateOfBirth: '1990-05-14',
          gender: 'MALE',
        });
      expect(dupRes.status).toBe(409);
    });
  });

  describe('3. Appointment Scheduling & Concurrency Conflict Prevention', () => {
    const testDate = '2026-11-20';
    const testSlot = '14:00';

    beforeAll(async () => {
      await prisma.appointment.deleteMany({
        where: {
          doctorId: testDoctorId,
          appointmentDate: testDate,
          timeSlot: testSlot,
        },
      });
    });

    it('should calculate doctor availability slots for target date', async () => {
      const res = await request(app).get(`/api/doctors/${testDoctorId}/availability?date=${testDate}`);
      expect(res.status).toBe(200);
      expect(res.body.data.hasClinicHours).toBe(true);
      expect(Array.isArray(res.body.data.slots)).toBe(true);
    });

    it('should successfully book an available time slot', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: testDoctorId,
          appointmentDate: testDate,
          timeSlot: testSlot,
          reasonForVisit: 'Severe migraine headaches with visual aura',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(res.body.data.appointmentNumber).toBeDefined();
    });

    it('CONCURRENCY TEST: should reject overlapping booking for the same doctor and slot with HTTP 409', async () => {
      // Attempting to book the EXACT SAME doctor, date, and time slot
      const conflictRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: testDoctorId,
          appointmentDate: testDate,
          timeSlot: testSlot,
          reasonForVisit: 'Conflicting concurrent booking attempt',
        });

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.success).toBe(false);
      expect(conflictRes.body.error).toContain('already booked');
    });
  });

  describe('4. Billing & Simulated Payment Processing', () => {
    let createdBillId: string;

    it('should allow admin to create an itemized invoice with automatic tax calculations', async () => {
      const res = await request(app)
        .post('/api/bills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          patientId: testPatientId,
          dueDate: '2026-11-30',
          taxPercent: 5,
          items: [
            { description: 'Neurological Consultation', quantity: 1, unitPrice: 150.0 },
            { description: 'Brain MRI Scan', quantity: 1, unitPrice: 400.0 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.subtotal).toBe(550.0);
      expect(res.body.data.tax).toBe(27.5);
      expect(res.body.data.totalAmount).toBe(577.5);
      expect(res.body.data.status).toBe('UNPAID');

      createdBillId = res.body.data.id;
    });

    it('should allow patient to pay invoice via simulated payment gateway and generate receipt', async () => {
      const res = await request(app)
        .post(`/api/bills/${createdBillId}/payments`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          amount: 577.5,
          paymentMethod: 'CREDIT_CARD',
          notes: 'Test VISA transaction',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.bill.status).toBe('PAID');
      expect(res.body.data.payment.transactionRef).toBeDefined();

      // Retrieve tax receipt
      const receiptRes = await request(app)
        .get(`/api/bills/${createdBillId}/receipt`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(receiptRes.status).toBe(200);
      expect(receiptRes.body.data.receiptNumber).toBeDefined();
    });
  });

  describe('5. Real Database Analytics Endpoints', () => {
    it('should return operational metrics backed by database aggregations', async () => {
      const res = await request(app)
        .get('/api/analytics/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summaryCards.doctors).toBeGreaterThan(0);
      expect(res.body.data.summaryCards.patients).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.recentAppointments)).toBe(true);
      expect(Array.isArray(res.body.data.notices)).toBe(true);
    });
  });
});
