"""Tests für die Kommandozeile (Typer CliRunner).

Wichtig für die Agenten-Nutzung: `--json` muss *maschinenlesbares* JSON auf
stdout liefern und der Exit-Code muss Erfolg/Fehler korrekt unterscheiden.
"""

from __future__ import annotations

import json

import pytest
from typer.testing import CliRunner

from yestools.cli import app

runner = CliRunner()


def _json_out(result) -> dict:
    """Parst die JSON-Ausgabe eines --json-Aufrufs."""
    return json.loads(result.stdout)


class TestTools:
    def test_tools_list_zeigt_kategorien(self):
        result = runner.invoke(app, ["tools", "list"])

        assert result.exit_code == 0
        assert "html_analyze" in result.stdout
        assert "project" in result.stdout

    def test_tools_list_json_ist_valides_manifest(self):
        result = runner.invoke(app, ["tools", "list", "--json"])

        payload = _json_out(result)
        assert payload["version"] == 1
        assert len(payload["tools"]) >= 15
        assert all("parameters" in tool for tool in payload["tools"])

    def test_tools_list_filtert_kategorie(self):
        result = runner.invoke(app, ["tools", "list", "--json", "--category", "word"])

        payload = _json_out(result)
        assert {t["category"] for t in payload["tools"]} == {"word"}

    def test_unbekannte_kategorie_gibt_fehlercode(self):
        result = runner.invoke(app, ["tools", "list", "--category", "gibtsnicht"])

        assert result.exit_code == 1

    def test_schema_openai_format(self):
        result = runner.invoke(app, ["tools", "schema", "html_analyze", "--openai"])

        assert result.exit_code == 0
        assert "function" in result.stdout

    def test_schema_unbekanntes_tool(self):
        result = runner.invoke(app, ["tools", "schema", "nope"])

        assert result.exit_code == 1


class TestRun:
    def test_run_json_liefert_tool_ergebnis(self, project, monkeypatch):
        monkeypatch.chdir(project.root)

        result = runner.invoke(app, ["run", "html_analyze", "--arg", "path=html/seite.html", "--json"])

        payload = _json_out(result)
        assert result.exit_code == 0
        assert payload["ok"] is True
        assert payload["data"]["images"] == 2

    def test_run_fehler_setzt_exit_code_1(self, project, monkeypatch):
        monkeypatch.chdir(project.root)

        result = runner.invoke(app, ["run", "html_analyze", "--arg", "path=fehlt.html", "--json"])

        assert result.exit_code == 1
        assert _json_out(result)["ok"] is False

    def test_run_mit_args_file_von_stdin(self, project, monkeypatch):
        monkeypatch.chdir(project.root)

        result = runner.invoke(
            app,
            ["run", "html_analyze", "--args-file", "-", "--json"],
            input=json.dumps({"path": "html/seite.html"}),
        )

        assert result.exit_code == 0
        assert _json_out(result)["ok"] is True

    def test_arg_werte_werden_als_json_interpretiert(self, project, monkeypatch):
        monkeypatch.chdir(project.root)

        result = runner.invoke(
            app,
            ["run", "html_minify", "--arg", "html=<div> <p>x</p> </div>", "--arg", "strip_comments=true", "--json"],
        )

        assert _json_out(result)["ok"] is True

    def test_arg_ohne_gleichheitszeichen_wird_abgewiesen(self, project, monkeypatch):
        monkeypatch.chdir(project.root)

        result = runner.invoke(app, ["run", "html_analyze", "--arg", "kaputt"])

        assert result.exit_code != 0

    def test_show_gibt_einzelnes_feld_roh_aus(self, project, monkeypatch):
        monkeypatch.chdir(project.root)

        result = runner.invoke(
            app, ["run", "html_beautify", "--arg", "html=<div><p>x</p></div>", "--show", "html"]
        )

        assert result.exit_code == 0
        assert result.stdout.startswith("<div>")

    def test_show_unbekanntes_feld_gibt_fehler(self, project, monkeypatch):
        monkeypatch.chdir(project.root)

        result = runner.invoke(
            app, ["run", "html_beautify", "--arg", "html=<p>x</p>", "--show", "gibtsnicht"]
        )

        assert result.exit_code == 1

    def test_unbekanntes_tool_json_fehler(self, project, monkeypatch):
        monkeypatch.chdir(project.root)

        result = runner.invoke(app, ["run", "gibt_es_nicht", "--json"])

        assert result.exit_code == 1
        assert _json_out(result)["ok"] is False


