import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { MenuAction } from './widget/types';

/** Zugängliches Kontextmenü: Pfeiltasten, Esc, Klick außerhalb schließt. */
export function Menu({ label, trigger, items, align = 'end', className = 'icon small ghost' }: {
  label: string; trigger: ReactNode; items: MenuAction[]; align?: 'start' | 'end'; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  function onKey(e: React.KeyboardEvent) {
    const list = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); btn.current?.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); list[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); list[list.length - 1]?.focus(); }
    else if (e.key === 'Tab') setOpen(false);
  }

  return (
    <div className="menu" ref={root} onKeyDown={onKey}>
      <button ref={btn} type="button" className={className} aria-label={label} title={label}
        aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {trigger}
      </button>
      {open && (
        <div className={`menu__list menu__list--${align}`} role="menu" id={id} aria-label={label}>
          {items.map((it, i) => (
            <button key={it.id} ref={(el) => { itemRefs.current[i] = el; }} type="button" role="menuitem"
              className={`menu__item${it.danger ? ' menu__item--danger' : ''}`} tabIndex={-1}
              onClick={() => { setOpen(false); btn.current?.focus(); it.onSelect(); }}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
