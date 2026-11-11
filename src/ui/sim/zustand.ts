// Einheitliche Zustandskomponenten für Simulationen (Audit SIM-07: „Zustandskomponenten für Gerät,
// Material, Patient, Alarme und Aufgaben zuerst vereinheitlichen“). Jede Simulation liefert über einen
// eigenen Adapter dieselbe Form; ZustandsTafel zeigt sie einheitlich und zugänglich an.

/** normal: unauffällig · achtung: beobachten · kritisch: sofort handeln · aus: nicht vorhanden/aus */
export type ZustandStufe = 'normal' | 'achtung' | 'kritisch' | 'aus';

export interface ZustandEintrag { id: string; label: string; wert: string; stufe: ZustandStufe }
export type AufgabeStatus = 'offen' | 'dringend' | 'erledigt';
export interface AufgabeEintrag { id: string; titel: string; status: AufgabeStatus; hinweis?: string }

export interface SimZustand {
  patient: ZustandEintrag[];
  geraete: ZustandEintrag[];
  material: ZustandEintrag[];
  /** Nur aktive Alarme und Meldungen; leer heißt: nichts schlägt an. */
  alarme: ZustandEintrag[];
  aufgaben: AufgabeEintrag[];
}

export const BEREICH_LABEL = { patient: 'Patient', geraete: 'Geräte', material: 'Material', alarme: 'Alarme', aufgaben: 'Aufgaben' } as const;
export type Bereich = keyof typeof BEREICH_LABEL;
export const BEREICHE: Bereich[] = ['alarme', 'patient', 'geraete', 'material', 'aufgaben'];

const RANG: Record<ZustandStufe, number> = { kritisch: 3, achtung: 2, normal: 1, aus: 0 };

export function hoechsteStufe(e: ZustandEintrag[]): ZustandStufe {
  return e.reduce<ZustandStufe>((m, x) => (RANG[x.stufe] > RANG[m] ? x.stufe : m), 'aus');
}

/** Alarme nach Schwere sortiert (kritisch zuerst), stabil in der Reihenfolge der Quelle. */
export function sortiereAlarme(a: ZustandEintrag[]): ZustandEintrag[] {
  return a.map((x, i) => ({ x, i })).sort((p, q) => RANG[q.x.stufe] - RANG[p.x.stufe] || p.i - q.i).map((p) => p.x);
}

/** Kurztext für Screenreader und Statuszeile, z. B. „1 kritischer Alarm, 2 Aufgaben offen“. */
export function zusammenfassung(z: SimZustand): string {
  const krit = z.alarme.filter((a) => a.stufe === 'kritisch').length;
  const sonst = z.alarme.length - krit;
  const offen = z.aufgaben.filter((a) => a.status !== 'erledigt').length;
  const dringend = z.aufgaben.filter((a) => a.status === 'dringend').length;
  const teile: string[] = [];
  if (krit) teile.push(`${krit} ${krit === 1 ? 'kritischer Alarm' : 'kritische Alarme'}`);
  if (sonst) teile.push(`${sonst} ${sonst === 1 ? 'Meldung' : 'Meldungen'}`);
  if (!z.alarme.length) teile.push('kein Alarm');
  teile.push(offen ? `${offen} ${offen === 1 ? 'Aufgabe' : 'Aufgaben'} offen${dringend ? `, davon ${dringend} dringend` : ''}` : 'alle Aufgaben erledigt');
  return teile.join(', ');
}

/** Prüft die Form (für Adapter-Tests): eindeutige IDs je Bereich, keine leeren Texte. */
export function formFehler(z: SimZustand): string[] {
  const f: string[] = [];
  for (const b of BEREICHE) {
    const liste = z[b] as { id: string }[];
    const ids = liste.map((x) => x.id);
    if (new Set(ids).size !== ids.length) f.push(`${b}: doppelte IDs`);
    for (const x of liste) {
      const t = 'label' in x ? `${(x as ZustandEintrag).label}${(x as ZustandEintrag).wert}` : (x as AufgabeEintrag).titel;
      if (!String(t).trim()) f.push(`${b}/${x.id}: leer`);
    }
  }
  return f;
}
