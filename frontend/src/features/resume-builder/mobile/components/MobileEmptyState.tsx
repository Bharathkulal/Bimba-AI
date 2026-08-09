import React from 'react';
import { HelpCircle } from 'lucide-react';

interface MobileEmptyStateProps {
  icon?: React.ComponentType<any>;
  title: string;
  description: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export const MobileEmptyState: React.FC<MobileEmptyStateProps> = ({
  icon: IconComponent = HelpCircle,
  title,
  description,
  actionLabel,
  onActionClick
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-white/5">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 mb-3 shadow-sm">
        <IconComponent size={20} />
      </div>

      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
        {title}
      </h4>
      <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1.5 max-w-[240px] leading-relaxed font-semibold">
        {description}
      </p>

      {actionLabel && onActionClick && (
        <button
          type="button"
          onClick={onActionClick}
          className="mt-4 px-4 py-2 bg-[#173404] dark:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-sm cursor-pointer transition active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
