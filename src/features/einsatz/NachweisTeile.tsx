import { useEffect, useRef, useState } from 'react';
import { personenbezug } from '../../ui/lib/personenbezug';
import { navigate, useRoute } from '../../ui/shell/router';
import { notify } from '../../ui/shell/notifications';
import { kurzDatum } from '../lernplan/ui/format';
import { aktuellerEinsatz, einsatzName, sortiert, type Einsatz } from './einsatz';
import type { SeitenCtx } from './EinsatzSeite';
import {
  eigeneTaetigkeit, GESPRAECHE, gespraechTermin, KATALOG, leererEinsatzNachweis, MAX_BILD, setzeGespraech, setzeStufe, STUFE_LABEL, STUFEN, vorbereitung, zaehle,
  type EinsatzNachweis, type Gespraech, type GespraechArt, type Nachweis, type Unterschrift,
} from './nachweis';
import { ladeNachweis, speichereNachweis } from './speicher';

// ---------------------------------------------------------------- Unterschrift (Finger oder Stift)

function UnterschriftFeld({ titel, wert, heute, onChange }: { titel: string; wert?: Unterschrift; heute: string; onChange: (u: Unterschrift | undefined) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const zeichnet = useRef(false);
  const [name, setName] = useState(wert?.name ?? '');
  const [gezeichnet, setGezeichnet] = useState(false);
  const [offen, setOffen] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [offen]);

  const punkt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [(e.clientX - r.left) * (e.currentTarget.width / r.width), (e.clientY - r.top) * (e.currentTarget.height / r.height)] as const;
  };
  const leeren = () => {
    const c = canvas.current, ctx = c?.getContext('2d');
    if (c && ctx) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    setGezeichnet(false);
  };
  const speichern = () => {
    const n = name.trim();
    if (!n) return;
    let bild: string | undefined;
    if (gezeichnet && canvas.current) {
      const d = canvas.current.toDataURL('image/png');
      if (d.length <= MAX_BILD) bild = d;
      else notify('warning', 'Unterschrift zu groß', 'Bitte etwas einfacher zeichnen. Der Name wurde trotzdem gespeichert.');
    }
    onChange({ name: n.slice(0, 120), datum: heute, ...(bild ? { bild } : {}) });
    setOffen(false);
  };

  if (wert && !offen) {
    return (
      <div className="nachweis__unterschrift">
        <p className="einsatz__klein"><strong>{titel}:</strong> {wert.name}, {kurzDatum(wert.datum)}</p>
        {wert.bild && <img src={wert.bild} alt={`Unterschrift von ${wert.name}`} className="nachweis__bild" />}
        <div className="faecher__aktionen nachweis__nicht-drucken">
          <button type="button" className="small ghost" onClick={() => onChange(undefined)}>Unterschrift entfernen</button>
        </div>
      </div>
    );
  }
  if (!offen) {
    return (
      <div className="nachweis__unterschrift">
        <p className="einsatz__klein"><strong>{titel}:</strong> <span className="muted">noch offen</span></p>
        <span className="nachweis__linie" aria-hidden="true" />
        <button type="button" className="small nachweis__nicht-drucken" onClick={() => setOffen(true)}>Abzeichnen lassen</button>
      </div>
    );
  }
  return (
    <div className="nachweis__unterschrift stack-2 nachweis__nicht-drucken">
      <label className="field">Name der Praxisanleitung
        <input value={name} maxLength={120} autoComplete="off" onChange={(e) => setName(e.target.value)} />
      </label>
      <p className="einsatz__klein muted">Unterschrift mit Finger oder Stift (freiwillig):</p>
      <canvas ref={canvas} width={480} height={150} className="nachweis__canvas" role="img" aria-label="Feld für die Unterschrift"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); zeichnet.current = true; const ctx = e.currentTarget.getContext('2d'); const [x, y] = punkt(e); ctx?.beginPath(); ctx?.moveTo(x, y); }}
        onPointerMove={(e) => { if (!zeichnet.current) return; const ctx = e.currentTarget.getContext('2d'); const [x, y] = punkt(e); ctx?.lineTo(x, y); ctx?.stroke(); setGezeichnet(true); }}
        onPointerUp={() => { zeichnet.current = false; }} onPointerCancel={() => { zeichnet.current = false; }} />
      <div className="faecher__aktionen">
        <button type="button" className="primary small" disabled={!name.trim()} onClick={speichern}>Bestätigen</button>
        <button type="button" className="small" onClick={leeren}>Feld leeren</button>
        <button type="button" className="small ghost" onClick={() => setOffen(false)}>Abbrechen</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Tätigkeiten

