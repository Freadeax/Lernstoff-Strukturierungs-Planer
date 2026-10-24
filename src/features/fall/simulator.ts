// Fallbeispiel-Simulator: Claude spielt Patient, Angehörige und Station. Jeder Zug kommt als JSON
// nach festem Schema (Structured Outputs); NEWS2 und Katalogbezüge rechnet die App selbst nach.

import Anthropic from '@anthropic-ai/sdk';
import type { CatalogModule } from '../../modules/catalog-types';
import { SETTING_LABEL, type Stufe, type Szenario } from './faelle';
import type { Treffer } from '../lernplan/trainer';

export const MODEL = 'claude-opus-5-5';

// ---------- Pflegeprozess (6 Schritte nach Fiechter/Meier) ----------

export const SCHRITTE = [
  'informationssammlung', 'probleme', 'ziele', 'massnahmen', 'durchfuehrung', 'evaluation',
] as const;
export type Schritt = typeof SCHRITTE[number];

export const SCHRITT_LABEL: Record<Schritt, string> = {
  informationssammlung: 'Informationen sammeln',
  probleme: 'Probleme und Ressourcen',
  ziele: 'Ziele festlegen',
  massnahmen: 'Maßnahmen planen',
  durchfuehrung: 'Durchführen',
  evaluation: 'Evaluieren',
};

// ---------- Zug (eine Antwort von Claude) ----------

export type Zustand = 'stabil' | 'verbessert' | 'verschlechtert' | 'kritisch';
export type Wertung = 'gut' | 'teilweise' | 'unguenstig' | 'gefaehrlich' | 'keine';

export interface Vitalwerte {
  rr: string;          // "135/85", leer = nicht gemessen
  puls: string;
  af: string;
  spo2: string;
  sauerstoff: string;  // "ja" | "nein" | ""
  temp: string;
  bz: string;
  schmerz: string;     // NRS 0-10
  bewusstsein: string; // A | C | V | P | U | ""
}

export interface Zug {
  uhrzeit: string;
  situation: string;
  vitalwerte: Vitalwerte;
  zustand: Zustand;
  schritt: Schritt;
  rueckmeldung: { wertung: Wertung; text: string };
  optionen: string[];
  beendet: boolean;
}

export const WERTUNG_LABEL: Record<Wertung, string> = {
  gut: 'Gut gemacht', teilweise: 'Teilweise passend', unguenstig: 'Ungünstig', gefaehrlich: 'Gefährlich', keine: '',
};
export const ZUSTAND_LABEL: Record<Zustand, string> = {
  stabil: 'stabil', verbessert: 'verbessert', verschlechtert: 'verschlechtert', kritisch: 'kritisch',
};

const VITAL_KEYS = ['rr', 'puls', 'af', 'spo2', 'sauerstoff', 'temp', 'bz', 'schmerz', 'bewusstsein'] as const;
const str = { type: 'string' } as const;
const obj = (properties: Record<string, unknown>) => ({
  type: 'object', additionalProperties: false, properties, required: Object.keys(properties),
});

export const ZUG_SCHEMA = obj({
  uhrzeit: str,
  situation: str,
  vitalwerte: obj(Object.fromEntries(VITAL_KEYS.map((k) => [k, str]))),
  zustand: { type: 'string', enum: ['stabil', 'verbessert', 'verschlechtert', 'kritisch'] },
  schritt: { type: 'string', enum: [...SCHRITTE] },
  rueckmeldung: obj({ wertung: { type: 'string', enum: ['gut', 'teilweise', 'unguenstig', 'gefaehrlich', 'keine'] }, text: str }),
  optionen: { type: 'array', items: str },
  beendet: { type: 'boolean' },
});

// ---------- Abschlussauswertung ----------

export type Note = 'sicher' | 'ueberwiegend_sicher' | 'teilweise' | 'unsicher';
export type SchrittBewertung = 'stark' | 'ok' | 'luecke' | 'nicht_bearbeitet';

export interface Abschluss {
  note: Note;
  gesamt: string;
  schritte: Array<{ schritt: Schritt; bewertung: SchrittBewertung; kommentar: string }>;
  staerken: string[];
  verbesserungen: string[];
  musterloesung: string;
  themen: string[];
}

