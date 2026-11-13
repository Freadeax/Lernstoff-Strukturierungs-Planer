import { useState } from 'react';
import { DatenHinweis } from '../../ui/DatenHinweis';
import { navigate } from '../../ui/shell/router';
import { notify } from '../../ui/shell/notifications';
import { NOTE_TEXT, ordneSchluessel, STANDARD_SCHLUESSEL } from './noten';
import { bausteine, datenbestand, loescheAllesLehrer, notenschluessel, speichereBausteine, speichereSchluessel, STANDARD_BAUSTEINE } from './speicher';
import { Seite } from './teile';
import type { Notenstufe } from './typen';

function Schluessel() {
  const [stufen, setStufen] = useState<Notenstufe[]>(notenschluessel);
  const setze = (i: number, s: Partial<Notenstufe>) => setStufen((xs) => xs.map((x, j) => (j === i ? { ...x, ...s } : x)));
  function speichern() {
    const sauber = ordneSchluessel(stufen);
    speichereSchluessel(sauber);
    setStufen(sauber);
    notify('info', 'Notenschlüssel gespeichert');
  }
  return (
    <div className="card">
      <h2 className="lehrer__h">Notenschlüssel</h2>
      <p className="muted">Ab wie viel Prozent der Punkte gibt es welche Note? Voreingestellt ist das verbreitete Kammer-Raster. Nimm hier das Raster deiner Schule. Noten können auch Punkte (15–0) oder „bestanden“ sein.</p>
      <table className="lehrer__schluessel">
        <thead><tr><th scope="col">Note</th><th scope="col">ab Prozent</th><th scope="col"><span className="visually-hidden">Entfernen</span></th></tr></thead>
        <tbody>
          {stufen.map((s, i) => (
            <tr key={i}>
              <td><input aria-label={`Note ${i + 1}`} value={s.note} onChange={(e) => setze(i, { note: e.target.value })} /></td>
              <td><input aria-label={`ab Prozent für Note ${s.note}`} type="number" inputMode="decimal" min={0} max={100} step={0.5} value={s.ab} disabled={i === stufen.length - 1} onChange={(e) => setze(i, { ab: Number(e.target.value) })} /></td>
              <td><button type="button" className="ghost small" disabled={stufen.length <= 2} onClick={() => setStufen((xs) => xs.filter((_, j) => j !== i))}>Entfernen</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">Die letzte Stufe gilt immer ab 0 %. {stufen.map((s) => NOTE_TEXT[s.note] ? `${s.note} = ${NOTE_TEXT[s.note]}` : '').filter(Boolean).join(', ')}</p>
      <div className="row klasse__knoepfe">
        <button type="button" className="primary" onClick={speichern}>Speichern</button>
        <button type="button" className="small" onClick={() => setStufen((xs) => [...xs.slice(0, -1), { note: '', ab: Math.max(0, (xs[xs.length - 2]?.ab ?? 50) - 10) }, xs[xs.length - 1]!])}>+ Stufe</button>
        <button type="button" className="ghost small" onClick={() => { speichereSchluessel(null); setStufen(STANDARD_SCHLUESSEL); }}>Zurücksetzen</button>
      </div>
    </div>
  );
}

function Bausteine() {
  const [text, setText] = useState(() => bausteine().join('\n'));
  return (
    <div className="card">
      <h2 className="lehrer__h">Kommentar-Bausteine</h2>
      <p className="muted">Sätze, die du beim Bewerten oft schreibst. Ein Tippen fügt sie in den Kommentar ein. Ein Baustein je Zeile.</p>
      <label className="field"><span>Bausteine</span><textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <div className="row klasse__knoepfe">
        <button type="button" className="primary" onClick={() => { speichereBausteine(text.split('\n')); notify('info', 'Bausteine gespeichert'); }}>Speichern</button>
        <button type="button" className="ghost small" onClick={() => { speichereBausteine(null); setText(STANDARD_BAUSTEINE.join('\n')); }}>Zurücksetzen</button>
      </div>
    </div>
  );
}

function Datenschutz() {
  const [d, setD] = useState(datenbestand);
  function allesLoeschen() {
    if (!confirm(`Wirklich alles aus dem Lehrermodus löschen? ${d.klassen} Klassen, ${d.faelle} verteilte Fälle, ${d.abgaben} Abgaben und ${d.bewertungen} Bewertungen. Das lässt sich nicht rückgängig machen.`)) return;
    loescheAllesLehrer();
    setD(datenbestand());
    notify('info', 'Lehrermodus geleert');
  }
  return (
    <div className="card">
      <h2 className="lehrer__h">Datenschutz</h2>
      <DatenHinweis art="lehrer" fiktiv={false} />
      <dl className="lehrer__bestand">
        <div><dt>Klassen</dt><dd>{d.klassen}</dd></div>
        <div><dt>Namen in Listen</dt><dd>{d.lernende}</dd></div>
        <div><dt>Verteilte Fälle</dt><dd>{d.faelle}</dd></div>
        <div><dt>Abgaben</dt><dd>{d.abgaben}</dd></div>
        <div><dt>Bewertungen</dt><dd>{d.bewertungen}</dd></div>
      </dl>
      <p className="muted">Zum Aufbewahren die Klassenübersicht oder die Abgaben als Tabelle (CSV) sichern, danach hier oder je Fall löschen. Auf ein anderes Gerät kommt alles über die <button type="button" className="link" onClick={() => navigate('/system/sicherung')}>Datensicherung</button>.</p>
      <button type="button" className="danger small" disabled={!d.klassen && !d.faelle && !d.abgaben} onClick={allesLoeschen}>Alles aus dem Lehrermodus löschen</button>
    </div>
  );
}

export default function Einstellungen() {
  return (
    <Seite titel="Einstellungen" intro="Notenschlüssel, Kommentar-Bausteine und was an personenbezogenen Daten auf diesem Gerät liegt.">
      <div className="lehrer__raster">
        <Schluessel />
        <Bausteine />
        <Datenschutz />
      </div>
    </Seite>
  );
}
