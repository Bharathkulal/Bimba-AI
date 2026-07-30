import React, { useState } from 'react';
import { useResumeBuilderStore } from '../../store/resumeBuilderStore';
import { TemplateRegistry } from './templates';
import { FileText, Download, Sparkles, RefreshCw } from 'lucide-react';

export const ResumePreview: React.FC = () => {
  const { resumeData, selectedTemplate, generatePdf, generating } = useResumeBuilderStore();
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState('11pt');

  if (!resumeData) return null;

  // Fallback to harvard if template not found
  const TemplateComponent = TemplateRegistry[selectedTemplate] || TemplateRegistry.harvard;

  const handleDownload = async () => {
    // Extract resumeId from query parameters or window path if available
    const pathParts = window.location.pathname.split('/');
    const resumeId = parseInt(pathParts[pathParts.length - 1], 10);
    if (!isNaN(resumeId)) {
      const res = await generatePdf(resumeId);
      if (res && res.pdf_url) {
        window.open(res.pdf_url, '_blank');
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 text-left">
      {/* Action Controls Header */}
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Live Preview
          </h4>
          <span className="text-[10px] text-slate-400 font-bold">Synchronized in real-time</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Typography selector */}
          <select 
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black focus:outline-none"
          >
            <option value="Inter">Inter (Default)</option>
            <option value="Calibri">Calibri</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Roboto">Roboto</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>

          <select 
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black focus:outline-none"
          >
            <option value="10pt">10 pt</option>
            <option value="11pt">11 pt (Recommended)</option>
            <option value="12pt">12 pt</option>
          </select>

          <button
            onClick={handleDownload}
            disabled={generating}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm hover:shadow transition-all duration-205 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {generating ? <RefreshCw size={11} className="animate-spin" /> : <Download size={11} />}
            {generating ? 'Exporting...' : 'PDF Export'}
          </button>
        </div>
      </div>

      {/* Frame view */}
      <div className="bg-slate-100 p-4.5 rounded-[22px] border border-slate-200/60 shadow-inner max-h-[72vh] overflow-y-auto min-h-[500px]">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200/40 overflow-hidden transform origin-top transition-transform duration-300">
          <TemplateComponent 
            data={resumeData} 
            fontFamily={fontFamily} 
            fontSize={fontSize} 
          />
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
