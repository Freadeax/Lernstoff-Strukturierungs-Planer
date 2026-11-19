// Wo nutzt die App welche Quelle? Sammelt die Quellenangaben aller Inhalte mit fachlicher Freigabe
// (Trainer, Reanimation, ABCDE, Praxissimulator, Fallsimulator, Diagnostik, Handlungsvideos) und die
// Originalquellen der Assessment-Instrumente. Neue Inhalte mit Freigabe hier ergänzen; der Test
// quellen.test.ts verlangt dann für jede Quellenangabe einen Eintrag im Quellenregister.

import type { Freigabe, Quelle } from '../../ui/sim/freigabe';
import { HANDLUNGSVIDEOS } from '../../ui/sim/handlungsvideos';
import { TRAINER_REGISTER } from '../qm/register';
import { PROFIL_FREIGABE, NOTFALL_FREIGABE } from '../notfall/freigaben';
import { SCENARIOS } from '../praxis/catalog';
import { freigabeFuer as praxisFreigabe } from '../praxis/freigaben';
import { FAELLE as DIAGNOSTIK_FAELLE } from '../diagnostik/faelle';
import { freigabeFuer as diagnostikFreigabe } from '../diagnostik/freigaben';
import { SZENARIEN } from '../fall/faelle';
import { PROBEFAELLE } from '../fall/demo';
import { freigabeFuerFall } from '../fall/freigaben';
import { STECKBRIEFE } from '../assessment/steckbriefe';
import { KATALOG_LISTE } from '../praxis/kern/katalog';
import { FAELLE_V2 } from '../praxis/kern/faelle';

/** Ein Inhalt der App, der sich auf eine Quelle stützt. */
export interface Nutzung {
  /** Name des Inhalts, z. B. „Praxisfall Herzschwäche“. */
  inhalt: string;
  /** Bereich für die Gruppierung, z. B. „Praxissimulator“. */
  bereich: string;
  pfad: string;
  quelle: Quelle;
  /** Notfall- oder Medikamenteninhalt: bei veralteter Quelle zuerst abgleichen. */
  risiko: boolean;
}

function aus(bereich: string, inhalt: string, pfad: string, f: Freigabe | undefined): Nutzung[] {
  if (!f) return [];
  const risiko = f.risiken.some((r) => r === 'notfall' || r === 'medikament');
  return f.quellen.map((quelle) => ({ inhalt, bereich, pfad, quelle, risiko }));
}

let cache: Nutzung[] | null = null;

/** Quellenangabe des Kerns (nur Titel) → Titel + Stand (erste Jahreszahl im Titel). */
export function kernQuelle(titel: string): Quelle {
  return { titel, stand: titel.match(/(?:19|20)\d{2}/)?.[0] ?? 'ohne Jahresangabe' };
}

/** Alle Quellenangaben der App mit dem Inhalt, der sie nutzt. */
export function alleNutzungen(): Nutzung[] {
  if (cache) return cache;
  const out: Nutzung[] = [];
  for (const r of TRAINER_REGISTER) out.push(...aus('Übungstrainer', `${r.name}-Trainer`, r.pfad, r.freigabe));
  for (const [id, f] of Object.entries(PROFIL_FREIGABE)) out.push(...aus('Reanimation', `Reanimation ${id}`, '/lernen/notfall?modus=rea', f));
  for (const [id, f] of Object.entries(NOTFALL_FREIGABE)) out.push(...aus('ABCDE-Notfall', `ABCDE ${id}`, '/lernen/notfall?modus=abcde', f));
  for (const s of SCENARIOS) out.push(...aus('Praxissimulator', `Praxisfall ${s.title}`, '/lernen/praxis', praxisFreigabe(s)));
  for (const f of DIAGNOSTIK_FAELLE) out.push(...aus('Diagnostik', `Diagnostik ${f.titel}`, '/lernen/diagnostik', diagnostikFreigabe(f)));
  for (const s of [...SZENARIEN, ...PROBEFAELLE.map((p) => p.szenario)]) out.push(...aus('Fallsimulator', `Fall ${s.titel}`, '/lernen/fall', freigabeFuerFall(s)));
  for (const v of Object.values(HANDLUNGSVIDEOS)) out.push(...aus('Handlungsvideos', `Video ${v.titel}`, '/lernen/praxis', v.freigabe));
  // Praxissimulator neu (Kern): Fälle und Handlungskatalog. Stand = erste Jahreszahl der Quellenangabe (Audit P20).
  for (const f of FAELLE_V2) for (const q of f.quellen) out.push({ inhalt: `Praxisfall (neu) ${f.titel.replace(/[„“]/g, '')}`, bereich: 'Praxissimulator (neu)', pfad: `/lernen/praxis?neu=${f.id}`, quelle: kernQuelle(q.titel), risiko: f.spur === 'B' });
  for (const m of KATALOG_LISTE) for (const q of m.quellen ?? []) out.push({ inhalt: `Maßnahme ${m.name}`, bereich: 'Praxissimulator (neu)', pfad: '/lernen/praxis', quelle: kernQuelle(q.titel), risiko: !!m.anordnungspflichtig });
  for (const [id, s] of Object.entries(STECKBRIEFE)) out.push({ inhalt: `Assessment ${id}`, bereich: 'Assessment-Trainer', pfad: '/lernen/assessment', quelle: s.original, risiko: false });
  cache = out;
  return out;
}

/** Quellenangaben, die keine überprüfbare Fassung haben (Produkt, Lehrbuch, Hausformular). */
export const ALLGEMEINE_STAENDE = /^(je Produkt|Lehrbuchstand|Formularversion der Einrichtung)$/;
