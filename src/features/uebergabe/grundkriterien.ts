// Gemeinsame SBAR-Grundkriterien für Übergabe-Trainer, Praxissimulator, Diagnostik und Werkbank
// (Audit: „Rufgrund, Priorität, Rückfrage und Empfehlung aus Fallereignissen ableiten. SBAR zwischen
// Praxis, Diagnostik und Werkbank mit gemeinsamen Grundkriterien prüfen“).
//
// 1. rufanlass(): leitet aus den Ereignissen eines Falls ab, warum jetzt gerufen wird, wie dringend,
//    was empfohlen und was zurückgefragt werden sollte. Der schwerste, jüngste Anlass zählt.
// 2. pruefeGrundkriterien(): prüft eine SBAR (Freitext je Teil oder zusammengesetzte Bausteine) gegen
//    dieselben sechs Kriterien. Reine Stichwortprüfung, keine Sinnprüfung.
import { findeMuster, gliedere, suchtext, vereinfache } from './pruefung';

export type SbarTeil = 'S' | 'B' | 'A' | 'R';
export type Prioritaet = 'sofort' | 'zeitnah' | 'routine';
export type GrundId = 'rufgrund' | 'prioritaet' | 'hintergrund' | 'einschaetzung' | 'empfehlung' | 'rueckfrage';
/** offen: lässt sich aus diesem Fall nicht per Stichwort prüfen (z. B. Anlass ohne Stichworte). */
export type GrundStatus = 'ok' | 'teilweise' | 'fehlt' | 'offen';

export const GRUNDKRITERIEN: { id: GrundId; teil: string; label: string; frage: string }[] = [
  { id: 'rufgrund', teil: 'S', label: 'Rufgrund', frage: 'Warum meldest du dich gerade jetzt?' },
  { id: 'prioritaet', teil: 'S/R', label: 'Priorität', frage: 'Wie dringend ist es, bis wann?' },
  { id: 'hintergrund', teil: 'B', label: 'Hintergrund', frage: 'Was ist für diesen Anlass wichtig, ohne Ballast?' },
  { id: 'einschaetzung', teil: 'A', label: 'Einschätzung', frage: 'Werte und deine eigene Einschätzung' },
  { id: 'empfehlung', teil: 'R', label: 'Empfehlung', frage: 'Was brauchst du konkret?' },
  { id: 'rueckfrage', teil: 'R', label: 'Rückfrage', frage: 'Rückfrage stellen oder Absprache zurücklesen' },
];

export const PRIORITAET_LABEL: Record<Prioritaet, string> = { sofort: 'sofort', zeitnah: 'zeitnah', routine: 'nicht dringend' };

/** Ein Ereignis aus dem Fall: Wert, Beobachtung, Laboranruf, Komplikation. */
export interface SbarEreignis {
  text: string;
  /** kritisch: sofort rufen · auffaellig: zeitnah · info: bei nächster Gelegenheit */
  stufe: 'kritisch' | 'auffaellig' | 'info';
  /** Simulationszeit oder Reihenfolge; das jüngste gleich schwere Ereignis gewinnt. */
  minute?: number;
  /** Stichworte, an denen der Rufgrund in S erkannt wird. */
  muster?: string[];
  /** Fallbezogene Empfehlung, sonst Standard je Priorität. */
  empfehlung?: string;
  rueckfrage?: string;
}

export interface Rufanlass {
  rufgrund: string;
  prioritaet: Prioritaet;
  /** Aus welchen Ereignissen abgeleitet. */
  quellen: string[];
  empfehlung: string;
  rueckfrage: string;
  muster: string[];
}

