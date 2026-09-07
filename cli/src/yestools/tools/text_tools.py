"""Text-Werkzeuge: Encoding-Reparatur, Diff, Silbentrennung."""

from __future__ import annotations

import difflib

from ..project import ProjectContext
from ..registry import tool
from ..schemas import MissingDependency, Param, ToolResult

#: Häufige Mojibake-Paare (UTF-8 als Latin-1 gelesen). Identisch zur Tabelle in
#: `src/lib/headless.ts` (EncodingTools.fixMojibake) der Web-App, damit CLI und
#: App dieselben Ergebnisse liefern.
MOJIBAKE_MAP: dict[str, str] = {
    "Ã¼": "ü", "Ã¤": "ä", "Ã¶": "ö", "ÃŸ": "ß",
    "Ã„": "Ä", "Ã–": "Ö", "Ãœ": "Ü",
    "Ã©": "é", "Ã¨": "è", "Ãª": "ê", "Ã¡": "á", "Ã¢": "â", "Ã±": "ñ",
    "â‚¬": "€", "â„¢": "™", "â€œ": "“", "â€\x9d": "”",
    "â€˜": "‘", "â€™": "’", "â€“": "–", "â€”": "—", "â€¦": "…",
    "Â ": " ", "Â«": "«", "Â»": "»", "Â°": "°",
}


@tool(
    "fix_text_encoding",
    title="Zeichenkodierung reparieren",
    description=(
        "Repariert kaputte Zeichenkodierung (Mojibake) in Text, z. B. 'Ã¼' → 'ü'. "
        "Typisch nach falscher UTF-8/Latin-1-Konvertierung aus Word-Dokumenten, "
        "CSV-Exporten oder älteren CMS."
    ),
    category="text",
    params=[
        Param("text", "string", "Text mit vermuteter kaputter Kodierung."),
        Param("path", "string", "Alternativ: projekt-relativer Pfad zu einer Textdatei."),
        Param("out_path", "string", "Optional: Zielpfad für den reparierten Text."),
    ],
    writes=True,
    writes_when="out_path",
)
def fix_text_encoding(
    project: ProjectContext,
    text: str | None = None,
    path: str | None = None,
    out_path: str | None = None,
) -> ToolResult:
    if text and path:
        raise ValueError("Bitte entweder 'text' oder 'path' angeben, nicht beides.")
    if path:
        target = project.resolve(path, must_exist=True)
        source = target.read_text(encoding="utf-8", errors="replace")
        origin = project.relative(target)
    elif text is not None:
        source, origin = text, "<inline>"
    else:
        raise ValueError("Es muss 'text' oder 'path' angegeben werden.")

    # Erst der saubere Weg: als Latin-1 kodieren und wieder als UTF-8 lesen.
    # Klappt das nicht verlustfrei, greift die Ersetzungstabelle.
    fixed = source
    try:
        roundtrip = source.encode("latin-1").decode("utf-8")
        if roundtrip != source:
            fixed = roundtrip
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass

    if fixed == source:
        for bad, good in MOJIBAKE_MAP.items():
            fixed = fixed.replace(bad, good)

    replacements = sum(1 for a, b in zip(source, fixed) if a != b) + abs(len(source) - len(fixed))
    artifacts: list[str] = []
    if out_path:
        dest = project.resolve(out_path)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(fixed, encoding="utf-8")
        artifacts.append(project.relative(dest))

    changed = fixed != source
    return ToolResult.success(
        summary=(
            f"{origin}: Kodierung repariert ({replacements} Zeichen geändert)."
            if changed
            else f"{origin}: keine Kodierungsfehler erkannt — Text unverändert."
        ),
        data={"text": fixed, "changed": changed},
        artifacts=artifacts,
    )


