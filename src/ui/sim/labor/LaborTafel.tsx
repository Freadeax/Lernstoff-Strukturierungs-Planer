// Kumulativbefund wie im Klinik-Informationssystem: je Parameter der letzte Wert mit Kennzeichen
// (L/H/LL/HH), Referenzbereich, Mini-Verlauf und Laborkommentar. Neue Werte leuchten kurz auf
// (nicht bei „Bewegung reduzieren“). Der Verlauf ist Schmuck, die Zahlen stehen in der Tabelle.

import { Fragment } from 'react';
import { bewerte, FLAG_KURZ, FLAG_TEXT, formatReferenz, formatWert, GRUPPEN, parameter, PARAMETER, type Geschlecht } from './parameter';
import { uhrzeit, vorZeit, type Ergebnis } from './modell';
import './labor.css';

export type LaborReihen = Record<string, { minute: number; wert: number; ergebnis?: Ergebnis }[]>;

function Verlauf({ punkte, nachkomma }: { punkte: number[]; nachkomma: number }) {
  if (punkte.length < 2) return null;
  const min = Math.min(...punkte), max = Math.max(...punkte), spanne = max - min || 1;
  const w = 64, h = 22;
  const pts = punkte.map((p, i) => `${(i / (punkte.length - 1)) * (w - 4) + 2},${h - 3 - ((p - min) / spanne) * (h - 6)}`).join(' ');
  const steigt = punkte[punkte.length - 1] > punkte[punkte.length - 2];
  return (
    <svg className="lt__verlauf" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true" data-nachkomma={nachkomma}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={w - 2} cy={h - 3 - ((punkte[punkte.length - 1] - min) / spanne) * (h - 6)} r="2.2" fill="currentColor" />
      <title>{steigt ? 'steigend' : 'fallend oder gleich'}</title>
    </svg>
  );
}

export interface LaborTafelProps {
  reihen: LaborReihen;
  geschlecht: Geschlecht;
  startzeit: string;
  /** Werte ab dieser Minute gelten als neu und werden hervorgehoben. */
  neuAb?: number;
  /** Nur diese Parameter zeigen (sonst alle mit Werten). */
  nur?: string[];
}

export function LaborTafel({ reihen, geschlecht, startzeit, neuAb, nur }: LaborTafelProps) {
  const ids = PARAMETER.map((p) => p.id).filter((id) => reihen[id]?.length && (!nur || nur.includes(id)));
  if (!ids.length) return <p className="muted">Noch keine Laborwerte. Fordere zuerst Werte an und nimm die Probe ab.</p>;
  const gruppen = [...new Set(ids.map((id) => parameter(id).gruppe))];
  return (
    <div className="lt" role="region" aria-label="Kumulativbefund">
      <table className="lt__tabelle">
        <thead>
          <tr><th scope="col">Parameter</th><th scope="col" className="lt__zahl">Wert</th><th scope="col" className="lt__ref">Referenz</th><th scope="col"><span className="visually-hidden">Verlauf</span></th></tr>
        </thead>
        <tbody>
          {gruppen.map((g) => (
            <Fragment key={g}>
              <tr className="lt__gruppe"><th scope="rowgroup" colSpan={4}>{GRUPPEN[g]}</th></tr>
              {ids.filter((id) => parameter(id).gruppe === g).map((id) => {
                const p = parameter(id);
                const reihe = reihen[id];
                const letzter = reihe[reihe.length - 1];
                const flag = bewerte(p, letzter.wert, geschlecht);
                const neu = neuAb !== undefined && letzter.ergebnis && letzter.minute >= neuAb;
                const vorher = reihe.length > 1 ? reihe[reihe.length - 2] : undefined;
                return (
                  <tr key={id} className={`lt__zeile lt__zeile--${flag}${neu ? ' is-neu' : ''}`}>
                    <th scope="row">
                      <span className="lt__name">{p.name}</span>
                      <span className="lt__zeit">{letzter.minute < 0 ? vorZeit(letzter.minute) : uhrzeit(startzeit, letzter.minute)}{vorher ? ` · vorher ${formatWert(p, vorher.wert)}` : ''}</span>
                      {letzter.ergebnis?.kommentar && <span className="lt__kommentar">{letzter.ergebnis.kommentar}</span>}
                    </th>
                    <td className="lt__zahl">
                      <span className="lt__wert">{formatWert(p, letzter.wert)}</span> <span className="lt__einheit">{p.einheit}</span>
                      {flag !== 'normal' && <span className={`lt__flag lt__flag--${flag}`} title={FLAG_TEXT[flag]}><span aria-hidden="true">{FLAG_KURZ[flag]}</span><span className="visually-hidden">{FLAG_TEXT[flag]}</span></span>}
                    </td>
                    <td className="lt__ref">{formatReferenz(p, geschlecht)}</td>
                    <td className="lt__spark">{!p.stufen && <Verlauf punkte={reihe.map((r) => r.wert)} nachkomma={p.nachkomma} />}</td>
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LaborTafel;
