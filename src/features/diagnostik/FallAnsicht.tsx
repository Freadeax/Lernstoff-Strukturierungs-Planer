// Ein laufender Diagnostik-Fall mit derselben Leiste wie die Raumsimulation:
// Beobachtung, Labor, Bildgebung, Übergabe, Auswertung.

import { useEffect, useMemo, useState } from 'react';
import { bucheErgebnis, buchungsText } from '../lernplan/ergebnis';
import { notiereFehler } from '../fehlerheft/fehlerheft';
import { storage } from '../../ui/lib/store';
import { navigate } from '../../ui/shell/router';
import { fehlerAusLauf, kriterien, lernereignis, versuchIdVon } from './lernereignis';
import { PatientenMonitor } from '../../ui/sim/PatientenMonitor';
import { BildBetrachter } from '../../ui/sim/bildgebung/BildBetrachter';
import { anzahlSchichten, trifft, type Bildserie } from '../../ui/sim/bildgebung/serie';
import { formatWert, FLAG_TEXT, parameter } from '../../ui/sim/labor/parameter';
import { uhrzeit } from '../../ui/sim/labor/modell';
import { VerlaufKurve } from '../../ui/sim/labor/VerlaufKurve';
import type { Farbsystem } from '../../ui/sim/labor/praeanalytik';
import { LaborBereich } from './LaborBereich';
import { FrageKarte, Rueckmeldung } from './FrageKarte';
import { auswertung, fuehreAus, vitalReihe, zeitleiste, type ZeitArt, monitorZustand, naechsterBefund, offeneAnrufe, offeneMeldungen, vitalwerte, type Befehl, type Lauf, type MonitorStatus } from './lauf';
import { DiagnostikSzene } from './DiagnostikSzene';
import type { DiagnostikFall, Untersuchung } from './typen';
import { FreigabeHinweis } from '../../ui/sim/FreigabeHinweis';
import { freigabeFuer } from './freigaben';
import { SimTon } from '../../ui/audio/SimTon';
import { raumFuerSetting } from '../../ui/audio/klaenge';
import { alarmProfil, gesamtAlarm, monitorGruppe, normBand } from '../../ui/sim/monitor';

export const REITER = [
  { id: 'beobachtung', label: 'Beobachtung' },
  { id: 'labor', label: 'Labor' },
  { id: 'bildgebung', label: 'Bildgebung' },
  { id: 'uebergabe', label: 'Übergabe' },
  { id: 'auswertung', label: 'Auswertung' },
] as const;
export type Reiter = typeof REITER[number]['id'];

