import React, { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, CheckCircle2, X } from 'lucide-react';
import { adminService } from '../../services/admin';

export const ReportsModule: React.FC = () => {
  const [exporting, setExporting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const chartData = {
    resumeGrowth: [
      { month: 'Jan', count: 40 },
      { month: 'Feb', count: 70 },
      { month: 'Mar', count: 60 },
      { month: 'Apr', count: 110 },
      { month: 'May', count: 90 },
      { month: 'Jun', count: 130 },
      { month: 'Jul', count: 140 },
    ],
    atsScores: [
      { week: 'W1', score: 62 },
      { week: 'W2', score: 68 },
      { week: 'W3', score: 72 },
      { week: 'W4', score: 71 },
      { week: 'W5', score: 82 },
      { week: 'W6', score: 88 },
    ],
  };

  const generateCSVBlob = (): Blob => {
    let csv = 'Section,Period,Value\n';
    chartData.resumeGrowth.forEach(r => {
      csv += `Resume Generation,${r.month},${r.count}\n`;
    });
    chartData.atsScores.forEach(a => {
      csv += `ATS Compliance Score,${a.week},${a.score}%\n`;
    });
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  };

  const generatePDFBlob = (): Blob => {
    // Build a simple text-based PDF manually (PDF 1.4 spec)
    const title = 'Bimba AI — Analytics Report';
    const now = new Date().toLocaleString();

    let body = `${title}\nGenerated: ${now}\n\n`;
    body += '--- Monthly Resume Generation Rate ---\n';
    chartData.resumeGrowth.forEach(r => {
      body += `  ${r.month}: ${r.count} resumes\n`;
    });
    body += '\n--- Weekly ATS Compliance Average Score ---\n';
    chartData.atsScores.forEach(a => {
      body += `  ${a.week}: ${a.score}%\n`;
    });

    // Wrap in minimal valid PDF structure
    const lines = body.split('\n');
    const streamLines = lines.map(l => `(${l.replace(/[()\\]/g, '\\$&')}) Tj T*`).join('\n');
    const stream = `BT\n/F1 11 Tf\n36 760 Td\n13 TL\n${streamLines}\nET`;
    const streamBytes = new TextEncoder().encode(stream);

    const objects: string[] = [];
    // obj 1 - catalog
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
    // obj 2 - pages
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
    // obj 3 - page
    objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj');
    // obj 4 - stream
    objects.push(`4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream\nendobj`);
    // obj 5 - font
    objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];
    objects.forEach(obj => {
      offsets.push(pdf.length);
      pdf += obj + '\n';
    });
    const xrefOffset = pdf.length;
    pdf += 'xref\n';
    pdf += `0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    offsets.forEach(off => {
      pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
    });
    pdf += 'trailer\n';
    pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += 'startxref\n';
    pdf += `${xrefOffset}\n`;
    pdf += '%%EOF\n';

    return new Blob([pdf], { type: 'application/pdf' });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      if (type === 'pdf') {
        const blob = generatePDFBlob();
        downloadBlob(blob, 'bimba_analytics_report.pdf');
        setToast({ message: 'PDF report downloaded successfully.', type: 'success' });
      } else {
        const blob = generateCSVBlob();
        downloadBlob(blob, 'bimba_analytics_report.csv');
        setToast({ message: 'CSV report downloaded successfully.', type: 'success' });
      }
    } catch (err) {
      setToast({ message: `Failed to generate ${type.toUpperCase()} report.`, type: 'error' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn relative">

      {/* Inline Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-xs font-bold animate-fadeIn transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <CheckCircle2 size={16} className={toast.type === 'success' ? 'text-emerald-500' : 'text-red-500'} />
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 p-0.5 rounded-lg hover:bg-white/50 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Custom Analytics Reports Export</h2>
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-1">Generate downloads of academic resume and AI credits consumption records</p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] uppercase shadow-sm cursor-pointer disabled:opacity-50"
          >
            <FileText size={12} /> {exporting === 'pdf' ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[10px] uppercase shadow-sm cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet size={12} /> {exporting === 'csv' ? 'Building CSV...' : 'Download CSV'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom SVG Bar Chart - Resume building count */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">Monthly Resume generation rate</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Resume templates chosen by active students</p>
          </div>

          <div className="h-64 relative bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex flex-col justify-end">
            <svg className="w-full h-44" viewBox="0 0 500 160">
              {chartData.resumeGrowth.map((bar, i) => {
                const x = 30 + i * 60;
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={150 - bar.count}
                      width="28"
                      height={bar.count}
                      rx="6"
                      fill="#2563EB"
                      className="opacity-80 hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                    />
                    <text x={x + 14} y="160" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="bold">
                      {bar.month}
                    </text>
                    <text x={x + 14} y={142 - bar.count} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">
                      {bar.count}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Custom SVG Line Chart - ATS score distribution */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">Weekly ATS Compliance Average score</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Average portfolio optimization metrics</p>
          </div>

          <div className="h-64 relative bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex flex-col justify-end">
            <svg className="w-full h-44" viewBox="0 0 500 160">
              <path
                d={chartData.atsScores.map((pt, i) => {
                  const x = 30 + i * 80;
                  const y = 150 - pt.score;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="#111111"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {chartData.atsScores.map((pt, i) => {
                const x = 30 + i * 80;
                const y = 150 - pt.score;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="5" fill="#FFFFFF" stroke="#111111" strokeWidth="2.5" />
                    <text x={x} y="160" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="bold">
                      {pt.week}
                    </text>
                    <text x={x} y={y - 12} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">
                      {pt.score}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportsModule;
