// Karten aus Fachmodul und eigenem Material bauen. Rein, ohne DB.
// Glossar- und Katalogkarten werden bei jedem Öffnen neu erzeugt (stabile IDs, nur der Lernstand wird
// gespeichert). Karten aus Zusammenfassungen und Prüfungsfragen übernimmt man bewusst und speichert sie.

import type { Claim, DomainModule, ID, SourceChunk, Summary } from '../../core/types';
import type { CatalogGlossaryEntry, CatalogModule, DrugProfile, Reference } from '../../modules/catalog-types';
import { maskiere } from '../duell/duell';
import type { FragenSatz } from '../zusammenfasser/typen';
import type { Karte, KartenBeleg, KartenConfig, Richtung } from './typen';

function fachVon(modul: Pick<DomainModule, 'topics'>) {
  const m = new Map(modul.topics.map((t) => [t.id, t.subjectId]));
  return (topicIds: ID[]) => [...new Set(topicIds.map((t) => m.get(t)).filter((f): f is ID => !!f))];
}

/** Glossar: Begriff → Definition, Definition → Begriff (eintippen) und Abkürzung → Begriff. */
export function ausGlossar(modul: Pick<DomainModule, 'glossary' | 'topics'>, richtungen: Richtung[]): Karte[] {
  const faecher = fachVon(modul);
  const out: Karte[] = [];
  (modul.glossary as CatalogGlossaryEntry[]).forEach((g, i) => {
    const id = g.id ?? `gl.${i}`;
    const topicIds = g.topicIds ?? [];
    const basis = { quelle: 'glossar' as const, topicIds, subjectIds: faecher(topicIds), ref: id };
    const titel = g.abbreviation && g.abbreviation !== g.term ? `${g.term} (${g.abbreviation})` : g.term;
    if (richtungen.includes('vorwaerts')) {
      out.push({ ...basis, id: `gl:${id}`, art: 'Begriff → Definition', vorne: titel, hinten: g.definition });
    }
    if (richtungen.includes('rueckwaerts')) {
      const vorne = maskiere(g.definition, [g.term, g.abbreviation, ...(g.synonyms ?? [])]);
      out.push({
        ...basis, id: `glr:${id}`, art: 'Definition → Begriff', vorne, hinten: titel, eingabe: true,
        alternativen: [g.abbreviation, ...(g.synonyms ?? [])].filter((x): x is string => !!x),
      });
    }
    if (richtungen.includes('abkuerzung') && g.abbreviation && g.abbreviation !== g.term) {
      out.push({ ...basis, id: `gla:${id}`, art: 'Abkürzung → Bedeutung', vorne: g.abbreviation, hinten: g.term });
    }
  });
  return out;
}

const REF_FRAGE: Record<Reference['kind'], (n: string) => string> = {
  norm: (n) => `Was regelt ${n}?`,
  standard: (n) => `Worum geht es im ${n}?`,
  leitlinie: (n) => `Worum geht es in der Leitlinie ${n}?`,
  assessment: (n) => `Wofür wird ${n} eingesetzt und was wird erfasst?`,
  modell: (n) => `Was beschreibt ${n}?`,
  klassifikation: (n) => `Was ordnet ${n}?`,
};
const REF_ART: Record<Reference['kind'], string> = {
  norm: 'Gesetz/Verordnung', standard: 'Expertenstandard', leitlinie: 'Leitlinie', assessment: 'Assessment', modell: 'Modell', klassifikation: 'Klassifikation',
};

/** Themenkatalog: Normen, Standards und Assessments, Aufgabenformate mit ihren Teilen, Operatoren. */
export function ausKatalog(modul: Pick<CatalogModule, 'topics'> & Partial<Pick<CatalogModule, 'references' | 'taskFormats' | 'operators'>>): Karte[] {
  const faecher = fachVon(modul);
  const themenMit = (key: 'referenceIds' | 'taskFormatIds', id: ID) => modul.topics.filter((t) => t[key]?.includes(id)).map((t) => t.id);
  const out: Karte[] = [];
  for (const r of modul.references ?? []) {
    if (!r.details) continue;
    const topicIds = themenMit('referenceIds', r.id);
    out.push({ id: `kat:${r.id}`, quelle: 'katalog', art: REF_ART[r.kind], vorne: REF_FRAGE[r.kind](r.name), hinten: r.details, topicIds, subjectIds: faecher(topicIds), ref: r.id });
  }
  for (const f of modul.taskFormats ?? []) {
    const teile = f.parts?.length ? f.parts.map((p) => `${p.key}: ${p.label}${p.required ? '' : ' (optional)'}`) : f.requiredParts;
    if (!teile.length) continue;
    const topicIds = themenMit('taskFormatIds', f.id);
    out.push({
      id: `kat:${f.id}`, quelle: 'katalog', art: 'Aufgabenformat', vorne: `Aus welchen Teilen besteht: ${f.name}?`,
      hinten: f.description, liste: teile, topicIds, subjectIds: faecher(topicIds), ref: f.id,
    });
  }
  for (const o of modul.operators ?? []) {
    out.push({
      id: `kat:${o.id}`, quelle: 'katalog', art: `Operator, Anforderungsbereich ${'I'.repeat(o.afb)}`,
      vorne: `Was erwartet der Operator „${o.name}“?`, hinten: o.expects, topicIds: [], subjectIds: [], ref: o.id,
    });
  }
  return out;
}

