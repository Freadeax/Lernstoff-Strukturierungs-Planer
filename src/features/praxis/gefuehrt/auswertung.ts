// Auswertung des geführten Modus in der gemeinsamen Form (src/ui/sim/auswertung.ts):
// je Schritt deine Wahl mit Begründung, dazu die Entscheidungsmomente aus dem Verlauf.

import type { AuswertungsPunkt, SimAuswertung, Urteil } from '../../../ui/sim/auswertung';
import { clinicalDebrief, clock } from '../engine';
import { PHASEN, type Leitfall, type Wertung } from './typen';
import type { GStand } from './ablauf';

const RANG: Record<Wertung, number> = { gefaehrlich: 0, falsch: 1, vertretbar: 2, gut: 3 };

export function schrittUrteil(wertungen: Wertung[]): Urteil {
  if (!wertungen.length || wertungen.some((w) => w === 'gefaehrlich')) return 'fehler';
  if (wertungen[0] === 'gut') return wertungen.some((w) => w === 'falsch') ? 'teilweise' : 'gut';
  return wertungen[0] === 'vertretbar' ? 'teilweise' : 'fehler';
}

export function gefuehrtAuswertung(l: Leitfall, st: GStand): SimAuswertung {
  const s = st.session;
  const punkte: AuswertungsPunkt[] = l.schritte.map((schritt) => {
    const gewaehlt = (st.picks[schritt.id] ?? []).map((id) => schritt.optionen.find((o) => o.id === id)!).filter(Boolean);
    const urteil = schrittUrteil(gewaehlt.map((o) => o.wertung));
    const beste = schritt.optionen.filter((o) => o.wertung === 'gut');
    const schlechteste = [...gewaehlt].sort((a, b) => RANG[a.wertung] - RANG[b.wertung])[0];
    return {
      id: `schritt:${schritt.id}`,
      titel: `${PHASEN[schritt.phase]}: ${schritt.frage}`,
      urteil,
      deine: gewaehlt.length ? gewaehlt.map((o) => o.text).join(' · ') : 'Nicht bearbeitet',
      ...(urteil !== 'gut' && beste.length ? { besser: beste.map((o) => o.text).join(' oder ') } : {}),
      warum: urteil === 'gut' ? (gewaehlt[0]?.warum ?? '') : [schlechteste?.warum, beste[0]?.warum].filter(Boolean).join(' '),
    };
  });
  for (const d of s.decisions ?? []) {
    const e = s.scenario.storyline?.find((x) => x.id === d.event);
    const c = e?.choices?.find((x) => x.id === d.choice);
    const best = e?.choices?.find((x) => x.best);
    if (!e || !c) continue;
    punkte.push({
      id: `ereignis:${e.id}`, titel: `Unterbrechung: ${e.title}`, urteil: c.best ? 'gut' : 'fehler', deine: c.label,
      ...(!c.best && best ? { besser: best.label } : {}), warum: c.best ? c.why : [c.why, best?.why].filter(Boolean).join(' '), wann: clock(d.at),
    });
  }
  const k = clinicalDebrief(s);
  const gefaehrlich = l.schritte.some((x) => x.optionen.some((o) => o.wertung === 'gefaehrlich' && (st.picks[x.id] ?? []).includes(o.id))) || (s.harms?.length ?? 0) > 0;
  const stufe = gefaehrlich || k.final.unstable ? 'kritisch' : punkte.every((p) => p.urteil === 'gut') ? 'stabil' : 'unsicher';
  return {
    quelle: 'Praxissimulator · geführt',
    ergebnis: { stufe, text: (k.final.unstable ? s.scenario.outcome?.unstable : s.scenario.outcome?.stable) ?? k.final.text },
    punkte,
    merksaetze: s.scenario.teaching ?? [],
    grenzen: 'Bewertet wird deine Auswahl im Vergleich mit der fachlich besten Option. Verlauf und Werte sind ein vereinfachtes Lernmodell, fachlich noch nicht freigegeben.',
  };
}
