import React from 'react';
import { ResumeHeader } from './ResumeHeader';
import { ResumeSection } from './ResumeSection';
import { ExperienceSection } from './ExperienceSection';
import { EducationSection } from './EducationSection';
import { SkillSection } from './SkillSection';
import { ProjectSection } from './ProjectSection';
import { CertificationSection } from './CertificationSection';

interface TemplateRendererProps {
  templateJson: any;
  resumeData: any;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({ templateJson, resumeData }) => {
  if (!templateJson || !resumeData) return null;

  const colors = templateJson.colors || {
    primary: '#111827',
    secondary: '#4B5563',
    background: '#FFFFFF',
    divider: '#E5E7EB'
  };

  const fonts = templateJson.fonts || {
    heading: 'Inter',
    body: 'Inter'
  };

  const page = templateJson.page || {
    size: 'A4',
    margin: '24px',
    background: 'white'
  };

  const layout = templateJson.layout || 'single-column';
  const sections = templateJson.sections || [];

  const getFontFamilyClass = (f: string) => {
    switch (f.toLowerCase()) {
      case 'calibri': return 'font-sans';
      case 'arial': return 'font-sans';
      case 'helvetica': return 'font-sans';
      case 'roboto': return 'font-sans';
      case 'times new roman': return 'font-serif';
      case 'georgia': return 'font-serif';
      default: return 'font-sans'; // Inter
    }
  };

  const fontClass = getFontFamilyClass(fonts.body);

  // Render a specific section by type
  const renderSectionContent = (sec: any) => {
    if (!sec.visible) return null;

    switch (sec.type) {
      case 'profile':
      case 'summary':
        return resumeData.summary || resumeData.careerObjective ? (
          <ResumeSection 
            title={sec.title || 'Profile'} 
            colors={colors} 
            fonts={fonts}
            fontSize={sec.fontSize}
            spacing={sec.spacing}
          >
            <p className="text-[11px] text-slate-650 leading-relaxed font-medium">
              {resumeData.summary || resumeData.careerObjective}
            </p>
          </ResumeSection>
        ) : null;

      case 'experience':
        return resumeData.experience?.length ? (
          <ResumeSection 
            title={sec.title || 'Work Experience'} 
            colors={colors} 
            fonts={fonts}
            fontSize={sec.fontSize}
            spacing={sec.spacing}
          >
            <ExperienceSection 
              items={resumeData.experience} 
              colors={colors} 
              fonts={fonts} 
            />
          </ResumeSection>
        ) : null;

      case 'education':
        return resumeData.education?.length ? (
          <ResumeSection 
            title={sec.title || 'Education'} 
            colors={colors} 
            fonts={fonts}
            fontSize={sec.fontSize}
            spacing={sec.spacing}
          >
            <EducationSection 
              items={resumeData.education} 
              colors={colors} 
              fonts={fonts} 
            />
          </ResumeSection>
        ) : null;

      case 'skills':
        return resumeData.skills?.length ? (
          <ResumeSection 
            title={sec.title || 'Technical Skills'} 
            colors={colors} 
            fonts={fonts}
            fontSize={sec.fontSize}
            spacing={sec.spacing}
          >
            <SkillSection 
              items={resumeData.skills} 
              columns={sec.columns || 1} 
              colors={colors} 
              fonts={fonts} 
            />
          </ResumeSection>
        ) : null;

      case 'projects':
        return resumeData.projects?.length ? (
          <ResumeSection 
            title={sec.title || 'Projects'} 
            colors={colors} 
            fonts={fonts}
            fontSize={sec.fontSize}
            spacing={sec.spacing}
          >
            <ProjectSection 
              items={resumeData.projects} 
              colors={colors} 
              fonts={fonts} 
            />
          </ResumeSection>
        ) : null;

      case 'certifications':
        return resumeData.certifications?.length ? (
          <ResumeSection 
            title={sec.title || 'Certifications'} 
            colors={colors} 
            fonts={fonts}
            fontSize={sec.fontSize}
            spacing={sec.spacing}
          >
            <CertificationSection 
              items={resumeData.certifications} 
              colors={colors} 
              fonts={fonts} 
            />
          </ResumeSection>
        ) : null;

      default:
        return null;
    }
  };

  // Layout selection
  if (layout === 'two-column' || layout === 'sidebar') {
    // Determine which sections belong to left/right columns
    // Default left column gets experience, education, projects
    // Default right column gets profile, skills, certifications
    const leftTypes = ['experience', 'education', 'projects'];
    const rightTypes = ['profile', 'summary', 'skills', 'certifications'];

    const leftSections = sections.filter((s: any) => leftTypes.includes(s.type));
    const rightSections = sections.filter((s: any) => rightTypes.includes(s.type));

    const isLeftSidebar = layout === 'sidebar';

    return (
      <div 
        className={`w-full max-w-[800px] mx-auto text-left leading-normal p-8 ${fontClass}`}
        style={{ 
          background: page.background || '#FFFFFF',
          padding: page.margin || '32px'
        }}
      >
        <ResumeHeader 
          personalInfo={resumeData.personal_info || resumeData} 
          colors={colors} 
          fonts={fonts} 
          layout={layout} 
        />

        <div className={`grid gap-6 ${isLeftSidebar ? 'grid-cols-3' : 'grid-cols-3'}`}>
          {/* Main Left Side */}
          <div className={isLeftSidebar ? 'col-span-1 border-r pr-4' : 'col-span-2'}>
            {(isLeftSidebar ? rightSections : leftSections).map((sec: any, idx: number) => (
              <React.Fragment key={idx}>
                {renderSectionContent(sec)}
              </React.Fragment>
            ))}
          </div>

          {/* Right Side Column */}
          <div className={isLeftSidebar ? 'col-span-2' : 'col-span-1 pl-2'}>
            {(isLeftSidebar ? leftSections : rightSections).map((sec: any, idx: number) => (
              <React.Fragment key={idx}>
                {renderSectionContent(sec)}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback: Single Column
  return (
    <div 
      className={`w-full max-w-[800px] mx-auto text-left leading-normal p-8 ${fontClass}`}
      style={{ 
        background: page.background || '#FFFFFF',
        padding: page.margin || '32px'
      }}
    >
      <ResumeHeader 
        personalInfo={resumeData.personal_info || resumeData} 
        colors={colors} 
        fonts={fonts} 
        layout={layout} 
      />

      <div className="flex flex-col gap-1">
        {sections.map((sec: any, idx: number) => (
          <React.Fragment key={idx}>
            {renderSectionContent(sec)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default TemplateRenderer;
