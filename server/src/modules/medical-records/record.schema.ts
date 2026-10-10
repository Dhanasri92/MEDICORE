import { z } from 'zod';

export const createMedicalRecordSchema = z.object({
  appointmentId: z.string().uuid('Valid appointment ID is required'),
  diagnosis: z.string().min(2, 'Diagnosis is required'),
  symptoms: z.string().min(2, 'Presenting symptoms are required'),
  physicalExamination: z.string().optional(),
  treatmentPlan: z.string().optional(),
  prescription: z.object({
    notes: z.string().optional(),
    items: z.array(z.object({
      medicineName: z.string().min(2, 'Medicine name is required'),
      dosage: z.string().min(1, 'Dosage is required (e.g. 500 mg)'),
      frequency: z.string().min(1, 'Frequency is required (e.g. 2x daily)'),
      duration: z.string().min(1, 'Duration is required (e.g. 7 days)'),
      instructions: z.string().optional(),
    })).min(1, 'At least one prescription item is required'),
  }).optional(),
});
