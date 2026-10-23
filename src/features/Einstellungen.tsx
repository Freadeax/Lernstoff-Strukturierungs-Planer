import { useState } from 'react';
import { deleteAll, exportAll } from '../core/db';
import { getApiKey, setApiKey } from '../core/settings';

export function Einstellungen() {
  const [key, setKey] = useState(getApiKey());
  const [saved, setSaved] = useState(false);

  async function download() {
    const blob = new Blob([JSON.stringify(await exportAll(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lernstoff-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function wipe() {
    if (confirm('Wirklich alle lokal gespeicherten Daten löschen?')) await deleteAll();
  }
  return (
    <section className="page">
      <h2>Einstellungen</h2>
      <div className="card">
        <h3>Claude-API-Schlüssel</h3>
        <p className="muted">
          Wird nur auf diesem Gerät gespeichert und nur für Zusammenfassungen und Handschrifterkennung an Anthropic gesendet.
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
        <p>Alle Unterlagen und Ergebnisse liegen nur auf diesem Gerät.</p>
        <button onClick={download}>Alle Daten exportieren</button>{' '}
        <button className="danger" onClick={wipe}>Alle Daten löschen</button>
      </div>
    </section>
  );
}
