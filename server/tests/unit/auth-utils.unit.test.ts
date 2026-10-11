import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../../src/config/environment.js';

describe('Unit Tests: Authentication & Password Security Utilities', () => {
  it('should hash a password and successfully verify with bcrypt', async () => {
    const plain = 'SecurePassword@2026';
    const hash = await bcrypt.hash(plain, 10);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(plain);
    expect(hash.startsWith('$2')).toBe(true);

    const matches = await bcrypt.compare(plain, hash);
    expect(matches).toBe(true);

    const wrongMatch = await bcrypt.compare('WrongPassword', hash);
    expect(wrongMatch).toBe(false);
  });

  it('should generate distinct hashes for identical passwords due to salting', async () => {
    const password = 'IdenticalPassword123!';
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);

    expect(hash1).not.toBe(hash2);
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });

  it('should sign and verify valid JWT authentication tokens', () => {
    const payload = {
      userId: 'test-user-123',
      email: 'clinician@medicore.hospital',
      role: 'DOCTOR',
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '1h' });
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.exp).toBeDefined();
  });

  it('should reject verification with incorrect JWT secret key', () => {
    const payload = { userId: '123', email: 'test@example.com', role: 'PATIENT' };
    const token = jwt.sign(payload, 'wrong_secret_key');

    expect(() => {
      jwt.verify(token, ENV.JWT_SECRET);
    }).toThrow();
  });

  it('should reject malformed or expired JWT tokens', () => {
    expect(() => {
      jwt.verify('invalid.token.string', ENV.JWT_SECRET);
    }).toThrow();

    const expiredToken = jwt.sign(
      { userId: '123', role: 'ADMIN' },
      ENV.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    expect(() => {
      jwt.verify(expiredToken, ENV.JWT_SECRET);
    }).toThrow();
  });
});
