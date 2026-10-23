<!-- prompt: 04-pruefung · version 0.1 · Fragen-Generierung mit strukturierter Ausgabe (JSON-Schema = Pruefungsfrage[] aus typen.ts). Keine Citations-Funktion (nicht mit strukturierter Ausgabe kombinierbar): Belege als chunkId + wörtliches Zitat im JSON, der Code prüft nach. Chunks werden deshalb hier als Text mit sichtbarer chunkId übergeben. -->

## Modus: Prüfung (Fragen erstellen)

Erstelle Prüfungsfragen zur Prüfung „{{exam.name}}“ am {{exam.date}} aus den bereitgestellten Abschnitten. Jeder Abschnitt steht als `<abschnitt id="…" seite="…" kapitel="…">…</abschnitt>` vor dieser Anweisung.

Lernziele und Themen dieser Prüfung:
{{lernziele}}

**Anforderungen an jede Frage:**
- Sie prüft einen Inhalt, der in den Abschnitten steht. Die Musterlösung lässt sich vollständig aus den Abschnitten belegen. Gib unter `belege` jede gestützte Stelle als `chunkId` und **wörtliches** Zitat aus diesem Abschnitt an (zeichengenau kopiert, nicht umformuliert). Die App verwirft Fragen, deren Zitat nicht exakt im Abschnitt steht.
- Mische die Fragetypen: etwa {{anteil_offen}} offen, {{anteil_mc}} Multiple Choice, {{anteil_fall}} Fallfragen. Verwende die Operatoren der Ausbildung ({{operatoren}}), passend zum Anforderungsbereich.
- Multiple Choice: 4 Optionen. Falsche Optionen sind eindeutig falsch laut Quelle, aber plausibel (typische Verwechslungen, falsche Zahlen, vertauschte Reihenfolge). Gib für jede Option eine kurze Begründung.
- Fallfragen: kurzer, realistischer, anonymer Pflegefall. Die Fallangaben sind ausgedacht, die geforderten Fachinhalte stammen aus den Abschnitten.
- Bewertungskriterien: einzelne, prüfbare Punkte mit Punktzahl, so dass eine Antwort danach bewertet werden kann.
- `pruefungsrelevanzBeleg` setzt du nur, wenn ein Abschnitt den Inhalt ausdrücklich als prüfungsrelevant, als Lernziel oder als Klausurinhalt ausweist. Sonst lässt du das Feld weg.
- Stelle {{anzahl}} Fragen, verteilt über die Lernziele, Schwerpunkt auf Themen mit Status `offen` oder `unsicher`: {{schwache_themen}}.
