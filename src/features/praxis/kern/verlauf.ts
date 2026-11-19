// Praxissimulator neu – sichtbarer Verlauf (Paket P12, Runde 2).
// Aus befinden() und anzeige() wird abgeleitet, was man am Patienten sehen oder hören kann
// (wacher/schläfriger, atmet schwerer, Haut kaltschweißig, unruhig, krampft …). Ändert sich ein Merkmal
// und bleibt die Änderung mindestens ENTPRELL_SEK bestehen, entsteht eine Meldung `art: 'verlauf'`.
// Keine Zahlen, keine versteckten Modellwerte: nur Beobachtbares. Rein und deterministisch (nur aus z),
// damit Replay und „Warten in 5-s-Stücken“ denselben Zustand ergeben.

import { befinden, type Befinden } from './physiologie/pflegemodell';
import { alarmFuer } from './physiologie/altersprofile';
import { ruheAnzeige } from './physiologie/pflegemodell';
import type { Anzeige, Bildzustand, FallV2 } from './typen';

/** Wie lange eine Änderung bestehen muss, bevor sie gemeldet wird (Sekunden Spielzeit). */
export const ENTPRELL_SEK = 20;
/** Mindestabstand zwischen zwei Meldungen desselben Merkmals. */
export const MIN_ABSTAND_SEK = 60;

export type Merkmal = 'bewusstsein' | 'atmung' | 'atemtempo' | 'haut' | 'schmerz' | 'unruhe' | 'angst' | 'orientierung' | 'krampf' | 'uebelkeit';

/** Laufzeitstand im SimZustand (optional, entsteht beim ersten Takt). */
export interface VerlaufStand {
  /** zuletzt gemeldeter (bzw. Anfangs-)Wert je Merkmal */
  stand: Partial<Record<Merkmal, string>>;
  /** abweichender Wert, seit wann */
  kandidat: Partial<Record<Merkmal, { wert: string; seit: number }>>;
  /** Zeitpunkt der letzten Meldung je Merkmal */
  zuletzt: Partial<Record<Merkmal, number>>;
}

interface Beobachtung { b: Befinden; a: Anzeige; fall: FallV2 }

interface MerkmalDef {
  /** Werte von gut nach schlecht; der Index bestimmt „besser/schlechter“ */
  stufen: readonly string[];
  wert: (o: Beobachtung) => string;
  /** sofort melden (z. B. Krampfanfall) */
  sofort?: boolean;
  text: (name: string, neu: string, alt: string, schlechter: boolean) => string;
}

const atemnotStufe = (n: number) => (n <= 2 ? 'ruhig' : n <= 5 ? 'angestrengt' : 'schwer');
const schmerzStufe = (n: number) => (n <= 3 ? 'gering' : n <= 6 ? 'maessig' : 'stark');

function atemtempo(o: Beobachtung): string {
  const s = alarmFuer('af', o.a.af, o.fall.altersgruppe);
  if (s === 'ok') return 'normal';
  const schnell = o.a.af > ruheAnzeige(o.fall.altersgruppe).af;
  return schnell ? (s === 'rot' ? 'sehr-schnell' : 'schnell') : 'langsam';
}

