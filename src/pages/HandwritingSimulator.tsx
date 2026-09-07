import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Type, History, Eye, X, Plus } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useLocalStorage } from '../hooks/useLocalStorage';

const FONTS = [
  { name: 'Caveat', family: "'Caveat', cursive" },
  { name: 'Dancing Script', family: "'Dancing Script', cursive" },
  { name: 'Pacifico', family: "'Pacifico', cursive" },
  { name: 'Indie Flower', family: "'Indie Flower', cursive" },
  { name: 'Shadows Into Light', family: "'Shadows Into Light', cursive" },
  { name: 'Amatic SC', family: "'Amatic SC', cursive" },
  { name: 'Permanent Marker', family: "'Permanent Marker', cursive" },
  { name: 'Patrick Hand', family: "'Patrick Hand', cursive" },
  { name: 'Handlee', family: "'Handlee', cursive" },
  { name: 'Gochi Hand', family: "'Gochi Hand', cursive" },
  { name: 'Sacramento', family: "'Sacramento', cursive" },
  { name: 'Reenie Beanie', family: "'Reenie Beanie', cursive" },
  { name: 'Kalam', family: "'Kalam', cursive" },
];

interface HandwritingConfig {
  id: string;
  text: string;
  font: string;
  color: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  jitterLevel: number;
  timestamp: number;
}

const JitterText: React.FC<{ text: string; jitterLevel: number }> = ({ text, jitterLevel }) => {
  const getOffset = (index: number, max: number) => {
    const hash = Math.sin(index * 12.9898 + text.length * 78.233) * 43758.5453;
    return (hash - Math.floor(hash)) * max * 2 - max;
  };

  return (
    <>
      {text.split('').map((char, i) => {
        if (char === '\n') return <br key={i} />;
        if (char === ' ') return <span key={i}> </span>;
        
        const yOffset = getOffset(i, jitterLevel);
        const rotation = getOffset(i + 100, jitterLevel * 1.5);
        
        return (
          <span 
            key={i} 
            style={{ 
              display: 'inline-block',
              transform: `translateY(${yOffset}px) rotate(${rotation}deg)` 
            }}
          >
            {char}
          </span>
        );
      })}
    </>
  );
};

