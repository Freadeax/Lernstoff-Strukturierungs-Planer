import { useState } from 'react';
import type { Topic } from '../../../core/types';
import { navigate } from '../../../ui/shell/router';
import { notify } from '../../../ui/shell/notifications';
import type { PlanBlock } from '../scheduler';
import type { EvidenceSource, Rating } from '../types';
import { logReview, logStudy, RATING_LABEL, SOURCE_LABEL, TRAINER_NAME } from '../store';
import { uebungenFuer } from '../trainer';
import { blockTitel, bloecke, dauer, langDatum, STATUS_LABEL } from './format';
import { OhnePruefung, type PlanCtx } from './Lernplan';

const QUELLEN: EvidenceSource[] = ['karteikarten', 'quiz', 'offene_frage', 'pruefungssimulation', 'selbsteinschaetzung'];

async function sicher<T>(fn: () => Promise<T>, ok: string) {
  try { await fn(); notify('info', ok); } catch (e) { notify('critical', 'Nicht gespeichert', e instanceof Error ? e.message : String(e)); }
}

/** Ergebnis einer Abfrage erfassen: Art der Abfrage, dann Bewertung oder Prozent richtig. */
export function AbfrageForm({ topic, onDone }: { topic: Topic; onDone: () => void }) {
  const [quelle, setQuelle] = useState<EvidenceSource>('karteikarten');
  const [prozent, setProzent] = useState('');
  const speichere = (r: { rating?: Rating; scorePercent?: number }) =>
    sicher(() => logReview(topic, quelle, r), 'Abfrage gespeichert, Plan neu berechnet').then(onDone);
  const p = Number(prozent.replace(',', '.'));
  return (
    <div className="abfrage">
      <p className="abfrage__frage">Wie hast du dich abgefragt?</p>
      <div className="pills" role="group" aria-label="Art der Abfrage">
        {QUELLEN.map((q) => <button key={q} type="button" className="pill" aria-pressed={quelle === q} onClick={() => setQuelle(q)}>{SOURCE_LABEL[q]}</button>)}
      </div>
      {quelle === 'selbsteinschaetzung' && (
        <p className="note warn">Wird gespeichert, zählt aber nicht als Wissensnachweis: Gelesen heißt nicht verstanden. Besser kurz mit Karteikarten oder im Fachbegriff-Duell testen.</p>
      )}
      <p className="abfrage__frage">Wie lief es?</p>
      <div className="abfrage__bewertung">
        {([1, 2, 3, 4] as Rating[]).map((r) => (
          <button key={r} type="button" className={`bew bew--${r}`} onClick={() => speichere({ rating: r })}>{RATING_LABEL[r]}</button>
        ))}
      </div>
      <form className="abfrage__prozent" onSubmit={(e) => { e.preventDefault(); if (p >= 0 && p <= 100 && prozent) speichere({ scorePercent: Math.round(p) }); }}>
        <label>oder Anteil richtig <input inputMode="numeric" value={prozent} onChange={(e) => setProzent(e.target.value)} placeholder="z. B. 80" size={4} aria-label="Prozent richtig" /> %</label>
        <button type="submit" className="small" disabled={!prozent || !(p >= 0 && p <= 100)}>Speichern</button>
        <button type="button" className="small ghost" onClick={onDone}>Abbrechen</button>
      </form>
    </div>
  );
}

function LernzeitForm({ topic, vorschlag, onDone }: { topic: Topic; vorschlag: number; onDone: () => void }) {
  const [min, setMin] = useState(String(vorschlag));
  const n = Math.round(Number(min));
  return (
    <form className="abfrage__prozent" onSubmit={(e) => { e.preventDefault(); if (n > 0) sicher(() => logStudy(topic, n), `${n} Min. Lernzeit gespeichert`).then(onDone); }}>
      <label>Tatsächlich gelernt <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} size={4} aria-label="Minuten" /> Min.</label>
      <button type="submit" className="small primary" disabled={!(n > 0)}>Speichern</button>
      <button type="button" className="small ghost" onClick={onDone}>Abbrechen</button>
    </form>
  );
}

