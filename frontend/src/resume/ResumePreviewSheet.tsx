import React from 'react';
import { TEMPLATE_REGISTRY, COLOR_THEMES, FONTS } from './templatesRegistry';
import type { LayoutType } from './templatesRegistry';

interface ResumePreviewSheetProps {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    summary: string;
  };
  educationList: Array<{
    institution: string;
    degree: string;
    passing_year: number;
    achievements?: string;
    cgpa?: number | string;
  }>;
  experienceList: Array<{
    position: string;
    company: string;
    duration: string;
    description: string;
  }>;
  projectList: Array<{
    name: string;
    duration?: string;
    tech_stack?: string;
    description: string;
  }>;
  skillList: Array<{
    name: string;
    level: number;
  }>;
  certificateList: Array<{
    name: string;
    organization: string;
    issue_date?: string;
  }>;
  achievements: {
    hackathons?: string;
    awards?: string;
    soft_skills?: string;
  };
  sectionVisibility: {
    experience: boolean;
    projects: boolean;
    skills: boolean;
    certificates: boolean;
    achievements: boolean;
  };
  templateId: string;
  colorTheme: string;
  zoomLevel?: number;
}

export const ResumePreviewSheet: React.FC<ResumePreviewSheetProps> = ({
  personalInfo,
  educationList,
  experienceList,
  projectList,
  skillList,
  certificateList,
  achievements,
  sectionVisibility,
  templateId,
  colorTheme,
  zoomLevel = 1
}) => {
  const activeTemplate = TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY.modern;
  const activeFont = FONTS[activeTemplate.fontFamily] || 'font-sans';
  
  // Resolve theme color classes
  const activeThemeColors = COLOR_THEMES[colorTheme] || COLOR_THEMES[activeTemplate.defaultColor] || COLOR_THEMES.blue;

  const renderHeader = () => (
    <div className={`text-center pb-4 border-b ${activeThemeColors.border} mb-2`}>
      <h2 className={`text-2xl font-black ${activeThemeColors.primary}`}>{personalInfo.name}</h2>
      <p className="text-[10px] text-slate-500 font-semibold mt-1">
        {personalInfo.email} • {personalInfo.phone} • {personalInfo.address}
      </p>
      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
        LinkedIn: {personalInfo.linkedin || 'N/A'} | GitHub: {personalInfo.github || 'N/A'}
      </p>
    </div>
  );

  const renderSummary = () => personalInfo.summary && (
    <div className="flex flex-col gap-1 mb-2 text-left">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Professional Summary</h4>
      <p className="text-[10px] text-slate-600 leading-relaxed font-medium">{personalInfo.summary}</p>
    </div>
  );

  const renderEducation = () => educationList.length > 0 && (
    <div className="flex flex-col gap-1.5 mb-2 text-left">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Education Details</h4>
      <hr className="border-slate-100" />
      {educationList.map((edu, idx) => (
        <div key={idx} className="flex justify-between items-start text-[10px]">
          <div>
            <strong className="text-slate-800">{edu.institution}</strong> — <span>{edu.degree}</span>
            {edu.cgpa && <span className="text-slate-500 ml-1">({edu.cgpa} CGPA)</span>}
            {edu.achievements && <p className="text-[9px] text-slate-500 font-medium">{edu.achievements}</p>}
          </div>
          <span className="font-bold text-slate-455 shrink-0">{edu.passing_year}</span>
        </div>
      ))}
    </div>
  );

  const renderSkills = () => sectionVisibility.skills && skillList.length > 0 && (
    <div className="flex flex-col gap-1.5 mb-2 text-left">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Technical Skills</h4>
      <hr className="border-slate-100" />
      <div className="flex flex-wrap gap-1.5">
        {skillList.map((sk) => (
          <span key={sk.name} className="px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded text-[9px] font-bold text-slate-655">
            {sk.name} (Lvl {sk.level})
          </span>
        ))}
      </div>
    </div>
  );

  const renderProjects = () => sectionVisibility.projects && projectList.length > 0 && (
    <div className="flex flex-col gap-1.5 mb-2 text-left">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Academic Projects</h4>
      <hr className="border-slate-100" />
      {projectList.map((p, idx) => (
        <div key={idx} className="flex flex-col gap-0.5 text-[10px] leading-relaxed">
          <div className="flex justify-between items-center">
            <strong className="text-slate-850">{p.name}</strong>
            <span className="text-[9px] text-slate-400 font-semibold">{p.duration || '2 Months'}</span>
          </div>
          {p.tech_stack && <p className="text-[9px] text-slate-450 font-bold">Tech: {p.tech_stack}</p>}
          <p className="text-[9px] text-slate-650 font-medium">{p.description}</p>
        </div>
      ))}
    </div>
  );

  const renderExperience = () => sectionVisibility.experience && experienceList.length > 0 && (
    <div className="flex flex-col gap-1.5 mb-2 text-left">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Experience</h4>
      <hr className="border-slate-100" />
      {experienceList.map((e, idx) => (
        <div key={idx} className="flex flex-col gap-0.5 text-[10px] leading-relaxed">
          <div className="flex justify-between items-center">
            <strong className="text-slate-850">{e.position} @ {e.company}</strong>
            <span className="text-[9px] text-slate-400 font-semibold">{e.duration}</span>
          </div>
          <p className="text-[9px] text-slate-650 font-medium">{e.description}</p>
        </div>
      ))}
    </div>
  );

  const renderCertificates = () => sectionVisibility.certificates && certificateList.length > 0 && (
    <div className="flex flex-col gap-1.5 mb-2 text-left">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Certifications</h4>
      <hr className="border-slate-100" />
      {certificateList.map((c, idx) => (
        <div key={idx} className="flex justify-between items-start text-[10px]">
          <div>
            <strong className="text-slate-800">{c.name}</strong> — <span className="text-slate-500">{c.organization}</span>
          </div>
          {c.issue_date && <span className="font-bold text-slate-455 shrink-0">{c.issue_date}</span>}
        </div>
      ))}
    </div>
  );

  const renderAchievements = () => sectionVisibility.achievements && (achievements.hackathons || achievements.awards) && (
    <div className="flex flex-col gap-1.5 mb-2 text-left">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Achievements</h4>
      <hr className="border-slate-100" />
      <div className="text-[10px] text-slate-600 leading-relaxed font-medium">
        {achievements.hackathons && <p><strong>Hackathons:</strong> {achievements.hackathons}</p>}
        {achievements.awards && <p><strong>Awards:</strong> {achievements.awards}</p>}
        {achievements.soft_skills && <p><strong>Soft Skills:</strong> {achievements.soft_skills}</p>}
      </div>
    </div>
  );

  const renderLayout = (type: LayoutType) => {
    if (type === 'two-column') {
      return (
        <div className="grid grid-cols-3 gap-6 h-full text-left">
          {/* Left Column (Sidebar) */}
          <div className={`col-span-1 border-r ${activeThemeColors.border} pr-4 flex flex-col gap-4 text-left`}>
            <div>
              <h2 className={`text-sm font-black ${activeThemeColors.primary} leading-tight`}>{personalInfo.name}</h2>
              <p className="text-[8px] text-slate-500 font-semibold mt-2 leading-relaxed">
                {personalInfo.email} <br/> {personalInfo.phone} <br/> {personalInfo.address}
              </p>
              <div className="text-[7px] text-slate-400 font-bold uppercase mt-2 flex flex-col gap-0.5">
                <span>LI: {personalInfo.linkedin || 'N/A'}</span>
                <span>GH: {personalInfo.github || 'N/A'}</span>
              </div>
            </div>
            {renderSkills()}
            {renderCertificates()}
          </div>
          {/* Right Column (Main) */}
          <div className="col-span-2 flex flex-col gap-4 text-left">
            {renderSummary()}
            {renderExperience()}
            {renderProjects()}
            {renderEducation()}
            {renderAchievements()}
          </div>
        </div>
      );
    }

    if (type === 'projects-first') {
      return (
        <div className="flex flex-col gap-3 text-left">
          {renderHeader()}
          {renderSummary()}
          {renderProjects()}
          {renderExperience()}
          {renderEducation()}
          {renderSkills()}
          {renderCertificates()}
          {renderAchievements()}
        </div>
      );
    }

    if (type === 'minimal') {
      return (
        <div className="flex flex-col gap-3 text-left font-serif">
          <div className="text-center pb-2 border-b border-slate-900 mb-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase">{personalInfo.name}</h2>
            <p className="text-[8.5px] text-slate-705 font-medium mt-1 font-mono">
              {personalInfo.email} | {personalInfo.phone} | {personalInfo.address} | github.com/{personalInfo.github}
            </p>
          </div>
          {renderSummary()}
          {renderExperience()}
          {renderProjects()}
          {renderEducation()}
          {renderSkills()}
          {renderCertificates()}
          {renderAchievements()}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 text-left">
        {renderHeader()}
        {renderSummary()}
        {renderExperience()}
        {renderProjects()}
        {renderEducation()}
        {renderSkills()}
        {renderCertificates()}
        {renderAchievements()}
      </div>
    );
  };

  return (
    <div 
      className={`w-full max-w-[540px] bg-white rounded shadow-2xl p-8 aspect-[1/1.4] flex flex-col gap-4 transform origin-top transition-transform duration-250 select-text text-left ${activeFont} ${
        activeTemplate.hasBorder ? 'border-4 border-slate-900/10' : 'border border-slate-200/40'
      }`}
      style={{ transform: `scale(${zoomLevel})` }}
    >
      {renderLayout(activeTemplate.layoutType)}
    </div>
  );
};
