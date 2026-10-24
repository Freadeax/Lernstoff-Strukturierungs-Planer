# UI-Designsystem

Stand: 2026-10-23. Umsetzung der UI/UX-Spezifikation für den Lernstoff-Planer. Live ansehen: Seite **System → Designsystem** (`#/system/design`) zeigt Tokens, Bausteine und jedes Modul in allen sechs Zuständen mit Beispieldaten.

| Ordner | Inhalt |
|---|---|
| `src/ui/tokens.css` | Design-Tokens (Abstände, Radien, Schatten, Farben hell/dunkel) |
| `src/ui/ui.css` | Shell, Widget-Gerüst, Module; Komponenten-Tokens oben |
| `src/ui/shell/` | Shell, Seitenleiste, Suche (Omnibar), Mitteilungen, Hash-Routing, Sitzung |
| `src/ui/widget/` | Widget-Vertrag (`types.ts`), Rahmen, Zustandsautomat, Fehlergrenze, Lazy Loading, Raster |
| `src/ui/table/` | `SmartTable` (virtuell, sortierbar, Spaltenbreiten, Inline-Bearbeitung, Auswahl) |
| `src/widgets/` | Lern-Module: Kennzahlen, Diagramme, Filterleiste, Themen + Abfrage-Baukasten, Lernstand-Board, Aktivitäts-Feed, Import-Assistent |
| `src/core/activity.ts`, `src/core/board.ts` | Neue lokale Daten (DB-Version 3): Aktivitätsprotokoll und Arbeitsstand je Thema |

## Übertragung der Enterprise-Module auf Lerninhalte

| Spezifikation | Im Lernstoff-Planer |
|---|---|
| KPI-Scorecards mit Sparklines | **Lernfortschritt**: importiertes Material, Zusammenfassungen, Anteil belegter Aussagen, erarbeitete Themen, je mit Trend zur gleich langen Vorperiode |
| Smart Data Table | **Themen**: Fachkatalog (101 Themen), virtuelles Scrollen (Stresstest mit 10.000 Zeilen auf der Designsystem-Seite), Mehrfachsortierung, Spaltenbreite ziehen, Arbeitsstand inline ändern, Mehrfachauswahl mit Aktionsleiste |
| Interaktive Charts | **Aktivität und Belegquote**: gestapelte Balken + Linie mit gemeinsamem Fadenkreuz; Tipp auf einen Tag filtert alle Übersichtsmodule (Drill-down, „Zurück zum Zeitraum“) |
| Global Filter Bar | Zeitraum mit Schnellwahl, Zeitzone, Fach; „Filter merken“ = dauerhaft, sonst nur für die Sitzung |
| Query Builder | **Erweiterter Filter** der Themen-Tabelle: UND/ODER-Gruppen, NICHT, enthält/ist/größer/kleiner/leer, bis drei Ebenen |
| Kanban | **Lernstand-Board**: Themenpool → Diese Woche → In Arbeit → Erarbeitet. Ziehen am Griff (Maus und Finger), Tastatur, oder Auswahlliste; optimistische Aktualisierung mit Rücknahme bei Fehler; Karten werden spaltenweise nachgeladen. „Erarbeitet“ ist bewusst nicht „sicher“: das entscheidet weiter der Lernplan anhand echter Abfragen. |
| Audit Trail | **Lernaktivität**: Importe, Zusammenfassungen (Ampel → Schweregrad), Verschiebungen, Löschungen; Filter Info/Warnung/Kritisch, unendliches Scrollen, `role="feed"` mit `aria-live="polite"` |
| Multi-Step Wizard | **Import-Assistent**: Fach und Art → Dateien → Prüfen → Ergebnis; Validierung je Schritt, Entwurf wird automatisch gespeichert (ohne Dateien, das erlauben Browser nicht) |

### Themen-Landkarte (`#/lernen/landkarte`)

Concept-Map des Fachkatalogs in `src/features/landkarte/`. Spalten = Lernstufe (längster Voraussetzungspfad), Bänder = Fach; Pfeile = Voraussetzung, gestrichelt = Unterthema. Farbe = Arbeitsstand aus der Tabelle `board`, gestrichelter Rahmen = „bereit“ (alle Voraussetzungen erarbeitet). Antippen zeigt den Lernpfad mit offenen Voraussetzungen in Lernreihenfolge, die sich mit einem Tipp für diese Woche einplanen lassen. Zoom/Pan mit Fingern (Pinch, Doppeltipp), Maus/Trackpad und Tastatur; die Ansicht wird direkt am DOM gesetzt, damit Verschieben auf dem iPad flüssig bleibt. Das Layout (`layout.ts`) ist rein und fachneutral, `?fach=` und `?thema=` steuern Filter und Auswahl.

### Lernplan (`#/lernen/plan`)

