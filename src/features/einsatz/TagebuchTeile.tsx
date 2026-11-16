import { useMemo, useState } from 'react';
import type { ID } from '../../core/types';
import { PERSONEN_TEXT, personenbezug } from '../../ui/lib/personenbezug';
import { dayKey } from '../../ui/lib/time';
import { navigate, useRoute } from '../../ui/shell/router';
import { notify } from '../../ui/shell/notifications';
import { speichereKarte } from '../karteikarten/store';
import { kurzDatum } from '../lernplan/ui/format';
import { uebungenFuer } from '../lernplan/trainer';
import { useDiktat } from '../uebergabe/diktat';
import { DiktatFrage } from '../uebergabe/DiktatFrage';
import { aktuellerEinsatz, einsatzName, phase } from './einsatz';
import type { SeitenCtx } from './EinsatzSeite';
import {
  aendereNotiz, eingang, GIBBS, MAX_TEXT, mitNotiz, mitReflexion, NOTIZ_ARTEN, NOTIZ_LABEL, ohneNotiz, ohneReflexion, tage, themenVorschlag,
  type Notiz, type NotizArt, type Reflexion,
} from './tagebuch';

const neueId = () => crypto.randomUUID();

/** Warnt am Feld, wenn eine Notiz nach echten Personendaten aussieht. Notizen bleiben lokal, sollen aber anonym sein. */
function AnonymHinweis({ text }: { text: string }) {
  const funde = personenbezug(text);
  if (!funde.length) return null;
  const arten = [...new Set(funde.map((f) => PERSONEN_TEXT[f.art]))];
  return (
    <p className="note warn" role="status">
      <strong>Bitte anonym notieren:</strong> {arten.join(', ')} ({funde.map((f) => `„${f.text}“`).join(', ')}). Schreib lieber „Bewohnerin, 84 J.“ oder „Patient Zi. A“. Die Notiz bleibt auf diesem Gerät, landet aber in Sicherungen.
    </p>
  );
}

function useVorschlag(ctx: SeitenCtx) {
  const quelle = useMemo(() => ({ themen: ctx.blaetter, glossar: ctx.modul.glossary }), [ctx.blaetter, ctx.modul]);
  return (text: string) => themenVorschlag(text, quelle);
}

// ---------------------------------------------------------------- Schnellnotiz (Pocket-Modus)

