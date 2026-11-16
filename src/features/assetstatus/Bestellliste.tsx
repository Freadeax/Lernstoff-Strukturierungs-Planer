import { useMemo, useState } from 'react';
import { notify } from '../../ui/shell/notifications';
import { download } from '../../ui/widget/export';
import { bestellBericht, bestellung, katalogVorlage, zielDatei, type Position, type Prioritaet } from './bestellung';
import { heute, verwendungZiel } from './pruefung';

const url = (datei: string) => `${import.meta.env.BASE_URL}${datei}`;
const PRIO_TEXT: Record<Prioritaet, string> = { P1: 'P1 · heute sichtbar', P2: 'P2 · verbessert', P3: 'P3 · Vorrat' };

async function kopiere(text: string, was: string) {
  try { await navigator.clipboard.writeText(text); notify('info', `${was} kopiert`, 'In der Zwischenablage.'); }
  catch { notify('warning', 'Kopieren nicht möglich', 'Der Browser erlaubt die Zwischenablage hier nicht. Text bitte markieren und kopieren.'); }
}

function Karte({ p }: { p: Position }) {
  return (
    <li className={`bildpruefung__karte is-${p.prioritaet === 'P1' ? 'mangel' : 'offen'}`}>
      <div className="bildpruefung__bild">
        {p.referenz && !p.referenz.endsWith('.mp4') && !p.referenz.startsWith('bildgebung/')
          ? <a href={url(p.referenz)} target="_blank" rel="noopener"><img src={url(p.referenz)} alt={`Referenzbild ${p.referenz}`} loading="lazy" decoding="async" /></a>
          : <p className="muted">Kein Referenzbild</p>}
      </div>
      <div className="bildpruefung__text">
        <h3>{p.titel}</h3>
        <p><span className="badge">{p.prioritaet}</span> <code className="bildpruefung__klein">{zielDatei(p)}</code></p>
        <p className="bildpruefung__klein">{p.grund}</p>
        {p.faelle.length > 0 && <p className="bildpruefung__klein">Für: {p.faelle.map((f, i) => {
          const ziel = verwendungZiel(f);
          return <span key={f}>{i > 0 && ', '}{ziel ? <a href={ziel}>{f}</a> : f}</span>;
        })}</p>}
        <details className="bildpruefung__prompt">
          <summary>Bild-Prompt</summary>
          <p className="bildpruefung__klein">{p.prompt}</p>
        </details>
        <div className="bildpruefung__aktionen">
          <button type="button" onClick={() => void kopiere(p.prompt, 'Prompt')}>Prompt kopieren</button>
          <button type="button" onClick={() => void kopiere(zielDatei(p).split('/').pop()!, 'Dateiname')}>Dateiname kopieren</button>
          {p.referenz && <a href={url(p.referenz)} download>Referenzbild laden</a>}
        </div>
      </div>
    </li>
  );
}

/** Bestellliste in der App: Positionen aus docs/BESTELLUNG.md mit Prompt, Dateiname und Katalogvorlage. */
export function Bestellliste() {
  const liste = useMemo(() => bestellung(), []);
  const [prio, setPrio] = useState<Prioritaet | 'alle'>('P1');
  const sichtbar = liste.filter((p) => prio === 'alle' || p.prioritaet === prio);
  return (
    <>
      <div className="card bildpruefung__kopf">
        <p className="bildpruefung__zahlen">
          <strong>{liste.length}</strong> Positionen für die nächste Lieferung · {(['P1', 'P2', 'P3'] as Prioritaet[]).map((x) => `${liste.filter((p) => p.prioritaet === x).length} × ${x}`).join(' · ')}
        </p>
        <p className="muted bildpruefung__klein">Prompt kopieren, Referenzbild anhängen, Bild erzeugen und unter dem angegebenen Dateinamen speichern. Die Katalogvorlage gehört als <code>ASSET_KATALOG.json</code> ins Paket; Beschreibung und Urheber bitte ergänzen.</p>
        <div className="bildpruefung__aktionen">
          <button type="button" className="primary" onClick={() => download(`ASSET_KATALOG_vorlage_${heute()}.json`, JSON.stringify(katalogVorlage(sichtbar), null, 2), 'application/json')}>Katalogvorlage ({sichtbar.length})</button>
          <button type="button" onClick={() => download(`bestellung-${heute()}.md`, bestellBericht(liste), 'text/markdown;charset=utf-8')}>Ganze Liste als Datei</button>
        </div>
      </div>
      <div className="pills" role="radiogroup" aria-label="Nach Priorität filtern">
        {(['P1', 'P2', 'P3', 'alle'] as const).map((k) => (
          <button key={k} type="button" className="pill" role="radio" aria-checked={prio === k} onClick={() => setPrio(k)}>{k === 'alle' ? 'Alle' : PRIO_TEXT[k]}</button>
        ))}
      </div>
      <ul className="bildpruefung__liste">{sichtbar.map((p) => <Karte key={p.id} p={p} />)}</ul>
    </>
  );
}
