// Probefälle ohne KI: fest geschriebene, verzweigte Kurzfälle, damit der Simulator samt
// Fotoszene, Monitor und Auswertung auch ohne API-Schlüssel und offline läuft. Eine Entscheidung
// kann in einen anderen Verlauf führen (Option.weiter), nicht nur die Werte ändern.
// Sie zählen nicht für den Lernplan. Inhalte sind erfunden und didaktisch vereinfacht;
// Medikamente nur „nach Anordnung“ bzw. Hausstandard, ohne Dosierungen.

import type { Szenario } from './faelle';
import { PROBEFAELLE_2 } from './probefaelle2';
import type { Abschluss, Fall, Note, Schritt, Vitalwerte, Wertung, Zug, Zustand } from './simulator';

interface Option {
  text: string;
  wertung: Exclude<Wertung, 'keine'>;
  schritt: Schritt;
  rueck: string;
  /** Was unmittelbar passiert, steht vor der nächsten Situation */
  folge: string;
  vital?: Partial<Vitalwerte>;
  zustand?: Zustand;
  /** Abzweig: nächste Etappe statt der Hauptlinie */
  weiter?: string;
}
interface Etappe {
  uhrzeit: string; situation: string; zustand: Zustand; vital?: Partial<Vitalwerte>; optionen: Option[];
  /** Nach dieser Etappe hierhin (für Abzweige zurück auf die Hauptlinie) */
  weiter?: string;
}
export interface Probefall {
  szenario: Szenario;
  /** Hauptlinie; Abzweige kehren über Etappe.weiter dorthin zurück */
  reihe: string[];
  etappen: Record<string, Etappe>;
  schluss: { uhrzeit: string; gut: string; schlecht: string; gutVital: Partial<Vitalwerte>; schlechtVital: Partial<Vitalwerte> };
  /** Für die Auswertung: „Herrn K.“ */
  wen: string;
  musterloesung: string;
}

const LEER: Vitalwerte = { rr: '', puls: '', af: '', spo2: '', sauerstoff: '', temp: '', bz: '', schmerz: '', bewusstsein: '' };
const KRANK: Partial<Vitalwerte> = { rr: '165/95', puls: '112', af: '26', spo2: '89', sauerstoff: 'nein', temp: '36,9', bewusstsein: 'A' };

const szenario = (s: Omit<Szenario, 'verborgen'>): Szenario => ({ ...s, verborgen: '' });

// ---------- 1. Atemnot in der Nacht (Herzinsuffizienz) ----------

