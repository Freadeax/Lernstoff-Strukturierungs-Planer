import { navigate } from '../../ui/shell/router';
import { heute } from '../lernplan/store';
import { setzeHaken, SCHRITT_LABEL, steckbriefHaken, type CePfad, type Haken, type Schritt, type ThemaFakten, type ThemaPfad } from './lernpfad';

const ZEICHEN: Record<Schritt['zustand'], string> = { erledigt: '✓', teilweise: '◐', offen: '○', entfaellt: '–' };
const ZUSTAND_LABEL: Record<Schritt['zustand'], string> = { erledigt: 'erledigt', teilweise: 'angefangen', offen: 'offen', entfaellt: 'entfällt' };

/** Fünf Punkte für die Zeile eines Themas: wie weit der Pfad ist, ohne ihn aufzuklappen. */
export function PfadPunkte({ pfad }: { pfad: ThemaPfad }) {
  return (
    <span className="pfad-punkte" role="img" aria-label={`Lernpfad: ${pfad.erledigt} von ${pfad.gesamt} Schritten erledigt`}>
      {pfad.schritte.map((s) => <i key={s.art} className={`pfad-punkte__p pfad-punkte__p--${s.zustand}`} title={`${SCHRITT_LABEL[s.art]}: ${ZUSTAND_LABEL[s.zustand]}`} />)}
    </span>
  );
}

/** Die Schritte eines Themas als geordnete Liste mit Sprung zum jeweiligen Modul. */
export function SchrittListe({ pfad, fakten, haken, onHaken }: { pfad: ThemaPfad; fakten: ThemaFakten; haken: Haken; onHaken: (h: Haken) => void }) {
  return (
    <ol className="pfad">
      {pfad.schritte.map((s, i) => {
        const naechster = pfad.naechster === s;
        return (
          <li key={s.art} className={`pfad__schritt pfad__schritt--${s.zustand}${naechster ? ' pfad__schritt--weiter' : ''}`}>
            <span className="pfad__marke" aria-hidden="true">{s.zustand === 'erledigt' ? ZEICHEN.erledigt : i + 1}</span>
            <div className="pfad__text">
              <strong>{SCHRITT_LABEL[s.art]}</strong>
              <span className="visually-hidden">: {ZUSTAND_LABEL[s.zustand]}</span>
              <span className="muted">{s.text}</span>
              {s.abhakbar && fakten.steckbriefe.map((p) => (
                <label key={p.id} className="pfad__haken">
                  <input type="checkbox" checked={!!haken[steckbriefHaken(p.id)] || p.gelesen}
                    onChange={(e) => onHaken(setzeHaken(steckbriefHaken(p.id), e.target.checked, heute()))} />
                  {p.name} gelesen
                </label>
              ))}
            </div>
            {s.ziel && s.zustand !== 'entfaellt' && (
              <button type="button" className={`small${naechster ? ' primary' : ' ghost'}`} onClick={() => navigate(s.ziel!)}>
                {s.zustand === 'erledigt' ? 'Öffnen' : s.zustand === 'teilweise' ? 'Weiter' : 'Starten'}
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Oben auf der CE-Seite: Fortschritt des ganzen Pfads und der eine nächste Schritt. */
export function PfadKarte({ pfad, themaName, testbar, onTest }: { pfad: CePfad; themaName: (id: string) => string; testbar: number; onTest: () => void }) {
  const anteil = pfad.gesamt ? Math.round((pfad.erledigt / pfad.gesamt) * 100) : 0;
  const w = pfad.weiter;
  return (
    <div className="card ce-pfad">
      <div className="ce-pfad__kopf">
        <div>
          <h2>Dein Lernpfad</h2>
          <p className="muted">Je Thema: {(['lesen', 'karten', 'steckbrief', 'fall', 'selbsttest'] as const).map((a) => SCHRITT_LABEL[a]).join(' → ')}</p>
        </div>
        <div className="ce-pfad__zahl" aria-label={`${anteil} Prozent des Lernpfads erledigt`}><strong>{anteil} %</strong><span className="muted">{pfad.erledigt} / {pfad.gesamt} Schritte</span></div>
      </div>
      <div className="ce-pfad__balken" aria-hidden="true"><span style={{ width: `${anteil}%` }} /></div>
      {w ? (
        <div className="ce-pfad__weiter">
          <div>
            <span className="ce-pfad__label">Als Nächstes</span>
            <strong>{themaName(w.topicId)}</strong>
            <span className="muted">{SCHRITT_LABEL[w.schritt.art]}: {w.schritt.text}</span>
          </div>
          {w.schritt.ziel && <button type="button" className="primary" onClick={() => navigate(w.schritt.ziel!)}>Weiterlernen</button>}
        </div>
      ) : pfad.gesamt > 0 && <p className="note ok">Alle Schritte dieser CE sind erledigt. Halte das Wissen mit Selbsttests und Karteikarten frisch.</p>}
      <div className="ce-pfad__aktionen">
        <button type="button" className="small" disabled={!testbar} onClick={onTest}>Selbsttest zur CE</button>
        <span className="muted">{testbar ? `${testbar} Themen mit genug Karteikarten` : 'Für einen Selbsttest braucht ein Thema mindestens drei Karteikarten.'}</span>
      </div>
    </div>
  );
}
