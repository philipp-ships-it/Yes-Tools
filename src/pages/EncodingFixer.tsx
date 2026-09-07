import React, { useState } from 'react';
import { Type, Wand2, Copy, Check, RefreshCw } from 'lucide-react';
import { fixMojibake, detectMojibake } from '../lib/encodingFixer';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToolTracking } from '../hooks/useToolTracking';
import { ChangeRequestModal, ChangeRequestItem } from '../components/ChangeRequestModal';

export const EncodingFixer: React.FC = () => {
  useToolTracking('encodingfixer');
  
  const [inputText, setInputText] = useLocalStorage('encoding-fixer-input', '');
  const [outputText, setOutputText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Change Request Safeguard State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState<ChangeRequestItem[]>([]);

  const handleFixRequest = () => {
    if (!inputText) return;
    const fixed = fixMojibake(inputText);

    // Build diff breakdown by line or chunk
    const linesInput = inputText.split('\n');
    const linesFixed = fixed.split('\n');
    const items: ChangeRequestItem[] = [];

    linesInput.forEach((line, idx) => {
      const fixedLine = linesFixed[idx];
      if (line !== fixedLine) {
        items.push({
          id: `line_fix_${idx}`,
          type: 'modification',
          title: `Line ${idx + 1} UTF-8 Mojibake Correction`,
          description: `Fix broken encoding characters on line ${idx + 1}`,
          beforeSnippet: line,
          afterSnippet: fixedLine,
          metadata: { originalLine: line, fixedLine }
        });
      }
    });

    if (items.length === 0) {
      setOutputText(fixed);
      return;
    }

    setModalItems(items);
    setIsModalOpen(true);
  };

  const handleConfirmChanges = (selectedIds: string[]) => {
    const selectedSet = new Set(selectedIds);
    const linesInput = inputText.split('\n');
    const linesFixed = fixMojibake(inputText).split('\n');

    const resultLines = linesInput.map((line, idx) => {
      if (selectedSet.has(`line_fix_${idx}`)) {
        return linesFixed[idx];
      }
      return line;
    });

    setOutputText(resultLines.join('\n'));
    setIsModalOpen(false);
  };

  const copyToClipboard = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const hasMojibake = detectMojibake(inputText);

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white shadow-md">
          <Type size={20} />
        </div>
        <div>
          <h1 className="font-bold text-2xl leading-tight">Encoding Fixer</h1>
          <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint">
            Fix corrupted characters (Mojibake) like Ã¼, Ã¤, and â‚¬ back to valid UTF-8 with pre-execution verification.
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
        {/* Input */}
        <div className="flex flex-col bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl border border-tg-light-border dark:border-tg-dark-border overflow-hidden shadow-sm">
          <div className="p-3 border-b border-tg-light-border dark:border-tg-dark-border flex justify-between items-center bg-tg-light-bg/50 dark:bg-tg-dark-bg/50">
            <span className="text-sm font-medium flex items-center gap-2">
              <Type size={16} className="text-indigo-500" />
              Corrupted Text
            </span>
            {hasMojibake && (
               <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                 Corrupted characters detected
               </span>
            )}
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 w-full bg-transparent p-4 resize-none focus:outline-none custom-scrollbar text-sm"
            placeholder="Paste text with broken encoding here (e.g., 'fÃ¼r MitarbeitergesprÃ¤che')..."
          />
        </div>

        {/* Output */}
        <div className="flex flex-col bg-tg-light-surface dark:bg-tg-dark-surface rounded-2xl border border-tg-light-border dark:border-tg-dark-border overflow-hidden shadow-sm">
          <div className="p-3 border-b border-tg-light-border dark:border-tg-dark-border flex justify-between items-center bg-tg-light-bg/50 dark:bg-tg-dark-bg/50">
            <span className="text-sm font-medium flex items-center gap-2">
              <Wand2 size={16} className="text-emerald-500" />
              Fixed Text
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleFixRequest}
                disabled={!inputText}
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw size={14} /> Fix Encoding
              </button>
              <button
                onClick={copyToClipboard}
                disabled={!outputText}
                className="p-1.5 rounded-lg hover:bg-tg-light-hover dark:hover:bg-tg-dark-hover transition-colors disabled:opacity-50 text-tg-light-hint dark:text-tg-dark-hint"
                title="Copy"
              >
                {isCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          <textarea
            value={outputText}
            readOnly
            className="flex-1 w-full bg-transparent p-4 resize-none focus:outline-none custom-scrollbar text-sm text-tg-light-text dark:text-tg-dark-text"
            placeholder="Fixed text will appear here..."
          />
        </div>
      </div>

      <ChangeRequestModal
        isOpen={isModalOpen}
        title="Encoding Transformation Safeguard"
        operationCategory="Mojibake UTF-8 Fixer"
        riskLevel="medium"
        summaryDescription={`Detected ${modalItems.length} encoding line modification(s). Select which lines to transpile back to UTF-8.`}
        items={modalItems}
        onConfirm={handleConfirmChanges}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};

