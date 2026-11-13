# Entwicklung: sicher ändern

Kurzfassung für jede Änderung, egal ob von Hand oder von Claude in einem eigenen Thread.

## Ablauf

1. Von aktuellem `origin/main` ausgehen. Einen kurzen Arbeitszweig nur für den PR anlegen.
2. Ändern, dann **`npm run check`**. Das prüft der Reihe nach: Typen, Unit-Tests,
   Katalog-JSON gegen YAML, Build, Startgröße und alle Browser-Prüfungen gegen den gebauten Stand
   (eigener freier Port, kein laufender Server nötig). `npm run check:schnell` lässt den Browser weg.
3. Vor dem Merge `origin/main` hereinholen und `npm run check` noch einmal ausführen.
4. Squash-Merge auf `main`, Arbeitszweig sofort löschen. `main` ist der einzige dauerhafte Branch.
5. Maßgeblich sind die lokalen Prüfungen (`npm run check`), nicht GitHub. Veröffentlicht wird über Cloudflare Pages,
   das jeden Push auf `main` selbst baut (siehe `docs/HOSTING-CLOUDFLARE.md`). Einziger verbliebener GitHub-Workflow ist
   `pages.yml`: Er versorgt die zweite Adresse freadeax.github.io, die vorerst parallel weiterläuft (Philipp, 2026-11-12).
   Keine neuen GitHub Actions anlegen; Tests laufen lokal mit `npm run check`.
6. Unit-Tests haben ein Zeitlimit von 20 s je Test (`vite.config.ts`, `test.testTimeout`). OCR-, Diagnostik- und
   Simulationstests brauchen auf langsamen Rechnern deutlich länger als die 5 s Standard von Vitest.

## Neue Datenbank-Version (`src/core/db.ts`)

Die Daten liegen nur auf den Geräten (iPhone, iPad, Rechner). Ein Fehler hier kostet Lernstand.

- Nie eine bestehende `this.version(n)` ändern, immer eine neue Version anhängen.
- In `src/core/db-migration.test.ts` das neue Schema unter `VERSIONEN` eintragen (eingefroren,
  wird nie wieder geändert) und in `src/core/db-beispiele.ts` eine Beispielzeile je neuer Tabelle.
  Der Test schlägt fehl, solange eins von beiden fehlt.
- Der Test prüft dann automatisch: Jede alte Version wechselt ohne Datenverlust auf die neue,
  und jede Tabelle übersteht Sicherung → Datei → Einspielen (`sicherung-rundlauf.test.ts`).
- In `src/core/sicherung.ts` einen lesbaren Namen unter `LABEL` ergänzen, wenn Nutzer die Daten
  in der Sicherungsübersicht sehen sollen.

## Neues Fachgebiet andocken

1. Ordner `src/modules/<fach>/katalog/*.yaml` nach dem Vorbild `src/modules/pflege` anlegen.
2. `python3 scripts/build-module.py src/modules/<fach>` baut und prüft das JSON (Schema, IDs,
   Verweise, Zyklen). Mit `--pruefen` schreibt es nichts und meldet nur, ob das eingecheckte JSON
   zu den YAML-Dateien passt.
3. `index.ts` wie bei Pflege anlegen und das Modul in `src/modules/registry.ts` eintragen.
   `registry.test.ts` prüft jedes eingetragene Modul mit dem fachneutralen Vertrag
   (`src/modules/vertrag.ts`).
4. Neue Seiten holen Fachinhalte über `getModule(moduleId)` aus der Registry, nicht über einen
   direkten Import von `modules/pflege`. Die Liste der Dateien, die Pflege direkt laden dürfen,
   steht in `registry.test.ts` und darf nur kleiner werden.

## Startgröße

`scripts/check-bundle.mjs` begrenzt, was die App beim Start lädt (gzip, Budget im Skript).
Große, selten gebrauchte Teile (PDF, OCR, Fallbibliotheken) per `import()` erst bei Bedarf laden.
Größter Einzelposten ist derzeit der Pflege-Katalog (~100 KB); wer das Budget bewusst anhebt,
begründet es im PR.

## Fremde Dateien und KI-Eingaben

- Grenzen für Importe stehen gesammelt in `src/features/dokumente/import/grenzen.ts` (`GRENZEN`): Dateigröße,
  ZIP-Einträge und entpackte Größe (vor dem Entpacken aus dem Inhaltsverzeichnis), Kompressionsrate,
  XML-Größe/-Tiefe und DOCTYPE/ENTITY-Verbot für Office-Teile, PDF-Seiten, Bildpunkte, Klassencodes.
  Neue Leser für Fremdformate prüfen ihre Eingaben dort, statt eigene Zahlen einzuführen.
- Der Dateityp kommt aus der Signatur, nicht aus der Endung (`detectKind`); Abweichungen landen im Importbericht.
- Import und Texterkennung sind über `signal` (AbortSignal) abbrechbar.
- Dokumentinhalt ist für die KI fremdes Material: `rufe()` hängt `FREMDE_DATEN` an jede Systemanweisung,
  `abschnitteAlsText`/`entschaerfe` verhindern, dass Quelltext einen Quellblock schließt, `rufeJson` prüft
  die Antwort gegen das Schema. Beim Import meldet `anweisungen.ts` Text, der wie eine KI-Anweisung aussieht.
  Testdokumente dazu: `import/grenzen.test.ts`, `zusammenfasser/fremde-daten.test.ts`.
