// Prüfung einer Pflegeplanung per Code, ganz ohne KI. Läuft offline.
// Zwei Teile:
// 1. Struktur: die maschinell prüfbaren Regeln aus dem Pflege-Katalog (method: struktur) und einfache
//    Formulierungs-Heuristiken für die übrigen Regeln. Heuristiken erzeugen höchstens Warnungen.
// 2. Fallbezug: ob die wichtigen Informationen, Probleme, Ressourcen und Maßnahmen der Fallvorlage
//    vorkommen (Stichwortsuche wie im Übergabe-Trainer).
import { findeMuster, suchtext, vereinfache } from '../uebergabe/pruefung';
import type { Erwartung, ErwartetesProblem, PlanFall } from './faelle';
import { PFLICHT, SCHRITTE, SCHRITT_LABEL, type Plan, type Schritt } from './plan';

export type Schwere = 'fehler' | 'warnung' | 'hinweis';

export interface Befund {
  regelId: string;       // Katalog-Regel (regel.*) oder eigene Trainer-Regel (pp.*)
  schritt: Schritt;
  schwere: Schwere;
  text: string;
  ref?: string;          // ID von Problem, Ziel oder Maßnahme
}

export interface Treffer<T extends Erwartung = Erwartung> { erwartung: T; gefunden: boolean }

export interface SchrittErgebnis {
  schritt: Schritt;
  prozent: number;       // 0–100
  pflicht: boolean;
  bewertet: boolean;     // freiwilliger Schritt ohne Inhalt zählt nicht
  befunde: Befund[];
}

export interface Fallbezug {
  info: Treffer[];
  probleme: (Treffer<ErwartetesProblem> & { artPasst: boolean; massnahme: boolean })[];
  ressourcen: Treffer[];
}

export interface Pruefergebnis {
  prozent: number;
  schritte: SchrittErgebnis[];
  befunde: Befund[];
  fallbezug: Fallbezug | null;  // null beim eigenen Fall
}

/** Gewichte der Pflichtschritte für die Gesamtwertung. */
const GEWICHT: Record<Schritt, number> = { info: 15, probleme: 25, ziele: 20, massnahmen: 25, durchfuehrung: 0, evaluation: 15 };

// ---------- Formulierungs-Heuristiken ----------

const ROH = (s: string) => vereinfache(s).trim();

const E_EINLEITUNG = /(beeinflusst|aufgrund|bedingt|verursacht|infolge|wegen|durch|bei |nach |da |weil|ursache)/;
const RISIKO_WORT = /(gefahr|risiko|gefaehrd)/;
const MED_DIAGNOSE = /(diabetes|pneumonie|copd|demenz|alzheimer|schlaganfall|apoplex|insult|fraktur|\btep\b|gastroenteritis|herzinsuff|hypertonie|parkinson|karzinom|krebs|infarkt|mediainfarkt|norovir|hemiparese|neglect|dysphagie|arthrose|sepsis)/;
const PFLEGE_WORT = /(gefahr|risiko|beeintraecht|eingeschraenkt|einschraenk|defizit|mangel|fehlend|schmerz|angst|wissen|unfaehig|kann nicht|kann sich|selbstversorg|mobilitaet|veraendert|gestoert|stoerung|unsicher|erschwert|vermindert|verringert|ueberfordert)/;

