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
import { session, setWorkspace, type Theme } from './session';
import { merkliste } from './merkliste';
import { kuerzelHilfe } from './Tastenkuerzel';

interface Hit extends TrieEntry { id: string; type: 'Seite' | 'Fach' | 'Thema' | 'Begriff' | 'Quelle' | 'Aktion'; hint?: string; to?: string; definition?: string; run?: () => void }

type Quelle = { id: string; title: string };

/** Befehle: Dinge tun statt Seiten suchen. Stichwörter machen sie auch über Umschreibungen auffindbar. */
function aktionen(): Hit[] {
  const darstellung = (t: Theme, name: string, keywords: string[]): Hit => ({ id: `aktion:theme-${t}`, type: 'Aktion', label: `Darstellung ${name}`, keywords, hint: 'Sofort umschalten', run: () => setWorkspace({ theme: t }) });
  return [
    darstellung('dunkel', 'dunkel', ['Nachtschicht', 'dark', 'Nachtmodus']),
    darstellung('hell', 'hell', ['Farbfelder', 'light', 'Tagmodus']),
    darstellung('system', 'wie System', ['automatisch']),
    { id: 'aktion:schrift', type: 'Aktion', label: 'Schrift sehr groß', keywords: ['größer', 'Lesbarkeit', 'Zoom'], hint: 'Sofort umschalten', run: () => setWorkspace({ schrift: 'sehrgross' }) },
    { id: 'aktion:schrift-normal', type: 'Aktion', label: 'Schrift normal', keywords: ['kleiner'], hint: 'Sofort umschalten', run: () => setWorkspace({ schrift: 'normal' }) },
    { id: 'aktion:bewegung-aus', type: 'Aktion', label: 'Bewegung reduzieren', keywords: ['Animation', 'ruhig'], hint: 'Sofort umschalten', run: () => setWorkspace({ bewegung: 'reduziert' }) },
    { id: 'aktion:bewegung-an', type: 'Aktion', label: 'Bewegung einschalten', keywords: ['Animation'], hint: 'Sofort umschalten', run: () => setWorkspace({ bewegung: 'system' }) },
    { id: 'aktion:pruefung', type: 'Aktion', label: 'Prüfung anlegen', keywords: ['Klausur', 'Termin', 'Examen planen'], hint: 'Lernplan', to: '/lernen/plan?ansicht=pruefungen&neu=1' },
    { id: 'aktion:import', type: 'Aktion', label: 'Material importieren', keywords: ['hochladen', 'PDF', 'Skript hinzufügen'], hint: 'Import-Assistent', to: '/material/import' },
    { id: 'aktion:sicherung', type: 'Aktion', label: 'Sicherung erstellen', keywords: ['Backup', 'übertragen', 'exportieren'], hint: 'Datensicherung', to: '/system/sicherung' },
    { id: 'aktion:kuerzel', type: 'Aktion', label: 'Tastenkürzel anzeigen', keywords: ['Hilfe', 'Shortcuts'], hint: 'Übersicht', run: () => kuerzelHilfe.set({ offen: true }) },
  ];
}

function buildIndex(moduleId: string, roles: Parameters<typeof visibleNav>[1], quellen: Quelle[]): Trie<Hit> {
  const mod = getModule(moduleId);
  const subjectName = new Map(mod?.subjects.map((s) => [s.id, s.code ?? s.name]) ?? []);
  return new Trie<Hit>([
    ...aktionen(),
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
  const merk = useStore(merkliste, (m) => m);
  // Leeres Feld: Favoriten und zuletzt genutzte Seiten statt einer leeren Liste.
  const start = useMemo(() => {
    const seiten = flatNav(visibleNav(NAV, roles));
    const hit = (p: string, hint: string): Hit[] => { const n = seiten.find((i) => i.path === p); return n ? [{ id: `start:${hint}:${p}`, type: 'Seite', label: n.label, hint, to: p }] : []; };
    return [...merk.favoriten.flatMap((p) => hit(p, 'Favorit')), ...merk.zuletzt.filter((p) => !merk.favoriten.includes(p)).flatMap((p) => hit(p, 'Zuletzt'))].slice(0, 8);
  }, [merk, roles]);
  // Bei Eingabe führt der letzte Eintrag in den Schnellsucher (Tippfehler, Synonyme, Kriterien der Standards)
  const hits = useMemo(() => {
    if (!debounced) return start;
    const h = index.search(debounced, 12);
    const q = debounced.trim();
    return q.length >= 2 ? [...h, { id: 'schnellsuche', type: 'Seite' as const, label: `„${q}“ in Standards suchen`, hint: 'Standard-Schnellsucher', to: `/lernen/schnellsuche?q=${encodeURIComponent(q)}` }] : h;
  }, [index, debounced, start]);
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
    if (!hit?.to && !hit?.run) return;
    if (hit.to) navigate(hit.to); else hit.run?.();
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
              placeholder="Thema, Begriff, Quelle, Seite oder Befehl" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKey}
              autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="go" />
            <button type="button" className="ghost small" onClick={close}>Schließen</button>
          </div>
          <ul id={listId} role="listbox" className="omnibar__list" aria-label="Vorschläge">
            {hits.map((h, i) => (
              <li key={h.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                className={`omnibar__hit${i === active ? ' is-active' : ''}`}
                onPointerEnter={() => setActive(i)} onClick={() => (h.to || h.run ? choose(h) : setActive(i))}>
                <span className={`omnibar__type omnibar__type--${h.type.toLowerCase()}`}>{h.type}</span>
                <span className="omnibar__label">{h.label}</span>
                {h.hint && <span className="muted">{h.hint}</span>}
              </li>
            ))}
          </ul>
          {debounced && hits.length <= 1 && hits[0]?.id === 'schnellsuche' && <p className="omnibar__empty muted">Keine direkten Treffer. Der Schnellsucher findet auch Tippfehler und Synonyme.</p>}
          {debounced && !hits.length && <p className="omnibar__empty muted">Keine Treffer für „{debounced}“.</p>}
          {!debounced && <p className="omnibar__empty muted">Tipp: Wortanfänge genügen, z. B. „dek pro“ für Dekubitusprophylaxe. Auch Befehle gehen, z. B. „dunkel“ oder „Sicherung“.</p>}
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
