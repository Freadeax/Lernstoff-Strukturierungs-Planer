// Laborparameter für die Simulatoren: Referenzbereiche, kritische Grenzen, Probenmaterial, Laufzeiten.
// Übliche Richtwerte für Erwachsene, didaktisch gerundet. Maßgeblich ist immer der Referenzbereich
// des jeweiligen Labors auf dem Befund.

export type Material = 'blutkultur' | 'citrat' | 'serum' | 'heparin' | 'edta' | 'fluorid' | 'bga' | 'kapillar' | 'urin';
export type Gruppe = 'blutbild' | 'entzuendung' | 'elektrolyte' | 'niere' | 'herz' | 'gerinnung' | 'stoffwechsel' | 'bga' | 'urin' | 'mikrobiologie' | 'schilddruese';
export type Geschlecht = 'w' | 'm';

export interface Bereich { min?: number; max?: number }

export interface LaborParameter {
  id: string;
  name: string;
  kurz: string;
  einheit: string;
  gruppe: Gruppe;
  material: Material;
  nachkomma: number;
  referenz: Bereich | { w: Bereich; m: Bereich };
  /** Abweichender Referenzbereich für Kinder (etwa 2 bis 12 Jahre), sonst gilt referenz. */
  kind?: Bereich;
  /** Werte außerhalb dieser Grenzen meldet das Labor sofort telefonisch. */
  kritisch?: Bereich;
  /** Laufzeit im Labor in Minuten: Routine / Notfall. POCT-Werte haben nur eine Zeit. */
  laufzeit: { routine: number; notfall: number };
  /** Ort der Messung: Zentrallabor oder patientennah (Point of Care). */
  ort: 'labor' | 'poct' | 'mikrobiologie';
  /** Kurzer Pflegehinweis, warum der Wert wichtig ist. */
  bedeutung: string;
  /** Qualitative Stufen (Urinstix, Blutkultur): der Wert ist dann der Index. */
  stufen?: string[];
}

export const GRUPPEN: Record<Gruppe, string> = {
  blutbild: 'Blutbild', entzuendung: 'Entzündung', elektrolyte: 'Elektrolyte', niere: 'Niere',
  herz: 'Herz und Kreislauf', gerinnung: 'Gerinnung', stoffwechsel: 'Stoffwechsel', bga: 'Blutgasanalyse',
  urin: 'Urin', mikrobiologie: 'Mikrobiologie', schilddruese: 'Schilddrüse',
};

const L = (routine: number, notfall: number) => ({ routine, notfall });

