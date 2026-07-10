import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
  dark?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = true,
  dark = false,
}) => {
  return (
    <motion.div
      whileHover={onClick || hoverEffect ? { y: -4, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)' } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
      className={`${dark ? 'glass-card-dark' : 'glass-card'} p-6 rounded-[20px] ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};
