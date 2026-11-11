// Räume der Fallszene je Setting, mit nummerierten Markern und der Bedienleiste
// (Gespräch, Beobachtung, Material, Dokumentation, Übergabe). Angelehnt an Philipps
// Raum-Briefing; alles rein und testbar, die Zeichnung steckt in Szene.tsx.

import type { Setting } from './faelle';
import { news2, type Fall } from './simulator';
import { PERSON_LABEL, type Ort, type SzenenBild } from './szene';

export type Raum = 'krankenhaus' | 'heim' | 'wohnung';
export type ObjektId = 'patient' | 'monitor' | 'infusion' | 'rollstuhl' | 'nachttisch' | 'rucksack' | 'rollator' | 'essen' | 'duschstuhl' | 'doku';

export const RAUM_FUER: Record<Setting, Raum> = { krankenhaus: 'krankenhaus', paediatrie: 'krankenhaus', langzeit: 'heim', ambulant: 'wohnung' };
export const RAUM_LABEL: Record<Raum, string> = { krankenhaus: 'Krankenhauszimmer', heim: 'Bewohnerzimmer', wohnung: 'Wohnung' };

export interface Marker { id: ObjektId; nr: number; name: string; ort: Ort }

/** Drei Marker je Raum; der erste ist immer die Person. */
export const MARKER: Record<Raum, Marker[]> = {
  krankenhaus: [
    { id: 'patient', nr: 1, name: 'Patient', ort: 'bett' },
    { id: 'monitor', nr: 2, name: 'Monitor und Messgeräte', ort: 'monitor' },
    { id: 'infusion', nr: 3, name: 'Infusionsständer', ort: 'wagen' },
  ],
  heim: [
    { id: 'patient', nr: 1, name: 'Bewohner', ort: 'bett' },
    { id: 'rollstuhl', nr: 2, name: 'Rollstuhl', ort: 'wagen' },
    { id: 'nachttisch', nr: 3, name: 'Nachttisch mit Rufanlage', ort: 'monitor' },
  ],
  wohnung: [
    { id: 'patient', nr: 1, name: 'Klientin', ort: 'bett' },
    { id: 'rucksack', nr: 2, name: 'Pflegerucksack', ort: 'monitor' },
    { id: 'rollator', nr: 3, name: 'Rollator', ort: 'wagen' },
  ],
};

export interface ObjektInfo { titel: string; beobachtung: string[]; handlungen: string[] }

const MATERIAL: Record<Raum, string[]> = {
  krankenhaus: ['Blutdruckmessgerät', 'Pulsoxymeter', 'Thermometer', 'Sauerstoffbrille', 'Einmalhandschuhe', 'Blutzuckermessgerät'],
  heim: ['Mobiles Blutdruckgerät', 'Pulsoxymeter', 'Thermometer', 'Blutzuckermessgerät', 'Trinkbecher mit Griff', 'Inkontinenzmaterial'],
  wohnung: ['Blutdruckgerät', 'Pulsoxymeter', 'Ohrthermometer', 'Blutzuckermessgerät', 'Desinfektionsmittel', 'Pflegedokumentation'],
};
export const materialIn = (raum: Raum) => MATERIAL[raum];

const ZUSTAND_TEXT: Record<SzenenBild['zustand'], string> = {
  stabil: 'wirkt ruhig', verbessert: 'wirkt entspannter als vorhin', verschlechtert: 'wirkt angestrengt und unruhig', kritisch: 'wirkt schwer krank',
};

