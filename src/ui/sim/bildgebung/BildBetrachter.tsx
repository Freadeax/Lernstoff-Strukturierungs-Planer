// Bildbetrachter wie an einer radiologischen Befundstation, für Finger, Maus und Tastatur.
// Blättern: senkrecht wischen, Mausrad, Pfeiltasten oder Schieberegler. Fenster: wischen ändert
// Breite (waagrecht) und Mitte (senkrecht), dazu Vorgaben. Lupe: gedrückt halten, zeigt Vergrößerung
// und Messwert (HU). Markieren: Tipp meldet die Stelle an den Aufrufer (Befund suchen).
// Messen: Strecke ziehen (mm, wenn der Pixelabstand bekannt ist) oder Kreis ziehen (ROI: Mittelwert
// und Streuung in HU). Eine Hervorhebung kann einen Bildbereich betonen (geführte Befundung).
// Bei „Bewegung reduzieren“ gibt es keine automatische Schichtwiedergabe.

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { grauTabelle, malePixel, vonRoh, type Fenster, type Rohbild } from './phantom';
import { anzahlSchichten, befundeAuf, bildNachweis, FENSTER, hatHu, istKalibriert, ladeSchicht, mmProPixel, modalitaetVon, type Befundmarke, type Bildserie } from './serie';
import { huDeutung, roiStatistik, streckeMm, streckePx, type Messung } from './messen';
import { wenigBewegung } from '../../shell/session';
import './bildgebung.css';

export type Werkzeug = 'blaettern' | 'fenster' | 'lupe' | 'markieren' | 'strecke' | 'roi';

/** Messung mit dem bei der Messung berechneten Ergebnistext. */
export type Gemessen = Messung & { text: string; mm?: number; mittel?: number };

/** Betonter Bildbereich (normiert), außerhalb wird abgedunkelt. */
export interface Hervorhebung { x: number; y: number; w: number; h: number }

export interface Markierung { x: number; y: number; schicht: number; richtig?: boolean }

export interface BildBetrachterProps {
  serie: Bildserie;
  /** Befunde, die eingeblendet werden (Kreise mit Titel). */
  sichtbareBefunde?: string[];
  /** Eigene Tipps der Lernenden. */
  markierungen?: Markierung[];
  /** Markieren-Werkzeug anbieten; Tipp liefert normierte Koordinaten. */
  onTipp?: (x: number, y: number, schicht: number) => void;
  /** Startschicht (sonst Mitte). */
  startSchicht?: number;
  onSchicht?: (i: number) => void;
  /** Mess-Werkzeuge anbieten (Standard: ja). */
  messen?: boolean;
  /** Meldet alle Messungen nach jeder Änderung. */
  onMessungen?: (m: Gemessen[]) => void;
  /** Bereich betonen (geführte Befundung); wechselt animiert. */
  hervorhebung?: Hervorhebung | null;
  /** Vorgeschlagenes Werkzeug; wird bei jeder Änderung gewählt. */
  werkzeugVorschlag?: Werkzeug;
}

