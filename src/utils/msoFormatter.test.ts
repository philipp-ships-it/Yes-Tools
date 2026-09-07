/**
 * Vorlage: Unit-Test für eine reine Utility-Funktion (kein DOM, kein React).
 *
 * Best Practices, die diese Datei demonstriert:
 * - Arrange/Act/Assert (AAA) Struktur pro Test
 * - `describe`-Blöcke gruppieren nach Verhalten, nicht nach Implementierungsdetail
 * - Edge Cases (leere/ungültige Eingabe) sind eigene Testfälle, keine Kommentare im Happy-Path-Test
 * - Keine Snapshot-Tests für Logik, die sich einfach als Wert prüfen lässt
 */
import { describe, expect, it } from 'vitest';
import { formatMsoHtml } from './msoFormatter';

describe('formatMsoHtml', () => {
  it('gibt einen leeren String für leere Eingabe zurück', () => {
    expect(formatMsoHtml('')).toBe('');
  });

  it('gibt einen leeren String für nicht-string Eingaben zurück', () => {
    // @ts-expect-error absichtlich falscher Typ, um die Laufzeit-Guard zu testen
    expect(formatMsoHtml(null)).toBe('');
    // @ts-expect-error absichtlich falscher Typ
    expect(formatMsoHtml(undefined)).toBe('');
  });

  it('formatiert einfaches HTML ohne MSO-Kommentare unverändert lesbar', () => {
    const input = '<div><p>Hallo</p></div>';

    const result = formatMsoHtml(input);

    expect(result).toContain('<div>');
    expect(result).toContain('<p>Hallo</p>');
  });

  it('platziert öffnende und schließende MSO-Conditional-Comments auf eigenen Zeilen', () => {
    const input = '<!--[if mso]><table><tr><td>Outlook</td></tr></table><![endif]-->';

    const result = formatMsoHtml(input);
    const lines = result.split('\n').map((l) => l.trim()).filter(Boolean);

    expect(lines[0]).toBe('<!--[if mso]>');
    expect(lines[lines.length - 1]).toBe('<![endif]-->');
  });

  it('respektiert eine eigene indent_size', () => {
    const input = '<div><span>x</span></div>';

    const result = formatMsoHtml(input, { indent_size: 4 });

    // js-beautify sollte das <span> um genau eine Indent-Stufe (4 Spaces) einrücken.
    expect(result).toMatch(/\n {4}<span>/);
  });

  it('bricht bei fehlerhaftem HTML nicht hart ab, sondern liefert einen String zurück', () => {
    const brokenInput = '<div><span>unclosed';

    expect(() => formatMsoHtml(brokenInput)).not.toThrow();
    expect(typeof formatMsoHtml(brokenInput)).toBe('string');
  });
});
