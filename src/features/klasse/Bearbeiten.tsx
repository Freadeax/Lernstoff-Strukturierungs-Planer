import { useEffect, useMemo, useRef, useState } from 'react';
import { logActivity } from '../../core/activity';
import { navigate } from '../../ui/shell/router';
import { gesamtQuote, pruefeAntwort, quote } from './auswertung';
import { FallAnsicht } from './FallAnsicht';
import { abgabeText } from './kodierung';
import { arbeitZu, meinName, merkeName, speichereArbeit, type Arbeit } from './speicher';
import { dateiname, datumText, kopiere, speichereDatei, teile } from './teilen';
import { hatLoesung, type Abgabe, type KlassenFall } from './typen';

/** Ansicht für die Klasse: Fall lesen, Aufgaben beantworten, Abgabe teilen. */
export function Bearbeiten({ fall }: { fall: KlassenFall }) {
  const [arbeit, setArbeit] = useState<Arbeit>(() => arbeitZu(fall.id));
  const [name, setName] = useState(meinName);
  const [text, setText] = useState('');
  const abgabeRef = useRef<HTMLDivElement>(null);
  const { antworten, abgegeben } = arbeit;

  useEffect(() => { speichereArbeit(fall.id, arbeit); }, [fall.id, arbeit]);

  // Geteilt wird der Stand beim Abgeben, nicht spätere Änderungen
  const abgabe: Abgabe | null = useMemo(() => arbeit.abgabe ?? null, [arbeit.abgabe]);

  useEffect(() => {
    let aktiv = true;
    if (abgabe) void abgabeText(fall, abgabe).then((t) => { if (aktiv) setText(t); });
    return () => { aktiv = false; };
  }, [abgabe, fall]);

  const beantwortet = fall.aufgaben.filter((a) => antworten[a.id]?.trim()).length;
  const setze = (id: string, wert: string) => setArbeit((x) => ({ ...x, antworten: { ...x.antworten, [id]: wert } }));

  function abgeben() {
    if (!name.trim()) return;
    const offen = fall.aufgaben.length - beantwortet;
    if (offen > 0 && !confirm(`${offen} ${offen === 1 ? 'Aufgabe ist' : 'Aufgaben sind'} noch leer. Trotzdem abgeben?`)) return;
    merkeName(name.trim());
    const zeit = new Date().toISOString();
    setArbeit((x) => ({ ...x, abgegeben: zeit, abgabe: { v: 1, fallId: fall.id, titel: fall.titel, name: name.trim(), antworten: { ...x.antworten }, abgegeben: zeit } }));
    void logActivity({ kind: 'uebung', severity: 'info', title: `Klassenfall abgegeben: ${fall.titel}`, ref: fall.id });
    requestAnimationFrame(() => abgabeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  const geaendert = !!abgabe && fall.aufgaben.some((a) => (antworten[a.id] ?? '') !== (abgabe.antworten[a.id] ?? ''));
  const mailto = fall.abgabeAn && text && abgabe
    ? `mailto:${encodeURIComponent(fall.abgabeAn)}?subject=${encodeURIComponent(`Abgabe: ${fall.titel} (${abgabe.name})`)}&body=${encodeURIComponent(text)}`
    : '';
  const zeigeLoesung = !!abgegeben && fall.loesung === 'nach-abgabe' && hatLoesung(fall);
  const gesamt = zeigeLoesung ? gesamtQuote(fall.aufgaben, antworten) : null;

  return (
    <div className="klasse__layout">
      <FallAnsicht fall={fall} />

      <form className="card klasse__aufgaben" onSubmit={(e) => { e.preventDefault(); abgeben(); }}>
        {fall.aufgaben.map((a, i) => (
          <label key={a.id} className="klasse__feld">
            <span className="klasse__frage"><span className="klasse__nr">{i + 1}</span> {a.frage}</span>
            <textarea rows={5} value={antworten[a.id] ?? ''} placeholder={a.hinweis ?? 'Deine Antwort'} onChange={(e) => setze(a.id, e.target.value)} />
            {a.hinweis && <span className="muted">{a.hinweis}</span>}
          </label>
        ))}
        <label className="field">
          <span>Dein Name (erscheint bei der Lehrkraft)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </label>
        <div className="row klasse__knoepfe">
          <button type="submit" className="primary" disabled={!name.trim() || beantwortet === 0}>{abgegeben ? 'Erneut abgeben' : 'Abgeben'}</button>
          <span className="muted">{beantwortet} von {fall.aufgaben.length} beantwortet · bleibt auf diesem Gerät gespeichert</span>
        </div>
      </form>

      <div ref={abgabeRef} className="klasse__abgabe">
        {abgegeben && (
          <div className="card">
            <h3>Abgabe an {fall.von || 'die Lehrkraft'} schicken</h3>
            <p className="muted">Fertig am {datumText(abgegeben)}. Erst jetzt kommt die Abgabe an: Schicke den Text über das Teilen-Menü{fall.abgabeAn ? ' oder per Mail' : ''}. Der Code am Ende enthält deine Antworten, bitte nicht ändern.</p>
            <div className="row klasse__knoepfe">
              <button type="button" className="primary" disabled={!text} onClick={() => teile({ title: `Abgabe: ${fall.titel}`, text }, 'Abgabe')}>Teilen …</button>
              {mailto && <a className="button-link" href={mailto}>Per Mail an {fall.abgabeAn}</a>}
              <button type="button" disabled={!text} onClick={() => kopiere(text, 'Abgabe')}>Kopieren</button>
              <button type="button" className="ghost" disabled={!text} onClick={() => speichereDatei(`${dateiname(`${fall.titel}-${name}`)}.txt`, text)}>Als Datei</button>
            </div>
            <details className="klasse__block">
              <summary>Text ansehen</summary>
              <pre className="klasse__vorschau">{text}</pre>
            </details>
            {geaendert
              ? <div className="note warn" role="status">Du hast seit der Abgabe etwas geändert. Diese Änderungen sind noch nicht im Text: erst erneut abgeben, dann neu schicken.</div>
              : <p className="muted">Änderst du danach noch etwas, bitte erneut abgeben und neu schicken.</p>}
          </div>
        )}

        {zeigeLoesung && (
          <div className="card klasse__loesung">
            <h3>Erwartungshorizont</h3>
            {gesamt !== null && <p>Die Checkliste findet {gesamt} % der erwarteten Punkte in deinen Antworten. Sie sucht nur nach Stichworten, die Bewertung macht die Lehrkraft.</p>}
            {fall.aufgaben.map((a, i) => {
              const treffer = pruefeAntwort(a, antworten[a.id] ?? '');
              const q = quote(treffer);
              return (
                <section key={a.id} className="klasse__loesung-aufgabe">
                  <h4><span className="klasse__nr">{i + 1}</span> {a.frage}{q !== null && <span className="klasse__quote">{q} %</span>}</h4>
                  {treffer.length > 0 && (
                    <ul className="klasse__punkte">
                      {treffer.map((t, j) => <li key={j} className={t.ok ? 'is-ok' : 'is-fehlt'}><span aria-hidden>{t.ok ? '✓' : '✗'}</span> {t.punkt.text}<span className="visually-hidden">{t.ok ? ' (genannt)' : ' (nicht gefunden)'}</span></li>)}
                    </ul>
                  )}
                  {a.erwartung && <p className="klasse__text klasse__erwartung">{a.erwartung}</p>}
                </section>
              );
            })}
          </div>
        )}
        {abgegeben && fall.loesung === 'nie' && <p className="muted">Die Lösung bespricht {fall.von || 'die Lehrkraft'} mit der Klasse.</p>}
        <p className="muted"><button type="button" className="link" onClick={() => navigate('/lernen/klasse')}>Alle Klassenfälle</button></p>
      </div>
    </div>
  );
}
