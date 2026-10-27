# Dokumentimport

Import von PDF, Word, PowerPoint, Bildern und Scans mit Seitenzuordnung. Ausgabe: `Document` + `SourceChunk[]` (siehe `src/core/types.ts`), dazu ein Fingerabdruck für Dubletten und Versionen und ein Bericht für die Oberfläche.

```ts
import { importFile } from './import/pipeline';
import { createTesseractEngine } from './import/ocr/tesseract';
// pdf.js-Worker richtet extractPdf im Browser beim ersten PDF selbst ein (import/extract/pdf-worker.ts).

const ocr = await createTesseractEngine({ langPath: '/tessdata' });
const result = await importFile({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()), lastModified: file.lastModified }, { ocr, existing });
// result.document, result.chunks -> db.documents / db.chunks; result.fingerprint mitspeichern
// result.report.matches -> Nutzer fragen: Duplikat verknüpfen? Neue Fassung bestätigen?
```

## Ablauf

1. **Format erkennen** an den ersten Bytes, nicht an der Endung (`detectKind`). Alte Formate (.doc, .ppt, .odt, TIFF, HEIC) werden mit einer verständlichen Meldung abgelehnt.
2. **Extrahieren** in ein gemeinsames Zwischenformat `RawPage { page, printedPage, blocks[] }`:
   - **PDF** (`extract/pdf.ts`, pdf.js): Zeilen aus Textpositionen, Absätze über Zeilenabstand, Silbentrennung aufgelöst. Kapitel aus den PDF-Lesezeichen, ohne Lesezeichen aus der Schriftgröße. Gedruckte Seitenzahl aus PDF-Seitenlabels oder aus Kopf-/Fußzeile; wiederkehrende Kopf-/Fußzeilen werden aus dem Lerntext entfernt. Seiten mit weniger als 25 Zeichen gelten als Scan und gehen zur OCR.
   - **Word** (`extract/docx.ts`, JSZip + XML): Überschriften über Formatvorlagen (auch deutsche „Überschrift 1“) und Gliederungsebene, Tabellen als eigener Block. Seiten über `w:lastRenderedPageBreak` (von Word beim Speichern geschrieben) und die Startseitenzahl des Abschnitts. Fehlen diese Marker, sind Seiten geschätzt (`pageEstimated`), und der Bericht empfiehlt, das PDF zu importieren.
   - **PowerPoint** (`extract/pptx.ts`): Folie = Seite, Abschnitt > Folientitel = Kapitel, Sprechernotizen als eigene Chunks (`origin: 'notes'`).
   - **Bilder** (PNG, JPEG, WebP): direkt zur OCR.
3. **OCR** (`ocr/`): Tesseract.js offline für Druckschrift. Handschrift oder Seiten unter 75 % Sicherheit gehen an Claude (`ocr/claude.ts`), aber nur, wenn die Oberfläche eine `handwritingOcr`-Engine übergibt, also der Nutzer dem Hochladen zugestimmt hat. Unleserliches steht als `⟦?⟧` im Text, unsichere Wörter bleiben stehen; beides ist in `illegibleSpans` markiert.
4. **Chunks** (`chunk.ts`): nie über eine Seiten- oder Kapitelgrenze, höchstens 350 Wörter, Schnitt nur am Absatzende. `chapter` ist der Pfad `Kapitel > Unterkapitel`.
5. **Dubletten und Versionen** (`dedupe.ts`): byte-gleich (SHA-256), textgleich, gleiches Dokument in anderem Format (MinHash-Ähnlichkeit über Wort-5-Gramme ≥ 0,9), neue Fassung (≥ 0,6 oder gleicher Titel) mit Liste neuer und entfallener Absätze. Welche Fassung neuer ist, kommt aus Auflage/Version/Stand im Text, sonst aus dem Änderungsdatum. Es wird nichts automatisch gelöscht oder ersetzt.

## Bibliotheken

