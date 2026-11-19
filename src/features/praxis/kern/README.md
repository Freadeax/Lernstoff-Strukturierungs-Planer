# Praxissimulator neu – Kern (Paket P0)

Reiner, deterministischer Simulationskern für beide Spuren (A Pflege/Generalistik, B Akut/Notfall/Intensiv).
Noch nicht in der Oberfläche eingebunden; die alte Engine (`../engine.ts`) und Stufe 1 (`../gefuehrt`) laufen unverändert.

| Datei | Inhalt |
|---|---|
| `typen.ts` | Datenvertrag: Fallschema v2, Maßnahmen mit Befugnis je Rolle, Bedingungen, Event-Log |
| `bedingung.ts` | `pruefe(bedingung, kontext)` |
| `katalog.ts` | Handlungskatalog P3: 141 Maßnahmen, 6 Reiter, Spur A und B, Befugnis je Drittel, `NACHWEIS` je Maßnahme |
| `lehrplan-belege.ts` | Fundstellen im BW-Landeslehrplan 3BFP (Seite, CE, Drittel), Belegstärke je Spalte |
| `einrichtung.ts` | Einrichtungsprofil: Grundwerte strenger/lockerer, `mitEinrichtung(fall, profil)` vor `start()` |
| `matrix.ts` | lesbare Befugnis-Matrix (Markdown) für die fachliche Prüfung |
| `modell.ts` | Schnittstelle `PhysiologieModell`, `ModellKontext`, `NORMAL` |
| `physiologie/pflegemodell.ts` | Pflege-Physiologiemodell v2 (P1), Standard im Kern; `atmung()`, `kreislauf()`, `befinden()`, `lagerungsWirkung()` |
| `physiologie/organe.ts` | Herz, Lunge, Blutzucker: dieselben Modelle wie die Lernseite `#/lernen/physiologie` |
| `physiologie/altersprofile.ts` | Ruhewerte Säugling bis Hochbetagte, Alarmfarben (monitor.ts), `fruehwarnung()` (NEWS2/Kinderprofil) |
| `akte.ts` | Patientenakte (P13): Medikationsprüfung gegen `fall.akte.medikation` (Doppelgabe, Bedarfs-Abstand, Höchstmenge), Minimal-Akte `akteVon()`, Bausteine für den Pflegebericht |
| `kern.ts` | `start`, `sende`, `vorspulen`, `replay`, `freigabe`, `verfuegbar`, `anzeige` |
| `faelle/` | Fälle im Schema v2: Pilotstaffel Spur A (ambulant Sturz/Exsikkose, Krankenhaus Pneumonie/Sepsis, Langzeit Demenz/Schmerz/FEM, Pädiatrie Fieberkrampf, Psychiatrie Panik/Suizidalität) und Spur B (Schockraum Sepsis); `pilot-a.test.ts` kalibriert gegen das Modell |
| `spur-b/` | Spur B (P1b): `modul.ts` Hülle `spurB(basis)` mit Beatmung, Perfusoren, arterieller Messung, Rhythmus, Sedierung (RASS), Laktat, Bilanz; `perfusor.ts` Laufrate ↔ Dosis; `bga.ts` BGA aus dem Modell; `standard.ts` `SPUR_B_MODELL` (Standard im Kern); `katalog.ts` fehlende Spur-B-Maßnahmen mit Beleg; `monitor.ts` Anzeige → `MonitorWerte` |

Regeln
- Zustand = Fall + Eingaben. `sende()` gibt immer einen neuen Zustand zurück.
- Logik-Takt 5 s Spielzeit; der Monitor interpoliert selbst (Render-Takt).
- Wartezeiten nie zusammenfassen (Takt-Grenzen ändern sonst das Ergebnis).
- Freigabe: `nur-aerztlich` und `gesperrt` → Grenze (gesperrt = in diesem Drittel nicht, keine ärztliche Aufgabe); anordnungspflichtig ohne Anordnung → braucht Anordnung; `mit-anleitung` → mit PA.
  Stufe 2: PA unterstützt bzw. warnt und führt nicht aus. Stufe 3: Knopf bleibt klickbar, `grenzueberschreitung` im Log.
