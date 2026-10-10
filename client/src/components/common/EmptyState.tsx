import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#EBF5FE] flex items-center justify-center text-[#329BFA] mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-[#171B22] mb-1">{title}</h4>
      <p className="text-xs text-[#9298A1] max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[#329BFA] hover:bg-[#2486E3] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading records...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-[#E9EDF2] border-t-[#329BFA] rounded-full animate-spin mb-3" />
      <p className="text-xs font-medium text-[#9298A1]">{message}</p>
    </div>
  );
};
