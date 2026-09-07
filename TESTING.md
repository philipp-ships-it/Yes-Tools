# Teststrategie & QA-Konventionen

Dieses Projekt nutzt **Vitest** (kompatibel mit der bestehenden Vite-Toolchain,
kein separater Test-Runner nötig) + **React Testing Library** für Komponenten
und Hooks.

## Ausführen

```bash
npm test              # einmaliger Lauf (CI-Modus)
npm run test:watch    # interaktiver Watch-Modus während der Entwicklung
npm run test:coverage # Coverage-Report unter ./coverage
```

## Wo Tests liegen

Tests liegen **co-located** neben dem Code, den sie testen (`foo.ts` →
`foo.test.ts`), nicht in einem separaten `__tests__`-Baum. Das hält Tests beim
Verschieben/Löschen von Code sichtbar und verhindert verwaiste Testdateien.

```
src/utils/msoFormatter.ts
src/utils/msoFormatter.test.ts   ← Vorlage: reine Funktion
src/hooks/useLocalStorage.ts
src/hooks/useLocalStorage.test.ts ← Vorlage: Hook mit Browser-API
src/store/crossToolStore.ts
src/store/crossToolStore.test.ts ← Vorlage: zustand-Store
src/components/ui/Tooltip.tsx
src/components/ui/Tooltip.test.tsx ← Vorlage: Komponente + Interaktion
```

Diese vier Dateien sind als **Vorlagen** gedacht — beim Schreiben neuer Tests
die strukturell ähnlichste Vorlage kopieren, nicht bei null anfangen.

## Testpyramide für dieses Projekt

| Ebene | Werkzeug | Umfang | Beispiel |
|---|---|---|---|
| Unit (Logik) | Vitest | reine Funktionen in `src/lib/`, `src/utils/` | `formatMsoHtml`, `htmlEncoder.processText` |
| Unit (State) | Vitest | Hooks (`renderHook`) und zustand-Stores | `useLocalStorage`, `useCrossToolStore` |
| Komponente | Vitest + RTL | einzelne UI-Komponenten, isoliert gerendert | `Tooltip`, `AIInput` |
| Integration (optional, später) | Vitest + RTL | Seiten mit mehreren zusammenspielenden Komponenten | `HtmlTools`-Seite End-to-End im DOM |
| E2E (nicht Teil dieses Setups) | z. B. Playwright | echter Browser, echte Navigation | bewusst außerhalb dieses Scopes |

Fokus liegt bewusst auf den ersten drei Ebenen: Die Tools in diesem Projekt
sind größtenteils deterministische Text-/Datei-Transformationen — die
Kernlogik lässt sich ohne Browser exzellent als reine Funktion testen.

## Konventionen

- **AAA-Struktur**: Arrange (Vorbereitung) → Act (Aufruf) → Assert (Prüfung),
  durch Leerzeilen im Test sichtbar getrennt.
- **`describe`** gruppiert nach *Verhalten* der zu testenden Einheit
  (`formatMsoHtml`), nicht nach internen Methodennamen.
- **Testnamen auf Deutsch, im Aussagesatz**: `'formatiert MSO-Kommentare
  korrekt'` statt `'test1'` oder `'should format'` — der Testname ist die
  Spezifikation.
- **Kein Test ohne Assertion.** Ein Test, der nur prüft "wirft keinen
  Fehler", ist nur dann sinnvoll, wenn das explizit das zu testende
  Verhalten ist (siehe Fehlerfall-Tests in den Vorlagen).
- **State-Isolation:** globaler State (zustand-Stores, `localStorage`) wird
  in `beforeEach` zurückgesetzt. Tests dürfen niemals von der
  Ausführungsreihenfolge anderer Tests abhängen.
- **Keine echten Netzwerkaufrufe.** `openrouterService.ts` und ähnliche
  API-Clients werden mit `vi.mock(...)` bzw. `vi.spyOn(global, 'fetch')`
  ersetzt — niemals gegen die echte OpenRouter-API testen.
- **Reine Funktionen bevorzugt testen, nicht die Widgets drumherum.** Wo
  Logik aus einer Komponente in eine `src/lib/`- oder `src/utils/`-Funktion
  extrahierbar ist, gehört sie dorthin — sie ist dort trivial zu testen.

## Was (noch) nicht getestet wird

- `src/lib/cli.ts` (Headless-CLI): manuell/durch `docs/headless-llm.md`
  dokumentiertes Verhalten, kein automatisierter Test-Harness in diesem Schritt.
- Visuelle Regression (Pixel-Vergleich von Canvas/Shader-Komponenten wie
  `PulsingBorder`, `dithering-shader.tsx`): bewusst außerhalb des Scopes.
- Die 17 Tool-Seiten unter `src/pages/*` haben aktuell keine
  Komponenten-Tests — die vier Vorlagen in diesem Dokument sind der
  empfohlene Ausgangspunkt, um das schrittweise nachzuziehen (pro Tool:
  mindestens die exportierte reine Kernfunktion aus `src/lib/`/`src/utils/`
  testen, bevor die Seite selbst getestet wird).

## Neue Abhängigkeiten (in `package.json` ergänzt)

`vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`,
`@testing-library/jest-dom`, `@testing-library/user-event`, sowie
`@types/react` / `@types/react-dom` (fehlten bisher trotz React-Nutzung).

Vor dem ersten Testlauf: `npm install`.
