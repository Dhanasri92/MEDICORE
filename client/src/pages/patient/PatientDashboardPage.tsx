import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  CreditCard,
  Plus,
  Stethoscope,
  ChevronRight,
  AlertCircle,
  Pill,
} from 'lucide-react';
import { SummaryCard } from '../../components/common/SummaryCard.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal.js';
import { PaymentModal } from '../../components/billing/PaymentModal.js';
import { ReceiptModal } from '../../components/billing/ReceiptModal.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Appointment, Bill, Prescription } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const PatientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);

  const fetchPatientData = async () => {
    try {
      const [analyticsRes, billsRes] = await Promise.all([
        api.get('/analytics/patient'),
        api.get('/bills/mine'),
      ]);
      if (analyticsRes.success) setData(analyticsRes.data);
      if (billsRes.success) setBills(billsRes.data || []);
    } catch (err) {
      console.error('Failed to load patient dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading your health portal..." />;
  }

  const nextAppt: Appointment | null = data?.nextAppointment || null;
  const recentPrescriptions: Prescription[] = data?.recentPrescriptions || [];
  const unpaidBills = bills.filter((b) => b.status !== 'PAID');

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Calendar}
          value={data?.upcomingAppointments ?? 0}
          label="Upcoming Visits"
          trendText="Confirmed consultations"
          theme="teal"
        />

        <SummaryCard
          icon={Clock}
          value={data?.completedAppointments ?? 0}
          label="Past Visits"
          trendText="Completed medical encounters"
          theme="amber"
        />

        <SummaryCard
          icon={FileText}
          value={data?.availableLabReports ?? 0}
          label="Lab Reports"
          trendText="Certified diagnostic results"
          theme="pink"
        />

        <SummaryCard
          icon={CreditCard}
          value={`$${(data?.outstandingBalance || 0).toFixed(2)}`}
          label="Outstanding Balance"
          trendText="Pending invoices"
          theme="blue"
        />
      </div>

      {/* Next Appointment Card + Quick Book CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Scheduled Visit (2 columns) */}
        <div className="card-base p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#171B22]">Upcoming Consultation</h3>
              <p className="text-xs text-[#9298A1] mt-0.5">Your next clinical appointment details</p>
            </div>
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="px-4 py-2 bg-[#329BFA] hover:bg-[#2486E3] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>

          {nextAppt ? (
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E9EDF2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#EBF5FE] shrink-0 border border-[#E9EDF2]">
                  {nextAppt.doctor?.user?.avatar ? (
                    <img
                      src={nextAppt.doctor.user.avatar}
                      alt={nextAppt.doctor.user.lastName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-[#329BFA]">
                      Dr
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#171B22]">
                    Dr. {nextAppt.doctor?.user?.firstName} {nextAppt.doctor?.user?.lastName}
                  </div>
                  <div className="text-xs text-[#9298A1]">
                    {nextAppt.doctor?.specialization} • {nextAppt.doctor?.department?.name}
                  </div>
                  <div className="text-xs text-[#329BFA] font-semibold mt-1">
                    Room: {nextAppt.doctor?.roomNumber || 'Main Consultation Wing'}
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E9EDF2]">
                <div className="text-sm font-extrabold text-[#171B22]">
                  {nextAppt.appointmentDate} at {nextAppt.timeSlot}
                </div>
                <div className="mt-1">
                  <StatusBadge status={nextAppt.status} size="sm" />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#F8FAFC] rounded-2xl border border-[#E9EDF2]">
              <Calendar className="w-8 h-8 text-[#9298A1] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#171B22]">No upcoming visits scheduled</p>
              <p className="text-[11px] text-[#9298A1] mt-1">
                Schedule a consultation with our experienced physicians anytime.
              </p>
            </div>
          )}
        </div>

        {/* Pending Invoices Settlement Station */}
        <div className="card-base p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-[#171B22]">Pending Bills</h3>
            <span className="text-xs font-bold text-[#FF5E7E]">
              {unpaidBills.length} Unpaid
            </span>
          </div>

          {unpaidBills.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#9298A1]">
              All hospital accounts are settled. No outstanding invoices.
            </div>
          ) : (
            <div className="space-y-3">
              {unpaidBills.slice(0, 3).map((bill) => {
                const bal = bill.totalAmount - bill.paidAmount;
                return (
                  <div
                    key={bill.id}
                    className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E9EDF2] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#171B22]">
                        {bill.billNumber}
                      </div>
                      <div className="text-[11px] text-[#9298A1]">
                        Due {new Date(bill.dueDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs font-extrabold text-[#329BFA] mt-0.5">
                        ${bal.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedBill(bill);
                        setIsPaymentOpen(true);
                      }}
                      className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      Pay Now
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Prescriptions View */}
      <div className="card-base p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#171B22]">Recent Prescriptions</h3>
          <span className="text-xs font-semibold text-[#9298A1]">
            Active Medication Regimens
          </span>
        </div>

        {recentPrescriptions.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="No active prescriptions"
            description="Prescribed medications from your doctor visits will appear here for easy printing and pharmacy refill."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentPrescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-4 rounded-2xl border border-[#E9EDF2] bg-[#F8FAFC] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#171B22]">
                      Dr. {rx.doctor?.user?.lastName}
                    </span>
                    <span className="text-[10px] text-[#9298A1]">
                      {new Date(rx.prescribedDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1.5 my-2">
                    {rx.items?.map((item) => (
                      <div key={item.id} className="text-xs">
                        <span className="font-bold text-[#171B22]">{item.medicineName}</span>{' '}
                        <span className="text-[#329BFA]">({item.dosage})</span>
                        <div className="text-[11px] text-[#9298A1]">{item.frequency} • {item.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {rx.notes && (
                  <p className="text-[11px] text-[#9298A1] italic mt-2 border-t border-[#E9EDF2] pt-2">
                    Note: {rx.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={() => {
          fetchPatientData();
        }}
        patientId={user?.patientId}
      />

      {/* Simulated Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        bill={selectedBill}
        onSuccess={(paymentData) => {
          setReceiptBill(paymentData.bill);
          fetchPatientData();
        }}
      />

      {/* Official Tax Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptBill}
        onClose={() => setReceiptBill(null)}
        bill={receiptBill}
      />
    </div>
  );
};
