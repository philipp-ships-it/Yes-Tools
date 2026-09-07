import React, { useState, useEffect } from 'react';
import { useToolTracking } from '../hooks/useToolTracking';
import { Copy, Code2, Paintbrush, ArrowRight, Check, Undo2 } from 'lucide-react';

export const SvgTool: React.FC = () => {
  useToolTracking('SVG Optimizer');
  const [history, setHistory] = useState<string[]>([]);
  const [inputSvg, setInputSvg] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'jsx' | 'minify'>('jsx');
  const [copied, setCopied] = useState(false);

  const processSvg = (svg: string, processMode: 'jsx' | 'minify') => {
    if (!svg.trim()) return '';

    // Basic minification: remove comments, newlines, and extra spaces
    let processed = svg
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (processMode === 'jsx') {
      // Convert to JSX
      processed = processed
        .replace(/class=/g, 'className=')
        .replace(/for=/g, 'htmlFor=')
        .replace(/xmlns:xlink=/g, 'xmlnsXlink=')
        .replace(/xml:space=/g, 'xmlSpace=');

      // Convert kebab-case attributes to camelCase
      const kebabAttributes = [
        'fill-rule', 'clip-rule', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
        'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity',
        'fill-opacity', 'stop-color', 'stop-opacity', 'font-family', 'font-size',
        'font-weight', 'text-anchor', 'alignment-baseline', 'dominant-baseline',
        'vector-effect', 'color-interpolation-filters', 'feColorMatrix', 'feMerge',
        'feMergeNode', 'feOffset', 'feGaussianBlur', 'feComposite', 'feFlood', 'feDropShadow'
      ];

      kebabAttributes.forEach(attr => {
        // Need a robust replace that only targets attributes, but a simple replace is often enough for standard SVGs
        const camelAttr = attr.replace(/-([a-z])/g, g => g[1].toUpperCase());
        // Simple string replace for attribute names
        const regex = new RegExp(`\\b${attr}=`, 'gi');
        processed = processed.replace(regex, `${camelAttr}=`);
      });

      // Special case for SVG tag to wrap in a React Component if desired, but returning just the JSX block is fine
    }

    return processed;
  };

  useEffect(() => {
    setOutput(processSvg(inputSvg, mode));
  }, [inputSvg, mode]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-xl leading-tight text-tg-light-text dark:text-tg-dark-text tracking-tight">SVG Optimizer & React-Converter</h1>
          <p className="text-[11px] font-mono text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider mt-0.5">Clean & Convert SVG to JSX</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-4 shadow-xl h-full">
            <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text uppercase tracking-wider">
              Input SVG
            </h2>
            <button 
                onClick={() => {
                  if (history.length > 0) {
                    setInputSvg(history[0]);
                    setHistory(prev => prev.slice(1));
                  }
                }}
                disabled={history.length === 0}
                className={`p-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${history.length > 0 ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-tg-light-hint dark:text-tg-dark-hint opacity-50'}`}
              >
                <Undo2 size={14} /> Undo
              </button>
            </div>
            <textarea
              value={inputSvg}
              onChange={(e) => {
                const val = e.target.value;
                if (Math.abs(val.length - inputSvg.length) > 10) {
                    setHistory(prev => [inputSvg, ...prev].slice(0, 5));
                }
                setInputSvg(e.target.value);
              }}
              placeholder="<svg>...</svg>"
              className="flex-1 w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-mono text-tg-light-text dark:text-tg-dark-text outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/10 resize-none custom-scrollbar"
            />
          </div>
        </div>

        <div className="flex lg:flex-col items-center justify-center gap-4 lg:px-2">
           <ArrowRight className="hidden lg:block text-tg-light-hint dark:text-tg-dark-hint opacity-50" />
        </div>

        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-4 shadow-xl h-full">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-2">
              <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                <button
                  onClick={() => setMode('jsx')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'jsx' 
                      ? 'bg-white dark:bg-[#2A2A2A] text-blue-500 shadow-sm' 
                      : 'text-tg-light-hint dark:text-tg-dark-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                  }`}
                >
                  React (JSX)
                </button>
                <button
                  onClick={() => setMode('minify')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'minify' 
                      ? 'bg-white dark:bg-[#2A2A2A] text-blue-500 shadow-sm' 
                      : 'text-tg-light-hint dark:text-tg-dark-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                  }`}
                >
                  Minified SVG
                </button>
              </div>
              <button 
                onClick={copyToClipboard}
                disabled={!output}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />} 
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            </div>
            
            <textarea
              value={output}
              readOnly
              placeholder="Output will appear here..."
              className="flex-1 w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-mono text-tg-light-text dark:text-tg-dark-text outline-none resize-none custom-scrollbar"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
