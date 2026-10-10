import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Eye, Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { ReceiptModal } from '../../components/billing/ReceiptModal.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { Bill, Patient } from '../../types/index.js';

export const BillingManagementPage: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewReceiptBill, setViewReceiptBill] = useState<Bill | null>(null);

  // Create Bill Form
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [lineItems, setLineItems] = useState([
    { description: 'Specialist Outpatient Consultation', quantity: 1, unitPrice: 120.0 },
    { description: 'Routine Pathology & Biochemistry Panel', quantity: 1, unitPrice: 65.0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchBills = async () => {
    try {
      const [billsRes, patientsRes] = await Promise.all([
        api.get('/bills?limit=50'),
        api.get('/patients?limit=50'),
      ]);
      if (billsRes.success) setBills(billsRes.data.bills || []);
      if (patientsRes.success) {
        setPatients(patientsRes.data.patients || []);
        if (patientsRes.data.patients?.length > 0 && !selectedPatientId) {
          setSelectedPatientId(patientsRes.data.patients[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleAddItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, field: string, val: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = val;
    setLineItems(updated);
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setErrorMessage('Please select a patient.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.post('/bills', {
        patientId: selectedPatientId,
        dueDate,
        items: lineItems.map((i) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
        taxPercent: 5,
      });

      setIsCreateOpen(false);
      fetchBills();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create hospital invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#171B22]">Hospital Billing & Accounts</h2>
          <p className="text-xs text-[#9298A1] mt-0.5">
            Manage patient invoices, itemized charges, and inspect verified receipts
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-[#329BFA] hover:bg-[#2486E3] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Bill</span>
        </button>
      </div>

      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading hospital invoices..." />
        ) : bills.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No billing records found"
            description="Create an invoice for any patient encounter or investigation."
            actionText="Create Bill"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F3F7] text-[#9298A1] font-semibold">
                  <th className="pb-3 pl-2">Invoice #</th>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Paid Amount</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 pl-2 font-mono font-bold text-[#171B22]">
                      {bill.billNumber}
                    </td>
                    <td className="py-3.5 font-bold text-[#171B22]">
                      {bill.patient?.user?.firstName} {bill.patient?.user?.lastName}
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
                      <button
                        onClick={() => setViewReceiptBill(bill)}
                        className="px-2.5 py-1 rounded-xl bg-[#F5F6F8] hover:bg-[#EBF5FE] text-[#329BFA] font-bold text-xs inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Bill Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generate Itemized Hospital Invoice"
        subtitle="Itemize consultations, diagnostic procedures, medications, or facility charges"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBill} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Patient *</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user.firstName} {p.user.lastName} ({p.user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Payment Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#171B22]">Itemized Charges *</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-[#329BFA] hover:underline"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Description of hospital service"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                    required
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
                  />
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                    className="w-16 px-2 py-1.5 text-xs text-center rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                    required
                    className="w-24 px-2 py-1.5 text-xs text-right rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F3F7]">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#9298A1] hover:text-[#171B22] rounded-xl hover:bg-[#F5F6F8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#329BFA] hover:bg-[#2486E3] disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? 'Calculating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Receipt Modal */}
      <ReceiptModal
        isOpen={!!viewReceiptBill}
        onClose={() => setViewReceiptBill(null)}
        bill={viewReceiptBill}
      />
    </div>
  );
};
