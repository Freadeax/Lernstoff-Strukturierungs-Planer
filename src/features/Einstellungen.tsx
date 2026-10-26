import { useState } from 'react';
import { deleteAll } from '../core/db';
import { loescheLokaleEintraege } from '../core/sicherung';
import { navigate } from '../ui/shell/router';
import { getApiKey, setApiKey } from '../core/settings';
import { Field, useFormFeedback } from '../ui/form/Field';
import { PageHeading } from '../ui/PageHeading';
import { Icon } from '../ui/icons';

export function Einstellungen() {
  const [key, setKey] = useState(getApiKey());
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const errors = { apiKey: key.trim() && (!key.trim().startsWith('sk-ant-') || /\s/.test(key.trim())) ? 'Füge den vollständigen Anthropic-Schlüssel ein. Er beginnt mit sk-ant- und enthält keine Leerzeichen.' : '' };
  const feedback = useFormFeedback(errors);

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!feedback.validate(e.currentTarget)) return;
    setApiKey(key);
    const ok = getApiKey() === key.trim();
    setSaved(ok);
    setSaveError(ok ? '' : 'Der Browser konnte den Schlüssel nicht speichern. Erlaube lokalen Speicher und versuche es erneut.');
  }
  async function wipe() {
    if (!confirm('Wirklich alle lokal gespeicherten Daten löschen? Ohne Sicherung ist dein Lernstand danach weg.')) return;
    try { await deleteAll(); loescheLokaleEintraege(); setSaveError(''); }
    catch { setSaveError('Die Daten konnten nicht vollständig gelöscht werden. Bitte versuche es erneut.'); }
  }
  return <section className="page">
    <PageHeading eyebrow="Dein Arbeitsplatz" title="So lernst du am liebsten."
      description="Richte die KI-Unterstützung ein und behalte die Kontrolle über deine Lerndaten." />
    <form className="card form-card" noValidate onSubmit={save}>
      <fieldset className="form-section">
        <legend>KI-Unterstützung</legend>
        <p className="form-section__description">Für Zusammenfassungen, Handschrifterkennung und KI-Feedback benötigst du einen eigenen Claude-API-Schlüssel. Offline-Übungen funktionieren auch ohne ihn.</p>
        <Field label="Claude-API-Schlüssel" name="apiKey" hint="Optional. Den Schlüssel erhältst du in der Anthropic Console. Er wird nur auf diesem Gerät gespeichert und nicht in Datensicherungen übernommen." error={feedback.error('apiKey')}>
          {(props) => <div className="password-control"><input {...props} type={visible ? 'text' : 'password'} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="sk-ant-…" value={key} onBlur={() => feedback.touch('apiKey')} onChange={(e) => { setKey(e.target.value); setSaved(false); setSaveError(''); }} />
            <button type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Verbergen' : 'Anzeigen'}</button></div>}
        </Field>
        <a className="text-link" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">Anthropic Console öffnen <Icon name="chevronRight" size={16} /></a>
      </fieldset>
      <div className="form-actions"><p>Bei KI-Funktionen werden die benötigten Inhalte an Anthropic gesendet. Dabei können API-Kosten entstehen.</p><button className="primary" type="submit"><Icon name="check" size={16} /> Einstellung speichern</button></div>
      <p className="form-feedback" role="status">{saved ? key.trim() ? 'Schlüssel auf diesem Gerät gespeichert.' : 'Schlüssel von diesem Gerät entfernt.' : ''}</p>
      {saveError && <p className="field-error" role="alert">{saveError}</p>}
    </form>
    <section className="card form-card" aria-labelledby="my-data-title">
      <h2 id="my-data-title">Deine Daten. In deiner Hand.</h2>
      <p className="form-section__description">Deine Unterlagen und Lernergebnisse liegen in diesem Browser. Mit einer Sicherungsdatei kannst du sie aufbewahren oder auf ein anderes Gerät übertragen.</p>
      <div className="settings-data-actions"><button type="button" onClick={() => navigate('/system/sicherung')}><Icon name="save" size={18} /> Datensicherung öffnen</button></div>
      <div className="settings-danger"><h3>Lokale Lerndaten löschen</h3><p className="muted">Erstelle vorher eine Sicherung, wenn du deinen Lernstand behalten möchtest.</p><button type="button" className="danger" onClick={wipe}><Icon name="trash" size={16} /> Alle Lerndaten löschen</button></div>
    </section>
  </section>;
}
