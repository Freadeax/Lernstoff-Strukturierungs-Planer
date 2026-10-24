import { useState } from 'react';
import { navigate } from '../../ui/shell/router';
import { kernpunkteAlsText, leseKernpunkte } from './auswertung';
import { abgabenZu, speichereEigenen } from './speicher';
import { ART_LABEL, neueId, type Abschnitt, type Aufgabe, type FallArt, type KlassenFall } from './typen';

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
        return { ...a, frage: a.frage.trim(), hinweis: a.hinweis?.trim() || undefined, erwartung: a.erwartung?.trim() || undefined, kernpunkte: kp.length ? kp : undefined };
      }),
    };
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
            <details className="klasse__block" open={!!(a.erwartung || a.kpText)}>
              <summary>Lösung (optional)</summary>
              <label className="field"><span>Erwartungshorizont</span>
                <textarea rows={4} value={a.erwartung ?? ''} onChange={(e) => setzeAufgabe(i, { erwartung: e.target.value })} />
              </label>
              <label className="field"><span>Kernpunkte für die Checkliste: eine Zeile je Punkt, nach „:“ Suchwörter mit Komma</span>
                <textarea rows={3} value={a.kpText} onChange={(e) => setzeAufgabe(i, { kpText: e.target.value })} placeholder={'Sturzgefahr: sturz, gestuerzt\nDekubitusgefahr: dekubitus, druckgeschwuer'} />
              </label>
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
      </div>

      <div className="card">
        <h3>Lösung für die Klasse</h3>
        <div className="pills" role="radiogroup" aria-label="Lösung zeigen">
          <button type="button" role="radio" className="pill" aria-checked={f.loesung === 'nach-abgabe'} aria-pressed={f.loesung === 'nach-abgabe'} onClick={() => setze('loesung', 'nach-abgabe')}>Nach der Abgabe zeigen</button>
          <button type="button" role="radio" className="pill" aria-checked={f.loesung === 'nie'} aria-pressed={f.loesung === 'nie'} onClick={() => setze('loesung', 'nie')}>Nicht zeigen</button>
        </div>
        <p className="muted">{f.loesung === 'nie'
          ? 'Die Lösung bleibt nur auf diesem Gerät und kommt nicht in den Link der Klasse.'
          : 'Die Lösung steckt im Link und erscheint nach dem Abgeben. Wer sich auskennt, kann sie auch vorher aus dem Link lesen.'}</p>
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
