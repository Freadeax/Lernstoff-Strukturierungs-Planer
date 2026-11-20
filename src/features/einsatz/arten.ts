// Einsatzarten der generalistischen Ausbildung (Orientierungs- und Pflichteinsätze nach § 7 PflBG) und was
// dazu vorher sitzen sollte. Die Zuordnung Einsatz → Themen ist eine fachliche Einschätzung dieser App,
// keine Vorgabe der Schule: Wer einen Einsatz anlegt, kann die Themen frei an- und abwählen.

import type { ID } from '../../core/types';

export type EinsatzArt = 'orientierung' | 'akut' | 'langzeit' | 'ambulant' | 'paediatrie' | 'psychiatrie';

/** Eine Übung für den Bereit-Check. `trainer` ist die TrainerId, unter der Ergebnisse im Lernplan stehen. */
export interface CheckUebung { trainer: string; label: string; path: string }

export interface EinsatzArtInfo {
  id: EinsatzArt;
  name: string;
  kurz: string;
  /** Blatt-Themen, die vor dem Einsatz Vorrang bekommen. */
  themen: ID[];
  /** Passende Settings im Praxissimulator (Scenario.setting). */
  praxisSettings: string[];
  /** Station „Notfall erkennen“ im Bereit-Check. */
  notfall: CheckUebung[];
  /** Station „Typische Handgriffe“ im Bereit-Check. */
  handgriffe: CheckUebung[];
  /** Zwei, drei Sätze: so läuft ein Dienst dort ungefähr ab. Allgemein gehalten, Abläufe je Haus verschieden. */
  alltag: string[];
}

const NOTFALL: CheckUebung = { trainer: 'notfall', label: 'Wissenstrainer Notfall', path: '/lernen/wissen?fach=notfall' };
const HYGIENE: CheckUebung = { trainer: 'hygiene', label: 'Wissenstrainer Hygiene', path: '/lernen/wissen?fach=hygiene' };

