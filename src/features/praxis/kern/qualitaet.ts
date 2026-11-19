// Qualitätsraster je Fall (Audit P20, FALLPLAN-CE.md Abschnitt 3): was sich am Fall selbst prüfen lässt.
// Rein; der Test qualitaet.test.ts prüft alle Kernfälle, `RASTER_BERICHT=<pfad>.md` schreibt den Bericht.
// Nicht maschinell prüfbar (bleibt fachliche Prüfung): fachliche Richtigkeit, Screenshots 390 px, Tiefe passend zum Drittel.

import type { Bedingung, FallV2 } from './typen';

const VITAL: readonly string[] = ['rrSys', 'rrDia', 'hf', 'af', 'spo2', 'temp', 'bz', 'map'];

export interface RasterPunkt { id: string; text: string; ok: boolean; hinweis?: string }


/** Kommt in der Bedingung (beliebig tief) ein Schlüssel vor? */
function enthaelt(b: Bedingung | undefined, schluessel: string): boolean {
  return !!b && JSON.stringify(b).includes(`"${schluessel}"`);
}

/** Dauer je Drittel laut Fallplan: 1. Drittel 8–12, 2. Drittel 10–15, 3. Drittel 15–25 Minuten (grob, nur Hinweis). */
function dauerPasst(f: FallV2): boolean {
  const [von, bis] = f.dauerMin;
  const ab = f.lehrplan?.abschnitt ?? [];
  if (ab.includes('ad3') && !ab.includes('ad12')) return bis >= 15 && von <= 25;
  return von <= 15 && bis >= 8;
}

export function qualitaetsraster(f: FallV2, weiterlernen: ReadonlySet<string>): RasterPunkt[] {
  const gegenueber = new Set(f.gespraech.map((g) => g.an).filter((a) => a !== 'aerztin'));
  // Messbefunde (mit `zeigt`) nennen den gemessenen Wert über {platzhalter} aus dem Modell, nicht als feste Zahl.
  // Vorwerte zum Vergleich („sonst um 140/85“) sind erlaubt.
  const zahlenInBefunden = f.befunde.flatMap((b) => b.varianten.filter((v) => (v.zeigt ?? []).some((k) => VITAL.includes(k)) && !/\{[a-zA-Z0-9]+\}/.test(v.text)).map(() => b.massnahme));
  const musterAbschluss = f.pruefwege.muster.find((e) => e.art === 'abschluss');
  const punkte: RasterPunkt[] = [
    { id: 'lehrplan', text: 'CE, Drittel und Themen im Schema', ok: !!f.lehrplan?.ce.length && !!f.lehrplan.abschnitt.length && !!f.lehrplan.themen?.length },
    { id: 'kompetenzen', text: 'Kompetenzen (PflAPrV) zugeordnet', ok: !!f.lehrplan?.kompetenzen?.length },
    { id: 'lernziele', text: '3–5 Lernziele', ok: f.lernziele.length >= 3 && f.lernziele.length <= 5, hinweis: `${f.lernziele.length} Lernziele` },
    // Fassung und Aktualität der Quellen prüft kern/quellen.test.ts gegen das Quellenregister.
    { id: 'quellen', text: 'mindestens zwei Quellen', ok: f.quellen.length >= 2 },
    { id: 'akte', text: 'Akte mit Medikationsplan, Vorwerten und Pflegebericht', ok: !!f.akte && f.akte.medikation.length > 0 && !!f.akte.vorwerte?.length && !!f.akte.pflegebericht?.length },
    { id: 'gegenueber', text: 'mindestens zwei Gesprächspartner außer der Ärztin', ok: gegenueber.size >= 2, hinweis: [...gegenueber].join(', ') },
    { id: 'rueckauftrag', text: 'Rückfrage oder Rückauftrag der Ärztin', ok: f.arzt.regeln.some((r) => !!r.rueckfrage) || !!f.arzt.auftraege?.length },
    { id: 'grenzpunkt', text: 'Remonstrations- oder Grenzpunkt', ok: f.anordnungen.some((a) => !!a.fehlerhaft) || !!f.pruefwege.grenze },
    { id: 'entscheidung', text: 'Entscheidungsereignis', ok: f.ereignisse.some((e) => !!e.entscheidung?.length) },
    { id: 'komplikation', text: 'Komplikation bei Unterlassung', ok: !!f.pruefwege.unterlassung && (f.ereignisse.some((e) => e.art === 'komplikation' || !!e.treiber?.length) || f.bewertung.fehler.some((x) => !!x.folge) || f.start.treiber.length > 0) },
    { id: 'platzhalter', text: 'Messwerte in Befunden nur als Platzhalter', ok: zahlenInBefunden.length === 0, hinweis: zahlenInBefunden.join(', ') || undefined },
    { id: 'doku', text: 'Dokumentation als Pflichthandlung', ok: f.bewertung.pflicht.some((p) => enthaelt(p.erfuellt, 'dokumentiert') || JSON.stringify(p.erfuellt).includes('"pflegebericht"')) },
    { id: 'pflegebedarf', text: 'Pflegebedarf und Leitfaden', ok: f.pflegebedarf.probleme.some((p) => p.richtig) && f.pflegebedarf.ziele.some((z) => z.richtig) && f.leitfaden.length >= 2 },
    { id: 'weiterlernen', text: 'Weiterlernen-Eintrag', ok: weiterlernen.has(f.id) },
    { id: 'pruefwege', text: 'Prüfwege: Muster mit SBAR-Abschluss, Unterlassung, Grenzweg', ok: !!musterAbschluss && musterAbschluss.art === 'abschluss' && !!musterAbschluss.sbar?.length && !!f.pruefwege.unterlassung && !!f.pruefwege.grenze },
    { id: 'dauer', text: 'Dauer passt zum Drittel (Fallplan Abschnitt 2)', ok: dauerPasst(f), hinweis: `${f.dauerMin[0]}–${f.dauerMin[1]} Min.` },
  ];
  return punkte;
}

/** Markdown-Bericht für die fachliche Abnahme. */
export function rasterBericht(faelle: readonly FallV2[], weiterlernen: ReadonlySet<string>, datum: string): string {
  const zeilen = faelle.map((f) => ({ f, r: qualitaetsraster(f, weiterlernen) }));
  const kopf = zeilen[0]?.r.map((p) => p.id) ?? [];
  const md = [
    `# Qualitätsraster Praxissimulator (neuer Kern), Stand ${datum}`,
    '',
    'Automatisch aus den Falldaten (src/features/praxis/kern/qualitaet.ts). ✓ erfüllt, ✗ fehlt. Fachliche Richtigkeit, Screenshots und Tiefe je Drittel prüft die Lehrperson.',
    '',
    `| Fall | ${kopf.join(' | ')} |`,
    `|---|${kopf.map(() => ':-:').join('|')}|`,
    ...zeilen.map(({ f, r }) => `| ${f.id} (v${f.version}, ${f.freigabe.status}) | ${r.map((p) => (p.ok ? '✓' : '✗')).join(' | ')} |`),
    '',
    '## Was fehlt',
    '',
    ...zeilen.flatMap(({ f, r }) => {
      const offen = r.filter((p) => !p.ok);
      return offen.length ? [`- **${f.id}**: ${offen.map((p) => p.text + (p.hinweis ? ` (${p.hinweis})` : '')).join('; ')}`] : [];
    }),
    '',
    '## Legende',
    '',
    ...(zeilen[0]?.r.map((p) => `- \`${p.id}\`: ${p.text}`) ?? []),
  ];
  return md.join('\n') + '\n';
}
