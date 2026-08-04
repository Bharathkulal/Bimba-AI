import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ResumeTemplate } from '../services/templates';
import { TemplateCard } from './TemplateCard';

interface TemplateCarouselProps {
  templates: ResumeTemplate[];
  selectedTemplateId?: string;
  onSelect: (template: ResumeTemplate) => void;
  onPreview: (template: ResumeTemplate) => void;
}

export const TemplateCarousel: React.FC<TemplateCarouselProps> = ({
  templates,
  selectedTemplateId,
  onSelect,
  onPreview,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (templates.length === 0) return null;

  return (
    <div className="relative flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles size={16} className="animate-spin" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Featured & Recommended</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Top ATS-compliant selections for you</p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal deck */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {templates.map((template) => (
          <div
            key={template.templateId}
            className="w-[280px] shrink-0 scroll-snap-align-start"
            style={{ scrollSnapAlign: 'start' }}
          >
            <TemplateCard
              template={template}
              isSelected={selectedTemplateId === template.slug || selectedTemplateId === template.templateId}
              onSelect={onSelect}
              onPreview={onPreview}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