/** Name eines Wirkstoffs mit Abkürzung, z. B. „Acetylsalicylsäure (ASS)“. */
export const wirkstoffName = (d: Pick<DrugProfile, 'substance' | 'abbreviation'>) =>
  d.abbreviation && !d.substance.includes(d.abbreviation) ? `${d.substance} (${d.abbreviation})` : d.substance;

/** Zusätze in Klammern, die keine eigene Antwort sind (Darreichung, Unterart). */
const KEIN_SYNONYM = new Set(['inhalativ', 'unfraktioniert', 'pflaster']);

/** Weitere richtige Antworten beim Eintippen: Synonyme in Klammern, Hauptwirkstoff einer Kombination, Abkürzung. */
export function wirkstoffAntworten(d: Pick<DrugProfile, 'substance' | 'abbreviation'>): string[] {
  const klammer = /\(([^)]*)\)/.exec(d.substance)?.[1]?.split(',').map((x) => x.trim()) ?? [];
  const kombination = d.substance.includes(' mit ') ? [d.substance.split(' mit ')[0]!] : [];
  return [...klammer.filter((x) => x && !KEIN_SYNONYM.has(x.toLowerCase())), ...kombination, d.abbreviation]
    .filter((x): x is string => !!x);
}

/**
 * Medikamenten-Steckbriefe: je Wirkstoff Gruppe und Wirkprinzip, Anwendung, Nebenwirkungen,
 * Pflegerelevanz, dazu Antidot und Handelsname → Wirkstoff (eintippen), wo vorhanden.
 * Quellen und Prüfstatus wandern mit auf die Rückseite.
 */
export function ausSteckbriefen(modul: Pick<CatalogModule, 'topics'> & Partial<Pick<CatalogModule, 'drugProfiles'>>): Karte[] {
  const faecher = fachVon(modul);
  const out: Karte[] = [];
  for (const d of modul.drugProfiles ?? []) {
    const name = wirkstoffName(d);
    const basis = {
      quelle: 'arzneimittel' as const, topicIds: d.topicIds, subjectIds: faecher(d.topicIds), ref: d.id,
      quellen: d.sources, ungeprueft: d.pruefstatus !== 'geprueft',
    };
    const karte = (teil: string, art: string, vorne: string, rest: Partial<Karte>) => out.push({ ...basis, id: `arz:${d.id}:${teil}`, art, vorne, hinten: '', ...rest });
    karte('wirkung', 'Wirkstoff → Gruppe und Wirkung', `${name}: Zu welcher Gruppe gehört es und wie wirkt es?`, { hinten: `${d.drugClass}. ${d.mechanism}` });
    karte('anwendung', 'Wirkstoff → Anwendung', `Wofür wird ${name} eingesetzt?`, { liste: d.indications });
    karte('nebenwirkungen', 'Wirkstoff → Nebenwirkungen', `Welche Nebenwirkungen von ${name} musst du kennen?`, {
      liste: d.adverseEffects, hinten: d.contraindications?.length ? `Nicht geben bei (Auswahl): ${d.contraindications.join('; ')}.` : '',
    });
    karte('pflege', 'Wirkstoff → Pflegerelevanz', `${name}: Worauf achtest du in der Pflege?`, { liste: d.nursing, hinten: d.mnemonic ?? '' });
    if (d.antidote) karte('antidot', 'Wirkstoff → Antidot', `Was ist das Gegenmittel (Antidot) bei ${name}?`, { hinten: d.antidote });
    const handel = d.brandNames ?? [];
    if (handel.length) {
      karte('handelsname', 'Handelsname → Wirkstoff', `Welcher Wirkstoff steckt in ${handel.join(' bzw. ')}?`, {
        hinten: d.substance.replace(/\s*\(.*\)$/, ''), eingabe: true, alternativen: wirkstoffAntworten(d),
      });
    }
  }
  return out;
}

