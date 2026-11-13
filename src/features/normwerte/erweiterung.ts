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
    {
      id: 'mess.spo2', art: 'auswahl', topicIds: [VITAL], titel: 'Pulsoxymetrie: Messfehler', stufe: 2,
      frage: 'Welche Umstände können die Sauerstoffsättigung am Finger verfälschen? Wähle alle zutreffenden.',
      optionen: ['Kalte, schlecht durchblutete Finger', 'Dunkler Nagellack oder Gelnägel', 'Zittern oder Bewegung der Hand', 'Kohlenmonoxidvergiftung', 'Ein ruhig liegender, warmer Finger'],
      richtig: [0, 1, 2, 3], mehrfach: true,
      erklaerung: ['Das Gerät misst Licht, das durch den Finger geht. Schlechte Durchblutung, Lack und Bewegung stören das Signal.', 'Bei Kohlenmonoxid zeigt es falsch hohe Werte, weil es CO-Hämoglobin nicht von sauerstoffbeladenem Hämoglobin unterscheidet.'],
    },
    {
      id: 'mess.rr', art: 'auswahl', topicIds: [VITAL], titel: 'Blutdruck: Messfehler', stufe: 2,
      frage: 'Was führt bei der Blutdruckmessung am Oberarm zu falsch hohen Werten? Wähle alle zutreffenden.',
      optionen: ['Eine zu schmale Manschette bei kräftigem Oberarm', 'Arm hängt unterstützt deutlich unter Herzhöhe', 'Messung direkt nach dem Treppensteigen', 'Patient spricht während der Messung', 'Eine passende Manschette auf Herzhöhe nach 5 Minuten Ruhe'],
      richtig: [0, 1, 2, 3], mehrfach: true,
      erklaerung: ['Manschette passend zum Armumfang, Arm auf Herzhöhe, einige Minuten Ruhe, nicht sprechen. Sonst steigt der Wert, ohne dass der Mensch einen hohen Blutdruck hat.'],
    },
    {
      id: 'fall.rr.hoch', art: 'fall', topicIds: [VITAL], titel: 'Fall: Sehr hoher Blutdruck', stufe: 3,
      frage: 'Unterscheidest du zwischen hohem Wert und Notfall?',
      einstieg: 'Herr A., 66 Jahre, bekannter Bluthochdruck, sagt am Nachmittag, er habe Kopfschmerzen. Du misst 196/108 mmHg.',
      schritte: [
        { lage: 'Er hat sich gerade über das Essen geärgert und ist eben vom Flur zurückgekommen.', frage: 'Was tust du zuerst?', optionen: ['Ruhig hinsetzen lassen und nach einigen Minuten mit passender Manschette erneut messen, auch am anderen Arm', 'Sofort den Notruf wählen', 'Den Wert als Messfehler abhaken'], richtig: [0], mehrfach: false, warum: 'Ärger und Bewegung treiben den Blutdruck kurzfristig hoch. Eine zweite, korrekt durchgeführte Messung zeigt, ob der Wert stimmt. Seitenunterschiede über 10 bis 20 mmHg sind selbst ein Befund.' },
        { lage: 'Nach 10 Minuten Ruhe: 192/106 mmHg. Er wirkt sonst wach und klar, keine Brustschmerzen, keine Lähmungen, keine Sehstörung.', frage: 'Wie ordnest du das ein?', optionen: ['Deutlich erhöht, aber ohne Organzeichen: zeitnah ärztlich melden', 'Lebensbedrohlicher Notfall, sofort Reanimationsteam', 'Normal für sein Alter, nichts tun'], richtig: [0], mehrfach: false, warum: 'Ohne Zeichen einer Organschädigung spricht man von einer hypertensiven Entgleisung. Sie wird ärztlich meist langsam über Stunden gesenkt.' },
        { lage: 'Eine Stunde später spricht er verwaschen und klagt über Brustdruck. RR 214/120 mmHg.', frage: 'Was ist jetzt richtig? Wähle alle zutreffenden.', optionen: ['Sofort ärztlich melden beziehungsweise Notfallteam: Verdacht auf hypertensiven Notfall', 'Oberkörper hoch lagern, nicht allein lassen', 'Vitalzeichen und Bewusstsein engmaschig kontrollieren', 'Eigenständig eine Blutdrucktablette aus dem Vorrat geben'], richtig: [0, 1, 2], mehrfach: true, warum: 'Neue Beschwerden an Gehirn oder Herz machen aus dem hohen Wert einen Notfall. Medikamente gibt es nur nach ärztlicher Anordnung, weil eine zu schnelle Senkung das Gehirn schlecht durchbluten kann.' },
      ],
      erklaerung: ['Erst korrekt nachmessen, dann nach Organzeichen fragen: Kopf, Brust, Sehen, Sprechen, Bewusstsein.', 'Ohne Zeichen zeitnah melden, mit Zeichen sofort.'],
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
    {
      id: 'labor.kritisch', art: 'auswahl', topicIds: [BLUT, NIERE, DIABETES], titel: 'Sofort melden', stufe: 2,
      frage: 'Welche Laborwerte bei einer Erwachsenen meldest du sofort ärztlich? Wähle alle zutreffenden.',
      optionen: ['Kalium 6,8 mmol/l', 'Blutzucker 40 mg/dl', 'Hämoglobin 6,5 g/dl', 'Natrium 139 mmol/l', 'Leukozyten 7.000 pro µl'],
      richtig: [0, 1, 2], mehrfach: true,
      erklaerung: ['Sehr hohes Kalium kann Herzrhythmusstörungen auslösen, sehr niedriger Blutzucker das Bewusstsein trüben, sehr niedriges Hb die Sauerstoffversorgung gefährden.', 'Natrium 139 und Leukozyten 7.000 liegen im üblichen Normbereich.'],
    },
    {
      id: 'fall.kalium', art: 'fall', topicIds: [NIERE], titel: 'Fall: Kalium zu hoch', stufe: 3,
      frage: 'Liest du den Befund im Zusammenhang?',
      einstieg: 'Frau H., 79 Jahre, Herzinsuffizienz, nimmt einen ACE-Hemmer und ein kaliumsparendes Diuretikum. Seit drei Tagen trinkt sie wenig. Im Labor: Kalium 6,4 mmol/l, Kreatinin höher als vor einer Woche.',
      schritte: [
        { lage: 'Auf dem Befund steht der Hinweis „Probe leicht hämolytisch“.', frage: 'Was bedeutet das für den Kaliumwert?', optionen: ['Er kann falsch hoch sein, weil zerstörte rote Blutkörperchen Kalium freigeben', 'Er ist dadurch falsch niedrig', 'Hämolyse spielt für Kalium keine Rolle'], richtig: [0], mehrfach: false, warum: 'Rote Blutkörperchen enthalten viel Kalium. Langes Stauen, starkes Pumpen mit der Faust oder Schütteln des Röhrchens zerstören sie und täuschen hohe Werte vor.' },
        { lage: 'Die Ärztin lässt neu abnehmen. Der Wert bleibt bei 6,3 mmol/l. Frau H. hat in 12 Stunden 250 ml Urin ausgeschieden.', frage: 'Welche Zusammenhänge erkennst du? Wähle alle zutreffenden.', optionen: ['Wenig Trinken verschlechtert die Nierenfunktion', 'Die Medikamente können das Kalium zusätzlich steigen lassen', 'Die geringe Urinmenge passt zur nachlassenden Nierenfunktion', 'Das Kalium steigt, weil sie zu viel trinkt'], richtig: [0, 1, 2], mehrfach: true, warum: 'Die Niere scheidet Kalium aus. Arbeitet sie schlechter und bremsen Medikamente die Ausscheidung zusätzlich, steigt der Wert.' },
        { lage: 'Die Ärztin ordnet Monitorüberwachung und eine Behandlung an.', frage: 'Warum ist eine Herzüberwachung bei hohem Kalium wichtig?', optionen: ['Hohes Kalium kann gefährliche Herzrhythmusstörungen bis zum Kreislaufstillstand auslösen', 'Kalium beeinflusst nur die Muskeln der Beine', 'Damit man den Blutzucker sieht'], richtig: [0], mehrfach: false, warum: 'Kalium bestimmt die elektrische Erregbarkeit von Herzmuskelzellen. Zu viel davon verlangsamt die Erregungsleitung und kann das Herz zum Stillstand bringen.' },
      ],
      erklaerung: ['Erst prüfen, ob der Wert stimmt (Hämolyse), dann Ursachen zusammen lesen: Niere, Trinkmenge, Medikamente.'],
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
    {
      id: 'beob.urin', art: 'auswahl', topicIds: [NIERE], titel: 'Urin beobachten', stufe: 2,
      frage: 'Welche Urinbeobachtungen meldest du ärztlich? Wähle alle zutreffenden.',
      optionen: ['Rötlicher, fleischwasserfarbener Urin', 'Bierbrauner Urin mit gelbem Schaum', 'Trüber, übel riechender Urin mit Fieber und Brennen', 'Hellgelber, klarer Urin bei guter Trinkmenge'],
      richtig: [0, 1, 2], mehrfach: true,
      erklaerung: ['Rötlich spricht für Blut, bierbraun mit gelbem Schaum für Gallenfarbstoff (z. B. bei Gallenstau), trüb mit Fieber und Brennen für einen Harnwegsinfekt.', 'Rote Bete und manche Arzneimittel färben den Urin ebenfalls, deshalb immer nachfragen.'],
    },
    {
      id: 'fall.harnverhalt', art: 'fall', topicIds: [NIERE], titel: 'Fall: Kein Urin seit der Operation', stufe: 3,
      frage: 'Erkennst du den Harnverhalt?',
      einstieg: 'Herr W., 74 Jahre, hat eine neue Hüfte bekommen. Seit der Operation vor 9 Stunden hat er kein Wasser gelassen. Er ist unruhig und drückt mit der Hand auf den Unterbauch.',
      schritte: [
        { lage: 'Oberhalb des Schambeins tastest du eine pralle, druckschmerzhafte Vorwölbung.', frage: 'Was ist am wahrscheinlichsten?', optionen: ['Harnverhalt: Die Blase ist voll, kann aber nicht entleert werden', 'Anurie: Die Nieren bilden keinen Urin', 'Normale Lage nach Operation'], richtig: [0], mehrfach: false, warum: 'Bei der Anurie ist die Blase leer. Eine pralle Blase heißt: Urin ist da, fließt aber nicht ab, etwa durch Narkose, Schmerzmittel oder eine vergrößerte Prostata.' },
        { lage: 'Das Ultraschallgerät für die Blase (Blasenscanner) zeigt etwa 850 ml.', frage: 'Was tust du? Wähle alle zutreffenden.', optionen: ['Ärztlich melden', 'Einmalkatheter nach ärztlicher Anordnung beziehungsweise Hausstandard', 'Hilfen anbieten: aufrecht sitzen oder stehen, Wasser laufen lassen, Ruhe', 'Viel trinken lassen und abwarten'], richtig: [0, 1, 2], mehrfach: true, warum: 'Eine überdehnte Blase schadet dem Blasenmuskel. Hausmittel helfen manchmal, ersetzen aber die Meldung nicht. Mehr Trinken füllt die Blase nur weiter.' },
      ],
      erklaerung: ['Keine Ausscheidung heißt nicht immer kein Urin: erst Blase tasten oder scannen, dann einordnen.', 'Nach Operationen und bei Männern mit vergrößerter Prostata an einen Harnverhalt denken.'],
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
  'mess.spo2': [
    'Das Pulsoxymeter vergleicht, wie viel rotes und infrarotes Licht durch den Finger kommt. Sauerstoffreiches und sauerstoffarmes Hämoglobin schlucken das Licht unterschiedlich.',
    'Die Sättigung sagt nichts über die Atemarbeit oder das Kohlendioxid. Ein Mensch mit Sauerstoffgabe kann eine gute Sättigung haben und trotzdem erschöpft sein. Atemfrequenz und Aussehen gehören immer dazu.',
  ],
  'mess.rr': [
    'Die Manschettenbreite sollte etwa 40 % des Oberarmumfangs betragen. Viele Geräte tragen auf der Manschette einen Bereich für den passenden Armumfang.',
    'Am liegenden oder schwer betroffenen Arm (z. B. Shunt, Lymphödem nach Brustoperation, Lähmung) wird nicht gemessen. Das steht oft auf einem Hinweisschild am Bett.',
  ],
  'fall.rr.hoch': [
    'Man unterscheidet die hypertensive Entgleisung (sehr hoher Wert ohne Organschaden) vom hypertensiven Notfall (mit Zeichen wie Brustschmerz, Atemnot, Sehstörung, Lähmung oder Verwirrtheit).',
    'Das Gehirn hat sich bei langjährigem Bluthochdruck an höhere Drücke gewöhnt. Fällt der Druck zu schnell, wird es schlechter durchblutet. Deshalb wird ärztlich vorsichtig gesenkt.',
  ],
  'labor.kritisch': [
    'Labore legen kritische Grenzen fest, bei denen sie sofort anrufen. Wer einen solchen Anruf entgegennimmt, liest den Wert zur Bestätigung zurück und gibt ihn ohne Umweg an die Ärztin weiter.',
    'Ein einzelner Wert wird immer mit dem Zustand des Menschen und früheren Werten verglichen. Ein langsam gesunkenes Hb wird oft besser vertragen als ein plötzlicher Abfall.',
  ],
  'fall.kalium': [
    'ACE-Hemmer, Sartane und kaliumsparende Diuretika wie Spironolacton bremsen die Kaliumausscheidung. Kommen Austrocknung oder eine Niereninsuffizienz dazu, steigt das Kalium oft gefährlich.',
    'Bei der Blutentnahme hilft gegen Hämolyse: nur kurz stauen, nicht pumpen lassen, ausreichend weite Kanüle, Röhrchen sanft schwenken statt schütteln.',
  ],
  'beob.urin': [
    'Die Farbe hängt stark von der Konzentration ab: Je weniger getrunken wird, desto dunkler der Urin. Farbskalen am Toilettenspiegel helfen, die Trinkmenge einzuschätzen.',
    'Arzneimittel können färben: Rifampicin rot-orange, Vitamin-B-Präparate leuchtend gelb, Metronidazol dunkel. Ein Blick in den Medikamentenplan klärt viele Farben.',
  ],
  'fall.harnverhalt': [
    'Narkosemittel, Opioide und eine Spinalanästhesie können die Blasenentleerung für Stunden stören. Deshalb wird nach Operationen nach dem ersten Wasserlassen gefragt.',
    'Ein Blasenscanner misst die Füllung ohne Katheter. Eine Restharnmessung direkt nach dem Wasserlassen zeigt, ob die Blase sich vollständig entleert.',
  ],
};
