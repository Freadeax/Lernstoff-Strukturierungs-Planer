// Weitere Probefälle ohne KI (Ausbau 2026-11-13): Sepsis, Schlaganfall, Anaphylaxie, Fieberkrampf.
// Gleiche Regeln wie in demo.ts: genau eine „gut“-Option je Etappe, gefährliche Entscheidungen führen
// in eine eigene Wendung, Medikamente nur „nach Anordnung“ bzw. Standard, ohne Dosierungen.
// Inhalte erfunden und didaktisch vereinfacht, fachlich ungeprüft (siehe freigaben.ts).

import type { Szenario } from './faelle';
import type { Probefall } from './demo';
import type { Vitalwerte } from './simulator';

const szenario = (s: Omit<Szenario, 'verborgen'>): Szenario => ({ ...s, verborgen: '' });

// ---------- 5. Sepsis bei Harnwegsinfekt ----------

const SEPSIS_START: Partial<Vitalwerte> = { rr: '94/56', puls: '118', af: '24', spo2: '93', sauerstoff: 'nein', temp: '38,9', bewusstsein: 'C' };

export const SEPSIS: Probefall = {
  szenario: szenario({
    id: 'demo-sepsis', titel: 'Probefall: Gestern war sie noch klar', setting: 'krankenhaus',
    kurz: 'Frau H., 81 Jahre, internistische Station, gestern mit Harnwegsinfekt und Blasenkatheter aufgenommen. Beim Frühdienst-Rundgang weiß sie nicht, wo sie ist. Fest geschriebener Kurzfall ohne KI.',
    topicIds: ['thema.kl.infektion', 'thema.pro.zystitis', 'thema.beo.bewusstsein', 'thema.beo.vitalzeichen', 'thema.pp.uebergabe'],
  }),
  reihe: ['s1', 's2', 's3', 's4'],
  etappen: {
    s1: {
      uhrzeit: '06:30', zustand: 'verschlechtert',
      situation: 'Frau H. zupft an der Bettdecke und fragt, wann der Bus kommt. Ihre Haut ist heiß, sie atmet schnell. Im Urinbeutel ist wenig trüber, dunkler Urin. In der Übergabe hieß es: „Gestern war sie völlig klar.“',
      optionen: [
        { text: 'Ich lasse sie bis zum Frühstück schlafen, sie ist alt und morgens oft durcheinander.', wertung: 'gefaehrlich', schritt: 'informationssammlung', rueck: 'Neue Verwirrtheit ist ein Warnzeichen, keine Alterserscheinung. Bei Infekt immer an eine Sepsis denken und messen.', folge: 'Du gehst weiter zum nächsten Zimmer.', vital: { ...SEPSIS_START, rr: '82/48', puls: '128', af: '28', bewusstsein: 'V' }, zustand: 'kritisch', weiter: 's1b' },
        { text: 'Ich messe Blutdruck, Puls, Atemfrequenz, Sättigung und Temperatur, prüfe das Bewusstsein und schaue mir Urin und Katheter an.', wertung: 'gut', schritt: 'informationssammlung', rueck: 'Richtig: Neue Verwirrtheit plus Infekt verlangt sofort vollständige Vitalzeichen. Erst die Werte machen aus „komisch“ eine belastbare Einschätzung.', folge: 'Du legst Manschette und Pulsoxymeter an und zählst die Atemzüge.', vital: SEPSIS_START },
        { text: 'Ich gebe ihr ein Glas Wasser und schaue in einer Stunde wieder nach.', wertung: 'unguenstig', schritt: 'massnahmen', rueck: 'Trinken ist gut gemeint, ersetzt aber keine Einschätzung. Eine Stunde ist bei Verdacht auf Sepsis zu lang.', folge: 'Sie nippt kaum am Glas.', vital: { ...SEPSIS_START, rr: '90/52', puls: '122' } },
      ],
    },
    s1b: {
      uhrzeit: '07:20', zustand: 'kritisch', weiter: 's2',
      situation: 'Beim Frühstück reagiert Frau H. nur noch, wenn du sie laut ansprichst. Hände und Knie sind kühl und marmoriert, sie atmet schnell und flach. Im Urinbeutel ist kaum etwas dazugekommen.',
      optionen: [
        { text: 'Ich messe sofort alle Vitalzeichen, lasse die Ärztin als Notfall rufen und bleibe bei ihr.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Spät, aber jetzt richtig: Marmorierte Haut, wenig Urin und Bewusstseinsstörung sind Zeichen eines septischen Schocks. Sofort ärztliche Hilfe.', folge: 'Die Kollegin telefoniert, du misst.', vital: { rr: '80/46', puls: '130' } },
        { text: 'Ich schreibe es für die Visite um 10 Uhr auf.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Bei Verdacht auf Sepsis zählt jede Stunde. Bis zur Visite zu warten, gefährdet ihr Leben.', folge: 'Eine Kollegin sieht Frau H. und ruft sofort die Ärztin.', vital: { rr: '76/42', puls: '134' } },
        { text: 'Ich wasche sie erst, damit sie für die Visite fertig ist.', wertung: 'unguenstig', schritt: 'massnahmen', rueck: 'Grundpflege kann warten. Jetzt zählen Einschätzung und Alarmierung.', folge: 'Beim Waschen merkst du, wie kalt ihre Beine sind, und rufst Hilfe.', vital: { rr: '78/44' } },
      ],
    },
    s2: {
      uhrzeit: '06:38', zustand: 'verschlechtert',
      situation: 'Die Werte: Blutdruck niedrig, Puls und Atemfrequenz hoch, Fieber, neue Verwirrtheit. Der NEWS2 ist deutlich erhöht. Frau H. murmelt: „Mir ist so kalt.“',
      optionen: [
        { text: 'Ich gebe ihr aus dem Stationsschrank ein Fiebermittel, damit es ihr besser geht.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Medikamente nur nach Anordnung. Ein Fiebermittel ändert nichts an der Ursache und verschleiert den Verlauf.', folge: 'Die Ärztin weiß weiter nichts von der Lage.' },
        { text: 'Ich rufe sofort die Ärztin an: Verdacht auf Sepsis bei Harnwegsinfekt, mit allen Werten nach SBAR.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Genau: Das Wort „Sepsis“ und konkrete Werte nach SBAR machen die Dringlichkeit klar. Die Behandlung muss in der ersten Stunde beginnen.', folge: 'Die Ärztin sagt: „Ich komme sofort, bereite bitte Blutkulturen und einen Zugang vor.“' },
        { text: 'Ich decke sie warm zu und messe in zwei Stunden noch einmal.', wertung: 'gefaehrlich', schritt: 'evaluation', rueck: 'Zudecken lindert, behandelt aber nichts. Bei diesen Werten muss sofort eine Ärztin kommen.', folge: 'Erst die Kollegin fragt nach den Werten und drängt dich anzurufen.', vital: { rr: '84/48', puls: '126', af: '28' }, zustand: 'kritisch' },
      ],
    },
    s3: {
      uhrzeit: '06:50', zustand: 'verschlechtert',
      situation: 'Die Ärztin ist da und ordnet an: Blutkulturen, Infusion, Antibiotikum innerhalb der nächsten Stunde, Katheterwechsel mit Urinprobe und eine Flüssigkeitsbilanz.',
      optionen: [
        { text: 'Ich hänge zuerst das Antibiotikum an, die Blutkulturen kann man auch später abnehmen.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Blutkulturen gehören vor das Antibiotikum, sonst findet das Labor den Erreger oft nicht mehr. Beides gehört aber in dieselbe Stunde.', folge: 'Die Ärztin stoppt dich kurz: „Erst die Kulturen.“', vital: { rr: '92/54' } },
        { text: 'Ich mache das nach der Frühstücksrunde, die anderen warten schon.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Bei Sepsis verschlechtert jede Stunde ohne Behandlung die Prognose. Die Frühstücksrunde muss warten oder jemand anderes übernimmt sie.', folge: 'Die Ärztin übernimmt selbst und bittet eine Kollegin um Hilfe.', vital: { rr: '80/46', puls: '130' }, zustand: 'kritisch' },
        { text: 'Ich assistiere bei den Blutkulturen, hänge danach Infusion und Antibiotikum nach Anordnung an, starte die Bilanz und messe die Werte engmaschig.', wertung: 'gut', schritt: 'massnahmen', rueck: 'Vollständig und in der richtigen Reihenfolge: Kulturen vor Antibiotikum, beides schnell, dazu Bilanz und engmaschige Kontrolle.', folge: 'Um 07:20 laufen Infusion und Antibiotikum, die Bilanz ist angelegt.', vital: { rr: '102/60', puls: '108', af: '22' } },
      ],
    },
    s4: {
      uhrzeit: '07:45', zustand: 'verbessert',
      situation: 'Der Blutdruck ist etwas gestiegen, Frau H. ist noch verwirrt, erkennt dich aber. Das Telefon klingelt: Ihre Tochter fragt, warum so viel los ist.',
      optionen: [
        { text: 'Ich nehme den Monitor ab, sie ist ja jetzt behandelt.', wertung: 'unguenstig', schritt: 'evaluation', rueck: 'Nach Behandlungsbeginn kann sich eine Sepsis weiter verschlechtern. Engmaschig kontrollieren, bis die Ärztin etwas anderes festlegt.', folge: 'Mittags fällt der Blutdruck erneut.' },
        { text: 'Ich kontrolliere Werte, Bewusstsein und Urinmenge engmaschig, übergebe nach SBAR und biete der Tochter einen Rückruf der Ärztin an.', wertung: 'gut', schritt: 'evaluation', rueck: 'Wirkung kontrollieren, sauber übergeben und Angehörige angemessen einbinden, ohne am Telefon Befunde zu erklären.', folge: 'Die Tochter ist erleichtert, die Frühschicht kennt den Plan.', vital: { rr: '108/64', puls: '100', af: '20', temp: '38,2' } },
        { text: 'Ich schreibe alle Werte am Ende der Schicht gesammelt in die Kurve.', wertung: 'teilweise', schritt: 'evaluation', rueck: 'Dokumentation ja, aber zeitnah. Wer später übernimmt, muss den Verlauf sofort sehen.', folge: 'Die Kollegin fragt nach den aktuellen Werten, die noch nirgends stehen.' },
      ],
    },
  },
  schluss: {
    uhrzeit: '08:30',
    gut: 'Frau H. ist ruhiger und fragt nach ihrer Brille. Der Blutdruck ist stabil, Urin läuft wieder. Die Ärztin lobt die schnelle Meldung.',
    schlecht: 'Frau H. braucht weiter viel Flüssigkeit, der Blutdruck bleibt niedrig. Die Ärztin bespricht eine Verlegung auf die Intensivstation.',
    gutVital: { rr: '112/66', puls: '96', af: '19', spo2: '95', temp: '37,9', bewusstsein: 'A' }, schlechtVital: { rr: '86/50', puls: '122', af: '26', bewusstsein: 'C' },
  },
  wen: 'Frau H.',
  musterloesung: 'Neue Verwirrtheit bei Infekt ernst nehmen, sofort alle Vitalzeichen messen und NEWS2 bilden, Urin und Katheter beurteilen. Die Ärztin sofort mit dem Verdacht „Sepsis“ nach SBAR informieren. Blutkulturen vor dem Antibiotikum, beides in der ersten Stunde, Infusion nach Anordnung, Bilanz und engmaschige Kontrolle von Vitalzeichen, Bewusstsein und Urinmenge.',
};

