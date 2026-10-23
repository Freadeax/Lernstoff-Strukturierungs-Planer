# Fachmodul Pflege (generalistische Pflegeausbildung)

Fachwissen für den Lernstoff-Planer als reine Daten. Der Kern der App ist fachneutral;
ein Fachmodul liefert Fächer, Themenbaum, Glossar, Aufgabenformate und Prüfregeln
(`DomainModule` im Datenvertrag). Ein neues Fachgebiet entsteht, indem man einen
weiteren Ordner unter `src/modules/` mit denselben YAML-Dateien anlegt, baut und in `registry.ts` einträgt – Code ändert sich dafür nicht.

## Aufbau

| Datei | Inhalt |
|---|---|
| `katalog/00-modul.yaml` | Modul-Metadaten und 11 Fächer (Lernbereiche) |
| `katalog/10-kompetenzrahmen.yaml` | Kompetenzbereiche I–V (Anlage 2 PflAPrV) und curriculare Einheiten CE 01–11 |
| `katalog/20-referenzen.yaml` | Rechtsnormen (PflBG, PflAPrV, SGB V, SGB XI, StGB, DSGVO, BGB …), 10 DNQP-Expertenstandards, Assessments (Braden, Barthel, NBA …), Pflegemodelle |
| `katalog/30-themen.yaml` | Themenbaum (112 Themen) mit Voraussetzungen, Schwierigkeit, Lernzeit, Kompetenz- und CE-Zuordnung |
| `katalog/40-aufgabenformate.yaml` | PESR, SMART, Maßnahme, Pflegeplanung, SIS, Pflegebericht, SBAR, Prophylaxe-Schema, Beratung, Ethik, Fallbearbeitung – jeweils mit Pflichtteilen |
| `katalog/50-pruefregeln.yaml` | 20 fachspezifische Prüfregeln für die Qualitätskontrolle |
| `katalog/60-pruefungen-operatoren.yaml` | 17 Operatoren mit Anforderungsbereich, Prüfungsformate (Klausur, Zwischenprüfung, staatliche Prüfung) |
| `katalog/70-glossar.yaml` | 53 Fachbegriffe und Abkürzungen |
| `../schema/domain-module.schema.json` | Fachneutrales JSON Schema (Draft 2020-12) für jedes Fachmodul |
| `../catalog-types.ts` | TypeScript-Erweiterungen zum Kernvertrag |
| `scripts/build-module.py` (Repo-Wurzel) | Baut `pflege-generalistisch.json` und prüft Schema, IDs, Verweise und Zyklen |
| `index.test.ts` | Prüft Verweise und Zyklen zusätzlich bei `npm test` |

## Datenmodell in Kürze

- **Fach** (`subjects`) → **Thema** (`topics`, Baum über `parentId`, Lernreihenfolge über `prerequisites`).
- Themen verweisen per ID auf **Kompetenzen** (`frameworks`), **Referenzen** (Normen, Standards,
  Assessments), **Aufgabenformate** und Schlagworte. Daraus kann der Planer z. B. alle Themen zum
  Kompetenzbereich III oder alle Themen mit Bezug zum Expertenstandard Sturz ziehen.
- **Prüfungsformate** sind Vorlagen; der Nutzer legt konkrete Prüfungen (`Exam`) mit Datum an.
- **Aufgabenformate** beschreiben die Pflichtteile einer Antwort; **Prüfregeln** sagen der
  Qualitätskontrolle, was sie an diesen Antworten prüfen soll.
- IDs sind stabile Präfix-IDs (`thema.pro.dekubitus`, `kb.I.1`, `es.sturz`); vom Nutzer erzeugte
  Daten bekommen UUIDs. Voraussetzungen eines Elternthemas gelten für alle Unterthemen.

## Wichtig zur fachlichen Korrektheit

Der Katalog ist **Gerüst, keine Quelle**. Er ordnet Material ein und gibt Prüfstrukturen vor;
fachliche Aussagen in Zusammenfassungen müssen aus den Lernmaterialien des Nutzers belegt sein.
Glossardefinitionen tragen `origin: katalog` und gelten als ergänzendes Wissen. Rechtsangaben,
Expertenstandards und Prüfungsdetails tragen `pruefstatus: ungeprueft`, bis sie gegen den
Originaltext geprüft sind. Bekannte Stolperstellen: Betreuungsrecht (Paragraphen seit 2023 neu),
Schmerz-Expertenstandard (akut/chronisch zusammengeführt), Hypoglykämie-Grenzwert je Lehrbuch.

## Bauen

```bash
pip install pyyaml jsonschema
python3 scripts/build-module.py src/modules/pflege
```
