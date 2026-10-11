import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Integration Tests: Authentication & Session Management', () => {
  const testEmail = `auth.test.${Date.now()}@medicore.test`;
  const testPassword = 'TestPassword@123';
  let patientToken: string;
  let patientCookie: string;

  afterAll(async () => {
    // Cleanup created test user
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  it('should successfully register a new patient (POST /api/auth/register)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'Alice',
        lastName: 'Walker',
        phone: '+1 555-987-6543',
        dateOfBirth: '1992-08-20',
        gender: 'FEMALE',
        bloodGroup: 'A+',
        address: '456 Medical Park Road',
        emergencyContactName: 'Bob Walker',
        emergencyContactPhone: '+1 555-987-6544',
        allergies: 'None reported',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.role).toBe('PATIENT');
    expect(res.body.data.user.patientId).toBeDefined();

    patientToken = res.body.data.token;
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    patientCookie = cookies[0];
  });

  it('should reject duplicate registration with identical email with HTTP 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'Duplicate',
        lastName: 'User',
        phone: '+1 555-000-0000',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('already exists');
  });

  it('should successfully login existing patient (POST /api/auth/login)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it('should reject login with incorrect password with HTTP 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'IncorrectPassword!99',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid email or password');
  });

  it('should reject login for non-existent email with HTTP 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody.registered@medicore.test',
        password: 'SomePassword123',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should retrieve current profile using Bearer token (GET /api/auth/me)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.firstName).toBe('Alice');
    expect(res.body.data.patient).toBeDefined();
  });

  it('should retrieve current profile using session cookie (GET /api/auth/me)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', patientCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('should reject unauthenticated request to /api/auth/me with HTTP 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should update patient profile information (PATCH /api/auth/profile)', async () => {
    const res = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        firstName: 'Alicia',
        lastName: 'Walker-Smith',
        phone: '+1 555-111-2222',
        address: '789 Updated Avenue',
        allergies: 'Penicillin',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.firstName).toBe('Alicia');
    expect(res.body.data.lastName).toBe('Walker-Smith');
    expect(res.body.data.patient.address).toBe('789 Updated Avenue');
    expect(res.body.data.patient.allergies).toBe('Penicillin');
  });

  it('should clear authentication cookie upon logout (POST /api/auth/logout)', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    // Cookie is expired/cleared
    expect(cookies[0]).toContain('medicore_token=;');
  });
});
