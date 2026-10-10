import React, { useState, useEffect } from 'react';
import { Microscope, Plus, Download, FileText, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { UploadLabModal } from '../../components/lab/UploadLabModal.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { LabReport } from '../../types/index.js';

export const LabReportsAdminPage: React.FC = () => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await api.get('/lab-reports?limit=50');
      if (res.success) setReports(res.data.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownload = (id: string, fileName: string = 'lab-report.pdf') => {
    window.open(`/api/lab-reports/${id}/file`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#171B22]">Diagnostic Laboratory Reports</h2>
          <p className="text-xs text-[#9298A1] mt-0.5">
            Certified pathology, radiology, hematology outcomes with private secure attachments
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2 bg-[#329BFA] hover:bg-[#2486E3] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Lab Report</span>
        </button>
      </div>

      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading laboratory reports..." />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={Microscope}
            title="No laboratory investigations recorded"
            description="Upload diagnostic lab outcomes to securely attach to patient clinical records."
            actionText="Upload Report"
            onAction={() => setIsUploadOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F3F7] text-[#9298A1] font-semibold">
                  <th className="pb-3 pl-2">Investigation Test</th>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Summary Findings</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 pl-2 font-bold text-[#171B22]">
                      {report.testName}
                    </td>
                    <td className="py-3.5 font-bold text-[#171B22]">
                      {report.patient?.user?.firstName} {report.patient?.user?.lastName}
                    </td>
                    <td className="py-3.5 text-[#329BFA] font-semibold">
                      {report.category}
                    </td>
                    <td className="py-3.5 text-[#9298A1]">
                      {new Date(report.testDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-[#171B22] max-w-xs truncate">
                      {report.summary || 'Findings archived'}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={report.status} size="sm" />
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      {report.filePath ? (
                        <button
                          onClick={() => handleDownload(report.id, report.fileName)}
                          className="px-2.5 py-1 rounded-xl bg-[#EBF5FE] text-[#329BFA] hover:bg-[#329BFA] hover:text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#9298A1]">Metadata Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UploadLabModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchReports}
      />
    </div>
  );
};