/** Überprüfungszeitpunkt oder Zeitraum (regel.smart.termin). */
const TERMIN = /(\d|bis |bis$|innerhalb|taeglich|woechentlich|stuendlich|morgen|heute|entlassung|aufenthalt|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|ende der|naechste|schicht|jederzeit|dauerhaft|ab sofort|stets|bei jede|zu jede)/;
const MESSBAR = /(\d|kann |koennen|gibt an|aeussert|nennt|benennt|zeigt|fuehrt|traegt|trinkt|isst|geht|steht|sitzt|wendet|spritzt|misst|klingelt|ohne |selbststaendig|intakt|kein|keine|nicht|frei von|erreicht|hat )/;
const PFLEGEHANDLUNG = /^(pflege|pflegekraft|pflegeperson|pflegefach|wir |ich |mobilisation|mobilisier|lagerung|lager|durchfuehr|regelmaessig|unterstuetz|anleit|beratung|beraten|gabe|verabreich|kontroll|ueberwach|ermoeglich|foerder|sicherstell)/;
const PASSIV_PFLEGE = /(wird mobilisiert|wird gelagert|wird beraten|wird angeleitet|wird unterstuetzt|wird ueberwacht|erhaelt |bekommt )/;
// Ziel als Hauptwort einer Handlung („Schmerzmittelgabe …“, „Verbesserung der …“)
const NOMINAL = /^\S*(gabe|ung|kontrolle)(\s|$)/;
const HAEUFIGKEIT = /(\d|taeglich|stuendlich|morgens|mittags|abends|nachts|bei jede|vor jede|nach jede|zu jede|jede |immer|bei bedarf|schicht|woechentlich|mal |dauerhaft|kontinuierlich|bei der|beim |vor dem|nach dem|waehrend)/;
const WERTEND = /(aggressiv|uneinsichtig|unkooperativ|stur|faul|nervig|jammert|meckert|schwierig|bockig|zickig|frech|renitent|querulant|hysterisch|launisch|anstrengend|unmoeglich|boese)/;

// ---------- Punktekonto je Schritt ----------

class Konto {
  erreicht = 0; max = 0; befunde: Befund[] = [];
  constructor(private schritt: Schritt) {}
  pruefe(ok: boolean, gewicht: number, befund: Omit<Befund, 'schritt'>) {
    this.max += gewicht;
    if (ok) this.erreicht += gewicht;
    else this.befunde.push({ ...befund, schritt: this.schritt });
  }
  hinweis(befund: Omit<Befund, 'schritt'>) { this.befunde.push({ ...befund, schritt: this.schritt }); }
  get anteil() { return this.max ? this.erreicht / this.max : 0; }
}

function treffer<T extends Erwartung>(erwartungen: T[], text: string): Treffer<T>[] {
  const t = suchtext(vereinfache(text));
  return erwartungen.map((erwartung) => ({ erwartung, gefunden: findeMuster(t, erwartung.muster) >= 0 }));
}

/** Anteil gefundener Erwartungen, Pflicht zählt doppelt. 1, wenn es keine gibt. */
function abdeckung(t: Treffer[]): number {
  let max = 0; let ok = 0;
  for (const x of t) { const w = x.erwartung.pflicht ? 2 : 1; max += w; if (x.gefunden) ok += w; }
  return max ? ok / max : 1;
}

const leer = (s: string) => !s.trim();
const kurz = (s: string, n = 40) => (s.trim().length > n ? `${s.trim().slice(0, n - 1)}…` : s.trim());

// ---------- Prüfung ----------

