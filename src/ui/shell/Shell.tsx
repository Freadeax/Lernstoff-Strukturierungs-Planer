import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { UmzugsHinweis } from '../../features/sicherung/UmzugsHinweis';
import { Icon } from '../icons';
import { Menu } from '../Menu';
import { useStore } from '../lib/store';
import { modules } from '../../modules/registry';
import { Omnibar } from './Omnibar';
import { NotificationCenter, Toaster } from './NotificationCenter';
import { Sidebar, TabBar } from './Sidebar';
import { goBack, navigate, useRoute } from './router';
import { notify } from './notifications';
import { useOnline } from '../lib/online';
import { useMenueGesten } from './gesten';
import { kuerzelHilfe, Tastenkuerzel } from './Tastenkuerzel';
import { BEWEGUNGEN, SCHRIFTEN, session, setWorkspace, type Theme } from './session';
import { BEREICH_NAME, bereichVon, seitenName } from './nav';
import { besucht, merkliste, toggleFavorit } from './merkliste';
import { aktualisierung, beobachteAktualisierung, neuLadenBeimWechsel } from './aktualisierung';
import { beobachteSpeicher, speicher } from './speicherwaechter';
import { fokus, schalteFokus } from './fokus';

// Leiste des Fokus-Modus erst laden, wenn er gebraucht wird (Startpaket bleibt klein).
const FokusLeiste = lazy(() => import('./FokusLeiste'));

function WorkspaceSwitcher() {
  const moduleId = useStore(session, (s) => s.moduleId);
  const current = modules.find((m) => m.id === moduleId);
  return (
    <Menu label={`Fachmodul: ${current?.name ?? 'keins'}`} className="ghost small workspace"
      trigger={<><Icon name="layers" size={18} /><span className="workspace__name">{current?.name ?? 'Fachmodul'}</span><Icon name="chevronDown" size={14} /></>}
      align="start"
      items={[
        ...modules.map((m) => ({ id: m.id, label: `${m.id === moduleId ? '✓ ' : ''}${m.name}`, onSelect: () => setWorkspace({ moduleId: m.id }) })),
        { id: 'mehr', label: 'Weitere Fachmodule folgen …', onSelect: () => navigate('/lernen/faecher') },
      ]} />
  );
}

function ProfileMenu() {
  const theme = useStore(session, (s) => s.theme);
  const schrift = useStore(session, (s) => s.schrift);
  const bewegung = useStore(session, (s) => s.bewegung);
  const themes: Array<[Theme, string]> = [['system', 'wie System'], ['hell', 'hell'], ['dunkel', 'dunkel']];
  return (
    <Menu label="Profil und Darstellung" trigger={<Icon name="user" />} className="icon ghost"
      items={[
        { id: 'settings', label: 'Einstellungen', onSelect: () => navigate('/einstellungen') },
        { id: 'fokus', label: 'Fokus-Modus (F)', onSelect: schalteFokus },
        ...themes.map(([t, l]) => ({ id: `theme-${t}`, label: `${t === theme ? '✓ ' : ''}Darstellung ${l}`, onSelect: () => setWorkspace({ theme: t }) })),
        ...SCHRIFTEN.map(([g, l]) => ({ id: `schrift-${g}`, label: `${g === schrift ? '✓ ' : ''}Schrift ${l}`, onSelect: () => setWorkspace({ schrift: g }) })),
        ...BEWEGUNGEN.map(([b, l]) => ({ id: `bewegung-${b}`, label: `${b === bewegung ? '✓ ' : ''}Bewegung ${l}`, onSelect: () => setWorkspace({ bewegung: b }) })),
        { id: 'sicherung', label: 'Datensicherung (sichern, übertragen)', onSelect: () => navigate('/system/sicherung') },
        { id: 'kuerzel', label: 'Tastenkürzel (?)', onSelect: () => kuerzelHilfe.set({ offen: true }) },
      ]} />
  );
}

/** Verbindung: Hinweis im Kopf solange offline, Mitteilung beim Wechsel. */
function OnlineStatus() {
  const online = useOnline();
  const before = useRef(online);
  useEffect(() => {
    if (before.current === online) return;
    before.current = online;
    if (online) notify('info', 'Wieder online', 'Claude und GitHub sind wieder erreichbar.');
    else notify('warning', 'Offline', 'Lernen, Karten, Pläne und Dokumente funktionieren weiter. Claude und GitHub brauchen Netz.');
  }, [online]);
  if (online) return null;
  return (
    <span className="badge shell__offline" role="status" title="Ohne Internet: alles Lokale funktioniert, Claude und GitHub nicht.">
      Offline
    </span>
  );
}

function Header() {
  const drawer = useStore(session, (s) => s.drawerOpen);
  const { path, depth } = useRoute();
  const current = seitenName(path) ?? 'Lernarbeitsplatz';
  const favorit = useStore(merkliste, (m) => m.favoriten.includes(path));
  return (
    <header className="shell__header" inert={drawer}>
      <button type="button" className="icon ghost shell__menu-btn" aria-label="Navigation öffnen" aria-controls="sidebar"
        aria-expanded={drawer} onClick={() => session.set({ drawerOpen: !drawer })}>
        <Icon name="menu" />
      </button>
      {/* Nur in der installierten App sichtbar (CSS), dort fehlt die Zurück-Taste des Browsers. */}
      {depth > 0 && (
        <button type="button" className="icon ghost shell__back" aria-label="Zurück" onClick={goBack}>
          <Icon name="chevronLeft" />
        </button>
      )}
      <div className="header-context">
        <span className="header-context__bereich">{BEREICH_NAME[bereichVon(path)]}</span>
        {path !== '/' && <><Icon name="chevronRight" size={14} /><strong key={path}>{current}</strong></>}
      </div>
      {path !== '/' && seitenName(path) && (
        <button type="button" className="icon ghost shell__stern" aria-pressed={favorit} onClick={() => toggleFavorit(path)}
          aria-label={favorit ? `${current} aus den Favoriten entfernen` : `${current} zu den Favoriten`} title={favorit ? 'Favorit entfernen' : 'Als Favorit merken'}>
          <Icon name="star" size={20} />
        </button>
      )}
      <OnlineStatus />
      <div className="shell__search"><Omnibar /></div>
      <button type="button" className="icon ghost shell__fokus" onClick={schalteFokus} aria-label="Fokus-Modus: Menüs ausblenden" title="Fokus-Modus (F)">
        <Icon name="maximize" size={20} />
      </button>
      <div className="shell__actions">
        <WorkspaceSwitcher />
        <NotificationCenter />
        <ProfileMenu />
      </div>
    </header>
  );
}

