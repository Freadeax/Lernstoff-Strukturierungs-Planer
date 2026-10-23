import { deleteAll, exportAll } from '../core/db';

export function Einstellungen() {
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
    <section>
      <h2>Einstellungen</h2>
      <div className="card">
        <h3>Meine Daten</h3>
        <p>Alle Unterlagen und Ergebnisse liegen nur auf diesem Gerät.</p>
        <button onClick={download}>Alle Daten exportieren</button>{' '}
        <button className="danger" onClick={wipe}>Alle Daten löschen</button>
      </div>
    </section>
  );
}
