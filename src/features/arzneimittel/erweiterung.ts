// Arzneimittel-Trainer, Ausbau: Wirkstoffgruppen zuordnen und Fälle zur sicheren Gabe und Beobachtung.
// Übliches Lehrbuchwissen; im Einzelfall gelten Fachinformation, Anordnung und Hausstandard. Thema als Text (kein Importzyklus).

import type { Aufgabe } from '../quiz/quiz';

const T = ['thema.ph.medikamente'];

export const ERWEITERUNG: Partial<Record<'sicherheit' | 'applikation' | 'gruppen' | 'beobachtung', Aufgabe[]>> = {
  gruppen: [
    {
      id: 'zu.endungen', art: 'zuordnen', topicIds: T, titel: 'Wirkstoffendungen', stufe: 2,
      frage: 'Ordne jedem Wirkstoff seine Gruppe zu.',
      paare: [
        { links: 'Lisinopril', rechts: 'ACE-Hemmer' },
        { links: 'Nebivolol', rechts: 'Betablocker' },
        { links: 'Valsartan', rechts: 'Sartane' },
        { links: 'Atorvastatin', rechts: 'Statine' },
        { links: 'Omeprazol', rechts: 'Protonenpumpenhemmer' },
        { links: 'Apixaban', rechts: 'Direkte orale Antikoagulanzien' },
        { links: 'Flucloxacillin', rechts: 'Penicilline' },
      ],
      erklaerung: ['Endungen: -pril, -olol, -sartan, -statin, -prazol, -xaban, -cillin. Sie verraten die Gruppe, auch bei unbekannten Handelsnamen.'],
    },
    {
      id: 'zu.nebenwirkung', art: 'zuordnen', topicIds: T, titel: 'Gruppe und typische Nebenwirkung', stufe: 2,
      frage: 'Ordne jeder Gruppe eine typische Nebenwirkung zu, auf die du achtest.',
      paare: [
        { links: 'ACE-Hemmer', rechts: 'Trockener Reizhusten' },
        { links: 'Betablocker', rechts: 'Langsamer Puls' },
        { links: 'Opioide', rechts: 'Verstopfung' },
        { links: 'Schleifendiuretika', rechts: 'Kaliummangel' },
        { links: 'NSAR', rechts: 'Magenblutung' },
        { links: 'Antikoagulanzien', rechts: 'Blutungen' },
      ],
      erklaerung: ['Wer die typische Nebenwirkung kennt, weiß, was vor und nach der Gabe beobachtet wird.'],
    },
    {
      id: 'fall.herzinfarkt', art: 'fall', topicIds: T, titel: 'Fall: Neuer Medikamentenplan nach Herzinfarkt', stufe: 3,
      frage: 'Beobachtest du gezielt nach der Wirkstoffgruppe?',
      einstieg: 'Herr P., 64 Jahre, hatte vor einer Woche einen Herzinfarkt und einen Stent bekommen. Neu angesetzt: ASS und Clopidogrel, Bisoprolol, Ramipril und Atorvastatin.',
      schritte: [
        {
          lage: 'Vor der Gabe von Bisoprolol misst du einen Puls von 48/min. Er fühlt sich schwindelig.',
          frage: 'Was tust du?', optionen: ['Nicht geben, ärztlich melden, Blutdruck messen', 'Wie angeordnet geben, der Puls ist bei Betablockern immer langsam', 'Die doppelte Dosis geben, damit das Herz geschont wird'], richtig: [0], mehrfach: false,
          warum: 'Betablocker senken die Herzfrequenz. Ein Puls unter 50/min mit Schwindel ist ein Grund, die Gabe zu besprechen.',
        },
        {
          lage: 'Am dritten Tag bemerkst du Zahnfleischbluten und mehrere blaue Flecken an den Armen.',
          frage: 'Zu welchen Arzneimitteln passt das?', optionen: ['ASS und Clopidogrel: Sie hemmen die Blutplättchen', 'Atorvastatin: Es senkt das Cholesterin', 'Ramipril: Es senkt den Blutdruck'], richtig: [0], mehrfach: false,
          warum: 'Die doppelte Plättchenhemmung schützt den Stent vor einem Verschluss, erhöht aber das Blutungsrisiko. Leichte Zeichen werden gemeldet, nicht eigenmächtig abgesetzt.',
        },
        {
          lage: 'Eine Woche später klagt er über trockenen Reizhusten und Muskelschmerzen in den Oberschenkeln.',
          frage: 'Welche Zuordnung ist richtig? Wähle alle zutreffenden.', optionen: ['Reizhusten: typische Nebenwirkung von ACE-Hemmern wie Ramipril', 'Muskelschmerzen: mögliche Nebenwirkung von Statinen wie Atorvastatin', 'Beides ärztlich melden', 'Beides ist harmlos und muss nicht dokumentiert werden'],
          richtig: [0, 1, 2], mehrfach: true,
          warum: 'Der Husten entsteht durch einen gebremsten Abbau von Bradykinin. Muskelschmerzen unter Statinen werden ärztlich abgeklärt, weil selten ein Muskelzerfall dahinterstecken kann.',
        },
      ],
      erklaerung: ['Wer die Gruppe kennt, weiß, was zu beobachten ist: Puls bei Betablockern, Blutungen bei Plättchenhemmern, Husten bei ACE-Hemmern, Muskeln bei Statinen.'],
    },
  ],
  sicherheit: [
    {
      id: 'fall.richten', art: 'fall', topicIds: T, titel: 'Fall: Medikamente in der Frühschicht', stufe: 3,
      frage: 'Wo lauern Fehler bei der Gabe?',
      einstieg: 'Du teilst die Morgenmedikamente aus. Im Zimmer 4 liegen Frau Maier und Frau Meyer, beide etwa 80 Jahre alt.',
      schritte: [
        { lage: 'Du stehst mit dem Dispenser „Maier“ am Bett am Fenster.', frage: 'Wie stellst du sicher, dass es die richtige Patientin ist?', optionen: ['Sie Namen und Geburtsdatum selbst nennen lassen oder das Armband prüfen', '„Frau Maier, oder?“ fragen', 'Nach dem Bettplatz gehen'], richtig: [0], mehrfach: false, warum: 'Ähnliche Namen im selben Zimmer sind ein typisches Verwechslungsrisiko. Offene Fragen und zwei Merkmale schützen davor.' },
        { lage: 'Im Dispenser liegt Metoprolol. Sie sagt, ihr sei beim Aufstehen schwindelig gewesen.', frage: 'Was tust du vor der Gabe?', optionen: ['Puls und Blutdruck messen', 'Bei Auffälligkeiten vor der Gabe ärztlich Rücksprache halten', 'Die Tablette einfach weglassen, ohne es jemandem zu sagen', 'Die Beobachtung dokumentieren'], richtig: [0, 1, 3], mehrfach: true, warum: 'Betablocker senken Puls und Blutdruck. Schwindel kann ein Hinweis auf eine zu starke Wirkung sein. Weglassen ohne Rücksprache ist eine eigenmächtige Therapieänderung.' },
        { lage: 'Der Puls ist 52, der Blutdruck 98/60. Die Ärztin ordnet an, die Dosis heute zu pausieren.', frage: 'Wie dokumentierst du?', optionen: ['Pausiert nach ärztlicher Anordnung, mit Uhrzeit, Werten und Namen der Ärztin', 'Gar nicht, es wurde ja nichts gegeben', 'Als gegeben abzeichnen, um den Plan sauber zu halten'], richtig: [0], mehrfach: false, warum: 'Auch eine nicht gegebene Dosis wird dokumentiert, mit Grund. So weiß der nächste Dienst Bescheid.' },
      ],
      erklaerung: ['Sichere Gabe heißt: richtige Person, vorher beobachten, bei Zweifel fragen und alles nachvollziehbar dokumentieren.'],
    },
  ],
  applikation: [
    {
      id: 'zu.applikation', art: 'zuordnen', topicIds: T, titel: 'Abkürzungen der Applikation', stufe: 1,
      frage: 'Ordne jeder Abkürzung den Applikationsweg zu.',
      paare: [
        { links: 'p. o.', rechts: 'Über den Mund geschluckt' },
        { links: 's. l.', rechts: 'Unter die Zunge' },
        { links: 's. c.', rechts: 'Ins Unterhautfettgewebe' },
        { links: 'i. m.', rechts: 'In den Muskel' },
        { links: 'i. v.', rechts: 'In die Vene' },
        { links: 'TTS', rechts: 'Über die Haut als Pflaster' },
      ],
      erklaerung: ['Die Applikationsart gehört zur 6-R-Regel. Eine Verwechslung kann gefährlich sein, etwa wenn ein i. m.-Präparat i. v. gegeben wird.'],
    },
    {
      id: 'fall.sonde', art: 'fall', topicIds: T, titel: 'Fall: Medikamente über die PEG-Sonde', stufe: 3,
      frage: 'Gibst du Arzneimittel über die Sonde sicher?',
      einstieg: 'Frau K., 83 Jahre, wird nach einem Schlaganfall über eine PEG-Sonde ernährt. Morgens sind angeordnet: ein Retard-Opioid, ein Protonenpumpenhemmer als magensaftresistente Kapsel und eine Schilddrüsentablette.',
      schritte: [
        {
          lage: 'Eine Kollegin schlägt vor, alle Tabletten zusammen zu mörsern und in einer Spritze zu geben.',
          frage: 'Was ist richtig? Wähle alle zutreffenden.', optionen: ['Retardtabletten nicht mörsern: Der Wirkstoff würde auf einmal freigesetzt', 'Jedes Arzneimittel einzeln vorbereiten und einzeln geben', 'Bei Unsicherheit Apotheke oder Fachinformation fragen, ob es eine flüssige oder teilbare Alternative gibt', 'Alles zusammen mörsern spart Zeit und ist üblich'],
          richtig: [0, 1, 2], mehrfach: true,
          warum: 'Gemörserte Retardformen können zu einer Überdosis führen. Gemischte Arzneimittel können sich gegenseitig verändern und verstopfen die Sonde.',
        },
        {
          lage: 'Die Ärztin stellt das Opioid auf eine geeignete Form um. Du bereitest die Gabe vor.',
          frage: 'Wie gehst du an der Sonde vor?', optionen: ['Sondennahrung pausieren, mit Wasser spülen, Arzneimittel einzeln geben, zwischen den Gaben und am Ende spülen', 'Arzneimittel direkt in den Beutel mit Sondennahrung geben', 'Ohne Spülen nacheinander alle Spritzen geben', 'Die Sonde vorher abklemmen und nicht spülen, um Flüssigkeit zu sparen'],
          richtig: [0], mehrfach: false,
          warum: 'Spülen verhindert Verstopfung und Wechselwirkungen in der Sonde. In die Nahrung gemischt ist die Dosis unklar und Ausflockungen sind möglich.',
        },
        {
          lage: 'Die Schilddrüsentablette soll nüchtern gegeben werden.',
          frage: 'Was bedeutet das an der Sonde?', optionen: ['Mit Abstand zur Sondennahrung geben, oft etwa 30 Minuten vorher, nach Anordnung', 'Nüchtern ist bei Sondenernährung egal', 'Gleichzeitig mit der Sondennahrung, damit nichts vergessen wird'], richtig: [0], mehrfach: false,
          warum: 'Nahrung kann die Aufnahme mancher Wirkstoffe stark senken. Die Abstände stehen in der Fachinformation und werden mit Ärztin oder Apotheke festgelegt.',
        },
      ],
      erklaerung: ['Nicht jede Form darf zerkleinert werden: Retard, magensaftresistent und manche Kapseln brauchen eine Alternative.', 'Einzeln geben, dazwischen spülen, Abstand zur Nahrung beachten.'],
    },
  ],
  beobachtung: [
    {
      id: 'fall.opioid', art: 'fall', topicIds: T, titel: 'Fall: Neu eingestellt auf Morphin', stufe: 3,
      frage: 'Worauf achtest du bei einer neuen Opioidtherapie?',
      einstieg: 'Herr S., 78 Jahre, hat Tumorschmerzen und bekommt seit heute Morphin retard zweimal täglich.',
      schritte: [
        { lage: 'Am ersten Abend ist er müde, ihm ist etwas übel.', frage: 'Wie bewertest du das?', optionen: ['Häufige Anfangsnebenwirkungen, die oft nach einigen Tagen nachlassen; beobachten und melden', 'Sofort absetzen, er verträgt Morphin nicht', 'Nicht beachten'], richtig: [0], mehrfach: false, warum: 'Müdigkeit und Übelkeit sind zu Beginn häufig. Gegen Übelkeit kann ärztlich ein Mittel angeordnet werden.' },
        { lage: 'Nachts ist er schwer weckbar, atmet 7-mal pro Minute, die Pupillen sind eng.', frage: 'Was liegt vor und was tust du?', optionen: ['Verdacht auf Atemdepression: wecken, ansprechen, sofort ärztlich melden, Vitalzeichen überwachen', 'Er schläft endlich gut, nicht stören', 'Die nächste Dosis vorziehen'], richtig: [0], mehrfach: false, warum: 'Atemfrequenz unter 8, schwere Weckbarkeit und enge Pupillen sind Zeichen einer Opioidüberdosierung. Ärztlich kann Naloxon gegeben werden.' },
        { lage: 'Nach drei Tagen hatte er keinen Stuhlgang.', frage: 'Was passt?', optionen: ['Abführmittel nach Anordnung, Trinkmenge und Bewegung fördern', 'Stuhlgang im Blick behalten und dokumentieren', 'Morphin absetzen, um die Verstopfung zu beheben'], richtig: [0, 1], mehrfach: true, warum: 'Opioidbedingte Verstopfung bleibt während der ganzen Therapie. Sie wird vorbeugend behandelt, nicht durch Absetzen der Schmerztherapie.' },
      ],
      erklaerung: ['Bei Opioiden: zu Beginn auf Atmung und Wachheit achten, Übelkeit lindern, Verstopfung immer vorbeugen.'],
    },
    {
      id: 'fall.antikoag', art: 'fall', topicIds: T, titel: 'Fall: Sturz unter Gerinnungshemmer', stufe: 3,
      frage: 'Was ist nach einem Sturz unter Gerinnungshemmung wichtig?',
      einstieg: 'Frau V., 85 Jahre, nimmt wegen Vorhofflimmern Apixaban. Sie ist im Bad gestürzt und hat sich den Kopf angeschlagen.',
      schritte: [
        { lage: 'Sie ist wach, orientiert und sagt, es gehe ihr gut.', frage: 'Was tust du?', optionen: ['Ärztlich melden, auch ohne sichtbare Verletzung', 'Neurologische Beobachtung über die nächsten Stunden planen', 'Nichts weiter, sie ist ja orientiert'], richtig: [0, 1], mehrfach: true, warum: 'Unter Gerinnungshemmern kann sich eine Hirnblutung verzögert entwickeln. Ein Kopfanprall wird deshalb immer ärztlich bewertet.' },
        { lage: 'Zwei Stunden später klagt sie über zunehmende Kopfschmerzen und ist schläfrig.', frage: 'Wie bewertest du das?', optionen: ['Warnzeichen für eine Hirnblutung: sofort ärztlich melden, Notfall', 'Normale Müdigkeit nach dem Schreck', 'Mit einem Schmerzmittel abwarten'], richtig: [0], mehrfach: false, warum: 'Zunehmende Kopfschmerzen und Bewusstseinsveränderung nach Kopfanprall unter Antikoagulation brauchen sofort eine Bildgebung.' },
      ],
      erklaerung: ['Gerinnungshemmer machen kleine Verletzungen gefährlich. Nach Kopfanprall gilt: melden und engmaschig beobachten.'],
    },
  ],
};

