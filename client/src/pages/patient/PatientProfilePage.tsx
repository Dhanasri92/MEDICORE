import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

export const PatientProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    bloodGroup: 'O+',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/auth/me');
        if (res.success && res.data) {
          const u = res.data;
          const p = u.patient || {};
          setFormData({
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            phone: u.phone || '',
            address: p.address || '',
            emergencyContactName: p.emergencyContactName || '',
            emergencyContactPhone: p.emergencyContactPhone || '',
            allergies: p.allergies || '',
            bloodGroup: p.bloodGroup || 'O+',
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await api.patch('/auth/profile', formData);
      if (res.success) {
        updateUser(res.data);
        setSuccessMessage('Profile details successfully updated.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-[#171B22]">Personal Health Profile</h2>
        <p className="text-xs text-[#9298A1] mt-0.5">
          Manage contact information, emergency contacts, and clinical safety details
        </p>
      </div>

      <div className="card-base p-8">
        {successMessage && (
          <div className="p-3.5 mb-6 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 mb-6 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Primary Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Blood Group</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">Residential Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Residential street address"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Emergency Contact Name</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                placeholder="Full name of next of kin"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                placeholder="Emergency telephone number"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">Allergies & Sensitivities</label>
            <input
              type="text"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="e.g. Penicillin, NSAIDs, Latex, Contrast dye"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
            />
          </div>

          <div className="pt-3 border-t border-[#F0F3F7] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#329BFA] hover:bg-[#2486E3] text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 transition-all"
            >
              {isSaving ? 'Updating...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
