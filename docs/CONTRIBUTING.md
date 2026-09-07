# Beitragen / Entwicklungs-Guide

## Setup

```bash
npm install
cp .env.example .env.local   # VITE_OPENROUTER_API_KEY eintragen
npm run dev                  # http://localhost:3000
```

## Vor jedem Commit

```bash
npm run lint    # tsc --noEmit — Typfehler
npm test        # vitest run — Unit-Tests
```

## Code-Stil

- **TypeScript verpflichtend** für neuen Code (`allowJs` existiert nur für
  Altbestand wie `src/lib/cli.ts`-Helfer — kein neuer `.js`-Code in `src/`).
- **Funktionale Komponenten + Hooks**, keine Klassen-Komponenten (Ausnahme:
  `ErrorBoundary`, wo React Klassen zwingend vorschreibt).
- **Reine Logik gehört nach `src/lib/` oder `src/utils/`**, nicht in
  Komponenten — das macht sie ohne Rendering testbar (siehe `TESTING.md`).
- **Neue geteilte Konventionen**: prüfen, ob `useCrossToolStore` bereits
  eine passende Struktur bietet, bevor ein neuer globaler Store angelegt
  wird — die bewusste Beschränkung auf einen Cross-Tool-Store hält den
  globalen State überschaubar (siehe `ARCHITECTURE.md`).
- **Deutsch für nutzerseitigen Text**, Englisch für Code/Kommentare ist
  in diesem Projekt gemischt anzutreffen (historisch gewachsen) — neue
  Kommentare, die Architekturentscheidungen erklären, auf Deutsch (wie in
  dieser Dokumentation), reiner Code-Kommentar-Stil nach Kontext der
  jeweiligen Datei.

## Commits

- Ein Commit, ein zusammenhängendes Anliegen (kein "diverse Fixes").
- Commit-Nachricht beschreibt das **Warum**, nicht nur das Was.
- Kein `--force`-Push auf `main`.

## Neue Tools / Seiten hinzufügen

1. Neue Datei unter `src/pages/DeinTool.tsx`.
2. Route in `src/components/AppRoutes.tsx` ergänzen.
3. Kachel in `src/pages/Home.tsx` (`tools`-Array) ergänzen, falls das Tool
   von der Startseite aus erreichbar sein soll.
4. Eintrag in `docs/TOOLS.md` ergänzen.
5. Reine Kernlogik (falls vorhanden) nach `src/lib/` oder `src/utils/`
   auslagern + Unit-Test dafür schreiben (siehe `TESTING.md`).

## Neue KI-Tools hinzufügen

Siehe `docs/ai-harness.md`, Abschnitt 7 ("Ein neues Tool hinzufügen").

## Bekannte Lücken (bewusst, nicht vergessen)

- **Kein ESLint/Prettier konfiguriert.** `npm run lint` prüft aktuell nur
  Typen (`tsc --noEmit`), keine Stilregeln. Nachrüsten ist sinnvoll, war
  aber nicht Teil dieses Refactors, um den Diff nicht mit
  Formatierungs-Änderungen an 40+ Dateien zu überladen.
- **Kein CI-Workflow** (z. B. GitHub Actions) für `lint`/`test` bei Pull
  Requests — Testing-Infrastruktur ist jetzt vorhanden (siehe
  `TESTING.md`), die CI-Verdrahtung ist ein guter nächster Schritt.
- **Tailwind läuft über CDN, nicht als PostCSS-Build** — siehe
  `ARCHITECTURE.md` für die Begründung und die empfohlene Migration.

## Sicherheit

- **Niemals echte API-Keys/Secrets committen** — auch nicht in
  Deploy-Configs wie `service.yaml`. Secrets gehören in Secret Manager /
  CI-Secret-Store und werden zur Laufzeit injiziert (siehe Kommentar in
  `service.yaml`).
- `.env`, `.env.local` sind in `.gitignore` — niemals mit `git add -f`
  umgehen.
