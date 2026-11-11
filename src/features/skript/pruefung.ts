// Skript-Prüfung (Audit 11/2026): fehlende Seiten und fehlende Quellen getrennt melden,
// stabile Abschnittsnummern für Links und nachvollziehbare ältere Fassungen.
// Reine Funktionen, damit sie ohne Browser testbar sind.

import { abschnittSchluessel, belegText, findeBelege } from './parser';

export { abschnittSchluessel };
import { istQuellenAbschnitt, punkte } from './karten';
import type { Abschnitt, Skript } from './typen';

export interface AbschnittPruefung {
  id: string;
  nummer?: string;
  titel: string;
  /** Belege mit bekannter Quelle, aber ohne Seitenangabe, z. B. „[D]“. */
  ohneSeite: string[];
  /** Kürzel in Belegen, die im Quellenverzeichnis fehlen, z. B. „[X, S. 4]“ ohne **[X]** oben. */
  ohneQuelle: string[];
  /** Aufzählungspunkte ganz ohne Beleg (auch nicht über Überschrift oder Oberpunkt). */
  ohneBeleg: number;
  /** Mit ⚠ markierte, im Material nicht belegte Stellen. */
  luecken: number;
}

export interface SkriptPruefung {
  abschnitte: AbschnittPruefung[];
  /** Kein Quellenverzeichnis im Kopf: Alle Belege zeigen ins Leere. */
  ohneVerzeichnis: boolean;
  ohneSeite: number;
  ohneQuelle: string[];
  ohneBeleg: number;
  luecken: number;
  /** Quellen im Verzeichnis, auf die kein Beleg verweist (Hinweis, kein Fehler). */
  unbenutzt: string[];
}

export function pruefeAbschnitt(a: Abschnitt, bekannte: Set<string>): AbschnittPruefung {
  const alle = findeBelege(a.markdown).concat(a.kopfBelege ?? []);
  const ohneQuelle = [...new Set(alle.filter((b) => !bekannte.has(b.kuerzel)).map((b) => b.kuerzel))];
  const ohneSeite = [...new Set(alle.filter((b) => bekannte.has(b.kuerzel) && !b.stelle).map(belegText))];
  const ohneBeleg = istQuellenAbschnitt(a) ? 0 : punkte(a.markdown, bekannte, a.kopfBelege ?? []).filter((p) => !p.belege.length).length;
  return { id: a.id, ...(a.nummer ? { nummer: a.nummer } : {}), titel: a.titel, ohneSeite, ohneQuelle, ohneBeleg, luecken: a.luecken };
}

export function pruefeSkript(s: Skript): SkriptPruefung {
  const bekannte = new Set(s.quellen.map((q) => q.kuerzel));
  const abschnitte = s.abschnitte.map((a) => pruefeAbschnitt(a, bekannte));
  const benutzt = new Set(s.abschnitte.flatMap((a) => [...findeBelege(a.markdown), ...(a.kopfBelege ?? [])].map((b) => b.kuerzel)));
  for (const b of findeBelege(s.einleitung)) benutzt.add(b.kuerzel);
  return {
    abschnitte,
    ohneVerzeichnis: !s.quellen.length,
    ohneSeite: abschnitte.reduce((n, a) => n + a.ohneSeite.length, 0),
    ohneQuelle: [...new Set(abschnitte.flatMap((a) => a.ohneQuelle))],
    ohneBeleg: abschnitte.reduce((n, a) => n + a.ohneBeleg, 0),
    luecken: abschnitte.reduce((n, a) => n + a.luecken, 0),
    unbenutzt: s.quellen.map((q) => q.kuerzel).filter((k) => !benutzt.has(k)),
  };
}

/** Zusammenfassung in Worten; leer, wenn alles in Ordnung ist. */
export function pruefungText(p: SkriptPruefung): string[] {
  const z = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;
  const out: string[] = [];
  if (p.ohneVerzeichnis) out.push('Quelle fehlt: Das Skript hat kein Quellenverzeichnis.');
  if (p.ohneQuelle.length) out.push(`Quelle fehlt: ${p.ohneQuelle.map((k) => `[${k}]`).join(', ')} ${p.ohneQuelle.length === 1 ? 'steht' : 'stehen'} nicht im Quellenverzeichnis.`);
  if (p.ohneSeite) out.push(`Seite fehlt: ${z(p.ohneSeite, 'Beleg nennt', 'Belege nennen')} die Quelle, aber keine Seite.`);
  if (p.ohneBeleg) out.push(`Ohne Beleg: ${z(p.ohneBeleg, 'Punkt', 'Punkte')} ohne Quellenangabe.`);
  if (p.luecken) out.push(`${z(p.luecken, 'Stelle', 'Stellen')} mit ⚠: im Material nicht belegt.`);
  return out;
}

// ---------------------------------------------------------------- Stabile Abschnitte und Fassungen

export { fassungVon, findeAbschnitt, MAX_FASSUNGEN, neueFassung, type Fundstelle } from './fassung';
