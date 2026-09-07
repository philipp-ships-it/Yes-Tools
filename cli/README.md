# YES Tools CLI

```
██╗   ██╗███████╗███████╗    ████████╗ ██████╗  ██████╗ ██╗     ███████╗
╚██╗ ██╔╝██╔════╝██╔════╝    ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝
 ╚████╔╝ █████╗  ███████╗       ██║   ██║   ██║██║   ██║██║     ███████╗
  ╚██╔╝  ██╔══╝  ╚════██║       ██║   ██║   ██║██║     ██║     ╚════██║
   ██║   ███████╗███████║       ██║   ╚██████╔╝╚██████╔╝███████╗███████║
   ╚═╝   ╚══════╝╚══════╝       ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
```

Dokument-, HTML- und Bild-Werkzeuge als **CLI**, **TUI**, **MCP-Server** und
**Python-SDK** — nutzbar von Menschen und von beliebigen KI-Agenten.

Die CLI ist der Terminal-Zwilling der YES-Tools-Web-App: dieselben Werkzeuge,
derselbe Tool-Calling-Harness, aber mit Zugriff auf einen echten Projektordner
mit Word-, HTML- und Bilddateien.

## Installation

```bash
pip install "yestools[all]"          # alles (TUI, MCP, Dokumentformate)
pip install yestools                 # nur Kern: CLI + Agent-Harness
pip install "yestools[tui,mcp]"      # gezielt einzelne Extras
```

Aus diesem Repository heraus:

```bash
cd cli
pip install -e ".[all,dev]"
```

## Schnellstart

```bash
export OPENROUTER_API_KEY="sk-or-..."     # oder YESTOOLS_API_KEY

yestools init ~/kunde-projekt             # Workspace anlegen
cd ~/kunde-projekt
cp ~/Downloads/angebot.docx documents/

yestools                                   # TUI starten
yestools agent "wandle documents/angebot.docx in HTML nach html/ um"
```

## Die vier Wege in dieselben Werkzeuge

| Weg | Befehl | Für wen |
|---|---|---|
| **TUI** | `yestools` | Menschen — Agent-Chat, Werkzeugliste, Dateibaum |
| **Agent-CLI** | `yestools agent "…"` | Menschen & Skripte — KI mit Tool-Zugriff |
| **Direkter Tool-Aufruf** | `yestools run <tool> --json` | jeder Agent, der eine Shell starten kann |
| **MCP-Server** | `yestools mcp serve` | Claude Code, Codex CLI, opencode, OpenClaw, Cursor … |

Alle vier lesen dieselbe Registry (`src/yestools/registry.py`) — es gibt keine
Variante, die "andere" Werkzeuge kennt.

## Projekt-Workspace

```
mein-projekt/
├── .yes/
│   ├── project.json      Projekt-Manifest
│   ├── config.json        optional: Modell, Endpunkt, API-Key
│   └── tools.json         Tool-Manifest (JSON Schema) für beliebige Agenten
├── documents/             .docx, .pdf, .md
├── html/                  HTML-Dateien
├── assets/                Bilder & Medien
├── output/                Ergebnisse der Werkzeuge
├── AGENTS.md              Anleitung für KI-Agenten (offener Standard)
├── CLAUDE.md              Verweis auf AGENTS.md (Claude Code)
├── .mcp.json              MCP-Server (Claude Code, Cursor, …)
├── .codex/config.toml     MCP-Server (OpenAI Codex CLI)
└── opencode.json          MCP-Server (opencode)
```

Alle Tool-Pfade sind **projekt-relativ**. Zugriffe außerhalb des Projektordners
werden abgewiesen (Path-Jail) — bei agentischer Nutzung ist das die zentrale
Sicherheitsgrenze, weil Tool-Argumente vom Modell kommen.

## Werkzeuge

```bash
yestools tools list                  # Katalog für Menschen
yestools tools list --json           # Manifest mit JSON-Schemas (für Agenten)
yestools tools schema html_analyze   # Schema eines Werkzeugs
```

| Kategorie | Werkzeuge |
|---|---|
| `html` | `html_beautify`, `html_minify`, `html_analyze`, `html_extract_text`, `svg_optimize` |
| `word` | `word_extract_text`, `word_extract_images`, `word_to_html` |
| `text` | `fix_text_encoding`, `text_diff`, `text_hyphenate` |
| `image` | `image_convert`, `image_info` |
| `project` | `project_index`, `project_read_file`, `project_write_file` |

