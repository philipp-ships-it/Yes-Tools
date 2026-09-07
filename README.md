# YES Tools

Eine Suite aus 17 eigenständigen Web-Tools für HTML-, E-Mail-, Bild- und
Content-Workflows — mit einer nativen, werkzeugnutzenden KI ("YES KI") als
Co-Pilot, die direkt auf die Tools zugreifen kann.

## Überblick

YES Tools bündelt Werkzeuge, die in der täglichen Frontend-/E-Mail-/
Content-Produktion wiederkehren: HTML bereinigen und analysieren, Brizy-
Exporte in sauberen Code zurückverwandeln, Outlook-sichere Newsletter bauen,
Word-Dokumente konvertieren, Bilder verarbeiten, Text vergleichen und mehr —
jedes Tool eigenständig nutzbar, ohne dass eines vom anderen abhängt.

Eingebettet in jedes Tool: eine Chat-Sidebar mit einer KI, die nicht nur
Text generiert, sondern über einen echten Tool-Calling-Harness die
Kern-Werkzeuge der App selbst aufrufen kann (HTML formatieren, Encoding
reparieren, Diffs erzeugen, Code direkt in den aktiven Editor schreiben) —
Details dazu in [`docs/ai-harness.md`](docs/ai-harness.md).

## Tech-Stack

React 18 · TypeScript · Vite 6 · React Router 7 · Tailwind CSS · zustand ·
Vitest — vollständige Details in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Schnellstart

**Voraussetzung:** Node.js (aktuelle LTS empfohlen).

```bash
npm install
cp .env.example .env.local        # eigenen VITE_OPENROUTER_API_KEY eintragen
npm run dev                       # http://localhost:3000
```

```bash
npm run build      # Produktions-Build
npm run preview    # Produktions-Build lokal ansehen
npm test           # Unit-Tests (Vitest)
npm run lint       # Typprüfung (tsc --noEmit)
```

Der OpenRouter-API-Key lässt sich alternativ auch direkt in der App unter
den KI-Einstellungen hinterlegen (wird lokal im Browser gespeichert, nie an
einen eigenen Server dieses Projekts gesendet).

## Projektstruktur (Kurzfassung)

```
src/pages/       Die 17 eigenständigen Tools — siehe docs/TOOLS.md
src/lib/ai/      KI-Tool-Calling-Harness — siehe docs/ai-harness.md
src/lib/         Reine Kernlogik (auch von der Headless-CLI genutzt)
src/components/  UI-Komponenten, App-Chrome, KI-Sidebar
src/store/       Cross-Tool State (zustand)
cli/             Python-CLI, TUI & MCP-Server — siehe docs/cli-tui.md
docs/            Vollständige Dokumentation (siehe unten)
Design/          Eigenständiges CSS/JS/PHP Design-System
```

## Dokumentation

| Dokument | Inhalt |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Technischer Aufbau, Ordnerstruktur, State-Management, Deployment |
| [`docs/TOOLS.md`](docs/TOOLS.md) | Katalog aller 17 Tools mit Zweck & Quelldatei |
| [`docs/ai-harness.md`](docs/ai-harness.md) | Architektur des KI-Tool-Calling-Systems (Recherche, Design, Sicherheitsmodell) |
| [`cli/README.md`](cli/README.md) | Python-CLI, TUI & MCP-Server: Bedienung, Installation, Werkzeugkatalog |
| [`docs/cli-tui.md`](docs/cli-tui.md) | Architektur der CLI/TUI: Registry, Path-Jail, Schreibrechte, Agent-Anbindung |
| [`docs/headless-llm.md`](docs/headless-llm.md) | Headless-CLI für Automatisierung & LLM-Agenten außerhalb des Browsers |
| [`TESTING.md`](TESTING.md) | Teststrategie, Vorlagen, Konventionen |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Entwicklungs-Setup, Code-Stil, Beitragsprozess |
| [`Design/README.md`](Design/README.md) | Framework-unabhängiges Design-System (CSS/JS/PHP), extrahiert aus der App |

## Terminal & KI-Agenten (`cli/`)

Neben der Web-App gibt es YES Tools als Python-Paket mit TUI, CLI, MCP-Server
und eigenem Agent-Harness — für Projektordner voller Word-, HTML- und
Bilddateien:

```bash
pip install "yestools[all]"
yestools init ~/kunde-projekt        # Workspace: documents/ html/ assets/ output/
yestools                              # Terminal-Oberfläche mit KI-Chat
yestools agent "wandle documents/angebot.docx nach html/ um"
yestools mcp serve                    # MCP-Server für Claude Code, Codex, opencode, OpenClaw …
```

Dieselben Werkzeuge sind damit auf vier Wegen erreichbar: TUI, Agent-CLI,
direkter Tool-Aufruf (`yestools run <tool> --json`) und MCP.
Details: [`cli/README.md`](cli/README.md) und [`docs/cli-tui.md`](docs/cli-tui.md).

## Headless-Nutzung (TypeScript-Engine)

Die Kern-Funktionen der Web-App sind zusätzlich ohne Browser-UI nutzbar:

```bash
npx tsx src/lib/cli.ts HtmlTools beautify "<div><p>Hallo</p></div>"
```

Details: [`docs/headless-llm.md`](docs/headless-llm.md).

## Sicherheit

Secrets (API-Keys) werden **niemals** im Repository committed. Lokale
Umgebungsvariablen gehören in `.env.local` (per `.gitignore` ausgeschlossen);
produktive Secrets werden über Google Secret Manager zur Laufzeit injiziert
(siehe Kommentar in `service.yaml`).

## Lizenz

Internes Projekt der YES Agentur — keine öffentliche Lizenz vergeben.
