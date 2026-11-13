import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icons';
import { liegtUnter, segmentText, summiere, gesamt, type BaumKnoten, type BaumSegment } from './baum';
import './baum.css';

// Aufklappbarer Baum als verschachtelte Liste mit Aufklapp-Knöpfen (robuster als role="tree",
// wenn Zeilen Links und Knöpfe enthalten). Pfeiltasten springen zwischen den Zeilen:
// ↑/↓ nächste Zeile, → aufklappen, ← zuklappen bzw. zum Oberknoten.
// Umhängen per Ziehen am Griff (Maus, Finger, Stift); die Tastatur-Alternative liefert die Seite (z. B. „Umhängen“).

export function Balken({ segmente, klein }: { segmente: BaumSegment[]; klein?: boolean }) {
  const g = gesamt(segmente);
  return (
    <span className={`baum-balken${klein ? ' baum-balken--klein' : ''}`} role="img" aria-label={segmentText(segmente)} title={segmentText(segmente)}>
      {g > 0 && segmente.map((s) => s.wert > 0 && <span key={s.key} className={`baum-balken__teil baum-ton--${s.ton}`} style={{ flexGrow: s.wert }} />)}
    </span>
  );
}

interface Props {
  knoten: BaumKnoten[];
  /** Name der Liste für Screenreader. */
  label: string;
  offen: ReadonlySet<string>;
  onOffen: (id: string, offen: boolean) => void;
  /** Zahl rechts am Balken, z. B. „3/12 sicher“. Ohne Angabe: Anzahl der Einträge. */
  zahl?: (segmente: BaumSegment[], k: BaumKnoten) => string;
  /** Umhängen per Ziehen; ohne Angabe gibt es keine Griffe. */
  onVerschiebe?: (id: string, zielId: string) => void;
  /** Zusätzliche Prüfung, ob `id` auf `zielId` abgelegt werden darf (Ziel wird nur dann hervorgehoben). */
  darfAblegen?: (id: string, zielId: string) => boolean;
  /** Hervorgehobene Zeile (z. B. nach dem Springen). */
  markiert?: string;
}

interface Zug { id: string; label: string; x: number; y: number; ziel?: string }

