// Kriterien-Training: Übungsaufgaben direkt aus den DNQP-Daten (src/features/dnqp), ohne eigenen Fachtext.
// Drei Aufgabentypen, alle als Auswahl für den gemeinsamen Übungskern (Fehlerheft und Lernplan inklusive):
// - zuordnen:  Zu welchem Standard gehört diese Aussage? (Standardnamen im Text verdeckt)
// - ebene:     Struktur, Prozess oder Ergebnis?
// - irrtum:    Was gilt nach der aktuellen Fassung, was ist ein verbreiteter Irrtum?

import type { Expertenstandard, Teil } from '../dnqp/typen';
import { EBENE_LABEL } from '../dnqp/typen';
import { mische, type AuswahlAufgabe } from '../quiz/quiz';

export type TrainingsTyp = 'zuordnen' | 'ebene' | 'irrtum';
export const TYP_LABEL: Record<TrainingsTyp, string> = { zuordnen: 'Welcher Standard?', ebene: 'Struktur, Prozess, Ergebnis?', irrtum: 'Richtig oder Irrtum?' };

const ES_THEMA = 'thema.qw.expertenstandards';
type Art = 'S' | 'P' | 'E';
const FELD: Record<Art, 'struktur' | 'prozess' | 'ergebnis'> = { S: 'struktur', P: 'prozess', E: 'ergebnis' };

interface Stelle { s: Expertenstandard; art: Art; ebene: number; thema: string; teil: Teil }

function stellen(standards: Expertenstandard[]): Stelle[] {
  return standards.flatMap((s) => s.kriterien.flatMap((k) => (['S', 'P', 'E'] as Art[])
    .flatMap((art) => k[FELD[art]].map((teil) => ({ s, art, ebene: k.ebene, thema: k.thema, teil })))));
}

/** Wortanfänge des Standardnamens (ab 5 Zeichen), die im Aufgabentext verdeckt werden. */
function verraeter(s: Expertenstandard): RegExp | undefined {
  const stuecke = [s.kurztitel, ...s.synonyme].flatMap((t) => t.split(/[^\p{L}]+/u))
    .filter((w) => w.length >= 5 && !/^(pflege|menschen|erhaltung|förderung|sicherung)/i.test(w))
    .map((w) => w.slice(0, 5).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return stuecke.length ? new RegExp(`\\b(${[...new Set(stuecke)].join('|')})\\p{L}*`, 'giu') : undefined;
}

export function verdecke(text: string, s: Expertenstandard): string {
  const re = verraeter(s);
  return re ? text.replace(re, '…') : text;
}

const themen = (s: Expertenstandard) => [ES_THEMA, ...s.themaIds];
const fundstelle = (x: Stelle) => `${x.s.kurztitel}, ${x.teil.id} (${EBENE_LABEL[x.art]}, Ebene ${x.ebene}: ${x.thema}).`;

const gleich = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Text → Standards, in denen er wörtlich gleich vorkommt (z. B. allgemeine Evaluationskriterien). */
function textStandards(alle: Expertenstandard[]): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const x of stellen(alle)) {
    const k = gleich(x.teil.text);
    out.set(k, (out.get(k) ?? new Set()).add(x.s.id));
  }
  return out;
}

function zuordnen(x: Stelle, alle: Expertenstandard[], zufall: () => number): AuswahlAufgabe {
  const andere = mische(alle.filter((s) => s.id !== x.s.id && s.kriterien.length), zufall).slice(0, 3);
  return {
    id: `sus.zuordnen.${x.s.id}.${x.teil.id}`, art: 'auswahl', topicIds: themen(x.s), titel: 'Welcher Standard?',
    frage: `Zu welchem Expertenstandard gehört dieses Kriterium? „${verdecke(x.teil.text, x.s)}“`,
    optionen: [x.s.kurztitel, ...andere.map((s) => s.kurztitel)], richtig: [0], mehrfach: false,
    erklaerung: [`Fundstelle: ${fundstelle(x)}`, `Vollständig: „${x.teil.text}“`],
  };
}

function ebene(x: Stelle): AuswahlAufgabe {
  const arten: Art[] = ['S', 'P', 'E'];
  return {
    id: `sus.ebene.${x.s.id}.${x.teil.id}`, art: 'auswahl', topicIds: themen(x.s), titel: 'Struktur, Prozess, Ergebnis',
    frage: `${x.s.kurztitel}: „${x.teil.text.replace(/^[SPE]\d+[a-z]?:\s*/, '')}“ Welche Art von Kriterium ist das?`,
    optionen: arten.map((a) => `${EBENE_LABEL[a]}kriterium`), richtig: [arten.indexOf(x.art)], mehrfach: false,
    erklaerung: [
      `Fundstelle: ${fundstelle(x)}`,
      'Struktur: was Einrichtung und Pflegefachkraft mitbringen (Wissen, Mittel, Regeln). Prozess: was die Pflegefachkraft tut. Ergebnis: was nachweisbar erreicht ist.',
    ],
  };
}

function irrtum(s: Expertenstandard, f: Expertenstandard['fehlvorstellungen'][number], alle: Expertenstandard[], zufall: () => number): AuswahlAufgabe {
  const fremd = mische(alle.filter((x) => x.id !== s.id).flatMap((x) => x.fehlvorstellungen.map((y) => y.falsch)), zufall).slice(0, 1);
  return {
    id: `sus.irrtum.${s.id}.${f.id}`, art: 'auswahl', topicIds: themen(s), titel: 'Richtig oder Irrtum?',
    // Keine Fassung im Fragetext: Der Beleg kann sich auf eine ältere Fassung beziehen (er steht in der Begründung).
    frage: `Welche Aussage stimmt laut Expertenstandard ${s.kurztitel}?`,
    optionen: [f.richtig, f.falsch, ...fremd], richtig: [0], mehrfach: false,
    erklaerung: [`Verbreiteter Irrtum: „${f.falsch}“`, `Beleg im Standard: ${f.beleg}.`, `Gelesen in: ${s.quelle.titel} (geprüft ${s.quelle.geprueftAm}).`],
  };
}

/** Alle möglichen Aufgaben für die Auswahl (Standards ohne Kriterien liefern nur Irrtümer). */
export function trainingsAufgaben(alle: Expertenstandard[], wahl: { standardId?: string; typen: TrainingsTyp[] }, zufall: () => number = Math.random): AuswahlAufgabe[] {
  const ziel = wahl.standardId ? alle.filter((s) => s.id === wahl.standardId) : alle;
  const st = stellen(ziel);
  return [
    // Nur Kriterien, die genau einem Standard gehören: gleichlautende Kriterien hätten mehrere richtige Antworten
    ...(wahl.typen.includes('zuordnen') ? (() => {
      const mehrfach = textStandards(alle);
      return st.filter((x) => mehrfach.get(gleich(x.teil.text))!.size === 1).map((x) => zuordnen(x, alle, zufall));
    })() : []),
    ...(wahl.typen.includes('ebene') ? st.map(ebene) : []),
    ...(wahl.typen.includes('irrtum') ? ziel.flatMap((s) => s.fehlvorstellungen.map((f) => irrtum(s, f, alle, zufall))) : []),
  ];
}
