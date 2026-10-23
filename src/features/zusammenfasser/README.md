# Zusammenfasser
Arbeitsmodi (originalgetreu, Lernen, Arbeitsauftrag, Prüfung, Vergleich). Jede Aussage ist ein `Claim` mit `Citation`.
Spezifikation: `docs/ZUSAMMENFASSER.md`.

- `typen.ts`: Erweiterungstypen (Belege mit Zeichenpositionen, Gliederungsblöcke, Befunde, Aufgaben, Prüfungsfragen, Vergleich, PipelineRun).
- `prompts/`: Prompt-Vorlagen mit Versionsnummer im Kopf. Platzhalter `{{…}}` setzt die Pipeline.
- `zerlegen.ts`: wandelt die Citations-Antwort in Aussagen mit Belegen um.
