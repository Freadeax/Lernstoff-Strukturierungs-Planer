import { db } from '../../core/db';
import { createStore } from '../lib/store';

/**
 * Neue Versionen ohne Datenverlust ankommen lassen.
 *
 * - Die installierte App auf iPhone/iPad bleibt oft tagelang offen; der Browser sucht dann nur selten nach
 *   einer neuen Version. Beim Zurückholen in den Vordergrund (höchstens alle 30 Minuten) fragt die App selbst nach.
 * - Übernimmt ein neuer Service Worker, passt der geladene Code nicht mehr zu den Dateien auf dem Server.
 *   Die App lädt dann beim nächsten Seitenwechsel neu (die Seite wird ohnehin verlassen) und zeigt bis dahin einen Hinweis.
 * - Öffnet ein anderes Fenster eine neuere Datenbankversion, schließt Dexie hier die Verbindung; jeder weitere
 *   Zugriff schlüge fehl. Auch dann: Hinweis und Neuladen beim nächsten Seitenwechsel oder per Knopf.
 */
export type Grund = 'version' | 'datenbank';
export const aktualisierung = createStore<{ grund: Grund | null }>({ grund: null });

const PRUEF_ABSTAND = 30 * 60_000;

export function melde(grund: Grund) {
  // Datenbank schlägt Version: ohne Neuladen geht nichts mehr.
  aktualisierung.set((s) => ({ grund: s.grund === 'datenbank' ? 'datenbank' : grund }));
}

/** Soll beim Wechsel auf `nach` neu geladen werden? Nur wenn etwas ansteht und sich die Seite wirklich ändert. */
export function neuLadenBeimWechsel(grund: Grund | null, von: string, nach: string): boolean {
  return !!grund && von !== nach;
}

/** Einmal beim Start aufrufen. Gibt eine Aufräumfunktion zurück. */
export function beobachteAktualisierung(): () => void {
  const weg: (() => void)[] = [];
  const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
  if (sw) {
    // Erstinstallation übernimmt ebenfalls (clientsClaim) – das ist keine neue Version.
    // Nach der Erstinstallation gilt jede weitere Übernahme als neue Version.
    let hatteSteuerung = !!sw.controller;
    const uebernommen = () => { if (hatteSteuerung) melde('version'); hatteSteuerung = true; };
    sw.addEventListener('controllerchange', uebernommen);
    weg.push(() => sw.removeEventListener('controllerchange', uebernommen));
    let zuletzt = Date.now();
    const pruefe = () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine || Date.now() - zuletzt < PRUEF_ABSTAND) return;
      zuletzt = Date.now();
      sw.getRegistration().then((r) => r?.update()).catch(() => undefined);
    };
    document.addEventListener('visibilitychange', pruefe);
    const takt = window.setInterval(pruefe, PRUEF_ABSTAND);
    weg.push(() => { document.removeEventListener('visibilitychange', pruefe); window.clearInterval(takt); });
  }
  // Nicht automatisch neu laden, auch nicht im Hintergrund: Manche Seiten halten Eingaben nur im Speicher
  // (z. B. eingefügter Aufgabentext beim Zusammenfassen). Neu geladen wird per Knopf oder beim Seitenwechsel.
  const versionchange = () => melde('datenbank');
  db.on('versionchange', versionchange);
  // Umgekehrt: Die Datenbank ist schon neuer als dieser Code (anderes Fenster war schneller).
  db.open().catch((e: unknown) => { if ((e as { name?: string })?.name === 'VersionError') melde('datenbank'); });
  weg.push(() => db.on('versionchange').unsubscribe(versionchange));
  return () => weg.forEach((f) => f());
}
