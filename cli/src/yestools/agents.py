"""Anbindung an fremde KI-Agenten.

Recherchierter Stand (September 2026) — wie die verbreiteten Agenten externe
Werkzeuge einbinden:

| Agent / Harness            | Mechanismus                                   | Datei                          |
|----------------------------|-----------------------------------------------|--------------------------------|
| Claude Code                | MCP (stdio), `claude mcp add`                 | `.mcp.json` (Projekt-Scope)    |
| OpenAI Codex CLI           | MCP (stdio), `codex mcp add`                  | `.codex/config.toml` / `~/.codex/config.toml` |
| opencode                   | MCP (`type: "local"`)                         | `opencode.json`                |
| OpenClaw                   | MCP-Server + Plugin-Tools                     | Gateway-Konfiguration          |
| Cursor / Windsurf / Zed    | MCP (stdio)                                   | client-spezifisch              |
| beliebiges Modell (Hermes, | Function-Calling über eigenen Loop            | `.yes/tools.json` + `yestools  |
| lokale Modelle, Skripte)   | oder simple Shell-Aufrufe                     | run <tool> --json`             |

Daraus folgt die Strategie: **MCP als primärer Stecker** (deckt alle großen
Agenten ab) und **JSON-Manifest + `--json`-CLI als universeller Fallback**
(deckt buchstäblich alles ab, was eine Shell starten kann). Zusätzlich eine
`AGENTS.md` — das ist der offene, von Codex, Cursor, opencode, goose, Gemini
CLI, Copilot, Zed, Jules und Aider gelesene Standard für Projektanweisungen;
Claude Code liest zusätzlich `CLAUDE.md`.
"""

from __future__ import annotations

import json
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .project import ProjectContext
from .registry import all_tools, manifest

SERVER_KEY = "yes-tools"


@dataclass(slots=True)
class WriteReport:
    """Was `install_integrations` geschrieben hat."""

    written: list[str]
    skipped: list[str]
    notes: list[str]


def server_command() -> tuple[str, list[str]]:
    """Kommando, mit dem der MCP-Server gestartet wird.

    Bevorzugt das installierte `yestools`-Skript; ist es (noch) nicht im PATH,
    wird auf `python -m yestools` zurückgefallen, damit die erzeugte
    Konfiguration in beiden Fällen funktioniert.
    """
    exe = shutil.which("yestools")
    if exe:
        return exe, ["mcp", "serve"]
    return sys.executable, ["-m", "yestools", "mcp", "serve"]


def mcp_json_config(project: ProjectContext) -> dict[str, Any]:
    """Konfigurationsblock im Claude-Code-Format (`.mcp.json`)."""
    command, args = server_command()
    return {
        "mcpServers": {
            SERVER_KEY: {
                "type": "stdio",
                "command": command,
                "args": args,
                "env": {"YESTOOLS_PROJECT": str(project.root)},
            }
        }
    }


def opencode_config(project: ProjectContext) -> dict[str, Any]:
    """Konfigurationsblock im opencode-Format (`opencode.json`)."""
    command, args = server_command()
    return {
        "$schema": "https://opencode.ai/config.json",
        "mcp": {
            SERVER_KEY: {
                "type": "local",
                "command": [command, *args],
                "enabled": True,
                "environment": {"YESTOOLS_PROJECT": str(project.root)},
            }
        },
    }


def codex_toml(project: ProjectContext) -> str:
    """Konfigurationsblock im Codex-CLI-Format (`.codex/config.toml`)."""
    command, args = server_command()
    arg_list = ", ".join(json.dumps(a) for a in args)
    return (
        f"# YES Tools MCP-Server — von `yestools mcp install` erzeugt\n"
        f"[mcp_servers.{SERVER_KEY.replace('-', '_')}]\n"
        f"command = {json.dumps(command)}\n"
        f"args = [{arg_list}]\n\n"
        f"[mcp_servers.{SERVER_KEY.replace('-', '_')}.env]\n"
        f"YESTOOLS_PROJECT = {json.dumps(str(project.root))}\n"
    )


def agents_md(project: ProjectContext) -> str:
    """Inhalt der `AGENTS.md` für den Projektordner."""
    tools = all_tools()
    by_category: dict[str, list[str]] = {}
    for spec in tools:
        by_category.setdefault(spec.category, []).append(
            f"- `{spec.name}`{' *(schreibend)*' if spec.writes else ''} — {spec.description}"
        )
    catalog = "\n\n".join(
        f"### {cat}\n\n" + "\n".join(lines) for cat, lines in sorted(by_category.items())
    )
    folders = project.meta.get("folders") or ["documents", "html", "assets", "output"]
    folder_lines = "\n".join(f"- `{f}/`" for f in folders)

    return f"""# AGENTS.md — {project.name}

Dieses Projekt ist ein **YES-Tools-Workspace**. Es enthält Dokumente (Word,
HTML, Bilder) und eine CLI mit {len(tools)} Werkzeugen, die du als Agent direkt
nutzen kannst.

## Ordner

{folder_lines}

Schreibe Ergebnisse bevorzugt nach `output/` und überschreibe Originale nicht
ohne ausdrücklichen Auftrag.

## Werkzeuge nutzen — drei Wege

**1. MCP (bevorzugt, wenn dein Harness es unterstützt)**

Der Server ist in `.mcp.json` hinterlegt. Claude Code, Codex CLI, opencode,
OpenClaw, Cursor, Windsurf und Zed können ihn direkt starten:

```bash
yestools mcp serve        # stdio-MCP-Server, stellt alle Tools bereit
```

**2. Direkte CLI-Aufrufe (funktioniert immer)**

```bash
yestools tools list --json                      # Alle Tools mit JSON-Schema
yestools run html_analyze --json --arg path=html/index.html
echo '{{"path": "documents/brief.docx"}}' | yestools run word_extract_text --json --args-file -
```

Jeder Aufruf mit `--json` liefert
`{{"ok": bool, "summary": str, "data": {{…}}, "artifacts": [pfade], "error": str|null}}`
auf stdout. Exit-Code `0` = Erfolg, `1` = Tool-Fehler. Parse `summary` für
Menschen, `data` für Maschinen.

**3. Manifest für eigene Function-Calling-Loops**

`.yes/tools.json` enthält alle Tools inklusive JSON-Schema — geeignet, um sie
einem beliebigen Modell (Hermes, lokale Modelle, eigene Skripte) als
`tools`-Definition zu übergeben und die Aufrufe dann per CLI auszuführen.

## Werkzeugkatalog

{catalog}

## Regeln

- Rate keine Dateinamen — rufe zuerst `project_index` auf.
- Alle Pfade sind **projekt-relativ**; Zugriffe außerhalb dieses Ordners werden
  von der CLI abgewiesen (Path-Jail).
- Mit *(schreibend)* markierte Tools verändern Dateien. `project_write_file`
  überschreibt nur mit `overwrite=true`.
- Für `.docx` nutze `word_extract_text` / `word_to_html`, nicht
  `project_read_file` (Binärformat).
"""


