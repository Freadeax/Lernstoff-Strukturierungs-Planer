# Praxissimulator neu – Kern (Paket P0)

Reiner, deterministischer Simulationskern für beide Spuren (A Pflege/Generalistik, B Akut/Notfall/Intensiv).
Noch nicht in der Oberfläche eingebunden; die alte Engine (`../engine.ts`) und Stufe 1 (`../gefuehrt`) laufen unverändert.

| Datei | Inhalt |
|---|---|
| `typen.ts` | Datenvertrag: Fallschema v2, Maßnahmen mit Befugnis je Rolle, Bedingungen, Event-Log |
| `bedingung.ts` | `pruefe(bedingung, kontext)` |
| `katalog.ts` | Handlungskatalog (Startbestand; P3 baut aus und belegt Befugnisse mit BW-Lehrplan 3BFP) |
| `modell.ts` | Schnittstelle `PhysiologieModell` + Platzhalter. P1 ersetzt ihn über `setzeModell()` |
| `kern.ts` | `start`, `sende`, `vorspulen`, `replay`, `freigabe`, `verfuegbar`, `anzeige` |
| `faelle/` | Fälle im Schema v2 (Pilotstaffel) |

Regeln
- Zustand = Fall + Eingaben. `sende()` gibt immer einen neuen Zustand zurück.
- Logik-Takt 5 s Spielzeit; der Monitor interpoliert selbst (Render-Takt).
- Wartezeiten nie zusammenfassen (Takt-Grenzen ändern sonst das Ergebnis).
- Freigabe: `nur-aerztlich` → Grenze; anordnungspflichtig ohne Anordnung → braucht Anordnung; `mit-anleitung` → mit PA.
  Stufe 2: PA unterstützt bzw. warnt und führt nicht aus. Stufe 3: Knopf bleibt klickbar, `grenzueberschreitung` im Log.
- Neuer Fall: Datei in `faelle/`, in `faelle/index.ts` eintragen. `kern.test.ts` prüft Verweise, Musterweg (keine Fehler,
  alle Pflichthandlungen), Unterlassungsweg, Grenzweg und Replay automatisch.
- Konzept: Projektordner `praxissimulator-neu/KONZEPT.md`.
