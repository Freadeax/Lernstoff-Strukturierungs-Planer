// Pilotfall Spur A · stationäre Langzeitpflege: Bewohnerin mit Demenz isst und trinkt nicht (Schmerz, BESD, FEM abwägen)
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Muster: amb-sturz-exsikkose.ts (Paket P6).

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const MUND_GESEHEN: Bedingung = { getan: 'schleimhaut-pruefen' };
const SCHMERZ_GELINDERT: Bedingung = { wert: 'schmerz', vergleich: '<', grenze: 3 };

// Runde 2 (P14a): Antworten des Hausarztes, auch als Folge der Rückfrage nach der Temperatur
const ANTWORT_SCHMERZ = 'Gut beobachtet, das erklärt einiges. Fieber hat sie nicht, dann gehe ich von den Schmerzen und zu wenig Trinken aus. Prothese draußen lassen, Paracetamol 500 mg bis dreimal täglich, Trinken fördern mit Protokoll. Den Zahnarzt-Hausbesuch organisiere ich. Machen Sie in einer halben Stunde nach dem Schmerzmittel noch einmal die BESD und schicken Sie mir das Ergebnis.';
const REGEL_MIT_GITTER: ArztRegel = {
  id: 'r-schmerz-gitter', wenn: { gemeldet: ['a-besd', 'a-druckstelle', 'a-nachts', 'wert:temp'] },
  antwort: `„${ANTWORT_SCHMERZ} Und wegen der Nächte: Machen Sie das Bettgitter hoch, ich schreibe es an.“`,
  anordnungen: ['an-schmerz', 'an-trinken', 'an-gitter'], setzt: ['arzt-informiert'], auftraege: ['af-besd'],
};
const REGEL_OHNE_GITTER: ArztRegel = {
  id: 'r-schmerz', wenn: { gemeldet: ['a-besd', 'a-druckstelle', 'wert:temp'] },
  antwort: `„${ANTWORT_SCHMERZ}“`, anordnungen: ['an-schmerz', 'an-trinken'], setzt: ['arzt-informiert'], auftraege: ['af-besd'],
};

