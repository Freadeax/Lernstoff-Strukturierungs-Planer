// Notfall-Trainer: Basismaßnahmen der Reanimation, ABCDE-Einschätzung und typische Notfälle auf Station.
// Grundlage: Leitlinien des European Resuscitation Council (ERC 2021, Basic Life Support Erwachsene;
// Ablauf „erst Hilfe rufen, dann Atmung prüfen“ seit 13.11.2026 nach ERC 2025, fachliche Freigabe offen)
// und gängige Lehrbuchinhalte. Interne Notfallabläufe der Einrichtung gehen vor.

import { ergaenze, mitVertiefung, type Aufgabe, type AuswahlAufgabe } from '../quiz/quiz';
import { VERTIEFUNG } from './vertiefung';
import { ERWEITERUNG } from './erweiterung';
import { KINDER_AUFGABEN } from './kinder';

export const NOTFALL_THEMA = 'thema.beo.notfall';

export type BereichId = 'bls' | 'abcde' | 'situationen' | 'kinder';
export interface Bereich { id: BereichId; label: string; kurz: string; wissen: string[] }

function frage(id: string, titel: string, f: string, optionen: string[], erklaerung: string[], richtig = [0], mehrfach = false, weitere: string[] = []): AuswahlAufgabe {
  return { id, art: 'auswahl', topicIds: [NOTFALL_THEMA, ...weitere], titel, frage: f, optionen, richtig, mehrfach, erklaerung };
}

// ---------------------------------------------------------------- Reanimation

const bls: Aufgabe[] = [
  {
    id: 'bls.ablauf', art: 'reihenfolge', topicIds: [NOTFALL_THEMA], titel: 'Basismaßnahmen der Reanimation',
    frage: 'Du findest eine Bewohnerin leblos im Zimmer. In welcher Reihenfolge gehst du vor?',
    schritte: ['Laut ansprechen und an den Schultern rütteln', 'Keine Reaktion: sofort Hilfe rufen beziehungsweise Notruf absetzen und AED holen lassen', 'Atemweg freimachen: Kopf überstrecken, Kinn anheben', 'Atmung höchstens 10 Sekunden prüfen', '30 Thoraxkompressionen', '2 Beatmungen', 'AED anschließen, sobald er da ist, und den Anweisungen folgen'],
    erklaerung: ['Seit den ERC-Leitlinien 2025 gilt: Wer nicht reagiert, für den wird sofort Hilfe gerufen. Die Atmung wird geprüft, während der Notruf läuft, nicht vorher.', 'Keine normale Atmung = Kreislaufstillstand. Schnappatmung zählt nicht als normale Atmung. Im Zweifel mit der Reanimation beginnen.', 'Danach 30 Kompressionen und 2 Beatmungen im Wechsel, Pausen so kurz wie möglich.'],
  },
  frage('bls.frequenz', 'Thoraxkompression', 'Mit welcher Frequenz und Tiefe drückst du bei Erwachsenen?',
    ['100 bis 120 pro Minute, 5 bis 6 cm tief', '60 bis 80 pro Minute, 2 bis 3 cm tief', '140 bis 160 pro Minute, 8 bis 10 cm tief', 'So schnell wie möglich, Tiefe egal'],
    ['Nach jeder Kompression den Brustkorb vollständig entlasten. Helfer möglichst alle 2 Minuten wechseln, weil die Qualität schnell nachlässt.']),
  frage('bls.druckpunkt', 'Thoraxkompression', 'Wo setzt du bei Erwachsenen die Hände zur Herzdruckmassage auf?',
    ['Mitte des Brustkorbs, untere Hälfte des Brustbeins', 'Linke Brustseite über dem Herzen', 'Oberbauch unterhalb des Rippenbogens', 'Oberer Rand des Brustbeins am Hals'],
    ['Patient flach auf harter Unterlage. Im Bett das Reanimationsbrett nutzen oder die Matratze nach Herstellerangabe entlüften (CPR-Ventil).']),
  frage('bls.verhaeltnis', 'Thoraxkompression', 'In welchem Verhältnis wechseln Kompressionen und Beatmungen bei Erwachsenen?',
    ['30 : 2', '15 : 2', '5 : 1', '50 : 5'],
    ['Wer nicht beatmen kann oder will, drückt ohne Unterbrechung weiter (Hands-only). Kompressionen sind das Wichtigste.']),
  frage('bls.schnappatmung', 'Atmung prüfen', 'Die Bewohnerin reagiert nicht und macht alle paar Sekunden eine tiefe, schnappende Atembewegung. Was bedeutet das?',
    ['Keine normale Atmung: wie Kreislaufstillstand behandeln, Notruf und Reanimation', 'Sie atmet, also in die stabile Seitenlage', 'Sie schläft tief, später wieder prüfen', 'Erst Blutdruck messen'],
    ['Schnappatmung ist in den ersten Minuten nach einem Kreislaufstillstand häufig und wird oft mit normaler Atmung verwechselt.']),
  frage('bls.seitenlage', 'Atmung prüfen', 'Ein Patient ist bewusstlos, atmet aber normal. Was tust du?',
    ['Stabile Seitenlage, Notruf und Atmung fortlaufend kontrollieren', 'Sofort mit der Herzdruckmassage beginnen', 'Flach auf den Rücken legen und allein lassen', 'Etwas zu trinken einflößen'],
    ['Die Seitenlage hält den Atemweg frei. Atmet er nicht mehr normal: zurück auf den Rücken und Reanimation beginnen.']),
  frage('bls.aed', 'Defibrillator', 'Was gilt beim Einsatz des AED (automatisierter externer Defibrillator)?',
    ['Elektroden nach Bild aufkleben, Anweisungen folgen, beim Schock niemand berührt den Patienten', 'Erst nach 10 Minuten Herzdruckmassage einsetzen', 'Nur Ärztinnen und Ärzte dürfen ihn benutzen', 'Während der Analyse weiterdrücken'],
    ['Der AED analysiert selbst und gibt nur bei einem schockbaren Rhythmus einen Schock frei. Nach dem Schock sofort mit Kompressionen weitermachen.']),
];

