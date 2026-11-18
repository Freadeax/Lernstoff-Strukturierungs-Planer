// Pilotfall Spur A · stationäre Langzeitpflege: Bewohnerin mit Demenz isst und trinkt nicht (Schmerz, BESD, FEM abwägen)
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Muster: amb-sturz-exsikkose.ts (Paket P6).

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const MUND_GESEHEN: Bedingung = { getan: 'schleimhaut-pruefen' };
const SCHMERZ_GELINDERT: Bedingung = { wert: 'schmerz', vergleich: '<', grenze: 3 };

export const LZ_DEMENZ_SCHMERZ: FallV2 = {
  schema: 2,
  id: 'lz-demenz-schmerz',
  version: '0.1.0',
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
      wirkung: [{ groesse: 'schmerz', delta: -2.5, beginnSek: 600, spitzeSek: 1800, dauerSek: 21600 }],
    }),
  ],

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
    regeln: [
      { wenn: { gemeldet: ['a-besd', 'a-druckstelle', 'a-nachts'] },
        antwort: '„Gut beobachtet, das erklärt einiges. Prothese draußen lassen, Paracetamol 500 mg bis dreimal täglich, Trinken fördern mit Protokoll. Den Zahnarzt-Hausbesuch organisiere ich. Und wegen der Nächte: Machen Sie das Bettgitter hoch, ich schreibe es an.“',
        anordnungen: ['an-schmerz', 'an-trinken', 'an-gitter'], setzt: ['arzt-informiert'] },
      { wenn: { gemeldet: ['a-besd', 'a-druckstelle'] },
        antwort: '„Gut beobachtet. Prothese draußen lassen, Paracetamol 500 mg bis dreimal täglich, Trinken fördern mit Protokoll. Den Zahnarzt-Hausbesuch organisiere ich.“',
        anordnungen: ['an-schmerz', 'an-trinken'], setzt: ['arzt-informiert'] },
      { wenn: { gemeldet: ['a-demenz'] },
        antwort: '„Das ist bei ihrer Demenz leider der Verlauf. Bieten Sie weiter an, ich komme Donnerstag zur Visite.“', setzt: ['arzt-beruhigt'] },
      { wenn: { gemeldet: ['s-isst-nicht'] },
        antwort: '„Hat sie Schmerzen? Haben Sie in den Mund geschaut? Melden Sie sich mit genaueren Beobachtungen wieder.“' },
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
      { wenn: { nicht: { getan: 'sturzprophylaxe-bett' } }, impuls: 'Was kann nachts helfen, ohne sie einzusperren?', tipp: 'Niedrigbett, Sturzmatte, Licht, Klingel in Reichweite. Und an die Ursache denken.' },
      { impuls: 'Wer muss von deinen Beobachtungen wissen?', tipp: 'Hausarzt, Tochter als Betreuerin und die Wohnbereichsleitung. Und alles in den Pflegebericht.' },
    ],
  },
  team: { kollegin: 'Pflegefachfrau Sabine (Wohnbereichsleitung)' },

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
      { id: 'p-tochter', text: 'Tochter (Betreuerin) informiert', gewicht: 1, kompetenzbereiche: ['II', 'IV'], erfuellt: { getan: 'tochter-informieren' },
        warum: 'Die Betreuerin entscheidet in der Gesundheitssorge mit und kennt Gewohnheiten.' },
      { id: 'p-doku', text: 'Pflegebericht geschrieben', gewicht: 1, kompetenzbereiche: ['I', 'IV'], erfuellt: { getan: 'pflegebericht' },
        warum: 'BESD-Wert, Befund, Anordnungen und Wirkung müssen nachvollziehbar sein.' },
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
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { getan: 'sturzprophylaxe-bett' }, { getan: 'pflegebericht' }] },
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
      { art: 'anruf', an: 'aerztin', sbar: ['s-isst-nicht', 'b-demenz', 'a-besd', 'a-druckstelle', 'a-exsikkose', 'a-nachts', 'r-schmerz-zahnarzt'] },
      { art: 'rueckmelden', anordnung: 'an-schmerz', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-trinken', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-gitter', grund: 'Bettgitter ist eine freiheitsentziehende Maßnahme, dafür braucht es die Genehmigung des Betreuungsgerichts.' },
      { art: 'rueckmelden', anordnung: 'an-niedrigbett', rueckgelesen: true },
      { art: 'massnahme', id: 'schmerzmittel-geben' },
      { art: 'massnahme', id: 'sturzprophylaxe-bett' },
      { art: 'massnahme', id: 'tochter-informieren' },
      { art: 'massnahme', id: 'pflegebericht' },
      { art: 'abschluss', probleme: ['pb-schmerz', 'pb-ernaehrung', 'pb-sturz', 'pb-delir'], ziele: ['z-besd', 'z-trinken', 'z-sturz'] },
    ],
    unterlassung: { bisSek: 2400, erwartet: { wert: 'delir', vergleich: '>', grenze: 0.45 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'fem-anlegen' }], erwartet: 'pa-eingriff' },
  },
};
