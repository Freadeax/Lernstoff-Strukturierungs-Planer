// Normwerte-Trainer, Ausbau: Werte im Verlauf einordnen und daraus handeln.
// Übliche Lehrbuch-Richtwerte; maßgeblich bleiben Labor-Referenzbereich und ärztliche Zielwerte. Themen als Text (kein Importzyklus).

import type { Aufgabe } from '../quiz/quiz';

const VITAL = 'thema.beo.vitalzeichen';
const DIABETES = 'thema.kl.diabetes';
const NIERE = 'thema.ap.niere';
const BLUT = 'thema.ap.blut';

export const ERWEITERUNG: Partial<Record<'vital' | 'labor' | 'ausscheidung', Aufgabe[]>> = {
  vital: [
    {
      id: 'zu.vital', art: 'zuordnen', topicIds: [VITAL], titel: 'Fachbegriffe zu Werten', stufe: 2,
      frage: 'Ordne jedem Befund beim Erwachsenen den Fachbegriff zu.',
      paare: [
        { links: 'Puls 118/min in Ruhe', rechts: 'Tachykardie' },
        { links: 'Puls 46/min', rechts: 'Bradykardie' },
        { links: 'Atemfrequenz 28/min', rechts: 'Tachypnoe' },
        { links: 'Atemfrequenz 8/min', rechts: 'Bradypnoe' },
        { links: 'Blutdruck 82/48 mmHg', rechts: 'Hypotonie' },
        { links: 'Temperatur 37,8 °C', rechts: 'Subfebrile Temperatur' },
      ],
      erklaerung: ['Fachbegriffe machen Übergaben kurz und eindeutig. Der Wert gehört trotzdem immer dazu.'],
    },
    {
      id: 'fall.sepsis', art: 'fall', topicIds: [VITAL], titel: 'Fall: Werte im Verlauf', stufe: 3,
      frage: 'Erkennst du die Verschlechterung rechtzeitig?',
      einstieg: 'Herr K., 76 Jahre, wird mit Harnwegsinfekt behandelt. Morgens: Puls 88, RR 132/80, Atemfrequenz 18, Temperatur 37,9 °C, wach und orientiert.',
      schritte: [
        { lage: 'Mittags: Puls 104, RR 112/70, Atemfrequenz 23, Temperatur 38,7 °C. Er wirkt etwas langsamer im Antworten.', frage: 'Wie bewertest du den Verlauf?', optionen: ['Deutliche Verschlechterung, mehrere Werte kippen gleichzeitig', 'Normal bei Fieber, keine Meldung nötig', 'Nur die Temperatur ist auffällig'], richtig: [0], mehrfach: false, warum: 'Puls und Atemfrequenz steigen, der Blutdruck fällt, das Bewusstsein verändert sich. Einzeln wirkt jeder Wert harmlos, zusammen sind sie ein Warnzeichen.' },
        { lage: 'Du vermutest eine beginnende Sepsis.', frage: 'Was tust du?', optionen: ['Sofort ärztlich melden, strukturiert nach SBAR', 'Engmaschig weiter messen', 'Urinausscheidung beobachten', 'Erst die nächste Routinemessung abwarten'], richtig: [0, 1, 2], mehrfach: true, warum: 'Bei Sepsis zählt jede Stunde. Die Ausscheidung zeigt früh, ob die Organe noch gut durchblutet sind.' },
        { lage: 'Die Ärztin fragt: „Wie hoch ist die Atemfrequenz genau?“', frage: 'Warum ist gerade dieser Wert so wichtig?', optionen: ['Er steigt oft als erstes Zeichen einer Verschlechterung', 'Er ist am leichtesten zu messen', 'Er spielt für Frühwarnscores keine Rolle'], richtig: [0], mehrfach: false, warum: 'Die Atemfrequenz reagiert früh auf Sauerstoffmangel, Übersäuerung und Fieber. In Frühwarnscores wie NEWS2 hat sie großes Gewicht.' },
      ],
      erklaerung: ['Der Trend ist wichtiger als der Einzelwert. Mehrere leicht veränderte Werte zusammen können bedrohlich sein.'],
    },
  ],
  labor: [
    {
      id: 'zu.labor', art: 'zuordnen', topicIds: [BLUT, NIERE], titel: 'Laborwert und Bedeutung', stufe: 2,
      frage: 'Ordne jedem Laborwert zu, wofür er vor allem steht.',
      paare: [
        { links: 'CRP', rechts: 'Entzündung' },
        { links: 'Kreatinin', rechts: 'Nierenfunktion' },
        { links: 'Hämoglobin', rechts: 'Sauerstofftransport (Anämie)' },
        { links: 'Thrombozyten', rechts: 'Blutgerinnung (Blutstillung)' },
        { links: 'HbA1c', rechts: 'Blutzucker der letzten Wochen' },
        { links: 'Kalium', rechts: 'Herzrhythmus und Muskelerregung' },
      ],
      erklaerung: ['Wer weiß, wofür ein Wert steht, weiß auch, was bei Abweichungen zu beobachten ist.'],
    },
    {
      id: 'fall.hypo', art: 'fall', topicIds: [DIABETES], titel: 'Fall: Blutzucker im Verlauf', stufe: 3,
      frage: 'Wie gehst du mit den Werten um?',
      einstieg: 'Frau D., 74 Jahre, Typ-2-Diabetes mit Insulin, hat heute zum Frühstück kaum gegessen. Um 10 Uhr ist sie zittrig und schwitzt.',
      schritte: [
        { lage: 'Der Blutzucker liegt bei 58 mg/dl. Sie ist wach und kann schlucken.', frage: 'Was tust du zuerst?', optionen: ['Schnell wirksame Kohlenhydrate geben, z. B. Traubenzucker oder Saft', 'Insulin geben', 'Bis zum Mittagessen warten'], richtig: [0], mehrfach: false, warum: 'Bei Unterzuckerung mit erhaltenem Bewusstsein sind schnelle Kohlenhydrate das Mittel der Wahl.' },
        { lage: 'Nach 15 Minuten misst du 96 mg/dl, sie fühlt sich besser.', frage: 'Was folgt jetzt?', optionen: ['Langsam wirksame Kohlenhydrate geben, z. B. ein Brot', 'Ärztlich melden und die Insulindosis besprechen', 'Weitere Kontrollen nach Anordnung', 'Nichts mehr, der Wert ist wieder normal'], richtig: [0, 1, 2], mehrfach: true, warum: 'Das Insulin wirkt noch weiter. Ohne langsam wirksame Kohlenhydrate sinkt der Wert erneut.' },
        { lage: 'Am Nachmittag steigt der Wert auf 290 mg/dl.', frage: 'Was ist eine wahrscheinliche Ursache?', optionen: ['Gegenregulation des Körpers und reichlich Kohlenhydrate nach der Unterzuckerung', 'Ein Messfehler, hohe Werte gibt es nach Unterzuckerung nie', 'Zu viel Insulin am Morgen'], richtig: [0], mehrfach: false, warum: 'Nach einer Unterzuckerung schüttet der Körper Gegenhormone aus. Zusammen mit den gegebenen Kohlenhydraten kann der Wert danach hoch ausschlagen.' },
      ],
      erklaerung: ['Blutzucker schwankt mit Essen, Insulin und Gegenregulation. Wer die Zusammenhänge kennt, reagiert in beide Richtungen richtig.'],
    },
  ],
  ausscheidung: [
    {
      id: 'zu.ausscheidung', art: 'zuordnen', topicIds: [NIERE], titel: 'Ausscheidung: Fachbegriffe', stufe: 2,
      frage: 'Ordne jeder Beobachtung den Fachbegriff zu.',
      paare: [
        { links: 'Unter 500 ml Urin in 24 Stunden', rechts: 'Oligurie' },
        { links: 'Unter 100 ml Urin in 24 Stunden', rechts: 'Anurie' },
        { links: 'Über 3.000 ml Urin in 24 Stunden', rechts: 'Polyurie' },
        { links: 'Nächtliches Wasserlassen', rechts: 'Nykturie' },
        { links: 'Schmerzhaftes Wasserlassen', rechts: 'Dysurie' },
        { links: 'Häufiges Wasserlassen kleiner Mengen', rechts: 'Pollakisurie' },
      ],
      erklaerung: ['Menge und Art des Wasserlassens geben Hinweise auf Niere, Blase, Flüssigkeitshaushalt und Herz.'],
    },
    {
      id: 'fall.bilanz', art: 'fall', topicIds: [NIERE], titel: 'Fall: Flüssigkeitsbilanz', stufe: 3,
      frage: 'Kannst du die Bilanz einordnen?',
      einstieg: 'Frau E., 81 Jahre, hat seit zwei Tagen Durchfall. Du führst eine Bilanz über 24 Stunden.',
      schritte: [
        { lage: 'Einfuhr: 900 ml Getränke, 500 ml Infusion. Ausfuhr: 600 ml Urin, geschätzt 800 ml Stuhl.', frage: 'Wie ist die Bilanz?', optionen: ['Ausgeglichen bis leicht negativ, weil unsichtbare Verluste dazukommen', 'Deutlich positiv', 'Genau ausgeglichen, es fehlt nichts'], richtig: [0], mehrfach: false, warum: '1.400 ml Einfuhr stehen 1.400 ml messbarer Ausfuhr gegenüber. Über Haut und Atmung gehen zusätzlich mehrere hundert Milliliter verloren, die Bilanz ist also eher negativ.' },
        { lage: 'Ihre Zunge ist trocken, sie ist tagsüber schläfrig, der Urin ist dunkel.', frage: 'Was spricht für eine Exsikkose?', optionen: ['Trockene Schleimhäute', 'Veränderte Wachheit', 'Dunkler, konzentrierter Urin', 'Warme, rosige Haut'], richtig: [0, 1, 2], mehrfach: true, warum: 'Flüssigkeitsmangel zeigt sich an Schleimhäuten, Urin und oft am Bewusstsein. Bei älteren Menschen ist Verwirrtheit häufig ein frühes Zeichen.' },
        { lage: 'Du meldest die Beobachtungen der Ärztin.', frage: 'Welche Angaben gehören dazu?', optionen: ['Bilanz der letzten 24 Stunden mit Zahlen', 'Vitalzeichen und Bewusstsein', 'Stuhlhäufigkeit und Aussehen', 'Nur „Sie trinkt zu wenig“'], richtig: [0, 1, 2], mehrfach: true, warum: 'Konkrete Zahlen und Beobachtungen erlauben eine schnelle ärztliche Entscheidung über Infusion und Laborkontrollen.' },
      ],
      erklaerung: ['Bilanzen sind Näherungswerte. Zusammen mit der klinischen Beobachtung zeigen sie, ob ein Mensch genug Flüssigkeit hat.'],
    },
  ],
};

