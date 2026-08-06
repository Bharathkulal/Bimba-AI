import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Award,
  Download,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { useResumeBuilderStore, type ResumeBuilderData } from '../../store/resumeBuilderStore';
import { ResumePreview } from '../../components/resume/ResumePreview';
import { TemplateSelector } from '../../components/resume/TemplateSelector';
import { ResumeEditor } from '../../components/resume/ResumeEditor';
import { TemplateRegistry, templateMetadata } from '../../components/resume/templates';

type ActiveSection = 'info' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'portfolio';
type NavigationTab = 'editor' | 'templates' | 'analysis';

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
  const [activeSection, setActiveSection] = useState<ActiveSection>('info');
  const [navigationTab, setNavigationTab] = useState<NavigationTab>('editor');
  const [fontFamily, setFontFamily] = useState(initialPrefs.fontFamily || 'Inter');
  const [fontSize, setFontSize] = useState(initialPrefs.fontSize || '11pt');
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [sections, setSections] = useState<string[]>([
    'Contact Info',
    'Professional Summary',
    'Technical Skills',
    'Work Experience',
    'Academic Projects',
    'Education',
    'Certifications',
    'Portfolio Links'
  ]);

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

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setSections(updated);
  };

  const calculateAtsScore = () => {
    if (!resumeData) return 0;
    let score = 30;

    if (resumeData.personal_info.email && resumeData.personal_info.phone) score += 10;
    if (resumeData.summary && resumeData.summary.length > 50) score += 15;
    if (resumeData.skills && resumeData.skills.length > 3) score += 15;
    if (resumeData.experience && resumeData.experience.length > 0) score += 15;
    if (resumeData.projects && resumeData.projects.length > 0) score += 10;
    if (resumeData.education && resumeData.education.length > 0) score += 5;

    return Math.min(score, 100);
  };

  const atsScore = calculateAtsScore();

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
              <SegmentedTabs activeTab={navigationTab} onChange={setNavigationTab} />
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
                <DownloadButton onClick={handleDownload} generating={generating} />
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

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="flex min-h-[560px] flex-col gap-4 overflow-y-auto rounded-[24px] border border-slate-200/70 bg-white p-5 text-left shadow-sm lg:col-span-3 lg:max-h-[760px]">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Document Sections</h3>
                <p className="text-[10px] font-semibold text-slate-400">Organize section hierarchy for scanning priority</p>
              </div>

              <div className="flex flex-col gap-2">
                {sections.map((section, idx) => {
                  const editorMap: Record<string, ActiveSection> = {
                    'Contact Info': 'info',
                    'Professional Summary': 'summary',
                    'Technical Skills': 'skills',
                    'Work Experience': 'experience',
                    'Academic Projects': 'projects',
                    Education: 'education'
                  };
                  const targetSec = editorMap[section];
                  const isActive = activeSection === targetSec;

                  return (
                    <div
                      key={section}
                      onClick={() => {
                        setActiveSection(targetSec);
                        setNavigationTab('editor');
                      }}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                        isActive ? 'border-[#173404] bg-[#F1F8EA]' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-extrabold text-slate-700">{section}</span>
                      </div>

                      <div className="flex shrink-0 items-center gap-1" onClick={(event) => event.stopPropagation()}>
                        <button
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                          aria-label={`Move ${section} up`}
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === sections.length - 1}
                          className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                          aria-label={`Move ${section} down`}
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex min-h-[560px] flex-col gap-4 overflow-y-auto rounded-[24px] border border-slate-200/70 bg-white p-6 shadow-sm lg:col-span-5 lg:max-h-[760px]">
              {navigationTab === 'editor' && (
                <ResumeEditor activeSection={activeSection} setActiveSection={setActiveSection} />
              )}

              {navigationTab === 'templates' && <TemplateSelector />}

              {navigationTab === 'analysis' && (
                <div className="flex flex-col gap-4 text-left">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">ATS Scanner Analysis</h4>
                    <p className="text-[10px] font-semibold text-slate-400">Real-time keyword audit and styling scoring</p>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4.5">
                    <div className="space-y-1">
                      <h4 className="text-2xl font-black text-slate-900">{atsScore}%</h4>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Overall ATS Match</p>
                    </div>
                    <div className="flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-emerald-500/20 border-t-emerald-600" />
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5 rounded-xl border border-indigo-100/50 bg-indigo-50/50 p-3">
                      <ShieldCheck size={14} className="mt-0.5 shrink-0 text-indigo-600" />
                      <div className="text-[10.5px]">
                        <h5 className="font-extrabold text-slate-800">Perfect Formatting</h5>
                        <p className="mt-0.5 font-bold text-slate-500">
                          Template constraints prevent multi-column splits, ensuring high parse rates in automated screening bots.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-100/50 bg-amber-50/50 p-3">
                      <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                      <div className="text-[10.5px]">
                        <h5 className="font-extrabold text-slate-800">Add Achievements Details</h5>
                        <p className="mt-0.5 font-bold text-slate-500">
                          Make sure to outline measurable business values like percentages, savings, and metrics in work experience descriptions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex min-h-[560px] flex-col gap-4 overflow-y-auto rounded-[24px] border border-slate-200/70 bg-white p-6 shadow-sm lg:col-span-4 lg:max-h-[760px]">
              <ResumePreview
                fontFamily={fontFamily}
                fontSize={fontSize}
                onFontFamilyChange={setFontFamily}
                onFontSizeChange={setFontSize}
                frameClassName="max-h-[620px] min-h-[460px]"
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

const SegmentedTabs: React.FC<{
  activeTab: NavigationTab;
  onChange: (tab: NavigationTab) => void;
}> = ({ activeTab, onChange }) => {
  const tabs: Array<{ id: NavigationTab; label: string }> = [
    { id: 'editor', label: 'Form Editor' },
    { id: 'templates', label: 'Templates' },
    { id: 'analysis', label: 'ATS Checker' }
  ];

  return (
    <div className="flex rounded-2xl bg-[#DED6C4] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`cursor-pointer rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wide transition ${
            activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const TemplateDropdown: React.FC<{
  value: string;
  templates: Array<{ id: string; name: string }>;
  onChange: (value: string) => void;
  className?: string;
}> = ({ value, templates, onChange, className = '' }) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className={`rounded-2xl border border-[#DED6C4] bg-white px-5 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-[#173404] focus:ring-2 focus:ring-[#173404]/10 ${className}`}
  >
    {templates.map((template) => (
      <option key={template.id} value={template.id}>
        {template.name}
      </option>
    ))}
  </select>
);

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
