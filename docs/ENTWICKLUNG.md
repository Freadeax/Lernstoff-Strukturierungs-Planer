# Entwicklung: sicher ändern

Kurzfassung für jede Änderung, egal ob von Hand oder von Claude in einem eigenen Thread.

## Ablauf

1. Von aktuellem `origin/main` ausgehen. Einen kurzen Arbeitszweig nur für den PR anlegen.
2. Ändern, dann **`npm run check`**. Das prüft der Reihe nach: Typen, Unit-Tests,
   Katalog-JSON gegen YAML, Build, Startgröße und alle Browser-Prüfungen gegen den gebauten Stand
   (eigener freier Port, kein laufender Server nötig). `npm run check:schnell` lässt den Browser weg.
3. Vor dem Merge `origin/main` hereinholen und `npm run check` noch einmal ausführen.
4. Squash-Merge auf `main`, Arbeitszweig sofort löschen. `main` ist der einzige dauerhafte Branch.
5. Keine GitHub Actions für Tests: Prüfungen laufen lokal.

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
