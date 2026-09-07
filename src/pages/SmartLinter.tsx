import React, { useState, useCallback, useEffect } from 'react';
import { Play, Code2, AlertTriangle, CheckCircle2, Copy, Check, Upload, Undo2, LayoutTemplate, Bug, Search } from 'lucide-react';
import htmlBeautify from 'js-beautify/js/lib/beautify-html.js';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useDropzone } from 'react-dropzone';
import { ChangeRequestModal, ChangeRequestItem } from '../components/ChangeRequestModal';

export const SmartLinter: React.FC = () => {
  const [inputCode, setInputCode] = useState('<!DOCTYPE html>\n<html>\n<head>\n  <title>Test</title>\n  <style>\n    .card { padding: 20px; }\n    .unused { color: red; }\n    .above-fold { display: block; }\n  </style>\n</head>\n<body>\n  <div class="card above-fold">\n    <h1 class="title">Hello</h1>\n    <img src="test.jpg">\n    <script>\n      console.log("Debug");\n      setInterval(() => { console.log("Leak") }, 1000);\n    </script>\n  </div>\n</body>\n</html>');
  
  const [history, setHistory] = useState<string[]>([]);
  
  const [outputCode, setOutputCode] = useState('');
  const [activeTab, setActiveTab] = useState<'input' | 'diff' | 'critical-css' | 'js-debug'>('input');

  // Change Request Safeguard Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    items: ChangeRequestItem[];
    finalHtml: string;
    newReports: {type: 'info' | 'success' | 'warning' | 'error', message: string}[];
    extractedCriticalCss: string;
    foundJsIssues: {line: number, message: string}[];
  } | null>(null);
  
  const [options, setOptions] = useState({
    cleanCss: true,
    a11yAudit: true,
    formatCode: true,
    checkDeps: true,
    seoAudit: true
  });
  
  const [reports, setReports] = useState<{type: 'info' | 'success' | 'warning' | 'error', message: string}[]>([]);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [criticalCss, setCriticalCss] = useState('');
  const [jsIssues, setJsIssues] = useState<{line: number, message: string}[]>([]);

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          updateInputCode(e.target.result as string);
          setActiveTab('input');
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/html': ['.html'] }
  });
  
  const updateInputCode = (newVal: string) => {
    setHistory(prev => {
      const newHistory = [inputCode, ...prev].slice(0, 5); // Keep last 5
      return newHistory;
    });
    setInputCode(newVal);
  };
  
  const handleUndo = () => {
    if (history.length > 0) {
      const previous = history[0];
      setHistory(prev => prev.slice(1));
      setInputCode(previous);
      setOutputCode(''); // Reset diff
      setReports([]);
    }
  };

  const analyzeJS = (scriptContent: string, offsetLine: number) => {
    const issues: typeof jsIssues = [];
    try {
      const ast = acorn.parse(scriptContent, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
      walk.simple(ast, {
        CallExpression(node: any) {
          if (node.callee.type === 'MemberExpression' && node.callee.object.name === 'console') {
            issues.push({
              line: (node.loc?.start.line || 1) + offsetLine,
              message: `Console statement found (${node.callee.property.name}) - should be removed in production.`
            });
          }
          if (node.callee.type === 'Identifier' && node.callee.name === 'setInterval') {
            issues.push({
              line: (node.loc?.start.line || 1) + offsetLine,
              message: `setInterval used - ensure clearInterval is called to prevent memory leaks.`
            });
          }
          if (node.callee.type === 'Identifier' && node.callee.name === 'eval') {
            issues.push({
              line: (node.loc?.start.line || 1) + offsetLine,
              message: `eval() used - dangerous and bad for performance.`
            });
          }
        }
      });
    } catch (e: any) {
      issues.push({ line: offsetLine, message: `Parse Error: ${e.message}` });
    }
    return issues;
  };

  const processCode = () => {
    const newReports: typeof reports = [];
    let currentHtml = inputCode;
    let extractedCriticalCss = '';
    let foundJsIssues: typeof jsIssues = [];
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(currentHtml, 'text/html');
      
      // 1. Dependency Check & JS Debugger
      if (options.checkDeps || true) {
        let scriptLineOffset = 1;
        const lines = currentHtml.split('\n');
        
        const scripts = doc.querySelectorAll('script');
        scripts.forEach((script, idx) => {
          if (script.src) {
            newReports.push({ type: 'info', message: `External script found: ${script.src}` });
          } else if (script.textContent) {
            // Very naive line offset estimation
            const scriptTagIndex = lines.findIndex(l => l.includes('<script') && l.includes(script.textContent!.split('\n')[1]?.trim() || 'XYZ'));
            const offset = scriptTagIndex > -1 ? scriptTagIndex : 1;
            
            const issues = analyzeJS(script.textContent, offset);
            foundJsIssues = [...foundJsIssues, ...issues];
            
            if (script.type === 'module') {
              try {
                const ast = acorn.parse(script.textContent, { ecmaVersion: 'latest', sourceType: 'module' });
                const imports: string[] = [];
                walk.simple(ast, {
                  ImportDeclaration(node: any) {
                    node.specifiers.forEach((spec: any) => {
                      imports.push(spec.local.name);
                    });
                  }
                });
                
                const unusedImports = imports.filter(imp => {
                  let count = 0;
                  walk.simple(ast, {
                    Identifier(node: any) {
                      if (node.name === imp) count++;
                    }
                  });
                  return count <= 1; 
                });
                
                if (unusedImports.length > 0) {
                  newReports.push({ type: 'warning', message: `Unused imports found in script #${idx + 1}: ${unusedImports.join(', ')}` });
                }
              } catch (e) {}
            }
          }
        });
      }

      // 2. SEO Meta Analyzer
      if (options.seoAudit) {
        const title = doc.querySelector('title')?.textContent || '';
        if (!title) {
          newReports.push({ type: 'error', message: 'Missing <title> tag.' });
          const titleEl = doc.createElement('title');
          titleEl.textContent = 'Document Title';
          doc.head.appendChild(titleEl);
        } else if (title.length < 10 || title.length > 60) {
          newReports.push({ type: 'warning', message: `Title length (${title.length}) is not optimal (10-60 characters).` });
        }
        
        const desc = doc.querySelector('meta[name="description"]');
        if (!desc) {
          newReports.push({ type: 'error', message: 'Missing meta description.' });
          const metaEl = doc.createElement('meta');
          metaEl.setAttribute('name', 'description');
          metaEl.setAttribute('content', 'Page description');
          doc.head.appendChild(metaEl);
        } else {
          const content = desc.getAttribute('content') || '';
          if (content.length < 50 || content.length > 160) {
             newReports.push({ type: 'warning', message: `Meta description length (${content.length}) is not optimal (50-160 chars).` });
          }
        }
        
        const ogTitle = doc.querySelector('meta[property="og:title"]');
        if (!ogTitle) newReports.push({ type: 'info', message: 'Missing og:title Open Graph tag.' });
        
        const canonical = doc.querySelector('link[rel="canonical"]');
        if (!canonical) newReports.push({ type: 'info', message: 'Missing canonical link.' });
      }

      // 3. A11y Audit
      if (options.a11yAudit) {
        let a11yFixes = 0;
        doc.querySelectorAll('img:not([alt])').forEach(img => {
          img.setAttribute('alt', 'Image description');
          a11yFixes++;
        });
        
        doc.querySelectorAll('a:not([aria-label]):not([title])').forEach(a => {
          if (!a.textContent?.trim() && a.children.length === 0) {
            a.setAttribute('aria-label', 'Link');
            a11yFixes++;
          }
        });
        
        doc.querySelectorAll('button:not([aria-label])').forEach(btn => {
          if (!btn.textContent?.trim() && btn.children.length === 0) {
            btn.setAttribute('aria-label', 'Button');
            a11yFixes++;
          }
        });

        doc.querySelectorAll('input:not([id]):not([aria-label])').forEach(input => {
          input.setAttribute('aria-label', 'Input field');
          a11yFixes++;
        });

        if (a11yFixes > 0) {
          newReports.push({ type: 'success', message: `Automatically fixed ${a11yFixes} accessibility issue(s).` });
        }
      }

      // 4. Clean Unused CSS & Critical CSS Extraction
      if (options.cleanCss) {
        const styles = doc.querySelectorAll('style');
        let removedCount = 0;
        
        styles.forEach((styleTag, idx) => {
          if (!styleTag.textContent) return;
          
          const tempStyle = document.createElement('style');
          tempStyle.textContent = styleTag.textContent;
          document.head.appendChild(tempStyle);
          
          let cleanedCss = '';
          try {
            const sheet = tempStyle.sheet as CSSStyleSheet;
            if (sheet) {
              for (let i = 0; i < sheet.cssRules.length; i++) {
                const rule = sheet.cssRules[i];
                if (rule instanceof CSSStyleRule) {
                  const selectors = rule.selectorText.split(',').map(s => s.trim());
                  const validSelectors = selectors.filter(selector => {
                    try {
                      const cleanSelector = selector.replace(/::?[a-zA-Z0-9_-]+(\([^)]+\))?/g, '').trim();
                      if (!cleanSelector || cleanSelector === '*') return true;
                      const baseSelector = cleanSelector.split(':')[0];
                      const matches = doc.querySelectorAll(baseSelector);
                      if (matches.length === 0) {
                        removedCount++;
                        return false;
                      }
                      
                      // Critical CSS heuristic: assume anything above the fold has class "above-fold" or is body/header
                      const isAboveFold = Array.from(matches).some(m => 
                         m.tagName === 'BODY' || m.tagName === 'HEADER' || m.tagName === 'H1' || m.classList.contains('above-fold')
                      );
                      if (isAboveFold) {
                         extractedCriticalCss += `${selector} { ${rule.style.cssText} }\n`;
                      }
                      
                      return true;
                    } catch (e) {
                      return true;
                    }
                  });
                  
                  if (validSelectors.length > 0) {
                    if (validSelectors.length !== selectors.length) {
                      const bodyMatch = rule.cssText.match(/\{([\s\S]*)\}/);
                      if (bodyMatch) {
                        cleanedCss += `${validSelectors.join(', ')} {${bodyMatch[1]}}\n`;
                      }
                    } else {
                      cleanedCss += `${rule.cssText}\n`;
                    }
                  }
                } else {
                  cleanedCss += `${rule.cssText}\n`;
                }
              }
            }
          } catch (e) {
            newReports.push({ type: 'error', message: `Error parsing stylesheet #${idx + 1}` });
          } finally {
            document.head.removeChild(tempStyle);
          }
          
          if (cleanedCss) {
            styleTag.textContent = cleanedCss;
          }
        });
        
        if (removedCount > 0) {
          newReports.push({ type: 'success', message: `Removed ${removedCount} unused CSS selector(s).` });
        }
      }

      let finalHtml = '';
      if (inputCode.toLowerCase().includes('<html')) {
        finalHtml = doc.documentElement.outerHTML;
        if (!finalHtml.toLowerCase().startsWith('<!doctype')) {
            finalHtml = '<!DOCTYPE html>\n' + finalHtml;
        }
      } else if (inputCode.toLowerCase().includes('<body')) {
        finalHtml = doc.body.outerHTML;
      } else {
        finalHtml = doc.body.innerHTML;
      }

      if (options.formatCode) {
        finalHtml = htmlBeautify.html_beautify(finalHtml, { 
          indent_size: 2,
          indent_scripts: 'keep',
          preserve_newlines: false
        });
        newReports.push({ type: 'success', message: 'Code beautified and standardized.' });
      }

      // Build planned items checklist for ChangeRequestModal
      const changeItems: ChangeRequestItem[] = [];
      newReports.forEach((rep, idx) => {
        changeItems.push({
          id: `lint_report_${idx}`,
          type: rep.type === 'error' ? 'deletion' : rep.type === 'success' ? 'modification' : 'injection',
          title: `Linter Operation #${idx + 1}: ${rep.type.toUpperCase()}`,
          description: rep.message,
          beforeSnippet: inputCode.slice(0, 200) + '...',
          afterSnippet: finalHtml.slice(0, 200) + '...'
        });
      });

      if (changeItems.length > 0) {
        setPendingChanges({
          items: changeItems,
          finalHtml,
          newReports,
          extractedCriticalCss,
          foundJsIssues
        });
        setIsModalOpen(true);
      } else {
        setCriticalCss(extractedCriticalCss);
        setJsIssues(foundJsIssues);
        setOutputCode(finalHtml);
        setActiveTab('diff');
        setReports(newReports);
      }

    } catch (err: any) {
      newReports.push({ type: 'error', message: `Processing failed: ${err.message}` });
      setReports(newReports);
    }
  };

  const handleConfirmModal = (selectedIds: string[]) => {
    if (!pendingChanges) return;
    setCriticalCss(pendingChanges.extractedCriticalCss);
    setJsIssues(pendingChanges.foundJsIssues);
    setOutputCode(pendingChanges.finalHtml);
    setActiveTab('diff');
    setReports(pendingChanges.newReports.filter((_, idx) => selectedIds.includes(`lint_report_${idx}`)));
    setIsModalOpen(false);
  };

  const handleApplyDiff = () => {
      updateInputCode(outputCode);
      setActiveTab('input');
      setOutputCode('');
      setReports([{type: 'success', message: 'Bulk fixes applied successfully!'}]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col p-6 animate-fade-in bg-tg-light-bg dark:bg-tg-dark-bg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500 dark:bg-cyan-600 flex items-center justify-center text-white shadow-lg shrink-0">
          <Code2 size={24} />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-tg-light-text dark:text-tg-dark-text">Smart Linter & Optimizer</h1>
          <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">
            Upload or paste HTML files to clean unused CSS, lint JS, fix SEO & A11y, and extract Critical CSS.
          </p>
        </div>
        
        <button 
          onClick={handleUndo}
          disabled={history.length === 0}
          className={`px-4 py-2 flex items-center gap-2 rounded-xl text-sm font-medium transition-colors ${
            history.length > 0 
              ? 'bg-tg-light-surface dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text border border-tg-light-border dark:border-tg-dark-border hover:bg-black/5 dark:hover:bg-white/5 shadow-sm'
              : 'bg-transparent text-tg-light-hint dark:text-tg-dark-hint opacity-50 cursor-not-allowed'
          }`}
        >
          <Undo2 size={16} />
          Undo ({history.length})
        </button>
      </div>

      {reports.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar">
          {reports.map((report, i) => (
            <div key={i} className={`flex items-start gap-2 text-sm ${
              report.type === 'error' ? 'text-red-500' :
              report.type === 'warning' ? 'text-orange-500' :
              report.type === 'success' ? 'text-emerald-500' : 'text-blue-500'
            }`}>
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{report.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-2">
        <button
          onClick={() => setActiveTab('input')}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'input' 
              ? 'bg-cyan-500 text-white shadow-md' 
              : 'bg-tg-light-surface dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Input & Settings
        </button>
        <button
          onClick={() => setActiveTab('diff')}
          disabled={!outputCode}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'diff' 
              ? 'bg-cyan-500 text-white shadow-md' 
              : 'bg-tg-light-surface dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          Diff Viewer
        </button>
        <button
          onClick={() => setActiveTab('critical-css')}
          disabled={!criticalCss}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'critical-css' 
              ? 'bg-cyan-500 text-white shadow-md' 
              : 'bg-tg-light-surface dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          <LayoutTemplate size={16} />
          Critical CSS Extractor
        </button>
        <button
          onClick={() => setActiveTab('js-debug')}
          disabled={jsIssues.length === 0 && !outputCode}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'js-debug' 
              ? 'bg-cyan-500 text-white shadow-md' 
              : 'bg-tg-light-surface dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          <Bug size={16} />
          JS Console Debugger
          {jsIssues.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{jsIssues.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'input' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div 
              {...getRootProps()} 
              className={`p-6 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center cursor-pointer ${
                isDragActive ? 'border-cyan-500 bg-cyan-500/10' : 'border-tg-light-border dark:border-tg-dark-border hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <input {...getInputProps()} />
              <Upload size={24} className="text-cyan-500 mb-2" />
              <p className="text-sm font-medium text-tg-light-text dark:text-tg-dark-text">Drag & drop an HTML file here</p>
              <p className="text-xs text-tg-light-hint dark:text-tg-dark-hint mt-1">or click to browse</p>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0 bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl border border-tg-light-border dark:border-tg-dark-border overflow-hidden">
              <div className="px-4 py-2 border-b border-tg-light-border dark:border-tg-dark-border flex justify-between items-center bg-black/5 dark:bg-white/5">
                <span className="text-xs font-semibold uppercase tracking-wider text-tg-light-hint dark:text-tg-dark-hint">HTML Code</span>
              </div>
              <textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="flex-1 w-full p-4 bg-transparent resize-none focus:outline-none font-mono text-sm text-tg-light-text dark:text-tg-dark-text custom-scrollbar"
                placeholder="Paste your HTML here..."
                spellCheck="false"
              />
            </div>
          </div>
          
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar">
            <div className="bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl border border-tg-light-border dark:border-tg-dark-border p-4">
              <h3 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text mb-4 uppercase tracking-wider">Optimization Options</h3>
              
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={options.cleanCss}
                  onChange={(e) => setOptions({...options, cleanCss: e.target.checked})}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-tg-light-text dark:text-tg-dark-text">Remove Unused CSS</span>
              </label>
              
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={options.a11yAudit}
                  onChange={(e) => setOptions({...options, a11yAudit: e.target.checked})}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-tg-light-text dark:text-tg-dark-text">A11y Audit & Fixes</span>
              </label>

              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={options.seoAudit}
                  onChange={(e) => setOptions({...options, seoAudit: e.target.checked})}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-tg-light-text dark:text-tg-dark-text">SEO Meta Analyzer</span>
              </label>
              
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={options.formatCode}
                  onChange={(e) => setOptions({...options, formatCode: e.target.checked})}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-tg-light-text dark:text-tg-dark-text">Code Beautifier</span>
              </label>
              
              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={options.checkDeps}
                  onChange={(e) => setOptions({...options, checkDeps: e.target.checked})}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-tg-light-text dark:text-tg-dark-text">Check JS/CSS Dependencies</span>
              </label>
              
              <button
                onClick={processCode}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
              >
                <Search size={18} />
                Analyze & Build Fixes
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'diff' && (
        <div className="flex-1 flex flex-col min-h-0 bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl border border-tg-light-border dark:border-tg-dark-border overflow-hidden">
          <div className="px-4 py-3 border-b border-tg-light-border dark:border-tg-dark-border flex flex-wrap gap-2 justify-between items-center bg-black/5 dark:bg-white/5">
            <span className="text-xs font-semibold uppercase tracking-wider text-tg-light-hint dark:text-tg-dark-hint">Diff Viewer</span>
            <div className="flex items-center gap-2">
                <button 
                onClick={handleApplyDiff} 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors text-sm font-medium shadow-md shadow-emerald-500/20"
                >
                <CheckCircle2 size={18} />
                Bulk Apply Changes
                </button>
                <button 
                onClick={handleCopy} 
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition-colors text-sm font-medium"
                >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
             <ReactDiffViewer 
                oldValue={inputCode} 
                newValue={outputCode} 
                splitView={true} 
                useDarkTheme={isDark} 
             />
          </div>
        </div>
      )}

      {activeTab === 'critical-css' && (
        <div className="flex-1 flex flex-col min-h-0 bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl border border-tg-light-border dark:border-tg-dark-border overflow-hidden">
          <div className="px-4 py-3 border-b border-tg-light-border dark:border-tg-dark-border flex justify-between items-center bg-black/5 dark:bg-white/5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-tg-light-hint dark:text-tg-dark-hint block">Critical CSS Extractor</span>
              <span className="text-xs text-tg-light-hint dark:text-tg-dark-hint mt-1 block">Extracted CSS required for above-the-fold content (heuristics applied).</span>
            </div>
            <button 
                onClick={() => {
                   navigator.clipboard.writeText(criticalCss);
                }} 
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition-colors text-sm font-medium"
                >
                <Copy size={16} /> Copy
            </button>
          </div>
          <textarea
            value={criticalCss}
            readOnly
            className="flex-1 w-full p-6 bg-transparent resize-none focus:outline-none font-mono text-sm text-tg-light-text dark:text-tg-dark-text custom-scrollbar"
          />
        </div>
      )}

      {activeTab === 'js-debug' && (
        <div className="flex-1 flex flex-col min-h-0 bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl border border-tg-light-border dark:border-tg-dark-border overflow-hidden p-6 overflow-y-auto custom-scrollbar">
           <h3 className="text-lg font-semibold text-tg-light-text dark:text-tg-dark-text mb-4">JS Console Debugger</h3>
           
           {jsIssues.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-tg-light-hint dark:text-tg-dark-hint">
                   <CheckCircle2 size={48} className="text-emerald-500 mb-4 opacity-50" />
                   <p>No major runtime errors, console statements, or memory leaks detected.</p>
               </div>
           ) : (
               <div className="flex flex-col gap-3">
                   {jsIssues.map((issue, i) => (
                       <div key={i} className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/10 flex gap-4">
                           <Bug size={20} className="text-orange-500 shrink-0" />
                           <div>
                               <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1">Line ~{issue.line}</p>
                               <p className="text-sm text-tg-light-text dark:text-tg-dark-text">{issue.message}</p>
                           </div>
                       </div>
                   ))}
               </div>
           )}
        </div>
      )}

      <ChangeRequestModal
        isOpen={isModalOpen}
        title="Smart Linter Pre-Execution Verification"
        operationCategory="HTML / CSS / JS Smart Linter"
        riskLevel="medium"
        summaryDescription={`Smart Linter identified ${pendingChanges?.items.length || 0} code transformation(s). Verify and select changes to apply.`}
        items={pendingChanges?.items || []}
        onConfirm={handleConfirmModal}
        onCancel={() => setIsModalOpen(false)}
      />

    </div>
  );
};
