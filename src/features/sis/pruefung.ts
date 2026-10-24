// Prüfung einer SIS per Code, ganz ohne KI. Läuft offline.
// Je Feld wird nach den Kernpunkten des Falls gesucht; steht ein Punkt in einem anderen Feld,
// zählt er halb. Die Risikomatrix wird mit der Lösung des Falls verglichen.
import { findeMuster, suchtext, vereinfache } from '../uebergabe/pruefung';
import {
  FELDER, MATRIX_FELDER, RISIKEN, THEMENFELDER,
  type Feld, type JaNein, type Kernpunkt, type Loesung, type MatrixZeile, type Risiko, type SisFall, type Themenfeld,
} from './faelle';

export type Felder = Record<Feld, string>;
export interface MatrixEingabe { vorhanden?: JaNein; weitere?: JaNein; themenfelder: Themenfeld[]; welches: string }
export type Matrix = Record<Risiko, MatrixEingabe>;

export const leereFelder = (): Felder => ({ B: '', TF1: '', TF2: '', TF3: '', TF4: '', TF5: '', TF6: '' });
export const leereMatrix = (): Matrix =>
  Object.fromEntries(RISIKEN.map((r) => [r, { themenfelder: [], welches: '' }])) as unknown as Matrix;

export type PunktStatus = 'ok' | 'falsches-feld' | 'fehlt';
export type FeldStatus = 'vollstaendig' | 'teilweise' | 'fehlt';
export interface PunktErgebnis { punkt: Kernpunkt; status: PunktStatus; gefundenIn?: Feld }
export interface FeldErgebnis { feld: Feld; status: FeldStatus; punkte: PunktErgebnis[]; woerter: number }

export type MatrixStatus = 'richtig' | 'teilweise' | 'falsch' | 'offen';
export interface MatrixErgebnis {
  zeile: MatrixZeile;
  eingabe: MatrixEingabe;
  status: MatrixStatus;
  vorhandenOk: boolean;
  weitereOk: boolean;
  themenfelderOk: boolean | null;   // null = nicht bewertet (kein Risiko)
  welchesOk: boolean | null;        // nur Sonstiges
  punkte: number;
  max: number;
}

export interface SisErgebnis {
  felder: FeldErgebnis[];
  matrix: MatrixErgebnis[];
  prozent: number;
  textProzent: number;
  matrixProzent: number;
  pflichtFehlend: Kernpunkt[];
  matrixVollstaendig: boolean;
  wertend: string[];               // gefundene wertende Begriffe
  hinweise: string[];
}

// Wertende Begriffe, die in eine sachliche Dokumentation nicht gehören (Prüfregel regel.bericht.wertfrei sinngemäß).
const WERTEND = ['uneinsichtig', 'aggressiv', 'stur ', 'unkooperativ', 'verweigert', 'renitent', 'jammert', 'querulant', 'laestig', 'faul ', 'bockig', 'dickkoepfig', 'nervig', 'anstrengend', 'schwierige patient', 'schwieriger patient', 'schwierige bewohner', 'schwieriger bewohner', 'fordernd'];
// Fachsprache, die in Feld B (Worte der Person) fremd wirkt.
const FACHWORT_B = ['mobilitaet', 'ressource', 'defizit', 'pflegebedarf', 'risiko', 'dekubitus', 'prophylaxe', 'inkontinen', 'orientiert', 'compliance', 'adl ', 'atl ', 'pflegeproblem', 'hemiparese', 'dysphagie', 'aphasie', 'nrs '];
// Hinweise darauf, dass die Sicht der Person und eine Verständigung festgehalten sind.
const VERSTAENDIGUNG = ['wuensch', 'moechte', 'moecht', 'mag ', 'will', 'lehnt', 'einverstanden', 'vereinbart', 'abgesprochen', 'besprochen', 'gemeinsam', 'sagt', 'aeussert', 'berichtet', 'nach eigener', 'ist ihr wichtig', 'ist ihm wichtig', 'wichtig', 'gewohnt', 'gewohnheit', 'ueberlegt', 'auf wunsch'];

