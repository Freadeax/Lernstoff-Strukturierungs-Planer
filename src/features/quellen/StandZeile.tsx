// Sichtbarer Aktualisierungsstand an einem Inhalt: Quellen mit Stand, Hinweis auf neue Fassungen oder
// offene Abgleiche und Link zur Seite „Quellen und Aktualität“.

import type { Quelle } from '../../ui/sim/freigabe';
import { eintraegeFuer, jahr } from './register';
import './quellen.css';

export function StandZeile({ quellen, inhaltsstand }: { quellen: readonly Quelle[]; inhaltsstand?: string }) {
  if (!quellen.length) return null;
  const hinweise = quellen.flatMap((q) => eintraegeFuer(q.titel)
    .filter((e) => e.offen || jahr(q.stand) < jahr(e.aktuell.stand))
    .map((e) => ({ e, text: jahr(q.stand) < jahr(e.aktuell.stand) ? `${e.titel}: neue Fassung ${e.aktuell.stand}, hier noch Stand ${q.stand}` : `${e.titel}: ${e.aktuell.stand}, Abgleich offen` })));
  const eindeutig = [...new Map(hinweise.map((h) => [h.e.id, h])).values()];
  return (
    <p className={`quellen-stand${eindeutig.length ? ' quellen-stand--offen' : ''}`}>
      {inhaltsstand && <>Inhaltsstand {inhaltsstand} · </>}
      Quellen: {quellen.map((q) => `${q.titel} (${q.stand})`).join('; ')}
      {eindeutig.length > 0 && <><br /><strong>Neu erschienen:</strong> {eindeutig.map((h) => h.text).join('; ')}.</>}
      {' '}<a href={`#/system/quellen${eindeutig[0] ? `?quelle=${encodeURIComponent(eindeutig[0].e.id)}` : ''}`}>Quellen und Aktualität</a>
    </p>
  );
}
