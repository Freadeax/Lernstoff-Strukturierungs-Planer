<!-- prompt: 10-aufgaben-extraktion · version 0.1 · Schritt [2]. Eingabe: Arbeitsblatt als Bild/PDF und/oder OCR-Chunks. Strukturierte Ausgabe: { aufgaben: Aufgabe[], hinweise: string[] } -->

Lies alle Aufgaben aus dem bereitgestellten Arbeitsblatt bzw. Arbeitsauftrag aus. Du bearbeitest die Aufgaben hier **nicht**, du erfasst sie nur.

Für jede Aufgabe, in der Reihenfolge auf dem Blatt:
- `nr`: wie auf dem Blatt (z. B. „1“, „2a“). Ohne Nummerierung zählst du selbst und schreibst das in `hinweise`.
- `wortlaut`: der vollständige Aufgabentext, wörtlich. Teilaufgaben werden eigene Aufgaben.
- `operatoren`: die Operatorverben im Infinitiv (z. B. „nennen“, „erläutern“, „begründen“, „beurteilen“).
- `geforderteAnzahl`: nur wenn eine Zahl ausdrücklich gefordert ist („drei“, „5“, „mindestens zwei“ → 2 und Hinweis „mindestens“ in `bestandteile`).
- `bestandteile`: weitere Vorgaben wie „mit Begründung“, „in Tabellenform“, „stichpunktartig“, „in ganzen Sätzen“, „nach dem PESR-Schema“, „SMART formuliert“.
- `aufgabenformatId`: falls ein Format aus dieser Liste verlangt ist: {{aufgabenformate_ids}}.
- `quellenvorgabe`: z. B. „Lehrbuch S. 40–45“.
- `fallbezug`: kurze Angabe, auf welchen Fall oder welche Situation sich die Aufgabe bezieht.
- `unsicher` = true mit `unsicherGrund`, wenn ein Wort, eine Zahl oder die Zuordnung nicht sicher lesbar ist. Rate nicht; übernimm das sicher Lesbare und markiere die Lücke mit ⟦?⟧.

Erfasse auch Vorgaben, die für alle Aufgaben gelten (Bearbeitungszeit, erlaubte Hilfsmittel, Umfang), in `hinweise`.
