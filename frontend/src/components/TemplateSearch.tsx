import React from 'react';
import { Search, X } from 'lucide-react';

interface TemplateSearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const TemplateSearch: React.FC<TemplateSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search templates by name, recommended roles, industry...',
}) => {
  return (
    <div className="relative w-full max-w-xl">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
        <Search size={16} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950/20 focus:border-slate-400 transition-all text-xs font-bold text-slate-900 placeholder:text-slate-400"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-900 cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
