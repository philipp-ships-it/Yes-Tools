"""Projekt-Workspace: der Ordner, in dem Word-, HTML- und Bilddateien liegen.

Ein YES-Tools-Projekt ist ein normaler Ordner mit einem `.yes/`-Unterordner:

    mein-projekt/
    ├── .yes/
    │   ├── project.json      Projekt-Manifest (Name, Version, Ordner)
    │   └── tools.json        Tool-Manifest für Agenten ohne MCP
    ├── documents/            Eingangs-Dokumente (.docx, .pdf, .md)
    ├── html/                 HTML-Dateien
    ├── assets/               Bilder & Medien
    ├── output/               Ergebnisse der Tools
    ├── AGENTS.md             Anleitung für KI-Agenten (offener Standard)
    └── .mcp.json             MCP-Serverkonfiguration (Claude Code u. a.)

**Sicherheit (Path-Jail):** Jeder Dateizugriff der Tools läuft über
`ProjectContext.resolve()`. Das ist die einzige Stelle, an der aus einem
String ein Pfad wird — und sie stellt sicher, dass der Pfad innerhalb des
Projektordners liegt. Das ist kein Selbstzweck: Tool-Argumente kommen bei
agentischer Nutzung vom Modell, dessen Ausgabe wiederum von Inhalten im
Kontext beeinflussbar ist. Ohne Jail wäre `{"path": "../../.ssh/id_rsa"}`
ein gültiger Tool-Aufruf.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .schemas import ToolError

MARKER_DIR = ".yes"
MANIFEST_NAME = "project.json"

DEFAULT_FOLDERS: tuple[str, ...] = ("documents", "html", "assets", "output")

#: Dateiendungen, die der Index nach Kategorie einsortiert.
KIND_BY_SUFFIX: dict[str, str] = {
    ".docx": "word",
    ".doc": "word",
    ".dotx": "word",
    ".pdf": "pdf",
    ".html": "html",
    ".htm": "html",
    ".md": "markdown",
    ".txt": "text",
    ".csv": "data",
    ".json": "data",
    ".xml": "data",
    ".svg": "svg",
    ".png": "image",
    ".jpg": "image",
    ".jpeg": "image",
    ".webp": "image",
    ".gif": "image",
    ".avif": "image",
}

#: Diese Ordner werden beim Indexieren nie betreten.
IGNORED_DIRS = {".git", ".yes", "node_modules", "__pycache__", ".venv", "dist", ".idea"}


class ProjectError(ToolError):
    """Fehler rund um den Projekt-Workspace."""


@dataclass(slots=True)
class ProjectContext:
    """Ein geöffneter Projekt-Workspace."""

    root: Path
    name: str = ""
    #: True, wenn ein `.yes/`-Ordner existiert (also ein echtes YES-Projekt).
    initialized: bool = False
    meta: dict[str, Any] = field(default_factory=dict)

    # ------------------------------------------------------------------ #
    # Erzeugen / Finden                                                  #
    # ------------------------------------------------------------------ #

    @classmethod
    def discover(cls, start: str | os.PathLike[str] | None = None) -> "ProjectContext":
        """Sucht vom Startpfad aufwärts nach einem `.yes/`-Ordner.

        Ohne Fund wird das Startverzeichnis als (nicht initialisiertes)
        Projekt verwendet — die Tools funktionieren also auch in einem
        beliebigen Ordner, nur ohne Projekt-Metadaten.
        """
        base = Path(start or os.environ.get("YESTOOLS_PROJECT") or Path.cwd())
        base = base.expanduser().resolve()
        for candidate in [base, *base.parents]:
            if (candidate / MARKER_DIR).is_dir():
                return cls.load(candidate)
        return cls(root=base, name=base.name, initialized=False)

    @classmethod
    def load(cls, root: str | os.PathLike[str]) -> "ProjectContext":
        root_path = Path(root).expanduser().resolve()
        manifest_path = root_path / MARKER_DIR / MANIFEST_NAME
        meta: dict[str, Any] = {}
        if manifest_path.is_file():
            try:
                meta = json.loads(manifest_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:
                raise ProjectError(
                    f"{manifest_path} ist kein gültiges JSON: {exc}"
                ) from exc
        return cls(
            root=root_path,
            name=meta.get("name") or root_path.name,
            initialized=(root_path / MARKER_DIR).is_dir(),
            meta=meta,
        )

    @classmethod
    def init(
        cls,
        root: str | os.PathLike[str],
        name: str | None = None,
        folders: tuple[str, ...] = DEFAULT_FOLDERS,
    ) -> "ProjectContext":
        """Legt die Projektstruktur an (idempotent — vorhandenes bleibt)."""
        root_path = Path(root).expanduser().resolve()
        root_path.mkdir(parents=True, exist_ok=True)
        (root_path / MARKER_DIR).mkdir(exist_ok=True)
        for folder in folders:
            (root_path / folder).mkdir(exist_ok=True)
            gitkeep = root_path / folder / ".gitkeep"
            if not any((root_path / folder).iterdir()):
                gitkeep.touch()

        meta = {
            "name": name or root_path.name,
            "manifestVersion": 1,
            "createdAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "folders": list(folders),
        }
        (root_path / MARKER_DIR / MANIFEST_NAME).write_text(
            json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        return cls.load(root_path)

    # ------------------------------------------------------------------ #
    # Pfade                                                              #
    # ------------------------------------------------------------------ #

    def resolve(self, relative: str, *, must_exist: bool = False) -> Path:
        """Löst einen projekt-relativen Pfad sicher auf (Path-Jail).

        Absolute Pfade sind erlaubt, solange sie innerhalb des Projekts
        liegen — alles andere wird abgewiesen, inklusive `..`-Ausbrüchen und
        Symlinks, die nach außen zeigen.
        """
        if not relative or not str(relative).strip():
            raise ProjectError("Leerer Pfad.")
        if "\x00" in str(relative):
            raise ProjectError("Pfad enthält ein Null-Byte.")

        candidate = Path(relative).expanduser()
        target = candidate if candidate.is_absolute() else self.root / candidate

        # strict=False: der Pfad darf noch nicht existieren (Schreibziele).
        resolved = target.resolve(strict=False)
        root = self.root.resolve(strict=False)
        if resolved != root and root not in resolved.parents:
            raise ProjectError(
                f"Pfad '{relative}' liegt außerhalb des Projektordners "
                f"({root}). Zugriffe außerhalb des Projekts sind nicht erlaubt."
            )
        if must_exist and not resolved.exists():
            raise ProjectError(f"Datei oder Ordner '{relative}' existiert nicht.")
        return resolved

    def relative(self, path: str | os.PathLike[str]) -> str:
        """Projekt-relativer Pfad mit `/` als Trenner (plattformstabil)."""
        p = Path(path).resolve(strict=False)
        try:
            return p.relative_to(self.root.resolve(strict=False)).as_posix()
        except ValueError:
            return p.as_posix()

    def output_path(self, filename: str, subdir: str = "output") -> Path:
        """Zielpfad im Ausgabeordner, Ordner wird bei Bedarf angelegt."""
        target = self.resolve(f"{subdir}/{Path(filename).name}")
        target.parent.mkdir(parents=True, exist_ok=True)
        return target

    # ------------------------------------------------------------------ #
    # Index                                                              #
    # ------------------------------------------------------------------ #

    def index(self, limit: int = 500) -> list[dict[str, Any]]:
        """Listet die Projektdateien mit Typ und Größe (für Agent-Kontext)."""
        entries: list[dict[str, Any]] = []
        root = self.root
        for path in sorted(root.rglob("*")):
            if len(entries) >= limit:
                break
            if any(part in IGNORED_DIRS for part in path.relative_to(root).parts):
                continue
            if not path.is_file() or path.name == ".gitkeep":
                continue
            try:
                size = path.stat().st_size
            except OSError:
                continue
            entries.append(
                {
                    "path": self.relative(path),
                    "kind": KIND_BY_SUFFIX.get(path.suffix.lower(), "other"),
                    "bytes": size,
                }
            )
        return entries

    def summary(self, limit: int = 60) -> str:
        """Kompakte Textzusammenfassung des Projekts für den System-Prompt."""
        files = self.index()
        by_kind: dict[str, int] = {}
        for entry in files:
            by_kind[entry["kind"]] = by_kind.get(entry["kind"], 0) + 1

        head = [
            f"Projekt: {self.name}",
            f"Ordner: {self.root}",
            f"Initialisiert: {'ja' if self.initialized else 'nein (kein .yes/)'}",
            f"Dateien: {len(files)}"
            + (f" ({', '.join(f'{k}: {v}' for k, v in sorted(by_kind.items()))})" if by_kind else ""),
        ]
        listing = [f"  - {e['path']} [{e['kind']}, {e['bytes']} B]" for e in files[:limit]]
        if len(files) > limit:
            listing.append(f"  … und {len(files) - limit} weitere")
        return "\n".join(head + (["Dateien:"] + listing if listing else []))