export const EINSATZ_ARTEN: EinsatzArtInfo[] = [
  {
    id: 'orientierung', name: 'Orientierungseinsatz', kurz: 'Orientierung',
    themen: ['thema.ph.hygiene', 'thema.beo.vitalzeichen', 'thema.ph.koerperpflege', 'thema.ph.mobilisation', 'thema.pro.sturz', 'thema.pro.dekubitus', 'thema.pp.uebergabe', 'thema.re.schweigepflicht', 'thema.kom.grundlagen', 'thema.fs.abkuerzungen'],
    praxisSettings: ['krankenhaus', 'langzeit', 'ambulant'],
    notfall: [{ ...NOTFALL, path: '/lernen/wissen?fach=notfall&modus=rea' }],
    handgriffe: [HYGIENE, { trainer: 'normwerte', label: 'Wissenstrainer Normwerte: Vitalzeichen', path: '/lernen/wissen?fach=normwerte&bereich=vital' }],
    alltag: [
      'Du gehst mit einer Pflegefachperson mit und übernimmst nach und nach eigene Aufgaben, zuerst Körperpflege, Mobilisation und Vitalzeichen.',
      'Frag am ersten Tag nach Dienstzeiten, Ansprechperson, Notfallnummer, Hygieneplan und wo Material liegt.',
    ],
  },
  {
    id: 'akut', name: 'Stationäre Akutpflege (Krankenhaus)', kurz: 'Akutpflege',
    themen: ['thema.beo.vitalzeichen', 'thema.beo.notfall', 'thema.ph.hygiene', 'thema.ph.medikamente', 'thema.ph.injektion', 'thema.ph.wunde', 'thema.ph.periop', 'thema.pro.thrombose', 'thema.pro.pneumonie', 'thema.kl.herz.insuffizienz', 'thema.kl.atmung', 'thema.kl.diabetes', 'thema.kl.infektion', 'thema.pp.uebergabe', 'thema.fa.akut'],
    praxisSettings: ['krankenhaus', 'notaufnahme', 'aufwachraum', 'intensiv', 'imc', 'schockraum'],
    notfall: [{ ...NOTFALL, label: 'Wissenstrainer Notfall: ABCDE', path: '/lernen/wissen?fach=notfall&modus=abcde' }],
    handgriffe: [{ trainer: 'ablauf', label: 'Ablauf-Werkbank: Verbandwechsel', path: '/lernen/ablauf?ablauf=verbandwechsel&modus=durchfuehren' }, { trainer: 'arzneimittel', label: 'Wissenstrainer Arzneimittel', path: '/lernen/wissen?fach=arzneimittel' }, { trainer: 'rechnen', label: 'Rechentrainer', path: '/lernen/rechnen' }, HYGIENE],
    alltag: [
      'Frühdienst beginnt mit der Übergabe, dann Vitalzeichen, Körperpflege, Medikamente und Visite. Aufnahmen, Entlassungen und OP-Vorbereitungen kommen dazwischen.',
      'Neu sind oft Infusionen, Wunden nach OP, Drainagen und die Überwachung nach dem Eingriff.',
    ],
  },
  {
    id: 'langzeit', name: 'Stationäre Langzeitpflege (Pflegeheim)', kurz: 'Langzeitpflege',
    themen: ['thema.kl.demenz', 'thema.kl.geriatrie', 'thema.pro.dekubitus', 'thema.pro.sturz', 'thema.pro.dehydratation', 'thema.pro.kontraktur', 'thema.pro.deprivation', 'thema.ph.koerperpflege', 'thema.ph.ernaehrung', 'thema.ph.ausscheidung', 'thema.pp.sis', 'thema.re.fem', 'thema.re.pflegegrade', 'thema.kom.kultur', 'thema.fa.langzeit'],
    praxisSettings: ['langzeit'],
    notfall: [{ ...NOTFALL, path: '/lernen/wissen?fach=notfall&modus=rea' }],
    handgriffe: [{ trainer: 'ablauf', label: 'Ablauf-Werkbank: Medikamente richten', path: '/lernen/ablauf?ablauf=medikamente&modus=durchfuehren' }, { trainer: 'assessment', label: 'Assessments', path: '/lernen/assessment' }, { trainer: 'expertenstandards', label: 'Wissenstrainer Expertenstandards', path: '/lernen/wissen?fach=expertenstandards' }, { trainer: 'sis', label: 'SIS-Trainer', path: '/lernen/sis' }],
    alltag: [
      'Der Tag folgt dem Rhythmus der Bewohnerinnen und Bewohner: Grundpflege, Mahlzeiten, Beschäftigung, Ruhezeiten. Du lernst Menschen über Wochen kennen.',
      'Wichtig sind Biografie, Demenz, Sturz- und Dekubitusrisiko, Trinkmengen und die Dokumentation nach SIS.',
    ],
  },
  {
    id: 'ambulant', name: 'Ambulante Pflege', kurz: 'Ambulant',
    themen: ['thema.re.sgb5', 'thema.re.sgb11', 'thema.re.pflegegrade', 'thema.re.versorgung', 'thema.pp.sis', 'thema.kom.beratung', 'thema.kl.diabetes', 'thema.kl.herz.insuffizienz', 'thema.ph.medikamente', 'thema.ph.wunde', 'thema.pro.sturz', 'thema.fa.ambulant'],
    praxisSettings: ['ambulant'],
    notfall: [{ ...NOTFALL, path: '/lernen/wissen?fach=notfall&modus=rea' }],
    handgriffe: [{ trainer: 'ablauf', label: 'Ablauf-Werkbank: s.c.-Injektion', path: '/lernen/ablauf?ablauf=sc-injektion&modus=durchfuehren' }, { trainer: 'sis', label: 'SIS-Trainer', path: '/lernen/sis' }, { trainer: 'arzneimittel', label: 'Wissenstrainer Arzneimittel', path: '/lernen/wissen?fach=arzneimittel' }, HYGIENE],
    alltag: [
      'Du fährst eine Tour mit festen Einsätzen: Medikamente, Insulin, Kompressionsstrümpfe, Wundversorgung, Körperpflege. Zeit je Besuch ist knapp geplant.',
      'Du bist Gast in der Wohnung. Angehörige, Hausärztin und Leistungen nach SGB V und XI spielen ständig mit.',
    ],
  },
  {
    id: 'paediatrie', name: 'Pädiatrische Versorgung', kurz: 'Pädiatrie',
    themen: ['thema.kl.paediatrie', 'thema.ph.neugeborenes', 'thema.ap.fortpflanzung', 'thema.beo.vitalzeichen', 'thema.beo.notfall', 'thema.ph.medikamente', 'thema.ph.ernaehrung', 'thema.ph.hygiene', 'thema.kom.beratung', 'thema.fa.paediatrie'],
    praxisSettings: ['paediatrie'],
    notfall: [{ ...NOTFALL, label: 'Wissenstrainer Notfall: Reanimation (auch Kinder)', path: '/lernen/wissen?fach=notfall&modus=rea' }],
    handgriffe: [{ trainer: 'labor', label: 'Wissenstrainer Labor: Kinder', path: '/lernen/wissen?fach=labor&bereich=kinder' }, { trainer: 'rechnen', label: 'Rechentrainer', path: '/lernen/rechnen' }, HYGIENE],
    alltag: [
      'Normwerte hängen vom Alter ab, Medikamente werden nach Gewicht dosiert. Eltern sind fast immer dabei und Teil der Pflege.',
      'Typisch sind Infekte der Atemwege, Magen-Darm-Infekte mit Flüssigkeitsverlust, Fieberkrämpfe und Neugeborene.',
    ],
  },
  {
    id: 'psychiatrie', name: 'Psychiatrische Versorgung', kurz: 'Psychiatrie',
    themen: ['thema.kl.psych', 'thema.kl.demenz', 'thema.pro.delir', 'thema.kom.gespraech', 'thema.kom.grundlagen', 'thema.kom.selbstpflege', 'thema.re.fem', 'thema.re.betreuung', 'thema.fa.psychiatrie'],
    praxisSettings: ['psychiatrie'],
    notfall: [NOTFALL],
    handgriffe: [{ trainer: 'grundlagen', label: 'Wissenstrainer Grundlagen', path: '/lernen/wissen?fach=grundlagen' }, { trainer: 'recht', label: 'Wissenstrainer Recht', path: '/lernen/wissen?fach=recht' }],
    alltag: [
      'Beziehung und Gespräch sind das wichtigste Werkzeug. Stationsregeln, Gruppen und Therapien geben den Tag vor.',
      'Lern früh, wie die Station mit Krisen, Deeskalation und Schutzmaßnahmen umgeht und wer dich unterstützt.',
    ],
  },
];

