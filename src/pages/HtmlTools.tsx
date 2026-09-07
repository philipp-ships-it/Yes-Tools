import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft,
  X,
  Code2,
  ArrowDown,
  AlignLeft,
  MessageSquareOff,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Download,
  Settings,
  Upload,
  FolderArchive,
  FileCode,
  ImageIcon,
  Check
} from 'lucide-react';
import JSZip from 'jszip';
import { formatMsoHtml } from '../utils/msoFormatter';
import { TextAreaCard } from '@/components/legacy/TextAreaCard';
import { SettingsPanel } from '@/components/legacy/SettingsPanel';
import { SidebarAccordion } from '../components/SidebarAccordion';
import { HtmlAnalyzer } from '@/components/legacy/HtmlAnalyzer';
import { LivePreviewCard } from '@/components/legacy/LivePreviewCard';
import { processText } from '@/utils/htmlEncoder';
import { EscapeMode, EscapeSettings } from '@/types';
import { fixMojibake, detectMojibake } from '../lib/encodingFixer';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToolTracking } from '../hooks/useToolTracking';

interface ZipFileItem {
  path: string;
  name: string;
  isHtml: boolean;
  isCss: boolean;
  isJs: boolean;
  isImage: boolean;
  dataUrl?: string;
  textContent?: string;
}

