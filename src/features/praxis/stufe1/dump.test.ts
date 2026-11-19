import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { FAELLE_V2 } from '../kern/faelle';
import { beginne, entscheide, fertig, offeneEntscheidung, PHASE_TEXT, waehle, weiter, WERTUNG_LABEL } from './ablauf';
it.skipIf(!process.env.STUFE1_DUMP)('dump', () => {
  const out: string[] = ['# Stufe 1 (geführt): erzeugte Schritte und Möglichkeiten', '', 'Automatisch aus den Kernfällen abgeleitet (Rolle 2. Drittel bzw. erste geeignete Rolle). Reihenfolge der Möglichkeiten wie in der App.', ''];
  for (const fall of FAELLE_V2) {
    out.push(`## ${fall.titel} (${fall.id})`, '');
    let st = beginne(fall, fall.geeignet.rollen.includes(2) ? 2 : fall.geeignet.rollen[0]);
    for (let r = 0; r < 300 && !fertig(st); r++) {
      const ev = offeneEntscheidung(st);
      if (ev) { out.push(`**Ereignis:** ${ev.text}`, ...ev.entscheidung!.map(o => `- [${WERTUNG_LABEL[o.wertung]}] ${o.text} — ${o.warum}`), ''); st = entscheide(st, ev.entscheidung!.find(x => x.wertung === 'gut')!.id); continue; }
      const a = st.aktuell; if (!a) break;
      out.push(`**${a.nr + 1}. ${PHASE_TEXT[a.phase]}:** ${a.frage}`);
      for (const o of a.optionen) out.push(`- [${WERTUNG_LABEL[o.wertung]} · ${o.herkunft}] ${o.text}${o.inhalt ? ` (${o.inhalt.join(' · ')})` : ''} — ${o.warum}`);
      out.push('');
      st = weiter(waehle(st, a.optionen.find(o => o.wertung === 'gut')!.id));
    }
  }
  writeFileSync(process.env.STUFE1_DUMP!, out.join('\n'));
});