@tool(
    "text_diff",
    title="Texte vergleichen",
    description=(
        "Vergleicht zwei Textversionen zeilenweise und liefert ein Unified-Diff "
        "zurück. Nutze dies, um präzise zu belegen, was sich zwischen zwei "
        "Fassungen geändert hat, statt es zu behaupten."
    ),
    category="text",
    params=[
        Param("original", "string", "Ursprünglicher Text."),
        Param("updated", "string", "Neuer Text."),
        Param("original_path", "string", "Alternativ: Pfad zur ursprünglichen Datei."),
        Param("updated_path", "string", "Alternativ: Pfad zur neuen Datei."),
        Param("context_lines", "integer", "Kontextzeilen um jede Änderung.", default=3),
    ],
)
def text_diff(
    project: ProjectContext,
    original: str | None = None,
    updated: str | None = None,
    original_path: str | None = None,
    updated_path: str | None = None,
    context_lines: int = 3,
) -> ToolResult:
    def _read(inline: str | None, path: str | None, label: str) -> tuple[str, str]:
        if path:
            target = project.resolve(path, must_exist=True)
            return target.read_text(encoding="utf-8", errors="replace"), project.relative(target)
        if inline is None:
            raise ValueError(f"Für '{label}' muss Text oder ein Pfad angegeben werden.")
        return inline, label

    left, left_name = _read(original, original_path, "original")
    right, right_name = _read(updated, updated_path, "updated")

    diff_lines = list(
        difflib.unified_diff(
            left.splitlines(),
            right.splitlines(),
            fromfile=left_name,
            tofile=right_name,
            lineterm="",
            n=max(0, context_lines),
        )
    )
    added = sum(1 for line in diff_lines if line.startswith("+") and not line.startswith("+++"))
    removed = sum(1 for line in diff_lines if line.startswith("-") and not line.startswith("---"))
    ratio = difflib.SequenceMatcher(None, left, right).ratio()

    return ToolResult.success(
        summary=(
            f"{left_name} ↔ {right_name}: +{added}/-{removed} Zeilen, "
            f"{ratio:.1%} Ähnlichkeit."
            if diff_lines
            else f"{left_name} und {right_name} sind identisch."
        ),
        data={
            "unified_diff": "\n".join(diff_lines),
            "lines_added": added,
            "lines_removed": removed,
            "similarity": round(ratio, 4),
        },
    )


@tool(
    "text_hyphenate",
    title="Silbentrennung einfügen",
    description=(
        "Fügt weiche Trennstellen (&shy; bzw. U+00AD) in Text ein — für saubere "
        "Umbrüche in engen Layouts, Newslettern und Landingpages. Standardsprache "
        "ist Deutsch. Benötigt das Extra 'docs' (pyphen)."
    ),
    category="text",
    params=[
        Param("text", "string", "Zu trennender Text.", required=True),
        Param("language", "string", "Sprachcode für das Trennmuster.", default="de_DE"),
        Param(
            "output",
            "string",
            "Ausgabeform der Trennstelle.",
            default="entity",
            enum=["entity", "unicode"],
        ),
        Param("min_length", "integer", "Wörter kürzer als dieser Wert bleiben unverändert.", default=6),
    ],
    requires=["docs"],
)
def text_hyphenate(
    project: ProjectContext,
    text: str,
    language: str = "de_DE",
    output: str = "entity",
    min_length: int = 6,
) -> ToolResult:
    try:
        import pyphen  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise MissingDependency("pyphen", "docs") from exc

    try:
        dic = pyphen.Pyphen(lang=language)
    except Exception as exc:
        raise ValueError(
            f"Kein Trennmuster für Sprache '{language}' verfügbar: {exc}"
        ) from exc

    marker = "&shy;" if output == "entity" else "­"

    import re

    def _hyphenate_word(match: "re.Match[str]") -> str:
        word = match.group(0)
        if len(word) < min_length:
            return word
        return dic.inserted(word, hyphen=marker)

    result = re.sub(r"[^\W\d_]+", _hyphenate_word, text, flags=re.UNICODE)
    inserted = result.count(marker)
    return ToolResult.success(
        summary=f"{inserted} Trennstellen eingefügt ({language}).",
        data={"text": result, "hyphens_inserted": inserted, "language": language},
    )
