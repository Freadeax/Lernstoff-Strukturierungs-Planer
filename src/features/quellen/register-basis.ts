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
/** Abgleich und Prüfrunde aus dem Audit vom 20.11.2026 (Paket 7). */
export const AUDIT_GEPRUEFT = '2026-11-20';
export const GII = (pfad: string) => `https://www.gesetze-im-internet.de/${pfad}/`;
const AWMF = 'https://register.awmf.org/de/leitlinien/aktuelle-leitlinien';

// ---------------------------------------------------------------- Gesetze

export const GESETZE: QuellenEintrag[] = [
  {
    id: 'gesetz.pflbg', titel: 'Pflegeberufegesetz (PflBG)', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /PflBG/,
    aktuell: { stand: 'geändert 2026', erschienen: '2026-01-01', fundstelle: 'https://www.bundesgesundheitsministerium.de/service/gesetze-und-verordnungen/detail/gesetz-befugniserweiterung-entbuerokratisierung-pflege.html' },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: GII('pflbg'), intervallMonate: 6,
    kern: 'Gesetz zur Befugniserweiterung und Entbürokratisierung in der Pflege vom Dezember 2025 (BGBl. 2025 I Nr. 371), in Kraft seit 1.1.2026: § 4a erlaubt Pflegefachpersonen die eigenverantwortliche Heilkundeausübung im Rahmen erworbener, staatlich geprüfter, anerkannter oder festgestellter Kompetenzen; § 14a sieht standardisierte Kompetenzbeschreibungen der Fachkommission mit empfehlender Wirkung vor.',
    hinweis: 'Abgleich 20.11.2026: Wortlaut § 4a und § 14a gelesen (buzer.de, lxgesetze.de, Stand 22.12.2025), Vertiefung „Substitution“ im Recht-Trainer daran angepasst. Delegationsfragen und Glossar bleiben richtig, weil § 4a nur für Pflegefachpersonen mit erworbener Kompetenz gilt, nicht für Auszubildende.',
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
    geprueftAm: AUDIT_GEPRUEFT, beobachten: GII('bgb'), intervallMonate: 6,
    hinweis: 'Stand 20.11.2026: zuletzt geändert am 23.07.2026 (BGBl. 2026 I Nr. 226); § 1831 (freiheitsentziehende Maßnahmen) im Wortlaut unverändert.',
  },
  {
    id: 'gesetz.stgb', titel: 'StGB, u. a. §§ 203, 223 ff., 239, 323c', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /StGB/,
    aktuell: { stand: 'Fassung laut gesetze-im-internet.de', fundstelle: GII('stgb') }, geprueftAm: AUDIT_GEPRUEFT, beobachten: GII('stgb'), intervallMonate: 12,
    hinweis: 'Am 20.11.2026: zuletzt geändert 20.03.2026 (Terrorismus/Agententätigkeit); §§ 203, 223 ff., 239, 323c unverändert.',
  },
  {
    id: 'gesetz.sgb5', titel: 'SGB V – Gesetzliche Krankenversicherung', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /SGB V\b/,
    aktuell: { stand: 'Fassung laut gesetze-im-internet.de', fundstelle: GII('sgb_5') }, geprueftAm: AUDIT_GEPRUEFT, beobachten: GII('sgb_5'), intervallMonate: 6,
    hinweis: 'Am 20.11.2026: zuletzt geändert 06.10.2026; § 37b (SAPV) seit 2019 unverändert.',
  },
  {
    id: 'gesetz.arbeitsschutz', titel: 'Arbeitszeit- und Mutterschutzrecht (ArbZG, MuSchG)', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /ArbZG|MuSchG/,
    aktuell: { stand: 'Fassung laut gesetze-im-internet.de', fundstelle: GII('arbzg') }, geprueftAm: AUDIT_GEPRUEFT, beobachten: GII('arbzg'), intervallMonate: 12,
    hinweis: 'Stand 20.11.2026: ArbZG zuletzt geändert am 23.10.2024, MuSchG am 22.12.2025 (BGBl. 2025 I Nr. 371). Die Übungen nennen keine geänderten Einzelregeln.',
  },
  {
    id: 'gesetz.ifsg', titel: 'Infektionsschutzgesetz (IfSG)', herausgeber: 'Bundesgesetzgeber', art: 'gesetz', muster: /Infektionsschutzgesetz|IfSG/,
    aktuell: { stand: 'Fassung laut gesetze-im-internet.de', fundstelle: GII('ifsg') }, geprueftAm: AUDIT_GEPRUEFT, beobachten: GII('ifsg'), intervallMonate: 6,
    kern: 'Zuletzt geändert am 26.06.2026 (BGBl. 2026 I Nr. 195): Seit 02.07.2026 dürfen nach § 24 auch Pflegefachpersonen patientennahe Schnelltests auf Adeno-, Influenza-, Noro-, RS- und Rotaviren durchführen.',
    hinweis: 'Die zitierten Meldepflichten (§§ 6–9) und § 34 sind von dieser Änderung nicht betroffen.',
  },
  {
    id: 'bverfg.fixierung', titel: 'BVerfG, Urteil vom 24.07.2018 – 2 BvR 309/15, 2 BvR 502/16 (Fixierung)', herausgeber: 'Bundesverfassungsgericht', art: 'gesetz', muster: /^BVerfG, Urteil vom 24\.07\.2018/,
    aktuell: { stand: '2018', erschienen: '2018-07-24', fundstelle: 'https://www.bundesverfassungsgericht.de/SharedDocs/Entscheidungen/DE/2018/07/rs20180724_2bvr030915.html' },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.bundesverfassungsgericht.de/', intervallMonate: 24,
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
    aktuell: { stand: '2024 (erstmals 2015)', erschienen: '2024-07-01', fundstelle: 'https://www.resus.org.uk/library/abcde-approach' },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.resus.org.uk/library', intervallMonate: 12,
    kern: 'Seite im Juli 2024 aktualisiert; Reihenfolge A-B-C-D-E unverändert.',
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
    id: 'esc.hf', titel: 'ESC-Leitlinie Herzinsuffizienz', herausgeber: 'European Society of Cardiology', art: 'leitlinie', muster: /ESC Guidelines for (the (diagnosis and treatment of acute and chronic|management of) )?heart failure/,
    aktuell: { stand: '2026', erschienen: '2026-08-29', fundstelle: 'https://www.acc.org/Latest-in-Cardiology/Articles/2026/08/29/08/48/mon-guidelines-esc-2026' },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.escardio.org/Guidelines', intervallMonate: 12,
    kern: 'Neue Fassung 2026 (Eur Heart J, 28.08.2026): Stadien A bis D, nur noch zwei Formen nach Auswurfleistung (HFrEF unter 50 %, HFpEF ab 50 %; HFmrEF entfällt), „dekompensierte“ statt „akute“ Herzinsuffizienz, eigener Abschnitt Patientenschulung und Selbstpflege.',
    hinweis: 'Abgleich 20.11.2026 über ESC-Seite und Pressemitteilung (Volltext lizenzpflichtig): Begriff „dekompensiert“ in beiden Fällen, „leicht reduzierte Pumpfunktion“ im Reanimationsfall auf HFrEF umgestellt. Die Gewichtsgrenze (mehr als 2 kg in 3 Tagen) stützt sich weiter auf die NVL Herzinsuffizienz; die Zusammenfassungen der Fassung 2026 nennen keine abweichende Grenze.',
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
    geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://ginasthma.org/reports/', intervallMonate: 12,
    kern: 'Bericht 2026: SABA allein für Kinder 6–11 nicht mehr empfohlen; neue Ablaufschemata zum akuten Asthma; Sauerstoff erst bei SpO₂ unter 92 %, Obergrenze 95 % (Erwachsene, Jugendliche, 6–11 Jahre), unter 6 Jahren mindestens 92 %; niedrigere SABA-Dosen, Wirkung nach der ersten Gabe prüfen.',
    hinweis: 'Abgleich 20.11.2026 über Fachzusammenfassungen (Practice Nurse 26.05.2026, Guideline Central 05/2026): Sauerstoffgrenzen und „Wirkung nach erster Gabe prüfen“ in Praxisfall und Diagnostik-Fall übernommen. Salbutamol-Hübe und Prednisolon-Dosis sind ärztliche Anordnungen im Fall und bleiben Prüfpunkte, weil die Zusammenfassungen keine Kinderdosen nennen.',
  },
  {
    id: 'nice.ng9', titel: 'NICE NG9: Bronchiolitis in children', herausgeber: 'NICE', art: 'leitlinie', muster: /^NICE NG9/,
    aktuell: { stand: '2022 (erstmals 2015)', erschienen: '2022-05-01', fundstelle: 'https://www.nice.org.uk/guidance/ng9/chapter/Update-information' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.nice.org.uk/guidance/ng9', intervallMonate: 12,
    kern: 'SpO₂-Grenzen unverändert (2021). Neu 2022: Pulsoxymetrie kann bei dunkler Haut die Sättigung zu hoch anzeigen.',
    hinweis: 'Abgleich 20.11.2026: Hinweis zur Pulsoxymetrie im Bronchiolitis-Fall ergänzt.',
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
    aktuell: { stand: '2023', erschienen: '2023-03-01', fundstelle: 'https://www.diabetes.org.uk/joint-british-diabetes-society' },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://abcd.care/', intervallMonate: 12,
  },
  {
    id: 'bts.pleura', titel: 'BTS Guideline for pleural disease', herausgeber: 'British Thoracic Society', art: 'leitlinie', muster: /^BTS Guideline for pleural/,
    aktuell: { stand: '2023', erschienen: '2023-07-11', fundstelle: 'https://www.brit-thoracic.org.uk/news/2023/british-thoracic-society-publishes-a-guideline-and-clinical-statement-on-pleural-disease' },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.brit-thoracic.org.uk/', intervallMonate: 12,
    hinweis: '2026 kamen ein Qualitätsstandard und Ausbildungsstandards dazu, keine neue Leitlinie.',
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
    aktuell: { stand: '2009', fundstelle: 'https://www.who.int/publications/i/item/9789241597906' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.who.int/', intervallMonate: 24,
    hinweis: 'Am 20.11.2026: WHO-Leitlinie 2009 gilt weiter; die neue WHO/UNICEF-Leitlinie vom 15.10.2025 betrifft nur Händehygiene außerhalb des Gesundheitswesens.',
  },
  {
    id: 'krinko.cauti', titel: 'KRINKO: Prävention und Kontrolle katheterassoziierter Harnwegsinfektionen', herausgeber: 'Kommission für Krankenhaushygiene und Infektionsprävention am RKI', art: 'empfehlung', muster: /^KRINKO: Prävention und Kontrolle katheterassoziierter/,
    aktuell: { stand: '2015', fundstelle: 'https://www.rki.de/DE/Themen/Infektionskrankheiten/Krankenhaushygiene/KRINKO/Empfehlungen-der-KRINKO/Device-assoziierte-postoperative-Infektionen/Tabelle_Harnwegskatheter_Rili.html' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.rki.de/', intervallMonate: 12,
    hinweis: 'Am 20.11.2026 beim RKI als geltende Empfehlung geführt.',
  },
  {
    id: 'news2', titel: 'NEWS2 (National Early Warning Score 2)', herausgeber: 'Royal College of Physicians', art: 'empfehlung', muster: /NEWS\)? ?2/,
    aktuell: { stand: '2017', fundstelle: 'https://www.rcp.ac.uk/' },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.rcp.ac.uk/', intervallMonate: 12,
    hinweis: 'Gilt nur für Erwachsene ab 16 Jahren, nicht in der Schwangerschaft. Die Surviving Sepsis Campaign 2026 empfiehlt solche Frühwarnscores zum Sepsis-Screening. Am 20.11.2026 nachgesehen: NEWS2 (2017) ist weiter aktuell, keine Nachfolgefassung.',
  },
  {
    id: 'teamstepps', titel: 'AHRQ TeamSTEPPS (SBAR)', herausgeber: 'Agency for Healthcare Research and Quality', art: 'empfehlung', muster: /TeamSTEPPS/,
    aktuell: { stand: 'TeamSTEPPS 3.0, 2023', fundstelle: 'https://www.ahrq.gov/teamstepps-program/updated/index.html' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.ahrq.gov/', intervallMonate: 24,
  },
  {
    id: 'clsi.gp41', titel: 'CLSI PRE02 (früher GP41): Collection of Diagnostic Venous Blood Specimens', herausgeber: 'Clinical and Laboratory Standards Institute', art: 'empfehlung', muster: /^CLSI (GP41|PRE02)/,
    aktuell: { stand: 'PRE02, 8. Auflage 2025', erschienen: '2025-02-13', fundstelle: 'https://clsi.org/shop/standards/pre02/' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://clsi.org/', intervallMonate: 24,
    kern: 'GP41 (7. Auflage 2017) ist durch PRE02 ersetzt: Dopplungen zu PRE01 entfernt, mit den anderen Präanalytik-Dokumenten abgestimmt, Literatur aktualisiert.',
    hinweis: 'Diagnostik und Labor-Trainer zitieren seit 20.11.2026 PRE02 2025. Abnahmereihenfolge und Technik in der App folgen weiter Lehrbuch und Röhrchenhersteller; eine inhaltliche Änderung daran ist nicht beschrieben.',
  },
  {
    id: 'fachinfo', titel: 'Fachinformationen und Gebrauchsinformationen', herausgeber: 'Hersteller (Fachinfo-Service)', art: 'fachinformation', muster: /Fachinformation|Gebrauchsinformation|Herstellerangaben/,
    aktuell: { stand: 'je Präparat', fundstelle: 'https://www.fachinfo.de/' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.fachinfo.de/', intervallMonate: 12,
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
    geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    kern: 'Update 2025 der Fassung 2018 (88 Empfehlungen): strukturierte Früherkennung, Laktat bei Sepsisverdacht, Rekapillarisierungszeit, Vasopressor auch peripher, Beta-Laktam als verlängerte Infusion; Nachsorge: Hinweis auf Post-Intensive-Care-Syndrom im Entlassbericht und auf Selbsthilfegruppen.',
    hinweis: 'Abgleich 20.11.2026 (Ärzteblatt 07.08.2025, PMC-Volltext gesperrt): Beide Sepsis-Fälle zitieren das Update 2025; Laktat und Rekapillarisierung waren schon enthalten, Abschnitt „Nach der Sepsis“ ergänzt.',
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
    aktuell: { stand: 'Aktualisierung 2026', erschienen: '2026-07-31', fundstelle: 'https://www.aerzteblatt.de/news/s3-leitlinie-zur-palliativbetreuung-bei-nicht-heilbarer-krebserkrankung-aktualisiert-b8931f44-a150-49e8-b0e1-58f99c75ad94' },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.leitlinienprogramm-onkologie.de/leitlinien/palliativmedizin/', intervallMonate: 12,
    kern: 'Aktualisierung 2026 (Kurzversion im AWMF-Register 07/2026): neue Kapitel Angehörigenbetreuung und Spiritualität; überarbeitet sind Medikation bei Atemnot, Übelkeit und Erbrechen, Tumorschmerz, opioidbedingte Verstopfung und Fatigue.',
    hinweis: 'Abgleich 20.11.2026: Die Patientenleitlinie 02/2025 war nicht die neue Langfassung. Fälle und Katalog zitieren jetzt die Fassung 2026. Die pflegerischen, nicht-medikamentösen Maßnahmen gehören nicht zu den überarbeiteten Kapiteln. Morphin- und Lorazepam-Dosen in den Fällen sind ärztliche Anordnungen und bleiben Prüfpunkte im Prüfbogen.',
  },
  {
    id: 'awmf.angst', titel: 'S3-Leitlinie Behandlung von Angststörungen (AWMF 051-028)', herausgeber: 'DGPM und DGPPN über AWMF', art: 'leitlinie', muster: /AWMF 051-028/,
    aktuell: { stand: 'Version 2.0, 2021', erschienen: '2021-04-06', fundstelle: AWMF_PDF('051-028k_S3_Behandlung-von-Angststoerungen_2021-06.pdf') },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 6,
    hinweis: 'Korrektur 20.11.2026: Die Datei „2025-03“ im AWMF-Register ist keine neue Leitlinie, sondern eine Information in Leichter Sprache (Stand April 2020). Geltende Fassung ist Version 2.0 vom April 2021; die nächste Überprüfung war für 04/2026 geplant, deshalb halbjährlich nachsehen. Benzodiazepine laut Leitlinie nur in Ausnahmefällen und kurzzeitig, wie im Fall.',
  },
  {
    id: 'awmf.zwang', titel: 'S3-Leitlinie Verhinderung von Zwang: Prävention und Therapie aggressiven Verhaltens bei Erwachsenen (AWMF 038-022)', herausgeber: 'DGPPN über AWMF', art: 'leitlinie', muster: /AWMF 038-022/,
    aktuell: { stand: '2026', erschienen: '2026-06-25', fundstelle: 'https://idw-online.de/de/news873343' },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    kern: 'Aktualisierung 2026 (88 Empfehlungen, 33 Fachgesellschaften): Deeskalationstrainings für alle Mitarbeitenden, strukturierte Risikoeinschätzung (z. B. Brøset-Gewaltcheckliste), Zwang nur, wenn alle milderen Mittel ausgeschöpft sind, strukturierte Nachbesprechung nach kritischen Ereignissen.',
    hinweis: 'Abgleich 20.11.2026 (idw 25.06.2026, Ärzteblatt 26.06.2026): Beide Psychiatriefälle zitieren die Fassung 2026; Deeskalation, Brøset-Checkliste und „Zwang als letztes Mittel“ waren enthalten, Abschnitt „Nachbesprechung“ ergänzt. 1:1-Betreuung bei Fixierung folgt aus dem BVerfG-Urteil 2018.',
  },
  {
    id: 'nvl.depression', titel: 'Nationale VersorgungsLeitlinie Unipolare Depression', herausgeber: 'BÄK, KBV, AWMF', art: 'leitlinie', muster: /VersorgungsLeitlinie Unipolare Depression/,
    aktuell: { stand: '2022 (Version 3.2)', fundstelle: 'https://www.leitlinien.de/themen/depression' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.leitlinien.de/themen/depression', intervallMonate: 12,
    hinweis: 'Im AWMF-Register liegen Begleitdokumente mit Stand 01/2025. Ob damit eine neue Version gilt, beim nächsten Abgleich nachsehen. Am 20.11.2026 nachgesehen: Version 3 (2022) gilt bis 09/2027; Überarbeitung kapitelweise.',
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
    aktuell: { stand: '2024 (erstmals 2019)', erschienen: '2024-03-01', fundstelle: 'https://www.nice.org.uk/guidance/ng143/chapter/Update-information' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.nice.org.uk/guidance/ng143', intervallMonate: 12,
    kern: 'Seit 10/2022 Flüssigkeitsbolus bei Fieber mit Schock 10 ml/kg statt 20 ml/kg; Hinweis, dass Pulsoxymetrie bei dunkler Haut ungenauer ist. 2024 nur Links angepasst.',
    hinweis: 'Abgleich 20.11.2026: Der Fieberkrampf-Fall nennt keinen Bolus; Zitat auf 2024 gehoben.',
  },
  {
    id: 'nice.ng225', titel: 'NICE NG225: Self-harm', herausgeber: 'NICE', art: 'leitlinie', muster: /^NICE NG225/,
    aktuell: { stand: '2022', fundstelle: 'https://www.nice.org.uk/guidance/ng225' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.nice.org.uk/guidance/ng225', intervallMonate: 12,
    hinweis: 'Am 20.11.2026 nachgesehen: Review 08/2024 nur redaktionell, keine inhaltliche Änderung.',
  },
  {
    id: 'nice.cg103', titel: 'NICE CG103: Delirium', herausgeber: 'NICE', art: 'leitlinie', muster: /^NICE CG103/,
    aktuell: { stand: '2023', fundstelle: 'https://www.nice.org.uk/guidance/cg103' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.nice.org.uk/guidance/cg103', intervallMonate: 12,
    hinweis: 'Am 20.11.2026 nachgesehen: Stand 2023 (last reviewed 18.01.2023).',
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
    aktuell: { stand: '2023', fundstelle: 'https://www.uni-wh.de/' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.uni-wh.de/', intervallMonate: 24,
    hinweis: 'Am 20.11.2026 nachgesehen: PRISCUS 2.0 (2023) ist die neueste Liste.',
  },
  {
    id: 'leitlinie.fem', titel: 'Leitlinie FEM – Vermeidung von freiheitseinschränkenden Maßnahmen in der beruflichen Altenpflege', herausgeber: 'Universität Hamburg, Köpke et al.', art: 'leitlinie', muster: /^Leitlinie FEM/,
    aktuell: { stand: '2015', fundstelle: 'https://www.gesundheit.uni-hamburg.de/projekte/fem.html' }, geprueftAm: P20, beobachten: 'https://www.gesundheit.uni-hamburg.de/projekte/fem.html', intervallMonate: 24,
  },
  {
    id: 'aps', titel: 'Aktionsbündnis Patientensicherheit: Handlungsempfehlungen (u. a. Patientenidentifikation, AMTS, mündliche Anordnungen, Transport, Kommunikation nach Zwischenfall)', herausgeber: 'Aktionsbündnis Patientensicherheit', art: 'empfehlung', muster: /^Aktionsbündnis Patientensicherheit/,
    aktuell: { stand: 'je Handlungsempfehlung', fundstelle: 'https://www.aps-ev.de/patientensicherheit/fachinformationen/handlungsempfehlungen/' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.aps-ev.de/', intervallMonate: 24,
    hinweis: 'Jede Handlungsempfehlung hat ein eigenes Erscheinungsjahr; die Inhalte nennen es in der Quellenangabe. Am 20.11.2026 nachgesehen: Eine eigene APS-Empfehlung „mündliche Anordnungen (Closed Loop) 2023“ steht nicht in der Liste; der Fall Nachblutung zitiert dafür jetzt TeamSTEPPS 3.0 (Check-back).',
  },
  {
    id: 'who.high5s', titel: 'WHO High 5s: Communication during patient hand-overs (SBAR)', herausgeber: 'WHO', art: 'empfehlung', muster: /WHO High 5s/,
    aktuell: { stand: '2007', fundstelle: 'https://www.who.int/' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.who.int/', intervallMonate: 24,
    hinweis: 'Am 20.11.2026: keine neuere Fassung; die WHO-Seite führt das Übergabe-SOP nicht mehr auf, SBAR bleibt über das Aktionsbündnis Patientensicherheit belegt.',
  },
  {
    id: 'charta.pflege', titel: 'Charta der Rechte hilfe- und pflegebedürftiger Menschen', herausgeber: 'BMFSFJ und BMG', art: 'empfehlung', muster: /^Charta der Rechte hilfe- und pflegebedürftiger/,
    aktuell: { stand: '2005 (Neuauflagen ohne inhaltliche Änderung)', fundstelle: 'https://www.pflege-charta.de/' }, beobachten: 'https://www.pflege-charta.de/', intervallMonate: 24,
  },
  {
    id: 'lehrplan.bw', titel: 'Landeslehrplan Baden-Württemberg, Berufsfachschule für Pflege (3BFP)', herausgeber: 'Ministerium für Kultus, Jugend und Sport Baden-Württemberg', art: 'gesetz', muster: /^Landeslehrplan BW/,
    aktuell: { stand: '2020', erschienen: '2020-08-05', fundstelle: 'https://sozialministerium.baden-wuerttemberg.de/fileadmin/redaktion/m-sm/intern/downloads/Downloads_Gesundheits-_Pflegeberufe/Landeslehrplan-Berufsfachschule-Pflege.pdf' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.bildungsplaene-bw.de/', intervallMonate: 12,
  },
  {
    id: 'krinko.vap', titel: 'KRINKO: Prävention der nosokomialen beatmungsassoziierten Pneumonie', herausgeber: 'Kommission für Krankenhaushygiene und Infektionsprävention am RKI', art: 'empfehlung', muster: /^KRINKO: Prävention der nosokomialen beatmungsassoziierten/,
    aktuell: { stand: '2013', fundstelle: 'https://www.rki.de/' }, beobachten: 'https://www.rki.de/', intervallMonate: 12,
  },
  {
    id: 'esc.acs', titel: 'ESC-Leitlinie akutes Koronarsyndrom (mit DGK-Pocket-Leitlinie)', herausgeber: 'European Society of Cardiology, DGK', art: 'leitlinie', muster: /ESC Guidelines for the management of acute coronary syndromes|DGK Pocket-Leitlinie Akutes Koronarsyndrom/,
    aktuell: { stand: '2023', fundstelle: 'https://www.escardio.org/Guidelines' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.escardio.org/Guidelines', intervallMonate: 12,
    hinweis: 'Am 20.11.2026: keine neuere ACS-Leitlinie. Neu ist die Fifth Universal Definition of Myocardial Infarction (2026); die App nutzt keine Infarkt-Typen, daher kein Abgleich nötig.',
  },
  {
    id: 'awmf.schlaganfall', titel: 'S2e-Leitlinie Akuttherapie des ischämischen Schlaganfalls (AWMF 030-046)', herausgeber: 'DGN über AWMF', art: 'leitlinie', muster: /AWMF 030-046/,
    aktuell: { stand: '2022', fundstelle: AWMF }, geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    hinweis: 'Am 20.11.2026: Version 5.1 (2022) war bis 09.05.2026 verlängert und ist laut AWMF in Überarbeitung; bis zur Neufassung weiter Lehrstand.',
  },
  {
    id: 'dsg.strokeunit', titel: 'Deutsche Schlaganfall-Gesellschaft: Stroke-Unit-Zertifizierung und Zeitfenster', herausgeber: 'Deutsche Schlaganfall-Gesellschaft', art: 'empfehlung', muster: /^Deutsche Schlaganfall-Gesellschaft/,
    aktuell: { stand: 'laufend', fundstelle: 'https://www.dsg-info.de/' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.dsg-info.de/', intervallMonate: 24,
    hinweis: 'Am 20.11.2026 erreichbar und aktiv.',
  },
  {
    id: 'awmf.polytrauma', titel: 'S3-Leitlinie Polytrauma/Schwerverletzten-Behandlung (AWMF 187-023)', herausgeber: 'DGU über AWMF', art: 'leitlinie', muster: /AWMF 187-023/,
    aktuell: { stand: 'Version 5.0, 2025', erschienen: '2025-11-07', fundstelle: AWMF_PDF('187-023m_S3_KF_Polytrauma-Schwerverletzten-Behandlung_2026-05.pdf') }, geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    kern: 'Modulare Aktualisierung: Transport/Zielklinik, Hand, obere Extremität, thermische Verletzungen neu. Schockzeichen und Schockindex als Hilfsgröße unverändert.',
  },
  {
    id: 'awmf.vte', titel: 'S3-Leitlinie Prophylaxe der venösen Thromboembolie (AWMF 003-001)', herausgeber: 'AWMF', art: 'leitlinie', muster: /AWMF 003-001/,
    aktuell: { stand: 'Version 4.0, 2026', erschienen: '2026-01-01', fundstelle: AWMF_PDF('003-001l_S3_Prophylaxe-venoese-Thromboembolie-VTE_2026-01.pdf') }, geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    hinweis: 'Abgleich 20.11.2026: Praxisfälle Lungenembolie und Nachblutung stehen auf Version 4.0 (Prophylaxe-Plan mit Enoxaparin, Frühmobilisation, Kompressionsstrumpf passt).',
    kern: 'Basismaßnahmen für alle (Frühmobilisation, Bewegungsübungen, Fußpumpe, ausreichend Flüssigkeit); medikamentöse und physikalische Prophylaxe kombinierbar; intermittierende pneumatische Kompression neu bewertet. Gültig bis 01/2031.',
  },
  {
    id: 'awmf.vte-therapie', titel: 'S2k-Leitlinie Diagnostik und Therapie der Venenthrombose und Lungenembolie (AWMF 065-002)', herausgeber: 'DGA über AWMF', art: 'leitlinie', muster: /AWMF 065-002/,
    aktuell: { stand: '2023', fundstelle: AWMF }, geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    hinweis: 'Am 20.11.2026 nachgesehen: Version 5.0 (2023) gilt bis 02/2028.',
  },
  {
    id: 'awmf.das', titel: 'S3-Leitlinie Analgesie, Sedierung und Delirmanagement in der Intensivmedizin (DAS, AWMF 001-012)', herausgeber: 'DGAI und DIVI über AWMF', art: 'leitlinie', muster: /AWMF 001-012/,
    aktuell: { stand: '2020', fundstelle: AWMF }, geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    hinweis: 'Am 20.11.2026: Fassung 2020 ist abgelaufen und laut AWMF in Überarbeitung; bis zur Neufassung weiter Lehrstand. Das Delir bei älteren Menschen außerhalb der Intensivstation regelt jetzt AWMF 109-001.',
  },
  {
    id: 'awmf.delir', titel: 'S3-Leitlinie Delir im höheren Lebensalter (AWMF 109-001)', herausgeber: 'DGGG, DGPPN und weitere über AWMF', art: 'leitlinie', muster: /AWMF 109-001/,
    aktuell: { stand: 'Version 1.0, 2025', erschienen: '2025-04-30', fundstelle: 'https://www.dgppn.de/_Resources/Persistent/920cef00c705600d216901cd924a54a4e0f82e5c/109-001m_S3_Delir-im-hoeheren-Lebensalter_2026-01.pdf' },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    kern: 'Erste S3-Leitlinie zum Delir bei älteren Menschen (gültig bis 04/2029): Vorbeugen, systematisch erkennen (z. B. 4AT), Auslöser suchen und behandeln, nichtmedikamentöse Maßnahmen zuerst.',
    hinweis: 'Ersetzt im Delir-Fall das alte Zitat „AWMF 038-015, in Erstellung“ (20.11.2026). Die Kernaussagen stammen aus dem Leitlinien-Titel und den Fachzusammenfassungen; Einzelempfehlungen bleiben Prüfpunkt im Fall.',
  },
  {
    id: 'awmf.beatmung', titel: 'S3-Leitlinie Invasive Beatmung bei akuter respiratorischer Insuffizienz (AWMF 001-021)', herausgeber: 'DGAI über AWMF', art: 'leitlinie', muster: /AWMF 001-021/,
    aktuell: { stand: '2025', erschienen: '2025-08-22', fundstelle: 'https://www.aerzteblatt.de/themen/beatmung/s3-leitlinie-zur-invasiven-beatmung-aktualisiert-3949afb6-4b46-4bf8-b153-197bcf6648aa' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    kern: 'Komplett überarbeitet: 97 Empfehlungen (22 neu, 36 gestrichen), u. a. Beatmungsverfahren, Monitoring, Weaning, Sedierung/Delir, ECMO.',
    hinweis: 'Abgleich 20.11.2026: Der Beatmungsalarm-Fall nutzt das DOPES-Vorgehen aus Lehrbuch und Hausstandard; das betrifft keine der genannten Änderungen. Zitat auf 2025 gehoben, Prüfpunkt im Fall bleibt.',
  },
  {
    id: 'awmf.schlaf', titel: 'S3-Leitlinie Nicht erholsamer Schlaf/Schlafstörungen (AWMF 063-001)', herausgeber: 'DGSM über AWMF', art: 'leitlinie', muster: /AWMF 063-001/,
    aktuell: { stand: 'Teilaktualisierung 2023', erschienen: '2023-01-01', fundstelle: AWMF_PDF('063-001l_S3_SBAS_2023-01_verlaengert_und_Hinweis_Teil-Aktualisierung.pdf') }, geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12, hinweis: 'Welche Kapitel 2023 genau ersetzt wurden, war im Dokument nicht lesbar; der Fall nutzt nur das allgemeine perioperative Vorgehen.',
    kern: 'Teil Schlafbezogene Atmungsstörungen: Version 2.0 (2017), Kapitel 2020 und 2023 überarbeitet. Perioperativ: eigenes CPAP-Gerät mitbringen und nutzen, Opioide vorsichtig, überwachen.',
  },
  {
    id: 'awmf.demenz', titel: 'S3-Leitlinie Demenzen (AWMF 038-013)', herausgeber: 'DGN und DGPPN über AWMF', art: 'leitlinie', muster: /AWMF 038-013/,
    aktuell: { stand: 'Version 6.0, 2026', erschienen: '2026-02-24', fundstelle: AWMF_PDF('038-013l_S3_Demenzen_2026-03.pdf') }, geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    kern: 'Living Guideline: Biomarker im Blut (2025), neues Kapitel Palliativversorgung, Musiktherapie, schwache Empfehlung für Anti-Amyloid-Antikörper (2026), geänderte Empfehlung zu Agitation und Aggression.',
    hinweis: 'Abgleich 20.11.2026: Praxisfall Demenz/Aspiration (Schlucken, Schmerz, Infekt) ist von den Änderungen nicht betroffen.',
  },
  {
    id: 'awmf.anaphylaxie', titel: 'S2k-Leitlinie Akuttherapie und Management der Anaphylaxie (AWMF 061-025)', herausgeber: 'DGAKI über AWMF', art: 'leitlinie', muster: /AWMF 061-025/,
    aktuell: { stand: '2021', fundstelle: AWMF }, geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    hinweis: 'Am 20.11.2026 nachgesehen: Update 2021 (Allergo J 30(1):20–49), keine neuere Fassung gefunden.',
  },
  {
    id: 'nvl.diabetes2', titel: 'Nationale VersorgungsLeitlinie Typ-2-Diabetes', herausgeber: 'BÄK, KBV, AWMF', art: 'leitlinie', muster: /VersorgungsLeitlinie Typ-2-Diabetes/,
    aktuell: { stand: '2023 (Version 3.0)', fundstelle: 'https://www.leitlinien.de/themen/diabetes' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.leitlinien.de/themen/diabetes', intervallMonate: 12,
    hinweis: 'Am 20.11.2026 nachgesehen: Version 3 (2023) gilt bis 05/2028.',
  },
  {
    id: 'ddg.alter', titel: 'S2k-Leitlinie Diabetes mellitus im Alter (DDG)', herausgeber: 'DDG', art: 'leitlinie', muster: /Diabetes mellitus im Alter/,
    aktuell: { stand: '2018', fundstelle: 'https://www.ddg.info/' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.ddg.info/', intervallMonate: 12,
    hinweis: 'Am 20.11.2026: 2. Auflage 2018 ist seit 07/2023 abgelaufen und in Überarbeitung; bis zur Neufassung weiter Lehrstand.',
  },
  {
    id: 'awmf.schizophrenie', titel: 'S3-Leitlinie Schizophrenie (AWMF 038-009)', herausgeber: 'DGPPN über AWMF', art: 'leitlinie', muster: /AWMF 038-009/,
    aktuell: { stand: 'Aktualisierung 2026', erschienen: '2026-07-16', fundstelle: 'https://www.aerzteblatt.de/news/s3-leitlinie-schizophrenie-erneut-aktualisiert-13d8936d-9d7a-4a2b-a38b-f2a770764654' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: AWMF, intervallMonate: 12,
    hinweis: 'Abgleich 20.11.2026: Praxisfall Unruhe und Deeskalation zitiert die Fassung 2026. Deeskalation zuerst und Bedarfsmedikation als freiwilliges Angebot bleiben; die Auswahl des Bedarfsmittels ist ärztlich und bleibt Prüfpunkt.',
    kern: 'Living Guideline mit 153 Empfehlungen: Avatar-Therapie bei anhaltenden Stimmen, erweitertes rTMS-Angebot, präzisierte Akutmedikation bei Erregung.',
  },
  {
    id: 'stiko.rsv', titel: 'STIKO-Empfehlung RSV-Prophylaxe mit Clesrovimab oder Nirsevimab für Neugeborene und Säuglinge', herausgeber: 'Ständige Impfkommission am RKI', art: 'empfehlung', muster: /^STIKO-Empfehlung zur RSV-Prophylaxe/,
    aktuell: { stand: 'Epid Bull 37/2026', erschienen: '2026-09-10', fundstelle: 'https://edoc.rki.de/handle/176904/13913' },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.rki.de/DE/Themen/Infektionskrankheiten/Impfen/Staendige-Impfkommission/Empfehlungen-der-STIKO/empfehlungen-der-stiko-node.html', intervallMonate: 12,
    kern: 'Seit 10.09.2026: Clesrovimab (105 mg als Einmalgabe) gleichrangig neben Nirsevimab für alle Säuglinge in der ersten RSV-Saison. G-BA am 17.09.2026: keine Änderung der Schutzimpfungs-Richtlinie nötig; abrechenbar seit 01.10.2026.',
    hinweis: 'Abgleich 20.11.2026: Praxisfall Bronchiolitis (Infektionsschutz) nennt beide Wirkstoffe.',
  },
  {
    id: 'rki.ratgeber', titel: 'RKI-Ratgeber für Ärztinnen und Ärzte (u. a. Norovirus, RSV)', herausgeber: 'Robert Koch-Institut', art: 'empfehlung', muster: /^RKI-Ratgeber/,
    aktuell: { stand: 'laufend', fundstelle: 'https://www.rki.de/DE/Aktuelles/Publikationen/RKI-Ratgeber/ratgeber-node.html' },
    geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.rki.de/DE/Aktuelles/Publikationen/RKI-Ratgeber/ratgeber-node.html', intervallMonate: 12,
    hinweis: 'Ratgeber werden einzeln aktualisiert. Am 20.11.2026: Ratgeber RSV Stand 10.09.2026 (nennt Clesrovimab), Ratgeber Noroviren Stand 29.11.2019; Hygienemaßnahmen der Kinderfälle passen.',
  },
  {
    id: 'asthmaschulung', titel: 'Arbeitsgemeinschaft Asthmaschulung im Kindes- und Jugendalter: Qualitätsmanagement Asthmaschulung', herausgeber: 'AG Asthmaschulung im Kindes- und Jugendalter e. V.', art: 'empfehlung', muster: /^Arbeitsgemeinschaft Asthmaschulung/,
    aktuell: { stand: 'laufend', fundstelle: 'https://www.asthmaschulung.de/' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.asthmaschulung.de/', intervallMonate: 24,
    hinweis: 'Am 20.11.2026 erreichbar und aktiv (Tagung Februar 2026).',
  },
  {
    id: 'halt', titel: 'HaLT – Hart am Limit: Alkoholprävention bei Kindern und Jugendlichen', herausgeber: 'Villa Schöpflin, Zentrum für Suchtprävention', art: 'empfehlung', muster: /^HaLT/,
    aktuell: { stand: 'laufend', fundstelle: 'https://www.halt.de/' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.halt.de/', intervallMonate: 24,
    hinweis: 'Am 20.11.2026 erreichbar und aktiv.',
  },
  {
    id: 'dgai.awr', titel: 'DGAI/BDA: Empfehlung zur Überwachung nach Anästhesieverfahren (Aufwachraum)', herausgeber: 'DGAI und BDA', art: 'empfehlung', muster: /^DGAI\/BDA: Empfehlung zur Überwachung nach Anästhesie/,
    aktuell: { stand: '2009', erschienen: '2009-03-25', fundstelle: 'https://www.ai-online.info/images/ai-ausgabe/2009/0708-2009/supplement-2-2009/2009_7_S486-S489_Ueberwachung%20nach%20Anaesthesieverfahren.pdf' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.dgai.de/', intervallMonate: 24,
    hinweis: 'Korrektur 20.11.2026: Eine „Revision 2021“ ist nicht belegt; gültig ist die Empfehlung von 2009. Die Geräteausstattung im Aufwachraum regeln seit 2025 die DGAI/BDA-Mindestanforderungen (Anästh Intensivmed 2025;66:V130–V136).',
  },
  {
    id: 'grc', titel: 'German Resuscitation Council: Eckpunktepapier innerklinische Notfallversorgung', herausgeber: 'German Resuscitation Council', art: 'empfehlung', muster: /^German Resuscitation Council/,
    aktuell: { stand: 'laufend', fundstelle: 'https://www.grc-org.de/' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.grc-org.de/', intervallMonate: 24,
    hinweis: 'Am 20.11.2026 erreichbar und aktiv; das Eckpunktepapier selbst war auf der Startseite nicht verlinkt.',
  },
  {
    id: 'cirs', titel: 'CIRS-Berichtssysteme (CIRSmedical.de, KH-CIRS-Netz Deutschland)', herausgeber: 'ÄZQ und Partner', art: 'empfehlung', muster: /^CIRS-Berichtssystem/,
    aktuell: { stand: 'laufend', fundstelle: 'https://www.cirsmedical.de/' }, geprueftAm: AUDIT_GEPRUEFT, beobachten: 'https://www.cirsmedical.de/', intervallMonate: 24,
    hinweis: 'Am 20.11.2026 erreichbar und aktiv.',
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
