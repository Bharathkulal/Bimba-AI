import React from 'react';

interface StickyActionBarProps {
  primaryLabel: string;
  onPrimaryClick: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  secondaryDisabled?: boolean;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  primaryLabel,
  onPrimaryClick,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onSecondaryClick,
  secondaryDisabled = false,
}) => {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-4 py-4 z-40 flex items-center gap-3 transition-colors duration-200"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      {secondaryLabel && onSecondaryClick && (
        <button
          type="button"
          onClick={onSecondaryClick}
          disabled={secondaryDisabled || primaryLoading}
          className="flex-1 min-h-[46px] flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-black text-xs transition active:bg-slate-50 dark:active:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {secondaryLabel}
        </button>
      )}
      
      <button
        type="button"
        onClick={onPrimaryClick}
        disabled={primaryDisabled || primaryLoading}
        className="flex-grow flex-1 min-h-[46px] flex items-center justify-center gap-2 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black text-xs transition active:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {primaryLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {primaryLabel}
      </button>
    </div>
  );
};
