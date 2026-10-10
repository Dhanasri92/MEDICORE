import React, { useState } from 'react';
import { CreditCard, Smartphone, Building, Banknote, ShieldCheck, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { api } from '../../api/client.js';
import { Bill } from '../../types/index.js';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  bill: Bill | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bill,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'UPI' | 'NET_BANKING' | 'CASH'>('CREDIT_CARD');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [expiry, setExpiry] = useState('08/29');
  const [cvv, setCvv] = useState('412');
  const [upiId, setUpiId] = useState('patient@okhdfcbank');
  const [bankName, setBankName] = useState('Chase Health Services');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!bill) return null;

  const outstanding = Number((bill.totalAmount - bill.paidAmount).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await api.post(`/bills/${bill.id}/payments`, {
        amount: outstanding,
        paymentMethod,
        notes: `Simulated via ${paymentMethod}`,
      });

      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hospital Bill Settlement"
      subtitle={`Invoice #${bill.billNumber} • Outstanding Balance: $${outstanding.toFixed(2)}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Clearly Labelled Simulation Banner */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-800 text-xs">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Simulated Payment Environment: </span>
            This is an academic demo simulation. No actual credit card or bank funds will be transferred.
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Invoice Summary Box */}
        <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E9EDF2] space-y-2 text-xs">
          <div className="font-bold text-[#171B22] mb-1">Itemized Summary:</div>
          {bill.items.map((item) => (
            <div key={item.id} className="flex justify-between text-[#9298A1]">
              <span>{item.description} (x{item.quantity})</span>
              <span className="font-semibold text-[#171B22]">${item.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-[#E9EDF2] pt-2 flex justify-between text-[#9298A1]">
            <span>Subtotal</span>
            <span>${bill.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#9298A1]">
            <span>Hospital Tax (5%)</span>
            <span>${bill.tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-[#E9EDF2] pt-2 flex justify-between font-bold text-sm text-[#171B22]">
            <span>Total Payable Now</span>
            <span className="text-[#329BFA]">${outstanding.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-[#171B22] mb-2">
            Select Payment Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCard },
              { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
              { id: 'NET_BANKING', label: 'Net Banking', icon: Building },
              { id: 'CASH', label: 'Cash Demo', icon: Banknote },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'border-[#329BFA] bg-[#EBF5FE] text-[#329BFA] font-bold shadow-sm'
                      : 'border-[#E9EDF2] bg-white text-[#9298A1] hover:text-[#171B22] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px]">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Payment Fields */}
        {paymentMethod === 'CREDIT_CARD' && (
          <div className="space-y-3 bg-[#F8FAFC] p-3 rounded-2xl border border-[#E9EDF2]">
            <div>
              <label className="block text-[11px] font-bold text-[#171B22] mb-1">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-[#E9EDF2]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#171B22] mb-1">Expiry Date</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-[#E9EDF2]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#171B22] mb-1">CVV</label>
                <input
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-[#E9EDF2]"
                />
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'UPI' && (
          <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E9EDF2]">
            <label className="block text-[11px] font-bold text-[#171B22] mb-1">Virtual Payment Address (VPA)</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-[#E9EDF2]"
            />
          </div>
        )}

        {paymentMethod === 'NET_BANKING' && (
          <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E9EDF2]">
            <label className="block text-[11px] font-bold text-[#171B22] mb-1">Bank Branch</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-[#E9EDF2]"
            />
          </div>
        )}

        {paymentMethod === 'CASH' && (
          <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E9EDF2] text-xs text-[#9298A1]">
            Cash transaction simulated at hospital billing front desk. Cashier receipt will be recorded automatically.
          </div>
        )}

        {/* Buttons */}
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
            className="px-5 py-2 text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 rounded-xl shadow-sm transition-all"
          >
            {isSubmitting ? 'Processing...' : `Authorize Demo Payment ($${outstanding.toFixed(2)})`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
