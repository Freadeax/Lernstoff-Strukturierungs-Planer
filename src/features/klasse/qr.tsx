import { useEffect, useMemo } from 'react';
import qrcode from 'qrcode-generator';

/**
 * Über etwa 2000 Zeichen wird der Code so fein (über 150 Module), dass Handykameras ihn
 * vom Beamer kaum noch lesen. Technisch ginge es bis 2953 Byte.
 */
export const QR_MAX = 2000;

/** QR-Code als SVG-Pfad. null, wenn der Text zu lang ist. */
export function qrPfad(text: string): { pfad: string; groesse: number } | null {
  if (text.length > QR_MAX) return null;
  try {
    const qr = qrcode(0, 'L');
    qr.addData(text, 'Byte');
    qr.make();
    const n = qr.getModuleCount();
    let pfad = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) pfad += `M${c} ${r}h1v1h-1z`;
    return { pfad, groesse: n };
  } catch {
    return null;
  }
}

/** Vollbild zum Zeigen am Beamer oder Tablet. Schließen mit Klick, Esc oder Knopf. */
export function QrVollbild({ text, titel, onClose }: { text: string; titel: string; onClose: () => void }) {
  const qr = useMemo(() => qrPfad(text), [text]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  if (!qr) return null;
  const rand = 4;
  // Ganze Pixel je Modul: verwischte Kanten machen dichte Codes für Kameras unlesbar
  const gesamt = qr.groesse + 2 * rand;
  const px = Math.max(1, Math.floor(Math.min(window.innerWidth * 0.92, window.innerHeight * 0.8) / gesamt)) * gesamt;
  return (
    <div className="klasse__qr" role="dialog" aria-modal="true" aria-label={`QR-Code: ${titel}`} onClick={onClose}>
      <p className="klasse__qr-titel">{titel}</p>
      <svg width={px} height={px} viewBox={`${-rand} ${-rand} ${gesamt} ${gesamt}`} shapeRendering="crispEdges" role="img" aria-label="QR-Code mit dem Link zum Fall">
        <rect x={-rand} y={-rand} width={gesamt} height={gesamt} fill="#fff" />
        <path d={qr.pfad} fill="#000" />
      </svg>
      <p className="klasse__qr-hinweis">Mit der Kamera scannen · Tippen zum Schließen</p>
      <button type="button" className="primary" onClick={onClose} autoFocus>Schließen</button>
    </div>
  );
}
