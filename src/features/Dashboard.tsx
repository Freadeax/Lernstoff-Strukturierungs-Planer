import { WidgetGrid } from '../ui/widget/Dashboard';
import { FilterBar } from '../widgets/filter/FilterBar';
import { WIDGETS } from '../widgets/registry';
import { Icon, type IconName } from '../ui/icons';
import { PageHeading } from '../ui/PageHeading';
import { useStore } from '../ui/lib/store';
import { merkliste } from '../ui/shell/merkliste';
import { seitenName } from '../ui/shell/nav';
import { HeuteKarte } from './lernplan/ui/HeuteKarte';
import { SicherungsHinweis } from './sicherung/SicherungsHinweis';
import { FehlerheftHinweis } from './fehlerheft/FehlerheftHinweis';
import { ExamenHinweis } from './examen/ExamenHinweis';
import { FortschrittKarte } from './fortschritt/FortschrittKarte';

/** Die drei Bündel unter „Üben“ als Einstieg; die vollständige Liste steht auf der Übungsseite. */
const UEBEN: Array<{ title: string; text: string; icon: IconName; tag: string; gruppe: string }> = [
  { gruppe: 'fachwissen', tag: 'Fachwissen', title: 'Wissen festigen', text: 'Krankheitsbilder, Arzneimittel, Anatomie, Normwerte, Recht.', icon: 'book' },
  { gruppe: 'praxis', tag: 'Praxis', title: 'Praxis anwenden', text: 'Schicht übernehmen, Notfall, Assessments, SIS, Übergabe.', icon: 'user' },
  { gruppe: 'pruefung', tag: 'Prüfung', title: 'Prüfungsbereit werden', text: 'Prüfungssimulation, Examen, Fehlerheft.', icon: 'timer' },
];

/** Läuft im Praxissimulator noch ein Fall oder eine Schicht? Nur der Schlüssel wird geprüft, der Simulator selbst bleibt ungeladen. */
function fallLaeuft(): boolean {
  try { return !!(localStorage.getItem('lernstoff.praxis.schicht') || localStorage.getItem('lernstoff.praxis.aktuell')); } catch { return false; }
}

/** Die fünf häufigsten Wege, jeder mit einem Tipp erreichbar. */
function Schnellwege() {
  const wege: Array<[string, string, IconName]> = [
    ['Prüfung planen', '/lernen/plan?ansicht=pruefungen&neu=1', 'calendar'],
    ['Quelle finden', '/material/dokumente', 'folder'],
    ['Fällige Karten lernen', '/lernen/karten', 'cards'],
    [fallLaeuft() ? 'Fall fortsetzen' : 'Fall starten', '/lernen/praxis', 'user'],
    ['Sicherung erstellen', '/system/sicherung', 'save'],
  ];
  const zuletzt = useStore(merkliste, (m) => m.zuletzt).filter((p) => seitenName(p)).slice(0, 4);
  return (
    <>
      <nav className="schnellwege" aria-label="Schnellwege">
        {wege.map(([name, ziel, icon]) => <a key={ziel} className="schnellweg" href={`#${ziel}`}><Icon name={icon} size={18} />{name}</a>)}
      </nav>
      {zuletzt.length > 0 && (
        <nav className="schnellwege schnellwege--zuletzt" aria-label="Zuletzt genutzt">
          <span className="schnellwege__titel">Zuletzt</span>
          {zuletzt.map((p) => <a key={p} className="schnellweg schnellweg--leise" href={`#${p}`}>{seitenName(p)}</a>)}
        </nav>
      )}
    </>
  );
}

export function Dashboard() {
  const date = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' }).format(new Date());
  return (
    <section className="page dashboard">
      <PageHeading bild="heute" eyebrow={date} title="Ein klarer Kopf. Ein guter Plan."
        description="Dein Lernstoff, deine nächsten Schritte und Raum für Fortschritt."
        action={<a className="button-link primary" href="#/material/import"><Icon name="plus" size={18} /> Material hinzufügen</a>} />
      <HeuteKarte />
      <Schnellwege />
      <ExamenHinweis />
      <FortschrittKarte />
      <FehlerheftHinweis />
      <section aria-labelledby="tools-title" className="tools-section">
        <div className="section-heading"><div><p className="eyebrow">Vom Verstehen zum Anwenden</p><h2 id="tools-title">Üben</h2></div><a className="text-link" href="#/lernen/ueben">Alle Übungen <Icon name="chevronRight" size={16} /></a></div>
        <div className="tool-grid tool-grid--drei">{UEBEN.map((t) => <a key={t.tag} className="tool-link" href={`#/lernen/ueben?gruppe=${t.gruppe}`}>
          <span className="tool-link__icon"><Icon name={t.icon} size={22} /></span><span className="tool-link__tag">{t.tag}</span><h3>{t.title}</h3><p>{t.text}</p><Icon name="chevronRight" size={18} />
        </a>)}</div>
      </section>
      <section className="dashboard-insights" aria-labelledby="insights-title">
        <div className="section-heading"><div><p className="eyebrow">Dein Überblick</p><h2 id="insights-title">Fortschritt wird sichtbar.</h2></div></div>
        <FilterBar />
        <WidgetGrid widgets={[WIDGETS.kpi, WIDGETS.charts, WIDGETS.feed]} />
      </section>
      <SicherungsHinweis />
    </section>
  );
}
