import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { ENV } from '../../src/config/environment.js';

describe('Integration Tests: Laboratory Reports, File Uploads & Secure Streaming', () => {
  let adminToken: string;
  let doctorToken: string;
  let patientToken: string;
  let otherPatientToken: string;
  let testPatientId: string;
  let otherPatientId: string;

  let createdReportId: string;
  let sampleFilePath: string;

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
        email: `lab.privacy.${Date.now()}@medicore.test`,
        password: 'Password@123',
        firstName: 'LabPrivacy',
        lastName: 'Patient',
        phone: '+1 555-222-3333',
        dateOfBirth: '1993-02-14',
        gender: 'MALE',
      });
    otherPatientToken = p2Res.body.data.token;
    otherPatientId = p2Res.body.data.user.patientId;

    // 5. Create a temporary dummy PDF file for upload testing
    if (!fs.existsSync(ENV.UPLOAD_DIR)) {
      fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true });
    }
    sampleFilePath = path.join(ENV.UPLOAD_DIR, 'test_specimen.pdf');
    fs.writeFileSync(sampleFilePath, '%PDF-1.4 Mock Clinical Specimen Pathology Report');
  });

  afterAll(async () => {
    if (sampleFilePath && fs.existsSync(sampleFilePath)) {
      fs.unlinkSync(sampleFilePath);
    }
    if (createdReportId) {
      const rep = await prisma.labReport.findUnique({ where: { id: createdReportId } });
      if (rep && rep.filePath) {
        const p = path.join(ENV.UPLOAD_DIR, rep.filePath);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
      await prisma.labReport.delete({ where: { id: createdReportId } });
    }
    await prisma.$disconnect();
  });

  describe('Report Upload & Validation', () => {
    it('should reject lab upload with missing patientId, testName, or category', async () => {
      const res = await request(app)
        .post('/api/lab-reports')
        .set('Authorization', `Bearer ${doctorToken}`)
        .field('summary', 'Missing test name');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject lab upload with unsupported file type (e.g. .txt)', async () => {
      const txtPath = path.join(ENV.UPLOAD_DIR, 'unsupported.txt');
      fs.writeFileSync(txtPath, 'text content');

      const res = await request(app)
        .post('/api/lab-reports')
        .set('Authorization', `Bearer ${doctorToken}`)
        .field('patientId', testPatientId)
        .field('testName', 'Invalid Extension Test')
        .field('category', 'Hematology')
        .attach('reportFile', txtPath);

      if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Only PDF, PNG, and JPEG formats are permitted');
    });

    it('should allow clinician/admin to upload valid laboratory report with PDF attachment', async () => {
      const res = await request(app)
        .post('/api/lab-reports')
        .set('Authorization', `Bearer ${doctorToken}`)
        .field('patientId', testPatientId)
        .field('testName', 'Comprehensive Metabolic Panel (CMP)')
        .field('category', 'Biochemistry')
        .field('testDate', '2026-11-20')
        .field('summary', 'Glucose 95 mg/dL, BUN 14 mg/dL, Creatinine 0.9 mg/dL. All parameters normal.')
        .attach('reportFile', sampleFilePath);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.testName).toBe('Comprehensive Metabolic Panel (CMP)');
      expect(res.body.data.filePath).toBeDefined();

      createdReportId = res.body.data.id;
    });
  });

  describe('Report Listing & Metadata Retrieval', () => {
    it('should allow admin to list all hospital lab reports with pagination (GET /api/lab-reports)', async () => {
      const res = await request(app)
        .get('/api/lab-reports?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.reports)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should allow patient to retrieve their own lab reports (GET /api/lab-reports/mine)', async () => {
      const res = await request(app)
        .get('/api/lab-reports/mine')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((r: any) => r.id === createdReportId)).toBe(true);
    });

    it('should allow patient to view metadata of their own report (GET /api/lab-reports/:id)', async () => {
      const res = await request(app)
        .get(`/api/lab-reports/${createdReportId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdReportId);
      expect(res.body.data.summary).toContain('Glucose 95 mg/dL');
    });

    it('should reject access to non-existent lab report with HTTP 404', async () => {
      const res = await request(app)
        .get('/api/lab-reports/invalid-uuid-1234')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Secure File Streaming & Access Authorization', () => {
    it('should allow owning patient to securely stream report file (GET /api/lab-reports/:id/file)', async () => {
      const res = await request(app)
        .get(`/api/lab-reports/${createdReportId}/file`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('inline');
    });

    it('should allow stream download via query token parameter', async () => {
      const res = await request(app)
        .get(`/api/lab-reports/${createdReportId}/file?token=${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });

    it('should reject unauthenticated public access without session token (HTTP 401)', async () => {
      const res = await request(app).get(`/api/lab-reports/${createdReportId}/file`);
      expect(res.status).toBe(401);
    });

    it('SECURITY LEAK TEST: should forbid unauthorized patient from accessing another patient file (HTTP 403)', async () => {
      const res = await request(app)
        .get(`/api/lab-reports/${createdReportId}/file`)
        .set('Authorization', `Bearer ${otherPatientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });
  });
});
