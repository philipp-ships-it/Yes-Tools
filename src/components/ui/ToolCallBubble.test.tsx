import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ToolCallBubble } from './ToolCallBubble';
import type { ToolCallDisplay } from '../../lib/ai/types';

const baseCall: ToolCallDisplay = {
  id: 'call_1',
  name: 'html_minify',
  args: { html: '<div> </div>' },
  status: 'running',
};

describe('ToolCallBubble', () => {
  it('zeigt den Tool-Namen und den Status "läuft…" während der Ausführung', () => {
    render(<ToolCallBubble call={baseCall} />);

    expect(screen.getByText('html_minify')).toBeInTheDocument();
    expect(screen.getByText('läuft…')).toBeInTheDocument();
  });

  it('zeigt eine Ergebnis-Zusammenfassung bei Erfolg an, ohne dass man aufklappen muss', () => {
    render(
      <ToolCallBubble
        call={{ ...baseCall, status: 'success', resultSummary: 'html: <div></div>' }}
      />
    );

    expect(screen.getByText('erledigt')).toBeInTheDocument();
    expect(screen.getByText('html: <div></div>')).toBeInTheDocument();
  });

  it('zeigt Argumente und volles Ergebnis erst nach Klick zum Aufklappen', async () => {
    const user = userEvent.setup();
    render(
      <ToolCallBubble
        call={{ ...baseCall, status: 'success', result: { html: '<div></div>' } }}
      />
    );

    expect(screen.queryByText(/"html"/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button'));

    expect(screen.getByText(/"html"/)).toBeInTheDocument();
  });

  it('zeigt den Fehler-Status bei fehlgeschlagenen Tool-Aufrufen', () => {
    render(
      <ToolCallBubble
        call={{ ...baseCall, status: 'error', resultSummary: 'Unbekanntes Tool' }}
      />
    );

    expect(screen.getByText('fehlgeschlagen')).toBeInTheDocument();
  });
});
