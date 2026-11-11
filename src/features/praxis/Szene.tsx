import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MiniMonitor } from './MiniMonitor';
import { RAUM_ELEMENTE, raumElemente, type RaumElement } from './raum';
import { szene, type BlasenQuelle, type Figur, type SzenenZustand } from './szene';
import type { Session } from './types';

/** x-Position (SVG-Einheiten, Breite 800) der Pflegekraft je Ort. */
const STANDORT: Record<RaumElement | 'tuer', number> = { tuer: 70, telefon: 160, patient: 400, monitor: 615, wagen: 650 };
/** Anker der Sprechblasen in Prozent der Szene. */
const ANKER: Record<Exclude<BlasenQuelle, 'pflege'>, { x: number; y: number }> = {
  patient: { x: 62, y: 40 }, telefon: { x: 20, y: 30 }, tuer: { x: 22, y: 44 }, monitor: { x: 80, y: 40 }, wagen: { x: 86, y: 52 },
};
const FIGUR_X = [205, 135, 270];
/** Kopfzeile der Sprechblase. Der Ereignistitel steht bereits in der Rückmeldung darunter. */
export const BLASEN_TITEL = { rede: 'Patient/in', warn: 'Achtung', story: 'Ereignis', info: 'Rückmeldung' } as const;
/** Klickflächen in der Zeichnung (x, y, Breite, Höhe). Die Knöpfe unter der Szene sind der zugängliche Weg. */
const TREFFER: Record<RaumElement, number[]> = { telefon: [120, 140, 70, 70], monitor: [580, 80, 135, 95], wagen: [670, 230, 110, 110], patient: [250, 170, 320, 130] };

function Figurbild({ f, x }: { f: Figur; x: number }) {
  const farbe = { arzt: '#ffffff', kollege: '#5aa79c', angehoerige: '#b86b4b', rettung: '#e2572b' }[f.art];
  const haut = { arzt: '#d9a98a', kollege: '#8d5a3b', angehoerige: '#f0c8a8', rettung: '#e6b996' }[f.art];
  return <g className="szene__figur" style={{ '--x': `${x}px` } as CSSProperties}>
    <ellipse cx="0" cy="430" rx="26" ry="6" className="szene__schatten" />
    <g className="szene__gehen">
      <rect x="-12" y="370" width="9" height="58" rx="3" fill={f.art === 'rettung' ? '#2b2f3a' : '#3d4652'} className="szene__bein szene__bein--l" />
      <rect x="3" y="370" width="9" height="58" rx="3" fill={f.art === 'rettung' ? '#2b2f3a' : '#3d4652'} className="szene__bein szene__bein--r" />
    </g>
    <path d="M-22 320q22-12 44 0l6 56h-56z" fill={farbe} stroke="#00000030" />
    {f.art === 'rettung' && <path d="M-25 352h50" stroke="#f5f26a" strokeWidth="5" />}
    {f.art === 'arzt' && <path d="M-10 328q10 20 20 0M10 328v14" stroke="#3a4a55" strokeWidth="2" fill="none" />}
    {f.art === 'angehoerige' && <rect x="18" y="350" width="16" height="20" rx="4" fill="#6b4a33" />}
    <circle cy="302" r="15" fill={haut} />
    <path d={f.art === 'angehoerige' ? 'M-16 300q2-24 16-20q14-4 16 20q-2-10-16-10q-14 0-16 10z' : 'M-15 298q15-20 30 0'} fill={f.art === 'angehoerige' ? '#8a8a8a' : '#2f2a26'} />
  </g>;
}

