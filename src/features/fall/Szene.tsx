// Animierte Zimmerszene des KI-Fallsimulators in Schrägansicht (2,5D).
// Patient atmet im Takt der AF, Hautfarbe nach Zustand, Lagerung, Sauerstoff, Personen kommen zur Tür,
// das Telefon klingelt, deine Figur läuft zum Ort der Handlung, die Kamera fährt bei Ereignissen heran.
// Alles ist reine Darstellung: die Beschreibung steht als Text für Screenreader dabei.

import { useId, type CSSProperties } from 'react';
import type { Fokus, Ort, Person, SzenenBild } from './szene';
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

// Wo Dinge stehen (Bodenpunkte)
const ORT: Record<Ort, [number, number]> = {
  bett: [190, 175], monitor: [70, 150], wagen: [330, 140], telefon: [300, 250], tuer: [40, 225],
};
const PERSON_ORT: Record<Person, [number, number]> = {
  aerztin: [95, 230], angehoerige: [60, 280], kollegin: [150, 270], notfallteam: [250, 200],
};
const PERSON_FARBE: Record<Person, string> = { aerztin: '#ffffff', angehoerige: '#a78bfa', kollegin: '#5eead4', notfallteam: '#ef4444' };

// Kamera: Bildpunkt, auf den gezoomt wird, und Zoomstufe
const FOKUS: Record<Fokus, { punkt: [number, number]; zoom: number }> = {
  raum: { punkt: [435, 157], zoom: 1 },
  bett: { punkt: [...iso(180, 110, 30)] as [number, number], zoom: 1.35 },
  monitor: { punkt: [...iso(40, 20, 120)] as [number, number], zoom: 1.55 },
  wagen: { punkt: [...iso(330, 110, 30)] as [number, number], zoom: 1.4 },
  telefon: { punkt: [...iso(320, 260, 50)] as [number, number], zoom: 1.45 },
  tuer: { punkt: [...iso(20, 220, 60)] as [number, number], zoom: 1.35 },
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

export function Szene({ bild, uhrzeit }: { bild: SzenenBild; uhrzeit?: string }) {
  const f = FOKUS[bild.fokus];
  const k = f.zoom;
  const mitte: [number, number] = [VIEW.x + VIEW.w / 2, VIEW.y + VIEW.h / 2];
  // Zoom bleibt im Raum: Kamera so verschieben, dass der Fokuspunkt in die Mitte rückt
  const tx = Math.max(Math.min(mitte[0] - f.punkt[0] * k, VIEW.x - VIEW.x * k), VIEW.x + VIEW.w - (VIEW.x + VIEW.w) * k);
  const ty = Math.max(Math.min(mitte[1] - f.punkt[1] * k, VIEW.y - VIEW.y * k), VIEW.y + VIEW.h - (VIEW.y + VIEW.h) * k);
  // transform-box view-box misst vom viewBox-Ursprung aus; der Ursprung soll aber bei (0, 0) liegen
  const kamera: CSSProperties = { transform: `translate(${tx}px, ${ty}px) scale(${k})`, transformOrigin: `${-VIEW.x}px ${-VIEW.y}px` };
  const [nx, ny] = iso(...ORT[bild.ziel]);
  const atemDauer = `${(60 / Math.min(60, Math.max(4, bild.atem))).toFixed(2)}s`;
  const hautfarbe = HAUT[bild.zustand];
  const kopf = bild.oberkoerperHoch ? iso(95, 105, 72) : iso(92, 105, 52);
  const [mx, my] = iso(40, 20, 120);
  const clip = `szene-clip-${useId().replace(/:/g, '')}`;

  return (
    <figure className={`szene ${bild.nacht ? 'is-nacht' : ''} ${bild.alarm ? 'is-alarm' : ''}`} style={{ '--szene-atem': atemDauer } as CSSProperties}>
      <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} role="img" aria-label={`Patientenzimmer${uhrzeit ? `, ${uhrzeit} Uhr` : ''}: ${bild.beschreibung}`}>
        <g className="szene__kamera" style={kamera}>
          {/* Wände und Boden */}
          <polygon points={pkt(iso(0, 0), iso(400, 0), iso(400, 0, 160), iso(0, 0, 160))} className="szene__wand-hinten" />
          <polygon points={pkt(iso(0, 0), iso(0, 300), iso(0, 300, 160), iso(0, 0, 160))} className="szene__wand-links" />
          <polygon points={pkt(iso(0, 0), iso(400, 0), iso(400, 300), iso(0, 300))} className="szene__boden" />
          {[100, 200, 300].map((x) => <line key={x} x1={iso(x, 0)[0]} y1={iso(x, 0)[1]} x2={iso(x, 300)[0]} y2={iso(x, 300)[1]} className="szene__fuge" />)}
          {[100, 200].map((y) => <line key={y} x1={iso(0, y)[0]} y1={iso(0, y)[1]} x2={iso(400, y)[0]} y2={iso(400, y)[1]} className="szene__fuge" />)}

          {/* Fenster mit Tageszeit */}
          <polygon points={pkt(iso(130, 0, 70), iso(220, 0, 70), iso(220, 0, 140), iso(130, 0, 140))} className="szene__fenster" />
          <circle cx={iso(205, 0, 125)[0]} cy={iso(205, 0, 125)[1]} r="6" className="szene__mond" />
          <Uhr minuten={bild.minuten} />

          {/* Tür mit Alarmlampe */}
          <polygon points={pkt(iso(0, 190), iso(0, 260), iso(0, 260, 120), iso(0, 190, 120))} className="szene__tuer" />
          <circle cx={iso(0, 225, 135)[0]} cy={iso(0, 225, 135)[1]} r="6" className="szene__lampe" />

          {/* Sauerstoff-Wandanschluss und Monitor am Bettkopf */}
          <rect x={iso(70, 0, 95)[0] - 5} y={iso(70, 0, 95)[1] - 5} width="10" height="10" rx="2" fill="#7ea4c9" />
          <line x1={iso(40, 20)[0]} y1={iso(40, 20)[1]} x2={iso(40, 20, 100)[0]} y2={iso(40, 20, 100)[1]} stroke="#8d9a97" strokeWidth="3" />
          <g className={`szene__monitor ${bild.monitorAn ? 'is-an' : ''}`}>
            <rect x={mx - 26} y={my - 18} width="52" height="34" rx="4" className="szene__monitor-rahmen" />
            <clipPath id={clip}><rect x={mx - 22} y={my - 14} width="44" height="26" /></clipPath>
            <g clipPath={`url(#${clip})`}>
              <path className="szene__ekg" d={`M${mx - 66} ${my}` + Array.from({ length: 8 }, () => ` h6 l2 -2 l2 2 h2 l2 -9 l2 14 l2 -5 h4`).join('')} />
            </g>
          </g>

          {/* Bett mit Patient */}
          <Quader x={70} y={70} b={230} t={80} h={22} oben="#c7d0cd" links="#a9b4b1" rechts="#b8c2bf" />
          <Quader x={72} y={72} b={226} t={76} h={12} z={22} oben="#f3f6f5" links="#dfe5e3" rechts="#e8eceb" />
          {bild.oberkoerperHoch && (
            <polygon points={pkt(iso(75, 75, 34), iso(75, 145, 34), iso(115, 145, 78), iso(115, 75, 78))} fill="#e5ebe9" stroke="#c4cdca" />
          )}
          <g className="szene__patient">
            <polygon points={pkt(iso(140, 80, 38), iso(290, 80, 38), iso(290, 140, 38), iso(140, 140, 38))} fill="#8ab8d6" />
            <ellipse className="szene__brust" cx={iso(165, 110, 46)[0]} cy={iso(165, 110, 46)[1]} rx="34" ry="13" fill="#8ab8d6" />
            <circle cx={kopf[0]} cy={kopf[1]} r="15" fill={hautfarbe} />
            <path d={`M${kopf[0] - 5} ${kopf[1] + 6} q5 ${bild.zustand === 'verbessert' ? 3 : -2} 10 0`} stroke={bild.zyanose ? '#5b6fb0' : '#9b5b5b'} strokeWidth="2" fill="none" />
            <circle cx={kopf[0] - 5} cy={kopf[1] - 2} r="1.8" fill="#333" />
            <circle cx={kopf[0] + 5} cy={kopf[1] - 2} r="1.8" fill="#333" />
            {bild.schwitzt && <g className="szene__schweiss" fill="#7cc4f0"><circle cx={kopf[0] + 13} cy={kopf[1] - 9} r="2.2" /><circle cx={kopf[0] - 13} cy={kopf[1] - 5} r="1.8" /></g>}
            {bild.sauerstoff && (
              <path className="szene__o2" d={`M${iso(70, 0, 95)[0]} ${iso(70, 0, 95)[1]} C ${iso(70, 40, 80)[0]} ${iso(70, 40, 80)[1]}, ${kopf[0] - 30} ${kopf[1] + 20}, ${kopf[0] - 2} ${kopf[1] + 3}`} />
            )}
          </g>

          {/* Materialwagen */}
          <Quader x={320} y={50} b={50} t={60} h={55} oben="#d5dde0" links="#9eb0b8" rechts="#b7c6cc" />
          <rect x={iso(345, 50, 45)[0] - 6} y={iso(345, 50, 45)[1] - 4} width="12" height="8" rx="2" fill="#f97316" />

          {/* Schreibtisch mit Telefon */}
          <Quader x={300} y={235} b={80} t={50} h={40} oben="#cbb79a" links="#a8957a" rechts="#b9a488" />
          <g className={`szene__telefon ${bild.telefon ? 'is-klingelt' : ''}`} style={{ transformOrigin: `${iso(335, 255, 45)[0]}px ${iso(335, 255, 45)[1]}px` }}>
            <rect x={iso(335, 255, 45)[0] - 10} y={iso(335, 255, 45)[1] - 7} width="20" height="10" rx="3" fill="#2b3446" />
            {bild.telefon && <path d={`M${iso(335, 255, 45)[0] + 14} ${iso(335, 255, 45)[1] - 12} q6 6 0 12 M${iso(335, 255, 45)[0] + 19} ${iso(335, 255, 45)[1] - 17} q11 11 0 22`} className="szene__klingeln" />}
          </g>

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
        </g>
      </svg>
      <figcaption className="szene__unterzeile">
        <span>{uhrzeit ? `${uhrzeit} Uhr` : 'Patientenzimmer'}</span>
        <span>Du bist {ORT_LABEL[bild.ziel]}</span>
      </figcaption>
    </figure>
  );
}
