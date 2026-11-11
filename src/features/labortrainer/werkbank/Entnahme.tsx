// Blutentnahme-Station: Identität, Arm, Stauen, Röhrchen in Reihenfolge füllen (mit Füllanimation),
// mischen, transportieren. Danach zeigt der Befund, welche Werte durch Fehler verfälscht wurden.

import { useEffect, useRef, useState } from 'react';
import { Roehrchen } from '../../../ui/sim/labor/Roehrchen';
import { formatWert, FLAG_TEXT, parameter, type Material } from '../../../ui/sim/labor/parameter';
import { ROEHRCHEN, type Farbsystem } from '../../../ui/sim/labor/praeanalytik';
import { wenigBewegung } from '../../../ui/shell/session';
import { bewerteEntnahme, staender, SZENARIEN, VERWURF, zielFuellung, type EntnahmeEingabe, type EntnahmeErgebnis, type EntnahmeSzenario, type Platz } from './entnahme';

type Schritt = 'identitaet' | 'arm' | 'stau' | 'roehrchen' | 'abschluss' | 'ergebnis';

const name = (p: Platz) => (p === VERWURF ? 'Verwurfröhrchen (leer)' : ROEHRCHEN[p].name);

export function Entnahme({ farbsystem }: { farbsystem: Farbsystem }) {
  const [szId, setSzId] = useState(SZENARIEN[0]!.id);
  const sz = SZENARIEN.find((s) => s.id === szId)!;
  return <EntnahmeLauf key={szId} sz={sz} farbsystem={farbsystem} wechseln={setSzId} />;
}

