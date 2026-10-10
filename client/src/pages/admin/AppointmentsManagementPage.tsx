import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Appointment } from '../../types/index.js';

export const AppointmentsManagementPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAppointments = async () => {
    try {
      let url = '/appointments/admin?limit=50';
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await api.get(url);
      if (res.success) setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#171B22]">Hospital Appointments Master Log</h2>
          <p className="text-xs text-[#9298A1] mt-0.5">
            Monitor clinic appointments, manage lifecycle status transitions, and enforce attendance
          </p>
        </div>
      </div>

      {/* Filter Station */}
      <div className="card-base p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#9298A1]" />
          <span className="text-xs font-bold text-[#171B22]">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22]"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading appointment schedule..." />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments found"
            description="No appointments matched the current filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F3F7] text-[#9298A1] font-semibold">
                  <th className="pb-3 pl-2">Token #</th>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Physician</th>
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
                      {appt.patient?.user?.firstName} {appt.patient?.user?.lastName}
                    </td>
                    <td className="py-3.5 text-[#171B22]">
                      Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                            className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[10px]"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                            className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