const HERZ: Probefall = {
  szenario: szenario({
    id: 'demo-atemnot', titel: 'Probefall: Atemnot in der Nacht', setting: 'krankenhaus',
    kurz: 'Herr K., 78 Jahre, internistische Station, bekannte Herzinsuffizienz. Er klingelt um 2 Uhr nachts. Fest geschriebener Kurzfall ohne KI.',
    topicIds: ['thema.kl.herz.insuffizienz', 'thema.beo.notfall', 'thema.pp.anamnese'],
  }),
  reihe: ['e1', 'e2', 'e3', 'e4'],
  etappen: {
    e1: {
      uhrzeit: '02:05', zustand: 'verschlechtert',
      situation: 'Herr K. sitzt auf der Bettkante und ringt nach Luft. „Ich krieg so schlecht Luft, Schwester … im Liegen geht gar nichts.“ Er wirkt ängstlich, die Stirn ist feucht.',
      optionen: [
        { text: 'Ich beruhige ihn und sage, er soll versuchen weiterzuschlafen.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Akute Atemnot ist ein Warnzeichen. Ohne Einschätzung der Vitalzeichen bleibt eine Verschlechterung unerkannt.', folge: 'Du gehst zurück zum Stützpunkt.', vital: { ...KRANK, spo2: '86', af: '30', puls: '120' }, zustand: 'kritisch', weiter: 'e1b' },
        { text: 'Ich messe Blutdruck, Puls, Atemfrequenz, Sättigung und Temperatur und prüfe das Bewusstsein.', wertung: 'gut', schritt: 'informationssammlung', rueck: 'Genau richtig: Erst vollständige Vitalzeichen, dann NEWS2 bilden. So wird aus „er hat Atemnot“ eine belastbare Einschätzung.', folge: 'Du legst Manschette und Pulsoxymeter an und zählst die Atemzüge.', vital: KRANK },
        { text: 'Ich lege ihn flach hin, damit er zur Ruhe kommt.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Bei kardialer Atemnot verstärkt Flachlagerung den Rückstrom zum Herzen und damit die Lungenstauung.', folge: 'Kaum liegt er flach, hustet er und richtet sich panisch wieder auf.', vital: { ...KRANK, spo2: '87', af: '28' }, weiter: 'e1b' },
      ],
    },
    e1b: {
      uhrzeit: '02:15', zustand: 'kritisch', weiter: 'e2',
      situation: 'Herr K. klingelt Sturm. Er sitzt nach vorn gebeugt, atmet schnell und brodelnd und hustet schaumigen Auswurf. Seine Lippen wirken bläulich.',
      optionen: [
        { text: 'Ich setze ihn aufrecht hin, messe sofort alle Vitalzeichen und lasse über die Kollegin die Ärztin rufen.', wertung: 'gut', schritt: 'informationssammlung', rueck: 'Spät, aber jetzt richtig: Aufrichten entlastet, die Werte machen die Lage greifbar, und die Ärztin wird parallel informiert.', folge: 'Die Kollegin telefoniert, du legst Manschette und Pulsoxymeter an.', vital: { spo2: '87', af: '30' } },
        { text: 'Ich gebe ihm ein Glas Wasser gegen den Husten.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Schaumiger Auswurf und Atemnot sprechen für ein Lungenödem. Trinken löst das nicht und kann zum Verschlucken führen.', folge: 'Er kann kaum schlucken und hustet stärker.', vital: { spo2: '85' } },
        { text: 'Ich schreibe die Uhrzeit auf und beobachte ihn noch ein paar Minuten.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Bei Zeichen eines Lungenödems zählt jede Minute. Beobachten ohne Handeln verzögert die Hilfe.', folge: 'Seine Atmung wird immer flacher, du rufst schließlich doch Hilfe.', vital: { spo2: '84', af: '32' } },
      ],
    },
    e2: {
      uhrzeit: '02:12', zustand: 'verschlechtert',
      situation: 'Die Werte stehen auf dem Monitor: Die Sättigung ist niedrig, Puls und Atemfrequenz sind hoch. Du hörst ein feuchtes Rasseln beim Atmen, beide Unterschenkel sind geschwollen.',
      optionen: [
        { text: 'Ich gebe ihm ein großes Glas Wasser gegen den trockenen Mund.', wertung: 'unguenstig', schritt: 'massnahmen', rueck: 'Bei Herzinsuffizienz ist die Trinkmenge oft begrenzt. Erst Lage klären, Mundpflege statt großer Trinkmengen.', folge: 'Er trinkt hastig und verschluckt sich fast.' },
        { text: 'Ich lagere den Oberkörper hoch, die Beine tief (Herzbettlage), und bleibe bei ihm.', wertung: 'gut', schritt: 'massnahmen', rueck: 'Die Herzbettlage entlastet Herz und Lunge sofort. Dabeibleiben nimmt Angst und damit Atemarbeit.', folge: 'Du stellst das Kopfteil hoch und senkst das Fußteil. Herr K. atmet etwas ruhiger.', vital: { spo2: '91', af: '24' } },
        { text: 'Ich hole zuerst die Kollegin aus dem Nachbarzimmer und frage, was sie meint.', wertung: 'teilweise', schritt: 'informationssammlung', rueck: 'Hilfe holen ist gut, aber die Lagerung kostet keine Sekunde und sollte vorher passieren.', folge: 'Die Kollegin kommt kurz herein: „Setz ihn hoch und ruf die Ärztin!“' },
      ],
    },
    e3: {
      uhrzeit: '02:16', zustand: 'verschlechtert',
      situation: 'Der Monitor alarmiert, der NEWS2 liegt bei 7 Punkten. Herr K. fragt mit gepresster Stimme: „Muss ich jetzt sterben?“',
      optionen: [
        { text: 'Ich warte bis zur Frühschicht und dokumentiere die Werte.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Ein NEWS2 von 7 verlangt eine sofortige ärztliche Beurteilung. Warten gefährdet den Patienten.', folge: 'Die Sättigung fällt weiter. Erst um 02:40 rufst du doch an.', vital: { spo2: '86', af: '30', puls: '124' }, zustand: 'kritisch' },
        { text: 'Ich gebe ihm aus eigenem Ermessen hoch dosiert Sauerstoff.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Sauerstoff braucht eine Anordnung oder einen Hausstandard. Wichtiger ist jetzt der Anruf bei der Ärztin.', folge: 'Du schließt die Sauerstoffbrille an, aber niemand weiß von der Lage.', vital: { spo2: '92', sauerstoff: 'ja' } },
        { text: 'Ich rufe die diensthabende Ärztin an und übergebe nach SBAR.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Strukturierte Übergabe nach SBAR mit NEWS2 sorgt dafür, dass die Ärztin die Dringlichkeit sofort erkennt.', folge: 'Am Telefon schilderst du Situation, Hintergrund, Einschätzung und Empfehlung. Die Ärztin kommt sofort.' },
      ],
    },
    e4: {
      uhrzeit: '02:24', zustand: 'verschlechtert',
      situation: 'Die Ärztin kommt herein, hört ab und ordnet Sauerstoff über Nasenbrille, ein Diuretikum und eine Flüssigkeitsbilanz an. Da klingelt das Telefon: Die Tochter ruft an und fragt, wie es ihrem Vater geht.',
      optionen: [
        { text: 'Ich verabreiche die Medikamente und gehe dann zu den anderen Patienten, ohne nachzukontrollieren.', wertung: 'teilweise', schritt: 'evaluation', rueck: 'Die Umsetzung stimmt, doch ohne Kontrolle der Wirkung bleibt offen, ob es ihm besser geht.', folge: 'Die Anordnungen laufen. Herr K. bleibt allein.', vital: { sauerstoff: 'ja', spo2: '93' } },
        { text: 'Ich erkläre der Tochter am Telefon ausführlich die Diagnose.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Diagnosen erklärt die Ärztin. Am Telefon ist die Identität unklar, Schweigepflicht beachten und einen Rückruf anbieten.', folge: 'Während du telefonierst, wartet die Ärztin auf dich.', vital: { sauerstoff: 'ja' } },
        { text: 'Ich setze die Anordnungen um, starte die Bilanz und kontrolliere die Werte in 15 Minuten. Der Tochter biete ich einen Rückruf der Ärztin an.', wertung: 'gut', schritt: 'evaluation', rueck: 'Umsetzen, Wirkung kontrollieren und Angehörige angemessen einbinden: Das ist der vollständige Pflegeprozess.', folge: 'Die Sauerstoffbrille sitzt, die Bilanz läuft, die Tochter ist beruhigt.', vital: { sauerstoff: 'ja', spo2: '94' } },
      ],
    },
  },
  schluss: {
    uhrzeit: '02:45',
    gut: 'Herr K. atmet ruhiger, die Lippen sind wieder rosig. „Danke, dass Sie da waren.“ Die Ärztin bittet dich um eine kurze Übergabe an die Frühschicht.',
    schlecht: 'Herr K. ist erschöpft, die Atmung bleibt angestrengt. Die Ärztin übernimmt und lässt ihn engmaschig überwachen.',
    gutVital: { spo2: '95', af: '19', puls: '92', rr: '140/85' }, schlechtVital: { spo2: '91', af: '24', puls: '108' },
  },
  wen: 'Herrn K.',
  musterloesung: 'Vitalzeichen vollständig erheben und NEWS2 bilden, Herzbettlage herstellen und beim Patienten bleiben, bei NEWS2 ab 7 sofort die Ärztin nach SBAR informieren, Anordnungen umsetzen, Wirkung nach 15 Minuten kontrollieren, Bilanz führen und Angehörige an die Ärztin verweisen.',
};

