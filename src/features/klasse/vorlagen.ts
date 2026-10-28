import { FELDER, feldHilfe, feldLabel, RISIKEN, RISIKO_LABEL, SETTING_LABEL as SIS_SETTING, SIS_FAELLE, type SisFall } from '../sis/faelle';
import { FAELLE as PLAN_FAELLE, SETTING_LABEL as PLAN_SETTING, type PlanFall } from '../pflegeplanung/faelle';
import { allgemeinePunkte, ANLASS_LABEL, FAELLE as UEBERGABE_FAELLE, TEIL_HILFE, TEIL_LABEL, type Fall as UebergabeFall } from '../uebergabe/faelle';
import { BEREICH_LABEL, BERICHT_FAELLE, type BerichtFall } from '../bericht/faelle';
import { FAELLE as KH_FAELLE, type Fallaufgabe } from '../krankheitsbilder/faelle';
import { mischung } from '../krankheitsbilder/bewertung';
import { pflegeModule } from '../../modules/pflege';
import { INSTRUMENTE } from '../assessment/instrumente';
import { VIGNETTEN, type Vignette } from '../assessment/vignetten';
import { loesungsItems } from '../assessment/bewertung';
import { neueId, type Aufgabe, type FallArt, type KlassenFall } from './typen';

// Vorlagen aus den bestehenden Trainern. Die Kernpunkte der Trainer werden übernommen,
// damit die Klasse nach der Abgabe dieselbe Rückmeldung per Code bekommt.

export interface Vorlage { id: string; art: Exclude<FallArt, 'fallbeispiel'>; titel: string; untertitel: string; baue: () => KlassenFall }

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

const TEILE = ['S', 'B', 'A', 'R'] as const;

/** Beispiel-Übergabe nach „S:“, „B:“ … zerlegen. */
function sbarTeile(text: string): Record<string, string> {
  const r: Record<string, string> = {};
  for (const m of text.matchAll(/^([SBAR]):\s*([\s\S]*?)(?=^[SBAR]:|$(?![\s\S]))/gm)) r[m[1]!] = m[2]!.trim();
  return r;
}

export function ausUebergabe(f: UebergabeFall): KlassenFall {
  const punkte = [...allgemeinePunkte(f.anlass), ...f.kernpunkte];
  const beispiel = sbarTeile(f.muster);
  return {
    ...basis(), art: 'uebergabe', titel: `Übergabe: ${f.titel}`,
    situation: `${f.bereich}. ${ANLASS_LABEL[f.anlass]} an: ${f.empfaenger}.\nDu bist: ${f.rolle}.\n\n${f.lage}`,
    material: [{ titel: 'Daten', text: daten(f.daten) }],
    aufgaben: TEILE.map((t) => ({
      id: t.toLowerCase(),
      frage: `${t} – ${TEIL_LABEL[t]}`,
      hinweis: TEIL_HILFE[t],
      erwartung: beispiel[t],
      kernpunkte: punkte.filter((k) => k.teil === t).map((k) => ({ text: k.text, muster: k.muster })),
    })),
  };
}

export function ausBericht(f: BerichtFall): KlassenFall {
  const umschreiben = f.art === 'umschreiben';
  return {
    ...basis(), art: 'bericht', titel: `Pflegebericht: ${f.titel}`,
    situation: `${BEREICH_LABEL[f.bereich]}. ${f.person}\n\n${f.szene.join('\n')}`,
    material: umschreiben && f.vorlage ? [{ titel: 'Vorliegender Eintrag', text: f.vorlage }] : [],
    aufgaben: [{
      id: 'eintrag',
      frage: umschreiben
        ? 'Der vorliegende Eintrag ist wertend und ungenau. Schreibe ihn sachlich neu.'
        : 'Schreibe den Eintrag in den Pflegebericht.',
      hinweis: 'Wann, was beobachtet, was die Person sagt (wörtlich), was du getan hast, wie sie reagiert hat, wen du informiert hast.',
      erwartung: f.muster,
      kernpunkte: f.kernpunkte.map((k) => ({ text: k.text, muster: k.muster })),
    }],
  };
}

const BUCHSTABEN = 'ABCDEFGHIJ';

/** Fester Zufall je Text: dieselbe Vorlage mischt immer gleich, die Lösungsbuchstaben bleiben stabil. */
function zufallAus(text: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Krankheitsbild-Fall: Die Auswahlaufgaben werden zu Aufgaben mit Buchstaben-Antwort, damit sie auch
 * ohne App auf Papier oder im Chat funktionieren. Die Optionen werden gemischt (im Trainer stehen die
 * richtigen oft vorn), die Lösung nennt Buchstaben und Erklärung.
 */
export function ausKrankheitsbild(f: Fallaufgabe): KlassenFall {
  const profil = pflegeModule.diseaseProfiles?.find((p) => p.id === f.krankheitId);
  return {
    ...basis(), art: 'krankheitsbild', titel: `${profil?.name ?? 'Krankheitsbild'}: ${f.titel}`,
    situation: `${f.setting}.\n\n${f.text.join('\n\n')}`,
    material: [],
    aufgaben: f.aufgaben.map((a) => {
      const optionen = mischung(a.optionen.length, zufallAus(`${f.id}:${a.id}`)).map((i) => a.optionen[i]!);
      return {
        id: a.id,
        frage: `${a.frage}\n${optionen.map((o, i) => `${BUCHSTABEN[i]}) ${o.text}`).join('\n')}`,
        hinweis: `${a.art === 'mehrfach' ? 'Alle zutreffenden Buchstaben angeben' : 'Einen Buchstaben angeben'} und kurz begründen.`,
        erwartung: `Richtig: ${optionen.flatMap((o, i) => (o.richtig ? [BUCHSTABEN[i]] : [])).join(', ')}. ${a.erklaerung}`,
      };
    }),
  };
}

