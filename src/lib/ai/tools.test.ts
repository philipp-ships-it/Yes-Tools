/**
 * Vorlage: Unit-Tests für die KI-Tool-Registry.
 * Prüft sowohl die Schemas (valides JSON-Schema, eindeutige Namen) als auch
 * das tatsächliche Ausführungsverhalten jedes Tools.
 */
import { describe, expect, it, vi } from 'vitest';
import { TOOL_REGISTRY, TOOL_SCHEMAS, findTool } from './tools';
import type { ToolExecutionContext } from './types';

function makeCtx(overrides: Partial<ToolExecutionContext> = {}): ToolExecutionContext {
  return {
    getActiveCode: () => '<p>code</p>',
    setActiveCode: vi.fn(),
    activeToolName: 'Test Tool',
    ...overrides,
  };
}

describe('TOOL_REGISTRY', () => {
  it('hat für jedes Tool einen eindeutigen Namen', () => {
    const names = TOOL_REGISTRY.map((t) => t.schema.function.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('exportiert TOOL_SCHEMAS 1:1 synchron zur Registry', () => {
    expect(TOOL_SCHEMAS).toHaveLength(TOOL_REGISTRY.length);
    expect(TOOL_SCHEMAS[0]).toBe(TOOL_REGISTRY[0].schema);
  });

  it('enthält kein Tool für dynamische Code-Ausführung (Sicherheitsanforderung)', () => {
    const names = TOOL_REGISTRY.map((t) => t.schema.function.name);
    expect(names).not.toContain('json_transform');
  });
});

describe('findTool', () => {
  it('findet ein registriertes Tool über seinen Namen', () => {
    expect(findTool('html_beautify')).toBeDefined();
  });

  it('gibt undefined für unbekannte Tool-Namen zurück', () => {
    expect(findTool('does_not_exist')).toBeUndefined();
  });
});

describe('html_beautify', () => {
  it('formatiert kompaktes HTML lesbar', async () => {
    const tool = findTool('html_beautify')!;
    const result = await tool.execute({ html: '<div><p>x</p></div>' }, makeCtx());
    expect((result as any).html).toContain('\n');
  });
});

describe('html_minify', () => {
  it('entfernt Whitespace zwischen Tags', async () => {
    const tool = findTool('html_minify')!;
    const result = await tool.execute({ html: '<div>\n  <p>x</p>\n</div>' }, makeCtx());
    expect((result as any).html).not.toMatch(/>\s+</);
  });
});

describe('compare_text', () => {
  it('markiert hinzugefügte und entfernte Zeilen im Diff', async () => {
    const tool = findTool('compare_text')!;
    const result = await tool.execute(
      { original: 'a\nb\nc', updated: 'a\nx\nc' },
      makeCtx()
    ) as { unifiedDiff: string; changedLines: number };

    expect(result.unifiedDiff).toContain('- b');
    expect(result.unifiedDiff).toContain('+ x');
    expect(result.changedLines).toBeGreaterThan(0);
  });
});

describe('get_active_editor_code / set_active_editor_code', () => {
  it('liest den Code aus dem Ausführungskontext', async () => {
    const tool = findTool('get_active_editor_code')!;
    const ctx = makeCtx({ getActiveCode: () => '<h1>Hallo</h1>', activeToolName: 'WYSIWYG Studio' });

    const result = await tool.execute({}, ctx) as { code: string; toolName: string };

    expect(result.code).toBe('<h1>Hallo</h1>');
    expect(result.toolName).toBe('WYSIWYG Studio');
  });

  it('schreibt Code über den Ausführungskontext zurück, statt ihn selbst zu halten', async () => {
    const tool = findTool('set_active_editor_code')!;
    const setActiveCode = vi.fn();
    const ctx = makeCtx({ setActiveCode });

    await tool.execute({ code: '<b>neu</b>' }, ctx);

    expect(setActiveCode).toHaveBeenCalledWith('<b>neu</b>');
  });
});
