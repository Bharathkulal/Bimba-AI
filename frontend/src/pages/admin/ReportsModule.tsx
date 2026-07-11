import React, { useState } from 'react';
import { FileText, FileSpreadsheet } from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = (type: string) => {
    setExporting(type);
    setTimeout(() => {
      setExporting(null);
      alert(`Report exported successfully in ${type.toUpperCase()} format.`);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
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
              {/* Bars */}
              {[
                { x: 30, h: 40, m: 'Jan' },
                { x: 90, h: 70, m: 'Feb' },
                { x: 150, h: 60, m: 'Mar' },
                { x: 210, h: 110, m: 'Apr' },
                { x: 270, h: 90, m: 'May' },
                { x: 330, h: 130, m: 'Jun' },
                { x: 390, h: 140, m: 'Jul' }
              ].map((bar, i) => (
                <g key={i}>
                  <rect
                    x={bar.x}
                    y={150 - bar.h}
                    width="28"
                    height={bar.h}
                    rx="6"
                    fill="#2563EB"
                    className="opacity-80 hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                  />
                  <text x={bar.x + 14} y="160" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="bold">
                    {bar.m}
                  </text>
                  <text x={bar.x + 14} y={142 - bar.h} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">
                    {bar.h}
                  </text>
                </g>
              ))}
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
                d="M 30 130 L 110 110 L 190 90 L 270 95 L 350 60 L 430 40 L 490 30"
                fill="none"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {[
                { x: 30, y: 130, w: 'W1', score: '62%' },
                { x: 110, y: 110, w: 'W2', score: '68%' },
                { x: 190, y: 90, w: 'W3', score: '72%' },
                { x: 270, y: 95, w: 'W4', score: '71%' },
                { x: 350, y: 60, w: 'W5', score: '82%' },
                { x: 430, y: 40, w: 'W6', score: '88%' }
              ].map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
                  <text x={pt.x} y="160" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="bold">
                    {pt.w}
                  </text>
                  <text x={pt.x} y={pt.y - 12} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">
                    {pt.score}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportsModule;
