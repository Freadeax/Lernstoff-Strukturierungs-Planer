// Ausgangslagen für den Fallbeispiel-Simulator. Alle Personen und Werte sind erfunden.
// `verborgen` bekommt nur Claude: so entwickelt sich der Fall, wenn niemand eingreift.
// Lernende sehen nur Titel, Setting und Kurzbeschreibung.

import type { CatalogModule, CatalogTopic } from '../../modules/catalog-types';

export type Setting = 'krankenhaus' | 'langzeit' | 'ambulant' | 'paediatrie';
export type Stufe = 1 | 2 | 3;

export const SETTING_LABEL: Record<Setting, string> = {
  krankenhaus: 'Krankenhaus', langzeit: 'Stationäre Langzeitpflege', ambulant: 'Ambulante Pflege', paediatrie: 'Pädiatrie',
};

export const STUFE_LABEL: Record<Stufe, string> = { 1: 'Einstieg', 2: 'Station', 3: 'Profi' };

export interface Szenario {
  id: string;
  titel: string;
  setting: Setting;
  kurz: string;
  verborgen: string;
  topicIds: string[];
}

export const SZENARIEN: Szenario[] = [
  {
    id: 'herzinsuffizienz',
    titel: 'Atemnot in der Nacht',
    setting: 'krankenhaus',
    kurz: 'Herr K., 78 Jahre, internistische Station, bekannte Herzinsuffizienz. Er klingelt um 2 Uhr nachts.',
    verborgen: 'Beginnende kardiale Dekompensation: Gewichtszunahme 2 kg in 3 Tagen, Beinödeme, feuchte Rasselgeräusche, Orthopnoe. Ohne Oberkörperhochlagerung, Information der Ärztin und Flüssigkeitsbilanz verschlechtert sich die Sättigung deutlich.',
    topicIds: ['thema.kl.herz.insuffizienz', 'thema.beo.notfall', 'thema.pp.anamnese'],
  },
  {
    id: 'hueft-tep',
    titel: 'Erster Tag nach der Hüft-OP',
    setting: 'krankenhaus',
    kurz: 'Frau M., 84 Jahre, Unfallchirurgie, gestern Hüft-TEP rechts nach Sturz. Sie wirkt heute Morgen anders als gestern.',
    verborgen: 'Postoperatives hypoaktives Delir mit Exsikkose (trinkt kaum, Urin konzentriert), dazu Schmerzen, die sie nicht klar äußert. Thrombose- und Sturzrisiko hoch. Bei Mobilisation ohne Vorbereitung Kreislaufproblem.',
    topicIds: ['thema.ph.periop', 'thema.pro.delir', 'thema.pro.sturz', 'thema.pro.thrombose', 'thema.pro.dehydratation'],
  },
  {
    id: 'hypoglykaemie',
    titel: 'Unruhe vor dem Mittagessen',
    setting: 'langzeit',
    kurz: 'Frau S., 81 Jahre, Pflegeheim, Diabetes mellitus Typ 2 mit Insulin, leichte Demenz. Sie ist schweißig und gereizt.',
    verborgen: 'Hypoglykämie (BZ um 48 mg/dl), weil sie das Frühstück kaum gegessen hat, Insulin aber nach Plan gegeben wurde. Wird sie nicht erkannt, trübt sie ein. Später Thema: Ernährungsprotokoll, Rücksprache zur Insulinanpassung.',
    topicIds: ['thema.kl.diabetes', 'thema.kl.demenz', 'thema.ph.medikamente', 'thema.fa.langzeit'],
  },
  {
    id: 'pneumonie',
    titel: 'Fieber und Husten',
    setting: 'langzeit',
    kurz: 'Herr B., 88 Jahre, Pflegeheim, nach Schlaganfall mit Schluckstörung. Er hustet seit gestern beim Essen und ist müde.',
    verborgen: 'Aspirationspneumonie mit Fieber, erhöhter Atemfrequenz und sinkender Sättigung (NEWS2 steigt). Wichtig: Kostform/Andicken, Oberkörperhochlage, Mundpflege, Arzt informieren, Beobachtung.',
    topicIds: ['thema.pro.aspiration', 'thema.pro.pneumonie', 'thema.ph.mund', 'thema.kl.neuro.schlaganfall'],
  },
  {
    id: 'schlaganfall',
    titel: 'Plötzlich hängt der Mundwinkel',
    setting: 'krankenhaus',
    kurz: 'Frau R., 67 Jahre, orthopädische Station, Knie-OP vor 2 Tagen. Beim Frühstück fällt dir ihre verwaschene Sprache auf.',
    verborgen: 'Akuter Schlaganfall (FAST positiv, Symptombeginn vor ca. 20 Minuten). Zeit ist entscheidend: Notfall auslösen, Zeitpunkt dokumentieren, nüchtern lassen (Schluckstörung), BZ ausschließen. Verzögerung verschlechtert den Verlauf.',
    topicIds: ['thema.kl.neuro.schlaganfall', 'thema.beo.notfall', 'thema.pro.aspiration'],
  },
  {
    id: 'dekubitus',
    titel: 'Rötung am Steiß',
    setting: 'ambulant',
    kurz: 'Herr L., 74 Jahre, zu Hause, nach Krankenhausaufenthalt überwiegend im Bett. Seine Frau pflegt ihn, du kommst als ambulante Pflegekraft.',
    verborgen: 'Dekubitus Kategorie 1 am Sakrum (nicht wegdrückbare Rötung), Mangelernährung, Inkontinenz, erschöpfte Angehörige. Gute Lösung: Fingertest, Risikoeinschätzung, Bewegungsplan, Beratung der Ehefrau, Hilfsmittel, Hausarzt.',
    topicIds: ['thema.pro.dekubitus', 'thema.kom.beratung', 'thema.fa.ambulant', 'thema.ph.wunde'],
  },
  {
    id: 'fieberkrampf',
    titel: 'Ein Kind mit hohem Fieber',
    setting: 'paediatrie',
    kurz: 'Lina, 2 Jahre, Kinderstation, Aufnahme wegen Fieber bei Infekt. Die Mutter ruft dich, weil Lina „komisch zuckt“.',
    verborgen: 'Einfacher Fieberkrampf, der nach 2 Minuten endet. Richtig: Sicherheit, Zeit messen, nicht festhalten, Seitenlage danach, Ärztin, Vitalzeichen, Temperatur, Mutter beruhigen und informieren.',
    topicIds: ['thema.fa.paediatrie', 'thema.kl.paediatrie', 'thema.kom.gespraech'],
  },
  {
    id: 'palliativ',
    titel: 'Die letzten Tage',
    setting: 'langzeit',
    kurz: 'Frau H., 92 Jahre, Pflegeheim, fortgeschrittene Herzinsuffizienz, Patientenverfügung liegt vor. Die Tochter ist aufgelöst.',
    verborgen: 'Sterbephase mit Unruhe, Mundtrockenheit und Rasselatmung. Die Tochter will „alles tun lassen“, die Patientenverfügung lehnt Krankenhauseinweisung ab. Gute Lösung: Symptomlinderung, Mundpflege, Gespräch, Hausarzt/Palliativdienst, Wille der Bewohnerin.',
    topicIds: ['thema.ph.palliativ', 'thema.re.betreuung', 'thema.kom.ethik', 'thema.ph.mund'],
  },
];

/** Themen, aus denen sich ein freier Fall erzeugen lässt: Krankheitslehre, Prophylaxen, Pflegehandeln, Fallarbeit. */
export function fallThemen(modul: CatalogModule): CatalogTopic[] {
  const faecher = new Set(['fach.krankheitslehre', 'fach.prophylaxen', 'fach.pflegehandeln', 'fach.fallarbeit']);
  return modul.topics.filter((t) => t.parentId && faecher.has(t.subjectId));
}

export function szenarioAusThema(thema: CatalogTopic, setting: Setting): Szenario {
  return {
    id: `thema:${thema.id}`,
    titel: thema.name,
    setting,
    kurz: `Ein neuer Fall zum Thema „${thema.name}“ (${SETTING_LABEL[setting]}).`,
    verborgen: `Denke dir einen realistischen, für das Thema „${thema.name}“ typischen Fall aus, mit einer Entwicklung, die eine aufmerksame Pflegefachperson rechtzeitig erkennen kann.`,
    topicIds: [thema.id],
  };
}
