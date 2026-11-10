// Animierte Zimmerszene des KI-Fallsimulators in Schrägansicht (2,5D).
// Patient atmet im Takt der AF, Hautfarbe nach Zustand, Lagerung, Sauerstoff, Personen kommen zur Tür,
// das Telefon klingelt, deine Figur läuft zum Ort der Handlung, die Kamera fährt bei Ereignissen heran.
// Alles ist reine Darstellung: die Beschreibung steht als Text für Screenreader dabei.

import { useId, type CSSProperties } from 'react';
import type { Fokus, Ort, Person, SzenenBild } from './szene';
import { MARKER, RAUM_LABEL, type Marker, type ObjektId, type Raum } from './raeume';
import { ORT_LABEL, PERSON_LABEL } from './szene';

// Raumkoordinaten: x nach rechts hinten, y nach links vorn, z nach oben. Boden 400 × 300.
const iso = (x: number, y: number, z = 0): [number, number] => [400 + (x - y) * 0.69, 90 + (x + y) * 0.4 - z];
const pkt = (...p: Array<[number, number]>) => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');

function Quader({ x, y, z = 0, b, t, h, oben, links, rechts, className }: {
  x: number; y: number; z?: number; b: number; t: number; h: number; oben: string; links: string; rechts: string; className?: string;
}) {
  return (
    <g className={className}>
      <polygon points={pkt(iso(x, y + t, z), iso(x + b, y + t, z), iso(x + b, y + t, z + h), iso(x, y + t, z + h))} fill={links} />
      <polygon points={pkt(iso(x + b, y, z), iso(x + b, y + t, z), iso(x + b, y + t, z + h), iso(x + b, y, z + h))} fill={rechts} />
      <polygon points={pkt(iso(x, y, z + h), iso(x + b, y, z + h), iso(x + b, y + t, z + h), iso(x, y + t, z + h))} fill={oben} />
    </g>
  );
}

/** Stehende Figur mit Schatten; Mittelpunkt am Boden (x, y). */
function Figur({ farbe, haut = '#d9b48f', label, className, style, kittel }: {
  farbe: string; haut?: string; label: string; className?: string; style?: CSSProperties; kittel?: boolean;
}) {
  return (
    <g className={`szene__figur ${className ?? ''}`} style={style}>
      <ellipse cx="0" cy="0" rx="14" ry="6" fill="#0003" />
      <g className="szene__figur-koerper">
        <rect x="-6" y="-26" width="5" height="25" rx="2" fill="#2b3446" />
        <rect x="1" y="-26" width="5" height="25" rx="2" fill="#2b3446" />
        <rect x="-9" y="-58" width="18" height="36" rx="8" fill={farbe} stroke={kittel ? '#9aa9a5' : 'none'} strokeWidth="1" />
        <circle cx="0" cy="-66" r="8.5" fill={haut} />
      </g>
      <text x="0" y="14" textAnchor="middle" className="szene__label">{label}</text>
    </g>
  );
}

// Wo Dinge stehen (Bodenpunkte), je Raum
const ORT_IN: Record<Raum, Record<Ort, [number, number]>> = {
  krankenhaus: { bett: [190, 175], monitor: [70, 150], wagen: [330, 140], telefon: [300, 250], tuer: [40, 225] },
  heim: { bett: [190, 175], monitor: [125, 215], wagen: [300, 180], telefon: [125, 215], tuer: [40, 225] },
  wohnung: { bett: [215, 225], monitor: [130, 225], wagen: [300, 235], telefon: [130, 225], tuer: [40, 225] },
};
const PERSON_ORT: Record<Person, [number, number]> = {
  aerztin: [95, 235], angehoerige: [60, 285], kollegin: [150, 280], notfallteam: [250, 205],
};
const PERSON_FARBE: Record<Person, string> = { aerztin: '#ffffff', angehoerige: '#a78bfa', kollegin: '#5eead4', notfallteam: '#ef4444' };

