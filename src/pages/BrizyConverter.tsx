import React, { useState, useEffect } from 'react';
import { useToolTracking } from '../hooks/useToolTracking';
import { 
  Code2, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  Settings2, 
  Layers, 
  Sparkles, 
  Activity, 
  FileCode, 
  Eye, 
  FileCheck, 
  RefreshCw, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Laptop, 
  Tablet, 
  Smartphone,
  Trash2,
  Archive
} from 'lucide-react';
import JSZip from 'jszip';
import Editor from '@monaco-editor/react';
import { 
  convertBrizyToCleanHtml, 
  BrizyConverterOptions, 
  defaultOptions, 
  BrizyConvertResult 
} from '../lib/brizyConverter';
import { BrizyMigrator } from '../components/BrizyMigrator';

const SAMPLE_BRIZY_HTML = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Brizy Exported Landing Page</title>
  <style>
    .brz-reset-all { margin: 0; padding: 0; box-sizing: border-box; }
    .brz-css-sec101 { padding-top: 100px; padding-bottom: 100px; background-color: #0f172a; color: #ffffff; }
    .brz-css-h1001 { font-size: 52px; font-weight: 800; line-height: 1.1; margin-bottom: 24px; color: #38bdf8; }
    .brz-css-p1002 { font-size: 20px; line-height: 1.6; color: #94a3b8; margin-bottom: 32px; }
    .brz-css-btn103 { background-color: #38bdf8; color: #0f172a; padding: 16px 36px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; }
    .brz-css-sec201 { padding-top: 80px; padding-bottom: 80px; background-color: #ffffff; color: #0f172a; }
    .brz-css-card10 { background-color: #f8fafc; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; }
    @media (max-width: 768px) {
      .brz-css-h1001 { font-size: 36px; }
      .brz-css-sec101 { padding-top: 60px; padding-bottom: 60px; }
    }
  </style>
</head>
<body class="brz">
  <!-- Brizy Hero Section -->
  <div class="brz-section brz-section__header brz-css-sec101" data-brz-id="hero-sec" data-uid="a8f9x1" data-brz-version="2.4.8">
    <div class="brz-section__content">
      <div class="brz-container brz-css-cont10">
        <div class="brz-row brz-css-row10">
          <div class="brz-column brz-col-lg-12 brz-css-col10">
            <div class="brz-column__content">
              <div class="brz-wrapper brz-wrapper-inner">
                <div class="brz-text brz-rich-text">
                  <h1 class="brz-text__content brz-css-h1001" data-node-id="h1-node">
                    <span>Willkommen bei unserer Digital-Agentur</span>
                  </h1>
                </div>
              </div>
              <div class="brz-wrapper">
                <div class="brz-text brz-css-p1002">
                  <p class="brz-text__content">
                    Wir entwickeln blitzschnelle, skalierbare Web-Anwendungen mit erstklassigem Design und kompromissloser Performance.
                  </p>
                </div>
              </div>
              <div class="brz-wrapper">
                <div class="brz-button brz-btn__wrapper">
                  <a href="https://example.com/contact" class="brz-btn brz-css-btn103" data-brz-popup-id="modal-1">
                    <span class="brz-btn__text">Jetzt Projekt starten</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Brizy Features Section -->
  <div class="brz-section brz-css-sec201" data-brz-id="feat-sec" data-uid="b9y0z2">
    <div class="brz-section__content">
      <div class="brz-container">
        <div class="brz-row">
          <div class="brz-column brz-col-lg-4">
            <div class="brz-column__content">
              <div class="brz-wrapper brz-css-card10">
                <div class="brz-text">
                  <h3 class="brz-text__content" style="font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #0f172a;">
                    100% Sauberer Code
                  </h3>
                  <p style="font-size: 16px; color: #64748b; line-height: 1.5;">
                    Keine verschachtelten DIV-Wüsten mehr. Unser Compiler bereinigt Brizy-Ballast automatisch.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="brz-column brz-col-lg-4">
            <div class="brz-column__content">
              <div class="brz-wrapper brz-css-card10">
                <div class="brz-text">
                  <h3 class="brz-text__content" style="font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #0f172a;">
                    Extrem Hohe Speed-Scores
                  </h3>
                  <p style="font-size: 16px; color: #64748b; line-height: 1.5;">
                    Reduziert DOM-Knoten um bis zu 70% für maximale Ladezeiten und SEO-Rankings.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="brz-column brz-col-lg-4">
            <div class="brz-column__content">
              <div class="brz-wrapper brz-css-card10">
                <div class="brz-text">
                  <h3 class="brz-text__content" style="font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #0f172a;">
                    Deterministische Pipeline
                  </h3>
                  <p style="font-size: 16px; color: #64748b; line-height: 1.5;">
                    Rein technischer AST-Transpiler ohne KI-Halluzinationen oder Layout-Abweichungen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

export const BrizyConverter: React.FC = () => {
  useToolTracking('/brizyconverter');

  const [inputCode, setInputCode] = useState<string>(SAMPLE_BRIZY_HTML);
  const [options, setOptions] = useState<BrizyConverterOptions>(defaultOptions);
  const [result, setResult] = useState<BrizyConvertResult | null>(null);

  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'audit'>('code');
  const [activeCodeFile, setActiveCodeFile] = useState<'html' | 'css'>('html');
  const [previewMode, setPreviewMode] = useState<'clean' | 'original'>('clean');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedCss, setCopiedCss] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'decompiler' | 'migrator'>('decompiler');

  // Trigger conversion whenever input or options change
  useEffect(() => {
    if (!inputCode.trim()) {
      setResult(null);
      return;
    }
    setIsProcessing(true);
    const timer = setTimeout(() => {
      try {
        const res = convertBrizyToCleanHtml(inputCode, options);
        setResult(res);
      } catch (err) {
        console.error('Brizy conversion error:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [inputCode, options]);

  const handleOptionToggle = (key: keyof BrizyConverterOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.zip')) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const zip = await JSZip.loadAsync(evt.target?.result as ArrayBuffer);
          let htmlContent = '';
          // Find first html file in zip
          for (const filename of Object.keys(zip.files)) {
            if (filename.endsWith('.html') && !filename.startsWith('__MACOSX')) {
              htmlContent = await zip.files[filename].async('string');
              break;
            }
          }
          if (htmlContent) {
            setInputCode(htmlContent);
          } else {
            alert('Keine .html Datei im ZIP-Archiv gefunden!');
          }
        } catch (err) {
          alert('Fehler beim Lesen des ZIP-Archivs!');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setInputCode(evt.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopyCode = (type: 'html' | 'css') => {
    if (!result) return;
    const text = type === 'html' ? result.cleanHtml : result.cleanCss;
    navigator.clipboard.writeText(text);
    if (type === 'html') {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } else {
      setCopiedCss(true);
      setTimeout(() => setCopiedCss(false), 2000);
    }
  };

  const handleDownloadZip = async () => {
    if (!result) return;

    const zip = new JSZip();
    zip.file('index.html', result.cleanHtml);

    const cssFolder = zip.folder('css');
    cssFolder?.file('style.css', result.cleanCss);

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_brizy_website.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Preview Iframe HTML construction
  const getPreviewIframeContent = () => {
    if (previewMode === 'original') return inputCode;
    if (!result) return '';

    // Inject styles inline into iframe for clean live rendering
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${result.cleanCss}
  </style>
</head>
<body>
  ${result.cleanHtml.includes('<body') ? result.cleanHtml.split(/<body[^>]*>/i)[1]?.split('</body>')[0] || result.cleanHtml : result.cleanHtml}
</body>
</html>`;
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#FAFAFA] dark:bg-[#111111] text-tg-light-text dark:text-tg-dark-text p-4 md:p-8 flex flex-col gap-6 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-tg-light-border dark:border-tg-dark-border">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400">
            <Zap size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
                Brizy Code Decompiler &amp; Migrator
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                100% Deterministic Engine
              </span>
            </div>
            <p className="text-xs text-tg-light-hint dark:text-tg-dark-hint mt-0.5">
              Refaktoriert verschachtelte Brizy-Page-Builder-Exporte in sauberes, semantisches HTML5 &amp; CSS3 ohne KI.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#1A1A1E] rounded-xl border border-tg-light-border dark:border-tg-dark-border">
            <button
              onClick={() => setMode('decompiler')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'decompiler'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
              }`}
            >
              Decompiler Studio
            </button>
            <button
              onClick={() => setMode('migrator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'migrator'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
              }`}
            >
              AST IR Migrator
            </button>
          </div>

          {mode === 'decompiler' && (
            <>
              <button
                onClick={() => setInputCode(SAMPLE_BRIZY_HTML)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border hover:border-purple-500/50 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                <RefreshCw size={14} className="text-purple-500" />
                <span>Beispiel laden</span>
              </button>

              <label className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all">
                <Upload size={14} />
                <span>Code / ZIP Upload</span>
                <input type="file" accept=".html,.htm,.zip,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </>
          )}
        </div>
      </div>

      {mode === 'migrator' ? (
        <BrizyMigrator />
      ) : (
      /* Main Grid: Left Panel (Input & Options) / Right Panel (Output & Inspection) */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* LEFT COLUMN: Input & Compiler Pipeline Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Input Code Area */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-tg-light-text dark:text-tg-dark-text">
                <FileCode size={16} className="text-purple-500" />
                Brizy Quellcode (Export HTML)
              </span>
              <button
                onClick={() => setInputCode('')}
                className="text-[11px] text-tg-light-hint hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} />
                Leeren
              </button>
            </div>

            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Füge hier deinen generierten Brizy HTML Exportcode ein..."
              className="w-full h-48 md:h-60 p-3 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none custom-scrollbar"
            />
          </div>

          {/* Compiler Pipeline Rules Configuration */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-tg-light-border dark:border-tg-dark-border pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-tg-light-text dark:text-tg-dark-text">
                <Settings2 size={16} className="text-purple-500" />
                Decompiler Regelsatz
              </div>
              <span className="text-[11px] text-tg-light-hint dark:text-tg-dark-hint font-mono">
                Pipeline v1.0
              </span>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              
              <label className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-tg-light-bg dark:hover:bg-white/5 cursor-pointer transition-colors select-none">
                <input
                  type="checkbox"
                  checked={options.removeWrapperDivs}
                  onChange={() => handleOptionToggle('removeWrapperDivs')}
                  className="mt-0.5 w-4 h-4 text-purple-600 rounded border-tg-light-border dark:border-tg-dark-border focus:ring-purple-500 accent-purple-600 cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-tg-light-text dark:text-tg-dark-text">Wrapper-DIVs entfernen (Un-wrapping)</div>
                  <p className="text-[11px] text-tg-light-hint dark:text-tg-dark-hint mt-0.5">
                    Löscht geschachtelte Pass-Through Containers wie <code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.2 rounded">.brz-wrapper</code> &amp; <code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.2 rounded">.brz-column__content</code>.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-tg-light-bg dark:hover:bg-white/5 cursor-pointer transition-colors select-none">
                <input
                  type="checkbox"
                  checked={options.semanticUpgrade}
                  onChange={() => handleOptionToggle('semanticUpgrade')}
                  className="mt-0.5 w-4 h-4 text-purple-600 rounded border-tg-light-border dark:border-tg-dark-border focus:ring-purple-500 accent-purple-600 cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-tg-light-text dark:text-tg-dark-text">Semantisches HTML5 Upgrade</div>
                  <p className="text-[11px] text-tg-light-hint dark:text-tg-dark-hint mt-0.5">
                    Wandelt generische DIVs in echte <code className="font-mono text-purple-500">&lt;section&gt;</code>, <code className="font-mono text-purple-500">&lt;header&gt;</code>, <code className="font-mono text-purple-500">&lt;footer&gt;</code> &amp; <code className="font-mono text-purple-500">&lt;nav&gt;</code> um.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-tg-light-bg dark:hover:bg-white/5 cursor-pointer transition-colors select-none">
                <input
                  type="checkbox"
                  checked={options.extractStylesToCss}
                  onChange={() => handleOptionToggle('extractStylesToCss')}
                  className="mt-0.5 w-4 h-4 text-purple-600 rounded border-tg-light-border dark:border-tg-dark-border focus:ring-purple-500 accent-purple-600 cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-tg-light-text dark:text-tg-dark-text">Inline-Styles &amp; .brz-css-* in CSS auslagern</div>
                  <p className="text-[11px] text-tg-light-hint dark:text-tg-dark-hint mt-0.5">
                    Extrahiert harte Style-Attribute und Brizy CSS-Hashes in eine externe <code className="font-mono">style.css</code>.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-tg-light-bg dark:hover:bg-white/5 cursor-pointer transition-colors select-none">
                <input
                  type="checkbox"
                  checked={options.cleanAttributes}
                  onChange={() => handleOptionToggle('cleanAttributes')}
                  className="mt-0.5 w-4 h-4 text-purple-600 rounded border-tg-light-border dark:border-tg-dark-border focus:ring-purple-500 accent-purple-600 cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-tg-light-text dark:text-tg-dark-text">data-brz-* &amp; UID Ballast entfernen</div>
                  <p className="text-[11px] text-tg-light-hint dark:text-tg-dark-hint mt-0.5">
                    Bereinigt unnötige ID-Tracker-Attribute wie <code className="font-mono">data-uid</code>, <code className="font-mono">data-brz-id</code> &amp; <code className="font-mono">data-node-id</code>.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-tg-light-bg dark:hover:bg-white/5 cursor-pointer transition-colors select-none">
                <input
                  type="checkbox"
                  checked={options.renameClasses}
                  onChange={() => handleOptionToggle('renameClasses')}
                  className="mt-0.5 w-4 h-4 text-purple-600 rounded border-tg-light-border dark:border-tg-dark-border focus:ring-purple-500 accent-purple-600 cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-tg-light-text dark:text-tg-dark-text">Klassen-Bereinigung &amp; BEM Renaming</div>
                  <p className="text-[11px] text-tg-light-hint dark:text-tg-dark-hint mt-0.5">
                    Entfernt <code className="font-mono">brz-*</code> Präfixe und erzeugt saubere Namensstrukturen.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-tg-light-bg dark:hover:bg-white/5 cursor-pointer transition-colors select-none">
                <input
                  type="checkbox"
                  checked={options.cleanAssetPaths}
                  onChange={() => handleOptionToggle('cleanAssetPaths')}
                  className="mt-0.5 w-4 h-4 text-purple-600 rounded border-tg-light-border dark:border-tg-dark-border focus:ring-purple-500 accent-purple-600 cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-tg-light-text dark:text-tg-dark-text">Asset-Pfade lokalisieren</div>
                  <p className="text-[11px] text-tg-light-hint dark:text-tg-dark-hint mt-0.5">
                    Wandelt <code className="font-mono">/wp-content/uploads/</code> in relative Pfade (<code className="font-mono">./assets/images/</code>) um.
                  </p>
                </div>
              </label>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Optimization Metrics & Result Studio */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Metrics Dashboard */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-1 shadow-sm">
                <span className="text-[11px] font-semibold text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">
                  DOM Knoten
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">
                    {result.stats.cleanedDomCount}
                  </span>
                  <span className="text-xs text-tg-light-hint line-through">
                    {result.stats.originalDomCount}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  -{result.stats.domReductionPercent}% DIV Bloat
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-1 shadow-sm">
                <span className="text-[11px] font-semibold text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">
                  Dateigröße
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                    {formatBytes(result.stats.cleanedBytes)}
                  </span>
                  <span className="text-xs text-tg-light-hint line-through">
                    {formatBytes(result.stats.originalBytes)}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  -{result.stats.sizeReductionPercent}% Ersparnis
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-1 shadow-sm">
                <span className="text-[11px] font-semibold text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">
                  Gereinigte Klassen
                </span>
                <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                  {result.stats.purgedBrzClassesCount}
                </span>
                <span className="text-[10px] text-tg-light-hint dark:text-tg-dark-hint">
                  brz-* Klassen gelöscht
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-1 shadow-sm">
                <span className="text-[11px] font-semibold text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">
                  Unwrapped DIVs
                </span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {result.stats.removedWrapperDivsCount}
                </span>
                <span className="text-[10px] text-tg-light-hint dark:text-tg-dark-hint">
                  Wrapper aufgelöst
                </span>
              </div>
            </div>
          )}

          {/* Result Studio Container */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-4 shadow-sm flex-1">
            
            {/* View Switcher Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tg-light-border dark:border-tg-dark-border pb-3">
              
              {/* Main Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-tg-light-bg dark:bg-[#111111] rounded-xl border border-tg-light-border dark:border-tg-dark-border">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    activeTab === 'code'
                      ? 'bg-white dark:bg-[#1A1A1E] text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                  }`}
                >
                  <Code2 size={14} />
                  <span>Clean Code</span>
                </button>

                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    activeTab === 'preview'
                      ? 'bg-white dark:bg-[#1A1A1E] text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                  }`}
                >
                  <Eye size={14} />
                  <span>Visual Preview</span>
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    activeTab === 'audit'
                      ? 'bg-white dark:bg-[#1A1A1E] text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                  }`}
                >
                  <FileCheck size={14} />
                  <span>Audit Log ({result?.auditLogs.length || 0})</span>
                </button>
              </div>

              {/* Action / Export Buttons */}
              <div className="flex items-center gap-2">
                {activeTab === 'code' && (
                  <>
                    <button
                      onClick={() => handleCopyCode(activeCodeFile)}
                      className="px-3 py-1.5 rounded-xl bg-tg-light-bg dark:bg-[#111111] hover:bg-black/5 dark:hover:bg-white/10 border border-tg-light-border dark:border-tg-dark-border text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {(activeCodeFile === 'html' ? copiedHtml : copiedCss) ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span>Kopiert!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>{activeCodeFile.toUpperCase()} Kopieren</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadZip}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Archive size={14} />
                      <span>ZIP Paket Download</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* TAB 1: CLEAN CODE VIEW */}
            {activeTab === 'code' && result && (
              <div className="flex flex-col gap-3 flex-1">
                {/* File Switcher (HTML vs CSS) */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setActiveCodeFile('html')}
                    className={`px-3 py-1 rounded-lg font-mono font-semibold transition-all ${
                      activeCodeFile === 'html'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                    }`}
                  >
                    index.html
                  </button>
                  <button
                    onClick={() => setActiveCodeFile('css')}
                    className={`px-3 py-1 rounded-lg font-mono font-semibold transition-all ${
                      activeCodeFile === 'css'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                    }`}
                  >
                    css/style.css
                  </button>
                </div>

                {/* Monaco Editor / Code Viewer */}
                <div className="rounded-xl overflow-hidden border border-tg-light-border dark:border-tg-dark-border h-96 md:h-[480px]">
                  <Editor
                    height="100%"
                    language={activeCodeFile === 'html' ? 'html' : 'css'}
                    value={activeCodeFile === 'html' ? result.cleanHtml : result.cleanCss}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                    }}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: VISUAL PREVIEW VIEW */}
            {activeTab === 'preview' && (
              <div className="flex flex-col gap-3 flex-1">
                {/* Preview Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-tg-light-bg dark:bg-[#111111] p-2 rounded-xl border border-tg-light-border dark:border-tg-dark-border text-xs">
                  {/* Mode Toggle (Clean vs Original) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewMode('clean')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        previewMode === 'clean'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                      }`}
                    >
                      Clean Output
                    </button>
                    <button
                      onClick={() => setPreviewMode('original')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        previewMode === 'original'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-tg-light-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                      }`}
                    >
                      Original Brizy
                    </button>
                  </div>

                  {/* Viewport Switcher */}
                  <div className="flex items-center gap-1 bg-white dark:bg-[#1A1A1E] p-1 rounded-lg border border-tg-light-border dark:border-tg-dark-border">
                    <button
                      onClick={() => setViewport('desktop')}
                      className={`p-1.5 rounded ${viewport === 'desktop' ? 'bg-purple-500 text-white' : 'text-tg-light-hint'}`}
                      title="Desktop View"
                    >
                      <Laptop size={14} />
                    </button>
                    <button
                      onClick={() => setViewport('tablet')}
                      className={`p-1.5 rounded ${viewport === 'tablet' ? 'bg-purple-500 text-white' : 'text-tg-light-hint'}`}
                      title="Tablet View"
                    >
                      <Tablet size={14} />
                    </button>
                    <button
                      onClick={() => setViewport('mobile')}
                      className={`p-1.5 rounded ${viewport === 'mobile' ? 'bg-purple-500 text-white' : 'text-tg-light-hint'}`}
                      title="Mobile View"
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>
                </div>

                {/* Iframe Preview Stage */}
                <div className="w-full h-96 md:h-[480px] bg-white dark:bg-black rounded-xl border border-tg-light-border dark:border-tg-dark-border flex items-center justify-center p-2 overflow-hidden">
                  <iframe
                    srcDoc={getPreviewIframeContent()}
                    title="Brizy Decompiler Live Preview"
                    className={`h-full transition-all bg-white rounded shadow-md border ${
                      viewport === 'desktop'
                        ? 'w-full'
                        : viewport === 'tablet'
                        ? 'w-[768px]'
                        : 'w-[375px]'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: AUDIT LOG VIEW */}
            {activeTab === 'audit' && result && (
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-96 md:max-h-[480px] custom-scrollbar pr-1">
                {result.auditLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-tg-light-hint dark:text-tg-dark-hint">
                    Keine wesentlichen Transformationen erforderlich.
                  </div>
                ) : (
                  result.auditLogs.map((log, idx) => (
                    <div
                      key={`audit-${idx}`}
                      className="p-3.5 rounded-xl bg-tg-light-bg dark:bg-[#111111] border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          {log.title}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          {log.type}
                        </span>
                      </div>
                      <p className="text-tg-light-hint dark:text-tg-dark-hint text-[11px] leading-relaxed">
                        {log.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

        </div>

      </div>
      )}

    </div>
  );
};
export default BrizyConverter;
