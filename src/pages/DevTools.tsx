import React, { useState } from 'react';
import { ArrowRightLeft, AlignLeft, Scissors, Download, Copy, Mail, Code2, Zap, Type, ShieldCheck, History, Sparkles, Clock, Trash2, Eye, Check, Shuffle, FileCode, ChevronDown, ChevronUp } from 'lucide-react';
import { html, css, js } from 'js-beautify';
import { useAppStore } from '../store/appStore';
import { HeadlessTools } from '../utils/headlessTools';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface ObfuscationHistoryItem {
  id: string;
  timestamp: string;
  originalCss: string;
  obfuscatedCss: string;
  renamedCount: number;
  classMap: Record<string, string>;
}

export const DevTools: React.FC = () => {
  const { 
    devActiveTab: activeTab, 
    devFmInput: fmInput, 
    devFmLanguage: fmLanguage, 
    devEdInput: edInput, 
    devEdType: edType, 
    devEdAction: edAction, 
    devOutlookType: outlookType, 
    devTypoInput: typoInput,
    devObfuscateInput: obfuscateInput,
    setDevState
  } = useAppStore();

  const [obfuscationResult, setObfuscationResult] = useState<{
    obfuscatedCss: string;
    classMap: Record<string, string>;
    renamedCount: number;
  } | null>(null);

  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedMap, setCopiedMap] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const [obfuscationHistory, setObfuscationHistory] = useLocalStorage<ObfuscationHistoryItem[]>(
    'yes-dev-css-obfuscation-history',
    []
  );

  const setActiveTab = (val: typeof activeTab) => setDevState({ devActiveTab: val });
  const setFmInput = (val: string) => setDevState({ devFmInput: val });
  const setFmLanguage = (val: typeof fmLanguage) => setDevState({ devFmLanguage: val });
  const setEdInput = (val: string) => setDevState({ devEdInput: val });
  const setEdType = (val: typeof edType) => setDevState({ devEdType: val });
  const setEdAction = (val: typeof edAction) => setDevState({ devEdAction: val });
  const setOutlookType = (val: typeof outlookType) => setDevState({ devOutlookType: val });
  const setTypoInput = (val: string) => setDevState({ devTypoInput: val });
  const setObfuscateInput = (val: string) => setDevState({ devObfuscateInput: val });

  const handleObfuscateCss = () => {
    if (!obfuscateInput.trim()) return;
    const res = HeadlessTools.obfuscateCss(obfuscateInput);
    setObfuscationResult(res);

    const newHistoryItem: ObfuscationHistoryItem = {
      id: `obf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      originalCss: obfuscateInput,
      obfuscatedCss: res.obfuscatedCss,
      renamedCount: res.renamedCount,
      classMap: res.classMap
    };

    setObfuscationHistory([newHistoryItem, ...obfuscationHistory].slice(0, 5));
  };

  const loadSampleCss = () => {
    const sample = `.top {\n  z-index: 1;\n}\n.bottom {\n  z-index: 1;\n}\n\n.flip-top {\n  z-index: 5;\n  transform: rotateX(0deg);\n  backface-visibility: hidden;\n}\n.flip-bottom {\n  z-index: 4;\n  transform: rotateX(90deg);\n  backface-visibility: hidden;\n}`;
    setObfuscateInput(sample);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, action: () => void) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const handleSmartTypography = () => {
    setTypoInput(HeadlessTools.smartTypography(typoInput));
  };


  const handleFormat = () => {
    setFmInput(HeadlessTools.formatCode(fmInput, fmLanguage));
  };

  const handleMinify = () => {
    try {
      let minified = fmInput;
      // Remove comments based on language
      if (fmLanguage === 'html') {
        minified = minified.replace(/<!--[\s\S]*?-->/g, '');
        minified = minified.replace(/\s+/g, ' ').replace(/>\s+</g, '><');
      } else if (fmLanguage === 'css') {
        minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
        minified = minified.replace(/\s+/g, ' ').replace(/\s*([{:;,])\s*/g, '$1');
      } else if (fmLanguage === 'js') {
        minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
        minified = minified.replace(/([^:/])\/\/[^\n]*/g, '$1'); // Basic single line comment removal
        minified = minified.replace(/\s+/g, ' ').replace(/\s*([=+\-*/{}[\](),;:&|<>!])\s*/g, '$1');
      }
      setFmInput(minified.trim());
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveComments = () => {
    let noComments = fmInput;
    if (fmLanguage === 'html') {
      noComments = noComments.replace(/<!--[\s\S]*?-->/g, '');
    } else if (fmLanguage === 'css') {
      noComments = noComments.replace(/\/\*[\s\S]*?\*\//g, '');
    } else if (fmLanguage === 'js') {
      noComments = noComments.replace(/\/\*[\s\S]*?\*\//g, '');
      noComments = noComments.replace(/([^:/])\/\/[^\n]*/g, '$1'); 
    }
    setFmInput(noComments);
  };

  const processEncodeDecode = () => {
    return HeadlessTools.encodeDecode(edInput, edType, edAction);
  };

  const getOutlookSnippet = () => {
    if (outlookType === 'vml-bg') {
      return `<!--[if gte mso 9]>
<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:400px;">
  <v:fill type="tile" src="https://example.com/bg.jpg" color="#333333" />
  <v:textbox inset="0,0,0,0">
<![endif]-->
<div>
  <!-- Your content here -->
</div>
<!--[if gte mso 9]>
  </v:textbox>
</v:rect>
<![endif]-->`;
    }
    if (outlookType === 'vml-button') {
      return `<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://example.com/" style="height:40px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="#556270">
  <w:anchorlock/>
  <center>
<![endif]-->
  <a href="http://example.com/" style="background-color:#556270;border-radius:4px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;">Show me the button!</a>
<!--[if mso]>
  </center>
</v:roundrect>
<![endif]-->`;
    }
    if (outlookType === 'ghost-table') {
      return `<!--[if mso | IE]>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td width="50%" valign="top">
<![endif]-->
      <!-- Column 1 Content -->
<!--[if mso | IE]>
    </td>
    <td width="50%" valign="top">
<![endif]-->
      <!-- Column 2 Content -->
<!--[if mso | IE]>
    </td>
  </tr>
</table>
<![endif]-->`;
    }
    return '';
  };

  return (
    <div className="h-full w-full p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <Code2 size={20} />
          </div>
          <div>
            <h1 className="font-bold text-2xl leading-tight text-tg-light-text dark:text-tg-dark-text">Dev Tools</h1>
            <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">Format, minify, bulk encode/decode, and email snippets</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('format')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left ${activeTab === 'format' ? 'bg-tg-light-primary dark:bg-tg-dark-primary text-white shadow-md' : 'bg-tg-light-surface dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover border border-tg-light-border dark:border-tg-dark-border'}`}
          >
            <AlignLeft size={18} />
            Format & Minify
          </button>
          <button 
            onClick={() => setActiveTab('encode')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left ${activeTab === 'encode' ? 'bg-tg-light-primary dark:bg-tg-dark-primary text-white shadow-md' : 'bg-tg-light-surface dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover border border-tg-light-border dark:border-tg-dark-border'}`}
          >
            <ArrowRightLeft size={18} />
            Bulk Encode / Decode
          </button>
          <button 
            onClick={() => setActiveTab('outlook')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left ${activeTab === 'outlook' ? 'bg-tg-light-primary dark:bg-tg-dark-primary text-white shadow-md' : 'bg-tg-light-surface dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover border border-tg-light-border dark:border-tg-dark-border'}`}
          >
            <Mail size={18} />
            Ghost Outlook Tools
          </button>
          <button 
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left ${activeTab === 'typography' ? 'bg-tg-light-primary dark:bg-tg-dark-primary text-white shadow-md' : 'bg-tg-light-surface dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover border border-tg-light-border dark:border-tg-dark-border'}`}
          >
            <Type size={18} />
            Smart Typography
          </button>
          <button 
            onClick={() => setActiveTab('obfuscate')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left ${activeTab === 'obfuscate' ? 'bg-tg-light-primary dark:bg-tg-dark-primary text-white shadow-md' : 'bg-tg-light-surface dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover border border-tg-light-border dark:border-tg-dark-border'}`}
          >
            <ShieldCheck size={18} />
            CSS Class Obfuscator
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border rounded-2xl p-6 overflow-y-auto custom-scrollbar flex flex-col">
          
          {activeTab === 'obfuscate' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg flex items-center gap-2 text-tg-light-text dark:text-tg-dark-text">
                    <ShieldCheck className="text-emerald-500" size={20} />
                    CSS Class Obfuscator (Random Class Renaming)
                  </h2>
                  <button
                    onClick={loadSampleCss}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-tg-light-text dark:text-tg-dark-text flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles size={14} className="text-amber-500" />
                    Beispiel-CSS laden
                  </button>
                </div>
                <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">
                  Benennt jede Custom CSS-Klasse im CSS-Block einzeln in eine anonymisierte Zufalls-ID (z. B. <code>.top</code> → <code>._165792</code>) um, während die CSS-Struktur erhalten bleibt.
                </p>
              </div>

              {/* Main Obfuscator Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Input Column */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-tg-light-hint dark:text-tg-dark-hint flex items-center gap-1.5">
                      <FileCode size={14} />
                      Original CSS Code
                    </label>
                    {obfuscateInput && (
                      <button
                        onClick={() => setObfuscateInput('')}
                        className="text-xs text-rose-500 hover:underline font-semibold"
                      >
                        Leeren
                      </button>
                    )}
                  </div>
                  <textarea
                    value={obfuscateInput}
                    onChange={(e) => setObfuscateInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleObfuscateCss)}
                    placeholder="Füge hier deinen CSS-Code ein... (Strg+Enter zum Obfuszieren)"
                    className="w-full bg-tg-light-bg dark:bg-[#1E1E1E] border border-tg-light-border dark:border-tg-dark-border rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-emerald-500 resize-none h-[280px]"
                  />
                  <button
                    onClick={handleObfuscateCss}
                    disabled={!obfuscateInput.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Shuffle size={16} />
                    CSS Klassen obfuszieren
                  </button>
                </div>

                {/* Output Column */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      Obfuszierter CSS Code
                      {obfuscationResult && (
                        <span className="normal-case px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-mono font-bold">
                          {obfuscationResult.renamedCount} Klassen
                        </span>
                      )}
                    </label>
                    {obfuscationResult && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(obfuscationResult.obfuscatedCss);
                            setCopiedCss(true);
                            setTimeout(() => setCopiedCss(false), 2000);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1 transition-all"
                        >
                          {copiedCss ? <Check size={14} /> : <Copy size={14} />}
                          {copiedCss ? 'Kopiert!' : 'CSS kopieren'}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(obfuscationResult.classMap, null, 2));
                            setCopiedMap(true);
                            setTimeout(() => setCopiedMap(false), 2000);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 flex items-center gap-1 transition-all"
                        >
                          {copiedMap ? <Check size={14} /> : <Copy size={14} />}
                          {copiedMap ? 'Mapping JSON' : 'Mapping kopieren'}
                        </button>
                      </div>
                    )}
                  </div>
                  <textarea
                    value={obfuscationResult?.obfuscatedCss || ''}
                    readOnly
                    placeholder="Das obfuszierte CSS erscheint hier..."
                    className="w-full bg-tg-light-bg dark:bg-[#1E1E1E] border border-tg-light-border dark:border-tg-dark-border rounded-xl p-4 text-sm font-mono focus:outline-none resize-none h-[280px] opacity-90"
                  />
                  {obfuscationResult && obfuscationResult.renamedCount > 0 && (
                    <div className="p-3 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl space-y-1 text-xs">
                      <div className="font-bold text-tg-light-text dark:text-tg-dark-text flex items-center justify-between">
                        <span>Class Renaming Mapping Table ({obfuscationResult.renamedCount})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pt-1 font-mono text-[11px]">
                        {Object.entries(obfuscationResult.classMap).map(([oldCls, newCls]) => (
                          <span key={oldCls} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            .{oldCls} → .{newCls}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* HISTORY VIEW (LAST 5 TRANSFORMATIONS) */}
              <div className="mt-2 pt-5 border-t border-tg-light-border dark:border-tg-dark-border flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                      <History size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-tg-light-text dark:text-tg-dark-text">
                        Transformation Verlauf (Letzte 5 Obfuszierungen)
                      </h3>
                      <p className="text-xs text-tg-light-hint dark:text-tg-dark-hint">
                        In localStorage gespeichert – vergangene CSS-Transformations-Ergebnisse wiederherstellen oder kopieren.
                      </p>
                    </div>
                  </div>
                  {obfuscationHistory.length > 0 && (
                    <button
                      onClick={() => setObfuscationHistory([])}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-lg flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 size={14} /> Verlauf leeren
                    </button>
                  )}
                </div>

                {obfuscationHistory.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 text-center text-xs text-tg-light-hint dark:text-tg-dark-hint">
                    Noch keine Obfuszierungs-Historie vorhanden. Obfuziere oben CSS, um Verlaufseinträge automatisch zu speichern.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {obfuscationHistory.map((item) => {
                      const isExpanded = expandedHistoryId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-3 transition-all"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center gap-1.5 shrink-0">
                                <Clock size={13} />
                                {item.timestamp}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold shrink-0">
                                {item.renamedCount} Klassen
                              </span>
                              <p className="text-xs font-mono text-tg-light-hint dark:text-tg-dark-hint truncate hidden sm:block">
                                {item.originalCss.replace(/\s+/g, ' ').slice(0, 60)}...
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  setObfuscateInput(item.originalCss);
                                  setObfuscationResult({
                                    obfuscatedCss: item.obfuscatedCss,
                                    classMap: item.classMap,
                                    renamedCount: item.renamedCount
                                  });
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                              >
                                <Eye size={14} /> Laden
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.obfuscatedCss);
                                }}
                                className="px-3 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 text-tg-light-text dark:text-tg-dark-text text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Copy size={14} /> CSS
                              </button>
                              <button
                                onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                                className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-tg-light-hint dark:text-tg-dark-hint cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="pt-3 border-t border-black/10 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                              <div>
                                <div className="font-bold text-tg-light-text dark:text-tg-dark-text mb-1">Original CSS</div>
                                <textarea
                                  readOnly
                                  value={item.originalCss}
                                  className="w-full h-32 bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl p-3 resize-none text-[11px]"
                                />
                              </div>
                              <div>
                                <div className="font-bold text-emerald-500 mb-1">Obfuszierter CSS Code</div>
                                <textarea
                                  readOnly
                                  value={item.obfuscatedCss}
                                  className="w-full h-32 bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl p-3 resize-none text-[11px]"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'typography' && (
            <div className="flex flex-col h-full gap-4">
              <h2 className="font-semibold text-lg">Smart Improvements (Non-Breaking Spaces)</h2>
              <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">
                Automatically injects non-breaking spaces (&amp;nbsp;) for rules like: <code>Wort 2020</code>, <code>575,4 %</code>, <code>Dr. Name</code>.
              </p>
              
              <div className="flex gap-2">
                <button onClick={handleSmartTypography} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl flex items-center gap-2">
                  <Zap size={16} /> Apply Smart Fixes
                </button>
              </div>

              <textarea 
                value={typoInput}
                onChange={(e) => setTypoInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleSmartTypography)}
                placeholder="Paste your text or HTML here..."
                className="flex-1 w-full bg-tg-light-bg dark:bg-[#1E1E1E] border border-tg-light-border dark:border-tg-dark-border rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-indigo-500 resize-none min-h-[400px]"
              />
            </div>
          )}

          {activeTab === 'format' && (
            <div className="flex flex-col h-full gap-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg">Formatter, Minifier & Comments</h2>
                <div className="flex bg-tg-light-bg dark:bg-tg-dark-bg p-1 rounded-lg border border-tg-light-border dark:border-tg-dark-border">
                  {(['html', 'css', 'js'] as const).map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setFmLanguage(lang)}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase rounded-md transition-colors ${fmLanguage === lang ? 'bg-white dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text shadow-sm' : 'text-tg-light-hint dark:text-tg-dark-hint'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button onClick={handleFormat} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl flex items-center gap-2">
                  <AlignLeft size={16} /> Format
                </button>
                <button onClick={handleMinify} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-xl flex items-center gap-2">
                  <Zap size={16} /> Minify
                </button>
                <button onClick={handleRemoveComments} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl flex items-center gap-2">
                  <Scissors size={16} /> Remove Comments
                </button>
              </div>

              <textarea 
                value={fmInput}
                onChange={(e) => setFmInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleFormat)}
                placeholder={`Paste your ${fmLanguage.toUpperCase()} code here...`}
                className="flex-1 w-full bg-tg-light-bg dark:bg-[#1E1E1E] border border-tg-light-border dark:border-tg-dark-border rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-indigo-500 resize-none min-h-[400px]"
              />
            </div>
          )}

          {activeTab === 'encode' && (
            <div className="flex flex-col h-full gap-4">
               <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-lg">Bulk Encode / Decode</h2>
                  <div className="flex bg-tg-light-bg dark:bg-tg-dark-bg p-1 rounded-lg border border-tg-light-border dark:border-tg-dark-border">
                    <button 
                      onClick={() => setEdAction('encode')}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase rounded-md transition-colors ${edAction === 'encode' ? 'bg-white dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text shadow-sm' : 'text-tg-light-hint dark:text-tg-dark-hint'}`}
                    >
                      Encode
                    </button>
                    <button 
                      onClick={() => setEdAction('decode')}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase rounded-md transition-colors ${edAction === 'decode' ? 'bg-white dark:bg-tg-dark-surface text-tg-light-text dark:text-tg-dark-text shadow-sm' : 'text-tg-light-hint dark:text-tg-dark-hint'}`}
                    >
                      Decode
                    </button>
                  </div>
               </div>
               
               <div className="flex gap-2">
                  {(['base64', 'url', 'hex', 'html'] as const).map(type => (
                    <button 
                      key={type}
                      onClick={() => setEdType(type)}
                      className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${edType === type ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-transparent border-tg-light-border dark:border-tg-dark-border text-tg-light-text dark:text-tg-dark-text hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover'}`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
               </div>

               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
                 <textarea 
                   value={edInput}
                   onChange={(e) => setEdInput(e.target.value)}
                   placeholder="Enter input here..."
                   className="w-full h-full bg-tg-light-bg dark:bg-[#1E1E1E] border border-tg-light-border dark:border-tg-dark-border rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-indigo-500 resize-none"
                 />
                 <textarea 
                   value={processEncodeDecode()}
                   readOnly
                   placeholder="Result..."
                   className="w-full h-full bg-tg-light-bg dark:bg-[#1E1E1E] border border-tg-light-border dark:border-tg-dark-border rounded-xl p-4 text-sm font-mono focus:outline-none resize-none opacity-80"
                 />
               </div>
            </div>
          )}

          {activeTab === 'outlook' && (
            <div className="flex flex-col h-full gap-4">
              <h2 className="font-semibold text-lg">Ghost Outlook Tools (VML Snippets)</h2>
              <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">
                Use these HTML/VML snippets to ensure your email campaigns look correct in Microsoft Outlook.
              </p>
              
              <div className="flex gap-2">
                  {(['vml-bg', 'vml-button', 'ghost-table'] as const).map(type => (
                    <button 
                      key={type}
                      onClick={() => setOutlookType(type)}
                      className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${outlookType === type ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-transparent border-tg-light-border dark:border-tg-dark-border text-tg-light-text dark:text-tg-dark-text hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover'}`}
                    >
                      {type === 'vml-bg' ? 'Background Image' : type === 'vml-button' ? 'Ghost Button' : 'Ghost Table'}
                    </button>
                  ))}
              </div>

              <div className="relative flex-1 min-h-[400px]">
                <textarea 
                  value={getOutlookSnippet()}
                  readOnly
                  className="w-full h-full bg-tg-light-bg dark:bg-[#1E1E1E] border border-tg-light-border dark:border-tg-dark-border rounded-xl p-4 text-sm font-mono focus:outline-none resize-none"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(getOutlookSnippet())}
                  className="absolute top-4 right-4 p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Copy size={16} /> Copy
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
