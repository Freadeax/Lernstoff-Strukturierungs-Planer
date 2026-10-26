import { useEffect, useMemo, useState } from 'react';
import { navigate } from '../../ui/shell/router';
import { notify } from '../../ui/shell/notifications';
import { gesamtQuote, pruefeAntwort } from './auswertung';
import { FallAnsicht } from './FallAnsicht';
import { qrPfad, QrVollbild } from './qr';
import { fallLink, leseAbgaben } from './kodierung';
import { abgabenZu, entferneAbgabe, loescheEigenen, nimmAbgabenAuf } from './speicher';
import { appBasis, dateiname, datumText, fristText, kopiere, speichereDatei, teile } from './teilen';
import { hatLoesung, klassenFassung, type Abgabe, type KlassenFall } from './typen';

/** Übersicht eines verteilten Falls: Link teilen, Abgaben einlesen und vergleichen. */
export function Lehrkraft({ fall }: { fall: KlassenFall }) {
  const [links, setLinks] = useState<{ klasse: string; lehrkraft: string } | null>(null);
  const [abgaben, setAbgaben] = useState<Abgabe[]>(() => abgabenZu(fall.id));
  const [eingabe, setEingabe] = useState('');
  const [meldung, setMeldung] = useState<{ art: 'ok' | 'warn'; text: string } | null>(null);
  const [aufgabeId, setAufgabeId] = useState<string>('alle');
  const [zeigeFall, setZeigeFall] = useState(false);
  const [zeigeQr, setZeigeQr] = useState(false);
  const qrMoeglich = useMemo(() => !!links && !!qrPfad(links.klasse), [links]);

  useEffect(() => {
    let aktiv = true;
    void Promise.all([fallLink(klassenFassung(fall), appBasis()), fallLink(fall, appBasis(), 'lehrkraft')])
      .then(([klasse, lehrkraft]) => { if (aktiv) setLinks({ klasse, lehrkraft }); });
    return () => { aktiv = false; };
  }, [fall]);

  const einladung = `${fall.titel}: Bitte den Fall im Lernstoff-Planer bearbeiten${fall.frist ? ` und bis ${fristText(fall.frist)} abgeben` : ''}. Der Link öffnet ihn direkt, ohne Anmeldung.`;

  async function einlesen(text: string) {
    const { abgaben: gefunden, fehler } = await leseAbgaben(text);
    if (!gefunden.length) {
      setMeldung({ art: 'warn', text: fehler[0] ?? 'Kein Abgabe-Code gefunden. Er beginnt mit „LSP-ABGABE[“ und steht am Ende der Nachricht.' });
      return;
    }
    const fremd = gefunden.filter((a) => a.fallId !== fall.id).length;
    const r = nimmAbgabenAuf(gefunden);
    setAbgaben(abgabenZu(fall.id));
    setEingabe('');
    const teile = [
      r.neu && `${r.neu} neu`, r.ersetzt && `${r.ersetzt} aktualisiert`, r.doppelt && `${r.doppelt} schon vorhanden`,
      fremd && `${fremd} zu einem anderen Fall`, fehler.length && `${fehler.length} beschädigt`,
    ].filter(Boolean);
    setMeldung({ art: fehler.length || fremd ? 'warn' : 'ok', text: `Abgaben eingelesen: ${teile.join(', ')}.` });
  }

  async function ausZwischenablage() {
    try { await einlesen(await navigator.clipboard.readText()); } catch { notify('warning', 'Zwischenablage nicht lesbar', 'Bitte in das Feld einfügen.'); }
  }

  async function ausDateien(files: FileList | null) {
    if (!files?.length) return;
    const texte = await Promise.all(Array.from(files, (f) => f.text()));
    await einlesen(texte.join('\n'));
  }

  function loeschen() {
    if (!confirm(`„${fall.titel}“ und ${abgaben.length} Abgaben von diesem Gerät löschen?`)) return;
    loescheEigenen(fall.id);
    navigate('/lernen/klasse');
  }

  function csv() {
    const zelle = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const kopf = ['Name', 'Abgegeben', ...(hatKp ? ['Checkliste %'] : []), ...fall.aufgaben.map((a, i) => `${i + 1}. ${a.frage}`)];
    const zeilen = sortiert.map((a) => [a.name, datumText(a.abgegeben), ...(hatKp ? [String(gesamtQuote(fall.aufgaben, a.antworten) ?? '')] : []), ...fall.aufgaben.map((x) => a.antworten[x.id] ?? '')]);
    // BOM und Semikolon: so öffnet Excel mit deutschen Einstellungen die Datei direkt
    speichereDatei(`${dateiname(fall.titel)}-abgaben.csv`, '﻿' + [kopf, ...zeilen].map((z) => z.map(zelle).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
  }

  const hatKp = fall.aufgaben.some((a) => a.kernpunkte?.length);
  const sortiert = useMemo(() => [...abgaben].sort((a, b) => a.name.localeCompare(b.name, 'de')), [abgaben]);
  const sichtbar = aufgabeId === 'alle' ? fall.aufgaben : fall.aufgaben.filter((a) => a.id === aufgabeId);

  return (
    <div className="klasse__lehrkraft">
      <div className="card">
        <div className="klasse__kopf">
          <h3>{fall.titel}</h3>
          <span className="muted">{abgaben.length} {abgaben.length === 1 ? 'Abgabe' : 'Abgaben'}</span>
        </div>
        <p className="muted">Link an die Klasse schicken, zum Beispiel in die Klassengruppe oder auf die Lernplattform. Wer ihn öffnet, bearbeitet den Fall auf dem eigenen Gerät und schickt dir die Abgabe als Text zurück.</p>
        <div className="row klasse__knoepfe">
          <button type="button" className="primary" disabled={!links} onClick={() => links && teile({ title: fall.titel, text: einladung, url: links.klasse }, 'Link')}>Link an die Klasse teilen …</button>
          <button type="button" disabled={!links} onClick={() => links && kopiere(links.klasse, 'Link')}>Link kopieren</button>
          <button type="button" disabled={!qrMoeglich} onClick={() => setZeigeQr(true)}>QR-Code zeigen</button>
          {links && <a className="button-link" href={links.klasse} target="_blank" rel="noopener">So sieht es die Klasse</a>}
        </div>
        {links && !qrMoeglich && <p className="muted">Für einen QR-Code ist der Link zu lang. {fall.loesung === 'nach-abgabe' && hatLoesung(fall) ? 'Mit „Lösung nicht zeigen“ wird er deutlich kürzer.' : 'Den Fall kürzen oder den Link teilen.'}</p>}
        {zeigeQr && links && <QrVollbild text={links.klasse} titel={fall.titel} onClose={() => setZeigeQr(false)} />}
        {links && <p className="muted">Länge des Links: {links.klasse.length.toLocaleString('de-DE')} Zeichen{links.klasse.length > 6000 ? '. Sehr lang: Wenn ein Programm ihn abschneidet, den Fall kürzen.' : '.'} {fall.loesung === 'nie' && hatLoesung(fall) ? 'Ohne Lösung.' : hatLoesung(fall) ? 'Mit Lösung (erscheint nach der Abgabe).' : ''}</p>}
        <details className="klasse__block">
          <summary>Mehr</summary>
          <div className="row klasse__knoepfe">
            <button type="button" onClick={() => navigate(`/lernen/klasse/neu?id=${fall.id}`)}>Fall bearbeiten</button>
            <button type="button" disabled={!links} onClick={() => links && kopiere(links.lehrkraft, 'Lehrkraft-Link')}>Lehrkraft-Link kopieren</button>
            <button type="button" className="ghost" onClick={() => setZeigeFall((x) => !x)}>{zeigeFall ? 'Fall ausblenden' : 'Fall ansehen'}</button>
            <button type="button" className="danger small" onClick={loeschen}>Löschen</button>
          </div>
          <p className="muted">Der Lehrkraft-Link enthält den Fall mit Lösung, um ihn auf einem anderen Gerät oder für Kolleginnen und Kollegen zu öffnen. Nicht an die Klasse geben.</p>
        </details>
      </div>

      {zeigeFall && <FallAnsicht fall={fall} />}

      <div className="card">
        <h3>Abgaben einlesen</h3>
        <p className="muted">Nachrichten oder Mails der Klasse hier einfügen, auch mehrere auf einmal. Gefunden wird der Code „LSP-ABGABE[…]“ am Ende.</p>
        <textarea rows={4} className="klasse__einfuegen" value={eingabe} onChange={(e) => setEingabe(e.target.value)} placeholder="Abgabe-Text hier einfügen" />
        <div className="row klasse__knoepfe">
          <button type="button" className="primary" disabled={!eingabe.trim()} onClick={() => einlesen(eingabe)}>Einlesen</button>
          <button type="button" onClick={ausZwischenablage}>Aus Zwischenablage</button>
          <label className="button-link klasse__datei">Dateien wählen<input type="file" accept=".txt,text/plain" multiple onChange={(e) => { void ausDateien(e.target.files); e.target.value = ''; }} /></label>
        </div>
        {meldung && <div className={`note ${meldung.art}`} role="status">{meldung.text}</div>}
      </div>

      {sortiert.length > 0 && (
        <div className="card">
          <div className="klasse__kopf">
            <h3>Abgaben vergleichen</h3>
            <button type="button" className="small" onClick={csv}>Als Tabelle (CSV)</button>
          </div>
          <div className="pills klasse__tabs" role="tablist" aria-label="Aufgabe">
            <button type="button" role="tab" className="pill" aria-selected={aufgabeId === 'alle'} aria-pressed={aufgabeId === 'alle'} onClick={() => setAufgabeId('alle')}>Alle</button>
            {fall.aufgaben.map((a, i) => (
              <button key={a.id} type="button" role="tab" className="pill" aria-selected={aufgabeId === a.id} aria-pressed={aufgabeId === a.id} onClick={() => setAufgabeId(a.id)}>Aufgabe {i + 1}</button>
            ))}
          </div>

          {sichtbar.map((a) => {
            const i = fall.aufgaben.indexOf(a);
            const ergebnisse = sortiert.map((x) => ({ abgabe: x, treffer: pruefeAntwort(a, x.antworten[a.id] ?? '') }));
            return (
              <section key={a.id} className="klasse__vergleich">
                <h4><span className="klasse__nr">{i + 1}</span> {a.frage}</h4>
                {(a.kernpunkte?.length || a.erwartung) && (
                  <details className="klasse__block">
                    <summary>Erwartung{a.kernpunkte?.length ? ' und wie oft genannt' : ''}</summary>
                    {a.kernpunkte?.length ? (
                      <ul className="klasse__punkte">
                        {a.kernpunkte.map((k, j) => {
                          const n = ergebnisse.filter((e) => e.treffer[j]?.ok).length;
                          return <li key={j}><span className="klasse__anzahl">{n}/{ergebnisse.length}</span> {k.text}</li>;
                        })}
                      </ul>
                    ) : null}
                    {a.erwartung && <p className="klasse__text klasse__erwartung">{a.erwartung}</p>}
                  </details>
                )}
                <div className="klasse__antworten">
                  {ergebnisse.map(({ abgabe, treffer }) => {
                    const antwort = abgabe.antworten[a.id]?.trim();
                    const ok = treffer.filter((t) => t.ok).length;
                    return (
                      <article key={abgabe.name} className="klasse__antwort">
                        <header><strong>{abgabe.name}</strong>{treffer.length > 0 && <span className="klasse__quote" title="Kernpunkte gefunden">{ok}/{treffer.length}</span>}</header>
                        <p className={`klasse__text${antwort ? '' : ' muted'}`}>{antwort || 'keine Antwort'}</p>
                        {treffer.some((t) => !t.ok) && antwort && <p className="muted">Nicht gefunden: {treffer.filter((t) => !t.ok).map((t) => t.punkt.text).join(' · ')}</p>}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <details className="klasse__block">
            <summary>Abgaben verwalten</summary>
            <ul className="klasse__liste">
              {sortiert.map((a) => (
                <li key={a.name}>
                  <span><strong>{a.name}</strong> <span className="muted">{datumText(a.abgegeben)}</span></span>
                  <button type="button" className="ghost small" onClick={() => { if (confirm(`Abgabe von ${a.name} entfernen?`)) { entferneAbgabe(fall.id, a.name); setAbgaben(abgabenZu(fall.id)); } }}>Entfernen</button>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
