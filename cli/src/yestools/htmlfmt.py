"""HTML-Formatierer und -Minifier — reine Standardbibliothek.

Bewusst ohne `js-beautify`/`bs4`: Der Formatierer muss auch in der schlanken
Kern-Installation laufen, und er hat eine Anforderung, die generische
Formatierer regelmäßig kaputt machen — **Outlook/MSO Conditional Comments**
(`<!--[if mso]> … <![endif]-->`) müssen erhalten bleiben und eigene Zeilen
bekommen. Das ist derselbe Anspruch wie in `src/utils/msoFormatter.ts` der
Web-App.
"""

from __future__ import annotations

import re

#: Elemente ohne schließendes Tag.
VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}

#: Elemente, deren Inhalt unverändert bleiben muss.
RAW_TEXT_ELEMENTS = {"pre", "textarea", "script", "style"}

#: Inline-Elemente werden nicht auf eigene Zeilen gebrochen.
INLINE_ELEMENTS = {
    "a", "abbr", "b", "bdi", "bdo", "cite", "code", "data", "dfn", "em", "i",
    "kbd", "mark", "q", "rp", "rt", "ruby", "s", "samp", "small", "span",
    "strong", "sub", "sup", "time", "u", "var",
}

_TOKEN_RE = re.compile(
    r"(?P<comment><!--.*?-->)"
    r"|(?P<doctype><!DOCTYPE[^>]*>)"
    r"|(?P<close></\s*(?P<close_name>[a-zA-Z0-9:-]+)\s*>)"
    r"|(?P<open><\s*(?P<open_name>[a-zA-Z0-9:-]+)(?P<attrs>[^>]*?)(?P<selfclose>/?)>)"
    r"|(?P<text>[^<]+)",
    re.DOTALL | re.IGNORECASE,
)

_MSO_OPEN_RE = re.compile(r"^<!--\[if\s+[^\]]+\]>", re.IGNORECASE)
_MSO_CLOSE_RE = re.compile(r"^<!\[endif\]-->$", re.IGNORECASE)
_MSO_DOWNLEVEL_RE = re.compile(r"^<!--\[if\s+![^\]]+\]><!-->$|^<!--<!\[endif\]-->$", re.IGNORECASE)


def _is_mso_comment(token: str) -> bool:
    return bool(
        _MSO_OPEN_RE.match(token)
        or _MSO_CLOSE_RE.match(token)
        or _MSO_DOWNLEVEL_RE.match(token)
        or token.lower().startswith("<!--[if")
    )


def beautify(html: str, indent_size: int = 2) -> str:
    """Formatiert HTML mit Einrückung; MSO-Kommentare bleiben intakt."""
    if not html or not isinstance(html, str):
        return ""

    indent_unit = " " * max(0, indent_size)
    lines: list[str] = []
    depth = 0
    raw_stack: list[str] = []
    raw_buffer: list[str] = []
    pending_inline: list[str] = []

    def flush_inline() -> None:
        if pending_inline:
            text = "".join(pending_inline).strip()
            if text:
                lines.append(indent_unit * depth + re.sub(r"\s+", " ", text))
            pending_inline.clear()

    for match in _TOKEN_RE.finditer(html):
        kind = match.lastgroup
        token = match.group(0)

        # Innerhalb von <pre>/<script>/<style>: alles unverändert puffern.
        if raw_stack:
            name = (match.group("close_name") or "").lower()
            if kind == "close" and name == raw_stack[-1]:
                content = "".join(raw_buffer).strip("\n")
                if content:
                    for raw_line in content.split("\n"):
                        lines.append(indent_unit * depth + raw_line.rstrip())
                raw_buffer.clear()
                raw_stack.pop()
                depth = max(0, depth - 1)
                lines.append(indent_unit * depth + token.strip())
            else:
                raw_buffer.append(token)
            continue

        if kind == "text":
            if token.strip():
                pending_inline.append(token)
            continue

        if kind == "doctype":
            flush_inline()
            lines.append(token.strip())
            continue

        if kind == "comment":
            flush_inline()
            stripped = token.strip()
            if _is_mso_comment(stripped):
                lowered = stripped.lower()
                self_contained = "[if" in lowered and "[endif]" in lowered
                if self_contained:
                    # Kompletter Block in einer Zeile — Einrückung bleibt gleich.
                    lines.append(indent_unit * depth + stripped)
                elif _MSO_CLOSE_RE.match(stripped) or lowered.startswith("<!--<!["):
                    depth = max(0, depth - 1)
                    lines.append(indent_unit * depth + stripped)
                else:
                    # Offener Conditional-Block: Inhalt wird eingerückt.
                    lines.append(indent_unit * depth + stripped)
                    depth += 1
            else:
                lines.append(indent_unit * depth + stripped)
            continue

        if kind == "open":
            name = (match.group("open_name") or "").lower()
            self_closing = bool(match.group("selfclose")) or name in VOID_ELEMENTS
            if name in INLINE_ELEMENTS:
                pending_inline.append(token)
                continue
            flush_inline()
            lines.append(indent_unit * depth + token.strip())
            if name in RAW_TEXT_ELEMENTS:
                raw_stack.append(name)
                depth += 1
            elif not self_closing:
                depth += 1
            continue

        if kind == "close":
            name = (match.group("close_name") or "").lower()
            if name in INLINE_ELEMENTS:
                pending_inline.append(token)
                continue
            flush_inline()
            depth = max(0, depth - 1)
            lines.append(indent_unit * depth + token.strip())
            continue

    flush_inline()
    return "\n".join(line for line in lines if line.strip())


def minify(html: str, strip_comments: bool = False) -> str:
    """Minifiziert HTML. MSO-Conditional-Comments bleiben immer erhalten.

    `strip_comments=True` entfernt normale Kommentare — Conditional Comments
    bleiben trotzdem stehen, weil sie in E-Mails Layout-tragend sind und ihr
    Entfernen Outlook-Darstellungen zerstört.
    """
    if not html or not isinstance(html, str):
        return ""

    result = html
    if strip_comments:
        def _keep_mso(m: re.Match[str]) -> str:
            return m.group(0) if _is_mso_comment(m.group(0).strip()) else ""

        result = re.sub(r"<!--.*?-->", _keep_mso, result, flags=re.DOTALL)

    # Rohtext-Blöcke ausklammern, damit deren Inhalt unangetastet bleibt.
    placeholders: list[str] = []

    def _stash(m: re.Match[str]) -> str:
        placeholders.append(m.group(0))
        return f"\x00{len(placeholders) - 1}\x00"

    result = re.sub(
        r"<(pre|textarea|script|style)\b[^>]*>.*?</\1\s*>",
        _stash,
        result,
        flags=re.DOTALL | re.IGNORECASE,
    )

    result = re.sub(r"\s+", " ", result)
    result = re.sub(r">\s+<", "><", result)
    result = result.strip()

    for idx, original in enumerate(placeholders):
        result = result.replace(f"\x00{idx}\x00", original)
    return result


def strip_tags(html: str) -> str:
    """Extrahiert den reinen Text aus HTML (ohne script/style-Inhalte)."""
    if not html:
        return ""
    text = re.sub(
        r"<(script|style)\b[^>]*>.*?</\1\s*>", " ", html, flags=re.DOTALL | re.IGNORECASE
    )
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.DOTALL)
    text = re.sub(r"<br\s*/?>|</p\s*>|</div\s*>|</h[1-6]\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = _unescape(text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    return "\n".join(line.strip() for line in text.split("\n")).strip()


def _unescape(text: str) -> str:
    from html import unescape

    return unescape(text)
