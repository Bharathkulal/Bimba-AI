import React from 'react';
import { X, Check, ArrowRight } from 'lucide-react';
import { ResumeTemplate } from '../services/templates';
import { ATSBadge } from './ATSBadge';
import { TemplateBadge } from './TemplateBadge';

interface TemplatePreviewProps {
  template: ResumeTemplate | null;
  onClose: () => void;
  onSelect: (template: ResumeTemplate) => void;
  isSelected?: boolean;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onClose,
  onSelect,
  isSelected = false,
}) => {
  if (!template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        {/* Left Side: Mockup Image Preview */}
        <div className="flex-1 bg-slate-50 relative min-h-[300px] md:min-h-[500px] border-b md:border-b-0 md:border-r border-slate-100">
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white flex items-center justify-center p-6">
            {template.previewImage ? (
              <img
                src={template.previewImage}
                alt={template.name}
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg border border-slate-200"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
            
            {/* Visual representation card */}
            <div className="w-5/6 h-5/6 bg-white border border-slate-200 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <div className="w-24 h-4 bg-slate-200 rounded" />
                  <div className="w-16 h-2 bg-slate-100 rounded mt-1.5" />
                </div>
                <div className="w-8 h-8 rounded bg-slate-100" />
              </div>
              <div className="flex-1 py-4 flex flex-col gap-3">
                <div className="w-16 h-3 bg-slate-200 rounded" />
                <div className="w-full h-2 bg-slate-100 rounded" />
                <div className="w-full h-2 bg-slate-100 rounded" />
                <div className="w-5/6 h-2 bg-slate-100 rounded" />
                <div className="w-20 h-3 bg-slate-200 rounded mt-2" />
                <div className="w-full h-2 bg-slate-100 rounded" />
                <div className="w-full h-2 bg-slate-100 rounded" />
              </div>
              <div className="border-t border-slate-100 pt-3 flex gap-2">
                <div className="w-10 h-3 bg-slate-100 rounded" />
                <div className="w-10 h-3 bg-slate-100 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Configuration and Info Details */}
        <div className="w-full md:w-[320px] p-6 flex flex-col justify-between bg-white overflow-y-auto">
          <div>
            {/* Header controls */}
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">
                  {template.category}
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{template.name}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-950 cursor-pointer shadow-sm"
              >
                <X size={14} />
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <ATSBadge score={template.atsScore} size="sm" />
              {template.featured && <TemplateBadge type="featured" />}
              {template.premium && <TemplateBadge type="premium" />}
            </div>

            {/* Description */}
            <p className="text-slate-500 text-xs leading-relaxed mb-5">
              {template.description || 'ATS friendly layout optimized for modern recruitment platforms. This layout ensures compatibility with standard resume parsing technology.'}
            </p>

            {/* Layout properties */}
            <div className="border-t border-b border-slate-100 py-3.5 flex flex-col gap-2 mb-5 text-[11px] text-slate-600 font-bold">
              <div className="flex justify-between">
                <span>Layout Style:</span>
                <span className="text-slate-900">{template.layout?.columns === 1 ? 'Single Column' : 'Two Columns'}</span>
              </div>
              <div className="flex justify-between">
                <span>Header Alignment:</span>
                <span className="text-slate-900 capitalize">{template.layout?.header || 'Standard'}</span>
              </div>
              <div className="flex justify-between">
                <span>Primary Font:</span>
                <span className="text-slate-900">{template.font?.family || 'Helvetica'}</span>
              </div>
            </div>

            {/* Target Audience / Industry */}
            <div className="flex flex-col gap-2 mb-4">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Recommended Jobs</span>
              <div className="flex flex-wrap gap-1">
                {template.recommendedFor?.map((role) => (
                  <span key={role} className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-bold border border-slate-100">
                    {role}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 mb-4">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Industry Focus</span>
              <div className="flex flex-wrap gap-1">
                {template.industry?.map((ind) => (
                  <span key={ind} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100/50">
                    {ind}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action trigger footer */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                onSelect(template);
                onClose();
              }}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
              }`}
            >
              {isSelected ? <Check size={14} /> : <ArrowRight size={14} />}
              <span>{isSelected ? 'Currently Selected' : 'Choose This Template'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
