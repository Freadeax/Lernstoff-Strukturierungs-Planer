// Kritischen Wert melden: Anruf annehmen, zurücklesen, dokumentieren, SBAR bauen, bis zum
// ärztlichen Rückruf richtig handeln.

import { useState } from 'react';
import { bucheWerkbank, neueLaufId, werkbankThema } from './lernplan';
import { bewerteSbar, DOKU_FELDER, MELDUNGEN, type MeldungSzenario } from './meldung';

type Schritt = 'anruf' | 'doku' | 'sbar' | 'bisdahin' | 'fertig';

export function Meldung() {
  const [i, setI] = useState(0);
  const sz = MELDUNGEN[i]!;
  return <MeldungLauf key={sz.id} sz={sz} weiter={() => setI((i + 1) % MELDUNGEN.length)} />;
}

function MeldungLauf({ sz, weiter }: { sz: MeldungSzenario; weiter: () => void }) {
  const [schritt, setSchritt] = useState<Schritt>('anruf');
  const [notiz, setNotiz] = useState<number>();
  const [doku, setDoku] = useState<string[]>([]);
  const [dokuGeprueft, setDokuGeprueft] = useState(false);
  const [sbar, setSbar] = useState<string[]>([]);
  const [sbarGeprueft, setSbarGeprueft] = useState(false);
  const [bis, setBis] = useState<number>();
  const [punkte, setPunkte] = useState(0);
  const [laufId] = useState(neueLaufId);
  const [buchung, setBuchung] = useState<string>();
  const sbarWertung = sbarGeprueft ? bewerteSbar(sz, sbar) : undefined;
  // Bausteine gemischt, aber stabil je Szenario
  const [bausteine] = useState(() => [...sz.bausteine].sort((a, b) => a.text.localeCompare(b.text)));

  return (
    <section className="card wb-station" aria-labelledby="wb-meldung">
      <div className="wb-kopf"><h3 id="wb-meldung">Kritischen Wert melden</h3><span className="muted wb-klein">{sz.titel}</span></div>
      <div className="wb-telefon" aria-live="polite">
        <span className="wb-telefon__symbol" aria-hidden="true">☎</span>
        <p>{sz.anruf}</p>
      </div>
      <p className="muted wb-klein">{sz.patient}</p>

      {schritt === 'anruf' && (
        <div className="wb-optionen">
          {sz.notizen.map((n, k) => (
            <button key={n.text} type="button" disabled={notiz !== undefined} className={notiz !== undefined ? (n.richtig ? 'is-richtig' : k === notiz ? 'is-falsch' : '') : ''} onClick={() => { setNotiz(k); if (n.richtig) setPunkte((p) => p + 1); }}>
              {n.text}{notiz !== undefined && (n.richtig || k === notiz) && <span className="wb-warum">{n.warum}</span>}
            </button>
          ))}
          {notiz !== undefined && <button type="button" className="primary" onClick={() => setSchritt('doku')}>Weiter: dokumentieren</button>}
        </div>
      )}

      {schritt === 'doku' && (
        <div className="wb-feld">
          <p>Was gehört in die Telefonnotiz? Wähle alles Nötige.</p>
          <div className="wb-checks">
            {DOKU_FELDER.map((f) => (
              <label key={f.id} className={`wb-check ${dokuGeprueft ? (f.noetig ? 'is-richtig' : doku.includes(f.id) ? 'is-falsch' : '') : ''}`}>
                <input type="checkbox" disabled={dokuGeprueft} checked={doku.includes(f.id)} onChange={(e) => setDoku((d) => (e.target.checked ? [...d, f.id] : d.filter((x) => x !== f.id)))} /> {f.text}
              </label>
            ))}
          </div>
          {!dokuGeprueft ? <button type="button" onClick={() => { setDokuGeprueft(true); const ok = DOKU_FELDER.every((f) => f.noetig === doku.includes(f.id)); if (ok) setPunkte((p) => p + 1); }}>Prüfen</button>
            : <><p className="wb-klein">Pflicht: Uhrzeit, Anrufer, Patient mit Geburtsdatum, zurückgelesener Wert mit Einheit, wem und wann weitergegeben.</p><button type="button" className="primary" onClick={() => setSchritt('sbar')}>Weiter: ärztlich melden</button></>}
        </div>
      )}

      {schritt === 'sbar' && (
        <div className="wb-feld">
          <p>Baue deine Meldung: Tippe die Sätze in der Reihenfolge an, in der du sie sagst. Unwichtiges weglassen.</p>
          <div className="wb-optionen">
            {bausteine.map((b) => (
              <button key={b.id} type="button" disabled={sbarGeprueft} aria-pressed={sbar.includes(b.id)} onClick={() => setSbar((s) => (s.includes(b.id) ? s.filter((x) => x !== b.id) : [...s, b.id]))}>
                {sbar.includes(b.id) && <span className="wb-nr" aria-hidden="true">{sbar.indexOf(b.id) + 1}</span>} {b.text}
              </button>
            ))}
          </div>
          {sbar.length > 0 && (
            <ol className="wb-sbar" aria-label="Deine Meldung">
              {sbar.map((id) => { const b = sz.bausteine.find((x) => x.id === id)!; return <li key={id} className={sbarGeprueft ? (b.teil === 'x' ? 'is-falsch' : '') : ''}><span className="wb-sbar__teil">{sbarGeprueft ? (b.teil === 'x' ? '–' : b.teil) : '?'}</span> {b.text}</li>; })}
            </ol>
          )}
          {!sbarGeprueft ? <button type="button" disabled={!sbar.length} onClick={() => { setSbarGeprueft(true); const w = bewerteSbar(sz, sbar); if (w.punkte === w.max) setPunkte((p) => p + 1); }}>Meldung prüfen</button>
            : <>
              <p className={sbarWertung!.punkte === sbarWertung!.max ? 'wb-gut' : 'wb-hinweis'}>{sbarWertung!.punkte} von {sbarWertung!.max} Punkten. {sbarWertung!.hinweise.join(' ')}</p>
              <button type="button" className="primary" onClick={() => setSchritt('bisdahin')}>Weiter</button>
            </>}
        </div>
      )}

      {schritt === 'bisdahin' && (
        <div className="wb-feld">
          <p>Die Ärztin kommt in etwa zehn Minuten. Was tust du bis dahin?</p>
          <div className="wb-optionen">
            {sz.bisDahin.map((o, k) => ({ o, k })).sort((a, b) => (a.o.text.length % 2) - (b.o.text.length % 2)).map(({ o, k }) => (
              <button key={o.text} type="button" disabled={bis !== undefined} className={bis !== undefined ? (o.richtig ? 'is-richtig' : k === bis ? 'is-falsch' : '') : ''} onClick={() => { setBis(k); if (o.richtig) setPunkte((p) => p + 1); }}>
                {o.text}{bis !== undefined && (o.richtig || k === bis) && <span className="wb-warum">{o.warum}</span>}
              </button>
            ))}
          </div>
          {bis !== undefined && <button type="button" className="primary" onClick={() => {
            setSchritt('fertig');
            void bucheWerkbank({ station: 'meldung', szenario: sz.id, lauf: laufId, topicId: werkbankThema('meldung'), punkte, max: 4, kriterien: [] }).then(setBuchung);
          }}>Abschließen</button>}
        </div>
      )}

      {schritt === 'fertig' && (
        <div className="wb-feld">
          <p className="wb-punkte"><strong>{punkte} von 4</strong> Schritten sicher gelöst.</p>
          {buchung && <p className="muted wb-klein">Lernplan (Übergabe und SBAR): {buchung}</p>}
          <p className="muted wb-klein">Merksatz: Zurücklesen, dokumentieren, sofort per SBAR melden, Weitergabe dokumentieren, bis zur ärztlichen Entscheidung beim Patienten bleiben.</p>
          <button type="button" className="primary" onClick={weiter}>Nächster Anruf</button>
        </div>
      )}
    </section>
  );
}
