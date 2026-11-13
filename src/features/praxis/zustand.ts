// Adapter Praxissimulator → einheitliche Zustandskomponenten (src/ui/sim/zustand.ts, Audit SIM-07).
// Liest nur Spielstand und Szenenzustand; keine eigene Logik, damit Anzeige und Simulation übereinstimmen.
import type { AufgabeEintrag, SimZustand, ZustandEintrag, ZustandStufe } from '../../ui/sim/zustand';
import { auftragsSchritte } from './auftrag';
import { clock } from './engine';
import { szene, type Lage } from './szene';
import { RESOURCES } from './catalog';
import { alterText, type Session } from './types';

const LAGE: Record<Lage, string> = { normal: 'Rückenlage', erhoeht: 'Oberkörper hoch', flach: 'flach', schock: 'Schocklage', bein: 'Bein hochgelagert', sitzend: 'sitzend' };
const AVPU: Record<string, string> = { A: 'wach', C: 'neu verwirrt', V: 'reagiert auf Ansprache', P: 'reagiert auf Schmerz', U: 'reagiert nicht' };
const STUFE3: ZustandStufe[] = ['normal', 'achtung', 'kritisch'];

export function praxisZustand(s: Session): SimZustand {
  const z = szene(s);
  const r = RESOURCES[s.scenario.setting];
  const m = s.measured;

  const patient: ZustandEintrag[] = [
    { id: 'person', label: s.scenario.patient, wert: alterText(s.scenario.age), stufe: 'normal' },
    { id: 'bewusstsein', label: 'Bewusstsein', wert: AVPU[z.avpu] ?? z.avpu, stufe: z.avpu === 'A' ? 'normal' : z.avpu === 'C' || z.avpu === 'V' ? 'achtung' : 'kritisch' },
    { id: 'atmung', label: 'Atmung', wert: ['ruhig', 'angestrengt', 'schwere Atemnot'][z.atemnot]!, stufe: STUFE3[z.atemnot]! },
    { id: 'schmerz', label: 'Schmerz', wert: ['kaum', 'mäßig', 'stark'][z.schmerz]!, stufe: STUFE3[z.schmerz]! },
    { id: 'haut', label: 'Haut', wert: z.schwitzen ? `${z.haut}, schwitzt` : z.haut, stufe: z.haut === 'rosig' ? 'normal' : z.haut === 'zyanotisch' || z.haut === 'grau' ? 'kritisch' : 'achtung' },
    { id: 'lage', label: 'Lage', wert: LAGE[z.lage], stufe: 'normal' },
  ];

  const geraete: ZustandEintrag[] = [
    r.monitor
      ? { id: 'monitor', label: 'Monitor', wert: s.monitoring ? 'läuft' : 'nicht angeschlossen', stufe: s.monitoring ? 'normal' : 'aus' }
      : { id: 'messgeraete', label: 'Messgeräte', wert: s.measuredAt !== null ? `zuletzt gemessen ${clock(s.measuredAt)}` : 'noch nicht gemessen', stufe: s.measuredAt !== null ? 'normal' : 'aus' },
    { id: 'sauerstoff', label: 'Sauerstoff', wert: z.sauerstoff ? 'läuft' : 'aus', stufe: z.sauerstoff ? 'normal' : 'aus' },
    { id: 'telefon', label: 'Telefon', wert: z.telefonKlingelt ? 'klingelt' : 'ruhig', stufe: z.telefonKlingelt ? 'achtung' : 'aus' },
  ];

  const material: ZustandEintrag[] = [
    { id: 'zugang', label: 'Venöser Zugang', wert: z.zugang ? 'liegt' : 'keiner', stufe: z.zugang ? 'normal' : 'aus' },
    { id: 'infusion', label: 'Infusion', wert: z.infusion ? 'läuft' : 'keine', stufe: z.infusion ? 'normal' : 'aus' },
    ...s.done.filter((d) => d.startsWith('med:')).map((d) => {
      const med = s.scenario.medications.find((x) => `med:${x.id}` === d);
      return { id: d, label: 'Medikament', wert: `${med?.name ?? d.slice(4)} gegeben`, stufe: 'normal' as const };
    }),
  ];

  const alarme: ZustandEintrag[] = [];
  if (z.alarm === 'rot' || z.alarm === 'gelb') {
    const v = [m.pulse !== undefined && `Puls ${m.pulse}`, m.spo2 !== undefined && `SpO₂ ${m.spo2} %`, m.sys !== undefined && `RR ${m.sys}/${m.dia ?? '–'}`].filter(Boolean).join(', ');
    alarme.push({ id: 'monitor', label: 'Monitoralarm', wert: v || 'Grenzwerte überschritten', stufe: z.alarm === 'rot' ? 'kritisch' : 'achtung' });
  }
  if (z.komplikation) {
    const k = [...s.events].reverse().find((e) => e.kind === 'story' && e.title.startsWith('Komplikation'));
    alarme.push({ id: 'komplikation', label: 'Komplikation', wert: k ? k.title.replace(/^Komplikation:\s*/, '') : 'neu eingetreten', stufe: 'kritisch' });
  }
  if (z.telefonKlingelt) alarme.push({ id: 'telefon', label: 'Telefon', wert: 'Anruf oder neues Ergebnis', stufe: 'achtung' });
  for (const id of s.open ?? []) {
    const e = s.scenario.storyline?.find((x) => x.id === id);
    if (e) alarme.push({ id: `entscheidung:${id}`, label: 'Entscheidung offen', wert: e.title, stufe: 'achtung' });
  }

  const aufgaben: AufgabeEintrag[] = [
    ...auftragsSchritte(s).map((a) => ({ id: a.id, titel: a.titel, status: a.erledigt ? 'erledigt' as const : 'offen' as const, hinweis: a.erledigt ? undefined : a.hinweis })),
    ...s.pending.map((p) => ({ id: `wartet:${p.id}`, titel: p.title, status: 'offen' as const, hinweis: `Ergebnis um ${clock(p.due)}` })),
  ].map((a): AufgabeEintrag => (a.hinweis === undefined ? { id: a.id, titel: a.titel, status: a.status } : { ...a, hinweis: a.hinweis }));
  // Kritischer Alarm macht den nächsten offenen Arbeitsschritt dringend.
  if (alarme.some((a) => a.stufe === 'kritisch')) {
    const i = aufgaben.findIndex((a) => a.status === 'offen' && a.id !== 'blick');
    if (i >= 0) aufgaben[i] = { ...aufgaben[i]!, status: 'dringend' as const };
  }
  return { patient, geraete, material, alarme, aufgaben };
}
