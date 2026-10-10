import { prisma } from '../../config/database.js';

export async function calculateDoctorAvailability(doctorId: string, dateStr: string) {
  // Parse date
  const targetDate = new Date(dateStr + 'T00:00:00Z');
  const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday

  // Find schedule rule for this doctor on this day
  const schedule = await prisma.doctorSchedule.findFirst({
    where: {
      doctorId,
      dayOfWeek,
      isActive: true,
    },
  });

  if (!schedule) {
    return {
      doctorId,
      date: dateStr,
      hasClinicHours: false,
      message: 'Physician does not have scheduled clinic hours on this day of the week.',
      slots: [],
    };
  }

  // Parse start and end times (e.g., "09:00" to "17:00")
  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
  const [endHour, endMin] = schedule.endTime.split(':').map(Number);
  const duration = schedule.slotDuration || 30;

  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;

  const generatedSlots: string[] = [];
  for (let m = startTotalMinutes; m + duration <= endTotalMinutes; m += duration) {
    const hh = Math.floor(m / 60).toString().padStart(2, '0');
    const mm = (m % 60).toString().padStart(2, '0');
    generatedSlots.push(`${hh}:${mm}`);
  }

  // Query booked appointments for this doctor on this date
  const existingBookings = await prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: dateStr,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    select: { timeSlot: true },
  });

  const bookedSet = new Set(existingBookings.map((b) => b.timeSlot));

  const slots = generatedSlots.map((time) => ({
    time,
    isAvailable: !bookedSet.has(time),
  }));

  return {
    doctorId,
    date: dateStr,
    hasClinicHours: true,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    slotDuration: duration,
    slots,
  };
}
