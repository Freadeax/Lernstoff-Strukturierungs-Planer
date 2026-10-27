import { useMemo, useState } from 'react';
import type { DrugProfile } from '../../../modules/catalog-types';
import { navigate, useRoute } from '../../../ui/shell/router';
import { normalisiere, wirkstoffName } from '../erzeugen';
import { alleThemen, modul, type KartenCtx } from './kontext';

const THEMA_ARZNEIMITTEL = 'thema.ph.medikamente';

function Liste({ titel, punkte }: { titel: string; punkte?: string[] }) {
  if (!punkte?.length) return null;
  return (
    <>
      <h4>{titel}</h4>
      <ul className="karte__liste">{punkte.map((p, i) => <li key={i}>{p}</li>)}</ul>
    </>
  );
}

function Steckbrief({ d, gelernt, karten }: { d: DrugProfile; gelernt: number; karten: number }) {
  const themen = d.topicIds.filter((t) => t !== THEMA_ARZNEIMITTEL).map((t) => alleThemen.get(t)?.name).filter(Boolean);
  return (
    <li className="steckbrief">
      <details>
        <summary>
          <span className="steckbrief__kopf">
            <strong>{wirkstoffName(d)}</strong>
            <span className="muted">{d.drugClass}</span>
          </span>
          <span className="muted steckbrief__stand">{gelernt ? `${gelernt}/${karten} Karten gelernt` : `${karten} Karten`}</span>
        </summary>
        <div className="steckbrief__inhalt">
          {!!d.brandNames?.length && <p className="muted">Handelsnamen (Beispiele): {d.brandNames.join(', ')}</p>}
          <h4>Wirkung</h4>
          <p>{d.mechanism}</p>
          <Liste titel="Anwendung" punkte={d.indications} />
          <Liste titel="Wichtige Nebenwirkungen" punkte={d.adverseEffects} />
          <Liste titel="Nicht geben bei (Auswahl)" punkte={d.contraindications} />
          <Liste titel="Pflegerelevanz" punkte={d.nursing} />
          {d.antidote && <p><strong>Antidot:</strong> {d.antidote}</p>}
          {d.mnemonic && <p className="note">Merksatz: {d.mnemonic}</p>}
          {!!themen.length && <p className="muted">Themen: {themen.join(', ')}</p>}
          <p className="karte__belege muted">
            Quelle: {d.sources.map((q, i) => <span key={q.url}>{i > 0 && ' · '}<a href={q.url} target="_blank" rel="noopener noreferrer">{q.title}</a></span>)}
            {d.pruefstatus !== 'geprueft' ? ' · noch ungeprüft' : ''}
          </p>
        </div>
      </details>
    </li>
  );
}

/** Nachschlagen: alle Medikamenten-Steckbriefe mit Suche, Lernstand je Wirkstoff und Start einer Sitzung. */
export function Steckbriefe({ ctx }: { ctx: KartenCtx }) {
  // ?q= kommt z. B. aus einem Krankheitsbild-Steckbrief, der auf einen Wirkstoff verlinkt
  const { params } = useRoute();
  const [suche, setSuche] = useState(params.get('q') ?? '');
  const profile = modul.drugProfiles ?? [];
  const stand = useMemo(() => {
    const m = new Map<string, { karten: number; gelernt: number }>();
    for (const k of ctx.daten.modul) {
      if (k.quelle !== 'arzneimittel' || !k.ref) continue;
      const e = m.get(k.ref) ?? { karten: 0, gelernt: 0 };
      e.karten++;
      if (ctx.daten.staende.get(k.id)?.reps) e.gelernt++;
      m.set(k.ref, e);
    }
    return m;
  }, [ctx.daten]);
  const treffer = useMemo(() => {
    const q = normalisiere(suche);
    const liste = q
      ? profile.filter((d) => [d.substance, d.abbreviation, d.drugClass, ...(d.brandNames ?? []), ...d.indications].some((x) => x && normalisiere(x).includes(q)))
      : profile;
    return [...liste].sort((a, b) => a.substance.localeCompare(b.substance, 'de'));
  }, [suche, profile]);

  return (
    <div className="stack-2">
      <div className="note warn">
        Lernhilfe für die Ausbildung, keine Dosierungs- oder Therapieanweisung. Angaben abgeglichen mit der Gelben Liste und Beipackzetteln, aber noch nicht gegen Lehrbuch oder Fachinformation geprüft. Es gelten ärztliche Anordnung, Fachinformation, Hausstandard und dein Unterrichtsmaterial.
      </div>
      <div className="card stack-2">
        <div className="karten__liste-kopf">
          <label className="field steckbrief__suche">Wirkstoff, Gruppe, Handelsname oder Anwendung
            <input type="search" value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="z. B. Betablocker, Lasix, Asthma" />
          </label>
          <button type="button" className="primary small" onClick={() => navigate(`/lernen/karten?thema=${encodeURIComponent(THEMA_ARZNEIMITTEL)}`)}
            disabled={!ctx.daten.config.arzneimittel}>
            Steckbrief-Karten lernen
          </button>
        </div>
        {!ctx.daten.config.arzneimittel && <p className="muted">Steckbrief-Karten sind unter „Stapel“ ausgeschaltet.</p>}
        <p className="muted">{treffer.length} von {profile.length} Wirkstoffen</p>
        <ul className="steckbriefe">
          {treffer.map((d) => <Steckbrief key={d.id} d={d} gelernt={stand.get(d.id)?.gelernt ?? 0} karten={stand.get(d.id)?.karten ?? 0} />)}
        </ul>
        {!treffer.length && <p className="muted">Kein Wirkstoff gefunden.</p>}
      </div>
    </div>
  );
}
