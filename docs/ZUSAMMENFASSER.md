# Zusammenfasser: KI-Pipeline, Modi und Qualitätskontrolle

Stand: 2026-10-23 · Teilblock zu den Abschnitten 2 („Zusammenfasser-Modi“) und 5 („Qualitätskontrolle“) der Anforderungen.
Richtet sich nach dem Kernvertrag `src/core/types.ts` und `docs/ARCHITEKTUR.md`.

| Datei | Inhalt |
|---|---|
| `docs/ZUSAMMENFASSER.md` | dieses Dokument |
| `src/features/zusammenfasser/typen.ts` | Typen nur für den Zusammenfasser (Aufgaben, Prüfungsfragen, Vergleich, Pipeline-Läufe) |
| `src/features/zusammenfasser/prompts/` | Prompt-Vorlagen: Basis, fünf Modi, Aufgaben-Extraktion, KI-Prüfer, Reparatur |
| `src/features/zusammenfasser/zerlegen.ts` | Schritt [4]: Citations-Antwort in Aussagen zerlegen |
| `src/features/qualitaet/deterministisch.ts` | Prüfungen, die per Code statt per KI laufen (Zitat, Zahlen, Begriffe, Punktanzahl, Markierungen) |
| `src/features/qualitaet/deterministisch.test.ts` | Tests inkl. Mutationstests, `npm test` |

---

## 1. Leitgedanke

Die KI schreibt, der Code prüft. Jede fachliche Aussage einer Zusammenfassung ist ein `Claim` mit mindestens einem Beleg auf einen `SourceChunk`. Was sich nicht belegen lässt, wird nicht stillschweigend gezeigt, sondern als unbelegt, fehlend oder ergänzend markiert. Die Qualitätskontrolle besteht aus zwei unabhängigen Schichten:

1. **Deterministische Prüfungen (Code):** Zitat steht wirklich im Quelltext, Seite stimmt, Zahlen und Einheiten stimmen, Fachbegriffe sind nicht ersetzt, Punktanzahl stimmt. Diese Schicht kann nicht „halluzinieren“.
2. **KI-Prüfer (zweiter, getrennter Aufruf):** Stützt das Zitat die Aussage inhaltlich? Werden Definitionen vermischt? Ist der Operator erfüllt? Widersprechen sich Quellen?

Erst wenn beide Schichten durch sind, entscheidet ein Gate (Abschnitt 7), ob das Ergebnis angezeigt, mit Warnungen angezeigt, automatisch repariert oder mit Rückfragen an dich zurückgegeben wird.

---

## 2. Pipeline im Überblick

```
 Import (Thread „Dokumentimport“)
   └─► SourceChunks mit Seite, Kapitel, OCR-Güte
        │
 [1] Quellenauswahl ───── Nutzer wählt Fach/Thema/Dokumente, Modus, Länge
        │                 Volltextsuche (MiniSearch) wählt passende Chunks, Budget ≤ ~150k Token
 [2] Aufgabenanalyse ──── nur Arbeitsauftrags- und Prüfungsmodus:
        │                 Aufgaben, Operatoren, geforderte Anzahl als JSON → Nutzer bestätigt
 [3] Generierung ──────── Claude + Citations, Quellen als „custom content“-Dokumente
        │                 (1 Content-Block = 1 Chunk → Beleg zeigt exakt auf chunkId)
 [4] Zerlegen ─────────── Antwort → Blöcke → Claims mit Citations, Markierungen auswerten
 [5] Prüfung Code ─────── Q1 Zitat · Q2 Zahlen/Einheiten · Q3 Begriffe · Q4 Vollständigkeit
        │                 Q5 Lesbarkeit · Q6 Markierungen/Moduspflichten
 [6] Prüfung KI ───────── Belegtreue, Definitionsvermischung, Widerspruch, Operator
        │                 (strukturierte Ausgabe, eigener Prompt, gleiche Chunks aus dem Cache)
 [7] Gate ─────────────── anzeigen │ mit Hinweisen anzeigen │ 1× Reparatur │ Rückfrage an Nutzer
        │
 [8] Ausgabe ─────────── Ampel je Aussage, Klick → Originalstelle, Quellenverzeichnis, Export
```

Jeder Lauf wird als `PipelineRun` gespeichert (Eingaben, Prompt-Version, Modell, Befunde). So lässt sich später nachvollziehen, warum eine Aussage grün oder rot war, und Prompt-Änderungen lassen sich gegen alte Läufe testen.

### KI-Aufrufe und Einstellungen

