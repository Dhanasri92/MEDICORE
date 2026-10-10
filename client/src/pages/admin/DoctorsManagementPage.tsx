import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Doctor, Department } from '../../types/index.js';

export const DoctorsManagementPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for creating doctor
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'Doctor@123',
    phone: '',
    departmentId: '',
    specialization: '',
    qualification: 'MD, MBBS',
    experienceYears: 5,
    consultationFee: 100,
    roomNumber: 'Suite 101',
    biography: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDoctors = async () => {
    try {
      let url = `/doctors?limit=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (selectedDept) url += `&departmentId=${selectedDept}`;

      const [docsRes, deptsRes] = await Promise.all([
        api.get(url),
        api.get('/departments'),
      ]);

      if (docsRes.success) setDoctors(docsRes.data.doctors || []);
      if (deptsRes.success) {
        setDepartments(deptsRes.data || []);
        if (deptsRes.data?.length > 0 && !formData.departmentId) {
          setFormData((prev) => ({ ...prev, departmentId: deptsRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [search, selectedDept]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.post('/doctors', {
        ...formData,
        experienceYears: Number(formData.experienceYears),
        consultationFee: Number(formData.consultationFee),
      });

      setIsAddModalOpen(false);
      fetchDoctors();
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: 'Doctor@123',
        phone: '',
        departmentId: departments[0]?.id || '',
        specialization: '',
        qualification: 'MD, MBBS',
        experienceYears: 5,
        consultationFee: 100,
        roomNumber: 'Suite 101',
        biography: '',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create doctor account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (doctor: Doctor) => {
    try {
      await api.patch(`/doctors/${doctor.id}`, {
        isAvailable: !doctor.isAvailable,
      });
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, isAvailable: !d.isAvailable } : d))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#171B22]">Physicians & Medical Staff</h2>
          <p className="text-xs text-[#9298A1] mt-0.5">
            Manage hospital clinicians, consultation fees, rooms, and shift schedules
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-[#329BFA] hover:bg-[#2486E3] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Doctor</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#9298A1]" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid / Table */}
      {isLoading ? (
        <LoadingSpinner message="Loading doctors directory..." />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          description="Try adjusting your filter or add a new doctor account."
          actionText="Add Doctor"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="card-base p-5 flex flex-col justify-between hover:shadow-card-hover transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#EBF5FE] shrink-0 border border-[#E9EDF2]">
                      {doc.user?.avatar ? (
                        <img
                          src={doc.user.avatar}
                          alt={doc.user.firstName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-[#329BFA]">
                          Dr
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#171B22]">
                        Dr. {doc.user?.firstName} {doc.user?.lastName}
                      </h4>
                      <p className="text-xs text-[#329BFA] font-semibold">{doc.specialization}</p>
                      <p className="text-[11px] text-[#9298A1]">{doc.department?.name}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleAvailability(doc)}
                    title="Toggle clinic duty status"
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      doc.isAvailable
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {doc.isAvailable ? 'On Duty' : 'Off Duty'}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-[#9298A1] bg-[#F8FAFC] p-3 rounded-xl border border-[#F0F3F7]">
                  <div className="flex justify-between">
                    <span>Qualifications:</span>
                    <span className="font-semibold text-[#171B22] truncate max-w-[150px]">
                      {doc.qualification}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Experience:</span>
                    <span className="font-semibold text-[#171B22]">{doc.experienceYears} Years</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Room:</span>
                    <span className="font-semibold text-[#171B22]">{doc.roomNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consultation Fee:</span>
                    <span className="font-bold text-[#329BFA]">${doc.consultationFee.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F0F3F7] flex items-center justify-between text-xs text-[#9298A1]">
                <span>Contact: {doc.user?.phone || 'N/A'}</span>
                <span className="text-[10px] bg-[#F5F6F8] px-2 py-0.5 rounded-lg">
                  {doc.user?.email}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Doctor Account"
        subtitle="Create physician credentials and configure initial clinic parameters"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateDoctor} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Department *</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Specialization *</label>
              <input
                type="text"
                required
                placeholder="e.g. Cardiologist, Pediatric Surgeon"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Consultation Fee ($) *</label>
              <input
                type="number"
                min={0}
                required
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Experience (Years)</label>
              <input
                type="number"
                min={0}
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Room / Suite</label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">Phone Contact *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F3F7]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#9298A1] hover:text-[#171B22] rounded-xl hover:bg-[#F5F6F8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#329BFA] hover:bg-[#2486E3] disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? 'Creating Doctor...' : 'Provision Doctor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
