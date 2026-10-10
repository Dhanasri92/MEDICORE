import React, { useState, useEffect } from 'react';
import { Pill, Printer, FileText } from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Prescription } from '../../types/index.js';

export const PatientPrescriptionsPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrescriptions() {
      try {
        const res = await api.get('/prescriptions/mine');
        if (res.success) setPrescriptions(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPrescriptions();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#171B22]">My Prescriptions</h2>
          <p className="text-xs text-[#9298A1] mt-0.5">
            Issued medication regimens, dosages, frequency, and instructions
          </p>
        </div>

        {prescriptions.length > 0 && (
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#F5F6F8] hover:bg-[#EBF5FE] text-[#329BFA] text-xs font-bold rounded-xl flex items-center gap-1.5 border border-[#E9EDF2] transition-colors no-print"
          >
            <Printer className="w-4 h-4" />
            <span>Print Prescriptions</span>
          </button>
        )}
      </div>

      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading your prescriptions..." />
        ) : prescriptions.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="No prescriptions on file"
            description="Prescriptions issued by your doctor will be available here for pharmacy refill."
          />
        ) : (
          <div className="space-y-6">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-5 rounded-2xl border border-[#E9EDF2] bg-[#F8FAFC] space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E9EDF2] pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#171B22]">
                      Prescribed by Dr. {rx.doctor?.user?.firstName} {rx.doctor?.user?.lastName}
                    </h4>
                    <p className="text-xs text-[#9298A1]">
                      Diagnosis: {rx.medicalRecord?.diagnosis || 'Clinical Assessment'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#9298A1]">
                      Issued: {new Date(rx.prescribedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rx.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white rounded-xl border border-[#E9EDF2] text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#171B22] text-sm">
                          {item.medicineName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#EBF5FE] text-[#329BFA] font-bold text-[11px]">
                          {item.dosage}
                        </span>
                      </div>
                      <div className="text-[#9298A1] mt-1">
                        Schedule: <span className="text-[#171B22] font-semibold">{item.frequency}</span>
                      </div>
                      <div className="text-[#9298A1]">
                        Duration: <span className="text-[#171B22] font-semibold">{item.duration}</span>
                      </div>
                      {item.instructions && (
                        <div className="text-[#9298A1] italic mt-1.5 pt-1.5 border-t border-[#F5F6F8]">
                          {item.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {rx.notes && (
                  <p className="text-xs text-[#9298A1] italic pt-1 border-t border-[#E9EDF2]">
                    Doctor Note: {rx.notes}
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
