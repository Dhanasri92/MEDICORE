import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { ENV } from '../../config/environment.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { createNotification } from '../notifications/notification.service.js';

export async function registerPatient(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    const error: any = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(data.password, saltRounds);

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        role: 'PATIENT',
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
    });

    const patient = await tx.patient.create({
      data: {
        userId: user.id,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        allergies: data.allergies,
      },
    });

    return { user, patient };
  });

  await logAuditEvent({
    userId: newUser.user.id,
    userRole: 'PATIENT',
    action: 'REGISTER_PATIENT',
    entity: 'User',
    entityId: newUser.user.id,
    details: `New patient registered: ${newUser.user.email}`,
  });

  await createNotification({
    userId: newUser.user.id,
    title: 'Welcome to MediCore',
    message: 'Your patient account has been successfully created. You can now browse doctors and schedule appointments.',
    type: 'SYSTEM',
    linkUrl: '/patient/dashboard',
  });

  const token = jwt.sign(
    {
      userId: newUser.user.id,
      email: newUser.user.email,
      role: newUser.user.role,
    },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: newUser.user.id,
      email: newUser.user.email,
      role: newUser.user.role,
      firstName: newUser.user.firstName,
      lastName: newUser.user.lastName,
      phone: newUser.user.phone,
      patientId: newUser.patient.id,
    },
  };
}

export async function loginUser(email: string, password: string, ipAddress?: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      patient: true,
      doctor: {
        include: { department: true },
      },
    },
  });

  if (!user) {
    const error: any = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error: any = new Error('Your account has been deactivated. Please contact hospital administration.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error: any = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

  await logAuditEvent({
    userId: user.id,
    userRole: user.role,
    action: 'LOGIN',
    entity: 'User',
    entityId: user.id,
    details: `User logged in from IP ${ipAddress || 'unknown'}`,
    ipAddress,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      patientId: user.patient?.id,
      doctorId: user.doctor?.id,
      doctor: user.doctor ? {
        id: user.doctor.id,
        specialization: user.doctor.specialization,
        department: user.doctor.department.name,
      } : undefined,
    },
  };
}

export async function getCurrentUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      patient: true,
      doctor: {
        include: { department: true },
      },
    },
  });

  if (!user) {
    const error: any = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatar: user.avatar,
    isActive: user.isActive,
    patientId: user.patient?.id,
    patient: user.patient,
    doctorId: user.doctor?.id,
    doctor: user.doctor,
  };
}
