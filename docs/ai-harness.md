# KI-Harness: Tool-Calling-Architektur der "YES KI"

Dieses Dokument beschreibt die Architektur des Tool-Calling-Systems, das die
native KI (im Code als "YES KI", Komponente `EmbeddedAiSidebar`, sowie die
Seite `CoCreator`) mit den bestehenden Werkzeugen der App verbindet. Es ist
das Ergebnis einer gezielten Recherche zu Best Practices für "Function
Calling" / "Tool Use" bei LLM-Agenten (OpenAI, Anthropic, allgemeine
Agent-Loop-Muster) und deren Anwendung auf diese Codebasis.

## 1. Recherche-Grundlage: wie andere Systeme das lösen

Alle gängigen LLM-Function-Calling-Systeme (OpenAI "function calling" /
"tools", Anthropic "tool use", Google Gemini "function calling") folgen im
Kern demselben Muster, das man als **ReAct-Loop** (Reason → Act → Observe)
bezeichnet:

1. Das Modell bekommt neben der Konversation eine Liste verfügbarer
   **Tools** als JSON-Schema (Name, Beschreibung, Parameter-Schema).
2. Das Modell antwortet entweder mit normalem Text ODER mit einem oder
   mehreren **Tool-Aufrufen** (Name + JSON-Argumente).
3. Der Client (nicht das Modell!) führt das Tool tatsächlich aus.
4. Das Ergebnis wird als neue Nachricht mit einer speziellen Rolle
   (`tool` bei OpenAI-kompatiblen APIs) an die Konversation angehängt.
5. Zurück zu Schritt 2 — bis das Modell ohne weitere Tool-Aufrufe antwortet.

Diese Schleife nennen wir hier bewusst **"Harness"**: die KI selbst
"denkt" nur; das Harness drumherum ist verantwortlich für Ausführung,
Fehlerbehandlung, Anzeige und Abbruchbedingungen. Das Modell bekommt nie
direkten Zugriff auf Code-Ausführung — es kann nur *anfragen*, ein
registriertes Tool mit bestimmten Argumenten auszuführen.

**Warum OpenAI-Format statt eines eigenen Formats?** Der bestehende Client
`src/services/openrouterService.ts` spricht die OpenRouter-API, die exakt
das OpenAI-`tools`-Format durchreicht. Das Format 1:1 zu übernehmen bedeutet:
kein Übersetzungs-Layer nötig, und ein späterer Wechsel auf einen anderen
Provider (Anthropic, OpenAI direkt) erfordert nur kleine Anpassungen.

## 2. Architektur-Überblick

```
Nutzer-Eingabe (EmbeddedAiSidebar / CoCreator)
        │
        ▼
buildSystemPrompt()          ──  src/lib/ai/systemPrompt.ts
        │  (System-Prompt inkl. Tool-Liste + Code-Kontext)
        ▼
runAgentTurn()                ──  src/lib/ai/agent.ts
        │
        ├─► callOpenRouterChat()   ──  src/services/openrouterService.ts
        │        (sendet messages + tools an OpenRouter)
        │
        ├─► tool_calls in Antwort? ──► findTool() + execute()  ──  src/lib/ai/tools.ts
        │        │                          │
        │        │                          ▼
        │        │                   src/lib/headless.ts (bestehende, reine
        │        │                   Tool-Implementierungen — dieselben, die
        │        │                   auch die Headless-CLI nutzt, siehe
        │        │                   docs/headless-llm.md)
        │        │
        │        └─► Ergebnis als role:"tool" zurück in die Konversation
        │
        └─► keine tool_calls mehr → finale Antwort an den Nutzer
                │
                ▼
        ToolCallBubble (UI)   ──  src/components/ui/ToolCallBubble.tsx
        zeigt jeden Tool-Aufruf live: Name, Status, Argumente, Ergebnis
```

### Dateien

