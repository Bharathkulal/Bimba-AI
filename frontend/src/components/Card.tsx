import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = true,
}) => {
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  const themeBg = 'bg-card border-border text-slate-800';

  return (
    <motion.div
      whileHover={onClick || hoverEffect ? { y: -4, boxShadow: isAdmin ? '0 10px 20px -5px rgba(0, 0, 0, 0.3)' : '0 10px 20px -5px rgba(0, 0, 0, 0.05), 0 8px 16px -6px rgba(0, 0, 0, 0.05)' } : {}}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      onClick={onClick}
      className={`${themeBg} border p-6 rounded-[20px] shadow-sm ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;
