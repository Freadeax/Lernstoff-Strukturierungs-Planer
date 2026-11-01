import { useEffect, useRef, type ReactNode } from 'react';
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
import { SCHRIFTEN, session, setWorkspace, type Theme } from './session';
import { flatNav, NAV } from './nav';

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
  const themes: Array<[Theme, string]> = [['system', 'wie System'], ['hell', 'hell'], ['dunkel', 'dunkel']];
  return (
    <Menu label="Profil und Darstellung" trigger={<Icon name="user" />} className="icon ghost"
      items={[
        { id: 'settings', label: 'Einstellungen', onSelect: () => navigate('/einstellungen') },
        ...themes.map(([t, l]) => ({ id: `theme-${t}`, label: `${t === theme ? '✓ ' : ''}Darstellung ${l}`, onSelect: () => setWorkspace({ theme: t }) })),
        ...SCHRIFTEN.map(([g, l]) => ({ id: `schrift-${g}`, label: `${g === schrift ? '✓ ' : ''}Schrift ${l}`, onSelect: () => setWorkspace({ schrift: g }) })),
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
  const current = flatNav(NAV).find((item) => item.path === path)?.label ?? 'Lernarbeitsplatz';
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
      <div className="header-context"><span>Lernarbeitsplatz</span><Icon name="chevronRight" size={14} /><strong>{current}</strong></div>
      <OnlineStatus />
      <div className="shell__search"><Omnibar /></div>
      <div className="shell__actions">
        <WorkspaceSwitcher />
        <NotificationCenter />
        <ProfileMenu />
      </div>
    </header>
  );
}

/** App-Rahmen: Seitenleiste, Kopf, Inhalt, untere Leiste (Handy), Toasts. */
export function Shell({ children }: { children: ReactNode }) {
  const collapsed = useStore(session, (s) => s.sidebarCollapsed);
  const drawer = useStore(session, (s) => s.drawerOpen);
  const { path } = useRoute();
  const main = useRef<HTMLElement>(null);
  useMenueGesten();
  // Nach Seitenwechsel Fokus auf den Inhalt (Screenreader) und nach oben scrollen.
  const first = useRef(true);
  useEffect(() => {
    document.title = `${flatNav(NAV).find((item) => item.path === path)?.label ?? 'Lernarbeitsplatz'} · Lernstoff`;
    if (first.current) { first.current = false; return; }
    main.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [path]);

  return (
    <div className="shell" data-sidebar={collapsed ? 'collapsed' : 'expanded'}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); main.current?.focus(); }}>Zum Inhalt springen</a>
      <Sidebar />
      <Header />
      <main id="main" ref={main} className="shell__main" tabIndex={-1} inert={drawer}>
        <div className="content">{children}</div>
      </main>
      <TabBar />
      <Toaster />
      <Tastenkuerzel />
    </div>
  );
}
