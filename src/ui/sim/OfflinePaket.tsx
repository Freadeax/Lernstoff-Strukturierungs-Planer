// Offline-Status eines Falls als Chip, mit „Für offline laden“ samt Fortschritt und Größe (SIM-04).
// Für alle Simulatoren: der Aufrufer übergibt, welche Dateien der Fall braucht, ob es eine
// Ersatzansicht gibt und ob der Fall grundsätzlich Netz braucht.

import { useEffect, useState } from 'react';
import { groesse, ladeOffline, OFFLINE_LABEL, offlineStatus, type OfflineBedarf, type OfflineStatus } from './offline';
import './offline.css';

export function OfflinePaket({ bedarf, kompakt = false, onlineGrund = 'Dieser Fall braucht eine Internetverbindung.' }: {
  bedarf: OfflineBedarf;
  /** Nur Chip und Knopf, ohne Erklärzeile */
  kompakt?: boolean;
  /** Erklärung, warum Netz nötig ist (z. B. „KI-Fall“) */
  onlineGrund?: string;
}) {
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [laeuft, setLaeuft] = useState<{ fertig: number; gesamt: number } | null>(null);
  const [fehler, setFehler] = useState('');
  const schluessel = bedarf.dateien.join('|') + bedarf.ersatz + bedarf.online;
  useEffect(() => {
    let aktiv = true;
    void offlineStatus(bedarf).then((s) => { if (aktiv) setStatus(s); });
    return () => { aktiv = false; };
  }, [schluessel]);
  if (!status) return null;

  async function laden() {
    setFehler('');
    setLaeuft({ fertig: 0, gesamt: status!.fehlend.length });
    const r = await ladeOffline(status!.fehlend, (fertig, gesamt) => setLaeuft({ fertig, gesamt }));
    setLaeuft(null);
    if (r.fehler.length) setFehler(`${r.fehler.length} Datei${r.fehler.length === 1 ? '' : 'en'} konnte${r.fehler.length === 1 ? '' : 'n'} nicht geladen werden. Bist du online?`);
    setStatus(await offlineStatus(bedarf));
  }

  const kannLaden = status.fehlend.length > 0 && !laeuft;
  return (
    <div className={`offline-paket offline-paket--${status.stufe}`}>
      <span className="offline-paket__chip">{OFFLINE_LABEL[status.stufe]}</span>
      {status.gesamt > 0 && <span className="muted offline-paket__menge">Medien {status.geladen}/{status.gesamt}{status.bytes ? ` · ${groesse(status.bytes)}` : ''}</span>}
      {kannLaden && <button type="button" className="small" onClick={() => void laden()}>Für offline laden</button>}
      {laeuft && (
        <span className="offline-paket__fortschritt" role="status">
          <progress max={laeuft.gesamt} value={laeuft.fertig} aria-label="Medien werden geladen" /> {laeuft.fertig}/{laeuft.gesamt}
        </span>
      )}
      {!kompakt && (
        <span className="muted offline-paket__text">
          {bedarf.online ? onlineGrund
            : status.stufe === 'vollstaendig' ? 'Alle Bilder liegen auf diesem Gerät.'
              : status.stufe === 'ersatzansicht' ? 'Ohne Netz zeigt der Fall statt fehlender Fotos eine Ersatzansicht.' : 'Ohne die fehlenden Medien ist der Fall offline nicht nutzbar.'}
        </span>
      )}
      {fehler && <span className="offline-paket__fehler" role="alert">{fehler}</span>}
    </div>
  );
}

export default OfflinePaket;
