import React from 'react';

interface ResumePreviewProps {
  parsedData: any;
  selectedColor: string;
  selectedFont: string;
  selectedFontSize: number;
  selectedHeadingSize: number;
  selectedSpacing: number;
  selectedMargin: number;
  layoutColumns: number;
  sectionDividerStyle: string;
  enabledSections: Record<string, boolean>;
  headerAlignment: string;
  zoom: number;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  parsedData,
  selectedColor,
  selectedFont,
  selectedFontSize,
  selectedHeadingSize,
  selectedSpacing,
  selectedMargin,
  layoutColumns,
  sectionDividerStyle,
  enabledSections,
  headerAlignment,
  zoom
}) => {
  const p = parsedData.personal_info || {};
  const name = p.name || 'Your Full Name';
  const email = p.email || '';
  const phone = p.phone || '';
  const location = p.location || p.address || '';
  
  const fontCssName = {
    'Inter': "'Inter', sans-serif",
    'Roboto': "'Roboto', sans-serif",
    'Poppins': "'Poppins', sans-serif",
    'Lato': "'Lato', sans-serif",
    'Open Sans': "'Open Sans', sans-serif",
    'Merriweather': "'Merriweather', serif",
    'Georgia': "'Georgia', serif",
  }[selectedFont] || "'Inter', sans-serif";

  const contactParts = [email, phone, location].filter(Boolean);

  // Dynamic Header Styles
  const renderHeader = () => {
    if (headerAlignment === 'center') {
      return (
        <div className="text-center mb-6">
          <h1 className="font-extrabold uppercase tracking-wide leading-none" style={{ fontSize: '28px', color: selectedColor }}>{name}</h1>
          <div className="text-[10px] text-slate-500 font-bold mt-2 flex flex-wrap justify-center gap-4">
            {contactParts.map((c, i) => <span key={i}>{c}</span>)}
          </div>
        </div>
      );
    } else if (headerAlignment === 'right') { // Modern
      return (
        <div className="flex justify-between items-end border-b-2 pb-4 mb-6" style={{ borderColor: `${selectedColor}22` }}>
          <div className="text-left">
            <h1 className="font-black uppercase tracking-tight leading-none" style={{ fontSize: '32px', color: selectedColor }}>{name}</h1>
            <p className="text-[11px] text-slate-450 font-black tracking-wider uppercase mt-1">Candidate Profile</p>
          </div>
          <div className="text-right text-[10px] text-slate-500 font-bold space-y-0.5">
            {contactParts.map((c, i) => <div key={i}>{c}</div>)}
          </div>
        </div>
      );
    } else { // Classic Left
      return (
        <div className="text-left mb-6">
          <h1 className="font-extrabold uppercase tracking-wide leading-none" style={{ fontSize: '30px', color: selectedColor }}>{name}</h1>
          <div className="text-[10px] text-slate-550 font-bold mt-2 flex flex-wrap gap-4">
            {contactParts.map((c, i) => <span key={i}>{c}</span>)}
          </div>
        </div>
      );
    }
  };

  const renderSectionHeader = (title: string) => {
    if (sectionDividerStyle === 'none') {
      return <h3 className="font-black uppercase tracking-wider text-[13px] mb-2" style={{ color: selectedColor }}>{title}</h3>;
    }
    const borderStyleClass = sectionDividerStyle === 'dashed' ? 'border-dashed' : 'border-solid';
    return (
      <div className="mb-3 mt-4">
        <h3 className="font-black uppercase tracking-wider text-[13px] mb-1" style={{ color: selectedColor }}>{title}</h3>
        <div className={`border-b-2 ${borderStyleClass}`} style={{ borderColor: selectedColor, opacity: 0.85 }}></div>
      </div>
    );
  };

  // Sections
  const summarySection = enabledSections.summary !== false && parsedData.summary && (
    <div className="mb-[18px]">
      {renderSectionHeader('Professional Summary')}
      <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{parsedData.summary}</p>
    </div>
  );

  const experienceSection = enabledSections.experience !== false && parsedData.experience?.length > 0 && (
    <div className="mb-[18px]">
      {renderSectionHeader('Work Experience')}
      <div className="space-y-4">
        {parsedData.experience.map((exp: any, idx: number) => {
          const bullets = exp.description ? exp.description.split('•').map((b: string) => b.trim()).filter(Boolean) : [];
          return (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-baseline">
                <span className="font-extrabold text-[12px] text-slate-900">{exp.company}</span>
                <span className="text-[10px] font-bold text-slate-450">{exp.duration}</span>
              </div>
              <div className="text-[11px] font-bold text-slate-600 mt-0.5">{exp.position}</div>
              {bullets.length > 0 ? (
                <ul className="mt-1.5 space-y-1 text-[11px] list-disc pl-4">
                  {bullets.map((bullet: string, bIdx: number) => (
                    <li key={bIdx} className="text-slate-650 leading-relaxed font-medium">{bullet}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-650 mt-1">{exp.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const projectsSection = enabledSections.projects !== false && parsedData.projects?.length > 0 && (
    <div className="mb-[18px]">
      {renderSectionHeader('Academic & Personal Projects')}
      <div className="space-y-3">
        {parsedData.projects.map((proj: any, idx: number) => (
          <div key={idx} className="mb-3">
            <div className="flex justify-between items-baseline">
              <span className="font-extrabold text-[12px] text-slate-900">{proj.title || proj.name}</span>
              {proj.technologies && <span className="text-[10px] text-emerald-600 font-bold">({proj.technologies})</span>}
            </div>
            {proj.description && <p className="text-[11px] text-slate-655 mt-1 leading-relaxed">{proj.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );

  const skillsSection = enabledSections.skills !== false && (parsedData.technicalSkills || parsedData.skills)?.length > 0 && (
    <div className="mb-[18px]">
      {renderSectionHeader('Skills Profile')}
      <div className="flex flex-wrap items-center mt-1 text-[11px] font-bold text-slate-700">
        {(parsedData.technicalSkills || parsedData.skills).map((skill: any, idx: number, arr: any[]) => (
          <React.Fragment key={idx}>
            <span>{typeof skill === 'object' ? skill.name : skill}</span>
            {idx < arr.length - 1 && <span className="text-slate-300 mx-1.5">•</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const educationSection = enabledSections.education !== false && parsedData.education?.length > 0 && (
    <div className="mb-[18px]">
      {renderSectionHeader('Education')}
      <div className="space-y-3">
        {parsedData.education.map((edu: any, idx: number) => (
          <div key={idx} className="mb-3 flex justify-between items-start">
            <div>
              <span className="font-extrabold text-[12px] text-slate-900">{edu.institution}</span>
              <div className="text-[11px] font-bold text-slate-600 mt-0.5">{edu.degree}</div>
            </div>
            <div className="text-right">
              <span className="text-[10.5px] font-bold text-slate-500">{edu.passing_year || edu.year}</span>
              {edu.cgpa_percentage && <div className="text-[10px] text-slate-400 font-semibold mt-0.5">CGPA: {edu.cgpa_percentage}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const certificationsSection = enabledSections.certifications !== false && parsedData.certifications?.length > 0 && (
    <div className="mb-[18px]">
      {renderSectionHeader('Certifications')}
      <div className="space-y-2">
        {parsedData.certifications.map((cert: any, idx: number) => (
          <div key={idx} className="mb-2 flex justify-between items-baseline">
            <span className="font-extrabold text-[11.5px] text-slate-800">{cert.name} {cert.organization ? `by ${cert.organization}` : ''}</span>
            <span className="text-[10px] font-bold text-slate-500">{cert.issue_date || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Two-column or Single column assembly
  const renderLayout = () => {
    if (layoutColumns === 2) {
      return (
        <div className="grid grid-cols-12 gap-6 mt-4">
          <div className="col-span-8 space-y-4">
            {summarySection}
            {experienceSection}
            {projectsSection}
          </div>
          <div className="col-span-4 space-y-4">
            {skillsSection}
            {educationSection}
            {certificationsSection}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {summarySection}
        {skillsSection}
        {experienceSection}
        {projectsSection}
        {educationSection}
        {certificationsSection}
      </div>
    );
  };

  return (
    <div className="flex-grow overflow-auto p-4 flex items-start justify-center bg-slate-50/50 rounded-2xl border border-slate-200/40 shadow-inner scrollbar-thin max-h-[85vh]">
      <div className="relative" style={{ width: '210mm', height: `${297 * (zoom / 100)}mm`, overflow: 'hidden' }}>
        <div 
          id="resume-studio-canvas"
          className="bg-white text-slate-900 shadow-xl rounded-sm transition-all duration-200 origin-top-left absolute left-0 top-0" 
          style={{ 
            width: '210mm',
            minHeight: '297mm',
            transform: `scale(${zoom / 100})`,
            fontFamily: fontCssName,
            fontSize: `${selectedFontSize}pt`,
            lineHeight: selectedSpacing,
            padding: `${selectedMargin}mm`,
            boxSizing: 'border-box'
          }}
        >
          {renderHeader()}
          {renderLayout()}
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
