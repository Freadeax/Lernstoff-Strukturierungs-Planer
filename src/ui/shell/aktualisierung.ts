import { db } from '../../core/db';
import { createStore } from '../lib/store';
import { BUILD_ID } from '../../core/build';

/**
 * Neue Versionen ohne Datenverlust ankommen lassen.
 *
 * - Die App fragt selbst nach, ob es eine neue Veröffentlichung gibt: `version.json` (vite.config.ts) enthält die
 *   Build-ID des Servers. Geprüft wird beim Start, beim Zurückholen in den Vordergrund (höchstens einmal pro Minute),
 *   wenn das Netz zurückkommt und alle 10 Minuten. Grund: Safari auf iPhone/iPad sucht nur selten nach einem neuen
 *   Service Worker, die installierte App bleibt oft tagelang offen und lässt sich nicht per Wischen neu laden.
 * - Ist die Version neu, erscheint ein Hinweis und der Service Worker wird angestoßen. Neuladen holt die Seite immer
 *   zuerst übers Netz (vite.config.ts, Seitenaufrufe „NetworkOnly“), daher reicht EIN Neuladen.
 * - Übernimmt ein neuer Service Worker, passt der geladene Code evtl. nicht mehr zu den Dateien auf dem Server.
 *   Hinweis nur, wenn die Seite wirklich älter ist (nach dem Neuladen übernimmt der Worker oft erst danach).
 * - Die App lädt beim nächsten Seitenwechsel neu (die Seite wird ohnehin verlassen) und zeigt bis dahin den Hinweis.
 * - Öffnet ein anderes Fenster eine neuere Datenbankversion, schließt Dexie hier die Verbindung; jeder weitere
 *   Zugriff schlüge fehl. Auch dann: Hinweis und Neuladen beim nächsten Seitenwechsel oder per Knopf.
 */
export type Grund = 'version' | 'datenbank';
export const aktualisierung = createStore<{ grund: Grund | null }>({ grund: null });

const PRUEF_ABSTAND = 60_000;
const TAKT = 10 * 60_000;

export function melde(grund: Grund) {
  // Datenbank schlägt Version: ohne Neuladen geht nichts mehr.
  aktualisierung.set((s) => ({ grund: s.grund === 'datenbank' ? 'datenbank' : grund }));
}

/** Soll beim Wechsel auf `nach` neu geladen werden? Nur wenn etwas ansteht und sich die Seite wirklich ändert. */
export function neuLadenBeimWechsel(grund: Grund | null, von: string, nach: string): boolean {
  return !!grund && von !== nach;
}

/** Ist auf dem Server eine andere Version als die laufende? Im Entwicklungsmodus nie. */
export function istNeuer(server: string | null, eigen: string = BUILD_ID): boolean {
  return !!server && eigen !== 'Entwicklung' && server.trim() !== eigen;
}

/** Build-ID der veröffentlichten Version, an jedem Zwischenspeicher vorbei. `null` ohne Netz oder im Entwicklungsmodus. */
export async function serverVersion(): Promise<string | null> {
  try {
    // Parameter gegen Zwischenspeicher (GitHub Pages setzt keine eigenen Header), no-store gegen den Browser-Cache.
    const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const j = (await r.json()) as { build?: unknown };
    return typeof j.build === 'string' ? j.build : null;
  } catch { return null; }
}

export type Pruefergebnis = 'neu' | 'aktuell' | 'unbekannt';

/** Einmal nachsehen. Bei neuer Version: Hinweis zeigen und den Service Worker die neuen Dateien holen lassen. */
export async function pruefeAufNeueVersion(): Promise<Pruefergebnis> {
  const server = await serverVersion();
  if (!server) return 'unbekannt';
  if (!istNeuer(server)) return 'aktuell';
  melde('version');
  navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => undefined);
  return 'neu';
}

/** Einmal beim Start aufrufen. Gibt eine Aufräumfunktion zurück. */
export function beobachteAktualisierung(): () => void {
  const weg: (() => void)[] = [];
  let zuletzt = 0;
  const pruefe = () => {
    if (aktualisierung.get().grund || document.visibilityState !== 'visible' || !navigator.onLine) return;
    if (Date.now() - zuletzt < PRUEF_ABSTAND) return;
    zuletzt = Date.now();
    void pruefeAufNeueVersion();
  };
  pruefe();
  const zurueck = (e: PageTransitionEvent) => { if (e.persisted) pruefe(); };
  document.addEventListener('visibilitychange', pruefe);
  window.addEventListener('online', pruefe);
  window.addEventListener('focus', pruefe);
  window.addEventListener('pageshow', zurueck);
  const takt = window.setInterval(pruefe, TAKT);
  weg.push(() => {
    document.removeEventListener('visibilitychange', pruefe);
    window.removeEventListener('online', pruefe);
    window.removeEventListener('focus', pruefe);
    window.removeEventListener('pageshow', zurueck);
    window.clearInterval(takt);
  });

  const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
  if (sw) {
    // Erstinstallation übernimmt ebenfalls (clientsClaim) – das ist keine neue Version.
    // Danach: nur melden, wenn der Server wirklich eine andere Version hat; ohne Netz vorsichtshalber melden.
    let hatteSteuerung = !!sw.controller;
    const uebernommen = () => {
      if (!hatteSteuerung) { hatteSteuerung = true; return; }
      void serverVersion().then((server) => { if (server === null || istNeuer(server)) melde('version'); });
    };
    sw.addEventListener('controllerchange', uebernommen);
    weg.push(() => sw.removeEventListener('controllerchange', uebernommen));
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
