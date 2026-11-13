import { useEffect, useMemo, useState } from 'react';
import './qm.css';
import { PageHeading } from '../../ui/PageHeading';
import { notify } from '../../ui/shell/notifications';
import { useRoute } from '../../ui/shell/router';
import { kopiere } from '../klasse/teilen';
import { db } from '../../core/db';
import type { CatalogModule } from '../../modules/catalog-types';
import { modules } from '../../modules/registry';
import { STUFE_LABEL, type Stufe } from '../quiz/quiz';
import { TRAINER_POOLS } from '../simulation/trainerpool';
import { gesammelte } from '../testphase/testphase';
import { PROFIL_FREIGABE, NOTFALL_FREIGABE } from '../notfall/freigaben';
import { STATUS_TEXT, type Freigabe } from '../../ui/sim/freigabe';
import { TRAINER_REGISTER } from './register';
import { abdeckung, LUECKE_LABEL, LUECKE_RANG, mitStufe, summiere, type Luecke, type Pool } from './abdeckung';
import { GRUND_LABEL, ladeMeldungen, loescheMeldung, setzeStatus, STATUS_LABEL as MELDE_STATUS, uebernimmMeldungen, type Grund, type Meldung, type MeldeStatus } from './meldungen';
import { ladeStatistik } from './statistik';
import { entferneVermerk, ladeVermerke, setzeVermerk, STATUS_LABEL, trainerStand, vermerkText, type Status } from './pruefstand';
import { laengenQuote, pruefeAlle, REGELN, zaehleRegeln, type RegelId } from './pruefregeln';
import { NEUERE_FASSUNGEN } from './aktualitaet';
import { veralteteSaetze, verwurfQuote, type Fragensatz, type VeralteterSatz } from './ki';
import { ART_LABEL, PRIO_LABEL, ueberarbeitungsliste, type Art, type Eintrag } from './ueberarbeitung';

const modul = modules[0] as CatalogModule;
const heute = () => new Date().toISOString().slice(0, 10);
const datum = (iso?: string) => (iso ? iso.slice(0, 10).split('-').reverse().join('.') : '');

const POOLS: Pool[] = TRAINER_POOLS.map((p) => ({ ...p, pfad: TRAINER_REGISTER.find((r) => r.quelle === p.quelle)?.pfad ?? '/lernen/ueben' }));
const NAME = new Map(POOLS.map((p) => [p.quelle, p.name]));
const WEITERE_FREIGABEN: Array<{ name: string; pfad: string; freigabe: Freigabe }> = [
  ...Object.entries(PROFIL_FREIGABE).map(([id, f]) => ({ name: `Reanimation ${id}`, pfad: '/lernen/notfall?modus=rea', freigabe: f })),
  ...Object.entries(NOTFALL_FREIGABE).map(([id, f]) => ({ name: `ABCDE ${id}`, pfad: '/lernen/notfall?modus=abcde', freigabe: f })),
];

type Ansicht = 'ueberblick' | 'liste' | 'abdeckung' | 'pruefstand' | 'regeln';
const ANSICHTEN: Array<{ id: Ansicht; label: string }> = [
  { id: 'ueberblick', label: 'Überblick' },
  { id: 'liste', label: 'Überarbeitungsliste' },
  { id: 'abdeckung', label: 'Abdeckung' },
  { id: 'pruefstand', label: 'Prüfstand' },
  { id: 'regeln', label: 'So prüft die App' },
];

/** Gesammelte Rückmeldungen mit gemeldeter Frage werden zu Meldungen (gleiche ID, also nur einmal). */
function ausRueckmeldungen(): Meldung[] {
  return gesammelte().filter((r) => r.frage).map((r) => ({
    id: `r-${r.id}`, quelle: r.frage!.quelle, aufgabeId: r.frage!.aufgabeId, fp: r.frage!.fp, titel: r.frage!.titel, frage: r.frage!.frage,
    grund: (r.frage!.grund in GRUND_LABEL ? r.frage!.grund : 'sonstiges') as Grund, notiz: r.text, antwort: r.frage!.antwort,
    erstellt: r.erstellt, status: 'offen' as const, von: r.name ?? 'Testgruppe',
  }));
}

