import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../core/db';
import { geraet } from '../core/geraetestand';
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
import { EinsatzHinweis } from './einsatz/EinsatzHinweis';

/** Die drei Bündel unter „Üben“ als Einstieg; die vollständige Liste steht auf der Übungsseite. */
const UEBEN: Array<{ title: string; text: string; icon: IconName; tag: string; gruppe: string }> = [
  { gruppe: 'fachwissen', tag: 'Fachwissen', title: 'Wissen festigen', text: 'Krankheitsbilder, Arzneimittel, Anatomie, Normwerte, Recht.', icon: 'book' },
  { gruppe: 'praxis', tag: 'Praxis', title: 'Praxis anwenden', text: 'Schicht übernehmen, Notfall, Assessments, SIS, Übergabe.', icon: 'user' },
  { gruppe: 'pruefung', tag: 'Prüfung', title: 'Prüfungsbereit werden', text: 'Prüfungssimulation, Examen, Fehlerheft.', icon: 'timer' },
];

/** Läuft im Praxissimulator noch ein Fall (Arbeitsplatz oder Stufe 1)? Nur der Schlüssel wird geprüft, der Simulator selbst bleibt ungeladen. */
function fallLaeuft(): boolean {
  try { return !!(geraet.getItem('lernstoff.praxis.arbeitsplatz') || geraet.getItem('lernstoff.praxis.stufe1')); } catch { return false; }
}

/** Die häufigsten Wege, jeder mit einem Tipp erreichbar. Der letzte erklärt Neuen, wie die Lernseiten zusammenhängen. */
function Schnellwege() {
  const wege: Array<[string, string, IconName]> = [
    ['Prüfung planen', '/lernen/plan?ansicht=pruefungen&neu=1', 'calendar'],
    ['Quelle finden', '/material/dokumente', 'folder'],
    ['Fällige Karten lernen', '/lernen/karten', 'cards'],
    [fallLaeuft() ? 'Fall fortsetzen' : 'Fall starten', '/lernen/praxis', 'user'],
    ['Sicherung erstellen', '/system/sicherung', 'save'],
    ['So lernst du hier', '/lernen/wegweiser', 'sparkle'],
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

/** Gibt es schon irgendetwas, das der Überblick zeigen kann? `undefined`, solange die Datenbank antwortet. */
function useHatLerndaten(): boolean | undefined {
  const [da, setDa] = useState<boolean>();
  useEffect(() => {
    const sub = liveQuery(async () => (await Promise.all([db.activity.count(), db.documents.count(), db.summaries.count(), db.board.count()])).some((n) => n > 0))
      .subscribe({ next: setDa, error: () => setDa(true) });
    return () => sub.unsubscribe();
  }, []);
  return da;
}

/** Überblick mit Filter und Kennzahlen erst, wenn es etwas zu zeigen gibt. Vorher ein kurzer Satz statt drei leerer Karten (Audit U-1). */
function Ueberblick() {
  const da = useHatLerndaten();
  if (da === undefined) return null;
  return (
    <section className="dashboard-insights" aria-labelledby="insights-title">
      <div className="section-heading"><div><p className="eyebrow">Dein Überblick</p><h2 id="insights-title">Fortschritt wird sichtbar.</h2></div></div>
      {da ? <>
        <FilterBar />
        <WidgetGrid widgets={[WIDGETS.kpi, WIDGETS.charts, WIDGETS.feed]} />
      </> : <p className="card dashboard-insights__leer">Sobald du lernst oder Material hinzufügst, stehen hier Kennzahlen, Verlauf und deine letzten Schritte.</p>}
    </section>
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
      <EinsatzHinweis />
      <FortschrittKarte />
      <FehlerheftHinweis />
      <section aria-labelledby="tools-title" className="tools-section">
        <div className="section-heading"><div><p className="eyebrow">Vom Verstehen zum Anwenden</p><h2 id="tools-title">Üben</h2></div><a className="text-link" href="#/lernen/ueben">Alle Übungen <Icon name="chevronRight" size={16} /></a></div>
        <div className="tool-grid tool-grid--drei">{UEBEN.map((t) => <a key={t.tag} className="tool-link" href={`#/lernen/ueben?gruppe=${t.gruppe}`}>
          <span className="tool-link__icon"><Icon name={t.icon} size={22} /></span><span className="tool-link__tag">{t.tag}</span><h3>{t.title}</h3><p>{t.text}</p><Icon name="chevronRight" size={18} />
        </a>)}</div>
      </section>
      <Ueberblick />
      <SicherungsHinweis />
    </section>
  );
}
