import React from 'react';
import type { ResumeTemplate } from '../services/templates';
import { TemplateCard } from './TemplateCard';
import { Loader } from './Loader';

interface TemplateGalleryProps {
  templates: ResumeTemplate[];
  loading: boolean;
  selectedTemplateId?: string;
  onSelect: (template: ResumeTemplate) => void;
  onPreview: (template: ResumeTemplate) => void;
  onCompare?: (template: ResumeTemplate) => void;
  comparingTemplateIds?: string[];
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  loading,
  selectedTemplateId,
  onSelect,
  onPreview,
  onCompare,
  comparingTemplateIds = [],
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-8">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="flex flex-col gap-4 rounded-3xl border border-slate-100 p-4 bg-white animate-pulse">
            <div className="aspect-[3/4] w-full rounded-2xl bg-slate-100" />
            <div className="h-4 w-2/3 rounded bg-slate-100" />
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-5/6 rounded bg-slate-100" />
            <div className="flex gap-2 mt-2">
              <div className="h-6 w-12 rounded bg-slate-100" />
              <div className="h-6 w-16 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mt-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4 animate-bounce">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-extrabold text-slate-900 mb-1">No templates found</h3>
        <p className="text-slate-500 text-xs max-w-sm">
          We couldn't find any templates matching your filters. Try adjusting your search query or reset the filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-6 animate-fadeIn">
      {templates.map((template) => (
        <TemplateCard
          key={template.templateId}
          template={template}
          isSelected={selectedTemplateId === template.slug || selectedTemplateId === template.templateId}
          onSelect={onSelect}
          onPreview={onPreview}
          onCompare={onCompare}
          isComparing={comparingTemplateIds.includes(template.templateId)}
        />
      ))}
    </div>
  );
};
