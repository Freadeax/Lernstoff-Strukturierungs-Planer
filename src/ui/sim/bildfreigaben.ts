// Fachliche Bildprüfung je Prüfeinheit (SIM-06). Getrennt von der Fall-Freigabe (src/ui/sim/freigabe.ts,
// SIM-02): hier geht es nur darum, ob das Bild selbst fachlich stimmt. Eine Einheit gilt erst als
// geprüft, wenn sie hier mit Status „freigegeben“, Datum und prüfender Person steht. Einträge entstehen
// in der App unter System → Bildprüfung (#/system/bilder) und werden mit
// `npm run assets:freigaben -- <export.json>` übernommen. Mängel bleiben hier stehen, bis ein
// Ersatzbild geliefert ist (docs/ASSET-STATUS.md).
//
// Schlüssel (Prüfeinheit): Raum, Porträt, Titelbild = Bilddatei ('raeume/12_….webp');
// Handlungsvideo = MP4 ('sim-videos/insulingabe.mp4', gilt auch für die Phasenbilder);
// Bildgebung = Serienordner ('bildgebung/lungenembolie-ct', gilt für alle Schichten).

export type BildFreigabeStatus = 'freigegeben' | 'mangel';

export interface BildFreigabe {
  status: BildFreigabeStatus;
  /** Datum der Prüfung, JJJJ-MM-TT */
  am: string;
  /** Wer geprüft hat (Rolle reicht, z. B. „Praxisanleitung“) */
  von: string;
  /** Bei Mangel Pflicht: was am Bild nicht stimmt */
  hinweis?: string;
  /** Abgehakte Prüfpunkte (IDs aus PRUEFPUNKTE) */
  pruefpunkte?: string[];
}

export const FREIGABEN: Record<string, BildFreigabe> = {};

/** Bekannter Mangel zu einer Datei unter public/ (Video-Phasen und Serienbilder über ihre Prüfeinheit). */
export function bildMangel(datei: string): BildFreigabe | undefined {
  const einheit = /^sim-videos\/(.+)-\d\.webp$/.exec(datei)?.[1] ? datei.replace(/-\d\.webp$/, '.mp4') : /^(bildgebung\/[^/]+)\//.exec(datei)?.[1] ?? datei;
  const f = FREIGABEN[einheit];
  return f?.status === 'mangel' ? f : undefined;
}
