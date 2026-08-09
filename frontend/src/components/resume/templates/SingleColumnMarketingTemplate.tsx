import React from 'react';

interface TemplateProps {
  data: any;
  fontFamily: string;
  fontSize: string;
}

export const SingleColumnMarketingTemplate: React.FC<TemplateProps> = ({ data, fontFamily, fontSize }) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  const contactParts = [
    pInfo.location || 'Florida',
    pInfo.phone || '123-5456-7890',
    pInfo.email || 'tinamillernyc20@gmail.com',
    pInfo.linkedin || 'linkedin.com/in/tina-miller-nyc'
  ].filter(Boolean);

  const parsedFontFamily = fontFamily || 'Arial, sans-serif';
  const parsedFontSize = fontSize || '11pt';

  return (
    <div 
      className="p-8 bg-white text-[#222222] max-w-[800px] mx-auto text-left font-sans leading-relaxed"
      style={{ fontFamily: parsedFontFamily, fontSize: parsedFontSize }}
    >
      {/* Header - Centered Name & Contact details */}
      <div className="text-center pb-4 border-b border-slate-200 mb-5">
        <h1 className="text-3xl font-bold tracking-tight text-black">{pInfo.name || 'Tina Miller'}</h1>
        <div className="text-[10px] text-slate-500 font-medium tracking-wide mt-1.5 flex flex-wrap justify-center gap-1.5">
          {contactParts.map((item, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mx-1.5 text-slate-350">•</span>}
              {item}
            </span>
          ))}
        </div>
        {pInfo.title && (
          <h2 className="text-sm font-bold text-black uppercase tracking-wider mt-3">{pInfo.title}</h2>
        )}
      </div>

      {/* Profile / Summary */}
      {data.summary && (
        <div className="mb-5">
          <p className="text-[10.5px] text-[#333333] leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Work Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-black border-b border-slate-200 pb-0.5 mb-3">Work Experience</h3>
          <div className="space-y-4">
            {data.experience.map((exp: any, idx: number) => {
              const highlights = exp.description 
                ? exp.description.split('•').map((b: string) => b.trim()).filter(Boolean)
                : [];
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-[10.5px] font-bold text-black">
                    <span>{exp.company} • {exp.location || 'New York, United States'}</span>
                    <span className="font-semibold text-slate-500 text-[10px]">{exp.duration}</span>
                  </div>
                  <div className="text-[10px] font-bold text-[#333333] italic">{exp.position}</div>
                  {highlights.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-[#444444] mt-1.5">
                      {highlights.map((bullet: string, i: number) => (
                        <li key={i} className="leading-relaxed">{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-black border-b border-slate-200 pb-0.5 mb-3">Education</h3>
          <div className="space-y-3">
            {data.education.map((edu: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[10.5px] font-bold text-black">
                  <span>{edu.degree}</span>
                  <span className="font-semibold text-slate-500 text-[10px]">{edu.year}</span>
                </div>
                <p className="text-[10px] text-slate-500">{edu.institution} • {edu.location || 'Scheller College of Business'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Skills */}
      {(data.technicalSkills || data.skills) && (
        <div className="mb-4">
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-black border-b border-slate-200 pb-0.5 mb-3">Technical Skills</h3>
          <p className="text-[10px] text-[#444444] leading-relaxed">
            {Array.isArray(data.technicalSkills || data.skills) 
              ? (data.technicalSkills || data.skills).join(', ') 
              : (data.technicalSkills || data.skills)}
          </p>
        </div>
      )}
    </div>
  );
};
export default SingleColumnMarketingTemplate;
