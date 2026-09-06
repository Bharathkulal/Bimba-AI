/**
 * Shared utilities for all PDF template renderers.
 * Provides the HTML shell (with Tailwind Play CDN + Google Fonts) and
 * helper functions for extracting and rendering all 16 major resume sections.
 */

export function htmlShell(bodyContent, fontFamily = 'Inter', fontSize = '11pt') {
  const googleFontMap = {
    'Inter': 'Inter:wght@400;500;600;700;800;900',
    'Roboto': 'Roboto:wght@400;500;700;900',
    'Calibri': 'Carlito:wght@400;700',       // Calibri-equivalent on web
    'Arial': 'Arial',                         // System font
    'Times New Roman': 'Source+Serif+4:wght@400;600;700',
    'Helvetica': 'Helvetica',                 // System font
    'Georgia': 'Lora:wght@400;600;700',       // Georgia-equivalent
  };

  const googleFontWeight = googleFontMap[fontFamily] || 'Inter:wght@400;500;600;700;800;900';
  const isSystemFont = ['Arial', 'Helvetica'].includes(fontFamily);
  const fontImport = isSystemFont ? '' : `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${googleFontWeight}&display=swap" rel="stylesheet">`;

  const fontCssName = {
    'Calibri': "'Carlito', 'Calibri', sans-serif",
    'Times New Roman': "'Source Serif 4', 'Times New Roman', serif",
    'Georgia': "'Lora', 'Georgia', serif",
    'Roboto': "'Roboto', sans-serif",
    'Inter': "'Inter', sans-serif",
    'Arial': "Arial, sans-serif",
    'Helvetica': "Helvetica, Arial, sans-serif",
  }[fontFamily] || "'Inter', sans-serif";

  const fontSizePx = {
    '9pt': '12px', '10pt': '13.3px', '11pt': '14.7px',
    '12pt': '16px', '13pt': '17.3px', '14pt': '18.7px'
  }[fontSize] || '14.7px';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${fontImport}
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            slate: {
              350: '#94a3b8', 450: '#6b7280', 650: '#475569', 850: '#1e293b'
            }
          }
        }
      }
    }
  </script>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: white; }
    body { font-family: ${fontCssName}; font-size: ${fontSizePx}; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .entry-block { break-inside: avoid; page-break-inside: avoid; }
      .section-header { break-after: avoid; page-break-after: avoid; }
    }
  </style>
