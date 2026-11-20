// Einzelne Fälle bei Bedarf laden (Audit L-3). Listen arbeiten mit FALL_KOEPFE, nur der geöffnete Fall wird geladen.
// FAELLE_V2 (index.ts) bleibt für Tests und Prüfseiten, die wirklich alle Fälle brauchen.
import { useEffect, useState } from 'react';
import type { FallV2 } from '../typen';
import { FALL_KOEPFE, FALL_LADER, type FallKopf } from './katalog';

const geladen = new Map<string, FallV2>();
const laufend = new Map<string, Promise<FallV2 | undefined>>();

export const fallKopf = (id: string | null | undefined): FallKopf | undefined => (id ? FALL_KOEPFE.find((k) => k.id === id) : undefined);

/** Bereits geladener Fall (sofort, ohne Warten), sonst undefined. */
export const geladenerFall = (id: string | null | undefined): FallV2 | undefined => (id ? geladen.get(id) : undefined);

/** Fall laden; undefined, wenn es die ID nicht gibt. Fehler beim Nachladen (z. B. offline und nie geladen) werfen. */
export function ladeFall(id: string | null | undefined): Promise<FallV2 | undefined> {
  if (!id || !Object.hasOwn(FALL_LADER, id)) return Promise.resolve(undefined);
  const da = geladen.get(id);
  if (da) return Promise.resolve(da);
  let p = laufend.get(id);
  if (!p) {
    p = FALL_LADER[id]!().then((f) => { geladen.set(id, f); return f; }).finally(() => laufend.delete(id));
    laufend.set(id, p);
  }
  return p;
}

export type FallLadung = { status: 'leer' } | { status: 'laedt' } | { status: 'da'; fall: FallV2 } | { status: 'fehler' };

/** Fall für eine Seite laden. 'leer': keine oder unbekannte ID. */
export function useFall(id: string | null | undefined): FallLadung {
  const sofort = (): FallLadung => {
    const f = geladenerFall(id);
    return f ? { status: 'da', fall: f } : fallKopf(id) ? { status: 'laedt' } : { status: 'leer' };
  };
  const [stand, setStand] = useState<{ id: typeof id; ladung: FallLadung }>(() => ({ id, ladung: sofort() }));
  const aktuell = stand.id === id ? stand.ladung : sofort();
  useEffect(() => {
    if (aktuell.status !== 'laedt') { if (stand.id !== id) setStand({ id, ladung: aktuell }); return; }
    let an = true;
    ladeFall(id).then(
      (f) => { if (an) setStand({ id, ladung: f ? { status: 'da', fall: f } : { status: 'leer' } }); },
      () => { if (an) setStand({ id, ladung: { status: 'fehler' } }); },
    );
    return () => { an = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return aktuell;
}
