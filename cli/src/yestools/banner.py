"""ASCII-Banner für Terminal und TUI.

Zwei Varianten: ein großes Block-Logo (ANSI-Shadow-Stil) für breite Terminals
und ein kompaktes für alles unter 78 Spalten. `render_banner()` wählt
automatisch die passende Variante, damit das Logo nie umbricht — ein
umgebrochenes ASCII-Logo sieht schlimmer aus als gar keins.
"""

from __future__ import annotations

import shutil

BANNER_WIDE = r"""
██╗   ██╗███████╗███████╗    ████████╗ ██████╗  ██████╗ ██╗     ███████╗
╚██╗ ██╔╝██╔════╝██╔════╝    ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝
 ╚████╔╝ █████╗  ███████╗       ██║   ██║   ██║██║   ██║██║     ███████╗
  ╚██╔╝  ██╔══╝  ╚════██║       ██║   ██║   ██║██║     ██║     ╚════██║
   ██║   ███████╗███████║       ██║   ╚██████╔╝╚██████╔╝███████╗███████║
   ╚═╝   ╚══════╝╚══════╝       ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
""".strip("\n")

BANNER_COMPACT = r"""
╻ ╻┏━╸┏━┓   ╺┳╸┏━┓┏━┓╻  ┏━┓
┗┳┛┣╸ ┗━┓    ┃ ┃ ┃┃ ┃┃  ┗━┓
 ╹ ┗━╸┗━┛    ╹ ┗━┛┗━┛┗━╸┗━┛
""".strip("\n")

TAGLINE = "Dokument-, HTML- & Bild-Werkzeuge für Menschen und KI-Agenten"

#: Farbverlauf pro Zeile — greift die Akzentfarben des Web-Design-Systems auf
#: (accent-blue → accent-purple), damit CLI und Web erkennbar zusammengehören.
GRADIENT = ["#3390EC", "#4a7fe8", "#6a6ee4", "#8a5de0", "#a855f7", "#a855f7"]


def banner_lines(width: int | None = None) -> list[str]:
    """Gibt die Banner-Zeilen zurück, passend zur Terminalbreite."""
    if width is None:
        width = shutil.get_terminal_size(fallback=(80, 24)).columns
    art = BANNER_WIDE if width >= 78 else BANNER_COMPACT
    return art.split("\n")


def render_banner(width: int | None = None, tagline: bool = True) -> str:
    """Banner als Rich-Markup-String (mit Farbverlauf pro Zeile)."""
    lines = banner_lines(width)
    out = []
    for idx, line in enumerate(lines):
        color = GRADIENT[min(idx, len(GRADIENT) - 1)]
        out.append(f"[bold {color}]{line}[/]")
    if tagline:
        out.append(f"[dim]{TAGLINE}[/]")
    return "\n".join(out)


def plain_banner(width: int | None = None) -> str:
    """Banner ohne Markup — für Logs, `--no-color` und Nicht-TTY-Ausgaben."""
    return "\n".join(banner_lines(width))
