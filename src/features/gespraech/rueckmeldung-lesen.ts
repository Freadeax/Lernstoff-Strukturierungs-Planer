// Rückmeldung zum freien Gespräch einlesen (gemeinsam für Claude mit eigenem Schlüssel und das KI-Tor).
import type { SimAuswertung, Urteil } from '../../ui/sim/auswertung';
import { TECHNIK } from './dialoge';
import type { Nachricht } from './gespraech';

/** Robust einlesen: nur bekannte Urteile und Techniken, Zitate müssen aus den eigenen Äußerungen stammen. */
export function leseRueckmeldung(text: string, verlauf: Nachricht[]): SimAuswertung {
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s < 0 || e < s) throw new Error('Die Rückmeldung war nicht lesbar.');
  const roh = JSON.parse(text.slice(s, e + 1)) as Record<string, unknown>;
  const eigen = verlauf.filter((n) => n.von === 'ich').map((n) => n.text.toLowerCase()).join('\n');
  const urteile: Urteil[] = ['gut', 'teilweise', 'fehler'];
  const punkte = (Array.isArray(roh.punkte) ? roh.punkte as Array<Record<string, unknown>> : []).flatMap((p, i) => {
    const zitat = typeof p.zitat === 'string' ? p.zitat.trim() : '';
    const urteil = urteile.find((u) => u === p.urteil);
    const technik = TECHNIK[p.technik as keyof typeof TECHNIK];
    const warum = typeof p.warum === 'string' ? p.warum.trim() : '';
    if (!zitat || !urteil || !warum || !eigen.includes(zitat.toLowerCase().slice(0, 40))) return [];
    const besser = typeof p.besser === 'string' && p.besser.trim() && urteil !== 'gut' ? p.besser.trim() : undefined;
    return [{ id: `k${i}`, titel: technik ? technik.name : 'Gesprächsführung', urteil, deine: `„${zitat}“`, ...(besser ? { besser } : {}), warum }];
  }).slice(0, 8);
  const stufe = (['stabil', 'unsicher', 'kritisch'] as const).find((x) => x === roh.stufe) ?? 'unsicher';
  const merk = Array.isArray(roh.merksaetze) ? roh.merksaetze.filter((m): m is string => typeof m === 'string' && !!m.trim()).slice(0, 3) : [];
  return {
    quelle: 'Gesprächssimulator (KI)',
    ergebnis: { stufe, text: typeof roh.zusammenfassung === 'string' && roh.zusammenfassung.trim() ? roh.zusammenfassung.trim() : 'Rückmeldung zum Gespräch.' },
    punkte, merksaetze: merk,
    grenzen: 'Rückmeldung der KI, ein Vorschlag zum Nachdenken. Sie zählt nicht im Lernplan.',
  };
}