// Kamera: Bildpunkt, auf den gezoomt wird, und Zoomstufe
type Kamera = { punkt: [number, number]; zoom: number };
const k = (x: number, y: number, z: number, zoom: number): Kamera => ({ punkt: iso(x, y, z), zoom });
const FOKUS_IN: Record<Raum, Record<Fokus, Kamera>> = {
  krankenhaus: {
    raum: { punkt: [435, 157], zoom: 1 }, bett: k(180, 110, 30, 1.35), monitor: k(40, 20, 120, 1.55),
    wagen: k(320, 130, 60, 1.4), telefon: k(320, 260, 50, 1.45), tuer: k(20, 220, 60, 1.35),
  },
  heim: {
    raum: { punkt: [435, 157], zoom: 1 }, bett: k(180, 110, 30, 1.35), monitor: k(95, 172, 50, 1.5),
    wagen: k(320, 120, 40, 1.4), telefon: k(95, 172, 50, 1.5), tuer: k(20, 220, 60, 1.35),
  },
  wohnung: {
    raum: { punkt: [435, 157], zoom: 1 }, bett: k(210, 170, 45, 1.4), monitor: k(130, 180, 45, 1.5),
    wagen: k(295, 185, 40, 1.45), telefon: k(130, 180, 45, 1.5), tuer: k(20, 220, 60, 1.35),
  },
};
const MARKER_PUNKT: Record<ObjektId, [number, number, number]> = {
  patient: [170, 110, 72], monitor: [40, 20, 152], infusion: [300, 165, 168],
  rollstuhl: [320, 120, 78], nachttisch: [95, 172, 72], rucksack: [130, 180, 72], rollator: [295, 185, 78],
};
const VIEW = { x: 170, y: -78, w: 530, h: 470 };

const HAUT: Record<SzenenBild['zustand'], string> = {
  stabil: '#e9c9a8', verbessert: '#efc9a3', verschlechtert: '#e2cdb8', kritisch: '#cfc6c0',
};

function Uhr({ minuten }: { minuten: number | null }) {
  const [cx, cy] = iso(250, 0, 125);
  const m = minuten ?? 0;
  const winkelStunde = ((m / 60) % 12) * 30, winkelMinute = (m % 60) * 6;
  return (
    <g aria-hidden="true">
      <ellipse cx={cx} cy={cy} rx="15" ry="17" fill="#fff" stroke="#5b6b67" strokeWidth="2" />
      {minuten !== null && <>
        <line className="szene__zeiger" x1={cx} y1={cy} x2={cx} y2={cy - 8} stroke="#1f2a27" strokeWidth="2.4" strokeLinecap="round" style={{ transform: `rotate(${winkelStunde}deg)`, transformOrigin: `${cx}px ${cy}px` }} />
        <line className="szene__zeiger" x1={cx} y1={cy} x2={cx} y2={cy - 12} stroke="#1f2a27" strokeWidth="1.6" strokeLinecap="round" style={{ transform: `rotate(${winkelMinute}deg)`, transformOrigin: `${cx}px ${cy}px` }} />
      </>}
    </g>
  );
}

/** Liegender Patient im Bett (Krankenhaus, Heim). */
function PatientLiegend({ bild, decke }: { bild: SzenenBild; decke: string }) {
  const kopf = bild.oberkoerperHoch ? iso(95, 105, 72) : iso(92, 105, 52);
  return (
    <g className="szene__patient">
      {bild.oberkoerperHoch && <polygon points={pkt(iso(75, 75, 34), iso(75, 145, 34), iso(115, 145, 78), iso(115, 75, 78))} fill="#e5ebe9" stroke="#c4cdca" />}
      <polygon points={pkt(iso(140, 80, 38), iso(290, 80, 38), iso(290, 140, 38), iso(140, 140, 38))} fill={decke} />
      <ellipse className="szene__brust" cx={iso(165, 110, 46)[0]} cy={iso(165, 110, 46)[1]} rx="34" ry="13" fill={decke} />
      <Gesicht bild={bild} kopf={kopf} />
    </g>
  );
}

