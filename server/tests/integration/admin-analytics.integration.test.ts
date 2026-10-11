import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Integration Tests: Analytics, Notifications, Hospital Notices & Audit Trail', () => {
  let adminToken: string;
  let doctorToken: string;
  let patientToken: string;
  let patientUserId: string;

  let createdNoticeId: string;
  let notificationId: string;

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

    // 3. Patient login
    const patientRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@medicore.hospital', password: 'Patient@123' });
    patientToken = patientRes.body.data.token;
    patientUserId = patientRes.body.data.user.id;

    // Seed test notification for patient
    const notif = await prisma.notification.create({
      data: {
        userId: patientUserId,
        title: 'Diagnostic Test Reminder',
        message: 'Please fast for 8 hours prior to lipid panel blood draw.',
        type: 'APPOINTMENT',
        isRead: false,
      },
    });
    notificationId = notif.id;
  });

  afterAll(async () => {
    if (createdNoticeId) {
      await prisma.hospitalNotice.deleteMany({ where: { id: createdNoticeId } });
    }
    if (notificationId) {
      await prisma.notification.deleteMany({ where: { id: notificationId } });
    }
    await prisma.$disconnect();
  });

  describe('Database-Backed Operational Analytics', () => {
    it('should calculate live admin metrics based on active database entities (GET /api/analytics/admin)', async () => {
      const res = await request(app)
        .get('/api/analytics/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const summary = res.body.data.summaryCards;
      expect(typeof summary.doctors).toBe('number');
      expect(summary.doctors).toBeGreaterThan(0);
      expect(typeof summary.patients).toBe('number');
      expect(summary.patients).toBeGreaterThan(0);
      expect(typeof summary.totalRevenue).toBe('number');

      expect(Array.isArray(res.body.data.recentAppointments)).toBe(true);
      expect(Array.isArray(res.body.data.doctorsList)).toBe(true);
      expect(Array.isArray(res.body.data.successStats)).toBe(true);
    });

    it('should return doctor-specific clinical metrics and today queue (GET /api/analytics/doctor)', async () => {
      const res = await request(app)
        .get('/api/analytics/doctor')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.todayAppointments).toBeDefined();
      expect(Array.isArray(res.body.data.todayQueue)).toBe(true);
    });

    it('should return patient personal health metrics (GET /api/analytics/patient)', async () => {
      const res = await request(app)
        .get('/api/analytics/patient')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.upcomingAppointments).toBeDefined();
      expect(res.body.data.outstandingBalance).toBeDefined();
    });
  });

  describe('Notification Center', () => {
    it('should retrieve patient notifications and unread counter (GET /api/notifications)', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
    });

    it('should mark single notification as read (PATCH /api/notifications/:id/read)', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await prisma.notification.findUnique({ where: { id: notificationId } });
      expect(check?.isRead).toBe(true);
    });

    it('should mark all notifications as read (POST /api/notifications/read-all)', async () => {
      const res = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const unreadCount = await prisma.notification.count({
        where: { userId: patientUserId, isRead: false },
      });
      expect(unreadCount).toBe(0);
    });
  });

  describe('Hospital Notices & Bulletin Board', () => {
    it('should retrieve active hospital notices publicly (GET /api/notices)', async () => {
      const res = await request(app).get('/api/notices');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should allow admin to publish hospital notice (POST /api/notices)', async () => {
      const res = await request(app)
        .post('/api/notices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'HVAC Air Purification Filter Upgrade',
          content: 'Scheduled maintenance for air handler filters on Wing B from 02:00 to 05:00.',
          type: 'MAINTENANCE',
          reporter: 'Facilities Engineering',
          priority: 'NORMAL',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain('HVAC Air Purification');

      createdNoticeId = res.body.data.id;
    });

    it('should allow admin to dismiss hospital notice (DELETE /api/notices/:id)', async () => {
      const res = await request(app)
        .delete(`/api/notices/${createdNoticeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const notice = await prisma.hospitalNotice.findUnique({ where: { id: createdNoticeId } });
      expect(notice?.isActive).toBe(false);
    });
  });

  describe('Audit Logging & HIPAA Compliance Trail', () => {
    it('should allow admin to query audit trail (GET /api/admin/audit-logs)', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.logs.length).toBeGreaterThan(0);
    });

    it('AUDIT PRIVACY: should deny non-admin users from viewing audit logs with HTTP 403', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
