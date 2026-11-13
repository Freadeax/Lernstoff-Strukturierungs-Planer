import './wegweiser.css';
import { seitenInfo, WEGWEISER_PFAD } from './inhalt';

/**
 * Aufklappbare Kurzhilfe oben auf einer Seite der Lernorganisation: wozu, wann, wie, wohin weiter.
 * Zugeklappt nur eine Zeile, damit Geübte nicht gestört werden. Ohne Eintrag in SEITEN zeigt sie nichts.
 */
export default function SeitenHilfe({ path }: { path: string }) {
  const info = seitenInfo(path);
  if (!info) return null;
  return (
    <details className="note seitenhilfe">
      <summary>Wozu ist diese Seite da?</summary>
      <p><strong>{info.wozu}</strong></p>
      <p><span className="seitenhilfe__marke">Wann:</span> {info.wann}</p>
      <ul>{info.soGehts.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="seitenhilfe__links">
        {info.weiter && <a href={`#${info.weiter.path}`}>Weiter: {info.weiter.label}</a>}
        <a href={`#${WEGWEISER_PFAD}`}>So lernst du hier (alle Seiten und Begriffe)</a>
      </p>
    </details>
  );
}

export { SeitenHilfe };
