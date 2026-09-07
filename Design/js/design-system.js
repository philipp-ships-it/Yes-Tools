/**
 * YES Tools — Design System (vanilla JS, no framework dependency)
 *
 * Ports the interactive behaviour behind the popup / cards / inputs from
 * the React app (WelcomePopup.tsx, Home.tsx, ai-input.tsx) into plain,
 * dependency-free JS so it can be reused on any HTML/PHP page that loads
 * css/tokens.css + css/base.css + css/components.css alongside this file.
 *
 * Usage: include this file once, then either call the API directly
 *   DS.Modal.open('#welcome-modal')
 * or rely on the auto-init below, which wires up any element carrying the
 * relevant `data-ds-*` attribute as soon as the DOM is ready.
 */
(function (global) {
  "use strict";

  const STORAGE_PREFIX = "ds:";

  /* ---------------------------------------------------------------- */
  /* Theme                                                             */
  /* ---------------------------------------------------------------- */
  const Theme = {
    STORAGE_KEY: STORAGE_PREFIX + "theme",

    get() {
      try {
        return localStorage.getItem(Theme.STORAGE_KEY);
      } catch (e) {
        return null;
      }
    },

    apply(theme) {
      const root = document.documentElement;
      if (theme === "dark" || theme === "light") {
        root.setAttribute("data-theme", theme);
        try { localStorage.setItem(Theme.STORAGE_KEY, theme); } catch (e) {}
      } else {
        root.removeAttribute("data-theme");
        try { localStorage.removeItem(Theme.STORAGE_KEY); } catch (e) {}
      }
    },

    toggle() {
      const current = document.documentElement.getAttribute("data-theme");
      const prefersDark = global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = current ? current === "dark" : prefersDark;
      Theme.apply(isDark ? "light" : "dark");
    },

    init() {
      const stored = Theme.get();
      if (stored) document.documentElement.setAttribute("data-theme", stored);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Modal / Popup                                                     */
  /* ---------------------------------------------------------------- */
  const Modal = {
    /**
     * Opens a modal overlay by selector/element, unless it was previously
     * dismissed with "don't show again" (mirrors useLocalStorage +
     * `yes-tools-v2-welcome-dismissed` in WelcomePopup.tsx).
     */
    open(target) {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      el.hidden = false;
      el.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      const focusable = el.querySelector("button, [href], input, textarea, [tabindex]");
      if (focusable) focusable.focus({ preventScroll: true });
    },

    close(target) {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      el.hidden = true;
      el.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    },

    /** Wires an overlay element: backdrop click, Escape key, close buttons,
     *  and an optional "remember dismissal" checkbox. */
    bind(overlaySelector, opts) {
      opts = opts || {};
      const overlay = document.querySelector(overlaySelector);
      if (!overlay) return;

      const dismissKey = opts.dismissKey ? STORAGE_PREFIX + opts.dismissKey : null;
      const rememberBox = opts.rememberSelector ? overlay.querySelector(opts.rememberSelector) : null;

      const alreadyDismissed = dismissKey && (() => {
        try { return localStorage.getItem(dismissKey) === "1"; } catch (e) { return false; }
      })();

      const doClose = () => {
        if (dismissKey && rememberBox && rememberBox.checked) {
          try { localStorage.setItem(dismissKey, "1"); } catch (e) {}
        }
        Modal.close(overlay);
      };

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) doClose();
      });
      overlay.querySelectorAll("[data-ds-modal-close]").forEach((btn) => {
        btn.addEventListener("click", doClose);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !overlay.hidden) doClose();
      });

      if (!alreadyDismissed && opts.autoOpen !== false) {
        Modal.open(overlay);
      }
    }
  };

  /* ---------------------------------------------------------------- */
  /* Tooltip (progressive enhancement: works via CSS :hover already;   */
  /* this only handles keyboard/touch edge cases for data-ds-tooltip). */
  /* ---------------------------------------------------------------- */
  function initTooltips(root) {
    (root || document).querySelectorAll("[data-ds-tooltip]").forEach((host) => {
      if (host.dataset.dsTooltipInit) return;
      host.dataset.dsTooltipInit = "1";
      const text = host.getAttribute("data-ds-tooltip");
      const bubble = document.createElement("span");
      bubble.className = "ds-tooltip";
      bubble.textContent = text;
      host.classList.add("ds-tooltip-host");
      host.appendChild(bubble);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Ripple effect for buttons (data-ds-ripple)                        */
  /* ---------------------------------------------------------------- */
  function initRipple(root) {
    (root || document).querySelectorAll("[data-ds-ripple]").forEach((btn) => {
      if (btn.dataset.dsRippleInit) return;
      btn.dataset.dsRippleInit = "1";
      btn.classList.add("ds-ripple-host");
      btn.addEventListener("click", (e) => {
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const span = document.createElement("span");
        span.className = "ds-ripple";
        span.style.width = span.style.height = size + "px";
        span.style.left = (e.clientX - rect.left - size / 2) + "px";
        span.style.top = (e.clientY - rect.top - size / 2) + "px";
        btn.appendChild(span);
        span.addEventListener("animationend", () => span.remove());
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Auto-resizing textarea (mirrors use-auto-resize-textarea.ts)      */
  /* ---------------------------------------------------------------- */
  function autoResize(el, opts) {
    opts = opts || {};
    const min = opts.minHeight || 52;
    const max = opts.maxHeight || 200;
    const resize = () => {
      el.style.height = min + "px";
      el.style.height = Math.min(Math.max(el.scrollHeight, min), max) + "px";
    };
    el.addEventListener("input", resize);
    resize();
  }

  function initAutoResize(root) {
    (root || document).querySelectorAll("[data-ds-autoresize]").forEach((el) => {
      if (el.dataset.dsAutoresizeInit) return;
      el.dataset.dsAutoresizeInit = "1";
      autoResize(el, {
        minHeight: parseInt(el.getAttribute("data-min-height") || "52", 10),
        maxHeight: parseInt(el.getAttribute("data-max-height") || "200", 10)
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Sidebar collapse/expand                                           */
  /* ---------------------------------------------------------------- */
  const Sidebar = {
    toggle(target) {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      el.classList.toggle("is-collapsed");
      try {
        localStorage.setItem(STORAGE_PREFIX + "sidebar:" + (el.id || "default"), el.classList.contains("is-collapsed") ? "1" : "0");
      } catch (e) {}
    },
    restore(target) {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      try {
        const collapsed = localStorage.getItem(STORAGE_PREFIX + "sidebar:" + (el.id || "default"));
        if (collapsed === "1") el.classList.add("is-collapsed");
      } catch (e) {}
    }
  };

  function initSidebars(root) {
    (root || document).querySelectorAll("[data-ds-sidebar]").forEach((sidebar) => {
      if (sidebar.dataset.dsSidebarInit) return;
      sidebar.dataset.dsSidebarInit = "1";
      Sidebar.restore(sidebar);
    });
    document.querySelectorAll("[data-ds-sidebar-toggle]").forEach((btn) => {
      if (btn.dataset.dsToggleInit) return;
      btn.dataset.dsToggleInit = "1";
      btn.addEventListener("click", () => {
        Sidebar.toggle(btn.getAttribute("data-ds-sidebar-toggle"));
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Button loading state                                              */
  /* ---------------------------------------------------------------- */
  function setButtonLoading(target, isLoading) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    el.classList.toggle("is-loading", !!isLoading);
    if (isLoading) el.setAttribute("aria-busy", "true");
    else el.removeAttribute("aria-busy");
  }

  /* ---------------------------------------------------------------- */
  /* Auto-init on DOM ready                                            */
  /* ---------------------------------------------------------------- */
  function initAll(root) {
    initTooltips(root);
    initRipple(root);
    initAutoResize(root);
    initSidebars(root);

    (root || document).querySelectorAll("[data-ds-modal]").forEach((overlay) => {
      if (overlay.dataset.dsModalInit) return;
      overlay.dataset.dsModalInit = "1";
      Modal.bind("#" + overlay.id, {
        dismissKey: overlay.getAttribute("data-dismiss-key"),
        rememberSelector: overlay.getAttribute("data-remember-selector") || "[data-ds-remember]"
      });
    });

    document.querySelectorAll("[data-ds-modal-trigger]").forEach((trigger) => {
      if (trigger.dataset.dsTriggerInit) return;
      trigger.dataset.dsTriggerInit = "1";
      trigger.addEventListener("click", () => {
        Modal.open(trigger.getAttribute("data-ds-modal-trigger"));
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      Theme.init();
      initAll();
    });
  } else {
    Theme.init();
    initAll();
  }

  global.DS = { Theme, Modal, Sidebar, initTooltips, initRipple, autoResize, initAutoResize, initSidebars, setButtonLoading, initAll };
})(window);
