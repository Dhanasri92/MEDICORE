import { z } from 'zod';

export const createBillSchema = z.object({
  patientId: z.string().uuid('Valid patient ID is required'),
  appointmentId: z.string().uuid().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
  items: z.array(z.object({
    description: z.string().min(2, 'Description is required'),
    quantity: z.number().int().min(1).default(1),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  })).min(1, 'At least one line item is required'),
  taxPercent: z.number().min(0).max(100).default(5),
});

export const processPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'CASH']),
  notes: z.string().optional(),
});
