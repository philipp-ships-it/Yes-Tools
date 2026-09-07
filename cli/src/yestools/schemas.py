"""Typen und ein minimaler JSON-Schema-Validator für die Tool-Registry.

Warum ein eigener Validator statt `jsonschema`? Die Tool-Schemas hier nutzen
bewusst nur ein kleines, gut definiertes Subset von JSON Schema (object mit
typisierten, optional enum-beschränkten Properties). Dafür lohnt keine weitere
Laufzeit-Abhängigkeit in einem Paket, das auch als schlanke CLI installierbar
bleiben soll. Der Validator ist absichtlich strikt: unbekannte Felder sind ein
Fehler, damit ein Modell, das einen Parameternamen halluziniert, eine klare
Rückmeldung bekommt statt stillschweigend ignoriert zu werden.
"""

from __future__ import annotations

import dataclasses
from dataclasses import dataclass, field
from typing import Any, Callable, Literal

JsonType = Literal["string", "number", "integer", "boolean", "array", "object"]

_PY_TYPES: dict[str, tuple[type, ...]] = {
    "string": (str,),
    "number": (int, float),
    "integer": (int,),
    "boolean": (bool,),
    "array": (list, tuple),
    "object": (dict,),
}


class ToolError(Exception):
    """Fachlicher Fehler bei der Tool-Ausführung (wird als Ergebnis gemeldet)."""


class ValidationError(ToolError):
    """Ungültige Argumente für einen Tool-Aufruf."""


class MissingDependency(ToolError):
    """Ein optionales Extra fehlt (z. B. `yestools[docs]`)."""

    def __init__(self, package: str, extra: str) -> None:
        super().__init__(
            f"Paket '{package}' fehlt. Installiere es mit: pip install \"yestools[{extra}]\""
        )
        self.package = package
        self.extra = extra


@dataclass(slots=True)
class Param:
    """Ein einzelner Tool-Parameter."""

    name: str
    type: JsonType
    description: str
    required: bool = False
    default: Any = None
    enum: list[Any] | None = None
    items_type: JsonType | None = None

    def to_schema(self) -> dict[str, Any]:
        schema: dict[str, Any] = {"type": self.type, "description": self.description}
        if self.enum:
            schema["enum"] = self.enum
        if self.type == "array":
            schema["items"] = {"type": self.items_type or "string"}
        if self.default is not None:
            schema["default"] = self.default
        return schema


@dataclass(slots=True)
class ToolSpec:
    """Definition eines Tools: Metadaten, Parameter-Schema und Handler."""

    name: str
    title: str
    description: str
    category: str
    params: list[Param] = field(default_factory=list)
    handler: Callable[..., "ToolResult"] | None = None
    #: True, wenn das Tool Dateien im Projekt schreiben kann. Schreibende
    #: Aufrufe brauchen im Agent-Harness eine Freigabe (siehe harness.py).
    writes: bool = False
    #: Name des Parameters, der das Schreiben überhaupt auslöst (z. B.
    #: "out_path"). Ist er gesetzt und im Aufruf nicht vorhanden, ist der
    #: Aufruf rein lesend und braucht keine Freigabe — sonst würde der Nutzer
    #: für ein bloßes `html_beautify` ohne Zielpfad unnötig gefragt.
    writes_when: str | None = None
    #: Optionale Extras, die dieses Tool benötigt (nur zur Anzeige/`doctor`).
    requires: list[str] = field(default_factory=list)

    def call_writes(self, args: dict[str, Any] | None = None) -> bool:
        """Schreibt dieser konkrete Aufruf Dateien?"""
        if not self.writes:
            return False
        if self.writes_when is None:
            return True
        return bool((args or {}).get(self.writes_when))

    def json_schema(self) -> dict[str, Any]:
        """Parameter als JSON-Schema-Objekt."""
        return {
            "type": "object",
            "properties": {p.name: p.to_schema() for p in self.params},
            "required": [p.name for p in self.params if p.required],
            "additionalProperties": False,
        }

    def openai_tool(self) -> dict[str, Any]:
        """Schema im OpenAI/OpenRouter-`tools`-Format (auch von MCP-Clients lesbar)."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.json_schema(),
            },
        }

    def manifest_entry(self) -> dict[str, Any]:
        """Eintrag für `.yes/tools.json` — für Agenten ohne MCP-Unterstützung."""
        return {
            "name": self.name,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "writes": self.writes,
            "writesWhen": self.writes_when,
            "requires": list(self.requires),
            "parameters": self.json_schema(),
            "cli": f"yestools run {self.name} --json",
        }


@dataclass(slots=True)
class ToolResult:
    """Ergebnis eines Tool-Aufrufs — immer JSON-serialisierbar."""

    ok: bool
    summary: str
    data: dict[str, Any] = field(default_factory=dict)
    #: Pfade (projekt-relativ), die das Tool geschrieben hat.
    artifacts: list[str] = field(default_factory=list)
    error: str | None = None

    @classmethod
    def success(
        cls,
        summary: str,
        data: dict[str, Any] | None = None,
        artifacts: list[str] | None = None,
    ) -> "ToolResult":
        return cls(ok=True, summary=summary, data=data or {}, artifacts=artifacts or [])

    @classmethod
    def failure(cls, error: str) -> "ToolResult":
        return cls(ok=False, summary=f"Fehler: {error}", error=error)

    def to_dict(self) -> dict[str, Any]:
        return dataclasses.asdict(self)


def validate_args(spec: ToolSpec, args: dict[str, Any]) -> dict[str, Any]:
    """Prüft und normalisiert Argumente gegen das Schema eines Tools.

    Gibt ein neues Dict mit gesetzten Defaults zurück. Wirft `ValidationError`
    bei fehlenden Pflichtfeldern, unbekannten Feldern, falschen Typen oder
    Werten außerhalb eines `enum`.
    """
    if not isinstance(args, dict):
        raise ValidationError("Argumente müssen ein JSON-Objekt sein.")

    known = {p.name: p for p in spec.params}
    unknown = sorted(set(args) - set(known))
    if unknown:
        raise ValidationError(
            f"Unbekannte Parameter für '{spec.name}': {', '.join(unknown)}. "
            f"Erlaubt: {', '.join(sorted(known)) or '(keine)'}"
        )

    out: dict[str, Any] = {}
    for name, param in known.items():
        if name not in args or args[name] is None:
            if param.required:
                raise ValidationError(
                    f"Pflichtparameter '{name}' fehlt für Tool '{spec.name}'."
                )
            if param.default is not None:
                out[name] = param.default
            continue

        value = args[name]
        expected = _PY_TYPES[param.type]
        # bool ist in Python ein int — für "integer"/"number" trotzdem ablehnen,
        # sonst wird True stillschweigend zu 1.
        if param.type in ("integer", "number") and isinstance(value, bool):
            raise ValidationError(
                f"Parameter '{name}' erwartet {param.type}, bekam boolean."
            )
        if not isinstance(value, expected):
            raise ValidationError(
                f"Parameter '{name}' erwartet {param.type}, bekam "
                f"{type(value).__name__}."
            )
        if param.enum and value not in param.enum:
            raise ValidationError(
                f"Parameter '{name}': '{value}' ist nicht erlaubt. "
                f"Erlaubt: {', '.join(map(str, param.enum))}"
            )
        if param.type == "array":
            value = list(value)
            item_types = _PY_TYPES[param.items_type or "string"]
            for item in value:
                if not isinstance(item, item_types):
                    raise ValidationError(
                        f"Parameter '{name}': Listeneinträge müssen "
                        f"{param.items_type or 'string'} sein."
                    )
        out[name] = value

    return out
