// Quellen des Schnellsuchers. Jede Quelle wird auf SuchDok abgebildet; Inhalte werden nur gelesen, nie kopiert.
// - DNQP-Daten (src/features/dnqp, gepflegt vom Expertenstandards-Lernmodul): Standards, Kriterien S/P/E, Kernaussagen
// - Katalog des Fachmoduls: Referenzen es.* (Name, Fassung), Themen, Glossar
// - Expertenstandards-Trainer: Aufgaben mit Lösung, Begründung und Vertiefung, Kurzwissen je Bereich
// - Assessment-Instrumente (Braden, Norton, NRS, BESD, MNA, Tinetti, TUG …)

import type { CatalogModule, Reference } from '../../modules/catalog-types';
import type { Aufgabe } from '../quiz/quiz';
import type { Instrument } from '../assessment/instrumente';
import type { Ebene, SuchDok, SynonymGruppen } from './suchkern';

// ---------------------------------------------------------------- DNQP-Daten (Form wie src/features/dnqp/typen.ts)

export interface DnqpKriterium {
  /** Anker im Standard, z. B. 'k3'. */
  id: string;
  nr: number;
  thema: string;
  struktur: string[];
  prozess: string[];
  ergebnis: string[];
  stichworte?: string[];
}

export interface DnqpStandard {
  id: string;
  titel: string;
  kurztitel: string;
  synonyme?: string[];
  fassungen?: Array<{ jahr: number; art: string }>;
  zielsetzung?: string;
  begruendung?: string;
  kriterien: DnqpKriterium[];
  kernaussagen?: string[];
  themaIds?: string[];
}

export const DNQP_PFAD = '/lernen/dnqp';

export function dnqpLink(standardId: string, kriterium?: string): string {
  const q = new URLSearchParams({ standard: standardId });
  if (kriterium) q.set('kriterium', kriterium);
  return `${DNQP_PFAD}?${q}`;
}

const EBENEN: Array<[Ebene, 'struktur' | 'prozess' | 'ergebnis', string]> = [['S', 'struktur', 'Struktur'], ['P', 'prozess', 'Prozess'], ['E', 'ergebnis', 'Ergebnis']];

/** Fassung als Text, z. B. „Aktualisierung 2022“. */
export function fassungText(s: DnqpStandard): string | undefined {
  const f = [...(s.fassungen ?? [])].sort((a, b) => b.jahr - a.jahr)[0];
  return f ? `${f.art} ${f.jahr}` : undefined;
}

export function ausDnqp(standards: DnqpStandard[]): SuchDok[] {
  const out: SuchDok[] = [];
  for (const s of standards) {
    const fassung = fassungText(s);
    out.push({
      id: `dnqp:${s.id}`, art: 'standard', titel: s.titel, standardIds: [s.id],
      pfad: ['Expertenstandard', fassung].filter(Boolean).join(' · '),
      text: [s.zielsetzung, s.begruendung].filter(Boolean).join(' '),
      stichworte: [s.kurztitel, ...(s.synonyme ?? [])], link: dnqpLink(s.id),
      details: [
        ...(s.zielsetzung ? [{ label: 'Zielsetzung', text: s.zielsetzung }] : []),
        ...(s.begruendung ? [{ label: 'Begründung', text: s.begruendung }] : []),
        ...(fassung ? [{ label: 'Fassung', text: fassung }] : []),
      ],
    });
    for (const k of s.kriterien) {
      for (const [ebene, feld, name] of EBENEN) {
        const aussagen = k[feld];
        if (!aussagen.length) continue;
        out.push({
          id: `${s.id}:${k.id}:${ebene.toLowerCase()}`, art: 'kriterium', titel: `${ebene}${k.nr} · ${k.thema}`,
          pfad: `${s.kurztitel} · ${name}`, text: aussagen.join(' '), standardIds: [s.id], ebene, kriterium: k.nr,
          stichworte: k.stichworte, link: dnqpLink(s.id, k.id),
          // Die beiden anderen Ebenen desselben Kriteriums, damit S, P und E zusammen lesbar sind
          details: EBENEN.filter(([e]) => e !== ebene && k[EBENEN.find((x) => x[0] === e)![1]].length)
            .map(([e, f, n]) => ({ label: `${n} (${e}${k.nr})`, text: k[f].join(' ') })),
        });
      }
    }
    (s.kernaussagen ?? []).forEach((text, i) => out.push({
      id: `${s.id}:kern${i + 1}`, art: 'kernaussage', titel: kurzerTitel(text), text, standardIds: [s.id],
      pfad: `${s.kurztitel} · Kernaussage`, link: dnqpLink(s.id),
    }));
  }
  return out;
}

// ---------------------------------------------------------------- Katalog

