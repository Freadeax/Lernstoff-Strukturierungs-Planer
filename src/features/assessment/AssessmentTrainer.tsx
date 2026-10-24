import { useEffect, useMemo, useState } from 'react';
import './assessment.css';
import { logActivity } from '../../core/activity';
import { navigate, useRoute } from '../../ui/shell/router';
import { proThema } from '../lernplan/trainer';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';
import {
  aktiveItems, bmi, bmiPunkte, INSTRUMENTE, kategorie, minMax, summe, vollstaendig,
  type Instrument, type InstrumentId, type Item, type Werte,
} from './instrumente';
import { GRUPPEN, VIGNETTEN, type Gruppe, type Vignette } from './vignetten';
import { bewerteVignette, type VignettenErgebnis } from './bewertung';

type Modus = 'rechner' | 'faelle';
/** Ab so vielen bewerteten Punkten (Items + Einstufung + ggf. Instrument) zählt ein Fall im Lernplan. */
const MIN_PRO_THEMA = 3;
const ERLEDIGT_KEY = 'lernstoff.assessment.erledigt';

type Erledigt = Record<string, { datum: string; prozent: number }>;
function ladeErledigt(): Erledigt {
  try { return (JSON.parse(localStorage.getItem(ERLEDIGT_KEY) ?? 'null') as Erledigt) ?? {}; } catch { return {}; }
}
function speichereErledigt(e: Erledigt) {
  try { localStorage.setItem(ERLEDIGT_KEY, JSON.stringify(e)); } catch { /* privater Modus */ }
}

const istGruppe = (g: string | null): g is Gruppe => GRUPPEN.some((x) => x.id === g);

// ---------------------------------------------------------------- Bausteine

function ItemFeld({ item, wert, onWahl, gesperrt }: { item: Item; wert: number | undefined; onWahl: (p: number) => void; gesperrt?: boolean }) {
  return (
    <fieldset className="as__item" disabled={gesperrt}>
      <legend>
        <span>{item.label}</span>
        {wert !== undefined && <span className="as__punkte">{wert}</span>}
      </legend>
      {item.frage && <p className="muted as__frage">{item.frage}</p>}
      <div className={item.kompakt ? 'as__skala' : 'as__stufen'} role="radiogroup" aria-label={item.label}>
        {item.stufen.map((s) => (
          <label key={s.punkte} className={`as__stufe${wert === s.punkte ? ' is-gewaehlt' : ''}`} title={item.kompakt ? s.text : undefined}>
            <input type="radio" name={item.id} checked={wert === s.punkte} onChange={() => onWahl(s.punkte)} />
            {item.kompakt ? <span className="as__zahl">{s.kurz}</span> : (
              <>
                <span className="as__stufe-punkte">{s.punkte}</span>
                <span className="as__stufe-text"><strong>{s.kurz}</strong>{s.text && <span className="muted"> {s.text}</span>}</span>
              </>
            )}
          </label>
        ))}
      </div>
      {item.kompakt && <p className="muted as__skala-enden"><span>0 = {item.stufen[0].text}</span><span>10 = {item.stufen.at(-1)?.text}</span></p>}
    </fieldset>
  );
}

function BmiHilfe({ start, onPunkte }: { start?: { kg: number; cm: number }; onPunkte?: (p: number) => void }) {
  const [kg, setKg] = useState(start ? String(start.kg) : '');
  const [cm, setCm] = useState(start ? String(start.cm) : '');
  const wert = bmi(Number(kg.replace(',', '.')), Number(cm.replace(',', '.')));
  return (
    <div className="as__bmi">
      <label>Gewicht <input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="kg" aria-label="Gewicht in kg" /></label>
      <label>Größe <input inputMode="decimal" value={cm} onChange={(e) => setCm(e.target.value)} placeholder="cm" aria-label="Größe in cm" /></label>
      <span aria-live="polite">{wert !== null ? <>BMI <strong>{wert.toLocaleString('de-DE')}</strong></> : <span className="muted">BMI rechnen</span>}</span>
      {wert !== null && onPunkte && <button type="button" className="ghost small" onClick={() => onPunkte(bmiPunkte(wert))}>Übernehmen</button>}
    </div>
  );
}

