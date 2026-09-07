import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, ArrowRight, FileCode2, Code2, Settings2, ImageIcon, Scissors, Undo2 } from 'lucide-react';
import * as mammoth from 'mammoth';
import { useNavigate } from 'react-router-dom';
import { TextAreaCard } from '@/components/legacy/TextAreaCard';
import { LivePreviewCard } from '@/components/legacy/LivePreviewCard';
import { formatMsoHtml } from '../utils/msoFormatter';
import { html as beautifyHtml } from 'js-beautify';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToolTracking } from '../hooks/useToolTracking';
import { useAppStore } from '../store/appStore';
import { useCrossToolStore } from '../store/crossToolStore';
import { ChangeRequestModal, ChangeRequestItem } from '../components/ChangeRequestModal';

interface ExtractedImage {
  name: string;
  dataUrl: string; // base64 Data URL (webp)
}

export const WordToHtml: React.FC = () => {
  useToolTracking('Word To Html');
  const { wordHtmlOutput: htmlOutput, wordEmbedImages: embedImages, setWordState } = useAppStore();
  const [history, setHistory] = useState<string[]>([]);
    const setHtmlOutput = (val: string) => setWordState({ wordHtmlOutput: val });
  const setEmbedImages = (val: boolean) => setWordState({ wordEmbedImages: val });

  const [fullHtmlOutput, setFullHtmlOutput] = useLocalStorage('word-fullHtmlOutput', ''); // Store the full HTML across all pages
  const [pages, setPages] = useLocalStorage<string[]>('word-pages', []);
  const [selectedPages, setSelectedPages] = useLocalStorage<string>('word-selectedPages', ''); // e.g. "1, 3-5"

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useLocalStorage<string | null>('word-fileName', null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedImages, setExtractedImages] = useLocalStorage<ExtractedImage[]>('word-extractedImages', []);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);

  // Change Request Safeguard State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingConvert, setPendingConvert] = useState<{
    items: ChangeRequestItem[];
    currentImages: ExtractedImage[];
    rawHtml: string;
    formattedHtml: string;
    pageSplit: string[];
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const setActiveToolContext = useCrossToolStore((s) => s.setActiveToolContext);

  useEffect(() => {
    setActiveToolContext({
      toolId: 'wordtohtml',
      toolName: 'Word to HTML Converter',
      activeCode: htmlOutput,
      activeFileName: fileName || 'Document.docx',
      language: 'html'
    });
  }, [htmlOutput, fileName, setActiveToolContext]);

  useEffect(() => {
    const handleInjectCode = (e: CustomEvent<{ code: string; toolId?: string }>) => {
      if (!e.detail?.code) return;
      if (!e.detail.toolId || e.detail.toolId === 'wordtohtml') {
        setHtmlOutput(e.detail.code);
      }
    };
    window.addEventListener('yes-inject-code', handleInjectCode as EventListener);
    return () => window.removeEventListener('yes-inject-code', handleInjectCode as EventListener);
  }, []);

  const handleImportToHtmlTools = () => {
    if (!htmlOutput) return;
    localStorage.setItem('html-tools-input', JSON.stringify(htmlOutput));
    navigate('/');
  };

  const handleSendToImageTools = async () => {
    if (extractedImages.length === 0) return;
    
    // Convert base64 data URLs to File objects
    const imageFiles = await Promise.all(extractedImages.map(async (img) => {
      const res = await fetch(img.dataUrl);
      const blob = await res.blob();
      return new File([blob], img.name, { type: 'image/webp' });
    }));

    navigate('/imagetools', { state: { imageFiles } });
  };

  const convertToBase64WebP = (contentType: string, base64Data: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/webp', 0.9));
        } else {
          resolve(`data:${contentType};base64,${base64Data}`);
        }
      };
      img.onerror = () => {
        resolve(`data:${contentType};base64,${base64Data}`); // fallback
      };
      img.src = `data:${contentType};base64,${base64Data}`;
    });
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      alert('Please upload a .docx file.');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);
    setExtractedImages([]);
    setPages([]);
    setSelectedPages('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const currentImages: ExtractedImage[] = [];
      let imageIndex = 1;

      const options: any = {
        styleMap: [
          "br[type='page'] => hr.page-break:empty"
        ]
      };

      options.convertImage = mammoth.images.imgElement(function(image: any) {
        return image.read("base64").then(async function(imageBuffer: string) {
          // Convert to WebP
          const webpDataUrl = await convertToBase64WebP(image.contentType, imageBuffer);
          const filename = `image-${imageIndex++}.webp`;
          
          currentImages.push({
            name: filename,
            dataUrl: webpDataUrl
          });

          if (embedImages) {
            return { src: webpDataUrl };
          } else {
            // Do not embed image in code, return a placeholder or src to filename
            return { src: filename, alt: 'Extracted Image' };
          }
        });
      });

      const result = await mammoth.convertToHtml({ arrayBuffer }, options);
      const rawHtml = result.value;
      const pageSplit = rawHtml.split('<hr class="page-break" />');
      const formattedHtml = formatMsoHtml(rawHtml, { indent_size: 2, wrap_line_length: 0, preserve_newlines: true });

      const modalItems: ChangeRequestItem[] = [
        {
          id: 'doc_transpile_html',
          type: 'transpile',
          title: `DOCX HTML Transpilation: ${file.name}`,
          description: `Transpile OpenXML format from Word document into clean HTML code structure (${pageSplit.length} page section(s)).`,
          beforeSnippet: 'Current Workspace State',
          afterSnippet: formattedHtml.slice(0, 300) + '...'
        },
        ...currentImages.map((img, idx) => ({
          id: `doc_img_${idx}`,
          type: 'injection' as const,
          title: `Extracted Image Asset #${idx + 1}: ${img.name}`,
          description: `Extracted & converted image asset to WebP format (${embedImages ? 'Data URL Embedded' : 'External Asset Ref'})`,
          afterSnippet: `<img src="${img.name}" alt="Extracted Image" />`
        }))
      ];

      setPendingConvert({
        items: modalItems,
        currentImages,
        rawHtml,
        formattedHtml,
        pageSplit,
        fileName: file.name
      });
      setIsModalOpen(true);
      
      if (result.messages.length > 0) {
        console.warn('Mammoth messages:', result.messages);
      }
    } catch (error) {
      console.error('Error converting Word document:', error);
      alert('Error converting document. Please ensure it is a valid .docx file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWordModal = (selectedIds: string[]) => {
    if (!pendingConvert) return;
    const selectedSet = new Set(selectedIds);

    if (selectedSet.has('doc_transpile_html')) {
      setFileName(pendingConvert.fileName);
      setPages(pendingConvert.pageSplit);
      setFullHtmlOutput(pendingConvert.rawHtml);
      setHtmlOutput(pendingConvert.formattedHtml);
    }

    const filteredImages = pendingConvert.currentImages.filter((_, idx) => selectedSet.has(`doc_img_${idx}`));
    setExtractedImages(filteredImages);
    setIsModalOpen(false);
  };

  const updateHtmlOutput = (pageArray: string[], selectionStr: string) => {
    let finalHtml = '';
    
    if (!selectionStr.trim()) {
      // Show all
      finalHtml = pageArray.join('<hr class="page-break" />');
    } else {
      // Parse selection string (e.g. "1, 2, 4-6")
      const requestedIndexes = new Set<number>();
      const parts = selectionStr.split(',');
      parts.forEach(p => {
        const range = p.trim().split('-');
        if (range.length === 1) {
          const num = parseInt(range[0]);
          if (!isNaN(num) && num >= 1 && num <= pageArray.length) {
            requestedIndexes.add(num - 1);
          }
        } else if (range.length === 2) {
          const start = parseInt(range[0]);
          const end = parseInt(range[1]);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= pageArray.length) {
                requestedIndexes.add(i - 1);
              }
            }
          }
        }
      });
      
      const selected = Array.from(requestedIndexes).sort((a, b) => a - b).map(i => pageArray[i]);
      finalHtml = selected.join('<hr class="page-break" />');
    }

    const formattedHtml = formatMsoHtml(finalHtml, {
      indent_size: 2,
      wrap_line_length: 0,
      preserve_newlines: true,
    });
    setHtmlOutput(formattedHtml);
  };

  useEffect(() => {
    if (pages.length > 0) {
      updateHtmlOutput(pages, selectedPages);
    }
  }, [selectedPages, pages]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-md">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight text-tg-light-text dark:text-tg-dark-text">Word to HTML</h1>
            <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">Convert .docx files to clean HTML</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-xl transition-colors ${showSettings ? 'bg-tg-light-hover dark:bg-tg-dark-hover text-blue-600 dark:text-blue-400' : 'text-tg-light-hint dark:text-tg-dark-hint hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover'}`}
        >
          <Settings2 size={20} />
        </button>

        {showSettings && (
          <div className="absolute right-0 top-12 z-20 w-72 bg-white dark:bg-[#1E1E1E] border border-tg-light-border dark:border-tg-dark-border rounded-xl shadow-xl p-4 flex flex-col gap-4">
            <h3 className="font-semibold text-sm border-b border-tg-light-border dark:border-tg-dark-border pb-2">Settings</h3>
            
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-tg-light-text dark:text-tg-dark-text group-hover:text-blue-600 transition-colors">Embed Images in Code</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={embedImages} onChange={(e) => setEmbedImages(e.target.checked)} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${embedImages ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${embedImages ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
            <p className="text-xs text-tg-light-hint dark:text-tg-dark-hint mt-[-8px]">
              If off, images are replaced with placeholder filenames and not converted to heavy base64 strings in the HTML.
            </p>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-tg-light-text dark:text-tg-dark-text flex items-center gap-1">
                <Scissors size={14} /> Page Selection
              </label>
              <input 
                type="text" 
                value={selectedPages}
                onChange={(e) => setSelectedPages(e.target.value)}
                placeholder="e.g. 1-3, 5 (leave empty for all)"
                className="w-full bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-tg-light-hint dark:text-tg-dark-hint mt-1">Requires hard page breaks in the Word file.</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
        {/* Left Column: Dropzone & Output */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Dropzone */}
          <div 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-shrink-0 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                : 'border-tg-light-border dark:border-tg-dark-border bg-tg-light-surface dark:bg-tg-dark-surface hover:border-blue-400 dark:hover:border-blue-600'
            }`}
          >
            <input 
              type="file" 
              accept=".docx" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileInput}
            />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-tg-light-bg dark:bg-tg-dark-bg text-tg-light-hint dark:text-tg-dark-hint'}`}>
              {isLoading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div> : <UploadCloud size={32} />}
            </div>
            <h3 className="text-lg font-semibold text-tg-light-text dark:text-tg-dark-text mb-1">
              {isLoading ? 'Converting...' : isDragging ? 'Drop Word file here' : 'Drag & drop a .docx file'}
            </h3>
            <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint max-w-sm">
              {fileName ? `Last uploaded: ${fileName}` : 'or click to browse your computer.'}
            </p>
          </div>

          {/* Extracted Images Panel */}
          {extractedImages.length > 0 && (
            <div className="flex-shrink-0 bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Extracted Images</h3>
                  <p className="text-xs text-tg-light-hint dark:text-tg-dark-hint">{extractedImages.length} image{extractedImages.length > 1 ? 's' : ''} found in document.</p>
                </div>
              </div>
              <button 
                onClick={handleSendToImageTools}
                className="flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Send to Image Tools <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* HTML Output */}
          <div className="flex-1 min-h-[300px] flex flex-col">
            <TextAreaCard 
              id="word-html-output"
              label={`Generated HTML ${pages.length > 1 ? `(${pages.length} Pages)` : ''}`}
              value={htmlOutput}
              onChange={(val) => {
                if (Math.abs((val || '').length - htmlOutput.length) > 10) {
                    setHistory(prev => [htmlOutput, ...prev].slice(0, 5));
                }
                setHtmlOutput(val || '');
              }}
              isDarkMode={document.documentElement.classList.contains('dark')}
              placeholder="Converted HTML will appear here..."
              actions={
                <>
                  {htmlOutput && (
                    <button 
                      onClick={handleImportToHtmlTools}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors mr-2"
                      title="Send this HTML to the main HTML Tools editor"
                    >
                      <Code2 size={14} />
                      Import to HTML Tools
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setHistory(prev => [htmlOutput, ...prev].slice(0, 5));
                      const formatted = beautifyHtml(htmlOutput, { indent_size: 2, wrap_line_length: 0, preserve_newlines: true });
                      setHtmlOutput(formatted);
                    }}
                    className="p-1.5 rounded-md hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover text-tg-light-hint dark:text-tg-dark-hint transition-colors"
                    title="Format HTML"
                  >
                    <FileCode2 size={16} />
                  </button>
                  <button 
                     onClick={() => {
                       if (history.length > 0) {
                         setHtmlOutput(history[0]);
                         setHistory(prev => prev.slice(1));
                       }
                     }}
                     disabled={history.length === 0}
                     className={`p-1.5 rounded-md transition-colors ${history.length > 0 ? 'text-tg-light-text dark:text-tg-dark-text hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover' : 'text-tg-light-hint dark:text-tg-dark-hint opacity-50 cursor-not-allowed'}`}
                     title="Undo"
                  >
                    <Undo2 size={16} />
                  </button>
                </>
              }
            />
          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className="w-full xl:w-[400px] 2xl:w-[500px] flex-shrink-0 flex flex-col min-h-0">
          <div className="h-full flex flex-col bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl shadow-soft border border-tg-light-border dark:border-tg-dark-border overflow-hidden">
            <div className="px-4 py-3 border-b border-tg-light-border dark:border-tg-dark-border bg-tg-light-secondary/30 dark:bg-tg-dark-secondary/30 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-tg-light-text dark:text-tg-dark-text">
                Live Preview
              </h3>
            </div>
            <div className="flex-1 overflow-hidden relative p-2">
              <div className="absolute inset-0 p-2">
                {htmlOutput ? (
                  <LivePreviewCard htmlContent={htmlOutput} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-tg-light-hint dark:text-tg-dark-hint text-center p-8">
                    <ArrowRight size={32} className="mb-4 opacity-20" />
                    <p>Upload a Word document to see the preview.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChangeRequestModal
        isOpen={isModalOpen}
        title="Word Document Conversion Interceptor"
        operationCategory="Word (.docx) to HTML Transpiler"
        riskLevel="medium"
        summaryDescription={`Converting ${pendingConvert?.fileName || 'document'} will generate HTML code and extract image assets. Review and select changes to apply.`}
        items={pendingConvert?.items || []}
        onConfirm={handleConfirmWordModal}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default WordToHtml;