export const NOTE_LABEL: Record<Note, string> = {
  sicher: 'Sicher gehandelt', ueberwiegend_sicher: 'Überwiegend sicher', teilweise: 'Teilweise sicher', unsicher: 'Noch unsicher',
};
export const SCHRITT_BEWERTUNG_LABEL: Record<SchrittBewertung, string> = {
  stark: 'stark', ok: 'in Ordnung', luecke: 'Lücke', nicht_bearbeitet: 'nicht bearbeitet',
};

const strArr = { type: 'array', items: str } as const;
export const ABSCHLUSS_SCHEMA = obj({
  note: { type: 'string', enum: ['sicher', 'ueberwiegend_sicher', 'teilweise', 'unsicher'] },
  gesamt: str,
  schritte: {
    type: 'array',
    items: obj({
      schritt: { type: 'string', enum: [...SCHRITTE] },
      bewertung: { type: 'string', enum: ['stark', 'ok', 'luecke', 'nicht_bearbeitet'] },
      kommentar: str,
    }),
  },
  staerken: strArr,
  verbesserungen: strArr,
  musterloesung: str,
  themen: strArr,
});

// ---------- Fall (gespeicherter Spielstand) ----------

export interface Runde { eingabe?: string; zug: Zug }

export interface Fall {
  id: string;
  szenario: Szenario;
  stufe: Stufe;
  begonnen: string;
  runden: Runde[];
  abschluss?: Abschluss;
}

// ---------- Prompts ----------

const STUFE_ANWEISUNG: Record<Stufe, string> = {
  1: 'Einstieg (1. Ausbildungsjahr): klare Symptome, langsame Entwicklung, ausführliche Rückmeldungen mit Erklärung.',
  2: 'Station (2. Ausbildungsjahr): realistische Symptome, auch Nebenbefunde, die Lage verändert sich spürbar, wenn wichtige Schritte fehlen.',
  3: 'Profi (Examensniveau): unklare und konkurrierende Probleme, Zeitdruck, knappe Rückmeldungen; Fehler haben deutliche Folgen.',
};

export function systemPrompt(szenario: Szenario, stufe: Stufe, modul: CatalogModule): string {
  const themen = szenario.topicIds
    .map((id) => modul.topics.find((t) => t.id === id)?.name)
    .filter(Boolean)
    .join('; ');
  return `Du bist ein Fallsimulator für die generalistische Pflegeausbildung in Deutschland (Fachmodul „${modul.name}“).
Du spielst die Welt rund um eine auszubildende Pflegefachperson: Patientin oder Patient, Angehörige, Kolleginnen, Ärztin, Station. Die lernende Person entscheidet, was sie tut; du beschreibst, was daraufhin passiert, und gibst eine kurze fachliche Rückmeldung.

FALL
Titel: ${szenario.titel}
Setting: ${SETTING_LABEL[szenario.setting]}
Ausgangslage (kennt die lernende Person): ${szenario.kurz}
Verborgener Verlauf (NIE direkt verraten, nur über beobachtbare Zeichen zeigen): ${szenario.verborgen}
Bezug zum Lernkatalog: ${themen || '–'}
Schwierigkeit: ${STUFE_ANWEISUNG[stufe]}

REGELN FÜR JEDEN ZUG
- Antworte immer auf Deutsch, in Alltagssprache der Station; Fachbegriffe korrekt verwenden.
- "situation": 2 bis 6 Sätze, was jetzt passiert und was die lernende Person wahrnimmt. Wörtliche Rede in „…“ ist erwünscht. Keine Diagnose vorwegnehmen.
- Die Zeit läuft: "uhrzeit" im Format HH:MM, je nach Handlung 1 bis 30 Minuten weiter.
- "vitalwerte": nur Werte eintragen, die bisher gemessen wurden oder ausdrücklich bekannt sind, sonst leerer String. Misst die Person etwas, trage den aktuellen Wert ein. Bereits gemessene Werte bleiben stehen, bis neu gemessen wird. Formate: rr "135/85", puls/af/spo2 als ganze Zahl, temp "38,4", bz in mg/dl, schmerz NRS 0-10, bewusstsein A/C/V/P/U, sauerstoff "ja"/"nein".
- Der Verlauf hängt von den Entscheidungen ab: Sinnvolle Handlungen stabilisieren oder verbessern, Versäumnisse lassen den verborgenen Verlauf fortschreiten ("zustand").
- "schritt": der Schritt des Pflegeprozesses (Fiechter/Meier), zu dem die letzte Handlung gehört.
- "rueckmeldung": wertung und 1 bis 3 Sätze, WARUM, mit Bezug auf Pflegeprozess, Prophylaxen, Expertenstandards oder Beobachtungskriterien. Beim ersten Zug wertung "keine" und leerer Text. "gefaehrlich" nur bei echter Patientengefährdung.
- "optionen": 3 bis 4 plausible nächste Handlungen in der Ich-Form, gemischt aus guten und weniger guten, nicht nach Qualität sortiert. Die Person darf auch frei formulieren.
- Ärztliche Tätigkeiten führt die Pflegeperson nicht selbst aus; reagiere realistisch (Rückfrage, Anordnung nötig). Medikamente nur nach Anordnung, Dosierungen sind fiktiv.
- Fragt die Person ihre Praxisanleitung, gib einen hilfreichen Denkanstoß, ohne die Lösung zu verraten.
- "beendet": true, wenn der Fall sinnvoll abgeschlossen ist (Lage geklärt und übergeben, Notfall übernommen, oder nach etwa 8 bis 12 Zügen), sonst false.
- Beschreibe niemals echte Personen. Alles ist fiktiv und ersetzt keine Anordnung.`;
}

