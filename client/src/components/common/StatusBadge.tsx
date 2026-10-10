import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  CONFIRMED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  COMPLETED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  NO_SHOW: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  UNPAID: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  PARTIALLY_PAID: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normStatus = status?.toUpperCase() || 'UNKNOWN';
  const config = statusColorMap[normStatus] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  };

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${config.bg} ${config.text} ${
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {normStatus.replace(/_/g, ' ')}
    </span>
  );
};