export const PARAMETER: LaborParameter[] = [
  // Blutbild (EDTA)
  { id: 'leuko', name: 'Leukozyten', kurz: 'Leuko', einheit: 'G/l', gruppe: 'blutbild', material: 'edta', nachkomma: 1, referenz: { min: 4, max: 10 }, kind: { min: 5, max: 15 }, kritisch: { min: 1.5, max: 30 }, laufzeit: L(45, 20), ort: 'labor', bedeutung: 'Weiße Blutkörperchen: erhöht bei Infektion, Stress, Kortison; erniedrigt z. B. unter Chemotherapie (Infektionsschutz).' },
  { id: 'hb', name: 'Hämoglobin', kurz: 'Hb', einheit: 'g/dl', gruppe: 'blutbild', material: 'edta', nachkomma: 1, referenz: { w: { min: 12, max: 16 }, m: { min: 13.5, max: 17.5 } }, kind: { min: 11, max: 14.5 }, kritisch: { min: 7 }, laufzeit: L(45, 20), ort: 'labor', bedeutung: 'Sauerstoffträger: Abfall bei Blutung oder Verdünnung; Blässe, Schwindel, Sturzgefahr beobachten.' },
  { id: 'thrombo', name: 'Thrombozyten', kurz: 'Thrombo', einheit: 'G/l', gruppe: 'blutbild', material: 'edta', nachkomma: 0, referenz: { min: 150, max: 400 }, kritisch: { min: 20, max: 1000 }, laufzeit: L(45, 20), ort: 'labor', bedeutung: 'Blutplättchen: niedrig = Blutungsgefahr (Injektionen, Rasur, Zahnpflege anpassen).' },
  // Entzündung
  { id: 'crp', name: 'C-reaktives Protein', kurz: 'CRP', einheit: 'mg/l', gruppe: 'entzuendung', material: 'serum', nachkomma: 1, referenz: { max: 5 }, laufzeit: L(60, 30), ort: 'labor', bedeutung: 'Entzündungsmarker, steigt mit 6–12 h Verzögerung und fällt langsam: Verlauf zählt mehr als ein Einzelwert.' },
  { id: 'pct', name: 'Procalcitonin', kurz: 'PCT', einheit: 'ng/ml', gruppe: 'entzuendung', material: 'serum', nachkomma: 2, referenz: { max: 0.5 }, laufzeit: L(90, 45), ort: 'labor', bedeutung: 'Hinweis auf bakterielle Infektion und Sepsis; hilft bei Beginn und Dauer der Antibiotikatherapie.' },
  // Elektrolyte
  { id: 'na', name: 'Natrium', kurz: 'Na', einheit: 'mmol/l', gruppe: 'elektrolyte', material: 'serum', nachkomma: 0, referenz: { min: 135, max: 145 }, kritisch: { min: 120, max: 160 }, laufzeit: L(60, 30), ort: 'labor', bedeutung: 'Wasserhaushalt: Abweichungen zeigen sich oft als Verwirrtheit, Sturz oder Krampfanfall.' },
  { id: 'k', name: 'Kalium', kurz: 'K', einheit: 'mmol/l', gruppe: 'elektrolyte', material: 'serum', nachkomma: 1, referenz: { min: 3.5, max: 5.0 }, kritisch: { min: 2.8, max: 6.2 }, laufzeit: L(60, 30), ort: 'labor', bedeutung: 'Herzrhythmus: zu hoch oder zu niedrig kann lebensgefährliche Rhythmusstörungen auslösen. Hämolyse täuscht hohe Werte vor.' },
  { id: 'ca', name: 'Calcium', kurz: 'Ca', einheit: 'mmol/l', gruppe: 'elektrolyte', material: 'serum', nachkomma: 2, referenz: { min: 2.2, max: 2.6 }, kritisch: { min: 1.6, max: 3.3 }, laufzeit: L(60, 30), ort: 'labor', bedeutung: 'Nerven und Muskeln: niedrig = Kribbeln, Krämpfe. Verschleppung aus dem EDTA-Röhrchen täuscht niedrige Werte vor.' },
  // Niere
  { id: 'krea', name: 'Kreatinin', kurz: 'Krea', einheit: 'mg/dl', gruppe: 'niere', material: 'serum', nachkomma: 2, referenz: { w: { min: 0.5, max: 0.9 }, m: { min: 0.7, max: 1.2 } }, kind: { min: 0.2, max: 0.6 }, laufzeit: L(60, 30), ort: 'labor', bedeutung: 'Nierenfunktion: wichtig vor Kontrastmittel und für die Dosierung vieler Arzneimittel; Bilanz und Ausscheidung beobachten.' },
  { id: 'egfr', name: 'eGFR', kurz: 'eGFR', einheit: 'ml/min/1,73 m²', gruppe: 'niere', material: 'serum', nachkomma: 0, referenz: { min: 60 }, laufzeit: L(60, 30), ort: 'labor', bedeutung: 'Geschätzte Filterleistung der Niere; unter 30 besonders vorsichtig mit jodhaltigem Kontrastmittel.' },
  { id: 'harnstoff', name: 'Harnstoff', kurz: 'Hst', einheit: 'mg/dl', gruppe: 'niere', material: 'serum', nachkomma: 0, referenz: { min: 17, max: 43 }, kind: { min: 10, max: 40 }, laufzeit: L(60, 30), ort: 'labor', bedeutung: 'Steigt bei Nierenschwäche und bei Flüssigkeitsmangel (Exsikkose).' },
  // Herz
  { id: 'trop', name: 'Troponin T (hochsensitiv)', kurz: 'hs-TnT', einheit: 'ng/l', gruppe: 'herz', material: 'serum', nachkomma: 0, referenz: { max: 14 }, kritisch: { max: 52 }, laufzeit: L(60, 30), ort: 'labor', bedeutung: 'Herzmuskelschaden: Kontrolle nach 1–3 h, entscheidend ist der Anstieg. Erhöht auch bei Lungenembolie und Niereninsuffizienz.' },
  { id: 'ntprobnp', name: 'NT-proBNP', kurz: 'NT-proBNP', einheit: 'pg/ml', gruppe: 'herz', material: 'serum', nachkomma: 0, referenz: { max: 450 }, laufzeit: L(90, 45), ort: 'labor', bedeutung: 'Herzbelastung (Herzinsuffizienz); altersabhängig, Grenze hier für über 75-Jährige. Gewicht und Ödeme mitbeobachten.' },
  // Gerinnung (Citrat)
  { id: 'inr', name: 'INR', kurz: 'INR', einheit: '', gruppe: 'gerinnung', material: 'citrat', nachkomma: 2, referenz: { min: 0.85, max: 1.15 }, kritisch: { max: 4.5 }, laufzeit: L(45, 25), ort: 'labor', bedeutung: 'Gerinnungszeit, Zielbereich unter Vitamin-K-Antagonisten meist 2–3. Unterfülltes Citratröhrchen verfälscht den Wert.' },
  { id: 'aptt', name: 'aPTT', kurz: 'aPTT', einheit: 's', gruppe: 'gerinnung', material: 'citrat', nachkomma: 0, referenz: { min: 25, max: 38 }, kritisch: { max: 100 }, laufzeit: L(45, 25), ort: 'labor', bedeutung: 'Kontrolle unter unfraktioniertem Heparin. Abnahme nie aus dem Heparin-Zugang.' },
  { id: 'ddimer', name: 'D-Dimere', kurz: 'D-Dimer', einheit: 'mg/l FEU', gruppe: 'gerinnung', material: 'citrat', nachkomma: 2, referenz: { max: 0.5 }, laufzeit: L(45, 25), ort: 'labor', bedeutung: 'Normaler Wert macht Thrombose oder Lungenembolie unwahrscheinlich; erhöht auch nach OP, bei Infektion und im Alter.' },
  // Stoffwechsel
  { id: 'glukose', name: 'Glukose (Plasma)', kurz: 'Gluk', einheit: 'mg/dl', gruppe: 'stoffwechsel', material: 'fluorid', nachkomma: 0, referenz: { min: 70, max: 140 }, kritisch: { min: 50, max: 400 }, laufzeit: L(45, 20), ort: 'labor', bedeutung: 'Blutzucker im Labor; im Serum ohne Fluorid sinkt er mit jeder Stunde Liegezeit.' },
  { id: 'bz', name: 'Blutzucker kapillär', kurz: 'BZ', einheit: 'mg/dl', gruppe: 'stoffwechsel', material: 'kapillar', nachkomma: 0, referenz: { min: 70, max: 140 }, kritisch: { min: 50, max: 400 }, laufzeit: L(1, 1), ort: 'poct', bedeutung: 'Schnelltest am Bett. Erst den ersten Tropfen abwischen, nicht quetschen; Alkoholreste und Glukoseinfusion am Finger verfälschen.' },
  { id: 'tsh', name: 'TSH', kurz: 'TSH', einheit: 'mU/l', gruppe: 'schilddruese', material: 'serum', nachkomma: 2, referenz: { min: 0.4, max: 4 }, laufzeit: L(120, 60), ort: 'labor', bedeutung: 'Vor jodhaltigem Kontrastmittel: bei Überfunktion droht eine thyreotoxische Krise.' },
  // BGA (arterielle Probe, patientennah)
  { id: 'ph', name: 'pH', kurz: 'pH', einheit: '', gruppe: 'bga', material: 'bga', nachkomma: 2, referenz: { min: 7.35, max: 7.45 }, kritisch: { min: 7.2, max: 7.6 }, laufzeit: L(3, 3), ort: 'poct', bedeutung: 'Säure-Basen-Haushalt: unter 7,35 Azidose, über 7,45 Alkalose.' },
  { id: 'pco2', name: 'pCO₂', kurz: 'pCO₂', einheit: 'mmHg', gruppe: 'bga', material: 'bga', nachkomma: 0, referenz: { min: 35, max: 45 }, kritisch: { min: 20, max: 70 }, laufzeit: L(3, 3), ort: 'poct', bedeutung: 'Atmung (respiratorischer Anteil): hoch bei Hypoventilation, niedrig bei Hyperventilation.' },
  { id: 'po2', name: 'pO₂', kurz: 'pO₂', einheit: 'mmHg', gruppe: 'bga', material: 'bga', nachkomma: 0, referenz: { min: 75, max: 100 }, kritisch: { min: 50 }, laufzeit: L(3, 3), ort: 'poct', bedeutung: 'Sauerstoff im arteriellen Blut; unter Sauerstoffgabe immer zusammen mit der Flussrate dokumentieren.' },
  { id: 'hco3', name: 'Bikarbonat', kurz: 'HCO₃⁻', einheit: 'mmol/l', gruppe: 'bga', material: 'bga', nachkomma: 1, referenz: { min: 22, max: 26 }, kritisch: { min: 10, max: 40 }, laufzeit: L(3, 3), ort: 'poct', bedeutung: 'Stoffwechsel (metabolischer Anteil) des Säure-Basen-Haushalts.' },
  { id: 'be', name: 'Basenüberschuss', kurz: 'BE', einheit: 'mmol/l', gruppe: 'bga', material: 'bga', nachkomma: 1, referenz: { min: -2, max: 2 }, laufzeit: L(3, 3), ort: 'poct', bedeutung: 'Negativ = Basen fehlen (metabolische Azidose), positiv = Basenüberschuss.' },
  { id: 'sao2', name: 'Sauerstoffsättigung (arteriell)', kurz: 'SaO₂', einheit: '%', gruppe: 'bga', material: 'bga', nachkomma: 0, referenz: { min: 94, max: 99 }, kritisch: { min: 85 }, laufzeit: L(3, 3), ort: 'poct', bedeutung: 'Gemessene Sättigung; bei COPD gilt oft ein ärztlich festgelegter Zielbereich 88–92 %.' },
  { id: 'laktat', name: 'Laktat', kurz: 'Lak', einheit: 'mmol/l', gruppe: 'bga', material: 'bga', nachkomma: 1, referenz: { min: 0.5, max: 2 }, kritisch: { max: 4 }, laufzeit: L(3, 3), ort: 'poct', bedeutung: 'Zeichen für Sauerstoffmangel im Gewebe (Schock, Sepsis). Über 2 mmol/l bei Infektion: Sepsisverdacht ernst nehmen.' },
  // Urinstix (qualitativ, patientennah)
  { id: 'u-leuko', name: 'Leukozyten (Urinstix)', kurz: 'U-Leuko', einheit: '', gruppe: 'urin', material: 'urin', nachkomma: 0, referenz: { max: 0 }, laufzeit: L(2, 2), ort: 'poct', stufen: ['negativ', '(+)', '+', '++', '+++'], bedeutung: 'Hinweis auf Harnwegsinfekt; Mittelstrahlurin, frisch testen, Ablesezeit einhalten.' },
  { id: 'u-nitrit', name: 'Nitrit (Urinstix)', kurz: 'U-Nitrit', einheit: '', gruppe: 'urin', material: 'urin', nachkomma: 0, referenz: { max: 0 }, laufzeit: L(2, 2), ort: 'poct', stufen: ['negativ', 'positiv'], bedeutung: 'Positiv bei vielen Bakterien im Urin; negativ schließt einen Infekt nicht aus.' },
  { id: 'u-keton', name: 'Ketone (Urinstix)', kurz: 'U-Keton', einheit: '', gruppe: 'urin', material: 'urin', nachkomma: 0, referenz: { max: 0 }, laufzeit: L(2, 2), ort: 'poct', stufen: ['negativ', '(+)', '+', '++', '+++'], bedeutung: 'Fettabbau: bei Hunger, Erbrechen oder entgleistem Diabetes (Ketoazidose).' },
  { id: 'u-glukose', name: 'Glukose (Urinstix)', kurz: 'U-Gluk', einheit: '', gruppe: 'urin', material: 'urin', nachkomma: 0, referenz: { max: 0 }, laufzeit: L(2, 2), ort: 'poct', stufen: ['negativ', '(+)', '+', '++', '+++'], bedeutung: 'Zucker im Urin ab etwa 180 mg/dl im Blut (Nierenschwelle).' },
  // Mikrobiologie
  { id: 'bk', name: 'Blutkultur (2 Sets)', kurz: 'BK', einheit: '', gruppe: 'mikrobiologie', material: 'blutkultur', nachkomma: 0, referenz: { max: 0 }, laufzeit: L(24 * 60, 18 * 60), ort: 'mikrobiologie', stufen: ['kein Wachstum', 'Wachstum: grampositive Kokken', 'Wachstum: gramnegative Stäbchen'], bedeutung: 'Vor der ersten Antibiotikagabe abnehmen, aerob und anaerob, Flaschen nicht kühlen. Vorläufige Meldung oft nach 12–24 h.' },
];

