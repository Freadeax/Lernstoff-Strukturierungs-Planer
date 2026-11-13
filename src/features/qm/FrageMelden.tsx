import { useState } from 'react';
import './qm.css';
import { GRUND_LABEL, melde, ZAEHLT_NICHT, type Grund, type Meldung } from './meldungen';

interface Props {
  quelle: string;
  aufgabeId: string;
  fp: string;
  titel: string;
  frage: string;
  /** Eigene Antwort (nach dem Prüfen), hilft beim Nachvollziehen. */
  antwort?: string;
  /** Pfad der Seite, für den Link „an die Testleitung schicken“. */
  seite: string;
  onGemeldet?: (m: Meldung) => void;
}

/**
 * „Frage melden“ mit einem Klick: Grund wählen, optional eine Notiz, fertig. Die Meldung bleibt auf dem
 * Gerät (Überarbeitungsliste) und kann als Rückmeldungs-Code an die betreuende Person gehen.
 */
export function FrageMelden({ quelle, aufgabeId, fp, titel, frage, antwort, seite, onGemeldet }: Props) {
  const [offen, setOffen] = useState(false);
  const [grund, setGrund] = useState<Grund>('unklar');
  const [notiz, setNotiz] = useState('');
  const [fertig, setFertig] = useState<Meldung | null>(null);

  if (fertig) {
    const weiter = `/system/test?${new URLSearchParams({ ansicht: 'rueckmeldung', art: fertig.grund === 'unklar' ? 'unklar' : 'fehler', seite, meldung: fertig.id })}`;
    return (
      <p className="qm-melden__danke note" role="status">
        Danke, gemeldet. {ZAEHLT_NICHT.includes(fertig.grund) ? 'Die Aufgabe zählt bis zur Klärung nicht für deinen Lernstand. ' : ''}
        <a href="#/system/qualitaet?ansicht=liste">Überarbeitungsliste</a> · <a href={`#${weiter}`}>An die Testleitung schicken</a>
      </p>
    );
  }
  if (!offen) {
    return <button type="button" className="ghost small qm-melden__knopf" onClick={() => setOffen(true)} aria-expanded={false}>⚑ Frage melden</button>;
  }
  return (
    <form className="qm-melden card" onSubmit={(e) => {
      e.preventDefault();
      const m = melde({ quelle, aufgabeId, fp, titel, frage, grund, notiz, antwort });
      setFertig(m); onGemeldet?.(m);
    }}>
      <fieldset>
        <legend>Was stimmt mit dieser Frage nicht?</legend>
        <div className="qm-melden__gruende">
          {(Object.keys(GRUND_LABEL) as Grund[]).map((g) => (
            <label key={g} className="check"><input type="radio" name={`grund-${aufgabeId}`} checked={grund === g} onChange={() => setGrund(g)} /><span>{GRUND_LABEL[g]}</span></label>
          ))}
        </div>
      </fieldset>
      <label>Was genau? (freiwillig)
        <textarea rows={2} maxLength={1000} value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="z. B. Laut Skript gilt …, oder: Option B stimmt auch, weil …" />
      </label>
      <div className="row">
        <button type="submit" className="primary small">Melden</button>
        <button type="button" className="ghost small" onClick={() => setOffen(false)}>Abbrechen</button>
      </div>
    </form>
  );
}
