// Geführte Befundung eines Röntgen-Thorax nach festem Schema (Technik, A–E, Gesamtbild).
// Jeder Schritt betont einen Bildbereich und stellt eine Frage; die Antworten hängen von der
// Phantom-Variante ab. Fachlich vereinfacht und ungeprüft, nur zum Üben der Systematik.

import type { RoentgenVariante } from './phantom';
import type { Hervorhebung } from './BildBetrachter';

export interface Option { text: string; richtig: boolean; warum: string }
interface Basis { id: string; buchstabe: string; titel: string; merksatz: string; bereich: Hervorhebung }
export type BefundSchritt =
  | (Basis & { art: 'auswahl'; frage: string; optionen: Option[] })
  /** Herz-Thorax-Quotient messen, danach einordnen. */
  | (Basis & { art: 'htq'; frage: string; soll: number; optionen: Option[] });

const GANZ: Hervorhebung = { x: 0.01, y: 0.01, w: 0.98, h: 0.98 };

/** Herz-Thorax-Quotient der Phantome (Herzbreite / innere Thoraxbreite, siehe roentgenThorax). */
export const HTQ: Record<RoentgenVariante, number> = { normal: 0.35, pneumonie: 0.35, pneumothorax: 0.35, stauung: 0.55 };

const o = (text: string, richtig: boolean, warum: string): Option => ({ text, richtig, warum });

