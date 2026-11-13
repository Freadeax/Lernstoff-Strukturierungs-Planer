import { useMemo, useState } from 'react';
import { notify } from '../../ui/shell/notifications';
import { download } from '../../ui/widget/export';
import { RAEUME, type RaumId } from '../../ui/sim/raeume/katalog';
import { PERSONEN } from '../../ui/sim/personen';
import { HANDLUNGSVIDEOS, type HandlungsVideoId } from '../../ui/sim/handlungsvideos';
import { TITELBILDER } from '../../ui/Titelbild';
import type { BildFreigabe } from './freigaben';
import { PRUEFPUNKTE, pruefEinheiten, type AssetArt, type PruefEinheit } from './inventar';
import { erstelleExport, heute, leseLokal, leseVon, speichereLokal, speichereVon } from './pruefung';
import './bildpruefung.css';

const ART_LABEL: Record<AssetArt, string> = { raum: 'Räume', portraet: 'Porträts', handlungsvideo: 'Videos', bildgebung: 'Bildgebung', titelbild: 'Titelbilder' };
type Filter = 'alle' | 'offen' | 'freigegeben' | 'mangel';
const FILTER_LABEL: Record<Filter, string> = { alle: 'Alle', offen: 'Offen', freigegeben: 'Freigegeben', mangel: 'Mangel' };
const SIM_LABEL: Record<string, string> = { praxis: 'Praxis', fall: 'Fall', diagnostik: 'Diagnostik', notfall: 'Notfall', hygiene: 'Hygiene', bereich: 'Bereich' };

const url = (datei: string) => `${import.meta.env.BASE_URL}${datei}`;

function titelVon(e: PruefEinheit): { titel: string; alt: string } {
  if (e.art === 'raum') { const r = RAEUME[e.asset as RaumId]; return { titel: r.titel, alt: r.beschreibung }; }
  if (e.art === 'portraet') { const [id, z] = e.asset.split(':'); const p = PERSONEN[id!]; return { titel: `${p?.name ?? id}, ${z}`, alt: p?.beschreibung ?? '' }; }
  if (e.art === 'handlungsvideo') { const v = HANDLUNGSVIDEOS[e.asset as HandlungsVideoId]; return { titel: v.titel, alt: `Phase 1: ${v.schritte[0].titel}` }; }
  if (e.art === 'titelbild') { const t = TITELBILDER[e.asset as keyof typeof TITELBILDER]; return { titel: `Titelbild ${e.asset}`, alt: t.alt }; }
  return { titel: `Bildserie ${e.asset}`, alt: `Bild aus der Serie ${e.asset}` };
}

const verwendungText = (w: string) => { const [sim, rest] = w.split(':'); return `${SIM_LABEL[sim!] ?? sim} · ${rest}`; };

function Karte({ e, lokal, von, setzen }: { e: PruefEinheit; lokal?: BildFreigabe; von: string; setzen: (f: BildFreigabe | null) => void }) {
  const f = lokal ?? e.freigabe;
  const [offen, setOffen] = useState(false);
  const [punkte, setPunkte] = useState<string[]>(f?.pruefpunkte ?? []);
  const [hinweis, setHinweis] = useState(f?.hinweis ?? '');
  const { titel, alt } = titelVon(e);
  const pp = PRUEFPUNKTE[e.art];
  const alleAbgehakt = pp.every((p) => punkte.includes(p.id));
  const status = f?.status ?? 'offen';
  const idBasis = `bp-${e.schluessel.replace(/[^a-z0-9]/gi, '-')}`;
  const ohneVon = !von.trim();
  return (
    <li className={`bildpruefung__karte is-${status}`}>
      <div className="bildpruefung__bild">
        {e.video
          ? <video src={url(e.video)} poster={url(e.vorschau)} controls muted playsInline preload="none" aria-label={`${titel}, Video`} />
          : <img src={url(e.vorschau)} alt={alt} loading="lazy" decoding="async" />}
      </div>
      <div className="bildpruefung__text">
        <h3>{titel}</h3>
        <p className="bildpruefung__status">
          <span className={`badge bildpruefung__badge is-${status}`}>{status === 'offen' ? 'Offen' : status === 'freigegeben' ? 'Freigegeben' : 'Mangel'}</span>
          {f && <span className="muted"> {f.am}, {f.von}{lokal ? ' (noch nicht exportiert)' : ''}</span>}
        </p>
        {f?.status === 'mangel' && f.hinweis && <p className="bildpruefung__hinweis">{f.hinweis}</p>}
        <p className="muted bildpruefung__klein"><code>{e.schluessel}</code>{e.dateien.length > 1 ? ` (${e.dateien.length} Dateien)` : ''}</p>
        <p className="bildpruefung__klein">{e.verwendung.length ? <>Erscheint in: {e.verwendung.map(verwendungText).join(', ')}</> : <strong>In keinem Fall eingebunden</strong>}</p>
        <p className="muted bildpruefung__klein">Lizenz: {e.lizenz}</p>
        <div className="bildpruefung__aktionen">
          <button type="button" aria-expanded={offen} aria-controls={idBasis} onClick={() => setOffen((o) => !o)}>{offen ? 'Prüfung schließen' : 'Prüfen'}</button>
          {!e.video && <a href={url(e.vorschau)} target="_blank" rel="noopener">Groß ansehen</a>}
        </div>
        {offen && (
          <fieldset id={idBasis} className="bildpruefung__pruefung">
            <legend>Prüfpunkte</legend>
            {pp.map((p) => (
              <label key={p.id} className="check">
                <input type="checkbox" checked={punkte.includes(p.id)} onChange={(ev) => setPunkte((l) => (ev.target.checked ? [...l, p.id] : l.filter((x) => x !== p.id)))} />
                <span>{p.text}</span>
              </label>
            ))}
            <label className="bildpruefung__feld">Hinweis (bei Mangel Pflicht)
              <textarea rows={2} value={hinweis} maxLength={500} onChange={(ev) => setHinweis(ev.target.value)} placeholder="z. B. Fingerclip sitzt am Handrücken" />
            </label>
            {ohneVon && <p className="field-error">Oben eintragen, wer prüft.</p>}
            <div className="bildpruefung__aktionen">
              <button type="button" className="primary" disabled={!alleAbgehakt || ohneVon}
                onClick={() => { setzen({ status: 'freigegeben', am: heute(), von: von.trim(), pruefpunkte: punkte, ...(hinweis.trim() ? { hinweis: hinweis.trim() } : {}) }); setOffen(false); }}>
                Freigeben
              </button>
              <button type="button" disabled={!hinweis.trim() || ohneVon}
                onClick={() => { setzen({ status: 'mangel', am: heute(), von: von.trim(), pruefpunkte: punkte, hinweis: hinweis.trim() }); setOffen(false); }}>
                Mangel melden
              </button>
              {lokal && <button type="button" onClick={() => { setzen(null); setPunkte([]); setHinweis(''); }}>Zurücksetzen</button>}
            </div>
            {!alleAbgehakt && <p className="muted bildpruefung__klein">Freigeben geht, wenn alle Punkte abgehakt sind.</p>}
          </fieldset>
        )}
      </div>
    </li>
  );
}