const STANDARD_EMPFEHLUNG: Record<Prioritaet, string> = {
  sofort: 'Ärztin oder Arzt sofort zur Person bitten, bis dahin dabeibleiben und überwachen',
  zeitnah: 'Ärztliche Einschätzung in einem genannten Zeitraum erbitten (z. B. innerhalb von 30 Minuten)',
  routine: 'Zur nächsten Visite oder im nächsten Dienst klären lassen',
};
const STANDARD_RUECKFRAGE: Record<Prioritaet, string> = {
  sofort: 'Was soll ich bis zu Ihrem Eintreffen tun? Absprache zurücklesen.',
  zeitnah: 'Ab welchem Wert oder welcher Veränderung soll ich erneut anrufen?',
  routine: 'Soll ich bis dahin etwas anpassen oder beobachten?',
};
const RANG = { kritisch: 3, auffaellig: 2, info: 1 } as const;
const PRIO: Record<SbarEreignis['stufe'], Prioritaet> = { kritisch: 'sofort', auffaellig: 'zeitnah', info: 'routine' };

/** Leitet Rufgrund, Priorität, Empfehlung und Rückfrage aus den Fallereignissen ab. null ohne Ereignisse. */
export function rufanlass(ereignisse: SbarEreignis[]): Rufanlass | null {
  if (!ereignisse.length) return null;
  const sortiert = ereignisse.map((e, i) => ({ e, i })).sort((a, b) => RANG[b.e.stufe] - RANG[a.e.stufe] || (b.e.minute ?? b.i) - (a.e.minute ?? a.i));
  const top = sortiert[0]!.e;
  const gleich = sortiert.filter((x) => x.e.stufe === top.stufe).map((x) => x.e);
  const prioritaet = PRIO[top.stufe];
  return {
    rufgrund: top.text,
    prioritaet,
    quellen: gleich.map((e) => e.text),
    empfehlung: top.empfehlung ?? STANDARD_EMPFEHLUNG[prioritaet],
    rueckfrage: top.rueckfrage ?? STANDARD_RUECKFRAGE[prioritaet],
    muster: [...new Set(gleich.flatMap((e) => e.muster ?? []))],
  };
}

// ---------- Prüfung ----------

const PRIO_MUSTER: Record<Prioritaet, string[]> = {
  sofort: ['sofort', 'umgehend', 'jetzt', 'gleich', 'notfall', 'so schnell', 'schnellstmoeglich', '5 minuten', '10 minuten', 'fuenf minuten', 'zehn minuten', 'naechsten minuten', '112', 'notarzt', 'reanimationsteam'],
  zeitnah: ['zeitnah', 'innerhalb', 'minuten', 'bald', 'in der naechsten stunde', 'heute noch', 'stunde', 'dringend'],
  routine: ['visite', 'morgen', 'routine', 'naechsten dienst', 'naechste schicht', 'nicht dringend', 'kein notfall', 'spaeter', 'heute', 'bei gelegenheit'],
};
const EINSCHAETZUNG = ['vermute', 'befuercht', 'gehe davon aus', 'nicht ausreichend', 'unauffaellig', 'besser', 'gebessert', 'verdacht', 'sorge', 'besorg', 'ich denke', 'ich glaube', 'einschaetz', 'instabil', 'verschlechter', 'kritisch', 'gefahr', 'eindruck', 'wirkt', 'stabil', 'deutet', 'spricht fuer', 'koennte', 'hinweis auf', 'gefaehrd'];
const BITTE = ['bitte', 'koennen sie', 'koennten sie', 'kannst du', 'ich moechte', 'ich brauche', 'ich empfehle', 'ich schlage', 'anordnung', 'kommen sie', 'kommen', 'ansehen', 'anschauen', 'soll ich', 'sollen wir', 'uebernehmen'];
const RUECK = ['?', 'wiederhole', 'zurueckles', 'lese zurueck', 'richtig verstanden', 'bestaetig', 'zusammengefasst', 'habe ich notiert', 'notiert', 'ich melde mich', 'rufe wieder an', 'rufe erneut an', 'ab welchem'];

