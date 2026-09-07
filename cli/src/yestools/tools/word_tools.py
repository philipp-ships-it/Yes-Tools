"""Word-Werkzeuge: .docx zu HTML, Text extrahieren, Bilder extrahieren.

Text- und Bildextraktion laufen bewusst über `zipfile` + `xml.etree` aus der
Standardbibliothek: ein .docx IST ein ZIP-Archiv mit `word/document.xml` und
`word/media/*`. Das hält den Kern abhängigkeitsfrei und funktioniert auch,
wenn `python-docx` nicht installiert ist. Nur die HTML-Konvertierung nutzt
`mammoth` (Extra `docs`) — semantisches HTML aus Word-Styles ist zu komplex,
um es sinnvoll selbst zu bauen.
"""

from __future__ import annotations

import zipfile
from pathlib import Path
from xml.etree import ElementTree

from ..project import ProjectContext
from ..registry import tool
from ..schemas import MissingDependency, Param, ToolError, ToolResult

W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def _open_docx(project: ProjectContext, path: str) -> tuple[Path, zipfile.ZipFile]:
    target = project.resolve(path, must_exist=True)
    if target.suffix.lower() not in (".docx", ".dotx", ".docm"):
        raise ToolError(
            f"'{project.relative(target)}' ist keine .docx-Datei. "
            "Altes .doc-Format wird nicht unterstützt — bitte vorher in .docx konvertieren."
        )
    try:
        return target, zipfile.ZipFile(target)
    except zipfile.BadZipFile as exc:
        raise ToolError(f"'{project.relative(target)}' ist kein gültiges .docx-Archiv.") from exc


@tool(
    "word_extract_text",
    title="Text aus Word extrahieren",
    description=(
        "Extrahiert den Textinhalt einer .docx-Datei absatzweise. Braucht keine "
        "Zusatzpakete. Nutze dies, wenn du den Inhalt eines Word-Dokuments lesen "
        "oder analysieren musst."
    ),
    category="word",
    params=[
        Param("path", "string", "Projekt-relativer Pfad zur .docx-Datei.", required=True),
        Param("out_path", "string", "Optional: Zielpfad für den extrahierten Text (.txt/.md)."),
    ],
    writes=True,
    writes_when="out_path",
)
def word_extract_text(
    project: ProjectContext, path: str, out_path: str | None = None
) -> ToolResult:
    target, archive = _open_docx(project, path)
    with archive:
        try:
            xml = archive.read("word/document.xml")
        except KeyError as exc:
            raise ToolError("Im Archiv fehlt 'word/document.xml'.") from exc

    root = ElementTree.fromstring(xml)
    paragraphs: list[str] = []
    for para in root.iter(f"{W_NS}p"):
        parts = [node.text or "" for node in para.iter(f"{W_NS}t")]
        # <w:br/> und <w:tab/> als Whitespace berücksichtigen
        text = "".join(parts).strip()
        if text:
            paragraphs.append(text)

    content = "\n\n".join(paragraphs)
    artifacts: list[str] = []
    if out_path:
        dest = project.resolve(out_path)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(content, encoding="utf-8")
        artifacts.append(project.relative(dest))

    return ToolResult.success(
        summary=(
            f"{project.relative(target)}: {len(paragraphs)} Absätze, "
            f"{len(content.split())} Wörter extrahiert."
        ),
        data={"text": content, "paragraphs": len(paragraphs), "words": len(content.split())},
        artifacts=artifacts,
    )


@tool(
    "word_extract_images",
    title="Bilder aus Word extrahieren",
    description=(
        "Extrahiert alle eingebetteten Bilder aus einer .docx-Datei in einen "
        "Zielordner im Projekt (Standard: assets/<dateiname>/)."
    ),
    category="word",
    params=[
        Param("path", "string", "Projekt-relativer Pfad zur .docx-Datei.", required=True),
        Param("out_dir", "string", "Zielordner (projekt-relativ). Standard: assets/<name>/"),
    ],
    writes=True,
)
def word_extract_images(
    project: ProjectContext, path: str, out_dir: str | None = None
) -> ToolResult:
    target, archive = _open_docx(project, path)
    dest_dir = project.resolve(out_dir or f"assets/{target.stem}")
    dest_dir.mkdir(parents=True, exist_ok=True)

    written: list[str] = []
    total_bytes = 0
    with archive:
        media = [n for n in archive.namelist() if n.startswith("word/media/") and not n.endswith("/")]
        for name in media:
            data = archive.read(name)
            # Nur der Basisname wird verwendet — verhindert Zip-Slip über
            # manipulierte Archiv-Einträge wie "word/media/../../evil.png".
            out_file = dest_dir / Path(name).name
            out_file.write_bytes(data)
            written.append(project.relative(out_file))
            total_bytes += len(data)

    if not written:
        return ToolResult.success(
            summary=f"{project.relative(target)}: keine eingebetteten Bilder gefunden.",
            data={"images": [], "count": 0},
        )

    return ToolResult.success(
        summary=(
            f"{project.relative(target)}: {len(written)} Bilder "
            f"({total_bytes / 1024:.1f} KB) nach {project.relative(dest_dir)}/ extrahiert."
        ),
        data={"images": written, "count": len(written), "bytes": total_bytes},
        artifacts=written,
    )


@tool(
    "word_to_html",
    title="Word zu HTML konvertieren",
    description=(
        "Konvertiert eine .docx-Datei in semantisches HTML (Überschriften, Listen, "
        "Fett/Kursiv, Tabellen). Benötigt das Extra 'docs' (mammoth)."
    ),
    category="word",
    params=[
        Param("path", "string", "Projekt-relativer Pfad zur .docx-Datei.", required=True),
        Param("out_path", "string", "Optional: Zielpfad für die HTML-Datei (z. B. html/brief.html)."),
        Param("beautify", "boolean", "Ergebnis-HTML formatiert einrücken.", default=True),
    ],
    writes=True,
    writes_when="out_path",
    requires=["docs"],
)
def word_to_html(
    project: ProjectContext,
    path: str,
    out_path: str | None = None,
    beautify: bool = True,
) -> ToolResult:
    try:
        import mammoth  # type: ignore
    except ImportError as exc:  # pragma: no cover - abhängig von der Installation
        raise MissingDependency("mammoth", "docs") from exc

    from .. import htmlfmt

    target = project.resolve(path, must_exist=True)
    with target.open("rb") as fh:
        conversion = mammoth.convert_to_html(fh)

    html = conversion.value
    if beautify:
        html = htmlfmt.beautify(html)

    warnings = [str(m) for m in getattr(conversion, "messages", [])][:20]
    artifacts: list[str] = []
    if out_path:
        dest = project.resolve(out_path)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(html, encoding="utf-8")
        artifacts.append(project.relative(dest))

    return ToolResult.success(
        summary=(
            f"{project.relative(target)} → HTML ({len(html)} Zeichen"
            + (f", {len(warnings)} Hinweise" if warnings else "")
            + ")."
        ),
        data={"html": html, "warnings": warnings},
        artifacts=artifacts,
    )
