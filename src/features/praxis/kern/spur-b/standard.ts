// Spur B – Standardmodell des Kerns: Hülle um das Pflege-Physiologiemodell (P1).
// MAP, Perfusion (HZV relativ), paCO₂ und paO₂ kommen aus atmung()/kreislauf() von P1, nicht aus eigenen Formeln.

import { atmung, kreislauf, PFLEGE_MODELL } from '../physiologie/pflegemodell';
import { spurB, type DetailQuelle } from './modul';

export const PFLEGE_DETAILS: DetailQuelle = (g, k) => {
  const a = atmung(g, k);
  const kr = kreislauf(g, k, a.saO2);
  return { map: kr.map, perfusion: kr.perfusion, paco2: a.paCO2, pao2: a.paO2 };
};

/** Standardmodell: ohne Module exakt PFLEGE_MODELL. */
export const SPUR_B_MODELL = spurB(PFLEGE_MODELL, PFLEGE_DETAILS);
