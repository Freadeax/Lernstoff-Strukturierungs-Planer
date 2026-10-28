// Gerätedaten der CE-Seite (Skripte, Karteikarten, Lesestand, Haken) und daraus die Fakten je Thema
// für den Lernpfad. Liest nur; geschrieben wird in den jeweiligen Modulen.

import { useCallback, useEffect, useState } from 'react';
import { db } from '../../core/db';
import type { ID } from '../../core/types';
import type { CatalogModule } from '../../modules/catalog-types';
import { SZENARIEN } from '../fall/faelle';
import { ladeKartenDaten } from '../karteikarten/store';
import type { Karte, KartenStand } from '../karteikarten/typen';
import { faelleZuThema } from '../krankheitsbilder/bewertung';
import { FAELLE as KRANKHEITSFAELLE } from '../krankheitsbilder/faelle';
import type { StoredReviewLog } from '../lernplan/store';
import { uebungenFuer } from '../lernplan/trainer';
import type { TopicProgress } from '../lernplan/progress';
import { ladeLesestaende } from '../skript/store';
import type { Lesestand, Skript } from '../skript/typen';
import { ladeHaken, steckbriefHaken, type Haken, type ThemaFakten } from './lernpfad';
import { steckbriefeZuThema, szenarienZuThema, type CeThema } from './modell';
import { testbareThemen } from './selbsttest';

export interface GeraeteDaten {
  skripte: Skript[];
  /** Nicht ausgesetzte Karteikarten. */
  karten: Karte[];
  staende: Map<ID, KartenStand>;
  lesestaende: Record<ID, Lesestand>;
  haken: Haken;
}

const LEER: GeraeteDaten = { skripte: [], karten: [], staende: new Map(), lesestaende: {}, haken: {} };

/** Skripte und Karteikarten liegen nur auf dem Gerät; ohne sie bleibt die Seite trotzdem nutzbar. */
export function useGeraeteDaten(modul: CatalogModule) {
  const [daten, setDaten] = useState<GeraeteDaten>(LEER);
  const [stand, setStand] = useState(0);
  useEffect(() => {
    let aktiv = true;
    const lokal = { lesestaende: ladeLesestaende(), haken: ladeHaken() };
    setDaten((d) => ({ ...d, ...lokal }));
    db.skripte.toArray().then((skripte) => { if (aktiv) setDaten((d) => ({ ...d, skripte })); }).catch(() => undefined);
    ladeKartenDaten(modul).then((k) => {
      if (aktiv) setDaten((d) => ({ ...d, karten: k.alle.filter((x) => !k.staende.get(x.id)?.ausgesetzt), staende: k.staende }));
    }).catch(() => undefined);
    return () => { aktiv = false; };
  }, [stand, modul]);
  const neuLaden = useCallback(() => setStand((n) => n + 1), []);
  const setHaken = useCallback((haken: Haken) => setDaten((d) => ({ ...d, haken })), []);
  return { daten, neuLaden, setHaken };
}

export interface FaktenQuelle {
  modul: CatalogModule;
  daten: GeraeteDaten;
  progress: Record<ID, TopicProgress | undefined>;
  reviewLogs: StoredReviewLog[];
  ceId: ID;
}

const enc = encodeURIComponent;

/** Baut für alle Themen einer CE die Fakten, aus denen der Lernpfad entsteht. */
export function sammleFakten(themen: CeThema[], q: FaktenQuelle): ThemaFakten[] {
  const { daten, modul } = q;
  const profile = modul.diseaseProfiles ?? [];
  const skripte = new Map(daten.skripte.map((s) => [s.id, s]));
  const ids = themen.map((t) => t.topic.id);
  const testbar = testbareThemen(daten.karten, ids);
  const kartenJe = new Map<ID, { gesamt: number; gesehen: number }>();
  for (const k of daten.karten) {
    for (const t of new Set(k.topicIds)) {
      const z = kartenJe.get(t) ?? { gesamt: 0, gesehen: 0 };
      kartenJe.set(t, { gesamt: z.gesamt + 1, gesehen: z.gesehen + (daten.staende.has(k.id) ? 1 : 0) });
    }
  }
  const geuebt = new Set(q.reviewLogs.filter((l) => l.trainer === 'fall' || l.trainer === 'krankheitsbilder').map((l) => l.topicId));
  const tests = new Map<ID, number>();
  for (const l of q.reviewLogs) if (l.source !== 'selbsteinschaetzung') tests.set(l.topicId, (tests.get(l.topicId) ?? 0) + 1);

  // Steckbrief gilt als gelesen, wenn abgehakt oder alle seine Karteikarten schon einmal gelernt sind
  const khKarten = new Map<ID, { gesamt: number; gesehen: number }>();
  for (const k of daten.karten) {
    const m = k.id.match(/^kh:([^:]+):/);
    if (!m) continue;
    const z = khKarten.get(m[1]!) ?? { gesamt: 0, gesehen: 0 };
    khKarten.set(m[1]!, { gesamt: z.gesamt + 1, gesehen: z.gesehen + (daten.staende.has(k.id) ? 1 : 0) });
  }
  const gelesenKb = (id: ID) => !!daten.haken[steckbriefHaken(id)] || (() => { const z = khKarten.get(id); return !!z && z.gesamt > 0 && z.gesehen >= z.gesamt; })();

  return themen.map((e) => {
    const id = e.topic.id;
    const szen = szenarienZuThema(id, SZENARIEN);
    const kf = faelleZuThema(id, KRANKHEITSFAELLE, modul);
    const p = q.progress[id];
    const uebung = uebungenFuer(id, modul)[0];
    return {
      topicId: id,
      skripte: e.skriptIds.map((sid) => skripte.get(sid)).filter((s): s is Skript => !!s).map((s) => {
        const ab = new Set(s.abschnitte.map((a) => a.id));
        return { id: s.id, titel: s.titel, abschnitte: s.abschnitte.length, gelesen: (daten.lesestaende[s.id]?.gelesen ?? []).filter((x) => ab.has(x)).length };
      }),
      erarbeitet: !!p && p.status !== 'offen',
      karten: kartenJe.get(id) ?? { gesamt: 0, gesehen: 0 },
      steckbriefe: steckbriefeZuThema(id, profile).map((x) => ({ id: x.id, name: x.name, gelesen: gelesenKb(x.id) })),
      faelle: {
        anzahl: szen.length + kf.length,
        geuebt: geuebt.has(id),
        ziel: szen.length ? `/lernen/fall?thema=${enc(id)}` : kf.length ? `/lernen/krankheitsbilder?ansicht=faelle&thema=${enc(id)}` : undefined,
      },
      status: p?.status ?? 'offen',
      tests: tests.get(id) ?? 0,
      testZiel: testbar.has(id) ? `/lernen/ce?ce=${enc(q.ceId)}&ansicht=test&thema=${enc(id)}` : uebung?.path,
    };
  });
}
