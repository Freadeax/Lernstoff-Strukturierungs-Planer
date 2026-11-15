// Quellenregister: alle festen Quellen, auf denen Lerninhalte beruhen, mit dem Stand in der App,
// der neuesten bekannten Fassung, dem Datum der letzten Prüfung und der Stelle, an der neue Fassungen
// erscheinen. Es gibt keinen automatischen Abruf fremder Seiten (offline, kein Datenabfluss): Wer
// prüft, öffnet die offizielle Übersicht, vergleicht und trägt hier ein oder vermerkt lokal „geprüft“.
//
// Regeln für Einträge
// - `aktuell` nur mit Fundstelle beim Herausgeber oder einer zitierfähigen Veröffentlichung (https).
// - `geprueftAm` nur, wenn die Fassung an diesem Tag wirklich nachgesehen wurde. Fehlt es, zeigt die
//   App „noch nie geprüft“ statt Sicherheit vorzutäuschen.
// - `offen` beschreibt einen bekannten Abgleich, der noch aussteht (neue Fassung, Gesetzesänderung).
//   Erst entfernen, wenn die Inhalte angepasst sind und die Quellenangaben den neuen Stand tragen.
// - DNQP-Standards kommen aus src/features/dnqp (eine Datenquelle) und werden in register.ts ergänzt.
//   Diese Datei bleibt ohne DNQP-Daten, damit Simulatoren den Hinweis auf neue Fassungen laden
//   können, ohne die Standardtexte mitzuladen.


export type QuellenArt = 'gesetz' | 'expertenstandard' | 'leitlinie' | 'empfehlung' | 'instrument' | 'fachinformation';

export const ART_LABEL: Record<QuellenArt, string> = {
  gesetz: 'Gesetze und Verordnungen',
  expertenstandard: 'Expertenstandards (DNQP)',
  leitlinie: 'Leitlinien',
  empfehlung: 'Empfehlungen und Konzepte',
  instrument: 'Assessment-Instrumente (Originalquellen)',
  fachinformation: 'Fachinformationen',
};

/** Rangfolge der Verbindlichkeit, für die Erklärung auf der Seite. */
export const ART_RANG: QuellenArt[] = ['gesetz', 'expertenstandard', 'leitlinie', 'empfehlung', 'fachinformation', 'instrument'];

export interface Fassung {
  /** Fassung, wie sie zitiert wird, z. B. „2025“ oder „2. Aktualisierung 2025“. Das Jahr zählt für den Vergleich. */
  stand: string;
  /** Erscheinungs- oder Inkrafttretensdatum JJJJ-MM-TT, soweit bekannt. */
  erschienen?: string;
  /** Wo die Fassung belegt ist. */
  fundstelle: string;
}

export interface QuellenEintrag {
  id: string;
  titel: string;
  herausgeber: string;
  art: QuellenArt;
  /** Erkennt die Quellenangaben der Inhalte (Freigabe.quellen.titel), die zu diesem Eintrag gehören. */
  muster: RegExp;
  /** Neueste bekannte Fassung beim Herausgeber. */
  aktuell: Fassung;
  /** Stand der App-Inhalte, wenn er nicht aus den Quellenangaben der Inhalte folgt. */
  appStand?: string;
  /** Wann die neueste Fassung zuletzt beim Herausgeber nachgesehen wurde (JJJJ-MM-TT). */
  geprueftAm?: string;
  /** Offizielle Seite, auf der neue Fassungen erscheinen. */
  beobachten: string;
  /** Nach wie vielen Monaten erneut nachsehen. Gesetze häufiger als Leitlinien. */
  intervallMonate: number;
  /** Bekannter, noch ausstehender Abgleich der Inhalte. */
  offen?: string;
  /** Was die neueste Fassung für die Lerninhalte ändert (kurz). */
  kern?: string;
  hinweis?: string;
  /** Originalveröffentlichung (z. B. eines Scores): ändert sich nicht, wird nicht wiederkehrend geprüft. */
  fest?: boolean;
}

export const HEUTE_GEPRUEFT = '2026-11-15';
export const GII = (pfad: string) => `https://www.gesetze-im-internet.de/${pfad}/`;
const AWMF = 'https://register.awmf.org/de/leitlinien/aktuelle-leitlinien';

// ---------------------------------------------------------------- Gesetze

