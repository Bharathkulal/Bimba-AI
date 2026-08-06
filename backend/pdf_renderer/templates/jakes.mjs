import { htmlShell, esc, bulletList } from './shared.mjs';

export function renderJakes(data, fontFamily, fontSize) {
  const p = data.personal_info || {};
  const contactParts = [p.email, p.phone, p.location].filter(Boolean);
  const fontClass = fontFamily === 'Times New Roman' ? 'font-serif' : 'font-sans';

  const contact = contactParts.map((item, idx) =>
    idx > 0
      ? `<span class="mx-1 text-slate-350">|</span>${esc(item)}`
      : esc(item)
  ).join('');

  const summary = data.summary ? `
    <div class="mb-4">
      <h3 class="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">Summary</h3>
      <p class="text-[10.5px] text-slate-600 leading-relaxed">${esc(data.summary)}</p>
    </div>` : '';

  const experience = data.experience?.length ? `
    <div class="mb-4">
      <h3 class="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">Experience</h3>
      <div class="space-y-3">
        ${data.experience.map(exp => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[11px] font-black text-slate-800">
            <span>${esc(exp.position)}</span>
            <span class="font-medium text-[10px] text-slate-500">${esc(exp.duration)}</span>
          </div>
          <div class="flex justify-between items-baseline text-[10.5px] font-bold text-slate-600">
            <span>${esc(exp.company)}</span>
          </div>
          ${bulletList(exp.description, 'text-[10px] text-slate-600')}
        </div>`).join('')}
      </div>
    </div>` : '';

  const projects = data.projects?.length ? `
    <div class="mb-4">
      <h3 class="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">Projects</h3>
      <div class="space-y-2">
        ${data.projects.map(proj => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[11px] font-black text-slate-800">
            <span>${esc(proj.title)}</span>
            <span class="font-normal text-[9.5px] text-slate-500">(${esc(proj.technologies)})</span>
          </div>
          ${proj.description ? `<p class="text-[10px] text-slate-600 leading-normal">${esc(proj.description)}</p>` : ''}
        </div>`).join('')}
      </div>
    </div>` : '';

  const skills = data.skills?.length ? `
    <div class="mb-4">
      <h3 class="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">Skills</h3>
      <p class="text-[10.5px] text-slate-600 leading-relaxed">${esc(Array.isArray(data.skills) ? data.skills.join(', ') : data.skills)}</p>
    </div>` : '';

  const education = data.education?.length ? `
    <div class="mb-4">
      <h3 class="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">Education</h3>
      <div class="space-y-2">
        ${data.education.map(edu => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[11px] font-black text-slate-800">
            <span>${esc(edu.degree)} &mdash; ${esc(edu.institution)}</span>
            <span class="font-medium text-[10px] text-slate-500">${esc(edu.year)}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '';

  const certifications = data.certifications?.length ? `
    <div class="mb-4">
      <h3 class="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">Certifications</h3>
      <div class="space-y-2">
        ${data.certifications.map(cert => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[11px] font-black text-slate-800">
            <span>${esc(cert.name)}${cert.organization ? ` &mdash; ${esc(cert.organization)}` : ''}</span>
            <span class="font-medium text-[10px] text-slate-500">${esc(cert.issue_date)}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '';

  const portfolio = data.portfolioLinks?.length ? `
    <div class="mb-4">
      <h3 class="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">Portfolio</h3>
      <p class="text-[10.5px] text-slate-600 leading-relaxed">${data.portfolioLinks.map(l => esc(l)).join('  •  ')}</p>
    </div>` : '';

  const body = `
  <div class="p-8 bg-white text-[#111111] max-w-[800px] mx-auto text-left ${fontClass} leading-normal">
    <div class="text-center mb-5">
      <h1 class="text-2xl font-bold tracking-wide uppercase">${esc(p.name || '')}</h1>
      <div class="text-[10px] text-slate-500 font-medium tracking-wide mt-1.5 flex flex-wrap justify-center gap-1.5">
        ${contact}
      </div>
    </div>
    ${summary}${experience}${projects}${skills}${education}${certifications}${portfolio}
  </div>`;

  return htmlShell(body, fontFamily, fontSize);
}