// ---------- 6. Schlaganfall beim Frühstück ----------

const STROKE_START: Partial<Vitalwerte> = { rr: '178/96', puls: '88', af: '18', spo2: '96', sauerstoff: 'nein', temp: '36,8', bz: '118', bewusstsein: 'A' };

export const SCHLAGANFALL: Probefall = {
  szenario: szenario({
    id: 'demo-schlaganfall', titel: 'Probefall: Plötzlich hängt der Mundwinkel', setting: 'krankenhaus',
    kurz: 'Herr R., 67 Jahre, orthopädische Station, Knie-OP vor 2 Tagen. Beim Frühstück fällt dir seine verwaschene Sprache auf. Fest geschriebener Kurzfall ohne KI.',
    topicIds: ['thema.kl.neuro.schlaganfall', 'thema.beo.notfall', 'thema.pro.aspiration'],
  }),
  reihe: ['g1', 'g2', 'g3'],
  etappen: {
    g1: {
      uhrzeit: '08:10', zustand: 'verschlechtert',
      situation: 'Herr R. spricht verwaschen, sein rechter Mundwinkel hängt, Kaffee läuft ihm aus dem Mund. Er winkt ab: „Alles gut, bin nur müde.“ Beim Wecken um 6:30 war er noch ganz normal.',
      optionen: [
        { text: 'Ich gebe ihm einen Strohhalm, damit er besser trinken kann, und komme nach dem Frühstück wieder.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Hängender Mundwinkel und verwaschene Sprache sind Schlaganfallzeichen. Trinken mit Schluckstörung führt zur Aspiration, und jede Minute kostet Hirngewebe.', folge: 'Du gehst weiter zum nächsten Frühstückstablett.', vital: { ...STROKE_START, spo2: '93' }, zustand: 'kritisch', weiter: 'g1b' },
        { text: 'Ich frage, ob er gestern ein Schlafmittel bekommen hat, und schaue in einer halben Stunde wieder nach.', wertung: 'unguenstig', schritt: 'informationssammlung', rueck: 'Die Frage ist nicht verkehrt, aber bei plötzlichen Ausfällen darf man nicht abwarten. Erst prüfen, dann sofort handeln.', folge: 'In der Kurve steht kein Schlafmittel.', vital: STROKE_START },
        { text: 'Ich prüfe sofort nach BE-FAST (Gleichgewicht, Augen, Gesicht, Arme, Sprache), nehme ihm das Frühstück weg und halte fest, wann er zuletzt sicher normal war.', wertung: 'gut', schritt: 'informationssammlung', rueck: 'Richtig: BE-FAST macht den Verdacht greifbar, und der Zeitpunkt „zuletzt normal“ entscheidet über die Behandlung. Mit Schluckstörung nichts mehr zu essen oder trinken.', folge: 'Du bittest ihn zu lächeln und beide Arme zu heben. Der rechte Arm sinkt ab.', vital: STROKE_START },
      ],
    },
    g1b: {
      uhrzeit: '08:40', zustand: 'kritisch', weiter: 'g2',
      situation: 'Herr R. hustet heftig, Tee läuft über das Kinn. Der rechte Arm hängt kraftlos herab, er antwortet nur noch mit einzelnen Lauten.',
      optionen: [
        { text: 'Ich gebe ihm noch mehr zu trinken, damit der Husten aufhört.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Husten beim Trinken zeigt eine Schluckstörung. Weiteres Trinken kann in die Lunge laufen.', folge: 'Er hustet stärker, die Sättigung fällt.', vital: { spo2: '90' } },
        { text: 'Ich stoppe Essen und Trinken, setze ihn aufrecht, lasse sofort die Ärztin mit Verdacht auf Schlaganfall rufen und nenne 6:30 als letzten normalen Zeitpunkt.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Jetzt richtig: Aspiration verhindern, Notfall auslösen und den Zeitpunkt sichern. Wertvolle Zeit ist aber verloren.', folge: 'Die Ärztin ist in drei Minuten da.' },
        { text: 'Ich rufe zuerst seine Frau an, die soll entscheiden.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Angehörige informieren ist wichtig, aber erst nach dem Notruf. Die Behandlung kann nicht warten.', folge: 'Die Frau ist nicht erreichbar. Eine Kollegin ruft die Ärztin.' },
      ],
    },
    g2: {
      uhrzeit: '08:14', zustand: 'verschlechtert',
      situation: 'BE-FAST ist auffällig: Mundwinkel, Arm, Sprache. Der Blutdruck ist hoch. Herr R. wirkt ängstlich und versucht aufzustehen.',
      optionen: [
        { text: 'Ich gebe ihm seine Bedarfsmedikation gegen den hohen Blutdruck.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Beim Schlaganfall kann ein zu schnell gesenkter Blutdruck schaden. Ob und wie gesenkt wird, entscheidet die Ärztin.', folge: 'Der Blutdruck fällt, Herr R. wird schläfriger.', vital: { rr: '128/74', bewusstsein: 'V' }, zustand: 'kritisch' },
        { text: 'Ich lege ihn flach und warte auf die Visite.', wertung: 'unguenstig', schritt: 'massnahmen', rueck: 'Flachlagerung erhöht das Aspirationsrisiko, und Warten kostet das Zeitfenster für die Behandlung.', folge: 'Er verschluckt sich am eigenen Speichel.', vital: { spo2: '94' } },
        { text: 'Ich lasse sofort die Ärztin rufen (Verdacht Schlaganfall, zuletzt normal 6:30), bleibe bei ihm, messe Blutzucker und Vitalwerte und gebe nichts zu essen oder trinken.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Genau: Notfall mit Zeitpunkt, Blutzucker ausschließen (Unterzucker kann Schlaganfall nachahmen), Sicherheit vor Sturz und Aspiration.', folge: 'Der Blutzucker ist normal. Die Ärztin kommt und bestätigt den Verdacht.' },
      ],
    },
    g3: {
      uhrzeit: '08:25', zustand: 'verschlechtert',
      situation: 'Die Ärztin meldet Herrn R. in der Stroke Unit an, ein CT ist sofort frei. Du sollst die Verlegung vorbereiten. Er bekommt nach der OP eine Thromboseprophylaxe.',
      optionen: [
        { text: 'Ich gebe ihm vor dem Transport noch schnell sein Frühstück, er hat ja nichts gegessen.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Vor einer Schluckprüfung gibt es nichts zu essen oder trinken. Aspiration ist eine häufige Komplikation nach Schlaganfall.', folge: 'Er verschluckt sich am Brot.', vital: { spo2: '91' }, zustand: 'kritisch' },
        { text: 'Ich übergebe nach SBAR: Zeitpunkt 6:30, Ausfälle, Werte, Blutzucker, Medikamente mit Thromboseprophylaxe und letzter Gabe, Kontakt der Ehefrau.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Vollständig: Zeitpunkt und Blutverdünner entscheiden über die Behandlung. Mit einer klaren Übergabe kann die Stroke Unit sofort handeln.', folge: 'Das Transportteam übernimmt mit deiner Übergabe.', vital: { rr: '172/94' } },
        { text: 'Ich packe zuerst in Ruhe seine Sachen zusammen.', wertung: 'teilweise', schritt: 'durchfuehrung', rueck: 'Persönliche Sachen können nachgebracht werden. Wichtiger sind Zeitpunkt, Medikamente und Werte für das Stroke-Team.', folge: 'Der Transport wartet auf die Übergabe.' },
      ],
    },
  },
  schluss: {
    uhrzeit: '09:10',
    gut: 'Aus der Stroke Unit kommt der Rückruf: Dank des genauen Zeitpunkts konnte das Team sofort entscheiden. Herr R. bewegt den Arm schon wieder etwas.',
    schlecht: 'Herr R. ist in der Stroke Unit, doch das Zeitfenster war knapp. Arm und Sprache sind weiterhin stark eingeschränkt.',
    gutVital: { rr: '160/88', puls: '82', spo2: '97' }, schlechtVital: { rr: '168/92', puls: '94', spo2: '93' },
  },
  wen: 'Herrn R.',
  musterloesung: 'Plötzliche Ausfälle mit BE-FAST prüfen, Zeitpunkt „zuletzt normal“ sichern, sofort Essen und Trinken stoppen, Notfall auslösen und bei ihm bleiben. Blutzucker messen, Blutdruck nicht eigenmächtig senken. Verlegung mit SBAR-Übergabe: Zeitpunkt, Ausfälle, Werte, Blutverdünner mit letzter Gabe, Angehörige.',
};

