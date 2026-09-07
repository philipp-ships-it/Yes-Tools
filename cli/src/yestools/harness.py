"""Der Agent-Harness: LLM-Loop mit Tool-Calling über die Registry.

Derselbe Aufbau wie der Harness der Web-App (`src/lib/ai/agent.ts`), hier für
das Terminal und mit Zugriff auf das Dateisystem des Projektordners:

    1. Anfrage an das Modell MIT den Tool-Schemas aus der Registry
    2. Antwort enthält `tool_calls`? → ausführen, Ergebnis als role="tool"
       zurück in den Verlauf, zurück zu (1)
    3. Keine `tool_calls` mehr → finale Antwort

Das Modell führt nie selbst Code aus; es *beantragt* Tool-Aufrufe. Der Harness
entscheidet, ob er sie ausführt — schreibende Tools brauchen eine Freigabe
(`approve`-Callback), sofern nicht ausdrücklich `auto_approve` gesetzt ist.

Der Client spricht die OpenAI-kompatible `/chat/completions`-API. Damit läuft
derselbe Loop gegen OpenRouter (Claude, GPT, Gemini, DeepSeek …) und gegen
jeden selbst gehosteten OpenAI-kompatiblen Endpunkt (z. B. ein Hermes-Modell
über vLLM/llama.cpp) — nur `base_url` und `model` ändern sich.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Callable, Iterable, Literal

import httpx

from .config import Settings, load_settings
from .project import ProjectContext
from .registry import all_tools, call_tool, get_tool, openai_tools
from .schemas import ToolResult, ToolSpec

EventKind = Literal["step", "assistant_text", "tool_call", "tool_result", "denied", "final", "error"]


@dataclass(slots=True)
class AgentEvent:
    """Live-Ereignis aus dem Loop — CLI und TUI rendern damit den Fortschritt."""

    kind: EventKind
    text: str = ""
    tool_name: str | None = None
    args: dict[str, Any] = field(default_factory=dict)
    result: ToolResult | None = None
    step: int = 0


@dataclass(slots=True)
class AgentRun:
    """Ergebnis eines kompletten Agent-Durchlaufs."""

    final_text: str
    events: list[AgentEvent] = field(default_factory=list)
    steps_used: int = 0
    tool_calls: int = 0
    transcript: list[dict[str, Any]] = field(default_factory=list)
    stopped_reason: str = "completed"

    @property
    def artifacts(self) -> list[str]:
        """Alle Dateien, die während des Durchlaufs geschrieben wurden."""
        out: list[str] = []
        for event in self.events:
            if event.result and event.result.artifacts:
                out.extend(a for a in event.result.artifacts if a not in out)
        return out


class AgentError(RuntimeError):
    """Fehler, der den Loop abbricht (Netzwerk, Auth, Konfiguration)."""


def build_system_prompt(project: ProjectContext, specs: Iterable[ToolSpec] | None = None) -> str:
    """System-Prompt mit Projektkontext, Tool-Liste und Verhaltensregeln.

    Die Tool-Liste wird aus der Registry generiert, nicht von Hand gepflegt —
    ein neu registriertes Tool erscheint automatisch im Prompt.
    """
    specs = list(specs or all_tools())
    def _marker(spec: ToolSpec) -> str:
        if not spec.writes:
            return ""
        if spec.writes_when:
            return f" [schreibend, nur mit '{spec.writes_when}']"
        return " [schreibend]"

    tool_lines = "\n".join(
        f"- {spec.name}{_marker(spec)}: {spec.description}" for spec in specs
    )

    return f"""Du bist die YES KI im Terminal — ein werkzeuggestützter Assistent für Dokument-, HTML- und Bild-Workflows.

## Arbeitskontext
{project.summary(limit=40)}

## Verhalten
- Antworte präzise, knapp und auf Deutsch.
- Du bist kein reiner Chat-Assistent: Wenn eine Aufgabe mit einem der unten
  gelisteten Tools lösbar ist, RUFE DAS TOOL AUF. Baue Ergebnisse nie von Hand
  nach (z. B. HTML selbst einrücken statt html_beautify aufzurufen) und
  behaupte nie ein Ergebnis, das du nicht über ein Tool erzeugt hast.