| Datei | Verantwortung |
|---|---|
| `src/lib/ai/types.ts` | Gemeinsame Typen (`ToolSchema`, `ToolDefinition`, `ToolCallDisplay`, …) |
| `src/lib/ai/tools.ts` | Die Tool-Registry: JSON-Schema + Ausführungslogik pro Tool |
| `src/lib/ai/systemPrompt.ts` | Baut den System-Prompt inkl. Tool-Liste + Code-Kontext |
| `src/lib/ai/agent.ts` | Der eigentliche Agent-Loop (`runAgentTurn`) |
| `src/components/ui/ToolCallBubble.tsx` | UI-Baustein: zeigt einen Tool-Aufruf im Chat |
| `src/components/EmbeddedAiSidebar.tsx` | Integriert den Harness in die Chat-UI (`handleSendMessage`) |

## 3. Tool-Registry: Design-Entscheidungen

Jedes Tool ist ein Objekt `{ schema, execute }` (siehe `src/lib/ai/types.ts`,
`ToolDefinition`). Die Registry (`TOOL_REGISTRY` in `src/lib/ai/tools.ts`)
ist bewusst eine flache Liste, kein Plugin-System mit Auto-Discovery — bei
sieben Tools ist explizite Registrierung übersichtlicher und verhindert,
dass versehentlich jede Funktion aus `headless.ts` der KI zugänglich wird.

**Warum ein Wrapper um `headless.ts` statt eigener Logik?** Die Datei
`src/lib/headless.ts` existierte bereits als kuratierte, reine
Funktionssammlung für die Headless-CLI (`docs/headless-llm.md`). Die KI im
Browser bekommt bewusst dieselben Werkzeuge — das vermeidet doppelte
Implementierungen und stellt sicher, dass CLI und KI-Assistent sich
identisch verhalten.

## 4. Sicherheitsmodell

Ein LLM-Tool-Aufruf ist im Kern **von außen beeinflussbarer Code** — die
Argumente kommen vom Modell, dessen Ausgabe wiederum (bei manchen
Anwendungsfällen) durch Inhalte im Kontext beeinflusst werden kann
("Prompt Injection", z. B. wenn ein Tool-Ergebnis selbst wieder Text
enthält, der wie eine Anweisung aussieht). Daraus ergeben sich zwei feste
Regeln für diese Registry:

