import React from 'react';
import type { ResumeBuilderData } from '../../../store/resumeBuilderStore';
import { normalizeSkillsList, normalizePersonalSkillsList, getPersonalDetailsEntries, getHobbies, parseBullets } from './shared';

interface TemplateProps {
  data: ResumeBuilderData;
  fontFamily?: string;
  fontSize?: string;
}

export const MinimalistModernTemplate: React.FC<TemplateProps> = ({ 
  data, 
  fontFamily = 'Inter, sans-serif', 
  fontSize = '11pt' 
}) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  const contactParts = [
    pInfo.email,
    pInfo.phone,
    pInfo.location || pInfo.address,
    pInfo.linkedin,
    pInfo.github,
    pInfo.portfolio || pInfo.website
  ].filter(Boolean) as string[];

  const skillCategories = normalizeSkillsList(data);
  const personalSkills = normalizePersonalSkillsList(data);
  const personalDetails = getPersonalDetailsEntries(data);
  const hobbies = getHobbies(data);
  const customSections = data.additional_information || data.custom_sections || data.customSections || [];

  const sectionH3 = 'text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2 mt-4';

  return (
    <div 
      className="p-8 bg-white text-[#111111] max-w-[800px] mx-auto text-left font-sans leading-normal shadow-sm min-h-[1050px]"
      style={{ fontFamily, fontSize }}
    >
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-3 mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">{pInfo.name || ''}</h1>
        {(pInfo.title || data.target_role) && (
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            {pInfo.title || data.target_role}
          </div>
        )}
        <div className="text-[11px] text-slate-600 font-semibold tracking-wide mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {contactParts.map((item, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="text-slate-350 mr-2">•</span>}
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Objective */}
      {data.objective && (
        <div className="mb-4">
          <h3 className={sectionH3}>Career Objective</h3>
          <p className="text-[11px] text-slate-700 leading-relaxed font-medium text-justify">{data.objective}</p>
        </div>
      )}

      {/* Summary */}
      {data.summary && (
        <div className="mb-4">
          <h3 className={sectionH3}>Profile</h3>
          <p className="text-[11px] text-slate-700 leading-relaxed font-medium text-justify">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Work Experience</h3>
          <div className="space-y-4">
            {data.experience.map((exp: any, idx: number) => {
              const bullets = parseBullets(exp.description || exp.responsibilities || exp.bullets);
              const dur = exp.duration || (exp.start_date ? (exp.is_current ? `${exp.start_date} – Present` : `${exp.start_date} – ${exp.end_date || ''}`) : '');
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-[11.5px] font-extrabold text-slate-900">{exp.position || exp.title || exp.job_title}</h4>
                    <span className="text-[10px] font-bold text-slate-500">{dur}</span>
                  </div>
                  <div className="text-[10.5px] font-semibold text-slate-600">
                    {exp.company || exp.organization}
                    {exp.location && <span className="text-slate-400 ml-1">({exp.location})</span>}
                  </div>
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-650 font-medium">
                      {bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Internships */}
      {data.internships && data.internships.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Internships</h3>
          <div className="space-y-4">
            {data.internships.map((item: any, idx: number) => {
              const bullets = parseBullets(item.description || item.responsibilities);
              const dur = item.duration || (item.start_date ? (item.is_current ? `${item.start_date} – Present` : `${item.start_date} – ${item.end_date || ''}`) : '');
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-[11.5px] font-extrabold text-slate-900">{item.role || item.position || item.title || 'Intern'}</h4>
                    <span className="text-[10px] font-bold text-slate-500">{dur}</span>
                  </div>
                  <div className="text-[10.5px] font-semibold text-slate-600">
                    {item.company || item.organization}
                    {item.location && <span className="text-slate-400 ml-1">({item.location})</span>}
                  </div>
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-650 font-medium">
                      {bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Projects</h3>
          <div className="space-y-3">
            {data.projects.map((proj: any, idx: number) => {
              const tech = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || (Array.isArray(proj.tech_stack) ? proj.tech_stack.join(', ') : proj.tech_stack));
              const bullets = parseBullets(proj.description || proj.responsibilities || proj.bullets);
              const dur = proj.duration || (proj.start_date ? `${proj.start_date} – ${proj.end_date || ''}` : '');
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-[11.5px] font-extrabold text-slate-900">{proj.title || proj.name}</h4>
                    <div className="flex items-center gap-2">
                      {(proj.url || proj.link || proj.github) && (
                        <a href={proj.url || proj.link || proj.github} target="_blank" rel="noreferrer" className="text-[9.5px] text-emerald-600 font-bold hover:underline">Link</a>
                      )}
                      {dur && <span className="text-[10px] font-bold text-slate-500">{dur}</span>}
                    </div>
                  </div>
                  {tech && <div className="text-[10px] font-bold text-emerald-600">({tech})</div>}
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-650 leading-relaxed font-medium mt-0.5">
                      {bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills */}
      {skillCategories.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Skills</h3>
          <div className="space-y-1 text-[10.5px] text-slate-700 leading-relaxed font-medium">
            {skillCategories.map((cat, idx) => (
              <div key={idx}>
                <strong className="text-slate-900 font-extrabold">{cat.category}:</strong> {cat.skills.join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Skills */}
      {personalSkills.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Personal Skills</h3>
          <p className="text-[10.5px] text-slate-700 leading-relaxed font-medium">{personalSkills.join(', ')}</p>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Education</h3>
          <div className="space-y-3">
            {data.education.map((edu: any, idx: number) => {
              const yr = edu.year || edu.passing_year || (edu.start_date ? `${edu.start_date} – ${edu.end_date || ''}` : '');
              const score = edu.cgpa_percentage || edu.score || edu.cgpa || edu.percentage || edu.gpa;
              const spec = edu.specialization || (edu.field_of_study && edu.degree && !edu.degree.includes(edu.field_of_study) ? edu.field_of_study : '');
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-[11.5px] font-extrabold text-slate-900">{edu.institution || edu.school || edu.university}{edu.location ? ` — ${edu.location}` : ''}</h4>
                    <span className="text-[10px] font-bold text-slate-500">{yr}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[10.5px] font-semibold text-slate-600">
                    <span>{edu.degree || edu.field_of_study}{spec ? ` in ${spec}` : ''}</span>
                    {score && <span className="text-[10px] font-bold text-emerald-700">CGPA/Score: {score}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Certifications</h3>
          <div className="space-y-2">
            {data.certifications.map((cert: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-[11px] font-extrabold text-slate-900">{cert.name || cert.title}</h4>
                  <span className="text-[10px] font-bold text-slate-500">{cert.issue_date || cert.year || cert.date}</span>
                </div>
                {(cert.organization || cert.issuer) && (
                  <div className="text-[10px] font-semibold text-slate-500">{cert.organization || cert.issuer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publications */}
      {data.publications && data.publications.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Publications</h3>
          <div className="space-y-2 text-[10.5px] text-slate-700">
            {data.publications.map((pub: any, idx: number) => (
              <div key={idx}>
                <div className="font-bold text-slate-900">{pub.title}</div>
                {pub.authors && <div className="italic text-slate-600">{pub.authors}</div>}
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{pub.journal || pub.publisher || pub.conference}</span>
                  <span>{pub.year || pub.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {data.achievements && data.achievements.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Awards &amp; Achievements</h3>
          <div className="space-y-1 text-[10.5px] text-slate-700">
            {data.achievements.map((ach: any, idx: number) => {
              if (typeof ach === 'string') return <p key={idx}>• {ach}</p>;
              return (
                <div key={idx} className="flex justify-between items-baseline">
                  <span>• <strong>{ach.title || ach.name}</strong>{ach.issuer ? ` — ${ach.issuer}` : ''}</span>
                  {(ach.year || ach.date) && <span className="text-[10px] font-bold text-slate-500">{ach.year || ach.date}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leadership */}
      {data.leadership && data.leadership.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Leadership &amp; Activities</h3>
          <div className="space-y-1 text-[10.5px] text-slate-700">
            {data.leadership.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-baseline">
                <span><strong>{item.role || item.title || item.position}</strong>{(item.organization || item.club) ? ` — ${item.organization || item.club}` : ''}</span>
                <span className="text-[10px] font-bold text-slate-500">{item.duration || item.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hobbies */}
      {hobbies.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Hobbies &amp; Interests</h3>
          <div className="flex flex-wrap gap-2 text-[10.5px] font-semibold text-slate-600">
            {hobbies.map((h, idx) => (
              <span key={idx} className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">{h}</span>
            ))}
          </div>
        </div>
      )}

      {/* Personal Details */}
      {personalDetails.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Personal Details</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px] text-slate-700">
            {personalDetails.map((item, idx) => (
              <div key={idx}><strong className="text-slate-900">{item.label}:</strong> {item.value}</div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Sections */}
      {customSections.length > 0 && customSections.map((sec: any, idx: number) => {
        const bullets = parseBullets(sec.content || sec.description);
        return (
          <div key={idx} className="mb-4">
            <h3 className={sectionH3}>{sec.section_name || sec.title || 'Additional Information'}</h3>
            {bullets.length > 0 && (
              <ul className="list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-700">
                {bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MinimalistModernTemplate;