/** Sitzende Klientin im Sessel (Wohnung). */
function PatientSitzend({ bild }: { bild: SzenenBild }) {
  const kopf = iso(215, 165, 92);
  return (
    <g className="szene__patient">
      <Quader x={185} y={140} b={60} t={60} h={26} oben="#8a9a7b" links="#6f7f62" rechts="#7d8d6f" />
      <Quader x={185} y={140} b={14} t={60} h={58} oben="#93a385" links="#6f7f62" rechts="#7d8d6f" />
      <polygon points={pkt(iso(225, 160, 26), iso(255, 160, 26), iso(262, 175, 0), iso(232, 175, 0))} fill="#6b6f80" />
      <ellipse cx={iso(212, 168, 55)[0]} cy={iso(212, 168, 55)[1]} rx="17" ry="22" fill="#b48aa8" />
      <ellipse className="szene__brust" cx={iso(214, 168, 60)[0]} cy={iso(214, 168, 60)[1]} rx="13" ry="12" fill="#b48aa8" />
      <Gesicht bild={bild} kopf={kopf} />
    </g>
  );
}

function Gesicht({ bild, kopf }: { bild: SzenenBild; kopf: [number, number] }) {
  return (
    <>
      <circle cx={kopf[0]} cy={kopf[1]} r="15" fill={HAUT[bild.zustand]} />
      <path d={`M${kopf[0] - 5} ${kopf[1] + 6} q5 ${bild.zustand === 'verbessert' ? 3 : -2} 10 0`} stroke={bild.zyanose ? '#5b6fb0' : '#9b5b5b'} strokeWidth="2" fill="none" />
      <circle cx={kopf[0] - 5} cy={kopf[1] - 2} r="1.8" fill="#333" />
      <circle cx={kopf[0] + 5} cy={kopf[1] - 2} r="1.8" fill="#333" />
      {bild.schwitzt && <g className="szene__schweiss" fill="#7cc4f0"><circle cx={kopf[0] + 13} cy={kopf[1] - 9} r="2.2" /><circle cx={kopf[0] - 13} cy={kopf[1] - 5} r="1.8" /></g>}
      {bild.sauerstoff && (
        <path className="szene__o2" d={`M${iso(70, 0, 95)[0]} ${iso(70, 0, 95)[1]} C ${iso(70, 40, 80)[0]} ${iso(70, 40, 80)[1]}, ${kopf[0] - 30} ${kopf[1] + 20}, ${kopf[0] - 2} ${kopf[1] + 3}`} />
      )}
    </>
  );
}

function EkgSchirm({ x, y, b, h, an, clip }: { x: number; y: number; b: number; h: number; an: boolean; clip: string }) {
  return (
    <g className={`szene__monitor ${an ? 'is-an' : ''}`}>
      <rect x={x - b / 2 - 4} y={y - h / 2 - 4} width={b + 8} height={h + 8} rx="4" className="szene__monitor-rahmen" />
      <clipPath id={clip}><rect x={x - b / 2} y={y - h / 2} width={b} height={h} /></clipPath>
      <g clipPath={`url(#${clip})`}>
        <path className="szene__ekg" d={`M${x - b / 2 - 44} ${y}` + Array.from({ length: 8 }, () => ' h6 l2 -2 l2 2 h2 l2 -9 l2 14 l2 -5 h4').join('')} />
      </g>
    </g>
  );
}

