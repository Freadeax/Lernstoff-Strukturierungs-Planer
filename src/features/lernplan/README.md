# Lernplan: Planungs- und Wiederholungslogik

Reine TypeScript-Funktionen ohne Laufzeitabhängigkeiten und ohne Bezug zu React oder Dexie:
Sie bekommen den aktuellen Stand als Daten und liefern einen Plan zurück. Laden und Speichern
übernimmt die App über `src/core/db.ts`. Die Kernentitäten `Topic`, `Exam` und `MasteryStatus`
kommen aus `src/core/types.ts`; alles Planer-Spezifische steht in `types.ts` dieses Ordners.

```ts
import { buildPlan, forecastExams, replan } from './features/lernplan';
```

Tests: `npm test` (Ordner `__tests__`, Beispieldaten in `__tests__/fixtures.ts`).

## Grundprinzip

**Der Plan wird nie fortgeschrieben, sondern immer aus dem Ist-Stand neu berechnet.**
Eingaben sind nur Fakten: Themen, Prüfungen, tatsächliche Lernzeit (`StudyLog`), echte
Abfrageergebnisse (`ReviewLog`) und verfügbare Zeit (`Availability`). Dadurch gilt automatisch:

- erledigte Erarbeitung fällt aus dem Plan heraus,
- verpasste Blöcke landen wieder im Pool und werden neu verteilt,
- Krankheit, weniger Zeit oder neue Prüfungen sind nur geänderte Eingaben.

## Bausteine

| Datei | Aufgabe |
|---|---|
| `types.ts` | Planer-Typen (`ReviewLog`, `StudyLog`, `Availability`, `PlannerSettings`) und Standardwerte |
| `fsrs.ts` | FSRS-5 mit Standardparametern: Stabilität, Schwierigkeit, Abrufwahrscheinlichkeit, Intervalle |
| `progress.ts` | Status offen / bearbeitet / unsicher / sicher je Thema, mit Begründungen |
| `priority.ts` | Prioritätswert je Thema mit nachvollziehbaren Gründen |
| `scheduler.ts` | `buildPlan`: Stoffverteilung, Tagespläne, Wiederholungen, Warnungen |
| `replan.ts` | Ereignisse (Ausfall, Zeitänderung, neue/verschobene Prüfung) und Plan-Vergleich |
| `forecast.ts` | Vorsichtige Lernprognose je Prüfung mit Empfehlungen |

## Fortschrittsstatus (nur echte Testergebnisse zählen)

| Status | Bedingung |
|---|---|
| **offen** | keine Lernzeit, keine Abfrage |
| **bearbeitet** | Lernzeit erfasst, aber noch keine echte Abfrage. Ist die Erarbeitung abgeschlossen, wird sofort eine erste Abfrage fällig. |
| **unsicher** | abgefragt, aber mindestens eine Bedingung für „sicher“ fehlt |
| **sicher** | letzte Abfrage mindestens „gut“, mindestens 2 erfolgreiche Abfragen an verschiedenen Tagen, Stabilität ≥ 7 Tage, Abrufwahrscheinlichkeit heute ≥ 85 % |

`selbsteinschaetzung` wird gespeichert, zählt aber nie als Nachweis. Quiz, Karteikarten, offene
Fragen und Prüfungssimulationen zählen. Prozentwerte werden übersetzt: < 50 % vergessen,
50–69 % schwer, 70–89 % gut, ≥ 90 % leicht. Ein „sicheres“ Thema fällt ohne Wiederholung
mit der Zeit wieder auf „unsicher“ zurück.

## Wiederholungsplan (FSRS-5)

- Gedächtniszustand je Thema wird aus allen echten Abfragen nachgespielt (`replay`).
- Nächste Abfrage, wenn die Abrufwahrscheinlichkeit auf die Zielretention (Standard 90 %) fällt.
- Schlechte Ergebnisse verkürzen die Abstände, gute verlängern sie; schwierige Themen kommen öfter.
- Nach Abschluss der Erarbeitung folgt am nächsten Tag eine **erste Abfrage**.
- Am Tag vor jeder Prüfung ist eine **letzte Abfrage** je Thema eingeplant (`pruefungsvorbereitung`).
- Zukünftige Wiederholungen werden unter der Annahme „gut“ vorausgeplant; echte Ergebnisse korrigieren das bei der nächsten Neuberechnung.

## Stoffverteilung und Priorisierung

1. Verbleibende Erarbeitung je Thema = Schätzung minus erfasste Lernzeit, geteilt in gleich große Blöcke ≤ 45 Min.
2. Voraussetzungen werden topologisch geordnet; ein Thema startet erst, wenn alle Voraussetzungen fertig erarbeitet sind. Zyklen werden erkannt, gemeldet und aufgelöst.
3. Tagesweise Füllung der Netto-Lernzeit (Verfügbarkeit minus 10 % Puffer):
   - zuerst fällige Wiederholungen (max. 50 % der Tageszeit, am Prüfungsvortag unbegrenzt),
   - dann Erarbeitung, sortiert nach **Zeitdruck** (benötigte ÷ verfügbare Zeit bis zum Termin) plus **Priorität**,
   - max. 2 Blöcke pro Thema und Tag (verteiltes Lernen), Restzeit wird ohne Kleinstblöcke (< 15 Min.) gefüllt.
4. Priorität = Prüfungsgewicht × (35 % Dringlichkeit + 30 % Wissenslücke + 15 % Schwierigkeit + 5 % Umfang + 15 % Prüfungsrelevanz). Jede Priorität enthält Begründungen für die Anzeige.
5. Passt der Stoff nicht in die Zeit, wird nichts gestrichen: Der Rest steht in `unscheduled`, dazu eine Warnung `zeitmangel` mit fehlenden Minuten je Prüfung.

Pausen (`breakMinutes`) werden je Tag ausgewiesen und nicht von der Netto-Lernzeit abgezogen.

## Neuplanung

```ts
const { input: next, plan } = replan(input, [
  { type: 'ausfall', from: '2026-10-26', to: '2026-10-30', reason: 'Krankheit' },
  { type: 'zeit_aendern', date: '2026-11-03', minutes: 30 },
  { type: 'neue_pruefung', exam },
  { type: 'pruefung_verschoben', examId, date: '2026-11-20' },
]);
const diff = comparePlans(oldPlan, plan); // verschobene Themen, neu/nicht mehr unplanbare Themen
```

## Lernprognose

Bewusst **keine Bestehenswahrscheinlichkeit**. Je Prüfung:

- Anzahl Themen je Status und Anteil überhaupt abgefragter Themen,
- erwartete Abrufwahrscheinlichkeit am Prüfungstag, gerechnet **ohne** weitere Wiederholungen (also vorsichtig), einmal nur für abgefragte Themen und einmal als Untergrenze, in der ungeprüfte Themen mit 0 zählen,
- Zeitbedarf gegen verfügbare Zeit (frühe Warnung bei Zeitproblemen),
- Zuverlässigkeit `niedrig` / `mittel` / `hoch` je nach Datenbasis,
- konkrete Empfehlungen: nicht begonnene Themen, nie abgefragte Themen, die unsichersten Themen zuerst.

## Offene Punkte

- FSRS-Parameter später aus den eigenen Abfragedaten optimieren (ab ca. 1000 Abfragen sinnvoll).
- Bewertung pro Karteikarte statt pro Thema, sobald der Karteikarten-Teil steht; das Thema erbt dann den schwächsten bzw. gemittelten Zustand.
- Uhrzeiten und Lernblöcke im Kalender (aktuell Tagesebene).
