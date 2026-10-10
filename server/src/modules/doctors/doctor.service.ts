import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { logAuditEvent } from '../audit/audit.service.js';

export async function listDoctors(params: {
  departmentId?: string;
  search?: string;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    user: { isActive: true },
  };

  if (params.departmentId) {
    where.departmentId = params.departmentId;
  }

  if (typeof params.isAvailable === 'boolean') {
    where.isAvailable = params.isAvailable;
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    where.OR = [
      { specialization: { contains: q } },
      { user: { firstName: { contains: q } } },
      { user: { lastName: { contains: q } } },
      { department: { name: { contains: q } } },
    ];
  }

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
          },
        },
        department: true,
        schedules: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.doctor.count({ where }),
  ]);

  return {
    doctors,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDoctorById(id: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          isActive: true,
        },
      },
      department: true,
      schedules: {
        where: { isActive: true },
        orderBy: { dayOfWeek: 'asc' },
      },
    },
  });

  if (!doctor) {
    const error: any = new Error('Doctor profile not found.');
    error.statusCode = 404;
    throw error;
  }

  return doctor;
}

export async function createDoctor(data: any, adminId: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    const error: any = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        role: 'DOCTOR',
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatar: data.avatar,
      },
    });

    const doctor = await tx.doctor.create({
      data: {
        userId: user.id,
        departmentId: data.departmentId,
        specialization: data.specialization,
        qualification: data.qualification,
        experienceYears: data.experienceYears,
        consultationFee: data.consultationFee,
        biography: data.biography,
        roomNumber: data.roomNumber,
      },
    });

    // Default schedules if provided, or standard Mon-Fri
    const schedulesToCreate = data.schedules && data.schedules.length > 0
      ? data.schedules
      : [1, 2, 3, 4, 5].map((day) => ({
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 30,
        }));

    await tx.doctorSchedule.createMany({
      data: schedulesToCreate.map((s: any) => ({
        doctorId: doctor.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDuration: s.slotDuration || 30,
        isActive: true,
      })),
    });

    return { user, doctor };
  });

  await logAuditEvent({
    userId: adminId,
    userRole: 'ADMIN',
    action: 'CREATE_DOCTOR',
    entity: 'Doctor',
    entityId: result.doctor.id,
    details: `Doctor created: Dr. ${result.user.firstName} ${result.user.lastName} (${result.user.email})`,
  });

  return getDoctorById(result.doctor.id);
}

export async function updateDoctor(id: string, data: any, adminId: string) {
  const existing = await prisma.doctor.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!existing) {
    const error: any = new Error('Doctor not found.');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (data.phone !== undefined || data.isActive !== undefined) {
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          phone: data.phone,
          isActive: data.isActive,
        },
      });
    }

    return await tx.doctor.update({
      where: { id },
      data: {
        specialization: data.specialization,
        qualification: data.qualification,
        experienceYears: data.experienceYears,
        consultationFee: data.consultationFee,
        biography: data.biography,
        roomNumber: data.roomNumber,
        isAvailable: data.isAvailable,
      },
      include: {
        user: true,
        department: true,
      },
    });
  });

  await logAuditEvent({
    userId: adminId,
    userRole: 'ADMIN',
    action: 'UPDATE_DOCTOR',
    entity: 'Doctor',
    entityId: id,
    details: `Doctor updated: ID ${id}`,
  });

  return updated;
}
