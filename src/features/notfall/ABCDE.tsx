// ABCDE-Notfallübung: Einschätzen (A–E) und Handeln kosten Simulationszeit, währenddessen verändern
// sich die Werte. Kein Echtzeit-Timer: jede Handlung rückt die Uhr vor, damit der Verlauf
// reproduzierbar bleibt. Raumfoto als Bühne, Monitor erst nach dem Anschließen.

import { abcdeZustand } from './zustand';
import { ZustandsTafel } from '../../ui/sim/ZustandsTafel';
import { useState } from 'react';
import { logActivity } from '../../core/activity';
import { FreigabeHinweis } from '../../ui/sim/FreigabeHinweis';
import { PatientenMonitor } from '../../ui/sim/PatientenMonitor';
import { RaumBuehne } from '../../ui/sim/raeume/RaumBuehne';
import { RAEUME } from '../../ui/sim/raeume/katalog';
import { spiele } from '../../ui/audio/spieler';
import {
  befunden, beginne, bewerte, BUCHSTABE_NAME, BUCHSTABEN, handeln, NOTFAELLE, uebergeben, uhr,
  type Buchstabe, type Notfall, type Stand,
} from './abcde';
import { NOTFALL_FREIGABE } from './freigaben';
import './notfall.css';
import { AuswertungsKarte } from '../../ui/sim/AuswertungsKarte';
import { abcdeAuswertung } from './auswertung';

const ART_TEXT = { befund: 'Befund', massnahme: 'Maßnahme', falsch: 'Ungünstig', hinweis: 'Hinweis', kritisch: 'Kritisch' } as const;

function monitorWerte(s: Stand) {
  const w = s.werte;
  return { puls: w.puls, af: w.af, spo2: w.spo2, sys: w.sys, dia: w.dia, temp: w.temp, avpu: w.avpu, sauerstoff: s.massnahmen.includes('o2') };
}