function Formular({ instr, werte, setWert, ersatz, setErsatz, gesperrt, koerper, bmiUebernehmen }: {
  instr: Instrument; werte: Werte; setWert: (id: string, p: number | undefined) => void;
  ersatz: Set<string>; setErsatz: (s: Set<string>) => void; gesperrt?: boolean;
  koerper?: { kg: number; cm: number }; bmiUebernehmen: boolean;
}) {
  const items = aktiveItems(instr, ersatz);
  const ersatzItems = instr.items.filter((i) => i.ersatzFuer);
  return (
    <div className="as__formular">
      {items.map((item) => (
        <div key={item.id}>
          <ItemFeld item={item} wert={werte[item.id]} onWahl={(p) => setWert(item.id, p)} gesperrt={gesperrt} />
          {instr.id === 'mna' && item.id === 'F1' && !gesperrt && (
            <BmiHilfe start={koerper} onPunkte={bmiUebernehmen ? (p) => setWert('F1', p) : undefined} />
          )}
        </div>
      ))}
      {!gesperrt && ersatzItems.map((e) => {
        const an = ersatz.has(e.id);
        const original = instr.items.find((i) => i.id === e.ersatzFuer)!;
        return (
          <button key={e.id} type="button" className="ghost small as__ersatz" onClick={() => {
            const next = new Set(ersatz);
            if (an) next.delete(e.id); else next.add(e.id);
            setWert(an ? e.id : original.id, undefined);
            setErsatz(next);
          }}>
            {an ? `Doch ${original.label.replace(/^\S+ · /, '')} verwenden` : `${original.label.replace(/^\S+ · /, '')} nicht bestimmbar: ${e.label.replace(/^\S+ · /, '')} verwenden`}
          </button>
        );
      })}
    </div>
  );
}

