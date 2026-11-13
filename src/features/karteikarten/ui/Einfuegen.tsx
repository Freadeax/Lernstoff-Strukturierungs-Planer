import { useMemo, useState } from 'react';
import { notify } from '../../../ui/shell/notifications';
import { kartenSchluessel, TRENNER, zerlegeEinfuegung, type Trenner } from '../einfuegen';
import { uebernehme } from '../store';
import type { Karte } from '../typen';
import { blaetter, fachVon, modul, type KartenCtx } from './kontext';

const BEISPIEL = 'Dekubitus\tDruckgeschwür durch anhaltenden Druck\nTachykardie :: Puls über 100/min\nDer [[Fingertest]] prüft, ob eine Rötung wegdrückbar ist.';

/** Viele Karten auf einmal aus eingefügtem Text (wie Quizlet/Anki-Import), mit Vorschau vor dem Speichern. */
export function KartenEinfuegen({ ctx }: { ctx: KartenCtx }) {
  const [text, setText] = useState('');
  const [wahl, setWahl] = useState<Trenner | 'auto'>('auto');
  const [thema, setThema] = useState('');
  const [fundstelle, setFundstelle] = useState('');
  const [busy, setBusy] = useState(false);
  const ergebnis = useMemo(() => zerlegeEinfuegung(text, wahl), [text, wahl]);
  const vorhanden = useMemo(() => new Set(ctx.daten.gespeichert.map((k) => kartenSchluessel(k.vorne))), [ctx.daten.gespeichert]);
  const neu = ergebnis.karten.filter((k) => !vorhanden.has(kartenSchluessel(k.vorne)));
  const doppelt = ergebnis.karten.length - neu.length;
  const erkannt = TRENNER.find((t) => t.id === ergebnis.trenner)?.label;

  async function anlegen() {
    if (!neu.length) return;
    setBusy(true);
    try {
      const topicIds = thema ? [thema] : [];
      const karten: Karte[] = neu.map((k) => ({
        id: `eigen:${crypto.randomUUID()}`, quelle: 'eigen', art: k.luecken ? 'Lückentext' : 'Eigene Karte',
        vorne: k.vorne, hinten: k.hinten, ...(k.luecken ? { luecken: true } : {}),
        topicIds, subjectIds: fachVon(topicIds), ...(fundstelle.trim() ? { belegText: fundstelle.trim() } : {}),
      }));
      await uebernehme(karten, 'Aus eingefügtem Text');
      notify('info', `${karten.length} ${karten.length === 1 ? 'Karte' : 'Karten'} angelegt`, doppelt ? `${doppelt} schon vorhandene übersprungen.` : undefined);
      setText('');
      await ctx.neuLaden();
    } catch (e) { notify('critical', 'Nicht gespeichert', e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <div className="karten__form karten__einfuegen">
      <p className="muted">Eine Karte je Zeile. Vorder- und Rückseite trennst du mit Tabulator (direkt aus Excel, Quizlet oder Anki kopiert), <code>::</code>, Semikolon, Pfeil oder Gedankenstrich. Zeilen ohne Trenner direkt darunter gehören zur Antwort, <code>[[Wort]]</code> macht einen Lückentext.</p>
      <label className="field">Text einfügen
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={BEISPIEL} spellCheck={false} />
      </label>
      <div className="karten__einfuegen-optionen">
        <label className="field">Trennzeichen
          <select value={wahl} onChange={(e) => setWahl(e.target.value as Trenner | 'auto')}>
            <option value="auto">Automatisch erkennen{wahl === 'auto' && erkannt ? ` (${erkannt.split('  ')[0]})` : ''}</option>
            {TRENNER.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <label className="field">Thema (für alle Karten)
          <select value={thema} onChange={(e) => setThema(e.target.value)}>
            <option value="">ohne Thema</option>
            {modul.subjects.map((s) => {
              const ts = [...blaetter.values()].filter((t) => t.subjectId === s.id);
              return ts.length ? <optgroup key={s.id} label={s.name}>{ts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup> : null;
            })}
          </select>
        </label>
        <label className="field">Quelle (optional)
          <input value={fundstelle} onChange={(e) => setFundstelle(e.target.value)} placeholder="z. B. Skript LE 5, S. 12" />
        </label>
      </div>
      {text.trim() && (
        <div className="karten__einfuegen-vorschau" aria-live="polite">
          <p><strong>{neu.length} neue {neu.length === 1 ? 'Karte' : 'Karten'}</strong>
            {doppelt > 0 && <>, {doppelt} schon vorhanden</>}
            {ergebnis.uebersprungen.length > 0 && <>, Zeile {ergebnis.uebersprungen.slice(0, 8).join(', ')}{ergebnis.uebersprungen.length > 8 ? ' …' : ''} ohne Trennzeichen übersprungen</>}
          </p>
          {neu.length > 0 && (
            <ol className="karten__einfuegen-liste">
              {neu.slice(0, 5).map((k) => (
                <li key={k.zeile}><strong>{k.luecken ? 'Lückentext' : k.vorne}</strong>{k.luecken ? <span> {k.vorne}</span> : <span className="muted"> → {k.hinten.split('\n').join(' · ')}</span>}</li>
              ))}
              {neu.length > 5 && <li className="muted">… und {neu.length - 5} weitere</li>}
            </ol>
          )}
        </div>
      )}
      <div className="row">
        <button type="button" className="primary small" disabled={busy || !neu.length} onClick={() => void anlegen()}>
          {neu.length ? `${neu.length} ${neu.length === 1 ? 'Karte' : 'Karten'} anlegen` : 'Karten anlegen'}
        </button>
      </div>
    </div>
  );
}
