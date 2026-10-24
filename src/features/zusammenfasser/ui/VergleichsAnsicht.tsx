// Vergleichsmatrix Unterthema × Quelle mit Einordnung, Aussagen je Quelle und Belegen per Tippen.
import { useState } from 'react';
import type { SourceChunk } from '../../../core/types';
import { belegStelle } from '../belege';
import type { VergleichsArt, VergleichsErgebnis } from '../typen';
import { Belegstelle } from './Belegstelle';

const ART: Record<VergleichsArt, string> = {
  uebereinstimmend: 'stimmt überein', ergaenzend: 'ergänzend', abweichend: 'weicht ab', widerspruechlich: 'Widerspruch', definition_unterschiedlich: 'Definition unterschiedlich',
};

export function VergleichsAnsicht({ ergebnis, chunkMap, titles }: { ergebnis: VergleichsErgebnis; chunkMap: Map<string, SourceChunk>; titles: Map<string, string> }) {
  const [offen, setOffen] = useState<{ zeile: number; doc: string } | null>(null);
  const docs = ergebnis.sourceDocumentIds;
  const fehltIn = docs.map((d) => ({ d, themen: ergebnis.zeilen.filter((z) => !z.jeQuelle.find((q) => q.documentId === d)?.aussage).map((z) => z.unterthema) }));
  const auswahl = offen ? ergebnis.zeilen[offen.zeile]?.jeQuelle.find((q) => q.documentId === offen.doc) : undefined;

  return (
    <div className="card">
      <h3>Vergleich: {ergebnis.thema}</h3>
      <p className="muted">
        {ergebnis.zeilen.length} Unterthemen{ergebnis.verworfen ? `, ${ergebnis.verworfen} ohne vollständige Belege verworfen` : ''}.
        Es wird nicht entschieden, welche Quelle recht hat. Tippe auf eine Aussage für die Originalstelle.
      </p>
      <div className="tabelle-wrap">
        <table className="zf-tabelle vergleich">
          <thead><tr><th>Unterthema</th>{docs.map((d) => <th key={d}>{titles.get(d) ?? 'Quelle'}</th>)}</tr></thead>
          <tbody>
            {ergebnis.zeilen.map((z, i) => (
              <tr key={i} className={`art-${z.art}`}>
                <td><strong>{z.unterthema}</strong><div className={`art-label ${z.art}`}>{ART[z.art]}</div>{z.erlaeuterung && <div className="muted">{z.erlaeuterung}</div>}</td>
                {z.jeQuelle.map((q) => (
                  <td key={q.documentId} className={q.aussage ? 'claim belegt' : 'leer'} onClick={() => q.aussage && setOffen(offen?.zeile === i && offen.doc === q.documentId ? null : { zeile: i, doc: q.documentId })}>
                    {q.aussage ?? <span className="muted">keine Angabe</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {auswahl && (
        <div className="source">
          {auswahl.belege.map((b, i) => {
            const s = belegStelle(b, chunkMap);
            return <Belegstelle key={i} titel={titles.get(auswahl.documentId)} chunk={s?.chunk} seite={s?.seite ?? '?'} start={s?.start} end={s?.end} zitat={b.zitat} />;
          })}
        </div>
      )}
      {fehltIn.some((f) => f.themen.length) && (
        <div className="note">
          {fehltIn.filter((f) => f.themen.length).map((f) => <div key={f.d}><strong>Fehlt in {titles.get(f.d) ?? 'Quelle'}:</strong> {f.themen.join(', ')}</div>)}
        </div>
      )}
    </div>
  );
}
