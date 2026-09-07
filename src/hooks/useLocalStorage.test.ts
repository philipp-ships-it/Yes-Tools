/**
 * Vorlage: Unit-Test für einen React-Hook mit Browser-API-Seiteneffekt.
 *
 * Best Practices:
 * - `renderHook` aus @testing-library/react statt Hook manuell in eine
 *   Dummy-Komponente zu rendern
 * - `act()` um State-Updates, die außerhalb von React-Events passieren
 * - localStorage wird in `beforeEach` zurückgesetzt, damit Tests isoliert bleiben
 * - Fehlerfälle (kaputtes JSON, deaktiviertes localStorage) werden explizit getestet
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('verwendet den Initialwert, wenn noch nichts gespeichert ist', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('default');
  });

  it('liest einen bereits gespeicherten Wert beim ersten Rendern', () => {
    window.localStorage.setItem('test-key', JSON.stringify('gespeichert'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('gespeichert');
  });

  it('schreibt neue Werte sowohl in den State als auch nach localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    act(() => {
      result.current[1]('neuer-wert');
    });

    expect(result.current[0]).toBe('neuer-wert');
    expect(window.localStorage.getItem('test-key')).toBe(JSON.stringify('neuer-wert'));
  });

  it('unterstützt einen Updater-Callback wie useState', () => {
    const { result } = renderHook(() => useLocalStorage<number>('counter', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(2);
  });

  it('fällt bei defektem JSON im Storage auf den Initialwert zurück, statt zu crashen', () => {
    window.localStorage.setItem('broken-key', '{not-valid-json');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage('broken-key', 'fallback'));

    expect(result.current[0]).toBe('fallback');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('bricht nicht ab, wenn localStorage.setItem wirft (z. B. Quota exceeded / Private Mode)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const { result } = renderHook(() => useLocalStorage('quota-key', 'default'));

    expect(() => act(() => result.current[1]('x'))).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });
});
