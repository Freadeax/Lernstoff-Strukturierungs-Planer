import { useMemo, useState } from 'react';
import type { Exam } from '../../../core/types';
import { notify } from '../../../ui/shell/notifications';
import { navigate, useRoute } from '../../../ui/shell/router';
import { daysBetween } from '../dates';
import type { ExamForecast } from '../forecast';
import { deleteExam, saveExam } from '../store';
import { dauer, inTagen, kurzDatum, langDatum, STATUS_LABEL } from './format';
import type { PlanCtx } from './Lernplan';

const GEWICHTE = [
  { w: 1, label: 'Klausur oder Test' },
  { w: 2, label: 'Wichtige Prüfung' },
  { w: 3, label: 'Abschlussprüfung' },
];

const prozent = (x: number) => `${Math.round(x * 100)} %`;

function ExamForm({ ctx, exam, onDone }: { ctx: PlanCtx; exam?: Exam; onDone: () => void }) {
  const [name, setName] = useState(exam?.name ?? '');
  const [date, setDate] = useState(exam?.date ?? '');
  const [gewicht, setGewicht] = useState(exam ? ctx.data.config.examWeights[exam.id] ?? 1 : 1);
  const [auswahl, setAuswahl] = useState(new Set(exam?.topicIds ?? []));
  const [suche, setSuche] = useState('');
  const q = suche.trim().toLowerCase();
  const gruppen = useMemo(() => ctx.subjects.map((s) => ({
    s, alle: ctx.leaves.filter((t) => t.subjectId === s.id),
  })).filter((g) => g.alle.length), [ctx]);
  const minuten = [...auswahl].reduce((sum, id) => sum + (ctx.topics.get(id)?.estimatedMinutes ?? ctx.settings.defaultEstimatedMinutes), 0);
  const wochenThemen = ctx.data.board.filter((b) => b.column === 'woche' || b.column === 'arbeit').map((b) => b.topicId).filter((id) => ctx.topics.has(id));
  const fehler = !name.trim() ? 'Bitte einen Namen eintragen.' : !date ? 'Bitte ein Datum wählen.' : date <= ctx.data.today && !exam ? 'Das Datum muss in der Zukunft liegen.' : !auswahl.size ? 'Bitte mindestens ein Thema auswählen.' : '';

  const toggle = (ids: string[], an: boolean) => setAuswahl((cur) => {
    const n = new Set(cur);
    for (const id of ids) { if (an) n.add(id); else n.delete(id); }
    return n;
  });

  const speichern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fehler) return;
    const topicIds = [...auswahl];
    const subjectIds = [...new Set(topicIds.map((id) => ctx.topics.get(id)?.subjectId).filter((x): x is string => !!x))];
    try {
      await saveExam({ id: exam?.id ?? crypto.randomUUID(), name: name.trim(), date, topicIds, subjectIds }, gewicht);
      notify('info', exam ? 'Prüfung geändert, Plan neu berechnet' : 'Prüfung eingetragen, Plan neu berechnet');
      onDone();
    } catch (err) {
      notify('critical', 'Prüfung nicht gespeichert', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <form className="card pruefung-form" onSubmit={speichern}>
      <h3>{exam ? 'Prüfung bearbeiten' : 'Neue Prüfung'}</h3>
      <div className="pruefung-form__zeile">
        <label className="field">Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Klausur Anatomie" autoFocus={!exam} /></label>
        <label className="field">Datum<input type="date" value={date} min={exam ? undefined : ctx.data.today} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="field">Gewicht
          <select value={gewicht} onChange={(e) => setGewicht(Number(e.target.value))}>
            {GEWICHTE.map((g) => <option key={g.w} value={g.w}>{g.label}</option>)}
          </select>
        </label>
      </div>
      <fieldset className="themenwahl">
        <legend>Themen <span className="muted">({auswahl.size} gewählt, ca. {dauer(minuten)} Erstlernzeit)</span></legend>
        <div className="themenwahl__werkzeuge">
          <input type="search" value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Themen suchen" aria-label="Themen suchen" />
          {wochenThemen.length > 0 && <button type="button" className="small" onClick={() => toggle(wochenThemen, true)}>Themen von „Diese Woche“ ({wochenThemen.length})</button>}
          {auswahl.size > 0 && <button type="button" className="small ghost" onClick={() => setAuswahl(new Set())}>Auswahl leeren</button>}
        </div>
        {gruppen.map(({ s, alle }) => {
          const sichtbar = q ? alle.filter((t) => t.name.toLowerCase().includes(q)) : alle;
          if (!sichtbar.length) return null;
          const n = alle.filter((t) => auswahl.has(t.id)).length;
          return (
            <details key={s.id} className="themenwahl__fach" open={!!q || undefined}>
              <summary>
                <span>{s.code ? `${s.code} · ` : ''}{s.name}</span>
                <span className="muted">{n ? `${n} von ${alle.length}` : alle.length}</span>
              </summary>
              <label className="themenwahl__alle">
                <input type="checkbox" checked={n === alle.length} ref={(el) => { if (el) el.indeterminate = n > 0 && n < alle.length; }}
                  onChange={(e) => toggle(alle.map((t) => t.id), e.target.checked)} /> Ganzes Fach
              </label>
              <ul>
                {sichtbar.map((t) => (
                  <li key={t.id}>
                    <label>
                      <input type="checkbox" checked={auswahl.has(t.id)} onChange={(e) => toggle([t.id], e.target.checked)} />
                      <span>{t.name}</span>
                      {t.estimatedMinutes && <span className="muted">{dauer(t.estimatedMinutes)}</span>}
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </fieldset>
      {fehler && (name || date || auswahl.size) ? <p className="field-error">{fehler}</p> : null}
      <div className="row">
        <button type="button" className="ghost" onClick={onDone}>Abbrechen</button>
        <button type="submit" className="primary" disabled={!!fehler}>Speichern</button>
      </div>
    </form>
  );
}

function Prognose({ f, ctx }: { f: ExamForecast; ctx: PlanCtx }) {
  const total = Math.max(1, f.topicCount);
  return (
    <div className="prognose">
      <div className="statusleiste" role="img" aria-label={(['sicher', 'unsicher', 'bearbeitet', 'offen'] as const).map((s) => `${STATUS_LABEL[s]} ${f.byStatus[s]}`).join(', ')}>
        {(['sicher', 'unsicher', 'bearbeitet', 'offen'] as const).map((s) => f.byStatus[s] ? <span key={s} className={`statusleiste__${s}`} style={{ flexGrow: f.byStatus[s] / total }} /> : null)}
      </div>
      <ul className="statusliste">
        {(['sicher', 'unsicher', 'bearbeitet', 'offen'] as const).map((s) => <li key={s}><span className={`punkt punkt--${s}`} />{STATUS_LABEL[s]} {f.byStatus[s]}</li>)}
      </ul>
      <dl className="prognose__zahlen">
        <div><dt>Abgefragt</dt><dd>{prozent(f.testedShare)} der Themen</dd></div>
        <div><dt>Erwarteter Abruf am Prüfungstag</dt><dd>{f.expectedRecallTested !== undefined ? `${prozent(f.expectedRecallTested)} (abgefragte Themen), mindestens ${prozent(f.expectedRecallLowerBound)} insgesamt` : 'noch keine Abfragen'}</dd></div>
        <div><dt>Zeit</dt><dd className={f.timeFeasible ? '' : 'prognose__knapp'}>{dauer(f.requiredMinutes)} nötig, {dauer(f.availableMinutes)} verfügbar</dd></div>
        <div><dt>Datenbasis</dt><dd>{f.confidence}</dd></div>
      </dl>
      <p>{f.assessment}</p>
      {f.recommendations.length > 0 && <ul className="prognose__tipps">{f.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>}
      <p className="muted">Bewusst keine Bestehenswahrscheinlichkeit: Die Werte gelten ohne weitere Wiederholungen und sind eher zu niedrig als zu hoch.</p>
      {ctx.plan.unscheduled.some((u) => u.examId === f.examId) && (
        <button type="button" className="link" onClick={() => navigate('/lernen/plan?ansicht=zeit')}>Mehr Lernzeit eintragen</button>
      )}
    </div>
  );
}

function Karte({ e, ctx, f, bearbeiten, onEdit, onDone, onDelete }: {
  e: Exam; ctx: PlanCtx; f?: ExamForecast; bearbeiten: boolean; onEdit: () => void; onDone: () => void; onDelete: () => void;
}) {
  if (bearbeiten) return <ExamForm ctx={ctx} exam={e} onDone={onDone} />;
  const today = ctx.data.today;
  const w = ctx.data.config.examWeights[e.id] ?? 1;
  return (
    <article className="card pruefung">
      <div className="pruefung__kopf">
        <div>
          <h3>{e.name}</h3>
          <p className="muted">{langDatum(e.date)} · {inTagen(daysBetween(today, e.date))} · {e.topicIds.length} Themen · {GEWICHTE.find((g) => g.w === w)?.label}</p>
        </div>
        <div className="pruefung__aktionen">
          {e.date > today && <button type="button" className="small" onClick={() => navigate(`/lernen/simulation?pruefung=${e.id}`)}>Simulieren</button>}
          <button type="button" className="small" onClick={onEdit}>Bearbeiten</button>
          <button type="button" className="small danger" onClick={onDelete}>Löschen</button>
        </div>
      </div>
      {f && e.date > today && <Prognose f={f} ctx={ctx} />}
    </article>
  );
}

export function Pruefungen({ ctx }: { ctx: PlanCtx }) {
  const { params } = useRoute();
  const [bearbeite, setBearbeite] = useState<string | null>(() => (params.get('neu') ? 'neu' : null));
  const today = ctx.data.today;
  const sorted = [...ctx.data.exams].sort((a, b) => (a.date < b.date ? -1 : 1));
  const kommend = sorted.filter((e) => e.date > today);
  const vorbei = sorted.filter((e) => e.date <= today);
  const forecast = new Map(ctx.forecasts.map((f) => [f.examId, f]));
  const schliessen = () => { setBearbeite(null); if (params.get('neu')) navigate('/lernen/plan?ansicht=pruefungen'); };

  const loeschen = async (e: Exam) => {
    if (!confirm(`Prüfung „${e.name}“ löschen? Lernzeit und Abfrageergebnisse bleiben erhalten.`)) return;
    try { await deleteExam(e); notify('info', 'Prüfung gelöscht'); } catch (err) { notify('critical', 'Nicht gelöscht', err instanceof Error ? err.message : String(err)); }
  };


  return (
    <div className="stack-2">
      {bearbeite === 'neu'
        ? <ExamForm ctx={ctx} onDone={schliessen} />
        : <div><button type="button" className="primary" onClick={() => setBearbeite('neu')}>Prüfung eintragen</button></div>}
      {!kommend.length && bearbeite !== 'neu' && <p className="muted">Keine anstehenden Prüfungen. Ohne Termin kann der Plan den Stoff nicht verteilen.</p>}
      {kommend.map((e) => (
        <Karte key={e.id} e={e} ctx={ctx} f={forecast.get(e.id)} bearbeiten={bearbeite === e.id}
          onEdit={() => setBearbeite(e.id)} onDone={schliessen} onDelete={() => loeschen(e)} />
      ))}
      {vorbei.length > 0 && (
        <details className="card">
          <summary>Vergangene Prüfungen ({vorbei.length})</summary>
          <ul className="erledigt">{vorbei.map((e) => (
            <li key={e.id}><span>{e.name}</span><span className="muted">{kurzDatum(e.date)} <button type="button" className="small ghost" onClick={() => loeschen(e)}>Löschen</button></span></li>
          ))}</ul>
        </details>
      )}
    </div>
  );
}
