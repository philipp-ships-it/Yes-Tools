"""Konfiguration: Umgebungsvariablen und optionale Projekt-Konfigdatei.

Reihenfolge (später gewinnt nie über früher):
1. explizite CLI-Argumente
2. `.yes/config.json` im Projekt
3. Umgebungsvariablen
4. Standardwerte

Die Env-Namen sind absichtlich kompatibel zur Web-App (`OPENROUTER_API_KEY`
bzw. `VITE_OPENROUTER_API_KEY`), damit derselbe Key ohne Zweitpflege
funktioniert.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "openrouter/auto"

API_KEY_ENV_VARS = (
    "YESTOOLS_API_KEY",
    "OPENROUTER_API_KEY",
    "VITE_OPENROUTER_API_KEY",
)


@dataclass(slots=True)
class Settings:
    """Effektive Einstellungen für den Agent-Harness."""

    api_key: str | None = None
    base_url: str = DEFAULT_BASE_URL
    model: str = DEFAULT_MODEL
    max_steps: int = 8
    temperature: float = 0.3
    #: Quelle des API-Keys (nur für `doctor`, nie den Key selbst ausgeben).
    api_key_source: str | None = None

    @property
    def has_api_key(self) -> bool:
        return bool(self.api_key and self.api_key.strip())


def _read_project_config(project_root: Path | None) -> dict:
    if project_root is None:
        return {}
    path = project_root / ".yes" / "config.json"
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def load_settings(
    project_root: Path | None = None,
    *,
    model: str | None = None,
    base_url: str | None = None,
    api_key: str | None = None,
    max_steps: int | None = None,
    temperature: float | None = None,
) -> Settings:
    """Baut die effektiven Einstellungen zusammen."""
    file_cfg = _read_project_config(project_root)

    key = api_key or file_cfg.get("apiKey")
    key_source = "argument" if api_key else (".yes/config.json" if file_cfg.get("apiKey") else None)
    if not key:
        for var in API_KEY_ENV_VARS:
            value = os.environ.get(var)
            if value and value.strip():
                key, key_source = value.strip(), f"env:{var}"
                break

    return Settings(
        api_key=key,
        base_url=(
            base_url
            or file_cfg.get("baseUrl")
            or os.environ.get("YESTOOLS_BASE_URL")
            or DEFAULT_BASE_URL
        ).rstrip("/"),
        model=(
            model
            or file_cfg.get("model")
            or os.environ.get("YESTOOLS_MODEL")
            or DEFAULT_MODEL
        ),
        max_steps=int(max_steps or file_cfg.get("maxSteps") or os.environ.get("YESTOOLS_MAX_STEPS") or 8),
        temperature=float(
            temperature
            if temperature is not None
            else file_cfg.get("temperature", os.environ.get("YESTOOLS_TEMPERATURE", 0.3))
        ),
        api_key_source=key_source,
    )
