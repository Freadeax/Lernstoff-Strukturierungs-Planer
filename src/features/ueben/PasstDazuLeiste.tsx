import { useMemo } from 'react';
import './passt-dazu.css';
import { Icon } from '../../ui/icons';
import { passtDazu } from './passtDazu';

const enc = encodeURIComponent;

/** Leiste am Ende jeder Übungsseite: verwandte Übungen, Themen dieser Übung, nächster Schritt, Rückmeldung. */
export default function PasstDazuLeiste({ id, path }: { id: string; path: string }) {
  const p = useMemo(() => passtDazu(id), [id]);
  const ziele = [...p.verwandt, ...p.weiter];
  return (
    <aside className="passt-dazu" aria-labelledby="passt-dazu-titel">
      <h2 id="passt-dazu-titel" className="passt-dazu__titel">Passt dazu</h2>
      {ziele.length > 0 && (
        <ul className="passt-dazu__ziele">
          {ziele.map((z) => (
            <li key={z.path}>
              <a className="passt-dazu__ziel" href={`#${z.path}`}>
                <span><strong>{z.label}</strong><small>{z.grund}</small></span>
                <Icon name="chevronRight" size={16} />
              </a>
            </li>
          ))}
        </ul>
      )}
      {p.themen.length > 0 && (
        <p className="passt-dazu__themen">
          <span className="muted">Themen dieser Übung:</span>{' '}
          {p.themen.map((t, i) => <span key={t.id}>{i > 0 && ' · '}<a href={`#/lernen/thema?id=${enc(t.id)}`}>{t.name}</a></span>)}
        </p>
      )}
      <p className="passt-dazu__rueck muted">Etwas aufgefallen? <a href={`#/system/test?ansicht=rueckmeldung&seite=${enc(path)}`}>Rückmeldung zu dieser Seite</a></p>
    </aside>
  );
}
