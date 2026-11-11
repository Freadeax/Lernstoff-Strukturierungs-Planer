import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '../icons';
import { Trie, type TrieEntry } from '../lib/trie';
import { useDebounced } from '../lib/hooks';
import { useStore } from '../lib/store';
import { getModule } from '../../modules/registry';
import { db } from '../../core/db';
import { flatNav, gruppenPfad, NAV, visibleNav } from './nav';
import { imFeld } from './Tastenkuerzel';
import { navigate } from './router';
import { session } from './session';

interface Hit extends TrieEntry { id: string; type: 'Seite' | 'Fach' | 'Thema' | 'Begriff' | 'Quelle'; hint?: string; to?: string; definition?: string }

type Quelle = { id: string; title: string };

function buildIndex(moduleId: string, roles: Parameters<typeof visibleNav>[1], quellen: Quelle[]): Trie<Hit> {
  const mod = getModule(moduleId);
  const subjectName = new Map(mod?.subjects.map((s) => [s.id, s.code ?? s.name]) ?? []);
  return new Trie<Hit>([
    ...flatNav(visibleNav(NAV, roles)).map((n): Hit => ({ id: `nav:${n.id}`, type: 'Seite', label: n.label, hint: gruppenPfad(n.path!) || undefined, to: n.path })),
    ...quellen.map((q): Hit => ({ id: `quelle:${q.id}`, type: 'Quelle', label: q.title, hint: 'Dein Material', to: `/material/dokumente?dokument=${encodeURIComponent(q.id)}` })),
    ...(mod?.subjects ?? []).map((s): Hit => ({ id: `fach:${s.id}`, type: 'Fach', label: s.name, hint: 'Themen dieses Fachs', keywords: s.code ? [s.code] : [], to: `/lernen/themen?fach=${encodeURIComponent(s.id)}` })),
    ...(mod?.topics ?? []).map((t): Hit => ({ id: `thema:${t.id}`, type: 'Thema', label: t.name, hint: subjectName.get(t.subjectId), to: `/lernen/thema?id=${encodeURIComponent(t.id)}` })),
    ...(mod?.glossary ?? []).map((g, i): Hit => ({
      id: `begriff:${i}`, type: 'Begriff', label: g.term, keywords: g.abbreviation ? [g.abbreviation] : [], hint: g.abbreviation ?? 'Fachkatalog', definition: g.definition,
    })),
  ]);
}

/** Globale Suche: Strg/Cmd + K, 250 ms Entprellung, Präfixsuche über Seiten, Fächer, Themen, Begriffe und eigene Quellen. */
export function Omnibar() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const moduleId = useStore(session, (s) => s.moduleId);
  const roles = useStore(session, (s) => s.roles);
  const [quellen, setQuellen] = useState<Quelle[]>([]);
  const index = useMemo(() => buildIndex(moduleId, roles, quellen), [moduleId, roles, quellen]);
  const debounced = useDebounced(query, 250);
  const hits = useMemo(() => index.search(debounced, 12), [index, debounced]);
  const listId = useId();

  const open = () => {
    dialog.current?.showModal(); setTimeout(() => input.current?.focus(), 0);
    // Eigene Quellen erst beim Öffnen laden: die Suche soll den Start nicht bremsen.
    db.documents.toArray().then((d) => setQuellen(d.map(({ id, title }) => ({ id, title })))).catch(() => undefined);
  };
  const close = () => { dialog.current?.close(); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (dialog.current?.open) close(); else open(); }
      else if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !imFeld(e.target) && !document.querySelector('dialog[open]')) { e.preventDefault(); open(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => setActive(0), [debounced]);

  function choose(hit: Hit | undefined) {
    if (!hit?.to) return;
    navigate(hit.to);
    setQuery('');
    close();
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(hits[active]); }
    // Ein Suchfeld mit Text leert sich bei Escape nur, der Dialog bliebe offen: deshalb hier ausdrücklich schließen.
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  }
  const current = hits[active];
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <>
      <button type="button" className="omnibar__trigger" onClick={open} aria-label="Lernstoff durchsuchen" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K /">
        <Icon name="search" size={18} />
        <span className="omnibar__placeholder">Suchen</span>
        <kbd className="omnibar__kbd">{mac ? '⌘' : 'Strg'} K</kbd>
      </button>
      <dialog ref={dialog} className="omnibar" aria-label="Suche" onClose={() => setQuery('')}
        onClick={(e) => { if (e.target === dialog.current) close(); }}>
        <div className="omnibar__box">
          <div className="omnibar__field">
            <Icon name="search" />
            <input ref={input} type="search" role="combobox" aria-label="Thema, Fach, Fachbegriff, Quelle oder Seite suchen" aria-expanded={hits.length > 0} aria-controls={listId}
              aria-autocomplete="list" aria-activedescendant={current ? `${listId}-${active}` : undefined}
              placeholder="Thema, Fach, Fachbegriff, Quelle oder Seite" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKey}
              autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="go" />
            <button type="button" className="ghost small" onClick={close}>Schließen</button>
          </div>
          <ul id={listId} role="listbox" className="omnibar__list" aria-label="Vorschläge">
            {hits.map((h, i) => (
              <li key={h.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                className={`omnibar__hit${i === active ? ' is-active' : ''}`}
                onPointerEnter={() => setActive(i)} onClick={() => (h.to ? choose(h) : setActive(i))}>
                <span className={`omnibar__type omnibar__type--${h.type.toLowerCase()}`}>{h.type}</span>
                <span className="omnibar__label">{h.label}</span>
                {h.hint && <span className="muted">{h.hint}</span>}
              </li>
            ))}
          </ul>
          {debounced && !hits.length && <p className="omnibar__empty muted">Keine Treffer für „{debounced}“.</p>}
          {!debounced && <p className="omnibar__empty muted">Tipp: Wortanfänge genügen, z. B. „dek pro“ für Dekubitusprophylaxe.</p>}
          {current?.definition && (
            <div className="omnibar__preview" aria-live="polite">
              <strong>{current.label}</strong>
              <p>{current.definition}</p>
              <p className="muted">Aus dem Fachkatalog, noch nicht durch dein Material belegt.</p>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
