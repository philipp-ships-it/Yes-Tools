import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle, Wrench } from 'lucide-react';
import type { ToolCallDisplay } from '../../lib/ai/types';

/**
 * Zeigt einen einzelnen KI-Tool-Aufruf im Chat an: Name, Status (läuft /
 * erfolgreich / Fehler), Argumente und Ergebnis-Zusammenfassung — analog zur
 * "Tool use" Darstellung in Claude/Cursor/ChatGPT-Oberflächen.
 *
 * Bewusst als eigene, kleine Komponente statt inline in EmbeddedAiSidebar,
 * damit sie unabhängig wiederverwendet/getestet werden kann (siehe
 * ToolCallBubble.test.tsx).
 */
export const ToolCallBubble: React.FC<{ call: ToolCallDisplay }> = ({ call }) => {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    running: <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />,
    success: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    error: <XCircle className="w-3.5 h-3.5 text-red-500" />,
  }[call.status];

  const statusLabel = {
    running: 'läuft…',
    success: 'erledigt',
    error: 'fehlgeschlagen',
  }[call.status];

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] text-xs overflow-hidden my-1.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
        aria-expanded={expanded}
      >
        <Wrench className="w-3.5 h-3.5 text-black/40 dark:text-white/40 flex-shrink-0" />
        <span className="font-mono font-semibold text-black/80 dark:text-white/80">{call.name}</span>
        <span className="flex items-center gap-1 text-black/50 dark:text-white/50 ml-1">
          {statusIcon}
          {statusLabel}
        </span>
        <span className="flex-1" />
        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {call.resultSummary && !expanded && (
        <p className="px-3 pb-2 -mt-1 text-black/50 dark:text-white/50 truncate">{call.resultSummary}</p>
      )}

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-black/5 dark:border-white/5 space-y-2">
          <div>
            <p className="uppercase tracking-wide text-[10px] font-semibold text-black/40 dark:text-white/40 mb-1">Argumente</p>
            <pre className="whitespace-pre-wrap break-words bg-black/5 dark:bg-white/5 rounded-lg p-2 font-mono">
              {JSON.stringify(call.args, null, 2)}
            </pre>
          </div>
          {call.result !== undefined && (
            <div>
              <p className="uppercase tracking-wide text-[10px] font-semibold text-black/40 dark:text-white/40 mb-1">Ergebnis</p>
              <pre className="whitespace-pre-wrap break-words bg-black/5 dark:bg-white/5 rounded-lg p-2 font-mono max-h-48 overflow-y-auto">
                {typeof call.result === 'string' ? call.result : JSON.stringify(call.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
