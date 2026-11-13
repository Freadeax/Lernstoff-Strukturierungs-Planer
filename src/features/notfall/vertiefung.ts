// „Mehr verstehen“ im Notfall-Trainer.
// Grundlage wie aufgaben.ts: ERC-Leitlinien 2021 (Basic Life Support), ABCDE-Schema. Ohne Beleg aus eigenem Material;
// es gilt der Notfallstandard der Einrichtung.

import { ERWEITERUNG_VERTIEFUNG } from './erweiterung';

export const VERTIEFUNG: Record<string, string[]> = {
  ...ERWEITERUNG_VERTIEFUNG,
  'bls.ablauf': [
    'Ohne Kreislauf sterben Gehirnzellen nach etwa 3 bis 5 Minuten. Der Rettungsdienst braucht meist länger. Deshalb überbrückt die Herzdruckmassage die Zeit, bis ein Defibrillator den Rhythmus wiederherstellen kann.',
    'Im Krankenhaus wird statt 112 das interne Reanimationsteam alarmiert (Nummer der Einrichtung). Den Ablauf und den Standort des Notfallwagens kennt man am besten schon vor dem Ernstfall.',
  ],
  'bls.frequenz': [
    'Bei der Kompression wird Blut aus Herz und Brustkorb gepresst, bei der Entlastung strömt es zurück. Wer nicht vollständig entlastet, verhindert die Füllung, und die Massage wird wirkungslos.',
    'Eine gute Herzdruckmassage erreicht nur etwa ein Viertel bis ein Drittel des normalen Herzzeitvolumens. Jede Pause lässt den aufgebauten Druck sofort zusammenfallen.',
  ],
  'bls.druckpunkt': [
    'Zu weit oben ist die Kompression wirkungslos, zu weit unten drückt man auf den Oberbauch und kann die Leber verletzen. Die Arme sind gestreckt, die Schultern stehen senkrecht über dem Druckpunkt.',
    'Rippenbrüche kommen bei korrekter Reanimation häufig vor, vor allem bei älteren Menschen. Sie sind kein Grund aufzuhören.',
  ],
  'bls.verhaeltnis': [
    'Beatmung wird mit Beutel und Maske oder Mund-zu-Mund gegeben, jede Beatmung etwa 1 Sekunde, bis sich der Brustkorb sichtbar hebt. Zu kräftige Beatmung bläht den Magen auf und fördert Erbrechen.',
    'Bei Kindern beginnt man nach ERC mit 5 Beatmungen, weil ein Kreislaufstillstand bei Kindern meist durch Sauerstoffmangel entsteht. Danach 15 : 2 für professionelle Helfer.',
  ],
  'bls.schnappatmung': [
    'Schnappatmung (agonale Atmung) kommt aus dem Hirnstamm, der kurz nach dem Kreislaufstillstand noch reagiert. Sie bewegt kaum Luft und ist kein Lebenszeichen, das gegen eine Reanimation spricht.',
    'Merke: Im Zweifel reanimieren. Eine Herzdruckmassage bei einem Menschen mit Kreislauf schadet selten ernsthaft, eine versäumte Reanimation kostet das Leben.',
  ],
  'bls.seitenlage': [
    'Bei Bewusstlosigkeit erschlaffen die Muskeln, die Zunge kann nach hinten fallen und die Schutzreflexe fehlen. In Seitenlage fließen Speichel oder Erbrochenes aus dem Mund statt in die Lunge.',
    'Ursachen für Bewusstlosigkeit klären, sobald die Lage gesichert ist: Blutzucker messen, Vitalzeichen, Pupillen. Die Person nie allein lassen.',
  ],
  'bls.aed': [
    'Schockbar sind Kammerflimmern und pulslose ventrikuläre Tachykardie: Das Herz zuckt ungeordnet und pumpt nicht. Der Schock unterbricht dieses Chaos, damit der Sinusknoten wieder den Takt übernehmen kann.',
    'Eine Nulllinie (Asystolie) ist nicht schockbar. Hier helfen nur Herzdruckmassage und Medikamente. Behaarung, Nässe oder ein Pflaster an der Klebestelle vorher entfernen bzw. abtrocknen.',
  ],
  'abcde.reihenfolge': [
    'Das ABCDE-Schema stammt aus der Notfallmedizin und ist in allen Bereichen gleich. So spricht das ganze Team dieselbe Sprache und nichts Lebenswichtiges wird übersehen.',
    'Vor dem A steht die eigene Sicherheit und der erste Eindruck: Wirkt die Person kritisch krank? Dann sofort Hilfe holen und nicht erst die vollständige Einschätzung abwarten.',
  ],
  'abcde.a': [
    'Ein vollständig verlegter Atemweg ist still: keine Atemgeräusche, aber heftige Atembewegungen (paradoxe Atmung). Das ist ein Notfall, der sofort Hilfe braucht.',
    'Hilfsmittel für den Atemweg sind Absaugen, Esmarch-Handgriff (Unterkiefer vorschieben) und Guedel- oder Wendl-Tubus. Sie werden nach Schulung und Hausstandard eingesetzt.',
  ],
  'abcde.b': [
    'Zur Einschätzung der Atmung gehören auch Hautfarbe (Zyanose), Atemgeräusche (Rasseln, Giemen) und die Frage, ob die Person ganze Sätze sprechen kann.',
    'Sauerstoff wird nach ärztlicher Anordnung gegeben. Im Notfall wird bei kritisch kranken Menschen sofort Sauerstoff gegeben und dann auf einen Zielbereich titriert.',
  ],
  'abcde.c': [
    'Die Rekapillarisierungszeit misst man, indem man 5 Sekunden auf Fingerkuppe oder Brustbein drückt. Dauert es über 2 Sekunden, bis die Farbe zurückkehrt, ist die Durchblutung gestört.',
    'Kalte, blasse, schweißige Haut zusammen mit schnellem Puls sind frühe Schockzeichen. Der Blutdruck fällt oft erst spät, wenn die Ausgleichsmechanismen erschöpft sind.',
  ],
  'abcde.d': [
    'AVPU ist eine schnelle Einschätzung des Bewusstseins (Alert, Voice, Pain, Unresponsive). Ausführlicher ist die Glasgow Coma Scale mit 3 bis 15 Punkten.',
    'Zu D gehören auch Pupillen (Größe, Seitengleichheit, Lichtreaktion) und neue Lähmungen. Neu aufgetretene Verwirrtheit ist immer ein Warnzeichen, nie einfach „Demenz“.',
  ],
  'abcde.sbar': [
    'Beispiel: S: „Herr M. hat seit 20 Minuten zunehmende Atemnot.“ B: „Er ist seit gestern nach Hüft-OP hier, bekannte Herzinsuffizienz.“ A: „Atemfrequenz 28, SpO2 88 %, Rasseln beidseits, ich halte es für bedrohlich.“ R: „Bitte kommen Sie sofort.“',
    'Die Empfehlung sagt klar, was du brauchst und bis wann. Am Ende die Anordnungen wiederholen (Closed Loop), damit Missverständnisse auffallen.',
  ],
  'situation.hypo': [
    'Glukagon mobilisiert Zucker aus der Leber und kann i. m. oder als Nasenspray gegeben werden. Es wirkt schlecht, wenn die Leberspeicher leer sind, etwa bei Alkohol oder Mangelernährung.',
    'Nach dem Aufwachen braucht die Person zusätzlich lang wirksame Kohlenhydrate (z. B. Brot), weil die Wirkung von Glukose kurz ist und das Insulin noch wirkt. Blutzucker engmaschig kontrollieren.',
  ],
  'situation.fast': [
    'Beim ischämischen Schlaganfall verschließt ein Gerinnsel ein Hirngefäß. Bei der Lyse wird es medikamentös aufgelöst (meist innerhalb von 4,5 Stunden), bei der Thrombektomie mit einem Katheter entfernt.',
    'Ist der Beginn unklar, zählt der Zeitpunkt, zu dem die Person zuletzt gesund gesehen wurde. Diese Angabe ist für die Behandlungsentscheidung wichtig.',
  ],
  'situation.krampf': [
    'Beim generalisierten Anfall verkrampft sich zuerst der ganze Körper (tonische Phase), dann folgen rhythmische Zuckungen (klonische Phase). Danach sind Betroffene oft lange schläfrig und verwirrt (postiktale Phase).',
    'Festhalten kann zu Knochenbrüchen führen, Gegenstände im Mund zu Zahn- und Kieferverletzungen. Zungenbiss und Einnässen sind häufig und kein Grund zum Eingreifen während des Anfalls.',
  ],
  'situation.atemnot': [
    'Bei akuter Linksherzschwäche staut sich Blut in die Lunge, Flüssigkeit tritt in die Alveolen aus (Lungenödem). Typisch sind Atemnot im Liegen, Husten, manchmal schaumiges Sputum und feuchte Rasselgeräusche.',
    'Ärztlich wird meist ein Diuretikum i. v., Nitrat und Sauerstoff gegeben. Pflege beruhigt, bleibt bei der Person, misst Vitalzeichen und bereitet die Bilanzierung vor.',
  ],
  'situation.schocklage': [
    'Schock heißt: Die Organe bekommen zu wenig Sauerstoff, weil der Kreislauf versagt. Ursachen sind Volumenmangel, Pumpversagen (kardiogen), Gefäßweitstellung (septisch, anaphylaktisch) oder ein Hindernis (z. B. Lungenembolie).',
    'Bei Volumenmangel bringt das Anheben der Beine Blut aus den Beinen zum Herzen. Bei Kopf- oder Wirbelsäulenverletzungen und bei Atemnot ist die Schocklage nicht geeignet.',
  ],
  'situation.anaphylaxie': [
    'Bei der Anaphylaxie setzt das Immunsystem schlagartig Histamin frei: Gefäße weiten sich, werden durchlässig, Bronchien verengen sich. Innerhalb von Minuten können Schock und Atemwegsschwellung entstehen.',
    'Adrenalin i. m. in den Oberschenkel ist das wichtigste Medikament: Es verengt die Gefäße und weitet die Bronchien. Antihistaminika und Cortison wirken langsamer und ergänzen nur. Die Allergie wird danach deutlich dokumentiert.',
  ],
};
