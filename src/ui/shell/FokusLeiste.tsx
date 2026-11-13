import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons';
import { useStore } from '../lib/store';
import { fokus, FOKUS_MINUTEN, PAUSE_MINUTEN, pausiereTimer, restzeit, setzeFokus, setzeFort, starteTimer, stoppeTimer, uhr } from './fokus';
import { seitenName } from './nav';
import { notify } from './notifications';
import { useRoute } from './router';
import { session, setWorkspace } from './session';
import './fokus.css';

/** Ist gerade die dunkle Darstellung aktiv (eingestellt oder vom System)? */
function istDunkel(theme: string) {
  if (theme === 'dunkel') return true;
  if (theme === 'hell') return false;
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Schmale Leiste im Fokus-Modus: Seite, Lernzeit-Timer, Hell/Dunkel, Beenden. */
export default function FokusLeiste() {
  const z = useStore(fokus, (s) => s);
  const theme = useStore(session, (s) => s.theme);
  const { path } = useRoute();
  const [jetzt, setJetzt] = useState(() => Date.now());
  const gemeldet = useRef<number | undefined>(undefined);
  const rest = restzeit(z, jetzt);
  const laeuft = z.ende !== undefined;

  useEffect(() => {
    if (!laeuft) return;
    const t = window.setInterval(() => setJetzt(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [laeuft]);

  // Einmal melden, wenn die Zeit abgelaufen ist.
  useEffect(() => {
    if (rest !== 0 || !z.ende || gemeldet.current === z.ende) return;
    gemeldet.current = z.ende;
    if (z.phase === 'lernen') notify('info', 'Lernzeit geschafft', `Gönn dir ${PAUSE_MINUTEN} Minuten Pause: aufstehen, trinken, Blick in die Ferne.`);
    else notify('info', 'Pause vorbei', 'Weiter geht es mit dem nächsten Block.');
  }, [rest, z.ende, z.phase]);

  const dunkel = istDunkel(theme);
  const name = seitenName(path) ?? 'Lernarbeitsplatz';
  const anteil = rest !== undefined && z.ende !== undefined ? 1 - rest / ((z.phase === 'pause' ? PAUSE_MINUTEN : z.minuten) * 60_000) : undefined;

  return (
    <div className="fokusleiste" role="region" aria-label="Fokus-Modus">
      <span className="fokusleiste__titel"><Icon name="maximize" size={16} /> <span><span className="fokusleiste__lang">Fokus: </span><strong>{name}</strong></span></span>
      <span className="fokusleiste__timer" role="group" aria-label="Lernzeit">
        {rest === undefined && (
          <>
            <span className="fokusleiste__label">Lernzeit</span>
            {FOKUS_MINUTEN.map((m) => (
              <button key={m} type="button" className="small" onClick={() => starteTimer(m)} aria-label={`${m} Minuten Lernzeit starten`}>{m} Min.</button>
            ))}
          </>
        )}
        {rest !== undefined && rest > 0 && (
          <>
            <span className={`fokusleiste__uhr${z.phase === 'pause' ? ' is-pause' : ''}`} aria-live="off">
              {z.phase === 'pause' ? 'Pause ' : ''}<time>{uhr(rest)}</time>
            </span>
            {laeuft
              ? <button type="button" className="small" onClick={() => pausiereTimer()}>Anhalten</button>
              : <button type="button" className="small" onClick={() => { setJetzt(Date.now()); setzeFort(); }}>Weiter</button>}
            <button type="button" className="small ghost" onClick={stoppeTimer}>Stopp</button>
          </>
        )}
        {rest === 0 && (
          <>
            <span className="fokusleiste__label">{z.phase === 'lernen' ? 'Geschafft!' : 'Pause vorbei'}</span>
            {z.phase === 'lernen'
              ? <button type="button" className="small primary" onClick={() => starteTimer(PAUSE_MINUTEN, 'pause')}>{PAUSE_MINUTEN} Min. Pause</button>
              : null}
            <button type="button" className="small" onClick={() => starteTimer(z.minuten)}>Nächste {z.minuten} Min.</button>
            <button type="button" className="small ghost" onClick={stoppeTimer}>Fertig</button>
          </>
        )}
      </span>
      <span className="fokusleiste__aktionen">
        <button type="button" className="small ghost" aria-pressed={dunkel} onClick={() => setWorkspace({ theme: dunkel ? 'hell' : 'dunkel' })}
          title="Dunkle Darstellung schont die Augen bei langen Einheiten">{dunkel ? 'Hell' : 'Dunkel'}</button>
        <button type="button" className="small" onClick={() => setzeFokus(false)} aria-keyshortcuts="Escape">
          <Icon name="close" size={16} /> <span className="fokusleiste__lang">Fokus beenden</span><span className="fokusleiste__kurz">Beenden</span>
        </button>
      </span>
      {anteil !== undefined && <span className="fokusleiste__fortschritt" aria-hidden="true" style={{ transform: `scaleX(${Math.min(1, Math.max(0, anteil))})` }} />}
    </div>
  );
}
