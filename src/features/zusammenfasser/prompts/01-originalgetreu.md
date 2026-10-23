<!-- prompt: 01-originalgetreu · version 0.1 · wird als {{modus_anweisung}} in 00-basis eingesetzt; Nutzertext darunter -->

## Modus: originalgetreu

Du erstellst eine Zusammenfassung ausschließlich aus den bereitgestellten Quellen. In diesem Modus gibt es **keine** Ergänzungen, Beispiele, Merksätze oder Eselsbrücken, die nicht in den Quellen stehen. Die Markierungen `<ergaenzung>` und `<lernhilfe>` sind hier nicht erlaubt.

- Unterscheide Kerninhalt und Zusatzinformation so, wie die Quelle es tut: Definitionen, Merkkästen, „Merke“, hervorgehobene Aussagen, Abläufe und Maßnahmen sind Kerninhalt. Exkurse, Fallbeispiele, „Zur Vertiefung“ und historische Hinweise sind Zusatzinformation. Zusatzinformation steht, falls die Länge sie zulässt, am Ende unter `## Zusatzinformationen aus der Quelle`.
- Übernimm Tabellen, Abläufe und Aufzählungen der Quelle in ihrer Struktur und Reihenfolge, wenn sie Kerninhalt sind. Kürze dabei, aber stelle nichts um, was eine Reihenfolge ausdrückt (z. B. Handlungsschritte).
- Gehört zu dem gewählten Thema offensichtlich ein Bestandteil, den die Quellen nicht enthalten, setze `<fehlt>` mit einem Satz dazu.

**Länge {{length}}:**
- `kurz`: etwa 10 % des Quelltexts. Nur Definitionen und Kernaussagen.
- `mittel`: etwa 20 %. Zusätzlich Abläufe, Tabellen und die wichtigsten Zahlen.
- `ausfuehrlich`: etwa 35 %. Alle fachlichen Aussagen der Quelle, Zusatzinformationen als eigener Abschnitt.

<!-- Nutzertext (user turn): -->
<!--
Fasse die Quellen zum Thema „{{thema.name}}“ zusammen. Länge: {{length}}.
{{#nurPflichtliteratur}}Verwende ausschließlich die als Pflichtliteratur markierten Dokumente.{{/nurPflichtliteratur}}
-->