// ---------- 2. Unterzuckerung im Pflegeheim ----------

const HYPO_START: Partial<Vitalwerte> = { rr: '150/85', puls: '104', af: '18', spo2: '96', sauerstoff: 'nein', temp: '36,6', bz: '48', bewusstsein: 'A' };

const HYPO: Probefall = {
  szenario: szenario({
    id: 'demo-hypo', titel: 'Probefall: Unruhe vor dem Mittagessen', setting: 'langzeit',
    kurz: 'Frau S., 81 Jahre, Pflegeheim, Diabetes mellitus Typ 2 mit Insulin, leichte Demenz. Kurz vor dem Mittagessen ist sie schweißig und gereizt. Fest geschriebener Kurzfall ohne KI.',
    topicIds: ['thema.kl.diabetes', 'thema.beo.notfall', 'thema.fa.langzeit'],
  }),
  reihe: ['h1', 'h2', 'h3'],
  etappen: {
    h1: {
      uhrzeit: '11:30', zustand: 'verschlechtert',
      situation: 'Frau S. sitzt auf der Bettkante, zittert und hat Schweißperlen auf der Stirn. „Lassen Sie mich in Ruhe, ich geh nicht essen!“ Sonst ist sie um diese Zeit freundlich.',
      optionen: [
        { text: 'Ich messe sofort den Blutzucker und die Vitalzeichen.', wertung: 'gut', schritt: 'informationssammlung', rueck: 'Richtig: Schwitzen, Zittern und eine plötzliche Wesensänderung bei Insulintherapie sind Warnzeichen einer Unterzuckerung. Der Blutzucker klärt es in einer Minute.', folge: 'Das Messgerät zeigt 48 mg/dl. Puls 104, sonst unauffällig.', vital: HYPO_START },
        { text: 'Ich lasse sie in Ruhe, sie ist eben schlecht gelaunt, das kommt bei Demenz vor.', wertung: 'gefaehrlich', schritt: 'informationssammlung', rueck: 'Eine plötzliche Verhaltensänderung nicht vorschnell der Demenz zuschreiben. Bei Insulintherapie zuerst an Unterzuckerung denken und messen.', folge: 'Du gehst weiter zur nächsten Bewohnerin.', vital: { ...HYPO_START, bz: '36', bewusstsein: 'V', puls: '112' }, zustand: 'kritisch', weiter: 'h1b' },
        { text: 'Ich spritze ihr schon das Mittagsinsulin, damit sie gleich essen kann.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Insulin ohne vorherige Blutzuckermessung ist gefährlich. Bei diesen Zeichen kann es eine bestehende Unterzuckerung lebensbedrohlich verstärken.', folge: 'Du spritzt das Insulin und gehst ins Speisezimmer.', vital: { ...HYPO_START, bz: '36', bewusstsein: 'V', puls: '116' }, zustand: 'kritisch', weiter: 'h1b' },
      ],
    },
    h1b: {
      uhrzeit: '11:50', zustand: 'kritisch', weiter: 'h3',
      situation: 'Eine Kollegin ruft dich: Frau S. liegt schräg im Bett, ist kaltschweißig und reagiert nur noch, wenn man sie laut anspricht. Das Messgerät zeigt 36 mg/dl.',
      optionen: [
        { text: 'Ich flöße ihr Orangensaft ein, damit der Zucker schnell steigt.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Bei eingeschränktem Bewusstsein nichts zu trinken geben: Sie kann sich verschlucken (Aspiration). Jetzt braucht es ärztliche Hilfe.', folge: 'Sie hustet und verschluckt sich. Die Kollegin ruft den Notarzt.', vital: { spo2: '91' } },
        { text: 'Ich bleibe bei ihr, sichere die Atemwege (Seitenlage), lasse den Notarzt rufen und lege das Notfallset nach Notfallplan bereit.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Richtig: Atemwege sichern, Notruf, nichts in den Mund geben. Glukagon oder Glukose nur nach Notfallplan bzw. ärztlich.', folge: 'Der Notarzt ist nach wenigen Minuten da und gibt Glukose in die Vene. Frau S. wird zusehends wacher.', vital: { bz: '118', bewusstsein: 'A', puls: '92' }, zustand: 'verbessert' },
        { text: 'Ich hole zuerst die Wohnbereichsleitung und frage, was wir tun sollen.', wertung: 'teilweise', schritt: 'durchfuehrung', rueck: 'Hilfe holen ist gut, aber bei Bewusstseinsstörung zuerst Notruf und Atemwege sichern. Rückfragen kosten hier Zeit.', folge: 'Die Leitung schickt dich sofort zum Telefon. Der Notarzt kommt etwas später und gibt Glukose in die Vene.', vital: { bz: '104', bewusstsein: 'A', puls: '96' }, zustand: 'verbessert' },
      ],
    },
    h2: {
      uhrzeit: '11:34', zustand: 'verschlechtert',
      situation: 'Der Blutzucker liegt bei 48 mg/dl. Frau S. ist wach, kann schlucken, ist aber fahrig und unruhig.',
      optionen: [
        { text: 'Ich gebe ihr nach Hausstandard schnell wirksame Kohlenhydrate zu trinken (Traubenzuckerlösung oder Saft) und bleibe bei ihr.', wertung: 'gut', schritt: 'massnahmen', rueck: 'Genau: Bei wacher Bewohnerin, die sicher schlucken kann, schnell wirksame Kohlenhydrate geben und dabeibleiben.', folge: 'Sie trinkt den Saft in kleinen Schlucken. Nach einigen Minuten wird sie ruhiger.', vital: { bz: '72', puls: '94' }, zustand: 'verbessert' },
        { text: 'Ich gebe ihr ein Stück Schokolade aus ihrer Schublade.', wertung: 'unguenstig', schritt: 'massnahmen', rueck: 'Das Fett in Schokolade verzögert die Zuckeraufnahme. Schnell wirksame Kohlenhydrate wie Traubenzucker oder Saft helfen schneller.', folge: 'Sie isst die Schokolade, der Zucker steigt nur langsam.', vital: { bz: '58' } },
        { text: 'Ich rufe die Hausärztin an und warte mit allem auf den Rückruf.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Die Hausärztin informieren ist richtig, aber erst nach der Soforthilfe. Warten lässt den Zucker weiter fallen.', folge: 'Die Praxis ist in der Mittagspause. Während du wartest, wird Frau S. immer schläfriger.', vital: { bz: '36', bewusstsein: 'V' }, zustand: 'kritisch', weiter: 'h1b' },
      ],
    },
    h3: {
      uhrzeit: '11:55', zustand: 'verbessert',
      situation: 'Frau S. ist wieder wach und ansprechbar, der Blutzucker ist gestiegen. Das Mittagessen steht bereit, laut Plan wäre jetzt auch ihr Mittagsinsulin dran.',
      optionen: [
        { text: 'Ich kontrolliere den Blutzucker nach 15 Minuten erneut, gebe ihr eine Mahlzeit mit langsamen Kohlenhydraten, dokumentiere alles und kläre die Insulingabe mit der Hausärztin.', wertung: 'gut', schritt: 'evaluation', rueck: 'Vollständig: Wirkung kontrollieren, nachhaltig Kohlenhydrate geben, dokumentieren und die Ursache (Insulindosis, Essmenge) ärztlich klären lassen.', folge: 'Nach 15 Minuten zeigt das Gerät 112 mg/dl. Die Hausärztin passt die Insulindosis an.', vital: { bz: '112' } },
        { text: 'Ich gebe das Mittagsinsulin wie geplant, damit der Plan eingehalten wird.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Nach einer Unterzuckerung das geplante Insulin nicht einfach geben, sondern mit der Ärztin abklären. Sonst droht die nächste Unterzuckerung.', folge: 'Am Nachmittag ist Frau S. wieder zittrig.', vital: { bz: '54' } },
        { text: 'Es geht ihr ja wieder gut, ich trage nichts ein und mache mit der Runde weiter.', wertung: 'unguenstig', schritt: 'evaluation', rueck: 'Ohne Kontrollmessung und Dokumentation bleibt offen, ob der Zucker stabil bleibt, und die Kolleginnen wissen nichts davon.', folge: 'Am Abend fragt die Spätschicht, warum Frau S. so müde ist.' },
      ],
    },
  },
  schluss: {
    uhrzeit: '12:30',
    gut: 'Frau S. isst ihr Mittagessen auf und plaudert mit der Tischnachbarin. Die Hausärztin hat die Insulindosis angepasst, alles steht in der Dokumentation.',
    schlecht: 'Frau S. ist erschöpft und bleibt im Bett. Die Pflegefachkraft ordnet engmaschige Blutzuckerkontrollen an und spricht mit dir über den Verlauf.',
    gutVital: { bz: '124', puls: '84' }, schlechtVital: { bz: '68', puls: '100' },
  },
  wen: 'Frau S.',
  musterloesung: 'Bei Schwitzen, Zittern und plötzlicher Wesensänderung unter Insulin sofort Blutzucker messen. Wach und schluckfähig: schnell wirksame Kohlenhydrate nach Hausstandard, dabeibleiben, nach 15 Minuten erneut messen, dann eine Mahlzeit. Bei Bewusstseinsstörung nichts in den Mund, Atemwege sichern, Notruf. Danach dokumentieren und Insulin mit der Ärztin klären.',
};

