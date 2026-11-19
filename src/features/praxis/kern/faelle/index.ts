// Fälle auf dem neuen Kern (Fallschema v2). Pilotstaffel E6: 5 Settings, je 1 Fall (Spur A), dazu Spur B.
import type { FallV2 } from '../typen';
import { PILOT_AMBULANT } from './amb-sturz-exsikkose';
import { KH_PNEUMONIE_SEPSIS } from './kh-pneumonie-sepsis';
import { LZ_DEMENZ_ASPIRATION } from './lz-demenz-aspiration';
import { LZ_DEMENZ_SCHMERZ } from './lz-demenz-schmerz';
import { AMB_HAUSBESUCH_STILL } from './amb-hausbesuch-still';
import { KH_STERBEPHASE_NACHT } from './kh-sterbephase-nacht';
import { LZ_PALLIATIV_GESPRAECH } from './lz-palliativ-gespraech';
import { LZ_UNTERZUCKER_MITTAG } from './lz-unterzucker-mittag';
import { PAED_FIEBERKRAMPF } from './paed-fieberkrampf';
import { PSY_PANIK_SUIZIDALITAET } from './psy-panik-suizidalitaet';
import { SR_SEPTISCHER_SCHOCK } from './sr-septischer-schock';

export const FAELLE_V2: readonly FallV2[] = [PILOT_AMBULANT, KH_PNEUMONIE_SEPSIS, LZ_DEMENZ_SCHMERZ, PAED_FIEBERKRAMPF, PSY_PANIK_SUIZIDALITAET, SR_SEPTISCHER_SCHOCK,
  // P18 Fallwelle Lebenswelt/Lebensende (CE08/CE09)
  LZ_DEMENZ_ASPIRATION, LZ_UNTERZUCKER_MITTAG, AMB_HAUSBESUCH_STILL, LZ_PALLIATIV_GESPRAECH, KH_STERBEPHASE_NACHT];
