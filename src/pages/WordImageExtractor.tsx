import React, { useState, useRef } from 'react';
import { 
  FileCheck, 
  Upload, 
  Download, 
  Image as ImageIcon, 
  Trash2, 
  CheckSquare, 
  Square, 
  Layers, 
  Sparkles, 
  Eye, 
  Copy, 
  Check, 
  Maximize2,
  FileText,
  RefreshCw,
  Archive
} from 'lucide-react';
import JSZip from 'jszip';
import { useToolTracking } from '../hooks/useToolTracking';

interface ExtractedImageItem {
  id: string;
  name: string;
  originalExtension: string;
  blob: Blob;
  url: string;
  sizeBytes: number;
  width: number;
  height: number;
  selected: boolean;
  docName: string;
}

export const WordImageExtractor: React.FC = () => {
  useToolTracking('Word Image Extractor');

  const [images, setImages] = useState<ExtractedImageItem[]>([]);
  const [docNames, setDocNames] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<ExtractedImageItem | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Conversion Options
  const [targetFormat, setTargetFormat] = useState<'original' | 'webp' | 'png' | 'jpeg'>('original');
  const [quality, setQuality] = useState(85);
  const [scale, setScale] = useState<number>(1); // 1 = 100%, 0.75, 0.5, etc.

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processWordFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processWordFiles(Array.from(e.dataTransfer.files));
    }
  };

  const processWordFiles = async (files: File[]) => {
    const docxFiles = files.filter(f => f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.doc'));
    if (docxFiles.length === 0) {
      alert('Bitte lade mindestens eine gültige .docx Word-Datei hoch.');
      return;
    }

    setIsExtracting(true);
    const newExtracted: ExtractedImageItem[] = [];
    const newDocNames: string[] = [];

    for (const file of docxFiles) {
      newDocNames.push(file.name);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const mediaFolder = zip.folder('word/media');

        if (mediaFolder) {
          const mediaFiles = Object.keys(mediaFolder.files);
          for (const filePath of mediaFiles) {
            const zipEntry = mediaFolder.files[filePath];
            if (!zipEntry.dir) {
              const blob = await zipEntry.async('blob');
              const cleanFileName = filePath.replace('word/media/', '');
              const ext = cleanFileName.split('.').pop()?.toLowerCase() || 'png';
              const objectUrl = URL.createObjectURL(blob);

              // Measure image dimensions
              const dimensions = await getImageDimensions(objectUrl);

              newExtracted.push({
                id: `${file.name}-${cleanFileName}-${Math.random().toString(36).substr(2, 6)}`,
                name: cleanFileName,
                originalExtension: ext,
                blob,
                url: objectUrl,
                sizeBytes: blob.size,
                width: dimensions.width,
                height: dimensions.height,
                selected: true,
                docName: file.name
              });
            }
          }
        }
      } catch (err) {
        console.error(`Fehler beim Verarbeiten von ${file.name}:`, err);
      }
    }

    setImages(prev => [...prev, ...newExtracted]);
    setDocNames(prev => Array.from(new Set([...prev, ...newDocNames])));
    setIsExtracting(false);
  };

  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = url;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const toggleSelectAll = () => {
    const allSelected = images.every(img => img.selected);
    setImages(prev => prev.map(img => ({ ...img, selected: !allSelected })));
  };

  const toggleSelectImage = (id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, selected: !img.selected } : img));
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    setDocNames([]);
  };

  // Convert single image blob to target format/scale
  const convertImageBlob = async (item: ExtractedImageItem): Promise<{ blob: Blob; filename: string }> => {
    if (targetFormat === 'original' && scale === 1) {
      return { blob: item.blob, filename: item.name };
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetWidth = Math.max(1, Math.round(img.width * scale));
        const targetHeight = Math.max(1, Math.round(img.height * scale));

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ blob: item.blob, filename: item.name });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        let mimeType = 'image/png';
        let ext = 'png';

        if (targetFormat === 'webp') {
          mimeType = 'image/webp';
          ext = 'webp';
        } else if (targetFormat === 'jpeg') {
          mimeType = 'image/jpeg';
          ext = 'jpg';
          // Fill background white for JPEG transparency
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else if (targetFormat === 'original') {
          ext = item.originalExtension;
          mimeType = item.blob.type || `image/${ext}`;
        }

        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        const outName = `${baseName}.${ext}`;

        canvas.toBlob(
          (convertedBlob) => {
            if (convertedBlob) {
              resolve({ blob: convertedBlob, filename: outName });
            } else {
              resolve({ blob: item.blob, filename: item.name });
            }
          },
          mimeType,
          quality / 100
        );
      };
      img.onerror = () => resolve({ blob: item.blob, filename: item.name });
      img.src = item.url;
    });
  };

  const downloadSingleImage = async (item: ExtractedImageItem) => {
    const { blob, filename } = await convertImageBlob(item);
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  const copyImageToClipboard = async (item: ExtractedImageItem) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('Kopieren in Zwischenablage wird von diesem Browser/Bildtyp nicht unterstützt.');
    }
  };

  const downloadSelectedZip = async () => {
    const selectedImages = images.filter(img => img.selected);
    if (selectedImages.length === 0) {
      alert('Bitte wähle mindestens ein Bild zum Download aus.');
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folderName = docNames.length === 1 
        ? docNames[0].replace('.docx', '') + '_bilder' 
        : 'word_extracted_images';

      const imgFolder = zip.folder(folderName) || zip;

      for (let i = 0; i < selectedImages.length; i++) {
        const item = selectedImages[i];
        const { blob, filename } = await convertImageBlob(item);
        imgFolder.file(filename, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Fehler beim Erstellen der ZIP-Datei:', err);
      alert('Erstellen der ZIP-Datei fehlgeschlagen.');
    } finally {
      setIsZipping(false);
    }
  };

  const selectedCount = images.filter(i => i.selected).length;
  const totalSizeBytes = images.filter(i => i.selected).reduce((acc, curr) => acc + curr.sizeBytes, 0);

  return (
    <div className="h-full w-full flex flex-col bg-[#FAFAFA] dark:bg-[#111111] text-black dark:text-white overflow-y-auto custom-scrollbar p-4 md:p-8">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-sm">
              <Archive size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Word Image Extractor</h1>
              <p className="text-sm text-black/60 dark:text-white/60">
                Extrahiere alle enthaltenen Bilder aus Word (.docx) Dokumenten direkt als ZIP – in Originalqualität, WebP, PNG oder JPEG.
              </p>
            </div>
          </div>

          {images.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={clearAll}
                className="px-4 py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-medium transition-all flex items-center gap-2"
              >
                <Trash2 size={16} /> Alle löschen
              </button>
            </div>
          )}
        </div>

        {/* Upload Dropzone */}
        {images.length === 0 ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-black/15 dark:border-white/15 hover:border-blue-500 dark:hover:border-blue-400 bg-white/60 dark:bg-[#1A1A1A]/60 rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 group shadow-sm"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".docx,.doc" 
              multiple 
              className="hidden" 
            />
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 flex items-center justify-center transition-all">
              <Upload size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Word-Dokumente (.docx) hier ablegen oder klicken</h3>
              <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                Unterstützt mehrfaches Hochladen. Alle Bilder werden direkt im Browser extrahiert.
              </p>
            </div>
            <span className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-medium text-sm shadow-md group-hover:bg-blue-600 transition-all">
              <FileText size={16} /> Word-Datei wählen
            </span>
          </div>
        ) : (
          /* Controls & Format Options Header */
          <div className="bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left: Summary & Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="p-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm font-semibold flex items-center gap-2"
                >
                  {images.every(i => i.selected) ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                  <span>{images.every(i => i.selected) ? 'Alle abwählen' : 'Alle auswählen'}</span>
                </button>
                <span className="text-sm font-medium text-black/70 dark:text-white/70">
                  {selectedCount} von {images.length} ausgewählt ({formatFileSize(totalSizeBytes)})
                </span>
              </div>
            </div>

            {/* Middle: Format & Quality Controls */}
            <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 lg:border-l border-black/10 dark:border-white/10 pt-4 lg:pt-0 lg:pl-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-black/50 dark:text-white/50">Format:</span>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value as any)}
                  className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="original">Original Format</option>
                  <option value="webp">WebP (Komprimiert)</option>
                  <option value="png">PNG (Verlustfrei)</option>
                  <option value="jpeg">JPEG (Standard)</option>
                </select>
              </div>

              {targetFormat !== 'original' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-black/50 dark:text-white/50">Qualität:</span>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={quality} 
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-24 accent-blue-500" 
                  />
                  <span className="text-xs font-mono w-8">{quality}%</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-black/50 dark:text-white/50">Skalierung:</span>
                <select
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Original (100%)</option>
                  <option value={0.75}>75% Größe</option>
                  <option value={0.5}>50% Größe</option>
                  <option value={0.25}>25% Größe</option>
                </select>
              </div>
            </div>

            {/* Right: ZIP Download Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm font-medium flex items-center gap-2"
                title="Weitere Word-Datei hinzufügen"
              >
                <Upload size={18} />
                <span className="hidden sm:inline">Mehr laden</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".docx,.doc" 
                multiple 
                className="hidden" 
              />

              <button
                onClick={downloadSelectedZip}
                disabled={selectedCount === 0 || isZipping}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                {isZipping ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                <span>Als ZIP herunterladen ({selectedCount})</span>
              </button>
            </div>

          </div>
        )}

        {/* Loading Indicator */}
        {isExtracting && (
          <div className="flex items-center justify-center p-12 bg-white dark:bg-[#1A1A1A] rounded-3xl border border-black/10 dark:border-white/10 shadow-sm gap-3">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
            <span className="font-semibold text-base">Extrahiere Bilder aus Word-Dokument...</span>
          </div>
        )}

        {/* Extracted Images Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img) => (
              <div 
                key={img.id}
                className={`group relative bg-white dark:bg-[#1A1A1A] border transition-all duration-200 rounded-2xl overflow-hidden flex flex-col shadow-sm ${
                  img.selected 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-video bg-black/5 dark:bg-white/5 overflow-hidden flex items-center justify-center p-2">
                  <img 
                    src={img.url} 
                    alt={img.name} 
                    className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105" 
                  />

                  {/* Selection Checkbox */}
                  <button
                    onClick={() => toggleSelectImage(img.id)}
                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/70 transition-all z-10"
                  >
                    {img.selected ? <CheckSquare size={18} className="text-blue-400" /> : <Square size={18} />}
                  </button>

                  {/* Lightbox / Preview Button */}
                  <button
                    onClick={() => setLightboxImage(img)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all"
                    title="Großansicht"
                  >
                    <Maximize2 size={16} />
                  </button>

                  {/* Extension Badge */}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono uppercase text-white tracking-wider">
                    {img.originalExtension}
                  </span>
                </div>

                {/* Details Body */}
                <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                  <div>
                    <h4 className="font-semibold text-sm truncate" title={img.name}>
                      {img.name}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-black/50 dark:text-white/50 mt-1 font-mono">
                      <span>{img.width > 0 ? `${img.width} × ${img.height}px` : 'Raster'}</span>
                      <span>{formatFileSize(img.sizeBytes)}</span>
                    </div>
                  </div>

                  {/* Quick Card Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                    <button
                      onClick={() => copyImageToClipboard(img)}
                      className="flex-1 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-medium transition-all flex items-center justify-center gap-1"
                      title="In Zwischenablage kopieren"
                    >
                      {copiedId === img.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{copiedId === img.id ? 'Kopiert' : 'Kopieren'}</span>
                    </button>

                    <button
                      onClick={() => downloadSingleImage(img)}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                      title="Einzelbild herunterladen"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div 
              className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-[#1A1A1A] rounded-3xl p-4 flex flex-col gap-4 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                <h3 className="font-bold text-base">{lightboxImage.name}</h3>
                <span className="text-xs font-mono text-black/50 dark:text-white/50">
                  {lightboxImage.width} × {lightboxImage.height}px ({formatFileSize(lightboxImage.sizeBytes)})
                </span>
              </div>
              <div className="flex-1 overflow-hidden flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-2xl p-2">
                <img src={lightboxImage.url} alt={lightboxImage.name} className="max-h-[70vh] max-w-full object-contain" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => downloadSingleImage(lightboxImage)}
                  className="px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold text-sm flex items-center gap-2 hover:bg-blue-600"
                >
                  <Download size={16} /> Bild herunterladen
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WordImageExtractor;