export const HtmlTools: React.FC = () => {
  useToolTracking('Html Tools');

  // --- State ---
  const [inputText, setInputText] = useLocalStorage('html-tools-input', '');
  const [history, setHistory] = useState<string[]>([]);

  const saveHistory = () => setHistory(prev => [inputText, ...prev].slice(0, 5));

  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useLocalStorage<EscapeMode>('html-tools-mode', EscapeMode.CONTENT_ONLY);
  const [isDecodeMode, setIsDecodeMode] = useLocalStorage('html-tools-decode-mode', false);
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage('html-tools-sidebar-open', true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useLocalStorage('html-tools-right-sidebar-open', true);
  const [isPreviewOpen, setIsPreviewOpen] = useLocalStorage('html-tools-preview-open', true);
  const [settings, setSettings] = useLocalStorage<EscapeSettings>('html-tools-settings', {
    autoFixEncoding: false,
    htmlChars: false,
    umlauts: true,
    symbols: true,
    emojis: false,
    encodingFormat: 'decimal'
  });

  // ZIP Files & Assets State
  const [zipFiles, setZipFiles] = useState<ZipFileItem[]>([]);
  const [zipFileName, setZipFileName] = useState<string>('');
  const [activeHtmlPath, setActiveHtmlPath] = useState<string>('');

  // Handle Logic
  useEffect(() => {
    const operation = isDecodeMode ? 'UNESCAPE' : 'ESCAPE';
    let processedInput = inputText;
    if (settings.autoFixEncoding && operation === 'ESCAPE') {
      processedInput = fixMojibake(inputText);
    }
    const result = processText(processedInput, operation, mode, settings);
    setOutputText(result);
  }, [inputText, mode, settings, isDecodeMode]);

  // Handlers
  const handleUpdateSetting = (key: keyof EscapeSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    const contentToExport = isDecodeMode ? outputText : inputText;
    if (!contentToExport) return;
    const blob = new Blob([contentToExport], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeHtmlPath ? activeHtmlPath.split('/').pop() || 'export.html' : 'export.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setInputText('');
    setOutputText('');
    setZipFiles([]);
    setZipFileName('');
    setActiveHtmlPath('');
  };

  const handleFormatHtml = () => {
    saveHistory();
    try {
      const formatted = formatMsoHtml(inputText, {
        indent_size: 2,
        wrap_line_length: 0,
        preserve_newlines: true,
      });
      setInputText(formatted);
    } catch (e) {
      console.error("Formatting failed", e);
    }
  };

  const handleRemoveComments = () => {
    saveHistory();
    const noComments = inputText.replace(/<!--[\s\S]*?-->/g, '');
    setInputText(noComments);
  };

  // ZIP Upload & File Extraction
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setZipFileName(file.name);
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      const extractedItems: ZipFileItem[] = [];

      for (const [relativePath, zipObj] of Object.entries(loadedZip.files)) {
        if (zipObj.dir) continue;

        const isHtml = /\.(html|htm)$/i.test(relativePath);
        const isCss = /\.css$/i.test(relativePath);
        const isJs = /\.js$/i.test(relativePath);
        const isImage = /\.(png|jpg|jpeg|gif|webp|svg|woff2|woff|ttf|eot)$/i.test(relativePath);

        let item: ZipFileItem = {
          path: relativePath,
          name: relativePath.split('/').pop() || relativePath,
          isHtml,
          isCss,
          isJs,
          isImage
        };

        if (isHtml || isCss || isJs) {
          item.textContent = await zipObj.async('text');
        } else if (isImage) {
          const blob = await zipObj.async('blob');
          item.dataUrl = URL.createObjectURL(blob);
        }

        extractedItems.push(item);
      }

      setZipFiles(extractedItems);

      // Select first HTML file
      const primaryHtml = extractedItems.find(i => i.isHtml);
      if (primaryHtml && primaryHtml.textContent) {
        setActiveHtmlPath(primaryHtml.path);
        setInputText(primaryHtml.textContent);
      }
    } catch (err) {
      console.error("ZIP extract error:", err);
    }
  };

  // Select an HTML file from the ZIP tree
  const handleSelectZipFile = (fileItem: ZipFileItem) => {
    if (fileItem.isHtml && fileItem.textContent) {
      setActiveHtmlPath(fileItem.path);
      setInputText(fileItem.textContent);
    }
  };

  // Build mapped live preview HTML replacing local relative paths with Data/Object URLs
  const getMappedPreviewHtml = () => {
    let raw = isDecodeMode ? outputText : inputText;
    if (!raw) return '';

    // Replace all relative image, font, and fakepaths in the HTML with extracted object URLs
    zipFiles.forEach(file => {
      if (file.dataUrl) {
        raw = raw.split(file.path).join(file.dataUrl);
        raw = raw.split(file.name).join(file.dataUrl);
        raw = raw.split(`C:\\fakepath\\${file.name}`).join(file.dataUrl);
        raw = raw.split(`C:/fakepath/${file.name}`).join(file.dataUrl);
        raw = raw.split(`fakepath/${file.name}`).join(file.dataUrl);
        raw = raw.split(`file:///C:/fakepath/${file.name}`).join(file.dataUrl);
        raw = raw.split(`./${file.name}`).join(file.dataUrl);
      }
    });

    // Automatically inject external CSS stylesheets extracted from ZIP
    zipFiles.filter(f => f.isCss && f.textContent).forEach(cssFile => {
      const styleTag = `<style>/* ZIP Asset: ${cssFile.name} */\n${cssFile.textContent}</style>`;
      const linkRegex = new RegExp(`<link[^>]*href=["']([^"']*${cssFile.name})["'][^>]*>`, 'gi');
      if (linkRegex.test(raw)) {
        raw = raw.replace(linkRegex, styleTag);
      } else {
        // Append inside head or at top
        if (/<head[^>]*>/i.test(raw)) {
          raw = raw.replace(/(<head[^>]*>)/i, `$1\n${styleTag}`);
        }
      }
    });

    return raw;
  };

  const htmlToAnalyze = isDecodeMode ? outputText : inputText;
  const previewHtml = getMappedPreviewHtml();

  return (
    <div className="h-full w-full flex flex-col">
      
      {/* Main Content */}
      <main className="flex-1 max-w-[1920px] mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col xl:flex-row gap-6 h-full overflow-hidden">
        
        {/* Left Sidebar (Settings & ZIP File Tree) */}
        <aside className={`flex-shrink-0 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-32px)] xl:sticky xl:top-4 pb-8 custom-scrollbar transition-all duration-300 ${isSidebarOpen ? 'w-full xl:w-80' : 'w-full xl:w-16 items-center'}`}>
          
          {/* Header inside Sidebar */}
          <div className={`flex items-center mb-2 ${isSidebarOpen ? 'justify-between' : 'justify-center flex-col gap-4'}`}>
            <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-md">
                <Code2 size={18} />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight">HTML Tools</h1>
              </div>
            </div>
            <div className={`flex items-center gap-2 ${!isSidebarOpen && 'flex-col'}`}>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`hidden xl:flex items-center justify-center hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover transition-colors text-tg-light-hint dark:text-tg-dark-hint ${isSidebarOpen ? 'w-8 h-8 rounded-full' : 'w-10 h-10 rounded-xl bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border'}`}
                title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              >
                 {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              </button>
            </div>
          </div>

          {isSidebarOpen ? (
            <>
              {/* Mode Switcher Card */}
              <div className="bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl p-1 shadow-soft border border-tg-light-border dark:border-tg-dark-border flex">
                 <button 
                   onClick={() => setIsDecodeMode(false)}
                   className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${!isDecodeMode ? 'bg-tg-light-primary dark:bg-tg-dark-primary text-white shadow-sm' : 'text-tg-light-hint dark:text-tg-dark-hint hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover'}`}
                 >
                   Encode
                 </button>
                 <button 
                   onClick={() => setIsDecodeMode(true)}
                   className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${isDecodeMode ? 'bg-tg-light-primary dark:bg-tg-dark-primary text-white shadow-sm' : 'text-tg-light-hint dark:text-tg-dark-hint hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover'}`}
                 >
                   Decode
                 </button>
              </div>

              {/* ZIP Upload Card */}
              <div className="bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl p-3 shadow-soft border border-tg-light-border dark:border-tg-dark-border flex flex-col gap-2">
                <label className="cursor-pointer py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                  <Upload size={14} /> Upload Website / Template ZIP
                  <input type="file" accept=".zip" onChange={handleZipUpload} className="hidden" />
                </label>
                {zipFileName && (
                  <p className="text-[11px] text-tg-light-hint dark:text-tg-dark-hint text-center truncate font-medium">
                    📦 {zipFileName} ({zipFiles.length} files)
                  </p>
                )}
              </div>

              {/* ZIP File Tree Accordion */}
              {zipFiles.length > 0 && (
                <SidebarAccordion title="ZIP Workspace Files" icon={<FolderArchive size={16} />} defaultOpen={true}>
                  <div className="flex flex-col gap-1 text-xs max-h-48 overflow-y-auto custom-scrollbar">
                    {zipFiles.map((fileItem) => (
                      <button 
                        key={fileItem.path}
                        onClick={() => handleSelectZipFile(fileItem)}
                        className={`p-2 rounded-xl text-left flex items-center justify-between transition-all ${
                          activeHtmlPath === fileItem.path 
                            ? 'bg-tg-light-primary dark:bg-tg-dark-primary text-white font-bold' 
                            : 'hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover text-tg-light-text dark:text-tg-dark-text'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {fileItem.isHtml ? <FileCode size={14} /> : fileItem.isImage ? <ImageIcon size={14} /> : <Code2 size={14} />}
                          <span className="truncate">{fileItem.name}</span>
                        </span>
                        {activeHtmlPath === fileItem.path && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </SidebarAccordion>
              )}

              <SidebarAccordion title="Configuration" icon={<Settings size={16} />} defaultOpen={true}>
                <SettingsPanel 
                  settings={settings} 
                  onUpdate={handleUpdateSetting} 
                  mode={mode}
                  onModeChange={setMode}
                />
              </SidebarAccordion>

              {/* Action Buttons */}
              <div className="hidden xl:flex flex-col gap-3">
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleExport}
                      className="h-10 bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover text-tg-light-hint dark:text-tg-dark-hint rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Download size={16} /> Export
                    </button>
                    <button 
                      onClick={clearAll}
                      className="h-10 bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <X size={16} /> Clear
                    </button>
                 </div>
              </div>
            </>
          ) : (
            <div className="hidden xl:flex flex-col gap-4 items-center w-full mt-4">
              <button 
                onClick={() => setIsDecodeMode(!isDecodeMode)}
                className="w-10 h-10 rounded-xl bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border flex items-center justify-center text-tg-light-primary dark:text-tg-dark-primary shadow-sm hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover"
                title={isDecodeMode ? "Switch to Encode" : "Switch to Decode"}
              >
                <ArrowRightLeft size={18} />
              </button>
              <button 
                onClick={handleExport}
                className="w-10 h-10 rounded-xl bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border flex items-center justify-center text-tg-light-hint dark:text-tg-dark-hint hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover"
                title="Export HTML"
              >
                <Download size={18} />
              </button>
              <button 
                onClick={clearAll}
                className="w-10 h-10 rounded-xl bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Clear All"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </aside>

        {/* Editors Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
           <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left Column: Input and Output */}
              <div className={`flex flex-col gap-4 transition-all duration-300 ${isPreviewOpen ? 'lg:col-span-4' : 'lg:col-span-11'}`}>
                <div className="flex-1 min-h-[200px] max-h-[400px] flex flex-col">
                  {detectMojibake(inputText) && !settings.autoFixEncoding && !isDecodeMode && (
                      <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center justify-between">
                         <span>Corrupted characters detected (e.g. Ã¼, Ã¤).</span>
                         <button onClick={() => handleUpdateSetting('autoFixEncoding', true)} className="underline font-semibold">Enable Auto-Fix</button>
                      </div>
                  )}
                  <TextAreaCard 
                    id="input"
                    label={isDecodeMode ? "Encoded Input" : "Raw Input"}
                    value={inputText}
                    onChange={(val) => setInputText(val || '')}
                    isDarkMode={document.documentElement.classList.contains('dark')}
                    placeholder={isDecodeMode ? "&lt;div&gt;Paste HTML entities here...&lt;/div&gt;" : "Paste raw text or upload ZIP..."}
                    allowFileUpload={true}
                    actions={
                      <>
                        <button 
                          onClick={handleFormatHtml}
                          className="p-1.5 rounded-md hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover text-tg-light-hint dark:text-tg-dark-hint transition-colors"
                          title="Format HTML"
                        >
                          <AlignLeft size={16} />
                        </button>
                        <button 
                          onClick={handleRemoveComments}
                          className="p-1.5 rounded-md hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover text-tg-light-hint dark:text-tg-dark-hint transition-colors"
                          title="Remove Comments"
                        >
                          <MessageSquareOff size={16} />
                        </button>
                      </>
                    }
                  />
                </div>
                
                {/* Arrow Indicator */}
                <div className="flex justify-center text-tg-light-hint dark:text-tg-dark-hint flex-shrink-0">
                  <ArrowDown size={24} />
                </div>

                <div className="flex-1 min-h-[200px] max-h-[400px] flex flex-col">
                  <TextAreaCard 
                    id="output"
                    label={isDecodeMode ? "Decoded Output" : "Encoded Output"}
                    value={outputText}
                    readOnly
                    onClear={() => setOutputText('')}
                    isDarkMode={document.documentElement.classList.contains('dark')}
                    placeholder="Result..."
                  />
                </div>
              </div>

              {/* Right Column: Live Preview */}
              <div className={`transition-all duration-300 ${isPreviewOpen ? 'lg:col-span-8 min-h-[400px] lg:min-h-[600px] flex flex-col lg:min-w-[600px]' : 'lg:col-span-1 flex flex-col items-center'}`}>
                {isPreviewOpen ? (
                  <LivePreviewCard htmlContent={previewHtml} onToggle={() => setIsPreviewOpen(false)} />
                ) : (
                  <div className="h-full w-full bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl shadow-soft border border-tg-light-border dark:border-tg-dark-border flex flex-col items-center py-4 gap-4">
                    <button 
                      onClick={() => setIsPreviewOpen(true)}
                      className="w-10 h-10 rounded-xl bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border flex items-center justify-center text-tg-light-hint dark:text-tg-dark-hint hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover"
                      title="Expand Preview"
                    >
                      <PanelRightOpen size={18} />
                    </button>
                    <div className="text-tg-light-hint dark:text-tg-dark-hint font-medium text-sm tracking-widest uppercase" style={{ writingMode: 'vertical-rl' }}>
                      Live Preview
                    </div>
                  </div>
                )}
              </div>

           </div>
        </div>

        {/* Right Sidebar (Html Analyzer) */}
        <aside className={`flex-shrink-0 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-32px)] xl:sticky xl:top-4 pb-8 custom-scrollbar transition-all duration-300 ${isRightSidebarOpen ? 'w-full xl:w-80' : 'w-full xl:w-16 items-center'}`}>
          {isRightSidebarOpen ? (
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <button 
                  onClick={() => setIsRightSidebarOpen(false)}
                  className="p-2 rounded-xl text-tg-light-hint dark:text-tg-dark-hint hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover transition-colors"
                  title="Collapse Analyzer"
                >
                  <PanelRightClose size={18} />
                </button>
              </div>
              <SidebarAccordion title="Analysis & Validation" icon={<Code2 size={16} />} defaultOpen={true}>
                <HtmlAnalyzer htmlContent={htmlToAnalyze} onToggle={() => setIsRightSidebarOpen(false)} />
              </SidebarAccordion>
            </div>
          ) : (
            <div className="h-full w-full bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl shadow-soft border border-tg-light-border dark:border-tg-dark-border flex flex-col items-center py-4 gap-4">
              <button 
                onClick={() => setIsRightSidebarOpen(true)}
                className="w-10 h-10 rounded-xl bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border flex items-center justify-center text-tg-light-hint dark:text-tg-dark-hint hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover"
                title="Expand Analyzer"
              >
                <PanelRightOpen size={18} />
              </button>
              <div className="text-tg-light-hint dark:text-tg-dark-hint font-medium text-sm tracking-widest uppercase" style={{ writingMode: 'vertical-rl' }}>
                HTML Analyzer
              </div>
            </div>
          )}
        </aside>

      </main>
    </div>
  );
};

export default HtmlTools;
