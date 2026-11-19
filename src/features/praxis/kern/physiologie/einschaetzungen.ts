// Grundsystem G4: Einschätzungen aus dem Modellzustand (Lernmodell; ersetzt keine Einschätzung am Menschen).
// Rein und deterministisch. Die Instrumente sind vereinfacht nachgebildet: Sie zeigen, welche Beobachtungen in den
// Wert eingehen, und liefern Platzhalter für Befundtexte ({qsofa}, {schockindex} …) und Bedingungen in Fällen.
//
// - Schockindex = Puls / RR systolisch (> 1 Schockverdacht bei Erwachsenen; Kinder: altersabhängig, nur als Zahl)
// - qSOFA (Sepsis-3, Singer 2016): AF ≥ 22, RR sys ≤ 100, veränderter Bewusstseinszustand (GCS < 15) → 0–3
// - NEWS2 (Royal College of Physicians 2017) über praxis/news2.ts, nur Erwachsenenprofil
// - PEWS (vereinfacht nach Brighton, Monaghan 2005): Verhalten, Kreislauf, Atmung je 0–3 → 0–9, nur Kinder
// - Nu-DESC (Gaudreau 2005): fünf Merkmale je 0–2 → 0–10, ab 2 Punkten Delir wahrscheinlich
// - BESD (Basler 2006, nach PAINAD): fünf Merkmale je 0–2 → 0–10, ab 2 Punkten Schmerz möglich
// - Braden (Bergstrom 1987): sechs Bereiche → 6–23, ≤ 18 Dekubitusrisiko (Ernährung aus der Hydratation geschätzt)
// - Sturzrisiko aus G3 (Gründe statt Punktwert, DNQP Sturzprophylaxe)

import type { ModellKontext } from '../modell';
import type { Anzeige, Grundgroessen, Treiber } from '../typen';
import { fruehwarnung, monitorGruppe, profil } from './altersprofile';
import { sturzrisiko, type Sturzrisiko } from './haut-mobilitaet';
import { klemme } from './organe';
import { pharma } from './pflegemodell';

const stufe = (x: number, eins: number, zwei: number) => (x >= zwei ? 2 : x >= eins ? 1 : 0);

export const schockindex = (a: Pick<Anzeige, 'hf' | 'rrSys'>): number => (a.rrSys > 0 ? Math.round((a.hf / a.rrSys) * 10) / 10 : 0);

export function qsofa(a: Pick<Anzeige, 'af' | 'rrSys' | 'gcs' | 'avpu'>): number {
  return (a.af >= 22 ? 1 : 0) + (a.rrSys <= 100 ? 1 : 0) + ((a.gcs ?? 15) < 15 || a.avpu !== 'A' ? 1 : 0);
}

/** Nu-DESC-Merkmale: Desorientierung, unangemessenes Verhalten, unangemessene Kommunikation, Illusionen/Halluzinationen, Verlangsamung. */
export function nuDesc(g: Grundgroessen): { punkte: number; merkmale: [number, number, number, number, number] } {
  const merkmale: [number, number, number, number, number] = [
    g.orientierung < 0.45 ? 2 : g.orientierung < 0.85 ? 1 : 0,
    stufe(g.unruhe, 0.3, 0.6),
    stufe(g.delir, 0.3, 0.6),
    stufe(g.delir, 0.5, 0.75),
    g.vigilanz < 0.55 ? 2 : g.vigilanz < 0.8 ? 1 : 0,
  ];
  return { punkte: merkmale.reduce((s, x) => s + x, 0), merkmale };
}

/** BESD-Merkmale: Atmung, negative Lautäußerung, Gesichtsausdruck, Körpersprache, Trost. */
export function besd(g: Grundgroessen): { punkte: number; merkmale: [number, number, number, number, number] } {
  const s = g.schmerz;
  const merkmale: [number, number, number, number, number] = [
    stufe(s, 5, 8),
    stufe(s, 4, 7),
    stufe(s, 3, 6),
    Math.max(stufe(s, 4, 7), stufe(g.unruhe, 0.3, 0.6)),
    stufe(s, 5, 8),
  ];
  return { punkte: merkmale.reduce((x, y) => x + y, 0), merkmale };
}