/** Möbel und Geräte je Raum (ohne Patient). */
function Einrichtung({ raum, bild, clip }: { raum: Raum; bild: SzenenBild; clip: string }) {
  const [tx, ty] = raum === 'krankenhaus' ? iso(335, 255, 45) : raum === 'heim' ? iso(100, 180, 47) : iso(118, 185, 42);
  const telefon = (
    <g className={`szene__telefon ${bild.telefon ? 'is-klingelt' : ''}`} style={{ transformOrigin: `${tx}px ${ty}px` }}>
      <rect x={tx - 10} y={ty - 7} width="20" height="10" rx="3" fill="#2b3446" />
      {bild.telefon && <path d={`M${tx + 14} ${ty - 12} q6 6 0 12 M${tx + 19} ${ty - 17} q11 11 0 22`} className="szene__klingeln" />}
    </g>
  );
  if (raum === 'krankenhaus') {
    const [mx, my] = iso(40, 20, 120);
    const [ix, iy] = iso(300, 165, 150);
    return (
      <>
        <polygon points={pkt(iso(60, 0, 88), iso(300, 0, 88), iso(300, 0, 100), iso(60, 0, 100))} fill="#d7dedc" />
        <rect x={iso(70, 0, 95)[0] - 5} y={iso(70, 0, 95)[1] - 5} width="10" height="10" rx="2" fill="#7ea4c9" />
        <line x1={iso(40, 20)[0]} y1={iso(40, 20)[1]} x2={iso(40, 20, 100)[0]} y2={iso(40, 20, 100)[1]} stroke="#8d9a97" strokeWidth="3" />
        <EkgSchirm x={mx} y={my} b={44} h={26} an={bild.monitorAn} clip={clip} />
        <Quader x={70} y={70} b={230} t={80} h={22} oben="#c7d0cd" links="#a9b4b1" rechts="#b8c2bf" />
        <Quader x={72} y={72} b={226} t={76} h={12} z={22} oben="#f3f6f5" links="#dfe5e3" rechts="#e8eceb" />
        {/* Infusionsständer */}
        <line x1={iso(300, 165)[0]} y1={iso(300, 165)[1]} x2={ix} y2={iy} stroke="#8d9a97" strokeWidth="2.5" />
        <ellipse cx={iso(300, 165)[0]} cy={iso(300, 165)[1]} rx="12" ry="5" fill="#8d9a97" />
        <rect x={ix - 7} y={iy + 2} width="14" height="20" rx="4" fill="#e0f2fe" stroke="#93c5fd" />
        <line className="szene__tropf" x1={ix} y1={iy + 22} x2={ix} y2={iy + 40} stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="2 4" />
        <Quader x={320} y={50} b={50} t={60} h={55} oben="#d5dde0" links="#9eb0b8" rechts="#b7c6cc" />
        <rect x={iso(345, 50, 45)[0] - 6} y={iso(345, 50, 45)[1] - 4} width="12" height="8" rx="2" fill="#f97316" />
        <Quader x={300} y={235} b={80} t={50} h={40} oben="#cbb79a" links="#a8957a" rechts="#b9a488" />
        {telefon}
      </>
    );
  }
  if (raum === 'heim') {
    const [gx, gy] = iso(100, 175, 52);
    return (
      <>
        <polygon points={pkt(iso(255, 0, 85), iso(310, 0, 85), iso(310, 0, 125), iso(255, 0, 125))} fill="#c9a87c" stroke="#8a6d48" strokeWidth="2" />
        <polygon points={pkt(iso(150, 185), iso(290, 185), iso(290, 285), iso(150, 285))} fill="#e8b4a0" opacity="0.75" />
        <Quader x={70} y={70} b={230} t={80} h={24} oben="#c69a6b" links="#a47a50" rechts="#b88a5d" />
        <Quader x={72} y={72} b={226} t={76} h={12} z={24} oben="#f6efe6" links="#e8ddd0" rechts="#efe5d9" />
        <Quader x={64} y={70} b={8} t={80} h={60} oben="#b88a5d" links="#a47a50" rechts="#b88a5d" />
        <Quader x={75} y={155} b={45} t={38} h={45} oben="#d4a877" links="#b0885c" rechts="#c29868" />
        <rect x={iso(88, 165, 47)[0] - 3} y={iso(88, 165, 47)[1] - 14} width="6" height="14" fill="#f0e6d2" />
        <rect x={gx - 4} y={gy - 4} width="8" height="6" rx="1" fill={bild.monitorAn ? '#0b1210' : '#cbd5e1'} />
        <circle cx={iso(112, 180, 47)[0]} cy={iso(112, 180, 47)[1]} r="4" fill="#dc2626" />
        {telefon}
        {/* Rollstuhl */}
        <g>
          <ellipse cx={iso(320, 100, 22)[0]} cy={iso(320, 100, 22)[1]} rx="12" ry="22" fill="none" stroke="#374151" strokeWidth="3" />
          <Quader x={300} y={100} b={40} t={40} h={6} z={26} oben="#1f2937" links="#111827" rechts="#1f2937" />
          <Quader x={300} y={100} b={6} t={40} h={36} z={26} oben="#1f2937" links="#111827" rechts="#374151" />
          <ellipse cx={iso(320, 142, 22)[0]} cy={iso(320, 142, 22)[1]} rx="12" ry="22" fill="none" stroke="#374151" strokeWidth="3" />
        </g>
        <Quader x={310} y={230} b={55} t={55} h={28} oben="#f0a68a" links="#d48a6e" rechts="#e2987c" />
        <Quader x={355} y={230} b={10} t={55} h={60} oben="#f0a68a" links="#d48a6e" rechts="#e2987c" />
      </>
    );
  }
  // Wohnung
  return (
    <>
      <polygon points={pkt(iso(20, 0), iso(90, 0), iso(90, 0, 120), iso(20, 0, 120))} fill="#dbe7ee" />
      <line x1={iso(40, 0, 60)[0]} y1={iso(40, 0, 60)[1]} x2={iso(75, 0, 60)[0]} y2={iso(75, 0, 60)[1]} stroke="#94a3b8" strokeWidth="3" />
      <polygon points={pkt(iso(255, 0, 85), iso(310, 0, 85), iso(310, 0, 125), iso(255, 0, 125))} fill="#c9a87c" stroke="#8a6d48" strokeWidth="2" />
      <polygon points={pkt(iso(120, 120), iso(320, 120), iso(320, 290), iso(120, 290))} fill="#e9dcc4" opacity="0.85" />
      <Quader x={130} y={12} b={170} t={45} h={28} oben="#9caf88" links="#7f9270" rechts="#8da07c" />
      <Quader x={130} y={6} b={170} t={10} h={58} oben="#a6b893" links="#7f9270" rechts="#8da07c" />
      <Quader x={95} y={165} b={50} t={42} h={40} oben="#c9a37a" links="#a8845e" rechts="#b9926a" />
      <Quader x={105} y={172} b={28} t={20} h={16} z={40} oben="#1f2937" links="#111827" rechts="#374151" />
      <rect x={iso(120, 182, 58)[0] - 6} y={iso(120, 182, 58)[1] - 3} width="12" height="5" fill={bild.monitorAn ? '#4ade80' : '#475569'} />
      {telefon}
      {/* Rollator */}
      <g stroke="#64748b" strokeWidth="2.5" fill="none">
        <polyline points={pkt(iso(285, 175), iso(285, 175, 55), iso(310, 175, 55), iso(310, 175))} />
        <polyline points={pkt(iso(285, 205), iso(285, 205, 55), iso(310, 205, 55), iso(310, 205))} />
        <line x1={iso(285, 175, 55)[0]} y1={iso(285, 175, 55)[1]} x2={iso(285, 205, 55)[0]} y2={iso(285, 205, 55)[1]} />
      </g>
      <polygon points={pkt(iso(287, 177, 30), iso(308, 177, 30), iso(308, 203, 30), iso(287, 203, 30))} fill="#334155" opacity="0.7" />
    </>
  );
}

