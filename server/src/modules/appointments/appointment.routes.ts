import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import * as appointmentService from './appointment.service.js';
import {
  bookAppointmentSchema,
  updateAppointmentStatusSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from './appointment.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { createNotification } from '../notifications/notification.service.js';

export const appointmentRouter = Router();

// POST /api/appointments - Concurrency-safe booking
appointmentRouter.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = bookAppointmentSchema.parse(req.body);
    let targetPatientId: string;

    if (req.user!.role === 'PATIENT') {
      targetPatientId = req.user!.patientId!;
    } else if (req.user!.role === 'ADMIN' && validated.patientId) {
      targetPatientId = validated.patientId;
    } else {
      res.status(400).json({ success: false, error: 'Patient ID is required.' });
      return;
    }

    const appointment = await appointmentService.bookAppointment({
      patientId: targetPatientId,
      doctorId: validated.doctorId,
      appointmentDate: validated.appointmentDate,
      timeSlot: validated.timeSlot,
      reasonForVisit: validated.reasonForVisit,
      actorUserId: req.user!.userId,
      actorRole: req.user!.role,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/appointments/mine - Patient's own appointments
appointmentRouter.get('/mine', authenticate, requireRole(['PATIENT']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId: req.user!.patientId },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true, email: true } },
            department: true,
          },
        },
        medicalRecord: {
          include: {
            prescription: { include: { items: true } },
          },
        },
      },
      orderBy: [{ appointmentDate: 'desc' }, { timeSlot: 'desc' }],
    });

    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
});

// GET /api/doctor/appointments - Doctor's appointments queue
appointmentRouter.get('/doctor', authenticate, requireRole(['DOCTOR']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, status } = req.query;
    const where: any = { doctorId: req.user!.doctorId };

    if (date) {
      where.appointmentDate = date as string;
    }
    if (status) {
      where.status = status as string;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true, email: true, phone: true } },
          },
        },
        medicalRecord: {
          include: { prescription: { include: { items: true } } },
        },
      },
      orderBy: [{ appointmentDate: 'asc' }, { timeSlot: 'asc' }],
    });

    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/appointments - Admin full view
appointmentRouter.get('/admin', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const { status, date, doctorId } = req.query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status as string;
    if (date) where.appointmentDate = date as string;
    if (doctorId) where.doctorId = doctorId as string;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: {
            include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
          },
          doctor: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              department: true,
            },
          },
          medicalRecord: true,
        },
        orderBy: [{ appointmentDate: 'desc' }, { timeSlot: 'desc' }],
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        appointments,
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

// GET /api/appointments/:id
appointmentRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, department: true } },
        medicalRecord: {
          include: {
            prescription: { include: { items: true } },
          },
        },
      },
    });

    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found.' });
      return;
    }

    // Role-based access check
    if (req.user!.role === 'PATIENT' && appointment.patientId !== req.user!.patientId) {
      res.status(403).json({ success: false, error: 'Forbidden.' });
      return;
    }
    if (req.user!.role === 'DOCTOR' && appointment.doctorId !== req.user!.doctorId) {
      res.status(403).json({ success: false, error: 'Forbidden.' });
      return;
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/appointments/:id/status
appointmentRouter.patch('/:id/status', authenticate, requireRole(['DOCTOR', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validated = updateAppointmentStatusSchema.parse(req.body);
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found.' });
      return;
    }

    if (req.user!.role === 'DOCTOR' && appointment.doctorId !== req.user!.doctorId) {
      res.status(403).json({ success: false, error: 'Forbidden.' });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: validated.status,
        cancellationReason: validated.cancellationReason,
      },
    });

    await logAuditEvent({
      userId: req.user!.userId,
      userRole: req.user!.role,
      action: 'UPDATE_APPOINTMENT_STATUS',
      entity: 'Appointment',
      entityId: appointment.id,
      details: `Status changed to ${validated.status}`,
    });

    await createNotification({
      userId: appointment.patient.userId,
      title: 'Appointment Status Updated',
      message: `Your appointment with Dr. ${appointment.doctor.user.lastName} is now marked as ${validated.status}.`,
      type: 'APPOINTMENT',
      linkUrl: '/patient/appointments',
    });

    res.json({ success: true, message: 'Status updated.', data: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/appointments/:id/cancel
appointmentRouter.post('/:id/cancel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validated = cancelAppointmentSchema.parse(req.body);
    const result = await appointmentService.cancelAppointment({
      appointmentId: id,
      cancellationReason: validated.cancellationReason,
      actorUserId: req.user!.userId,
      actorRole: req.user!.role,
      actorPatientId: req.user!.patientId,
      actorDoctorId: req.user!.doctorId,
    });

    res.json({ success: true, message: 'Appointment cancelled.', data: result });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/appointments/:id/reschedule
appointmentRouter.patch('/:id/reschedule', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const validated = rescheduleAppointmentSchema.parse(req.body);
    const result = await appointmentService.rescheduleAppointment({
      appointmentId: id,
      newDate: validated.appointmentDate,
      newSlot: validated.timeSlot,
      reason: validated.reason,
      actorUserId: req.user!.userId,
      actorRole: req.user!.role,
      actorPatientId: req.user!.patientId,
      actorDoctorId: req.user!.doctorId,
    });

    res.json({ success: true, message: 'Appointment rescheduled successfully.', data: result });
  } catch (error) {
    next(error);
  }
});

