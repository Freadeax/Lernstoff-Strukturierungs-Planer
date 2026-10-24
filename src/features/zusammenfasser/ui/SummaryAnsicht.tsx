// Anzeige einer Zusammenfassung aus den Text-Modi: Ampel, Prüfhinweise, Rückfragen, Gliederung mit
// markierten Kästen, Ampel je Aussage und Originalstelle per Tippen.
import { useState, type ReactNode } from 'react';
import type { Claim, SourceChunk, Summary, SummaryBlock } from '../../../core/types';
import { Belegstelle } from './Belegstelle';

const AMPEL = { gruen: 'Alle Aussagen belegt', gelb: 'Mit Hinweisen, bitte prüfen', rot: 'Nicht verlässlich: unbelegte, falsch zitierte oder sinnverschobene Aussagen' };
const STATUS_TEXT: Record<string, string> = {
  belegt: 'belegt', unbelegt: 'ohne tragfähigen Beleg', abweichend: 'weicht ab', widerspruch: 'Widerspruch', unleserlich: 'unleserlich', fehlt: 'fehlt in der Quelle', ungeprueft: 'ungeprüft',
};
const KASTEN: Record<string, string> = {
  ergaenzung: 'Ergänzung (nicht aus deinen Quellen)', lernhilfe: 'Lernhilfe', widerspruch: 'Widerspruch zwischen Quellen', fehlt: 'Fehlt in den Quellen', merke: 'Merke',
};
export const MODUS_TEXT: Record<string, string> = { originalgetreu: 'Originalgetreu', lernen: 'Lernen', arbeitsauftrag: 'Arbeitsauftrag', pruefung: 'Prüfung', vergleich: 'Vergleich' };

const nurTrenner = (t: string) => /^[\s|:-]+$/.test(t);

