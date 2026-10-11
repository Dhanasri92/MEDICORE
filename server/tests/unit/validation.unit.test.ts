import { describe, it, expect } from 'vitest';
import {
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
  cancelAppointmentSchema,
} from '../../src/modules/appointments/appointment.schema.js';
import {
  createBillSchema,
  processPaymentSchema,
} from '../../src/modules/billing/billing.schema.js';
import {
  createMedicalRecordSchema,
} from '../../src/modules/medical-records/record.schema.js';
import {
  registerSchema,
  loginSchema,
} from '../../src/modules/auth/auth.schema.js';
import {
  createDoctorSchema,
} from '../../src/modules/doctors/doctor.schema.js';

describe('Unit Tests: Zod Input Validation & Error Handling', () => {
  describe('1. Appointment Schemas', () => {
    it('should validate valid bookAppointmentSchema data', () => {
      const validData = {
        doctorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        appointmentDate: '2026-11-25',
        timeSlot: '10:30',
        reasonForVisit: 'Severe chest discomfort and shortness of breath',
      };
      const result = bookAppointmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format in bookAppointmentSchema', () => {
      const invalidData = {
        doctorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        appointmentDate: '25-11-2026', // wrong format
        timeSlot: '10:30',
        reasonForVisit: 'General checkup',
      };
      const result = bookAppointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('YYYY-MM-DD');
      }
    });

    it('should reject invalid time format in bookAppointmentSchema', () => {
      const invalidData = {
        doctorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        appointmentDate: '2026-11-25',
        timeSlot: '10:30:00', // too long
        reasonForVisit: 'General checkup',
      };
      const result = bookAppointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('HH:MM');
      }
    });

    it('should reject reason for visit shorter than 3 characters', () => {
      const invalidData = {
        doctorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        appointmentDate: '2026-11-25',
        timeSlot: '10:30',
        reasonForVisit: 'ab', // < 3 chars
      };
      const result = bookAppointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 3 characters');
      }
    });

    it('should validate rescheduleAppointmentSchema with valid inputs', () => {
      const valid = {
        appointmentDate: '2026-11-28',
        timeSlot: '15:00',
        reason: 'Shift conflicts on prior date',
      };
      const result = rescheduleAppointmentSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate and reject invalid status in updateAppointmentStatusSchema', () => {
      expect(updateAppointmentStatusSchema.safeParse({ status: 'CONFIRMED' }).success).toBe(true);
      expect(updateAppointmentStatusSchema.safeParse({ status: 'COMPLETED' }).success).toBe(true);
      expect(updateAppointmentStatusSchema.safeParse({ status: 'CANCELLED' }).success).toBe(true);
      expect(updateAppointmentStatusSchema.safeParse({ status: 'NO_SHOW' }).success).toBe(true);
      expect(updateAppointmentStatusSchema.safeParse({ status: 'PENDING' }).success).toBe(true);

      const invalid = updateAppointmentStatusSchema.safeParse({ status: 'INVALID_STATUS' });
      expect(invalid.success).toBe(false);
    });
  });

  describe('2. Billing & Payment Schemas', () => {
    it('should validate valid createBillSchema data with default tax', () => {
      const valid = {
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        dueDate: '2026-12-01',
        items: [
          { description: 'Cardiology Consultation', quantity: 1, unitPrice: 150.0 },
          { description: 'ECG Test', quantity: 1, unitPrice: 80.0 },
        ],
      };
      const result = createBillSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taxPercent).toBe(5); // default
      }
    });

    it('should reject empty line items array in createBillSchema', () => {
      const invalid = {
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        dueDate: '2026-12-01',
        items: [],
      };
      const result = createBillSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject negative unit price in createBillSchema', () => {
      const invalid = {
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        dueDate: '2026-12-01',
        items: [{ description: 'Test Item', quantity: 1, unitPrice: -50.0 }],
      };
      const result = createBillSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should validate processPaymentSchema for valid methods', () => {
      const methods = ['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'CASH'];
      for (const method of methods) {
        const result = processPaymentSchema.safeParse({
          amount: 250.75,
          paymentMethod: method,
          notes: 'Test transaction',
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject zero or negative payment amount', () => {
      expect(processPaymentSchema.safeParse({ amount: 0, paymentMethod: 'CASH' }).success).toBe(false);
      expect(processPaymentSchema.safeParse({ amount: -10, paymentMethod: 'CASH' }).success).toBe(false);
    });

    it('should reject unsupported payment method', () => {
      const invalid = processPaymentSchema.safeParse({
        amount: 100,
        paymentMethod: 'BITCOIN',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('3. Clinical & Prescription Schemas', () => {
    it('should validate complete clinical record with itemized prescription', () => {
      const valid = {
        appointmentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        diagnosis: 'Acute Bronchitis',
        symptoms: 'Persistent cough, low fever, fatigue',
        physicalExamination: 'Chest wheezing bilaterally, Temp 38.1C',
        treatmentPlan: 'Antibiotic therapy, inhaler prn, rest',
        prescription: {
          notes: 'Complete full course',
          items: [
            {
              medicineName: 'Azithromycin',
              dosage: '500 mg',
              frequency: 'Once daily',
              duration: '5 Days',
              instructions: 'Take 1 hour before meal',
            },
          ],
        },
      };
      const result = createMedicalRecordSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject missing symptoms or diagnosis', () => {
      const missingDiagnosis = {
        appointmentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        diagnosis: '',
        symptoms: 'Headache',
      };
      expect(createMedicalRecordSchema.safeParse(missingDiagnosis).success).toBe(false);

      const missingSymptoms = {
        appointmentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        diagnosis: 'Migraine',
        symptoms: '',
      };
      expect(createMedicalRecordSchema.safeParse(missingSymptoms).success).toBe(false);
    });
  });

  describe('4. Authentication & Doctor Schemas', () => {
    it('should validate patient registration schema', () => {
      const validPatient = {
        email: 'patient.valid@medicore.hospital',
        password: 'Password@123',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+1 555-012-3456',
        dateOfBirth: '1995-04-12',
        gender: 'FEMALE',
        bloodGroup: 'B+',
      };
      const result = registerSchema.safeParse(validPatient);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email in registerSchema', () => {
      const invalid = {
        email: 'not-an-email',
        password: 'Password@123',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+1 555-012-3456',
        dateOfBirth: '1995-04-12',
        gender: 'FEMALE',
      };
      expect(registerSchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject short password in registerSchema', () => {
      const invalid = {
        email: 'test@example.com',
        password: '123', // < 6 chars
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+1 555-012-3456',
        dateOfBirth: '1995-04-12',
        gender: 'FEMALE',
      };
      expect(registerSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