// ---------------------------------------------------------------- ABCDE

const abcde: Aufgabe[] = [
  {
    id: 'abcde.reihenfolge', art: 'reihenfolge', topicIds: [NOTFALL_THEMA], titel: 'ABCDE-Schema',
    frage: 'In welcher Reihenfolge schätzt du einen kritisch kranken Patienten nach dem ABCDE-Schema ein?',
    schritte: ['A – Atemweg (Airway)', 'B – Atmung (Breathing)', 'C – Kreislauf (Circulation)', 'D – Neurologie (Disability)', 'E – Untersuchung und Umgebung (Exposure)'],
    erklaerung: ['Was zuerst tötet, wird zuerst behandelt: Ein verlegter Atemweg führt schneller zum Tod als ein niedriger Blutdruck.', 'Jedes Problem sofort behandeln, bevor du zum nächsten Buchstaben gehst, und danach von vorn neu einschätzen.'],
  },
  frage('abcde.a', 'ABCDE-Schema', 'Du hörst bei einem Patienten ein gurgelndes Geräusch beim Atmen. Zu welchem Buchstaben gehört das?',
    ['A – Atemweg', 'B – Atmung', 'C – Kreislauf', 'D – Neurologie'],
    ['Gurgeln, Schnarchen oder ein pfeifendes Geräusch beim Einatmen (Stridor) sprechen für einen teilweise verlegten Atemweg. Absaugen, Kopf überstrecken, Hilfe holen.']),
  frage('abcde.b', 'ABCDE-Schema', 'Was prüfst du unter B (Atmung)? Wähle alle zutreffenden.',
    ['Atemfrequenz', 'Sauerstoffsättigung', 'Atemarbeit, z. B. Einsatz der Atemhilfsmuskulatur', 'Pupillenreaktion', 'Blutzucker'],
    ['Pupillen und Blutzucker gehören zu D (Neurologie).'],
    [0, 1, 2], true),
  frage('abcde.c', 'ABCDE-Schema', 'Was gehört zu C (Kreislauf)? Wähle alle zutreffenden.',
    ['Puls und Blutdruck', 'Rekapillarisierungszeit (normal unter 2 Sekunden)', 'Hautfarbe und Hauttemperatur', 'Bewusstsein nach AVPU'],
    ['Das Bewusstsein (AVPU: wach, reagiert auf Ansprache, auf Schmerz, gar nicht) gehört zu D.'],
    [0, 1, 2], true),
  frage('abcde.d', 'ABCDE-Schema', 'Ein Patient mit Diabetes ist plötzlich verwirrt. Was prüfst du unter D neben dem Bewusstsein auf jeden Fall?',
    ['Den Blutzucker', 'Die Trinkmenge der letzten Woche', 'Das Gewicht', 'Die Körpergröße'],
    ['Eine Unterzuckerung ist eine häufige, schnell behandelbare Ursache für Verwirrtheit und Bewusstseinsstörungen.']),
  frage('abcde.sbar', 'Hilfe holen', 'Wie meldest du der Ärztin einen sich verschlechternden Patienten am besten?',
    ['Strukturiert nach SBAR: Situation, Hintergrund, Einschätzung, Empfehlung', 'Mit allen Werten seit der Aufnahme in zeitlicher Reihenfolge', 'Nur mit dem auffälligsten Wert', 'Erst bei der nächsten Visite'],
    ['SBAR macht die Meldung kurz und vollständig. Den Übergabe-Trainer gibt es dafür unter „Üben & anwenden“.'],
    [0], false, ['thema.pp.uebergabe']),
];

