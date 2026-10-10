import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Stethoscope } from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { MedicalRecord } from '../../types/index.js';

export const PatientRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecords() {
      try {
        const res = await api.get('/medical-records/mine');
        if (res.success) setRecords(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecords();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[#171B22]">My Medical Records & Encounters</h2>
        <p className="text-xs text-[#9298A1] mt-0.5">
          Review clinical diagnoses, symptoms, and doctor consultation notes
        </p>
      </div>

      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading your clinical records..." />
        ) : records.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No medical records found"
            description="Your consultation summaries and diagnoses will be documented here after appointments."
          />
        ) : (
          <div className="space-y-4">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="p-5 rounded-2xl border border-[#E9EDF2] bg-[#F8FAFC] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E9EDF2] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF5FE] flex items-center justify-center text-[#329BFA]">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#171B22]">
                        Dr. {rec.doctor?.user?.firstName} {rec.doctor?.user?.lastName}
                      </h4>
                      <p className="text-xs text-[#329BFA] font-semibold">
                        {rec.doctor?.department?.name || 'Clinical Care'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#9298A1]">
                    Consultation: {new Date(rec.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-[#E9EDF2]">
                    <span className="font-bold text-[#171B22] block mb-1">Clinical Diagnosis:</span>
                    <p className="text-[#329BFA] font-semibold">{rec.diagnosis}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E9EDF2]">
                    <span className="font-bold text-[#171B22] block mb-1">Presenting Symptoms:</span>
                    <p className="text-[#171B22]">{rec.symptoms}</p>
                  </div>
                </div>

                {rec.physicalExamination && (
                  <div className="bg-white p-3 rounded-xl border border-[#E9EDF2] text-xs">
                    <span className="font-bold text-[#171B22] block mb-1">Physical Examination & Vitals:</span>
                    <p className="text-[#9298A1]">{rec.physicalExamination}</p>
                  </div>
                )}

                {rec.treatmentPlan && (
                  <div className="bg-white p-3 rounded-xl border border-[#E9EDF2] text-xs">
                    <span className="font-bold text-[#171B22] block mb-1">Treatment Plan & Medical Advice:</span>
                    <p className="text-[#9298A1]">{rec.treatmentPlan}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
