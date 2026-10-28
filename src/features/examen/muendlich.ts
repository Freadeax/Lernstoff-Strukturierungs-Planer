// Mündliche Prüfung üben. Nach § 15 PflAPrV (Katalog: pruefung.staatlich.muendlich) geht es um eine
// komplexe Fallsituation mit Schwerpunkt auf den Kompetenzbereichen III, IV und V: Berufsrolle,
// Zusammenarbeit, rechtliche und ethische Begründung, wissenschaftliches Begründen. Die Fälle und
// Impulse hier sind erfundene Übungen, keine Originalaufgaben. Die Stichpunkte zum Selbstcheck
// beschreiben, was eine gute Antwort enthält (Aufbau, Fallbezug), und behaupten keine Fachinhalte.

import type { ID } from '../../core/types';
import { FAELLE } from '../krankheitsbilder/faelle';

export type Altersgruppe = 'kind' | 'jugend' | 'erwachsen' | 'alt';
export type Versorgung = 'akut' | 'langzeit' | 'ambulant' | 'paediatrie' | 'psychiatrie';

export const ALTER_LABEL: Record<Altersgruppe, string> = { kind: 'Kind', jugend: 'Jugendliche', erwachsen: 'Erwachsene', alt: 'Alte Menschen' };
export const VERSORGUNG_LABEL: Record<Versorgung, string> = {
  akut: 'Stationäre Akutpflege', langzeit: 'Stationäre Langzeitpflege', ambulant: 'Ambulante Pflege', paediatrie: 'Pädiatrische Versorgung', psychiatrie: 'Psychiatrische Versorgung',
};

export interface Impuls {
  id: string;
  kb: 'kb.III' | 'kb.IV' | 'kb.V';
  operator: string;          // wie im Katalog, bestimmt den Anforderungsbereich
  frage: string;
  /** Woran du selbst erkennst, dass die Antwort trägt. */
  stichpunkte: string[];
}

export interface MuendlicherFall {
  id: string;
  titel: string;
  alter: Altersgruppe;
  versorgung: Versorgung;
  text: string[];
  /** Fachliche Anknüpfung für den Lernplan und Links (Themen-IDs aus dem Katalog). */
  topicIds: ID[];
  impulse: Impuls[];
  /** Herkunft: eigener Prüfungsfall oder aus den Krankheitsbild-Fällen abgeleitet. */
  herkunft: 'muendlich' | 'krankheitsbild';
}

// Allgemeine Stichpunkte, die in jeder mündlichen Antwort helfen.
const FALLBEZUG = 'Bezieht sich ausdrücklich auf die Person und Situation im Fall';
const BEGRUENDET = 'Nennt eine Begründung (Warum?), nicht nur eine Aufzählung';

