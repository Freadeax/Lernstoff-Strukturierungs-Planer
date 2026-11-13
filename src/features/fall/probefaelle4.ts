// Probefälle ohne KI (Ausbau 2026-11-13, zweiter Teil): COPD-Verschlechterung beim Hausbesuch,
// Sturz in der Nacht im Pflegeheim unter Blutverdünner.
// Gleiche Regeln wie in demo.ts: genau eine „gut“-Option je Etappe, gefährliche Entscheidungen führen
// in eine eigene Wendung, Medikamente und Sauerstoff nur „nach Verordnung/Anordnung“, ohne Dosierungen.
// Inhalte erfunden und didaktisch vereinfacht, fachlich ungeprüft (siehe freigaben.ts).

import type { Szenario } from './faelle';
import type { Probefall } from './demo';
import type { Vitalwerte } from './simulator';

const szenario = (s: Omit<Szenario, 'verborgen'>): Szenario => ({ ...s, verborgen: '' });

// ---------- 11. COPD-Verschlechterung beim Hausbesuch ----------

const COPD_START: Partial<Vitalwerte> = { rr: '146/88', puls: '108', af: '26', spo2: '86', sauerstoff: 'ja', temp: '38,1', bewusstsein: 'A' };

export const COPD: Probefall = {
  szenario: szenario({
    id: 'demo-copd', titel: 'Probefall: Luft holen fällt schwer', setting: 'ambulant',
    kurz: 'Herr P., 72 Jahre, zu Hause, bekannte COPD mit Heimsauerstoff nach Verordnung. Seine Frau hat den Pflegedienst angerufen, weil er seit gestern mehr hustet. Fest geschriebener Kurzfall ohne KI.',
    topicIds: ['thema.kl.atmung', 'thema.pro.pneumonie', 'thema.kom.beratung', 'thema.fa.ambulant'],
  }),
  reihe: ['c1', 'c2', 'c3'],
  etappen: {
    c1: {
      uhrzeit: '10:15', zustand: 'verschlechtert',
      situation: 'Herr P. sitzt am Küchentisch, stützt die Arme auf und atmet mit gespitzten Lippen aus. Er spricht nur in kurzen Sätzen und hustet gelb-grünen Schleim ab. Das Sauerstoffgerät läuft. Seine Frau sagt: „Er hat die ganze Nacht nicht geschlafen.“',
      optionen: [
        { text: 'Ich drehe den Sauerstoff deutlich höher, damit die Sättigung schnell auf 98 % steigt.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Bei COPD gilt meist eine niedrigere Zielsättigung, die im Notfallplan steht. Zu viel Sauerstoff kann die Atmung dämpfen und Kohlendioxid anstauen. Sauerstoff nur nach Verordnung.', folge: 'Die Sättigung steigt, du kümmerst dich um die Medikamentenbox.', vital: { ...COPD_START, spo2: '96', af: '14', bewusstsein: 'V' }, zustand: 'kritisch', weiter: 'c1b' },
        { text: 'Ich messe Atemfrequenz, Sättigung mit laufendem Sauerstoff, Puls, Blutdruck und Temperatur, achte auf Bewusstsein und Auswurf und schaue in seinen Notfallplan.', wertung: 'gut', schritt: 'informationssammlung', rueck: 'Richtig: Erst einschätzen. Der Notfallplan nennt Zielsättigung, Bedarfsspray und wann der Arzt zu rufen ist. Fieber und verfärbter Auswurf sprechen für einen Infekt.', folge: 'Im Notfallplan steht: Zielsättigung 88 bis 92 %, Bedarfsspray, bei Verschlechterung Hausarzt.', vital: COPD_START },
        { text: 'Ich lege ihn zum Ausruhen flach aufs Sofa.', wertung: 'unguenstig', schritt: 'massnahmen', rueck: 'Flach liegend kann er die Atemhilfsmuskulatur kaum nutzen. Bei Atemnot aufrecht sitzen, Arme abstützen (Kutschersitz).', folge: 'Er richtet sich sofort wieder auf und hustet.', vital: { ...COPD_START, spo2: '84', af: '28' } },
      ],
    },
    c1b: {
      uhrzeit: '10:35', zustand: 'kritisch', weiter: 'c2',
      situation: 'Herr P. ist auffallend schläfrig und lässt sich nur schwer wecken. Er atmet langsam und flach. Seine Frau fragt: „Ist das normal, dass er jetzt so müde ist?“',
      optionen: [
        { text: 'Er schläft endlich, ich lasse ihn ruhen.', wertung: 'gefaehrlich', schritt: 'evaluation', rueck: 'Schläfrigkeit nach zu viel Sauerstoff kann eine Kohlendioxid-Vergiftung bedeuten. Das ist ein Notfall.', folge: 'Seine Frau ruft selbst den Notruf.', vital: { af: '10', bewusstsein: 'P' } },
        { text: 'Ich stelle den Sauerstoff zurück auf die verordnete Menge, setze ihn aufrecht, rufe den Notruf und bleibe bei ihm.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Jetzt richtig: zurück zur Verordnung, nicht ganz abstellen, sofort Notruf und Atmung beobachten.', folge: 'Der Rettungsdienst ist in zehn Minuten da, Herr P. wird etwas wacher.', vital: { spo2: '89', af: '18', bewusstsein: 'V' } },
        { text: 'Ich rufe den Hausarzt an und warte auf den Rückruf.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Bei Bewusstseinsstörung ist das ein Fall für den Notruf, nicht für einen Rückruf.', folge: 'Nach zehn Minuten ohne Rückruf wählst du doch den Notruf.' },
      ],
    },
    c2: {
      uhrzeit: '10:22', zustand: 'verschlechtert',
      situation: 'Die Sättigung liegt mit Sauerstoff unter der Zielsättigung, er hat Fieber, die Atemfrequenz ist hoch. Herr P. ist wach und klar.',
      optionen: [
        { text: 'Ich gebe ihm Tabletten aus der Antibiotika-Packung vom letzten Infekt.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Medikamente nur nach aktueller ärztlicher Anordnung. Ob und welches Antibiotikum, entscheidet der Arzt.', folge: 'Seine Frau ist unsicher, ob das richtig war.' },
        { text: 'Ich sage, er soll morgen zum Arzt gehen, und fahre zum nächsten Patienten.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Eine COPD-Verschlechterung mit Fieber und Sättigung unter Ziel braucht heute ärztliche Beurteilung.', folge: 'Am Nachmittag ruft die Frau den Notruf.', vital: { spo2: '83', af: '30' }, zustand: 'kritisch' },
        { text: 'Ich lasse ihn das Bedarfsspray nach Notfallplan nehmen, unterstütze Lippenbremse und Kutschersitz und rufe den Hausarzt an: Verschlechterung mit Fieber und verfärbtem Auswurf, Werte nach SBAR.', wertung: 'gut', schritt: 'massnahmen', rueck: 'Genau: Notfallplan umsetzen, atemerleichternde Techniken und eine klare Meldung an den Hausarzt mit den Werten.', folge: 'Der Hausarzt kommt in einer Stunde und bittet, bis dahin nach Notfallplan zu handeln.', vital: { spo2: '89', af: '22', puls: '100' } },
      ],
    },
    c3: {
      uhrzeit: '10:50', zustand: 'verbessert',
      situation: 'Herr P. atmet etwas ruhiger. Bevor du fährst, fragt seine Frau: „Und wenn es heute Nacht wieder schlimmer wird?“',
      optionen: [
        { text: 'Ich sage ihr, bei Atemnot einfach den Sauerstoff höher zu drehen.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Genau das kann bei COPD gefährlich werden. Sauerstoff nur nach Verordnung, bei Verschlechterung Arzt oder Notruf.', folge: 'Sie nickt und schreibt es auf.' },
        { text: 'Ich lasse ihr eine Broschüre da.', wertung: 'teilweise', schritt: 'evaluation', rueck: 'Eine Broschüre ergänzt, ersetzt aber nicht die gemeinsame Absprache der Warnzeichen.', folge: 'Sie legt die Broschüre auf den Kühlschrank.' },
        { text: 'Ich bespreche mit beiden die Warnzeichen für den Notruf (Atemnot in Ruhe, Schläfrigkeit oder Verwirrtheit, blaue Lippen, Spray hilft nicht), prüfe Gerät und Schlauch, dokumentiere und vereinbare einen Kontrollanruf.', wertung: 'gut', schritt: 'evaluation', rueck: 'Vollständig: Beratung zu konkreten Warnzeichen, Gerätesicherheit, Dokumentation und ein fester nächster Kontakt.', folge: 'Seine Frau wiederholt die Warnzeichen. Am Nachmittag rufst du an.', vital: { spo2: '90', af: '20', puls: '96' } },
      ],
    },
  },
  schluss: {
    uhrzeit: '15:00',
    gut: 'Beim Kontrollanruf sagt Frau P.: Der Hausarzt war da, das neue Medikament läuft, Herr P. hat zu Mittag gegessen und geschlafen.',
    schlecht: 'Herr P. wurde mit dem Rettungsdienst ins Krankenhaus gebracht. Seine Frau ist erschöpft und verunsichert.',
    gutVital: { spo2: '91', af: '19', puls: '92', temp: '37,6', bewusstsein: 'A' }, schlechtVital: { spo2: '85', af: '28', puls: '114', bewusstsein: 'V' },
  },
  wen: 'Herrn P.',
  musterloesung: 'Atemnot bei COPD strukturiert einschätzen (Atemfrequenz, Sättigung mit Sauerstoff, Bewusstsein, Fieber, Auswurf) und den Notfallplan nutzen. Sauerstoff nur nach Verordnung und Zielsättigung, nie eigenmächtig hochdrehen. Bedarfsspray nach Plan, Lippenbremse und Kutschersitz, Hausarzt nach SBAR. Bei Schläfrigkeit sofort Notruf. Danach Warnzeichen mit Patient und Angehörigen absprechen und einen Kontrollkontakt vereinbaren.',
};

