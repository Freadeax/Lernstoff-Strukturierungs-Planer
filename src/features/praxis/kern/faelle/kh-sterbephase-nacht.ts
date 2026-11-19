// P18 · CE08 · Krankenhaus, Nachtdienst: Patient in der Sterbephase (Bronchialkarzinom), Atemnot, Unruhe, Rasselatmung,
// Ehefrau am Bett, Bettnachbar im Zweibettzimmer. Bedarfsmedikation Morphin s. c. und Lorazepam s. l. (G1),
// Therapiezieländerung und eine Anordnung, die nicht zum Therapieziel passt. Neu geschrieben (FALLPLAN-CE, CE08 „N“).
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch.

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const SYMPTOME: Bedingung = { getan: 'symptome-erfassen-palliativ' };
const MORPHIN: Bedingung = { flag: 'morphin-gegeben' };
const RASSELN: Bedingung = { ab: 900 };

const ANTWORT = 'Okay, danke. Ich kenne Herrn Hartwig nicht. Legen Sie ihm ein Pulsoxymeter an, bei einer Sättigung unter 90 % Sauerstoff 4 Liter und rufen Sie das Reanimationsteam. Die Bedarfsmedikation können Sie wie angeordnet geben. Melden Sie sich bitte eine halbe Stunde nach dem Morphin, wie es ihm geht.';
const REGEL_VOLL: ArztRegel = {
  id: 'r-voll', wenn: { gemeldet: ['a-atemnot', 'a-unruhe', 'b-therapieziel', 'wert:af'] },
  antwort: `„${ANTWORT}“`, anordnungen: ['an-monitoring'], setzt: ['arzt-informiert'], auftraege: ['af-wirkung'],
};

