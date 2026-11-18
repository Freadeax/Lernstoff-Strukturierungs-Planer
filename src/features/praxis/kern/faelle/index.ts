// Fälle auf dem neuen Kern (Fallschema v2). Pilotstaffel E6: 5 Settings, je 1 Fall (Spur A), dazu Spur B.
import type { FallV2 } from '../typen';
import { PILOT_AMBULANT } from './amb-sturz-exsikkose';
import { KH_PNEUMONIE_SEPSIS } from './kh-pneumonie-sepsis';
import { LZ_DEMENZ_SCHMERZ } from './lz-demenz-schmerz';
import { PAED_FIEBERKRAMPF } from './paed-fieberkrampf';
import { PSY_PANIK_SUIZIDALITAET } from './psy-panik-suizidalitaet';
import { SR_SEPTISCHER_SCHOCK } from './sr-septischer-schock';

export const FAELLE_V2: readonly FallV2[] = [PILOT_AMBULANT, KH_PNEUMONIE_SEPSIS, LZ_DEMENZ_SCHMERZ, PAED_FIEBERKRAMPF, PSY_PANIK_SUIZIDALITAET, SR_SEPTISCHER_SCHOCK];
