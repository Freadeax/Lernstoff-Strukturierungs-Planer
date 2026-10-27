# Zusammenfasser
Arbeitsmodi (originalgetreu, Lernen, Arbeitsauftrag, Prüfung, Vergleich). Jede Aussage ist ein `Claim` mit `Citation`.
Spezifikation: `docs/ZUSAMMENFASSER.md`.

- `typen.ts`: Typen nur für den Zusammenfasser (Aufgaben, Prüfungsfragen, Vergleich, PipelineRun). Belege, Claim-Arten, Blöcke und Befunde stehen im Kern.
- `prompts/`: Prompt-Vorlagen mit Versionsnummer im Kopf. Platzhalter `{{…}}` setzt die Pipeline.
- `zerlegen.ts`: wandelt die Citations-Antwort in Aussagen mit Belegen um.
- `ki.ts`: gemeinsame KI-Aufrufe (Streaming, `stop_reason`, strukturierte Ausgabe, Abschnitte mit chunkId).
- `pipeline.ts`: Text-Modi originalgetreu, Lernen, Arbeitsauftrag mit Code-Prüfung, KI-Prüfer, Gate und einer Reparaturrunde; baut die Gliederung (`Summary.blocks`).
- `pruefer.ts`: KI-Prüfer [6], Urteile → Befunde K1–K5.
- `aufgaben.ts`: Aufgaben aus dem Arbeitsblatt lesen [2]; `pruefung.ts`: Prüfungsfragen und Antwortbewertung; `vergleich.ts`: Vergleichsmodus.
- `belege.ts`: Belege aus JSON-Antworten (chunkId + Zitat) per Code prüfen.
- `ui/`: Anzeige je Modus, eingebunden in `../Zusammenfassen.tsx`.
- `grosseQuellen.ts`: große Quellen in Teilen zusammenfassen, Ergebnisse und Läufe verbinden.
- `ki.ts` enthält auch `Protokoll`: sammelt jeden Aufruf eines Laufs für den `PipelineRun` (Tabelle `pipelineRuns`).
