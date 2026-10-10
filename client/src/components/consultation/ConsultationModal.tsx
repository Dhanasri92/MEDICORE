import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle, FileText, Pill } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { api } from '../../api/client.js';
import { Appointment } from '../../types/index.js';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: Appointment | null;
}

interface MedicationDraft {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  appointment,
}) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [physicalExamination, setPhysicalExamination] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [includePrescription, setIncludePrescription] = useState(true);

  const [medications, setMedications] = useState<MedicationDraft[]>([
    {
      medicineName: 'Amoxicillin Trihydrate',
      dosage: '500 mg',
      frequency: 'Three times daily after food',
      duration: '7 Days',
      instructions: 'Complete full course even if symptoms improve.',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!appointment) return null;

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      {
        medicineName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, idx) => idx !== index));
  };

  const handleUpdateMedication = (index: number, field: keyof MedicationDraft, val: string) => {
    const updated = [...medications];
    updated[index][field] = val;
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim() || !symptoms.trim()) {
      setErrorMessage('Diagnosis and presenting symptoms are mandatory clinical documentation.');
      return;
    }

    if (includePrescription) {
      const invalid = medications.some(
        (m) => !m.medicineName.trim() || !m.dosage.trim() || !m.frequency.trim() || !m.duration.trim()
      );
      if (invalid) {
        setErrorMessage('All medication items require medicine name, dosage, frequency, and duration.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.post('/medical-records', {
        appointmentId: appointment.id,
        diagnosis,
        symptoms,
        physicalExamination,
        treatmentPlan,
        prescription: includePrescription
          ? {
              notes: prescriptionNotes,
              items: medications,
            }
          : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit clinical consultation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clinical Encounter Documentation"
      subtitle={`Patient: ${appointment.patient.user.firstName} ${appointment.patient.user.lastName} (Token: ${appointment.appointmentNumber})`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Symptoms & Diagnosis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">
              Presenting Symptoms *
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              required
              rows={2}
              placeholder="e.g. Headache, fever for 3 days, cough..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">
              Clinical Diagnosis *
            </label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
              rows={2}
              placeholder="e.g. Acute upper respiratory infection..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
            />
          </div>
        </div>

        {/* Vitals / Physical Examination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">
              Physical Examination & Vitals
            </label>
            <input
              type="text"
              value={physicalExamination}
              onChange={(e) => setPhysicalExamination(e.target.value)}
              placeholder="e.g. BP: 120/80, HR: 72 bpm, SpO2: 98%"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">
              Treatment Plan & Clinical Advice
            </label>
            <input
              type="text"
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              placeholder="e.g. Bed rest, adequate hydration, follow up in 1 week"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2] text-[#171B22] focus:outline-none focus:ring-2 focus:ring-[#329BFA]/30"
            />
          </div>
        </div>

        {/* Prescription Section Toggle */}
        <div className="pt-2 border-t border-[#F0F3F7]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-[#329BFA]" />
              <span className="text-xs font-bold text-[#171B22]">Itemized Electronic Prescription</span>
            </div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#9298A1] cursor-pointer">
              <input
                type="checkbox"
                checked={includePrescription}
                onChange={(e) => setIncludePrescription(e.target.checked)}
                className="rounded border-[#E9EDF2] text-[#329BFA] focus:ring-[#329BFA]"
              />
              <span>Issue Prescription</span>
            </label>
          </div>

          {includePrescription && (
            <div className="space-y-3 bg-[#F8FAFC] p-3 rounded-2xl border border-[#E9EDF2]">
              {medications.map((med, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-[#E9EDF2] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#329BFA]">Medication #{idx + 1}</span>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Drug / Medicine Name"
                        value={med.medicineName}
                        onChange={(e) => handleUpdateMedication(idx, 'medicineName', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#F5F6F8] border border-[#E9EDF2]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg)"
                        value={med.dosage}
                        onChange={(e) => handleUpdateMedication(idx, 'dosage', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#F5F6F8] border border-[#E9EDF2]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Duration (e.g. 7 Days)"
                        value={med.duration}
                        onChange={(e) => handleUpdateMedication(idx, 'duration', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#F5F6F8] border border-[#E9EDF2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Frequency (e.g. 2 times daily after food)"
                      value={med.frequency}
                      onChange={(e) => handleUpdateMedication(idx, 'frequency', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#F5F6F8] border border-[#E9EDF2]"
                    />
                    <input
                      type="text"
                      placeholder="Special Instructions (e.g. Take with water)"
                      value={med.instructions}
                      onChange={(e) => handleUpdateMedication(idx, 'instructions', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#F5F6F8] border border-[#E9EDF2]"
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="px-3 py-1.5 rounded-xl border border-dashed border-[#329BFA] text-[#329BFA] hover:bg-[#EBF5FE] text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Medication</span>
                </button>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="General Pharmacy / Dietary Advice (optional)"
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-[#E9EDF2]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
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
            {isSubmitting ? 'Saving Encounter...' : 'Complete Encounter & Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
