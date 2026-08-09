import { useState, useRef, useCallback } from 'react';
import { apiClient } from '../../../services/api';
import type { ResumeBuilderData } from '../../../store/resumeBuilderStore';

export interface UseResumeUploadResult {
  isUploading: boolean;
  uploadProgress: number;
  uploadState: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  uploadError: string | null;
  parsedData: ResumeBuilderData | null;
  resumeId: number | null;
  uploadFile: (file: File) => Promise<void>;
  resetUpload: () => void;
}

export const useResumeUpload = (): UseResumeUploadResult => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ResumeBuilderData | null>(null);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadState('idle');
    setUploadError(null);
    setParsedData(null);
    setResumeId(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadState('uploading');
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    const maxAttempts = 3;
    let attempt = 1;
    let delay = 1000; // start with 1.0s

    while (attempt <= maxAttempts) {
      try {
        const response = await apiClient.post('/api/resume-studio/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000, // 2 minutes
          signal: controller.signal,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(percentCompleted);
            if (percentCompleted >= 100) {
              setUploadState('processing');
            }
          }
        });

        if (!response.data || !response.data.success || !response.data.resume_id) {
          throw new Error('Invalid or incomplete parsing response from backend.');
        }

        setParsedData(response.data.parsed_data || {});
        setResumeId(response.data.resume_id);
        setUploadState('success');
        setIsUploading(false);
        return; // Success, exit retry loop
      } catch (err: any) {
        if (controller.signal.aborted) {
          setUploadState('error');
          setUploadError('Upload cancelled by user.');
          setIsUploading(false);
          return;
        }

        const isNetworkOr5xx = !err.response || (err.response.status >= 500);

        if (isNetworkOr5xx && attempt < maxAttempts) {
          console.warn(`[useResumeUpload] Attempt ${attempt} failed. Retrying in ${delay}ms...`, err);
          await new Promise((resolve) => setTimeout(resolve, delay));
          attempt++;
          delay *= 2; // exponential backoff
        } else {
          console.error('[useResumeUpload] Upload failed finally:', err);
          const detail = err.response?.data?.detail || err.message || 'Error occurred during parsing';
          setUploadError(typeof detail === 'string' ? detail : JSON.stringify(detail));
          setUploadState('error');
          setIsUploading(false);
          return;
        }
      }
    }
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadState,
    uploadError,
    parsedData,
    resumeId,
    uploadFile,
    resetUpload
  };
};
