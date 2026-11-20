# Aufbau der Übungen (seit November 2026)

Unter „Üben“ standen bis November 2026 29 Einträge, viele davon gleich gebaute Einzeltrainer.
Sie werden in drei Stufen zusammengeführt:

1. **Wissenstrainer** (`#/lernen/wissen`, `src/features/wissen`): alle Fragen-Fachgebiete auf dem
   Übungskern `src/features/quiz` – Anatomie, Arzneimittel, Normwerte, Labor, Hygiene, Notfall,
   Expertenstandards, Recht, Grundlagen. Übersicht mit Stand je Fachgebiet, eigene Runde aus
   mehreren Fachgebieten/Bereichen, „Meine Schwachstellen“ über alle Fachgebiete, Fachbegriff-Duell als Spielmodus.
2. **Fertigkeiten-Trainer** (geplant): Reanimation, ABCDE, Ablauf-Werkbank, Hör-Trainer, Rechentrainer,
   Labor-Werkbank, Hygiene-Suchbilder.
3. **Dokumentations-Trainer** (geplant): SIS, Assessments, Pflegeplanung, Pflegebericht, Übergabe, Fallakte.

Eigenständig bleiben Praxissimulator, Fallsimulator, Labor und Bildgebung, Krankheitsbilder,
Gesprächssimulator, Karteikarten, Fehlerheft, Prüfungssimulation, Examen und Klassenmodus.

## Was beim Zusammenführen gleich bleibt

- Interne Kennungen je Fachgebiet (`hygiene`, `anatomie` …) als Fehlerheft-Quelle, Lernplan-Trainer,
  Speicherplatz `lernstoff.<fach>.stand` und Zwischenstand. Dadurch bleiben Lernstand, Fehlerheft,
  Datensicherung und begonnene Runden ohne Umzug gültig.
- Alte Adressen (`#/lernen/hygiene?bereich=psa&runde=1` …) leiten mit allen Angaben weiter
  (`src/features/wissen/pfad.ts`, `weiterleitungFuer`, in `App.tsx`).
- Gemischte Runden buchen Fehler und Lernplan je Aufgabe beim eigenen Fachgebiet
  (`Runde`-Props `quelleVon`, `trainerVon`, `kennung`); ihr Zwischenstand liegt unter `wissen`.

## Neues Fachgebiet im Wissenstrainer

1. Aufgaben wie bisher in `src/features/<fach>/aufgaben.ts` (BEREICHE, AUFGABEN, Vertiefung).
2. Kennung in `FACH_IDS` und `FACH_NAME` (`wissen/pfad.ts`), Eintrag in `FAECHER` (`wissen/faecher.ts`).
3. Wie bisher: `TrainerId`, `TRAINER_NAME`, `FehlerQuelle` + `QUELLE_LABEL`, `QUIZ_QUELLEN`,
   `uebungenFuer` (Pfad über `wissenPfad`), `trainerpool.ts`, `vertiefung.test.ts`.
   Kein neuer Menüeintrag und keine neue Route.
