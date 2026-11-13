// „Passt dazu“ unter jeder Übung: wohin es sinnvoll weitergeht, damit niemand in einer Sackgasse landet.
// Verwandte Übungen werden nicht von Hand gepflegt, sondern aus gemeinsamen Themen abgeleitet
// (uebungenFuer, dieselbe Quelle wie Themenseite und „Alle Übungen“). Dazu kommen feste nächste Schritte
// für Seiten ohne Themenbezug (Fehlerheft, Simulation, Examen …).

import type { CatalogModule } from '../../modules/catalog-types';
import { modules } from '../../modules/registry';
import { flatNav, NAV } from '../../ui/shell/nav';
import { leafTopics } from '../lernplan/store';
import { uebungenFuer, type TrainerId } from '../lernplan/trainer';
import { UEBUNG_INFO } from './katalog';

export interface Ziel { label: string; path: string; grund: string }
export interface PasstDazu { verwandt: Ziel[]; themen: Array<{ id: string; name: string }>; weiter: Ziel[] }

/** Übungen, die zu jedem Thema passen; als „verwandt“ zu allgemein. */
const UEBERALL = new Set<TrainerId>(['mindmap']);

const SCHRITT: Record<string, Ziel> = {
  fehler: { label: 'Fehlerheft', path: '/lernen/fehler', grund: 'Falsch Gelöstes gezielt wiederholen.' },
  karten: { label: 'Karteikarten', path: '/lernen/karten', grund: 'Täglich kurz wiederholen, damit es bleibt.' },
  simulation: { label: 'Prüfungssimulation', path: '/lernen/simulation', grund: 'Unter Prüfungsbedingungen testen.' },
  examen: { label: 'Examen', path: '/lernen/examen', grund: 'Termine, Checkliste und Schwächen im Blick.' },
  ce: { label: 'Curriculare Einheiten', path: '/lernen/ce', grund: 'Geführt durch eine CE lernen.' },
  praxis: { label: 'Praxissimulator', path: '/lernen/praxis', grund: 'Das Wissen in einer Schicht anwenden.' },
  notfall: { label: 'Notfall-Trainer', path: '/lernen/notfall', grund: 'Erkennen und in der richtigen Reihenfolge handeln.' },
  pflegeplanung: { label: 'Pflegeplanung', path: '/lernen/pflegeplanung', grund: 'Aus einem Fall eine Planung schreiben.' },
  fortschritt: { label: 'Fortschritt', path: '/lernen/fortschritt', grund: 'Sehen, was sich schon getan hat.' },
  sis: { label: 'SIS-Trainer', path: '/lernen/sis', grund: 'Informationen strukturiert sammeln.' },
  bericht: { label: 'Pflegebericht-Trainer', path: '/lernen/bericht', grund: 'Den Verlauf sachlich dokumentieren.' },
  uebergabe: { label: 'Übergabe-Trainer', path: '/lernen/uebergabe', grund: 'Mit SBAR an die nächste Schicht übergeben.' },
  assessment: { label: 'Assessments', path: '/lernen/assessment', grund: 'Risiken mit Skalen einschätzen.' },
  dnqp: { label: 'Expertenstandards (DNQP)', path: '/lernen/dnqp', grund: 'Die Standards Ebene für Ebene nachlesen.' },
  schnellsuche: { label: 'Standard-Schnellsucher', path: '/lernen/schnellsuche', grund: 'Kriterien eines Standards schnell finden.' },
  hoeren: { label: 'Hör-Trainer', path: '/lernen/hoeren', grund: 'Alarme, Herz und Lunge nach Gehör erkennen.' },
  diagnostik: { label: 'Labor und Bildgebung', path: '/lernen/diagnostik', grund: 'Befunde an Fällen lesen.' },
};

/** Feste nächste Schritte je Seite (zusätzlich zu den abgeleiteten). */
const WEITER: Record<string, string[]> = {
  fehler: ['karten', 'simulation'],
  simulation: ['fehler', 'examen'],
  examen: ['simulation', 'ce'],
  hoeren: ['notfall', 'praxis'],
  klasse: ['pflegeplanung', 'praxis'],
  praxis: ['fehler', 'pflegeplanung'],
  fall: ['pflegeplanung', 'praxis'],
  // Der Pflegeprozess als Kette: einschätzen, planen, durchführen, berichten, übergeben
  assessment: ['pflegeplanung', 'sis'],
  sis: ['pflegeplanung', 'bericht'],
  pflegeplanung: ['sis', 'bericht'],
  bericht: ['uebergabe', 'pflegeplanung'],
  uebergabe: ['bericht', 'notfall'],
  expertenstandards: ['dnqp', 'schnellsuche'],
  notfall: ['hoeren', 'praxis'],
  labor: ['diagnostik'],
  normwerte: ['diagnostik'],
};

