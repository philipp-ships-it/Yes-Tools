"""Die Kommandozeile (Typer + Rich).

Aufbau — agent-first: `yestools "..."` bzw. `yestools agent "..."` ist der
Hauptweg. Alles andere (direkter Tool-Aufruf, MCP-Server, Manifest) sind
gleichwertige, aber sekundäre Einstiege.

    yestools                     TUI starten (interaktiv)
    yestools agent "..."         Agent-Loop mit Tool-Calling
    yestools init [pfad]         Projekt-Workspace anlegen
    yestools run <tool> …        Ein Tool direkt aufrufen (für Agenten/Skripte)
    yestools tools list          Werkzeugkatalog (Mensch oder --json)
    yestools mcp serve           MCP-Server für fremde Agenten
    yestools mcp install         Agent-Konfigurationen ins Projekt schreiben
    yestools index               Projektdateien auflisten
    yestools doctor              Umgebung prüfen
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Optional

import typer
from rich.console import Console
from rich.json import JSON
from rich.panel import Panel
from rich.syntax import Syntax
from rich.table import Table
from rich.text import Text

from . import __version__
from .agents import detect_agents, install_integrations
from .banner import render_banner
from .config import load_settings
from .project import ProjectContext
from .registry import all_tools, call_tool, categories, get_tool, manifest
from .schemas import ToolError, ToolSpec

app = typer.Typer(
    name="yestools",
    help="YES Tools — Dokument-, HTML- und Bild-Werkzeuge für Menschen und KI-Agenten.",
    no_args_is_help=False,
    add_completion=True,
    rich_markup_mode="rich",
)
tools_app = typer.Typer(help="Werkzeugkatalog und Schemas.")
mcp_app = typer.Typer(help="MCP-Server und Agent-Integrationen.")
app.add_typer(tools_app, name="tools")
app.add_typer(mcp_app, name="mcp")

console = Console()
err_console = Console(stderr=True)


# --------------------------------------------------------------------------- #
# Hilfsfunktionen                                                             #
# --------------------------------------------------------------------------- #


def _project(path: str | None = None) -> ProjectContext:
    return ProjectContext.discover(path)


def _parse_args(pairs: list[str], args_file: str | None) -> dict[str, Any]:
    """Baut das Argument-Dict aus `--arg k=v` und/oder `--args-file`.

    Werte werden als JSON interpretiert, wenn möglich (`true`, `12`, `["a"]`),
    sonst als String übernommen. So bleiben einfache Aufrufe kurz, ohne dass
    typisierte Werte unmöglich werden.
    """
    args: dict[str, Any] = {}

    if args_file:
        raw = sys.stdin.read() if args_file == "-" else Path(args_file).read_text(encoding="utf-8")
        try:
            loaded = json.loads(raw or "{}")
        except json.JSONDecodeError as exc:
            raise typer.BadParameter(f"--args-file enthält kein gültiges JSON: {exc}")
        if not isinstance(loaded, dict):
            raise typer.BadParameter("--args-file muss ein JSON-Objekt enthalten.")
        args.update(loaded)

    for pair in pairs:
        if "=" not in pair:
            raise typer.BadParameter(f"--arg erwartet key=value, bekam '{pair}'.")
        key, _, value = pair.partition("=")
        try:
            args[key.strip()] = json.loads(value)
        except json.JSONDecodeError:
            args[key.strip()] = value
    return args


def _print_banner() -> None:
    console.print(render_banner(console.width))
    console.print()


def _short_desc(text: str, limit: int = 88) -> str:
    """Kürzt eine Beschreibung an der Wortgrenze.

    Bewusst kein Satz-Split an ". ": deutsche Abkürzungen wie "z. B." würden
    dabei mitten im Wort abschneiden.
    """
    clean = " ".join(text.split())
    if len(clean) <= limit:
        return clean
    return clean[:limit].rsplit(" ", 1)[0].rstrip(",;:") + " …"


def _tool_table(specs: list[ToolSpec]) -> Table:
    table = Table(show_header=True, header_style="bold", box=None, pad_edge=False)
    table.add_column("Tool", style="bold cyan", no_wrap=True)
    table.add_column("Beschreibung")
    table.add_column("", no_wrap=True)
    for spec in specs:
        if not spec.writes:
            flags = Text("")
        elif spec.writes_when:
            flags = Text(f"schreibt: {spec.writes_when}", style="yellow")
        else:
            flags = Text("schreibt", style="yellow")
        if spec.requires:
            flags = Text(f"{flags.plain} +{','.join(spec.requires)}".strip(), style="yellow")
        table.add_row(spec.name, _short_desc(spec.description), flags)
    return table


# --------------------------------------------------------------------------- #
# Root                                                                        #
# --------------------------------------------------------------------------- #


def _version_callback(value: bool) -> None:
    if value:
        console.print(f"yestools {__version__}")
        raise typer.Exit()


@app.callback(invoke_without_command=True)
def root(
    ctx: typer.Context,
    version: bool = typer.Option(
        False, "--version", "-V", callback=_version_callback, is_eager=True, help="Version anzeigen."
    ),
) -> None:
    """Ohne Unterbefehl: TUI starten (im Terminal) bzw. Hilfe anzeigen."""
    if ctx.invoked_subcommand is not None:
        return
    if sys.stdout.isatty():
        _launch_tui(None)
    else:
        _print_banner()
        console.print(ctx.get_help())


# --------------------------------------------------------------------------- #
# init                                                                        #
# --------------------------------------------------------------------------- #


@app.command()
def init(
    path: str = typer.Argument(".", help="Zielordner für den Projekt-Workspace."),
    name: Optional[str] = typer.Option(None, "--name", help="Projektname (Standard: Ordnername)."),
    with_agents: bool = typer.Option(
        True, "--agents/--no-agents", help="Agent-Konfigurationen (.mcp.json, AGENTS.md …) mitschreiben."
    ),
    force: bool = typer.Option(False, "--force", help="Vorhandene AGENTS.md/CLAUDE.md überschreiben."),
) -> None:
    """Legt einen Projekt-Workspace an (documents/, html/, assets/, output/)."""
    _print_banner()
    project = ProjectContext.init(path, name=name)
    console.print(f"[green]✓[/] Projekt [bold]{project.name}[/] in [dim]{project.root}[/]")
    for folder in project.meta.get("folders", []):
        console.print(f"  [dim]•[/] {folder}/")

    if with_agents:
        report = install_integrations(project, force=force)
        for item in report.written:
            console.print(f"  [green]✓[/] {item}")
        for item in report.skipped:
            console.print(f"  [yellow]•[/] übersprungen: {item}")

    console.print()
    console.print(
        Panel.fit(
            "[bold]Nächste Schritte[/]\n"
            "  1. Dateien nach [cyan]documents/[/] bzw. [cyan]html/[/] legen\n"
            "  2. [cyan]yestools[/] starten (TUI) oder\n"
            "     [cyan]yestools agent \"analysiere html/index.html\"[/]\n"
            "  3. Fremder Agent? [cyan]yestools mcp serve[/] ist in [dim].mcp.json[/] hinterlegt",
            border_style="dim",
        )
    )


# --------------------------------------------------------------------------- #
# agent                                                                       #
# --------------------------------------------------------------------------- #


@app.command()
def agent(
    prompt: list[str] = typer.Argument(..., help="Die Aufgabe in natürlicher Sprache."),
    project_path: Optional[str] = typer.Option(None, "--project", "-p", help="Projektordner."),
    model: Optional[str] = typer.Option(None, "--model", "-m", help="Modell (z. B. anthropic/claude-sonnet-4.5)."),
    base_url: Optional[str] = typer.Option(None, "--base-url", help="OpenAI-kompatibler Endpunkt."),
    max_steps: Optional[int] = typer.Option(None, "--max-steps", help="Maximale Tool-Runden."),
    yes: bool = typer.Option(False, "--yes", "-y", help="Schreibende Tools ohne Rückfrage zulassen."),
    as_json: bool = typer.Option(False, "--json", help="Ergebnis als JSON (für Skripte/Agenten)."),
    quiet: bool = typer.Option(False, "--quiet", "-q", help="Kein Banner, keine Zwischenschritte."),
) -> None:
    """Fragt die KI mit Tool-Zugriff auf das Projekt (Hauptbefehl)."""
    from .harness import Agent, AgentError, AgentEvent

    task = " ".join(prompt).strip()
    project = _project(project_path)
    settings = load_settings(project.root, model=model, base_url=base_url, max_steps=max_steps)

    if not as_json and not quiet:
        _print_banner()
        console.print(
            f"[dim]Projekt:[/] {project.name}  [dim]Modell:[/] {settings.model}  "
            f"[dim]Tools:[/] {len(all_tools())}\n"
        )

    def approve(spec: ToolSpec, args: dict[str, Any]) -> bool:
        if as_json:
            return False  # Im JSON-Modus gibt es keinen Menschen, der freigeben kann.
        console.print(
            Panel(
                JSON(json.dumps(args, ensure_ascii=False, indent=2)),
                title=f"[yellow]Schreibender Zugriff:[/] {spec.name}",
                border_style="yellow",
            )
        )
        return typer.confirm("Ausführen?", default=True)

    def on_event(event: AgentEvent) -> None:
        if as_json or quiet:
            return
        if event.kind == "tool_call":
            arg_preview = ", ".join(
                f"{k}={json.dumps(v, ensure_ascii=False)[:60]}" for k, v in event.args.items()
            )
            console.print(f"[cyan]⚙ {event.tool_name}[/][dim]({arg_preview})[/]")
        elif event.kind == "tool_result" and event.result:
            style = "green" if event.result.ok else "red"
            mark = "✓" if event.result.ok else "✗"
            console.print(f"  [{style}]{mark}[/] {event.result.summary}")
        elif event.kind == "assistant_text" and event.text:
            console.print(f"[dim]{event.text}[/]")
        elif event.kind == "denied":
            console.print(f"  [yellow]•[/] {event.tool_name} nicht freigegeben")

    ag = Agent(project=project, settings=settings, auto_approve=yes, approve=approve)
    try:
        run = ag.run(task, on_event=on_event)
    except AgentError as exc:
        if as_json:
            console.print_json(json.dumps({"ok": False, "error": str(exc)}))
        else:
            err_console.print(f"[red]✗[/] {exc}")
        raise typer.Exit(code=2)
    finally:
        ag.close()

    if as_json:
        console.print_json(
            json.dumps(
                {
                    "ok": run.stopped_reason == "completed",
                    "answer": run.final_text,
                    "steps": run.steps_used,
                    "tool_calls": run.tool_calls,
                    "artifacts": run.artifacts,
                    "stopped_reason": run.stopped_reason,
                },
                ensure_ascii=False,
            )
        )
        return

    console.print()
    console.print(Panel(run.final_text or "[dim](keine Antwort)[/]", border_style="cyan", title="Antwort"))
    if run.artifacts:
        console.print("[bold]Geschriebene Dateien:[/]")
        for artifact in run.artifacts:
            console.print(f"  [green]•[/] {artifact}")


# --------------------------------------------------------------------------- #
# run                                                                         #
# --------------------------------------------------------------------------- #


@app.command("run")
def run_tool(
    name: str = typer.Argument(..., help="Tool-Name (siehe `yestools tools list`)."),
    arg: list[str] = typer.Option([], "--arg", "-a", help="Argument als key=value (JSON-Werte erlaubt)."),
    args_file: Optional[str] = typer.Option(
        None, "--args-file", help="JSON-Datei mit Argumenten; '-' liest von stdin."
    ),
    project_path: Optional[str] = typer.Option(None, "--project", "-p", help="Projektordner."),
    as_json: bool = typer.Option(False, "--json", help="Ergebnis als JSON (für Agenten/Skripte)."),
    show: Optional[str] = typer.Option(
        None, "--show", help="Ein Feld aus data direkt ausgeben (z. B. html, text, unified_diff)."
    ),
) -> None:
    """Ruft ein Werkzeug direkt auf — der universelle Weg für jeden Agenten."""
    project = _project(project_path)
    try:
        spec = get_tool(name)
    except ToolError as exc:
        if as_json:
            console.print_json(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        else:
            err_console.print(f"[red]✗[/] {exc}")
        raise typer.Exit(code=1)

    result = call_tool(name, _parse_args(arg, args_file), project=project)

    if as_json:
        console.print_json(json.dumps(result.to_dict(), ensure_ascii=False))
    elif show:
        value = result.data.get(show)
        if value is None:
            err_console.print(f"[red]✗[/] Feld '{show}' nicht im Ergebnis von {name}.")
            raise typer.Exit(code=1)
        print(value if isinstance(value, str) else json.dumps(value, ensure_ascii=False, indent=2))
    else:
        style = "green" if result.ok else "red"
        console.print(f"[{style}]{'✓' if result.ok else '✗'}[/] {result.summary}")
        for artifact in result.artifacts:
            console.print(f"  [green]•[/] {artifact}")
        if result.ok and result.data and not result.artifacts:
            preview = {
                k: (v[:500] + "…" if isinstance(v, str) and len(v) > 500 else v)
                for k, v in result.data.items()
            }
            console.print(Panel(JSON(json.dumps(preview, ensure_ascii=False)), border_style="dim", title=spec.title))

    if not result.ok:
        raise typer.Exit(code=1)


# --------------------------------------------------------------------------- #
# tools                                                                       #
# --------------------------------------------------------------------------- #


@tools_app.command("list")
def tools_list(
    as_json: bool = typer.Option(False, "--json", help="Vollständiges Manifest mit JSON-Schemas."),
    category: Optional[str] = typer.Option(None, "--category", "-c", help="Nur eine Kategorie."),
) -> None:
    """Listet alle Werkzeuge (menschlich oder als Agent-Manifest)."""
    if as_json:
        data = manifest()
        if category:
            data["tools"] = [t for t in data["tools"] if t["category"] == category]
        console.print_json(json.dumps(data, ensure_ascii=False))
        return

    grouped = categories()
    if category:
        grouped = {k: v for k, v in grouped.items() if k == category}
        if not grouped:
            err_console.print(f"[red]✗[/] Unbekannte Kategorie '{category}'.")
            raise typer.Exit(code=1)

    for cat, specs in grouped.items():
        console.print(f"\n[bold magenta]{cat}[/] [dim]({len(specs)})[/]")
        console.print(_tool_table(specs))
    console.print(
        f"\n[dim]{sum(len(v) for v in grouped.values())} Werkzeuge. "
        "Schema: `yestools tools schema <name>` · Aufruf: `yestools run <name> --arg k=v`[/]"
    )


@tools_app.command("schema")
def tools_schema(
    name: str = typer.Argument(..., help="Tool-Name."),
    openai: bool = typer.Option(False, "--openai", help="Im OpenAI/OpenRouter-tools-Format ausgeben."),
) -> None:
    """Zeigt das JSON-Schema eines Werkzeugs."""
    try:
        spec = get_tool(name)
    except ToolError as exc:
        err_console.print(f"[red]✗[/] {exc}")
        raise typer.Exit(code=1)
    payload = spec.openai_tool() if openai else spec.manifest_entry()
    console.print(Syntax(json.dumps(payload, indent=2, ensure_ascii=False), "json", theme="ansi_dark"))


# --------------------------------------------------------------------------- #
# mcp                                                                         #
# --------------------------------------------------------------------------- #


@mcp_app.command("serve")
def mcp_serve(
    project_path: Optional[str] = typer.Option(None, "--project", "-p", help="Projektordner."),
    transport: str = typer.Option("stdio", "--transport", "-t", help="stdio | sse | streamable-http"),
) -> None:
    """Startet den MCP-Server (für Claude Code, Codex, opencode, OpenClaw …)."""
    from .mcp_server import serve

    # Wichtig: bei stdio darf NICHTS außer dem Protokoll auf stdout gehen —
    # jede Zusatzausgabe würde den JSON-RPC-Strom des Clients zerstören.
    project = _project(project_path)
    if transport == "stdio":
        err_console.print(
            f"[dim]YES Tools MCP-Server (stdio) · Projekt {project.name} · "
            f"{len(all_tools())} Tools[/]"
        )
    serve(project=project, transport=transport)


@mcp_app.command("install")
def mcp_install(
    project_path: Optional[str] = typer.Option(None, "--project", "-p", help="Projektordner."),
    client: list[str] = typer.Option(
        [],
        "--client",
        "-c",
        help="claude | codex | opencode | manifest | agents (Standard: alle).",
    ),
    force: bool = typer.Option(False, "--force", help="Vorhandene AGENTS.md/CLAUDE.md überschreiben."),
) -> None:
    """Schreibt die Agent-Konfigurationen in den Projektordner."""
    project = _project(project_path)
    clients = tuple(client) if client else ("claude", "codex", "opencode", "manifest", "agents")
    valid = {"claude", "codex", "opencode", "manifest", "agents"}
    unknown = sorted(set(clients) - valid)
    if unknown:
        err_console.print(f"[red]✗[/] Unbekannte Clients: {', '.join(unknown)}")
        raise typer.Exit(code=1)

    report = install_integrations(project, clients=clients, force=force)
    for item in report.written:
        console.print(f"[green]✓[/] {item}")
    for item in report.skipped:
        console.print(f"[yellow]•[/] übersprungen: {item}")
    for note in report.notes:
        console.print(f"[dim]ℹ {note}[/]")


# --------------------------------------------------------------------------- #
# index / doctor / tui                                                        #
# --------------------------------------------------------------------------- #


@app.command("index")
def index_cmd(
    project_path: Optional[str] = typer.Option(None, "--project", "-p", help="Projektordner."),
    kind: Optional[str] = typer.Option(None, "--kind", "-k", help="Nach Typ filtern (word/html/image/…)."),
    as_json: bool = typer.Option(False, "--json", help="Als JSON ausgeben."),
) -> None:
    """Listet die Dateien im Projekt-Workspace."""
    project = _project(project_path)
    result = call_tool("project_index", {"kind": kind} if kind else {}, project=project)
    if as_json:
        console.print_json(json.dumps(result.to_dict(), ensure_ascii=False))
        return

    files = result.data.get("files", [])
    table = Table(box=None, header_style="bold")
    table.add_column("Datei", style="cyan")
    table.add_column("Typ", style="magenta")
    table.add_column("Größe", justify="right")
    for entry in files:
        table.add_row(entry["path"], entry["kind"], f"{entry['bytes'] / 1024:.1f} KB")
    console.print(f"[bold]{project.name}[/] [dim]{project.root}[/]")
    console.print(table if files else "[dim](keine Dateien)[/]")


@app.command()
def doctor(
    project_path: Optional[str] = typer.Option(None, "--project", "-p", help="Projektordner."),
) -> None:
    """Prüft Umgebung: Extras, API-Key, Projekt, erkannte Agent-CLIs."""
    _print_banner()
    project = _project(project_path)
    settings = load_settings(project.root)

    table = Table(box=None, header_style="bold", show_header=False)
    table.add_column("", no_wrap=True)
    table.add_column("")
    table.add_column("", style="dim")

    def row(ok: bool, label: str, detail: str = "") -> None:
        table.add_row("[green]✓[/]" if ok else "[yellow]•[/]", label, detail)

    row(True, "Version", f"yestools {__version__} · Python {sys.version.split()[0]}")
    row(
        project.initialized,
        "Projekt",
        f"{project.name} · {project.root}" + ("" if project.initialized else " (kein .yes/ — `yestools init`)"),
    )
    row(
        settings.has_api_key,
        "API-Key",
        f"gefunden via {settings.api_key_source}" if settings.has_api_key else "fehlt (OPENROUTER_API_KEY setzen)",
    )
    row(True, "Modell", f"{settings.model} @ {settings.base_url}")

    for extra, module, purpose in (
        ("tui", "textual", "TUI"),
        ("mcp", "mcp", "MCP-Server"),
        ("docs", "mammoth", "Word → HTML"),
        ("docs", "PIL", "Bildkonvertierung"),
        ("docs", "pyphen", "Silbentrennung"),
    ):
        try:
            __import__(module)
            row(True, f"Extra '{extra}'", f"{module} · {purpose}")
        except ImportError:
            row(False, f"Extra '{extra}'", f"{module} fehlt → {purpose} nicht verfügbar")

    row(True, "Werkzeuge", f"{len(all_tools())} registriert")

    console.print(table)
    console.print("\n[bold]Erkannte Agent-CLIs[/]")
    found = {k: v for k, v in detect_agents().items() if v}
    if found:
        for label, path in found.items():
            console.print(f"  [green]✓[/] {label} [dim]{path}[/]")
        console.print("\n[dim]→ `yestools mcp install` hinterlegt den MCP-Server für sie im Projekt.[/]")
    else:
        console.print("  [dim](keine gefunden — die CLI funktioniert auch ohne, per `yestools agent`)[/]")


def _launch_tui(project_path: str | None) -> None:
    try:
        from .tui import run_tui
    except ImportError as exc:
        _print_banner()
        err_console.print(
            "[yellow]•[/] Die TUI braucht das Extra 'tui': "
            "[cyan]pip install \"yestools[tui]\"[/]\n"
            f"[dim]{exc}[/]\n\n"
            "Bis dahin: [cyan]yestools agent \"…\"[/] oder [cyan]yestools tools list[/]"
        )
        raise typer.Exit(code=1)
    run_tui(_project(project_path))


@app.command()
def tui(
    project_path: Optional[str] = typer.Option(None, "--project", "-p", help="Projektordner."),
) -> None:
    """Startet die Terminal-Oberfläche (Agent-Chat, Werkzeuge, Dateien)."""
    _launch_tui(project_path)


def main() -> None:
    """Entry-Point für das Konsolen-Skript."""
    app()


if __name__ == "__main__":  # pragma: no cover
    main()
