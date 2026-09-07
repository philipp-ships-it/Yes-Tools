# YES Tools — Design System

Ein eigenständiges, framework-unabhängiges Design-System, extrahiert aus dem
Welcome-Popup (`src/components/WelcomePopup.tsx`) und der Startseite
(`src/pages/Home.tsx`) der React-App. Nutzbar in jeder statischen HTML-Seite
oder einem PHP-Projekt — keine Abhängigkeit von React, Tailwind oder Vite.

## Struktur

```
Design/
├── css/
│   ├── tokens.css       Design-Tokens: Farben, Radius, Schatten, Motion, Typo (Light/Dark via CSS-Variablen)
│   ├── base.css         Reset, Scrollbar, Keyframes
│   ├── typography.css   H1–H6, Lead-Text, Eyebrow-Label, Links, Listen, Zitate, Inline-Code
│   ├── components.css   Buttons (inkl. Varianten/Größen/Zustände), Cards, Modal/Popup, Inputs, Checkbox,
│   │                     Tooltip, Badge, Shimmer-/Skeleton-Effekte, App-Chrome
│   └── layout.css       Studio-Shell, klassische Sidebar-Navigation, Panel, Toolbar, Split-View, Stat-Kacheln, Empty-State
├── js/
│   └── design-system.js Vanilla-JS-Verhalten: Modal-Steuerung inkl. "Nicht mehr anzeigen" (localStorage),
│                         Tooltips, Ripple-Effekt, Auto-Resize-Textarea, Sidebar-Collapse, Button-Loading, Theme-Toggle
├── php/
│   ├── components.php   PHP-Render-Funktionen (Buttons, Karten, Checkbox, Sidebar-Item, Stat-Kachel, komplettes Popup)
│   └── example-usage.php Beispielseite, die components.php nutzt
└── index.html            Lebender Styleguide / Demo-Seite aller Komponenten
```

## Einbindung

**Statisches HTML:**
```html
<link rel="stylesheet" href="/Design/css/tokens.css">
<link rel="stylesheet" href="/Design/css/base.css">
<link rel="stylesheet" href="/Design/css/components.css">
...
<script src="/Design/js/design-system.js" defer></script>
```

**PHP:**
```php
require_once __DIR__ . '/Design/php/components.php';
ds_render_head_includes('/Design'); // im <head>
echo ds_render_button('Jetzt loslegen');
echo ds_render_card($iconSvg, 'Titel', 'Beschreibung', '/tool/pfad');
echo ds_render_welcome_modal([...]);
ds_render_scripts('/Design'); // vor </body>
```

Styleguide lokal ansehen: `Design/index.html` direkt im Browser öffnen, oder
für das PHP-Beispiel `php -S localhost:8080` im `Design`-Ordner starten und
`/php/example-usage.php` aufrufen.

## Namenskonvention

Alle CSS-Klassen sind mit `ds-` (Design System) prefixed, um Kollisionen mit
bestehenden Projekt-Styles zu vermeiden — BEM-artig, z. B.
`ds-card`, `ds-card__title`, `ds-card--glow`.

## Theming

Farben liegen als CSS Custom Properties in `tokens.css` und respektieren:
1. `prefers-color-scheme: dark` automatisch,
2. einen expliziten `data-theme="dark"`/`"light"` auf `<html>`, gesetzt via
   `DS.Theme.apply('dark' | 'light')` oder den Toggle-Button (`DS.Theme.toggle()`).

Die App-Chrome-Klassen (`ds-topbar`, `ds-notch-dock`, `ds-notch`) sind bewusst
immer dunkel (schwarz), wie im Original-Header/Sidebar der App.

## Komponenten-Überblick

| Klasse | Herkunft |
|---|---|
| `.ds-modal-overlay` / `.ds-modal` | `WelcomePopup.tsx` — Overlay mit Backdrop-Blur, Bild-Header, Feature-Liste, Footer |
| `.ds-btn--primary` | Schwarz/Weiß-Invert-Button mit Scale-Hover (`hover:scale-105 active:scale-95`) |
| `.ds-card` / `.ds-card--glow` | Tool-Karten-Grid von `Home.tsx`, inkl. CSS-Näherung des `PulsingBorder`-Shader-Hovers |
| `.ds-input` / `.ds-field` | Die "AI Input" Pill-Textarea (`components/ui/ai-input.tsx`) |
| `.ds-checkbox` | Custom-Checkbox ("Nicht mehr anzeigen") aus dem Popup |
| `.ds-tooltip` | Portiert aus `components/ui/Tooltip.tsx` |
| `.ds-topbar`, `.ds-notch-*` | Bezel/Notch-Sidebar-Chrome aus `index.html` |
| `.ds-sidebar` | Klassische, immer sichtbare Sidebar-Navigation mit Collapse (`data-ds-sidebar` + `data-ds-sidebar-toggle`) |
| `.ds-shell` | Studio-App-Shell: Topbar + Sidebar + Hauptbereich als CSS-Grid |
| `.ds-split` | Zweigeteilter Editor (Code | Live-Vorschau), wie in WYSIWYG Studio |
| `.ds-panel`, `.ds-toolbar`, `.ds-stat-tile`, `.ds-empty-state` | Wiederkehrende Layout-Bausteine für Dashboards/Einstellungsseiten |
| `.ds-shimmer-text`, `.ds-skeleton` | Shimmer-/Skeleton-Ladeeffekte (Portierung von `TextShimmer.tsx`) |
| `h1`–`h6`, `.ds-lead`, `.ds-eyebrow` | Typografie-Skala aus Hero-Headline, Modal-Titel & Abschnitts-Labels |

## Best Practices

- CSS-Dateien einzeln laden (Tokens → Base → Components), damit Custom
  Properties vor ihrer Nutzung definiert sind.
- JS ist idempotent: `DS.initAll()` kann nach dynamisch nachgeladenem HTML
  erneut aufgerufen werden, ohne bereits initialisierte Elemente doppelt zu binden.
- PHP-Helper escapen alle Text-Parameter automatisch (`htmlspecialchars`);
  nur explizit als `*Html`/`icon` benannte Parameter werden roh eingefügt (z. B. Inline-SVGs).
