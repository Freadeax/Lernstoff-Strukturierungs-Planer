import { useEffect, useRef, useState } from 'react';
import { wenigBewegung } from '../shell/session';
import { FreigabeHinweis } from './FreigabeHinweis';
import { HANDLUNGSVIDEOS, phasenBild, videoPfad, type HandlungsVideoId } from './handlungsvideos';
import './handlungsvideo.css';

type Props = {
  id: HandlungsVideoId;
  onClose: () => void;
  /** Optional: Handlung im Fall ausführen. Fehlt es, ist die Ansicht nur ein Lernclip ohne Folgen. */
  onBestaetigen?: () => void;
  /** Bereits ausgeführt: Knopf gesperrt, damit Wiederholen/Doppel-Tippen nichts erneut auslöst. */
  bestaetigt?: boolean;
  /** Zusatztext aus dem Fall (z. B. Anordnung), wird über dem Bild gezeigt. */
  fall?: string;
};

type Modus = 'video' | 'schritte';

/**
 * Detailansicht einer Handlung (Audit Live-Fund 2). Drei Dinge sind getrennt:
 * 1. Medienstart: Das Video startet nur über „Video abspielen“, nie von selbst.
 * 2. Fortschritt: „Video x % angesehen“ bzw. „Schritt n von 4“ – reines Ansehen.
 * 3. Handlung im Fall: eigener Knopf, ruft onBestaetigen genau einmal. Ansehen zählt nie als Handlung.
 * Schrittmodus mit Phasenbild und Text ist immer verfügbar; bei reduzierter Bewegung Standard.
 * Fallback: Video lädt nicht → Schrittmodus mit Hinweis; Phasenbild lädt nicht → nur Schritttext.
 */
