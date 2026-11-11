import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import { warumZuerst } from './warum';

const t = (id: string) => pflegeModule.topics.find((x) => x.id === id)!;

describe('Warum zuerst?', () => {
  it('Anatomie vor Krankheitslehre: Abweichung vom Gesunden', () => {
    const w = warumZuerst(t('thema.ap.herz'), t('thema.kl.herz'), 'voraussetzung', ['Systole', 'Diastole', 'Herzzeitvolumen', 'Vorlast', 'Nachlast']);
    expect(w.text).toMatch(/Abweichung vom Gesunden/);
    expect(w.text).toContain('„Herz');
    expect(w.begriffe).toHaveLength(4);
    expect(w.hinweis).toMatch(/nicht einzeln fachlich geprüft/);
  });

  it('Unterthema: Überblick zuerst; gleiches Fach: baut auf; jedes Katalogpaar bekommt einen Satz', () => {
    expect(warumZuerst(t('thema.kl.herz'), t('thema.kl.herz.khk'), 'teil').text).toMatch(/Überblick kommt zuerst/);
    expect(warumZuerst(t('thema.ap.zelle'), t('thema.ap.haut'), 'voraussetzung').text).toMatch(/im selben Fach/);
    const byId = new Map(pflegeModule.topics.map((x) => [x.id, x]));
    for (const thema of pflegeModule.topics) {
      for (const p of thema.prerequisites) {
        const w = warumZuerst(byId.get(p)!, thema, 'voraussetzung');
        expect(w.text.length).toBeGreaterThan(30);
      }
    }
  });
});