// ---------- 3. Nachblutung nach Knie-OP ----------

const BLUT_START: Partial<Vitalwerte> = { rr: '98/60', puls: '118', af: '22', spo2: '95', sauerstoff: 'nein', temp: '36,1', schmerz: '5', bewusstsein: 'A' };

const BLUTUNG: Probefall = {
  szenario: szenario({
    id: 'demo-nachblutung', titel: 'Probefall: Der Verband wird rot', setting: 'krankenhaus',
    kurz: 'Herr W., 58 Jahre, Unfallchirurgie, heute Mittag Knie-TEP rechts. Am Abend klingelt er: Ihm ist übel und er friert. Fest geschriebener Kurzfall ohne KI.',
    topicIds: ['thema.ph.periop', 'thema.ph.wunde', 'thema.beo.notfall', 'thema.beo.vitalzeichen'],
  }),
  reihe: ['b1', 'b2', 'b3'],
  etappen: {
    b1: {
      uhrzeit: '19:40', zustand: 'verschlechtert',
      situation: 'Herr W. ist blass und fröstelt. „Mir ist so komisch, irgendwie übel.“ Die Decke liegt über dem operierten Bein.',
      optionen: [
        { text: 'Ich messe Puls, Blutdruck, Atmung und Temperatur und schaue mir Verband, Drainage und Bein an.', wertung: 'gut', schritt: 'informationssammlung', rueck: 'Richtig: Übelkeit, Frieren und Blässe nach einer OP können Zeichen eines Volumenmangels sein. Vitalzeichen und Wundkontrolle gehören zusammen.', folge: 'Du schlägst die Decke zurück: Der Verband ist großflächig durchgeblutet, in der Drainage stehen fast 400 ml.', vital: BLUT_START },
        { text: 'Ich bringe ihm eine zweite Decke und eine Brechschale.', wertung: 'unguenstig', schritt: 'massnahmen', rueck: 'Wärme und Brechschale sind freundlich, behandeln aber nicht die Ursache. Erst Vitalzeichen und Wunde prüfen.', folge: 'Herr W. bedankt sich. Zwanzig Minuten später klingelt er erneut.', vital: { ...BLUT_START, rr: '84/50', puls: '134' }, zustand: 'kritisch', weiter: 'b2b' },
        { text: 'Ich frage nach Schmerzen und gebe das Schmerzmittel aus der Bedarfsanordnung.', wertung: 'teilweise', schritt: 'massnahmen', rueck: 'Schmerz erfragen ist wichtig, aber Übelkeit und Frieren nach einer OP verlangen zuerst Vitalzeichen und einen Blick auf die Wunde.', folge: 'Beim Zurechtlegen der Decke siehst du Blut am Laken. Der Verband ist durchgeblutet, die Drainage fast voll.', vital: BLUT_START },
      ],
    },
    b2: {
      uhrzeit: '19:45', zustand: 'verschlechtert',
      situation: 'Puls 118, Blutdruck 98/60: Der Puls liegt über dem oberen Blutdruckwert (Schockindex über 1). Der Verband ist durchgeblutet, die Drainage hat in einer Stunde fast 400 ml gefördert.',
      optionen: [
        { text: 'Ich bleibe bei ihm, lasse die Ärztin sofort rufen und übergebe nach SBAR mit Schockindex und Drainagemenge. Bis sie kommt, messe ich alle 5 Minuten.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Genau: Ein Schockindex über 1 und viel Blut in der Drainage sind ein Notfall. Sofort ärztlich informieren und engmaschig überwachen.', folge: 'Die Ärztin ist nach wenigen Minuten im Zimmer.', vital: { rr: '96/58', puls: '120' } },
        { text: 'Ich verstärke den Verband und schaue in einer Stunde wieder nach.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Den Verband verstärken versteckt die Blutung nur. Eine Stunde abwarten kann in den Schock führen.', folge: 'Du wickelst eine weitere Binde darüber und gehst.', vital: { rr: '84/50', puls: '134' }, zustand: 'kritisch', weiter: 'b2b' },
        { text: 'Ich leere die Drainage und trage die Menge ins Protokoll ein.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Dokumentieren ist Pflicht, aber diese Menge ist ein Alarmzeichen. Erst die Ärztin informieren, dann dokumentieren.', folge: 'Während du schreibst, wird Herr W. unruhig und kaltschweißig.', vital: { rr: '84/50', puls: '134' }, zustand: 'kritisch', weiter: 'b2b' },
      ],
    },
    b2b: {
      uhrzeit: '20:05', zustand: 'kritisch', weiter: 'b3',
      situation: 'Herr W. ist kaltschweißig, unruhig und sehr blass. Blutdruck 84/50, Puls 134. „Mir wird schwarz vor Augen.“',
      optionen: [
        { text: 'Ich löse den Notfallalarm aus, lagere die Beine hoch, gebe Sauerstoff nach Standard und bleibe bei ihm.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Richtig bei Schockzeichen: Notfallteam, Schocklage, Sauerstoff nach Standard und nicht allein lassen.', folge: 'Das Notfallteam ist in zwei Minuten da und legt einen zweiten Zugang.', vital: { sauerstoff: 'ja', spo2: '97' } },
        { text: 'Ich gebe ihm etwas zu trinken, er hat ja Flüssigkeit verloren.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Trinken ersetzt kein Blut und ist vor einer möglichen Not-OP gefährlich (Aspiration). Patient bleibt nüchtern.', folge: 'Er erbricht. Eine Kollegin löst den Notfallalarm aus.', vital: { rr: '80/48', puls: '138' } },
        { text: 'Ich rufe die Stationsärztin an und schildere die Lage.', wertung: 'teilweise', schritt: 'durchfuehrung', rueck: 'Ärztliche Hilfe ist richtig, doch bei Schockzeichen ist der Notfallalarm schneller. Schocklage und Dabeibleiben nicht vergessen.', folge: 'Die Ärztin kommt und ruft selbst das Notfallteam dazu.' },
      ],
    },
    b3: {
      uhrzeit: '20:15', zustand: 'verschlechtert',
      situation: 'Die Ärztin ordnet eine Infusion, eine Blutabnahme (Blutbild, Kreuzblut) und Nüchternheit an, die Operateurin ist informiert. Herr W. fragt, ob er noch zu Abend essen darf.',
      optionen: [
        { text: 'Ich bereite Blutabnahme und Infusion vor, erkläre ihm, dass er nüchtern bleiben muss, und kontrolliere Vitalzeichen, Verband und Drainage alle 15 Minuten.', wertung: 'gut', schritt: 'evaluation', rueck: 'Vollständig: Anordnungen umsetzen, Nüchternheit begründen und den Verlauf engmaschig überwachen und dokumentieren.', folge: 'Die Infusion läuft, der Puls sinkt langsam.', vital: { rr: '108/66', puls: '104' } },
        { text: 'Ich bringe ihm sein Abendessen, damit der Kreislauf wieder in Schwung kommt.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Bei einer möglichen Revision muss er nüchtern bleiben. Essen kann bei der Narkose zum Verschlucken führen.', folge: 'Die Ärztin sieht das Tablett und lässt es sofort wieder abräumen.' },
        { text: 'Ich setze die Anordnungen um und schaue nach der Übergabe wieder nach.', wertung: 'teilweise', schritt: 'evaluation', rueck: 'Die Anordnungen stimmen, aber nach einer Schockphase braucht es engmaschige Kontrollen, nicht erst nach der Übergabe.', folge: 'Die Infusion läuft. Eine Kollegin übernimmt die Kontrollen.', vital: { rr: '104/64', puls: '108' } },
      ],
    },
  },
  schluss: {
    uhrzeit: '21:00',
    gut: 'Herr W. ist stabil, der Blutdruck steigt. Die Operateurin kommt zur Visite und entscheidet über eine Revision. Deine Übergabe an den Nachtdienst ist kurz und vollständig.',
    schlecht: 'Herr W. bleibt kreislaufinstabil und wird zur Revision in den OP gebracht. Im Nachgespräch geht ihr den Verlauf noch einmal durch.',
    gutVital: { rr: '116/72', puls: '96' }, schlechtVital: { rr: '92/56', puls: '120' },
  },
  wen: 'Herrn W.',
  musterloesung: 'Bei Übelkeit, Frieren und Blässe nach einer OP Vitalzeichen und Wunde mit Drainage prüfen. Schockindex (Puls durch systolischen Blutdruck) über 1 und viel Blut in der Drainage: sofort ärztlich informieren nach SBAR, dabeibleiben, engmaschig messen. Bei Schockzeichen Notfallalarm, Schocklage, Sauerstoff nach Standard, nüchtern lassen. Anordnungen umsetzen und dokumentieren.',
};

