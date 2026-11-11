import { describe, expect, it } from 'vitest';
import { FAELLE, FALL_NACH_ID } from './faelle';
import { fuehreAus, starte, type Lauf } from './lauf';
import { fehlerAusLauf, kriterien, lernereignis, versuchIdVon } from './lernereignis';
import { FALL_THEMEN, diagnostikFaelleZuThema } from './themen';
import { pflegeModule } from '../../modules/pflege';
import { leafTopics } from '../lernplan/store';
import { pruefeErgebnis } from '../lernplan/ergebnis';
import { uebungenFuer } from '../lernplan/trainer';

const beende = (l: Lauf) => fuehreAus(l, FALL_NACH_ID[l.fallId], { typ: 'beenden' });

describe('Diagnostik-Lernereignis (SIM-05)', () => {
  it('jeder Fall hat gültige Lernplan-Themen (Blätter des Katalogs)', () => {
    const blaetter = new Set(leafTopics(pflegeModule.topics).map((t) => t.id));
    for (const f of FAELLE) {
      expect(FALL_THEMEN[f.id]?.length, f.id).toBeGreaterThan(0);
      for (const t of FALL_THEMEN[f.id]) expect(blaetter.has(t), `${f.id}: ${t}`).toBe(true);
    }
    for (const t of ['thema.ph.injektion', 'thema.pp.uebergabe', 'thema.ph.periop']) expect(blaetter.has(t)).toBe(true);
  });
  it('laufender Fall bucht nichts, beendeter Fall ein gültiges Ergebnis mit Versuch-ID', () => {
    const f = FALL_NACH_ID['sepsis-pneumonie'];
    const l = starte(f);
    expect(lernereignis(l, f)).toBeUndefined();
    const e = lernereignis(beende(l), f)!;
    expect(pruefeErgebnis(e)).toBeUndefined();
    expect(e.versuchId).toBe(`diagnostik:sepsis-pneumonie:${l.id}`);
    expect(e.herkunft.modul).toBe('diagnostik');
    expect(e.status).toBe('abgeschlossen');
  });
  it('zwei Versuche haben verschiedene IDs, alte Läufe ohne ID buchen nicht', () => {
    const f = FALL_NACH_ID['hyperkaliaemie'];
    expect(versuchIdVon(starte(f))).not.toBe(versuchIdVon(starte(f, 2)));
    const alt = { ...beende(starte(f)), id: undefined };
    expect(lernereignis(alt, f)).toBeUndefined();
  });
  it('Kriterien getrennt: Präanalytik, kritische Meldung, SBAR, Befundverständnis', () => {
    const f = FALL_NACH_ID['sepsis-pneumonie'];
    let l = starte(f);
    l = fuehreAus(l, f, { typ: 'antwort', frage: f.fragen[0].id, richtig: false, wahl: 'x' });
    const ks = kriterien(beende(l), f).map((k) => k.id);
    expect(ks).toContain('sbar');
    expect(ks).toContain('befundverstaendnis');
    const e = lernereignis(beende(l), f)!;
    expect(e.herkunft.kriterien!.every((k) => typeof k.erfuellt === 'boolean')).toBe(true);
    expect(e.ergebnisse.map((x) => x.topicId)).toContain('thema.pp.uebergabe');
  });
  it('falsche Lernfragen landen im Fehlerheft mit Fall-ID', () => {
    const f = FALL_NACH_ID['gastroenteritis-kind'];
    let l = starte(f);
    for (const q of f.fragen) l = fuehreAus(l, f, { typ: 'antwort', frage: q.id, richtig: false, wahl: 'falsch' });
    const fe = fehlerAusLauf(l, f);
    expect(fe.length).toBeGreaterThan(0);
    for (const x of fe) {
      expect(x.id.startsWith('diagnostik:gastroenteritis-kind:')).toBe(true);
      expect(x.wiederholung.art).toBe('auswahl');
      expect(x.fallId).toBe('gastroenteritis-kind');
      expect(x.versuchId).toBe(versuchIdVon(l));
      expect(x.kriterium).toBe('Befundverständnis');
      if (x.wiederholung.art === 'auswahl') expect(x.wiederholung.richtig.every((i) => i >= 0)).toBe(true);
    }
  });
  it('der Lernplan verlinkt passende Diagnostik-Fälle', () => {
    expect(diagnostikFaelleZuThema('thema.kl.diabetes')).toEqual(['ketoazidose']);
    expect(uebungenFuer('thema.kl.diabetes').some((u) => u.trainer === 'diagnostik' && u.path.includes('ketoazidose'))).toBe(true);
  });
});
