import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-smooth focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 shadow-sm shadow-emerald-500/10',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-300',
    accent: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 focus:ring-emerald-300',
    outline: 'border border-slate-250 bg-transparent text-slate-800 hover:bg-slate-50 hover:border-emerald-500 focus:ring-emerald-500',
    ghost: 'bg-transparent text-slate-650 hover:bg-slate-50 hover:text-slate-900 focus:ring-emerald-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
};
