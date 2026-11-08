// Originalstelle eines Belegs: Dokument, gedruckte Seite, Abschnitt und das Zitat im Kontext hervorgehoben.
// Mit Quellenangabe zusätzlich Quellenart, Herausgeber, Fassung, Geltungsbereich und Prüfdatum.
import type { Quellenangabe, SourceChunk } from '../../../core/types';
import { QUELLENART_GELTUNG, QUELLENART_TEXT, quellenLuecken } from '../../qualitaet/belegstufen';

const datum = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('de-DE');

export function Belegstelle(props: { titel?: string; chunk?: SourceChunk; seite: string; start?: number; end?: number; zitat: string; quelle?: Quellenangabe; sensibel?: boolean; dokumentId?: string }) {
  const { chunk: ch, start, end, quelle: q } = props;
  const luecken = props.sensibel ? quellenLuecken(q, ch) : [];
  return (
    <div className="quote">
      <div className="muted">{props.titel ?? 'Quelle'}, S. {props.seite}{ch?.chapter ? ` · Abschnitt ${ch.chapter}` : ''}</div>
      {q && (
        <div className="quellenangabe">
          <span className={`tag ${q.art === 'einrichtung' || q.art === 'schule' ? 'tag--info' : q.art === 'mitschrift' || q.art === 'sonstige' ? 'tag--warning' : ''}`}>{QUELLENART_TEXT[q.art]}</span>
          {' '}{[q.herausgeber, q.fassung, q.geltungsbereich && `gilt: ${q.geltungsbereich}`, q.geprueftAm && `geprüft am ${datum(q.geprueftAm)}`].filter(Boolean).join(' · ')}
          <div className="muted small">{QUELLENART_GELTUNG[q.art]}</div>
        </div>
      )}
      {luecken.length > 0 && (
        <div className="note warn small">
          Für diese Aussage fehlen Angaben: {luecken.map((l) => l.text).join(', ')}.
          {props.dokumentId && <> <a href={`#/material/dokumente?quelle=${encodeURIComponent(props.dokumentId)}`}>Quellenangaben ergänzen</a></>}
        </div>
      )}
      {ch && start !== undefined && end !== undefined
        ? <div className="pre">…{ch.text.slice(Math.max(0, start - 120), start)}<mark>{ch.text.slice(start, end)}</mark>{ch.text.slice(end, end + 120)}…</div>
        : <div className="pre">„{props.zitat}“</div>}
    </div>
  );
}
