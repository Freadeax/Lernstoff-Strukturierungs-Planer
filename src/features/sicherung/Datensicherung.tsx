import { useEffect, useState } from 'react';
import { notify } from '../../ui/shell/notifications';
import { relativeTime } from '../../ui/lib/time';
import {
  bitteUmDauerhaftenSpeicher, kannTeilen, lesePruefe, leseMerker, setzeMerker, sichereUndGibWeiter, spieleEin,
  type Modus, type Sicherung, type Uebersicht,
} from '../../core/sicherung';
import './sicherung.css';

const datum = (iso: string) => { try { return new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; } };

function Erstellen({ onFertig }: { onFertig: () => void }) {
  const [busy, setBusy] = useState(false);
  const teilen = kannTeilen();
  async function los(art: 'teilen' | 'datei') {
    setBusy(true);
    try {
      const r = await sichereUndGibWeiter(art);
      if (r !== 'abgebrochen') { notify('info', 'Sicherung erstellt', r === 'geteilt' ? 'Die Datei wurde weitergegeben.' : 'Die Datei liegt in deinen Downloads.'); void bitteUmDauerhaftenSpeicher(); }
      onFertig();
    } catch (e) {
      notify('critical', 'Sicherung fehlgeschlagen', e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }
  return (
    <div className="card">
      <h3>Sicherung erstellen</h3>
      <p>Eine Datei mit allem, was du hier gelernt und angelegt hast: Lernplan, Lernstand-Board, Karteikarten, Prüfungssimulationen, Fälle, Mindmaps, Trainer-Bestwerte, importierte Dokumente und Zusammenfassungen.</p>
      <p className="muted">Nicht enthalten: dein API-Schlüssel und Zugangsdaten für „Große Dateien“. Die trägst du auf jedem Gerät selbst ein.</p>
      <div className="sicherung__knoepfe">
        {teilen && <button type="button" className="primary" disabled={busy} onClick={() => los('teilen')}>Sichern und teilen …</button>}
        <button type="button" className={teilen ? '' : 'primary'} disabled={busy} onClick={() => los('datei')}>Als Datei speichern</button>
      </div>
      {teilen && <p className="muted">„Teilen“ öffnet das Teilen-Menü: AirDrop an dein iPad, „In Dateien sichern“ (iCloud Drive) oder per Mail an dich selbst.</p>}
    </div>
  );
}

function Einspielen() {
  const [datei, setDatei] = useState<{ name: string; sicherung: Sicherung; uebersicht: Uebersicht } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [modus, setModus] = useState<Modus>('zusammenfuehren');
  const [busy, setBusy] = useState(false);
  const [fertig, setFertig] = useState<string | null>(null);

  async function waehle(f: File | undefined) {
    setFehler(null); setDatei(null); setFertig(null);
    if (!f) return;
    try { setDatei({ name: f.name, ...lesePruefe(await f.text()) }); }
    catch (e) { setFehler(e instanceof Error ? e.message : String(e)); }
  }

  async function los() {
    if (!datei) return;
    if (modus === 'ersetzen' && !confirm('Alle Daten auf diesem Gerät werden durch die Sicherung ersetzt. Was nur hier gespeichert ist, geht verloren. Fortfahren?')) return;
    setBusy(true);
    try {
      const e = await spieleEin(datei.sicherung, modus);
      setFertig(modus === 'ersetzen'
        ? `${e.neu} Einträge eingespielt.`
        : `${e.neu} Einträge ergänzt, ${e.aktualisiert} durch neuere ersetzt.`);
      setDatei(null);
      void bitteUmDauerhaftenSpeicher();
    } catch (err) {
      setFehler(`Einspielen fehlgeschlagen, es wurde nichts verändert: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <h3>Sicherung einspielen</h3>
      <p>Hier holst du deinen Lernstand auf dieses Gerät, zum Beispiel vom iPhone aufs iPad.</p>
      <label className="upload">
        <input type="file" accept="application/json,.json" onChange={(e) => { void waehle(e.target.files?.[0]); e.target.value = ''; }} />
        Sicherungsdatei auswählen (lernstoff-sicherung-….json)
      </label>
      {fehler && <p className="note warn" role="alert">{fehler}</p>}
      {fertig && (
        <div className="note ok" role="status">
          <strong>Fertig.</strong> {fertig} Damit alle Seiten den neuen Stand zeigen, lädt die App neu.
          <div className="row"><button type="button" className="primary" onClick={() => location.reload()}>Jetzt neu laden</button></div>
        </div>
      )}
      {datei && (
        <div className="sicherung__vorschau">
          <p><strong>{datei.name}</strong><br />
            <span className="muted">Erstellt {datum(datei.uebersicht.exportedAt)}{datei.uebersicht.geraet ? ` auf ${datei.uebersicht.geraet}` : ''}</span></p>
          {datei.uebersicht.zeilen.length
            ? <ul className="sicherung__liste">{datei.uebersicht.zeilen.map((z) => <li key={z.label}><span>{z.label}</span><strong>{z.anzahl}</strong></li>)}</ul>
            : <p className="muted">Die Sicherung enthält kaum Daten (nur Einstellungen).</p>}
          {datei.uebersicht.unbekannteTabellen.length > 0 && <p className="muted">Nicht übernommen (unbekannt): {datei.uebersicht.unbekannteTabellen.join(', ')}</p>}
          <fieldset className="sicherung__modus">
            <legend>Wie einspielen?</legend>
            <label><input type="radio" name="modus" checked={modus === 'zusammenfuehren'} onChange={() => setModus('zusammenfuehren')} />
              <span><strong>Zusammenführen</strong> (empfohlen): Was hier schon ist, bleibt. Fehlendes kommt dazu, bei doppelten Einträgen gewinnt der neuere.</span></label>
            <label><input type="radio" name="modus" checked={modus === 'ersetzen'} onChange={() => setModus('ersetzen')} />
              <span><strong>Ersetzen</strong>: Dieses Gerät bekommt genau den Stand der Datei. Was nur hier gespeichert ist, wird gelöscht.</span></label>
          </fieldset>
          <div className="sicherung__knoepfe">
            <button type="button" className={modus === 'ersetzen' ? 'danger' : 'primary'} disabled={busy} onClick={los}>{busy ? 'Spielt ein …' : 'Einspielen'}</button>
            <button type="button" className="ghost" disabled={busy} onClick={() => setDatei(null)}>Abbrechen</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Speicherstatus() {
  const [st, setSt] = useState<{ dauerhaft?: boolean; belegt?: number } | null>(null);
  const [merker, setMerker] = useState(leseMerker());
  useEffect(() => {
    void (async () => {
      try {
        const [dauerhaft, est] = await Promise.all([navigator.storage?.persisted?.(), navigator.storage?.estimate?.()]);
        setSt({ dauerhaft, belegt: est?.usage });
      } catch { setSt({}); }
    })();
    const t = setInterval(() => setMerker(leseMerker()), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="card">
      <h3>Wo liegen meine Daten?</h3>
      <p>Nur hier, in diesem Browser auf diesem Gerät. Es gibt kein Konto und keinen Server, deshalb sieht auch niemand sonst deinen Lernstand.</p>
      <ul className="sicherung__fakten">
        <li>Letzte Sicherung: <strong>{merker.zuletzt ? `${relativeTime(merker.zuletzt)} (${datum(merker.zuletzt)})` : 'noch keine'}</strong></li>
        {st?.belegt !== undefined && <li>Belegter Speicher: {(st.belegt / 1024 / 1024).toFixed(1)} MB</li>}
        {st?.dauerhaft !== undefined && <li>Vor automatischem Aufräumen geschützt: {st.dauerhaft ? 'ja' : 'nein'}{!st.dauerhaft && <> · <button type="button" className="link" onClick={async () => setSt({ ...st, dauerhaft: await bitteUmDauerhaftenSpeicher() })}>Schutz anfragen</button></>}</li>}
      </ul>
      <details>
        <summary>Was heißt das für iPhone und iPad?</summary>
        <ul>
          <li>Füge die App mit „Teilen → Zum Home-Bildschirm“ hinzu und öffne sie immer von dort. Safari löscht Daten von Webseiten, die du länger nicht besuchst, die App auf dem Home-Bildschirm ist davon ausgenommen.</li>
          <li>Safari und die Home-Bildschirm-App haben getrennte Speicher. Was du in Safari gelernt hast, siehst du in der App erst nach Sicherung und Einspielen.</li>
          <li>iPhone und iPad gleichen sich nicht von selbst ab. Sichere auf dem einen Gerät, schick die Datei per AirDrop und spiele sie auf dem anderen mit „Zusammenführen“ ein. Am besten auch umgekehrt, dann haben beide denselben Stand.</li>
          <li>Wenn du Safari-Verlauf und Websitedaten löschst, ist der Lernstand ohne Sicherung weg.</li>
        </ul>
      </details>
    </div>
  );
}

export default function Datensicherung() {
  const [, setN] = useState(0);
  useEffect(() => { setzeMerker({ hinweisGesehen: true }); }, []);
  return (
    <section className="page sicherung">
      <div className="page__head">
        <h2>Datensicherung</h2>
        <p className="muted">Lernstand sichern und auf ein anderes Gerät übertragen.</p>
      </div>
      <Speicherstatus />
      <Erstellen onFertig={() => setN((n) => n + 1)} />
      <Einspielen />
    </section>
  );
}
