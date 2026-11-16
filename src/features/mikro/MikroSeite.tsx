import './mikro.css';
import { useEffect, useMemo, useState } from 'react';
import type { CatalogModule } from '../../modules/catalog-types';
import { getModule, modules } from '../../modules/registry';
import { PageHeading } from '../../ui/PageHeading';
import { useStore } from '../../ui/lib/store';
import { navigate, useRoute } from '../../ui/shell/router';
import { session } from '../../ui/shell/session';
import { registerFuer } from '../qm/register';
import { Runde, type RundenErgebnis } from '../quiz/Runde';
import { uebungenFuer } from '../lernplan/trainer';
import { merkeThema } from '../thema/letztesThema';
import { karteZumThema, kurzWissen, ladePools, waehleFragen, FRAGEN, type Pool } from './mikro';

const enc = encodeURIComponent;
const heute = () => new Date().toLocaleDateString('sv');

type Schritt = 'lesen' | 'fragen' | 'karte';

/**
 * Mikro-Einheit: ein Thema in etwa fünf Minuten. Kurz erklärt, drei Fragen, eine Karte.
 * Die Fragen kommen aus einem Übungstrainer und laufen über dieselbe Runde wie dort:
 * Fehler gehen ins Fehlerheft, das Ergebnis zählt im Lernplan (erster Versuch je Thema und Tag).
 */
