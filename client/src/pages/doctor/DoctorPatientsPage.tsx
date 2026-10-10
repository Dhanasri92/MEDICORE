import React, { useState, useEffect } from 'react';
import { Users, Search, FileText } from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Patient } from '../../types/index.js';

export const DoctorPatientsPage: React.FC = () => {
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
      <div>
        <h2 className="text-xl font-extrabold text-[#171B22]">Assigned Patient Directory</h2>
        <p className="text-xs text-[#9298A1] mt-0.5">
          Access clinical histories, past visits, and medical records of patients under your care
        </p>
      </div>

      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading patient list..." />
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients found"
            description="Patients scheduled for consultation will be listed here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F3F7] text-[#9298A1] font-semibold">
                  <th className="pb-3 pl-2">Patient</th>
                  <th className="pb-3">Age / Gender</th>
                  <th className="pb-3">Blood Group</th>
                  <th className="pb-3">Telephone</th>
                  <th className="pb-3">Known Allergies</th>
                  <th className="pb-3 pr-2 text-right">Encounters</th>
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
                        {p.user?.firstName} {p.user?.lastName}
                        <div className="text-[10px] text-[#9298A1] font-normal">{p.user?.email}</div>
                      </td>
                      <td className="py-3.5 text-[#171B22]">
                        {age} yrs • {p.gender}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[11px]">
                          {p.bloodGroup || 'O+'}
                        </span>
                      </td>
                      <td className="py-3.5 text-[#9298A1]">{p.user?.phone || 'N/A'}</td>
                      <td className="py-3.5 text-[#171B22] max-w-xs truncate">
                        {p.allergies || 'No known allergies'}
                      </td>
                      <td className="py-3.5 pr-2 text-right font-bold text-[#329BFA]">
                        {p._count?.appointments || 0} visits
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
