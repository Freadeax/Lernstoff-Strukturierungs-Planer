// Probefall ohne KI: ein fest geschriebener, verzweigter Kurzfall, damit der Simulator samt
// Animation auch ohne API-Schlüssel und offline läuft. Er zählt nicht für den Lernplan.
// Inhalte sind erfunden und didaktisch vereinfacht.

import type { Szenario } from './faelle';
import type { Abschluss, Fall, Note, Schritt, Vitalwerte, Wertung, Zug, Zustand } from './simulator';

export const DEMO_SZENARIO: Szenario = {
  id: 'demo-atemnot',
  titel: 'Probefall: Atemnot in der Nacht',
  setting: 'krankenhaus',
  kurz: 'Herr K., 78 Jahre, internistische Station, bekannte Herzinsuffizienz. Er klingelt um 2 Uhr nachts. Fest geschriebener Kurzfall ohne KI.',
  verborgen: '',
  topicIds: ['thema.kl.herz.insuffizienz', 'thema.beo.notfall', 'thema.pp.anamnese'],
};

export const istDemo = (f: Pick<Fall, 'szenario'>) => f.szenario.id === DEMO_SZENARIO.id;

interface Option {
  text: string;
  wertung: Exclude<Wertung, 'keine'>;
  schritt: Schritt;
  rueck: string;
  /** Was unmittelbar passiert, steht vor der nächsten Situation */
  folge: string;
  vital?: Partial<Vitalwerte>;
  zustand?: Zustand;
}
interface Etappe { uhrzeit: string; situation: string; zustand: Zustand; vital?: Partial<Vitalwerte>; optionen: Option[] }

const LEER: Vitalwerte = { rr: '', puls: '', af: '', spo2: '', sauerstoff: '', temp: '', bz: '', schmerz: '', bewusstsein: '' };
const KRANK: Partial<Vitalwerte> = { rr: '165/95', puls: '112', af: '26', spo2: '89', sauerstoff: 'nein', temp: '36,9', bewusstsein: 'A' };

