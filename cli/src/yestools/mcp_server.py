"""MCP-Server: stellt die Registry als Model-Context-Protocol-Tools bereit.

Damit kann jeder MCP-fähige Agent (Claude Code, Codex CLI, opencode, OpenClaw,
Cursor, Windsurf, Zed …) die YES-Tools nativ als Tool-Calls nutzen — ohne dass
hier Agent-spezifischer Code nötig wäre. Genau das ist der Sinn von MCP.

Implementiert gegen das Python-SDK **v2** (`mcp>=2`), wo die frühere
`FastMCP`-Klasse zu `MCPServer` umbenannt wurde. Für v1 wäre der Import
`from mcp.server.fastmcp import FastMCP` — bewusst nicht unterstützt, um keine
zwei Codepfade zu pflegen; die Fehlermeldung unten sagt das klar.
"""

from __future__ import annotations

import json
from typing import Any

from .project import ProjectContext
from .registry import all_tools, call_tool
from .schemas import ToolSpec

INSTALL_HINT = (
    "Der MCP-Server braucht das Extra 'mcp': pip install \"yestools[mcp]\"\n"
    "(benötigt mcp>=2.0 — in mcp 2.x heißt die Server-Klasse MCPServer.)"
)


def _load_mcp():
    try:
        from mcp.server import MCPServer  # type: ignore

        return MCPServer
    except ImportError as exc:  # pragma: no cover - abhängig von der Installation
        raise SystemExit(f"{INSTALL_HINT}\n\nUrsprünglicher Fehler: {exc}") from exc


def _description(spec: ToolSpec) -> str:
    """Tool-Beschreibung für MCP-Clients, inkl. Warnung bei Schreibzugriff."""
    if not spec.writes:
        note = ""
    elif spec.writes_when:
        note = (
            f"\n\nHinweis: Dieses Tool schreibt eine Datei, sobald "
            f"'{spec.writes_when}' gesetzt ist — ohne diesen Parameter gibt es "
            "das Ergebnis nur zurück. Zielpfade nur nach Auftrag des Nutzers setzen."
        )
    else:
        note = (
            "\n\nHinweis: Dieses Tool SCHREIBT Dateien im Projektordner. "
            "Nur nach ausdrücklichem Auftrag des Nutzers verwenden."
        )
    return f"{spec.description}{note}"


def build_server(project: ProjectContext | None = None) -> Any:
    """Baut den MCP-Server mit allen Tools aus der Registry."""
    MCPServer = _load_mcp()
    ctx = project or ProjectContext.discover()

    server = MCPServer(
        name="yes-tools",
        title="YES Tools",
        version="0.1.0",
        instructions=(
            f"Werkzeuge für Dokument-, HTML- und Bild-Workflows im Projekt "
            f"'{ctx.name}' ({ctx.root}). Alle Pfadangaben sind projekt-relativ; "
            "Zugriffe außerhalb des Projektordners werden abgewiesen. "
            "Wenn du die Dateien nicht kennst, rufe zuerst 'project_index' auf."
        ),
    )

    for spec in all_tools():
        server.add_tool(
            _make_callable(spec, ctx),
            name=spec.name,
            title=spec.title,
            description=_description(spec),
        )

    # Der Projektindex als MCP-Resource: Clients können ihn als Kontext
    # einlesen, ohne einen Tool-Call zu verbrauchen.
    @server.resource("yes://project/index", name="Projektindex", mime_type="application/json")
    def project_index_resource() -> str:
        return json.dumps(
            {"project": ctx.name, "root": str(ctx.root), "files": ctx.index()},
            indent=2,
            ensure_ascii=False,
        )

    return server


def _make_callable(spec: ToolSpec, ctx: ProjectContext):
    """Erzeugt eine Funktion mit passender Signatur für die MCP-Registrierung.

    MCP leitet das Eingabe-Schema aus der Signatur ab. Da unsere Parameter erst
    zur Laufzeit bekannt sind, wird die Funktion dynamisch erzeugt und mit
    `__annotations__`/`__signature__` versehen — so sieht der Client exakt
    dasselbe Schema wie CLI und eigener Harness.
    """
    import inspect

    py_types: dict[str, Any] = {
        "string": str,
        "number": float,
        "integer": int,
        "boolean": bool,
        "array": list,
        "object": dict,
    }

    def handler(**kwargs: Any) -> dict[str, Any]:
        cleaned = {k: v for k, v in kwargs.items() if v is not None}
        return call_tool(spec.name, cleaned, project=ctx).to_dict()

    parameters = []
    annotations: dict[str, Any] = {}
    for param in spec.params:
        py_type = py_types[param.type]
        if param.required:
            default = inspect.Parameter.empty
            annotation = py_type
        else:
            default = param.default
            annotation = py_type | None  # type: ignore[operator]
        parameters.append(
            inspect.Parameter(
                param.name,
                inspect.Parameter.KEYWORD_ONLY,
                default=default,
                annotation=annotation,
            )
        )
        annotations[param.name] = annotation

    annotations["return"] = dict
    handler.__signature__ = inspect.Signature(parameters, return_annotation=dict)  # type: ignore[attr-defined]
    handler.__annotations__ = annotations
    handler.__name__ = spec.name
    handler.__doc__ = _description(spec)
    return handler


def serve(
    project: ProjectContext | None = None,
    transport: str = "stdio",
    **kwargs: Any,
) -> None:
    """Startet den MCP-Server (stdio für lokale Agenten, http für Remote)."""
    server = build_server(project)
    if transport not in ("stdio", "sse", "streamable-http"):
        raise SystemExit(
            f"Unbekannter Transport '{transport}'. Erlaubt: stdio, sse, streamable-http."
        )
    server.run(transport=transport, **kwargs)  # type: ignore[arg-type]