| Schritt | Modell (Standard) | Aufwand (`effort`) | Ausgabeform |
|---|---|---|---|
| [2] Aufgabenanalyse | `claude-opus-5-5` | `medium` | strukturierte Ausgabe (`output_config.format`, JSON-Schema) |
| [3] Generierung | `claude-opus-5-5` | `high` | Text mit Citations (keine strukturierte Ausgabe, die API erlaubt beides nicht zusammen) |
| [3] Prüfungsfragen, Vergleichsmatrix | `claude-opus-5-5` | `high` | strukturierte Ausgabe, Belege als `chunkId` + wörtliches Zitat im JSON, Code prüft nach |
| [6] KI-Prüfer | `claude-opus-5-5` | `high` | strukturierte Ausgabe |
| Reparatur | `claude-opus-5-5` | `high` | wie [3] |

- Thinking: adaptiv (Standard bei Opus 5.5, lässt sich dort nicht abschalten). `effort` immer explizit setzen, da der Standard bei Opus 5.5 `medium` ist.
- Streaming mit `finalMessage()` für alle langen Aufrufe, `max_tokens` 32 000 bis 64 000.
- Server-seitiges Fallback (`fallbacks: "default"`, Beta-Header `server-side-fallback-2026-07-01`) aktivieren, damit eine Ablehnung durch einen Sicherheitsfilter nicht einfach mit leerem Ergebnis endet. `stop_reason` immer vor dem Lesen prüfen (`refusal`, `max_tokens`).
- Prompt-Caching: Die Quell-Dokumente stehen in allen Aufrufen eines Laufs am Anfang und tragen `cache_control`. Der KI-Prüfer und eine eventuelle Reparatur lesen sie dann aus dem Cache (deutlich günstiger).
- Modell und `effort` sind pro Schritt konfigurierbar (Einstellungsseite), damit du später selbst zwischen Kosten und Gründlichkeit abwägen kannst.

---

## 3. Quellen-Chunking mit Seitenzahlen

Das Zerlegen selbst baut der Thread „Dokumentimport mit OCR und Seitenzuordnung“. Für den Zusammenfasser gelten folgende Anforderungen an `SourceChunk`:

1. **Ein Chunk überschreitet nie eine Seitengrenze.** Dann ist die Seite eines Belegs immer eindeutig. Ein Absatz, der über zwei Seiten läuft, wird an der Seitengrenze getrennt.
2. **Größe:** 80–350 Wörter. Getrennt wird an Überschrift, Absatz, Listenende oder Tabellenende, nie mitten im Satz. Tabellen bleiben als Ganzes ein Chunk (als Markdown-Tabelle), Merkkästen und Definitionskästen ebenfalls.
3. **Zwei Seitenzahlen:** `page` = Seite in der Datei (1-basiert, für das Einblenden), `printedPage` = im Buch gedruckte Seite (aus PDF-Seitenlabels oder Kopf-/Fußzeile). Angezeigt und exportiert wird immer `printedPage`, falls vorhanden, sonst „PDF-S. 12“. Lehrbücher als Scan beginnen fast nie bei Seite 1, deshalb ist das wichtig.
4. **Kapitelpfad** (`chapter`, z. B. „12 Prophylaxen › 12.3 Dekubitusprophylaxe“) aus Überschriften oder Inhaltsverzeichnis.
5. **Unleserliches** wird nicht geraten: im Text als `⟦?⟧` und zusätzlich in `illegibleSpans` mit Zeichenpositionen. `ocrConfidence` pro Chunk.
6. **Normalisierte Fassung** für den Abgleich: Silbentrennung am Zeilenende zusammenführen („Dekubitus-\nprophylaxe“ → „Dekubitusprophylaxe“), Ligaturen auflösen, Anführungszeichen und Gedankenstriche vereinheitlichen, Leerraum zusammenfassen. Der Originaltext bleibt für die Anzeige erhalten. Die Normalisierung liegt als gemeinsame Funktion `normalisiere()` im Prototyp und muss beim Import und bei der Prüfung identisch sein.
7. **Stabile IDs:** `chunkId = hash(documentId, version, page, laufendeNummer)`. Bei einer neuen Dokumentversion werden Chunks über ihren Text-Hash wiedergefunden (siehe Abschnitt 8, Versionsvergleich).

### Übergabe an Claude

Jedes ausgewählte Dokument wird ein `document`-Block mit `source.type: "content"`. Jeder Chunk ist darin ein eigener Text-Block. Damit liefert die Citations-Funktion für jeden Beleg `document_index` und `start_block_index`/`end_block_index`, und der Code kann daraus ohne Raten die `chunkId` ermitteln. (Bei direkter PDF-Übergabe gäbe es nur Seitenangaben, aber keinen Chunk-Bezug und keine Kontrolle über OCR-Text.)

