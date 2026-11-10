import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon } from '../icons';
import { useStore } from '../lib/store';
import { isActive, useRoute } from './router';
import { flatNav, NAV, TABS, visibleNav, type NavItem } from './nav';
import { session } from './session';

function NavTree({ items, level, path, collapsed }: { items: NavItem[]; level: number; path: string; collapsed: boolean }) {
  return (
    <ul className={`nav__list nav__list--l${level}`} role="list">
      {items.map((item) => <NavEntry key={item.id} item={item} level={level} path={path} collapsed={collapsed} />)}
    </ul>
  );
}

function NavEntry({ item, level, path, collapsed }: { item: NavItem; level: number; path: string; collapsed: boolean }) {
  const containsActive = flatNav(item.children ?? []).some((c) => isActive(c.path!, path));
  const [open, setOpen] = useState(!item.zu || containsActive);
  useEffect(() => { if (containsActive) setOpen(true); }, [containsActive]);
  const close = () => session.set({ drawerOpen: false });

  if (item.children?.length) {
    const id = `nav-${item.id}`;
    return (
      <li className="nav__group">
        <button type="button" className={`nav__item nav__toggle${containsActive ? ' nav__item--within' : ''}`}
          aria-expanded={open || collapsed} aria-controls={id} onClick={() => setOpen(!open)} title={collapsed ? item.label : undefined}>
          {item.icon && <Icon name={item.icon} />}
          <span className="nav__label">{item.label}</span>
          <span className="nav__chevron"><Icon name="chevronRight" size={16} /></span>
        </button>
        <div id={id} hidden={!(open || collapsed)}>
          {level < 3 && <NavTree items={item.children} level={level + 1} path={path} collapsed={collapsed} />}
        </div>
      </li>
    );
  }
  const active = item.path ? (item.path === '/' ? path === '/' : isActive(item.path, path)) : false;
  return (
    <li>
      <a className={`nav__item${active ? ' nav__item--active' : ''}`} href={`#${item.path}`} aria-current={active ? 'page' : undefined}
        onClick={close} aria-label={collapsed ? item.label : undefined} title={collapsed ? item.label : undefined}>
        {item.icon && <Icon name={item.icon} />}
        <span className="nav__label">{item.label}</span>
      </a>
    </li>
  );
}

/**
 * Wandernde Markierung: misst den aktiven Menüpunkt und setzt Lage und Höhe als CSS-Variablen
 * am Menü. Die Bewegung selbst macht CSS (motion.css), bei reduzierter Bewegung ohne Übergang.
 */