// ---------- 4. Asthmaanfall bei Ben ----------

const ASTHMA_START: Partial<Vitalwerte> = { rr: '', puls: '128', af: '34', spo2: '91', sauerstoff: 'nein', temp: '37,6', bewusstsein: 'A' };

const ASTHMA: Probefall = {
  szenario: szenario({
    id: 'demo-asthma', titel: 'Probefall: Das Spray hilft heute nicht', setting: 'paediatrie',
    kurz: 'Ben, 7 Jahre, Kinderstation, bekanntes Asthma, seit zwei Tagen erkältet. Nach dem Spielen sitzt er vornübergebeugt im Bett, die Mutter ist bei ihm. Fest geschriebener Kurzfall ohne KI.',
    topicIds: ['thema.kl.atmung', 'thema.kl.paediatrie', 'thema.beo.notfall'],
  }),
  reihe: ['a1', 'a2', 'a3'],
  etappen: {
    a1: {
      uhrzeit: '14:20', zustand: 'verschlechtert',
      situation: 'Ben stützt die Arme auf die Knie und spricht nur in kurzen Sätzen. Beim Ausatmen hörst du ein Pfeifen. Seine Mutter fragt aufgeregt: „Das ist doch nicht normal, oder?“',
      optionen: [
        { text: 'Ich lasse ihn aufrecht sitzen, messe Sättigung, Atem- und Herzfrequenz und bleibe ruhig bei ihm und der Mutter.', wertung: 'gut', schritt: 'informationssammlung', rueck: 'Richtig: Aufrecht sitzen mit abgestützten Armen erleichtert das Atmen. Die Werte zeigen, wie schwer der Anfall ist. Ruhe überträgt sich auf das Kind.', folge: 'Das Pulsoxymeter zeigt 91 %, Ben atmet 34-mal pro Minute, zwischen den Rippen ziehen sich die Muskeln ein.', vital: ASTHMA_START },
        { text: 'Ich lege ihn flach hin, damit er sich ausruhen kann.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Im Liegen kann Ben die Atemhilfsmuskulatur kaum nutzen. Bei Atemnot immer aufrecht sitzen lassen.', folge: 'Ben richtet sich panisch wieder auf und hustet.', vital: { ...ASTHMA_START, spo2: '87', af: '38', puls: '136' }, zustand: 'kritisch', weiter: 'a2b' },
        { text: 'Ich bitte die Mutter, draußen zu warten, damit Ben zur Ruhe kommt.', wertung: 'teilweise', schritt: 'durchfuehrung', rueck: 'Kinder beruhigt meist die vertraute Bezugsperson. Die Mutter einbeziehen statt wegschicken, und zuerst die Werte erheben.', folge: 'Ben weint, als die Mutter geht. Du misst: 91 %, Atemfrequenz 36.', vital: { ...ASTHMA_START, af: '36', puls: '134' } },
      ],
    },
    a2: {
      uhrzeit: '14:24', zustand: 'verschlechtert',
      situation: 'SpO₂ 91 %, Atemfrequenz deutlich erhöht, sichtbare Einziehungen. Im Asthma-Notfallplan ist ein Bedarfsspray angeordnet, Spacer mit Maske liegen am Bett.',
      optionen: [
        { text: 'Ich gebe das angeordnete Bedarfsspray über den Spacer nach Notfallplan und informiere die Ärztin.', wertung: 'gut', schritt: 'massnahmen', rueck: 'Genau: Bei Kindern das Spray über einen Spacer geben, sonst landet der Wirkstoff im Mund statt in der Lunge. Die Ärztin parallel informieren.', folge: 'Ben atmet ruhig in den Spacer. Die Ärztin ist unterwegs.', vital: { spo2: '93', af: '30' } },
        { text: 'Ich gebe ihm das Spray direkt in den Mund, ohne Spacer, das geht schneller.', wertung: 'unguenstig', schritt: 'massnahmen', rueck: 'Ohne Spacer kommt bei Kindern kaum Wirkstoff in die Bronchien, besonders bei schneller Atmung.', folge: 'Ben hustet nach dem Sprühstoß. Viel bessert sich nicht.', vital: { spo2: '90', af: '35' } },
        { text: 'Ich warte ab, ob es von selbst besser wird.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Ein Asthmaanfall mit Sättigungsabfall bessert sich nicht von allein. Der Notfallplan ist genau für diesen Moment da.', folge: 'Zehn Minuten vergehen.', vital: { spo2: '87', af: '40', puls: '142' }, zustand: 'kritisch', weiter: 'a2b' },
      ],
    },
    a2b: {
      uhrzeit: '14:35', zustand: 'kritisch', weiter: 'a3',
      situation: 'Ben kann kaum noch sprechen. Das Pfeifen ist leiser geworden, die Lippen sind bläulich, die Sättigung liegt bei 87 %.',
      optionen: [
        { text: 'Ich rufe sofort das Notfallteam, gebe Sauerstoff nach Standard und das Spray über den Spacer nach Notfallplan und bleibe bei ihm.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Richtig: Leiseres Pfeifen bei schlechterem Zustand ist ein Alarmzeichen (kaum Luftstrom, „stille Lunge“). Sofort Notfallteam.', folge: 'Das Notfallteam übernimmt und gibt weitere Medikamente nach ärztlicher Anordnung.', vital: { sauerstoff: 'ja', spo2: '92', af: '32' } },
        { text: 'Ich bin beruhigt, das Pfeifen ist ja leiser geworden.', wertung: 'gefaehrlich', schritt: 'evaluation', rueck: 'Leiseres Pfeifen bei zunehmender Atemnot heißt: Es kommt kaum noch Luft durch. Das ist lebensbedrohlich.', folge: 'Die Mutter drückt den Notruf. Das Notfallteam kommt und übernimmt.', vital: { spo2: '85' } },
        { text: 'Ich hole die Mutter wieder herein, damit sie ihn beruhigt.', wertung: 'teilweise', schritt: 'durchfuehrung', rueck: 'Die Mutter hilft beim Beruhigen, aber jetzt braucht Ben zuerst das Notfallteam und Sauerstoff.', folge: 'Die Mutter hält seine Hand, eine Kollegin ruft das Notfallteam.', vital: { spo2: '89' } },
      ],
    },
    a3: {
      uhrzeit: '14:45', zustand: 'verbessert',
      situation: 'Nach der Behandlung spricht Ben wieder in ganzen Sätzen. Die Sättigung ist gestiegen, die Einziehungen sind weniger geworden. Die Mutter fragt, wie das passieren konnte.',
      optionen: [
        { text: 'Ich kontrolliere Sättigung, Atemfrequenz und Sprechen nach 15 bis 20 Minuten erneut, dokumentiere und übe mit Ben und der Mutter die Spacer-Technik.', wertung: 'gut', schritt: 'evaluation', rueck: 'Vollständig: Wirkung kontrollieren, dokumentieren und Kind und Familie schulen, damit sie den nächsten Anfall früh erkennen und richtig behandeln.', folge: 'Nach 20 Minuten bleibt Ben stabil. Er zeigt stolz, wie er durch den Spacer atmet.', vital: { spo2: '95', af: '24', puls: '112' } },
        { text: 'Ich nehme den Monitor ab, es geht ihm ja wieder gut.', wertung: 'unguenstig', schritt: 'evaluation', rueck: 'Nach einem schweren Anfall kann die Atemnot wiederkommen. Weiter überwachen, bis die Ärztin etwas anderes festlegt.', folge: 'Eine Stunde später ruft die Mutter, Ben huste wieder stärker.' },
        { text: 'Ich dokumentiere und überlasse die Erklärung der Mutter.', wertung: 'teilweise', schritt: 'evaluation', rueck: 'Dokumentation ja, aber Schulung zu Spacer und Notfallplan ist eine pflegerische Aufgabe gemeinsam mit der Ärztin.', folge: 'Die Mutter ist unsicher, wann sie das Spray geben soll.' },
      ],
    },
  },
  schluss: {
    uhrzeit: '15:15',
    gut: 'Ben atmet ruhig und malt schon wieder. Seine Mutter weiß jetzt, woran sie einen Anfall früh erkennt und wie der Spacer richtig benutzt wird.',
    schlecht: 'Ben ist erschöpft und braucht weiter Sauerstoff. Die Ärztin plant eine engmaschige Überwachung über Nacht.',
    gutVital: { spo2: '96', af: '22', puls: '106' }, schlechtVital: { spo2: '92', af: '30', puls: '124' },
  },
  wen: 'Ben',
  musterloesung: 'Aufrecht sitzen lassen, Bezugsperson einbeziehen, Sättigung, Atem- und Herzfrequenz messen, Sprechfähigkeit und Einziehungen beobachten. Bedarfsspray nach Notfallplan über Spacer, Ärztin informieren. Bei Sättigungsabfall, Sprechunfähigkeit oder „stiller Lunge“ sofort Notfallteam und Sauerstoff nach Standard. Danach Wirkung kontrollieren, dokumentieren und Kind und Eltern schulen.',
};