export const START_TEXT = 'Beginne den Fall. Beschreibe die Ausgangssituation, so wie ich sie als Pflegeperson vorfinde.';
export const ABSCHLUSS_TEXT = (themenIds: string[]) =>
  `Der Fall ist beendet. Werte mein Vorgehen über den gesamten Verlauf aus, entlang der 6 Schritte des Pflegeprozesses (jeder Schritt genau einmal).
- "gesamt": 2 bis 4 Sätze Gesamturteil, direkt an mich gerichtet.
- "staerken" und "verbesserungen": je 2 bis 4 konkrete Punkte mit Bezug auf meine Entscheidungen.
- "musterloesung": ein knapper idealer Ablauf in 4 bis 8 Sätzen.
- "themen": 1 bis 5 IDs aus dieser Liste, die ich wiederholen sollte: ${themenIds.join(', ')}.`;

/** Gesprächsverlauf für die API: Start, dann abwechselnd Zug (als JSON) und Eingabe. */
export function nachrichten(fall: Fall, neueEingabe?: string): Anthropic.MessageParam[] {
  const msgs: Anthropic.MessageParam[] = [{ role: 'user', content: START_TEXT }];
  for (const r of fall.runden) {
    if (r.eingabe !== undefined) msgs.push({ role: 'user', content: r.eingabe });
    msgs.push({ role: 'assistant', content: JSON.stringify(r.zug) });
  }
  if (neueEingabe !== undefined) msgs.push({ role: 'user', content: neueEingabe });
  return msgs;
}

// ---------- Antworten prüfen ----------

const istText = (v: unknown): v is string => typeof v === 'string';
const ein = <T extends string>(v: unknown, erlaubt: readonly T[], ersatz: T): T =>
  (erlaubt as readonly unknown[]).includes(v) ? (v as T) : ersatz;

/** Prüft und normalisiert einen Zug. Wirft, wenn das Wichtigste fehlt. */
export function parseZug(text: string): Zug {
  const roh = JSON.parse(text) as Record<string, unknown>;
  if (!istText(roh.situation) || !roh.situation.trim()) throw new Error('Antwort ohne Situation.');
  const v = (roh.vitalwerte ?? {}) as Record<string, unknown>;
  const r = (roh.rueckmeldung ?? {}) as Record<string, unknown>;
  return {
    uhrzeit: istText(roh.uhrzeit) ? roh.uhrzeit : '',
    situation: roh.situation.trim(),
    vitalwerte: Object.fromEntries(VITAL_KEYS.map((k) => [k, istText(v[k]) ? v[k].trim() : ''])) as unknown as Vitalwerte,
    zustand: ein(roh.zustand, ['stabil', 'verbessert', 'verschlechtert', 'kritisch'], 'stabil'),
    schritt: ein(roh.schritt, SCHRITTE, 'informationssammlung'),
    rueckmeldung: { wertung: ein(r.wertung, ['gut', 'teilweise', 'unguenstig', 'gefaehrlich', 'keine'], 'keine'), text: istText(r.text) ? r.text : '' },
    optionen: Array.isArray(roh.optionen) ? roh.optionen.filter(istText).map((o) => o.trim()).filter(Boolean).slice(0, 5) : [],
    beendet: roh.beendet === true,
  };
}

