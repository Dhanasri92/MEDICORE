import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

export const prescriptionRouter = Router();

// GET /api/prescriptions/mine - Patient's prescriptions
prescriptionRouter.get('/mine', authenticate, requireRole(['PATIENT']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: req.user!.patientId },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
            department: true,
          },
        },
        items: true,
        medicalRecord: {
          select: { diagnosis: true, createdAt: true },
        },
      },
      orderBy: { prescribedDate: 'desc' },
    });

    res.json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
});

// GET /api/prescriptions/doctor - Doctor's issued prescriptions
prescriptionRouter.get('/doctor', authenticate, requireRole(['DOCTOR']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { doctorId: req.user!.doctorId },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        items: true,
        medicalRecord: {
          select: { diagnosis: true, createdAt: true },
        },
      },
      orderBy: { prescribedDate: 'desc' },
    });

    res.json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
});

// GET /api/prescriptions/:id - View single prescription
prescriptionRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        doctor: {
          include: { user: true, department: true },
        },
        patient: {
          include: { user: true },
        },
        items: true,
        medicalRecord: true,
      },
    });

    if (!prescription) {
      res.status(404).json({ success: false, error: 'Prescription not found.' });
      return;
    }

    if (req.user!.role === 'PATIENT' && prescription.patientId !== req.user!.patientId) {
      res.status(403).json({ success: false, error: 'Forbidden.' });
      return;
    }

    res.json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
});