function BlockKarte({ block, ctx }: { block: PlanBlock; ctx: PlanCtx }) {
  const [offen, setOffen] = useState<'abfrage' | 'zeit' | null>(null);
  const topic = ctx.topics.get(block.topicId);
  const exam = ctx.exams.get(block.examId);
  const prog = ctx.plan.progress[block.topicId];
  if (!topic) return null;
  const fach = ctx.subjects.find((s) => s.id === topic.subjectId);
  return (
    <li className={`block block--${block.kind}`}>
      <div className="block__kopf">
        <span className="block__art">{blockTitel(block)}</span>
        <span className="block__min">{dauer(block.minutes)}</span>
      </div>
      <h4 className="block__thema">{topic.name}</h4>
      <p className="muted">
        {fach?.code ?? fach?.name}{exam ? ` · für „${exam.name}“` : ''}
        {prog && prog.status !== 'offen' ? ` · ${STATUS_LABEL[prog.status]}` : ''}
      </p>
      {offen === null && (
        <div className="block__aktionen">
          {block.kind === 'erarbeiten' ? <>
            <button type="button" className="primary small" onClick={() => sicher(() => logStudy(topic, block.minutes), `${block.minutes} Min. Lernzeit gespeichert`)}>Erledigt</button>
            <button type="button" className="small" onClick={() => setOffen('zeit')}>Andere Dauer</button>
          </> : (
            <button type="button" className="primary small" onClick={() => setOffen('abfrage')}>Ergebnis eintragen</button>
          )}
          {block.kind !== 'erarbeiten' && uebungenFuer(topic.id).slice(0, 2).map((u) => (
            <button key={u.trainer} type="button" className="small" onClick={() => navigate(u.path)}>{u.label}</button>
          ))}
          <button type="button" className="small ghost" onClick={() => navigate(`/lernen/landkarte?thema=${encodeURIComponent(topic.id)}`)}>Auf der Landkarte</button>
        </div>
      )}
      {offen === 'abfrage' && <AbfrageForm topic={topic} onDone={() => setOffen(null)} />}
      {offen === 'zeit' && <LernzeitForm topic={topic} vorschlag={block.minutes} onDone={() => setOffen(null)} />}
    </li>
  );
}

