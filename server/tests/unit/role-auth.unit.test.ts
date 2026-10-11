import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../../src/middleware/role.middleware.js';

describe('Unit Tests: Role-Based Authorization Middleware (RBAC)', () => {
  it('should return 401 when req.user is undefined', () => {
    const middleware = requireRole(['ADMIN']);
    const req: any = {};
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('authentication required'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when user role is not in allowedRoles list', () => {
    const middleware = requireRole(['ADMIN']);
    const req: any = {
      user: { userId: 'p1', role: 'PATIENT' },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Forbidden'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() when user role matches allowedRoles', () => {
    const middleware = requireRole(['ADMIN', 'DOCTOR']);
    const req: any = {
      user: { userId: 'd1', role: 'DOCTOR' },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should support multiple roles in allowedRoles array', () => {
    const middleware = requireRole(['ADMIN', 'DOCTOR']);

    // Admin passes
    const nextAdmin = vi.fn();
    middleware({ user: { role: 'ADMIN' } } as any, {} as any, nextAdmin);
    expect(nextAdmin).toHaveBeenCalled();

    // Doctor passes
    const nextDoc = vi.fn();
    middleware({ user: { role: 'DOCTOR' } } as any, {} as any, nextDoc);
    expect(nextDoc).toHaveBeenCalled();

    // Patient fails
    const resPatient: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const nextPatient = vi.fn();
    middleware({ user: { role: 'PATIENT' } } as any, resPatient, nextPatient);
    expect(resPatient.status).toHaveBeenCalledWith(403);
    expect(nextPatient).not.toHaveBeenCalled();
  });
});
