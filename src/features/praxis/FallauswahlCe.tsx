// Fallauswahl nach CE und Ausbildungsdrittel (P15). Kernfälle (neuer Arbeitsplatz) oben, Altfälle mit Markierung „alt“
// bis zur Ablösung, geplante Fälle als Ausblick. Logik in fallplan.ts (rein, getestet).
import { useState, type ReactNode } from 'react';
import type { Ce } from '../ce/modell';
import { ABSCHNITT_LABEL, type Abschnitt } from '../ce/lehrplan';
import { navigate } from '../../ui/shell/router';
import { fallauswahl, type AltFallKopf, type KernFallKopf } from './fallplan';

const DRITTEL_KEY = 'lernstoff.praxis.drittel';
const DRITTEL: Array<[Abschnitt | 'alle', string]> = [['alle', 'Alle'], ['ad12', '1./2. Drittel'], ['ad3', '3. Drittel']];
const KURZ: Record<Abschnitt, string> = { ad12: '1./2. Drittel', ad3: '3. Drittel' };

function leseDrittel(): Abschnitt | 'alle' {
  try { const v = localStorage.getItem(DRITTEL_KEY); return v === 'ad12' || v === 'ad3' ? v : 'alle'; } catch { return 'alle'; }
}

const drittelText = (a: Abschnitt[]) => a.map((x) => KURZ[x]).join(' · ');

export function FallauswahlCe({ ces, kern, alt, nurCe, renderAlt }: {
  ces: Ce[]; kern: readonly KernFallKopf[]; alt: readonly AltFallKopf[]; nurCe?: string;
  /** Knöpfe eines Altfalls (Geführt/Frei üben) kommen aus der Seite, damit der alte Simulator unverändert startet. */
  renderAlt: (id: string, zusatz: ReactNode) => ReactNode;
}) {
  const [drittel, setDrittelRoh] = useState<Abschnitt | 'alle'>(leseDrittel);
  const setDrittel = (d: Abschnitt | 'alle') => { setDrittelRoh(d); try { localStorage.setItem(DRITTEL_KEY, d); } catch { /* nur Komfort */ } };
  const ce = nurCe ? ces.find((c) => c.id === nurCe) : undefined;
  const ids = ce ? [ce.id] : ces.map((c) => c.id);
  const gruppen = fallauswahl(ids, kern, alt, drittel);
  const name = (id: string) => ces.find((c) => c.id === id);

  return <section className="praxis-ce" aria-labelledby="praxis-ce-titel">
    <div className="praxis-ce__kopf">
      <h2 id="praxis-ce-titel">{ce ? `Fälle zu ${ce.code}` : 'Fälle nach curricularer Einheit'}</h2>
      <div className="pills" role="group" aria-label="Ausbildungsdrittel">
        {DRITTEL.map(([w, l]) => <button key={w} type="button" className="pill" aria-pressed={drittel === w} onClick={() => setDrittel(w)}>{l}</button>)}
      </div>
    </div>
    <p className="muted praxis-ce__hinweis">Oben jeweils die Fälle im neuen Arbeitsplatz (was du darfst, hängt von deinem Drittel ab). Mit „alt“ markierte Fälle laufen noch im bisherigen Simulator und werden nach und nach neu geschrieben. Fachlich noch ungeprüft.
      {ce && <> <button type="button" className="link" onClick={() => navigate('/lernen/praxis')}>Alle CE zeigen</button></>}</p>
    {gruppen.map((g) => {
      const c = name(g.ce);
      const kernE = g.eintraege.filter((e) => e.art === 'kern');
      const altE = g.eintraege.filter((e) => e.art === 'alt');
      const geplant = g.eintraege.filter((e) => e.art === 'geplant');
      return <section key={g.ce} className="praxis-ce__gruppe" aria-labelledby={`praxis-${g.ce}`}>
        <div className="praxis-ce__gruppenkopf">
          <h3 id={`praxis-${g.ce}`}><span className="praxis-ce__code">{c?.code ?? g.ce}</span> {c?.name}</h3>
          {!ce && <button type="button" className="link small" onClick={() => navigate(`/lernen/ce?ce=${encodeURIComponent(g.ce)}`)}>Lernpfad</button>}
        </div>
        {kernE.length + altE.length === 0 && <p className="muted praxis-ce__leer">Für {drittel === 'alle' ? 'diese CE' : ABSCHNITT_LABEL[drittel as Abschnitt]} gibt es noch keinen spielbaren Fall.</p>}
        {kernE.length + altE.length > 0 && <ul className="praxis-fallliste">
          {kernE.map((e) => e.art === 'kern' && <li className="praxis-fall praxis-fall--kern" key={e.id}>
            <span className="praxis-fall__ohnebild" aria-hidden="true" />
            <div className="praxis-fall__text"><h4>{e.titel}</h4><p>{e.kurz}</p>
              <p className="praxis-fall__marken"><span className="praxis-marke praxis-marke--neu">Neu</span><span>{drittelText(e.abschnitt)}</span>{e.auchIn.length > 0 && <span>auch {e.auchIn.map((x) => name(x)?.code ?? x).join(', ')}</span>}</p></div>
            <div className="praxis-fall__knoepfe"><button className="primary" onClick={() => navigate(`/lernen/praxis?neu=${e.id}`)}>Neu üben</button></div>
          </li>)}
          {altE.map((e) => e.art === 'alt' && renderAlt(e.id, <p className="praxis-fall__marken"><span className="praxis-marke">alt</span><span>{drittelText(e.abschnitt)}</span>
            <span>{e.abgeloestDurch ? `abgelöst durch „${e.abgeloestDurch.replace(/[„“]/g, '')}“` : `wird neu geschrieben${e.paket ? ` (${e.paket})` : ''}`}</span></p>))}
        </ul>}
        {geplant.length > 0 && <p className="muted praxis-ce__geplant">Geplant: {geplant.map((e) => e.titel).join(' · ')}</p>}
      </section>;
    })}
  </section>;
}
