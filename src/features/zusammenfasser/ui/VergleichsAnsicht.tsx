// Vergleichsmatrix Unterthema × Quelle mit Einordnung, Aussagen je Quelle und Belegen per Tippen.
import { useState } from 'react';
import type { SourceChunk } from '../../../core/types';
import { belegStelle } from '../belege';
import type { VergleichsArt, VergleichsErgebnis } from '../typen';
import { Belegstelle } from './Belegstelle';
import { LaufInfo } from './LaufInfo';
import { zusammenfuehren } from '../vergleich';

const ART: Record<VergleichsArt, string> = {
  uebereinstimmend: 'stimmt überein', ergaenzend: 'ergänzend', abweichend: 'weicht ab', widerspruechlich: 'Widerspruch', definition_unterschiedlich: 'Definition unterschiedlich',
};

export function VergleichsAnsicht({ ergebnis, chunkMap, titles }: { ergebnis: VergleichsErgebnis; chunkMap: Map<string, SourceChunk>; titles: Map<string, string> }) {
  const [offen, setOffen] = useState<{ zeile: number; doc: string; wo: 'matrix' | 'zusammen' } | null>(null);
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
                  <td key={q.documentId} className={q.aussage ? 'claim belegt' : 'leer'} onClick={() => q.aussage && setOffen(offen?.zeile === i && offen.doc === q.documentId && offen.wo === 'matrix' ? null : { zeile: i, doc: q.documentId, wo: 'matrix' })}>
                    {q.aussage ?? <span className="muted">keine Angabe</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {auswahl && offen?.wo === 'matrix' && (
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
      <h3 className="zusammen__titel">Zusammengeführte Fassung</h3>
      <p className="muted">Übereinstimmendes steht einmal, jeder Unterschied bleibt mit seiner Quelle sichtbar. Tippe auf eine Aussage für die Belege.</p>
      <div className="summary zusammen">
        {zusammenfuehren(ergebnis.zeilen).map((a) => {
          const zeile = ergebnis.zeilen.findIndex((z) => z.unterthema === a.unterthema);
          const tippen = (doc: string) => setOffen(offen?.zeile === zeile && offen.doc === doc && offen.wo === 'zusammen' ? null : { zeile, doc, wo: 'zusammen' });
          return (
            <section key={a.unterthema}>
              <h4>{a.unterthema}</h4>
              {a.einheitlich && (
                <p><span className="claim belegt" role="button" tabIndex={0} onClick={() => tippen(a.einheitlich!.quellen[0]?.documentId ?? '')}>{a.einheitlich.aussage}</span>
                  {' '}<span className="muted">({a.art === 'ergaenzend' ? 'nur in ' : 'übereinstimmend in '}{a.einheitlich.quellen.map((q) => titles.get(q.documentId) ?? 'Quelle').join(', ')})</span></p>
              )}
              {a.jeQuelle && (
                <div className={`kasten ${a.art === 'abweichend' ? 'ergaenzung' : 'widerspruch'}`}>
                  <div className="kasten__titel">{ART[a.art]}{a.art !== 'abweichend' ? ' · nicht entschieden, welche Quelle recht hat' : ''}</div>
                  <ul>{a.jeQuelle.map((q) => (
                    <li key={q.documentId}><strong>{titles.get(q.documentId) ?? 'Quelle'}:</strong>{' '}
                      <span className="claim belegt" role="button" tabIndex={0} onClick={() => tippen(q.documentId)}>{q.aussage}</span></li>
                  ))}</ul>
                  {a.erlaeuterung && <p className="muted">{a.erlaeuterung}</p>}
                </div>
              )}
            </section>
          );
        })}
      </div>
      {auswahl && offen?.wo === 'zusammen' && (
        <div className="source">
          {auswahl.belege.map((b, i) => {
            const s = belegStelle(b, chunkMap);
            return <Belegstelle key={i} titel={titles.get(auswahl.documentId)} chunk={s?.chunk} seite={s?.seite ?? '?'} start={s?.start} end={s?.end} zitat={b.zitat} />;
          })}
        </div>
      )}
      <LaufInfo runId={ergebnis.pipelineRunId} />
    </div>
  );
}
