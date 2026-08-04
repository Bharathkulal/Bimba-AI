import React from 'react';
import { Eye, Check, Columns, Info } from 'lucide-react';
import type { ResumeTemplate } from '../services/templates';

import { TemplateBadge } from './TemplateBadge';
import { ATSBadge } from './ATSBadge';

interface TemplateCardProps {
  template: ResumeTemplate;
  isSelected?: boolean;
  onSelect: (template: ResumeTemplate) => void;
  onPreview: (template: ResumeTemplate) => void;
  onCompare?: (template: ResumeTemplate) => void;
  isComparing?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected = false,
  onSelect,
  onPreview,
  onCompare,
  isComparing = false,
}) => {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white border transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 ${
        isSelected
          ? 'border-slate-900 ring-2 ring-slate-950/20'
          : 'border-slate-100 hover:border-slate-300'
      }`}
    >
      {/* Badges Container */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        {template.featured && <TemplateBadge type="featured" />}
        {template.premium && <TemplateBadge type="premium" />}
        {template.atsFriendly && <TemplateBadge type="ats" />}
      </div>

      {/* ATS score overlay */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <ATSBadge score={template.atsScore} size="sm" />
      </div>

      {/* Image Preview Window */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50 border-b border-slate-100">
        {/* Placeholder gradient / image */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white flex items-center justify-center">
          {template.previewImage ? (
            <img
              src={template.previewImage}
              alt={template.name}
              className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                // If standard demo URL fails, draw template details as visual mockup representation
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : null}
          
          {/* Abstract layout mock */}
          <div className="absolute inset-0 p-6 flex flex-col justify-between opacity-80 group-hover:opacity-100 transition-opacity">
            <div className="w-full h-8 border-b border-dashed border-slate-300 flex items-center justify-between">
              <div className="w-12 h-3 bg-slate-300 rounded" />
              <div className="w-8 h-3 bg-slate-200 rounded" />
            </div>
            <div className="flex-1 py-4 flex flex-col gap-3">
              <div className="w-2/3 h-3 bg-slate-300 rounded" />
              <div className="w-full h-2 bg-slate-200 rounded" />
              <div className="w-full h-2 bg-slate-200 rounded" />
              <div className="w-5/6 h-2 bg-slate-200 rounded" />
              <div className="w-1/2 h-3 bg-slate-300 rounded mt-2" />
              <div className="w-full h-2 bg-slate-200 rounded" />
              <div className="w-full h-2 bg-slate-200 rounded" />
            </div>
            <div className="w-full h-6 border-t border-dashed border-slate-300 pt-2 flex gap-2">
              <div className="w-8 h-2.5 bg-slate-200 rounded-full" />
              <div className="w-12 h-2.5 bg-slate-200 rounded-full" />
              <div className="w-10 h-2.5 bg-slate-200 rounded-full" />
            </div>
          </div>
        </div>

        {/* Action button overlay on hover */}
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 p-4">
          <button
            onClick={() => onSelect(template)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 cursor-pointer hover:bg-slate-50"
          >
            <Check size={14} />
            <span>Use Template</span>
          </button>
          
          <div className="flex gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
            <button
              onClick={() => onPreview(template)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] backdrop-blur-md cursor-pointer"
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
            {onCompare && (
              <button
                onClick={() => onCompare(template)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white font-bold text-[11px] backdrop-blur-md cursor-pointer ${
                  isComparing ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Columns size={12} />
                <span>Compare</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info details footer */}
      <div className="p-5 flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">
              {template.category}
            </span>
            <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
              {template.name}
            </h3>
          </div>
          {isSelected && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white animate-scaleIn">
              <Check size={12} />
            </div>
          )}
        </div>

        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
          {template.description || 'ATS friendly layout optimized for modern recruitment platforms.'}
        </p>

        {/* Recommended jobs/industries tags */}
        {(template.recommendedFor?.length > 0 || template.industry?.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {template.recommendedFor.slice(0, 2).map((role) => (
              <span key={role} className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-bold border border-slate-100">
                {role}
              </span>
            ))}
            {template.industry.slice(0, 1).map((ind) => (
              <span key={ind} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100/50">
                {ind}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