// ---------------------------------------------------------------- Situationen

const situationen: Aufgabe[] = [
  frage('situation.hypo', 'Hypoglykämie', 'Ein Bewohner mit Insulin ist nicht mehr ansprechbar, der Blutzucker liegt bei 38 mg/dl. Was tust du?',
    ['Notruf, nichts in den Mund geben, Seitenlage bei erhaltener Atmung, ärztlich wird Glukose i. v. oder Glukagon gegeben', 'Traubenzucker in den Mund legen', 'Ein Glas Saft einflößen', 'Insulin geben, weil der Zucker entgleist ist'],
    ['Bei Bewusstlosigkeit droht Aspiration. Orale Kohlenhydrate nur, wenn die Person wach ist und sicher schlucken kann.'],
    [0], false, ['thema.kl.diabetes']),
  frage('situation.fast', 'Schlaganfall', 'Eine Patientin spricht plötzlich verwaschen, ihr Mundwinkel hängt. Was tust du?',
    ['Sofort Notruf beziehungsweise Arzt: Verdacht auf Schlaganfall, Zeitpunkt des Beginns notieren', 'Erst einmal abwarten, ob es vorbeigeht', 'Ein Glas Wasser zum Trinken geben', 'Blutdrucksenkende Tabletten aus dem Vorrat geben'],
    ['FAST: Face (Gesicht), Arms (Arme), Speech (Sprache), Time (Zeit). Jede Minute zählt, weil eine Lyse oder Thrombektomie nur in einem Zeitfenster möglich ist.', 'Bis zur Abklärung nichts essen oder trinken lassen: Schluckstörung möglich.'],
    [0], false, ['thema.kl.neuro.schlaganfall']),
  frage('situation.krampf', 'Krampfanfall', 'Ein Patient hat einen generalisierten Krampfanfall. Was ist richtig? Wähle alle zutreffenden.',
    ['Verletzungen verhindern, gefährliche Gegenstände wegräumen, Kopf polstern', 'Uhrzeit und Dauer festhalten', 'Nach dem Anfall in die stabile Seitenlage bringen', 'Einen Beißkeil zwischen die Zähne schieben', 'Arme und Beine festhalten'],
    ['Nichts in den Mund, nicht festhalten. Dauert der Anfall länger als 5 Minuten oder folgen mehrere aufeinander, Notruf (Status epilepticus).'],
    [0, 1, 2], true, ['thema.kl.neuro.epilepsie']),
  frage('situation.atemnot', 'Atemnot', 'Ein Patient mit Herzinsuffizienz bekommt nachts starke Atemnot und rasselnde Atemgeräusche. Wie lagerst du ihn?',
    ['Oberkörper hoch, Beine tief (Herzbettlage), Arzt rufen', 'Flach auf den Rücken, Beine hoch', 'Auf den Bauch', 'Seitenlage mit flachem Oberkörper'],
    ['Die Herzbettlage entlastet das Herz, weil weniger Blut zurückfließt. Die Schocklage mit Beinen hoch würde die Atemnot verschlimmern.'],
    [0], false, ['thema.kl.herz.insuffizienz']),
  frage('situation.schocklage', 'Schock', 'Wann ist die Schocklage (Beine hoch) sinnvoll?',
    ['Bei einem Volumenmangelschock, z. B. nach starkem Blutverlust', 'Bei jedem Schock, auch bei Herzversagen', 'Bei Atemnot', 'Bei Verdacht auf Schlaganfall'],
    ['Beim kardiogenen Schock (Herz pumpt nicht) und bei Atemnot würde das zusätzlich zurückfließende Blut schaden.']),
  frage('situation.anaphylaxie', 'Anaphylaxie', 'Während einer Antibiotika-Infusion bekommt eine Patientin Quaddeln, Atemnot und wird blass. Was tust du zuerst?',
    ['Infusion sofort stoppen, Notruf beziehungsweise Arzt, Patientin nicht allein lassen', 'Infusion langsamer laufen lassen', 'Die Patientin zum Röntgen bringen', 'Erst die Infusion zu Ende laufen lassen, dann melden'],
    ['Allergen stoppen ist der erste Schritt. Lagerung nach Beschwerden: bei Atemnot sitzend, bei Kreislaufproblemen flach. Ärztlich wird meist Adrenalin i. m. gegeben.']),
];

