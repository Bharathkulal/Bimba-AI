import React from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, Columns } from 'lucide-react';
import type { ResumeTemplate } from '../services/templates';

import { ATSBadge } from './ATSBadge';
import { TemplateBadge } from './TemplateBadge';

interface TemplateCompareProps {
  templates: ResumeTemplate[];
  onClose: () => void;
  onSelect: (template: ResumeTemplate) => void;
  onRemove: (templateId: string) => void;
}

export const TemplateCompare: React.FC<TemplateCompareProps> = ({
  templates,
  onClose,
  onSelect,
  onRemove,
}) => {
  if (templates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="text-indigo-600 animate-pulse" size={18} />
              <span>Compare Templates</span>
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">Evaluate layout options and ATS configurations side-by-side.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer shadow-sm"
          >
            <X size={16} />
          </button>
        </div>

        {/* Matrix Comparison Table */}
        <div className="flex-1 overflow-x-auto p-6">
          <div className="grid grid-cols-3 gap-6 min-w-[700px]">
            {/* Attributes Column */}
            <div className="flex flex-col gap-6 font-bold text-xs text-slate-400 uppercase pt-2">
              <div className="h-44 border-b border-transparent" /> {/* card gap */}
              <div className="py-2 border-b border-slate-100">Category</div>
              <div className="py-2 border-b border-slate-100">ATS Rating</div>
              <div className="py-2 border-b border-slate-100">Layout Format</div>
              <div className="py-2 border-b border-slate-100">Primary Color</div>
              <div className="py-2 border-b border-slate-100">Secondary Color</div>
              <div className="py-2 border-b border-slate-100">Typography</div>
              <div className="py-2 border-b border-slate-100">Recommended For</div>
              <div className="py-2 border-b border-slate-100">Industry Scope</div>
            </div>

            {/* Template slots */}
            {Array.from({ length: 2 }).map((_, idx) => {
              const template = templates[idx];
              if (!template) {
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 text-slate-400 text-xs font-semibold text-center"
                  >
                    <Columns size={24} className="mb-2 text-slate-300" />
                    <span>Select a second template to compare</span>
                  </div>
                );
              }

              return (
                <div key={template.templateId} className="flex flex-col gap-6 relative group">
                  {/* Remove control */}
                  <button
                    onClick={() => onRemove(template.templateId)}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-900 text-white shadow-md hover:bg-slate-800 cursor-pointer z-20"
                  >
                    <X size={12} />
                  </button>

                  {/* Header/Card Block */}
                  <div className="h-44 rounded-2xl bg-slate-50 border border-slate-100 p-4 flex flex-col justify-between overflow-hidden">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-500">
                        {template.category}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-xs line-clamp-1">{template.name}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mt-1">{template.description}</p>
                    </div>

                    <button
                      onClick={() => onSelect(template)}
                      className="w-full py-1.5 rounded-lg bg-slate-900 text-white font-bold text-[10px] shadow cursor-pointer hover:bg-slate-800"
                    >
                      Use This Template
                    </button>
                  </div>

                  {/* Category */}
                  <div className="py-2 border-b border-slate-100 text-xs font-extrabold text-slate-800">
                    {template.category}
                  </div>

                  {/* ATS Rating */}
                  <div className="py-2 border-b border-slate-100 flex items-center">
                    <ATSBadge score={template.atsScore} size="sm" />
                  </div>

                  {/* Layout Format */}
                  <div className="py-2 border-b border-slate-100 text-xs font-semibold text-slate-600">
                    {template.layout?.columns || 1} Column Layout ({template.layout?.header || 'Standard'})
                  </div>

                  {/* Primary Color */}
                  <div className="py-2 border-b border-slate-100 flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-200"
                      style={{ backgroundColor: template.colors?.primary || '#111111' }}
                    />
                    <code className="text-[10px] font-mono font-bold text-slate-500">
                      {template.colors?.primary || '#111111'}
                    </code>
                  </div>

                  {/* Secondary Color */}
                  <div className="py-2 border-b border-slate-100 flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-200"
                      style={{ backgroundColor: template.colors?.secondary || '#666666' }}
                    />
                    <code className="text-[10px] font-mono font-bold text-slate-500">
                      {template.colors?.secondary || '#666666'}
                    </code>
                  </div>

                  {/* Typography */}
                  <div className="py-2 border-b border-slate-100 text-xs font-semibold text-slate-600">
                    {template.font?.family || 'Helvetica'} ({template.font?.body || 10}pt / {template.font?.heading || 14}pt)
                  </div>

                  {/* Recommended For */}
                  <div className="py-2 border-b border-slate-100 flex flex-wrap gap-1">
                    {template.recommendedFor?.map((role) => (
                      <span key={role} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                        {role}
                      </span>
                    ))}
                  </div>

                  {/* Industry Scope */}
                  <div className="py-2 border-b border-slate-100 flex flex-wrap gap-1">
                    {template.industry?.map((ind) => (
                      <span key={ind} className="px-1.5 py-0.5 rounded bg-indigo-50 text-[10px] font-bold text-indigo-600 border border-indigo-100/50">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md cursor-pointer hover:bg-slate-800"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
