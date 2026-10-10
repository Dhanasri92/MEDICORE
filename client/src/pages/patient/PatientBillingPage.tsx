import React, { useState, useEffect } from 'react';
import { CreditCard, Eye, CheckCircle } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { PaymentModal } from '../../components/billing/PaymentModal.js';
import { ReceiptModal } from '../../components/billing/ReceiptModal.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Bill } from '../../types/index.js';

export const PatientBillingPage: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);

  const fetchBills = async () => {
    try {
      const res = await api.get('/bills/mine');
      if (res.success) setBills(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[#171B22]">Billing & Payment Accounts</h2>
        <p className="text-xs text-[#9298A1] mt-0.5">
          View itemized medical invoices, settle payments via simulated test checkout, and obtain tax receipts
        </p>
      </div>

      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading your invoices..." />
        ) : bills.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No bills on record"
            description="You have no outstanding or past invoices with the hospital."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F3F7] text-[#9298A1] font-semibold">
                  <th className="pb-3 pl-2">Invoice #</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Paid Amount</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {bills.map((bill) => {
                  const outstanding = bill.totalAmount - bill.paidAmount;
                  return (
                    <tr key={bill.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 pl-2 font-mono font-bold text-[#171B22]">
                        {bill.billNumber}
                      </td>
                      <td className="py-3.5 font-bold text-[#171B22]">
                        ${bill.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 font-semibold text-emerald-600">
                        ${bill.paidAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 text-[#9298A1]">
                        {new Date(bill.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5">
                        <StatusBadge status={bill.status} size="sm" />
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {bill.status !== 'PAID' ? (
                            <button
                              onClick={() => {
                                setSelectedBill(bill);
                                setIsPaymentOpen(true);
                              }}
                              className="px-3 py-1 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                            >
                              Pay ${outstanding.toFixed(2)}
                            </button>
                          ) : (
                            <button
                              onClick={() => setReceiptBill(bill)}
                              className="px-2.5 py-1 rounded-xl bg-[#EBF5FE] text-[#329BFA] hover:bg-[#329BFA] hover:text-white font-bold text-xs inline-flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Receipt</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        bill={selectedBill}
        onSuccess={(paymentData) => {
          setReceiptBill(paymentData.bill);
          fetchBills();
        }}
      />

      <ReceiptModal
        isOpen={!!receiptBill}
        onClose={() => setReceiptBill(null)}
        bill={receiptBill}
      />
    </div>
  );
};
