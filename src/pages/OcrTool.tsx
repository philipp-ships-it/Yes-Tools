import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileImage, Loader2, Copy, FileText, UploadCloud } from 'lucide-react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const OcrTool: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [progress, setProgress] = useState(0);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    try {
      const result = await Tesseract.recognize(
        file,
        'deu+eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      setExtractedText(prev => prev + (prev ? '\n\n' : '') + result.data.text);
    } catch (error) {
      console.error('OCR Error:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const processPdf = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(Math.round(((i - 1) / pdf.numPages) * 100));
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          canvas: canvas,
          viewport: viewport
        }).promise;
        
        const dataUrl = canvas.toDataURL('image/png');
        
        const result = await Tesseract.recognize(
          dataUrl,
          'deu+eng'
        );
        
        fullText += result.data.text + '\n\n';
      }
      
      setExtractedText(prev => prev + (prev ? '\n\n' : '') + fullText);
    } catch (error) {
      console.error('PDF Processing Error:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (file.type === 'application/pdf') {
        processPdf(file);
      } else if (file.type.startsWith('image/')) {
        processImage(file);
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf']
    }
  });

  const copyCode = () => {
    navigator.clipboard.writeText(extractedText);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-xl leading-tight text-tg-light-text dark:text-tg-dark-text tracking-tight">OCR Extractor</h1>
          <p className="text-[11px] font-mono text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider mt-0.5">Extract Text from Images & PDFs</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div 
            {...getRootProps()} 
            className={`bg-white dark:bg-[#1E1E1E] border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-4 shadow-sm h-full min-h-[300px] transition-colors cursor-pointer ${
              isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
            }`}
          >
            <input {...getInputProps()} />
            
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 size={40} className="animate-spin text-blue-500" />
                <p className="text-sm font-medium text-tg-light-text dark:text-tg-dark-text">Processing Document...</p>
                {progress > 0 && (
                  <div className="w-48 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <UploadCloud size={32} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-tg-light-text dark:text-tg-dark-text mb-1">Drag & Drop Files Here</p>
                  <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">Supports Images (JPG, PNG) and PDFs</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#1E1E1E] border border-black/5 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-4 shadow-sm h-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-blue-500" /> Extracted Text
              </h2>
              <button 
                onClick={copyCode}
                disabled={!extractedText}
                className="px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-tg-light-text dark:text-tg-dark-text rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy size={16} /> Copy
              </button>
            </div>
            
            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Extracted text will appear here..."
              className="flex-1 w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl p-4 text-sm text-tg-light-text dark:text-tg-dark-text outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/10 resize-none custom-scrollbar"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
