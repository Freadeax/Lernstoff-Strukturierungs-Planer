// Rückblick nach dem Fall: Szene für Szene noch einmal ansehen (Raumfoto bzw. Zeichnung,
// Monitor, deine Entscheidung und ihre Bewertung) und darüber die NEWS2-Kurve, auf der jede
// Entscheidung farbig markiert ist. Abspielen schaltet alle paar Sekunden weiter.

import { useEffect, useMemo, useState } from 'react';
import { PatientenMonitor } from '../../ui/sim/PatientenMonitor';
import { wenigBewegung } from '../../ui/shell/session';
import { FotoSzene } from './FotoSzene';
import { fotoRaumFuer } from './fotoraeume';
import { RAUM_FUER } from './raeume';
import { Szene } from './Szene';
import { szenenBild } from './szene';
import { news2, WERTUNG_LABEL, ZUSTAND_LABEL, type Fall, type Wertung } from './simulator';

const TAKT_MS = 4500;

/** NEWS2 und SpO₂ je Szene (null, solange Werte fehlen). Rein, für Test und Kurve. */
export function rueckblickPunkte(fall: Fall): Array<{ uhrzeit: string; news: number | null; spo2: number | null; wertung: Wertung; eingabe?: string }> {
  return fall.runden.map((r) => {
    const n = news2(r.zug.vitalwerte);
    const s = Number.parseFloat(r.zug.vitalwerte.spo2.replace(',', '.'));
    return { uhrzeit: r.zug.uhrzeit, news: n && !n.fehlt.length ? n.punkte : null, spo2: Number.isFinite(s) ? s : null, wertung: r.zug.rueckmeldung.wertung, eingabe: r.eingabe };
  });
}

type Punkte = ReturnType<typeof rueckblickPunkte>;
interface Massstab { name: string; wert: (p: Punkte[number]) => number | null; min: number; max: number; achse: number[]; baender: Array<{ von: number; bis: number; stufe: 'niedrig' | 'mittel' | 'hoch' }> }

const NEWS: Massstab = {
  name: 'NEWS2', wert: (p) => p.news, min: 0, max: 14, achse: [0, 5, 7],
  baender: [{ von: 0, bis: 5, stufe: 'niedrig' }, { von: 5, bis: 7, stufe: 'mittel' }, { von: 7, bis: 14, stufe: 'hoch' }],
};
const SPO2: Massstab = {
  name: 'SpO₂', wert: (p) => p.spo2, min: 80, max: 100, achse: [80, 92, 96, 100],
  baender: [{ von: 80, bis: 92, stufe: 'hoch' }, { von: 92, bis: 96, stufe: 'mittel' }, { von: 96, bis: 100, stufe: 'niedrig' }],
};
/** NEWS2, wenn es sich bilden lässt (Erwachsene); sonst die Sättigung (z. B. Kinder ohne Blutdruck). */
export const massstabFuer = (punkte: Punkte): Massstab => (punkte.filter((p) => p.news !== null).length >= 2 ? NEWS : SPO2);

