import { useMemo, useState } from 'react';
import '../karteikarten/ui/karteikarten.css';
import type { ID, MasteryStatus } from '../../core/types';
import { PageHeading } from '../../ui/PageHeading';
import { navigate } from '../../ui/shell/router';
import { Rueckseite } from '../karteikarten/ui/Sitzung';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';
import type { GeraeteDaten } from './daten';
import type { Ce, CeThema } from './modell';
import { ANTWORT_LABEL, FRAGEN_JE_THEMA, stelleTestZusammen, testbareThemen, werteAus, type Antwort, type Frage } from './selbsttest';

const UMFANG = [{ themen: 4, label: 'Kurz' }, { themen: 8, label: 'Lang' }];

/**
 * CE-Selbsttest: gemischte Fragen aus den Karteikarten mehrerer Themen. Wer „gewusst“ antwortet,
 * soll die Antwort vorher wirklich im Kopf gehabt haben; das Ergebnis zählt als Abfrage im Lernplan.
 */
export function Selbsttest({ ce, themen, daten, status, nurThema }: {
  ce: Ce; themen: CeThema[]; daten: GeraeteDaten; status: (id: ID) => MasteryStatus; nurThema?: ID;
}) {
  const ids = useMemo(() => themen.map((t) => t.topic.id), [themen]);
  const namen = useMemo(() => new Map(themen.map((t) => [t.topic.id, t.topic.name])), [themen]);
  const titles = useMemo(() => new Map(daten.skripte.map((s) => [`skript:${s.id}`, s.titel])), [daten.skripte]);
  const testbar = useMemo(() => testbareThemen(daten.karten, ids), [daten.karten, ids]);
  const [fragen, setFragen] = useState<Frage[] | null>(null);
  const [antworten, setAntworten] = useState<Antwort[]>([]);
  const [offen, setOffen] = useState(false);
  const { uebernahme, fehler, uebernimm, zuruecksetzen } = useLernplanUebernahme('selbsttest');
  const zurueck = () => navigate(`/lernen/ce?ce=${encodeURIComponent(ce.id)}`);

  const starte = (maxThemen: number) => {
    zuruecksetzen();
    setAntworten([]);
    setOffen(false);
    setFragen(stelleTestZusammen(daten.karten, ids, status, { maxThemen, nurThema: nurThema && testbar.has(nurThema) ? nurThema : undefined }));
  };

  const antworte = (a: Antwort) => {
    if (!fragen) return;
    const neu = [...antworten, a];
    setAntworten(neu);
    setOffen(false);
    if (neu.length === fragen.length) uebernimm(werteAus(fragen, neu));
  };

  const kopf = <PageHeading eyebrow={ce.code} title="Selbsttest" description={nurThema ? `Gezielt: ${namen.get(nurThema) ?? nurThema}` : `Gemischte Fragen aus ${ce.name}`} />;
  const zurueckKnopf = <div><button type="button" className="link" onClick={zurueck}>← Zurück zu {ce.code}</button></div>;

  // ------------------------------------------------ Start
  if (!fragen) {
    return (
      <>
        {zurueckKnopf}
        {kopf}
        <div className="card stack-2">
          {testbar.size ? (<>
            <p>Je Thema kommen {FRAGEN_JE_THEMA} Karteikarten, gemischt über die Themen. Überleg dir die Antwort, deck auf und sag ehrlich, ob du sie wusstest.</p>
            <p className="muted">Zuerst kommen Themen, die du erarbeitet, aber noch nie abgefragt hast, dann unsichere. Das Ergebnis je Thema zählt im Lernplan als Abfrage (nur der erste Versuch am Tag). Dein Kartenstand bleibt unverändert.</p>
            <div className="form-actions ce-test__start">
              {nurThema && testbar.has(nurThema)
                ? <button type="button" className="primary" onClick={() => starte(1)}>Test starten ({FRAGEN_JE_THEMA} Fragen)</button>
                : UMFANG.filter((_u, i) => i === 0 || testbar.size > UMFANG[0]!.themen).map((u) => {
                  const n = Math.min(u.themen, testbar.size);
                  return <button key={u.label} type="button" className={u.themen === 4 ? 'primary' : ''} onClick={() => starte(u.themen)}>{u.label}: {n} {n === 1 ? 'Thema' : 'Themen'}, {n * FRAGEN_JE_THEMA} Fragen</button>;
                })}
            </div>
            {nurThema && !testbar.has(nurThema) && <p className="note">Zu diesem Thema gibt es weniger als {FRAGEN_JE_THEMA} Karteikarten. Teste stattdessen die ganze CE.</p>}
          </>) : <p className="muted">Für einen Selbsttest braucht ein Thema mindestens {FRAGEN_JE_THEMA} Karteikarten. Lege im Skript oder in den Karteikarten welche an.</p>}
        </div>
      </>
    );
  }

  // ------------------------------------------------ Auswertung
  if (antworten.length >= fragen.length) {
    const ergebnis = werteAus(fragen, antworten);
    return (
      <>
        {zurueckKnopf}
        {kopf}
        <div className="card stack-2">
          <h2>Ergebnis</h2>
          <ul className="ce-test__ergebnis">
            {[...ergebnis].sort((a, b) => a.scorePercent - b.scorePercent).map((e) => (
              <li key={e.topicId}>
                <span>{namen.get(e.topicId) ?? e.topicId}</span>
                <span className={`ce-test__prozent${e.scorePercent < 60 ? ' ce-test__prozent--schwach' : ''}`}>{e.scorePercent} %</span>
              </li>
            ))}
          </ul>
          <LernplanHinweis uebernahme={uebernahme} fehler={fehler} />
          <div className="form-actions">
            <button type="button" className="ghost" onClick={zurueck}>Zum Lernpfad</button>
            <button type="button" onClick={() => setFragen(null)}>Neuer Test</button>
          </div>
        </div>
      </>
    );
  }

  // ------------------------------------------------ Frage
  const f = fragen[antworten.length]!;
  return (
    <>
      {zurueckKnopf}
      {kopf}
      <div className="karten__sitzung">
        <div className="karten__kopf">
          <span className="muted">Frage {antworten.length + 1} von {fragen.length}</span>
          <button type="button" className="small ghost" onClick={() => setFragen(null)}>Abbrechen</button>
        </div>
        <div className="ce-pfad__balken" role="progressbar" aria-valuemin={0} aria-valuemax={fragen.length} aria-valuenow={antworten.length}>
          <span style={{ width: `${(antworten.length / fragen.length) * 100}%` }} />
        </div>
        <article className={`card karte${offen ? ' is-offen' : ''}`} aria-live="polite">
          <div className="karte__meta">
            <span className="badge badge--demo">{namen.get(f.topicId)}</span>
            <span className="muted">{f.karte.art}</span>
          </div>
          <p className="karte__vorne">{f.karte.vorne}</p>
          {offen && <Rueckseite karte={f.karte} titles={titles} />}
        </article>
        <div className="karten__aktionen">
          {!offen
            ? <button type="button" className="primary karten__aufdecken" onClick={() => setOffen(true)}>Antwort zeigen</button>
            : (
              <div className="ce-test__antworten" role="group" aria-label="Wusstest du es?">
                {(['nicht', 'teilweise', 'gewusst'] as Antwort[]).map((a) => (
                  <button key={a} type="button" className={`ce-test__antwort ce-test__antwort--${a}`} onClick={() => antworte(a)}>{ANTWORT_LABEL[a]}</button>
                ))}
              </div>
            )}
        </div>
      </div>
    </>
  );
}
