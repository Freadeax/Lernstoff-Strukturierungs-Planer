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
    offen: 'Die Vertiefung zur Substitution nennt seit 16.11.2026 den neuen § 4a PflBG (eigenständige Ausübung von Heilkunde). Den genauen Gesetzeswortlaut von § 4a und § 14a noch lesen und den Bereich Delegation im Recht-Trainer sowie das Glossar dagegen prüfen.',
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
  {
    id: 'bverfg.fixierung', titel: 'BVerfG, Urteil vom 24.07.2018 – 2 BvR 309/15, 2 BvR 502/16 (Fixierung)', herausgeber: 'Bundesverfassungsgericht', art: 'gesetz', muster: /^BVerfG, Urteil vom 24\.07\.2018/,
    aktuell: { stand: '2018', erschienen: '2018-07-24', fundstelle: 'https://www.bundesverfassungsgericht.de/SharedDocs/Entscheidungen/DE/2018/07/rs20180724_2bvr030915.html' },
    beobachten: 'https://www.bundesverfassungsgericht.de/', intervallMonate: 24,
    hinweis: '5-Punkt- und 7-Punkt-Fixierung über eine halbe Stunde brauchen eine richterliche Genehmigung, 1:1-Betreuung und ärztliche Anordnung.',
  },
  {
    id: 'gesetz.psychkhg-bw', titel: 'Gesetz über Hilfen und Schutzmaßnahmen bei psychischen Krankheiten Baden-Württemberg (PsychKHG BW)', herausgeber: 'Landesgesetzgeber Baden-Württemberg', art: 'gesetz', muster: /PsychKHG BW/,
    aktuell: { stand: 'Fassung laut landesrecht-bw.de', fundstelle: 'https://www.landesrecht-bw.de/' }, beobachten: 'https://www.landesrecht-bw.de/', intervallMonate: 12,
  },
];

// ---------------------------------------------------------------- Leitlinien und Empfehlungen

