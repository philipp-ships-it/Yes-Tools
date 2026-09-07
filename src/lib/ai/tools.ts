/**
 * Tool-Registry für den KI-Harness ("YES KI" / CoCreator).
 *
 * Jedes Tool hier ist ein dünner, sicherheitsbewusst ausgewählter Wrapper
 * um bereits vorhandene, reine Funktionen aus `src/lib/headless.ts`
 * (dieselben, die auch die Headless-CLI unter `docs/headless-llm.md`
 * exponiert — die KI im Browser bekommt also bewusst dieselben Werkzeuge
 * wie die CLI, nur über Tool-Calling statt Kommandozeile).
 *
 * Bewusst NICHT aufgenommen: `DataTools.transformJSON` — das führt intern
 * `new Function(...)` mit vom Aufrufer gelieferten Code aus. Für eine
 * Kommandozeile, die der Entwickler selbst tippt, ist das akzeptabel; einem
 * LLM, dessen Ausgabe potenziell durch Prompt-Injection aus fremdem Content
 * beeinflusst sein kann, geben wir keinen Tool-Zugriff auf dynamische
 * Code-Ausführung. Das ist eine bewusste Sicherheitsentscheidung, kein
 * Versehen — siehe docs/ai-harness.md, Abschnitt "Sicherheitsmodell".
 */
import { diffLines } from 'diff';
import { HtmlTools, EncodingTools, SvgTools } from '../headless';
import type { ToolDefinition, ToolExecutionContext } from './types';

const htmlBeautify: ToolDefinition<{ html: string }, { html: string }> = {
  schema: {
    type: 'function',
    function: {
      name: 'html_beautify',
      description:
        'Formatiert HTML-Code lesbar mit korrekter Einrückung (inkl. Outlook/MSO Conditional Comments). Nutze dies, bevor du formatierten HTML-Code in deiner Antwort zeigst oder in den Editor schreibst.',
      parameters: {
        type: 'object',
        properties: {
          html: { type: 'string', description: 'Der zu formatierende HTML-Quellcode.' },
        },
        required: ['html'],
        additionalProperties: false,
      },
    },
  },
  execute: ({ html }) => ({ html: HtmlTools.beautify(html) }),
};

const htmlMinify: ToolDefinition<{ html: string }, { html: string }> = {
  schema: {
    type: 'function',
    function: {
      name: 'html_minify',
      description: 'Minifiziert HTML-Code (entfernt überflüssige Whitespaces) für den produktiven Einsatz, z. B. in E-Mails oder Landingpages.',
      parameters: {
        type: 'object',
        properties: {
          html: { type: 'string', description: 'Der zu minifizierende HTML-Quellcode.' },
        },
        required: ['html'],
        additionalProperties: false,
      },
    },
  },
  execute: ({ html }) => ({ html: HtmlTools.minify(html) }),
};

const fixEncoding: ToolDefinition<{ text: string }, { text: string }> = {
  schema: {
    type: 'function',
    function: {
      name: 'fix_text_encoding',
      description:
        'Repariert kaputte Zeichenkodierung/Mojibake in Text (z. B. "Ã¼" → "ü"), wie sie häufig nach falscher UTF-8/Latin-1 Konvertierung aus Word-Dokumenten oder CSV-Exports entsteht.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Der Text mit vermuteter kaputter Zeichenkodierung.' },
        },
        required: ['text'],
        additionalProperties: false,
      },
    },
  },
  execute: ({ text }) => ({ text: EncodingTools.fixMojibake(text) }),
};