function useDaten() {
  const [meldungen, setMeldungen] = useState<Meldung[]>(() => { uebernimmMeldungen(ausRueckmeldungen()); return ladeMeldungen(); });
  const [vermerke, setVermerke] = useState(ladeVermerke);
  const [ki, setKi] = useState<{ veraltet: VeralteterSatz[]; erzeugt: number; verworfen: number }>({ veraltet: [], erzeugt: 0, verworfen: 0 });
  useEffect(() => {
    let aus = false;
    Promise.all([db.summaries.where('mode').equals('pruefung').toArray(), db.documents.toArray()])
      .then(([s, d]) => { if (!aus) { const saetze = s as unknown as Fragensatz[]; setKi({ veraltet: veralteteSaetze(saetze, d), ...verwurfQuote(saetze) }); } })
      .catch(() => { /* ohne Datenbank (privater Modus): KI-Teil bleibt leer */ });
    return () => { aus = true; };
  }, []);
  const statistik = useMemo(ladeStatistik, []);
  const liste = useMemo(() => ueberarbeitungsliste({
    pools: POOLS, register: TRAINER_REGISTER, meldungen, statistik, vermerke, weitereFreigaben: WEITERE_FREIGABEN, veralteteKi: ki.veraltet, heute: heute(),
  }), [meldungen, statistik, vermerke, ki]);
  return { meldungen, setMeldungen, vermerke, setVermerke, ki, statistik, liste };
}

// ---------------------------------------------------------------- Überblick

function Zahl({ label, wert, ton }: { label: string; wert: string | number; ton?: 'gut' | 'warn' | 'kritisch' }) {
  return <div className={`qm-zahl${ton ? ` qm-zahl--${ton}` : ''}`}><dt>{label}</dt><dd>{wert}</dd></div>;
}

