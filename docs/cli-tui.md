# CLI, TUI & MCP-Server (`cli/`)

Der Ordner `cli/` enthält **YES Tools als Python-Paket**: eine Kommandozeile,
eine Terminal-Oberfläche, einen MCP-Server und einen Agent-Harness. Das ist
der Terminal-Zwilling der Web-App — gleiche Werkzeuge, gleiches Harness-Muster,
aber mit Zugriff auf einen echten Projektordner voller Word-, HTML- und
Bilddateien.

Die Bedienungsanleitung steht in [`../cli/README.md`](../cli/README.md). Dieses
Dokument erklärt **Architektur und Entscheidungen**.

## 1. Recherche: wie Agenten an fremde Werkzeuge kommen

Stand September 2026 gibt es dafür genau zwei etablierte Wege — und die
Architektur bedient bewusst beide:

| Weg | Wer nutzt ihn | Konsequenz für uns |
|---|---|---|
| **MCP** (Model Context Protocol, stdio/HTTP) | Claude Code, OpenAI Codex CLI, opencode, OpenClaw, Cursor, Windsurf, Zed | Ein MCP-Server deckt alle großen Agenten ab, ohne pro Agent Code zu schreiben |
| **Shell + JSON** | alles andere: eigene Function-Calling-Loops (Hermes, lokale Modelle), CI-Skripte, Makefiles | `yestools run <tool> --json` plus ein Manifest mit JSON-Schemas |

Ergänzend hat sich **`AGENTS.md`** als offenes Format für Projektanweisungen
durchgesetzt (über 60.000 Repositories; gelesen von Codex, Cursor, opencode,
goose, Gemini CLI, Copilot, Zed, Warp, Jules, Aider). Claude Code liest
zusätzlich `CLAUDE.md`. `yestools init` schreibt beides.

Konkrete Konfigurationsformate, die `yestools mcp install` erzeugt:

```jsonc
// .mcp.json  — Claude Code (Projekt-Scope), auch von Cursor/Zed gelesen
{ "mcpServers": { "yes-tools": {
    "type": "stdio", "command": "yestools", "args": ["mcp", "serve"],
    "env": { "YESTOOLS_PROJECT": "/pfad/zum/projekt" } } } }
```

```toml
# .codex/config.toml — OpenAI Codex CLI
[mcp_servers.yes_tools]
command = "yestools"
args = ["mcp", "serve"]
```

```jsonc
// opencode.json — opencode
{ "mcp": { "yes-tools": {
    "type": "local", "command": ["yestools", "mcp", "serve"], "enabled": true } } }
```

## 2. Eine Registry, vier Konsumenten

```
                    ┌──────────────────────────────┐
                    │   registry.py  (ToolSpec)    │
                    │  Name · JSON-Schema · Handler│
                    └──────────────┬───────────────┘
          ┌───────────────┬────────┴───────┬────────────────────┐
          ▼               ▼                ▼                    ▼
   cli.py (Mensch)   tui.py (Mensch)  harness.py (eigene   mcp_server.py
   yestools run …    Agent-Chat        KI, OpenAI-Format)   (fremde Agenten)
                                              │
                                       tools/*.py Handler
                                              │
                                    project.py (Path-Jail)
```

Der entscheidende Punkt: **kein Konsument hat eine eigene Tool-Liste.**
Beschreibung, Schema und Ausführung kommen immer aus derselben `ToolSpec`.
Ein neu registriertes Werkzeug erscheint automatisch in CLI-Hilfe, TUI-Liste,
System-Prompt, MCP-Server und `.yes/tools.json` — es gibt keine Stelle, an der
man es "auch noch" eintragen müsste, und damit keine Drift.

### Werkzeug hinzufügen

```python
# cli/src/yestools/tools/meine_tools.py
from ..registry import tool
from ..schemas import Param, ToolResult

@tool(
    "css_purge",
    title="Ungenutztes CSS entfernen",
    description="Entfernt CSS-Regeln, die im HTML nicht vorkommen. …",
    category="html",
    params=[
        Param("html_path", "string", "HTML-Datei.", required=True),
        Param("out_path", "string", "Optionaler Zielpfad."),
    ],
    writes=True,
    writes_when="out_path",     # schreibt nur, wenn out_path gesetzt ist
)
def css_purge(project, html_path, out_path=None) -> ToolResult:
    ...
```

Modul in `tools/__init__.py` importieren, Test in `tests/test_tools.py` — fertig.

