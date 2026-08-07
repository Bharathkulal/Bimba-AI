import { esc } from './shared.mjs';

export const TemplatePresets = {};

export function renderAtsDynamic(data, presetName, customConfig = {}) {
  const p = data.personal_info || {};
  const name = esc(p.name || 'Your Full Name');
  const headline = esc(data.target_role || p.title || '');
  const email = esc(p.email || '');
  const phone = esc(p.phone || '');
  const location = esc(p.location || p.address || '');
  const linkedin = esc(p.linkedin || '');
  const github = esc(p.github || '');
  const portfolio = esc(p.portfolio || p.website || '');

  // Typography selection (Inter default)
  const fontCssName = "'Inter', sans-serif";
  const fontImport = `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">`;

  // Centered Header
  const contactParts = [
    phone ? `<span>${phone}</span>` : '',
    email ? `<a href="mailto:${email}" class="hover:underline">${email}</a>` : '',
    location ? `<span>${location}</span>` : '',
    linkedin ? `<a href="${linkedin.startsWith('http') ? linkedin : 'https://' + linkedin}" target="_blank" class="hover:underline">LinkedIn</a>` : '',
    github ? `<a href="${github.startsWith('http') ? github : 'https://' + github}" target="_blank" class="hover:underline">GitHub</a>` : '',
    portfolio ? `<a href="${portfolio.startsWith('http') ? portfolio : 'https://' + portfolio}" target="_blank" class="hover:underline">Portfolio</a>` : ''
  ].filter(Boolean);

  const headerHtml = `
    <div class="text-center mb-8">
      <h1 class="font-extrabold uppercase tracking-wide leading-none" style="font-size: 32pt; color: #111111; margin-bottom: 6px;">${name}</h1>
      ${headline ? `<p class="text-[13pt] text-slate-600 font-semibold uppercase tracking-wider mb-3">${headline}</p>` : ''}
      <div class="text-[11pt] text-slate-500 font-medium flex flex-wrap justify-center gap-x-4 gap-y-1">
        ${contactParts.join(' <span class="text-slate-300">•</span> ')}
      </div>
    </div>
  `;

  // Render Section Header
  const renderSectionHeader = (title) => {
    return `
      <div class="section-header" style="break-after: avoid; page-break-after: avoid;">
        <h3 class="font-bold uppercase tracking-wider text-[14pt] text-slate-900 mb-1.5">${title}</h3>
        <div class="border-b" style="border-color: #cbd5e1;"></div>
      </div>
    `;
  };

  // 1. Summary (4-6 lines)
  const summaryText = data.summary || data.objective || '';
  const summaryHtml = summaryText ? `
    <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
      ${renderSectionHeader('Professional Summary')}
      <p class="text-[11pt] text-slate-700 leading-relaxed font-normal text-justify mt-3">${esc(summaryText)}</p>
    </div>
  ` : '';

  // 2. Experience
  let experienceHtml = '';
  const expList = data.experience || [];
  if (expList.length > 0) {
    const listHtml = expList.map(exp => {
      const desc = exp.description || '';
      let bulletsList = '';
      if (desc) {
        const bullets = desc.includes('•') 
          ? desc.split('•').map(b => b.trim()).filter(Boolean)
          : desc.split('\n').map(b => b.trim()).filter(Boolean);
        bulletsList = bullets.map(b => `
          <li class="relative pl-4 text-slate-700 leading-relaxed font-normal before:content-['•'] before:absolute before:left-0 before:text-slate-400">
            ${esc(b)}
          </li>
        `).join('');
      }
      return `
        <div class="entry-block" style="page-break-inside: avoid; break-inside: avoid;">
          <div class="flex justify-between items-baseline font-bold text-[12pt] text-slate-900">
            <span>${esc(exp.company)}</span>
            <span class="font-medium text-[10.5pt] text-slate-550">${esc(exp.duration || '')}</span>
          </div>
          <div class="flex justify-between items-baseline text-[11pt] text-slate-600 font-semibold mt-0.5 mb-1.5">
            <span>${esc(exp.position)}</span>
            ${exp.location ? `<span class="font-medium text-[10.5pt] text-slate-500">${esc(exp.location)}</span>` : ''}
          </div>
          ${bulletsList ? `<ul class="space-y-1.5 text-[11pt]">${bulletsList}</ul>` : `<p class="text-[11pt] text-slate-700 leading-relaxed">${esc(desc)}</p>`}
        </div>
      `;
    }).join('');

    experienceHtml = `
      <div class="resume-section" style="break-inside: auto;">
        ${renderSectionHeader('Professional Experience')}
        <div class="mt-3 space-y-4">${listHtml}</div>
      </div>
    `;
  }

  // 3. Projects
  let projectsHtml = '';
  const projList = data.projects || [];
  if (projList.length > 0) {
    const listHtml = projList.map(proj => {
      const tech = proj.technologies || proj.tech || '';
      const url = proj.url || proj.github || proj.link || '';
      return `
        <div class="entry-block" style="page-break-inside: avoid; break-inside: avoid;">
          <div class="flex justify-between items-baseline font-bold text-[12pt] text-slate-900 mb-1">
            <span>
              ${esc(proj.title || proj.name)}
              ${tech ? `<span class="text-[10pt] text-slate-500 font-medium ml-2">| ${esc(tech)}</span>` : ''}
            </span>
            ${url ? `<a href="${url.startsWith('http') ? url : 'https://' + url}" target="_blank" class="text-[10pt] text-blue-600 font-semibold hover:underline">Link</a>` : ''}
          </div>
          ${proj.description ? `<p class="text-[11pt] text-slate-700 leading-relaxed text-justify">${esc(proj.description)}</p>` : ''}
        </div>
      `;
    }).join('');

    projectsHtml = `
      <div class="resume-section" style="break-inside: auto;">
        ${renderSectionHeader('Projects')}
        <div class="mt-3 space-y-3">${listHtml}</div>
      </div>
    `;
  }

  // 4. Skills (Dynamic AI grouping)
  let skillsHtml = '';
  const rawSkills = data.skills || data.technicalSkills || [];
  if (rawSkills.length > 0) {
    const skillsList = Array.isArray(rawSkills) ? rawSkills : [rawSkills];
    
    // Group skills helper
    const skillsMap = {};
    skillsList.forEach(s => {
      if (typeof s === 'object' && s.category) {
        const cat = s.category;
        const name = s.name || s.value || '';
        if (!skillsMap[cat]) skillsMap[cat] = [];
        skillsMap[cat].push(name);
      } else if (typeof s === 'string') {
        const val = s.trim();
        if (val.includes(':')) {
          const parts = val.split(':');
          const cat = parts[0].trim();
          const items = parts[1].split(',').map(x => x.trim());
          if (!skillsMap[cat]) skillsMap[cat] = [];
          skillsMap[cat].push(...items);
        } else {
          if (!skillsMap['Skills']) skillsMap['Skills'] = [];
          skillsMap['Skills'].push(val);
        }
      }
    });

    const skillGroupHtml = Object.entries(skillsMap).map(([category, items]) => {
      const listStr = items.filter(Boolean).join(', ');
      if (!listStr) return '';
      return `
        <div class="mb-2 text-[11pt] text-slate-700">
          <strong class="text-slate-900">${esc(category)}:</strong> ${esc(listStr)}
        </div>
      `;
    }).join('');

    skillsHtml = `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Skills Profile')}
        <div class="mt-3 space-y-1">${skillGroupHtml}</div>
      </div>
    `;
  }

  // 5. Education
  let educationHtml = '';
  const eduList = data.education || [];
  if (eduList.length > 0) {
    const listHtml = eduList.map(edu => `
      <div class="entry-block" style="page-break-inside: avoid; break-inside: avoid;">
        <div class="flex justify-between items-baseline font-bold text-[12pt] text-slate-900">
          <span>${esc(edu.institution)}</span>
          <span class="font-medium text-[10.5pt] text-slate-550">${esc(edu.year)}</span>
        </div>
        <div class="flex justify-between items-baseline text-[11pt] text-slate-650 font-semibold mt-0.5">
          <span>${esc(edu.degree)}</span>
          ${edu.cgpa_percentage || edu.cgpa ? `<span class="font-medium text-[10.5pt] text-slate-500">GPA: ${esc(edu.cgpa_percentage || edu.cgpa)}</span>` : ''}
        </div>
      </div>
    `).join('');

    educationHtml = `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Education')}
        <div class="mt-3 space-y-3">${listHtml}</div>
      </div>
    `;
  }

  // 6. Certifications
  let certificationsHtml = '';
  const certList = data.certifications || data.certificates || [];
  if (certList.length > 0) {
    const listHtml = certList.map(cert => `
      <div class="entry-block" style="page-break-inside: avoid; break-inside: avoid;">
        <span class="font-bold text-[11.5pt] text-slate-800">${esc(cert.name || cert.title)} ${cert.organization || cert.issuer ? `by ${esc(cert.organization || cert.issuer)}` : ''}</span>
        <span class="text-[10pt] font-semibold text-slate-500 ml-2">${esc(cert.issue_date || cert.year || '')}</span>
      </div>
    `).join('');

    certificationsHtml = `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Certifications')}
        <div class="mt-3 space-y-1.5">${listHtml}</div>
      </div>
    `;
  }

  // 7. Optional AI Sections (Languages, Custom Sections, Achievements)
  let optionalHtml = '';
  const achievements = data.achievements || [];
  if (achievements.length > 0) {
    const achList = achievements.map(ach => `
      <li class="relative pl-4 text-slate-700 leading-relaxed font-normal before:content-['•'] before:absolute before:left-0 before:text-slate-400">
        ${esc(typeof ach === 'string' ? ach : (ach.title || ach.name || ''))}
      </li>
    `).join('');
    optionalHtml += `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Awards & Achievements')}
        <ul class="mt-3 space-y-1.5 text-[11pt]">${achList}</ul>
      </div>
    `;
  }

  const languages = data.languages || [];
  if (languages.length > 0) {
    const langStr = languages.join(', ');
    optionalHtml += `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Languages')}
        <p class="mt-3 text-[11pt] text-slate-700 leading-relaxed">${esc(langStr)}</p>
      </div>
    `;
  }

  const customSecs = data.custom_sections || data.customSections || [];
  if (customSecs.length > 0) {
    customSecs.forEach(sec => {
      const title = esc(sec.section_name || sec.title || 'Additional Section');
      const content = sec.content || sec.description || '';
      let contentHtml = '';
      if (Array.isArray(content)) {
        contentHtml = `<ul class="mt-3 space-y-1.5 text-[11pt]">` + content.map(c => `
          <li class="relative pl-4 text-slate-700 leading-relaxed font-normal before:content-['•'] before:absolute before:left-0 before:text-slate-400">
            ${esc(c)}
          </li>
        `).join('') + `</ul>`;
      } else {
        contentHtml = `<p class="mt-3 text-[11pt] text-slate-700 leading-relaxed">${esc(content)}</p>`;
      }
      optionalHtml += `
        <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
          ${renderSectionHeader(title)}
          ${contentHtml}
        </div>
      `;
    });
  }

  const contentHtml = `
    <div class="space-y-4">
      ${summaryHtml}
      ${skillsHtml}
      ${experienceHtml}
      ${projectsHtml}
      ${educationHtml}
      ${certificationsHtml}
      ${optionalHtml}
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${fontImport}
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: white; }
    body {
      font-family: ${fontCssName};
      font-size: 11pt;
      line-height: 1.4;
    }

    /* ── Page break / pagination rules ── */
    @page {
      size: Letter;
      margin: 0;
    }

    /* Keep section headers glued to their content */
    .section-header {
      break-after: avoid;
      page-break-after: avoid;
      margin-bottom: 0;
      margin-top: 16px;
    }

    /* Keep individual entries (education, experience, etc.) together */
    .entry-block {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* Keep small sections (skills, summary, short education) fully together */
    .resume-section {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* For large sections (experience, projects) that might legitimately span pages,
       allow the section to break but keep individual entries together */
    .resume-section[style*="break-inside: auto"] {
      break-inside: auto;
      page-break-inside: auto;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section-header { break-after: avoid; page-break-after: avoid; }
      .entry-block { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body class="bg-white">
  <div 
    style="
      width: 100%;
      padding: 18mm;
      box-sizing: border-box;
      margin: 0 auto;
    "
  >
    ${headerHtml}
    ${contentHtml}
  </div>
</body>
</html>`;
}
