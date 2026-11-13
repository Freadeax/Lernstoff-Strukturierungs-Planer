export interface Masse { breite: number; hoehe: number; typ: 'png' | 'jpeg' | 'webp' }
export interface LieferDatei { pfad: string; groesse: number; masse: Masse | null }
export interface LieferErgebnis { datei: string; art: string; id: string; stufe: 'fehler' | 'warnung' | 'ok'; meldungen: string[] }
export function bildMasse(buf: Uint8Array): Masse | null;
export function pruefeLieferung(dateien: LieferDatei[], kontext: { katalog?: unknown; vorhandeneIds: string[]; bestellteIds: string[] }): LieferErgebnis[];
export function bestellteIds(markdown: string): string[];
export function berichtMarkdown(ergebnis: LieferErgebnis[], titel: string): string;
