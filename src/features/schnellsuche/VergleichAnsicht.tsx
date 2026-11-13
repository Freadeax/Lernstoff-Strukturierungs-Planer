import { useState } from 'react';
import { DNQP_STANDARDS } from './dnqp-quelle';
import { dnqpLink } from './quellen';
import { PHASEN, SPALTEN, vergleiche, type Phase } from './vergleich';

/** Gleiche Phase oder Ebene über alle Expertenstandards nebeneinander. */
export function VergleichAnsicht() {
  const [phase, setPhase] = useState<Phase | undefined>('einschaetzung');
  const [ebene, setEbene] = useState<number | undefined>();
  const [spalten, setSpalten] = useState<Set<string>>(new Set(['S', 'P', 'E']));
  const maxEbene = Math.max(0, ...DNQP_STANDARDS.flatMap((s) => s.kriterien.map((k) => k.nr)));
  const zeilen = vergleiche(DNQP_STANDARDS, phase ? { phase } : { ebene });
  const sichtbar = SPALTEN.filter((s) => spalten.has(s.ebene));

  return (
    <div className="sus__vergleich">
      <div className="card sus__suche">
        <p className="sus__label">Was willst du vergleichen?</p>
        <div className="pills" role="group" aria-label="Phase des Pflegeprozesses">
          {PHASEN.map((p) => (
            <button type="button" key={p.id} className="pill" aria-pressed={phase === p.id} onClick={() => { setPhase(p.id); setEbene(undefined); }}>{p.label}</button>
          ))}
        </div>
        <div className="pills" role="group" aria-label="Ebene im Standard">
          {Array.from({ length: maxEbene }, (_, i) => i + 1).map((n) => (
            <button type="button" key={n} className="pill" aria-pressed={!phase && ebene === n} onClick={() => { setEbene(n); setPhase(undefined); }}>Ebene {n}</button>
          ))}
        </div>
        <div className="pills" role="group" aria-label="Spalten">
          {SPALTEN.map((s) => (
            <button type="button" key={s.ebene} className="pill" aria-pressed={spalten.has(s.ebene)}
              onClick={() => setSpalten((alt) => { const n = new Set(alt); if (n.has(s.ebene) && n.size > 1) n.delete(s.ebene); else n.add(s.ebene); return n; })}>
              {s.label}
            </button>
          ))}
        </div>
        <p className="muted sus__klein">
          Die Expertenstandards folgen fast alle dem Pflegeprozess: Einschätzung, Planung, Information und Beratung, Durchführung, Evaluation.
          Nebeneinander gelesen siehst du, was gleich bleibt und was ein Standard Besonderes verlangt.
        </p>
      </div>

      <p className="sus__status" role="status">{zeilen.length} Standards</p>
      <ol className="sus__liste">
        {zeilen.map(({ standard: s, kriterien }) => kriterien.map((k) => (
          <li key={`${s.id}:${k.id}`} className="card sus__treffer sus__treffer--kriterium">
            <div className="sus__zeile">
              <span className="tag sus__art">Ebene {k.nr}</span>
              <span className="muted sus__pfad">{k.thema}</span>
            </div>
            <h3 className="sus__titel">{s.kurztitel}</h3>
            <div className={`sus__spalten sus__spalten--${sichtbar.length}`}>
              {sichtbar.map((sp) => (
                <section key={sp.ebene} className="sus__spalte" aria-label={`${sp.label} ${sp.ebene}${k.nr}`}>
                  <h4><span className={`sus__ebene sus__ebene--${sp.ebene.toLowerCase()}`}>{sp.ebene}{k.nr}</span> {sp.label}</h4>
                  <ul>{k[sp.feld].map((t, i) => <li key={i}>{t}</li>)}</ul>
                </section>
              ))}
            </div>
            <div className="sus__fuss"><span className="sus__aktionen"><a className="button-link small" href={`#${dnqpLink(s.id, k.id)}`}>Im Standard öffnen</a></span></div>
          </li>
        )))}
      </ol>
    </div>
  );
}
