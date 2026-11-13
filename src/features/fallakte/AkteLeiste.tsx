// Schrittleiste einer Fallakte über den Trainern. Erscheint nur, wenn die Adresse ?akte= enthält.
// Zeigt, wo man in der Geschichte steht, und führt zum nächsten Schritt.
import { navigate, useRoute } from '../../ui/shell/router';
import { AKTEN } from './akten';
import { aktenStand, GUT_AB } from './stand';
import { ART_LABEL, schrittPfad, type SchrittArt } from './typen';
import './fallakte.css';

/** Aktuellen Schritt in der waagerecht scrollbaren Leiste sichtbar machen (nur waagerecht, die Seite bleibt stehen). */
function zeigeAktuellen(li: HTMLLIElement | null) {
  const ol = li?.parentElement;
  if (li && ol && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = Math.max(0, li.offsetLeft - ol.offsetLeft - 8);
}

export function AkteLeiste({ art, fallId }: { art: SchrittArt; fallId: string }) {
  const akteId = useRoute().params.get('akte');
  const akte = AKTEN.find((a) => a.id === akteId);
  if (!akte) return null;
  const i = akte.schritte.findIndex((s) => s.art === art && s.fallId === fallId);
  const zurAkte = `/lernen/fallakte?akte=${encodeURIComponent(akte.id)}`;
  if (i < 0) {
    return (
      <nav className="card akteleiste akteleiste--fremd" aria-label="Fallakte">
        <span>Dieser Fall gehört nicht zur Fallakte „{akte.titel}“.</span>
        <button type="button" className="ghost small" onClick={() => navigate(zurAkte)}>Zur Fallakte</button>
      </nav>
    );
  }
  const schritt = akte.schritte[i]!;
  const stand = aktenStand(akte);
  const folgend = akte.schritte[i + 1];
  return (
    <nav className="card akteleiste" aria-label={`Fallakte ${akte.titel}`}>
      <div className="akteleiste__kopf">
        <span className="badge badge--demo">Fallakte</span>
        <strong>{akte.titel}</strong>
        <span className="muted">Schritt {i + 1} von {akte.schritte.length} · {schritt.wann}</span>
      </div>
      <ol className="akteleiste__schritte">
        {akte.schritte.map((s, j) => {
          const p = stand.prozente[j];
          const zustand = j === i ? 'aktuell' : p === undefined ? 'offen' : p >= GUT_AB ? 'gut' : 'teil';
          return (
            <li key={s.id} className={`is-${zustand}`} ref={j === i ? zeigeAktuellen : undefined}>
              <button type="button" onClick={() => navigate(schrittPfad(akte.id, s))} aria-current={j === i ? 'step' : undefined}
                title={`${s.wann}: ${s.titel}${p !== undefined ? `, bisher ${p} %` : ''}`}>
                <span className="akteleiste__nr" aria-hidden="true">{j + 1}</span>
                <span className="akteleiste__name">{ART_LABEL[s.art]}{s.art === 'assessment' ? `: ${s.titel}` : ''}</span>
                {p !== undefined && <span className="akteleiste__wert">{p} %</span>}
              </button>
            </li>
          );
        })}
      </ol>
      <p className="akteleiste__auftrag">{schritt.auftrag}</p>
      <div className="row akteleiste__aktionen">
        <button type="button" className="ghost small" onClick={() => navigate(zurAkte)}>Fallakte</button>
        {folgend
          ? <button type="button" className="small" onClick={() => navigate(schrittPfad(akte.id, folgend))}>Weiter: {folgend.titel}</button>
          : <button type="button" className="small" onClick={() => navigate(zurAkte)}>Abschluss ansehen</button>}
      </div>
    </nav>
  );
}