// ---------- 12. Sturz in der Nacht unter Blutverdünner ----------

const STURZ_START: Partial<Vitalwerte> = { rr: '152/90', puls: '96', af: '18', spo2: '95', sauerstoff: 'nein', temp: '36,4', schmerz: '5', bewusstsein: 'A' };

export const STURZ: Probefall = {
  szenario: szenario({
    id: 'demo-sturz', titel: 'Probefall: Gefunden neben dem Bett', setting: 'langzeit',
    kurz: 'Herr D., 86 Jahre, Pflegeheim, Vorhofflimmern mit Blutverdünner. Bei der Nachtrunde um 3 Uhr liegt er neben seinem Bett. Fest geschriebener Kurzfall ohne KI.',
    topicIds: ['thema.pro.sturz', 'thema.kl.geriatrie', 'thema.beo.bewusstsein', 'thema.fa.langzeit'],
  }),
  reihe: ['t1', 't2', 't3'],
  etappen: {
    t1: {
      uhrzeit: '03:00', zustand: 'verschlechtert',
      situation: 'Herr D. liegt neben dem Bett, das Nachtlicht ist aus. Aus einer Platzwunde an der Stirn tropft Blut. Er stöhnt: „Ich wollte doch nur zur Toilette.“',
      optionen: [
        { text: 'Ich ziehe ihn sofort allein am Arm hoch ins Bett.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Vor dem Aufheben müssen Verletzungen ausgeschlossen werden, vor allem an Hüfte und Wirbelsäule. Allein am Arm hochziehen gefährdet ihn und dich.', folge: 'Beim Hochziehen schreit er auf.', vital: { ...STURZ_START, schmerz: '9', puls: '112', rr: '118/70' }, zustand: 'kritisch', weiter: 't1b' },
        { text: 'Ich lasse ihn zunächst liegen, spreche ihn an, prüfe Bewusstsein, Atmung und Puls, schaue nach Kopf, Hüfte und Schmerzen und frage, ob er weiß, was passiert ist.', wertung: 'gut', schritt: 'informationssammlung', rueck: 'Richtig: Erst einschätzen, dann bewegen. Bewusstsein, Verletzungen und Schmerz entscheiden, wie es weitergeht.', folge: 'Er ist wach, bewegt beide Beine ohne große Schmerzen. Ob er kurz bewusstlos war, weiß er nicht.', vital: STURZ_START },
        { text: 'Ich hole eine Kollegin aus dem anderen Wohnbereich und lasse ihn so lange liegen.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Hilfe holen ist richtig, aber über Rufanlage oder Telefon. Ihn ungeprüft allein zu lassen kostet Zeit.', folge: 'Nach fünf Minuten kommst du mit der Kollegin zurück.', vital: STURZ_START },
      ],
    },
    t1b: {
      uhrzeit: '03:06', zustand: 'kritisch', weiter: 't2',
      situation: 'Herr D. ist blass und schwitzt. Sein rechtes Bein wirkt kürzer und ist nach außen gedreht, jede Bewegung schmerzt stark.',
      optionen: [
        { text: 'Ich setze ihn trotzdem in den Rollstuhl, damit er ins Bett kommt.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Verkürztes, nach außen gedrehtes Bein spricht für einen Oberschenkelhalsbruch. Jede weitere Belastung schadet.', folge: 'Er schreit vor Schmerz, du brichst ab.', vital: { puls: '118' } },
        { text: 'Ich lege ihn behutsam zurück, polstere das Bein, decke ihn warm zu, bewege ihn nicht weiter und rufe den Notruf.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Jetzt richtig: Verdacht auf Hüftbruch, nicht weiter bewegen, Wärme erhalten, Rettungsdienst.', folge: 'Der Rettungsdienst ist alarmiert.' },
        { text: 'Ich gebe ihm aus dem Bedarf ein Schmerzmittel, ohne jemanden zu fragen.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Bedarfsmedikation nur nach Anordnung und Rücksprache. Wichtiger ist jetzt der Notruf.', folge: 'Die Schmerzen bleiben stark.' },
      ],
    },
    t2: {
      uhrzeit: '03:08', zustand: 'verschlechtert',
      situation: 'Die Platzwunde blutet weiter. Herr D. nimmt einen Blutverdünner und weiß nicht, ob er mit dem Kopf aufgeschlagen ist.',
      optionen: [
        { text: 'Ich drücke eine Kompresse auf die Wunde und informiere wegen Kopfverletzung unter Blutverdünner sofort den ärztlichen Dienst nach Hausstandard. Bewusstsein, Pupillen, Sprache und Vitalwerte kontrolliere ich engmaschig.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Genau: Unter Blutverdünner kann eine Hirnblutung auch Stunden später auftreten. Ärztliche Abklärung und Neurocheck sind Pflicht.', folge: 'Der ärztliche Bereitschaftsdienst lässt ihn zur Bildgebung ins Krankenhaus bringen.', vital: { schmerz: '3' } },
        { text: 'Ich klebe ein Pflaster drauf, bringe ihn ins Bett und schaue morgen früh wieder.', wertung: 'gefaehrlich', schritt: 'evaluation', rueck: 'Kopfverletzung unter Blutverdünner ohne Kontrolle bis zum Morgen: Eine Hirnblutung würde unbemerkt bleiben.', folge: 'Um 5 Uhr ist Herr D. kaum weckbar.', vital: { bewusstsein: 'V', rr: '178/96', puls: '58' }, zustand: 'kritisch' },
        { text: 'Ich rufe nachts niemanden an, schaue aber stündlich nach ihm.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Stündlich nachsehen ist gut, ersetzt aber nicht die ärztliche Abklärung bei Kopfverletzung unter Blutverdünner.', folge: 'Um 4 Uhr ist er schläfriger, du rufst doch an.', vital: { bewusstsein: 'V' } },
      ],
    },
    t3: {
      uhrzeit: '03:30', zustand: 'verbessert',
      situation: 'Der Rettungsdienst ist da und fragt nach den wichtigsten Informationen. Die Tochter von Herrn D. ist als Kontakt hinterlegt.',
      optionen: [
        { text: 'Ich packe zuerst in Ruhe seine Sachen.', wertung: 'teilweise', schritt: 'durchfuehrung', rueck: 'Sachen können nachgebracht werden. Der Rettungsdienst braucht jetzt die Informationen.', folge: 'Der Rettungsdienst wartet.' },
        { text: 'Ich schreibe den Sturz morgen in Ruhe auf.', wertung: 'unguenstig', schritt: 'evaluation', rueck: 'Das Sturzprotokoll gehört zeitnah geschrieben, solange Uhrzeit und Auffindesituation genau bekannt sind.', folge: 'Am Morgen weißt du die Uhrzeiten nicht mehr genau.' },
        { text: 'Ich übergebe: Auffindezeit und Situation, Blutverdünner mit letzter Einnahme, Werte, Medikamentenplan. Danach informiere ich die Tochter, schreibe das Sturzprotokoll und plane eine neue Einschätzung des Sturzrisikos (Nachtlicht, Klingel, Toilettengang).', wertung: 'gut', schritt: 'evaluation', rueck: 'Vollständig: klare Übergabe, Angehörige informiert, zeitnahe Dokumentation und Vorbeugung für das nächste Mal.', folge: 'Der Rettungsdienst fährt mit Herrn D. los, die Tochter bedankt sich für den Anruf.' },
      ],
    },
  },
  schluss: {
    uhrzeit: '06:30',
    gut: 'Das Krankenhaus ruft an: Keine Blutung im Kopf, die Wunde ist genäht. Herr D. kommt am Vormittag zurück, sein Zimmer bekommt ein Nachtlicht und einen Bewegungsmelder.',
    schlecht: 'Herr D. bleibt im Krankenhaus zur Überwachung. Die Pflegedienstleitung bespricht den Ablauf der Nacht im Team.',
    gutVital: { rr: '142/84', puls: '84', schmerz: '2', bewusstsein: 'A' }, schlechtVital: { rr: '164/92', puls: '64', bewusstsein: 'V' },
  },
  wen: 'Herrn D.',
  musterloesung: 'Nach einem Sturz nicht sofort aufheben: erst Bewusstsein, Atmung, Kreislauf, Verletzungen und Schmerz einschätzen. Bei Verdacht auf Hüftbruch nicht bewegen, Notruf. Kopfverletzung unter Blutverdünner immer ärztlich abklären lassen und Bewusstsein engmaschig kontrollieren. Übergabe mit Auffindezeit und Blutverdünner, Angehörige informieren, Sturzprotokoll zeitnah, Sturzrisiko neu einschätzen.',
};

export const PROBEFAELLE_4: Probefall[] = [COPD, STURZ];