export const PARAMETER_NACH_ID: Record<string, LaborParameter> = Object.fromEntries(PARAMETER.map((p) => [p.id, p]));

export function parameter(id: string): LaborParameter {
  const p = PARAMETER_NACH_ID[id];
  if (!p) throw new Error(`Unbekannter Laborparameter: ${id}`);
  return p;
}

export function referenz(p: LaborParameter, g: Geschlecht = 'w', kind = false): Bereich {
  if (kind && p.kind) return p.kind;
  return 'w' in p.referenz ? p.referenz[g] : p.referenz;
}

/** Ab welchem Alter die Erwachsenen-Referenzen gelten (vereinfacht). */
export const istKind = (alter: number) => alter < 14;

export type Flag = 'normal' | 'niedrig' | 'hoch' | 'kritisch-niedrig' | 'kritisch-hoch';

export function bewerte(p: LaborParameter, wert: number, g: Geschlecht = 'w', kind = false): Flag {
  const r = referenz(p, g, kind), k = p.kritisch ?? {};
  if (k.min !== undefined && wert < k.min) return 'kritisch-niedrig';
  if (k.max !== undefined && wert > k.max) return 'kritisch-hoch';
  if (r.min !== undefined && wert < r.min) return 'niedrig';
  if (r.max !== undefined && wert > r.max) return 'hoch';
  return 'normal';
}

