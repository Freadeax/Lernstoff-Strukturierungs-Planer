// Kennzeichnung der fachlichen Freigabe (Audit SIM-02). „start“ zeigt Lernziele, Geltung, Quellen und
// Prüfstand vor Beginn; „entscheidung“ ist der kurze Hinweis direkt am Entscheidungsort; „chip“ für Listen.

import { freigabeDatum, istGeprueft, kennzeichnung, RISIKO_TEXT, STATUS_TEXT, ZIELGRUPPE_TEXT, type Freigabe } from './freigabe';
import './freigabe.css';

export function FreigabeHinweis({ freigabe, ort }: { freigabe: Freigabe | undefined; ort: 'start' | 'entscheidung' | 'chip' }) {
  const ok = istGeprueft(freigabe);
  if (ort === 'chip') return <span className={`freigabe-chip ${ok ? 'is-geprueft' : 'is-offen'}`}>{freigabe ? STATUS_TEXT[freigabe.status] : 'Fachlich ungeprüft'}</span>;
  if (ort === 'entscheidung') return <p className={`freigabe-ort ${ok ? 'is-geprueft' : 'is-offen'}`}>
    <span className="freigabe-ort__marke" aria-hidden="true">{ok ? '✓' : '!'}</span>
    <span>{kennzeichnung(freigabe)}{!ok && '. Im echten Dienst gelten Anordnung, Standard und Notfallplan deiner Einrichtung.'}</span>
  </p>;
  if (!freigabe) return <p className="freigabe-ort is-offen"><span className="freigabe-ort__marke" aria-hidden="true">!</span><span>Für diesen Fall ist noch keine fachliche Freigabe erfasst.</span></p>;
  return <section className={`freigabe-start ${ok ? 'is-geprueft' : 'is-offen'}`} aria-label="Lernziele und fachlicher Prüfstand">
    <div className="freigabe-start__kopf">
      <strong>Lernziele</strong>
      <span className={`freigabe-chip ${ok ? 'is-geprueft' : 'is-offen'}`}>{STATUS_TEXT[freigabe.status]}</span>
    </div>
    <ul>{freigabe.lernziele.map(z => <li key={z}>{z}</li>)}</ul>
    <details>
      <summary>Geltung, Quellen und Prüfstand</summary>
      <dl>
        <div><dt>Gilt für</dt><dd>{freigabe.geltung} · {ZIELGRUPPE_TEXT[freigabe.zielgruppe]}</dd></div>
        <div><dt>Quellen</dt><dd>{freigabe.quellen.map(q => `${q.titel} (Stand ${q.stand})`).join('; ')}</dd></div>
        <div><dt>Prüfung</dt><dd>{freigabe.pruefung ? `${freigabe.pruefung.rolle}, ${freigabeDatum(freigabe.pruefung.datum)}${freigabe.pruefung.bemerkung ? `: ${freigabe.pruefung.bemerkung}` : ''}` : `ausstehend, erforderlich: ${freigabe.prueferrolle}`}</dd></div>
        {freigabe.risiken.length > 0 && <div><dt>Besonders prüfen</dt><dd>{freigabe.risiken.map(r => RISIKO_TEXT[r]).join(', ')}{freigabe.pruefpunkte.length ? `: ${freigabe.pruefpunkte.join('; ')}` : ''}</dd></div>}
        <div><dt>Änderungen</dt><dd>{freigabe.aenderungen.map(a => `${freigabeDatum(a.datum)} ${a.text}`).join(' · ')}</dd></div>
      </dl>
    </details>
  </section>;
}
