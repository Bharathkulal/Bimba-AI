import React from 'react';
import { TemplateRegistry } from '../components/resume/templates';
import { useResumeBuilderStore } from '../store/resumeBuilderStore';
import { TemplateRenderer } from '../components/ResumeRenderer/TemplateRenderer';

interface ResumePreviewSheetProps {
  personalInfo: any;
  educationList: any[];
  experienceList: any[];
  projectList: any[];
  skillList: any[];
  certifications?: any[];
  achievements?: any;
  sectionVisibility?: any;
  templateId: string;
  colorTheme: string;
  zoomLevel: number;
}

export const ResumePreviewSheet: React.FC<ResumePreviewSheetProps> = ({
  personalInfo = {},
  educationList = [],
  experienceList = [],
  projectList = [],
  skillList = [],
  certifications = [],
  templateId = 'harvard'
}) => {
  const { templatesList } = useResumeBuilderStore();

  const normalizedData = {
    personal_info: {
      name: personalInfo.name || personalInfo.candidateName,
      email: personalInfo.email,
      phone: personalInfo.phone,
      location: personalInfo.address || personalInfo.location
    },
    summary: personalInfo.summary || personalInfo.careerObjective,
    skills: skillList.map(s => typeof s === 'string' ? s : s.name),
    experience: experienceList.map(exp => ({
      position: exp.position || exp.jobTitle,
      company: exp.company,
      duration: exp.duration,
      description: exp.description
    })),
    projects: projectList.map(proj => ({
      title: proj.title || proj.projectName,
      technologies: proj.technologies,
      description: proj.description
    })),
    education: educationList.map(edu => ({
      degree: edu.degree,
      institution: edu.institution || edu.school,
      year: edu.passing_year || edu.year
    }))
    ,
    certifications: certifications.map((c: any) => ({
      name: c.name || c.title || '',
      organization: c.organization || c.issuer || c.issuer_name || '',
      issue_date: c.issue_date || c.year || c.date || ''
    }))
  };

  // Check if this is a custom dynamic JSON-based template from MongoDB
  const customTemplate = templatesList.find(t => t.slug === templateId);

  if (customTemplate && (customTemplate.sections || customTemplate.layout)) {
    return (
      <div className="w-full bg-white text-slate-800">
        <TemplateRenderer 
          templateJson={customTemplate} 
          resumeData={normalizedData} 
        />
      </div>
    );
  }

  // Fallback to standard registry templates
  let mappedTemplateId = templateId;
  if (templateId === 'minimal-ats') {
    mappedTemplateId = 'jakes';
  } else if (templateId === 'rachelle-beaudry') {
    mappedTemplateId = 'flowcv';
  } else if (templateId === 'morgan-maxwell') {
    mappedTemplateId = 'stanford';
  } else if (templateId === 'olivia-sanchez') {
    mappedTemplateId = 'reactive';
  }

  if (!['harvard', 'jakes', 'stanford', 'microsoft', 'reactive', 'novoresume', 'flowcv', 'indeed'].includes(mappedTemplateId)) {
    mappedTemplateId = 'harvard';
  }

  const TemplateComponent = TemplateRegistry[mappedTemplateId] || TemplateRegistry.harvard;

  return (
    <div className="w-full bg-white text-slate-800">
      <TemplateComponent 
        data={normalizedData} 
        fontFamily="Inter" 
        fontSize="11pt" 
      />
    </div>
  );
};


export default ResumePreviewSheet;