/** Bett mit Patient; Lage, Atmung, Haut und Gesicht folgen dem Zustand. */
function PatientImBett({ z }: { z: SzenenZustand }) {
  const winkel = z.lage === 'erhoeht' ? -24 : z.lage === 'flach' || z.lage === 'schock' ? 4 : -10;
  const beine = z.lage === 'schock' ? 9 : z.lage === 'bein' ? 6 : 0;
  return <g className="szene__bett">
    <path d="M265 288V330M555 288V330" stroke="#6c7a75" strokeWidth="7" strokeLinecap="round" />
    <circle cx="265" cy="334" r="6" className="szene__rad" /><circle cx="555" cy="334" r="6" className="szene__rad" />
    <rect x="250" y="272" width="320" height="16" rx="3" fill="#8c9c96" />
    <rect x="244" y="232" width="12" height="58" rx="4" fill="#8c9c96" />
    <rect x="255" y="254" width="200" height="20" rx="8" fill="#f8fafb" stroke="#9aabb4" strokeWidth="2" />
    <g className="szene__oberkoerper" style={{ transform: `rotate(${winkel}deg)` }}>
      <rect x="450" y="254" width="115" height="20" rx="8" fill="#f8fafb" stroke="#9aabb4" strokeWidth="2" />
      <ellipse cx="530" cy="246" rx="32" ry="11" fill="#eef2f5" />
      <g className="szene__brust"><path d="M440 262q22-30 72-12l4 12z" className="szene__decke" /></g>
      <Gesicht z={z} cx={530} cy={230} />
    </g>
    <g className="szene__beine" style={{ transform: `rotate(${beine}deg)` }}><path d="M262 262q40-26 90-12q40-14 92 -2l0 16h-182z" className="szene__decke" /></g>
    {z.zugang && <g><rect x="470" y="252" width="10" height="5" rx="2" fill="#fff" stroke="#5a8fb0" /><circle cx="475" cy="254" r="2" fill="#2f7fd1" /></g>}
    <rect x="562" y="205" width="12" height="85" rx="4" fill="#8c9c96" />
  </g>;
}

function PatientImSessel({ z }: { z: SzenenZustand }) {
  const winkel = z.lage === 'flach' ? 32 : 0;
  return <g className="szene__sessel">
    <rect x="400" y="268" width="150" height="34" rx="12" fill="#a46b52" />
    <rect x="525" y="176" width="34" height="126" rx="14" fill="#8e5a44" />
    <rect x="392" y="236" width="26" height="70" rx="10" fill="#8e5a44" /><rect x="540" y="236" width="26" height="70" rx="10" fill="#7a4c39" />
    <path d="M410 302v28M545 302v28" stroke="#5c3a2c" strokeWidth="6" strokeLinecap="round" />
    <path d="M500 268h-80v52" stroke="#55606b" strokeWidth="16" strokeLinecap="round" fill="none" />
    <g className="szene__oberkoerper szene__oberkoerper--sitz" style={{ transform: `rotate(${winkel}deg)` }}>
      <g className="szene__brust"><path d="M478 270v-44q22-14 44 0v44z" className="szene__pullover" /></g>
      <Gesicht z={z} cx={500} cy={206} />
    </g>
    <rect x="420" y="262" width="80" height="22" rx="10" className="szene__decke" opacity=".85" />
  </g>;
}

