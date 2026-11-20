// „Passt dazu“ unter jeder Übung: wohin es sinnvoll weitergeht, damit niemand in einer Sackgasse landet.
// Verwandte Übungen werden nicht von Hand gepflegt, sondern aus gemeinsamen Themen abgeleitet
// (uebungenFuer, dieselbe Quelle wie Themenseite und „Alle Übungen“). Dazu kommen feste nächste Schritte
// für Seiten ohne Themenbezug (Fehlerheft, Simulation, Examen …).

import type { CatalogModule } from '../../modules/catalog-types';
import { modules } from '../../modules/registry';
import { flatNav, LERNSEITEN, NAV, UEBUNGS_BUENDEL, UNTERSEITEN } from '../../ui/shell/nav';
import { leafTopics } from '../lernplan/store';
import { uebungenFuer, type TrainerId } from '../lernplan/trainer';
import { UEBUNG_INFO } from './katalog';
import { wissenPfad } from '../wissen/pfad';
import { fertigPfad } from '../fertigkeiten/pfad';
import { dokuPfad } from '../dokumentation/pfad';
import { menueSeiteVon as seiteVon, teilVon } from './menue';

export interface Ziel { label: string; path: string; grund: string }
export interface PasstDazu { verwandt: Ziel[]; themen: Array<{ id: string; name: string }>; weiter: Ziel[] }

/** Übungen, die zu jedem Thema passen; als „verwandt“ zu allgemein. */
const UEBERALL = new Set<TrainerId>(['mindmap']);