/** Impulse, die zu jeder Fallsituation passen. `{name}` wird durch die Person im Fall ersetzt. */
export const ALLGEMEINE_IMPULSE: Impuls[] = [
  { id: 'vorstellung', kb: 'kb.III', operator: 'darstellen', frage: 'Stellen Sie die Situation von {name} in zwei bis drei Minuten strukturiert vor.', stichpunkte: ['Person, Setting und Anlass kurz benannt', 'Wichtigste Pflegeprobleme und Ressourcen genannt', 'Klare Reihenfolge, z. B. Situation – Hintergrund – Einschätzung', 'Zeitrahmen eingehalten'] },
  { id: 'team', kb: 'kb.III', operator: 'erläutern', frage: 'Erläutern Sie, welche Berufsgruppen an der Versorgung von {name} beteiligt sind und wie Sie die Zusammenarbeit gestalten.', stichpunkte: ['Mindestens drei Berufsgruppen konkret benannt', 'Eigene Aufgabe als Pflegefachperson abgegrenzt', 'Weg der Informationsweitergabe beschrieben (Übergabe, Dokumentation, Fallbesprechung)', FALLBEZUG] },
  { id: 'recht', kb: 'kb.IV', operator: 'beurteilen', frage: 'Beurteilen Sie die Situation aus rechtlicher Sicht: Welche Rechte hat {name}, und welche Pflichten haben Sie?', stichpunkte: ['Selbstbestimmung bzw. Einwilligung angesprochen', 'Eigene Pflichten benannt (z. B. Dokumentation, Schweigepflicht, Sorgfalt)', 'Rechtsgrundlage zumindest allgemein benannt, ohne Paragrafen zu erfinden', 'Eigenes Urteil am Ende formuliert'] },
  { id: 'ethik', kb: 'kb.IV', operator: 'reflektieren', frage: 'Reflektieren Sie einen ethischen Konflikt, der in der Versorgung von {name} entstehen kann.', stichpunkte: ['Konflikt als Spannung zwischen zwei Werten benannt (z. B. Autonomie und Fürsorge)', 'Perspektiven der Beteiligten gegenübergestellt', 'Ein Vorgehen zur Entscheidungsfindung beschrieben (z. B. ethische Fallbesprechung)', 'Eigene Haltung begründet'] },
  { id: 'evidenz', kb: 'kb.V', operator: 'begründen', frage: 'Begründen Sie eine zentrale Pflegemaßnahme für {name} mit pflegewissenschaftlichem Wissen.', stichpunkte: ['Konkrete Maßnahme benannt', 'Quelle der Begründung benannt (z. B. Expertenstandard, Leitlinie, Studie)', 'Grenzen der Übertragbarkeit auf diese Person angesprochen', BEGRUENDET] },
  { id: 'rolle', kb: 'kb.V', operator: 'reflektieren', frage: 'Reflektieren Sie Ihre eigene Rolle als Pflegefachperson in dieser Situation: Was würden Sie beim nächsten Mal anders machen?', stichpunkte: ['Eigenes Handeln konkret beschrieben, nicht allgemein', 'Stärke und Entwicklungsfeld benannt', 'Konsequenz für künftiges Handeln abgeleitet', 'Berufliches Selbstverständnis angesprochen'] },
];

const i = (id: string, kb: Impuls['kb'], operator: string, frage: string, stichpunkte: string[]): Impuls => ({ id, kb, operator, frage, stichpunkte });

