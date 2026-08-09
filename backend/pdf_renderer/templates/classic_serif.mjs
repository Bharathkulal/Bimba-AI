import { htmlShell, esc } from './shared.mjs';

export function renderClassicSerif(data, fontFamily, fontSize) {
  const p = data.personal_info || {};
  const name = (p.name || 'Tina Miller').toUpperCase();

  // Address line
  const locationLine = p.location ? `<p class="text-[11px] text-slate-600 mt-2 font-medium tracking-wide">${esc(p.location)}</p>` : '';

  // Contact line with | separator
  const contactParts = [];
  if (p.phone) contactParts.push(p.phone);
  if (p.email) contactParts.push(p.email);
  if (p.linkedin) contactParts.push(p.linkedin);
  const contactLine = contactParts.length ? `
    <div class="text-[11px] text-slate-600 mt-1 font-medium tracking-wide flex justify-center items-center gap-2">
      ${contactParts.map((item, idx) => idx > 0 ? `<span class="text-slate-400">|</span><span>${esc(item)}</span>` : `<span>${esc(item)}</span>`).join('')}
    </div>` : '';

  // Profile bullet points
  const summaryBullets = data.summary
    ? data.summary
        .split(/[.\n•]/)
        .map(s => s.trim())
        .filter(s => s.length > 5)
    : [];

  const summary = summaryBullets.length ? `
    <div class="mb-6">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-2" style="font-family: Georgia, serif;">Profile</h3>
      <ul class="list-disc pl-5 space-y-1.5 text-[11px] text-[#333333]">
        ${summaryBullets.map(bullet => `<li class="leading-relaxed">${esc(bullet)}.</li>`).join('')}
      </ul>
    </div>` : '';

  // Experience
  const experience = data.experience?.length ? `
    <div class="mb-6">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-3" style="font-family: Georgia, serif;">Experience</h3>
      <div class="space-y-5">
        ${data.experience.map(exp => {
          const bullets = exp.description
            ? exp.description.split(/[•\n]/).map(b => b.trim()).filter(Boolean)
            : [];
          return `
          <div class="space-y-1.5">
            <div class="flex justify-between items-baseline text-[11px] font-bold text-black">
              <span class="font-extrabold">${esc(exp.company)}</span>
              <span class="font-semibold text-slate-600">${esc(exp.location || 'New York, NY')}</span>
            </div>
            <div class="flex justify-between items-baseline text-[11.5px] text-[#333333]">
              <span class="italic font-medium">${esc(exp.position)}</span>
              <span class="text-[10px] text-slate-500 font-semibold">${esc(exp.duration)}</span>
            </div>
            ${bullets.length ? `
            <ul class="list-disc pl-5 space-y-1 text-[11px] text-[#444444] mt-1">
              ${bullets.map(bullet => `<li class="leading-relaxed">${esc(bullet)}</li>`).join('')}
            </ul>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // Education
  const education = data.education?.length ? `
    <div class="mb-6">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-3" style="font-family: Georgia, serif;">Education</h3>
      <div class="space-y-4">
        ${data.education.map(edu => `
        <div class="space-y-1">
          <div class="flex justify-between items-baseline text-[11px] font-bold text-black">
            <span class="font-extrabold">${esc(edu.degree)}</span>
            <span class="font-semibold text-slate-600">${esc(edu.year)}</span>
          </div>
          <div class="flex justify-between items-baseline text-[10.5px] text-[#444444]">
            <span>${esc(edu.institution)}</span>
            <span class="text-slate-500 italic">${esc(edu.location || '')}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '';

  // Skills
  const skills = (data.technicalSkills || data.skills) ? `
    <div class="mb-6">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-2" style="font-family: Georgia, serif;">Skills</h3>
      <p class="text-[11px] text-[#333333] leading-relaxed">
        ${esc(Array.isArray(data.technicalSkills || data.skills)
          ? (data.technicalSkills || data.skills).join(', ')
          : (data.technicalSkills || data.skills))}
      </p>
    </div>` : '';

  const body = `
  <div class="p-12 bg-white text-[#111111] max-w-[800px] mx-auto text-left leading-relaxed">
    <div class="text-center pb-6">
      <h1 class="text-3xl font-bold text-black tracking-wide uppercase" style="font-family: Georgia, 'Times New Roman', serif;">${esc(name)}</h1>
      ${locationLine}
      ${contactLine}
    </div>
    ${summary}
    ${experience}
    ${education}
    ${skills}
  </div>`;

  return htmlShell(body, fontFamily || 'Georgia', fontSize);
}
