import { useEffect, useState } from 'react';
import { notify } from '../../ui/shell/notifications';
import { relativeTime } from '../../ui/lib/time';
import {
  bitteUmDauerhaftenSpeicher, kannTeilen, ladeRueckfall, lesePruefe, leseMerker, lokalLabel, setzeMerker, sichereUndGibWeiter, spieleEin,
  stelleRueckfallWiederHer, type Ergebnis, type Modus, type Sicherung, type Uebersicht,
} from '../../core/sicherung';
import { entschluessele, istVerschluesselt, passwortProblem } from '../../core/sicherung-krypto';
import { BUILD_ID } from '../../core/build';
import './sicherung.css';

const datum = (iso: string) => { try { return new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; } };

function Erstellen({ onFertig }: { onFertig: () => void }) {
  const [busy, setBusy] = useState(false);
  const [mitPasswort, setMitPasswort] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const teilen = kannTeilen();
  const pwFehler = mitPasswort ? (passwortProblem(pw) ?? (pw2 && pw !== pw2 ? 'Die beiden Passwörter stimmen nicht überein.' : undefined)) : undefined;
  const pwBereit = !mitPasswort || (!pwFehler && pw === pw2);
  async function los(art: 'teilen' | 'datei') {
    if (!pwBereit) return;
    setBusy(true);
    try {
      const r = await sichereUndGibWeiter(art, mitPasswort ? pw : undefined);
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
      <label className="check">
        <input type="checkbox" checked={mitPasswort} disabled={busy} onChange={(e) => setMitPasswort(e.target.checked)} />
        <span><strong>Mit Passwort verschlüsseln</strong> (empfohlen, wenn die Datei per Mail, Cloud oder USB-Stick weitergeht)<br />
          <span className="muted">Ohne das Passwort lässt sich die Datei nicht öffnen. Es wird nirgends gespeichert. Vergisst du es, ist die Sicherung verloren.</span></span>
      </label>
      {mitPasswort && (
        <div className="sicherung__passwort">
          <label>Passwort<input type="password" autoComplete="new-password" value={pw} disabled={busy} onChange={(e) => setPw(e.target.value)} /></label>
          <label>Passwort wiederholen<input type="password" autoComplete="new-password" value={pw2} disabled={busy} onChange={(e) => setPw2(e.target.value)} /></label>
          {pw && pwFehler && <p className="field-error" aria-live="polite">{pwFehler}</p>}
        </div>
      )}
      <div className="sicherung__knoepfe">
        {teilen && <button type="button" className="primary" disabled={busy || !pwBereit} onClick={() => los('teilen')}>Sichern und teilen …</button>}
        <button type="button" className={teilen ? '' : 'primary'} disabled={busy || !pwBereit} onClick={() => los('datei')}>{busy ? 'Wird erstellt …' : 'Als Datei speichern'}</button>
      </div>
      {!mitPasswort && <p className="muted">Ohne Passwort ist die Datei lesbar für jeden, der sie bekommt (Lernstand, eigene Notizen, importierte Texte).</p>}
      {teilen && <p className="muted">„Teilen“ öffnet das Teilen-Menü: AirDrop an dein iPad, „In Dateien sichern“ (iCloud Drive) oder per Mail an dich selbst.</p>}
    </div>
  );
}

function Einspielen() {
  const [datei, setDatei] = useState<{ name: string; sicherung: Sicherung; uebersicht: Uebersicht } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [modus, setModus] = useState<Modus>('zusammenfuehren');
  const [busy, setBusy] = useState(false);
  const [fertig, setFertig] = useState<Ergebnis & { modus: Modus } | null>(null);
  const [gesperrt, setGesperrt] = useState<{ name: string; text: string } | null>(null);
  const [pw, setPw] = useState('');

  async function waehle(f: File | undefined) {
    setFehler(null); setDatei(null); setFertig(null); setGesperrt(null); setPw('');
    if (!f) return;
    try {
      const text = await f.text();
      if (istVerschluesselt(text)) { setGesperrt({ name: f.name, text }); return; }
      setDatei({ name: f.name, ...lesePruefe(text) });
    } catch (e) { setFehler(e instanceof Error ? e.message : String(e)); }
  }

  async function entsperre() {
    if (!gesperrt) return;
    setBusy(true); setFehler(null);
    try {
      const klar = await entschluessele(gesperrt.text, pw);
      setDatei({ name: gesperrt.name, ...lesePruefe(klar) });
      setGesperrt(null); setPw('');
    } catch (e) { setFehler(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function los() {
    if (!datei) return;
    if (modus === 'ersetzen' && !confirm('Alle Daten auf diesem Gerät werden durch die Sicherung ersetzt. Der bisherige Stand wird vorher als Rückfallsicherung auf diesem Gerät abgelegt und lässt sich wiederherstellen. Fortfahren?')) return;
    setBusy(true);
    try {
      const e = await spieleEin(datei.sicherung, modus);
      setFertig({ ...e, modus });
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
      {gesperrt && (
        <form className="sicherung__vorschau" onSubmit={(e) => { e.preventDefault(); void entsperre(); }}>
          <p><strong>{gesperrt.name}</strong><br /><span className="muted">Diese Sicherung ist mit einem Passwort verschlüsselt.</span></p>
          <label>Passwort<input type="password" autoComplete="current-password" value={pw} disabled={busy} onChange={(e) => setPw(e.target.value)} /></label>
          <div className="sicherung__knoepfe">
            <button type="submit" className="primary" disabled={busy || !pw}>{busy ? 'Wird entschlüsselt …' : 'Entschlüsseln'}</button>
            <button type="button" className="ghost" disabled={busy} onClick={() => setGesperrt(null)}>Abbrechen</button>
          </div>
        </form>
      )}
      {fehler && <p className="note warn" role="alert">{fehler}</p>}
      {fertig && (
        <div className={fertig.lokalFehler.length ? 'note warn' : 'note ok'} role="status">
          <strong>{fertig.lokalFehler.length ? 'Teilweise eingespielt.' : 'Fertig.'}</strong>{' '}
          {fertig.modus === 'ersetzen' ? `${fertig.neu} Einträge eingespielt.` : `${fertig.neu} Einträge ergänzt, ${fertig.aktualisiert} durch neuere ersetzt.`}
          {fertig.lokalFehler.length > 0 && <> Nicht übernommen (Speicher voll oder gesperrt): {fertig.lokalFehler.map(lokalLabel).join(', ')}. Die Datenbank-Einträge sind vollständig.</>}
          {fertig.rueckfall && <> Der vorherige Stand liegt als Rückfallsicherung auf diesem Gerät.</>}
          {' '}Damit alle Seiten den neuen Stand zeigen, lädt die App neu.
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
        <li>App-Version: <code>{BUILD_ID}</code></li>
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

function Rueckfall() {
  const [stand, setStand] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  useEffect(() => { void ladeRueckfall().then((r) => setStand(r?.at ?? null)); }, []);
  if (!stand) return null;
  async function los() {
    if (!confirm('Den Stand vor dem letzten „Ersetzen“ wiederherstellen? Der jetzige Stand wird dabei selbst zur Rückfallsicherung.')) return;
    setBusy(true);
    try {
      const e = await stelleRueckfallWiederHer();
      setMeldung(`${e.neu} Einträge wiederhergestellt.${e.lokalFehler.length ? ` Nicht übernommen: ${e.lokalFehler.map(lokalLabel).join(', ')}.` : ''}`);
      setStand(e.rueckfall ?? null);
    } catch (e) { setMeldung(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  return (
    <div className="card">
      <h3>Rückfallsicherung</h3>
      <p>Vor dem letzten „Ersetzen“ ({datum(stand)}) wurde der damalige Stand auf diesem Gerät abgelegt.</p>
      <div className="sicherung__knoepfe"><button type="button" disabled={busy} onClick={los}>{busy ? 'Stellt wieder her …' : 'Diesen Stand wiederherstellen'}</button></div>
      {meldung && <p className="note" role="status">{meldung} <button type="button" className="link" onClick={() => location.reload()}>Neu laden</button></p>}
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
      <Rueckfall />
    </section>
  );
}
