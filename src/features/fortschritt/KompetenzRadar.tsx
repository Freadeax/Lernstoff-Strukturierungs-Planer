import { radarPunkte, veraenderung, VERGLEICH_TAGE, type RadarAchse } from './radar';

const linie = (p: Array<[number, number]>) => p.map((x) => x.join(',')).join(' ');

/** Radar-Grafik mit Fläche heute und gestrichelter Linie vor vier Wochen. Die Zahlen stehen auch im Text. */
export function KompetenzRadar({ achsen, klein = false }: { achsen: RadarAchse[]; klein?: boolean }) {
  if (achsen.length < 3) return null;
  const groesse = klein ? 150 : 260, mitte = groesse / 2, radius = klein ? 52 : 92, abstand = klein ? 14 : 22;
  const voll = achsen.map(() => 100);
  const mitVorher = achsen.some((a) => a.vorher !== undefined && a.vorher !== a.jetzt);
  const beschreibung = achsen.map((a) => `Bereich ${a.code}: ${a.jetzt} Prozent${a.vorher !== undefined ? `, vor ${VERGLEICH_TAGE} Tagen ${a.vorher}` : ''}`).join('; ');
  return (
    <svg className={`fs-radar${klein ? ' fs-radar--klein' : ''}`} viewBox={`0 0 ${groesse} ${groesse}`} role="img" aria-label={`Kompetenz-Radar. ${beschreibung}`}>
      {[25, 50, 75, 100].map((r) => <polygon key={r} className="fs-radar__ring" points={linie(radarPunkte(achsen.map(() => r), radius, mitte))} />)}
      {radarPunkte(voll, radius, mitte).map(([x, y], i) => <line key={i} className="fs-radar__achse" x1={mitte} y1={mitte} x2={x} y2={y} />)}
      {mitVorher && <polygon className="fs-radar__vorher" points={linie(radarPunkte(achsen.map((a) => a.vorher ?? 0), radius, mitte))} />}
      <polygon className="fs-radar__flaeche" points={linie(radarPunkte(achsen.map((a) => a.jetzt), radius, mitte))} />
      {radarPunkte(achsen.map((a) => a.jetzt), radius, mitte).map(([x, y], i) => <circle key={i} className="fs-radar__punkt" cx={x} cy={y} r={klein ? 2.5 : 3.5} />)}
      {radarPunkte(voll, radius + abstand, mitte).map(([x, y], i) => (
        <text key={i} x={x} y={y} className="fs-radar__text" textAnchor="middle" dominantBaseline="middle">{achsen[i]!.code}</text>
      ))}
    </svg>
  );
}

/** Tabelle zur Grafik: Bereich, Stärke heute, Veränderung. */
export function RadarTabelle({ achsen }: { achsen: RadarAchse[] }) {
  return (
    <table className="fs-radar-tabelle">
      <caption className="visually-hidden">Stärke je Kompetenzbereich</caption>
      <thead><tr><th scope="col">Bereich</th><th scope="col">Heute</th><th scope="col">vs. vor {VERGLEICH_TAGE} Tagen</th></tr></thead>
      <tbody>
        {achsen.map((a) => (
          <tr key={a.id}>
            <th scope="row"><span className="fs-code">{a.code}</span> {a.name}</th>
            <td>{a.themen ? `${a.jetzt} %` : '–'}</td>
            <td>{a.themen ? veraenderung(a) : '–'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