export function Baum({ knoten, label, offen, onOffen, zahl, onVerschiebe, darfAblegen, markiert }: Props) {
  const wurzel = useRef<HTMLUListElement>(null);
  const [zug, setZug] = useState<Zug | null>(null);

  useEffect(() => {
    if (!markiert) return;
    const el = wurzel.current?.querySelector<HTMLElement>(`[data-baum-id="${CSS.escape(markiert)}"] [data-baum-fokus]`);
    el?.scrollIntoView({ block: 'center' });
  }, [markiert]);

  function fokusZeilen(): HTMLElement[] {
    return [...(wurzel.current?.querySelectorAll<HTMLElement>('[data-baum-fokus]') ?? [])];
  }

  function onKey(e: KeyboardEvent<HTMLUListElement>) {
    const t = e.target as HTMLElement;
    if (!t.matches('[data-baum-fokus]')) return;
    const zeile = t.closest<HTMLElement>('[data-baum-id]');
    const id = zeile?.dataset.baumId;
    if (!zeile || !id) return;
    const alle = fokusZeilen();
    const i = alle.indexOf(t);
    const hatKinder = zeile.dataset.kinder === 'ja';
    const istOffen = offen.has(id);
    const gehe = (el?: HTMLElement) => { if (el) { e.preventDefault(); el.focus(); } };
    switch (e.key) {
      case 'ArrowDown': gehe(alle[i + 1]); break;
      case 'ArrowUp': gehe(alle[i - 1]); break;
      case 'Home': gehe(alle[0]); break;
      case 'End': gehe(alle[alle.length - 1]); break;
      case 'ArrowRight':
        if (hatKinder && !istOffen) { e.preventDefault(); onOffen(id, true); } else if (hatKinder) gehe(alle[i + 1]);
        break;
      case 'ArrowLeft':
        if (hatKinder && istOffen) { e.preventDefault(); onOffen(id, false); } else {
          const eltern = zeile.parentElement?.closest<HTMLElement>('[data-baum-id]');
          gehe(eltern?.querySelector<HTMLElement>('[data-baum-fokus]') ?? undefined);
        }
        break;
    }
  }

  function zieheStart(e: RPointerEvent<HTMLButtonElement>, k: BaumKnoten) {
    if (!onVerschiebe || e.button !== 0) return;
    e.preventDefault();
    const griff = e.currentTarget;
    griff.setPointerCapture(e.pointerId);
    let aktuell: Zug = { id: k.id, label: k.label, x: e.clientX, y: e.clientY };
    setZug(aktuell);
    const zielUnter = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-ablage="ja"]');
      const ziel = el?.dataset.baumId;
      return ziel && ziel !== k.id && !liegtUnter(knoten, k.id, ziel) && (darfAblegen?.(k.id, ziel) ?? true) ? ziel : undefined;
    };
    const bewege = (ev: PointerEvent) => { aktuell = { ...aktuell, x: ev.clientX, y: ev.clientY, ziel: zielUnter(ev.clientX, ev.clientY) }; setZug(aktuell); };
    const ende = (ev: PointerEvent) => {
      griff.removeEventListener('pointermove', bewege);
      griff.removeEventListener('pointerup', ende);
      griff.removeEventListener('pointercancel', ende);
      setZug(null);
      if (ev.type === 'pointerup' && aktuell.ziel) onVerschiebe(k.id, aktuell.ziel);
    };
    griff.addEventListener('pointermove', bewege);
    griff.addEventListener('pointerup', ende);
    griff.addEventListener('pointercancel', ende);
  }

  function zeile(k: BaumKnoten, tiefe: number) {
    const kinder = k.kinder ?? [];
    const istOffen = kinder.length > 0 && offen.has(k.id);
    const seg = summiere(k);
    const listeId = `baum-${k.id.replace(/[^\w-]/g, '_')}`;
    return (
      <li key={k.id} data-baum-id={k.id} data-kinder={kinder.length ? 'ja' : 'nein'} data-ablage={k.ablage ? 'ja' : undefined}
        className={`baum__knoten${zug?.ziel === k.id ? ' is-ziel' : ''}${zug?.id === k.id ? ' is-gezogen' : ''}${markiert === k.id ? ' is-markiert' : ''}`}
        style={{ '--tiefe': tiefe } as React.CSSProperties}>
        <div className={`baum__zeile${tiefe === 0 ? ' baum__zeile--wurzel' : ''}`}>
          {kinder.length > 0
            ? <button type="button" className="baum__auf" data-baum-fokus aria-expanded={istOffen} aria-controls={listeId}
                onClick={() => onOffen(k.id, !istOffen)}>
                <Icon name="chevronRight" size={16} />
                <span className="baum__name">{k.label}</span>
                <span className="visually-hidden">, {kinder.length} Einträge</span>
              </button>
            : k.href
              ? <a className="baum__auf baum__auf--blatt" data-baum-fokus href={`#${k.href}`}><span className="baum__name">{k.label}</span></a>
              : <span className="baum__auf baum__auf--blatt" data-baum-fokus tabIndex={0}><span className="baum__name">{k.label}</span></span>}
          {kinder.length > 0 && k.href && <a className="baum__oeffnen" href={`#${k.href}`} aria-label={`${k.label} öffnen`}>Öffnen</a>}
          <span className="baum__stand">
            {seg.length > 0 && <Balken segmente={seg} klein={!kinder.length} />}
            <span className="baum__zahl">{zahl ? zahl(seg, k) : String(gesamt(seg))}</span>
          </span>
          {k.hinweis && <span className="baum__hinweis">{k.hinweis}</span>}
          {k.zusatz && <span className="baum__zusatz">{k.zusatz}</span>}
          {onVerschiebe && k.ziehbar && (
            <button type="button" className="baum__griff" tabIndex={-1} aria-hidden="true" title="Zum Umhängen ziehen" onPointerDown={(e) => zieheStart(e, k)}>
              <Icon name="grip" size={16} />
            </button>
          )}
        </div>
        {istOffen && <ul id={listeId} className="baum__liste">{kinder.map((c) => zeile(c, tiefe + 1))}</ul>}
      </li>
    );
  }

  return (
    <>
      <ul ref={wurzel} className={`baum${zug ? ' is-ziehen' : ''}`} aria-label={label} onKeyDown={onKey}>
        {knoten.map((k) => zeile(k, 0))}
      </ul>
      {zug && createPortal(
        <div className="baum__geist" style={{ transform: `translate(${zug.x + 12}px, ${zug.y + 8}px)` }} aria-hidden="true">
          {zug.label}{zug.ziel ? '' : ' (hier nicht ablegbar)'}
        </div>, document.body)}
    </>
  );
}
