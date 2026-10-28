import { useState } from 'react';
import type { CatalogTopic } from '../../modules/catalog-types';
import { notify } from '../../ui/shell/notifications';
import { navigate } from '../../ui/shell/router';
import { addDays, daysBetween } from '../lernplan/dates';
import { deleteExam, saveExam } from '../lernplan/store';
import { blockTitel, dauer, inTagen, kurzDatum, langDatum } from '../lernplan/ui/format';
import type { PlanCtx } from '../lernplan/ui/usePlan';
import { ceWoche } from './lernpfad';
import type { Ce } from './modell';
import { baueCePruefung, findeCePruefung, themenAbgleich } from './pruefung';

const ARTEN = [
  { w: 1, label: 'Klausur oder Test' },
  { w: 2, label: 'Wichtige Prüfung' },
  { w: 3, label: 'Abschlussprüfung' },
];

/** Prüfungstermin der CE eintragen oder ändern. Darunter die Woche mit allen Blöcken dieser CE. */
export function CePruefung({ ce, themen, ctx }: { ce: Ce; themen: CatalogTopic[]; ctx: PlanCtx }) {
  const exam = findeCePruefung(ctx.data.exams, ce.id);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [datum, setDatum] = useState(exam?.date ?? '');
  const [gewicht, setGewicht] = useState(exam ? ctx.data.config.examWeights[exam.id] ?? 1 : 1);
  const [busy, setBusy] = useState(false);
  const morgen = addDays(ctx.data.today, 1);
  const prognose = exam && ctx.forecasts.find((f) => f.examId === exam.id);
  const abgleich = exam ? themenAbgleich(exam, themen.map((t) => t.id)) : undefined;

  const speichere = async (themenNeu = false) => {
    if (!datum || (!exam && datum < morgen)) { notify('warning', 'Wähle einen Prüfungstag ab morgen.'); return; }
    if (!themen.length) { notify('warning', 'Diese CE hat noch keine Themen.'); return; }
    setBusy(true);
    try {
      await saveExam(baueCePruefung(ce, themen, datum, exam, themenNeu || !exam), gewicht);
      notify('info', exam ? 'CE-Prüfung geändert, Plan neu berechnet' : 'CE-Prüfung eingetragen, Plan neu berechnet');
      setBearbeiten(false);
    } catch (e) {
      notify('critical', 'Prüfung nicht gespeichert', e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const loesche = async () => {
    if (!exam || !confirm(`Prüfung „${exam.name}“ löschen? Der Lernplan verteilt den Stoff dann ohne diesen Termin.`)) return;
    try { await deleteExam(exam); setDatum(''); notify('info', 'CE-Prüfung gelöscht'); } catch (e) { notify('critical', 'Nicht gelöscht', e instanceof Error ? e.message : String(e)); }
  };

  const formular = (
    <form className="ce-termin__form" onSubmit={(e) => { e.preventDefault(); void speichere(); }}>
      <label className="field">
        <span>Prüfungstermin</span>
        <input type="date" required value={datum} min={exam ? undefined : morgen} onChange={(e) => setDatum(e.target.value)} />
      </label>
      <label className="field">
        <span>Art der Prüfung</span>
        <select value={gewicht} onChange={(e) => setGewicht(Number(e.target.value))}>
          {ARTEN.map((a) => <option key={a.w} value={a.w}>{a.label}</option>)}
        </select>
      </label>
      <div className="form-actions">
        {exam && <button type="button" className="ghost" onClick={() => { setBearbeiten(false); setDatum(exam.date); }}>Abbrechen</button>}
        <button type="submit" className="primary" disabled={busy || !datum}>{busy ? 'Wird gespeichert …' : exam ? 'Speichern' : 'Termin eintragen'}</button>
      </div>
    </form>
  );

  return (
    <section className="ce__abschnitt" aria-labelledby="ce-termin">
      <h2 id="ce-termin">Prüfung und Wochenplan</h2>
      <div className="card ce-termin">
        {!exam || bearbeiten ? (<>
          {!exam && <p className="muted">Trag ein, wann {ce.code} geprüft wird. Der Lernplan verteilt dann alle {themen.length} Themen bis dahin auf deine Lernzeit und plant Wiederholungen ein.</p>}
          {formular}
        </>) : (<>
          <div className="ce-termin__kopf">
            <div>
              <strong>{langDatum(exam.date)}</strong>
              <span className="muted">{inTagen(daysBetween(ctx.data.today, exam.date))} · {exam.topicIds.length} Themen · {ARTEN.find((a) => a.w === (ctx.data.config.examWeights[exam.id] ?? 1))?.label}</span>
            </div>
            <div className="ce-termin__knoepfe">
              <button type="button" className="small" onClick={() => { setDatum(exam.date); setBearbeiten(true); }}>Ändern</button>
              <button type="button" className="small ghost" onClick={loesche}>Löschen</button>
            </div>
          </div>
          {exam.date <= ctx.data.today && <p className="note">Der Termin ist vorbei. Trag den nächsten ein oder lösche ihn.</p>}
          {prognose && (
            <p className={`note${prognose.timeFeasible ? '' : ' warn'}`}>
              {prognose.timeFeasible ? 'Die Zeit reicht: ' : 'Die Zeit wird knapp: '}
              {dauer(prognose.requiredMinutes)} nötig, {dauer(prognose.availableMinutes)} verfügbar. {prognose.assessment}
            </p>
          )}
          {abgleich && (abgleich.fehlen.length > 0 || abgleich.zuviel.length > 0) && (
            <p className="note">
              Die Themen der CE haben sich geändert ({[abgleich.fehlen.length && `${abgleich.fehlen.length} neu`, abgleich.zuviel.length && `${abgleich.zuviel.length} nicht mehr in der CE`].filter(Boolean).join(', ')}).
              {' '}<button type="button" className="link" disabled={busy} onClick={() => void speichere(true)}>Prüfung auf die aktuellen Themen setzen</button>
            </p>
          )}
        </>)}
      </div>
      <CeWoche ce={ce} themen={themen} ctx={ctx} />
    </section>
  );
}

function CeWoche({ ce, themen, ctx }: { ce: Ce; themen: CatalogTopic[]; ctx: PlanCtx }) {
  const tage = ceWoche(ctx.plan.days, new Set(themen.map((t) => t.id)), ctx.data.today);
  const summe = tage.reduce((s, t) => s + t.minuten, 0);
  const mitBloecken = tage.filter((t) => t.blocks.length);
  if (!ctx.plan.days.length) return <p className="muted">Noch keine Prüfung im Lernplan, daher gibt es keinen Wochenplan.</p>;
  return (
    <div className="card ce-woche">
      <div className="ce__kopfzeile">
        <h3>Nächste 7 Tage für {ce.code}</h3>
        <button type="button" className="small ghost" onClick={() => navigate('/lernen/plan?ansicht=woche')}>Ganze Woche</button>
      </div>
      {mitBloecken.length ? (<>
        <p className="muted">{dauer(summe)} für {ce.code} eingeplant.</p>
        <ol className="ce-woche__tage">
          {mitBloecken.map((t) => (
            <li key={t.date}>
              <span className="ce-woche__tag">{t.date === ctx.data.today ? 'Heute' : kurzDatum(t.date)}</span>
              <ul>
                {t.blocks.map((b, i) => (
                  <li key={i} className={`mini mini--${b.kind}`}>
                    <span className="mini__art">{blockTitel(b)}</span>
                    <span className="mini__thema">{ctx.topics.get(b.topicId)?.name ?? b.topicId}</span>
                    <span className="muted">{b.minutes} Min.</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </>) : <p className="muted">In den nächsten 7 Tagen ist für {ce.code} nichts eingeplant{findeCePruefung(ctx.data.exams, ce.id) ? '' : ', weil die Themen zu keiner Prüfung gehören'}.</p>}
    </div>
  );
}