/** Was man an einem Objekt sieht, und was man dort tun kann (als Vorschlag für die eigene Eingabe). */
export function objektInfo(id: ObjektId, raum: Raum, bild: SzenenBild): ObjektInfo {
  const m = bild.monitor;
  switch (id) {
    case 'patient': return {
      titel: MARKER[raum][0]!.name,
      beobachtung: [
        `Atmet etwa ${Math.round(bild.atem)}-mal pro Minute (geschätzt, solange nicht gezählt), ${ZUSTAND_TEXT[bild.zustand]}.`,
        bild.zyanose ? 'Die Lippen wirken bläulich.' : 'Hautfarbe ohne auffällige Blaufärbung.',
        bild.schwitzt ? 'Die Stirn ist schweißig.' : '',
        raum !== 'wohnung' ? (bild.oberkoerperHoch ? 'Oberkörper ist hoch gelagert.' : 'Liegt eher flach.') : 'Sitzt im Sessel.',
        bild.sauerstoff ? 'Bekommt Sauerstoff über eine Nasenbrille.' : '',
      ].filter(Boolean),
      handlungen: [
        'Ich spreche die Person an, frage nach Beschwerden und Schmerzen (NRS 0 bis 10) und beobachte dabei Atmung und Hautfarbe.',
        'Ich zähle die Atemfrequenz eine Minute lang und prüfe das Bewusstsein nach ACVPU.',
        raum === 'wohnung' ? 'Ich prüfe, ob sie sicher sitzt und der Weg zum Bad frei ist.' : 'Ich lagere den Oberkörper hoch und bleibe bei der Person.',
      ],
    };
    case 'monitor': return {
      titel: 'Monitor und Messgeräte',
      beobachtung: bild.monitorAn
        ? [`Zuletzt gemessen: Puls ${m.puls ?? '–'}, SpO₂ ${m.spo2 ?? '–'} %, AF ${m.af ?? '–'}, RR ${m.sys ?? '–'}/${m.dia ?? '–'}.`, bild.alarm ? 'Der Monitor zeigt einen Alarm.' : 'Kein Alarm.']
        : ['Noch keine Messung. Der Monitor zeigt kein Signal.'],
      handlungen: ['Ich messe Blutdruck, Puls, Atemfrequenz, Sättigung und Temperatur und prüfe das Bewusstsein.', 'Ich kontrolliere die Werte in 15 Minuten erneut.'],
    };
    case 'infusion': return {
      titel: 'Infusionsständer',
      beobachtung: ['Am Ständer hängt eine Infusion. Laufrate und Anordnung stehen in der Kurve.'],
      handlungen: ['Ich prüfe Zugang, Einstichstelle und ob die Infusion nach Anordnung läuft.'],
    };
    case 'rollstuhl': return {
      titel: 'Rollstuhl',
      beobachtung: ['Steht neben dem Bett. Bremsen und Fußstützen musst du vor einem Transfer prüfen.'],
      handlungen: ['Ich stelle den Rollstuhl bettnah, ziehe die Bremsen an und klappe die Fußstützen weg.'],
    };
    case 'nachttisch': return {
      titel: 'Nachttisch mit Rufanlage',
      beobachtung: ['Rufanlage, Trinkbecher und persönliche Dinge liegen auf dem Nachttisch.', bild.telefon ? 'Das Telefon klingelt.' : ''].filter(Boolean),
      handlungen: ['Ich lege die Rufanlage in Reichweite und erkläre, wann sie klingeln soll.', 'Ich schaue, wie viel heute getrunken wurde.'],
    };
    case 'rucksack': return {
      titel: 'Pflegerucksack',
      beobachtung: [`Darin: ${MATERIAL.wohnung.join(', ')}.`],
      handlungen: ['Ich nehme Blutdruckgerät und Pulsoxymeter aus dem Rucksack und messe die Vitalzeichen.'],
    };
    case 'rollator': return {
      titel: 'Rollator',
      beobachtung: ['Steht etwas entfernt. Bremsen und Abstand zur Person prüfen.'],
      handlungen: ['Ich stelle den Rollator in Reichweite und prüfe die Bremsen, bevor die Person aufsteht.'],
    };
    case 'essen': return {
      titel: 'Mahlzeit und Trinkbecher',
      beobachtung: ['Auf dem Teller liegt noch viel. Der Schnabelbecher ist halb voll.'],
      handlungen: ['Ich schaue, wie viel gegessen und getrunken wurde, und trage es ins Ein- und Ausfuhrprotokoll ein.', 'Ich frage, ob Schmerzen beim Kauen oder Schlucken bestehen, und biete Hilfe beim Essen an.'],
    };
    case 'doku': return {
      titel: 'Pflegedokumentation',
      beobachtung: ['Auf dem Tablet: Medikamentenplan, ärztliche Verordnungen und die Einträge der letzten Besuche.'],
      handlungen: ['Ich lese im Medikamentenplan und in den Verordnungen nach, was für heute angeordnet ist.', 'Ich schaue, was beim letzten Besuch dokumentiert wurde, und vergleiche es mit heute.'],
    };
    case 'duschstuhl': return {
      titel: 'Duschstuhl',
      beobachtung: ['Steht in der bodengleichen Dusche. Haltegriffe sind an der Wand.'],
      handlungen: ['Ich prüfe, ob der Duschstuhl sicher steht, und lege ein Handtuch bereit, bevor wir umsetzen.'],
    };
  }
}

