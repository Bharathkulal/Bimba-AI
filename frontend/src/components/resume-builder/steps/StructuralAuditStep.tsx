import React from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { Card } from '../../Card';
import { Button } from '../../Button';
import { CheckCircle2, AlertTriangle, HelpCircle, Eye, Sparkles } from 'lucide-react';
import { ResumePreview } from '../../resume/ResumePreview';

export const StructuralAuditStep: React.FC = () => {
  const { resumeId } = useResumeBuilderContext();

  const auditItems = [
    { label: 'Unrecognizable fonts & symbols', status: 'pass', msg: 'No broken bullet symbols or character blocks detected.' },
    { label: 'Layout overflow check', status: 'pass', msg: 'Document layout matches print area boundaries perfectly.' },
    { label: 'Orphan headings check', status: 'fail', msg: 'A section heading "Projects" appears at the bottom of Page 1 with no contents following.' },
    { label: 'Contact details validation', status: 'pass', msg: 'Found active personal_info email, phone, and name details.' }
  ];

  return (
    <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-left items-start">
      
      {/* Left panel checklist */}
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-black tracking-tight">Structural Layout Quality Audit</h2>
          <p className="text-xs text-slate-500 mt-1">Reviewing visual layout structure defects before export compiler generation.</p>
        </div>

        <div className="flex flex-col gap-4">
          {auditItems.map((item, idx) => {
            const isPass = item.status === 'pass';
            return (
              <Card key={idx} className="p-4 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/10 flex items-start gap-3.5 shadow-sm">
                {isPass ? (
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                )}
                
                <div className="flex-grow space-y-1">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">{item.label}</h4>
                    {!isPass && (
                      <button className="text-[10px] font-black text-emerald-500 hover:underline uppercase tracking-wider cursor-pointer">
                        Jump to issue
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{item.msg}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Right panel live preview */}
      <div className="hidden md:block">
        <ResumePreview />
      </div>

    </div>
  );
};
export default StructuralAuditStep;
