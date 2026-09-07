/**
 * System-Prompt-Vorlage für den KI-Harness.
 *
 * Best Practice (analog Anthropic/OpenAI Agent-Guides): der System-Prompt
 * beschreibt (1) Rolle & Ton, (2) den aktuellen Arbeitskontext des Nutzers,
 * (3) explizit, WANN Tools zu nutzen sind (nicht nur DASS es sie gibt) und
 * (4) wie mit Tool-Ergebnissen umzugehen ist. Modelle rufen Tools zuverlässiger
 * korrekt auf, wenn der Prompt konkrete Trigger-Situationen benennt statt nur
 * eine abstrakte Fähigkeitsliste.
 */
import { TOOL_REGISTRY } from './tools';

export interface SystemPromptContext {
  activeToolName: string;
  activeFileName?: string;
  activeCode?: string;
  language?: string;
  metadataTags?: Record<string, string>;
  /** Auf 15000 Zeichen begrenzen, um Tokenkosten/Kontextlimits zu schonen. */
  maxCodeContextChars?: number;
}

const TOOL_LIST_MARKDOWN = TOOL_REGISTRY
  .map((t) => `- **${t.schema.function.name}** — ${t.schema.function.description}`)
  .join('\n');

export function buildSystemPrompt(ctx: SystemPromptContext): string {
  const maxChars = ctx.maxCodeContextChars ?? 15000;

  let prompt = `Du bist die "YES KI", der native, werkzeuggestützte Assistent innerhalb von YES Tools.
Der Nutzer arbeitet aktuell im Modul "${ctx.activeToolName}"${ctx.activeFileName ? ` an der Datei "${ctx.activeFileName}"` : ''}.

## Verhalten
- Antworte präzise, direkt und auf Deutsch.
- Du bist kein reiner Chat-Bot: Wenn eine Anfrage sich mit einem der unten
  gelisteten Tools lösen lässt, RUFE DAS TOOL AUF, statt das Ergebnis nur zu
  behaupten oder von Hand nachzubilden (z. B. HTML "von Hand" einzurücken,
  statt \`html_beautify\` aufzurufen).
- Rufe \`set_active_editor_code\` NUR auf, wenn der Nutzer explizit darum
  gebeten hat, seinen Code zu ändern/ersetzen — nie unaufgefordert.
- Wenn dir der aktuelle Code fehlt, aber für die Antwort nötig ist, rufe
  \`get_active_editor_code\` auf, statt den Nutzer danach zu fragen.
- Nach jedem Tool-Aufruf erhältst du das Ergebnis als Werkzeug-Nachricht
  zurück — fasse relevante Ergebnisse für den Nutzer in eigenen Worten
  zusammen, gib nicht nur rohe JSON-Daten wieder.
- Wenn kein Tool passt, antworte normal wie ein Chat-Assistent.

## Verfügbare Tools
${TOOL_LIST_MARKDOWN}
`;

  if (ctx.activeCode) {
    prompt += `\n## Aktueller Code-Kontext (${ctx.activeToolName}${ctx.activeFileName ? `, ${ctx.activeFileName}` : ''})\n\`\`\`${ctx.language || 'html'}\n${ctx.activeCode.slice(0, maxChars)}\n\`\`\`\n`;
  }

  if (ctx.metadataTags && Object.keys(ctx.metadataTags).length > 0) {
    prompt += `\n## Projekt-Metadaten\n${JSON.stringify(ctx.metadataTags, null, 2)}\n`;
  }

  return prompt;
}
