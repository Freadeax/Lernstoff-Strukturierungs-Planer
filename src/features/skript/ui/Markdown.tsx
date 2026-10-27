// Kleiner Markdown-Leser für die Lernzusammenfassungen: Überschriften, Listen (verschachtelt),
// Tabellen, Zitate, fett/kursiv, Code, Links. Belege [D, S. 18] werden zu antippbaren Marken,
// ⚠-Stellen (nicht belegt) farbig abgesetzt. Kein HTML aus dem Text wird ausgeführt.

import { Fragment, type ReactNode } from 'react';
import { leseBelegKlammer } from '../parser';
import { markiere } from '../suche';
import type { SkriptBeleg } from '../typen';

export interface MdKontext {
  bekannte: Set<string>;
  onBeleg?: (b: SkriptBeleg[]) => void;
  /** Suchbegriffe (normalisiert), die hervorgehoben werden. */
  hervorheben?: string[];
}

// ---------------------------------------------------------------- Inline

function hebeHervor(text: string, k: MdKontext, key: string): ReactNode {
  const bereiche = markiere(text, k.hervorheben ?? []);
  if (!bereiche.length) return text;
  const out: ReactNode[] = [];
  let pos = 0;
  bereiche.forEach(([a, b], i) => {
    if (a > pos) out.push(text.slice(pos, a));
    out.push(<mark key={`${key}m${i}`}>{text.slice(a, b)}</mark>);
    pos = b;
  });
  if (pos < text.length) out.push(text.slice(pos));
  return out;
}

const INLINE = /(\*\*[^*]+?\*\*|__[^_]+?__|\*[^*\s][^*]*?\*|`[^`]+`|\[[^\]\n]{1,80}\]\([^)\s]+\)|\[[^\]\n]{1,80}\]|⚠)/g;

export function inline(text: string, k: MdKontext, key = 'i'): ReactNode[] {
  const out: ReactNode[] = [];
  let pos = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    const t = m[0];
    const i = m.index;
    if (i > pos) out.push(<Fragment key={`${key}t${n++}`}>{hebeHervor(text.slice(pos, i), k, `${key}h${n}`)}</Fragment>);
    pos = i + t.length;
    const kk = `${key}x${n++}`;
    if (t.startsWith('**') || t.startsWith('__')) out.push(<strong key={kk}>{inline(t.slice(2, -2), k, kk)}</strong>);
    else if (t.startsWith('`')) out.push(<code key={kk}>{t.slice(1, -1)}</code>);
    else if (t === '⚠') out.push(<span key={kk} className="sk-warn-icon" role="img" aria-label="nicht im Material belegt" title="Nicht im Material belegt">⚠</span>);
    else if (t.startsWith('*')) out.push(<em key={kk}>{inline(t.slice(1, -1), k, kk)}</em>);
    else if (t.startsWith('[') && t.endsWith(')')) {
      const lm = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      const url = lm[2]!;
      out.push(/^https?:\/\//.test(url) ? <a key={kk} href={url} target="_blank" rel="noopener noreferrer">{lm[1]}</a> : <Fragment key={kk}>{lm[1]}</Fragment>);
    } else {
      const belege = leseBelegKlammer(t.slice(1, -1), k.bekannte);
      if (belege) {
        out.push(
          <button key={kk} type="button" className="sk-beleg" onClick={() => k.onBeleg?.(belege)} title="Quelle anzeigen">
            {t.slice(1, -1)}
          </button>,
        );
      } else out.push(<Fragment key={kk}>{hebeHervor(t, k, kk)}</Fragment>);
    }
  }
  if (pos < text.length) out.push(<Fragment key={`${key}e`}>{hebeHervor(text.slice(pos), k, `${key}he`)}</Fragment>);
  return out;
}

// ---------------------------------------------------------------- Blöcke

export type Block =
  | { art: 'ueberschrift'; ebene: number; text: string }
  | { art: 'absatz'; text: string }
  | { art: 'liste'; geordnet: boolean; start?: number; punkte: ListenPunkt[] }
  | { art: 'tabelle'; kopf: string[]; zeilen: string[][] }
  | { art: 'zitat'; bloecke: Block[]; warnung: boolean }
  | { art: 'code'; text: string }
  | { art: 'linie' };

export interface ListenPunkt { text: string; kinder: Block[] }

const listenStart = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const tabellenZeile = (z: string) => /^\s*\|.*\|\s*$/.test(z);
const zellen = (z: string) => z.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));