export interface GrundErgebnis { id: GrundId; label: string; status: GrundStatus; text: string }

const t = (s: string) => suchtext(vereinfache(s));
const hat = (s: string, m: string[]) => m.length > 0 && findeMuster(t(s), m) >= 0;
const woerter = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * Prüft eine SBAR gegen die Grundkriterien.
 * felder: Text je Teil (bei Bausteinen: die gewählten Bausteine je Teil aneinandergehängt).
 * ballast: Anzahl gewählter unwichtiger Angaben (nur bei Bausteinen bekannt).
 * hintergrund: Stichworte für wichtigen Hintergrund (optional; sonst zählt, dass B Inhalt hat).
 */
export function pruefeGrundkriterien(felder: Record<SbarTeil, string>, anlass: Rufanlass | null, opt: { ballast?: number; hintergrund?: string[] } = {}): GrundErgebnis[] {
  const alles = `${felder.S}\n${felder.B}\n${felder.A}\n${felder.R}`;
  const e = (id: GrundId, status: GrundStatus, text: string): GrundErgebnis => ({ id, label: GRUNDKRITERIEN.find((g) => g.id === id)!.label, status, text });
  const out: GrundErgebnis[] = [];

  // Rufgrund
  if (!anlass) out.push(e('rufgrund', woerter(felder.S) >= 4 ? 'offen' : 'fehlt', woerter(felder.S) >= 4 ? 'Kein Anlass aus dem Fall ableitbar, Inhalt nicht automatisch prüfbar.' : 'In S steht noch nicht, warum du dich meldest.'));
  else if (!anlass.muster.length) out.push(e('rufgrund', woerter(felder.S) >= 4 ? 'offen' : 'fehlt', `Erwartet: ${anlass.rufgrund}. ${woerter(felder.S) >= 4 ? 'Ohne Stichworte nicht automatisch prüfbar.' : 'S ist noch zu knapp.'}`));
  else if (hat(felder.S, anlass.muster)) out.push(e('rufgrund', 'ok', `Rufgrund in S genannt: ${anlass.rufgrund}.`));
  else if (hat(alles, anlass.muster)) out.push(e('rufgrund', 'teilweise', `Der Rufgrund (${anlass.rufgrund}) steht erst später. Er gehört an den Anfang, in S.`));
  else out.push(e('rufgrund', 'fehlt', `Der Rufgrund fehlt: ${anlass.rufgrund}.`));

  // Priorität
  const sr = `${felder.S}\n${felder.R}`;
  if (!anlass) out.push(e('prioritaet', Object.values(PRIO_MUSTER).some((m) => hat(sr, m)) ? 'offen' : 'fehlt', 'Dringlichkeit in S oder R nennen.'));
  else if (hat(sr, PRIO_MUSTER[anlass.prioritaet])) out.push(e('prioritaet', 'ok', `Dringlichkeit passt: ${PRIORITAET_LABEL[anlass.prioritaet]}.`));
  else if ((Object.keys(PRIO_MUSTER) as Prioritaet[]).some((p) => hat(sr, PRIO_MUSTER[p]))) out.push(e('prioritaet', 'teilweise', `Dringlichkeit genannt, aber aus dem Fall folgt: ${PRIORITAET_LABEL[anlass.prioritaet]}.`));
  else out.push(e('prioritaet', 'fehlt', `Sag, wie dringend es ist. Aus dem Fall folgt: ${PRIORITAET_LABEL[anlass.prioritaet]}.`));

  // Hintergrund
  const ballast = opt.ballast ?? 0;
  if (woerter(felder.B) < 3) out.push(e('hintergrund', 'fehlt', 'B fehlt: Diagnose, Vorgeschichte, Medikamente oder Verlauf, soweit für den Anlass wichtig.'));
  else if (opt.hintergrund?.length && !hat(felder.B, opt.hintergrund)) out.push(e('hintergrund', 'teilweise', 'B hat Inhalt, aber der für diesen Anlass wichtige Hintergrund fehlt.'));
  else if (ballast > 0) out.push(e('hintergrund', 'teilweise', `${ballast === 1 ? 'Eine Angabe ist' : `${ballast} Angaben sind`} für den Anruf unwichtig und lenken ab.`));
  else out.push(e('hintergrund', 'ok', 'Hintergrund vorhanden.'));

  // Einschätzung
  const wert = /\d/.test(felder.A);
  const eigen = hat(felder.A, EINSCHAETZUNG);
  out.push(e('einschaetzung', wert && eigen ? 'ok' : wert || eigen ? 'teilweise' : 'fehlt',
    wert && eigen ? 'Werte und eigene Einschätzung genannt.' : wert ? 'Werte genannt. Sag auch, was du vermutest oder befürchtest.' : eigen ? 'Einschätzung genannt. Belege sie mit aktuellen Werten.' : 'In A fehlen Werte und deine Einschätzung.'));

  // Empfehlung
  const bitte = hat(felder.R, BITTE);
  out.push(e('empfehlung', bitte ? 'ok' : woerter(felder.R) >= 3 ? 'teilweise' : 'fehlt',
    bitte ? 'Konkrete Bitte formuliert.' : `Formuliere eine konkrete Bitte. ${anlass ? `Passend wäre: ${anlass.empfehlung}.` : ''}`.trim()));

  // Rückfrage
  const rueck = hat(felder.R, RUECK) || hat(alles.slice(-200), RUECK);
  out.push(e('rueckfrage', rueck ? 'ok' : 'fehlt', rueck ? 'Rückfrage oder Zurücklesen vorhanden.' : `Schließ mit einer Rückfrage oder lies die Absprache zurück. ${anlass ? `Zum Beispiel: ${anlass.rueckfrage}` : ''}`.trim()));
  return out;
}

