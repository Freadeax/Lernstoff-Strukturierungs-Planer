// Praxissimulator neu – Modell-Schnittstelle (Paket P0) und vorläufiges Platzhalter-Modell.
// Paket P1 ersetzt PLATZHALTER_MODELL durch das gekoppelte Pflege-Physiologiemodell,
// Paket P1b ergänzt die Spur-B-Module (Beatmung, Perfusoren, arterieller Druck, BGA, Rhythmus).
// Der Kern kennt nur diese Schnittstelle. Wirkkurven von Maßnahmen rechnet der Kern selbst (kern.ts).

import type { Altersgruppe, Anzeige, Grundgroessen, ModellModule, Rhythmus, Treiber } from './typen';

export interface ModellKontext {
  altersgruppe: Altersgruppe;
  module?: ModellModule;
}

export interface PhysiologieModell {
  /** Ein Logik-Schritt (dt ≤ 5 s): Treiber verändern die Grundgrößen. Rein, ohne Zufall. */
  naechster(grund: Grundgroessen, treiber: readonly Treiber[], dtSek: number, kontext: ModellKontext): Grundgroessen;
  /** Zielwerte für Monitor und Messungen. Rein. */
  anzeige(grund: Grundgroessen, kontext: ModellKontext): Anzeige;
}

export const NORMAL: Grundgroessen = {
  volumen: 1, pumpleistung: 1, gefaesstonus: 1,
  atemantrieb: 1, atemarbeit: 1, gasaustausch: 1,
  blutzucker: 100, temperatur: 36.8, hydratation: 1,
  vigilanz: 1, orientierung: 1, delir: 0, unruhe: 0, schmerz: 0, angst: 0, uebelkeit: 0,
};

const begrenze = (x: number, min = 0, max = 1.5) => Math.min(max, Math.max(min, x));
const naeher = (ist: number, ziel: number, rate: number, dt: number) => ist + (ziel - ist) * Math.min(1, rate * dt);

const RUHEPULS: Record<Altersgruppe, number> = { saeugling: 130, kleinkind: 110, schulkind: 90, jugendlich: 75, erwachsen: 75, hochbetagt: 75 };
const RUHE_AF: Record<Altersgruppe, number> = { saeugling: 40, kleinkind: 28, schulkind: 20, jugendlich: 16, erwachsen: 14, hochbetagt: 16 };
const RR_SYS: Record<Altersgruppe, number> = { saeugling: 85, kleinkind: 95, schulkind: 105, jugendlich: 115, erwachsen: 125, hochbetagt: 130 };

/** Grobes, monotones Platzhalter-Modell. Nur damit Kern und Tests laufen; fachlich KEIN Lernmodell. */
export const PLATZHALTER_MODELL: PhysiologieModell = {
  naechster(alt, treiber, dt) {
    const g: Grundgroessen = { ...alt };
    const min = dt / 60;
    for (const tr of treiber) {
      switch (tr.art) {
        case 'exsikkose_progressiv':
          g.hydratation -= (tr.verlustProStunde * dt) / 3600;
          g.volumen -= (tr.verlustProStunde * 0.8 * dt) / 3600;
          break;
        case 'delir_trigger': {
          const aktiv =
            (tr.ausloeser.includes('exsikkose') && g.hydratation < 0.85) ||
            (tr.ausloeser.includes('schmerz') && g.schmerz >= 5) ||
            (tr.ausloeser.includes('infekt') && g.temperatur >= 38.3) ||
            (tr.ausloeser.includes('medikamente') && g.vigilanz < 0.8);
          g.delir += aktiv ? 0.01 * min : -0.004 * min;
          break;
        }
        case 'blutung':
          g.volumen -= (tr.mlProMin * min) / 5000;
          break;
        case 'bronchospasmus':
          g.atemarbeit = naeher(g.atemarbeit, 1 + tr.staerke, 0.01, dt);
          g.gasaustausch = naeher(g.gasaustausch, 1 - 0.3 * tr.staerke, 0.01, dt);
          break;
        case 'pneumonie':
          g.gasaustausch = naeher(g.gasaustausch, 1 - 0.25 * tr.staerke, 0.002, dt);
          g.temperatur = naeher(g.temperatur, 38.6, 0.002, dt);
          break;
        case 'hypoglykaemie':
          g.blutzucker -= (tr.abfallProStunde * dt) / 3600;
          break;
        case 'sepsis_verlauf':
          g.gefaesstonus -= 0.02 * tr.tempo * min;
          g.temperatur = naeher(g.temperatur, 39.2, 0.002, dt);
          break;
        case 'opioid_ueberhang': {
          // Abbau über halbwertMin rechnet erst P1
          g.atemantrieb = naeher(g.atemantrieb, 1 - 0.6 * tr.spiegel, 0.01, dt);
          break;
        }
        case 'panik_eskaliert':
          g.angst += 0.02 * tr.tempo * min;
          break;
        case 'fieberkrampf_kind':
          break;
      }
    }
    // einfache Kopplungen
    if (g.blutzucker < 60) g.vigilanz = naeher(g.vigilanz, 0.4, 0.01, dt);
    g.orientierung = 1 - 0.9 * begrenze(g.delir, 0, 1);
    g.unruhe = naeher(g.unruhe, 0.8 * begrenze(g.delir, 0, 1), 0.01, dt);
    for (const k of ['volumen', 'pumpleistung', 'gefaesstonus', 'atemantrieb', 'gasaustausch', 'hydratation', 'vigilanz', 'orientierung', 'delir', 'unruhe', 'angst', 'uebelkeit'] as const) {
      g[k] = begrenze(g[k], 0, k === 'delir' || k === 'unruhe' || k === 'angst' || k === 'uebelkeit' || k === 'orientierung' || k === 'vigilanz' ? 1 : 1.5);
    }
    g.atemarbeit = begrenze(g.atemarbeit, 0.5, 3);
    g.schmerz = begrenze(g.schmerz, 0, 10);
    return g;
  },

  anzeige(g, { altersgruppe }) {
    const kreislauf = g.volumen * g.pumpleistung * Math.sqrt(g.gefaesstonus);
    const hf = Math.round(RUHEPULS[altersgruppe] + (1 - kreislauf) * 150 + (g.temperatur - 37) * 8 + g.angst * 12 + g.schmerz * 1.5);
    const rrSys = Math.round(RR_SYS[altersgruppe] - (1 - kreislauf) * 180);
    const af = Math.round(RUHE_AF[altersgruppe] * g.atemantrieb + (g.atemarbeit - 1) * 18 + (1 - g.gasaustausch) * 20 + g.angst * 4 + (1 - kreislauf) * 10);
    const spo2 = Math.round(Math.min(99, 98 - (1 - g.gasaustausch) * 40 - (1 - g.atemantrieb) * 25));
    const rhythmus: Rhythmus = hf > 100 ? 'sinustachykardie' : hf < 50 ? 'sinusbradykardie' : 'sinus';
    const avpu = g.vigilanz > 0.8 ? 'A' : g.vigilanz > 0.55 ? 'V' : g.vigilanz > 0.3 ? 'P' : 'U';
    return {
      hf, rrSys, rrDia: Math.round(rrSys * 0.6), af: Math.max(4, af), spo2, temp: Math.round(g.temperatur * 10) / 10,
      bz: Math.round(g.blutzucker), rhythmus, avpu,
    };
  },
};
