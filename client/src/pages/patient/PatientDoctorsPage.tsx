import React, { useState, useEffect } from 'react';
import { Stethoscope, Search, Calendar, Star, DollarSign } from 'lucide-react';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Doctor, Department } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const PatientDoctorsPage: React.FC = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        let url = '/doctors?limit=50';
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (selectedDept) url += `&departmentId=${selectedDept}`;

        const [docsRes, deptsRes] = await Promise.all([
          api.get(url),
          api.get('/departments'),
        ]);

        if (docsRes.success) setDoctors(docsRes.data.doctors || []);
        if (deptsRes.success) setDepartments(deptsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [search, selectedDept]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#171B22]">Find a Doctor & Specialist</h2>
          <p className="text-xs text-[#9298A1] mt-0.5">
            Browse hospital physicians, compare consultation fees, and schedule visits
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="card-base p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9298A1]" />
          <input
            type="text"
            placeholder="Search by physician name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none w-full sm:w-auto"
        >
          <option value="">All Clinical Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Doctor Cards */}
      {isLoading ? (
        <LoadingSpinner message="Searching hospital specialists..." />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          description="Try modifying your search keywords or department filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="card-base p-6 flex flex-col justify-between hover:shadow-card-hover transition-all"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#EBF5FE] shrink-0 border border-[#E9EDF2]">
                    {doc.user?.avatar ? (
                      <img
                        src={doc.user.avatar}
                        alt={doc.user.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-base text-[#329BFA]">
                        Dr
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#171B22]">
                      Dr. {doc.user?.firstName} {doc.user?.lastName}
                    </h4>
                    <span className="text-xs font-semibold text-[#329BFA] block">
                      {doc.specialization}
                    </span>
                    <span className="text-[11px] text-[#9298A1] block">
                      {doc.department?.name}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#9298A1] line-clamp-2 mb-4 leading-relaxed">
                  {doc.biography || 'Specialist clinician with extensive clinical and patient care expertise.'}
                </p>

                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#F0F3F7] space-y-1.5 text-xs text-[#9298A1] mb-4">
                  <div className="flex justify-between">
                    <span>Experience:</span>
                    <span className="font-semibold text-[#171B22]">{doc.experienceYears} Years</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consultation Fee:</span>
                    <span className="font-bold text-[#329BFA]">${doc.consultationFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clinic Office:</span>
                    <span className="font-semibold text-[#171B22]">{doc.roomNumber || 'Consultation Suite'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedDoctorId(doc.id);
                  setIsBookModalOpen(true);
                }}
                className="w-full py-2.5 bg-[#329BFA] hover:bg-[#2486E3] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={() => {}}
        initialDoctorId={selectedDoctorId}
        patientId={user?.patientId}
      />
    </div>
  );
};