export function ABCDE() {
  const [fall, setFall] = useState<Notfall>(NOTFAELLE[0]!);
  const [s, setS] = useState<Stand | null>(null);
  const [aktiv, setAktiv] = useState<Buchstabe | 'Team' | null>(null);

  function weiter(n: Stand, vorher: Stand) {
    setS(n);
    if (n.ende === 'kritisch' && !vorher.ende) spiele('rea-alarm');
    if (n.ende && !vorher.ende) {
      const b = bewerte(n);
      void logActivity({ kind: 'uebung', severity: b.punkte === b.max ? 'info' : 'warning', title: `ABCDE-Übung: ${n.fall.titel}`, detail: `${b.punkte} von ${b.max} Punkten, ${uhr(n.zeit)} min` });
    }
  }

  if (!s) return <div className="abcde card">
    <h3>ABCDE-Notfall üben</h3>
    <p>Ein Mensch wird akut krank. Schätze ihn nach A, B, C, D, E ein, hole Hilfe und handle. Jede Einschätzung und jede Maßnahme kostet Zeit, und der Zustand verändert sich währenddessen.</p>
    <fieldset className="abcde__wahl"><legend>Notfall</legend>
      {NOTFAELLE.map(f => <label key={f.id}><input type="radio" name="abcde-fall" checked={fall.id === f.id} onChange={() => setFall(f)} /> <strong>{f.titel}</strong> <small className="muted">{f.person}</small></label>)}
    </fieldset>
    <FreigabeHinweis freigabe={NOTFALL_FREIGABE[fall.id]} ort="start" />
    <button type="button" className="primary" onClick={() => { setS(beginne(fall)); setAktiv(null); }}>Übung starten</button>
    <p className="muted">Die Werte folgen einem didaktischen Modell. Medikamente nur nach Anordnung oder Notfallstandard der Einrichtung.</p>
  </div>;

  const f = s.fall;
  const raum = RAEUME[f.raum];
  const letzter = s.verlauf.at(-1)!;
  const bewertung = s.ende ? bewerte(s) : null;
  const massnahmen = [...f.massnahmen].sort((a, b) => (a.buchstabe === 'Team' ? -1 : BUCHSTABEN.indexOf(a.buchstabe)) - (b.buchstabe === 'Team' ? -1 : BUCHSTABEN.indexOf(b.buchstabe)));
  const patient = raum.hotspots?.find(h => h.id === 'patient');

  return <div className="abcde">
    <div className={`abcde__buehne ${s.ende === 'kritisch' ? 'is-kritisch' : ''}`}>
      <RaumBuehne raum={f.raum} ort={f.person}
        monitor={raum.monitor ? { werte: s.monitor ? monitorWerte(s) : {}, zustand: s.monitor ? 'laeuft' : 'standby' } : undefined}>
        {aktiv && patient && <span key={s.verlauf.length} className="abcde__taetigkeit" style={{ left: `${patient.x * 100}%`, top: `${patient.y * 100}%` }} aria-hidden="true">{aktiv === 'Team' ? 'Hilfe holen' : `${aktiv} · ${BUCHSTABE_NAME[aktiv]}`}</span>}
        <span className="abcde__alarm" aria-hidden="true" />
      </RaumBuehne>
    </div>

    <aside className="abcde__steuerung" aria-label="ABCDE-Notfall">
      <div className="rea__status">
        <span className="rea__chip">Simulationszeit {uhr(s.zeit)}</span>
        <span className="rea__chip">Eingeschätzt: {BUCHSTABEN.filter(b => s.befunde.includes(b)).join(' ') || '–'}</span>
        {s.monitor ? <span className="rea__chip">Monitor läuft</span> : <span className="rea__chip">Kein Monitor</span>}
      </div>
      <p className={`rea__meldung is-${letzter.art === 'falsch' || letzter.art === 'kritisch' ? 'falsch' : letzter.art === 'massnahme' ? 'ok' : 'info'}`} role="status" aria-live="polite">
        <strong>{letzter.titel}.</strong> {letzter.text}
      </p>
      {s.monitor && !raum.monitor && <PatientenMonitor kompakt werte={monitorWerte(s)} titel={`Monitor · ${uhr(s.zeit)}`} />}
      <ZustandsTafel z={abcdeZustand(s)} titel="Zustand am Bett" />

      {!s.ende && <>
        <div className="abcde__abc" role="group" aria-label="Einschätzen">
          {BUCHSTABEN.map(b => <button key={b} type="button" aria-pressed={s.befunde.includes(b)} onClick={() => { setAktiv(b); weiter(befunden(s, b), s); }}>
            <span className="abcde__buchstabe" aria-hidden="true">{b}</span>{BUCHSTABE_NAME[b]}<small>{f.befunde.find(x => x.buchstabe === b)!.sek} s</small>
          </button>)}
        </div>
        <h4 className="abcde__titel">Handeln</h4>
        <FreigabeHinweis freigabe={NOTFALL_FREIGABE[f.id]} ort="entscheidung" />
        <div className="abcde__massnahmen" role="group" aria-label="Maßnahmen">
          {massnahmen.map(m => <button key={m.id} type="button" disabled={s.massnahmen.includes(m.id)} onClick={() => { setAktiv(m.buchstabe); weiter(handeln(s, m.id), s); }}>
            <span className="abcde__marke" aria-hidden="true">{m.buchstabe === 'Team' ? '☎' : m.buchstabe}</span>{m.label}<small>{m.sek} s</small>
          </button>)}
        </div>
        <button type="button" className="ghost small" onClick={() => weiter(uebergeben(s), s)}>An das Team übergeben und auswerten</button>
      </>}

      {bewertung && <div className="rea__ergebnis abcde__ergebnis">
        <h4>{s.ende === 'stabil' ? 'Stabilisiert' : s.ende === 'kritisch' ? 'Kritisch verschlechtert' : 'Übergeben'} · {bewertung.punkte} von {bewertung.max}</h4>
        <AuswertungsKarte a={abcdeAuswertung(s)} />
        <div className="rea__knoepfe"><button type="button" className="primary" onClick={() => { setS(beginne(f)); setAktiv(null); }}>Noch einmal</button><button type="button" onClick={() => setS(null)}>Anderer Notfall</button></div>
      </div>}

      <details className="abcde__verlauf" open={!!s.ende}>
        <summary>Verlauf ({s.verlauf.length})</summary>
        <ol>{s.verlauf.map((e, i) => <li key={i} className={`is-${e.art}`}><time>{uhr(e.zeit)}</time> <strong>{ART_TEXT[e.art]}: {e.titel}</strong> {e.text}</li>)}</ol>
      </details>
    </aside>
  </div>;
}
