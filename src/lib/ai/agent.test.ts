/**
 * Vorlage: Unit-Test für den Agent-Loop mit gemocktem LLM-Client.
 *
 * Best Practice: `callOpenRouterChat` (echter Netzwerkaufruf) wird komplett
 * gemockt — der Test prüft die Steuerungslogik des Harness (Tool-Aufrufe
 * ausführen, Ergebnisse zurückspielen, Abbruchbedingungen), nicht die
 * OpenRouter-API selbst.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runAgentTurn } from './agent';
import type { ToolExecutionContext } from './types';

vi.mock('../../services/openrouterService', () => ({
  callOpenRouterChat: vi.fn(),
}));

import { callOpenRouterChat } from '../../services/openrouterService';

function makeCtx(): ToolExecutionContext {
  return {
    getActiveCode: () => '<p>x</p>',
    setActiveCode: vi.fn(),
    activeToolName: 'HTML Tools',
  };
}

describe('runAgentTurn', () => {
  beforeEach(() => {
    vi.mocked(callOpenRouterChat).mockReset();
  });

  it('gibt die Antwort direkt zurück, wenn das Modell keine Tools aufruft', async () => {
    vi.mocked(callOpenRouterChat).mockResolvedValueOnce({
      choices: [{ message: { content: 'Hallo, wie kann ich helfen?', tool_calls: undefined } }],
    });

    const result = await runAgentTurn({
      messages: [{ role: 'user', content: 'Hi' }],
      model: 'openrouter/auto',
      ctx: makeCtx(),
    });

    expect(result.finalMessage).toBe('Hallo, wie kann ich helfen?');
    expect(result.toolCalls).toHaveLength(0);
    expect(callOpenRouterChat).toHaveBeenCalledTimes(1);
  });

  it('führt ein angefordertes Tool aus und schickt das Ergebnis als zweite Anfrage zurück', async () => {
    vi.mocked(callOpenRouterChat)
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                { id: 'call_1', function: { name: 'html_minify', arguments: JSON.stringify({ html: '<div> </div>' }) } },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'Fertig minifiziert.', tool_calls: undefined } }],
      });

    const onToolCall = vi.fn();
    const result = await runAgentTurn({
      messages: [{ role: 'user', content: 'Minifiziere das' }],
      model: 'openrouter/auto',
      ctx: makeCtx(),
      onToolCall,
    });

    expect(result.finalMessage).toBe('Fertig minifiziert.');
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe('html_minify');
    expect(result.toolCalls[0].status).toBe('success');
    // running + success => mindestens 2 Live-Updates für die UI
    expect(onToolCall.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(callOpenRouterChat).toHaveBeenCalledTimes(2);
  });

  it('markiert einen Tool-Aufruf als Fehler, wenn das Tool unbekannt ist, statt abzubrechen', async () => {
    vi.mocked(callOpenRouterChat)
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '',
              tool_calls: [{ id: 'call_1', function: { name: 'does_not_exist', arguments: '{}' } }],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'Ich konnte das Tool nicht finden.', tool_calls: undefined } }],
      });

    const result = await runAgentTurn({
      messages: [{ role: 'user', content: 'Test' }],
      model: 'openrouter/auto',
      ctx: makeCtx(),
    });

    expect(result.toolCalls[0].status).toBe('error');
    expect(result.finalMessage).toBe('Ich konnte das Tool nicht finden.');
  });

  it('bricht nach der maximalen Anzahl an Schritten mit einem Fehler ab, statt endlos zu loopen', async () => {
    vi.mocked(callOpenRouterChat).mockResolvedValue({
      choices: [
        {
          message: {
            content: '',
            tool_calls: [{ id: 'call_x', function: { name: 'html_minify', arguments: JSON.stringify({ html: '<a></a>' }) } }],
          },
        },
      ],
    });

    await expect(
      runAgentTurn({ messages: [{ role: 'user', content: 'Loop' }], model: 'openrouter/auto', ctx: makeCtx() })
    ).rejects.toThrow(/Agent-Loop/);
  });
});