export const MERKMALE: Record<Merkmal, MerkmalDef> = {
  bewusstsein: {
    stufen: ['A', 'V', 'P', 'U'],
    wert: (o) => o.a.avpu,
    text: (n, neu, _alt, schlechter) => ({
      A: `${n} wirkt wacher und ist wieder gut ansprechbar.`,
      V: schlechter ? `${n} wirkt schläfrig und öffnet die Augen erst auf Ansprache.` : `${n} wirkt etwas wacher und reagiert wieder auf Ansprache.`,
      P: schlechter ? `${n} reagiert nicht mehr auf Ansprache, nur noch auf Schmerzreiz.` : `${n} reagiert wieder auf Schmerzreiz.`,
      U: `${n} reagiert nicht mehr, auch nicht auf Schmerzreiz.`,
    })[neu] ?? '',
  },
  atmung: {
    stufen: ['ruhig', 'angestrengt', 'schwer'],
    wert: (o) => atemnotStufe(o.b.atemnot),
    text: (n, neu, _alt, schlechter) => schlechter
      ? (neu === 'schwer' ? `${n} ringt nach Luft und atmet sichtbar schwer.` : `${n} atmet angestrengter.`)
      : (neu === 'ruhig' ? `${n} atmet wieder ruhig und entspannt.` : `${n} atmet etwas leichter.`),
  },
  atemtempo: {
    stufen: ['normal', 'schnell', 'langsam', 'sehr-schnell'],
    wert: atemtempo,
    text: (n, neu) => ({
      normal: `Die Atmung von ${n} ist wieder gleichmäßig.`,
      schnell: `${n} atmet schneller.`,
      'sehr-schnell': `${n} atmet sehr schnell.`,
      langsam: `${n} atmet auffallend langsam und flach.`,
    })[neu] ?? '',
  },
  haut: {
    stufen: ['rosig', 'trocken', 'blass', 'gerötet-heiss', 'blass-kaltschweissig', 'zyanotisch'],
    wert: (o) => o.b.haut,
    text: (n, neu) => ({
      rosig: `Die Haut von ${n} wird wieder rosiger.`,
      trocken: `Die Haut von ${n} wirkt trocken, die Schleimhäute auch.`,
      blass: `${n} wird blass.`,
      'gerötet-heiss': `${n} hat eine gerötete, heiße Haut.`,
      'blass-kaltschweissig': `${n} wird blass und kaltschweißig.`,
      zyanotisch: `Die Lippen von ${n} werden bläulich.`,
    })[neu] ?? '',
  },
  schmerz: {
    stufen: ['gering', 'maessig', 'stark'],
    wert: (o) => schmerzStufe(o.b.nrs),
    text: (n, neu, _alt, schlechter) => schlechter
      ? (neu === 'stark' ? `${n} verzieht vor Schmerz das Gesicht und stöhnt.` : `${n} hat sichtbar mehr Schmerzen.`)
      : (neu === 'gering' ? `${n} wirkt entspannter, die Schmerzen lassen nach.` : `${n} wirkt etwas entspannter.`),
  },
  unruhe: {
    stufen: ['ruhig', 'nestelnd', 'unruhig', 'agitiert'],
    wert: (o) => o.b.unruhe,
    text: (n, neu, _alt, schlechter) => ({
      ruhig: `${n} wird ruhiger.`,
      nestelnd: schlechter ? `${n} nestelt an der Bettdecke.` : `${n} ist ruhiger, nestelt aber noch.`,
      unruhig: schlechter ? `${n} wird unruhig.` : `${n} ist weniger aufgebracht, aber noch unruhig.`,
      agitiert: `${n} ist sehr unruhig und will aufstehen.`,
    })[neu] ?? '',
  },
  angst: {
    // „keine“ und „leicht“ zusammen: leichte Sorge ist von außen kaum zu unterscheiden (sonst flackern Meldungen)
    stufen: ['gering', 'deutlich', 'panisch'],
    wert: (o) => (o.b.angst === 'keine' || o.b.angst === 'leicht' ? 'gering' : o.b.angst),
    text: (n, neu, _alt, schlechter) => ({
      gering: `${n} wirkt deutlich gelöster.`,
      deutlich: schlechter ? `${n} wirkt ängstlich.` : `${n} ist etwas ruhiger, aber noch ängstlich.`,
      panisch: `${n} gerät in Panik.`,
    })[neu] ?? '',
  },
  orientierung: {
    stufen: ['klar', 'verwirrt'],
    wert: (o) => (o.b.neuVerwirrt ? 'verwirrt' : 'klar'),
    text: (n, neu) => (neu === 'verwirrt' ? `${n} wirkt verwirrt und antwortet nicht mehr passend.` : `${n} wirkt wieder klarer.`),
  },
  krampf: {
    stufen: ['nein', 'ja'],
    wert: (o) => (o.b.krampfanfall ? 'ja' : 'nein'),
    sofort: true,
    text: (n, neu) => (neu === 'ja' ? `${n} krampft: rhythmische Zuckungen an Armen und Beinen.` : `Die Zuckungen bei ${n} hören auf.`),
  },
  uebelkeit: {
    stufen: ['nein', 'ja'],
    wert: (o) => (o.b.uebelkeit ? 'ja' : 'nein'),
    text: (n, neu) => (neu === 'ja' ? `${n} klagt über Übelkeit und würgt.` : `${n} ist nicht mehr übel.`),
  },
};
export const MERKMAL_IDS = Object.keys(MERKMALE) as Merkmal[];

