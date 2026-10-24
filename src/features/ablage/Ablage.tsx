import { useEffect, useRef, useState } from 'react';
import skript from './abholen.py?raw';
import {
  AblageFehler, formatGroesse, ladeHoch, ladeZiel, listeDateien, parseRepo, pruefeRepo, readmeText, richteEin,
  speichereZiel, teilAnzahl, type AblageZiel, type Eintrag, type Fortschritt, type RepoInfo,
} from './ablage';
import './ablage.css';

type Status = 'wartet' | 'laeuft' | 'fertig' | 'uebersprungen' | 'fehler' | 'abgebrochen';
interface Auftrag { id: number; datei: File; status: Status; fortschritt?: Fortschritt; fehler?: string; ordner?: string }

let naechsteId = 1;

function text(e: unknown): string {
  return e instanceof AblageFehler || e instanceof Error ? e.message : String(e);
}

export default function Ablage() {
  const [ziel, setZiel] = useState<AblageZiel>(ladeZiel);
  const [repoEingabe, setRepoEingabe] = useState(() => { const z = ladeZiel(); return z.owner ? `${z.owner}/${z.repo}` : ''; });
  const [info, setInfo] = useState<RepoInfo | null>(null);
  const [verbinden, setVerbinden] = useState('');
  const [fehler, setFehler] = useState('');
  const [liste, setListe] = useState<Eintrag[]>([]);
  const [kategorie, setKategorie] = useState('');
  const [notiz, setNotiz] = useState('');
  const [auftraege, setAuftraege] = useState<Auftrag[]>([]);
  const [laeuft, setLaeuft] = useState(false);
  const abbruch = useRef<AbortController | null>(null);
  const warteschlange = useRef<Auftrag[]>([]);
  const laeuftRef = useRef(false);

  const verbunden = !!info?.privat;

  async function verbindeMit(z: AblageZiel) {
    setFehler(''); setVerbinden('Prüfe Zugriff …');
    try {
      const i = await pruefeRepo(z);
      if (!i.privat) {
        setInfo(null);
        setFehler(`${i.vollerName} ist öffentlich. Bücher dürfen dort nicht hin. Bitte ein privates Repo verwenden oder dieses unter Settings → Danger Zone auf „Private“ stellen.`);
        return;
      }
      if (!i.schreiben) throw new AblageFehler('Der Token darf in diesem Repo nicht schreiben. Bei „Contents“ „Read and write“ wählen.');
      if (!i.eingerichtet) { setVerbinden('Richte Repo ein …'); await richteEin(z, i, readmeText(z), skript); }
      setInfo(i);
      setVerbinden('Lade Liste …');
      setListe(await listeDateien(z));
    } catch (e) {
      setInfo(null); setFehler(text(e));
    } finally { setVerbinden(''); }
  }

  useEffect(() => { if (ziel.owner && ziel.repo && ziel.token) verbindeMit(ziel); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  function speichern() {
    const r = parseRepo(repoEingabe);
    if (!r) { setFehler('Repo bitte als „name/repo“ angeben, z. B. Freadeax/lernstoff-material.'); return; }
    if (!ziel.token.trim()) { setFehler('Bitte den Token einfügen.'); return; }
    const z = { ...r, token: ziel.token.trim() };
    setZiel(z); speichereZiel(z); verbindeMit(z);
  }

  function trennen() {
    if (!confirm('Token von diesem Gerät entfernen?')) return;
    speichereZiel(null); setZiel({ owner: '', repo: '', token: '' }); setRepoEingabe(''); setInfo(null); setListe([]);
  }

  function aendere(id: number, patch: Partial<Auftrag>) {
    setAuftraege((alle) => alle.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    const a = warteschlange.current.find((x) => x.id === id);
    if (a) Object.assign(a, patch);
  }

  function hinzufuegen(files: FileList | null) {
    if (!files?.length) return;
    const neu = Array.from(files).map((datei) => ({ id: naechsteId++, datei, status: 'wartet' as Status }));
    warteschlange.current.push(...neu);
    setAuftraege((alle) => [...alle, ...neu]);
    if (!laeuftRef.current) abarbeiten();
  }

  async function abarbeiten() {
    if (!info || laeuftRef.current) return;
    laeuftRef.current = true;
    setLaeuft(true);
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    // Bildschirm wach halten: iOS bricht Uploads ab, wenn das Gerät sperrt.
    let sperre: { release(): Promise<void> } | undefined;
    try { sperre = await (navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock?.request('screen'); } catch { /* nicht unterstützt */ }
    let vorhanden = liste;
    try {
      for (let a = warteschlange.current.find((x) => x.status === 'wartet'); a; a = warteschlange.current.find((x) => x.status === 'wartet')) {
        if (ctrl.signal.aborted) break;
        const id = a.id;
        aendere(id, { status: 'laeuft' });
        try {
          const r = await ladeHoch(ziel, a.datei, {
            branch: info.branch, vorhanden, kategorie: kategorie.trim(), notiz: notiz.trim(), signal: ctrl.signal,
            onFortschritt: (fortschritt) => aendere(id, { fortschritt }),
          });
          aendere(id, { status: r.uebersprungen ? 'uebersprungen' : 'fertig', ordner: r.ordner });
          if (!r.uebersprungen) vorhanden = [...vorhanden.filter((e) => e.ordner !== r.ordner), { ordner: r.ordner, manifest: r.manifest }];
          setListe(vorhanden);
        } catch (e) {
          if (ctrl.signal.aborted) { aendere(id, { status: 'abgebrochen' }); break; }
          aendere(id, { status: 'fehler', fehler: text(e) });
        }
      }
    } finally {
      for (const a of warteschlange.current) if (a.status === 'wartet' && ctrl.signal.aborted) aendere(a.id, { status: 'abgebrochen' });
      try { await sperre?.release(); } catch { /* egal */ }
      abbruch.current = null;
      laeuftRef.current = false;
      setLaeuft(false);
    }
  }

  function erneut() {
    for (const a of warteschlange.current) if (a.status === 'fehler' || a.status === 'abgebrochen') aendere(a.id, { status: 'wartet', fehler: undefined });
    if (!laeuftRef.current) setTimeout(abarbeiten, 0);
  }

  const gesamt = auftraege.reduce((s, a) => s + a.datei.size, 0);
  const erledigt = auftraege.reduce((s, a) => s + (a.status === 'fertig' || a.status === 'uebersprungen' ? a.datei.size : a.status === 'laeuft' ? a.fortschritt?.bytes ?? 0 : 0), 0);
  const offen = auftraege.some((a) => a.status === 'fehler' || a.status === 'abgebrochen');

  return (
    <section className="page ablage">
      <div className="page__head">
        <h2>Große Dateien</h2>
        <p className="muted">Bücher und Skripte beliebiger Größe in dein privates GitHub-Repo laden, damit Claude sie lesen kann. Große Dateien werden automatisch in Teile zerlegt.</p>
      </div>

      <div className="card">
        <h3>Verbindung</h3>
        {verbunden ? (
          <>
            <p>Verbunden mit <strong>{info!.vollerName}</strong> <span className="badge">privat</span></p>
            <div className="row"><span className="muted">Token liegt nur auf diesem Gerät.</span><button className="small" onClick={trennen}>Trennen</button></div>
          </>
        ) : (
          <>
            <label className="field">Privates Repo
              <input className="wide" autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder="Freadeax/lernstoff-material"
                value={repoEingabe} onChange={(e) => setRepoEingabe(e.target.value)} />
            </label>
            <label className="field">Fine-grained Token (nur dieses Repo, „Contents: Read and write“)
              <input className="wide" type="password" autoComplete="off" placeholder="github_pat_…"
                value={ziel.token} onChange={(e) => setZiel({ ...ziel, token: e.target.value })} />
            </label>
            <div className="row">
              <button className="primary" disabled={!!verbinden} onClick={speichern}>Verbinden</button>
              {verbinden && <span className="muted">{verbinden}</span>}
            </div>
            <details className="ablage__hilfe">
              <summary>So richtest du es ein (einmalig, ca. 3 Minuten)</summary>
              <ol>
                <li>Auf github.com: <strong>+ → New repository</strong>. Name z. B. <code>lernstoff-material</code>, <strong>Private</strong> wählen, „Add a README file“ ankreuzen, Create.</li>
                <li>Profilbild → <strong>Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token</strong>.</li>
                <li>Repository access: <strong>Only select repositories</strong> → nur <code>lernstoff-material</code>. Permissions → Repository permissions → <strong>Contents: Read and write</strong>. Generate, Token kopieren.</li>
                <li>Hier Repo und Token eintragen und verbinden.</li>
                <li>Damit Claude die Dateien abholen kann, das Repo in den Projekteinstellungen unter Repositories hinzufügen.</li>
              </ol>
            </details>
          </>
        )}
        {fehler && <div className="note warn">{fehler}</div>}
      </div>

      {verbunden && (
        <div className="card">
          <h3>Hochladen</h3>
          <div className="ablage__felder">
            <label className="field">Kategorie (optional)
              <input placeholder="z. B. Pflege Heute, Anatomie" value={kategorie} onChange={(e) => setKategorie(e.target.value)} />
            </label>
            <label className="field">Notiz (optional)
              <input placeholder="z. B. Auflage 8, Kapitel 1–12" value={notiz} onChange={(e) => setNotiz(e.target.value)} />
            </label>
          </div>
          <label className="upload">
            <input type="file" multiple onChange={(e) => { hinzufuegen(e.target.files); e.target.value = ''; }} />
            <span>Dateien auswählen – beliebig viele, beliebig groß</span>
          </label>
          <p className="muted">Tipp: Während des Uploads die App offen lassen. Bei einem Abbruch einfach dieselben Dateien erneut wählen: Fertiges wird übersprungen, bereits gesendete Teile nicht noch einmal übertragen.</p>

          {auftraege.length > 0 && (
            <>
              <div className="ablage__gesamt">
                <div className="ablage__balken"><span style={{ width: `${gesamt ? (erledigt / gesamt) * 100 : 0}%` }} /></div>
                <span className="muted">{formatGroesse(erledigt)} von {formatGroesse(gesamt)}</span>
              </div>
              <ul className="ablage__liste">
                {auftraege.map((a) => <AuftragZeile key={a.id} a={a} />)}
              </ul>
              <div className="row">
                {laeuft && <button className="danger small" onClick={() => abbruch.current?.abort()}>Abbrechen</button>}
                {!laeuft && offen && <button className="small" onClick={erneut}>Fehlgeschlagene erneut versuchen</button>}
                {!laeuft && <button className="small" onClick={() => { warteschlange.current = []; setAuftraege([]); }}>Liste leeren</button>}
              </div>
            </>
          )}
        </div>
      )}

      {verbunden && (
        <div className="card">
          <div className="row" style={{ marginTop: 0 }}>
            <h3>Im Repo ({liste.length})</h3>
            <button className="small" onClick={async () => { try { setListe(await listeDateien(ziel)); } catch (e) { setFehler(text(e)); } }}>Aktualisieren</button>
          </div>
          {liste.length === 0 && <p className="muted">Noch nichts hochgeladen.</p>}
          <ul className="ablage__liste">
            {liste.map((e) => (
              <li key={e.ordner}>
                <div className="ablage__name">{e.manifest?.name ?? e.ordner}</div>
                <div className="muted">
                  <code>{e.ordner}</code>
                  {e.manifest && ` · ${formatGroesse(e.manifest.groesse)} · ${e.manifest.teile.length} Teil${e.manifest.teile.length === 1 ? '' : 'e'}`}
                  {e.manifest?.kategorie && ` · ${e.manifest.kategorie}`}
                </div>
              </li>
            ))}
          </ul>
          <p className="muted">Claude findet die Dateien unter diesem Ordnernamen. Sag im Thread einfach z. B. „Lies das Buch <code>{liste[0]?.ordner ?? 'pflege-heute'}</code> aus der Material-Ablage“.</p>
        </div>
      )}
    </section>
  );
}

const PHASE: Record<Fortschritt['phase'], string> = {
  pruefen: 'prüft Teil', hochladen: 'sendet Teil', speichern: 'speichert', fertig: 'fertig', uebersprungen: 'schon vorhanden',
};

function AuftragZeile({ a }: { a: Auftrag }) {
  const p = a.fortschritt;
  const anteil = a.status === 'fertig' || a.status === 'uebersprungen' ? 1 : p ? p.bytes / Math.max(1, a.datei.size) : 0;
  let zustand: string;
  switch (a.status) {
    case 'wartet': zustand = `wartet · ${teilAnzahl(a.datei.size)} Teil${teilAnzahl(a.datei.size) === 1 ? '' : 'e'}`; break;
    case 'laeuft': zustand = p ? (p.phase === 'pruefen' || p.phase === 'hochladen' ? `${PHASE[p.phase]} ${p.teil + 1} von ${p.teile}` : PHASE[p.phase]) : 'startet'; break;
    case 'fertig': zustand = `✓ hochgeladen nach ${a.ordner}`; break;
    case 'uebersprungen': zustand = `✓ war schon da (${a.ordner})`; break;
    case 'abgebrochen': zustand = 'abgebrochen'; break;
    default: zustand = `⚠ ${a.fehler}`;
  }
  return (
    <li className={`ablage__auftrag ablage__auftrag--${a.status}`}>
      <div className="ablage__name">{a.datei.name} <span className="muted">{formatGroesse(a.datei.size)}</span></div>
      <div className="ablage__balken"><span style={{ width: `${anteil * 100}%` }} /></div>
      <div className="muted">{zustand}</div>
    </li>
  );
}