- Neuer Fall: Datei in `faelle/`, in `faelle/index.ts` eintragen. Messwerte in Befunden nur als Platzhalter (`{rrSys}`, `{hf}` …), SBAR beschreibend ohne Zahlen.
  Katalog-Maßnahme mit fallspezifischem Namen/Wirkung: `aus(id, { … })` (Befugnis und Nachweis bleiben). Optional `team.kollegin` (Team-Leiste) und `medien.raumVarianten` (Foto je Zustand). `kern.test.ts` prüft Verweise, Musterweg (keine Fehler,
  alle Pflichthandlungen), Unterlassungsweg, Grenzweg und Replay automatisch.
- Konzept: Projektordner `praxissimulator-neu/KONZEPT.md`.
- Neue Katalog-Maßnahme: in `katalog.ts` mit `nw([...Lehrplan-Stellen])` oder `NICHT_BELEGT('Grund')`; `katalog.test.ts` prüft
  Nachweis, Monotonie der Befugnis (nie strenger mit der Ausbildung), Risiko bei Sperren, Spur-B-Bereiche, Wirkkurven.
- Matrix neu erzeugen: `BEFUGNIS_MATRIX=<pfad>.md npx vitest run src/features/praxis/kern/katalog`.

## Physiologie (Paket P1) – Lernmodell, Hinweis „Lernmodell“ bleibt Pflicht

- **Bestände** ändern nur Treiber und Wirkkurven: `volumen`, `hydratation`, `gefaesstonus`, `pumpleistung`, `blutzucker`,
  `delir`, `angst`, `schmerz`, `sauerstoff` (O₂ in l/min), `krampf` (0 kein, > 0 Anfall, < 0 postiktal).
- **Abgeleitete Größen** regelt das Modell zum Ziel *Basis (fall.start.grund) + Treiber-Effekt + laufende Wirkkurven*:
  `vigilanz`, `orientierung`, `unruhe`, `uebelkeit`, `atemantrieb`, `atemarbeit`, `gasaustausch`, `temperatur`.
  Wirkkurven auf diese Größen bleiben also erhalten (der Kern gibt die Summe als `kontext.wirkung` mit).
- **Treiber** (Parameter im Kopf von `pflegemodell.ts`): blutung, bronchospasmus, pneumonie, hypoglykaemie, sepsis_verlauf,
  opioid_ueberhang (Halbwertszeit ab `seit`), naloxon (kürzer → Renarkotisierung), insulin, kohlenhydrate,
  exsikkose_progressiv, delir_trigger, harnverhalt, panik_eskaliert, fieberkrampf_kind (ein Anfall je Fall).
- **Maßnahmen** (P3): `treiber` startet Treiber (z. B. Morphin `{ art: 'opioid_ueberhang', spiegel: 0.3, halbwertMin: 180 }`,
  Traubenzucker `{ art: 'kohlenhydrate', gramm: 20, schnell: true }`), `beendet` entfernt ganze Treiber-Arten
  (z. B. Einmalkatheter → `['harnverhalt']`). Der Kern stempelt `seit` nur aus `z.t` (Replay bleibt identisch).
  O₂-Gabe = Wirkkurve `{ groesse: 'sauerstoff', delta: 2, … dauerhaft }`; Lagerung über `lagerungsWirkung(befund, lage)`.
- **Anzeige**: Kreislauf über das Herzmodell (Frank-Starling) mit Barorezeptor-Reflex je Altersprofil (Hochbetagte: schwacher Reflex, gleicht nur teilweise aus, stark vorlastabhängig), `map`, `rekapSek`;
  Atmung über alveoläre Gasgleichung, Shunt, Bindungskurve (O₂ verdeckt Hypoventilation: SpO₂ gut, CO₂ hoch, Vigilanz sinkt).
  Niedriger Gefäßtonus senkt die Diastole stärker (Sepsis: große Druckamplitude); Angst über 0,6 wirkt überproportional (Panik:
  HF ≥ 110, AF ≥ 26, CO₂ sinkt); im Krampfanfall Hypoventilation (SpO₂ ≤ 90 ohne O₂).
- **Spur B (P1b)**: Hülle um `PFLEGE_MODELL`; `atmung()` nimmt bei `module.beatmung` FiO₂, af·vt und PEEP; Katecholamine als
  `gefaesstonus`/`pumpleistung`. Alarme im Kern nur für Werte in `z.sichtbar`, Farben wie am Monitor (`alarmFuer`).
