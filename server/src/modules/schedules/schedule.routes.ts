import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { z } from 'zod';

export const scheduleRouter = Router();

const scheduleItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDuration: z.number().int().default(30),
  isActive: z.boolean().default(true),
});

const updateSchedulesSchema = z.object({
  doctorId: z.string().optional(),
  schedules: z.array(scheduleItemSchema),
});

// GET /api/doctor/schedules
scheduleRouter.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let targetDoctorId: string | undefined;

    if (req.user!.role === 'DOCTOR') {
      targetDoctorId = req.user!.doctorId;
    } else if (req.user!.role === 'ADMIN' && req.query.doctorId) {
      targetDoctorId = req.query.doctorId as string;
    }

    if (!targetDoctorId) {
      res.status(400).json({ success: false, error: 'Doctor ID is required.' });
      return;
    }

    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId: targetDoctorId },
      orderBy: { dayOfWeek: 'asc' },
    });

    res.json({ success: true, data: schedules });
  } catch (error) {
    next(error);
  }
});

// POST /api/doctor/schedules - Update weekly schedule
scheduleRouter.post('/', authenticate, requireRole(['DOCTOR', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updateSchedulesSchema.parse(req.body);
    let targetDoctorId = req.user!.role === 'DOCTOR' ? req.user!.doctorId : validated.doctorId;

    if (!targetDoctorId) {
      res.status(400).json({ success: false, error: 'Doctor ID must be specified.' });
      return;
    }

    // Atomic replacement of schedule entries
    const updated = await prisma.$transaction(async (tx) => {
      await tx.doctorSchedule.deleteMany({
        where: { doctorId: targetDoctorId },
      });

      return await tx.doctorSchedule.createMany({
        data: validated.schedules.map((s) => ({
          doctorId: targetDoctorId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: s.slotDuration,
          isActive: s.isActive,
        })),
      });
    });

    res.json({
      success: true,
      message: 'Doctor weekly schedules successfully updated.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});
