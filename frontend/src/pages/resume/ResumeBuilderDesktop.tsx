import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Check,
  ChevronDown,
  Download,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResumeBuilderStore, type ResumeBuilderData } from '../../store/resumeBuilderStore';
import { TemplateRegistry, templateMetadata } from '../../components/resume/templates';
import { CreateFromScratchWizard } from '../../components/resume/CreateFromScratchWizard';


const STUDIO_PREFS_KEY = 'bimba.resumeStudioPreferences.v1';

const loadStudioPreferences = () => {
  try {
    const stored = localStorage.getItem(STUDIO_PREFS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const ResumeBuilderDesktop: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const resumeId = queryId ? parseInt(queryId, 10) : null;

  const {
    resumeData,
    loading,
    errors,
    fetchBuilderData,
    generatePdf,
    generating,
    selectedTemplate,
    setSelectedTemplate,
    templatesList,
    fetchTemplates
  } = useResumeBuilderStore();

  const initialPrefs = loadStudioPreferences();

  const [fontFamily, setFontFamily] = useState(initialPrefs.fontFamily || 'Inter');
  const [fontSize, setFontSize] = useState(initialPrefs.fontSize || '11pt');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isEditingWizardOpen, setIsEditingWizardOpen] = useState(false);

  useEffect(() => {
    if (resumeId) {
      fetchBuilderData(resumeId);
    }
  }, [resumeId, fetchBuilderData]);

  useEffect(() => {
    fetchTemplates();
    const prefs = loadStudioPreferences();
    if (prefs.selectedTemplate) {
      setSelectedTemplate(prefs.selectedTemplate);
    } else {
      setSelectedTemplate('microsoft');
    }
  }, [fetchTemplates, setSelectedTemplate]);

  useEffect(() => {
    localStorage.setItem(
      STUDIO_PREFS_KEY,
      JSON.stringify({
        selectedTemplate,
        fontFamily,
        fontSize
      })
    );
  }, [selectedTemplate, fontFamily, fontSize]);

  const availableTemplates = useMemo(() => {
    return [
      ...templateMetadata,
      ...templatesList
        .filter((template: any) => !templateMetadata.some((staticTemplate) => staticTemplate.id === template.slug))
        .map((template: any) => ({
          id: template.slug,
          name: template.name,
          audience: `${template.category} Format`,
          popular: template.popularity > 120
        }))
    ];
  }, [templatesList]);

  const selectedTemplateName =
    availableTemplates.find((template) => template.id === selectedTemplate)?.name || 'Microsoft ATS';
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
    if (!resumeId) return;
    setDownloadError(null);
    const response = await generatePdf(resumeId);
    if (response) {
      if (response.error) {
        setDownloadError(response.error);
        return;
      }
      if (response.pdf_base64) {
        const filename = resumeData?.personal_info?.name 
          ? `${resumeData.personal_info.name.replace(/\s+/g, '_')}_Resume.pdf` 
          : `Resume_${resumeId}.pdf`;
        downloadBase64(response.pdf_base64, filename);
      } else if (response.pdf_url) {
        window.open(response.pdf_url, '_blank');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F1E7]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#173404] border-t-transparent" />
          <span className="text-xs font-bold text-slate-500">Loading Resume Builder...</span>
        </div>
      </div>
    );
  }

  if (errors || !resumeData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F1E7] p-6">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600">
            <AlertCircle size={22} />
          </div>
          <h3 className="text-base font-black text-slate-800">Resume Builder Unavailable</h3>
          <p className="text-xs font-semibold text-slate-500">
            {errors || 'Please upload a resume or select a valid document from your dashboard.'}
          </p>
          <button
            onClick={() => navigate('/resume')}
            className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white shadow"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F1E7] text-slate-900">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col">
        <header className="border-b border-[#DED6C4] bg-[#FAF8EF] px-6 py-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/resume')}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-900"
                aria-label="Back to resumes"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#6C7E3D]">Bimba AI</p>
                <h1 className="mt-1 flex items-center gap-2 text-2xl font-black tracking-tight text-slate-950">
                  ATS Resume Studio <Award className="text-[#6C7E3D]" size={18} />
                </h1>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Editing: {resumeData.personal_info.name || 'Untitled Draft'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Template</span>
                <TemplateDropdown
                  value={selectedTemplate}
                  templates={availableTemplates}
                  onChange={setSelectedTemplate}
                  className="min-w-[280px]"
                />
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingWizardOpen(true)}
                    className="inline-flex h-[46px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white border border-[#DED6C4] px-6 text-sm font-black text-slate-900 shadow-sm transition hover:bg-slate-50"
                  >
                    Edit Resume
                  </button>
                  <DownloadButton onClick={handleDownload} generating={generating} />
                </div>
                {downloadError && <span className="text-[10px] font-bold text-rose-500 mt-1 max-w-[200px] text-right">{downloadError}</span>}
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-6 px-6 py-6">

          <StudioPreviewCard
            resumeData={resumeData}
            selectedTemplate={selectedTemplate}
            selectedTemplateName={selectedTemplateName}
            fontFamily={fontFamily}
            fontSize={fontSize}
            onFontFamilyChange={setFontFamily}
            onFontSizeChange={setFontSize}
          />

        </main>
      </div>

      {isEditingWizardOpen && resumeData && (
        <CreateFromScratchWizard
          resumeId={resumeId}
          initialData={resumeData}
          onClose={() => setIsEditingWizardOpen(false)}
          onSuccess={() => {
            setIsEditingWizardOpen(false);
            if (resumeId) fetchBuilderData(resumeId);
          }}
        />
      )}
    </div>
  );
};