export type Leiste = 'gespraech' | 'beobachtung' | 'material' | 'dokumentation' | 'uebergabe';
export const LEISTE: Array<{ id: Leiste; label: string }> = [
  { id: 'gespraech', label: 'Gespräch' }, { id: 'beobachtung', label: 'Beobachtung' }, { id: 'material', label: 'Material' },
  { id: 'dokumentation', label: 'Dokumentation' }, { id: 'uebergabe', label: 'Übergabe' },
];

/** Vorschläge je Bereich der Bedienleiste. */
export function leistenVorschlaege(bereich: Leiste, raum: Raum, bild: SzenenBild, fall: Fall): string[] {
  switch (bereich) {
    case 'gespraech': return [
      'Ich stelle mich vor und erkläre, was ich jetzt tue.',
      'Ich frage nach Beschwerden, seit wann sie bestehen und wie stark sie sind (NRS 0 bis 10).',
      ...bild.personen.filter((p) => p !== 'notfallteam').map((p) => `Ich spreche mit der ${PERSON_LABEL[p]} und frage, was sie beobachtet hat.`),
    ];
    case 'beobachtung': return [
      'Ich beobachte Atmung, Hautfarbe, Schweiß und Bewusstsein.',
      'Ich messe die Vitalzeichen vollständig für den NEWS2.',
      'Ich schaue mir Beine, Ödeme und die Flüssigkeitsbilanz an.',
    ];
    case 'material': return MATERIAL[raum].slice(0, 4).map((x) => `Ich hole ${x} und setze es passend ein.`);
    case 'dokumentation': return [
      'Ich dokumentiere Uhrzeit, Werte und Beobachtungen im Pflegebericht.',
      'Ich trage die Messung in die Kurve ein und markiere den NEWS2.',
    ];
    case 'uebergabe': return [sbarEntwurf(fall, bild)];
  }
}

/** Übergabe nach SBAR aus dem, was bisher bekannt ist. Ein Entwurf zum Anpassen, keine Bewertung. */
export function sbarEntwurf(fall: Fall, bild: SzenenBild): string {
  const zug = fall.runden.at(-1)?.zug;
  const n = zug ? news2(zug.vitalwerte) : null;
  const werte = bild.monitorAn
    ? `Puls ${bild.monitor.puls ?? '–'}, SpO₂ ${bild.monitor.spo2 ?? '–'} %, AF ${bild.monitor.af ?? '–'}, RR ${bild.monitor.sys ?? '–'}/${bild.monitor.dia ?? '–'}`
    : 'noch keine vollständigen Werte';
  const einschaetzung = n && !n.fehlt.length ? `NEWS2 ${n.punkte}, Risiko ${n.risiko}` : 'NEWS2 noch nicht vollständig';
  return `Ich übergebe nach SBAR. S: ${fall.szenario.titel}, Zustand ${bild.zustand}. B: ${fall.szenario.kurz} A: ${werte}; ${einschaetzung}. R: Ich bitte um ärztliche Einschätzung und Anordnung.`;
}
