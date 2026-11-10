import { useEffect, useRef, useState } from 'react';
import { wenigBewegung } from '../../ui/shell/session';

/** true bei reduzierter Bewegung: Systemeinstellung oder App-Einstellung (data-motion="reduce"). */
export function useReducedMotion(): boolean {
  const [reduziert, setReduziert] = useState(wenigBewegung);
  useEffect(() => {
    const pruefen = () => setReduziert(wenigBewegung());
    const query = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    query?.addEventListener?.('change', pruefen);
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(pruefen) : null;
    mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    return () => { query?.removeEventListener?.('change', pruefen); mo?.disconnect(); };
  }, []);
  return reduziert;
}

/** EKG-Form über eine Herzperiode (0…1): P-Welle, QRS-Komplex, T-Welle. */
export function ekg(phase: number): number {
  const g = (mu: number, sigma: number, a: number) => a * Math.exp(-((phase - mu) ** 2) / (2 * sigma ** 2));
  return g(0.18, 0.025, 0.12) + g(0.3, 0.008, -0.12) + g(0.32, 0.01, 1) + g(0.345, 0.01, -0.25) + g(0.58, 0.05, 0.25);
}
/** Pulsoxymetrie-Kurve, leicht verzögert zum EKG. */
export function pleth(phase: number): number {
  const p = (phase + 0.6) % 1;
  return Math.exp(-((p - 0.25) ** 2) / 0.012) + 0.35 * Math.exp(-((p - 0.5) ** 2) / 0.006);
}

type Props = {
  aktiv: boolean; puls: number; spo2: number; af: number; alarm: 'kein' | 'gelb' | 'rot';
  /** Echte Herzfrequenz-Töne (nur nach bewusster Freigabe). */
  ton?: boolean;
};

/**
 * Kleiner Bildschirm am Bettplatz: EKG und Pleth laufen als Sweep in Echtzeit passend zu Puls
 * und SpO₂. Ohne Monitoring bleibt der Schirm dunkel. Bei reduzierter Bewegung: Standbild.
 */
