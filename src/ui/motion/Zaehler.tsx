import { useEffect, useRef, useState } from 'react';
import { wenigBewegung } from '../shell/session';

const ZAHL = /^(\D*?)(\d+(?:[.,]\d+)?)(.*)$/s;

/** Zerlegt „85 %“ oder „1,5 Std.“ in Vorsatz, Zahl, Nachkommastellen und Rest. Ohne Zahl: null. */
export function zerlegeZahl(text: string): { vor: string; zahl: number; stellen: number; komma: boolean; nach: string } | null {
  const m = ZAHL.exec(text);
  if (!m) return null;
  const roh = m[2]!;
  const stellen = roh.includes(',') || roh.includes('.') ? roh.length - roh.search(/[.,]/) - 1 : 0;
  return { vor: m[1]!, zahl: Number(roh.replace(',', '.')), stellen, komma: roh.includes(','), nach: m[3]! };
}

/** Zwischenstand der Zählung als Text im Format des Zielwerts. */
export function zaehlText(text: string, anteil: number): string {
  const z = zerlegeZahl(text);
  if (!z || anteil >= 1) return text;
  const wert = (z.zahl * Math.max(anteil, 0)).toFixed(z.stellen);
  return `${z.vor}${z.komma ? wert.replace('.', ',') : wert}${z.nach}`;
}

/**
 * Zahl, die beim Erscheinen und bei Änderungen hochzählt (Kennzahlen). Bei reduzierter Bewegung
 * und ohne Zahl im Text steht sofort der Endwert da. Screenreader bekommen immer den Endwert.
 */
export function Zaehler({ wert, dauer = 700, className }: { wert: string; dauer?: number; className?: string }) {
  const [anteil, setAnteil] = useState(1);
  const erster = useRef(true);
  useEffect(() => {
    if (typeof requestAnimationFrame === 'undefined' || wenigBewegung() || !zerlegeZahl(wert)) { setAnteil(1); return; }
    let rahmen = 0;
    const start = performance.now() + (erster.current ? 150 : 0);
    erster.current = false;
    setAnteil(0);
    const schritt = (jetzt: number) => {
      const t = Math.min(Math.max((jetzt - start) / dauer, 0), 1);
      setAnteil(1 - (1 - t) ** 3);
      if (t < 1) rahmen = requestAnimationFrame(schritt);
    };
    rahmen = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(rahmen);
  }, [wert, dauer]);
  return (
    <span className={className}>
      <span aria-hidden="true">{zaehlText(wert, anteil)}</span>
      <span className="visually-hidden">{wert}</span>
    </span>
  );
}
