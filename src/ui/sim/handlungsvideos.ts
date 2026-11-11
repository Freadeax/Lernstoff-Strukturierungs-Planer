// Handlungsvideos aus dem Bildpaket (Philipp, 2026-11-11): gerenderte Vorschauen mit vier Phasen.
// Darstellung, keine Anleitung: Zeitachse ist keine klinische Haltezeit, Schrittfolge fachlich ungeprüft.

export type HandlungsVideoId = 'insulingabe' | 'kompressionsstrumpf';
export type HandlungsVideoInfo = { id: HandlungsVideoId; titel: string; phasen: [string, string, string, string]; hinweis: string };

export const HANDLUNGSVIDEOS: Record<HandlungsVideoId, HandlungsVideoInfo> = {
  insulingabe: {
    id: 'insulingabe', titel: 'Insulingabe mit Pen am Übungspad',
    phasen: ['Annäherung', 'Kontakt', 'Auslösen', 'Abheben'],
    hinweis: 'Die Bilder zeigen vier Phasen, keine lückenlose Handbewegung. Die Zeitachse ist keine klinische Haltezeit. Präparat, Dosis und Applikationsort kommen immer aus der geprüften Anordnung; Geräteanleitung des Pens beachten.',
  },
  kompressionsstrumpf: {
    id: 'kompressionsstrumpf', titel: 'Kompressionsstrumpf mit Anziehhilfe',
    phasen: ['Vorbereitet', 'Ansetzen', 'Zwischenzustand', 'Endzustand'],
    hinweis: 'Die Bilder zeigen den sichtbaren Ablauf vom vorbereiteten Hilfsmittel bis zum Endzustand. Produktbezogene Schritte richten sich nach Herstellerangaben und müssen fachlich geprüft werden.',
  },
};

/** Pfade relativ zur App (base './'), damit sie auch unter einem Unterpfad funktionieren. */
export const videoPfad = (id: HandlungsVideoId) => `sim-videos/${id}.mp4`;
export const phasenBild = (id: HandlungsVideoId, phase: number) => `sim-videos/${id}-${phase + 1}.webp`;
