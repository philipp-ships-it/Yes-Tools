"""Gemeinsame Fixtures.

Jeder Test bekommt ein frisches Projekt in einem tmp-Verzeichnis — kein Test
darf auf Dateien eines anderen Tests treffen, und keiner schreibt außerhalb
von tmp.
"""

from __future__ import annotations

import pytest

from yestools.project import ProjectContext


@pytest.fixture()
def project(tmp_path) -> ProjectContext:
    ctx = ProjectContext.init(tmp_path / "projekt", name="Testprojekt")
    (ctx.root / "html").mkdir(exist_ok=True)
    (ctx.root / "html" / "seite.html").write_text(
        '<!DOCTYPE html><html lang="de"><head><title>T</title>'
        '<meta name="viewport" content="width=device-width">'
        '<meta name="description" content="Beschreibung"></head>'
        "<body><h1>Titel</h1><img src=\"a.png\"><img src=\"b.png\" alt=\"ok\">"
        '<p>Text mit <a href="https://example.com">Link</a>.</p>'
        "<!--[if mso]><table><tr><td>x</td></tr></table><![endif]--></body></html>",
        encoding="utf-8",
    )
    return ctx


@pytest.fixture()
def docx_file(project):
    """Erzeugt eine echte .docx-Datei mit Text und einem eingebetteten Bild."""
    docx = pytest.importorskip("docx")
    PIL = pytest.importorskip("PIL.Image")

    image_path = project.root / "assets" / "quelle.png"
    image_path.parent.mkdir(parents=True, exist_ok=True)
    PIL.new("RGB", (120, 60), (10, 120, 200)).save(image_path)

    document = docx.Document()
    document.add_heading("Überschrift", level=1)
    document.add_paragraph("Erster Absatz mit Umlauten: äöüß.")
    document.add_paragraph("Zweiter Absatz.")
    document.add_picture(str(image_path))
    target = project.root / "documents" / "brief.docx"
    target.parent.mkdir(parents=True, exist_ok=True)
    document.save(target)
    return target