// ---------- Engine ----------

export const PROBEFAELLE: Probefall[] = [HERZ, HYPO, BLUTUNG, ASTHMA, ...PROBEFAELLE_2];
export const DEMO_SZENARIO = HERZ.szenario;
const NACH_ID = new Map(PROBEFAELLE.map((p) => [p.szenario.id, p]));
export const probefallVon = (f: Pick<Fall, 'szenario'>) => NACH_ID.get(f.szenario.id) ?? null;
export const istDemo = (f: Pick<Fall, 'szenario'>) => NACH_ID.has(f.szenario.id);

/** Nächste Etappe nach einer Etappe/Option: Abzweig, Rücksprung oder Hauptlinie. */
function naechsteId(p: Probefall, id: string, opt: Option): string | null {
  if (opt.weiter) return opt.weiter;
  const e = p.etappen[id]!;
  if (e.weiter) return e.weiter;
  const i = p.reihe.indexOf(id);
  return i >= 0 ? p.reihe[i + 1] ?? null : null;
}

/** Bisheriger Weg: Etappen und gewählte Optionen in der Reihenfolge der Runden. */
export function probeWeg(p: Probefall, eingaben: Array<string | undefined>): Array<{ id: string; option?: Option }> {
  const weg: Array<{ id: string; option?: Option }> = [];
  let id: string | null = p.reihe[0]!;
  for (const e of eingaben) {
    if (!id) break;
    const opt: Option | undefined = p.etappen[id]!.optionen.find((o) => o.text === e);
    if (!opt) break;
    weg.push({ id, option: opt });
    id = naechsteId(p, id, opt);
  }
  if (id) weg.push({ id });
  return weg;
}