- Kennst du die Dateien im Projekt nicht, rufe zuerst `project_index` auf,
  statt Dateinamen zu erraten.
- Mit [schreibend] markierte Tools verändern Dateien des Nutzers. Nutze sie nur,
  wenn die Aufgabe das erfordert, und schreibe Ergebnisse bevorzugt als NEUE
  Datei (z. B. nach output/), statt Originale zu überschreiben.
- Nach jedem Tool-Aufruf bekommst du das Ergebnis als Werkzeug-Nachricht.
  Fasse für den Nutzer in eigenen Worten zusammen, was passiert ist, und nenne
  geschriebene Dateien mit ihrem Pfad. Gib keine rohen JSON-Dumps aus.
- Passt kein Tool, antworte normal und sage klar, was du nicht tun kannst.

## Verfügbare Tools
{tool_lines}
"""


class Agent:
    """Der Harness. Ein Objekt pro Session/Projekt."""

    def __init__(
        self,
        project: ProjectContext | None = None,
        settings: Settings | None = None,
        *,
        auto_approve: bool = False,
        approve: Callable[[ToolSpec, dict[str, Any]], bool] | None = None,
        client: httpx.Client | None = None,
    ) -> None:
        self.project = project or ProjectContext.discover()
        self.settings = settings or load_settings(self.project.root)
        self.auto_approve = auto_approve
        self.approve = approve
        self._client = client
        #: Gesprächsverlauf über mehrere `run()`-Aufrufe hinweg (TUI-Chat).
        self.history: list[dict[str, Any]] = []

    # ------------------------------------------------------------------ #
    # HTTP                                                               #
    # ------------------------------------------------------------------ #

    def _http(self) -> httpx.Client:
        if self._client is None:
            self._client = httpx.Client(timeout=httpx.Timeout(120.0))
        return self._client

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.settings.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/philipp-ships-it/Yes-Tools",
            "X-Title": "YES Tools CLI",
        }

    def _completion(self, messages: list[dict[str, Any]]) -> dict[str, Any]:
        payload = {
            "model": self.settings.model,
            "messages": messages,
            "tools": openai_tools(),
            "temperature": self.settings.temperature,
        }
        url = f"{self.settings.base_url}/chat/completions"
        try:
            response = self._http().post(url, headers=self._headers(), json=payload)
        except httpx.HTTPError as exc:
            raise AgentError(f"Netzwerkfehler bei {url}: {exc}") from exc

        if response.status_code == 401:
            raise AgentError(
                "401 Unauthorized — API-Key ungültig oder abgelaufen. "
                "Prüfe OPENROUTER_API_KEY (oder YESTOOLS_API_KEY)."
            )
        if response.status_code >= 400:
            detail = ""
            try:
                detail = response.json().get("error", {}).get("message", "")
            except Exception:
                detail = response.text[:300]
            raise AgentError(f"API-Fehler {response.status_code}: {detail}")

        try:
            return response.json()
        except json.JSONDecodeError as exc:
            raise AgentError("Antwort der API war kein gültiges JSON.") from exc

    # ------------------------------------------------------------------ #
    # Loop                                                               #
    # ------------------------------------------------------------------ #

    def _may_run(self, spec: ToolSpec, args: dict[str, Any]) -> bool:
        # Entscheidend ist, ob DIESER Aufruf schreibt: `html_beautify` ohne
        # `out_path` gibt nur zurück und braucht keine Freigabe.
        if not spec.call_writes(args) or self.auto_approve:
            return True
        if self.approve is None:
            # Ohne Freigabemechanismus wird nicht geschrieben — sicherer Default.
            return False
        return bool(self.approve(spec, args))

    def run(
        self,
        prompt: str,
        on_event: Callable[[AgentEvent], None] | None = None,
        *,
        keep_history: bool = True,
    ) -> AgentRun:
        """Führt eine Nutzeranfrage aus, inklusive aller nötigen Tool-Aufrufe."""
        if not self.settings.has_api_key:
            raise AgentError(
                "Kein API-Key gefunden. Setze OPENROUTER_API_KEY (oder "
                "YESTOOLS_API_KEY) bzw. trage ihn in .yes/config.json ein. "
                "Ohne Key funktioniert der Agent nicht — die Tools selbst laufen "
                "aber auch ohne: `yestools run <tool> …`."
            )

        def emit(event: AgentEvent) -> None:
            run.events.append(event)
            if on_event:
                on_event(event)

        messages: list[dict[str, Any]] = [
            {"role": "system", "content": build_system_prompt(self.project)},
            *(self.history if keep_history else []),
            {"role": "user", "content": prompt},
        ]
        run = AgentRun(final_text="")

        for step in range(1, self.settings.max_steps + 1):
            run.steps_used = step
            emit(AgentEvent(kind="step", text=f"Schritt {step}", step=step))

            data = self._completion(messages)
            choice = (data.get("choices") or [{}])[0]
            message = choice.get("message") or {}
            calls = message.get("tool_calls") or []
            content = message.get("content") or ""

            if not calls:
                run.final_text = content
                run.transcript = messages
                messages.append({"role": "assistant", "content": content})
                if keep_history:
                    self.history = messages[1:]
                emit(AgentEvent(kind="final", text=content, step=step))
                return run

            if content:
                emit(AgentEvent(kind="assistant_text", text=content, step=step))

            # Reihenfolge ist Konvention: Assistant-Nachricht mit tool_calls
            # MUSS vor den Tool-Ergebnissen stehen, sonst kann das Modell die
            # Antworten nicht zuordnen.
            messages.append({"role": "assistant", "content": content, "tool_calls": calls})

            for call in calls:
                fn = call.get("function") or {}
                name = fn.get("name") or ""
                try:
                    args = json.loads(fn.get("arguments") or "{}")
                    if not isinstance(args, dict):
                        args = {}
                except json.JSONDecodeError:
                    args = {}

                run.tool_calls += 1
                emit(AgentEvent(kind="tool_call", tool_name=name, args=args, step=step))

                try:
                    spec = get_tool(name)
                except Exception as exc:
                    result = ToolResult.failure(str(exc))
                else:
                    if self._may_run(spec, args):
                        result = call_tool(name, args, project=self.project)
                    else:
                        result = ToolResult.failure(
                            "Der Nutzer hat diesen schreibenden Tool-Aufruf nicht freigegeben. "
                            "Frage nach oder schlage einen anderen Weg vor."
                        )
                        emit(AgentEvent(kind="denied", tool_name=name, args=args, step=step))

                emit(
                    AgentEvent(
                        kind="tool_result",
                        tool_name=name,
                        args=args,
                        result=result,
                        text=result.summary,
                        step=step,
                    )
                )
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": call.get("id") or f"{name}-{run.tool_calls}",
                        "name": name,
                        "content": json.dumps(_truncate_for_model(result.to_dict()), ensure_ascii=False),
                    }
                )

        run.stopped_reason = "max_steps"
        run.final_text = (
            f"Abbruch nach {self.settings.max_steps} Schritten ohne finale Antwort — "
            "das Modell hat wiederholt Tools aufgerufen, ohne zu einem Ergebnis zu kommen."
        )
        run.transcript = messages
        emit(AgentEvent(kind="error", text=run.final_text, step=run.steps_used))
        return run

    def close(self) -> None:
        if self._client is not None:
            self._client.close()
            self._client = None


_MODEL_FIELD_LIMIT = 12_000


def _truncate_for_model(payload: dict[str, Any]) -> dict[str, Any]:
    """Kürzt große Textfelder im Tool-Ergebnis, bevor sie ins Modell gehen.

    Ein formatiertes 500-KB-HTML komplett zurückzuspielen würde das
    Kontextfenster sprengen und wäre teuer — für die Weiterarbeit reicht dem
    Modell die Zusammenfassung plus ein Anfang des Inhalts. Der vollständige
    Inhalt bleibt im lokalen `ToolResult` (und in geschriebenen Dateien).
    """
    trimmed: dict[str, Any] = {}
    for key, value in payload.items():
        if key == "data" and isinstance(value, dict):
            trimmed[key] = {
                k: (
                    v[:_MODEL_FIELD_LIMIT] + f"… [gekürzt, {len(v)} Zeichen gesamt]"
                    if isinstance(v, str) and len(v) > _MODEL_FIELD_LIMIT
                    else v
                )
                for k, v in value.items()
            }
        else:
            trimmed[key] = value
    return trimmed
