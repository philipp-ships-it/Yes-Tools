import React, { useMemo } from 'react';
import { FileDiff, SplitSquareHorizontal, FileText, ArrowRight } from 'lucide-react';
import { diffLines, diffChars, Change } from 'diff';
import { useAppStore } from '../store/appStore';

export const TextCompare: React.FC = () => {
  const { compareText1: text1, compareText2: text2, compareAutoAlign: autoAlign, setCompareState } = useAppStore();
  const setText1 = (val: string) => setCompareState({ compareText1: val });
  const setText2 = (val: string) => setCompareState({ compareText2: val });
  const setAutoAlign = (val: boolean) => setCompareState({ compareAutoAlign: val });

  const { leftLines, rightLines } = useMemo(() => {
    if (!text1 && !text2) return { leftLines: [], rightLines: [] };

    let processedText1 = text1;
    let processedText2 = text2;

    if (autoAlign) {
      const hasColumns = /\t| {2,}/.test(text1) || /\t| {2,}/.test(text2);
      if (hasColumns) {
        const parseLine = (l: string) => l.split(/\t| {2,}/);
        const lines1 = text1.split('\n');
        const lines2 = text2.split('\n');
        
        const colWidths: number[] = [];
        [...lines1, ...lines2].forEach(l => {
          const cols = parseLine(l);
          if (cols.length > 1) {
            cols.forEach((col, i) => {
              const trimmedCol = col.trim();
              if (!colWidths[i] || trimmedCol.length > colWidths[i]) {
                colWidths[i] = trimmedCol.length;
              }
            });
          }
        });

        const formatLine = (l: string) => {
          const cols = parseLine(l);
          if (cols.length > 1) {
            return cols.map((col, i) => col.trim().padEnd(colWidths[i] || 0, ' ')).join('    ');
          }
          return l;
        };

        processedText1 = lines1.map(formatLine).join('\n');
        processedText2 = lines2.map(formatLine).join('\n');
      }
    }

    const changes = diffLines(processedText1, processedText2);
    const leftLines: React.ReactNode[][] = [];
    const rightLines: React.ReactNode[][] = [];

    let i = 0;
    while (i < changes.length) {
      const change = changes[i];

      if (change.removed && i + 1 < changes.length && changes[i + 1].added) {
        // Modification (removed block followed by added block)
        const removedChange = change;
        const addedChange = changes[i + 1];

        const rLines = removedChange.value.split('\n');
        if (rLines.length > 0 && rLines[rLines.length - 1] === '') rLines.pop();

        const aLines = addedChange.value.split('\n');
        if (aLines.length > 0 && aLines[aLines.length - 1] === '') aLines.pop();

        const maxLen = Math.max(rLines.length, aLines.length);
        for (let j = 0; j < maxLen; j++) {
          if (j < rLines.length && j < aLines.length) {
            // Diff chars for this specific line pair
            const charChanges = diffChars(rLines[j], aLines[j]);
            const lNodes = charChanges
              .map((c, idx) =>
                c.added ? null : c.removed ? (
                  <span key={idx} className="bg-red-500/30 text-red-900 dark:text-red-200 font-bold px-[1px] rounded">
                    {c.value}
                  </span>
                ) : (
                  <span key={idx}>{c.value}</span>
                )
              )
              .filter(Boolean);

            const rNodes = charChanges
              .map((c, idx) =>
                c.removed ? null : c.added ? (
                  <span key={idx} className="bg-green-500/40 text-green-900 dark:text-green-100 font-bold px-[1px] rounded">
                    {c.value}
                  </span>
                ) : (
                  <span key={idx}>{c.value}</span>
                )
              )
              .filter(Boolean);

            leftLines.push(lNodes);
            rightLines.push(rNodes);
          } else if (j < rLines.length) {
            leftLines.push([<span className="bg-red-500/20 text-red-900 dark:text-red-200">{rLines[j]}</span>]);
            rightLines.push([]);
          } else {
            leftLines.push([]);
            rightLines.push([<span className="bg-green-500/20 text-green-900 dark:text-green-100">{aLines[j]}</span>]);
          }
        }
        i += 2;
      } else if (change.removed) {
        const rLines = change.value.split('\n');
        if (rLines.length > 0 && rLines[rLines.length - 1] === '') rLines.pop();
        for (const line of rLines) {
          leftLines.push([<span className="bg-red-500/20 text-red-900 dark:text-red-200">{line}</span>]);
          rightLines.push([]);
        }
        i += 1;
      } else if (change.added) {
        const aLines = change.value.split('\n');
        if (aLines.length > 0 && aLines[aLines.length - 1] === '') aLines.pop();
        for (const line of aLines) {
          leftLines.push([]);
          rightLines.push([<span className="bg-green-500/20 text-green-900 dark:text-green-100">{line}</span>]);
        }
        i += 1;
      } else {
        // unchanged
        const uLines = change.value.split('\n');
        if (uLines.length > 0 && uLines[uLines.length - 1] === '') uLines.pop();
        for (const line of uLines) {
          leftLines.push([<span className="opacity-60">{line}</span>]);
          rightLines.push([<span className="opacity-60">{line}</span>]);
        }
        i += 1;
      }
    }

    return { leftLines, rightLines };
  }, [text1, text2]);

  return (
    <div className="h-full w-full p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <FileDiff size={20} />
          </div>
          <div>
            <h1 className="font-bold text-2xl leading-tight text-tg-light-text dark:text-tg-dark-text">Text Compare</h1>
            <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">
              Smart comparison for text, lists, and tables. Instantly highlights differences in characters, numbers, and lines.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-hidden">
        {/* Input Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 h-48 md:h-64">
          <div className="bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border rounded-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-tg-light-border dark:border-tg-dark-border flex items-center gap-2 bg-tg-light-bg dark:bg-black/20">
              <FileText size={16} className="text-tg-light-hint dark:text-tg-dark-hint" />
              <span className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text">Original Text</span>
            </div>
            <textarea
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              placeholder="Paste original text or list here..."
              className="flex-1 w-full bg-transparent p-4 text-sm font-mono focus:outline-none resize-none whitespace-pre"
            />
          </div>

          <div className="bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border rounded-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-tg-light-border dark:border-tg-dark-border flex items-center gap-2 bg-tg-light-bg dark:bg-black/20">
              <FileText size={16} className="text-indigo-500" />
              <span className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text">Modified Text</span>
            </div>
            <textarea
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              placeholder="Paste modified text or list here..."
              className="flex-1 w-full bg-transparent p-4 text-sm font-mono focus:outline-none resize-none whitespace-pre"
            />
          </div>
        </div>

        {/* Diff Output */}
        <div className="flex-1 bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border rounded-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-tg-light-border dark:border-tg-dark-border flex flex-col md:flex-row items-start md:items-center justify-between bg-tg-light-bg dark:bg-black/20 gap-3">
            <div className="flex items-center gap-2">
              <SplitSquareHorizontal size={16} className="text-tg-light-hint dark:text-tg-dark-hint" />
              <span className="text-sm font-semibold text-tg-light-text dark:text-tg-dark-text">Smart Side-by-Side Comparison</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[12px]">
                  <span className="w-2.5 h-2.5 rounded bg-green-500/40 border border-green-500/50"></span>
                  <span className="text-tg-light-hint dark:text-tg-dark-hint">Added</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px]">
                  <span className="w-2.5 h-2.5 rounded bg-red-500/40 border border-red-500/50"></span>
                  <span className="text-tg-light-hint dark:text-tg-dark-hint">Removed</span>
                </div>
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <span className="text-xs font-medium text-tg-light-hint dark:text-tg-dark-hint group-hover:text-tg-light-text dark:group-hover:text-tg-dark-text transition-colors">Auto-Align Columns</span>
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={autoAlign} onChange={(e) => setAutoAlign(e.target.checked)} />
                  <div className={`block w-8 h-4.5 rounded-full transition-colors ${autoAlign ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                  <div className={`absolute left-0.5 top-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform ${autoAlign ? 'transform translate-x-3.5' : ''}`}></div>
                </div>
              </label>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-[#111111] p-4 font-mono text-[13px] leading-relaxed">
            {leftLines.length === 0 && rightLines.length === 0 ? (
              <div className="h-full flex items-center justify-center text-tg-light-hint dark:text-tg-dark-hint text-sm">
                Awaiting input to compare...
              </div>
            ) : (
              <div className="flex w-full min-w-max">
                <div className="w-1/2 pr-2 border-r border-tg-light-border dark:border-tg-dark-border">
                  {leftLines.map((line, i) => (
                    <div key={i} className="min-h-[20px] whitespace-pre break-all">
                      {line.length > 0 ? line : <span className="inline-block" />}
                    </div>
                  ))}
                </div>
                <div className="w-1/2 pl-4">
                  {rightLines.map((line, i) => (
                    <div key={i} className="min-h-[20px] whitespace-pre break-all">
                      {line.length > 0 ? line : <span className="inline-block" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