Oberfläche zur Planungslogik in `src/features/lernplan/ui/`: Heute (Blöcke abhaken, Abfrageergebnisse eintragen), Woche (Tageskarten mit Auslastung, „aufs Board legen“), Prüfungen (Termine, Themenwahl, Prognose) und Lernzeit (Wochentage, Ausnahmen, Blocklänge). Daten in DB-Version 4 (`studyLogs`, `reviewLogs`, `planner`). Das Lernstand-Board fließt in den Plan ein („Erarbeitet“ = erste Abfrage fällig, „Diese Woche“ = Vorrang), die Landkarte zeigt den Wissensstand je Thema, die Übersicht „Heute im Lernplan“. Details: `src/features/lernplan/README.md`.

### Bewusst nur als Erweiterungspunkt

| Spezifikation | Warum nicht voll gebaut | Wo der Haken sitzt |
|---|---|---|
| Multi-Tenant-Wechsler | Eine Person, ein Gerät. Sinnvolle Entsprechung: **Fachmodul-Wechsler** (heute nur Pflege), per BroadcastChannel über Tabs synchron | `src/ui/shell/session.ts` |
| RBAC mit JWT-Claims | Keine Anmeldung, keine fremden Nutzer | `Role` und `roles` in `src/ui/shell/nav.ts`; Menüpunkte haben optional `roles` |
| WebSocket-Notifications | Kein Server; alle Daten lokal | `NotificationTransport` in `src/ui/shell/notifications.ts`; heute füllen lokale Ereignisse und das Aktivitätsprotokoll (IndexedDB) die Prioritätswarteschlange |
| Micro-Frontends | Ein Repo, ein Build. Isolation über eigene Code-Chunks, eigene Fehlergrenze und eigenen Zustand je Modul | `src/widgets/registry.ts` |

## 1. DOM-Skelett

### Shell

```html
<div class="shell" data-sidebar="expanded|collapsed">
  <a class="skip-link" href="#main">Zum Inhalt springen</a>
  <aside id="sidebar" class="shell__sidebar" aria-label="Hauptnavigation">   <!-- Handy: Schublade -->
    <div class="sidebar__brand">…</div>
    <nav class="sidebar__nav" aria-label="Bereiche">
      <ul class="nav__list nav__list--l1">
        <li><a class="nav__item nav__item--active" href="#/" aria-current="page">Übersicht</a></li>
        <li class="nav__group">
          <button class="nav__toggle" aria-expanded="true" aria-controls="nav-lernen">Lernen</button>
          <div id="nav-lernen"><ul class="nav__list nav__list--l2">…bis Ebene 3…</ul></div>
        </li>
      </ul>
    </nav>
    <button class="sidebar__collapse" aria-expanded="true" aria-controls="sidebar">Einklappen</button>
  </aside>
  <header class="shell__header">
    <button class="shell__menu-btn" aria-controls="sidebar" aria-expanded="false">☰</button>   <!-- nur Handy -->
    <div class="menu"><button class="workspace" aria-haspopup="menu">Fachmodul</button></div>
    <div class="shell__search">
      <button class="omnibar__trigger" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K">Suchen</button>
      <dialog class="omnibar"><input role="combobox" aria-controls="…" aria-activedescendant="…"><ul role="listbox">…</ul></dialog>
    </div>
    <div class="shell__actions"><div class="notif">🔔</div><div class="menu">Profil</div></div>
  </header>
  <main id="main" class="shell__main" tabindex="-1">
    <div class="content">                      <!-- container: content / inline-size -->
      <section class="page">
        <div class="grid12">                   <!-- 12 Spalten -->
          <div class="grid__cell" style="--span-md:12; --span-lg:7; --span-xl:8">…Widget…</div>
        </div>
      </section>
    </div>
  </main>
  <nav class="shell__tabbar" aria-label="Schnellzugriff">…</nav>   <!-- nur Handy -->
  <div class="toaster" aria-live="polite">…</div>
</div>
```

### Ein Modul (Widget)

```html
<section class="widget widget--ideal" aria-labelledby="t1" aria-describedby="d1" aria-busy="false" data-widget="feed">
  <!-- container: widget / inline-size: das Modul richtet sich nach seiner eigenen Breite -->
  <header class="widget__header">
    <div class="widget__titles"><h3 id="t1" class="widget__title">Lernaktivität</h3><p id="d1" class="widget__subtitle">…</p></div>
    <div class="widget__tools">
      <span class="badge badge--live">Aktuell</span>                               <!-- live | syncing | stalled | offline | demo -->
      <div class="menu"><button aria-haspopup="menu" aria-expanded="false">⋯</button>
        <div role="menu">CSV · JSON · Vollbild · Ausblenden</div></div>
    </div>
    <div class="pills" role="group"><button class="pill" aria-pressed="true">Alle</button>…</div>
  </header>
  <div class="widget__body" data-scroll-root>                                     <!-- min/max-height, scrollt selbst -->
    <!-- genau einer: Skelett | Leer (Illustration, Text, CTA) | Fehler (Retry) | Hinweis Teilzustand + Inhalt | Inhalt -->
  </div>
  <footer class="widget__footer">
    <div class="pager" role="group">Einträge pro Seite · ‹ Seite 1 von 3 ›</div>
    <time class="widget__synced" datetime="…">Stand: vor 2 Min.</time>
    <div class="widget__secondary">…</div>
  </footer>
</section>
```