```ts
// Skizze, Typen aus @anthropic-ai/sdk
const dokumentBlock = {
  type: "document",
  source: { type: "content", content: chunks.map(c => ({ type: "text", text: c.text })) },
  title: `${doc.title}`,                       // z. B. "I care Pflege (2. Aufl.)"
  context: `Kapitel: ${kapitelListe}. Seiten ${von}–${bis}.`,
  citations: { enabled: true },
  cache_control: { type: "ephemeral" },        // nur am letzten Dokument
};
// Zuordnung für die Rückübersetzung: blockIndexZuChunk[docIndex][blockIndex] = chunk.id
```

Jeder Chunk-Text beginnt mit einer kurzen Kopfzeile `[S. 412 | 12.3 Dekubitusprophylaxe]`, damit das Modell Seite und Kapitel auch inhaltlich sieht. Diese Kopfzeile wird beim Zitatabgleich ignoriert.

---

## 4. Beleg- und Zitierformat

### Intern (gespeichert)

`Citation` aus dem Kernvertrag (mit Zeichenpositionen für die Hervorhebung):

```ts
{ chunkId, documentId, page, printedPage?, quote, charStart?, charEnd? }
```

`quote` ist immer wörtlicher Quelltext (von der Citations-API geliefert oder vom Modell im JSON angegeben und vom Code nachgeprüft). `charStart/charEnd` setzt der Code beim Abgleich, nicht die KI.

### Anzeige in der App

- Hinter jeder belegten Aussage ein kleiner Verweis: `[1]`, `[2]` … Tippen öffnet die Originalstelle (Seite eingeblendet, Zitat gelb hervorgehoben).
- Ampelfarbe je Aussage: grün = belegt und geprüft, gelb = Abweichung oder Hinweis, rot = unbelegt oder Zitat nicht gefunden, grau = unleserliche Quelle, blau = ergänzendes Wissen (nicht aus deinen Quellen).
- Ergänzungen und Lernhilfen haben einen eigenen Rahmen mit Beschriftung „Ergänzung, nicht aus deinen Unterlagen“ bzw. „Lernhilfe“.

### Export (PDF/Word)

- Im Text: Kurzbeleg in Klammern, z. B. „(I care Pflege, S. 412)“, mehrere mit Semikolon, aufeinanderfolgende Seiten als „S. 412 f.“.
- Am Ende: Quellenverzeichnis mit allen benutzten Dokumenten (Titel, Auflage/Version, Importdatum) und einer Liste offener Punkte (unbelegt, fehlt, widersprüchlich, unleserlich).

### Markierungen im Antworttext

Die Citations-API hängt Belege an Textabschnitte. Für alles, was keinen Beleg haben kann oder soll, nutzt das Modell feste Markierungen, die der Code auswertet:

| Markierung | Bedeutung | erlaubt in |
|---|---|---|
| `<ergaenzung>…</ergaenzung>` | Wissen, das nicht aus den Quellen stammt | Lern-, Arbeitsauftrags-, Prüfungsmodus |
| `<lernhilfe>…</lernhilfe>` | Merksatz, Eselsbrücke, Beispiel, Vergleich | Lernmodus, Prüfungsmodus |
| `<fehlt>…</fehlt>` | Information wird gebraucht, steht aber nicht in den Quellen | alle |
| `<unleserlich seite="…">…</unleserlich>` | Quelle an dieser Stelle nicht sicher lesbar | alle |
| `<widerspruch>…</widerspruch>` | Quellen machen unterschiedliche Angaben (beide Seiten belegt) | alle |
| `<rueckfrage>…</rueckfrage>` | gezielte Frage an dich statt Raten | alle |

Überschriften, Tabellenköpfe und Gliederung gelten als Struktur und brauchen keinen Beleg. Jeder andere Satz ohne Beleg und ohne Markierung ist ein **unbelegter Claim** und wird rot.

---

## 5. Die Modi

Alle Modi teilen einen Basis-Prompt (`prompts/00-basis.md`) und unterscheiden sich in Quellenbindung, erlaubten Elementen und eigenen Prüfregeln. Länge (`kurz`/`mittel`/`ausfuehrlich`) ist in allen Modi außer Arbeitsauftrag wählbar.

