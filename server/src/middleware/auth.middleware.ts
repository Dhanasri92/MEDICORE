import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/environment.js';
import { prisma } from '../config/database.js';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: string;
  patientId?: string;
  doctorId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.medicore_token) {
      token = req.cookies.medicore_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. No session token provided.',
      });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        patient: { select: { id: true } },
        doctor: { select: { id: true } },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Session invalid or user account deactivated.',
      });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      patientId: user.patient?.id,
      doctorId: user.doctor?.id,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.',
    });
  }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.medicore_token) {
      token = req.cookies.medicore_token;
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        patient: { select: { id: true } },
        doctor: { select: { id: true } },
      },
    }).then(user => {
      if (user && user.isActive) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role,
          patientId: user.patient?.id,
          doctorId: user.doctor?.id,
        };
      }
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}