## 3. Der Projekt-Workspace und das Path-Jail

Ein Projekt ist ein Ordner mit `.yes/`. Alle Tool-Pfade sind projekt-relativ
und laufen durch `ProjectContext.resolve()` — die einzige Stelle, die aus einem
String einen Pfad macht.

Warum so streng? **Tool-Argumente kommen bei agentischer Nutzung vom Modell**,
dessen Ausgabe wiederum von Inhalten im Kontext beeinflussbar ist
(Prompt-Injection über eine analysierte HTML-Datei ist ein realistischer
Angriffsweg). Ohne Jail wäre `{"path": "../../.ssh/id_rsa"}` ein gültiger
Aufruf. `resolve()` weist deshalb ab:

- `..`-Ausbrüche und absolute Pfade außerhalb des Projekts
- Symlinks, die nach außen zeigen (Auflösung vor der Prüfung)
- Pfade mit Null-Bytes

Getestet in `tests/test_project.py::TestPathJail` — inklusive des Nachweises,
dass das Jail auch **über MCP** greift (`tests/test_mcp_and_tui.py`).

### Zip-Slip

`word_extract_images` verwendet ausschließlich den Basisnamen der
Archiv-Einträge. Ein manipuliertes .docx mit `word/media/../../evil.png` kann
damit nicht aus dem Zielordner ausbrechen.

## 4. Schreibrechte: dreistufig

Nicht jedes Werkzeug, das schreiben *kann*, schreibt bei jedem Aufruf.
`html_beautify` gibt ohne `out_path` nur zurück. Deshalb kennt `ToolSpec` drei
Zustände:

| `writes` | `writes_when` | Bedeutung |
|---|---|---|
| `False` | – | rein lesend (`html_analyze`, `text_diff`, `project_index`) |
| `True` | `"out_path"` | schreibt nur, wenn dieser Parameter gesetzt ist |
| `True` | `None` | schreibt immer (`project_write_file`, `image_convert`, `word_extract_images`) |

`Agent._may_run()` fragt über `spec.call_writes(args)` den **konkreten Aufruf**,
nicht das Werkzeug. Ohne diese Unterscheidung würde die CLI bei jedem
`html_beautify` unnötig eine Freigabe verlangen — und Nutzer, die ständig
gefragt werden, klicken irgendwann alles weg. Das ist der eigentliche Grund für
die Differenzierung: Rückfragen müssen selten und deshalb aussagekräftig sein.

Freigabe-Mechanik:

- **CLI**: interaktive Rückfrage pro Aufruf, `--yes` überspringt sie
- **TUI**: Schreibmodus mit **F2** umschalten (Standard: aus)
- **`--json`-Modus**: keine Freigabe möglich → schreibende Aufrufe werden
  abgelehnt (es ist kein Mensch da, der zustimmen könnte)
- **MCP**: der Client entscheidet (Claude Code fragt selbst); die
  Tool-Beschreibung sagt dem Modell zusätzlich, wann es schreiben darf

Abgelehnte Aufrufe geben dem Modell eine **erklärende Fehlermeldung** zurück,
kein stilles Nichts — es kann dann nachfragen oder einen Lesepfad wählen.

## 5. Der Agent-Loop

`harness.py` folgt demselben Muster wie `src/lib/ai/agent.ts` in der Web-App
(siehe [`ai-harness.md`](ai-harness.md)):

1. Anfrage an das Modell **mit** allen Tool-Schemas
2. `tool_calls` in der Antwort? → ausführen, Ergebnis als `role: "tool"` zurück
   in den Verlauf, zurück zu 1
3. keine `tool_calls` mehr → finale Antwort

Terminal-spezifische Ergänzungen:

- **`AgentEvent`-Strom**: CLI und TUI rendern Fortschritt live, statt auf das
  Ende zu warten. Die TUI führt den Loop in einem Worker-Thread und schiebt
  Ereignisse per `call_from_thread` in den Chat.
- **Ergebnis-Kürzung** (`_truncate_for_model`): ein formatiertes 500-KB-HTML
  würde das Kontextfenster sprengen und Geld kosten. Große Textfelder gehen
  gekürzt (mit Hinweis) ans Modell; das vollständige Ergebnis bleibt lokal und
  in geschriebenen Dateien.
- **`MAX_STEPS`** aus den Settings (Standard 8) begrenzt Tool-Runden pro
  Anfrage.
