/**
 * Global Vitest setup, geladen vor jeder Testdatei (siehe vite.config.ts -> test.setupFiles).
 * Erweitert `expect` um jest-dom Matcher (z. B. toBeInTheDocument, toHaveTextContent).
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// React Testing Library räumt das DOM nach jedem Test automatisch auf,
// damit Tests sich nicht gegenseitig beeinflussen.
afterEach(() => {
  cleanup();
});

// jsdom implementiert matchMedia nicht — von useLocalStorage/useSystemStatus
// & Komponenten mit prefers-color-scheme genutzt. Einfacher Mock:
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}