/** Aktive Karten aus dem Fachmodul nach den Stapel-Einstellungen. Karten ohne Fach (Operatoren) gelten für alle. */
export function modulKarten(modul: CatalogModule, config: Pick<KartenConfig, 'faecher' | 'richtungen' | 'katalog'> & Partial<Pick<KartenConfig, 'arzneimittel'>>): Karte[] {
  const alle = [
    ...ausGlossar(modul, config.richtungen), ...(config.katalog ? ausKatalog(modul) : []),
    ...(config.arzneimittel !== false ? ausSteckbriefen(modul) : []),
  ];
  if (!config.faecher.length) return alle;
  const f = new Set(config.faecher);
  return alle.filter((k) => !k.subjectIds.length || k.subjectIds.some((s) => f.has(s)));
}

// ---------------------------------------------------------------- eigenes Material

const MAX_PUNKTE = 5;
/** Nur Aussagen, die belegt sind oder als Lernhilfe gekennzeichnet; Lücken, Rückfragen, Widersprüche nicht. */
function lernbar(c: Claim): boolean {
  if (c.kind && ['struktur', 'fehlt', 'rueckfrage', 'widerspruch', 'unleserlich'].includes(c.kind)) return false;
  if (c.status === 'belegt') return true;
  return c.isSupplementary && (c.kind === 'lernhilfe' || c.kind === 'ergaenzung') && c.status !== 'widerspruch';
}

