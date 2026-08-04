import React from 'react';
import { Sparkles, Trophy, Star, ShieldCheck, EyeOff } from 'lucide-react';

interface TemplateBadgeProps {
  type: 'premium' | 'featured' | 'new' | 'ats' | 'enabled' | 'disabled';
  text?: string;
}

export const TemplateBadge: React.FC<TemplateBadgeProps> = ({ type, text }) => {
  const badgeStyles = {
    premium: {
      bg: 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
      icon: Sparkles,
      label: text || 'Premium',
    },
    featured: {
      bg: 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
      icon: Star,
      label: text || 'Featured',
    },
    new: {
      bg: 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      icon: ShieldCheck,
      label: text || 'New',
    },
    ats: {
      bg: 'bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400',
      icon: Trophy,
      label: text || 'ATS Friendly',
    },
    enabled: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      icon: ShieldCheck,
      label: text || 'Active',
    },
    disabled: {
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
      icon: EyeOff,
      label: text || 'Disabled',
    },
  };

  const current = badgeStyles[type];
  const Icon = current.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wide uppercase shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-105 ${current.bg}`}>
      <Icon size={12} className="animate-pulse" />
      <span>{current.label}</span>
    </div>
  );
};
