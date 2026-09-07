<?php
/**
 * Minimal example: a PHP page using the Design system components.
 * Run with e.g. `php -S localhost:8080` from the Design/ folder and open
 * /php/example-usage.php, or copy the pattern into your own templates.
 */
require_once __DIR__ . '/components.php';

$icon = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>YES Tools — Design System (PHP Beispiel)</title>
  <?php ds_render_head_includes('..'); ?>
</head>
<body>
  <main style="max-width:960px;margin:0 auto;padding:3rem 1.5rem;display:flex;flex-direction:column;gap:2rem;">
    <h1>Design System — PHP Beispiel</h1>

    <section style="display:flex;gap:1rem;flex-wrap:wrap;">
      <?= ds_render_button('Primary Button') ?>
      <?= ds_render_button('Ghost Button', null, 'ghost') ?>
      <?= ds_render_button('Als Link', '#') ?>
    </section>

    <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem;">
      <?= ds_render_card($icon, 'Beispiel-Tool', 'Kurzbeschreibung des Tools, wie auf der Startseite.', '#') ?>
      <?= ds_render_card($icon, 'Zweites Tool', 'Noch eine Karte im gleichen Stil.', '#') ?>
    </section>

    <section>
      <button data-ds-modal-trigger="#ds-welcome-modal" class="ds-btn ds-btn--primary" type="button">Popup öffnen</button>
    </section>
  </main>

  <?php
  echo ds_render_welcome_modal([
      'image'    => 'https://firebasestorage.googleapis.com/v0/b/studio-9373604763-307d1.firebasestorage.app/o/xlpm.de%2Fyes-tools.webp?alt=media&token=9127c698-4b77-4432-b763-4783215af91a',
      'title'    => 'Willkommen bei 2.0',
      'subtitle' => 'Eine neue Ära der Produktivität. Intelligenter, schneller und tiefer integriert.',
      'features' => [
          ['icon' => $icon, 'title' => 'Native KI-Integration', 'desc' => 'Die YES KI ist tief in alle Tools integriert.'],
          ['icon' => $icon, 'title' => 'Headless Architektur',  'desc' => 'UI strikt von der Logik getrennt.'],
          ['icon' => $icon, 'title' => 'Shy Tool & Shortcuts',   'desc' => 'Smarte Typografie & globale Shortcuts.'],
      ],
  ]);
  ?>

  <?php ds_render_scripts('..'); ?>
</body>
</html>
