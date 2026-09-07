"""Integrationstest: echter MCP-Handshake über stdio.

Startet `yestools mcp serve` als Subprozess und verbindet sich mit dem
offiziellen MCP-Client — also exakt der Weg, den Claude Code, Codex CLI,
opencode oder OpenClaw gehen. Damit ist nicht nur die Server-Konstruktion
getestet, sondern das Protokoll über Prozessgrenzen hinweg.
"""

from __future__ import annotations

import json
import sys

import pytest

pytest.importorskip("mcp")

from mcp import ClientSession, StdioServerParameters  # noqa: E402
from mcp.client.stdio import stdio_client  # noqa: E402


async def test_echter_stdio_handshake_und_tool_aufruf(project):
    params = StdioServerParameters(
        command=sys.executable,
        args=["-m", "yestools", "mcp", "serve"],
        env={"YESTOOLS_PROJECT": str(project.root), "PATH": "/usr/bin:/bin"},
    )

    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            init = await session.initialize()
            # mcp 2.x nutzt snake_case im Ergebnis-Modell
            assert init.server_info.name == "yes-tools"

            listing = await session.list_tools()
            names = {tool.name for tool in listing.tools}
            assert "html_analyze" in names
            assert "word_extract_text" in names

            result = await session.call_tool("html_analyze", {"path": "html/seite.html"})
            payload = _payload(result)
            assert payload["ok"] is True
            assert payload["data"]["images"] == 2

            # Das Path-Jail muss auch über das Protokoll greifen.
            denied = await session.call_tool("project_read_file", {"path": "../../etc/passwd"})
            assert _payload(denied)["ok"] is False


def _payload(result) -> dict:
    structured = getattr(result, "structuredContent", None)
    if isinstance(structured, dict):
        return structured.get("result", structured)
    for block in getattr(result, "content", []) or []:
        text = getattr(block, "text", None)
        if text:
            return json.loads(text)
    raise AssertionError(f"Keine verwertbare Antwort: {result!r}")
