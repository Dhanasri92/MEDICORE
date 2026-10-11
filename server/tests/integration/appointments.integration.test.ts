import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Integration Tests: Appointment Booking, Concurrency, Rescheduling & Lifecycle', () => {
  let adminToken: string;
  let patientToken: string;
  let otherPatientToken: string;
  let doctorToken: string;
  let testDoctorId: string;
  let testPatientId: string;

  const targetDate = '2026-12-15';
  const slot1 = '10:00';
  const slot2 = '10:30';
  const slot3 = '11:00';

  let createdApptId: string;

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

    // 3. Primary Patient Login
    const patientRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@medicore.hospital', password: 'Patient@123' });
    patientToken = patientRes.body.data.token;
    testPatientId = patientRes.body.data.user.patientId;

    // 4. Secondary Patient Registration
    const otherEmail = `appt.other.${Date.now()}@medicore.test`;
    const otherRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: otherEmail,
        password: 'Password@123',
        firstName: 'Sam',
        lastName: 'Rival',
        phone: '+1 555-888-9999',
        dateOfBirth: '1991-03-22',
        gender: 'OTHER',
      });
    otherPatientToken = otherRes.body.data.token;

    // 5. Doctor ID
    const docsRes = await request(app).get('/api/doctors?limit=1');
    testDoctorId = docsRes.body.data.doctors[0].id;

    // Ensure clean state for target date
    await prisma.appointment.deleteMany({
      where: {
        doctorId: testDoctorId,
        appointmentDate: targetDate,
      },
    });
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({
      where: {
        doctorId: testDoctorId,
        appointmentDate: targetDate,
      },
    });
    await prisma.$disconnect();
  });

  describe('Availability Querying', () => {
    it('should calculate availability slots for target date', async () => {
      const res = await request(app).get(`/api/doctors/${testDoctorId}/availability?date=${targetDate}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.slots)).toBe(true);
      expect(res.body.data.slots.length).toBeGreaterThan(0);
    });

    it('should reject availability request without valid date parameter', async () => {
      const res = await request(app).get(`/api/doctors/${testDoctorId}/availability`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Booking & Concurrency Conflict Prevention', () => {
    it('should book an available appointment slot (POST /api/appointments)', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: testDoctorId,
          appointmentDate: targetDate,
          timeSlot: slot1,
          reasonForVisit: 'Periodic asthma follow-up and spirometry review',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(res.body.data.appointmentNumber).toBeDefined();

      createdApptId = res.body.data.id;
    });

    it('should reject booking the already taken slot with HTTP 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${otherPatientToken}`)
        .send({
          doctorId: testDoctorId,
          appointmentDate: targetDate,
          timeSlot: slot1,
          reasonForVisit: 'Conflicting booking attempt on same slot',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already booked');
    });

    it('CONCURRENCY TEST: should handle simultaneous concurrent booking attempts safely', async () => {
      // Two simultaneous requests attempt to grab slot2 at the exact same millisecond
      const [attemptA, attemptB] = await Promise.all([
        request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            doctorId: testDoctorId,
            appointmentDate: targetDate,
            timeSlot: slot2,
            reasonForVisit: 'Concurrent Racer A',
          }),
        request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${otherPatientToken}`)
          .send({
            doctorId: testDoctorId,
            appointmentDate: targetDate,
            timeSlot: slot2,
            reasonForVisit: 'Concurrent Racer B',
          }),
      ]);

      const statuses = [attemptA.status, attemptB.status].sort();
      // Exactly ONE succeeds (201) and ONE is rejected (409)
      expect(statuses).toEqual([201, 409]);
    });
  });

  describe('Retrieving Appointments by Role', () => {
    it('should return appointments for patient (GET /api/appointments/mine)', async () => {
      const res = await request(app)
        .get('/api/appointments/mine')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((a: any) => a.id === createdApptId)).toBe(true);
    });

    it('should return appointments for doctor (GET /api/appointments/doctor)', async () => {
      const res = await request(app)
        .get('/api/appointments/doctor')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return all appointments for admin with pagination (GET /api/appointments/admin)', async () => {
      const res = await request(app)
        .get('/api/appointments/admin?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.appointments)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe('Rescheduling Appointments', () => {
    it('should successfully reschedule to an open slot (PATCH /api/appointments/:id/reschedule)', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${createdApptId}/reschedule`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentDate: targetDate,
          timeSlot: slot3,
          reason: 'Rescheduled due to doctor preference',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.timeSlot).toBe(slot3);
      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('should reject rescheduling into an already-booked slot with HTTP 409', async () => {
      // slot2 was booked during the concurrency test
      const res = await request(app)
        .patch(`/api/appointments/${createdApptId}/reschedule`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentDate: targetDate,
          timeSlot: slot2,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already booked');
    });
  });

  describe('Cancellation and State Enforcement', () => {
    it('should block unauthorized patient from cancelling another patient appointment (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/appointments/${createdApptId}/cancel`)
        .set('Authorization', `Bearer ${otherPatientToken}`)
        .send({ cancellationReason: 'Malicious attempt' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow owning patient to cancel their appointment (POST /api/appointments/:id/cancel)', async () => {
      const res = await request(app)
        .post(`/api/appointments/${createdApptId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ cancellationReason: 'Patient feeling better' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('should reject cancelling an already cancelled appointment with HTTP 400', async () => {
      const res = await request(app)
        .post(`/api/appointments/${createdApptId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ cancellationReason: 'Redundant cancel' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already been cancelled');
    });

    it('should reject rescheduling a cancelled appointment with HTTP 400', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${createdApptId}/reschedule`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentDate: targetDate,
          timeSlot: slot1,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Cancelled appointments cannot be rescheduled');
    });
  });
});
