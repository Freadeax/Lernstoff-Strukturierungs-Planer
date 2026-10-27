# Skript (`#/lernen/skript`)

Belegte Lernzusammenfassungen (Markdown) offline lesen, nach Curricularen Einheiten (CE, LEB) gegliedert.

- **Inhalte nie im App-Repo.** Die Texte stützen sich auf Unterrichtsmaterial und lizenzierte Bücher. Sie kommen aus dem privaten Material-Repo (Ordner `skripte/`, Token aus „Große Dateien“) oder als `.md`/`.zip` vom Gerät und liegen dann in IndexedDB (Tabelle `skripte`, DB-Version 6).
- **Format:** siehe `parser.ts` (Kopf `themen: [...]`, `# CE 09 · Titel`, Quellenliste `- **[D]** Datei`, Abschnitte `##`, Belege `[D, S. 18]`, ⚠ = nicht belegt).
- **Verknüpfungen:** Themen (aus dem Dateikopf, sonst Vorschlag, im Leser änderbar) → Lernplan „Heute“ und Themen-Landkarte zeigen „Im Skript lesen“; Abschnitte → Karteikarten (nur belegte Punkte, Beleg auf der Rückseite); Lesezeit → `logStudy` (zählt als Lernzeit, nicht als Wissensnachweis).
- Lesestand in `localStorage` (`lernstoff.skript.lesestand`), wandert mit der Datensicherung.
