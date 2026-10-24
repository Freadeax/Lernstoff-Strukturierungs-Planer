import { useState } from 'react';
import { deleteAll } from '../core/db';
import { loescheLokaleEintraege } from '../core/sicherung';
import { navigate } from '../ui/shell/router';
import { getApiKey, setApiKey } from '../core/settings';

export function Einstellungen() {
  const [key, setKey] = useState(getApiKey());
  const [saved, setSaved] = useState(false);

  async function wipe() {
    if (confirm('Wirklich alle lokal gespeicherten Daten löschen? Ohne Sicherung ist dein Lernstand danach weg.')) { await deleteAll(); loescheLokaleEintraege(); }
  }
  return (
    <section className="page">
      <h2>Einstellungen</h2>
      <div className="card">
        <h3>Claude-API-Schlüssel</h3>
        <p className="muted">
          Wird nur auf diesem Gerät gespeichert und nur für Zusammenfassungen, Handschrifterkennung und den Fallsimulator an Anthropic gesendet.
          Einen Schlüssel bekommst du unter console.anthropic.com → API Keys.
        </p>
        <input className="wide" type="password" autoComplete="off" placeholder="sk-ant-…" value={key}
          onChange={(e) => { setKey(e.target.value); setSaved(false); }} />
        <div className="row">
          <button className="primary" onClick={() => { setApiKey(key); setSaved(true); }}>Speichern</button>
          {saved && <span className="muted">Gespeichert.</span>}
        </div>
      </div>
      <div className="card">
        <h3>Meine Daten</h3>
        <p>Alle Unterlagen und Ergebnisse liegen nur auf diesem Gerät. Unter „Datensicherung“ sicherst du sie als Datei und überträgst sie auf ein anderes Gerät.</p>
        <button className="primary" onClick={() => navigate('/system/sicherung')}>Zur Datensicherung</button>{' '}
        <button className="danger" onClick={wipe}>Alle Daten löschen</button>
      </div>
    </section>
  );
}
