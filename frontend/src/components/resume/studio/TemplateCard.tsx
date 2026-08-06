import React from 'react';
import { Eye, Heart, Check } from 'lucide-react';

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    atsScore: number;
    category: string;
    columns: string;
    badge: string;
    thumbnail: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative overflow-hidden bg-slate-50 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
        isSelected ? 'border-[#14532D] ring-2 ring-[#14532D]/10' : 'border-slate-200 hover:border-slate-350 shadow-sm'
      }`}
    >
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img 
          src={template.thumbnail} 
          alt={template.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Eye Preview & Favorite Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); }} 
            className="p-2 bg-white text-slate-800 rounded-xl shadow hover:scale-105 transition-all cursor-pointer"
          >
            <Eye size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); }} 
            className="p-2 bg-white text-rose-500 rounded-xl shadow hover:scale-105 transition-all cursor-pointer"
          >
            <Heart size={14} fill="currentColor" />
          </button>
        </div>

        {/* ATS Score & Badge info */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-10">
          <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-500 text-white rounded">
            {template.atsScore}% ATS
          </span>
          {template.badge && (
            <span className="text-[8px] font-black px-1.5 py-0.5 bg-[#14532D] text-white rounded">
              {template.badge}
            </span>
          )}
        </div>

        {isSelected && (
          <div className="absolute top-2.5 right-2.5 bg-[#14532D] text-white p-1 rounded-full shadow z-10">
            <Check size={12} strokeWidth={3} />
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-100 flex justify-between items-center text-left">
        <div>
          <h4 className="font-extrabold text-xs text-slate-800 group-hover:text-[#14532D] transition-colors">
            {template.name}
          </h4>
          <p className="text-[9px] text-slate-450 mt-0.5 font-bold">
            {template.columns} • ATS Compatible
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
