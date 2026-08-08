import React from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { UploadCloud, FileEdit, Sparkles, Shield, Zap } from 'lucide-react';
import { Card } from '../../Card';

export const WelcomeStep: React.FC = () => {
  const { setResumeMode, setStep } = useResumeBuilderContext();

  const handleSelect = (mode: 'upload' | 'scratch') => {
    setResumeMode(mode);
    setStep(2);
  };

  return (
    <div className="max-w-2xl w-full flex flex-col gap-8 text-center py-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight">Let's Build Your Best Resume</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Upload your existing document for a rapid AI parse and ATS scoring update, or craft a new optimized profile from scratch.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
        {/* Choice 1: Upload */}
        <Card
          onClick={() => handleSelect('upload')}
          className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-emerald-500 bg-white dark:bg-white/5 hover:bg-emerald-500/5 p-6 rounded-3xl cursor-pointer text-center flex flex-col items-center gap-4 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow-[0_4px_20px_rgba(16,185,129,0.08)]"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-sm">
            <UploadCloud size={22} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Upload Existing Resume</h4>
            <p className="text-[11px] text-slate-400 mt-1">Upload PDF, DOCX, or TXT for instant parsing.</p>
          </div>
        </Card>

        {/* Choice 2: Scratch */}
        <Card
          onClick={() => handleSelect('scratch')}
          className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-emerald-500 bg-white dark:bg-white/5 hover:bg-emerald-500/5 p-6 rounded-3xl cursor-pointer text-center flex flex-col items-center gap-4 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow-[0_4px_20px_rgba(16,185,129,0.08)]"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-sm">
            <FileEdit size={22} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Start From Scratch</h4>
            <p className="text-[11px] text-slate-400 mt-1">Create a fresh copy with step-by-step assistance.</p>
          </div>
        </Card>
      </div>

      {/* Trust row */}
      <div className="flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 dark:border-white/5 pt-6 text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <Shield size={14} className="text-emerald-500" />
          <span>Secure data compliance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-emerald-500" />
          <span>ATS validation matching</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap size={14} className="text-emerald-500" />
          <span>Immediate downloads</span>
        </div>
      </div>
    </div>
  );
};
export default WelcomeStep;
