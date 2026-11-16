import type { CatalogModule } from '../../modules/catalog-types';
import { getModule } from '../../modules/registry';
import { ABSCHNITT_LABEL, GESAMT, LEHRPLAN, LEHRPLAN_QUELLE, schwerpunkte, type Abschnitt } from './lehrplan';

const KB_NAME = new Map(((getModule('pflege-generalistisch') as CatalogModule | undefined)?.frameworks?.find((f) => f.kind === 'kompetenzen')?.items ?? []).map((i) => [i.code, i.name]));
const ABSCHNITTE: Abschnitt[] = ['ad12', 'ad3'];

/** Eine Zeile für die CE-Karte: Unterrichtsstunden laut Lehrplan. */
export function lehrplanStunden(ceId: string): string | undefined {
  const l = LEHRPLAN[ceId];
  if (!l) return undefined;
  return ABSCHNITTE.filter((a) => l.stunden[a]).map((a) => `${l.stunden[a]} Std. im ${a === 'ad12' ? '1./2.' : '3.'} Drittel`).join(', ');
}

/** Detail: Zeitrichtwert, Anteil am Unterricht und Kompetenzen je Ausbildungsabschnitt. */
export function LehrplanAbschnitt({ ceId }: { ceId: string }) {
  const l = LEHRPLAN[ceId];
  if (!l) return null;
  return (
    <section className="ce__abschnitt ce__lehrplan" aria-labelledby="ce-lehrplan">
      <h2 id="ce-lehrplan">Laut Lehrplan</h2>
      <ul className="ce__lehrplan-stunden">
        {ABSCHNITTE.filter((a) => l.stunden[a]).map((a) => (
          <li key={a}><strong>{l.stunden[a]} Stunden</strong> im {ABSCHNITT_LABEL[a]} <span className="muted">({Math.round((l.stunden[a]! / GESAMT[a]) * 100)} % des Unterrichts dort)</span></li>
        ))}
      </ul>
      {ABSCHNITTE.filter((a) => l.kompetenzen[a].length).map((a) => (
        <details key={a} className="ce__lehrplan-komp">
          <summary>Kompetenzen im {ABSCHNITT_LABEL[a]} ({l.kompetenzen[a].length}, Anlage {a === 'ad12' ? 1 : 2} PflAPrV)</summary>
          <ul>
            {schwerpunkte(l.kompetenzen[a]).map((s) => (
              <li key={s.code}><strong>{s.code}</strong> {KB_NAME.get(s.code) ?? ''} <span className="muted">({s.buchstaben.join(', ')})</span></li>
            ))}
          </ul>
        </details>
      ))}
      <p className="muted ce__lehrplan-quelle">Quelle: {LEHRPLAN_QUELLE}. Die Stunden entsprechen den Rahmenplänen. Wie deine Schule die Stunden verteilt, steht im Schulcurriculum.</p>
    </section>
  );
}
