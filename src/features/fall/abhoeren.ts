// Abhören am Patienten: welches Atem- und Herzgeräusch zu welchem Fall passt (Klänge aus dem
// gemeinsamen Audio-Baustein, synthetische Nachbildungen). Nur für Fälle, deren Befund feststeht;
// sonst gibt es keinen Abhörknopf, damit Klang und KI-Text sich nicht widersprechen.

import type { KlangId } from '../../ui/audio/klaenge';

export interface AbhoerBefund { lunge: KlangId; herz: KlangId; text: string }

const RASSELN_S3: AbhoerBefund = { lunge: 'atem-rg', herz: 'herz-s3', text: 'Feuchte Rasselgeräusche über beiden Lungenunterfeldern, dazu ein dritter Herzton (Galopp): typisch für eine Lungenstauung bei Herzinsuffizienz.' };
const GIEMEN: AbhoerBefund = { lunge: 'atem-giemen', herz: 'herz-tachy', text: 'Giemen und Brummen mit deutlich verlängerter Ausatmung, das Herz schlägt schnell: typisch für verengte Atemwege beim Asthmaanfall.' };
const NORMAL_SCHNELL: AbhoerBefund = { lunge: 'atem-vesikulaer', herz: 'herz-normal', text: 'Normales Atemgeräusch beidseits, die Herztöne sind regelmäßig, aber schnell.' };

const BEFUND: Record<string, AbhoerBefund> = {
  'demo-atemnot': RASSELN_S3,
  herzinsuffizienz: RASSELN_S3,
  'demo-asthma': GIEMEN,
  'asthma-kind': GIEMEN,
  copd: { lunge: 'atem-giemen', herz: 'herz-normal', text: 'Giemen und Brummen, verlängerte Ausatmung, insgesamt eher leises Atemgeräusch: passend zur COPD-Verschlechterung.' },
  pneumonie: { lunge: 'atem-rg', herz: 'herz-normal', text: 'Feinblasige Rasselgeräusche über dem rechten Unterfeld, die Herztöne sind schnell: passend zu einer Lungenentzündung.' },
  'demo-nachblutung': { ...NORMAL_SCHNELL, text: 'Atemgeräusch unauffällig, die Herztöne sind regelmäßig und schnell. Die Ursache liegt hier nicht in der Lunge, sondern im Volumenmangel.' },
  nachblutung: { ...NORMAL_SCHNELL, text: 'Atemgeräusch unauffällig, die Herztöne sind regelmäßig und schnell. Die Ursache liegt hier nicht in der Lunge, sondern im Volumenmangel.' },
  'demo-hypo': { ...NORMAL_SCHNELL, text: 'Atemgeräusch unauffällig, die Herztöne sind regelmäßig und etwas schnell. Das Abhören erklärt die Unruhe nicht, der Blutzucker schon.' },
  lungenembolie: { ...NORMAL_SCHNELL, text: 'Atemgeräusch oft unauffällig, das Herz schlägt schnell. Ein unauffälliger Lungenbefund schließt eine Lungenembolie nicht aus.' },
  'sturz-nacht': { lunge: 'atem-vesikulaer', herz: 'herz-arrhythmie', text: 'Normales Atemgeräusch. Die Herztöne sind völlig unregelmäßig: passend zum bekannten Vorhofflimmern.' },
};

export const abhoerBefund = (szenarioId: string): AbhoerBefund | null => BEFUND[szenarioId] ?? null;
