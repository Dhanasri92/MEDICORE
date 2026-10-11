import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RescheduleAppointmentModal } from '../../src/components/appointments/RescheduleAppointmentModal';
import { api } from '../../src/api/client.js';
import { Appointment } from '../../src/types';

vi.mock('../../src/api/client.js', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('../../src/api/client', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('Frontend Component: RescheduleAppointmentModal', () => {
  const mockAppointment: Appointment = {
    id: 'apt-123',
    patientId: 'pat-1',
    doctorId: 'doc-1',
    appointmentNumber: 'APT-1001',
    appointmentDate: '2026-11-20',
    timeSlot: '09:00',
    status: 'CONFIRMED',
    type: 'GENERAL_CHECKUP',
    reasonForVisit: 'Routine wellness check',
    doctor: {
      id: 'doc-1',
      userId: 'user-doc-1',
      specialization: 'Cardiology',
      user: {
        id: 'user-doc-1',
        email: 'doc@medicore.hospital',
        firstName: 'Gregory',
        lastName: 'House',
        role: 'DOCTOR',
        phone: null,
        avatarUrl: null,
        createdAt: '2026-01-01',
      },
    },
    patient: {
      id: 'pat-1',
      userId: 'user-pat-1',
      user: {
        id: 'user-pat-1',
        email: 'pat@medicore.hospital',
        firstName: 'Alex',
        lastName: 'Morgan',
        role: 'PATIENT',
        phone: null,
        avatarUrl: null,
        createdAt: '2026-01-01',
      },
    },
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with appointment token and current booking info', async () => {
    (api.get as any).mockResolvedValue({
      success: true,
      data: {
        slots: [
          { time: '10:00', isAvailable: true },
          { time: '10:30', isAvailable: false },
        ],
      },
    });

    render(
      <RescheduleAppointmentModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
        appointment={mockAppointment}
      />
    );

    expect(screen.getByText('Reschedule Appointment')).toBeInTheDocument();
    expect(screen.getByText(/Token #APT-1001/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-11-20 at 09:00/i)).toBeInTheDocument();
  });

  it('fetches slots and submits reschedule request successfully', async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    (api.get as any).mockResolvedValue({
      success: true,
      data: {
        slots: [
          { time: '11:00', isAvailable: true },
          { time: '11:30', isAvailable: true },
        ],
      },
    });

    (api.patch as any).mockResolvedValueOnce({
      success: true,
      data: { id: 'apt-123', appointmentDate: '2026-11-25', timeSlot: '11:30' },
    });

    render(
      <RescheduleAppointmentModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        appointment={mockAppointment}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '11:00' })).toBeInTheDocument();
    });

    // Pick 11:30 slot
    const slot1130 = screen.getByRole('button', { name: '11:30' });
    fireEvent.click(slot1130);

    const submitBtn = screen.getByRole('button', { name: /Confirm New Time/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/appointments/apt-123/reschedule', {
        appointmentDate: '2026-11-20',
        timeSlot: '11:30',
        reason: 'Routine wellness check',
      });
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('displays error message when reschedule API returns conflict or error', async () => {
    (api.get as any).mockResolvedValue({
      success: true,
      data: {
        slots: [{ time: '14:00', isAvailable: true }],
      },
    });

    (api.patch as any).mockRejectedValueOnce(
      new Error('This time slot is already booked.')
    );

    render(
      <RescheduleAppointmentModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
        appointment={mockAppointment}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '14:00' })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Confirm New Time/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('This time slot is already booked.')).toBeInTheDocument();
    });
  });
});