export const ERWEITERUNG_VERTIEFUNG: Record<string, string[]> = {
  'zu.endungen': [
    'Die Endungen folgen den internationalen Freinamen (INN) der Weltgesundheitsorganisation. Sie sind weltweit gleich, während Handelsnamen je nach Hersteller wechseln.',
    'Im Krankenhaus werden oft Präparate anderer Hersteller ausgegeben als zu Hause (Aut-idem-Austausch). Wer auf den Wirkstoff schaut, erkennt Doppelverordnungen.',
  ],
  'zu.nebenwirkung': [
    'Nebenwirkungen sind in der Fachinformation nach Häufigkeit gegliedert: sehr häufig, häufig, gelegentlich, selten, sehr selten. Die genannten sind typisch, nicht die einzigen.',
    'Unerwünschte Arzneimittelwirkungen werden ärztlich gemeldet. Pflegende tragen viel dazu bei, weil sie Veränderungen im Alltag zuerst bemerken.',
  ],
  'fall.richten': [
    'Ähnliche Namen (Look-alike, Sound-alike) betreffen Patienten und Präparate. Viele Häuser kennzeichnen Namensgleichheit am Bett oder in der Kurve.',
    'Vitalzeichen vor bestimmten Medikamenten (Betablocker, Digitalis, Blutdrucksenker) stehen oft als Kontrollauftrag im Plan. Grenzwerte für das Pausieren legt die Ärztin fest.',
  ],
  'zu.applikation': [
    'TTS steht für transdermales therapeutisches System. Weitere Abkürzungen sind z. B. rect. (rektal), inh. (inhalativ) und i. c. (intrakutan).',
    'Je nach Applikation unterscheidet sich die Dosis: Morphin oral braucht eine höhere Dosis als i. v., weil ein Teil in der Leber abgebaut wird.',
  ],
  'fall.opioid': [
    'Retardpräparate decken den Grundschmerz gleichmäßig ab. Für Schmerzspitzen wird oft eine schnell wirksame Bedarfsmedikation angeordnet.',
    'Eine Atemdepression ist vor allem zu Beginn der Therapie, nach Dosissteigerung und bei Niereninsuffizienz zu befürchten, weil Abbauprodukte des Morphins sich dann anreichern.',
  ],
  'fall.antikoag': [
    'Direkte orale Antikoagulanzien wie Apixaban wirken schnell und lassen sich nicht über den INR-Wert steuern. Für einige gibt es spezielle Gegenmittel, die ärztlich gegeben werden.',
    'Viele Einrichtungen haben einen Standard nach Sturz mit Kopfanprall unter Antikoagulation, etwa mit stündlicher Kontrolle von Bewusstsein und Pupillen in den ersten Stunden.',
  ],
  'fall.sonde': [
    'Die Endung „retard“, „ret.“, „CR“, „XR“ oder „SR“ weist auf eine verzögerte Freisetzung hin. Magensaftresistente Formen schützen den Wirkstoff vor der Magensäure oder den Magen vor dem Wirkstoff.',
    'Viele Apotheken haben Listen, welche Arzneimittel geteilt, gemörsert oder als Suspension gegeben werden dürfen. Ein Zerkleinern außerhalb der Zulassung ist ein sogenannter Off-Label-Gebrauch und braucht eine ärztliche Entscheidung.',
  ],
  'fall.herzinfarkt': [
    'Nach einem Stent wird die doppelte Plättchenhemmung meist für mehrere Monate gegeben. Ein eigenmächtiges Absetzen kann zu einem Stentverschluss und erneutem Infarkt führen.',
    'Die Kombination aus Betablocker, ACE-Hemmer, Statin und Plättchenhemmern ist nach Herzinfarkt üblich, weil jede Gruppe auf andere Weise das Risiko eines neuen Ereignisses senkt.',
  ],
};
