import { 
  htmlShell, 
  esc, 
  bulletList, 
  getExpTitle, 
  getExpCompany, 
  getExpDuration, 
  getExpLocation, 
  getExpBullets, 
  getProjTitle, 
  getProjTech, 
  getProjDuration, 
  getProjUrl, 
  getProjDesc, 
  getEduDegree, 
  getEduSchool, 
  getEduYear, 
  getEduScore, 
  getEduSpecialization, 
  getEduLocation, 
  normalizeSkills, 
  normalizePersonalSkills, 
  getPersonalDetailsList, 
  getInternshipsList, 
  getPublicationsList, 
  getAchievementsList, 
  getLeadershipList, 
  getHobbiesList, 
  getAdditionalInfoList 
} from './shared.mjs';

export const TemplatePresets = {};

export function renderAtsDynamic(data, presetName, customConfig = {}) {
  if (!data) return '';
  const p = data.personal_info || {};
  const name = esc((p.name || 'Your Full Name').toUpperCase());
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
    <link rel="preconnect" href="https://fonts.gstatic.com">
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
    <div class="text-center mb-6">
      <h1 class="font-extrabold uppercase tracking-wide leading-none" style="font-size: 26pt; color: #111111; margin-bottom: 6px;">${name}</h1>
      ${headline ? `<p class="text-[12pt] text-slate-600 font-semibold uppercase tracking-wider mb-2">${headline}</p>` : ''}
      <div class="text-[10.5pt] text-slate-500 font-medium flex flex-wrap justify-center gap-x-4 gap-y-1">
        ${contactParts.join(' <span class="text-slate-300">•</span> ')}
      </div>
    </div>
  `;

  // Render Section Header
  const renderSectionHeader = (title) => `
    <div class="section-header" style="break-after: avoid; page-break-after: avoid; margin-top: 14px; margin-bottom: 6px;">
      <h3 class="font-bold uppercase tracking-wider text-[12.5pt] text-slate-900 mb-1">${title}</h3>
      <div class="border-b" style="border-color: #cbd5e1;"></div>
    </div>
  `;

  // 1. Objective
  const objectiveHtml = data.objective ? `
    <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
      ${renderSectionHeader('Career Objective')}
      <p class="text-[10.5pt] text-slate-700 leading-relaxed font-normal text-justify mt-2">${esc(data.objective)}</p>
    </div>
  ` : '';

  // 2. Summary
  const summaryHtml = data.summary ? `
    <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
      ${renderSectionHeader('Professional Summary')}
      <p class="text-[10.5pt] text-slate-700 leading-relaxed font-normal text-justify mt-2">${esc(data.summary)}</p>
    </div>
  ` : '';

  // 3. Technical Skills
  let skillsHtml = '';
  const skillCategories = normalizeSkills(data);
  if (skillCategories.length > 0) {
    const skillGroupHtml = skillCategories.map(cat => `
      <div class="text-[10.5pt] text-slate-700 leading-relaxed">
        <strong class="text-slate-900 font-bold">${esc(cat.category)}:</strong> ${esc(cat.items.join(', '))}
      </div>
    `).join('');

    skillsHtml = `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Technical Skills')}
        <div class="mt-2 space-y-1">${skillGroupHtml}</div>
      </div>
    `;
  }

  // 4. Personal Skills
  let personalSkillsHtml = '';
  const personalSkillsList = normalizePersonalSkills(data);
  if (personalSkillsList.length > 0) {
    personalSkillsHtml = `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Personal / Soft Skills')}
        <p class="text-[10.5pt] text-slate-700 leading-relaxed mt-2">${esc(personalSkillsList.join(', '))}</p>
      </div>
    `;
  }

  // 5. Work Experience
  let experienceHtml = '';
  const expList = data.experience || [];
  if (expList.length > 0) {
    const listHtml = expList.map(exp => {
      const pos = getExpTitle(exp);
      const comp = getExpCompany(exp);
      const dur = getExpDuration(exp);
      const loc = getExpLocation(exp);
      const b = getExpBullets(exp);
      return `
        <div class="entry-block" style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 10px;">
          <div class="flex justify-between items-baseline font-bold text-[11.5pt] text-slate-900">
            <span>${esc(comp)}</span>
            <span class="font-medium text-[10pt] text-slate-500">${esc(dur)}</span>
          </div>
          <div class="flex justify-between items-baseline text-[10.5pt] text-slate-600 font-semibold mt-0.5 mb-1">
            <span>${esc(pos)}</span>
            ${loc ? `<span class="font-medium text-[10pt] text-slate-500 italic">${esc(loc)}</span>` : ''}
          </div>
          ${bulletList(b, 'text-[10.5pt] text-slate-700 leading-relaxed')}
        </div>
      `;
    }).join('');

    experienceHtml = `
      <div class="resume-section" style="break-inside: auto;">
        ${renderSectionHeader('Professional Experience')}
        <div class="mt-2 space-y-2">${listHtml}</div>
      </div>
    `;
  }

  // 6. Internships
  let internshipsHtml = '';
  const internshipList = getInternshipsList(data);
  if (internshipList.length > 0) {
    const listHtml = internshipList.map(item => {
      const role = item.role || item.position || item.title || 'Intern';
      const comp = item.company || item.organization || '';
      const dur = item.duration || (item.start_date ? (item.end_date ? `${item.start_date} – ${item.end_date}` : item.start_date) : '');
      const loc = item.location || '';
      const desc = item.description || item.responsibilities || '';
      return `
        <div class="entry-block" style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 10px;">
          <div class="flex justify-between items-baseline font-bold text-[11.5pt] text-slate-900">
            <span>${esc(comp)}</span>
            <span class="font-medium text-[10pt] text-slate-500">${esc(dur)}</span>
          </div>
          <div class="flex justify-between items-baseline text-[10.5pt] text-slate-600 font-semibold mt-0.5 mb-1">
            <span>${esc(role)}</span>
            ${loc ? `<span class="font-medium text-[10pt] text-slate-500 italic">${esc(loc)}</span>` : ''}
          </div>
          ${bulletList(desc, 'text-[10.5pt] text-slate-700 leading-relaxed')}
        </div>
      `;
    }).join('');

    internshipsHtml = `
      <div class="resume-section" style="break-inside: auto;">
        ${renderSectionHeader('Internships')}
        <div class="mt-2 space-y-2">${listHtml}</div>
      </div>
    `;
  }

  // 7. Projects
  let projectsHtml = '';
  const projList = data.projects || [];
  if (projList.length > 0) {
    const listHtml = projList.map(proj => {
      const title = getProjTitle(proj);
      const tech = getProjTech(proj);
      const dur = getProjDuration(proj);
      const url = getProjUrl(proj);
      const desc = getProjDesc(proj);
      return `
        <div class="entry-block" style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 8px;">
          <div class="flex justify-between items-baseline font-bold text-[11.5pt] text-slate-900 mb-0.5">
            <span>
              ${esc(title)}
              ${tech ? `<span class="text-[9.5pt] text-slate-500 font-medium ml-2">| ${esc(tech)}</span>` : ''}
            </span>
            <div class="flex items-center gap-2">
              ${url ? `<a href="${url.startsWith('http') ? url : 'https://' + url}" target="_blank" class="text-[9.5pt] text-blue-600 font-semibold hover:underline">Link</a>` : ''}
              ${dur ? `<span class="text-[9.5pt] text-slate-500 font-normal">${esc(dur)}</span>` : ''}
            </div>
          </div>
          ${bulletList(desc, 'text-[10.5pt] text-slate-700 leading-relaxed')}
        </div>
      `;
    }).join('');

    projectsHtml = `
      <div class="resume-section" style="break-inside: auto;">
        ${renderSectionHeader('Projects')}
        <div class="mt-2 space-y-2">${listHtml}</div>
      </div>
    `;
  }

  // 8. Education
  let educationHtml = '';
  const eduList = data.education || [];
  if (eduList.length > 0) {
    const listHtml = eduList.map(edu => {
      const deg = getEduDegree(edu);
      const school = getEduSchool(edu);
      const yr = getEduYear(edu);
      const score = getEduScore(edu);
      const spec = getEduSpecialization(edu);
      const loc = getEduLocation(edu);
      return `
        <div class="entry-block" style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 8px;">
          <div class="flex justify-between items-baseline font-bold text-[11.5pt] text-slate-900">
            <span>${esc(school)}${loc ? ` &mdash; ${esc(loc)}` : ''}</span>
            <span class="font-medium text-[10pt] text-slate-500">${esc(yr)}</span>
          </div>
          <div class="flex justify-between items-baseline text-[10.5pt] text-slate-650 font-semibold mt-0.5">
            <span>${esc(deg)}${spec ? ` in ${esc(spec)}` : ''}</span>
            ${score ? `<span class="font-semibold text-[10pt] text-slate-700">CGPA/Score: ${esc(score)}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    educationHtml = `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Education')}
        <div class="mt-2 space-y-2">${listHtml}</div>
      </div>
    `;
  }

  // 9. Certifications
  let certificationsHtml = '';
  const certList = data.certifications || data.certificates || [];
  if (certList.length > 0) {
    const listHtml = certList.map(cert => `
      <div class="entry-block flex justify-between items-baseline text-[10.5pt]" style="page-break-inside: avoid; break-inside: avoid;">
        <span class="font-bold text-slate-800">${esc(cert.name || cert.title)} ${cert.organization || cert.issuer ? `by ${esc(cert.organization || cert.issuer)}` : ''}</span>
        <span class="text-[9.5pt] font-semibold text-slate-500">${esc(cert.issue_date || cert.year || '')}</span>
      </div>
    `).join('');

    certificationsHtml = `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Certifications')}
        <div class="mt-2 space-y-1">${listHtml}</div>
      </div>
    `;
  }

  // 10. Publications
  let publicationsHtml = '';
  const pubList = getPublicationsList(data);
  if (pubList.length > 0) {
    const listHtml = pubList.map(pub => `
      <div class="entry-block text-[10.5pt] text-slate-700" style="page-break-inside: avoid; break-inside: avoid;">
        <div class="font-bold text-slate-900">${esc(pub.title)}</div>
        ${pub.authors ? `<div class="italic text-slate-600">${esc(pub.authors)}</div>` : ''}
        <div class="flex justify-between text-[9.5pt] text-slate-500 font-semibold">
          <span>${esc(pub.journal || pub.publisher || pub.conference || '')}</span>
          <span>${esc(pub.year || pub.date || '')}</span>
        </div>
        ${pub.description ? `<p class="text-[9.5pt] text-slate-600 mt-0.5">${esc(pub.description)}</p>` : ''}
      </div>
    `).join('');

    publicationsHtml = `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Publications')}
        <div class="mt-2 space-y-2">${listHtml}</div>
      </div>
    `;
  }

  // 11. Achievements
  let achievementsHtml = '';
  const achList = getAchievementsList(data);
  if (achList.length > 0) {
    const listHtml = achList.map(ach => {
      if (typeof ach === 'string') return `<li class="relative pl-4 leading-relaxed font-normal">${esc(ach)}</li>`;
      return `<li class="relative pl-4 leading-relaxed font-normal flex justify-between">
        <span><strong>${esc(ach.title || ach.name)}</strong>${ach.issuer ? ` &mdash; ${esc(ach.issuer)}` : ''}</span>
        ${ach.year || ach.date ? `<span class="text-[9.5pt] text-slate-500 font-semibold">${esc(ach.year || ach.date)}</span>` : ''}
      </li>`;
    }).join('');

    achievementsHtml = `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Awards & Achievements')}
        <ul class="mt-2 space-y-1 text-[10.5pt] list-disc pl-4 text-slate-700">${listHtml}</ul>
      </div>
    `;
  }

  // 12. Leadership
  let leadershipHtml = '';
  const leadList = getLeadershipList(data);
  if (leadList.length > 0) {
    const listHtml = leadList.map(item => `
      <div class="entry-block text-[10.5pt] text-slate-700" style="page-break-inside: avoid; break-inside: avoid;">
        <div class="flex justify-between items-baseline font-bold text-slate-850">
          <span>${esc(item.role || item.title)}${item.organization ? ` &mdash; ${esc(item.organization)}` : ''}</span>
          <span class="text-[9.5pt] font-semibold text-slate-500">${esc(item.duration || item.year || '')}</span>
        </div>
        ${bulletList(item.description, 'text-[10pt] text-slate-650')}
      </div>
    `).join('');

    leadershipHtml = `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Leadership & Activities')}
        <div class="mt-2 space-y-1.5">${listHtml}</div>
      </div>
    `;
  }

  // 13. Hobbies
  let hobbiesHtml = '';
  const hobbiesList = getHobbiesList(data);
  if (hobbiesList.length > 0) {
    hobbiesHtml = `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Hobbies & Interests')}
        <p class="mt-2 text-[10.5pt] text-slate-700 leading-relaxed">${esc(hobbiesList.join(', '))}</p>
      </div>
    `;
  }

  // 14. Personal Details
  let personalDetailsHtml = '';
  const personalDetailsList = getPersonalDetailsList(data);
  if (personalDetailsList.length > 0) {
    personalDetailsHtml = `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader('Personal Details')}
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[10.5pt] text-slate-700">
          ${personalDetailsList.map(item => `
            <div><strong class="text-slate-900">${esc(item.label)}:</strong> ${esc(item.value)}</div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 15. Custom Sections
  let customHtml = '';
  const customList = getAdditionalInfoList(data);
  if (customList.length > 0) {
    customHtml = customList.map(sec => `
      <div class="resume-section" style="page-break-inside: avoid; break-inside: avoid;">
        ${renderSectionHeader(esc(sec.section_name || sec.title || 'Additional Information'))}
        <div class="mt-2 text-[10.5pt] text-slate-700">${bulletList(sec.content || sec.description, 'text-[10.5pt] text-slate-700')}</div>
      </div>
    `).join('');
  }

  const contentHtml = `
    <div class="space-y-3">
      ${objectiveHtml}
      ${summaryHtml}
      ${skillsHtml}
      ${personalSkillsHtml}
      ${experienceHtml}
      ${internshipsHtml}
      ${projectsHtml}
      ${educationHtml}
      ${certificationsHtml}
      ${publicationsHtml}
      ${achievementsHtml}
      ${leadershipHtml}
      ${hobbiesHtml}
      ${personalDetailsHtml}
      ${customHtml}
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
      font-size: 10.5pt;
      line-height: 1.4;
    }
    @page {
      size: Letter;
      margin: 0;
    }
    .section-header {
      break-after: avoid;
      page-break-after: avoid;
    }
    .entry-block {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .resume-section {
      break-inside: avoid;
      page-break-inside: avoid;
    }
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
      padding: 16mm;
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
