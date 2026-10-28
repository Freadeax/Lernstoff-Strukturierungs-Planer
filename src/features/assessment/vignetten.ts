// Fiktive Fallvignetten zum Üben. Jede Musterlösung ist im Text belegbar und je Item begründet.
// Personen und Daten sind erfunden.

import type { InstrumentId } from './instrumente';

export type Gruppe = 'braden' | 'norton' | 'barthel' | 'schmerz' | 'mna' | 'gcs' | 'sturz';

export const GRUPPEN: { id: Gruppe; label: string; instrumente: InstrumentId[] }[] = [
  { id: 'braden', label: 'Braden', instrumente: ['braden'] },
  { id: 'norton', label: 'Norton', instrumente: ['norton'] },
  { id: 'barthel', label: 'Barthel', instrumente: ['barthel'] },
  { id: 'schmerz', label: 'Schmerz (NRS/BESD)', instrumente: ['nrs', 'besd'] },
  { id: 'mna', label: 'MNA-SF', instrumente: ['mna'] },
  { id: 'gcs', label: 'GCS', instrumente: ['gcs'] },
  { id: 'sturz', label: 'Sturz (Tinetti/TUG)', instrumente: ['tinetti', 'tug'] },
];

export interface Vignette {
  id: string;
  gruppe: Gruppe;
  /** Das richtige Instrument. */
  instrument: InstrumentId;
  titel: string;
  setting: string;
  text: string[];
  /** Bei Schmerzfällen wählt man zuerst das Instrument; hier steht, warum dieses passt. */
  instrumentWahl?: string;
  /** Musterlösung je Item-ID. Die Schlüssel bestimmen auch, ob F1 oder F2 (MNA) gilt. */
  loesung: Record<string, number>;
  begruendung: Record<string, string>;
  fazit: string;
  /** Optional abweichende Lernplan-Themen, sonst die des Instruments. */
  topicIds?: string[];
  /** Hilfswerte für den BMI-Rechner (MNA). */
  koerper?: { kg: number; cm: number };
}