def claude_md(project: ProjectContext) -> str:
    return f"""# CLAUDE.md

Dieses Projekt folgt dem offenen `AGENTS.md`-Standard.
**Bitte `AGENTS.md` in diesem Ordner lesen** — dort stehen die Projektstruktur,
alle verfügbaren YES-Tools und die Regeln für Dateizugriffe.

Kurzform: `yestools tools list --json` zeigt die Werkzeuge,
`yestools run <tool> --json --arg key=value` ruft eines auf, und der
MCP-Server aus `.mcp.json` (`yestools mcp serve`) stellt dieselben Werkzeuge
nativ als Tool-Calls bereit.

Projektordner: `{project.root}`
"""


def _merge_json_file(path: Path, addition: dict[str, Any], merge_key: str) -> str:
    """Führt einen Konfigurationsblock in eine bestehende JSON-Datei ein.

    Vorhandene Einstellungen des Nutzers bleiben erhalten — es wird nur der
    eigene Server-Eintrag unter `merge_key` gesetzt bzw. aktualisiert.
    """
    existing: dict[str, Any] = {}
    if path.is_file():
        try:
            loaded = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                existing = loaded
        except json.JSONDecodeError:
            backup = path.with_suffix(path.suffix + ".bak")
            shutil.copy2(path, backup)
            existing = {}

    for key, value in addition.items():
        if key == merge_key and isinstance(value, dict):
            current = existing.get(merge_key)
            merged = dict(current) if isinstance(current, dict) else {}
            merged.update(value)
            existing[merge_key] = merged
        else:
            existing.setdefault(key, value)

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(existing, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path.name


def install_integrations(
    project: ProjectContext,
    clients: tuple[str, ...] = ("claude", "codex", "opencode", "manifest", "agents"),
    force: bool = False,
) -> WriteReport:
    """Schreibt die Integrationsdateien in den Projektordner."""
    written: list[str] = []
    skipped: list[str] = []
    notes: list[str] = []
    root = project.root

    if "claude" in clients:
        written.append(_merge_json_file(root / ".mcp.json", mcp_json_config(project), "mcpServers"))
        target = root / "CLAUDE.md"
        if target.exists() and not force:
            skipped.append("CLAUDE.md (existiert — mit --force überschreiben)")
        else:
            target.write_text(claude_md(project), encoding="utf-8")
            written.append("CLAUDE.md")
        notes.append("Claude Code: fragt beim ersten Start nach Freigabe des Projekt-MCP-Servers.")

    if "opencode" in clients:
        written.append(
            _merge_json_file(root / "opencode.json", opencode_config(project), "mcp")
        )

    if "codex" in clients:
        target = root / ".codex" / "config.toml"
        target.parent.mkdir(parents=True, exist_ok=True)
        block = codex_toml(project)
        if target.exists():
            current = target.read_text(encoding="utf-8")
            if SERVER_KEY.replace("-", "_") in current and not force:
                skipped.append(".codex/config.toml (Eintrag vorhanden)")
            else:
                target.write_text(current.rstrip() + "\n\n" + block, encoding="utf-8")
                written.append(".codex/config.toml")
        else:
            target.write_text(block, encoding="utf-8")
            written.append(".codex/config.toml")
        notes.append(
            "Codex CLI: projektbezogene Configs greifen nur in als vertrauenswürdig "
            "markierten Projekten — alternativ `codex mcp add yes-tools -- yestools mcp serve`."
        )

    if "manifest" in clients:
        target = root / ".yes" / "tools.json"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(
            json.dumps(manifest(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        written.append(".yes/tools.json")

    if "agents" in clients:
        target = root / "AGENTS.md"
        if target.exists() and not force:
            skipped.append("AGENTS.md (existiert — mit --force überschreiben)")
        else:
            target.write_text(agents_md(project), encoding="utf-8")
            written.append("AGENTS.md")

    return WriteReport(written=written, skipped=skipped, notes=notes)


def detect_agents() -> dict[str, str | None]:
    """Prüft, welche Agent-CLIs auf diesem Rechner installiert sind."""
    candidates = {
        "claude": "Claude Code",
        "codex": "OpenAI Codex CLI",
        "opencode": "opencode",
        "openclaw": "OpenClaw",
        "gemini": "Gemini CLI",
        "goose": "goose",
        "aider": "Aider",
        "crush": "Crush",
    }
    return {label: shutil.which(binary) for binary, label in candidates.items()}
