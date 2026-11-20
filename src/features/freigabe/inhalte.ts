// Alle Inhalte mit fachlicher Freigabe an einer Stelle (Audit F-1): Praxisfälle, Diagnostik,
// Reanimation, ABCDE, Fallsimulator, Handlungsvideos und Wissenstrainer. Je Inhalt eine feste ID,
// der Fingerabdruck der aktuellen Fassung und die Freigabe (mit übernommener Prüfung).

import { freigabeKern, inhaltsFingerabdruck, erteilungFuer, ERTEILT, type Erteilung } from '../../ui/sim/freigabe-erteilt';
import { istGeprueft, pruefReihenfolge, type Freigabe, type Risiko } from '../../ui/sim/freigabe';
import { HANDLUNGSVIDEOS } from '../../ui/sim/handlungsvideos';
import { FAELLE_V2 } from '../praxis/kern/faelle';
import { praxisFingerabdruck, praxisFreigabe } from '../praxis/kern/freigabe';
import { FAELLE as DIAGNOSTIK_FAELLE } from '../diagnostik/faelle';
import { diagnostikFingerabdruck, freigabeFuer as diagnostikFreigabe } from '../diagnostik/freigaben';
import { PROFIL_FREIGABE, NOTFALL_FREIGABE, notfallFingerabdruck } from '../notfall/freigaben';
import { SZENARIEN } from '../fall/faelle';
import { PROBEFAELLE } from '../fall/demo';
import { fallFingerabdruck, freigabeFuerFall } from '../fall/freigaben';
import { TRAINER_REGISTER } from '../qm/register';

export type Bereich = 'Praxissimulator' | 'Diagnostik' | 'Reanimation' | 'ABCDE-Notfall' | 'Fallsimulator' | 'Handlungsvideos' | 'Wissenstrainer';
export const BEREICHE: Bereich[] = ['Praxissimulator', 'Diagnostik', 'Reanimation', 'ABCDE-Notfall', 'Fallsimulator', 'Handlungsvideos', 'Wissenstrainer'];

export interface PruefInhalt {
  id: string;
  name: string;
  bereich: Bereich;
  pfad: string;
  fp: string;
  freigabe: Freigabe;
}

/** Stand eines Inhalts auf der Freigabe-Seite. */
export type FreigabeStatus = 'offen' | 'geaendert' | 'abgeglichen' | 'nachbessern' | 'geprueft';
export const FREIGABE_STATUS_TEXT: Record<FreigabeStatus, string> = {
  offen: 'Noch nicht geprüft',
  geaendert: 'Seit der Prüfung geändert',
  abgeglichen: 'Mit Unterrichtsmaterial abgeglichen',
  nachbessern: 'Prüfung mit Änderungswunsch',
  geprueft: 'Fachlich geprüft',
};

let cache: PruefInhalt[] | null = null;

/** Alle prüfbaren Inhalte, in fester Reihenfolge nach Bereich. */
export function alleInhalte(): PruefInhalt[] {
  if (cache) return cache;
  const out: PruefInhalt[] = [];
  for (const f of FAELLE_V2) out.push({ id: `praxis:${f.id}`, name: f.titel.replace(/[„“]/g, ''), bereich: 'Praxissimulator', pfad: `/lernen/praxis?neu=${f.id}`, fp: praxisFingerabdruck(f), freigabe: praxisFreigabe(f) });
  for (const f of DIAGNOSTIK_FAELLE) {
    const fr = diagnostikFreigabe(f);
    if (fr) out.push({ id: `diagnostik:${f.id}`, name: f.titel, bereich: 'Diagnostik', pfad: '/lernen/diagnostik', fp: diagnostikFingerabdruck(f, fr), freigabe: fr });
  }
  for (const [id, f] of Object.entries(PROFIL_FREIGABE)) out.push({ id: `rea:${id}`, name: `Reanimation ${id}`, bereich: 'Reanimation', pfad: '/lernen/fertigkeiten?uebung=rea', fp: notfallFingerabdruck(f), freigabe: f });
  for (const [id, f] of Object.entries(NOTFALL_FREIGABE)) out.push({ id: `abcde:${id}`, name: `ABCDE ${id}`, bereich: 'ABCDE-Notfall', pfad: '/lernen/fertigkeiten?uebung=abcde', fp: notfallFingerabdruck(f), freigabe: f });
  for (const s of [...SZENARIEN, ...PROBEFAELLE.map((p) => p.szenario)]) {
    const f = freigabeFuerFall(s);
    out.push({ id: `fall:${s.id}`, name: s.titel, bereich: 'Fallsimulator', pfad: '/lernen/fall', fp: fallFingerabdruck(s, f), freigabe: f });
  }
  for (const [id, v] of Object.entries(HANDLUNGSVIDEOS)) out.push({ id: `video:${id}`, name: v.titel, bereich: 'Handlungsvideos', pfad: '/lernen/praxis', fp: inhaltsFingerabdruck([freigabeKern(v.freigabe), v.schritte]), freigabe: v.freigabe });
  for (const r of TRAINER_REGISTER) out.push({ id: `trainer:${r.quelle}`, name: `${r.name}-Trainer`, bereich: 'Wissenstrainer', pfad: r.pfad, fp: inhaltsFingerabdruck(freigabeKern(r.freigabe)), freigabe: r.freigabe });
  cache = out;
  return out;
}

/** Stand je Inhalt aus den übernommenen Prüfungen (und optional lokal erfassten, z. B. für die Vorschau). */
export function freigabeStatus(i: PruefInhalt, liste: readonly Erteilung[] = ERTEILT): FreigabeStatus {
  if (istGeprueft(i.freigabe) && liste === ERTEILT) return 'geprueft';
  const st = erteilungFuer(i.id, i.fp, liste);
  if (!st) return 'offen';
  if (!st.aktuell) return 'geaendert';
  if (st.erteilung.urteil !== 'freigegeben') return 'nachbessern';
  return st.erteilung.art === 'fachperson' ? 'geprueft' : 'abgeglichen';
}

const RISIKO_GEWICHT: Record<Risiko, number> = { medikament: 8, notfall: 4, kinder: 2, geraet: 1 };
export const risikoGewicht = (f: Freigabe) => f.risiken.reduce((s, r) => s + RISIKO_GEWICHT[r], 0);

/** Reihenfolge für die Prüfung: Medikamente, Notfall, Kinder, Geräte zuerst (wie pruefReihenfolge). */
export function zuPruefen(inhalte: readonly PruefInhalt[] = alleInhalte()): PruefInhalt[] {
  return pruefReihenfolge(inhalte.map((i) => ({ ...i })));
}