- Sicherungsdateien haben eigene Grenzen (`SICHERUNG_GRENZEN` in `src/core/sicherung.ts`): Dateigröße vor dem
  Lesen (`leseSicherungsDatei`), entpackte Größe beim Entschlüsseln (`ENTPACKT_MAX`), Zeilen je Tabelle,
  Primärschlüssel und Versionen in `lesePruefe`, bevor eine Transaktion beginnt. Vor jedem Einspielen entsteht
  eine Rückfallsicherung; `vergleiche()` liefert die Vorschau (neu, neuer in der Datei, Konflikt, nur hier).
  Abnahmefall zwei Geräte: `src/core/sicherung-zwei-geraete.test.ts`. Neue laufende Durchläufe (ein Objekt mit
  `id` je Gerät) in `LAUFEND_LABEL` eintragen, damit die Vorschau sie benennt.

## PWA und Abhängigkeiten

- Nach jedem Update von `vite-plugin-pwa`/Workbox: `npm run build`, Vorschau starten und `npm run test:offline`
  (ist auch Teil von `npm run check`). Geprüft werden Service Worker, Vorab-Cache, alle Menüseiten ohne Netz und
  ein kalter Start ohne Netz.
- So kommen neue Versionen an (vor allem auf dem iPhone, wo Safari den Service Worker selten prüft):
  - Seitenaufrufe gehen zuerst ans Netz (`vite.config.ts`, Regel `request.mode === 'navigate'`, 4 s Zeitgrenze);
    nur ohne Netz kommt `index.html` aus dem Vorab-Cache. Ein Neuladen reicht also. `navigateFallback` und
    `directoryIndex` sind dafür abgeschaltet, sonst beantwortet der Vorab-Cache „/“ selbst.
  - Der Build legt `version.json` mit der Build-ID ab. `src/ui/shell/aktualisierung.ts` fragt sie beim Start, beim
    Zurückholen der App (höchstens einmal pro Minute), wenn das Netz zurückkommt und alle 10 Minuten ab. Ist sie
    anders: Hinweis „Jetzt neu laden“, Service Worker wird angestoßen, beim nächsten Seitenwechsel lädt die App neu.
  - Einstellungen → „Über diese App“ → „Nach neuer Version suchen“ prüft sofort.
  - `npm run test:offline` simuliert eine Veröffentlichung (ändert kurz `dist/version.json` und `dist/index.html`).
- `package.json` → `overrides` hebt `glob` unter `workbox-build` auf eine Version ohne bekannte Lücken.
  Übrig bleibt `deepmerge` (niedrig, nur Build-Kette, kein Fix verfügbar).
- Die Build-ID (Commit · Datum) steht unter Datensicherung und auf Fehlerseiten. Ein „+“ heißt: mit lokalen Änderungen gebaut.

## Barrierefreiheit

- `npm run test:barrierefreiheit` (Teil von `npm run check`) öffnet jede Menüseite aus `nav.ts` auf dem iPhone mit
  sehr großer Schrift und prüft axe nach WCAG 2.2 AA, sichtbaren Tastaturfokus für die ersten 20 Tab-Schritte und
  Textalternativen für SVG/Canvas. Ausnahmen stehen begründet in `AUSNAHMEN` im Skript (bisher nur die Zielgröße
  der Landkartenknoten, weil sich die Karte zoomen lässt und die Suche gleichwertig auswählt).
- Regeln: Reiter mit `role="tab"` tragen `aria-selected`, kein `aria-pressed`. Diagramme bekommen
  `role="img"` mit einer `aria-label`, die die Zahlen nennt, oder eine Liste/Tabelle daneben. Anklickbare
  Elemente ohne Button (z. B. Tabellenzeilen) brauchen `tabIndex={0}` und Enter/Leertaste. Schriftgrößen nur in rem.
- `npm run test:lernalltag` prüft Dienstplan, liegen gebliebene Blöcke, Kompetenzbereiche, Kalenderexport,
  Fundstelle, Original neben der Zusammenfassung, Lese-/Dublettenhinweise, Fehlerheft-Rückwege und Lernstufen.

## Lernergebnisse an den Lernplan melden

Neue Module melden Ergebnisse über `bucheErgebnis` aus `src/features/lernplan/ergebnis.ts` (oder `logReview(…, meta)`
bzw. `inLernplan(…, versuchId)` für einfache Trainer). Pflichtangaben: `versuchId` (`<modul>:<ref>:<lauf>`, stabil je
Versuch), `herkunft` (Modul, Fall/Karte, optional bewertete Kriterien), `status` (abgeschlossen/offen/abgebrochen),
`aussagekraft` (abruf/anwendung/uebung) und die Ergebnisse je Thema. Dieselbe versuchId zählt je Thema nur einmal;
offen, abgebrochen und uebung werden protokolliert, zählen aber nicht (`evidenceRating`). Je Modul, Thema und Tag
zählt nur der erste abgeschlossene Versuch, weitere werden als Übung protokolliert.