1. **Keine dynamische Code-Ausführung.** `DataTools.transformJSON` aus
   `headless.ts` führt intern `new Function(...)` mit einem vom Aufrufer
   übergebenen Funktionskörper aus. Für eine Kommandozeile, die der
   Entwickler selbst bedient, ist das ein akzeptables Trade-off. Der KI
   geben wir dafür **kein** Tool — das ist eine bewusste Entscheidung,
   keine Lücke (siehe Test `tools.test.ts`, "enthält kein Tool für
   dynamische Code-Ausführung").
2. **Schreibende Tools sind explizit gekennzeichnet und im System-Prompt
   eingeschränkt.** `set_active_editor_code` überschreibt den Code im
   aktiven Tool des Nutzers. Der System-Prompt weist das Modell
   ausdrücklich an, dieses Tool nur nach expliziter Aufforderung des
   Nutzers zu verwenden (siehe `systemPrompt.ts`). Das ist eine
   Prompt-Ebene-Absicherung — kein technischer Zwang — daher bleibt sie
   dokumentiert als bekannte Grenze, nicht als Garantie.

Weitere Grenzen des aktuellen Stands (bewusst, für einen Basis-Prototyp):

- **Kein Rate-Limiting pro Tool.** Die bestehenden OpenRouter-Budget-Limits
  (`getOpenRouterLimits`) greifen nur auf Ebene der Chat-Requests, nicht
  pro Tool-Aufruf.
- **`MAX_STEPS = 5`** in `agent.ts` begrenzt die Anzahl der
  Tool-Roundtrips pro Nutzer-Nachricht hart, um Endlosschleifen bei
  wiederholt fehlschlagenden Tool-Aufrufen zu verhindern.
- **Kein Bestätigungsdialog vor schreibenden Tool-Aufrufen.** Für einen
  produktiven Rollout wäre ein "Diff-Vorschau + Bestätigen"-Schritt vor
  `set_active_editor_code` empfehlenswert (siehe Abschnitt 6, Ausblick).

## 5. System-Prompt-Design

`buildSystemPrompt()` folgt vier Prinzipien, die in der Praxis die
Zuverlässigkeit von Tool-Aufrufen deutlich verbessern:

1. **Konkrete Trigger statt abstrakter Fähigkeitsliste.** Statt nur "du
   kannst HTML formatieren" steht im Prompt explizit *wann* das Tool zu
   nutzen ist ("statt es von Hand nachzubilden").
2. **Kontext eng begrenzen.** Der aktive Code wird auf 15.000 Zeichen
   gekappt (`maxCodeContextChars`), um Kosten und Kontextlimits im Griff
   zu behalten — bei Bedarf kann die KI über `get_active_editor_code`
   gezielt (erneut) nachfragen.
3. **Schreibrechte explizit einschränken** (siehe Sicherheitsmodell oben).
4. **Tool-Liste wird aus der Registry generiert, nicht von Hand
   gepflegt** (`TOOL_LIST_MARKDOWN` in `systemPrompt.ts`) — ein neues Tool
   in `tools.ts` taucht automatisch im Prompt auf, ohne dass der Prompt
   selbst angefasst werden muss.

## 6. UI-Konzept: Tool-Calls im Chat sichtbar machen

`ToolCallBubble.tsx` zeigt jeden Tool-Aufruf als eigenen, einklappbaren
Block über der eigentlichen KI-Antwort (Vorbild: die "Tool use"-Darstellung
in Claude/Cursor/ChatGPT-artigen Oberflächen):

- **Kollabiert**: Name des Tools, Status-Icon (läuft/erfolgreich/Fehler),
  eine einzeilige Ergebnis-Zusammenfassung.
- **Aufgeklappt**: vollständige Argumente (JSON) und vollständiges
  Ergebnis.

Der Status wird **live** aktualisiert: `onToolCall` in `agent.ts` feuert
einmal mit `status: "running"`, sobald ein Tool-Aufruf beginnt, und ein
zweites Mal mit dem finalen Status — die UI muss nicht auf das Ende der
gesamten Agent-Runde warten, um Fortschritt zu zeigen.

## 7. Ein neues Tool hinzufügen

1. In `src/lib/ai/tools.ts` ein neues `ToolDefinition`-Objekt anlegen
   (Schema + `execute`). Wenn die Logik schon in `src/lib/headless.ts`
   oder einem `src/utils/*` Modul existiert: dort importieren, hier nur
   das Schema + dünnen Wrapper ergänzen.
2. Das Objekt in `TOOL_REGISTRY` aufnehmen.
3. Test in `src/lib/ai/tools.test.ts` ergänzen (Schema vorhanden,
   `execute` liefert erwartetes Ergebnis, Fehlerfall abgedeckt).
4. Fertig — System-Prompt und `TOOL_SCHEMAS` aktualisieren sich
   automatisch, keine weiteren Anpassungen nötig.

## 8. Ausblick / bewusst nicht umgesetzt

Als nächste sinnvolle Ausbaustufen (nicht Teil dieses Basis-Prototyps):

- **Bestätigungs-UI vor schreibenden Tool-Aufrufen** (Diff-Vorschau,
  "Übernehmen"/"Verwerfen"-Buttons in `ToolCallBubble`).
- **Streaming** der Modell-Antwort (aktuell wartet die UI auf die
  vollständige Antwort pro Runde) — OpenRouter unterstützt SSE-Streaming,
  `callOpenRouterChat` müsste dafür um einen Streaming-Modus erweitert
  werden.
- **Persistente Tool-Aufruf-Historie** in den Chat-Sessions (aktuell
  werden `toolCalls` nicht in `STORAGE_CHAT_SESSIONS_KEY` mitgespeichert).
- **Weitere Tools** aus `headless.ts` (`WordTools`, `ImageTools`,
  `MeasureTools`) — bewusst zunächst ausgeklammert, da sie Datei-/Canvas-
  Handling brauchen, das im Chat-Kontext (noch) nicht sauber abgebildet ist.
