import { describe, expect, it } from 'vitest';
import { pflegeModule as m } from '../../modules/pflege';
import { leafTopics } from '../lernplan/store';
import { proThema, uebungenFuer } from '../lernplan/trainer';
import { FAELLE } from './faelle';
import { ABSCHNITTE, belegeFuer, belegQuote, bewerteAufgabe, bewerteFall, faelleZuThema, mischung, passtZurSuche } from './bewertung';

const profile = m.diseaseProfiles ?? [];
const profil = new Map(profile.map((p) => [p.id, p]));
const blaetter = new Set(leafTopics(m.topics).map((t) => t.id));

describe('Krankheitsbild-Steckbriefe', () => {
  it('sind im Katalog und verweisen nur auf vorhandene Einträge', () => {
    expect(profile.length).toBeGreaterThanOrEqual(10);
    const themen = new Set(m.topics.map((t) => t.id));
    const drugs = new Set((m.drugProfiles ?? []).map((d) => d.id));
    const refs = new Map((m.references ?? []).map((r) => [r.id, r]));
    for (const p of profile) {
      for (const t of [...p.topicIds, ...(p.prophylaxen ?? []).map((x) => x.topicId)]) expect(themen.has(t), `${p.id} -> ${t}`).toBe(true);
      for (const d of p.drugIds ?? []) expect(drugs.has(d), `${p.id} -> ${d}`).toBe(true);
      for (const a of p.assessmentIds ?? []) expect(refs.get(a)?.kind, `${p.id} -> ${a}`).toBe('assessment');
      for (const s of p.referenceIds ?? []) expect(refs.get(s)?.kind, `${p.id} -> ${s}`).toBe('standard');
    }
  });

  it('belegen nur Abschnitte, die es gibt, und sind ohne Beleg ungeprüft', () => {
    for (const p of profile) {
      for (const b of p.belege ?? []) expect(p[b.abschnitt], `${p.id}: ${b.abschnitt}`).toBeDefined();
      expect(p.pruefstatus).toBe('ungeprueft');
    }
    const hi = profil.get('kh.herzinsuffizienz')!;
    expect(belegeFuer(hi, 'ursachen').length).toBe(1);
    expect(belegeFuer(hi, 'definition')).toEqual([]);
    expect(belegQuote(profil.get('kh.copd')!).belegt).toBe(0);
  });

  it('zählt nur vorhandene Abschnitte für die Belegquote', () => {
    const q = belegQuote(profil.get('kh.exsikkose')!);
    expect(q.gesamt).toBe(ABSCHNITTE.filter((a) => profil.get('kh.exsikkose')![a.id] !== undefined).length);
    expect(q.belegt).toBe(8);
  });

  it('findet über Synonym und Symptom, ohne Umlaute', () => {
    expect(profile.filter((p) => passtZurSuche(p, 'apoplex')).map((p) => p.id)).toEqual(['kh.schlaganfall']);
    expect(profile.some((p) => passtZurSuche(p, 'ODEME'))).toBe(true);
  });
});

