import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import type { ToastMessage } from '../../store/notificationStore';
import { getCategoryIcon } from './NotificationDropdown';

interface IndividualToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const IndividualToast: React.FC<IndividualToastProps> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (isPaused) return;

    const interval = 50;
    const totalDuration = 5000;
    const steps = totalDuration / interval;
    const decrement = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-80 border border-slate-100 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl p-3.5 rounded-2xl flex gap-3 text-left relative overflow-hidden group select-none pointer-events-auto"
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0 text-sm">
        {toast.icon || getCategoryIcon(toast.type)}
      </div>

      <div className="flex-grow flex flex-col gap-0.5 pr-4">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{toast.type}</span>
        <h6 className="text-[11.5px] font-bold text-slate-800 dark:text-white mt-1 leading-tight">{toast.title}</h6>
        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug font-semibold">{toast.description}</p>
        
        {toast.actionUrl && (
          <a
            href={toast.actionUrl}
            target={toast.actionUrl.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="text-[9.5px] font-black text-emerald-600 hover:text-emerald-700 mt-2 flex items-center gap-0.5 w-fit"
          >
            Open details <ExternalLink size={9} />
          </a>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
      >
        <X size={13} />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-white/5">
        <div 
          className="h-full bg-emerald-500 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export const NotificationToastContainer: React.FC = () => {
  const toasts = useNotificationStore((state) => state.toasts);
  const removeToast = useNotificationStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-[55] flex flex-col gap-3.5 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <IndividualToast 
            key={t.id} 
            toast={t} 
            onDismiss={removeToast} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