export function befundSchritte(v: RoentgenVariante): BefundSchritt[] {
  const vergroessert = HTQ[v] > 0.5;
  return [
    {
      id: 'technik', buchstabe: '0', titel: 'Technik', art: 'auswahl', bereich: GANZ,
      merksatz: 'Vor dem Befund prüfen: Wer, wann, welche Projektion, ist das Bild gerade und tief eingeatmet?',
      frage: 'Ist die Aufnahme gut beurteilbar?',
      optionen: [
        o('Ja: Schlüsselbeine stehen symmetrisch zur Wirbelsäule, beide Lungen sind vollständig abgebildet', true, 'Symmetrische Schlüsselbeinenden zeigen, dass niemand verdreht stand. Etwa 9 bis 10 hintere Rippen über dem Zwerchfell sprechen für gute Einatmung.'),
        o('Nein, der Patient ist stark verdreht', false, 'Die Schlüsselbeinenden liegen gleich weit von den Dornfortsätzen entfernt: keine relevante Rotation.'),
        o('Nein, die Lungenspitzen sind abgeschnitten', false, 'Die Lungenspitzen über den Schlüsselbeinen sind mit abgebildet.'),
      ],
    },
    {
      id: 'atemweg', buchstabe: 'A', titel: 'Atemweg', art: 'auswahl', bereich: { x: 0.4, y: 0.02, w: 0.2, h: 0.36 },
      merksatz: 'A wie Airway: Luftröhre als dunkles Band in der Mitte. Verlagert? Eingeengt?',
      frage: 'Wo verläuft die Luftröhre?',
      optionen: [
        o('Mittig über der Wirbelsäule', true, v === 'pneumothorax' ? 'Mittig: kein Hinweis auf einen Spannungspneumothorax, der das Mediastinum zur Gegenseite drücken würde.' : 'Mittig, nicht eingeengt. Verlagerungen entstehen z. B. durch Spannungspneumothorax (weg) oder Atelektase (hin).'),
        o('Nach rechts verlagert', false, 'Die Luftröhre liegt über den Dornfortsätzen.'),
        o('Nach links verlagert', false, 'Die Luftröhre liegt über den Dornfortsätzen.'),
      ],
    },
    {
      id: 'lunge', buchstabe: 'B', titel: 'Lungenfelder', art: 'auswahl', bereich: { x: 0.06, y: 0.08, w: 0.88, h: 0.62 },
      merksatz: 'B wie Breathing: Felder oben, Mitte, unten rechts und links vergleichen. Wo ist es heller (dichter) als auf der Gegenseite?',
      frage: 'Wo siehst du eine Verschattung?',
      optionen: [
        o('Keine umschriebene Verschattung', v === 'normal' || v === 'pneumothorax', v === 'pneumothorax' ? 'Richtig, eine Seite wirkt sogar dunkler: dort fehlt Lunge (siehe nächster Schritt).' : 'Beide Seiten sind gleich hell, die Gefäße werden nach außen feiner.'),
        o('Rechtes Mittel- und Unterfeld (im Bild links)', v === 'pneumonie', 'Eine fleckig-flächige Verdichtung im rechten Unterfeld passt zu einem Infiltrat bei Pneumonie. Rechts ist im Bild links!'),
        o('Beidseits um die Lungenwurzeln, zentral betont', v === 'stauung', 'Unscharfe, nach außen abnehmende Zeichnung um die Hili und feine waagrechte Linien außen (Kerley-Linien) sprechen für Lungenstauung.'),
        o('Linkes Oberfeld (im Bild rechts)', false, 'Dort ist keine Verdichtung. Rechts und links im Bild sind gegenüber dem Patienten vertauscht.'),
      ],
    },
    {
      id: 'pleura', buchstabe: 'B', titel: 'Pleura', art: 'auswahl', bereich: { x: 0.04, y: 0.06, w: 0.92, h: 0.56 },
      merksatz: 'Am Rand der Lunge suchen: feine Linie, außerhalb davon keine Gefäße? Dann liegt Luft im Pleuraspalt.',
      frage: 'Siehst du eine Pleuralinie mit gefäßfreiem Raum außen?',
      optionen: [
        o('Nein, die Gefäße reichen bis an die Brustwand', v !== 'pneumothorax', v === 'pneumothorax' ? 'Schau rechts im Bild (links beim Patienten) oben und außen genauer hin, am besten mit „Kontrast“ und Lupe.' : 'Die Lungenzeichnung reicht beidseits bis an die Rippen.'),
        o('Ja, links (im Bild rechts) oben und außen', v === 'pneumothorax', 'Eine feine Pleuralinie mit schwarzem, gefäßfreiem Raum außen: Pneumothorax links. Größe und Klinik bestimmen das Vorgehen.'),
        o('Ja, rechts (im Bild links)', false, 'Rechts reicht die Gefäßzeichnung bis an die Brustwand.'),
      ],
    },
    {
      id: 'herz', buchstabe: 'C', titel: 'Herz', art: 'htq', bereich: { x: 0.04, y: 0.4, w: 0.92, h: 0.34 }, soll: HTQ[v],
      merksatz: 'C wie Circulation: Herz-Thorax-Quotient = größte Herzbreite ÷ größte innere Thoraxbreite. Über 0,5 (im Stehen p.a.) gilt als vergrößert.',
      frage: 'Ziehe mit „Strecke“ zwei waagrechte Linien: über die breiteste Stelle des Herzschattens und von Rippeninnenrand zu Rippeninnenrand knapp über dem Zwerchfell. Ist das Herz vergrößert?',
      optionen: [
        o('Nein, Quotient unter 0,5', !vergroessert, vergroessert ? 'Der Herzschatten nimmt mehr als die Hälfte des Thorax ein.' : 'Das Herz ist normal groß.'),
        o('Ja, Quotient über 0,5', vergroessert, vergroessert ? 'Vergrößerter Herzschatten, zusammen mit Stauungszeichen typisch für eine Herzinsuffizienz. Im Liegen (a.p.) wirkt das Herz aber immer etwas größer.' : 'Der Quotient liegt deutlich unter 0,5.'),
      ],
    },
    {
      id: 'zwerchfell', buchstabe: 'D', titel: 'Zwerchfell und Randwinkel', art: 'auswahl', bereich: { x: 0.04, y: 0.6, w: 0.92, h: 0.3 },
      merksatz: 'D wie Diaphragm: Zwerchfellkuppeln scharf? Winkel zwischen Rippen und Zwerchfell spitz und schwarz?',
      frage: 'Wie sehen die seitlichen Randwinkel aus?',
      optionen: [
        o('Spitz und frei auf beiden Seiten', v !== 'stauung', v === 'stauung' ? 'Schau unten außen: die Winkel sind ausgefüllt.' : 'Freie, spitze Winkel: kein größerer Erguss.'),
        o('Beidseits verstrichen mit nach außen ansteigendem Rand', v === 'stauung', 'Verstrichene Winkel mit Meniskus sprechen für Pleuraergüsse, bei Herzinsuffizienz oft beidseits.'),
        o('Nur links verstrichen', false, 'Vergleiche beide Seiten.'),
      ],
    },
    {
      id: 'rest', buchstabe: 'E', titel: 'Alles andere', art: 'auswahl', bereich: { x: 0.04, y: 0.04, w: 0.92, h: 0.92 },
      merksatz: 'E wie Everything else: Knochen (Rippen, Schlüsselbeine), Weichteile, Fremdmaterial wie Katheter, Sonden, Drainagen, Elektroden.',
      frage: 'Was fällt an Knochen und Fremdmaterial auf?',
      optionen: [
        o('Keine Fraktur, kein Fremdmaterial', true, 'Im echten Bild prüfst du hier auch die Lage von ZVK-Spitze, Magensonde, Tubus und Drainagen.'),
        o('Rippenfraktur rechts', false, 'Die Rippenkonturen sind durchgehend.'),
        o('Zentraler Venenkatheter rechts', false, 'Es ist kein Fremdmaterial abgebildet.'),
      ],
    },
    {
      id: 'gesamt', buchstabe: '✓', titel: 'Gesamtbild', art: 'auswahl', bereich: GANZ,
      merksatz: 'Zum Schluss: Befunde zusammenfassen und mit der Klinik abgleichen.',
      frage: 'Welche Einordnung passt am besten?',
      optionen: [
        o('Unauffälliger Röntgen-Thorax', v === 'normal', 'Systematisch alles angesehen und nichts gefunden ist auch ein Ergebnis.'),
        o('Pneumonie im rechten Unterfeld', v === 'pneumonie', 'Umschriebene Verschattung rechts, sonst unauffällig.'),
        o('Pneumothorax links', v === 'pneumothorax', 'Pleuralinie links, außen keine Gefäße, Mediastinum mittig.'),
        o('Kardiale Stauung mit Ergüssen', v === 'stauung', 'Großes Herz, zentrale Stauung, Kerley-Linien und beidseitige Ergüsse.'),
      ],
    },
  ];
}

/** Bewertung der eigenen HTQ-Messung. */
export function htqBewertung(gemessen: number | undefined, soll: number): 'fehlt' | 'gut' | 'ungenau' {
  if (gemessen === undefined) return 'fehlt';
  return Math.abs(gemessen - soll) <= 0.08 ? 'gut' : 'ungenau';
}
