# Skript (`#/lernen/skript`)

Belegte Lernzusammenfassungen (Markdown) offline lesen, nach Curricularen Einheiten (CE, LEB) gegliedert.

- **Inhalte nie im App-Repo.** Die Texte stützen sich auf Unterrichtsmaterial und lizenzierte Bücher. Sie kommen aus dem privaten Material-Repo (Ordner `skripte/`, Token aus „Große Dateien“) oder als `.md`/`.zip` vom Gerät und liegen dann in IndexedDB (Tabelle `skripte`, DB-Version 7).
- **Format:** siehe `parser.ts` (Kopf `themen: [...]`, `# CE 09 · Titel`, Quellenliste `- **[D]** Datei`, Abschnitte `##`, Belege `[D, S. 18]`, ⚠ = nicht belegt).
- **Verknüpfungen:** Themen (aus dem Dateikopf, sonst Vorschlag, im Leser änderbar) → Lernplan „Heute“ und Themen-Landkarte zeigen „Im Skript lesen“; Abschnitte → Karteikarten (nur belegte Punkte, Beleg auf der Rückseite); Lesezeit → `logStudy` (zählt als Lernzeit, nicht als Wissensnachweis).
- Lesestand in `localStorage` (`lernstoff.skript.lesestand`), wandert mit der Datensicherung.
- **Belegprüfung** (`pruefung.ts`): je Abschnitt und gesamt getrennt „Quelle fehlt“ (Kürzel nicht im Quellenverzeichnis oder kein Verzeichnis), „Seite fehlt“ (Beleg ohne Seite), Punkte ohne Beleg und ⚠-Stellen. Quellen-/Literaturabschnitte zählen nicht.
- **Stabile Links:** `#/lernen/skript?id=<skript>&nr=<Abschnittsnummer>`. Die Nummer aus `## 3 · …` hat Vorrang vor `a=a3` (Reihenfolge). Karteikarten-IDs hängen ebenfalls an der Nummer (`skr:<skript>:n3:1`); beim erneuten Übernehmen behalten gleiche Karten ihre alte ID.
- **Fassungen:** Ein geänderter Neuimport hebt die alte Gliederung in `fassungen` auf (höchstens zehn). Der Lesestand wird über Nummer bzw. Titel auf die neue Fassung abgebildet, ein Link auf eine entfallene Nummer nennt die Fassung und den damaligen Titel.
- **Freigabe:** `freigabe: JJJJ-MM-TT, wer` im Kopf = fachlich freigegeben (CE-Matrix, Belegprüfung).