</head>
<body class="bg-white">
${bodyContent}
</body>
</html>`;
}

export function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function bulletList(description, itemClass = 'text-[10px] text-slate-600') {
  if (!description) return '';
  let bullets = [];
  if (Array.isArray(description)) {
    bullets = description.map(b => String(b).trim()).filter(Boolean);
  } else if (typeof description === 'string') {
    bullets = description.split(/[•\n]/).map(b => b.trim()).filter(Boolean);
  } else {
    bullets = [String(description).trim()].filter(Boolean);
  }
  if (bullets.length === 0) return '';
  if (bullets.length === 1) return `<p class="${itemClass}">${esc(bullets[0])}</p>`;
  return `<ul class="list-disc pl-4 space-y-0.5 mt-1 ${itemClass}">
    ${bullets.map(b => `<li>${esc(b)}</li>`).join('\n    ')}
  </ul>`;
}

export function getExpTitle(exp) {
  if (!exp) return '';
  return exp.position || exp.job_title || exp.title || exp.role || '';
}

export function getExpCompany(exp) {
  if (!exp) return '';
  return exp.company || exp.organization || exp.employer || '';
}

export function getExpDuration(exp) {
  if (!exp) return '';
  if (exp.duration) return exp.duration;
  if (exp.dates) return exp.dates;
  if (exp.start_date) {
    const endStr = exp.is_current ? 'Present' : (exp.end_date || 'Present');
    return `${exp.start_date} – ${endStr}`;
  }
  return '';
}

export function getExpLocation(exp) {
  if (!exp) return '';
  return exp.location || '';
}

export function getExpBullets(exp) {
  if (!exp) return '';
  return exp.description || exp.responsibilities || exp.bullets || exp.summary || '';
}

export function getProjTitle(proj) {
  if (!proj) return '';
  return proj.title || proj.name || 'Project';
}

export function getProjTech(proj) {
  if (!proj) return '';
  if (Array.isArray(proj.technologies)) return proj.technologies.join(', ');
  if (Array.isArray(proj.tech_stack)) return proj.tech_stack.join(', ');
  return proj.technologies || proj.tech_stack || proj.tech || '';
}

export function getProjDuration(proj) {
  if (!proj) return '';
  if (proj.duration) return proj.duration;
  if (proj.start_date) {
    const endStr = proj.is_current ? 'Present' : (proj.end_date || '');
    return endStr ? `${proj.start_date} – ${endStr}` : proj.start_date;
  }
  return proj.year || '';
}

export function getProjUrl(proj) {
  if (!proj) return '';
  return proj.url || proj.link || proj.github || '';
}

export function getProjDesc(proj) {
  if (!proj) return '';
  return proj.description || proj.responsibilities || proj.bullets || '';
}

export function getEduDegree(edu) {
  if (!edu) return '';
  return edu.degree || edu.field_of_study || 'Degree';
}

export function getEduSchool(edu) {
  if (!edu) return '';
  return edu.institution || edu.school || edu.university || edu.name || 'University';
}

export function getEduYear(edu) {
  if (!edu) return '';
  if (edu.year) return edu.year;
  if (edu.passing_year) return edu.passing_year;
  if (edu.start_date) {
    return edu.end_date ? `${edu.start_date} – ${edu.end_date}` : edu.start_date;
  }
  return '';
}

export function getEduScore(edu) {
  if (!edu) return '';
  return edu.cgpa_percentage || edu.score || edu.cgpa || edu.percentage || edu.gpa || '';
}

export function getEduSpecialization(edu) {
  if (!edu) return '';
  const spec = edu.specialization || (edu.field_of_study && edu.degree && !edu.degree.includes(edu.field_of_study) ? edu.field_of_study : '');
  return spec;
}

export function getEduLocation(edu) {
  if (!edu) return '';
  return edu.location || '';
}

/**
 * Normalizes all technical skills and skill categories into a structured list
 * of { category: string, items: string[] }.
 */
export function normalizeSkills(data) {
  if (!data) return [];
  const result = [];
  const rawCategories = data.skill_categories || [];
  const rawSkills = data.technicalSkills || data.skills || [];

  // 1. Process structured skill_categories first
  if (Array.isArray(rawCategories) && rawCategories.length > 0) {
    for (const cat of rawCategories) {
      if (!cat) continue;
      const categoryName = cat.category || cat.name || 'Technical Skills';
      let items = [];
      if (Array.isArray(cat.skills)) items = cat.skills;
      else if (Array.isArray(cat.items)) items = cat.items;
      else if (typeof cat.skills === 'string') items = cat.skills.split(',').map(s => s.trim());
      else if (typeof cat.items === 'string') items = cat.items.split(',').map(s => s.trim());
      
      const filtered = items.map(s => typeof s === 'string' ? s.trim() : (s?.name || String(s))).filter(Boolean);
      if (filtered.length > 0) {
        result.push({ category: categoryName, items: filtered });
      }
    }
  }

  // 2. If no categories or additional skills exist in rawSkills
  if (result.length === 0 && Array.isArray(rawSkills) && rawSkills.length > 0) {
    const uncatMap = {};
    for (const item of rawSkills) {
      if (!item) continue;
      if (typeof item === 'object') {
        const cat = item.category || 'Technical Skills';
        const name = item.name || item.skill || item.value || '';
        const items = Array.isArray(item.skills) ? item.skills : (Array.isArray(item.items) ? item.items : [name]);
        if (!uncatMap[cat]) uncatMap[cat] = [];
        uncatMap[cat].push(...items.filter(Boolean));
      } else if (typeof item === 'string') {
        const val = item.trim();
        if (val.includes(':')) {
          const parts = val.split(':');
          const cat = parts[0].trim();
          const items = parts.slice(1).join(':').split(',').map(x => x.trim()).filter(Boolean);
          if (!uncatMap[cat]) uncatMap[cat] = [];
          uncatMap[cat].push(...items);
        } else {
          if (!uncatMap['Technical Skills']) uncatMap['Technical Skills'] = [];
          uncatMap['Technical Skills'].push(val);
        }
      }
    }
    for (const [cat, items] of Object.entries(uncatMap)) {
      if (items.length > 0) {
        result.push({ category: cat, items: Array.from(new Set(items)) });
      }
    }
  } else if (result.length === 0 && typeof rawSkills === 'string' && rawSkills.trim()) {
    result.push({ category: 'Technical Skills', items: rawSkills.split(',').map(s => s.trim()).filter(Boolean) });
  }

  return result;
}

/**
 * Returns personal / soft skills as string array.
 */
export function normalizePersonalSkills(data) {
  if (!data) return [];
  const raw = data.personalSkills || data.personal_skills || data.soft_skills || data.softSkills || [];
  if (Array.isArray(raw)) {
    return raw.map(s => typeof s === 'string' ? s.trim() : (s?.name || String(s))).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Normalizes personal details (DOB, gender, marital status, nationality, languages, etc.).
 */
export function getPersonalDetailsList(data) {
  if (!data) return [];
  const pd = data.personal_details || {};
  const entries = [];
  if (pd.date_of_birth) entries.push({ label: 'Date of Birth', value: pd.date_of_birth });
  if (pd.gender) entries.push({ label: 'Gender', value: pd.gender });
  if (pd.marital_status) entries.push({ label: 'Marital Status', value: pd.marital_status });
  if (pd.nationality) entries.push({ label: 'Nationality', value: pd.nationality });
  if (pd.languages_known && (Array.isArray(pd.languages_known) ? pd.languages_known.length : pd.languages_known)) {
    entries.push({ label: 'Languages Known', value: Array.isArray(pd.languages_known) ? pd.languages_known.join(', ') : String(pd.languages_known) });
  }
  if (pd.passport_number) entries.push({ label: 'Passport No.', value: pd.passport_number });
  if (pd.permanent_address) entries.push({ label: 'Permanent Address', value: pd.permanent_address });
  return entries;
}

export function getInternshipsList(data) {
  if (!data || !data.internships) return [];
  return Array.isArray(data.internships) ? data.internships : [data.internships];
}

export function getPublicationsList(data) {
  if (!data || !data.publications) return [];
  return Array.isArray(data.publications) ? data.publications : [data.publications];
}

export function getAchievementsList(data) {
  if (!data) return [];
  const raw = data.achievements || data.awards || [];
  return Array.isArray(raw) ? raw : [raw];
}

export function getLeadershipList(data) {
  if (!data) return [];
  const raw = data.leadership || data.leadership_roles || data.co_curricular || [];
  return Array.isArray(raw) ? raw : [raw];
}

export function getHobbiesList(data) {
  if (!data) return [];
  const raw = data.hobbies_interests || data.hobbies || data.interests || [];
  if (Array.isArray(raw)) return raw.map(h => String(h).trim()).filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) return raw.split(',').map(h => h.trim()).filter(Boolean);
  return [];
}

export function getAdditionalInfoList(data) {
  if (!data) return [];
  const raw = data.additional_information || data.custom_sections || data.customSections || [];
  return Array.isArray(raw) ? raw : [raw];
}
