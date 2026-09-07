import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Maximize2, 
  Minimize2, 
  Home as HomeIcon, 
  LayoutGrid, 
  Settings as SettingsIcon, 
  Mail, 
  FileEdit, 
  ShieldCheck, 
  Code, 
  Sparkles,
  Activity
} from 'lucide-react';

import { AppRoutes } from './components/AppRoutes';
import { GlobalSettings } from './components/GlobalSettings';
import { ToolMenu } from './components/ToolMenu';
import { EmbeddedAiSidebar } from './components/EmbeddedAiSidebar';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initAiNative } from './lib/headless';

// Ripple Effect Interface
interface Ripple {
  id: number;
  x: number;
  y: number;
}

// Reusable Tactile Ripple Button Component
interface NotchIconButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  className?: string;
  dataName?: string;
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: () => void;
  isActive?: boolean;
  isAi?: boolean;
  label?: string;
  isExpanded?: boolean;
  badge?: React.ReactNode;
  to?: string;
}

const NotchIconButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, NotchIconButtonProps>(
  ({ children, onClick, onDoubleClick, className = '', dataName, onMouseEnter, onMouseLeave, isActive, isAi, label, isExpanded, badge, to }, ref) => {
    const [ripples, setRipples] = useState<Ripple[]>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = { id: Date.now() + Math.random(), x, y };
      setRipples((prev) => [...prev.slice(-3), newRipple]);

      if (onClick) onClick(e);
    };

    const removeRipple = (id: number) => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    };

    const innerContent = (
      <>
        <div className="relative z-10 flex items-center justify-center shrink-0">
          {children}
        </div>

        {isExpanded && label && (
          <span className="ml-2.5 text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis text-zinc-300 group-hover:text-white flex-1 text-left">
            {label}
          </span>
        )}

        {isExpanded && badge && (
          <div className="ml-auto flex items-center pl-1 shrink-0">
            {badge}
          </div>
        )}

        {/* Tactile Framer Motion Ripple Effect */}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 2.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              onAnimationComplete={() => removeRipple(ripple.id)}
              className="absolute rounded-full bg-white/40 pointer-events-none z-20"
              style={{
                left: ripple.x - 16,
                top: ripple.y - 16,
                width: 32,
                height: 32,
              }}
            />
          ))}
        </AnimatePresence>
      </>
    );

    const baseClasses = `notch-icon-btn group relative overflow-hidden transition-all duration-200 ${
      isAi ? 'ai-btn' : ''
    } ${isActive ? 'active' : ''} ${
      isExpanded
        ? 'w-full px-3 py-2.5 h-auto rounded-xl bg-white/10 hover:bg-white/20 justify-start border border-white/5 shadow-sm'
        : ''
    } ${className}`;

    if (to) {
      return (
        <NavLink
          to={to}
          ref={ref as React.Ref<HTMLAnchorElement>}
          onClick={handleClick as any}
          onDoubleClick={onDoubleClick as any}
          className={({ isActive: navActive }) =>
            `${baseClasses} ${navActive ? 'active bg-white/25 text-white shadow-sm font-bold' : ''}`
          }
          data-name={dataName}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {innerContent}
        </NavLink>
      );
    }

    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        whileTap={{ scale: 0.94 }}
        onClick={handleClick as any}
        onDoubleClick={onDoubleClick as any}
        className={baseClasses}
        data-name={dataName}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {innerContent}
      </motion.button>
    );
  }
);

