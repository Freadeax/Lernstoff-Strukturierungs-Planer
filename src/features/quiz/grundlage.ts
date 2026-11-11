// Grundlage je Aufgabe (Audit 11.11.2026, Abschnitt 5 „Fachwissen“): Woher kommt die Aussage, welcher
// Stand gilt, auf welcher Ebene gilt sie (Gesetz, Standard, Einrichtung)? Wird nach dem Prüfen unter der
// Begründung gezeigt. Alles wird aus den Aufgabentexten abgeleitet, damit neue Aufgaben ohne Pflege
// mitlaufen. Die Jahreszahlen sind die letzte der App bekannte Fassung, kein Ersatz für die Prüfung
// der aktuellen Fassung im Unterricht.

import type { Aufgabe } from './quiz';

/** Inhaltsstand der Trainer. Bei einer inhaltlichen Überarbeitung anheben. */
export const INHALTSSTAND = '11/2026';

export interface GrundlageZeile { label: string; text: string }
export type Grundlage = (a: Aufgabe) => GrundlageZeile[];

/** Alle Texte einer Aufgabe, aus denen Normen oder Stichworte gelesen werden. */
export function texteVon(a: Aufgabe): string {
  const teile = a.art === 'auswahl' ? a.optionen
    : a.art === 'reihenfolge' ? a.schritte
      : a.art === 'zuordnen' ? a.paare.flatMap((p) => [p.links, p.rechts])
        : a.art === 'fall' ? [a.einstieg, ...a.schritte.flatMap((s) => [s.lage, s.frage, ...s.optionen, s.warum])]
          : a.marken.flatMap((m) => [m.label, m.hinweis]);
  return [a.titel, a.frage, ...teile, ...a.erklaerung, ...(a.vertiefung ?? [])].join('\n');
}

// ---------------------------------------------------------------- Recht

const GESETZE = 'StGB|BGB|PflBG|PflAPrV|SGB\\s?[IVX]+|ArbZG|MuSchG|IfSG|BtMG|BtMVV|AMG|GG|JArbSchG|DSGVO|BDSG|HeimG|WBVG|FamFG|PsychKG|BetrVG|KSchG|ArbSchG|TFG|TPG|PatRG';
const NORM = new RegExp(`(?:§§?|Art\\.)\\s*\\d+[a-z]?(?:\\s*(?:Abs\\.|Absatz)\\s*\\d+)?(?:\\s*(?:S\\.|Satz)\\s*\\d+)?(?:\\s*(?:Nr\\.)\\s*\\d+)?\\s+(?:${GESETZE})\\b`, 'g');

/** Normzitate wie „§ 203 StGB“ oder „Art. 2 GG“ aus einem Text, ohne Dubletten, in Fundreihenfolge. */
export function normenIn(text: string): string[] {
  return [...new Set((text.match(NORM) ?? []).map((n) => n.replace(/\s+/g, ' ').replace('Absatz', 'Abs.').replace('Satz', 'S.')))];
}

/** Gesetze, die nur genannt, aber nicht mit Paragraf zitiert werden („nach dem BtMG“). */
function gesetzeIn(text: string): string[] {
  return [...new Set(text.match(new RegExp(`\\b(?:${GESETZE})\\b`, 'g')) ?? [])].map((g) => g.replace(/\s+/g, ' '));
}

const EINRICHTUNG = /Hausregel|Dienstanweisung|Einrichtungsregel|Hausstandard|Verfahrensanweisung|Hygieneplan|Leitlinie (?:des Hauses|der Einrichtung)|Arbeitsanweisung|SOP\b/i;

/** Kernnormen je Bereich des Recht-Trainers (Stand nach der Betreuungsrechtsreform 2023). */
export const RECHT_KERNNORMEN: Record<string, string> = {
  schweigepflicht: '§ 203 StGB (Privatgeheimnisse), § 34 StGB (Notstand), Art. 9 DSGVO (Gesundheitsdaten)',
  strafrecht: '§§ 223, 229 StGB (Körperverletzung), § 630d BGB (Einwilligung), § 823 BGB (Schadensersatz), § 630f BGB (Dokumentation)',
  delegation: '§ 4 PflBG (Vorbehaltsaufgaben), § 106 GewO (Weisungsrecht), § 630a BGB (Behandlungsvertrag)',
  fem: '§ 1831 BGB (freiheitsentziehende Maßnahmen, früher § 1906), § 239 StGB (Freiheitsberaubung)',
  vorsorge: '§ 1827 BGB (Patientenverfügung), § 1820 BGB (Vorsorgevollmacht), § 1814 BGB (Betreuung), § 1358 BGB (Notvertretung Ehegatten)',
  sozialrecht: '§§ 14, 15, 18 SGB XI (Pflegebedürftigkeit, Pflegegrade, Begutachtung), § 37 SGB V (häusliche Krankenpflege)',
  arbeitsrecht: '§§ 3 bis 5 ArbZG (Arbeitszeit, Pausen, Ruhezeit), MuSchG, § 8 SGB VII (Arbeitsunfall)',
};