| | Originalgetreu | Lernen | Arbeitsauftrag | Prüfung | Vergleich |
|---|---|---|---|---|---|
| Quellenbindung | strikt | Kern strikt, Ergänzung markiert | strikt, Ergänzung nur wenn Auftrag es verlangt | strikt | strikt |
| `<ergaenzung>` | **verboten** | erlaubt | eingeschränkt | erlaubt in Erklärungen zu Lösungen | verboten |
| `<lernhilfe>` | verboten | erlaubt | verboten | erlaubt | verboten |
| Ausgabeform | Text + Citations | Text + Citations | Text + Citations, je Aufgabe ein Abschnitt | JSON (Fragen) + Text (Lernzielübersicht) | JSON (Matrix) + Text |
| Zusatzschritt | – | Wissensstand aus Planer | Aufgabenanalyse [2], Bestätigung | Lernziel-Zuordnung | Aussagen je Quelle, dann Abgleich |
| Strengstes Gate | jede unbelegte Aussage blockt | unbelegte Kernaussage blockt | fehlende Aufgabe oder falsche Punktanzahl blockt | Frage ohne gültigen Beleg wird verworfen | Unterschied ohne Belege auf beiden Seiten wird verworfen |

**Längen:** kurz ≈ 10 % des Quelltexts, nur Kernaussagen und Definitionen. Mittel ≈ 20 %, plus Abläufe, Tabellen, wichtigste Zahlen. Ausführlich ≈ 35 %, alle Fakten der Quelle, Zusatzinformationen als eigener Abschnitt „Zusatzwissen aus der Quelle“. Die Prozentwerte sind Richtwerte im Prompt, der Code warnt nur bei grober Abweichung (unter 50 % oder über 200 % des Ziels).

### 5.1 Originalgetreuer Modus (`originalgetreu`)

Phase 1. Deckt auch den „Schulbuch- und Quellenmodus“ aus Abschnitt 4.5 der Anforderungen ab (Voreinstellung „nur Pflichtliteratur“: Auswahl auf die als Pflichtliteratur markierten Dokumente begrenzt).

- Nur Inhalte aus den gewählten Chunks. Keine Ergänzungen, keine Lernhilfen.
- Fachbegriffe, Definitionen, Zahlen, Einheiten, Skalennamen und Abkürzungen wörtlich. Definitionen werden als wörtliches Zitat übernommen, nicht umformuliert.
- Unterscheidung „Kerninhalt“ und „Zusatzinformation“ nach Kennzeichen in der Quelle (Merkkasten, „Merke“, Definition, Hervorhebung vs. Exkurs, Fallbeispiel, „Zur Vertiefung“).
- Fehlt etwas, das für das gewählte Thema offensichtlich dazugehört (z. B. Thema „Dekubitusprophylaxe“, aber keine Risikoeinschätzung in den Quellen), wird `<fehlt>` gesetzt, nicht ergänzt.
- Prompt: `prompts/01-originalgetreu.md`.

### 5.2 Lernmodus (`lernen`)

- Kernaussagen wie im originalgetreuen Modus, mit Beleg.
- Darauf aufbauend Erklärungen in einfacher Sprache, Beispiele, Merksätze, Eselsbrücken und Querverbindungen zu anderen Themen, alle in `<lernhilfe>` oder `<ergaenzung>`.
- Eselsbrücken dürfen keine fachlich falschen Vereinfachungen enthalten. Der KI-Prüfer prüft jede Lernhilfe gegen die belegten Aussagen.
- Anpassung an den Wissensstand: Der Lernplaner liefert je Thema den `MasteryStatus` und häufige Fehler. „offen“ → mehr Grundlagen und Begriffe; „unsicher“ → gezielt die Fehlerstellen; „sicher“ → kompakt, Fokus auf Zusammenhänge.
- Querverbindungen nutzen den Themenbaum des Fachmoduls (`Topic.prerequisites`), damit nur echte Themen verknüpft werden.
- Prompt: `prompts/02-lernmodus.md`.

### 5.3 Arbeitsauftragsmodus (`arbeitsauftrag`)

Zweistufig, weil ein falsch gelesener Auftrag alles Weitere verdirbt.

