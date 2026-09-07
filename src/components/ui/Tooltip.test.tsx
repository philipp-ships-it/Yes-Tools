/**
 * Vorlage: Unit-Test für eine React-Komponente mit @testing-library/react.
 *
 * Best Practices:
 * - Es wird getestet, was der Nutzer sieht/tut (Rollen, Text, Events),
 *   nicht interner State oder CSS-Klassen.
 * - `userEvent` statt `fireEvent`, da es echtes Nutzerverhalten
 *   (Hover, Fokus-Reihenfolge) realistischer simuliert.
 * - Asynchrone UI (Framer-Motion AnimatePresence) wird mit `findBy*`
 *   statt `getBy*` abgewartet.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('rendert die Kind-Elemente immer, unabhängig vom Hover-Status', () => {
    render(
      <Tooltip content="Hilfetext">
        <button>Aktion</button>
      </Tooltip>
    );

    expect(screen.getByRole('button', { name: 'Aktion' })).toBeInTheDocument();
  });

  it('zeigt den Tooltip-Inhalt erst nach Hover an', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Hilfetext" delay={0}>
        <button>Aktion</button>
      </Tooltip>
    );

    expect(screen.queryByText('Hilfetext')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: 'Aktion' }));

    expect(await screen.findByText('Hilfetext')).toBeInTheDocument();
  });

  it('blendet den Tooltip beim Verlassen (unhover) wieder aus', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Hilfetext" delay={0}>
        <button>Aktion</button>
      </Tooltip>
    );

    const trigger = screen.getByRole('button', { name: 'Aktion' });
    await user.hover(trigger);
    await screen.findByText('Hilfetext');

    await user.unhover(trigger);

    expect(screen.queryByText('Hilfetext')).not.toBeInTheDocument();
  });

  it('zeigt den Tooltip auch bei Tastatur-Fokus an (a11y)', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Hilfetext" delay={0}>
        <button>Aktion</button>
      </Tooltip>
    );

    await user.tab();

    expect(await screen.findByText('Hilfetext')).toBeInTheDocument();
  });
});