- **Provider-agnostisch**: alles läuft über `/chat/completions` im
  OpenAI-Format. Damit funktionieren OpenRouter (Claude, GPT, Gemini,
  DeepSeek …) und jeder selbst gehostete Endpunkt gleich — für ein
  Hermes-Modell über vLLM genügen `YESTOOLS_BASE_URL` und `YESTOOLS_MODEL`.

## 6. Abhängigkeiten und Extras

Der Kern (`typer`, `rich`, `httpx`) reicht für CLI und Agent-Harness. Alles
Formatspezifische liegt in Extras:

| Extra | Pakete | Ohne das Extra |
|---|---|---|
| `tui` | textual | `yestools` (TUI) meldet den Installationsbefehl |
| `mcp` | mcp ≥ 2 | `yestools mcp serve` meldet den Installationsbefehl |
| `docs` | python-docx, mammoth, beautifulsoup4, pyphen, pillow | betroffene Tools liefern `MissingDependency` mit exaktem `pip`-Befehl |

**Word-Text und Word-Bilder brauchen bewusst kein Extra**: ein .docx ist ein
ZIP mit `word/document.xml` und `word/media/*` — `zipfile` + `xml.etree` aus der
Standardbibliothek genügen. Nur die HTML-Konvertierung nutzt `mammoth`, weil
semantisches HTML aus Word-Styles zu komplex für eine Eigenimplementierung ist.

`yestools doctor` zeigt, was installiert ist, ob ein API-Key gefunden wurde
(nie den Key selbst) und welche Agent-CLIs auf dem Rechner liegen.

## 7. HTML-Formatierer ohne js-beautify

`htmlfmt.py` ist eine eigene Implementierung (reine Standardbibliothek), weil
generische Formatierer eine für YES zentrale Anforderung verletzen:
**Outlook/MSO Conditional Comments** müssen unangetastet bleiben.

- Einzeilige Blöcke (`<!--[if mso]>…<![endif]-->`) bleiben in einer Zeile und
  verschieben die Einrückung der Folgeelemente nicht
- Mehrzeilige Blöcke bleiben **wörtlich** erhalten — innerhalb eines
  Conditional-Blocks wird nicht umformatiert, weil Outlook dort empfindlich ist
- `minify(strip_comments=True)` entfernt normale Kommentare, MSO-Kommentare
  aber nie — sie sind layouttragend
- `<pre>`, `<textarea>`, `<script>`, `<style>` bleiben inhaltlich unberührt;
  Inline-Elemente werden nicht auf eigene Zeilen gebrochen

Gleiches Verhalten wie `src/utils/msoFormatter.ts` in der Web-App.

## 8. Tests

```bash
cd cli && pytest          # 134 Tests
```

| Datei | Deckt ab |
|---|---|
| `test_schemas.py` | Argument-Validierung (Typen, enum, unbekannte Felder) |
| `test_project.py` | Workspace, Index, **Path-Jail** (inkl. Symlink-Ausbruch) |
| `test_tools.py` | alle Werkzeuge + Registry-Invarianten + MSO-Formatierung |
| `test_harness.py` | Agent-Loop mit `httpx.MockTransport`: Tool-Roundtrip, Freigabe-Policy, `MAX_STEPS`, Fehlerfälle |
| `test_cli.py` | CLI über `CliRunner`: `--json`-Ausgabe, Exit-Codes, Config-Merge |
| `test_mcp_and_tui.py` | MCP-Server über `list_tools`/`call_tool`; TUI headless via `run_test()` |
| `test_mcp_integration.py` | **echter stdio-Handshake** mit dem offiziellen MCP-Client als Subprozess |

Es wird nie gegen eine echte LLM-API getestet — der Loop wird über einen
Mock-Transport geprüft, die Werkzeuge über echte Dateien in `tmp_path`.

## 9. Bewusst offen gelassen

- **Kein Streaming** der Modell-Antwort (die UI wartet pro Runde auf die
  vollständige Antwort). Tool-Fortschritt ist dagegen live.
- **Keine Diff-Vorschau vor schreibenden Tools** — für produktive Nutzung wäre
  „Diff zeigen, dann bestätigen" die nächste sinnvolle Stufe.
- **Kein Rate-Limiting/Budget** pro Lauf (die Web-App hat das über
  `openrouterService.ts`; in der CLI fehlt es noch).
- **Keine parallelen Tool-Aufrufe** — Tool-Calls einer Runde laufen
  sequenziell, was Debugging einfach hält und bei Dateioperationen
  Wettläufe vermeidet.
