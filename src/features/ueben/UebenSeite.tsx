import { useMemo, useState } from 'react';
import './ueben.css';
import { Icon } from '../../ui/icons';
import type { CatalogModule } from '../../modules/catalog-types';
import { modules } from '../../modules/registry';
import { ceListe } from '../ce/modell';
import { DAUER_LABEL, OFFLINE_LABEL, passt, STUFE_LABEL, UEBUNG_INFO, zuordnung, type DauerFilter, type Filter } from './katalog';
import { PageHeading } from '../../ui/PageHeading';
import { uebenGruppen } from '../../ui/shell/nav';

/** Kurzbeschreibung je Übung (Menü-ID), damit man ohne Ausprobieren weiß, was einen erwartet. */
const TEXT: Record<string, string> = {
  krankheitsbilder: 'Steckbriefe mit Belegen, dazu Fallaufgaben.',
  anatomie: 'Organe, Lage und Funktion abfragen.',
  arzneimittel: 'Wirkstoffe, Wirkung, Nebenwirkungen, Beobachtung.',
  normwerte: 'Vitalwerte und Labor sicher einordnen.',
  hygiene: 'Händehygiene, Schutzausrüstung, Erreger.',
  expertenstandards: 'Die DNQP-Standards und ihre Kernaussagen.',
  recht: 'Haftung, Schweigepflicht, Betreuung, Delegation.',
  rechnen: 'Dosierung, Infusion, Bilanz. Mit Rechenweg.',
  duell: 'Fachbegriffe gegen die Uhr.',
  mindmap: 'Zusammenhänge selbst ordnen.',
  praxis: 'Eine Schicht übernehmen. Ohne KI, offline.',
  fall: 'Pflegefall im Dialog mit der KI.',
  notfall: 'Erkennen, handeln, Reihenfolge einhalten.',
  diagnostik: 'Blutentnahme, Befunde, Röntgen und CT lesen.',
  labor: 'Laborwerte, Präanalytik und Blutgas einordnen.',
  hoeren: 'Herz, Lunge, Darm, Alarme und Blutdruck nach Gehör.',
  assessment: 'Braden, Barthel, Schmerzskalen an Fällen.',
  pflegeplanung: 'Probleme, Ziele, Maßnahmen formulieren.',
  sis: 'Strukturierte Informationssammlung üben.',
  bericht: 'Pflegeberichte sachlich und knapp schreiben.',
  uebergabe: 'Übergaben strukturiert sprechen oder schreiben.',
  simulation: 'Klausur unter Prüfungsbedingungen.',
  examen: 'Termine, Checkliste und Schwächen-Radar.',
  fehler: 'Deine Fehler gezielt wiederholen.',
  klasse: 'Fälle mit der Klasse teilen und auswerten.',
};

const UNTERTITEL: Record<string, string> = {
  fachwissen: 'Wissen abfragen und festigen.',
  'praxis-gruppe': 'Mit Fällen und Dokumentation anwenden.',
  'pruefung-gruppe': 'Unter Prüfungsbedingungen testen.',
};

const modul = modules[0] as CatalogModule;