export const GESETZE: QuellenEintrag[] = [
  {
    id: 'gesetz.pflbg', titel: 'Pflegeberufegesetz (PflBG)', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /PflBG/,
    aktuell: { stand: 'geändert 2026', erschienen: '2026-01-01', fundstelle: 'https://www.bundesgesundheitsministerium.de/service/gesetze-und-verordnungen/detail/gesetz-befugniserweiterung-entbuerokratisierung-pflege.html' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: GII('pflbg'), intervallMonate: 6,
    kern: 'Gesetz zur Befugniserweiterung und Entbürokratisierung in der Pflege vom 29.12.2025 (BGBl. 2025 I Nr. 371), in Kraft seit 1.1.2026: Pflegefachpersonen erhalten erweiterte, eigenständige Befugnisse.',
    offen: 'Recht-Trainer (Bereich Delegation, Vorbehaltsaufgaben § 4 PflBG) und Glossar gegen den geänderten Gesetzestext abgleichen; die Inhalte wurden vor der Änderung geschrieben.',
  },
  {
    id: 'gesetz.pflfassg', titel: 'Pflegefachassistenzgesetz', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /Pflegefachassistenz/,
    aktuell: { stand: '2025, in Kraft ab 2027', erschienen: '2027-01-01', fundstelle: 'https://www.bundesgesundheitsministerium.de/service/gesetze-und-verordnungen/detail/pflegefachassistenzeinfuehrungsgesetz' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://www.recht.bund.de/', intervallMonate: 6,
    kern: 'Bundeseinheitliche Pflegefachassistenzausbildung (Gesetz vom 31.10.2025, BGBl. 2025 I Nr. 259), in Kraft ab 1.1.2027.',
    hinweis: 'Noch keine eigenen Lerninhalte. Ab 2027 wichtig für Delegation an Assistenzkräfte.',
  },
  {
    id: 'gesetz.pflaprv', titel: 'Pflegeberufe-Ausbildungs- und -Prüfungsverordnung (PflAPrV)', herausgeber: 'Bundesverordnungsgeber', art: 'gesetz', muster: /PflAPrV/,
    aktuell: { stand: 'Fassung laut gesetze-im-internet.de', fundstelle: GII('pflaprv') },
    geprueftAm: '2026-10-27', beobachten: GII('pflaprv'), intervallMonate: 6,
    hinweis: 'Anlage 2 und §§ 7, 14–16 im Katalog gegen den Originaltext geprüft.',
  },
  {
    id: 'gesetz.sgb11', titel: 'SGB XI – Soziale Pflegeversicherung', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /SGB XI/,
    aktuell: { stand: 'Fassung laut gesetze-im-internet.de', fundstelle: GII('sgb_11') },
    geprueftAm: '2026-10-27', beobachten: GII('sgb_11'), intervallMonate: 6,
    hinweis: '§§ 14, 15 (Pflegebedürftigkeit, Begutachtung) geprüft. § 113a (Expertenstandards) ist seit 1.7.2023 aufgehoben. Leistungsbeträge ändern sich häufig und stehen bewusst nicht in den Übungen.',
  },
  {
    id: 'gesetz.bgb', titel: 'BGB, u. a. Betreuungsrecht (§§ 1814 ff.) und Behandlungsvertrag (§§ 630a ff.)', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /BGB|Betreuungsrecht/,
    aktuell: { stand: 'Betreuungsrechtsreform 2023', erschienen: '2023-01-01', fundstelle: GII('bgb') },
    beobachten: GII('bgb'), intervallMonate: 6,
  },
  {
    id: 'gesetz.stgb', titel: 'StGB, u. a. §§ 203, 223 ff., 239, 323c', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /StGB/,
    aktuell: { stand: 'Fassung laut gesetze-im-internet.de', fundstelle: GII('stgb') }, beobachten: GII('stgb'), intervallMonate: 12,
  },
  {
    id: 'gesetz.sgb5', titel: 'SGB V – Gesetzliche Krankenversicherung', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /SGB V\b/,
    aktuell: { stand: 'Fassung laut gesetze-im-internet.de', fundstelle: GII('sgb_5') }, beobachten: GII('sgb_5'), intervallMonate: 6,
  },
  {
    id: 'gesetz.arbeitsschutz', titel: 'Arbeitszeit- und Mutterschutzrecht (ArbZG, MuSchG)', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /ArbZG|MuSchG/,
    aktuell: { stand: 'Fassung laut gesetze-im-internet.de', fundstelle: GII('arbzg') }, beobachten: GII('arbzg'), intervallMonate: 12,
  },
  {
    id: 'gesetz.ifsg', titel: 'Infektionsschutzgesetz (IfSG)', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /Infektionsschutzgesetz|IfSG/,
    aktuell: { stand: 'Fassung laut gesetze-im-internet.de', fundstelle: GII('ifsg') }, beobachten: GII('ifsg'), intervallMonate: 6,
  },
];

// ---------------------------------------------------------------- Leitlinien und Empfehlungen

export const LEITLINIEN: QuellenEintrag[] = [
  {
    id: 'erc', titel: 'ERC-Leitlinien Reanimation (BLS, ALS, Kinder, Neugeborene)', herausgeber: 'European Resuscitation Council', art: 'leitlinie', muster: /^ERC Guidelines/,
    aktuell: { stand: '2025', erschienen: '2025-10-27', fundstelle: 'https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://cprguidelines.eu/', intervallMonate: 12,
    kern: 'Bei fehlender Reaktion sofort Hilfe rufen und die Atmung während des Notrufs prüfen; im Zweifel mit der Reanimation beginnen. Frequenz 100–120/min, Tiefe 5–6 cm und 30:2 bleiben. Eigene Kapitel 2025 für Kinder und Neugeborene.',
  },
  {
    id: 'resus.abcde', titel: 'Resuscitation Council UK: The ABCDE approach', herausgeber: 'Resuscitation Council UK', art: 'empfehlung', muster: /The ABCDE approach/,
    aktuell: { stand: '2021', fundstelle: 'https://www.resus.org.uk/library/abcde-approach' },
    beobachten: 'https://www.resus.org.uk/library', intervallMonate: 12,
    hinweis: 'Resus UK hat 2025 neue Reanimationsleitlinien veröffentlicht; ob die ABCDE-Seite dabei geändert wurde, ist noch nicht nachgesehen.',
  },
  {
    id: 'resus.anaphylaxie', titel: 'Resuscitation Council UK: Emergency treatment of anaphylaxis', herausgeber: 'Resuscitation Council UK', art: 'leitlinie', muster: /treatment of anaphylaxis/,
    aktuell: { stand: '2021', erschienen: '2021-05-01', fundstelle: 'https://www.resus.org.uk/library/additional-guidance/guidance-anaphylaxis/emergency-treatment' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://www.resus.org.uk/library/additional-guidance/guidance-anaphylaxis', intervallMonate: 12,
  },
  {
    id: 'ssc', titel: 'Surviving Sepsis Campaign: Leitlinien Sepsis und septischer Schock (Erwachsene)', herausgeber: 'SCCM und ESICM', art: 'leitlinie', muster: /^Surviving Sepsis Campaign/,
    aktuell: { stand: '2026', erschienen: '2026-03-23', fundstelle: 'https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://www.sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines', intervallMonate: 12,
    kern: 'Antibiotika sofort, möglichst innerhalb 1 Stunde; Blutkulturen möglichst vorher. Zum Erkennen auf Station Frühwarnscores wie NEWS2 statt qSOFA als alleiniges Instrument. Ziel-MAP zunächst 65 mmHg.',
  },
  {
    id: 'esc.hf', titel: 'ESC-Leitlinie Herzinsuffizienz', herausgeber: 'European Society of Cardiology', art: 'leitlinie', muster: /ESC Guidelines for heart failure/,
    aktuell: { stand: '2026', erschienen: '2026-08-29', fundstelle: 'https://www.acc.org/Latest-in-Cardiology/Articles/2026/08/29/08/48/mon-guidelines-esc-2026' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://www.escardio.org/Guidelines', intervallMonate: 12,
    kern: 'Neue Fassung 2026: Stadien von der Vorbeugung bis zur fortgeschrittenen Erkrankung, vereinfachte Einteilung nach Auswurfleistung, „dekompensierte“ statt „akute“ Herzinsuffizienz.',
  },
  {
    id: 'esc.le', titel: 'ESC-Leitlinie akute Lungenembolie', herausgeber: 'European Society of Cardiology', art: 'leitlinie', muster: /ESC Guidelines on acute pulmonary embolism/,
    aktuell: { stand: '2019', fundstelle: 'https://www.escardio.org/Guidelines' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://www.escardio.org/Guidelines', intervallMonate: 12,
    hinweis: 'Bei ESC weiterhin Fassung 2019. In den USA ist 2026 eine neue Leitlinie von AHA/ACC erschienen; für Europa gilt sie nicht.',
  },
  {
    id: 'kdigo.aki', titel: 'KDIGO-Leitlinie akutes Nierenversagen (AKI)', herausgeber: 'KDIGO', art: 'leitlinie', muster: /^KDIGO/,
    aktuell: { stand: '2012', fundstelle: 'https://kdigo.org/guidelines/acute-kidney-injury/' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://kdigo.org/guidelines/acute-kidney-injury/', intervallMonate: 3,
    hinweis: 'Neufassung 2026 (AKI/AKD) lag bis Mai 2026 als Entwurf zur Begutachtung vor und ist noch nicht veröffentlicht. Darum kurzes Prüfintervall.',
  },
  {
    id: 'ukka.hyperkaliaemie', titel: 'UKKA: Management of Hyperkalaemia in Adults', herausgeber: 'UK Kidney Association', art: 'leitlinie', muster: /UK Kidney Association/,
    aktuell: { stand: '2026', erschienen: '2026-07-01', fundstelle: 'https://www.ukkidney.org/sites/default/files/documents/FINAL%20VERSION%20-%20UKKA%20CLINICAL%20PRACTICE%20GUIDELINE%20-%20MANAGEMENT%20OF%20HYPERKALAEMIA%20IN%20ADULTS%20-%20UPDATED%20JULY%202026_0.pdf' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://www.ukkidney.org/', intervallMonate: 12,
    kern: 'Fassung Juli 2026: 12-Kanal-EKG ab Kalium 6,0 mmol/l, kontinuierliches Monitoring ab 6,5; nach Insulin-Glukose engmaschige Blutzuckerkontrollen bis 6 Stunden.',
  },
  {
    id: 'awmf.kompression', titel: 'AWMF S2k-Leitlinie Kompressionstherapie der Extremitäten (037-005)', herausgeber: 'DGP über AWMF', art: 'leitlinie', muster: /Kompressionstherapie der Extremitäten/,
    aktuell: { stand: '2026', erschienen: '2026-05-28', fundstelle: 'https://register.awmf.org/assets/guidelines/037-005l_S2k_Kompressionstherapie-der-Extremitaeten_2026-07.pdf' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    kern: 'Version 5.0 (Stand 28.05.2026) ersetzt die Fassung 2018 und behandelt Strumpf, Verband und adaptive Kompressionssysteme gemeinsam.',
  },
  {
    id: 'nvl.asthma', titel: 'Nationale VersorgungsLeitlinie Asthma', herausgeber: 'BÄK, KBV, AWMF', art: 'leitlinie', muster: /VersorgungsLeitlinie Asthma/,
    aktuell: { stand: '2024', fundstelle: 'https://register.awmf.org/assets/guidelines/nvl-002m_S3_Asthma_2024-08.pdf' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://www.leitlinien.de/themen/asthma', intervallMonate: 12,
    hinweis: '5. Auflage. Für Deutschland maßgeblich vor GINA.',
  },
  {
    id: 'gina', titel: 'GINA Global Strategy for Asthma Management and Prevention', herausgeber: 'Global Initiative for Asthma', art: 'leitlinie', muster: /^GINA/,
    aktuell: { stand: '2026', fundstelle: 'https://ginasthma.org/2026-gina-strategy-report/' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://ginasthma.org/reports/', intervallMonate: 12,
    kern: 'Jährliche Neufassung. Bericht 2026 mit überarbeiteten Kapiteln zum akuten Asthma bei Erwachsenen und Kindern.',
  },
  {
    id: 'nice.ng9', titel: 'NICE NG9: Bronchiolitis in children', herausgeber: 'NICE', art: 'leitlinie', muster: /^NICE NG9/,
    aktuell: { stand: '2021', fundstelle: 'https://www.nice.org.uk/guidance/ng9' }, beobachten: 'https://www.nice.org.uk/guidance/ng9', intervallMonate: 12,
  },
  {
    id: 'espghan.gastroenteritis', titel: 'ESPGHAN/ESPID: Akute Gastroenteritis bei Kindern', herausgeber: 'ESPGHAN und ESPID', art: 'leitlinie', muster: /^ESPGHAN/,
    aktuell: { stand: '2014', fundstelle: 'https://pubmed.ncbi.nlm.nih.gov/?term=ESPGHAN+ESPID+acute+gastroenteritis+children+2014' }, beobachten: 'https://www.espghan.org/', intervallMonate: 12,
    hinweis: 'Für Deutschland gibt es die AWMF-S2k-Leitlinie Akute infektiöse Gastroenteritis bei Säuglingen, Kindern und Jugendlichen (068-003, Stand 05/2024). Sie wäre die passendere Quelle.',
  },
  {
    id: 'jbds.hypo', titel: 'JBDS: Hospital management of hypoglycaemia in adults with diabetes', herausgeber: 'Joint British Diabetes Societies', art: 'leitlinie', muster: /^JBDS(: (The )?[Hh]ospital management of hypoglycaemia)/,
    aktuell: { stand: '2022', erschienen: '2022-03-23', fundstelle: 'https://diabetestimes.co.uk/updated-jbds-hypoglycaemia-management-guideline-published/' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://abcd.care/', intervallMonate: 12,
    hinweis: 'Die Inhalte nennen den Stand 2023; die zuletzt veröffentlichte Fassung ist vom März 2022. Jahreszahl in den Quellenangaben prüfen.',
  },
  {
    id: 'jbds.dka', titel: 'JBDS-IP: Management of diabetic ketoacidosis in adults', herausgeber: 'Joint British Diabetes Societies', art: 'leitlinie', muster: /^JBDS-IP: Management of diabetic ketoacidosis/,
    aktuell: { stand: '2023', fundstelle: 'https://abcd.care/' },
    beobachten: 'https://abcd.care/', intervallMonate: 12,
  },
  {
    id: 'bts.pleura', titel: 'BTS Guideline for pleural disease', herausgeber: 'British Thoracic Society', art: 'leitlinie', muster: /^BTS Guideline for pleural/,
    aktuell: { stand: '2023', fundstelle: 'https://www.brit-thoracic.org.uk/' },
    beobachten: 'https://www.brit-thoracic.org.uk/', intervallMonate: 12,
  },
  {
    id: 'esge.blutung', titel: 'ESGE: Nonvariceal upper GI hemorrhage', herausgeber: 'European Society of Gastrointestinal Endoscopy', art: 'leitlinie', muster: /^ESGE Guideline/,
    aktuell: { stand: '2021', fundstelle: 'https://pubmed.ncbi.nlm.nih.gov/?term=ESGE+nonvariceal+upper+gastrointestinal+hemorrhage+2021' }, beobachten: 'https://www.esge.com/', intervallMonate: 12,
  },
  {
    id: 'krinko', titel: 'KRINKO-Empfehlungen (RKI), u. a. Händehygiene', herausgeber: 'Kommission für Krankenhaushygiene und Infektionsprävention am RKI', art: 'empfehlung', muster: /^KRINKO/,
    aktuell: { stand: '2016, geändert 2026', erschienen: '2026-08-06', fundstelle: 'https://www.ptaheute.de/aktuelles/2026/09/09/medizinisches-haendewaschen-kaltes-wasser-genuegt' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://www.rki.de/', intervallMonate: 6,
    kern: 'Aktualisierung der Händehygiene-Empfehlung (Epidemiologisches Bulletin 32/2026): Warmwasser an medizinischen Handwaschplätzen ist nicht mehr verpflichtend. Händedesinfektion bleibt unverändert die wichtigste Maßnahme.',
    offen: 'Hygiene-Trainer auf Aussagen zu Handwaschplätzen und Wassertemperatur durchsehen; danach Stand der Quellenangabe auf 2026 setzen.',
  },
  {
    id: 'who.haendehygiene', titel: 'WHO: 5 Moments for Hand Hygiene', herausgeber: 'WHO', art: 'empfehlung', muster: /^WHO: 5 Moments/,
    aktuell: { stand: '2009', fundstelle: 'https://www.who.int/publications/i/item/9789241597906' }, beobachten: 'https://www.who.int/', intervallMonate: 24,
  },
  {
    id: 'news2', titel: 'NEWS2 (National Early Warning Score 2)', herausgeber: 'Royal College of Physicians', art: 'empfehlung', muster: /NEWS2/,
    aktuell: { stand: '2017', fundstelle: 'https://www.rcp.ac.uk/' },
    beobachten: 'https://www.rcp.ac.uk/', intervallMonate: 12,
    hinweis: 'Gilt nur für Erwachsene ab 16 Jahren, nicht in der Schwangerschaft. Die Surviving Sepsis Campaign 2026 empfiehlt solche Frühwarnscores zum Sepsis-Screening.',
  },
  {
    id: 'teamstepps', titel: 'AHRQ TeamSTEPPS (SBAR)', herausgeber: 'Agency for Healthcare Research and Quality', art: 'empfehlung', muster: /TeamSTEPPS/,
    aktuell: { stand: '2023', fundstelle: 'https://www.ahrq.gov/teamstepps-program/index.html' }, beobachten: 'https://www.ahrq.gov/', intervallMonate: 24,
  },
  {
    id: 'clsi.gp41', titel: 'CLSI GP41: Collection of Diagnostic Venous Blood Specimens', herausgeber: 'Clinical and Laboratory Standards Institute', art: 'empfehlung', muster: /^CLSI GP41/,
    aktuell: { stand: '2017', fundstelle: 'https://clsi.org/' }, beobachten: 'https://clsi.org/', intervallMonate: 24,
  },
  {
    id: 'fachinfo', titel: 'Fachinformationen und Gebrauchsinformationen', herausgeber: 'Hersteller (Fachinfo-Service)', art: 'fachinformation', muster: /Fachinformation|Gebrauchsinformation|Herstellerangaben/,
    aktuell: { stand: 'je Präparat', fundstelle: 'https://www.fachinfo.de/' }, beobachten: 'https://www.fachinfo.de/', intervallMonate: 12,
    hinweis: 'Maßgeblich ist immer die Fachinformation des verwendeten Präparats; die App nennt nur Wirkstoffgruppen.',
  },
];

// ---------------------------------------------------------------- Originalquellen der Instrumente

const fest = (id: string, titel: string, muster: RegExp, stand: string, fundstelle: string): QuellenEintrag => ({
  id, titel, herausgeber: 'Originalveröffentlichung', art: 'instrument', muster, aktuell: { stand, fundstelle }, beobachten: fundstelle, intervallMonate: 0, fest: true,
});

export const INSTRUMENTE: QuellenEintrag[] = [
  fest('as.braden', 'Braden-Skala', /Braden Scale/, '1987', 'https://pubmed.ncbi.nlm.nih.gov/?term=Bergstrom+Braden+Braden+Scale+predicting+pressure+sore+risk'),
  fest('as.norton', 'Norton-Skala', /^Norton/, '1962', 'https://search.worldcat.org/search?q=Norton+McLaren+Exton-Smith+investigation+of+geriatric+nursing+problems'),
  fest('as.barthel', 'Barthel-Index, Hamburger Manual', /Barthel-Index/, '2004', 'https://pubmed.ncbi.nlm.nih.gov/?term=Lübke+Meinck+Barthel-Index+Hamburger+Manual'),
  fest('as.besd', 'BESD', /BESD/, '2006', 'https://pubmed.ncbi.nlm.nih.gov/?term=Basler+BESD+Schmerz+Demenz'),
  fest('as.gcs', 'Glasgow Coma Scale', /^Teasdale/, '1974', 'https://pubmed.ncbi.nlm.nih.gov/?term=Teasdale+Jennett+assessment+of+coma+impaired+consciousness'),
  fest('as.mna', 'MNA-SF', /Mini Nutritional Assessment/, '2009', 'https://pubmed.ncbi.nlm.nih.gov/?term=Kaiser+validation+Mini+Nutritional+Assessment+short-form'),
  fest('as.tug', 'Timed Up and Go', /timed Up & Go/, '1991', 'https://pubmed.ncbi.nlm.nih.gov/?term=Podsiadlo+Richardson+timed+up+and+go'),
  fest('as.tinetti', 'Tinetti-Test', /^Tinetti/, '1986', 'https://pubmed.ncbi.nlm.nih.gov/?term=Tinetti+performance-oriented+assessment+mobility+problems'),
  fest('as.nrs', 'Numerische Rating-Skala', /Downie et al/, '1978', 'https://pubmed.ncbi.nlm.nih.gov/?term=Downie+studies+with+pain+rating+scales'),
];

export const QUELLEN_BASIS: QuellenEintrag[] = [...GESETZE, ...LEITLINIEN, ...INSTRUMENTE];

const jahrAus = (s: string) => s.match(/\d{4}/)?.[0] ?? '';
export const jahr = (stand: string): number => Number(jahrAus(stand) || NaN);

/** Neuere Fassung zu einer Quellenangabe eines Inhalts (nur Leitlinien, Gesetze, Empfehlungen). */
export function neuereFassungFuer(q: { titel: string; stand: string }, liste: readonly QuellenEintrag[] = QUELLEN_BASIS): QuellenEintrag | undefined {
  return liste.find((e) => e.muster.test(q.titel) && jahr(q.stand) < jahr(e.aktuell.stand));
}