export default function MikroSeite() {
  const { params } = useRoute();
  const id = params.get('id') ?? '';
  const moduleId = useStore(session, (s) => s.moduleId);
  const modul = (getModule(moduleId) ?? modules[0]) as CatalogModule;
  const topic = modul.topics.find((t) => t.id === id);
  const [pools, setPools] = useState<Pool[] | null>(null);
  const [ladeFehler, setLadeFehler] = useState(false);
  const [schritt, setSchritt] = useState<Schritt>('lesen');
  const [nr, setNr] = useState(0);
  const [ergebnis, setErgebnis] = useState<RundenErgebnis | null>(null);
  const [umgedreht, setUmgedreht] = useState(false);

  useEffect(() => { ladePools().then(setPools, () => setLadeFehler(true)); }, []);
  useEffect(() => { setSchritt('lesen'); setErgebnis(null); setUmgedreht(false); }, [id]);
  useEffect(() => { if (topic) merkeThema(id, topic.name); }, [id, topic]);

  const wissen = useMemo(() => kurzWissen(modul, id), [modul, id]);
  const fragen = useMemo(() => (pools ? waehleFragen(pools, id) : null), [pools, id, nr]);
  const karte = useMemo(() => karteZumThema(modul, id, wissen.begriffe.map((b) => b.term), heute()), [modul, id, wissen]);

  if (!topic) {
    return (
      <section className="page">
        <PageHeading title="Thema nicht gefunden" description="Die 5-Minuten-Einheit startest du auf der Seite eines Themas." />
        <div className="row"><button type="button" className="primary" onClick={() => navigate('/lernen/themen')}>Zur Themenliste</button></div>
      </section>
    );
  }

  const zumThema = () => navigate(`/lernen/thema?id=${enc(id)}`);
  const register = fragen ? registerFuer(fragen.quelle) : undefined;
  const ohneFragen = pools && !fragen;
  const andere = uebungenFuer(id, modul).filter((u) => u.trainer !== 'fall' && u.trainer !== 'praxis').slice(0, 4);
  const schritte: Array<{ id: Schritt; label: string }> = [
    { id: 'lesen', label: 'Kurz erklärt' }, { id: 'fragen', label: `${FRAGEN} Fragen` }, { id: 'karte', label: 'Eine Karte' },
  ];
  const stelle = schritte.findIndex((s) => s.id === schritt);

  return (
    <section className="page mikro">
      <div><button type="button" className="link" onClick={zumThema}>← {topic.name}</button></div>
      <PageHeading eyebrow="5-Minuten-Einheit" title={topic.name}
        description="Kurz erklärt, drei Fragen, eine Karte zum Mitnehmen. Fehler landen im Fehlerheft, das Ergebnis zählt im Lernplan." />

      <ol className="mikro__schritte" aria-label="Ablauf">
        {schritte.map((s, i) => (
          <li key={s.id} className={i < stelle ? 'mikro__schritt mikro__schritt--fertig' : i === stelle ? 'mikro__schritt mikro__schritt--jetzt' : 'mikro__schritt'}
            aria-current={i === stelle ? 'step' : undefined}>{i + 1}. {s.label}</li>
        ))}
      </ol>

      {schritt === 'lesen' && (
        <div className="card mikro__karte">
          <h2>Kurz erklärt</h2>
          {wissen.begriffe.length > 0 ? (
            <dl className="mikro__begriffe">
              {wissen.begriffe.map((b) => <div key={b.term}><dt>{b.term}</dt><dd>{b.definition}</dd></div>)}
            </dl>
          ) : <p className="muted">Zu diesem Thema stehen noch keine Fachbegriffe im Katalog. Lies kurz in deinem Skript nach.</p>}
          {wissen.krankheitsbilder.slice(0, 2).map((k) => (
            <div key={k.id} className="mikro__kb">
              <strong>{k.name}</strong>
              <p>{k.definition}</p>
              {k.merksatz && <p className="mikro__merksatz">Merksatz: {k.merksatz}</p>}
              <button type="button" className="link" onClick={() => navigate(`/lernen/krankheitsbilder?kb=${enc(k.id)}`)}>Steckbrief öffnen</button>
            </div>
          ))}
          <p className="muted mikro__hinweis">Katalogwissen, ergänzend. Bei Abweichungen gilt dein Unterrichtsmaterial.</p>
          <div className="row">
            <button type="button" className="primary" disabled={!pools && !ladeFehler} onClick={() => setSchritt(fragen ? 'fragen' : 'karte')}>
              {!pools && !ladeFehler ? 'Fragen werden geladen …' : fragen ? 'Weiter zu den Fragen' : 'Weiter zur Karte'}
            </button>
          </div>
          {(ohneFragen || ladeFehler) && (
            <p className="muted">{ladeFehler ? 'Die Fragen konnten nicht geladen werden.' : `Für dieses Thema gibt es noch keine ${FRAGEN} kurzen Fragen in einem Trainer.`} Die Einheit geht mit der Karte weiter.</p>
          )}
        </div>
      )}

      {schritt === 'fragen' && fragen && (
        ergebnis ? (
          <div className="card mikro__karte">
            <h2>{ergebnis.richtig} von {ergebnis.anzahl} richtig</h2>
            <p className="muted">{ergebnis.richtig === ergebnis.anzahl ? 'Sitzt. Die Karte festigt es.' : 'Die falschen Fragen stehen im Fehlerheft und kommen in ein paar Tagen wieder.'}</p>
            <div className="row">
              <button type="button" className="primary" onClick={() => setSchritt('karte')}>Weiter zur Karte</button>
              {register && <button type="button" onClick={() => navigate(register.pfad)}>Mehr im {register.name}-Trainer</button>}
            </div>
          </div>
        ) : (
          <Runde key={nr} aufgaben={fragen.aufgaben} quelle={fragen.quelle} trainer={fragen.quelle} minProThema={FRAGEN}
            grundlage={register?.grundlage}
            onFertig={setErgebnis} onNeu={() => { setNr((n) => n + 1); setErgebnis(null); }} onEnde={() => setSchritt('karte')} />
        )
      )}

      {schritt === 'karte' && (
        <div className="card mikro__karte">
          <h2>Eine Karte zum Mitnehmen</h2>
          {karte ? (
            <button type="button" className="mikro__flip" aria-expanded={umgedreht} onClick={() => setUmgedreht((u) => !u)}>
              <span className="mikro__vorne">{karte.term}</span>
              {umgedreht ? <span className="mikro__hinten">{karte.definition}</span> : <span className="muted">Erst selbst erklären, dann zum Umdrehen tippen</span>}
            </button>
          ) : <p className="muted">Zu diesem Thema gibt es noch keine Karte aus dem Katalog.</p>}
          <div className="row">
            <button type="button" className="primary" onClick={zumThema}>Fertig, zurück zum Thema</button>
            <button type="button" onClick={() => navigate(`/lernen/karten?thema=${enc(id)}`)}>Alle Karten zum Thema</button>
          </div>
          {andere.length > 0 && (
            <div className="mikro__weiter">
              <span className="muted">Weiterüben:</span>
              {andere.map((u) => <button key={u.path} type="button" className="small ghost" onClick={() => navigate(u.path)}>{u.label}</button>)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
