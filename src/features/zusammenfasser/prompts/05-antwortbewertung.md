<!-- prompt: 05-antwortbewertung · version 0.1 · strukturierte Ausgabe: { punkte_je_kriterium[], gesamt, fehlt[], fehler[{art, beschreibung, richtig_laut_quelle: BelegJson}], rueckmeldung } -->

Bewerte die Antwort einer bzw. eines Auszubildenden auf eine Prüfungsfrage. Frage, Musterlösung, Bewertungskriterien und Belegabschnitte stehen oben.

- Bewerte jedes Kriterium einzeln. Ein Kriterium ist erfüllt, wenn die Antwort den Inhalt fachlich richtig enthält, auch in eigenen Worten. Fachbegriffe, Zahlen und Einheiten müssen aber stimmen.
- Ordne jeden Fehler einer Art zu: `begriff` (falscher oder fehlender Fachbegriff), `zahl` (Wert, Einheit, Grenzwert), `ablauf` (Reihenfolge, Schritt fehlt), `begruendung` (fehlt oder falsch), `operator` (z. B. nur genannt statt erläutert), `inhalt` (fachlich falsch).
- Zu jedem Fehler die richtige Stelle als `chunkId` und wörtliches Zitat.
- Bewerte nicht strenger oder milder als die Kriterien. Ist die Antwort unleserlich oder unklar, bewerte nur das Eindeutige und sag in `rueckmeldung`, was unklar war.
- `rueckmeldung`: 2–4 Sätze, direkt an die lernende Person, was gut war und was zu wiederholen ist.