export function MiniMonitor({ aktiv, puls, spo2, af, alarm, ton = false }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const werte = useRef({ puls, spo2, af, alarm, ton });
  werte.current = { puls, spo2, af, alarm, ton };
  const reduziert = useReducedMotion();

  useEffect(() => {
    const c = canvas.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    let breite = 0, hoehe = 0, x = 0, phase = 0, rest = 0, letzteZeit = 0, frame = 0, sichtbar = true;
    let lastEkg = 0, lastPleth = 0, schlag = false;
    let audio: AudioContext | null = null;
    const farbe = () => getComputedStyle(c);
    const groesse = () => {
      const r = c.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
      breite = Math.max(1, Math.round(r.width)); hoehe = Math.max(1, Math.round(r.height));
      c.width = breite * dpr; c.height = hoehe * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#04110f'; ctx.fillRect(0, 0, breite, hoehe); x = 0;
    };
    const zahlenBreite = () => breite >= 110 ? Math.round(breite * 0.3) : 0;
    const zahlen = () => {
      const zb = zahlenBreite(); if (!zb) return;
      const { puls: p, spo2: s, af: a, alarm: al } = werte.current;
      ctx.fillStyle = '#04110f'; ctx.fillRect(breite - zb, 0, zb, hoehe);
      const fs = Math.max(8, Math.min(20, hoehe / 4.2));
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.font = `600 ${fs}px ui-monospace, Menlo, monospace`;
      ctx.fillStyle = al === 'rot' ? '#ff6b6b' : '#5cf29a'; ctx.fillText(String(Math.round(p)), breite - 3, 2);
      ctx.fillStyle = s < 92 ? '#ffb347' : '#66e3ff'; ctx.fillText(String(Math.round(s)), breite - 3, hoehe / 3 + 1);
      ctx.fillStyle = a >= 25 || a <= 8 ? '#ffb347' : '#f4f1a6'; ctx.fillText(String(Math.round(a)), breite - 3, (2 * hoehe) / 3);
      ctx.font = `${Math.max(7, fs * 0.45)}px system-ui, sans-serif`; ctx.textAlign = 'left'; ctx.fillStyle = '#9fb9b2';
      ctx.textBaseline = 'bottom'; ctx.fillText('HF', breite - zb + 2, hoehe / 3 - 1); ctx.fillText('SpO₂', breite - zb + 2, (2 * hoehe) / 3 - 1); ctx.fillText('AF', breite - zb + 2, hoehe - 1);
    };
    const yEkg = (v: number) => hoehe * 0.42 - v * hoehe * 0.3;
    const yPleth = (v: number) => hoehe * 0.92 - v * hoehe * 0.28;
    const piep = () => {
      if (!werte.current.ton) return;
      try {
        audio ??= new AudioContext();
        const o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = 600 + Math.max(0, werte.current.spo2 - 80) * 12; g.gain.value = 0.04;
        o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.07);
      } catch { /* Ton ist nur Komfort */ }
    };
    const standbild = () => {
      groesse(); const kurve = breite - zahlenBreite() - 4;
      ctx.lineWidth = 1.4; ctx.strokeStyle = '#5cf29a'; ctx.beginPath();
      for (let i = 0; i <= kurve; i++) { const ph = (i / Math.max(1, kurve)) * 3 % 1; const y = yEkg(ekg(ph)); i ? ctx.lineTo(i, y) : ctx.moveTo(i, y); }
      ctx.stroke(); ctx.strokeStyle = '#66e3ff'; ctx.beginPath();
      for (let i = 0; i <= kurve; i++) { const ph = (i / Math.max(1, kurve)) * 3 % 1; const y = yPleth(pleth(ph)); i ? ctx.lineTo(i, y) : ctx.moveTo(i, y); }
      ctx.stroke(); zahlen();
    };
    const dunkel = () => {
      groesse(); ctx.fillStyle = '#5d736d'; ctx.font = `${Math.max(8, hoehe / 6)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (breite > 60) ctx.fillText('kein Signal', breite / 2, hoehe / 2);
    };
    groesse();
    if (!aktiv) { dunkel(); return; }
    if (reduziert) { standbild(); const t = window.setInterval(zahlen, 1000); return () => clearInterval(t); }
    void farbe;
    const tick = (zeit: number) => {
      frame = requestAnimationFrame(tick);
      if (!sichtbar) { letzteZeit = zeit; return; }
      const dt = Math.min(0.1, letzteZeit ? (zeit - letzteZeit) / 1000 : 0); letzteZeit = zeit;
      const kurve = breite - zahlenBreite() - 4; if (kurve < 10) return;
      const tempo = Math.max(30, kurve / 3); // etwa drei Sekunden pro Durchlauf
      const herz = 60 / Math.min(180, Math.max(30, werte.current.puls));
      // Bruchteile von Pixeln aufsparen: Tempo und Herzfrequenz hängen so nicht von der Bildrate ab.
      rest += dt * tempo; const schritte = Math.floor(rest); rest -= schritte;
      for (let i = 0; i < schritte; i++) {
        const altX = x; x += 1; phase += 1 / tempo / herz;
        if (phase >= 1) { phase -= 1; schlag = false; }
        if (!schlag && phase > 0.32) { schlag = true; piep(); }
        if (x > kurve) { x = 0; }
        ctx.fillStyle = '#04110f'; ctx.fillRect(x, 0, 8, hoehe);
        if (x === 0) { lastEkg = yEkg(ekg(phase)); lastPleth = yPleth(pleth(phase)); continue; }
        const e = yEkg(ekg(phase)), p = yPleth(pleth(phase));
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = werte.current.alarm === 'rot' ? '#ff8f8f' : '#5cf29a'; ctx.beginPath(); ctx.moveTo(altX, lastEkg); ctx.lineTo(x, e); ctx.stroke();
        ctx.strokeStyle = '#66e3ff'; ctx.beginPath(); ctx.moveTo(altX, lastPleth); ctx.lineTo(x, p); ctx.stroke();
        lastEkg = e; lastPleth = p;
      }
      if (Math.floor(zeit / 500) !== Math.floor((zeit - dt * 1000) / 500)) zahlen();
    };
    zahlen();
    frame = requestAnimationFrame(tick);
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { sichtbar = !!e?.isIntersecting; }) : null;
    io?.observe(c);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { groesse(); zahlen(); }) : null;
    ro?.observe(c);
    return () => { cancelAnimationFrame(frame); io?.disconnect(); ro?.disconnect(); void audio?.close(); };
  }, [aktiv, reduziert]);

  return <canvas ref={canvas} className="szene__bildschirm" aria-hidden="true" />;
}
