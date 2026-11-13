// „Im Skript nachlesen“: nach dem Prüfen einer Aufgabe der passende Abschnitt mit Vorschau-Satz.
// Skripte liegen nur auf dem Gerät (IndexedDB). Ohne Skripte erscheint nichts.
import { useEffect, useMemo, useState } from 'react';
import { db } from '../../core/db';
import './skript-stellen.css';
import { stellenFuer, type SkriptStelle, type StellenZiel } from './stellen';
import type { Skript } from './typen';

let cache: { zeit: number; skripte: Promise<Skript[]> } | null = null;
const FRISCH_MS = 60_000;

/** Skripte einmal je Minute aus der Datenbank, damit eine Runde nicht bei jeder Aufgabe neu liest. */
export function ladeSkripteGepuffert(): Promise<Skript[]> {
  if (!cache || Date.now() - cache.zeit > FRISCH_MS) {
    cache = { zeit: Date.now(), skripte: db.skripte.toArray().catch(() => []) };
  }
  return cache.skripte;
}

export function useSkripte(): Skript[] {
  const [skripte, setSkripte] = useState<Skript[]>([]);
  useEffect(() => {
    let aktiv = true;
    void ladeSkripteGepuffert().then((s) => { if (aktiv) setSkripte(s); });
    return () => { aktiv = false; };
  }, []);
  return skripte;
}

export function useSkriptStellen(ziel: StellenZiel | null, max = 2): SkriptStelle[] {
  const skripte = useSkripte();
  const schluessel = ziel ? `${ziel.topicIds.join(',')}|${ziel.texte.join('|')}` : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (ziel && skripte.length ? stellenFuer(skripte, ziel, max) : []), [skripte, schluessel, max]);
}

/** Kurze Box unter der Rückmeldung. `kompakt` = nur Links ohne Vorschau (Listen, Auswertungen). */
export function SkriptStellen({ ziel, max = 2, kompakt = false }: { ziel: StellenZiel | null; max?: number; kompakt?: boolean }) {
  const stellen = useSkriptStellen(ziel, max);
  if (!stellen.length) return null;
  if (kompakt) {
    return (
      <p className="skript-stellen skript-stellen--kompakt">
        Im Skript nachlesen:{' '}
        {stellen.map((s, i) => (
          <span key={s.skriptId}>{i > 0 && ' · '}<a href={`#${s.pfad}`}>{s.abschnittTitel}</a> <span className="muted">({s.gruppe})</span></span>
        ))}
      </p>
    );
  }
  return (
    <div className="skript-stellen" aria-label="Passende Stellen in deinen Skripten">
      <p className="skript-stellen__kopf">Im Skript nachlesen</p>
      <ul>
        {stellen.map((s) => (
          <li key={s.skriptId}>
            <a href={`#${s.pfad}`}>
              <strong>{s.nr ? `${s.nr} · ` : ''}{s.abschnittTitel}</strong>
              <span className="muted"> · {s.gruppe} {s.skriptTitel}</span>
            </a>
            {s.ausschnitt && <q className="skript-stellen__ausschnitt">{s.ausschnitt}</q>}
          </li>
        ))}
      </ul>
    </div>
  );
}
