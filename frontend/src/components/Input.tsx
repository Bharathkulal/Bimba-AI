import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  dark?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, type, dark = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className={`text-xs font-semibold tracking-wide uppercase ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            id={id}
            ref={ref}
            type={isPasswordType && showPassword ? 'text' : type}
            className={`w-full pl-4 pr-10 py-3 rounded-xl border transition-smooth text-sm shadow-sm focus:ring-1 focus:outline-none ${
              dark
                ? 'border-white/10 bg-white/5 text-white placeholder-slate-500 focus:bg-white/10 focus:border-blue-500 focus:ring-blue-500/20'
                : 'border-slate-200 bg-white/70 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-primary'
            } ${
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            } ${className}`}
            {...props}
          />
          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer flex items-center justify-center"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-500 font-medium mt-0.5">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span className="text-xs text-slate-400">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
