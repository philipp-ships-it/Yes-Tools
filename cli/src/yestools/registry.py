"""Zentrale Tool-Registry.

Eine Registry, drei Konsumenten — das ist der Kern der Architektur:

1. **Mensch**: CLI (`yestools run …`) und TUI
2. **Eigener Agent-Harness**: `spec.openai_tool()` → `tools=[…]` im LLM-Request
3. **Fremde Agenten**: MCP-Server (`yestools mcp serve`) und, für Agenten ohne
   MCP, das JSON-Manifest (`.yes/tools.json` + `yestools run <tool> --json`)

Dadurch kann kein Konsument "andere" Tools sehen als ein anderer: Beschreibung,
Schema und Ausführung stammen immer aus derselben `ToolSpec`.
"""

from __future__ import annotations

from typing import Any, Callable, Iterable

from .project import ProjectContext
from .schemas import Param, ToolError, ToolResult, ToolSpec, validate_args

_REGISTRY: dict[str, ToolSpec] = {}


def tool(
    name: str,
    *,
    title: str,
    description: str,
    category: str,
    params: Iterable[Param] = (),
    writes: bool = False,
    writes_when: str | None = None,
    requires: Iterable[str] = (),
) -> Callable[[Callable[..., ToolResult]], Callable[..., ToolResult]]:
    """Dekorator zum Registrieren eines Tools.

    Der Handler bekommt die validierten Argumente als Keyword-Arguments und
    zusätzlich `project: ProjectContext` als erstes Positionsargument.
    """

    def decorator(fn: Callable[..., ToolResult]) -> Callable[..., ToolResult]:
        if name in _REGISTRY:
            raise RuntimeError(f"Tool '{name}' ist bereits registriert.")
        _REGISTRY[name] = ToolSpec(
            name=name,
            title=title,
            description=description,
            category=category,
            params=list(params),
            handler=fn,
            writes=writes,
            writes_when=writes_when,
            requires=list(requires),
        )
        return fn

    return decorator


def _ensure_tools_imported() -> None:
    """Importiert die Tool-Module beim ersten Zugriff (vermeidet Zyklen)."""
    if _REGISTRY:
        return
    from . import tools as _tools  # noqa: F401  (Import registriert die Tools)


def all_tools() -> list[ToolSpec]:
    """Alle Tools, alphabetisch nach Kategorie und Name."""
    _ensure_tools_imported()
    return sorted(_REGISTRY.values(), key=lambda s: (s.category, s.name))


def get_tool(name: str) -> ToolSpec:
    _ensure_tools_imported()
    try:
        return _REGISTRY[name]
    except KeyError:
        raise ToolError(
            f"Unbekanntes Tool '{name}'. Verfügbar: "
            f"{', '.join(sorted(_REGISTRY))}"
        ) from None


def categories() -> dict[str, list[ToolSpec]]:
    grouped: dict[str, list[ToolSpec]] = {}
    for spec in all_tools():
        grouped.setdefault(spec.category, []).append(spec)
    return grouped


def openai_tools() -> list[dict[str, Any]]:
    """Alle Tool-Schemas im OpenAI/OpenRouter-Format für den Agent-Harness."""
    return [spec.openai_tool() for spec in all_tools()]


def manifest() -> dict[str, Any]:
    """Maschinenlesbares Manifest für beliebige Agenten (ohne MCP)."""
    return {
        "$schema": "https://yes-tools.local/schemas/tool-manifest-v1.json",
        "version": 1,
        "product": "YES Tools CLI",
        "usage": {
            "list": "yestools tools list --json",
            "call": "yestools run <tool> --json --arg key=value",
            "call_stdin": "echo '{\"key\": \"value\"}' | yestools run <tool> --json --args-file -",
            "mcp": "yestools mcp serve  (stdio; für Claude Code, Codex, opencode, OpenClaw, Cursor …)",
        },
        "tools": [spec.manifest_entry() for spec in all_tools()],
    }


def call_tool(
    name: str,
    args: dict[str, Any] | None = None,
    project: ProjectContext | None = None,
) -> ToolResult:
    """Führt ein Tool aus: Schema-Validierung, Ausführung, Fehler-Kapselung.

    Fehler werden absichtlich als `ToolResult(ok=False)` zurückgegeben statt zu
    propagieren: Ein Agent im Loop soll aus einem Tool-Fehler lernen und es
    korrigiert erneut versuchen können, statt den ganzen Lauf abzubrechen.
    """
    spec = get_tool(name)
    project = project or ProjectContext.discover()
    try:
        validated = validate_args(spec, args or {})
        assert spec.handler is not None
        return spec.handler(project, **validated)
    except ToolError as exc:
        return ToolResult.failure(str(exc))
    except Exception as exc:  # pragma: no cover - Sicherheitsnetz
        return ToolResult.failure(f"{type(exc).__name__}: {exc}")