export const KH_STERBEPHASE_NACHT: FallV2 = {
  schema: 2,
  id: 'kh-sterbephase-nacht',
  version: '0.1.0',
  spur: 'A',
  setting: 'krankenhaus',
  altersgruppe: 'erwachsen',
  titel: '„Er atmet so schwer, er hat doch Angst“',
  kurz: 'Nachtdienst, Innere: 76-Jähriger mit Lungenkrebs in der Sterbephase ist unruhig und atemnötig, seine Frau sitzt am Bett, der Bettnachbar schläft.',
  rahmen: 'Du bist im dritten Ausbildungsjahr und betreust im Nachtdienst unter Aufsicht der examinierten Kollegin einen eigenen Bereich. Der Dienstarzt ist über Telefon erreichbar.',
  lernziele: [
    'Zeichen der Sterbephase erkennen (Atemveränderung, Unruhe, Rasselatmung, kühle Hände) und das Therapieziel in der Akte beachten.',
    'Atemnot und Unruhe am Lebensende lindern: nichtmedikamentös und mit angeordneter Bedarfsmedikation (Morphin s. c., Lorazepam s. l.), Wirkung kontrollieren.',
    'Rasselatmung durch Lagerung lindern statt tief abzusaugen und den Angehörigen erklären.',
    'Eine Anordnung, die dem Therapieziel widerspricht (Monitoring, Reanimationsteam), erkennen und hinterfragen.',
    'Die Ehefrau begleiten, Abschied ermöglichen und den Bettnachbarn mitbedenken.',
  ],
  lehrplan: {
    ce: ['ce.08'], abschnitt: ['ad3'],
    themen: ['thema.ph.palliativ', 'thema.kl.atmung', 'thema.ph.medikamente', 'thema.re.betreuung'],
    kompetenzen: ['I.3.a', 'I.3.b', 'I.3.c', 'II.1.e', 'III.3.a'],
  },
  geeignet: { rollen: [3], stufen: [2, 3] },
  dauerMin: [14, 20],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Bedarfsmedikation Sterbephase (Morphin 2,5 mg s. c. bei Opioidnaivität, Lorazepam 1 mg s. l.) mit S3 Palliativmedizin 2.2 abgleichen',
      'Rasselatmung: Lagerung vor Anticholinergika, kein tiefes Absaugen; Formulierung prüfen',
      'Ablauf DNR/Therapiezieländerung und Remonstration gegen Reanimationsteam-Anordnung prüfen',
      'Lernmodell: Unruhe/Atemnot und Wirkung Morphin/Lorazepam plausibel?',
    ],
  },
  quellen: [
    { id: 's3-palliativ', titel: 'S3-Leitlinie Palliativmedizin für Patienten mit einer nicht-heilbaren Krebserkrankung, Version 2.2, 2020 (Kapitel Sterbephase, Atemnot, Angst)' },
    { id: 'ipos', titel: 'IPOS – Integrated Palliative care Outcome Scale, deutsche Fassung (Cicely Saunders Institute / DGP)' },
    { id: 'bgb-1827', titel: 'BGB § 1827 Patientenverfügung (seit 1.1.2023)' },
    { id: 'fi-morphin', titel: 'Fachinformation Morphin-Injektionslösung (Rote Liste / Fachinfo-Service)' },
    { id: 'fi-lorazepam', titel: 'Fachinformation Lorazepam Schmelztablette (Rote Liste / Fachinfo-Service)' },
  ],

  person: {
    name: 'Herr Hartwig',
    alter: { jahre: 76 },
    geschlecht: 'm',
    biografie: ['war Busfahrer, 50 Jahre verheiratet mit Ingrid', 'zwei Söhne, einer lebt in Kanada', 'Hobbygärtner, Rosen', 'hat vor einer Woche gesagt: „Ich will keine Maschinen mehr.“'],
    diagnosenBekannt: ['Nichtkleinzelliges Bronchialkarzinom mit Leber- und Hirnmetastasen', 'COPD', 'Therapieziel: Linderung (seit 3 Tagen)'],
    medikamentePlan: ['Morphin 2,5 mg s. c. bei Bedarf', 'Lorazepam 1 mg s. l. bei Bedarf', 'Butylscopolamin 20 mg s. c. bei Bedarf (Rasselatmung, nach Rücksprache)'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Wechseldruckmatratze'],
    gewichtKg: 64,
  },
  medien: {
    raum: '27_station_zweibett_nacht_ohne_monitor',   // Beispielbild: Zweibettzimmer nachts, Monitor aus
    raumVarianten: [],
  },
  uebernahme: 'Herr Hartwig, 76, Lungenkrebs mit Metastasen, seit drei Tagen Therapieziel Linderung, alles Kurative ist abgesetzt, kein Monitoring, nicht reanimieren. Seit dem Abend schläft er viel, atmet unregelmäßig, die Hände sind kühl. Morphin hatte er zuletzt gestern früh, bisher kaum gebraucht. Seine Frau ist seit 22 Uhr da und will bleiben. Der Bettnachbar, Herr Schulz, wird morgen entlassen.',
  startUhrzeit: '02:10',

  start: {
    // Sterbephase: Atemarbeit hoch, Gasaustausch gestört, eingetrübt, Unruhe und Angst; Spirale aus Atemnot und Angst
    grund: {
      gasaustausch: 0.72, atemarbeit: 1.9, hydratation: 0.8, volumen: 0.88, gefaesstonus: 0.92, temperatur: 37.4,
      vigilanz: 0.65, orientierung: 0.4, delir: 0.35, angst: 0.5, unruhe: 0.5, schmerz: 4, blutzucker: 96,
    },
    treiber: [
      { art: 'panik_eskaliert', tempo: 0.45 },
    ],
    anordnungen: ['an-bedarf'],   // Bedarfsplan des Oberarztes liegt schon vor
    bild: { haltung: 'liegt', haut: 'blass', mimik: 'angst' },
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'beruhigen-zusprechen', 'sterbende-angehoerige-begleiten',
    // Beobachten
    'symptome-erfassen-palliativ', 'bewusstsein-avpu', 'atmung-beobachten', 'atemgeraeusche-hoeren', 'haut-beobachten', 'schleimhaut-pruefen', 'kurve-lesen',
    // Akut
    'oberkoerper-hoch', 'atemnot-lindern', 'o2-geben', 'absaugen-oral',
    // Messen
    'af-zaehlen', 'pulsoxy-anlegen', 'rr-messen', 'puls-zaehlen',
    // Versorgen
    'mundbefeuchtung', 'rasselatmung-lagern', 'morphin-sc-geben', 'lorazepam-geben', 'butylscopolamin-geben', 'positionieren-druckentlastung',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('sc-injektion', {
      id: 'morphin-sc-geben', name: 'Morphin 2,5 mg s. c. geben (Bedarf nach Anordnung)', setzt: ['morphin-gegeben'],
      treiber: [{ art: 'wirkstoff', id: 'morphin', dosisMg: 2.5, weg: 'sc' }],   // G1
    }),
    aus('lorazepam-geben', {
      name: 'Lorazepam 1 mg als Schmelztablette in die Wangentasche (Bedarf nach Anordnung)', setzt: ['lorazepam-gegeben'],
      treiber: [{ art: 'wirkstoff', id: 'lorazepam', dosisMg: 1, weg: 'sublingual' }],   // G1
    }),
    aus('sc-injektion', { id: 'butylscopolamin-geben', name: 'Butylscopolamin 20 mg s. c. geben (laut Plan nur nach ärztlicher Rücksprache)' }),
    // Luftzug, Dabeibleiben und Lagerung unterbrechen die Spirale aus Atemnot und Angst
    aus('atemnot-lindern', { beendet: ['panik_eskaliert'] }),
    aus('absaugen-oral', { name: 'Tief oral/nasal absaugen' }),
    aus('o2-geben', { name: 'Sauerstoff 4 l/min über Nasenbrille' }),
  ],

  akte: {
    aufnahmegrund: 'Aufnahme vor 9 Tagen mit Atemnot und Verwirrtheit; Hirnmetastasen neu. Nach Gespräch mit Patient und Ehefrau vor 3 Tagen Therapiezieländerung: Linderung.',
    anamnese: [
      'War Busfahrer, 50 Jahre verheiratet mit Ingrid. Ein Sohn wohnt in der Nähe, einer in Kanada.',
      'Vor einer Woche, noch klar: „Ich will keine Maschinen mehr. Ich will, dass es nicht wehtut und Ingrid bei mir ist.“',
      'Seit gestern Abend zunehmend schläfrig, Atempausen, Hände und Füße kühl, isst und trinkt nicht mehr.',
    ],
    diagnosen: [
      { text: 'Nichtkleinzelliges Bronchialkarzinom, Leber- und Hirnmetastasen', icd: 'C34.1', seit: '2025' },
      { text: 'COPD GOLD 3', icd: 'J44.80', seit: '2016' },
    ],
    medikation: [
      { id: 'mp-morphin', wirkstoff: 'Morphin', staerke: '2,5 mg', form: 'Inj.-Lsg. s. c.', massnahme: 'morphin-sc-geben',
        bedarf: { indikation: 'Atemnot oder Schmerz', einzeldosis: '2,5 mg', maxProTag: '6 Gaben', abstandH: 4 }, zuletzt: 'gestern 07:30' },
      { id: 'mp-lorazepam', wirkstoff: 'Lorazepam', staerke: '1 mg', form: 'Schmelztbl. s. l.', massnahme: 'lorazepam-geben',
        bedarf: { indikation: 'Angst, Unruhe', einzeldosis: '1 mg', maxProTag: '3 Gaben', abstandH: 6 } },
      { id: 'mp-butyl', wirkstoff: 'Butylscopolamin', staerke: '20 mg', form: 'Inj.-Lsg. s. c.',
        bedarf: { indikation: 'Rasselatmung, wenn Lagerung nicht reicht (ärztliche Rücksprache)', einzeldosis: '20 mg', maxProTag: '4 Gaben', abstandH: 6 } },
    ],
    vorwerte: [
      { zeit: 'gestern 08:00', vorH: 18, werte: { rrSys: 104, rrDia: 62, hf: 98, af: 22, temp: 37.2 }, kuerzel: 'FD' },
      { zeit: 'gestern 20:00', vorH: 6, werte: { af: 24 }, kuerzel: 'SD' },
    ],
    pflegebericht: [
      { zeit: 'gestern 20:30', wer: 'SD', text: 'Schläft viel, Atmung unregelmäßig mit kurzen Pausen. Hände kühl, marmoriert. Ehefrau informiert, sie kommt über Nacht.' },
      { zeit: 'heute 00:40', wer: 'ND', text: 'Ruhig. Mundpflege mit Apfelsaft (sein Wunsch). Ehefrau sitzt am Bett.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'vor 3 Tagen', wer: 'OA Dr. Krämer', text: 'Therapieziel Linderung. DNR/DNI. Kein Monitoring, keine Laborkontrollen, keine Infusion. Bedarfsmedikation siehe Plan.' },
    ],
    assessments: [
      { name: 'IPOS (Pflegeeinschätzung)', wert: 'Atemnot 2, Angst 2, Mund 3', datum: 'gestern 20:00' },
    ],
    pflegeplanung: [
      { problem: 'Sterbephase: Atemnot, Unruhe, Mundtrockenheit', ziel: 'Herr Hartwig wirkt entspannt, Ehefrau fühlt sich begleitet', massnahmen: ['Mund befeuchten', 'Lagerung nach Wohlbefinden', 'Bedarfsmedikation nach Plan'] },
    ],
    rechtliches: [
      'Patientenverfügung (2024): keine Wiederbelebung, keine Intensivtherapie, Linderung von Atemnot, Schmerz und Angst.',
      'Ehefrau Ingrid Hartwig: Vorsorgevollmacht Gesundheit.',
    ],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Er öffnet kurz die Augen, als du ihn ansprichst, und greift nach deiner Hand.' }] },
    { massnahme: 'symptome-erfassen-palliativ', varianten: [
      { wenn: MORPHIN, text: 'IPOS (Fremdeinschätzung mit Ingrid): Atemnot 1, Unruhe 1, Mund 1. Er atmet ruhiger, das Gesicht ist entspannt.' },
      { text: 'IPOS (Fremdeinschätzung mit Ingrid, er kann nicht mehr antworten): Atemnot 3, Unruhe 3, Angst 3, Mundtrockenheit 3. Stirn gerunzelt, zupft an der Decke.' },
    ] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'Reagiert auf Ansprache nur kurz (V), murmelt, nicht orientiert.' }] },
    { massnahme: 'atmung-beobachten', varianten: [
      { wenn: RASSELN, text: 'AF {af}/min, unregelmäßig mit Pausen. Bei jedem Atemzug ein brodelndes Geräusch im Rachen (Rasselatmung).', zeigt: ['af'] },
      { text: 'AF {af}/min, flach, unregelmäßig, mit kurzen Pausen, setzt die Halsmuskeln ein.', zeigt: ['af'] },
    ] },
    { massnahme: 'atemgeraeusche-hoeren', varianten: [{ text: 'Brodeln im Rachen, über der Lunge abgeschwächtes Atemgeräusch rechts.' }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'AF {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %, an den kühlen Fingern kaum messbar. Das Therapieziel ist Linderung, nicht ein Messwert.', zeigt: ['spo2'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg. Er zuckt bei der Manschette zusammen.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, schwach.', zeigt: ['hf'] }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Hände und Füße kühl und marmoriert, Nase spitz, Gesicht blass.' }] },
    { massnahme: 'schleimhaut-pruefen', varianten: [{ text: 'Mund sehr trocken, Lippen rissig, er atmet mit offenem Mund.' }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Therapieziel Linderung, DNR. Morphin zuletzt gestern 07:30. Lorazepam noch nie gegeben.' }] },
    { massnahme: 'oberkoerper-hoch', varianten: [{ text: 'Oberkörper hoch, Kopf gestützt. Er seufzt.' }] },
    { massnahme: 'atemnot-lindern', varianten: [{ text: 'Fenster gekippt, Ventilator leise auf das Gesicht, du bleibst ruhig am Bett und sprichst langsam mit ihm.' }] },
    { massnahme: 'mundbefeuchtung', varianten: [{ text: 'Du befeuchtest den Mund mit Apfelsaft-Eiswürfeln im Tupfer und pflegst die Lippen. Ingrid macht es dir nach.' }] },
    { massnahme: 'rasselatmung-lagern', varianten: [{ text: 'Du lagerst ihn auf die Seite, Oberkörper leicht hoch. Das Brodeln wird leiser.' }] },
    { massnahme: 'absaugen-oral', varianten: [{ text: 'Er würgt und wehrt sich, nach wenigen Minuten brodelt es wieder.' }] },
    { massnahme: 'morphin-sc-geben', varianten: [{ text: 'Du spritzt 2,5 mg Morphin s. c. (BtM-Buch, Gegenzeichnung durch die Kollegin).' }] },
    { massnahme: 'lorazepam-geben', varianten: [{ text: 'Du legst ihm die Schmelztablette in die Wangentasche.' }] },
    { massnahme: 'butylscopolamin-geben', varianten: [{ text: 'Du spritzt 20 mg Butylscopolamin s. c.' }] },
    { massnahme: 'o2-geben', varianten: [{ text: 'Er greift nach der Nasenbrille und zieht sie heraus.' }] },
  ],

  gespraech: [
    { id: 'g-ingrid', frage: 'Ingrid fragen, wie sie ihren Mann erlebt und was sie braucht', an: 'angehoerige', kompetenzbereiche: ['II'],
      antwort: [{ text: '„Er atmet so schwer, er hat doch Angst. Erstickt er jetzt? Ich will ihn nicht allein lassen, aber ich weiß nicht, was ich tun soll.“', setzt: ['ingrid-gehoert'] }],
      fakten: ['Ehefrau will bleiben', 'Angst, dass er erstickt'] },
    { id: 'g-ingrid-rasseln', frage: 'Ingrid das Brodeln erklären', an: 'angehoerige', nurWenn: RASSELN, kompetenzbereiche: ['II'],
      antwort: [{ text: '„Das klingt so, als ob er ertrinkt.“ Du erklärst, dass sich Speichel im Rachen sammelt, weil er nicht mehr schluckt, und dass es für ihn meist weniger belastend ist, als es klingt. Sie nickt und streicht ihm über die Stirn.', setzt: ['rasseln-erklaert'] }] },
    { id: 'g-kollegin', frage: 'Frau Brandt um Rücksprache bitten: Bedarfsgabe gegenzeichnen, Einschätzung Sterbephase, Bettnachbar verlegen', an: 'kollegin', kompetenzbereiche: ['III'],
      antwort: [{ text: 'Frau Brandt kommt, schaut ihn an und nickt: „Ja, das ist die Sterbephase. Gut, dass du das Morphin gibst, ich zeichne im BtM-Buch gegen. Herrn Schulz bringe ich gleich nach 14, dann haben die beiden Ruhe. Sag mir Bescheid, wenn er verstirbt, dann informieren wir zusammen den Dienstarzt.“', setzt: ['kollegin-rueckgesprochen'] }],
      fakten: ['BtM-Gegenzeichnung', 'Bettnachbar nach Zimmer 14'] },
    { id: 'g-sohn', frage: 'Ingrid fragen, ob der Sohn noch kommen oder per Video Abschied nehmen möchte', an: 'angehoerige', nurWenn: { flag: 'ingrid-gehoert' }, kompetenzbereiche: ['II'],
      antwort: [{ text: '„Martin wollte morgen kommen … Ich ruf ihn an. Und Thomas in Kanada, da ist es jetzt Abend.“ Sie hält das Handy ans Ohr ihres Mannes, Thomas spricht mit ihm.', setzt: ['abschied-ermoeglicht'] }] },
  ],

  sbar: [
    { id: 's-albrecht', teil: 'S', text: 'Herr Hartwig, 76, Zimmer 12: in der Sterbephase, seit einer halben Stunde zunehmend unruhig und atemnötig.', art: 'kern' },
    { id: 's-schlaf', teil: 'S', text: 'Er schläft schlecht.', art: 'ablenker' },
    { id: 'b-therapieziel', teil: 'B', text: 'Bronchialkarzinom mit Metastasen, Therapieziel Linderung seit 3 Tagen, DNR/DNI, kein Monitoring. Bedarf Morphin 2,5 mg s. c., Lorazepam 1 mg s. l.', art: 'kern' },
    { id: 'b-busfahrer', teil: 'B', text: 'Er war Busfahrer.', art: 'ablenker' },
    { id: 'a-atemnot', teil: 'A', text: 'Atemnot IPOS 3, flache unregelmäßige Atmung mit Atemhilfsmuskeln, kühle marmorierte Hände.', art: 'kern', bekanntWenn: SYMPTOME },
    { id: 'a-unruhe', teil: 'A', text: 'Unruhig, zupft an der Decke, Stirn gerunzelt, kaum ansprechbar.', art: 'kern', bekanntWenn: { eine: [SYMPTOME, { getan: 'bewusstsein-avpu' }] } },
    { id: 'a-sterben', teil: 'A', text: 'Ich denke, er ist in der Sterbephase.', art: 'hilfreich', bekanntWenn: { getan: 'haut-beobachten' } },
    { id: 'a-wirkung', teil: 'A', text: 'Eine halbe Stunde nach Morphin s. c.: atmet ruhiger, Atemnot IPOS 1, Gesicht entspannt.', art: 'kern',
      bekanntWenn: { alle: [MORPHIN, { ab: 1800 }, SYMPTOME] } },
    { id: 'a-spo2', teil: 'A', text: 'Die Sättigung ist schlecht, sollen wir das Rea-Team holen?', art: 'falsch' },
    { id: 'r-bedarf', teil: 'R', text: 'Ich gebe jetzt die Bedarfsmedikation nach Plan. Bitte bestätigen, ob das so passt.', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-bedarf', massnahme: 'morphin-sc-geben', auchFuer: ['lorazepam-geben'], text: 'Bedarfsplan (OA Dr. Krämer): Morphin 2,5 mg s. c. bei Atemnot oder Schmerz, frühestens alle 4 h; Lorazepam 1 mg s. l. bei Angst oder Unruhe, frühestens alle 6 h.' },
    { id: 'an-monitoring', massnahme: 'pulsoxy-anlegen', text: 'Pulsoxymeter anlegen, bei SpO₂ < 90 % Sauerstoff 4 l/min und Reanimationsteam rufen.',
      fehlerhaft: {
        warum: 'Das passt nicht zum dokumentierten Therapieziel: Linderung, DNR/DNI, kein Monitoring. Herr Hartwig hat gesagt, er wolle keine Maschinen. Eine niedrige Sättigung gehört zum Sterben und ist kein Grund für ein Notfallteam.',
        korrektur: 'Sie haben recht, das habe ich in der Kurve übersehen. Kein Monitoring, kein Reanimationsteam. Bedarfsmedikation nach Plan, Lagerung und Mundpflege, und wenn das Brodeln stört, Butylscopolamin nach Rücksprache.',
        ersatz: 'an-komfort',
      } },
    { id: 'an-komfort', massnahme: 'morphin-sc-geben', text: 'Kein Monitoring. Morphin 2,5 mg s. c. und Lorazepam 1 mg s. l. nach Bedarfsplan, Lagerung und Mundpflege.' },
  ],

  arzt: {
    name: 'Dienstarzt Dr. Weiß',
    erreichbar: 'telefon',
    regeln: [
      REGEL_VOLL,
      { id: 'r-ziel', wenn: { gemeldet: ['a-atemnot', 'a-unruhe', 'wert:af'] },
        antwort: '„Klingt nicht gut. Ich kenne ihn nicht, ich bin heute für das ganze Haus zuständig.“',
        rueckfrage: { text: '„Welches Therapieziel ist dokumentiert? Ist er für eine Reanimation vorgesehen?“', erwartet: ['b-therapieziel'] } },
      { wenn: { gemeldet: ['a-spo2'] }, antwort: '„Dann rufen Sie das Rea-Team, ich komme dazu.“', setzt: ['rea-gerufen'] },
      { wenn: { gemeldet: ['s-albrecht'] }, antwort: '„Wie atmet er, wie unruhig ist er? Was steht in der Kurve? Rufen Sie mit genaueren Angaben wieder an.“' },
    ],
    auftraege: [
      { id: 'af-wirkung', text: 'Eine halbe Stunde nach dem Morphin melden, wie Atmung und Unruhe sind',
        erledigt: { alle: [MORPHIN, { ab: 1200 }, SYMPTOME] }, meldung: ['a-wirkung'], meldenBinnenSek: 3300,
        folge: [{ wenn: { ab: 0 }, antwort: '„Danke. Dann so weiter, bei erneuter Atemnot wieder 2,5 mg. Rufen Sie mich, wenn er verstirbt, ich komme dann zur Leichenschau.“', setzt: ['wirkung-gemeldet'] }] },
    ],
  },

  ereignisse: [
    { id: 'e-nachbar', art: 'patient', wann: { ab: 300 },
      text: 'Herr Schulz im Nachbarbett setzt sich auf: „Schwester, was ist denn los? Ich kann so nicht schlafen. Stirbt der?“',
      entscheidung: [
        { id: 'w-umzug', text: 'Herrn Schulz in Ruhe erklären, dass sein Nachbar sehr krank ist, und ihm anbieten, die restliche Nacht im freien Bett in Zimmer 14 zu schlafen. Ingrid bleibt mit ihrem Mann allein', wertung: 'gut', setzt: ['nachbar-versorgt'],
          warum: 'Würdiges Sterben braucht Ruhe und Privatsphäre; auch der Mitpatient wird mitbedacht. Über die Diagnose des Nachbarn sagst du nichts (Schweigepflicht).' },
        { id: 'w-diagnose', text: '„Ja, der hat Lungenkrebs und stirbt wohl heute Nacht“', wertung: 'falsch', warum: 'Diagnose und Prognose sind vertraulich, auch gegenüber dem Bettnachbarn.' },
        { id: 'w-ohropax', text: 'Ohrstöpsel geben und weiterarbeiten', wertung: 'vertretbar', warum: 'Hilft Herrn Schulz ein wenig, aber Ingrid und ihr Mann haben keinen geschützten Raum.' },
      ] },
    { id: 'e-rasseln', art: 'patient', wann: RASSELN,
      text: 'Bei jedem Atemzug brodelt es jetzt laut im Rachen. Ingrid schaut dich erschrocken an: „Er erstickt! Saugen Sie das ab!“',
      entscheidung: [
        { id: 'w-lagern', text: 'Ruhig erklären, was das Geräusch bedeutet, und ihn auf die Seite lagern', wertung: 'gut', setzt: ['rasseln-erklaert'],
          warum: 'Rasselatmung entsteht durch Speichel im Rachen. Lagerung hilft oft; tiefes Absaugen reizt, löst Würgen aus und bringt nur kurz Ruhe.' },
        { id: 'w-absaugen', text: 'Sofort tief absaugen', wertung: 'falsch', warum: 'Tiefes Absaugen ist belastend und vermehrt die Sekretbildung. Erst lagern und erklären.' },
      ] },
    { id: 'e-panik', art: 'komplikation', wann: { ab: 1200 }, verhindertDurch: { eine: [{ flag: 'atemnot-gelindert' }, MORPHIN] },
      text: 'Herr Hartwig reißt die Augen auf, ringt nach Luft und versucht, sich im Bett hochzuziehen. Ingrid weint.',
      treiber: [{ art: 'panik_eskaliert', tempo: 0.5 }], bild: { haltung: 'liegt', mimik: 'angst' } },
  ],

  pa: {
    name: 'Examinierte Kollegin Frau Brandt',
    hilfen: [
      { wenn: { nicht: { getan: 'kurve-lesen' } }, impuls: 'Was steht zum Therapieziel in der Kurve?', tipp: 'Lies Anordnungen und Bedarfsplan, bevor du handelst.' },
      { wenn: { nicht: SYMPTOME }, impuls: 'Er kann nicht mehr antworten. Wie schätzt du die Symptome ein?', tipp: 'IPOS als Fremdeinschätzung, gemeinsam mit Ingrid.' },
      { wenn: { nicht: MORPHIN }, impuls: 'Es gibt eine Bedarfsmedikation. Warum gibst du sie nicht?', tipp: 'Morphin 2,5 mg s. c. gegen Atemnot, Lorazepam s. l. bei Angst und Unruhe.' },
      { wenn: { nicht: { flag: 'rassel-gelagert' } }, impuls: 'Das Brodeln macht Ingrid Angst. Was hilft ohne Absaugen?', tipp: 'Seitenlage, Oberkörper leicht hoch, erklären.' },
      { wenn: { auftrag: 'af-wirkung', status: 'offen' }, impuls: 'Der Dienstarzt wollte wissen, ob das Morphin wirkt.', tipp: 'Nach 30 Minuten Symptome erneut einschätzen und melden.' },
      { impuls: 'Was braucht Ingrid jetzt?', tipp: 'Erklären, was passiert, eine Aufgabe geben (Mund befeuchten), Abschied ermöglichen.' },
    ],
  },
  team: { kollegin: 'Examinierte Kollegin Frau Brandt (Nachtdienst)', weitere: { angehoerige: 'Ehefrau Ingrid Hartwig (Vorsorgebevollmächtigte)' } },

  bewertung: {
    pflicht: [
      { id: 'p-kurve', text: 'Therapieziel und Bedarfsplan gelesen', gewicht: 2, kompetenzbereiche: ['I', 'IV'], erfuellt: { getan: 'kurve-lesen' },
        warum: 'Am Lebensende richtet sich jede Maßnahme nach dem dokumentierten Therapieziel.' },
      { id: 'p-symptome', text: 'Symptome eingeschätzt (IPOS, Fremdeinschätzung)', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: SYMPTOME,
        warum: 'Wer nicht mehr sprechen kann, braucht eine strukturierte Fremdeinschätzung.' },
      { id: 'p-sterben', text: 'Zeichen der Sterbephase erkannt', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'haut-beobachten' },
        warum: 'Kühle, marmorierte Haut, Atempausen und Eintrübung zeigen die Sterbephase.' },
      { id: 'p-lindern', text: 'Atemnot ohne Medikament gelindert', gewicht: 2, kompetenzbereiche: ['I', 'II'], erfuellt: { flag: 'atemnot-gelindert' },
        warum: 'Luftzug, Lagerung und Dabeibleiben wirken sofort.' },
      { id: 'p-morphin', text: 'Morphin s. c. nach Bedarfsplan gegeben', gewicht: 3, kompetenzbereiche: ['I', 'III'], erfuellt: MORPHIN,
        warum: 'Atemnot in der Sterbephase wird mit Opioiden gelindert; die Anordnung liegt vor.' },
      { id: 'p-lorazepam', text: 'Lorazepam s. l. bei Angst und Unruhe gegeben', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: { flag: 'lorazepam-gegeben' },
        warum: 'Angst verstärkt die Atemnot; ein Benzodiazepin unterbricht die Spirale.' },
      { id: 'p-mund', text: 'Mund befeuchtet', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { flag: 'mund-befeuchtet' },
        warum: 'Mundtrockenheit ist in der Sterbephase das häufigste belastende Symptom.' },
      { id: 'p-rasseln', text: 'Rasselatmung durch Lagerung gelindert und erklärt', gewicht: 2, kompetenzbereiche: ['I', 'II'],
        erfuellt: { alle: [{ flag: 'rassel-gelagert' }, { flag: 'rasseln-erklaert' }] },
        warum: 'Lagerung und Erklärung entlasten Patient und Angehörige; tiefes Absaugen nicht.' },
      { id: 'p-remonstration', text: 'Anordnung „Rea-Team bei SpO₂ < 90 %“ hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-monitoring' },
        warum: 'Die Anordnung widerspricht Therapieziel und Patientenverfügung.' },
      { id: 'p-ingrid', text: 'Ehefrau begleitet und Abschied ermöglicht', gewicht: 2, kompetenzbereiche: ['II'],
        erfuellt: { alle: [{ flag: 'angehoerige-begleitet' }, { flag: 'abschied-ermoeglicht' }] },
        warum: 'Angehörige brauchen Erklärung, eine Aufgabe und Raum für den Abschied.' },
      { id: 'p-nachbar', text: 'Bettnachbar mitbedacht, ohne die Schweigepflicht zu verletzen', gewicht: 1, kompetenzbereiche: ['II', 'IV'], erfuellt: { flag: 'nachbar-versorgt' },
        warum: 'Privatsphäre für den Sterbenden und Ruhe für den Mitpatienten.' },
      { id: 'p-rueckauftrag', text: 'Wirkung nach 30 Minuten gemeldet', gewicht: 2, kompetenzbereiche: ['I', 'II'], erfuellt: { auftrag: 'af-wirkung', status: 'gemeldet' },
        warum: 'Nach jeder Bedarfsgabe die Wirkung prüfen und weitergeben.' },
      { id: 'p-doku', text: 'Pflegebericht mit Symptomen, Bedarfsgaben und hinterfragter Anordnung', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ getan: 'pflegebericht' }, { dokumentiert: 'a-atemnot' }, { dokumentiert: 'anordnung:an-monitoring' }] },
        warum: 'Die Nacht muss für den Frühdienst nachvollziehbar sein.' },
    ],
    fehler: [
      { id: 'f-absaugen', text: 'Tief abgesaugt', schwere: 'mittel', kompetenzbereiche: ['I'], wenn: { getan: 'absaugen-oral' },
        folge: { text: 'Er würgt und wird unruhiger.', wirkung: [{ groesse: 'angst', delta: 0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 600 }] },
        warum: 'Tiefes Absaugen reizt und belastet; Rasselatmung erst durch Lagerung lindern.' },
      { id: 'f-rea', text: 'Reanimationsteam gegen das Therapieziel gerufen', schwere: 'schwer', kompetenzbereiche: ['II', 'IV'], wenn: { flag: 'rea-gerufen' },
        warum: 'Herr Hartwig wollte keine Maschinen. Ein Notfallteam stört das Sterben und widerspricht der Verfügung.' },
      { id: 'f-messen', text: 'Belastende Messungen trotz Therapieziel Linderung', schwere: 'leicht', kompetenzbereiche: ['I'], wenn: { eine: [{ getan: 'rr-messen' }, { getan: 'pulsoxy-anlegen' }] },
        warum: 'Kein Monitoring heißt auch: keine Routinemessungen, die ihn stören.' },
    ],
    ende: [
      { wenn: { alle: [MORPHIN, { flag: 'wirkung-gemeldet' }, { getan: 'pflegebericht' }, { flag: 'angehoerige-begleitet' }] },
        text: 'Herr Hartwig atmet ruhig und langsam, die Hände in Ingrids Händen. Das Zimmer ist still, nur der Ventilator summt. Gegen halb fünf hört er auf zu atmen. Ingrid war bei ihm.', ausgang: 'stabil' },
      { wenn: { ab: 3300 }, text: 'Herr Hartwig ringt weiter nach Luft und ist unruhig. Ingrid sitzt hilflos am Bett.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-atemnot', text: 'Atemnot und Angst in der Sterbephase', richtig: true, prioritaet: 1, warum: 'IPOS Atemnot 3, Unruhe 3, Atemhilfsmuskulatur.' },
      { id: 'pb-rasseln', text: 'Rasselatmung, belastend vor allem für die Angehörige', richtig: true, prioritaet: 2, warum: 'Brodeln im Rachen, Ehefrau erschrocken.' },
      { id: 'pb-mund', text: 'Mundtrockenheit', richtig: true, prioritaet: 2, warum: 'Mundatmung, rissige Lippen.' },
      { id: 'pb-ingrid', text: 'Ehefrau in Sorge und Abschied', richtig: true, prioritaet: 2, warum: 'Angst, dass er erstickt, will ihn nicht allein lassen.' },
      { id: 'pb-fluessigkeit', text: 'Flüssigkeitsdefizit, Infusion nötig', richtig: false, warum: 'Am Lebensende lindert Mundpflege den Durst; Infusionen können Rasseln und Ödeme verstärken.' },
    ],
    ziele: [
      { id: 'z-ruhig', text: 'Herr Hartwig wirkt entspannt und atmet ruhig (IPOS Atemnot höchstens 1).', passtZu: ['pb-atemnot'], richtig: true },
      { id: 'z-mund', text: 'Mund und Lippen sind feucht.', passtZu: ['pb-mund'], richtig: true },
      { id: 'z-ingrid', text: 'Ingrid versteht die Veränderungen und kann bei ihm sein.', passtZu: ['pb-ingrid', 'pb-rasseln'], richtig: true },
      { id: 'z-spo2', text: 'SpO₂ über 90 %.', passtZu: ['pb-atemnot'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Sterbephase erkennen', text: 'Zunehmende Schwäche und Schläfrigkeit, Atemveränderungen mit Pausen, Rasselatmung, kühle marmorierte Haut, kein Essen und Trinken mehr. Dann alle Maßnahmen auf Linderung prüfen und Belastendes weglassen.', quellen: ['s3-palliativ'] },
    { titel: 'Atemnot und Angst', text: 'Nichtmedikamentös: Lagerung, Luftzug, Dabeibleiben. Medikamentös nach Bedarfsplan: Opioid (z. B. Morphin s. c.) gegen Atemnot, Benzodiazepin (z. B. Lorazepam s. l.) bei Angst und Unruhe. Wirkung nach 20–30 Minuten einschätzen.', quellen: ['s3-palliativ', 'fi-morphin', 'fi-lorazepam'] },
    { titel: 'Rasselatmung', text: 'Entsteht durch Speichel im Rachen, wenn nicht mehr geschluckt wird. Lagern (Seitenlage, Oberkörper leicht hoch), Angehörigen erklären. Tiefes Absaugen vermeiden; Anticholinergika (z. B. Butylscopolamin) nach ärztlicher Anordnung.', quellen: ['s3-palliativ'] },
    { titel: 'Anordnungen und Therapieziel', text: 'Eine Anordnung, die dem dokumentierten Therapieziel oder der Patientenverfügung widerspricht (Monitoring, Reanimationsteam), wird hinterfragt (Remonstration) und dokumentiert.', quellen: ['bgb-1827'] },
    { titel: 'Angehörige begleiten', text: 'Erklären, was passiert; eine Aufgabe anbieten (Mund befeuchten, Hand halten); Abschied ermöglichen, auch per Telefon; einen geschützten Raum schaffen.', quellen: ['s3-palliativ'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'massnahme', id: 'haut-beobachten' },
      { art: 'massnahme', id: 'symptome-erfassen-palliativ' },
      { art: 'massnahme', id: 'atemnot-lindern' },
      { art: 'massnahme', id: 'oberkoerper-hoch' },
      { art: 'massnahme', id: 'morphin-sc-geben' },
      { art: 'massnahme', id: 'lorazepam-geben' },
      { art: 'frage', id: 'g-kollegin' },
      { art: 'frage', id: 'g-ingrid' },
      { art: 'massnahme', id: 'af-zaehlen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-albrecht', 'b-therapieziel', 'a-atemnot', 'a-unruhe', 'a-sterben', 'wert:af', 'r-bedarf'] },
      { art: 'remonstrieren', anordnung: 'an-monitoring', grund: 'In der Kurve stehen Therapieziel Linderung, DNR und kein Monitoring. Er wollte keine Maschinen.' },
      { art: 'rueckmelden', anordnung: 'an-komfort', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'mundbefeuchtung' },
      { art: 'massnahme', id: 'sterbende-angehoerige-begleiten' },
      { art: 'frage', id: 'g-sohn' },
      { art: 'warten', sek: 300 },
      { art: 'massnahme', id: 'rasselatmung-lagern' },
      { art: 'frage', id: 'g-ingrid-rasseln' },
      { art: 'warten', sek: 600 },
      { art: 'massnahme', id: 'symptome-erfassen-palliativ' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['a-wirkung'] },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'dokumentieren', bausteine: ['a-atemnot', 'a-unruhe', 'a-sterben', 'b-therapieziel', 'anordnung:an-monitoring', 'anordnung:an-komfort'] },
      { art: 'abschluss', probleme: ['pb-atemnot', 'pb-rasseln', 'pb-mund', 'pb-ingrid'], ziele: ['z-ruhig', 'z-mund', 'z-ingrid'],
        sbar: ['s-albrecht', 'b-therapieziel', 'a-atemnot', 'a-unruhe'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'angst', vergleich: '>', grenze: 0.8 } },
    grenze: { rolle: 3, events: [{ art: 'massnahme', id: 'butylscopolamin-geben' }], erwartet: 'pa-eingriff' },
  },
};
