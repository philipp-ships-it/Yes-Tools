import React, { useState, useRef, useEffect } from 'react';
import { useToolTracking } from '../hooks/useToolTracking';
import { Image as ImageIcon, UploadCloud, Download, Settings2, Maximize, FileType, RefreshCw, X, Check, Activity, Trash2, Archive, Sparkles } from 'lucide-react';
import JSZip from 'jszip';
import { useLocation } from 'react-router-dom';

interface ProcessedFile {
  id: string;
  name: string;
  randomName?: string;
  originalFile: File;
  originalSrc: string;
  processedSrc: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
}

export const ImageTools: React.FC = () => {
  useToolTracking('Image Tools');
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  
  // Settings
  
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [maxWidth, setMaxWidth] = useState<string>('');
  const [renameToRandomString, setRenameToRandomString] = useState<boolean>(false);
  
  // NEW STATES
  const [upscaleFactor, setUpscaleFactor] = useState<number>(1);
  const [watermarkType, setWatermarkType] = useState<'none' | 'text' | 'image'>('none');
  const [watermarkText, setWatermarkText] = useState('DRAFT');
  const [watermarkColor, setWatermarkColor] = useState('rgba(255, 255, 255, 0.5)');
  const [watermarkPosition, setWatermarkPosition] = useState<'center' | 'bottom-right'>('bottom-right');
  const [watermarkImageSrc, setWatermarkImageSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const generateRandomName = () => {
    return 'img_' + Math.random().toString(36).substring(2, 10);
  };

  const getExportFilename = (file: ProcessedFile): string => {
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
    if (renameToRandomString) {
      const base = file.randomName || generateRandomName();
      return `${base}.${ext}`;
    }
    const originalBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    return `${originalBase}.${ext}`;
  };

  const handleWatermarkImage = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => setWatermarkImageSrc(e.target?.result as string);
          reader.readAsDataURL(file);
      }
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const location = useLocation();

  useEffect(() => {
    // If navigated here with files from PerformanceTools or elsewhere
    const stateFiles = location.state?.imageFiles as File[];
    if (stateFiles && stateFiles.length > 0) {
      handleFiles(stateFiles);
      // Clear state to avoid reprocessing on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFiles = (newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFiles(prev => [...prev, {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          name: file.name, // Keep original name!
          randomName: generateRandomName(),
          originalFile: file,
          originalSrc: e.target?.result as string,
          processedSrc: null,
          status: 'pending'
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  
  const processSingleImage = async (fileObj: ProcessedFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          reject('No canvas');
          return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('No context');
          return;
        }

        let width = img.width;
        let height = img.height;

        if (maxWidth && parseInt(maxWidth) > 0 && width > parseInt(maxWidth)) {
          const ratio = parseInt(maxWidth) / width;
          width = parseInt(maxWidth);
          height = height * ratio;
        }

        width = width * upscaleFactor;
        height = height * upscaleFactor;

        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        if (upscaleFactor > 1) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }

        ctx.drawImage(img, 0, 0, width, height);

        if (watermarkType === 'text' && watermarkText) {
           ctx.font = `${Math.max(20, width * 0.05)}px sans-serif`;
           ctx.fillStyle = watermarkColor;
           const textWidth = ctx.measureText(watermarkText).width;
           let x = width / 2 - textWidth / 2;
           let y = height / 2;
           if (watermarkPosition === 'bottom-right') {
               x = width - textWidth - (width * 0.05);
               y = height - (height * 0.05);
           }
           ctx.fillText(watermarkText, x, y);
        } else if (watermarkType === 'image' && watermarkImageSrc) {
           const wmImg = new Image();
           wmImg.onload = () => {
               const wmWidth = Math.min(width * 0.3, wmImg.width);
               const wmHeight = wmImg.height * (wmWidth / wmImg.width);
               let x = width / 2 - wmWidth / 2;
               let y = height / 2 - wmHeight / 2;
               if (watermarkPosition === 'bottom-right') {
                   x = width - wmWidth - (width * 0.05);
                   y = height - wmHeight - (height * 0.05);
               }
               ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
               resolve(canvas.toDataURL(format, quality / 100));
           };
           wmImg.onerror = () => resolve(canvas.toDataURL(format, quality / 100));
           wmImg.src = watermarkImageSrc;
           return;
        }

        const dataUrl = canvas.toDataURL(format, quality / 100);
        resolve(dataUrl);
      };
      img.onerror = () => reject('Image load error');
      img.src = fileObj.originalSrc;
    });
  };


  const processAll = async () => {
    if (files.length === 0) return;
    setIsProcessingBatch(true);

    const updatedFiles = [...files];
    for (let i = 0; i < updatedFiles.length; i++) {
       // Re-process all
       updatedFiles[i].status = 'processing';
       setFiles([...updatedFiles]);
       
       try {
         const dataUrl = await processSingleImage(updatedFiles[i]);
         updatedFiles[i].processedSrc = dataUrl;
         updatedFiles[i].status = 'done';
       } catch (error) {
         updatedFiles[i].status = 'error';
       }
       setFiles([...updatedFiles]);
       
       // Small delay to let UI breathe
       await new Promise(r => setTimeout(r, 50));
    }
    
    setIsProcessingBatch(false);
  };

  // Auto-process when settings change
  useEffect(() => {
    if (files.length > 0 && !isProcessingBatch) {
      processAll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, format, maxWidth]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDownloadAll = async () => {
    const doneFiles = files.filter(f => f.status === 'done' && f.processedSrc);
    if (doneFiles.length === 0) return;

    if (doneFiles.length === 1) {
       // Single file download
       const file = doneFiles[0];
       const a = document.createElement('a');
       a.href = file.processedSrc!;
       
       a.download = getExportFilename(file);
       
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       return;
    }

    // Batch download via ZIP
    const jszip = new JSZip();
    const usedNames = new Set<string>();

    doneFiles.forEach(file => {
      let exportName = getExportFilename(file);
      let counter = 1;
      const dotIdx = exportName.lastIndexOf('.');
      const base = dotIdx !== -1 ? exportName.substring(0, dotIdx) : exportName;
      const ext = dotIdx !== -1 ? exportName.substring(dotIdx) : '';
      while (usedNames.has(exportName)) {
        exportName = `${base}_${counter}${ext}`;
        counter++;
      }
      usedNames.add(exportName);

      const base64Data = file.processedSrc!.split(',')[1];
      jszip.file(exportName, base64Data, { base64: true });
    });

    const content = await jszip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-images.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };
  
  const clearAll = () => {
    setFiles([]);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const getProcessedSize = (src: string | null) => {
    if (!src) return 0;
    const base64Length = src.length - (src.indexOf(',') + 1);
    const padding = (src.charAt(src.length - 2) === '=') ? 2 : ((src.charAt(src.length - 1) === '=') ? 1 : 0);
    return (base64Length * 0.75) - padding;
  };

  const totalOriginalSize = files.reduce((acc, f) => acc + f.originalFile.size, 0);
  const totalProcessedSize = files.reduce((acc, f) => acc + getProcessedSize(f.processedSrc), 0);
  const totalSaved = Math.max(0, totalOriginalSize - totalProcessedSize);

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white shadow-md">
            <ImageIcon size={20} />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight text-tg-light-text dark:text-tg-dark-text">Batch Image Tools</h1>
            <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">Compress, resize, and convert multiple images at once</p>
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={clearAll}
              disabled={isProcessingBatch}
              className="flex items-center gap-2 px-4 py-2 bg-tg-light-surface dark:bg-tg-dark-surface hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-tg-light-border dark:border-tg-dark-border hover:border-red-200 dark:hover:border-red-800 rounded-xl text-sm font-medium transition-colors"
            >
              <Trash2 size={16} /> Clear All
            </button>
            <button 
               onClick={handleDownloadAll}
               disabled={isProcessingBatch || files.filter(f => f.status === 'done').length === 0}
               className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
             >
               {files.length > 1 ? <Archive size={16} /> : <Download size={16} />} 
               Download {files.length > 1 ? 'All (ZIP)' : ''}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
        {/* Left Column: Settings & Dropzone */}
        <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          
          {/* Dropzone */}
          <div 
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' 
                : 'border-tg-light-border dark:border-tg-dark-border bg-tg-light-surface dark:bg-tg-dark-surface hover:border-orange-400 dark:hover:border-orange-600'
            }`}
          >
            <input 
              type="file" 
              accept="image/*" 
              multiple
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${isDragging ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-tg-light-bg dark:bg-tg-dark-bg text-tg-light-hint dark:text-tg-dark-hint'}`}>
              <UploadCloud size={24} />
            </div>
            <h3 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text mb-1">
              {isDragging ? 'Drop images here' : 'Upload Images'}
            </h3>
            <p className="text-xs text-tg-light-hint dark:text-tg-dark-hint">
              Drag & drop multiple files or a zip
            </p>
          </div>

          {/* Settings */}
          <div className="bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border rounded-2xl p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-tg-light-border dark:border-tg-dark-border pb-3">
               <div className="flex items-center gap-2 text-sm font-semibold text-tg-light-text dark:text-tg-dark-text">
                 <Settings2 size={16} className="text-tg-light-primary dark:text-tg-dark-primary" />
                 Optimization Settings
               </div>
               
               {files.length > 0 && (
                 <button 
                  onClick={processAll} 
                  disabled={isProcessingBatch}
                  className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-800/40 text-orange-700 dark:text-orange-400 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                 >
                   {isProcessingBatch ? 'Processing...' : 'Apply & Process'}
                 </button>
               )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint flex items-center gap-1.5">
                <FileType size={14} /> Output Format
              </label>
              <select 
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-lg px-3 py-2 text-sm text-tg-light-text dark:text-tg-dark-text focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="image/webp">WebP (Recommended)</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
              </select>
            </div>

            {format !== 'image/png' && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint flex items-center gap-1.5">
                    <RefreshCw size={14} /> Quality
                  </label>
                  <span className="text-xs font-medium text-tg-light-text dark:text-tg-dark-text">{quality}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint flex items-center gap-1.5">
                <Maximize size={14} /> Max Width (px)
              </label>
              <input 
                type="number" 
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value)}
                placeholder="e.g. 800 (leave empty for original)"
                className="w-full bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-lg px-3 py-2 text-sm text-tg-light-text dark:text-tg-dark-text focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            
            
            {/* Upscaler */}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-tg-light-border dark:border-tg-dark-border">
              <label className="text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint flex items-center gap-1.5">
                <Maximize size={14} /> Upscaler
              </label>
              <select 
                value={upscaleFactor}
                onChange={(e) => setUpscaleFactor(parseFloat(e.target.value))}
                className="w-full bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-lg px-3 py-2 text-sm text-tg-light-text dark:text-tg-dark-text focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value={1}>1x (Original)</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </div>

            {/* Watermark */}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-tg-light-border dark:border-tg-dark-border">
              <label className="text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint flex items-center gap-1.5">
                <Settings2 size={14} /> Batch Watermark
              </label>
              <select 
                value={watermarkType}
                onChange={(e) => setWatermarkType(e.target.value as any)}
                className="w-full bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-lg px-3 py-2 text-sm text-tg-light-text dark:text-tg-dark-text focus:outline-none focus:border-orange-500 transition-colors mb-2"
              >
                <option value="none">None</option>
                <option value="text">Text Watermark</option>
                <option value="image">Image Logo</option>
              </select>

              {watermarkType === 'text' && (
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Watermark Text"
                    className="w-full bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-lg px-3 py-2 text-sm text-tg-light-text dark:text-tg-dark-text focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <input 
                    type="text" 
                    value={watermarkColor}
                    onChange={(e) => setWatermarkColor(e.target.value)}
                    placeholder="Color (e.g. rgba(255,255,255,0.5))"
                    className="w-full bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-lg px-3 py-2 text-sm text-tg-light-text dark:text-tg-dark-text focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              )}
              {watermarkType === 'image' && (
                <div className="flex flex-col gap-2">
                   <input type="file" accept="image/png, image/jpeg" className="hidden" ref={watermarkInputRef} onChange={handleWatermarkImage} />
                   <button onClick={() => watermarkInputRef.current?.click()} className="w-full bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-lg px-3 py-2 text-sm text-tg-light-text dark:text-tg-dark-text focus:outline-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                     {watermarkImageSrc ? 'Change Logo' : 'Upload Logo'}
                   </button>
                   {watermarkImageSrc && <img src={watermarkImageSrc} alt="watermark" className="h-10 object-contain self-start bg-black/5 dark:bg-white/5 rounded p-1" />}
                </div>
              )}
              {watermarkType !== 'none' && (
                 <select 
                    value={watermarkPosition}
                    onChange={(e) => setWatermarkPosition(e.target.value as any)}
                    className="w-full bg-tg-light-bg dark:bg-tg-dark-bg border border-tg-light-border dark:border-tg-dark-border rounded-lg px-3 py-2 text-sm text-tg-light-text dark:text-tg-dark-text focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="center">Center</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
              )}
            </div>

            {/* Rename to Random String Option */}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-tg-light-border dark:border-tg-dark-border">
              <label className="text-xs font-semibold text-tg-light-text dark:text-tg-dark-text flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={renameToRandomString}
                  onChange={(e) => setRenameToRandomString(e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded border-tg-light-border dark:border-tg-dark-border focus:ring-orange-500 accent-orange-500 cursor-pointer"
                />
                <Sparkles size={14} className="text-orange-500 shrink-0" />
                <span>Dateinamen in Zufalls-String umbenennen</span>
              </label>
              <p className="text-[11px] text-tg-light-hint dark:text-tg-dark-hint pl-6">
                Ersetzt Dateinamen beim Export durch anonymisierte Zufallsstrings (z. B. <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded font-mono">img_a8x9f2k1.webp</code>).
              </p>
            </div>

            {files.length > 0 && (
              <div className="mt-4 pt-4 border-t border-tg-light-border dark:border-tg-dark-border flex flex-col gap-3">
                <div className="text-xs font-semibold text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">Batch Stats</div>
                <div className="flex justify-between text-sm">
                  <span className="text-tg-light-text dark:text-tg-dark-text">Total files:</span>
                  <span className="font-semibold">{files.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-tg-light-text dark:text-tg-dark-text">Original size:</span>
                  <span className="font-semibold">{formatBytes(totalOriginalSize)}</span>
                </div>
                {files.some(f => f.status === 'done') && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-tg-light-text dark:text-tg-dark-text">Optimized size:</span>
                      <span className="font-semibold text-emerald-500">{formatBytes(totalProcessedSize)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1 pt-1 border-t border-dashed border-tg-light-border dark:border-tg-dark-border">
                      <span className="text-tg-light-text dark:text-tg-dark-text font-medium">Space saved:</span>
                      <span className="font-bold text-emerald-500">{formatBytes(totalSaved)} ({(totalSaved / totalOriginalSize * 100).toFixed(1)}%)</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Files List / Preview */}
        <div className="flex-1 min-w-0 bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border rounded-2xl p-4 md:p-6 overflow-hidden flex flex-col">
          
          <div className="flex items-center justify-between border-b border-tg-light-border dark:border-tg-dark-border pb-4 mb-4 shrink-0">
            <h2 className="text-base font-semibold text-tg-light-text dark:text-tg-dark-text flex items-center gap-2">
              <ImageIcon size={18} className="text-orange-500" />
              Batch Overview
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {files.length === 0 ? (
              <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center text-tg-light-hint dark:text-tg-dark-hint gap-3 border-2 border-dashed border-tg-light-border dark:border-tg-dark-border rounded-xl">
                <ImageIcon size={48} className="opacity-20" />
                <p>Upload images to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {files.map(file => (
                  <div key={file.id} className="border border-tg-light-border dark:border-tg-dark-border bg-tg-light-bg dark:bg-tg-dark-bg rounded-xl overflow-hidden flex flex-col shadow-sm">
                    {/* Image Preview Area */}
                    <div className="h-32 bg-tg-light-secondary/20 dark:bg-tg-dark-secondary/20 relative flex items-center justify-center border-b border-tg-light-border dark:border-tg-dark-border group">
                      <img src={file.processedSrc || file.originalSrc} alt={file.name} className="max-w-full max-h-full object-contain p-2" />
                      <button 
                        onClick={() => removeFile(file.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      >
                        <X size={14} />
                      </button>
                      
                      {/* Status Overlay */}
                      {file.status === 'processing' && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                          <Activity className="text-white animate-spin" size={24} />
                        </div>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="p-3 flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-tg-light-text dark:text-tg-dark-text truncate" title={file.name}>
                          {file.name}
                        </div>
                        {file.status === 'done' && file.processedSrc && (
                          <button
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = file.processedSrc!;
                              a.download = getExportFilename(file);
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                            className="p-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 transition-colors shrink-0 flex items-center gap-1 font-medium text-[11px]"
                            title={`Download (${getExportFilename(file)})`}
                          >
                            <Download size={12} />
                          </button>
                        )}
                      </div>

                      {renameToRandomString && (
                        <div className="text-[11px] font-mono text-orange-600 dark:text-orange-400 font-semibold truncate flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-md self-start" title={`Export Name: ${getExportFilename(file)}`}>
                          <Sparkles size={11} className="shrink-0" />
                          <span className="truncate">{getExportFilename(file)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-tg-light-hint dark:text-tg-dark-hint">
                        <span>Original:</span>
                        <span>{formatBytes(file.originalFile.size)}</span>
                      </div>
                      
                      {file.status === 'done' ? (
                        <>
                          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                            <span>Optimized:</span>
                            <span>{formatBytes(getProcessedSize(file.processedSrc))}</span>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-500 mt-1">
                            <Check size={12} /> Saved {((file.originalFile.size - getProcessedSize(file.processedSrc)) / file.originalFile.size * 100).toFixed(0)}%
                          </div>
                        </>
                      ) : file.status === 'error' ? (
                        <div className="text-red-500 font-medium">Optimization failed</div>
                      ) : (
                        <div className="text-tg-light-hint dark:text-tg-dark-hint italic">Pending...</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

