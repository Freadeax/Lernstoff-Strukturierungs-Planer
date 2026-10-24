// Originalstelle eines Belegs: Dokument, gedruckte Seite, Kapitel und das Zitat im Kontext hervorgehoben.
import type { SourceChunk } from '../../../core/types';

export function Belegstelle(props: { titel?: string; chunk?: SourceChunk; seite: string; start?: number; end?: number; zitat: string }) {
  const { chunk: ch, start, end } = props;
  return (
    <div className="quote">
      <div className="muted">{props.titel ?? 'Quelle'}, S. {props.seite}{ch?.chapter ? ` · ${ch.chapter}` : ''}</div>
      {ch && start !== undefined && end !== undefined
        ? <div className="pre">…{ch.text.slice(Math.max(0, start - 120), start)}<mark>{ch.text.slice(start, end)}</mark>{ch.text.slice(end, end + 120)}…</div>
        : <div className="pre">„{props.zitat}“</div>}
    </div>
  );
}
