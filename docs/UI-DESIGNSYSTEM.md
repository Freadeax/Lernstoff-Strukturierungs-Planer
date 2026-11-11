# UI-Designsystem

## Überarbeitung: „Farbfelder“ und Bewegung (10. November 2026)

Die ganze Oberfläche hat eine neue Formensprache und bewegt sich. Inhalte, Routen und Daten sind unverändert.

- **Hell („Farbfelder“):** Creme, Petrol und Tinte. Kräftige Farbflächen, 2-px-Rahmen (`--color-outline`), harte
  Schatten (`--shadow-hard-sm`, `--shadow-hard`, `--shadow-hard-lg`), große Serifen-Überschriften. Primäre
  Schaltflächen sind korallfarben mit Tintenschrift. Einstiege nebeneinander nutzen die Kachelfarben `--tile-1` bis `-4`.
- **Dunkel („Nachtschicht“):** Indigo statt Schwarz, leuchtende Markierungen (`--glow`, `--mark-shadow`), feines
  Raster im Hintergrund, EKG-Linie in der Heute-Karte. Gleiche Bausteine, andere Tokenwerte.
- **Bereichsfarbe:** Die Shell trägt `data-bereich` (`heute`, `lernen`, `ueben`, `material`, `system`, aus
  `bereichVon()` in `nav.ts`). Daraus folgt `--area` für die Marke im Kopf und die kleinen Etiketten (`.eyebrow`).
- **Dateien:** `src/ui/tokens.css` (Werte), `src/ui/farbfelder.css` (Formen, wird nach `ui.css` und
  `workspace.css` geladen), `src/ui/motion.css` (Bewegung). Die Seitenleiste und die untere Leiste setzen ihre
  Textfarben über lokale Tokens, Module darin brauchen keine eigenen Farben.

### Bewegung (für alle Module, auch die Simulatoren)

| Baustein | Bedeutung |
|---|---|
| `--dur-fast` 120 ms · `--dur-normal` 200 ms · `--dur-slow` 420 ms · `--dur-slower` 700 ms | Dauern |
| `--ease-standard` · `--ease-out` · `--ease-spring` | Kurven; `--ease-spring` federt nach |
| `--stagger` 55 ms | Versatz zwischen nacheinander erscheinenden Elementen |
| `.m-rise` · `.m-pop` · `.m-wipe` | einmal beim Erscheinen: von unten, aufspringen, aufdecken |
| `.m-stagger` | Kinder erscheinen nacheinander (bis 12) |
| `.m-float` · `.m-pulse` | Dauerschleifen für Schmuck und Aufmerksamkeit |
| `.m-shake` | Fehler, einmal |
| `.m-press` | Taste mit hartem Schatten, drückt sich beim Antippen ein |
| Keyframes `m-*` | für eigene Regeln, Liste im Kopf von `motion.css` |
| `<Zaehler wert="85 %" />` (`src/ui/motion/Zaehler.tsx`) | Zahl zählt hoch, Screenreader lesen den Endwert |

Regeln:

1. Nur `transform` und `clip-path` animieren, sonst ruckelt es auf dem iPhone.
2. Dauern und Kurven nur über die Tokens.
3. Nichts darf von Bewegung abhängen. „Bewegung reduzieren“ kommt vom System (`prefers-reduced-motion`) oder aus
   dem Profilmenü („Bewegung reduziert“, `data-motion="reduce"` am `html`). Dann schaltet `motion.css` alle
   Animationen und Übergänge ab, der Endzustand muss ohne sie stimmen. In JavaScript: `wenigBewegung()` aus `session.ts`.
4. Text nie über die Deckkraft einblenden. Die Kontrastprüfungen (axe) laufen kurz nach dem Laden und messen
   sonst halb durchsichtigen Text. `m-fade` ist nur für Flächen ohne Text (Abdunklung, Diagrammlinien).
5. Seiten liegen in `<div class="route">` mit Schlüssel je Seite (`App.tsx`): Die direkten Kinder von `.page`
   erscheinen nacheinander. Die Regel hat Spezifität null (`:where`), eigene Animationen eines Moduls gewinnen.