/** Eigene Prüfungsfälle für verschiedene Altersstufen und Versorgungsbereiche. Personen und Daten sind erfunden. */
export const MUENDLICHE_FAELLE: MuendlicherFall[] = [
  {
    id: 'm-lina', titel: 'Lina, 6 Jahre', alter: 'kind', versorgung: 'paediatrie', herkunft: 'muendlich', topicIds: [],
    text: [
      'Lina liegt seit zwei Tagen auf der Kinderstation, weil sie wegen eines Infekts kaum trinkt. Sie bekommt eine Infusion über einen Zugang am Handrücken.',
      'Die Mutter übernachtet im Zimmer, wirkt erschöpft und sagt, sie müsse morgen wieder arbeiten. Der Vater ist im Ausland. Lina weint, sobald jemand im weißen Kittel ins Zimmer kommt.',
      'Im Team gibt es Unstimmigkeit, ob Lina zum Schutz des Zugangs nachts eine Armschiene bekommen soll.',
    ],
    impulse: [
      i('m-lina-familie', 'kb.III', 'erläutern', 'Erläutern Sie, wie Sie die Mutter in die Versorgung einbeziehen, ohne sie zu überfordern.', ['Familie als Teil der Pflege verstanden', 'Konkrete Entlastungsangebote genannt', 'Absprache im Team und mit der Mutter beschrieben', FALLBEZUG]),
      i('m-lina-fixierung', 'kb.IV', 'beurteilen', 'Beurteilen Sie die geplante Armschiene: Wo endet Schutz und wo beginnt eine freiheitsentziehende Maßnahme?', ['Zweck der Maßnahme und Belastung für Lina gegenübergestellt', 'Rolle der Sorgeberechtigten angesprochen', 'Mildere Alternativen genannt', 'Eigenes, begründetes Urteil']),
    ],
  },
  {
    id: 'm-jonas', titel: 'Jonas, 16 Jahre', alter: 'jugend', versorgung: 'psychiatrie', herkunft: 'muendlich', topicIds: [],
    text: [
      'Jonas ist seit einer Woche auf einer jugendpsychiatrischen Station. Er isst sehr wenig, treibt heimlich Sport im Zimmer und wiegt deutlich zu wenig für seine Größe.',
      'Er bittet dich, den Eltern nichts von seinem nächtlichen Training zu erzählen: „Nur dir kann ich das sagen.“',
      'In der Übergabe sagt ein Kollege: „Der will doch nur Aufmerksamkeit.“',
    ],
    impulse: [
      i('m-jonas-vertrauen', 'kb.IV', 'reflektieren', 'Reflektieren Sie Jonas’ Bitte um Verschwiegenheit: Wie gehen Sie mit Vertrauen und Informationspflicht um?', ['Spannung zwischen Vertrauen und Schutz benannt', 'Weitergabe an das Team begründet, nicht verheimlicht', 'Wie Jonas das erklärt wird, beschrieben', 'Professionelle Nähe und Distanz angesprochen']),
      i('m-jonas-team', 'kb.III', 'beurteilen', 'Beurteilen Sie die Aussage Ihres Kollegen und beschreiben Sie, wie Sie darauf reagieren.', ['Aussage als Stigmatisierung erkannt', 'Reaktion im Team konkret und respektvoll formuliert', 'Fachlicher Blick auf das Verhalten statt Bewertung', 'Teamkultur und Fallbesprechung angesprochen']),
    ],
  },
  {
    id: 'm-aydin', titel: 'Herr Aydın, 45 Jahre', alter: 'erwachsen', versorgung: 'ambulant', herkunft: 'muendlich', topicIds: [],
    text: [
      'Herr Aydın ist seit einem Arbeitsunfall querschnittgelähmt und lebt mit Frau und zwei Kindern in einer Wohnung im dritten Stock. Der ambulante Pflegedienst kommt zweimal täglich.',
      'Er möchte so bald wie möglich wieder arbeiten. Seine Frau übernimmt viel Pflege und hat Rückenschmerzen. Herr Aydın lehnt die angebotene Katheterschulung ab: „Das soll der Pflegedienst machen.“',
    ],
    impulse: [
      i('m-aydin-beratung', 'kb.V', 'begründen', 'Begründen Sie, wie Sie die Beratung zur Selbstkatheterisierung gestalten würden.', ['Ziel der Beratung aus Sicht von Herrn Aydın formuliert', 'Beratungsansatz benannt (z. B. motivierende Gesprächsführung)', 'Eigene Rolle als Beratende reflektiert', BEGRUENDET]),
      i('m-aydin-netz', 'kb.III', 'erläutern', 'Erläutern Sie, welche Unterstützung über den Pflegedienst hinaus für die Familie infrage kommt.', ['Mehrere Stellen genannt (z. B. Sozialdienst, Kostenträger, Selbsthilfe)', 'Entlastung der Ehefrau ausdrücklich bedacht', 'Fallbezug zur Wohnsituation', 'Eigene Aufgabe bei der Vermittlung beschrieben']),
    ],
  },
  {
    id: 'm-bauer', titel: 'Frau Bauer, 34 Jahre', alter: 'erwachsen', versorgung: 'akut', herkunft: 'muendlich', topicIds: [],
    text: [
      'Frau Bauer liegt nach einer Notoperation auf der Intensivstation und wird beatmet. Ihr Mann fragt dich im Flur nach der Prognose und sagt, seine Frau hätte „so etwas nie gewollt“.',
      'Es gibt keine Patientenverfügung. Der Arzt ist gerade in einer Besprechung, der Mann wirkt sehr aufgewühlt.',
    ],
    impulse: [
      i('m-bauer-wille', 'kb.IV', 'erläutern', 'Erläutern Sie, wie der mutmaßliche Wille von Frau Bauer ermittelt werden kann und welche Rolle Sie dabei haben.', ['Unterschied zwischen Wunsch der Angehörigen und Wille der Patientin benannt', 'Beteiligte am Entscheidungsprozess genannt', 'Eigene Rolle realistisch abgegrenzt (keine Prognose durch die Pflege)', 'Dokumentation angesprochen']),
      i('m-bauer-gespraech', 'kb.III', 'begründen', 'Begründen Sie, wie Sie jetzt im Flur mit Herrn Bauer sprechen.', ['Anteilnahme und Struktur im Gespräch verbunden', 'Keine Auskunft über die eigene Zuständigkeit hinaus', 'Konkreter nächster Schritt (z. B. Gespräch mit dem Arzt vereinbaren)', BEGRUENDET]),
    ],
  },
  {
    id: 'm-petersen', titel: 'Herr Petersen, 84 Jahre', alter: 'alt', versorgung: 'langzeit', herkunft: 'muendlich', topicIds: [],
    text: [
      'Herr Petersen lebt seit drei Monaten im Pflegeheim. Er ist geistig klar, isst seit einigen Wochen immer weniger und sagt: „Ich habe genug gelebt.“',
      'Seine Tochter verlangt, dass er notfalls über eine Magensonde ernährt wird. Auf dem Wohnbereich fehlen diese Woche zwei Pflegefachpersonen, die Mahlzeiten werden oft von Hilfskräften gereicht.',
    ],
    impulse: [
      i('m-petersen-ethik', 'kb.IV', 'beurteilen', 'Beurteilen Sie den Konflikt zwischen dem Wunsch von Herrn Petersen und der Forderung seiner Tochter.', ['Selbstbestimmung des einwilligungsfähigen Bewohners zentral gestellt', 'Sorge der Tochter ernst genommen', 'Weg zur gemeinsamen Klärung beschrieben', 'Eigenes Urteil begründet']),
      i('m-petersen-rahmen', 'kb.III', 'analysieren', 'Analysieren Sie, wie die Personalsituation die Versorgung von Herrn Petersen beeinflusst und was Sie tun können.', ['Einfluss der Rahmenbedingungen auf die Pflegequalität benannt', 'Delegation an Hilfskräfte und eigene Verantwortung unterschieden', 'Konkreter Weg, den Mangel anzusprechen (z. B. Leitung, Überlastungsanzeige)', FALLBEZUG]),
    ],
  },
];

