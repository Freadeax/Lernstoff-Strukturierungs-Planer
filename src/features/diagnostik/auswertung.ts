// Adapter: Diagnostik-Fall (Labor, Bildgebung, SBAR) → gemeinsame Auswertung mit Begründung.
// Die Punkte selbst kommen aus lauf.ts/auswertung(); hier kommt das „Warum“ je Prüfbereich dazu.

import type { AuswertungsPunkt, ErgebnisStufe, SimAuswertung } from '../../ui/sim/auswertung';
import { auswertung, type Lauf } from './lauf';
import type { DiagnostikFall } from './typen';

const WARUM: [RegExp, string][] = [
  [/^Sinnvolle Laborwerte/, 'Gezielte Laborwerte beantworten die Frage hinter den Beschwerden. Fehlen wegweisende Werte, bleibt die Lage unklar und die ärztliche Entscheidung verzögert sich.'],
  [/^Präanalytik/, 'Die meisten Laborfehler entstehen vor dem Labor: falsche Person, zu lange Stauung, falsche Röhrchenreihenfolge oder langes Liegen verfälschen Werte und können zu falscher Behandlung führen.'],
  [/^Kritischer Wert/, 'Ein kritischer Wert kann akut lebensbedrohlich sein. Er wird sofort angenommen, mit Rücklesen quittiert und ohne Umweg ärztlich gemeldet und dokumentiert.'],
  [/^Vorbereitung/, 'Vor Bildgebung prüft die Pflege Einverständnis, Zugang, Nierenwert und Allergien bei Kontrastmittel sowie Nüchternheit nach Hausstandard. Unnötige Schritte kosten Zeit, vergessene gefährden die Person.'],
  [/^Befunde im Bild/, 'Pflegende befunden nicht, sollen aber auffällige Zeichen erkennen, um Dringlichkeit einzuschätzen und gezielt nachzufragen.'],
  [/^SBAR/, 'Eine strukturierte Meldung (Situation, Hintergrund, Einschätzung, Empfehlung) sorgt dafür, dass die Ärztin oder der Arzt schnell die richtigen Fakten hat und nichts Irreführendes ablenkt.'],
  [/^Reihenfolge/, 'Manche Schritte haben eine feste Reihenfolge, weil sonst Befunde verfälscht werden oder Gefahr entsteht.'],
  [/^Anordnungen/, 'Ärztliche Anordnungen werden zeitnah umgesetzt und dokumentiert. Erst dann wirkt die Behandlung, und der Verlauf kann beurteilt werden.'],
  [/^Lernfragen/, 'Die Lernfragen prüfen, ob du die Zusammenhänge hinter den Werten verstanden hast.'],
];

function warumFuer(titel: string): string {
  return WARUM.find(([r]) => r.test(titel))?.[1] ?? 'Dieser Punkt gehört zur sicheren Versorgung im Fall.';
}

export function diagnostikAuswertung(l: Lauf, fall: DiagnostikFall): SimAuswertung {
  const roh = auswertung(l, fall);
  const punkte: AuswertungsPunkt[] = roh.map((p, i) => ({
    id: `dx:${i}`,
    titel: p.titel,
    urteil: p.ok === true ? 'gut' : p.ok === false ? 'fehler' : 'teilweise',
    deine: p.text,
    warum: warumFuer(p.titel),
  }));
  const gefaehrlich = roh.some((p) => p.ok === false && (/^Kritischer Wert/.test(p.titel) || /^SBAR/.test(p.titel)));
  const luecken = roh.some((p) => p.ok !== true);
  const stufe: ErgebnisStufe = gefaehrlich ? 'kritisch' : luecken ? 'unsicher' : 'stabil';
  const text = stufe === 'kritisch'
    ? 'Ein kritischer Wert oder die ärztliche Meldung ist untergegangen. Das wäre in der Praxis gefährlich.'
    : stufe === 'unsicher' ? 'Die Lage war beherrscht, einzelne Schritte fehlten oder kamen spät.'
    : 'Labor, Bildgebung und Meldung waren vollständig und in sinnvoller Reihenfolge.';
  return {
    quelle: `Diagnostik: ${fall.titel}`,
    ergebnis: { stufe, text },
    punkte,
    merksaetze: [fall.aufloesung.kernaussage, ...fall.aufloesung.pflege].slice(0, 4),
    grenzen: 'Fiktiver Lernfall, didaktisch vereinfacht. Werte und Grenzwerte richten sich in der Praxis nach ärztlicher Anordnung und Hausstandard.',
  };
}