/** „Üben“: alle Trainer in drei Bündeln statt einer langen Liste, mit Filtern und „Was landet wo“. */
export default function UebenSeite() {
  const [f, setF] = useState<Filter>({});
  const z = useMemo(() => zuordnung(modul), []);
  const ces = useMemo(() => ceListe(modul).filter((c) => [...z.ce.values()].some((s) => s.has(c.id))), [z]);
  const faecher = useMemo(() => modul.subjects.filter((s) => [...z.fach.values()].some((x) => x.has(s.id))), [z]);
  const set = (p: Partial<Filter>) => setF((alt) => ({ ...alt, ...p }));
  const aktiv = !!(f.ce || f.fach || f.dauer || f.nurOffline || f.stufe);
  const gruppen = uebenGruppen().map((g) => ({ ...g, children: g.children!.filter((t) => passt(t.id, f, z)) })).filter((g) => g.children.length);
  const anzahl = gruppen.reduce((n, g) => n + g.children.length, 0);
  return (
    <section className="page ueben">
      <PageHeading bild="ueben" eyebrow="Vom Verstehen zum Anwenden" title="Üben"
        description="Fachwissen festigen, in der Praxis anwenden, auf die Prüfung vorbereiten. Welche Übung zu einem Thema passt, steht auch auf jeder Themenseite." />
      <p className="note">Tägliche Wiederholung: <a href="#/lernen/karten">Karteikarten</a>. Geführt durch eine CE: <a href="#/lernen/ce">Curriculare Einheiten</a>.</p>
      <div className="card ueben__filter" role="group" aria-label="Übungen filtern">
        <label>CE
          <select value={f.ce ?? ''} onChange={(e) => set({ ce: e.target.value || undefined })}>
            <option value="">alle</option>
            {ces.map((c) => <option key={c.id} value={c.id}>{c.code} {c.name}</option>)}
          </select>
        </label>
        <label>Fach
          <select value={f.fach ?? ''} onChange={(e) => set({ fach: e.target.value || undefined })}>
            <option value="">alle</option>
            {faecher.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <div className="pills" role="group" aria-label="Dauer">
          {(Object.keys(DAUER_LABEL) as DauerFilter[]).map((d) => (
            <button key={d} type="button" className="pill" aria-pressed={f.dauer === d} onClick={() => set({ dauer: f.dauer === d ? undefined : d })}>{DAUER_LABEL[d]}</button>
          ))}
        </div>
        <div className="pills" role="group" aria-label="Stufe">
          <button type="button" className="pill" aria-pressed={f.stufe === 'einstieg'} onClick={() => set({ stufe: f.stufe === 'einstieg' ? undefined : 'einstieg' })}>Einstieg</button>
          <button type="button" className="pill" aria-pressed={f.stufe === 'fortgeschritten'} onClick={() => set({ stufe: f.stufe === 'fortgeschritten' ? undefined : 'fortgeschritten' })}>Fortgeschritten</button>
        </div>
        <label className="check"><input type="checkbox" checked={!!f.nurOffline} onChange={(e) => set({ nurOffline: e.target.checked || undefined })} /><span>Nur ohne KI</span></label>
        {aktiv && <span className="muted ueben__treffer" aria-live="polite">{anzahl} {anzahl === 1 ? 'Übung' : 'Übungen'} <button type="button" className="link" onClick={() => setF({})}>Filter zurücksetzen</button></span>}
      </div>
      {!anzahl && <p className="muted">Keine Übung passt zu diesen Filtern.</p>}
      {gruppen.map((g) => (
        <section key={g.id} className="ueben__gruppe" aria-labelledby={`ueben-${g.id}`}>
          <div className="section-heading"><div><h2 id={`ueben-${g.id}`}>{g.label}</h2>{UNTERTITEL[g.id] && <span className="muted">{UNTERTITEL[g.id]}</span>}</div></div>
          <ul className="ueben__liste" role="list">
            {g.children.map((t) => {
              const info = UEBUNG_INFO[t.id];
              return (
                <li key={t.id} className="ueben__karte m-rise">
                  <a className="ueben__link" href={`#${t.path}`}>
                    {t.icon && <span className="ueben__icon" aria-hidden="true"><Icon name={t.icon} size={20} /></span>}
                    <span><strong>{t.label}</strong>{TEXT[t.id] && <small>{TEXT[t.id]}</small>}
                      {info && <small className="ueben__meta">{info.minuten} min · {OFFLINE_LABEL[info.offline]} · {STUFE_LABEL[info.stufe]}</small>}</span>
                    <Icon name="chevronRight" size={16} />
                  </a>
                  {info && (
                    <details className="ueben__wohin">
                      <summary>Was landet wo?</summary>
                      <dl>
                        <dt>Lernstand</dt><dd>{info.lernstand ?? 'Nichts, reine Übung.'}</dd>
                        <dt>Fehlerheft</dt><dd>{info.fehlerheft ?? 'Nichts.'}</dd>
                      </dl>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </section>
  );
}