const svgOptimize: ToolDefinition<{ svg: string; removeComments?: boolean; minify?: boolean }, { svg: string }> = {
  schema: {
    type: 'function',
    function: {
      name: 'svg_optimize',
      description: 'Optimiert SVG-Markup: entfernt Kommentare und/oder minifiziert Whitespace.',
      parameters: {
        type: 'object',
        properties: {
          svg: { type: 'string', description: 'Der SVG-Quellcode.' },
          removeComments: { type: 'boolean', description: 'Kommentare entfernen. Default: true.' },
          minify: { type: 'boolean', description: 'Whitespace minifizieren. Default: false.' },
        },
        required: ['svg'],
        additionalProperties: false,
      },
    },
  },
  execute: ({ svg, removeComments = true, minify = false }) => ({
    svg: SvgTools.optimizeSvg(svg, removeComments, minify),
  }),
};

const compareText: ToolDefinition<{ original: string; updated: string }, { unifiedDiff: string; changedLines: number }> = {
  schema: {
    type: 'function',
    function: {
      name: 'compare_text',
      description:
        'Vergleicht zwei Textversionen zeilenweise und liefert ein lesbares Diff zurück. Nutze dies, um dem Nutzer präzise zu erklären, was sich zwischen zwei Codeständen geändert hat, statt es nur zu behaupten.',
      parameters: {
        type: 'object',
        properties: {
          original: { type: 'string', description: 'Ursprüngliche Textversion.' },
          updated: { type: 'string', description: 'Neue/geänderte Textversion.' },
        },
        required: ['original', 'updated'],
        additionalProperties: false,
      },
    },
  },
  execute: ({ original, updated }) => {
    const parts = diffLines(original, updated);
    let changedLines = 0;
    const rendered = parts
      .map((part) => {
        const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
        if (part.added || part.removed) changedLines += part.value.split('\n').filter(Boolean).length;
        return part.value
          .split('\n')
          .filter((line, idx, arr) => !(idx === arr.length - 1 && line === ''))
          .map((line) => prefix + line)
          .join('\n');
      })
      .join('\n');
    return { unifiedDiff: rendered, changedLines };
  },
};

const getActiveEditorCode: ToolDefinition<Record<string, never>, { code: string; toolName: string }> = {
  schema: {
    type: 'function',
    function: {
      name: 'get_active_editor_code',
      description:
        'Liest den Code, an dem der Nutzer gerade im aktiven Tool arbeitet (falls vorhanden). Nutze dies, wenn du den aktuellen Code brauchst, aber nicht sicher bist, ob er schon im Gesprächskontext enthalten ist.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  execute: (_args, ctx: ToolExecutionContext) => ({
    code: ctx.getActiveCode(),
    toolName: ctx.activeToolName,
  }),
};

const setActiveEditorCode: ToolDefinition<{ code: string }, { success: true; toolName: string }> = {
  schema: {
    type: 'function',
    function: {
      name: 'set_active_editor_code',
      description:
        'Schreibt Code direkt in das aktive Tool des Nutzers zurück (z. B. WYSIWYG Studio, HTML Tools). Nutze dies NUR, wenn der Nutzer explizit darum gebeten hat, seinen Code zu ändern/ersetzen — nicht, um unaufgefordert Code zu überschreiben.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Der neue Code, der das aktuelle Editor-Buffer ersetzen soll.' },
        },
        required: ['code'],
        additionalProperties: false,
      },
    },
  },
  execute: ({ code }, ctx: ToolExecutionContext) => {
    ctx.setActiveCode(code);
    return { success: true as const, toolName: ctx.activeToolName };
  },
};

/** Zentrale Registry: von hier bezieht der Agent-Loop Schemas + Ausführung. */
export const TOOL_REGISTRY: ToolDefinition<any, any>[] = [
  htmlBeautify,
  htmlMinify,
  fixEncoding,
  svgOptimize,
  compareText,
  getActiveEditorCode,
  setActiveEditorCode,
];

export const TOOL_SCHEMAS = TOOL_REGISTRY.map((t) => t.schema);

export function findTool(name: string): ToolDefinition<any, any> | undefined {
  return TOOL_REGISTRY.find((t) => t.schema.function.name === name);
}
