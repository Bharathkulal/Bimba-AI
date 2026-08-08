import React, { useRef, useState } from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { UploadCloud, File, AlertCircle, RefreshCw, Clipboard, ExternalLink } from 'lucide-react';
import { Button } from '../../Button';
import { Card } from '../../Card';
import { apiClient } from '../../../services/api';

export const DocumentIngestionStep: React.FC = () => {
  const { setFile, file, setResumeId, setStep, triggerAutosave } = useResumeBuilderContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (f: File) => {
    setErrorMsg(null);
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'txt') {
      setErrorMsg("Unsupported file format. Please upload PDF, DOCX or TXT.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg("File exceeds the maximum size limit of 10MB.");
      return;
    }
    setFile(f);
  };

  const handleReplace = () => {
    setFile(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContinue = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/api/resume-studio/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.resume_id) {
        setResumeId(res.data.resume_id);
        setStep(3); // Go to parsing progress
      } else {
        setErrorMsg("Failed to upload file. Missing resume ID.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Connection lost or file upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    setUploading(true);
    setErrorMsg(null);
    setShowPasteModal(false);

    try {
      const res = await apiClient.post('/api/resume-studio/upload-text', { text: pasteText });
      if (res.data && res.data.resume_id) {
        setResumeId(res.data.resume_id);
        setStep(3);
      } else {
        setErrorMsg("Failed to upload text. Missing resume ID.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to submit resume text. Please check the network.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl w-full flex flex-col gap-6 py-4 text-center">
      <div>
        <h2 className="text-xl font-black tracking-tight">Upload Your Document</h2>
        <p className="text-xs text-slate-500 mt-1">Upload your resume to run the Bimba unified parser.</p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 dark:border-white/5 dark:bg-rose-500/10 text-rose-500 rounded-2xl p-4 text-xs font-semibold text-left flex items-start gap-2.5 shadow-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Zone */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl py-12 px-6 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
            isDragOver 
              ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.08)]' 
              : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-emerald-500 hover:bg-emerald-500/5'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".pdf,.docx,.txt" 
            className="hidden" 
          />
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-md">
            <UploadCloud size={24} />
          </div>
          <div className="text-center">
            <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Drag & drop files here, or click to browse</p>
            <p className="text-[10px] text-slate-400 mt-1">Accepts PDF, DOCX, TXT up to 10MB</p>
          </div>
        </div>
      ) : (
        /* File Card Selected */
        <Card className="p-5 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 flex flex-col gap-4 text-left shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <File size={20} />
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{file.name}</h4>
              <p className="text-[10px] text-slate-450 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <button 
              onClick={handleReplace}
              className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-wider cursor-pointer"
            >
              Replace
            </button>
          </div>

          <Button
            onClick={handleContinue}
            isLoading={uploading}
            className="w-full font-black text-xs py-2.5 flex items-center justify-center gap-1.5"
          >
            Continue
          </Button>
        </Card>
      )}

      {/* Paste fallback */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <button
          onClick={() => setShowPasteModal(true)}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer transition-all"
        >
          <Clipboard size={12} /> Paste resume text instead
        </button>
      </div>

      {/* Paste text modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl flex flex-col gap-4 text-left">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Paste Resume Content</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Paste raw texts directly from any documents below.</p>
            </div>
            <textarea
              className="w-full h-48 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold focus:outline-none focus:border-emerald-500 resize-none"
              placeholder="Paste content here..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <Button
                onClick={handlePasteSubmit}
                isLoading={uploading}
                disabled={!pasteText.trim()}
                className="font-bold text-xs"
              >
                Ingest Content
              </Button>
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DocumentIngestionStep;
