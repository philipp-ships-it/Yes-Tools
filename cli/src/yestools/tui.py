"""Terminal-Oberfläche (Textual).

Layout — bewusst agent-first: der Chat mit der KI nimmt den Hauptbereich ein,
Werkzeuge und Projektdateien liegen als Referenz in der Seitenleiste.

    ┌──────────────────────────────────────────────────────────────┐
    │  YES TOOLS (ASCII)          Projekt · Modell · Schreibmodus  │
    ├───────────────┬──────────────────────────────────────────────┤
    │ Werkzeuge     │  Agent-Chat (Nachrichten + Tool-Aufrufe)     │
    │ Dateien       │                                              │
    │               ├──────────────────────────────────────────────┤
    │               │  > Eingabe                                   │
    ├───────────────┴──────────────────────────────────────────────┤
    │  Tastenkürzel                                                │
    └──────────────────────────────────────────────────────────────┘

Der Agent-Lauf passiert in einem Worker-Thread; Ereignisse werden über
`call_from_thread` in den Chat gerendert, damit die Oberfläche während eines
Tool-Aufrufs bedienbar bleibt.
"""

from __future__ import annotations

import json
from typing import Any

from textual import on, work
from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical
from textual.widgets import Footer, Input, Label, ListItem, ListView, RichLog, Static, TabbedContent, TabPane, Tree

from .banner import BANNER_COMPACT
from .config import load_settings
from .harness import Agent, AgentError, AgentEvent
from .project import ProjectContext
from .registry import all_tools, categories, get_tool


