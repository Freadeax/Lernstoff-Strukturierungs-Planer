import { useState } from 'react';
import { navigate } from '../../ui/shell/router';
import { kernpunkteAlsText, leseKernpunkte } from './auswertung';
import { abgabenZu, speichereEigenen } from './speicher';
import { ART_LABEL, maxPunkte, neueId, type Abschnitt, type Aufgabe, type FallArt, type KlassenFall } from './typen';
import { buchstabe } from './wahl';

interface AufgabeEntwurf extends Aufgabe { kpText: string }

const zuEntwurf = (a: Aufgabe): AufgabeEntwurf => ({ ...a, kpText: kernpunkteAlsText(a.kernpunkte) });

/** Fall anlegen oder ändern (Lehrkraft). */
export function Editor({ start }: { start: KlassenFall }) {
  const [f, setF] = useState<KlassenFall>(start);
  const [aufgaben, setAufgaben] = useState<AufgabeEntwurf[]>(() => start.aufgaben.map(zuEntwurf));
  const [fehler, setFehler] = useState('');
  const hatAbgaben = abgabenZu(start.id).length > 0;

  const setze = <K extends keyof KlassenFall>(k: K, v: KlassenFall[K]) => setF((x) => ({ ...x, [k]: v }));
  const setzeMaterial = (i: number, m: Partial<Abschnitt>) => setze('material', f.material.map((x, j) => (j === i ? { ...x, ...m } : x)));
  const setzeAufgabe = (i: number, a: Partial<AufgabeEntwurf>) => setAufgaben((xs) => xs.map((x, j) => (j === i ? { ...x, ...a } : x)));
  const verschiebe = (i: number, d: -1 | 1) => setAufgaben((xs) => {
    const j = i + d; if (j < 0 || j >= xs.length) return xs;
    const n = [...xs]; [n[i], n[j]] = [n[j]!, n[i]!]; return n;
  });

  function speichern(e: React.FormEvent) {
    e.preventDefault();
    const fertig = aufgaben.filter((a) => a.frage.trim());
    if (!f.titel.trim()) { setFehler('Bitte einen Titel eingeben.'); return; }
    if (!fertig.length) { setFehler('Bitte mindestens eine Aufgabe eingeben.'); return; }
    const fall: KlassenFall = {
      ...f,
      titel: f.titel.trim(),
      von: f.von?.trim() || undefined,
      abgabeAn: f.abgabeAn?.trim() || undefined,
      frist: f.frist || undefined,
      material: f.material.filter((m) => m.text.trim()).map((m) => ({ titel: m.titel.trim() || 'Material', text: m.text.trim() })),
      aufgaben: fertig.map(({ kpText, ...a }) => {
        const kp = leseKernpunkte(kpText);
        const basis: Aufgabe = { id: a.id, frage: a.frage.trim(), hinweis: a.hinweis?.trim() || undefined, erwartung: a.erwartung?.trim() || undefined, kernpunkte: kp.length ? kp : undefined, punkte: a.punkte && a.punkte > 0 ? a.punkte : undefined };
        if (a.typ !== 'wahl') return basis;
        // Leere Optionen fallen weg, die richtigen Antworten wandern mit
        const behalten = (a.optionen ?? []).map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o);
        const richtig = behalten.flatMap((x, j) => (a.richtig?.includes(x.i) ? [j] : []));
        return { ...basis, kernpunkte: undefined, typ: 'wahl', optionen: behalten.map((x) => x.o), mehrfach: a.mehrfach || undefined, richtig: richtig.length ? richtig : undefined };
      }),
    };
    const kaputt = fall.aufgaben.findIndex((a) => a.typ === 'wahl' && (a.optionen?.length ?? 0) < 2);
    if (kaputt >= 0) { setFehler(`Aufgabe ${kaputt + 1}: Eine Auswahlaufgabe braucht mindestens zwei Antworten.`); return; }
    const zuViele = fall.aufgaben.findIndex((a) => a.typ === 'wahl' && !a.mehrfach && (a.richtig?.length ?? 0) > 1);
    if (zuViele >= 0) { setFehler(`Aufgabe ${zuViele + 1}: Nur eine Antwort darf richtig sein, oder „Mehrere Antworten können richtig sein“ anhaken.`); return; }
    if (!speichereEigenen(fall)) { setFehler('Speichern nicht möglich (privater Modus oder Speicher voll).'); return; }
    navigate(`/lernen/klasse/lehrkraft?id=${fall.id}`);
  }

  return (
    <form className="klasse__editor" onSubmit={speichern}>
      <div className="card">
        <label className="field"><span>Titel</span>
          <input value={f.titel} onChange={(e) => setze('titel', e.target.value)} placeholder="z. B. Frau M. nach Schlaganfall" required />
        </label>
        <div className="klasse__zeile">
          <label className="field"><span>Art</span>
            <select value={f.art} onChange={(e) => setze('art', e.target.value as FallArt)}>
              {(Object.keys(ART_LABEL) as FallArt[]).map((a) => <option key={a} value={a}>{ART_LABEL[a]}</option>)}
            </select>
          </label>
          <label className="field"><span>Abgabe bis (optional)</span>
            <input type="date" value={f.frist ?? ''} onChange={(e) => setze('frist', e.target.value)} />
          </label>
        </div>
        <div className="klasse__zeile">
          <label className="field"><span>Von (Name der Lehrkraft, optional)</span>
            <input value={f.von ?? ''} onChange={(e) => setze('von', e.target.value)} placeholder="z. B. Frau Schmidt" />
          </label>
          <label className="field"><span>Abgabe per Mail an (optional)</span>
            <input type="email" value={f.abgabeAn ?? ''} onChange={(e) => setze('abgabeAn', e.target.value)} placeholder="name@schule.de" />
          </label>
        </div>
        <p className="muted">Alles, was hier steht, steckt im Link und ist für alle mit dem Link lesbar. Keine echten Patientendaten verwenden.</p>
      </div>

      <div className="card">
        <h3>Fall</h3>
        <label className="field"><span>Ausgangssituation</span>
          <textarea rows={6} value={f.situation} onChange={(e) => setze('situation', e.target.value)} placeholder="Wer ist die Person, was ist passiert, wo findet die Pflege statt?" />
        </label>
        {f.material.map((m, i) => (
          <fieldset key={i} className="klasse__teil">
            <legend>Material {i + 1}</legend>
            <label className="field"><span>Überschrift</span>
              <input value={m.titel} onChange={(e) => setzeMaterial(i, { titel: e.target.value })} placeholder="z. B. Vitalzeichen, Arztbrief, Gespräch" />
            </label>
            <label className="field"><span>Inhalt</span>
              <textarea rows={4} value={m.text} onChange={(e) => setzeMaterial(i, { text: e.target.value })} />
            </label>
            <button type="button" className="ghost small" onClick={() => setze('material', f.material.filter((_, j) => j !== i))}>Material entfernen</button>
          </fieldset>
        ))}
        <button type="button" className="small" onClick={() => setze('material', [...f.material, { titel: '', text: '' }])}>+ Material</button>
      </div>

      <div className="card">
        <h3>Aufgaben</h3>
        {aufgaben.map((a, i) => (
          <fieldset key={a.id} className="klasse__teil">
            <legend>Aufgabe {i + 1}</legend>
            <label className="field"><span>Aufgabe</span>
              <textarea rows={2} value={a.frage} onChange={(e) => setzeAufgabe(i, { frage: e.target.value })} placeholder="z. B. Nenne drei Pflegeprobleme und begründe sie." />
            </label>
            <label className="field"><span>Hinweis für die Klasse (optional)</span>
              <input value={a.hinweis ?? ''} onChange={(e) => setzeAufgabe(i, { hinweis: e.target.value })} />
            </label>
            <div className="klasse__zeile">
              <div className="field">
                <span id={`typ-${a.id}`}>Antwort</span>
                <div className="pills" role="radiogroup" aria-labelledby={`typ-${a.id}`}>
                  <button type="button" role="radio" className="pill" aria-checked={a.typ !== 'wahl'} onClick={() => setzeAufgabe(i, { typ: undefined })}>Freitext</button>
                  <button type="button" role="radio" className="pill" aria-checked={a.typ === 'wahl'} onClick={() => setzeAufgabe(i, { typ: 'wahl', optionen: a.optionen?.length ? a.optionen : ['', '', ''] })}>Auswahl (A, B, C …)</button>
                </div>
              </div>
              <label className="field"><span>Punkte (optional, für die Bewertung)</span>
                <input type="number" inputMode="decimal" min={0} step={0.5} value={a.punkte ?? ''} onChange={(e) => setzeAufgabe(i, { punkte: e.target.value ? Math.max(0, Number(e.target.value)) : undefined })} />
              </label>
            </div>
            {a.typ === 'wahl' && (
              <div className="klasse__optionen">
                <label className="klasse__haken">
                  <input type="checkbox" checked={!!a.mehrfach} onChange={(e) => setzeAufgabe(i, { mehrfach: e.target.checked || undefined, richtig: e.target.checked ? a.richtig : a.richtig?.slice(0, 1) })} />
                  <span>Mehrere Antworten können richtig sein</span>
                </label>
                {(a.optionen ?? []).map((o, j) => (
                  <div key={j} className="klasse__option">
                    <span className="klasse__nr" aria-hidden>{buchstabe(j)}</span>
                    <input aria-label={`Antwort ${buchstabe(j)}`} value={o} onChange={(e) => setzeAufgabe(i, { optionen: a.optionen!.map((x, k) => (k === j ? e.target.value : x)) })} />
                    <label className="klasse__haken">
                      <input type="checkbox" checked={!!a.richtig?.includes(j)} onChange={(e) => {
                        const r = new Set(a.mehrfach ? a.richtig ?? [] : []);
                        if (e.target.checked) r.add(j); else r.delete(j);
                        setzeAufgabe(i, { richtig: [...r].sort((x, y) => x - y) });
                      }} />
                      <span>richtig</span>
                    </label>
                    <button type="button" className="ghost small" aria-label={`Antwort ${buchstabe(j)} entfernen`} disabled={(a.optionen?.length ?? 0) <= 2} onClick={() => setzeAufgabe(i, {
                      optionen: a.optionen!.filter((_, k) => k !== j),
                      richtig: (a.richtig ?? []).filter((r) => r !== j).map((r) => (r > j ? r - 1 : r)),
                    })}>✕</button>
                  </div>
                ))}
                {(a.optionen?.length ?? 0) < 8 && <button type="button" className="small" onClick={() => setzeAufgabe(i, { optionen: [...(a.optionen ?? []), ''] })}>+ Antwort</button>}
                <p className="muted">Die richtige Antwort steht nie im Link für die Klasse. Nach der Abgabe rechnet der Lehrermodus die Punkte vor.</p>
              </div>
            )}
            <details className="klasse__block" open={!!(a.erwartung || a.kpText)}>
              <summary>Lösung (optional)</summary>
              <label className="field"><span>Erwartungshorizont</span>
                <textarea rows={4} value={a.erwartung ?? ''} onChange={(e) => setzeAufgabe(i, { erwartung: e.target.value })} />
              </label>
              {a.typ !== 'wahl' && <label className="field"><span>Kernpunkte für die Checkliste: eine Zeile je Punkt, nach „:“ Suchwörter mit Komma</span>
                <textarea rows={3} value={a.kpText} onChange={(e) => setzeAufgabe(i, { kpText: e.target.value })} placeholder={'Sturzgefahr: sturz, gestuerzt\nDekubitusgefahr: dekubitus, druckgeschwuer'} />
              </label>}
            </details>
            <div className="row">
              <span>
                <button type="button" className="ghost small" onClick={() => verschiebe(i, -1)} disabled={i === 0} aria-label="Nach oben">↑</button>
                <button type="button" className="ghost small" onClick={() => verschiebe(i, 1)} disabled={i === aufgaben.length - 1} aria-label="Nach unten">↓</button>
              </span>
              <button type="button" className="ghost small" onClick={() => setAufgaben((xs) => xs.filter((_, j) => j !== i))} disabled={aufgaben.length === 1}>Aufgabe entfernen</button>
            </div>
          </fieldset>
        ))}
        <button type="button" className="small" onClick={() => setAufgaben((xs) => [...xs, { id: neueId(4), frage: '', kpText: '' }])}>+ Aufgabe</button>
        {(() => { const m = maxPunkte({ ...f, aufgaben }); return m ? <p className="muted">Zusammen {m.toLocaleString('de-DE')} Punkte.</p> : null; })()}
      </div>

      <div className="card">
        <h3>Lösung für die Klasse</h3>
        <div className="pills" role="radiogroup" aria-label="Lösung zeigen">
          <button type="button" role="radio" className="pill" aria-checked={f.loesung === 'nach-abgabe'} aria-pressed={f.loesung === 'nach-abgabe'} onClick={() => setze('loesung', 'nach-abgabe')}>Später als eigenen Link verteilen</button>
          <button type="button" role="radio" className="pill" aria-checked={f.loesung === 'nie'} aria-pressed={f.loesung === 'nie'} onClick={() => setze('loesung', 'nie')}>Nicht zeigen</button>
        </div>
        <p className="muted">{f.loesung === 'nie'
          ? 'Die Lösung bleibt nur auf diesem Gerät und kommt in keinen Link.'
          : 'Der Link für die Klasse enthält nie die Lösung. Du bekommst zusätzlich einen Lösungslink, den du erst nach der Frist verteilst. Dann sieht die Klasse den Erwartungshorizont zu ihren Abgaben.'}</p>
        {hatAbgaben && <p className="muted">Es gibt schon Abgaben. Nach Änderungen bitte den neuen Link verteilen, die bisherigen Abgaben bleiben erhalten.</p>}
        {fehler && <div className="note warn" role="alert">{fehler}</div>}
        <div className="row klasse__knoepfe">
          <button type="submit" className="primary">Speichern und Link erstellen</button>
          <button type="button" className="ghost" onClick={() => history.back()}>Abbrechen</button>
        </div>
      </div>
    </form>
  );
}
