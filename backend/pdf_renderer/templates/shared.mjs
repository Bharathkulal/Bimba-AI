/**
 * Shared utilities for all PDF template renderers.
 * Provides the HTML shell (with Tailwind Play CDN + Google Fonts) and
 * helper functions for rendering common section types.
 */

export function htmlShell(bodyContent, fontFamily = 'Inter', fontSize = '11pt') {
  const googleFontMap = {
    'Inter': 'Inter:wght@400;500;600;700;800;900',
    'Roboto': 'Roboto:wght@400;500;700;900',
    'Calibri': 'Carlito:wght@400;700',       // Calibri-equivalent on web
    'Arial': 'Arial',                         // System font, no Google import needed
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
    }
  </style>
</head>
<body class="bg-white">
${bodyContent}
</body>
</html>`;
}

export function esc(str) {
  if (!str) return '';
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
    return exp.end_date ? `${exp.start_date} - ${exp.end_date}` : exp.start_date;
  }
  return '';
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
    return edu.end_date ? `${edu.start_date} - ${edu.end_date}` : edu.start_date;
  }
  return '';
}
