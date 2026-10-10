import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { createNotification } from '../notifications/notification.service.js';

export async function bookAppointment(params: {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  timeSlot: string;
  reasonForVisit: string;
  actorUserId: string;
  actorRole: string;
}) {
  // Check doctor exists and is active
  const doctor = await prisma.doctor.findUnique({
    where: { id: params.doctorId },
    include: { user: true },
  });

  if (!doctor || !doctor.user.isActive) {
    const error: any = new Error('Selected physician is not active or available.');
    error.statusCode = 404;
    throw error;
  }

  // Check patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: params.patientId },
    include: { user: true },
  });

  if (!patient || !patient.user.isActive) {
    const error: any = new Error('Patient profile not found or inactive.');
    error.statusCode = 404;
    throw error;
  }

  // Execute concurrency-safe booking within atomic transaction
  const appointment = await prisma.$transaction(async (tx) => {
    // 1. Conflict Check: Look for conflicting booking for this doctor, date, and slot
    const existingConflict = await tx.appointment.findFirst({
      where: {
        doctorId: params.doctorId,
        appointmentDate: params.appointmentDate,
        timeSlot: params.timeSlot,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });

    if (existingConflict) {
      const error: any = new Error(
        `This time slot (${params.timeSlot}) on ${params.appointmentDate} is already booked. Please choose an alternate slot.`
      );
      error.statusCode = 409;
      throw error;
    }

    // 2. Generate unique human-readable token
    const tokenSuffix = crypto.randomInt(1000, 9999);
    const appointmentNumber = `APT-${params.appointmentDate.replace(/-/g, '')}-${tokenSuffix}`;

    // 3. Create appointment record
    const created = await tx.appointment.create({
      data: {
        appointmentNumber,
        patientId: params.patientId,
        doctorId: params.doctorId,
        appointmentDate: params.appointmentDate,
        timeSlot: params.timeSlot,
        status: 'CONFIRMED',
        reasonForVisit: params.reasonForVisit,
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, department: true } },
      },
    });

    return created;
  });

  // Audit log
  await logAuditEvent({
    userId: params.actorUserId,
    userRole: params.actorRole,
    action: 'BOOK_APPOINTMENT',
    entity: 'Appointment',
    entityId: appointment.id,
    details: `Appointment booked: ${appointment.appointmentNumber} with Dr. ${doctor.user.lastName} on ${params.appointmentDate} at ${params.timeSlot}`,
  });

  // Notification for Doctor
  await createNotification({
    userId: doctor.userId,
    title: 'New Appointment Scheduled',
    message: `Patient ${patient.user.firstName} ${patient.user.lastName} scheduled an appointment on ${params.appointmentDate} at ${params.timeSlot}.`,
    type: 'APPOINTMENT',
    linkUrl: '/doctor/appointments',
  });

  // Notification for Patient
  await createNotification({
    userId: patient.userId,
    title: 'Appointment Confirmed',
    message: `Your appointment with Dr. ${doctor.user.firstName} ${doctor.user.lastName} is confirmed for ${params.appointmentDate} at ${params.timeSlot}.`,
    type: 'APPOINTMENT',
    linkUrl: '/patient/appointments',
  });

  return appointment;
}

export async function cancelAppointment(params: {
  appointmentId: string;
  cancellationReason?: string;
  actorUserId: string;
  actorRole: string;
  actorPatientId?: string;
  actorDoctorId?: string;
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

  // Security check: Only owning patient, assigned doctor, or admin can cancel
  if (params.actorRole === 'PATIENT' && appointment.patientId !== params.actorPatientId) {
    const error: any = new Error('Forbidden: You can only cancel your own appointments.');
    error.statusCode = 403;
    throw error;
  }

  if (params.actorRole === 'DOCTOR' && appointment.doctorId !== params.actorDoctorId) {
    const error: any = new Error('Forbidden: You can only manage appointments assigned to you.');
    error.statusCode = 403;
    throw error;
  }

  if (appointment.status === 'CANCELLED') {
    const error: any = new Error('This appointment has already been cancelled.');
    error.statusCode = 400;
    throw error;
  }

  if (appointment.status === 'COMPLETED') {
    const error: any = new Error('Completed appointments cannot be cancelled.');
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.appointment.update({
    where: { id: params.appointmentId },
    data: {
      status: 'CANCELLED',
      cancellationReason: params.cancellationReason || 'Cancelled by user request',
    },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
    },
  });

  await logAuditEvent({
    userId: params.actorUserId,
    userRole: params.actorRole,
    action: 'CANCEL_APPOINTMENT',
    entity: 'Appointment',
    entityId: appointment.id,
    details: `Appointment cancelled: ${appointment.appointmentNumber}. Reason: ${params.cancellationReason || 'N/A'}`,
  });

  // Notify opposite party
  if (params.actorRole === 'PATIENT') {
    await createNotification({
      userId: appointment.doctor.userId,
      title: 'Appointment Cancelled by Patient',
      message: `Appointment ${appointment.appointmentNumber} on ${appointment.appointmentDate} was cancelled by ${appointment.patient.user.firstName} ${appointment.patient.user.lastName}.`,
      type: 'APPOINTMENT',
      linkUrl: '/doctor/appointments',
    });
  } else {
    await createNotification({
      userId: appointment.patient.userId,
      title: 'Appointment Cancelled',
      message: `Your appointment ${appointment.appointmentNumber} on ${appointment.appointmentDate} has been cancelled.`,
      type: 'APPOINTMENT',
      linkUrl: '/patient/appointments',
    });
  }

  return updated;
}
