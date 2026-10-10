import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, User, HardDrive } from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState.js';
import { api } from '../../api/client.js';
import { AuditLog } from '../../types/index.js';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await api.get('/admin/audit-logs?limit=50');
        if (res.success) setLogs(res.data.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#171B22]">Security & Regulatory Audit Trail</h2>
          <p className="text-xs text-[#9298A1] mt-0.5">
            Immutable system logs tracking sensitive patient records, billing transactions, and clinical actions
          </p>
        </div>
      </div>

      <div className="card-base p-6">
        {isLoading ? (
          <LoadingSpinner message="Loading audit trail entries..." />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No audit entries logged"
            description="All sensitive actions performed by users are cryptographically tracked here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F3F7] text-[#9298A1] font-semibold">
                  <th className="pb-3 pl-2">Timestamp</th>
                  <th className="pb-3">Actor / Role</th>
                  <th className="pb-3">Action Performed</th>
                  <th className="pb-3">Target Entity</th>
                  <th className="pb-3">Audit Details</th>
                  <th className="pb-3 pr-2 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 pl-2 font-mono text-[#9298A1]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 font-bold text-[#171B22]">
                      <div>{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</div>
                      <span className="text-[10px] text-[#329BFA] font-semibold">{log.userRole || 'SYSTEM'}</span>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-[#171B22]">
                      <span className="px-2 py-0.5 rounded-md bg-[#F5F6F8] border border-[#E9EDF2]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 text-[#329BFA] font-semibold">
                      {log.entity}
                    </td>
                    <td className="py-3.5 text-[#171B22] max-w-sm truncate">
                      {log.details || 'N/A'}
                    </td>
                    <td className="py-3.5 pr-2 text-right font-mono text-[#9298A1]">
                      {log.ipAddress || '127.0.0.1'}
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