function Ueberblick({ d }: { d: ReturnType<typeof useDaten> }) {
  const ab = useMemo(() => summiere(abdeckung(modul, POOLS)), []);
  const staende = POOLS.map((p) => trainerStand(p.quelle, p.aufgaben, heute(), undefined, d.vermerke));
  const geprueft = staende.filter((s) => s.status === 'geprueft').length;
  const prio1 = d.liste.filter((e) => e.prio === 1).length;
  const offen = d.meldungen.filter((m) => m.status === 'offen' || m.status === 'in-arbeit').length;
  const quellen = POOLS.filter((p) => TRAINER_REGISTER.some((r) => r.quelle === p.quelle && r.freigabe.quellen.length)).length;
  return (
    <div className="qm-spalte">
      <section className="card">
        <h2>Stand der Inhalte</h2>
        <dl className="qm-zahlen">
          <Zahl label="Fragen in den Trainern" wert={ab.aufgaben} />
          <Zahl label="Themen mit Fragen" wert={`${ab.mitFragen} von ${ab.themen}`} ton={ab.mitFragen / ab.themen >= 0.8 ? 'gut' : 'warn'} />
          <Zahl label="Transferaufgaben" wert={`${Math.round((ab.stufen[3] / Math.max(1, ab.aufgaben)) * 100)} %`} ton={ab.stufen[3] / Math.max(1, ab.aufgaben) >= 0.2 ? 'gut' : 'warn'} />
          <Zahl label="Trainer mit Quellenangabe" wert={`${quellen} von ${POOLS.length}`} ton={quellen === POOLS.length ? 'gut' : 'warn'} />
          <Zahl label="Fachlich geprüft" wert={`${geprueft} von ${POOLS.length}`} ton={geprueft === POOLS.length ? 'gut' : 'warn'} />
          <Zahl label="Offene Meldungen" wert={offen} ton={offen ? 'warn' : 'gut'} />
          <Zahl label="Dringend nachsehen" wert={prio1} ton={prio1 ? 'kritisch' : 'gut'} />
        </dl>
        <p className="muted">„Fachlich geprüft“ heißt: Eine Fachperson hat diese Fassung durchgesehen. Bis dahin sind die Inhalte durch Quellen, Tests und Prüfregeln gestützt, aber nicht freigegeben.</p>
        <div className="row">
          <a className="button-link primary" href="#/system/qualitaet?ansicht=liste">Überarbeitungsliste ({d.liste.length})</a>
          <a className="button-link" href="#/system/qualitaet?ansicht=abdeckung&luecken=1">Lücken im Fragenkatalog</a>
        </div>
      </section>
      <section className="card">
        <h2>Fragen aus deinem Material (KI)</h2>
        <p>Jede KI-Frage braucht ein wörtliches Zitat aus deinem Material, das die App nachprüft, und ein zweiter KI-Prüfer kontrolliert Musterlösung und Eindeutigkeit. Fragen, die das nicht bestehen, werden verworfen.</p>
        <dl className="qm-zahlen">
          <Zahl label="Behaltene KI-Fragen" wert={d.ki.erzeugt} />
          <Zahl label="Verworfen" wert={d.ki.verworfen} />
          <Zahl label="Auf alter Dokumentfassung" wert={d.ki.veraltet.length} ton={d.ki.veraltet.length ? 'warn' : undefined} />
        </dl>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- Überarbeitungsliste

function Liste({ d }: { d: ReturnType<typeof useDaten> }) {
  const [art, setArt] = useState<Art | ''>('');
  const [mitHinweisen, setMitHinweisen] = useState(false);
  const [alleMeldungen, setAlleMeldungen] = useState(false);
  const sichtbar = d.liste.filter((e) => (!art || e.art === art) && (mitHinweisen || e.prio < 3 || art === 'form'));
  const zahl = (a: Art) => d.liste.filter((e) => e.art === a).length;
  const status = (m: Meldung, s: MeldeStatus, bearbeitung?: string) => d.setMeldungen(setzeStatus(m.id, s, bearbeitung));
  const erledigt = d.meldungen.filter((m) => m.status === 'erledigt' || m.status === 'abgelehnt');
  return (
    <div className="qm-spalte">
      <section className="card">
        <p>Alles, was an Fragen und Inhalten nachgesehen werden sollte, nach Dringlichkeit. Gemeldete Fragen kommen aus den Übungen („Frage melden“) und aus gesammelten Rückmeldungs-Codes der Testgruppe.</p>
        <div className="pills" role="group" aria-label="Nach Art filtern">
          <button type="button" className="pill" aria-pressed={!art} onClick={() => setArt('')}>Alle</button>
          {(Object.keys(ART_LABEL) as Art[]).filter((a) => zahl(a)).map((a) => <button key={a} type="button" className="pill" aria-pressed={art === a} onClick={() => setArt(a)}>{ART_LABEL[a]} ({zahl(a)})</button>)}
        </div>
        <label className="check"><input type="checkbox" checked={mitHinweisen} onChange={(e) => setMitHinweisen(e.target.checked)} /><span>Auch Hinweise „bei Gelegenheit“ zeigen</span></label>
      </section>
      {!sichtbar.length && <p className="card muted">Nichts zu tun in dieser Auswahl.</p>}
      <ol className="qm-liste">
        {sichtbar.map((e) => <ListenEintrag key={e.key} e={e} onStatus={status} />)}
      </ol>
      {erledigt.length > 0 && (
        <details className="card" open={alleMeldungen} onToggle={(ev) => setAlleMeldungen((ev.target as HTMLDetailsElement).open)}>
          <summary>Erledigte und abgelehnte Meldungen ({erledigt.length})</summary>
          <ul className="qm-liste qm-liste--klein">
            {erledigt.map((m) => (
              <li key={m.id}><strong>{MELDE_STATUS[m.status]}:</strong> {m.titel} · {GRUND_LABEL[m.grund]}{m.bearbeitung ? ` · ${m.bearbeitung}` : ''}
                <span className="row"><button type="button" className="ghost small" onClick={() => d.setMeldungen(setzeStatus(m.id, 'offen'))}>Wieder öffnen</button>
                  <button type="button" className="ghost small" onClick={() => d.setMeldungen(loescheMeldung(m.id))}>Löschen</button></span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function ListenEintrag({ e, onStatus }: { e: Eintrag; onStatus: (m: Meldung, s: MeldeStatus, bearbeitung?: string) => void }) {
  const [notiz, setNotiz] = useState(e.meldung?.bearbeitung ?? '');
  return (
    <li className={`card qm-eintrag qm-eintrag--p${e.prio}`}>
      <div className="qm-eintrag__kopf">
        <span className={`tag ${e.prio === 1 ? 'tag--critical' : e.prio === 2 ? 'tag--warning' : 'tag--info'}`}>{PRIO_LABEL[e.prio]}</span>
        <span className="tag">{ART_LABEL[e.art]}</span>
        {e.quelle && <span className="muted">{NAME.get(e.quelle) ?? e.quelle}{e.aufgabeId ? ` · ${e.aufgabeId}` : ''}</span>}
      </div>
      <h3>{e.titel}</h3>
      <p>{e.detail}</p>
      {e.tun && <p className="muted"><strong>Zu tun:</strong> {e.tun}</p>}
      {e.meldung && (
        <label className="qm-eintrag__notiz">Bearbeitung (freiwillig)
          <input type="text" maxLength={300} value={notiz} onChange={(ev) => setNotiz(ev.target.value)} placeholder="z. B. Lösung korrigiert, oder: stimmt laut Expertenstandard" />
        </label>
      )}
      <div className="row">
        {e.pfad && <a className="button-link small" href={`#${e.pfad}`}>Öffnen</a>}
        {e.meldung && (['in-arbeit', 'erledigt', 'abgelehnt'] as MeldeStatus[]).filter((s) => s !== e.meldung!.status).map((s) => (
          <button key={s} type="button" className="small" onClick={() => onStatus(e.meldung!, s, notiz)}>{s === 'in-arbeit' ? 'In Arbeit' : MELDE_STATUS[s]}</button>
        ))}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------- Abdeckung

function Abdeckung() {
  const { params } = useRoute();
  const [nurLuecken, setNurLuecken] = useState(params.get('luecken') === '1');
  const [ce, setCe] = useState('');
  const [stufe, setStufe] = useState<Stufe | 0>(0);
  const alle = useMemo(() => abdeckung(modul, POOLS), []);
  const ces = useMemo(() => [...new Set(alle.flatMap((t) => t.ceIds))].sort(), [alle]);
  const fach = new Map(modul.subjects.map((s) => [s.id, s.name]));
  const liste = alle
    .filter((t) => (!ce || t.ceIds.includes(ce)) && (!nurLuecken || t.luecke !== 'gut') && (!stufe || !t.stufen[stufe]))
    .sort((x, y) => LUECKE_RANG[x.luecke] - LUECKE_RANG[y.luecke] || x.name.localeCompare(y.name, 'de'));
  const s = summiere(alle.filter((t) => !ce || t.ceIds.includes(ce)));
  const ton = (l: Luecke) => (l === 'gut' ? 'tag--wissen-sicher' : l === 'keine' || l === 'nur-uebungen' ? 'tag--critical' : 'tag--warning');
  return (
    <div className="qm-spalte">
      <section className="card">
        <p>Je Thema des Lehrplans: Wie viele Fragen gibt es, auf welcher Stufe? Gut abgedeckt ist ein Thema mit mindestens drei Fragen, davon mindestens einer Grundlagen- und einer Transferaufgabe. Themen ohne Fragen haben oft trotzdem Übungen (Fälle, Schreibtrainer), aber keine einzelnen Abfragen.</p>
        <dl className="qm-zahlen">
          {(Object.keys(LUECKE_LABEL) as Luecke[]).filter((l) => s.jeLuecke[l]).map((l) => <Zahl key={l} label={LUECKE_LABEL[l]} wert={s.jeLuecke[l]} ton={l === 'gut' ? 'gut' : l === 'keine' || l === 'nur-uebungen' ? 'kritisch' : 'warn'} />)}
        </dl>
        <div className="qm-filter">
          <label>Curriculare Einheit
            <select value={ce} onChange={(e) => setCe(e.target.value)}>
              <option value="">Alle</option>
              {ces.map((c) => <option key={c} value={c}>{c.replace('ce.', 'CE ')}</option>)}
            </select>
          </label>
          <label>Fehlende Stufe
            <select value={stufe} onChange={(e) => setStufe(Number(e.target.value) as Stufe | 0)}>
              <option value={0}>egal</option>
              {([1, 2, 3] as const).map((x) => <option key={x} value={x}>ohne {STUFE_LABEL[x]}</option>)}
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={nurLuecken} onChange={(e) => setNurLuecken(e.target.checked)} /><span>Nur Themen mit Lücken</span></label>
        </div>
      </section>
      <p className="muted" aria-live="polite">{liste.length} Themen</p>
      <ul className="qm-themen">
        {liste.map((t) => (
          <li key={t.topicId} className="card qm-thema">
            <div className="qm-thema__kopf">
              <a href={`#/lernen/thema?id=${encodeURIComponent(t.topicId)}`}><strong>{t.name}</strong></a>
              <span className={`tag ${ton(t.luecke)}`}>{LUECKE_LABEL[t.luecke]}</span>
            </div>
            <p className="muted">{[t.fachId && fach.get(t.fachId), t.ceIds.map((c) => c.replace('ce.', 'CE ')).join(', ')].filter(Boolean).join(' · ')}</p>
            <div className="qm-stufen" aria-label={`Fragen je Stufe: ${t.stufen[1]} Grundlagen, ${t.stufen[2]} Anwenden, ${t.stufen[3]} Transfer`}>
              {([1, 2, 3] as const).map((x) => (
                <span key={x} className={`qm-stufe${t.stufen[x] ? '' : ' qm-stufe--leer'}`}>{STUFE_LABEL[x]} <strong>{t.stufen[x]}</strong></span>
              ))}
            </div>
            {t.trainer.length > 0 && (
              <p className="qm-thema__links">Üben:{' '}
                {t.trainer.map((tr, n) => (
                  <span key={tr.quelle}>{n > 0 && ' · '}<a href={`#${tr.pfad}`}>{tr.name} ({tr.n})</a>
                    {([1, 2, 3] as const).filter((x) => t.stufen[x]).length > 1 && <> {([1, 2, 3] as const).map((x) => <a key={x} className="qm-stufenlink" href={`#${mitStufe(tr.pfad, x)}`} title={`Nur ${STUFE_LABEL[x]}`}>{x}</a>)}</>}
                  </span>
                ))}
              </p>
            )}
            {t.weitere.length > 0 && <p className="muted">Weitere Übungen: {t.weitere.map((u, n) => <span key={u.path}>{n > 0 && ' · '}<a href={`#${u.path}`}>{u.label}</a></span>)}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- Prüfstand

function Pruefstand({ d }: { d: ReturnType<typeof useDaten> }) {
  const [form, setForm] = useState<{ quelle: string; von: string; rolle: string; bemerkung: string } | null>(null);
  const ton = (s: Status) => (s === 'geprueft' ? 'tag--wissen-sicher' : s === 'ungeprueft' ? 'tag--info' : 'tag--warning');
  return (
    <div className="qm-spalte">
      <section className="card">
        <p>Je Trainer: Quellen mit Stand, wer prüfen soll, und ob sich seit der letzten Prüfung etwas geändert hat. Die App erkennt jede Änderung an einer Frage an ihrem Fingerabdruck. Ändert sich nach einer Prüfung etwas, steht der Trainer wieder auf „Geändert seit Prüfung“.</p>
      </section>
      {TRAINER_REGISTER.map((r) => {
        const pool = POOLS.find((p) => p.quelle === r.quelle);
        if (!pool) return null;
        const st = trainerStand(r.quelle, pool.aufgaben, heute(), undefined, d.vermerke);
        const lokal = d.vermerke.find((v) => v.quelle === r.quelle);
        const lq = laengenQuote(pool.aufgaben);
        return (
          <section key={r.quelle} className="card qm-trainer">
            <div className="qm-eintrag__kopf">
              <h2><a href={`#${r.pfad}`}>{r.name}</a></h2>
              <span className={`tag ${ton(st.status)}`}>{STATUS_LABEL[st.status]}</span>
              <span className="muted">{pool.aufgaben.length} Fragen</span>
            </div>
            <dl className="qm-dl">
              <dt>Quellen</dt><dd>{r.freigabe.quellen.map((q) => `${q.titel} (${q.stand})`).join('; ')}</dd>
              <dt>Geltung</dt><dd>{r.freigabe.geltung}</dd>
              <dt>Prüfen durch</dt><dd>{r.freigabe.prueferrolle}</dd>
              <dt>Prüfpunkte</dt><dd>{r.freigabe.pruefpunkte.join('; ')}</dd>
              {st.pruefung ? <><dt>Letzte Prüfung</dt><dd>{datum(st.pruefung.am)} von {st.pruefung.von} ({st.pruefung.rolle}){st.pruefung.lokal ? ', auf diesem Gerät' : ''}</dd></>
                : <><dt>Erfasst</dt><dd>{datum(st.erfasstAm)}, noch ohne fachliche Prüfung</dd></>}
              {(st.vergleich.geaendert.length + st.vergleich.neu.length > 0) && <><dt>Seither</dt><dd>{st.vergleich.geaendert.length} geändert, {st.vergleich.neu.length} neu{st.vergleich.entfernt.length ? `, ${st.vergleich.entfernt.length} entfernt` : ''}</dd></>}
              <dt>Längen-Hinweis</dt><dd>Lösung ist in {Math.round(lq.quote * 100)} % der Auswahlfragen die längste Antwort (Zufall etwa {Math.round(lq.zufall * 100)} %).</dd>
              <dt>Änderungen</dt><dd>{r.freigabe.aenderungen.map((a) => `${datum(a.datum)}: ${a.text}`).join('; ')}</dd>
            </dl>
            {form?.quelle === r.quelle ? (
              <form className="qm-vermerk" onSubmit={(e) => {
                e.preventDefault();
                if (!form.von.trim() || !form.rolle.trim()) return;
                d.setVermerke(setzeVermerk(r.quelle, pool.aufgaben, { am: heute(), von: form.von.trim(), rolle: form.rolle.trim(), bemerkung: form.bemerkung.trim() || undefined }));
                setForm(null);
                notify('info', 'Prüfvermerk gesetzt', `${r.name}: Diese Fassung gilt auf diesem Gerät als fachlich geprüft.`);
              }}>
                <p className="muted">Nur setzen, wenn du alle {pool.aufgaben.length} Fragen dieses Trainers fachlich durchgesehen hast. Der Vermerk gilt für genau diese Fassung.</p>
                <label>Name<input required value={form.von} onChange={(e) => setForm({ ...form, von: e.target.value })} /></label>
                <label>Rolle<input required value={form.rolle} onChange={(e) => setForm({ ...form, rolle: e.target.value })} placeholder={r.freigabe.prueferrolle} /></label>
                <label>Bemerkung (freiwillig)<input value={form.bemerkung} onChange={(e) => setForm({ ...form, bemerkung: e.target.value })} /></label>
                <div className="row"><button type="submit" className="primary small">Als geprüft vermerken</button><button type="button" className="ghost small" onClick={() => setForm(null)}>Abbrechen</button></div>
              </form>
            ) : (
              <div className="row">
                <button type="button" className="small" onClick={() => setForm({ quelle: r.quelle, von: '', rolle: '', bemerkung: '' })}>Prüfung vermerken</button>
                {lokal && <button type="button" className="ghost small" onClick={() => void kopiere(vermerkText(lokal, r.name), 'Prüfvermerk')}>Vermerk zum Eintragen kopieren</button>}
                {lokal && <button type="button" className="ghost small" onClick={() => d.setVermerke(entferneVermerk(r.quelle))}>Vermerk entfernen</button>}
              </div>
            )}
          </section>
        );
      })}
      <section className="card">
        <h2>Simulationen und Notfallübungen</h2>
        <ul className="qm-liste qm-liste--klein">
          {WEITERE_FREIGABEN.map((f) => <li key={f.name}><a href={`#${f.pfad}`}>{f.name}</a>: {STATUS_TEXT[f.freigabe.status]} · {f.freigabe.quellen.map((q) => `${q.titel} (${q.stand})`).join('; ')}</li>)}
        </ul>
        <p className="muted">Praxis-, Fall- und Diagnostik-Simulator zeigen ihren Prüfstand direkt am Fall.</p>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- Regeln

function Regeln() {
  const befunde = useMemo(() => zaehleRegeln(POOLS.flatMap((p) => pruefeAlle(p.aufgaben))), []);
  return (
    <div className="qm-spalte">
      <section className="card">
        <h2>Fünf Sicherungen</h2>
        <ol>
          <li><strong>Quelle an jeder Frage.</strong> Nach dem Prüfen steht unter der Begründung, worauf die Antwort beruht, mit Stand und Geltung. KI-Fragen aus deinem Material tragen ein wörtliches Zitat, das die App gegen den Text prüft.</li>
          <li><strong>Zweiter Prüfer für KI-Fragen.</strong> Ein eigener KI-Aufruf prüft Musterlösung, Eindeutigkeit und Ablenker. Was durchfällt, wird verworfen, nicht angezeigt.</li>
          <li><strong>Prüfregeln für die Bauform.</strong> Die App sucht typische Schwächen von Prüfungsfragen (unten), angelehnt an die Leitfäden zum Schreiben von Prüfungsfragen in der Medizinausbildung (NBME).</li>
          <li><strong>Rückmeldung aus dem Üben.</strong> „Frage melden“ in jeder Übung, dazu eine Statistik je Frage: Wird ein Ablenker öfter gewählt als die Lösung, ist oft die Lösung falsch markiert (Vorgehen wie bei der Fragenanalyse großer Lernplattformen).</li>
          <li><strong>Versionierung.</strong> Jede Frage hat einen Fingerabdruck. Fachliche Prüfungen gelten für genau eine Fassung; Änderungen und neue Leitlinienfassungen landen automatisch in der Überarbeitungsliste.</li>
        </ol>
      </section>
      <section className="card">
        <h2>Prüfregeln und aktuelle Befunde</h2>
        <ul className="qm-liste qm-liste--klein">
          {(Object.keys(REGELN) as RegelId[]).map((id) => (
            <li key={id}><strong>{REGELN[id].titel}</strong> <span className={`tag ${befunde[id] ? (REGELN[id].schwere === 'fehler' ? 'tag--critical' : 'tag--warning') : 'tag--wissen-sicher'}`}>{befunde[id]}×</span><br />{REGELN[id].warum} <span className="muted">{REGELN[id].besser}</span></li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2>Beobachtete Leitlinien</h2>
        <ul className="qm-liste qm-liste--klein">
          {NEUERE_FASSUNGEN.map((n) => <li key={n.fundstelle}><strong>{n.muster.source.replace(/[\^\\/i]/g, '')} {n.stand}</strong>, erschienen {datum(n.erschienen)}: {n.kern} <a href={n.fundstelle} target="_blank" rel="noreferrer">Fundstelle</a></li>)}
        </ul>
      </section>
    </div>
  );
}

/** Inhaltsqualität: Überarbeitungsliste, Abdeckung, Prüfstand und die Regeln dahinter. */
export default function QualitaetSeite() {
  const { params } = useRoute();
  const ansicht = (ANSICHTEN.find((a) => a.id === params.get('ansicht'))?.id ?? 'ueberblick') as Ansicht;
  const d = useDaten();
  return (
    <section className="page qm">
      <PageHeading eyebrow="Qualität" title="Inhaltsqualität" description="Sind die Fragen richtig, aktuell und decken sie den Lehrplan ab? Meldungen, Lücken, Prüfstand und was zu überarbeiten ist." />
      <nav className="pills qm__wahl" aria-label="Bereich">
        {ANSICHTEN.map((a) => <a key={a.id} className="pill" href={`#/system/qualitaet?ansicht=${a.id}`} aria-current={a.id === ansicht ? 'page' : undefined}>{a.label}{a.id === 'liste' && d.liste.length ? ` (${d.liste.filter((e) => e.prio < 3).length})` : ''}</a>)}
      </nav>
      {ansicht === 'ueberblick' && <Ueberblick d={d} />}
      {ansicht === 'liste' && <Liste d={d} />}
      {ansicht === 'abdeckung' && <Abdeckung />}
      {ansicht === 'pruefstand' && <Pruefstand d={d} />}
      {ansicht === 'regeln' && <Regeln />}
    </section>
  );
}

export type { Grund };
