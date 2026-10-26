import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../core/db';
import { getApiKey } from '../core/settings';
import { WidgetGrid } from '../ui/widget/Dashboard';
import { FilterBar } from '../widgets/filter/FilterBar';
import { WIDGETS } from '../widgets/registry';
import { Icon, type IconName } from '../ui/icons';
import { PageHeading } from '../ui/PageHeading';
import { HeuteKarte } from './lernplan/ui/HeuteKarte';
import { SicherungsHinweis } from './sicherung/SicherungsHinweis';

function ErsteSchritte() {
  const [counts, setCounts] = useState<{ docs: number; summaries: number } | null>(null);
  useEffect(() => {
    const sub = liveQuery(async () => ({ docs: await db.documents.count(), summaries: await db.summaries.count() }))
      .subscribe({ next: setCounts, error: () => setCounts(null) });
    return () => sub.unsubscribe();
  }, []);
  if (!counts || (counts.docs && counts.summaries)) return null;
  const steps = [
    { label: 'Material importieren', description: 'Dein Skript wird zur Lernquelle.', href: '/material/import', done: counts.docs > 0 },
    { label: 'KI einrichten', description: 'Für Zusammenfassungen und KI-Feedback.', href: '/einstellungen', done: !!getApiKey() },
    { label: 'Zusammenfassung erstellen', description: 'Mit überprüfbaren Quellenbelegen.', href: '/material/zusammenfassen', done: counts.summaries > 0 },
  ];
  return <section className="getting-started" aria-labelledby="start-title">
    <div className="section-heading"><h2 id="start-title">Dein Einstieg</h2><span className="muted">In deinem Tempo. Schritt für Schritt.</span></div>
    <ol className="start-steps">{steps.map((s, i) => <li key={s.href} className={s.done ? 'is-done' : ''}>
      <a href={`#${s.href}`}><span className="start-steps__number" aria-hidden="true">{s.done ? <Icon name="check" size={16} /> : `0${i + 1}`}</span>
        <span><strong>{s.label}{s.done && <span className="visually-hidden">, erledigt</span>}</strong><small>{s.description}</small></span><Icon name="chevronRight" size={16} /></a>
    </li>)}</ol>
  </section>;
}

const TOOLS: Array<{ title: string; text: string; icon: IconName; path: string; tag: string }> = [
  { title: 'Wissen aufbereiten', text: 'Aus deinen Quellen wird verständlicher Lernstoff.', icon: 'sparkle', path: '/material/zusammenfassen', tag: 'Zusammenfassen' },
  { title: 'Wissen festigen', text: 'Kleine Abfragen. Passende Wiederholungen.', icon: 'cards', path: '/lernen/karten', tag: 'Karteikarten' },
  { title: 'Praxis verstehen', text: 'Entscheidungen in realistischen Pflegefällen üben.', icon: 'clipboard', path: '/lernen/fall', tag: 'Fallsimulator' },
  { title: 'Prüfungsbereit werden', text: 'Dein Wissen unter Prüfungsbedingungen testen.', icon: 'timer', path: '/lernen/simulation', tag: 'Prüfungssimulation' },
];

export function Dashboard() {
  const date = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' }).format(new Date());
  return (
    <section className="page dashboard">
      <PageHeading eyebrow={date} title="Ein klarer Kopf. Ein guter Plan."
        description="Dein Lernstoff, deine nächsten Schritte und Raum für Fortschritt."
        action={<a className="button-link primary" href="#/material/import"><Icon name="plus" size={18} /> Material hinzufügen</a>} />
      <HeuteKarte />
      <ErsteSchritte />
      <section aria-labelledby="tools-title" className="tools-section">
        <div className="section-heading"><div><p className="eyebrow">Vom Verstehen zum Anwenden</p><h2 id="tools-title">Wie möchtest du lernen?</h2></div><a className="text-link" href="#/lernen/faecher">Alle Fächer <Icon name="chevronRight" size={16} /></a></div>
        <div className="tool-grid">{TOOLS.map((t) => <a key={t.path} className="tool-link" href={`#${t.path}`}>
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