const NAME = /^((?:Frau|Herr)\s+\S+?|[A-ZÄÖÜ][a-zäöüß]+),/;

/** Name zum Einsetzen in Impulse: „Frau Sommer“ aus „Frau Sommer, 79 Jahre“. */
export function nameAusTitel(titel: string): string {
  return NAME.exec(titel)?.[1] ?? 'die Person';
}

function alterAusTitel(titel: string): Altersgruppe {
  const jahre = Number(/(\d+)\s*Jahre/.exec(titel)?.[1] ?? NaN);
  if (!Number.isFinite(jahre)) return 'erwachsen';
  return jahre < 12 ? 'kind' : jahre < 18 ? 'jugend' : jahre < 65 ? 'erwachsen' : 'alt';
}

function versorgungAusSetting(setting: string): Versorgung {
  const s = setting.toLocaleLowerCase('de');
  if (s.includes('ambulant') || s.includes('hausbesuch') || s.includes('betreutes') || s.includes('praxis')) return 'ambulant';
  if (s.includes('langzeit') || s.includes('kurzzeit')) return 'langzeit';
  if (s.includes('kinder') || s.includes('pädiatr')) return 'paediatrie';
  if (s.includes('psychiatr')) return 'psychiatrie';
  return 'akut';
}

/** Die Krankheitsbild-Fälle als zusätzliche Prüfungsfälle mit den allgemeinen Impulsen. */
export function faelleAusKrankheitsbildern(topicIdsVon: (krankheitId: string) => ID[] = () => []): MuendlicherFall[] {
  return FAELLE.map((f) => ({
    id: `kh:${f.id}`, titel: f.titel, alter: alterAusTitel(f.titel), versorgung: versorgungAusSetting(f.setting), herkunft: 'krankheitsbild',
    text: [`${f.setting}.`, ...f.text], topicIds: topicIdsVon(f.krankheitId), impulse: [],
  }));
}

