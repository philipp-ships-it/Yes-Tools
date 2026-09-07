"""Tests für den Agent-Harness.

Der LLM-Aufruf wird über `httpx.MockTransport` ersetzt — getestet wird die
Steuerungslogik des Harness (Tool-Ausführung, Rückspielen der Ergebnisse,
Freigabe-Policy, Abbruchbedingungen), nicht die fremde API.
"""

from __future__ import annotations

import json

import httpx
import pytest

from yestools.config import Settings
from yestools.harness import Agent, AgentError, build_system_prompt


def _message(content: str = "", tool_calls: list[dict] | None = None) -> dict:
    message: dict = {"role": "assistant", "content": content}
    if tool_calls:
        message["tool_calls"] = tool_calls
    return {"choices": [{"message": message}]}


def _tool_call(name: str, args: dict, call_id: str = "call_1") -> dict:
    return {
        "id": call_id,
        "type": "function",
        "function": {"name": name, "arguments": json.dumps(args)},
    }


def _agent(project, responses: list[dict], **kwargs) -> tuple[Agent, list[dict]]:
    """Agent mit vorgegebener Antwortfolge; sammelt die gesendeten Payloads."""
    sent: list[dict] = []
    queue = list(responses)

    def handler(request: httpx.Request) -> httpx.Response:
        sent.append(json.loads(request.content))
        return httpx.Response(200, json=queue.pop(0) if queue else _message("fertig"))

    client = httpx.Client(transport=httpx.MockTransport(handler))
    settings = Settings(api_key="test-key", model="test/model", max_steps=kwargs.pop("max_steps", 5))
    return Agent(project=project, settings=settings, client=client, **kwargs), sent


class TestSystemPrompt:
    def test_enthaelt_projektkontext_und_alle_tools(self, project):
        prompt = build_system_prompt(project)

        assert project.name in prompt
        assert "html_analyze" in prompt
        assert "project_index" in prompt

    def test_markiert_schreibende_tools(self, project):
        prompt = build_system_prompt(project)

        assert "project_write_file [schreibend]" in prompt


class TestAgentLoop:
    def test_antwort_ohne_tool_call_wird_direkt_zurueckgegeben(self, project):
        agent, sent = _agent(project, [_message("Hallo!")])

        run = agent.run("Hi")

        assert run.final_text == "Hallo!"
        assert run.tool_calls == 0
        assert len(sent) == 1

    def test_tools_werden_mitgesendet(self, project):
        agent, sent = _agent(project, [_message("ok")])

        agent.run("Hi")

        assert len(sent[0]["tools"]) > 5
        assert sent[0]["tools"][0]["type"] == "function"

    def test_tool_call_wird_ausgefuehrt_und_ergebnis_zurueckgespielt(self, project):
        agent, sent = _agent(
            project,
            [
                _message("", [_tool_call("html_analyze", {"path": "html/seite.html"})]),
                _message("Die Seite hat 2 Bilder."),
            ],
        )

        run = agent.run("Analysiere die Seite")

        assert run.final_text == "Die Seite hat 2 Bilder."
        assert run.tool_calls == 1
        # Zweiter Request muss die Tool-Antwort als role="tool" enthalten.
        roles = [m["role"] for m in sent[1]["messages"]]
        assert roles[-1] == "tool"
        payload = json.loads(sent[1]["messages"][-1]["content"])
        assert payload["ok"] is True
        assert payload["data"]["images"] == 2

    def test_assistant_nachricht_mit_tool_calls_steht_vor_dem_ergebnis(self, project):
        agent, sent = _agent(
            project,
            [_message("", [_tool_call("project_index", {})]), _message("fertig")],
        )

        agent.run("Was liegt hier?")

        messages = sent[1]["messages"]
        assert messages[-2]["role"] == "assistant"
        assert "tool_calls" in messages[-2]
        assert messages[-1]["role"] == "tool"

    def test_unbekanntes_tool_wird_als_fehler_zurueckgemeldet(self, project):
        agent, sent = _agent(
            project,
            [_message("", [_tool_call("gibt_es_nicht", {})]), _message("Tool fehlt.")],
        )

        run = agent.run("Test")

        result_event = [e for e in run.events if e.kind == "tool_result"][0]
        assert result_event.result is not None and result_event.result.ok is False
        assert run.final_text == "Tool fehlt."

    def test_kaputte_json_arguments_werden_nicht_zum_absturz(self, project):
        broken = {"id": "c1", "function": {"name": "project_index", "arguments": "{nicht json"}}
        agent, _ = _agent(project, [_message("", [broken]), _message("ok")])

        run = agent.run("Test")

        assert run.final_text == "ok"

    def test_events_melden_start_und_ergebnis_jedes_tool_calls(self, project):
        agent, _ = _agent(
            project, [_message("", [_tool_call("project_index", {})]), _message("ok")]
        )
        seen: list[str] = []

        agent.run("Test", on_event=lambda e: seen.append(e.kind))

        assert "tool_call" in seen
        assert "tool_result" in seen
        assert seen[-1] == "final"

    def test_abbruch_nach_max_steps(self, project):
        loop = [_message("", [_tool_call("project_index", {}, f"c{i}")]) for i in range(10)]
        agent, _ = _agent(project, loop, max_steps=3)

        run = agent.run("Endlos")

        assert run.stopped_reason == "max_steps"
        assert run.steps_used == 3
        assert "Abbruch" in run.final_text


