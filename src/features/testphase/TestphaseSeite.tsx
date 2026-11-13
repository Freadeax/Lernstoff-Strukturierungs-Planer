import { useEffect, useMemo, useState } from 'react';
import './testphase.css';
import { BUILD_ID } from '../../core/build';
import { Icon } from '../../ui/icons';
import { PageHeading } from '../../ui/PageHeading';
import { DatenHinweis } from '../../ui/DatenHinweis';
import { notify } from '../../ui/shell/notifications';
import { merkliste } from '../../ui/shell/merkliste';
import { flatNav, NAV, seitenName, UNTERSEITEN } from '../../ui/shell/nav';
import { navigate, useRoute } from '../../ui/shell/router';
import { kopiere, speichereDatei, teile } from '../klasse/teilen';
import {
  alsCsv, ART_HILFE, ART_LABEL, AUFTRAEGE, diesesGeraet, entferneGesammelt, erledigte, geraetText, gemerkterName, gesammelte, gesendete,
  leseRueckmeldungen, merkeGesendet, merkeName, neueId, rueckmeldungText, sammle, setzeErledigt, ueberblick, type Art, type Rueckmeldung,
  bearbeitungen, leseSammelDatei, sammelDatei, setzeBearbeitung, STAND_LABEL, standVon, type Stand,
} from './testphase';
import { GRUND_LABEL, ladeMeldungen, type Grund } from '../qm/meldungen';
import { alsGesehenMerken, NEUIGKEITEN, ungesehen, zuletztGesehen } from './neuigkeiten';

type Ansicht = 'start' | 'neu' | 'auftraege' | 'rueckmeldung' | 'auswerten';
const ANSICHTEN: Array<{ id: Ansicht; label: string }> = [
  { id: 'start', label: 'Willkommen' },
  { id: 'neu', label: 'Was ist neu' },
  { id: 'auftraege', label: 'Testaufträge' },
  { id: 'rueckmeldung', label: 'Rückmeldung' },
  { id: 'auswerten', label: 'Auswerten' },
];

const datum = (iso: string) => { try { return new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; } };
const name = (p?: string) => (p ? seitenName(p.split('?')[0]!) ?? p : 'allgemein');

