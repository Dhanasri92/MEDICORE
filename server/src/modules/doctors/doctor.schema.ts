import { z } from 'zod';

export const createDoctorSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().min(7, 'Phone number is required'),
  departmentId: z.string().uuid('Valid department ID is required'),
  specialization: z.string().min(2, 'Specialization is required'),
  qualification: z.string().min(2, 'Qualification is required'),
  experienceYears: z.number().int().min(0).default(0),
  consultationFee: z.number().min(0, 'Consultation fee must be non-negative'),
  biography: z.string().optional(),
  roomNumber: z.string().optional(),
  avatar: z.string().optional(),
  schedules: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    slotDuration: z.number().int().default(30),
  })).optional(),
});

export const updateDoctorSchema = z.object({
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  experienceYears: z.number().int().optional(),
  consultationFee: z.number().optional(),
  biography: z.string().optional(),
  roomNumber: z.string().optional(),
  isAvailable: z.boolean().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});