export const LEITLINIEN: QuellenEintrag[] = [
  {
    id: 'erc', titel: 'ERC-Leitlinien Reanimation (BLS, ALS, Kinder, Neugeborene)', herausgeber: 'European Resuscitation Council', art: 'leitlinie', muster: /^(ERC (Guidelines|Leitlinien)|European Resuscitation Council)/,
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
    id: 'esc.hf', titel: 'ESC-Leitlinie Herzinsuffizienz', herausgeber: 'European Society of Cardiology', art: 'leitlinie', muster: /ESC Guidelines for (the diagnosis and treatment of acute and chronic )?heart failure/,
    aktuell: { stand: '2026', erschienen: '2026-08-29', fundstelle: 'https://www.acc.org/Latest-in-Cardiology/Articles/2026/08/29/08/48/mon-guidelines-esc-2026' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://www.escardio.org/Guidelines', intervallMonate: 12,
    kern: 'Neue Fassung 2026: Stadien von der Vorbeugung bis zur fortgeschrittenen Erkrankung, vereinfachte Einteilung nach Auswurfleistung, „dekompensierte“ statt „akute“ Herzinsuffizienz.',
    hinweis: 'Begriff „dekompensierte Herzinsuffizienz“ im Diagnostik-Fall seit 16.11.2026 übernommen. Die Fälle bleiben auf Stand 2021, bis NT-proBNP-Grenzen und die Selbstpflege-Regeln (Gewicht 2 kg in 3 Tagen, Trinkmenge) im Volltext 2026 nachgelesen sind.',
    offen: 'Praxisfall Herzschwäche zu Hause (P17b) zitiert noch ESC 2021 mit Update 2023. Selbstpflege-Regeln (Gewicht, Trinkmenge) gegen die Fassung 2026 abgleichen.',
  },
  {
    id: 'esc.le', titel: 'ESC-Leitlinie akute Lungenembolie', herausgeber: 'European Society of Cardiology', art: 'leitlinie', muster: /ESC Guidelines (on|for the diagnosis and management of) acute pulmonary embolism/,
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
    hinweis: 'Der Kinder-Asthma-Fall steht auf GINA 2024. Der Bericht 2026 war am 16.11.2026 nicht frei lesbar; Abgleich bleibt offen, bis die Kapitel zum akuten Asthma beim Kind vorliegen.',
    offen: 'Praxisfall Asthma Schulkind (P19) steht auf GINA 2024. Gegen die Kapitel zum akuten Asthma beim Kind im Bericht 2026 abgleichen, sobald sie frei lesbar sind.',
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
    hinweis: 'Fassung März 2022 (JBDS-01). Die Inhalte nannten zuvor irrtümlich 2023; seit 16.11.2026 korrigiert.',
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
    id: 'krinko', titel: 'KRINKO-Empfehlungen (RKI), u. a. Händehygiene', herausgeber: 'Kommission für Krankenhaushygiene und Infektionsprävention am RKI', art: 'empfehlung', muster: /^KRINKO(?!: Prävention)/,
    aktuell: { stand: '2026 (Änderung der Fassung 2016)', erschienen: '2026-08-06', fundstelle: 'https://www.ptaheute.de/aktuelles/2026/09/09/medizinisches-haendewaschen-kaltes-wasser-genuegt' },
    geprueftAm: HEUTE_GEPRUEFT, beobachten: 'https://www.rki.de/', intervallMonate: 6,
    kern: 'Aktualisierung der Händehygiene-Empfehlung (Epidemiologisches Bulletin 32/2026): Warmwasser an medizinischen Handwaschplätzen ist nicht mehr verpflichtend. Händedesinfektion bleibt unverändert die wichtigste Maßnahme.',
    hinweis: 'Die Änderung betrifft laut Fachpresse nur die Ausstattung medizinischer Handwaschplätze. Der Hygiene-Trainer enthält dazu keine Aussage (am 16.11.2026 durchgesehen). Den Originaltext beim RKI bei der nächsten Prüfung lesen.',
  },
  {
    id: 'who.haendehygiene', titel: 'WHO: 5 Moments for Hand Hygiene', herausgeber: 'WHO', art: 'empfehlung', muster: /^WHO: (5 Moments|Guidelines on Hand Hygiene)/,
    aktuell: { stand: '2009', fundstelle: 'https://www.who.int/publications/i/item/9789241597906' }, beobachten: 'https://www.who.int/', intervallMonate: 24,
  },
  {
    id: 'krinko.cauti', titel: 'KRINKO: Prävention und Kontrolle katheterassoziierter Harnwegsinfektionen', herausgeber: 'Kommission für Krankenhaushygiene und Infektionsprävention am RKI', art: 'empfehlung', muster: /^KRINKO: Prävention und Kontrolle katheterassoziierter/,
    aktuell: { stand: '2015', fundstelle: 'https://www.rki.de/' }, beobachten: 'https://www.rki.de/', intervallMonate: 12,
  },
  {
    id: 'news2', titel: 'NEWS2 (National Early Warning Score 2)', herausgeber: 'Royal College of Physicians', art: 'empfehlung', muster: /NEWS\)? ?2/,
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


// ---------------------------------------------------------------- Praxissimulator (neuer Kern), Audit P20 am 19.11.2026
// Stand je Leitlinie im AWMF-Register bzw. beim Herausgeber nachgesehen (geprueftAm), wo nicht anders vermerkt.

const P20 = '2026-11-19';
const AWMF_PDF = (datei: string) => `https://register.awmf.org/assets/guidelines/${datei}`;

export const PRAXIS_LEITLINIEN: QuellenEintrag[] = [
  {
    id: 'awmf.sepsis', titel: 'S3-Leitlinie Sepsis – Prävention, Diagnose, Therapie und Nachsorge (AWMF 079-001)', herausgeber: 'DSG und DIVI über AWMF', art: 'leitlinie', muster: /AWMF 079-001/,
    aktuell: { stand: '2025', erschienen: '2025-07-01', fundstelle: AWMF_PDF('079-001l_S3_Sepsis-Praevention-Diagnose-Therapie-Nachsorge_2025-07.pdf') },
    geprueftAm: P20, beobachten: AWMF, intervallMonate: 12,
    kern: 'Update 2025 der Fassung 2018; übernimmt die Surviving Sepsis Campaign und ergänzt Nachsorge. Für die Pflege bleibt: früh erkennen (Frühwarnscore), Blutkulturen vor dem Antibiotikum, Antibiotikum innerhalb einer Stunde, Laktat, Volumen.',
    offen: 'Beide Sepsis-Praxisfälle nennen noch die Fassung 2018. Pflegeinhalte decken sich mit der Surviving Sepsis Campaign 2026; Volltext-Abgleich des Updates 2025 (u. a. Nachsorge) steht aus.',
  },
  {
    id: 'awmf.sauerstoff', titel: 'S3-Leitlinie Sauerstoff in der Akuttherapie beim Erwachsenen (AWMF 020-021)', herausgeber: 'DGP über AWMF', art: 'leitlinie', muster: /AWMF 020-021/,
    aktuell: { stand: '2021', erschienen: '2021-06-01', fundstelle: AWMF_PDF('020-021l_S3_Sauerstoff-in-der-Akuttherapie-beim-Erwachsenen_2021-06-abgelaufen.pdf') },
    geprueftAm: P20, beobachten: AWMF, intervallMonate: 12,
    hinweis: 'Gültigkeit im AWMF-Register abgelaufen, eine Neufassung ist noch nicht veröffentlicht. Zielbereich SpO₂ 92–96 % (bei Hyperkapnie-Risiko 88–92 %) weiter als Lehrstand.',
  },
  {
    id: 'awmf.cap', titel: 'S3-Leitlinie ambulant erworbene Pneumonie beim Erwachsenen (AWMF 020-020)', herausgeber: 'DGP über AWMF', art: 'leitlinie', muster: /AWMF 020-020/,
    aktuell: { stand: '2021', erschienen: '2021-05-01', fundstelle: AWMF_PDF('020-020l_S3_Behandlung-von-erwachsenen-Patienten-mit-ambulant-erworbener-Pneumonie__2021-05.pdf') },
    geprueftAm: P20, beobachten: AWMF, intervallMonate: 12,
  },
  {
    id: 'awmf.palliativ', titel: 'S3-Leitlinie Palliativmedizin für Patienten mit einer nicht-heilbaren Krebserkrankung (AWMF 128-001OL)', herausgeber: 'Leitlinienprogramm Onkologie über AWMF', art: 'leitlinie', muster: /AWMF 128-001OL|^S3-Leitlinie Palliativmedizin/,
    aktuell: { stand: '2025', erschienen: '2025-02-01', fundstelle: AWMF_PDF('128-001OLp1_S3_Palliativmedizin_2025-02.pdf') },
    geprueftAm: P20, beobachten: 'https://www.leitlinienprogramm-onkologie.de/leitlinien/palliativmedizin/', intervallMonate: 12,
    hinweis: 'Im AWMF-Register liegen eine Patientenleitlinie 02/2025 und eine Kurzversion 07/2026. Die Versionsnummer der Langfassung beim Abgleich nachsehen.',
    offen: 'Praxis-Katalog (Symptome erfassen, Atemnot lindern, Mundpflege) nennt noch Version 2.2 (2020). Gegen die erweiterte Fassung abgleichen, bevor die Palliativ-Fälle (P18) freigegeben werden.',
  },
  {
    id: 'awmf.angst', titel: 'S3-Leitlinie Behandlung von Angststörungen (AWMF 051-028)', herausgeber: 'DGPM und DGPPN über AWMF', art: 'leitlinie', muster: /AWMF 051-028/,
    aktuell: { stand: '2025', erschienen: '2025-03-01', fundstelle: 'https://register.awmf.org/assets/guidelines/051_D-Ges_Psychosom_Med_u_aerztliche_Psychotherapie/051-028ki2_S3_Behandlung-von-Angststoerungen_2025-03.pdf' },
    geprueftAm: P20, beobachten: AWMF, intervallMonate: 12,
    offen: 'Psychiatriefall Panik/Suizidalität steht auf Version 2 (2021). Akutmaßnahmen (Beruhigen, Atmung anleiten, Benzodiazepin nur kurzzeitig nach Anordnung) gegen die Fassung 2025 prüfen.',
  },
  {
    id: 'awmf.zwang', titel: 'S3-Leitlinie Verhinderung von Zwang: Prävention und Therapie aggressiven Verhaltens bei Erwachsenen (AWMF 038-022)', herausgeber: 'DGPPN über AWMF', art: 'leitlinie', muster: /AWMF 038-022/,
    aktuell: { stand: '2026', fundstelle: 'https://www.aerzteblatt.de/news/s3-leitlinie-zu-pravention-und-therapie-gegen-aggression-und-zwang-aktualisiert-5d962394-adb9-4601-89a5-a0ad0bbe89e3' },
    geprueftAm: P20, beobachten: AWMF, intervallMonate: 12,
    hinweis: 'Aktualisierung 2026 (Konsultationsfassung 01/2026, gültig bis 06/2036) laut Fachpresse und Fachgesellschaft; Fassung 2018 abgelaufen.',
    offen: 'Psychiatriefall und Deeskalations-Maßnahmen nennen noch 2018. Deeskalation, Nachbesprechung und 1:1-Begleitung gegen die Fassung 2026 prüfen.',
  },
  {
    id: 'nvl.depression', titel: 'Nationale VersorgungsLeitlinie Unipolare Depression', herausgeber: 'BÄK, KBV, AWMF', art: 'leitlinie', muster: /VersorgungsLeitlinie Unipolare Depression/,
    aktuell: { stand: '2022 (Version 3.2)', fundstelle: 'https://www.leitlinien.de/themen/depression' }, beobachten: 'https://www.leitlinien.de/themen/depression', intervallMonate: 12,
    hinweis: 'Im AWMF-Register liegen Begleitdokumente mit Stand 01/2025. Ob damit eine neue Version gilt, beim nächsten Abgleich nachsehen.',
  },
  {
    id: 'awmf.alkohol', titel: 'S3-Leitlinie Screening, Diagnose und Behandlung alkoholbezogener Störungen (AWMF 076-001)', herausgeber: 'DG-Sucht und DGPPN über AWMF', art: 'leitlinie', muster: /AWMF 076-001/,
    aktuell: { stand: '2021', erschienen: '2021-01-01', fundstelle: AWMF_PDF('076-001m_S3-Screening-Diagnose-Behandlung-alkoholbezogene-Stoerungen_2025-01-verlaengert.pdf') },
    geprueftAm: P20, beobachten: AWMF, intervallMonate: 12, hinweis: 'Fassung 2021, Gültigkeit verlängert.',
  },
  {
    id: 'awmf.gastroenteritis-kind', titel: 'S2k-Leitlinie Akute infektiöse Gastroenteritis im Säuglings-, Kindes- und Jugendalter (AWMF 068-003)', herausgeber: 'GPGE über AWMF', art: 'leitlinie', muster: /AWMF 068-003/,
    aktuell: { stand: '2024', erschienen: '2024-07-01', fundstelle: AWMF_PDF('068-003l_S2k_AGE-Akute-infektioese-Gastroenteritis-Saeuglinge-Kinder-Jugendliche-2024-07.pdf') },
    geprueftAm: P20, beobachten: AWMF, intervallMonate: 12,
  },
  {
    id: 'nice.ng143', titel: 'NICE NG143: Fever in under 5s', herausgeber: 'NICE', art: 'leitlinie', muster: /^NICE NG143/,
    aktuell: { stand: '2019, aktualisiert 2021', fundstelle: 'https://www.nice.org.uk/guidance/ng143' }, beobachten: 'https://www.nice.org.uk/guidance/ng143', intervallMonate: 12,
  },
  {
    id: 'nice.ng225', titel: 'NICE NG225: Self-harm', herausgeber: 'NICE', art: 'leitlinie', muster: /^NICE NG225/,
    aktuell: { stand: '2022', fundstelle: 'https://www.nice.org.uk/guidance/ng225' }, beobachten: 'https://www.nice.org.uk/guidance/ng225', intervallMonate: 12,
  },
  {
    id: 'nice.cg103', titel: 'NICE CG103: Delirium', herausgeber: 'NICE', art: 'leitlinie', muster: /^NICE CG103/,
    aktuell: { stand: '2023', fundstelle: 'https://www.nice.org.uk/guidance/cg103' }, beobachten: 'https://www.nice.org.uk/guidance/cg103', intervallMonate: 12,
  },
  {
    id: 'aap.fieberkrampf', titel: 'American Academy of Pediatrics: Febrile Seizures', herausgeber: 'American Academy of Pediatrics', art: 'leitlinie', muster: /^American Academy of Pediatrics: Febrile Seizures/,
    aktuell: { stand: '2008 und 2011', fundstelle: 'https://publications.aap.org/pediatrics' }, beobachten: 'https://publications.aap.org/pediatrics', intervallMonate: 24,
  },
  {
    id: 'gnp.fieberkrampf', titel: 'Gesellschaft für Neuropädiatrie: Elterninformation Fieberkrampf', herausgeber: 'Gesellschaft für Neuropädiatrie', art: 'empfehlung', muster: /^Gesellschaft für Neuropädiatrie/,
    aktuell: { stand: 'Elterninformation ohne Jahresangabe', fundstelle: 'https://gesellschaft-fuer-neuropaediatrie.org/' }, beobachten: 'https://gesellschaft-fuer-neuropaediatrie.org/', intervallMonate: 24,
  },
  {
    id: 'priscus', titel: 'PRISCUS 2.0 – potenziell inadäquate Medikation für ältere Menschen', herausgeber: 'Universität Witten/Herdecke', art: 'empfehlung', muster: /^PRISCUS/,
    aktuell: { stand: '2023', fundstelle: 'https://www.uni-wh.de/' }, beobachten: 'https://www.uni-wh.de/', intervallMonate: 24,
  },
  {
    id: 'leitlinie.fem', titel: 'Leitlinie FEM – Vermeidung von freiheitseinschränkenden Maßnahmen in der beruflichen Altenpflege', herausgeber: 'Universität Hamburg, Köpke et al.', art: 'leitlinie', muster: /^Leitlinie FEM/,
    aktuell: { stand: '2015', fundstelle: 'https://www.gesundheit.uni-hamburg.de/projekte/fem.html' }, geprueftAm: P20, beobachten: 'https://www.gesundheit.uni-hamburg.de/projekte/fem.html', intervallMonate: 24,
  },
  {
    id: 'aps', titel: 'Aktionsbündnis Patientensicherheit: Handlungsempfehlungen (u. a. Patientenidentifikation, AMTS, mündliche Anordnungen, Transport, Kommunikation nach Zwischenfall)', herausgeber: 'Aktionsbündnis Patientensicherheit', art: 'empfehlung', muster: /^Aktionsbündnis Patientensicherheit/,
    aktuell: { stand: 'je Handlungsempfehlung', fundstelle: 'https://www.aps-ev.de/' }, beobachten: 'https://www.aps-ev.de/', intervallMonate: 24,
    hinweis: 'Jede Handlungsempfehlung hat ein eigenes Erscheinungsjahr; die Inhalte nennen es in der Quellenangabe.',
  },
  {
    id: 'who.high5s', titel: 'WHO High 5s: Communication during patient hand-overs (SBAR)', herausgeber: 'WHO', art: 'empfehlung', muster: /WHO High 5s/,
    aktuell: { stand: '2007', fundstelle: 'https://www.who.int/' }, beobachten: 'https://www.who.int/', intervallMonate: 24,
  },
  {
    id: 'charta.pflege', titel: 'Charta der Rechte hilfe- und pflegebedürftiger Menschen', herausgeber: 'BMFSFJ und BMG', art: 'empfehlung', muster: /^Charta der Rechte hilfe- und pflegebedürftiger/,
    aktuell: { stand: '2005 (Neuauflagen ohne inhaltliche Änderung)', fundstelle: 'https://www.pflege-charta.de/' }, beobachten: 'https://www.pflege-charta.de/', intervallMonate: 24,
  },
  {
    id: 'lehrplan.bw', titel: 'Landeslehrplan Baden-Württemberg, Berufsfachschule für Pflege (3BFP)', herausgeber: 'Ministerium für Kultus, Jugend und Sport Baden-Württemberg', art: 'gesetz', muster: /^Landeslehrplan BW/,
    aktuell: { stand: '2020', erschienen: '2020-08-05', fundstelle: 'https://www.bildungsplaene-bw.de/' }, beobachten: 'https://www.bildungsplaene-bw.de/', intervallMonate: 12,
  },
  {
    id: 'krinko.vap', titel: 'KRINKO: Prävention der nosokomialen beatmungsassoziierten Pneumonie', herausgeber: 'Kommission für Krankenhaushygiene und Infektionsprävention am RKI', art: 'empfehlung', muster: /^KRINKO: Prävention der nosokomialen beatmungsassoziierten/,
    aktuell: { stand: '2013', fundstelle: 'https://www.rki.de/' }, beobachten: 'https://www.rki.de/', intervallMonate: 12,
  },
  {
    id: 'esc.acs', titel: 'ESC-Leitlinie akutes Koronarsyndrom (mit DGK-Pocket-Leitlinie)', herausgeber: 'European Society of Cardiology, DGK', art: 'leitlinie', muster: /ESC Guidelines for the management of acute coronary syndromes|DGK Pocket-Leitlinie Akutes Koronarsyndrom/,
    aktuell: { stand: '2023', fundstelle: 'https://www.escardio.org/Guidelines' }, beobachten: 'https://www.escardio.org/Guidelines', intervallMonate: 12,
  },
  {
    id: 'awmf.schlaganfall', titel: 'S2e-Leitlinie Akuttherapie des ischämischen Schlaganfalls (AWMF 030-046)', herausgeber: 'DGN über AWMF', art: 'leitlinie', muster: /AWMF 030-046/,
    aktuell: { stand: '2022', fundstelle: AWMF }, beobachten: AWMF, intervallMonate: 12,
  },
  {
    id: 'dsg.strokeunit', titel: 'Deutsche Schlaganfall-Gesellschaft: Stroke-Unit-Zertifizierung und Zeitfenster', herausgeber: 'Deutsche Schlaganfall-Gesellschaft', art: 'empfehlung', muster: /^Deutsche Schlaganfall-Gesellschaft/,
    aktuell: { stand: 'laufend', fundstelle: 'https://www.dsg-info.de/' }, beobachten: 'https://www.dsg-info.de/', intervallMonate: 24,
  },
  {
    id: 'awmf.polytrauma', titel: 'S3-Leitlinie Polytrauma/Schwerverletzten-Behandlung (AWMF 187-023)', herausgeber: 'DGU über AWMF', art: 'leitlinie', muster: /AWMF 187-023/,
    aktuell: { stand: '2022', fundstelle: AWMF }, beobachten: AWMF, intervallMonate: 12,
  },
  {
    id: 'awmf.vte', titel: 'S3-Leitlinie Prophylaxe der venösen Thromboembolie (AWMF 003-001)', herausgeber: 'AWMF', art: 'leitlinie', muster: /AWMF 003-001/,
    aktuell: { stand: '2015', fundstelle: AWMF }, beobachten: AWMF, intervallMonate: 12, hinweis: 'Aktualisierung angemeldet; Fassung 2015 weiter Lehrstand.',
  },
  {
    id: 'awmf.vte-therapie', titel: 'S2k-Leitlinie Diagnostik und Therapie der Venenthrombose und Lungenembolie (AWMF 065-002)', herausgeber: 'DGA über AWMF', art: 'leitlinie', muster: /AWMF 065-002/,
    aktuell: { stand: '2023', fundstelle: AWMF }, beobachten: AWMF, intervallMonate: 12,
  },
  {
    id: 'awmf.das', titel: 'S3-Leitlinie Analgesie, Sedierung und Delirmanagement in der Intensivmedizin (DAS, AWMF 001-012)', herausgeber: 'DGAI und DIVI über AWMF', art: 'leitlinie', muster: /AWMF 001-012/,
    aktuell: { stand: '2020', fundstelle: AWMF }, beobachten: AWMF, intervallMonate: 12,
  },
  {
    id: 'awmf.beatmung', titel: 'S3-Leitlinie Invasive Beatmung bei akuter respiratorischer Insuffizienz (AWMF 001-021)', herausgeber: 'DGAI über AWMF', art: 'leitlinie', muster: /AWMF 001-021/,
    aktuell: { stand: '2017', fundstelle: AWMF }, beobachten: AWMF, intervallMonate: 12,
  },
  {
    id: 'awmf.schlaf', titel: 'S3-Leitlinie Nicht erholsamer Schlaf/Schlafstörungen (AWMF 063-001)', herausgeber: 'DGSM über AWMF', art: 'leitlinie', muster: /AWMF 063-001/,
    aktuell: { stand: '2017', fundstelle: AWMF }, beobachten: AWMF, intervallMonate: 12, hinweis: 'Kapitel Schlafbezogene Atmungsstörungen 2020 aktualisiert.',
  },
  {
    id: 'awmf.demenz', titel: 'S3-Leitlinie Demenzen (AWMF 038-013)', herausgeber: 'DGN und DGPPN über AWMF', art: 'leitlinie', muster: /AWMF 038-013/,
    aktuell: { stand: '2023', fundstelle: AWMF }, beobachten: AWMF, intervallMonate: 12,
  },
  {
    id: 'awmf.anaphylaxie', titel: 'S2k-Leitlinie Akuttherapie und Management der Anaphylaxie (AWMF 061-025)', herausgeber: 'DGAKI über AWMF', art: 'leitlinie', muster: /AWMF 061-025/,
    aktuell: { stand: '2021', fundstelle: AWMF }, beobachten: AWMF, intervallMonate: 12,
  },
  {
    id: 'nvl.diabetes2', titel: 'Nationale VersorgungsLeitlinie Typ-2-Diabetes', herausgeber: 'BÄK, KBV, AWMF', art: 'leitlinie', muster: /VersorgungsLeitlinie Typ-2-Diabetes/,
    aktuell: { stand: '2023 (Version 3.0)', fundstelle: 'https://www.leitlinien.de/themen/diabetes' }, beobachten: 'https://www.leitlinien.de/themen/diabetes', intervallMonate: 12,
  },
  {
    id: 'ddg.alter', titel: 'S2k-Leitlinie Diabetes mellitus im Alter (DDG)', herausgeber: 'DDG', art: 'leitlinie', muster: /Diabetes mellitus im Alter/,
    aktuell: { stand: '2018', fundstelle: 'https://www.ddg.info/' }, beobachten: 'https://www.ddg.info/', intervallMonate: 12,
  },
  {
    id: 'awmf.schizophrenie', titel: 'S3-Leitlinie Schizophrenie (AWMF 038-009)', herausgeber: 'DGPPN über AWMF', art: 'leitlinie', muster: /AWMF 038-009/,
    aktuell: { stand: '2019', fundstelle: 'https://register.awmf.org/de/leitlinien/detail/038-009' }, beobachten: AWMF, intervallMonate: 12,
    hinweis: 'Praxisfall Unruhe und Deeskalation (P19). Eine Überarbeitung ist angekündigt; beim nächsten Abgleich im AWMF-Register nachsehen.',
  },
  {
    id: 'stiko.rsv', titel: 'STIKO-Empfehlung RSV-Prophylaxe mit Nirsevimab für Neugeborene und Säuglinge', herausgeber: 'Ständige Impfkommission am RKI', art: 'empfehlung', muster: /^STIKO-Empfehlung zur RSV-Prophylaxe/,
    aktuell: { stand: '2024', fundstelle: 'https://www.rki.de/DE/Themen/Infektionskrankheiten/Impfen/Staendige-Impfkommission/Empfehlungen-der-STIKO/empfehlungen-der-stiko-node.html' },
    beobachten: 'https://www.rki.de/DE/Themen/Infektionskrankheiten/Impfen/Staendige-Impfkommission/Empfehlungen-der-STIKO/empfehlungen-der-stiko-node.html', intervallMonate: 12,
  },
  {
    id: 'rki.ratgeber', titel: 'RKI-Ratgeber für Ärztinnen und Ärzte (u. a. Norovirus, RSV)', herausgeber: 'Robert Koch-Institut', art: 'empfehlung', muster: /^RKI-Ratgeber/,
    aktuell: { stand: 'laufend', fundstelle: 'https://www.rki.de/DE/Aktuelles/Publikationen/RKI-Ratgeber/ratgeber-node.html' },
    beobachten: 'https://www.rki.de/DE/Aktuelles/Publikationen/RKI-Ratgeber/ratgeber-node.html', intervallMonate: 12,
    hinweis: 'Ratgeber werden einzeln aktualisiert. Hygienemaßnahmen der Kinderfälle (P19) beim nächsten Abgleich gegen den jeweiligen Ratgeber prüfen.',
  },
  {
    id: 'asthmaschulung', titel: 'Arbeitsgemeinschaft Asthmaschulung im Kindes- und Jugendalter: Qualitätsmanagement Asthmaschulung', herausgeber: 'AG Asthmaschulung im Kindes- und Jugendalter e. V.', art: 'empfehlung', muster: /^Arbeitsgemeinschaft Asthmaschulung/,
    aktuell: { stand: 'laufend', fundstelle: 'https://www.asthmaschulung.de/' }, beobachten: 'https://www.asthmaschulung.de/', intervallMonate: 24,
  },
  {
    id: 'halt', titel: 'HaLT – Hart am Limit: Alkoholprävention bei Kindern und Jugendlichen', herausgeber: 'Villa Schöpflin, Zentrum für Suchtprävention', art: 'empfehlung', muster: /^HaLT/,
    aktuell: { stand: 'laufend', fundstelle: 'https://www.halt.de/' }, beobachten: 'https://www.halt.de/', intervallMonate: 24,
  },
  {
    id: 'dgai.awr', titel: 'DGAI/BDA: Empfehlung zur Überwachung nach Anästhesieverfahren (Aufwachraum)', herausgeber: 'DGAI und BDA', art: 'empfehlung', muster: /^DGAI\/BDA: Empfehlung zur Überwachung nach Anästhesie/,
    aktuell: { stand: '2009, Revision 2021', fundstelle: 'https://www.dgai.de/' }, beobachten: 'https://www.dgai.de/', intervallMonate: 24,
  },
  {
    id: 'grc', titel: 'German Resuscitation Council: Eckpunktepapier innerklinische Notfallversorgung', herausgeber: 'German Resuscitation Council', art: 'empfehlung', muster: /^German Resuscitation Council/,
    aktuell: { stand: 'laufend', fundstelle: 'https://www.grc-org.de/' }, beobachten: 'https://www.grc-org.de/', intervallMonate: 24,
  },
  {
    id: 'cirs', titel: 'CIRS-Berichtssysteme (CIRSmedical.de, KH-CIRS-Netz Deutschland)', herausgeber: 'ÄZQ und Partner', art: 'empfehlung', muster: /^CIRS-Berichtssystem/,
    aktuell: { stand: 'laufend', fundstelle: 'https://www.cirsmedical.de/' }, beobachten: 'https://www.cirsmedical.de/', intervallMonate: 24,
  },
  {
    id: 'mts', titel: 'Manchester-Triage-System (Ersteinschätzung in der Notaufnahme)', herausgeber: 'Manchester Triage Group', art: 'instrument', muster: /^Manchester-Triage-System/,
    aktuell: { stand: '3. Auflage 2014', fundstelle: 'https://www.triagenet.net/' }, beobachten: 'https://www.triagenet.net/', intervallMonate: 24,
  },  // Praxisfälle P17a/P17b (CE02, CE04, CE07). Am 19.11.2026 (P20) per Websuche beim Herausgeber bzw. im AWMF-Register nachgesehen.
  {
    id: 'nvl.herzinsuffizienz', titel: 'Nationale VersorgungsLeitlinie Chronische Herzinsuffizienz', herausgeber: 'BÄK, KBV, AWMF', art: 'leitlinie', muster: /VersorgungsLeitlinie Chronische Herzinsuffizienz/,
    aktuell: { stand: '4. Auflage 2023', fundstelle: 'https://www.leitlinien.de/themen/herzinsuffizienz/pdf/herzinsuffizienz-vers4-0.pdf' }, geprueftAm: P20, beobachten: 'https://www.leitlinien.de/themen/herzinsuffizienz', intervallMonate: 12,
    hinweis: 'Praxisfall Herzschwäche zu Hause (P17b): Selbstmanagement, tägliches Wiegen, Trinkmenge. Version 4.0 (12/2023) im AWMF-Register belegt. Laut Ärzteblatt ist danach ein neues Kapitel zur medikamentösen Therapie erschienen; Versionsnummer bei der nächsten Prüfung nachtragen (betrifft den Pflegefall kaum).',
  },
  {
    id: 'epuap.dekubitus', titel: 'EPUAP/NPIAP/PPPIA: Prevention and Treatment of Pressure Ulcers/Injuries (International Guideline)', herausgeber: 'EPUAP, NPIAP und PPPIA', art: 'leitlinie', muster: /^EPUAP\/NPIAP\/PPPIA/,
    aktuell: { stand: '2019', fundstelle: 'https://internationalguideline.com/' }, geprueftAm: P20, beobachten: 'https://internationalguideline.com/', intervallMonate: 6,
    hinweis: 'Praxisfall Dekubitusgefahr (P17a). Die Herausgeber führen eine 4. Auflage („4th edition, 2026“, internationalguideline.com/2025) mit Umsetzungs-Zeitplan seit Juni 2025. Ein vollständiger Veröffentlichungsbeleg lag am 19.11.2026 nicht vor; bis dahin bleibt 2019 stehen. Der DNQP-Expertenstandard Dekubitusprophylaxe geht für Deutschland vor.',
  },
  {
    id: 'ddg.praxisempfehlungen', titel: 'DDG Praxisempfehlungen (Diabetologie und Stoffwechsel, Supplement)', herausgeber: 'Deutsche Diabetes Gesellschaft', art: 'empfehlung', muster: /^DDG Praxisempfehlungen/,
    aktuell: { stand: '2025', fundstelle: 'https://www.ddg.info/fileadmin/user_upload/05_Behandlung/01_Leitlinien/Praxisempfehlungen/2025/PE_Therapie_Typ-2-Diabetes_2025.pdf' }, geprueftAm: P20,
    beobachten: 'https://www.ddg.info/behandlung/leitlinien', intervallMonate: 12,
    hinweis: 'Erscheinen jährlich neu (Supplement S2, Dezember). Praxisfall Unterzucker vor dem Abendinsulin (P17b) am 19.11.2026 gegen die Ausgabe 2025 abgeglichen: „Diabetes im Krankenhaus“ (Diabetol Stoffwechs 2025; 20: S428–S442), Tab. 3/4 S. S433 – unter 70 mg/dl, 20 g Kohlenhydrate, nach 15 Minuten messen, wenn nötig wiederholen, danach Mahlzeit oder Snack. Deckt sich mit dem Fall.',
  },
  {
    id: 'fit.injektion', titel: 'Forum Injektionstechnik: Empfehlungen zur Injektionstechnik', herausgeber: 'Forum Injektionstechnik (FIT) mit DDG', art: 'empfehlung', muster: /^Forum Injektionstechnik/,
    aktuell: { stand: 'ohne Jahresangabe', fundstelle: 'https://www.ddg.info/' }, geprueftAm: P20, beobachten: 'https://www.ddg.info/', intervallMonate: 24,
    hinweis: 'Spritzstellenwechsel und Lipohypertrophie im Praxisfall Unterzucker (P17b). Fassung beim nächsten Abgleich nachtragen.',
  },
  {
    id: 'awmf.dysphagie', titel: 'S1-Leitlinie Neurogene Dysphagie (AWMF 030-111)', herausgeber: 'DGN über AWMF', art: 'leitlinie', muster: /Neurogene Dysphagie \(030-111\)|AWMF 030-111/,
    aktuell: { stand: '2020 (Gültigkeit abgelaufen 03/2025)', fundstelle: AWMF_PDF('030-111l_Neurogene-Dysphagie_2025-03_abgelaufen.pdf') }, geprueftAm: P20, beobachten: AWMF, intervallMonate: 6,
    hinweis: 'Praxisfall Schlaganfall in der Reha (P17b): Schluckscreening, Kostanpassung. Im AWMF-Register als abgelaufen geführt, eine Nachfolgefassung war nicht zu finden. Inhalte bleiben fachlich gebräuchlich; halbjährlich nachsehen.',
  },
  {
    id: 'dgnr.remos', titel: 'S2e-Leitlinie Rehabilitation der Mobilität nach Schlaganfall (ReMoS)', herausgeber: 'DGNR über AWMF', art: 'leitlinie', muster: /\(ReMoS\)/,
    aktuell: { stand: '2020', fundstelle: AWMF }, geprueftAm: P20, beobachten: AWMF, intervallMonate: 6,
    hinweis: 'Fachpresse meldet die Nachfolge „Aus ReMoS wird TheMoS – Leitlinie Therapie der Mobilität nach Schlaganfall“. Fassung und Erscheinen im AWMF-Register belegen, dann den Reha-Fall abgleichen.',
  },
  {
    id: 'iddsi', titel: 'IDDSI Framework (International Dysphagia Diet Standardisation Initiative)', herausgeber: 'IDDSI', art: 'empfehlung', muster: /^IDDSI Framework/,
    aktuell: { stand: '2019 (Framework 2.0)', fundstelle: 'https://iddsi.org/framework' }, geprueftAm: P20, beobachten: 'https://iddsi.org/', intervallMonate: 24,
    hinweis: 'Kostformstufen (z. B. Getränke leicht angedickt, Stufe 2) im Praxisfall Schlaganfall in der Reha (P17b). Übersetzungen der Testmethoden tragen „V2-1 2024“; die Stufen sind unverändert, Version 2.1 bei der nächsten Prüfung bestätigen.',
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
  fest('as.4at', '4AT Delir-Screening', /^4AT/, '2014', 'https://www.the4at.com/'),
  fest('as.rass', 'Richmond Agitation-Sedation Scale', /^Richmond Agitation-Sedation Scale/, '2002', 'https://pubmed.ncbi.nlm.nih.gov/?term=Sessler+Richmond+Agitation-Sedation+Scale'),
  fest('as.camicu', 'CAM-ICU', /^CAM-ICU/, '2001', 'https://pubmed.ncbi.nlm.nih.gov/?term=Ely+CAM-ICU+delirium+mechanically+ventilated'),
  fest('as.bps', 'Behavioral Pain Scale', /^Behavioral Pain Scale/, '2001', 'https://pubmed.ncbi.nlm.nih.gov/?term=Payen+Behavioral+Pain+Scale+sedated+ventilated'),
  fest('as.ipos', 'IPOS (Integrated Palliative care Outcome Scale)', /^IPOS/, '2019', 'https://pos-pal.org/'),
  fest('as.aldrete', 'Aldrete-Score (Aufwachraum)', /^Aldrete/, '1995', 'https://pubmed.ncbi.nlm.nih.gov/7742155/'),
  fest('as.befast', 'BE-FAST', /^BE-FAST/, '2017', 'https://pubmed.ncbi.nlm.nih.gov/?term=Aroor+BE-FAST+stroke'),
  fest('as.ciwa', 'CIWA-Ar (Alkoholentzug)', /^CIWA-Ar/, '1989', 'https://pubmed.ncbi.nlm.nih.gov/?term=Sullivan+assessment+of+alcohol+withdrawal+revised+CIWA-Ar'),
  fest('as.aesb', 'AESB – Alkoholentzugssyndrom-Skala nach Banger', /^AESB/, '1997', 'https://pubmed.ncbi.nlm.nih.gov/?term=Wetterling+Alcohol+Withdrawal+Syndrome+Scale+AWS'),
  fest('sepsis-3', 'Sepsis-3: Third International Consensus Definitions for Sepsis and Septic Shock', /Sepsis-3/, '2016', 'https://pubmed.ncbi.nlm.nih.gov/26903338/'),
];

export const QUELLEN_BASIS: QuellenEintrag[] = [...GESETZE, ...LEITLINIEN, ...PRAXIS_LEITLINIEN, ...INSTRUMENTE];

const jahrAus = (s: string) => s.match(/\d{4}/)?.[0] ?? '';
export const jahr = (stand: string): number => Number(jahrAus(stand) || NaN);

/** Neuere Fassung zu einer Quellenangabe eines Inhalts (nur Leitlinien, Gesetze, Empfehlungen). */
export function neuereFassungFuer(q: { titel: string; stand: string }, liste: readonly QuellenEintrag[] = QUELLEN_BASIS): QuellenEintrag | undefined {
  return liste.find((e) => e.muster.test(q.titel) && jahr(q.stand) < jahr(e.aktuell.stand));
}