function EntnahmeLauf({ sz, farbsystem, wechseln }: { sz: EntnahmeSzenario; farbsystem: Farbsystem; wechseln: (id: string) => void }) {
  const [schritt, setSchritt] = useState<Schritt>('identitaet');
  const [identitaet, setIdentitaet] = useState<EntnahmeEingabe['identitaet']>();
  const [arm, setArm] = useState<'links' | 'rechts'>();
  const [stauStart, setStauStart] = useState<number>();
  const [stauEnde, setStauEnde] = useState<number>();
  const [jetzt, setJetzt] = useState(Date.now());
  const [regal] = useState<Platz[]>(() => staender(sz));
  const [folge, setFolge] = useState<Platz[]>([]);
  const [fuellung, setFuellung] = useState<Partial<Record<Material, number>>>({});
  const [aktiv, setAktiv] = useState<{ platz: Platz; stand: number; ziel: number }>();
  const [mischen, setMischen] = useState<EntnahmeEingabe['mischen']>();
  const [transport, setTransport] = useState<EntnahmeEingabe['transport']>();
  const [ergebnis, setErgebnis] = useState<EntnahmeErgebnis>();
  const takt = useRef<number | undefined>(undefined);

  // Stauzeit live anzeigen
  useEffect(() => {
    if (stauStart === undefined || stauEnde !== undefined) return;
    const id = window.setInterval(() => setJetzt(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [stauStart, stauEnde]);

  // Füllanimation: Vakuum zieht Blut bis zum Ziel (bei „Bewegung reduzieren“ sofort)
  useEffect(() => {
    if (!aktiv || aktiv.stand >= aktiv.ziel) return;
    if (wenigBewegung()) { setAktiv({ ...aktiv, stand: aktiv.ziel }); return; }
    takt.current = window.setTimeout(() => setAktiv((a) => (a ? { ...a, stand: Math.min(a.ziel, a.stand + 0.08) } : a)), 90);
    return () => window.clearTimeout(takt.current);
  }, [aktiv]);

  const stauSek = stauStart === undefined ? 0 : Math.round(((stauEnde ?? jetzt) - stauStart) / 1000);

  const abziehen = () => {
    if (!aktiv) return;
    if (aktiv.platz !== VERWURF) setFuellung((f) => ({ ...f, [aktiv.platz]: aktiv.stand }));
    setFolge((f) => [...f, aktiv.platz]);
    setAktiv(undefined);
  };
  const aufstecken = (p: Platz) => {
    if (aktiv || folge.includes(p)) return;
    setAktiv({ platz: p, stand: 0, ziel: zielFuellung(sz, folge, p) });
  };
  const auswerten = () => {
    const ende = stauEnde ?? Date.now();
    const e: EntnahmeEingabe = { identitaet: identitaet ?? 'keine', arm: arm ?? 'rechts', stauzeit: stauStart === undefined ? 0 : Math.round((ende - stauStart) / 1000), folge, fuellung, mischen: mischen ?? 'schwenken', transport: transport ?? 'sofort' };
    setErgebnis(bewerteEntnahme(sz, e));
    setSchritt('ergebnis');
  };

  return (
    <section className="card wb-station" aria-labelledby="wb-entnahme">
      <div className="wb-kopf">
        <h3 id="wb-entnahme">Blutentnahme-Station</h3>
        <label className="wb-wahl">Situation
          <select value={sz.id} onChange={(e) => wechseln(e.target.value)}>
            {SZENARIEN.map((s) => <option key={s.id} value={s.id}>{s.titel}</option>)}
          </select>
        </label>
      </div>
      <div className="wb-patient">
        <p><strong>{sz.patient.anrede}</strong>, geb. {sz.patient.geburt}. {sz.lage}</p>
        <p className="muted wb-klein">Angefordert: {sz.parameter.map((id) => parameter(id).kurz).join(', ')}</p>
      </div>
      <ol className="wb-schritte" aria-label="Fortschritt">
        {(['identitaet', 'arm', 'stau', 'roehrchen', 'abschluss', 'ergebnis'] as Schritt[]).map((s, i) => (
          <li key={s} className={s === schritt ? 'is-jetzt' : ''} aria-current={s === schritt ? 'step' : undefined}>{['Identität', 'Arm', 'Stauen', 'Röhrchen', 'Abschluss', 'Befund'][i]}</li>
        ))}
      </ol>

      {schritt === 'identitaet' && (
        <div className="wb-feld">
          <p>Du stehst am Bett. Wie stellst du sicher, dass es die richtige Person ist?</p>
          <div className="wb-knoepfe">
            <button type="button" onClick={() => { setIdentitaet('offen'); setSchritt('arm'); }}>„Wie heißen Sie und wann sind Sie geboren?“ und Armband prüfen</button>
            <button type="button" onClick={() => { setIdentitaet('geschlossen'); setSchritt('arm'); }}>„Sind Sie {sz.patient.anrede}?“</button>
            <button type="button" onClick={() => { setIdentitaet('keine'); setSchritt('arm'); }}>Direkt anfangen, die Zimmernummer stimmt ja</button>
          </div>
        </div>
      )}

      {schritt === 'arm' && (
        <div className="wb-feld">
          <p>{identitaet === 'offen' ? `„${sz.patient.name}, ${sz.patient.geburt}.“ Das Armband stimmt. ` : identitaet === 'geschlossen' ? '„Ja, ja.“ (Nicken) ' : ''}An welchem Arm nimmst du ab?</p>
          <div className="wb-arme">
            {(['rechts', 'links'] as const).map((a) => (
              <button key={a} type="button" className="wb-arm" onClick={() => { setArm(a); setSchritt('stau'); }} aria-label={`${a === 'rechts' ? 'Rechter' : 'Linker'} Arm${sz.infusion === a ? ', hier läuft eine Infusion' : ''}`}>
                <svg viewBox="0 0 120 60" aria-hidden="true" className={a === 'links' ? 'is-gespiegelt' : ''}>
                  <path d="M6 30 C30 18 70 16 112 24 L112 38 C70 44 30 44 6 34 Z" className="wb-arm__haut" />
                  <path d="M56 26 C70 27 86 28 104 30" className="wb-arm__vene" />
                  {sz.infusion === a && <g className="wb-arm__infusion"><rect x="40" y="22" width="16" height="10" rx="2" /><path d="M48 22 L48 2" /></g>}
                </svg>
                <span>{a === 'rechts' ? 'Rechter Arm' : 'Linker Arm'}{sz.infusion === a ? ' (Infusion)' : ''}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {schritt === 'stau' && (
        <div className="wb-feld">
          <p>Desinfiziert, Einwirkzeit abgewartet. Leg den Stau an und punktiere{sz.fluegel ? ' mit der Flügelkanüle' : ''}.</p>
          <button type="button" className="primary" onClick={() => { setStauStart(Date.now()); setJetzt(Date.now()); setSchritt('roehrchen'); }}>Stau anlegen und punktieren</button>
        </div>
      )}

      {schritt === 'roehrchen' && (
        <div className="wb-feld">
          <div className={`wb-stau ${stauEnde === undefined && stauSek > 60 ? 'is-warn' : ''}`} role="status">
            <span>Stau {stauEnde === undefined ? 'liegt' : 'gelöst'}: <strong>{stauSek} s</strong></span>
            {stauEnde === undefined && <button type="button" onClick={() => setStauEnde(Date.now())}>Stau lösen</button>}
          </div>
          <p className="muted wb-klein">Tippe die Röhrchen in der Reihenfolge an, in der du sie füllst. Das Vakuum zieht das Blut; ziehe ab, wenn das Röhrchen voll ist.</p>
          <div className="wb-regal" role="group" aria-label="Röhrchenständer">
            {regal.map((p) => {
              const fertig = folge.includes(p);
              return (
                <button key={p} type="button" className="wb-roehrchen" disabled={fertig || !!aktiv} onClick={() => aufstecken(p)} aria-label={`${name(p)}${fertig ? ', gefüllt' : ''}`}>
                  {p === VERWURF ? <span className="wb-verwurf" aria-hidden="true" /> : <Roehrchen material={p} farbsystem={farbsystem} fuellung={fertig ? fuellung[p] ?? 1 : 0} beschriftung />}
                  {p === VERWURF && <span className="roehrchen__name">Verwurf</span>}
                  {fertig && <span className="wb-nr" aria-hidden="true">{folge.indexOf(p) + 1}</span>}
                </button>
              );
            })}
          </div>
          <div className="wb-halter" aria-live="polite">
            {aktiv ? (
              <>
                <div className="wb-halter__roehrchen">{aktiv.platz === VERWURF ? <span className="wb-verwurf is-gross" aria-hidden="true" /> : <Roehrchen material={aktiv.platz} farbsystem={farbsystem} fuellung={aktiv.stand} beschriftung={false} />}</div>
                <p>{name(aktiv.platz)}: {Math.round(aktiv.stand * 100)} %{aktiv.stand >= aktiv.ziel ? (aktiv.ziel < 1 && aktiv.platz !== VERWURF ? ' – füllt sich nicht weiter' : ' – voll') : ' …'}</p>
                <button type="button" className="primary" onClick={abziehen}>Abziehen</button>
              </>
            ) : <p className="muted">Kein Röhrchen im Halter.</p>}
          </div>
          <button type="button" disabled={!!aktiv || folge.length === 0} onClick={() => { if (stauEnde === undefined) setStauEnde(Date.now()); setSchritt('abschluss'); }}>Kanüle entfernen und abdrücken</button>
        </div>
      )}

      {schritt === 'abschluss' && (
        <div className="wb-feld">
          <p>Röhrchen mischen:</p>
          <div className="wb-knoepfe" role="group" aria-label="Mischen">
            <button type="button" aria-pressed={mischen === 'schwenken'} onClick={() => setMischen('schwenken')}>Mehrmals sanft schwenken</button>
            <button type="button" aria-pressed={mischen === 'schuetteln'} onClick={() => setMischen('schuetteln')}>Kräftig schütteln</button>
          </div>
          <p>Transport ins Labor:</p>
          <div className="wb-knoepfe" role="group" aria-label="Transport">
            <button type="button" aria-pressed={transport === 'sofort'} onClick={() => setTransport('sofort')}>Sofort mit dem Rohrpostsystem</button>
            <button type="button" aria-pressed={transport === 'spaeter'} onClick={() => setTransport('spaeter')}>Mit der nächsten Sammelrunde in 3 Stunden</button>
          </div>
          <button type="button" className="primary" disabled={!mischen || !transport} onClick={auswerten}>Ins Labor schicken</button>
        </div>
      )}

      {schritt === 'ergebnis' && ergebnis && <EntnahmeBefund e={ergebnis} />}
      {schritt === 'ergebnis' && <button type="button" onClick={() => wechseln(SZENARIEN[(SZENARIEN.indexOf(sz) + 1) % SZENARIEN.length]!.id)}>Nächste Situation</button>}
    </section>
  );
}

function EntnahmeBefund({ e }: { e: EntnahmeErgebnis }) {
  return (
    <div className="wb-feld">
      <p className="wb-punkte"><strong>{e.punkte} von {e.max}</strong> Punkten bei der Entnahme.</p>
      {e.fehler.length ? (
        <ul className="wb-fehler">
          {e.fehler.map((f) => <li key={f.art}><strong>{f.titel}:</strong> {f.folge}</li>)}
        </ul>
      ) : <p>Keine Präanalytikfehler: Die Werte entsprechen dem wahren Zustand.</p>}
      {e.hinweise.map((h) => <p key={h} className="wb-hinweis">{h}</p>)}
      <table className="wb-tabelle">
        <caption className="visually-hidden">Befund: wahrer und gemessener Wert</caption>
        <thead><tr><th scope="col">Parameter</th><th scope="col">Im Körper</th><th scope="col">Im Befund</th></tr></thead>
        <tbody>
          {e.werte.map((w) => {
            const p = parameter(w.id);
            return (
              <tr key={w.id} className={w.verfaelscht ? 'is-falsch' : ''}>
                <th scope="row">{p.name}</th>
                <td>{formatWert(p, w.wahr)} {p.einheit}</td>
                <td>{w.gemessen === undefined ? <em>kein Wert</em> : <>{formatWert(p, w.gemessen)} {p.einheit}{w.flagGemessen && w.flagGemessen !== 'normal' ? ` (${FLAG_TEXT[w.flagGemessen]})` : ''}{w.verfaelscht ? ' – verfälscht' : ''}</>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
