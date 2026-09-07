import React, { useRef, useState } from 'react';
import { Copy, X, FileCode, Check, Upload } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import mammoth from 'mammoth';

interface TextAreaCardProps {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  readOnly?: boolean;
  onClear?: () => void;
  isActive?: boolean;
  isDarkMode?: boolean;
  actions?: React.ReactNode;
  allowFileUpload?: boolean;
}

export const TextAreaCard: React.FC<TextAreaCardProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  readOnly,
  onClear,
  isDarkMode = true,
  actions,
  allowFileUpload = false
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleFile = async (file: File) => {
    if (!onChange) return;
    
    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        onChange(result.value);
      } else {
        const text = await file.text();
        onChange(text);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try another format.');
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly && allowFileUpload) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (readOnly || !allowFileUpload) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className={`flex flex-col flex-1 w-full bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl shadow-soft overflow-hidden transition-colors duration-200 border ${isDragging ? 'border-tg-light-primary dark:border-tg-dark-primary border-2' : 'border-tg-light-border dark:border-tg-dark-border'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-tg-light-border dark:border-tg-dark-border bg-tg-light-secondary/30 dark:bg-tg-dark-secondary/30">
        <div className="flex items-center gap-2 text-tg-light-text dark:text-tg-dark-text font-medium text-sm">
          <FileCode size={16} className="text-tg-light-primary dark:text-tg-dark-primary opacity-80" />
          <span>{label}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {actions && (
            <div className="flex items-center gap-1 border-r border-tg-light-border dark:border-tg-dark-border pr-3 mr-1">
              {actions}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs font-medium text-tg-light-text dark:text-tg-dark-text bg-tg-light-surface dark:bg-tg-dark-surface px-3 py-1.5 rounded-lg border border-tg-light-border dark:border-tg-dark-border shadow-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-tg-light-primary dark:text-tg-dark-primary">{value.length}</span>
              <span className="text-tg-light-hint dark:text-tg-dark-hint">chars</span>
            </span>
            <span className="w-px h-3 bg-tg-light-border dark:bg-tg-dark-border"></span>
            <span className="flex items-center gap-1.5">
              <span className="text-tg-light-primary dark:text-tg-dark-primary">{value.split(/\s+/).filter(w => w.length > 0).length}</span>
              <span className="text-tg-light-hint dark:text-tg-dark-hint">words</span>
            </span>
          </div>
          
          {!readOnly && allowFileUpload && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInputChange} 
                className="hidden" 
                accept=".html,.htm,.txt,.md,.csv,.json,.docx"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-full hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover text-tg-light-hint dark:text-tg-dark-hint transition-colors hover:text-tg-light-primary dark:hover:text-tg-dark-primary"
                title="Upload File"
              >
                <Upload size={16} />
              </button>
            </>
          )}

          {readOnly && (
             <button 
               onClick={handleCopy} 
               className="p-1.5 rounded-full hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover text-tg-light-hint dark:text-tg-dark-hint transition-colors"
               title="Copy to clipboard"
             >
               {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
             </button>
          )}
          {!readOnly && onClear && value.length > 0 && (
             <button 
               onClick={onClear} 
               className="p-1.5 rounded-full hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover text-tg-light-hint dark:text-tg-dark-hint transition-colors hover:text-red-500"
               title="Clear"
             >
               <X size={16} />
             </button>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 relative overflow-auto bg-tg-light-surface dark:bg-tg-dark-surface custom-scrollbar">
        {isDragging && (
          <div className="absolute inset-0 z-10 bg-tg-light-primary/10 dark:bg-tg-dark-primary/10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="bg-tg-light-surface dark:bg-tg-dark-surface px-6 py-4 rounded-xl shadow-lg border border-tg-light-primary dark:border-tg-dark-primary flex flex-col items-center gap-2">
              <Upload size={32} className="text-tg-light-primary dark:text-tg-dark-primary" />
              <span className="font-medium text-tg-light-text dark:text-tg-dark-text">Drop file to import</span>
            </div>
          </div>
        )}
        <Editor
          value={value}
          onValueChange={val => onChange?.(val)}
          highlight={code => Prism.highlight(code, Prism.languages.markup, 'markup')}
          padding={16}
          readOnly={readOnly}
          placeholder={placeholder}
          className="min-h-full font-mono text-sm"
          style={{
            fontFamily: "'JetBrains Mono', 'Consolas', monospace",
            fontSize: 14,
            outline: 'none',
            minHeight: '100%',
          }}
        />
      </div>
    </div>
  );
};