// ---------- 7. Anaphylaxie bei Infusion ----------

const ANA_START: Partial<Vitalwerte> = { rr: '102/64', puls: '116', af: '24', spo2: '94', sauerstoff: 'nein', temp: '36,9', bewusstsein: 'A' };

export const ANAPHYLAXIE: Probefall = {
  szenario: szenario({
    id: 'demo-anaphylaxie', titel: 'Probefall: Juckreiz nach der ersten Infusion', setting: 'krankenhaus',
    kurz: 'Frau K., 34 Jahre, internistische Station, Wundinfektion am Unterschenkel. Zehn Minuten nach Beginn der ersten Antibiotika-Infusion klingelt sie. Fest geschriebener Kurzfall ohne KI.',
    topicIds: ['thema.beo.notfall', 'thema.ph.medikamente', 'thema.ph.injektion'],
  }),
  reihe: ['n1', 'n2', 'n3'],
  etappen: {
    n1: {
      uhrzeit: '10:10', zustand: 'verschlechtert',
      situation: 'Frau K. kratzt sich an Armen und Hals, auf der Brust sind rote Quaddeln. Sie räuspert sich ständig: „Mein Hals fühlt sich so eng an.“ Die Infusion läuft noch.',
      optionen: [
        { text: 'Ich stoppe sofort die Infusion, lasse den Zugang liegen, rufe über die Klingel Hilfe und bleibe bei ihr.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Richtig: Auslöser sofort stoppen, Zugang für Notfallmedikamente behalten, Hilfe holen. Hautzeichen plus Engegefühl im Hals deuten auf eine Anaphylaxie.', folge: 'Die Infusion steht. Eine Kollegin ruft die Ärztin, du misst.', vital: ANA_START },
        { text: 'Ich lasse die Infusion laufen und hole eine kühlende Lotion gegen den Juckreiz.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Solange die Infusion läuft, gelangt immer mehr Auslöser ins Blut. Bei Hals-Engegefühl ist es kein harmloser Juckreiz.', folge: 'Du gehst ins Lager.', vital: { ...ANA_START, rr: '78/45', puls: '138', af: '30', spo2: '89' }, zustand: 'kritisch', weiter: 'n1b' },
        { text: 'Ich messe erst alle Vitalzeichen und rufe dann die Ärztin, die Infusion läuft so lange weiter.', wertung: 'unguenstig', schritt: 'informationssammlung', rueck: 'Messen ist wichtig, aber zuerst muss der Auslöser gestoppt werden. Das kostet nur einen Handgriff.', folge: 'Während du misst, wird ihre Stimme heiser.', vital: { ...ANA_START, rr: '94/58', puls: '124', spo2: '92' } },
      ],
    },
    n1b: {
      uhrzeit: '10:16', zustand: 'kritisch', weiter: 'n2',
      situation: 'Als du zurückkommst, ist Frau K. blass und schweißig. Die Stimme ist heiser, beim Einatmen hörst du ein pfeifendes Geräusch. Sie sagt: „Mir wird schwarz vor Augen.“',
      optionen: [
        { text: 'Ich stoppe die Infusion, löse den Notfallalarm aus, lagere sie nach Beschwerden und bleibe bei ihr.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Jetzt richtig: Auslöser stoppen, Notfallteam, Lagerung nach Beschwerden (bei Atemnot halbsitzend, bei Schwindel flach mit Beinen hoch).', folge: 'Das Notfallteam ist unterwegs.' },
        { text: 'Ich lasse sie aufstehen und ans offene Fenster gehen, damit sie Luft bekommt.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Bei Anaphylaxie mit Kreislaufbeteiligung kann plötzliches Aufstehen zum Kollaps führen. Liegen bleiben, Hilfe holen.', folge: 'Sie sackt beim Aufstehen zusammen, du fängst sie auf und rufst um Hilfe.', vital: { rr: '70/40' } },
        { text: 'Ich hole den Notfallwagen und überlege, was ich brauche, bevor ich jemanden rufe.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Material ist wichtig, aber zuerst Hilfe rufen und die Infusion stoppen. Allein verliert man Zeit.', folge: 'Auf dem Flur triffst du eine Kollegin, die den Alarm auslöst.' },
      ],
    },
    n2: {
      uhrzeit: '10:13', zustand: 'verschlechtert',
      situation: 'Die Ärztin ist auf dem Weg und bittet dich, alles vorzubereiten. Frau K. hat Angst, die Quaddeln breiten sich aus.',
      optionen: [
        { text: 'Ich gehe zum Aufzug, um die Ärztin abzuholen.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Eine Anaphylaxie kann sich in Minuten verschlechtern. Bei der Patientin bleiben, die Ärztin findet das Zimmer.', folge: 'Als du zurückkommst, atmet Frau K. pfeifend.', vital: { spo2: '90', af: '28' }, zustand: 'kritisch' },
        { text: 'Ich lege Notfallmaterial und Adrenalin für die Gabe in den Oberschenkelmuskel nach Standard bereit, schließe den Monitor an, gebe Sauerstoff nach Standard und lagere sie nach Beschwerden.', wertung: 'gut', schritt: 'massnahmen', rueck: 'Genau: Adrenalin in den Muskel ist bei Anaphylaxie das wichtigste Medikament. Bereitlegen, überwachen, Sauerstoff nach Standard, beruhigen.', folge: 'Die Ärztin kommt und gibt sofort Adrenalin.', vital: { sauerstoff: 'ja', spo2: '96', rr: '108/68', puls: '108' } },
        { text: 'Ich spritze ihr schon mal ein Antiallergikum aus dem Stationsschrank.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Medikamente nur nach Anordnung. Antiallergika wirken zu langsam und ersetzen Adrenalin nicht.', folge: 'Die Ärztin fragt, was genau gegeben wurde.' },
      ],
    },
    n3: {
      uhrzeit: '10:35', zustand: 'verbessert',
      situation: 'Nach der Behandlung atmet Frau K. freier, der Blutdruck steigt. Sie fragt, ob sie das Antibiotikum morgen wieder bekommt.',
      optionen: [
        { text: 'Ich hänge die restliche Infusion langsamer wieder an, jetzt geht es ihr ja besser.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Der Auslöser darf nicht erneut gegeben werden. Die Reaktion kann sonst stärker zurückkommen.', folge: 'Nach wenigen Minuten juckt es wieder.', vital: { rr: '90/56', puls: '124' }, zustand: 'verschlechtert' },
        { text: 'Ich nehme den Monitor ab und sage ihr, sie soll sich melden, wenn etwas ist.', wertung: 'teilweise', schritt: 'evaluation', rueck: 'Die Reaktion kann Stunden später wiederkommen. Weiter überwachen, wie die Ärztin festlegt.', folge: 'Am Nachmittag klingelt sie wegen erneuten Juckreizes.' },
        { text: 'Ich überwache weiter, trage die Allergie gut sichtbar in Kurve und Akte ein, bewahre den Beutel auf und lasse sie über den Allergiepass aufklären.', wertung: 'gut', schritt: 'evaluation', rueck: 'Vollständig: Spätreaktion im Blick, Allergie dokumentiert, damit das Mittel nie wieder gegeben wird, und Information für die Patientin.', folge: 'Die Ärztin stellt ein anderes Antibiotikum um.', vital: { rr: '114/70', puls: '96', spo2: '97', af: '18' } },
      ],
    },
  },
  schluss: {
    uhrzeit: '11:30',
    gut: 'Frau K. ist erschöpft, aber stabil. Die Allergie steht rot in der Kurve, das neue Antibiotikum läuft ohne Probleme.',
    schlecht: 'Frau K. braucht erneut Notfallmedikamente und bleibt zur Überwachung am Monitor. Die Ärztin bespricht den Vorfall im Team.',
    gutVital: { rr: '118/72', puls: '88', af: '16', spo2: '98', sauerstoff: 'nein' }, schlechtVital: { rr: '96/60', puls: '118', af: '22', spo2: '94' },
  },
  wen: 'Frau K.',
  musterloesung: 'Bei Haut- plus Atem- oder Kreislaufzeichen nach Medikamentengabe an Anaphylaxie denken. Auslöser sofort stoppen, Zugang belassen, Hilfe rufen, bei der Patientin bleiben, nach Beschwerden lagern. Adrenalin zur Gabe in den Muskel nach Standard bereitlegen, Monitor, Sauerstoff nach Standard. Danach weiter überwachen, Allergie dokumentieren, Auslöser nie wieder geben.',
};

