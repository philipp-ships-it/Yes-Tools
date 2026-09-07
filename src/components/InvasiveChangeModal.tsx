import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Zap, 
  Trash2, 
  PlusCircle, 
  RefreshCw, 
  Code, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Filter,
  Check
} from 'lucide-react';

export interface InvasiveChangeItem {
  id: string;
  type: 'deletion' | 'injection' | 'modification' | 'transpile' | 'wrap' | 'replace' | 'script_run';
  title: string;
  description: string;
  beforeSnippet?: string;
  afterSnippet?: string;
  isDangerous?: boolean;
  selectedByDefault?: boolean;
  metadata?: Record<string, any>;
}

export interface InvasiveChangeModalProps {
  isOpen: boolean;
  title: string;
  operationCategory: string; // e.g. "UTM Parameter Injector", "ESP Merge Tag Transpiler", "Outlook Guard Batch Wrap"
  riskLevel: 'high' | 'medium' | 'low';
  summaryDescription: string;
  items: InvasiveChangeItem[];
  onConfirm: (selectedItemIds: string[]) => void;
  onCancel: () => void;
}

export const InvasiveChangeModal: React.FC<InvasiveChangeModalProps> = ({
  isOpen,
  title,
  operationCategory,
  riskLevel,
  summaryDescription,
  items,
  onConfirm,
  onCancel,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedDiffs, setExpandedDiffs] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      // Select all items by default unless explicitly disabled
      const defaultSelected = new Set(
        items.filter((item) => item.selectedByDefault !== false).map((item) => item.id)
      );
      setSelectedIds(defaultSelected);
      setExpandedDiffs(new Set());
      setFilterType('all');
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const toggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleDiff = (id: string) => {
    const next = new Set(expandedDiffs);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedDiffs(next);
  };

  const filteredItems = items.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const countDeletions = items.filter((i) => i.type === 'deletion').length;
  const countInjections = items.filter((i) => i.type === 'injection' || i.type === 'wrap').length;
  const countModifications = items.filter((i) => i.type === 'modification' || i.type === 'transpile' || i.type === 'replace').length;

  const getRiskBadge = () => {
    switch (riskLevel) {
      case 'high':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1">
            <ShieldAlert size={14} /> HIGH INVASIVE RISK
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle size={14} /> MODERATE SCRIPT / BATCH CHANGE
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <ShieldCheck size={14} /> LOW RISK ADDITION
          </span>
        );
    }
  };

  const getTypeBadge = (type: InvasiveChangeItem['type']) => {
    switch (type) {
      case 'deletion':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 flex items-center gap-1 shrink-0">
            <Trash2 size={11} /> DELETION
          </span>
        );
      case 'injection':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
            <PlusCircle size={11} /> INJECTION
          </span>
        );
      case 'transpile':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center gap-1 shrink-0">
            <RefreshCw size={11} /> TRANSPILE
          </span>
        );
      case 'wrap':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0">
            <Code size={11} /> MSO WRAP
          </span>
        );
      case 'script_run':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
            <Zap size={11} /> SCRIPT RUN
          </span>
        );
      case 'replace':
      case 'modification':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center gap-1 shrink-0">
            <RefreshCw size={11} /> REPLACE
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#18181b] border border-black/15 dark:border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-black dark:text-white"
        >
          {/* Header */}
          <div className="p-5 border-b border-black/10 dark:border-white/10 bg-gradient-to-r from-red-500/5 via-amber-500/5 to-transparent flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-red-500" size={22} />
                <span className="text-xs font-mono font-bold uppercase text-red-600 dark:text-red-400 tracking-wider">
                  Pre-Execution Safeguard &amp; Approval Interceptor
                </span>
              </div>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                title="Cancel & Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
              <h2 className="text-lg font-black text-black dark:text-white tracking-tight">
                {title}
              </h2>
              {getRiskBadge()}
            </div>

            <p className="text-xs text-black/70 dark:text-white/70 leading-relaxed">
              {summaryDescription}
            </p>
          </div>

          {/* Stats Bar & Filter Controls */}
          <div className="px-5 py-3 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            {/* Impact Metrics */}
            <div className="flex items-center gap-3 font-semibold text-black/80 dark:text-white/80">
              <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
                Total Changes: <strong className="text-black dark:text-white">{items.length}</strong>
              </span>
              {countDeletions > 0 && (
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                  <Trash2 size={12} /> {countDeletions} Deletion(s)
                </span>
              )}
              {countInjections > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <PlusCircle size={12} /> {countInjections} Injection(s)
                </span>
              )}
              {countModifications > 0 && (
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <RefreshCw size={12} /> {countModifications} Modification(s)
                </span>
              )}
            </div>

            {/* Selection & Filter Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="px-2.5 py-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 font-bold flex items-center gap-1 transition-colors"
              >
                {selectedIds.size === items.length ? (
                  <>
                    <Square size={13} /> Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare size={13} /> Select All ({items.length})
                  </>
                )}
              </button>

              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-black/5 dark:border-white/5">
                <Filter size={12} className="ml-1 text-black/50 dark:text-white/50" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-white dark:bg-[#18181b]">All Types</option>
                  <option value="deletion" className="bg-white dark:bg-[#18181b]">Deletions Only</option>
                  <option value="injection" className="bg-white dark:bg-[#18181b]">Injections Only</option>
                  <option value="transpile" className="bg-white dark:bg-[#18181b]">Transpiles Only</option>
                  <option value="wrap" className="bg-white dark:bg-[#18181b]">MSO Wraps</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Checklist List */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-2.5 custom-scrollbar bg-gray-50/50 dark:bg-[#121214]/50">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-black/50 dark:text-white/50 italic">
                No items match the selected filter.
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = selectedIds.has(item.id);
                const isDiffExpanded = expandedDiffs.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all duration-150 flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-white dark:bg-[#1e1e22] border-blue-500/40 shadow-sm'
                        : 'bg-white/50 dark:bg-[#18181b]/50 border-black/10 dark:border-white/10 opacity-60'
                    }`}
                  >
                    {/* Item Title & Selection Row */}
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className={`mt-0.5 shrink-0 rounded p-0.5 transition-colors ${
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60'
                        }`}
                      >
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>

                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-xs text-black dark:text-white flex items-center gap-2">
                            <span className="text-black/40 dark:text-white/40 font-mono text-[10px]">
                              #{index + 1}
                            </span>
                            <span className="truncate">{item.title}</span>
                          </span>
                          {getTypeBadge(item.type)}
                        </div>

                        <p className="text-xs text-black/70 dark:text-white/70 leading-normal">
                          {item.description}
                        </p>

                        {/* Code Diff Trigger if before or after snippet present */}
                        {(item.beforeSnippet || item.afterSnippet) && (
                          <div className="mt-1">
                            <button
                              type="button"
                              onClick={() => toggleDiff(item.id)}
                              className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              {isDiffExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              {isDiffExpanded ? 'Hide Code Diff' : 'View Code Preview Diff'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expandable Code Diff Preview */}
                    {isDiffExpanded && (item.beforeSnippet || item.afterSnippet) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-black/90 text-zinc-200 rounded-lg text-[11px] font-mono flex flex-col gap-2 overflow-x-auto border border-white/10"
                      >
                        {item.beforeSnippet && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> BEFORE (Current Code):
                            </span>
                            <pre className="p-2 bg-red-950/40 text-red-200 border border-red-500/20 rounded whitespace-pre-wrap break-all">
                              {item.beforeSnippet}
                            </pre>
                          </div>
                        )}

                        {item.afterSnippet && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> AFTER (Proposed Target Code):
                            </span>
                            <pre className="p-2 bg-emerald-950/40 text-emerald-200 border border-emerald-500/20 rounded whitespace-pre-wrap break-all">
                              {item.afterSnippet}
                            </pre>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#18181b] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-xs font-semibold text-black/70 dark:text-white/70">
              Selected: <strong className="text-blue-600 dark:text-blue-400">{selectedIds.size}</strong> of {items.length} invasive item(s)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-all"
              >
                Cancel &amp; Abort
              </button>

              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => onConfirm(Array.from(selectedIds))}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
              >
                <Check size={15} />
                Approve &amp; Execute ({selectedIds.size} Selected Changes)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
