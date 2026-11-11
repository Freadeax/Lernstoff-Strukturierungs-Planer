// Fotoraum als Bühne des KI-Fallsimulators: Philipps Raumfoto (gemeinsamer Baustein
// src/ui/sim/raeume), darauf die nummerierten Marker, Kamerazoom zum Ort der Handlung,
// Live-Monitor im Bild (Raum 12), Nachtlicht, Alarmrand und wer gerade im Zimmer ist.

import type { ReactNode } from 'react';
import { RaumBuehne } from '../../ui/sim/raeume/RaumBuehne';
import { fotoFokus, type FotoRaum } from './fotoraeume';
import type { Marker, ObjektId } from './raeume';
import { PERSON_LABEL, type Fokus, type SzenenBild } from './szene';

export interface FotoSzeneProps {
  raum: FotoRaum;
  bild: SzenenBild;
  uhrzeit?: string;
  fokus?: Fokus;
  aktiverMarker?: ObjektId | null;
  onMarker: (m: Marker) => void;
  /** Wird gezeigt, wenn das Foto nicht lädt. */
  fallback: ReactNode;
  onError?: () => void;
}

export function FotoSzene({ raum, bild, uhrzeit, fokus, aktiverMarker, onMarker, fallback, onError }: FotoSzeneProps) {
  const kamera = fotoFokus(raum, fokus ?? bild.fokus);
  const nachtlicht = bild.nacht && !raum.nacht;
  const ereignisse = [
    ...bild.personen.map((p) => `${PERSON_LABEL[p]} im Zimmer`),
    bild.telefon ? 'Telefon klingelt' : '',
    bild.alarm ? 'Alarm' : '',
  ].filter(Boolean);
  return (
    <div className={`fall__foto ${bild.alarm ? 'is-alarm' : ''}`}>
      <RaumBuehne
        raum={raum.id}
        beschreibung={`${raum.titel}${uhrzeit ? `, ${uhrzeit} Uhr` : ''}: ${bild.beschreibung}`}
        monitor={raum.monitor ? { werte: bild.monitor, zustand: bild.monitorAn ? 'laeuft' : 'abwesend', titel: uhrzeit ? `${uhrzeit} Uhr` : undefined } : undefined}
        fokus={kamera}
        fallback={fallback}
        onError={onError}
        hotspots={raum.marker.map((m) => ({
          id: m.id, kurz: String(m.nr), x: m.x, y: m.y, label: `${m.nr}: ${m.name} ansehen`,
          gedrueckt: aktiverMarker === m.id, aktiv: m.ort === bild.ziel && aktiverMarker !== m.id,
          onClick: () => onMarker(m),
        }))}
      >
        {nachtlicht && <div className="fall__foto-nacht" aria-hidden="true" />}
      </RaumBuehne>
      {/* Außerhalb der Kamera, damit Rand und Hinweise beim Zoomen stehen bleiben */}
      {bild.alarm && <div className="fall__foto-alarm" aria-hidden="true" />}
      <div className="fall__foto-leiste" aria-hidden="true">
        {uhrzeit && <span className="fall__foto-chip">{uhrzeit} Uhr</span>}
        {ereignisse.map((e) => <span key={e} className={`fall__foto-chip ${e === 'Alarm' || e === 'Telefon klingelt' ? 'is-wichtig' : ''}`}>{e}</span>)}
      </div>
    </div>
  );
}