| Zweck | Gewählt | Verworfen, weil |
| --- | --- | --- |
| PDF | `pdfjs-dist` (Legacy-Build) | pdf-lib/pdfminer: kein Text mit Positionen im Browser bzw. nur Python. Legacy-Build, weil der normale Build `Promise.try` braucht (erst ab iOS 18.2). |
| Word | `jszip` + `@xmldom/xmldom` | mammoth.js verwirft Seitenumbrüche und Gliederungsebenen; docx-preview ist eine Anzeige, kein Parser. |
| PowerPoint | `jszip` + `@xmldom/xmldom` | Keine gute Browser-Bibliothek; das Folien-XML ist einfach. |
| OCR Druck | `tesseract.js` 7 (WASM) | PaddleOCR über onnxruntime-web: größerer Download und aufwendigere Einbindung, für gedruckten Lehrtext kein klarer Vorteil. |
| OCR Handschrift | Claude (`@anthropic-ai/sdk`) | Tesseract liest Handschrift praktisch nicht. Lokale Handschriftmodelle (TrOCR) sind für das Handy zu groß. |

## Offen

- Sprachdaten für Tesseract (`deu.traineddata.gz`, ca. 2 MB) unter `public/tessdata` ablegen und vom Service Worker cachen lassen, damit OCR offline läuft.
- Text in Bildern innerhalb von PDFs mit Textebene und in PowerPoint-Bildern wird noch nicht per OCR gelesen (Bericht warnt).
- Fußnoten in Word werden noch übersprungen.
- Merkkästen werden noch nicht als eigener Chunk erkannt.
- Erkennung „Scan ist Teil eines vorhandenen Dokuments“ (Enthaltensein statt Ähnlichkeit).

## Gemeinsamer Import und privates Material-Repo

`importiere.ts` wird von Dokumenten, Assistent und großer Ablage genutzt. Es sichert auf Wunsch zuerst das Original im privaten Repo; Repo-Fehler verhindern den lokalen Textimport nicht. Ein Repo-Original wird über `repository` verknüpft und nicht erneut hochgeladen. ZIP-Inhalte werden einzeln verarbeitet, die Ablage verweist weiterhin auf das Original-ZIP. Erfolgreiche Dokument-IDs und Fehler der Original-Sicherung werden getrennt zurückgegeben.

`core/topics.ts` gleicht den Text lokal mit Themennamen und Katalog-Tags ab. Neue Themen aus Kapiteln sind Vorschläge, noch keine Board-Einträge. Bestätigte eigene Themen stehen zusammen mit dem Katalog über `ladeThemen` für Board, Themenansicht, Zusammenfasser und Lernplan bereit. Wiederholter Import legt keine Dubletten an; Themenabgleich behält manuelle Zuordnungen und Abwahlen. Neue Versionen ersetzen alte Quellen nicht automatisch.

`zusammenfasser/grosseQuellen.ts` verteilt große Quelltexte auf vollständige Teilabschnitte und verbindet die quellengetreu geprüften Ergebnisse mit eindeutigen Aussage-/Block-IDs. Quellenbelege behalten ihre Original-Chunk-IDs. Die strengste Qualitätsampel der Teile wird übernommen.

Browser-Grenzen für ZIP: 512 MiB Original und gesamte entpackte Inhalte, 128 MiB pro Eintrag, 500 unterstützte Dokumente. Ein Abruf aus dem Repo über 512 MiB wird vor dem Download abgelehnt. Originale können unabhängig davon weiterhin in 15-MiB-Teilen archiviert werden.

Verifikation: `npm test`, `npm run build`, `node scripts/check-material.mjs` (isolierte Browser, simuliertes privates Repo, keine externen Schreibzugriffe). Browser-Test prüft 390/820/1280 px, Dokumentimport, Themenbestätigung, Quellen-Vorauswahl, Repo-Abruf und Original-Sicherung im Assistenten.
