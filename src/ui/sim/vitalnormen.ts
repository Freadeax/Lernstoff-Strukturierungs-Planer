// Gemeinsamer Datenvertrag für Vitalwerte (Audit: Normwerte-Trainer, Labor und Monitor nutzen dieselben Werte).
// Klein und ohne Abhängigkeiten, damit der Monitor ihn ohne Laborteil laden kann. Laborwerte stehen in
// labor/parameter.ts; die Fassade src/ui/sim/normwerte.ts verbindet beides.
//
// „normal“ = übliche Lehrbuch-Ruhewerte (Normwerte-Trainer, grüne Kurvenbänder). Die Alarmgrenzen des Monitors
// sind davon getrennt: bei Erwachsenen NEWS2 (frühe Warnung, z. B. Puls ab 91 gelb), bei Kindern färbt der Monitor
// gelb genau außerhalb dieses Normalbereichs. Didaktisch gerundet, fachlich ungeprüft; lokale Vorgaben gehen vor.

export type VitalId = 'puls' | 'af' | 'sys' | 'spo2' | 'temp';
export type NormGruppe = 'erwachsen' | 'saeugling' | 'kleinkind' | 'schulkind';
export interface NormBereich { min?: number; max?: number }

export interface VitalNorm {
  id: VitalId;
  name: string;
  einheit: string;
  nachkomma: number;
  /** Normalbereich je Altersgruppe; fehlt die Gruppe, gibt es kein Profil (Säuglinge). */
  normal: Partial<Record<NormGruppe, NormBereich>>;
}

export const VITALWERTE: Record<VitalId, VitalNorm> = {
  puls: { id: 'puls', name: 'Puls', einheit: '/min', nachkomma: 0, normal: { erwachsen: { min: 60, max: 100 }, kleinkind: { min: 90, max: 150 }, schulkind: { min: 70, max: 130 } } },
  af: { id: 'af', name: 'Atemfrequenz', einheit: '/min', nachkomma: 0, normal: { erwachsen: { min: 12, max: 20 }, kleinkind: { min: 20, max: 40 }, schulkind: { min: 16, max: 30 } } },
  sys: { id: 'sys', name: 'Blutdruck systolisch', einheit: 'mmHg', nachkomma: 0, normal: { erwachsen: { min: 100, max: 139 }, kleinkind: { min: 80 }, schulkind: { min: 90 } } },
  spo2: { id: 'spo2', name: 'Sauerstoffsättigung', einheit: '%', nachkomma: 0, normal: { erwachsen: { min: 95, max: 100 }, kleinkind: { min: 95, max: 100 }, schulkind: { min: 95, max: 100 } } },
  temp: { id: 'temp', name: 'Körpertemperatur', einheit: '°C', nachkomma: 1, normal: { erwachsen: { min: 36.3, max: 37.4 }, kleinkind: { min: 36.3, max: 37.4 }, schulkind: { min: 36.3, max: 37.4 } } },
};

/** Schwellen, die Trainer und Simulatoren gemeinsam nennen. */
export const VITAL_SCHWELLEN = {
  /** Fieber ab über diesem Wert (°C). */
  fieber: 38.0,
  /** Hypertonie ab (systolisch/diastolisch, Praxismessung). */
  hypertonie: [140, 90] as const,
  /** Hypoglykämie unter (mg/dl). */
  hypoglykaemie: 70,
} as const;

export function vitalNormal(id: VitalId, gruppe: NormGruppe = 'erwachsen'): NormBereich | undefined {
  return VITALWERTE[id].normal[gruppe];
}

const zahl = (n: number, k: number) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: k, maximumFractionDigits: k }).format(n);

/** „60 bis 100 /min“ usw. für Texte in Trainern und Hinweisen. */
export function vitalText(id: VitalId, gruppe: NormGruppe = 'erwachsen'): string {
  const v = VITALWERTE[id], b = v.normal[gruppe];
  if (!b) return 'kein Profil';
  const e = v.einheit.startsWith('/') ? ` pro Minute` : ` ${v.einheit}`;
  if (b.min !== undefined && b.max !== undefined) return `${zahl(b.min, v.nachkomma)} bis ${zahl(b.max, v.nachkomma)}${e}`;
  if (b.min !== undefined) return `ab ${zahl(b.min, v.nachkomma)}${e}`;
  return `bis ${zahl(b.max!, v.nachkomma)}${e}`;
}
