// Spur B – Modellmodule als Hülle um das Basismodell (KONZEPT 4.5, Paket P1b). Rein und deterministisch.
// Ohne Module (kontext.module undefined) reicht die Hülle exakt an das Basismodell durch.
// Mit Modulen:
//   • Perfusoren wirken als Zuschlag auf Gefäßtonus/Pumpleistung (nur während der Rechnung, Bestände bleiben unberührt)
//     und als Sedierung/Analgesie über die Grundgröße `sedierung` bzw. den Wirkkanal des Basismodells.
//   • Beatmung reicht FiO₂/PEEP/AF/Vt an die Atmung des Basismodells; Störungen (Diskonnektion, Tubus verlegt, Sekret)
//     verändern das wirksame Tidalvolumen und den Spitzendruck.
//   • Rhythmus: vorgegebener Rhythmus verändert Herzfrequenz und Auswurf (Vorhofflimmern, VT, Kammerflimmern …).
//   • Laktat, Bilanz (Urin über Dauerkatheter) und BGA werden aus Perfusion/Atmung abgeleitet.
// Hinweis „Lernmodell“: plausibel und lehrreich, ersetzt keine klinische Beurteilung.

import type { ModellKontext, PhysiologieModell } from '../modell';
import type { Anzeige, GeraeteStoerung, Grundgroessen, ModellModule, ModulEingriff, Rhythmus } from '../typen';
import { bgaAusModell, po2AusSpo2 } from './bga';
import { perfusorEffekt } from './perfusor';
import { laktatZiel, urinMlH } from '../physiologie/niere';

/** Was die Hülle vom Basismodell zusätzlich braucht. P1 liefert es über atmung()/kreislauf(). */
export interface BasisDetails {
  map: number;
  /** Herzzeitvolumen relativ, 1 = normal */
  perfusion: number;
  paco2: number;
  pao2: number;
}
export type DetailQuelle = (g: Grundgroessen, k: ModellKontext, a: Anzeige) => Partial<BasisDetails>;

/** Wirkkanal des Basismodells für abgeleitete Größen (P1: ModellKontext.wirkung). */
type Wirkung = Partial<Record<keyof Grundgroessen, number>>;
type KontextMitWirkung = ModellKontext & { wirkung?: Wirkung };

const STANDARD_GEWICHT = 75;
const begrenze = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
const naeher = (ist: number, ziel: number, rateProSek: number, dt: number) => ist + (ziel - ist) * Math.min(1, rateProSek * dt);

/* ───────────────────────── Eingriffe (rein) ───────────────────────── */

/** Wendet einen Eingriff auf die Module an und gibt neue Module zurück (die alten bleiben unverändert). */
export function wendeModulAn(alt: ModellModule | undefined, e: ModulEingriff): ModellModule {
  const m: ModellModule = structuredClone(alt ?? {});
  if (e.perfusor) {
    const p = e.perfusor;
    const liste = m.perfusoren ?? [];
    const i = liste.findIndex((x) => x.id === p.id);
    if (p.stopp) {
      if (i >= 0) liste.splice(i, 1);
    } else {
      const vorher = i >= 0 ? liste[i] : { id: p.id, wirkstoff: p.wirkstoff ?? p.id, konzentration: p.konzentration ?? '', mlProH: 0 };
      const neu = {
        ...vorher,
        ...(p.wirkstoff !== undefined ? { wirkstoff: p.wirkstoff } : {}),
        ...(p.konzentration !== undefined ? { konzentration: p.konzentration } : {}),
        ...(p.mgProMl !== undefined ? { mgProMl: p.mgProMl } : {}),
      };
      neu.mlProH = Math.max(0, Math.round(((p.mlProH ?? vorher.mlProH) + (p.mlProHDelta ?? 0)) * 10) / 10);
      if (i >= 0) liste[i] = neu; else liste.push(neu);
    }
    m.perfusoren = liste;
  }
  if (e.beatmung === null) delete m.beatmung;
  else if (e.beatmung) m.beatmung = { fio2: 0.21, peep: 5, af: 14, vt: 500, ...m.beatmung, ...e.beatmung };
  if (e.arteriell !== undefined) m.arteriell = e.arteriell;
  if (e.rhythmus === null) delete m.rhythmus;
  else if (e.rhythmus) m.rhythmus = e.rhythmus;
  if (e.sedierung) m.sedierung = { ...e.sedierung };
  if (e.stoerungAn?.length || e.stoerungAus?.length) {
    const s = new Set<GeraeteStoerung>(m.stoerungen ?? []);
    for (const x of e.stoerungAn ?? []) s.add(x);
    for (const x of e.stoerungAus ?? []) s.delete(x);
    m.stoerungen = [...s];
  }
  return m;
}