export const VIGNETTEN: Vignette[] = [
  // ------------------------------------------------------------ Braden
  {
    id: 'br-krueger', gruppe: 'braden', instrument: 'braden', titel: 'Herr Krüger, 84 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Herr Krüger hatte vor zwei Wochen einen Schlaganfall mit Halbseitenlähmung rechts. Am rechten Arm und Bein spürt er Berührungen nur vermindert. Er ist wach, reagiert auf Ansprache und sagt verlangsamt, aber verständlich, wenn ihm etwas unangenehm ist.',
      'Er ist harninkontinent. Weil die Vorlage nicht ausreicht, muss die Bettwäsche etwa einmal pro Schicht gewechselt werden.',
      'Herr Krüger kann nicht gehen. Zweimal täglich wird er mit Hilfe für etwa 30 Minuten in den Rollstuhl gesetzt, sein Gewicht kann er dabei nicht selbst tragen.',
      'Im Bett verändert er seine Lage nur gelegentlich und minimal mit dem linken Arm. Für einen Positionswechsel braucht er Hilfe.',
      'Von den Mahlzeiten isst er meist etwa die Hälfte.',
      'Im Bett und im Rollstuhl rutscht er immer wieder nach unten. Beim Hochpositionieren schleift die Haut trotz Hilfe über die Unterlage.',
    ],
    loesung: { sensorik: 3, feuchtigkeit: 2, aktivitaet: 2, mobilitaet: 2, ernaehrung: 2, reibung: 1 },
    begruendung: {
      sensorik: 'Reagiert auf Ansprache und äußert sich, Empfinden an zwei Extremitäten (rechter Arm und rechtes Bein) gestört: leicht eingeschränkt.',
      feuchtigkeit: 'Wäschewechsel etwa einmal pro Schicht: oft feucht.',
      aktivitaet: 'Kann nicht gehen, wird in den Rollstuhl gesetzt und trägt sein Gewicht nicht: sitzt auf.',
      mobilitaet: 'Nur gelegentlich minimale Lageänderung, Positionswechsel nur mit Hilfe: stark eingeschränkt.',
      ernaehrung: 'Isst meist etwa die Hälfte: mäßige Ernährung.',
      reibung: 'Rutscht immer wieder nach unten, Haut schleift trotz Hilfe: Problem.',
    },
    fazit: '12 Punkte, hohes Risiko. Bewegungsplan mit festen Positionswechseln, Mikrolagerungen, druckverteilende Matratze, Hautinspektion und Ernährung im Blick behalten.',
  },
  {
    id: 'br-yilmaz', gruppe: 'braden', instrument: 'braden', titel: 'Frau Yilmaz, 46 Jahre', setting: 'Krankenhaus, Orthopädie',
    text: [
      'Frau Yilmaz ist am ersten Tag nach einer Hüft-TEP. Sie ist wach, orientiert und sagt klar, wo und wie stark es schmerzt. Ihre Haut ist trocken, die Wäsche wird nur routinemäßig gewechselt.',
      'Mit der Physiotherapeutin geht sie zweimal täglich ein paar Schritte vom Bett zum Stuhl. Den Rest des Tages verbringt sie im Bett.',
      'Im Bett verändert sie ihre Position häufig selbst, wegen der Schmerzen und der Lagerungsvorgaben aber nur ein wenig.',
      'Sie isst ihre Mahlzeiten vollständig und nimmt zwischendurch gern einen Joghurt.',
      'Mit dem Bettbügel hebt sie sich selbst vollständig an und rutscht nicht nach unten.',
    ],
    loesung: { sensorik: 4, feuchtigkeit: 4, aktivitaet: 3, mobilitaet: 3, ernaehrung: 4, reibung: 3 },
    begruendung: {
      sensorik: 'Wach, orientiert, äußert Schmerzen klar: nicht eingeschränkt.',
      feuchtigkeit: 'Haut trocken, Wäschewechsel nur routinemäßig: selten feucht.',
      aktivitaet: 'Geht gelegentlich kurze Strecken mit Hilfe, sonst im Bett: geht wenig.',
      mobilitaet: 'Häufige, aber nur geringe eigene Positionswechsel: gering eingeschränkt.',
      ernaehrung: 'Isst vollständig und zwischendurch: gute Ernährung.',
      reibung: 'Hebt sich selbst vollständig an, rutscht nicht: kein feststellbares Problem.',
    },
    fazit: '21 Punkte, nach der Skala kein erhöhtes Risiko. Trotzdem Haut an Fersen und Steiß nach der OP ansehen und Frühmobilisation fortsetzen.',
  },
  {
    id: 'br-becker', gruppe: 'braden', instrument: 'braden', titel: 'Frau Becker, 91 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Frau Becker hat eine mittelgradige Demenz. Sie reagiert auf Ansprache, kann aber nicht immer sagen, wenn ihr etwas wehtut oder unbequem ist. Hinweise auf Empfindungsstörungen gibt es nicht.',
      'Sie verliert häufig Urin. Die Vorlage reicht oft nicht, Kleidung und Wäsche müssen etwa einmal pro Schicht gewechselt werden.',
      'Zu den Mahlzeiten geht sie in Begleitung mit dem Rollator in den Speiseraum, die übrige Zeit sitzt sie im Sessel.',
      'Im Sessel verändert sie ihre Position nur selten und wenig, meist erst nach Aufforderung und mit Unterstützung.',
      'Sie isst selten eine Mahlzeit ganz auf, meist etwa die Hälfte. Einmal täglich bekommt sie Trinknahrung.',
      'Gelegentlich rutscht sie im Sessel etwas nach vorn, mit wenig Hilfe setzt sie sich wieder auf.',
    ],
    loesung: { sensorik: 3, feuchtigkeit: 2, aktivitaet: 3, mobilitaet: 2, ernaehrung: 2, reibung: 2 },
    begruendung: {
      sensorik: 'Reagiert auf Ansprache, kann Unbehagen aber nicht immer mitteilen: leicht eingeschränkt.',
      feuchtigkeit: 'Wechsel etwa einmal pro Schicht: oft feucht.',
      aktivitaet: 'Geht gelegentlich kurze Strecken mit Hilfe, sonst im Sessel: geht wenig.',
      mobilitaet: 'Positionswechsel selten, wenig und meist nur mit Unterstützung: stark eingeschränkt.',
      ernaehrung: 'Meist die Hälfte, gelegentlich Ergänzungskost: mäßige Ernährung.',
      reibung: 'Rutscht gelegentlich, braucht wenig Hilfe: potenzielles Problem.',
    },
    fazit: '14 Punkte, mittleres Risiko. Bewegungsanreize im Alltag, Positionswechsel im Sessel planen, Kontinenzversorgung und Hautschutz verbessern.',
  },
  {
    id: 'br-wagner', gruppe: 'braden', instrument: 'braden', titel: 'Herr Wagner, 78 Jahre', setting: 'Ambulante Palliativversorgung',
    text: [
      'Herr Wagner ist in der letzten Lebensphase. Er ist somnolent und reagiert auf Berührung nur noch mit Stöhnen, auf Ansprache nicht mehr.',
      'Er hat Fieber und schwitzt stark. Die Wäsche ist fast immer feucht und wird mehrmals pro Schicht gewechselt.',
      'Er verlässt das Bett nicht mehr und verändert seine Lage auch nicht geringfügig selbst.',
      'Er isst nichts mehr und nimmt nur wenige Schlucke Flüssigkeit.',
      'Er hat Kontrakturen in beiden Beinen und rutscht im Bett ständig nach unten. Ohne Schleifen kann er nicht hochpositioniert werden.',
    ],
    loesung: { sensorik: 2, feuchtigkeit: 1, aktivitaet: 1, mobilitaet: 1, ernaehrung: 1, reibung: 1 },
    begruendung: {
      sensorik: 'Reagiert nur auf Berührung bzw. Schmerzreiz mit Stöhnen: stark eingeschränkt (nicht ausgefallen, denn er reagiert noch).',
      feuchtigkeit: 'Fast immer feucht, mehrere Wechsel pro Schicht: ständig feucht.',
      aktivitaet: 'Verlässt das Bett nicht: bettlägerig.',
      mobilitaet: 'Keine eigene Lageänderung: komplett immobil.',
      ernaehrung: 'Isst nichts, trinkt kaum: sehr schlechte Ernährung.',
      reibung: 'Kontrakturen, rutscht ständig, Schleifen nicht vermeidbar: Problem.',
    },
    fazit: '7 Punkte, sehr hohes Risiko. In der Palliativsituation stehen Wohlbefinden und Schmerzfreiheit vor der Dekubitusvermeidung: Lagerung nach Wunsch, Weichlagerung, Hautpflege.',
  },

  // ------------------------------------------------------------ Norton
  {
    id: 'no-wagner', gruppe: 'norton', instrument: 'norton', titel: 'Frau Wagner, 79 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Frau Wagner ist nach einer Oberschenkelhalsfraktur vor drei Wochen ins Pflegeheim gezogen. Sie macht bei allen Übungen gern mit und fragt von sich aus, wann sie sich umsetzen soll.',
      'Ihre Haut ist an Unterschenkeln und Rücken trocken und schuppig, aber intakt. Sie hat einen Diabetes mellitus Typ 2.',
      'Ihr Allgemeinzustand ist leidlich: Sie ermüdet schnell, isst aber ausreichend. Sie ist zeitlich, örtlich und zur Person orientiert.',
      'Laufen kann sie noch nicht, sie wird im Rollstuhl in den Speiseraum gefahren. Im Bett dreht sie sich mit dem Bettgalgen selbst, nur das operierte Bein bewegt sie vorsichtig.',
      'Sie trägt eine Vorlage, die tagsüber und nachts meistens nass ist. Stuhl hält sie.',
    ],
    loesung: { kooperation: 4, alter: 1, haut: 3, zusatz: 3, koerper: 3, geist: 4, aktivitaet: 2, beweglichkeit: 3, inkontinenz: 2 },
    begruendung: {
      kooperation: 'Macht gern mit und fragt selbst nach: voll.',
      alter: '79 Jahre: über 60.',
      haut: 'Trocken und schuppig, intakt: 3.',
      zusatz: 'Diabetes mellitus: 3.',
      koerper: 'Ermüdet schnell, isst ausreichend: leidlich.',
      geist: 'Voll orientiert: klar.',
      aktivitaet: 'Wird im Rollstuhl gefahren: rollstuhlbedürftig.',
      beweglichkeit: 'Dreht sich selbst, schont nur ein Bein: kaum eingeschränkt.',
      inkontinenz: 'Vorlage meistens nass, Stuhl kontinent: meistens Urin.',
    },
    fazit: '25 Punkte, Dekubitusgefahr, genau an der Grenze. Ihre Motivation ist eine starke Ressource: Eigenbewegung im Bett anleiten, Inkontinenzversorgung verbessern und Hautpflege, Mobilisation mit der Physiotherapie steigern.',
  },
  {
    id: 'no-becker', gruppe: 'norton', instrument: 'norton', titel: 'Herr Becker, 66 Jahre', setting: 'Krankenhaus, Onkologie',
    text: [
      'Herr Becker hat ein fortgeschrittenes Lungenkarzinom und bekommt seit einer Woche eine Chemotherapie. Er wirkt antriebslos und teilnahmslos, antwortet aber richtig, wenn man ihn fragt.',
      'Bei der Lagerung macht er mit, wenn es ihm gut geht. An schlechten Tagen lehnt er Positionswechsel ab.',
      'Er hat starken Nachtschweiß, die Haut am Rücken ist morgens feucht. Sein Allgemeinzustand ist schlecht, er hat in einem Monat 6 kg abgenommen.',
      'Er verlässt das Bett zurzeit nicht. Im Bett kann er sich nur mit viel Hilfe auf die Seite drehen.',
      'Etwa einmal am Tag schafft er es nicht rechtzeitig zur Urinflasche.',
    ],
    loesung: { kooperation: 2, alter: 1, haut: 2, zusatz: 2, koerper: 2, geist: 3, aktivitaet: 1, beweglichkeit: 2, inkontinenz: 3 },
    begruendung: {
      kooperation: 'Macht nur an guten Tagen mit: teilweise.',
      alter: '66 Jahre: über 60.',
      haut: 'Durch Nachtschweiß feucht: 2.',
      zusatz: 'Krebserkrankung: 2.',
      koerper: 'Schlechter Allgemeinzustand mit Gewichtsverlust: schlecht.',
      geist: 'Antriebslos und teilnahmslos, aber orientiert: apathisch.',
      aktivitaet: 'Verlässt das Bett nicht: bettlägerig.',
      beweglichkeit: 'Dreht sich nur mit viel Hilfe: sehr eingeschränkt.',
      inkontinenz: 'Gelegentlich Urin daneben: manchmal.',
    },
    fazit: '18 Punkte, hohes Risiko. Bewegungsplan, der seine guten und schlechten Tage berücksichtigt, druckverteilende Matratze, Hautpflege und Wäschewechsel bei Nachtschweiß, Ernährung mit Ernährungsberatung abstimmen.',
  },
  // ------------------------------------------------------------ Barthel
  {
    id: 'ba-schmitt', gruppe: 'barthel', instrument: 'barthel', titel: 'Frau Schmitt, 79 Jahre', setting: 'Geriatrische Reha nach Oberschenkelhalsfraktur',
    text: [
      'Frau Schmitt isst selbstständig. Ihr Brot muss vorher geschnitten und bestrichen werden.',
      'Vom Bett in den Rollstuhl kommt sie mit etwas Hilfe ihres Ehemanns, der dafür nicht geschult ist.',
      'Am Waschbecken wäscht sie sich komplett selbst, putzt die Zähne und kämmt sich.',
      'Auf der Toilette braucht sie Hilfe beim Richten der Kleidung.',
      'Duschen geht nur mit Hilfe der Pflege.',
      'Sie steht allein auf und geht mit dem Rollator ohne Aufsicht etwa 60 Meter über den Flur.',
      'Ein Stockwerk Treppe schafft sie unter Aufsicht der Physiotherapeutin.',
      'Den Oberkörper kleidet sie selbst an und aus. Hose, Strümpfe und Schuhe zieht ihr die Pflege an.',
      'Sie ist stuhlkontinent. Etwa zweimal pro Woche nässt sie ein wenig ein, die Vorlagen wechselt sie selbst.',
    ],
    loesung: { essen: 5, transfer: 10, waschen: 5, toilette: 5, baden: 0, gehen: 10, treppe: 5, kleiden: 5, stuhl: 10, harn: 5 },
    begruendung: {
      essen: 'Hilfe bei der mundgerechten Vorbereitung, isst aber selbst: 5.',
      transfer: 'Geringe Hilfe durch ungeschulte Laienhilfe reicht: 10.',
      waschen: 'Komplett selbstständig inklusive Zähne und Haare: 5.',
      toilette: 'Braucht vor Ort Hilfe (Kleidung): 5.',
      baden: 'Duschen nur mit Hilfe: 0.',
      gehen: 'Steht allein auf, geht über 50 m mit Rollator ohne Aufsicht: 10.',
      treppe: 'Ein Stockwerk unter Aufsicht: 5.',
      kleiden: 'Nur den Oberkörper selbst: 5.',
      stuhl: 'Kontinent: 10.',
      harn: 'Kompensiert selbst mit überwiegendem Erfolg, seltener als einmal täglich Einnässen: 5.',
    },
    fazit: '60 Punkte, hilfebedürftig. Ressourcen beim Gehen und Waschen nutzen, Training für Transfer, Treppe und Ankleiden der unteren Körperhälfte.',
  },
  {
    id: 'ba-okafor', gruppe: 'barthel', instrument: 'barthel', titel: 'Herr Okafor, 67 Jahre', setting: 'Neurologische Frühreha nach Schlaganfall',
    text: [
      'Herr Okafor wird ausschließlich über eine PEG ernährt. Die Pflegefachkraft schließt die Sondennahrung an und spült die Sonde.',
      'Für den Transfer vom Bett in den Rollstuhl braucht er die erhebliche Unterstützung zweier Pflegekräfte.',
      'Waschen, Duschen und An- und Auskleiden übernimmt vollständig die Pflege.',
      'Eine Toilette oder einen Toilettenstuhl benutzt er nicht, er ist mit Inkontinenzmaterial versorgt.',
      'Gehen ist nicht möglich. Im Rollstuhl wird er geschoben, selbst fahren kann er ihn nicht. Treppen sind nicht möglich.',
      'Er ist mehrmals pro Woche stuhlinkontinent.',
      'Er hat einen transurethralen Dauerkatheter, den die Pflege versorgt. Kleidung und Bett bleiben trocken.',
    ],
    loesung: { essen: 5, transfer: 5, waschen: 0, toilette: 0, baden: 0, gehen: 0, treppe: 0, kleiden: 0, stuhl: 0, harn: 5 },
    begruendung: {
      essen: 'PEG-Ernährung mit Hilfe bei der Beschickung zählt nach dem Hamburger Manual 5 Punkte, nicht 0.',
      transfer: 'Erhebliche, professionelle Hilfe: 5.',
      waschen: 'Vollständig durch die Pflege: 0.',
      toilette: 'Benutzt faktisch weder Toilette noch Toilettenstuhl: 0.',
      baden: 'Vollständig durch die Pflege: 0.',
      gehen: 'Kann nicht gehen und fährt den Rollstuhl nicht selbst: 0.',
      treppe: 'Nicht möglich: 0.',
      kleiden: 'Vollständig durch die Pflege: 0.',
      stuhl: 'Mehr als einmal pro Woche inkontinent: 0.',
      harn: 'Braucht Hilfe bei der Versorgung des Harnkatheters: 5.',
    },
    fazit: '15 Punkte, weitgehend pflegeabhängig. Achtung bei PEG und Dauerkatheter: Beide geben nach dem Hamburger Manual 5 Punkte, wenn die Pflege hilft.',
  },
  {
    id: 'ba-lange', gruppe: 'barthel', instrument: 'barthel', titel: 'Frau Lange, 72 Jahre', setting: 'Ambulante Pflege, Diabetes mellitus Typ 2',
    text: [
      'Frau Lange isst selbstständig und kommt allein aus dem Bett in den Sessel und zurück.',
      'Sie wäscht sich am Waschbecken komplett selbst und benutzt die Toilette ohne Hilfe.',
      'In die Badewanne steigt sie nicht mehr allein. Duschen tut sie nur, wenn ihre Tochter hilft.',
      'Mit dem Gehstock geht sie allein durch die Wohnung und bis zum Bäcker an der Ecke (etwa 200 m). Die Treppe in den ersten Stock steigt sie allein mit dem Geländer.',
      'Ihre Kleidung zieht sie selbst an. Die verordneten Kompressionsstrümpfe zieht ihr morgens der Pflegedienst an.',
      'Sie ist stuhl- und harnkontinent.',
    ],
    loesung: { essen: 10, transfer: 15, waschen: 5, toilette: 10, baden: 0, gehen: 15, treppe: 10, kleiden: 5, stuhl: 10, harn: 10 },
    begruendung: {
      essen: 'Selbstständig: 10.',
      transfer: 'Komplett selbstständig: 15.',
      waschen: 'Komplett selbstständig: 5.',
      toilette: 'Ohne Hilfe: 10.',
      baden: 'Duschen nur mit Hilfe der Tochter: 0.',
      gehen: 'Über 50 m mit Gehstock (kein Gehwagen), ohne Hilfe: 15.',
      treppe: 'Allein mit Geländer: 10.',
      kleiden: 'Nötige Hilfsmittel wie Kompressionsstrümpfe gehören zu „selbstständig“ dazu. Weil sie dafür Hilfe braucht: 5.',
      stuhl: 'Kontinent: 10.',
      harn: 'Kontinent: 10.',
    },
    fazit: '90 Punkte, weitgehend selbstständig. Hilfebedarf beim Duschen und bei den Kompressionsstrümpfen gezielt planen, z. B. Anziehhilfe anleiten.',
  },

  // ------------------------------------------------------------ Schmerz
  {
    id: 'sz-brandt', gruppe: 'schmerz', instrument: 'nrs', titel: 'Herr Brandt, 58 Jahre', setting: 'Krankenhaus, Chirurgie',
    text: [
      'Herr Brandt ist am zweiten Tag nach einer Bauchoperation. Er ist wach, orientiert und gibt klar Auskunft.',
      'Du erklärst ihm die Skala von 0 (kein Schmerz) bis 10 (stärkster vorstellbarer Schmerz) und fragst nach dem Schmerz in Ruhe.',
      'Er sagt: „Im Liegen so eine 6. Wenn ich huste, eher eine 8.“',
    ],
    instrumentWahl: 'Er kann selbst Auskunft geben. Die Selbsteinschätzung mit der NRS hat Vorrang vor jeder Fremdeinschätzung.',
    loesung: { wert: 6 },
    begruendung: { wert: 'Gefragt war der Ruheschmerz: 6. Den Belastungsschmerz (8) dokumentierst du getrennt.' },
    fazit: 'Ruheschmerz 6, mittelstark, Belastungsschmerz 8. Handlungsbedarf: Schmerzmittel nach Anordnung, Husten mit Bauchdecke abstützen üben, Wirkung nach 30 bis 60 Minuten erneut erfassen.',
  },
  {
    id: 'sz-marx', gruppe: 'schmerz', instrument: 'nrs', titel: 'Frau Marx, 81 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Frau Marx hat eine leichte Demenz und eine Kniearthrose. Sie ist zeitlich manchmal unsicher, versteht aber einfache Fragen gut.',
      'Du zeigst ihr eine Skala mit Zahlen von 0 bis 10 und erklärst sie in einfachen Worten. Sie zeigt im Sitzen auf die 3 und sagt: „Geht schon, wenn ich sitze.“',
    ],
    instrumentWahl: 'Auch bei leichter Demenz zuerst die Selbstauskunft versuchen. Frau Marx kann die Skala nach Erklärung nutzen, also NRS. Die BESD ist für Menschen, die keine Auskunft mehr geben können.',
    loesung: { wert: 3 },
    begruendung: { wert: 'Sie zeigt selbst auf die 3.' },
    fazit: 'NRS 3, leichter Schmerz in Ruhe. Fragen, ob das für sie akzeptabel ist, und den Belastungsschmerz beim Gehen ebenfalls erfassen.',
  },
  {
    id: 'sz-schulz', gruppe: 'schmerz', instrument: 'besd', titel: 'Herr Schulz, 86 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Herr Schulz hat eine fortgeschrittene Demenz und kann sich nicht mehr verständlich äußern. Du beobachtest ihn zwei Minuten lang beim Transfer vom Bett in den Rollstuhl.',
      'Er atmet gelegentlich angestrengt, mit kurzen Phasen schneller Atmung.',
      'Er stöhnt wiederholt laut.',
      'Er verzieht das Gesicht zu einer Grimasse.',
      'Sein Körper ist starr, er ballt die Fäuste und versucht, dich wegzustoßen.',
      'Durch ruhiges Zureden und eine Hand auf der Schulter lässt er sich kurz beruhigen.',
    ],
    instrumentWahl: 'Er kann keine Auskunft mehr geben, also Fremdeinschätzung mit der BESD.',
    loesung: { atmung: 1, laut: 2, gesicht: 2, koerper: 2, trost: 1 },
    begruendung: {
      atmung: 'Gelegentlich angestrengt, kurze Phasen schneller Atmung: 1.',
      laut: 'Wiederholt lautes Stöhnen: 2.',
      gesicht: 'Grimassieren: 2.',
      koerper: 'Starr, geballte Fäuste, wegstoßen: 2.',
      trost: 'Beruhigen durch Stimme und Berührung möglich: 1.',
    },
    fazit: '8 Punkte, Schmerzen sehr wahrscheinlich. Ärztlich abklären (z. B. Bewegungsschmerz, Fraktur, Arthrose), Schmerzmittel nach Anordnung vor dem nächsten Transfer, danach erneut in derselben Situation einschätzen.',
  },
  {
    id: 'sz-neumann', gruppe: 'schmerz', instrument: 'besd', titel: 'Frau Neumann, 90 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Frau Neumann hat eine schwere Demenz und spricht nicht mehr. Du beobachtest sie zwei Minuten beim Mittagessen.',
      'Ihre Atmung ist ruhig und gleichmäßig. Sie summt leise vor sich hin, negative Laute gibt sie nicht von sich.',
      'Ihr Blick wirkt traurig. Mit den Fingern nestelt sie ständig an der Tischdecke.',
      'Trösten ist nicht nötig, sie wirkt nicht aufgewühlt.',
    ],
    instrumentWahl: 'Sie spricht nicht mehr und kann keine Selbstauskunft geben, also BESD.',
    loesung: { atmung: 0, laut: 0, gesicht: 1, koerper: 1, trost: 0 },
    begruendung: {
      atmung: 'Ruhig und gleichmäßig: 0.',
      laut: 'Summen ist keine negative Lautäußerung: 0.',
      gesicht: 'Trauriger Blick: 1.',
      koerper: 'Nesteln zählt als angespannt: 1.',
      trost: 'Nicht nötig: 0.',
    },
    fazit: '2 Punkte: Ab 2 Punkten sind Schmerzen wahrscheinlich. Auch kleine Werte ernst nehmen, Ursachen suchen und in einer Aktivität (z. B. Mobilisation) erneut beobachten.',
  },

  // ------------------------------------------------------------ MNA-SF
  {
    id: 'mna-hoffmann', gruppe: 'mna', instrument: 'mna', titel: 'Frau Hoffmann, 83 Jahre', setting: 'Ambulante Pflege',
    text: [
      'Frau Hoffmann lebt allein. Ihr Mann ist vor zwei Monaten gestorben. Sie sagt, sie esse seitdem „etwas weniger als früher“.',
      'Laut Hausarztbrief wog sie vor drei Monaten 64 kg, heute 61,5 kg. Sie ist 165 cm groß.',
      'Einkaufen geht sie noch selbst.',
      'Sie wirkt traurig, eine Demenz oder Depression ist nicht bekannt.',
    ],
    loesung: { A: 1, B: 2, C: 2, D: 0, E: 2, F1: 2 },
    begruendung: {
      A: '„Etwas weniger als früher“: leichte Abnahme.',
      B: '2,5 kg in drei Monaten: 1 bis 3 kg.',
      C: 'Geht einkaufen: verlässt die Wohnung.',
      D: 'Der Tod des Ehemanns ist psychischer Stress in den letzten 3 Monaten: ja.',
      E: 'Keine Demenz oder Depression bekannt: keine.',
      F1: '61,5 kg ÷ (1,65 m)² ≈ 22,6: 21 bis unter 23.',
    },
    koerper: { kg: 61.5, cm: 165 },
    fazit: '9 Punkte, Risiko für Mangelernährung. Vollständiges MNA, Ess- und Trinkprotokoll, Gewicht regelmäßig, Gesellschaft beim Essen (z. B. Mittagstisch) anregen.',
  },
  {
    id: 'mna-peters', gruppe: 'mna', instrument: 'mna', titel: 'Herr Peters, 88 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Herr Peters hat eine schwere Demenz. Seit einer Lungenentzündung vor drei Wochen isst er kaum noch etwas.',
      'Gewogen wurde er zuletzt vor sechs Monaten. Die Tochter meint, er sei dünner geworden.',
      'Er ist seit der Pneumonie bettlägerig. Eine Bettwaage gibt es nicht, deshalb kann kein aktueller BMI bestimmt werden.',
      'Der Wadenumfang beträgt 29 cm.',
    ],
    loesung: { A: 0, B: 1, C: 0, D: 0, E: 0, F2: 0 },
    begruendung: {
      A: 'Isst kaum noch etwas: starke Abnahme.',
      B: 'Kein aktuelles Gewicht, nur eine Vermutung: nicht bekannt.',
      C: 'Bettlägerig: 0.',
      D: 'Pneumonie vor drei Wochen: ja.',
      E: 'Schwere Demenz: 0.',
      F2: 'Kein BMI möglich, deshalb Wadenumfang: 29 cm liegt unter 31 cm.',
    },
    fazit: '1 Punkt, Mangelernährung. Ärztlich abklären, Ernährungsfachkraft einbeziehen, Wunschkost und Fingerfood, Unterstützung beim Essen, Trinkprotokoll.',
  },
  {
    id: 'mna-demir', gruppe: 'mna', instrument: 'mna', titel: 'Herr Demir, 70 Jahre', setting: 'Ambulante Pflege nach Knie-OP',
    text: [
      'Herr Demir hat vor drei Wochen ein neues Kniegelenk bekommen. Sein Appetit ist gut wie immer, er isst nicht weniger.',
      'Sein Gewicht ist stabil bei 92 kg, er ist 178 cm groß.',
      'Mit Unterarmgehstützen fährt er zweimal pro Woche zur Physiotherapie.',
      'Er ist geistig fit, keine Demenz oder Depression.',
    ],
    loesung: { A: 2, B: 3, C: 2, D: 0, E: 2, F1: 3 },
    begruendung: {
      A: 'Isst nicht weniger: keine Abnahme.',
      B: 'Gewicht stabil: kein Gewichtsverlust.',
      C: 'Verlässt die Wohnung zur Physiotherapie.',
      D: 'Die Operation vor drei Wochen zählt als akute Krankheit bzw. Belastung: ja.',
      E: 'Keine: 2.',
      F1: '92 kg ÷ (1,78 m)² ≈ 29,0: 23 und mehr.',
    },
    koerper: { kg: 92, cm: 178 },
    fazit: '12 Punkte, normaler Ernährungszustand, obwohl die OP bei D zwei Punkte kostet. Screening bei Veränderungen wiederholen.',
  },
  // ------------------------------------------------------------ GCS
  {
    id: 'gcs-lange', gruppe: 'gcs', instrument: 'gcs', titel: 'Frau Lange, 81 Jahre', setting: 'Stationäre Langzeitpflege, Frühdienst',
    text: [
      'Frau Lange hat einen insulinpflichtigen Diabetes. Beim Wecken um 7 Uhr liegt sie mit geschlossenen Augen im Bett. Erst als du sie mit Namen ansprichst, öffnet sie die Augen.',
      'Sie spricht in ganzen Sätzen, meint aber, sie sei zu Hause und müsse gleich zur Arbeit.',
      'Als du sie bittest, deine Hand zu drücken, tut sie das mit beiden Händen kräftig.',
      'Sie ist blass und kaltschweißig.',
    ],
    loesung: { augen: 3, verbal: 4, motorik: 6 },
    begruendung: {
      augen: 'Öffnet die Augen erst auf Ansprache: 3.',
      verbal: 'Spricht in Sätzen, ist aber desorientiert: verwirrt, 4.',
      motorik: 'Drückt auf Aufforderung die Hand: befolgt Aufforderungen, 6.',
    },
    fazit: '13 Punkte, leichte Bewusstseinsstörung. Bei Diabetes, Blässe und Kaltschweißigkeit sofort Blutzucker messen, Hypoglykämie nach Standard behandeln, ärztlich informieren und die GCS nach der Behandlung erneut erheben.',
  },
  {
    id: 'gcs-schroeder', gruppe: 'gcs', instrument: 'gcs', titel: 'Herr Schröder, 74 Jahre', setting: 'Krankenhaus, Innere Medizin, Nachtdienst',
    text: [
      'Herr Schröder nimmt einen Gerinnungshemmer. Am Abend ist er im Bad gestürzt und hat sich den Kopf angeschlagen, um 22 Uhr war er noch wach und orientiert.',
      'Bei der Kontrolle um 2 Uhr reagiert er nicht auf Ansprache. Erst als du ihn am Trapezmuskel kneifst, öffnet er kurz die Augen.',
      'Er stöhnt dabei, sagt aber kein Wort.',
      'Mit der rechten Hand greift er gezielt nach deiner Hand und schiebt sie weg. Aufforderungen befolgt er nicht.',
    ],
    loesung: { augen: 2, verbal: 2, motorik: 5 },
    begruendung: {
      augen: 'Öffnet die Augen nur auf Schmerzreiz: 2.',
      verbal: 'Stöhnt, keine Wörter: unverständliche Laute, 2.',
      motorik: 'Greift gezielt zum Ort des Schmerzreizes und wehrt ab: gezielte Abwehr, 5.',
    },
    fazit: '9 Punkte, mittelschwere Bewusstseinsstörung, gefallen von 15 vor vier Stunden. Unter Gerinnungshemmung an eine Hirnblutung denken: sofort ärztlich informieren, nicht allein lassen, Vitalzeichen und Pupillen kontrollieren, Atemweg im Blick behalten.',
  },
  {
    id: 'gcs-krause', gruppe: 'gcs', instrument: 'gcs', titel: 'Frau Krause, 68 Jahre', setting: 'Ambulante Pflege, Hausbesuch',
    text: [
      'Beim Hausbesuch findest du Frau Krause auf dem Sofa. Sie hält die Augen geschlossen und öffnet sie weder auf lautes Ansprechen noch auf einen kräftigen Schmerzreiz.',
      'Sie gibt keinen Laut von sich.',
      'Auf den Schmerzreiz beugt sie beide Arme abnorm an den Körper heran.',
      'Sie atmet schnarchend.',
    ],
    loesung: { augen: 1, verbal: 1, motorik: 3 },
    begruendung: {
      augen: 'Kein Augenöffnen, auch nicht auf Schmerzreiz: 1.',
      verbal: 'Kein Laut: 1.',
      motorik: 'Abnormes Beugen der Arme auf Schmerzreiz: Beugesynergismen, 3.',
    },
    fazit: '5 Punkte, schwere Bewusstseinsstörung. Notruf 112, Atemweg freimachen und Atmung prüfen, bei vorhandener Atmung stabile Seitenlage, bis zum Eintreffen des Rettungsdienstes bei ihr bleiben und Atmung fortlaufend kontrollieren.',
  },
  // ------------------------------------------------------------ Sturz
  {
    id: 'ti-neumann', gruppe: 'sturz', instrument: 'tinetti', titel: 'Frau Neumann, 82 Jahre', setting: 'Stationäre Langzeitpflege, nach Knie-OP links',
    text: [
      'Du machst mit Frau Neumann den Tinetti-Test. Sie sitzt aufrecht und sicher auf dem Stuhl ohne Armlehnen. Zum Aufstehen drückt sie sich mit beiden Händen von den Oberschenkeln ab, schafft es aber beim ersten Versuch.',
      'In den ersten Sekunden hält sie sich am Rollator fest. Danach steht sie sicher, aber nur mit dem Rollator. Beim leichten Stoß gegen das Brustbein macht sie einen Schritt zurück und hält sich fest, fängt sich aber.',
      'Mit geschlossenen Augen schwankt sie und öffnet sie sofort wieder. Bei der Drehung um sich selbst macht sie viele kleine, stockende Schritte und hält sich dabei am Rollator fest. Beim Hinsetzen stützt sie sich mit den Händen auf der Sitzfläche ab und plumpst die letzten Zentimeter.',
      'Nach der Aufforderung geht sie ohne Zögern los. Der rechte Fuß überholt den linken und hebt gut ab. Der linke Fuß kommt nur bis neben den rechten und schlurft über den Boden, die Schritte sind dadurch ungleich lang.',
      'Sie geht ohne Pausen und gerade, stützt sich dabei aber deutlich auf den Rollator. Die Füße setzt sie weit auseinander.',
    ],
    loesung: { g1: 1, g2: 1, g3: 2, g4: 1, g5: 1, g6: 1, g7: 0, g8a: 0, g8b: 0, g9: 1, b1: 1, b2: 1, b3: 1, b4: 0, b5: 0, b6: 0, b7: 1, b8: 1, b9: 0, b10: 0 },
    begruendung: {
      g1: 'Sitzt aufrecht und sicher: 1.',
      g2: 'Braucht die Arme zum Aufstehen: 1.',
      g3: 'Gelingt beim ersten Versuch: 2.',
      g4: 'Hält sich in den ersten Sekunden am Rollator fest: sicher mit Hilfsmittel, 1.',
      g5: 'Steht sicher, aber nur mit Rollator: 1.',
      g6: 'Macht einen Schritt und hält sich fest, fängt sich: 1.',
      g7: 'Schwankt mit geschlossenen Augen: unsicher, 0.',
      g8a: 'Kleine, stockende Schritte: 0.',
      g8b: 'Hält sich bei der Drehung fest: 0.',
      g9: 'Stützt sich ab und setzt sich nicht flüssig: 1.',
      b1: 'Geht ohne Zögern los: 1.',
      b2: 'Rechter Fuß überholt den linken: 1.',
      b3: 'Rechter Fuß hebt gut ab: 1.',
      b4: 'Linker Fuß kommt nur bis neben den rechten: 0.',
      b5: 'Linker Fuß schlurft: 0.',
      b6: 'Schritte ungleich lang: 0.',
      b7: 'Geht ohne Pausen: 1.',
      b8: 'Geht gerade, aber mit Hilfsmittel: 1.',
      b9: 'Stützt sich deutlich auf den Rollator: Hilfsmittel nötig, 0.',
      b10: 'Füße weit auseinander: breitbeinig, 0.',
    },
    fazit: '13 Punkte (Gleichgewicht 8, Gang 5), hohes Sturzrisiko. Rollator immer in Reichweite, Transfers und Drehungen begleiten, Gangschule und Krafttraining für das linke Bein mit der Physiotherapie, Umgebung sichern und Schmerzen vor der Mobilisation behandeln.',
  },
  {
    id: 'ti-albrecht', gruppe: 'sturz', instrument: 'tinetti', titel: 'Herr Albrecht, 74 Jahre', setting: 'Ambulante Pflege, nach einer Grippe',
    text: [
      'Herr Albrecht hatte vor zwei Wochen eine schwere Grippe. Er geht ohne Hilfsmittel. Beim Tinetti-Test sitzt er sicher, steht ohne die Arme beim ersten Versuch auf und steht von Anfang an sicher mit eng stehenden Füßen.',
      'Beim leichten Stoß gegen das Brustbein macht er einen Ausfallschritt und greift nach der Tischkante, fängt sich aber. Mit geschlossenen Augen schwankt er deutlich.',
      'Bei der Drehung um sich selbst setzt er die Schritte gleichmäßig, greift aber kurz zur Wand, weil ihm schwindelig wird. Er setzt sich sicher und flüssig hin.',
      'Er geht ohne Zögern los. Beide Füße überholen jeweils den anderen und heben vollständig ab, die Schritte sind gleich lang und gleichmäßig. Er weicht leicht von der Linie ab.',
      'Er schwankt nicht, geht aber mit leicht gebeugten Knien. Die Füße berühren sich beim Gehen fast.',
    ],
    loesung: { g1: 1, g2: 2, g3: 2, g4: 2, g5: 2, g6: 1, g7: 0, g8a: 1, g8b: 0, g9: 2, b1: 1, b2: 1, b3: 1, b4: 1, b5: 1, b6: 1, b7: 1, b8: 1, b9: 1, b10: 1 },
    begruendung: {
      g1: 'Sitzt sicher: 1.',
      g2: 'Steht ohne die Arme auf: 2.',
      g3: 'Erster Versuch: 2.',
      g4: 'Von Anfang an sicher ohne Hilfsmittel: 2.',
      g5: 'Sicher mit eng stehenden Füßen: 2.',
      g6: 'Ausfallschritt und Festhalten, fängt sich: 1.',
      g7: 'Schwankt deutlich: unsicher, 0.',
      g8a: 'Gleichmäßige Schritte: 1.',
      g8b: 'Greift zur Wand: unsicher, 0.',
      g9: 'Sicher und flüssig: 2.',
      b1: 'Ohne Zögern: 1.',
      b2: 'Rechter Fuß überholt den linken: 1.',
      b3: 'Hebt vollständig ab: 1.',
      b4: 'Linker Fuß überholt den rechten: 1.',
      b5: 'Hebt vollständig ab: 1.',
      b6: 'Gleich lange Schritte: 1.',
      b7: 'Gleichmäßig: 1.',
      b8: 'Leichte Abweichung: 1.',
      b9: 'Kein Schwanken, aber gebeugte Knie: 1.',
      b10: 'Füße berühren sich fast: 1.',
    },
    fazit: '23 Punkte (Gleichgewicht 13, Gang 10), erhöhtes Sturzrisiko. Gleichgewicht und Reaktion sind die Schwachstelle: Schwindel ärztlich abklären, Gleichgewichtstraining, langsam aufstehen und drehen, nachts Licht, nach der Erholung erneut testen.',
  },
  {
    id: 'tug-bauer', gruppe: 'sturz', instrument: 'tug', titel: 'Frau Bauer, 88 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Du führst mit Frau Bauer den Timed Up and Go durch. Sie sitzt auf einem Stuhl mit Armlehnen, der Rollator steht vor ihr.',
      'Sie braucht zwei Anläufe, um sich mit den Armen hochzudrücken. Sie geht langsam mit dem Rollator bis zur Markierung in 3 m Entfernung, dreht in vielen kleinen Schritten und geht zurück.',
      'Die Stoppuhr zeigt 26 Sekunden, als sie wieder mit dem Rücken an der Lehne sitzt.',
    ],
    loesung: { zeit: 3 },
    begruendung: { zeit: '26 Sekunden liegen zwischen 20 und 29 Sekunden.' },
    fazit: 'Abklärungsbedürftige Einschränkung mit erhöhtem Sturzrisiko. Auch die Beobachtung zählt: zwei Anläufe beim Aufstehen und unsichere Drehung. Ursachen klären, Rollator anpassen, Transfers üben, Kraft- und Balancetraining.',
  },
  {
    id: 'tug-kuehn', gruppe: 'sturz', instrument: 'tug', titel: 'Herr Kühn, 79 Jahre', setting: 'Ambulante Pflege, Erstbesuch',
    text: [
      'Herr Kühn lebt allein und geht ohne Hilfsmittel. Beim Erstbesuch machst du mit ihm den Timed Up and Go.',
      'Er steht zügig ohne Abstützen auf, geht die 3 m, dreht sicher und setzt sich wieder.',
      'Die Stoppuhr zeigt 14 Sekunden. Er erzählt, dass er im letzten halben Jahr zweimal im Badezimmer gestürzt ist.',
    ],
    loesung: { zeit: 2 },
    begruendung: { zeit: '14 Sekunden liegen zwischen 10 und 19 Sekunden.' },
    fazit: 'Geringe Einschränkung nach der Originaleinteilung. Für ältere Menschen sind 14 Sekunden aber schon ein Hinweis auf erhöhtes Sturzrisiko, und zwei Stürze im letzten halben Jahr sind selbst ein starker Risikofaktor: Sturzrisiko genauer einschätzen, Bad sichern (Haltegriffe, rutschfeste Matte), Hausnotruf besprechen.',
  },
];
