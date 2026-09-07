import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Grip, Code2, Layers, FileText, Image as ImageIcon, Zap, SplitSquareHorizontal, PenTool, Search, Palette, FileJson, FileCode2, TerminalSquare, Layout, Archive, Stamp, Rocket, Mail, Globe } from 'lucide-react';

interface ToolMenuProps {
  customTrigger?: (props: { ref: React.RefObject<HTMLButtonElement>; onClick: () => void; isOpen: boolean }) => React.ReactNode;
}

export const ToolMenu: React.FC<ToolMenuProps> = ({ customTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuTop, setMenuTop] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const navigate = useNavigate();

  const tools = [
    { to: '/brizyconverter', icon: <Zap size={18} />, label: 'Brizy Code Decompiler', color: 'text-purple-500 font-bold' },
    { to: '/webextractor', icon: <Globe size={18} />, label: 'Web Extractor Studio', color: 'text-indigo-500 font-bold' },
    { to: '/newsletterstudio', icon: <Mail size={18} />, label: 'Newsletter Studio', color: 'text-red-500 font-bold' },
    { to: '/lp-optimizely', icon: <Rocket size={18} />, label: 'LP-Optimizely', color: 'text-emerald-500 font-bold' },
    { to: '/wysiwygstudio', icon: <Layout size={18} />, label: 'WYSIWYG Web Studio', color: 'text-blue-600 font-bold' },
    { to: '/htmltools', icon: <Code2 size={18} />, label: 'HTML Tools', color: 'text-blue-500' },
    { to: '/imagelabeling', icon: <Stamp size={18} />, label: 'Image Labeling Studio', color: 'text-blue-500' },
    { to: '/componentstorage', icon: <Layers size={18} />, label: 'Component Storage', color: 'text-indigo-500' },
    { to: '/wordimageextractor', icon: <Archive size={18} />, label: 'Word Image Extractor', color: 'text-amber-500' },
    { to: '/kazbuilder', icon: <Layout size={18} />, label: 'KAZ / Email Builder', color: 'text-purple-500' },
    { to: '/batch', icon: <Layers size={18} />, label: 'Batch Analyzer', color: 'text-emerald-500' },
    { to: '/wordtohtml', icon: <FileText size={18} />, label: 'Word to HTML', color: 'text-blue-500' },
    { to: '/imagetools', icon: <ImageIcon size={18} />, label: 'Image Tools', color: 'text-orange-500' },
    { to: '/performancetools', icon: <Zap size={18} />, label: 'Performance Tools', color: 'text-indigo-500' },
    { to: '/devtools', icon: <Code2 size={18} />, label: 'Dev Tools', color: 'text-indigo-500' },
    { to: '/shytool', icon: <Zap size={18} />, label: 'Smart Shy Tool', color: 'text-cyan-500' },
    { to: '/textcompare', icon: <SplitSquareHorizontal size={18} />, label: 'Text Compare', color: 'text-orange-500' },
    { to: '/handwriting', icon: <PenTool size={18} />, label: 'Handwriting Simulator', color: 'text-pink-500' },
    { to: '/ocr', icon: <Search size={18} />, label: 'OCR Tool', color: 'text-emerald-500' },
    { to: '/svgtool', icon: <FileCode2 size={18} />, label: 'SVG Optimizer', color: 'text-blue-500' },
    { to: '/datatransformer', icon: <FileJson size={18} />, label: 'Data Transformer', color: 'text-orange-500' },
    { to: '/colorpalette', icon: <Palette size={18} />, label: 'Color Palette', color: 'text-pink-500' },
    { to: '/smartlinter', icon: <TerminalSquare size={18} />, label: 'Smart Linter', color: 'text-cyan-500' },
    { to: '/encodingfixer', icon: <PenTool size={18} />, label: 'Encoding Fixer', color: 'text-indigo-500' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev < tools.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : tools.length - 1));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        navigate(tools[focusedIndex].to);
        setIsOpen(false);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, navigate, tools]);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Center top calculation or offset
      const calculatedTop = Math.max(16, Math.min(window.innerHeight - 400, rect.top - 100));
      setMenuTop(calculatedTop);
    } else {
      setMenuTop(16);
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {customTrigger ? (
        customTrigger({ ref: buttonRef, onClick: handleToggle, isOpen })
      ) : (
        <button 
          ref={buttonRef}
          onClick={handleToggle}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
            isOpen 
              ? 'bg-black/10 dark:bg-white/10 text-tg-light-text dark:text-tg-dark-text' 
              : 'text-tg-light-hint dark:text-tg-dark-hint hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover'
          }`}
          title="Tools Menu"
        >
          <Grip size={20} />
        </button>
      )}

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className="fixed left-16 top-1/2 -translate-y-1/2 w-64 max-h-[85vh] overflow-y-auto custom-scrollbar bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-[9999] animate-in fade-in slide-in-from-left-2 duration-150"
        >
          <div className="px-4 py-2 text-xs font-semibold text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">
            All Tools
          </div>
          {tools.map((tool, index) => (
            <NavLink
              key={tool.to}
              to={tool.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isActive || focusedIndex === index
                    ? 'bg-black/5 dark:bg-white/5 font-medium' 
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`
              }
            >
              <div className={`${tool.color}`}>
                {tool.icon}
              </div>
              <span className="text-sm text-tg-light-text dark:text-tg-dark-text">{tool.label}</span>
            </NavLink>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};
