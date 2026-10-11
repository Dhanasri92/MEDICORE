import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  FileText,
  Stethoscope,
  Pill,
} from 'lucide-react';
import { SummaryCard } from '../../components/common/SummaryCard.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { ConsultationModal } from '../../components/consultation/ConsultationModal.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Appointment } from '../../types/index.js';

export const DoctorDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  const fetchDoctorData = async () => {
    try {
      const res = await api.get('/analytics/doctor');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load doctor metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading clinical schedule and queue..." />;
  }

  const todayQueue: Appointment[] = data?.todayQueue || [];

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards for Doctor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Calendar}
          value={data?.todayAppointments ?? 0}
          label="Today's Appointments"
          trendText="Scheduled clinical consultations"
          theme="teal"
        />

        <SummaryCard
          icon={Clock}
          value={data?.upcomingConsultations ?? 0}
          label="Upcoming Visits"
          trendText="Pending patient arrivals"
          theme="amber"
        />

        <SummaryCard
          icon={CheckCircle2}
          value={data?.completedVisits ?? 0}
          label="Completed Visits"
          trendText="Clinical records documented"
          theme="pink"
        />

        <SummaryCard
          icon={Users}
          value={data?.totalTreatedPatients ?? 0}
          label="Unique Patients"
          trendText="Under medical supervision"
          theme="blue"
        />
      </div>

      {/* Today's Queue & Action Station */}
      <div className="card-base p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#171B22]">Today's Consultation Queue</h3>
            <p className="text-xs text-[#9298A1] mt-0.5">
              Review arriving patients, establish diagnoses, and document prescriptions
            </p>
          </div>
        </div>

        {todayQueue.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments scheduled for today"
            description="Your clinic queue is clear for today. View all upcoming visits under Appointments tab."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F3F7] text-[#9298A1] font-semibold">
                  <th className="pb-3 pl-2">Time</th>
                  <th className="pb-3">Patient Name</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Chief Complaint</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Clinical Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {todayQueue.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 pl-2 font-bold text-[#329BFA]">
                      {appt.timeSlot}
                    </td>
                    <td className="py-3.5 font-bold text-[#171B22]">
                      {appt.patient?.user?.firstName} {appt.patient?.user?.lastName}
                    </td>
                    <td className="py-3.5 text-[#9298A1]">
                      {appt.patient?.user?.phone || 'N/A'}
                    </td>
                    <td className="py-3.5 text-[#171B22] font-medium max-w-xs truncate">
                      {appt.reasonForVisit}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={appt.status} size="sm" />
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      {appt.status === 'CONFIRMED' || appt.status === 'PENDING' ? (
                        <button
                          onClick={() => {
                            setSelectedAppointment(appt);
                            setIsConsultationOpen(true);
                          }}
                          className="px-3 py-1.5 bg-[#329BFA] hover:bg-[#2486E3] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm ml-auto transition-all"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Start Consultation</span>
                        </button>
                      ) : appt.status === 'COMPLETED' ? (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Encounter Saved</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-rose-500">
                          {appt.status}
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

      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        onSuccess={() => {
          fetchDoctorData();
        }}
        appointment={selectedAppointment}
      />
    </div>
  );
};
