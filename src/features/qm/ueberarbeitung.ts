// Überarbeitungsliste: alles, was an Inhalten nachgesehen werden sollte, an einem Ort und nach
// Dringlichkeit sortiert. Quellen: Meldungen der Lernenden, auffällige Statistik, Quellen mit neuerer
// Fassung, seit der Prüfung geänderte Aufgaben, formale Prüfregeln und veraltete KI-Fragensätze.
// Rein: Die Seite reicht die Daten herein.

import type { Aufgabe } from '../quiz/quiz';
import { fingerabdruck } from './fingerabdruck';
import { GRUND_LABEL, istOffen, seitherGeaendert, ZAEHLT_NICHT, type Meldung } from './meldungen';
import { analysiere, AUFFAELLIG_LABEL, type Statistik } from './statistik';
import { veralteteQuellen } from './aktualitaet';
import { pruefeAufgabe, REGELN } from './pruefregeln';
import { trainerStand, type LokalerVermerk, type Pruefstand, PRUEFSTAND } from './pruefstand';
import type { TrainerEintrag } from './register';
import type { VeralteterSatz } from './ki';
import type { Freigabe } from '../../ui/sim/freigabe';

export type Prio = 1 | 2 | 3;
export const PRIO_LABEL: Record<Prio, string> = { 1: 'Zuerst', 2: 'Bald', 3: 'Bei Gelegenheit' };

export type Art = 'meldung' | 'statistik' | 'quelle' | 'geaendert' | 'form' | 'ki';
export const ART_LABEL: Record<Art, string> = {
  meldung: 'Gemeldet', statistik: 'Statistik', quelle: 'Quelle veraltet', geaendert: 'Geändert seit Prüfung', form: 'Formale Prüfung', ki: 'KI-Fragen',
};

export interface Eintrag {
  key: string;
  prio: Prio;
  art: Art;
  titel: string;
  detail: string;
  /** Was zu tun ist. */
  tun?: string;
  quelle?: string;
  aufgabeId?: string;
  pfad?: string;
  meldung?: Meldung;
}

export interface Pool { quelle: string; name: string; pfad: string; aufgaben: readonly Aufgabe[] }

export interface Eingaben {
  pools: readonly Pool[];
  register: readonly TrainerEintrag[];
  meldungen: readonly Meldung[];
  statistik: Statistik;
  vermerke?: LokalerVermerk[];
  pruefstand?: Pruefstand;
  /** Weitere Inhalte mit Freigabe (z. B. Notfall-Profile), für die Aktualitätsprüfung der Quellen. */
  weitereFreigaben?: Array<{ name: string; pfad: string; freigabe: Freigabe }>;
  veralteteKi?: VeralteterSatz[];
  heute: string;
}