const ETAPPEN: Etappe[] = [
  {
    uhrzeit: '02:05', zustand: 'verschlechtert',
    situation: 'Herr K. sitzt auf der Bettkante und ringt nach Luft. „Ich krieg so schlecht Luft, Schwester … im Liegen geht gar nichts.“ Er wirkt ängstlich, die Stirn ist feucht.',
    optionen: [
      { text: 'Ich beruhige ihn und sage, er soll versuchen weiterzuschlafen.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Akute Atemnot ist ein Warnzeichen. Ohne Einschätzung der Vitalzeichen bleibt eine Verschlechterung unerkannt.', folge: 'Du gehst zurück zum Stützpunkt. Zehn Minuten später klingelt Herr K. erneut, jetzt deutlich schneller atmend.', vital: KRANK },
      { text: 'Ich messe Blutdruck, Puls, Atemfrequenz, Sättigung und Temperatur und prüfe das Bewusstsein.', wertung: 'gut', schritt: 'informationssammlung', rueck: 'Genau richtig: Erst vollständige Vitalzeichen, dann NEWS2 bilden. So wird aus „er hat Atemnot“ eine belastbare Einschätzung.', folge: 'Du legst Manschette und Pulsoxymeter an und zählst die Atemzüge.', vital: KRANK },
      { text: 'Ich lege ihn flach hin, damit er zur Ruhe kommt.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Bei kardialer Atemnot verstärkt Flachlagerung den Rückstrom zum Herzen und damit die Lungenstauung.', folge: 'Kaum liegt er flach, hustet er und richtet sich panisch wieder auf.', vital: { ...KRANK, spo2: '87', af: '28' } },
    ],
  },
  {
    uhrzeit: '02:12', zustand: 'verschlechtert',
    situation: 'Die Werte stehen auf dem Monitor: Die Sättigung ist niedrig, Puls und Atemfrequenz sind hoch. Du hörst ein feuchtes Rasseln beim Atmen, beide Unterschenkel sind geschwollen.',
    optionen: [
      { text: 'Ich gebe ihm ein großes Glas Wasser gegen den trockenen Mund.', wertung: 'unguenstig', schritt: 'massnahmen', rueck: 'Bei Herzinsuffizienz ist die Trinkmenge oft begrenzt. Erst Lage klären, Mundpflege statt großer Trinkmengen.', folge: 'Er trinkt hastig und verschluckt sich fast.' },
      { text: 'Ich lagere den Oberkörper hoch, die Beine tief (Herzbettlage), und bleibe bei ihm.', wertung: 'gut', schritt: 'massnahmen', rueck: 'Die Herzbettlage entlastet Herz und Lunge sofort. Dabeibleiben nimmt Angst und damit Atemarbeit.', folge: 'Du stellst das Kopfteil hoch und senkst das Fußteil. Herr K. atmet etwas ruhiger.', vital: { spo2: '91', af: '24' } },
      { text: 'Ich hole zuerst die Kollegin aus dem Nachbarzimmer und frage, was sie meint.', wertung: 'teilweise', schritt: 'informationssammlung', rueck: 'Hilfe holen ist gut, aber die Lagerung kostet keine Sekunde und sollte vorher passieren.', folge: 'Die Kollegin kommt kurz herein: „Setz ihn hoch und ruf die Ärztin!“' },
    ],
  },
  {
    uhrzeit: '02:16', zustand: 'verschlechtert',
    situation: 'Der Monitor alarmiert, der NEWS2 liegt bei 7 Punkten. Herr K. fragt mit gepresster Stimme: „Muss ich jetzt sterben?“',
    optionen: [
      { text: 'Ich warte bis zur Frühschicht und dokumentiere die Werte.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Ein NEWS2 von 7 verlangt eine sofortige ärztliche Beurteilung. Warten gefährdet den Patienten.', folge: 'Die Sättigung fällt weiter. Erst um 02:40 rufst du doch an.', vital: { spo2: '86', af: '30', puls: '124' }, zustand: 'kritisch' },
      { text: 'Ich gebe ihm aus eigenem Ermessen hoch dosiert Sauerstoff.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Sauerstoff braucht eine Anordnung oder einen Hausstandard. Wichtiger ist jetzt der Anruf bei der Ärztin.', folge: 'Du schließt die Sauerstoffbrille an, aber niemand weiß von der Lage.', vital: { spo2: '92', sauerstoff: 'ja' } },
      { text: 'Ich rufe die diensthabende Ärztin an und übergebe nach SBAR.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Strukturierte Übergabe nach SBAR mit NEWS2 sorgt dafür, dass die Ärztin die Dringlichkeit sofort erkennt.', folge: 'Am Telefon schilderst du Situation, Hintergrund, Einschätzung und Empfehlung. Die Ärztin kommt sofort.' },
    ],
  },
  {
    uhrzeit: '02:24', zustand: 'verschlechtert',
    situation: 'Die Ärztin kommt herein, hört ab und ordnet Sauerstoff über Nasenbrille, ein Diuretikum und eine Flüssigkeitsbilanz an. Da klingelt das Telefon: Die Tochter ruft an und fragt, wie es ihrem Vater geht.',
    optionen: [
      { text: 'Ich verabreiche die Medikamente und gehe dann zu den anderen Patienten, ohne nachzukontrollieren.', wertung: 'teilweise', schritt: 'evaluation', rueck: 'Die Umsetzung stimmt, doch ohne Kontrolle der Wirkung bleibt offen, ob es ihm besser geht.', folge: 'Die Anordnungen laufen. Herr K. bleibt allein.', vital: { sauerstoff: 'ja', spo2: '93' } },
      { text: 'Ich erkläre der Tochter am Telefon ausführlich die Diagnose.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Diagnosen erklärt die Ärztin. Am Telefon ist die Identität unklar, Schweigepflicht beachten und einen Rückruf anbieten.', folge: 'Während du telefonierst, wartet die Ärztin auf dich.', vital: { sauerstoff: 'ja' } },
      { text: 'Ich setze die Anordnungen um, starte die Bilanz und kontrolliere die Werte in 15 Minuten. Der Tochter biete ich einen Rückruf der Ärztin an.', wertung: 'gut', schritt: 'evaluation', rueck: 'Umsetzen, Wirkung kontrollieren und Angehörige angemessen einbinden: Das ist der vollständige Pflegeprozess.', folge: 'Die Sauerstoffbrille sitzt, die Bilanz läuft, die Tochter ist beruhigt.', vital: { sauerstoff: 'ja', spo2: '94' } },
    ],
  },
];

const SCHLUSS = {
  uhrzeit: '02:45',
  gut: 'Herr K. atmet ruhiger, die Lippen sind wieder rosig. „Danke, dass Sie da waren.“ Die Ärztin bittet dich um eine kurze Übergabe an die Frühschicht.',
  schlecht: 'Herr K. ist erschöpft, die Atmung bleibt angestrengt. Die Ärztin übernimmt und lässt ihn engmaschig überwachen.',
};