class TestInitUndInstall:
    def test_init_legt_projekt_und_agent_dateien_an(self, tmp_path):
        result = runner.invoke(app, ["init", str(tmp_path / "kunde"), "--name", "Kunde"])

        assert result.exit_code == 0
        root = tmp_path / "kunde"
        assert (root / ".yes" / "project.json").is_file()
        assert (root / "AGENTS.md").is_file()
        assert (root / ".mcp.json").is_file()
        assert (root / ".codex" / "config.toml").is_file()
        assert (root / "opencode.json").is_file()
        assert (root / ".yes" / "tools.json").is_file()

    def test_init_ohne_agent_dateien(self, tmp_path):
        runner.invoke(app, ["init", str(tmp_path / "leer"), "--no-agents"])

        assert not (tmp_path / "leer" / "AGENTS.md").exists()

    def test_mcp_json_ist_gueltig_und_nennt_serve(self, tmp_path):
        runner.invoke(app, ["init", str(tmp_path / "k")])

        config = json.loads((tmp_path / "k" / ".mcp.json").read_text(encoding="utf-8"))
        server = config["mcpServers"]["yes-tools"]
        assert server["type"] == "stdio"
        assert "mcp" in server["args"] and "serve" in server["args"]

    def test_install_merged_bestehende_opencode_config(self, tmp_path):
        root = tmp_path / "merge"
        root.mkdir()
        (root / "opencode.json").write_text(
            json.dumps({"model": "eigenes", "mcp": {"fremd": {"type": "local", "command": ["x"]}}}),
            encoding="utf-8",
        )

        result = runner.invoke(app, ["mcp", "install", "--project", str(root), "-c", "opencode"])

        assert result.exit_code == 0
        config = json.loads((root / "opencode.json").read_text(encoding="utf-8"))
        assert config["model"] == "eigenes"          # bestehende Einstellung bleibt
        assert "fremd" in config["mcp"]               # fremder Server bleibt
        assert "yes-tools" in config["mcp"]           # eigener kommt dazu

    def test_install_unbekannter_client(self, tmp_path):
        result = runner.invoke(app, ["mcp", "install", "--project", str(tmp_path), "-c", "emacs"])

        assert result.exit_code == 1

    def test_agents_md_wird_ohne_force_nicht_ueberschrieben(self, tmp_path):
        root = tmp_path / "vorhanden"
        root.mkdir()
        (root / "AGENTS.md").write_text("MEINE ANWEISUNGEN", encoding="utf-8")

        runner.invoke(app, ["mcp", "install", "--project", str(root), "-c", "agents"])

        assert (root / "AGENTS.md").read_text(encoding="utf-8") == "MEINE ANWEISUNGEN"

    def test_agents_md_wird_mit_force_ueberschrieben(self, tmp_path):
        root = tmp_path / "force"
        root.mkdir()
        (root / "AGENTS.md").write_text("ALT", encoding="utf-8")

        runner.invoke(app, ["mcp", "install", "--project", str(root), "-c", "agents", "--force"])

        assert "YES-Tools-Workspace" in (root / "AGENTS.md").read_text(encoding="utf-8")


class TestIndexUndDoctor:
    def test_index_json(self, project, monkeypatch):
        monkeypatch.chdir(project.root)

        result = runner.invoke(app, ["index", "--json"])

        assert _json_out(result)["data"]["by_kind"]["html"] >= 1

    def test_index_tabelle(self, project, monkeypatch):
        monkeypatch.chdir(project.root)

        result = runner.invoke(app, ["index"])

        assert result.exit_code == 0
        assert "seite.html" in result.stdout

    def test_doctor_laeuft_ohne_api_key(self, project, monkeypatch):
        monkeypatch.chdir(project.root)
        for var in ("YESTOOLS_API_KEY", "OPENROUTER_API_KEY", "VITE_OPENROUTER_API_KEY"):
            monkeypatch.delenv(var, raising=False)

        result = runner.invoke(app, ["doctor"])

        assert result.exit_code == 0
        assert "API-Key" in result.stdout

    def test_version(self):
        result = runner.invoke(app, ["--version"])

        assert result.exit_code == 0
        assert "yestools" in result.stdout


class TestAgentCommand:
    def test_agent_ohne_key_gibt_exit_code_2(self, project, monkeypatch):
        monkeypatch.chdir(project.root)
        for var in ("YESTOOLS_API_KEY", "OPENROUTER_API_KEY", "VITE_OPENROUTER_API_KEY"):
            monkeypatch.delenv(var, raising=False)

        result = runner.invoke(app, ["agent", "hallo", "--json"])

        assert result.exit_code == 2
        assert _json_out(result)["ok"] is False

    def test_agent_nutzt_harness_und_gibt_json(self, project, monkeypatch):
        """Der komplette CLI-Pfad mit gemocktem LLM-Endpunkt."""
        import httpx

        monkeypatch.chdir(project.root)
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")

        responses = [
            {
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "",
                            "tool_calls": [
                                {
                                    "id": "c1",
                                    "function": {
                                        "name": "html_analyze",
                                        "arguments": json.dumps({"path": "html/seite.html"}),
                                    },
                                }
                            ],
                        }
                    }
                ]
            },
            {"choices": [{"message": {"role": "assistant", "content": "Ein Bild ohne alt-Text."}}]},
        ]

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=responses.pop(0))

        real_client = httpx.Client
        monkeypatch.setattr(
            httpx, "Client", lambda *a, **kw: real_client(transport=httpx.MockTransport(handler))
        )

        result = runner.invoke(app, ["agent", "analysiere", "die", "seite", "--json"])

        payload = _json_out(result)
        assert result.exit_code == 0
        assert payload["ok"] is True
        assert payload["answer"] == "Ein Bild ohne alt-Text."
        assert payload["tool_calls"] == 1
