// Labor im Fall: Werte anfordern, Probe abnehmen (Präanalytik als Entscheidungen), Eingang und Kumulativbefund.

import { useMemo, useState } from 'react';
import { GRUPPEN, istKind, PARAMETER, parameter, type Gruppe } from '../../ui/sim/labor/parameter';
import { benoetigteRoehrchen, reihenfolgeFehler, ROEHRCHEN, STANDARD_ABNAHME, venoes, type Abnahme, type Farbsystem } from '../../ui/sim/labor/praeanalytik';
import { uhrzeit, type Prioritaet } from '../../ui/sim/labor/modell';
import { LaborTafel } from '../../ui/sim/labor/LaborTafel';
import { Roehrchen } from '../../ui/sim/labor/Roehrchen';
import type { Material } from '../../ui/sim/labor/parameter';
import { befundReihen, ergebnisse, type Befehl, type Lauf } from './lauf';
import type { DiagnostikFall } from './typen';

const GRUPPEN_REIHE: Gruppe[] = ['blutbild', 'entzuendung', 'elektrolyte', 'niere', 'herz', 'gerinnung', 'stoffwechsel', 'schilddruese', 'bga', 'urin', 'mikrobiologie'];

export function LaborBereich({ fall, lauf, senden, farbsystem, setFarbsystem }: { fall: DiagnostikFall; lauf: Lauf; senden: (b: Befehl) => void; farbsystem: Farbsystem; setFarbsystem: (f: Farbsystem) => void }) {
  const [auswahl, setAuswahl] = useState<string[]>([]);
  const [prioritaet, setPrioritaet] = useState<Prioritaet>('notfall');
  const [schritt, setSchritt] = useState<'auftrag' | 'abnahme'>('auftrag');
  const [abnahme, setAbnahme] = useState<Abnahme>({ ...STANDARD_ABNAHME, identitaetGeprueft: false, stauzeit: 30 });
  const [gefuellt, setGefuellt] = useState<Material[]>([]);

  const materialien = useMemo(() => benoetigteRoehrchen(auswahl), [auswahl]);
  const venoeseRoehrchen = materialien.filter(venoes);
  const brauchtVene = venoeseRoehrchen.length > 0;
  const umschalten = (id: string) => setAuswahl((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const alleGefuellt = venoeseRoehrchen.every((m) => gefuellt.includes(m));
  const reihenfolge = reihenfolgeFehler(gefuellt);

  const abschliessen = () => {
    senden({ typ: 'labor', parameter: auswahl, prioritaet, abnahme: { ...abnahme, reihenfolge: gefuellt } });
    setAuswahl([]); setGefuellt([]); setSchritt('auftrag');
    setAbnahme({ ...STANDARD_ABNAHME, identitaetGeprueft: false, stauzeit: 30 });
  };

  const erg = ergebnisse(lauf, fall);
  const ausstehend = erg.flatMap((a) => a.ergebnisse.filter((e) => e.fertig > lauf.minute).map((e) => ({ e, a })));
  const abgelehnt = erg.flatMap((a) => a.ergebnisse.filter((e) => e.wert === undefined && e.fertig <= lauf.minute).map((e) => ({ e, a })));
  const reihen = befundReihen(lauf, fall);
  const neuAb = Math.max(0, lauf.minute - 1);

  return (
    <div className="dx-labor">
      {schritt === 'auftrag' ? (
        <section className="card dx-karte" aria-labelledby="dx-auftrag">
          <h3 id="dx-auftrag">Laborauftrag</h3>
          <p className="muted">Wähle, was du nach ärztlicher Rücksprache bzw. Standard abnehmen oder patientennah messen willst. Jede Abnahme kostet Zeit; Ergebnisse aus dem Zentrallabor kommen nach Transport und Laufzeit.</p>
          {GRUPPEN_REIHE.map((g) => {
            const ps = PARAMETER.filter((p) => p.gruppe === g);
            return (
              <fieldset key={g} className="dx-gruppe">
                <legend>{GRUPPEN[g]}{ps[0].ort !== 'labor' && <span className="dx-ort"> · {ps[0].ort === 'poct' ? 'patientennah' : 'Mikrobiologie'}</span>}</legend>
                <div className="pills">
                  {ps.map((p) => <button key={p.id} type="button" className="pill" aria-pressed={auswahl.includes(p.id)} onClick={() => umschalten(p.id)} title={p.bedeutung}>{p.kurz}</button>)}
                </div>
              </fieldset>
            );
          })}
          <div className="dx-zeile">
            <div className="pills" role="group" aria-label="Dringlichkeit">
              <button type="button" className="pill" aria-pressed={prioritaet === 'notfall'} onClick={() => setPrioritaet('notfall')}>Notfall</button>
              <button type="button" className="pill" aria-pressed={prioritaet === 'routine'} onClick={() => setPrioritaet('routine')}>Routine</button>
            </div>
            <button type="button" className="primary" disabled={!auswahl.length} onClick={() => (brauchtVene ? setSchritt('abnahme') : abschliessen())}>
              {brauchtVene ? `Zur Blutabnahme (${auswahl.length})` : `Messen (${auswahl.length})`}
            </button>
          </div>
        </section>
      ) : (
        <section className="card dx-karte" aria-labelledby="dx-abnahme">
          <h3 id="dx-abnahme">Blutabnahme am Bett</h3>
          <ol className="dx-abnahme">
            <li>
              <label className="dx-check"><input type="checkbox" checked={abnahme.identitaetGeprueft} onChange={(e) => setAbnahme({ ...abnahme, identitaetGeprueft: e.target.checked })} /> Identität aktiv erfragt (Name, Geburtsdatum), Armband geprüft, Röhrchen am Bett beschriftet</label>
            </li>
            <li>
              <span className="dx-label">Arm</span>
              <div className="pills">
                <button type="button" className="pill" aria-pressed={!abnahme.infusionsarm} onClick={() => setAbnahme({ ...abnahme, infusionsarm: false })}>{fall.patient.infusion ? 'Arm ohne Infusion' : 'Gut tastbare Vene'}</button>
                {fall.patient.infusion && <button type="button" className="pill" aria-pressed={abnahme.infusionsarm} onClick={() => setAbnahme({ ...abnahme, infusionsarm: true })}>Arm mit Infusion ({fall.patient.infusion.split(' am ')[0]})</button>}
              </div>
            </li>
            <li>
              <span className="dx-label">Stauen</span>
              <div className="pills">
                {[[30, 'kurz (unter 1 min)'], [90, 'etwa 1,5 min'], [180, 'über 2 min, Vene schwer zu finden']].map(([s, t]) => <button key={s} type="button" className="pill" aria-pressed={abnahme.stauzeit === s} onClick={() => setAbnahme({ ...abnahme, stauzeit: s as number })}>{t}</button>)}
              </div>
            </li>
            <li>
              <span className="dx-label">Röhrchen in der Reihenfolge antippen, in der du sie füllst</span>
              <div className="dx-farbsystem pills" role="group" aria-label="Farbsystem der Röhrchen">
                <button type="button" className="pill" aria-pressed={farbsystem === 'eu'} onClick={() => setFarbsystem('eu')}>Farben Europa (z. B. Monovette)</button>
                <button type="button" className="pill" aria-pressed={farbsystem === 'iso'} onClick={() => setFarbsystem('iso')}>Farben international (z. B. Vacutainer)</button>
              </div>
              <div className="dx-roehrchen">
                {venoeseRoehrchen.map((m) => {
                  const pos = gefuellt.indexOf(m);
                  return (
                    <button key={m} type="button" className="dx-roehrchen__knopf" aria-pressed={pos >= 0} onClick={() => setGefuellt((g) => (g.includes(m) ? g.filter((x) => x !== m) : [...g, m]))} aria-label={`${ROEHRCHEN[m].name}, Kappe ${ROEHRCHEN[m].farbe[farbsystem].name}${pos >= 0 ? `, als ${pos + 1}. gefüllt` : ''}`}>
                      <Roehrchen material={m} farbsystem={farbsystem} fuellung={pos >= 0 ? 1 : 0} />
                      {pos >= 0 && <span className="dx-roehrchen__nr" aria-hidden="true">{pos + 1}</span>}
                    </button>
                  );
                })}
              </div>
              <p className="muted dx-klein">Farben unterscheiden sich je Hersteller; maßgeblich ist die Liste deines Hauses. {materialien.filter((m) => !venoes(m)).map((m) => ROEHRCHEN[m].name).join(', ')}{materialien.some((m) => !venoes(m)) ? ' wird zusätzlich patientennah gewonnen.' : ''}</p>
            </li>
            {materialien.includes('citrat') && (
              <li><label className="dx-check"><input type="checkbox" checked={abnahme.citratVoll} onChange={(e) => setAbnahme({ ...abnahme, citratVoll: e.target.checked })} /> Citratröhrchen bis zur Markierung gefüllt</label></li>
            )}
            <li>
              <span className="dx-label">Danach</span>
              <div className="pills">
                <button type="button" className="pill" aria-pressed={!abnahme.geschuettelt} onClick={() => setAbnahme({ ...abnahme, geschuettelt: false })}>sanft schwenken</button>
                <button type="button" className="pill" aria-pressed={!!abnahme.geschuettelt} onClick={() => setAbnahme({ ...abnahme, geschuettelt: true })}>kräftig schütteln</button>
              </div>
              <div className="pills">
                <button type="button" className="pill" aria-pressed={abnahme.sofortTransport} onClick={() => setAbnahme({ ...abnahme, sofortTransport: true })}>sofort per Rohrpost</button>
                <button type="button" className="pill" aria-pressed={!abnahme.sofortTransport} onClick={() => setAbnahme({ ...abnahme, sofortTransport: false })}>mit der nächsten Sammelrunde</button>
              </div>
            </li>
          </ol>
          {alleGefuellt && reihenfolge.falsch && <p className="dx-hinweis" role="status">Hinweis: Deine Reihenfolge weicht von der empfohlenen ab. Du kannst trotzdem abschließen und im Befund sehen, was passiert.</p>}
          <div className="dx-zeile">
            <button type="button" onClick={() => setSchritt('auftrag')}>Zurück</button>
            <button type="button" className="primary" disabled={!alleGefuellt} onClick={abschliessen}>{alleGefuellt ? 'Abnahme abschließen' : 'Erst alle Röhrchen füllen'}</button>
          </div>
        </section>
      )}

      {ausstehend.length > 0 && (
        <section className="card dx-karte" aria-labelledby="dx-unterwegs">
          <h3 id="dx-unterwegs">Unterwegs</h3>
          <ul className="dx-liste">
            {[...new Map(ausstehend.map(({ e, a }) => [`${a.auftrag.id}-${e.fertig}`, { e, a }])).values()].map(({ e, a }) => (
              <li key={`${a.auftrag.id}-${e.fertig}`}>
                <span>{a.ergebnisse.filter((x) => x.fertig === e.fertig).map((x) => parameter(x.parameter).kurz).join(', ')}</span>
                <span className="muted">erwartet {uhrzeit(fall.startzeit, e.fertig)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {abgelehnt.length > 0 && (
        <section className="card dx-karte" aria-labelledby="dx-abgelehnt">
          <h3 id="dx-abgelehnt">Rückmeldung des Labors</h3>
          <ul className="dx-liste">
            {[...new Map(abgelehnt.map(({ e, a }) => [`${a.auftrag.id}-${e.kommentar}`, { e, a }])).values()].map(({ e, a }) => (
              <li key={`${a.auftrag.id}-${e.kommentar}`} className="dx-hinweis">
                <span><strong>{a.ergebnisse.filter((x) => x.wert === undefined && x.kommentar === e.kommentar).map((x) => parameter(x.parameter).kurz).join(', ')}:</strong> {e.kommentar}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card dx-karte" aria-labelledby="dx-kumulativ">
        <h3 id="dx-kumulativ">Kumulativbefund</h3>
        <LaborTafel reihen={reihen} geschlecht={fall.patient.geschlecht} startzeit={fall.startzeit} neuAb={neuAb} kind={istKind(fall.patient.alter)} />
      </section>
    </div>
  );
}
