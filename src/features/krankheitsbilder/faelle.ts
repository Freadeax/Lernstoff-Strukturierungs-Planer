// Offline-Fallaufgaben zu den Krankheitsbild-Steckbriefen. Personen und Daten sind erfunden.
// Jede Aufgabe nennt den Steckbrief-Abschnitt, aus dem die Musterlösung stammt: Ist dieser
// Abschnitt aus dem Unterrichtsmaterial belegt, zeigt die App den Beleg, sonst „ungeprüft“.

import type { DiseaseSection } from '../../modules/catalog-types';

export interface Option { text: string; richtig: boolean }

export interface Aufgabe {
  id: string;
  /** einfach = genau eine Antwort richtig, mehrfach = alle zutreffenden wählen. */
  art: 'einfach' | 'mehrfach';
  frage: string;
  optionen: Option[];
  erklaerung: string;
  /** Steckbrief-Abschnitt, aus dem die Lösung stammt (für Beleg oder „ungeprüft“). */
  abschnitt: DiseaseSection;
  /** Zusätzliche Lernplan-Themen, z. B. die Prophylaxe, um die es geht. */
  extraTopicIds?: string[];
}

export interface Fallaufgabe {
  id: string;
  /** ID des Krankheitsbild-Steckbriefs (kh.*). */
  krankheitId: string;
  titel: string;
  setting: string;
  text: string[];
  aufgaben: Aufgabe[];
}

const r = (text: string): Option => ({ text, richtig: true });
const f = (text: string): Option => ({ text, richtig: false });