## 2. Komponenten-Interface

Vollständig in `src/ui/widget/types.ts`. Kern:

```ts
type WidgetStatus = 'loading' | 'ideal' | 'partial' | 'empty' | 'error';
type WidgetState<T> =
  | { status: 'loading' }
  | { status: 'ideal'; data: T }
  | { status: 'partial'; data: T; reason?: string }
  | { status: 'empty' }
  | { status: 'error'; error: Error };
// Der 6. Zustand „interaktiv“ gilt zusätzlich in jedem Zustand mit Inhalt (CSS + ARIA).

interface WidgetFrameProps<T, K extends string = string> {
  id: string;
  header: { title; subtitle?; badge?: SyncBadge; filters?: FilterPill<K>[]; activeFilter?; onFilterChange?;
            exportRows?: () => Record<string, unknown>[]; allowMaximize?; onHide?; extraActions? };
  state: WidgetState<T>;
  skeleton: ReactNode;               // gleiche Geometrie wie der Idealzustand
  empty: { illustration?; title; message; cta: { label; onClick? | href? } };
  onRetry: () => void;               // lokal, betrifft nur dieses Modul
  body?: { minHeight?; maxHeight? };
  footer?: { pagination?: Pagination; lastSynced?: Date; secondary?: ReactNode };
  lifecycle?: { onMount?; onUpdate?; onDestroy?; onError? };
  children: (data: T, p: { partial: boolean; reason?: string }) => ReactNode;
}

interface WidgetDefinition {          // Eintrag im Widget-Katalog
  id; title; span: { md?; lg?; xl? }; placeholderHeight;
  load: () => Promise<{ default: ComponentType<WidgetHostProps> }>;   // eigener Code-Chunk
}
```

Jedes Modul besteht aus drei Teilen: **Lader** (`useWidgetData({ load, deps, isEmpty, isPartial })` beobachtet die Dexie-Tabellen live), **View** (`KpiView`, `FeedView`, … bekommt nur `WidgetState`) und dem Container als Standard-Export, den `LazyWidget` per `import()` lädt, sobald die Rasterzelle in den sichtbaren Bereich kommt.

**Zustandstrennung:** Globale Zustände (`filterStore`, `session`, Mitteilungen) sind kleine Stores mit Selektoren (`useStore(store, s => s.from)`). Ein Modul rendert nur neu, wenn sich der gewählte Ausschnitt ändert. Abhängigkeiten sind ausdrücklich: Kennzahlen, Diagramme und Feed hängen am Zeitraum; Themen-Tabelle und Board teilen sich die Tabelle `board`.

## 3. Design-Tokens

Alle Komponenten nutzen nur Variablen aus `tokens.css` (Ausnahme: Breakpoints in Media-/Container-Queries, die CSS-Variablen dort nicht zulassen).

| Gruppe | Tokens |
|---|---|
| Abstände (8px-Raster) | `--space-1` 4 · `--space-2` 8 · `--space-3` 16 · `--space-4` 24 · `--space-5` 32 · `--space-6` 48 · `--space-7` 64 |
| Radien | `--radius-xs` 4 · `-sm` 8 · `-md` 12 · `-lg` 16 · `-pill` |
| Ebenen | `--elevation-0` … `--elevation-4` (Karte, Hover, Menü, Dialog/Ziehen) |
| Farben | `--color-primary`, `-secondary`, `-surface`, `-surface-raised`, `-surface-sunken`, `-background`, `-border`, `-border-strong`, `-text`, `-text-muted`, `-focus`, Status `success/warning/danger/info` je mit `-soft`, Diagrammreihen `--color-series-1..3` |
| Typografie | `--text-xs` … `--text-2xl`, `--weight-*`, `--leading-*` |
| Bedienung | `--control-h` 40 (44 bei Fingerbedienung), `--row-h` 44, `--focus-ring` |
| Breakpoints | 320 · 768 · 1024 · 1440 · 1920 |

Dunkelmodus folgt dem System oder wird im Profilmenü gewählt (`data-theme`).

## Barrierefreiheit (WCAG 2.1 AA)