/** Einstellung der App (data-motion) oder des Systems. */
const reduziert = () => wenigBewegung();
const fmt = (n: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(n);
const fmt1 = (n: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(n);

export function BildBetrachter({ serie, sichtbareBefunde = [], markierungen = [], onTipp, startSchicht, onSchicht, messen = true, onMessungen, hervorhebung, werkzeugVorschlag }: BildBetrachterProps) {
  const modalitaet = modalitaetVon(serie);
  const n = anzahlSchichten(serie);
  const vorgaben = FENSTER[modalitaet];
  const [schicht, setSchichtState] = useState(() => Math.min(n - 1, Math.max(0, startSchicht ?? Math.floor(n / 2))));
  const [fenster, setFenster] = useState<Fenster>(vorgaben[0]);
  const [invertiert, setInvertiert] = useState(false);
  const [werkzeug, setWerkzeug] = useState<Werkzeug>(werkzeugVorschlag ?? (n > 1 ? 'blaettern' : onTipp ? 'markieren' : 'lupe'));
  const [messungen, setMessungen] = useState<Gemessen[]>([]);
  const [entwurf, setEntwurf] = useState<Messung | null>(null);
  const [ansage, setAnsage] = useState('');
  const [bild, setBild] = useState<Rohbild | null>(null);
  // Messwerte in HU nur bei CT mit Rohdaten; ein 8-Bit-CT-Bild liefert nur Helligkeit in Prozent.
  const hu = hatHu(serie, bild);
  const skala: typeof modalitaet = hu ? 'ct' : 'roentgen';
  const einheit = hu ? 'HU' : '%';
  const [vollbild, setVollbild] = useState(false);
  const [cine, setCine] = useState(false);
  const [lupe, setLupe] = useState<{ x: number; y: number; wert: number } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const zug = useRef<{ x: number; y: number; schicht: number; fenster: Fenster; bewegt: boolean; p: { x: number; y: number } } | null>(null);
  const onMessungenRef = useRef(onMessungen);
  onMessungenRef.current = onMessungen;
  const radRest = useRef(0);

  const setSchicht = useCallback((i: number) => {
    const k = Math.max(0, Math.min(n - 1, Math.round(i)));
    setSchichtState(k);
    onSchicht?.(k);
  }, [n, onSchicht]);

  useEffect(() => { if (werkzeugVorschlag) setWerkzeug(werkzeugVorschlag); }, [werkzeugVorschlag]);

  // Serie gewechselt: zurücksetzen
  useEffect(() => {
    setSchichtState(Math.min(n - 1, Math.max(0, startSchicht ?? Math.floor(n / 2))));
    setFenster(FENSTER[modalitaetVon(serie)][0]);
    setInvertiert(false);
    setCine(false);
    setMessungen([]);
    setEntwurf(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serie.id]);

  // Aktuelle Schicht laden (Phantome werden berechnet und zwischengespeichert)
  useEffect(() => {
    let ab = false;
    ladeSchicht(serie, schicht).then((b) => { if (!ab) { setBild(b); setFehler(null); } }, (e) => { if (!ab) setFehler(String(e?.message ?? e)); });
    return () => { ab = true; };
  }, [serie, schicht]);

  // Nachbarschichten im Leerlauf vorberechnen, damit das Blättern flüssig bleibt
  useEffect(() => {
    if (n <= 1) return;
    let i = 0, id = 0;
    const reihe = Array.from({ length: n }, (_, k) => k).sort((a, b) => Math.abs(a - schicht) - Math.abs(b - schicht));
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const weiter = () => {
      if (i >= reihe.length) return;
      void ladeSchicht(serie, reihe[i++]).then(() => { id = ric ? ric(weiter) : window.setTimeout(weiter, 16); });
    };
    id = ric ? ric(weiter) : window.setTimeout(weiter, 16);
    return () => { i = reihe.length; if (!ric) clearTimeout(id); };
    // nur beim Wechsel der Serie neu starten
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serie.id]);

  // Schichtwiedergabe (Cine)
  useEffect(() => {
    if (!cine || n <= 1 || reduziert()) return;
    const id = window.setInterval(() => setSchichtState((s) => { const k = (s + 1) % n; onSchicht?.(k); return k; }), 110);
    return () => clearInterval(id);
  }, [cine, n, onSchicht]);

  const lut = useMemo(() => {
    const l = grauTabelle(modalitaet, fenster);
    if (invertiert) for (let i = 0; i < l.length; i++) l[i] = 255 - l[i];
    return l;
  }, [modalitaet, fenster, invertiert]);

  // Zeichnen
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !bild) return;
    let off = offRef.current;
    if (!off) off = offRef.current = document.createElement('canvas');
    if (off.width !== bild.breite || off.height !== bild.hoehe) { off.width = bild.breite; off.height = bild.hoehe; }
    const octx = off.getContext('2d');
    if (!octx) return;
    const data = octx.createImageData(bild.breite, bild.hoehe);
    malePixel(bild, lut, data.data);
    octx.putImageData(data, 0, 0);

    const r = c.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(off, 0, 0, w, h);
    // Befunde und Markierungen
    const kreis = (b: { x: number; y: number }, rr: number) => { ctx.beginPath(); ctx.arc(b.x * w, b.y * h, rr, 0, Math.PI * 2); };
    ctx.lineWidth = 2 * dpr;
    for (const b of befundeAuf(serie, schicht).filter((b) => sichtbareBefunde.includes(b.id))) {
      ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.strokeStyle = '#fbbf24';
      kreis(b, b.r * w);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const m of markierungen.filter((m) => m.schicht === schicht || n === 1)) {
      ctx.fillStyle = m.richtig === undefined ? '#38bdf8' : m.richtig ? '#4ade80' : '#f87171';
      ctx.strokeStyle = '#000';
      kreis(m, 7 * dpr); ctx.fill(); ctx.stroke();
    }
    // Messungen (gespeicherte und die gerade gezogene)
    const sichtbareMessungen: (Messung & { text?: string })[] = [...messungen.filter((m) => m.schicht === schicht), ...(entwurf ? [entwurf] : [])];
    ctx.font = `600 ${12 * dpr}px ui-monospace, Menlo, monospace`;
    for (const m of sichtbareMessungen) {
      const text = m.text ?? messText(m);
      ctx.strokeStyle = '#22d3ee'; ctx.fillStyle = '#22d3ee'; ctx.lineWidth = 2 * dpr;
      let tx: number, ty: number;
      if (m.art === 'strecke') {
        const ax = m.a.x * w, ay = m.a.y * h, bx = m.b.x * w, by = m.b.y * h;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        const nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny) || 1, k = 6 * dpr / nl;
        for (const [px, py] of [[ax, ay], [bx, by]]) { ctx.beginPath(); ctx.moveTo(px - nx * k, py - ny * k); ctx.lineTo(px + nx * k, py + ny * k); ctx.stroke(); }
        tx = (ax + bx) / 2 + 8 * dpr; ty = (ay + by) / 2 - 8 * dpr;
      } else {
        ctx.beginPath(); ctx.arc(m.x * w, m.y * h, m.r * w, 0, Math.PI * 2); ctx.stroke();
        tx = m.x * w + m.r * w + 6 * dpr; ty = m.y * h;
      }
      const tw = ctx.measureText(text).width;
      tx = Math.min(tx, w - tw - 6 * dpr); ty = Math.max(16 * dpr, Math.min(ty, h - 6 * dpr));
      ctx.fillStyle = '#000b'; ctx.fillRect(tx - 4 * dpr, ty - 13 * dpr, tw + 8 * dpr, 18 * dpr);
      ctx.fillStyle = '#a5f3fc'; ctx.fillText(text, tx, ty);
    }
    // Lupe
    if (lupe) {
      const radius = Math.min(w, h) * 0.17, faktor = 2.5;
      const quelleR = (radius / faktor) * (bild.breite / w);
      const lx = lupe.x * w, ly = Math.max(radius + 4, lupe.y * h - radius * 1.3);
      ctx.save();
      ctx.beginPath(); ctx.arc(lx, ly, radius, 0, Math.PI * 2); ctx.clip();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, lupe.x * bild.breite - quelleR, lupe.y * bild.hoehe - quelleR, quelleR * 2, quelleR * 2, lx - radius, ly - radius, radius * 2, radius * 2);
      ctx.restore();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * dpr;
      ctx.beginPath(); ctx.arc(lx, ly, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1 * dpr;
      ctx.beginPath(); ctx.moveTo(lx - 6 * dpr, ly); ctx.lineTo(lx + 6 * dpr, ly); ctx.moveTo(lx, ly - 6 * dpr); ctx.lineTo(lx, ly + 6 * dpr); ctx.stroke();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bild, lut, schicht, serie, sichtbareBefunde, markierungen, lupe, n, messungen, entwurf]);

  // Neu zeichnen bei Größenänderung
  const [, setTick] = useState(0);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // Mausrad blättert (passiver Listener ginge nicht: Seite soll dabei nicht scrollen)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || n <= 1) return;
    const rad = (e: WheelEvent) => {
      e.preventDefault();
      radRest.current += e.deltaY;
      const schritte = Math.trunc(radRest.current / 40);
      if (schritte) { radRest.current -= schritte * 40; setSchichtState((s) => { const k = Math.max(0, Math.min(n - 1, s + schritte)); onSchicht?.(k); return k; }); }
    };
    c.addEventListener('wheel', rad, { passive: false });
    return () => c.removeEventListener('wheel', rad);
  }, [n, onSchicht]);

  const normiert = (e: RPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) };
  };
  const messwert = (x: number, y: number) => {
    if (!bild) return 0;
    const px = Math.min(bild.breite - 1, Math.floor(x * bild.breite)), py = Math.min(bild.hoehe - 1, Math.floor(y * bild.hoehe));
    return vonRoh(skala, bild.werte[py * bild.breite + px]);
  };

  const mmPx = bild ? mmProPixel(serie, bild) : undefined;
  function messText(m: Messung): string {
    if (!bild) return '';
    if (m.art === 'strecke') {
      const mm = streckeMm(bild, m.a, m.b, mmPx);
      return mm !== undefined ? `${fmt1(mm)} mm` : `${fmt(streckePx(bild, m.a, m.b))} px`;
    }
    const r = roiStatistik(bild, skala, m.x, m.y, m.r, mmPx);
    return `Ø ${fmt(r.mittel)} ${einheit} ±${fmt(r.sd)}`;
  }
  const fertigMessen = (m: Messung) => {
    if (!bild) return;
    const text = messText(m);
    const mm = m.art === 'strecke' ? streckeMm(bild, m.a, m.b, mmPx) : undefined;
    const roi = m.art === 'roi' ? roiStatistik(bild, skala, m.x, m.y, m.r, mmPx) : undefined;
    const g: Gemessen = { ...m, text, mm, mittel: roi?.mittel };
    setMessungen((alt) => { const neu = [...alt, g]; onMessungenRef.current?.(neu); return neu; });
    setAnsage(m.art === 'strecke' ? `Strecke ${text}` : `Messkreis: Mittelwert ${fmt(roi!.mittel)} ${einheit}${hu ? `, ${huDeutung(roi!.mittel)}` : ''}`);
  };
  const loeschen = (id?: string) => setMessungen((alt) => { const neu = id ? alt.filter((m) => m.id !== id) : []; onMessungenRef.current?.(neu); return neu; });

  const runter = (e: RPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = normiert(e);
    zug.current = { x: e.clientX, y: e.clientY, schicht, fenster, bewegt: false, p };
    if (werkzeug === 'lupe') setLupe({ ...p, wert: messwert(p.x, p.y) });
    setCine(false);
  };
  const bewegen = (e: RPointerEvent<HTMLCanvasElement>) => {
    const z = zug.current;
    if (!z) return;
    const dx = e.clientX - z.x, dy = e.clientY - z.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) z.bewegt = true;
    if (werkzeug === 'blaettern' && n > 1) {
      const hoehe = e.currentTarget.getBoundingClientRect().height;
      setSchicht(z.schicht + (dy / hoehe) * n * 0.9);
    } else if (werkzeug === 'fenster') {
      const faktor = modalitaet === 'ct' ? 4 : 0.25;
      setFenster({ breite: Math.max(modalitaet === 'ct' ? 50 : 5, z.fenster.breite + dx * faktor), mitte: z.fenster.mitte - dy * faktor * 0.6 });
    } else if (werkzeug === 'lupe') {
      const p = normiert(e);
      setLupe({ ...p, wert: messwert(p.x, p.y) });
    } else if (werkzeug === 'strecke') {
      setEntwurf({ id: 'entwurf', art: 'strecke', schicht, a: z.p, b: normiert(e) });
    } else if (werkzeug === 'roi' && bild) {
      const p = normiert(e);
      const r = Math.hypot(p.x - z.p.x, (p.y - z.p.y) * (bild.hoehe / bild.breite));
      setEntwurf({ id: 'entwurf', art: 'roi', schicht, x: z.p.x, y: z.p.y, r });
    }
  };
  const hoch = (e: RPointerEvent<HTMLCanvasElement>) => {
    const z = zug.current;
    zug.current = null;
    setLupe(null);
    if (entwurf) {
      const gross = entwurf.art === 'strecke' ? Math.hypot(entwurf.b.x - entwurf.a.x, entwurf.b.y - entwurf.a.y) > 0.02 : entwurf.r > 0.008;
      if (gross) fertigMessen({ ...entwurf, id: `m${Date.now()}${Math.round(Math.random() * 1e4)}` } as Messung);
      setEntwurf(null);
    }
    if (werkzeug === 'markieren' && onTipp && z && !z.bewegt) {
      const p = normiert(e);
      onTipp(p.x, p.y, schicht);
    }
  };

  const taste = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = e.key;
    if (n > 1 && (k === 'ArrowUp' || k === 'ArrowLeft')) { e.preventDefault(); setSchicht(schicht - 1); }
    else if (n > 1 && (k === 'ArrowDown' || k === 'ArrowRight')) { e.preventDefault(); setSchicht(schicht + 1); }
    else if (n > 1 && k === 'PageUp') { e.preventDefault(); setSchicht(schicht - 5); }
    else if (n > 1 && k === 'PageDown') { e.preventDefault(); setSchicht(schicht + 5); }
    else if (n > 1 && k === 'Home') { e.preventDefault(); setSchicht(0); }
    else if (n > 1 && k === 'End') { e.preventDefault(); setSchicht(n - 1); }
    else if (k === 'Escape' && vollbild) setVollbild(false);
    else if (/^[1-9]$/.test(k) && vorgaben[Number(k) - 1]) setFenster(vorgaben[Number(k) - 1]);
  };

  useEffect(() => {
    if (!vollbild) return;
    const alt = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = alt; };
  }, [vollbild]);

  const vorgabe = vorgaben.find((v) => v.mitte === fenster.mitte && v.breite === fenster.breite);
  const zMm = (serie.schichtdicke ?? 5) * schicht;
  const sichtbar: Befundmarke[] = befundeAuf(serie, schicht).filter((b) => sichtbareBefunde.includes(b.id));
  const werkzeuge: { id: Werkzeug; label: string; zeichen: string }[] = [
    ...(n > 1 ? [{ id: 'blaettern' as const, label: 'Blättern', zeichen: '↕' }] : []),
    { id: 'fenster', label: 'Fenster', zeichen: '◐' },
    { id: 'lupe', label: 'Lupe', zeichen: '⌕' },
    ...(onTipp ? [{ id: 'markieren' as const, label: 'Markieren', zeichen: '✚' }] : []),
    ...(messen ? [{ id: 'strecke' as const, label: 'Strecke', zeichen: '↔' }, { id: 'roi' as const, label: 'Messkreis', zeichen: '⊙' }] : []),
  ];

  return (
    <div className={`bb${vollbild ? ' bb--vollbild' : ''}`} role={vollbild ? 'dialog' : undefined} aria-modal={vollbild || undefined} aria-label={vollbild ? serie.titel : undefined}>
      <div className="bb__kopf">
        <span className="bb__titel">{serie.untersuchung}</span>
        <button type="button" className="bb__knopf" onClick={() => setVollbild(!vollbild)} aria-pressed={vollbild}>{vollbild ? 'Schließen' : 'Vollbild'}</button>
      </div>
      <div className="bb__flaeche" tabIndex={0} onKeyDown={taste} aria-label={`${serie.titel}. ${n > 1 ? `Schicht ${schicht + 1} von ${n}. Pfeiltasten blättern.` : ''} Zahlen 1 bis ${vorgaben.length} wählen das Fenster.`}>
        <canvas
          ref={canvasRef}
          className={`bb__bild bb__bild--${werkzeug}`}
          style={{ aspectRatio: bild ? `${bild.breite} / ${bild.hoehe}` : '1 / 1' }}
          role="img"
          aria-label={`${modalitaet === 'ct' ? 'CT-Schicht' : 'Röntgenbild'}${serie.quelle.art === 'phantom' ? ', synthetisches Übungsbild' : ''}${sichtbar.length ? `. Markiert: ${sichtbar.map((b) => b.titel).join(', ')}` : ''}`}
          onPointerDown={runter} onPointerMove={bewegen} onPointerUp={hoch} onPointerCancel={() => { zug.current = null; setLupe(null); setEntwurf(null); }}
        />
        <div className="bb__ecke bb__ecke--ol" aria-hidden="true">{vorgabe ? vorgabe.name : 'Frei'}{invertiert ? ' · invertiert' : ''}<br />W {fmt(fenster.breite)} · L {fmt(fenster.mitte)}</div>
        {n > 1 && <div className="bb__ecke bb__ecke--or" aria-hidden="true">Schicht {schicht + 1}/{n}<br />z {fmt(zMm)} mm</div>}
        <div className="bb__ecke bb__ecke--ul" aria-hidden="true">R</div>
        <div className="bb__ecke bb__ecke--ur" aria-hidden="true">L</div>
        {hervorhebung && <div className="bb__fokus" aria-hidden="true" style={{ left: `${hervorhebung.x * 100}%`, top: `${hervorhebung.y * 100}%`, width: `${hervorhebung.w * 100}%`, height: `${hervorhebung.h * 100}%` }} />}
        {lupe && <div className="bb__messwert" aria-live="off">{fmt(lupe.wert)} {einheit}</div>}
        {!bild && !fehler && <div className="bb__laden">Bild wird berechnet …</div>}
        {fehler && <div className="bb__laden">Bild konnte nicht geladen werden: {fehler}</div>}
      </div>
      {n > 1 && (
        <div className="bb__schieber">
          <button type="button" className="bb__knopf" onClick={() => setSchicht(schicht - 1)} aria-label="Schicht zurück">▲</button>
          <input type="range" min={1} max={n} value={schicht + 1} onChange={(e) => setSchicht(Number(e.target.value) - 1)} aria-label="Schicht" aria-valuetext={`Schicht ${schicht + 1} von ${n}`} />
          <button type="button" className="bb__knopf" onClick={() => setSchicht(schicht + 1)} aria-label="Schicht vor">▼</button>
          {!reduziert() && <button type="button" className="bb__knopf" aria-pressed={cine} onClick={() => setCine(!cine)}>{cine ? 'Stopp' : 'Abspielen'}</button>}
        </div>
      )}
      <div className="bb__fenster" role="group" aria-label="Fenster">
        {vorgaben.map((v, k) => <button key={v.id} type="button" className="bb__chip" aria-pressed={vorgabe?.id === v.id} onClick={() => setFenster(v)} title={`Taste ${k + 1}`}>{v.name}</button>)}
        <button type="button" className="bb__chip" aria-pressed={invertiert} onClick={() => setInvertiert(!invertiert)}>Invertieren</button>
      </div>
      <div className="bb__werkzeuge" role="toolbar" aria-label="Werkzeug">
        {werkzeuge.map((w) => (
          <button key={w.id} type="button" aria-pressed={werkzeug === w.id} onClick={() => setWerkzeug(w.id)}>
            <span aria-hidden="true">{w.zeichen}</span>{w.label}
          </button>
        ))}
      </div>
      <p className="bb__ansage" role="status" aria-live="polite">{ansage}</p>
      {messungen.length > 0 && (
        <div className="bb__messungen">
          <ul aria-label="Messungen">
            {messungen.map((m, k) => (
              <li key={m.id}>
                <span>{k + 1}. {m.art === 'strecke' ? 'Strecke' : 'Messkreis'}{n > 1 ? ` (Schicht ${m.schicht + 1})` : ''}: <strong>{m.text}</strong>{m.mittel !== undefined && hu ? <span className="bb__deutung"> ({huDeutung(m.mittel)})</span> : null}</span>
                <button type="button" className="bb__knopf" onClick={() => loeschen(m.id)} aria-label={`Messung ${k + 1} löschen`}>×</button>
              </li>
            ))}
          </ul>
          <button type="button" className="bb__knopf" onClick={() => loeschen()}>Alle Messungen löschen</button>
        </div>
      )}
      {sichtbar.length > 0 && (
        <ul className="bb__befunde">
          {sichtbar.map((b) => <li key={b.id}><strong>{b.titel}:</strong> {b.text}</li>)}
        </ul>
      )}
      <p className="bb__hinweis">
        {werkzeug === 'blaettern' && 'Auf dem Bild hoch und runter wischen, Mausrad oder Pfeiltasten.'}
        {werkzeug === 'fenster' && 'Wischen: waagrecht = Fensterbreite (Kontrast), senkrecht = Fenstermitte (Helligkeit).'}
        {werkzeug === 'lupe' && `Gedrückt halten und bewegen: Vergrößerung und Messwert in ${einheit === 'HU' ? 'Hounsfield-Einheiten' : 'Prozent Helligkeit'}.`}
        {werkzeug === 'markieren' && 'Tippe auf die Stelle, die du für auffällig hältst.'}
        {werkzeug === 'strecke' && (mmPx ? `Strecke ziehen: Länge in Millimetern (${serie.pixelMm ? 'Maßstab aus den Bilddaten' : 'Übungsmaßstab des synthetischen Bildes, ungefähr'}).` : 'Strecke ziehen: Länge in Bildpunkten. Für dieses Bild ist kein Maßstab hinterlegt; Verhältnisse (z. B. Herz zu Thorax) gehen trotzdem.')}
        {werkzeug === 'roi' && (hu ? 'Kreis aufziehen: Mittelwert und Streuung der Dichte in HU, z. B. Erguss (um 0) oder Kontrast im Gefäß (über 200).' : 'Kreis aufziehen: mittlere Helligkeit in Prozent.')}
      </p>
      <Nachweis serie={serie} hu={hu} />
    </div>
  );
}

