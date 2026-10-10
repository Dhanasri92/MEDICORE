import { z } from 'zod';

export const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid('Valid doctor ID is required'),
  patientId: z.string().uuid('Valid patient ID is required').optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, 'Time slot must be in HH:MM format'),
  reasonForVisit: z.string().min(3, 'Reason for visit must be at least 3 characters'),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  cancellationReason: z.string().optional(),
});

export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().optional(),
});