Die wandernde Markierung im Menü misst den aktiven Eintrag (`useMarkierung` in `Sidebar.tsx`) und setzt
`--mark-x/-y/-w/-h`; die untere Leiste rechnet mit `--tab-i`. Ausprobieren: **System → Designsystem → Bewegung**.

---

### Seitenkopf

Jede Seite hat denselben Kopf: Marke, großer Titel, Einleitung. Seiten mit `PageHeading` setzen die Marke über `eyebrow`. Alle anderen (`.page__head` mit `h2`, oder `PageHeading` ohne `eyebrow`) bekommen automatisch ihren Platz im Menü als Marke, zum Beispiel „Üben · Fachwissen“: `gruppenPfad()` in `nav.ts`, von `App.tsx` als `--kopf-marke` gesetzt, Darstellung in `farbfelder.css`. Neue Seiten brauchen dafür nichts zu tun.

### Wege und Bedienvertrag (Audit-Paket E)

- „Heute“: Die drei Übungskacheln öffnen `#/lernen/ueben?gruppe=fachwissen|praxis|pruefung`, die Übungsseite zeigt dann nur dieses Bündel und bietet den Wechsel als Links an. Die Leiste „Schnellwege“ führt mit einem Tipp zu Prüfung planen, Quelle finden, fällige Karten, Fall starten oder fortsetzen und Sicherung.
- Suche: Treffer nennen Art und Herkunft (Seite mit Menüplatz, Thema mit Fach, Begriff aus dem Fachkatalog, Quelle aus dem eigenen Material). Escape schließt immer, der Fokus geht zum Auslöser zurück. Dasselbe gilt für Mitteilungen und Profilmenü.
- Das Designsystem steht nicht mehr im Menü, der Einstieg liegt am Ende der Einstellungen (`#/system/design`). Dort stehen auch alle Datenhinweise gesammelt.
- `scripts/check-ui.mjs` prüft diese Wege und die Fokusrückgabe bei jedem Lauf.

### Titelbilder

Sechs Bereichsfotos liegen unter `public/titelbilder/` (1200 × 675, WebP, je 50 bis 100 KB) und werden für Offline vorab geladen (`titelbilder/*.webp` in `vite.config.ts`; andere WebP-Ordner bleiben beim Laufzeit-Cache). Baustein: `<Titelbild motiv="heute|lernen|material|ueben|simulation|system" />` aus `src/ui/Titelbild.tsx`, standardmäßig dekorativ (leerer Alternativtext), mit `beschreiben` kommt der Text aus dem Katalog. `PageHeading` nimmt `bild="…"` für die Einstiegsseiten der Bereiche. Neue Fotos zuerst auf diese Größe verkleinern.

## Überarbeitung: Lernarbeitsplatz (26. Oktober 2026)

Hinweis: Palette und Formen dieses Abschnitts sind seit November 2026 durch „Farbfelder“ ersetzt, die Aussagen
zu Navigation, Formularen und Bedienung gelten weiter.

Die Oberfläche nutzt eine ruhige Papier-/Petrol-Palette und lokal gebündelte Schriften
(Manrope für Bedientexte, Newsreader für Seitenüberschriften). Lizenztexte liegen unter
`public/fonts/`. Die Schriften werden vom Service Worker für Offline-Nutzung vorgehalten.
`src/ui/tokens.css` bleibt die gemeinsame Basis; `src/ui/workspace.css` ergänzt die
Gestaltung von Shell, Dashboard, Formularen und mobilen Ansichten.

- **Startseite:** Tagesfokus und nächste Prüfung zuerst, danach Einstieg, Lernwerkzeuge
  und die bestehenden Fortschritts-Widgets. Persönliche Kennzahlen beruhen weiterhin auf
  tatsächlich gespeicherten Daten.
- **Navigation:** Lernen, Üben & anwenden, Material und System. Routen bleiben erhalten.
  Die Trainergruppe startet eingeklappt und öffnet sich bei einer aktiven Trainerseite.
  Mobil gibt es vier direkte Ziele und „Mehr“, einen schließbaren Navigationsbereich,
  Fokusbegrenzung bei geöffnetem Menü und Rückgabe des Fokus beim Schließen.
