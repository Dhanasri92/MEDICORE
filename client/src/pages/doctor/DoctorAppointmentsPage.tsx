import React, { useState, useEffect } from 'react';
import { Calendar, Stethoscope, CheckCircle2, Clock } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { ConsultationModal } from '../../components/consultation/ConsultationModal.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Appointment } from '../../types/index.js';

export const DoctorAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/doctor');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#171B22]">My Consultation Schedule</h2>
          <p className="text-xs text-[#9298A1] mt-0.5">
            Review patient queue, initiate consultation sessions, and issue clinical regimens
          </p>
        </div>
      </div>

      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading your appointments..." />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments scheduled"
            description="You do not have any patient appointments currently booked."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F3F7] text-[#9298A1] font-semibold">
                  <th className="pb-3 pl-2">Token #</th>
                  <th className="pb-3">Patient Name</th>
                  <th className="pb-3">Date & Slot</th>
                  <th className="pb-3">Presenting Complaint</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Clinical Encounter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 pl-2 font-mono font-bold text-[#329BFA]">
                      {appt.appointmentNumber}
                    </td>
                    <td className="py-3.5 font-bold text-[#171B22]">
                      {appt.patient?.user?.firstName} {appt.patient?.user?.lastName}
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
                      {appt.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => {
                            setSelectedAppointment(appt);
                            setIsConsultationOpen(true);
                          }}
                          className="px-3 py-1.5 bg-[#329BFA] hover:bg-[#2486E3] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Start Consultation</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        onSuccess={fetchAppointments}
        appointment={selectedAppointment}
      />
    </div>
  );
};