export const FAELLE: Fallaufgabe[] = [
  // ---------------------------------------------------------------- Herzinsuffizienz
  {
    id: 'hi-sommer', krankheitId: 'kh.herzinsuffizienz', titel: 'Frau Sommer, 79 Jahre', setting: 'Krankenhaus, Innere Medizin',
    text: [
      'Frau Sommer kommt mit zunehmender Luftnot auf die Station. Sie schläft seit einer Woche nur noch mit drei Kissen im Rücken, flach liegen kann sie nicht. Nachts muss sie zwei- bis dreimal zur Toilette.',
      'Beim Abhören hört die Ärztin feuchte Rasselgeräusche über beiden Lungen. Frau Sommer hat seit Jahren einen schlecht eingestellten Bluthochdruck.',
      'Die Ärztin ordnet Bettruhe mit Oberkörperhochlagerung, tägliches Wiegen und eine Trinkmengenbegrenzung an.',
    ],
    aufgaben: [
      {
        id: 'form', art: 'einfach', abschnitt: 'symptome',
        frage: 'Welche Form der Herzinsuffizienz steht bei Frau Sommer im Vordergrund?',
        optionen: [r('Linksherzinsuffizienz mit Rückstau in den Lungenkreislauf'), f('Rechtsherzinsuffizienz mit Rückstau in den Körperkreislauf'), f('Keine Herzinsuffizienz, sondern eine Pneumonie')],
        erklaerung: 'Atemnot, Orthopnoe (kann nicht flach liegen) und feuchte Rasselgeräusche zeigen den Rückstau in die Lunge, also eine Linksherzinsuffizienz. Rasselgeräusche sind ein Hinweis auf ein Lungenödem.',
      },
      {
        id: 'ursache', art: 'einfach', abschnitt: 'ursachen',
        frage: 'Welche Ursache kommt laut Fall am ehesten infrage?',
        optionen: [r('Chronische arterielle Hypertonie'), f('Lungenembolie'), f('Herzklappenfehler rechts'), f('COPD')],
        erklaerung: 'Eine chronische Linksherzinsuffizienz entsteht häufig durch arterielle Hypertonie, KHK oder Herzklappenfehler links. Lungenembolie und COPD führen zur Rechtsherzinsuffizienz.',
      },
      {
        id: 'symptome', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Beobachtungen im Fall sind typische Symptome einer Herzinsuffizienz?',
        optionen: [r('Orthopnoe'), r('Nykturie'), r('Feuchte Rasselgeräusche'), f('Bluthochdruck seit Jahren'), f('Schläft mit drei Kissen, weil das bequemer ist')],
        erklaerung: 'Orthopnoe, Nykturie und Rasselgeräusche sind Symptome. Der Bluthochdruck ist die Ursache, kein Symptom. Die Kissen sind kein Komfort, sondern Ausdruck der Orthopnoe.',
      },
      {
        id: 'abbruch', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Bei der Körperpflege am Waschbecken: Wann brichst du die Maßnahme ab?',
        optionen: [r('Der Puls steigt stark an'), r('Frau Sommer bekommt Atemnot'), r('Sie klagt über Unwohlsein'), f('Sie möchte die Haare heute nicht waschen'), f('Das Wasser ist zu kalt')],
        erklaerung: 'Abbrechen, wenn der Puls stark steigt, Atemnot auftritt oder über Schmerzen oder Unwohlsein geklagt wird. Vor und nach jeder Maßnahme nach dem Befinden fragen.',
      },
      {
        id: 'gewicht', art: 'einfach', abschnitt: 'pflege',
        frage: 'Warum wiegst du Frau Sommer täglich?',
        optionen: [r('Eine Gewichtszunahme weist auf Wassereinlagerung hin'), f('Um eine Mangelernährung früh zu erkennen'), f('Damit die Medikamentendosis nach Gewicht berechnet werden kann')],
        erklaerung: 'Bei Herzinsuffizienz zeigt eine Gewichtszunahme Wassereinlagerung an. Zu viel Flüssigkeit kann zur Dekompensation führen, deshalb Trinkmenge einhalten und Gewicht kontrollieren.',
      },
      {
        id: 'pneumonie', art: 'einfach', abschnitt: 'prophylaxen', extraTopicIds: ['thema.pro.pneumonie'],
        frage: 'Welche Maßnahme zur Pneumonieprophylaxe ist bei Frau Sommer nicht geeignet?',
        optionen: [r('Abklopfen des Rückens'), f('Oberkörperhochlagerung'), f('Atemübungen nach Belastbarkeit')],
        erklaerung: 'Bei Herzinsuffizienz nicht abklopfen, weil das Rhythmusstörungen auslösen kann.',
      },
    ],
  },
  {
    id: 'hi-brandt', krankheitId: 'kh.herzinsuffizienz', titel: 'Herr Brandt, 71 Jahre', setting: 'Ambulante Pflege',
    text: [
      'Herr Brandt hat seit einigen Jahren eine Herzinsuffizienz. Er bekommt morgens eine Tablette zum Entwässern. Du kommst zur Medikamentengabe.',
      'Seine Unterschenkel und Knöchel sind dick geschwollen, die Haut darüber ist gespannt, glänzend und an einer Stelle schuppig gerötet. Er erzählt, dass er seit Tagen kaum Appetit hat und sich der Bauch voll anfühlt.',
      'Auf der Waage zeigt er seit dem letzten Besuch zwei Kilo mehr. Er sagt: „Ich trinke jetzt extra viel, damit die Tablette besser wirkt.“',
    ],
    aufgaben: [
      {
        id: 'form', art: 'einfach', abschnitt: 'symptome',
        frage: 'Auf welche Form weisen Ödeme, Appetitlosigkeit und Völlegefühl hin?',
        optionen: [r('Rechtsherzinsuffizienz'), f('Linksherzinsuffizienz'), f('Exsikkose')],
        erklaerung: 'Rückstau in den Körperkreislauf: Ödeme an Knöcheln und Unterschenkeln, Stauungsekzem, Appetitlosigkeit durch Stau in den Magenvenen, eventuell Hepatomegalie und Aszites.',
      },
      {
        id: 'dekompensation', art: 'mehrfach', abschnitt: 'beratung',
        frage: 'Welche Zeichen einer Dekompensation sollte Herr Brandt kennen?',
        optionen: [r('Weniger belastbar als sonst'), r('Nachts Atemnot'), r('Mehr Ödeme'), f('Häufiges Wasserlassen nach der Tablette'), f('Trockene Haut an den Händen')],
        erklaerung: 'Dekompensationszeichen: weniger belastbar, nachts Atemnot, mehr Ödeme. Häufiges Wasserlassen nach dem Diuretikum ist die erwartete Wirkung.',
      },
      {
        id: 'trinken', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie reagierst du auf „Ich trinke extra viel“?',
        optionen: [r('Ich frage nach einer verordneten Trinkmenge und erkläre, dass zu viel Flüssigkeit das Herz überlasten kann; die Gewichtszunahme gebe ich weiter'), f('Ich lobe ihn, viel Trinken schützt vor Exsikkose'), f('Ich lasse die Tablette heute weg, weil er schon genug ausscheidet')],
        erklaerung: 'Eine verordnete Trinkmengenbegrenzung einhalten, weil zu viel Flüssigkeit zur Dekompensation führen kann. Die Gewichtszunahme weist auf Wassereinlagerung hin und gehört an die Ärztin.',
      },
      {
        id: 'haut', art: 'einfach', abschnitt: 'symptome',
        frage: 'Was bedeutet die schuppig gerötete Stelle über dem Ödem?',
        optionen: [r('Stauungsekzem mit Gefahr von Wundheilungsstörungen'), f('Harmlose trockene Altershaut'), f('Allergie auf die Tablette')],
        erklaerung: 'Bei Rechtsherzinsuffizienz entsteht ein Stauungsekzem; die Haut über Ödemen heilt schlecht. Haut beobachten und schonend pflegen.',
      },
      {
        id: 'medikament', art: 'einfach', abschnitt: 'therapie',
        frage: 'Welcher Wirkstoff ist ein typisches Entwässerungsmittel bei Herzinsuffizienz?',
        optionen: [r('Furosemid'), f('Paracetamol'), f('Salbutamol'), f('Metformin')],
        erklaerung: 'Furosemid ist ein Schleifendiuretikum: mehr Wasser- und Elektrolytausscheidung, Ödeme werden ausgeschwemmt, das Herz entlastet. Auf Kalium und Blutdruck achten.',
      },
    ],
  },

  // ---------------------------------------------------------------- Hypertonie
  {
    id: 'ht-arslan', krankheitId: 'kh.hypertonie', titel: 'Herr Arslan, 58 Jahre', setting: 'Hausarztpraxis, Pflegeberatung',
    text: [
      'Herr Arslan arbeitet im Schichtdienst, raucht und hat in den letzten Jahren deutlich zugenommen. Bei drei Messungen an verschiedenen Tagen lag sein Blutdruck zwischen 152/96 und 160/98 mmHg.',
      'Er fühlt sich gesund und sagt: „Ich spüre doch nichts, wozu Tabletten?“ Der Arzt hat ihm Ramipril verordnet.',
    ],
    aufgaben: [
      {
        id: 'definition', art: 'einfach', abschnitt: 'definition',
        frage: 'Ab welchem Wert spricht man in der Praxismessung von Hypertonie?',
        optionen: [r('Ab 140/90 mmHg'), f('Ab 120/80 mmHg'), f('Ab 180/110 mmHg')],
        erklaerung: 'Hypertonie liegt bei dauerhaft mindestens 140/90 mmHg in der Praxismessung vor.',
      },
      {
        id: 'risiko', art: 'mehrfach', abschnitt: 'risikofaktoren',
        frage: 'Welche Risikofaktoren hat Herr Arslan?',
        optionen: [r('Rauchen'), r('Übergewicht'), r('Stress durch Schichtarbeit'), f('Junges Alter'), f('Niedriger Salzkonsum')],
        erklaerung: 'Rauchen, Übergewicht und Stress erhöhen das Risiko. Mit 58 Jahren ist er nicht mehr jung, ein niedriger Salzkonsum schützt eher.',
      },
      {
        id: 'beschwerden', art: 'einfach', abschnitt: 'beratung',
        frage: 'Was antwortest du auf „Ich spüre doch nichts“?',
        optionen: [r('Bluthochdruck macht lange keine Beschwerden, schädigt aber Gefäße, Herz, Gehirn und Nieren; deshalb Tabletten auch ohne Beschwerden nehmen'), f('Dann reicht es, die Tabletten nur bei Kopfschmerz zu nehmen'), f('Wenn Sie nichts spüren, ist der Blutdruck nicht gefährlich')],
        erklaerung: 'Hypertonie verläuft oft lange ohne Beschwerden. Medikamente regelmäßig nehmen und nicht eigenmächtig absetzen.',
      },
      {
        id: 'ramipril', art: 'einfach', abschnitt: 'pflege',
        frage: 'Welche Nebenwirkung von Ramipril soll er melden und nicht als Erkältung abtun?',
        optionen: [r('Trockener Reizhusten'), f('Dunkler Stuhl'), f('Heißhunger')],
        erklaerung: 'ACE-Hemmer (-pril) lösen typischerweise einen trockenen Reizhusten aus. Schwellung von Lippen, Zunge oder Rachen ist ein Notfall.',
      },
      {
        id: 'messen', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was gehört zur korrekten Blutdruckmessung?',
        optionen: [r('Einige Minuten in Ruhe sitzen'), r('Passende Manschettengröße'), r('Manschette auf Herzhöhe'), f('Direkt nach dem Treppensteigen messen'), f('Jedes Mal einen anderen Arm nehmen')],
        erklaerung: 'In Ruhe sitzend, passende Manschette auf Herzhöhe, möglichst immer am selben Arm messen und dokumentieren.',
      },
    ],
  },

  // ---------------------------------------------------------------- Herzinfarkt
  {
    id: 'mi-hoffmann', krankheitId: 'kh.herzinfarkt', titel: 'Frau Hoffmann, 74 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Frau Hoffmann hat Diabetes und Bluthochdruck. Beim Frühstück wirkt sie blass und kaltschweißig, sie ist übel und sagt, ihr sei „so komisch im Oberbauch“. Brustschmerzen verneint sie.',
      'Der Puls ist 108/min und unregelmäßig, der Blutdruck 100/60 mmHg. Die Beschwerden halten seit etwa 30 Minuten an.',
    ],
    aufgaben: [
      {
        id: 'verdacht', art: 'einfach', abschnitt: 'symptome',
        frage: 'Woran musst du trotz fehlender Brustschmerzen denken?',
        optionen: [r('An einen Herzinfarkt mit untypischen Beschwerden'), f('An eine harmlose Magenverstimmung'), f('An eine Unterzuckerung, sonst nichts')],
        erklaerung: 'Bei Frauen, älteren Menschen und Menschen mit Diabetes verläuft ein Infarkt oft untypisch: Übelkeit, Oberbauchschmerz, Atemnot, Schwäche. Kalter Schweiß und Blässe passen dazu. Blutzucker messen schadet nicht, ersetzt aber nicht den Notruf.',
      },
      {
        id: 'sofort', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was tust du sofort?',
        optionen: [r('Notruf 112 veranlassen'), r('Oberkörper hoch lagern, beengende Kleidung öffnen'), r('Nicht allein lassen, beruhigen, Vitalzeichen überwachen'), f('Sie zur Toilette begleiten, damit sie sich entspannt'), f('Erst einmal eine Stunde abwarten')],
        erklaerung: 'Bei Infarktverdacht: Notruf, Oberkörper hoch, Kleidung öffnen, nicht allein lassen, keine Anstrengung, Vitalzeichen und Bewusstsein überwachen, Reanimationsbereitschaft.',
      },
      {
        id: 'risiko', art: 'mehrfach', abschnitt: 'risikofaktoren',
        frage: 'Welche Risikofaktoren für KHK hat Frau Hoffmann?',
        optionen: [r('Diabetes mellitus'), r('Arterielle Hypertonie'), r('Höheres Alter'), f('Unregelmäßiger Puls'), f('Blässe')],
        erklaerung: 'Diabetes, Hypertonie und Alter sind Risikofaktoren. Unregelmäßiger Puls und Blässe sind aktuelle Zeichen, keine Risikofaktoren.',
      },
      {
        id: 'zeit', art: 'einfach', abschnitt: 'therapie',
        frage: 'Warum zählt beim Herzinfarkt jede Minute?',
        optionen: [r('Je länger das Gefäß verschlossen ist, desto mehr Herzmuskel stirbt ab („Time is muscle“)'), f('Weil der Notarzt sonst nicht mehr kommt'), f('Weil die Schmerzen sonst chronisch werden')],
        erklaerung: 'Ziel ist, das Gefäß per Herzkatheter so schnell wie möglich zu öffnen. Jede Minute ohne Durchblutung kostet Herzmuskel.',
      },
    ],
  },

  // ---------------------------------------------------------------- TVT
  {
    id: 'tvt-lange', krankheitId: 'kh.tvt', titel: 'Herr Lange, 66 Jahre', setting: 'Krankenhaus, Unfallchirurgie',
    text: [
      'Herr Lange liegt nach einer Unterschenkelfraktur mit Gips seit fünf Tagen überwiegend im Bett. Er trinkt wenig, weil er nicht ständig klingeln möchte.',
      'Heute klagt er über ein Spannungsgefühl im anderen, nicht eingegipsten Bein. Die Wade ist geschwollen, warm und leicht bläulich verfärbt.',
    ],
    aufgaben: [
      {
        id: 'virchow', art: 'mehrfach', abschnitt: 'ursachen',
        frage: 'Welche Faktoren der Virchow-Trias erkennst du bei Herrn Lange?',
        optionen: [r('Verlangsamter Blutfluss durch Immobilität'), r('Erhöhte Gerinnungsneigung durch zu wenig Trinken'), r('Gefäßwandschaden durch die Verletzung'), f('Zu hoher Blutdruck'), f('Zu viel Bewegung')],
        erklaerung: 'Virchow-Trias: Stase (Bettruhe, Gips), Gefäßwandschaden (Fraktur, Operation) und erhöhte Gerinnungsneigung (Exsikkose).',
      },
      {
        id: 'zeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Zeichen sprechen für eine tiefe Beinvenenthrombose?',
        optionen: [r('Einseitige Schwellung der Wade'), r('Überwärmung und bläuliche Verfärbung'), r('Spannungsgefühl'), f('Kaltes, blasses Bein ohne Puls'), f('Juckreiz am ganzen Körper')],
        erklaerung: 'Typisch sind einseitige Schwellung, Spannungs- und Schweregefühl, Überwärmung und bläulich-rote Verfärbung. Ein kaltes, blasses, pulsloses Bein spricht eher für einen arteriellen Verschluss.',
      },
      {
        id: 'vorgehen', art: 'einfach', abschnitt: 'pflege',
        frage: 'Was tust du bis zur ärztlichen Abklärung?',
        optionen: [r('Arzt informieren, Herrn Lange nicht mobilisieren lassen, bis entschieden ist, und auf Zeichen einer Lungenembolie achten'), f('Das Bein kräftig massieren, um das Gerinnsel zu lösen'), f('Ihn sofort zu einem Spaziergang auffordern')],
        erklaerung: 'Bei Thromboseverdacht ärztlich abklären lassen, nicht massieren. Auf plötzliche Atemnot, Brustschmerz und Herzrasen achten: Lungenembolie ist ein Notfall.',
      },
      {
        id: 'lungenembolie', art: 'mehrfach', abschnitt: 'komplikationen',
        frage: 'Welche Zeichen weisen auf eine Lungenembolie hin?',
        optionen: [r('Plötzliche Atemnot'), r('Brustschmerz'), r('Herzrasen'), f('Langsam zunehmender Appetit'), f('Weicher Stuhl')],
        erklaerung: 'Plötzliche Atemnot, Brustschmerz, Herzrasen und Husten sind Warnzeichen einer Lungenembolie.',
      },
      {
        id: 'kompression', art: 'einfach', abschnitt: 'prophylaxen', extraTopicIds: ['thema.pro.thrombose'],
        frage: 'Nach der Akutbehandlung verordnet der Arzt medizinische Kompressionsstrümpfe (MKS). Was setzt deren Wirkung voraus?',
        optionen: [r('Dass Herr Lange sich bewegt und mobil ist'), f('Dass er strenge Bettruhe einhält'), f('Nichts, sie wirken immer gleich')],
        erklaerung: 'MKS sind eine Therapie bei Venenleiden, ärztlich verordnet, und wirken nur, wenn der Mensch mobil ist. MTPS sind für immobile Menschen gedacht.',
      },
    ],
  },

  // ---------------------------------------------------------------- COPD
  {
    id: 'copd-wolf', krankheitId: 'kh.copd', titel: 'Herr Wolf, 69 Jahre', setting: 'Krankenhaus, Pneumologie',
    text: [
      'Herr Wolf hat 45 Jahre geraucht. Seit einer Erkältung vor vier Tagen hustet er mehr, der Auswurf ist gelb-grün, und schon der Weg zum Bad macht ihn atemlos. Er atmet mit gespitzten Lippen aus.',
      'Die Sättigung liegt bei 88 %. Er nimmt seit Jahren zwei Inhalationssprays. Du siehst, dass er beim Inhalieren gleichzeitig spricht und nicht die Luft anhält.',
    ],
    aufgaben: [
      {
        id: 'exazerbation', art: 'einfach', abschnitt: 'komplikationen',
        frage: 'Was liegt bei Herrn Wolf wahrscheinlich vor?',
        optionen: [r('Akute Exazerbation der COPD, ausgelöst durch einen Infekt'), f('Ein neu aufgetretenes Asthma'), f('Ein stabiler Verlauf ohne Handlungsbedarf')],
        erklaerung: 'Mehr Atemnot und mehr, verfärbter Auswurf nach einem Infekt sprechen für eine akute Exazerbation.',
      },
      {
        id: 'position', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Welche Maßnahmen erleichtern ihm das Atmen?',
        optionen: [r('Kutschersitz oder Torwartstellung'), r('Lippenbremse anleiten'), r('Oberkörperhochlagerung'), f('Flache Rückenlage'), f('Schnell und tief durch den Mund ein- und ausatmen lassen')],
        erklaerung: 'Atemerleichternde Positionen und die Lippenbremse verhindern, dass die Atemwege beim Ausatmen kollabieren.',
      },
      {
        id: 'sauerstoff', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie gibst du Sauerstoff?',
        optionen: [r('Nur nach ärztlicher Anordnung und in der verordneten Menge, Sättigung und Bewusstsein beobachten'), f('So viel wie möglich, bis die Sättigung 100 % beträgt'), f('Gar nicht, Sauerstoff ist bei COPD verboten')],
        erklaerung: 'Bei manchen Menschen mit COPD dämpfen hohe Sauerstoffgaben den Atemantrieb. Deshalb nur nach Anordnung, mit Zielwert, und gut beobachten.',
      },
      {
        id: 'inhalation', art: 'mehrfach', abschnitt: 'beratung',
        frage: 'Was berätst du zur Inhalation?',
        optionen: [r('Technik üben: ruhig ausatmen, tief einatmen, Luft kurz anhalten'), r('Nach dem Kortisonspray den Mund ausspülen'), f('Das Spray nur bei Atemnot verwenden, auch das Kortisonspray'), f('Während der Inhalation weitersprechen')],
        erklaerung: 'Die Inhalationstechnik entscheidet über die Wirkung. Kortisonsprays sind Dauertherapie; danach Mund ausspülen (Soorprophylaxe).',
      },
      {
        id: 'ursache', art: 'einfach', abschnitt: 'ursachen',
        frage: 'Was ist die wichtigste Ursache und zugleich die wichtigste Therapie?',
        optionen: [r('Rauchen; Rauchstopp'), f('Bewegungsmangel; Bettruhe'), f('Salzreiche Kost; Diät')],
        erklaerung: 'COPD entsteht vor allem durch Rauchen. Der Rauchstopp ist die wirksamste Maßnahme.',
      },
    ],
  },

  // ---------------------------------------------------------------- Pneumonie
  {
    id: 'pn-weber', krankheitId: 'kh.pneumonie', titel: 'Frau Weber, 88 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Frau Weber hat eine Demenz und verschluckt sich in letzter Zeit häufig beim Trinken. Seit gestern ist sie ungewohnt verwirrt, schläfrig und trinkt kaum.',
      'Die Temperatur ist 37,4 °C, die Atemfrequenz 26/min, die Sättigung 90 %. Sie hustet schwach.',
    ],
    aufgaben: [
      {
        id: 'untypisch', art: 'einfach', abschnitt: 'symptome',
        frage: 'Warum spricht die fehlende hohe Temperatur nicht gegen eine Pneumonie?',
        optionen: [r('Bei alten Menschen verläuft eine Pneumonie oft ohne Fieber, mit Verwirrtheit, Schwäche oder Trinkschwäche'), f('Ohne Fieber gibt es keine Pneumonie'), f('Die Temperatur wurde sicher falsch gemessen')],
        erklaerung: 'Im Alter sind die Zeichen oft untypisch. Neue Verwirrtheit, schnelle Atmung und niedrige Sättigung sind Warnzeichen.',
      },
      {
        id: 'form', art: 'einfach', abschnitt: 'formen',
        frage: 'Welche Form der Pneumonie ist bei Frau Weber besonders wahrscheinlich?',
        optionen: [r('Aspirationspneumonie'), f('Hypostatische Pneumonie nach Operation'), f('Pneumonie durch Hitze')],
        erklaerung: 'Sie verschluckt sich häufig. Gelangen Speichel oder Getränke in die Lunge, entsteht eine Aspirationspneumonie.',
      },
      {
        id: 'beobachten', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was beobachtest du engmaschig?',
        optionen: [r('Atemfrequenz und Sättigung'), r('Bewusstsein'), r('Temperatur und Flüssigkeitsbilanz'), f('Nur das Körpergewicht einmal pro Woche'), f('Die Haarfarbe')],
        erklaerung: 'Atemfrequenz, Sättigung, Temperatur und Bewusstsein zeigen eine Verschlechterung früh; Fieber und schnelle Atmung erhöhen den Flüssigkeitsbedarf.',
      },
      {
        id: 'aspiration', art: 'mehrfach', abschnitt: 'prophylaxen', extraTopicIds: ['thema.pro.aspiration'],
        frage: 'Welche Maßnahmen beugen weiteren Aspirationen vor?',
        optionen: [r('Aufrecht sitzend essen und trinken lassen'), r('Schluckfähigkeit einschätzen lassen und die Kostform anpassen'), r('Gute Mundpflege'), f('Im Liegen trinken lassen, damit sie sich nicht anstrengt'), f('Schnell anreichen, damit sie nicht ermüdet')],
        erklaerung: 'Aufrechte Position, angepasste Kost und Konsistenz, Zeit beim Anreichen und Mundpflege senken das Risiko einer erneuten Aspiration.',
      },
    ],
  },

  // ---------------------------------------------------------------- Diabetes
  {
    id: 'dm-kaya', krankheitId: 'kh.diabetes-typ2', titel: 'Frau Kaya, 76 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Frau Kaya hat Diabetes Typ 2 und spritzt vor den Mahlzeiten Normalinsulin. Heute hat sie das Mittagessen fast vollständig stehen lassen, das Insulin war schon gegeben.',
      'Am Nachmittag findest du sie zittrig, schweißnass und unruhig. Sie ist ansprechbar, aber fahrig. Der Blutzucker liegt bei 48 mg/dl.',
    ],
    aufgaben: [
      {
        id: 'erkennen', art: 'einfach', abschnitt: 'komplikationen',
        frage: 'Was liegt vor?',
        optionen: [r('Hypoglykämie'), f('Hyperglykämie'), f('Exsikkose')],
        erklaerung: 'Insulin gespritzt, aber nicht gegessen: Zittern, Schwitzen und Unruhe bei 48 mg/dl sind eine Unterzuckerung.',
      },
      {
        id: 'handeln', art: 'einfach', abschnitt: 'pflege',
        frage: 'Was tust du zuerst?',
        optionen: [r('Schnell wirksame Kohlenhydrate geben, z. B. Traubenzucker oder Saft, dann Arzt informieren und nachmessen'), f('Weiteres Insulin spritzen'), f('Sie hinlegen und schlafen lassen')],
        erklaerung: 'Bei Bewusstsein schnell wirksame Kohlenhydrate geben, Arzt informieren, Blutzucker kontrollieren. Bei Bewusstlosigkeit nichts in den Mund, Notruf.',
      },
      {
        id: 'fuss', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Bei der Körperpflege: Was gehört zur Fußbeobachtung bei Diabetes?',
        optionen: [r('Täglich auf Druckstellen und Verletzungen prüfen'), r('Zwischen den Zehen auf Pilz achten'), r('Schuhe auf Fremdkörper und Druckstellen prüfen'), f('Hornhaut mit einer Rasierklinge entfernen'), f('Füße mit einer Wärmflasche wärmen')],
        erklaerung: 'Wegen der Neuropathie werden Verletzungen oft nicht gespürt. Täglich inspizieren, vorsichtige Fußpflege, keine Verletzungsgefahr durch Klingen oder Hitze.',
      },
      {
        id: 'spaet', art: 'mehrfach', abschnitt: 'komplikationen',
        frage: 'Welche Spätfolgen des Diabetes kennst du?',
        optionen: [r('Retinopathie'), r('Nephropathie'), r('Neuropathie'), f('Schwerhörigkeit durch Lärm'), f('Karies durch Insulin')],
        erklaerung: 'Spätfolgen betreffen kleine und große Gefäße und Nerven: Augen, Nieren, Nerven, Herz, Gehirn, Beine, diabetisches Fußsyndrom.',
      },
      {
        id: 'spritzstelle', art: 'einfach', abschnitt: 'pflege',
        frage: 'Warum wechselst du die Spritzstellen?',
        optionen: [r('Um Verhärtungen im Unterhautfettgewebe (Lipohypertrophie) zu vermeiden, die die Insulinaufnahme verändern'), f('Damit das Insulin schneller wirkt'), f('Weil Insulin die Haut verfärbt')],
        erklaerung: 'Immer dieselbe Stelle führt zu Lipohypertrophie, dort wird Insulin unzuverlässig aufgenommen.',
      },
    ],
  },

  // ---------------------------------------------------------------- Exsikkose
  {
    id: 'ex-krause', krankheitId: 'kh.exsikkose', titel: 'Frau Krause, 86 Jahre', setting: 'Kurzzeitpflege',
    text: [
      'Frau Krause wiegt 55 kg und nimmt morgens ein Diuretikum. Sie trinkt wenig, „sonst muss ich nachts so oft raus und schaffe es nicht rechtzeitig“. Durst habe sie kaum.',
      'Ihre Stimme ist rau, die Zunge trocken und rissig, unter der Zunge ist kein Speichel zu sehen. Seit gestern ist sie zeitweise verwirrt. Die Urinmenge ist gering und dunkel.',
    ],
    aufgaben: [
      {
        id: 'risiko', art: 'mehrfach', abschnitt: 'risikofaktoren',
        frage: 'Welche Risikofaktoren für eine Exsikkose hat Frau Krause?',
        optionen: [r('Wenig Durstgefühl im Alter'), r('Diuretika'), r('Angst vor ungewolltem Harnverlust'), f('Zu viel Salz im Essen'), f('Hohe Körpertemperatur')],
        erklaerung: 'Typisch für ältere Menschen: geringerer Wasseranteil, wenig Durst, schwächere Nieren, Diuretika und die Angst vor Harnverlust.',
      },
      {
        id: 'zeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Beobachtungen sind Zeichen einer Exsikkose?',
        optionen: [r('Fehlender Speichelsee unter der Zunge'), r('Raue Stimme'), r('Verwirrtheit'), r('Wenig, dunkler Urin'), f('Feuchte Mundschleimhaut')],
        erklaerung: 'Fehlender Speichelsee, trockene rissige Zunge, raue Stimme, verminderte Urinmenge und Verwirrtheit sind Zeichen. Feuchte Schleimhaut spricht dagegen.',
      },
      {
        id: 'hautfalte', art: 'einfach', abschnitt: 'symptome',
        frage: 'Wie aussagekräftig ist bei Frau Krause eine stehende Hautfalte?',
        optionen: [r('Nur ein Hinweis, kein sicheres Zeichen, weil der Hautturgor im Alter ohnehin nachlässt'), f('Sie beweist die Exsikkose sicher'), f('Sie schließt eine Exsikkose aus, wenn sie fehlt')],
        erklaerung: 'Bei alten Menschen ist die stehende Hautfalte kein sicheres Zeichen.',
      },
      {
        id: 'bedarf', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie viel Flüssigkeit braucht Frau Krause nach der Faustregel 30–40 ml je kg, wenn nichts anderes angeordnet ist?',
        optionen: [r('Etwa 1.650 bis 2.200 ml am Tag'), f('Etwa 500 bis 800 ml am Tag'), f('Etwa 3.500 bis 4.000 ml am Tag')],
        erklaerung: '55 kg × 30 ml = 1.650 ml, 55 kg × 40 ml = 2.200 ml. Eine ärztliche Trinkmengenbegrenzung, z. B. bei Herzinsuffizienz, geht vor.',
      },
      {
        id: 'massnahmen', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Welche Maßnahmen passen zu Frau Krause?',
        optionen: [r('Bei jedem Kontakt zum Trinken animieren, Lieblingsgetränke anbieten'), r('Toilettengang erleichtern und die Angst vor Harnverlust ansprechen'), r('Ein- und Ausfuhrprotokoll führen'), f('Getränke nur zu den Mahlzeiten anbieten'), f('Das Diuretikum eigenmächtig weglassen')],
        erklaerung: 'Zufuhr sichern, Toilettengang ermöglichen und Intimsphäre wahren, Bilanz führen. Medikamente ändert nur der Arzt, die Beobachtung wird aber weitergegeben.',
      },
    ],
  },

  // ---------------------------------------------------------------- Schlaganfall
  {
    id: 'sa-neumann', krankheitId: 'kh.schlaganfall', titel: 'Herr Neumann, 77 Jahre', setting: 'Betreutes Wohnen',
    text: [
      'Beim Mittagessen fällt Herrn Neumann plötzlich die Gabel aus der rechten Hand. Sein rechter Mundwinkel hängt, er spricht verwaschen und findet die Wörter nicht. Es ist 12:10 Uhr.',
      'Er hat Vorhofflimmern und Bluthochdruck.',
    ],
    aufgaben: [
      {
        id: 'fast', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche FAST-Zeichen zeigt Herr Neumann?',
        optionen: [r('Face: hängender Mundwinkel'), r('Arms: Schwäche im rechten Arm'), r('Speech: verwaschene Sprache'), f('Fever: erhöhte Temperatur'), f('Fatigue: Müdigkeit nach dem Essen')],
        erklaerung: 'FAST: Face, Arms, Speech, Time. Bei einem dieser Zeichen sofort 112.',
      },
      {
        id: 'sofort', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was tust du?',
        optionen: [r('Sofort den Notruf 112 wählen'), r('Die Uhrzeit des Beginns festhalten'), r('Nichts mehr essen und trinken lassen'), f('Ihn erst einmal hinlegen und nach einer Stunde nachsehen'), f('Ein Glas Wasser geben, damit er besser sprechen kann')],
        erklaerung: 'Notruf, Zeitpunkt festhalten (entscheidend für Lyse oder Thrombektomie), wegen möglicher Schluckstörung nichts essen oder trinken lassen.',
      },
      {
        id: 'ursache', art: 'einfach', abschnitt: 'ursachen',
        frage: 'Welche Vorerkrankung erhöht vor allem das Risiko einer Embolie ins Gehirn?',
        optionen: [r('Vorhofflimmern'), f('Kurzsichtigkeit'), f('Arthrose')],
        erklaerung: 'Bei Vorhofflimmern können sich Gerinnsel im Herzen bilden und ins Gehirn verschleppt werden.',
      },
      {
        id: 'schlucken', art: 'einfach', abschnitt: 'pflege', extraTopicIds: ['thema.pro.aspiration'],
        frage: 'Nach der Akutbehandlung auf der Stroke Unit: Was muss vor dem ersten Essen passieren?',
        optionen: [r('Die Schluckfähigkeit wird geprüft (Schluckscreening)'), f('Nichts, er soll möglichst schnell normal essen'), f('Er bekommt zuerst eine Tasse Tee im Liegen')],
        erklaerung: 'Schluckstörungen sind nach Schlaganfall häufig. Erst Schluckscreening, dann angepasste Kost, aufrecht sitzend essen.',
      },
      {
        id: 'bobath', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie gestaltest du nach Bobath die Umgebung bei einer Lähmung rechts?',
        optionen: [r('Von der betroffenen Seite ansprechen und anfassen, die betroffene Seite einbeziehen'), f('Nur von der gesunden Seite ansprechen, damit er nicht überfordert ist'), f('Den gelähmten Arm unter der Decke verstecken')],
        erklaerung: 'Therapeutisch aktivierende Pflege nach Bobath fördert die Wahrnehmung der betroffenen Seite.',
      },
    ],
  },

  // ---------------------------------------------------------------- Demenz
  {
    id: 'dz-schmidt', krankheitId: 'kh.demenz', titel: 'Frau Schmidt, 81 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Frau Schmidt hat seit fünf Jahren eine Alzheimer-Demenz, im Mini-Mental-Status-Test hatte sie zuletzt 15 Punkte. Sie war Lehrerin.',
      'Am frühen Abend packt sie ihre Tasche, läuft zum Ausgang und sagt aufgeregt: „Ich muss in die Schule, die Kinder warten!“',
      'Seit zwei Tagen ruft sie nachts laut, verzieht beim Umlagern das Gesicht und hält sich die Hüfte. Fragen nach Schmerzen beantwortet sie nicht sinnvoll.',
    ],
    aufgaben: [
      {
        id: 'reaktion', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie reagierst du am Ausgang?',
        optionen: [r('Das Gefühl aufgreifen und bestätigen („Sie sind eine pflichtbewusste Lehrerin“), sie begleiten und behutsam umlenken'), f('Ihr erklären, dass sie seit Jahren in Rente ist und keine Schule hat'), f('Die Tür abschließen und sie ins Zimmer bringen')],
        erklaerung: 'Bei Hinlauftendenz nicht mit der Realität konfrontieren. Validation: Gefühle und Antriebe aussprechen und bestätigen, nicht korrigieren. Freiheitsentziehende Maßnahmen nur als allerletztes Mittel.',
      },
      {
        id: 'schmerz', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie schätzt du ihre Schmerzen ein?',
        optionen: [r('Mit einer Fremdeinschätzung wie BESD, weil keine verlässliche Selbstauskunft möglich ist'), f('Mit der NRS, sie soll eine Zahl von 0 bis 10 nennen'), f('Gar nicht, das Rufen gehört zur Demenz')],
        erklaerung: 'Die Selbstauskunft hat Vorrang. Ist sie nicht möglich, Fremdeinschätzung mit BESD. Herausforderndes Verhalten kann ein Hinweis auf Schmerzen sein.',
      },
      {
        id: 'kommunikation', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Welche Kommunikationsregeln passen bei Frau Schmidt?',
        optionen: [r('Augenkontakt und Ansprache mit Namen'), r('Kurze Sätze und geschlossene Fragen'), r('Brille und Hörgerät aufsetzen'), f('Warum-Fragen stellen, damit sie ihr Verhalten erklärt'), f('Mit Ironie die Situation auflockern')],
        erklaerung: 'Augenkontakt, Namen, kurze Sätze, geschlossene Fragen, keine Ironie. In der Validation keine Warum-Fragen.',
      },
      {
        id: 'mmst', art: 'einfach', abschnitt: 'diagnostik',
        frage: 'Wie viele Punkte sind im MMST höchstens möglich?',
        optionen: [r('30'), f('10'), f('100')],
        erklaerung: 'Der MMST prüft Orientierung, Merkfähigkeit, Aufmerksamkeit und Rechnen, Erinnerung und Sprache, höchstens 30 Punkte.',
      },
      {
        id: 'biografie', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Wie nutzt du ihre Biografie im Alltag?',
        optionen: [r('Vertraute Aufgaben anbieten, die zu ihrem Beruf passen, z. B. Vorlesen oder Hefte sortieren'), r('Rituale und Vorlieben aus dem Biografiebogen in den Tagesablauf einbauen'), f('Ihr ihre Fehler im Biografiebogen vorhalten'), f('Biografische Fragen wie ein Verhör stellen')],
        erklaerung: 'Biografiearbeit stärkt Identität und Wohlbefinden. Behutsam vorgehen, keine Verhöre.',
      },
    ],
  },

  // ---------------------------------------------------------------- Parkinson
  {
    id: 'pk-fischer', krankheitId: 'kh.parkinson', titel: 'Herr Fischer, 72 Jahre', setting: 'Krankenhaus, Chirurgie',
    text: [
      'Herr Fischer hat seit acht Jahren Morbus Parkinson und nimmt viermal täglich Levodopa zu festen Uhrzeiten. Er liegt nach einer Leistenbruch-OP auf der Station. Die Nachtschicht hat die 6-Uhr-Tablette vergessen.',
      'Um 8 Uhr ist er steif, kann sich kaum drehen, die Hände zittern stark, und er spricht sehr leise. Beim Gehen trippelt er und bleibt an der Tür wie festgeklebt stehen.',
    ],
    aufgaben: [
      {
        id: 'symptome', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Parkinson-Hauptsymptome erkennst du?',
        optionen: [r('Rigor (Steifheit)'), r('Tremor'), r('Akinese bzw. Bradykinese'), f('Fieber'), f('Halbseitenlähmung')],
        erklaerung: 'Hauptsymptome: Rigor, Tremor, Akinese bzw. Bradykinese und posturale Instabilität.',
      },
      {
        id: 'zeit', art: 'einfach', abschnitt: 'pflege',
        frage: 'Was lernst du aus der vergessenen Tablette?',
        optionen: [r('Parkinson-Medikamente müssen pünktlich nach Plan gegeben werden, sonst verschlechtert sich die Beweglichkeit deutlich'), f('Die Uhrzeit ist egal, Hauptsache die Tagesdosis stimmt'), f('Vor Operationen setzt man Levodopa immer ab')],
        erklaerung: 'Levodopa minutengenau geben. Abruptes Weglassen kann bis zur akinetischen Krise führen.',
      },
      {
        id: 'freezing', art: 'einfach', abschnitt: 'pflege',
        frage: 'Er bleibt an der Tür stehen (Freezing). Was hilft?',
        optionen: [r('Rhythmische Hilfen wie Zählen oder eine Linie am Boden, Gewicht verlagern'), f('Ihn kräftig nach vorn ziehen'), f('Ihn drängen, sich zu beeilen')],
        erklaerung: 'Rhythmische und optische Reize lösen die Blockade, Zug und Zeitdruck erhöhen die Sturzgefahr.',
      },
      {
        id: 'prophylaxen', art: 'mehrfach', abschnitt: 'prophylaxen', extraTopicIds: ['thema.pro.sturz'],
        frage: 'Welche Prophylaxen sind bei Parkinson besonders wichtig?',
        optionen: [r('Sturzprophylaxe'), r('Aspirationsprophylaxe'), r('Obstipationsprophylaxe'), f('Soorprophylaxe wegen Kortisonspray'), f('Zystitisprophylaxe wegen Zucker im Urin')],
        erklaerung: 'Gangstörung und Freezing (Sturz), Schluckstörung (Aspiration) und verlangsamte Darmbewegung (Obstipation) sind typisch.',
      },
    ],
  },

  // ---------------------------------------------------------------- Dekubitus
  {
    id: 'dk-roth', krankheitId: 'kh.dekubitus', titel: 'Herr Roth, 90 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Herr Roth ist seit einem Sturz vor drei Wochen fast nur noch im Bett. Er ist harninkontinent und isst kaum die Hälfte. Im Bett rutscht er immer wieder nach unten.',
      'Am Kreuzbein siehst du eine etwa handtellergroße Rötung. Die Haut ist intakt. Du drückst mit dem Finger darauf, die Rötung bleibt bestehen.',
    ],
    aufgaben: [
      {
        id: 'kategorie', art: 'einfach', abschnitt: 'formen',
        frage: 'Wie ordnest du den Befund ein?',
        optionen: [r('Dekubitus Kategorie 1'), f('Dekubitus Kategorie 3'), f('Kein Dekubitus, nur eine Druckrötung, die gleich vergeht')],
        erklaerung: 'Eine nicht wegdrückbare Rötung bei intakter Haut ist Kategorie 1 (positiver Fingertest).',
      },
      {
        id: 'risiko', art: 'mehrfach', abschnitt: 'risikofaktoren',
        frage: 'Welche Risikofaktoren hat Herr Roth?',
        optionen: [r('Eingeschränkte Mobilität'), r('Feuchtigkeit durch Inkontinenz'), r('Mangelnde Ernährung'), r('Scherkräfte durch Herunterrutschen'), f('Zu viel Bewegung im Bett')],
        erklaerung: 'Immobilität, Feuchtigkeit, Mangelernährung und Scherkräfte erhöhen das Risiko. Die Braden-Skala erfasst genau diese Bereiche.',
      },
      {
        id: 'massnahmen', art: 'mehrfach', abschnitt: 'pflege', extraTopicIds: ['thema.pro.dekubitus'],
        frage: 'Was planst du?',
        optionen: [r('Kreuzbein konsequent entlasten, individueller Bewegungsplan mit Positionswechseln'), r('Mikrolagerungen und 30-Grad-Seitenlage'), r('Haut täglich inspizieren und trocken halten'), f('Die Rötung kräftig einmassieren'), f('Ihn in Rückenlage flach liegen lassen, damit er nicht rutscht')],
        erklaerung: 'Druckentlastung und Bewegungsförderung sind der Kern. Massieren schädigt das Gewebe zusätzlich.',
      },
      {
        id: 'assessment', art: 'einfach', abschnitt: 'diagnostik',
        frage: 'Mit welchem Instrument schätzt du sein Dekubitusrisiko strukturiert ein?',
        optionen: [r('Braden-Skala'), f('Glasgow Coma Scale'), f('Mini-Mental-Status-Test')],
        erklaerung: 'Nach einem auffälligen Screening folgt die strukturierte Einschätzung, z. B. mit der Braden-Skala, zusammen mit der klinischen Beurteilung.',
      },
    ],
  },
  // ---------------------------------------------------------------- Harnwegsinfektion
  {
    id: 'hwi-fuchs', krankheitId: 'kh.hwi', titel: 'Frau Fuchs, 86 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Frau Fuchs ist sonst gut orientiert und kontinent. Seit gestern Abend findet sie ihr Zimmer nicht mehr, nestelt an der Bettdecke und hat zweimal eingenässt.',
      'Der Urin in der Vorlage ist trüb und riecht stark. Sie geht ständig zur Toilette, es kommen jeweils nur kleine Mengen. Laut Trinkprotokoll hat sie gestern nur 700 ml getrunken.',
      'Temperatur 37,9 °C, Puls 98/min, Blutdruck 125/70 mmHg, Atemfrequenz 18/min.',
    ],
    aufgaben: [
      {
        id: 'symptome', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Beobachtungen passen zu einer Harnwegsinfektion?',
        optionen: [r('Trüber, stark riechender Urin'), r('Häufiger Harndrang mit kleinen Mengen'), r('Neue Verwirrtheit und neue Inkontinenz'), f('Blutdruck 125/70 mmHg'), f('Sonst gut orientiert')],
        erklaerung: 'Trüber, übel riechender Urin und Pollakisurie sind typisch. Bei alten Menschen zeigt sich ein Harnwegsinfekt oft untypisch mit neuer Verwirrtheit oder Inkontinenz.',
      },
      {
        id: 'risiko', art: 'einfach', abschnitt: 'risikofaktoren',
        frage: 'Welcher Risikofaktor steht im Fall?',
        optionen: [r('Geringe Trinkmenge'), f('Blasendauerkatheter'), f('Männliches Geschlecht'), f('Intimpflege von vorn nach hinten')],
        erklaerung: '700 ml sind deutlich zu wenig. Eine geringe Trinkmenge fördert die Infektion. Intimpflege von vorn nach hinten ist richtig und kein Risiko.',
      },
      {
        id: 'urin', art: 'einfach', abschnitt: 'diagnostik',
        frage: 'Die Ärztin möchte eine Urinkultur. Wie gewinnst du die Probe bei Frau Fuchs?',
        optionen: [r('Als Mittelstrahlurin nach Intimpflege in ein steriles Gefäß'), f('Aus der nassen Vorlage auspressen'), f('Den ersten Strahl am Morgen auffangen')],
        erklaerung: 'Für die Urinkultur wird Mittelstrahlurin nach Reinigung gewonnen und rasch ins Labor gebracht oder gekühlt. Urin aus der Vorlage ist verunreinigt.',
      },
      {
        id: 'warnzeichen', art: 'mehrfach', abschnitt: 'komplikationen',
        frage: 'Welche Zeichen musst du sofort melden, weil sie auf eine Komplikation hinweisen?',
        optionen: [r('Schüttelfrost und steigendes Fieber'), r('Flankenschmerzen'), r('Atemfrequenz über 22/min und fallender Blutdruck'), f('Sie möchte Tee statt Wasser trinken')],
        erklaerung: 'Fieber, Schüttelfrost und Flankenschmerz sprechen für eine Pyelonephritis. Schnelle Atmung und niedriger Blutdruck können eine Urosepsis anzeigen: Notfall.',
      },
      {
        id: 'delir', art: 'einfach', abschnitt: 'prophylaxen', extraTopicIds: ['thema.pro.delir'],
        frage: 'Wie ordnest du die plötzliche Verwirrtheit ein?',
        optionen: [r('Wahrscheinlich ein Delir mit dem Harnwegsinfekt als Ursache: ärztlich abklären lassen'), f('Beginnende Demenz, die man beobachten kann'), f('Normale Alterserscheinung am Abend')],
        erklaerung: 'Plötzlich auftretende Verwirrtheit ist ein Delir, bis das Gegenteil bewiesen ist. Harnwegsinfekte sind eine häufige Ursache im Alter.',
      },
    ],
  },

  // ---------------------------------------------------------------- Sepsis
  {
    id: 'sep-wolf', krankheitId: 'kh.sepsis', titel: 'Herr Wolf, 72 Jahre', setting: 'Krankenhaus, Urologie, Spätdienst',
    text: [
      'Herr Wolf hat seit fünf Tagen einen Blasendauerkatheter. Im Frühdienst war er wach und hat Zeitung gelesen.',
      'Um 18 Uhr wirkt er schläfrig und antwortet verlangsamt. Er sagt: „Mir geht es so schlecht wie noch nie.“ Seine Hände sind kalt, die Knie marmoriert.',
      'Atemfrequenz 26/min, SpO2 93 % ohne Sauerstoff, Blutdruck 95/55 mmHg, Puls 118/min, Temperatur 38,9 °C. Im Urinbeutel sind seit dem Mittag 150 ml.',
    ],
    aufgaben: [
      {
        id: 'qsofa', art: 'mehrfach', abschnitt: 'diagnostik',
        frage: 'Welche qSOFA-Kriterien erfüllt Herr Wolf?',
        optionen: [r('Atemfrequenz ab 22/min'), r('Systolischer Blutdruck bis 100 mmHg'), r('Veränderter Bewusstseinszustand'), f('Temperatur über 38 °C'), f('Puls über 100/min')],
        erklaerung: 'qSOFA prüft Atemfrequenz ab 22/min, systolischen Blutdruck bis 100 mmHg und veränderten Bewusstseinszustand. Alle drei sind erfüllt, ab 2 besteht Sepsisverdacht. Fieber und Puls gehören nicht zu qSOFA, fließen aber in den NEWS2 ein.',
      },
      {
        id: 'handeln', art: 'einfach', abschnitt: 'pflege',
        frage: 'Was tust du als Erstes?',
        optionen: [r('Sofort ärztlich informieren bzw. Notfallteam rufen und bei ihm bleiben'), f('Fiebersenkendes Mittel aus dem Bedarf geben und in einer Stunde erneut messen'), f('In der Übergabe an den Nachtdienst weitergeben')],
        erklaerung: 'Sepsis ist ein zeitkritischer Notfall. Bei Verdacht sofort ärztlich informieren oder das Notfallteam rufen, nicht bis zur Visite warten.',
      },
      {
        id: 'quelle', art: 'einfach', abschnitt: 'ursachen',
        frage: 'Wo liegt der Ausgangspunkt der Sepsis am wahrscheinlichsten?',
        optionen: [r('Harnwege über den Blasenkatheter (Urosepsis)'), f('Lunge'), f('Haut an den Knien')],
        erklaerung: 'Ein liegender Blasenkatheter ist eine Eintrittspforte. Die Marmorierung der Knie ist ein Zeichen schlechter Durchblutung, keine Infektionsquelle.',
      },
      {
        id: 'zeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Beobachtungen zeigen eine gestörte Organdurchblutung?',
        optionen: [r('Kalte Hände und marmorierte Haut'), r('Wenig Urin seit dem Mittag'), r('Neue Schläfrigkeit'), f('Zeitung lesen im Frühdienst')],
        erklaerung: 'Kalte, marmorierte Haut, wenig Urin und Bewusstseinsveränderung zeigen, dass Organe schlecht durchblutet werden. Das unterscheidet die Sepsis von einer einfachen Infektion.',
      },
      {
        id: 'blutkultur', art: 'einfach', abschnitt: 'diagnostik',
        frage: 'Die Ärztin ordnet Blutkulturen und Antibiotika an. In welcher Reihenfolge?',
        optionen: [r('Erst Blutkulturen abnehmen, dann sofort die Antibiotika geben'), f('Erst Antibiotika, Blutkulturen am nächsten Morgen'), f('Antibiotika erst, wenn das Ergebnis der Blutkultur da ist')],
        erklaerung: 'Blutkulturen vor Beginn der Antibiotika, damit der Erreger nachweisbar bleibt. Die Antibiotika aber nicht verzögern: möglichst innerhalb der ersten Stunde.',
      },
    ],
  },

  // ---------------------------------------------------------------- Delir
  {
    id: 'del-kaiser', krankheitId: 'kh.delir', titel: 'Frau Kaiser, 83 Jahre', setting: 'Krankenhaus, Unfallchirurgie, Nachtdienst',
    text: [
      'Frau Kaiser wurde gestern an der Hüfte operiert. Laut Tochter lebt sie allein, kocht selbst und macht jeden Tag Kreuzworträtsel. Ihre Brille und das Hörgerät liegen noch in der Tasche.',
      'Um 2 Uhr versucht sie, über das Bettgitter zu klettern, und ruft, sie müsse die Kinder von der Schule abholen. Am Abend war sie noch ruhig und hat sich normal unterhalten.',
      'Sie hat seit der OP 400 ml getrunken und noch nicht Wasser gelassen. Ihr Schlafmittel von zu Hause wurde ihr am Abend gegeben.',
    ],
    aufgaben: [
      {
        id: 'abgrenzung', art: 'einfach', abschnitt: 'diagnostik',
        frage: 'Was spricht bei Frau Kaiser für ein Delir und gegen eine Demenz?',
        optionen: [r('Der plötzliche Beginn und der schwankende Verlauf'), f('Ihr hohes Alter'), f('Dass sie nachts unruhig ist')],
        erklaerung: 'Ein Delir beginnt akut und schwankt im Tagesverlauf. Eine Demenz entwickelt sich schleichend. Vor der OP war Frau Kaiser selbstständig und geistig fit.',
      },
      {
        id: 'ursachen', art: 'mehrfach', abschnitt: 'ursachen',
        frage: 'Welche möglichen Auslöser findest du im Fall?',
        optionen: [r('Operation und Narkose'), r('Zu geringe Trinkmenge'), r('Möglicher Harnverhalt'), r('Schlafmittel'), f('Kreuzworträtsel')],
        erklaerung: 'OP, Flüssigkeitsmangel, Harnverhalt und Medikamente wie Schlafmittel sind typische Delir-Auslöser. Kreuzworträtsel sind eine Ressource.',
      },
      {
        id: 'form', art: 'einfach', abschnitt: 'formen',
        frage: 'Welche Form des Delirs liegt vor?',
        optionen: [r('Hyperaktives Delir'), f('Hypoaktives Delir'), f('Kein Delir, sondern Heimweh')],
        erklaerung: 'Unruhe, Klettern und Halluzinationen sprechen für die hyperaktive Form. Die hypoaktive Form ist still und wird leicht übersehen.',
      },
      {
        id: 'massnahmen', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Welche Maßnahmen helfen Frau Kaiser jetzt?',
        optionen: [r('Brille und Hörgerät aufsetzen, sich mit Namen vorstellen, ruhig in kurzen Sätzen sprechen'), r('Ärztlich informieren, Blase und Trinkmenge prüfen lassen'), r('Licht gedämpft lassen, eine Uhr in Sichtweite stellen'), f('Sie fixieren, damit sie nicht aus dem Bett fällt'), f('Ihr erklären, dass ihre Kinder längst erwachsen sind, bis sie es einsieht')],
        erklaerung: 'Orientierungshilfen, Seh- und Hörhilfen und Ursachensuche helfen. Fixierung verschlimmert ein Delir und ist zu vermeiden. Streiten über die Realität verstärkt die Angst.',
      },
      {
        id: 'sturz', art: 'einfach', abschnitt: 'prophylaxen', extraTopicIds: ['thema.pro.sturz'],
        frage: 'Wie verringerst du das Sturzrisiko ohne freiheitsentziehende Maßnahme?',
        optionen: [r('Niedrigbett, Sensormatte und häufige Besuche, Tochter einbeziehen'), f('Bettgitter auf beiden Seiten hochstellen'), f('Ein zusätzliches Schlafmittel geben')],
        erklaerung: 'Bettgitter erhöhen die Fallhöhe, wenn jemand darüberklettert, und sind freiheitsentziehend. Zusätzliche Schlafmittel können das Delir verstärken.',
      },
    ],
  },

  // ---------------------------------------------------------------- Proximale Femurfraktur
  {
    id: 'fem-scholz', krankheitId: 'kh.femurfraktur', titel: 'Herr Scholz, 81 Jahre', setting: 'Ambulante Pflege, Hausbesuch',
    text: [
      'Herr Scholz liegt im Flur auf dem Boden, als du zum Hausbesuch kommst. Er ist auf dem Teppich ausgerutscht und auf die rechte Seite gefallen.',
      'Er klagt über starke Schmerzen in der rechten Leiste, NRS 8. Das rechte Bein ist kürzer als das linke und nach außen gedreht. Aufstehen kann er nicht.',
      'Herr Scholz hat eine Osteoporose und nimmt abends ein Schlafmittel. Er ist wach und orientiert.',
    ],
    aufgaben: [
      {
        id: 'verdacht', art: 'einfach', abschnitt: 'symptome',
        frage: 'Woran denkst du zuerst?',
        optionen: [r('Proximale Femurfraktur'), f('Prellung der Hüfte'), f('Muskelzerrung in der Leiste')],
        erklaerung: 'Sturz, Leistenschmerz, nicht belastbares, verkürztes und außenrotiertes Bein sind die typischen Zeichen einer hüftnahen Fraktur.',
      },
      {
        id: 'erstes', art: 'einfach', abschnitt: 'therapie',
        frage: 'Was tust du?',
        optionen: [r('Notruf 112, Bein nicht bewegen, Lage polstern, warm halten und bei ihm bleiben'), f('Ihm mit einer zweiten Person aufhelfen und ihn ins Bett bringen'), f('Hausärztin anrufen und einen Termin für morgen vereinbaren')],
        erklaerung: 'Bei Verdacht auf Fraktur nicht aufhelfen. Notruf, Bein in der vorgefundenen Lage polstern, Wärmeerhalt und Beobachtung. Operiert wird meist zeitnah.',
      },
      {
        id: 'risiko', art: 'mehrfach', abschnitt: 'risikofaktoren',
        frage: 'Welche Risikofaktoren für den Sturz und die Fraktur findest du?',
        optionen: [r('Osteoporose'), r('Schlafmittel'), r('Rutschiger Teppich'), f('Er ist orientiert')],
        erklaerung: 'Osteoporose macht den Knochen brüchig, Schlafmittel und Stolperfallen erhöhen das Sturzrisiko.',
      },
      {
        id: 'postop', art: 'mehrfach', abschnitt: 'komplikationen',
        frage: 'Nach der Operation: Auf welche Komplikationen achtest du besonders?',
        optionen: [r('Thrombose und Lungenembolie'), r('Delir'), r('Dekubitus an Fersen und Kreuzbein'), r('Pneumonie'), f('Hypertensive Krise durch die Narkose')],
        erklaerung: 'Immobilität, OP und hohes Alter machen Thrombose, Pneumonie, Dekubitus und Delir zu den wichtigsten Komplikationen.',
      },
      {
        id: 'mobil', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wann und wie beginnt die Mobilisation nach der OP?',
        optionen: [r('Früh, meist ab dem ersten Tag nach Anordnung, nach Schmerzmittelgabe und mit Physiotherapie'), f('Erst nach zwei Wochen Bettruhe, damit der Knochen heilt'), f('Sobald er keine Schmerzen mehr hat')],
        erklaerung: 'Frühmobilisation nach ärztlicher Belastungsvorgabe verhindert Komplikationen. Schmerzmittel rechtzeitig vorher geben, Bewegungseinschränkungen der Operateurin einhalten.',
      },
    ],
  },
  // ---------------------------------------------------------------- Asthma bronchiale
  {
    id: 'asthma-yilmaz', krankheitId: 'kh.asthma', titel: 'Lea Yilmaz, 19 Jahre', setting: 'Krankenhaus, Innere Medizin',
    text: [
      'Lea Yilmaz liegt nach einer Blinddarmoperation auf deiner Station. Sie hat seit der Kindheit ein allergisches Asthma und nutzt morgens und abends ein Kortisonspray, bei Bedarf ein Salbutamol-Spray.',
      'Am Abend klingelt sie. Sie sitzt vorgebeugt auf der Bettkante, stützt die Arme auf und atmet mit pfeifendem Geräusch aus. Sie spricht in kurzen Sätzen. Ihre Mitpatientin hat gerade einen großen Blumenstrauß bekommen.',
    ],
    aufgaben: [
      {
        id: 'zeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Beobachtungen passen zu einem Asthmaanfall?',
        optionen: [r('Pfeifendes Geräusch bei der Ausatmung'), r('Sie stützt die Arme auf'), r('Atemnot mit Sprechen in kurzen Sätzen'), f('Bellender Husten mit Stridor beim Einatmen'), f('Ruhiger, tiefer Schlaf')],
        erklaerung: 'Beim Asthma ist die Ausatmung erschwert (Giemen). Das Aufstützen setzt die Atemhilfsmuskulatur ein. Stridor beim Einatmen spricht eher für eine Verengung der oberen Atemwege, z. B. Pseudokrupp.',
      },
      {
        id: 'sofort', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was tust du sofort?',
        optionen: [r('Bei ihr bleiben und ruhig sprechen'), r('Lippenbremse anleiten'), r('Bedarfsspray nach Anordnung bzw. Notfallplan anwenden lassen'), r('Sättigung und Atemfrequenz messen'), f('Sie flach hinlegen, damit sie sich entspannt')],
        erklaerung: 'Ruhe, atemerleichternde Sitzposition, Lippenbremse und das Bedarfsmedikament helfen. Flach liegen verschlechtert die Atmung.',
      },
      {
        id: 'ausloeser', art: 'einfach', abschnitt: 'risikofaktoren',
        frage: 'Was könnte den Anfall ausgelöst haben?',
        optionen: [r('Der Blumenstrauß im Zimmer (Pollen)'), f('Das Kortisonspray am Morgen'), f('Die Bettruhe nach der Operation')],
        erklaerung: 'Bei allergischem Asthma sind Pollen typische Auslöser. Blumen sollten deshalb aus dem Zimmer.',
      },
      {
        id: 'warnzeichen', art: 'mehrfach', abschnitt: 'komplikationen',
        frage: 'Bei welchen Zeichen rufst du sofort die Ärztin bzw. das Notfallteam?',
        optionen: [r('Kaum noch hörbares Atemgeräusch („stille Lunge“)'), r('Blaue Lippen'), r('Sie kann nur noch einzelne Worte sprechen'), f('Sie hustet nach dem Spray etwas zähen Schleim ab')],
        erklaerung: 'Stille Lunge, Zyanose und Sprechen in Einzelworten sind Zeichen eines schweren, lebensbedrohlichen Anfalls.',
      },
      {
        id: 'kortison', art: 'einfach', abschnitt: 'beratung',
        frage: 'Was rätst du ihr zum Kortisonspray?',
        optionen: [r('Nach der Inhalation den Mund ausspülen und regelmäßig anwenden, auch ohne Beschwerden'), f('Nur bei Atemnot anwenden, weil es sofort wirkt'), f('Absetzen, sobald sie beschwerdefrei ist')],
        erklaerung: 'Inhalatives Kortison ist ein Dauermedikament gegen die Entzündung und wirkt nicht akut. Mundspülen beugt Soor vor.',
        extraTopicIds: ['thema.pro.soor'],
      },
    ],
  },
  // ---------------------------------------------------------------- pAVK
  {
    id: 'pavk-krause', krankheitId: 'kh.pavk', titel: 'Herr Krause, 67 Jahre', setting: 'Ambulante Pflege',
    text: [
      'Herr Krause ist langjähriger Raucher und hat Diabetes. Er erzählt, dass er beim Einkaufen alle 100 Meter stehen bleiben muss, weil die rechte Wade schmerzt. Nach einer kurzen Pause geht es wieder.',
      'Der rechte Fuß ist kühl und blass, am Unterschenkel fehlen die Haare. Seine Frau hat ihm eine Wärmflasche für die kalten Füße gekauft.',
    ],
    aufgaben: [
      {
        id: 'stadium', art: 'einfach', abschnitt: 'formen',
        frage: 'In welchem Stadium nach Fontaine befindet sich Herr Krause?',
        optionen: [r('Stadium IIb: schmerzfreie Gehstrecke unter 200 m'), f('Stadium I: keine Beschwerden'), f('Stadium III: Ruheschmerz'), f('Stadium IV: Nekrose')],
        erklaerung: 'Schmerzen beim Gehen, die in der Pause vergehen, sind Claudicatio intermittens (Stadium II). Unter 200 m schmerzfreie Gehstrecke ist IIb.',
      },
      {
        id: 'risiko', art: 'mehrfach', abschnitt: 'risikofaktoren',
        frage: 'Welche Risikofaktoren hat Herr Krause?',
        optionen: [r('Rauchen'), r('Diabetes mellitus'), f('Kalte Füße'), f('Einkaufen gehen')],
        erklaerung: 'Rauchen ist der wichtigste Risikofaktor, Diabetes beschleunigt die Arteriosklerose. Kalte Füße sind ein Symptom.',
      },
      {
        id: 'waerme', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie reagierst du auf die Wärmflasche?',
        optionen: [r('Davon abraten und warme Wollsocken empfehlen, weil Verbrennungsgefahr besteht'), f('Gut so, Wärme erweitert die Gefäße'), f('Wärmflasche nur nachts verwenden')],
        erklaerung: 'Schlecht durchblutete Haut verträgt Wärme schlecht, und Gefühlsstörungen (besonders bei Diabetes) erhöhen die Verbrennungsgefahr.',
      },
      {
        id: 'lage', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie lagerst du das Bein, wenn er sich ausruht?',
        optionen: [r('Flach oder leicht tief'), f('Hochgelagert auf einem Kissen'), f('Mit Kompressionsstrumpf und hochgelagert')],
        erklaerung: 'Bei arterieller Durchblutungsstörung das Bein nicht hochlagern. Hochlagern und Kompression gehören zur venösen Erkrankung.',
      },
      {
        id: 'beratung', art: 'mehrfach', abschnitt: 'beratung',
        frage: 'Wozu berätst du Herrn Krause?',
        optionen: [r('Rauchstopp mit Unterstützung'), r('Tägliches Gehtraining'), r('Tägliche Fußkontrolle'), f('Möglichst wenig gehen, um Schmerzen zu vermeiden')],
        erklaerung: 'Rauchstopp und Gehtraining verbessern die Gehstrecke. Die tägliche Fußkontrolle hilft, Wunden früh zu erkennen.',
      },
    ],
  },
  // ---------------------------------------------------------------- Epilepsie
  {
    id: 'epi-novak', krankheitId: 'kh.epilepsie', titel: 'Herr Novak, 45 Jahre', setting: 'Krankenhaus, Neurologie',
    text: [
      'Herr Novak hat seit einem Schädel-Hirn-Trauma eine Epilepsie. Er wurde aufgenommen, weil er seine Tabletten eine Woche lang nicht genommen hat.',
      'Beim Frühstück stößt er einen Schrei aus, wird steif, fällt vom Stuhl und beginnt am ganzen Körper rhythmisch zu zucken. Seine Lippen werden bläulich.',
    ],
    aufgaben: [
      {
        id: 'imanfall', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was tust du während des Anfalls?',
        optionen: [r('Uhrzeit notieren'), r('Stuhl und Gegenstände wegräumen, Kopf polstern'), r('Bei ihm bleiben und Hilfe rufen'), f('Arme und Beine festhalten'), f('Einen Beißkeil zwischen die Zähne schieben')],
        erklaerung: 'Schützen, nicht festhalten, nichts in den Mund. Die Zeit ist wichtig, um einen Status epilepticus zu erkennen.',
      },
      {
        id: 'form', art: 'einfach', abschnitt: 'formen',
        frage: 'Welche Anfallsform beschreibt der Fall?',
        optionen: [r('Generalisierter tonisch-klonischer Anfall'), f('Absence'), f('Fokaler Anfall ohne Bewusstseinsstörung')],
        erklaerung: 'Initialschrei, Bewusstlosigkeit, Verkrampfung und rhythmische Zuckungen am ganzen Körper sind typisch für den tonisch-klonischen Anfall.',
      },
      {
        id: 'danach', art: 'einfach', abschnitt: 'pflege',
        frage: 'Die Zuckungen hören nach zwei Minuten auf, Herr Novak ist nicht ansprechbar, atmet aber. Was tust du?',
        optionen: [r('Stabile Seitenlage, Atemwege frei, Vitalzeichen und Bewusstsein kontrollieren'), f('Ihm sofort etwas zu trinken geben'), f('Ihn aufsetzen und zum Bett gehen lassen')],
        erklaerung: 'In der Nachphase ist er schläfrig und verwirrt. Die Seitenlage schützt vor Aspiration. Erst trinken, wenn er wach ist und sicher schlucken kann.',
        extraTopicIds: ['thema.pro.aspiration'],
      },
      {
        id: 'notfall', art: 'einfach', abschnitt: 'komplikationen',
        frage: 'Ab wann spricht man von einem Status epilepticus?',
        optionen: [r('Anfall über 5 Minuten oder Anfälle ohne Erholung dazwischen'), f('Jeder Anfall mit Einnässen'), f('Anfall mit Zungenbiss')],
        erklaerung: 'Ein Status epilepticus ist ein Notfall: Notarzt und Notfallmedikament nach Anordnung.',
      },
      {
        id: 'ursache', art: 'einfach', abschnitt: 'risikofaktoren',
        frage: 'Was hat den Anfall am wahrscheinlichsten begünstigt?',
        optionen: [r('Die Antiepileptika wurden nicht genommen'), f('Das Frühstück'), f('Der Aufenthalt in der Neurologie')],
        erklaerung: 'Vergessene oder abgesetzte Antiepileptika sind einer der häufigsten Anfallsauslöser. Deshalb nie eigenmächtig absetzen.',
      },
    ],
  },
  // ---------------------------------------------------------------- Multiple Sklerose
  {
    id: 'ms-berger', krankheitId: 'kh.ms', titel: 'Frau Berger, 34 Jahre', setting: 'Krankenhaus, Neurologie',
    text: [
      'Frau Berger hat seit acht Jahren eine schubförmige MS. Seit drei Tagen sieht sie auf dem linken Auge verschwommen und hat ein Kribbeln im rechten Bein. Sie bekommt für drei Tage hochdosiert Kortison als Infusion.',
      'Sie erzählt, dass sie oft schon mittags völlig erschöpft ist. Nach dem heißen Duschen fühle sich ihr Bein schwächer an. Seit einiger Zeit muss sie häufig zur Toilette, und die Blase fühlt sich danach nicht leer an.',
    ],
    aufgaben: [
      {
        id: 'schub', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Beschwerden passen zu einem MS-Schub?',
        optionen: [r('Verschwommenes Sehen auf einem Auge'), r('Kribbeln im Bein'), f('Bellender Husten'), f('Fieber und Schüttelfrost')],
        erklaerung: 'Sehstörungen durch Entzündung des Sehnervs und Gefühlsstörungen sind typische Schubsymptome.',
      },
      {
        id: 'waerme', art: 'einfach', abschnitt: 'symptome',
        frage: 'Warum ist das Bein nach dem heißen Duschen schwächer?',
        optionen: [r('Wärme verstärkt bei MS vorübergehend die Beschwerden (Uhthoff-Phänomen)'), f('Durch einen neuen Schlaganfall'), f('Weil das Kortison nicht wirkt')],
        erklaerung: 'Beim Uhthoff-Phänomen leiten geschädigte Nervenfasern bei Wärme schlechter. Lauwarm duschen und Hitze meiden.',
      },
      {
        id: 'kortison', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Worauf achtest du während der Kortison-Stoßtherapie?',
        optionen: [r('Blutzucker'), r('Blutdruck'), r('Schlaf und Stimmung'), f('Gehtraining bis zur Erschöpfung')],
        erklaerung: 'Hochdosiertes Kortison kann Blutzucker und Blutdruck erhöhen und Schlafstörungen und Stimmungsschwankungen auslösen.',
      },
      {
        id: 'fatigue', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie gehst du mit ihrer Erschöpfung (Fatigue) um?',
        optionen: [r('Aktivitäten über den Tag verteilen und Pausen einplanen'), f('Alle Pflegemaßnahmen morgens am Stück erledigen'), f('Ihr alle Tätigkeiten abnehmen')],
        erklaerung: 'Energiemanagement mit Pausen erhält die Selbstständigkeit. Alles abnehmen würde Ressourcen verschwenden.',
      },
      {
        id: 'blase', art: 'einfach', abschnitt: 'prophylaxen', extraTopicIds: ['thema.pro.zystitis'],
        frage: 'Welches Risiko ergibt sich aus dem Gefühl, dass die Blase nicht leer ist?',
        optionen: [r('Harnwegsinfekte durch Restharn'), f('Exsikkose durch zu viel Trinken'), f('Dekubitus am Kreuzbein')],
        erklaerung: 'Eine Blasenentleerungsstörung mit Restharn begünstigt Harnwegsinfekte. Restharn ärztlich abklären lassen.',
      },
    ],
  },
  // ---------------------------------------------------------------- Depression
  {
    id: 'dep-lehmann', krankheitId: 'kh.depression', titel: 'Herr Lehmann, 76 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Herr Lehmann ist vor drei Monaten nach dem Tod seiner Frau eingezogen. Er bleibt fast den ganzen Tag im Zimmer, isst kaum und hat vier Kilo abgenommen. Früher hat er gern Schach gespielt, jetzt interessiert ihn nichts mehr.',
      'Er wacht jeden Morgen um vier Uhr auf. Beim Waschen sagt er leise: „Es wäre besser, wenn ich nicht mehr da wäre. Ich falle allen nur zur Last.“',
    ],
    aufgaben: [
      {
        id: 'symptome', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Beobachtungen passen zu einer Depression?',
        optionen: [r('Interessenverlust'), r('Früherwachen'), r('Appetitverlust mit Gewichtsabnahme'), r('Schuldgefühle („Ich falle allen zur Last“)'), f('Plötzliche Verwirrtheit seit gestern')],
        erklaerung: 'Interessenverlust, Schlafstörung mit Früherwachen, Appetitverlust und Schuldgefühle sind typisch. Plötzliche Verwirrtheit spricht eher für ein Delir.',
      },
      {
        id: 'suizid', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie reagierst du auf seine Aussage?',
        optionen: [r('Ruhig nachfragen, ob er daran denkt, sich etwas anzutun, und die Aussage sofort weitergeben'), f('„Ach, das wird schon wieder, Kopf hoch!“'), f('Das Thema wechseln, um ihn nicht auf Ideen zu bringen')],
        erklaerung: 'Suizidalität offen ansprechen. Nachfragen erhöht das Risiko nicht, sondern entlastet. Aufmunterungen wirken abwertend.',
      },
      {
        id: 'risiko', art: 'mehrfach', abschnitt: 'risikofaktoren',
        frage: 'Welche Risikofaktoren für eine Depression findest du bei ihm?',
        optionen: [r('Tod der Ehefrau'), r('Umzug ins Heim und Einsamkeit'), f('Er hat früher gern Schach gespielt'), f('Er wird morgens gewaschen')],
        erklaerung: 'Verlust und Einsamkeit sind wichtige Auslöser. Das frühere Hobby ist eine Ressource.',
      },
      {
        id: 'tag', art: 'einfach', abschnitt: 'pflege',
        frage: 'Welche Maßnahme ist sinnvoll?',
        optionen: [r('Tagesstruktur mit kleinen, erreichbaren Aktivitäten, z. B. eine Schachpartie anbieten'), f('Ihn zu einem großen Fest überreden, damit er auf andere Gedanken kommt'), f('Ihn in Ruhe lassen, bis er von selbst kommt')],
        erklaerung: 'Kleine Ziele ohne Überforderung und an früheren Interessen anknüpfen. Große Anforderungen überfordern, Rückzug verstärkt die Depression.',
        extraTopicIds: ['thema.pro.deprivation'],
      },
      {
        id: 'medikament', art: 'einfach', abschnitt: 'beratung',
        frage: 'Er bekommt seit einer Woche ein Antidepressivum und sagt, es helfe nicht. Was antwortest du?',
        optionen: [r('Die Wirkung setzt oft erst nach 2 bis 4 Wochen ein; bitte weiter nehmen und mit der Ärztin sprechen'), f('Dann kann er es gleich absetzen'), f('Antidepressiva machen abhängig, deshalb ist das gut so')],
        erklaerung: 'Antidepressiva wirken verzögert und machen nicht abhängig. Nicht eigenmächtig absetzen.',
      },
    ],
  },
  // ---------------------------------------------------------------- Schizophrenie
  {
    id: 'schizo-meier', krankheitId: 'kh.schizophrenie', titel: 'Herr Meier, 24 Jahre', setting: 'Psychiatrische Klinik',
    text: [
      'Herr Meier wurde aufgenommen, nachdem er sich tagelang in seiner Wohnung eingeschlossen hatte. Er ist überzeugt, dass die Nachbarn ihn über die Steckdosen abhören. Er hört Stimmen, die sein Verhalten kommentieren.',
      'Er hat in den letzten Monaten viel Cannabis geraucht. Auf Station sitzt er angespannt in der Ecke und beobachtet alle misstrauisch. Er bekommt seit zwei Tagen ein Antipsychotikum.',
    ],
    aufgaben: [
      {
        id: 'positiv', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Positivsymptome zeigt Herr Meier?',
        optionen: [r('Verfolgungswahn'), r('Stimmenhören'), f('Antriebsmangel'), f('Gefühlsverflachung')],
        erklaerung: 'Wahn und Halluzinationen sind Positivsymptome. Antriebsmangel und Gefühlsverflachung gehören zu den Negativsymptomen.',
      },
      {
        id: 'wahn', art: 'einfach', abschnitt: 'pflege',
        frage: 'Er sagt: „Die hören mich auch hier ab!“ Wie reagierst du?',
        optionen: [r('„Ich höre nichts, aber ich merke, dass Sie große Angst haben.“'), f('„Das ist doch Unsinn, hier hört Sie niemand ab.“'), f('„Ja, das kann sein, wir decken die Steckdosen ab.“')],
        erklaerung: 'Den Wahn weder ausreden noch bestätigen, sondern das Gefühl dahinter ansprechen.',
      },
      {
        id: 'umgang', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was hilft im Umgang mit ihm?',
        optionen: [r('Reizarme Umgebung mit Rückzugsmöglichkeit'), r('Kurze, klare Sätze ohne Ironie'), r('Verlässliche Absprachen'), f('Ihn mit vielen Mitpatienten in eine laute Gruppe setzen')],
        erklaerung: 'Ruhe, Klarheit und Verlässlichkeit geben Sicherheit. Viele Reize verstärken Angst und Misstrauen.',
      },
      {
        id: 'nw', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Auf welche Nebenwirkungen des Antipsychotikums achtest du?',
        optionen: [r('Bewegungsstörungen und Sitzunruhe'), r('Müdigkeit'), r('Gewichtszunahme'), f('Haarwachstum an den Händen')],
        erklaerung: 'Antipsychotika können Bewegungsstörungen, Sitzunruhe, Müdigkeit und Gewichtszunahme verursachen. Nebenwirkungen sind ein häufiger Grund, die Medikamente abzusetzen.',
      },
      {
        id: 'risiko', art: 'einfach', abschnitt: 'risikofaktoren',
        frage: 'Welcher Faktor im Fall erhöht das Risiko für eine Psychose?',
        optionen: [r('Cannabiskonsum'), f('Sein Alter von 24 Jahren allein'), f('Der Aufenthalt in der Klinik')],
        erklaerung: 'Cannabis, besonders in jungen Jahren, erhöht das Risiko und kann Rückfälle auslösen.',
      },
    ],
  },
  // ---------------------------------------------------------------- Alkoholentzug
  {
    id: 'alk-schulz', krankheitId: 'kh.alkohol', titel: 'Herr Schulz, 58 Jahre', setting: 'Krankenhaus, Unfallchirurgie',
    text: [
      'Herr Schulz wurde gestern mit einem gebrochenen Handgelenk aufgenommen. Bei der Aufnahme sagte er, er trinke „ab und zu ein Bier“.',
      'Heute Morgen, etwa 20 Stunden nach der Aufnahme, zittern seine Hände stark, er schwitzt, ist unruhig und will ständig aufstehen. Der Puls liegt bei 118/min, der Blutdruck bei 165/95 mmHg.',
    ],
    aufgaben: [
      {
        id: 'verdacht', art: 'einfach', abschnitt: 'symptome',
        frage: 'Woran denkst du zuerst?',
        optionen: [r('Alkoholentzugssyndrom'), f('Normale Aufregung vor der Operation'), f('Unterzuckerung durch das Frühstück')],
        erklaerung: 'Zittern, Schwitzen, Unruhe, schneller Puls und hoher Blutdruck einen Tag nach dem letzten Trinken sind typische Entzugszeichen. Konsumangaben werden oft untertrieben.',
      },
      {
        id: 'handeln', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was tust du?',
        optionen: [r('Ärztin sofort informieren'), r('Vitalzeichen, Bewusstsein und Orientierung engmaschig kontrollieren und dokumentieren'), r('Ruhige, gut beleuchtete Umgebung, Sturzgefahr bedenken'), f('Ihm ein Bier bringen lassen, damit er sich beruhigt'), f('Ihn vorwurfsvoll auf seine falschen Angaben ansprechen')],
        erklaerung: 'Ein Entzug muss ärztlich behandelt und engmaschig überwacht werden. Wertschätzend bleiben, Vorwürfe verhindern Vertrauen.',
      },
      {
        id: 'delir', art: 'mehrfach', abschnitt: 'komplikationen',
        frage: 'Welche Zeichen sprechen für ein beginnendes Delirium tremens?',
        optionen: [r('Er sieht kleine Tiere auf der Bettdecke'), r('Er weiß nicht mehr, wo er ist'), r('Fieber und starke Kreislaufschwankungen'), f('Er möchte telefonieren')],
        erklaerung: 'Halluzinationen, Desorientierung und vegetative Entgleisung zeigen ein Delirium tremens an: lebensbedrohlich, meist intensivpflichtig.',
        extraTopicIds: ['thema.pro.delir'],
      },
      {
        id: 'thiamin', art: 'einfach', abschnitt: 'therapie',
        frage: 'Warum bekommen alkoholkranke Menschen Vitamin B1 (Thiamin) nach Anordnung?',
        optionen: [r('Um einer Wernicke-Enzephalopathie durch Vitamin-B1-Mangel vorzubeugen'), f('Um den Alkohol schneller abzubauen'), f('Gegen das Zittern')],
        erklaerung: 'Vitamin-B1-Mangel ist bei Alkoholabhängigkeit häufig und kann eine Wernicke-Enzephalopathie auslösen; Thiamin wird vor einer Glukosegabe gegeben.',
      },
    ],
  },
  // ---------------------------------------------------------------- Chronische Niereninsuffizienz
  {
    id: 'ni-ozturk', krankheitId: 'kh.niereninsuffizienz', titel: 'Frau Öztürk, 70 Jahre', setting: 'Krankenhaus, Nephrologie',
    text: [
      'Frau Öztürk hat seit 20 Jahren Diabetes und Bluthochdruck. Ihre Nieren arbeiten kaum noch, sie geht dreimal pro Woche zur Hämodialyse. Am linken Unterarm hat sie einen Shunt.',
      'Heute wiegt sie 2,5 kg mehr als nach der letzten Dialyse, die Knöchel sind geschwollen. Sie klagt über starken Juckreiz und großen Durst. Ihre Trinkmenge ist auf 750 ml pro Tag begrenzt.',
    ],
    aufgaben: [
      {
        id: 'shunt', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was beachtest du am linken Arm?',
        optionen: [r('Kein Blutdruck messen'), r('Keine Blutentnahme und keine Infusion'), r('Täglich auf Schwirren prüfen'), f('Einen festen Verband anlegen, um den Shunt zu schützen')],
        erklaerung: 'Der Shunt ist ihre Lebensader für die Dialyse. Druck, Einstiche und Einschnürungen können ihn verschließen.',
      },
      {
        id: 'ursache', art: 'mehrfach', abschnitt: 'ursachen',
        frage: 'Welche Ursachen der Niereninsuffizienz kommen bei ihr infrage?',
        optionen: [r('Diabetes mellitus'), r('Arterielle Hypertonie'), f('Juckreiz'), f('Der Shunt')],
        erklaerung: 'Diabetes und Bluthochdruck sind die häufigsten Ursachen einer chronischen Niereninsuffizienz.',
      },
      {
        id: 'gewicht', art: 'einfach', abschnitt: 'pflege',
        frage: 'Was bedeutet die Gewichtszunahme von 2,5 kg?',
        optionen: [r('Sie hat Wasser eingelagert; das muss mit der nächsten Dialyse entzogen werden'), f('Sie isst zu viel'), f('Die Waage ist falsch eingestellt')],
        erklaerung: 'Die Gewichtszunahme zwischen zwei Dialysen ist fast nur Flüssigkeit. Deshalb täglich wiegen und die Trinkmenge einhalten.',
      },
      {
        id: 'durst', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie kannst du den Durst lindern, ohne die Trinkmenge zu überschreiten?',
        optionen: [r('Mundpflege und Eiswürfel, die in die erlaubte Menge eingerechnet werden'), f('Ein zusätzliches Glas Wasser, weil sie so durstig ist'), f('Salzige Snacks gegen das Durstgefühl')],
        erklaerung: 'Mundpflege und gelutschte Eiswürfel stillen den Durst mit wenig Flüssigkeit. Salz verstärkt den Durst.',
        extraTopicIds: ['thema.pro.soor'],
      },
      {
        id: 'kalium', art: 'einfach', abschnitt: 'komplikationen',
        frage: 'Warum soll sie kaliumreiche Lebensmittel wie Bananen meiden?',
        optionen: [r('Eine Hyperkaliämie kann gefährliche Herzrhythmusstörungen auslösen'), f('Kalium erhöht den Blutzucker'), f('Kalium verursacht den Juckreiz')],
        erklaerung: 'Die kranke Niere scheidet Kalium schlecht aus. Zu viel Kalium im Blut stört die Herzaktion.',
      },
    ],
  },
  // ---------------------------------------------------------------- Leberzirrhose
  {
    id: 'lz-koenig', krankheitId: 'kh.leberzirrhose', titel: 'Herr König, 61 Jahre', setting: 'Krankenhaus, Gastroenterologie',
    text: [
      'Herr König hat nach jahrelangem Alkoholkonsum eine Leberzirrhose. Sein Bauch ist stark gewölbt, die Haut und die Augen sind gelblich, an Armen und Beinen hat er blaue Flecken.',
      'Heute wirkt er schläfrig und antwortet verlangsamt. Seine Hände zittern grob, wenn er sie ausstreckt. Er hatte seit drei Tagen keinen Stuhlgang.',
    ],
    aufgaben: [
      {
        id: 'zeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Zeichen der Leberzirrhose erkennst du?',
        optionen: [r('Aszites (gewölbter Bauch)'), r('Ikterus'), r('Blutungsneigung (blaue Flecken)'), f('Bellender Husten')],
        erklaerung: 'Aszites, Gelbsucht und Blutungsneigung zeigen, dass die Leber ihre Aufgaben nicht mehr erfüllt.',
      },
      {
        id: 'enzephalopathie', art: 'einfach', abschnitt: 'komplikationen',
        frage: 'Woran denkst du bei Schläfrigkeit und grobem Händezittern?',
        optionen: [r('Hepatische Enzephalopathie'), f('Normale Müdigkeit nach dem Mittagessen'), f('Unterzuckerung durch zu viel Insulin')],
        erklaerung: 'Giftstoffe wie Ammoniak, die die Leber nicht mehr abbaut, schädigen das Gehirn. Der Flapping Tremor ist typisch.',
      },
      {
        id: 'stuhl', art: 'einfach', abschnitt: 'therapie',
        frage: 'Warum ist der fehlende Stuhlgang wichtig?',
        optionen: [r('Verstopfung fördert die hepatische Enzephalopathie; Lactulose nach Anordnung sorgt für regelmäßigen Stuhlgang'), f('Er hat nichts mit der Leber zu tun'), f('Weil Stuhlgang die Gelbsucht verstärkt')],
        erklaerung: 'Im Darm entsteht Ammoniak. Lactulose beschleunigt die Darmpassage und senkt die Ammoniakbildung.',
        extraTopicIds: ['thema.pro.obstipation'],
      },
      {
        id: 'messen', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Welche Beobachtungen und Messungen gehören täglich dazu?',
        optionen: [r('Gewicht'), r('Bauchumfang an gleicher Stelle'), r('Bewusstsein und Orientierung'), f('Augeninnendruck')],
        erklaerung: 'Gewicht und Bauchumfang zeigen den Verlauf des Aszites, Bewusstsein und Orientierung den Verlauf der Enzephalopathie.',
      },
      {
        id: 'blutung', art: 'einfach', abschnitt: 'pflege',
        frage: 'Herr König erbricht plötzlich schwallartig Blut. Was tust du?',
        optionen: [r('Notruf, Seitenlage bzw. Oberkörper hoch, Vitalzeichen kontrollieren, nicht allein lassen'), f('Ihm Wasser zum Ausspülen geben und die Visite abwarten'), f('Ihn zur Toilette begleiten')],
        erklaerung: 'Eine Ösophagusvarizenblutung ist ein lebensbedrohlicher Notfall mit Schockgefahr.',
      },
    ],
  },
  // ---------------------------------------------------------------- Kolorektales Karzinom
  {
    id: 'krk-fischer', krankheitId: 'kh.kolorektales-karzinom', titel: 'Frau Fischer, 63 Jahre', setting: 'Krankenhaus, Viszeralchirurgie',
    text: [
      'Bei Frau Fischer wurde ein Rektumkarzinom entfernt. Sie hat seit der Operation vor drei Tagen ein Kolostoma. Im Vorfeld hatte sie monatelang Blut im Stuhl bemerkt, dachte aber an Hämorrhoiden.',
      'Beim Versorgungswechsel dreht sie den Kopf weg und sagt: „Das kann ich mir nicht ansehen. So will mich doch keiner mehr.“',
    ],
    aufgaben: [
      {
        id: 'stoma', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie sieht ein gesundes Stoma aus?',
        optionen: [r('Rosig-rot, feucht und glänzend'), f('Dunkelblau bis schwarz'), f('Blass und trocken')],
        erklaerung: 'Ein gesundes Stoma ist rosig-rot und feucht. Dunkle oder blasse Verfärbung zeigt eine Durchblutungsstörung und muss sofort gemeldet werden.',
      },
      {
        id: 'symptome', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Warnzeichen eines Darmkrebses gibt es?',
        optionen: [r('Blut im Stuhl'), r('Wechsel von Durchfall und Verstopfung'), r('Ungewollte Gewichtsabnahme'), f('Gerötete Handflächen')],
        erklaerung: 'Blut im Stuhl, veränderte Stuhlgewohnheiten und Gewichtsabnahme gehören ärztlich abgeklärt, auch wenn man Hämorrhoiden vermutet.',
      },
      {
        id: 'koerperbild', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie reagierst du auf ihre Aussage?',
        optionen: [r('Ihre Gefühle ernst nehmen, Gesprächsbereitschaft zeigen und Kontakt zur Stomatherapie und Selbsthilfe anbieten'), f('„Daran gewöhnen Sie sich schnell, das ist doch nicht schlimm.“'), f('Die Versorgung schweigend zu Ende bringen')],
        erklaerung: 'Ein Stoma verändert das Körperbild. Gefühle ernst nehmen, Zeit lassen und Hilfen wie Stomatherapie und Selbsthilfegruppen vermitteln.',
      },
      {
        id: 'postop', art: 'mehrfach', abschnitt: 'prophylaxen',
        frage: 'Welche Prophylaxen sind nach der Bauchoperation besonders wichtig?',
        optionen: [r('Thromboseprophylaxe'), r('Pneumonieprophylaxe'), f('Kontrakturenprophylaxe der Finger'), f('Soorprophylaxe nur bei Zahnprothese')],
        erklaerung: 'Tumorerkrankung und Operation erhöhen das Thromboserisiko, Schmerzen führen zu Schonatmung.',
        extraTopicIds: ['thema.pro.thrombose'],
      },
      {
        id: 'chemo', art: 'einfach', abschnitt: 'beratung',
        frage: 'Sie soll später eine Chemotherapie bekommen. Welche Information ist wichtig?',
        optionen: [r('Fieber während der Chemotherapie sofort melden'), f('Fieber ist eine harmlose Nebenwirkung'), f('Mundpflege ist während der Chemotherapie unwichtig')],
        erklaerung: 'Unter Chemotherapie kann die Abwehr stark sinken. Fieber kann eine lebensbedrohliche Infektion anzeigen.',
      },
    ],
  },
  // ---------------------------------------------------------------- Fieberkrampf
  {
    id: 'fk-mia', krankheitId: 'kh.fieberkrampf', titel: 'Mia, 2 Jahre', setting: 'Kinderklinik, Notaufnahme',
    text: [
      'Mia hat seit gestern Schnupfen und heute Mittag 39,6 °C Fieber. Auf dem Arm ihrer Mutter verdreht sie plötzlich die Augen, wird steif und zuckt mit Armen und Beinen. Ihre Lippen werden bläulich.',
      'Nach zwei Minuten hört der Anfall auf, Mia ist danach sehr müde. Die Mutter weint und fragt, ob Mia jetzt Epilepsie hat. Mias Vater hatte als Kind ebenfalls Fieberkrämpfe.',
    ],
    aufgaben: [
      {
        id: 'handeln', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was tust du während des Anfalls?',
        optionen: [r('Uhrzeit notieren'), r('Mia auf eine weiche Unterlage legen und vor Verletzungen schützen'), r('Ruhe bewahren und bei ihr bleiben'), f('Mia festhalten, damit die Zuckungen aufhören'), f('Mia kalt abduschen')],
        erklaerung: 'Schützen, nicht festhalten, Zeit messen. Danach stabile Seitenlage und Atmung beobachten.',
      },
      {
        id: 'form', art: 'einfach', abschnitt: 'formen',
        frage: 'Um welche Form handelt es sich wahrscheinlich?',
        optionen: [r('Einfacher Fieberkrampf: generalisiert, kürzer als 15 Minuten'), f('Komplizierter Fieberkrampf'), f('Status epilepticus')],
        erklaerung: 'Ein kurzer, generalisierter, einmaliger Anfall bei Fieber ist ein einfacher Fieberkrampf.',
      },
      {
        id: 'mutter', art: 'einfach', abschnitt: 'beratung',
        frage: 'Was sagst du der Mutter?',
        optionen: [r('Fieberkrämpfe sind in diesem Alter häufig und meist harmlos; der erste Krampf wird aber immer ärztlich abgeklärt'), f('Mia hat jetzt sicher Epilepsie'), f('Wenn sie das Fieber immer sofort senkt, kann das nie wieder passieren')],
        erklaerung: 'Ein einfacher Fieberkrampf hat eine gute Prognose. Fiebersenkung lindert Beschwerden, verhindert aber einen erneuten Krampf nicht sicher.',
      },
      {
        id: 'risiko', art: 'mehrfach', abschnitt: 'risikofaktoren',
        frage: 'Welche Risikofaktoren hat Mia?',
        optionen: [r('Alter zwischen 6 Monaten und 5 Jahren'), r('Fieberkrämpfe beim Vater'), f('Sie wurde auf dem Arm getragen')],
        erklaerung: 'Das Alter und die familiäre Veranlagung erhöhen das Risiko.',
      },
      {
        id: 'abklaeren', art: 'einfach', abschnitt: 'komplikationen',
        frage: 'Was muss die Ärztin ausschließen?',
        optionen: [r('Eine Hirnhautentzündung (Meningitis)'), f('Eine Blinddarmentzündung'), f('Einen Armbruch')],
        erklaerung: 'Hinter einem Krampf mit Fieber kann eine Meningitis stecken. Sie muss vor allem beim ersten Anfall ausgeschlossen werden.',
      },
    ],
  },
  // ---------------------------------------------------------------- Pseudokrupp
  {
    id: 'pk-jonas', krankheitId: 'kh.pseudokrupp', titel: 'Jonas, 18 Monate', setting: 'Kinderklinik',
    text: [
      'Jonas hat seit zwei Tagen Schnupfen. In der Nacht wacht er mit einem bellenden Husten auf, ist heiser und atmet beim Einatmen pfeifend. Er weint und klammert sich an seinen Vater.',
      'In der Klinik misst du eine Sättigung von 95 % und eine Temperatur von 38,1 °C. Am Hals siehst du leichte Einziehungen.',
    ],
    aufgaben: [
      {
        id: 'zeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Zeichen sind typisch für Pseudokrupp?',
        optionen: [r('Bellender Husten'), r('Inspiratorischer Stridor'), r('Heiserkeit'), f('Giemen bei der Ausatmung'), f('Hohes Fieber über 40 °C mit Speichelfluss')],
        erklaerung: 'Bellender Husten, Heiserkeit und Stridor beim Einatmen sind typisch. Giemen passt zum Asthma, hohes Fieber mit Speichelfluss zur Epiglottitis.',
      },
      {
        id: 'beruhigen', art: 'einfach', abschnitt: 'pflege',
        frage: 'Was ist die wichtigste erste Maßnahme?',
        optionen: [r('Jonas auf dem Arm des Vaters beruhigen und aufrecht halten'), f('Jonas zum Messen flach auf die Liege legen'), f('Sofort mit einem Spatel in den Rachen schauen')],
        erklaerung: 'Aufregung verstärkt die Atemnot. Aufrecht auf dem Arm einer Bezugsperson ist er am ruhigsten.',
      },
      {
        id: 'therapie', art: 'einfach', abschnitt: 'therapie',
        frage: 'Welches Medikament wird bei Pseudokrupp typischerweise ärztlich verordnet?',
        optionen: [r('Kortison, z. B. als Zäpfchen oder Saft'), f('Ein Antibiotikum'), f('Ein Hustenstiller')],
        erklaerung: 'Kortison lässt die Schleimhaut abschwellen. Ursache ist meist ein Virus, deshalb helfen Antibiotika nicht.',
      },
      {
        id: 'epiglottitis', art: 'mehrfach', abschnitt: 'komplikationen',
        frage: 'Welche Zeichen sprechen eher für eine lebensbedrohliche Epiglottitis?',
        optionen: [r('Hohes Fieber'), r('Kloßige Sprache'), r('Speichelfluss, das Kind will nicht schlucken'), f('Bellender Husten nach Schnupfen')],
        erklaerung: 'Bei Verdacht auf Epiglottitis nicht in den Rachen schauen, Kind sitzen lassen, sofort ärztliche Hilfe.',
      },
      {
        id: 'zuhause', art: 'mehrfach', abschnitt: 'beratung',
        frage: 'Was rätst du den Eltern für einen erneuten Anfall zu Hause?',
        optionen: [r('Ruhe bewahren und das Kind aufrecht halten'), r('Kühle frische Luft am offenen Fenster'), r('Notruf bei Atemnot in Ruhe oder blauen Lippen'), f('Das Kind in ein heißes Bad setzen')],
        erklaerung: 'Beruhigen, aufrechte Haltung und kühle Luft helfen. Alarmzeichen erfordern den Notruf.',
      },
    ],
  },
  // ---------------------------------------------------------------- Osteoporose
  {
    id: 'osteo-wagner', krankheitId: 'kh.osteoporose', titel: 'Frau Wagner, 81 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Frau Wagner ist in den letzten Jahren um 6 cm kleiner geworden und hat einen Rundrücken. Sie nimmt seit Jahren Kortison wegen einer rheumatischen Erkrankung. Vor zwei Jahren hatte sie nach einem leichten Sturz einen Handgelenksbruch.',
      'Seit kurzem bekommt sie einmal pro Woche Alendronsäure und täglich Vitamin D. Sie traut sich kaum noch, allein zu gehen.',
    ],
    aufgaben: [
      {
        id: 'risiko', art: 'mehrfach', abschnitt: 'risikofaktoren',
        frage: 'Welche Risikofaktoren für Osteoporose hat Frau Wagner?',
        optionen: [r('Langzeittherapie mit Kortison'), r('Hohes Alter'), r('Weibliches Geschlecht'), f('Rundrücken')],
        erklaerung: 'Kortison, Alter und Geschlecht erhöhen das Risiko. Der Rundrücken ist eine Folge der Osteoporose.',
      },
      {
        id: 'zeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Beobachtungen sind Zeichen der Osteoporose?',
        optionen: [r('Abnahme der Körpergröße'), r('Rundrücken'), r('Bruch nach leichtem Sturz'), f('Kribbeln in den Händen')],
        erklaerung: 'Wirbelkörpereinbrüche lassen die Körpergröße schrumpfen und führen zum Rundrücken. Brüche nach geringem Trauma sind typisch.',
      },
      {
        id: 'alendron', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie gibst du die Alendronsäure richtig?',
        optionen: [r('Morgens nüchtern mit einem großen Glas Leitungswasser, danach aufrecht bleiben'), f('Zum Frühstück mit Milch'), f('Abends im Liegen, damit sie besser schläft')],
        erklaerung: 'Nahrung und Milch verhindern die Aufnahme. Aufrecht bleiben schützt die Speiseröhre vor Reizungen.',
      },
      {
        id: 'sturz', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Wie förderst du ihre Sicherheit und Mobilität?',
        optionen: [r('Sturzrisiko einschätzen und Stolperfallen beseitigen'), r('Mit Hilfsmittel und Begleitung zum Gehen ermutigen'), r('Hüftprotektoren anbieten'), f('Sie möglichst im Rollstuhl lassen, damit sie nicht stürzt')],
        erklaerung: 'Bewegung stärkt Knochen und Muskeln. Immobilisierung erhöht langfristig das Sturz- und Frakturrisiko.',
        extraTopicIds: ['thema.pro.sturz'],
      },
      {
        id: 'ernaehrung', art: 'einfach', abschnitt: 'beratung',
        frage: 'Welche Ernährungsempfehlung passt?',
        optionen: [r('Kalziumreich: Milchprodukte, grünes Gemüse, kalziumreiches Mineralwasser'), f('Möglichst wenig Eiweiß'), f('Viel Kaffee und Cola')],
        erklaerung: 'Kalzium und ausreichend Eiweiß unterstützen den Knochen. Vitamin D entsteht zusätzlich durch Aufenthalt im Freien.',
      },
    ],
  },
  // ---------------------------------------------------------------- Lungenembolie
  {
    id: 'le-roth', krankheitId: 'kh.lungenembolie', titel: 'Frau Roth, 72 Jahre', setting: 'Krankenhaus, Orthopädie',
    text: [
      'Frau Roth hat vor vier Tagen ein neues Kniegelenk bekommen. Sie hat die Mobilisation wegen Schmerzen oft abgelehnt und die Thrombosespritze gestern vergessen.',
      'Beim ersten Gang zur Toilette bekommt sie plötzlich starke Luftnot und Schmerzen in der Brust beim Einatmen. Sie ist blass, schwitzt und sagt: „Ich habe Angst.“ Puls 124/min, Sättigung 86 %.',
    ],
    aufgaben: [
      {
        id: 'verdacht', art: 'einfach', abschnitt: 'symptome',
        frage: 'Woran denkst du zuerst?',
        optionen: [r('Lungenembolie'), f('Panikattacke wegen der Schmerzen'), f('Kreislaufschwäche nach dem Aufstehen, die sich von selbst gibt')],
        erklaerung: 'Plötzliche Atemnot, atemabhängige Brustschmerzen, Herzrasen und Sättigungsabfall nach OP und Immobilität sprechen für eine Lungenembolie.',
      },
      {
        id: 'handeln', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was tust du?',
        optionen: [r('Notfallteam rufen und bei ihr bleiben'), r('Hinsetzen lassen bzw. ins Bett mit erhöhtem Oberkörper, nicht weiterlaufen lassen'), r('Sauerstoff nach Anordnung, Vitalzeichen überwachen'), f('Sie zur Toilette begleiten, damit sie sich beruhigt'), f('Das Bein massieren, um die Durchblutung zu fördern')],
        erklaerung: 'Anstrengung vermeiden, Oberkörper hoch, Notfallteam. Massagen am Bein können weitere Gerinnsel lösen.',
      },
      {
        id: 'risiko', art: 'mehrfach', abschnitt: 'risikofaktoren',
        frage: 'Welche Risikofaktoren hatte Frau Roth?',
        optionen: [r('Knie-Operation'), r('Wenig Bewegung nach der OP'), r('Vergessene Thrombosespritze'), f('Angst')],
        erklaerung: 'Operationen am Bein, Immobilität und eine lückenhafte Thromboseprophylaxe begünstigen eine Thrombose, aus der die Embolie entsteht.',
        extraTopicIds: ['thema.pro.thrombose'],
      },
      {
        id: 'therapie', art: 'einfach', abschnitt: 'therapie',
        frage: 'Welche Behandlung ist typisch?',
        optionen: [r('Antikoagulation nach ärztlicher Anordnung, bei massiver Embolie ggf. Thrombolyse'), f('Ein Antibiotikum'), f('Ein Diuretikum zur Entwässerung')],
        erklaerung: 'Antikoagulanzien verhindern das Wachsen des Gerinnsels und neue Embolien, eine Lyse kann es auflösen.',
      },
      {
        id: 'blutung', art: 'mehrfach', abschnitt: 'beratung',
        frage: 'Sie soll zu Hause ein Antikoagulans nehmen. Welche Blutungszeichen soll sie kennen?',
        optionen: [r('Zahnfleischbluten'), r('Roter oder brauner Urin'), r('Schwarzer Stuhl'), r('Große blaue Flecken ohne Anlass'), f('Kalte Füße')],
        erklaerung: 'Antikoagulanzien erhöhen die Blutungsgefahr. Auffällige Blutungen ärztlich melden.',
      },
    ],
  },
  // ---------------------------------------------------------------- Hypothyreose
  {
    id: 'hypo-albrecht', krankheitId: 'kh.hypothyreose', titel: 'Frau Albrecht, 78 Jahre', setting: 'Ambulante Pflege',
    text: [
      'Frau Albrecht wirkt seit einigen Monaten zunehmend verlangsamt und müde. Sie friert ständig, trägt auch im Sommer eine Strickjacke und hat zugenommen, obwohl sie wenig isst. Sie klagt über Verstopfung.',
      'Ihre Tochter fürchtet eine Demenz. Die Hausärztin findet einen stark erhöhten TSH-Wert und verordnet L-Thyroxin.',
    ],
    aufgaben: [
      {
        id: 'zeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Beobachtungen passen zur Hypothyreose?',
        optionen: [r('Müdigkeit und Verlangsamung'), r('Kälteempfindlichkeit'), r('Gewichtszunahme trotz wenig Appetit'), r('Verstopfung'), f('Herzrasen und Schwitzen')],
        erklaerung: 'Bei der Unterfunktion läuft der Stoffwechsel langsamer. Herzrasen und Schwitzen passen eher zur Überfunktion oder zu einer Überdosierung von L-Thyroxin.',
      },
      {
        id: 'demenz', art: 'einfach', abschnitt: 'symptome',
        frage: 'Was antwortest du der Tochter?',
        optionen: [r('Eine Schilddrüsenunterfunktion kann im Alter wie eine Demenz aussehen und bessert sich mit der Behandlung oft'), f('Es ist sicher eine Demenz'), f('Müdigkeit ist im Alter normal und muss nicht abgeklärt werden')],
        erklaerung: 'Im Alter zeigt sich die Hypothyreose oft untypisch und wird leicht mit einer Demenz verwechselt.',
      },
      {
        id: 'einnahme', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wann gibst du das L-Thyroxin?',
        optionen: [r('Morgens nüchtern, etwa 30 Minuten vor dem Frühstück, mit Wasser'), f('Zum Frühstück mit einem Glas Milch'), f('Abends vor dem Schlafen mit Kaffee')],
        erklaerung: 'Nahrung, Milch und Kaffee hemmen die Aufnahme. Deshalb nüchtern mit Wasser.',
      },
      {
        id: 'ueberdosis', art: 'mehrfach', abschnitt: 'komplikationen',
        frage: 'Nach einigen Wochen: Welche Zeichen können auf eine Überdosierung hinweisen?',
        optionen: [r('Herzrasen'), r('Innere Unruhe und Schlaflosigkeit'), r('Starkes Schwitzen'), f('Zunehmende Kälteempfindlichkeit')],
        erklaerung: 'Zu viel Schilddrüsenhormon beschleunigt den Stoffwechsel. Puls und Befinden beobachten und melden.',
      },
      {
        id: 'obstipation', art: 'mehrfach', abschnitt: 'pflege', extraTopicIds: ['thema.pro.obstipation'],
        frage: 'Was hilft gegen die Verstopfung?',
        optionen: [r('Bewegung'), r('Ballaststoffreiche Kost'), r('Ausreichend trinken'), f('Mehr Bettruhe')],
        erklaerung: 'Bewegung, Ballaststoffe und Flüssigkeit regen den verlangsamten Darm an.',
      },
    ],
  },
  // ---------------------------------------------------------------- Arthrose
  {
    id: 'arthrose-peters', krankheitId: 'kh.arthrose', titel: 'Herr Peters, 74 Jahre', setting: 'Stationäre Langzeitpflege',
    text: [
      'Herr Peters hat eine fortgeschrittene Kniearthrose rechts. Morgens braucht er lange, bis er „in Gang kommt“, nach einigen Schritten wird es besser. Nach längeren Spaziergängen schmerzt das Knie stark.',
      'Er ist übergewichtig und möchte am liebsten nur noch sitzen. Heute ist das Knie geschwollen und warm.',
    ],
    aufgaben: [
      {
        id: 'schmerz', art: 'einfach', abschnitt: 'symptome',
        frage: 'Wie nennt man den Schmerz am Morgen, der nach einigen Schritten besser wird?',
        optionen: [r('Anlaufschmerz'), f('Ruheschmerz'), f('Phantomschmerz')],
        erklaerung: 'Der Anlaufschmerz nach Ruhe ist typisch für die Arthrose.',
      },
      {
        id: 'aktiviert', art: 'einfach', abschnitt: 'pflege',
        frage: 'Das Knie ist heute geschwollen und warm. Was tust du?',
        optionen: [r('Kühlen, schonen und die Veränderung melden'), f('Eine Wärmflasche auflegen'), f('Einen langen Spaziergang machen, um es durchzubewegen')],
        erklaerung: 'Eine aktivierte, entzündete Arthrose wird gekühlt und geschont. Wärme hilft eher bei chronischen Beschwerden ohne Entzündung.',
      },
      {
        id: 'risiko', art: 'mehrfach', abschnitt: 'risikofaktoren',
        frage: 'Welche Risikofaktoren hat Herr Peters?',
        optionen: [r('Übergewicht'), r('Höheres Alter'), f('Morgensteifigkeit'), f('Er lebt im Pflegeheim')],
        erklaerung: 'Alter und Übergewicht belasten den Knorpel. Morgensteifigkeit ist ein Symptom.',
      },
      {
        id: 'bewegung', art: 'mehrfach', abschnitt: 'beratung',
        frage: 'Wozu berätst du ihn?',
        optionen: [r('Regelmäßige, gelenkschonende Bewegung wie Radfahren oder Gehen'), r('Gewicht reduzieren'), r('Gutes Schuhwerk mit weicher Sohle'), f('Möglichst viel sitzen, um das Gelenk zu schonen')],
        erklaerung: 'Bewegung ernährt den Knorpel und kräftigt die Muskulatur. Dauerhaftes Sitzen fördert Kontrakturen und Muskelabbau.',
        extraTopicIds: ['thema.pro.kontraktur'],
      },
      {
        id: 'stock', art: 'einfach', abschnitt: 'pflege',
        frage: 'Auf welcher Seite soll er den Gehstock tragen?',
        optionen: [r('Links, also auf der gesunden Seite'), f('Rechts, auf der kranken Seite'), f('Das ist egal')],
        erklaerung: 'Der Stock auf der gesunden Seite wird gleichzeitig mit dem kranken Bein aufgesetzt und entlastet es.',
      },
    ],
  },
  // ---------------------------------------------------------------- Angststörung
  {
    id: 'angst-kaya', krankheitId: 'kh.angststoerung', titel: 'Frau Kaya, 29 Jahre', setting: 'Krankenhaus, Notaufnahme',
    text: [
      'Frau Kaya kommt zum dritten Mal in diesem Monat in die Notaufnahme. Sie hat plötzlich Herzrasen, Brustenge, zittert und ist überzeugt, gleich zu sterben. Ihre Finger und der Mund kribbeln, sie atmet sehr schnell.',
      'EKG und Laborwerte waren bei den letzten Besuchen unauffällig. Seit Wochen traut sie sich nicht mehr allein in den Supermarkt.',
    ],
    aufgaben: [
      {
        id: 'form', art: 'einfach', abschnitt: 'formen',
        frage: 'Welche Form der Angststörung ist am wahrscheinlichsten?',
        optionen: [r('Panikstörung mit wiederkehrenden Panikattacken'), f('Spinnenphobie'), f('Generalisierte Angststörung ohne Anfälle')],
        erklaerung: 'Plötzliche, wiederkehrende Anfälle mit starken körperlichen Symptomen und Todesangst sind Panikattacken.',
      },
      {
        id: 'kribbeln', art: 'einfach', abschnitt: 'symptome',
        frage: 'Woher kommt das Kribbeln an Fingern und Mund?',
        optionen: [r('Von der Hyperventilation'), f('Von einem Schlaganfall'), f('Von zu wenig Zucker')],
        erklaerung: 'Schnelles Atmen senkt den CO2-Gehalt im Blut. Das löst Kribbeln und manchmal Verkrampfungen der Hände aus.',
      },
      {
        id: 'begleiten', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Wie begleitest du sie in der Attacke?',
        optionen: [r('Bei ihr bleiben und ruhig sprechen'), r('Zum langsamen, langen Ausatmen anleiten'), r('Vitalzeichen kontrollieren'), f('„Sie haben doch nichts, das bilden Sie sich ein.“')],
        erklaerung: 'Ruhe und Atemanleitung helfen. Die Angst ist echt und wird ernst genommen, auch wenn keine körperliche Ursache gefunden wird.',
      },
      {
        id: 'vermeidung', art: 'einfach', abschnitt: 'komplikationen',
        frage: 'Warum ist es ungünstig, dass sie den Supermarkt meidet?',
        optionen: [r('Vermeidung hält die Angst aufrecht und schränkt das Leben immer weiter ein'), f('Weil sie dann zu wenig isst'), f('Vermeiden ist die beste Behandlung')],
        erklaerung: 'Wer meidet, lernt nicht, dass die Situation ungefährlich ist. Die Angst wächst. Psychotherapie mit Konfrontation hilft.',
        extraTopicIds: ['thema.pro.deprivation'],
      },
      {
        id: 'medikament', art: 'einfach', abschnitt: 'therapie',
        frage: 'Sie fragt nach „den Beruhigungstabletten vom letzten Mal“. Was weißt du über Benzodiazepine?',
        optionen: [r('Sie wirken schnell, machen aber abhängig und sind nur kurzzeitig im Notfall vorgesehen'), f('Sie sind die beste Dauertherapie gegen Angst'), f('Sie haben keine Nebenwirkungen')],
        erklaerung: 'Langfristig werden Psychotherapie und z. B. Antidepressiva eingesetzt. Benzodiazepine nur kurzzeitig nach ärztlicher Anordnung.',
      },
    ],
  },
  // ---------------------------------------------------------------- Bronchiolitis
  {
    id: 'rsv-emil', krankheitId: 'kh.bronchiolitis', titel: 'Emil, 3 Monate', setting: 'Kinderklinik',
    text: [
      'Emil hat seit drei Tagen Schnupfen und Husten, seine große Schwester geht in die Kita. Heute trinkt er an der Brust nur noch kurz und hört dann erschöpft auf. Die Mutter hat seit dem Morgen nur zwei nasse Windeln gezählt.',
      'Du siehst Nasenflügeln und Einziehungen unter dem Rippenbogen. Atemfrequenz 64/min, Sättigung 91 %. Der RSV-Schnelltest ist positiv.',
    ],
    aufgaben: [
      {
        id: 'zeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Zeichen sprechen für eine Atemnot?',
        optionen: [r('Nasenflügeln'), r('Einziehungen'), r('Schnelle Atmung'), f('Schnupfen')],
        erklaerung: 'Nasenflügeln, Einziehungen und eine erhöhte Atemfrequenz zeigen, dass Emil sich beim Atmen anstrengen muss.',
      },
      {
        id: 'trinken', art: 'einfach', abschnitt: 'pflege',
        frage: 'Was hilft Emil beim Trinken?',
        optionen: [r('Vor dem Stillen die Nase mit Kochsalz frei machen und häufig kleine Mahlzeiten anbieten'), f('Seltener, dafür große Mahlzeiten'), f('Zum Trinken flach hinlegen')],
        erklaerung: 'Säuglinge atmen beim Trinken durch die Nase. Freie Nase, kleine Portionen und leicht erhöhter Oberkörper erleichtern das Trinken.',
        extraTopicIds: ['thema.pro.dehydratation'],
      },
      {
        id: 'risiko', art: 'mehrfach', abschnitt: 'komplikationen',
        frage: 'Worauf achtest du bei so einem jungen Säugling besonders?',
        optionen: [r('Atempausen'), r('Weniger nasse Windeln'), r('Blaue Verfärbung der Lippen'), f('Ob er Zähne bekommt')],
        erklaerung: 'Junge Säuglinge können Apnoen bekommen, Trinkschwäche führt zur Dehydratation, Zyanose zeigt Sauerstoffmangel.',
      },
      {
        id: 'hygiene', art: 'einfach', abschnitt: 'pflege',
        frage: 'Welche Hygienemaßnahme ist besonders wichtig?',
        optionen: [r('Händehygiene und Isolierung nach Hygieneplan, weil RSV sehr ansteckend ist'), f('Keine besonderen Maßnahmen nötig'), f('Nur Mundschutz für die Mutter')],
        erklaerung: 'RSV wird über Tröpfchen und Hände übertragen und kann andere Kinder auf Station gefährden.',
      },
      {
        id: 'antibiotikum', art: 'einfach', abschnitt: 'therapie',
        frage: 'Die Mutter fragt nach einem Antibiotikum. Was stimmt?',
        optionen: [r('Antibiotika helfen nicht gegen Viren; die Behandlung unterstützt Atmung und Trinken'), f('Ein Antibiotikum heilt RSV in zwei Tagen'), f('Ohne Antibiotikum wird es immer eine Lungenentzündung')],
        erklaerung: 'Die Bronchiolitis ist eine Viruserkrankung. Wichtig sind freie Nase, Flüssigkeit und bei Bedarf Sauerstoff.',
      },
    ],
  },
  // ---------------------------------------------------------------- Gastroenteritis
  {
    id: 'ge-leon', krankheitId: 'kh.gastroenteritis', titel: 'Leon, 14 Monate', setting: 'Kinderklinik',
    text: [
      'Leon hat seit gestern Abend achtmal wässrigen Durchfall gehabt und viermal erbrochen. In seiner Kita gibt es mehrere Kinder mit Magen-Darm-Infekt.',
      'Er ist schlapp, die Lippen sind trocken, er weint ohne Tränen. Die letzte nasse Windel war vor sechs Stunden. Er wiegt 400 g weniger als bei der U-Untersuchung vor einer Woche. Die Mutter hat ihm Cola gegeben, „weil das bei Durchfall hilft“.',
    ],
    aufgaben: [
      {
        id: 'dehydratation', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Zeichen sprechen für eine Dehydratation?',
        optionen: [r('Trockene Lippen'), r('Weinen ohne Tränen'), r('Keine nasse Windel seit sechs Stunden'), r('Gewichtsverlust'), f('Er geht in die Kita')],
        erklaerung: 'Trockene Schleimhäute, fehlende Tränen, wenig Urin und Gewichtsverlust zeigen den Flüssigkeitsmangel.',
      },
      {
        id: 'cola', art: 'einfach', abschnitt: 'beratung',
        frage: 'Was sagst du zur Cola?',
        optionen: [r('Besser eine orale Rehydratationslösung aus der Apotheke, weil Cola zu viel Zucker und zu wenig Salz enthält'), f('Cola ist ideal, weil sie Zucker und Koffein enthält'), f('Lieber gar nichts trinken, bis der Durchfall aufhört')],
        erklaerung: 'Zuckerreiche Getränke können den Durchfall verstärken und ersetzen die Salze nicht. ORL ist auf den Verlust abgestimmt.',
      },
      {
        id: 'orl', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie gibst du die Rehydratationslösung bei Erbrechen?',
        optionen: [r('In kleinen Mengen alle paar Minuten, z. B. löffelweise oder mit einer Spritze'), f('Eine ganze Flasche auf einmal'), f('Erst geben, wenn er drei Stunden nicht erbrochen hat')],
        erklaerung: 'Kleine, häufige Portionen werden auch bei Erbrechen oft behalten.',
        extraTopicIds: ['thema.pro.dehydratation'],
      },
      {
        id: 'hygiene', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Welche Hygienemaßnahmen sind wichtig?',
        optionen: [r('Kontaktisolierung nach Hygieneplan'), r('Händehygiene für Personal und Eltern'), r('Bei Noroviren viruzides Desinfektionsmittel'), f('Windeln im Zimmer offen sammeln')],
        erklaerung: 'Magen-Darm-Viren sind sehr ansteckend und werden über Hände und Flächen übertragen.',
      },
      {
        id: 'beobachten', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was dokumentierst du?',
        optionen: [r('Gewicht täglich'), r('Ein- und Ausfuhr, Windeln wiegen'), r('Anzahl und Art von Stuhl und Erbrechen'), f('Nur die Temperatur')],
        erklaerung: 'Gewicht und Bilanz zeigen, ob die Flüssigkeitsgabe reicht.',
      },
    ],
  },
  // ---------------------------------------------------------------- Diabetes Typ 1
  {
    id: 'dm1-mila', krankheitId: 'kh.diabetes-typ1', titel: 'Mila, 9 Jahre', setting: 'Kinderklinik',
    text: [
      'Mila wird von ihren Eltern gebracht. Seit drei Wochen trinkt sie auffällig viel, nachts nässt sie wieder ein. Sie hat drei Kilo abgenommen, obwohl sie viel isst.',
      'Heute hat sie zweimal erbrochen und klagt über Bauchschmerzen. Sie atmet tief, ihr Atem riecht obstartig. Der Blutzucker liegt bei 480 mg/dl, im Urin sind Ketone.',
    ],
    aufgaben: [
      {
        id: 'zeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Beobachtungen passen zu einem neu aufgetretenen Typ-1-Diabetes?',
        optionen: [r('Viel Durst und erneutes Einnässen'), r('Gewichtsabnahme trotz Hunger'), r('Tiefe Atmung und obstartiger Atemgeruch'), f('Gewichtszunahme und Heißhunger auf Salziges')],
        erklaerung: 'Ohne Insulin geht Zucker mit viel Wasser über den Urin verloren. Der Körper baut Fett ab, es entstehen Ketone, die der Körper abatmet.',
      },
      {
        id: 'notfall', art: 'einfach', abschnitt: 'komplikationen',
        frage: 'Was ist bei Mila die größte Gefahr?',
        optionen: [r('Eine diabetische Ketoazidose, die intensiv überwacht und behandelt werden muss'), f('Eine Unterzuckerung'), f('Ein harmloser Magen-Darm-Infekt')],
        erklaerung: 'Hoher Blutzucker, Ketone, Erbrechen, Bauchschmerzen und tiefe Atmung zeigen eine Ketoazidose, oft die Erstmanifestation.',
      },
      {
        id: 'therapie', art: 'einfach', abschnitt: 'therapie',
        frage: 'Die Mutter fragt, ob Tabletten und eine Diät reichen. Was stimmt?',
        optionen: [r('Nein, bei Typ 1 fehlt das Insulin vollständig; es muss lebenslang ersetzt werden'), f('Ja, mit Metformin und wenig Zucker ist das gut behandelbar'), f('Nur bis zur Pubertät, dann bildet der Körper wieder Insulin')],
        erklaerung: 'Die Betazellen sind zerstört. Behandelt wird mit Basal- und Bolusinsulin oder Pumpe, dazu Schulung.',
      },
      {
        id: 'erbrechen', art: 'einfach', abschnitt: 'pflege',
        frage: 'Später zu Hause erbricht Mila bei einem Infekt und isst nichts. Was ist richtig?',
        optionen: [r('Insulin nicht einfach weglassen, häufiger messen, Ketone prüfen und früh ärztliche Hilfe holen'), f('Alles Insulin weglassen, weil sie nichts isst'), f('Abwarten bis zum nächsten Tag')],
        erklaerung: 'Auch ohne Essen braucht der Körper Basalinsulin; Infekte erhöhen oft den Bedarf und das Ketoazidose-Risiko.',
      },
      {
        id: 'schule', art: 'mehrfach', abschnitt: 'beratung',
        frage: 'Was gehört zur Beratung für Schule und Sport?',
        optionen: [r('Traubenzucker und Notfallausweis immer dabeihaben'), r('Vor Sport Blutzucker messen und anpassen'), r('Lehrkräfte über Unterzuckerung und Notfallplan informieren'), f('Sport ist bei Diabetes verboten')],
        erklaerung: 'Bewegung senkt den Blutzucker. Das Umfeld muss eine Hypoglykämie erkennen und reagieren können.',
      },
    ],
  },
  // ---------------------------------------------------------------- Appendizitis
  {
    id: 'app-jonas', krankheitId: 'kh.appendizitis', titel: 'Jonas, 16 Jahre', setting: 'Notaufnahme und Chirurgie',
    text: [
      'Jonas hat seit gestern Abend Bauchschmerzen, zuerst um den Nabel, inzwischen rechts unten. Ihm ist übel, er hat einmal erbrochen und mag nichts essen. Die Temperatur liegt bei 38,3 °C.',
      'Er liegt mit angezogenem rechten Bein. Beim Husten verstärkt sich der Schmerz (NRS 6). Die Ärztin vermutet eine Blinddarmentzündung und plant eine laparoskopische OP am Nachmittag. Jonas fragt nach einer Wärmflasche.',
    ],
    aufgaben: [
      {
        id: 'zeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Beobachtungen sind typisch?',
        optionen: [r('Schmerz wandert vom Nabel nach rechts unten'), r('Übelkeit und Appetitlosigkeit'), r('Schonhaltung mit angezogenem Bein'), f('Schmerz bessert sich deutlich beim Husten')],
        erklaerung: 'Die Schmerzwanderung, Übelkeit, Fieber und Schonhaltung sprechen für eine Appendizitis.',
      },
      {
        id: 'waerme', art: 'einfach', abschnitt: 'pflege',
        frage: 'Was antwortest du auf die Frage nach der Wärmflasche?',
        optionen: [r('Keine Wärme, weil sie die Entzündung fördern und ein Durchbrechen begünstigen kann'), f('Ja, Wärme entspannt und ist bei Bauchschmerzen immer gut'), f('Ja, aber nur zusammen mit einem Abführmittel')],
        erklaerung: 'Vor der OP keine Wärmeanwendung und keine Abführmittel. Schmerzmittel nach ärztlicher Anordnung.',
      },
      {
        id: 'vorbereitung', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was gehört zur Betreuung bis zur OP?',
        optionen: [r('Nüchtern lassen'), r('Vitalzeichen und Schmerzverlauf beobachten und dokumentieren'), r('Schmerzmittel nach ärztlicher Anordnung geben'), f('Ein großes Frühstück anbieten, damit er Kraft hat')],
        erklaerung: 'Für die Narkose muss Jonas nüchtern sein; der Verlauf zeigt, ob sich der Zustand verschlechtert.',
        extraTopicIds: ['thema.ph.periop'],
      },
      {
        id: 'perforation', art: 'einfach', abschnitt: 'komplikationen',
        frage: 'Jonas sagt plötzlich, die Schmerzen seien fast weg. Eine Stunde später ist der Bauch hart und das Fieber steigt. Woran denkst du?',
        optionen: [r('An einen Durchbruch mit Bauchfellentzündung: sofort ärztlich melden'), f('An eine Besserung, die OP kann ausfallen'), f('An eine normale Reaktion auf das Fasten')],
        erklaerung: 'Ein kurzes Nachlassen des Schmerzes kann eine Perforation anzeigen; danach folgt oft eine Peritonitis.',
      },
      {
        id: 'nach-op', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was ist nach der OP wichtig?',
        optionen: [r('Frühmobilisation'), r('Wunde, Schmerz und Darmtätigkeit beobachten'), r('Kostaufbau nach Anordnung'), f('Mehrere Tage strenge Bettruhe')],
        erklaerung: 'Frühe Bewegung beugt Thrombose und Pneumonie vor und fördert die Darmtätigkeit.',
        extraTopicIds: ['thema.pro.thrombose'],
      },
    ],
  },
  // ---------------------------------------------------------------- Mammakarzinom
  {
    id: 'mamma-kaya', krankheitId: 'kh.mammakarzinom', titel: 'Frau Kaya, 54 Jahre', setting: 'Krankenhaus, Gynäkologie',
    text: [
      'Frau Kaya hat beim Duschen einen schmerzlosen Knoten in der linken Brust getastet. Die Haut darüber ist leicht eingezogen. Nach Mammografie und Stanzbiopsie steht die Diagnose fest.',
      'Heute wurde sie brusterhaltend operiert, dabei wurden Lymphknoten aus der linken Achsel entfernt. Sie hat eine Drainage. Am Abend sagt sie leise: „Ich weiß nicht, ob ich mich noch im Spiegel ansehen kann.“',
    ],
    aufgaben: [
      {
        id: 'warnzeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Veränderungen an der Brust sollten ärztlich abgeklärt werden?',
        optionen: [r('Tastbarer, schmerzloser Knoten'), r('Einziehung von Haut oder Brustwarze'), r('Orangenhaut'), f('Leichte Spannung vor der Regelblutung, die danach verschwindet')],
        erklaerung: 'Knoten, Einziehungen, Orangenhaut, Absonderung aus der Brustwarze und Lymphknoten in der Achsel sind Warnzeichen.',
      },
      {
        id: 'arm', art: 'einfach', abschnitt: 'pflege',
        frage: 'Am linken Arm soll Blut abgenommen werden. Was tust du?',
        optionen: [r('Nach Hausstandard den rechten Arm nutzen, weil links Lymphknoten entfernt wurden'), f('Links abnehmen, weil die Venen dort besser sind'), f('Blutdruck links messen und dabei gleich Blut abnehmen')],
        erklaerung: 'Nach Entfernung von Lymphknoten ist der Lymphabfluss gestört. Stauung und Verletzung können ein Lymphödem fördern.',
      },
      {
        id: 'gespraech', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie reagierst du auf ihre Sorge zum Spiegel?',
        optionen: [r('Die Sorge aufgreifen, Zeit für ein Gespräch anbieten und Psychoonkologie oder Breast Care Nurse vorschlagen'), f('„Das wird schon, Sie sind ja geheilt.“'), f('Das Thema wechseln, um sie nicht zu belasten')],
        erklaerung: 'Ein verändertes Körperbild ist eine häufige Belastung. Zuhören und Fachangebote helfen mehr als Beschwichtigen.',
      },
      {
        id: 'lymphoedem', art: 'mehrfach', abschnitt: 'beratung',
        frage: 'Was gehört zur Beratung vor der Entlassung?',
        optionen: [r('Armübungen nach Anleitung'), r('Schwellung oder Spannungsgefühl im Arm früh melden'), r('Verletzungen am betroffenen Arm vermeiden'), f('Den Arm möglichst gar nicht bewegen')],
        erklaerung: 'Bewegung fördert den Lymphabfluss; Schwellung ist ein frühes Zeichen eines Lymphödems.',
      },
      {
        id: 'chemo', art: 'einfach', abschnitt: 'prophylaxen',
        frage: 'Sie bekommt später eine Chemotherapie. Welche Prophylaxe wird dabei besonders wichtig?',
        optionen: [r('Soor- und Parotitisprophylaxe, weil die Mundschleimhaut geschädigt und die Abwehr geschwächt wird'), f('Kontrakturenprophylaxe der Finger'), f('Keine, weil Chemotherapie nur den Tumor trifft')],
        erklaerung: 'Chemotherapie trifft auch schnell wachsende gesunde Zellen wie die Mundschleimhaut.',
        extraTopicIds: ['thema.pro.soor'],
      },
    ],
  },
  // ---------------------------------------------------------------- Rheumatoide Arthritis
  {
    id: 'ra-pohl', krankheitId: 'kh.rheumatoide-arthritis', titel: 'Frau Pohl, 61 Jahre', setting: 'Ambulanter Pflegedienst',
    text: [
      'Frau Pohl hat seit zwölf Jahren eine rheumatoide Arthritis. Morgens sind ihre Finger etwa eine Stunde lang steif, die Grundgelenke beider Hände sind geschwollen und warm. Sie nimmt eine Basistherapie und im Moment wegen eines Schubs zusätzlich Prednisolon.',
      'Der Pflegedienst kommt um 7 Uhr zum Waschen. Frau Pohl sagt, sie schaffe dann kaum etwas selbst. Knöpfe und Flaschen bekommt sie nur schwer auf. Seit gestern hat sie Halsschmerzen und fühlt sich fiebrig.',
    ],
    aufgaben: [
      {
        id: 'typisch', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Was ist typisch für die rheumatoide Arthritis?',
        optionen: [r('Morgensteifigkeit länger als 30 Minuten'), r('Beidseits geschwollene Fingergrundgelenke'), r('Müdigkeit und Abgeschlagenheit'), f('Schmerz nur in einem Kniegelenk nach Belastung')],
        erklaerung: 'Die RA befällt typisch kleine Gelenke symmetrisch. Belastungsschmerz eines großen Gelenks passt eher zur Arthrose.',
      },
      {
        id: 'zeitpunkt', art: 'einfach', abschnitt: 'pflege',
        frage: 'Wie planst du den Einsatz sinnvoll um?',
        optionen: [r('Den Besuch nach Absprache später legen, wenn die Morgensteifigkeit nachlässt'), f('Noch früher kommen, damit sie länger Zeit hat'), f('Alles übernehmen, damit es schneller geht')],
        erklaerung: 'Nach der Morgensteifigkeit kann Frau Pohl mehr selbst tun. Das erhält ihre Selbstständigkeit.',
      },
      {
        id: 'hilfsmittel', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Welche Hilfen fördern ihre Selbstständigkeit?',
        optionen: [r('Griffverdickungen'), r('Knopfhilfe'), r('Öffnungshilfe für Flaschen'), f('Fingergelenke im Schub möglichst kräftig massieren')],
        erklaerung: 'Hilfsmittel und Gelenkschutz entlasten die kleinen Gelenke. Entzündete Gelenke werden geschont, aber bewegt.',
      },
      {
        id: 'infekt', art: 'einfach', abschnitt: 'komplikationen',
        frage: 'Wie bewertest du Halsschmerzen und Fiebergefühl?',
        optionen: [r('Ernst nehmen: unter immunsuppressiver Therapie ist sie infektanfällig; Temperatur messen und ärztlich abklären lassen'), f('Harmlos, das gehört zum Rheumaschub'), f('Die Medikamente sofort selbst absetzen lassen')],
        erklaerung: 'Basistherapie und Kortison schwächen die Abwehr. Medikamente werden nur ärztlich angepasst.',
      },
      {
        id: 'gelenkschutz', art: 'einfach', abschnitt: 'beratung',
        frage: 'Was ist ein Grundsatz des Gelenkschutzes?',
        optionen: [r('Große Gelenke statt der Finger belasten, z. B. Tasche über dem Unterarm tragen'), f('Die Finger durch kräftiges Zusammendrücken trainieren'), f('Jede Bewegung vermeiden')],
        erklaerung: 'Gelenkschutz verteilt Lasten auf große Gelenke und vermeidet Fehlbelastung der Fingergelenke.',
        extraTopicIds: ['thema.pro.kontraktur'],
      },
    ],
  },
  // ---------------------------------------------------------------- Ulcus cruris venosum
  {
    id: 'ulcus-berger', krankheitId: 'kh.ulcus-cruris', titel: 'Herr Berger, 76 Jahre', setting: 'Pflegeheim',
    text: [
      'Herr Berger hatte vor zehn Jahren eine Beinvenenthrombose. Seit vier Monaten hat er eine nässende Wunde über dem rechten Innenknöchel, 3 × 2 cm. Die Haut am Unterschenkel ist braun verfärbt und verhärtet, abends sind die Beine geschwollen.',
      'Er sitzt den ganzen Tag im Sessel vor dem Fernseher. Die Kompressionsbinde hat er gestern abgewickelt, „weil sie drückt“. Der Hausarzt hat eine Durchblutungsstörung der Arterien ausgeschlossen.',
    ],
    aufgaben: [
      {
        id: 'ursache', art: 'einfach', abschnitt: 'ursachen',
        frage: 'Wie entsteht diese Wunde am ehesten?',
        optionen: [r('Durch gestörten venösen Rückfluss nach der Thrombose, das Gewebe wird schlecht versorgt'), f('Durch Druck von außen wie beim Dekubitus'), f('Durch eine arterielle Verschlusskrankheit')],
        erklaerung: 'Ein postthrombotisches Syndrom schädigt die Venenklappen. Der Venendruck steigt, Haut und Gewebe leiden.',
      },
      {
        id: 'kompression', art: 'einfach', abschnitt: 'therapie',
        frage: 'Warum ist der Ausschluss der arteriellen Durchblutungsstörung wichtig?',
        optionen: [r('Weil Kompression bei relevanter pAVK die Durchblutung weiter verschlechtern kann'), f('Weil dann keine Wundauflage nötig ist'), f('Das ist nicht wichtig, Kompression passt immer')],
        erklaerung: 'Kompression ist die wichtigste Therapie beim venösen Ulkus, setzt aber eine ausreichende arterielle Durchblutung voraus.',
      },
      {
        id: 'drueckt', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Er sagt, die Binde drückt. Was tust du?',
        optionen: [r('Bein und Haut auf Druckstellen und Durchblutung prüfen'), r('Kompression fachgerecht von den Zehen bis unter das Knie neu anlegen'), r('Ihm erklären, warum die Kompression für die Heilung wichtig ist'), f('Die Kompression dauerhaft weglassen')],
        erklaerung: 'Schlecht sitzende Kompression drückt. Richtig angelegt und erklärt wird sie besser akzeptiert.',
      },
      {
        id: 'bewegung', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was förderst du im Alltag?',
        optionen: [r('Regelmäßiges Gehen'), r('Fußgymnastik, Sprunggelenk bewegen'), r('Beine im Liegen hochlagern'), f('Füße im heißen Fußbad wärmen')],
        erklaerung: 'Die Muskelpumpe fördert den venösen Rückfluss. Wärme weitet die Venen und verstärkt die Stauung.',
        extraTopicIds: ['thema.pro.thrombose'],
      },
      {
        id: 'doku', art: 'einfach', abschnitt: 'pflege',
        frage: 'Was gehört zur Wunddokumentation?',
        optionen: [r('Größe, Wundgrund, Exsudat, Wundrand und Umgebung, ggf. Foto nach Hausstandard'), f('Nur ob die Wunde riecht'), f('Nur das Datum des Verbandwechsels')],
        erklaerung: 'Eine genaue Einschätzung zeigt, ob die Wunde heilt, und ist Teil des Expertenstandards Pflege von Menschen mit chronischen Wunden.',
      },
    ],
  },
  // ---------------------------------------------------------------- Hyperthyreose
  {
    id: 'hyper-neumann', krankheitId: 'kh.hyperthyreose', titel: 'Frau Neumann, 38 Jahre', setting: 'Krankenhaus, Innere Medizin',
    text: [
      'Frau Neumann hat in zwei Monaten sechs Kilo abgenommen, obwohl sie viel isst. Sie schwitzt schnell, schläft schlecht und ist gereizt. Ihre Hände zittern leicht, ihre Augen wirken hervorgetreten.',
      'Der Puls liegt bei 118/min, die Haut ist warm und feucht. Die Laborwerte zeigen ein sehr niedriges TSH und erhöhte Schilddrüsenhormone. Für morgen ist ein CT mit Kontrastmittel geplant.',
    ],
    aufgaben: [
      {
        id: 'zeichen', art: 'mehrfach', abschnitt: 'symptome',
        frage: 'Welche Zeichen passen zur Schilddrüsenüberfunktion?',
        optionen: [r('Gewichtsverlust trotz Appetit'), r('Herzrasen'), r('Schwitzen und warme Haut'), r('Nervosität und Zittern'), f('Kälteempfindlichkeit und Verstopfung')],
        erklaerung: 'Bei der Überfunktion läuft der Stoffwechsel zu schnell. Kälteempfindlichkeit und Verstopfung passen zur Unterfunktion.',
      },
      {
        id: 'kontrastmittel', art: 'einfach', abschnitt: 'pflege',
        frage: 'Was ist vor dem CT mit Kontrastmittel wichtig?',
        optionen: [r('Ärztlich auf die Schilddrüsenüberfunktion hinweisen, weil jodhaltiges Kontrastmittel sie verschlimmern kann'), f('Nichts, Kontrastmittel ist für die Schilddrüse egal'), f('Vorher zusätzlich Jodtabletten geben')],
        erklaerung: 'Jod kann eine Überfunktion verstärken. Die Ärztin entscheidet über Vorbereitung oder andere Untersuchungen.',
      },
      {
        id: 'umgebung', art: 'mehrfach', abschnitt: 'pflege',
        frage: 'Was hilft Frau Neumann auf Station?',
        optionen: [r('Kühles, ruhiges Zimmer und leichte Bettwäsche'), r('Ausreichend Kalorien und Getränke anbieten'), r('Puls, Temperatur und Gewicht regelmäßig kontrollieren'), f('Ihre Gereiztheit als Unhöflichkeit dokumentieren')],
        erklaerung: 'Der erhöhte Grundumsatz braucht Energie und Flüssigkeit. Gereiztheit ist ein Krankheitszeichen.',
        extraTopicIds: ['thema.pro.dehydratation'],
      },
      {
        id: 'krise', art: 'einfach', abschnitt: 'komplikationen',
        frage: 'Nachts hat sie 39,8 °C, Puls 160/min und ist sehr unruhig. Woran denkst du?',
        optionen: [r('An eine thyreotoxische Krise: sofort ärztlich melden, Notfall'), f('An eine normale Nachtunruhe'), f('An eine Unterzuckerung, die mit Saft behoben ist')],
        erklaerung: 'Fieber, Herzrasen und Unruhe bis zur Verwirrtheit sind Zeichen der lebensbedrohlichen Krise.',
      },
      {
        id: 'beratung', art: 'einfach', abschnitt: 'beratung',
        frage: 'Sie bekommt ein Thyreostatikum. Was soll sie sofort melden?',
        optionen: [r('Fieber und Halsschmerzen, weil sich das Blutbild verändern kann'), f('Leichte Müdigkeit am Abend'), f('Dass ihr Gewicht wieder etwas steigt')],
        erklaerung: 'Thyreostatika können selten die weißen Blutkörperchen stark senken. Fieber und Halsschmerzen sind dann Warnzeichen.',
      },
    ],
  },
];
