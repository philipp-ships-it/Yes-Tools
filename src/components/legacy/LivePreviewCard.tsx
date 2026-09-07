import React, { useRef, useState, useEffect } from 'react';
import { Eye, Maximize, Smartphone, Monitor, PanelRightClose, MousePointer2 } from 'lucide-react';

interface LivePreviewCardProps {
  htmlContent: string;
  onToggle?: () => void;
}

export const LivePreviewCard: React.FC<LivePreviewCardProps> = ({ htmlContent, onToggle }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [inputWidth, setInputWidth] = useState('0');
  const [inputHeight, setInputHeight] = useState('0');
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [inspectedElement, setInspectedElement] = useState<any>(null);
  const [deviceMode, setDeviceMode] = useState('600x800');

  useEffect(() => {
    setInputWidth(dimensions.width.toString());
    setInputHeight(dimensions.height.toString());
  }, [dimensions]);

  const applyDimensions = () => {
    if (!containerRef.current) return;
    const w = parseInt(inputWidth);
    const h = parseInt(inputHeight);
    if (!isNaN(w) && w >= 320) containerRef.current.style.width = `${w}px`;
    if (!isNaN(h) && h >= 200) containerRef.current.style.height = `${h}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyDimensions();
    }
  };

  const setDevice = (w: number, h: number) => {
    if (!containerRef.current) return;
    containerRef.current.style.width = `${w}px`;
    containerRef.current.style.height = `${h}px`;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height)
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Attempt to auto-fit when content changes if in auto-fit mode
    const timer = setTimeout(() => {
      if (deviceMode === 'auto-fit') {
        handleFitContent();
      }
    }, 100); // Short delay to allow rendering
    
    return () => clearTimeout(timer);
  }, [htmlContent, deviceMode]);

  const extractWidth = (html: string): number | null => {
    const attrMatch = html.match(/\bwidth\s*=\s*["']?(\d+)(?:px)?["']?/i);
    if (attrMatch && attrMatch[1]) {
      return parseInt(attrMatch[1], 10);
    }
    const styleMatch = html.match(/\b(?:max-)?width\s*:\s*(\d+)px/i);
    if (styleMatch && styleMatch[1]) {
      return parseInt(styleMatch[1], 10);
    }
    return null;
  };

  const handleFitContent = () => {
    if (!iframeRef.current || !containerRef.current) return;
    
    const explicitWidth = extractWidth(htmlContent);
    
    try {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc && doc.documentElement) {
        // Reset dimensions first to allow shrinking
        containerRef.current.style.width = explicitWidth ? `${explicitWidth}px` : '200px';
        containerRef.current.style.height = '200px';
        
        // Use setTimeout to let the browser recalculate layout after reset
        setTimeout(() => {
          if (!iframeRef.current || !containerRef.current) return;
          const newDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
          if (newDoc && newDoc.documentElement) {
            const scrollWidth = newDoc.documentElement.scrollWidth;
            const scrollHeight = newDoc.documentElement.scrollHeight;
            
            // Only adjust if it's actually measurable and not 0
            if (scrollWidth > 0 && scrollHeight > 0) {
              containerRef.current.style.width = explicitWidth ? `${explicitWidth}px` : `${scrollWidth + 24}px`;
              containerRef.current.style.height = `${scrollHeight + 24}px`;
            }
          }
        }, 50);
      }
    } catch (e) {
      console.error("Could not auto-resize iframe", e);
    }
  };

  const setupInspectMode = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const win = iframe.contentWindow as any;
    if (win._inspectListeners) {
      doc.removeEventListener('mousemove', win._inspectListeners.move);
      doc.removeEventListener('mouseleave', win._inspectListeners.leave);
      doc.removeEventListener('click', win._inspectListeners.click, true);
      doc.removeEventListener('scroll', win._inspectListeners.scroll);
    }

    const existingOverlay = doc.getElementById('inspect-highlight-overlay');
    if (existingOverlay) existingOverlay.remove();

    if (!isInspectMode) {
      setInspectedElement(null);
      return;
    }

    const overlay = doc.createElement('div');
    overlay.id = 'inspect-highlight-overlay';
    overlay.style.position = 'fixed';
    overlay.style.pointerEvents = 'none';
    overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
    overlay.style.border = '1px solid rgb(59, 130, 246)';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'none';
    overlay.style.transition = 'all 0.05s linear';
    doc.body.appendChild(overlay);

    const updateOverlay = (target: HTMLElement) => {
      if (!target || target === doc.body || target === doc.documentElement) {
        overlay.style.display = 'none';
        setInspectedElement(null);
        return;
      }
      
      const rect = target.getBoundingClientRect();
      const computedStyle = win.getComputedStyle(target);
      
      overlay.style.display = 'block';
      overlay.style.top = `${rect.top}px`;
      overlay.style.left = `${rect.left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;

      const iframeRect = iframe.getBoundingClientRect();
      
      setInspectedElement({
        tagName: target.tagName.toLowerCase(),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        font: computedStyle.fontFamily.split(',')[0].replace(/"/g, ''),
        fontSize: computedStyle.fontSize,
        name: target.getAttribute('aria-label') || target.getAttribute('name') || target.textContent?.slice(0, 20).trim() || '',
        role: target.getAttribute('role') || '',
        focusable: target.tabIndex >= 0 || ['a', 'button', 'input', 'select', 'textarea'].includes(target.tagName.toLowerCase()),
        tooltipTop: iframeRect.top + rect.bottom,
        tooltipLeft: iframeRect.left + rect.left,
      });
    };

    let currentTarget: HTMLElement | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target !== currentTarget) {
        currentTarget = target;
        updateOverlay(target);
      }
    };

    const handleMouseLeave = () => {
      currentTarget = null;
      overlay.style.display = 'none';
      setInspectedElement(null);
    };

    const handleScroll = () => {
      if (currentTarget) {
        updateOverlay(currentTarget);
      }
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    win._inspectListeners = {
      move: handleMouseMove,
      leave: handleMouseLeave,
      click: handleClick,
      scroll: handleScroll
    };

    doc.addEventListener('mousemove', handleMouseMove);
    doc.addEventListener('mouseleave', handleMouseLeave);
    doc.addEventListener('click', handleClick, true);
    doc.addEventListener('scroll', handleScroll, true);
  };

  useEffect(() => {
    setupInspectMode();
  }, [isInspectMode, htmlContent]);

  const handleIframeLoad = () => {
    setupInspectMode();
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl shadow-soft overflow-hidden transition-colors duration-200 border border-tg-light-border dark:border-tg-dark-border relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-tg-light-border dark:border-tg-dark-border bg-tg-light-secondary/30 dark:bg-tg-dark-secondary/30">
        <div className="flex items-center gap-2 text-tg-light-text dark:text-tg-dark-text font-medium text-sm">
          <Eye size={16} className="text-tg-light-primary dark:text-tg-dark-primary opacity-80" />
          <span>Live Preview</span>
        </div>
        
        {/* Dimension Measure & Device Simulation Tool */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center border-r border-tg-light-border dark:border-tg-dark-border pr-1 sm:pr-2 mr-1 sm:mr-0">
            <select
              className="text-xs bg-transparent border border-tg-light-border dark:border-tg-dark-border rounded px-2 py-1 text-tg-light-text dark:text-tg-dark-text outline-none focus:border-tg-light-primary dark:focus:border-tg-dark-primary mr-2"
              onChange={(e) => {
                const val = e.target.value;
                setDeviceMode(val);
                if (val === 'responsive') {
                  setDevice(1024, 768); // Default responsive size
                } else if (val === 'auto-fit') {
                  handleFitContent();
                } else {
                  const [w, h] = val.split('x').map(Number);
                  setDevice(w, h);
                }
              }}
              value={deviceMode}
            >
              <option value="600x800">Default (600px)</option>
              <option value="auto-fit">Auto-fit</option>
              <option value="responsive">Responsive</option>
              <optgroup label="Mobile">
                <option value="320x568">iPhone SE (320x568)</option>
                <option value="375x667">iPhone 8 (375x667)</option>
                <option value="390x844">iPhone 12/13 (390x844)</option>
                <option value="414x896">iPhone XR (414x896)</option>
                <option value="360x800">Android Small (360x800)</option>
                <option value="412x915">Android Large (412x915)</option>
              </optgroup>
              <optgroup label="Tablet">
                <option value="768x1024">iPad Mini (768x1024)</option>
                <option value="820x1180">iPad Air (820x1180)</option>
                <option value="1024x1366">iPad Pro (1024x1366)</option>
              </optgroup>
              <optgroup label="Desktop">
                <option value="1280x720">720p (1280x720)</option>
                <option value="1440x900">Laptop (1440x900)</option>
                <option value="1920x1080">1080p (1920x1080)</option>
              </optgroup>
            </select>
            <button 
              onClick={() => setIsInspectMode(!isInspectMode)}
              title="Inspect Element"
              className={`p-1.5 rounded-md transition-colors ${isInspectMode ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover text-tg-light-hint dark:text-tg-dark-hint'}`}
            >
              <MousePointer2 size={14} />
            </button>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono text-tg-light-text dark:text-tg-dark-text bg-tg-light-surface dark:bg-tg-dark-surface px-2 py-1 rounded border border-tg-light-border dark:border-tg-dark-border shadow-sm focus-within:border-tg-light-primary dark:focus-within:border-tg-dark-primary transition-colors">
            <Maximize size={12} className="text-tg-light-hint dark:text-tg-dark-hint hidden sm:block mr-1" />
            <input 
              type="number" 
              value={inputWidth}
              onChange={(e) => setInputWidth(e.target.value)}
              onBlur={applyDimensions}
              onKeyDown={handleKeyDown}
              className="w-8 sm:w-10 bg-transparent border-none outline-none text-right appearance-none m-0 p-0 [&::-webkit-inner-spin-button]:appearance-none"
              title="Width (px)"
            />
            <span className="text-tg-light-hint">px</span>
            <span className="mx-1 text-tg-light-hint">&times;</span>
            <input 
              type="number" 
              value={inputHeight}
              onChange={(e) => setInputHeight(e.target.value)}
              onBlur={applyDimensions}
              onKeyDown={handleKeyDown}
              className="w-8 sm:w-10 bg-transparent border-none outline-none text-right appearance-none m-0 p-0 [&::-webkit-inner-spin-button]:appearance-none"
              title="Height (px)"
            />
            <span className="text-tg-light-hint">px</span>
          </div>
          {onToggle && (
            <button 
              onClick={onToggle}
              title="Collapse Preview"
              className="ml-1 p-1.5 rounded-md hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover text-tg-light-hint dark:text-tg-dark-hint transition-colors"
            >
              <PanelRightClose size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 relative bg-checkerboard overflow-auto p-2 sm:p-4 flex items-start justify-start custom-scrollbar">
        {/* Resizable Container */}
        <div 
          ref={containerRef}
          className="bg-transparent border border-dashed border-gray-300 dark:border-gray-500 shadow-sm relative flex flex-col transition-all duration-300 ease-out"
          style={{ 
            resize: 'both', 
            overflow: 'hidden', 
            width: '600px', 
            height: '800px', 
            minWidth: '320px', 
            minHeight: '200px',
            paddingBottom: '12px', // space for resize handle
            paddingRight: '12px'
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            onLoad={handleIframeLoad}
            className="flex-1 w-full border-none bg-transparent"
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin"
          />
          {/* Resize Handle Indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize opacity-50 pointer-events-none" 
               style={{
                 background: 'linear-gradient(135deg, transparent 50%, #888 50%)'
               }} 
          />
        </div>
      </div>

      {inspectedElement && isInspectMode && (
        <div 
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md p-3 text-xs pointer-events-none text-gray-800 dark:text-gray-200"
          style={{
            top: `${inspectedElement.tooltipTop + 10}px`,
            left: `${inspectedElement.tooltipLeft}px`,
            transform: 'translate(0, 0)',
          }}
        >
          <div className="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-700 pb-1 gap-4">
            <span className="font-bold text-purple-600 dark:text-purple-400">{inspectedElement.tagName}</span>
            <span className="text-gray-500 dark:text-gray-400">{inspectedElement.width} × {inspectedElement.height}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-center">
            <span className="text-gray-500 dark:text-gray-400">Color</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm border border-gray-200" style={{ backgroundColor: inspectedElement.color }}></div>
              <span className="font-mono">{inspectedElement.color}</span>
            </div>
            
            <span className="text-gray-500 dark:text-gray-400">Bg</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm border border-gray-200" style={{ backgroundColor: inspectedElement.backgroundColor }}></div>
              <span className="font-mono">{inspectedElement.backgroundColor}</span>
            </div>

            <span className="text-gray-500 dark:text-gray-400">Font</span>
            <span className="truncate max-w-[150px]">{inspectedElement.fontSize} {inspectedElement.font}</span>
            
            <div className="col-span-2 mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Accessibility</span>
            </div>
            
            <span className="text-gray-500 dark:text-gray-400">Name</span>
            <span className="truncate max-w-[150px]">{inspectedElement.name || '-'}</span>
            
            <span className="text-gray-500 dark:text-gray-400">Role</span>
            <span>{inspectedElement.role || '-'}</span>
            
            <span className="text-gray-500 dark:text-gray-400">Focusable</span>
            <span>{inspectedElement.focusable ? '✅' : '❌'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
