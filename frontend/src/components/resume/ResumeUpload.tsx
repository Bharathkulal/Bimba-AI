import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Trash2, RefreshCw, BarChart2 } from 'lucide-react';
import { apiClient } from '../../services/api';
import { useResumeStore } from '../../store/resumeStore';
import { Button } from '../Button';

interface ResumeUploadProps {
  onUploadSuccess?: (file: File) => void;
  onAnalyzeClick?: () => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onUploadSuccess,
  onAnalyzeClick
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedMeta, setUploadedMeta] = useState<{
    filename: string;
    size: number;
    url: string;
    uploadedAt: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const setResume = useResumeStore((state) => state.setResume);

  const allowedExtensions = ['pdf', 'doc', 'docx'];
  const maxFileSize = 20 * 1024 * 1024; // 20MB

  const validateFile = (selectedFile: File): string | null => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return 'Only PDF, DOC, DOCX files are supported';
    }
    if (selectedFile.size > maxFileSize) {
      return 'File size must be below 20MB';
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      setErrorMessage(error);
      setStatus('error');
      setFile(null);
    } else {
      setFile(selectedFile);
      setErrorMessage('');
      setStatus('idle');
    }
  };

  const removeFile = () => {
    setFile(null);
    setStatus('idle');
    setErrorMessage('');
    setUploadedMeta(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/api/files/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const responseData = response.data;
      if (responseData.success) {
        const fileMeta = responseData.file;
        const uploadDate = new Date().toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const meta = {
          filename: fileMeta.filename,
          size: file.size,
          url: fileMeta.url,
          uploadedAt: uploadDate
        };

        setUploadedMeta(meta);
        setStatus('success');
        
        // Save file information to Zustand store
        setResume(fileMeta);

        if (onUploadSuccess) {
          onUploadSuccess(file);
        }
      } else {
        throw new Error(responseData.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Resume upload error:', err);
      const detailMsg = err.response?.data?.detail || err.message || 'Cloudinary Upload Failed';
      setErrorMessage(detailMsg);
      setStatus('error');
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300">
      <AnimatePresence mode="wait">
        
        {/* Idle/Select File View */}
        {(status === 'idle' || status === 'error') && !uploadedMeta && (
          <motion.div
            key="select-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4 text-center"
          >
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                📄 Upload Your Resume
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Upload your resume and get AI-powered career insights
              </p>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 cursor-pointer flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-slate-300 dark:border-white/15 bg-slate-50/50 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-md">
                <UploadCloud size={24} />
              </div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Drag & drop your resume here, or <span className="text-emerald-500 underline">browse</span>
              </div>
              <p className="text-[10px] text-slate-450">Supports PDF, DOC, DOCX (Max 20MB)</p>
            </div>

            {/* Error Message */}
            {status === 'error' && errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl p-3 text-xs font-semibold flex items-center gap-2"
              >
                <AlertTriangle size={14} className="shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* File Selected Preview */}
            {file && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FileText size={20} className="text-emerald-500 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{formatSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={removeFile}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-450 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {file && (
              <Button onClick={handleUpload} className="w-full font-bold mt-2">
                Upload Resume
              </Button>
            )}
          </motion.div>
        )}

        {/* Uploading State */}
        {status === 'uploading' && (
          <motion.div
            key="uploading-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 gap-4 text-center"
          >
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5 border-t-emerald-500 animate-spin" />
              <RefreshCw size={24} className="text-emerald-500 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">Uploading resume...</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1">Deploying documents to secure storage</p>
            </div>
          </motion.div>
        )}

        {/* Success State */}
        {status === 'success' && uploadedMeta && (
          <motion.div
            key="success-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5 text-center"
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-md">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white mt-1">
                Resume Uploaded Successfully
              </h3>
            </div>

            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-2.5 text-left text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Filename:</span>
                <span className="font-semibold text-slate-800 dark:text-white truncate max-w-[240px]">
                  {uploadedMeta.filename}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/5 pt-2">
                <span className="text-slate-500 dark:text-slate-400 font-bold">File Size:</span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {formatSize(uploadedMeta.size)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/5 pt-2">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Upload Date:</span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {uploadedMeta.uploadedAt}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-1">
              <Button
                onClick={onAnalyzeClick}
                className="flex-1 font-bold flex items-center justify-center gap-2"
                icon={<BarChart2 size={15} />}
              >
                Analyze My Resume
              </Button>
              <Button
                onClick={removeFile}
                variant="outline"
                className="font-bold border border-slate-200 dark:border-white/15"
              >
                Upload Another
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
