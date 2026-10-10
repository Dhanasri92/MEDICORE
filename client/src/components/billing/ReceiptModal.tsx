import React from 'react';
import { Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Bill } from '../../types/index.js';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  bill,
}) => {
  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const latestPayment = bill.payments?.[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Hospital Tax Receipt"
      subtitle={`Receipt #${bill.billNumber}`}
      maxWidth="lg"
    >
      <div className="space-y-4 print:p-6">
        {/* Success header */}
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs">
          <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold text-sm">Payment Verified & Settled</div>
            <div className="text-[11px] text-emerald-700">
              Ref: {latestPayment?.transactionRef || 'TXN-SETTLED'} • Method: {latestPayment?.paymentMethod || 'DIGITAL'}
            </div>
          </div>
        </div>

        {/* Receipt content */}
        <div className="border border-[#E9EDF2] rounded-2xl p-4 bg-white space-y-4 text-xs">
          {/* Hospital Header */}
          <div className="flex justify-between items-start pb-3 border-b border-[#F0F3F7]">
            <div>
              <h2 className="text-base font-extrabold text-[#171B22]">MEDICORE HOSPITAL</h2>
              <p className="text-[11px] text-[#9298A1]">Department of Patient Accounts & Billing</p>
              <p className="text-[11px] text-[#9298A1]">100 Medical Center Parkway, NY 10001</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                PAID IN FULL
              </span>
              <p className="text-[11px] text-[#9298A1] mt-1">
                Date: {new Date(bill.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[#9298A1]">Patient Name:</span>
              <p className="font-bold text-[#171B22]">
                {bill.patient?.user?.firstName} {bill.patient?.user?.lastName}
              </p>
            </div>
            <div>
              <span className="text-[#9298A1]">Invoice Token:</span>
              <p className="font-bold text-[#171B22]">{bill.billNumber}</p>
            </div>
          </div>

          {/* Line items table */}
          <div className="border-t border-[#F0F3F7] pt-3">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[#9298A1] text-[11px] border-b border-[#F0F3F7]">
                  <th className="pb-1">Description</th>
                  <th className="pb-1 text-center">Qty</th>
                  <th className="pb-1 text-right">Price</th>
                  <th className="pb-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {bill.items?.map((item) => (
                  <tr key={item.id} className="text-[#171B22]">
                    <td className="py-1.5">{item.description}</td>
                    <td className="py-1.5 text-center">{item.quantity}</td>
                    <td className="py-1.5 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="py-1.5 text-right font-medium">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-[#E9EDF2] pt-3 space-y-1 text-right text-xs">
            <div className="flex justify-between text-[#9298A1]">
              <span>Subtotal:</span>
              <span>${bill.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#9298A1]">
              <span>Tax (5%):</span>
              <span>${bill.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#171B22] border-t border-[#F0F3F7] pt-1">
              <span>Gross Total Paid:</span>
              <span className="text-emerald-600">${bill.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Print & Close */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F0F3F7] no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#9298A1] hover:text-[#171B22] rounded-xl hover:bg-[#F5F6F8]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-white bg-[#329BFA] hover:bg-[#2486E3] rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
