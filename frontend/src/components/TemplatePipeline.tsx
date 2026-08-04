import React, { useRef } from 'react';
import { ArrowRight, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import type { ResumeTemplate } from '../services/templates';


interface TemplatePipelineProps {
  templates: ResumeTemplate[];
  selectedTemplateId?: string;
  onSelect: (template: ResumeTemplate) => void;
  onPreview: (template: ResumeTemplate) => void;
  activeCategory: string | null;
}

export const TemplatePipeline: React.FC<TemplatePipelineProps> = ({
  templates,
  selectedTemplateId,
  onSelect,
  onPreview,
  activeCategory,
}) => {
  const categories = activeCategory ? [activeCategory] : ['Professional', 'Student', 'Minimal', 'International', 'Industry'];
  const pipelineRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={pipelineRef} className="w-full flex flex-col gap-8 py-6 overflow-x-auto no-scrollbar">
      {categories.map((category) => {
        const categoryTemplates = templates.filter(
          (t) => t.category.toLowerCase() === category.toLowerCase()
        );

        if (categoryTemplates.length === 0) return null;

        // Sort by displayOrder
        const sortedTemplates = [...categoryTemplates].sort((a, b) => a.displayOrder - b.displayOrder);

        return (
          <div key={category} className="flex flex-col gap-3 min-w-[800px] border border-slate-100/80 bg-slate-50/50 p-6 rounded-3xl">
            {/* Header Category Tag */}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                {category} Pipeline
              </h3>
              <span className="text-[10px] text-slate-400 font-bold bg-white border border-slate-150 px-2 py-0.5 rounded-full">
                {sortedTemplates.length} Stages
              </span>
            </div>

            {/* Horizontal Timeline Flow */}
            <div className="flex items-center gap-4 py-2 overflow-x-auto no-scrollbar">
              {sortedTemplates.map((template, index) => {
                const isSelected = selectedTemplateId === template.slug || selectedTemplateId === template.templateId;
                const isLast = index === sortedTemplates.length - 1;

                return (
                  <React.Fragment key={template.templateId}>
                    {/* Node Element */}
                    <div
                      onClick={() => onPreview(template)}
                      className={`relative flex flex-col justify-between p-4 rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer hover:-translate-y-0.5 w-[200px] shrink-0 ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-600/10'
                          : 'border-slate-200/60'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-[9px] font-mono text-slate-400 font-bold">
                          Step {(index + 1).toString().padStart(2, '0')}
                        </span>
                        {isSelected && (
                          <CheckCircle2 size={12} className="text-indigo-600 shrink-0 animate-scaleIn" />
                        )}
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-xs truncate leading-tight">
                        {template.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate mt-1">
                        ATS {template.atsScore}%
                      </p>

                      <div className="mt-4 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(template);
                          }}
                          className={`flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] cursor-pointer text-center`}
                        >
                          Select
                        </button>
                      </div>
                    </div>

                    {/* Timeline connection link */}
                    {!isLast && (
                      <div className="flex items-center justify-center text-slate-300 px-1">
                        <ArrowRight size={14} className="animate-pulse" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
