// Fertigkeiten-Trainer: alles, was man mit Händen, Ohren und Taschenrechner übt, an einem Ort
// (bis November 2026 verteilt auf Notfall-Trainer, Ablauf-Werkbank, Hör-Trainer, Rechentrainer,
// Labor-Trainer und Hygiene-Trainer). Die Übungen selbst bleiben, wie sie sind.
import { lazy, Suspense, useState, type ReactNode } from 'react';
import './fertigkeiten.css';
import '../notfall/notfall.css';
import { useRoute } from '../../ui/shell/router';
import { Icon, type IconName } from '../../ui/icons';
import { PageHeading } from '../../ui/PageHeading';
import { FERTIG_PFAD, fertigPfad, istUebung, UEBUNG_IDS, UEBUNG_NAME, type UebungId } from './pfad';
import { HANDLUNGSVIDEOS, type HandlungsVideoId } from '../../ui/sim/handlungsvideos';

const Reanimation = lazy(() => import('../notfall/Reanimation').then((m) => ({ default: m.Reanimation })));
const ABCDE = lazy(() => import('../notfall/ABCDE').then((m) => ({ default: m.ABCDE })));
const AblaufSeite = lazy(() => import('../ablauf/AblaufSeite'));
const Rechentrainer = lazy(() => import('../rechnen/Rechentrainer'));
const HoerTrainer = lazy(() => import('../hoeren/HoerTrainer'));
const Werkbank = lazy(() => import('../labortrainer/werkbank/Werkbank'));
const HandlungsVideo = lazy(() => import('../../ui/sim/HandlungsVideo').then((m) => ({ default: m.HandlungsVideo })));
const Suchbilder = lazy(() => import('../hygiene/Suchbild').then((m) => ({ default: m.Suchbilder })));

interface Info { icon: IconName; text: string; minuten: number; zaehlt: string }

export const UEBUNG_INFO_FERTIG: Record<UebungId, Info> = {
  rea: { icon: 'heart', minuten: 5, text: 'Erwachsene, Kinder und Neugeborene: erkennen, im richtigen Verhältnis drücken und beatmen, Rhythmus einordnen.', zaehlt: 'Ergebnis je Durchgang' },
  abcde: { icon: 'siren', minuten: 6, text: 'Akute Notfälle nach dem ABCDE-Schema: einschätzen, Hilfe holen, handeln, Wirkung erneut prüfen.', zaehlt: 'Ergebnis je Fall' },
  ablauf: { icon: 'clipboard', minuten: 5, text: 's.c.-Injektion, Medikamente richten, Verbandwechsel, Blasenkatheter: selbst durchführen oder Fehler im Ablauf finden.', zaehlt: 'Lernplan je Ablauf, erster Versuch des Tages' },
  rechnen: { icon: 'calc', minuten: 10, text: 'Dosierung, Infusion, Tabletten, Verdünnung, Bilanz: unendlich viele Aufgaben mit Rechenweg und Prüfungsrunde.', zaehlt: 'Prüfungsrunde im Lernplan, Fehler ins Fehlerheft' },
  hoeren: { icon: 'stetho', minuten: 5, text: 'Herztöne, Atem- und Darmgeräusche, Monitoralarme und Blutdruck nach Gehör messen.', zaehlt: 'Eigener Stand im Hör-Trainer' },
  werkbank: { icon: 'flask', minuten: 8, text: 'Blut selbst abnehmen (Röhrchen, Stauzeit, Infusionsarm), Kumulativbefund lesen, kritischen Wert per SBAR melden.', zaehlt: 'Rückmeldung je Station' },
  suchbilder: { icon: 'shield', minuten: 3, text: 'Hygienefehler und richtige Handgriffe im Raumfoto finden.', zaehlt: 'Fundstellen je Bild' },
};

function Leiste({ aktiv }: { aktiv?: UebungId }) {
  return (
    <nav className="pills fertig-leiste" aria-label="Fertigkeit wählen">
      <a className="pill" href={`#${FERTIG_PFAD}`} aria-current={aktiv ? undefined : 'page'}>Übersicht</a>
      {UEBUNG_IDS.map((u) => <a key={u} className="pill" href={`#${fertigPfad(u)}`} aria-current={aktiv === u ? 'page' : undefined}>{UEBUNG_NAME[u]}</a>)}
    </nav>
  );
}