/** Nächster Zug im Probefall. Freitext gibt es hier nicht, nur die Vorschläge. */
export function demoZug(fall: Fall, eingabe?: string): Zug {
  const i = fall.runden.length;
  const vorher = fall.runden.at(-1)?.zug;
  const basisVital = vorher?.vitalwerte ?? LEER;
  if (i === 0 || !vorher) {
    const e = ETAPPEN[0]!;
    return zug(e.uhrzeit, e.situation, { ...LEER, ...e.vital }, e.zustand, 'informationssammlung', 'keine', '', e.optionen.map((o) => o.text), false);
  }
  const etappe = ETAPPEN[i - 1];
  const opt = etappe?.optionen.find((o) => o.text === eingabe);
  if (!etappe || !opt) {
    return { ...vorher, rueckmeldung: { wertung: 'keine', text: 'Im Probefall zählen nur die Vorschläge.' } };
  }
  const naechste = ETAPPEN[i];
  const vital = { ...basisVital, ...opt.vital };
  if (naechste) {
    return zug(naechste.uhrzeit, `${opt.folge} ${naechste.situation}`, { ...vital, ...naechste.vital }, opt.zustand ?? naechste.zustand,
      opt.schritt, opt.wertung, opt.rueck, naechste.optionen.map((o) => o.text), false);
  }
  const gute = [...fall.runden.map((r) => r.zug.rueckmeldung.wertung), opt.wertung].filter((w) => w === 'gut').length;
  const gutGelaufen = gute >= 3;
  const ende = gutGelaufen ? { ...vital, spo2: '95', af: '19', puls: '92', rr: '140/85' } : { ...vital, spo2: '91', af: '24', puls: '108' };
  return zug(SCHLUSS.uhrzeit, `${opt.folge} ${gutGelaufen ? SCHLUSS.gut : SCHLUSS.schlecht}`, ende, gutGelaufen ? 'verbessert' : 'verschlechtert',
    opt.schritt, opt.wertung, opt.rueck, [], true);
}

function zug(uhrzeit: string, situation: string, vitalwerte: Vitalwerte, zustand: Zustand, schritt: Schritt, wertung: Wertung, text: string, optionen: string[], beendet: boolean): Zug {
  return { uhrzeit, situation, vitalwerte, zustand, schritt, rueckmeldung: { wertung, text }, optionen, beendet };
}

const PUNKTE: Record<Wertung, number> = { gut: 3, teilweise: 2, unguenstig: 1, gefaehrlich: 0, keine: 0 };

/** Auswertung des Probefalls aus den gewählten Optionen, ohne KI. */
export function demoAbschluss(fall: Fall): Abschluss {
  const gewaehlt = fall.runden.slice(1).map((r, i) => ETAPPEN[i]?.optionen.find((o) => o.text === r.eingabe)).filter((o): o is Option => !!o);
  const summe = gewaehlt.reduce((s, o) => s + PUNKTE[o.wertung], 0), max = ETAPPEN.length * 3;
  const anteil = summe / max;
  const gefaehrlich = gewaehlt.some((o) => o.wertung === 'gefaehrlich');
  const note: Note = gefaehrlich ? (anteil >= 0.6 ? 'teilweise' : 'unsicher') : anteil >= 0.95 ? 'sicher' : anteil >= 0.75 ? 'ueberwiegend_sicher' : anteil >= 0.5 ? 'teilweise' : 'unsicher';
  const schritte = (['informationssammlung', 'probleme', 'ziele', 'massnahmen', 'durchfuehrung', 'evaluation'] as Schritt[]).map((schritt) => {
    const os = gewaehlt.filter((o) => o.schritt === schritt);
    if (!os.length) return { schritt, bewertung: 'nicht_bearbeitet' as const, kommentar: 'Kam in diesem kurzen Probefall nicht gezielt vor.' };
    const best = Math.min(...os.map((o) => PUNKTE[o.wertung]));
    return { schritt, bewertung: best === 3 ? 'stark' as const : best === 2 ? 'ok' as const : 'luecke' as const, kommentar: os.map((o) => o.rueck).join(' ') };
  });
  return {
    note,
    gesamt: `Du hast ${gewaehlt.filter((o) => o.wertung === 'gut').length} von ${ETAPPEN.length} Entscheidungen optimal getroffen.${gefaehrlich ? ' Mindestens eine Entscheidung hätte Herrn K. gefährdet.' : ''} Im echten Simulator reagiert Claude frei auf alles, was du schreibst.`,
    schritte,
    staerken: gewaehlt.filter((o) => o.wertung === 'gut').map((o) => o.rueck),
    verbesserungen: gewaehlt.filter((o) => o.wertung !== 'gut').map((o) => o.rueck),
    musterloesung: 'Vitalzeichen vollständig erheben und NEWS2 bilden, Herzbettlage herstellen und beim Patienten bleiben, bei NEWS2 ab 7 sofort die Ärztin nach SBAR informieren, Anordnungen umsetzen, Wirkung nach 15 Minuten kontrollieren, Bilanz führen und Angehörige an die Ärztin verweisen.',
    themen: DEMO_SZENARIO.topicIds,
  };
}