export const BEREICHE: Bereich[] = [
  {
    id: 'bls', label: 'Reanimation', kurz: 'Ablauf, Druckpunkt, 30 : 2, AED',
    wissen: [
      'Ansprechen. Keine Reaktion: sofort Hilfe rufen und AED holen lassen (ERC 2025), dann Atemweg frei und Atmung höchstens 10 Sekunden prüfen.',
      'Keine normale Atmung = Reanimation: 30 Kompressionen und 2 Beatmungen im Wechsel. Im Zweifel beginnen.',
      '100 bis 120 pro Minute, 5 bis 6 cm tief, Mitte des Brustkorbs.',
    ],
  },
  {
    id: 'abcde', label: 'ABCDE-Schema', kurz: 'Kritisch kranke Patienten einschätzen und melden',
    wissen: [
      'A Atemweg, B Atmung, C Kreislauf, D Neurologie (Bewusstsein, Pupillen, Blutzucker), E Untersuchung und Umgebung.',
      'Jedes Problem gleich behandeln, dann neu beginnen.',
      'Meldung nach SBAR.',
    ],
  },
  {
    id: 'situationen', label: 'Notfälle auf Station', kurz: 'Hypoglykämie, Schlaganfall, Krampfanfall, Atemnot, Schock, Anaphylaxie',
    wissen: [
      'Bewusstlos: nichts in den Mund.',
      'Schlaganfall: FAST, Zeitpunkt notieren, sofort melden.',
      'Atemnot bei Herzinsuffizienz: Herzbettlage. Schocklage nur bei Volumenmangel.',
    ],
  },
  {
    id: 'kinder', label: 'Kinder und Säuglinge', kurz: 'Reanimation, Verschlucken, Atemnot, Krupp, Fieberkrampf, Normwerte',
    wissen: [
      'Kinder: zuerst 5 Beatmungen, dann 15 : 2. Säugling: zwei Finger oder Daumen, ein Drittel des Brustkorbs.',
      'Verschluckt: 5 Rückenschläge, dann Brustkompressionen (Säugling) bzw. Oberbauchkompressionen (Kind).',
      'Je jünger, desto schneller Atmung und Puls. NEWS2 gilt nicht für Kinder.',
    ],
  },
];

export const AUFGABEN: Record<BereichId, Aufgabe[]> = mitVertiefung(ergaenze<BereichId>({ bls, abcde, situationen, kinder: KINDER_AUFGABEN }, ERWEITERUNG), VERTIEFUNG);
export const ALLE_AUFGABEN: Aufgabe[] = Object.values(AUFGABEN).flat();