/** Prüft die Auswertung; Themen-IDs, die es im Katalog nicht gibt, fallen weg. */
export function parseAbschluss(text: string, modul: CatalogModule): Abschluss {
  const roh = JSON.parse(text) as Record<string, unknown>;
  if (!istText(roh.gesamt)) throw new Error('Auswertung ohne Gesamturteil.');
  const ids = new Set(modul.topics.map((t) => t.id));
  const arr = (x: unknown) => (Array.isArray(x) ? x.filter(istText) : []);
  const schritte = (Array.isArray(roh.schritte) ? roh.schritte : []) as Array<Record<string, unknown>>;
  return {
    note: ein(roh.note, ['sicher', 'ueberwiegend_sicher', 'teilweise', 'unsicher'], 'teilweise'),
    gesamt: roh.gesamt,
    // In fester Reihenfolge, jeder Schritt höchstens einmal
    schritte: SCHRITTE.flatMap((s) => {
      const e = schritte.find((x) => x.schritt === s);
      return e ? [{ schritt: s, bewertung: ein(e.bewertung, ['stark', 'ok', 'luecke', 'nicht_bearbeitet'], 'nicht_bearbeitet'), kommentar: istText(e.kommentar) ? e.kommentar : '' }] : [];
    }),
    staerken: arr(roh.staerken),
    verbesserungen: arr(roh.verbesserungen),
    musterloesung: istText(roh.musterloesung) ? roh.musterloesung : '',
    themen: [...new Set(arr(roh.themen).filter((id) => ids.has(id)))],
  };
}

// ---------- Lernplan ----------

const NOTE_PROZENT: Record<Note, number> = { sicher: 95, ueberwiegend_sicher: 80, teilweise: 60, unsicher: 30 };
const SCHRITT_PROZENT: Partial<Record<SchrittBewertung, number>> = { stark: 95, ok: 75, luecke: 40 };
/** Welcher Pflegeprozess-Schritt welches Katalogthema abfragt. */
export const SCHRITT_THEMA: Record<Schritt, string> = {
  informationssammlung: 'thema.pp.anamnese',
  probleme: 'thema.pp.diagnosen',
  ziele: 'thema.pp.ziele',
  massnahmen: 'thema.pp.massnahmen',
  durchfuehrung: 'thema.pp.evaluation',
  evaluation: 'thema.pp.evaluation',
};

/**
 * Ein ausgewerteter Fall als Abfrage: die Gesamtnote zählt für die Themen des Szenarios,
 * jeder bearbeitete Pflegeprozess-Schritt für sein Pflegeprozess-Thema. Nicht bearbeitete
 * Schritte sagen nichts über das Wissen und fallen weg.
 */
export function fallTreffer(f: Fall): Treffer[] {
  if (!f.abschluss) return [];
  const treffer: Treffer[] = [{ topicIds: f.szenario.topicIds, punkte: NOTE_PROZENT[f.abschluss.note], max: 100 }];
  for (const s of f.abschluss.schritte) {
    const p = SCHRITT_PROZENT[s.bewertung];
    if (p !== undefined) treffer.push({ topicIds: [SCHRITT_THEMA[s.schritt]], punkte: p, max: 100 });
  }
  return treffer;
}

// ---------- NEWS2 (per Code, nicht von der KI) ----------

export interface News2 { punkte: number; risiko: 'niedrig' | 'niedrig-mittel' | 'mittel' | 'hoch'; fehlt: string[] }

const zahlAus = (s: string) => { const n = Number(s.replace(',', '.').replace(/[^\d.]/g, '')); return s.trim() && Number.isFinite(n) ? n : null; };

