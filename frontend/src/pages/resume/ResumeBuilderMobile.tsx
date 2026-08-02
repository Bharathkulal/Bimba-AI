import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Download, Sparkles, CheckCircle2, 
  Trash2, Plus, ArrowUp, ArrowDown, ChevronRight, Eye,
  ShieldCheck, AlertCircle, RefreshCw, Award
} from 'lucide-react';
import { useResumeBuilderStore } from '../../store/resumeBuilderStore';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { apiClient } from '../../services/api';

export const ResumeBuilderMobile: React.FC = () => {
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

  // Wizard steps: 'info' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'preview'
  const steps: ('info' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'preview')[] = [
    'info', 'summary', 'skills', 'experience', 'projects', 'education', 'preview'
  ];
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = steps[currentStepIdx];

  useEffect(() => {
    if (resumeId) {
      fetchBuilderData(resumeId);
    }
  }, [resumeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">Loading wizard...</span>
        </div>
      </div>
    );
  }

  if (errors || !resumeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 p-6 rounded-2xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle size={22} />
          </div>
          <h3 className="text-base font-black text-slate-855">Resume Builder Unavailable</h3>
          <p className="text-xs text-slate-500 font-semibold">{errors || 'Select a valid draft to launch wizard.'}</p>
          <button 
            onClick={() => navigate('/resume')}
            className="px-4 py-2 bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer border-none"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleFieldChange = (section: string, field: string, value: any) => {
    if (section === 'personal_info') {
      updateResumeData((prev) => ({
        ...prev,
        personal_info: {
          ...prev.personal_info,
          [field]: value
        }
      }));
    } else if (section === 'summary') {
      updateResumeData((prev) => ({
        ...prev,
        summary: value
      }));
    } else if (section === 'skills') {
      updateResumeData((prev) => ({
        ...prev,
        skills: value
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between w-full text-slate-800 pb-20 text-left">
      
      {/* 1. Header with steps indicator */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/resume')}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Resume Wizard
            </h1>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
              Step {currentStepIdx + 1} of {steps.length}: {currentStep.toUpperCase()}
            </span>
          </div>
        </div>
        <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
          ATS Optimized
        </span>
      </header>

      {/* 2. Wizard content area */}
      <main className="flex-1 p-4 overflow-y-auto">
        <Card className="p-5 bg-white border border-slate-200/60 shadow-sm flex flex-col gap-4 text-left">
          
          {/* STEP 1: PERSONAL INFO */}
          {currentStep === 'info' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h2 className="text-sm font-extrabold text-slate-900 border-b pb-2 mb-2">Personal Information</h2>
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Full Name</label>
                <input 
                  type="text"
                  value={resumeData.personal_info.name || ''}
                  onChange={(e) => handleFieldChange('personal_info', 'name', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  placeholder="e.g. Samantha Williams"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">Email address</label>
                <input 
                  type="email"
                  value={resumeData.personal_info.email || ''}
                  onChange={(e) => handleFieldChange('personal_info', 'email', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  placeholder="e.g. samantha@example.com"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">Phone Number</label>
                <input 
                  type="tel"
                  value={resumeData.personal_info.phone || ''}
                  onChange={(e) => handleFieldChange('personal_info', 'phone', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  placeholder="e.g. (123) 456-7890"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">Location</label>
                <input 
                  type="text"
                  value={resumeData.personal_info.location || ''}
                  onChange={(e) => handleFieldChange('personal_info', 'location', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  placeholder="e.g. New York, NY"
                />
              </div>
            </div>
          )}

          {/* STEP 2: SUMMARY */}
          {currentStep === 'summary' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h2 className="text-sm font-extrabold text-slate-900 border-b pb-2 mb-2">Professional Summary</h2>
              <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">
                Briefly summarize your experience, career focus, and core skillsets.
              </p>
              <div>
                <textarea 
                  rows={6}
                  value={resumeData.summary || ''}
                  onChange={(e) => handleFieldChange('summary', '', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-bold text-slate-800 outline-none leading-relaxed"
                  placeholder="e.g. Creative marketing specialist with 2+ years of work history..."
                />
              </div>
            </div>
          )}

          {/* STEP 3: SKILLS */}
          {currentStep === 'skills' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h2 className="text-sm font-extrabold text-slate-900 border-b pb-2 mb-2">Technical Skills</h2>
              <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">
                Enter your key technical stack separated by commas.
              </p>
              <div>
                <textarea 
                  rows={4}
                  value={resumeData.skills || ''}
                  onChange={(e) => handleFieldChange('skills', '', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-bold text-slate-800 outline-none leading-relaxed"
                  placeholder="e.g. React, TypeScript, Python, TailwindCSS"
                />
              </div>
            </div>
          )}

          {/* STEP 4: EXPERIENCE */}
          {currentStep === 'experience' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h2 className="text-sm font-extrabold text-slate-900 border-b pb-2 mb-2">Work History</h2>
              <div className="flex flex-col gap-3">
                {resumeData.experience?.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold py-6 text-center">No experience items listed yet.</p>
                ) : (
                  resumeData.experience?.map((exp: any, idx: number) => (
                    <div key={idx} className="p-3.5 border border-slate-100 bg-slate-50/50 rounded-xl">
                      <h4 className="font-extrabold text-xs text-slate-800">{exp.role}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{exp.company} • {exp.duration}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 5: PROJECTS */}
          {currentStep === 'projects' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h2 className="text-sm font-extrabold text-slate-900 border-b pb-2 mb-2">Academic Projects</h2>
              <div className="flex flex-col gap-3">
                {resumeData.projects?.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold py-6 text-center">No projects listed yet.</p>
                ) : (
                  resumeData.projects?.map((proj: any, idx: number) => (
                    <div key={idx} className="p-3.5 border border-slate-100 bg-slate-50/50 rounded-xl">
                      <h4 className="font-extrabold text-xs text-slate-800">{proj.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{proj.technologies}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 6: EDUCATION */}
          {currentStep === 'education' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h2 className="text-sm font-extrabold text-slate-900 border-b pb-2 mb-2">Education History</h2>
              <div className="flex flex-col gap-3">
                {resumeData.education?.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold py-6 text-center">No education listed yet.</p>
                ) : (
                  resumeData.education?.map((edu: any, idx: number) => (
                    <div key={idx} className="p-3.5 border border-slate-100 bg-slate-50/50 rounded-xl">
                      <h4 className="font-extrabold text-xs text-slate-800">{edu.degree}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{edu.school} • Grade: {edu.grade}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 7: PREVIEW */}
          {currentStep === 'preview' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h2 className="text-sm font-extrabold text-slate-900 border-b pb-2 mb-2">Review Resume</h2>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col gap-4">
                <div className="border-b pb-3 text-center">
                  <h3 className="font-extrabold text-sm text-slate-800">{resumeData.personal_info.name || 'Draft'}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{resumeData.personal_info.email || 'No email'}</p>
                </div>
                <div className="text-xs">
                  <h4 className="font-extrabold text-slate-700 block uppercase tracking-wider text-[9px] mb-1">Summary</h4>
                  <p className="text-slate-550 leading-relaxed">{resumeData.summary || 'No summary written yet.'}</p>
                </div>
              </div>
            </div>
          )}

        </Card>
      </main>

      {/* 3. Sticky bottom wizard buttons */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-30 flex items-center gap-3">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIdx === 0}
          className="flex-1 py-3.5 font-bold min-h-[48px] rounded-xl text-xs flex items-center justify-center"
        >
          Back
        </Button>
        
        {currentStep === 'preview' ? (
          <Button
            onClick={() => resumeId && generatePdf(resumeId)}
            disabled={generating}
            className="flex-1 py-3.5 font-bold min-h-[48px] rounded-xl text-xs bg-slate-900 text-white flex items-center justify-center gap-2"
          >
            <Download size={14} /> {generating ? 'Downloading...' : 'Download'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="flex-1 py-3.5 font-bold min-h-[48px] rounded-xl text-xs bg-slate-900 text-white flex items-center justify-center"
          >
            Next
          </Button>
        )}
      </footer>

    </div>
  );
};
