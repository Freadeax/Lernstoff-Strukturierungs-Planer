// Fotoansicht des Praxissimulators: das Raumfoto zum Fall als Bühne (gemeinsame RaumBuehne),
// darauf der Live-Monitor am Gerät, Hotspots für Patient, Monitor, Material und Telefon,
// Sprechblasen, Atemring am Patienten, Handlungsmarker und Alarmrand. Gleiche Bedienung wie die
// Zeichnung; die Ortsleiste darunter ist der zugängliche Weg.

import { useState, type CSSProperties } from 'react';
import { RaumBuehne, type BuehnenMonitor, type Hotspot } from '../../ui/sim/raeume/RaumBuehne';
import { RAEUME } from '../../ui/sim/raeume/katalog';
import { HandlungsVideo } from '../../ui/sim/HandlungsVideo';
import type { HandlungsVideoId } from '../../ui/sim/handlungsvideos';
import { consciousness } from './engine';
import { RAUM_ELEMENTE, raumElemente, type RaumElement } from './raum';
import { laufendeVariante, type Punkt, type RaumFoto } from './raumfotos';
import { szene, type HandlungsArt, type SzenenZustand } from './szene';
import { BLASEN_TITEL, OrteLeiste, StatusChips, useBlase } from './Szene';
import type { Session } from './types';

const TAETIGKEIT: Record<HandlungsArt, string> = {
  messen: 'misst', hoeren: 'hört ab', reden: 'im Gespräch', tasten: 'untersucht', telefonieren: 'telefoniert', material: 'richtet Material', schreiben: 'dokumentiert',
};
/** Tür bzw. Eingang: liegt in keinem Foto fest, daher am linken Rand. */
const TUER: Punkt = { x: 8, y: 42 };

/** Monitorzustand am Gerät: läuft nur mit angeschlossenem Monitoring, sonst Raum ohne Monitor (12a, 20a, 21a) bzw. Standby. */
export function fotoMonitor(s: Session, z: SzenenZustand, raum: RaumFoto): BuehnenMonitor {
  // Während einer Maßnahme (z. B. Inhalation, Raum 21b) steht das Gerät im Bild, also Standby statt Raum ohne Monitor.
  if (!s.monitoring) return { werte: {}, zustand: RAEUME[raum.id].ohneMonitor && !laufendeVariante(raum, s.flags, s.time) ? 'abwesend' : 'standby' };
  return {
    zustand: 'laeuft',
    werte: { puls: s.measured.pulse ?? null, af: s.measured.resp ?? null, spo2: s.measured.spo2 ?? null, sys: s.measured.sys ?? null, dia: s.measured.dia ?? null, temp: s.measured.temp ?? null, avpu: consciousness(s), sauerstoff: z.sauerstoff },
  };
}

const pos = (p: Punkt): CSSProperties => ({ left: `${p.x}%`, top: `${p.y}%` });

export function FotoSzene({ s, raum, fokus, onFokus, zeitraffer, onZeichnung }: {
  s: Session; raum: RaumFoto; fokus: RaumElement; onFokus: (e: RaumElement) => void; zeitraffer: number; onZeichnung: () => void;
}) {
  const z = szene(s);
  const info = raumElemente(s.scenario);
  const blase = useBlase(z);
  const [video, setVideo] = useState<HandlungsVideoId | null>(null);
  const name = (e: RaumElement) => raum.namen?.[e] ?? info[e].label;

  const hotspots: Hotspot[] = [
    ...RAUM_ELEMENTE.map((e, i) => ({
      id: e, kurz: String(i + 1), label: `${i + 1}: ${name(e)}`, x: raum.orte[e].x / 100, y: raum.orte[e].y / 100,
      gedrueckt: fokus === e,
      aktiv: (e === 'telefon' && z.telefonKlingelt) || (e === 'monitor' && z.alarm === 'rot') || (e === 'patient' && !!z.komplikation),
      onClick: () => onFokus(e),
    })),
    ...(raum.details ?? []).map(d => ({ id: d.id, kurz: '▶', label: d.label, x: d.punkt.x / 100, y: d.punkt.y / 100, onClick: () => setVideo(d.id) })),
  ];

  const ort = (q: RaumElement | 'tuer' | 'pflege'): Punkt => q === 'tuer' ? TUER : q === 'pflege' ? raum.orte[z.handlung?.element ?? fokus] : raum.orte[q];
  const anker = blase ? ort(blase.quelle) : undefined;
  // Nachts das echte Nachtfoto, wenn es eins gibt (20n), sonst der abgedunkelte Filter.
  const nachtFoto = z.nacht ? RAEUME[raum.id].nacht : undefined;
  const nachtFilter = z.nacht && !raum.nacht && !nachtFoto;
  const klassen = ['szene', 'szene--foto', `is-alarm-${z.alarm}`, z.komplikation ? 'is-komplikation' : ''].filter(Boolean).join(' ');

  return <div className={klassen} style={{ '--atem': `${z.atemSek.toFixed(2)}s` } as CSSProperties}>
    <div className="szene__buehne">
      <RaumBuehne
        raum={nachtFoto ?? laufendeVariante(raum, s.flags, s.time) ?? raum.id} hotspots={hotspots} monitor={fotoMonitor(s, z, raum)}
        fallback={<div className="foto__fallback"><p>Das Raumfoto ist noch nicht geladen (zum Beispiel offline beim ersten Aufruf).</p><button type="button" onClick={onZeichnung}>Zeichnung zeigen</button></div>}
      >
        {nachtFilter && <span className="foto__nacht" aria-hidden="true" />}
        <span className="foto__atem" style={pos(raum.orte.patient)} aria-hidden="true" />
        {z.handlung && <span key={z.handlung.id} className="foto__taetigkeit" style={pos(raum.orte[z.handlung.element])} aria-hidden="true">Du {TAETIGKEIT[z.handlung.art]}</span>}
        {blase && anker && <div key={blase.id} className={`szene__blase is-${blase.ton} ${anker.x < 35 ? 'is-links' : anker.x > 65 ? 'is-rechts' : ''}`} style={{ left: `${anker.x}%`, top: `${Math.max(anker.y, 30)}%` }} aria-hidden="true">
          <strong>{BLASEN_TITEL[blase.ton]}</strong>
          <span>{blase.ton === 'rede' ? `„${blase.text}“` : blase.text}</span>
        </div>}
        <span className="foto__alarm" aria-hidden="true" />
      </RaumBuehne>
    </div>
    <OrteLeiste s={s} fokus={fokus} onFokus={onFokus} nummern />
    <StatusChips z={z} zeitraffer={zeitraffer} />
    {video && <HandlungsVideo id={video} onClose={() => setVideo(null)} />}
  </div>;
}
