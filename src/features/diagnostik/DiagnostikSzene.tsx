// Raumfoto des Falls mit Hotspots, die in die passenden Bereiche führen, und dem Monitor am Gerät.
// Die Szene ist Einstieg und Überblick; die eigentliche Arbeit passiert in den Reitern darunter.

import { useState } from 'react';
import { RaumBuehne, type Hotspot } from '../../ui/sim/raeume/RaumBuehne';
import { RAEUME, raumFuerZustand } from '../../ui/sim/raeume/katalog';
import type { MonitorWerte } from '../../ui/sim/monitor';
import type { Befehl, MonitorStatus } from './lauf';
import type { Reiter } from './FallAnsicht';
import type { DiagnostikFall } from './typen';

/** Wohin ein Hotspot führt (nach Hotspot-ID aus dem Raumkatalog). */
const ZIEL: Record<string, { reiter: Reiter; text: string }> = {
  patient: { reiter: 'beobachtung', text: 'ansehen und beobachten' },
  monitor: { reiter: 'beobachtung', text: 'Monitor groß öffnen' },
  manschette: { reiter: 'beobachtung', text: 'Blutdruck ablesen' },
  fingersensor: { reiter: 'beobachtung', text: 'Sättigung ablesen' },
  infusion: { reiter: 'beobachtung', text: 'Infusion kontrollieren' },
  drainage: { reiter: 'beobachtung', text: 'Ausscheidung ansehen' },
  vitalzeichen: { reiter: 'beobachtung', text: 'Vitalzeichen messen' },
  defibrillator: { reiter: 'beobachtung', text: 'Rhythmus am Monitor ansehen' },
  material: { reiter: 'labor', text: 'Blutabnahme vorbereiten' },
  notfallwagen: { reiter: 'labor', text: 'Material für Zugang und Blutabnahme' },
  rettungsdienst: { reiter: 'uebergabe', text: 'Übergabe und ärztliche Information' },
  arbeitsplatz: { reiter: 'uebergabe', text: 'Ärztin oder Arzt informieren' },
  rufanlage: { reiter: 'uebergabe', text: 'Ärztin oder Arzt informieren' },
  nachttisch: { reiter: 'labor', text: 'Labor anfordern' },
  // Kinderzimmer
  kind: { reiter: 'beobachtung', text: 'ansehen und beobachten' },
  mutter: { reiter: 'beobachtung', text: 'Mutter befragen: Trinkmenge, Windeln, Verlauf' },
  trinkbecher: { reiter: 'beobachtung', text: 'Trinkmenge abschätzen' },
  thermometer: { reiter: 'beobachtung', text: 'Temperatur messen' },
  fingerclip: { reiter: 'beobachtung', text: 'Sättigung ablesen' },
  sauerstoff: { reiter: 'beobachtung', text: 'Sauerstoff nach Anordnung' },
  spacer: { reiter: 'beobachtung', text: 'Inhalation mit Spacer' },
};

const SENSOR = ['fingersensor', 'fingerclip'];

export function DiagnostikSzene({ fall, werte, status, senden, setReiter, telefon }: {
  fall: DiagnostikFall; werte: MonitorWerte; status: MonitorStatus; senden: (b: Befehl) => void; setReiter: (r: Reiter) => void; telefon: boolean;
}) {
  const [fokus, setFokus] = useState<{ x: number; y: number } | null>(null);
  // Gleiche Raumvariante wie die Bühne (z. B. Sensor am Kind sichtbar), damit die Hotspots passen.
  const raum = RAEUME[raumFuerZustand(fall.raum, status)];
  const patientName = fall.patient.name;

  const hotspots: Hotspot[] = raum.hotspots
    .filter((h) => ZIEL[h.id])
    .map((h, i) => {
      const z = ZIEL[h.id];
      const istPatient = h.id === 'patient' || h.id === 'kind';
      // Abgerutschter Fingersensor: Hotspot am Sensor bzw. Monitor behebt ihn.
      if (status === 'signalausfall' && (SENSOR.includes(h.id) || (h.id === 'monitor' && !raum.hotspots.some((x) => SENSOR.includes(x.id))))) {
        return { id: h.id, label: 'SpO₂-Signal fehlt: Fingersensor prüfen und neu anlegen', kurz: '!', x: h.x, y: h.y, aktiv: true, onClick: () => senden({ typ: 'sensor' }) };
      }
      return {
        id: h.id, kurz: String(i + 1), x: h.x, y: h.y,
        label: `${istPatient ? patientName : h.label}: ${z.text}`,
        onClick: () => { setFokus((f) => (f && f.x === h.x && f.y === h.y ? null : { x: h.x, y: h.y })); setReiter(z.reiter); },
      };
    });
  if (status === 'abwesend') {
    hotspots.push({ id: 'anschliessen', label: 'Monitor holen und anschließen (EKG, Fingersensor, Blutdruckmanschette)', kurz: '+', x: 0.72, y: 0.3, aktiv: true, onClick: () => senden({ typ: 'monitor' }) });
  }

  return (
    <div className="dx-szene">
      <RaumBuehne
        raum={fall.raum}
        hotspots={hotspots}
        monitor={{ werte, zustand: status === 'abwesend' ? 'abwesend' : status, ausfall: ['spo2'] }}
        fokus={fokus ? { ...fokus, zoom: 1.6 } : undefined}
        fallback={<p>Raumbild nicht geladen. Der Fall funktioniert trotzdem über die Reiter unten.</p>}
      >
        {telefon && <p className="dx-szene__banner" role="presentation"><span aria-hidden="true">☎</span> Zentrallabor am Telefon</p>}
        {status === 'signalausfall' && <p className="dx-szene__banner is-gelb" role="presentation"><span aria-hidden="true">⚠</span> SpO₂: kein Signal</p>}
      </RaumBuehne>
      <p className="muted dx-klein">{raum.titel}. {status === 'abwesend' ? 'Noch kein Monitor am Bett: mit + anschließen. ' : status === 'signalausfall' ? 'Die Sättigung fehlt am Monitor, EKG und Blutdruck laufen weiter: mit ! den Sensor prüfen. ' : ''}Nummern antippen führt zum passenden Bereich. KI-generiertes Szenenbild.</p>
    </div>
  );
}