export const SCHRITT: Record<string, Ziel> = {
  fehler: { label: 'Fehlerheft', path: '/lernen/fehler', grund: 'Falsch Gelöstes gezielt wiederholen.' },
  karten: { label: 'Karteikarten', path: '/lernen/karten', grund: 'Täglich kurz wiederholen, damit es bleibt.' },
  simulation: { label: 'Prüfungssimulation', path: '/lernen/simulation', grund: 'Unter Prüfungsbedingungen testen.' },
  examen: { label: 'Examen', path: '/lernen/examen', grund: 'Termine, Checkliste und Schwächen im Blick.' },
  ce: { label: 'Curriculare Einheiten', path: '/lernen/ce', grund: 'Geführt durch eine CE lernen.' },
  praxis: { label: 'Praxissimulator', path: '/lernen/praxis', grund: 'Das Wissen in einer Schicht anwenden.' },
  notfall: { label: 'Wissenstrainer: Notfall', path: '/lernen/wissen?fach=notfall', grund: 'Erkennen und in der richtigen Reihenfolge handeln.' },
  pflegeplanung: { label: 'Pflegeplanung', path: '/lernen/dokumentation?teil=pflegeplanung', grund: 'Aus einem Fall eine Planung schreiben.' },
  fortschritt: { label: 'Fortschritt', path: '/lernen/fortschritt', grund: 'Sehen, was sich schon getan hat.' },
  sis: { label: 'SIS-Trainer', path: '/lernen/dokumentation?teil=sis', grund: 'Informationen strukturiert sammeln.' },
  bericht: { label: 'Pflegebericht-Trainer', path: '/lernen/dokumentation?teil=bericht', grund: 'Den Verlauf sachlich dokumentieren.' },
  uebergabe: { label: 'Übergabe-Trainer', path: '/lernen/dokumentation?teil=uebergabe', grund: 'Mit SBAR an die nächste Schicht übergeben.' },
  assessment: { label: 'Assessments', path: '/lernen/dokumentation?teil=assessment', grund: 'Risiken mit Skalen einschätzen.' },
  dnqp: { label: 'Expertenstandards (DNQP)', path: '/lernen/dnqp', grund: 'Die Standards Ebene für Ebene nachlesen.' },
  schnellsuche: { label: 'Standard-Schnellsucher', path: '/lernen/schnellsuche', grund: 'Kriterien eines Standards schnell finden.' },
  hoeren: { label: 'Hör-Trainer', path: '/lernen/fertigkeiten?uebung=hoeren', grund: 'Alarme, Herz und Lunge nach Gehör erkennen.' },
  gespraech: { label: 'Gesprächssimulator', path: '/lernen/gespraech', grund: 'Schwierige Gespräche üben, mit Rückmeldung zu jeder Antwort.' },
  ablauf: { label: 'Ablauf-Werkbank', path: '/lernen/fertigkeiten?uebung=ablauf', grund: 'Handgriffe in der richtigen Reihenfolge, mit typischen Fehlern.' },
  hygiene: { label: 'Wissenstrainer: Hygiene', path: '/lernen/wissen?fach=hygiene', grund: 'Händehygiene, Schutzausrüstung und Asepsis sicher können.' },
  anatomie: { label: 'Wissenstrainer: Anatomie', path: '/lernen/wissen?fach=anatomie', grund: 'Organe, Lage und Funktion abfragen.' },
  normwerte: { label: 'Wissenstrainer: Normwerte', path: '/lernen/wissen?fach=normwerte', grund: 'Vitalwerte und Labor sicher einordnen.' },
  physiologie: { label: 'Physiologie-Modelle', path: '/lernen/physiologie', grund: 'An Reglern drehen und sehen, was im Körper passiert.' },
  einsatz: { label: 'Praxiseinsatz', path: '/lernen/einsatz', grund: 'Den nächsten Einsatz vorbereiten und im Praxistagebuch festhalten.' },
  expertenstandards: { label: 'Wissenstrainer: Expertenstandards', path: '/lernen/wissen?fach=expertenstandards', grund: 'Die Kernaussagen der Standards abfragen.' },
  diagnostik: { label: 'Labor und Bildgebung', path: '/lernen/diagnostik', grund: 'Befunde an Fällen lesen.' },
  fallakte: { label: 'Fallakte', path: '/lernen/dokumentation?teil=fallakte', grund: 'Einen Fall von der SIS bis zur Übergabe durcharbeiten.' },
  recht: { label: 'Wissenstrainer: Recht', path: '/lernen/wissen?fach=recht', grund: 'Haftung, Schweigepflicht und Betreuung anwenden.' },
  wissen: { label: 'Wissenstrainer', path: wissenPfad(), grund: 'Alle Fachgebiete, eigene Runde aus mehreren Themen, Schwachstellen.' },
  fertigkeiten: { label: 'Fertigkeiten-Trainer', path: fertigPfad(), grund: 'Reanimation, Handgriffe, Rechnen und Hören praktisch üben.' },
  dokumentation: { label: 'Dokumentations-Trainer', path: dokuPfad(), grund: 'Den Pflegeprozess von der SIS bis zur Übergabe dokumentieren.' },
  duell: { label: 'Fachbegriff-Duell', path: '/lernen/duell', grund: 'Fachbegriffe schnell und sicher abrufen.' },
  krankheitsbilder: { label: 'Krankheitsbilder', path: '/lernen/krankheitsbilder', grund: 'Steckbriefe mit Belegen und Fallaufgaben.' },
  ueben: { label: 'Alle Übungen', path: '/lernen/ueben', grund: 'Passende Übung nach CE, Fach oder Dauer finden.' },
  plan: { label: 'Lernplan', path: '/lernen/plan', grund: 'Den Stoff bis zur Prüfung verteilen.' },
  skript: { label: 'Skript', path: '/lernen/skript', grund: 'Den Stoff in Ruhe nachlesen.' },
  themen: { label: 'Themen', path: '/lernen/themen', grund: 'Alle Themen mit Arbeitsstand auf einen Blick.' },
  landkarte: { label: 'Themen-Landkarte', path: '/lernen/landkarte', grund: 'Sehen, wie die Themen zusammenhängen.' },
  board: { label: 'Mein Themenboard', path: '/lernen/board', grund: 'Themen für diese Woche einplanen.' },
  import: { label: 'Import-Assistent', path: '/material/import', grund: 'Eigenes Skript als PDF, Foto oder Text holen.' },
  dokumente: { label: 'Dokumente', path: '/material/dokumente', grund: 'Dein Material mit Fundstellen durchsuchen.' },
  zusammenfassen: { label: 'Zusammenfassen', path: '/material/zusammenfassen', grund: 'Aus deinem Material eine belegte Zusammenfassung machen.' },
};

/** Feste nächste Schritte je Seite (zusätzlich zu den abgeleiteten). */
export const WEITER: Record<string, string[]> = {
  fehler: ['karten', 'simulation'],
  simulation: ['fehler', 'examen'],
  examen: ['simulation', 'ce'],
  fertigkeiten: ['praxis', 'wissen'],
  gespraech: ['uebergabe', 'praxis'],
  klasse: ['pflegeplanung', 'praxis'],
  praxis: ['fehler', 'pflegeplanung'],
  fall: ['pflegeplanung', 'praxis'],
  // Pflegeprozess: Die Schritte stehen im Dokumentations-Trainer nebeneinander, die Fallakte führt durch alle.
  dokumentation: ['praxis', 'fehler', 'simulation'],
  wissen: ['fehler', 'duell', 'karten'],
  // Lern- und Materialseiten ohne eigene Aufgaben: vom Lesen zum Üben und zurück
  karten: ['fehler', 'ueben', 'fortschritt'],
  skript: ['karten', 'krankheitsbilder', 'ueben'],
  dnqp: ['expertenstandards', 'schnellsuche', 'pflegeplanung'],
  schnellsuche: ['dnqp', 'expertenstandards', 'assessment'],
  ce: ['plan', 'ueben', 'examen'],
  themen: ['board', 'landkarte', 'plan'],
  landkarte: ['themen', 'ce', 'ueben'],
  board: ['plan', 'ueben', 'fortschritt'],
  fortschritt: ['fehler', 'plan', 'examen'],
  dokumente: ['zusammenfassen', 'skript', 'karten'],
  physiologie: ['anatomie', 'normwerte', 'krankheitsbilder'],
  mindmap: ['karten', 'wissen'],
  einsatz: ['plan', 'fertigkeiten', 'karten'],
  zusammenfassen: ['karten', 'skript', 'dokumente'],
};