export function pruefe(fall: PlanFall, plan: Plan): Pruefergebnis {
  const mitErwartung = fall.id !== 'eigen' && (fall.info.length > 0 || fall.probleme.length > 0);
  const probleme = plan.probleme.filter((p) => !leer(p.p) || !leer(p.e) || !leer(p.s) || !leer(p.r));
  const problemIds = new Set(probleme.map((p) => p.id));
  const ziele = plan.ziele.filter((z) => problemIds.has(z.problemId) && (!leer(z.text) || !leer(z.termin)));
  const zielIds = new Set(ziele.map((z) => z.id));
  const massnahmen = plan.massnahmen.filter((m) => zielIds.has(m.zielId) && [m.was, m.wie, m.wann, m.wer, m.begruendung].some((x) => !leer(x)));

  // --- 1. Informationssammlung
  const info = new Konto('info');
  const infoText = `${plan.subjektiv}\n${plan.objektiv}`;
  const infoTreffer = mitErwartung ? treffer(fall.info, infoText) : [];
  info.pruefe(!leer(plan.subjektiv), 1, { regelId: 'pp.info.subjektiv', schwere: 'warnung', text: 'Subjektive Angaben fehlen: Was sagt die Person selbst?' });
  info.pruefe(!leer(plan.objektiv), 1, { regelId: 'pp.info.objektiv', schwere: 'warnung', text: 'Objektive Angaben fehlen: Beobachtungen, Messwerte, Befunde.' });
  if (WERTEND.test(ROH(infoText))) info.hinweis({ regelId: 'regel.bericht.wertfrei', schwere: 'warnung', text: 'In der Informationssammlung stehen wertende Wörter. Beschreibe, was du beobachtest.' });
  const infoStruktur = info.anteil;
  const infoAbdeckung = abdeckung(infoTreffer);
  for (const t of infoTreffer.filter((x) => !x.gefunden && x.erwartung.pflicht)) {
    info.hinweis({ regelId: 'pp.fall.info', schwere: 'hinweis', text: `Im Fall steht noch: ${t.erwartung.text}` });
  }

  // --- 2. Probleme und Ressourcen (PESR)
  const pesr = new Konto('probleme');
  pesr.pruefe(probleme.length > 0, 3, { regelId: 'regel.pflegeplanung.durchgaengig', schwere: 'fehler', text: 'Noch kein Pflegeproblem formuliert.' });
  probleme.forEach((p, i) => {
    const name = `Problem ${i + 1}${leer(p.p) ? '' : ` („${kurz(p.p)}“)`}`;
    const P = ROH(p.p);
    pesr.pruefe(!leer(p.p), 2, { regelId: 'regel.pesr.vollstaendig', schwere: 'fehler', ref: p.id, text: `${name}: P (Problem) fehlt.` });
    pesr.pruefe(!leer(p.e), 2, { regelId: 'regel.pesr.vollstaendig', schwere: 'fehler', ref: p.id, text: `${name}: E (Einflussfaktoren, Ursache) fehlt.` });
    if (p.art === 'aktuell') pesr.pruefe(!leer(p.s), 2, { regelId: 'regel.pesr.vollstaendig', schwere: 'fehler', ref: p.id, text: `${name}: S (Symptome) fehlt. Ist es eigentlich eine Risikodiagnose?` });
    else if (!leer(p.s)) pesr.hinweis({ regelId: 'regel.pesr.risiko-ohne-s', schwere: 'hinweis', ref: p.id, text: `${name}: Risikodiagnosen haben keine Symptome, nur Risikofaktoren (gehören zu E).` });
    pesr.pruefe(!leer(p.r), 1, { regelId: 'regel.pesr.vollstaendig', schwere: 'warnung', ref: p.id, text: `${name}: R (Ressourcen) fehlt. Was kann die Person selbst, wer hilft?` });
    if (!leer(p.e) && !E_EINLEITUNG.test(ROH(p.e))) pesr.hinweis({ regelId: 'pp.pesr.e-formulierung', schwere: 'hinweis', ref: p.id, text: `${name}: E üblicherweise mit „beeinflusst durch …“ oder „aufgrund von …“ einleiten.` });
    if (P) {
      pesr.pruefe(!(MED_DIAGNOSE.test(P) && !PFLEGE_WORT.test(P)), 2, { regelId: 'regel.pesr.keine-med-diagnose', schwere: 'warnung', ref: p.id, text: `${name}: Klingt nach einer medizinischen Diagnose. Beschreibe die Folge für die Person (z. B. „Beeinträchtigte …“, „Gefahr von …“). Die Diagnose gehört eher zu E.` });
      if (p.art === 'risiko' && !RISIKO_WORT.test(P)) pesr.hinweis({ regelId: 'pp.pesr.risiko-titel', schwere: 'hinweis', ref: p.id, text: `${name}: Risikodiagnosen als „Gefahr von …“ oder „Risiko für …“ formulieren.` });
      if (p.art === 'aktuell' && RISIKO_WORT.test(P)) pesr.hinweis({ regelId: 'pp.pesr.risiko-titel', schwere: 'hinweis', ref: p.id, text: `${name}: Heißt „Gefahr“, ist aber als aktuelles Problem markiert. Als Risikodiagnose einstufen?` });
    }
  });
  const pesrStruktur = pesr.anteil;

  const alleP = probleme.map((p) => ({ p, t: suchtext(vereinfache(p.p)) }));
  const massnahmenText = suchtext(vereinfache(massnahmen.map((m) => [m.was, m.wie, m.wann, m.begruendung].join(' ')).join('\n')));
  const problemTreffer = mitErwartung ? fall.probleme.map((erwartung) => {
    const hit = alleP.find((x) => findeMuster(x.t, erwartung.muster) >= 0);
    return {
      erwartung, gefunden: !!hit,
      artPasst: !hit || hit.p.art === erwartung.art,
      massnahme: findeMuster(massnahmenText, erwartung.massnahmen.muster) >= 0,
    };
  }) : [];
  const ressourcenTreffer = mitErwartung ? treffer(fall.ressourcen, `${probleme.map((p) => p.r).join('\n')}\n${infoText}`) : [];
  for (const t of problemTreffer) {
    if (!t.gefunden && t.erwartung.pflicht) pesr.hinweis({ regelId: 'pp.fall.problem', schwere: 'hinweis', text: `Im Fall steckt noch ein wichtiges Problem: ${t.erwartung.text}.` });
    if (t.gefunden && !t.artPasst) pesr.hinweis({ regelId: 'pp.fall.art', schwere: 'hinweis', text: `„${t.erwartung.text}“ ist hier eher ${t.erwartung.art === 'risiko' ? 'eine Risikodiagnose' : 'ein aktuelles Problem'}.` });
  }

  // --- 3. Ziele (SMART)
  const zk = new Konto('ziele');
  zk.pruefe(ziele.length > 0, 3, { regelId: 'regel.pflegeplanung.durchgaengig', schwere: 'fehler', text: 'Noch kein Pflegeziel formuliert.' });
  probleme.forEach((p, i) => {
    zk.pruefe(ziele.some((z) => z.problemId === p.id && !leer(z.text)), 2, { regelId: 'regel.ziel-passt-zu-problem', schwere: 'fehler', ref: p.id, text: `Problem ${i + 1}${leer(p.p) ? '' : ` („${kurz(p.p)}“)`} hat noch kein Ziel.` });
  });
  ziele.forEach((z, i) => {
    const name = `Ziel ${i + 1}${leer(z.text) ? '' : ` („${kurz(z.text)}“)`}`;
    const T = ROH(z.text);
    zk.pruefe(!leer(z.text), 2, { regelId: 'regel.pflegeplanung.durchgaengig', schwere: 'fehler', ref: z.id, text: `${name}: Zieltext fehlt.` });
    zk.pruefe(!leer(z.termin) || TERMIN.test(T), 2, { regelId: 'regel.smart.termin', schwere: 'fehler', ref: z.id, text: `${name}: Überprüfungszeitpunkt oder Zeitraum fehlt (T in SMART).` });
    if (T) {
      zk.pruefe(MESSBAR.test(T), 1, { regelId: 'regel.smart.messbar', schwere: 'warnung', ref: z.id, text: `${name}: Woran erkennt man, dass das Ziel erreicht ist? Ein beobachtbares Kriterium oder einen Wert ergänzen.` });
      zk.pruefe(!PFLEGEHANDLUNG.test(T) && !PASSIV_PFLEGE.test(T) && !NOMINAL.test(T), 1, { regelId: 'regel.smart.patientenperspektive', schwere: 'warnung', ref: z.id, text: `${name}: Klingt nach einer Pflegehandlung. Ziele beschreiben, was die Person erreicht („Herr W. geht …“).` });
    }
  });

  // --- 4. Maßnahmen
  const mk = new Konto('massnahmen');
  mk.pruefe(massnahmen.length > 0, 3, { regelId: 'regel.pflegeplanung.durchgaengig', schwere: 'fehler', text: 'Noch keine Pflegemaßnahme geplant.' });
  ziele.forEach((z, i) => {
    mk.pruefe(massnahmen.some((m) => m.zielId === z.id), 2, { regelId: 'regel.ziel-passt-zu-problem', schwere: 'fehler', ref: z.id, text: `Ziel ${i + 1}${leer(z.text) ? '' : ` („${kurz(z.text)}“)`} hat noch keine Maßnahme.` });
  });
  massnahmen.forEach((m, i) => {
    const name = `Maßnahme ${i + 1}${leer(m.was) ? '' : ` („${kurz(m.was)}“)`}`;
    const fehlt = ([['was', m.was], ['wie', m.wie], ['wann/wie oft', m.wann], ['wer', m.wer]] as const).filter(([, v]) => leer(v)).map(([k]) => k);
    mk.pruefe(fehlt.length === 0, 3, { regelId: 'regel.massnahme.konkret', schwere: 'warnung', ref: m.id, text: `${name}: Es fehlt noch ${fehlt.join(', ')}.` });
    if (!leer(m.wann)) {
      const W = ROH(m.wann);
      mk.pruefe(HAEUFIGKEIT.test(W) && !/^regelmaessig\.?$/.test(W), 1, { regelId: 'regel.massnahme.konkret', schwere: 'hinweis', ref: m.id, text: `${name}: „${kurz(m.wann, 30)}“ ist ungenau. Wie oft genau, zu welchem Anlass?` });
    }
    mk.pruefe(!leer(m.begruendung), 1, { regelId: 'regel.massnahme.begruendet', schwere: 'warnung', ref: m.id, text: `${name}: Begründung fehlt (Bezug zum Ziel, Expertenstandard, Fachwissen).` });
  });
  const massStruktur = mk.anteil;
  const identifiziert = problemTreffer.filter((t) => t.gefunden);
  const massAbdeckung = identifiziert.length ? identifiziert.filter((t) => t.massnahme).length / identifiziert.length : 1;
  for (const t of identifiziert.filter((x) => !x.massnahme)) {
    mk.hinweis({ regelId: 'pp.fall.massnahme', schwere: 'hinweis', text: `Zu „${t.erwartung.text}“ passt z. B. noch: ${t.erwartung.massnahmen.text}.` });
  }

  // --- 5. Durchführung (freiwillig)
  const dk = new Konto('durchfuehrung');
  const mitBericht = !leer(plan.bericht);
  if (mitBericht) {
    const B = ROH(plan.bericht);
    dk.pruefe(!WERTEND.test(B), 2, { regelId: 'regel.bericht.wertfrei', schwere: 'warnung', text: 'Der Bericht enthält wertende Wörter (z. B. „uneinsichtig“, „aggressiv“). Beschreibe stattdessen, was du gesehen und gehört hast.' });
    dk.pruefe(/\d{1,2}[:.]\d{2}|\d{1,2} uhr|\d{1,2}\.\d{1,2}\./.test(B), 1, { regelId: 'pp.bericht.zeit', schwere: 'hinweis', text: 'Uhrzeit oder Datum fehlen im Bericht.' });
    dk.pruefe(B.split(/\s+/).length >= 12, 1, { regelId: 'pp.bericht.inhalt', schwere: 'hinweis', text: 'Sehr kurz: Beobachtung, Maßnahme und Wirkung gehören in den Bericht.' });
  }

  // --- 6. Evaluation
  const ek = new Konto('evaluation');
  ek.pruefe(ziele.length > 0, 2, { regelId: 'regel.pflegeplanung.durchgaengig', schwere: 'fehler', text: 'Ohne Ziele gibt es nichts zu evaluieren.' });
  ziele.forEach((z, i) => {
    const name = `Ziel ${i + 1}${leer(z.text) ? '' : ` („${kurz(z.text)}“)`}`;
    const e = plan.evaluation[z.id];
    ek.pruefe(!!e?.erreicht, 2, { regelId: 'pp.evaluation.status', schwere: 'fehler', ref: z.id, text: `${name}: Noch nicht bewertet (erreicht, teilweise, nicht erreicht).` });
    ek.pruefe(!!e && !leer(e.begruendung), 2, { regelId: 'pp.evaluation.begruendung', schwere: 'warnung', ref: z.id, text: `${name}: Woran erkennst du das? Beobachtung oder Wert aus dem Verlauf nennen.` });
    if (e && (e.erreicht === 'teilweise' || e.erreicht === 'nein')) {
      ek.pruefe(!leer(e.anpassung), 2, { regelId: 'pp.evaluation.anpassung', schwere: 'warnung', ref: z.id, text: `${name}: Nicht (ganz) erreicht. Wie passt du Ziel oder Maßnahmen an?` });
    }
  });

  // --- Durchgängigkeit (regel.pflegeplanung.durchgaengig): leere Pflichtschritte
  const leerSchritt: Record<Schritt, boolean> = {
    info: leer(plan.subjektiv) && leer(plan.objektiv), probleme: probleme.length === 0, ziele: ziele.length === 0,
    massnahmen: massnahmen.length === 0, durchfuehrung: !mitBericht, evaluation: ziele.every((z) => !plan.evaluation[z.id]?.erreicht),
  };

  const prozentVon = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 100);
  const anteil: Record<Schritt, number> = {
    info: leerSchritt.info ? 0 : mitErwartung ? 0.3 * infoStruktur + 0.7 * infoAbdeckung : infoStruktur,
    probleme: probleme.length === 0 ? 0 : mitErwartung ? 0.5 * pesrStruktur + 0.35 * abdeckung(problemTreffer) + 0.15 * abdeckung(ressourcenTreffer) : pesrStruktur,
    ziele: zk.anteil,
    massnahmen: massnahmen.length === 0 ? 0 : mitErwartung ? 0.7 * massStruktur + 0.3 * massAbdeckung : massStruktur,
    durchfuehrung: dk.anteil,
    evaluation: leerSchritt.evaluation ? 0 : ek.anteil,
  };
  const konten: Record<Schritt, Konto> = { info, probleme: pesr, ziele: zk, massnahmen: mk, durchfuehrung: dk, evaluation: ek };

  const schritte: SchrittErgebnis[] = SCHRITTE.map((s) => {
    const pflicht = PFLICHT.includes(s);
    const befunde = [...konten[s].befunde];
    if (pflicht && leerSchritt[s] && !befunde.some((b) => b.regelId === 'regel.pflegeplanung.durchgaengig')) {
      befunde.unshift({ regelId: 'regel.pflegeplanung.durchgaengig', schritt: s, schwere: 'fehler', text: `Schritt „${SCHRITT_LABEL[s]}“ fehlt noch.` });
    }
    return { schritt: s, pflicht, bewertet: pflicht || !leerSchritt[s], prozent: prozentVon(anteil[s]), befunde };
  });

  let summe = 0; let gewichte = 0;
  for (const s of schritte) { if (!s.pflicht) continue; summe += s.prozent * GEWICHT[s.schritt]; gewichte += GEWICHT[s.schritt]; }

  return {
    prozent: gewichte ? Math.round(summe / gewichte) : 0,
    schritte,
    befunde: schritte.flatMap((s) => s.befunde),
    fallbezug: mitErwartung ? { info: infoTreffer, probleme: problemTreffer, ressourcen: ressourcenTreffer } : null,
  };
}

/** Lernplan-Themen je Schritt (siehe 30-themen.yaml). */
export const SCHRITT_THEMA: Partial<Record<Schritt, string>> = {
  info: 'thema.pp.anamnese', probleme: 'thema.pp.diagnosen', ziele: 'thema.pp.ziele', massnahmen: 'thema.pp.massnahmen', evaluation: 'thema.pp.evaluation',
};
