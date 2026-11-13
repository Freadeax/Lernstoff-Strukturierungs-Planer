import { Suspense, use, type ReactNode } from 'react';
import { fachmodulBereit } from '../../modules/registry';
import { BUILD_ID } from '../../core/build';
import { ErrorBoundary } from '../widget/ErrorBoundary';
import { PageHeading } from '../PageHeading';
import { navigate } from './router';

/**
 * Ladefehler eines Seitenbausteins: nach einer neuen Veröffentlichung fehlen die alten Dateien,
 * ein offener Tab findet sie dann nicht mehr. Meldungen von Chrome, Safari und Firefox.
 */
export function istLadefehler(e: unknown): boolean {
  const text = e instanceof Error ? `${e.name} ${e.message}` : String(e);
  return /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(text);
}

const NEU_GELADEN = 'lernstoff.neuGeladen';

/** Einmal automatisch neu laden, damit die neue Version geholt wird. Danach nicht mehr (keine Schleife). */
export function einmalNeuLaden(jetzt = Date.now()): boolean {
  try {
    const zuletzt = Number(sessionStorage.getItem(NEU_GELADEN) ?? 0);
    if (jetzt - zuletzt < 60_000) return false;
    sessionStorage.setItem(NEU_GELADEN, String(jetzt));
  } catch { return false; }
  location.reload();
  return true;
}

/** Rückmeldeseite mit Seite und Fehlermeldung vorausgefüllt (ohne die Testphase ins Startpaket zu ziehen). */
export const fehlerMeldenPfad = (seite: string, meldung: string) =>
  `/system/test?${new URLSearchParams({ ansicht: 'rueckmeldung', art: 'fehler', seite, technik: meldung.slice(0, 300) })}`;

function Fehler({ error, reset, path }: { error: Error; reset: () => void; path: string }) {
  const laden = istLadefehler(error);
  if (laden && einmalNeuLaden()) return <p className="muted">Neue Version wird geladen …</p>;
  return (
    <section className="page">
      <PageHeading title={laden ? 'Neue Version verfügbar' : 'Dieser Bereich hat gerade einen Fehler'}
        description={laden
          ? 'Die App wurde aktualisiert. Bitte einmal neu laden, dann geht es weiter.'
          : 'Die übrige App läuft weiter, dein Lernstand ist gespeichert. Versuche es noch einmal oder lade die Seite neu.'} />
      <div className="row">
        {!laden && <button type="button" className="primary" onClick={reset}>Nochmal versuchen</button>}
        <button type="button" className={laden ? 'primary' : ''} onClick={() => location.reload()}>Seite neu laden</button>
        <button type="button" className="ghost" onClick={() => navigate('/')}>Zur Übersicht</button>
        {!laden && path !== '/system/test' && <button type="button" className="ghost" onClick={() => navigate(fehlerMeldenPfad(path, error.message))}>Fehler melden</button>}
      </div>
      {!laden && <details className="muted"><summary>Technische Angabe</summary><code>{error.message}</code><br />App-Version: <code>{BUILD_ID}</code></details>}
    </section>
  );
}

/** Seiteninhalt erst zeigen, wenn Glossar und Steckbriefe der Fachmodule geladen sind (nicht im Startpaket). */
function FachmodulVoll({ children }: { children: ReactNode }) {
  use(fachmodulBereit());
  return children;
}

/**
 * Rahmen um jede Seite: Ladeanzeige für nachgeladene Module und Absturzschutz.
 * Ein Fehler in einem Modul zeigt einen Hinweis statt einer weißen Seite; Navigation bleibt bedienbar.
 * `path` setzt den Fehler beim Seitenwechsel zurück.
 */
export function PageBoundary({ path, children }: { path: string; children: ReactNode }) {
  return (
    <ErrorBoundary resetKey={path} fallback={(error, reset) => <Fehler error={error} reset={reset} path={path} />}>
      <Suspense fallback={<p className="muted route-laden" role="status"><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />Lädt …</p>}><FachmodulVoll>{children}</FachmodulVoll></Suspense>
    </ErrorBoundary>
  );
}