const PERSPEKTIVE_B = /[„"“»«]|\b(ich|mir|mich|mein|meine|meinen|meiner|wir|uns)\b/;

const woerter = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Begriffe, die in `t` (Suchtext mit Leerzeichen an den Rändern) am Wortanfang stehen. Endet ein Begriff auf Leerzeichen, nur als ganzes Wort. */
function enthaelt(t: string, liste: string[]): string[] {
  return liste.filter((w) => t.includes(` ${w}`));
}

/** Matrix allein prüfen (auch für die Live-Anzeige). */
export function pruefeMatrix(fall: SisFall, matrix: Matrix): MatrixErgebnis[] {
  return fall.matrix.map((zeile) => {
    const e = matrix[zeile.risiko] ?? { themenfelder: [], welches: '' };
    const passt = (l: Loesung, x?: JaNein) => !!x && (l === 'beides' || l === x);
    const vorhandenOk = passt(zeile.vorhanden, e.vorhanden);
    const weitereOk = passt(zeile.weitere, e.weitere);
    let punkte = (vorhandenOk ? 2 : 0) + (weitereOk ? 1 : 0);
    let max = 3;
    // Themenfelder nur bewerten, wenn ein Risiko vorliegt und es auch angekreuzt wurde
    let themenfelderOk: boolean | null = null;
    if (zeile.vorhanden !== 'nein' && e.vorhanden === 'ja' && zeile.themenfelder.length) {
      themenfelderOk = e.themenfelder.some((t) => zeile.themenfelder.includes(t));
      max += 1; punkte += themenfelderOk ? 1 : 0;
    } else if (zeile.vorhanden === 'ja') {
      max += 1; themenfelderOk = false;
    }
    let welchesOk: boolean | null = null;
    if (zeile.risiko === 'sonstiges' && zeile.welches && e.vorhanden === 'ja') {
      welchesOk = findeMuster(suchtext(vereinfache(e.welches)), zeile.welches) >= 0;
      max += 1; punkte += welchesOk ? 1 : 0;
    } else if (zeile.risiko === 'sonstiges' && zeile.vorhanden === 'ja') {
      max += 1; welchesOk = false;
    }
    const status: MatrixStatus = !e.vorhanden ? 'offen' : punkte === max ? 'richtig' : vorhandenOk ? 'teilweise' : 'falsch';
    return { zeile, eingabe: e, status, vorhandenOk, weitereOk, themenfelderOk, welchesOk, punkte, max };
  });
}

export function pruefeSis(fall: SisFall, felder: Felder, matrix: Matrix): SisErgebnis {
  const such = Object.fromEntries(FELDER.map((f) => [f, suchtext(vereinfache(felder[f] ?? ''))])) as Record<Feld, string>;

  const ergebnisse: PunktErgebnis[] = fall.kernpunkte.map((punkt) => {
    if (findeMuster(such[punkt.feld], punkt.muster) >= 0) return { punkt, status: 'ok' };
    const anders = FELDER.find((f) => f !== punkt.feld && findeMuster(such[f], punkt.muster) >= 0);
    return anders ? { punkt, status: 'falsches-feld', gefundenIn: anders } : { punkt, status: 'fehlt' };
  });

  const feldErgebnisse: FeldErgebnis[] = FELDER.map((feld) => {
    const punkte = ergebnisse.filter((e) => e.punkt.feld === feld);
    const pflicht = punkte.filter((e) => e.punkt.pflicht);
    const okP = pflicht.filter((e) => e.status === 'ok').length;
    const irgendwas = punkte.some((e) => e.status !== 'fehlt');
    const status: FeldStatus = pflicht.length && okP === pflicht.length ? 'vollstaendig' : irgendwas ? 'teilweise' : 'fehlt';
    return { feld, status, punkte, woerter: woerter(felder[feld] ?? '') };
  });

  let tMax = 0; let tErr = 0;
  for (const e of ergebnisse) {
    const w = e.punkt.pflicht ? 2 : 1;
    tMax += w;
    tErr += e.status === 'ok' ? w : e.status === 'falsches-feld' ? w / 2 : 0;
  }
  const m = pruefeMatrix(fall, matrix);
  const mMax = m.reduce((s, x) => s + x.max, 0);
  const mErr = m.reduce((s, x) => s + x.punkte, 0);
  const matrixVollstaendig = m.every((x) => x.eingabe.vorhanden && x.eingabe.weitere);

  const alles = FELDER.map((f) => such[f]).join(' ');
  const wertend = [...new Set(enthaelt(alles, WERTEND))];

  const hinweise: string[] = [];
  const bRoh = felder.B ?? '';
  if (!bRoh.trim()) hinweise.push('Feld B ist leer. Es gehört an den Anfang: die Sicht der Person in ihren eigenen Worten.');
  else {
    if (!PERSPEKTIVE_B.test(bRoh.toLowerCase())) hinweise.push('Feld B: Gib die Sicht der Person möglichst wörtlich wieder, in Anführungszeichen oder in der Ich-Form.');
    const fach = enthaelt(such.B, FACHWORT_B);
    if (fach.length) hinweise.push(`Feld B enthält Fachsprache (${fach.join(', ')}). Hier stehen die Worte der Person, die fachliche Einschätzung gehört in die Themenfelder.`);
  }
  const leer = THEMENFELDER.filter((t) => !felder[t]?.trim());
  if (leer.length) hinweise.push(`Noch leer: Themenfeld ${leer.map((t) => t.slice(2)).join(', ')}. Jedes Themenfeld wird ausgefüllt, auch wenn dort kein Hilfebedarf besteht.`);
  const mitSicht = THEMENFELDER.filter((t) => felder[t]?.trim() && enthaelt(such[t], VERSTAENDIGUNG).length).length;
  const gefuellt = THEMENFELDER.length - leer.length;
  if (gefuellt >= 3 && mitSicht < Math.ceil(gefuellt / 2)) {
    hinweise.push('In den Themenfeldern fehlt oft die Sicht der Person und die Verständigung: Was wünscht sie, was lehnt sie ab, was wurde vereinbart?');
  }
  if (!matrixVollstaendig) hinweise.push('Die Risikomatrix ist nicht vollständig. Für jedes Risiko „ja“ oder „nein“ und „weitere Einschätzung notwendig“ angeben.');
  if (wertend.length) hinweise.push(`Wertende Begriffe gefunden (${wertend.join(', ')}). Beschreibe stattdessen sachlich, was du beobachtest.`);

  const prozent = tMax + mMax ? Math.round(((tErr + mErr) / (tMax + mMax)) * 100) : 0;
  return {
    felder: feldErgebnisse, matrix: m, prozent,
    textProzent: tMax ? Math.round((tErr / tMax) * 100) : 0,
    matrixProzent: mMax ? Math.round((mErr / mMax) * 100) : 0,
    pflichtFehlend: ergebnisse.filter((e) => e.punkt.pflicht && e.status === 'fehlt').map((e) => e.punkt),
    matrixVollstaendig, wertend, hinweise,
  };
}

/** Musterlösung als Eingabe (für Tests und die Ansicht „Beispiel übernehmen“). */
export function musterMatrix(fall: SisFall): Matrix {
  const m = leereMatrix();
  for (const z of fall.matrix) {
    const ja = z.vorhanden !== 'nein';
    m[z.risiko] = {
      vorhanden: ja ? 'ja' : 'nein',
      weitere: z.weitere === 'nein' ? 'nein' : 'ja',
      themenfelder: ja ? z.themenfelder.filter((t) => MATRIX_FELDER.includes(t)) : [],
      welches: z.welches?.[0] ?? '',
    };
  }
  return m;
}
