import React, { useState, useEffect } from 'react';
import { Microscope, Download, FileText, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { LabReport } from '../../types/index.js';

export const PatientLabReportsPage: React.FC = () => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await api.get('/lab-reports/mine');
        if (res.success) setReports(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

  const handleDownload = (id: string) => {
    window.open(`/api/lab-reports/${id}/file`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[#171B22]">My Laboratory & Diagnostic Reports</h2>
        <p className="text-xs text-[#9298A1] mt-0.5">
          Access certified outcomes for blood panels, imaging, and diagnostic investigations
        </p>
      </div>

      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading your laboratory reports..." />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={Microscope}
            title="No laboratory reports available"
            description="Diagnostic test results released by the laboratory will be shown here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F3F7] text-[#9298A1] font-semibold">
                  <th className="pb-3 pl-2">Investigation Test</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Test Date</th>
                  <th className="pb-3">Summary Findings</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 pl-2 font-bold text-[#171B22]">
                      {report.testName}
                    </td>
                    <td className="py-3.5 text-[#329BFA] font-semibold">
                      {report.category}
                    </td>
                    <td className="py-3.5 text-[#9298A1]">
                      {new Date(report.testDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-[#171B22] max-w-sm truncate">
                      {report.summary || 'Findings verified by pathology lab.'}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={report.status} size="sm" />
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      {report.filePath ? (
                        <button
                          onClick={() => handleDownload(report.id)}
                          className="px-2.5 py-1 rounded-xl bg-[#EBF5FE] text-[#329BFA] hover:bg-[#329BFA] hover:text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>View PDF</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#9298A1]">Summary Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