1. **Aufgabenanalyse** (`prompts/10-aufgaben-extraktion.md`, strukturierte Ausgabe): Aus Arbeitsblatt/Foto/PDF werden alle Aufgaben in Originalreihenfolge gelesen: Nummer, Wortlaut, Operator(en), geforderte Anzahl („Nennen Sie fünf…“ → 5), verlangte Bestandteile („mit Begründung“, „in Tabellenform“, „nach PESR“), Quellenvorgabe („anhand von S. 40–45“), Fallbezug. Unsichere Lesungen werden markiert.
2. **Bestätigung:** Die App zeigt die erkannte Aufgabenliste. Du bestätigst oder korrigierst sie. (Kann in den Einstellungen auf „nur bei Unsicherheit nachfragen“ gestellt werden.)
3. **Bearbeitung** (`prompts/03-arbeitsauftrag.md`): Je Aufgabe ein Abschnitt `<aufgabe nr="…">`, in der vorgegebenen Reihenfolge. Genau die geforderte Anzahl Punkte. Operator laut Operatorenkatalog des Fachmoduls (`operators` in `catalog-types.ts`) (z. B. *nennen* = ohne Erläuterung aufzählen, *erläutern* = mit Beispielen/Begründung verständlich machen, *beurteilen* = begründetes Urteil). Aufgabenformate wie PESR, SMART, SIS kommen als `TaskFormat` mit `requiredParts` aus dem Fachmodul und werden vom Code geprüft.
4. Niveau: generalistische Pflegeausbildung, Sprache einer guten schriftlichen Schülerleistung, keine Fachsprache über dem Niveau der Quellen.

### 5.4 Prüfungsmodus (`pruefung`)

- **Lernzielübersicht:** Lernstoff nach Lernzielen und Prüfungsthemen der Prüfung (`Exam.topicIds`) geordnet, als Text mit Citations.
- **Prüfungsrelevanz** wird nur behauptet, wenn die Materialien es hergeben (Lernzielliste, Hinweis der Lehrkraft, „prüfungsrelevant“, Altklausur). Jede Relevanzmarkierung hat dann einen eigenen Beleg; ohne Beleg gibt es keine Markierung.
- **Fragen** (`prompts/04-pruefung.md`, strukturierte Ausgabe): offene Fragen, Multiple Choice (eine oder mehrere richtig), Fallfragen. Jede Frage enthält Musterlösung, Bewertungskriterien, Operator, Schwierigkeit, Thema und Belege (`chunkId` + wörtliches Zitat). Der Code prüft jedes Zitat; Fragen ohne gültigen Beleg werden verworfen und neu angefordert. Ablenker bei MC müssen eindeutig falsch sein, auch das prüft der KI-Prüfer.
- **Simulation, Bewertung, Wiederholung:** Zeitbegrenzung und Ablauf baut der Thread „Lernplan- und Wiederholungslogik“. Der Zusammenfasser liefert die Bewertung einer Antwort (`prompts/05-antwortbewertung.md`): Punkte je Kriterium, was fehlt, Fehlerart (Begriff, Zahl, Ablauf, Begründung), Beleg der richtigen Stelle. Das Ergebnis geht als Testergebnis an den Planer, denn „gelesen“ gilt nicht als „verstanden“.

### 5.5 Vergleichsmodus (`vergleich`)

Drei Schritte, damit Unterschiede nicht beim Zusammenfassen verschwinden:

1. **Aussagen je Quelle:** Für jedes Dokument getrennt die Aussagen zum gewählten Thema mit Beleg extrahieren (wie originalgetreu, kurz).
2. **Abgleich** (`prompts/06-vergleich.md`, strukturierte Ausgabe): Aussagen nach Unterthema ausrichten und je Unterthema einordnen: *übereinstimmend*, *ergänzend* (nur eine Quelle sagt es), *abweichend* (andere Gewichtung, Detailtiefe oder Zahl), *widersprüchlich* (schließt sich aus), *Definition unterschiedlich*. Jede Einordnung braucht Belege aus allen beteiligten Quellen.
3. **Darstellung:** Matrix Thema × Quelle, Definitionen nebeneinander (wörtlich), Liste „fehlt in Quelle X“, und eine zusammengeführte Fassung, in der Übereinstimmendes einmal steht und jeder Unterschied als `<widerspruch>` sichtbar bleibt. Bei Widersprüchen wird nicht entschieden, welche Quelle recht hat. Aktualität (Erscheinungsjahr, Auflage, Expertenstandard-Stand) wird als Hinweis genannt, falls aus den Dokumentdaten erkennbar.

---

## 6. Qualitätskontrolle

Jede Prüfung erzeugt `Befund`e mit Schwere `blocker`, `warnung` oder `hinweis` (Typ `Befund` in `src/core/types.ts`). Q1–Q6 laufen per Code (Prototyp vorhanden), K1–K5 im KI-Prüfer (`prompts/20-pruefer.md`).

### 6.1 Quellenprüfung

