/**
 * Titelbilder der Bereiche (public/titelbilder, 1200 × 675, WebP, werden für Offline vorab geladen).
 * Schmuckbild im Farbfelder-Rahmen. Ohne `alt` gilt es als dekorativ und wird von Screenreadern übergangen.
 */
export const TITELBILDER = {
  heute: { datei: '01_heute', alt: 'Planer, Uhr und Lernkarten auf einem hellen Schreibtisch' },
  lernen: { datei: '02_lernorganisation', alt: 'Verbundene Themenkarten und Wochenplan auf einem Schreibtisch' },
  material: { datei: '03_material', alt: 'Kursunterlagen mit Register und Lupe neben einer Mappe' },
  ueben: { datei: '04_trainer', alt: 'Stethoskop, Lernkarten und anatomisches Modell' },
  simulation: { datei: '05_simulation', alt: 'Trainingspuppe im Pflegesimulationsraum mit Monitor' },
  system: { datei: '06_system', alt: 'Laptop, Tablet, Smartphone und USB-Speicher auf einem Tisch' },
} as const;

export type Motiv = keyof typeof TITELBILDER;

export function Titelbild({ motiv, beschreiben = false, sofort = false, className = '' }: {
  motiv: Motiv;
  /** true: Alternativtext aus dem Katalog setzen (wenn das Bild Inhalt trägt, nicht nur schmückt). */
  beschreiben?: boolean;
  /** true: sofort laden (Bild steht im ersten sichtbaren Bereich). */
  sofort?: boolean;
  className?: string;
}) {
  const b = TITELBILDER[motiv];
  return (
    <figure className={`titelbild ${className}`.trim()}>
      <img src={`./titelbilder/${b.datei}.webp`} alt={beschreiben ? b.alt : ''} width={1200} height={675}
        loading={sofort ? 'eager' : 'lazy'} decoding="async" />
    </figure>
  );
}
