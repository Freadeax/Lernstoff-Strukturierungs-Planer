// Adapter Fallsimulator → gemeinsame Auswertung (src/ui/sim/auswertung.ts).
// Jede Entscheidung mit der Rückmeldung als Begründung; bei Probefällen ohne KI auch der bessere Weg.

import type { AuswertungsPunkt, ErgebnisStufe, SimAuswertung, Urteil } from '../../ui/sim/auswertung';
import { PROBEFAELLE, probeWeg } from './demo';
import { SCHRITT_LABEL, type Fall, type Note, type Wertung } from './simulator';

const URTEIL: Record<Exclude<Wertung, 'keine'>, Urteil> = { gut: 'gut', teilweise: 'teilweise', unguenstig: 'fehler', gefaehrlich: 'fehler' };
const STUFE: Record<Note, ErgebnisStufe> = { sicher: 'stabil', ueberwiegend_sicher: 'unsicher', teilweise: 'unsicher', unsicher: 'kritisch' };

export function fallAuswertung(fall: Fall): SimAuswertung | null {
  const a = fall.abschluss;
  if (!a) return null;
  const probe = PROBEFAELLE.find((p) => p.szenario.id === fall.szenario.id);
  const eingaben = fall.runden.slice(1).map((r) => r.eingabe);
  const weg = probe ? probeWeg(probe, eingaben) : [];
  const punkte: AuswertungsPunkt[] = [];
  fall.runden.forEach((r, i) => {
    if (i === 0 || !r.eingabe) return;
    const w = r.zug.rueckmeldung.wertung;
    if (w === 'keine' || !r.zug.rueckmeldung.text.trim()) return;
    const urteil = URTEIL[w];
    const etappe = probe && weg[i - 1] ? probe.etappen[weg[i - 1]!.id] : undefined;
    const beste = etappe?.optionen.find((o) => o.wertung === 'gut')?.text;
    const vorher = fall.runden[i - 1]!.zug;
    punkte.push({
      id: `zug:${i}`, titel: `${SCHRITT_LABEL[r.zug.schritt]}${vorher.uhrzeit ? ` · ${vorher.uhrzeit}` : ''}`, urteil,
      deine: r.eingabe, ...(urteil !== 'gut' && beste && beste !== r.eingabe ? { besser: beste } : {}),
      warum: r.zug.rueckmeldung.text,
    });
  });
  return {
    quelle: 'Fallsimulator',
    ergebnis: { stufe: STUFE[a.note], text: a.gesamt },
    punkte,
    merksaetze: [...a.verbesserungen, ...(a.musterloesung ? [`Idealer Ablauf: ${a.musterloesung}`] : [])],
    grenzen: probe ? 'Probefall ohne KI: Die Rückmeldungen sind fest geschrieben und fachlich ungeprüft.' : 'Rückmeldungen und Note stammen von der KI und können irren. Im Zweifel mit einer Lehrperson besprechen.',
  };
}