const TemplateDropdown: React.FC<{
  value: string;
  templates: Array<{ id: string; name: string }>;
  onChange: (value: string) => void;
  className?: string;
}> = ({ value, templates, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedTemplate = templates.find((t) => t.id === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(templates.findIndex(t => t.id === value));
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < templates.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : templates.length - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < templates.length) {
          onChange(templates[focusedIndex].id);
          setIsOpen(false);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listboxRef.current) {
      const activeElement = listboxRef.current.children[focusedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#DED6C4] bg-white px-5 py-3 text-sm font-black text-slate-900 outline-none transition-all focus:border-[#173404] focus:ring-2 focus:ring-[#173404]/10 hover:bg-slate-50 cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setFocusedIndex(templates.findIndex(t => t.id === value));
        }}
        onKeyDown={handleKeyDown}
      >
        <span>{selectedTemplate?.name || 'Select Template'}</span>
        <ChevronDown 
          size={16} 
          className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-full min-w-[280px] overflow-hidden rounded-[12px] border border-slate-200 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
          >
            <ul
              ref={listboxRef}
              role="listbox"
              aria-activedescendant={focusedIndex >= 0 ? `template-option-${focusedIndex}` : undefined}
              className="flex max-h-[340px] flex-col gap-1 overflow-y-auto outline-none"
              tabIndex={-1}
            >
              {templates.map((template, index) => {
                const isSelected = template.id === value;
                const isFocused = index === focusedIndex;
                
                return (
                  <li
                    key={template.id}
                    id={`template-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(template.id);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`
                      relative flex cursor-pointer items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors duration-100
                      ${isSelected ? 'bg-[#F1F8EA] text-[#173404] font-black' : 'text-slate-900 font-bold'}
                      ${!isSelected && isFocused ? 'bg-[#F1F8EA]/60' : ''}
                      ${isFocused ? 'ring-1 ring-[#173404]/10' : ''}
                    `}
                  >
                    <span>{template.name}</span>
                    {isSelected && (
                      <Check size={16} className="text-[#6C7E3D]" />
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DownloadButton: React.FC<{
  onClick: () => void;
  generating: boolean;
}> = ({ onClick, generating }) => (
  <button
    onClick={onClick}
    disabled={generating}
    className="inline-flex h-[46px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {generating ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
    {generating ? 'Exporting...' : 'Download'}
  </button>
);

const StudioPreviewCard: React.FC<{
  resumeData: ResumeBuilderData;
  selectedTemplate: string;
  selectedTemplateName: string;
  fontFamily: string;
  fontSize: string;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: string) => void;
}> = ({
  resumeData,
  selectedTemplate,
  selectedTemplateName,
  fontFamily,
  fontSize,
  onFontFamilyChange,
  onFontSizeChange
}) => {
  const TemplateComponent = TemplateRegistry[selectedTemplate] || TemplateRegistry.harvard;

  return (
    <section className="rounded-[28px] border border-[#E0D8C7] bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Live Preview</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Synchronized in real-time with {selectedTemplateName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={fontFamily}
            onChange={(event) => onFontFamilyChange(event.target.value)}
            className="rounded-xl border border-[#DED6C4] bg-[#FAF8EF] px-4 py-2 text-[11px] font-black text-slate-800 outline-none"
          >
            <option value="Inter">Inter (Default)</option>
            <option value="Calibri">Calibri</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Roboto">Roboto</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
          <select
            value={fontSize}
            onChange={(event) => onFontSizeChange(event.target.value)}
            className="rounded-xl border border-[#DED6C4] bg-[#FAF8EF] px-4 py-2 text-[11px] font-black text-slate-800 outline-none"
          >
            <option value="10pt">10 pt</option>
            <option value="11pt">11 pt (Recommended)</option>
            <option value="12pt">12 pt</option>
          </select>
        </div>
      </div>

      <div className="max-h-[760px] overflow-auto rounded-[24px] border border-[#E0D8C7] bg-[#ECE9DF] p-5 shadow-inner">
        <div className="mx-auto w-full max-w-[900px] rounded-2xl bg-white shadow-xl">
          <TemplateComponent data={resumeData} fontFamily={fontFamily} fontSize={fontSize} />
        </div>
      </div>
    </section>
  );
};

export default ResumeBuilderDesktop;
