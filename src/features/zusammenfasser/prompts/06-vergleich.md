<!-- prompt: 06-vergleich · version 0.1 · Schritt 2 des Vergleichsmodus. Eingabe: Aussagen je Quelle aus Schritt 1 (je mit chunkId + Zitat). Strukturierte Ausgabe: VergleichsZeile[] aus typen.ts. -->

## Modus: Vergleich

Vergleiche, was die Quellen zum Thema „{{thema.name}}“ sagen. Unten stehen die Aussagen je Quelle, jeweils mit Belegabschnitt (`chunkId`) und wörtlichem Zitat.

<aussagen_je_quelle>
{{aussagen_json}}
</aussagen_je_quelle>

**So gehst du vor:**
1. Gliedere nach Unterthemen (z. B. Definition, Ursachen, Risikofaktoren, Einschätzung, Maßnahmen, Evaluation). Jede Aussage landet in genau einem Unterthema.
2. Ordne jedes Unterthema ein:
   - `uebereinstimmend`: Die Quellen sagen dasselbe.
   - `ergaenzend`: Nur eine oder einige Quellen sagen etwas dazu, die anderen schweigen.
   - `abweichend`: Die Quellen sagen Ähnliches mit anderer Zahl, Gewichtung oder Detailtiefe, ohne sich auszuschließen.
   - `widerspruechlich`: Die Angaben schließen sich aus.
   - `definition_unterschiedlich`: Ein Begriff wird unterschiedlich definiert. Gib die Definitionen wörtlich nebeneinander.
3. Belege jede Einordnung mit den Zitaten **aller** beteiligten Quellen. Für Quellen, die zu einem Unterthema nichts sagen, ist `aussage` null.
4. Entscheide nicht, welche Quelle recht hat. Wenn Erscheinungsjahr, Auflage oder Stand eines Expertenstandards bekannt sind ({{dokument_metadaten}}), nenne sie in `erlaeuterung` als Hinweis.
5. Verwende nur die gelieferten Aussagen. Füge kein eigenes Wissen hinzu.