function belegeVon(claims: Claim[]): KartenBeleg[] {
  const seen = new Set<string>();
  const out: KartenBeleg[] = [];
  for (const c of claims) for (const z of c.citations) {
    const key = `${z.documentId}:${z.page}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ documentId: z.documentId, page: z.page, printedPage: z.printedPage, quote: z.quote });
  }
  return out.slice(0, 4);
}

const DEFINITION = [
  /^unter (?:einer |einem |einen |dem |der |den )?(.{2,60}?) versteht man\b/i,
  /^(?:ein |eine |der |die |das )?(.{2,60}?) (?:ist|sind|bezeichnet|bedeutet|meint|beschreibt) /i,
];

/** Fachbegriff aus einer Definitionsaussage („X ist …“, „Unter X versteht man …“). */
export function definitionsBegriff(text: string): string | undefined {
  for (const re of DEFINITION) {
    const m = re.exec(text.trim());
    if (m?.[1] && !/[,.;:]/.test(m[1]) && m[1].split(/\s+/).length <= 6) return m[1];
  }
  return undefined;
}

/**
 * Kartenvorschläge aus einer Zusammenfassung:
 * - je Gliederungsabschnitt eine Karte „Überschrift → Kernaussagen“ (bei vielen Aussagen in Teilen),
 * - je Definitionsaussage eine Karte „Was ist X?“.
 * Die Belege (Dokument, Seite) wandern mit, damit man auf der Rückseite nachschlagen kann.
 */
export function ausZusammenfassung(summary: Summary, topicSubject: (topicIds: ID[]) => ID[] = () => []): Karte[] {
  const claims = new Map(summary.claims.map((c) => [c.id, c]));
  const basis = { quelle: 'zusammenfassung' as const, topicIds: summary.topicIds, subjectIds: topicSubject(summary.topicIds), ref: summary.id };
  const out: Karte[] = [];
  const genutzt = new Set<ID>();
  const titel = new Map((summary.blocks ?? []).map((b) => [b.id, b.title]));
  const eltern = new Map<ID, ID>();
  for (const b of summary.blocks ?? []) for (const c of b.children ?? []) eltern.set(c, b.id);
  const pfad = (id: ID): string => {
    const teile: string[] = [];
    for (let cur: ID | undefined = id; cur; cur = eltern.get(cur)) { const t = titel.get(cur); if (t) teile.unshift(t); }
    return teile.join(' › ');
  };

  for (const b of summary.blocks ?? []) {
    const cs = b.claimIds.map((id) => claims.get(id)).filter((c): c is Claim => !!c && lernbar(c));
    if (!cs.length) continue;
    const ueberschrift = pfad(b.id);
    if (!ueberschrift) continue;
    cs.forEach((c) => genutzt.add(c.id));
    const teile = Math.ceil(cs.length / MAX_PUNKTE);
    for (let i = 0; i < teile; i++) {
      const stueck = cs.slice(i * MAX_PUNKTE, (i + 1) * MAX_PUNKTE);
      out.push({
        ...basis, id: `sum:${summary.id}:${b.id}${teile > 1 ? `:${i + 1}` : ''}`,
        art: b.type === 'aufgabe' ? 'Aufgabe → Lösung' : 'Abschnitt → Kernaussagen',
        vorne: `${ueberschrift}${teile > 1 ? ` (Teil ${i + 1} von ${teile})` : ''}: Was sind die Kernaussagen?`,
        hinten: '', liste: stueck.map((c) => c.text), belege: belegeVon(stueck),
      });
    }
  }
  // Ohne Gliederung: Aussagen in Fünfergruppen unter dem Namen der Zusammenfassung
  const rest = summary.claims.filter((c) => !genutzt.has(c.id) && lernbar(c) && c.kind !== 'definition');
  if (!summary.blocks?.length) {
    for (let i = 0; i * MAX_PUNKTE < rest.length; i++) {
      const stueck = rest.slice(i * MAX_PUNKTE, (i + 1) * MAX_PUNKTE);
      out.push({ ...basis, id: `sum:${summary.id}:_:${i + 1}`, art: 'Kernaussagen', vorne: `Kernaussagen, Teil ${i + 1}: Was gehört dazu?`, hinten: '', liste: stueck.map((c) => c.text), belege: belegeVon(stueck) });
    }
  }
  for (const c of summary.claims) {
    if (c.kind !== 'definition' || !lernbar(c)) continue;
    const begriff = definitionsBegriff(c.text);
    if (!begriff) continue;
    out.push({ ...basis, id: `def:${summary.id}:${c.id}`, art: 'Definition', vorne: `Was ist ${begriff}?`, hinten: c.text, belege: belegeVon([c]) });
  }
  return out;
}

/** Prüfungsfragen aus dem Zusammenfasser: Frage → Musterlösung (bei Multiple Choice mit den Antwortmöglichkeiten). */
export function ausFragenSatz(satz: FragenSatz, chunks: Map<ID, SourceChunk> = new Map(), topicSubject: (topicIds: ID[]) => ID[] = () => []): Karte[] {
  return satz.fragen.map((f) => {
    const mc = f.optionen?.length ? f.optionen : undefined;
    const belege: KartenBeleg[] = f.belege.flatMap((b) => {
      const c = chunks.get(b.chunkId);
      return c ? [{ documentId: c.documentId, page: c.page, printedPage: c.printedPage, quote: b.zitat }] : [];
    });
    return {
      id: `pf:${satz.id}:${f.id}`, quelle: 'pruefungsfragen' as const, art: `Prüfungsfrage · ${f.operator}`,
      vorne: mc ? `${f.frage}\n\n${mc.map((o, i) => `${String.fromCharCode(65 + i)}) ${o.text}`).join('\n')}` : f.frage,
      hinten: f.musterloesung,
      liste: mc ? mc.map((o, i) => `${String.fromCharCode(65 + i)}) ${o.richtig ? 'richtig' : 'falsch'}: ${o.begruendung}`) : undefined,
      topicIds: [f.topicId], subjectIds: topicSubject([f.topicId]), belege, ref: satz.id,
    };
  });
}

/** Vorschläge passend zur Art der Zusammenfassung; Vergleiche ergeben keine Karten. */
export function vorschlaege(summary: Summary, chunks?: Map<ID, SourceChunk>, topicSubject?: (topicIds: ID[]) => ID[]): Karte[] {
  if (summary.mode === 'pruefung' && 'fragen' in summary) return ausFragenSatz(summary as FragenSatz, chunks, topicSubject);
  if (summary.mode === 'vergleich') return [];
  return ausZusammenfassung(summary, topicSubject);
}

// ---------------------------------------------------------------- Eingabe prüfen

/** Kleinschreibung, Umlaute ausgeschrieben, ohne Satzzeichen und Leerraum. */
export function normalisiere(s: string): string {
  return s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]/g, '');
}

function abstand(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length]!;
}

export type EingabeErgebnis = 'richtig' | 'tippfehler' | 'falsch' | 'leer';

/** Eingetippte Antwort mit Begriff (ohne Klammerzusatz), Abkürzung und Synonymen vergleichen. */
export function pruefeEingabe(eingabe: string, karte: Pick<Karte, 'hinten' | 'alternativen'>): EingabeErgebnis {
  const e = normalisiere(eingabe);
  if (!e) return 'leer';
  const ziele = [karte.hinten, ...(karte.alternativen ?? [])].map(normalisiere).filter(Boolean);
  if (ziele.includes(e)) return 'richtig';
  const toleranz = (n: number) => (n >= 10 ? 2 : n >= 5 ? 1 : 0);
  if (ziele.some((z) => abstand(e, z) <= toleranz(z.length))) return 'tippfehler';
  return 'falsch';
}

/** Bewertungsvorschlag nach dem Eintippen. */
export const VORSCHLAG: Record<Exclude<EingabeErgebnis, 'leer'>, 1 | 2 | 3> = { richtig: 3, tippfehler: 2, falsch: 1 };
