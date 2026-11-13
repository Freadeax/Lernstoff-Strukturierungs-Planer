import './wegweiser.css';
import { PageHeading } from '../../ui/PageHeading';
import { BEGRIFFE, FRAGEN, BOARD_SPALTEN, BUENDEL, KREISLAUF, PRUEFUNGSPHASEN, seitenInfo, WISSENSSTUFEN, type Link } from './inhalt';

const ABSCHNITTE = [['ww-kreislauf', 'Lernkreislauf'], ['ww-seiten', 'Welche Seite wofür'], ['ww-stand', 'Arbeits- und Wissensstand'], ['ww-pruefung', 'Prüfungsvorbereitung'], ['ww-fragen', 'Häufige Fragen'], ['ww-begriffe', 'Begriffe']] as const;

const Verweis = ({ link }: { link: Link }) => <a href={`#${link.path}`}>{link.label}</a>;

/** „So lernst du hier“: Lernkreislauf, welche Seite wofür, Arbeits- und Wissensstand, Begriffe, Prüfungsvorbereitung. */
export default function WegweiserSeite() {
  return (
    <section className="page wegweiser">
      <PageHeading eyebrow="Für den Einstieg" title="So lernst du hier."
        description="Wie Lernplan, Themen, Karteikarten und Prüfungsvorbereitung zusammenhängen und was die Begriffe bedeuten. In fünf Minuten gelesen, ohne Vorwissen." />

      <nav className="wegweiser__inhalt" aria-label="Auf dieser Seite">
        {ABSCHNITTE.map(([id, name]) => <button key={id} type="button" className="ghost small" onClick={() => document.getElementById(id)?.scrollIntoView({ block: 'start' })}>{name}</button>)}
      </nav>

      <section aria-labelledby="ww-kreislauf">
        <h2 id="ww-kreislauf">Der Lernkreislauf in vier Schritten</h2>
        <p className="muted">Jedes Thema läuft diese Schritte durch. Die App übernimmt das Planen und Erinnern, du übernimmst das Lernen.</p>
        <ol className="wegweiser__kreislauf">
          {KREISLAUF.map((k, i) => (
            <li key={k.titel} className="card">
              <span className="wegweiser__nr" aria-hidden="true">{i + 1}</span>
              <h3>{k.titel}</h3>
              <p>{k.text}</p>
              <p className="wegweiser__links">{k.links.map((l) => <Verweis key={l.path} link={l} />)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ww-seiten">
        <h2 id="ww-seiten">Welche Seite wofür?</h2>
        <p className="muted">Viele Seiten zeigen denselben Stoff aus anderer Sicht. Für den Anfang reichen die vier Seiten unter „Jeden Tag“.</p>
        {BUENDEL.map((b) => (
          <div key={b.titel} className="wegweiser__buendel">
            <h3>{b.titel}</h3>
            <p className="muted">{b.text}</p>
            <dl className="wegweiser__seiten">
              {b.pfade.map((p) => seitenInfo(p)).filter((s) => !!s).map((s) => (
                <div key={s.path} className="wegweiser__seite">
                  <dt><a href={`#${s.path}`}>{s.name}</a></dt>
                  <dd>{s.wozu} <span className="muted">{s.wann}</span></dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>

      <section aria-labelledby="ww-stand">
        <h2 id="ww-stand">Zwei Arten von Stand</h2>
        <p className="muted">Die häufigste Verwechslung: Etwas durchgearbeitet zu haben heißt noch nicht, es zu können. Deshalb zeigt die App beides getrennt.</p>
        <div className="wegweiser__zwei">
          <div className="card">
            <h3>Arbeitsstand</h3>
            <p>Was du mit einem Thema <strong>gemacht</strong> hast. Du setzt ihn selbst auf dem <a href="#/lernen/board">Themenboard</a>.</p>
            <dl className="wegweiser__stufen">{BOARD_SPALTEN.map((s) => <div key={s.name}><dt>{s.name}</dt><dd>{s.text}</dd></div>)}</dl>
          </div>
          <div className="card">
            <h3>Wissensstand</h3>
            <p>Was du von einem Thema <strong>kannst</strong>. Die App berechnet ihn aus Abfragen, im <a href="#/lernen/plan?ansicht=wissensstand">Lernplan unter „Wissensstand“</a>.</p>
            <dl className="wegweiser__stufen">{WISSENSSTUFEN.map((s) => <div key={s.name}><dt>{s.name}</dt><dd>{s.text}</dd></div>)}</dl>
          </div>
        </div>
      </section>

      <section aria-labelledby="ww-pruefung">
        <h2 id="ww-pruefung">Prüfungsvorbereitung über alle CE</h2>
        <p className="muted">Das Examen fragt Stoff aus der ganzen Ausbildung ab. So verteilst du die Vorbereitung, ohne am Ende alles neu lernen zu müssen. Die Zeiträume sind Richtwerte, maßgeblich sind die Vorgaben deiner Schule.</p>
        <ol className="wegweiser__phasen">
          {PRUEFUNGSPHASEN.map((ph) => (
            <li key={ph.titel} className="card">
              <p className="eyebrow">{ph.wann}</p>
              <h3>{ph.titel}</h3>
              <ul>{ph.schritte.map((s) => <li key={s.text}>{s.text}{s.link && <> <Verweis link={s.link} /></>}</li>)}</ul>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ww-fragen">
        <h2 id="ww-fragen">Häufige Fragen</h2>
        <div className="wegweiser__fragen">
          {FRAGEN.map((f) => (
            <details key={f.frage} className="note">
              <summary>{f.frage}</summary>
              <p>{f.antwort}{f.link && <> <Verweis link={f.link} /></>}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="ww-begriffe">
        <h2 id="ww-begriffe">Begriffe</h2>
        <dl className="wegweiser__begriffe">
          {BEGRIFFE.map((b) => (
            <div key={b.wort}>
              <dt>{b.wort}</dt>
              <dd>{b.text}{b.link && <> <Verweis link={b.link} /></>}</dd>
            </div>
          ))}
        </dl>
      </section>
    </section>
  );
}
