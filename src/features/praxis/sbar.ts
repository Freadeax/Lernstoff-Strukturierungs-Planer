// SBAR im Praxissimulator mit den gemeinsamen Grundkriterien (siehe uebergabe/grundkriterien.ts):
// Der Rufanlass wird aus dem eigenen Verlauf bis zur Übergabe abgeleitet, also aus eingetretenen
// Komplikationen und dem zuletzt gemessenen NEWS2 (nur Erwachsene).
import { pruefeGrundkriterien, rufanlass, type GrundErgebnis, type Rufanlass, type SbarEreignis, type SbarTeil } from '../uebergabe/grundkriterien';
import { vereinfache } from '../uebergabe/pruefung';
import { clinicalDebrief } from './engine';
import { STORY_KINDS, type Session } from './types';

const stichworte = (text: string) => vereinfache(text).split(/[^a-z0-9]+/).filter((w) => w.length >= 5).slice(0, 4).map((w) => w.slice(0, 7));

export function praxisEreignisse(s: Session): SbarEreignis[] {
  const bis = s.flags.sbar ?? s.time;
  const sKern = (s.scenario.sbarCheck ?? []).filter((c) => c.field === 0).flatMap((c) => c.any.map((w) => vereinfache(w)));
  const out: SbarEreignis[] = [];
  for (const e of clinicalDebrief(s).complications) {
    const ev = s.events.find((x) => x.kind === 'story' && x.title === `${STORY_KINDS[e.kind]}: ${e.title}`);
    if (!ev || ev.at > bis) continue;
    out.push({ stufe: 'kritisch', minute: ev.at, text: e.title, muster: [...stichworte(e.title), ...sKern] });
  }
  if (s.scenario.age >= 16) {
    const k = clinicalDebrief(s);
    const p = [...k.scores].reverse().find((x) => x.at <= bis);
    if (p) {
      const stufe = p.punkte >= 7 ? 'kritisch' : p.punkte >= 5 || p.teil.includes(3) ? 'auffaellig' : 'info';
      out.push({ stufe, minute: p.at, text: `NEWS2 ${p.punkte} Punkte bei der letzten Messung`, muster: ['news', ...sKern] });
    }
  }
  // Ohne Auslöser bleibt eine Routineübergabe: Rufgrund ist dann die Person selbst.
  if (!out.length) out.push({ stufe: 'info', text: `Routineübergabe zu ${s.scenario.patient}, kein neuer Auslöser gemessen`, muster: [vereinfache(s.scenario.patient.split(' ').at(-1) ?? ''), ...sKern].filter(Boolean) });
  return out;
}

export function praxisSbar(s: Session): { anlass: Rufanlass | null; ergebnis: GrundErgebnis[] | null } {
  const anlass = rufanlass(praxisEreignisse(s));
  const last = [...s.events].reverse().find((e) => e.kind === 'note' && e.title === 'SBAR-Übergabe');
  if (!last) return { anlass, ergebnis: null };
  const felder = Object.fromEntries((['S', 'B', 'A', 'R'] as SbarTeil[]).map((k) => [k, last.detail.split('\n').find((l) => l.startsWith(`${k}: `))?.slice(3) ?? ''])) as Record<SbarTeil, string>;
  return { anlass, ergebnis: pruefeGrundkriterien(felder, anlass) };
}
