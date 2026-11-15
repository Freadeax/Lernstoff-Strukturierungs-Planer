// Kennzeichnung der fachlichen Freigabe (Audit SIM-02). „start“ zeigt Lernziele, Geltung, Quellen und
// Prüfstand vor Beginn; „entscheidung“ ist der kurze Hinweis direkt am Entscheidungsort; „chip“ für Listen.

import { freigabeDatum, istGeprueft, kennzeichnung, RISIKO_TEXT, STATUS_TEXT, ZIELGRUPPE_TEXT, type Freigabe } from './freigabe';
import { neuereFassungFuer } from '../../features/quellen/register-basis';
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
    <NeueFassungen freigabe={freigabe} />
    <details>
      <summary>Geltung, Quellen und Prüfstand</summary>
      <dl>
        <div><dt>Gilt für</dt><dd>{freigabe.geltung} · {ZIELGRUPPE_TEXT[freigabe.zielgruppe]}</dd></div>
        <div><dt>Quellen</dt><dd>{freigabe.quellen.map(q => `${q.titel} (Stand ${q.stand})`).join('; ')} · <a href="#/system/quellen">Quellen und Aktualität</a></dd></div>
        <div><dt>Prüfung</dt><dd>{freigabe.pruefung ? `${freigabe.pruefung.rolle}, ${freigabeDatum(freigabe.pruefung.datum)}${freigabe.pruefung.bemerkung ? `: ${freigabe.pruefung.bemerkung}` : ''}` : `ausstehend, erforderlich: ${freigabe.prueferrolle}`}</dd></div>
        {freigabe.risiken.length > 0 && <div><dt>Besonders prüfen</dt><dd>{freigabe.risiken.map(r => RISIKO_TEXT[r]).join(', ')}{freigabe.pruefpunkte.length ? `: ${freigabe.pruefpunkte.join('; ')}` : ''}</dd></div>}
        <div><dt>Änderungen</dt><dd>{freigabe.aenderungen.map(a => `${freigabeDatum(a.datum)} ${a.text}`).join(' · ')}</dd></div>
      </dl>
    </details>
  </section>;
}

/** Sichtbarer Hinweis, wenn eine Quelle des Inhalts inzwischen in neuerer Fassung erschienen ist. */
function NeueFassungen({ freigabe }: { freigabe: Freigabe }) {
  const alle = freigabe.quellen.map(q => ({ q, e: neuereFassungFuer(q) })).filter((x): x is { q: typeof x.q; e: NonNullable<typeof x.e> } => !!x.e);
  const neu = [...new Map(alle.map(x => [x.e.id, x])).values()];
  if (!neu.length) return null;
  return <p className="freigabe-neu" role="note">
    <span className="freigabe-ort__marke" aria-hidden="true">!</span>
    <span>{neu.map(({ q, e }) => `Neue Fassung: ${e.titel} ${e.aktuell.stand}. Dieser Inhalt steht noch auf ${q.stand} und ist noch nicht abgeglichen.`).join(' ')}{' '}
      <a href={`#/system/quellen?quelle=${encodeURIComponent(neu[0].e.id)}`}>Was ist neu?</a></span>
  </p>;
}
