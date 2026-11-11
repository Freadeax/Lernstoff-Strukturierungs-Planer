import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { PERSONEN, personFuer, portraetUrl } from './personen';

describe('Porträts', () => {
  it('jede Person hat für jeden gelieferten Zustand eine Datei', () => {
    for (const p of Object.values(PERSONEN)) for (const z of p.zustaende) {
      expect(fs.existsSync(`public/personen/${p.datei}_${z}.webp`), `${p.id}/${z}`).toBe(true);
    }
  });
  it('findet die Person zum Fall und fällt auf stabil zurück', () => {
    const ben = personFuer('fall', 'asthma-kind')!;
    expect(ben.name).toBe('Ben');
    expect(portraetUrl(ben, 'kritisch')).toMatch(/personen\/praxis-asthma_stabil\.webp$/);
    expect(personFuer('fall', 'gibt-es-nicht')).toBeNull();
  });
});
