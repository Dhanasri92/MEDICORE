import { describe, it, expect } from 'vitest';

function generateSlots(startTime: string, endTime: string, durationMinutes: number): string[] {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;

  const slots: string[] = [];
  for (let m = startTotalMinutes; m + durationMinutes <= endTotalMinutes; m += durationMinutes) {
    const hh = Math.floor(m / 60).toString().padStart(2, '0');
    const mm = (m % 60).toString().padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

function calculateSlotAvailability(
  generatedSlots: string[],
  bookedSlots: string[]
): Array<{ time: string; isAvailable: boolean }> {
  const bookedSet = new Set(bookedSlots);
  return generatedSlots.map((time) => ({
    time,
    isAvailable: !bookedSet.has(time),
  }));
}

describe('Unit Tests: Appointment Slot Generation & Availability Mathematics', () => {
  it('should generate standard 30-minute consultation slots between 09:00 and 17:00', () => {
    const slots = generateSlots('09:00', '17:00', 30);

    // 8 hours = 480 minutes -> 480 / 30 = 16 slots
    expect(slots.length).toBe(16);
    expect(slots[0]).toBe('09:00');
    expect(slots[1]).toBe('09:30');
    expect(slots[15]).toBe('16:30');
    // Does not include 17:00 because that's the clinic end time
    expect(slots.includes('17:00')).toBe(false);
  });

  it('should generate 15-minute rapid checkup slots', () => {
    const slots = generateSlots('10:00', '12:00', 15);
    // 2 hours = 120 minutes -> 120 / 15 = 8 slots
    expect(slots.length).toBe(8);
    expect(slots[0]).toBe('10:00');
    expect(slots[1]).toBe('10:15');
    expect(slots[7]).toBe('11:45');
  });

  it('should generate 60-minute in-depth consultation slots', () => {
    const slots = generateSlots('08:00', '12:00', 60);
    expect(slots).toEqual(['08:00', '09:00', '10:00', '11:00']);
  });

  it('should handle uneven schedule boundaries without overflowing endTime', () => {
    // 09:00 to 10:15 with 30-minute duration: 09:00, 09:30. Next would be 10:00, ends at 10:30 which exceeds 10:15!
    const slots = generateSlots('09:00', '10:15', 30);
    expect(slots).toEqual(['09:00', '09:30']);
  });

  it('should correctly flag booked and available slots', () => {
    const generated = ['09:00', '09:30', '10:00', '10:30', '11:00'];
    const booked = ['09:30', '10:30'];

    const availability = calculateSlotAvailability(generated, booked);

    expect(availability).toEqual([
      { time: '09:00', isAvailable: true },
      { time: '09:30', isAvailable: false },
      { time: '10:00', isAvailable: true },
      { time: '10:30', isAvailable: false },
      { time: '11:00', isAvailable: true },
    ]);
  });

  it('should return all slots as available when no bookings exist', () => {
    const generated = ['14:00', '14:30', '15:00'];
    const availability = calculateSlotAvailability(generated, []);

    expect(availability.every((s) => s.isAvailable)).toBe(true);
  });

  it('should return all slots as unavailable when all slots are booked', () => {
    const generated = ['14:00', '14:30'];
    const availability = calculateSlotAvailability(generated, ['14:00', '14:30']);

    expect(availability.every((s) => !s.isAvailable)).toBe(true);
  });
});
