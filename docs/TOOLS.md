# Tool-Katalog

Alle 17 Tools sind eigenständige Seiten unter `src/pages/`, erreichbar über
die Kacheln auf der Startseite (`src/pages/Home.tsx`). "Eigenständig"
bedeutet: jedes Tool funktioniert ohne die anderen — geteilt wird nur, was
bewusst über `useCrossToolStore` läuft (siehe `ARCHITECTURE.md`).

| Route | Datei | Zweck |
|---|---|---|
| `/brizyconverter` | `pages/BrizyConverter.tsx` | Dekompiliert aufgeblähte Brizy-Page-Builder-Exports zu sauberem, semantischem HTML5/CSS (`lib/brizyParser.ts`, `lib/brizyConverter.ts`) |
| `/webextractor` | `pages/WebExtractorStudio.tsx` | Landingpages extrahieren, Bilder zu WebP/PNG konvertieren, Links/Parameter umschreiben, Export als HTML/ZIP/MHTML |
| `/newsletterstudio` | `pages/NewsletterStudio.tsx` | Outlook/MSO-sicherer E-Mail-Builder mit VML-Buttons, CSS-Inliner & Spam-Audit |
| `/lp-optimizely` | `pages/LpOptimizely.tsx` | Erkennt Max-Widths automatisch, konvertiert Bilder zu WebP mit zufälligen IDs, entfernt ungenutztes CSS/JS |
| `/wysiwygstudio` | `pages/WysiwygStudio.tsx` | Split-Screen HTML/CSS Live-Canvas & Monaco-Code-Editor |
| `/htmltools` | `pages/HtmlTools.tsx` | Minify, Format & Analyse von HTML-Code (nutzt `components/legacy/HtmlAnalyzer` etc.) |
| `/imagelabeling` | `pages/ImageLabelingStudio.tsx` | Canva-artiger Editor für Text-/Bild-Labels mit Blending, Opacity, Verdana/Arial-Fonts |
| `/componentstorage` | `pages/ComponentStorage.tsx` | Wiederverwendbare Code-Blöcke speichern & live in der Vorschau anzeigen |
| `/wordimageextractor` | `pages/WordImageExtractor.tsx` | Extrahiert alle Bilder aus Word-`.docx`-Dateien als ZIP |
| `/wordtohtml` | `pages/WordToHtml.tsx` | Konvertiert Word-Dokumente zu sauberem HTML (`mammoth`) |
| `/batch` | `pages/BatchAnalyzer.tsx` | Verarbeitet mehrere HTML-Dateien parallel |
| `/imagetools` | `pages/ImageTools.tsx` | Bilder optimieren, komprimieren, Batch-Verarbeitung |
| `/performancetools` | `pages/PerformanceTools.tsx` | Granulare Performance-Optimierungen |
| `/devtools` | `pages/DevTools.tsx` | Bulk-Encoding/-Decoding, Formatter, Snippets |
| `/shytool` | `pages/ShyTool.tsx` | Intelligente Typografie & Silbentrennungs-Generator (`hyphenation.de`, `hypher`) |
| `/textcompare` | `pages/TextCompare.tsx` | Smarter Side-by-Side-Vergleich für Werte (`react-diff-viewer-continued`) |
| `/cocreator` | `pages/CoCreator.tsx` | "YES KI" — KI-gestützte Generierung & Refactoring, nutzt den Tool-Calling-Harness (`docs/ai-harness.md`) |

Zusätzlich, ohne eigene Kachel auf der Startseite: `pages/OcrTool.tsx`
(Texterkennung via `tesseract.js`), `pages/SvgTool.tsx`, `pages/ColorPalette.tsx`,
`pages/EncodingFixer.tsx`, `pages/SmartLinter.tsx`, `pages/DataTransformer.tsx`,
`pages/HandwritingSimulator.tsx`, `pages/KazBuilder.tsx` — vollständige
Routenliste siehe `src/components/AppRoutes.tsx`.

## Headless-Zugriff

Die meisten reinen Transformationsfunktionen hinter diesen Tools sind auch
ohne UI nutzbar — über die Headless-CLI (`docs/headless-llm.md`,
`npx tsx src/lib/cli.ts`) und über den KI-Tool-Calling-Harness
(`docs/ai-harness.md`, `src/lib/ai/tools.ts`). Beide greifen auf dieselbe
Implementierung in `src/lib/headless.ts` zurück — es gibt nur eine
Quelle der Wahrheit für diese Logik, nicht drei parallele Implementierungen.
