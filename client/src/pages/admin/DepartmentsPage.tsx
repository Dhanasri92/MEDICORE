import React, { useState, useEffect } from 'react';
import { Building2, Plus, Stethoscope, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Department } from '../../types/index.js';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#329BFA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.success) setDepartments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.post('/departments', { name, code, description, color });
      setIsAddOpen(false);
      setName('');
      setCode('');
      setDescription('');
      fetchDepartments();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#171B22]">Clinical Departments</h2>
          <p className="text-xs text-[#9298A1] mt-0.5">
            Hospital specialized medical centers, wards, and clinical faculties
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-[#329BFA] hover:bg-[#2486E3] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading hospital departments..." />
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description="Create hospital departments like Cardiology, Neurology, or Pediatrics."
          actionText="Add Department"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="card-base p-5 flex flex-col justify-between hover:shadow-card-hover transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: dept.color || '#329BFA' }}
                    >
                      {dept.code}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#171B22]">{dept.name}</h4>
                      <span className="text-[11px] font-semibold text-[#9298A1]">
                        Code: {dept.code}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EBF5FE] text-[#329BFA]">
                    {dept._count?.doctors || 0} Doctors
                  </span>
                </div>

                <p className="text-xs text-[#9298A1] leading-relaxed">
                  {dept.description || 'Dedicated clinical specialty center providing comprehensive patient care.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F0F3F7] flex items-center justify-between text-xs text-[#9298A1]">
                <span>Active Specialty</span>
                <span className="font-semibold text-[#171B22]">Operational</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Clinical Department"
        subtitle="Configure hospital specialty department"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Oncology"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. ONCO"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of clinical specialty and facilities"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">Badge Accent Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-16 h-8 rounded-lg cursor-pointer border border-[#E9EDF2]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F3F7]">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#9298A1] hover:text-[#171B22] rounded-xl hover:bg-[#F5F6F8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#329BFA] hover:bg-[#2486E3] disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
