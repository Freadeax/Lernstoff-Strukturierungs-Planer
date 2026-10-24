// Fiktive Fallvignetten zum Üben. Jede Musterlösung ist im Text belegbar und je Item begründet.
// Personen und Daten sind erfunden.

import type { InstrumentId } from './instrumente';

export type Gruppe = 'braden' | 'barthel' | 'schmerz' | 'mna';

export const GRUPPEN: { id: Gruppe; label: string; instrumente: InstrumentId[] }[] = [
  { id: 'braden', label: 'Braden', instrumente: ['braden'] },
  { id: 'barthel', label: 'Barthel', instrumente: ['barthel'] },
  { id: 'schmerz', label: 'Schmerz (NRS/BESD)', instrumente: ['nrs', 'besd'] },
  { id: 'mna', label: 'MNA-SF', instrumente: ['mna'] },
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
];
