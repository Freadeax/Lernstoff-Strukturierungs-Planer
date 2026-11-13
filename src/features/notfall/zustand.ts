// Adapter Notfall-Trainer → einheitliche Zustandskomponenten (src/ui/sim/zustand.ts, Audit SIM-07).
// Verrät keine Lösung: Aufgaben nennen nur das allgemeine Vorgehen, nicht die richtigen Maßnahmen,
// und der Rhythmus steht nur auf dem Defi-Schirm.
import { alarmStufe, type MonitorParameter } from '../../ui/sim/monitor';
import type { AufgabeEintrag, SimZustand, ZustandEintrag } from '../../ui/sim/zustand';
import { BUCHSTABE_NAME, BUCHSTABEN, uhr, type Stand } from './abcde';
import type { ReaProfil, ReaSzenario } from './rea';

const AVPU: Record<string, string> = { A: 'wach', C: 'neu verwirrt', V: 'reagiert auf Ansprache', P: 'reagiert auf Schmerz', U: 'reagiert nicht' };
const NAME: Record<MonitorParameter, string> = { puls: 'Puls', af: 'Atemfrequenz', spo2: 'SpO₂', sys: 'RR systolisch', temp: 'Temperatur' };
const EINHEIT: Record<MonitorParameter, string> = { puls: '/min', af: '/min', spo2: ' %', sys: ' mmHg', temp: ' °C' };
const MATERIAL: [string, string, RegExp][] = [
  ['sauerstoff', 'Sauerstoffmaske oder -brille', /sauerstoff/i],
  ['zugang', 'Venöser Zugang', /zugang|infusion|bolus|vollelektrolyt/i],
  ['glukose', 'Glukose', /glukose|traubenzucker/i],
  ['kulturen', 'Blutkulturen', /blutkultur/i],
  ['spritze', 'Notfallmedikament', /adrenalin|i\.m\./i],
];

export function abcdeZustand(s: Stand): SimZustand {
  const w = s.werte;
  const d = s.befunde.includes('D');
  const patient: ZustandEintrag[] = [
    { id: 'person', label: s.fall.person, wert: s.fall.titel, stufe: 'normal' },
    { id: 'eingeschaetzt', label: 'Eingeschätzt', wert: s.befunde.length ? [...new Set(s.befunde)].join(' · ') : 'noch nichts', stufe: s.befunde.length ? 'normal' : 'achtung' },
    ...(d ? [{ id: 'bewusstsein', label: 'Bewusstsein', wert: AVPU[w.avpu] ?? w.avpu, stufe: w.avpu === 'A' ? 'normal' as const : w.avpu === 'C' || w.avpu === 'V' ? 'achtung' as const : 'kritisch' as const }] : []),
    { id: 'ausgang', label: 'Lage', wert: s.ende === 'stabil' ? 'stabilisiert' : s.ende === 'kritisch' ? 'kritisch, Team übernimmt' : s.ende === 'uebergabe' ? 'übergeben' : `läuft seit ${uhr(s.zeit)} min`, stufe: s.ende === 'kritisch' ? 'kritisch' : 'normal' },
  ];
  const getan = s.fall.massnahmen.filter((m) => s.massnahmen.includes(m.id));
  const geraete: ZustandEintrag[] = [
    { id: 'monitor', label: 'Monitor', wert: s.monitor ? 'läuft' : 'nicht angeschlossen', stufe: s.monitor ? 'normal' : 'aus' },
    { id: 'sauerstoff', label: 'Sauerstoff', wert: getan.some((m) => /sauerstoff/i.test(m.label)) ? 'läuft' : 'aus', stufe: getan.some((m) => /sauerstoff/i.test(m.label)) ? 'normal' : 'aus' },
  ];
  const text = getan.map((m) => `${m.label} ${m.text}`).join('\n');
  const material: ZustandEintrag[] = MATERIAL.filter(([, , re]) => re.test(text)).map(([id, label]) => ({ id, label, wert: 'im Einsatz', stufe: 'normal' }));

  const alarme: ZustandEintrag[] = [];
  if (s.monitor) {
    const werte: Record<MonitorParameter, number> = { puls: w.puls, af: w.af, spo2: w.spo2, sys: w.sys, temp: w.temp };
    for (const k of Object.keys(NAME) as MonitorParameter[]) {
      const st = alarmStufe(k, werte[k]);
      if (st !== 'ok') alarme.push({ id: `vital:${k}`, label: NAME[k], wert: `${Math.round(werte[k] * (k === 'temp' ? 10 : 1)) / (k === 'temp' ? 10 : 1)}${EINHEIT[k]}`, stufe: st === 'rot' ? 'kritisch' : 'achtung' });
    }
  }
  if (s.ende === 'kritisch') alarme.push({ id: 'kritisch', label: 'Kritische Verschlechterung', wert: 'Reanimationsbereitschaft', stufe: 'kritisch' });

  const hilfe = getan.some((m) => m.buchstabe === 'Team');
  const ersteMassnahme = s.verlauf.find((e) => e.art === 'massnahme');
  const neu = !!ersteMassnahme && s.verlauf.some((e) => e.art === 'befund' && e.zeit > ersteMassnahme.zeit);
  const fertig = s.ende !== null;
  const aufgaben: AufgabeEintrag[] = [
    ...BUCHSTABEN.map((b): AufgabeEintrag => ({ id: `befund:${b}`, titel: `${b} · ${BUCHSTABE_NAME[b]} einschätzen`, status: s.befunde.includes(b) ? 'erledigt' : 'offen' })),
    { id: 'hilfe', titel: 'Hilfe holen', status: hilfe ? 'erledigt' : s.befunde.length >= 2 || alarme.some((a) => a.stufe === 'kritisch') ? 'dringend' : 'offen' },
    { id: 'neu', titel: 'Wirkung prüfen: erneut bei A beginnen', status: neu ? 'erledigt' : 'offen' },
    { id: 'uebergabe', titel: 'Nach SBAR übergeben', status: fertig ? 'erledigt' : 'offen' },
  ];
  return { patient, geraete, material, alarme, aufgaben };
}

