import React, { useState, useEffect } from 'react';
import { Calendar, Plus, XCircle, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Appointment } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const PatientAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/mine');
      if (res.success) setAppointments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? Your slot will be released.')) return;
    try {
      await api.post(`/appointments/${id}/cancel`, { cancellationReason: 'Cancelled by patient' });
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#171B22]">My Appointments</h2>
          <p className="text-xs text-[#9298A1] mt-0.5">
            Manage your consultations, scheduled dates, and appointment history
          </p>
        </div>

        <button
          onClick={() => setIsBookModalOpen(true)}
          className="px-4 py-2 bg-[#329BFA] hover:bg-[#2486E3] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading your appointments..." />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments booked"
            description="You don't have any upcoming or past appointments on file."
            actionText="Book an Appointment"
            onAction={() => setIsBookModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F3F7] text-[#9298A1] font-semibold">
                  <th className="pb-3 pl-2">Token #</th>
                  <th className="pb-3">Doctor</th>
                  <th className="pb-3">Specialty</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Reason</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 pl-2 font-mono font-bold text-[#329BFA]">
                      {appt.appointmentNumber}
                    </td>
                    <td className="py-3.5 font-bold text-[#171B22]">
                      Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}
                    </td>
                    <td className="py-3.5 text-[#9298A1]">
                      {appt.doctor?.specialization}
                    </td>
                    <td className="py-3.5 font-medium text-[#171B22]">
                      {appt.appointmentDate} at {appt.timeSlot}
                    </td>
                    <td className="py-3.5 text-[#9298A1] max-w-xs truncate">
                      {appt.reasonForVisit}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={appt.status} size="sm" />
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      {appt.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleCancel(appt.id)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={fetchAppointments}
        patientId={user?.patientId}
      />
    </div>
  );
};
