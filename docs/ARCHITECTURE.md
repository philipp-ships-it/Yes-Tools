# Architektur

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Build-Tool | Vite 6 |
| UI-Framework | React 18 + React Router 7 |
| Sprache | TypeScript (strict-ish, `isolatedModules`) |
| Styling | Tailwind CSS (CDN-Build, siehe unten) + handgeschriebenes CSS für App-Chrome |
| Animation | `motion` (Framer Motion Nachfolgeprojekt) |
| State | Lokaler React-State + `zustand` (`crossToolStore`) + `localStorage` |
| KI-Provider | OpenRouter (modellagnostisch: Claude, GPT-4o, Gemini, DeepSeek, Llama, …) |
| Testing | Vitest + React Testing Library (siehe `TESTING.md`) |
| Deployment | Google Cloud Run (`service.yaml`) |

**Warum Tailwind per CDN statt PostCSS-Build?** Das Projekt wurde
ursprünglich aus einem Google-AI-Studio-Scaffold heraus entwickelt (siehe
Hinweise in `index.html`, `service.yaml`). Die Tailwind-Konfiguration
(Farben, Keyframes) lebt im `<script>`-Block von `index.html`. Das ist für
ein wachsendes Projekt nicht ideal (kein Purging, kein IntelliSense in
manchen Editoren) — eine Migration auf einen regulären PostCSS/Tailwind-Build
ist ein sinnvoller nächster Schritt, aber bewusst außerhalb des Scopes
dieses Refactors, um das Risiko eines produktiven Frontend-Breaks gering zu
halten.

## Zwei Einstiegspunkte, eine App

`index.html` (Vite-Standardeinstieg) lädt `index.tsx`, das wiederum
`src/App.tsx` rendert — das ist die eigentliche Anwendung. Historisch gab es
zusätzlich einen flachen `components/`- und `utils/`-Ordner auf Root-Ebene
(Reste eines früheren Einzeltool-Scaffolds); diese wurden im Zuge des
Refactors nach `src/components/legacy/` bzw. `src/utils/` verschoben, um
eine einzige Quelle der Wahrheit (`src/`) zu haben. Sie sind weiterhin aktiv
genutzt (von `HtmlTools`, `WordToHtml`, `BatchAnalyzer` — siehe `TOOLS.md`),
"legacy" beschreibt hier ihren Ursprung, nicht dass sie unbenutzt wären.

## Projektstruktur

```
index.tsx                 Einstiegspunkt (rendert src/App.tsx)
src/
  App.tsx                 Root-Komponente: Routing, App-Chrome (Topbar/Notch-Sidebar), globaler State
  components/
    AppRoutes.tsx         React-Router Routendefinitionen
    legacy/                HtmlAnalyzer/LivePreviewCard/SettingsPanel/TextAreaCard (aus dem Root verschoben)
    ui/                    Wiederverwendbare UI-Primitives (AIInput, Tooltip, Textarea, ToolCallBubble, …)
    EmbeddedAiSidebar.tsx  Die "YES KI" Chat-Sidebar (nutzt den KI-Harness, siehe ai-harness.md)
    GlobalSettings.tsx     Einstellungen (OpenRouter-Key, Budget-Limits, Modellwahl)
  pages/                   Die 17 eigenständigen Tools (siehe TOOLS.md), je ein Top-Level-Screen
  lib/
    ai/                     KI-Tool-Calling-Harness (siehe docs/ai-harness.md)
    headless.ts             Reine, wiederverwendbare Tool-Logik (auch von der Headless-CLI genutzt)
    cli.ts                   Headless-CLI-Einstiegspunkt (siehe docs/headless-llm.md)
    brizyParser.ts / brizyConverter.ts   Brizy-Page-Builder-Decompiler-Logik
  hooks/                   useLocalStorage, useSystemStatus, useToolTracking, useInvasiveSafeguard
  store/                   zustand-Stores (crossToolStore: Snippets/Templates/aktiver Tool-Kontext; appStore)
  services/                openrouterService.ts (einziger LLM-API-Client)
  utils/                   htmlEncoder, msoFormatter, headlessTools, aiTools
  test/                     Vitest-Setup (setup.ts)
docs/                       Diese Dokumentation
Design/                     Eigenständiges CSS/JS/PHP Design-System (siehe Design/README.md)
```

## Routing & Tool-Isolation

Jedes Tool unter `src/pages/*.tsx` ist als **eigenständige Seite** über
`react-router-dom` erreichbar (`src/components/AppRoutes.tsx`) und importiert
seine Abhängigkeiten selbst — es gibt bewusst keinen "God State", der alle
Tools verbindet. Der einzige geteilte Zustand läuft explizit über
`useCrossToolStore` (Snippets, Templates, Metadaten-Tags, aktiver
Tool-Kontext für die KI-Sidebar) — alles andere ist Tool-lokaler State.

## State-Management im Detail

- **`useLocalStorage`** (`src/hooks/useLocalStorage.ts`): generischer Hook
  für persistenten, Tool-lokalen State (z. B. "zuletzt verwendete Tools",
  Chat-Sessions, Einstellungen). Kein globaler Store — jede Komponente hält
  ihren eigenen Key.
- **`useCrossToolStore`** (`src/store/crossToolStore.ts`, zustand +
  `persist`-Middleware): der EINZIGE Store, der bewusst tool-übergreifend
  geteilt wird — Snippets/Templates, die man aus einem Tool heraus speichert
  und in einem anderen wiederverwendet, sowie der "aktive Tool-Kontext" für
  die KI-Sidebar (siehe unten).
- **`appStore.ts`**: schlanker Store für reinen App-Chrome-State
  (Sidebar-Zustand, o. ä.).

## Die KI-Integration (Kurzfassung)

Für die volle Architektur siehe **`docs/ai-harness.md`**. Kurzfassung: jedes
Tool kann über `setActiveToolContext` im `crossToolStore` seinen aktuellen
Code "sichtbar" für die KI-Sidebar machen. Die Sidebar (`EmbeddedAiSidebar`)
baut daraus einen System-Prompt (`src/lib/ai/systemPrompt.ts`) und startet
einen Tool-Calling-Agent-Loop (`src/lib/ai/agent.ts`) gegen OpenRouter
(`src/services/openrouterService.ts`). Die KI kann darüber gezielt
Werkzeuge aus `src/lib/headless.ts` aufrufen und — mit Einschränkungen,
siehe Sicherheitsmodell in `ai-harness.md` — Code direkt in das aktive Tool
zurückschreiben.

## Build & Deployment

- **Lokal**: `npm install` → `npm run dev` (Vite Dev-Server, Port 3000).
- **Produktion**: `npm run build` → statischer Build, ausgeliefert über die
  in `service.yaml` definierte Cloud-Run-Konfiguration (zwei Container:
  `nginx-container` für statische Assets, `app-container` für
  Node/Server-seitige Anteile). **Secrets werden zur Laufzeit über Secret
  Manager injiziert, nie im Repo committed** (siehe Sicherheitshinweis in
  `service.yaml` und `.env.example`).
- **Type-Check**: `npm run lint` (`tsc --noEmit`) — kein ESLint in diesem
  Projekt konfiguriert; das ist eine bewusste Lücke, siehe
  `CONTRIBUTING.md`, Abschnitt "Bekannte Lücken".
