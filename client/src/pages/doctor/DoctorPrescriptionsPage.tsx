import React, { useState, useEffect } from 'react';
import { Pill, Printer, FileText } from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Prescription } from '../../types/index.js';

export const DoctorPrescriptionsPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrescriptions() {
      try {
        const res = await api.get('/prescriptions/doctor');
        if (res.success) setPrescriptions(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPrescriptions();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[#171B22]">Issued Electronic Prescriptions</h2>
        <p className="text-xs text-[#9298A1] mt-0.5">
          Review medication orders, dosage regimens, and patient pharmacology instructions
        </p>
      </div>

      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading issued prescriptions..." />
        ) : prescriptions.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="No prescriptions issued yet"
            description="Prescriptions authored during clinical consultations will appear here."
          />
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-5 rounded-2xl border border-[#E9EDF2] bg-[#F8FAFC] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E9EDF2] pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#171B22]">
                      Patient: {rx.patient?.user?.firstName} {rx.patient?.user?.lastName}
                    </h4>
                    <p className="text-xs text-[#9298A1]">
                      Diagnosis: {rx.medicalRecord?.diagnosis || 'Encounter Assessment'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#9298A1]">
                      Prescribed: {new Date(rx.prescribedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Medication Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rx.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-xl border border-[#E9EDF2] text-xs"
                    >
                      <div className="font-bold text-[#171B22] flex items-center justify-between">
                        <span>{item.medicineName}</span>
                        <span className="text-[#329BFA]">{item.dosage}</span>
                      </div>
                      <div className="text-[#9298A1] mt-1">
                        Frequency: <span className="text-[#171B22] font-medium">{item.frequency}</span>
                      </div>
                      <div className="text-[#9298A1]">
                        Duration: <span className="text-[#171B22] font-medium">{item.duration}</span>
                      </div>
                      {item.instructions && (
                        <div className="text-[#9298A1] italic mt-1">
                          Note: {item.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {rx.notes && (
                  <p className="text-xs text-[#9298A1] italic">
                    Physician Note: {rx.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
