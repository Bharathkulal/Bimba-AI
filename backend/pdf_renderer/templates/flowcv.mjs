import { htmlShell, esc, bulletList } from './shared.mjs';

export function renderFlowCV(data, fontFamily, fontSize) {
  const p = data.personal_info || {};
  const contactParts = [p.email, p.phone, p.location].filter(Boolean);

  const contact = contactParts.map((item, idx) =>
    idx > 0 ? `<span class="mr-3 text-slate-300">/</span>${esc(item)}` : esc(item)
  ).join('');

  const sectionH3 = 'text-xs font-extrabold uppercase tracking-widest text-[#4A5568] border-b border-slate-100 pb-1 mb-2';

  const summary = data.summary ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">About</h3>
      <p class="text-[11px] text-slate-600 leading-relaxed">${esc(data.summary)}</p>
    </div>` : '';

  const experience = data.experience?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="margin-bottom:0.625rem">Experience</h3>
      <div class="space-y-3">
        ${data.experience.map(exp => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
            <span>${esc(exp.position)}</span>
            <span class="font-semibold text-[9.5px] text-slate-400">${esc(exp.duration)}</span>
          </div>
          <div class="text-[10px] text-slate-500 font-bold">${esc(exp.company)}</div>
          ${bulletList(exp.description, 'text-[10px] text-slate-600')}
        </div>`).join('')}
      </div>
    </div>` : '';

  const projects = data.projects?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="margin-bottom:0.625rem">Projects</h3>
      <div class="space-y-2">
        ${data.projects.map(proj => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
            <span>${esc(proj.title)}</span>
            <span class="font-normal text-[9.5px] text-slate-500">(${esc(proj.technologies)})</span>
          </div>
          ${proj.description ? `<p class="text-[10px] text-slate-600 leading-normal">${esc(proj.description)}</p>` : ''}
        </div>`).join('')}
      </div>
    </div>` : '';

  const skills = data.skills?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Skills</h3>
      <p class="text-[10.5px] text-slate-600 leading-relaxed">${esc(Array.isArray(data.skills) ? data.skills.join(', ') : data.skills)}</p>
    </div>` : '';

  const education = data.education?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Education</h3>
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
    <div class="mb-5">
      <h3 class="${sectionH3}">Certifications</h3>
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
    <div class="mb-5">
      <h3 class="${sectionH3}">Portfolio</h3>
      <p class="text-[10.5px] text-slate-600 leading-relaxed">${data.portfolioLinks.map(l => esc(l)).join('  •  ')}</p>
    </div>` : '';

  const body = `
  <div class="p-8 bg-white text-[#2D3748] max-w-[800px] mx-auto text-left font-sans leading-normal">
    <div class="mb-6">
      <h1 class="text-3xl font-black text-[#1A202C] tracking-tight">${esc(p.name || '')}</h1>
      <div class="text-[10.5px] text-slate-500 font-semibold tracking-wide mt-1.5 flex flex-wrap gap-3">
        ${contact}
      </div>
    </div>
    ${summary}${experience}${projects}${skills}${education}${certifications}${portfolio}
  </div>`;

  return htmlShell(body, fontFamily, fontSize);
}
