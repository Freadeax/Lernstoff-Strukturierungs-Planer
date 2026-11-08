import './ueben.css';
import { Icon } from '../../ui/icons';
import { PageHeading } from '../../ui/PageHeading';
import { uebenGruppen } from '../../ui/shell/nav';

/** Kurzbeschreibung je Übung (Menü-ID), damit man ohne Ausprobieren weiß, was einen erwartet. */
const TEXT: Record<string, string> = {
  krankheitsbilder: 'Steckbriefe mit Belegen, dazu Fallaufgaben.',
  anatomie: 'Organe, Lage und Funktion abfragen.',
  arzneimittel: 'Wirkstoffe, Wirkung, Nebenwirkungen, Beobachtung.',
  normwerte: 'Vitalwerte und Labor sicher einordnen.',
  hygiene: 'Händehygiene, Schutzausrüstung, Erreger.',
  expertenstandards: 'Die DNQP-Standards und ihre Kernaussagen.',
  recht: 'Haftung, Schweigepflicht, Betreuung, Delegation.',
  rechnen: 'Dosierung, Infusion, Bilanz. Mit Rechenweg.',
  duell: 'Fachbegriffe gegen die Uhr.',
  mindmap: 'Zusammenhänge selbst ordnen.',
  praxis: 'Eine Schicht übernehmen. Ohne KI, offline.',
  fall: 'Pflegefall im Dialog mit der KI.',
  notfall: 'Erkennen, handeln, Reihenfolge einhalten.',
  assessment: 'Braden, Barthel, Schmerzskalen an Fällen.',
  pflegeplanung: 'Probleme, Ziele, Maßnahmen formulieren.',
  sis: 'Strukturierte Informationssammlung üben.',
  bericht: 'Pflegeberichte sachlich und knapp schreiben.',
  uebergabe: 'Übergaben strukturiert sprechen oder schreiben.',
  simulation: 'Klausur unter Prüfungsbedingungen.',
  examen: 'Termine, Checkliste und Schwächen-Radar.',
  fehler: 'Deine Fehler gezielt wiederholen.',
  klasse: 'Fälle mit der Klasse teilen und auswerten.',
};

const UNTERTITEL: Record<string, string> = {
  fachwissen: 'Wissen abfragen und festigen.',
  'praxis-gruppe': 'Mit Fällen und Dokumentation anwenden.',
  'pruefung-gruppe': 'Unter Prüfungsbedingungen testen.',
};

/** „Üben“: alle Trainer in drei Bündeln statt einer langen Liste. */
export default function UebenSeite() {
  return (
    <section className="page ueben">
      <PageHeading eyebrow="Vom Verstehen zum Anwenden" title="Üben"
        description="Fachwissen festigen, in der Praxis anwenden, auf die Prüfung vorbereiten. Welche Übung zu einem Thema passt, steht auch auf jeder Themenseite." />
      <p className="note">Tägliche Wiederholung: <a href="#/lernen/karten">Karteikarten</a>. Geführt durch eine CE: <a href="#/lernen/ce">Curriculare Einheiten</a>.</p>
      {uebenGruppen().map((g) => (
        <section key={g.id} className="ueben__gruppe" aria-labelledby={`ueben-${g.id}`}>
          <div className="section-heading"><div><h2 id={`ueben-${g.id}`}>{g.label}</h2>{UNTERTITEL[g.id] && <span className="muted">{UNTERTITEL[g.id]}</span>}</div></div>
          <ul className="ueben__liste" role="list">
            {g.children!.map((t) => (
              <li key={t.id}>
                <a className="ueben__link" href={`#${t.path}`}>
                  {t.icon && <span className="ueben__icon" aria-hidden="true"><Icon name={t.icon} size={20} /></span>}
                  <span><strong>{t.label}</strong>{TEXT[t.id] && <small>{TEXT[t.id]}</small>}</span>
                  <Icon name="chevronRight" size={16} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