export function FallAnsicht({ fall, lauf, setLauf, zurueck, farbsystem, setFarbsystem, startReiter }: {
  startReiter?: Reiter;
  fall: DiagnostikFall; lauf: Lauf; setLauf: (l: Lauf) => void; zurueck: () => void; farbsystem: Farbsystem; setFarbsystem: (f: Farbsystem) => void;
}) {
  const [reiter, setReiter] = useState<Reiter>(startReiter ?? 'beobachtung');
  const senden = (b: Befehl) => setLauf(fuehreAus(lauf, fall, b));
  const anrufe = offeneAnrufe(lauf, fall);
  const meldungen = lauf.beendet === undefined ? offeneMeldungen(lauf, fall) : [];
  const naechster = naechsterBefund(lauf, fall);
  const werte = vitalwerte(lauf, fall);
  const status = monitorZustand(lauf, fall);
  const uhr = uhrzeit(fall.startzeit, lauf.minute);

  return (
    <section className="page dx-fall" aria-labelledby="dx-fall-titel">
      <div className="dx-kopf">
        <button type="button" className="dx-zurueck" onClick={zurueck}>← Alle Fälle</button>
        <h2 id="dx-fall-titel">{fall.titel}</h2>
        <p className="muted">{fall.bereich} · {fall.patient.name}, {fall.patient.alter} J. · <span className="dx-uhr" aria-label={`Simulierte Uhrzeit ${uhr}`}>{uhr}</span></p>
      </div>

      <DiagnostikSzene fall={fall} werte={werte} status={status} senden={senden} setReiter={setReiter} telefon={anrufe.length > 0} />
      <div className="audio-simton">
        <SimTon raum={raumFuerSetting(fall.bereich)} telefon={anrufe.length > 0} technisch={status === 'signalausfall'}
          herzschlag={status !== 'signalausfall'} alarm={status === 'signalausfall' ? 'ok' : gesamtAlarm(werte, monitorGruppe(fall.patient.alter))}
          monitor={{ puls: werte.puls, spo2: werte.spo2, aktiv: status !== 'abwesend' && lauf.beendet === undefined }} />
      </div>

      {anrufe.map(({ schluessel, ergebnis }) => {
        const p = parameter(ergebnis.parameter);
        return (
          <div key={schluessel} className="dx-anruf" role="alert">
            <p><strong>Telefon: Zentrallabor.</strong> „Kritischer Wert bei {fall.patient.name}: {p.name} {formatWert(p, ergebnis.wert!)} {p.einheit}, {FLAG_TEXT[ergebnis.flag]}.{ergebnis.kommentar ? ` ${ergebnis.kommentar}` : ''}“</p>
            <button type="button" className="primary" onClick={() => senden({ typ: 'quittieren', schluessel })}>Zurücklesen, Name und Uhrzeit dokumentieren</button>
            <FreigabeHinweis freigabe={freigabeFuer(fall)} ort="entscheidung" />
          </div>
        );
      })}

      {meldungen.map(({ schluessel, ergebnis }) => {
        const p = parameter(ergebnis.parameter);
        return (
          <div key={schluessel} className="dx-anruf" role="status">
            <p><strong>Noch nicht ärztlich gemeldet:</strong> {p.name} {formatWert(p, ergebnis.wert!)} {p.einheit} kam nach deinem SBAR-Gespräch.</p>
            <button type="button" className="primary" onClick={() => senden({ typ: 'melden', schluessel })}>Ärztin/Arzt anrufen und den Wert melden</button>
          </div>
        );
      })}

      {lauf.beendet === undefined && (
        <div className="dx-zeit" role="group" aria-label="Zeit">
          <span className="muted">Zeit vergehen lassen:</span>
          {[5, 15, 30].map((m) => <button key={m} type="button" className="pill" onClick={() => senden({ typ: 'warten', minuten: m })}>+{m} min</button>)}
          {naechster !== undefined && <button type="button" className="pill pill--accent" onClick={() => senden({ typ: 'warten', minuten: naechster - lauf.minute })}>bis zum nächsten Befund ({uhrzeit(fall.startzeit, naechster)})</button>}
        </div>
      )}

      <div className="dx-reiter pills" role="tablist" aria-label="Bereiche">
        {REITER.map((r) => (
          <button key={r.id} type="button" role="tab" id={`dx-tab-${r.id}`} aria-controls={`dx-panel-${r.id}`} aria-selected={reiter === r.id} className="pill" onClick={() => setReiter(r.id)}>
            {r.label}{r.id === 'labor' && anrufe.length ? ' •' : ''}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`dx-panel-${reiter}`} aria-labelledby={`dx-tab-${reiter}`} className="dx-panel">
        {reiter === 'beobachtung' && <Beobachtung fall={fall} lauf={lauf} senden={senden} werte={werte} uhr={uhr} status={status} />}
        {reiter === 'labor' && <LaborBereich fall={fall} lauf={lauf} senden={senden} farbsystem={farbsystem} setFarbsystem={setFarbsystem} />}
        {reiter === 'bildgebung' && <Bildgebung fall={fall} lauf={lauf} senden={senden} />}
        {reiter === 'uebergabe' && <Uebergabe fall={fall} lauf={lauf} senden={senden} />}
        {reiter === 'auswertung' && <Auswertung fall={fall} lauf={lauf} senden={senden} />}
      </div>
    </section>
  );
}

function Beobachtung({ fall, lauf, senden, werte, uhr, status }: { fall: DiagnostikFall; lauf: Lauf; senden: (b: Befehl) => void; werte: ReturnType<typeof vitalwerte>; uhr: string; status: MonitorStatus }) {
  const [notiz, setNotiz] = useState('');
  const p = fall.patient;
  return (
    <div className="dx-spalten">
      <div>
        <PatientenMonitor
          werte={status === 'signalausfall' ? { ...werte, spo2: null } : werte}
          aktiv={status !== 'abwesend'} ausText="Nicht angeschlossen"
          titel={status === 'signalausfall' ? `${uhr} · SpO₂: kein Signal` : `${uhr} · ${werte.sauerstoff ? 'mit O₂' : 'Raumluft'}`}
          gruppe={monitorGruppe(p.alter)}
        />
        {monitorGruppe(p.alter) !== 'erwachsen' && <MonitorProfil alter={p.alter} />}
        {status === 'abwesend' && <button type="button" className="primary" disabled={lauf.beendet !== undefined} onClick={() => senden({ typ: 'monitor' })}>Monitor anschließen (~3 min)</button>}
        {status === 'signalausfall' && <button type="button" className="primary" onClick={() => senden({ typ: 'sensor' })}>Fingersensor prüfen und neu anlegen</button>}
        <section className="card dx-karte">
          <h3>Patientin/Patient</h3>
          <p>{p.anlass}</p>
          <dl className="dx-akte">
            <div><dt>Vorgeschichte</dt><dd>{p.vorgeschichte.join(', ')}</dd></div>
            <div><dt>Medikamente</dt><dd>{p.medikamente.join(', ')}</dd></div>
            <div><dt>Allergien</dt><dd>{p.allergien}</dd></div>
            {p.infusion && <div><dt>Infusion</dt><dd>{p.infusion}</dd></div>}
            <div><dt>Gewicht</dt><dd>{p.gewicht} kg</dd></div>
          </dl>
        </section>
      </div>
      <section className="card dx-karte" aria-labelledby="dx-doku">
        <h3 id="dx-doku">Dokumentation</h3>
        <form className="dx-notiz" onSubmit={(e) => { e.preventDefault(); senden({ typ: 'notiz', text: notiz }); setNotiz(''); }}>
          <label className="visually-hidden" htmlFor="dx-notiz">Eigener Eintrag</label>
          <textarea id="dx-notiz" rows={2} value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="Beobachtung, Maßnahme, Wirkung …" />
          <button type="submit" disabled={!notiz.trim()}>Eintragen</button>
        </form>
        <ol className="dx-verlauf" reversed>
          {[...lauf.log].reverse().map((e, i) => (
            <li key={lauf.log.length - i} className={`dx-verlauf__${e.art}`}>
              <span className="dx-verlauf__zeit">{uhrzeit(fall.startzeit, e.minute)}</span>
              <span className="dx-verlauf__art">{e.art === 'eigen' ? 'Eigener Eintrag' : 'System'}</span>
              <span>{e.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Bildgebung({ fall, lauf, senden }: { fall: DiagnostikFall; lauf: Lauf; senden: (b: Befehl) => void }) {
  if (!fall.bildgebung.length) return <p className="muted">In diesem Fall ist keine Bildgebung vorgesehen. Labor und Beobachtung führen hier zur Einschätzung.</p>;
  return <>{fall.bildgebung.map((u) => <UntersuchungKarte key={u.serie.id} u={u} fall={fall} lauf={lauf} senden={senden} />)}</>;
}

function UntersuchungKarte({ u, fall, lauf, senden }: { u: Untersuchung; fall: DiagnostikFall; lauf: Lauf; senden: (b: Befehl) => void }) {
  const [haken, setHaken] = useState<string[]>([]);
  const [ansicht, setAnsicht] = useState<'synthetisch' | 'echt' | 'beide'>('synthetisch');
  const ul = lauf.untersuchungen.find((x) => x.serie === u.serie.id);
  const reihenfolge = useMemo(() => [...u.vorbereitung].sort((a, b) => a.id.localeCompare(b.id) * (u.serie.id.length % 2 ? 1 : -1)), [u]);
  const serie: Bildserie = ansicht === 'echt' && u.echt ? u.echt : u.serie;
  const tipps = (lauf.tipps[serie.id] ?? []).map((t) => ({ x: t.x, y: t.y, schicht: t.schicht, richtig: !!t.treffer }));
  const sichtbar = serie.befunde.map((b) => b.id).filter((id) => lauf.gefunden.includes(id) || lauf.aufgedeckt.includes(id));
  const befundDa = ul && lauf.minute >= ul.befundAb;

  return (
    <section className="card dx-karte" aria-labelledby={`dx-u-${u.serie.id}`}>
      <h3 id={`dx-u-${u.serie.id}`}>{u.serie.untersuchung}</h3>
      {!ul ? (
        <>
          <p className="muted">Vorbereitung: Hake an, was du in diesem Fall prüfst oder erledigst. Nicht alles gehört dazu.{u.kontrastmittel ? ' Mit jodhaltigem Kontrastmittel.' : ''}</p>
          <ul className="dx-pruef">
            {reihenfolge.map((v) => (
              <li key={v.id}><label className="dx-check"><input type="checkbox" checked={haken.includes(v.id)} onChange={(e) => setHaken((h) => (e.target.checked ? [...h, v.id] : h.filter((x) => x !== v.id)))} /> {v.text}</label></li>
            ))}
          </ul>
          <button type="button" className="primary" disabled={lauf.beendet !== undefined} onClick={() => senden({ typ: 'untersuchung', serie: u.serie.id, vorbereitung: haken })}>Untersuchung durchführen (~{u.dauer} min)</button>
        </>
      ) : (
        <>
          {u.echt && (
            <div className="pills dx-quelle" role="group" aria-label="Bildquelle">
              <button type="button" className="pill" aria-pressed={ansicht === 'synthetisch'} onClick={() => setAnsicht('synthetisch')}>Übungsbild (synthetisch)</button>
              <button type="button" className="pill" aria-pressed={ansicht === 'echt'} onClick={() => setAnsicht('echt')}>Echtes Bild (frei lizenziert)</button>
              <button type="button" className="pill" aria-pressed={ansicht === 'beide'} onClick={() => setAnsicht('beide')}>Nebeneinander</button>
            </div>
          )}
          {ansicht === 'beide' && u.echt ? (
            <div className="dx-vergleich">
              {[u.serie, u.echt].map((x) => (
                <figure key={x.id}>
                  <BildBetrachter serie={x} sichtbareBefunde={x.befunde.map((b) => b.id).filter((id) => lauf.gefunden.includes(id) || lauf.aufgedeckt.includes(id))} />
                  <figcaption>{x.quelle.art === 'phantom' ? 'Synthetisches Übungsbild: schematisch, Formen stark vereinfacht.' : 'Echtes Bild eines anderen Patienten: feinere Strukturen, Überlagerungen, Rauschen.'}</figcaption>
                </figure>
              ))}
              <p className="muted dx-klein">Vergleiche dieselbe Stelle in beiden Bildern: Wie sieht der Befund im echten Bild aus? Fenster, Lupe und Messkreis funktionieren in beiden. Markieren geht in der Einzelansicht.</p>
            </div>
          ) : (
          <div className="dx-bildlayout">
            <BildBetrachter
              serie={serie}
              sichtbareBefunde={sichtbar}
              markierungen={tipps}
              onTipp={serie.befunde.length ? (x, y, schicht) => senden({ typ: 'tipp', serie: serie.id, x, y, schicht, treffer: trifft(serie, schicht, x, y)?.id }) : undefined}
            />
            <aside className="dx-befundspalte" aria-label="Befund">
              <h4>Befund</h4>
              <section>
                <h5>Serieninformationen</h5>
                <p>{serie.untersuchung}{serie.quelle.modalitaet === 'ct' ? `, ${anzahlSchichten(serie)} Schichten${serie.schichtdicke ? ` à ${serie.schichtdicke} mm` : ''}` : ''}. {serie.quelle.art === 'phantom' ? 'Synthetisches Übungsbild.' : serie.quelle.art === 'bilder' ? 'Echtes Bild, Urheber und Lizenz unter dem Bild.' : 'Eigenes Material.'}</p>
              </section>
              <section>
                <h5>Befundmarken</h5>
                {sichtbar.length ? (
                  <ul className="dx-marken">
                    {serie.befunde.filter((b) => sichtbar.includes(b.id)).map((b) => <li key={b.id}><strong>{b.titel}</strong>{lauf.gefunden.includes(b.id) ? ' (selbst gefunden)' : ' (aufgedeckt)'}: {b.text}</li>)}
                  </ul>
                ) : <p className="muted">Noch keine. Tippe mit „Markieren“ auf eine auffällige Stelle.</p>}
                <FreigabeHinweis freigabe={freigabeFuer(fall)} ort="entscheidung" />
              </section>
              <section>
                <h5>Eigene Einordnung</h5>
                <p>{serie.befunde.filter((b) => lauf.gefunden.includes(b.id)).length} von {serie.befunde.length} Befunden selbst gefunden, {(lauf.tipps[serie.id] ?? []).length} Markierungen gesetzt.</p>
                {serie.befunde.some((b) => !sichtbar.includes(b.id)) && <button type="button" onClick={() => senden({ typ: 'aufdecken', serie: serie.id })}>Befunde zeigen</button>}
              </section>
              <section>
                <h5>Rückmeldung der Radiologie</h5>
                {befundDa ? <p className="dx-befundtext"><strong>{uhrzeit(fall.startzeit, ul.befundAb)}:</strong> {serie.befundtext}</p>
                  : <p className="muted">Schriftlicher Befund folgt gegen {uhrzeit(fall.startzeit, ul.befundAb)}.</p>}
              </section>
            </aside>
          </div>
          )}
        </>
      )}
    </section>
  );
}

function Uebergabe({ fall, lauf, senden }: { fall: DiagnostikFall; lauf: Lauf; senden: (b: Befehl) => void }) {
  const [fakten, setFakten] = useState<string[]>([]);
  const gemischt = useMemo(() => [...fall.sbar].sort((a, b) => (a.id + fall.id).localeCompare(b.id + fall.id) * (a.relevant === b.relevant ? 1 : -1)), [fall]);
  if (!lauf.sbar) {
    return (
      <section className="card dx-karte" aria-labelledby="dx-sbar">
        <h3 id="dx-sbar">Ärztin oder Arzt informieren (SBAR)</h3>
        <p className="muted">Wähle, was du am Telefon sagst. Situation, Background, Assessment, Recommendation: kurz, vollständig, nichts Ablenkendes.</p>
        <FreigabeHinweis freigabe={freigabeFuer(fall)} ort="entscheidung" />
        <ul className="dx-pruef">
          {gemischt.map((s) => <li key={s.id}><label className="dx-check"><input type="checkbox" checked={fakten.includes(s.id)} onChange={(e) => setFakten((f) => (e.target.checked ? [...f, s.id] : f.filter((x) => x !== s.id)))} /> {s.text}</label></li>)}
        </ul>
        <button type="button" className="primary" disabled={!fakten.length || lauf.beendet !== undefined} onClick={() => senden({ typ: 'sbar', fakten })}>Anrufen</button>
      </section>
    );
  }
  return (
    <section className="card dx-karte" aria-labelledby="dx-anord">
      <h3 id="dx-anord">Ärztliche Anordnungen (fiktiv)</h3>
      <p className="muted">Die Reihenfolge entscheidest du. Manche Schritte gehören vor andere.</p>
      <ul className="dx-anordnungen">
        {fall.anordnungen.map((a) => {
          const erledigt = lauf.flags[a.flag] !== undefined;
          return (
            <li key={a.id}>
              <div><strong>{a.label}</strong><br /><span className="muted">{a.text}</span></div>
              <button type="button" disabled={erledigt || lauf.beendet !== undefined} onClick={() => senden({ typ: 'massnahme', id: a.id })}>{erledigt ? `erledigt ${uhrzeit(fall.startzeit, lauf.flags[a.flag])}` : `Durchführen (${a.dauer} min)`}</button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const BUCHUNG_KEY = 'lernstoff.diagnostik.buchungen';

/**
 * Bucht einen beendeten Versuch genau einmal in Lernplan und Fehlerheft (Audit SIM-05). Merkt sich die
 * Buchung je Versuch-ID, damit Wiederöffnen und Neuladen nichts doppelt zählen; der Lernplan selbst
 * lehnt dieselbe Versuch-ID ein zweites Mal ebenfalls ab.
 */
function LernplanKarte({ fall, lauf }: { fall: DiagnostikFall; lauf: Lauf }) {
  const versuchId = versuchIdVon(lauf);
  const [text, setText] = useState<string | undefined>(() => (versuchId ? storage.read<Record<string, string>>(BUCHUNG_KEY, {})[versuchId] : undefined));
  const ks = kriterien(lauf, fall);
  useEffect(() => {
    if (!versuchId || text !== undefined) return;
    const e = lernereignis(lauf, fall);
    const merken = (t: string) => { storage.write(BUCHUNG_KEY, { ...storage.read<Record<string, string>>(BUCHUNG_KEY, {}), [versuchId]: t }); setText(t); };
    notiereFehler(fehlerAusLauf(lauf, fall));
    if (!e) { merken('Keine Lernplan-Themen für diesen Fall.'); return; }
    bucheErgebnis(e).then((b) => merken(buchungsText(b))).catch(() => setText('Lernplan nicht erreichbar, bitte später erneut öffnen.'));
    // nur einmal je Versuch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versuchId]);
  return (
    <section className="card dx-karte" aria-labelledby="dx-lernplan">
      <h3 id="dx-lernplan">Kriterien und Lernplan</h3>
      <ul className="dx-kriterien">
        {ks.map((k) => <li key={k.id}><Rueckmeldung richtig={k.erfuellt} text={`${k.label}: ${k.ok} von ${k.gesamt}`} /></li>)}
      </ul>
      <p className="muted dx-klein">
        {!versuchId ? 'Dieser Versuch stammt aus einer älteren Version und wird nicht in den Lernplan gebucht. Mit „Neu beginnen“ zählt der nächste Versuch.'
          : text ?? 'Wird in den Lernplan übernommen …'}
        {versuchId && ` Versuch ${lauf.versuch ?? 1}. Lernfragen, die du nach dem Abschluss beantwortest, ändern diese Buchung nicht.`}
      </p>
      <div className="dx-zeile"><button type="button" onClick={() => navigate('/lernen/fehler')}>Zum Fehlerheft</button><button type="button" onClick={() => navigate('/lernen/plan')}>Zum Lernplan</button></div>
    </section>
  );
}

function Auswertung({ fall, lauf, senden }: { fall: DiagnostikFall; lauf: Lauf; senden: (b: Befehl) => void }) {
  const punkte = auswertung(lauf, fall);
  return (
    <div className="dx-auswertung">
      <section className="card dx-karte">
        <h3>Lernfragen zum Fall</h3>
        {fall.fragen.map((f) => <FrageKarte key={f.id} frage={f} fall={fall} antwort={lauf.antworten[f.id]} onAntwort={(richtig, wahl) => senden({ typ: 'antwort', frage: f.id, richtig, wahl })} />)}
      </section>
      {lauf.beendet === undefined ? (
        <section className="card dx-karte">
          <h3>Fall abschließen</h3>
          <p className="muted">Danach siehst du, was gut lief, was fehlte und die Auflösung. Die Lernfragen bleiben beantwortbar.</p>
          <button type="button" className="primary" onClick={() => senden({ typ: 'beenden' })}>Fall beenden und auswerten</button>
        </section>
      ) : (
        <>
          <LernplanKarte fall={fall} lauf={lauf} />
          <section className="card dx-karte">
            <h3>Rückmeldung</h3>
            <ul className="dx-punkte">{punkte.map((p, i) => <li key={i}><Rueckmeldung richtig={p.ok} text={`${p.titel}: ${p.text}`} /></li>)}</ul>
          </section>
          <Zeitleiste fall={fall} lauf={lauf} />
          <section className="card dx-karte">
            <h3>Auflösung: {fall.aufloesung.diagnose}</h3>
            <p>{fall.aufloesung.kernaussage}</p>
            <h4>Pflegerisch wichtig</h4>
            <ul>{fall.aufloesung.pflege.map((p) => <li key={p}>{p}</li>)}</ul>
            <p className="muted dx-klein">Fiktiver Lernfall, didaktisch vereinfacht und fachlich ungeprüft. Anordnungen, Dosierungen und Grenzwerte richten sich in der Praxis nach ärztlicher Anordnung und Hausstandard.</p>
          </section>
        </>
      )}
    </div>
  );
}

const ZEIT_ART: Record<ZeitArt, string> = { start: 'Start', monitor: 'Monitor', abnahme: 'Labor', befund: 'Befund', kritisch: 'Kritisch', bild: 'Bild', meldung: 'Meldung', massnahme: 'Maßnahme', eigen: 'Notiz', ende: 'Ende' };
const VITAL: { k: 'puls' | 'sys' | 'spo2' | 'af'; name: string; einheit: string }[] = [
  { k: 'puls', name: 'Puls', einheit: '/min' },
  { k: 'sys', name: 'Blutdruck systolisch', einheit: 'mmHg' },
  { k: 'spo2', name: 'SpO₂', einheit: '%' },
  { k: 'af', name: 'Atemfrequenz', einheit: '/min' },
];

/** Kinderprofil am Entscheidungspunkt: welche Alarmgrenzen gelten und woher sie stammen. */
function MonitorProfil({ alter }: { alter: number }) {
  const pr = alarmProfil(monitorGruppe(alter));
  return (
    <details className="dx-profil">
      <summary>{pr.label}{pr.bewertet ? '' : ' · keine automatische Wertung'}</summary>
      <p className="muted dx-klein">{pr.quelle}</p>
    </details>
  );
}

/** Auswertung: was wann geschah und wie sich der Zustand unter den Maßnahmen entwickelt hat. */
function Zeitleiste({ fall, lauf }: { fall: DiagnostikFall; lauf: Lauf }) {
  const eintraege = zeitleiste(lauf, fall);
  const [vital, setVital] = useState<typeof VITAL[number]['k']>('puls');
  const v = VITAL.find((x) => x.k === vital)!;
  const marken = lauf.massnahmen.map((m) => ({ minute: m.minute, text: fall.anordnungen.find((a) => a.id === m.id)?.label ?? m.id }));
  const gruppe = monitorGruppe(fall.patient.alter);
  const band = normBand(vital, gruppe);
  return (
    <section className="card dx-karte" aria-labelledby="dx-zeitleiste">
      <h3 id="dx-zeitleiste">Dein Ablauf</h3>
      <ol className="dx-zeitleiste">
        {eintraege.map((e, i) => (
          <li key={i} className={`dx-zeitleiste__${e.art}`}>
            <span className="dx-zeitleiste__zeit">{uhrzeit(fall.startzeit, e.minute)}</span>
            <span className="dx-zeitleiste__art">{ZEIT_ART[e.art]}</span>
            <span>{e.text}</span>
          </li>
        ))}
      </ol>
      <h4>So hat sich der Zustand entwickelt</h4>
      <div className="pills" role="group" aria-label="Vitalwert wählen">
        {VITAL.map((x) => <button key={x.k} type="button" className="pill" aria-pressed={x.k === vital} onClick={() => setVital(x.k)}>{x.name}</button>)}
      </div>
      <VerlaufKurve key={vital} name={v.name} einheit={v.einheit} punkte={vitalReihe(lauf, fall, vital)} band={band}
        format={(n) => String(Math.round(n))} zeitText={(m) => uhrzeit(fall.startzeit, m)} marken={marken} />
      <p className="muted dx-klein">Die gestrichelten Linien sind deine Maßnahmen. {!band ? 'Für diese Altersgruppe gibt es kein Profil, deshalb ohne grünes Band.' : `Grün: unauffälliger Bereich nach ${alarmProfil(gruppe).label.replace(/\.$/, "")} (Profil).`}</p>
    </section>
  );
}
