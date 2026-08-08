import React, { useState } from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { Card } from '../../Card';
import { Button } from '../../Button';
import { Download, Link, Share2, Eye, RefreshCw, FileText } from 'lucide-react';
import { ResumePreview } from '../../resume/ResumePreview';
import { useResumeBuilderStore } from '../../../store/resumeBuilderStore';

export const ExportStep: React.FC = () => {
  const { resumeId } = useResumeBuilderContext();
  const { generatePdf, generating } = useResumeBuilderStore();
  const [copied, setCopied] = useState(false);

  const handleDownloadPdf = async () => {
    if (!resumeId) return;
    try {
      await generatePdf(resumeId);
      alert("PDF download started successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to compile layout PDF.");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`http://localhost:5173/resume/${resumeId}/shared`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl w-full flex flex-col gap-6 py-4 text-center items-center">
      <div>
        <h2 className="text-xl font-black tracking-tight">Export Your AI Optimized Resume</h2>
        <p className="text-xs text-slate-500 mt-1">Download and publish your 100% compliant ATS resume document.</p>
      </div>

      {/* Large centered resume preview card */}
      <div className="w-full max-w-2xl border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden bg-white dark:bg-[#1E293B] shadow-lg max-h-[360px] overflow-y-auto pr-1">
        <ResumePreview />
      </div>

      {/* 2x2 grid of action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full pt-4">
        
        {/* PDF */}
        <Card className="p-4 flex flex-col items-center justify-between text-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-sm shrink-0">
            <Download size={16} />
          </div>
          <div>
            <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-800 dark:text-white">Download PDF</h4>
            <p className="text-[9px] text-slate-400 mt-0.5">Recommended format</p>
          </div>
          <Button
            onClick={handleDownloadPdf}
            isLoading={generating}
            size="sm"
            className="w-full text-[10px] font-black py-1.5 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Get PDF
          </Button>
        </Card>

        {/* DOCX */}
        <Card className="p-4 flex flex-col items-center justify-between text-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-sm shrink-0">
            <FileText size={16} />
          </div>
          <div>
            <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-800 dark:text-white">Download DOCX</h4>
            <p className="text-[9px] text-slate-400 mt-0.5">Editable MS Word format</p>
          </div>
          <Button
            onClick={() => alert("DOCX compilation initiated.")}
            variant="outline"
            size="sm"
            className="w-full text-[10px] font-black py-1.5 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Get Word
          </Button>
        </Card>

        {/* Share link */}
        <Card className="p-4 flex flex-col items-center justify-between text-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-sm shrink-0">
            <Link size={16} />
          </div>
          <div>
            <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-800 dark:text-white">Shareable URL</h4>
            <p className="text-[9px] text-slate-400 mt-0.5">Public hosted link</p>
          </div>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="w-full text-[10px] font-black py-1.5 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? 'Copied Link' : 'Copy link'}
          </Button>
        </Card>

        {/* LinkedIn sync */}
        <Card className="p-4 flex flex-col items-center justify-between text-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20 shadow-sm shrink-0">
            <Share2 size={16} />
          </div>
          <div>
            <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-800 dark:text-white">Sync LinkedIn</h4>
            <p className="text-[9px] text-slate-400 mt-0.5">Push updates to profile</p>
          </div>
          <Button
            onClick={() => alert("LinkedIn sync complete.")}
            variant="outline"
            size="sm"
            className="w-full text-[10px] font-black py-1.5 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Sync Account
          </Button>
        </Card>
      </div>

    </div>
  );
};
export default ExportStep;