export default function Bildpruefung() {
  const einheiten = useMemo(() => pruefEinheiten(), []);
  const [lokal, setLokal] = useState(leseLokal);
  const [von, setVon] = useState(leseVon);
  const [filter, setFilter] = useState<Filter>('offen');
  const [art, setArt] = useState<AssetArt | 'alle'>('alle');

  const statusVon = (e: PruefEinheit) => (lokal[e.schluessel] ?? e.freigabe)?.status ?? 'offen';
  const zaehler = { freigegeben: 0, mangel: 0, offen: 0 };
  for (const e of einheiten) zaehler[statusVon(e)]++;
  const sichtbar = einheiten.filter((e) => (art === 'alle' || e.art === art) && (filter === 'alle' || statusVon(e) === filter));
  const neu = Object.keys(lokal).length;

  function setzen(schluessel: string, f: BildFreigabe | null) {
    const next = { ...lokal };
    if (f) next[schluessel] = f; else delete next[schluessel];
    setLokal(next);
    if (!speichereLokal(next)) notify('warning', 'Nicht gespeichert', 'Der Browser lässt keinen Speicher zu. Bitte gleich exportieren.');
  }
  function exportieren() {
    download(`bildpruefung-${heute()}.json`, JSON.stringify(erstelleExport(lokal), null, 2), 'application/json');
    notify('info', 'Prüfergebnis exportiert', 'Die Datei liegt in deinen Downloads. Gib sie Claude, dann gilt die Prüfung für alle Geräte.');
  }

  return (
    <section className="page bildpruefung">
      <div className="page__head">
        <h2>Bildprüfung</h2>
        <p className="muted">Jedes Bild, Video und jede Bildserie der Simulatoren fachlich prüfen, bevor es im Unterricht genutzt wird. Ergebnisse bleiben auf diesem Gerät, bis du sie exportierst.</p>
      </div>
      <div className="card bildpruefung__kopf">
        <p className="bildpruefung__zahlen" aria-live="polite">
          <strong>{zaehler.freigegeben}</strong> freigegeben · <strong>{zaehler.mangel}</strong> mit Mangel · <strong>{zaehler.offen}</strong> offen, von {einheiten.length} Prüfeinheiten
        </p>
        <label className="bildpruefung__feld">Wer prüft (Rolle reicht)
          <input value={von} maxLength={80} placeholder="z. B. Praxisanleitung" onChange={(ev) => { setVon(ev.target.value); speichereVon(ev.target.value); }} />
        </label>
        <div className="bildpruefung__aktionen">
          <button type="button" className="primary" disabled={!neu} onClick={exportieren}>Prüfergebnis exportieren{neu ? ` (${neu})` : ''}</button>
        </div>
        <p className="muted bildpruefung__klein">Claude übernimmt die Datei mit <code>npm run assets:freigaben</code>. Mängel landen in der Bestellliste für die nächste Materiallieferung.</p>
      </div>
      <div className="pills" role="radiogroup" aria-label="Nach Status filtern">
        {(Object.keys(FILTER_LABEL) as Filter[]).map((k) => (
          <button key={k} type="button" className="pill" role="radio" aria-checked={filter === k} onClick={() => setFilter(k)}>{FILTER_LABEL[k]}</button>
        ))}
      </div>
      <div className="pills" role="radiogroup" aria-label="Nach Art filtern">
        <button type="button" className="pill" role="radio" aria-checked={art === 'alle'} onClick={() => setArt('alle')}>Alle Arten</button>
        {(Object.keys(ART_LABEL) as AssetArt[]).map((k) => (
          <button key={k} type="button" className="pill" role="radio" aria-checked={art === k} onClick={() => setArt(k)}>{ART_LABEL[k]}</button>
        ))}
      </div>
      {sichtbar.length
        ? <ul className="bildpruefung__liste">{sichtbar.map((e) => <Karte key={e.schluessel} e={e} lokal={lokal[e.schluessel]} von={von} setzen={(f) => setzen(e.schluessel, f)} />)}</ul>
        : <p className="muted">Keine Einträge für diesen Filter.</p>}
    </section>
  );
}