/** Nächster Zug im Probefall. Freitext gibt es hier nicht, nur die Vorschläge. */
export function demoZug(fall: Fall, eingabe?: string): Zug {
  const p = probefallVon(fall) ?? HERZ;
  const vorher = fall.runden.at(-1)?.zug;
  if (!vorher) {
    const e = p.etappen[p.reihe[0]!]!;
    return zug(e.uhrzeit, e.situation, { ...LEER, ...e.vital }, e.zustand, 'informationssammlung', 'keine', '', e.optionen.map((o) => o.text), false);
  }
  const weg = probeWeg(p, fall.runden.slice(1).map((r) => r.eingabe));
  const aktuell = weg.at(-1);
  const etappe = aktuell && !aktuell.option ? p.etappen[aktuell.id] : undefined;
  const opt = etappe?.optionen.find((o) => o.text === eingabe);
  if (!aktuell || !etappe || !opt) {
    return { ...vorher, rueckmeldung: { wertung: 'keine', text: 'Im Probefall zählen nur die Vorschläge.' } };
  }
  const vital = { ...vorher.vitalwerte, ...opt.vital };
  const nId = naechsteId(p, aktuell.id, opt);
  const naechste = nId ? p.etappen[nId] : undefined;
  if (naechste) {
    return zug(naechste.uhrzeit, `${opt.folge} ${naechste.situation}`, { ...vital, ...naechste.vital }, opt.zustand ?? naechste.zustand,
      opt.schritt, opt.wertung, opt.rueck, naechste.optionen.map((o) => o.text), false);
  }
  const wertungen = [...weg.flatMap((w) => (w.option ? [w.option.wertung] : [])), opt.wertung];
  const gutGelaufen = wertungen.filter((w) => w === 'gut').length >= Math.ceil(wertungen.length * 0.66) && !wertungen.includes('gefaehrlich');
  const ende = { ...vital, ...(gutGelaufen ? p.schluss.gutVital : p.schluss.schlechtVital) };
  return zug(p.schluss.uhrzeit, `${opt.folge} ${gutGelaufen ? p.schluss.gut : p.schluss.schlecht}`, ende, gutGelaufen ? 'verbessert' : 'verschlechtert',
    opt.schritt, opt.wertung, opt.rueck, [], true);
}

