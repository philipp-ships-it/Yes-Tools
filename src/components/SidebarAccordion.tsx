import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SidebarAccordionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const SidebarAccordion: React.FC<SidebarAccordionProps> = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (isControlled && onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div className="bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl shadow-soft border border-tg-light-border dark:border-tg-dark-border overflow-hidden flex flex-col flex-shrink-0">
      <button 
        onClick={handleToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-tg-light-secondary/30 dark:bg-tg-dark-secondary/30 hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-tg-light-primary dark:text-tg-dark-primary">{icon}</span>}
          <h3 className="font-semibold text-sm text-tg-light-text dark:text-tg-dark-text">{title}</h3>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-tg-light-hint dark:text-tg-dark-hint transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
