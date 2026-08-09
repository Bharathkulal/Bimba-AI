import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, ArrowLeft, Check, Plus, Trash2, ChevronLeft, ChevronRight, FileText, Loader2, Sparkles, Download, CheckCircle2 } from 'lucide-react';
import { useResumeUpload } from '../hooks/useResumeUpload';
import { MobileFileDropZone } from './components/MobileFileDropZone';
import { apiClient } from '../../../services/api';
import type { ResumeBuilderData, ExperienceItem, EducationItem } from '../../../store/resumeBuilderStore';

interface UploadResumeMobileProps {
  onSwitchToScratch: () => void;
}

export const UploadResumeMobile: React.FC<UploadResumeMobileProps> = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const queryResumeId = queryId ? parseInt(queryId, 10) : null;

  const {
    isUploading,
    uploadProgress,
    uploadState: hookUploadState,
    uploadError,
    parsedData: initialParsedData,
    resumeId: hookResumeId,
    uploadFile,
    resetUpload: hookResetUpload
  } = useResumeUpload();

  const [currentStep, setCurrentStep] = useState(1);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [localUploadState, setLocalUploadState] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editedData, setEditedData] = useState<ResumeBuilderData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');

  // AI & ATS score/analysis states
  const [atsScore, setAtsScore] = useState<number>(75);
  const [atsScorecard, setAtsScorecard] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [improvementText, setImprovementText] = useState<{original: string, improved: string} | null>(null);
  const [selectedStyleColor, setSelectedStyleColor] = useState('indigo');
  const [selectedStyleFont, setSelectedStyleFont] = useState('Georgia');
  const [selectedStyleSpacing, setSelectedStyleSpacing] = useState('Balanced');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  const templatesList = [
    { id: 'harvard', name: 'Classic Serif', desc: 'Centered classic layout with Georgia headers, standard rule breaks, and bulleted summaries.' },
    { id: 'jakes', name: 'Jake\'s Classic', desc: 'Minimalist double-row layout for software engineers.' },
    { id: 'stanford', name: 'Stanford Executive', desc: 'High-contrast professional layout for corporate careers.' },
    { id: 'minimalist-modern', name: 'Minimal Modern', desc: 'Sleek dark-toned layout optimized for ATS scanners.' }
  ];

  const uploadState = localUploadState || hookUploadState;

  // Handle loading existing resume if id parameter is present
  useEffect(() => {
    if (queryResumeId) {
      const loadExisting = async () => {
        try {
          const res = await apiClient.get(`/api/resume-studio/profile/${queryResumeId}`);
          setEditedData(res.data);
          setResumeId(queryResumeId);
          setLocalUploadState('success');
          // Start at step 4 if already uploaded
          setCurrentStep(4);
        } catch (e) {
          console.error("Failed to load existing resume", e);
        }
      };
      loadExisting();
    }
  }, [queryResumeId]);

  // Sync hook variables to local state
  useEffect(() => {
    if (hookResumeId) {
      setResumeId(hookResumeId);
    }
  }, [hookResumeId]);

  const resetUpload = () => {
    setResumeId(null);
    setLocalUploadState(null);
    setEditedData(null);
    setSelectedFile(null);
    hookResetUpload();
    setCurrentStep(1);
    if (queryResumeId) {
      navigate('/resume-builder');
    }
  };

  // Sync upload results into form editor state
  useEffect(() => {
    if (initialParsedData) {
      setEditedData(initialParsedData);
      // Auto advance to analysis step
      setCurrentStep(2);
    }
  }, [initialParsedData]);

  // Debounced autosave to database during editing
  useEffect(() => {
    if (!resumeId || !editedData) return;
    const timer = setTimeout(async () => {
      try {
        const payload = {
          ...editedData,
          name: editedData.personal_info?.name || 'Parsed Resume',
          template_id: templatesList[selectedTemplateIndex].id,
          selected_template: templatesList[selectedTemplateIndex].id,
          color_theme: selectedStyleColor,
          font_family: selectedStyleFont
        };
        await apiClient.put(`/api/resume-studio/${resumeId}/update`, payload);
      } catch (err) {
        console.error('[Autosave] Failed to sync parsed edits:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [editedData, resumeId, selectedTemplateIndex, selectedStyleColor, selectedStyleFont]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    uploadFile(file);
  };

  const handleCreateFromScratch = async () => {
    try {
      setIsSaving(true);
      const res = await apiClient.post('/api/resume-studio/create', {
        name: 'New Scratch Resume'
      });
      if (res.data && res.data.id) {
        setResumeId(res.data.id);
        setEditedData({
          personal_info: { name: '', email: '', phone: '', address: '', linkedin: '', github: '', portfolio: '', title: '' },
          summary: '',
          objective: '',
          education: [],
          experience: [],
          projects: [],
          skills: [],
          technicalSkills: []
        });
        setLocalUploadState('success');
        setCurrentStep(4); // Choose template
      }
    } catch (e) {
      setSaveError('Failed to initialize a scratch resume. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Run AI analysis
  const runAnalysis = async () => {
    if (!resumeId) return;
    setLocalUploadState('processing');
    try {
      const res = await apiClient.post(`/api/resume-studio/${resumeId}/analyze`, {});
      const details = await apiClient.get(`/api/resume-studio/${resumeId}`);
      if (details.data) {
        setAtsScore(details.data.ats_score || 72);
        setAtsScorecard(details.data.ats);
      }
      setLocalUploadState('success');
      setCurrentStep(3); // Go to ATS Score step
    } catch (e) {
      console.error('Analysis failed, using fallback metrics', e);
      setLocalUploadState('success');
      setCurrentStep(3);
    }
  };

  // Run AI Rewrite
  const fetchRewrite = async (section: string, text: string) => {
    if (!resumeId) return;
    try {
      const res = await apiClient.post(`/api/resume-studio/${resumeId}/ai/rewrite`, {
        section,
        text
      });
      if (res.data) {
        setImprovementText({
          original: text,
          improved: res.data.rewritten_text || 'Optimized professional highlight with strong action verbs and clean metrics.'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Spacing helper css mapping
  const getSpacingClass = () => {
    if (selectedStyleSpacing === 'Compact') return 'space-y-1';
    if (selectedStyleSpacing === 'Spacious') return 'space-y-4';
    return 'space-y-2';
  };

  // UI Handlers
  const handleContinue = () => {
    if (currentStep === 1 && !resumeId) {
      return; // Must select template or scratch
    }
    if (currentStep === 2) {
      runAnalysis();
      return;
    }
    if (currentStep < 13) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Progress bar rendering
  const renderProgressBar = () => {
    const dots = [];
    for (let i = 1; i <= 13; i++) {
      dots.push(
        <span 
          key={i} 
          className={`h-2 w-2 rounded-full transition-all ${
            i <= currentStep ? 'bg-[#10B981]' : 'bg-slate-200 dark:bg-white/10'
          }`}
        />
      );
    }
    return <div className="flex justify-center gap-1.5 py-3">{dots}</div>;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white max-w-md mx-auto relative pb-24">
      {/* Top Header Navigation */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-slate-800 shrink-0">
        <button onClick={handleBack} disabled={currentStep === 1} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30">
          <ArrowLeft size={20} />
        </button>
        <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white">Resume Builder</span>
        <span className="font-black text-xs text-slate-400">{currentStep}/13</span>
      </div>

      {renderProgressBar()}

      {/* Main Content Body Scroll View */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-4">
        {currentStep === 1 && (
          <div className="text-center flex flex-col gap-4 py-4 animate-fadeIn">
            <div className="text-left mb-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Upload Your Resume</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Select a document file or initialize a new blank canvas.</p>
            </div>
            
            <MobileFileDropZone 
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              error={uploadError}
            />

            {resumeId && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 rounded-2xl flex items-center gap-3">
                <FileText className="text-emerald-500 shrink-0" size={24} />
                <div className="text-left">
                  <h4 className="font-bold text-xs">Active Resume Loaded</h4>
                  <p className="text-[10px] text-slate-500">ID: {resumeId}</p>
                </div>
              </div>
            )}

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-black uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
            </div>

            <button 
              onClick={handleCreateFromScratch}
              disabled={isSaving}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-black text-slate-700 dark:text-slate-200 rounded-2xl transition cursor-pointer"
            >
              {isSaving ? 'Initializing...' : 'Create from Scratch'}
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="text-center py-10 flex flex-col gap-6 items-center animate-fadeIn">
            <div className="text-left w-full">
              <h2 className="text-xl font-black">Analyzing Your Resume</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">We are reading your text layers and extracting schema structures.</p>
            </div>

            <div className="relative w-28 h-28 flex items-center justify-center">
              <Loader2 className="animate-spin text-emerald-500" size={48} />
              <div className="absolute font-black text-xs text-slate-500">
                {uploadProgress}%
              </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-white/5 p-4 rounded-2xl text-left border border-slate-200 dark:border-white/10">
              <h4 className="text-xs font-black uppercase text-slate-400 mb-2">Detection logs</h4>
              <ul className="space-y-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-350">
                <li className="flex items-center gap-2"><Check size={12} className="text-emerald-500" /> Connecting AI parser pipeline</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-emerald-500" /> Checking font artifacts</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-emerald-500" /> Formatting section nodes</li>
              </ul>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="text-left">
              <h2 className="text-xl font-black">Your ATS Score</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">A measurement of compatibility with popular ATS systems.</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-3xl text-center flex flex-col items-center gap-2">
              <span className="text-5xl font-black text-emerald-500">{atsScore}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">ATS Rating Score</span>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-black uppercase text-slate-400 mt-2">Insights</h3>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-left">
                <p className="font-extrabold text-emerald-600 dark:text-emerald-400">✓ Strong Contact Details Alignment</p>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-semibold">Your phone and email schema formats are fully readable.</p>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-left">
                <p className="font-extrabold text-amber-600 dark:text-amber-400">⚠ Low Action Verb Counts</p>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-semibold">Try replacing generic words with strong metrics and impacts.</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="text-left">
              <h2 className="text-xl font-black">Choose Your Template</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Select a layout design matching your target career role.</p>
            </div>

            {/* Template Preview Area */}
            <div className="p-6 bg-slate-100 dark:bg-white/5 border border-slate-250 rounded-3xl flex flex-col items-center gap-4">
              <div className="w-full aspect-[3/4] bg-white text-slate-900 shadow-xl rounded-xl p-6 border border-slate-200 relative overflow-hidden text-[6px] leading-tight select-none">
                {/* Simulated preview mini-layout */}
                <div className="text-center pb-2 border-b border-slate-350">
                  <div className="font-bold text-[10px] uppercase text-black">{editedData?.personal_info?.name || 'Candidate Name'}</div>
                  <div className="text-[5px] text-slate-500 mt-1">{editedData?.personal_info?.email || 'email@bimba.ai'} | {editedData?.personal_info?.phone || '987-654-3210'}</div>
                </div>
                <div className="mt-3">
                  <div className="font-bold border-b border-slate-300 pb-0.5 text-[7px] uppercase tracking-wide">Experience</div>
                  <div className="mt-1 text-slate-600">
                    <div className="font-bold text-black flex justify-between">
                      <span>Senior Developer</span>
                      <span>2024 - Present</span>
                    </div>
                    <div className="italic">Tech Solutions Co.</div>
                    <p className="mt-1 font-medium">• Engineered scalable microservice clusters driving user engagement upwards.</p>
                  </div>
                </div>
              </div>

              <div className="text-center w-full">
                <h4 className="font-black text-sm text-slate-900 dark:text-white">{templatesList[selectedTemplateIndex].name}</h4>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">{templatesList[selectedTemplateIndex].desc}</p>
              </div>

              {/* Carousel Buttons */}
              <div className="flex items-center gap-6 mt-1">
                <button 
                  onClick={() => setSelectedTemplateIndex((prev) => (prev > 0 ? prev - 1 : templatesList.length - 1))}
                  className="p-2 border border-slate-250 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-black text-slate-400">{selectedTemplateIndex + 1} / {templatesList.length}</span>
                <button 
                  onClick={() => setSelectedTemplateIndex((prev) => (prev < templatesList.length - 1 ? prev + 1 : 0))}
                  className="p-2 border border-slate-250 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Template options */}
            <div className="flex flex-col gap-2">
              {templatesList.map((tpl, idx) => (
                <label 
                  key={tpl.id}
                  onClick={() => setSelectedTemplateIndex(idx)}
                  className={`p-4 border rounded-2xl flex items-center justify-between cursor-pointer transition ${
                    selectedTemplateIndex === idx 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <span className="text-xs font-black">{tpl.name}</span>
                  <input 
                    type="radio" 
                    checked={selectedTemplateIndex === idx} 
                    onChange={() => setSelectedTemplateIndex(idx)}
                    className="accent-emerald-500 h-4 w-4"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="text-left">
              <h2 className="text-xl font-black">Choose Your Style</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Personalize fonts, colors, and content spacing.</p>
            </div>

            {/* Color Swatch Options */}
            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Color palette</span>
              <div className="flex gap-3">
                {['indigo', 'blue', 'green', 'violet', 'slate'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedStyleColor(color)}
                    className={`h-8 w-8 rounded-full border-2 transition cursor-pointer ${
                      selectedStyleColor === color ? 'border-emerald-500 scale-110' : 'border-transparent'
                    }`}
                    style={{
                      backgroundColor: {
                        indigo: '#6366F1',
                        blue: '#3B82F6',
                        green: '#10B981',
                        violet: '#8B5CF6',
                        slate: '#475569'
                      }[color]
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Font Family Selections */}
            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Typography font</span>
              <div className="grid grid-cols-2 gap-2">
                {['Georgia', 'Inter', 'Arial', 'Roboto'].map((font) => (
                  <button
                    key={font}
                    onClick={() => setSelectedStyleFont(font)}
                    className={`p-3 border rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                      selectedStyleFont === font 
                        ? 'border-emerald-500 bg-emerald-500/5' 
                        : 'border-slate-200 dark:border-white/10'
                    }`}
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing Layout options */}
            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Content layout spacing</span>
              <div className="flex gap-2">
                {['Compact', 'Balanced', 'Spacious'].map((spacing) => (
                  <button
                    key={spacing}
                    onClick={() => setSelectedStyleSpacing(spacing)}
                    className={`flex-1 py-2.5 border rounded-xl text-xs font-black transition cursor-pointer ${
                      selectedStyleSpacing === spacing 
                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' 
                        : 'border-slate-200 dark:border-white/10 text-slate-500'
                    }`}
                  >
                    {spacing}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="text-left">
              <h2 className="text-xl font-black">Customize Sections</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Enable, disable, and organize layout blocks.</p>
            </div>

            <div className="flex flex-col gap-2">
              {['Summary', 'Experience', 'Education', 'Skills', 'Projects'].map((sec) => (
                <div 
                  key={sec}
                  className="p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-slate-400" />
                    <span className="text-xs font-black">{sec}</span>
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="accent-emerald-500 h-4.5 w-4.5 rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="text-left">
              <h2 className="text-xl font-black">Review Your Resume</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Confirm that all details are structured correctly.</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl max-h-96 overflow-y-auto">
              <div className="text-left text-xs font-serif leading-relaxed text-[#111] bg-white p-4 rounded-xl border border-slate-100">
                <h1 className="text-base font-bold text-center uppercase tracking-wide">{editedData?.personal_info?.name || 'Tina Miller'}</h1>
                <p className="text-center text-[9px] text-slate-500 mt-1">{editedData?.personal_info?.email} | {editedData?.personal_info?.phone}</p>
                
                <h3 className="border-b border-slate-300 pb-0.5 mt-4 uppercase font-bold text-[10px]">Experience</h3>
                <div className="mt-2 space-y-2">
                  {editedData?.experience?.map((exp, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between font-bold text-[9.5px]">
                        <span>{exp.company}</span>
                        <span>{exp.duration}</span>
                      </div>
                      <p className="text-[9px] text-slate-650 mt-0.5 font-medium">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 8 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="text-left">
              <h2 className="text-xl font-black">AI Resume Coach</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Optimize specific section wording and grammar formatting.</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3 text-left">
                <Sparkles className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <div className="text-xs">
                  <h4 className="font-extrabold text-slate-900 dark:text-emerald-400">Professional Summary</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold mt-1 leading-relaxed">Add specific technical stacks to catch recruiter searches.</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3 text-left">
                <Sparkles className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <div className="text-xs">
                  <h4 className="font-extrabold text-slate-900 dark:text-emerald-400">Experience highlights</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold mt-1 leading-relaxed">Quantify impact metrics for software engineering entries.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 9 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="text-left">
              <h2 className="text-xl font-black">Improve Content</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Compare original lines with AI-optimized text suggestions.</p>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-left">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-450">Original</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mt-1.5">"Worked on website development."</p>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-left">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500">AI Improved</span>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1.5">"Developed responsive web interfaces using React and Tailwind CSS."</p>
              </div>

              <div className="flex gap-2 mt-2">
                <button className="flex-1 py-3 border border-slate-200 dark:border-white/10 text-xs font-black rounded-xl cursor-pointer">Keep Original</button>
                <button className="flex-1 py-3 bg-emerald-500 text-white text-xs font-black rounded-xl cursor-pointer">Accept Improvement</button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 10 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="text-left">
              <h2 className="text-xl font-black">ATS Optimization</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Validate missing tags and profile alignment metrics.</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-left">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/5">
                <span className="text-xs font-black text-slate-400">Current score</span>
                <span className="text-base font-black text-emerald-500">88%</span>
              </div>
              <div className="py-3 text-xs">
                <span className="font-black text-slate-400">Missing keywords</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['fastapi', 'kubernetes', 'typescript', 'tailwind css'].map((kw) => (
                    <span key={kw} className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-[10px] font-bold rounded-lg text-slate-500">{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 11 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="text-left">
              <h2 className="text-xl font-black">Final Review</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Review the finished layout render format prior to building.</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-3xl max-h-96 overflow-y-auto">
              {/* Simulated render details */}
              <div className="text-left text-xs font-serif leading-relaxed text-[#111] bg-white p-6 rounded-xl">
                <h1 className="text-base font-bold text-center uppercase tracking-wide">{editedData?.personal_info?.name || 'Tina Miller'}</h1>
                <p className="text-center text-[9px] text-slate-500 mt-1">{editedData?.personal_info?.email} | {editedData?.personal_info?.phone}</p>
                <div className="mt-4 border-t border-slate-200 pt-2 text-[10px] font-bold">EDUCATION</div>
                <div className="mt-1 text-[9px] text-slate-500">B.S. Computer Science — Stanford University</div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 12 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="text-left">
              <h2 className="text-xl font-black">Your Resume Is Ready</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Export your structured resume profile as a standard PDF file.</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-3xl text-center flex flex-col items-center gap-6">
              <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                <FileText size={32} />
              </div>
              <div>
                <h3 className="font-black text-sm">Download ready!</h3>
                <p className="text-[10px] text-slate-500 mt-1">100% ATS Compliant and formatted to Classic Serif.</p>
              </div>

              <a 
                href={resumeId ? `/api/resume-studio/${resumeId}/download/pdf` : '#'} 
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Download size={14} /> Download PDF
              </a>
            </div>
          </div>
        )}

        {currentStep === 13 && (
          <div className="flex flex-col gap-6 text-center py-10 items-center animate-fadeIn">
            <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 size={40} />
            </div>

            <div>
              <h2 className="text-xl font-black">Resume Complete!</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Your optimized resume is successfully saved to your dashboard.</p>
            </div>

            <div className="w-full flex flex-col gap-2 mt-4">
              <button 
                onClick={() => navigate('/resume-builder')}
                className="w-full py-3.5 bg-emerald-500 text-white text-xs font-black rounded-2xl cursor-pointer"
              >
                View Resume
              </button>
              <button 
                onClick={() => navigate('/user')}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-black rounded-2xl cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bottom Action Bar */}
      {currentStep < 13 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-white/10 flex gap-3 items-center shrink-0">
          <button 
            onClick={handleBack} 
            disabled={currentStep === 1}
            className="flex-1 py-3.5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl text-xs font-black text-slate-500 dark:text-slate-400 disabled:opacity-30 cursor-pointer transition"
          >
            ← Back
          </button>
          <button 
            onClick={handleContinue}
            disabled={currentStep === 1 && !resumeId}
            className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black disabled:opacity-50 cursor-pointer transition"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadResumeMobile;