/**
 * Assessment-Fallvignette: je Bereich Punkte mit Begründung, am Ende Summe und Einstufung.
 * Der vollständige Bewertungsbogen (Leitfragen und Stufentexte) steht als Material dabei,
 * weil die Einstufung oft an diesen Details hängt.
 */
export function ausAssessment(v: Vignette): KlassenFall {
  const instr = INSTRUMENTE[v.instrument];
  const items = loesungsItems(v);
  const bogen = items.map((item) => [
    `${item.label}${item.frage ? ` (${item.frage})` : ''}`,
    ...item.stufen.map((st) => `  ${st.punkte} = ${st.kurz}${st.text ? `: ${st.text}` : ''}`),
  ].join('\n')).join('\n\n');
  return {
    ...basis(), art: 'assessment', titel: `${instr.kurz}: ${v.titel}`,
    situation: `${v.setting}.\n\n${v.text.join('\n\n')}\n\nSchätze die Person mit der ${instr.name} ein. ${instr.richtung}`,
    material: [
      { titel: `Bewertungsbogen ${instr.kurz}`, text: bogen },
      ...(instr.hinweise.length ? [{ titel: 'Hinweise zum Instrument', text: liste(instr.hinweise) }] : []),
    ],
    aufgaben: [
      ...items.map((item) => ({
        id: item.id.toLowerCase(),
        frage: instr.ohneSumme ? `${item.label}: Welche Stufe trifft zu?` : `${item.label}: Wie viele Punkte gibst du und warum?`,
        hinweis: item.stufen.map((st) => `${st.punkte} = ${st.kurz}`).join(' · '),
        erwartung: `${instr.ohneSumme ? item.stufen.find((st) => st.punkte === v.loesung[item.id])?.kurz ?? '' : `${v.loesung[item.id]} Punkte`}. ${v.begruendung[item.id] ?? ''}`.trim(),
      })),
      {
        id: 'einstufung',
        frage: instr.ohneSumme ? 'Einstufung: Wie stufst du das Ergebnis ein und was folgt daraus für die Pflege?' : 'Summe und Einstufung: Wie viele Punkte ergeben sich, wie stufst du das ein und was folgt daraus für die Pflege?',
        hinweis: instr.kategorien.map((k) => `${k.min === k.max ? k.min : `${k.min}–${k.max}`}: ${k.label}`).join(' · '),
        erwartung: v.fazit,
      },
    ],
  };
}

export const VORLAGE_GRUPPEN: { art: Vorlage['art']; label: string }[] = [
  { art: 'sis', label: 'SIS' }, { art: 'pflegeplanung', label: 'Pflegeplanung' },
  { art: 'uebergabe', label: 'Übergabe (SBAR)' }, { art: 'bericht', label: 'Pflegebericht' },
  { art: 'krankheitsbild', label: 'Krankheitsbild-Fälle' }, { art: 'assessment', label: 'Assessments' },
];

export const VORLAGEN: Vorlage[] = [
  ...SIS_FAELLE.map((f): Vorlage => ({ id: `sis:${f.id}`, art: 'sis', titel: f.titel, untertitel: `SIS · ${SIS_SETTING[f.setting]}`, baue: () => ausSis(f) })),
  ...PLAN_FAELLE.map((f): Vorlage => ({ id: `pp:${f.id}`, art: 'pflegeplanung', titel: f.titel, untertitel: `Pflegeplanung · ${PLAN_SETTING[f.setting]}`, baue: () => ausPflegeplanung(f) })),
  ...UEBERGABE_FAELLE.map((f): Vorlage => ({ id: `sbar:${f.id}`, art: 'uebergabe', titel: f.titel, untertitel: `Übergabe · ${ANLASS_LABEL[f.anlass]}`, baue: () => ausUebergabe(f) })),
  ...BERICHT_FAELLE.map((f): Vorlage => ({ id: `ber:${f.id}`, art: 'bericht', titel: f.titel, untertitel: `Pflegebericht · ${BEREICH_LABEL[f.bereich]}`, baue: () => ausBericht(f) })),
  ...KH_FAELLE.map((f): Vorlage => {
    const name = pflegeModule.diseaseProfiles?.find((p) => p.id === f.krankheitId)?.name ?? '';
    return { id: `kh:${f.id}`, art: 'krankheitsbild', titel: `${name}: ${f.titel}`, untertitel: `Krankheitsbild · ${f.setting}`, baue: () => ausKrankheitsbild(f) };
  }),
  ...VIGNETTEN.map((v): Vorlage => ({ id: `as:${v.id}`, art: 'assessment', titel: `${INSTRUMENTE[v.instrument].kurz}: ${v.titel}`, untertitel: `Assessment · ${v.setting}`, baue: () => ausAssessment(v) })),
];

export function leererFall(): KlassenFall {
  return {
    ...basis(), loesung: 'nie', art: 'fallbeispiel', titel: '', situation: '', material: [],
    aufgaben: [{ id: neueId(4), frage: '' }],
  };
}
