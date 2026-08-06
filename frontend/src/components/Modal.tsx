import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`relative w-full ${sizeClasses[size]} rounded-[20px] shadow-xl overflow-hidden z-10 border flex flex-col ${
              typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
                ? 'bg-[#102117] border-white/5 text-white'
                : 'bg-white border-slate-100 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
                ? 'border-white/5'
                : 'border-slate-100'
            }`}>
              <h3 className={`text-lg font-bold ${
                typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
                  ? 'text-white'
                  : 'text-slate-900'
              }`}>{title}</h3>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-smooth cursor-pointer ${
                  typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
                    ? 'text-slate-400 hover:text-white hover:bg-white/5'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
