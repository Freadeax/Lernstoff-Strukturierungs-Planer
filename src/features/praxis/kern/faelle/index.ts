// Fälle auf dem neuen Kern (Fallschema v2). Pilotstaffel E6: 5 Settings, je 1 Fall (Spur A), dazu Spur B.
import type { FallV2 } from '../typen';
import { AWR_OPIOID_ATEMDEPRESSION } from './awr-opioid-atemdepression';
import { KH_ANAPHYLAXIE_INFUSION } from './kh-anaphylaxie-infusion';
import { PILOT_AMBULANT } from './amb-sturz-exsikkose';
import { KH_LUNGENEMBOLIE } from './kh-lungenembolie';
import { KH_MEDIKATIONSVERWECHSLUNG } from './kh-medikationsverwechslung';
import { KH_NACHBLUTUNG } from './kh-nachblutung';
import { KH_ERSTER_TAG } from './kh-erster-tag';
import { KH_REHA_ERSTER_WEG } from './kh-reha-erster-weg';
import { KH_PNEUMONIE_SEPSIS } from './kh-pneumonie-sepsis';
import { LZ_KOERPERPFLEGE_ABGELEHNT } from './lz-koerperpflege-abgelehnt';
import { LZ_DEMENZ_SCHMERZ } from './lz-demenz-schmerz';
import { PAED_FIEBERKRAMPF } from './paed-fieberkrampf';
import { PSY_PANIK_SUIZIDALITAET } from './psy-panik-suizidalitaet';
import { SR_SEPTISCHER_SCHOCK } from './sr-septischer-schock';

export const FAELLE_V2: readonly FallV2[] = [PILOT_AMBULANT, KH_PNEUMONIE_SEPSIS, LZ_DEMENZ_SCHMERZ, PAED_FIEBERKRAMPF, PSY_PANIK_SUIZIDALITAET, SR_SEPTISCHER_SCHOCK, KH_ERSTER_TAG, LZ_KOERPERPFLEGE_ABGELEHNT, KH_REHA_ERSTER_WEG,
  KH_NACHBLUTUNG, AWR_OPIOID_ATEMDEPRESSION, KH_ANAPHYLAXIE_INFUSION, KH_LUNGENEMBOLIE, KH_MEDIKATIONSVERWECHSLUNG];
