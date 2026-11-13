import { useState, type ReactNode } from 'react';
import { PageHeading } from '../../ui/PageHeading';
import { notify } from '../../ui/shell/notifications';
import { leseAbgaben } from '../klasse/kodierung';
import { eigeneFaelle, nimmAbgabenAuf } from '../klasse/speicher';
import type { Abgabe } from '../klasse/typen';
import { STATUS_LABEL, type Status } from './typen';

// Gemeinsame Bausteine der Lehrermodus-Seiten.

export function Seite({ titel, intro, aktion, children }: { titel: string; intro?: string; aktion?: ReactNode; children: ReactNode }) {
  return (
    <section className="page klasse lehrer">
      <PageHeading eyebrow="Lehrermodus" title={titel} description={intro ?? ''} action={aktion} />
      {children}
    </section>
  );
}

const STATUS_ART: Record<Status, string> = { offen: 'neutral', ueberfaellig: 'warn', abgegeben: 'info', verspaetet: 'info', bewertet: 'ok', neu: 'warn' };

export function StatusMarke({ status, kurz = false }: { status: Status; kurz?: boolean }) {
  const text = kurz ? { offen: 'offen', ueberfaellig: 'fehlt', abgegeben: 'abgegeben', verspaetet: 'verspätet', bewertet: 'bewertet', neu: 'neu' }[status] : STATUS_LABEL[status];
  return <span className={`lehrer__status lehrer__status--${STATUS_ART[status]}`}>{text}</span>;
}

export interface EinleseErgebnis { gefunden: Abgabe[]; unbekannt: Abgabe[]; text: string; art: 'ok' | 'warn' }

/** Abgaben aus eingefügtem Text, der Zwischenablage oder .txt-Dateien lesen und speichern. */
export async function liesEin(text: string): Promise<EinleseErgebnis> {
  const { abgaben, fehler } = await leseAbgaben(text);
  if (!abgaben.length) {
    return { gefunden: [], unbekannt: [], art: 'warn', text: fehler[0] ?? 'Kein Abgabe-Code gefunden. Er beginnt mit „LSP-ABGABE[“ und steht am Ende der Nachricht.' };
  }
  const bekannt = new Set(eigeneFaelle().map((f) => f.id));
  const unbekannt = abgaben.filter((a) => !bekannt.has(a.fallId));
  const r = nimmAbgabenAuf(abgaben);
  const teile = [
    r.neu && `${r.neu} neu`, r.ersetzt && `${r.ersetzt} aktualisiert`, r.doppelt && `${r.doppelt} schon vorhanden`,
    unbekannt.length && `${unbekannt.length} zu einem Fall, der auf diesem Gerät fehlt`, fehler.length && `${fehler.length} beschädigt`,
  ].filter(Boolean);
  return { gefunden: abgaben, unbekannt, art: fehler.length || unbekannt.length ? 'warn' : 'ok', text: `Abgaben eingelesen: ${teile.join(', ')}.` };
}

/** Eingabefeld für Abgaben. Ruft `fertig` nach jedem erfolgreichen Einlesen auf. */
export function AbgabenEinlesen({ fertig, kompakt = false }: { fertig?: (e: EinleseErgebnis) => void; kompakt?: boolean }) {
  const [eingabe, setEingabe] = useState('');
  const [meldung, setMeldung] = useState<EinleseErgebnis | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  async function los(text: string) {
    setLaeuft(true);
    try {
      const e = await liesEin(text);
      setMeldung(e);
      if (e.gefunden.length) { setEingabe(''); fertig?.(e); }
    } finally { setLaeuft(false); }
  }
  async function zwischenablage() {
    try { await los(await navigator.clipboard.readText()); } catch { notify('warning', 'Zwischenablage nicht lesbar', 'Bitte in das Feld einfügen.'); }
  }
  async function dateien(files: FileList | null) {
    if (!files?.length) return;
    await los((await Promise.all(Array.from(files, (f) => f.text()))).join('\n'));
  }

  return (
    <div className="lehrer__einlesen">
      {!kompakt && <p className="muted">Nachrichten, Mails oder Dateien der Klasse einfügen, auch viele auf einmal und zu verschiedenen Fällen. Jede Abgabe landet automatisch beim richtigen Fall.</p>}
      <label className="field">
        <span>Abgabe-Texte oder Abgabe-Links</span>
        <textarea rows={kompakt ? 3 : 5} className="klasse__einfuegen" value={eingabe} onChange={(e) => setEingabe(e.target.value)} placeholder="Hier einfügen: Text mit „LSP-ABGABE[…]“ oder Link" />
      </label>
      <div className="row klasse__knoepfe">
        <button type="button" className="primary" disabled={!eingabe.trim() || laeuft} onClick={() => los(eingabe)}>Einlesen</button>
        <button type="button" disabled={laeuft} onClick={zwischenablage}>Aus Zwischenablage</button>
        <label className="button-link klasse__datei">Dateien wählen<input type="file" accept=".txt,.eml,text/plain,message/rfc822" multiple onChange={(e) => { void dateien(e.target.files); e.target.value = ''; }} /></label>
      </div>
      {meldung && <div className={`note ${meldung.art}`} role="status">{meldung.text}</div>}
    </div>
  );
}

export const prozentText = (p: number | null) => (p === null ? '–' : `${p.toLocaleString('de-DE', { maximumFractionDigits: 1 })} %`);