function zug(uhrzeit: string, situation: string, vitalwerte: Vitalwerte, zustand: Zustand, schritt: Schritt, wertung: Wertung, text: string, optionen: string[], beendet: boolean): Zug {
  return { uhrzeit, situation, vitalwerte, zustand, schritt, rueckmeldung: { wertung, text }, optionen, beendet };
}

const PUNKTE: Record<Wertung, number> = { gut: 3, teilweise: 2, unguenstig: 1, gefaehrlich: 0, keine: 0 };

/** Auswertung des Probefalls aus den gewählten Optionen, ohne KI. */
export function demoAbschluss(fall: Fall): Abschluss {
  const p = probefallVon(fall) ?? HERZ;
  const gewaehlt = probeWeg(p, fall.runden.slice(1).map((r) => r.eingabe)).flatMap((w) => (w.option ? [w.option] : []));
  const summe = gewaehlt.reduce((s, o) => s + PUNKTE[o.wertung], 0), max = Math.max(1, gewaehlt.length * 3);
  const anteil = summe / max;
  const gefaehrlich = gewaehlt.some((o) => o.wertung === 'gefaehrlich');
  const abzweig = gewaehlt.some((o) => o.weiter);
  const note: Note = gefaehrlich ? (anteil >= 0.6 ? 'teilweise' : 'unsicher') : anteil >= 0.95 ? 'sicher' : anteil >= 0.75 ? 'ueberwiegend_sicher' : anteil >= 0.5 ? 'teilweise' : 'unsicher';
  const schritte = (['informationssammlung', 'probleme', 'ziele', 'massnahmen', 'durchfuehrung', 'evaluation'] as Schritt[]).map((schritt) => {
    const os = gewaehlt.filter((o) => o.schritt === schritt);
    if (!os.length) return { schritt, bewertung: 'nicht_bearbeitet' as const, kommentar: 'Kam in diesem kurzen Probefall nicht gezielt vor.' };
    const best = Math.min(...os.map((o) => PUNKTE[o.wertung]));
    return { schritt, bewertung: best === 3 ? 'stark' as const : best === 2 ? 'ok' as const : 'luecke' as const, kommentar: os.map((o) => o.rueck).join(' ') };
  });
  return {
    note,
    gesamt: `Du hast ${gewaehlt.filter((o) => o.wertung === 'gut').length} von ${gewaehlt.length} Entscheidungen optimal getroffen.`
      + (gefaehrlich ? ` Mindestens eine Entscheidung hätte ${p.wen} gefährdet.` : '')
      + (abzweig ? ' Eine Entscheidung hat den Verlauf verändert: Der Fall nahm eine schwierigere Wendung.' : '')
      + ' Im echten Simulator reagiert Claude frei auf alles, was du schreibst.',
    schritte,
    staerken: gewaehlt.filter((o) => o.wertung === 'gut').map((o) => o.rueck),
    verbesserungen: gewaehlt.filter((o) => o.wertung !== 'gut').map((o) => o.rueck),
    musterloesung: p.musterloesung,
    themen: p.szenario.topicIds,
  };
}