`html_beautify` und `html_minify` behandeln **Outlook/MSO Conditional Comments**
korrekt — dieselbe Anforderung wie im Newsletter Studio der Web-App.

## Beliebige Agenten anbinden

```bash
yestools mcp install                 # schreibt alle Client-Configs ins Projekt
yestools mcp install -c claude       # nur .mcp.json + CLAUDE.md
yestools doctor                      # zeigt, welche Agent-CLIs installiert sind
```

**MCP-fähige Agenten** (Claude Code, Codex CLI, opencode, OpenClaw, Cursor,
Windsurf, Zed) starten den Server selbst über die erzeugte Konfiguration.
Manuell:

```bash
claude mcp add yes-tools --scope project -- yestools mcp serve
codex mcp add yes-tools -- yestools mcp serve
```

**Agenten ohne MCP** (eigener Hermes-Loop, lokale Modelle, Shell-Skripte)
nutzen das Manifest plus CLI:

```bash
yestools tools list --json > tools.json     # als `tools`-Definition ans Modell
echo '{"path":"html/index.html"}' | yestools run html_analyze --json --args-file -
```

Jeder `--json`-Aufruf liefert
`{"ok":bool,"summary":str,"data":{…},"artifacts":[…],"error":str|null}`,
Exit-Code `0` bei Erfolg und `1` bei Tool-Fehlern.

## Eingebauter Agent-Harness

```bash
yestools agent "prüfe alle HTML-Dateien auf fehlende alt-Texte"
yestools agent "extrahiere die Bilder aus documents/broschuere.docx" --yes
yestools agent "was steht in documents/vertrag.docx?" --model anthropic/claude-sonnet-4.5
yestools agent "fasse html/index.html zusammen" --json     # maschinenlesbar
```

Der Loop läuft gegen jede OpenAI-kompatible API:

```bash
export YESTOOLS_BASE_URL="http://localhost:8000/v1"   # z. B. vLLM mit Hermes
export YESTOOLS_MODEL="NousResearch/Hermes-4-70B"
```

**Schreibende Werkzeuge brauchen eine Freigabe.** In der CLI wird pro Aufruf
gefragt (`--yes` überspringt das), in der TUI schaltet `Strg+W` den Schreibmodus
um. Ohne Freigabe bekommt das Modell eine klare Ablehnung zurück und kann einen
anderen Weg vorschlagen — es gibt keinen stillen Fehlschlag.

## Als Python-SDK

```python
from yestools import ProjectContext, call_tool, Agent

project = ProjectContext.discover("~/kunde-projekt")

result = call_tool("html_analyze", {"path": "html/index.html"}, project=project)
print(result.summary, result.data["findings"])

run = Agent(project=project, auto_approve=True).run("konvertiere alle Bilder zu WebP")
print(run.final_text, run.artifacts)
```

## Konfiguration

| Variable | Bedeutung | Standard |
|---|---|---|
| `OPENROUTER_API_KEY` / `YESTOOLS_API_KEY` / `VITE_OPENROUTER_API_KEY` | API-Key | – |
| `YESTOOLS_BASE_URL` | OpenAI-kompatibler Endpunkt | `https://openrouter.ai/api/v1` |
| `YESTOOLS_MODEL` | Modell | `openrouter/auto` |
| `YESTOOLS_MAX_STEPS` | maximale Tool-Runden pro Anfrage | `8` |
| `YESTOOLS_PROJECT` | Projektordner (überschreibt Autoerkennung) | aktuelles Verzeichnis |

Projektbezogen alternativ in `.yes/config.json`:

```json
{ "model": "anthropic/claude-sonnet-4.5", "maxSteps": 10, "temperature": 0.2 }
```

## Entwicklung

```bash
pip install -e ".[all,dev]"
pytest                     # Tests
yestools doctor            # Umgebung prüfen
```

Neues Werkzeug hinzufügen: Handler in `src/yestools/tools/` mit `@tool(...)`
dekorieren — CLI, TUI, MCP-Server, Manifest und System-Prompt aktualisieren
sich daraus automatisch. Details in `docs/cli-tui.md` im Repository-Root.
