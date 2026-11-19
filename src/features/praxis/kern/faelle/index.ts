// Fälle auf dem neuen Kern (Fallschema v2). Pilotstaffel E6: 5 Settings, je 1 Fall (Spur A), dazu Spur B.
import type { FallV2 } from '../typen';
import { PILOT_AMBULANT } from './amb-sturz-exsikkose';
import { KH_ERSTER_TAG } from './kh-erster-tag';
import { KH_REHA_ERSTER_WEG } from './kh-reha-erster-weg';
import { KH_PNEUMONIE_SEPSIS } from './kh-pneumonie-sepsis';
import { LZ_KOERPERPFLEGE_ABGELEHNT } from './lz-koerperpflege-abgelehnt';
import { LZ_DEMENZ_SCHMERZ } from './lz-demenz-schmerz';
import { PAED_ASTHMA_SCHULKIND } from './paed-asthma-schulkind';
import { PAED_BRONCHIOLITIS_SAEUGLING } from './paed-bronchiolitis-saeugling';
import { PAED_FIEBERKRAMPF } from './paed-fieberkrampf';
import { PAED_GASTROENTERITIS_KLEINKIND } from './paed-gastroenteritis-kleinkind';
import { PAED_RAUSCH_JUGENDLICHE } from './paed-rausch-jugendliche';
import { KH_DELIR_NACHT } from './kh-delir-nacht';
import { PSY_UNRUHE_DEESKALATION } from './psy-unruhe-deeskalation';
import { KH_ALKOHOLENTZUG } from './kh-alkoholentzug';
import { PSY_PANIK_SUIZIDALITAET } from './psy-panik-suizidalitaet';
import { SR_SEPTISCHER_SCHOCK } from './sr-septischer-schock';

export const FAELLE_V2: readonly FallV2[] = [PILOT_AMBULANT, KH_PNEUMONIE_SEPSIS, LZ_DEMENZ_SCHMERZ, PAED_FIEBERKRAMPF, PSY_PANIK_SUIZIDALITAET, SR_SEPTISCHER_SCHOCK, KH_ERSTER_TAG, LZ_KOERPERPFLEGE_ABGELEHNT, KH_REHA_ERSTER_WEG,
  // Fallwelle P19 (CE 10/11)
  PAED_ASTHMA_SCHULKIND, PAED_BRONCHIOLITIS_SAEUGLING, PAED_GASTROENTERITIS_KLEINKIND, PAED_RAUSCH_JUGENDLICHE,
  KH_DELIR_NACHT, PSY_UNRUHE_DEESKALATION, KH_ALKOHOLENTZUG,
];
