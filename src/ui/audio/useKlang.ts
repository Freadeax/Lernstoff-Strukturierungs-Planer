import { useEffect, useRef } from 'react';
import { audioEinstellungen, hoerbar, type Kategorie } from './einstellungen';
import { KLANG, type KlangId, type KlangParameter } from './klaenge';
import { starteSchleife, type Schleife } from './spieler';
import { useStore } from '../lib/store';

/**
 * Lässt einen Klang als Schleife laufen, solange `id` gesetzt ist und seine Kategorie hörbar ist.
 * Schaltet jemand die Kategorie an, startet die Schleife sofort; aus = sofort Stille.
 * Neue Parameter (Puls, SpO₂) wirken ab dem nächsten Takt, ohne Neustart.
 */
export function useSchleife(id: KlangId | null | undefined, p: KlangParameter = {}, kategorie?: Kategorie) {
  const kat = kategorie ?? (id ? KLANG[id]?.kategorie : undefined) ?? 'sim';
  const an = useStore(audioEinstellungen, (s) => hoerbar(kat, s));
  const schleife = useRef<Schleife | null>(null);
  const param = useRef(p);
  param.current = p;
  useEffect(() => {
    if (!id || !an) return;
    const s = starteSchleife(id, param.current, { kategorie: kat });
    schleife.current = s;
    return () => { s?.stopp(); schleife.current = null; };
  }, [id, an, kat]);
  useEffect(() => { schleife.current?.setze(p); }, [p.puls, p.spo2, p.af]); // eslint-disable-line react-hooks/exhaustive-deps
}
