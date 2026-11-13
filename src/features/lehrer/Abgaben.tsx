import { useMemo, useState } from 'react';
import { navigate } from '../../ui/shell/router';
import { alleAbgaben, eigeneFaelle, loescheAbgaben } from '../klasse/speicher';
import { datumText } from '../klasse/teilen';
import type { Abgabe, KlassenFall } from '../klasse/typen';
import { bewertungenZu, klassenVonFall, nimmInListeAuf, ordneAbgabeZu } from './speicher';
import { AbgabenEinlesen, Seite, StatusMarke } from './teile';
import { nameSchluessel, type Klasse } from './typen';
import { status } from './uebersicht';

interface Fremd { fall: KlassenFall; abgabe: Abgabe; klassen: Klasse[] }

/** Zuordnen: Name aus der Abgabe steht in keiner Liste der Klassen dieses Falls. */
function Zuordnen({ x, fertig }: { x: Fremd; fertig: () => void }) {
  const kandidaten = [...new Set(x.klassen.flatMap((k) => k.lernende))].sort((a, b) => a.localeCompare(b, 'de'));
  const [ziel, setZiel] = useState('');
  return (
    <li>
      <span><strong>{x.abgabe.name}</strong> <span className="muted">· {x.fall.titel}</span></span>
      <span className="row lehrer__zuordnen">
        <label className="visually-hidden" htmlFor={`z-${x.fall.id}-${x.abgabe.name}`}>Gehört zu</label>
        <select id={`z-${x.fall.id}-${x.abgabe.name}`} value={ziel} onChange={(e) => setZiel(e.target.value)}>
          <option value="">gehört zu …</option>
          {kandidaten.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <button type="button" className="small" disabled={!ziel} onClick={() => { ordneAbgabeZu(x.fall.id, x.abgabe.name, ziel); fertig(); }}>Zuordnen</button>
        {x.klassen.length === 1 && <button type="button" className="small ghost" onClick={() => { nimmInListeAuf(x.klassen[0]!.id, x.abgabe.name); fertig(); }}>In Liste aufnehmen</button>}
      </span>
    </li>
  );
}

export default function Abgaben() {
  const [stand, setStand] = useState(0);
  const neu = () => setStand((n) => n + 1);

  const d = useMemo(() => {
    void stand;
    const jetzt = new Date();
    const faelle = eigeneFaelle();
    const nachId = new Map(faelle.map((f) => [f.id, f]));
    const alle = alleAbgaben();
    const unbekannt: { fallId: string; titel: string; anzahl: number }[] = [];
    const zuBewerten: { fall: KlassenFall; abgabe: Abgabe; s: ReturnType<typeof status> }[] = [];
    const fremd: Fremd[] = [];
    for (const [fallId, liste] of Object.entries(alle)) {
      if (!liste.length) continue;
      const fall = nachId.get(fallId);
      if (!fall) { unbekannt.push({ fallId, titel: liste[0]!.titel || 'ohne Titel', anzahl: liste.length }); continue; }
      const bw = bewertungenZu(fallId);
      const ks = klassenVonFall(fallId).filter((k) => k.lernende.length);
      const bekannt = new Set(ks.flatMap((k) => k.lernende.map(nameSchluessel)));
      for (const a of liste) {
        const s = status(fall, a, bw[nameSchluessel(a.name)], jetzt);
        if (s === 'abgegeben' || s === 'verspaetet' || s === 'neu') zuBewerten.push({ fall, abgabe: a, s });
        if (ks.length && !bekannt.has(nameSchluessel(a.name))) fremd.push({ fall, abgabe: a, klassen: ks });
      }
    }
    zuBewerten.sort((a, b) => b.abgabe.abgegeben.localeCompare(a.abgabe.abgegeben));
    return { unbekannt, zuBewerten, fremd };
  }, [stand]);

  return (
    <Seite titel="Abgaben" intro="Posteingang für alle Fälle: Abgaben einlesen, Namen zuordnen und sehen, was noch bewertet werden muss.">
      <div className="card">
        <h2 className="lehrer__h">Einlesen</h2>
        <AbgabenEinlesen fertig={neu} />
        <p className="muted">Tipp: Öffnet jemand die Abgabe als Link auf deinem Gerät oder du scannst den QR-Code der Abgabe, wird sie direkt eingelesen.</p>
      </div>

      {d.fremd.length > 0 && (
        <div className="card">
          <h2 className="lehrer__h">Namen zuordnen</h2>
          <p className="muted">Diese Namen stehen in keiner Klassenliste des Falls, zum Beispiel wegen eines Tippfehlers oder eines Kürzels. Zuordnen überträgt die Abgabe (und eine Bewertung) auf den Namen aus der Liste.</p>
          <ul className="klasse__liste">
            {d.fremd.map((x) => <Zuordnen key={`${x.fall.id}-${x.abgabe.name}`} x={x} fertig={neu} />)}
          </ul>
        </div>
      )}

      <div className="card">
        <h2 className="lehrer__h">Noch zu bewerten</h2>
        {!d.zuBewerten.length
          ? <p className="muted">Keine unbewerteten Abgaben.</p>
          : (
            <ul className="klasse__liste">
              {d.zuBewerten.map(({ fall, abgabe, s }) => (
                <li key={`${fall.id}-${abgabe.name}`}>
                  <button type="button" className="link" onClick={() => navigate(`/lehren/bewerten?fall=${fall.id}&name=${encodeURIComponent(abgabe.name)}`)}>{abgabe.name}</button>
                  <span className="muted">{fall.titel} · {datumText(abgabe.abgegeben)}</span>
                  <StatusMarke status={s} kurz />
                </li>
              ))}
            </ul>
          )}
      </div>

      {d.unbekannt.length > 0 && (
        <div className="card">
          <h2 className="lehrer__h">Abgaben ohne Fall auf diesem Gerät</h2>
          <p className="muted">Der Fall wurde auf einem anderen Gerät oder von einer anderen Lehrkraft verteilt. Öffne dort „Mehr“ → „Lehrkraft-Link kopieren“ und den Link hier, dann erscheinen die Abgaben beim Fall.</p>
          <ul className="klasse__liste">
            {d.unbekannt.map((u) => (
              <li key={u.fallId}>
                <span><strong>{u.titel}</strong> <span className="muted">· {u.anzahl} Abgabe{u.anzahl === 1 ? '' : 'n'}</span></span>
                <button type="button" className="ghost small" onClick={() => { if (confirm(`${u.anzahl} Abgaben zu „${u.titel}“ löschen?`)) { loescheAbgaben(u.fallId); neu(); } }}>Löschen</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Seite>
  );
}