/** Lernzeit oder Abfrage außerhalb des Plans nachtragen, z. B. nach dem Unterricht oder einem Duell. */
function Nachtragen({ ctx }: { ctx: PlanCtx }) {
  const [id, setId] = useState('');
  const [art, setArt] = useState<'zeit' | 'abfrage'>('abfrage');
  const topic = ctx.topics.get(id);
  return (
    <details className="card nachtragen">
      <summary>Außerhalb des Plans gelernt oder abgefragt?</summary>
      <label className="field">Thema
        <select value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">Bitte wählen …</option>
          {ctx.subjects.map((s) => {
            const ts = ctx.leaves.filter((t) => t.subjectId === s.id);
            return ts.length ? <optgroup key={s.id} label={s.code ? `${s.code} ${s.name}` : s.name}>{ts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup> : null;
          })}
        </select>
      </label>
      <div className="pills" role="group" aria-label="Was nachtragen">
        <button type="button" className="pill" aria-pressed={art === 'abfrage'} onClick={() => setArt('abfrage')}>Abfrage</button>
        <button type="button" className="pill" aria-pressed={art === 'zeit'} onClick={() => setArt('zeit')}>Lernzeit</button>
      </div>
      {topic && (art === 'abfrage'
        ? <AbfrageForm key={topic.id} topic={topic} onDone={() => setId('')} />
        : <LernzeitForm key={topic.id} topic={topic} vorschlag={ctx.settings.blockMinutes} onDone={() => setId('')} />)}
    </details>
  );
}

export function Heute({ ctx }: { ctx: PlanCtx }) {
  const { plan, data } = ctx;
  const today = plan.days.find((d) => d.date === data.today);
  const upcoming = data.exams.filter((e) => e.date > data.today);
  const [alleWarnungen, setAlle] = useState(false);
  const geplant = new Set(today?.blocks.filter((b) => b.kind !== 'erarbeiten').map((b) => b.topicId));
  const examTopics = new Set(upcoming.flatMap((e) => e.topicIds));
  const weitereFaellig = Object.values(plan.progress).filter((p) => examTopics.has(p.topicId) && p.nextReview && p.nextReview <= data.today && !geplant.has(p.topicId));
  const erledigt = [
    ...data.studyLogs.filter((l) => l.date === data.today).map((l) => ({ at: l.at, text: `${dauer(l.minutes)} gelernt`, topicId: l.topicId })),
    ...data.reviewLogs.filter((l) => l.date === data.today).map((l) => ({
      at: l.at, topicId: l.topicId,
      text: `${l.trainer ? TRAINER_NAME[l.trainer] ?? SOURCE_LABEL[l.source] : SOURCE_LABEL[l.source]}: ${l.rating ? RATING_LABEL[l.rating] : `${l.scorePercent} %`}`,
    })),
  ].sort((a, b) => (a.at < b.at ? -1 : 1));
  const warnungen = plan.warnings.filter((w) => w.kind !== 'fehlende_voraussetzung' || alleWarnungen);
  const sichtbar = alleWarnungen ? warnungen : warnungen.slice(0, 2);

  if (!upcoming.length) return <><OhnePruefung /><Nachtragen ctx={ctx} /></>;

  return (
    <div className="stack-2">
      <div className="card heute__kopf">
        <h3>{langDatum(data.today)}</h3>
        {today && today.capacityMinutes > 0
          ? <p>{today.blocks.length ? `${bloecke(today.blocks.length)}, ${dauer(today.plannedMinutes)} Lernzeit` : 'Heute ist nichts mehr geplant'}
            {today.pauseMinutes ? `, dazu ${dauer(today.pauseMinutes)} Pausen` : ''}.</p>
          : <p>Heute ist keine Lernzeit eingetragen{erledigt.length ? ' oder sie ist schon verbraucht' : ''}. <button type="button" className="link" onClick={() => navigate('/lernen/plan?ansicht=zeit')}>Lernzeit ändern</button></p>}
        {today && today.capacityMinutes > 0 && (
          <div className="balken" role="img" aria-label={`${today.plannedMinutes} von ${today.capacityMinutes} Minuten verplant`}>
            <span style={{ width: `${Math.min(100, (today.plannedMinutes / today.capacityMinutes) * 100)}%` }} />
          </div>
        )}
      </div>

      {sichtbar.map((w, i) => <p key={i} className="note warn">{w.message}</p>)}
      {(warnungen.length > 2 || plan.warnings.some((w) => w.kind === 'fehlende_voraussetzung')) && (
        <button type="button" className="link" onClick={() => setAlle((x) => !x)}>{alleWarnungen ? 'Weniger Hinweise' : `Alle Hinweise zeigen (${plan.warnings.length})`}</button>
      )}

      {today && today.blocks.length > 0 && (
        <ol className="bloecke" aria-label="Heute geplant">
          {today.blocks.map((b, i) => <BlockKarte key={`${b.kind}-${b.topicId}-${i}`} block={b} ctx={ctx} />)}
        </ol>
      )}

      {weitereFaellig.length > 0 && (
        <div className="card">
          <h3>Außerdem fällig</h3>
          <p className="muted">Heute ist keine Zeit mehr dafür eingeplant. Wenn du Luft hast, frag diese Themen zuerst ab.</p>
          <ul className="faellig">
            {weitereFaellig.map((p) => <FaelligZeile key={p.topicId} topic={ctx.topics.get(p.topicId)!} since={p.nextReview!} today={data.today} />)}
          </ul>
        </div>
      )}

      {erledigt.length > 0 && (
        <div className="card">
          <h3>Heute erledigt</h3>
          <ul className="erledigt">
            {erledigt.map((e, i) => <li key={i}><span>{ctx.topics.get(e.topicId)?.name ?? e.topicId}</span><span className="muted">{e.text}</span></li>)}
          </ul>
        </div>
      )}
      <Nachtragen ctx={ctx} />
    </div>
  );
}

function FaelligZeile({ topic, since, today }: { topic: Topic; since: string; today: string }) {
  const [offen, setOffen] = useState(false);
  return (
    <li>
      <div className="faellig__zeile">
        <span>{topic.name}{since < today ? <span className="muted"> · überfällig seit {since.split('-').reverse().slice(0, 2).join('.')}.</span> : null}</span>
        {!offen && <button type="button" className="small" onClick={() => setOffen(true)}>Ergebnis eintragen</button>}
      </div>
      {offen && <AbfrageForm topic={topic} onDone={() => setOffen(false)} />}
    </li>
  );
}