/** Bildart, Quelle, Lizenz, Bearbeitung und was die Messwerte bedeuten (Audit SIM-08). */
function Nachweis({ serie, hu }: { serie: Bildserie; hu: boolean }) {
  const n = bildNachweis(serie);
  const ct = serie.quelle.modalitaet === 'ct';
  return (
    <dl className="bb__nachweis" aria-label="Bildnachweis">
      <div><dt>Bildart</dt><dd>{n.bildart}</dd></div>
      <div><dt>Quelle</dt><dd>{n.url ? <a href={n.url} target="_blank" rel="noreferrer">{n.quelle}</a> : n.quelle}</dd></div>
      <div><dt>Lizenz</dt><dd>{n.lizenz}</dd></div>
      <div><dt>Bearbeitung</dt><dd>{n.bearbeitung}</dd></div>
      <div><dt>Messen</dt><dd>{istKalibriert(serie) ? (serie.pixelMm ? 'mm nach hinterlegtem Maßstab' : 'mm nach Übungsmaßstab, ungefähr') : 'kein Maßstab, Längen nur in Bildpunkten'}; {hu ? 'Dichte in HU aus Rohdaten' : ct ? 'keine HU (Bild ohne Rohdaten), nur Helligkeit in %' : 'Helligkeit in %'}</dd></div>
    </dl>
  );
}

export default BildBetrachter;
