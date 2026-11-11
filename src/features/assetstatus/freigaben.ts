// Fachliche Freigabe je Bilddatei (SIM-06). Eine Datei gilt erst als geprüft, wenn sie hier mit
// Datum und prüfender Person steht. Prüfen heißt: Gerätedetails, Kabel- und Sensorlage, Anatomie,
// Hygiene und Szene passen zum Fall, in dem das Bild erscheint (siehe docs/ASSET-STATUS.md).
// Schlüssel: Pfad unter public/, z. B. 'raeume/12_station_kardiologie_monitoring.webp'.

export interface Freigabe {
  /** Datum der Prüfung, JJJJ-MM-TT */
  am: string;
  /** Wer geprüft hat (Rolle reicht, z. B. „Praxisanleitung“) */
  von: string;
  /** Optional: Einschränkung oder Hinweis aus der Prüfung */
  hinweis?: string;
}

export const FREIGABEN: Record<string, Freigabe> = {};
