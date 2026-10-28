import { useMemo, useState } from 'react';
import { navigate } from '../../ui/shell/router';
import { heute as heuteTag } from '../lernplan/store';
import { kurzDatum } from '../lernplan/ui/format';
import { planePraktisch, tageBis, type EtappenStatus } from './praktisch';
import { useExamensModul } from './modul';
import { ladeCheckliste, speichereCheckliste, type Termine } from './speicher';

const STATUS_TEXT: Record<EtappenStatus, string> = { erledigt: 'erledigt', jetzt: 'jetzt dran', ueberfaellig: 'überfällig', spaeter: 'später' };
const STATUS_KLASSE: Record<EtappenStatus, string> = { erledigt: 'tag--wissen-sicher', jetzt: 'tag--info', ueberfaellig: 'tag--warning', spaeter: '' };

export function Praktisch({ termine, aendere }: { termine: Termine; aendere: (p: Partial<Termine>) => void }) {
  const FORMAT = (useExamensModul().modul.examFormats ?? []).find((f) => f.id === 'pruefung.staatlich.praktisch');
  const [erledigt, setErledigt] = useState<Set<string>>(ladeCheckliste);
  const heute = heuteTag();
  const plan = useMemo(() => planePraktisch(termine.praktisch, heute, erledigt), [termine.praktisch, heute, erledigt]);
  const tage = tageBis(termine.praktisch, heute);
  const gesamt = plan.reduce((n, e) => n + e.schritte.length, 0);
  const fertig = plan.reduce((n, e) => n + e.erledigt, 0);
  const umschalten = (key: string) => setErledigt((alt) => {
    const neu = new Set(alt);
    if (neu.has(key)) neu.delete(key); else neu.add(key);
    speichereCheckliste(neu);
    return neu;
  });

  return (
    <div className="stack-3">
      <div className="card examen__praktisch-kopf">
        <div>
          <h2>Praktische Prüfung</h2>
          <p className="muted">{tage === null ? 'Trag deinen Termin ein, dann rechnet der Plan rückwärts.' : tage < 0 ? 'Der Termin liegt in der Vergangenheit.' : tage === 0 ? 'Heute ist Prüfungstag. Viel Erfolg!' : `Noch ${tage} Tage · ${fertig} von ${gesamt} Schritten erledigt`}</p>
        </div>
        <label className="field">Prüfungstermin
          <input type="date" value={termine.praktisch} onChange={(e) => aendere({ praktisch: e.target.value })} />
        </label>
      </div>

      {FORMAT && (
        <details className="card examen__rahmen">
          <summary><strong>Was verlangt wird</strong> <span className="muted">(PflAPrV § 16, laut Katalog)</span></summary>
          <p>{FORMAT.details}</p>
          {!!FORMAT.teile?.length && (
            <ol className="examen__rahmen-teile">
              {FORMAT.teile.map((t) => <li key={t.code}><strong>{t.name}</strong>{t.details ? ` · ${t.details}` : ''}</li>)}
            </ol>
          )}
        </details>
      )}

      <ol className="examen__etappen" aria-label="Etappen bis zur praktischen Prüfung">
        {plan.map((e) => (
          <li key={e.id} className={`card examen__etappe examen__etappe--${e.status}`}>
            <div className="examen__etappe-kopf">
              <h3>{e.titel}</h3>
              <span className={`tag ${STATUS_KLASSE[e.status]}`}>{STATUS_TEXT[e.status]}</span>
            </div>
            <p className="muted examen__klein">{e.faelligAm ? `bis ${kurzDatum(e.faelligAm)} · ` : ''}{e.tageVorher === 1 ? 'am Tag davor' : `${Math.round(e.tageVorher / 7)} Wochen vorher`} · {e.erledigt}/{e.schritte.length}</p>
            <ul className="examen__schritte">
              {e.schritte.map((s) => {
                const key = `${e.id}.${s.id}`;
                return (
                  <li key={s.id}>
                    <label className="check">
                      <input type="checkbox" checked={erledigt.has(key)} onChange={() => umschalten(key)} />
                      <span>{s.text}</span>
                    </label>
                    {s.link && <button type="button" className="small ghost examen__schritt-link" onClick={() => navigate(s.link!.path)}>{s.link.label}</button>}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      <p className="muted examen__klein">Die Etappen sind ein Vorschlag zur Vorbereitung. Ablauf, Vorbereitungszeit und Form des Pflegeplans legt deine Schule fest. Abhaken wird nur auf diesem Gerät gespeichert.</p>
    </div>
  );
}
