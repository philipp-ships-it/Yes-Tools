"""Tests für den MCP-Server und die TUI.

Der MCP-Server wird gegen die echte SDK-API gebaut und über die
`list_tools`/`call_tool`-Schnittstelle geprüft — also so, wie ein Client
(Claude Code, Codex, opencode) ihn sieht. Die TUI wird mit Textuals
`run_test()` headless gestartet.
"""

from __future__ import annotations

import json

import pytest


class TestMcpServer:
    @pytest.fixture()
    def server(self, project):
        pytest.importorskip("mcp")
        from yestools.mcp_server import build_server

        return build_server(project)

    async def test_alle_registry_tools_werden_exponiert(self, server, project):
        from yestools.registry import all_tools

        exposed = await server.list_tools()

        assert {tool.name for tool in exposed} == {spec.name for spec in all_tools()}

    async def test_schema_wird_aus_der_registry_abgeleitet(self, server):
        exposed = {tool.name: tool for tool in await server.list_tools()}

        # mcp 2.x: snake_case Feldnamen im Tool-Modell
        schema = exposed["word_extract_text"].input_schema
        assert "path" in schema["properties"]
        assert schema["required"] == ["path"]

    async def test_schreibende_tools_tragen_einen_hinweis(self, server):
        exposed = {tool.name: tool for tool in await server.list_tools()}

        assert "SCHREIBT" in (exposed["project_write_file"].description or "")
        # Bedingt schreibende Tools werden differenziert beschrieben.
        assert "out_path" in (exposed["html_beautify"].description or "")

    async def test_tool_aufruf_liefert_ergebnis_des_registry_tools(self, server, project):
        result = await server.call_tool("html_analyze", {"path": "html/seite.html"})

        payload = _structured(result)
        assert payload["ok"] is True
        assert payload["data"]["images"] == 2

    async def test_tool_aufruf_mit_fehler_wird_als_ergebnis_gemeldet(self, server):
        result = await server.call_tool("html_analyze", {"path": "gibtsnicht.html"})

        payload = _structured(result)
        assert payload["ok"] is False
        assert "existiert nicht" in payload["error"]

    async def test_path_jail_gilt_auch_ueber_mcp(self, server):
        result = await server.call_tool("project_read_file", {"path": "../../etc/passwd"})

        payload = _structured(result)
        assert payload["ok"] is False
        assert "außerhalb" in payload["error"]

    async def test_projektindex_als_resource(self, server, project):
        resources = await server.list_resources()

        assert any(str(res.uri) == "yes://project/index" for res in resources)

    def test_unbekannter_transport_wird_abgewiesen(self, project):
        pytest.importorskip("mcp")
        from yestools.mcp_server import serve

        with pytest.raises(SystemExit, match="Unbekannter Transport"):
            serve(project=project, transport="telepathie")


def _structured(result) -> dict:
    """Holt das JSON-Ergebnis aus einer MCP-Tool-Antwort.

    Je nach SDK-Version steckt es in `structuredContent` oder als Text im
    ersten Content-Block — beides wird unterstützt, damit der Test nicht an
    einem Detail der Serialisierung hängt.
    """
    structured = getattr(result, "structuredContent", None)
    if isinstance(structured, dict):
        return structured.get("result", structured)
    content = getattr(result, "content", result)
    if isinstance(content, (list, tuple)) and content:
        text = getattr(content[0], "text", None)
        if text:
            return json.loads(text)
    if isinstance(result, (list, tuple)) and result:
        text = getattr(result[0], "text", None)
        if text:
            return json.loads(text)
    raise AssertionError(f"Unerwartete MCP-Antwortform: {result!r}")


class TestTui:
    @pytest.fixture(autouse=True)
    def _needs_textual(self):
        pytest.importorskip("textual")

    async def test_startet_und_zeigt_projekt_und_werkzeuge(self, project):
        from textual.widgets import ListView, RichLog

        from yestools.tui import YesToolsApp

        app = YesToolsApp(project=project)
        async with app.run_test() as pilot:
            await pilot.pause()

            assert app.query_one("#toollist", ListView) is not None
            log = app.query_one("#chatlog", RichLog)
            assert log.lines  # Begrüßung wurde geschrieben
            assert project.name in app._status_text()

    async def test_schreibmodus_ist_standardmaessig_aus_und_umschaltbar(self, project):
        from yestools.tui import YesToolsApp

        app = YesToolsApp(project=project)
        async with app.run_test() as pilot:
            assert app.allow_writes is False

            await pilot.press("f2")
            await pilot.pause()

            assert app.allow_writes is True
            assert "Schreiben erlaubt" in app._status_text()

    async def test_ohne_api_key_wird_keine_anfrage_gesendet(self, project, monkeypatch):
        from textual.widgets import Input

        from yestools.tui import YesToolsApp

        for var in ("YESTOOLS_API_KEY", "OPENROUTER_API_KEY", "VITE_OPENROUTER_API_KEY"):
            monkeypatch.delenv(var, raising=False)

        app = YesToolsApp(project=project)
        async with app.run_test() as pilot:
            app.query_one("#prompt", Input).value = "hallo"
            await pilot.press("enter")
            await pilot.pause()

            assert app.busy is False  # kein Worker gestartet

    async def test_dateibaum_zeigt_projektdateien(self, project):
        from textual.widgets import Tree

        from yestools.tui import YesToolsApp

        app = YesToolsApp(project=project)
        async with app.run_test() as pilot:
            await pilot.pause()

            tree = app.query_one("#filetree", Tree)
            labels = [str(node.label) for node in tree.root.children]
            assert any("html" in label for label in labels)

    async def test_seitenleiste_laesst_sich_ausblenden(self, project):
        from yestools.tui import YesToolsApp

        app = YesToolsApp(project=project)
        async with app.run_test() as pilot:
            await pilot.press("ctrl+t")
            await pilot.pause()

            assert app.query_one("#sidebar").has_class("hidden")