function Verlaufskurve({ punkte, aktiv, onWahl }: { punkte: Punkte; aktiv: number; onWahl: (i: number) => void }) {
  const W = 600, H = 150, PAD = 30;
  const m = massstabFuer(punkte);
  const x = (i: number) => PAD + (punkte.length < 2 ? (W - 2 * PAD) / 2 : (i * (W - 2 * PAD)) / (punkte.length - 1));
  const y = (n: number) => H - PAD - ((Math.min(m.max, Math.max(m.min, n)) - m.min) / (m.max - m.min)) * (H - 2 * PAD);
  const linie = punkte.map((p, i) => { const w = m.wert(p); return w === null ? null : `${x(i)},${y(w)}`; }).filter(Boolean).join(' ');
  return (
    <div className="fall__rb-kurve">
      <p className="muted fall__rb-legende">{m.name}-Verlauf, jede Entscheidung farbig markiert (grün gut, gelb teilweise, orange ungünstig, rot gefährlich).</p>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
        {m.baender.map((b) => <rect key={b.von} x={PAD} y={y(b.bis)} width={W - 2 * PAD} height={y(b.von) - y(b.bis)} className={`fall__rb-band fall__rb-band--${b.stufe}`} />)}
        {m.achse.map((n) => <text key={n} x={PAD - 6} y={y(n) + 4} textAnchor="end" className="fall__rb-achse">{n}</text>)}
        <line x1={x(aktiv)} x2={x(aktiv)} y1={PAD / 2} y2={H - PAD / 2} className="fall__rb-jetzt" />
        {linie && <polyline points={linie} className="fall__rb-linie" />}
        {punkte.map((p, i) => {
          const w = m.wert(p);
          return (
            <g key={i}>
              <circle cx={x(i)} cy={w === null ? H - PAD : y(w)} r={i === aktiv ? 9 : 6} className={`fall__rb-punkt fall__rb-punkt--${p.wertung} ${w === null ? 'is-leer' : ''}`} />
              {w !== null && <text x={x(i)} y={y(w) - 13} textAnchor="middle" className="fall__rb-wert">{w}</text>}
            </g>
          );
        })}
      </svg>
      <ol className="fall__rb-schritte" aria-label="Szenen">
        {punkte.map((p, i) => (
          <li key={i}>
            <button type="button" aria-current={i === aktiv ? 'step' : undefined} className={`fall__rb-knopf fall__rb-knopf--${p.wertung}`}
              aria-label={`Szene ${i + 1}, ${p.uhrzeit} Uhr${p.news !== null ? `, NEWS2 ${p.news}` : p.spo2 !== null ? `, SpO₂ ${p.spo2} %` : ''}${p.wertung !== 'keine' ? `, Entscheidung ${WERTUNG_LABEL[p.wertung]}` : ''}`}
              onClick={() => onWahl(i)}>
              {i + 1}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Rueckblick({ fall }: { fall: Fall }) {
  const n = fall.runden.length;
  const [i, setI] = useState(0);
  const [laeuft, setLaeuft] = useState(false);
  const punkte = useMemo(() => rueckblickPunkte(fall), [fall]);
  const bild = useMemo(() => szenenBild({ ...fall, runden: fall.runden.slice(0, i + 1) }), [fall, i]);
  const foto = fotoRaumFuer(fall.szenario.id, fall.szenario.setting, fall.szenario.kurz);
  const runde = fall.runden[i];
  useEffect(() => {
    if (!laeuft) return;
    if (i >= n - 1) { setLaeuft(false); return; }
    const t = window.setTimeout(() => setI((x) => Math.min(n - 1, x + 1)), TAKT_MS);
    return () => clearTimeout(t);
  }, [laeuft, i, n]);
  if (!runde) return null;
  const w = runde.zug.rueckmeldung.wertung;
  return (
    <section className="fall__rueckblick" aria-labelledby="fall-rb-titel">
      <div className="fall__rb-kopf">
        <h4 id="fall-rb-titel">Rückblick: Szene für Szene</h4>
        <div className="row">
          <button type="button" className="small" disabled={i === 0} onClick={() => { setLaeuft(false); setI(i - 1); }}>Zurück</button>
          <button type="button" className="small" aria-pressed={laeuft} onClick={() => { if (i >= n - 1) setI(0); setLaeuft(!laeuft); }}>{laeuft ? 'Anhalten' : 'Abspielen'}</button>
          <button type="button" className="small" disabled={i >= n - 1} onClick={() => { setLaeuft(false); setI(i + 1); }}>Weiter</button>
        </div>
      </div>
      <Verlaufskurve punkte={punkte} aktiv={i} onWahl={(k) => { setLaeuft(false); setI(k); }} />
      <div className="fall__rb-buehne">
        {foto
          ? <FotoSzene raum={foto} bild={bild} uhrzeit={runde.zug.uhrzeit} onMarker={() => {}} ohneMarker fallback={<span>Raumfoto nicht verfügbar.</span>} />
          : <Szene bild={bild} raum={RAUM_FUER[fall.szenario.setting] ?? 'krankenhaus'} uhrzeit={runde.zug.uhrzeit} />}
        <PatientenMonitor werte={bild.monitor} aktiv={bild.monitorAn} kompakt titel={`${runde.zug.uhrzeit} Uhr`} />
      </div>
      <div className={`fall__rb-text ${wenigBewegung() ? '' : 'is-animiert'}`} key={i} aria-live="polite">
        <p className="muted">Szene {i + 1} von {n} · {runde.zug.uhrzeit} Uhr · Zustand: {ZUSTAND_LABEL[runde.zug.zustand]}</p>
        {runde.eingabe && <p className="fall__rb-eingabe"><strong>Deine Entscheidung:</strong> {runde.eingabe}</p>}
        {w !== 'keine' && <p className={`fall__rb-wertung fall__rb-wertung--${w}`}><strong>{WERTUNG_LABEL[w]}.</strong> {runde.zug.rueckmeldung.text}</p>}
        <p>{runde.zug.situation}</p>
      </div>
    </section>
  );
}
