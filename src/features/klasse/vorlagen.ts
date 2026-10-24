import { FELDER, feldHilfe, feldLabel, RISIKEN, RISIKO_LABEL, SETTING_LABEL as SIS_SETTING, SIS_FAELLE, type SisFall } from '../sis/faelle';
import { FAELLE as PLAN_FAELLE, SETTING_LABEL as PLAN_SETTING, type PlanFall } from '../pflegeplanung/faelle';
import { neueId, type Aufgabe, type KlassenFall } from './typen';

// Vorlagen aus den bestehenden Trainern. Die Kernpunkte der Trainer werden übernommen,
// damit die Klasse nach der Abgabe dieselbe Rückmeldung per Code bekommt.

export interface Vorlage { id: string; art: 'sis' | 'pflegeplanung'; titel: string; untertitel: string; baue: () => KlassenFall }

const basis = (): Omit<KlassenFall, 'art' | 'titel' | 'situation' | 'material' | 'aufgaben'> => ({
  v: 1, id: neueId(), loesung: 'nach-abgabe', erstellt: new Date().toISOString(),
});

const liste = (xs: string[]) => xs.map((x) => `• ${x}`).join('\n');
const daten = (xs: { label: string; wert: string }[]) => xs.map((d) => `${d.label}: ${d.wert}`).join('\n');
const loesung = (l: string) => (l === 'beides' ? 'ja oder nein' : l);

export function ausSis(f: SisFall): KlassenFall {
  const aufgaben: Aufgabe[] = FELDER.map((feld) => ({
    id: feld.toLowerCase(),
    frage: feld === 'B' ? `Feld B: ${feldLabel('B', f.setting)}` : `Themenfeld ${feld.slice(2)}: ${feldLabel(feld, f.setting)}`,
    hinweis: feldHilfe(feld, f.setting),
    erwartung: f.muster[feld],
    kernpunkte: f.kernpunkte.filter((k) => k.feld === feld).map((k) => ({ text: k.text, muster: k.muster })),
  }));
  aufgaben.push({
    id: 'matrix',
    frage: 'Risikomatrix (Feld C2): Welche Risiken liegen vor, ist eine weitere fachliche Einschätzung notwendig, und in welchen Themenfeldern zeigen sie sich? Kurz begründen.',
    hinweis: `Je Zeile: ${RISIKEN.map((r) => RISIKO_LABEL[r]).join(', ')}.`,
    erwartung: f.matrix.map((z) => `${RISIKO_LABEL[z.risiko]}: vorhanden ${loesung(z.vorhanden)}, weitere Einschätzung ${loesung(z.weitere)}. ${z.begruendung}`).join('\n'),
  });
  return {
    ...basis(), art: 'sis', titel: `SIS: ${f.titel}`,
    situation: `${SIS_SETTING[f.setting]}. ${f.anlass}.\n${daten(f.person)}\n\nErstelle die Strukturierte Informationssammlung (SIS) aus dem Gespräch, deinen Beobachtungen und den Unterlagen.`,
    material: [
      { titel: 'Erstgespräch', text: f.gespraech.map((a) => `${a.wer}: „${a.text}“`).join('\n') },
      { titel: 'Beobachtungen', text: liste(f.beobachtungen) },
      { titel: 'Unterlagen', text: daten(f.unterlagen) },
    ],
    aufgaben,
  };
}

export function ausPflegeplanung(f: PlanFall): KlassenFall {
  const kp = (xs: { text: string; muster: string[] }[]) => xs.map((x) => ({ text: x.text, muster: x.muster }));
  return {
    ...basis(), art: 'pflegeplanung', titel: `Pflegeplanung: ${f.titel}`,
    situation: `${PLAN_SETTING[f.setting]}, ${f.bereich}. ${f.person}\n\n${f.text}`,
    material: f.daten.length ? [{ titel: 'Daten', text: daten(f.daten) }] : [],
    aufgaben: [
      { id: 'info', frage: 'Informationssammlung: Welche Informationen sind für die Pflege wichtig?', hinweis: 'Stichpunkte genügen. Auch Wünsche und Gewohnheiten der Person.', kernpunkte: kp(f.info) },
      { id: 'probleme', frage: 'Pflegeprobleme: Formuliere die aktuellen und möglichen Pflegeprobleme (z. B. im PESR-Format).', hinweis: 'P = Problem, E = Einflussfaktoren, S = Symptome, R = Ressourcen.', kernpunkte: kp(f.probleme) },
      { id: 'ressourcen', frage: 'Ressourcen: Welche Fähigkeiten und Unterstützung hat die Person?', kernpunkte: kp(f.ressourcen) },
      { id: 'ziele', frage: 'Ziele und Maßnahmen: Formuliere für die zwei wichtigsten Probleme je ein überprüfbares Ziel und passende Maßnahmen.', hinweis: 'Ziel: wer, was, wie viel, bis wann. Maßnahme: was, wie oft, wer, womit.', erwartung: f.beispiel, kernpunkte: f.probleme.filter((p) => p.pflicht).map((p) => ({ text: `${p.text}: ${p.massnahmen.text}`, muster: p.massnahmen.muster })) },
    ],
  };
}

export const VORLAGEN: Vorlage[] = [
  ...SIS_FAELLE.map((f): Vorlage => ({ id: `sis:${f.id}`, art: 'sis', titel: f.titel, untertitel: `SIS · ${SIS_SETTING[f.setting]}`, baue: () => ausSis(f) })),
  ...PLAN_FAELLE.map((f): Vorlage => ({ id: `pp:${f.id}`, art: 'pflegeplanung', titel: f.titel, untertitel: `Pflegeplanung · ${PLAN_SETTING[f.setting]}`, baue: () => ausPflegeplanung(f) })),
];

export function leererFall(): KlassenFall {
  return {
    ...basis(), loesung: 'nie', art: 'fallbeispiel', titel: '', situation: '', material: [],
    aufgaben: [{ id: neueId(4), frage: '' }],
  };
}
