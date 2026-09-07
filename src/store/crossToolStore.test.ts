/**
 * Vorlage: Unit-Test für einen Zustand-Store (zustand + persist-Middleware).
 *
 * Best Practices:
 * - Store-State wird vor jedem Test auf einen bekannten Ausgangszustand
 *   zurückgesetzt (`useCrossToolStore.setState(initialState, true)`), damit
 *   Tests sich nicht gegenseitig durch geteilten Modul-State beeinflussen.
 * - Getestet wird über die öffentliche API (Actions + Selektoren), nicht über
 *   interne Implementierungsdetails.
 * - `persist` schreibt synchron in localStorage — wir prüfen das als
 *   Verhalten, nicht als Implementierungsdetail von zustand selbst.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useCrossToolStore } from './crossToolStore';

const initialState = useCrossToolStore.getState();

describe('useCrossToolStore', () => {
  beforeEach(() => {
    useCrossToolStore.setState(initialState, true);
    window.localStorage.clear();
  });

  it('startet mit den Default-Snippets und ohne eigene Templates', () => {
    const state = useCrossToolStore.getState();

    expect(state.templates).toEqual([]);
    expect(state.snippets.length).toBeGreaterThan(0);
  });

  it('fügt ein Template mit generierter id und createdAt hinzu', () => {
    useCrossToolStore.getState().addTemplate({
      title: 'Test-Template',
      category: 'Snippet',
      code: '<div>Test</div>',
      tags: ['test'],
    });

    const { templates } = useCrossToolStore.getState();

    expect(templates).toHaveLength(1);
    expect(templates[0]).toMatchObject({ title: 'Test-Template', category: 'Snippet' });
    expect(templates[0].id).toMatch(/^tpl-/);
    expect(typeof templates[0].createdAt).toBe('string');
  });

  it('entfernt ein Template anhand seiner id', () => {
    useCrossToolStore.getState().addTemplate({
      title: 'Zu löschen',
      category: 'Other',
      code: '',
      tags: [],
    });
    const id = useCrossToolStore.getState().templates[0].id;

    useCrossToolStore.getState().removeTemplate(id);

    expect(useCrossToolStore.getState().templates).toHaveLength(0);
  });

  it('setzt und entfernt Metadata-Tags', () => {
    useCrossToolStore.getState().setMetadataTag('brand_primary', '#000000');
    expect(useCrossToolStore.getState().metadataTags.brand_primary).toBe('#000000');

    useCrossToolStore.getState().removeMetadataTag('brand_primary');
    expect(useCrossToolStore.getState().metadataTags.brand_primary).toBeUndefined();
  });

  it('aktualisiert den aktiven Tool-Kontext inkrementell, ohne bestehende Felder zu verlieren', () => {
    useCrossToolStore.getState().setActiveToolContext({
      toolId: 'wysiwyg',
      toolName: 'WYSIWYG Studio',
      activeCode: '<p>1</p>',
      language: 'html',
    });

    useCrossToolStore.getState().setActiveToolContext({
      toolId: 'wysiwyg',
      toolName: 'WYSIWYG Studio',
      activeCode: '<p>2</p>',
      language: 'html',
    });

    const ctx = useCrossToolStore.getState().activeToolContext;
    expect(ctx?.activeCode).toBe('<p>2</p>');
    expect(ctx?.toolId).toBe('wysiwyg');
  });

  it('sendet ein "yes-inject-code" CustomEvent beim Injizieren von Code', () =>
    new Promise<void>((resolve) => {
      window.addEventListener(
        'yes-inject-code',
        (e) => {
          const detail = (e as CustomEvent).detail;
          expect(detail.code).toBe('<b>injected</b>');
          expect(detail.toolId).toBe('devtools');
          resolve();
        },
        { once: true }
      );

      useCrossToolStore.getState().injectCodeToActiveTool('<b>injected</b>', 'devtools');
    }));
});
