import { useMemo, useState } from 'react';
import { navigate, useRoute } from '../../ui/shell/router';
import { abgabenZu, eigeneFaelle, speichereEigenen } from '../klasse/speicher';
import { fristText } from '../klasse/teilen';
import { ART_LABEL, maxPunkte, neueId, type KlassenFall } from '../klasse/typen';
import { VORLAGE_GRUPPEN, VORLAGEN } from '../klasse/vorlagen';
import { bewertungenZu, klassen, klassenVonFall, ordneFallZu } from './speicher';
import { Seite } from './teile';
import { nameSchluessel } from './typen';
import { status } from './uebersicht';

/** Kopie mit neuer Kennung, z. B. für eine zweite Klasse oder das nächste Schuljahr. Abgaben bleiben beim Original. */
export function kopiereFall(f: KlassenFall): KlassenFall {
  return { ...f, id: neueId(), titel: `${f.titel} (Kopie)`, erstellt: new Date().toISOString(), frist: undefined };
}

function VorlageWahl() {
  const [vorlage, setVorlage] = useState('');
  return (
    <div className="card">
      <h2 className="lehrer__h">Aus einer Vorlage</h2>
      <p className="muted">Vorlagen bringen Erwartungshorizont und Checkliste mit. Du kannst alles anpassen, Punkte vergeben und Auswahlaufgaben ergänzen.</p>
      <label className="field">
        <span>Vorlage</span>
        <select value={vorlage} onChange={(e) => setVorlage(e.target.value)}>
          <option value="">Vorlage wählen …</option>
          {VORLAGE_GRUPPEN.map((g) => (
            <optgroup key={g.art} label={g.label}>
              {VORLAGEN.filter((v) => v.art === g.art).map((v) => <option key={v.id} value={v.id}>{v.titel}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="row klasse__knoepfe">
        <button type="button" className="primary" disabled={!vorlage} onClick={() => navigate(`/lernen/klasse/neu?vorlage=${encodeURIComponent(vorlage)}`)}>Vorlage anpassen</button>
      </div>
    </div>
  );
}

export default function Aufgaben() {
  const { params } = useRoute();
  const [stand, setStand] = useState(0);
  const [filter, setFilter] = useState(params.get('klasse') ?? '');
  const ks = useMemo(() => { void stand; return klassen(); }, [stand]);
  const liste = useMemo(() => {
    void stand;
    const jetzt = new Date();
    return eigeneFaelle().map((f) => {
      const ab = abgabenZu(f.id);
      const bw = bewertungenZu(f.id);
      const st = ab.map((a) => status(f, a, bw[nameSchluessel(a.name)], jetzt));
      return { f, abgaben: ab.length, bewertet: st.filter((s) => s === 'bewertet').length, offen: st.filter((s) => s === 'abgegeben' || s === 'verspaetet' || s === 'neu').length, klassen: klassenVonFall(f.id) };
    });
  }, [stand]);
  const sichtbar = filter ? liste.filter((x) => x.klassen.some((k) => k.id === filter)) : liste;

  function kopieren(f: KlassenFall) {
    const neu = kopiereFall(f);
    if (speichereEigenen(neu)) navigate(`/lernen/klasse/neu?id=${neu.id}`);
  }

  return (
    <Seite titel="Fälle und Aufgaben" intro="Alle Fälle, die du verteilt hast. Von hier aus verteilst, bearbeitest und bewertest du sie."
      aktion={<button type="button" className="primary" onClick={() => navigate('/lernen/klasse/neu')}>Neuer Fall</button>}>
      {params.get('vorlage') && <VorlageWahl />}
      {ks.length > 0 && (
        <div className="pills klasse__tabs" role="radiogroup" aria-label="Nach Klasse filtern">
          <button type="button" role="radio" className="pill" aria-checked={!filter} onClick={() => setFilter('')}>Alle</button>
          {ks.map((k) => <button key={k.id} type="button" role="radio" className="pill" aria-checked={filter === k.id} onClick={() => setFilter(k.id)}>{k.name}</button>)}
        </div>
      )}
      {!sichtbar.length && (
        <div className="card">
          <p className="muted">{filter ? 'Dieser Klasse ist noch kein Fall zugeordnet.' : 'Noch kein Fall verteilt.'}</p>
          {!params.get('vorlage') && <button type="button" onClick={() => navigate('/lehren/aufgaben?vorlage=1')}>Aus Vorlage</button>}
        </div>
      )}
      <div className="lehrer__faelle">
        {sichtbar.map(({ f, abgaben, bewertet, offen, klassen: ihre }) => {
          const max = maxPunkte(f);
          return (
            <article key={f.id} className="card lehrer__fall">
              <div className="klasse__kopf">
                <span className="badge badge--demo">{ART_LABEL[f.art]}</span>
                {f.frist && <span className="muted">bis {fristText(f.frist)}</span>}
              </div>
              <h2 className="lehrer__h">{f.titel}</h2>
              <p className="muted">
                {f.aufgaben.length} Aufgaben{max ? ` · ${max} Punkte` : ' · ohne Punkte'} · {abgaben} Abgaben · {bewertet} bewertet{offen ? ` · ${offen} offen` : ''}
              </p>
              {ks.length > 0 && (
                <details className="klasse__block">
                  <summary>Klassen: {ihre.length ? ihre.map((k) => k.name).join(', ') : 'keine'}</summary>
                  {ks.map((k) => (
                    <label key={k.id} className="lehrer__haken">
                      <input type="checkbox" checked={ihre.some((x) => x.id === k.id)} onChange={(e) => { ordneFallZu(f.id, k.id, e.target.checked); setStand((n) => n + 1); }} />
                      <span>{k.name}</span>
                    </label>
                  ))}
                </details>
              )}
              <div className="row klasse__knoepfe">
                <button type="button" className={offen ? 'primary' : ''} onClick={() => navigate(`/lehren/bewerten?fall=${f.id}`)}>{offen ? `Bewerten (${offen})` : 'Abgaben und Bewertung'}</button>
                <button type="button" onClick={() => navigate(`/lernen/klasse/lehrkraft?id=${f.id}`)}>Verteilen</button>
                <button type="button" className="ghost" onClick={() => navigate(`/lernen/klasse/neu?id=${f.id}`)}>Bearbeiten</button>
                <button type="button" className="ghost" onClick={() => kopieren(f)}>Kopie</button>
              </div>
            </article>
          );
        })}
      </div>
    </Seite>
  );
}
