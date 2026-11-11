// Fotoraum als Bühne des KI-Fallsimulators: Philipps Raumfoto (gemeinsamer Baustein
// src/ui/sim/raeume), darauf die nummerierten Marker, Kamerazoom zum Ort der Handlung,
// Live-Monitor im Bild (Raum 12), Nachtlicht, Alarmrand und wer gerade im Zimmer ist.

import type { ReactNode } from 'react';
import { RaumBuehne } from '../../ui/sim/raeume/RaumBuehne';
import { fotoFokus, type FallFotoRaum } from './fotoraeume';
import type { Marker, ObjektId } from './raeume';
import { PERSON_LABEL, type Fokus, type SzenenBild } from './szene';

export interface FotoSzeneProps {
  raum: FallFotoRaum;
  bild: SzenenBild;
  uhrzeit?: string;
  fokus?: Fokus;
  aktiverMarker?: ObjektId | null;
  onMarker: (m: Marker) => void;
  /** Ohne anklickbare Marker (z. B. im Rückblick) */
  ohneMarker?: boolean;
  /** Wird gezeigt, wenn das Foto nicht lädt. */
  fallback: ReactNode;
  onError?: () => void;
}

export function FotoSzene({ raum, bild, uhrzeit, fokus, aktiverMarker, onMarker, fallback, onError, ohneMarker }: FotoSzeneProps) {
  const kamera = fotoFokus(raum, fokus ?? bild.fokus);
  const nachtlicht = bild.nacht && !raum.nacht;
  const ereignisse = [
    ...bild.personen.map((p) => `${PERSON_LABEL[p]} im Zimmer`),
    bild.telefon ? 'Telefon klingelt' : '',
    bild.alarm ? 'Alarm' : '',
  ].filter(Boolean);
  const zeichen = [
    bild.schwitzt ? 'Schweißig' : '',
    bild.zyanose ? 'Lippen bläulich' : '',
    bild.sauerstoff ? 'Sauerstoff läuft' : '',
  ].filter(Boolean);
  const person = raum.marker.find((m) => m.id === 'patient');
  // Atemring im Takt der (geschätzten) Atemfrequenz, schneller und kräftiger bei Atemnot
  const atemDauer = `${(60 / Math.max(6, Math.min(50, bild.atem))).toFixed(2)}s`;
  return (
    <div className={`fall__foto ${bild.alarm ? 'is-alarm' : ''}`}>
      <RaumBuehne
        raum={raum.id}
        beschreibung={`${raum.titel}${uhrzeit ? `, ${uhrzeit} Uhr` : ''}: ${bild.beschreibung}`}
        monitor={raum.monitor ? { werte: bild.monitor, zustand: bild.monitorAn ? 'laeuft' : 'abwesend', titel: uhrzeit ? `${uhrzeit} Uhr` : undefined } : undefined}
        fokus={kamera}
        fallback={fallback}
        onError={onError}
        hotspots={ohneMarker ? [] : raum.marker.map((m) => ({
          id: m.id, kurz: String(m.nr), x: m.x, y: m.y, label: `${m.nr}: ${m.name} ansehen`,
          gedrueckt: aktiverMarker === m.id, aktiv: m.ort === bild.ziel && aktiverMarker !== m.id,
          onClick: () => onMarker(m),
        }))}
      >
        {nachtlicht && <div className="fall__foto-nacht" aria-hidden="true" />}
        {person && (
          <div className={`fall__foto-atem fall__foto-atem--${bild.zustand}`} aria-hidden="true"
            style={{ left: `${person.x * 100}%`, top: `${Math.min(0.92, person.y + 0.1) * 100}%`, ['--atem-dauer' as string]: atemDauer }} />
        )}
      </RaumBuehne>
      {/* Außerhalb der Kamera, damit Rand und Hinweise beim Zoomen stehen bleiben */}
      {bild.alarm && <div className="fall__foto-alarm" aria-hidden="true" />}
      <div className="fall__foto-leiste" aria-hidden="true">
        {uhrzeit && <span className="fall__foto-chip">{uhrzeit} Uhr</span>}
        {ereignisse.map((e) => <span key={e} className={`fall__foto-chip is-neu ${e === 'Alarm' || e === 'Telefon klingelt' ? 'is-wichtig' : ''} ${e === 'Telefon klingelt' ? 'is-klingeln' : ''}`}>{e}</span>)}
        {zeichen.map((z) => <span key={z} className="fall__foto-chip is-neu is-zeichen">{z}</span>)}
      </div>
      {!raum.personPasst && raum.personName && (
        <p className="fall__foto-hinweis muted">Beispielfoto: Die Person im Bild steht für {raum.personName}.</p>
      )}
    </div>
  );
}