/** Vereinfachte PEWS (Brighton) für Kinder; undefined für Erwachsenenprofile. */
export function pews(a: Anzeige, g: Grundgroessen, k: ModellKontext): number | undefined {
  if (monitorGruppe(k.altersgruppe) === 'erwachsen') return undefined;
  const p = profil(k.altersgruppe);
  const verhalten = g.vigilanz < 0.55 || g.krampf !== 0 ? 3 : g.unruhe > 0.4 ? 2 : g.vigilanz < 0.8 ? 1 : 0;
  const hfUeber = a.hf - p.pulsNormal[1];
  const rekap = a.rekapSek ?? 2;
  const kreislauf = rekap >= 5 || hfUeber >= 30 || a.hf < p.pulsNormal[0] ? 3 : rekap >= 4 || hfUeber >= 20 ? 2 : rekap >= 3 ? 1 : 0;
  const afNormalOben = Math.round(p.ruheAF * 1.25);
  const afUeber = a.af - afNormalOben;
  const atmung = g.sauerstoff >= 8 || a.af <= p.ruheAF * 0.6 ? 3 : afUeber >= 20 || g.sauerstoff >= 4 || g.atemarbeit > 2 ? 2
    : afUeber >= 10 || g.sauerstoff > 0 || g.atemarbeit > 1.4 ? 1 : 0;
  return verhalten + kreislauf + atmung;
}

/** Neu verwirrt gegenüber der Ausgangslage (NEWS2 „C“). */
const neuVerwirrt = (g: Grundgroessen, k: ModellKontext) =>
  !!k.basis && (k.basis.orientierung - g.orientierung > 0.25 || g.delir - k.basis.delir > 0.25);

/** Felder für die Anzeige (Platzhalter in Befundtexten, Bedingungen in Fällen); ohne Treiber berechenbar. */
export function anzeigeEinschaetzungen(a: Anzeige, g: Grundgroessen, k: ModellKontext): Partial<Anzeige> {
  const r: Partial<Anzeige> = {
    schockindex: schockindex(a), qsofa: qsofa(a), nuDesc: nuDesc(g).punkte, besd: besd(g).punkte,
  };
  const fw = fruehwarnung(a, k.altersgruppe, g.sauerstoff > 0, neuVerwirrt(g, k));
  if (fw.punkte !== undefined) r.news2 = fw.punkte;
  const pw = pews(a, g, k);
  if (pw !== undefined) r.pews = pw;
  return r;
}

export interface Braden { punkte: number; bereiche: { sensorik: number; feuchtigkeit: number; aktivitaet: number; mobilitaet: number; ernaehrung: number; reibung: number }; risiko: boolean }

/** Braden-Skala aus Zustand und Treibern (Immobilität G3). Ernährung ist aus der Hydratation geschätzt. */
export function braden(g: Grundgroessen, treiber: readonly Treiber[]): Braden {
  const im = treiber.find((t): t is Extract<Treiber, { art: 'immobil' }> => t.art === 'immobil');
  const bereiche = {
    sensorik: g.vigilanz < 0.3 ? 1 : g.vigilanz < 0.55 ? 2 : g.vigilanz < 0.8 || g.orientierung < 0.45 ? 3 : 4,
    feuchtigkeit: im?.feucht ? 2 : g.temperatur >= 38.5 ? 3 : 4,
    aktivitaet: im ? 1 : g.vigilanz < 0.55 ? 2 : g.volumen < 0.85 || g.temperatur >= 38.5 ? 3 : 4,
    mobilitaet: im ? (im.druckMmHg >= 50 ? 1 : 2) : g.vigilanz < 0.55 ? 2 : 4,
    ernaehrung: g.hydratation < 0.8 ? 2 : g.hydratation < 0.9 ? 3 : 4,
    reibung: im?.scherkraefte ? 1 : im ? 2 : 3,
  };
  const punkte = Object.values(bereiche).reduce((s, x) => s + x, 0);
  return { punkte, bereiche, risiko: punkte <= 18 };
}

export interface Einschaetzungen extends Pick<Anzeige, 'schockindex' | 'qsofa' | 'news2' | 'pews' | 'nuDesc' | 'besd'> {
  braden: Braden;
  sturz: Sturzrisiko;
}

/** Alle Einschätzungen (für Auswertung, KI-Tutor, Übergabe); braucht die Treiber für Braden, Sedierung und Sturz. */
export function einschaetzungen(a: Anzeige, g: Grundgroessen, treiber: readonly Treiber[], k: ModellKontext): Einschaetzungen {
  const pe = pharma(treiber, k);
  const immobil = treiber.some((t) => t.art === 'immobil');
  return {
    ...anzeigeEinschaetzungen(a, g, k),
    braden: braden(g, treiber),
    sturz: sturzrisiko(g, {
      hochbetagt: k.altersgruppe === 'hochbetagt', rrSys: a.rrSys, schwindel: g.volumen < 0.88 || g.hydratation < 0.85,
      sedierung: klemme(pe.sedativ + pe.opioid, 0, 2), diureseMlH: g.wirkDiurese ?? 0, immobil,
    }),
  };
}
