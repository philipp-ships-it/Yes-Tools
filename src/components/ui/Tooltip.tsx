import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'right', 
  className = '',
  delay = 0.3
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  let positionClasses = '';
  let initial = {};
  let animate = {};
  
  switch (position) {
    case 'right':
      positionClasses = 'left-full top-1/2 -translate-y-1/2 ml-3';
      initial = { opacity: 0, x: -10, y: '-50%' };
      animate = { opacity: 1, x: 0, y: '-50%' };
      break;
    case 'left':
      positionClasses = 'right-full top-1/2 -translate-y-1/2 mr-3';
      initial = { opacity: 0, x: 10, y: '-50%' };
      animate = { opacity: 1, x: 0, y: '-50%' };
      break;
    case 'top':
      positionClasses = 'bottom-full left-1/2 -translate-x-1/2 mb-3';
      initial = { opacity: 0, y: 10, x: '-50%' };
      animate = { opacity: 1, y: 0, x: '-50%' };
      break;
    case 'bottom':
      positionClasses = 'top-full left-1/2 -translate-x-1/2 mt-3';
      initial = { opacity: 0, y: -10, x: '-50%' };
      animate = { opacity: 1, y: 0, x: '-50%' };
      break;
  }

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={initial}
            animate={animate}
            exit={initial}
            transition={{ duration: 0.15, delay }}
            className={`absolute z-[10000] px-3 py-1.5 text-xs font-medium text-white bg-black/80 dark:bg-white/90 dark:text-black rounded-lg shadow-xl whitespace-nowrap pointer-events-none border border-white/10 dark:border-black/10 ${positionClasses} ${className}`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