/** NEWS2 (Skala 1 für SpO2). Gibt null zurück, wenn nicht alle sieben Parameter bekannt sind. */
export function news2(v: Vitalwerte): News2 | null {
  const af = zahlAus(v.af), spo2 = zahlAus(v.spo2), sys = zahlAus(v.rr.split('/')[0] ?? ''), puls = zahlAus(v.puls), temp = zahlAus(v.temp);
  const bew = v.bewusstsein.trim().toUpperCase().charAt(0);
  const o2 = v.sauerstoff.trim().toLowerCase();
  const fehlt = [
    af === null && 'Atemfrequenz', spo2 === null && 'SpO₂', !['ja', 'nein'].includes(o2) && 'Sauerstoffgabe',
    sys === null && 'Blutdruck', puls === null && 'Puls', !'ACVPU'.includes(bew) || !bew ? 'Bewusstsein' : false, temp === null && 'Temperatur',
  ].filter((x): x is string => !!x);
  if (fehlt.length) return { punkte: 0, risiko: 'niedrig', fehlt };

  const teil = [
    af! <= 8 ? 3 : af! <= 11 ? 1 : af! <= 20 ? 0 : af! <= 24 ? 2 : 3,
    spo2! <= 91 ? 3 : spo2! <= 93 ? 2 : spo2! <= 95 ? 1 : 0,
    o2 === 'ja' ? 2 : 0,
    sys! <= 90 ? 3 : sys! <= 100 ? 2 : sys! <= 110 ? 1 : sys! <= 219 ? 0 : 3,
    puls! <= 40 ? 3 : puls! <= 50 ? 1 : puls! <= 90 ? 0 : puls! <= 110 ? 1 : puls! <= 130 ? 2 : 3,
    bew === 'A' ? 0 : 3,
    temp! <= 35 ? 3 : temp! <= 36 ? 1 : temp! <= 38 ? 0 : temp! <= 39 ? 1 : 2,
  ];
  const punkte = teil.reduce((a, b) => a + b, 0);
  const risiko = punkte >= 7 ? 'hoch' : punkte >= 5 ? 'mittel' : teil.includes(3) ? 'niedrig-mittel' : 'niedrig';
  return { punkte, risiko, fehlt: [] };
}

// ---------- Speicher (nur dieses Gerät) ----------

const AKTUELL = 'lernstoff.fall.aktuell';
const ARCHIV = 'lernstoff.fall.archiv';
const ARCHIV_MAX = 20;

function lies<T>(key: string, ersatz: T): T {
  try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : ersatz; } catch { return ersatz; }
}
function schreib(key: string, wert: unknown) {
  try {
    if (wert === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(wert));
  } catch { /* voller Speicher oder privater Modus: Fall läuft trotzdem weiter */ }
}

export const ladeAktuell = () => lies<Fall | null>(AKTUELL, null);
export const speichereAktuell = (f: Fall | null) => schreib(AKTUELL, f);
export const ladeArchiv = () => lies<Fall[]>(ARCHIV, []);
export function archiviere(f: Fall) {
  schreib(ARCHIV, [f, ...ladeArchiv().filter((x) => x.id !== f.id)].slice(0, ARCHIV_MAX));
}

export function neuerFall(szenario: Szenario, stufe: Stufe): Fall {
  return { id: crypto.randomUUID(), szenario, stufe, begonnen: new Date().toISOString(), runden: [] };
}

// ---------- API ----------

async function frage<T>(apiKey: string, system: string, messages: Anthropic.MessageParam[], schema: object, effort: 'low' | 'medium' | 'high', lese: (t: string) => T): Promise<T> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort, format: { type: 'json_schema', schema } },
    system,
    messages,
  } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (response.stop_reason === 'refusal') throw new Error('Die KI hat diesen Schritt abgelehnt. Formuliere die Handlung bitte anders.');
  if (response.stop_reason === 'max_tokens') throw new Error('Die Antwort wurde abgeschnitten. Bitte noch einmal versuchen.');
  const text = response.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('');
  return lese(text);
}

/** Nächster Zug: ohne Eingabe der Start des Falls. */
export function spieleZug(apiKey: string, fall: Fall, modul: CatalogModule, eingabe?: string): Promise<Zug> {
  return frage(apiKey, systemPrompt(fall.szenario, fall.stufe, modul), nachrichten(fall, eingabe), ZUG_SCHEMA, 'medium', parseZug);
}

export function werteAus(apiKey: string, fall: Fall, modul: CatalogModule): Promise<Abschluss> {
  const themenIds = [...new Set([...fall.szenario.topicIds, 'thema.pp.anamnese', 'thema.pp.diagnosen', 'thema.pp.ziele', 'thema.pp.massnahmen', 'thema.pp.evaluation', 'thema.beo.vitalzeichen', 'thema.beo.notfall', 'thema.pp.uebergabe'])]
    .filter((id) => modul.topics.some((t) => t.id === id));
  return frage(apiKey, systemPrompt(fall.szenario, fall.stufe, modul), nachrichten(fall, ABSCHLUSS_TEXT(themenIds)), ABSCHLUSS_SCHEMA, 'high', (t) => parseAbschluss(t, modul));
}