export const LZ_DEMENZ_SCHMERZ: FallV2 = {
  schema: 2,
  id: 'lz-demenz-schmerz',
  version: '0.2.0',
  spur: 'A',
  setting: 'langzeit',
  altersgruppe: 'hochbetagt',
  titel: '„Sie will einfach nicht mehr essen“',
  kurz: 'Pflegeheim, Frühdienst: 87-Jährige mit fortgeschrittener Demenz lässt das Frühstück stehen, wehrt ab, nachts unruhig.',
  rahmen: 'Du arbeitest im Frühdienst im Wohnbereich 2 eines Pflegeheims, deine Praxisanleitung ist mit dir eingeteilt.',
  lernziele: [
    'Schmerz bei Menschen mit Demenz mit einem Fremdeinschätzungsinstrument (BESD) erkennen, wenn die Selbstauskunft nicht gelingt.',
    'Hinter „isst nicht“ und Abwehr nach Ursachen suchen (Mund, Prothese, Flüssigkeit, Delir).',
    'Validierend und biografieorientiert Beziehung gestalten.',
    'Eine freiheitsentziehende Maßnahme (Bettgitter) als solche erkennen, mildere Mittel wählen und eine Anordnung dazu hinterfragen.',
    'Hausarzt und Betreuerin strukturiert informieren.',
  ],
  lehrplan: { ce: ['ce.09', 'ce.11'], abschnitt: ['ad12', 'ad3'], themen: ['thema.kl.demenz', 'thema.beo.bewusstsein', 'thema.ph.medikamente'] },
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'BESD-Auswertung (5 Items, 0–10, ab 2 Punkten Schmerz möglich) und Durchführung bei Mobilisation/Pflege gegen Originalinstrument prüfen',
      'Rechtslage FEM: Bettgitter bei nicht einwilligungsfähiger Person → Einwilligung der Betreuerin und Genehmigung des Betreuungsgerichts (§ 1831 Abs. 4 BGB); ärztliche Anordnung allein genügt nicht. Formulierung prüfen',
      'Remonstrationspunkt „Bettgitter anordnen“ fachlich und rechtlich prüfen (Werdenfelser Weg, Leitlinie FEM)',
      'Paracetamol 500 mg bis 3× täglich bei 52 kg Hochbetagter als Bedarfsdosis plausibel? (Leberfunktion, Höchstdosis)',
      'Verlauf Exsikkose/Delir im Lernmodell plausibel?',
    ],
  },
  quellen: [
    { id: 'dnqp-schmerz', titel: 'DNQP: Expertenstandard Schmerzmanagement in der Pflege, Aktualisierung 2020' },
    { id: 'besd', titel: 'BESD – Beurteilung von Schmerzen bei Demenz (deutsche Fassung der PAINAD), Basler M. et al. 2006' },
    { id: 'dnqp-demenz', titel: 'DNQP: Expertenstandard Beziehungsgestaltung in der Pflege von Menschen mit Demenz, 2018' },
    { id: 'dnqp-ernaehrung', titel: 'DNQP: Expertenstandard Ernährungsmanagement zur Sicherung und Förderung der oralen Ernährung in der Pflege, 1. Aktualisierung 2017' },
    { id: 'dnqp-sturz', titel: 'DNQP: Expertenstandard Sturzprophylaxe in der Pflege, 2. Aktualisierung 2022' },
    { id: 'bgb-1831', titel: 'BGB § 1831 Freiheitsentziehende Unterbringung und freiheitsentziehende Maßnahmen (seit 1.1.2023)' },
    { id: 'leitlinie-fem', titel: 'Leitlinie FEM – Evidenzbasierte Praxisleitlinie zur Vermeidung von freiheitseinschränkenden Maßnahmen in der beruflichen Altenpflege (Köpke et al., Aktualisierung 2015)' },
  ],

  person: {
    name: 'Frau Brückner',
    alter: { jahre: 87 },
    geschlecht: 'w',
    biografie: ['hat 30 Jahre in einer Gärtnerei gearbeitet, liebt Rosen', 'trank jeden Morgen Milchkaffee aus ihrer Rosentasse', 'Tochter ist gesetzliche Betreuerin (Gesundheitssorge, Aufenthaltsbestimmung)', 'hört gern Schlager'],
    diagnosenBekannt: ['Alzheimer-Demenz, fortgeschritten', 'arterielle Hypertonie', 'Arthrose beider Knie', 'Pflegegrad 4'],
    medikamentePlan: ['Ramipril 2,5 mg 1-0-0', 'Macrogol 1 Beutel bei Bedarf'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Ober- und Unterkieferprothese', 'Brille', 'Rollator (vergisst ihn oft)'],
    gewichtKg: 52,
  },
  medien: {
    raum: '26b_pflegeheim_zimmer_fruehstueck_unberuehrt',
    raumVarianten: [{ wenn: { getan: 'trinken-anbieten' }, raum: '26_pflegeheim_zimmer_tag' }],
  },
  uebernahme: 'Frau Brückner, 87, fortgeschrittene Demenz, Pflegegrad 4. Seit zwei Tagen lässt sie fast alles stehen und trinkt wenig. Beim Waschen heute früh hat sie geschlagen und geschrien. Der Nachtdienst schreibt, sie wollte mehrmals aufstehen und wäre fast gestürzt. Er fragt, ob wir nachts das Bettgitter hochmachen.',
  startUhrzeit: '09:30',

  start: {
    // Leichte Exsikkose und Schmerz (Prothesendruckstelle) treiben ein Delir auf die Demenz.
    grund: {
      hydratation: 0.84, volumen: 0.88, schmerz: 5, orientierung: 0.25, delir: 0.2, unruhe: 0.4, angst: 0.35,
      temperatur: 37.2, blutzucker: 104,
    },
    treiber: [
      { art: 'exsikkose_progressiv', verlustProStunde: 0.012 },
      { art: 'delir_trigger', ausloeser: ['schmerz', 'exsikkose'] },
    ],
    bild: { haltung: 'sitzt', haut: 'trocken', mimik: 'schmerz' },
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'validierend-sprechen', 'beruhigen-zusprechen', 'biografie-erfragen',
    // Beobachten
    'schmerz-nrs', 'schmerz-besd', 'schleimhaut-pruefen', 'hautturgor-pruefen', 'urin-beobachten', 'schlucken-pruefen',
    'delir-screening-4at', 'sturzrisiko-einschaetzen',
    // Akut & Sicherheit
    'sturzprophylaxe-bett', 'fem-anlegen', 'sitzwache',
    // Messen (Pflegetasche)
    'rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'bz-messen', 'kurve-lesen',
    // Versorgen
    'mundpflege', 'trinken-anbieten', 'essen-anreichen', 'koerperpflege', 'schmerzmittel-geben',
    // Melden
    'tochter-informieren', 'pflegefachperson-informieren', 'pflegebericht', 'pflegeplanung-anpassen',
  ],
  massnahmenZusatz: [
    aus('mundpflege', {
      name: 'Prothesen herausnehmen, Mundpflege, Druckstelle schonen', setzt: ['prothese-raus'],
      wirkung: [{ groesse: 'schmerz', delta: -2, beginnSek: 0, spitzeSek: 300, dauerSek: 'dauerhaft' }],
    }),
    aus('trinken-anbieten', {
      name: 'Milchkaffee in ihrer eigenen Tasse anbieten, Trinkprotokoll',
      wirkung: [{ groesse: 'hydratation', delta: 0.05, beginnSek: 0, spitzeSek: 1800, dauerSek: 'dauerhaft' }, { groesse: 'volumen', delta: 0.04, beginnSek: 0, spitzeSek: 1800, dauerSek: 'dauerhaft' }],
    }),
    aus('bedarfsmedikation-oral', {
      id: 'schmerzmittel-geben', name: 'Paracetamol 500 mg als Brausetablette in Saft geben (nach Anordnung)',
      treiber: [{ art: 'wirkstoff', id: 'paracetamol', dosisMg: 500, weg: 'oral' }],   // G1
    }),
  ],

  // Runde 2 (P14a): Heim-Dokumentation (Stammblatt, Trink-/Gewichtsverlauf, Nachtberichte, Betreuung ohne FEM-Genehmigung)
  akte: {
    aufnahmegrund: 'Einzug in den Wohnbereich 2 vor drei Jahren, als die Versorgung zu Hause nicht mehr ging (Hinlauftendenz, Stürze). Vollstationäre Pflege, Pflegegrad 4.',
    anamnese: [
      '30 Jahre Gärtnerin, liebt Rosen und Schlager. Trinkt morgens Milchkaffee aus ihrer Rosentasse.',
      'Spricht in kurzen Sätzen, versteht einfache Aufforderungen. Ober- und Unterkieferprothese seit vielen Jahren, Zahnarzt zuletzt vor zwei Jahren.',
      'Geht mit Rollator, vergisst ihn oft. Sturz ohne Verletzung vor fünf Monaten.',
      'Tochter Monika Brückner ist gesetzliche Betreuerin (Gesundheitssorge, Aufenthaltsbestimmung), besucht sie zweimal pro Woche.',
    ],
    diagnosen: [
      { text: 'Alzheimer-Demenz, fortgeschritten', icd: 'G30.1', seit: '2019' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2004' },
      { text: 'Gonarthrose beidseits', icd: 'M17.0', seit: '2012' },
      { text: 'Chronische Obstipation', icd: 'K59.09', seit: '2021' },
    ],
    medikation: [
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '2,5 mg', form: 'Tbl. (gemörsert in Apfelmus)', schema: '1-0-0-0', zuletzt: 'heute 08:00',
        hinweis: 'Heute früh ausgespuckt (Nachtdienst/Frühdienst-Notiz). Bei wenig Trinken auf niedrigen RR achten.' },
      { id: 'mp-macrogol', wirkstoff: 'Macrogol', staerke: '13,1 g', form: 'Btl.', zuletzt: 'vor 3 Tagen',
        bedarf: { indikation: 'kein Stuhlgang seit 3 Tagen', einzeldosis: '1 Beutel', maxProTag: '2 Gaben' } },
      { id: 'mp-paracetamol', wirkstoff: 'Paracetamol', staerke: '500 mg', form: 'Brausetbl.', massnahme: 'schmerzmittel-geben',
        bedarf: { indikation: 'Schmerz (BESD ab 2)', einzeldosis: '500 mg', maxProTag: '3 Gaben', abstandH: 6 },
        hinweis: 'Neu nach Anordnung des Hausarztes. Bei 52 kg und hohem Alter höchstens 1,5 g am Tag.', geaendertDurch: 'an-schmerz' },
    ],
    vorwerte: [
      { zeit: 'vor 4 Wochen', vorH: 672, werte: { rrSys: 134, rrDia: 76, hf: 74, temp: 36.6, gewicht: 54.5 }, kuerzel: 'SB' },
      { zeit: 'vor 2 Wochen', vorH: 336, werte: { rrSys: 130, rrDia: 74, hf: 76, gewicht: 54.0, schmerz: 1 }, kuerzel: 'SB' },
      { zeit: 'vorgestern', vorH: 49.5, werte: { rrSys: 126, rrDia: 72, hf: 80, temp: 36.9 }, kuerzel: 'JK' },
      { zeit: 'heute 07:30', vorH: 2, werte: { gewicht: 52.0 }, kuerzel: 'ND' },
    ],
    pflegebericht: [
      { zeit: 'vorgestern 12:30', wer: 'JK', text: 'Mittagessen kaum gegessen, schiebt den Teller weg. Hält sich zwischendurch die Wange. Trinkmenge 850 ml.' },
      { zeit: 'gestern 18:00', wer: 'SB', text: 'Abendbrot abgelehnt, nur etwas Tee. Bei der Mundpflege abwehrend, Prothesen nicht herausgenommen (Bewohnerin hat den Mund zugekniffen). Trinkmenge 700 ml.' },
      { zeit: 'heute 03:15', wer: 'ND', text: 'Mehrfach aufgestanden, ruft nach ihrer Mutter, wäre an der Bettkante fast gestürzt. Nachtlicht an, zurück ins Bett begleitet. Frage an Frühdienst: Bettgitter?' },
      { zeit: 'heute 07:45', wer: 'ND', text: 'Beim Waschen geschlagen und geschrien, Gesichtswäsche abgebrochen. Ramipril im Apfelmus ausgespuckt. Gewicht 52,0 kg (vor 4 Wochen 54,5 kg).' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'vor 3 Monaten', wer: 'Dr. Kaiser', text: 'Ramipril 2,5 mg morgens. Macrogol 1 Beutel bei Bedarf. RR einmal pro Woche, Gewicht einmal pro Woche.' },
    ],
    assessments: [
      { name: 'BESD (Ruhe)', wert: '1 von 10', datum: 'vor 2 Wochen', hinweis: 'Ausgangswert ohne Schmerzhinweis.' },
      { name: 'MNA-SF', wert: '7 Punkte (Mangelernährung)', datum: 'vor 2 Wochen', hinweis: 'Gewichtsverlust 2,5 kg in 4 Wochen.' },
      { name: 'Sturzrisiko (Risikofaktoren nach Expertenstandard)', wert: 'hoch', datum: 'vor 1 Monat', hinweis: 'Demenz, Unruhe nachts, Gangunsicherheit, Sturz vor 5 Monaten.' },
      { name: 'Braden-Skala', wert: '15 Punkte (mittleres Risiko)', datum: 'vor 1 Monat' },
      { name: 'Barthel-Index', wert: '25 von 100', datum: 'vor 1 Monat' },
    ],
    labor: [
      { name: 'Natrium', wert: '141', einheit: 'mmol/l', norm: '135–145', datum: 'vor 3 Monaten (Hausarzt)' },
      { name: 'Kreatinin', wert: '0,9', einheit: 'mg/dl', norm: '0,5–1,0', datum: 'vor 3 Monaten (Hausarzt)' },
      { name: 'Hb', wert: '12,1', einheit: 'g/dl', norm: '12–16', datum: 'vor 3 Monaten (Hausarzt)' },
    ],
    bilanzVortag: { einfuhrMl: 700, ausfuhrMl: 500 },
    pflegeplanung: [
      { problem: 'Kann Bedürfnisse (z. B. Schmerz, Durst) nicht sicher mitteilen (Demenz)', ziel: 'Schmerzen und Unwohlsein werden erkannt', massnahmen: ['BESD bei Verhaltensänderung', 'Biografie nutzen (Rosen, Schlager)', 'Ruhige, validierende Ansprache'] },
      { problem: 'Gefahr von Flüssigkeitsdefizit und Mangelernährung', ziel: 'Trinkt mindestens 1300 ml, Gewicht stabil', massnahmen: ['Milchkaffee in der Rosentasse', 'Trinkprotokoll', 'Fingerfood anbieten'] },
      { problem: 'Erhöhtes Sturzrisiko nachts', ziel: 'Bleibt ohne freiheitsentziehende Maßnahmen sturzfrei', massnahmen: ['Niedrigbett prüfen', 'Nachtlicht', 'Toilettengang vor dem Schlafen'] },
    ],
    rechtliches: [
      'Gesetzliche Betreuung: Tochter Monika Brückner (Gesundheitssorge, Aufenthaltsbestimmung). Auskunft an die Betreuerin.',
      'Keine Genehmigung des Betreuungsgerichts für freiheitsentziehende Maßnahmen.',
      'Patientenverfügung: keine Ernährung über eine Magensonde, keine Krankenhauseinweisung, wenn vermeidbar.',
      'Andere Angehörige (z. B. Enkel) erhalten Auskunft nur über die Betreuerin.',
    ],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Du setzt dich auf Augenhöhe, nennst deinen Namen und berührst kurz ihren Unterarm. Sie schaut dich misstrauisch an, zieht den Arm aber nicht weg.' }] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'Sie schaut dich fragend an und sagt „Ja, ja“. Eine Zahl kann sie nicht nennen. Bei fortgeschrittener Demenz gelingt die Selbsteinschätzung oft nicht.' }] },
    { massnahme: 'schmerz-besd', varianten: [
      { wenn: SCHMERZ_GELINDERT, text: 'BESD jetzt 2 von 10: Atmung ruhig, kein Stöhnen, Gesicht entspannter, lässt sich berühren.' },
      { text: 'BESD beim Versuch, ihr das Gesicht zu waschen: Atmung angestrengt (1), stöhnt und jammert (1), verzerrtes Gesicht (2), wehrt ab und hält die Hand vor den Mund (2), lässt sich kaum trösten (1) = 7 von 10. Schmerz ist wahrscheinlich.' },
    ] },
    { massnahme: 'schleimhaut-pruefen', varianten: [{ text: 'Nach Ermunterung öffnet sie den Mund. Unter der Unterkieferprothese links eine gerötete, offene Druckstelle, etwa 5 mm. Zunge trocken und belegt.' }] },
    { massnahme: 'hautturgor-pruefen', varianten: [{ text: 'Hautfalte am Handrücken bleibt stehen. Im Alter allein wenig aussagekräftig.' }] },
    { massnahme: 'urin-beobachten', varianten: [{ text: 'Inkontinenzeinlage seit dem Morgen kaum nass, Urin dunkel und stark riechend.' }] },
    { massnahme: 'schlucken-pruefen', varianten: [{ text: 'Kleine Schlucke Wasser ohne Husten, die Stimme bleibt klar.' }] },
    { massnahme: 'delir-screening-4at', varianten: [{ text: 'Bei bekannter Demenz schwer zu deuten. Laut Team seit drei Tagen abwechselnd unruhiger und schläfriger als sonst: Verdacht auf ein Delir zusätzlich zur Demenz.' }] },
    { massnahme: 'sturzrisiko-einschaetzen', varianten: [{ text: 'Sturzrisiko hoch: Demenz, nächtliche Unruhe, wenig getrunken, unsicherer Gang, vergisst den Rollator, ein Sturz vor fünf Monaten.' }] },
    { massnahme: 'sturzprophylaxe-bett', varianten: [{ text: 'Bett auf die niedrigste Stufe, Sturzmatte davor, Nachtlicht an, Klingel und Wasserglas in Reichweite. Die Schichtleitung plant häufigere Kontrollgänge in der Nacht.' }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Trinkprotokoll: gestern 700 ml, vorgestern 850 ml, sonst um 1300 ml. Essen: seit zwei Tagen kaum etwas. Zahnarzt zuletzt vor zwei Jahren. Nachtdienst: „Mehrfach aufgestanden, fast gestürzt. Bettgitter?“ Betreuerin: Tochter (Gesundheitssorge, Aufenthaltsbestimmung).' }] },
    { massnahme: 'mundpflege', varianten: [{ text: 'Du nimmst beide Prothesen vorsichtig heraus, reinigst sie und den Mund. An der Druckstelle zuckt sie zusammen. Die Prothesen bleiben in der Dose, bis der Zahnarzt sie angesehen hat.' }] },
    { massnahme: 'trinken-anbieten', varianten: [{ text: 'Aus dem Schnabelbecher nimmt sie nur kleine Schlucke. Milchkaffee in ihrer Rosentasse trinkt sie zur Hälfte. Trinkprotokoll begonnen.' }] },
    { massnahme: 'essen-anreichen', varianten: [
      { wenn: { flag: 'prothese-raus' }, text: 'Ohne Prothese isst sie einige Löffel Grießbrei, aufrecht sitzend, in Ruhe.' },
      { text: 'Sie presst die Lippen zusammen, dreht den Kopf weg und spuckt den Bissen aus.' },
    ] },
    { massnahme: 'koerperpflege', varianten: [
      { wenn: SCHMERZ_GELINDERT, text: 'Mit Schlagermusik und in Ruhe lässt sie sich Gesicht und Hände waschen.' },
      { text: 'Sie schreit, schlägt nach deiner Hand und hält sich die Wange.' },
    ] },
  ],

  gespraech: [
    { id: 'g-rosen', frage: 'Über ihre Rosen sprechen (Biografie)', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Sie lächelt kurz: „Die Rosen müssen geschnitten werden, sonst wird das nichts.“' }],
      wirkung: [{ groesse: 'angst', delta: -0.15, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }], fakten: ['Gärtnerei', 'Rosen'] },
    { id: 'g-weh', frage: 'Fragen, ob ihr etwas wehtut, und dabei auf ihre Hände achten', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ wenn: SCHMERZ_GELINDERT, text: '„Jetzt geht’s.“' }, { text: 'Sie greift sich an die linke Wange: „Da … da beißt was.“' }], fakten: ['zeigt auf linke Wange'] },
    // Runde 2 (P14a): Betreuerin, Wohnbereichsleitung, Enkel (Schweigepflicht)
    { id: 'g-tochter-lage', frage: 'Tochter (Betreuerin) anrufen: Schmerz, Druckstelle, Anordnungen und warum kein Bettgitter', an: 'betreuer', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      antwort: [
        { wenn: { flag: 'remonstriert:an-gitter' }, text: '„Danke, dass Sie mir das so erklären. Dann lieber das niedrige Bett, ich will ja nicht, dass sie eingesperrt ist. Ich komme heute Nachmittag zum Gespräch.“', setzt: ['betreuerin-informiert'] },
        { text: '„Schmerzen im Mund? Das hätte ich nie gedacht. Und was ist jetzt mit dem Gitter für die Nacht?“', setzt: ['betreuerin-informiert'] },
      ],
      fakten: ['Tochter ist Betreuerin', 'kommt heute Nachmittag'] },
    { id: 'g-wbl', frage: 'Sabine (Wohnbereichsleitung) über die Nächte und die hinterfragte Bettgitter-Anordnung informieren', an: 'kollegin', kompetenzbereiche: ['III', 'IV'],
      antwort: [{ text: '„Gut, dass du nachgefragt hast. Ich plane die Nachtkontrollen um und lade die Tochter zur Fallbesprechung ein.“', setzt: ['wbl-informiert'] }] },
    { id: 'g-enkel-auskunft', frage: 'Dem Enkel erzählen, was mit seiner Oma los ist', an: 'angehoerige', kanal: 'telefon', nurWenn: { ab: 1500 }, kompetenzbereiche: ['II', 'IV'],
      schweigepflicht: { erlaubtWenn: { flag: 'enkel-auskunftsberechtigt' },
        fehlerText: 'Der Enkel ist weder Betreuer noch bevollmächtigt. Auskünfte über die Gesundheit gibt es nur an die Betreuerin oder mit deren Einverständnis. Freundlich an die Tochter verweisen.' },
      antwort: [{ text: '„Ach so, danke. Dann sag ich das gleich meiner Mutter.“' }] },
    { id: 'g-enkel-verweisen', frage: 'Freundlich erklären, dass du am Telefon keine Auskunft geben darfst, und an die Tochter verweisen', an: 'angehoerige', kanal: 'telefon', nurWenn: { ab: 1500 }, kompetenzbereiche: ['II', 'IV'],
      antwort: [{ text: '„Verstehe ich. Dann rufe ich meine Mutter an. Grüßen Sie die Oma von mir.“' }] },
  ],

  sbar: [
    { id: 's-isst-nicht', teil: 'S', text: 'Frau Brückner, 87, Pflegegrad 4: isst seit zwei Tagen fast nichts, trinkt wenig und wehrt bei der Pflege ab.', art: 'kern' },
    { id: 's-schwierig', teil: 'S', text: 'Frau Brückner ist seit Tagen schwierig.', art: 'ablenker' },
    { id: 'b-demenz', teil: 'B', text: 'Fortgeschrittene Alzheimer-Demenz, Ober- und Unterkieferprothese, Ramipril. Trinkt sonst um 1300 ml, gestern deutlich weniger.', art: 'kern' },
    { id: 'b-gaertnerei', teil: 'B', text: 'Sie hat früher in einer Gärtnerei gearbeitet.', art: 'ablenker' },
    { id: 'a-besd', teil: 'A', text: 'BESD deutlich erhöht: Schmerz wahrscheinlich, sie zeigt auf die linke Wange.', art: 'kern', bekanntWenn: { getan: 'schmerz-besd' } },
    { id: 'a-druckstelle', teil: 'A', text: 'Offene Druckstelle unter der Unterkieferprothese links.', art: 'kern', bekanntWenn: MUND_GESEHEN },
    { id: 'a-exsikkose', teil: 'A', text: 'Zunge trocken, wenig dunkler Urin: beginnender Flüssigkeitsmangel.', art: 'kern', bekanntWenn: { alle: [MUND_GESEHEN, { eine: [{ getan: 'urin-beobachten' }, { getan: 'kurve-lesen' }] }] } },
    { id: 'a-nachts', teil: 'A', text: 'Nachts unruhig, wollte mehrfach aufstehen, wäre fast gestürzt.', art: 'kern', bekanntWenn: { getan: 'kurve-lesen' } },
    { id: 'a-demenz', teil: 'A', text: 'Das ist wohl einfach ihre Demenz, die schreitet halt fort.', art: 'falsch' },
    { id: 'r-schmerz-zahnarzt', teil: 'R', text: 'Bitte um ein Schmerzmittel und einen Zahnarzt-Hausbesuch. Darf die Prothese bis dahin draußen bleiben?', art: 'kern' },
    { id: 'r-gitter', teil: 'R', text: 'Können Sie für die Nacht ein Bettgitter anordnen?', art: 'falsch' },
  ],

  anordnungen: [
    { id: 'an-schmerz', massnahme: 'schmerzmittel-geben', text: 'Paracetamol 500 mg oral bis 3× täglich bei Schmerz (BESD ab 2), Prothese bis zum Zahnarzt draußen lassen.' },
    { id: 'an-trinken', massnahme: 'trinken-anbieten', text: 'Trinken fördern, Ziel 1300 ml am Tag, Trinkprotokoll; bei unter 1000 ml bis morgen Rückmeldung.' },
    { id: 'an-gitter', massnahme: 'fem-anlegen', text: 'Nachts Bettgitter beidseits hoch, damit sie nicht fällt.',
      fehlerhaft: {
        warum: 'Ein Bettgitter bei einer Person, die nicht selbst einwilligen kann, ist eine freiheitsentziehende Maßnahme. Sie braucht die Einwilligung der Betreuerin und die Genehmigung des Betreuungsgerichts (§ 1831 BGB). Eine ärztliche Anordnung genügt nicht. Zudem erhöht ein Gitter die Fallhöhe, mildere Mittel gehen vor.',
        korrektur: 'Kein Bettgitter. Niedrigbett und Sturzmatte, Schmerzen behandeln, und Sie besprechen die Nächte mit der Tochter als Betreuerin.',
        ersatz: 'an-niedrigbett',
      } },
    { id: 'an-niedrigbett', massnahme: 'sturzprophylaxe-bett', text: 'Niedrigbett und Sturzmatte, Nachtlicht, häufigere Kontrollgänge; Fallbesprechung mit der Betreuerin.' },
  ],

  arzt: {
    name: 'Hausarzt Dr. Kaiser',
    erreichbar: 'hausarzt-praxis',
    // Runde 2 (P14a): genau → allgemein. Ohne Temperatur fragt der Hausarzt zurück (Infekt als Delir-Ursache ausschließen),
    // Rückauftrag BESD-Kontrolle nach dem Schmerzmittel. Nach dem ersten Kontakt geht auch der Praxis-Messenger.
    regeln: [
      REGEL_MIT_GITTER,
      REGEL_OHNE_GITTER,
      { id: 'r-temp-frage', wenn: { gemeldet: ['a-besd', 'a-druckstelle'] },
        antwort: '„Gut beobachtet. Bevor ich etwas anordne: Wenn sie unruhig ist und wenig trinkt, will ich einen Infekt ausschließen.“',
        rueckfrage: { text: '„Hat sie Fieber?“', erwartet: ['wert:temp'], auftrag: 'af-temp' } },
      { wenn: { gemeldet: ['a-demenz'] },
        antwort: '„Das ist bei ihrer Demenz leider der Verlauf. Bieten Sie weiter an, ich komme Donnerstag zur Visite.“', setzt: ['arzt-beruhigt'] },
      { wenn: { gemeldet: ['s-isst-nicht'] },
        antwort: '„Hat sie Schmerzen? Haben Sie in den Mund geschaut? Melden Sie sich mit genaueren Beobachtungen wieder.“' },
    ],
    auftraege: [
      { id: 'af-temp', text: 'Temperatur messen und dem Hausarzt melden', erledigt: { getan: 'temperatur-ohr' }, meldung: ['wert:temp'], meldenBinnenSek: 600,
        folge: [REGEL_MIT_GITTER, REGEL_OHNE_GITTER] },
      { id: 'af-besd', text: 'Eine halbe Stunde nach dem Schmerzmittel BESD wiederholen und dem Hausarzt schicken', erledigt: { alle: [{ getan: 'schmerzmittel-geben' }, { getan: 'schmerz-besd' }] },
        meldung: ['wert:schmerz'], meldenBinnenSek: 2400,
        folge: [
          { wenn: SCHMERZ_GELINDERT, antwort: '„Sehr gut, dann wirkt es. So weitermachen, der Zahnarzt kommt morgen Vormittag.“', setzt: ['besd-rueckmeldung'] },
          { wenn: { ab: 0 }, antwort: '„Noch nicht gut genug. Prothese bleibt draußen, nächste Gabe frühestens nach sechs Stunden. Melden Sie sich, wenn sie weiter abwehrt, dann komme ich heute noch.“', setzt: ['besd-rueckmeldung'] },
        ] },
    ],
  },

  ereignisse: [
    { id: 'e-tochter', art: 'angehoerige', wann: { ab: 360 },
      text: 'Die Tochter ruft an: „Der Nachtdienst sagt, Mama wäre fast gefallen. Machen Sie doch nachts das Gitter hoch, ich bin einverstanden.“',
      entscheidung: [
        { id: 'w-erklaeren', text: 'Sorge ernst nehmen, erklären, dass ein Gitter die Fallhöhe erhöht und eine freiheitsentziehende Maßnahme ist, Alternativen nennen und ein Gespräch mit der Wohnbereichsleitung anbieten', wertung: 'gut', warum: 'Angehörige einbeziehen und informieren; FEM sind nur letztes Mittel und brauchen eine gerichtliche Genehmigung.' },
        { id: 'w-zusagen', text: 'Zusagen, dass das Gitter nachts hochkommt, weil die Tochter einverstanden ist', wertung: 'falsch', warum: 'Die Einwilligung der Betreuerin allein reicht bei einer regelmäßigen FEM nicht, das Betreuungsgericht muss genehmigen. Als Auszubildende kannst du das nicht zusagen.' },
        { id: 'w-abwimmeln', text: '„Dafür bin ich nicht zuständig“ sagen und auflegen', wertung: 'vertretbar', warum: 'Weiterleiten ist richtig, aber die Tochter braucht eine freundliche Erklärung und einen Ansprechpartner.' },
      ] },
    { id: 'e-enkel', art: 'telefon', wann: { ab: 1500 },
      text: 'Das Telefon im Dienstzimmer: „Hier ist Kevin, der Enkel von Frau Brückner. Meine Mutter sagt, die Oma wäre fast gestürzt. Was ist denn los mit ihr?“' },
    { id: 'e-unruhe', art: 'patient', wann: { alle: [{ ab: 900 }, { nicht: { getan: 'validierend-sprechen' } }] },
      text: 'Frau Brückner steht ohne Rollator auf und will „in die Gärtnerei“. Sie schwankt.',
      bild: { haltung: 'unruhig', mimik: 'verwirrt' },
      entscheidung: [
        { id: 'w-begleiten', text: 'Sie ein Stück begleiten, auf das Thema eingehen („Die Rosen warten“) und mit Rollator zum Sessel führen', wertung: 'gut', warum: 'Validation nimmt das Anliegen ernst, Begleiten senkt das Sturzrisiko ohne Zwang.' },
        { id: 'w-zuruecksetzen', text: 'Sie an den Schultern zurück in den Sessel setzen', wertung: 'gefaehrlich', warum: 'Körperlicher Zwang verstärkt Angst und Abwehr und kann eine Freiheitsentziehung sein.' },
      ] },
  ],

  pa: {
    name: 'Praxisanleiter Herr Brandl',
    hilfen: [
      { wenn: { nicht: { getan: 'schmerz-besd' } }, impuls: 'Wie findest du heraus, ob sie Schmerzen hat, wenn sie es nicht sagen kann?', tipp: 'Nimm ein Fremdeinschätzungsinstrument für Menschen mit Demenz, zum Beispiel BESD.' },
      { wenn: { nicht: MUND_GESEHEN }, impuls: 'Sie isst nicht und hält sich die Wange. Wo würdest du nachsehen?', tipp: 'Schau mit ihrem Einverständnis in den Mund, auch unter die Prothesen.' },
      { wenn: { auftrag: 'af-temp', status: 'offen' }, impuls: 'Was wollte der Hausarzt noch wissen?', tipp: 'Temperatur messen und ihm den Wert schicken.' },
      { wenn: { alle: [{ auftrag: 'af-besd', status: 'offen' }, { nicht: { auftrag: 'af-besd', status: 'gemeldet' } }] }, impuls: 'Hat der Hausarzt dir noch etwas aufgetragen?', tipp: 'Eine halbe Stunde nach dem Schmerzmittel noch einmal die BESD erheben und ihm schicken.' },
      { wenn: { nicht: { getan: 'sturzprophylaxe-bett' } }, impuls: 'Was kann nachts helfen, ohne sie einzusperren?', tipp: 'Niedrigbett, Sturzmatte, Licht, Klingel in Reichweite. Und an die Ursache denken.' },
      { impuls: 'Wer muss von deinen Beobachtungen wissen?', tipp: 'Hausarzt, Tochter als Betreuerin und die Wohnbereichsleitung. Und alles in den Pflegebericht.' },
    ],
  },
  team: { kollegin: 'Pflegefachfrau Sabine (Wohnbereichsleitung)', weitere: { betreuer: 'Tochter Monika Brückner (Betreuerin)', angehoerige: 'Enkel Kevin (Telefon)' } },

  bewertung: {
    pflicht: [
      { id: 'p-besd', text: 'Schmerz mit BESD eingeschätzt', gewicht: 3, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'schmerz-besd' },
        warum: 'Menschen mit fortgeschrittener Demenz können Schmerz oft nicht benennen. Abwehr und Nahrungsverweigerung sind häufige Schmerzzeichen.' },
      { id: 'p-mund', text: 'Mund und Prothesensitz angesehen', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: MUND_GESEHEN,
        warum: 'Druckstellen, Pilzinfektion oder schlecht sitzende Prothesen sind eine häufige, behandelbare Ursache für „isst nicht“.' },
      { id: 'p-validation', text: 'Validierend und biografieorientiert auf sie eingegangen', gewicht: 2, kompetenzbereiche: ['II'],
        erfuellt: { eine: [{ getan: 'validierend-sprechen' }, { getan: 'frage:g-rosen' }] }, warum: 'Expertenstandard Beziehungsgestaltung: Person-zentriert handeln senkt Angst und Abwehr.' },
      { id: 'p-trinken', text: 'Trinken angeboten und Protokoll begonnen', gewicht: 2, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'trinken-anbieten' },
        warum: 'Gewohnte Getränke aus der eigenen Tasse fördern die Aufnahme.' },
      { id: 'p-arzt', text: 'Hausarzt mit Schmerzzeichen und Befund im Mund informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Nur mit konkreten Beobachtungen kann der Arzt Schmerztherapie und Zahnarzt veranlassen.' },
      { id: 'p-remonstration', text: 'Anordnung „Bettgitter“ hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-gitter' },
        warum: 'Eine FEM braucht Einwilligung und gerichtliche Genehmigung; mildere Mittel gehen vor. Durchführungsverantwortung heißt nachfragen.' },
      { id: 'p-sturz', text: 'Mildere Sturzprophylaxe umgesetzt (Niedrigbett, Sturzmatte)', gewicht: 2, kompetenzbereiche: ['I', 'IV', 'V'], erfuellt: { getan: 'sturzprophylaxe-bett' },
        warum: 'Expertenstandard Sturzprophylaxe und Leitlinie FEM: Alternativen zu Gittern und Gurten nutzen.' },
      { id: 'p-schmerzmittel', text: 'Schmerzmittel nach rückgelesener Anordnung gegeben', gewicht: 2, kompetenzbereiche: ['I', 'III'],
        erfuellt: { alle: [{ anordnung: 'an-schmerz', rueckgelesen: true }, { getan: 'schmerzmittel-geben' }] }, warum: 'Schmerz behandeln ist die eigentliche Lösung für Abwehr, Unruhe und Nahrungsverweigerung.' },
      { id: 'p-tochter', text: 'Tochter (Betreuerin) informiert', gewicht: 1, kompetenzbereiche: ['II', 'IV'], erfuellt: { eine: [{ getan: 'tochter-informieren' }, { flag: 'betreuerin-informiert' }] },
        warum: 'Die Betreuerin entscheidet in der Gesundheitssorge mit und kennt Gewohnheiten.' },
      { id: 'p-rueckauftrag', text: 'Rückauftrag des Hausarztes erledigt und gemeldet (BESD nach dem Schmerzmittel)', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { auftrag: 'af-besd', status: 'gemeldet' }, warum: 'Ob das Schmerzmittel wirkt, sieht der Hausarzt nur über deine erneute Einschätzung (Closed Loop).' },
      { id: 'p-wbl', text: 'Wohnbereichsleitung über die Nächte und die hinterfragte Anordnung informiert', gewicht: 1, kompetenzbereiche: ['III'],
        erfuellt: { eine: [{ getan: 'pflegefachperson-informieren' }, { getan: 'frage:g-wbl' }] }, warum: 'Die verantwortliche Pflegefachperson plant die Nächte und die Fallbesprechung.' },
      { id: 'p-doku', text: 'Pflegebericht mit BESD-Wert und der hinterfragten Anordnung geschrieben', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ getan: 'pflegebericht' }, { dokumentiert: 'wert:schmerz' }, { dokumentiert: 'anordnung:an-gitter' }] },
        warum: 'BESD-Wert, Befund, Anordnungen und die Remonstration (warum kein Bettgitter) müssen nachvollziehbar sein.' },
    ],
    fehler: [
      { id: 'f-fem', text: 'Bettgitter ohne Genehmigung hochgezogen', schwere: 'schwer', kompetenzbereiche: ['IV'], wenn: { getan: 'fem-anlegen' },
        folge: { text: 'Nachts klettert Frau Brückner über das Gitter.', wirkung: [{ groesse: 'angst', delta: 0.3, beginnSek: 0, spitzeSek: 60, dauerSek: 3600 }] },
        warum: 'Freiheitsentziehung ohne Genehmigung ist rechtswidrig, und Gitter erhöhen die Sturzhöhe. Sie sind letztes Mittel nach Prüfung von Alternativen.' },
      { id: 'f-essen-zwang', text: 'Essen angereicht, bevor die Ursache im Mund geklärt war', schwere: 'mittel', kompetenzbereiche: ['I', 'V'],
        wenn: { alle: [{ getan: 'essen-anreichen' }, { nicht: { flag: 'prothese-raus' } }] },
        warum: 'Wer bei Abwehr weiter anreicht, übergeht ein Signal und riskiert Aspiration und Vertrauensverlust.' },
      { id: 'f-pflege-zwang', text: 'Körperpflege gegen Abwehr durchgezogen, ohne Schmerz einzuschätzen', schwere: 'leicht', kompetenzbereiche: ['I', 'II'],
        wenn: { alle: [{ getan: 'koerperpflege' }, { nicht: { getan: 'schmerz-besd' } }] },
        warum: 'Abwehr ist eine Botschaft. Erst Ursache suchen, Pflege notfalls verschieben.' },
      { id: 'f-demenz', text: 'Veränderung als „Fortschreiten der Demenz“ gemeldet', schwere: 'mittel', kompetenzbereiche: ['I', 'II'], wenn: { flag: 'arzt-beruhigt' },
        warum: 'Eine plötzliche Veränderung hat bei Demenz meist eine behandelbare Ursache (Schmerz, Delir, Exsikkose).' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { getan: 'sturzprophylaxe-bett' }, { getan: 'pflegebericht' }, { flag: 'besd-rueckmeldung' }] },
        text: 'Frau Brückner sitzt mit ihrer Rosentasse im Sessel, die Prothesen liegen in der Dose. Der Zahnarzt kommt morgen, die Tochter kommt am Nachmittag zum Gespräch.', ausgang: 'stabil' },
      { wenn: { ab: 2700 }, text: 'Der Vormittag ist vorbei. Frau Brückner hat kaum getrunken und ist unruhiger geworden.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-schmerz', text: 'Akuter Schmerz im Mund (Prothesendruckstelle), zeigt sich als Abwehr und Unruhe', richtig: true, prioritaet: 1, warum: 'Ursache für Nahrungsverweigerung und Abwehr.' },
      { id: 'pb-ernaehrung', text: 'Gefahr von Flüssigkeitsdefizit und Mangelernährung', richtig: true, prioritaet: 1, warum: 'Trinkmenge deutlich unter dem Gewohnten, zwei Tage kaum gegessen.' },
      { id: 'pb-sturz', text: 'Erhöhtes Sturzrisiko nachts', richtig: true, prioritaet: 2, warum: 'Unruhe, Exsikkose, unsicherer Gang.' },
      { id: 'pb-delir', text: 'Verdacht auf Delir zusätzlich zur Demenz', richtig: true, prioritaet: 2, warum: 'Wechselnde Unruhe und Schläfrigkeit seit drei Tagen.' },
      { id: 'pb-verhalten', text: 'Aggressives Verhalten als Teil ihrer Persönlichkeit', richtig: false, warum: 'Die Abwehr ist neu und hat eine Ursache.' },
      { id: 'pb-dekubitus', text: 'Dekubitus Kategorie 2 am Steiß', richtig: false, warum: 'Dafür gibt es keinen Befund.' },
    ],
    ziele: [
      { id: 'z-besd', text: 'BESD liegt in Ruhe und bei der Pflege innerhalb von 24 h unter 2.', passtZu: ['pb-schmerz'], richtig: true },
      { id: 'z-trinken', text: 'Frau Brückner trinkt ab heute mindestens 1300 ml am Tag (Protokoll).', passtZu: ['pb-ernaehrung'], richtig: true },
      { id: 'z-sturz', text: 'Frau Brückner stürzt nachts nicht, ohne freiheitsentziehende Maßnahme.', passtZu: ['pb-sturz'], richtig: true },
      { id: 'z-gitter', text: 'Frau Brückner bleibt nachts mit Bettgitter im Bett.', passtZu: ['pb-sturz'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Schmerz bei Demenz', text: 'Menschen mit fortgeschrittener Demenz können Schmerzen oft nicht benennen oder auf einer Skala einordnen. Schmerz zeigt sich dann als Abwehr, Schreien, Unruhe, Rückzug oder Nahrungsverweigerung. Fremdeinschätzung mit BESD (Atmung, Laute, Gesicht, Körpersprache, Trost) in Ruhe und bei Bewegung oder Pflege; ab 2 von 10 ist Schmerz möglich.', quellen: ['dnqp-schmerz', 'besd'] },
    { titel: 'Isst nicht, trinkt nicht', text: 'Vor „will nicht“ kommt „kann nicht“: Mund und Prothesen ansehen, Schluckfähigkeit prüfen, Gewohnheiten nutzen (eigene Tasse, Lieblingsgetränk), Trinkprotokoll führen. Flüssigkeitsmangel verstärkt Verwirrtheit und Sturzrisiko.', quellen: ['dnqp-ernaehrung'] },
    { titel: 'Beziehung gestalten', text: 'Person-zentriert handeln heißt: Gefühle und Anliegen ernst nehmen (Validation), Biografie nutzen, nicht korrigieren und nicht drängen.', quellen: ['dnqp-demenz'] },
    { titel: 'Freiheitsentziehende Maßnahmen', text: 'Bettgitter, Gurte oder abgeschlossene Türen sind FEM, wenn die Person sich nicht selbst befreien kann oder will. Bei einer Person, die nicht einwilligen kann, braucht es die Einwilligung der Betreuerin und die Genehmigung des Betreuungsgerichts (§ 1831 BGB). Eine ärztliche Anordnung allein reicht nicht. FEM verhindern Stürze nicht sicher und verursachen schwere Verletzungen. Alternativen: Niedrigbett, Sturzmatte, Licht, Hüftprotektor, Ursachen behandeln.', quellen: ['bgb-1831', 'leitlinie-fem', 'dnqp-sturz'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'frage', id: 'g-rosen' },
      { art: 'massnahme', id: 'validierend-sprechen' },
      { art: 'frage', id: 'g-weh' },
      { art: 'massnahme', id: 'schmerz-besd' },
      { art: 'massnahme', id: 'schleimhaut-pruefen' },
      { art: 'massnahme', id: 'mundpflege' },
      { art: 'massnahme', id: 'trinken-anbieten' },
      { art: 'massnahme', id: 'urin-beobachten' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'pflegetasche', geraet: 'rr-geraet' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'puls-zaehlen' },
      { art: 'pflegetasche', geraet: 'thermometer' },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-isst-nicht', 'b-demenz', 'a-besd', 'a-druckstelle', 'a-exsikkose', 'a-nachts', 'wert:temp', 'r-schmerz-zahnarzt'] },
      { art: 'rueckmelden', anordnung: 'an-schmerz', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-trinken', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-gitter', grund: 'Bettgitter ist eine freiheitsentziehende Maßnahme, dafür braucht es die Genehmigung des Betreuungsgerichts.' },
      { art: 'rueckmelden', anordnung: 'an-niedrigbett', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'schmerzmittel-geben' },
      { art: 'massnahme', id: 'sturzprophylaxe-bett' },
      { art: 'frage', id: 'g-wbl' },
      { art: 'frage', id: 'g-tochter-lage' },
      { art: 'warten', sek: 900 },
      { art: 'frage', id: 'g-enkel-verweisen' },
      { art: 'massnahme', id: 'schmerz-besd' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:schmerz'] },
      { art: 'dokumentieren', bausteine: ['wert:schmerz', 'a-druckstelle', 'anordnung:an-schmerz', 'anordnung:an-gitter', 'anordnung:an-niedrigbett'] },
      { art: 'warten', sek: 60 },
      { art: 'abschluss', probleme: ['pb-schmerz', 'pb-ernaehrung', 'pb-sturz', 'pb-delir'], ziele: ['z-besd', 'z-trinken', 'z-sturz'],
        sbar: ['s-isst-nicht', 'b-demenz', 'a-besd', 'a-druckstelle', 'a-exsikkose', 'a-nachts'] },
    ],
    unterlassung: { bisSek: 2400, erwartet: { wert: 'delir', vergleich: '>', grenze: 0.45 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'fem-anlegen' }], erwartet: 'pa-eingriff' },
  },
};
