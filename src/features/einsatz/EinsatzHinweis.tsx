import { useEffect, useMemo } from 'react';
import { getModule, modules } from '../../modules/registry';
import { useStore } from '../../ui/lib/store';
import { dayKey } from '../../ui/lib/time';
import { session } from '../../ui/shell/session';
import { aktuellerEinsatz, dauerTage, einsatzName, einsatzTag, phase } from './einsatz';
import { ladeEinsaetze, ladeTagebuch } from './speicher';
import { eingang } from './tagebuch';

/**
 * Hinweis auf Heute: nur sichtbar, wenn ein Einsatz läuft oder in den nächsten drei Wochen beginnt.
 * Hält nebenbei den Lernplan-Termin des Einsatzes aktuell (vor dem Start erster Tag, danach letzter Tag).
 */
export function EinsatzHinweis() {
  const moduleId = useStore(session, (s) => s.moduleId);
  const heute = dayKey(new Date());
  const liste = useMemo(ladeEinsaetze, []);
  const e = aktuellerEinsatz(liste, heute);
  useEffect(() => {
    if (!liste.length) return;
    const modul = getModule(moduleId) ?? modules[0];
    if (modul) import('./lernplan').then((m) => m.synchronisiere(liste, modul, heute)).catch(() => undefined);
  }, [liste, moduleId, heute]);
  if (!e) return null;
  const laeuft = phase(e, heute) === 'laeuft';
  const offen = laeuft ? eingang(ladeTagebuch()).length : 0;
  const tage = Math.round((Date.parse(e.von) - Date.parse(heute)) / 86_400_000);
  return (
    <p className="note einsatz-hinweis" role="status">
      <span>
        <strong>Einsatz {einsatzName(e)}:</strong>{' '}
        {laeuft ? `Tag ${einsatzTag(e, heute)} von ${dauerTage(e)}${offen ? `, ${offen} ${offen === 1 ? 'Notiz' : 'Notizen'} im Eingang` : ''}.` : tage === 1 ? 'beginnt morgen.' : `beginnt in ${tage} Tagen.`}
      </span>
      {laeuft
        ? <><a href="#/lernen/einsatz?ansicht=notiz">Schnellnotiz</a> <a href="#/lernen/einsatz?ansicht=tagebuch">Praxistagebuch</a></>
        : <a href="#/lernen/einsatz">Bereit-Check ansehen</a>}
    </p>
  );
}
