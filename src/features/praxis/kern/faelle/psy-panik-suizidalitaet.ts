// Pilotfall Spur A · Psychiatrie/akute Krise: Panikattacke, danach Suizidgedanken mit Plan
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Muster: amb-sturz-exsikkose.ts (Paket P6).
// Foto fehlt (Psychiatrie-Zimmer bestellt, MATERIAL-BEDARF.md); bis dahin Beispielbild Raum 30a.
// Runde 2 (P14b): Rückfrage der Ärztin nach dem Puls, Rückauftrag „Schwester einbeziehen?“, Schwester am Telefon mit
// Schweigepflicht, Kollege Deniz (Begleitung planen), vollständige Akte, Dokumentationspflicht mit wörtlichen Aussagen.

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const RUHIGER: Bedingung = { getan: 'atemanleitung-ruhig' };
/** Sie kann erst antworten, wenn die Panik nachgelassen hat. */
const PLAN_BEKANNT: Bedingung = { alle: [{ getan: 'suizidalitaet-ansprechen' }, RUHIGER] };
const BEGLEITET: Bedingung = { eine: [{ getan: 'sitzwache' }, { getan: 'hilfe-holen' }] };
/** Die Schwester ruft an (Ereignis e-schwester); erst dann gibt es das Gespräch mit ihr. */
const SCHWESTER_RUFT: Bedingung = { alle: [PLAN_BEKANNT, { ab: 840 }] };

/** Hauptantwort der Ärztin (direkt oder nach der Rückfrage); id: antwortet nur einmal im Fall */
const R_ANORDNUNG = {
  id: 'r-anordnung',
  antwort: '„Danke für die klare Meldung. Geben Sie ihr Lorazepam 1 mg, dann soll sie schlafen. Stündliche Sichtkontrolle reicht, ich sehe sie morgen in der Visite. Und fragen Sie sie bitte, ob wir ihre Schwester einbeziehen dürfen. Schreiben Sie mir, was sie sagt.“',
  anordnungen: ['an-lorazepam', 'an-stuendlich'], setzt: ['arzt-informiert'], auftraege: ['af-schwester'],
};

