// Anzeige einer Zusammenfassung aus den Text-Modi: Ampel, Prüfhinweise, Rückfragen, Gliederung mit
// markierten Kästen, Ampel je Aussage und Originalstelle per Tippen.
import { useEffect, useState, type ReactNode } from 'react';
import type { Claim, Document, SourceChunk, Summary, SummaryBlock } from '../../../core/types';
import { sensibleKategorien, stufenUebersicht, stufenVon, uebersichtText, KATEGORIE_TEXT } from '../../qualitaet/belegstufen';
import { Belegstelle } from './Belegstelle';
import { LaufInfo } from './LaufInfo';
import { Pruefstufen } from './Pruefstufen';

// „Grün“ heißt nur: Code und KI-Prüfer haben nichts beanstandet. Was je Aussage bestätigt ist, steht in der Stufenzeile darunter.
const AMPEL = { gruen: 'Keine Prüfbefunde', gelb: 'Mit Hinweisen, bitte prüfen', rot: 'Nicht verlässlich: unbelegte, falsch zitierte oder sinnverschobene Aussagen' };
const STATUS_TEXT: Record<string, string> = {
  belegt: 'belegt', unbelegt: 'ohne tragfähigen Beleg', abweichend: 'weicht ab', widerspruch: 'Widerspruch', unleserlich: 'unleserlich', fehlt: 'fehlt in der Quelle', ungeprueft: 'ungeprüft',
};
const KASTEN: Record<string, string> = {
  ergaenzung: 'Ergänzung (nicht aus deinen Quellen)', lernhilfe: 'Lernhilfe', widerspruch: 'Widerspruch zwischen Quellen', fehlt: 'Fehlt in den Quellen', merke: 'Merke',
};
export const MODUS_TEXT: Record<string, string> = { originalgetreu: 'Originalgetreu', lernen: 'Lernen', arbeitsauftrag: 'Arbeitsauftrag', pruefung: 'Prüfung', vergleich: 'Vergleich' };

/** Breite Ansicht (iPad quer, Rechner): Original neben der Zusammenfassung, dort mit ganzem Abschnitt. */
function useBreit(query = '(min-width: 1000px)') {
  const [breit, setBreit] = useState(() => typeof matchMedia === 'function' && matchMedia(query).matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia(query);
    const f = () => setBreit(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [query]);
  return breit;
}

const nurTrenner = (t: string) => /^[\s|:-]+$/.test(t);

export function SummaryAnsicht({ summary, chunkMap, titles, docs = new Map(), onAendern }: {
  summary: Summary; chunkMap: Map<string, SourceChunk>; titles: Map<string, string>;
  docs?: Map<string, Document>; onAendern?: (s: Summary) => void;
}) {
  const [shownId, setShownId] = useState<string | null>(null);
  const breit = useBreit();
  const shown = summary.claims.find((c) => c.id === shownId) ?? null;
  const setShown = (c: Claim | null) => setShownId(c?.id ?? null);
  const uebersicht = stufenUebersicht(summary, docs, chunkMap);
  const claimById = new Map(summary.claims.map((c) => [c.id, c]));
  const qa = summary.qa;
  const rueckfragen = summary.claims.filter((c) => c.kind === 'rueckfrage');
  const allgemein = qa?.befunde.filter((b) => !b.claimId && b.schwere !== 'hinweis') ?? [];

  const claimSpan = (c: Claim) => (
    <span key={c.id} className={`claim ${c.status} ${c.isSupplementary ? 'zusatz' : ''} ${shown?.id === c.id ? 'active' : ''} ${stufenVon(c, summary).freigabe?.urteil ?? ''}`}
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
            return <tr key={g.id} className={`claim ${c.status} ${shown?.id === c.id ? 'active' : ''}`} tabIndex={0} aria-label={`${c.text.replace(/\|/g, ' ').trim()}. Originalstelle zeigen`} onClick={() => setShown(shown?.id === c.id ? null : c)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShown(shown?.id === c.id ? null : c); } }}>{zellen.map((z, k) => <td key={k}>{z.trim()}</td>)}</tr>;
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
      {qa && <p className="stufen-zeile"><strong>{uebersichtText(uebersicht)}</strong>
        {uebersicht.sensibel > 0 && <> · {uebersicht.sensibel} sensible {uebersicht.sensibel === 1 ? 'Aussage' : 'Aussagen'} (Expertenstandard, Recht, Arzneimittel oder Normwert){uebersicht.sensibelUnvollstaendig ? `, davon ${uebersicht.sensibelUnvollstaendig} mit unvollständiger Quellenangabe` : ''}</>}
        {uebersicht.abgelehnt > 0 && <> · {uebersicht.abgelehnt} fachlich abgelehnt</>}
      </p>}
      {qa && (
        <p className="muted">
          {MODUS_TEXT[summary.mode]} · {qa.statistik.belegt} von {qa.statistik.claims} Aussagen ohne Befund
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
      <div className="zf-split">
      <div className="summary">{summary.blocks?.length ? gliederung() : fliesstext()}</div>
      {!shown && <aside className="source source--leer" aria-label="Originalstelle"><p className="muted">Tippe links auf eine Aussage. Hier erscheint die Originalstelle aus deinem Material.</p></aside>}
      {shown && (
        <aside className="source" aria-label="Originalstelle" aria-live="polite" tabIndex={0}>
          <div><strong>{STATUS_TEXT[shown.status]}</strong>{shown.isSupplementary ? ' · nicht aus deinen Quellen' : ''}
            {sensibleKategorien(shown, docs).map((k) => <span key={k} className="tag tag--warning">{KATEGORIE_TEXT[k]}</span>)}</div>
          <Pruefstufen summary={summary} claim={shown} docs={docs} onAendern={onAendern} />
          {qa?.befunde.filter((b) => b.claimId === shown.id).map((b) => <div key={b.id} className="muted">{b.pruefung}: {b.meldung}</div>)}
          {shown.citations.map((z, i) => (
            <Belegstelle key={i} titel={titles.get(z.documentId)} chunk={chunkMap.get(z.chunkId)} seite={z.printedPage ?? String(z.page)} start={z.charStart} end={z.charEnd} zitat={z.quote}
              quelle={docs.get(z.documentId)?.quelle} sensibel={sensibleKategorien(shown, docs).length > 0} dokumentId={z.documentId} ganz={breit} />
          ))}
        </aside>
      )}
      </div>
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
      <LaufInfo runId={summary.pipelineRunId} />
    </>
  );
}