/** Übungsseiten (Menü-IDs unter „Üben“), auf denen die Leiste erscheint. */
export function uebungsSeiten(): Map<string, string> {
  const ueben = NAV.find((i) => i.id === 'ueben')?.children ?? [];
  return new Map(flatNav(ueben).filter((i) => i.id !== 'ueben-alle').map((i) => [i.path!, i.id]));
}

export function passtDazu(id: string, modul: CatalogModule = modules[0] as CatalogModule): PasstDazu {
  const seiten = new Map([...uebungsSeiten()].map(([p, i]) => [i, p]));
  const label = new Map(flatNav(NAV).map((n) => [n.id, n.label]));
  const namen = new Map(modul.topics.map((t) => [t.id, t.name]));

  // Wie breit jede Übung ist: Eine Übung, die fast alles abdeckt (Duell, Fallsimulator), sagt über Verwandtschaft wenig.
  const blaetter = leafTopics(modul.topics);
  const je = new Map(blaetter.map((t) => [t.id, uebungenFuer(t.id, modul)]));
  const breite = new Map<TrainerId, number>();
  for (const u of je.values()) for (const t of new Set(u.map((x) => x.trainer))) breite.set(t, (breite.get(t) ?? 0) + 1);

  // Themen dieser Übung und je Thema die übrigen Übungen (mit Sprungziel aufs Thema)
  const eigene: Array<{ id: string; andere: number }> = [];
  const geteilt = new Map<TrainerId, { anzahl: number; path: string; thema: string }>();
  for (const t of blaetter) {
    const u = je.get(t.id)!;
    if (!u.some((x) => x.trainer === id)) continue;
    const andere = u.filter((x) => x.trainer !== id && !UEBERALL.has(x.trainer));
    eigene.push({ id: t.id, andere: new Set(andere.map((x) => x.trainer)).size });
    for (const x of andere) {
      const g = geteilt.get(x.trainer);
      if (g) g.anzahl++;
      else geteilt.set(x.trainer, { anzahl: 1, path: x.path, thema: t.name });
    }
  }
  // Gemeinsame Themen im Verhältnis zur Breite: 2 von 3 Themen passt besser als 30 von 80.
  const wert = (t: TrainerId, n: number) => n / Math.sqrt(breite.get(t) ?? 1);
  const verwandt = [...geteilt]
    .filter(([t]) => seiten.has(t))
    .sort((a, b) => wert(b[0], b[1].anzahl) - wert(a[0], a[1].anzahl) || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([t, g]): Ziel => ({
      label: label.get(t) ?? t,
      // Bei nur einem gemeinsamen Thema direkt dorthin, sonst auf die Startseite der Übung
      path: g.anzahl === 1 ? g.path : seiten.get(t)!,
      grund: g.anzahl === 1 ? `Auch zu „${g.thema}“.` : `${g.anzahl} gemeinsame Themen, z. B. „${g.thema}“.`,
    }));

  const themen = eigene
    .sort((a, b) => b.andere - a.andere || a.id.localeCompare(b.id))
    .slice(0, 4)
    .map((t) => ({ id: t.id, name: namen.get(t.id) ?? t.id }));

  const fest = [...(WEITER[id] ?? []), ...(UEBUNG_INFO[id]?.fehlerheft && id !== 'fehler' ? ['fehler'] : []), 'karten'];
  // Höchstens fünf Ziele: feste Schritte füllen auf, mindestens zwei
  const platz = Math.max(2, 5 - verwandt.length);
  const schon = new Set([seiten.get(id), ...verwandt.map((v) => v.path.split('?')[0])]);
  const weiter: Ziel[] = [];
  for (const k of fest) {
    const z = SCHRITT[k];
    if (!z || schon.has(z.path) || weiter.length >= platz) continue;
    schon.add(z.path); weiter.push(z);
  }
  return { verwandt, themen, weiter };
}
