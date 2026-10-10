import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trendText?: string;
  theme: 'teal' | 'amber' | 'pink' | 'blue';
}

const themeStyles = {
  teal: {
    iconBg: 'bg-[#E6F9F7]',
    iconColor: 'text-[#00C2B2]',
    trendColor: 'text-[#00C2B2]',
  },
  amber: {
    iconBg: 'bg-[#FFF5EB]',
    iconColor: 'text-[#FF9F43]',
    trendColor: 'text-[#FF9F43]',
  },
  pink: {
    iconBg: 'bg-[#FFEBF0]',
    iconColor: 'text-[#FF5E7E]',
    trendColor: 'text-[#FF5E7E]',
  },
  blue: {
    iconBg: 'bg-[#EBF5FE]',
    iconColor: 'text-[#329BFA]',
    trendColor: 'text-[#329BFA]',
  },
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  icon: Icon,
  value,
  label,
  trendText,
  theme,
}) => {
  const styles = themeStyles[theme];

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E9EDF2] shadow-card hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-center gap-4">
        {/* Rounded Icon Circle */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${styles.iconBg}`}>
          <Icon className={`w-6 h-6 ${styles.iconColor}`} />
        </div>

        {/* Value and Label */}
        <div>
          <div className="text-2xl font-bold tracking-tight text-[#171B22]">{value}</div>
          <div className="text-sm font-medium text-[#9298A1]">{label}</div>
        </div>
      </div>

      {/* Trend text at bottom if provided */}
      {trendText && (
        <div className="mt-4 pt-3 border-t border-[#F2F5F8] text-xs font-medium text-[#9298A1] flex items-center gap-1.5">
          <span className={`font-semibold ${styles.trendColor}`}>
            {trendText.split(' ')[0]}
          </span>
          <span>{trendText.split(' ').slice(1).join(' ')}</span>
        </div>
      )}
    </div>
  );
};
