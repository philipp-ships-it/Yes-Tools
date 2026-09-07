import React, { useState, useRef } from 'react';
import { useToolTracking } from '../hooks/useToolTracking';
import { UploadCloud, FileText, Trash2, AlertTriangle, CheckCircle2, Eye, Layers, X } from 'lucide-react';
import { HtmlAnalyzer } from '@/components/legacy/HtmlAnalyzer';

interface BatchFile {
  id: string;
  name: string;
  content: string;
  size: number;
  summary: {
    errors: number;
    warnings: number;
    score: number;
  };
}

export const BatchAnalyzer: React.FC = () => {
  useToolTracking('Batch Analyzer');
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeContent = (html: string) => {
    let errors = 0;
    let warnings = 0;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Quick heuristic analysis for the summary table
    if (!doc.title) errors++;
    if (!doc.documentElement.lang) warnings++;
    errors += doc.querySelectorAll('img:not([alt])').length;
    warnings += doc.querySelectorAll('img:not([width]), img:not([height])').length;
    errors += doc.querySelectorAll('a:not([href]), a[href=""]').length;
    if (!doc.querySelector('meta[name="description"]')) warnings++;
    if (!doc.querySelector('h1')) warnings++;

    let score = 100;
    score -= errors * 4;
    score -= warnings * 2;
    score = Math.max(0, score);
    
    return { errors, warnings, score };
  };

  const processFiles = async (fileList: FileList | File[]) => {
    setIsProcessing(true);
    try {
      const newFiles: BatchFile[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          const content = await file.text();
          newFiles.push({
            id: `${file.name}-${Date.now()}-${i}`,
            name: file.name,
            content,
            size: file.size,
            summary: analyzeContent(content)
          });
        }
      }
      setFiles(prev => [...prev, ...newFiles]);
      if (newFiles.length > 0 && !selectedFileId) {
        setSelectedFileId(newFiles[0].id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
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
      processFiles(e.target.files);
    }
    // Reset input so the same files can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) {
      setSelectedFileId(null);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setSelectedFileId(null);
  };

  const selectedFile = files.find(f => f.id === selectedFileId);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight text-tg-light-text dark:text-tg-dark-text">Batch Analyzer</h1>
            <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">Drop multiple HTML files to compare and analyze</p>
          </div>
        </div>
        {files.length > 0 && (
          <button 
            onClick={clearAll}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} /> Clear All
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
        {/* Left Column: Dropzone & File List */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Dropzone */}
          <div 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-shrink-0 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' 
                : 'border-tg-light-border dark:border-tg-dark-border bg-tg-light-surface dark:bg-tg-dark-surface hover:border-emerald-400 dark:hover:border-emerald-600'
            }`}
          >
            <input 
              type="file" 
              multiple 
              accept=".html,.htm,text/html" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileInput}
            />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-tg-light-bg dark:bg-tg-dark-bg text-tg-light-hint dark:text-tg-dark-hint'}`}>
              {isProcessing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              ) : (
                <UploadCloud size={32} />
              )}
            </div>
            <h3 className="text-lg font-semibold text-tg-light-text dark:text-tg-dark-text mb-1">
              {isProcessing ? 'Processing files...' : isDragging ? 'Drop HTML files here' : 'Drag & drop HTML files'}
            </h3>
            <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint max-w-sm">
              or click to browse your computer. You can select multiple files at once.
            </p>
          </div>

          {/* File List Table */}
          <div className="flex-1 bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border rounded-2xl shadow-soft overflow-hidden flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-tg-light-border dark:border-tg-dark-border bg-tg-light-secondary/30 dark:bg-tg-dark-secondary/30 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-tg-light-text dark:text-tg-dark-text">Uploaded Files ({files.length})</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {files.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-tg-light-hint dark:text-tg-dark-hint p-8 text-center">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p>No files uploaded yet.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-tg-light-surface dark:bg-tg-dark-surface border-b border-tg-light-border dark:border-tg-dark-border z-10">
                    <tr>
                      <th className="px-4 py-3 text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">File Name</th>
                      <th className="px-4 py-3 text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">Score</th>
                      <th className="px-4 py-3 text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider">Issues</th>
                      <th className="px-4 py-3 text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tg-light-border dark:divide-tg-dark-border">
                    {files.map(file => (
                      <tr 
                        key={file.id} 
                        onClick={() => setSelectedFileId(file.id)}
                        className={`cursor-pointer transition-colors ${selectedFileId === file.id ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover'}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FileText size={16} className={selectedFileId === file.id ? 'text-emerald-500' : 'text-tg-light-hint dark:text-tg-dark-hint'} />
                            <span className="text-sm font-medium text-tg-light-text dark:text-tg-dark-text truncate max-w-[200px] lg:max-w-[300px]" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-tg-light-hint dark:text-tg-dark-hint">
                          {formatBytes(file.size)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 max-w-[100px]">
                            <div className={`text-xs font-bold w-7 ${file.summary.score > 80 ? 'text-emerald-500' : file.summary.score > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                              {file.summary.score}
                            </div>
                            <div className="w-full h-1.5 bg-tg-light-border dark:bg-tg-dark-border rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${file.summary.score > 80 ? 'bg-emerald-500' : file.summary.score > 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                style={{ width: `${file.summary.score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {file.summary.errors === 0 && file.summary.warnings === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                                <CheckCircle2 size={12} /> Perfect
                              </span>
                            ) : (
                              <>
                                {file.summary.errors > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                                    <X size={12} /> {file.summary.errors}
                                  </span>
                                )}
                                {file.summary.warnings > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                                    <AlertTriangle size={12} /> {file.summary.warnings}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedFileId(file.id); }}
                              className={`p-1.5 rounded-md transition-colors ${selectedFileId === file.id ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-tg-light-hint dark:text-tg-dark-hint hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover'}`}
                              title="View Analysis"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={(e) => removeFile(file.id, e)}
                              className="p-1.5 rounded-md text-tg-light-hint dark:text-tg-dark-hint hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                              title="Remove File"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Analysis */}
        <div className="w-full xl:w-[400px] 2xl:w-[500px] flex-shrink-0 flex flex-col min-h-0">
          {selectedFile ? (
            <div className="h-full flex flex-col bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl shadow-soft border border-tg-light-border dark:border-tg-dark-border overflow-hidden">
              <div className="px-4 py-3 border-b border-tg-light-border dark:border-tg-dark-border bg-tg-light-secondary/30 dark:bg-tg-dark-secondary/30 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-tg-light-text dark:text-tg-dark-text truncate" title={selectedFile.name}>
                  Analysis: {selectedFile.name}
                </h3>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0">
                  <HtmlAnalyzer htmlContent={selectedFile.content} />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl shadow-soft border border-tg-light-border dark:border-tg-dark-border flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-tg-light-bg dark:bg-tg-dark-bg flex items-center justify-center mb-4 text-tg-light-hint dark:text-tg-dark-hint">
                <Eye size={32} />
              </div>
              <h3 className="text-lg font-semibold text-tg-light-text dark:text-tg-dark-text mb-2">Detailed Analysis</h3>
              <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">
                Select a file from the list to view its full HTML analysis report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchAnalyzer;