describe('Fallaufgaben', () => {
  it('gehören zu einem Steckbrief, haben eindeutige IDs und genau passende Lösungen', () => {
    expect(new Set(FAELLE.map((f) => f.id)).size).toBe(FAELLE.length);
    for (const f of FAELLE) {
      const p = profil.get(f.krankheitId);
      expect(p, f.id).toBeDefined();
      expect(f.aufgaben.length, f.id).toBeGreaterThanOrEqual(4);
      expect(new Set(f.aufgaben.map((a) => a.id)).size, f.id).toBe(f.aufgaben.length);
      for (const a of f.aufgaben) {
        const richtige = a.optionen.filter((o) => o.richtig).length;
        if (a.art === 'einfach') expect(richtige, `${f.id}/${a.id}`).toBe(1);
        else expect(richtige, `${f.id}/${a.id}`).toBeGreaterThanOrEqual(2);
        expect(a.optionen.some((o) => !o.richtig), `${f.id}/${a.id}`).toBe(true);
        // Die Lösung verweist auf einen Abschnitt, der im Steckbrief steht (für Beleg oder „ungeprüft“)
        expect(p![a.abschnitt], `${f.id}/${a.id} -> ${a.abschnitt}`).toBeDefined();
        for (const t of a.extraTopicIds ?? []) expect(blaetter.has(t), `${f.id}/${a.id} -> ${t}`).toBe(true);
      }
    }
  });

  it('decken jedes Krankheitsbild ab und zählen im Lernplan für ein abfragbares Thema', () => {
    for (const p of profile) expect(FAELLE.some((f) => f.krankheitId === p.id), p.id).toBe(true);
    for (const f of FAELLE) {
      const p = profil.get(f.krankheitId)!;
      expect(p.topicIds.some((t) => blaetter.has(t)), `${p.id} braucht ein Blatt-Thema`).toBe(true);
    }
  });

  it('bewertet Einfach- und Mehrfachauswahl', () => {
    const fall = FAELLE.find((f) => f.id === 'hi-sommer')!;
    const einfach = fall.aufgaben.find((a) => a.id === 'form')!;
    expect(bewerteAufgabe(einfach, [0])).toMatchObject({ punkte: 1, max: 1, richtig: true });
    expect(bewerteAufgabe(einfach, [1]).punkte).toBe(0);

    const mehrfach = fall.aufgaben.find((a) => a.id === 'symptome')!; // 3 richtig, 2 falsch
    expect(bewerteAufgabe(mehrfach, [0, 1, 2])).toMatchObject({ punkte: 3, max: 3, richtig: true });
    expect(bewerteAufgabe(mehrfach, [0, 1, 3])).toMatchObject({ punkte: 1, richtig: false });
    // Alles ankreuzen bringt nicht die volle Punktzahl
    expect(bewerteAufgabe(mehrfach, [0, 1, 2, 3, 4]).punkte).toBe(1);
    expect(bewerteAufgabe(mehrfach, [3, 4]).punkte).toBe(0);
  });

  it('gibt dem Lernplan Treffer je Thema, mit Prophylaxe als Zusatzthema', () => {
    const fall = FAELLE.find((f) => f.id === 'hi-sommer')!;
    const alleRichtig = Object.fromEntries(fall.aufgaben.map((a) => [a.id, a.optionen.flatMap((o, i) => (o.richtig ? [i] : []))]));
    const e = bewerteFall(fall, alleRichtig, profil.get(fall.krankheitId));
    expect(e.punkte).toBe(e.max);
    const ergebnisse = proThema(e.treffer, 3);
    expect(ergebnisse.find((x) => x.topicId === 'thema.kl.herz.insuffizienz')).toMatchObject({ scorePercent: 100, anzahl: fall.aufgaben.length });
    // Nur eine Aufgabe zur Pneumonieprophylaxe: zu wenig, um dort zu zählen
    expect(ergebnisse.some((x) => x.topicId === 'thema.pro.pneumonie')).toBe(false);
  });

  it('erscheinen als Übung zum Thema im Lernplan', () => {
    expect(faelleZuThema('thema.kl.herz.insuffizienz', FAELLE, m).map((f) => f.id)).toEqual(['hi-sommer', 'hi-brandt']);
    // Nur eine Aufgabe je Fall zur Aspirationsprophylaxe: zählt dort nie, also auch nicht empfehlen
    expect(faelleZuThema('thema.pro.aspiration', FAELLE, m)).toEqual([]);
    expect(uebungenFuer('thema.pro.aspiration').some((x) => x.trainer === 'krankheitsbilder')).toBe(false);
    const u = uebungenFuer('thema.kl.neuro.schlaganfall').find((x) => x.trainer === 'krankheitsbilder');
    expect(u?.path).toBe('/lernen/krankheitsbilder?ansicht=faelle&thema=thema.kl.neuro.schlaganfall');
  });

  it('mischt die Antwortoptionen als Permutation der Original-Indizes', () => {
    let n = 0;
    const folge = [0.9, 0.1, 0.5, 0.3];
    const r = mischung(5, () => folge[n++ % folge.length]);
    expect([...r].sort()).toEqual([0, 1, 2, 3, 4]);
    expect(r).not.toEqual([0, 1, 2, 3, 4]);
    expect(mischung(1)).toEqual([0]);
  });
});
