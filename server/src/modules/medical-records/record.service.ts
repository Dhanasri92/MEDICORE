import { prisma } from '../../config/database.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { createNotification } from '../notifications/notification.service.js';

export async function createMedicalRecordWithPrescription(params: {
  appointmentId: string;
  diagnosis: string;
  symptoms: string;
  physicalExamination?: string;
  treatmentPlan?: string;
  prescription?: {
    notes?: string;
    items: Array<{
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
  };
  doctorId: string;
  actorUserId: string;
  actorRole: string;
}) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: params.appointmentId },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
    },
  });

  if (!appointment) {
    const error: any = new Error('Appointment not found.');
    error.statusCode = 404;
    throw error;
  }

  // Doctor authorization
  if (params.actorRole === 'DOCTOR' && appointment.doctorId !== params.doctorId) {
    const error: any = new Error('Forbidden: You can only record consultations for appointments assigned to you.');
    error.statusCode = 403;
    throw error;
  }

  // Check if medical record already exists
  const existingRecord = await prisma.medicalRecord.findUnique({
    where: { appointmentId: params.appointmentId },
  });

  if (existingRecord) {
    const error: any = new Error('A clinical record has already been documented for this visit.');
    error.statusCode = 409;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create medical record
    const record = await tx.medicalRecord.create({
      data: {
        appointmentId: params.appointmentId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        diagnosis: params.diagnosis,
        symptoms: params.symptoms,
        physicalExamination: params.physicalExamination,
        treatmentPlan: params.treatmentPlan,
      },
    });

    // 2. If prescription provided, create prescription header and line items
    let createdPrescription = null;
    if (params.prescription && params.prescription.items.length > 0) {
      createdPrescription = await tx.prescription.create({
        data: {
          recordId: record.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          notes: params.prescription.notes,
          status: 'ACTIVE',
          items: {
            create: params.prescription.items.map((item) => ({
              medicineName: item.medicineName,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions,
            })),
          },
        },
        include: { items: true },
      });
    }

    // 3. Mark appointment as completed
    await tx.appointment.update({
      where: { id: params.appointmentId },
      data: { status: 'COMPLETED' },
    });

    return { record, prescription: createdPrescription };
  });

  // Audit log
  await logAuditEvent({
    userId: params.actorUserId,
    userRole: params.actorRole,
    action: 'RECORD_CONSULTATION',
    entity: 'MedicalRecord',
    entityId: result.record.id,
    details: `Consultation documented for patient ${appointment.patient.user.lastName}. Diagnosis: ${params.diagnosis}`,
  });

  // Notification for patient
  await createNotification({
    userId: appointment.patient.userId,
    title: 'Consultation Summary Available',
    message: `Dr. ${appointment.doctor.user.lastName} has documented your visit and issued clinical notes${result.prescription ? ' and a prescription' : ''}.`,
    type: result.prescription ? 'PRESCRIPTION' : 'APPOINTMENT',
    linkUrl: result.prescription ? '/patient/prescriptions' : '/patient/medical-records',
  });

  return result;
}
