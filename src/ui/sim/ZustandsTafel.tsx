// Einheitliche Anzeige von Patient, Geräten, Material, Alarmen und Aufgaben (siehe zustand.ts).
// Zugänglich als Liste; die Kurzzeile darüber wird bei Änderungen höflich angesagt.
import './zustand.css';
import { BEREICH_LABEL, BEREICHE, sortiereAlarme, zusammenfassung, type AufgabeStatus, type SimZustand, type ZustandStufe } from './zustand';

const STUFE_TEXT: Record<ZustandStufe, string> = { normal: 'unauffällig', achtung: 'beobachten', kritisch: 'kritisch', aus: 'aus' };
const AUFGABE_TEXT: Record<AufgabeStatus, string> = { offen: 'offen', dringend: 'dringend', erledigt: 'erledigt' };
const AUFGABE_ZEICHEN: Record<AufgabeStatus, string> = { offen: '○', dringend: '!', erledigt: '✓' };

export function ZustandsTafel({ z, titel = 'Zustand', offen = false }: { z: SimZustand; titel?: string; offen?: boolean }) {
  return (
    <details className="sim-zustand" open={offen}>
      <summary><strong>{titel}</strong> <span className="sim-zustand__kurz" aria-live="polite">{zusammenfassung(z)}</span></summary>
      <div className="sim-zustand__raster">
        {BEREICHE.map((b) => {
          if (b === 'aufgaben') {
            return (
              <section key={b} className="sim-zustand__bereich" aria-label={BEREICH_LABEL[b]}>
                <h4>{BEREICH_LABEL[b]}</h4>
                {z.aufgaben.length ? <ul>{z.aufgaben.map((a) => (
                  <li key={a.id} className={`is-${a.status}`}>
                    <span className="sim-zustand__marke" aria-hidden="true">{AUFGABE_ZEICHEN[a.status]}</span>
                    <span>{a.titel}<span className="visually-hidden">: {AUFGABE_TEXT[a.status]}</span>{a.hinweis && <span className="muted"> · {a.hinweis}</span>}</span>
                  </li>
                ))}</ul> : <p className="muted">Keine Aufgaben.</p>}
              </section>
            );
          }
          const liste = b === 'alarme' ? sortiereAlarme(z.alarme) : z[b];
          return (
            <section key={b} className={`sim-zustand__bereich${b === 'alarme' && liste.length ? ' is-alarm' : ''}`} aria-label={BEREICH_LABEL[b]}>
              <h4>{BEREICH_LABEL[b]}</h4>
              {liste.length ? <ul>{liste.map((e) => (
                <li key={e.id} className={`is-${e.stufe}`}>
                  <span className="sim-zustand__marke" aria-hidden="true" />
                  <span><span className="sim-zustand__label">{e.label}</span> {e.wert}<span className="visually-hidden"> ({STUFE_TEXT[e.stufe]})</span></span>
                </li>
              ))}</ul> : <p className="muted">{b === 'alarme' ? 'Kein Alarm.' : 'Nichts im Einsatz.'}</p>}
            </section>
          );
        })}
      </div>
    </details>
  );
}