export function SummaryAnsicht({ summary, chunkMap, titles }: { summary: Summary; chunkMap: Map<string, SourceChunk>; titles: Map<string, string> }) {
  const [shown, setShown] = useState<Claim | null>(null);
  const claimById = new Map(summary.claims.map((c) => [c.id, c]));
  const qa = summary.qa;
  const rueckfragen = summary.claims.filter((c) => c.kind === 'rueckfrage');
  const allgemein = qa?.befunde.filter((b) => !b.claimId && b.schwere !== 'hinweis') ?? [];

  const claimSpan = (c: Claim) => (
    <span key={c.id} className={`claim ${c.status} ${c.isSupplementary ? 'zusatz' : ''} ${shown?.id === c.id ? 'active' : ''}`}
      role="button" tabIndex={0}
      onClick={() => setShown(shown?.id === c.id ? null : c)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShown(shown?.id === c.id ? null : c); } }}>
      {c.text}{' '}
    </span>
  );
  const claimsVon = (b: SummaryBlock) => b.claimIds.map((id) => claimById.get(id)).filter((c): c is Claim => !!c && c.kind !== 'rueckfrage' && !(c.kind === 'struktur' && nurTrenner(c.text)));   // Rückfragen stehen oben

  function gliederung(): ReactNode[] {
    const blocks = summary.blocks ?? [];
    const out: ReactNode[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.type === 'ueberschrift') { out.push(<h4 key={b.id} className={`h${b.level}`}>{b.title}</h4>); continue; }
      // gleichartige Nachbarzeilen zusammenfassen
      let j = i;
      while (j + 1 < blocks.length && blocks[j + 1].type === b.type && blocks[j + 1].kastenArt === b.kastenArt) j++;
      const gruppe = blocks.slice(i, j + 1);
      i = j;
      if (b.type === 'liste') out.push(<ul key={b.id}>{gruppe.map((g) => <li key={g.id}>{claimsVon(g).map(claimSpan)}</li>)}</ul>);
      else if (b.type === 'tabelle') out.push(
        <div key={b.id} className="tabelle-wrap"><table className="zf-tabelle"><tbody>{gruppe.map((g) => {
          const cs = claimsVon(g);
          if (!cs.length) return null;
          if (cs.length === 1) {
            const c = cs[0];
            const zellen = c.text.replace(/^\|/, '').replace(/\|$/, '').split('|');
            return <tr key={g.id} className={`claim ${c.status} ${shown?.id === c.id ? 'active' : ''}`} onClick={() => setShown(shown?.id === c.id ? null : c)}>{zellen.map((z, k) => <td key={k}>{z.trim()}</td>)}</tr>;
          }
          return <tr key={g.id}><td colSpan={9}>{cs.map(claimSpan)}</td></tr>;
        })}</tbody></table></div>);
      else if (b.type === 'kasten') out.push(
        <div key={b.id} className={`kasten ${b.kastenArt}`}><div className="kasten__titel">{KASTEN[b.kastenArt ?? ''] ?? ''}</div>{gruppe.map((g) => <p key={g.id}>{claimsVon(g).map(claimSpan)}</p>)}</div>);
      else out.push(...gruppe.map((g) => <p key={g.id}>{claimsVon(g).map(claimSpan)}</p>));
    }
    return out;
  }

  // ältere Zusammenfassungen ohne Gliederung
  const fliesstext = () => summary.claims.map((c) => {
    const h = /^(#{1,6})\s+(.*)$/.exec(c.text);
    return h ? <h4 key={c.id} className={`h${h[1].length}`}>{h[2]}</h4> : claimSpan(c);
  });

  return (
    <>
      {qa && <div className={`ampel ${qa.ampel}`}>{AMPEL[qa.ampel]}</div>}
      {qa && (
        <p className="muted">
          {MODUS_TEXT[summary.mode]} · {qa.statistik.belegt} von {qa.statistik.claims} Aussagen belegt
          {qa.statistik.unbelegt ? `, ${qa.statistik.unbelegt} ohne tragfähigen Beleg` : ''}
          {qa.statistik.ergaenzung ? `, ${qa.statistik.ergaenzung} Lernhilfen/Ergänzungen` : ''}
          {qa.statistik.fehlt ? `, ${qa.statistik.fehlt} Lücken markiert` : ''}
          {qa.reparaturVersucht ? '. Eine automatische Korrekturrunde wurde durchgeführt' : ''}. Tippe auf eine Aussage für die Originalstelle.
        </p>
      )}
      {rueckfragen.length > 0 && (
        <div className="note warn">
          <strong>Rückfragen an dich, das Ergebnis ist vorläufig:</strong>
          <ul>{rueckfragen.map((c) => <li key={c.id}>{c.text}</li>)}</ul>
        </div>
      )}
      {allgemein.length > 0 && (
        <div className="note warn"><ul className="befunde">{allgemein.map((b) => <li key={b.id}>{b.meldung}</li>)}</ul></div>
      )}
      <div className="summary">{summary.blocks?.length ? gliederung() : fliesstext()}</div>
      {shown && (
        <div className="source">
          <div><strong>{STATUS_TEXT[shown.status]}</strong>{shown.isSupplementary ? ' · nicht aus deinen Quellen' : ''}</div>
          {qa?.befunde.filter((b) => b.claimId === shown.id).map((b) => <div key={b.id} className="muted">{b.pruefung}: {b.meldung}</div>)}
          {shown.citations.map((z, i) => (
            <Belegstelle key={i} titel={titles.get(z.documentId)} chunk={chunkMap.get(z.chunkId)} seite={z.printedPage ?? String(z.page)} start={z.charStart} end={z.charEnd} zitat={z.quote} />
          ))}
        </div>
      )}
      {qa && qa.befunde.length > 0 && (
        <details className="befunde-alle">
          <summary>Alle Prüfhinweise ({qa.befunde.length})</summary>
          <ul className="befunde">
            {qa.befunde.map((b) => (
              <li key={b.id} className={b.schwere}>
                <strong>{b.pruefung}</strong> · {b.schwere}{b.aufgabeNr ? ` · Aufgabe ${b.aufgabeNr}` : ''}: {b.meldung}
                {b.claimId && claimById.has(b.claimId) && <> <button className="link" onClick={() => setShown(claimById.get(b.claimId!)!)}>zur Aussage</button></>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