function Willkommen() {
  const fertig = erledigte().length;
  const neu = ungesehen(zuletztGesehen()).length;
  return (
    <div className="testphase__spalte">
      {neu > 0 && <p className="note"><strong>{neu === 1 ? 'Eine Neuerung' : `${neu} Neuerungen`} seit deinem letzten Blick.</strong> <a href="#/system/test?ansicht=neu">Was ist neu</a></p>}
      <section className="card">
        <h2>Schön, dass du testest</h2>
        <p>Der Lernstoff-Planer hilft dir in der generalistischen Pflegeausbildung beim Lernen: Lernplan, Karteikarten, Trainer, Fall- und Praxissimulationen und Prüfungsvorbereitung an einem Ort. Er ist noch in Entwicklung, deshalb ist deine Rückmeldung wichtig.</p>
        <ol className="testphase__schritte">
          <li><strong>Ausprobieren.</strong> Die <a href="#/system/test?ansicht=auftraege">Testaufträge</a> führen dich in etwa einer Stunde durch alles Wichtige. Du kannst sie auch auf mehrere Tage verteilen.</li>
          <li><strong>Rückmelden.</strong> Was hakt, unklar ist oder gefällt, schickst du über <a href="#/system/test?ansicht=rueckmeldung">Rückmeldung</a>. Am schnellsten geht es direkt nach dem Ausprobieren.</li>
          <li><strong>Weiterlernen.</strong> Alles, was du anlegst, bleibt erhalten, auch nach dem Test.</li>
        </ol>
        <div className="row">
          <a className="button-link primary" href="#/system/test?ansicht=auftraege">{fertig ? `Weiter mit den Testaufträgen (${fertig} von ${AUFTRAEGE.length})` : 'Mit den Testaufträgen beginnen'}</a>
          <a className="button-link" href="#/system/test?ansicht=rueckmeldung">Gleich etwas rückmelden</a>
        </div>
      </section>
      <section className="card">
        <h2>Wo deine Daten liegen</h2>
        <p>Es gibt kein Konto und keinen Server. Alles, was du lernst und anlegst, bleibt <strong>nur in diesem Browser auf diesem Gerät</strong>. Niemand sonst sieht deinen Lernstand, auch nicht, wer den Test betreut.</p>
        <ul>
          <li>Nur was du selbst als Rückmeldung verschickst, kommt bei der Testleitung an.</li>
          <li>Löschst du die Browserdaten oder die App, ist der Lernstand weg. Mit der <a href="#/system/sicherung">Datensicherung</a> nimmst du ihn mit auf ein anderes Gerät.</li>
          <li>Die KI-Funktionen (z. B. Fallsimulator, Zusammenfassen) brauchen einen eigenen API-Schlüssel und sind für den Test nicht nötig.</li>
          <li>Trage keine echten Patientendaten ein, auch nicht in Freitextfeldern.</li>
        </ul>
      </section>
      <section className="card">
        <h2>Als App auf dem Handy</h2>
        <p>So startet der Planer wie eine App und funktioniert auch ohne Internet:</p>
        <ul>
          <li><strong>iPhone und iPad (Safari):</strong> Teilen-Symbol, dann „Zum Home-Bildschirm“.</li>
          <li><strong>Android (Chrome):</strong> Menü mit den drei Punkten, dann „App installieren“ oder „Zum Startbildschirm hinzufügen“.</li>
        </ul>
        <p className="muted">Neue Versionen kommen von selbst. Zeigt eine Seite „Neue Version verfügbar“, einmal neu laden. Deine Version: <code>{BUILD_ID}</code></p>
      </section>
      <section className="card">
        <h2>Zurechtfinden</h2>
        <ul>
          <li><strong>Heute</strong> schlägt dir den nächsten sinnvollen Schritt vor.</li>
          <li><strong>Suche</strong> (oben, auf dem Rechner Strg/Cmd + K) findet Seiten, Themen, Fachbegriffe und führt Befehle aus.</li>
          <li><strong>Stern</strong> in der Kopfleiste legt eine Seite als Favorit oben ins Menü.</li>
          <li>Unter jeder Übung zeigt <strong>„Passt dazu“</strong>, wie es sinnvoll weitergeht.</li>
        </ul>
      </section>
    </div>
  );
}

