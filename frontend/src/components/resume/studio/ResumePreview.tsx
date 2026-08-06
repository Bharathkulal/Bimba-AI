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
  return (
    <div className="flex-grow overflow-auto p-6 flex items-start justify-center bg-slate-50/50 rounded-2xl border border-slate-200/40 shadow-inner scrollbar-thin">
      <div 
        id="resume-studio-canvas"
        className="bg-white text-slate-900 shadow-xl rounded-xl transition-all duration-200 origin-top text-left select-none relative" 
        style={{ 
          width: '210mm',
          minHeight: '297mm',
          transform: `scale(${zoom / 100})`,
          marginBottom: `${(zoom / 100) * 100}px`,
          fontFamily: selectedFont.includes('Playfair') || selectedFont.includes('Georgia') ? '"Playfair Display", Georgia, serif' : '"Inter", sans-serif',
          fontSize: `${selectedFontSize}pt`,
          lineHeight: selectedSpacing,
          padding: `${selectedMargin}mm`,
          boxSizing: 'border-box'
        }}
      >
        {/* 1. Header Layout */}
        <div 
          className="mb-6"
          style={{
            textAlign: headerAlignment as any,
            borderBottom: sectionDividerStyle !== 'none' ? `2px ${sectionDividerStyle} ${selectedColor}22` : 'none',
            paddingBottom: '16px'
          }}
        >
          <h1 
            className="font-extrabold uppercase tracking-wide leading-none" 
            style={{ 
              color: selectedColor,
              fontSize: `${selectedHeadingSize * 1.5}pt`
            }}
          >
            {parsedData.personal_info?.name || 'Your Full Name'}
          </h1>
          
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9pt] text-slate-500 font-medium justify-center">
            {parsedData.personal_info?.email && <span>✉ {parsedData.personal_info.email}</span>}
            {parsedData.personal_info?.phone && <span>☎ {parsedData.personal_info.phone}</span>}
            {parsedData.personal_info?.address && <span>📍 {parsedData.personal_info.address}</span>}
          </div>
        </div>

        {/* 2. Content Sections Grid */}
        <div className={`grid gap-6 ${layoutColumns === 2 ? 'grid-cols-12' : 'grid-cols-1'}`}>
          <div className={layoutColumns === 2 ? 'col-span-8 space-y-6' : 'space-y-6'}>
            {enabledSections.summary !== false && parsedData.summary && (
              <div>
                <h3 
                  className="font-black uppercase tracking-wider mb-2 border-b-2" 
                  style={{ 
                    color: selectedColor,
                    fontSize: `${selectedHeadingSize}pt`,
                    borderBottomStyle: sectionDividerStyle as any,
                    borderBottomColor: selectedColor
                  }}
                >
                  Professional Summary
                </h3>
                <p className="leading-relaxed font-medium">{parsedData.summary}</p>
              </div>
            )}

            {enabledSections.experience !== false && parsedData.experience?.length > 0 && (
              <div>
                <h3 
                  className="font-black uppercase tracking-wider mb-3 border-b-2" 
                  style={{ 
                    color: selectedColor,
                    fontSize: `${selectedHeadingSize}pt`,
                    borderBottomStyle: sectionDividerStyle as any,
                    borderBottomColor: selectedColor
                  }}
                >
                  Work Experience
                </h3>
                <div className="space-y-3">
                  {parsedData.experience.map((exp: any, idx: number) => (
                    <div key={idx} className="leading-relaxed">
                      <div className="flex justify-between items-baseline font-bold text-[10pt]">
                        <span className="text-slate-800 font-extrabold">{exp.position} {exp.company ? `at ${exp.company}` : ''}</span>
                        <span className="text-[9pt] font-semibold text-slate-450">{exp.duration}</span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={layoutColumns === 2 ? 'col-span-4 space-y-6' : 'space-y-6'}>
            {enabledSections.skills !== false && (parsedData.technicalSkills || parsedData.skills)?.length > 0 && (
              <div>
                <h3 
                  className="font-black uppercase tracking-wider mb-2.5 border-b-2" 
                  style={{ 
                    color: selectedColor,
                    fontSize: `${selectedHeadingSize}pt`,
                    borderBottomStyle: sectionDividerStyle as any,
                    borderBottomColor: selectedColor
                  }}
                >
                  Skills Profile
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(parsedData.technicalSkills || parsedData.skills).map((skill: any, idx: number) => (
                    <span 
                      key={idx} 
                      className="text-[9pt] bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded font-semibold text-slate-700"
                    >
                      {typeof skill === 'object' ? skill.name : skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {enabledSections.education !== false && parsedData.education?.length > 0 && (
              <div>
                <h3 
                  className="font-black uppercase tracking-wider mb-2.5 border-b-2" 
                  style={{ 
                    color: selectedColor,
                    fontSize: `${selectedHeadingSize}pt`,
                    borderBottomStyle: sectionDividerStyle as any,
                    borderBottomColor: selectedColor
                  }}
                >
                  Education
                </h3>
                <div className="space-y-3">
                  {parsedData.education.map((edu: any, idx: number) => (
                    <div key={idx} className="leading-relaxed">
                      <div className="flex justify-between items-baseline font-bold text-[10pt]">
                        <span className="text-slate-800 font-extrabold">{edu.degree}</span>
                        <span className="text-[9pt] font-semibold text-slate-450">{edu.passing_year || edu.year}</span>
                      </div>
                      <p className="text-slate-500 font-semibold mt-0.5">{edu.institution}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
