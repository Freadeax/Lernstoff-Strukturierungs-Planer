# Praxissimulator neu – Kern (Paket P0)

Reiner, deterministischer Simulationskern für beide Spuren (A Pflege/Generalistik, B Akut/Notfall/Intensiv).
Noch nicht in der Oberfläche eingebunden; die alte Engine (`../engine.ts`) und Stufe 1 (`../gefuehrt`) laufen unverändert.

| Datei | Inhalt |
|---|---|
| `typen.ts` | Datenvertrag: Fallschema v2, Maßnahmen mit Befugnis je Rolle, Bedingungen, Event-Log |
| `bedingung.ts` | `pruefe(bedingung, kontext)` |
| `katalog.ts` | Handlungskatalog P3: 141 Maßnahmen, 6 Reiter, Spur A und B, Befugnis je Drittel, `NACHWEIS` je Maßnahme |
| `lehrplan-belege.ts` | Fundstellen im BW-Landeslehrplan 3BFP (Seite, CE, Drittel), Belegstärke je Spalte |
| `einrichtung.ts` | Einrichtungsprofil: Grundwerte strenger/lockerer, `mitEinrichtung(fall, profil)` vor `start()` |
| `matrix.ts` | lesbare Befugnis-Matrix (Markdown) für die fachliche Prüfung |
| `modell.ts` | Schnittstelle `PhysiologieModell` + Platzhalter. P1 ersetzt ihn über `setzeModell()` |
| `kern.ts` | `start`, `sende`, `vorspulen`, `replay`, `freigabe`, `verfuegbar`, `anzeige` |
| `faelle/` | Fälle im Schema v2 (Pilotstaffel) |

Regeln
- Zustand = Fall + Eingaben. `sende()` gibt immer einen neuen Zustand zurück.
- Logik-Takt 5 s Spielzeit; der Monitor interpoliert selbst (Render-Takt).
- Wartezeiten nie zusammenfassen (Takt-Grenzen ändern sonst das Ergebnis).
- Freigabe: `nur-aerztlich` und `gesperrt` → Grenze (gesperrt = in diesem Drittel nicht, keine ärztliche Aufgabe); anordnungspflichtig ohne Anordnung → braucht Anordnung; `mit-anleitung` → mit PA.
  Stufe 2: PA unterstützt bzw. warnt und führt nicht aus. Stufe 3: Knopf bleibt klickbar, `grenzueberschreitung` im Log.
- Neuer Fall: Datei in `faelle/`, in `faelle/index.ts` eintragen. `kern.test.ts` prüft Verweise, Musterweg (keine Fehler,
  alle Pflichthandlungen), Unterlassungsweg, Grenzweg und Replay automatisch.
- Konzept: Projektordner `praxissimulator-neu/KONZEPT.md`.
- Neue Katalog-Maßnahme: in `katalog.ts` mit `nw([...Lehrplan-Stellen])` oder `NICHT_BELEGT('Grund')`; `katalog.test.ts` prüft
  Nachweis, Monotonie der Befugnis (nie strenger mit der Ausbildung), Risiko bei Sperren, Spur-B-Bereiche, Wirkkurven.
- Matrix neu erzeugen: `BEFUGNIS_MATRIX=<pfad>.md npx vitest run src/features/praxis/kern/katalog`.
