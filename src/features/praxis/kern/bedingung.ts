// Praxissimulator neu – Bedingungen auswerten (rein).

import type { Anzeige, AuftragStatus, Bedingung, Gegenueber, Grundgroessen } from './typen';

export interface BedingungsKontext {
  t: number;
  getan: Readonly<Record<string, readonly number[]>>;
  flags: readonly string[];
  grund: Grundgroessen;
  anzeige: () => Anzeige;
  letzterAnruf: readonly string[];
  anordnungen: Readonly<Record<string, { rueckgelesen: boolean }>>;
  /** P11: Rückauftrag im Status (siehe kommunikation.ts auftragGilt) */
  auftrag?: (id: string, status: AuftragStatus) => boolean;
  /** P11: Baustein irgendwann im Fall an … gesagt */
  gesagt?: (id: string, an?: Gegenueber) => boolean;
}

const vergleiche = (a: number, v: '<' | '<=' | '>' | '>=', b: number) =>
  v === '<' ? a < b : v === '<=' ? a <= b : v === '>' ? a > b : a >= b;

export function pruefe(b: Bedingung, k: BedingungsKontext): boolean {
  if ('alle' in b) return b.alle.every((x) => pruefe(x, k));
  if ('eine' in b) return b.eine.some((x) => pruefe(x, k));
  if ('nicht' in b) return !pruefe(b.nicht, k);
  if ('nichtGetan' in b) {
    const z = k.getan[b.nichtGetan];
    return k.t >= b.bis && !(z && z.length > 0 && z[0] <= b.bis);
  }
  if ('getan' in b) {
    const z = k.getan[b.getan];
    return !!z && z.length > 0 && (b.bis === undefined || z[0] <= b.bis);
  }
  if ('ab' in b) return k.t >= b.ab;
  if ('flag' in b) return k.flags.includes(b.flag);
  // P13: Baustein steht im Pflegebericht (der Kern markiert `doku:<baustein>`)
  if ('dokumentiert' in b) return (k.getan[`doku:${b.dokumentiert}`]?.length ?? 0) > 0;
  if ('gemeldet' in b) return b.gemeldet.every((id) => k.letzterAnruf.includes(id));
  if ('anordnung' in b) {
    const a = k.anordnungen[b.anordnung];
    return !!a && (b.rueckgelesen === undefined || a.rueckgelesen === b.rueckgelesen);
  }
  if ('auftrag' in b) return !!k.auftrag?.(b.auftrag, b.status);
  if ('gesagt' in b) return !!k.gesagt?.(b.gesagt, b.an);
  if ('wert' in b) {
    const w = b.wert in k.grund ? k.grund[b.wert as keyof Grundgroessen] : k.anzeige()[b.wert as keyof Anzeige];
    return typeof w === 'number' && vergleiche(w, b.vergleich, b.grenze);
  }
  return false;
}
