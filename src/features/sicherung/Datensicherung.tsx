import { useEffect, useState } from 'react';
import { notify } from '../../ui/shell/notifications';
import { relativeTime } from '../../ui/lib/time';
import {
  bitteUmDauerhaftenSpeicher, kannTeilen, ladeRueckfall, lesePruefe, leseMerker, leseSicherungsDatei, lokalLabel, setzeMerker, sichereUndGibWeiter, spieleEin, teileSicherungsDatei,
  stelleRueckfallWiederHer, vergleiche, type Ergebnis, type Modus, type Sicherung, type Uebersicht, type Vergleich,
} from '../../core/sicherung';
import { entschluessele, istVerschluesselt, passwortProblem } from '../../core/sicherung-krypto';
import { BUILD_ID } from '../../core/build';
import { adressText } from '../../core/hosting';
import './sicherung.css';

const datum = (iso: string) => { try { return new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; } };

function Erstellen({ onFertig }: { onFertig: () => void }) {
  const [busy, setBusy] = useState(false);
  // Verschlüsselt ist der Standard (Audit SEC-05): Sicherungen gehen oft über Mail, Cloud oder Messenger.
  const [mitPasswort, setMitPasswort] = useState(true);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  // Safari: Datei ist fertig, das Teilen-Menü braucht aber einen frischen Tipp (siehe SicherungsErgebnis).
  const [bereit, setBereit] = useState<File | null>(null);
  const teilen = kannTeilen();
  const pwFehler = mitPasswort ? (passwortProblem(pw) ?? (pw2 && pw !== pw2 ? 'Die beiden Passwörter stimmen nicht überein.' : undefined)) : undefined;
  const pwBereit = !mitPasswort || (!pwFehler && pw === pw2);
  async function los(art: 'teilen' | 'datei') {
    if (!pwBereit) return;
    setBusy(true);
    try {
      const fachmodul = await import('../../modules/pflege').then(({ pflegeModule: m }) => `${m.id}@${m.version}`).catch(() => undefined);
      const r = await sichereUndGibWeiter(art, mitPasswort ? pw : undefined, { fachmodul });
      if (typeof r === 'object') { setBereit(r.nochmalTeilen); return; }
      fertig(r);
    } catch (e) {
      notify('critical', 'Sicherung fehlgeschlagen', e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }
  function fertig(r: 'geteilt' | 'gespeichert' | 'abgebrochen') {
    if (r !== 'abgebrochen') { notify('info', 'Sicherung erstellt', r === 'geteilt' ? 'Die Datei wurde weitergegeben.' : 'Die Datei liegt in deinen Downloads.'); void bitteUmDauerhaftenSpeicher(); }
    onFertig();
  }
  async function jetztTeilen() {
    if (!bereit) return;
    // Kein await davor: Safari öffnet das Teilen-Menü nur direkt aus dem Tipp heraus.
    const datei = bereit;
    try {
      const r = await teileSicherungsDatei(datei);
      setBereit(null);
      fertig(r);
    } catch (e) {
      notify('critical', 'Sicherung fehlgeschlagen', e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }
  return (
    <div className="card">
      <h3>Sicherung erstellen</h3>
      <p>Eine Datei mit allem, was du hier gelernt und angelegt hast: Lernplan, Themenboard, Karteikarten, Prüfungssimulationen, Fälle, Mindmaps, Trainer-Bestwerte, importierte Dokumente und Zusammenfassungen.</p>
      <p className="muted">Nicht enthalten: dein API-Schlüssel und Zugangsdaten für „Große Dateien“. Die trägst du auf jedem Gerät selbst ein.</p>
      <label className="check">
        <input type="checkbox" checked={mitPasswort} disabled={busy} onChange={(e) => setMitPasswort(e.target.checked)} />
        <span><strong>Mit Passwort verschlüsseln</strong> (empfohlen, vor allem wenn die Datei per Mail, Cloud, Messenger oder USB-Stick weitergeht)<br />
          <span className="muted">Ohne das Passwort lässt sich die Datei nicht öffnen. Es wird nirgends gespeichert. Vergisst du es, ist die Sicherung verloren.</span></span>
      </label>
      {mitPasswort && (
        <div className="sicherung__passwort">
          <label>Passwort<input type="password" autoComplete="new-password" value={pw} disabled={busy} onChange={(e) => setPw(e.target.value)} /></label>
          <label>Passwort wiederholen<input type="password" autoComplete="new-password" value={pw2} disabled={busy} onChange={(e) => setPw2(e.target.value)} /></label>
          {pw && pwFehler && <p className="field-error" aria-live="polite">{pwFehler}</p>}
        </div>
      )}
      {bereit && (
        <div className="note" role="status">
          <p><strong>Die Sicherung ist fertig.</strong> Tippe jetzt auf „Teilen“, um das Teilen-Menü zu öffnen. Safari verlangt dafür einen eigenen Tipp, weil das Verschlüsseln etwas gedauert hat.</p>
          <div className="row">
            <button type="button" className="primary" onClick={() => void jetztTeilen()}>Teilen …</button>
            <button type="button" className="ghost" onClick={() => setBereit(null)}>Abbrechen</button>
          </div>
        </div>
      )}
      <div className="sicherung__knoepfe">
        {teilen && <button type="button" className="primary" disabled={busy || !pwBereit} onClick={() => los('teilen')}>Sichern und teilen …</button>}
        <button type="button" className={teilen ? '' : 'primary'} disabled={busy || !pwBereit} onClick={() => los('datei')}>{busy ? 'Wird erstellt …' : 'Als Datei speichern'}</button>
      </div>
      {!mitPasswort && <p className="note warn">Ohne Passwort ist die Datei lesbar für jeden, der sie bekommt, auch für Dienste, über die du sie verschickst (Lernstand, eigene Notizen, importierte Texte). Nur für die direkte Übertragung zwischen deinen eigenen Geräten, z. B. per AirDrop.</p>}
      {teilen && <p className="muted">„Teilen“ öffnet das Teilen-Menü: AirDrop an dein iPad, „In Dateien sichern“ (iCloud Drive) oder per Mail an dich selbst.</p>}
    </div>
  );
}

function Vorschau({ vergleich, modus }: { vergleich: Vergleich; modus: Modus }) {
  const summe = (f: 'neu' | 'neuerInDatei' | 'konflikt' | 'nurHier') => vergleich.zeilen.reduce((n, z) => n + z[f], 0);
  const konflikte = summe('konflikt') + vergleich.lokal.filter((l) => l.art === 'konflikt').length;
  const nurHier = summe('nurHier');
  return (
    <div className="sicherung__vergleich">
      <h4>Vergleich mit diesem Gerät</h4>
      {vergleich.zeilen.length > 0 && (
        <div className="sicherung__tabelle" tabIndex={0} role="region" aria-label="Vergleich je Bereich">
          <table>
            <thead><tr><th scope="col">Bereich</th><th scope="col">neu</th><th scope="col">neuer</th><th scope="col">Konflikt</th><th scope="col">{modus === 'ersetzen' ? 'gelöscht' : 'nur hier'}</th></tr></thead>
            <tbody>{vergleich.zeilen.map((z) => (
              <tr key={z.bereich}><th scope="row">{z.bereich}</th><td>{z.neu}</td><td>{z.neuerInDatei}</td><td className={z.konflikt ? 'sicherung__konflikt' : undefined}>{z.konflikt}</td><td className={modus === 'ersetzen' && z.nurHier ? 'sicherung__konflikt' : undefined}>{z.nurHier}</td></tr>
            ))}</tbody>
          </table>
          <p className="muted sicherung__legende"><strong>neu</strong>: kommt dazu · <strong>neuer</strong>: in der Datei neuer, ersetzt den Stand hier · <strong>Konflikt</strong>: hier anders und nicht älter, {modus === 'ersetzen' ? 'wird beim Ersetzen mit dem älteren Stand der Datei überschrieben' : 'bleibt wie hier'} · <strong>{modus === 'ersetzen' ? 'gelöscht' : 'nur hier'}</strong>: {modus === 'ersetzen' ? 'gibt es nur auf diesem Gerät, wird beim Ersetzen gelöscht' : 'gibt es nur auf diesem Gerät, bleibt'}.</p>
        </div>
      )}
      {vergleich.lokal.length > 0 && (
        <ul className="sicherung__fakten">
          {vergleich.lokal.map((l) => (
            <li key={l.bereich}><strong>{l.bereich}</strong>: {
              l.art === 'nur-datei' ? 'kommt dazu' :
              l.art === 'nur-hier' ? (modus === 'ersetzen' ? 'wird gelöscht (nur auf diesem Gerät)' : 'bleibt (nur auf diesem Gerät)') :
              l.art === 'zusammenfuehren' ? (modus === 'ersetzen' ? 'wird durch die Datei ersetzt' : `wird zusammengeführt${l.dazu ? `, ${l.dazu} kommen dazu` : ''}`) :
              modus === 'ersetzen' ? 'wird durch die Datei ersetzt' : <span className="sicherung__konflikt">Konflikt: verschiedene Stände, der Stand dieses Geräts bleibt</span>
            }</li>
          ))}
        </ul>
      )}
      {modus === 'zusammenfuehren'
        ? <p className="muted">{konflikte ? `${konflikte} Konflikt${konflikte === 1 ? '' : 'e'}: Hier gibt es einen anderen, neueren oder gleich alten Stand. Er bleibt, der Stand aus der Datei wird nicht übernommen. ` : ''}Gelöschtes kommt beim Zusammenführen zurück, wenn es in der Datei noch steht. Wer auf einem Gerät aufgeräumt hat, spielt besser mit „Ersetzen“ ein.</p>
        : <p className={nurHier || konflikte ? 'note warn' : 'muted'}>{nurHier ? `${nurHier} Einträge gibt es nur auf diesem Gerät. Sie werden gelöscht. ` : ''}{konflikte ? `${konflikte} Einträge sind hier neuer oder anders als in der Datei. Sie werden mit dem Stand der Datei überschrieben. ` : ''}{nurHier || konflikte ? 'Beides liegt danach in der Rückfallsicherung.' : 'Auf diesem Gerät geht nichts verloren, was nicht auch in der Datei steht.'}</p>}
    </div>
  );
}

function Ergebnisbericht({ fertig }: { fertig: Ergebnis & { modus: Modus } }) {
  const teil = fertig.lokalFehler.length > 0;
  return (
    <div className={teil ? 'note warn' : 'note ok'} role="status">
      <strong>{teil ? 'Teilweise eingespielt.' : 'Fertig.'}</strong>{' '}
      {fertig.modus === 'ersetzen' ? `Datenbank ersetzt: ${fertig.neu} Einträge.` : `Datenbank zusammengeführt: ${fertig.neu} Einträge ergänzt, ${fertig.aktualisiert} durch neuere ersetzt.`}
      <ul className="sicherung__fakten">
        <li>Datenbank (Dokumente, Lernplan, Karteikarten, …): vollständig {fertig.modus === 'ersetzen' ? 'übernommen' : 'abgeglichen'}.{fertig.lokalUebernommen.length ? ` Geändert außerdem: ${fertig.lokalUebernommen.join(', ')}.` : ''}</li>
        {teil && <li><strong>Nicht übernommen</strong> (Speicher voll oder gesperrt): {fertig.lokalFehler.map(lokalLabel).join(', ')}. Auf diesem Gerät gilt dafür noch der alte Stand{fertig.modus === 'ersetzen' ? ' bzw. nichts' : ''}.</li>}
        {fertig.rueckfall && <li>Der Stand vor dem Einspielen liegt als <button type="button" className="link" onClick={() => document.getElementById('rueckfall')?.scrollIntoView({ behavior: 'smooth' })}>Rückfallsicherung</button> auf diesem Gerät. {teil ? 'Wenn dir der Teilstand nicht reicht: Speicher frei machen und die Datei noch einmal einspielen, oder unten „Diesen Stand wiederherstellen“ wählen.' : 'Unten lässt sich das Einspielen damit rückgängig machen.'}</li>}
      </ul>
      Damit alle Seiten den neuen Stand zeigen, lädt die App neu.
      <div className="row"><button type="button" className="primary" onClick={() => location.reload()}>Jetzt neu laden</button></div>
    </div>
  );
}

function Einspielen({ onFertig }: { onFertig: () => void }) {
  const [datei, setDatei] = useState<{ name: string; sicherung: Sicherung; uebersicht: Uebersicht } | null>(null);
  const [vergleich, setVergleich] = useState<Vergleich | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [modus, setModus] = useState<Modus>('zusammenfuehren');
  const [busy, setBusy] = useState(false);
  const [fertig, setFertig] = useState<Ergebnis & { modus: Modus } | null>(null);
  const [gesperrt, setGesperrt] = useState<{ name: string; text: string } | null>(null);
  const [pw, setPw] = useState('');

  async function oeffne(name: string, text: string) {
    const d = { name, ...lesePruefe(text) };
    setDatei(d); setVergleich(null);
    try { setVergleich(await vergleiche(d.sicherung)); } catch { /* Vorschau ist Komfort: Einspielen bleibt möglich */ }
  }

  async function waehle(f: File | undefined) {
    setFehler(null); setDatei(null); setVergleich(null); setFertig(null); setGesperrt(null); setPw('');
    if (!f) return;
    try {
      const text = await leseSicherungsDatei(f);
      if (istVerschluesselt(text)) { setGesperrt({ name: f.name, text }); return; }
      await oeffne(f.name, text);
    } catch (e) { setFehler(e instanceof Error ? e.message : String(e)); }
  }

  async function entsperre() {
    if (!gesperrt) return;
    setBusy(true); setFehler(null);
    try {
      const klar = await entschluessele(gesperrt.text, pw);
      await oeffne(gesperrt.name, klar);
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
      setDatei(null); setVergleich(null);
      onFertig();
      void bitteUmDauerhaftenSpeicher();
    } catch (err) {
      setFehler(`Einspielen fehlgeschlagen, es wurde nichts verändert: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setBusy(false); }
  }

  const u = datei?.uebersicht;
  return (
    <div className="card">
      <h3>Sicherung einspielen</h3>
      <p>Hier holst du deinen Lernstand auf dieses Gerät, zum Beispiel vom iPhone aufs iPad. Vor dem Einspielen siehst du, was dazukommt, was sich ändert und wo es Konflikte gibt.</p>
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
      {fertig && <Ergebnisbericht fertig={fertig} />}
      {datei && u && (
        <div className="sicherung__vorschau">
          <p><strong>{datei.name}</strong><br />
            <span className="muted">Erstellt {datum(u.exportedAt)}{u.geraet ? ` auf ${u.geraet}` : ''} · App-Version {u.build ?? 'unbekannt (ältere Sicherung)'}{u.fachmodul ? ` · Fachmodul ${u.fachmodul}` : ''} · Datenbank v{u.schema}{u.build && u.build !== BUILD_ID ? ` (dieses Gerät: ${BUILD_ID})` : ''}</span></p>
          {u.zeilen.length
            ? <ul className="sicherung__liste">{u.zeilen.map((z) => <li key={z.label}><span>{z.label}</span><strong>{z.anzahl}</strong></li>)}</ul>
            : <p className="muted">Die Sicherung enthält kaum Daten (nur Einstellungen).</p>}
          {(u.unbekannteTabellen.length > 0 || u.lokalUngueltig.length > 0) && (
            <p className="note warn">Wird nicht übernommen: {[
              ...u.unbekannteTabellen.map((t) => `${t} (unbekannt)`),
              ...u.lokalUngueltig.map((t) => `${t} (beschädigt)`),
            ].join(', ')}.</p>
          )}
          <fieldset className="sicherung__modus">
            <legend>Wie einspielen?</legend>
            <label><input type="radio" name="modus" checked={modus === 'zusammenfuehren'} onChange={() => setModus('zusammenfuehren')} />
              <span><strong>Zusammenführen</strong> (empfohlen): Was hier schon ist, bleibt. Fehlendes kommt dazu, bei doppelten Einträgen gewinnt der neuere.</span></label>
            <label><input type="radio" name="modus" checked={modus === 'ersetzen'} onChange={() => setModus('ersetzen')} />
              <span><strong>Ersetzen</strong>: Dieses Gerät bekommt genau den Stand der Datei. Was nur hier gespeichert ist, wird gelöscht.</span></label>
          </fieldset>
          {vergleich ? <Vorschau vergleich={vergleich} modus={modus} /> : <p className="muted">Vergleich mit diesem Gerät wird berechnet …</p>}
          <p className="muted">Vor dem Einspielen legt die App den jetzigen Stand als Rückfallsicherung ab. Damit lässt sich das {modus === 'ersetzen' ? 'Ersetzen' : 'Zusammenführen'} rückgängig machen.</p>
          <div className="sicherung__knoepfe">
            <button type="button" className={modus === 'ersetzen' ? 'danger' : 'primary'} disabled={busy} onClick={los}>{busy ? 'Spielt ein …' : 'Einspielen'}</button>
            <button type="button" className="ghost" disabled={busy} onClick={() => { setDatei(null); setVergleich(null); }}>Abbrechen</button>
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
        <li>Adresse: <strong>{adressText()}</strong> (Daten gelten nur für diese Adresse)</li>
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
    if (!confirm('Den Stand vor dem letzten Einspielen wiederherstellen? Der jetzige Stand wird dabei selbst zur Rückfallsicherung.')) return;
    setBusy(true);
    try {
      const e = await stelleRueckfallWiederHer();
      setMeldung(`${e.neu} Einträge wiederhergestellt.${e.lokalFehler.length ? ` Nicht übernommen: ${e.lokalFehler.map(lokalLabel).join(', ')}.` : ''}`);
      setStand(e.rueckfall ?? null);
    } catch (e) { setMeldung(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  return (
    <div className="card" id="rueckfall">
      <h3>Rückfallsicherung</h3>
      <p>Vor dem letzten Einspielen ({datum(stand)}) wurde der damalige Stand auf diesem Gerät abgelegt. Damit machst du ein Einspielen rückgängig, auch ein teilweise gescheitertes.</p>
      <div className="sicherung__knoepfe"><button type="button" disabled={busy} onClick={los}>{busy ? 'Stellt wieder her …' : 'Diesen Stand wiederherstellen'}</button></div>
      {meldung && <p className="note" role="status">{meldung} <button type="button" className="link" onClick={() => location.reload()}>Neu laden</button></p>}
    </div>
  );
}

export default function Datensicherung() {
  const [n, setN] = useState(0);
  useEffect(() => { setzeMerker({ hinweisGesehen: true }); }, []);
  return (
    <section className="page sicherung">
      <div className="page__head">
        <h2>Datensicherung</h2>
        <p className="muted">Lernstand sichern und auf ein anderes Gerät übertragen.</p>
      </div>
      <Speicherstatus />
      <Erstellen onFertig={() => setN((n) => n + 1)} />
      <Einspielen onFertig={() => setN((x) => x + 1)} />
      <Rueckfall key={n} />
    </section>
  );
}
