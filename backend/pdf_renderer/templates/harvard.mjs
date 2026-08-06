import { htmlShell, esc, bulletList } from './shared.mjs';

export function renderHarvard(data, fontFamily, fontSize) {
  const p = data.personal_info || {};
  const contactParts = [p.email, p.phone, p.location].filter(Boolean);
  const name = (p.name || '').toUpperCase();

  const contact = contactParts.map((item, idx) =>
    idx > 0
      ? `<span class="mx-2 text-slate-350">•</span>${esc(item)}`
      : esc(item)
  ).join('');

  const summary = data.summary ? `
    <div class="mb-5">
      <h3 class="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Professional Summary</h3>
      <p class="text-[11.5px] text-slate-700 leading-relaxed">${esc(data.summary)}</p>
    </div>` : '';

  const skills = data.skills?.length ? `
    <div class="mb-5">
      <h3 class="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Technical Skills</h3>
      <p class="text-[11.5px] text-slate-700 leading-relaxed">${esc(Array.isArray(data.skills) ? data.skills.join(', ') : data.skills)}</p>
    </div>` : '';

  const experience = data.experience?.length ? `
    <div class="mb-5">
      <h3 class="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Work Experience</h3>
      <div class="space-y-4">
        ${data.experience.map(exp => `
        <div class="space-y-1">
          <div class="flex justify-between items-baseline">
            <h4 class="text-[12px] font-black text-slate-800">${esc(exp.position)}</h4>
            <span class="text-[10.5px] font-semibold text-slate-500">${esc(exp.duration)}</span>
          </div>
          <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-600">
            <span>${esc(exp.company)}</span>
          </div>
          ${bulletList(exp.description, 'text-[11px] text-slate-650')}
        </div>`).join('')}
      </div>
    </div>` : '';

  const projects = data.projects?.length ? `
    <div class="mb-5">
      <h3 class="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Academic &amp; Personal Projects</h3>
      <div class="space-y-3">
        ${data.projects.map(proj => `
        <div class="space-y-1">
          <div class="flex justify-between items-baseline">
            <h4 class="text-[12px] font-black text-slate-800">${esc(proj.title)}</h4>
            <span class="text-[10px] text-slate-450">(${esc(proj.technologies)})</span>
          </div>
          ${proj.description ? `<p class="text-[11px] text-slate-650">${esc(proj.description)}</p>` : ''}
        </div>`).join('')}
      </div>
    </div>` : '';

  const education = data.education?.length ? `
    <div class="mb-5">
      <h3 class="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Education</h3>
      <div class="space-y-3">
        ${data.education.map(edu => `
        <div class="space-y-1">
          <div class="flex justify-between items-baseline">
            <h4 class="text-[11.5px] font-black text-slate-800">${esc(edu.degree)}</h4>
            <span class="text-[10.5px] font-semibold text-slate-500">${esc(edu.year)}</span>
          </div>
          <p class="text-[11px] text-slate-600 font-bold">${esc(edu.institution)}</p>
        </div>`).join('')}
      </div>
    </div>` : '';

  const certifications = data.certifications?.length ? `
    <div class="mb-5">
      <h3 class="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Certifications</h3>
      <div class="space-y-3">
        ${data.certifications.map(cert => `
        <div class="space-y-1">
          <div class="flex justify-between items-baseline">
            <h4 class="text-[11.5px] font-black text-slate-800">${esc(cert.name)}${cert.organization ? ` &mdash; ${esc(cert.organization)}` : ''}</h4>
            <span class="text-[10.5px] font-semibold text-slate-500">${esc(cert.issue_date)}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '';

  const portfolio = data.portfolioLinks?.length ? `
    <div class="mb-5">
      <h3 class="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Portfolio</h3>
      <p class="text-[11.5px] text-slate-700 leading-relaxed">${data.portfolioLinks.map(l => esc(l)).join('  •  ')}</p>
    </div>` : '';

  const body = `
  <div class="p-8 bg-white text-[#111111] max-w-[800px] mx-auto text-left leading-normal">
    <div class="text-center border-b-2 border-slate-900 pb-3 mb-6">
      <h1 class="text-3xl font-bold uppercase tracking-tight text-slate-900">${esc(name)}</h1>
      <div class="text-[11px] text-slate-600 font-semibold tracking-wide mt-1.5 flex flex-wrap justify-center gap-2">
        ${contact}
      </div>
    </div>
    ${summary}${skills}${experience}${projects}${education}${certifications}${portfolio}
  </div>`;

  return htmlShell(body, fontFamily, fontSize);
}
