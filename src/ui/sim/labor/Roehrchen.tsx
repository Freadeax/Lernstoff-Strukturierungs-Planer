import { ROEHRCHEN, type Farbsystem } from './praeanalytik';
import type { Material } from './parameter';
import './labor.css';

/** Ein Röhrchen mit Verschlussfarbe nach Farbsystem; `fuellung` 0..1 zeigt die Blutmenge. */
export function Roehrchen({ material, farbsystem, fuellung = 0, beschriftung = true }: { material: Material; farbsystem: Farbsystem; fuellung?: number; beschriftung?: boolean }) {
  const r = ROEHRCHEN[material];
  const farbe = r.farbe[farbsystem];
  return (
    <span className="roehrchen">
      <span className="roehrchen__koerper" style={{ ['--kappe' as string]: farbe.hex, ['--fuellung' as string]: `${Math.round(fuellung * 80)}%` }} aria-hidden="true">
        <span className="roehrchen__kappe" />
        <span className="roehrchen__blut" />
      </span>
      {beschriftung && <span className="roehrchen__name">{r.name.split(' (')[0]}<br />{farbe.name}</span>}
    </span>
  );
}
