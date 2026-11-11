// Offline-Paket je Fall, für alle Simulatoren (Audit SIM-04): Welche Medien ein Fall braucht,
// ob sie schon im Gerät liegen, und sie auf Wunsch vorab laden. Die App selbst ist vorab
// gecacht; Raumfotos, Porträts, Handlungsvideos und Bildserien kommen erst beim Ansehen in
// die Laufzeit-Caches (vite.config.ts). Hier wird genau das sichtbar und steuerbar.
//
// Status:
//  - 'vollstaendig'  alle Medien liegen im Gerät, der Fall braucht kein Netz
//  - 'ersatzansicht' es fehlen Medien, der Fall läuft offline aber mit Ersatzansicht (z. B. Zeichnung)
//  - 'online'        ohne Netz nicht nutzbar (KI-Fall, oder fehlende Medien ohne Ersatz)

import { RAEUME, raumUrl, type RaumId } from './raeume/katalog';
import { phasenBild, videoPfad, type HandlungsVideoId } from './handlungsvideos';

export type OfflineStufe = 'vollstaendig' | 'ersatzansicht' | 'online';
export const OFFLINE_LABEL: Record<OfflineStufe, string> = {
  vollstaendig: 'Offline vollständig', ersatzansicht: 'Offline mit Ersatzansicht', online: 'Online erforderlich',
};

export interface OfflineBedarf {
  /** Dateien relativ zur App-Basis oder absolut */
  dateien: string[];
  /** Gibt es eine Ersatzansicht, wenn Medien fehlen? */
  ersatz: boolean;
  /** Braucht der Fall grundsätzlich Netz (z. B. KI)? */
  online: boolean;
}

export interface OfflineStatus {
  stufe: OfflineStufe;
  geladen: number;
  gesamt: number;
  /** Größe der vorhandenen Dateien in Bytes */
  bytes: number;
  fehlend: string[];
}

/** Raum samt allen Varianten, die die Bühne je nach Zustand zeigt (ohne Monitor, Sensor, Nacht). */
export function raumDateien(id: RaumId): string[] {
  const ids = new Set<RaumId>([id]);
  for (let i = 0; i < 3; i++) {
    for (const r of [...ids]) {
      const raum = RAEUME[r];
      for (const v of [raum?.ohneMonitor, raum?.mitMonitor, raum?.verbunden, raum?.nacht]) if (v && RAEUME[v]) ids.add(v);
    }
  }
  return [...ids].map((r) => raumUrl(r));
}

export const videoDateien = (id: HandlungsVideoId): string[] => [videoPfad(id), ...[0, 1, 2, 3].map((p) => phasenBild(id, p))];

const absolut = (pfad: string) => new URL(pfad, typeof location !== 'undefined' ? location.href : 'http://localhost/').href;

/** Laufzeit-Cache je Ordner (wie in vite.config.ts), damit auch ohne aktiven Service Worker gespeichert wird. */
export function cacheFuer(pfad: string): string | null {
  for (const [teil, name] of [['/raeume/', 'raeume'], ['/personen/', 'personen'], ['/sim-videos/', 'sim-videos'], ['/bildgebung/', 'bildgebung']] as const) {
    if (absolut(pfad).includes(teil)) return name;
  }
  return null;
}

/** Stufe aus Bedarf und Zählung (rein, getestet). */
export function stufeVon(bedarf: Pick<OfflineBedarf, 'ersatz' | 'online'>, geladen: number, gesamt: number): OfflineStufe {
  if (bedarf.online) return 'online';
  if (geladen >= gesamt) return 'vollstaendig';
  return bedarf.ersatz ? 'ersatzansicht' : 'online';
}

const cacheDa = () => typeof caches !== 'undefined';

export async function offlineStatus(bedarf: OfflineBedarf): Promise<OfflineStatus> {
  const dateien = [...new Set(bedarf.dateien)];
  if (!cacheDa()) return { stufe: stufeVon(bedarf, 0, dateien.length), geladen: 0, gesamt: dateien.length, bytes: 0, fehlend: dateien };
  let bytes = 0;
  const fehlend: string[] = [];
  for (const d of dateien) {
    const r = await caches.match(absolut(d), { ignoreVary: true }).catch(() => undefined);
    if (r) bytes += Number(r.headers.get('content-length')) || (await r.blob()).size;
    else fehlend.push(d);
  }
  const geladen = dateien.length - fehlend.length;
  return { stufe: stufeVon(bedarf, geladen, dateien.length), geladen, gesamt: dateien.length, bytes, fehlend };
}

/** Lädt fehlende Dateien in die Laufzeit-Caches. Meldet den Fortschritt je Datei. */
export async function ladeOffline(dateien: string[], onFortschritt?: (fertig: number, gesamt: number) => void, signal?: AbortSignal): Promise<{ ok: number; fehler: string[] }> {
  const liste = [...new Set(dateien)];
  const fehler: string[] = [];
  let ok = 0;
  for (const [i, d] of liste.entries()) {
    if (signal?.aborted) break;
    try {
      const url = absolut(d);
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(String(res.status));
      const name = cacheFuer(d);
      if (cacheDa() && name) await (await caches.open(name)).put(url, res.clone());
      ok++;
    } catch {
      fehler.push(d);
    }
    onFortschritt?.(i + 1, liste.length);
  }
  return { ok, fehler };
}

export const groesse = (bytes: number) => (bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`);