export function NotizAnsicht({ ctx }: { ctx: SeitenCtx }) {
  const [art, setArt] = useState<NotizArt>('beobachtung');
  const [text, setText] = useState('');
  const [gespeichert, setGespeichert] = useState<Notiz | null>(null);
  const vorschlag = useVorschlag(ctx);
  const diktat = useDiktat((stueck) => setText((t) => (t ? `${t} ${stueck}` : stueck).slice(0, MAX_TEXT)));
  const laufend = aktuellerEinsatz(ctx.liste, ctx.heute);
  const einsatz = laufend && phase(laufend, ctx.heute) === 'laeuft' ? laufend : undefined;
  const heuteNotizen = ctx.tagebuch.notizen.filter((n) => n.tag === ctx.heute).slice(0, 5);

  const speichern = (ev: React.FormEvent) => {
    ev.preventDefault();
    const t = text.trim();
    if (!t) return;
    diktat.stop();
    const n: Notiz = { id: neueId(), at: new Date().toISOString(), tag: dayKey(new Date()), art, text: t.slice(0, MAX_TEXT), themen: vorschlag(t), erledigt: false, ...(einsatz ? { einsatzId: einsatz.id } : {}) };
    ctx.setTagebuch(mitNotiz(ctx.tagebuch, n));
    setText('');
    setGespeichert(n);
  };

  return (
    <div className="stack-3">
      <form className="card einsatz__pocket stack-2" onSubmit={speichern} aria-labelledby="ez-notiz-titel">
        <h2 id="ez-notiz-titel">Schnell notieren</h2>
        <p className="muted einsatz__klein">{einsatz ? `Gehört zu: ${einsatzName(einsatz)}. ` : ''}Funktioniert ohne Netz. Ausarbeiten kannst du es später im Praxistagebuch.</p>
        <div className="einsatz__arten" role="radiogroup" aria-label="Art der Notiz">
          {NOTIZ_ARTEN.map((a) => (
            <label key={a.id} className={`pill einsatz__art${art === a.id ? ' is-aktiv' : ''}`}>
              <input type="radio" name="ez-art" value={a.id} checked={art === a.id} onChange={() => setArt(a.id)} className="visually-hidden" />
              {a.label}
            </label>
          ))}
        </div>
        <label className="field">{NOTIZ_ARTEN.find((a) => a.id === art)!.hilfe}
          <textarea rows={4} value={text} maxLength={MAX_TEXT} onChange={(e) => setText(e.target.value)} />
        </label>
        <AnonymHinweis text={text} />
        {diktat.aktiv && <div className="note" role="status">Hört zu … {diktat.zwischen && <em>{diktat.zwischen}</em>}</div>}
        {diktat.fehler && <div className="note warn" role="alert">{diktat.fehler}</div>}
        <DiktatFrage diktat={diktat} />
        <div className="faecher__aktionen">
          <button type="submit" className="primary" disabled={!text.trim()}>Notiz speichern</button>
          {diktat.moeglich && (
            <button type="button" className={diktat.aktiv ? 'danger' : undefined} onClick={() => (diktat.aktiv ? diktat.stop() : diktat.start())}>
              {diktat.aktiv ? 'Diktat beenden' : 'Sprechen'}
            </button>
          )}
        </div>
        {gespeichert && (
          <p className="note" role="status">
            Gespeichert{gespeichert.themen.length ? `, passt zu: ${gespeichert.themen.map(ctx.themaName).join(', ')}` : ''}.{' '}
            <button type="button" className="link" onClick={() => navigate('/lernen/einsatz?ansicht=tagebuch')}>Im Tagebuch ausarbeiten</button>
          </p>
        )}
      </form>
      {heuteNotizen.length > 0 && (
        <section aria-labelledby="ez-heute">
          <h2 id="ez-heute">Heute notiert</h2>
          <ul className="einsatz__kurzliste">
            {heuteNotizen.map((n) => <li key={n.id}><span className="tag">{NOTIZ_LABEL[n.art]}</span> {n.text}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Praxistagebuch

/** Brücke von der Praxis in die Theorie: Thema, Karten und bis zu zwei passende Übungen. */
function Bruecke({ ctx, themen }: { ctx: SeitenCtx; themen: ID[] }) {
  if (!themen.length) return null;
  return (
    <div className="einsatz__bruecke">
      <h4>Dazu kurz lernen</h4>
      <ul>
        {themen.slice(0, 3).map((id) => {
          const u = uebungenFuer(id, ctx.modul).slice(0, 2);
          return (
            <li key={id}>
              <a href={`#/lernen/thema?id=${encodeURIComponent(id)}`}><strong>{ctx.themaName(id)}</strong></a>
              {' · '}<a href={`#/lernen/karten?thema=${encodeURIComponent(id)}`}>Karteikarten</a>
              {u.map((x) => <span key={x.path}>{' · '}<a href={`#${x.path}`}>{x.label}</a></span>)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ThemenChips({ ctx, themen, onChange }: { ctx: SeitenCtx; themen: ID[]; onChange: (t: ID[]) => void }) {
  const [wahl, setWahl] = useState('');
  return (
    <div className="einsatz__chips">
      {themen.map((id) => (
        <button key={id} type="button" className="chip" aria-label={`Thema ${ctx.themaName(id)} entfernen`} onClick={() => onChange(themen.filter((t) => t !== id))}>
          {ctx.themaName(id)} <span aria-hidden="true">×</span>
        </button>
      ))}
      <label className="visually-hidden" htmlFor={`thema-${themen.join('-') || 'leer'}`}>Thema zuordnen</label>
      <select id={`thema-${themen.join('-') || 'leer'}`} className="einsatz__chip-wahl" value={wahl} onChange={(e) => { const id = e.target.value; setWahl(''); if (id && !themen.includes(id)) onChange([...themen, id].slice(0, 20)); }}>
        <option value="">+ Thema</option>
        {ctx.blaetter.filter((t) => !themen.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </div>
  );
}

function KarteAusNotiz({ ctx, notiz, onFertig }: { ctx: SeitenCtx; notiz: Notiz; onFertig: () => void }) {
  const [vorne, setVorne] = useState(notiz.art === 'begriff' ? `Was bedeutet „${notiz.text}“?` : notiz.text);
  const [hinten, setHinten] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const fach = new Map(ctx.modul.topics.map((t) => [t.id, t.subjectId]));
  const speichern = async () => {
    setLaeuft(true);
    try {
      await speichereKarte({
        id: `eigen:${crypto.randomUUID()}`, quelle: 'eigen', art: 'Aus dem Praxistag', vorne: vorne.trim(), hinten: hinten.trim(),
        topicIds: notiz.themen, subjectIds: [...new Set(notiz.themen.map((t) => fach.get(t)).filter((x): x is string => !!x))],
      });
      notify('info', 'Karteikarte angelegt', 'Sie kommt ab heute in deinen Karteikarten dran.');
      onFertig();
    } catch (e) {
      notify('critical', 'Karte nicht gespeichert', e instanceof Error ? e.message : String(e));
    } finally { setLaeuft(false); }
  };
  return (
    <div className="einsatz__karte stack-2">
      <label className="field">Vorderseite<textarea rows={2} value={vorne} onChange={(e) => setVorne(e.target.value)} /></label>
      <label className="field">Rückseite (nachschlagen und in eigenen Worten)<textarea rows={3} value={hinten} onChange={(e) => setHinten(e.target.value)} /></label>
      <AnonymHinweis text={`${vorne} ${hinten}`} />
      <div className="faecher__aktionen">
        <button type="button" className="primary small" disabled={!vorne.trim() || !hinten.trim() || laeuft} onClick={() => void speichern()}>Karte speichern</button>
        <button type="button" className="ghost small" onClick={onFertig}>Abbrechen</button>
      </div>
    </div>
  );
}

function NotizKarte({ ctx, notiz }: { ctx: SeitenCtx; notiz: Notiz }) {
  const [karte, setKarte] = useState(false);
  const setze = (patch: Parameters<typeof aendereNotiz>[2]) => ctx.setTagebuch(aendereNotiz(ctx.tagebuch, notiz.id, patch));
  return (
    <li className={`card einsatz__notiz${notiz.erledigt ? ' is-erledigt' : ''}`}>
      <div className="einsatz__kopf">
        <span className="tag">{NOTIZ_LABEL[notiz.art]}</span>
        <span className="muted einsatz__klein">{kurzDatum(notiz.tag)}{notiz.erledigt ? ' · ausgearbeitet' : ''}</span>
      </div>
      <p className="einsatz__text">{notiz.text}</p>
      <ThemenChips ctx={ctx} themen={notiz.themen} onChange={(themen) => setze({ themen })} />
      {!notiz.erledigt && <Bruecke ctx={ctx} themen={notiz.themen} />}
      {karte
        ? <KarteAusNotiz ctx={ctx} notiz={notiz} onFertig={() => { setKarte(false); }} />
        : (
          <div className="faecher__aktionen">
            <button type="button" className="small" onClick={() => setKarte(true)}>Als Karteikarte</button>
            <button type="button" className="small" onClick={() => setze({ erledigt: !notiz.erledigt })}>{notiz.erledigt ? 'Wieder öffnen' : 'Ausgearbeitet'}</button>
            <button type="button" className="small ghost" onClick={() => ctx.setTagebuch(ohneNotiz(ctx.tagebuch, notiz.id))}>Löschen</button>
          </div>
        )}
    </li>
  );
}

const LEERE_REFLEXION = { situation: '', gedanken: '', gut: '', lernen: '' };

function ReflexionFormular({ ctx, einsatzId, onFertig }: { ctx: SeitenCtx; einsatzId?: string; onFertig: () => void }) {
  const [felder, setFelder] = useState(LEERE_REFLEXION);
  const vorschlag = useVorschlag(ctx);
  const alles = GIBBS.map((g) => felder[g.feld]).join(' ');
  const [themen, setThemen] = useState<ID[] | null>(null);
  const aktuelleThemen = themen ?? vorschlag(alles);
  const speichern = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!felder.situation.trim()) return;
    const r: Reflexion = { id: neueId(), at: new Date().toISOString(), tag: dayKey(new Date()), themen: aktuelleThemen, ...felder, ...(einsatzId ? { einsatzId } : {}) };
    ctx.setTagebuch(mitReflexion(ctx.tagebuch, r));
    setFelder(LEERE_REFLEXION);
    setThemen(null);
    onFertig();
  };
  return (
    <form className="card stack-2 einsatz__reflexion" onSubmit={speichern} aria-labelledby="ez-refl">
      <h3 id="ez-refl">Situation reflektieren</h3>
      <p className="muted einsatz__klein">Vier Fragen nach dem Reflexionskreis von Gibbs. Bleibt auf diesem Gerät und zählt nie als Wissensnachweis.</p>
      {GIBBS.map((g) => (
        <label key={g.feld} className="field">{g.frage}
          <span className="muted einsatz__klein">{g.hilfe}</span>
          <textarea rows={2} maxLength={MAX_TEXT} value={felder[g.feld]} onChange={(e) => setFelder((f) => ({ ...f, [g.feld]: e.target.value }))} />
        </label>
      ))}
      <AnonymHinweis text={alles} />
      <div>
        <p className="einsatz__klein">Passende Themen:</p>
        <ThemenChips ctx={ctx} themen={aktuelleThemen} onChange={setThemen} />
      </div>
      <div className="faecher__aktionen">
        <button type="submit" className="primary" disabled={!felder.situation.trim()}>Reflexion speichern</button>
        <button type="button" className="ghost" onClick={onFertig}>Abbrechen</button>
      </div>
    </form>
  );
}

export function TagebuchAnsicht({ ctx }: { ctx: SeitenCtx }) {
  const { params } = useRoute();
  const filter = params.get('einsatz') ?? '';
  const [reflexion, setReflexion] = useState(false);
  const offen = eingang(ctx.tagebuch).filter((n) => !filter || n.einsatzId === filter);
  const liste = tage(ctx.tagebuch, filter || undefined);
  const laufend = aktuellerEinsatz(ctx.liste, ctx.heute);
  const einsatzId = filter || (laufend && phase(laufend, ctx.heute) === 'laeuft' ? laufend.id : undefined);

  return (
    <div className="stack-3">
      <div className="einsatz__werkzeug">
        <button type="button" className="primary" onClick={() => navigate('/lernen/einsatz?ansicht=notiz')}>Neue Notiz</button>
        {!reflexion && <button type="button" onClick={() => setReflexion(true)}>Situation reflektieren</button>}
        {ctx.liste.length > 0 && (
          <label className="field einsatz__filter">Einsatz
            <select value={filter} onChange={(e) => navigate(`/lernen/einsatz?ansicht=tagebuch${e.target.value ? `&einsatz=${encodeURIComponent(e.target.value)}` : ''}`)}>
              <option value="">Alle Einträge</option>
              {ctx.liste.map((e) => <option key={e.id} value={e.id}>{einsatzName(e)}</option>)}
            </select>
          </label>
        )}
      </div>
      {reflexion && <ReflexionFormular ctx={ctx} einsatzId={einsatzId} onFertig={() => setReflexion(false)} />}

      <section aria-labelledby="ez-eingang">
        <h2 id="ez-eingang">Eingang <span className="muted">({offen.length})</span></h2>
        {offen.length
          ? <ul className="einsatz__notizen">{offen.map((n) => <NotizKarte key={n.id} ctx={ctx} notiz={n} />)}</ul>
          : <p className="muted">Nichts offen. Notizen von Station landen hier, bis du sie ausgearbeitet hast.</p>}
      </section>

      <section aria-labelledby="ez-tage">
        <h2 id="ez-tage">Nach Tagen</h2>
        {!liste.length && <p className="muted">Noch keine Einträge.</p>}
        {liste.map((t) => (
          <article key={t.tag} className="card einsatz__tag">
            <h3>{kurzDatum(t.tag)}</h3>
            {t.notizen.length > 0 && <ul className="einsatz__kurzliste">{t.notizen.map((n) => <li key={n.id}><span className="tag">{NOTIZ_LABEL[n.art]}</span> {n.text}{n.erledigt ? <span className="muted"> · ausgearbeitet</span> : ''}</li>)}</ul>}
            {t.reflexionen.map((r) => (
              <details key={r.id} className="einsatz__refl-anzeige">
                <summary>Reflexion: {r.situation.slice(0, 80)}{r.situation.length > 80 ? ' …' : ''}</summary>
                <dl>{GIBBS.map((g) => r[g.feld] ? <div key={g.feld}><dt>{g.frage}</dt><dd>{r[g.feld]}</dd></div> : null)}</dl>
                <button type="button" className="small ghost" onClick={() => ctx.setTagebuch(ohneReflexion(ctx.tagebuch, r.id))}>Reflexion löschen</button>
              </details>
            ))}
            <Bruecke ctx={ctx} themen={t.themen} />
          </article>
        ))}
      </section>
    </div>
  );
}
