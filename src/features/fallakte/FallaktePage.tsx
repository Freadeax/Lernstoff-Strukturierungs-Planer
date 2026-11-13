// Fallakte (#/lernen/fallakte): eine erfundene Person durch mehrere Trainer, vom Erstgespräch bis zur
// Übergabe. Geprüft wird in den Trainern selbst (offline, per Code); hier stehen Geschichte, Stand und Rückblick.
import { PageHeading } from '../../ui/PageHeading';
import { navigate, useRoute } from '../../ui/shell/router';
import { AKTEN } from './akten';
import { aktenStand, GUT_AB } from './stand';
import { ART_LABEL, schrittPfad, type Fallakte } from './typen';
import './fallakte.css';

const stufe = (p: number | undefined) => (p === undefined ? 'offen' : p >= GUT_AB ? 'gut' : 'teil');
const STUFE_TEXT = { offen: 'Noch offen', gut: 'Gut gelöst', teil: 'Bearbeitet' } as const;

function Uebersicht() {
  return (
    <section className="page fallakte">
      <PageHeading title="Fallakte" description="Eine Person, eine Woche, alle Dokumente: Du führst das Erstgespräch, schätzt Risiken ein, planst, dokumentierst und übergibst. Jeder Schritt wird offline geprüft und hat eine Musterlösung." />
      <div className="fallakte__liste">
        {AKTEN.map((a) => {
          const st = aktenStand(a);
          return (
            <article key={a.id} className="card fallakte__karte">
              <p className="muted">{a.setting}</p>
              <h2>{a.titel}</h2>
              <p>{a.kurz}</p>
              <p className="muted">{a.schritte.length} Schritte · {st.bearbeitet ? `${st.bearbeitet} bearbeitet, ${st.gut} gut gelöst` : 'noch nicht begonnen'}</p>
              <div className="row">
                <button type="button" onClick={() => navigate(`/lernen/fallakte?akte=${encodeURIComponent(a.id)}`)}>{st.bearbeitet ? 'Weiterarbeiten' : 'Fallakte öffnen'}</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Akte({ akte }: { akte: Fallakte }) {
  const st = aktenStand(akte);
  const fertig = st.bearbeitet === akte.schritte.length;
  return (
    <section className="page fallakte">
      <PageHeading eyebrow="Fallakte" title={akte.titel} description={`${akte.person} · ${akte.setting}`}
        action={<button type="button" className="ghost small" onClick={() => navigate('/lernen/fallakte')}>Alle Fallakten</button>} />

      <div className="card fallakte__einstieg">
        {akte.einstieg.map((t) => <p key={t}>{t}</p>)}
        <p className="muted">Erfundener Übungsfall. Jeder Schritt öffnet den passenden Trainer mit diesem Fall; dort prüft die Checkliste offline und zeigt nach dem Prüfen die Musterlösung. Dein Stand bleibt auf diesem Gerät.</p>
        {st.naechster && (
          <div className="row">
            <button type="button" onClick={() => navigate(schrittPfad(akte.id, st.naechster!))}>
              {st.bearbeitet ? `Weiter: ${st.naechster.titel}` : `Beginnen: ${st.naechster.titel}`}
            </button>
          </div>
        )}
      </div>

      <ol className="fallakte__zeitleiste" aria-label="Schritte der Fallakte">
        {akte.schritte.map((s, i) => {
          const p = st.prozente[i];
          const z = stufe(p);
          return (
            <li key={s.id} className={`card fallakte__schritt is-${z}`}>
              <div className="fallakte__schrittkopf">
                <span className="fallakte__nr" aria-hidden="true">{i + 1}</span>
                <div>
                  <p className="muted">{s.wann} · {ART_LABEL[s.art]}</p>
                  <h3>{s.titel}</h3>
                </div>
                <span className={`fallakte__status is-${z}`}>{STUFE_TEXT[z]}{p !== undefined ? ` · ${p} %` : ''}</span>
              </div>
              <p>{s.auftrag}</p>
              <div className="row">
                <button type="button" className={p === undefined ? '' : 'ghost'} onClick={() => navigate(schrittPfad(akte.id, s))}>
                  {p === undefined ? 'Bearbeiten' : 'Ansehen oder verbessern'}
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="card fallakte__rueckblick">
        <h2>Rückblick</h2>
        {fertig
          ? <p>Alle Schritte bearbeitet, im Mittel {st.gesamt} %. {st.gut === akte.schritte.length ? 'Jeder Schritt ist gut gelöst.' : `${akte.schritte.length - st.gut} Schritt${akte.schritte.length - st.gut === 1 ? '' : 'e'} unter ${GUT_AB} %: dort lohnt ein zweiter Versuch.`}</p>
          : <p className="muted">Die Fragen verbinden die Schritte. Am meisten bringen sie, wenn du alle Schritte bearbeitet hast ({st.bearbeitet} von {akte.schritte.length}).</p>}
        {akte.rueckblick.map((r) => (
          <details key={r.frage} className="fallakte__frage">
            <summary>{r.frage}</summary>
            <p>{r.antwort}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function FallaktePage() {
  const id = useRoute().params.get('akte');
  const akte = AKTEN.find((a) => a.id === id);
  return akte ? <Akte akte={akte} /> : <Uebersicht />;
}
