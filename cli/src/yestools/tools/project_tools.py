"""Projekt-Werkzeuge: Dateien im Workspace auflisten, lesen, schreiben.

Diese Tools sind der Grund, warum der Agent im Projektordner überhaupt
arbeiten kann. Alle Pfade laufen über `ProjectContext.resolve()` und sind
damit auf den Projektordner beschränkt (siehe Docstring in `project.py`).
"""

from __future__ import annotations

from ..project import ProjectContext
from ..registry import tool
from ..schemas import Param, ToolError, ToolResult

MAX_READ_BYTES = 200_000

TEXT_SUFFIXES = {
    ".txt", ".md", ".html", ".htm", ".css", ".js", ".ts", ".tsx", ".json",
    ".xml", ".svg", ".csv", ".yml", ".yaml", ".toml", ".ini", ".php",
}


@tool(
    "project_index",
    title="Projektdateien auflisten",
    description=(
        "Listet alle Dateien im Projektordner mit Typ (word/html/image/…) und Größe. "
        "Nutze dies zuerst, wenn du nicht weißt, welche Dateien es gibt, statt "
        "Dateinamen zu erraten."
    ),
    category="project",
    params=[
        Param("kind", "string", "Optional auf einen Typ filtern (z. B. 'word', 'html', 'image')."),
        Param("limit", "integer", "Maximale Anzahl Einträge.", default=200),
    ],
)
def project_index(
    project: ProjectContext, kind: str | None = None, limit: int = 200
) -> ToolResult:
    entries = project.index(limit=max(1, limit))
    if kind:
        entries = [e for e in entries if e["kind"] == kind]

    by_kind: dict[str, int] = {}
    for entry in entries:
        by_kind[entry["kind"]] = by_kind.get(entry["kind"], 0) + 1

    return ToolResult.success(
        summary=(
            f"{project.name}: {len(entries)} Dateien"
            + (f" ({', '.join(f'{k}: {v}' for k, v in sorted(by_kind.items()))})" if by_kind else "")
            + f" in {project.root}."
        ),
        data={
            "project": project.name,
            "root": str(project.root),
            "initialized": project.initialized,
            "files": entries,
            "by_kind": by_kind,
        },
    )


@tool(
    "project_read_file",
    title="Projektdatei lesen",
    description=(
        "Liest eine Textdatei aus dem Projektordner (HTML, Markdown, CSS, JSON, …). "
        "Für .docx nutze stattdessen 'word_extract_text', für Bilder 'image_info'."
    ),
    category="project",
    params=[
        Param("path", "string", "Projekt-relativer Pfad.", required=True),
        Param("max_bytes", "integer", f"Maximal zu lesende Bytes (Obergrenze {MAX_READ_BYTES}).", default=50_000),
    ],
)
def project_read_file(
    project: ProjectContext, path: str, max_bytes: int = 50_000
) -> ToolResult:
    target = project.resolve(path, must_exist=True)
    if target.is_dir():
        raise ToolError(f"'{project.relative(target)}' ist ein Ordner — nutze 'project_index'.")

    suffix = target.suffix.lower()
    if suffix not in TEXT_SUFFIXES:
        raise ToolError(
            f"'{project.relative(target)}' ({suffix or 'ohne Endung'}) ist kein Textformat. "
            "Für Word-Dateien 'word_extract_text', für Bilder 'image_info' nutzen."
        )

    cap = max(1, min(max_bytes, MAX_READ_BYTES))
    raw = target.read_bytes()[: cap + 1]
    truncated = len(raw) > cap
    content = raw[:cap].decode("utf-8", errors="replace")

    return ToolResult.success(
        summary=(
            f"{project.relative(target)}: {len(content)} Zeichen gelesen"
            + (" (abgeschnitten)" if truncated else "")
            + "."
        ),
        data={
            "path": project.relative(target),
            "content": content,
            "truncated": truncated,
            "bytes": target.stat().st_size,
        },
    )


@tool(
    "project_write_file",
    title="Projektdatei schreiben",
    description=(
        "Schreibt Textinhalt in eine Datei im Projektordner. Überschreibt eine "
        "vorhandene Datei nur, wenn 'overwrite' explizit true ist — so kann ein "
        "versehentlicher Aufruf keine Arbeit des Nutzers zerstören."
    ),
    category="project",
    params=[
        Param("path", "string", "Projekt-relativer Zielpfad.", required=True),
        Param("content", "string", "Zu schreibender Textinhalt.", required=True),
        Param("overwrite", "boolean", "Vorhandene Datei überschreiben.", default=False),
    ],
    writes=True,
)
def project_write_file(
    project: ProjectContext, path: str, content: str, overwrite: bool = False
) -> ToolResult:
    target = project.resolve(path)
    if target.exists() and not overwrite:
        raise ToolError(
            f"'{project.relative(target)}' existiert bereits. "
            "Setze 'overwrite': true, wenn die Datei wirklich ersetzt werden soll."
        )
    if target.is_dir():
        raise ToolError(f"'{project.relative(target)}' ist ein Ordner.")

    target.parent.mkdir(parents=True, exist_ok=True)
    existed = target.exists()
    target.write_text(content, encoding="utf-8")

    return ToolResult.success(
        summary=(
            f"{project.relative(target)} {'überschrieben' if existed else 'geschrieben'} "
            f"({len(content)} Zeichen)."
        ),
        data={"path": project.relative(target), "bytes": len(content.encode('utf-8')), "overwritten": existed},
        artifacts=[project.relative(target)],
    )
