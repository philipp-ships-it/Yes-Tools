/**
 * Gemeinsame Typen für den KI-Tool-Calling-Harness.
 *
 * Format der JSON-Schemas folgt bewusst der OpenAI-"function calling"-
 * Konvention (`type: "function"`, `function: { name, description,
 * parameters }`), da OpenRouter genau dieses Format 1:1 durchreicht
 * (siehe `callOpenRouterChat` in `src/services/openrouterService.ts`,
 * Parameter `tools`). Das ist zugleich der De-facto-Standard, den auch
 * Anthropic (`tools`) und die meisten anderen Provider unterstützen.
 */

/** JSON-Schema-Objekt für die Parameter eines Tools (vereinfachtes Subset). */
export interface JsonSchema {
  type: 'object';
  properties: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description?: string;
    enum?: (string | number)[];
    items?: JsonSchema['properties'][string];
  }>;
  required?: string[];
  additionalProperties?: false;
}

/** Ein Tool, wie es dem LLM als "function" angeboten wird. */
export interface ToolSchema {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: JsonSchema;
  };
}

/** Ausführungskontext, den Tools bei Bedarf lesen/schreiben dürfen. */
export interface ToolExecutionContext {
  /** Code, an dem der Nutzer aktuell im jeweiligen Tool arbeitet. */
  getActiveCode: () => string;
  /** Schreibt Code zurück in das aktive Tool (z. B. WYSIWYG Studio). */
  setActiveCode: (code: string) => void;
  /** Name des aktuell aktiven Tools/Moduls, z. B. "HTML Tools". */
  activeToolName: string;
}

/** Laufzeit-Definition eines Tools: Schema + Handler in einem Objekt. */
export interface ToolDefinition<TArgs = any, TResult = unknown> {
  schema: ToolSchema;
  /** Führt das Tool aus. Wirft bei ungültigen Argumenten oder Fehlern. */
  execute: (args: TArgs, ctx: ToolExecutionContext) => Promise<TResult> | TResult;
}

export type ToolCallStatus = 'running' | 'success' | 'error';

/** UI-Repräsentation eines einzelnen Tool-Aufrufs für den Chat-Verlauf. */
export interface ToolCallDisplay {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: ToolCallStatus;
  /** Kurze, für Menschen lesbare Zusammenfassung des Ergebnisses/Fehlers. */
  resultSummary?: string;
  /** Vollständiges Ergebnis (roh), z. B. für "in Editor einfügen". */
  result?: unknown;
}
