import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, AlertCircle, ThermometerSnowflake, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { HospitalNotice } from '../../types/index.js';

export const NoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<HospitalNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'MAINTENANCE' | 'GENERAL' | 'HOLIDAY' | 'EMERGENCY'>('MAINTENANCE');
  const [reporter, setReporter] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      if (res.success) setNotices(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.post('/notices', { title, content, type, reporter, priority });
      setIsAddOpen(false);
      setTitle('');
      setContent('');
      setReporter('');
      fetchNotices();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to publish notice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.delete(`/notices/${id}`);
      setNotices(notices.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#171B22]">Hospital Reports & Operational Notices</h2>
          <p className="text-xs text-[#9298A1] mt-0.5">
            Real-time facility maintenance tickets, personnel notices, and operational bulletins
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-[#329BFA] hover:bg-[#2486E3] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Report</span>
        </button>
      </div>

      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading notices..." />
        ) : notices.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No operational notices posted"
            description="All hospital wings operating with zero pending maintenance or scheduling tickets."
            actionText="Post Report"
            onAction={() => setIsAddOpen(true)}
          />
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="p-4 rounded-2xl border border-[#E9EDF2] bg-[#F8FAFC] flex items-center justify-between gap-4 hover:border-[#329BFA]/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E9EDF2] flex items-center justify-center text-[#329BFA] shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#171B22]">{notice.title}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        {notice.type}
                      </span>
                    </div>
                    <p className="text-xs text-[#9298A1] mt-0.5">{notice.content}</p>
                    <div className="text-[11px] text-[#9298A1] mt-1">
                      Reported by {notice.reporter || 'Staff'} • {new Date(notice.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDismiss(notice.id)}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Archive / Dismiss notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Notice Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Post Hospital Operational Notice"
        subtitle="Log facility maintenance request or department announcement"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Room 501 AC is not working"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Category *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              >
                <option value="MAINTENANCE">Maintenance</option>
                <option value="GENERAL">General Notice</option>
                <option value="HOLIDAY">Holiday / Leave</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#171B22] mb-1">Reported By</label>
              <input
                type="text"
                placeholder="e.g. Steve"
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171B22] mb-1">Report Description *</label>
            <textarea
              rows={3}
              required
              placeholder="Details of the issue or announcement"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F6F8] border border-[#E9EDF2]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F3F7]">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#9298A1] hover:text-[#171B22] rounded-xl hover:bg-[#F5F6F8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#329BFA] hover:bg-[#2486E3] disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