/** Übung, die keine eigene Seite mitbringt: mit Kopf und Hinweis einrahmen. */
function Rahmen({ titel, text, children }: { titel: string; text: string; children: ReactNode }) {
  return (
    <section className="page notfall">
      <div className="page__head"><h1>{titel}</h1><p className="muted">{text}</p></div>
      {children}
    </section>
  );
}

function Uebung({ id }: { id: UebungId }) {
  switch (id) {
    case 'rea': return <Rahmen titel="Reanimation üben" text={`${UEBUNG_INFO_FERTIG.rea.text} Grundlage: ERC-Leitlinien 2025. Ersetzt kein praktisches Reanimationstraining.`}><Reanimation /></Rahmen>;
    case 'abcde': return <Rahmen titel="ABCDE-Notfall" text={UEBUNG_INFO_FERTIG.abcde.text}><ABCDE /></Rahmen>;
    case 'werkbank': return <Rahmen titel="Labor-Werkbank" text="Blut selbst abnehmen und sehen, welche Werte ein Fehler verfälscht. Verläufe im Kumulativbefund lesen. Einen kritischen Wert annehmen und per SBAR melden. Alle Fälle sind fiktiv und fachlich vereinfacht."><Werkbank /></Rahmen>;
    case 'ablauf': return <AblaufSeite />;
    case 'rechnen': return <Rechentrainer />;
    case 'hoeren': return <HoerTrainer />;
    case 'suchbilder': return <Suchbilder />;
  }
}

/** Lernclips: Handgriffe in vier Phasen ansehen (Video oder Schritt für Schritt), ohne Wertung. */
function Lernclips() {
  const [offen, setOffen] = useState<HandlungsVideoId | null>(null);
  return (
    <section className="card fertig__clips" aria-labelledby="fertig-clips-titel">
      <h2 id="fertig-clips-titel">Lernclips</h2>
      <p className="muted">Handgriffe in vier Phasen ansehen, als Video oder Schritt für Schritt mit Bild. Nur zum Ansehen, ohne Wertung.</p>
      <ul className="fertig__clipliste" role="list">
        {(Object.keys(HANDLUNGSVIDEOS) as HandlungsVideoId[]).map((id) => (
          <li key={id}><button type="button" onClick={() => setOffen(id)}><Icon name="sparkle" size={16} /> {HANDLUNGSVIDEOS[id].titel}</button></li>
        ))}
      </ul>
      {offen && <Suspense fallback={null}><HandlungsVideo id={offen} onClose={() => setOffen(null)} /></Suspense>}
    </section>
  );
}

function Uebersicht() {
  return (
    <section className="page fertig">
      <PageHeading bild="ueben" eyebrow="Üben · Praxis" title="Fertigkeiten-Trainer"
        description="Handgriffe, Notfallabläufe, Rechnen und Hören: alles, was man mit Händen, Ohren und Taschenrechner übt. Funktioniert offline." />
      <Leiste />
      <ul className="fertig__liste" role="list">
        {UEBUNG_IDS.map((u) => {
          const i = UEBUNG_INFO_FERTIG[u];
          return (
            <li key={u}>
              <a className="card fertig__karte" href={`#${fertigPfad(u)}`}>
                <span className="fertig__icon" aria-hidden="true"><Icon name={i.icon} size={20} /></span>
                <span className="fertig__text">
                  <strong>{UEBUNG_NAME[u]}</strong>
                  <small className="muted">{i.text}</small>
                  <small className="muted">etwa {i.minuten} min · {i.zaehlt}</small>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <Lernclips />
      <p className="muted">Wissensfragen zu Notfall, Labor und Hygiene stehen im <a href="#/lernen/wissen">Wissenstrainer</a>.</p>
    </section>
  );
}

export default function FertigkeitenSeite() {
  const { params } = useRoute();
  const u = params.get('uebung');
  if (!istUebung(u)) return <Uebersicht />;
  return (
    <div className="page fertig-rahmen">
      <Leiste aktiv={u} />
      <Suspense fallback={<p className="muted">Wird geladen …</p>}><Uebung key={u} id={u} /></Suspense>
    </div>
  );
}