function TaetigkeitsListe({ n, heute, aendere }: { n: EinsatzNachweis; heute: string; aendere: (n: EinsatzNachweis) => void }) {
  const [eigen, setEigen] = useState('');
  const stand = new Map(n.vermerke.map((v) => [v.taetigkeit, v]));
  const gruppen = [...KATALOG, ...(n.eigene.length ? [{ id: 'eigen', titel: 'Eigene Tätigkeiten', taetigkeiten: n.eigene }] : [])];
  const z = zaehle(n);
  return (
    <section aria-labelledby="nw-taet" className="stack-2">
      <h2 id="nw-taet">Tätigkeiten</h2>
      <p className="muted einsatz__klein">Tipp die Stufe an, die du heute erreicht hast. Eine höhere Stufe ersetzt eine niedrigere. Stand: {z.selbststaendig} selbstständig, {z.angeleitet} unter Anleitung, {z.gesehen} gesehen.</p>
      {gruppen.map((g) => (
        <fieldset key={g.id} className="einsatz__themen nachweis__gruppe">
          <legend>{g.titel}</legend>
          <ul className="nachweis__taetigkeiten">
            {g.taetigkeiten.map((t) => {
              const v = stand.get(t.id);
              return (
                <li key={t.id} className="nachweis__zeile">
                  <span className="nachweis__label">{t.label}</span>
                  <span className="nachweis__stufen" role="group" aria-label={`Stufe: ${t.label}`}>
                    {STUFEN.map((s) => (
                      <button key={s.id} type="button" className={`small nachweis__stufe${v?.stufe === s.id ? ' is-aktiv' : ''}`} aria-pressed={v?.stufe === s.id}
                        title={s.label} onClick={() => aendere(setzeStufe(n, t.id, v?.stufe === s.id ? null : s.id, heute, true))}>{s.label}</button>
                    ))}
                  </span>
                  {v && <span className="muted einsatz__klein nachweis__datum">{STUFE_LABEL[v.stufe]} am {kurzDatum(v.datum)}</span>}
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}
      <form className="einsatz__werkzeug nachweis__nicht-drucken" onSubmit={(e) => { e.preventDefault(); aendere(eigeneTaetigkeit(n, eigen)); setEigen(''); }}>
        <label className="field einsatz__filter">Eigene Tätigkeit ergänzen
          <input value={eigen} maxLength={200} onChange={(e) => setEigen(e.target.value)} placeholder="z. B. PEG-Verband" />
        </label>
        <button type="submit" disabled={!eigen.trim()}>Hinzufügen</button>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------- Gespräche

const FELDER: Array<{ feld: keyof Pick<Gespraech, 'ziele' | 'gut' | 'unterstuetzung' | 'fragen' | 'vereinbarungen'>; label: string }> = [
  { feld: 'ziele', label: 'Meine Lernziele für diesen Einsatz' },
  { feld: 'gut', label: 'Was schon gut klappt' },
  { feld: 'unterstuetzung', label: 'Wobei ich noch Anleitung brauche' },
  { feld: 'fragen', label: 'Meine Fragen' },
  { feld: 'vereinbarungen', label: 'Vereinbarungen (im Gespräch ausfüllen)' },
];

function GespraechKarte({ ctx, e, n, art, aendere }: { ctx: SeitenCtx; e: Einsatz; n: EinsatzNachweis; art: GespraechArt; aendere: (n: EinsatzNachweis) => void }) {
  const info = GESPRAECHE.find((g) => g.id === art)!;
  const g = n.gespraeche.find((x) => x.art === art);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [felder, setFelder] = useState<Gespraech>(() => g ?? { art, datum: gespraechTermin(e, art), vereinbarungen: '', ...vorbereitung(e, n, ctx.tagebuch, art) });
  const warn = personenbezug(FELDER.map((f) => felder[f.feld]).join(' ')).length > 0;
  const starten = () => { setFelder(g ?? { art, datum: gespraechTermin(e, art), vereinbarungen: '', ...vorbereitung(e, n, ctx.tagebuch, art) }); setBearbeiten(true); };
  return (
    <article className="card stack-2 nachweis__gespraech">
      <div className="einsatz__kopf">
        <h3>{info.titel}</h3>
        <span className="muted einsatz__klein">{g?.datum ? kurzDatum(g.datum) : `${info.wann}, etwa ${kurzDatum(gespraechTermin(e, art))}`}</span>
      </div>
      {bearbeiten ? (
        <form className="stack-2" onSubmit={(ev) => { ev.preventDefault(); aendere(setzeGespraech(n, felder)); setBearbeiten(false); }}>
          <label className="field">Datum
            <input type="date" value={felder.datum} min={e.von} max={e.bis} onChange={(ev) => setFelder({ ...felder, datum: ev.target.value })} />
          </label>
          {FELDER.map((f) => (
            <label key={f.feld} className="field">{f.label}
              <textarea rows={3} maxLength={2000} value={felder[f.feld]} onChange={(ev) => setFelder({ ...felder, [f.feld]: ev.target.value })} />
            </label>
          ))}
          {warn && <p className="note warn" role="status">Bitte keine Namen von Patientinnen, Patienten oder Kolleginnen eintragen.</p>}
          <div className="faecher__aktionen">
            <button type="submit" className="primary">Speichern</button>
            <button type="button" className="ghost" onClick={() => setBearbeiten(false)}>Abbrechen</button>
          </div>
        </form>
      ) : g ? (
        <>
          <dl className="nachweis__felder">
            {FELDER.map((f) => g[f.feld] ? <div key={f.feld}><dt>{f.label}</dt><dd>{g[f.feld]}</dd></div> : null)}
          </dl>
          <UnterschriftFeld titel="Gespräch geführt mit" wert={g.unterschrift} heute={ctx.heute}
            onChange={(u) => { const { unterschrift: _, ...ohne } = g; aendere(setzeGespraech(n, u ? { ...ohne, unterschrift: u } : ohne)); }} />
          <div className="faecher__aktionen nachweis__nicht-drucken">
            <button type="button" className="small" onClick={starten}>Bearbeiten</button>
            <button type="button" className="small ghost" onClick={() => aendere({ ...n, gespraeche: n.gespraeche.filter((x) => x.art !== art) })}>Löschen</button>
          </div>
        </>
      ) : (
        <div className="nachweis__nicht-drucken">
          <p className="muted einsatz__klein">Die Vorbereitung füllt sich aus deinen Lernzielen, offenen Fragen im Praxistagebuch und dem Stand der Tätigkeiten.</p>
          <button type="button" className="small" onClick={starten}>Vorbereiten</button>
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------- Seite

export function NachweisAnsicht({ ctx }: { ctx: SeitenCtx }) {
  const { params } = useRoute();
  const [nachweis, setNachweis] = useState<Nachweis>(ladeNachweis);
  const liste = sortiert(ctx.liste);
  const gewaehlt = params.get('einsatz');
  const e = liste.find((x) => x.id === gewaehlt) ?? aktuellerEinsatz(liste, ctx.heute) ?? liste[liste.length - 1];
  if (!e) {
    return (
      <div className="stack-2">
        <p>Der Ausbildungsnachweis hängt an einem Einsatz. Trag zuerst deinen Einsatz ein.</p>
        <button type="button" className="primary einsatz__neu" onClick={() => navigate('/lernen/einsatz?neu=1')}>Einsatz eintragen</button>
      </div>
    );
  }
  const n = nachweis.einsaetze[e.id] ?? leererEinsatzNachweis();
  const aendere = (neu: EinsatzNachweis) => {
    const alle = { ...nachweis, einsaetze: { ...nachweis.einsaetze, [e.id]: neu } };
    if (!speichereNachweis(alle)) notify('critical', 'Nicht gespeichert', 'Der Gerätespeicher ist voll oder gesperrt.');
    setNachweis(alle);
  };
  return (
    <div className="stack-3 nachweis">
      <p className="note">Das ist deine Vorbereitung. Der offizielle Ausbildungsnachweis kommt von Schule und Träger. Übertrag die Einträge dorthin oder leg den Ausdruck dazu, wenn deine Schule das erlaubt.</p>
      <div className="einsatz__werkzeug nachweis__nicht-drucken">
        {liste.length > 1 && (
          <label className="field einsatz__filter">Einsatz
            <select value={e.id} onChange={(ev) => navigate(`/lernen/einsatz?ansicht=nachweis&einsatz=${encodeURIComponent(ev.target.value)}`)}>
              {liste.map((x) => <option key={x.id} value={x.id}>{einsatzName(x)}</option>)}
            </select>
          </label>
        )}
        <button type="button" onClick={() => window.print()}>Drucken oder als PDF sichern</button>
      </div>
      <header className="nachweis__kopf">
        <h2>Ausbildungsnachweis: {einsatzName(e)}</h2>
        <p className="muted einsatz__klein">{kurzDatum(e.von)} bis {kurzDatum(e.bis)}{e.bereich ? `, ${e.bereich}` : ''}</p>
      </header>
      <TaetigkeitsListe n={n} heute={ctx.heute} aendere={aendere} />
      <UnterschriftFeld titel="Tätigkeiten bestätigt von" wert={n.bestaetigung} heute={ctx.heute}
        onChange={(u) => { const { bestaetigung: _, ...ohne } = n; aendere(u ? { ...ohne, bestaetigung: u } : ohne); }} />
      <section aria-labelledby="nw-gespr" className="stack-2">
        <h2 id="nw-gespr">Anleitungsgespräche</h2>
        <div className="nachweis__gespraeche">
          {GESPRAECHE.map((g) => <GespraechKarte key={`${e.id}-${g.id}`} ctx={ctx} e={e} n={n} art={g.id} aendere={aendere} />)}
        </div>
      </section>
    </div>
  );
}
