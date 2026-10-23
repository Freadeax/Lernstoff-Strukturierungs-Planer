# Zusammenfasser
Arbeitsmodi (originalgetreu, Lernen, Arbeitsauftrag, Prüfung, Vergleich). Jede Aussage ist ein `Claim` mit `Citation`.
Spezifikation: `docs/ZUSAMMENFASSER.md`.

- `typen.ts`: Typen nur für den Zusammenfasser (Aufgaben, Prüfungsfragen, Vergleich, PipelineRun). Belege, Claim-Arten, Blöcke und Befunde stehen im Kern.
- `prompts/`: Prompt-Vorlagen mit Versionsnummer im Kopf. Platzhalter `{{…}}` setzt die Pipeline.
- `zerlegen.ts`: wandelt die Citations-Antwort in Aussagen mit Belegen um.