export const FLAG_KURZ: Record<Flag, string> = { normal: '', niedrig: 'L', hoch: 'H', 'kritisch-niedrig': 'LL', 'kritisch-hoch': 'HH' };
export const FLAG_TEXT: Record<Flag, string> = { normal: 'im Referenzbereich', niedrig: 'erniedrigt', hoch: 'erhöht', 'kritisch-niedrig': 'kritisch niedrig', 'kritisch-hoch': 'kritisch hoch' };
export const istKritisch = (f: Flag) => f === 'kritisch-hoch' || f === 'kritisch-niedrig';

export function formatWert(p: LaborParameter, wert: number): string {
  if (p.stufen) return p.stufen[Math.max(0, Math.min(p.stufen.length - 1, Math.round(wert)))];
  return new Intl.NumberFormat('de-DE', { minimumFractionDigits: p.nachkomma, maximumFractionDigits: p.nachkomma }).format(wert);
}

export function formatReferenz(p: LaborParameter, g: Geschlecht = 'w', kind = false): string {
  if (p.stufen) return p.stufen[0];
  const r = referenz(p, g, kind);
  const f = (n: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: p.nachkomma }).format(n);
  if (r.min !== undefined && r.max !== undefined) return `${f(r.min)}–${f(r.max)}`;
  if (r.max !== undefined) return `< ${f(r.max)}`;
  if (r.min !== undefined) return `> ${f(r.min)}`;
  return '';
}
