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
  {
    id: 'sepsis',
    titel: 'Gestern war sie noch klar',
    setting: 'krankenhaus',
    kurz: 'Frau H., 81 Jahre, internistische Station, gestern mit Harnwegsinfekt und Blasenkatheter aufgenommen. Beim Frühdienst-Rundgang weiß sie nicht, wo sie ist.',
    verborgen: 'Beginnende Urosepsis. Phase 1: neue Verwirrtheit, Fieber 38,7 °C, AF 23, Puls 108, RR 104/60, wenig trüber Urin (NEWS2 hoch, vor allem wegen der neuen Verwirrtheit). Phase 2 nach etwa 3 Zügen ohne ärztliche Eskalation: RR fällt unter 90, Knie marmoriert, sie reagiert nur noch auf Ansprache. Gute Lösung: vollständige Vitalzeichen, neue Verwirrtheit als Warnzeichen benennen, sofort ärztlich eskalieren (SBAR), Bilanz und Ausscheidung stündlich. Blutkulturen, Laktat, Infusion und Antibiotika ordnet das ärztliche Team an. Unterwegs ruft der Sohn an.',
    topicIds: ['thema.kl.infektion', 'thema.pro.zystitis', 'thema.beo.bewusstsein', 'thema.beo.vitalzeichen', 'thema.pp.uebergabe'],
  },
  {
    id: 'nachblutung',
    titel: 'Der Verband wird rot',
    setting: 'krankenhaus',
    kurz: 'Herr W., 58 Jahre, Unfallchirurgie, heute Mittag Knie-TEP. Am Abend klingelt er: Ihm ist übel und er friert.',
    verborgen: 'Postoperative Nachblutung. Phase 1: Puls 104, RR 112/70, blass, unruhig, Verband durchgefärbt, Drainage 150 ml in der letzten Stunde. Puls steigt vor dem Blutdruckabfall. Phase 2 ohne Information des Arztes: Puls über 120, RR unter 95, kaltschweißig (Schockindex über 1). Mobilisation an die Bettkante führt zum Kollaps. Ein Bedarfs-Schmerzmittel „zum Schlafen“ verdeckt die Warnzeichen. Gute Lösung: Drainage und Verband mit Uhrzeit markieren, engmaschig messen, flach lagern bei Schockzeichen, Arzt sofort informieren, nüchtern lassen. Die Ehefrau ruft an; Auskunft nur mit seiner Zustimmung.',
    topicIds: ['thema.ph.periop', 'thema.ph.wunde', 'thema.beo.notfall', 'thema.beo.vitalzeichen'],
  },
  {
    id: 'copd',
    titel: 'Luft holen fällt schwer',
    setting: 'ambulant',
    kurz: 'Herr P., 72 Jahre, zu Hause, bekannte COPD mit Heimsauerstoff nach Verordnung. Seine Frau hat den Pflegedienst angerufen, weil er seit gestern mehr hustet.',
    verborgen: 'Infektexazerbation einer COPD: grünliches Sputum, AF 26, SpO2 87 % unter verordnetem Sauerstoff, Lippenbremse hilft. Die Ehefrau hat den Sauerstoff „zur Sicherheit“ deutlich höher gedreht; er wird schläfrig (Gefahr der CO2-Retention). Gute Lösung: Atemerleichternde Position, Lippenbremse anleiten, Sauerstoff nur nach Verordnung, Bewusstsein beobachten, Hausarzt oder bei Verschlechterung Notruf, Notfallplan und Inhalationstechnik prüfen, Ehefrau beraten. Verschlechtert sich die Wachheit, ist das ein Notfall.',
    topicIds: ['thema.kl.atmung', 'thema.pro.pneumonie', 'thema.kom.beratung', 'thema.fa.ambulant'],
  },
  {
    id: 'sturz-nacht',
    titel: 'Gefunden neben dem Bett',
    setting: 'langzeit',
    kurz: 'Frau D., 86 Jahre, Pflegeheim, Vorhofflimmern mit Blutverdünner. Bei der Nachtrunde um 3 Uhr liegt sie neben ihrem Bett.',
    verborgen: 'Sturz mit kleiner Platzwunde an der Stirn, zunächst wach und orientiert, will sofort wieder ins Bett. Wegen des Blutverdünners droht eine Hirnblutung: Wird die Bewusstseinslage nicht in festen Abständen kontrolliert, wird sie nach etwa 3 bis 5 Zügen zunehmend schläfrig, die Pupillen werden ungleich, sie erbricht. Gute Lösung: nicht hochziehen, Verletzungen prüfen, Vitalzeichen und Bewusstsein, Arzt bzw. Notruf wegen Blutverdünner, engmaschige neurologische Kontrolle, Sturzprotokoll, Ursachen (Toilettengang, Licht, Schuhe) klären, Angehörige am Morgen informieren.',
    topicIds: ['thema.pro.sturz', 'thema.kl.geriatrie', 'thema.beo.bewusstsein', 'thema.fa.langzeit'],
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
