import React from 'react';
import { useResumeBuilderStore } from '../../store/resumeBuilderStore';
import { Layout, Palette, Code, Check } from 'lucide-react';

export const TemplateSelector: React.FC = () => {
  const { selectedTemplate, setSelectedTemplate } = useResumeBuilderStore();

  const templates = [
    {
      id: 'ats_classic',
      name: 'ATS Classic',
      description: 'Single-column monochrome layout fully readable by automated applicant tracking engines.',
      icon: Layout,
      color: 'border-slate-300 dark:border-white/10 text-slate-600'
    },
    {
      id: 'modern_dev',
      name: 'Modern Developer',
      description: 'Rich dark emerald headers optimized for engineering and full-stack software careers.',
      icon: Code,
      color: 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
    },
    {
      id: 'minimal_pro',
      name: 'Minimal Corporate',
      description: 'Clean royal blue styling and sophisticated spacing suitable for corporate roles.',
      icon: Palette,
      color: 'border-blue-500/20 text-blue-500 bg-blue-500/5'
    },
    {
      id: 'creative_portfolio',
      name: 'Creative Portfolio',
      description: 'Stylish visual offsets using pink and violet accents to highlight product/design fields.',
      icon: SparklesIcon,
      color: 'border-violet-500/20 text-violet-500 bg-violet-500/5'
    }
  ];

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="border-b border-slate-200 dark:border-white/10 pb-2.5">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Templates Selector
        </h4>
      </div>

      <div className="flex flex-col gap-3">
        {templates.map((tpl) => {
          const Icon = tpl.icon;
          const isActive = selectedTemplate === tpl.id;
          
          return (
            <div
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl.id)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3 relative overflow-hidden ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/5'
                  : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 bg-white/40 dark:bg-white/5'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${tpl.color}`}>
                <Icon size={16} />
              </div>
              <div className="flex-grow text-xs overflow-hidden pr-3">
                <h5 className="font-bold text-slate-800 dark:text-white truncate">{tpl.name}</h5>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 leading-normal">
                  {tpl.description}
                </p>
              </div>
              {isActive && (
                <div className="absolute right-3 top-3 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                  <Check size={9} strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Quick helper icon wrapper
const SparklesIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
    <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
  </svg>
);
