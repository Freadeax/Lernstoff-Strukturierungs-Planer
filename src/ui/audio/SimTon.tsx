// Ton für Simulatoren: ein Baustein, den Praxis-, Fall- und Diagnostiksimulator einbinden.
// Spielt Monitorpiep (Tonhöhe nach SpO₂), Alarm nach Stufe, Telefon, Patientenruf und Raumklang.
// Zeigt einen Schalter „Ton an/aus“, der für alle Simulatoren gilt (Kategorien sim + atmo).

import './audio.css';
import { Icon } from '../icons';
import { useStore } from '../lib/store';
import { audioEinstellungen, hoerbar } from './einstellungen';
import { alarmKlang, RAUM_KLANG, type Raum } from './klaenge';
import { entsperre } from './motor';
import { useSchleife } from './useKlang';

export interface SimTonProps {
  /** Monitor läuft: Pulston im Takt (weglassen, wenn der Simulator selbst piept) */
  monitor?: { puls?: number | null; spo2?: number | null; aktiv: boolean } | null;
  /** Pulston ein-/ausblenden, auch wenn der Monitor läuft */
  herzschlag?: boolean;
  alarm?: 'ok' | 'gelb' | 'rot' | 'kein';
  telefon?: boolean;
  ruf?: boolean;
  /** Technischer Hinweis (Sensor ab, Elektrode lose): Alarm niedriger Priorität */
  technisch?: boolean;
  raum?: Raum | null;
  /** Schalter anzeigen (Standard ja). Bei mehreren SimTon auf einer Seite nur einmal. */
  schalter?: boolean;
}

const zahl = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? n : undefined);

export function SimTon({ monitor, herzschlag = true, alarm, telefon, ruf, technisch, raum, schalter = true }: SimTonProps) {
  const an = useStore(audioEinstellungen, (s) => hoerbar('sim', s));
  const monitorAn = !!monitor?.aktiv && zahl(monitor.puls) !== undefined;
  const p = { puls: zahl(monitor?.puls), spo2: zahl(monitor?.spo2) };
  useSchleife(monitorAn && herzschlag ? 'monitor-piep' : null, p);
  useSchleife(monitorAn ? alarmKlang(alarm) : technisch ? 'alarm-niedrig' : null);
  useSchleife(telefon ? 'telefon' : null);
  useSchleife(ruf ? 'patientenruf' : null);
  useSchleife(raum ? RAUM_KLANG[raum] : null);
  if (!schalter) return null;
  function umschalten() {
    if (an) audioEinstellungen.set((s) => ({ ...s, kategorien: { ...s.kategorien, sim: false, atmo: false } }));
    else { audioEinstellungen.set((s) => ({ ...s, an: true, kategorien: { ...s.kategorien, sim: true, atmo: true } })); entsperre(); }
  }
  return (
    <button type="button" className="small ghost audio-knopf" aria-pressed={an} onClick={umschalten}
      title="Monitor, Alarme, Telefon und Raumklang. Gilt für alle Simulatoren.">
      <Icon name={an ? 'ton' : 'tonAus'} size={16} /> Ton
    </button>
  );
}

export default SimTon;
