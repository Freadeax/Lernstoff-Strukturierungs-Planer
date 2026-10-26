// Decimal input is represented as integer fractions; dose arithmetic never uses binary floats.
function fraction(value: number | string): { numerator: bigint; denominator: bigint } {
  const text = String(value).replace(',', '.');
  if (!/^\d{1,9}(\.\d{1,6})?$/.test(text)) throw new Error('Ungültige Dezimalzahl (maximal sechs Nachkommastellen).');
  const [whole, decimals = ''] = text.split('.');
  return { numerator: BigInt(whole + decimals), denominator: 10n ** BigInt(decimals.length) };
}
export function decimalEqual(a: number | string, b: number | string): boolean {
  try { const x = fraction(a), y = fraction(b); return x.numerator * y.denominator === y.numerator * x.denominator; } catch { return false; }
}
export function requiredVolume(dose: number | string, concentration: number | string): string {
  const x = fraction(dose), y = fraction(concentration);
  if (x.numerator <= 0n || y.numerator <= 0n) throw new Error('Dosis und Konzentration müssen positiv sein.');
  const numerator = x.numerator * y.denominator * 100n;
  const denominator = x.denominator * y.numerator;
  // Explicit training policy: round half up to 0.01 ml; no clinical suitability implied.
  const rounded = (2n * numerator + denominator) / (2n * denominator);
  return `${rounded / 100n}.${String(rounded % 100n).padStart(2, '0')}`;
}
export function correctVolume(volume: number, dose: number, concentration: number): boolean {
  try { return volume > 0 && decimalEqual(volume, requiredVolume(dose, concentration)); } catch { return false; }
}
