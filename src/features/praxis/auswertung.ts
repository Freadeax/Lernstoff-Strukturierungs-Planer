// Adapter Praxissimulator → gemeinsame Auswertung (src/ui/sim/auswertung.ts).
// Entscheidungsmomente mit Begründung, Fehlhandlungen mit Folge, Bewertungskriterien mit Warum.

import type { AuswertungsPunkt, SimAuswertung } from '../../ui/sim/auswertung';
import { clinicalDebrief, clock, debrief } from './engine';
import type { Session } from './types';

export function praxisAuswertung(s: Session): SimAuswertung {
  const k = clinicalDebrief(s);
  const punkte: AuswertungsPunkt[] = [];
  for (const d of k.decisions) {
    const choice = s.scenario.storyline?.find((e) => e.id === d.event)?.choices?.find((c) => c.id === d.choice);
    punkte.push({
      id: `wahl:${d.event}`, titel: d.title, urteil: d.best ? 'gut' : choice?.harm ? 'fehler' : 'teilweise',
      deine: d.label, ...(d.best ? {} : { besser: d.bestLabel }), warum: d.why, wann: clock(d.at),
    });
  }
  // Fehlhandlungen aus Aktionen (Fehlwahlen in Entscheidungsmomenten stehen schon oben)
  for (const h of (s.harms ?? []).filter((x) => !x.id.includes(':'))) {
    const a = s.scenario.actions.find((x) => x.id === h.id);
    if (punkte.some((p) => p.id === `fehl:${h.id}`)) continue;
    punkte.push({ id: `fehl:${h.id}`, titel: 'Fehlhandlung', urteil: 'fehler', deine: a?.label ?? h.id, warum: h.text, wann: clock(h.at) });
  }
  for (const c of debrief(s)) {
    punkte.push({
      id: `krit:${c.flag}`, titel: c.label, urteil: c.met ? 'gut' : c.late ? 'teilweise' : 'fehler',
      ...(c.via ? { deine: `Über einen anderen richtigen Weg: ${c.via}` } : c.late ? { deine: 'Erledigt, aber zu spät' } : {}),
      warum: c.why, ...(c.at !== undefined ? { wann: clock(c.at) } : {}),
    });
  }
  const fehler = punkte.some((p) => p.urteil === 'fehler');
  return {
    quelle: 'Praxissimulator',
    ergebnis: { stufe: k.final.unstable ? 'kritisch' : fehler ? 'unsicher' : 'stabil', text: k.final.text },
    punkte,
    merksaetze: s.scenario.teaching ?? [],
    grenzen: 'Geprüft werden Handlungen, Zeitpunkte und Entscheidungen. Pflegebericht und SBAR-Freitext beurteilt nur eine Lehrperson.',
  };
}