// ---------- 8. Fieberkrampf bei Lina ----------

const KRAMPF_START: Partial<Vitalwerte> = { rr: '', puls: '160', af: '34', spo2: '93', sauerstoff: 'nein', temp: '39,6', bewusstsein: 'U' };

export const FIEBERKRAMPF: Probefall = {
  szenario: szenario({
    id: 'demo-fieberkrampf', titel: 'Probefall: Lina zuckt komisch', setting: 'paediatrie',
    kurz: 'Lina, 2 Jahre, Kinderstation, aufgenommen wegen Fieber bei Infekt. Die Mutter ruft dich, weil Lina „komisch zuckt“. Fest geschriebener Kurzfall ohne KI.',
    topicIds: ['thema.fa.paediatrie', 'thema.kl.paediatrie', 'thema.beo.notfall', 'thema.kom.gespraech'],
  }),
  reihe: ['k1', 'k2', 'k3'],
  etappen: {
    k1: {
      uhrzeit: '22:10', zustand: 'kritisch',
      situation: 'Lina liegt im Gitterbett, Arme und Beine zucken rhythmisch, die Augen sind verdreht, sie reagiert nicht. Die Mutter ruft: „Tun Sie doch was!“',
      optionen: [
        { text: 'Ich halte Arme und Beine fest und schiebe ihr etwas zwischen die Zähne, damit sie sich nicht auf die Zunge beißt.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Festhalten kann Verletzungen verursachen und stoppt keinen Krampf. Nichts in den Mund schieben: Zähne und Atemwege sind in Gefahr.', folge: 'Lina beißt sich auf die Lippe, der Krampf geht weiter.', vital: { ...KRAMPF_START, spo2: '88' }, weiter: 'k1b' },
        { text: 'Ich schaue auf die Uhr, räume harte Gegenstände weg, halte sie nicht fest, lasse über die Klingel die Ärztin rufen und bleibe bei ihr und der Mutter.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Richtig: Krampfdauer messen, vor Verletzungen schützen ohne festzuhalten, Hilfe rufen und dabeibleiben. Ruhige Anweisungen helfen auch der Mutter.', folge: 'Du sagst der Mutter ruhig: „Ich bin da. Wir achten jetzt darauf, wie lange es dauert.“', vital: KRAMPF_START },
        { text: 'Ich laufe los, um die Ärztin zu holen.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Hilfe ja, aber über Klingel oder Telefon. Das Kind während eines Krampfes nicht allein lassen.', folge: 'Die Mutter bleibt allein mit Lina, bis du zurück bist.', vital: KRAMPF_START },
      ],
    },
    k1b: {
      uhrzeit: '22:14', zustand: 'kritisch', weiter: 'k2',
      situation: 'Lina krampft seit vier Minuten. Aus dem Mund kommt etwas Blut von der Lippe, die Lippen wirken bläulich.',
      optionen: [
        { text: 'Ich gebe ihr einen Schluck Wasser, damit sie sich beruhigt.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Während und kurz nach einem Krampf kann das Kind nicht sicher schlucken. Flüssigkeit gelangt leicht in die Lunge.', folge: 'Das Wasser läuft aus dem Mundwinkel, Lina röchelt.', vital: { spo2: '86' } },
        { text: 'Ich lasse los, nehme den Gegenstand aus dem Mund, löse den Notfallalarm aus und nenne die Krampfdauer.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Jetzt richtig: Ab etwa fünf Minuten Krampfdauer braucht es ärztliche Notfallbehandlung nach Standard. Die genaue Dauer ist dafür entscheidend.', folge: 'Die Ärztin kommt mit dem Notfallteam.' },
        { text: 'Ich tröste zuerst die Mutter, die weint.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Die Mutter braucht Zuwendung, aber zuerst braucht Lina Hilfe. Beides geht mit einem Satz und einem Notruf.', folge: 'Eine Kollegin hört das Weinen und löst den Alarm aus.' },
      ],
    },
    k2: {
      uhrzeit: '22:13', zustand: 'verschlechtert',
      situation: 'Der Krampf hört nach knapp drei Minuten auf. Lina ist schlaff, schläft tief und atmet schnarchend. Sie ist sehr heiß.',
      optionen: [
        { text: 'Ich lege sie auf den Rücken und gebe ihr gleich Fiebersaft in den Mund.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Nach dem Krampf ist das Kind schläfrig und kann nicht sicher schlucken. Medikamente nur nach Anordnung und erst, wenn sie wach ist.', folge: 'Lina hustet und röchelt.', vital: { spo2: '87', af: '40' }, zustand: 'kritisch', weiter: 'k2b' },
        { text: 'Ich bringe sie in die Seitenlage, halte die Atemwege frei, messe Sättigung, Atem- und Herzfrequenz und Temperatur und bleibe bei ihr.', wertung: 'gut', schritt: 'massnahmen', rueck: 'Genau: Seitenlage hält die Atemwege frei, die Werte zeigen, ob sie sich erholt. Nach dem Krampf ist tiefer Schlaf normal.', folge: 'Lina atmet ruhiger, die Sättigung steigt.', vital: { spo2: '96', af: '30', puls: '148', bewusstsein: 'V' } },
        { text: 'Ich wecke sie kräftig, um zu sehen, ob sie wieder klar ist.', wertung: 'unguenstig', schritt: 'informationssammlung', rueck: 'Der Nachschlaf ist normal. Bewusstsein prüfen ja, aber sanft, und dabei die Atemwege im Blick behalten.', folge: 'Lina wimmert kurz und schläft wieder ein.', vital: { bewusstsein: 'V' } },
      ],
    },
    k2b: {
      uhrzeit: '22:16', zustand: 'kritisch', weiter: 'k3',
      situation: 'Lina röchelt, die Lippen sind bläulich. Die Sättigung liegt unter 90 %.',
      optionen: [
        { text: 'Ich warte ab, der Krampf ist ja vorbei.', wertung: 'gefaehrlich', schritt: 'evaluation', rueck: 'Röcheln und Sättigungsabfall zeigen, dass die Atemwege nicht frei sind. Das muss sofort behoben werden.', folge: 'Die Mutter drückt den Notruf.', vital: { spo2: '84' } },
        { text: 'Ich hole die Mutter näher, damit Lina sich beruhigt.', wertung: 'teilweise', schritt: 'durchfuehrung', rueck: 'Nähe hilft später. Jetzt zählen Lagerung, Atemwege und Hilfe.', folge: 'Eine Kollegin ruft das Notfallteam.' },
        { text: 'Ich drehe sie sofort in die Seitenlage, mache den Mund frei, gebe Sauerstoff nach Standard und rufe das Notfallteam.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Richtig: Atemwege frei machen ist jetzt das Wichtigste.', folge: 'Die Sättigung steigt wieder, das Notfallteam übernimmt.', vital: { sauerstoff: 'ja', spo2: '94' } },
      ],
    },
    k3: {
      uhrzeit: '22:40', zustand: 'verbessert',
      situation: 'Die Ärztin hat Lina untersucht und ein Fiebermittel nach Anordnung gegeben. Lina wacht auf und weint. Die Mutter fragt: „Hat sie jetzt Epilepsie? Was mache ich nächstes Mal?“',
      optionen: [
        { text: 'Ich sage, so etwas sei nie gefährlich, und gehe zum nächsten Kind.', wertung: 'unguenstig', schritt: 'evaluation', rueck: 'Pauschales Beruhigen hilft nicht. Die Mutter braucht konkrete Hinweise und das ärztliche Gespräch.', folge: 'Die Mutter bleibt verunsichert zurück.' },
        { text: 'Ich dokumentiere Beginn, Dauer und Ablauf des Krampfes, kontrolliere Bewusstsein, Temperatur und Atmung engmaschig und erkläre der Mutter, was sie beim nächsten Krampf tun kann. Die Frage nach Epilepsie gebe ich an die Ärztin weiter.', wertung: 'gut', schritt: 'evaluation', rueck: 'Vollständig: genaue Dokumentation, Überwachung nach dem Krampf und Anleitung der Eltern (Zeit messen, schützen, nicht festhalten, Notruf bei langer Dauer). Diagnosefragen beantwortet die Ärztin.', folge: 'Die Mutter wiederholt die Schritte und wirkt ruhiger.', vital: { temp: '38,4', puls: '132', af: '28', spo2: '97', bewusstsein: 'A' } },
        { text: 'Ich rate ihr, Lina nachts kalt abzuduschen, damit kein Fieber mehr entsteht.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Kaltes Abduschen ist für Kleinkinder unangenehm und kann gefährlich auskühlen. Fiebersenkung nur nach ärztlicher Absprache.', folge: 'Die Mutter ist irritiert und fragt die Ärztin.' },
      ],
    },
  },
  schluss: {
    uhrzeit: '23:15',
    gut: 'Lina schläft ruhig im Arm der Mutter, die Temperatur sinkt. Die Mutter weiß, was sie beim nächsten Mal tun kann, und hat morgen ein Gespräch mit der Ärztin.',
    schlecht: 'Lina ist erschöpft und braucht weiter Sauerstoff. Die Ärztin lässt sie über Nacht engmaschig überwachen.',
    gutVital: { temp: '38,0', puls: '124', af: '26', spo2: '98', sauerstoff: 'nein', bewusstsein: 'A' }, schlechtVital: { temp: '39,0', puls: '150', af: '36', spo2: '93', bewusstsein: 'V' },
  },
  wen: 'Lina',
  musterloesung: 'Krampfdauer messen, vor Verletzungen schützen, nicht festhalten, nichts in den Mund, Hilfe per Klingel holen und dabeibleiben. Ab etwa fünf Minuten Notfallbehandlung nach Standard. Nach dem Krampf Seitenlage, Atemwege frei, Sättigung und Temperatur messen. Nichts zu trinken, solange sie schläfrig ist. Danach dokumentieren, engmaschig beobachten und die Eltern anleiten.',
};

export const PROBEFAELLE_2: Probefall[] = [SEPSIS, SCHLAGANFALL, ANAPHYLAXIE, FIEBERKRAMPF];
