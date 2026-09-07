"""Bild-Werkzeuge: Format-Konvertierung (WebP/PNG/JPEG) und Größenanpassung."""

from __future__ import annotations

from pathlib import Path

from ..project import ProjectContext
from ..registry import tool
from ..schemas import MissingDependency, Param, ToolError, ToolResult

FORMAT_SUFFIX = {"webp": ".webp", "png": ".png", "jpeg": ".jpg", "avif": ".avif"}


def _require_pillow():
    try:
        from PIL import Image  # type: ignore

        return Image
    except ImportError as exc:  # pragma: no cover
        raise MissingDependency("pillow", "docs") from exc


@tool(
    "image_convert",
    title="Bild konvertieren",
    description=(
        "Konvertiert ein Bild in ein anderes Format (WebP, PNG, JPEG) und begrenzt "
        "optional die Breite. Typischer Einsatz: Bilder für Landingpages auf WebP "
        "umstellen und auf Container-Breite herunterrechnen. Benötigt Extra 'docs' (Pillow)."
    ),
    category="image",
    params=[
        Param("path", "string", "Projekt-relativer Pfad zum Quellbild.", required=True),
        Param("format", "string", "Zielformat.", default="webp", enum=["webp", "png", "jpeg"]),
        Param("quality", "integer", "Qualität 1–100 (nur WebP/JPEG).", default=82),
        Param("max_width", "integer", "Maximale Breite in Pixeln (0 = keine Begrenzung).", default=0),
        Param("out_path", "string", "Zielpfad. Standard: output/<name>.<format>"),
    ],
    writes=True,
    requires=["docs"],
)
def image_convert(
    project: ProjectContext,
    path: str,
    format: str = "webp",
    quality: int = 82,
    max_width: int = 0,
    out_path: str | None = None,
) -> ToolResult:
    Image = _require_pillow()

    source = project.resolve(path, must_exist=True)
    try:
        img = Image.open(source)
    except Exception as exc:
        raise ToolError(f"'{project.relative(source)}' konnte nicht gelesen werden: {exc}") from exc

    with img:
        original_size = img.size
        img = img.copy()

        if max_width and img.width > max_width:
            ratio = max_width / img.width
            img = img.resize((max_width, max(1, round(img.height * ratio))), Image.LANCZOS)

        # JPEG kann keinen Alphakanal — sonst bricht das Speichern ab.
        if format == "jpeg" and img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            converted = img.convert("RGBA")
            background.paste(converted, mask=converted.split()[-1])
            img = background

        target = project.resolve(
            out_path or f"output/{Path(source).stem}{FORMAT_SUFFIX[format]}"
        )
        target.parent.mkdir(parents=True, exist_ok=True)

        save_kwargs: dict[str, object] = {}
        if format in ("webp", "jpeg"):
            save_kwargs["quality"] = max(1, min(100, quality))
        if format == "webp":
            save_kwargs["method"] = 4
        img.save(target, format=format.upper(), **save_kwargs)
        new_size = img.size

    before = source.stat().st_size
    after = target.stat().st_size
    return ToolResult.success(
        summary=(
            f"{project.relative(source)} → {project.relative(target)}: "
            f"{original_size[0]}×{original_size[1]} → {new_size[0]}×{new_size[1]}, "
            f"{before / 1024:.1f} KB → {after / 1024:.1f} KB "
            f"({1 - after / max(1, before):.0%} kleiner)."
        ),
        data={
            "output": project.relative(target),
            "format": format,
            "size_before": list(original_size),
            "size_after": list(new_size),
            "bytes_before": before,
            "bytes_after": after,
        },
        artifacts=[project.relative(target)],
    )


@tool(
    "image_info",
    title="Bildinformationen lesen",
    description=(
        "Liest Format, Abmessungen, Farbmodus und Dateigröße eines Bildes — "
        "ohne es zu verändern. Benötigt Extra 'docs' (Pillow)."
    ),
    category="image",
    params=[Param("path", "string", "Projekt-relativer Pfad zum Bild.", required=True)],
    requires=["docs"],
)
def image_info(project: ProjectContext, path: str) -> ToolResult:
    Image = _require_pillow()
    source = project.resolve(path, must_exist=True)
    try:
        with Image.open(source) as img:
            info = {
                "path": project.relative(source),
                "format": img.format,
                "width": img.width,
                "height": img.height,
                "mode": img.mode,
                "bytes": source.stat().st_size,
            }
    except Exception as exc:
        raise ToolError(f"'{project.relative(source)}' konnte nicht gelesen werden: {exc}") from exc

    return ToolResult.success(
        summary=(
            f"{info['path']}: {info['format']}, {info['width']}×{info['height']}, "
            f"{info['mode']}, {info['bytes'] / 1024:.1f} KB."
        ),
        data=info,
    )