/** Recht: Normzitate aus der Aufgabe; fehlen sie, die Kernnormen ihres Bereichs. */
export const rechtGrundlageMit = (bereichVon: (id: string) => string | undefined): Grundlage => (a) => {
  const t = texteVon(a);
  const normen = normenIn(t);
  const kern = RECHT_KERNNORMEN[bereichVon(a.id) ?? ''];
  const gesetze = normen.length || kern ? [] : gesetzeIn(t);
  const out: GrundlageZeile[] = [
    normen.length ? { label: 'Norm', text: normen.join(', ') }
      : kern ? { label: 'Normen', text: `${kern} (Kernnormen des Bereichs)` }
        : { label: 'Norm', text: gesetze.length ? `${gesetze.join(', ')} (ohne Paragraf)` : 'Allgemeiner Rechtsgrundsatz, kein einzelner Paragraf' },
    { label: 'Geltung', text: `Deutschland, Bundesrecht. Gesetzesstand der App: ${INHALTSSTAND}; spätere Änderungen sind nicht berücksichtigt.` },
  ];
  if (EINRICHTUNG.test(t)) out.push({ label: 'Einrichtung', text: 'Die genannte Regel der Einrichtung gilt zusätzlich und nur dort. Sie ist kein Gesetz und kann von Haus zu Haus abweichen.' });
  if (a.art === 'fall') out.push({ label: 'Fall', text: 'Erfundener Fall. Im echten Einzelfall zählen alle Umstände; keine Rechtsberatung.' });
  return out;
};
export const rechtGrundlage = rechtGrundlageMit(() => undefined);

// ---------------------------------------------------------------- Expertenstandards

/** DNQP-Expertenstandards mit der letzten der App bekannten Fassung. Stichworte erkennen das Thema. */
export const STANDARDS: Array<{ id: string; name: string; fassung: string; stichworte: RegExp }> = [
  { id: 'dekubitus', name: 'Dekubitusprophylaxe in der Pflege', fassung: '2. Aktualisierung 2017', stichworte: /dekubitus|druckentlast|druckgeschw/i },
  { id: 'sturz', name: 'Sturzprophylaxe in der Pflege', fassung: '2. Aktualisierung 2022', stichworte: /sturz/i },
  { id: 'ernaehrung', name: 'Ernährungsmanagement zur Sicherung und Förderung der oralen Ernährung in der Pflege', fassung: '1. Aktualisierung 2017', stichworte: /ernährung|mangelernähr|screening.*ernähr/i },
  { id: 'kontinenz', name: 'Förderung der Harnkontinenz in der Pflege', fassung: '1. Aktualisierung 2014', stichworte: /kontinenz/i },
  { id: 'schmerz', name: 'Schmerzmanagement in der Pflege', fassung: 'Aktualisierung 2020 (akute und chronische Schmerzen zusammengeführt)', stichworte: /schmerz/i },
  { id: 'wunden', name: 'Pflege von Menschen mit chronischen Wunden', fassung: '1. Aktualisierung 2015', stichworte: /chronische?n? wunde|wundversorg|wunden/i },
  { id: 'entlassung', name: 'Entlassungsmanagement in der Pflege', fassung: '2. Aktualisierung 2019', stichworte: /entlass/i },
  { id: 'demenz', name: 'Beziehungsgestaltung in der Pflege von Menschen mit Demenz', fassung: '2018', stichworte: /demenz|beziehungsgestalt/i },
  { id: 'mobilitaet', name: 'Erhaltung und Förderung der Mobilität in der Pflege', fassung: '2020', stichworte: /mobilität/i },
  { id: 'mund', name: 'Förderung der Mundgesundheit in der Pflege', fassung: '2023', stichworte: /mundgesund|mundpflege|mundhöhle/i },
];

export function standardsIn(text: string) {
  return STANDARDS.filter((s) => s.stichworte.test(text));
}

export const standardGrundlage: Grundlage = (a) => {
  const treffer = standardsIn(texteVon(a));
  const out: GrundlageZeile[] = treffer.length
    ? treffer.slice(0, 3).map((s) => ({ label: 'Standard', text: `„${s.name}“, Herausgeber DNQP, ${s.fassung}` }))
    : [{ label: 'Standard', text: 'Aufbau und Methodik der DNQP-Expertenstandards (gilt für alle Standards)' }];
  out.push({ label: 'Lerntext', text: `Zusammenfassung der App in eigenen Worten, kein Originaltext. Fassungen: letzte der App bekannte (Stand ${INHALTSSTAND}); maßgeblich ist der Standard selbst beim DNQP.` });
  return out;
};

// ---------------------------------------------------------------- Arzneimittel

export const arzneimittelGrundlage: Grundlage = (a) => {
  const out: GrundlageZeile[] = [
    { label: 'Quelle', text: 'Allgemeine Angaben zur Wirkstoffgruppe nach Lehrbuch und Fachinformation, ergänzend.' },
  ];
  if (a.art === 'fall' || /Frau|Herr|Patient|Bewohner/.test(a.frage)) out.push({ label: 'Fallannahme', text: 'Erfundene Person mit vereinfachten Angaben. Echte Verläufe hängen von Begleiterkrankungen und Wechselwirkungen ab.' });
  out.push({ label: 'Grenze', text: 'Keine patientenbezogene Dosisentscheidung: Dosis, Änderung und Absetzen ordnet die Ärztin oder der Arzt an.' });
  return out;
};