- Alles per Tastatur: Tab-Reihenfolge, „Zum Inhalt springen“, Menüs mit Pfeiltasten und Esc, Suche mit Strg/Cmd+K, Diagramme mit ←/→ und Eingabe, Board-Karten mit Leertaste + Pfeilen, Spaltenbreite mit ←/→.
- Sichtbarer Fokusring auf allen Bedienelementen, Kontraste der Tokens ≥ 4,5:1 für Text.
- ARIA: `aria-expanded`/`aria-controls` (Navigation, Menüs, Filter), `aria-current` (Seite, Schritt), `aria-sort`, `aria-rowcount`/`aria-rowindex` (virtuelle Tabelle), `aria-describedby` (Untertitel, Feldfehler), `role="feed"` + `aria-live="polite"`, Ansagen beim Verschieben, versteckte Datentabellen hinter Diagrammen.
- `prefers-reduced-motion` schaltet Animationen ab.

## Leistung

- Code-Splitting: jedes Modul und die Designsystem-Seite sind eigene Chunks; Laden erst bei Sichtbarkeit (Intersection Observer, 300 px Vorlauf).
- Virtuelles Scrollen in der Tabelle, Nachladen im Board und Feed.
- Skelette haben feste Höhen aus Komponenten-Tokens, damit beim Laden nichts springt.

### SIS-Trainer (`#/lernen/sis`)

Strukturierte Informationssammlung nach dem Strukturmodell in `src/features/sis/`: vier erfundene Fälle (stationär und ambulant) mit Erstgespräch, Beobachtungen und Unterlagen. Eingabe in drei Abschnitten (Feld B, Themenfelder 1 bis 6, Risikomatrix mit ja/nein, weitere Einschätzung und Themenfeld). Die Checkliste (`pruefung.ts`) läuft offline: Kernpunkte je Feld (im falschen Feld halbe Punkte), Matrix gegen die Lösung (`'beides'` = fachlich beides vertretbar), Hinweise zu Ich-Perspektive und Fachsprache in Feld B, Verständigung in den Themenfeldern und wertenden Begriffen. Optional Rückmeldung von Claude. Entwürfe in localStorage; ins Lernplan-Thema `thema.pp.sis` geht nur eine vollständig ausgefüllte SIS (erster Versuch des Tages).

### Mindmaps (`#/lernen/mindmap`)

Eigene Mindmaps in `src/features/mindmap/`, gespeichert in localStorage (`lernstoff.mindmaps`). Bearbeiten über die Gliederung (Eingabe, Tab, Umschalt+Tab, Alt+Pfeile; auf dem Handy über die Werkzeugleiste), die Karte zeichnet sich automatisch (`layout()` in `modell.ts`, Zoom wie die Landkarte). Vorlagen: leer, Krankheitsbild, aus dem Katalog (Unterthemen und Glossar); Anlegen auch aus einer eingerückten Liste aus Notizen. Üben: Lücken füllen und alles aus dem Gedächtnis; mit einem Unterthema verknüpft und ab 5 abgefragten Begriffen zählt das Ergebnis im Lernplan. Export als SVG und als Text.

### Pflegebericht-Trainer (`#/lernen/bericht`)

Sachliche Berichtseinträge in `src/features/bericht/`: sechs erfundene Fälle, entweder einen wertenden Eintrag umschreiben oder aus einer Situation neu schreiben. Die Checkliste (`pruefung.ts`) prüft offline die Kernpunkte je Baustein (Zeit, Beobachtung, Aussage, Maßnahme, Wirkung, Weitergabe) und markiert wertende, ungenaue und vermutende Wörter; wörtliche Rede in Anführungszeichen ist ausgenommen. Optional Rückmeldung von Claude mit Umformulierungen. Lernplan-Thema `thema.pp.evaluation` ab 15 Wörtern.

### Assessment-Rechner (`#/lernen/assessment`)

Braden, Barthel (Hamburger Einstufungsmanual), NRS, BESD und MNA-SF in `src/features/assessment/`. Instrumente als Daten in `instrumente.ts` (Items, Stufen, Kategorien, Hinweise; MNA mit Wadenumfang als Ersatz für den BMI, BMI-Hilfe), 14 erfundene Fallvignetten mit Musterlösung und Begründung je Item in `vignetten.ts`, Auswertung als reine Funktion in `bewertung.ts`. Zwei Modi: freier Rechner (zählt nicht) und Fallvignetten (je Item, Einstufung und bei Schmerzfällen die Instrumentwahl ein Punkt; geht per `inLernplan` an die Themen des Instruments, erster Versuch des Tages). Adresse: `?gruppe=braden|barthel|schmerz|mna&modus=rechner|faelle&fall=<id>`. Zuletzt erreichte Prozente je Fall in localStorage (`lernstoff.assessment.erledigt`). Neue Fälle brauchen ein Fazit, das mit der Summe beginnt (der Test prüft das).
