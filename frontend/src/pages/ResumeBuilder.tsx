import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Download, Sparkles, CheckCircle2, 
  Trash2, Plus, ArrowUp, ArrowDown, ChevronRight, Eye,
  ShieldCheck, AlertCircle, RefreshCw, Layers, Award
} from 'lucide-react';
import { useResumeBuilderStore } from '../store/resumeBuilderStore';
import { ResumePreview } from '../components/resume/ResumePreview';
import { TemplateSelector } from '../components/resume/TemplateSelector';
import { ResumeEditor } from '../components/resume/ResumeEditor';

export const ResumeBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const resumeId = queryId ? parseInt(queryId, 10) : null;

  const { 
    resumeData, 
    aiImprovements, 
    loading, 
    errors, 
    fetchBuilderData, 
    updateResumeData,
    generatePdf,
    generating
  } = useResumeBuilderStore();

  // Active editor section
  const [activeSection, setActiveSection] = useState<'info' | 'summary' | 'skills' | 'experience' | 'projects' | 'education'>('info');

  // Sidebar navigation panel: 'editor' | 'templates' | 'analysis'
  const [navigationTab, setNavigationTab] = useState<'editor' | 'templates' | 'analysis'>('editor');

  // Section list for reordering
  const [sections, setSections] = useState<string[]>([
    'Contact Info',
    'Professional Summary',
    'Technical Skills',
    'Work Experience',
    'Academic Projects',
    'Education'
  ]);

  useEffect(() => {
    if (resumeId) {
      fetchBuilderData(resumeId);
    }
  }, [resumeId]);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sections.length) return;
    
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setSections(updated);
  };

  // Real-time ATS Scorer calculations
  const calculateAtsScore = () => {
    if (!resumeData) return 0;
    let score = 30; // base contact info score
    
    if (resumeData.personal_info.email && resumeData.personal_info.phone) score += 10;
    if (resumeData.summary && resumeData.summary.length > 50) score += 15;
    if (resumeData.skills && resumeData.skills.length > 3) score += 15;
    if (resumeData.experience && resumeData.experience.length > 0) score += 15;
    if (resumeData.projects && resumeData.projects.length > 0) score += 10;
    if (resumeData.education && resumeData.education.length > 0) score += 5;
    
    return Math.min(score, 100);
  };

  const atsScore = calculateAtsScore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">Loading Resume Builder...</span>
        </div>
      </div>
    );
  }

  if (errors || !resumeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle size={22} />
          </div>
          <h3 className="text-base font-black text-slate-800">Resume Builder Unavailable</h3>
          <p className="text-xs text-slate-500 font-semibold">{errors || 'Please upload a resume or select a valid document from your dashboard.'}</p>
          <button 
            onClick={() => navigate('/resume')}
            className="px-4 py-2 bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full text-slate-800">
      
      {/* BUILDER NAVIGATION TOPBAR */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate('/resume')}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-550 hover:text-slate-800 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="text-left">
            <h1 className="text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              ATS Resume Studio <Award className="text-emerald-500" size={15} />
            </h1>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Editing: {resumeData.personal_info.name || 'Untitled Draft'}</p>
          </div>
        </div>

        {/* Tab Controls for Side Panels */}
        <div className="flex items-center bg-slate-150 p-1 rounded-xl">
          <button 
            onClick={() => setNavigationTab('editor')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all cursor-pointer ${
              navigationTab === 'editor' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Form Editor
          </button>
          <button 
            onClick={() => setNavigationTab('templates')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all cursor-pointer ${
              navigationTab === 'templates' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Templates
          </button>
          <button 
            onClick={() => setNavigationTab('analysis')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all cursor-pointer ${
              navigationTab === 'analysis' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ATS Checker
          </button>
        </div>
      </header>

      {/* THREE PANEL GRID WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-6 h-[calc(100vh-68px)] overflow-hidden">
        
        {/* PANEL 1: SECTION LIST (Drag & Drop Reordering List) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/60 rounded-[22px] p-5 flex flex-col gap-4 shadow-sm h-full overflow-y-auto text-left">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Document Sections</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Organize section hierarchy for scanning priority</p>
          </div>

          <div className="flex flex-col gap-2">
            {sections.map((section, idx) => {
              // Map display section to editor section
              const editorMap: Record<string, 'info' | 'summary' | 'skills' | 'experience' | 'projects' | 'education'> = {
                'Contact Info': 'info',
                'Professional Summary': 'summary',
                'Technical Skills': 'skills',
                'Work Experience': 'experience',
                'Academic Projects': 'projects',
                'Education': 'education'
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
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isActive 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : 'border-slate-200 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-extrabold text-slate-700">{section}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => moveSection(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button 
                      onClick={() => moveSection(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL 2: CENTER FORM OR METADATA CONSOLE */}
        <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-[22px] p-6 flex flex-col gap-4 shadow-sm h-full overflow-y-auto">
          
          {navigationTab === 'editor' && (
            <ResumeEditor 
              activeSection={activeSection} 
              setActiveSection={setActiveSection} 
            />
          )}

          {navigationTab === 'templates' && (
            <TemplateSelector />
          )}

          {navigationTab === 'analysis' && (
            <div className="flex flex-col gap-4 text-left">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  ATS Scanner Analysis
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold">Real-time keyword audit and styling scoring</p>
              </div>

              {/* Score Arc */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-2xl font-black text-slate-900">{atsScore}%</h4>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Overall ATS Match</p>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 flex items-center justify-center animate-spin" />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                  <ShieldCheck size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-[10.5px]">
                    <h5 className="font-extrabold text-slate-800">Perfect Formatting</h5>
                    <p className="text-slate-500 font-bold mt-0.5">Template constraints prevent multi-column splits, ensuring 100% parse rates in automated screening bots.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                  <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[10.5px]">
                    <h5 className="font-extrabold text-slate-800">Add Achievements Details</h5>
                    <p className="text-slate-500 font-bold mt-0.5">Make sure to outline measurable business values like percentages, savings, and metrics in work experience descriptions.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* PANEL 3: LIVE PREVIEW CONTAINER */}
        <div className="lg:col-span-4 bg-white border border-slate-200/60 rounded-[22px] p-6 flex flex-col gap-4 shadow-sm h-full overflow-y-auto">
          <ResumePreview />
        </div>

      </div>

    </div>
  );
};

export default ResumeBuilder;
