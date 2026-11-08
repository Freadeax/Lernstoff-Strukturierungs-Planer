// Drei Prüfstufen einer Aussage nebeneinander: Zitat gefunden (Code), Sinn geprüft (KI-Prüfer),
// fachlich freigegeben (Mensch). Die Freigabe setzt man hier selbst, mit Name oder Rolle und Datum.
import { useState } from 'react';
import type { Claim, Document, Summary } from '../../../core/types';
import {
  freigabeAmpel, geltungsHinweis, mitFreigabe, sinnAmpel, SINN_TEXT, stufenVon, zitatAmpel, ZITAT_TEXT, type StufenAmpel,
} from '../../qualitaet/belegstufen';

const NAME_KEY = 'lernstoff.freigabeDurch';
const ladeName = () => { try { return localStorage.getItem(NAME_KEY) ?? ''; } catch { return ''; } };
const merkeName = (n: string) => { try { localStorage.setItem(NAME_KEY, n); } catch { /* privater Modus */ } };

const TAG: Record<StufenAmpel, string> = { ok: 'tag tag--wissen-sicher', warn: 'tag tag--warning', fehler: 'tag tag--critical', offen: 'tag', leer: 'tag' };
const ZEICHEN: Record<StufenAmpel, string> = { ok: '✓', warn: '!', fehler: '✗', offen: '○', leer: '–' };

function Stufe({ nr, titel, ampel, text }: { nr: number; titel: string; ampel: StufenAmpel; text: string }) {
  return (
    <li className={TAG[ampel]} title={`${nr}. ${titel}: ${text}`}>
      <span aria-hidden="true">{ZEICHEN[ampel]}</span> {nr}. {text}
    </li>
  );
}

export function Pruefstufen({ summary, claim, docs, onAendern }: { summary: Summary; claim: Claim; docs: Map<string, Document>; onAendern?: (s: Summary) => void }) {
  const st = stufenVon(claim, summary);
  const [name, setName] = useState(ladeName);
  const [anmerkung, setAnmerkung] = useState('');
  const hinweis = geltungsHinweis(claim, docs);
  const f = st.freigabe;

  const setze = (urteil: 'freigegeben' | 'abgelehnt') => {
    const durch = name.trim() || 'ich';
    merkeName(name.trim());
    onAendern?.(mitFreigabe(summary, claim.id, { urteil, durch, am: new Date().toISOString(), ...(anmerkung.trim() ? { anmerkung: anmerkung.trim() } : {}) }));
    setAnmerkung('');
  };

  return (
    <div className="pruefstufen">
      <ul className="pruefstufen__liste" aria-label="Prüfstufen dieser Aussage">
        <Stufe nr={1} titel="Zitat" ampel={zitatAmpel(st.zitat)} text={ZITAT_TEXT[st.zitat]} />
        <Stufe nr={2} titel="Sinn" ampel={sinnAmpel(st.sinn)} text={SINN_TEXT[st.sinn] === '–' ? 'Sinnprüfung entfällt' : SINN_TEXT[st.sinn]} />
        <Stufe nr={3} titel="Fachliche Freigabe" ampel={freigabeAmpel(f)} text={!f ? 'fachlich nicht freigegeben' : f.urteil === 'freigegeben' ? 'fachlich freigegeben' : 'fachlich abgelehnt'} />
      </ul>
      {!claim.pruefung && <p className="muted small">Ältere Zusammenfassung: ob der KI-Prüfer diese Aussage gelesen hat, ist nicht gespeichert.</p>}
      {hinweis && <p className="note small">{hinweis}</p>}
      {f && (
        <p className="muted small">
          {f.urteil === 'freigegeben' ? 'Freigegeben' : 'Abgelehnt'} von {f.durch} am {new Date(f.am).toLocaleDateString('de-DE')}{f.anmerkung ? `: ${f.anmerkung}` : ''}
          {onAendern && <> · <button className="link" onClick={() => onAendern(mitFreigabe(summary, claim.id, null))}>zurücknehmen</button></>}
        </p>
      )}
      {onAendern && !f && st.zitat !== 'entfaellt' && (
        <div className="pruefstufen__freigabe">
          <input aria-label="Geprüft von" placeholder="Geprüft von (z. B. Lehrkraft, Praxisanleitung)" value={name} onChange={(e) => setName(e.target.value)} />
          <input aria-label="Anmerkung" placeholder="Anmerkung (optional)" value={anmerkung} onChange={(e) => setAnmerkung(e.target.value)} />
          <button className="small" onClick={() => setze('freigegeben')} disabled={st.zitat === 'nicht_gefunden' || st.zitat === 'ohne_beleg'}
            title={st.zitat === 'nicht_gefunden' || st.zitat === 'ohne_beleg' ? 'Ohne gefundenes Zitat lässt sich die Aussage nicht freigeben.' : undefined}>Fachlich freigeben</button>
          <button className="small danger" onClick={() => setze('abgelehnt')}>Ablehnen</button>
        </div>
      )}
      {onAendern && !f && st.zitat === 'entfaellt' && claim.isSupplementary && (
        <div className="pruefstufen__freigabe">
          <input aria-label="Geprüft von" placeholder="Geprüft von" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="small" onClick={() => setze('freigegeben')}>Lernhilfe fachlich freigeben</button>
          <button className="small danger" onClick={() => setze('abgelehnt')}>Ablehnen</button>
        </div>
      )}
    </div>
  );
}
