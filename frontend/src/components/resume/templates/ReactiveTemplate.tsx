import React from 'react';
import type { ResumeBuilderData } from '../../../store/resumeBuilderStore';
import { normalizeSkillsList, normalizePersonalSkillsList, getPersonalDetailsEntries, getHobbies, parseBullets } from './shared';

interface TemplateProps {
  data: ResumeBuilderData;
  fontFamily?: string;
  fontSize?: string;
}

export const ReactiveTemplate: React.FC<TemplateProps> = ({ 
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

  const sectionH3 = 'text-xs font-black uppercase tracking-widest text-indigo-600 mb-1.5 mt-4';

  return (
    <div 
      className="p-8 bg-white text-[#1E293B] max-w-[800px] mx-auto text-left font-sans leading-normal shadow-sm min-h-[1050px]"
      style={{ fontFamily, fontSize }}
    >
      {/* Header */}
      <div className="mb-5 flex justify-between items-end border-b-2 border-indigo-600 pb-3">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">{pInfo.name || ''}</h1>
          {(pInfo.title || data.target_role) && (
            <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">
              {pInfo.title || data.target_role}
            </p>
          )}
        </div>
        <div className="text-[10px] text-slate-500 font-semibold tracking-wide text-right space-y-0.5">
          {contactParts.map((c, i) => <div key={i}>{c}</div>)}
        </div>
      </div>

      {/* Objective */}
      {data.objective && (
        <div className="mb-4">
          <h3 className={sectionH3}>Career Objective</h3>
          <p className="text-[11px] text-slate-600 leading-relaxed text-justify">{data.objective}</p>
        </div>
      )}

      {/* Summary */}
      {data.summary && (
        <div className="mb-4">
          <h3 className={sectionH3}>Summary</h3>
          <p className="text-[11px] text-slate-600 leading-relaxed text-justify">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Experience</h3>
          <div className="space-y-3">
            {data.experience.map((exp: any, idx: number) => {
              const bullets = parseBullets(exp.description || exp.responsibilities || exp.bullets);
              const dur = exp.duration || (exp.start_date ? (exp.is_current ? `${exp.start_date} – Present` : `${exp.start_date} – ${exp.end_date || ''}`) : '');
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                    <span>{exp.position || exp.title || exp.job_title} at {exp.company || exp.organization}</span>
                    <span className="font-semibold text-[9.5px] text-slate-500">{dur}</span>
                  </div>
                  {exp.location && <div className="text-[10px] text-slate-500 italic">{exp.location}</div>}
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-650">
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
          <div className="space-y-3">
            {data.internships.map((item: any, idx: number) => {
              const bullets = parseBullets(item.description || item.responsibilities);
              const dur = item.duration || (item.start_date ? (item.is_current ? `${item.start_date} – Present` : `${item.start_date} – ${item.end_date || ''}`) : '');
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                    <span>{item.role || item.position || item.title || 'Intern'} at {item.company || item.organization}</span>
                    <span className="font-semibold text-[9.5px] text-slate-500">{dur}</span>
                  </div>
                  {item.location && <div className="text-[10px] text-slate-500 italic">{item.location}</div>}
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-650">
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
          <div className="space-y-2">
            {data.projects.map((proj: any, idx: number) => {
              const tech = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || (Array.isArray(proj.tech_stack) ? proj.tech_stack.join(', ') : proj.tech_stack));
              const bullets = parseBullets(proj.description || proj.responsibilities || proj.bullets);
              const dur = proj.duration || (proj.start_date ? `${proj.start_date} – ${proj.end_date || ''}` : '');
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                    <span>{proj.title || proj.name} {tech ? <span className="font-normal text-[9.5px] text-slate-500">({tech})</span> : ''}</span>
                    <div className="flex items-center gap-2">
                      {(proj.url || proj.link || proj.github) && (
                        <a href={proj.url || proj.link || proj.github} target="_blank" rel="noreferrer" className="text-[9.5px] text-indigo-600 font-semibold hover:underline">Link</a>
                      )}
                      {dur && <span className="text-[9.5px] text-slate-500 font-normal">{dur}</span>}
                    </div>
                  </div>
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-650">
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
          <div className="space-y-1 text-[11px] text-slate-700 leading-relaxed">
            {skillCategories.map((cat, idx) => (
              <div key={idx}>
                <strong className="text-slate-900">{cat.category}:</strong> {cat.skills.join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Skills */}
      {personalSkills.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Personal Skills</h3>
          <p className="text-[11px] text-slate-700 leading-relaxed">{personalSkills.join(', ')}</p>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Education</h3>
          <div className="space-y-2">
            {data.education.map((edu: any, idx: number) => {
              const yr = edu.year || edu.passing_year || (edu.start_date ? `${edu.start_date} – ${edu.end_date || ''}` : '');
              const score = edu.cgpa_percentage || edu.score || edu.cgpa || edu.percentage || edu.gpa;
              const spec = edu.specialization || (edu.field_of_study && edu.degree && !edu.degree.includes(edu.field_of_study) ? edu.field_of_study : '');
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                    <span>{edu.degree || edu.field_of_study}{spec ? ` in ${spec}` : ''} &mdash; {edu.institution || edu.school || edu.university}{edu.location ? `, ${edu.location}` : ''}</span>
                    <span className="font-semibold text-[9.5px] text-slate-500">{yr}</span>
                  </div>
                  {score && <div className="text-[10px] font-semibold text-indigo-600">CGPA/Score: {score}</div>}
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
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                  <span>{cert.name || cert.title}{(cert.organization || cert.issuer) ? ` &mdash; ${cert.organization || cert.issuer}` : ''}</span>
                  <span className="font-semibold text-[9.5px] text-slate-500">{cert.issue_date || cert.year || cert.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publications */}
      {data.publications && data.publications.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Publications</h3>
          <div className="space-y-2 text-[11px] text-slate-700">
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
          <div className="space-y-1 text-[11px] text-slate-700">
            {data.achievements.map((ach: any, idx: number) => {
              if (typeof ach === 'string') return <p key={idx}>• {ach}</p>;
              return (
                <div key={idx} className="flex justify-between items-baseline">
                  <span>• <strong>{ach.title || ach.name}</strong>{ach.issuer ? ` &mdash; ${ach.issuer}` : ''}</span>
                  {(ach.year || ach.date) && <span className="text-[10px] text-slate-500 font-semibold">{ach.year || ach.date}</span>}
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
          <div className="space-y-1 text-[11px] text-slate-700">
            {data.leadership.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-baseline">
                <span><strong>{item.role || item.title || item.position}</strong>{(item.organization || item.club) ? ` &mdash; ${item.organization || item.club}` : ''}</span>
                <span className="text-[10px] text-slate-500">{item.duration || item.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hobbies */}
      {hobbies.length > 0 && (
        <div className="mb-4">
          <h3 className={sectionH3}>Hobbies &amp; Interests</h3>
          <p className="text-[11px] text-slate-700 leading-relaxed">{hobbies.join(', ')}</p>
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
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700">
                {bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReactiveTemplate;
