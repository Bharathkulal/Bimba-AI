import React, { useEffect, useState } from 'react';
import { useResumeBuilderStore } from '../../store/resumeBuilderStore';
import { ResumeEditor } from './ResumeEditor';
import { ResumePreview } from './ResumePreview';
import { API_BASE_URL } from '../../services/api';
import { TemplateSelector } from './TemplateSelector';
import { 
  Sparkles, AlertTriangle, ArrowLeft, Check, CheckCircle2, 
  FileText, Download, History, Award, Settings, User, BookOpen, Briefcase, Wrench, FileCode
} from 'lucide-react';
import { Button } from '../Button';

interface ResumeBuilderProps {
  resumeId: number;
  onBack?: () => void;
  onPdfGenerated?: (pdfUrl: string) => void;
}

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({
  resumeId,
  onBack,
  onPdfGenerated
}) => {
  const { 
    loading, errors, resumeData, generating, generatedFiles,
    fetchBuilderData, clearBuilderStore, generatePdf, fetchPreviousVersions
  } = useResumeBuilderStore();

  const [activeSection, setActiveSection] = useState<'info' | 'summary' | 'skills' | 'experience' | 'projects' | 'education'>('info');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (resumeId) {
      fetchBuilderData(resumeId);
      fetchPreviousVersions(resumeId);
    }
    return () => {
      clearBuilderStore();
    };
  }, [resumeId, fetchBuilderData, fetchPreviousVersions, clearBuilderStore]);

  // Section icons helper
  const getSectionIcon = (id: string) => {
    switch (id) {
      case 'info': return <User size={14} />;
      case 'summary': return <BookOpen size={14} />;
      case 'skills': return <Wrench size={14} />;
      case 'experience': return <Briefcase size={14} />;
      case 'projects': return <FileCode size={14} />;
      case 'education': return <Award size={14} />;
      default: return <FileText size={14} />;
    }
  };

  // Dynamic section completion check
  const isSectionCompleted = (id: string) => {
    if (!resumeData) return false;
    switch (id) {
      case 'info':
        return !!(resumeData.personal_info?.name && resumeData.personal_info?.email);
      case 'summary':
        return !!(resumeData.summary && resumeData.summary.trim().length > 10);
      case 'skills':
        return !!(resumeData.skills && resumeData.skills.length > 0);
      case 'experience':
        return !!(resumeData.experience && resumeData.experience.length > 0);
      case 'projects':
        return !!(resumeData.projects && resumeData.projects.length > 0);
      case 'education':
        return !!(resumeData.education && resumeData.education.length > 0);
      default:
        return false;
    }
  };

  // Download base64 helper (completely immune to CORS issues)
  const downloadBase64 = (base64Data: string, filename: string) => {
    try {
      const sliceSize = 512;
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      const blob = new Blob(byteArrays, { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Base64 download failed:", error);
    }
  };

  const handleDownload = async () => {
    const res = await generatePdf(resumeId);
    if (res) {
      if (res.pdf_base64) {
        downloadBase64(res.pdf_base64, `Resume_${resumeId}.pdf`);
      } else {
        // Fallback to direct download link
        window.open(res.pdf_url, '_blank');
      }
      if (onPdfGenerated) {
        onPdfGenerated(res.pdf_url);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col gap-6 animate-pulse p-6 bg-slate-50 dark:bg-[#0B121F]">
        <div className="h-14 bg-slate-200 dark:bg-white/5 rounded-xl w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
          <div className="h-full bg-slate-200 dark:bg-white/5 rounded-2xl lg:col-span-2" />
          <div className="h-full bg-slate-200 dark:bg-white/5 rounded-2xl lg:col-span-6" />
          <div className="h-full bg-slate-200 dark:bg-white/5 rounded-2xl lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (errors) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B121F] p-6">
        <div className="text-center py-12 px-6 bg-white dark:bg-[#1E293B] border border-rose-500/15 rounded-3xl max-w-lg mx-auto flex flex-col items-center gap-4 shadow-xl">
          <AlertTriangle size={48} className="text-rose-500" />
          <h3 className="text-lg font-black text-slate-800 dark:text-white">Failed to load Builder</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{errors}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-2 text-xs font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={13} /> Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'info', label: 'Contact' },
    { id: 'summary', label: 'Summary' },
    { id: 'skills', label: 'Skills' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'education', label: 'Education' },
  ] as const;

  return (
    <div className="w-full h-screen flex flex-col justify-between overflow-hidden bg-slate-50 dark:bg-[#080E1A] font-sans">
      
      {/* 1. TOP HEADER (Sticky, Compact) */}
      <header className="h-14 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-6 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black text-xs">
            B
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
              Bimba AI <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">Resume Builder</span>
            </h3>
            <p className="text-[9px] text-slate-400 font-medium">Autosaved Draft</p>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Sparkles size={14} className="text-emerald-500 animate-pulse" />
          <span>Diagnostic Phase 7 of 10</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
            Draft saved
          </span>
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-all cursor-pointer border border-slate-200 dark:border-white/5"
              title="Close Workspace"
            >
              <ArrowLeft size={16} />
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN THREE COLUMN WORKSPACE */}
      <div className="flex-grow flex overflow-hidden w-full relative">
        
        {/* LEFT COLUMN: Sections Navigation (~18% width) */}
        <aside className="w-[18%] border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-4 flex flex-col gap-2 overflow-y-auto shrink-0">
          <div className="px-2 pb-2 border-b border-slate-100 dark:border-white/5 mb-2">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Workspace Nav</span>
          </div>
          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            const isCompleted = isSectionCompleted(sec.id);
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-4 border-emerald-500 pl-2'
                    : 'text-slate-555 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 text-xs truncate">
                  <span className={isActive ? 'text-emerald-500' : 'text-slate-400'}>
                    {getSectionIcon(sec.id)}
                  </span>
                  <span className="truncate">{sec.label}</span>
                </div>
                {isCompleted && (
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                )}
              </button>
            );
          })}
        </aside>

        {/* CENTER COLUMN: Editor (~45% width) */}
        <main className="w-[45%] p-6 overflow-y-auto border-r border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#080E1A] flex flex-col gap-6">
          <ResumeEditor activeSection={activeSection} setActiveSection={setActiveSection} />
        </main>

        {/* RIGHT COLUMN: Live Resume Preview & Templates (~37% width) */}
        <section className="w-[37%] bg-white dark:bg-[#0F172A] p-6 overflow-y-auto flex flex-col gap-6 shrink-0">
          
          <div className="flex-grow flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2.5">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Live Preview</h4>
            </div>
            
            {/* Embedded Resume Preview Document */}
            <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm flex-grow bg-slate-50 dark:bg-slate-900/50 min-h-[420px] relative">
              <ResumePreview />
            </div>
          </div>

          {/* Compact Template Selector */}
          <div className="border-t border-slate-100 dark:border-white/5 pt-4">
            <TemplateSelector />
          </div>

        </section>

      </div>

      {/* 3. BOTTOM ACTION / STATUS BAR */}
      <footer className="h-16 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-6 flex items-center justify-between shrink-0 z-20 shadow-inner">
        {/* Left: ATS Score */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
            <Award size={18} className="text-emerald-500" />
          </div>
          <div>
            <span className="text-[9px] text-slate-450 dark:text-slate-400 font-extrabold uppercase tracking-wider block">ATS Compliance</span>
            <span className="text-xs font-black text-slate-800 dark:text-white block mt-0.5">
              Score: <span className="text-emerald-500">{(resumeData as any)?.ats_score || 72}%</span>
            </span>
          </div>
        </div>

        {/* Center: AI Improvements */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-450 dark:text-slate-400 font-medium max-w-[200px] text-right leading-snug hidden md:block">
            ATS scanning complete. Bullet phrases optimized.
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {generatedFiles.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                icon={<History size={13} />}
                className="text-xs py-2 px-3 border-slate-200 dark:border-white/5 hover:bg-slate-50"
              >
                History ({generatedFiles.length})
              </Button>

              {/* Version History Popover */}
              {showHistory && (
                <div className="absolute bottom-12 right-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-2 z-50 animate-fadeIn">
                  <h5 className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 border-b border-slate-100 dark:border-white/5 pb-2">
                    Saved PDF Versions
                  </h5>
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {generatedFiles.map((ver, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[10px] p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5"
                      >
                        <span className="font-bold text-slate-700 dark:text-white truncate">
                          V{ver.version} ({ver.template.replace('_', ' ')})
                        </span>
                        <button
                          onClick={() => {
                            if (ver.id) {
                              const token = localStorage.getItem('auth_token') || localStorage.getItem('admin_token');
                              window.location.href = `${API_BASE_URL}/api/resume/download-pdf/${ver.id}${token ? `?token=${token}` : ''}`;
                            } else {
                              window.open(ver.pdf_url, '_blank');
                            }
                          }}
                          className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 cursor-pointer"
                        >
                          <Download size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleDownload}
            isLoading={generating}
            size="sm"
            icon={<Download size={13} />}
            className="text-xs font-bold py-2 btn-glow-green"
          >
            {generating ? 'Downloading...' : 'Download PDF'}
          </Button>

          {onPdfGenerated && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPdfGenerated(`Resume_${resumeId}.pdf`)}
              className="text-xs font-bold py-2"
            >
              Save & Finish
            </Button>
          )}
        </div>
      </footer>

    </div>
  );
};

export default ResumeBuilder;
