import React, { useState } from 'react';
import { useToolTracking } from '../hooks/useToolTracking';
import Papa from 'papaparse';
import JsonToTS from 'json-to-ts';
import { ArrowRightLeft, FileJson, FileText, Code, Check, Copy, Undo2 } from 'lucide-react';

export const DataTransformer: React.FC = () => {
  useToolTracking('Data Transformer');
  const [history, setHistory] = useState<string[]>([]);
  const [inputData, setInputData] = useState('[\n  {"id": 1, "name": "John", "active": true},\n  {"id": 2, "name": "Jane", "active": false}\n]');
  const [outputData, setOutputData] = useState('');
  const [mode, setMode] = useState<'json-to-csv' | 'csv-to-json' | 'json-to-ts'>('json-to-csv');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const processData = () => {
    setError('');
    setOutputData('');
    
    if (!inputData.trim()) return;

    try {
      if (mode === 'json-to-csv') {
        const parsedJson = JSON.parse(inputData);
        const csv = Papa.unparse(parsedJson);
        setOutputData(csv);
      } else if (mode === 'csv-to-json') {
        Papa.parse(inputData, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setError('Error parsing CSV');
            } else {
              setOutputData(JSON.stringify(results.data, null, 2));
            }
          }
        });
      } else if (mode === 'json-to-ts') {
        const parsedJson = JSON.parse(inputData);
        // json-to-ts returns an array of interfaces
        let interfaces = '';
        JsonToTS(parsedJson).forEach(typeInterface => {
          interfaces += typeInterface + '\n\n';
        });
        setOutputData(interfaces.trim());
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during transformation.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-xl leading-tight text-tg-light-text dark:text-tg-dark-text tracking-tight">Data Transformer</h1>
          <p className="text-[11px] font-mono text-tg-light-hint dark:text-tg-dark-hint uppercase tracking-wider mt-0.5">JSON &harr; CSV &amp; TypeScript</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-4 shadow-xl h-full relative">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text uppercase tracking-wider">
                Input Data
              </h2>
              <button 
                onClick={() => {
                  if (history.length > 0) {
                    setInputData(history[0]);
                    setHistory(prev => prev.slice(1));
                  }
                }}
                disabled={history.length === 0}
                className={`p-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${history.length > 0 ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-tg-light-hint dark:text-tg-dark-hint opacity-50'}`}
              >
                <Undo2 size={14} /> Undo
              </button>
            </div>
            
            <textarea
              value={inputData}
              onChange={(e) => {
                const val = e.target.value;
                if (Math.abs(val.length - inputData.length) > 10) {
                    setHistory(prev => [inputData, ...prev].slice(0, 5));
                }
                setInputData(e.target.value);
              }}
              placeholder="Paste JSON or CSV data here..."
              className="flex-1 w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-mono text-tg-light-text dark:text-tg-dark-text outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/10 resize-none custom-scrollbar"
            />
            {error && (
              <div className="absolute bottom-6 left-6 right-6 bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-4 shadow-xl h-full">
            <div className="flex flex-col gap-4 mb-2">
              <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setMode('json-to-csv')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    mode === 'json-to-csv' 
                      ? 'bg-white dark:bg-[#2A2A2A] text-blue-500 shadow-sm' 
                      : 'text-tg-light-hint dark:text-tg-dark-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                  }`}
                >
                  JSON <ArrowRightLeft size={14} /> CSV
                </button>
                <button
                  onClick={() => setMode('csv-to-json')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    mode === 'csv-to-json' 
                      ? 'bg-white dark:bg-[#2A2A2A] text-blue-500 shadow-sm' 
                      : 'text-tg-light-hint dark:text-tg-dark-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                  }`}
                >
                  CSV <ArrowRightLeft size={14} /> JSON
                </button>
                <button
                  onClick={() => setMode('json-to-ts')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    mode === 'json-to-ts' 
                      ? 'bg-white dark:bg-[#2A2A2A] text-blue-500 shadow-sm' 
                      : 'text-tg-light-hint dark:text-tg-dark-hint hover:text-tg-light-text dark:hover:text-tg-dark-text'
                  }`}
                >
                  JSON <ArrowRightLeft size={14} /> TS
                </button>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={processData}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Transform
                </button>
                <button 
                  onClick={copyToClipboard}
                  disabled={!outputData}
                  className="px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-tg-light-text dark:text-tg-dark-text rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />} 
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            
            <textarea
              value={outputData}
              readOnly
              placeholder="Transformed data will appear here..."
              className="flex-1 w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-mono text-tg-light-text dark:text-tg-dark-text outline-none resize-none custom-scrollbar"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
