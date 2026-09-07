import React, { useState, useEffect, useRef } from 'react';
import Hypher from 'hypher';
import germanPatterns from 'hyphenation.de';
import { Type, Copy, Info, Zap } from 'lucide-react';

// @ts-ignore
const hypher = new Hypher(germanPatterns);

export const ShyTool: React.FC = () => {
  const [text, setText] = useState('<p>Das ist ein Test mit der Donau-Dampfschifffahrtsgesellschaft in einem HTML-Block.</p>');
  const [width, setWidth] = useState(400);
  const [hyphenatedCode, setHyphenatedCode] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const measureTextWidth = (text: string, font: string): number => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.font = font;
      return context.measureText(text).width;
    }
    return text.length * 8; // Fallback approximation
  };

  const optimizeForWidth = () => {
    setIsOptimizing(true);
    
    // Simulate DOM parsing to extract text nodes while keeping HTML structure
    const div = document.createElement('div');
    div.innerHTML = text;
    
    const font = '16px Inter, system-ui, sans-serif'; // Match preview font
    let currentX = 0;
    const padding = 48; // p-6 is 24px * 2 = 48px padding in the preview container
    const maxLineWidth = width - padding;

    // Recursive function to process nodes
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.nodeValue || '';
        const words = textContent.split(/(\s+)/);
        let newText = '';

        for (const word of words) {
          if (word.trim().length === 0) {
            const spaceWidth = measureTextWidth(word, font);
            currentX += spaceWidth;
            newText += word;
            continue;
          }

          const wordWidth = measureTextWidth(word, font);
          
          if (currentX + wordWidth > maxLineWidth) {
            // Word wraps. Can we hyphenate?
            const syllables = hypher.hyphenate(word);
            let fits = false;
            let currentSyllableBuild = '';
            
            if (syllables.length > 1) {
              for (let i = 0; i < syllables.length - 1; i++) {
                const testStr = currentSyllableBuild + syllables[i] + '-';
                const testWidth = measureTextWidth(testStr, font);
                
                if (currentX + testWidth <= maxLineWidth) {
                  currentSyllableBuild += syllables[i];
                  fits = true;
                } else {
                  break;
                }
              }
            }

            if (fits && currentSyllableBuild.length > 0) {
              // We can fit a part of the word on this line
              const remainingWord = word.substring(currentSyllableBuild.length);
              newText += currentSyllableBuild + '&shy;' + remainingWord;
              // The line breaks after the hyphen
              const remainingWidth = measureTextWidth(remainingWord, font);
              currentX = remainingWidth;
            } else {
              // Doesn't fit at all, moves to next line
              newText += word;
              currentX = wordWidth;
            }
          } else {
            // Fits entirely on current line
            newText += word;
            currentX += wordWidth;
          }
        }
        node.nodeValue = '___TEMP_PLACEHOLDER___'; 
        // We can't insert &shy; directly as textNode value because it will escape it as &amp;shy;
        // We'll replace it in the outer HTML later.
        return newText;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Block level elements reset the X position (simplified assumption)
        const blockTags = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BR', 'TABLE', 'TR'];
        if (blockTags.includes(node.nodeName)) {
          currentX = 0;
        }
        
        const placeholders: string[] = [];
        Array.from(node.childNodes).forEach(child => {
          const res = processNode(child);
          if (res) {
            if (Array.isArray(res)) placeholders.push(...res);
            else placeholders.push(res);
          }
        });
        
        return placeholders;
      }
      return null;
    };

    const replacements: string[] = [];
    Array.from(div.childNodes).forEach(child => {
       const res = processNode(child);
       const flatten = (arr: any): void => {
         if (Array.isArray(arr)) arr.forEach(flatten);
         else if (arr) replacements.push(arr);
       }
       flatten(res);
    });

    let finalHtml = div.innerHTML;
    replacements.forEach(replacement => {
      finalHtml = finalHtml.replace('___TEMP_PLACEHOLDER___', replacement);
    });

    setHyphenatedCode(finalHtml);
    setPreviewHtml(finalHtml); // Browser renders &shy; automatically
    setIsOptimizing(false);
  };

  useEffect(() => {
    optimizeForWidth();
  }, [text, width]);

  const copyCode = () => {
    navigator.clipboard.writeText(hyphenatedCode);
  };

  return (
    <div className="h-full w-full p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
            <Type size={20} />
          </div>
          <div>
            <h1 className="font-bold text-2xl leading-tight text-tg-light-text dark:text-tg-dark-text">Smart Shy Tool</h1>
            <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">Automatically inject soft hyphens (&amp;shy;) at German syllable boundaries and test responsiveness.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left Column: Input and Code */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#1E1E1E] border border-black/5 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-4 shadow-sm h-1/2">
            <h2 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text mb-2 uppercase tracking-wider">
              Input Text / HTML
            </h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste text or HTML here..."
              className="flex-1 w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl p-4 text-sm text-tg-light-text dark:text-tg-dark-text outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/10 resize-none custom-scrollbar"
            />
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] border border-black/5 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-4 shadow-sm h-1/2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text uppercase tracking-wider">
                Output HTML
              </h2>
              <button 
                onClick={copyCode}
                className="px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-tg-light-text dark:text-tg-dark-text rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Copy size={16} /> Copy
              </button>
            </div>
            <textarea
              value={hyphenatedCode}
              readOnly
              className="flex-1 w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-mono text-tg-light-hint dark:text-tg-dark-hint outline-none resize-none custom-scrollbar"
            />
          </div>
        </div>

        {/* Right Column: Responsive Preview */}
        <div className="w-full lg:w-1/2 bg-white dark:bg-[#1E1E1E] border border-black/5 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-6 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text uppercase tracking-wider flex items-center gap-2">
              Responsive Preview {isOptimizing && <Zap size={16} className="text-blue-500 animate-pulse" />}
            </h2>
            <div className="text-sm font-mono bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl text-tg-light-text dark:text-tg-dark-text">
              Width: {width}px
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl">
            <span className="text-sm font-medium text-tg-light-hint dark:text-tg-dark-hint min-w-[40px]">200px</span>
            <input 
              type="range" 
              min="200" 
              max="800" 
              value={width} 
              onChange={(e) => setWidth(Number(e.target.value))}
              className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-sm font-medium text-tg-light-hint dark:text-tg-dark-hint min-w-[40px]">800px</span>
          </div>
          
          <div className="flex items-start gap-3 text-xs text-tg-light-text dark:text-tg-dark-text bg-blue-500/10 p-4 rounded-2xl">
            <Info size={18} className="shrink-0 text-blue-500 mt-0.5" />
            <p className="leading-relaxed">Drag the slider to test how the text wraps. Soft hyphens are perfectly optimized for this specific container width. Only necessary hyphens are inserted.</p>
          </div>

          <div className="flex-1 bg-gray-50 dark:bg-[#111111] rounded-2xl overflow-hidden relative flex justify-center items-start pt-8 border border-black/5 dark:border-white/5">
            {/* The draggable container */}
            <div 
              className="bg-white dark:bg-[#1A1A1A] shadow-xl border border-black/10 dark:border-white/5 transition-all duration-75 overflow-hidden flex flex-col rounded-t-xl"
              style={{ width: `${width}px`, minHeight: '60%' }}
            >
              <div className="bg-black/5 dark:bg-white/5 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div 
                className="p-6 text-base leading-relaxed break-words text-black dark:text-white"
                style={{ hyphens: 'manual', fontFamily: 'Inter, system-ui, sans-serif' }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