function WasIstNeu() {
  // Stand beim Öffnen festhalten, dann als gesehen merken: Markierungen bleiben sichtbar, bis man die Seite verlässt.
  const [gesehen] = useState(zuletztGesehen);
  useEffect(() => { alsGesehenMerken(); }, []);
  const neu = new Set(ungesehen(gesehen));
  const tage = [...new Set(NEUIGKEITEN.map((n) => n.datum))];
  return (
    <div className="testphase__spalte">
      <p className="muted">Was sich zuletzt getan hat. Am besten gleich ausprobieren und rückmelden.</p>
      {tage.map((d) => (
        <section key={d} className="card">
          <h2>{new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          <ul className="testphase__liste">
            {NEUIGKEITEN.filter((n) => n.datum === d).map((n) => (
              <li key={n.titel} className="testphase__neu">
                <div><a href={`#${n.pfad}`}><strong>{n.titel}</strong></a>{neu.has(n) && <span className="badge testphase__marke">Neu für dich</span>}</div>
                <p>{n.text}</p>
                <a className="testphase__klein" href={`#/system/test?ansicht=rueckmeldung&seite=${encodeURIComponent(n.pfad)}`}>Dazu rückmelden</a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Auftraege() {
  const [fertig, setFertig] = useState(erledigte);
  const minuten = AUFTRAEGE.filter((a) => !fertig.includes(a.id)).reduce((n, a) => n + a.minuten, 0);
  return (
    <div className="testphase__spalte">
      <div className="card testphase__stand" role="status">
        <progress max={AUFTRAEGE.length} value={fertig.length} aria-label="Erledigte Testaufträge" />
        <span>{fertig.length} von {AUFTRAEGE.length} erledigt{minuten ? `, noch etwa ${minuten} Minuten` : '. Danke!'}</span>
      </div>
      <ol className="testphase__auftraege">
        {AUFTRAEGE.map((a, i) => {
          const ok = fertig.includes(a.id);
          return (
            <li key={a.id} className={`card testphase__auftrag${ok ? ' testphase__auftrag--fertig' : ''}`}>
              <div className="testphase__auftrag-kopf">
                <span className="testphase__nr" aria-hidden="true">{ok ? <Icon name="check" size={16} /> : i + 1}</span>
                <h3>{a.titel}</h3>
                <small className="muted">ca. {a.minuten} min</small>
              </div>
              <p>{a.schritte}</p>
              <p className="muted">Achte darauf: {a.ziel}</p>
              <div className="row">
                <a className="button-link" href={`#${a.pfad}`}>Öffnen</a>
                <label className="check"><input type="checkbox" checked={ok} onChange={(e) => setFertig(setzeErledigt(a.id, e.target.checked))} /><span>Erledigt</span></label>
                <a className="button-link ghost" href={`#/system/test?ansicht=rueckmeldung&seite=${encodeURIComponent(a.pfad.split('?')[0]!)}`}>Dazu rückmelden</a>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Rueckmelden() {
  const { params } = useRoute();
  const seiten = useMemo(() => [...flatNav(NAV), ...UNTERSEITEN].filter((s) => s.path !== '/system/test'), []);
  const vorschlag = params.get('seite') ?? merkliste.get().zuletzt.find((p) => p !== '/system/test') ?? '';
  const startArt = (params.get('art') as Art | null) ?? (params.get('technik') ? 'fehler' : 'unklar');
  const [art, setArt] = useState<Art>(startArt in ART_LABEL ? startArt : 'unklar');
  const [seite, setSeite] = useState(seiten.some((s) => s.path === vorschlag) ? vorschlag : '');
  // Aus „Frage melden“ in einer Übung: die Meldung reist im Code mit (Überarbeitungsliste der Testleitung)
  const meldung = useMemo(() => { const id = params.get('meldung'); return id ? ladeMeldungen().find((m) => m.id === id) : undefined; }, [params]);
  const [text, setText] = useState(() => (meldung ? `${GRUND_LABEL[meldung.grund]}.${meldung.notiz ? ` ${meldung.notiz}` : ''}` : ''));
  const [sterne, setSterne] = useState(0);
  const [wer, setWer] = useState(gemerkterName);
  const [mitGeraet, setMitGeraet] = useState(true);
  const technik = params.get('technik') ?? undefined;
  const [busy, setBusy] = useState(false);
  const [fertig, setFertig] = useState<{ r: Rueckmeldung; text: string } | null>(null);
  const [alte, setAlte] = useState(gesendete);
  const geraet = useMemo(() => diesesGeraet(BUILD_ID), []);
  const zuKurz = text.trim().length < 5;

  async function erstellen() {
    if (zuKurz) return;
    setBusy(true);
    try {
      merkeName(wer);
      const r: Rueckmeldung = {
        v: 1, id: neueId(), art, seite: seite || undefined, text: text.trim(), sterne: sterne || undefined, name: wer.trim() || undefined,
        geraet: mitGeraet ? geraet : undefined, auftraege: erledigte(), technik, erstellt: new Date().toISOString(),
        frage: meldung ? { quelle: meldung.quelle, aufgabeId: meldung.aufgabeId, fp: meldung.fp, titel: meldung.titel, frage: meldung.frage, grund: meldung.grund, antwort: meldung.antwort } : undefined,
      };
      const t = await rueckmeldungText(r, seite ? name(seite) : undefined);
      merkeGesendet(r); setAlte(gesendete());
      setFertig({ r, text: t });
    } catch (e) {
      notify('critical', 'Rückmeldung konnte nicht erstellt werden', e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  if (fertig) {
    return (
      <div className="testphase__spalte">
        <section className="card">
          <h2>Fast geschafft: jetzt verschicken</h2>
          <p>Schicke den Text an die Person, die den Test betreut, zum Beispiel per WhatsApp, Signal oder Mail. Der Code am Ende gehört dazu.</p>
          <div className="row">
            <button type="button" className="primary" onClick={() => teile({ title: 'Rückmeldung Lernstoff-Planer', text: fertig.text }, 'Rückmeldung')}>Teilen …</button>
            <button type="button" onClick={() => kopiere(fertig.text, 'Rückmeldung')}>Kopieren</button>
            <a className="button-link" href={`mailto:?subject=${encodeURIComponent(`Rückmeldung Lernstoff-Planer: ${ART_LABEL[fertig.r.art]}`)}&body=${encodeURIComponent(fertig.text)}`}>Als Mail</a>
          </div>
          <details><summary>Text ansehen</summary><pre className="testphase__vorschau">{fertig.text}</pre></details>
          <div className="row">
            <button type="button" className="ghost" onClick={() => { setFertig(null); setText(''); setSterne(0); }}>Noch eine Rückmeldung</button>
            <button type="button" className="ghost" onClick={() => navigate('/')}>Zur Startseite</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="testphase__spalte">
      <form className="card testphase__formular" onSubmit={(e) => { e.preventDefault(); void erstellen(); }}>
        <fieldset>
          <legend>Worum geht es?</legend>
          <div className="testphase__arten">
            {(Object.keys(ART_LABEL) as Art[]).map((a) => (
              <label key={a} className={`testphase__art${art === a ? ' testphase__art--an' : ''}`}>
                <input type="radio" name="art" value={a} checked={art === a} onChange={() => setArt(a)} />
                <strong>{ART_LABEL[a]}</strong><small>{ART_HILFE[a]}</small>
              </label>
            ))}
          </div>
        </fieldset>
        <label>Seite
          <select value={seite} onChange={(e) => setSeite(e.target.value)}>
            <option value="">Allgemein, keine bestimmte Seite</option>
            {seiten.map((s) => <option key={s.path} value={s.path}>{s.label}</option>)}
          </select>
        </label>
        <label>Was ist dir aufgefallen?
          <textarea rows={6} value={text} maxLength={4000} required onChange={(e) => setText(e.target.value)}
            placeholder={art === 'fehler' ? 'Was hast du gemacht, was ist passiert, was hättest du erwartet?' : art === 'idee' ? 'Was fehlt dir, und wofür würdest du es nutzen?' : 'Beschreibe es in ein paar Sätzen.'} />
        </label>
        {meldung && <p className="note">Die gemeldete Frage wird mitgeschickt: <strong>{meldung.titel}</strong> („{meldung.frage.slice(0, 140)}“)</p>}
        {technik && <p className="note">Die technische Fehlermeldung wird mitgeschickt: <code>{technik}</code></p>}
        <fieldset className="testphase__sterne">
          <legend>Wie hilfreich ist die App für dich bisher? (freiwillig)</legend>
          <div className="pills" role="group">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className="pill" aria-pressed={sterne === n} aria-label={`${n} von 5 Sternen`} onClick={() => setSterne(sterne === n ? 0 : n)}>{'★'.repeat(n)}</button>
            ))}
          </div>
        </fieldset>
        <label>Kürzel oder Vorname (freiwillig)
          <input type="text" value={wer} maxLength={40} autoComplete="given-name" onChange={(e) => setWer(e.target.value)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={mitGeraet} onChange={(e) => setMitGeraet(e.target.checked)} />
          <span>Geräteangaben mitschicken: <span className="muted">{geraetText(geraet)}</span></span>
        </label>
        <DatenHinweis art="rueckmeldung" fiktiv={false} />
        <div className="row">
          <button type="submit" className="primary" disabled={busy || zuKurz}>{busy ? 'Wird erstellt …' : 'Rückmeldung erstellen'}</button>
          {zuKurz && text && <span className="muted">Bitte noch ein paar Worte mehr.</span>}
        </div>
      </form>
      {alte.length > 0 && (
        <details className="card">
          <summary>Deine bisherigen Rückmeldungen ({alte.length})</summary>
          <ul className="testphase__liste">
            {alte.map((r) => <li key={r.id}><strong>{ART_LABEL[r.art]}</strong> · {name(r.seite)} · <span className="muted">{datum(r.erstellt)}</span><br />{r.text}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}

function Auswerten() {
  const [liste, setListe] = useState(gesammelte);
  const [eingabe, setEingabe] = useState('');
  const [filter, setFilter] = useState<Art | ''>('');
  const [stand, setStand] = useState(bearbeitungen);
  const [nurOffen, setNurOffen] = useState(true);
  const ue = useMemo(() => ueberblick(liste), [liste]);
  const offen = (r: Rueckmeldung) => ['neu', 'in-arbeit'].includes(standVon(stand, r.id));
  const sichtbar = liste.filter((r) => (!filter || r.art === filter) && (!nurOffen || offen(r)));
  const anzahlOffen = liste.filter(offen).length;
  const setze = (id: string, b: { stand: Stand; notiz?: string }) => setStand(setzeBearbeitung(id, b));

  async function dateiLesen(f: File | undefined) {
    if (!f) return;
    try {
      const r = leseSammelDatei(await f.text());
      setListe(r.liste); setStand(bearbeitungen());
      notify(r.fehler ? 'warning' : 'info', `${r.neu} neu aufgenommen`, [r.doppelt ? `${r.doppelt} waren schon da.` : '', r.fehler ? `${r.fehler} Einträge waren beschädigt.` : ''].filter(Boolean).join(' ') || undefined);
    } catch (e) { notify('critical', 'Datei nicht gelesen', e instanceof Error ? e.message : String(e)); }
  }

  async function aufnehmen() {
    const { neu, fehler } = await leseRueckmeldungen(eingabe);
    if (!neu.length && !fehler.length) { notify('warning', 'Kein Code gefunden', 'Bitte den ganzen Text samt „LSP-RUECKMELDUNG[…]“ einfügen.'); return; }
    const r = sammle(neu);
    setListe(r.liste); setEingabe('');
    notify(fehler.length ? 'warning' : 'info', `${r.neu} neu aufgenommen`, [r.doppelt ? `${r.doppelt} waren schon da.` : '', ...fehler.slice(0, 3)].filter(Boolean).join(' ') || undefined);
  }

  return (
    <div className="testphase__spalte">
      <section className="card">
        <h2>Rückmeldungen sammeln</h2>
        <p>Für die Person, die den Test betreut: Nachrichten mit Rückmeldungs-Codes hier einfügen, auch mehrere auf einmal. Sie bleiben nur auf diesem Gerät.</p>
        <label>Eingefügte Nachrichten
          <textarea rows={4} value={eingabe} onChange={(e) => setEingabe(e.target.value)} placeholder="… LSP-RUECKMELDUNG[z…]" />
        </label>
        <div className="row">
          <button type="button" className="primary" disabled={!eingabe.trim()} onClick={() => void aufnehmen()}>Aufnehmen</button>
          <label className="button-link testphase__datei">Sammel-Datei einlesen<input type="file" accept="application/json,.json" onChange={(e) => { void dateiLesen(e.target.files?.[0]); e.target.value = ''; }} /></label>
        </div>
        <p className="muted">Mit der Sammel-Datei nimmst du alle Rückmeldungen samt Bearbeitungsstand auf ein anderes Gerät mit.</p>
      </section>
      {liste.length > 0 && (
        <>
          <section className="card">
            <h2>Überblick</h2>
            <dl className="testphase__zahlen">
              <div><dt>Gesamt</dt><dd>{ue.gesamt}</dd></div>
              {(Object.keys(ART_LABEL) as Art[]).map((a) => <div key={a}><dt>{ART_LABEL[a]}</dt><dd>{ue.jeArt[a]}</dd></div>)}
              {ue.sterneSchnitt !== undefined && <div><dt>Sterne im Schnitt</dt><dd>{ue.sterneSchnitt.toLocaleString('de-DE')}</dd></div>}
            </dl>
            <h3>Nach Seite</h3>
            <ul className="testphase__liste">
              {ue.jeSeite.slice(0, 8).map((s) => <li key={s.seite}>{s.seite ? <a href={`#${s.seite}`}>{name(s.seite)}</a> : 'Allgemein'}: {s.anzahl}{s.fehler ? `, davon ${s.fehler} Fehler` : ''}</li>)}
            </ul>
            <div className="row">
              <button type="button" onClick={() => speichereDatei(`rueckmeldungen-${new Date().toISOString().slice(0, 10)}.csv`, alsCsv(liste, (p) => seitenName(p), stand), 'text/csv;charset=utf-8')}>Als CSV speichern</button>
              <button type="button" onClick={() => speichereDatei(`rueckmeldungen-${new Date().toISOString().slice(0, 10)}.json`, sammelDatei(), 'application/json')}>Sammel-Datei speichern</button>
              <button type="button" className="ghost" onClick={() => { if (confirm('Alle gesammelten Rückmeldungen auf diesem Gerät löschen?')) { setListe(entferneGesammelt()); setStand(bearbeitungen()); } }}>Alle löschen</button>
            </div>
          </section>
          <section className="card">
            <div className="pills" role="group" aria-label="Nach Art filtern">
              <button type="button" className="pill" aria-pressed={!filter} onClick={() => setFilter('')}>Alle</button>
              {(Object.keys(ART_LABEL) as Art[]).map((a) => <button key={a} type="button" className="pill" aria-pressed={filter === a} onClick={() => setFilter(a)}>{ART_LABEL[a]} ({ue.jeArt[a]})</button>)}
            </div>
            <label className="check"><input type="checkbox" checked={nurOffen} onChange={(e) => setNurOffen(e.target.checked)} /><span>Nur offene zeigen ({anzahlOffen} von {liste.length})</span></label>
            {!sichtbar.length && <p className="muted">Nichts Offenes in dieser Auswahl.</p>}
            <ul className="testphase__liste testphase__liste--gesammelt">
              {sichtbar.map((r) => (
                <li key={r.id}>
                  <div><strong>{ART_LABEL[r.art]}</strong>{r.sterne ? ` · ${'★'.repeat(r.sterne)}` : ''} · {r.seite ? <a href={`#${r.seite}`}>{name(r.seite)}</a> : 'Allgemein'} · {r.name ?? 'ohne Namen'} · <span className="muted">{datum(r.erstellt)}</span></div>
                  <p>{r.text}</p>
                  {r.frage && <p className="muted">Gemeldete Frage: <strong>{r.frage.titel}</strong> · {GRUND_LABEL[r.frage.grund as Grund] ?? r.frage.grund} · <a href="#/system/qualitaet?ansicht=liste">In der Überarbeitungsliste</a></p>}
                  {(r.geraet || r.technik) && <p className="muted">{r.geraet ? geraetText(r.geraet) : ''}{r.technik ? ` · Fehler: ${r.technik}` : ''}</p>}
                  <div className="testphase__bearbeiten">
                    <label>Stand
                      <select value={standVon(stand, r.id)} onChange={(e) => setze(r.id, { stand: e.target.value as Stand, notiz: stand[r.id]?.notiz })}>
                        {(Object.keys(STAND_LABEL) as Stand[]).map((x) => <option key={x} value={x}>{STAND_LABEL[x]}</option>)}
                      </select>
                    </label>
                    <label>Notiz
                      <input type="text" maxLength={500} defaultValue={stand[r.id]?.notiz ?? ''} placeholder="z. B. PR #…, Antwort an Tester"
                        onBlur={(e) => { if (e.target.value !== (stand[r.id]?.notiz ?? '')) setze(r.id, { stand: standVon(stand, r.id), notiz: e.target.value }); }} />
                    </label>
                    <button type="button" className="ghost" onClick={() => { setListe(entferneGesammelt(r.id)); setStand(bearbeitungen()); }}>Entfernen</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

/** Testphase: Einstieg für neue Testerinnen und Tester, Testaufträge, Rückmeldung als Code und Auswertung. */
export default function TestphaseSeite() {
  const { params } = useRoute();
  const ansicht = (ANSICHTEN.find((a) => a.id === params.get('ansicht'))?.id ?? 'start') as Ansicht;
  useEffect(() => { document.querySelector('.testphase')?.scrollIntoView?.({ block: 'start' }); }, [ansicht]);
  return (
    <section className="page testphase">
      <PageHeading eyebrow="Für alle, die mittesten" title="Testphase" description="Einstieg, Testaufträge und Rückmeldung an einem Ort. Ohne Konto, dein Lernstand bleibt auf deinem Gerät." />
      <nav className="pills testphase__wahl" aria-label="Bereich der Testphase">
        {ANSICHTEN.map((a) => <a key={a.id} className="pill" href={`#/system/test?ansicht=${a.id}`} aria-current={a.id === ansicht ? 'page' : undefined}>{a.label}</a>)}
      </nav>
      {ansicht === 'start' && <Willkommen />}
      {ansicht === 'neu' && <WasIstNeu />}
      {ansicht === 'auftraege' && <Auftraege />}
      {ansicht === 'rueckmeldung' && <Rueckmelden />}
      {ansicht === 'auswerten' && <Auswerten />}
    </section>
  );
}