| ID | Prüfung | Wie | Befund |
|---|---|---|---|
| Q1a | Zitat steht im Chunk | normalisierter exakter Abgleich, sonst unscharfer Abgleich (Wortfolge ≥ 90 % Übereinstimmung) | nicht gefunden → `blocker`, unscharf → `warnung` |
| Q1b | Seite/Kapitel stimmen | Seite kommt aus dem Chunk, nicht von der KI; nennt der Fließtext eine Seite, muss sie zu einem Beleg passen | `warnung` |
| Q1c | Jede fachliche Aussage hat Beleg | Claims ohne Citation und ohne erlaubte Markierung | im originalgetreuen Modus `blocker`, sonst `warnung` |
| Q5 | Quelle lesbar | `ocrConfidence < 0,75` oder Beleg überlappt `illegibleSpans` | `warnung`, Claim-Status `unleserlich` |
| Q1d | Quelle vorhanden | `chunkId` existiert und gehört zu einem gewählten Dokument | `blocker` |
| K1 | Beleg stützt Aussage | KI-Prüfer: „gestützt / teilweise / nicht gestützt“ | nicht gestützt → `blocker`, teilweise → `warnung` |

### 6.2 Vollständigkeitsprüfung

| ID | Prüfung | Wie |
|---|---|---|
| Q4a | Alle Aufgaben bearbeitet, in Reihenfolge | Abschnitte `<aufgabe nr>` gegen Aufgabenliste aus [2] |
| Q4b | Punktanzahl exakt | Aufzählungspunkte je Aufgabe zählen, gegen `geforderteAnzahl` |
| Q4c | Verlangte Bestandteile | `requiredParts` des Aufgabenformats (z. B. P, E, S, R) als Überschriften/Felder vorhanden |
| K2 | Operator erfüllt | KI-Prüfer: „nennen“ ohne Ausschmückung, „begründen“ mit Begründung usw. |
| Q4d | Themenabdeckung (Zusammenfassung) | jeder ausgewählte Chunk mit Kerninhalt ist mindestens einmal belegt, sonst `hinweis` „nicht berücksichtigt: S. …“ |

### 6.3 Begriffskontrolle

| ID | Prüfung | Wie |
|---|---|---|
| Q2 | Zahlen und Einheiten | alle Zahl-Einheit-Paare (auch „zwei Stunden“, „30°“, „≥ 18 Punkte“, „3-mal täglich“) aus Claim und Belegen extrahieren und vergleichen; Zahl im Claim, die in keinem Beleg vorkommt → `blocker` im originalgetreuen Modus, sonst `warnung` |
| Q3a | Fachbegriffe erhalten | Begriffe aus Glossar des Fachmoduls und aus dem Beleg (Fachwörter, Abkürzungen, Skalennamen wie Braden, Norton) müssen im Claim stehen, wenn der Beleg sie nennt und der Claim das Konzept wiedergibt; bekannte Synonym-Paare aus dem Glossar werden als „ersetzt“ erkannt |
| Q3b | Definitionen wörtlich | Claims vom Typ `definition` müssen ein wörtliches Zitat enthalten (Anführungszeichen) und dieses muss Q1a bestehen |
| K3 | Sinn nicht verändert | KI-Prüfer: Verneinung, Abschwächung („soll“ → „muss“), Verallgemeinerung („bei Risiko“ → „bei allen“) |

### 6.4 Widerspruchserkennung

| ID | Prüfung | Wie |
|---|---|---|
| K4 | Quellen widersprechen sich | KI-Prüfer vergleicht Belege aus verschiedenen Dokumenten zum selben Unterthema; vorhandene `<widerspruch>`-Markierungen werden bestätigt, fehlende als `warnung` gemeldet |
| K5 | Definitionen vermischt | ein Claim stützt sich auf Belege aus zwei Quellen mit unterschiedlicher Definition → `blocker` „Definitionen vermischt“ |
| Q2b | Zahlenwiderspruch | dieselbe Größe mit unterschiedlichen Werten in Belegen verschiedener Dokumente → `warnung` (rein per Code, unabhängig vom Prüfer) |

### 6.5 Unsicherheitskennzeichnung

| ID | Prüfung | Wie |
|---|---|---|
| Q6a | Markierungen erlaubt | `<ergaenzung>`/`<lernhilfe>` im falschen Modus → `blocker` |
| Q6b | Markierungen wohlgeformt | offene/verschachtelte Tags → `warnung`, Inhalt wird als unbelegt behandelt |
| Q6c | Unbelegtes nicht als Fakt | Claim ohne Beleg wird nie grün angezeigt; im Export erscheint er mit Kennzeichnung |
| Q6d | Rückfragen | `<rueckfrage>` wird als Frage an dich angezeigt; das Ergebnis bleibt bis zur Antwort „vorläufig“ |