export const ERWEITERUNG_VERTIEFUNG: Record<string, string[]> = {
  'zu.vital': [
    'Die Grenzen gelten für Erwachsene in Ruhe. Bei Kindern liegen Puls und Atemfrequenz deutlich höher, bei Säuglingen etwa doppelt so hoch.',
    'Subfebril heißt leicht erhöht, aber noch kein Fieber. Die genauen Grenzen unterscheiden sich je nach Lehrbuch und Messort leicht.',
  ],
  'fall.sepsis': [
    'Frühwarnscores wie NEWS2 vergeben für jede Abweichung Punkte. Die Summe zeigt, wie dringend eine ärztliche Einschätzung nötig ist, und hilft, Verschlechterungen nicht zu übersehen.',
    'Ältere Menschen zeigen bei Sepsis oft wenig Fieber, dafür Verwirrtheit, Schwäche oder Stürze. Neue Verwirrtheit ist deshalb immer ein Warnzeichen.',
  ],
  'zu.labor': [
    'Laborwerte werden immer im Zusammenhang gelesen: mit der Klinik, mit früheren Werten und mit Medikamenten. Ein Einzelwert sagt oft wenig.',
    'Referenzbereiche unterscheiden sich zwischen Laboren und Messmethoden. Maßgeblich ist der Bereich, der auf dem Befund steht.',
  ],
  'fall.hypo': [
    'Als Faustregel gelten bei Unterzuckerung etwa 15 bis 20 g schnell wirksame Kohlenhydrate, dann nach etwa 15 Minuten nachmessen. Genaue Vorgaben stehen im Hausstandard.',
    'Bei älteren Menschen sind Unterzuckerungen besonders gefährlich: Sie führen zu Stürzen, Herzrhythmusstörungen und Verwirrtheit. Deshalb werden die Zielwerte für sie oft höher angesetzt.',
  ],
  'zu.ausscheidung': [
    'Die Endung „-urie“ bezieht sich auf den Urin. Vorsilben verraten die Art: oligo = wenig, an = ohne, poly = viel, dys = gestört, pollakis = häufig, nykt = Nacht.',
    'Nykturie ist typisch bei Herzinsuffizienz, Prostatavergrößerung und Diabetes. Sie erhöht durch nächtliche Wege das Sturzrisiko.',
  ],
  'fall.bilanz': [
    'Für eine Bilanz wird alles erfasst, was messbar hinein- und hinausgeht: Getränke, Infusionen, Sondennahrung, Urin, Stuhl, Erbrochenes, Drainagen. Feste Nahrung enthält zusätzlich Wasser, das meist geschätzt wird.',
    'Tägliches Wiegen ergänzt die Bilanz: Ein Kilogramm Gewichtsänderung innerhalb eines Tages entspricht etwa einem Liter Wasser.',
  ],
};