export const PSY_PANIK_SUIZIDALITAET: FallV2 = {
  schema: 2,
  id: 'psy-panik-suizidalitaet',
  version: '0.2.0',
  spur: 'A',
  setting: 'psychiatrie',
  altersgruppe: 'erwachsen',
  titel: '„Ich krieg keine Luft, ich sterbe“',
  kurz: 'Psychiatrische Station, Abend: 34-Jährige mit Depression klingelt in Panik; danach spricht sie vom Sterben.',
  rahmen: 'Du hast Spätdienst auf einer offenen psychiatrischen Station. Frau Keller aus Zimmer 12 klingelt, deine Praxisanleitung ist auf Station.',
  lernziele: [
    'Bei einer Panikattacke da bleiben, beruhigen und ruhig mitatmen, ohne Tütenatmung.',
    'Körperliche Ursachen mitbedenken (Puls, Sättigung, Atmung) und trotzdem nicht dramatisieren.',
    'Suizidgedanken offen und direkt ansprechen und nach Plan und Mitteln fragen.',
    'Bei akuter Suizidalität nicht allein lassen, Mittel sichern, Schweigepflicht ehrlich begrenzen.',
    'Eine unzureichende Anordnung („stündliche Kontrolle reicht“) hinterfragen.',
  ],
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Ablauf bei Panikattacke (beruhigen, Atmung, körperliche Ursachen bedenken, keine Tütenatmung) gegen S3-Leitlinie Angststörungen prüfen',
      'Suizidalität ansprechen und Abschätzen (Gedanken, Plan, Mittel, Vorbereitungen, Schutzfaktoren) gegen NVL Unipolare Depression und NICE NG225 prüfen',
      'Remonstrationspunkt „stündliche Sichtkontrolle reicht“ bei konkretem Plan mit gesammelten Tabletten: Stationsregeln (1:1-Begleitung, Sichtkontakt) fachlich prüfen',
      'Befugnis Suizidalität ansprechen und Gegenstände sichern (1./2. Drittel mit Anleitung) gegen BW-Lehrplan CE 06/CE 11 bestätigen',
      'Lorazepam 1 mg bei akuter Angst und Suizidalität als ärztliche Bedarfsanordnung plausibel?',
      'Foto Psychiatrie-Zimmer fehlt: Raum 30a ist nur Beispielbild',
      'Runde 2: Auskunft an die Schwester nur mit Einwilligung (keine Schweigepflichtentbindung in der Akte); bei Lebensgefahr und fehlender Einwilligungsfähigkeit wäre § 34 StGB zu prüfen – hier ist sie ansprechbar und begleitet',
      'Akte: Zopiclon bei Aufnahme abgesetzt, Restbestand nicht abgegeben – Aufnahmeroutine (Taschenkontrolle mit Einverständnis) fachlich prüfen',
    ],
  },
  quellen: [
    { id: 'nvl-depression', titel: 'Nationale VersorgungsLeitlinie Unipolare Depression, Version 3.2 (2022), Kapitel Suizidalität' },
    { id: 'nice-ng225', titel: 'NICE NG225: Self-harm – assessment, management and preventing recurrence (2022)' },
    { id: 's3-angst', titel: 'S3-Leitlinie Behandlung von Angststörungen (AWMF 051-028), Version 2, 2021' },
    { id: 's3-zwang', titel: 'S3-Leitlinie Verhinderung von Zwang: Prävention und Therapie aggressiven Verhaltens bei Erwachsenen (AWMF 038-022), 2018' },
  ],

  person: {
    name: 'Frau Keller',
    alter: { jahre: 34 },
    geschlecht: 'w',
    biografie: ['Industriekauffrau, seit zwei Monaten krankgeschrieben', 'Trennung vom Partner vor drei Monaten', 'Schwester wohnt in der Nähe, gutes Verhältnis', 'hat einen Kater, um den sich die Schwester kümmert'],
    diagnosenBekannt: ['schwere depressive Episode (seit 3 Tagen freiwillig stationär)', 'Panikstörung seit dem 20. Lebensjahr'],
    medikamentePlan: ['Sertralin 50 mg 1-0-0 (seit zwei Wochen)', 'Bedarfsmedikation: noch keine angesetzt'],
    allergien: ['keine bekannt'],
    gewichtKg: 64,
  },
  medien: {
    raum: '30a_station_zimmer_frau_ohne_monitor',   // Beispielbild: Psychiatrie-Zimmer fehlt, bestellt (MATERIAL-BEDARF.md)
  },
  uebernahme: 'Frau Keller, 34, seit drei Tagen freiwillig bei uns mit schwerer Depression, bekannte Panikstörung. Heute Nachmittag hat sie mit ihrem Ex-Partner telefoniert und war danach still. Bedarfsmedikation ist noch keine angesetzt. Gerade hat sie geklingelt.',
  startUhrzeit: '21:10',

  start: {
    // Panik steigert sich ohne Hilfe (panik_eskaliert): Angst steigt, Hyperventilation (AF hoch, CO₂ niedrig).
    grund: { angst: 0.65, unruhe: 0.45, schmerz: 2, temperatur: 36.8 },
    treiber: [{ art: 'panik_eskaliert', tempo: 1 }],
    bild: { haltung: 'sitzt', haut: 'blass', mimik: 'angst' },
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'beruhigen-zusprechen', 'atemanleitung-ruhig', 'beschwerden-erfragen', 'suizidalitaet-ansprechen', 'deeskalierend-sprechen',
    // Beobachten
    'ersteindruck-abcde', 'atmung-beobachten', 'haut-beobachten', 'bewusstsein-avpu', 'schmerz-nrs',
    // Akut
    'hilfe-holen', 'sitzwache', 'gefaehrliche-gegenstaende-sichern', 'tuete-atmen', 'fem-anlegen',
    // Messen
    'puls-zaehlen', 'pulsoxy-anlegen', 'rr-messen', 'af-zaehlen', 'kurve-lesen',
    // Versorgen
    'trinken-anbieten', 'lorazepam-bedarf', 'kontrolle-stuendlich',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('atemanleitung-ruhig', { id: 'tuete-atmen', name: 'In eine Papiertüte atmen lassen', beendet: [], wirkung: [] }),
    aus('bedarfsmedikation-oral', {
      id: 'lorazepam-bedarf', name: 'Lorazepam 1 mg als Schmelztablette geben (nach Anordnung)',
      treiber: [{ art: 'wirkstoff', id: 'lorazepam', dosisMg: 1, weg: 'sublingual' }],   // G1
    }),
    aus('sitzwache', { id: 'kontrolle-stuendlich', name: 'Stündliche Sichtkontrolle einplanen und sie allein lassen', setzt: ['nur-stuendlich'] }),
  ],

  akte: {
    aufnahmegrund: 'Freiwillige Aufnahme vor drei Tagen über die Institutsambulanz: schwere depressive Episode mit Antriebslosigkeit, Schlafstörung und sozialem Rückzug nach Trennung; zunehmende Panikattacken.',
    anamnese: [
      'Panikstörung seit dem 20. Lebensjahr, frühere ambulante Verhaltenstherapie mit gutem Erfolg.',
      'Seit der Trennung vor drei Monaten schläft sie schlecht, isst wenig (minus 4 kg), seit zwei Monaten krankgeschrieben.',
      'Kein früherer Suizidversuch bekannt. Kein Alkohol- oder Drogenkonsum laut Aufnahmegespräch.',
      'Der Hausarzt hatte Zopiclon 7,5 mg zum Schlafen verordnet; bei Aufnahme abgesetzt (Abhängigkeitsrisiko, gefährlich in Überdosis). Restbestand laut Patientin „zu Hause aufgebraucht“.',
      'Wichtige Bezugspersonen: Schwester Julia (wohnt in der Nähe), Kater Mio.',
    ],
    diagnosen: [
      { text: 'Schwere depressive Episode ohne psychotische Symptome', icd: 'F32.2', seit: '09/2026' },
      { text: 'Panikstörung', icd: 'F41.0', seit: '2012' },
    ],
    medikation: [
      { id: 'mp-sertralin', wirkstoff: 'Sertralin', staerke: '50 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: '08:00',
        hinweis: 'Seit zwei Wochen (vom Hausarzt begonnen). In den ersten Wochen auf innere Unruhe und Suizidgedanken achten.' },
    ],
    vorwerte: [
      { zeit: 'Aufnahme vor 3 Tagen', vorH: 75, werte: { rrSys: 118, rrDia: 76, hf: 78, af: 14, spo2: 99, temp: 36.6, gewicht: 64 }, kuerzel: 'MB' },
      { zeit: 'gestern 08:00', vorH: 37, werte: { rrSys: 112, rrDia: 72, hf: 74 }, kuerzel: 'MB' },
      { zeit: 'heute 08:00', vorH: 13, werte: { rrSys: 116, rrDia: 74, hf: 80 }, kuerzel: 'DA' },
    ],
    pflegebericht: [
      { zeit: 'gestern 14:00', wer: 'MB (Bezugspflege)', text: 'Bezugspflegegespräch: Frau Keller spricht leise, wenig Blickkontakt, schildert Grübeln über die Trennung. Suizidgedanken auf Nachfrage verneint, „das würde ich meiner Schwester nie antun“. Absprachefähig. Nimmt an der Ergotherapie teil.' },
      { zeit: 'gestern 21:30', wer: 'DA', text: 'Schläft schlecht ein, fragt nach etwas zum Schlafen. Ärztlich nichts angeordnet, Entspannungsübung angeboten, angenommen.' },
      { zeit: 'heute 15:30', wer: 'DA', text: 'Telefonat mit dem Ex-Partner auf dem Flur, danach still, zieht sich ins Zimmer zurück. Abendessen nicht gegessen. Im Kontakt einsilbig.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'vor 3 Tagen', wer: 'Dr. Lange', text: 'Sertralin 50 mg morgens weiter. Zopiclon abgesetzt. Bedarfsmedikation nach Rücksprache.' },
      { zeit: 'vor 3 Tagen', wer: 'Dr. Lange', text: 'Offene Station, Ausgang nach Absprache. Suizidalität täglich einschätzen und dokumentieren.' },
    ],
    assessments: [
      { name: 'PHQ-9 (Depression)', wert: '22 von 27 (schwer)', datum: 'vor 3 Tagen' },
      { name: 'Einschätzung Suizidalität', wert: 'distanziert, absprachefähig', datum: 'vor 3 Tagen (Aufnahme)', hinweis: 'Seitdem nicht erneut ärztlich eingeschätzt; gestern Gespräch mit der Bezugspflege.' },
      { name: 'Aufnahme-EKG', wert: 'Sinusrhythmus 76/min, unauffällig', datum: 'vor 3 Tagen' },
    ],
    labor: [
      { name: 'TSH', wert: '1,8', einheit: 'mU/l', norm: '0,4–4,0', datum: 'vor 3 Tagen' },
      { name: 'Hämoglobin', wert: '13,1', einheit: 'g/dl', norm: '12–16', datum: 'vor 3 Tagen' },
      { name: 'Natrium', wert: '139', einheit: 'mmol/l', norm: '135–145', datum: 'vor 3 Tagen' },
    ],
    pflegeplanung: [
      { problem: 'Hoffnungslosigkeit und sozialer Rückzug bei schwerer Depression', ziel: 'Frau Keller nimmt täglich an mindestens einem Gruppenangebot teil', massnahmen: ['Tagesstruktur gemeinsam planen', 'tägliches Bezugspflegegespräch', 'Suizidalität täglich ansprechen und dokumentieren'] },
      { problem: 'Panikattacken mit Hyperventilation', ziel: 'Frau Keller wendet bei Panik die Atemübung an', massnahmen: ['Atemübung (lang ausatmen) einüben', 'bei Panik da bleiben, ruhig sprechen'] },
      { problem: 'Ein- und Durchschlafstörung', ziel: 'Schläft mindestens 5 Stunden', massnahmen: ['Schlafhygiene besprechen', 'Entspannungsübung am Abend'] },
    ],
    rechtliches: [
      'Freiwillige Behandlung (Behandlungsvertrag unterschrieben). Keine Unterbringung.',
      'Keine Schweigepflichtentbindung erteilt: Auskunft an Angehörige nur nach Rücksprache mit Frau Keller.',
      'Keine gesetzliche Betreuung, keine Vorsorgevollmacht.',
    ],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Frau Keller sitzt auf der Bettkante, presst die Hand auf die Brust und atmet hektisch. „Gut, dass Sie da sind.“' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [
      { wenn: RUHIGER, text: 'Es habe nach dem Telefonat angefangen: Herzrasen, Engegefühl, Kribbeln in den Händen, „wie immer bei den Attacken, nur schlimmer“. Jetzt sei es besser.' },
      { text: '„Mein Herz rast, mir ist schwindelig, meine Hände kribbeln … ich sterbe!“' },
    ] },
    { massnahme: 'ersteindruck-abcde', varianten: [{ text: 'A frei, spricht in kurzen Sätzen. B: schnelle, flache Atmung. C: Haut blass, feucht, Puls schnell. D: wach, orientiert, sehr ängstlich. E: keine Verletzungen sichtbar.' }] },
    { massnahme: 'atmung-beobachten', varianten: [{ text: 'Schnelle, flache Brustatmung, {af}/min, keine Einziehungen, kein Giemen.', zeigt: ['af'] }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Blass und feucht, Lippen rosig, keine Zyanose.' }] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'Wach (AVPU {avpu}), zu allen Qualitäten orientiert.', zeigt: ['avpu'] }] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'Engegefühl in der Brust, „wie ein Band“, NRS 2, strahlt nicht aus, schon von früheren Attacken bekannt.' }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig, kräftig.', zeigt: ['hf'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %, Puls {hf}/min.', zeigt: ['spo2', 'hf'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Aufnahmebefund: körperlich gesund, EKG unauffällig, Labor normal. Suizidalität bei Aufnahme: „distanziert, absprachefähig“. Seitdem nicht erneut eingeschätzt. Bedarfsmedikation: keine.' }] },
    { massnahme: 'atemanleitung-ruhig', varianten: [{ text: 'Du setzt dich neben sie, atmest hörbar langsam aus und zählst mit: „Ein … und lang aus, zwei, drei, vier.“ Nach einigen Minuten wird ihr Atem langsamer, das Kribbeln lässt nach.' }] },
    { massnahme: 'tuete-atmen', varianten: [{ text: 'Sie atmet in die Tüte, wird noch unruhiger und schiebt sie weg: „Da krieg ich ja gar keine Luft!“' }] },
    { massnahme: 'suizidalitaet-ansprechen', varianten: [
      { wenn: RUHIGER, text: 'Du fragst ruhig und direkt, ob sie daran denkt, sich das Leben zu nehmen. Sie nickt. Seit Tagen. Sie habe Tabletten gesammelt, „die liegen im Kulturbeutel“. Heute nach dem Telefonat sei es „ganz nah“ gewesen. An ihre Schwester und den Kater denke sie aber auch.' },
      { text: 'Sie ringt nach Luft und kann gerade nicht antworten: „Ich … krieg … keine Luft.“' },
    ] },
    { massnahme: 'gefaehrliche-gegenstaende-sichern', varianten: [{ text: 'Du erklärst offen, warum, und bittest sie um den Kulturbeutel. Sie gibt ihn dir nach kurzem Zögern: 14 Tabletten Zopiclon in einem Taschentuch. Zusammen schaut ihr nach Gürtel, Rasierer und Ladekabel.' }] },
    { massnahme: 'trinken-anbieten', varianten: [{ text: 'Sie nimmt ein Glas Wasser und trinkt langsam.' }] },
  ],

  gespraech: [
    { id: 'g-da-sein', frage: 'Sagen, dass du bei ihr bleibst und dass das eine Panikattacke ist, die vorbeigeht', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Sie hält deinen Blick: „Bleiben Sie hier, bitte.“' }],
      wirkung: [{ groesse: 'angst', delta: -0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }], fakten: ['bekannte Panikstörung'] },
    { id: 'g-telefonat', frage: 'Fragen, was heute passiert ist', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ wenn: RUHIGER, text: '„Er hat gesagt, er hat eine Neue und will die Wohnung verkaufen. Ich hab gedacht, jetzt ist alles weg.“ Sie weint. „Manchmal denke ich, es wäre für alle besser, wenn ich nicht mehr da wäre.“' }, { text: 'Sie schüttelt den Kopf und atmet hektisch weiter.' }],
      fakten: ['Telefonat mit Ex-Partner', 'Gedanke, nicht mehr da sein zu wollen'] },
    { id: 'g-halt', frage: 'Nach dem fragen, was sie im Leben hält', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ wenn: RUHIGER, text: '„Meine Schwester … und Mio, mein Kater.“ Sie lächelt kurz.' }, { text: 'Sie kann gerade nicht antworten.' }],
      wirkung: [{ groesse: 'angst', delta: -0.05, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }], fakten: ['Schwester', 'Kater'] },
    // Runde 2 (P14b): Schwester (Schweigepflicht), Kollege Deniz
    { id: 'g-einwilligung-schwester', frage: 'Fragen, ob ihre Schwester informiert und einbezogen werden darf', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      antwort: [
        { wenn: RUHIGER, text: '„Julia? … Ja. Sie soll wissen, wie es mir geht. Aber sie soll nicht in Panik geraten.“', setzt: ['einwilligung-schwester'] },
        { text: 'Sie kann gerade nicht antworten und ringt nach Luft.' },
      ],
      fakten: ['Schwester heißt Julia', 'Frau Keller ist einverstanden'] },
    { id: 'g-schwester-lage', frage: 'Schwester am Telefon: Lage schildern (Krise, Suizidgedanken, Begleitung)', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: SCHWESTER_RUFT,
      schweigepflicht: { erlaubtWenn: { flag: 'einwilligung-schwester' },
        fehlerText: 'Du hast der Schwester Auskunft gegeben, ohne Frau Keller zu fragen. Es gibt keine Schweigepflichtentbindung. Frau Keller ist ansprechbar und in Sicherheit (Begleitung); frag sie zuerst. Ohne Einwilligung bietest du nur an, dass sie zurückruft.' },
      antwort: [
        { wenn: { flag: 'arzt-informiert' }, text: '„Gott sei Dank ist jemand bei ihr. Danke, dass Sie mir das sagen. Ich kann morgen früh kommen, wenn das hilft.“', setzt: ['schwester-informiert'] },
        { text: '„Oh nein … Ist jemand bei ihr? Was passiert jetzt?“', setzt: ['schwester-informiert'] },
      ],
      fakten: ['Schwester wohnt in der Nähe', 'Schwester kann morgen kommen'] },
    { id: 'g-schwester-rueckruf', frage: 'Schwester am Telefon: ohne Einwilligung keine Auskunft, Rückruf anbieten', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: SCHWESTER_RUFT,
      antwort: [{ text: '„Okay … ich verstehe. Sagen Sie ihr bitte, dass ich an sie denke und dass sie mich anrufen soll.“', setzt: ['schwester-rueckruf'] }] },
    { id: 'g-deniz-nacht', frage: 'Mit Deniz die ständige Begleitung für die Nacht planen', an: 'kollegin', kompetenzbereiche: ['III'],
      nurWenn: { getan: 'hilfe-holen' },
      antwort: [
        { wenn: { anordnung: 'an-1zu1' }, text: '„Ich bleibe bis 23 Uhr bei ihr, dann übernimmt Lea aus dem Nachtdienst. Ich trage es in die Übergabe ein. Die Ärztin kommt gleich.“', setzt: ['begleitung-geplant'] },
        { text: '„Ich bleibe erst mal bei ihr. Was sagt die Ärztin? Für die Nacht brauchen wir eine klare Anordnung.“' },
      ] },
  ],

  sbar: [
    { id: 's-suizid', teil: 'S', text: 'Frau Keller, 34, Zimmer 12: nach einer Panikattacke akute Suizidgedanken mit konkretem Plan, Tabletten gesammelt.', art: 'kern', bekanntWenn: PLAN_BEKANNT },
    { id: 's-panik', teil: 'S', text: 'Frau Keller, 34, Zimmer 12, hat eine Panikattacke.', art: 'hilfreich' },
    { id: 'b-depression', teil: 'B', text: 'Seit drei Tagen freiwillig mit schwerer depressiver Episode, bekannte Panikstörung, Sertralin seit zwei Wochen, heute belastendes Telefonat mit dem Ex-Partner.', art: 'kern' },
    { id: 'b-beruf', teil: 'B', text: 'Sie ist Industriekauffrau.', art: 'ablenker' },
    { id: 'a-vital', teil: 'A', text: 'Körperlich: Puls und Atmung waren schnell, Sättigung normal, keine Zeichen einer anderen Ursache. Jetzt ruhiger.', art: 'kern', bekanntWenn: { alle: [{ eine: [{ getan: 'puls-zaehlen' }, { getan: 'pulsoxy-anlegen' }] }, RUHIGER] } },
    { id: 'a-plan', teil: 'A', text: 'Sie denkt seit Tagen an Suizid, hatte 14 Zopiclon im Kulturbeutel, heute „ganz nah“. Schutzfaktoren: Schwester, Kater.', art: 'kern', bekanntWenn: PLAN_BEKANNT },
    { id: 'a-gesichert', teil: 'A', text: 'Tabletten sind gesichert, eine Kollegin ist bei ihr.', art: 'kern', bekanntWenn: { alle: [{ getan: 'gefaehrliche-gegenstaende-sichern' }, BEGLEITET] } },
    { id: 'a-theatralisch', teil: 'A', text: 'Ich glaube, sie will nur Aufmerksamkeit.', art: 'falsch' },
    { id: 'r-kommen', teil: 'R', text: 'Bitte kommen Sie und schätzen Sie die Suizidalität persönlich ein. Bis dahin bleibt jemand ständig bei ihr.', art: 'kern' },
    { id: 'r-bedarf', teil: 'R', text: 'Brauchen wir eine Bedarfsmedikation gegen die Angst?', art: 'hilfreich' },
    // Runde 2: Rückmeldung zum Rückauftrag „Schwester einbeziehen?“
    { id: 'a-schwester-ja', teil: 'A', text: 'Frau Keller ist einverstanden, dass ihre Schwester Julia einbezogen wird.', art: 'hilfreich', bekanntWenn: { flag: 'einwilligung-schwester' } },
  ],

  anordnungen: [
    { id: 'an-lorazepam', massnahme: 'lorazepam-bedarf', text: 'Lorazepam 1 mg als Schmelztablette bei starker Angst, einmalig heute Abend.' },
    { id: 'an-stuendlich', massnahme: 'kontrolle-stuendlich', text: 'Stündliche Sichtkontrolle reicht, sie soll schlafen. Ich sehe sie morgen in der Visite.',
      fehlerhaft: {
        warum: 'Bei Suizidgedanken mit konkretem Plan und gesammelten Mitteln ist eine stündliche Kontrolle zu wenig. Es braucht eine persönliche ärztliche Einschätzung heute und bis dahin ständige Begleitung (1:1).',
        korrektur: 'Ich komme in 15 Minuten und schätze sie selbst ein. Bis dahin bleibt ständig jemand bei ihr.',
        ersatz: 'an-1zu1',
      } },
    { id: 'an-1zu1', massnahme: 'sitzwache', text: 'Ständige Begleitung (1:1) bis zur ärztlichen Einschätzung, Ärztin kommt in 15 Minuten.' },
  ],

  arzt: {
    name: 'Dienstärztin Dr. Lange',
    erreichbar: 'telefon',
    // Runde 2 (P14b): Regeln von genau nach allgemein. Ohne körperliche Einschätzung fragt die Ärztin nach dem Puls zurück.
    // Rückauftrag: Einwilligung für die Schwester erfragen und per Messenger melden. Messenger nach dem ersten Kontakt.
    regeln: [
      { ...R_ANORDNUNG, wenn: { alle: [{ gemeldet: ['a-plan'] }, { eine: [{ gemeldet: ['a-vital'] }, { gemeldet: ['wert:hf'] }] }] } },
      { id: 'r-puls-frage', wenn: { gemeldet: ['a-plan'] },
        antwort: '„Das nehme ich sehr ernst. Sie hatte ja auch eine Panikattacke – ich muss wissen, ob körperlich etwas dahintersteckt.“',
        rueckfrage: { text: '„Wie ist der Puls jetzt?“', erwartet: ['wert:hf'], auftrag: 'af-puls' } },
      { wenn: { gemeldet: ['a-theatralisch'] },
        antwort: '„Hm. Dann beruhigen Sie sie, ich bin gerade in der Notaufnahme gebunden.“', setzt: ['arzt-abgewimmelt'] },
      { wenn: { gemeldet: ['s-panik'] },
        antwort: '„Die Panikattacken kennt sie. Bleiben Sie bei ihr, bei starker Angst Lorazepam 1 mg. Hat sie sonst etwas gesagt?“', anordnungen: ['an-lorazepam'] },
    ],
    auftraege: [
      { id: 'af-puls', text: 'Puls zählen und der Dienstärztin melden', erledigt: { getan: 'puls-zaehlen' }, meldung: ['wert:hf'], meldenBinnenSek: 300,
        folge: [{ ...R_ANORDNUNG, wenn: { gemeldet: ['a-plan'] } }] },
      { id: 'af-schwester', text: 'Frau Keller fragen, ob die Schwester einbezogen werden darf, und der Ärztin schreiben', meldenBinnenSek: 900,
        erledigt: { flag: 'einwilligung-schwester' }, meldung: ['a-schwester-ja'],
        folge: [{ wenn: { ab: 0 }, antwort: '„Danke. Dann rufe ich die Schwester morgen früh an und lade sie zum Gespräch ein.“', setzt: ['schwester-gemeldet'] }] },
    ],
  },

  ereignisse: [
    { id: 'e-andeutung', art: 'patient', wann: { alle: [RUHIGER, { ab: 240 }] },
      text: 'Als ihr Atem ruhiger wird, fängt Frau Keller an zu weinen: „Ich kann so nicht mehr. Manchmal denke ich, es wäre für alle besser, wenn ich nicht mehr da wäre.“' },
    { id: 'e-versprechen', art: 'patient', wann: PLAN_BEKANNT,
      text: 'Sie hält dein Handgelenk fest: „Versprechen Sie mir, dass Sie das niemandem sagen?“',
      bild: { mimik: 'angst' },
      entscheidung: [
        { id: 'w-ehrlich', text: 'Ehrlich sagen: „Das kann ich nicht versprechen, weil ich mir Sorgen um Sie mache. Ich hole Hilfe und bleibe bei Ihnen.“', wertung: 'gut', warum: 'Offenheit schützt die Beziehung; die Schweigepflicht endet, wo Leben in Gefahr ist. Sie erfährt, was passiert.' },
        { id: 'w-versprechen', text: 'Versprechen, nichts zu sagen, damit sie Vertrauen fasst', wertung: 'gefaehrlich', warum: 'Ein solches Versprechen kannst du nicht halten, ohne sie zu gefährden. Später fühlt sie sich verraten.' },
        { id: 'w-ablenken', text: '„Ach, so schlimm wird es schon nicht sein, morgen sieht alles anders aus.“', wertung: 'falsch', warum: 'Bagatellisieren verschließt das Gespräch; sie fühlt sich nicht ernst genommen.' },
      ] },
    { id: 'e-kollege', art: 'team', wann: { getan: 'hilfe-holen' },
      text: 'Pflegefachmann Deniz kommt dazu: „Ich bleibe bei ihr, ruf du die Dienstärztin an.“' },
    { id: 'e-schwester', art: 'telefon', wann: SCHWESTER_RUFT,
      text: 'Das Stationstelefon klingelt. Frau Kellers Schwester Julia: „Meine Schwester hat mir vorhin geschrieben, es tue ihr alles leid. Was ist los bei ihr?“' },
    { id: 'e-aerztin-da', art: 'visite', wann: { alle: [{ flag: 'remonstriert:an-stuendlich' }, { ab: 1500 }] },
      text: 'Dr. Lange ist da und spricht lange mit Frau Keller. Sie bleibt heute Nacht mit ständiger Begleitung, morgen wird das weitere Vorgehen mit ihr besprochen.' },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Roth',
    hilfen: [
      { wenn: { nicht: RUHIGER }, impuls: 'Was braucht sie jetzt als Erstes von dir?', tipp: 'Bleib bei ihr, sprich ruhig und atme mit ihr langsam aus. Keine Tüte.' },
      { wenn: { nicht: { getan: 'suizidalitaet-ansprechen' } }, impuls: 'Sie sagt, es wäre besser, wenn sie nicht mehr da wäre. Was hörst du da heraus?', tipp: 'Frag direkt nach Suizidgedanken, nach Plan und Mitteln. Die Frage löst keine Suizidgedanken aus.' },
      { wenn: { nicht: BEGLEITET }, impuls: 'Darf sie jetzt allein bleiben, während du telefonierst?', tipp: 'Hol Unterstützung, damit immer jemand bei ihr ist.' },
      { wenn: { nicht: { flag: 'remonstriert:an-stuendlich' } }, impuls: 'Passt die Anordnung zu dem, was du weißt?', tipp: 'Konkreter Plan und gesammelte Tabletten: Reicht eine Kontrolle pro Stunde?' },
      { wenn: { auftrag: 'af-puls', status: 'offen' }, impuls: 'Was wollte die Ärztin noch wissen?', tipp: 'Puls zählen und ihr den Wert schicken.' },
      { wenn: { alle: [{ auftrag: 'af-schwester', status: 'offen' }, { nicht: { auftrag: 'af-schwester', status: 'gemeldet' } }] }, impuls: 'Um was hat dich die Ärztin noch gebeten?', tipp: 'Frau Keller fragen, ob ihre Schwester einbezogen werden darf, und der Ärztin die Antwort schreiben.' },
      { impuls: 'Wer muss das noch wissen, und was schreibst du auf?', tipp: 'Schichtleitung informieren und wörtliche Aussagen im Pflegebericht festhalten.' },
    ],
  },
  team: { kollegin: 'Pflegefachmann Deniz (Schichtleitung)', weitere: { angehoerige: 'Schwester Julia (Telefon)' } },

  bewertung: {
    pflicht: [
      { id: 'p-da', text: 'Bei ihr geblieben und beruhigt', gewicht: 2, kompetenzbereiche: ['II'],
        erfuellt: { eine: [{ getan: 'beruhigen-zusprechen' }, { getan: 'frage:g-da-sein' }] }, warum: 'Sicherheit durch Anwesenheit ist die erste Hilfe bei Panik.' },
      { id: 'p-atem', text: 'Ruhig mitgeatmet (Atemanleitung)', gewicht: 2, kompetenzbereiche: ['I', 'V'], erfuellt: RUHIGER,
        warum: 'Langsames Ausatmen unterbricht den Kreislauf aus Hyperventilation und Angst.' },
      { id: 'p-koerper', text: 'Körperliche Werte erhoben (Puls oder Sättigung)', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { eine: [{ getan: 'puls-zaehlen' }, { getan: 'pulsoxy-anlegen' }] }, warum: 'Auch bei bekannter Panikstörung kann eine körperliche Ursache dahinterstecken.' },
      { id: 'p-suizid', text: 'Suizidgedanken direkt angesprochen', gewicht: 3, kompetenzbereiche: ['I', 'II'], erfuellt: PLAN_BEKANNT,
        warum: 'Direktes Fragen entlastet und erhöht das Risiko nicht. Plan und Mittel entscheiden über die Gefährdung.' },
      { id: 'p-nicht-allein', text: 'Sie nicht allein gelassen (Hilfe geholt bzw. Begleitung organisiert)', gewicht: 3, kompetenzbereiche: ['I', 'III'], erfuellt: BEGLEITET,
        warum: 'Bei akuter Suizidalität muss ständig jemand bei ihr sein.' },
      { id: 'p-sichern', text: 'Tabletten und gefährliche Gegenstände gemeinsam gesichert', gewicht: 2, kompetenzbereiche: ['I', 'IV'], erfuellt: { getan: 'gefaehrliche-gegenstaende-sichern' },
        warum: 'Der Zugang zu Mitteln ist ein entscheidender Risikofaktor.' },
      { id: 'p-ehrlich', text: 'Kein Schweigeversprechen gegeben', gewicht: 2, kompetenzbereiche: ['II', 'IV'], erfuellt: { getan: 'wahl:e-versprechen:w-ehrlich' },
        warum: 'Offen sagen, was du weitergibst, erhält Vertrauen und schützt sie.' },
      { id: 'p-arzt', text: 'Dienstärztin mit SBAR informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Akute Suizidalität braucht eine ärztliche Einschätzung noch heute.' },
      { id: 'p-remonstration', text: 'Anordnung „stündliche Kontrolle reicht“ hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-stuendlich' },
        warum: 'Bei konkretem Plan ist eine stündliche Kontrolle zu wenig. Du kennst die Lage am besten und musst das sagen.' },
      { id: 'p-team', text: 'Schichtleitung informiert und Begleitung für die Nacht geplant', gewicht: 1, kompetenzbereiche: ['III'],
        erfuellt: { eine: [{ flag: 'begleitung-geplant' }, { getan: 'pflegefachperson-informieren' }] },
        warum: 'Die Schichtleitung plant die ständige Begleitung für die Nacht.' },
      { id: 'p-doku', text: 'Pflegebericht mit Suizidgedanken, Plan und Mitteln', gewicht: 2, kompetenzbereiche: ['I', 'IV'], erfuellt: { dokumentiert: 'a-plan' },
        warum: 'Wörtliche Aussagen, Plan, Mittel, Maßnahmen und Absprachen müssen nachvollziehbar sein, auch für den Nachtdienst.' },
      { id: 'p-rueckauftrag', text: 'Einwilligung für die Schwester erfragt und der Ärztin gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { auftrag: 'af-schwester', status: 'gemeldet' }, warum: 'Die Ärztin plant das Angehörigengespräch auf deine Rückmeldung (Closed Loop).' },
      { id: 'p-schwester', text: 'Schwester nur mit Einwilligung informiert', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { eine: [{ alle: [{ getan: 'frage:g-schwester-lage' }, { flag: 'einwilligung-schwester' }] }, { getan: 'frage:g-schwester-rueckruf' }] },
        warum: 'Angehörige sind wichtige Schutzfaktoren, aber ohne Einwilligung gibt es keine Auskunft (Schweigepflicht).' },
    ],
    fehler: [
      { id: 'f-tuete', text: 'Tütenatmung angeleitet', schwere: 'mittel', kompetenzbereiche: ['I', 'V'], wenn: { getan: 'tuete-atmen' },
        folge: { text: 'Frau Keller gerät noch mehr in Panik.', wirkung: [{ groesse: 'angst', delta: 0.15, beginnSek: 0, spitzeSek: 30, dauerSek: 600 }] },
        warum: 'Rückatmung in eine Tüte senkt den Sauerstoff und kann bei einer körperlichen Ursache (z. B. Lungenembolie, Asthma) gefährlich sein. Sie wird nicht mehr empfohlen.' },
      { id: 'f-allein', text: 'Zum Telefonieren gegangen, ohne dass jemand bei ihr ist', schwere: 'schwer', kompetenzbereiche: ['I', 'III'],
        wenn: { alle: [{ getan: 'anruf-aerztin' }, PLAN_BEKANNT, { nicht: BEGLEITET }] },
        warum: 'Mit konkretem Plan und Mitteln in Reichweite darf sie nicht allein bleiben.' },
      { id: 'f-versprechen', text: 'Versprochen, nichts weiterzusagen', schwere: 'schwer', kompetenzbereiche: ['II', 'IV'], wenn: { getan: 'wahl:e-versprechen:w-versprechen' },
        warum: 'Bei Lebensgefahr gilt die Schweigepflicht nicht im Team; ein gebrochenes Versprechen zerstört Vertrauen.' },
      { id: 'f-stuendlich', text: 'Nur stündliche Kontrolle umgesetzt, ohne nachzufragen', schwere: 'schwer', kompetenzbereiche: ['III', 'IV'],
        wenn: { alle: [{ getan: 'kontrolle-stuendlich' }, { nicht: { flag: 'remonstriert:an-stuendlich' } }] },
        warum: 'Remonstrieren wäre richtig gewesen: Bei konkretem Plan braucht es ständige Begleitung und eine ärztliche Einschätzung heute.' },
      { id: 'f-fem', text: 'Freiheitsentziehende Maßnahme angewendet', schwere: 'schwer', kompetenzbereiche: ['IV'], wenn: { getan: 'fem-anlegen' },
        warum: 'Eine Fixierung ist hier weder nötig noch erlaubt; sie braucht eine richterliche Genehmigung und ist letztes Mittel bei sonst nicht abwendbarer Gefahr.' },
      { id: 'f-abgewimmelt', text: 'Als „will nur Aufmerksamkeit“ gemeldet', schwere: 'mittel', kompetenzbereiche: ['II', 'IV'], wenn: { flag: 'arzt-abgewimmelt' },
        warum: 'Suizidale Äußerungen sind immer ernst zu nehmen; abwertende Deutungen verhindern Hilfe.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'remonstriert:an-stuendlich' }, { ab: 1500 }, BEGLEITET, { getan: 'pflegebericht' }] },
        text: 'Dr. Lange hat Frau Keller eingeschätzt. Sie bleibt heute Nacht mit ständiger Begleitung, die Tabletten sind gesichert, morgen gibt es ein Gespräch mit ihr und ihrer Schwester.', ausgang: 'stabil' },
      { wenn: { ab: 2700 }, text: 'Die Nacht beginnt, ohne dass die Gefährdung ärztlich eingeschätzt ist.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-suizid', text: 'Akute Suizidgefahr (Gedanken, Plan, gesammelte Mittel)', richtig: true, prioritaet: 1, warum: 'Lebensgefahr, bestimmt Begleitung und Sicherung.' },
      { id: 'pb-angst', text: 'Ausgeprägte Angst mit Panikattacken und Hyperventilation', richtig: true, prioritaet: 1, warum: 'Belastet sie akut und verstärkt die Krise.' },
      { id: 'pb-hoffnung', text: 'Hoffnungslosigkeit bei schwerer Depression und akutem Verlust', richtig: true, prioritaet: 2, warum: 'Verlust nach dem Telefonat ist der Auslöser; Schutzfaktoren stärken.' },
      { id: 'pb-herz', text: 'Akutes Koronarsyndrom', richtig: false, warum: 'Eine medizinische Diagnose, und dafür gibt es hier keinen Hinweis (junge Frau, typische Panikzeichen, Aufnahme-EKG normal).' },
      { id: 'pb-fremd', text: 'Fremdgefährdung', richtig: false, warum: 'Sie ist nicht aggressiv; die Gefahr richtet sich gegen sie selbst.' },
    ],
    ziele: [
      { id: 'z-sicher', text: 'Frau Keller ist bis zur ärztlichen Einschätzung ständig begleitet und hat keinen Zugang zu Tabletten.', passtZu: ['pb-suizid'], richtig: true },
      { id: 'z-atem', text: 'Frau Keller kann die Atemübung anwenden, ihre Angst sinkt spürbar (Selbsteinschätzung).', passtZu: ['pb-angst'], richtig: true },
      { id: 'z-hilfe', text: 'Frau Keller kann sagen, an wen sie sich wendet, wenn die Suizidgedanken stärker werden.', passtZu: ['pb-suizid', 'pb-hoffnung'], richtig: true },
      { id: 'z-vertrag', text: 'Frau Keller verspricht, sich nichts anzutun, und bleibt dann allein im Zimmer.', passtZu: ['pb-suizid'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Panikattacke', text: 'Herzrasen, Atemnot, Brustenge, Kribbeln und Todesangst steigen in Minuten an und klingen meist nach 10–30 Minuten ab. Hilfreich: da bleiben, ruhig sprechen, erklären, langsam mit ihr ausatmen. Keine Tütenatmung. Körperliche Ursachen mitdenken (Puls, Sättigung, Brustschmerz), besonders wenn es anders ist als sonst.', quellen: ['s3-angst'] },
    { titel: 'Suizidalität ansprechen', text: 'Direkt fragen: „Denken Sie daran, sich das Leben zu nehmen?“ Das erhöht das Risiko nicht, es entlastet. Dann nach Plan, Mitteln, Vorbereitungen und nach dem fragen, was sie hält. Aussagen wörtlich dokumentieren.', quellen: ['nvl-depression', 'nice-ng225'] },
    { titel: 'Sicherheit', text: 'Bei Gedanken mit konkretem Plan: nicht allein lassen, Mittel gemeinsam und offen sichern, Team und Ärztin sofort informieren. „Absprachen“ oder Versprechen ersetzen keine Begleitung. Die Schweigepflicht endet, wo Leben in Gefahr ist; sag ihr ehrlich, was du weitergibst.', quellen: ['nvl-depression', 'nice-ng225'] },
    { titel: 'Remonstration', text: 'Wenn eine Anordnung nicht zu dem passt, was du weißt, sagst du das. Bei konkretem Plan und gesammelten Tabletten reicht eine stündliche Kontrolle nicht. Zwang (Fixierung) ist hier keine Lösung: Deeskalation und Begleitung gehen vor.', quellen: ['s3-zwang'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'frage', id: 'g-da-sein' },
      { art: 'massnahme', id: 'beruhigen-zusprechen' },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'massnahme', id: 'atemanleitung-ruhig' },
      { art: 'massnahme', id: 'puls-zaehlen' },
      { art: 'frage', id: 'g-telefonat' },
      { art: 'massnahme', id: 'suizidalitaet-ansprechen' },
      { art: 'frage', id: 'g-halt' },
      { art: 'massnahme', id: 'hilfe-holen' },
      { art: 'massnahme', id: 'gefaehrliche-gegenstaende-sichern' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-suizid', 'b-depression', 'a-vital', 'wert:hf', 'a-plan', 'a-gesichert', 'r-kommen'] },
      { art: 'rueckmelden', anordnung: 'an-lorazepam', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-stuendlich', grund: 'Sie hat einen konkreten Plan und hatte Tabletten gesammelt. Stündlich reicht nicht.' },
      { art: 'rueckmelden', anordnung: 'an-1zu1', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'sitzwache' },
      { art: 'frage', id: 'g-deniz-nacht' },
      { art: 'frage', id: 'g-einwilligung-schwester' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['a-schwester-ja'] },
      { art: 'frage', id: 'g-schwester-lage' },
      { art: 'dokumentieren', bausteine: ['a-plan', 'a-gesichert', 'anordnung:an-1zu1'], freitext: 'Wörtlich: „Heute nach dem Telefonat war es ganz nah.“' },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-suizid', 'pb-angst', 'pb-hoffnung'], ziele: ['z-sicher', 'z-atem', 'z-hilfe'],
        sbar: ['s-suizid', 'b-depression', 'a-vital', 'a-plan', 'a-gesichert'] },
    ],
    unterlassung: { bisSek: 900, erwartet: { wert: 'angst', vergleich: '>', grenze: 0.8 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'lorazepam-bedarf' }], erwartet: 'pa-eingriff' },
  },
};
