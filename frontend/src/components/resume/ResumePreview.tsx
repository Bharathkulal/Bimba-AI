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
      if (res) {
        const name = resumeData?.personal_info?.name || 'Resume';
        const safeName = name.trim().replace(/\s+/g, '_') || 'My';
        const filename = `${safeName}_Resume.pdf`;

        if (res.pdf_base64) {
          try {
            const sliceSize = 512;
            const byteCharacters = atob(res.pdf_base64);
            const byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
              const slice = byteCharacters.slice(offset, offset + sliceSize);
              const byteNumbers = new Array(slice.length);
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }
            const blob = new Blob(byteArrays, { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          } catch (error) {
            console.error("Base64 download failed:", error);
          }
        } else if (res.pdf_url) {
          window.open(res.pdf_url, '_blank');
        }
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
    <div className="w-full flex flex-col gap-2 text-left">
      {/* Frame view */}
      <div className="bg-slate-100/80 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-inner overflow-hidden flex items-start justify-center h-[420px] w-full">
        <div className="w-[800px] origin-top scale-[0.45] bg-white text-slate-850 rounded-xl shadow-md border border-slate-200/40 overflow-hidden shrink-0">
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
