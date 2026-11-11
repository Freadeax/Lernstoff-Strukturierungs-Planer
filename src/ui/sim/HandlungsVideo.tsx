import { useEffect, useRef, useState } from 'react';
import { wenigBewegung } from '../shell/session';
import { HANDLUNGSVIDEOS, phasenBild, videoPfad, type HandlungsVideoId } from './handlungsvideos';
import './handlungsvideo.css';

type Props = {
  id: HandlungsVideoId;
  onClose: () => void;
  /** Optional: Handlung im Fall bestätigen. Fehlt es, ist die Ansicht nur ein Lernclip ohne Folgen. */
  onBestaetigen?: () => void;
  /** Bereits bestätigt: Knopf gesperrt, damit Wiederholen/Doppel-Tippen nichts erneut auslöst. */
  bestaetigt?: boolean;
  /** Zusatztext aus dem Fall (z. B. Anordnung), wird über dem Video gezeigt. */
  fall?: string;
};

/**
 * Detailansicht einer Handlung: Video (stumm, Schleife) oder bei reduzierter Bewegung die vier
 * Phasenbilder. Wiedergabe, Pause und Schließen verändern den Fall nie; nur die ausdrückliche
 * Bestätigung ruft onBestaetigen, und das genau einmal.
 */
export function HandlungsVideo({ id, onClose, onBestaetigen, bestaetigt = false, fall }: Props) {
  const info = HANDLUNGSVIDEOS[id];
  const dialog = useRef<HTMLDialogElement>(null);
  const [standbild, setStandbild] = useState(wenigBewegung);
  const [phase, setPhase] = useState(0);
  const gebucht = useRef(bestaetigt);
  gebucht.current ||= bestaetigt;

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) { try { d.showModal(); } catch { d.setAttribute('open', ''); } }
    return () => { if (d?.open) d.close(); };
  }, []);

  return <dialog ref={dialog} className="hvideo" aria-labelledby={`hvideo-${id}`} onClose={onClose} onCancel={() => onClose()}>
    <div className="hvideo__kopf">
      <h2 id={`hvideo-${id}`}>{info.titel}</h2>
      <button type="button" onClick={() => dialog.current?.close()}>Schließen</button>
    </div>
    {fall && <p className="hvideo__fall">{fall}</p>}
    <div className="hvideo__bild">
      {standbild
        ? <img src={phasenBild(id, phase)} alt={`Phase ${phase + 1} von 4: ${info.phasen[phase]}`} width={836} height={470} />
        : <video src={videoPfad(id)} poster={phasenBild(id, 0)} autoPlay muted loop playsInline controls aria-label={`${info.titel}, Video ohne Ton`} />}
    </div>
    <div className="hvideo__phasen" role="group" aria-label="Phasen">
      {info.phasen.map((p, i) => <button key={p} type="button" aria-pressed={standbild && phase === i} onClick={() => { setStandbild(true); setPhase(i); }}>
        <span aria-hidden="true">{i + 1}</span>{p}
      </button>)}
      {standbild && !wenigBewegung() && <button type="button" onClick={() => setStandbild(false)}>Als Video abspielen</button>}
    </div>
    <p className="hvideo__hinweis">{info.hinweis} Darstellung · fachlich ungeprüft.</p>
    {onBestaetigen
      ? <button type="button" className="primary" disabled={gebucht.current} onClick={() => { if (gebucht.current) return; gebucht.current = true; onBestaetigen(); dialog.current?.close(); }}>
          {gebucht.current ? 'Bereits ausgeführt' : 'Handlung im Fall ausführen'}
        </button>
      : <p className="hvideo__nur">Nur zum Ansehen: Diese Ansicht verändert den Fall nicht.</p>}
  </dialog>;
}
