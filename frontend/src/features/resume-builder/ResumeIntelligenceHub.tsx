import React, { useState, useRef } from 'react';
import { UploadCloud, Plus, CheckCircle2, File, AlertCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface ResumeIntelligenceHubProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement> | File) => void;
  onCreateScratch: () => void;
  isUploading: boolean;
}

export const ResumeIntelligenceHub: React.FC<ResumeIntelligenceHubProps> = ({ 
  onFileUpload, 
  onCreateScratch,
  isUploading 
}) => {
  const [dragState, setDragState] = useState<'idle' | 'dragging' | 'invalid'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragState !== 'dragging') setDragState('dragging');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragState('idle');
  };

  const validateAndProcessFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'docx', 'txt'];
    
    if (!ext || !validExts.includes(ext)) {
      setDragState('invalid');
      setTimeout(() => setDragState('idle'), 3000);
      alert('Invalid file type. Please upload PDF, DOCX, or TXT.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setDragState('invalid');
      setTimeout(() => setDragState('idle'), 3000);
      alert('File exceeds 10MB limit.');
      return;
    }

    setDragState('idle');
    onFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    } else {
      setDragState('idle');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full flex flex-col items-center max-w-4xl mx-auto py-8">
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
          Turn your resume into your placement profile
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto text-sm font-medium">
          Upload your existing resume to unlock our ATS analysis, skill gap detection, and real job matching intelligence.
        </p>
      </div>

      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`w-full relative overflow-hidden rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center min-h-[320px] p-8 text-center bg-white dark:bg-[#1F2937]
          ${dragState === 'idle' ? 'border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:border-white/10 dark:hover:border-emerald-500/30' : ''}
          ${dragState === 'dragging' ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20' : ''}
          ${dragState === 'invalid' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
          ${isUploading ? 'opacity-70 pointer-events-none' : ''}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange} 
        />

        <AnimatePresence mode="wait">
          {dragState === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 flex items-center justify-center mb-4 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Click or Drag & Drop your Resume
              </h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                PDF, DOCX, or TXT up to 10MB
              </p>
              
              <div className="flex gap-4 mt-8 opacity-80">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <CheckCircle2 size={14} className="text-emerald-500" /> AI Understanding
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <CheckCircle2 size={14} className="text-emerald-500" /> ATS Analysis
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Job Matching
                </div>
              </div>
            </motion.div>
          )}

          {dragState === 'dragging' && (
            <motion.div 
              key="dragging"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center text-emerald-600"
            >
              <File size={48} className="animate-bounce" />
              <h3 className="text-xl font-bold mt-4">Drop to Upload!</h3>
            </motion.div>
          )}

          {dragState === 'invalid' && (
            <motion.div 
              key="invalid"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center text-red-500"
            >
              <AlertCircle size={48} />
              <h3 className="text-lg font-bold mt-4">Unsupported File Type or Size</h3>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="mt-8 flex items-center justify-center w-full max-w-md gap-4">
        <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
        <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
      </div>

      <div className="mt-6">
        <Button 
          variant="secondary"
          onClick={(e: React.MouseEvent) => { e.preventDefault(); onCreateScratch(); }}
          className="flex items-center gap-2 group border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent"
        >
          <Plus size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">Create From Scratch</span>
        </Button>
      </div>
    </div>
  );
};