/* ───────────────────────── Hilfsrechnungen ───────────────────────── */

const hat = (m: ModellModule, s: GeraeteStoerung) => !!m.stoerungen?.includes(s);

/** Auswurf-Faktor und Frequenz eines vorgegebenen Rhythmus. */
function rhythmusWirkung(r: Rhythmus | undefined): { pumpe: number; ohneAuswurf: boolean } {
  switch (r) {
    case 'vorhofflimmern': return { pumpe: 0.85, ohneAuswurf: false };
    case 'sinusbradykardie': return { pumpe: 0.75, ohneAuswurf: false };
    case 'vt': return { pumpe: 0.45, ohneAuswurf: false };
    case 'kammerflimmern': case 'asystolie': case 'pea': return { pumpe: 0.02, ohneAuswurf: true };
    default: return { pumpe: 1, ohneAuswurf: false };
  }
}

/** Beatmung, wie sie wirklich beim Patienten ankommt (Störungen eingerechnet). */
function wirksameBeatmung(m: ModellModule): ModellModule['beatmung'] {
  const b = m.beatmung;
  if (!b) return undefined;
  if (hat(m, 'diskonnektion')) return { ...b, vt: 0, fio2: 0.21, peep: 0 };
  if (hat(m, 'tubus-verlegt')) return { ...b, vt: Math.round(b.vt * 0.15) };
  if (hat(m, 'sekret')) return { ...b, vt: Math.round(b.vt * 0.8) };
  return b;
}

interface Wirksam { g: Grundgroessen; k: KontextMitWirkung; rhythmus?: Rhythmus; ohneAuswurf: boolean }

/** Grundgrößen und Kontext, wie das Basismodell sie für diesen Schritt sehen soll. */
function wirksam(g: Grundgroessen, k: ModellKontext): Wirksam {
  const m = k.module!;
  const kg = k.gewichtKg ?? STANDARD_GEWICHT;
  const p = perfusorEffekt(m.perfusoren, kg);
  const r = rhythmusWirkung(m.rhythmus);
  const sed = g.sedierung ?? 0;
  const wirkung: Wirkung = { ...(k as KontextMitWirkung).wirkung };
  const plus = (key: keyof Grundgroessen, d: number) => { if (d) wirkung[key] = (wirkung[key] ?? 0) + d; };
  plus('vigilanz', -0.85 * sed);
  plus('atemantrieb', -0.5 * sed - 0.3 * p.analgesie);
  plus('unruhe', -0.8 * sed);
  if (hat(m, 'sekret')) plus('gasaustausch', -0.12);
  return {
    g: {
      ...g,
      gefaesstonus: Math.max(0.05, g.gefaesstonus + p.tonus),
      pumpleistung: Math.max(0.02, (g.pumpleistung + p.pumpe) * r.pumpe),
      schmerz: g.schmerz * (1 - 0.8 * p.analgesie),
    },
    k: { ...k, module: { ...m, beatmung: wirksameBeatmung(m) }, wirkung },
    rhythmus: m.rhythmus,
    ohneAuswurf: r.ohneAuswurf,
  };
}

