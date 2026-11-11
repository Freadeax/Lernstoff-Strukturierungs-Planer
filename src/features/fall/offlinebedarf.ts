// Was ein Fall im Fallsimulator offline braucht (Audit SIM-04): Raumfoto samt Varianten,
// Materialraum auf Station, Porträt. Ersatzansicht ist immer die gezeichnete Szene.
// KI-Fälle brauchen grundsätzlich Netz, Probefälle nicht.

import type { OfflineBedarf } from '../../ui/sim/offline';
import { raumDateien } from '../../ui/sim/offline';
import { personFuer, portraetUrl } from '../../ui/sim/personen';
import { raumUrl } from '../../ui/sim/raeume/katalog';
import type { Szenario } from './faelle';
import { istDemo } from './demo';
import { fotoRaumFuer } from './fotoraeume';

export function fallOfflineBedarf(s: Szenario): OfflineBedarf {
  const raum = fotoRaumFuer(s.id, s.setting, s.kurz);
  const person = personFuer('fall', s.id);
  const dateien = [
    ...(raum ? raumDateien(raum.id) : []),
    ...(s.setting === 'krankenhaus' ? [raumUrl('19_krankenhaus_materialraum')] : []),
    ...(person ? [portraetUrl(person)] : []),
  ];
  return { dateien, ersatz: true, online: !istDemo({ szenario: s }) };
}
