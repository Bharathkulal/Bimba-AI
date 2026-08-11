import React, { useState } from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { Card } from '../../Card';
import { Button } from '../../Button';
import { CheckCircle2, AlertTriangle, HelpCircle, Save, Award } from 'lucide-react';

export const SnapshotEditorStep: React.FC = () => {
  const { parsedData, triggerAutosave, setStep } = useResumeBuilderContext();

  const sectionsList = [
    { id: 'personal_info', label: 'Personal Info' },
    { id: 'summary', label: 'Summary' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'technicalSkills', label: 'Technical Skills' },
    { id: 'softSkills', label: 'Soft Skills' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'internships', label: 'Internships' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'languages', label: 'Languages' },
    { id: 'portfolioLinks', label: 'Portfolio Links' },
    { id: 'publications', label: 'Publications' },
    { id: 'volunteerExperience', label: 'Volunteer Experience' },
    { id: 'references', label: 'References' },
    { id: 'hobbies', label: 'Hobbies' }
  ];

  const [activeSection, setActiveSection] = useState('personal_info');
  const [visitedSections, setVisitedSections] = useState<string[]>(['personal_info']);

  const handleSectionSelect = (id: string) => {
    setActiveSection(id);
    if (!visitedSections.includes(id)) {
      setVisitedSections(prev => [...prev, id]);
    }
  };

  const handleFieldChange = (field: string, val: any) => {
    if (!parsedData) return;
    
    if (activeSection === 'personal_info') {
      const updatedInfo = { ...parsedData.personal_info, [field]: val };
      triggerAutosave({ personal_info: updatedInfo });
    } else if (activeSection === 'summary') {
      triggerAutosave({ summary: val });
    }
  };

  const isFormValid = visitedSections.length >= sectionsList.length;

  return (
    <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 py-4 text-left items-start">
      
      {/* Left List of 16 Sections */}
      <div className="flex flex-col gap-2.5 h-[500px] overflow-y-auto pr-1">
        <div className="mb-2">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">Extracted Sections</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{visitedSections.length} of 16 sections reviewed</p>
        </div>

        {sectionsList.map((sec) => {
          const isActive = sec.id === activeSection;
          const isVisited = visitedSections.includes(sec.id);
          return (
            <button
              key={sec.id}
              onClick={() => handleSectionSelect(sec.id)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                isActive 
                  ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm' 
                  : 'border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10'
              }`}
            >
              <span className="text-xs">{sec.label}</span>
              {isVisited ? (
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-350 dark:bg-white/20 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right Form Editor Panel */}
      <div className="md:col-span-2 flex flex-col gap-5">
        <Card className="p-6 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-md min-h-[420px] flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                Edit {sectionsList.find(s => s.id === activeSection)?.label}
              </h3>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 font-bold text-[9px] px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                <Award size={10} /> AI Tagged
              </span>
            </div>

            {/* Render form conditionally */}
            {activeSection === 'personal_info' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    value={parsedData?.personal_info?.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Location</label>
                  <input
                    type="text"
                    className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    value={parsedData?.personal_info?.location || ''}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input
                    type="text"
                    className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    value={parsedData?.personal_info?.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    value={parsedData?.personal_info?.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                  />
                </div>
              </div>
            )}

            {activeSection === 'summary' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Professional Summary</label>
                <textarea
                  className="w-full h-44 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 resize-none"
                  value={parsedData?.summary || ''}
                  onChange={(e) => handleFieldChange('summary', e.target.value)}
                />
              </div>
            )}

            {/* Other sections stubs for demo */}
            {activeSection !== 'personal_info' && activeSection !== 'summary' && (
              <div className="text-center py-16 text-slate-450 font-bold text-xs flex flex-col items-center gap-3">
                <HelpCircle size={28} className="text-slate-350" />
                <span>AI extracted {(parsedData as any)?.[activeSection]?.length || 0} list objects for this section. Review edit arrays.</span>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-slate-100 dark:border-white/5 pt-4 mt-6">
            <Button
              onClick={() => setStep(5)}
              className="font-bold text-xs gap-1.5"
            >
              Continue to Templates
            </Button>
          </div>
        </Card>
      </div>

    </div>
  );
};
export default SnapshotEditorStep;