export function HandlungsVideo({ id, onClose, onBestaetigen, bestaetigt = false, fall }: Props) {
  const info = HANDLUNGSVIDEOS[id];
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [modus, setModus] = useState<Modus>(() => wenigBewegung() ? 'schritte' : 'video');
  const [videoFehlt, setVideoFehlt] = useState(false);
  const [bildFehlt, setBildFehlt] = useState<number[]>([]);
  const [phase, setPhase] = useState(0);
  const [gesehen, setGesehen] = useState<number[]>([]);
  const [laeuft, setLaeuft] = useState(false);
  const [prozent, setProzent] = useState(0);
  const [ausgefuehrt, setAusgefuehrt] = useState(bestaetigt);
  const gebucht = useRef(bestaetigt);
  gebucht.current ||= bestaetigt;

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) { try { d.showModal(); } catch { d.setAttribute('open', ''); } }
    return () => { if (d?.open) d.close(); };
  }, []);

  useEffect(() => { if (modus === 'schritte') setGesehen(g => g.includes(phase) ? g : [...g, phase]); }, [modus, phase]);

  const zeigeSchritt = (i: number) => { video.current?.pause(); setModus('schritte'); setPhase(Math.max(0, Math.min(3, i))); };
  const abspielen = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => { setVideoFehlt(true); setModus('schritte'); }); else v.pause();
  };

  const schritt = info.schritte[phase];
  const fortschritt = modus === 'video'
    ? `Video: ${prozent} % angesehen${laeuft ? ', läuft' : ''}`
    : `Schritt ${phase + 1} von 4 · ${gesehen.length} von 4 Schritten angesehen`;

  return <dialog ref={dialog} className="hvideo" aria-labelledby={`hvideo-${id}`} onClose={onClose} onCancel={() => onClose()}>
    <div className="hvideo__kopf">
      <h2 id={`hvideo-${id}`}>{info.titel}</h2>
      <FreigabeHinweis freigabe={info.freigabe} ort="chip" />
      <button type="button" onClick={() => dialog.current?.close()}>Schließen</button>
    </div>
    {fall && <p className="hvideo__fall">{fall}</p>}

    <div className="hvideo__modus" role="group" aria-label="Ansicht">
      <button type="button" aria-pressed={modus === 'video'} disabled={videoFehlt} onClick={() => setModus('video')}>Video</button>
      <button type="button" aria-pressed={modus === 'schritte'} onClick={() => zeigeSchritt(phase)}>Schritt für Schritt</button>
    </div>
    {videoFehlt && <p className="hvideo__ersatz" role="status">Das Video lässt sich hier nicht abspielen (zum Beispiel offline). Die Schritte zeigen denselben Ablauf.</p>}

    {modus === 'video' && !videoFehlt
      ? <>
          <div className="hvideo__bild">
            <video ref={video} src={videoPfad(id)} poster={phasenBild(id, 0)} muted playsInline preload="metadata" aria-label={`${info.titel}, Video ohne Ton`}
              onPlay={() => setLaeuft(true)} onPause={() => setLaeuft(false)} onEnded={() => { setLaeuft(false); setProzent(100); }}
              onTimeUpdate={e => { const v = e.currentTarget; if (v.duration) setProzent(p => Math.max(p, Math.round(v.currentTime / v.duration * 100))); }}
              onError={() => { setVideoFehlt(true); setModus('schritte'); }} />
          </div>
          <div className="hvideo__steuerung">
            <button type="button" className="primary" onClick={abspielen}>{laeuft ? 'Video anhalten' : prozent > 0 ? 'Video weiter abspielen' : 'Video abspielen'}</button>
            <progress max={100} value={prozent} aria-label="Video angesehen" />
          </div>
        </>
      : <div className="hvideo__schritt">
          <div className="hvideo__bild">
            {bildFehlt.includes(phase)
              ? <p className="hvideo__ohnebild">Phasenbild {phase + 1} fehlt. Der Schritt steht als Text daneben.</p>
              : <img src={phasenBild(id, phase)} alt={`Phase ${phase + 1} von 4: ${schritt.titel}`} width={836} height={470} onError={() => setBildFehlt(b => [...b, phase])} />}
          </div>
          <div className="hvideo__text">
            <h3>Schritt {phase + 1}: {schritt.titel}</h3>
            <p>{schritt.text}</p>
            <div className="hvideo__blaettern">
              <button type="button" disabled={phase === 0} onClick={() => zeigeSchritt(phase - 1)}>Zurück</button>
              <button type="button" disabled={phase === 3} onClick={() => zeigeSchritt(phase + 1)}>Weiter</button>
            </div>
          </div>
        </div>}

    <div className="hvideo__phasen" role="group" aria-label="Schritte">
      {info.schritte.map((p, i) => <button key={p.titel} type="button" aria-pressed={modus === 'schritte' && phase === i} onClick={() => zeigeSchritt(i)}>
        <span aria-hidden="true">{gesehen.includes(i) ? '✓' : i + 1}</span>{p.titel}
      </button>)}
    </div>
    <p className="hvideo__status" role="status">Ansehen: {fortschritt}. Ansehen verändert den Fall nicht.</p>
    <p className="hvideo__hinweis">{info.hinweis}</p>

    <section className="hvideo__fallbox" aria-label="Handlung im Fall">
      <h3>Im Fall</h3>
      <FreigabeHinweis freigabe={info.freigabe} ort="entscheidung" />
      {onBestaetigen
        ? <>
            <p>{ausgefuehrt ? 'Die Handlung ist im Fall gebucht.' : 'Noch nicht ausgeführt. Erst dieser Knopf bucht die Handlung im Fall, unabhängig davon, wie viel du angesehen hast.'}</p>
            <button type="button" className="primary" disabled={ausgefuehrt} onClick={() => { if (gebucht.current) return; gebucht.current = true; setAusgefuehrt(true); onBestaetigen(); dialog.current?.close(); }}>
              {ausgefuehrt ? 'Bereits ausgeführt' : 'Handlung im Fall ausführen'}
            </button>
          </>
        : <p className="hvideo__nur">Nur zum Ansehen: Diese Ansicht verändert keinen Fall.</p>}
    </section>
  </dialog>;
}
