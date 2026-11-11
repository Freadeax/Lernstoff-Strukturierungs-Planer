import { useMemo, useState } from 'react';
import './quiz.css';
import { getModule, modules } from '../../modules/registry';
import type { CatalogModule } from '../../modules/catalog-types';
import { useStore } from '../../ui/lib/store';
import { session } from '../../ui/shell/session';
import { baueIndex, begriffeIn, zerlege, type Abschnitt, type Begriff, type BegriffIndex } from './fachbegriffe';

// Antippbare Fachbegriffe für Erklärungen und Kurzwissen. Definitionen kommen aus dem Glossar des Fachmoduls.

const cache = new Map<string, { index: BegriffIndex; themen: Map<string, string> }>();

function useModulBegriffe() {
  const moduleId = useStore(session, (s) => s.moduleId);
  const modul = (getModule(moduleId) ?? modules[0]) as CatalogModule | undefined;
  const id = modul?.id ?? '';
  let x = cache.get(id);
  if (!x) {
    x = { index: baueIndex(modul?.glossary ?? []), themen: new Map((modul?.topics ?? []).map((t) => [t.id, t.name])) };
    cache.set(id, x);
  }
  return x;
}

/** Kurzdefinition eines Begriffs mit Thema-Link und Belegstatus. */
export function BegriffKarte({ b, themen }: { b: Begriff; themen: Map<string, string> }) {
  const thema = b.topicIds.find((t) => themen.has(t));
  return (
    <>
      <strong>{b.term}{b.abbreviation && b.abbreviation !== b.term ? ` (${b.abbreviation})` : ''}:</strong> {b.definition}
      {b.note && <span className="qz-begriff__notiz"> {b.note}</span>}
      <span className="qz-begriff__fuss">
        {b.katalog ? 'Katalogdefinition, ergänzendes Wissen. Dein Lehrbuch und der Unterricht haben Vorrang.' : b.quelle}
        {thema && <> · <a href={`#/lernen/thema?id=${encodeURIComponent(thema)}`}>Thema „{themen.get(thema)}“</a></>}
      </span>
    </>
  );
}

function Zeile({ teile, themen }: { teile: Abschnitt[]; themen: Map<string, string> }) {
  const [offen, setOffen] = useState<string | null>(null);
  const aktiv = teile.find((t): t is Exclude<Abschnitt, string> => typeof t !== 'string' && t.begriff.term === offen);
  return (
    <>
      {teile.map((t, i) => (typeof t === 'string' ? t : (
        <button
          key={i} type="button" className="qz-begriff" aria-expanded={offen === t.begriff.term}
          title={`${t.begriff.term}: Kurzdefinition`}
          onClick={() => setOffen(offen === t.begriff.term ? null : t.begriff.term)}
        >{t.text}</button>
      )))}
      {aktiv && <span className="qz-begriff__karte" role="note"><BegriffKarte b={aktiv.begriff} themen={themen} /></span>}
    </>
  );
}

/** Mehrere Sätze als Liste, Fachbegriffe antippbar. Jeder Begriff wird nur beim ersten Vorkommen markiert. */
export function FachListe({ texte, className, nummeriert }: { texte: readonly string[]; className?: string; nummeriert?: boolean }) {
  const { index, themen } = useModulBegriffe();
  const zeilen = useMemo(() => {
    const schon = new Set<string>();
    return texte.map((t) => zerlege(t, index, schon));
  }, [texte, index]);
  const items = zeilen.map((z, i) => <li key={`${i}-${texte[i]}`}><Zeile teile={z} themen={themen} /></li>);
  return nummeriert ? <ol className={className}>{items}</ol> : <ul className={className}>{items}</ul>;
}

/** Fachbegriffe einer ganzen Aufgabe zum Nachschlagen. */
export function BegriffListe({ texte }: { texte: readonly string[] }) {
  const { index, themen } = useModulBegriffe();
  const begriffe = useMemo(() => begriffeIn(texte, index), [texte, index]);
  if (!begriffe.length) return null;
  return (
    <div className="qz-vertiefung__begriffe">
      <h4>Fachbegriffe in dieser Aufgabe</h4>
      <ul>{begriffe.map((b) => <li key={b.term}><BegriffKarte b={b} themen={themen} /></li>)}</ul>
    </div>
  );
}

/** Themenlinks einer Aufgabe. */
export function ThemenLinks({ topicIds }: { topicIds: readonly string[] }) {
  const { themen } = useModulBegriffe();
  const bekannt = topicIds.filter((t) => themen.has(t));
  if (!bekannt.length) return null;
  return (
    <p className="qz-vertiefung__themen">
      Weiterlesen: {bekannt.map((t, i) => (
        <span key={t}>{i > 0 && ' · '}<a href={`#/lernen/thema?id=${encodeURIComponent(t)}`}>{themen.get(t)}</a></span>
      ))}
    </p>
  );
}