export interface SzeneProps {
  bild: SzenenBild;
  raum: Raum;
  uhrzeit?: string;
  /** Kamera-Fokus von außen (Marker gewählt); sonst der aus dem Fallverlauf */
  fokus?: Fokus;
  aktiverMarker?: ObjektId | null;
  onMarker?: (m: Marker) => void;
}

export function Szene({ bild, raum, uhrzeit, fokus, aktiverMarker, onMarker }: SzeneProps) {
  const f = FOKUS_IN[raum][fokus ?? bild.fokus];
  const zoom = f.zoom;
  const mitte: [number, number] = [VIEW.x + VIEW.w / 2, VIEW.y + VIEW.h / 2];
  // Zoom bleibt im Raum: Kamera so verschieben, dass der Fokuspunkt in die Mitte rückt
  const tx = Math.max(Math.min(mitte[0] - f.punkt[0] * zoom, VIEW.x - VIEW.x * zoom), VIEW.x + VIEW.w - (VIEW.x + VIEW.w) * zoom);
  const ty = Math.max(Math.min(mitte[1] - f.punkt[1] * zoom, VIEW.y - VIEW.y * zoom), VIEW.y + VIEW.h - (VIEW.y + VIEW.h) * zoom);
  // transform-box view-box misst vom viewBox-Ursprung aus; der Ursprung soll aber bei (0, 0) liegen
  const kamera: CSSProperties = { transform: `translate(${tx}px, ${ty}px) scale(${zoom})`, transformOrigin: `${-VIEW.x}px ${-VIEW.y}px` };
  const [nx, ny] = iso(...ORT_IN[raum][bild.ziel]);
  const atemDauer = `${(60 / Math.min(60, Math.max(4, bild.atem))).toFixed(2)}s`;
  const clip = `szene-clip-${useId().replace(/:/g, '')}`;
  const marker = MARKER[raum];

  return (
    <figure className={`szene is-${raum} ${bild.nacht ? 'is-nacht' : ''} ${bild.alarm ? 'is-alarm' : ''}`} style={{ '--szene-atem': atemDauer } as CSSProperties}>
      <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} role="group" aria-label={`${RAUM_LABEL[raum]}${uhrzeit ? `, ${uhrzeit} Uhr` : ''}: ${bild.beschreibung}`}>
        <g className="szene__kamera" style={kamera}>
          {/* Wände und Boden */}
          <polygon points={pkt(iso(0, 0), iso(400, 0), iso(400, 0, 160), iso(0, 0, 160))} className="szene__wand-hinten" />
          <polygon points={pkt(iso(0, 0), iso(0, 300), iso(0, 300, 160), iso(0, 0, 160))} className="szene__wand-links" />
          <polygon points={pkt(iso(0, 0), iso(400, 0), iso(400, 300), iso(0, 300))} className="szene__boden" />
          {[100, 200, 300].map((x) => <line key={x} x1={iso(x, 0)[0]} y1={iso(x, 0)[1]} x2={iso(x, 300)[0]} y2={iso(x, 300)[1]} className="szene__fuge" />)}
          {[100, 200].map((y) => <line key={y} x1={iso(0, y)[0]} y1={iso(0, y)[1]} x2={iso(400, y)[0]} y2={iso(400, y)[1]} className="szene__fuge" />)}

          {/* Fenster mit Tageszeit, Uhr, Tür mit Alarmlampe */}
          <polygon points={pkt(iso(130, 0, 70), iso(220, 0, 70), iso(220, 0, 140), iso(130, 0, 140))} className="szene__fenster" />
          <circle cx={iso(205, 0, 125)[0]} cy={iso(205, 0, 125)[1]} r="6" className="szene__mond" />
          <Uhr minuten={bild.minuten} />
          <polygon points={pkt(iso(0, 190), iso(0, 260), iso(0, 260, 120), iso(0, 190, 120))} className="szene__tuer" />
          {raum !== 'wohnung' && <circle cx={iso(0, 225, 135)[0]} cy={iso(0, 225, 135)[1]} r="6" className="szene__lampe" />}

          <Einrichtung raum={raum} bild={bild} clip={clip} />
          {raum === 'wohnung' ? <PatientSitzend bild={bild} /> : <PatientLiegend bild={bild} decke={raum === 'heim' ? '#d9a7a0' : '#8ab8d6'} />}

          {/* Personen, die gerade da sind */}
          {bild.personen.map((p) => {
            const [px, py] = iso(...PERSON_ORT[p]);
            return (
              <g key={p} transform={`translate(${px} ${py})`}>
                <Figur farbe={PERSON_FARBE[p]} kittel={p === 'aerztin'} label={PERSON_LABEL[p]} className="szene__besuch" />
              </g>
            );
          })}

          {/* Du */}
          <Figur farbe="#17695f" label="Du" className="szene__du" style={{ transform: `translate(${nx}px, ${ny}px)` }} />

          {/* Nummerierte Marker: antippen öffnet das Objekt */}
          {onMarker && marker.map((m) => {
            const [mx, my] = iso(...MARKER_PUNKT[m.id]);
            const auswaehlen = () => onMarker(m);
            return (
              <g key={m.id} className={`szene__marker ${aktiverMarker === m.id ? 'is-aktiv' : ''}`} role="button" tabIndex={0}
                aria-label={`${m.nr}: ${m.name} ansehen`} aria-pressed={aktiverMarker === m.id}
                onClick={auswaehlen} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); auswaehlen(); } }}>
                <circle cx={mx} cy={my} r="17" fill="transparent" />
                <circle cx={mx} cy={my} r="11" className="szene__marker-kreis" />
                <text x={mx} y={my + 4} textAnchor="middle" className="szene__marker-nr">{m.nr}</text>
              </g>
            );
          })}
        </g>
      </svg>
      <figcaption className="szene__unterzeile">
        <span>{uhrzeit ? `${uhrzeit} Uhr` : RAUM_LABEL[raum]}</span>
        <span>Du bist {ORT_LABEL[bild.ziel]}</span>
      </figcaption>
    </figure>
  );
}