class YesToolsApp(App[None]):
    """Die TUI-Anwendung."""

    TITLE = "YES Tools"
    SUB_TITLE = "Dokument-, HTML- & Bild-Werkzeuge mit KI-Agent"

    CSS = """
    Screen { layers: base; }

    #banner {
        height: auto;
        padding: 0 1;
        color: $primary;
        content-align: left middle;
    }
    #status { height: 1; padding: 0 1; color: $text-muted; }

    #sidebar { width: 36; border-right: solid $panel; }
    #sidebar.hidden { display: none; }

    #chat { padding: 0 1; }
    #chatlog { height: 1fr; border: round $panel; padding: 0 1; }
    #prompt { border: round $accent; }

    .tool-writes { color: $warning; }
    """

    BINDINGS = [
        ("ctrl+q", "quit", "Beenden"),
        ("ctrl+l", "clear_log", "Chat leeren"),
        ("ctrl+t", "toggle_sidebar", "Seitenleiste"),
        # F2 statt Strg+W: Strg+W ist im Eingabefeld "Wort löschen" (Textual-Input)
        ("f2", "toggle_write", "Schreibmodus"),
        ("f5", "refresh_files", "Dateien neu laden"),
    ]

    def __init__(self, project: ProjectContext | None = None) -> None:
        super().__init__()
        self.project = project or ProjectContext.discover()
        self.settings = load_settings(self.project.root)
        self.allow_writes = False
        self.busy = False
        self._agent: Agent | None = None

    # ------------------------------------------------------------------ #
    # Aufbau                                                             #
    # ------------------------------------------------------------------ #

    def compose(self) -> ComposeResult:
        yield Static(BANNER_COMPACT, id="banner")
        yield Static(self._status_text(), id="status")
        with Horizontal():
            with Vertical(id="sidebar"):
                with TabbedContent(initial="tab-tools"):
                    with TabPane("Werkzeuge", id="tab-tools"):
                        yield ListView(*self._tool_items(), id="toollist")
                    with TabPane("Dateien", id="tab-files"):
                        yield Tree("Projekt", id="filetree")
            with Vertical(id="chat"):
                yield RichLog(id="chatlog", markup=True, wrap=True, highlight=False)
                yield Input(
                    placeholder="Aufgabe eingeben … (z. B. „analysiere html/index.html“)",
                    id="prompt",
                )
        yield Footer()

    def on_mount(self) -> None:
        log = self.query_one("#chatlog", RichLog)
        log.write(f"[bold cyan]YES Tools[/] · Projekt [bold]{self.project.name}[/]")
        log.write(f"[dim]{self.project.root}[/]")
        log.write("")
        if not self.settings.has_api_key:
            log.write(
                "[yellow]Kein API-Key gefunden.[/] Setze [bold]OPENROUTER_API_KEY[/] "
                "und starte neu — die Werkzeuge in der Seitenleiste funktionieren "
                "auch ohne Key über die CLI."
            )
        else:
            log.write(
                f"[dim]Modell {self.settings.model} · {len(all_tools())} Werkzeuge · "
                "Schreibmodus mit F2 umschalten[/]"
            )
        log.write("")
        self._reload_files()
        self.query_one("#prompt", Input).focus()

    # ------------------------------------------------------------------ #
    # Seitenleiste                                                       #
    # ------------------------------------------------------------------ #

    def _tool_items(self) -> list[ListItem]:
        items: list[ListItem] = []
        for category, specs in categories().items():
            items.append(ListItem(Label(f"[bold magenta]{category}[/]"), disabled=True))
            for spec in specs:
                mark = " [yellow]✎[/]" if spec.writes and not spec.writes_when else (" [dim]✎[/]" if spec.writes else "")
                items.append(ListItem(Label(f"  {spec.name}{mark}"), name=spec.name))
        return items

    def _reload_files(self) -> None:
        tree = self.query_one("#filetree", Tree)
        tree.clear()
        tree.root.label = f"{self.project.name} ({self.project.root.name})"
        tree.root.expand()

        folders: dict[str, Any] = {}
        for entry in self.project.index(limit=400):
            parts = entry["path"].split("/")
            node = tree.root
            for part in parts[:-1]:
                key = "/".join([*(p for p in parts[: parts.index(part) + 1])])
                if key not in folders:
                    folders[key] = node.add(part, expand=True)
                node = folders[key]
            node.add_leaf(f"{parts[-1]}  [dim]{entry['kind']}, {entry['bytes'] / 1024:.1f} KB[/]")

    @on(ListView.Selected, "#toollist")
    def show_tool(self, event: ListView.Selected) -> None:
        """Zeigt Schema und Beispielaufruf des gewählten Werkzeugs im Chat."""
        name = event.item.name
        if not name:
            return
        spec = get_tool(name)
        log = self.query_one("#chatlog", RichLog)
        log.write(f"[bold cyan]{spec.name}[/] — {spec.title}{' [yellow](schreibend)[/]' if spec.writes else ''}")
        log.write(f"[dim]{spec.description}[/]")
        for param in spec.params:
            req = "[red]*[/]" if param.required else " "
            log.write(f"  {req} [bold]{param.name}[/] [dim]{param.type}[/] — {param.description}")
        example = " ".join(
            f"--arg {p.name}=…" for p in spec.params if p.required
        ) or "(keine Pflichtparameter)"
        log.write(f"  [dim]CLI: yestools run {spec.name} {example}[/]")
        log.write("")

    # ------------------------------------------------------------------ #
    # Aktionen                                                           #
    # ------------------------------------------------------------------ #

    def _status_text(self) -> str:
        write_state = (
            "[green]Schreiben erlaubt[/]" if self.allow_writes else "[yellow]nur lesen[/]"
        )
        key_state = "Key ✓" if self.settings.has_api_key else "[red]Key fehlt[/]"
        return (
            f"Projekt [bold]{self.project.name}[/] · Modell [bold]{self.settings.model}[/] · "
            f"{key_state} · {write_state}"
        )

    def _refresh_status(self) -> None:
        self.query_one("#status", Static).update(self._status_text())

    def action_clear_log(self) -> None:
        self.query_one("#chatlog", RichLog).clear()

    def action_toggle_sidebar(self) -> None:
        self.query_one("#sidebar").toggle_class("hidden")

    def action_toggle_write(self) -> None:
        self.allow_writes = not self.allow_writes
        self._refresh_status()
        self.query_one("#chatlog", RichLog).write(
            f"[dim]Schreibmodus: {'an — Tools dürfen Dateien ändern' if self.allow_writes else 'aus — schreibende Tools werden abgelehnt'}[/]"
        )

    def action_refresh_files(self) -> None:
        self._reload_files()
        self.notify("Dateien neu geladen.")

    # ------------------------------------------------------------------ #
    # Agent                                                              #
    # ------------------------------------------------------------------ #

    @on(Input.Submitted, "#prompt")
    def submit_prompt(self, event: Input.Submitted) -> None:
        task = event.value.strip()
        if not task:
            return
        if self.busy:
            self.notify("Der Agent arbeitet noch …", severity="warning")
            return

        log = self.query_one("#chatlog", RichLog)
        log.write(f"[bold]› {task}[/]")
        event.input.value = ""

        if not self.settings.has_api_key:
            log.write("[red]Kein API-Key — Agent nicht verfügbar.[/]\n")
            return

        self.busy = True
        self._run_agent(task)

    @work(thread=True, exclusive=True)
    def _run_agent(self, task: str) -> None:
        """Führt den Agent-Loop im Hintergrund-Thread aus."""
        if self._agent is None:
            self._agent = Agent(project=self.project, settings=self.settings)
        self._agent.auto_approve = self.allow_writes

        def on_event(event: AgentEvent) -> None:
            self.call_from_thread(self._render_event, event)

        try:
            run = self._agent.run(task, on_event=on_event)
            self.call_from_thread(self._finish, run.final_text, run.artifacts)
        except AgentError as exc:
            self.call_from_thread(self._fail, str(exc))

    def _render_event(self, event: AgentEvent) -> None:
        log = self.query_one("#chatlog", RichLog)
        if event.kind == "tool_call":
            args = ", ".join(
                f"{k}={json.dumps(v, ensure_ascii=False)[:48]}" for k, v in event.args.items()
            )
            log.write(f"  [cyan]⚙ {event.tool_name}[/][dim]({args})[/]")
        elif event.kind == "tool_result" and event.result:
            mark = "[green]✓[/]" if event.result.ok else "[red]✗[/]"
            log.write(f"    {mark} [dim]{event.result.summary}[/]")
        elif event.kind == "denied":
            log.write(
                f"    [yellow]•[/] [dim]{event.tool_name} abgelehnt "
                "(Schreibmodus aus — F2)[/]"
            )
        elif event.kind == "assistant_text" and event.text:
            log.write(f"  [dim]{event.text}[/]")

    def _finish(self, answer: str, artifacts: list[str]) -> None:
        log = self.query_one("#chatlog", RichLog)
        log.write("")
        log.write(answer or "[dim](keine Antwort)[/]")
        if artifacts:
            log.write("[bold]Geschrieben:[/]")
            for artifact in artifacts:
                log.write(f"  [green]•[/] {artifact}")
            self._reload_files()
        log.write("")
        self.busy = False

    def _fail(self, message: str) -> None:
        self.query_one("#chatlog", RichLog).write(f"[red]✗ {message}[/]\n")
        self.busy = False


def run_tui(project: ProjectContext | None = None) -> None:
    """Startet die TUI (Einstiegspunkt für `yestools tui`)."""
    YesToolsApp(project=project).run()