/** Details aus der Anzeige schätzen, falls das Basismodell keine liefert. */
function schaetze(a: Anzeige): BasisDetails {
  const map = a.rrDia + (a.rrSys - a.rrDia) / 3;
  return { map, perfusion: begrenze(map / 90, 0, 1.3), paco2: 40, pao2: po2AusSpo2(a.spo2) };
}

// Laktat und Stundenurin rechnet das Grundsystem Niere/Ausscheidung (G2); hier unverändert weiterverwendet.
export { laktatZiel, urinMlH } from '../physiologie/niere';

/* ───────────────────────── Die Hülle ───────────────────────── */

/** Spur-B-Hülle um ein Basismodell. `details` liefert MAP, Perfusion, paCO₂, paO₂ aus dem Basismodell (P1). */
export function spurB(basis: PhysiologieModell, details?: DetailQuelle): PhysiologieModell {
  const detail = (g: Grundgroessen, k: ModellKontext, a: Anzeige): BasisDetails => ({ ...schaetze(a), ...details?.(g, k, a) });

  return {
    naechster(g, treiber, dt, k) {
      if (!k.module) return basis.naechster(g, treiber, dt, k);
      const m = k.module;
      const kg = k.gewichtKg ?? STANDARD_GEWICHT;
      // Sedierung folgt dem Perfusor mit kurzer Anflutung (etwa 2 min), abklingend langsamer
      const ziel = perfusorEffekt(m.perfusoren, kg).sedierung;
      const sed0 = g.sedierung ?? 0;
      const sedierung = naeher(sed0, ziel, ziel > sed0 ? 1 / 120 : 1 / 300, dt);
      const w = wirksam({ ...g, sedierung }, k);
      const r = basis.naechster(w.g, treiber, dt, w.k);
      // Bestände Gefäßtonus/Pumpe ohne Medikamentenzuschlag fortschreiben (sonst würde das Begrenzen
      // des wirksamen Werts den Grundbestand dauerhaft absenken): Bestände ändern nur Treiber und Wirkkurven
      const roh = basis.naechster({ ...g, sedierung }, treiber, dt, k);
      const neu: Grundgroessen = {
        ...r,
        gefaesstonus: roh.gefaesstonus,
        pumpleistung: roh.pumpleistung,
        schmerz: g.schmerz + (r.schmerz - w.g.schmerz),
        sedierung,
      };
      const a = basis.anzeige(w.g, w.k);
      const d = detail(w.g, w.k, a);
      const map = w.ohneAuswurf ? 0 : d.map;
      const perfusion = w.ohneAuswurf ? 0 : d.perfusion;
      const sepsis = treiber.reduce((s, t) => (t.art === 'sepsis_verlauf' ? Math.max(s, t.tempo) : s), 0);
      const lz = laktatZiel(map, perfusion, w.ohneAuswurf ? 60 : a.spo2, sepsis);
      const l0 = g.laktat ?? 1;
      // Anstieg in Minuten, Clearance langsamer (Halbwert grob 1 h)
      neu.laktat = Math.round(naeher(l0, lz, lz > l0 ? 1 / 900 : 1 / 3600, dt) * 1000) / 1000;
      if (m.bilanz) {
        neu.ausfuhrMl = (g.ausfuhrMl ?? 0) + (urinMlH(map, g.volumen, kg) * dt) / 3600;
        neu.einfuhrMl = g.einfuhrMl ?? 0;
      }
      return neu;
    },

    anzeige(g, k) {
      if (!k.module) return basis.anzeige(g, k);
      const m = k.module;
      const kg = k.gewichtKg ?? STANDARD_GEWICHT;
      const w = wirksam(g, k);
      const a: Anzeige = { ...basis.anzeige(w.g, w.k) };
      const d = detail(w.g, w.k, a);
      let map = Math.round(d.map);

      // Rhythmus
      if (w.rhythmus) {
        a.rhythmus = w.rhythmus;
        if (w.rhythmus === 'vorhofflimmern') a.hf = Math.min(175, Math.max(105, Math.round(a.hf * 1.3)));
        else if (w.rhythmus === 'vt') a.hf = 185;
        else if (w.rhythmus === 'sinusbradykardie') a.hf = Math.min(a.hf, 42);
        else if (w.ohneAuswurf) {
          a.hf = w.rhythmus === 'pea' ? 45 : 0;
          a.rrSys = 0; a.rrDia = 0; map = 0; a.spo2 = 0; a.avpu = 'U'; a.gcs = 3;
        }
      }

      // Arterielle Druckmessung (Nullabgleich, Dämpfung)
      if (m.arteriell) {
        let sys = w.ohneAuswurf ? 0 : a.rrSys + 4;
        let dia = w.ohneAuswurf ? 0 : a.rrDia;
        if (hat(m, 'art-gedaempft') && !w.ohneAuswurf) { const mitte = map; sys = Math.round(mitte + (sys - mitte) * 0.45); dia = Math.round(mitte - (mitte - dia) * 0.45); }
        // ohne Nullabgleich: Werte verschoben (hier +18 mmHg), die Kurve sieht trotzdem normal aus
        const versatz = hat(m, 'art-nicht-genullt') ? 18 : 0;
        a.artSys = sys + versatz; a.artDia = dia + versatz;
        a.artGedaempft = hat(m, 'art-gedaempft');
        map += versatz;
      }
      a.map = map;
      const mapPhysiologisch = map - (m.arteriell && hat(m, 'art-nicht-genullt') ? 18 : 0);

      // Kapnografie: etCO₂ etwas unter paCO₂; Gradient wächst bei niedrigem HZV (Totraum)
      const b = m.beatmung;
      const keinGas = !!b && (hat(m, 'diskonnektion') || hat(m, 'tubus-verlegt'));
      const perfusion = w.ohneAuswurf ? 0.08 : d.perfusion;
      a.etco2 = keinGas ? 0 : Math.max(0, Math.round(d.paco2 * begrenze(perfusion, 0, 1) - 4));
      if (b) {
        a.af = hat(m, 'diskonnektion') ? 0 : b.af;
        // Spitzendruck: PEEP + Vt / Compliance (ca. 50 ml/cmH₂O), Sekret und verlegter Tubus erhöhen ihn
        const pp = b.peep + b.vt / 50 + (hat(m, 'sekret') ? 10 : 0) + (hat(m, 'tubus-verlegt') ? 28 : 0);
        a.ppeak = hat(m, 'diskonnektion') ? 0 : Math.round(pp);
      }

      // Sedierung → RASS
      a.rass = rass(w.g, g.sedierung ?? 0);

      // BGA
      const bga = bgaAusModell({ paco2: d.paco2, pao2: d.pao2, laktat: g.laktat ?? 1, kalium: g.kalium });
      Object.assign(a, bga);

      // Bilanz
      if (m.bilanz) {
        // Niere sieht den echten Druck, nicht den Messfehler des Druckaufnehmers
        a.urinMlH = urinMlH(w.ohneAuswurf ? 0 : mapPhysiologisch, g.volumen, kg);
        a.bilanzMl = Math.round((g.einfuhrMl ?? 0) - (g.ausfuhrMl ?? 0));
      }
      return a;
    },
  };
}

/** RASS aus Sedierung, Vigilanz und Unruhe (−5 nicht erweckbar … +4 streitlustig). */
export function rass(g: Grundgroessen, sedierung: number): number {
  const v = Math.min(g.vigilanz, 1 - 0.85 * sedierung);
  if (v >= 0.9 && g.unruhe > 0.25) return Math.min(4, Math.round(g.unruhe * 4));
  if (v >= 0.9) return 0;
  if (v >= 0.75) return -1;
  if (v >= 0.6) return -2;
  if (v >= 0.42) return -3;
  if (v >= 0.22) return -4;
  return -5;
}