/** „Expertenstandard Sturzprophylaxe in der Pflege“ → „Sturzprophylaxe“. */
export function kurzname(name: string): string {
  return name.replace(/^Expertenstandard\s+/i, '').replace(/\s+in der Pflege$/i, '').trim();
}

export interface StandardInfo { id: string; name: string; kurz: string; details?: string; url?: string; ungeprueft: boolean }

/** Alle Standards des Fachmoduls (Referenzen der Art „standard“). DNQP-Daten ergänzen Titel und Fassung. */
export function standardsAus(modul: CatalogModule, dnqp: DnqpStandard[] = []): StandardInfo[] {
  const ausKatalog = (modul.references ?? []).filter((r) => r.kind === 'standard');
  const ids = [...new Set([...ausKatalog.map((r) => r.id), ...dnqp.map((s) => s.id)])];
  return ids.map((id) => {
    const r = ausKatalog.find((x) => x.id === id);
    const d = dnqp.find((x) => x.id === id);
    const name = d?.titel ?? r?.name ?? id;
    return { id, name, kurz: d?.kurztitel ?? kurzname(name), details: (d && fassungText(d)) ?? r?.details, url: r?.url, ungeprueft: r?.pruefstatus === 'ungeprueft' };
  });
}

/** Thema → Standards, die es im Katalog nennt. */
export function themaZuStandards(modul: CatalogModule): Map<string, string[]> {
  const ids = new Set((modul.references ?? []).filter((r) => r.kind === 'standard').map((r) => r.id));
  const out = new Map<string, string[]>();
  for (const t of modul.topics) {
    const es = (t.referenceIds ?? []).filter((r) => ids.has(r));
    if (es.length) out.set(t.id, es);
  }
  return out;
}

/** Standard-Einträge aus dem Katalog, nur für Standards ohne DNQP-Daten. */
export function ausKatalogStandards(modul: CatalogModule, ohne: Set<string>): SuchDok[] {
  const themen = themaZuStandards(modul);
  return (modul.references ?? []).filter((r: Reference) => r.kind === 'standard' && !ohne.has(r.id)).map((r) => {
    const verknuepft = modul.topics.filter((t) => themen.get(t.id)?.includes(r.id) && t.id !== 'thema.qw.expertenstandards');
    return {
      id: `katalog:${r.id}`, art: 'standard' as const, titel: r.name, standardIds: [r.id],
      pfad: ['Expertenstandard', r.details?.replace(/\.$/, '')].filter(Boolean).join(' · '),
      text: [r.details, verknuepft.length ? `Themen: ${verknuepft.map((t) => t.name).join(', ')}.` : ''].filter(Boolean).join(' '),
      stichworte: [kurzname(r.name), ...verknuepft.flatMap((t) => t.tags ?? [])],
      link: verknuepft[0] ? `/lernen/thema?id=${encodeURIComponent(verknuepft[0].id)}` : undefined,
      details: [
        ...(r.details ? [{ label: 'Fassung', text: r.details }] : []),
        ...(r.pruefstatus === 'ungeprueft' ? [{ label: 'Hinweis', text: 'Herausgeber und Fassung sind noch nicht geprüft.' }] : []),
        ...(verknuepft.length ? [{ label: 'Themen', text: verknuepft.map((t) => t.name).join(', ') }] : []),
      ],
    };
  });
}

/** Glossarbegriffe zu Themen, die einen Standard nennen. */
export function ausGlossar(modul: CatalogModule): SuchDok[] {
  const themen = themaZuStandards(modul);
  const out: SuchDok[] = [];
  for (const g of modul.glossary) {
    const std = [...new Set((g.topicIds ?? []).flatMap((t) => themen.get(t) ?? []))];
    if (!std.length) continue;
    out.push({
      id: `glossar:${g.id ?? g.term}`, art: 'begriff', titel: g.abbreviation && g.abbreviation !== g.term ? `${g.term} (${g.abbreviation})` : g.term,
      text: g.definition, standardIds: std, pfad: 'Glossar', stichworte: [...(g.synonyms ?? []), ...(g.abbreviation ? [g.abbreviation] : [])],
      link: g.topicIds?.[0] ? `/lernen/thema?id=${encodeURIComponent(g.topicIds[0])}` : undefined,
    });
  }
  return out;
}

/** Synonyme aus dem Glossar (Begriff, Abkürzung, Synonyme) der aufgenommenen Begriffe. */
export function glossarSynonyme(modul: CatalogModule): SynonymGruppen {
  const themen = themaZuStandards(modul);
  return modul.glossary
    .filter((g) => (g.topicIds ?? []).some((t) => themen.has(t)) && (g.abbreviation || g.synonyms?.length))
    .map((g) => [g.term, ...(g.abbreviation ? [g.abbreviation] : []), ...(g.synonyms ?? [])]);
}

