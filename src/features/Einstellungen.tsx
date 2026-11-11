import { DATEN_TEXT, FIKTIV, type DatenArt } from '../ui/DatenHinweis';
import { lazy, Suspense, useState } from 'react';
import { deleteAll } from '../core/db';
import { loescheLokaleEintraege, loescheRueckfall } from '../core/sicherung';
import { navigate } from '../ui/shell/router';
import { BUILD_ID } from '../core/build';
import { adressText, NEUE_ADRESSE } from '../core/hosting';
import { apiKeyDauerhaft, getApiKey, setApiKey } from '../core/settings';
import { Field, useFormFeedback } from '../ui/form/Field';
import { PageHeading } from '../ui/PageHeading';
import { Icon } from '../ui/icons';
import { useStore } from '../ui/lib/store';
import { timeZones } from '../ui/lib/time';
import { filterStore, setzeZeitzone } from '../widgets/filter/filterStore';

// Töne und Vorlesen: eigener Baustein, erst beim Öffnen der Einstellungen geladen (Startgröße).
const Klangeinstellungen = lazy(() => import('../ui/audio/Klangeinstellungen'));

/** Zeitzone für Kalendertage (Lernserie, Verlauf, Kennzahlen). Selten nötig, daher hier statt in der Filterleiste. */
function Zeitzone() {
  const tz = useStore(filterStore, (f) => f.timeZone);
  return (
    <section className="card form-card" aria-labelledby="zeit-title">
      <h2 id="zeit-title">Zeitzone</h2>
      <p className="form-section__description">Bestimmt, zu welchem Kalendertag eine Lerneinheit zählt, zum Beispiel nach einem Nachtdienst oder im Urlaub.</p>
      <label className="field">
        <span>Zeitzone</span>
        <select value={tz} onChange={(e) => setzeZeitzone(e.target.value)}>
          {timeZones().map((z) => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
        </select>
      </label>
    </section>
  );
}

const DATEN_NAME: Record<DatenArt, string> = { import: 'Import', ki: 'KI-Funktionen', 'ki-bild': 'Handschrift erkennen', diktat: 'Diktat', teilen: 'Fall teilen', abgabe: 'Abgabe im Klassenmodus' };

export function Einstellungen() {
  const [key, setKey] = useState(getApiKey());
  const [visible, setVisible] = useState(false);
  const [merken, setMerken] = useState(apiKeyDauerhaft);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const errors = { apiKey: key.trim() && (!key.trim().startsWith('sk-ant-') || /\s/.test(key.trim())) ? 'Füge den vollständigen Anthropic-Schlüssel ein. Er beginnt mit sk-ant- und enthält keine Leerzeichen.' : '' };
  const feedback = useFormFeedback(errors);

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!feedback.validate(e.currentTarget)) return;
    setApiKey(key, merken);
    const ok = getApiKey() === key.trim();
    setSaved(ok);
    setSaveError(ok ? '' : 'Der Browser konnte den Schlüssel nicht speichern. Erlaube lokalen Speicher und versuche es erneut.');
  }
  async function wipe() {
    if (!confirm('Wirklich alle lokal gespeicherten Daten löschen? Ohne Sicherung ist dein Lernstand danach weg.')) return;
    try { await deleteAll(); loescheLokaleEintraege(); await loescheRueckfall(); setSaveError(''); }
    catch { setSaveError('Die Daten konnten nicht vollständig gelöscht werden. Bitte versuche es erneut.'); }
  }
  return <section className="page">
    <PageHeading bild="system" eyebrow="Dein Arbeitsplatz" title="So lernst du am liebsten."
      description="KI-Unterstützung (optional), Töne und Vorlesen, Zeitzone und deine Lerndaten." />
    <form className="card form-card" noValidate onSubmit={save}>
      <fieldset className="form-section">
        <legend>KI-Unterstützung (optional)</legend>
        <p className="form-section__description">Für Zusammenfassungen, Handschrifterkennung und KI-Feedback benötigst du einen eigenen Claude-API-Schlüssel. Offline-Übungen funktionieren auch ohne ihn.</p>
        <Field label="Claude-API-Schlüssel" name="apiKey" hint="Optional. Den Schlüssel erhältst du in der Anthropic Console. Er gilt standardmäßig nur bis zum Schließen der App und kommt nie in Datensicherungen." error={feedback.error('apiKey')}>
          {(props) => <div className="password-control"><input {...props} type={visible ? 'text' : 'password'} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="sk-ant-…" value={key} onBlur={() => feedback.touch('apiKey')} onChange={(e) => { setKey(e.target.value); setSaved(false); setSaveError(''); }} />
            <button type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Verbergen' : 'Anzeigen'}</button></div>}
        </Field>
        <label className="check"><input type="checkbox" checked={merken} onChange={(e) => { setMerken(e.target.checked); setSaved(false); }} />
          <span><strong>Auf diesem Gerät merken</strong><br />Ohne Haken musst du den Schlüssel nach dem Schließen der App neu eintragen. Gemerkt liegt er unverschlüsselt im Browser-Speicher dieser Website. Lege in der Anthropic Console am besten einen eigenen Schlüssel mit Ausgabenlimit nur für diese App an.</span></label>
        <a className="text-link" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">Anthropic Console öffnen <Icon name="chevronRight" size={16} /></a>
      </fieldset>
      <div className="form-actions"><p>Bei KI-Funktionen werden die benötigten Inhalte direkt aus dem Browser an Anthropic gesendet. Jede Funktion zeigt vorher, was sie sendet. Dabei können API-Kosten entstehen.</p><button className="primary" type="submit"><Icon name="check" size={16} /> Einstellung speichern</button></div>
      <p className="form-feedback" role="status">{saved ? key.trim() ? (merken ? 'Schlüssel auf diesem Gerät gespeichert.' : 'Schlüssel für diese Sitzung gespeichert.') : 'Schlüssel von diesem Gerät entfernt.' : ''}</p>
      {saveError && <p className="field-error" role="alert">{saveError}</p>}
    </form>
    <Suspense fallback={null}><Klangeinstellungen /></Suspense>
    <Zeitzone />
    <section className="card form-card" aria-labelledby="my-data-title">
      <h2 id="my-data-title">Deine Daten. In deiner Hand.</h2>
      <p className="form-section__description">Deine Unterlagen und Lernergebnisse liegen in diesem Browser. Mit einer Sicherungsdatei kannst du sie aufbewahren oder auf ein anderes Gerät übertragen.</p>
      <div className="settings-data-actions"><button type="button" onClick={() => navigate('/system/sicherung')}><Icon name="save" size={18} /> Datensicherung öffnen</button></div>
      <div className="settings-danger"><h3>Lokale Lerndaten löschen</h3><p className="muted">Erstelle vorher eine Sicherung, wenn du deinen Lernstand behalten möchtest.</p><button type="button" className="danger" onClick={wipe}><Icon name="trash" size={16} /> Alle Lerndaten löschen</button></div>
    </section>
    <section className="card form-card" aria-labelledby="datenhinweise-title">
      <h2 id="datenhinweise-title">Datenhinweise</h2>
      <p className="form-section__description">Diese Hinweise stehen in der App jeweils direkt am Schritt. Hier findest du sie alle an einem Ort.</p>
      <dl className="datenhinweise">
        {(Object.keys(DATEN_TEXT) as DatenArt[]).map((a) => <div key={a}><dt>{DATEN_NAME[a]}: {DATEN_TEXT[a].kurz}</dt><dd>{DATEN_TEXT[a].lang}</dd></div>)}
      </dl>
      <p className="muted">{FIKTIV}</p>
    </section>
    <section className="card form-card" aria-labelledby="app-info-title">
      <h2 id="app-info-title">Über diese App</h2>
      <ul className="settings-app-info">
        <li>App-Version: <code data-testid="build-id">{BUILD_ID}</code></li>
        <li>Adresse: <strong>{adressText()}</strong></li>
        {NEUE_ADRESSE && <li>Offizielle Adresse: <a className="text-link" href={NEUE_ADRESSE}>{NEUE_ADRESSE.replace(/^https:\/\//, '').replace(/\/$/, '')}</a></li>}
      </ul>
      <p className="muted">Jede Adresse hat ihren eigenen Speicher. Lernstand und Einstellungen wandern nur per Datensicherung von einer Adresse oder einem Gerät zum anderen. Die App-Version hilft, wenn du einen Fehler meldest.</p>
    </section>
    <p className="muted settings-intern">Für Entwicklung und Gestaltung: <a href="#/system/design">Designsystem ansehen</a>.</p>
  </section>;
}
