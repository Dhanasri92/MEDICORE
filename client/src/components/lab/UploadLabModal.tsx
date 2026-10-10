import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, FileText } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { api } from '../../api/client.js';
import { Patient } from '../../types/index.js';

interface UploadLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadLabModal: React.FC<UploadLabModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [testName, setTestName] = useState('');
  const [category, setCategory] = useState('Hematology');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    api.get('/patients?limit=50').then((res) => {
      if (res.success && res.data?.patients) {
        setPatients(res.data.patients);
        if (res.data.patients.length > 0 && !selectedPatientId) {
          setSelectedPatientId(res.data.patients[0].id);
        }
      }
    });
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !testName || !category) {
      setErrorMessage('Patient, test name, and diagnostic category are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('patientId', selectedPatientId);
      formData.append('testName', testName);
      formData.append('category', category);
      formData.append('testDate', testDate);
      formData.append('summary', summary);
      if (file) {
        formData.append('reportFile', file);
      }

      await api.post('/lab-reports', formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload laboratory report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Diagnostic Laboratory Report"
      subtitle="Ingest validated test outcomes and attach certified report document"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#171B22] mb-1">Target Patient *</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.user.firstName} {p.user.lastName} ({p.user.email})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">Investigation Name *</label>
            <input
              type="text"
              placeholder="e.g. Complete Blood Count (CBC)"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
            >
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Radiology">Radiology</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Pathology">Pathology</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#171B22] mb-1">Test Date</label>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#171B22] mb-1">Diagnostic Summary / Clinical Findings</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            placeholder="e.g. Platelets normal, Hemoglobin 14.5 g/dL, no atypical cells observed"
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
          />
        </div>

        {/* File Attachment */}
        <div>
          <label className="block text-xs font-bold text-[#171B22] mb-1">Attach Certified File (PDF, PNG, JPG)</label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-[#9298A1] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#EBF5FE] file:text-[#329BFA] hover:file:bg-[#329BFA] hover:file:text-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F3F7]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#9298A1] hover:text-[#171B22] rounded-xl hover:bg-[#F5F6F8]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-[#329BFA] hover:bg-[#2486E3] disabled:opacity-50 rounded-xl shadow-sm transition-all"
          >
            {isSubmitting ? 'Uploading...' : 'Save & Ingest Report'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