const kurz = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function ueberarbeitungsliste(e: Eingaben): Eintrag[] {
  const out: Eintrag[] = [];
  const findeAufgabe = new Map<string, { a: Aufgabe; pool: Pool }>();
  for (const p of e.pools) for (const a of p.aufgaben) findeAufgabe.set(`${p.quelle}:${a.id}`, { a, pool: p });

  // 1. Meldungen
  for (const m of e.meldungen.filter(istOffen)) {
    const x = findeAufgabe.get(`${m.quelle}:${m.aufgabeId}`);
    const geaendert = x && seitherGeaendert(m, fingerabdruck(x.a));
    out.push({
      key: `meldung:${m.id}`, prio: ZAEHLT_NICHT.includes(m.grund) ? 1 : 2, art: 'meldung', meldung: m,
      titel: `${GRUND_LABEL[m.grund]}: ${m.titel}`,
      detail: [kurz(m.frage), m.notiz ? `Notiz: ${m.notiz}` : '', m.von ? `Von ${m.von}` : '', geaendert ? 'Die Aufgabe wurde seit der Meldung geändert – vielleicht schon behoben.' : ''].filter(Boolean).join(' · '),
      tun: geaendert ? 'Prüfen, ob die Änderung das Problem behebt, dann auf „Erledigt“ setzen.' : 'Frage mit der Quelle vergleichen; korrigieren oder mit Begründung ablehnen.',
      quelle: m.quelle, aufgabeId: m.aufgabeId, pfad: x?.pool.pfad,
    });
  }

  // 2. Statistik
  for (const [schluessel, w] of Object.entries(e.statistik)) {
    const x = findeAufgabe.get(schluessel);
    if (!x) continue;
    const an = analysiere(x.a, w);
    for (const b of an?.befunde ?? []) {
      if (b.art === 'sehr-leicht') continue;   // nur als Zahl auf der Seite, keine Aufgabe
      out.push({
        key: `stat:${schluessel}:${b.art}`, prio: b.art === 'ablenker-staerker' ? 1 : b.art === 'sehr-schwer' ? 2 : 3, art: 'statistik',
        titel: `${AUFFAELLIG_LABEL[b.art].titel}: ${x.a.titel}`, detail: `${kurz(x.a.frage)} · ${b.detail}`, tun: AUFFAELLIG_LABEL[b.art].tun,
        quelle: x.pool.quelle, aufgabeId: x.a.id, pfad: x.pool.pfad,
      });
    }
  }

  // 3. Quellen mit neuerer Fassung
  const mitFreigabe = [...e.register.map((r) => ({ name: `${r.name}-Trainer`, pfad: r.pfad, freigabe: r.freigabe })), ...(e.weitereFreigaben ?? [])];
  for (const f of mitFreigabe) {
    for (const v of veralteteQuellen(f.freigabe.quellen)) {
      out.push({
        key: `quelle:${f.name}:${v.quelle.titel}`, prio: f.freigabe.risiken.some((r) => r === 'notfall' || r === 'medikament') ? 1 : 2, art: 'quelle',
        titel: `${f.name}: „${v.quelle.titel}“ hat eine neuere Fassung (${v.neu.stand})`,
        detail: `Inhalt steht auf ${v.quelle.stand}, neue Fassung erschienen am ${v.neu.erschienen.split('-').reverse().join('.')}. ${v.neu.kern}`,
        tun: `Inhalte gegen die neue Fassung abgleichen (${v.neu.fundstelle}).`, pfad: f.pfad,
      });
    }
  }

  // 4. Geändert seit Prüfung (nur wo es eine Prüfung gab; sonst ist alles ohnehin ungeprüft)
  for (const p of e.pools) {
    const st = trainerStand(p.quelle, p.aufgaben, e.heute, e.pruefstand ?? PRUEFSTAND, e.vermerke ?? []);
    if (!st.pruefung) continue;
    for (const id of [...st.vergleich.geaendert, ...st.vergleich.neu]) {
      const x = findeAufgabe.get(`${p.quelle}:${id}`)!;
      out.push({
        key: `geaendert:${p.quelle}:${id}`, prio: 2, art: 'geaendert',
        titel: `${st.vergleich.neu.includes(id) ? 'Neu' : 'Geändert'} seit der Prüfung: ${x.a.titel}`, detail: kurz(x.a.frage),
        tun: 'Fachlich durchsehen, dann den Trainer erneut als geprüft vermerken.', quelle: p.quelle, aufgabeId: id, pfad: p.pfad,
      });
    }
  }

  // 5. Formale Prüfregeln: Fehler einzeln, Hinweise je Trainer und Regel gebündelt
  for (const p of e.pools) {
    const befunde = p.aufgaben.flatMap(pruefeAufgabe);
    for (const b of befunde.filter((x) => REGELN[x.regel].schwere === 'fehler')) {
      out.push({ key: `form:${p.quelle}:${b.aufgabeId}:${b.regel}`, prio: 2, art: 'form', titel: `${REGELN[b.regel].titel}: ${b.aufgabeId}`, detail: b.detail, tun: REGELN[b.regel].besser, quelle: p.quelle, aufgabeId: b.aufgabeId, pfad: p.pfad });
    }
    const jeRegel = new Map<string, typeof befunde>();
    for (const b of befunde.filter((x) => REGELN[x.regel].schwere === 'hinweis')) jeRegel.set(b.regel, [...(jeRegel.get(b.regel) ?? []), b]);
    for (const [regel, liste] of jeRegel) {
      const r = REGELN[regel as keyof typeof REGELN];
      out.push({
        key: `form:${p.quelle}:${regel}`, prio: 3, art: 'form', titel: `${p.name}: ${r.titel} (${liste.length}×)`,
        detail: liste.slice(0, 4).map((b) => `${b.aufgabeId}${b.stelle ? ` (${b.stelle})` : ''}: ${b.detail}`).join(' · ') + (liste.length > 4 ? ' · …' : ''),
        tun: `${r.warum} ${r.besser}`, quelle: p.quelle, pfad: p.pfad,
      });
    }
  }

  // 6. KI-Fragensätze auf altem Stand
  for (const s of e.veralteteKi ?? []) {
    out.push({
      key: `ki:${s.satzId}`, prio: 2, art: 'ki', titel: `KI-Fragensatz „${s.name}“ beruht auf einer alten Dokumentfassung`,
      detail: s.ersetzt.map((x) => `Neue Fassung: ${x.titel}`).join(' · '), tun: 'Fragensatz mit der neuen Fassung neu erzeugen oder die Fragen gegen sie prüfen.', pfad: '/material/zusammenfassen',
    });
  }

  return out.sort((x, y) => x.prio - y.prio || ART_RANG[x.art] - ART_RANG[y.art] || x.titel.localeCompare(y.titel, 'de'));
}

const ART_RANG: Record<Art, number> = { meldung: 0, statistik: 1, quelle: 2, geaendert: 3, ki: 4, form: 5 };