/** Markdown in Blöcke zerlegen. */
export function bloecke(md: string): Block[] {
  const zeilen = md.replace(/\r\n?/g, '\n').split('\n');
  const out: Block[] = [];
  let i = 0;
  while (i < zeilen.length) {
    const z = zeilen[i]!;
    if (!z.trim()) { i++; continue; }
    if (/^(```|~~~)/.test(z)) {
      const ende = zeilen.findIndex((x, j) => j > i && /^(```|~~~)/.test(x));
      const bis = ende < 0 ? zeilen.length : ende;
      out.push({ art: 'code', text: zeilen.slice(i + 1, bis).join('\n') });
      i = bis + 1; continue;
    }
    const h = z.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push({ art: 'ueberschrift', ebene: h[1]!.length, text: h[2]!.trim() }); i++; continue; }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(z)) { out.push({ art: 'linie' }); i++; continue; }
    if (/^\s*>/.test(z)) {
      const teil: string[] = [];
      while (i < zeilen.length && /^\s*>/.test(zeilen[i]!)) { teil.push(zeilen[i]!.replace(/^\s*>\s?/, '')); i++; }
      const innen = teil.join('\n');
      out.push({ art: 'zitat', bloecke: bloecke(innen), warnung: /⚠/.test(innen) });
      continue;
    }
    if (tabellenZeile(z) && i + 1 < zeilen.length && /^\s*\|?\s*:?-{2,}/.test(zeilen[i + 1]!)) {
      const kopf = zellen(z);
      i += 2;
      const reihen: string[][] = [];
      while (i < zeilen.length && tabellenZeile(zeilen[i]!)) { reihen.push(zellen(zeilen[i]!)); i++; }
      out.push({ art: 'tabelle', kopf, zeilen: reihen });
      continue;
    }
    if (listenStart.test(z)) {
      const ende = i;
      const { block, weiter } = leseListe(zeilen, ende);
      out.push(block);
      i = weiter;
      continue;
    }
    // Absatz bis Leerzeile oder Blockbeginn
    const teil: string[] = [];
    while (i < zeilen.length && zeilen[i]!.trim() && !/^(#{1,6}\s|```|~~~|\s*>)/.test(zeilen[i]!) && !listenStart.test(zeilen[i]!) && !(tabellenZeile(zeilen[i]!) && teil.length === 0)) {
      teil.push(zeilen[i]!.trim()); i++;
    }
    if (!teil.length) { teil.push(z.trim()); i++; }
    out.push({ art: 'absatz', text: teil.join(' ') });
  }
  return out;
}

const einzug = (z: string) => (z.match(/^\s*/)?.[0] ?? '').replace(/\t/g, '    ').length;

function leseListe(zeilen: string[], start: number): { block: Block; weiter: number } {
  const basis = einzug(zeilen[start]!);
  const erste = zeilen[start]!.match(listenStart)!;
  const geordnet = /\d/.test(erste[2]!);
  const punkte: ListenPunkt[] = [];
  let i = start;
  while (i < zeilen.length) {
    const z = zeilen[i]!;
    const m = z.match(listenStart);
    if (m && einzug(z) === basis) {
      // Inhalt des Punkts: Folgezeilen mit größerem Einzug (oder Leerzeilen dazwischen)
      const innen: string[] = [];
      i++;
      while (i < zeilen.length) {
        const n = zeilen[i]!;
        if (!n.trim()) {
          const naechste = zeilen.slice(i + 1).find((x) => x.trim());
          if (naechste && einzug(naechste) > basis) { innen.push(''); i++; continue; }
          break;
        }
        if (einzug(n) <= basis) break;
        innen.push(n);
        i++;
      }
      const tief = innen.filter((x) => x.trim()).reduce((min, x) => Math.min(min, einzug(x)), Infinity);
      const ent = innen.map((x) => x.slice(Math.min(tief === Infinity ? 0 : tief, einzug(x))));
      // Fortsetzungszeilen direkt nach dem Punkt gehören zum Text, wenn sie kein Block sind
      let text = m[3]!;
      let k = 0;
      while (k < ent.length && ent[k]!.trim() && !listenStart.test(ent[k]!) && !/^(#|>|\||```)/.test(ent[k]!.trim())) { text += ` ${ent[k]!.trim()}`; k++; }
      punkte.push({ text, kinder: bloecke(ent.slice(k).join('\n')) });
      continue;
    }
    if (!z.trim()) {
      const naechste = zeilen.slice(i + 1).find((x) => x.trim());
      if (naechste && naechste.match(listenStart) && einzug(naechste) === basis) { i++; continue; }
    }
    break;
  }
  const startNr = geordnet ? Number(erste[2]!.replace(/\D/g, '')) : undefined;
  return { block: { art: 'liste', geordnet, ...(startNr && startNr !== 1 ? { start: startNr } : {}), punkte }, weiter: i };
}

// ---------------------------------------------------------------- Darstellung

function BlockAnsicht({ b, k, id }: { b: Block; k: MdKontext; id: string }) {
  switch (b.art) {
    case 'ueberschrift': {
      const Tag = (`h${Math.min(6, b.ebene + 1)}`) as 'h3';
      return <Tag className="sk-h">{inline(b.text, k, id)}</Tag>;
    }
    case 'absatz': {
      const warn = /^⚠/.test(b.text.trim());
      return <p className={warn ? 'sk-luecke' : undefined}>{inline(b.text, k, id)}</p>;
    }
    case 'liste': {
      const Tag = b.geordnet ? 'ol' : 'ul';
      return (
        <Tag start={b.start}>
          {b.punkte.map((p, i) => (
            <li key={i} className={/⚠/.test(p.text) ? 'sk-luecke-li' : undefined}>
              {inline(p.text, k, `${id}l${i}`)}
              {p.kinder.map((c, j) => <BlockAnsicht key={j} b={c} k={k} id={`${id}l${i}c${j}`} />)}
            </li>
          ))}
        </Tag>
      );
    }
    case 'tabelle':
      return (
        <div className="sk-tabelle" role="region" aria-label="Tabelle" tabIndex={0}>
          <table>
            <thead><tr>{b.kopf.map((c, i) => <th key={i} scope="col">{inline(c, k, `${id}k${i}`)}</th>)}</tr></thead>
            <tbody>{b.zeilen.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{inline(c, k, `${id}r${i}c${j}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case 'zitat':
      return <blockquote className={b.warnung ? 'sk-luecke' : 'sk-zitat'}>{b.bloecke.map((c, j) => <BlockAnsicht key={j} b={c} k={k} id={`${id}q${j}`} />)}</blockquote>;
    case 'code':
      return <pre className="sk-code"><code>{b.text}</code></pre>;
    case 'linie':
      return <hr />;
  }
}

export function Markdown({ text, k }: { text: string; k: MdKontext }) {
  return <>{bloecke(text).map((b, i) => <BlockAnsicht key={i} b={b} k={k} id={`b${i}`} />)}</>;
}
