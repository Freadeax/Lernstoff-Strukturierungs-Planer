import { useState } from 'react';
import { navigate } from '../../../ui/shell/router';
import { uebungenFuer } from '../trainer';
import type { MasteryStatus } from '../types';
import { AbfrageForm } from './Heute';
import { kurzDatum, STATUS_LABEL } from './format';
import type { PlanCtx } from './usePlan';

type Filter = 'alle' | 'faellig' | MasteryStatus;

/** Alle lernbaren Themen, auch ohne Prüfung. Verwendet dieselben Fakten wie der Lernplan. */
export function Wissensstand({ ctx }: { ctx: PlanCtx }) {
  const [suche, setSuche] = useState('');
  const [fach, setFach] = useState('');
  const [filter, setFilter] = useState<Filter>('alle');
  const [offen, setOffen] = useState('');
  const [limit, setLimit] = useState(20);
  const today = ctx.data.today;
  const faellig = (id: string) => !!ctx.plan.progress[id]?.nextReview && ctx.plan.progress[id]!.nextReview! <= today;
  const basis = ctx.leaves.filter((t) => (!fach || t.subjectId === fach)
    && t.name.toLocaleLowerCase('de').includes(suche.trim().toLocaleLowerCase('de')));
  const anzahl = (f: Filter) => basis.filter((t) => f === 'alle' || (f === 'faellig' ? faellig(t.id) : ctx.plan.progress[t.id]?.status === f)).length;
  const themen = basis.filter((t) => filter === 'alle' || (filter === 'faellig' ? faellig(t.id) : ctx.plan.progress[t.id]?.status === filter))
    .sort((a, b) => Number(faellig(b.id)) - Number(faellig(a.id))
      || (ctx.plan.progress[a.id]?.nextReview ?? '9999').localeCompare(ctx.plan.progress[b.id]?.nextReview ?? '9999')
      || a.name.localeCompare(b.name, 'de'));
  const reset = () => { setLimit(20); setOffen(''); };

  return <div className="stack-2 wissensstand">
    <div className="card heute__kopf">
      <h3>Was kannst du schon abrufen?</h3>
      <p>Alle Themen aus Katalog und eigenen Materialien, auch ohne Prüfungstermin. Bearbeiteter Stoff ist noch kein Wissensnachweis. Sicher wird ein Thema erst durch erfolgreiche Abfragen an mehreren Tagen.</p>
      <div className="wissensstand__filter">
        <label className="field">Themen suchen
          <input type="search" value={suche} onChange={(e) => { setSuche(e.target.value); reset(); }} placeholder="Thema eingeben …" />
        </label>
        <label className="field">Fach filtern
          <select value={fach} onChange={(e) => { setFach(e.target.value); reset(); }}>
            <option value="">Alle Fächer</option>
            {ctx.subjects.map((s) => <option key={s.id} value={s.id}>{s.code ? `${s.code} · ` : ''}{s.name}</option>)}
          </select>
        </label>
      </div>
      <div className="pills" role="group" aria-label="Wissensstand filtern">
        {(['alle', 'faellig', 'bearbeitet', 'unsicher', 'sicher', 'offen'] as Filter[]).map((f) =>
          <button type="button" key={f} className="pill" aria-pressed={filter === f} onClick={() => { setFilter(f); reset(); }}>
            {f === 'alle' ? 'Alle' : f === 'faellig' ? 'Jetzt abfragen' : STATUS_LABEL[f]} ({anzahl(f)})
          </button>)}
      </div>
    </div>
    <p className="muted" role="status">{themen.length} {themen.length === 1 ? 'Thema' : 'Themen'} gefunden{themen.length > limit ? ` · ${limit} angezeigt` : ''}.</p>
    {!themen.length && <p className="note">Keine Themen für diese Auswahl. Ändere die Suche oder den Filter.</p>}
    <ul className="bloecke" aria-label="Themen und Wissensstand">
      {themen.slice(0, limit).map((t) => {
        const p = ctx.plan.progress[t.id]!;
        const subject = ctx.subjects.find((s) => s.id === t.subjectId);
        const uebungen = uebungenFuer(t.id);
        return <li className={`block${faellig(t.id) ? ' block--wiederholen' : ''}`} key={t.id}>
          <div className="block__kopf"><span>{subject?.code ?? subject?.name ?? 'Eigenes Thema'}</span><strong>{STATUS_LABEL[p.status]}</strong></div>
          <h4 className="block__thema">{t.name}</h4>
          <p className="muted">{p.testCount} echte {p.testCount === 1 ? 'Abfrage' : 'Abfragen'}{p.nextReview ? ` · ${faellig(t.id) ? 'fällig' : 'nächste Abfrage'}: ${kurzDatum(p.nextReview)}` : ''}</p>
          <p>{p.reasons.join(' ')}</p>
          <div className="block__aktionen">
            {uebungen.slice(0, 2).map((u) => <button type="button" className="small" key={u.trainer} onClick={() => navigate(u.path)}>{u.label}</button>)}
            <button type="button" className="small ghost" aria-expanded={offen === t.id} onClick={() => setOffen(offen === t.id ? '' : t.id)}>Ergebnis eintragen</button>
          </div>
          {offen === t.id && <AbfrageForm key={t.id} topic={t} onDone={() => setOffen('')} />}
        </li>;
      })}
    </ul>
    {themen.length > limit && <button type="button" onClick={() => setLimit((n) => n + 20)}>Weitere Themen anzeigen</button>}
  </div>;
}