function Gesicht({ z, cx, cy }: { z: SzenenZustand; cx: number; cy: number }) {
  return <g className={`szene__kopf is-${z.haut}`}>
    <circle cx={cx} cy={cy} r="18" className="szene__haut" />
    <path d={`M${cx - 17} ${cy - 5}q17-22 34 0q-4-12-17-12t-17 12z`} fill="#6b5b4a" />
    {z.augenZu
      ? <path d={`M${cx - 10} ${cy - 2}h6M${cx + 4} ${cy - 2}h6`} stroke="#2a2a2a" strokeWidth="2" strokeLinecap="round" />
      : <g className="szene__augen"><circle cx={cx - 6} cy={cy - 2} r="2.3" fill="#1f1f1f" /><circle cx={cx + 6} cy={cy - 2} r="2.3" fill="#1f1f1f" /></g>}
    {z.schmerz > 0 && <path d={`M${cx - 10} ${cy - 8}l6 2M${cx + 10} ${cy - 8}l-6 2`} stroke="#3a2a20" strokeWidth="1.8" strokeLinecap="round" />}
    {z.atemnot > 0 || z.schmerz === 2
      ? <ellipse cx={cx} cy={cy + 8} rx="3.5" ry={z.atemnot === 2 ? 4 : 2.6} className="szene__mund szene__mund--offen" />
      : <path d={`M${cx - 5} ${cy + 8}q5 3 10 0`} className="szene__mund" fill="none" strokeWidth="2" strokeLinecap="round" />}
    {z.haut === 'geroetet' && <><circle cx={cx - 10} cy={cy + 4} r="4" fill="#e66a5a" opacity=".45" /><circle cx={cx + 10} cy={cy + 4} r="4" fill="#e66a5a" opacity=".45" /></>}
    {z.sauerstoff && <path d={`M${cx - 2} ${cy + 4}q-14 4-20 16t-30 24`} stroke="#3cb371" strokeWidth="2.2" fill="none" className="szene__o2" />}
    {z.schwitzen && <g className="szene__schweiss"><path d={`M${cx + 14} ${cy - 10}q3 5 0 7q-3-2 0-7z`} /><path d={`M${cx - 16} ${cy - 4}q3 5 0 7q-3-2 0-7z`} /></g>}
    {z.atemnot === 2 && <g className="szene__luft"><path d={`M${cx + 22} ${cy + 6}q8 0 10-6`} /><path d={`M${cx + 24} ${cy + 12}q10 0 14-8`} /></g>}
    {z.verwirrt && <text x={cx + 14} y={cy - 22} className="szene__frage">?</text>}
    {z.avpu === 'U' && <text x={cx + 14} y={cy - 20} className="szene__zzz">…</text>}
  </g>;
}

/** Kurze Arbeitsanimation zur letzten Handlung (Manschette, Stethoskop, Hörer …). */
function Arbeit({ z, bett }: { z: SzenenZustand; bett: boolean }) {
  if (!z.handlung) return null;
  const { art, id } = z.handlung;
  const px = bett ? 470 : 492, py = bett ? 258 : 246;
  return <g key={id} className="szene__arbeit" aria-hidden="true">
    {art === 'messen' && <><rect x={px - 12} y={py - 6} width="24" height="12" rx="4" className="szene__manschette" /><path d={`M${px} ${py + 6}q10 30 40 40`} stroke="#555" strokeWidth="2" fill="none" /></>}
    {art === 'hoeren' && <><circle cx={px + 10} cy={py - 6} r="6" fill="#9aa5ad" stroke="#333" /><path d={`M${px + 10} ${py}q-20 40-60 60`} stroke="#333" strokeWidth="2" fill="none" /></>}
    {art === 'tasten' && <path d={`M${px - 10} ${py - 4}q6-10 12 0q6-10 12 0`} stroke="#c58b6b" strokeWidth="6" strokeLinecap="round" fill="none" />}
    {art === 'reden' && <g className="szene__punkte"><circle cx={STANDORT.patient + 26} cy="282" r="3" /><circle cx={STANDORT.patient + 36} cy="278" r="3" /><circle cx={STANDORT.patient + 46} cy="274" r="3" /></g>}
    {art === 'telefonieren' && <path d="M178 278q12 10 0 22M186 272q20 16 0 34" stroke="#17695f" strokeWidth="3" fill="none" className="szene__wellen" />}
    {art === 'material' && <rect x={STANDORT.wagen + 18} y="296" width="30" height="8" rx="2" fill="#dfe8ee" stroke="#7a8d99" />}
  </g>;
}

/** Zugänglicher Weg zu den vier Orten im Zimmer (unter Zeichnung und Foto). */
export function OrteLeiste({ s, fokus, onFokus, nummern = false }: { s: Session; fokus: RaumElement; onFokus: (e: RaumElement) => void; nummern?: boolean }) {
  const info = raumElemente(s.scenario);
  return <div className="szene__orte" role="group" aria-label="Wohin gehst du?">
    {RAUM_ELEMENTE.map((e, i) => <button key={e} type="button" className="praxis-hotspot" aria-pressed={fokus === e} aria-label={`${info[e].label}: ${info[e].zweck}`} onClick={() => onFokus(e)}>{nummern ? <span className="szene__ort-nummer" aria-hidden="true">{i + 1}</span> : <span className={`szene__ort-symbol is-${e}`} aria-hidden="true" />}{info[e].kurz}</button>)}
  </div>;
}