/** Neue Version oder neuere Datenbank in einem anderen Fenster: Hinweis, bis neu geladen wird. */
function AktualisierungsHinweis() {
  const grund = useStore(aktualisierung, (s) => s.grund);
  if (!grund) return null;
  return (
    <div className="note shell__aktualisierung" role="status">
      <span>{grund === 'datenbank'
        ? 'Die App wurde in einem anderen Fenster aktualisiert. Bitte neu laden, damit hier nichts verloren geht.'
        : 'Eine neue Version ist da. Sie startet beim nächsten Seitenwechsel oder sofort per Knopf.'}</span>
      <button type="button" className="small primary" onClick={() => location.reload()}>Jetzt neu laden</button>
    </div>
  );
}

/** Ohne Datenbank (privates Fenster, Sperrmodus) läuft die App, speichert aber nichts: deutlich sagen. */
function OhneSpeicherHinweis() {
  const ohne = useStore(speicher, (s) => s.ohneDatenbank);
  if (!ohne) return null;
  return (
    <div className="note warn" role="alert">
      <strong>Dieser Browser speichert hier nichts.</strong> Wahrscheinlich ein privates Fenster oder gesperrte Website-Daten.
      Du kannst dich umsehen, aber Lernstand, Pläne und Material gehen beim Schließen verloren. Öffne die App in einem normalen Fenster.
    </div>
  );
}

const TIPPFELD = "input:not([type='checkbox'], [type='radio'], [type='range'], [type='file'], [type='button'], [type='submit'], [type='reset'], [type='color']), textarea, [contenteditable='true']";

/**
 * Markiert den Rahmen, solange im Inhalt ein Textfeld den Fokus hat (blendet am Handy die untere Leiste aus).
 * Nach dem Verlassen erst mit kurzer Verzögerung zurück, damit der Tipp auf einen Knopf direkt unter dem Feld
 * nicht von der wieder auftauchenden Leiste geschluckt wird (Fingerdruck ist dann schon unten, Loslassen träfe die Leiste).
 */
function useTippModus(main: React.RefObject<HTMLElement | null>) {
  const [tippen, setTippen] = useState(false);
  useEffect(() => {
    const el = main.current;
    if (!el) return;
    let t: number | undefined;
    const rein = (e: FocusEvent) => { if ((e.target as Element).matches?.(TIPPFELD)) { window.clearTimeout(t); setTippen(true); } };
    const raus = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => setTippen(!!document.activeElement?.matches?.(TIPPFELD) && el.contains(document.activeElement)), 400);
    };
    el.addEventListener('focusin', rein);
    el.addEventListener('focusout', raus);
    return () => { window.clearTimeout(t); el.removeEventListener('focusin', rein); el.removeEventListener('focusout', raus); };
  }, [main]);
  return tippen;
}

/** App-Rahmen: Seitenleiste, Kopf, Inhalt, untere Leiste (Handy), Toasts. */
export function Shell({ children }: { children: ReactNode }) {
  const collapsed = useStore(session, (s) => s.sidebarCollapsed);
  const drawer = useStore(session, (s) => s.drawerOpen);
  const { path } = useRoute();
  const main = useRef<HTMLElement>(null);
  useMenueGesten();
  const tippen = useTippModus(main);
  const imFokus = useStore(fokus, (f) => f.an);
  useEffect(() => beobachteAktualisierung(), []);
  // Steht eine neue Version an, beim Seitenwechsel neu laden: die alte Seite wird ohnehin verlassen.
  const vorher = useRef(path);
  useEffect(() => {
    const von = vorher.current;
    vorher.current = path;
    if (neuLadenBeimWechsel(aktualisierung.get().grund, von, path)) location.reload();
  }, [path]);
  useEffect(() => beobachteSpeicher(), []);
  // Nach Seitenwechsel Fokus auf den Inhalt (Screenreader) und nach oben scrollen.
  const first = useRef(true);
  useEffect(() => {
    document.title = `${seitenName(path) ?? 'Lernarbeitsplatz'} · Lernstoff`;
    if (seitenName(path)) besucht(path);
    if (first.current) { first.current = false; return; }
    main.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [path]);

  return (
    <div className="shell" data-sidebar={collapsed ? 'collapsed' : 'expanded'} data-bereich={bereichVon(path)} data-tippen={tippen || undefined}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); main.current?.focus(); }}>Zum Inhalt springen</a>
      <Sidebar />
      {imFokus ? <Suspense fallback={null}><FokusLeiste /></Suspense> : <Header />}
      <main id="main" ref={main} className="shell__main" tabIndex={-1} inert={drawer}>
        <div className="content"><OhneSpeicherHinweis /><AktualisierungsHinweis /><UmzugsHinweis />{children}</div>
      </main>
      <TabBar />
      <Toaster />
      <Tastenkuerzel />
    </div>
  );
}