/** Impulse einer Prüfung: eigene Impulse des Falls zuerst, dann allgemeine bis zur gewünschten Zahl, mit Name eingesetzt. */
export function impulseFuer(fall: MuendlicherFall, anzahl: number, zufall: () => number = Math.random): Impuls[] {
  const name = nameAusTitel(fall.titel);
  const allgemein = [...ALLGEMEINE_IMPULSE];
  const vorstellung = allgemein.shift()!;
  for (let j = allgemein.length - 1; j > 0; j--) { const k = Math.floor(zufall() * (j + 1)); [allgemein[j], allgemein[k]] = [allgemein[k]!, allgemein[j]!]; }
  const reihe = [vorstellung, ...fall.impulse, ...allgemein];
  // Jeder Kompetenzbereich III, IV und V soll vorkommen, wenn die Zahl reicht.
  const gewaehlt: Impuls[] = [];
  for (const imp of reihe) {
    if (gewaehlt.length >= anzahl) break;
    const fehlt = (['kb.III', 'kb.IV', 'kb.V'] as const).filter((kb) => !gewaehlt.some((g) => g.kb === kb));
    const rest = anzahl - gewaehlt.length;
    if (rest <= fehlt.length && !fehlt.includes(imp.kb as never)) continue;
    gewaehlt.push(imp);
  }
  for (const imp of reihe) { if (gewaehlt.length >= anzahl) break; if (!gewaehlt.includes(imp)) gewaehlt.push(imp); }
  return gewaehlt.map((imp) => ({ ...imp, frage: imp.frage.replaceAll('{name}', name) }));
}

/** Prüfungsfall wählen: möglichst anderer Versorgungsbereich und andere Altersstufe als im praktischen Teil (§ 15 PflAPrV). */
export function waehleFall(faelle: MuendlicherFall[], praktisch: { alter?: Altersgruppe; versorgung?: Versorgung }, zufall: () => number = Math.random, ohne: string[] = []): MuendlicherFall | undefined {
  const kandidaten = faelle.filter((f) => !ohne.includes(f.id));
  const pool = kandidaten.length ? kandidaten : faelle;
  const passend = pool.filter((f) => (!praktisch.alter || f.alter !== praktisch.alter) && (!praktisch.versorgung || f.versorgung !== praktisch.versorgung));
  const aus = passend.length ? passend : pool;
  return aus[Math.floor(zufall() * aus.length)];
}

// ---------- Selbstcheck ----------

export interface ImpulsCheck { erfuellt: number[]; sekunden: number }

export interface MuendlichErgebnis { prozent: number; erfuellt: number; moeglich: number; proBereich: Record<Impuls['kb'], { erfuellt: number; moeglich: number }>; sprechzeit: number }

/** Anteil erfüllter Stichpunkte, auch je Kompetenzbereich. Ist eine Selbsteinschätzung, kein Wissensnachweis. */
export function werteMuendlich(impulse: Impuls[], checks: Record<string, ImpulsCheck>): MuendlichErgebnis {
  const proBereich = { 'kb.III': { erfuellt: 0, moeglich: 0 }, 'kb.IV': { erfuellt: 0, moeglich: 0 }, 'kb.V': { erfuellt: 0, moeglich: 0 } };
  let erfuellt = 0, moeglich = 0, sprechzeit = 0;
  for (const imp of impulse) {
    const c = checks[imp.id];
    const n = new Set((c?.erfuellt ?? []).filter((x) => x >= 0 && x < imp.stichpunkte.length)).size;
    erfuellt += n; moeglich += imp.stichpunkte.length; sprechzeit += c?.sekunden ?? 0;
    proBereich[imp.kb].erfuellt += n; proBereich[imp.kb].moeglich += imp.stichpunkte.length;
  }
  return { prozent: moeglich ? Math.round((erfuellt / moeglich) * 100) : 0, erfuellt, moeglich, proBereich, sprechzeit };
}

/** mm:ss für Zeitanzeigen. */
export function mmss(sekunden: number): string {
  const s = Math.max(0, Math.round(sekunden));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