### 6.6 Nachvollziehbarkeit

Jeder Claim speichert seine Citations mit `chunkId` und Zeichenpositionen. In der App: Tippen auf die Aussage → Originalseite (pdf.js) mit hervorgehobenem Zitat, Dokumenttitel, gedruckter Seite und Kapitel. Der `PipelineRun` speichert Prompt-Version, Modell und alle Befunde.

### 6.7 Versionsvergleich

Siehe Abschnitt 8.

---

## 7. Gate: Was passiert mit dem Ergebnis?

| Lage | Aktion |
|---|---|
| keine Befunde oder nur `hinweis` | anzeigen |
| `warnung`, keine `blocker` | anzeigen, betroffene Aussagen gelb, Hinweisliste oben |
| `blocker` (erstmals) | **eine** automatische Reparatur: Generator bekommt die Befunde (`prompts/30-reparatur.md`) und korrigiert nur die betroffenen Stellen; danach erneut prüfen |
| `blocker` nach Reparatur | anzeigen mit roter Kennzeichnung der betroffenen Aussagen und Hinweis „nicht verlässlich“; im originalgetreuen Modus werden diese Aussagen im Export standardmäßig ausgelassen und im Abschnitt „offene Punkte“ gelistet |
| `<rueckfrage>` oder kritisches `<fehlt>` | Rückfragen anzeigen, Ergebnis als „vorläufig“ speichern |

Bewusst nur **eine** Reparaturrunde: mehr Runden kosten viel und erhöhen das Risiko, dass das Modell Belege „passend macht“.

---

## 8. Versionsvergleich und Nachprüfung

Wenn ein Dokument in neuer Version importiert wird (`Document.previousVersionId`):

1. Chunks beider Versionen über Text-Hash der normalisierten Fassung zuordnen. Nicht exakt zuordenbare Chunks über Ähnlichkeit (Wortüberschneidung ≥ 0,8) als *geändert*, sonst *neu* bzw. *entfernt*.
2. Für geänderte Chunks einen Wort-Diff speichern (für die Anzeige „was hat sich geändert“).
3. Alle Claims, Karteikarten und Prüfungsfragen, deren Belege auf geänderte oder entfernte Chunks zeigen, bekommen `needsReview = true`. Zahlen-Änderungen (Q2 auf altem vs. neuem Chunk) werden besonders hervorgehoben.
4. Optional: „Neu prüfen“ führt für betroffene Claims nur Q1–Q3 und K1 gegen die neue Version aus und schlägt Korrekturen vor.

---

## 9. Testen und Bewerten

Ohne Messung lässt sich nicht sagen, ob ein geänderter Prompt besser ist. Vorschlag:

- **Goldsatz** mit 20–30 echten Unterrichtsstellen aus Pflege (z. B. Dekubitusprophylaxe, Sturzprophylaxe, Pflegegrade, SIS, Vitalzeichen-Normwerte) mit Fallen: Zahlen, Skalenwerte, ähnliche Definitionen in zwei Büchern, ein unleserlicher Scan, ein Arbeitsblatt mit „Nennen Sie fünf…“.
- **Kennzahlen:** Anteil Aussagen mit gültigem Beleg, Anteil Belege, die die Aussage wirklich stützen (stichprobenartig von dir bewertet), erfundene Zahlen (Soll: 0), fehlende Aufgaben (Soll: 0), Punktanzahl-Treffer (Soll: 100 %).
- **Mutationstests für die Code-Prüfungen:** Zahlen, Einheiten, Fachbegriffe und Verneinungen in korrekten Zusammenfassungen gezielt verfälschen; die Prüfungen müssen jede Verfälschung melden. Erste Fälle sind im Prototyp-Test enthalten.
- Jede Prompt-Änderung läuft gegen den Goldsatz, bevor sie übernommen wird. Prompt-Dateien tragen eine Versionsnummer im Kopf.

---

## 10. Abstimmung mit dem Kernvertrag

Mit dem Architektur-Thread abgestimmt und als optionale Felder in `src/core/types.ts` übernommen:

1. `Citation.printedPage`, `charStart`, `charEnd` für Anzeige und Hervorhebung (Positionen setzt der Code beim Zitatabgleich).
2. `ClaimKind` und `Claim.kind`.
3. `SummaryBlock`, `Summary.blocks`/`rootBlockIds` und `Claim.blockId` für die Gliederung.
4. `ClaimStatus` ergänzt um `'fehlt'` und `'ungeprueft'` (Startwert vor der Qualitätskontrolle).
5. `Befund`, `QaBericht`, `Summary.qa` und `Summary.pipelineRunId`.
6. Operatorenkatalog (`Operator`: `name`, `afb`, `expects`) und `CatalogGlossaryEntry.synonyms` kommen aus `src/modules/catalog-types.ts`.

