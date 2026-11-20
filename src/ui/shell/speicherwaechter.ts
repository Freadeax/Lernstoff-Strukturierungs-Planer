import { db } from '../../core/db';
import { createStore } from '../lib/store';
import { notify } from './notifications';

/**
 * Speicherprobleme sichtbar machen statt still Daten zu verlieren:
 * - Gerätespeicher voll: Schreibfehler irgendwo in der App führen zu einer deutlichen Mitteilung mit Ausweg.
 * - Keine Datenbank möglich (privates Fenster mancher Browser, Sperrmodus, abgeschaltete Website-Daten):
 *   dauerhafter Hinweis, dass nichts gespeichert wird.
 * - Installierte App: einmal um dauerhaften Speicher bitten, damit Safari nach Wochen ohne Nutzung nicht aufräumt.
 *   (Im Browser-Tab nicht, weil Firefox dort einen Dialog zeigt.)
 */
export const speicher = createStore<{ ohneDatenbank: boolean }>({ ohneDatenbank: false });

function namen(e: unknown): string {
  const teile: string[] = [];
  for (let x: unknown = e, i = 0; x && i < 4; x = (x as { inner?: unknown }).inner, i++) {
    const f = x as { name?: unknown; message?: unknown };
    teile.push(`${String(f.name ?? '')} ${String(f.message ?? '')}`);
  }
  return teile.join(' | ');
}

/** QuotaExceededError direkt oder in einem Dexie-Fehler verpackt (inner), auch Safaris „quota“-Meldungen. */
export function istSpeicherVoll(e: unknown): boolean {
  return /QuotaExceeded|quota|NS_ERROR_DOM_QUOTA_REACHED|disk is full|not enough space/i.test(namen(e));
}

/** Datenbank lässt sich gar nicht öffnen (nicht vorhanden oder vom Browser verweigert). Nicht: Versionskonflikt. */
export function istOhneDatenbank(e: unknown): boolean {
  const n = namen(e);
  return !/VersionError/.test(n) && /MissingAPIError|OpenFailedError|InvalidStateError|SecurityError|UnknownError/.test(n);
}

const PAUSE = 60_000;
let zuletztGemeldet = 0;

export function meldeSpeicherVoll(jetzt = Date.now()): boolean {
  if (jetzt - zuletztGemeldet < PAUSE) return false;
  zuletztGemeldet = jetzt;
  notify('critical', 'Gerätespeicher voll – zuletzt Eingegebenes wurde nicht gespeichert',
    'Unter Datensicherung eine Sicherung erstellen, dann große Dokumente oder Skripte mit Bildern löschen oder auf dem Gerät Platz schaffen.');
  return true;
}

/**
 * Schreibfehler im Gerätespeicher (localStorage/sessionStorage) melden. Viele Bereiche fangen den Fehler ab und machen
 * ohne Speicher weiter (Mindmaps, Lehrermodus, Entwürfe, Trainerstände); ohne diese Hülle ginge Eingegebenes still
 * verloren (Audit R-3). Der Fehler wird weitergereicht, das Verhalten der Aufrufer bleibt gleich.
 */
export function beobachteGeraetespeicher(proto: Pick<Storage, 'setItem'> | undefined = typeof Storage !== 'undefined' ? Storage.prototype : undefined): () => void {
  if (!proto) return () => undefined;
  const original = proto.setItem;
  proto.setItem = function setItem(this: Storage, key: string, value: string) {
    try { return original.call(this, key, value); }
    catch (e) { if (istSpeicherVoll(e)) meldeSpeicherVoll(); throw e; }
  };
  return () => { proto.setItem = original; };
}

/** Einmal beim Start aufrufen. Gibt eine Aufräumfunktion zurück. */
export function beobachteSpeicher(): () => void {
  const geraet = beobachteGeraetespeicher();
  const pruefe = (e: unknown) => { if (istSpeicherVoll(e)) meldeSpeicherVoll(); };
  const abgelehnt = (ev: PromiseRejectionEvent) => pruefe(ev.reason);
  const fehler = (ev: ErrorEvent) => pruefe(ev.error ?? ev.message);
  window.addEventListener('unhandledrejection', abgelehnt);
  window.addEventListener('error', fehler);
  db.open().catch((e: unknown) => {
    if (istSpeicherVoll(e)) meldeSpeicherVoll();
    else if (istOhneDatenbank(e)) speicher.set({ ohneDatenbank: true });
  });
  try {
    if (matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone) {
      void navigator.storage?.persisted?.().then((ja) => { if (!ja) void navigator.storage?.persist?.(); }).catch(() => undefined);
    }
  } catch { /* ältere Browser */ }
  return () => { geraet(); window.removeEventListener('unhandledrejection', abgelehnt); window.removeEventListener('error', fehler); };
}
