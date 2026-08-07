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
      className={`group relative overflow-hidden bg-white rounded-lg border cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-[#0F4A3C] border-2' : 'border-[#E5E5E2]'
      }`}
    >
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img 
          src={template.thumbnail} 
          alt={template.name} 
          className="w-full h-full object-cover"
        />

        {/* ATS Score & Badge info */}
        <div className="absolute top-2 left-2 flex gap-1 z-10">
          <span className="text-[8px] font-black px-1.5 py-0.5 bg-[#0F4A3C]/10 text-[#0F4A3C] rounded-md border border-[#0F4A3C]/20">
            {template.atsScore}% ATS
          </span>
        </div>

        {isSelected && (
          <div className="absolute top-2 right-2 bg-[#0F4A3C] text-white p-1 rounded-full z-10">
            <Check size={10} strokeWidth={3} />
          </div>
        )}
      </div>

      <div className="p-2.5 bg-white border-t border-[#E5E5E2] flex justify-between items-center text-left">
        <div>
          <h4 className="font-extrabold text-[11px] text-[#1A1A1A] group-hover:text-[#0F4A3C] transition-colors">
            {template.name}
          </h4>
          <p className="text-[9px] text-[#6B6B68] mt-0.5 font-semibold">
            {template.columns} • ATS Compatible
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