// Real-Time System Status Tracker
const useSystemStatus = (locationPath: string) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [latency, setLatency] = useState<number | null>(14);
  const [syncState, setSyncState] = useState<'synced' | 'syncing' | 'saved'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      if (!navigator.onLine) {
        setIsOnline(false);
        setLatency(null);
        return;
      }
      const start = performance.now();
      fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' })
        .then(() => {
          const end = performance.now();
          setLatency(Math.max(4, Math.round(end - start)));
          setIsOnline(true);
        })
        .catch(() => {
          setLatency(null);
        });
    }, 12000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setSyncState('syncing');
    const timer = setTimeout(() => {
      setSyncState('synced');
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 750);

    return () => clearTimeout(timer);
  }, [locationPath]);

  return { isOnline, latency, syncState, lastSyncTime };
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useLocalStorage('html-tools-dark-mode', false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Expanded Notch State
  const [isLeftExpanded, setIsLeftExpanded] = useLocalStorage('notch-left-expanded', false);
  const [isRightExpanded, setIsRightExpanded] = useLocalStorage('notch-right-expanded', false);

  // System Status Tracker
  const { isOnline, latency, syncState, lastSyncTime } = useSystemStatus(location.pathname);

  // Tooltip position states
  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const rightSidebarRef = useRef<HTMLDivElement>(null);

  const [leftTooltip, setLeftTooltip] = useState<{ title: string; top: number } | null>(null);
  const [rightTooltip, setRightTooltip] = useState<{ title: string; top: number } | null>(null);

  useEffect(() => {
    initAiNative();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleMouseEnterLeft = (e: React.MouseEvent<HTMLElement>, title: string) => {
    if (isLeftExpanded) return;
    if (!leftSidebarRef.current) return;
    const btnRect = e.currentTarget.getBoundingClientRect();
    const sidebarRect = leftSidebarRef.current.getBoundingClientRect();
    const topOffset = btnRect.top - sidebarRect.top + (btnRect.height / 2);
    setLeftTooltip({ title, top: topOffset });
  };

  const handleMouseLeaveLeft = () => {
    setLeftTooltip(null);
  };

  const handleMouseEnterRight = (e: React.MouseEvent<HTMLElement>, title: string) => {
    if (isRightExpanded) return;
    if (!rightSidebarRef.current) return;
    const btnRect = e.currentTarget.getBoundingClientRect();
    const sidebarRect = rightSidebarRef.current.getBoundingClientRect();
    const topOffset = btnRect.top - sidebarRect.top + (btnRect.height / 2);
    setRightTooltip({ title, top: topOffset });
  };

  const handleMouseLeaveRight = () => {
    setRightTooltip(null);
  };

  const toggleLeftExpanded = () => {
    setIsLeftExpanded(!isLeftExpanded);
    setLeftTooltip(null);
  };

  const toggleRightExpanded = () => {
    setIsRightExpanded(!isRightExpanded);
    setRightTooltip(null);
  };

  return (
    <div className="h-screen w-screen bg-[#f2f2f2] dark:bg-[#121214] text-tg-light-text dark:text-tg-dark-text transition-colors duration-200 flex flex-col font-sans overflow-hidden pt-[34px] pb-[10px] px-[10px] relative">
      {/* ================= OBERER SCHWARZER RAND MIT LOGO & LINK ================= */}
      <header className="top-bar">
        <span className="top-bar-text">yes.xlpm.de ist ein Service von</span>
        <img 
          src="https://firebasestorage.googleapis.com/v0/b/hallo-welt-paulik-reisch.firebasestorage.app/o/xlpm%2Fxlpm_logo.png?alt=media&token=9e55598c-a418-45e7-af19-f52fe63766a4" 
          alt="XLPM Logo" 
          className="top-bar-logo"
        />
        <a href="https://xlpm.de" target="_blank" rel="noopener noreferrer" className="top-bar-link">xlpm.de</a>
      </header>

      {/* Seitliche & Untere 10px Ränder */}
      <div className="bezel-left"></div>
      <div className="bezel-right"></div>
      <div className="bezel-bottom"></div>

      {/* ================= LINKE NOTCH (ENHANCED WITH SYSTEM STATUS & EXPAND GESTURE) ================= */}
      <div className="notch-sidebar notch-left" ref={leftSidebarRef}>
        <div 
          className={`notch ${isLeftExpanded ? 'notch-expanded' : ''}`}
          onDoubleClick={toggleLeftExpanded}
          title="Double-click anywhere on notch to expand / collapse"
        >
          {/* Expanded Header Banner */}
          {isLeftExpanded && (
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 mb-1 px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Activity size={14} className="text-blue-400" />
                <span>XLPM Studio</span>
              </div>
              <button 
                onClick={toggleLeftExpanded} 
                className="p-1 hover:bg-white/20 text-white/70 hover:text-white rounded-lg transition-colors"
                title="Collapse sidebar"
              >
                <Minimize2 size={13} />
              </button>
            </div>
          )}

          {/* 1. Home Link */}
          <NotchIconButton
            to="/"
            label="Home Dashboard"
            isExpanded={isLeftExpanded}
            dataName="Home"
            onMouseEnter={(e) => handleMouseEnterLeft(e, 'Home')}
            onMouseLeave={handleMouseLeaveLeft}
            onDoubleClick={toggleLeftExpanded}
          >
            <HomeIcon size={18} />
          </NotchIconButton>

          {/* 2. Apps Grid / ToolMenu */}
          <ToolMenu 
            customTrigger={({ ref, onClick, isOpen }) => (
              <NotchIconButton
                ref={ref}
                onClick={onClick}
                onDoubleClick={toggleLeftExpanded}
                isActive={isOpen}
                label="Apps & Tools Grid"
                isExpanded={isLeftExpanded}
                dataName="Apps Grid"
                onMouseEnter={(e) => handleMouseEnterLeft(e, 'Apps Grid')}
                onMouseLeave={handleMouseLeaveLeft}
              >
                <LayoutGrid size={18} />
              </NotchIconButton>
            )}
          />

          {/* Expanded Quick Navigation Shortcuts */}
          {isLeftExpanded && (
            <>
              <div className="w-full my-1 border-t border-white/10" />

              <NotchIconButton
                to="/newsletterstudio"
                label="Newsletter Studio"
                isExpanded={isLeftExpanded}
                badge={<span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">NEW</span>}
                onDoubleClick={toggleLeftExpanded}
              >
                <Mail size={16} className="text-red-400" />
              </NotchIconButton>

              <NotchIconButton
                to="/wysiwygstudio"
                label="WYSIWYG Studio"
                isExpanded={isLeftExpanded}
                onDoubleClick={toggleLeftExpanded}
              >
                <FileEdit size={16} className="text-emerald-400" />
              </NotchIconButton>

              <NotchIconButton
                to="/smartlinter"
                label="Smart Linter"
                isExpanded={isLeftExpanded}
                onDoubleClick={toggleLeftExpanded}
              >
                <ShieldCheck size={16} className="text-blue-400" />
              </NotchIconButton>

              <NotchIconButton
                to="/devtools"
                label="Dev Tools"
                isExpanded={isLeftExpanded}
                onDoubleClick={toggleLeftExpanded}
              >
                <Code size={16} className="text-amber-400" />
              </NotchIconButton>

              <div className="w-full my-1 border-t border-white/10" />
            </>
          )}

          {/* 3. Settings */}
          <NotchIconButton
            onClick={() => setIsSettingsOpen(true)}
            onDoubleClick={toggleLeftExpanded}
            isActive={isSettingsOpen}
            label="Einstellungen"
            isExpanded={isLeftExpanded}
            dataName="Einstellungen"
            onMouseEnter={(e) => handleMouseEnterLeft(e, 'Einstellungen')}
            onMouseLeave={handleMouseLeaveLeft}
          >
            <SettingsIcon size={18} />
          </NotchIconButton>

          {/* Expand / Collapse Button */}
          <button
            onClick={toggleLeftExpanded}
            className={`w-full py-1 text-white/50 hover:text-white flex items-center justify-center transition-colors ${
              isLeftExpanded ? 'mt-2 border-t border-white/10 text-xs gap-1 font-semibold' : 'mt-1'
            }`}
            title={isLeftExpanded ? 'Collapse Notch Sidebar' : 'Expand Notch Sidebar (or Double-Click)'}
          >
            {isLeftExpanded ? (
              <>
                <ChevronLeft size={14} />
                <span>Einklappen</span>
              </>
            ) : (
              <ChevronRight size={14} />
            )}
          </button>

        </div>

        {/* Collapsed Tooltip */}
        <AnimatePresence>
          {leftTooltip && !isLeftExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -12, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className="notch-tooltip visible shadow-lg"
              style={{ 
                top: `${leftTooltip.top}px`, 
                transform: 'translateY(-50%)' 
              }}
            >
              {leftTooltip.title}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ================= RECHTE NOTCH (AI ICON WITH EXPAND & RIPPLE) ================= */}
      <div className="notch-sidebar notch-right" ref={rightSidebarRef}>
        <div 
          className={`notch ${isRightExpanded ? 'notch-expanded' : ''}`}
          onDoubleClick={toggleRightExpanded}
          title="Double-click anywhere on notch to expand / collapse"
        >
          {/* Expanded Header Banner */}
          {isRightExpanded && (
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 mb-2 px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Sparkles size={14} className="text-amber-400" />
                <span>YES AI</span>
              </div>
              <button 
                onClick={toggleRightExpanded} 
                className="p-1 hover:bg-white/20 text-white/70 hover:text-white rounded-lg transition-colors"
                title="Collapse AI panel"
              >
                <Minimize2 size={13} />
              </button>
            </div>
          )}

          {/* AI Sparkle Icon Button */}
          <NotchIconButton
            onClick={() => setIsAiOpen(prev => !prev)}
            onDoubleClick={toggleRightExpanded}
            isActive={isAiOpen}
            isAi={true}
            label="YES AI"
            isExpanded={isRightExpanded}
            badge={<span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">READY</span>}
            dataName="YES AI"
            onMouseEnter={(e) => handleMouseEnterRight(e, 'YES AI')}
            onMouseLeave={handleMouseLeaveRight}
          >
            <Sparkles size={18} />
          </NotchIconButton>

          {/* Expand / Collapse Button */}
          <button
            onClick={toggleRightExpanded}
            className={`w-full py-1 text-white/50 hover:text-white flex items-center justify-center transition-colors ${
              isRightExpanded ? 'mt-2 border-t border-white/10 text-xs gap-1 font-semibold' : 'mt-1'
            }`}
            title={isRightExpanded ? 'Collapse Notch Sidebar' : 'Expand Notch Sidebar (or Double-Click)'}
          >
            {isRightExpanded ? (
              <>
                <span>Einklappen</span>
                <ChevronRight size={14} />
              </>
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>

        </div>

        {/* Collapsed Tooltip */}
        <AnimatePresence>
          {rightTooltip && !isRightExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: 12, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className="notch-tooltip visible shadow-lg"
              style={{ 
                top: `${rightTooltip.top}px`, 
                transform: 'translateY(-50%)' 
              }}
            >
              {rightTooltip.title}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Area inside the wrapped frame */}
      <div className="flex-1 w-full h-full min-w-0 overflow-hidden relative">
        <AppRoutes />
      </div>

      <GlobalSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode} 
      />

      <EmbeddedAiSidebar 
        isOpen={isAiOpen} 
        setIsOpen={setIsAiOpen} 
        hideFloatingButton={true} 
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
