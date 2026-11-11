// SBAR in der Diagnostik mit den gemeinsamen Grundkriterien (siehe uebergabe/grundkriterien.ts).
// Rufanlass aus dem Fallverlauf bis zum Anruf: Monitoralarm (Altersprofil) und eingetroffene kritische Laborwerte.
import { parameter } from '../../ui/sim/labor/parameter';
import { gesamtAlarm, monitorGruppe } from '../../ui/sim/monitor';
import { felderAusBausteinen, pruefeGrundkriterien, rufanlass, type GrundErgebnis, type Rufanlass, type SbarEreignis } from '../uebergabe/grundkriterien';
import { vereinfache } from '../uebergabe/pruefung';
import { ergebnisse, vitalwerte, type Lauf } from './lauf';
import type { DiagnostikFall } from './typen';

const stichworte = (text: string) => vereinfache(text).split(/[^a-z0-9]+/).filter((w) => w.length >= 5).slice(0, 5).map((w) => w.slice(0, 7));

export function diagnostikEreignisse(l: Lauf, fall: DiagnostikFall): SbarEreignis[] {
  const bis = l.sbar?.minute ?? l.minute;
  const s = fall.sbar.find((x) => x.relevant && x.text.startsWith('S:'));
  const lage = s ? s.text.replace(/^S:\s*/, '') : fall.patient.anlass;
  const alarm = gesamtAlarm(vitalwerte({ ...l, minute: bis }, fall), monitorGruppe(fall.patient.alter));
  const out: SbarEreignis[] = [{ stufe: alarm === 'rot' ? 'kritisch' : alarm === 'gelb' ? 'auffaellig' : 'info', minute: bis, text: lage, muster: stichworte(lage) }];
  for (const a of ergebnisse(l, fall)) for (const e of a.ergebnisse) {
    if (!e.anruf || e.fertig > bis) continue;
    const name = parameter(e.parameter).name;
    out.push({ stufe: 'kritisch', minute: e.fertig, text: `Kritischer Laborwert: ${name}`, muster: [...stichworte(name), ...stichworte(lage)] });
  }
  return out;
}

export function diagnostikSbar(l: Lauf, fall: DiagnostikFall): { anlass: Rufanlass | null; ergebnis: GrundErgebnis[] | null } {
  const anlass = rufanlass(diagnostikEreignisse(l, fall));
  if (!l.sbar) return { anlass, ergebnis: null };
  const gewaehlt = fall.sbar.filter((x) => l.sbar!.fakten.includes(x.id));
  const { felder, ballast } = felderAusBausteinen(gewaehlt);
  return { anlass, ergebnis: pruefeGrundkriterien(felder, anlass, { ballast }) };
}
