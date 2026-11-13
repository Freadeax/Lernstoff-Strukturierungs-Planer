// Labor-Trainer, Bereich „Kinder und Säuglinge“ (Ausbau 2026-11-13): Blutentnahme beim Kind,
// kindliche Referenzbereiche, typische Befunde (Neugeborenengelbsucht, Gastroenteritis, Ketoazidose).
// Übliches Lehrbuchwissen, didaktisch vereinfacht, fachlich ungeprüft. Referenzbereiche nach Labor und Alter.

import type { Aufgabe } from '../quiz/quiz';

const KINDER = 'thema.kl.paediatrie';
const NEUGEBORENES = 'thema.ph.neugeborenes';
const ENTNAHME = 'thema.ph.injektion';
const DIABETES = 'thema.kl.diabetes';
const ATMUNG = 'thema.ap.atmung';

export const KINDER_AUFGABEN: Aufgabe[] = [
  {
    id: 'ki.ferse', art: 'auswahl', topicIds: [KINDER, NEUGEBORENES, ENTNAHME], titel: 'Kapilläres Blut beim Säugling', stufe: 1,
    frage: 'Wo und wie gewinnst du beim Säugling kapilläres Blut aus der Ferse?',
    optionen: ['Seitlich an der Ferse nach Vorwärmen stechen, den ersten Tropfen abwischen, nicht quetschen', 'In der Mitte der Fußsohle tief stechen und kräftig drücken', 'An der Fingerkuppe wie bei Erwachsenen', 'Mitten in die Ferse, damit genug Blut kommt'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Seitlich an der Ferse liegt der Knochen tiefer. In der Mitte droht eine Verletzung des Fersenbeins. Wärme fördert die Durchblutung.', 'Quetschen presst Gewebeflüssigkeit und zerstörte Zellen ins Blut: Kalium steigt falsch hoch, Werte werden verdünnt.'],
  },
  {
    id: 'ki.volumen', art: 'auswahl', topicIds: [KINDER, ENTNAHME], titel: 'Wie viel Blut darf es sein?', stufe: 1,
    frage: 'Ein 6 kg schwerer Säugling hat etwa 80 ml Blut pro Kilogramm. Was folgt daraus für Blutentnahmen?',
    optionen: ['Nur angeordnete Werte abnehmen, Kinderröhrchen nutzen und die Mengen über die Tage im Blick behalten', 'Wie bei Erwachsenen volle Röhrchen füllen, damit Nachforderungen möglich sind', 'Die Menge spielt keine Rolle, das Blut bildet sich in Stunden nach', 'Lieber gleich alle Werte auf Vorrat abnehmen'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Rund 480 ml Gesamtblut: Schon wenige volle Röhrchen sind für einen Säugling viel. Häufige Abnahmen können eine Blutarmut verstärken.', 'Kinderröhrchen brauchen nur wenige hundert Mikroliter. Das Labor sagt, welche Mindestmenge reicht.'],
  },
  {
    id: 'ki.schmerz', art: 'auswahl', topicIds: [KINDER, ENTNAHME], titel: 'Blutentnahme ohne Trauma', stufe: 2,
    frage: 'Was hilft, eine Blutentnahme beim Kind möglichst schonend zu machen? (mehrere richtig)',
    optionen: ['Betäubendes Pflaster nach Anordnung rechtzeitig vorher aufkleben', 'Eltern einbeziehen, kindgerecht und ehrlich erklären', 'Ablenkung, etwa mit Seifenblasen oder einem Buch', 'Nicht im Kinderbett stechen, sondern in einem Behandlungsraum', 'Sagen, es tue überhaupt nicht weh', 'Das Kind ohne Ankündigung überraschen'],
    richtig: [0, 1, 2, 3], mehrfach: true,
    erklaerung: ['Das Bett soll ein sicherer Ort bleiben. Ehrliche, kindgerechte Erklärungen erhalten das Vertrauen für die nächste Abnahme.', 'Betäubende Pflaster brauchen je nach Präparat etwa eine Stunde Einwirkzeit. Bei Neugeborenen kann nach Hausstandard eine Zuckerlösung den Schmerz lindern.'],
  },
  {
    id: 'ki.referenz', art: 'zuordnen', topicIds: [KINDER], titel: 'Kinderwerte sind anders', stufe: 2,
    frage: 'Ordne jedem Befund beim Kind die richtige Einordnung zu.',
    paare: [
      { links: 'Hb 10,5 g/dl bei einem 3 Monate alten Säugling', rechts: 'Kann in diesem Alter normal sein' },
      { links: 'Kreatinin 0,9 mg/dl bei einem 4-jährigen Kind', rechts: 'Für das Alter erhöht, ärztlich melden' },
      { links: 'Alkalische Phosphatase hoch bei einem 13-Jährigen im Wachstumsschub', rechts: 'Kann in diesem Alter normal sein' },
      { links: 'Gelbsucht am ersten Lebenstag', rechts: 'Immer abklären lassen' },
    ],
    erklaerung: ['Kinder haben eigene Referenzbereiche: Nach der Geburt sinkt das Hb physiologisch (Trimenonreduktion), Kreatinin ist wegen geringer Muskelmasse niedriger, die alkalische Phosphatase steigt mit dem Knochenwachstum.', 'Immer den Referenzbereich für das Alter auf dem Befund lesen, nicht die Erwachsenenwerte im Kopf.'],
  },
  {
    id: 'ki.ikterus', art: 'auswahl', topicIds: [NEUGEBORENES, KINDER], titel: 'Neugeborenengelbsucht', stufe: 1,
    frage: 'Ein 4 Tage altes Neugeborenes ist gelb, trinkt gut und ist munter. Was ist richtig?',
    optionen: ['Eine Gelbsucht ab dem 2. bis 3. Lebenstag ist häufig; Bilirubin nach Standard messen und Verlauf, Trinken und Ausscheidung beobachten', 'Gelbsucht ist bei Neugeborenen immer harmlos und braucht keine Messung', 'Sofort abstillen, die Muttermilch macht die Gelbsucht', 'Ins direkte Sonnenlicht legen'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Neugeborene bauen nach der Geburt viele rote Blutkörperchen ab, die Leber ist noch unreif. Steigt das Bilirubin zu hoch, kann es das Gehirn schädigen; dann hilft die Fototherapie nach Anordnung.', 'Warnzeichen: Gelbsucht am ersten Tag, schlappes Trinken, sehr müdes Kind, heller Stuhl oder dunkler Urin.'],
  },
  {
    id: 'ki.gastro', art: 'fall', topicIds: [KINDER, 'thema.pro.dehydratation', ATMUNG], titel: 'Fall: Kleinkind mit Brechdurchfall', stufe: 3,
    frage: 'Ordnest du Werte und Zustand richtig ein?',
    einstieg: 'Emil, 18 Monate, seit zwei Tagen Erbrechen und Durchfall. Er ist schlapp, die Windel war seit 8 Stunden trocken. Die Ärztin hat eine venöse BGA und Elektrolyte abgenommen.',
    schritte: [
      {
        lage: 'BGA: pH 7,29, pCO₂ 30 mmHg, HCO₃⁻ 15 mmol/l. Natrium 133 mmol/l, Glukose 62 mg/dl.',
        frage: 'Wie ordnest du die BGA ein?', optionen: ['Metabolische Azidose mit beginnender Kompensation über die Atmung', 'Respiratorische Azidose', 'Metabolische Alkalose', 'Normalbefund'],
        richtig: [0], mehrfach: false,
        warum: 'pH zu niedrig, HCO₃⁻ zu niedrig: metabolische Azidose, hier durch Bikarbonatverlust im Durchfall. Das erniedrigte pCO₂ zeigt, dass Emil schneller atmet, um gegenzusteuern.',
      },
      {
        lage: 'Emil liegt matt im Bett, die Mutter will ihm ein großes Glas Apfelsaft geben.',
        frage: 'Was ist jetzt richtig? (mehrere richtig)', optionen: ['Glukose und Werte ärztlich melden, Infusion nach Anordnung vorbereiten', 'Gewicht, Ein- und Ausfuhr und nasse Windeln dokumentieren', 'Wenn er trinken darf: kleine Mengen Rehydratationslösung statt Saft', 'Den großen Saft geben, der hilft gegen den niedrigen Zucker', 'Bis morgen früh abwarten'],
        richtig: [0, 1, 2], mehrfach: true,
        warum: 'Ein matter, trockener Säugling mit niedrigem Zucker braucht ärztliche Behandlung. Saft enthält viel Zucker und kaum Salz und kann den Durchfall verstärken. Rehydratationslösung in kleinen Portionen ist besser.',
      },
    ],
    erklaerung: ['Kleinkinder trocknen bei Brechdurchfall schnell aus. Werte, Zustand und Ausscheidung gehören zusammen in die Meldung.'],
  },
  {
    id: 'ki.ketoazidose', art: 'fall', topicIds: [DIABETES, KINDER, ATMUNG], titel: 'Fall: Jugendlicher mit Bauchweh und tiefer Atmung', stufe: 3,
    frage: 'Erkennst du die Stoffwechselentgleisung?',
    einstieg: 'Leon, 14, kommt mit Bauchschmerzen und Erbrechen auf die Kinderstation. Er hat in den letzten Wochen viel getrunken und abgenommen. Er atmet tief und schnell, der Atem riecht fruchtig.',
    schritte: [
      {
        lage: 'Blutzucker 486 mg/dl, Keton im Blut deutlich erhöht. BGA: pH 7,14, pCO₂ 22 mmHg, HCO₃⁻ 8 mmol/l.',
        frage: 'Was liegt am wahrscheinlichsten vor?', optionen: ['Diabetische Ketoazidose, oft Erstmanifestation eines Typ-1-Diabetes', 'Magen-Darm-Infekt mit Stressblutzucker', 'Hyperventilation aus Angst', 'Messfehler, weil Kinder keinen Diabetes bekommen'],
        richtig: [0], mehrfach: false,
        warum: 'Hoher Zucker, Ketone und eine schwere metabolische Azidose sind die Kennzeichen. Die tiefe, schnelle Atmung (Kussmaul) senkt das pCO₂ zur Kompensation.',
      },
      {
        lage: 'Die Ärztin ordnet Infusion und Insulin über die Spritzenpumpe an.',
        frage: 'Welche Werte kontrollierst du besonders engmaschig? (mehrere richtig)', optionen: ['Blutzucker', 'Kalium', 'Bewusstsein und Kopfschmerz', 'Ein- und Ausfuhr', 'Cholesterin'],
        richtig: [0, 1, 2, 3], mehrfach: true,
        warum: 'Insulin senkt Zucker und Kalium, beides darf nicht zu schnell fallen. Kopfschmerz oder Eintrübung können ein Hirnödem ankündigen, eine gefürchtete Komplikation bei Kindern. Bilanz zeigt, ob die Flüssigkeit ankommt.',
      },
    ],
    erklaerung: ['Die Ketoazidose ist bei Kindern und Jugendlichen oft die erste Zeichen eines Typ-1-Diabetes. Behandlung nur nach ärztlichem Schema mit engmaschigen Kontrollen.'],
  },
];

export const KINDER_VERTIEFUNG: Record<string, string[]> = {
  'ki.ferse': [
    'Beim Neugeborenen-Screening wird Blut aus der Ferse auf eine Filterkarte getropft. Die Karte muss vollständig durchtränkt sein, sonst ist die Probe nicht verwertbar.',
    'Den ersten Tropfen abwischen: Er enthält Gewebeflüssigkeit und Desinfektionsmittel, beides verfälscht die Werte.',
  ],
  'ki.volumen': [
    'Ein Erwachsener mit 70 kg hat etwa 5 Liter Blut. Fünf volle Röhrchen à 5 ml sind für ihn ein halbes Prozent, für einen 6 kg schweren Säugling rund fünf Prozent.',
    'Auf Intensivstationen werden Abnahmemengen bei Früh- und Neugeborenen deshalb oft mitgezählt.',
  ],
  'ki.schmerz': [
    'Kinder erinnern sich an schmerzhafte Eingriffe. Eine schlecht vorbereitete Abnahme macht die nächste schwerer.',
    'Eltern dürfen in der Regel dabei sein und halten, wenn sie möchten. Wer festhält, sollte nicht derselbe sein, der tröstet, wenn es sich vermeiden lässt.',
  ],
  'ki.referenz': [
    'Viele Labore drucken altersabhängige Referenzbereiche auf den Befund. Fehlt die Altersangabe in der Anforderung, stehen dort womöglich Erwachsenenwerte.',
    'Die Trimenonreduktion entsteht, weil nach der Geburt viel fetales Hämoglobin abgebaut wird und die Blutbildung erst langsam anläuft.',
  ],
  'ki.ikterus': [
    'Bilirubin kann über die Haut (transkutan) oder im Blut gemessen werden. Ob eine Fototherapie nötig ist, richtet sich nach Alter in Stunden und Risikofaktoren.',
    'Bei Fototherapie die Augen schützen, Temperatur und Trinkmenge kontrollieren und das Kind möglichst oft zum Stillen herausnehmen, wenn der Standard es erlaubt.',
  ],
  'ki.gastro': [
    'Rehydratationslösungen enthalten Zucker und Salz im richtigen Verhältnis. So nimmt der Darm Wasser auf, statt es zu verlieren.',
    'Gewicht ist beim Kleinkind das beste Maß für den Flüssigkeitsverlust. Deshalb bei Aufnahme wiegen und den Verlauf vergleichen.',
  ],
  'ki.ketoazidose': [
    'Ohne Insulin können Zellen keinen Zucker nutzen. Der Körper baut Fett ab, dabei entstehen Ketone, die das Blut sauer machen.',
    'Typische Vorgeschichte vor der Erstmanifestation: viel Durst, viel Wasserlassen, Gewichtsverlust, Müdigkeit. Wer das kennt, erkennt den Diabetes früher.',
  ],
};
