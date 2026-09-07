"""YES Tools — CLI, TUI, MCP-Server und Agent-Harness.

Auch als Bibliothek nutzbar (SDK-Fläche):

    from yestools import ProjectContext, call_tool, all_tools

    project = ProjectContext.discover("~/mein-projekt")
    result = call_tool("html_analyze", {"path": "html/index.html"}, project=project)
    print(result.summary, result.data["findings"])

Eigener Agent-Loop mit denselben Werkzeugen:

    from yestools import Agent
    run = Agent(project=project, auto_approve=False).run("Was ist in documents/?")
    print(run.final_text)
"""

from __future__ import annotations

__version__ = "0.1.0"

from .project import ProjectContext  # noqa: E402
from .registry import (  # noqa: E402
    all_tools,
    call_tool,
    categories,
    get_tool,
    manifest,
    openai_tools,
)
from .schemas import Param, ToolError, ToolResult, ToolSpec  # noqa: E402


def __getattr__(name: str):
    """Lazy-Import für Teile mit optionalen Abhängigkeiten.

    So bleibt `import yestools` billig und schlägt nicht fehl, wenn httpx
    (Harness) oder textual (TUI) nicht installiert sind.
    """
    if name in ("Agent", "AgentEvent", "AgentRun", "AgentError", "build_system_prompt"):
        from . import harness

        return getattr(harness, name)
    if name in ("run_tui", "YesToolsApp"):
        from . import tui

        return getattr(tui, name)
    if name in ("build_server", "serve"):
        from . import mcp_server

        return getattr(mcp_server, name)
    raise AttributeError(f"module 'yestools' has no attribute '{name}'")


__all__ = [
    "__version__",
    "ProjectContext",
    "Param",
    "ToolError",
    "ToolResult",
    "ToolSpec",
    "all_tools",
    "call_tool",
    "categories",
    "get_tool",
    "manifest",
    "openai_tools",
    # lazy
    "Agent",
    "AgentEvent",
    "AgentRun",
    "AgentError",
    "build_system_prompt",
    "build_server",
    "serve",
    "run_tui",
]