export const ART = new Map(EINSATZ_ARTEN.map((a) => [a.id, a]));
export const istEinsatzArt = (x: unknown): x is EinsatzArt => typeof x === 'string' && ART.has(x as EinsatzArt);

/**
 * Alltagswörter von Station, die im Glossar nicht als Begriff stehen, zu Blatt-Themen. Ergänzt die
 * Themenvorschläge im Praxistagebuch. Schlüssel klein geschrieben, Treffer am Wortanfang.
 */
export const STICHWORTE: Record<string, ID[]> = {
  wunde: ['thema.ph.wunde'], verband: ['thema.ph.wunde'], verbandwechsel: ['thema.ph.wunde'],
  zucker: ['thema.kl.diabetes'], insulin: ['thema.kl.diabetes', 'thema.ph.injektion'], bz: ['thema.kl.diabetes'], blutzucker: ['thema.kl.diabetes'],
  sturz: ['thema.pro.sturz'], gestürzt: ['thema.pro.sturz'], dekubitus: ['thema.pro.dekubitus'], druckgeschwür: ['thema.pro.dekubitus'], lagerung: ['thema.ph.mobilisation'], mobilisation: ['thema.ph.mobilisation'],
  blutdruck: ['thema.beo.vitalzeichen'], rr: ['thema.beo.vitalzeichen'], puls: ['thema.beo.vitalzeichen'], sättigung: ['thema.beo.vitalzeichen'], spo2: ['thema.beo.vitalzeichen'], fieber: ['thema.beo.vitalzeichen'], temperatur: ['thema.beo.vitalzeichen'], vitalzeichen: ['thema.beo.vitalzeichen'],
  katheter: ['thema.ph.ausscheidung'], dk: ['thema.ph.ausscheidung'], inkontinenz: ['thema.ph.ausscheidung'], stuhlgang: ['thema.ph.ausscheidung'],
  infusion: ['thema.ph.injektion'], spritze: ['thema.ph.injektion'], injektion: ['thema.ph.injektion'], 'i.v.': ['thema.ph.injektion'], 's.c.': ['thema.ph.injektion'], blutentnahme: ['thema.ph.injektion'],
  medikament: ['thema.ph.medikamente'], tabletten: ['thema.ph.medikamente'], stellen: ['thema.ph.medikamente'], btm: ['thema.ph.medikamente'],
  demenz: ['thema.kl.demenz'], delir: ['thema.kl.demenz', 'thema.pro.delir'], verwirrt: ['thema.kl.demenz', 'thema.pro.delir'],
  schmerz: ['thema.beo.bewusstsein'], schmerzen: ['thema.beo.bewusstsein'],
  übergabe: ['thema.pp.uebergabe'], sbar: ['thema.pp.uebergabe'], sis: ['thema.pp.sis'], pflegebericht: ['thema.pp.evaluation'], pflegeplanung: ['thema.pp.massnahmen'],
  hygiene: ['thema.ph.hygiene'], desinfektion: ['thema.ph.hygiene'], händedesinfektion: ['thema.ph.hygiene'], isolation: ['thema.ph.hygiene'], mrsa: ['thema.ph.hygiene', 'thema.kl.infektion'], noro: ['thema.ph.hygiene', 'thema.kl.infektion'],
  essen: ['thema.ph.ernaehrung'], trinken: ['thema.ph.ernaehrung', 'thema.pro.dehydratation'], sonde: ['thema.ph.ernaehrung'], peg: ['thema.ph.ernaehrung'], schlucken: ['thema.pro.aspiration'],
  thrombose: ['thema.pro.thrombose'], kompression: ['thema.pro.thrombose'], heparin: ['thema.pro.thrombose', 'thema.ph.injektion'],
  atemnot: ['thema.kl.atmung'], copd: ['thema.kl.atmung'], asthma: ['thema.kl.atmung', 'thema.kl.paediatrie'], pneumonie: ['thema.pro.pneumonie', 'thema.kl.atmung'], sauerstoff: ['thema.kl.atmung'],
  herzinsuffizienz: ['thema.kl.herz.insuffizienz'], ödeme: ['thema.kl.herz.insuffizienz'], wassereinlagerung: ['thema.kl.herz.insuffizienz'],
  reanimation: ['thema.beo.notfall'], notfall: ['thema.beo.notfall'], bewusstlos: ['thema.beo.notfall'],
  op: ['thema.ph.periop'], postoperativ: ['thema.ph.periop'], drainage: ['thema.ph.periop'],
  sterben: ['thema.ph.palliativ'], palliativ: ['thema.ph.palliativ'], verstorben: ['thema.ph.palliativ'],
  mundpflege: ['thema.ph.mund'], körperpflege: ['thema.ph.koerperpflege'], waschen: ['thema.ph.koerperpflege'],
  angehörige: ['thema.kom.gespraech'], gespräch: ['thema.kom.gespraech'], beratung: ['thema.kom.beratung'], anleitung: ['thema.kom.beratung'],
  fixierung: ['thema.re.fem'], bettgitter: ['thema.re.fem'], schweigepflicht: ['thema.re.schweigepflicht'],
  baby: ['thema.ph.neugeborenes'], neugeborenes: ['thema.ph.neugeborenes'], stillen: ['thema.ph.neugeborenes'], kind: ['thema.kl.paediatrie'], fieberkrampf: ['thema.kl.paediatrie'],
  depression: ['thema.kl.psych'], suizid: ['thema.kl.psych'], angst: ['thema.kl.psych'], sucht: ['thema.kl.psych'], alkohol: ['thema.kl.psych'],
  schlaganfall: ['thema.kl.neuro.schlaganfall'], apoplex: ['thema.kl.neuro.schlaganfall'], parkinson: ['thema.kl.neuro.parkinson'], krampfanfall: ['thema.kl.neuro.epilepsie'],
  sepsis: ['thema.kl.infektion'], infektion: ['thema.kl.infektion'],
};
