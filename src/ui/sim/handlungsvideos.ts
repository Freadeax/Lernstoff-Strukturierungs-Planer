// Handlungsvideos aus dem Bildpaket (Philipp, 2026-11-11): gerenderte Vorschauen mit vier Phasen.
// Darstellung, keine Anleitung: Zeitachse ist keine klinische Haltezeit, Schrittfolge fachlich ungeprüft.
//
// Audit (Live-Fund 2): Medienstart, Fortschritt und Simulator-Handlung sind getrennt.
// - Ansehen (Video oder Schrittmodus) verändert nie einen Fall.
// - Nur der eigene Knopf „Handlung im Fall ausführen“ bucht eine Handlung (einmal).
// - Fallback: Video lädt nicht → Schrittmodus mit Phasenbildern; Bild lädt nicht → Schritttext allein.

import type { Freigabe } from './freigabe';

export type HandlungsVideoId = 'insulingabe' | 'kompressionsstrumpf';
export type Schritt = { titel: string; text: string };
export type HandlungsVideoInfo = { id: HandlungsVideoId; titel: string; schritte: [Schritt, Schritt, Schritt, Schritt]; hinweis: string; freigabe: Freigabe };

const ROLLE = 'Pflegefachperson mit Praxisanleitung';
const VERLAUF = [{ datum: '2026-11-11', text: 'Clip aus dem Bildpaket eingebunden' }, { datum: '2026-11-11', text: 'Schrittmodus, Prüfstatus und Ersatzansicht ergänzt' }];

export const HANDLUNGSVIDEOS: Record<HandlungsVideoId, HandlungsVideoInfo> = {
  insulingabe: {
    id: 'insulingabe', titel: 'Insulingabe mit Pen am Übungspad',
    schritte: [
      { titel: 'Annäherung', text: 'Pen nach geprüfter Anordnung vorbereitet: Präparat, Dosis und Funktionsprüfung nach Gebrauchsinformation. Haut ansehen, Einstichstelle wählen.' },
      { titel: 'Kontakt', text: 'Pen senkrecht aufsetzen. Ob eine Hautfalte nötig ist, hängt von Nadellänge und Körperbau ab.' },
      { titel: 'Auslösen', text: 'Dosisknopf vollständig drücken und die Haltezeit nach Herstellerangabe abwarten. Die Video-Zeitachse ist keine Haltezeit.' },
      { titel: 'Abheben', text: 'Nadel gerade herausziehen und sicher entsorgen. Gabe dokumentieren, Blutzucker und Essen im Blick behalten.' },
    ],
    hinweis: 'Die Bilder zeigen vier Phasen, keine lückenlose Handbewegung. Präparat, Dosis und Applikationsort kommen immer aus der geprüften Anordnung; Geräteanleitung des Pens beachten.',
    freigabe: {
      status: 'ungeprueft', zielgruppe: 'erwachsene', geltung: 'Erwachsene, ambulante und stationäre Pflege, Übung am Pad', prueferrolle: ROLLE,
      lernziele: ['Ablauf einer subkutanen Insulingabe mit Pen in vier Phasen benennen', 'Erkennen, welche Angaben aus Anordnung und Gebrauchsinformation kommen'],
      quellen: [{ titel: 'Gebrauchsinformation des eingesetzten Pens und Präparats', stand: 'je Produkt' }], aenderungen: VERLAUF,
      risiken: ['medikament'], pruefpunkte: ['Haltezeit, Hautfalte und Nadellänge', 'Schrittfolge gegen Gebrauchsinformation'],
    },
  },
  kompressionsstrumpf: {
    id: 'kompressionsstrumpf', titel: 'Kompressionsstrumpf mit Anziehhilfe',
    schritte: [
      { titel: 'Vorbereitet', text: 'Größe und Kompressionsklasse nach Verordnung prüfen. Haut und Bein ansehen, möglichst morgens vor dem Aufstehen anziehen.' },
      { titel: 'Ansetzen', text: 'Anziehhilfe nach Herstellerangabe vorbereiten, Fuß einführen, Ferse richtig positionieren.' },
      { titel: 'Zwischenzustand', text: 'Strumpf gleichmäßig und ohne Falten nach oben führen, nicht am oberen Rand ziehen.' },
      { titel: 'Endzustand', text: 'Sitz prüfen: keine Falten, kein Einschnüren. Hautbefund und Durchblutung dokumentieren.' },
    ],
    hinweis: 'Die Bilder zeigen den sichtbaren Ablauf vom vorbereiteten Hilfsmittel bis zum Endzustand. Produktbezogene Schritte richten sich nach Herstellerangaben.',
    freigabe: {
      status: 'ungeprueft', zielgruppe: 'erwachsene', geltung: 'Erwachsene, ambulante Pflege, mit Anziehhilfe', prueferrolle: ROLLE,
      lernziele: ['Anziehen eines Kompressionsstrumpfs mit Anziehhilfe in vier Phasen benennen', 'Sitzkontrolle und Hautbeobachtung als Abschluss kennen'],
      quellen: [{ titel: 'AWMF S2k-Leitlinie Medizinische Kompressionstherapie der Extremitäten (037-005)', stand: '2018' }, { titel: 'Herstellerangaben der Anziehhilfe', stand: 'je Produkt' }],
      aenderungen: VERLAUF, risiken: ['geraet'], pruefpunkte: ['Kontraindikationen (z. B. pAVK) im Fall berücksichtigt', 'Schrittfolge gegen Herstellerangaben'],
    },
  },
};

/** Pfade relativ zur App (base './'), damit sie auch unter einem Unterpfad funktionieren. */
export const videoPfad = (id: HandlungsVideoId) => `sim-videos/${id}.mp4`;
export const phasenBild = (id: HandlungsVideoId, phase: number) => `sim-videos/${id}-${phase + 1}.webp`;
