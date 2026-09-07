"""Tests für Typen und Argument-Validierung."""

from __future__ import annotations

import pytest

from yestools.schemas import Param, ToolResult, ToolSpec, ValidationError, validate_args


def _spec() -> ToolSpec:
    return ToolSpec(
        name="demo",
        title="Demo",
        description="Ein Demo-Tool.",
        category="test",
        params=[
            Param("pflicht", "string", "Pflichtfeld.", required=True),
            Param("zahl", "integer", "Eine Zahl.", default=5),
            Param("modus", "string", "Modus.", enum=["a", "b"], default="a"),
            Param("liste", "array", "Werte.", items_type="string"),
        ],
    )


class TestValidateArgs:
    def test_setzt_defaults_fuer_fehlende_optionale_felder(self):
        result = validate_args(_spec(), {"pflicht": "x"})

        assert result == {"pflicht": "x", "zahl": 5, "modus": "a"}

    def test_fehlendes_pflichtfeld_wird_abgewiesen(self):
        with pytest.raises(ValidationError, match="Pflichtparameter 'pflicht'"):
            validate_args(_spec(), {})

    def test_unbekannter_parameter_wird_abgewiesen(self):
        # Wichtig für Agenten: ein halluzinierter Parametername muss auffallen,
        # nicht stillschweigend ignoriert werden.
        with pytest.raises(ValidationError, match="Unbekannte Parameter"):
            validate_args(_spec(), {"pflicht": "x", "tippfehler": 1})

    def test_falscher_typ_wird_abgewiesen(self):
        with pytest.raises(ValidationError, match="erwartet integer"):
            validate_args(_spec(), {"pflicht": "x", "zahl": "sieben"})

    def test_boolean_gilt_nicht_als_integer(self):
        with pytest.raises(ValidationError, match="bekam boolean"):
            validate_args(_spec(), {"pflicht": "x", "zahl": True})

    def test_enum_wird_geprueft(self):
        with pytest.raises(ValidationError, match="nicht erlaubt"):
            validate_args(_spec(), {"pflicht": "x", "modus": "c"})

    def test_listeneintraege_werden_typgeprueft(self):
        with pytest.raises(ValidationError, match="Listeneinträge"):
            validate_args(_spec(), {"pflicht": "x", "liste": ["ok", 5]})

    def test_nicht_dict_wird_abgewiesen(self):
        with pytest.raises(ValidationError, match="JSON-Objekt"):
            validate_args(_spec(), ["nope"])  # type: ignore[arg-type]


class TestSchemaAusgabe:
    def test_json_schema_enthaelt_required_und_properties(self):
        schema = _spec().json_schema()

        assert schema["required"] == ["pflicht"]
        assert schema["properties"]["modus"]["enum"] == ["a", "b"]
        assert schema["properties"]["liste"]["items"] == {"type": "string"}
        assert schema["additionalProperties"] is False

    def test_openai_format_ist_funktionsaufruf_kompatibel(self):
        payload = _spec().openai_tool()

        assert payload["type"] == "function"
        assert payload["function"]["name"] == "demo"
        assert payload["function"]["parameters"]["type"] == "object"


class TestToolResult:
    def test_ist_json_serialisierbar(self):
        import json

        result = ToolResult.success("fertig", {"a": 1}, artifacts=["output/x.html"])

        assert json.loads(json.dumps(result.to_dict()))["artifacts"] == ["output/x.html"]

    def test_failure_setzt_error_und_ok_false(self):
        result = ToolResult.failure("kaputt")

        assert result.ok is False
        assert result.error == "kaputt"
