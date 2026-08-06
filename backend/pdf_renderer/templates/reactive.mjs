import { htmlShell, esc, bulletList } from './shared.mjs';

export function renderReactive(data, fontFamily, fontSize) {
  const p = data.personal_info || {};
  const contactParts = [p.email, p.phone, p.location].filter(Boolean);

  const sectionH3 = 'text-xs font-black uppercase tracking-widest text-indigo-600 mb-1.5';

  const summary = data.summary ? `
    <div class="mb-4">
      <h3 class="${sectionH3}">Summary</h3>
      <p class="text-[11px] text-slate-600 leading-relaxed">${esc(data.summary)}</p>
    </div>` : '';

  const experience = data.experience?.length ? `
    <div class="mb-4">
      <h3 class="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Experience</h3>
      <div class="space-y-3">
        ${data.experience.map(exp => `
        <div class="space-y-1">
          <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
            <span>${esc(exp.position)} at ${esc(exp.company)}</span>
            <span class="font-semibold text-[9.5px] text-slate-500">${esc(exp.duration)}</span>
          </div>
          ${bulletList(exp.description, 'text-[10px] text-slate-600')}
        </div>`).join('')}
      </div>
    </div>` : '';

  const projects = data.projects?.length ? `
    <div class="mb-4">
      <h3 class="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Projects</h3>
      <div class="space-y-2">
        ${data.projects.map(proj => `
        <div class="space-y-1">
          <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
            <span>${esc(proj.title)}</span>
            <span class="font-normal text-[9.5px] text-slate-500">(${esc(proj.technologies)})</span>
          </div>
          ${proj.description ? `<p class="text-[10px] text-slate-600">${esc(proj.description)}</p>` : ''}
        </div>`).join('')}
      </div>
    </div>` : '';

  const skills = data.skills?.length ? `
    <div class="mb-4">
      <h3 class="${sectionH3}">Skills</h3>
      <p class="text-[11px] text-slate-600 leading-relaxed">${esc(Array.isArray(data.skills) ? data.skills.join(', ') : data.skills)}</p>
    </div>` : '';

  const education = data.education?.length ? `
    <div class="mb-4">
      <h3 class="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Education</h3>
      <div class="space-y-2">
        ${data.education.map(edu => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
            <span>${esc(edu.degree)} &mdash; ${esc(edu.institution)}</span>
            <span class="font-semibold text-[9.5px] text-slate-500">${esc(edu.year)}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '';

  const certifications = data.certifications?.length ? `
    <div class="mb-4">
      <h3 class="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Certifications</h3>
      <div class="space-y-2">
        ${data.certifications.map(cert => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
            <span>${esc(cert.name)}${cert.organization ? ` &mdash; ${esc(cert.organization)}` : ''}</span>
            <span class="font-semibold text-[9.5px] text-slate-500">${esc(cert.issue_date)}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '';

  const portfolio = data.portfolioLinks?.length ? `
    <div class="mb-4">
      <h3 class="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Portfolio</h3>
      <p class="text-[11px] text-slate-600 leading-relaxed">${data.portfolioLinks.map(l => esc(l)).join('  •  ')}</p>
    </div>` : '';

  const body = `
  <div class="p-8 bg-white text-[#1E293B] max-w-[800px] mx-auto text-left font-sans leading-normal">
    <div class="mb-6 flex justify-between items-end border-b-2 border-indigo-600 pb-3">
      <div>
        <h1 class="text-3xl font-black text-slate-800 tracking-tight">${esc(p.name || '')}</h1>
        <p class="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-1">Professional Resume</p>
      </div>
      <div class="text-[10px] text-slate-500 font-semibold tracking-wide text-right space-y-0.5">
        ${contactParts.map(c => `<div>${esc(c)}</div>`).join('')}
      </div>
    </div>
    ${summary}${experience}${projects}${skills}${education}${certifications}${portfolio}
  </div>`;

  return htmlShell(body, fontFamily, fontSize);
}
