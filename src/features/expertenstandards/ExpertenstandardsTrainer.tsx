import { TrainerSeite } from '../quiz/TrainerSeite';
import { standardGrundlage } from '../quiz/grundlage';
import type { Aufgabe } from '../quiz/quiz';
import { pfadZu, STANDARDS } from '../dnqp/standards';
import { AUFGABEN, BEREICHE } from './aufgaben';

/** Nach dem Prüfen: passende Standards im DNQP-Lernmodul nachlesen. */
function weiter(a: Aufgabe) {
  const passend = STANDARDS.filter((s) => s.themaIds.some((t) => a.topicIds.includes(t)));
  return passend.length
    ? passend.map((s) => ({ label: `${s.kurztitel} nachlesen`, path: pfadZu(s.id) }))
    : [{ label: 'Alle Expertenstandards nachlesen', path: pfadZu() }];
}

export default function ExpertenstandardsTrainer() {
  return (
    <TrainerSeite grundlage={standardGrundlage}
      titel="Expertenstandards-Trainer"
      intro="Aufbau der DNQP-Expertenstandards (Struktur, Prozess, Ergebnis) und ihre Kernaussagen zu Dekubitus, Sturz, Ernährung, Kontinenz, Schmerz, chronischen Wunden, Entlassung und Demenz. Funktioniert offline."
      hinweis="Die Aufgaben fassen Kernaussagen zusammen und ersetzen nicht den Originaltext. Alle Standards mit Ebenen und aktuellen Fassungen stehen unter Lernen → Expertenstandards (DNQP)."
      pfad="/lernen/expertenstandards" quelle="expertenstandards" bereiche={BEREICHE} aufgaben={AUFGABEN} weiter={weiter}
    />
  );
}