- Kalibrierung, Monotonie, Determinismus und je Treiber ein Plausibilitätstest: `physiologie/pflegemodell.test.ts`
  (eine neue Treiber-Art braucht dort einen Eintrag, sonst schlägt die Typprüfung fehl).

## Spur B (P1b)
- `SPUR_B_MODELL = spurB(PFLEGE_MODELL)`: ohne `kontext.module` exakt `PFLEGE_MODELL` (Test). Module stehen in `SimZustand.module`
  (Start aus `fall.start.module`), geändert nur über `modul: ModulEingriff` an Maßnahme, Ereignis oder Entscheidungs-Option (Replay identisch).
- Eine Quelle je Größe: Bilanz nur `einfuhrMl`/`ausfuhrMl` (Anzeige `bilanzMl` abgeleitet), Sedierung als Grundgröße → `rass`.
- Katecholamine wirken nur während der Rechnung auf Gefäßtonus/Pumpe; die Bestände ändern weiter nur Treiber und Wirkkurven.
- Gerätestörungen (`stoerungAn/Aus`): Diskonnektion, Tubus verlegt, Sekret, art. Kurve gedämpft, nicht genullt (+18 mmHg).
- Befundtexte können `{map}`, `{laktat}`, `{ph}` … aus der Anzeige enthalten (`fuelle`).
- Anordnung `auchFuer` deckt mehrere Maßnahmen; `fehlerhaft.ersatz` = korrigierte Anordnung nach Remonstration.
- Erster Fall: `faelle/sr-septischer-schock.ts` (Rolle 3. Drittel oder Pflegefachperson, ungeprüft, Prüfpunkte im Fall).

Oberfläche (Paket P2): `../arbeitsplatz/` – Route `#/lernen/praxis?neu=<fall>`. `ansicht.ts` stellt rein zusammen, was der
Bildschirm zeigt (Reiter, Befugnis-Abzeichen, Werteleiste mit Momentaufnahme vs. live, Pflegetasche, SBAR, Anordnungen,
Team, Übersicht) und ruft nur den Kern. Laufender Fall in `lernstoff.praxis.arbeitsplatz` (nur Eingaben, Replay).
Browserprüfung: `npm run test:arbeitsplatz` (390/820/1180 px, axe).

## Auswertung (Paket P5)
- `auswertung.ts` (rein): `bewerte(z)` → Prozent je KB I–V, in Spur B zusätzlich `abcde/geraete/medikamente/team/zeit`.
  Beiträge: Pflicht (Gewicht 1–3), Entscheidungen (gut voll, vertretbar halb, gefährlich mit Abzug), Fehler (Abzug 1/2/4),
  Grenzüberschreitung (−3, Patientenschaden −4), PA warnt (−1), PA-Tipp (−0,5; Impulse frei), Rücklesen, Remonstration,
  Abschluss (Pflegebedarf inkl. Reihenfolge, Verdacht, SBAR-Übergabe aus S/B/A-Bausteinen). Fehler bekommen klinische
  Bereiche über die Maßnahmen in ihrer Bedingung. Verpasste Pflicht mit Gewicht 3 → `verpassteKritische` mit Frist.
- Zeitleiste per Replay der Eingaben; Warten wird in 5-s-Stücke geteilt (`inTakten`, Test: gleicher Zustand).
- Test je Fall: Musterweg ≥ 90 % in allen Bereichen, Unterlassung deutlich schlechter, Grenzweg KB III schlechter.
  Ein neuer Fall braucht im Musterweg einen `abschluss` mit `sbar` und einen Eintrag in `../arbeitsplatz/weiterlernen.ts`.
- Darstellung: `../arbeitsplatz/Auswertung.tsx` (Adapter `auswertung-karte.ts`, Weitergabe `weitergabe.ts` mit `sitzung=neu:<fall>`, KI-Tutor `tutor.ts`).

## Patientenakte (Paket P13)
- `fall.akte` (optional, Typ `Akte`): Medikationsplan (`MedPlanEintrag` mit `massnahme`, `zuletzt`, `geaendertDurch`), Vorwerte fürs
  Kurvenblatt, Pflegebericht/ärztliche Anordnungen vor dem Fall, Assessments, Labor, Pflegeplanung, Rechtliches. Fehlt sie,
  baut `akteVon()` eine Kurzakte aus `person`. Muster: `faelle/amb-sturz-exsikkose.ts` (Frau Lindner).
