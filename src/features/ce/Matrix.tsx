import { useMemo } from 'react';
import type { CatalogModule } from '../../modules/catalog-types';
import { PageHeading } from '../../ui/PageHeading';
import { navigate } from '../../ui/shell/router';
import type { PlanCtx } from '../lernplan/ui/usePlan';
import type { GeraeteDaten } from './daten';
import {
  ABSCHNITT_KURZ, ABSCHNITT_LABEL, alleCeMatrix, FREIGABE_LABEL, istWegVollstaendig, MATERIAL_LABEL, nachAbschnitt,
  type MatrixCe, type MatrixThema,
} from './matrix';
import { HERKUNFT_LABEL } from './modell';

const enc = encodeURIComponent;
const n = (x: number, eins: string, viele: string) => `${x} ${x === 1 ? eins : viele}`;

/** Ein Thema mit seinem Weg Quelle → Zuordnung → Übung → Abfrage. */
export function MatrixThemaZeile({ z }: { z: MatrixThema }) {
  const voll = istWegVollstaendig(z);
  return (
    <li className={`ce-matrix__thema${voll ? '' : ' ce-matrix__thema--luecke'}`}>
      <div className="ce-matrix__thema-kopf">
        <button type="button" className="link" onClick={() => navigate(`/lernen/thema?id=${enc(z.topicId)}`)}>{z.name}</button>
        <span className={`ce-matrix__marke ce-matrix__marke--${voll ? 'ok' : 'luecke'}`}>{voll ? 'Weg vollständig' : 'Weg mit Lücke'}</span>
      </div>
      <dl className="ce-matrix__dl">
        <div><dt>Zuordnung</dt><dd>{z.herkunft.map((h) => HERKUNFT_LABEL[h]).join(', ')}{z.teil ? ` · ${z.teil}` : ''}</dd></div>
        <div>
          <dt>Quelle</dt>
          <dd>
            {MATERIAL_LABEL[z.material]}
            {z.quellen.map((q) => (
              <span key={q.skriptId} className="ce-matrix__quelle">
                {' · '}<button type="button" className="link" onClick={() => navigate(`/lernen/skript?id=${enc(q.skriptId)}`)}>{q.titel}</button>
                {` (${q.belegt} von ${n(q.abschnitte, 'Abschnitt', 'Abschnitten')} belegt${q.luecken ? `, ${n(q.luecken, 'Lücke', 'Lücken')}` : ''})`}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt>Übung</dt>
          <dd>{[z.karten ? `${n(z.karten, 'Karteikarte', 'Karteikarten')}${z.kartenAusSkript ? ` (${z.kartenAusSkript} aus dem Skript)` : ''}` : '', ...z.uebungen].filter(Boolean).join(' · ') || 'Keine'}</dd>
        </div>
        <div>
          <dt>Abfrage</dt>
          <dd>{z.abfragbar ? (z.selbsttest ? 'Selbsttest möglich' : 'Über Trainer') : 'Nicht möglich'} · {z.abfragen ? `${n(z.abfragen, 'Abfrage', 'Abfragen')} gezählt` : 'noch keine gezählt'}</dd>
        </div>
        <div><dt>Freigabe</dt><dd>{FREIGABE_LABEL[z.freigabe]}{z.quellen.filter((q) => q.freigabe).map((q) => ` · ${q.freigabe!.von}, ${q.freigabe!.am}`).join('')}</dd></div>
      </dl>
      {!!z.fehlt.length && (
        <ul className="ce-matrix__fehlt" aria-label="Was fehlt">
          {z.fehlt.map((f) => <li key={f}>{f}</li>)}
        </ul>
      )}
    </li>
  );
}

function Kennzahlen({ m }: { m: MatrixCe }) {
  const s = m.summe;
  return (
    <ul className="ce-matrix__zahlen">
      <li><strong>{s.themen}</strong> Themen</li>
      <li><strong>{s.mitQuelle}</strong> mit Quelle{s.mitQuelle !== s.belegt ? ` (${s.belegt} voll belegt)` : ''}</li>
      <li><strong>{s.mitUebung}</strong> mit Übung</li>
      <li><strong>{s.abfragbar}</strong> abfragbar</li>
      <li><strong>{s.wegVollstaendig}</strong> Weg vollständig</li>
      <li><strong>{s.abgefragt}</strong> schon abgefragt</li>
      <li><strong>{s.skripteFreigegeben}/{s.skripte}</strong> Skripte fachlich freigegeben</li>
    </ul>
  );
}

/** Materialstand einer CE: Kennzahlen und je Thema der Weg von der Quelle bis zur Abfrage. */
export function MaterialStand({ m }: { m: MatrixCe }) {
  return (
    <section className="ce__abschnitt ce-matrix" aria-labelledby="ce-material">
      <h2 id="ce-material">Materialstand</h2>
      <p className="muted">
        {m.abschnitte.length ? `Ausbildungsabschnitt: ${m.abschnitte.map((a) => ABSCHNITT_LABEL[a]).join(' und ')}. ` : ''}
        Je Thema: woher die Zuordnung kommt, welche Quelle es belegt, womit du übst und ob ein Ergebnis im Lernplan ankommt.
      </p>
      <Kennzahlen m={m} />
      <details className="ce-matrix__details">
        <summary>Alle {n(m.themen.length, 'Thema', 'Themen')} einzeln</summary>
        <ul className="ce-matrix__themen">{m.themen.map((z) => <MatrixThemaZeile key={z.topicId} z={z} />)}</ul>
      </details>
    </section>
  );
}

/** Matrix CE × Ausbildungsabschnitt × Thema × Quelle × Übung. */
export function Matrix({ modul, daten, ctx }: { modul: CatalogModule; daten: GeraeteDaten; ctx?: PlanCtx }) {
  const matrix = useMemo(() => alleCeMatrix(modul, { skripte: daten.skripte, karten: daten.karten, reviewLogs: ctx?.data.reviewLogs ?? [] }), [modul, daten.skripte, daten.karten, ctx]);
  const gruppen = useMemo(() => nachAbschnitt(matrix), [matrix]);
  return (
    <>
      <div><button type="button" className="link" onClick={() => navigate('/lernen/ce')}>← Alle curricularen Einheiten</button></div>
      <PageHeading title="Materialstand je CE" description="Für jede curriculare Einheit nach Ausbildungsabschnitt: Themen, belegte Quellen, Übungen, Abfragen und fachliche Freigabe. Quellen und Karteikarten zählen nur, was auf diesem Gerät liegt." />
      {gruppen.map((g) => (
        <section key={g.abschnitt} className="ce__abschnitt" aria-labelledby={`abschnitt-${g.abschnitt}`}>
          <h2 id={`abschnitt-${g.abschnitt}`}>{g.abschnitt === 'ohne' ? 'Ohne Ausbildungsabschnitt' : ABSCHNITT_LABEL[g.abschnitt]}</h2>
          <div className="ce-matrix__tabelle" role="region" aria-label={`Matrix ${g.abschnitt === 'ohne' ? 'ohne Abschnitt' : ABSCHNITT_KURZ[g.abschnitt]}`} tabIndex={0}>
            <table>
              <thead>
                <tr><th scope="col">CE</th><th scope="col">Themen</th><th scope="col">Mit Quelle</th><th scope="col">Mit Übung</th><th scope="col">Abfragbar</th><th scope="col">Weg vollständig</th><th scope="col">Abgefragt</th><th scope="col">Freigabe</th></tr>
              </thead>
              <tbody>
                {g.ces.map((m) => (
                  <tr key={m.ce.id}>
                    <th scope="row"><button type="button" className="link" onClick={() => navigate(`/lernen/ce?ce=${enc(m.ce.id)}#ce-material`)}>{m.ce.code}</button><span className="muted ce-matrix__name"> {m.ce.name}</span></th>
                    <td>{m.summe.themen}</td>
                    <td>{m.summe.mitQuelle}</td>
                    <td>{m.summe.mitUebung}</td>
                    <td>{m.summe.abfragbar}</td>
                    <td>{m.summe.wegVollstaendig}</td>
                    <td>{m.summe.abgefragt}</td>
                    <td>{m.summe.skripte ? `${m.summe.skripteFreigegeben} von ${n(m.summe.skripte, 'Skript', 'Skripten')}` : 'kein Skript'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <p className="muted">
        Die Zuordnung der CE zu den Ausbildungsdritteln folgt den Rahmenplänen der Fachkommission, ist aber noch nicht gegen deren Text geprüft.
        „Fachlich freigegeben“ heißt: Im Skriptkopf steht <code>freigabe: Datum, wer</code>. Ohne diesen Eintrag ist ein Skript belegt, aber von niemandem fachlich abgenommen.
      </p>
    </>
  );
}