// ---------------------------------------------------------------- Trainer

const ES_THEMA = 'thema.qw.expertenstandards';

function kurzerTitel(text: string, max = 70): string {
  const satz = text.split(/(?<=[.!?:])\s/)[0] ?? text;
  return satz.length <= max ? satz.replace(/[.:]$/, '') : satz.slice(0, max).replace(/\s\S*$/, '') + ' …';
}

function loesung(a: Aufgabe): string[] {
  switch (a.art) {
    case 'auswahl': return a.richtig.map((i) => a.optionen[i]!).filter(Boolean);
    case 'reihenfolge': return [a.schritte.map((s, i) => `${i + 1}. ${s}`).join(' ')];
    case 'beschriften': return a.marken.map((m) => `${m.nr}: ${m.label}`);
    case 'zuordnen': return a.paare.map((p) => `${p.links} → ${p.rechts}`);
    case 'fall': return a.schritte.map((s) => `${s.frage} ${s.richtig.map((i) => s.optionen[i]).join(', ')}`);
  }
}

export function ausTrainer(aufgaben: Array<{ bereich: string; aufgabe: Aufgabe }>, themen: Map<string, string[]>): SuchDok[] {
  return aufgaben.map(({ bereich, aufgabe: a }) => {
    const std = [...new Set(a.topicIds.filter((t) => t !== ES_THEMA).flatMap((t) => themen.get(t) ?? []))];
    const antwort = loesung(a);
    const einstieg = a.art === 'fall' ? `${a.einstieg} ` : '';
    return {
      id: `trainer:${a.id}`, art: 'uebung' as const, titel: a.frage, standardIds: std, pfad: `Trainer · ${a.titel}`,
      text: `${einstieg}${antwort.join(' ')} ${a.erklaerung.join(' ')} ${(a.vertiefung ?? []).join(' ')}`.trim(),
      link: `/lernen/expertenstandards?bereich=${bereich}`,
      details: [
        ...(a.art === 'fall' ? [{ label: 'Fall', text: a.einstieg }] : []),
        { label: antwort.length > 1 ? 'Lösung' : 'Richtig', text: antwort.join(' · ') },
        { label: 'Begründung', text: a.erklaerung.join(' ') },
        ...(a.vertiefung?.length ? [{ label: 'Mehr verstehen', text: a.vertiefung.join(' ') }] : []),
      ],
    };
  });
}

export function ausKurzwissen(bereiche: Array<{ id: string; label: string; wissen: string[] }>, standards: StandardInfo[]): SuchDok[] {
  return bereiche.flatMap((b) => b.wissen.map((text, i) => {
    // Kurzwissen „Sturz: …“ dem passenden Standard zuordnen
    const kopf = /^([^:]{3,40}):/.exec(text)?.[1]?.toLowerCase();
    const wurzel = kopf?.split(' ')[0]?.slice(0, 6);
    const std = wurzel ? standards.filter((s) => s.kurz.toLowerCase().includes(wurzel)).map((s) => s.id) : [];
    return {
      id: `kurz:${b.id}:${i}`, art: 'kernaussage' as const, titel: kurzerTitel(text), text, standardIds: std,
      pfad: `Trainer · ${b.label}`, link: `/lernen/expertenstandards?bereich=${b.id}`,
    };
  }));
}

// ---------------------------------------------------------------- Instrumente

export function ausInstrumenten(instrumente: Instrument[], themen: Map<string, string[]>, gruppeVon: (id: string) => string | undefined, grenzen: (id: string) => string | undefined): SuchDok[] {
  return instrumente.map((i) => {
    const std = [...new Set(i.topicIds.flatMap((t) => themen.get(t) ?? []))];
    const g = grenzen(i.id);
    const gruppe = gruppeVon(i.id);
    return {
      id: `instrument:${i.id}`, art: 'instrument' as const, titel: i.name, standardIds: std, pfad: 'Assessment-Instrument',
      text: `${i.zweck} ${i.richtung} ${i.hinweise.join(' ')} ${g ?? ''}`.trim(),
      stichworte: [i.kurz, ...i.items.map((x) => x.label)],
      link: gruppe ? `/lernen/assessment?gruppe=${gruppe}&modus=rechner` : '/lernen/assessment',
      details: [
        { label: 'Zweck', text: i.zweck },
        { label: 'Auswertung', text: i.richtung },
        ...(i.items.length > 1 ? [{ label: 'Bereiche', text: i.items.map((x) => x.label).join(' · ') }] : []),
        ...(g ? [{ label: 'Grenzen', text: g }] : []),
      ],
    };
  });
}