/** Bausteine (Diagnostik „S: …“, Werkbank mit Teil) in Felder je Teil umwandeln. Ohne Teil zählt der Baustein als Ballast-Kandidat. */
export function felderAusBausteinen(bausteine: { teil?: SbarTeil | 'x'; text: string; relevant?: boolean }[]): { felder: Record<SbarTeil, string>; ballast: number } {
  const felder: Record<SbarTeil, string> = { S: '', B: '', A: '', R: '' };
  let ballast = 0;
  for (const b of bausteine) {
    const praefix = /^([SBAR]):\s*/.exec(b.text);
    const teil = b.teil && b.teil !== 'x' ? b.teil : (praefix?.[1] as SbarTeil | undefined);
    if (b.teil === 'x' || b.relevant === false) ballast++;
    if (teil && b.teil !== 'x' && b.relevant !== false) felder[teil] += `${felder[teil] ? ' ' : ''}${b.text.replace(/^[SBAR]:\s*/, '')}`;
  }
  return { felder, ballast };
}

/** Anteil erfüllter Kriterien (teilweise zählt halb, offen zählt nicht mit). */
export function grundProzent(e: GrundErgebnis[]): number {
  const gezaehlt = e.filter((x) => x.status !== 'offen');
  if (!gezaehlt.length) return 0;
  return Math.round((gezaehlt.reduce((s, x) => s + (x.status === 'ok' ? 1 : x.status === 'teilweise' ? 0.5 : 0), 0) / gezaehlt.length) * 100);
}

/** Freitext mit S/B/A/R-Überschriften in Felder zerlegen. Ohne Gliederung landet alles in S. */
export function felderAusText(text: string): Record<SbarTeil, string> {
  const f: Record<SbarTeil, string> = { S: '', B: '', A: '', R: '' };
  const g = gliedere(vereinfache(text));
  if (!g.length) f.S = text;
  for (const x of g) f[x.teil] += `${f[x.teil] ? ' ' : ''}${x.text}`;
  return f;
}