- `Meldung.werte`: Befund-Meldungen mit `zeigt`, Schmerzeinschätzungen (`SCHMERZ_MESSUNG`) und Doku-Einträge tragen die Werte
  zum Messzeitpunkt. Quelle für Kurvenblatt, Wert-Bausteine und Verlauf; nie den aktuellen Modellwert nachträglich lesen.
- Gabe einer Maßnahme mit Plan-Eintrag prüft `medPruefung()`: Dauermedikation Mindestabstand aus dem Schema (1×/Tag 12 h,
  2× 6 h, sonst 3 h), Bedarf `abstandH` und `maxProTag` („4 Gaben“ oder Menge/Einzeldosis). Durch eine erhaltene Anordnung
  geänderte Einträge (`geaendertDurch`) zählen nicht. Fehler im Log `med-doppelt:<eintrag>`, `med-abstand:…`, `med-max:…`
  mit Text als Meldung; Auswertung KB I+III, klinisch Medikamente (Doppelgabe/Höchstmenge schwer, Abstand mittel).
- Eingabe `dokumentieren` (Bausteine + Freitext): `dokuBausteine(z)` bietet nur Bekanntes an (`wert:<k>`, `befund:<maßnahme>`,
  `massnahme:<id>`, `anordnung:<id>`, SBAR-A-Bausteine). Markiert `doku:<baustein>` (Bedingung `{ dokumentiert }`), `doku` und
  – wenn der Fall sie anbietet – die Maßnahme `pflegebericht`. Kostet 60 s + 15 s je Baustein (+30 s Freitext, max. 240 s).
- Oberfläche: `../arbeitsplatz/Akte.tsx` (Dialog, Uhr steht) mit `akte-ansicht.ts`; Knopf in der Kopfzeile und Hotspot im Foto,
  „Pflegebericht schreiben“ öffnet den Bericht.

## Verlauf sichtbar machen (P12, Runde 2)

- `verlauf.ts`: aus `befinden()` und `anzeige()` wird pro Takt abgeleitet, was man sehen oder hören kann
  (Bewusstsein AVPU, Atemnot, Atemtempo, Haut, Schmerz, Unruhe, Angst, neue Verwirrtheit, Krampf, Übelkeit).
  Eine Änderung wird gemeldet, wenn sie `ENTPRELL_SEK` (20 s) besteht, je Merkmal höchstens alle `MIN_ABSTAND_SEK` (60 s);
  Krampf sofort. Meldung `art: 'verlauf'`, `quelle: 'verlauf:<merkmal>'`, `wichtig` bei Verschlechterung von Bewusstsein,
  Atmung, Haut, Krampf. Texte ohne Zahlen. Ein Fallereignis im selben Takt hat Vorrang (keine Doppelbeschreibung).
  Bei Bewusstsein P/U werden Orientierung, Angst, Unruhe, Schmerz, Übelkeit still nachgeführt.
- `SimZustand.verlaufStand` (optional) hält den Stand; `start()` legt ihn aus der Ausgangslage an. `z.bild` (Haut, Mimik,
  Haltung „unruhig“) folgt den gemeldeten Beobachtungen. Vorspulen stoppt NICHT an Verlauf-Meldungen.
- Darstellung: `arbeitsplatz/kurve/kurvendaten.ts` (rein: Messpunkte aus `Meldung.werte`, Monitorlinie nur für Größen an
  einem laufenden Gerät, Marken aus Log und Meldungen, Vorwerte der Akte mit `t = −vorH·3600`, `vorherNachher()`),
  `arbeitsplatz/kurve/Kurvenblatt.tsx` (gemeinsam mit der Akte P13; Achse `zeit` oder `blatt`),
  `arbeitsplatz/journal.ts` + `Verlauf.tsx` (Blatt „Verlauf“ aus der Werteleiste, Journal mit Filter).

## Kommunikation und Arzt-Messenger (Paket P11)

Code: `kommunikation.ts` (rein, vom Kern aufgerufen), Zustand in `SimZustand.komm`. Oberfläche: `../arbeitsplatz/gespraeche.ts` (Ansichtslogik) und `Kommunikation.tsx` (Reiter „Sprechen“, ersetzt Gespräch + Melden).