/** Übungsseiten (Menü-IDs unter „Üben“), auf denen die Leiste erscheint. */
export function uebungsSeiten(): Map<string, string> {
  return new Map(flatNav(UEBUNGS_BUENDEL).map((i) => [i.path!, i.id]));
}

export function passtDazu(id: string, modul: CatalogModule = modules[0] as CatalogModule): PasstDazu {
  const seiten = new Map([...uebungsSeiten()].map(([p, i]) => [i, p]));
  const label = new Map([...flatNav(NAV), ...UNTERSEITEN].map((n) => [n.id, n.label]));
  const namen = new Map(modul.topics.map((t) => [t.id, t.name]));

  // Wie breit jede Übung ist: Eine Übung, die fast alles abdeckt (Duell, Fallsimulator), sagt über Verwandtschaft wenig.
  const blaetter = leafTopics(modul.topics);
  const je = new Map(blaetter.map((t) => [t.id, uebungenFuer(t.id, modul)]));
  const breite = new Map<string, number>();
  for (const u of je.values()) for (const t of new Set(u.map((x) => seiteVon(x.trainer)))) breite.set(t, (breite.get(t) ?? 0) + 1);

  // Themen dieser Übung und je Thema die übrigen Übungen (mit Sprungziel aufs Thema)
  const eigene: Array<{ id: string; andere: number }> = [];
  const geteilt = new Map<string, { anzahl: number; path: string; thema: string; fach?: string }>();
  for (const t of blaetter) {
    const u = je.get(t.id)!;
    if (!u.some((x) => seiteVon(x.trainer) === id)) continue;
    const andere = u.filter((x) => seiteVon(x.trainer) !== id && !UEBERALL.has(x.trainer));
    eigene.push({ id: t.id, andere: new Set(andere.map((x) => seiteVon(x.trainer))).size });
    for (const x of andere) {
      const k = seiteVon(x.trainer);
      const g = geteilt.get(k);
      if (g) { if (g.fach !== x.trainer) g.fach = undefined; g.anzahl++; }
      else geteilt.set(k, { anzahl: 1, path: x.path, thema: t.name, ...(teilVon(x.trainer) ? { fach: x.trainer } : {}) });
    }
  }
  // Gemeinsame Themen im Verhältnis zur Breite: 2 von 3 Themen passt besser als 30 von 80.
  const wert = (t: string, n: number) => n / Math.sqrt(breite.get(t) ?? 1);
  const verwandt = [...geteilt]
    .filter(([t]) => seiten.has(t))
    .sort((a, b) => wert(b[0], b[1].anzahl) - wert(a[0], a[1].anzahl) || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([t, g]): Ziel => ({
      label: g.fach && teilVon(g.fach) ? `${label.get(t) ?? t}: ${teilVon(g.fach)!.name}` : label.get(t) ?? t,
      // Bei nur einem gemeinsamen Thema direkt dorthin, auf Sammelseiten in den Teil (Fachgebiet, Fertigkeit), sonst auf die Startseite der Übung
      path: g.anzahl === 1 ? g.path : g.fach && teilVon(g.fach) ? teilVon(g.fach)!.path : seiten.get(t)!,
      grund: g.anzahl === 1 ? `Auch zu „${g.thema}“.` : `${g.anzahl} gemeinsame Themen, z. B. „${g.thema}“.`,
    }));

  const themen = eigene
    .sort((a, b) => b.andere - a.andere || a.id.localeCompare(b.id))
    .slice(0, 4)
    .map((t) => ({ id: t.id, name: namen.get(t.id) ?? t.id }));

  const fest = [...(WEITER[id] ?? []), ...(UEBUNG_INFO[id]?.fehlerheft && id !== 'fehler' ? ['fehler'] : []), 'karten', 'ueben'];
  // Höchstens fünf Ziele: feste Schritte füllen auf, mindestens zwei
  const platz = Math.max(LERNSEITEN.has(id) ? 3 : 2, 5 - verwandt.length);
  const schon = new Set([seiten.get(id), SCHRITT[id]?.path, ...verwandt.map((v) => v.path.split('?')[0])]);
  const weiter: Ziel[] = [];
  for (const k of fest) {
    const z = SCHRITT[k];
    if (!z || schon.has(z.path) || weiter.length >= platz) continue;
    schon.add(z.path); weiter.push(z);
  }
  return { verwandt, themen, weiter };
}
