<?php
/**
 * YES Tools — Design System (PHP render helpers)
 *
 * Server-side renderers that emit the same markup/classes as the CSS in
 * ../css/components.css. Framework-agnostic (no WordPress/Laravel
 * dependency) — safe to `require` from any PHP page or template.
 *
 * All output is escaped; pass plain strings, not pre-built HTML, unless a
 * parameter is explicitly documented as "$*_html" (already-safe markup,
 * e.g. an inline SVG icon).
 */

if (!defined('DS_COMPONENTS_LOADED')) {
    define('DS_COMPONENTS_LOADED', true);

    /**
     * Resolve an asset path relative to the Design/ folder for use in a
     * <link>/<script> tag. Pass the site-relative base where Design/ lives.
     */
    function ds_asset(string $relativePath, string $base = '/Design'): string
    {
        return rtrim($base, '/') . '/' . ltrim($relativePath, '/');
    }

    /** Emits the <link>/<script> tags needed to load the design system. */
    function ds_render_head_includes(string $base = '/Design'): void
    {
        $css = [
            ds_asset('css/tokens.css', $base),
            ds_asset('css/base.css', $base),
            ds_asset('css/components.css', $base),
        ];
        foreach ($css as $href) {
            echo '<link rel="stylesheet" href="' . htmlspecialchars($href, ENT_QUOTES) . '">' . "\n";
        }
    }

    /** Emits the <script> tag for the design system JS. Place before </body>. */
    function ds_render_scripts(string $base = '/Design'): void
    {
        echo '<script src="' . htmlspecialchars(ds_asset('js/design-system.js', $base), ENT_QUOTES) . '" defer></script>' . "\n";
    }

    /**
     * Renders a button.
     *
     * @param string      $label   Visible text.
     * @param string|null $href    If set, renders an <a>; otherwise a <button>.
     * @param string      $variant 'primary' | 'ghost'
     * @param array       $attrs   Extra key => value HTML attributes.
     */
    function ds_render_button(string $label, ?string $href = null, string $variant = 'primary', array $attrs = []): string
    {
        $class = 'ds-btn ds-btn--' . preg_replace('/[^a-z]/', '', $variant);
        if (!empty($attrs['class'])) {
            $class .= ' ' . $attrs['class'];
            unset($attrs['class']);
        }
        $attrString = '';
        foreach ($attrs as $key => $value) {
            $attrString .= ' ' . htmlspecialchars($key, ENT_QUOTES) . '="' . htmlspecialchars((string) $value, ENT_QUOTES) . '"';
        }

        $tag = $href !== null ? 'a' : 'button';
        $hrefAttr = $href !== null ? ' href="' . htmlspecialchars($href, ENT_QUOTES) . '"' : ' type="button"';

        return sprintf(
            '<%1$s class="%2$s"%3$s data-ds-ripple%4$s>%5$s</%1$s>',
            $tag,
            htmlspecialchars($class, ENT_QUOTES),
            $hrefAttr,
            $attrString,
            htmlspecialchars($label, ENT_QUOTES)
        );
    }

    /**
     * Renders one tool/feature card (as seen on the Home grid).
     *
     * @param string $iconSvgHtml Already-safe inline <svg>…</svg> markup.
     */
    function ds_render_card(string $iconSvgHtml, string $title, string $description, string $href = '#', bool $glow = true): string
    {
        $glowClass = $glow ? ' ds-card--glow' : '';
        return sprintf(
            '<a class="ds-card%1$s" href="%2$s">
    <div class="ds-card__header">
        <span class="ds-icon-chip">%3$s</span>
        <span class="ds-card__arrow" aria-hidden="true">&rarr;</span>
    </div>
    <div>
        <h3 class="ds-card__title">%4$s</h3>
        <p class="ds-card__desc">%5$s</p>
    </div>
</a>',
            $glowClass,
            htmlspecialchars($href, ENT_QUOTES),
            $iconSvgHtml,
            htmlspecialchars($title, ENT_QUOTES),
            htmlspecialchars($description, ENT_QUOTES)
        );
    }

    /** Renders a labelled custom checkbox (used for "don't show again"). */
    function ds_render_checkbox(string $id, string $label, bool $checked = false): string
    {
        return sprintf(
            '<label class="ds-checkbox" for="%1$s">
    <input type="checkbox" id="%1$s" name="%1$s" data-ds-remember%2$s>
    <span class="ds-checkbox__box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span>
    <span class="ds-checkbox__label">%3$s</span>
</label>',
            htmlspecialchars($id, ENT_QUOTES),
            $checked ? ' checked' : '',
            htmlspecialchars($label, ENT_QUOTES)
        );
    }

    /** Renders a small pill badge. */
    function ds_render_badge(string $label): string
    {
        return '<span class="ds-badge">' . htmlspecialchars($label, ENT_QUOTES) . '</span>';
    }

    /**
     * Renders the full "welcome" popup/modal (ports WelcomePopup.tsx).
     *
     * @param array $opts {
     *   @var string $id           Overlay element id. Default 'ds-welcome-modal'.
     *   @var string $image        Header image URL.
     *   @var string $title        Headline.
     *   @var string $subtitle     Sub-headline paragraph.
     *   @var array  $features     List of ['icon' => svgHtml, 'title' => .., 'desc' => ..].
     *   @var string $ctaLabel     Primary button label. Default 'Jetzt loslegen'.
     *   @var string $dismissKey   localStorage key suffix for "don't show again". Default 'welcome-dismissed'.
     *   @var string $rememberLabel Checkbox label. Default 'Nicht mehr anzeigen'.
     * }
     */
    function ds_render_welcome_modal(array $opts): string
    {
        $id            = $opts['id'] ?? 'ds-welcome-modal';
        $image         = $opts['image'] ?? '';
        $title         = $opts['title'] ?? '';
        $subtitle      = $opts['subtitle'] ?? '';
        $features      = $opts['features'] ?? [];
        $ctaLabel      = $opts['ctaLabel'] ?? 'Jetzt loslegen';
        $dismissKey    = $opts['dismissKey'] ?? 'welcome-dismissed';
        $rememberLabel = $opts['rememberLabel'] ?? 'Nicht mehr anzeigen';

        $featuresHtml = '';
        foreach ($features as $feature) {
            $featuresHtml .= sprintf(
                '<div class="ds-modal__feature">
    <div class="ds-modal__feature-icon">%1$s</div>
    <div><h3>%2$s</h3><p>%3$s</p></div>
</div>',
                $feature['icon'] ?? '',
                htmlspecialchars($feature['title'] ?? '', ENT_QUOTES),
                htmlspecialchars($feature['desc'] ?? '', ENT_QUOTES)
            );
        }

        $mediaHtml = $image !== ''
            ? '<div class="ds-modal__media"><img src="' . htmlspecialchars($image, ENT_QUOTES) . '" alt="' . htmlspecialchars($title, ENT_QUOTES) . '"></div>'
            : '';

        return sprintf(
            '<div class="ds-modal-overlay" id="%1$s" data-ds-modal data-dismiss-key="%2$s" hidden aria-hidden="true">
  <div class="ds-modal" role="dialog" aria-modal="true" aria-labelledby="%1$s-title">
    %3$s
    <div class="ds-modal__body">
      <div class="ds-modal__head">
        <h2 class="ds-modal__title" id="%1$s-title">%4$s</h2>
        <p class="ds-modal__subtitle">%5$s</p>
      </div>
      <div class="ds-modal__features">%6$s</div>
      <div class="ds-modal__footer">
        %7$s
        %8$s
      </div>
    </div>
  </div>
</div>',
            htmlspecialchars($id, ENT_QUOTES),
            htmlspecialchars($dismissKey, ENT_QUOTES),
            $mediaHtml,
            htmlspecialchars($title, ENT_QUOTES),
            htmlspecialchars($subtitle, ENT_QUOTES),
            $featuresHtml,
            ds_render_checkbox($id . '-remember', $rememberLabel),
            ds_render_button($ctaLabel, null, 'primary', ['data-ds-modal-close' => 'true'])
        );
    }
}
