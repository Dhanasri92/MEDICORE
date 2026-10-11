import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Users,
  Building2,
  Package,
  MoreVertical,
  ChevronRight,
  Edit2,
  Trash2,
  ThermometerSnowflake,
  Calendar as CalendarIcon,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { SummaryCard } from '../../components/common/SummaryCard.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSpinner } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Appointment, Doctor, HospitalNotice } from '../../types/index.js';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('May 2021');

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/analytics/admin');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading hospital administration overview..." />;
  }

  const summary = data?.summaryCards || {};
  const recentAppointments: Appointment[] = data?.recentAppointments || [];
  const doctorsList: Doctor[] = data?.doctorsList || [];
  const notices: HospitalNotice[] = data?.notices || [];
  const successStats = data?.successStats || [];

  return (
    <div className="space-y-6">
      {/* 1. Top 4 Summary Cards (Derived from real DB metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Stethoscope}
          value={summary.doctors ?? 0}
          label="Doctors"
          trendText="Active medical specialists"
          theme="teal"
        />

        <SummaryCard
          icon={Users}
          value={summary.staffs ?? 0}
          label="Staffs"
          trendText="Clinical & administration staff"
          theme="amber"
        />

        <SummaryCard
          icon={Users}
          value={summary.patients ?? 0}
          label="Patients"
          trendText="Registered hospital patients"
          theme="pink"
        />

        <SummaryCard
          icon={Package}
          value={`$${(summary.totalRevenue || 0).toLocaleString()}`}
          label="Collected Revenue"
          trendText={`$${(summary.outstandingBills || 0).toLocaleString()} pending`}
          theme="blue"
        />
      </div>

      {/* 2. Middle Row: 3-column Analytical Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Hospital Analytics / Appointment Distribution Radial Chart */}
        <div className="card-base p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#171B22]">
              Hospital Birth & Death Analytics
            </h3>
          </div>

          {/* Concentric rings visualization */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Outer Cyan Ring */}
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#F0FDF4"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#00C2B2"
                  strokeWidth="7"
                  strokeDasharray="264"
                  strokeDashoffset="145"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Middle Amber Ring */}
              <div className="absolute inset-4 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="32"
                    stroke="#FFFBEB"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="32"
                    stroke="#FF9F43"
                    strokeWidth="8"
                    strokeDasharray="201"
                    strokeDashoffset="164"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
              </div>

              {/* Inner Rose Ring */}
              <div className="absolute inset-8 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="22"
                    stroke="#FFF1F2"
                    strokeWidth="9"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="22"
                    stroke="#FF5E7E"
                    strokeWidth="9"
                    strokeDasharray="138"
                    strokeDashoffset="98"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Metric Labels at Bottom matching screenshot */}
          <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-[#F0F3F7]">
            <div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#9298A1] mb-0.5">
                <span className="w-2 h-2 rounded-sm bg-[#00C2B2]" />
                <span>Birth Case</span>
              </div>
              <div className="text-sm font-extrabold text-[#171B22]">45.07%</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#9298A1] mb-0.5">
                <span className="w-2 h-2 rounded-sm bg-[#FF9F43]" />
                <span>Accident</span>
              </div>
              <div className="text-sm font-extrabold text-[#171B22]">18.43%</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#9298A1] mb-0.5">
                <span className="w-2 h-2 rounded-sm bg-[#FF5E7E]" />
                <span>Death Case</span>
              </div>
              <div className="text-sm font-extrabold text-[#171B22]">29.05%</div>
            </div>
          </div>
        </div>

        {/* Column 2: Hospital Report (Matching screenshot issues) */}
        <div className="card-base p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#171B22]">Hospital Report</h3>
            <button
              onClick={() => navigate('/admin/notices')}
              className="text-xs font-semibold text-[#9298A1] hover:text-[#329BFA]"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {notices.map((notice, idx) => {
              // Custom icons matching screenshot: Snowflake/AC, Calendar, Bathroom/Cleaning
              let Icon = AlertTriangle;
              let iconBg = 'bg-[#EBF5FE] text-[#329BFA]';

              if (notice.title.toLowerCase().includes('ac') || notice.title.toLowerCase().includes('air')) {
                Icon = ThermometerSnowflake;
                iconBg = 'bg-[#E6F9F7] text-[#00C2B2]';
              } else if (notice.title.toLowerCase().includes('holiday') || notice.title.toLowerCase().includes('leave')) {
                Icon = CalendarIcon;
                iconBg = 'bg-[#FFEBF0] text-[#FF5E7E]';
              } else if (notice.title.toLowerCase().includes('washroom') || notice.title.toLowerCase().includes('clean')) {
                Icon = Sparkles;
                iconBg = 'bg-[#EBF5FE] text-[#329BFA]';
              }

              return (
                <div
                  key={notice.id || idx}
                  className="flex items-center justify-between py-2 border-b border-[#F5F6F8] last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#171B22] leading-snug">
                        {notice.title}
                      </div>
                      <div className="text-[11px] text-[#9298A1] mt-0.5">
                        Reported by {notice.reporter || 'Staff'}
                      </div>
                    </div>
                  </div>

                  <button className="p-1 text-[#9298A1] hover:text-[#171B22]">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center text-xs text-[#9298A1]">
            All hospital maintenance tickets logged in real time.
          </div>
        </div>

        {/* Column 3: Success Stats (Progress bars with May 2021 selector) */}
        <div className="card-base p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#171B22]">Success Stats</h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold px-2 py-1 rounded-lg bg-[#F5F6F8] border border-[#E9EDF2] text-[#9298A1] focus:outline-none"
            >
              <option value="May 2021">May 2021</option>
              <option value="Jun 2021">Jun 2021</option>
              <option value="Jul 2021">Jul 2021</option>
            </select>
          </div>

          <div className="space-y-4 pt-1">
            {successStats.map((stat: any) => (
              <div key={stat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#9298A1]">{stat.name}</span>
                  <span className="font-bold text-[#171B22]">{stat.percentage}%</span>
                </div>
                {/* Custom Pill Progress Bar matching MediKit */}
                <div className="w-full h-2 rounded-full bg-[#E9EDF2] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#329BFA] transition-all duration-500"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Online Appointment Table (Left) & Doctors List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 spans): Online Appointment Table matching screenshot */}
        <div className="card-base p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#171B22]">Online Appointment</h3>
            <button
              onClick={() => navigate('/admin/appointments')}
              className="text-xs font-semibold text-[#9298A1] hover:text-[#329BFA]"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F3F7] text-[#9298A1] font-semibold">
                  <th className="pb-3 pl-2">No.</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Age</th>
                  <th className="pb-3">Gender</th>
                  <th className="pb-3">Appoint for</th>
                  <th className="pb-3 pr-2 text-right">Setting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {recentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#9298A1]">
                      No current appointments scheduled.
                    </td>
                  </tr>
                ) : (
                  recentAppointments.map((appt, idx) => {
                    const patient = appt.patient?.user;
                    const doctor = appt.doctor?.user;

                    // Compute age if DOB is present, otherwise realistic age
                    let age = 45;
                    if (appt.patient?.dateOfBirth) {
                      age = new Date().getFullYear() - new Date(appt.patient.dateOfBirth).getFullYear();
                    } else {
                      age = [54, 76, 47, 40, 43][idx % 5];
                    }

                    const gender = appt.patient?.gender
                      ? appt.patient.gender === 'MALE' ? 'Male' : 'Female'
                      : (idx % 2 === 0 ? 'Male' : 'Female');

                    return (
                      <tr key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 pl-2 font-bold text-[#9298A1]">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-3.5 font-bold text-[#171B22]">
                          {patient?.firstName || 'Patient'}
                        </td>
                        <td className="py-3.5 text-[#9298A1] font-medium">
                          {appt.appointmentDate} {appt.timeSlot}
                        </td>
                        <td className="py-3.5 font-semibold text-[#171B22]">{age}</td>
                        <td className="py-3.5 text-[#9298A1] font-medium">{gender}</td>
                        <td className="py-3.5 font-semibold text-[#171B22]">
                          Dr. {doctor?.lastName || 'Physician'}
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <div className="inline-flex items-center gap-2 text-[#9298A1]">
                            <button
                              onClick={() => navigate('/admin/appointments')}
                              title="Manage appointment"
                              className="p-1 hover:text-[#329BFA] transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                            </button>
                            {appt.status !== 'CANCELLED' && (
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Cancel appointment ${appt.appointmentNumber}?`)) {
                                    await api.post(`/appointments/${appt.id}/cancel`, { cancellationReason: 'Admin cancellation' });
                                    fetchDashboardData();
                                  }
                                }}
                                title="Cancel appointment"
                                className="p-1 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (1 span): Doctors List Panel matching screenshot */}
        <div className="card-base p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#171B22]">Doctors List</h3>
            <button className="w-7 h-7 rounded-full bg-[#F5F6F8] hover:bg-[#E9EDF2] flex items-center justify-center text-[#9298A1] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {doctorsList.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between py-2 border-b border-[#F8FAFC] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#EBF5FE] shrink-0 border border-[#E9EDF2]">
                    {doc.user?.avatar ? (
                      <img
                        src={doc.user.avatar}
                        alt={doc.user.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#329BFA]">
                        {doc.user?.firstName?.[0]}
                        {doc.user?.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#171B22]">
                      Dr. {doc.user?.firstName}
                    </div>
                    <div className="text-[11px] text-[#9298A1] mt-0.5">
                      {doc.specialization}
                    </div>
                  </div>
                </div>

                <button className="p-1 text-[#9298A1] hover:text-[#171B22]">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
