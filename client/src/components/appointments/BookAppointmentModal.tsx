import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Stethoscope, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { api } from '../../api/client.js';
import { Doctor, Department } from '../../types/index.js';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDoctorId?: string;
  patientId?: string;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDoctorId,
  patientId,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || '');
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // default tomorrow
  );
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; isAvailable: boolean }>>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [reasonForVisit, setReasonForVisit] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load departments
  useEffect(() => {
    if (!isOpen) return;
    api.get('/departments').then((res) => {
      if (res.success) setDepartments(res.data);
    });
  }, [isOpen]);

  // Load doctors filtered by department
  useEffect(() => {
    if (!isOpen) return;
    const url = selectedDeptId ? `/doctors?departmentId=${selectedDeptId}` : '/doctors';
    api.get(url).then((res) => {
      if (res.success) {
        setDoctors(res.data.doctors || []);
        if (initialDoctorId) {
          setSelectedDoctorId(initialDoctorId);
        } else if (res.data.doctors?.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(res.data.doctors[0].id);
        }
      }
    });
  }, [isOpen, selectedDeptId, initialDoctorId]);

  // Load availability slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !appointmentDate) return;
    setIsLoadingSlots(true);
    setErrorMessage('');
    setSelectedSlot('');

    api
      .get(`/doctors/${selectedDoctorId}/availability?date=${appointmentDate}`)
      .then((res) => {
        if (res.success && res.data?.slots) {
          setAvailableSlots(res.data.slots);
          // Auto-select first available slot
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
  }, [selectedDoctorId, appointmentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !appointmentDate || !selectedSlot) {
      setErrorMessage('Please select a doctor, target date, and an available time slot.');
      return;
    }
    if (!reasonForVisit.trim()) {
      setErrorMessage('Please enter a brief reason for your visit.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.post('/appointments', {
        doctorId: selectedDoctorId,
        patientId,
        appointmentDate,
        timeSlot: selectedSlot,
        reasonForVisit,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to book appointment. Slot may have been taken.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book an Appointment"
      subtitle="Select a physician, preferred consultation date, and available time slot"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Department Filter & Doctor Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">
              Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">
              Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
            >
              <option value="">Select Doctor</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.user.firstName} {doc.user.lastName} ({doc.specialization} - ${doc.consultationFee})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Appointment Date */}
        <div>
          <label className="block text-xs font-bold text-[#171B22] mb-1">
            Appointment Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={appointmentDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
            />
          </div>
        </div>

        {/* Time Slot Selector */}
        <div>
          <label className="block text-xs font-bold text-[#171B22] mb-1.5 flex items-center justify-between">
            <span>Available Time Slots</span>
            {isLoadingSlots && <span className="text-[11px] font-normal text-[#9298A1]">Checking slots...</span>}
          </label>

          {availableSlots.length === 0 && !isLoadingSlots ? (
            <div className="p-3 text-center rounded-xl bg-[#F8FAFC] text-xs text-[#9298A1] border border-[#E9EDF2]">
              No available shift hours found for this doctor on the selected date.
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

        {/* Reason for Visit */}
        <div>
          <label className="block text-xs font-bold text-[#171B22] mb-1">
            Reason for Visit / Chief Complaint
          </label>
          <textarea
            value={reasonForVisit}
            onChange={(e) => setReasonForVisit(e.target.value)}
            required
            rows={2}
            placeholder="e.g. Follow-up for chest discomfort, routine checkup, or headache"
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] placeholder-[#9298A1] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F3F7]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#9298A1] hover:text-[#171B22] rounded-xl hover:bg-[#F5F6F8] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedSlot}
            className="px-5 py-2 text-xs font-bold text-white bg-[#329BFA] hover:bg-[#2486E3] disabled:opacity-50 rounded-xl shadow-sm transition-all"
          >
            {isSubmitting ? 'Reserving Slot...' : 'Confirm Appointment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