export const HandwritingSimulator: React.FC = () => {
  const [text, setText] = useState('Das ist ein simulierter handgeschriebener Text...\n\nProbier es aus!');
  const [selectedFont, setSelectedFont] = useState(FONTS[0].family);
  const [color, setColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [jitterLevel, setJitterLevel] = useState(0);
  
  const [history, setHistory] = useLocalStorage<HandwritingConfig[]>('handwriting-history', []);
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Amatic+SC&family=Caveat&family=Dancing+Script&family=Gochi+Hand&family=Handlee&family=Indie+Flower&family=Kalam&family=Pacifico&family=Patrick+Hand&family=Permanent+Marker&family=Reenie+Beanie&family=Sacramento&family=Shadows+Into+Light&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const saveToHistory = () => {
    const newConfig: HandwritingConfig = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      font: selectedFont,
      color,
      fontSize,
      lineHeight,
      letterSpacing,
      jitterLevel,
      timestamp: Date.now()
    };
    setHistory([newConfig, ...history.slice(0, 19)]);
  };

  const loadFromHistory = (config: HandwritingConfig) => {
    setText(config.text);
    setSelectedFont(config.font);
    setColor(config.color);
    setFontSize(config.fontSize);
    setLineHeight(config.lineHeight);
    setLetterSpacing(config.letterSpacing || 0);
    setJitterLevel(config.jitterLevel || 0);
    setShowHistory(false);
  };

  const exportPDF = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('handwriting.pdf');
      
      saveToHistory();
      setShowPreview(false);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-xl leading-tight text-tg-light-text dark:text-tg-dark-text tracking-tight">Handwriting Simulator</h1>
          <p className="text-[11px] font-mono text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider mt-0.5">Custom Fonts to PDF</p>
        </div>
        <button 
          onClick={() => setShowHistory(true)}
          className="px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-tg-light-text dark:text-tg-dark-text rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <History size={16} /> History
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white dark:bg-[#1E1E1E] border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text mb-4 uppercase tracking-wider flex items-center gap-2">
              <Type size={16} className="text-blue-500" /> Options
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint mb-1">Schriftart (Font)</label>
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm text-tg-light-text dark:text-tg-dark-text outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/10"
                >
                  {FONTS.map(font => (
                    <option key={font.name} value={font.family} style={{ fontFamily: font.family }}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint mb-1">Farbe (Color)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 p-1 bg-black/5 dark:bg-white/5 border-none rounded-xl cursor-pointer"
                  />
                  <span className="text-sm font-mono text-tg-light-text dark:text-tg-dark-text uppercase">{color}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint mb-1 flex justify-between">
                  <span>Schriftgröße</span>
                  <span>{fontSize}px</span>
                </label>
                <input
                  type="range"
                  min="12"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint mb-1 flex justify-between">
                  <span>Zeilenabstand</span>
                  <span>{lineHeight}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint mb-1 flex justify-between">
                  <span>Zeichenabstand (Letter Spacing)</span>
                  <span>{letterSpacing}px</span>
                </label>
                <input
                  type="range"
                  min="-2"
                  max="10"
                  step="0.5"
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint mb-1 flex justify-between">
                  <span>Zittern (Jitter Level)</span>
                  <span>{jitterLevel.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={jitterLevel}
                  onChange={(e) => setJitterLevel(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-8 flex gap-2">
               <button
                  onClick={() => setShowPreview(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-tg-light-text dark:text-tg-dark-text py-3 rounded-2xl font-medium transition-colors"
                >
                  <Eye size={18} /> Preview
                </button>
               <button
                  onClick={exportPDF}
                  disabled={isExporting}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl font-medium transition-colors disabled:opacity-50"
                >
                  <Download size={18} /> Export
                </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#1E1E1E] border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-sm">
             <label className="block text-sm font-semibold text-tg-light-text dark:text-tg-dark-text mb-4 uppercase tracking-wider">Text Eingabe</label>
             <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-64 bg-black/5 dark:bg-white/5 border-none rounded-2xl p-4 text-sm text-tg-light-text dark:text-tg-dark-text outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/10 resize-none custom-scrollbar"
                placeholder="Tippe deinen Text hier ein..."
             />
          </div>
        </div>
        
        <div className="lg:col-span-2">
           <div className="bg-gray-100 dark:bg-[#111111] p-8 rounded-3xl min-h-[600px] flex justify-center overflow-auto custom-scrollbar border border-black/5 dark:border-white/5">
              {/* Paper Preview Container */}
              <div 
                ref={canvasRef}
                className="bg-white w-[595px] min-h-[842px] p-12 shadow-md relative overflow-hidden shrink-0" 
                style={{ 
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
                  backgroundAttachment: 'local',
                  backgroundPosition: '0 0' // align with lines if possible
                }}
              >
                {/* Red margin line simulating notepad */}
                <div className="absolute top-0 bottom-0 left-10 w-0.5 bg-red-400 opacity-50"></div>
                
                <div 
                  className="pl-6 pt-1 break-words"
                  style={{
                    fontFamily: selectedFont,
                    color: color,
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                    letterSpacing: `${letterSpacing}px`,
                  }}
                >
                  {jitterLevel > 0 ? (
                    <JitterText text={text} jitterLevel={jitterLevel} />
                  ) : (
                    text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-black/10 dark:border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-tg-light-text dark:text-tg-dark-text">Saved Projects</h2>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              {history.length === 0 ? (
                <div className="text-center py-12 text-tg-light-hint dark:text-tg-dark-hint">
                  No saved projects yet. Export a PDF to save to history.
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 flex gap-4 items-center justify-between group">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-tg-light-text dark:text-tg-dark-text truncate">
                        {item.text.split('\n')[0] || 'Untitled'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-tg-light-hint dark:text-tg-dark-hint">
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                        <span className="font-mono">{item.font.split(',')[0].replace(/'/g, '')}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => loadFromHistory(item)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Open
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-black/10 dark:border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-tg-light-text dark:text-tg-dark-text">PDF Preview</h2>
              <div className="flex gap-2">
                <button 
                  onClick={exportPDF}
                  disabled={isExporting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Download size={16} /> Export PDF
                </button>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar bg-gray-100 dark:bg-black rounded-2xl p-4 flex justify-center">
              <div 
                className="bg-white shadow-md relative overflow-hidden shrink-0" 
                style={{ 
                  width: '595px',
                  minHeight: '842px',
                  padding: '48px',
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
                  backgroundAttachment: 'local'
                }}
              >
                <div className="absolute top-0 bottom-0 left-10 w-0.5 bg-red-400 opacity-50"></div>
                <div 
                  className="pl-6 pt-1 break-words"
                  style={{
                    fontFamily: selectedFont,
                    color: color,
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                    letterSpacing: `${letterSpacing}px`,
                  }}
                >
                  {jitterLevel > 0 ? (
                    <JitterText text={text} jitterLevel={jitterLevel} />
                  ) : (
                    text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