- **Formulare:** Import, Zusammenfasser, Prüfungserfassung, Lernzeiten, Materialverbindung
  und Einstellungen haben eine vertikale Leserichtung. Pflichtangaben werden mit `*`
  markiert. Optionales und Voreinstellungen sind beschrieben. Board, Landkarte und
  andere fachliche Ansichten behalten ihre zum Inhalt passende Anordnung.
- **Gemeinsame Felder:** `src/ui/form/Field.tsx` verbindet sichtbare Labels, Hinweise und
  Fehlermeldungen über IDs und ARIA. `useFormFeedback` zeigt Fehler nach Blur bzw. nach
  einem Speicherversuch und fokussiert das erste ungültige Eingabefeld. Validierung
  korrigiert Eingaben nicht heimlich. Die lokale Schlüsselprüfung ist eine Formatprüfung,
  keine Bestätigung der Gültigkeit bei Anthropic.
- **Bedienung:** Der Import zeigt Schrittzähler und Fortschrittsbalken. Die Lernplan-Tabs
  unterstützen Pfeiltasten, Pos1 und Ende. Unnötiges Pulsieren und Skeleton-Schimmern
  sind entfernt; reduzierte Bewegung wird zusätzlich respektiert.

### Browserprüfung

In einem Terminal `npm run dev` starten. Einmalig den Testbrowser installieren:

```sh
npx playwright install chromium
npm run test:ui
```

Alternativ zeigt `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` auf eine vorhandene Chrome- oder
Chromium-Binärdatei. `UI_BASE_URL` überschreibt die lokale Adresse (Standard:
`http://127.0.0.1:5173/`). Screenshots und Prüfergebnisse liegen unter `.ui-check/`
(nicht versioniert); `UI_ARTIFACT_DIR` kann ein anderes Ausgabeverzeichnis festlegen.

Die Prüfung verwendet ausschließlich isolierte Browser-Kontexte. Sie kontrolliert
Formularfehler und deren Fokus, Prüfungserfassung, echten Textimport, Quellenauswahl,
Lernplan-Tastaturbedienung und mobiles Menü. Ausgewählte Seiten werden auf Desktop,
Mobilgerät und im Dunkelmodus mit axe gegen WCAG-Regeln geprüft. Ein automatischer
Test ersetzt keine vollständige manuelle Screenreader-Prüfung.

Die Datenbank und fachlichen Algorithmen bleiben unverändert. Die drei UI-Dateien
`AblageSeite.tsx`, `DuellSeite.tsx` und `SimulationSeite.tsx` haben eindeutige Namen,
damit TypeScript sie auch unter Windows von den zugehörigen Logikdateien unterscheiden kann.

---

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
- `prefers-reduced-motion` und „Bewegung reduziert“ im Profilmenü schalten Animationen ab.

## iPhone und iPad

Regeln für Fingerbedienung stehen gesammelt am Ende von `src/styles.css` (`@media (pointer: coarse)`):

- Eingabefelder haben mindestens 16 px Schrift, sonst zoomt Safari beim Antippen hinein. Module müssen dafür nichts tun.
- Kein Doppeltipp-Zoom auf Bedienelementen (`touch-action: manipulation`), langes Drücken auf Schaltflächen markiert keinen Text.
- Die untere Leiste blendet sich aus, solange ein Textfeld im Inhalt den Fokus hat.
- Home-Bildschirm-Symbol als PNG (`public/apple-touch-icon.png`, iOS nimmt kein SVG), Manifest mit PNG- und maskierbarem Symbol. Statusleiste per `theme-color`, folgt auch der manuell gewählten Darstellung.
- Installierte App: Kopfzeile zeigt eine Zurück-Taste (nur `display-mode: standalone`, nur wenn es innerhalb der App zurückgeht; Tiefe steht im Verlaufseintrag, `useRoute().depth`, `goBack()` in `router.ts`).
- Offline: Hinweis „Offline“ im Kopf und Mitteilung beim Wechsel (`useOnline()` in `src/ui/lib/online.ts`).
- Schriftgröße normal / groß / sehr groß im Profilmenü (`data-schrift` am `html`, 112,5 % bzw. 125 %). Darum alle Schriftgrößen in `rem`, nie in `px`.
- Hover-Effekte stehen in `@media (hover: hover)`, damit nach dem Antippen nichts „hängen“ bleibt. Neue `:hover`-Regeln genauso einpacken.
- Wischgesten (`src/ui/shell/gesten.ts`): in der installierten App vom linken Rand das Menü aufziehen, bei offenem Menü nach links wegwischen.
- Tastenkürzel (`Tastenkuerzel.tsx`, iPad mit Tastatur): `⌘K` oder `/` Suche, `⌥1`–`⌥5` Hauptseiten, `?` Übersicht (auch im Profilmenü).
- `npm run test:geraete` (Teil von `npm run check`) lädt jede Menüseite auf iPhone, iPad hoch und quer und prüft Überlauf, Laufzeitfehler, Feldschrift und die untere Leiste. Neue Seiten mit `path` in `nav.ts` sind automatisch dabei.

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

