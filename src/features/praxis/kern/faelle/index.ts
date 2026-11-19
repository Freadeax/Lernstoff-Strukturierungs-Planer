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
import { LZ_DEMENZ_ASPIRATION } from './lz-demenz-aspiration';
import { LZ_KOERPERPFLEGE_ABGELEHNT } from './lz-koerperpflege-abgelehnt';
import { LZ_DEMENZ_SCHMERZ } from './lz-demenz-schmerz';
import { AMB_HAUSBESUCH_STILL } from './amb-hausbesuch-still';
import { KH_STERBEPHASE_NACHT } from './kh-sterbephase-nacht';
import { LZ_PALLIATIV_GESPRAECH } from './lz-palliativ-gespraech';
import { LZ_UNTERZUCKER_MITTAG } from './lz-unterzucker-mittag';
import { PAED_FIEBERKRAMPF } from './paed-fieberkrampf';
import { PSY_PANIK_SUIZIDALITAET } from './psy-panik-suizidalitaet';
import { SR_SEPTISCHER_SCHOCK } from './sr-septischer-schock';
import { KH_REANIMATION_BLS } from './kh-reanimation-bls';
import { NA_ACS_BRUSTSCHMERZ } from './na-acs-brustschmerz';
import { LZ_SCHLAGANFALL_AKUT } from './lz-schlaganfall-akut';
import { ITS_BEATMUNG_ALARM } from './its-beatmung-alarm';
import { AMB_HERZSCHWAECHE } from './amb-herzschwaeche';
import { AMB_HYPOGLYKAEMIE } from './amb-hypoglykaemie';
import { LZ_SCHLAGANFALL_REHA } from './lz-schlaganfall-reha';

export const FAELLE_V2: readonly FallV2[] = [PILOT_AMBULANT, KH_PNEUMONIE_SEPSIS, LZ_DEMENZ_SCHMERZ, PAED_FIEBERKRAMPF, PSY_PANIK_SUIZIDALITAET, SR_SEPTISCHER_SCHOCK, KH_ERSTER_TAG, LZ_KOERPERPFLEGE_ABGELEHNT, KH_REHA_ERSTER_WEG,
  // Fallwelle P16a (CE05)
  KH_NACHBLUTUNG, AWR_OPIOID_ATEMDEPRESSION, KH_ANAPHYLAXIE_INFUSION, KH_LUNGENEMBOLIE, KH_MEDIKATIONSVERWECHSLUNG,
  // Fallwelle P16b (CE06 Akutsituationen)
  KH_REANIMATION_BLS, NA_ACS_BRUSTSCHMERZ, LZ_SCHLAGANFALL_AKUT, ITS_BEATMUNG_ALARM,
  // P18 Fallwelle Lebenswelt/Lebensende (CE08/CE09)
  LZ_DEMENZ_ASPIRATION, LZ_UNTERZUCKER_MITTAG, AMB_HAUSBESUCH_STILL, LZ_PALLIATIV_GESPRAECH, KH_STERBEPHASE_NACHT,
  // Fallwelle P17b (CE04/CE07)
  AMB_HERZSCHWAECHE, AMB_HYPOGLYKAEMIE, LZ_SCHLAGANFALL_REHA];
