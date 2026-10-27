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
];
