import React from 'react';
import { TemplateRegistry } from '../components/resume/templates';

interface ResumePreviewSheetProps {
  personalInfo: any;
  educationList: any[];
  experienceList: any[];
  projectList: any[];
  skillList: any[];
  certificateList?: any[];
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
  templateId = 'harvard'
}) => {
  // Normalize layout properties to fit TemplateRegistry formats
  const mappedTemplateId = ['harvard', 'jakes', 'stanford', 'microsoft', 'reactive', 'novoresume', 'flowcv', 'indeed'].includes(templateId) 
    ? templateId 
    : 'harvard';

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
  };

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
