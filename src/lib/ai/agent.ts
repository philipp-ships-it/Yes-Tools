/**
 * Agent-Loop: verbindet System-Prompt, Tool-Registry und
 * `callOpenRouterChat` zu einem funktionsfähigen "Harness".
 *
 * Ablauf pro Nutzer-Nachricht (siehe docs/ai-harness.md für die
 * ausführliche Architektur-Erklärung):
 *
 *   1. Anfrage an das Modell MIT den Tool-Schemas.
 *   2. Enthält die Antwort `tool_calls`? → jedes Tool ausführen, Ergebnis
 *      als `role: "tool"`-Nachricht anhängen, zurück zu Schritt 1.
 *   3. Keine `tool_calls` mehr → das ist die finale Antwort an den Nutzer.
 *
 * Eine feste `MAX_STEPS`-Grenze verhindert Endlosschleifen, falls ein Modell
 * wiederholt (fehlerhafte) Tool-Aufrufe produziert.
 */
import { callOpenRouterChat } from '../../services/openrouterService';
import { findTool, TOOL_SCHEMAS } from './tools';
import type { ToolCallDisplay, ToolExecutionContext } from './types';

const MAX_STEPS = 5;

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export interface RunAgentTurnOptions {
  /** Vollständiger bisheriger Verlauf inkl. System-Prompt und neuer User-Nachricht. */
  messages: AgentMessage[];
  model: string;
  ctx: ToolExecutionContext;
  /** Wird bei jedem Tool-Aufruf mit dem aktuellen Status aufgerufen (für Live-UI-Updates). */
  onToolCall?: (call: ToolCallDisplay) => void;
}

export interface RunAgentTurnResult {
  finalMessage: string;
  toolCalls: ToolCallDisplay[];
  /** Kompletter Nachrichtenverlauf inkl. Tool-Roundtrips, für Debugging/History. */
  transcript: AgentMessage[];
}

function safeParseArgs(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || '{}');
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export async function runAgentTurn(options: RunAgentTurnOptions): Promise<RunAgentTurnResult> {
  const transcript: AgentMessage[] = [...options.messages];
  const toolCalls: ToolCallDisplay[] = [];

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await callOpenRouterChat({
      messages: transcript,
      model: options.model,
      tools: TOOL_SCHEMAS,
    });

    const message = res.choices?.[0]?.message;
    if (!message) {
      throw new Error('Keine Antwort vom Modell erhalten (leeres choices[] Array).');
    }

    const requestedCalls: any[] = message.tool_calls || [];

    if (requestedCalls.length === 0) {
      transcript.push({ role: 'assistant', content: message.content || '' });
      return { finalMessage: message.content || '', toolCalls, transcript };
    }

    // Die Assistant-Nachricht MIT tool_calls muss vor den Tool-Ergebnissen
    // im Verlauf stehen — sonst weiß das Modell im nächsten Schritt nicht,
    // worauf sich die tool-Antworten beziehen (OpenAI/OpenRouter-Konvention).
    transcript.push({
      role: 'assistant',
      content: message.content || '',
      tool_calls: requestedCalls,
    });

    for (const call of requestedCalls) {
      const toolName = call.function?.name;
      const args = safeParseArgs(call.function?.arguments);
      const display: ToolCallDisplay = {
        id: call.id || `${toolName}-${Date.now()}`,
        name: toolName,
        args,
        status: 'running',
      };
      toolCalls.push(display);
      options.onToolCall?.({ ...display });

      const tool = findTool(toolName);
      let resultContent: string;

      if (!tool) {
        display.status = 'error';
        display.resultSummary = `Unbekanntes Tool: "${toolName}"`;
        resultContent = JSON.stringify({ error: display.resultSummary });
      } else {
        try {
          const result = await tool.execute(args, options.ctx);
          display.status = 'success';
          display.result = result;
          display.resultSummary = summarizeResult(result);
          resultContent = JSON.stringify(result);
        } catch (err: any) {
          display.status = 'error';
          display.resultSummary = err?.message || 'Unbekannter Fehler bei der Tool-Ausführung.';
          resultContent = JSON.stringify({ error: display.resultSummary });
        }
      }

      options.onToolCall?.({ ...display });
      transcript.push({
        role: 'tool',
        content: resultContent,
        tool_call_id: call.id,
        name: toolName,
      });
    }
  }

  throw new Error(
    `Agent-Loop nach ${MAX_STEPS} Schritten abgebrochen, ohne finale Antwort — das Modell hat wiederholt Tools aufgerufen, ohne zu einem Ergebnis zu kommen.`
  );
}

function summarizeResult(result: unknown): string {
  if (result && typeof result === 'object') {
    const keys = Object.keys(result as Record<string, unknown>);
    const preview = keys
      .slice(0, 3)
      .map((k) => {
        const v = (result as Record<string, unknown>)[k];
        const str = typeof v === 'string' ? v : JSON.stringify(v);
        return `${k}: ${str.length > 80 ? str.slice(0, 80) + '…' : str}`;
      })
      .join(', ');
    return preview || 'OK';
  }
  return String(result);
}