// ---------------------------------------------------------------- Normwerte

const PROBE: Array<[RegExp, string]> = [
  [/kapillär|kapillar|fingerbeere/i, 'kapilläres Blut'], [/arteriell|BGA|Blutgas/i, 'arterielles Blut'], [/venös|Serum/i, 'venöses Blut (Serum)'],
  [/Plasma/i, 'Plasma'], [/Urin|Harn/i, 'Urin'], [/Liquor/i, 'Liquor'],
];
const ALTER: Array<[RegExp, string]> = [
  [/Neugeboren|Säugling/i, 'Neugeborene und Säuglinge'], [/Kind|Kinder|pädiatr/i, 'Kinder'], [/ältere|Senior|über 65|hochbetagt/i, 'ältere Menschen'],
];
const MESSUNG: Array<[RegExp, string]> = [
  [/Blutdruck|RR\b|mmHg/i, 'Blutdruck in Ruhe, nichtinvasiv (Manschette)'], [/Temperatur|°C/i, 'Körpertemperatur, Messort beachten (rektal höher als axillär)'],
  [/SpO2|Sättigung|Pulsoxy/i, 'Pulsoxymetrie'], [/Puls|Herzfrequenz/i, 'Herzfrequenz in Ruhe'], [/Atemfrequenz|Atemzüge/i, 'Atemfrequenz in Ruhe, eine volle Minute'],
];

export const normwertGrundlage: Grundlage = (a) => {
  const t = texteVon(a);
  const probe = PROBE.filter(([r]) => r.test(t)).map(([, s]) => s);
  const messung = MESSUNG.filter(([r]) => r.test(t)).map(([, s]) => s);
  const alter = ALTER.find(([r]) => r.test(t))?.[1] ?? 'Erwachsene';
  const out: GrundlageZeile[] = [{ label: 'Gilt für', text: alter }];
  if (probe.length) out.push({ label: 'Probe', text: [...new Set(probe)].join(', ') });
  if (messung.length) out.push({ label: 'Messung', text: [...new Set(messung)].slice(0, 2).join('; ') });
  out.push({ label: 'Referenz', text: 'Lehrbuchwerte, gerundet. Laborwerte hängen von Labor und Methode ab: maßgeblich ist der Referenzbereich auf dem Befund.' });
  out.push({ label: 'Alarmwert', text: 'Außerhalb der Norm ist nicht gleich kritisch. Ab wann sofort gemeldet wird, regeln Anordnung, Frühwarnscore (z. B. NEWS2) und Hausstandard.' });
  return out;
};

// ---------------------------------------------------------------- Hygiene

export type HygieneEbene = 'basis' | 'fall' | 'einrichtung';
export const HYGIENE_EBENE: Record<HygieneEbene, string> = {
  basis: 'Basishygiene: gilt bei allen Patientinnen und Patienten, immer',
  fall: 'Fallbezogen: zusätzliche Maßnahmen je Erreger oder Übertragungsweg',
  einrichtung: 'Lokale Regel: steht im Hygieneplan deiner Einrichtung und kann abweichen',
};
const FALLBEZUG = /MRSA|MRGN|VRE|Noro|Clostridi|C\. diff|Tuberkul|Influenza|COVID|Skabies|Krätze|Isolier|Kontaktisolierung|Tröpfchen|aerogen|FFP|Kohorte|Ausbruch|Erreger/i;
const PHASEN: Array<[RegExp, string]> = [
  [/vor (dem|der) (Patienten|Kontakt|aseptisch|Tätigkeit)|vorher|bevor|anlegen|Vorbereitung/i, 'vor der Tätigkeit'],
  [/während|beim (Verbandwechsel|Absaugen|Legen)|aseptisch/i, 'während der Tätigkeit'],
  [/nach (dem|der) |danach|ablegen|entsorg|Aufbereitung|Flächendesinfektion/i, 'nach der Tätigkeit'],
];

export function hygieneEbene(text: string): HygieneEbene {
  if (EINRICHTUNG.test(text)) return 'einrichtung';
  if (FALLBEZUG.test(text)) return 'fall';
  return 'basis';
}

export const hygieneGrundlage: Grundlage = (a) => {
  const t = texteVon(a);
  const phasen = PHASEN.filter(([r]) => r.test(t)).map(([, s]) => s);
  const out: GrundlageZeile[] = [{ label: 'Ebene', text: HYGIENE_EBENE[hygieneEbene(t)] }];
  if (phasen.length) out.push({ label: 'Phase', text: phasen.join(', ') });
  out.push({ label: 'Quelle', text: `KRINKO-Empfehlungen (RKI) und Infektionsschutzgesetz, Inhaltsstand ${INHALTSSTAND}. Maßgeblich ist der Hygieneplan deiner Einrichtung.` });
  return out;
};
