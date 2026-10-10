import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import * as recordService from './record.service.js';
import { createMedicalRecordSchema } from './record.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

export const medicalRecordRouter = Router();

// POST /api/medical-records - Document consultation & prescription
medicalRecordRouter.post('/', authenticate, requireRole(['DOCTOR', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createMedicalRecordSchema.parse(req.body);
    let targetDoctorId = req.user!.role === 'DOCTOR' ? req.user!.doctorId! : '';

    if (!targetDoctorId) {
      // Find doctor from appointment
      const appt = await prisma.appointment.findUnique({
        where: { id: validated.appointmentId },
      });
      targetDoctorId = appt?.doctorId || '';
    }

    const result = await recordService.createMedicalRecordWithPrescription({
      appointmentId: validated.appointmentId,
      diagnosis: validated.diagnosis,
      symptoms: validated.symptoms,
      physicalExamination: validated.physicalExamination,
      treatmentPlan: validated.treatmentPlan,
      prescription: validated.prescription,
      doctorId: targetDoctorId,
      actorUserId: req.user!.userId,
      actorRole: req.user!.role,
    });

    res.status(201).json({
      success: true,
      message: 'Consultation documented and prescription issued successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/medical-records/mine - Patient's own records
medicalRecordRouter.get('/mine', authenticate, requireRole(['PATIENT']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await prisma.medicalRecord.findMany({
      where: { patientId: req.user!.patientId },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
            department: true,
          },
        },
        appointment: true,
        prescription: {
          include: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
});

// GET /api/medical-records/patient/:patientId - Doctor/Admin clinical review
medicalRecordRouter.get('/patient/:patientId', authenticate, requireRole(['DOCTOR', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.patientId as string;
    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            department: true,
          },
        },
        appointment: true,
        prescription: {
          include: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
});

// GET /api/medical-records/:id
medicalRecordRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        doctor: {
          include: { user: true, department: true },
        },
        patient: {
          include: { user: true },
        },
        appointment: true,
        prescription: {
          include: { items: true },
        },
      },
    });

    if (!record) {
      res.status(404).json({ success: false, error: 'Medical record not found.' });
      return;
    }

    if (req.user!.role === 'PATIENT' && record.patientId !== req.user!.patientId) {
      res.status(403).json({ success: false, error: 'Forbidden.' });
      return;
    }

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
});
