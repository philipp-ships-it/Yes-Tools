"""HTML-Werkzeuge: formatieren, minifizieren, analysieren, Text extrahieren."""

from __future__ import annotations

import re
from typing import Any

from .. import htmlfmt
from ..project import ProjectContext
from ..registry import tool
from ..schemas import Param, ToolResult

_MAX_INLINE = 400_000


def _load_html(project: ProjectContext, html: str | None, path: str | None) -> tuple[str, str]:
    """Holt HTML entweder direkt (`html`) oder aus einer Projektdatei (`path`)."""
    if html and path:
        raise ValueError("Bitte entweder 'html' oder 'path' angeben, nicht beides.")
    if path:
        target = project.resolve(path, must_exist=True)
        return target.read_text(encoding="utf-8", errors="replace"), project.relative(target)
    if html is None:
        raise ValueError("Es muss 'html' oder 'path' angegeben werden.")
    if len(html) > _MAX_INLINE:
        raise ValueError(
            f"Inline-HTML ist zu groß ({len(html)} Zeichen). "
            "Schreibe es in eine Projektdatei und übergib 'path'."
        )
    return html, "<inline>"


def _maybe_write(
    project: ProjectContext, content: str, out_path: str | None
) -> list[str]:
    if not out_path:
        return []
    target = project.resolve(out_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return [project.relative(target)]


_SOURCE_PARAMS = [
    Param("html", "string", "HTML-Quellcode direkt als String."),
    Param("path", "string", "Alternativ: projekt-relativer Pfad zu einer HTML-Datei."),
]

_OUT_PARAM = Param(
    "out_path",
    "string",
    "Optional: projekt-relativer Zielpfad. Ohne Angabe wird nur zurückgegeben, nichts geschrieben.",
)


@tool(
    "html_beautify",
    title="HTML formatieren",
    description=(
        "Formatiert HTML lesbar mit Einrückung. Outlook/MSO Conditional Comments "
        "(<!--[if mso]>…) bleiben erhalten und werden korrekt verschachtelt. "
        "Quelle: entweder 'html' (String) oder 'path' (Projektdatei)."
    ),
    category="html",
    params=[*_SOURCE_PARAMS, Param("indent_size", "integer", "Einrücktiefe in Leerzeichen.", default=2), _OUT_PARAM],
    writes=True,
    writes_when="out_path",
)
def html_beautify(
    project: ProjectContext,
    html: str | None = None,
    path: str | None = None,
    indent_size: int = 2,
    out_path: str | None = None,
) -> ToolResult:
    source, origin = _load_html(project, html, path)
    formatted = htmlfmt.beautify(source, indent_size=indent_size)
    artifacts = _maybe_write(project, formatted, out_path)
    return ToolResult.success(
        summary=f"{origin} formatiert ({len(formatted)} Zeichen, {formatted.count(chr(10)) + 1} Zeilen).",
        data={"html": formatted, "source": origin},
        artifacts=artifacts,
    )


@tool(
    "html_minify",
    title="HTML minifizieren",
    description=(
        "Minifiziert HTML (Whitespace zusammenfassen). Inhalte von <pre>, <script>, "
        "<style> und MSO Conditional Comments bleiben unangetastet, damit E-Mail-"
        "Layouts nicht brechen."
    ),
    category="html",
    params=[
        *_SOURCE_PARAMS,
        Param("strip_comments", "boolean", "Normale HTML-Kommentare entfernen (MSO-Kommentare bleiben).", default=False),
        _OUT_PARAM,
    ],
    writes=True,
    writes_when="out_path",
)
def html_minify(
    project: ProjectContext,
    html: str | None = None,
    path: str | None = None,
    strip_comments: bool = False,
    out_path: str | None = None,
) -> ToolResult:
    source, origin = _load_html(project, html, path)
    minified = htmlfmt.minify(source, strip_comments=strip_comments)
    saved = len(source) - len(minified)
    artifacts = _maybe_write(project, minified, out_path)
    return ToolResult.success(
        summary=(
            f"{origin} minifiziert: {len(source)} → {len(minified)} Zeichen "
            f"({saved} gespart, {saved / max(1, len(source)):.1%})."
        ),
        data={"html": minified, "bytes_before": len(source), "bytes_after": len(minified)},
        artifacts=artifacts,
    )


@tool(
    "html_analyze",
    title="HTML analysieren",
    description=(
        "Prüft HTML auf typische Probleme: Bilder ohne alt-Text, fehlende Meta-Tags "
        "(title/description/viewport), Überschriften-Struktur, Links (intern/extern), "
        "Inline-Styles und Größe. Nutze dies, bevor du Aussagen über die Qualität "
        "eines HTML-Dokuments machst."
    ),
    category="html",
    params=_SOURCE_PARAMS,
)
def html_analyze(
    project: ProjectContext, html: str | None = None, path: str | None = None
) -> ToolResult:
    source, origin = _load_html(project, html, path)

    images = re.findall(r"<img\b[^>]*>", source, flags=re.IGNORECASE)
    images_without_alt = [
        tag for tag in images if not re.search(r"\balt\s*=\s*[\"'][^\"']", tag, re.IGNORECASE)
    ]
    links = re.findall(r"<a\b[^>]*href\s*=\s*[\"']([^\"']+)[\"']", source, flags=re.IGNORECASE)
    external = [href for href in links if href.startswith(("http://", "https://", "//"))]
    mailto = [href for href in links if href.startswith("mailto:")]
    headings = [
        (int(m.group(1)), htmlfmt.strip_tags(m.group(2))[:80])
        for m in re.finditer(r"<h([1-6])\b[^>]*>(.*?)</h\1\s*>", source, flags=re.DOTALL | re.IGNORECASE)
    ]
    inline_styles = len(re.findall(r"\bstyle\s*=\s*[\"']", source, flags=re.IGNORECASE))

    has_title = bool(re.search(r"<title\b[^>]*>\s*\S", source, re.IGNORECASE))
    has_description = bool(
        re.search(r"<meta\b[^>]*name\s*=\s*[\"']description[\"'][^>]*content\s*=\s*[\"']\s*\S", source, re.IGNORECASE)
    )
    has_viewport = bool(
        re.search(r"<meta\b[^>]*name\s*=\s*[\"']viewport[\"']", source, re.IGNORECASE)
    )
    has_lang = bool(re.search(r"<html\b[^>]*\blang\s*=", source, re.IGNORECASE))

    findings: list[str] = []
    if images_without_alt:
        findings.append(f"{len(images_without_alt)} von {len(images)} Bildern ohne alt-Text")
    if not has_title:
        findings.append("kein <title>")
    if not has_description:
        findings.append("keine Meta-Description")
    if not has_viewport:
        findings.append("kein Viewport-Meta-Tag")
    if not has_lang:
        findings.append("kein lang-Attribut am <html>")
    h1_count = sum(1 for level, _ in headings if level == 1)
    if h1_count == 0 and headings:
        findings.append("keine H1")
    elif h1_count > 1:
        findings.append(f"{h1_count} H1-Elemente (empfohlen: genau eine)")

    data: dict[str, Any] = {
        "source": origin,
        "bytes": len(source),
        "images": len(images),
        "images_without_alt": len(images_without_alt),
        "links_total": len(links),
        "links_external": len(external),
        "links_mailto": len(mailto),
        "inline_styles": inline_styles,
        "headings": [{"level": lvl, "text": txt} for lvl, txt in headings],
        "meta": {
            "title": has_title,
            "description": has_description,
            "viewport": has_viewport,
            "lang": has_lang,
        },
        "findings": findings,
    }
    summary = (
        f"{origin}: {len(source)} B, {len(images)} Bilder, {len(links)} Links, "
        f"{len(headings)} Überschriften. "
        + (f"Auffällig: {'; '.join(findings)}." if findings else "Keine Auffälligkeiten.")
    )
    return ToolResult.success(summary=summary, data=data)


@tool(
    "html_extract_text",
    title="Text aus HTML extrahieren",
    description=(
        "Extrahiert den reinen Textinhalt aus HTML (ohne Tags, Skripte und Styles) — "
        "z. B. um Inhalte zu prüfen, zu zählen oder weiterzuverarbeiten."
    ),
    category="html",
    params=[*_SOURCE_PARAMS, _OUT_PARAM],
    writes=True,
    writes_when="out_path",
)
def html_extract_text(
    project: ProjectContext,
    html: str | None = None,
    path: str | None = None,
    out_path: str | None = None,
) -> ToolResult:
    source, origin = _load_html(project, html, path)
    text = htmlfmt.strip_tags(source)
    words = len(text.split())
    artifacts = _maybe_write(project, text, out_path)
    return ToolResult.success(
        summary=f"{origin}: {words} Wörter, {len(text)} Zeichen extrahiert.",
        data={"text": text, "words": words, "characters": len(text)},
        artifacts=artifacts,
    )


@tool(
    "svg_optimize",
    title="SVG optimieren",
    description="Entfernt Kommentare und optional Whitespace aus SVG-Markup.",
    category="html",
    params=[
        Param("svg", "string", "SVG-Quellcode."),
        Param("path", "string", "Alternativ: projekt-relativer Pfad zu einer SVG-Datei."),
        Param("remove_comments", "boolean", "Kommentare entfernen.", default=True),
        Param("minify", "boolean", "Whitespace minimieren.", default=False),
        _OUT_PARAM,
    ],
    writes=True,
    writes_when="out_path",
)
def svg_optimize(
    project: ProjectContext,
    svg: str | None = None,
    path: str | None = None,
    remove_comments: bool = True,
    minify: bool = False,
    out_path: str | None = None,
) -> ToolResult:
    source, origin = _load_html(project, svg, path)
    result = source
    if remove_comments:
        result = re.sub(r"<!--.*?-->", "", result, flags=re.DOTALL)
    if minify:
        result = re.sub(r">\s+<", "><", result)
        result = re.sub(r"[\r\n]+", " ", result).strip()
    artifacts = _maybe_write(project, result, out_path)
    return ToolResult.success(
        summary=f"{origin}: SVG optimiert ({len(source)} → {len(result)} Zeichen).",
        data={"svg": result, "bytes_before": len(source), "bytes_after": len(result)},
        artifacts=artifacts,
    )
