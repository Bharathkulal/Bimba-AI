import React from 'react';
import { motion } from 'framer-motion';

interface DisplayHeadingProps {
  children: React.ReactNode;
  className?: string;
  size?: 'hero' | 'page' | 'section';
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  delay?: number;
}

export const DisplayHeading: React.FC<DisplayHeadingProps> = ({
  children,
  className = '',
  size = 'hero',
  as = 'h1',
  delay = 0.1,
}) => {
  const Component = (motion as any)[as] || motion.h1;

  const sizeClasses = {
    hero: 'text-[34px] min-[400px]:text-[40px] sm:text-[48px] md:text-[52px] lg:text-[64px] xl:text-[72px]',
    page: 'text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px]',
    section: 'text-[22px] sm:text-[24px] md:text-[28px] lg:text-[32px]',
  };

  return (
    <Component
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7, // 700ms
        ease: [0.16, 1, 0.3, 1], // easeOut
        delay: delay,
      }}
      style={{ fontWeight: 100 }}
      className={`font-display leading-[1.05] tracking-[-0.01em] text-slate-900 dark:text-white ${sizeClasses[size]} ${className}`}
    >
      {children}
    </Component>
  );
};
