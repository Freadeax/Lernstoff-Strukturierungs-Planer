// Deutung einer Blutgasanalyse in Lernschritten: pH -> Ursache (respiratorisch/metabolisch) -> Kompensation -> Oxygenierung.
// Vereinfacht für die Pflegeausbildung, ersetzt keine ärztliche Beurteilung.

export interface Bga { ph: number; pco2: number; hco3: number; po2?: number; be?: number; laktat?: number }

export type Stoerung = 'normal' | 'respiratorische Azidose' | 'metabolische Azidose' | 'respiratorische Alkalose' | 'metabolische Alkalose' | 'gemischte Azidose' | 'gemischte Alkalose';
export type Kompensation = 'keine' | 'teilweise' | 'vollständig';

export interface BgaDeutung {
  stoerung: Stoerung;
  kompensation: Kompensation;
  /** Hypoxämie: pO2 unter 60 mmHg = respiratorische Insuffizienz */
  hypoxaemie: 'keine' | 'leicht' | 'schwer';
  schritte: string[];
}

const fmt = (n: number, d = 0) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

export function deuteBga(b: Bga): BgaDeutung {
  const schritte: string[] = [];
  const azid = b.ph < 7.35, alkal = b.ph > 7.45;
  const co2Hoch = b.pco2 > 45, co2Tief = b.pco2 < 35, hco3Tief = b.hco3 < 22, hco3Hoch = b.hco3 > 26;
  let stoerung: Stoerung = 'normal';
  let kompensation: Kompensation = 'keine';

  schritte.push(`1. pH ${fmt(b.ph, 2)}: ${azid ? 'unter 7,35 → Azidose' : alkal ? 'über 7,45 → Alkalose' : 'im Normbereich'}.`);
  if (azid) {
    if (co2Hoch && hco3Tief) stoerung = 'gemischte Azidose';
    else if (co2Hoch) stoerung = 'respiratorische Azidose';
    else if (hco3Tief) stoerung = 'metabolische Azidose';
  } else if (alkal) {
    if (co2Tief && hco3Hoch) stoerung = 'gemischte Alkalose';
    else if (co2Tief) stoerung = 'respiratorische Alkalose';
    else if (hco3Hoch) stoerung = 'metabolische Alkalose';
  } else if ((co2Hoch && hco3Hoch) || (co2Tief && hco3Tief)) {
    // pH normal, beide Achsen verschoben: vollständig kompensiert. Richtung über die pH-Hälfte.
    const sauer = b.ph < 7.4;
    stoerung = co2Hoch ? (sauer ? 'respiratorische Azidose' : 'metabolische Alkalose') : (sauer ? 'metabolische Azidose' : 'respiratorische Alkalose');
    kompensation = 'vollständig';
  }
  schritte.push(`2. pCO₂ ${fmt(b.pco2)} mmHg (Atmung), HCO₃⁻ ${fmt(b.hco3, 1)} mmol/l (Stoffwechsel): ${stoerung === 'normal' ? 'keine passende Verschiebung.' : `passt zu ${stoerung}.`}`);

  if (kompensation !== 'vollständig' && stoerung !== 'normal' && !stoerung.startsWith('gemischt')) {
    const gegen = stoerung === 'respiratorische Azidose' ? hco3Hoch : stoerung === 'respiratorische Alkalose' ? hco3Tief : stoerung === 'metabolische Azidose' ? co2Tief : co2Hoch;
    kompensation = gegen ? 'teilweise' : 'keine';
  }
  schritte.push(`3. Kompensation: ${kompensation === 'keine' ? 'keine – die andere Seite gleicht (noch) nicht aus' : kompensation === 'teilweise' ? 'teilweise – die andere Seite steuert gegen, der pH ist aber noch verschoben' : kompensation === 'vollständig' ? 'vollständig – pH normal, aber beide Achsen verschoben' : ''}.`);

  let hypoxaemie: BgaDeutung['hypoxaemie'] = 'keine';
  if (b.po2 !== undefined) {
    hypoxaemie = b.po2 < 60 ? 'schwer' : b.po2 < 75 ? 'leicht' : 'keine';
    schritte.push(`4. pO₂ ${fmt(b.po2)} mmHg: ${hypoxaemie === 'schwer' ? 'unter 60 → respiratorische Insuffizienz' : hypoxaemie === 'leicht' ? 'erniedrigt → Hypoxämie' : 'ausreichend'}.`);
  }
  if (b.laktat !== undefined && b.laktat > 2) schritte.push(`5. Laktat ${fmt(b.laktat, 1)} mmol/l erhöht → Gewebe schlecht versorgt (z. B. Schock, Sepsis); erklärt eine metabolische Azidose.`);
  return { stoerung, kompensation, hypoxaemie, schritte };
}
