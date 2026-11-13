import { useMemo } from 'react';
import { dayKey } from '../../ui/lib/time';
import { examensHinweis, inTagen, TERMIN_NAME } from './hinweis';
import { ladeCheckliste, ladeMuendlich, ladeTermine } from './speicher';

/** Kleiner Hinweis für die Übersicht: nur sichtbar, wenn ein Prüfungstermin eingetragen ist. */
export function ExamenHinweis() {
  const h = useMemo(() => examensHinweis(ladeTermine(), dayKey(new Date()), ladeCheckliste(), ladeMuendlich()), []);
  if (!h) return null;
  const [naechster, ...weitere] = h.termine;
  return (
    <p className={`note${h.schritt?.dringend ? ' warn' : ''}`} role="status">
      <strong>Examen:</strong> {TERMIN_NAME[naechster!.art]} {inTagen(naechster!.tage)}
      {weitere.length > 0 && <> ({weitere.map((t) => `${TERMIN_NAME[t.art].toLocaleLowerCase('de')} ${inTagen(t.tage)}`).join(', ')})</>}.{' '}
      {h.schritt
        ? <>{h.schritt.text} <a href={`#${h.schritt.path}`}>{h.schritt.label}</a></>
        : <a href="#/lernen/examen?ansicht=fahrplan">Fahrplan für diese Woche</a>}
    </p>
  );
}
