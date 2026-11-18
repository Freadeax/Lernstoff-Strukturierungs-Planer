// Kleine Monitorkurve für den geschrumpften Streifen (iPhone, E8): EKG bei laufendem Monitor, sonst Pleth vom Pulsoxymeter.
// Läuft nur, solange sie sichtbar ist; bei „Bewegung reduzieren“ steht ein Standbild.
import { useEffect, useRef } from 'react';
import { ekg, pleth, proSekunde } from '../../../ui/sim/monitor';
import { wenigBewegung } from '../../../ui/shell/session';

const B = 96, H = 36, SEK = 3;

export function StreifenKurve({ art, puls, aktiv }: { art: 'ekg' | 'pleth'; puls: number; aktiv: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pulsRef = useRef(puls);
  pulsRef.current = puls;
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = B * dpr; c.height = H * dpr; ctx.scale(dpr, dpr);
    const fn = art === 'ekg' ? ekg : pleth;
    const zeichne = (t: number) => {
      ctx.clearRect(0, 0, B, H);
      ctx.strokeStyle = art === 'ekg' ? '#8ff0c8' : '#7cc8ff'; ctx.lineWidth = 1.5; ctx.beginPath();
      const f = proSekunde(pulsRef.current, 20);
      for (let x = 0; x <= B; x++) {
        const y = H / 2 - fn((t - SEK + (x / B) * SEK) * f) * (H * 0.4);
        if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
    };
    if (!aktiv || wenigBewegung()) { zeichne(SEK); return; }
    let id = 0;
    const schleife = (ms: number) => { zeichne(ms / 1000); id = requestAnimationFrame(schleife); };
    id = requestAnimationFrame(schleife);
    return () => cancelAnimationFrame(id);
  }, [art, aktiv]);
  return <canvas ref={ref} className="ap-streifen-kurve" width={B} height={H} aria-hidden="true" />;
}
