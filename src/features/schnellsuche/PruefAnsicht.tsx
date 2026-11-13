import { useMemo, useState } from 'react';
import { pruefeText, saetze } from '../dnqp/pruefung';
import { DNQP_STANDARDS } from './dnqp-quelle';
import { dnqpLink } from './quellen';
import { suche, type Index } from './suchkern';

/**
 * Beispiel aus den Daten selbst: typische Irrtümer, die die Prüfung erkennt, plus ein richtiger Satz.
 * (Nicht als Text im Quellcode, sonst schlägt die Prüfung der App-Texte an.)
 */
export const BEISPIEL = [
  ...DNQP_STANDARDS.flatMap((s) => (s.fehlvorstellungen ?? []).map((f) => f.falsch))
    .filter((satz) => pruefeText(satz).some((t) => !t.wirktRichtiggestellt)).slice(0, 2),
  DNQP_STANDARDS.find((s) => s.id === 'es.schmerz')?.kernaussagen?.[0] ?? '',
].filter(Boolean).join('\n');

/**
 * Eigene Sätze (Mitschrift, Lehrbuch, Hausarbeit) gegen die Expertenstandards halten:
 * bekannte veraltete Aussagen werden erkannt, zu jedem Satz stehen die passendsten Kriterien daneben.
 * Alles bleibt auf dem Gerät.
 */
const MAX_SAETZE = 40;

export function PruefAnsicht({ index }: { index: Index }) {
  const [text, setText] = useState('');
  const { ergebnis, warnungen, gesamt } = useMemo(() => {
    const treffer = pruefeText(text);
    const alle = saetze(text);
    // Kriterienbezug (Suche) nur für die ersten Sätze; Sätze mit Hinweis werden immer gezeigt.
    const gezeigt = alle.filter((satz, i) => i < MAX_SAETZE || treffer.some((t) => t.satz === satz));
    return {
      gesamt: alle.length,
      warnungen: treffer.filter((t) => !t.wirktRichtiggestellt).length,
      ergebnis: gezeigt.map((satz, i) => ({
        satz,
        hinweise: treffer.filter((t) => t.satz === satz),
        kriterien: i < MAX_SAETZE ? suche(index, satz.replace(/["„“]/g, ' '), { art: 'kriterium' }, 2).treffer : [],
      })),
    };
  }, [text, index]);

  return (
    <div className="sus__pruefen">
      <div className="card sus__suche">
        <label className="sus__label" htmlFor="sus-pruefen">Eigene Aussagen prüfen</label>
        <textarea id="sus-pruefen" rows={6} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Füge Sätze aus Mitschrift, Lehrbuch oder Hausarbeit ein, einen pro Zeile." />
        <div className="sus__aktionen">
          {!text && <button type="button" className="ghost small" onClick={() => setText(BEISPIEL)}>Beispiel einfügen</button>}
          {text && <button type="button" className="ghost small" onClick={() => setText('')}>Leeren</button>}
        </div>
        <p className="muted sus__klein">
          Erkennt bekannte veraltete oder falsche Aussagen zu den Expertenstandards und zeigt zu jedem Satz die passendsten Kriterien.
          Ein Hinweis ist kein Urteil: Prüfe selbst, ob dein Satz das wirklich behauptet. Der Text bleibt auf deinem Gerät.
        </p>
      </div>
      {text.trim() && (
        <p className="sus__status" role="status">
          {gesamt} {gesamt === 1 ? 'Satz' : 'Sätze'} geprüft, {warnungen ? `${warnungen} ${warnungen === 1 ? 'Hinweis' : 'Hinweise'} auf veraltete Aussagen` : 'keine bekannte veraltete Aussage gefunden'}.
          {gesamt > MAX_SAETZE ? ` Passende Kriterien stehen bei den ersten ${MAX_SAETZE} Sätzen; Hinweise gelten für den ganzen Text.` : ''}
        </p>
      )}
      <ol className="sus__liste">
        {ergebnis.map((z, i) => (
          <li key={i} className={`card sus__treffer ${z.hinweise.some((h) => !h.wirktRichtiggestellt) ? 'sus__treffer--warnung' : 'sus__treffer--begriff'}`}>
            <p className="sus__satz">„{z.satz}“</p>
            {z.hinweise.map((h) => (
              <div key={h.fehlvorstellung.id} className="sus__hinweis">
                <p><span className={`tag ${h.wirktRichtiggestellt ? 'tag--info' : 'tag--warning'}`}>{h.wirktRichtiggestellt ? 'wirkt schon richtiggestellt' : 'veraltet oder falsch'}</span> <b>{h.standard}</b></p>
                <dl className="sus__dl">
                  <div><dt>Häufiger Irrtum</dt><dd>{h.fehlvorstellung.falsch}</dd></div>
                  <div><dt>Richtig ist</dt><dd>{h.fehlvorstellung.richtig}</dd></div>
                  <div><dt>Beleg</dt><dd>{h.fehlvorstellung.beleg}</dd></div>
                </dl>
                <a className="button-link small" href={`#${dnqpLink(h.standardId)}`}>Standard öffnen</a>
              </div>
            ))}
            {z.kriterien.length > 0 && (
              <div className="sus__bezug">
                <p className="muted sus__klein">Passende Kriterien:</p>
                <ul>
                  {z.kriterien.map((t) => (
                    <li key={t.dok.id}><a href={`#${t.dok.link}`}>{t.dok.pfad} · {t.dok.titel}</a></li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
