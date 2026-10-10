import React, { useState, useEffect } from 'react';
import { Users, Search, Eye, Calendar, FileText, Phone } from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Patient } from '../../types/index.js';

export const PatientsManagementPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPatients = async () => {
    try {
      let url = '/patients?limit=50';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      if (res.success) setPatients(res.data.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#171B22]">Registered Patients</h2>
          <p className="text-xs text-[#9298A1] mt-0.5">
            Hospital master patient index, demographics, and clinical activity tracking
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="card-base p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9298A1]" />
          <input
            type="text"
            placeholder="Search patients by name, email, or telephone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
          />
        </div>
      </div>

      {/* Patient Table */}
      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading registered patients..." />
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients found"
            description="No matching patient records were found in the registry."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F3F7] text-[#9298A1] font-semibold">
                  <th className="pb-3 pl-2">Patient Name</th>
                  <th className="pb-3">Age / Gender</th>
                  <th className="pb-3">Blood Group</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Allergies</th>
                  <th className="pb-3">Encounters</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {patients.map((p) => {
                  const age = p.dateOfBirth
                    ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()
                    : 'N/A';

                  return (
                    <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 pl-2 font-bold text-[#171B22]">
                        <div>{p.user?.firstName} {p.user?.lastName}</div>
                        <div className="text-[10px] text-[#9298A1] font-normal">{p.user?.email}</div>
                      </td>
                      <td className="py-3.5 text-[#171B22]">
                        {age} yrs • {p.gender}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[11px]">
                          {p.bloodGroup || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 text-[#9298A1]">
                        {p.user?.phone || 'N/A'}
                      </td>
                      <td className="py-3.5 text-[#171B22] max-w-xs truncate">
                        {p.allergies || 'None recorded'}
                      </td>
                      <td className="py-3.5 text-[#329BFA] font-bold">
                        {p._count?.appointments || 0} visits
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
