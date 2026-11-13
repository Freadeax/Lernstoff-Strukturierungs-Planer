// Adapter Fallsimulator → einheitliche Zustandskomponenten (src/ui/sim/zustand.ts, Audit SIM-07).
// Liest nur den Spielstand (Züge mit Vitalwerten und Situation) und das daraus gebaute Szenenbild.
import { alarmStufe, type MonitorGruppe, type MonitorParameter } from '../../ui/sim/monitor';
import type { AufgabeEintrag, SimZustand, ZustandEintrag } from '../../ui/sim/zustand';
import { PERSON_LABEL, szenenBild } from './szene';
import { SCHRITTE, SCHRITT_LABEL, ZUSTAND_LABEL, type Fall } from './simulator';

const AVPU: Record<string, string> = { A: 'wach', C: 'neu verwirrt', V: 'reagiert auf Ansprache', P: 'reagiert auf Schmerz', U: 'reagiert nicht' };
const NAME: Record<MonitorParameter, string> = { puls: 'Puls', af: 'Atemfrequenz', spo2: 'SpO₂', sys: 'RR systolisch', temp: 'Temperatur' };
const EINHEIT: Record<MonitorParameter, string> = { puls: '/min', af: '/min', spo2: ' %', sys: ' mmHg', temp: ' °C' };

/** Material, das im Verlauf ausdrücklich erwähnt wird (Stichworte, erste Erwähnung zählt). */
const MATERIAL: [string, string, RegExp][] = [
  ['zugang', 'Venöser Zugang', /zugang|braunüle|viggo|venenverweil/i],
  ['infusion', 'Infusion', /infusion|ringer|nacl|kochsalz/i],
  ['blutzucker', 'BZ-Messgerät', /blutzucker|bz-mess|bz mess|stechhilfe/i],
  ['insulin', 'Insulin', /insulin/i],
  ['traubenzucker', 'Glukose', /traubenzucker|glukose|glucose/i],
  ['verband', 'Verbandmaterial', /verband|kompresse|wundauflage/i],
  ['absaugung', 'Absaugung', /absaug/i],
  ['katheter', 'Blasenkatheter', /katheter|dk\b/i],
];

export function fallZustand(fall: Fall, gruppe: MonitorGruppe = 'erwachsen'): SimZustand {
  const bild = szenenBild(fall, { gruppe });
  const zug = fall.runden.at(-1)?.zug;
  const v = zug?.vitalwerte;
  const m = bild.monitor;

  const patient: ZustandEintrag[] = [
    { id: 'person', label: fall.szenario.titel, wert: fall.szenario.kurz.split(/[.!?]/)[0] ?? '', stufe: 'normal' },
    { id: 'zustand', label: 'Zustand', wert: ZUSTAND_LABEL[bild.zustand], stufe: bild.zustand === 'kritisch' ? 'kritisch' : bild.zustand === 'verschlechtert' ? 'achtung' : 'normal' },
  ];
  const avpu = v?.bewusstsein.trim().toUpperCase().charAt(0);
  if (avpu) patient.push({ id: 'bewusstsein', label: 'Bewusstsein', wert: AVPU[avpu] ?? avpu, stufe: avpu === 'A' ? 'normal' : avpu === 'C' || avpu === 'V' ? 'achtung' : 'kritisch' });
  const schmerz = Number(v?.schmerz);
  if (v?.schmerz.trim() && Number.isFinite(schmerz)) patient.push({ id: 'schmerz', label: 'Schmerz', wert: `NRS ${schmerz}`, stufe: schmerz >= 7 ? 'kritisch' : schmerz >= 4 ? 'achtung' : 'normal' });
  if (bild.zyanose || bild.schwitzt) patient.push({ id: 'haut', label: 'Haut', wert: [bild.zyanose && 'bläulich', bild.schwitzt && 'schwitzt'].filter(Boolean).join(', '), stufe: bild.zyanose ? 'kritisch' : 'achtung' });
  if (bild.personen.length) patient.push({ id: 'personen', label: 'Im Zimmer', wert: bild.personen.map((p) => PERSON_LABEL[p]).join(', '), stufe: 'normal' });
  patient.push({ id: 'lage', label: 'Lage', wert: bild.oberkoerperHoch ? 'Oberkörper hoch' : 'wie vorgefunden', stufe: 'normal' });

  const geraete: ZustandEintrag[] = [
    { id: 'monitor', label: 'Monitor', wert: bild.monitorAn ? 'Werte gemessen' : 'noch nicht gemessen', stufe: bild.monitorAn ? 'normal' : 'aus' },
    { id: 'sauerstoff', label: 'Sauerstoff', wert: bild.sauerstoff ? 'läuft' : 'aus', stufe: bild.sauerstoff ? 'normal' : 'aus' },
    { id: 'telefon', label: 'Telefon', wert: bild.telefon ? 'Anruf' : 'ruhig', stufe: bild.telefon ? 'achtung' : 'aus' },
  ];

  const text = fall.runden.map((r) => `${r.eingabe ?? ''} ${r.zug.situation}`).join('\n');
  const material: ZustandEintrag[] = MATERIAL.filter(([, , re]) => re.test(text)).map(([id, label]) => ({ id, label, wert: 'im Verlauf genannt', stufe: 'normal' }));

  const alarme: ZustandEintrag[] = [];
  if (bild.monitorAn) {
    for (const k of Object.keys(NAME) as MonitorParameter[]) {
      const st = alarmStufe(k, m[k], gruppe);
      if (st !== 'ok') alarme.push({ id: `vital:${k}`, label: NAME[k], wert: `${m[k]}${EINHEIT[k]}`, stufe: st === 'rot' ? 'kritisch' : 'achtung' });
    }
  }
  if (bild.zustand === 'kritisch') alarme.push({ id: 'zustand', label: 'Zustand', wert: 'kritisch', stufe: 'kritisch' });
  if (bild.telefon) alarme.push({ id: 'telefon', label: 'Telefon', wert: 'Anruf', stufe: 'achtung' });

  // Aufgaben: die sechs Schritte des Pflegeprozesses; bearbeitet sind alle, die schon ein Zug erreicht hat.
  const erreicht = new Set(fall.runden.map((r) => r.zug.schritt));
  const aktuell = zug?.schritt;
  const krit = alarme.some((a) => a.stufe === 'kritisch');
  const aufgaben: AufgabeEintrag[] = SCHRITTE.map((s) => ({
    id: s, titel: SCHRITT_LABEL[s],
    status: fall.abschluss || (erreicht.has(s) && s !== aktuell) ? 'erledigt' : s === aktuell && krit ? 'dringend' : 'offen',
  }));
  return { patient, geraete, material, alarme, aufgaben };
}
