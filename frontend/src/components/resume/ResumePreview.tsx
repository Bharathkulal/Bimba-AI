import React, { useEffect, useState } from 'react';
import { useResumeBuilderStore } from '../../store/resumeBuilderStore';
import { TemplateRegistry } from './templates';
import { Download, RefreshCw } from 'lucide-react';

const STUDIO_PREFS_KEY = 'bimba.resumeStudioPreferences.v1';

const loadTypographyPrefs = () => {
  try {
    const stored = localStorage.getItem(STUDIO_PREFS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

interface ResumePreviewProps {
  fontFamily?: string;
  fontSize?: string;
  onFontFamilyChange?: (value: string) => void;
  onFontSizeChange?: (value: string) => void;
  showDownload?: boolean;
  downloadLabel?: string;
  frameClassName?: string;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  fontFamily,
  fontSize,
  onFontFamilyChange,
  onFontSizeChange,
  showDownload = true,
  downloadLabel = 'PDF Export',
  frameClassName = 'max-h-[72vh] min-h-[500px]'
}) => {
  const { resumeData, selectedTemplate, generatePdf, generating, resumeId } = useResumeBuilderStore();
  const prefs = loadTypographyPrefs();
  const [internalFontFamily, setInternalFontFamily] = useState(prefs.fontFamily || 'Inter');
  const [internalFontSize, setInternalFontSize] = useState(prefs.fontSize || '11pt');

  const activeFontFamily = fontFamily || internalFontFamily;
  const activeFontSize = fontSize || internalFontSize;

  useEffect(() => {
    const existing = loadTypographyPrefs();
    localStorage.setItem(
      STUDIO_PREFS_KEY,
      JSON.stringify({
        ...existing,
        fontFamily: activeFontFamily,
        fontSize: activeFontSize
      })
    );
  }, [activeFontFamily, activeFontSize]);

  if (!resumeData) return null;

  // Fallback to harvard if template not found
  const TemplateComponent = TemplateRegistry[selectedTemplate] || TemplateRegistry.harvard;

  const handleDownload = async () => {
    if (resumeId) {
      const res = await generatePdf(resumeId);
      if (res && res.pdf_url) {
        window.open(res.pdf_url, '_blank');
      }
    }
  };

  const handleFontFamilyChange = (value: string) => {
    if (onFontFamilyChange) {
      onFontFamilyChange(value);
    } else {
      setInternalFontFamily(value);
    }
  };

  const handleFontSizeChange = (value: string) => {
    if (onFontSizeChange) {
      onFontSizeChange(value);
    } else {
      setInternalFontSize(value);
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
            value={activeFontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
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
            value={activeFontSize}
            onChange={(e) => handleFontSizeChange(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black focus:outline-none"
          >
            <option value="10pt">10 pt</option>
            <option value="11pt">11 pt (Recommended)</option>
            <option value="12pt">12 pt</option>
          </select>

          {showDownload && (
            <button
              onClick={handleDownload}
              disabled={generating}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm hover:shadow transition-all duration-205 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {generating ? <RefreshCw size={11} className="animate-spin" /> : <Download size={11} />}
              {generating ? 'Exporting...' : downloadLabel}
            </button>
          )}
        </div>
      </div>

      {/* Frame view */}
      <div className={`bg-slate-100 p-4.5 rounded-[22px] border border-slate-200/60 shadow-inner overflow-y-auto ${frameClassName}`}>
        <div className="bg-white rounded-xl shadow-lg border border-slate-200/40 overflow-hidden transform origin-top transition-transform duration-300">
          <TemplateComponent 
            data={resumeData} 
            fontFamily={activeFontFamily} 
            fontSize={activeFontSize} 
          />
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
