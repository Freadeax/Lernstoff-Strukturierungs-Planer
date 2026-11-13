import { useState } from 'react';
import { RaumBuehne, type Hotspot } from '../../ui/sim/raeume/RaumBuehne';
import { RAEUME } from '../../ui/sim/raeume/katalog';
import { SUCHBILDER } from './suchbilder';

/** Suchbilder unter dem Hygiene-Trainer: Fundstellen im Raumfoto antippen, Erklärung erscheint daneben. */
export function Suchbilder() {
  const [aktiv, setAktiv] = useState(SUCHBILDER[0]!.id);
  const [gefunden, setGefunden] = useState<Record<string, string[]>>({});
  const [offen, setOffen] = useState<string | null>(null);
  const bild = SUCHBILDER.find((s) => s.id === aktiv)!;
  const raum = RAEUME[bild.raum];
  const funde = gefunden[bild.id] ?? [];
  const fund = bild.funde.find((f) => f.id === offen);
  const hotspots: Hotspot[] = bild.funde.flatMap((f, i) => {
    const h = raum.hotspots.find((x) => x.id === f.id);
    return h ? [{ id: f.id, label: f.titel, kurz: String(i + 1), x: h.x, y: h.y, gedrueckt: offen === f.id, aktiv: !funde.includes(f.id),
      onClick: () => { setOffen(f.id); setGefunden((g) => ({ ...g, [bild.id]: [...new Set([...(g[bild.id] ?? []), f.id])] })); } }] : [];
  });
  return (
    <section className="page hygiene-suchbild" aria-labelledby="hygiene-suchbild-titel">
      <div className="page__head">
        <h2 id="hygiene-suchbild-titel">Suchbilder</h2>
        <p className="muted">Hygiene im Raum erkennen: Stellen im Foto antippen. KI-generierte Szene, fachlich ungeprüftes Lernmodell, es gilt der Hygieneplan deiner Einrichtung.</p>
      </div>
      <div className="pills" role="radiogroup" aria-label="Suchbild wählen">
        {SUCHBILDER.map((s) => (
          <button key={s.id} type="button" className="pill" role="radio" aria-checked={aktiv === s.id} onClick={() => { setAktiv(s.id); setOffen(null); }}>{s.titel}</button>
        ))}
      </div>
      <p>{bild.auftrag} <strong aria-live="polite">{funde.length} von {bild.funde.length} gefunden.</strong></p>
      <RaumBuehne raum={bild.raum} hotspots={hotspots} />
      <div className="card hygiene-suchbild__fund" aria-live="polite">
        {fund ? <><h3>{fund.titel}</h3><p>{fund.text}</p></> : <p className="muted">Tippe eine Nummer im Bild an.</p>}
      </div>
    </section>
  );
}