export interface ReaStand {
  profil: ReaProfil; szenario: ReaSzenario;
  phase: 'start' | 'erkennen' | 'cpr' | 'analyse' | 'laden' | 'ende';
  erledigt: string[]; defiDa: boolean; schocks: number; medis: string[];
  rate: number | null; zyklus: number;
}

export function reaZustand(r: ReaStand): SimZustand {
  const { profil: p, szenario: sz, phase } = r;
  const erkannt = phase !== 'start' && phase !== 'erkennen';
  const patient: ZustandEintrag[] = [
    { id: 'person', label: sz.titel, wert: sz.gewichtKg ? `etwa ${sz.gewichtKg} kg` : p.titel, stufe: 'normal' },
    { id: 'bewusstsein', label: 'Bewusstsein', wert: erkannt ? 'reagiert nicht, keine normale Atmung' : 'noch nicht geprüft', stufe: erkannt ? 'kritisch' : 'achtung' },
    { id: 'zyklus', label: 'Reanimation', wert: phase === 'ende' ? 'beendet' : erkannt ? `Zyklus ${r.zyklus + 1}` : 'noch nicht begonnen', stufe: 'normal' },
  ];
  const geraete: ZustandEintrag[] = p.defi
    ? [{ id: 'defi', label: 'Defibrillator', wert: r.defiDa ? (phase === 'laden' ? 'lädt' : r.schocks ? `Pads kleben, ${r.schocks} ${r.schocks === 1 ? 'Schock' : 'Schocks'}` : 'Pads kleben') : 'unterwegs', stufe: r.defiDa ? 'normal' : 'aus' }]
    : [{ id: 'waerme', label: 'Wärmebett', wert: 'an', stufe: 'normal' }];
  geraete.push({ id: 'beutel', label: 'Beatmungsbeutel', wert: erkannt ? 'im Einsatz' : 'bereit', stufe: erkannt ? 'normal' : 'aus' });
  const material: ZustandEintrag[] = r.medis.map((m, i) => ({ id: `med:${i}`, label: 'Medikament', wert: m, stufe: 'normal' }));

  const alarme: ZustandEintrag[] = [];
  if (phase === 'analyse' && p.defi) alarme.push({ id: 'analyse', label: 'Analyse', wert: 'Patient nicht berühren', stufe: 'kritisch' });
  if (phase === 'laden') alarme.push({ id: 'laden', label: 'Defi lädt', wert: 'Sicherheitscheck: alle weg', stufe: 'kritisch' });
  if (phase === 'cpr' && r.rate !== null && (r.rate < p.ziel.min || r.rate > p.ziel.max)) alarme.push({ id: 'rate', label: 'Drucktakt', wert: `${Math.round(r.rate)}/min, Ziel ${p.zielText}`, stufe: 'achtung' });

  const aufgaben: AufgabeEintrag[] = [
    { id: 'erkennen', titel: 'Kreislaufstillstand erkennen, Hilfe holen', status: erkannt ? 'erledigt' : phase === 'erkennen' ? 'dringend' : 'offen' },
    { id: 'cpr', titel: `Thoraxkompressionen ${p.druck}:${p.beatmung}`, status: phase === 'ende' ? 'erledigt' : 'offen', hinweis: p.zielText },
    { id: 'analyse', titel: p.defi ? 'Rhythmus beurteilen' : 'Herzfrequenz prüfen', status: phase === 'analyse' ? 'dringend' : r.zyklus > 0 || phase === 'ende' ? 'erledigt' : 'offen' },
    { id: 'ende', titel: 'Übergabe und Nachbesprechung', status: phase === 'ende' ? 'erledigt' : 'offen' },
  ];
  return { patient, geraete, material, alarme, aufgaben };
}
