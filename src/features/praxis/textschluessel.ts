// Wortstämme und Schlüsselwörter für die Mustersuche in Übergabe und Pflegebericht aus einem Praxisfall
// (früher Teil der alten weitergabe.ts, seit P10 eigenständig für arbeitsplatz/weitergabe.ts).
import { vereinfache } from '../uebergabe/pruefung';

const STOPP = new Set(['einschliesslich', 'erfragen', 'standard', 'anordnung', 'beurteilen', 'vorbereiten', 'einbeziehen', 'erneut', 'wuensche', 'befinden', 'zustand', 'wirkung', 'strukturierte', 'nach', 'sofort', 'damit', 'messen', 'geben', 'ueber', 'anfordern', 'hinzuziehen', 'qualifiziertes']);

/** Wortstamm für die Mustersuche: vereinfacht, lange Wörter ohne Endung („nachblutung“ → „nachblutu“). */
export function stamm(wort: string): string {
  const v = vereinfache(wort).replace(/[^a-z0-9-]/g, '');
  return v.length > 7 ? v.slice(0, v.length - 2) : v;
}

/** Die n aussagekräftigsten Wörter eines Textes als Stämme (lange Wörter zuerst, ohne Füllwörter). */
export function schluessel(text: string, n = 2): string[] {
  const woerter = text.split(/[^A-Za-zÄÖÜäöüß-]+/).map((w) => w.replace(/^-+|-+$/g, '')).filter((w) => w.length >= 5 && !STOPP.has(vereinfache(w)));
  const eindeutig = [...new Map(woerter.map((w) => [stamm(w), w])).keys()];
  return eindeutig.sort((a, b) => b.length - a.length).slice(0, n);
}
