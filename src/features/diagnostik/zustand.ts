// Adapter Diagnostik → einheitliche Zustandskomponenten (src/ui/sim/zustand.ts, Audit SIM-07).
import { alarmStufe, monitorGruppe, type MonitorParameter } from '../../ui/sim/monitor';
import type { AufgabeEintrag, SimZustand, ZustandEintrag } from '../../ui/sim/zustand';
import { parameter } from '../../ui/sim/labor/parameter';
import { ergebnisse, monitorZustand, offeneAnrufe, offeneMeldungen, vitalwerte, type Lauf } from './lauf';
import type { DiagnostikFall } from './typen';

const NAME: Record<'puls' | 'af' | 'spo2' | 'sys' | 'temp', string> = { puls: 'Puls', af: 'Atemfrequenz', spo2: 'SpO₂', sys: 'RR systolisch', temp: 'Temperatur' };
const EINHEIT: Record<keyof typeof NAME, string> = { puls: '/min', af: '/min', spo2: ' %', sys: ' mmHg', temp: ' °C' };

export function diagnostikZustand(l: Lauf, fall: DiagnostikFall): SimZustand {
  const p = fall.patient;
  const status = monitorZustand(l, fall);
  const w = vitalwerte(l, fall);
  const gruppe = monitorGruppe(p.alter);

  const patient: ZustandEintrag[] = [
    { id: 'person', label: p.name, wert: `${p.alter} Jahre, ${p.gewicht} kg`, stufe: 'normal' },
    { id: 'anlass', label: 'Anlass', wert: p.anlass, stufe: 'normal' },
    { id: 'allergien', label: 'Allergien', wert: p.allergien, stufe: /keine/i.test(p.allergien) ? 'normal' : 'achtung' },
  ];

  const geraete: ZustandEintrag[] = [
    { id: 'monitor', label: 'Monitor', wert: status === 'abwesend' ? 'nicht angeschlossen' : status === 'signalausfall' ? 'läuft, SpO₂ ohne Signal' : 'läuft', stufe: status === 'abwesend' ? 'aus' : status === 'signalausfall' ? 'achtung' : 'normal' },
    { id: 'sauerstoff', label: 'Sauerstoff', wert: w.sauerstoff ? 'läuft' : 'aus', stufe: w.sauerstoff ? 'normal' : 'aus' },
  ];

  const material: ZustandEintrag[] = [];
  if (p.infusion) material.push({ id: 'infusion', label: 'Infusion', wert: p.infusion, stufe: 'normal' });
  for (const a of ergebnisse(l, fall)) {
    const fertig = a.ergebnisse.every((e) => e.fertig <= l.minute);
    material.push({ id: `probe:${a.auftrag.id}`, label: `Probe ${a.auftrag.id.slice(1)}`, wert: `${a.auftrag.parameter.length} Parameter, ${a.fehler.some((f) => f.abgelehnt) ? 'abgelehnt' : fertig ? 'Befund da' : 'unterwegs'}`, stufe: a.fehler.some((f) => f.abgelehnt) ? 'kritisch' : a.fehler.length ? 'achtung' : 'normal' });
  }
  for (const u of l.untersuchungen) material.push({ id: `bild:${u.serie}`, label: 'Bildgebung', wert: `${u.serie}, ${u.befundAb <= l.minute ? 'Befund da' : 'läuft'}`, stufe: 'normal' });

  const alarme: ZustandEintrag[] = [];
  if (status !== 'abwesend') {
    for (const k of Object.keys(NAME) as (keyof typeof NAME)[]) {
      if (k === 'spo2' && status === 'signalausfall') continue;
      const st = alarmStufe(k as MonitorParameter, w[k], gruppe);
      if (st !== 'ok') alarme.push({ id: `vital:${k}`, label: NAME[k], wert: `${w[k]}${EINHEIT[k]}`, stufe: st === 'rot' ? 'kritisch' : 'achtung' });
    }
    if (status === 'signalausfall') alarme.push({ id: 'sensor', label: 'Fingersensor', wert: 'kein Signal', stufe: 'achtung' });
  }
  for (const a of offeneAnrufe(l, fall)) alarme.push({ id: `anruf:${a.schluessel}`, label: 'Laboranruf', wert: `kritischer Wert ${parameter(a.ergebnis.parameter).name}`, stufe: 'kritisch' });
  for (const a of offeneMeldungen(l, fall)) alarme.push({ id: `melden:${a.schluessel}`, label: 'Nachmeldung offen', wert: parameter(a.ergebnis.parameter).name, stufe: 'achtung' });

  const krit = alarme.some((a) => a.stufe === 'kritisch');
  const aufgaben: AufgabeEintrag[] = [
    { id: 'labor', titel: 'Labor anfordern und abnehmen', status: l.auftraege.length ? 'erledigt' : 'offen' },
    { id: 'sbar', titel: 'Ärztin oder Arzt per SBAR informieren', status: l.sbar ? 'erledigt' : krit ? 'dringend' : 'offen' },
    ...(l.sbar ? fall.anordnungen.map((o): AufgabeEintrag => ({ id: `anordnung:${o.id}`, titel: o.label, status: l.flags[o.flag] !== undefined ? 'erledigt' : 'offen' })) : []),
    { id: 'abschluss', titel: 'Fall abschließen und auswerten', status: l.beendet !== undefined ? 'erledigt' : 'offen' },
  ];
  return { patient, geraete, material, alarme, aufgaben };
}
