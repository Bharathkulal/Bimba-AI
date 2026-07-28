import React, { useEffect } from 'react';
import { useResumeBuilderStore } from '../../store/resumeBuilderStore';
import { ResumeEditor } from './ResumeEditor';
import { ResumePreview } from './ResumePreview';
import { TemplateSelector } from './TemplateSelector';
import { GenerateResumeButton } from './GenerateResumeButton';
import { Sparkles, AlertTriangle, ArrowLeft } from 'lucide-react';

interface ResumeBuilderProps {
  resumeId: number;
  onBack?: () => void;
}

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({
  resumeId,
  onBack
}) => {
  const { loading, errors, fetchBuilderData, clearBuilderStore } = useResumeBuilderStore();

  useEffect(() => {
    if (resumeId) {
      fetchBuilderData(resumeId);
    }
    return () => {
      clearBuilderStore();
    };
  }, [resumeId, fetchBuilderData, clearBuilderStore]);

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6 animate-pulse p-4">
        <div className="h-10 bg-slate-200 dark:bg-white/5 rounded-xl w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-slate-200 dark:bg-white/5 rounded-2xl lg:col-span-1" />
          <div className="h-96 bg-slate-200 dark:bg-white/5 rounded-2xl lg:col-span-1" />
          <div className="h-96 bg-slate-200 dark:bg-white/5 rounded-2xl lg:col-span-1" />
        </div>
      </div>
    );
  }

  if (errors) {
    return (
      <div className="w-full text-center py-12 px-6 bg-rose-500/5 border border-rose-500/15 rounded-2xl max-w-lg mx-auto flex flex-col items-center gap-3">
        <AlertTriangle size={36} className="text-rose-500" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Failed to load Builder</h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{errors}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-2 text-xs font-bold text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={13} /> Back to Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 text-left max-w-7xl mx-auto px-1 sm:px-4 py-2">
      
      {/* Upper header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-200/85 dark:border-white/10">
        <div>
          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="text-emerald-500" size={18} /> AI Resume Builder
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">Customize layouts, load AI rewrites, and generate recruiter-ready PDFs</p>
        </div>
        
        {onBack && (
          <button
            onClick={onBack}
            className="text-xs font-bold text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5"
          >
            <ArrowLeft size={13} /> Back to Dashboard
          </button>
        )}
      </div>

      {/* Main 3 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Editor Inputs (5 cols) */}
        <div className="lg:col-span-4 bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 rounded-3xl shadow-xl">
          <ResumeEditor />
        </div>

        {/* Center Column: Live Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 rounded-3xl shadow-xl">
          <ResumePreview />
        </div>

        {/* Right Column: Templates + Controls (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          <div className="bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 rounded-3xl shadow-xl">
            <TemplateSelector />
          </div>

          <div className="bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 rounded-3xl shadow-xl">
            <GenerateResumeButton resumeId={resumeId} />
          </div>

        </div>

      </div>

    </div>
  );
};
export default ResumeBuilder;