Nur für den Zusammenfasser gebraucht und deshalb in `src/features/zusammenfasser/typen.ts`: Prüf-IDs, `Aufgabe`, `Pruefungsfrage`, `VergleichsZeile`, `PipelineEingabe`, `PipelineRun`.

## 11. Umsetzungsreihenfolge

Passend zu den Phasen der Architektur:

- **Phase 1:** Schritte [1], [3], [4], [5], [7], [8] für den originalgetreuen Modus (alle drei Längen); Q1, Q2, Q3, Q5, Q6; K1 und K3 im KI-Prüfer; Nachvollziehbarkeit per Klick.
- **Phase 2:** Lernmodus (braucht Wissensstand aus dem Planer), Arbeitsauftragsmodus mit Aufgabenanalyse und Q4.
- **Phase 3:** Prüfungsmodus mit Fragen und Antwortbewertung.
- **Phase 4:** Vergleichsmodus, K4/K5, Versionsvergleich.

### Stand der Umsetzung (Oktober 2026)

- Alle fünf Modi sind in der App wählbar (Seite „Zusammenfassen“).
- Text-Modi: Schritte [3]–[7] inklusive KI-Prüfer (`pruefer.ts`) und genau einer Reparaturrunde. Der KI-Prüfer bekommt die Quellen ohne Citations, weil Citations und strukturierte Ausgabe nicht zusammen gehen; er hat deshalb einen eigenen Cache-Eintrag. Schwere: K1 wie Tabelle 6.1, K3 und K5 `blocker` (K3 im Lernmodus `warnung`), fachlich falsche Lernhilfe `blocker`, K2 `warnung`, K4 `warnung` (bereits markiert: `hinweis`). Der KI-Prüfer lässt sich pro Lauf abschalten.
- Arbeitsauftrag: Aufgabenerkennung [2] mit Bestätigung, Q4a–c mit `requiredParts` des Aufgabenformats.
- Lernmodus: Der Wissensstand kommt aus dem Lernplan (`topicKnowledge`), sobald ein Katalogthema gewählt ist, und lässt sich ändern; häufige Fehler gibt die lernende Person selbst an. Verwandte Themen kommen aus dem Themenkatalog (Voraussetzungen, Oberthema, Folgethemen).
- Prüfungsmodus: Fragen mit Code-Prüfung der Belege, danach KI-Prüfer für Fragen (`prompts/21-fragenpruefer.md`): Frage eindeutig, Musterlösung belegt, jede MC-Option richtig markiert und eindeutig richtig bzw. falsch. Abgelehnte Fragen werden mit Grund angezeigt und einmal nachgefordert. MC-Auswertung lokal, offene Fragen per `05-antwortbewertung.md`. Ist ein Katalogthema gewählt, geht das Gesamtergebnis als Abfrage (`pruefungssimulation`) an den Lernplan.
- Lernzielübersicht (`prompts/07-lernzieluebersicht.md`): Text mit Citations, nach Lernzielen gegliedert, Prüfungsrelevanz nur mit eigenem Zitat. Läuft durch dieselbe Pipeline wie die Text-Modi und wird so streng geprüft wie der originalgetreue Modus (Q1c blockt, keine Ergänzungen). Gespeichert als `Summary` mit `mode: 'pruefung'` ohne `fragen`.
- Vergleichsmodus: Aussagen je Quelle, Abgleich, Matrix mit „fehlt in Quelle X“ und zusammengeführte Fassung (`zusammenfuehren`): Übereinstimmendes einmal, Ergänzungen mit Quelle, jeder Unterschied je Quelle als Kasten. Sie entsteht ohne weiteren KI-Aufruf nur aus den geprüften Vergleichszeilen.
- Ergebnisse von Prüfung und Vergleich liegen als `FragenSatz` bzw. `VergleichsErgebnis` (Erweiterungen von `Summary`) in der Tabelle `summaries`.
- Jeder Lauf wird als `PipelineRun` in der Tabelle `pipelineRuns` (DB-Version 6) gespeichert: Eingabe, Prompt-Versionen, Modell je Schritt, Rohantworten, Befunde, Tokens. `Summary.pipelineRunId` verweist darauf; in der App unter „Wie ist das entstanden?“. Große Quellen, die in Teilen laufen, ergeben einen verbundenen Lauf.

