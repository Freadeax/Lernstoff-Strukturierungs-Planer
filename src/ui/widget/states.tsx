import type { CSSProperties } from 'react';
import { Icon } from '../icons';
import type { EmptySpec } from './types';
import { navigate } from '../shell/router';

/** Skelettbaustein. Größen nur über Tokens oder relative Werte. */
export function Bone({ w = '100%', h = 'var(--space-3)', r = 'var(--radius-xs)', style }: { w?: string; h?: string; r?: string; style?: CSSProperties }) {
  return <span className="bone" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />;
}

export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  return (
    <div className="stack-2" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => <Bone key={i} w={i === lines - 1 ? '60%' : '100%'} />)}
    </div>
  );
}

const ILLUSTRATION: Record<NonNullable<EmptySpec['illustration']>, string> = {
  dokumente: 'M22 14h28l12 12v40H22zM50 14v12h12M30 40h24M30 48h24M30 56h14',
  themen: 'M18 20h48M18 34h48M18 48h30M18 62h22',
  aktivitaet: 'M12 50h12l8-22 12 34 8-20 6 8h14',
  board: 'M14 16h16v52H14zM34 16h16v34H34zM54 16h16v22H54z',
  diagramm: 'M14 66V16M14 66h56M24 56V40M36 56V30M48 56V44M60 56V24',
  allgemein: 'M42 14a28 28 0 1 0 0 56 28 28 0 0 0 0-56zM42 30v16M42 54h.01',
};

export function EmptyState({ spec }: { spec: EmptySpec }) {
  const go = () => { if (spec.cta.onClick) spec.cta.onClick(); else if (spec.cta.href) navigate(spec.cta.href); };
  return (
    <div className="state state--empty">
      <svg className="state__art" viewBox="0 0 84 84" aria-hidden="true">
        <circle cx="42" cy="42" r="40" className="state__art-bg" />
        <path d={ILLUSTRATION[spec.illustration ?? 'allgemein']} />
      </svg>
      <p className="state__title">{spec.title}</p>
      <p className="state__msg">{spec.message}</p>
      <button type="button" className="primary" onClick={go}>{spec.cta.label}</button>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="state state--error" role="alert">
      <span className="state__icon"><Icon name="alert" size={28} /></span>
      <p className="state__title">Dieses Modul konnte nicht geladen werden</p>
      <p className="state__msg">{error.message || 'Unbekannter Fehler'}</p>
      <p className="state__msg muted">Die übrigen Module funktionieren weiter.</p>
      <button type="button" onClick={onRetry}><Icon name="refresh" size={16} /> Erneut versuchen</button>
    </div>
  );
}
