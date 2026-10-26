import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons';
import { useStore } from '../lib/store';
import { isActive, useRoute } from './router';
import { NAV, visibleNav, type NavItem } from './nav';
import { session } from './session';

function NavTree({ items, level, path, collapsed }: { items: NavItem[]; level: number; path: string; collapsed: boolean }) {
  return (
    <ul className={`nav__list nav__list--l${level}`} role="list">
      {items.map((item) => <NavEntry key={item.id} item={item} level={level} path={path} collapsed={collapsed} />)}
    </ul>
  );
}

function NavEntry({ item, level, path, collapsed }: { item: NavItem; level: number; path: string; collapsed: boolean }) {
  const containsActive = !!item.children?.some((c) => c.path && isActive(c.path, path));
  const [open, setOpen] = useState(item.id !== 'ueben' || containsActive);
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
          <span className="nav__chevron"><Icon name={open ? 'chevronDown' : 'chevronRight'} size={16} /></span>
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

export function Sidebar() {
  const { path } = useRoute();
  const roles = useStore(session, (s) => s.roles);
  const collapsed = useStore(session, (s) => s.sidebarCollapsed);
  const drawer = useStore(session, (s) => s.drawerOpen);
  const items = visibleNav(NAV, roles);
  const aside = useRef<HTMLElement>(null);
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
        <nav className="sidebar__nav" aria-label="Bereiche">
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
  const roles = useStore(session, (s) => s.roles);
  const drawer = useStore(session, (s) => s.drawerOpen);
  const flat = (items: NavItem[]): NavItem[] => items.flatMap((i) => [...(i.tab ? [i] : []), ...flat(i.children ?? [])]);
  const tabs = flat(visibleNav(NAV, roles)).filter((t) => ['uebersicht', 'plan', 'karten', 'dokumente'].includes(t.id));
  return (
    <nav className="shell__tabbar" aria-label="Schnellzugriff" inert={drawer}>
      {tabs.map((t) => {
        const active = t.path === '/' ? path === '/' : isActive(t.path!, path);
        return (
          <a key={t.id} href={`#${t.path}`} className={`tab${active ? ' tab--active' : ''}`} aria-current={active ? 'page' : undefined}>
            {t.icon && <Icon name={t.icon} size={22} />}
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
