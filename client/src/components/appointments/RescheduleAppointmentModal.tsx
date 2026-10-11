import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { api } from '../../api/client.js';
import { Appointment } from '../../types/index.js';

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: Appointment | null;
}

export const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  appointment,
}) => {
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; isAvailable: boolean }>>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !appointment) return;
    setReason(appointment.reasonForVisit || '');
    setAppointmentDate(appointment.appointmentDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  }, [isOpen, appointment]);

  useEffect(() => {
    if (!isOpen || !appointment || !appointmentDate) return;
    setIsLoadingSlots(true);
    setErrorMessage('');
    setSelectedSlot('');

    api
      .get(`/doctors/${appointment.doctorId}/availability?date=${appointmentDate}`)
      .then((res) => {
        if (res.success && res.data?.slots) {
          setAvailableSlots(res.data.slots);
          const firstOpen = res.data.slots.find((s: any) => s.isAvailable);
          if (firstOpen) setSelectedSlot(firstOpen.time);
        } else {
          setAvailableSlots([]);
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Could not load availability slots.');
      })
      .finally(() => setIsLoadingSlots(false));
  }, [isOpen, appointment, appointmentDate]);

  if (!appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentDate || !selectedSlot) {
      setErrorMessage('Please select a target date and available time slot.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.patch(`/appointments/${appointment.id}/reschedule`, {
        appointmentDate,
        timeSlot: selectedSlot,
        reason: reason.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reschedule appointment. The slot may have been booked.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Appointment"
      subtitle={`Token #${appointment.appointmentNumber} with Dr. ${appointment.doctor?.user?.lastName || ''}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E9EDF2] text-xs space-y-1">
          <div className="font-bold text-[#171B22]">Current Booking:</div>
          <div className="text-[#9298A1]">
            Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName} ({appointment.doctor?.specialization})
          </div>
          <div className="text-[#329BFA] font-medium">
            {appointment.appointmentDate} at {appointment.timeSlot}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#171B22] mb-1">
            New Appointment Date
          </label>
          <input
            type="date"
            value={appointmentDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setAppointmentDate(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#171B22] mb-1.5 flex items-center justify-between">
            <span>Select New Time Slot</span>
            {isLoadingSlots && <span className="text-[11px] font-normal text-[#9298A1]">Loading slots...</span>}
          </label>

          {availableSlots.length === 0 && !isLoadingSlots ? (
            <div className="p-3 text-center rounded-xl bg-[#F8FAFC] text-xs text-[#9298A1] border border-[#E9EDF2]">
              No available slots on this date.
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.isAvailable}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={`py-2 px-1 text-xs rounded-xl font-bold transition-all text-center ${
                    !slot.isAvailable
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                      : selectedSlot === slot.time
                      ? 'bg-[#329BFA] text-white shadow-sm shadow-[#329BFA]/30'
                      : 'bg-[#F5F6F8] text-[#171B22] hover:bg-[#EBF5FE] hover:text-[#329BFA]'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-[#171B22] mb-1">
            Updated Reason (Optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for reschedule or updated symptoms"
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F3F7]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#9298A1] hover:text-[#171B22] rounded-xl hover:bg-[#F5F6F8]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedSlot}
            className="px-5 py-2 text-xs font-bold text-white bg-[#329BFA] hover:bg-[#2486E3] disabled:opacity-50 rounded-xl shadow-sm transition-all"
          >
            {isSubmitting ? 'Rescheduling...' : 'Confirm New Time'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
