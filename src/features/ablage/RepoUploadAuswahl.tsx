import { formatGroesse, ladeZiel } from './ablage';

/**
 * Bewusste Auswahl für den Upload ins private Material-Repo. Nie vorausgewählt; zeigt vorab
 * Ziel, Dateien und Reihenfolge. Hochgeladen wird erst nach erfolgreichem lokalem Einlesen.
 */
export function RepoUploadAuswahl({ checked, onChange, files, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; files?: File[]; disabled?: boolean;
}) {
  const z = ladeZiel();
  const verbunden = !!(z.owner && z.repo && z.token);
  const gesamt = files?.reduce((s, f) => s + f.size, 0) ?? 0;
  return (
    <div className="repo-upload">
      <label className="check">
        <input type="checkbox" checked={checked} disabled={disabled || !verbunden} onChange={(e) => onChange(e.target.checked)} />
        <span><strong>Originale zusätzlich im privaten Material-Repo speichern</strong><br />
          {verbunden
            ? <>Ohne Haken bleibt alles auf diesem Gerät. · <a href="#/material/ablage">Verbindung verwalten</a></>
            : <>Nicht verbunden, deshalb bleibt alles auf diesem Gerät. · <a href="#/material/ablage">Privates Material-Repo verbinden</a></>}
        </span>
      </label>
      {checked && verbunden && (
        <div className="note" role="note">
          <strong>Was übertragen wird</strong>
          <ul>
            <li>Ziel: GitHub-Repository <code>{z.owner}/{z.repo}</code>. Vor jedem Upload prüft die App, ob es privat ist; sonst wird nichts gesendet.</li>
            <li>Reihenfolge: erst wird jede Datei auf diesem Gerät eingelesen und geprüft. Nur wenn das klappt, geht das Original an GitHub.</li>
            {files?.length ? <li>Dateien ({formatGroesse(gesamt)}): {files.map((f) => `${f.name} (${formatGroesse(f.size)})`).join(', ')}</li> : <li>Es werden die Dateien übertragen, die du gleich auswählst.</li>}
          </ul>
          <p className="muted">Lade nur Lernmaterial hoch, keine echten Patientendaten. Einmal bei GitHub abgelegte Dateien bleiben in der Versionsgeschichte des Repos, auch wenn du sie später löschst.</p>
        </div>
      )}
    </div>
  );
}

/** Rückfrage vor dem Import ohne Vorschau (Dokumente-Seite): Liste und Ziel nennen. */
export function bestaetigeRepoUpload(files: File[]): boolean {
  const z = ladeZiel();
  const liste = files.slice(0, 12).map((f) => `• ${f.name} (${formatGroesse(f.size)})`).join('\n') + (files.length > 12 ? `\n• … und ${files.length - 12} weitere` : '');
  return confirm(`Diese Originale nach dem lokalen Einlesen an das private GitHub-Repository ${z.owner}/${z.repo} übertragen?\n\n${liste}\n\nOK: einlesen und übertragen\nAbbrechen: nur auf diesem Gerät einlesen`);
}