/** Statuschips oben links: Zeitraffer, Monitoralarm, wer im Zimmer ist. */
export function StatusChips({ z, zeitraffer }: { z: SzenenZustand; zeitraffer: number }) {
  return <div className="szene__status" aria-hidden="true">
    {zeitraffer > 1 && <span className="szene__chip">Zeitraffer {zeitraffer}×</span>}
    {z.alarm !== 'kein' && <span className={`szene__chip is-${z.alarm}`}>Monitoralarm</span>}
    {z.figuren.map(f => <span key={f.art} className="szene__chip">{f.label} im Zimmer</span>)}
  </div>;
}

/** Sprechblase blendet nach einigen Sekunden aus; ein neues Ereignis zeigt eine neue. */
export function useBlase(z: SzenenZustand) {
  const [sichtbar, setSichtbar] = useState(true);
  useEffect(() => { setSichtbar(true); const t = window.setTimeout(() => setSichtbar(false), 9000); return () => clearTimeout(t); }, [z.blase?.id]);
  return sichtbar ? z.blase : undefined;
}

export function Szene({ s, fokus, onFokus, zeitraffer }: { s: Session; fokus: RaumElement; onFokus: (e: RaumElement) => void; zeitraffer: number }) {
  const z = szene(s);
  const bett = !z.zuhause;
  // Die Pflegekraft geht zum zuletzt angetippten Element oder dorthin, wo zuletzt gehandelt wurde.
  const [ziel, setZiel] = useState<RaumElement | 'tuer'>(z.handlung?.element ?? fokus);
  const [geht, setGeht] = useState(false);
  const vorher = useRef(ziel);
  useEffect(() => { setZiel(fokus); }, [fokus]);
  useEffect(() => { if (z.handlung) setZiel(z.handlung.element); }, [z.handlung?.id]);
  useEffect(() => {
    if (vorher.current === ziel) return;
    vorher.current = ziel; setGeht(true);
    const t = window.setTimeout(() => setGeht(false), 900);
    return () => clearTimeout(t);
  }, [ziel]);


  const pflegeX = STANDORT[ziel];
  const blase = useBlase(z);
  const anker = blase ? (blase.quelle === 'pflege' ? { x: (pflegeX / 800) * 100, y: 52 } : ANKER[blase.quelle]) : undefined;
  const stunden = z.wanduhr / 3600, minuten = (z.wanduhr % 3600) / 60;
  const klassen = ['szene', z.nacht ? 'is-nacht' : '', `is-alarm-${z.alarm}`, z.komplikation ? 'is-komplikation' : ''].filter(Boolean).join(' ');
  const stil = { '--atem': `${z.atemSek.toFixed(2)}s`, '--herz': `${z.herzSek.toFixed(2)}s`, '--pflege-x': `${pflegeX}px` } as CSSProperties;

  return <div className={klassen} style={stil}>
    <div className="szene__buehne">
    <svg viewBox="0 0 800 450" aria-hidden="true" focusable="false" className="szene__svg">
      <defs>
        <linearGradient id="szene-himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="szene__himmel-oben" /><stop offset="1" className="szene__himmel-unten" /></linearGradient>
      </defs>
      <rect width="800" height="335" className="szene__wand" />
      <rect y="330" width="800" height="120" className="szene__boden" />
      <path d="M0 330H800" className="szene__sockel" />
      {/* Fenster */}
      <g className="szene__fenster">
        <rect x="280" y="58" width="150" height="108" rx="6" fill="url(#szene-himmel)" />
        <g className="szene__wolken"><ellipse cx="320" cy="92" rx="26" ry="9" /><ellipse cx="392" cy="128" rx="20" ry="7" /></g>
        <g className="szene__sterne"><circle cx="300" cy="80" r="1.6" /><circle cx="350" cy="72" r="1.2" /><circle cx="410" cy="100" r="1.5" /><circle cx="330" cy="140" r="1" /><circle cx="400" cy="78" r="9" className="szene__mond" /></g>
        <rect x="280" y="58" width="150" height="108" rx="6" className="szene__rahmen" />
        <path d="M355 58V166M280 112H430" className="szene__rahmen" />
      </g>
      {/* Tür */}
      <rect x="18" y="118" width="86" height="214" rx="3" className="szene__zarge" />
      <rect x="24" y="124" width="74" height="208" className="szene__tuer" />
      <circle cx="88" cy="232" r="4" fill="#4d5a60" />
      {/* Telefon */}
      <g className={`szene__telefon ${z.telefonKlingelt ? 'is-klingelt' : ''} ${fokus === 'telefon' ? 'is-fokus' : ''}`}>
        <rect x="134" y="148" width="30" height="46" rx="6" fill="#4f625c" />
        <rect x="139" y="154" width="20" height="10" rx="2" fill="#bfe8d6" />
        <path d="M134 176q-14 20 0 40" stroke="#4f625c" strokeWidth="2" fill="none" />
        <g className="szene__klingeln"><path d="M170 158q8 10 0 20" /><path d="M177 152q14 16 0 32" /></g>
      </g>
      {/* Wanduhr */}
      <g className="szene__uhr">
        <circle cx="480" cy="82" r="24" className="szene__uhr-blatt" />
        <path d="M480 82V66" className="szene__zeiger szene__zeiger--min" style={{ transform: `rotate(${minuten * 6}deg)` }} />
        <path d="M480 82V71" className="szene__zeiger szene__zeiger--std" style={{ transform: `rotate(${(stunden % 12) * 30}deg)` }} />
        {zeitraffer > 1 && <circle cx="480" cy="82" r="28" className="szene__raffer" />}
      </g>
      {/* Sauerstoff-Wandanschluss */}
      <rect x="600" y="196" width="22" height="14" rx="3" fill="#3cb371" opacity={z.sauerstoff ? 1 : 0.45} />
      {/* Monitor oder Messgeräte */}
      <g className={`szene__monitor ${fokus === 'monitor' ? 'is-fokus' : ''}`}>
        {z.monitorVorhanden
          ? <><path d="M640 168v28" stroke="#7d8b87" strokeWidth="6" /><rect x="586" y="86" width="122" height="84" rx="8" fill="#2b3936" /><circle cx="700" cy="92" r="5" className="szene__alarmlicht" /></>
          : <><rect x="586" y="150" width="122" height="10" rx="3" fill="#a88f6d" /><rect x="600" y="118" width="40" height="32" rx="5" fill="#e9eef0" stroke="#7d8b87" /><rect x="606" y="124" width="28" height="12" rx="2" fill="#bfe8d6" /><path d="M650 150q10-30 30-22q10 4 6 22" fill="#7a9cc6" /></>}
      </g>
      {/* Infusionsständer */}
      {z.infusion && <g className="szene__infusion">
        <path d="M584 130V332M572 332h24" stroke="#8a95a0" strokeWidth="4" />
        <rect x="572" y="132" width="26" height="40" rx="7" fill="#e7f4ff" stroke="#7aa7c7" />
        <rect x="581" y="176" width="8" height="16" rx="2" fill="#e7f4ff" stroke="#7aa7c7" />
        <circle cx="585" cy="180" r="2" className="szene__tropfen" />
        <path d={bett ? 'M585 192q-10 50-110 62' : 'M585 192q-20 50-90 52'} stroke="#7aa7c7" strokeWidth="2" fill="none" />
      </g>}
      {bett ? <PatientImBett z={z} /> : <PatientImSessel z={z} />}
      {/* Materialwagen bzw. Pflegetasche */}
      <g className={`szene__wagen ${fokus === 'wagen' ? 'is-fokus' : ''}`}>
        {z.zuhause
          ? <><path d="M680 300h80l-6 32h-68z" fill="#2f6f6a" /><path d="M700 300q20-24 40 0" stroke="#24524e" strokeWidth="5" fill="none" /><rect x="712" y="310" width="16" height="10" rx="2" fill="#fff" /><path d="M720 311v8M716 315h8" stroke="#d33" strokeWidth="2" /></>
          : <><rect x="680" y="252" width="90" height="78" rx="6" fill="#d9e3df" stroke="#9aabb4" strokeWidth="2" /><path d="M686 276h78M686 300h78" stroke="#9aabb4" strokeWidth="2" /><rect x="688" y="240" width="22" height="12" rx="2" fill="#7fb6e6" /><rect x="716" y="236" width="10" height="16" rx="2" fill="#f4f4f4" stroke="#9aabb4" /><circle cx="690" cy="334" r="5" className="szene__rad" /><circle cx="760" cy="334" r="5" className="szene__rad" /></>}
      </g>
      {z.figuren.map((f, i) => <Figurbild key={`${f.art}-${f.seit}`} f={f} x={FIGUR_X[i] ?? 205} />)}
      <Arbeit z={z} bett={bett} />
      {/* Pflegekraft (du) */}
      <g className={`szene__pflege ${geht ? 'is-geht' : ''}`}>
        <ellipse cx="0" cy="430" rx="28" ry="6" className="szene__schatten" />
        <g className="szene__gehen">
          <rect x="-13" y="370" width="10" height="58" rx="3" fill="#0e4f47" className="szene__bein szene__bein--l" />
          <rect x="3" y="370" width="10" height="58" rx="3" fill="#0e4f47" className="szene__bein szene__bein--r" />
        </g>
        <path d="M-22 320q22-12 44 0l4 56h-52z" className="szene__kasack" />
        <path d="M18 326l22 34" className="szene__arm" />
        <path d="M-18 326l-14 40" className="szene__arm" />
        <circle cy="302" r="15" fill="#f1c9a5" />
        <path d="M-15 298q15-22 30 0q-2 6-6 4q-8-10-18 0q-4 2-6-4z" fill="#3a2d26" />
        <rect x="-14" y="262" width="28" height="16" rx="8" className="szene__du" /><text x="0" y="274" textAnchor="middle" className="szene__du-text">Du</text>
      </g>
      <rect width="800" height="450" className="szene__nachtlicht" />
      <g className="szene__treffer">
        {(Object.entries(TREFFER) as [RaumElement, number[]][]).map(([e, [x, y, w, h]]) => <rect key={e} x={x} y={y} width={w} height={h} onClick={() => onFokus(e)} />)}
      </g>
    </svg>
    {z.monitorVorhanden && <div className="szene__schirm"><MiniMonitor aktiv={z.monitoring} puls={s.vitals.pulse} spo2={s.vitals.spo2} af={s.vitals.resp} alarm={z.alarm} /></div>}
    {!z.monitorVorhanden && s.measuredAt !== null && <div className="szene__lcd" aria-hidden="true">{Math.round(s.measured.sys ?? 0)}/{Math.round(s.measured.dia ?? 0)}<small>P {Math.round(s.measured.pulse ?? 0)}</small></div>}
    {blase && anker && <div key={blase.id} className={`szene__blase is-${blase.ton} ${anker.x < 35 ? 'is-links' : anker.x > 65 ? 'is-rechts' : ''}`} style={{ left: `${anker.x}%`, top: `${anker.y}%` }} aria-hidden="true">
      <strong>{BLASEN_TITEL[blase.ton]}</strong>
      <span>{blase.ton === 'rede' ? `„${blase.text}“` : blase.text}</span>
    </div>}
    </div>
    <OrteLeiste s={s} fokus={fokus} onFokus={onFokus} />
    <StatusChips z={z} zeitraffer={zeitraffer} />
    {/* Monitorton, Alarme, Telefon und Raumklang kommen aus dem gemeinsamen Baustein SimTon (Arbeitsplatz). */}
  </div>;
}