function useMarkierung(nav: React.RefObject<HTMLElement | null>, deps: unknown[]) {
  useLayoutEffect(() => {
    const el = nav.current;
    if (!el) return;
    const messen = () => {
      const aktiv = el.querySelector<HTMLElement>('.nav__item--active');
      if (!aktiv || !aktiv.getClientRects().length) { el.dataset.markierung = 'aus'; return; }
      // Lage über offsetTop/offsetLeft: unabhängig von laufenden Einblend- und Hover-Verschiebungen.
      let x = 0, y = 0;
      for (let k: HTMLElement | null = aktiv; k && k !== el; k = k.offsetParent as HTMLElement | null) { x += k.offsetLeft; y += k.offsetTop; }
      el.style.setProperty('--mark-y', `${y}px`);
      el.style.setProperty('--mark-x', `${x}px`);
      el.style.setProperty('--mark-w', `${aktiv.offsetWidth}px`);
      el.style.setProperty('--mark-h', `${aktiv.offsetHeight}px`);
      // Erst nach der ersten Messung Übergänge erlauben, sonst fliegt die Markierung beim Laden von oben herein.
      if (el.dataset.markierung !== 'an') requestAnimationFrame(() => { el.dataset.markierung = 'an'; });
    };
    messen();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(messen);
    // Die Liste wächst und schrumpft beim Auf- und Zuklappen der Gruppen.
    ro.observe(el.firstElementChild ?? el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function Sidebar() {
  const { path } = useRoute();
  const roles = useStore(session, (s) => s.roles);
  const collapsed = useStore(session, (s) => s.sidebarCollapsed);
  const drawer = useStore(session, (s) => s.drawerOpen);
  const items = visibleNav(NAV, roles);
  const aside = useRef<HTMLElement>(null);
  const nav = useRef<HTMLElement>(null);
  useMarkierung(nav, [path, collapsed, drawer]);
  useEffect(() => {
    if (!drawer) return;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    aside.current?.querySelector<HTMLElement>('.sidebar__close')?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { session.set({ drawerOpen: false }); return; }
      if (e.key !== 'Tab') return;
      const nodes = [...(aside.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') ?? [])].filter((el) => el.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', trap);
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true });
    };
  }, [drawer]);
  return (
    <>
      {drawer && <div className="shell__scrim" onClick={() => session.set({ drawerOpen: false })} aria-hidden="true" />}
      <aside ref={aside} id="sidebar" className={`shell__sidebar${drawer ? ' is-open' : ''}`} aria-label="Hauptnavigation" role={drawer ? 'dialog' : undefined} aria-modal={drawer || undefined}
        onKeyDown={(e) => { if (e.key === 'Escape' && drawer) session.set({ drawerOpen: false }); }}>
        <div className="sidebar__brand">
          <span className="brand-mark" aria-hidden="true"><Icon name="book" size={23} /></span>
          <span className="nav__label brand-wordmark">Lernstoff<span>Dein Lernarbeitsplatz</span></span>
          <button type="button" className="icon ghost sidebar__close" aria-label="Navigation schließen" onClick={() => session.set({ drawerOpen: false })}><Icon name="close" /></button>
        </div>
        <nav ref={nav} className="sidebar__nav" aria-label="Bereiche">
          <NavTree items={items} level={1} path={path} collapsed={collapsed && !drawer} />
        </nav>
        <a className="sidebar__import" href="#/material/import" aria-label="Material hinzufügen" onClick={() => session.set({ drawerOpen: false })}><Icon name="plus" size={18} /><span className="nav__label">Material hinzufügen</span></a>
        <div className="sidebar__local"><span aria-hidden="true" /> <span className="nav__label">Deine Lerndaten bleiben bei dir</span></div>
        <button type="button" className="ghost sidebar__collapse" aria-label={collapsed ? 'Seitenleiste ausklappen' : 'Seitenleiste einklappen'} aria-expanded={!collapsed} aria-controls="sidebar"
          onClick={() => session.set({ sidebarCollapsed: !collapsed })}>
          <Icon name="sidebar" />
          <span className="nav__label">{collapsed ? 'Ausklappen' : 'Einklappen'}</span>
        </button>
      </aside>
    </>
  );
}

export function TabBar() {
  const { path } = useRoute();
  const drawer = useStore(session, (s) => s.drawerOpen);
  // Wandernde Markierung: Position des aktiven Ziels als CSS-Variable (−1 = keins aktiv).
  const aktiv = TABS.findIndex((t) => t.bereich(path));
  return (
    <nav className="shell__tabbar" aria-label="Schnellzugriff" inert={drawer} data-aktiv={aktiv >= 0 ? 'ja' : 'nein'}
      style={{ '--tab-i': Math.max(aktiv, 0), '--tab-n': TABS.length + 1 } as CSSProperties}>
      {TABS.map((t) => {
        const active = t.bereich(path);
        return (
          <a key={t.id} href={`#${t.path}`} className={`tab${active ? ' tab--active' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </a>
        );
      })}
      <button type="button" className="tab" aria-label="Alle Bereiche" aria-controls="sidebar" aria-expanded={drawer}
        onClick={() => session.set({ drawerOpen: true })}>
        <Icon name="menu" size={22} /><span>Mehr</span>
      </button>
    </nav>
  );
}