### Übungsrunden: Hygiene- und Anatomie-Trainer (`#/lernen/hygiene`, `#/lernen/anatomie`)

Gemeinsamer Kern in `src/features/quiz/`: drei Aufgabenarten (Auswahl, Reihenfolge mit Pfeiltasten statt Ziehen, Abbildung beschriften mit Auswahlfeldern je Nummer), Bewertung und Fehlerheft-Übersetzung als reine Funktionen in `quiz.ts`, Ablauf in `Runde.tsx`, Auswahlseite in `TrainerSeite.tsx`. Eine Runde ist eine echte Abfrage (keine Tipps vor dem Prüfen): Jede Aufgabe zählt im Lernplan einmal mit ihrem Anteil richtiger Teile, ab 3 Aufgaben je Thema. Fehler gehen als Auswahlfrage ins Fehlerheft, Beschriftungsfehler über einen Hinweis statt der Abbildung (der Hinweis darf den Namen nicht verraten, der Test prüft das). Abbildungen kommen immer in die Runde, höchstens aber die Hälfte der Aufgaben.

Inhalte: `src/features/hygiene/aufgaben.ts` (5 Momente, Schutzausrüstung, Erreger und Isolierung, Basishygiene; Thema `thema.ph.hygiene`) und `src/features/anatomie/aufgaben.ts` (Herz, Atmung, Niere, Verdauung, Skelett, Nervensystem, Auge und Ohr, Haut, Hormonsystem; Themen `thema.ap.*`), `src/features/expertenstandards/aufgaben.ts` (`#/lernen/expertenstandards`: Struktur/Prozess/Ergebnis, Kernaussagen, Kontinenzprofile; jede Aufgabe trägt `thema.qw.expertenstandards`) und `src/features/normwerte/aufgaben.ts` (`#/lernen/normwerte`: Vitalzeichen, Labor, Ausscheidung bei Erwachsenen, Werte einstufen), `src/features/notfall/aufgaben.ts` (`#/lernen/notfall`: BLS nach ERC 2021, ABCDE, Notfälle auf Station) `src/features/arzneimittel/aufgaben.ts` (`#/lernen/arzneimittel`: 6-R-Regel, Applikation, Wirkstoffgruppen nach Endung, Nebenwirkungen) und `src/features/recht/aufgaben.ts` (`#/lernen/recht`: Schweigepflicht, Strafrecht und Haftung, Delegation und § 4 PflBG, FEM, Betreuung und Vorsorge, Pflegegrade und SGB V, Arbeitsrecht; `BEREICH_ZU_THEMA` führt jedes `thema.re.*` in den passenden Bereich, je Thema mindestens 3 Aufgaben). Schemazeichnungen in `src/features/anatomie/figuren.tsx`, Farben nur über die Klassen `fig-*` aus `quiz.css` (Hell- und Dunkelmodus), Nummern legt die Runde über die Koordinaten aus den Aufgaben. Adresse: `?bereich=<id>|mix&runde=1`. Letztes Ergebnis je Bereich in localStorage (`lernstoff.hygiene.stand`, `lernstoff.anatomie.stand`).

