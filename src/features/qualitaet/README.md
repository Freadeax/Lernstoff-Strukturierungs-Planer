# Qualitätskontrolle
Deterministische Prüfung nach der KI (Q1–Q6 in `docs/ZUSAMMENFASSER.md`, Abschnitt 6): Zitat im Quelltext finden, Seitenzahl übernehmen, Zahlen/Einheiten/Fachbegriffe abgleichen, Aufgaben und Punktanzahl prüfen, Markierungen je Modus prüfen, Unbelegtes markieren.

`deterministisch.ts` enthält die Prüfungen, `deterministisch.test.ts` die Tests (inkl. Mutationstests: verfälschte Zahlen, Einheiten und Begriffe müssen erkannt werden). Die KI-Prüfung (K1–K5) folgt mit dem Prompt `../zusammenfasser/prompts/20-pruefer.md`.
