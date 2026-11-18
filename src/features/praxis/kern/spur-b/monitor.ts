// Spur B – Anzeige des Kerns → Werte für den PatientenMonitor (src/ui/sim/PatientenMonitor.tsx).
// Nur Sichtbares wird übergeben: was nicht gemessen bzw. angeschlossen ist, zeigt der Monitor als „--“ oder gar nicht.

import type { MonitorWerte } from '../../../../ui/sim/monitor';
import type { Anzeige } from '../typen';

export function monitorWerte(a: Anzeige, sichtbar: ReadonlyArray<keyof Anzeige>, sauerstoff = false): MonitorWerte {
  const s = new Set(sichtbar);
  const w = <K extends keyof Anzeige>(k: K) => (s.has(k) ? (a[k] as number | undefined) ?? null : null);
  return {
    puls: w('hf'), af: w('af'), spo2: w('spo2'), sys: w('rrSys'), dia: w('rrDia'), temp: w('temp'),
    avpu: s.has('avpu') ? a.avpu : null, sauerstoff,
    map: w('map'),
    artSys: w('artSys'), artDia: w('artDia'), artGedaempft: s.has('artSys') ? !!a.artGedaempft : null,
    etco2: w('etco2'),
    rhythmus: s.has('rhythmus') || s.has('hf') ? a.rhythmus : null,
  };
}
