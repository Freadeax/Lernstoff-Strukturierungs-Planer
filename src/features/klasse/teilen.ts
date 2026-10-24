import { notify } from '../../ui/shell/notifications';

/** Adresse dieser App ohne „#…“, z. B. https://freadeax.github.io/Lernstoff-Strukturierungs-Planer/ */
export const appBasis = () => location.href.split('#')[0]!;

export async function kopiere(text: string, was = 'Text'): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    notify('info', `${was} kopiert`, 'Jetzt in Nachricht, Mail oder Lernplattform einfügen.');
    return true;
  } catch {
    notify('warning', 'Kopieren nicht möglich', 'Bitte den Text markieren und von Hand kopieren.');
    return false;
  }
}

/** Teilen-Menü des Geräts (iPhone, iPad, Android); sonst kopieren. */
export async function teile(daten: { title: string; text?: string; url?: string }, was = 'Text'): Promise<void> {
  if (typeof navigator.share === 'function') {
    try { await navigator.share(daten); return; } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  await kopiere([daten.text, daten.url].filter(Boolean).join('\n'), was);
}

export function speichereDatei(name: string, inhalt: string, typ = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([inhalt], { type: typ }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const dateiname = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'abgabe';

export const datumText = (iso: string) => new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
export const fristText = (frist: string) => new Date(frist + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