class TestSchreibfreigabe:
    def test_schreibendes_tool_ohne_freigabe_wird_abgelehnt(self, project):
        agent, _ = _agent(
            project,
            [
                _message("", [_tool_call("project_write_file", {"path": "output/a.txt", "content": "x"})]),
                _message("Ich brauche eine Freigabe."),
            ],
        )

        run = agent.run("Schreib was")

        assert not (project.root / "output" / "a.txt").exists()
        assert any(e.kind == "denied" for e in run.events)

    def test_auto_approve_erlaubt_schreiben(self, project):
        agent, _ = _agent(
            project,
            [
                _message("", [_tool_call("project_write_file", {"path": "output/b.txt", "content": "x"})]),
                _message("Geschrieben."),
            ],
            auto_approve=True,
        )

        run = agent.run("Schreib was")

        assert (project.root / "output" / "b.txt").read_text(encoding="utf-8") == "x"
        assert run.artifacts == ["output/b.txt"]

    def test_approve_callback_entscheidet(self, project):
        calls: list[str] = []
        agent, _ = _agent(
            project,
            [
                _message("", [_tool_call("project_write_file", {"path": "output/c.txt", "content": "x"})]),
                _message("ok"),
            ],
            approve=lambda spec, args: calls.append(spec.name) is None,
        )

        agent.run("Schreib was")

        assert calls == ["project_write_file"]
        assert (project.root / "output" / "c.txt").is_file()

    def test_lesende_tools_brauchen_keine_freigabe(self, project):
        agent, _ = _agent(
            project, [_message("", [_tool_call("project_index", {})]), _message("ok")]
        )

        run = agent.run("Liste")

        assert not any(e.kind == "denied" for e in run.events)


class TestFehlerfaelle:
    def test_ohne_api_key_klare_fehlermeldung(self, project):
        agent = Agent(project=project, settings=Settings(api_key=None))

        with pytest.raises(AgentError, match="Kein API-Key"):
            agent.run("Hi")

    def test_401_wird_verstaendlich_gemeldet(self, project):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(401, json={"error": {"message": "invalid"}})

        agent = Agent(
            project=project,
            settings=Settings(api_key="falsch"),
            client=httpx.Client(transport=httpx.MockTransport(handler)),
        )

        with pytest.raises(AgentError, match="401"):
            agent.run("Hi")

    def test_netzwerkfehler_wird_gekapselt(self, project):
        def handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("kein Netz")

        agent = Agent(
            project=project,
            settings=Settings(api_key="k"),
            client=httpx.Client(transport=httpx.MockTransport(handler)),
        )

        with pytest.raises(AgentError, match="Netzwerkfehler"):
            agent.run("Hi")

    def test_grosse_tool_ergebnisse_werden_fuer_das_modell_gekuerzt(self, project):
        (project.root / "html" / "riesig.html").write_text("<p>" + "x" * 40_000 + "</p>", encoding="utf-8")
        agent, sent = _agent(
            project,
            [
                _message("", [_tool_call("html_beautify", {"path": "html/riesig.html"})]),
                _message("ok"),
            ],
        )

        agent.run("Formatiere")

        payload = json.loads(sent[1]["messages"][-1]["content"])
        assert "gekürzt" in payload["data"]["html"]
        assert len(payload["data"]["html"]) < 20_000
