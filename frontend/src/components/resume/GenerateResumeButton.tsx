import React, { useEffect } from 'react';
import { useResumeBuilderStore } from '../../store/resumeBuilderStore';
import { FileText, Download, RefreshCw, AlertTriangle, CheckCircle2, History } from 'lucide-react';
import { Button } from '../Button';

interface GenerateResumeButtonProps {
  resumeId: number;
}

export const GenerateResumeButton: React.FC<GenerateResumeButtonProps> = ({
  resumeId
}) => {
  const { 
    generating, errors, generatedFiles, 
    generatePdf, fetchPreviousVersions 
  } = useResumeBuilderStore();

  useEffect(() => {
    if (resumeId) {
      fetchPreviousVersions(resumeId);
    }
  }, [resumeId, fetchPreviousVersions]);

  const handleDownload = async () => {
    const pdfUrl = await generatePdf(resumeId);
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="border-b border-slate-200 dark:border-white/10 pb-2.5">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Actions
        </h4>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleDownload}
          isLoading={generating}
          className="w-full py-3 font-bold flex items-center justify-center gap-2"
          icon={<FileText size={15} className="fill-current" />}
        >
          {generating ? 'Compiling PDF...' : 'Download Resume PDF'}
        </Button>

        {/* Error message */}
        {errors && (
          <div className="bg-rose-500/10 border border-rose-500/10 text-rose-500 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{errors}</span>
          </div>
        )}

        {/* Previous versions list */}
        {generatedFiles.length > 0 && (
          <div className="flex flex-col gap-3 mt-2 bg-slate-50/50 dark:bg-white/5 p-4 border border-slate-200/50 dark:border-white/5 rounded-2xl">
            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History size={12} /> Version History
            </h5>
            
            <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
              {generatedFiles.map((ver, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 text-[10px] p-2 bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl"
                >
                  <div className="overflow-hidden">
                    <span className="font-bold text-slate-700 dark:text-white capitalize">
                      V{ver.version} — {ver.template.replace('_', ' ')}
                    </span>
                    <p className="text-[9px] text-slate-450 dark:text-slate-400 mt-0.5">
                      {new Date(ver.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <a
                    href={ver.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 transition-colors"
                    title="Download"
                  >
                    <Download size={11} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default GenerateResumeButton;
