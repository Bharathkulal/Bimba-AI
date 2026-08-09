import React, { useRef, useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';

interface MobileFileDropZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[]; // e.g. ['.pdf', '.docx']
  maxSizeMB?: number;
}

export const MobileFileDropZone: React.FC<MobileFileDropZoneProps> = ({
  onFileSelect,
  acceptedFormats = ['.pdf', '.docx'],
  maxSizeMB = 5
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const validateAndProcessFile = (file: File) => {
    setError(null);
    
    // Check if empty/corrupted
    if (!file || file.size === 0) {
      setError('Selected file is empty or corrupted.');
      return;
    }

    // Check size
    const sizeLimitBytes = maxSizeMB * 1024 * 1024;
    if (file.size > sizeLimitBytes) {
      setError(`File size exceeds the limit of ${maxSizeMB} MB.`);
      return;
    }

    // Check extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(ext)) {
      setError(`Invalid file format. Accepted formats: ${acceptedFormats.join(', ').toUpperCase()}`);
      return;
    }

    onFileSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  return (
    <div className="w-full">
      <div
        onClick={handleDivClick}
        className="w-full min-h-[180px] bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/10 active:scale-[0.99] transition-all duration-200"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedFormats.join(',')}
          className="hidden"
        />
        
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 shadow-sm">
          <UploadCloud size={22} />
        </div>

        <div>
          <span className="block text-sm font-extrabold text-slate-800 dark:text-slate-200">
            Tap to upload resume
          </span>
          <span className="block text-[11px] text-slate-450 dark:text-slate-400 mt-1 font-semibold">
            Supports PDF, DOCX up to {maxSizeMB}MB
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 text-rose-500 bg-rose-50 dark:bg-rose-550/10 border border-rose-100 dark:border-rose-500/20 p-3 rounded-xl animate-fadeIn">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span className="text-[11px] font-bold leading-relaxed">{error}</span>
        </div>
      )}
    </div>
  );
};