- **Fäden je `Gegenueber`.** `anruf` öffnet den Arzt-Faden neu (wie bisher, bestehende Fälle unverändert). `nachricht` hängt Bausteine an den Faden; `gemeldet` prüft alle Bausteine des Fadens (`letzterAnruf` = Faden). Telefon bleibt offen bis `auflegen` oder bis eine Maßnahme/Frage am Patienten kommt (Kern legt dann auf).
- **Regelwahl.** Erste passende Regel; Regeln mit `id` antworten nur einmal im Fall. Im laufenden Faden geht es nur „nach oben“: nach Regel k kommen nur noch Regeln vor k in Frage. Reihenfolge im Fall daher: genau → allgemein.
- **Messenger.** Kanäle aus `fall.arzt.kanaele`; fehlt das Feld: Telefon, nach dem ersten Kontakt zusätzlich Messenger. Antwort nach `antwortNachSek` (Standard Messenger 90 s, Telefon 0); der Kern stempelt `faellig = t + Wartezeit` und stellt im Takt zu (Replay identisch). Wirkungen (Anordnungen, Flags, Aufträge) erst bei Zustellung.
- **Wert-Bausteine** `wert:<Anzeige-Schlüssel>` entstehen aus `Meldung.werte` der Befunde (Wert zum Messzeitpunkt, nicht der aktuelle Modellwert). Nicht gemessene Werte filtert der Kern aus Nachrichten heraus.
- **Rückfrage** (`ArztRegel.rueckfrage`): Faden bleibt offen. Nächste Nachricht mit allen `erwartet` → Regeln erneut. Zusage-Baustein `zusage:melde-mich` → Rückauftrag `rueckfrage.auftrag`.
- **Rückaufträge.** `erledigt` wird relativ zur Auftragszeit geprüft (nur Handlungen danach zählen, `ab` = Sekunden nach dem Auftrag). Melden = Nachricht mit allen `meldung`-Bausteinen (optional `auftrag` in der Eingabe) → erste passende `folge`-Regel. Frist `meldenBinnenSek` überschritten → Status verspätet, PA-Impuls (Stufe 1/2), Fehler `auftrag-verspaetet:<id>` (Auswertung KB II, leicht). Bedingung `{ auftrag, status }`: 'erledigt' gilt auch nach dem Melden, 'verspaetet' bleibt.
- **Alle Beteiligten.** Fragen (`gespraech`) laufen im Faden ihres `an`; `nurWenn`, `antwort.setzt`, `schweigepflicht` (ohne `erlaubtWenn` → Fehler `schweigepflicht:<id>` mit `fehlerText`, Auswertung KB II+IV, mittel). Nachrichten mit Bausteinen an Rettungsdienst/Station/Kollegin/PA werden quittiert und als `gesagt` gemerkt (Bedingung `{ gesagt, an }`, z. B. für Übergabe-Pflichten).
- **Freitext** ordnet die Oberfläche offline über Stichwörter Bausteinen zu („verstanden als …“, `verstehe()`); der Freitext selbst geht mit ins Log. KI-Zuordnung folgt später.
- Muster: Frau Lindner (v0.2.0): Rückfrage „Wie hoch ist der Zucker?“, Rückauftrag RR-Kontrolle nach einer Viertelstunde, Tochter mit Einwilligung. Tests: `kommunikation.test.ts`, `../arbeitsplatz/gespraeche.test.ts`.

## Fälle auf Runde 2 (P14b)
- `paed-fieberkrampf` v0.2.0: Ärztin fragt ohne SpO₂/BZ zurück (`af-werte`), Rückauftrag „in 10 Min. Temperatur und Bewusstsein, per Messenger“ (`af-kontrolle`, Ende stabil erst danach), Großmutter ruft an (Auskunft nur mit Einverständnis der Mutter), Kollege Tim (Notfallmedikament bereitlegen), Akte, Doku-Pflicht `{ dokumentiert: 'a-krampf-dauer' }`.
- `psy-panik-suizidalitaet` v0.2.0: Ärztin fragt ohne körperliche Einschätzung nach dem Puls (`af-puls`), Rückauftrag „Schwester einbeziehen?“ (`af-schwester`), Schwester ruft an (keine Schweigepflichtentbindung), Kollege Deniz plant die 1:1-Begleitung, Akte (Zopiclon abgesetzt), Doku-Pflicht `{ dokumentiert: 'a-plan' }`.
- Gespräche mit Anrufenden hängen per `nurWenn` an derselben Bedingung wie das Anruf-Ereignis.
