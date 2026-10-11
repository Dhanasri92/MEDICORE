import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Integration Tests: Hospital Billing, Simulated Gateway & Receipt Permissions', () => {
  let adminToken: string;
  let patientToken: string;
  let otherPatientToken: string;
  let testPatientId: string;
  let otherPatientId: string;

  let createdBillId: string;

  beforeAll(async () => {
    // 1. Admin login
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@medicore.hospital', password: 'Admin@123' });
    adminToken = adminRes.body.data.token;

    // 2. Primary patient login
    const p1Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@medicore.hospital', password: 'Patient@123' });
    patientToken = p1Res.body.data.token;
    testPatientId = p1Res.body.data.user.patientId;

    // 3. Secondary patient registration
    const p2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `bill.privacy.${Date.now()}@medicore.test`,
        password: 'Password@123',
        firstName: 'Billing',
        lastName: 'Privacy',
        phone: '+1 555-666-7777',
        dateOfBirth: '1987-04-19',
        gender: 'FEMALE',
      });
    otherPatientToken = p2Res.body.data.token;
    otherPatientId = p2Res.body.data.user.patientId;
  });

  afterAll(async () => {
    if (createdBillId) {
      await prisma.payment.deleteMany({ where: { billId: createdBillId } });
      await prisma.billItem.deleteMany({ where: { billId: createdBillId } });
      await prisma.bill.delete({ where: { id: createdBillId } });
    }
    await prisma.$disconnect();
  });

  describe('Invoice Generation & Access Boundaries', () => {
    it('should reject unauthorized patient attempting to create invoice with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/bills')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patientId: testPatientId,
          dueDate: '2026-12-31',
          items: [{ description: 'Test Fee', quantity: 1, unitPrice: 50.0 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to create an itemized invoice with automated 5% tax computation', async () => {
      const res = await request(app)
        .post('/api/bills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          patientId: testPatientId,
          dueDate: '2026-12-31',
          taxPercent: 5,
          items: [
            { description: 'Cardiology Specialist Encounter', quantity: 1, unitPrice: 200.0 },
            { description: 'Echocardiogram Diagnostic Imaging', quantity: 1, unitPrice: 300.0 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subtotal).toBe(500.0);
      expect(res.body.data.tax).toBe(25.0); // 500 * 0.05 = 25.0
      expect(res.body.data.totalAmount).toBe(525.0); // 500 + 25 = 525.0
      expect(res.body.data.status).toBe('UNPAID');
      expect(res.body.data.paidAmount).toBe(0);

      createdBillId = res.body.data.id;
    });

    it('should allow patient to retrieve their own invoices (GET /api/bills/mine)', async () => {
      const res = await request(app)
        .get('/api/bills/mine')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((b: any) => b.id === createdBillId)).toBe(true);
    });

    it('should allow patient to inspect their own invoice details (GET /api/bills/:id)', async () => {
      const res = await request(app)
        .get(`/api/bills/${createdBillId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdBillId);
      expect(res.body.data.items.length).toBe(2);
    });

    it('INVOICE PRIVACY TEST: should block other patient from accessing invoice with HTTP 403', async () => {
      const res = await request(app)
        .get(`/api/bills/${createdBillId}`)
        .set('Authorization', `Bearer ${otherPatientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Simulated Payment Processing & Duplicate Prevention', () => {
    it('should reject payment exceeding outstanding balance with HTTP 400', async () => {
      // Total is $525.00, attempting to pay $600.00
      const res = await request(app)
        .post(`/api/bills/${createdBillId}/payments`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          amount: 600.0,
          paymentMethod: 'CREDIT_CARD',
          notes: 'Excessive amount',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('exceeds outstanding balance');
    });

    it('should process partial payment and update status to PARTIALLY_PAID', async () => {
      const res = await request(app)
        .post(`/api/bills/${createdBillId}/payments`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          amount: 200.0,
          paymentMethod: 'UPI',
          notes: 'Partial payment installment 1',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bill.status).toBe('PARTIALLY_PAID');
      expect(res.body.data.bill.paidAmount).toBe(200.0);
    });

    it('should process remaining balance payment and update status to PAID', async () => {
      // Remaining balance: 525.0 - 200.0 = 325.0
      const res = await request(app)
        .post(`/api/bills/${createdBillId}/payments`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          amount: 325.0,
          paymentMethod: 'CREDIT_CARD',
          notes: 'Final installment payment',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bill.status).toBe('PAID');
      expect(res.body.data.bill.paidAmount).toBe(525.0);
    });

    it('DUPLICATE CHARGE PREVENTION: should reject payment on already settled bill with HTTP 400', async () => {
      const res = await request(app)
        .post(`/api/bills/${createdBillId}/payments`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          amount: 100.0,
          paymentMethod: 'CASH',
          notes: 'Erroneous duplicate charge attempt',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already been fully settled');
    });
  });

  describe('Official Tax Receipt Access', () => {
    it('should allow owning patient to retrieve verified tax receipt (GET /api/bills/:id/receipt)', async () => {
      const res = await request(app)
        .get(`/api/bills/${createdBillId}/receipt`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.receiptNumber).toBeDefined();
      expect(res.body.data.bill.status).toBe('PAID');
    });

    it('RECEIPT PRIVACY TEST: should reject unauthorized patient accessing tax receipt with HTTP 403', async () => {
      const res = await request(app)
        .get(`/api/bills/${createdBillId}/receipt`)
        .set('Authorization', `Bearer ${otherPatientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
