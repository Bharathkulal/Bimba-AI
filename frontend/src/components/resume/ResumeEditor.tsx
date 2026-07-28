import React, { useState } from 'react';
import { useResumeBuilderStore } from '../../store/resumeBuilderStore';
import { Sparkles, RefreshCw, Plus, Trash2, ArrowUpRight, Check } from 'lucide-react';

export const ResumeEditor: React.FC = () => {
  const { resumeData, aiImprovements, updateResumeData } = useResumeBuilderStore();
  const [activeSection, setActiveSection] = useState<'info' | 'summary' | 'skills' | 'experience' | 'projects' | 'education'>('info');

  if (!resumeData) return null;

  const handleInfoChange = (field: string, value: string) => {
    updateResumeData((prev) => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }));
  };

  const handleSummaryChange = (value: string) => {
    updateResumeData((prev) => ({
      ...prev,
      summary: value
    }));
  };

  const handleSkillsChange = (value: string) => {
    updateResumeData((prev) => ({
      ...prev,
      skills: value.split(',').map(s => s.trim()).filter(Boolean)
    }));
  };

  // --- Experience Handlers ---
  const handleExperienceChange = (idx: number, field: string, value: string) => {
    updateResumeData((prev) => {
      const expCopy = [...prev.experience];
      expCopy[idx] = { ...expCopy[idx], [field]: value };
      return { ...prev, experience: expCopy };
    });
  };

  const addExperience = () => {
    updateResumeData((prev) => ({
      ...prev,
      experience: [...prev.experience, { position: '', company: '', duration: '', description: '' }]
    }));
  };

  const removeExperience = (idx: number) => {
    updateResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx)
    }));
  };

  // --- Project Handlers ---
  const handleProjectChange = (idx: number, field: string, value: string) => {
    updateResumeData((prev) => {
      const projCopy = [...prev.projects];
      projCopy[idx] = { ...projCopy[idx], [field]: value };
      return { ...prev, projects: projCopy };
    });
  };

  const addProject = () => {
    updateResumeData((prev) => ({
      ...prev,
      projects: [...prev.projects, { title: '', technologies: '', description: '' }]
    }));
  };

  const removeProject = (idx: number) => {
    updateResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx)
    }));
  };

  // --- Education Handlers ---
  const handleEducationChange = (idx: number, field: string, value: string) => {
    updateResumeData((prev) => {
      const eduCopy = [...prev.education];
      eduCopy[idx] = { ...eduCopy[idx], [field]: value };
      return { ...prev, education: eduCopy };
    });
  };

  const addEducation = () => {
    updateResumeData((prev) => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: '' }]
    }));
  };

  const removeEducation = (idx: number) => {
    updateResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx)
    }));
  };

  // --- AI Injection Handlers ---
  const applyAiSummary = () => {
    if (aiImprovements?.summary?.improved) {
      handleSummaryChange(aiImprovements.summary.improved);
    }
  };

  const restoreOriginalSummary = () => {
    if (aiImprovements?.summary?.original) {
      handleSummaryChange(aiImprovements.summary.original);
    }
  };

  const applyAiProject = (idx: number) => {
    const aiProj = aiImprovements?.projects?.[idx]?.improved;
    if (aiProj) {
      handleProjectChange(idx, 'description', aiProj);
    }
  };

  const restoreOriginalProject = (idx: number) => {
    const origProj = aiImprovements?.projects?.[idx]?.original;
    if (origProj) {
      handleProjectChange(idx, 'description', origProj);
    }
  };

  const applyAiExperience = (idx: number) => {
    const aiExp = aiImprovements?.experience?.[idx]?.improved;
    if (aiExp) {
      handleExperienceChange(idx, 'description', aiExp);
    }
  };

  const restoreOriginalExperience = (idx: number) => {
    const origExp = aiImprovements?.experience?.[idx]?.original;
    if (origExp) {
      handleExperienceChange(idx, 'description', origExp);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Sections Tab Header */}
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-200 dark:border-white/10 flex-wrap">
        {[
          { id: 'info', label: 'Contact' },
          { id: 'summary', label: 'Summary' },
          { id: 'skills', label: 'Skills' },
          { id: 'experience', label: 'Experience' },
          { id: 'projects', label: 'Projects' },
          { id: 'education', label: 'Education' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
              activeSection === tab.id
                ? 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor Panels */}
      <div className="min-h-[360px] bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 p-4 rounded-2xl">
        
        {/* CONTACT SECTION */}
        {activeSection === 'info' && (
          <div className="flex flex-col gap-3.5">
            <h4 className="text-xs font-black uppercase text-slate-400">Contact Information</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                <input
                  type="text"
                  value={resumeData.personal_info.name}
                  onChange={(e) => handleInfoChange('name', e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
                <input
                  type="email"
                  value={resumeData.personal_info.email}
                  onChange={(e) => handleInfoChange('email', e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Phone</label>
                <input
                  type="text"
                  value={resumeData.personal_info.phone}
                  onChange={(e) => handleInfoChange('phone', e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Location</label>
                <input
                  type="text"
                  value={resumeData.personal_info.location}
                  onChange={(e) => handleInfoChange('location', e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY SECTION */}
        {activeSection === 'summary' && (
          <div className="flex flex-col gap-3.5">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-slate-400">Professional Summary</h4>
              {aiImprovements?.summary && (
                <div className="flex gap-2">
                  <button
                    onClick={applyAiSummary}
                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10 font-bold text-[9px] rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles size={9} /> Use AI Improved
                  </button>
                  <button
                    onClick={restoreOriginalSummary}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-550 border border-slate-200 font-bold text-[9px] rounded-lg cursor-pointer"
                  >
                    Restore Original
                  </button>
                </div>
              )}
            </div>
            <textarea
              value={resumeData.summary}
              onChange={(e) => handleSummaryChange(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-semibold"
            />
          </div>
        )}

        {/* SKILLS SECTION */}
        {activeSection === 'skills' && (
          <div className="flex flex-col gap-3.5">
            <h4 className="text-xs font-black uppercase text-slate-400">Technical Skills</h4>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Skills (Comma Separated)</label>
              <textarea
                value={resumeData.skills.join(', ')}
                onChange={(e) => handleSkillsChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>
        )}

        {/* EXPERIENCE SECTION */}
        {activeSection === 'experience' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-slate-400">Professional Experience</h4>
              <button
                onClick={addExperience}
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white font-bold text-[9px] rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Plus size={10} /> Add Experience
              </button>
            </div>

            <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
              {resumeData.experience.map((exp, idx) => (
                <div key={idx} className="border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl flex flex-col gap-3 relative bg-white/40 dark:bg-white/5">
                  <button
                    onClick={() => removeExperience(idx)}
                    className="absolute right-3 top-3 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div className="grid grid-cols-2 gap-3 pr-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Position</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => handleExperienceChange(idx, 'position', e.target.value)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Duration (e.g. 2023 - Present)</label>
                      <input
                        type="text"
                        value={exp.duration}
                        onChange={(e) => handleExperienceChange(idx, 'duration', e.target.value)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1 col-span-2">
                      <div className="flex justify-between items-center mb-0.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Description / Bullets</label>
                        {aiImprovements?.experience?.[idx] && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => applyAiExperience(idx)}
                              className="px-1.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10 font-bold text-[8px] rounded cursor-pointer"
                            >
                              AI Improve
                            </button>
                            <button
                              onClick={() => restoreOriginalExperience(idx)}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-550 border border-slate-200 font-bold text-[8px] rounded cursor-pointer"
                            >
                              Restore
                            </button>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={exp.description}
                        onChange={(e) => handleExperienceChange(idx, 'description', e.target.value)}
                        rows={3}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROJECTS SECTION */}
        {activeSection === 'projects' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-slate-400">Projects</h4>
              <button
                onClick={addProject}
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white font-bold text-[9px] rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Plus size={10} /> Add Project
              </button>
            </div>

            <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
              {resumeData.projects.map((proj, idx) => (
                <div key={idx} className="border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl flex flex-col gap-3 relative bg-white/40 dark:bg-white/5">
                  <button
                    onClick={() => removeProject(idx)}
                    className="absolute right-3 top-3 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div className="grid grid-cols-2 gap-3 pr-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Title</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => handleProjectChange(idx, 'title', e.target.value)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Technologies</label>
                      <input
                        type="text"
                        value={proj.technologies}
                        onChange={(e) => handleProjectChange(idx, 'technologies', e.target.value)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1 col-span-2">
                      <div className="flex justify-between items-center mb-0.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Description</label>
                        {aiImprovements?.projects?.[idx] && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => applyAiProject(idx)}
                              className="px-1.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10 font-bold text-[8px] rounded cursor-pointer"
                            >
                              AI Improve
                            </button>
                            <button
                              onClick={() => restoreOriginalProject(idx)}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-550 border border-slate-200 font-bold text-[8px] rounded cursor-pointer"
                            >
                              Restore
                            </button>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={proj.description}
                        onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                        rows={3}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDUCATION SECTION */}
        {activeSection === 'education' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-slate-400">Education</h4>
              <button
                onClick={addEducation}
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white font-bold text-[9px] rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Plus size={10} /> Add Education
              </button>
            </div>

            <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
              {resumeData.education.map((edu, idx) => (
                <div key={idx} className="border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl flex flex-col gap-3 relative bg-white/40 dark:bg-white/5">
                  <button
                    onClick={() => removeEducation(idx)}
                    className="absolute right-3 top-3 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div className="grid grid-cols-2 gap-3 pr-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(idx, 'degree', e.target.value)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Institution / School</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => handleEducationChange(idx, 'institution', e.target.value)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Graduation Year</label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => handleEducationChange(idx, 'year', e.target.value)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default ResumeEditor;
