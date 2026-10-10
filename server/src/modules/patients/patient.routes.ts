import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

export const patientRouter = Router();

// GET /api/patients - Search and list patients for authorized staff (DOCTOR, ADMIN)
patientRouter.get('/', authenticate, requireRole(['ADMIN', 'DOCTOR']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      const q = search.toLowerCase();
      where.OR = [
        { user: { firstName: { contains: q } } },
        { user: { lastName: { contains: q } } },
        { user: { email: { contains: q } } },
        { user: { phone: { contains: q } } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              appointments: true,
              medicalRecords: true,
              prescriptions: true,
              bills: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/patients/:id - View patient clinical profile
patientRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.id as string;

    // Check ownership if role is PATIENT
    if (req.user!.role === 'PATIENT' && req.user!.patientId !== patientId) {
      res.status(403).json({ success: false, error: 'Forbidden: You can only access your own profile.' });
      return;
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            createdAt: true,
          },
        },
        medicalRecords: {
          include: {
            doctor: {
              include: { user: true, department: true },
            },
            prescription: {
              include: { items: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        prescriptions: {
          include: {
            doctor: { include: { user: true } },
            items: true,
          },
          orderBy: { prescribedDate: 'desc' },
        },
        labReports: {
          orderBy: { testDate: 'desc' },
        },
      },
    });

    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found.' });
      return;
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
});
