// Klassen-Radar im Lehrermodus (#/lehren/radar): freiwillig geschickte Radar-Codes einlesen und daraus
// den Stand der Klasse je Kompetenzbereich und die häufigsten Lücken zeigen. Alles bleibt auf diesem Gerät.
import { useMemo, useState } from 'react';
import { DatenHinweis } from '../../ui/DatenHinweis';
import { storage } from '../../ui/lib/store';
import { notify } from '../../ui/shell/notifications';
import { entpacke } from '../klasse/kodierung';
import { KompetenzRadar } from '../fortschritt/KompetenzRadar';
import { codesImText, fuegeEin, klassenRadar, pruefeRadarStand, standSchluessel, type RadarStand } from '../fortschritt/radarcode';
import { radarStaende, RADAR_OHNE_NAMEN as OHNE_NAMEN, speichereRadar } from './speicher';
import '../fortschritt/fortschritt.css';
import { Seite } from './teile';

const datum = (iso: string) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) : 'ohne Datum');

export default function KlassenRadar() {
  const [staende, setStaende] = useState<RadarStand[]>(radarStaende);
  const [eingabe, setEingabe] = useState('');
  const [ohneNamen, setOhneNamen] = useState(() => storage.read<boolean>(OHNE_NAMEN, false));
  const [arbeitet, setArbeitet] = useState(false);
  const klasse = useMemo(() => klassenRadar(staende), [staende]);

  const speichere = (liste: RadarStand[]) => { setStaende(liste); speichereRadar(liste); };

  async function einlesen() {
    const codes = codesImText(eingabe);
    if (!codes.length) { notify('warning', 'Kein Code gefunden', 'Füge die Nachricht mit dem Radar-Code ein. Ein Code beginnt mit z oder j.'); return; }
    setArbeitet(true);
    const gueltig: RadarStand[] = [];
    let fehler = 0;
    for (const c of codes) {
      try { const s = pruefeRadarStand(await entpacke(c)); if (s) gueltig.push(s); else fehler++; } catch { fehler++; }
    }
    setArbeitet(false);
    const r = fuegeEin(staende, gueltig);
    speichere(r.liste);
    setEingabe('');
    const teile = [`${r.neu} neu`, r.ersetzt ? `${r.ersetzt} aktualisiert` : '', fehler ? `${fehler} kein Radar-Code` : ''].filter(Boolean);
    notify(fehler && !gueltig.length ? 'warning' : 'info', 'Codes eingelesen', teile.join(' · '));
  }

  const entferne = (s: RadarStand) => speichere(staende.filter((x) => standSchluessel(x) !== standSchluessel(s)));
  const alleLoeschen = () => speichere([]);
  const achsen = klasse.achsen.map((a) => ({ id: a.code, code: a.code, name: a.name, themen: 1, jetzt: a.mittel }));

  return (
    <Seite titel="Klassen-Radar" intro="Lernende können ihren Stand je Kompetenzbereich freiwillig als Code schicken (Fortschritt → Kompetenz-Radar). Hier siehst du daraus den Stand der Klasse und die Themen, bei denen sich viele unsicher sind.">
      <div className="lehrer__raster">
        <div className="card stack-2">
          <h2 className="lehrer__h">Codes einlesen</h2>
          <label className="field">
            <span>Nachrichten mit Radar-Codes einfügen, auch mehrere auf einmal</span>
            <textarea rows={4} value={eingabe} onChange={(e) => setEingabe(e.target.value)} />
          </label>
          <div className="row">
            <button type="button" className="primary" onClick={() => void einlesen()} disabled={arbeitet || !eingabe.trim()}>{arbeitet ? 'Liest ein …' : 'Einlesen'}</button>
          </div>
          <DatenHinweis art="lehrer" fiktiv={false} detail="Ein Radar-Code enthält den freiwillig angegebenen Namen, den Stand je Kompetenzbereich und bis zu acht unsichere Themen, keine Antworten und keine Lernzeiten." />
        </div>

        <div className="card stack-2">
          <div className="klasse__kopf">
            <h2 className="lehrer__h">Stand der Klasse</h2>
            <label className="row"><input type="checkbox" checked={ohneNamen} onChange={(e) => { setOhneNamen(e.target.checked); storage.write(OHNE_NAMEN, e.target.checked); }} /> Namen ausblenden</label>
          </div>
          {!klasse.n
            ? <p className="muted">Noch keine Codes eingelesen.</p>
            : (
              <>
                <p className="muted">{klasse.n} {klasse.n === 1 ? 'Stand' : 'Stände'}. Fläche = Mittel der Klasse; Stärke wie im eigenen Radar (sicher voll, unsicher halb, Selbsteinschätzung nie).</p>
                <div className="fs-radar-inhalt">
                  <KompetenzRadar achsen={achsen} />
                  <table className="fs-radar-tabelle">
                    <caption className="visually-hidden">Stand der Klasse je Kompetenzbereich</caption>
                    <thead><tr><th scope="col">Bereich</th><th scope="col">Mittel</th><th scope="col">Spanne</th></tr></thead>
                    <tbody>
                      {klasse.achsen.map((a) => (
                        <tr key={a.code}><th scope="row"><span className="fs-code">{a.code}</span> {a.name}</th><td>{a.mittel} %</td><td>{a.min}–{a.max} %</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
        </div>

        {klasse.n > 0 && (
          <div className="card stack-2">
            <h2 className="lehrer__h">Häufigste Lücken</h2>
            {!klasse.luecken.length
              ? <p className="muted">Niemand hat unsichere Themen mitgeschickt.</p>
              : (
                <ol className="klasse__liste">
                  {klasse.luecken.map((l) => (
                    <li key={l.id}><span>{l.name}</span><span className="muted">{l.anzahl} von {klasse.n}</span></li>
                  ))}
                </ol>
              )}
            <p className="muted">Unsicher heißt: schon geübt, aber noch nicht sicher abgerufen. Passende Fälle verteilst du unter <a href="#/lehren/aufgaben?vorlage=1">Fälle und Aufgaben</a>.</p>
          </div>
        )}

        {klasse.n > 0 && (
          <div className="card stack-2">
            <h2 className="lehrer__h">Eingelesene Stände</h2>
            <ul className="klasse__liste">
              {staende.map((s, i) => (
                <li key={standSchluessel(s)}>
                  <span>{ohneNamen || !s.name ? `Person ${i + 1}` : s.name}</span>
                  <span className="muted">{datum(s.datum)}</span>
                  <button type="button" className="ghost small" onClick={() => entferne(s)} aria-label={`Stand ${ohneNamen || !s.name ? `Person ${i + 1}` : s.name} entfernen`}>Entfernen</button>
                </li>
              ))}
            </ul>
            <div className="row"><button type="button" className="ghost small" onClick={alleLoeschen}>Alle Stände löschen</button></div>
          </div>
        )}
      </div>
    </Seite>
  );
}