function Skala({ instr, punkte, markiert }: { instr: Instrument; punkte: number | null; markiert?: string }) {
  const aktiv = punkte === null ? undefined : kategorie(instr, punkte)?.id;
  return (
    <ul className="as__kategorien">
      {instr.kategorien.map((k) => (
        <li key={k.id} className={`as__kat as__kat--${k.ton}${(markiert ?? aktiv) === k.id ? ' is-aktiv' : ''}`}>
          <span className="as__kat-bereich">{k.min === k.max ? k.min : `${k.min}–${k.max}`}</span>
          <span>{k.label}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- Rechner

function Rechner({ instrumentId }: { instrumentId: InstrumentId }) {
  const instr = INSTRUMENTE[instrumentId];
  const [werte, setWerte] = useState<Werte>({});
  const [ersatz, setErsatz] = useState<Set<string>>(new Set());
  useEffect(() => { setWerte({}); setErsatz(new Set()); }, [instrumentId]);
  const items = aktiveItems(instr, ersatz);
  const punkte = summe(items, werte);
  const fertig = vollstaendig(items, werte);
  const kat = fertig ? kategorie(instr, punkte) : undefined;
  const { max } = minMax(instr);
  const offen = items.filter((i) => werte[i.id] === undefined).length;

  return (
    <div className="as__layout">
      <div className="card">
        <h3>{instr.name}</h3>
        <p className="muted">{instr.zweck}</p>
        <Formular instr={instr} werte={werte} setWert={(id, p) => setWerte((w) => ({ ...w, [id]: p }))}
          ersatz={ersatz} setErsatz={setErsatz} bmiUebernehmen />
      </div>
      <aside className="card as__ergebnis" aria-live="polite">
        <p className="as__summe"><strong>{punkte}</strong> <span className="muted">von {max} Punkten</span></p>
        {kat ? (
          <div className={`note as__note--${kat.ton}`}><strong>{kat.label}</strong><br />{kat.hinweis}</div>
        ) : (
          <p className="muted">Noch {offen} {offen === 1 ? 'Bereich' : 'Bereiche'} offen.</p>
        )}
        <Skala instr={instr} punkte={fertig ? punkte : null} />
        <p className="muted as__richtung">{instr.richtung}</p>
        <ul className="as__hinweise">{instr.hinweise.map((h) => <li key={h}>{h}</li>)}</ul>
        <div className="row">
          <button type="button" className="ghost" onClick={() => { setWerte({}); setErsatz(new Set()); }}>Zurücksetzen</button>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------- Fallvignetten

function FallListe({ gruppe, erledigt, onWahl }: { gruppe: Gruppe; erledigt: Erledigt; onWahl: (v: Vignette) => void }) {
  return (
    <ul className="as__faelle">
      {VIGNETTEN.filter((v) => v.gruppe === gruppe).map((v) => {
        const e = erledigt[v.id];
        return (
          <li key={v.id}>
            <button type="button" className="card as__fallkarte" onClick={() => onWahl(v)}>
              <strong>{v.titel}</strong>
              <span className="muted">{v.setting}</span>
              {e ? <span className={`tag ${e.prozent >= 85 ? 'tag--wissen-sicher' : 'tag--warning'}`}>Zuletzt {e.prozent} %</span> : <span className="tag tag--info">Neu</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Auswertung({ v, ergebnis, eigeneKategorie, gewaehlt }: { v: Vignette; ergebnis: VignettenErgebnis; eigeneKategorie: string | null; gewaehlt?: InstrumentId }) {
  const instr = INSTRUMENTE[v.instrument];
  const eigene = instr.kategorien.find((k) => k.id === eigeneKategorie);
  return (
    <div className="as__auswertung">
      <h3>{ergebnis.punkte} von {ergebnis.max} richtig</h3>
      <table className="as__tabelle">
        <thead><tr><th>Bereich</th><th>Du</th><th>Lösung</th></tr></thead>
        <tbody>
          {ergebnis.instrumentRichtig !== null && (
            <tr className={ergebnis.instrumentRichtig ? 'is-ok' : 'is-falsch'}>
              <td>Instrument<div className="muted">{v.instrumentWahl}</div></td>
              <td>{gewaehlt ? INSTRUMENTE[gewaehlt].kurz : '–'}</td>
              <td>{instr.kurz}</td>
            </tr>
          )}
          {ergebnis.zeilen.map((z) => (
            <tr key={z.item.id} className={z.richtig ? 'is-ok' : 'is-falsch'}>
              <td>{z.item.label}<div className="muted">{z.begruendung}</div></td>
              <td>{z.ist ?? '–'}</td>
              <td>{z.soll}</td>
            </tr>
          ))}
          <tr className="as__tabelle-summe">
            <td>Summe</td><td>{ergebnis.summeIst}</td><td>{ergebnis.summeSoll}</td>
          </tr>
          <tr className={ergebnis.kategorieRichtig ? 'is-ok' : 'is-falsch'}>
            <td>Einstufung</td><td>{eigene?.label ?? '–'}</td><td>{ergebnis.kategorieSoll?.label}</td>
          </tr>
        </tbody>
      </table>
      <div className="note"><strong>Fazit:</strong> {v.fazit}</div>
    </div>
  );
}

function Fall({ v, onFertig, onZurueck, onWeiter }: {
  v: Vignette; onFertig: (v: Vignette, e: VignettenErgebnis) => void; onZurueck: () => void; onWeiter?: () => void;
}) {
  const gruppe = GRUPPEN.find((g) => g.id === v.gruppe)!;
  const mitWahl = !!v.instrumentWahl;
  const [gewaehlt, setGewaehlt] = useState<InstrumentId | undefined>(mitWahl ? undefined : v.instrument);
  const [werte, setWerte] = useState<Werte>({});
  const [ersatz, setErsatz] = useState<Set<string>>(new Set());
  const [eigeneKat, setEigeneKat] = useState<string | null>(null);
  const [ergebnis, setErgebnis] = useState<VignettenErgebnis | null>(null);
  const lernplan = useLernplanUebernahme('assessment');

  // Nach der Instrumentwahl geht es immer mit dem richtigen Instrument weiter, die Wahl selbst wird bewertet
  const instr = INSTRUMENTE[v.instrument];
  const items = aktiveItems(instr, ersatz);
  const bereit = !!gewaehlt && vollstaendig(items, werte) && !!eigeneKat;

  function auswerten() {
    const e = bewerteVignette(v, { werte: Object.fromEntries(items.map((i) => [i.id, werte[i.id]])), kategorie: eigeneKat, instrument: gewaehlt });
    setErgebnis(e);
    onFertig(v, e);
    lernplan.uebernimm(proThema(e.treffer, MIN_PRO_THEMA));
  }

  return (
    <div className="as__layout as__layout--fall">
      <article className="card as__fall">
        <div className="as__kopf">
          <button type="button" className="ghost small" onClick={onZurueck}>← Alle Fälle</button>
          <span className="badge badge--demo">{gruppe.label}</span>
        </div>
        <h3>{v.titel}</h3>
        <p className="muted">{v.setting}</p>
        {v.text.map((t, i) => <p key={i}>{t}</p>)}
        <p className="muted as__fiktiv">Fiktiver Übungsfall.</p>
      </article>

      <div className="card as__eingabe">
        {mitWahl && (
          <div className="as__wahl">
            <h3>1. Welches Instrument passt?</h3>
            <div className="pills" role="group" aria-label="Instrument wählen">
              {gruppe.instrumente.map((id) => (
                <button key={id} type="button" className="pill" aria-pressed={gewaehlt === id} disabled={!!gewaehlt}
                  onClick={() => setGewaehlt(id)}>{INSTRUMENTE[id].name}</button>
              ))}
            </div>
            {gewaehlt && (
              <div className={`note ${gewaehlt === v.instrument ? 'ok' : 'warn'}`} role="status">
                <strong>{gewaehlt === v.instrument ? 'Richtig.' : `Hier passt die ${instr.kurz}.`}</strong> {v.instrumentWahl}
              </div>
            )}
          </div>
        )}

        {gewaehlt && (
          <>
            {mitWahl && <h3>2. Einschätzen mit der {instr.kurz}</h3>}
            <Formular instr={instr} werte={werte} setWert={(id, p) => setWerte((w) => ({ ...w, [id]: p }))}
              ersatz={ersatz} setErsatz={setErsatz} gesperrt={!!ergebnis} bmiUebernehmen={false} />
            <div className="as__einstufung">
              <h4>Einstufung bei {summe(items, werte)} Punkten</h4>
              <div className="pills" role="radiogroup" aria-label="Einstufung">
                {instr.kategorien.map((k) => (
                  <button key={k.id} type="button" className="pill" aria-pressed={eigeneKat === k.id} disabled={!!ergebnis}
                    onClick={() => setEigeneKat(k.id)}>{k.label}</button>
                ))}
              </div>
            </div>
            {!ergebnis ? (
              <div className="row">
                <button type="button" className="primary" disabled={!bereit} onClick={auswerten}>Auswerten</button>
                {!bereit && <span className="muted">Alle Bereiche und eine Einstufung wählen.</span>}
              </div>
            ) : (
              <>
                <Auswertung v={v} ergebnis={ergebnis} eigeneKategorie={eigeneKat} gewaehlt={gewaehlt} />
                <LernplanHinweis uebernahme={lernplan.uebernahme} fehler={lernplan.fehler} />
                <div className="row">
                  {onWeiter && <button type="button" className="primary" onClick={onWeiter}>Nächster Fall</button>}
                  <button type="button" onClick={onZurueck}>Alle Fälle</button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Seite

export default function AssessmentTrainer() {
  const { params } = useRoute();
  const gruppeParam = params.get('gruppe');
  const gruppe: Gruppe = istGruppe(gruppeParam) ? gruppeParam : 'braden';
  const modus: Modus = params.get('modus') === 'faelle' || params.get('fall') ? 'faelle' : 'rechner';
  const fall = VIGNETTEN.find((v) => v.id === params.get('fall'));
  const [schmerzInstrument, setSchmerzInstrument] = useState<InstrumentId>('nrs');
  const [erledigt, setErledigt] = useState<Erledigt>(ladeErledigt);

  const gruppeInfo = GRUPPEN.find((g) => g.id === gruppe)!;
  const rechnerInstrument = gruppe === 'schmerz' ? schmerzInstrument : gruppeInfo.instrumente[0];
  const faelleDerGruppe = useMemo(() => VIGNETTEN.filter((v) => v.gruppe === gruppe), [gruppe]);

  function gehe(p: { gruppe?: Gruppe; modus?: Modus; fall?: string }) {
    const q = new URLSearchParams({ gruppe: p.gruppe ?? gruppe, modus: p.modus ?? modus });
    if (p.fall) q.set('fall', p.fall);
    navigate(`/lernen/assessment?${q}`);
  }

  function fertig(v: Vignette, e: VignettenErgebnis) {
    const prozent = Math.round((e.punkte / e.max) * 100);
    const next = { ...erledigt, [v.id]: { datum: new Date().toISOString().slice(0, 10), prozent } };
    setErledigt(next); speichereErledigt(next);
    void logActivity({
      kind: 'uebung', severity: prozent >= 85 ? 'info' : 'warning',
      title: `Assessment ${INSTRUMENTE[v.instrument].kurz}: ${v.titel}`,
      detail: `${e.punkte} von ${e.max} richtig, Summe ${e.summeIst} statt ${e.summeSoll}`,
    });
  }

  const naechster = fall ? faelleDerGruppe[faelleDerGruppe.findIndex((v) => v.id === fall.id) + 1] : undefined;

  return (
    <section className="page as">
      <div className="page__head">
        <h2>Assessment-Rechner</h2>
        <p className="muted">Braden, Barthel, NRS, BESD und MNA-SF ausrechnen oder an Fallvignetten üben. Funktioniert offline. Fallvignetten zählen im Lernplan als Abfrage, der freie Rechner nicht. Übungswerkzeug, kein Ersatz für das Formular deiner Einrichtung.</p>
      </div>

      <div className="card as__einstellungen">
        <div className="as__zeile">
          <span className="muted">Instrument</span>
          <div className="pills" role="group" aria-label="Instrument">
            {GRUPPEN.map((g) => (
              <button key={g.id} type="button" className="pill" aria-pressed={gruppe === g.id} onClick={() => gehe({ gruppe: g.id })}>{g.label}</button>
            ))}
          </div>
        </div>
        <div className="as__zeile">
          <span className="muted">Modus</span>
          <div className="pills" role="group" aria-label="Modus">
            <button type="button" className="pill" aria-pressed={modus === 'rechner'} onClick={() => gehe({ modus: 'rechner' })}>Rechner</button>
            <button type="button" className="pill" aria-pressed={modus === 'faelle'} onClick={() => gehe({ modus: 'faelle' })}>
              Fallvignetten <span className="pill__count">{faelleDerGruppe.length}</span>
            </button>
          </div>
        </div>
        {modus === 'rechner' && gruppe === 'schmerz' && (
          <div className="as__zeile">
            <span className="muted">Skala</span>
            <div className="pills" role="group" aria-label="Schmerzskala">
              {gruppeInfo.instrumente.map((id) => (
                <button key={id} type="button" className="pill" aria-pressed={schmerzInstrument === id} onClick={() => setSchmerzInstrument(id)}>
                  {id === 'nrs' ? 'NRS (Selbstauskunft)' : 'BESD (Demenz)'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {modus === 'rechner' && <Rechner instrumentId={rechnerInstrument} />}
      {modus === 'faelle' && !fall && (
        <>
          <p className="muted">Lies den Fall, schätze jeden Bereich ein und wähle die Einstufung. Danach siehst du die Musterlösung mit Begründung. Je Thema zählt im Lernplan der erste Fall des Tages.</p>
          <FallListe gruppe={gruppe} erledigt={erledigt} onWahl={(v) => gehe({ fall: v.id, modus: 'faelle' })} />
        </>
      )}
      {modus === 'faelle' && fall && (
        <Fall key={fall.id} v={fall} onFertig={fertig}
          onZurueck={() => gehe({ gruppe: fall.gruppe, modus: 'faelle' })}
          onWeiter={naechster ? () => gehe({ gruppe: naechster.gruppe, modus: 'faelle', fall: naechster.id }) : undefined} />
      )}
    </section>
  );
}