/** Nur bei wachen oder ansprechbaren Menschen beurteilbar */
const NUR_WACH = new Set<Merkmal>(['orientierung', 'angst', 'unruhe', 'schmerz', 'uebelkeit']);

/** Wichtige Verschlechterungen (Hervorhebung in der Oberfläche). */
const WICHTIG = new Set<Merkmal>(['bewusstsein', 'krampf', 'haut', 'atmung']);

export function beobachte(o: Beobachtung): Record<Merkmal, string> {
  const r = {} as Record<Merkmal, string>;
  for (const m of MERKMAL_IDS) r[m] = MERKMALE[m].wert(o);
  return r;
}

export interface VerlaufMeldung { merkmal: Merkmal; text: string; schlechter: boolean; wert: string }

/**
 * Ein Takt: vergleicht Beobachtung mit dem Stand. Gibt die neuen Meldungen zurück und schreibt den Stand fort.
 * `stand` wird verändert (Aufrufer arbeitet auf einer Kopie des Zustands).
 */
export function verlaufTakt(st: VerlaufStand, jetzt: Record<Merkmal, string>, t: number, name: string, still = false): VerlaufMeldung[] {
  const neu: VerlaufMeldung[] = [];
  const kaumWach = jetzt.bewusstsein === 'P' || jetzt.bewusstsein === 'U';
  for (const m of MERKMAL_IDS) {
    const def = MERKMALE[m];
    const w = jetzt[m];
    const alt = st.stand[m];
    if (alt === undefined) { st.stand[m] = w; continue; }
    if (w === alt) { delete st.kandidat[m]; continue; }
    // Wer nur auf Schmerz reagiert, wirkt weder „verwirrt“ noch „ängstlich“: still nachführen.
    // Ebenso, wenn im selben Takt ein Fallereignis die Lage schon beschreibt (still).
    if (still || (kaumWach && NUR_WACH.has(m))) { st.stand[m] = w; delete st.kandidat[m]; continue; }
    const k = st.kandidat[m];
    if (!k || k.wert !== w) st.kandidat[m] = { wert: w, seit: t };
    const seit = st.kandidat[m]!.seit;
    if (!def.sofort && t - seit < ENTPRELL_SEK) continue;
    if (!def.sofort && st.zuletzt[m] !== undefined && t - st.zuletzt[m]! < MIN_ABSTAND_SEK) continue;
    const schlechter = def.stufen.indexOf(w) > def.stufen.indexOf(alt);
    const text = def.text(name, w, alt, schlechter);
    st.stand[m] = w;
    st.zuletzt[m] = t;
    delete st.kandidat[m];
    if (text) neu.push({ merkmal: m, text, schlechter, wert: w });
  }
  return neu;
}

export const istWichtig = (v: VerlaufMeldung) => v.schlechter && WICHTIG.has(v.merkmal);

/** Bildzustand passend zur gemeldeten Beobachtung (nur für betroffene Merkmale). */
export function bildNach(bild: Bildzustand, v: readonly VerlaufMeldung[], jetzt: Record<Merkmal, string>): Bildzustand {
  if (!v.length) return bild;
  const n: Bildzustand = { ...bild };
  const betrifft = new Set(v.map((x) => x.merkmal));
  if (betrifft.has('haut')) n.haut = jetzt.haut as Bildzustand['haut'];
  if (['bewusstsein', 'schmerz', 'angst', 'orientierung', 'unruhe'].some((m) => betrifft.has(m as Merkmal))) {
    n.mimik = jetzt.bewusstsein !== 'A' ? 'schlaefrig'
      : jetzt.angst === 'deutlich' || jetzt.angst === 'panisch' ? 'angst'
        : jetzt.schmerz === 'stark' || jetzt.schmerz === 'maessig' ? 'schmerz'
          : jetzt.orientierung === 'verwirrt' ? 'verwirrt' : 'ruhig';
  }
  if (betrifft.has('unruhe') && jetzt.unruhe === 'agitiert') n.haltung = 'unruhig';
  return n;
}

export { befinden };
