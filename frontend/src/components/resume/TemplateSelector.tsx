import React from 'react';
import { useResumeBuilderStore } from '../../store/resumeBuilderStore';
import { templateMetadata } from './templates';
import { Check, ShieldCheck, Sparkles, Award } from 'lucide-react';

export const TemplateSelector: React.FC = () => {
  const { selectedTemplate, setSelectedTemplate } = useResumeBuilderStore();

  const getCompatibilityScore = (id: string) => {
    switch (id) {
      case 'harvard':
      case 'jakes':
      case 'indeed':
        return 100;
      case 'stanford':
      case 'microsoft':
        return 99;
      default:
        return 98;
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="border-b border-slate-200 pb-2.5">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Template Gallery
        </h4>
        <span className="text-[10px] text-slate-400 font-semibold">Choose an ATS-compliant layout tailored to your sector</span>
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[72vh] overflow-y-auto pr-1">
        {templateMetadata.map((tpl) => {
          const isActive = selectedTemplate === tpl.id;
          const score = getCompatibilityScore(tpl.id);
          
          return (
            <div
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col gap-2 relative overflow-hidden ${
                isActive
                  ? 'border-emerald-600 bg-emerald-500/5 shadow-md shadow-emerald-500/5'
                  : 'border-slate-200 hover:bg-slate-50 bg-white/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <h5 className="font-extrabold text-xs text-slate-800">{tpl.name}</h5>
                  {tpl.popular && (
                    <span className="inline-flex items-center gap-0.5 text-[8.5px] px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-black">
                      <Sparkles size={8} /> Popular
                    </span>
                  )}
                </div>
                
                {/* Score badge */}
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                  <ShieldCheck size={10} /> {score}% ATS Read
                </span>
              </div>

              <p className="text-[10px] text-slate-450 font-bold leading-normal">
                Best For: <span className="text-slate-600 font-semibold">{tpl.audience}</span>
              </p>

              {isActive && (
                <div className="absolute right-3 bottom-3 w-4.5 h-4.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Check size={10} strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSelector;