Vertiefung und Fachbegriffe: Jede Aufgabe hat neben der kurzen `erklaerung` eine `vertiefung` (Hintergrund, Zusammenhang, Praxisbezug), die in `<trainer>/vertiefung.ts` je Aufgaben-ID steht und über `mitVertiefung()` an `AUFGABEN` hängt. `vertiefung.test.ts` verlangt sie für jede Aufgabe aller Trainer (nicht leer, nicht nur die Erklärung wiederholt, keine verwaisten IDs). Nach dem Prüfen zeigt die Runde „Mehr verstehen“ (aufklappbar, Zustand je Gerät in `lernstoff.quiz.vertiefungOffen`): Hintergrund, alle Fachbegriffe der Aufgabe mit Kurzdefinition und Links zu den Themenseiten. Fachbegriffe in Erklärung, Vertiefung, Kurzwissen und Fehlerheft sind antippbar (`FachText.tsx`, Erkennung in `fachbegriffe.ts` aus dem Modulglossar über `getModule`). Vor dem Prüfen wird nichts markiert, damit Definitionen keine Antwort vorwegnehmen. Katalogdefinitionen tragen den Hinweis, dass Lehrbuch und Unterricht Vorrang haben (Belegregel).

Aufgabenarten, Stufen und Schwachstellen: Neben `auswahl`, `reihenfolge` und den übrigen Arten gibt es `zuordnen` (mindestens drei Paare, je Paar ein Auswahlfeld, Teilpunkte je Paar) und `fall` (Einstieg plus mindestens zwei Schritte mit `lage`, `frage`, Optionen und `warum`; jeder Schritt wird festgelegt, bekommt sofort Rückmeldung, dann entwickelt sich der Fall weiter). Jede Aufgabe hat eine Stufe 1 Grundlagen, 2 Anwenden, 3 Transfer (`stufeVon`: Feld `stufe`, sonst Fall = 3, einfache Auswahl = 1, Rest = 2); die Trainerseite filtert über `?stufe=`. Die Karte „Meine Schwachstellen“ startet eine Runde nur mit Aufgaben, die im Fehlerheft offen sind (`schwachstellen`, auch Teil-IDs wie `id:2` aus Fallschritten). Neue Inhalte je Trainer stehen in `<trainer>/erweiterung.ts` (`ERWEITERUNG`, `ERWEITERUNG_VERTIEFUNG`, Themen als String-Literale gegen Importzyklen) und werden mit `ergaenze()` angehängt. Animationen der Runde nur über `motion.css`: Aufgabenkarte `m-rise`, richtige Rückmeldung und Serien-Badge `m-pop`, falsche Zuordnung `m-shake`, Fortschrittsspur aus Punkten, Ergebnisring (`src/ui/Ergebnisring.tsx`, auch für Karteikarten und Prüfungen) und Balken je Stufe in der Auswertung.

Weitere Nutzer des Übungskerns und der Bausteine: Die Prüfungssimulation nimmt die Übungstrainer als Quelle „Übungstrainer“ (`simulation/trainerpool.ts`, dynamisch geladen; Auswahlaufgaben direkt, Fälle als je eine Frage pro Schritt mit bisherigem Verlauf, Stufe = Anforderungsbereich; Fehler landen beim Trainer mit derselben ID). Krankheitsbilder haben den „Detektiv“ (`krankheitsbilder/detektiv.ts`: aus drei Beobachtungen auf das Bild schließen, Beschreibungen zuordnen; Namen im Text verdeckt mit `maskiere`; keine automatischen Komplikationsfragen, weil allgemeine Komplikationen zu fast jedem Bild passen) und „Vergleichen“ (zwei Steckbriefe Abschnitt für Abschnitt). Karteikarten: „Gezielt üben“ (Schnellrunde mit 10 Karten, Problemkarten nach `istProblem`, Filter nach Herkunft), die Karte kippt beim Aufdecken (`karte-kippen`, nur transform), Rückseite mit aufklappbaren Fachbegriffen, Auswertung mit `Ergebnisring`, längster Serie und „Unsichere noch einmal üben“.
