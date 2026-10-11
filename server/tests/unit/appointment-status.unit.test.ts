import { describe, it, expect } from 'vitest';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

interface StatusTransitionResult {
  allowed: boolean;
  error?: string;
}

function validateStatusTransition(
  currentStatus: AppointmentStatus,
  targetStatus: AppointmentStatus
): StatusTransitionResult {
  if (currentStatus === 'CANCELLED') {
    return {
      allowed: false,
      error: 'Cancelled appointments cannot transition to any other status.',
    };
  }

  if (currentStatus === 'COMPLETED' && targetStatus === 'CANCELLED') {
    return {
      allowed: false,
      error: 'Completed encounters cannot be cancelled.',
    };
  }

  const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
    CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: ['CANCELLED'],
  };

  const isPermitted = validTransitions[currentStatus]?.includes(targetStatus) || false;
  return {
    allowed: isPermitted,
    error: isPermitted ? undefined : `Invalid transition from ${currentStatus} to ${targetStatus}`,
  };
}

function validateConsultationAllowed(status: AppointmentStatus): { allowed: boolean; error?: string } {
  if (status === 'CANCELLED') {
    return {
      allowed: false,
      error: 'Cannot document clinical consultation for a cancelled appointment.',
    };
  }
  if (status === 'COMPLETED') {
    return {
      allowed: false,
      error: 'A clinical record has already been documented for this visit.',
    };
  }
  return { allowed: true };
}

function validateRescheduleAllowed(status: AppointmentStatus): { allowed: boolean; error?: string } {
  if (status === 'CANCELLED') {
    return {
      allowed: false,
      error: 'Cancelled appointments cannot be rescheduled.',
    };
  }
  if (status === 'COMPLETED') {
    return {
      allowed: false,
      error: 'Completed appointments cannot be rescheduled.',
    };
  }
  return { allowed: true };
}

describe('Unit Tests: Appointment Lifecycle State Machine & Transition Rules', () => {
  describe('Status Transitions', () => {
    it('should permit PENDING -> CONFIRMED', () => {
      expect(validateStatusTransition('PENDING', 'CONFIRMED').allowed).toBe(true);
    });

    it('should permit CONFIRMED -> COMPLETED', () => {
      expect(validateStatusTransition('CONFIRMED', 'COMPLETED').allowed).toBe(true);
    });

    it('should permit CONFIRMED -> CANCELLED', () => {
      expect(validateStatusTransition('CONFIRMED', 'CANCELLED').allowed).toBe(true);
    });

    it('should permit CONFIRMED -> NO_SHOW', () => {
      expect(validateStatusTransition('CONFIRMED', 'NO_SHOW').allowed).toBe(true);
    });

    it('should reject CANCELLED -> CONFIRMED', () => {
      const res = validateStatusTransition('CANCELLED', 'CONFIRMED');
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('Cancelled appointments cannot transition');
    });

    it('should reject COMPLETED -> CANCELLED', () => {
      const res = validateStatusTransition('COMPLETED', 'CANCELLED');
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('Completed encounters cannot be cancelled');
    });
  });

  describe('Clinical Consultation Eligibility', () => {
    it('should allow consultation on CONFIRMED appointment', () => {
      expect(validateConsultationAllowed('CONFIRMED').allowed).toBe(true);
    });

    it('should reject consultation on CANCELLED appointment', () => {
      const res = validateConsultationAllowed('CANCELLED');
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('cancelled appointment');
    });

    it('should reject consultation on already COMPLETED appointment (duplicate prevention)', () => {
      const res = validateConsultationAllowed('COMPLETED');
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('already been documented');
    });
  });

  describe('Rescheduling Eligibility', () => {
    it('should allow rescheduling on CONFIRMED appointment', () => {
      expect(validateRescheduleAllowed('CONFIRMED').allowed).toBe(true);
    });

    it('should reject rescheduling on CANCELLED appointment', () => {
      const res = validateRescheduleAllowed('CANCELLED');
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('Cancelled appointments cannot be rescheduled');
    });

    it('should reject rescheduling on COMPLETED appointment', () => {
      const res = validateRescheduleAllowed('COMPLETED');
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('Completed appointments cannot be rescheduled');
    });
  });
});
