// Gesprächssimulator, eigene Worte: Freitext offline einer der festen Antworten zuordnen.
// Wortabgleich über Antwort-Katalog (feste Antwort + Varianten) plus Zuschlag, wenn die erkannte
// Gesprächstechnik zur Antwort passt. Keine KI, nichts verlässt das Gerät.

import { erstelleIndex, GRENZEN, suche, type AbgleichIndex, type Sicherheit } from '../../core/abgleich/abgleich';
import { pflegeSynonyme } from '../../modules/pflege/abgleich';
import { TECHNIK, type Knoten, type TechnikId } from './dialoge';
import { erkenneTechniken } from './techniken-erkennen';
import { VARIANTEN } from './varianten';

export interface Deutung {
  sicherheit: Sicherheit;
  /** Antwort-Indizes im Knoten, bester zuerst */
  rangfolge: Array<{ index: number; wert: number }>;
  techniken: TechnikId[];
}

const ZUSCHLAG = 0.15;
const indizes = new Map<string, AbgleichIndex>();

function index(k: Knoten): AbgleichIndex {
  let ix = indizes.get(k.id);
  if (!ix) {
    ix = erstelleIndex(k.antworten.map((a, i) => ({ id: String(i), texte: [a.text, ...(VARIANTEN[`${k.id}.${i}`] ?? [])] })), pflegeSynonyme());
    indizes.set(k.id, ix);
  }
  return ix;
}

export function deute(k: Knoten, text: string): Deutung {
  const roh = suche(index(k), text);
  const techniken = erkenneTechniken(text);
  const rangfolge = roh.treffer.map((t) => {
    const a = k.antworten[Number(t.id)]!;
    let wert = t.wert;
    if (techniken.has(a.technik)) wert += ZUSCHLAG;
    else if (techniken.size && [...techniken].every((x) => TECHNIK[x].foerderlich !== TECHNIK[a.technik].foerderlich)) wert -= ZUSCHLAG / 2;
    return { index: Number(t.id), wert: Math.max(0, Math.round(wert * 1000) / 1000) };
  }).sort((a, b) => b.wert - a.wert);
  const [eins, zwei] = rangfolge;
  const sicherheit: Sicherheit = !eins || eins.wert < GRENZEN.unsicher ? 'keiner'
    : eins.wert >= GRENZEN.sicher && eins.wert - (zwei?.wert ?? 0) >= GRENZEN.abstand ? 'sicher' : 'unsicher';
  return { sicherheit, rangfolge, techniken: [...techniken] };
}
