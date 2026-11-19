# Praxissimulator neu – Kern (Paket P0)

Reiner, deterministischer Simulationskern für beide Spuren (A Pflege/Generalistik, B Akut/Notfall/Intensiv).
Oberfläche: Arbeitsplatz Stufe 2 (`../arbeitsplatz`), Stufe 1 geführt (`../stufe1`, P21). Die alte Engine (`../engine.ts`) und die alten Leitfälle (`../gefuehrt`) laufen bis P10 weiter.

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
- Neuer Fall: Datei in `faelle/`, in `faelle/index.ts` eintragen, `lehrplan` (CE, Abschnitt, Themen) setzen (Test `faelle/lehrplan.test.ts`, Fallplan im Projektordner `FALLPLAN-CE.md`).
  Danach in `../fallplan.ts` beim Plan-Eintrag `fall: '<id>'` setzen (löst den Altfall ab), `KERN_THEMEN` in `../themen.ts` ergänzen und
  erledigte Lücken aus `ABDECKUNG_OFFEN` streichen (Test `../fallplan.test.ts`). Die Fallauswahl `#/lernen/praxis` gruppiert nach CE und Drittel (`?ce=ce.05`). Messwerte in Befunden nur als Platzhalter (`{rrSys}`, `{hf}` …), SBAR beschreibend ohne Zahlen.
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
  geänderte Einträge (`geaendertDurch`) zählen nicht. Im Fall neu angeordnete Bedarfsmedikation bekommt einen Plan-Eintrag mit
  `ab: '<anordnungs-id>'`: erst nach der Anordnung in der Akte und geprüft, Gaben davor zählen nicht (Beispiele: Alkoholentzug,
  Fieberkrampf, Dekubitus, Palliativgespräch). Fehler im Log `med-doppelt:<eintrag>`, `med-abstand:…`, `med-max:…`
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
- Umgestellt in P14a (v0.2.0, Tests `faelle/p14a.test.ts`):
  - Frau Albrecht (KH): Rückfrage „Wie ist der Blutdruck?“, Rückauftrag RR zehn Minuten nach Infusionsstart per Messenger, Tochter (Auskunft erst nach Blick in den Aufnahmebogen, `kurve-lesen`), Übergabe an die IMC mit Bausteinen, Paracetamol-Bedarf zuletzt 11:30 (Abstandsfehler). Normalstation ohne Monitor ab Beginn.
  - Herr Kranz (Schockraum): `start.sichtbar` HF/SpO₂ (Transport-Pulsoxy), Rückfrage qSOFA, Rückaufträge Laktat und MAP nach Nullabgleich, Rettungsdienst (Nachfragen), Sohn mit Vorsorgevollmacht (Auskunft erst nach RD-Übergabe), Übergabe an die Intensiv mit Allergie, Doku Zeitpunkte Blutkulturen/Antibiotikum.
  - Frau Brückner (Heim): Rückfrage „Hat sie Fieber?“, Rückauftrag BESD nach dem Schmerzmittel, Betreuerin (`betreuer`), Wohnbereichsleitung, Enkel am Telefon (keine Auskunft), Doku BESD + hinterfragte Bettgitter-Anordnung.
- Wert-Baustein Schmerz heißt „Schmerz (0–10)“ (auch BESD), in der Akte „x/10“.

## Fälle auf Runde 2 (P14b)
- `paed-fieberkrampf` v0.2.0: Ärztin fragt ohne SpO₂/BZ zurück (`af-werte`), Rückauftrag „in 10 Min. Temperatur und Bewusstsein, per Messenger“ (`af-kontrolle`, Ende stabil erst danach), Großmutter ruft an (Auskunft nur mit Einverständnis der Mutter), Kollege Tim (Notfallmedikament bereitlegen), Akte, Doku-Pflicht `{ dokumentiert: 'a-krampf-dauer' }`.
- `psy-panik-suizidalitaet` v0.2.0: Ärztin fragt ohne körperliche Einschätzung nach dem Puls (`af-puls`), Rückauftrag „Schwester einbeziehen?“ (`af-schwester`), Schwester ruft an (keine Schweigepflichtentbindung), Kollege Deniz plant die 1:1-Begleitung, Akte (Zopiclon abgesetzt), Doku-Pflicht `{ dokumentiert: 'a-plan' }`.
- Gespräche mit Anrufenden hängen per `nurWenn` an derselben Bedingung wie das Anruf-Ereignis.

## Fallwelle P16b: CE06 Akutsituationen (Tests `faelle/p16b.test.ts`)
- `kh-reanimation-bls` (Spur A, Station nachts ohne Monitor, Rolle 2/3): `start.module.rhythmus: 'kammerflimmern'`, Kreislauf erst nach Herzdruckmassage + AED-Schock + Weiterdrücken (`bls-weiter` → `rhythmus: null`). Entscheidungen AED-Analyse („Alle weg“) und Bettnachbar „Er wollte das nicht“ (ohne Verfügung weiter reanimieren). Doku-Pflicht Befunde BLS/AED + ROSC.
- `na-acs-brustschmerz` (Spur B, Notaufnahme, Rolle 3/PFP): Triage → Monitor → 12-Kanal-EKG in 10 Min. Nitrat ist als fehlerhafte Anordnung angelegt (Sildenafil gestern Abend, nur über die Frage `g-medikamente` bekannt) → Ersatz Morphin i. v. (Wirkstoff G1). Rückauftrag RR/Schmerz nach Morphin, VT-Salve als Entscheidung, Unterlassung Kammerflimmern ohne Monitor.
- `lz-schlaganfall-akut` (Spur A, Pflegeheim, Hochbetagter, Rolle 2/3): G5-Treiber `schlaganfall` (rechts, Aphasie; `grund.neuroDefizit` gesetzt, damit FAST ab Beginn positiv ist), Beginn 35 Min. vor Fallstart. Notruf 112 vor der Hausärztin (Regel greift nur nach dem Notruf, sonst „Rufen Sie die 112“ + Fehler), Rückfrage Blutzucker, fehlerhafte Anordnung „Morgentabletten geben“ (Schluckstörung, Apixaban) zum Hinterfragen.
- `its-beatmung-alarm` (Spur B, Intensiv, Rolle 3/PFP): Diskonnektion bei Fallbeginn als gestaffeltes Leck (VT 220 → 160 → 130 → ganz ab), DOPES, Sekretverlegung, leere Propofol-Spritze. Start-Flags `beatmet`, `arterie-liegt`, `perfusor-laeuft`, `zugang-liegt`, `zvk-liegt` (Katalog-Voraussetzungen). Ziel RASS 0/−1 (Propofol 4 ml/h = 1 mg/kg/h, Sufentanil 5 ml/h, seit #274 kalibriert); „Propofol auf vierzig“ ist fehlerhaft → Ersatz Sufentanil 7 ml/h (Analgesie zuerst).

## Grundsystem G1: Wirkstoffe (physiologie/wirkstoffe.ts)

- Register `WIRKSTOFFE` (16 Wirkstoffe: Morphin, Piritramid, Lorazepam, Midazolam, Flumazenil, Naloxon, Haloperidol, Paracetamol,
  Metamizol, Ibuprofen, Salbutamol, Prednisolon, Furosemid, Torasemid, Ondansetron, Metoclopramid) mit Quelle (Fachinformation,
  Leitlinie), Wegen, Halbwertszeit und Beobachtungshinweisen. Lernmodell, ersetzt keine Fachinformation.
- Treiber `{ art: 'wirkstoff', id, dosisMg, weg? }` (in Maßnahmen über `treiber`). Kinetik: Bateman-Kurve je Weg, Gipfel 1 bei
  üblicher Erwachsenendosis; Dosis nach Gewicht (Kinder), Hochbetagte Halbwertszeit × 1,5 und zentrale Wirkung × 1,3.
- Kanäle: Opioid, Sedierung (Opioid + Benzodiazepin überadditiv auf den Atemantrieb), Analgesie (NRS), Fiebersenkung, Anxiolyse,
  Beruhigung, Antiemese, Bronchodilatation, Puls, Gefäßtonus, Diurese (Volumen, Hydratation, Kalium), Blutzucker, Krampfende,
  Delirrisiko (Benzodiazepine bei Hochbetagten), Antagonisten (Naloxon, Flumazenil; kürzer wirksam → Renarkotisierung/Resedierung).
- Bestände Schmerz, Angst, Gefäßtonus tragen den Arzneimittelanteil (`wirkSchmerz`, `wirkAngst`, `wirkTonus`), der beim Abfluten
  zurückgegeben wird; `wirkHf` hebt den Puls. Ohne Wirkstoff-Treiber bleiben diese Felder leer (bisherige Kalibrierung unverändert).
- Antipyretika verhindern einen Fieberkrampf nicht (Schwelle gilt für den Fieberverlauf ohne Senkung).
- Doppelgabe, Abstand und Höchstmenge prüft weiter `akte.ts`; G1 liefert nur die Wirkung.

## Grundsystem G2: Niere und Ausscheidung

`physiologie/niere.ts` (Lernmodell). Spur B nutzt `urinMlH` und `laktatZiel` von dort (Re-Export in `spur-b/modul.ts`, Test auf exakt gleiche Werte).

- **Stundenurin** (`Anzeige.urinMlH`, jetzt auch in Spur A): Nierendurchblutung (MAP, Füllung) × Antidiurese bei Flüssigkeitsmangel (ADH) + Diuretika (`Grundgroessen.wirkDiurese`, vom Modell aus G1 geschrieben). Ruhe ≈ 1 ml/kg/h, Schock < 0,5 ml/kg/h.
- **Urinfarbe** (`Anzeige.urinFarbe`, 1–8 nach Urinfarbtafel): wird bei Exsikkose dunkel, nach Diuretika hell.
- **Blase** (`Grundgroessen.blaseMl`, optional): nur wenn der Fall eine Füllung vorgibt oder ein Treiber `harnverhalt` läuft. Ohne Abflusshindernis Entleerung ab 350 ml (Restharn 30 ml), bei Harnverhalt füllt sie sich weiter; „blasenkatheter-legen“ beendet den Harnverhalt. `Anzeige.blaseMl` passt zu einem Blasenscan-Befund.
- **Kalium**: Ausgangswert 4,2 mmol/l, Schleifendiuretika senken es; `Anzeige.kalium` erscheint in Spur A, sobald der Fall oder ein Wirkstoff es führt.
- Befundtexte können `{urinMlH}`, `{urinFarbe}`, `{blaseMl}`, `{kalium}` als Platzhalter nutzen.

## Fallwelle P17a: Einstiegsfälle CE 01–03 (1. Drittel)
- `kh-erster-tag` (CE 01): Händedesinfektion vor dem Kontakt (Fehler `f-haende-vergessen`, wenn eine patientennahe Handlung vorher kommt), Identität, Vorwerte vergleichen, Schwindel beim Aufsetzen (Entscheidung), Rückfrage Trinkmenge, Rückauftrag RR/Puls, Nachbarin am Telefon (keine Auskunft), Infusion im 1. Drittel durch Pflegefachfrau Jana (Gespräch mit Volumenwirkung), Ramipril- und Paracetamol-Fallen.
- `lz-koerperpflege-abgelehnt` (CE 03): Körperpflege erst nach Grund (`grund-scham`) und Aushandeln (`einverstanden-pflege`), „trotzdem waschen“ und Druck der WBL als Grenzüberschreitung, neue Inkontinenz → Urinstix-Rückfrage, Dauerkatheter als fehlerhafte Anordnung, Reflexion mit der PA als Pflicht (KB V).
- `kh-reha-erster-weg` (CE 02, aus Altfall „reha“): Mobilisation Tag 1 nach Hüft-TEP vorbereiten, Kollaps beim Gehen (Entscheidung), Rückfrage Hb, Novaminsulfon trotz Metamizol-Allergie remonstrieren, Physio/Ehefrau.
- `lz-dekubitus-immobil` (CE 02, G3): Treiber `immobil` 55 mmHg, feucht, Start `druckLast` 12 → ohne Entlastung Kategorie 1 nach gut 25 min (Fehler `f-kategorie1`, Fingertest-Befund über `wert: dekubitusKat`). Braden neu, BESD (Wert-Baustein `wert:besd`), Rückfrage Trinkmenge, Paracetamol vor dem Lagern, Ankündigen vor dem Lagern, Franzbranntwein (Entscheidung), Bewegungsplan und Matratze.
- `kh-harnverhalt-postop` (CE 02/05, G2): Treiber `harnverhalt`, Start `blaseMl` 610, Überlaufinkontinenz (Entscheidung „Vorlage“), Miktion erst nicht-invasiv, Blasenscan (`{blaseMl}`, Wert-Baustein `wert:blaseMl`), Rückfrage Scan, Einmalkatheter nach Anordnung: 1. Drittel assistiert (`katheter-assistieren`), selbst ab 2. Drittel mit PA; Katheter beendet den Harnverhalt und senkt Schmerz/Unruhe.
- `kommunikation.ts`: Wert-Bausteine zusätzlich für `besd` und `blaseMl`.
- Tests: `faelle/p17a.test.ts` (u. a. Musterweg im 1. Drittel ≥ 90 %), Browserprüfung Block P17A in `check-arbeitsplatz.mjs`.

## Fallwelle P16a: CE 05 (2./3. Drittel)
- Neue Treiber (additiv): `anaphylaxie {staerke}` (Gefäßtonus und Kapillarleck, Bronchospasmus 0,7·s, Adrenalin aus G1 bremst) und `lungenembolie {staerke}` (Gasaustausch −0,8·s, Atemantrieb +0,5·s, Pumpleistung sofort 1 − 0,4·s, ab s > 0,7 Kreislaufdekompensation). Nachschub = zweiter, stärkerer Treiber per Ereignis.
- `kh-nachblutung`: Druckverband ersetzt den Blutungstreiber (`beendet` vor `treiber`), Enoxaparin trotz Nachblutung als fehlerhafte Anordnung, Rückauftrag RR/Puls nach der Infusion, Ehefrau am Telefon, Übergabe an die OP-/Anästhesiepflege.
- `awr-opioid-atemdepression` (Spur B, etCO₂): O₂ verdeckt die Hypoventilation, Naloxon gibt die Ärztin per Ereignis (`NALOXON_DA` = Bedingung des Ereignisses, weil Ereignisse keine Flags setzen), Station will das Bett (Entscheidung), Piritramid nach Naloxon als fehlerhafte Anordnung.
- `kh-anaphylaxie-infusion`: Infusion stoppen ohne Anordnung, Lagerung nach Leitsymptom, Adrenalin i. m. durch die Ärztin, Rückauftrag Werte nach 5 Min., „Cefuroxim langsam wieder anhängen“ remonstrieren, Allergie kennzeichnen, Schwester nur mit Einwilligung.
- `kh-lungenembolie`: Mobilisation stoppen (Entscheidung + Sichern verhindert den Nachschub), ausgelassenes Enoxaparin in der Akte (Rückfrage), Rückauftrag Beine vergleichen, „allein mit dem Transportdienst ins CT“ remonstrieren, Sohn nur mit Einwilligung.
- `kh-medikationsverwechslung`: Meier/Maier im Zweibettzimmer, Glimepirid als Lernmodell über `hypoglykaemie`, Kollegin bittet ums Schweigen (Entscheidung), CIRS-Meldung, Rückauftrag BZ/Puls, Doppelgabe Metoprolol remonstrieren.
- Muster-Wege enthalten keine `entscheidung`-Schritte (die Testhelfer wählen „gut“ selbst; doppelt führt zu doppelten Auswertungs-IDs).
## Fallwelle P18: Lebenswelt und Lebensende (CE 08/09)
- `lz-demenz-aspiration` (CE 09/08, aus „demenz“): Herr Kühn isst nicht → Aspirationspneumonie, Mund/Andicken/aufrecht, Patientenverfügung und Betreuer (Sohn will 112), Antibiotika-Tablette bei Schluckstörung remonstrieren (Ersatz Saft), Rückauftrag Temperatur/AF.
- `lz-unterzucker-mittag` (CE 09/04, aus „pflegeheim“): Unruhe vor dem Essen = Unterzucker, BZ, langsame Kohlenhydrate nach Lebenswelt (Frühstücksgewohnheit), Insulin zum Mittag zurückstellen und Anordnung hinterfragen, Kollegin will spritzen, Mitbewohnerin (Schweigepflicht).
- `amb-hausbesuch-still` (CE 09/02, aus „hausbesuch“): Witwe, Trauer und Rückzug, volles Dosett, Orthostase prüfen (Pflegetasche RR), Todesgedanken offen nachfragen, „vergessene Tabletten nachholen“ remonstrieren, Einwilligung vor Tochter/Nachbarin, Versorgung absprechen.
- `lz-palliativ-gespraech` (CE 08/09, aus „palliativ“): Atemnot und Tumorschmerz, IPOS, Atemnot ohne Medikament lindern (beendet `panik_eskaliert`), Tochter will den Notarzt, Morphin 10 mg bei Opioidnaivität remonstrieren (Ersatz 2,5 mg oral, G1), Rückauftrag Wirkung, SAPV.
- `kh-sterbephase-nacht` (CE 08, 3. Drittel, neu, Herr Hartwig): Sterbephase, Bedarfsplan liegt als `start.anordnungen` vor (Morphin s. c., Lorazepam s. l., G1), Rasselatmung lagern statt absaugen, Monitoring/Rea-Team-Anordnung gegen das Therapieziel remonstrieren, Ehefrau und Bettnachbar, Grenzweg Butylscopolamin ohne Rücksprache.
- Hinweis: Bedingungen in `auftraege[].erledigt` gelten relativ zur Auftragszeit (`ab` zählt ab Auftrag).
- Browserprüfung Block P18 in `check-arbeitsplatz.mjs`, Screenshots im Projektordner `praxissimulator-neu/runde2/P18/`.

## Grundsystem G3: Haut, Mobilität, Sturz

`physiologie/haut-mobilitaet.ts` (Lernmodell). Das Druck-mal-Zeit-Modell `haut()` der Lernseite liegt jetzt in `physiologie/organe.ts` (Lernseite re-exportiert, gleiche Funktion).

- **Treiber `immobil`** `{ druckMmHg, scherkraefte?, feucht? }`: Auflagedruck an der belasteten Stelle (Weichlagerung ≈ 30, Standardmatratze 60–80 mmHg).
- **`Grundgroessen.druckLast`** (mmHg·h über Kapillardruck 32): steigt unter Druck; Scherkräfte ×1,5, Feuchte ×1,3, MAP < 65 bis ×1,6, Exsikkose ×1,2. Ohne Druck erholt sich das Gewebe (−40 je Stunde).
- **`Grundgroessen.dekubitusKat`** / `Anzeige.dekubitusKat` 0–4: höchste erreichte Kategorie (gleiche Schwellen wie die Lernseite), geht im Fall nicht zurück.
- **Entlastung**: Katalog „positionieren-druckentlastung“ und „mobilisieren-transfer“ tragen die Wirkkurve `druckLast` faktor 0 (neue Auflagestelle). Wirkkurven dürfen auf die optionalen Größen in `OPTIONALE_WIRKGROESSEN` (modell.ts) zeigen.
- **Sturzrisiko** `sturzrisiko(g, eingabe)`: Gründe aus dem Zustand (Alter, Delir/Verwirrtheit, Unruhe, Bewusstsein, Kreislauf/Schwindel, Sedierung aus G1, Harndrang aus G2, Unterzucker, Schmerz, Fieber, Immobilität) und Stufe gering/erhöht/hoch; G4 stellt es als Einschätzung bereit.

## Grundsystem G4: Einschätzungen aus dem Modell

`physiologie/einschaetzungen.ts` (vereinfacht nachgebildet, Lernmodell). Der Kern ergänzt in `anzeige(z)` für Spur A und B:

| Feld | Instrument | Bedeutung |
|---|---|---|
| `schockindex` | Puls / RR sys | > 1 Schockverdacht (Erwachsene) |
| `qsofa` | qSOFA (Sepsis-3) | 0–3, ≥ 2 Sepsisverdacht |
| `news2` | NEWS2 (nur Erwachsenenprofil, „C“ = neu verwirrt gegenüber Ausgangslage) | Punkte |
| `pews` | PEWS vereinfacht nach Brighton (nur Kinder) | 0–9 |
| `nuDesc` | Nu-DESC | 0–10, ≥ 2 Delir wahrscheinlich |
| `besd` | BESD | 0–10, ≥ 2 Schmerz möglich |

Alle Felder gehen als Platzhalter in Befundtexte (`{qsofa}`, `{schockindex}` mit einer Nachkommastelle …) und als `wert` in Bedingungen. `einschaetzungen(a, g, treiber, k)` liefert zusätzlich **Braden** (6–23, Ernährung aus der Hydratation geschätzt, Immobilität aus G3) und das **Sturzrisiko** aus G3 (Sedierung aus G1, Harndrang aus G2) für Auswertung, Übergabe oder KI-Tutor. Die Einschätzung am Menschen ersetzen sie nicht: Fälle sollen die Maßnahme (z. B. „schmerz-besd“) weiter verlangen, das Modell liefert nur den passenden Wert.

## Grundsystem G5: Neurologie

`physiologie/neuro.ts` (Lernmodell; SOP der Stroke Unit gehen vor).

- **Treiber `schlaganfall`** `{ seite, schwere, blutung?, beginnVorMin? }`: `seite` = betroffene Körperseite (rechts → linke Hirnhälfte → Aphasie). Das Defizit (`Grundgroessen.neuroDefizit`) baut sich in Minuten auf und wächst unbehandelt langsam weiter. `beginnVorMin` = Symptombeginn vor Fallstart.
- **Treiber `lyse`** (ärztliche Anordnung): Nutzen bis 60 % weniger Defizit, je früher desto mehr, nach 270 min (4,5 h) keiner; bei `blutung` steigt der Hirndruck viermal so schnell (Bildgebung vor Lyse).
- **Treiber `hirndruck`** `{ tempo, seite? }` (Hirnhälfte): `Grundgroessen.hirndruck` 0..1 steigt um 0,5 × tempo je Stunde. Folgen: Vigilanz und GCS fallen, Erbrechen, gleichseitige Pupille weit/träge (ab 0,5), lichtstarr (ab 0,8), beidseits weit (ab 0,95); Cushing ab 0,65 (RR ↑, Puls ↓, Atmung flacher).
- **Anzeige für alle**: `pupilleRechtsMm`/`pupilleLinksMm`, `pupilleRechtsLicht`/`pupilleLinksLicht` (Opioide eng, schwere Hypoxie/Stillstand weit und lichtstarr), `gcsAugen`/`gcsVerbal`/`gcsMotorik` (Summe = `gcs`; ohne Neuro unverändert, Aphasie senkt nur den verbalen Wert).
- **Anzeige mit Schlaganfall**: `fast` (0–3), `nihss` (grob), `seitBeginnMin`, `lyseFensterMin` – für Befundtexte und Zeitdruck-Bedingungen.
- Grundgrößen `neuroSeite`, `seitBeginnMin`, `wirkOpioid` schreibt das Modell; Fälle setzen sie nicht.

## Fallwelle P19: Kinder und Psyche (CE 10/11)

Sieben neue Fälle im Schema v2, alle mit `lehrplan`, Akte, mindestens zwei Gesprächspartnern, Rückfrage und Rückauftrag,
Remonstrationspunkt, Entscheidungs- bzw. Komplikationsereignis und Weiterlernen-Eintrag. Fallbezogene Prüfungen in `faelle/p19.test.ts`.

| Fall | CE | Kern | Remonstration | Modell |
|---|---|---|---|---|
| `paed-asthma-schulkind` | 10, 06 | Asthmaanfall 7 J., Spacer, Rückfrage SpO₂, Vater (Sorgerecht) | Diazepam bei Atemnot | `bronchospasmus`, Salbutamol beendet ihn |
| `paed-bronchiolitis-saeugling` | 10 | RSV 4 Mon., Nase absaugen vor dem Trinken, Isolation | Xylometazolin 0,1 % → Kochsalz (`ersatz`) | Sekretstau-Ereignis, `nase-absaugen` |
| `paed-gastroenteritis-kleinkind` | 10 | Exsikkose 3 J., orale Rehydratation, BZ, Kita (keine Auskunft) | Ondansetron 4 mg → 2 mg | `exsikkose_progressiv`, `hypoglykaemie` |
| `paed-rausch-jugendliche` | 10, 06 | Alkoholintoxikation 15 J., Seitenlage, BZ/Temperatur, Mutter, Freundin | Traubenzucker-Gel bei Bewusstseinstrübung | `hypoglykaemie`, Glukose-Infusion beendet sie |
| `kh-delir-nacht` | 11, 05 | Postoperatives Delir 84 J., 4AT, Harnverhalt, Brille/Hörgerät, Sohn (Vollmacht) | Lorazepam bei Hochbetagten | `delir_trigger` (Schmerz, Harnverhalt, Umgebung), Einmalkatheter beendet `harnverhalt` |
| `psy-unruhe-deeskalation` | 11, 06 | Psychose, Deeskalation, Krisenplan, Mutter ohne Entbindung | Telefonische „Vorrats“-Fixierung → freiwilliges Lorazepam | `panik_eskaliert` als Näherung, Deeskalation beendet ihn |
| `kh-alkoholentzug` | 11, 05 | Entzug nach OP, Score (CIWA-Ar/AESB), Ehefrau mit Einwilligung | Lorazepam starr stündlich → nach Score | Treiber `alkoholentzug` (schwere 0,65, 34 h): CIWA-Ar, Halluzinationen; Lorazepam (entzugsschutz), Thiamin |

- Psychiatrie: Foto Aufenthaltsraum fehlt, `psy-unruhe-deeskalation` nutzt vorläufig `11_pflegeheim_speiseraum` (Beispielbild).
- `kh-alkoholentzug` ist nur für das 3. Drittel (`ad3`, Lehrplan sucht3).
- `paed-bronchiolitis-saeugling` v0.2.0: Treiber `atemerschoepfung` (tempo 6) von Anfang an; ohne Absaugen HF um 195, AF um 75, „droht“ nach etwa 15 min, Atempausen nach etwa 28 min, dann Bradykardie über die Hypoxie; Unterlassung: SpO₂ < 80 und HF < 120 bis 40 min.

## Grundsystem G6: Schlucken, Aspiration, Ernährung

`physiologie/schlucken.ts` (Lernmodell; Logopädie und Schluckdiagnostik gehen vor).

- **Dysphagie** (`Grundgroessen.dysphagie`, vom Modell): Treiber `schluckstoerung { schwere }`, Schlaganfall (0,8 × `neuroDefizit`) oder Eintrübung (Vigilanz < 0,55). Ohne Schluckthema (kein Treiber, kein Schlaganfall, keine Mahlzeit) führt das Modell nichts davon.
- **Treiber `nahrung { form: 'essen' | 'trinken' }`**: wirkt 15 Minuten. Katalog: „essen-anreichen“ und „trinken-anbieten“ setzen ihn. Dünne Flüssigkeit aspiriert mehr als Essen, Eintrübung mehr als wach; „kost-anpassen“ (Wirkkurve `kostAngepasst` 0→1, in `OPTIONALE_WIRKGROESSEN`) senkt die Aspiration um 65 %.
- **Akut** (`aspirationAkut`): Husten, schnelle Atmung, SpO₂ fällt, klingt in etwa 20 Minuten ab.
- **Folge** (`aspirationsPneumonie`): Schwere nach aspirierter Menge, entwickelt sich über Stunden; wirkt wie Treiber `pneumonie` (Fieber, Rasselgeräusche im Befinden, Gasaustausch). Beatmete Personen (Spur B mit Beatmung) aspirieren im Modell nicht.
- **Anzeige `guss`** (Gugging Swallowing Screen 0–20; ≤ 14 Aspirationsgefahr, eingetrübt ≤ 4) als Platzhalter für den Befund von „schlucken-pruefen“.
- Ernährungszustand (Gewicht, MNA) ändert sich in Fallzeit nicht; er gehört in die Falldaten, Braden schätzt die Ernährung aus der Hydratation.

## Grundsystem G7: Schlaf und Tageszeit

`physiologie/schlaf.ts` (Lernmodell). Nur aktiv, wenn der Fall Schlaf führt: Treiber `schlafstoerung { staerke }` oder `start.grund.schlafdefizit` (z. B. 0.2). Sonst ändert die Uhrzeit nichts (Test).

- **Uhrzeit**: `ModellKontext.uhrzeitMin` setzt der Kern aus `fall.startUhrzeit`; das Modell zählt die Spielzeit dazu. Nacht 22–6 Uhr, Sundowning ab 18 Uhr.
- **Nachts**: Störung = Treiber-Stärke (× Schutz) + Schmerz ≥ 5 + Angst + volle Blase/Harndrang (G2). Wer nachts wach liegt, baut `schlafdefizit` auf, ungestörter Schlaf baut es ab.
- **Delir**: Schlafdefizit und nächtliche Störung sind zusätzliche Delir-Auslöser; bei bestehendem Delir sinkt die Orientierung abends/nachts (Sundowning).
- **Schutz**: „reizarm-gestalten“ setzt `schlafSchutz` (Wirkkurve, etwa 4 Stunden, in `OPTIONALE_WIRKGROESSEN`); senkt die Störung um 70 %.
- **Anzeige `schlaf`**: „schläft“ / „wach“ / „wach, unruhig“ (Platzhalter `{schlaf}`).

## Grundsystem G8: Labor aus dem Modell
Datei `physiologie/labor.ts` (Werte) und `labor-auftrag.ts` (Abnahme, Laufzeit, Akte). Parameter, Einheiten, Referenzen, Laufzeiten und Bewertung kommen aus dem Labor-Modell der Diagnostik-Seite (`src/ui/sim/labor`), beide rechnen gleich.
- **Bestände mit Verzögerung** (Grundgrößen, optional): `entzuendung`, `crp` (steigt mit ≈ 12 h, fällt mit 24 h), `leuko` (3 h), `pct` (Sepsis), `krea`/`harnstoff` (Niere aus Stundenurin je kg, G2; Harnstoff zusätzlich bei Exsikkose), `hbMasse` (sinkt bei Blutung). Startwert = Zielwert, weil die Krankheit vor Fallbeginn besteht.
- **Entzündungsquellen**: Treiber `sepsis_verlauf`, `pneumonie`, Grundgrößen `aspirationsPneumonie` (G6) und `wundInfekt` (G9).
- **Hb ist ein später Wert**: Hb = Ausgangs-Hb × `hbMasse` / Volumen. Bei akuter Blutung bleibt es zunächst, es fällt erst mit Auffüllung; Exsikkose konzentriert.
- **Natrium** steigt bei Exsikkose, **Kalium** aus G2 plus Anstieg bei Nierenversagen, **Gerinnung grob**: Sepsis (Verbrauch) und Massivblutung (Verdünnung) senken Thrombozyten, verlängern INR/aPTT. eGFR nur bei Erwachsenen.
- **Anzeige** (Platzhalter/Bedingungen): `hb`, `leuko`, `thrombo`, `crp`, `pct`, `natrium`, `kalium`, `krea`, `egfr`, `harnstoff`, `inr`, `aptt`.
- **Blutentnahme**: Maßnahme `blutentnahme-venoes` (`LABOR_ABNAHME`) friert die Werte ein (`SimZustand.laborProben`). Ergebnisse je Parameter erst nach Sofort-Transport (15 min) plus Notfall-Laufzeit. `laborBefunde(z, uhr)` liefert Akte-Zeilen (neueste zuerst), ausstehende Proben und `kritisch`; die Akte zeigt sie unter Befunde vor den festen Laborwerten des Falls.
- Fall braucht dafür nur `blutentnahme-venoes` in `massnahmen`.

## Grundsystem: Alkoholentzug
Datei `physiologie/entzug.ts`. Treiber `{ art: 'alkoholentzug', schwere: 0..1, letzterKonsumVorStd }`; die Stunden seit dem letzten Konsum laufen mit der Spielzeit (`entzugStd`).
- **Verlauf ohne Behandlung**: vegetativ ab etwa 6 h, Gipfel 24–72 h, Abklingen bis etwa 5 Tage. Tremor, Schwitzen (Flüssigkeitsverlust), Tachykardie, Hypertonie, Unruhe und Angst, Übelkeit, leichtes Fieber.
- **Halluzinationen** ab 12 h bei ausgeprägtem Entzug. **Krampfanfall** im Fenster 12–48 h: Die Krampfbereitschaft `entzugKrampf` wächst, solange der wirksame Entzug über 0,55 liegt, bei 1 ein Anfall (nur einmal; Midazolam/Diazepam beenden ihn). **Delirium tremens** ab 48 h bei `schwere ≥ 0,6` und unbehandelt (Delir-Last).
- **Benzodiazepine** (G1-Kanal `entzugsschutz`: Lorazepam 0,6, Diazepam 0,7, Midazolam 0,5) dämpfen den wirksamen Entzug, solange sie wirken; der zugrunde liegende Entzug läuft weiter (symptomgesteuerte Gabe). Flumazenil hebt den Schutz auf.
- **Thiamin** (G1, `thiamin-geben`): Ohne Thiamin baut sich langsam eine Wernicke-Verwirrtheit auf (`wernicke`, senkt die Orientierung), mit Thiamin nicht.
- **Anzeige**: `tremor` (kein/leicht/deutlich/grob), `schwitzen`, `halluzinationen`, `entzugStd`; **G4** `ciwa` (CIWA-Ar 0–67, `ciwaAr(g)` mit den 10 Bereichen; unter 10 leicht, 10–15 mittel, über 15 schwer). Katalog: `entzug-einschaetzen`, `lorazepam-geben`, `diazepam-geben`, `thiamin-geben`.

## Fallwelle P17b (CE 04/CE 07, Runde 3)
- `amb-herzschwaeche` (CE 04, migriert aus dem Altfall „herzschwaeche“): Gewicht/Protokoll, Dosett (Torasemid ausgelassen), Rückfrage „Gewicht und Sättigung?“, fehlerhafte Anordnung Kompression bei Dekompensation (Ersatz: weglassen), Rückauftrag SpO₂/AF per Messenger, Tochter mit Einwilligung, Patientenwille (Krankenhaus abgelehnt) als Entscheidung, Schulung Gewichtstagebuch. Torasemid über G1.
- `amb-hypoglykaemie` (CE 04): BZ vor Insulin, Traubenzucker (30 g schnell), Gabe zurückstellen, fehlerhafte Anordnung „volle 14 IE“ (Ersatz: zurückstellen), Rückauftrag Nachmessen → 8 IE nach dem Essen, Lipohypertrophie, Schulung Klient und Ehefrau. Treiber `hypoglykaemie` endet mit der Mahlzeit.
- `lz-schlaganfall-reha` (CE 07, Kurzzeitpflege): Schluckprüfung, Kost nach Logopädie, Positionieren bei Hemiparese, Anleiten statt Anreichen, Ehefrau anleiten, Therapieteam, fehlerhafte Anordnung „alle Tabletten mörsern“ (Pantoprazol), Entscheidung dünner Kaffee → Aspiration. G5 `neuroDefizit`/`neuroSeite` gesetzt, daraus über G6 eine leichte Dysphagie.
- Tests `faelle/p17b.test.ts`, Browserprüfung Block P17B in `check-arbeitsplatz.mjs`. Ein Messenger-Kontakt zählt im Bericht als „Ärztin informiert“ (`arbeitsplatz/weitergabe.ts`).

## Stufe 1 geführt auf dem Kern (P21)
- Code: `../stufe1/ablauf.ts` (rein), `Stufe1.tsx`, Route `#/lernen/praxis?gefuehrt=<fall>` für alle Kernfälle („Geführt üben“ in der Fallauswahl).
  Alte Leitfälle (`../gefuehrt`) laufen für Altfälle weiter, bis P10 sie entfernt.
- Kein eigener Fallinhalt: Die Schritte kommen aus `pruefwege.muster` (warten/auflegen laufen automatisch, Pflegetasche gehört
  zur Messung, aufeinanderfolgende `rueckmelden` werden ein Schritt). Je Schritt 3–4 Möglichkeiten, genau eine richtig:
  - Handlung am Patienten: Kandidaten aus `massnahmen`/`gespraech`, im Kern **probeweise ausgeführt**: erzeugt sie einen
    Pflegefehler → falsch/gefährlich (Begründung = `fehler.warum`), stoppt die PA sie (Anordnung, ärztlich, gesperrt) → Befugnis;
    sonst „später im Musterweg“ → vertretbar, sonst Ablenker (Einschätzen/Gespräch vertretbar, Eingreifen falsch). Oft gezeigte Ablenker rücken nach hinten.
  - Begründung der richtigen Wahl = spezifischste Pflichthandlung (`pflicht.warum`), sonst Standardsatz je Reiter.
    **Gute `warum`-Texte in den Pflichthandlungen machen Stufe 1 besser.**
  - Melden: Musternachricht vs. ohne Einschätzung, mit `falsch`-Baustein, mit `ablenker`-Baustein (SBAR-Arten des Falls).
  - Anordnung: zurücklesen / „Okay“ / aus dem Gedächtnis; fehlerhafte Anordnung: remonstrieren / umsetzen / ignorieren.
  - Abschluss: Verdacht (Spur B) aus `verdacht`, Pflegebedarf aus `pflegebedarf.probleme` (Vorrang = erstes Problem im Musterweg).
- Falsche Handlungen gehen an den Kern (Zeit, Verlauf, Fehler, PA-Stopp); falsche Kommunikation wird nur erklärt, nicht gesendet.
  Weiter erst nach der richtigen Wahl. Ereignisse mit Entscheidung erscheinen als Entscheidungsmoment.
- Tests `../stufe1/ablauf.test.ts` für jeden Fall: immer richtig = Musterweg im Kern (gleiche Eingaben, KB ≥ 90 %), Irrweg läuft durch und ist nachspielbar.
  Übersicht aller erzeugten Schritte zur fachlichen Prüfung: `STUFE1_DUMP=<pfad>.md npx vitest run src/features/praxis/stufe1/dump`.
- Browserprüfung: `npm run test:stufe1` (390/820/1180 px, axe).

## Grundsystem: Atemerschöpfung
Datei `physiologie/atemerschoepfung.ts`. Treiber `{ art: 'atemerschoepfung', tempo? }` (oder Startwert `erschoepfung` in den Grundgrößen); ohne beides bleibt alles wie bisher.
- **Aufbau**: `erschoepfung` 0..1 wächst, solange die Atemarbeit über 1,6 liegt, je Stunde um Rate × tempo × Überschuss (Säugling 0,6, Kleinkind 0,4, Schulkind/Hochbetagte 0,25, sonst 0,15); darunter erholt sie sich um 0,3 je Stunde (Absaugen, High-Flow, Ruhe).
- **Folgen ab 0,4**: Atemantrieb fällt (bis auf 20 %), die sichtbare Atemarbeit nimmt ab: Das Kind wird „ruhiger“ und atmet langsamer, CO₂ steigt, SpO₂ fällt, dann präfinale Bradykardie über die Hypoxie. Ab 0,6 bei Säuglingen und Kleinkindern Apnoen.
- **Anzeige**: `atemerschoepfung` (keine / droht / dekompensiert), `apnoen`. Ersetzt den Notbehelf `opioid_ueberhang` in Bronchiolitis-Fällen.

## Grundsystem G9: Wunde
Datei `physiologie/wunde.ts`. Nur aktiv mit Treiber `wunde` oder `wundblutung`.
- **Treiber** `{ art: 'wunde', ort, tagPostOp?, infektTempo? }` und `{ art: 'wundblutung', mlProMin }` (Nachblutung). Grundgrößen `wundTag`, `wundInfekt` (Startwert erlaubt), `verbandBlutMl`, `wundBlutungMlMin` (wirksam), `blutstillung`.
- **Phase** aus dem Tag nach der OP: exsudativ bis Tag 3, proliferativ bis Tag 14, danach reparativ; ein Infekt (> 0,3) hält die Wunde exsudativ.
- **Infekt**: `wundInfekt` wächst um `infektTempo` je Stunde. Zeichen Rötung, Überwärmung, Schwellung, Schmerz, Eiter (`wundInfektZeichen` 0–5), Fieber (Altersprofil), Wundschmerz, Entzündungslabor über G8 (CRP, Leukos).
- **Nachblutung**: Blut geht aus dem Kreislauf (Volumen, G8 Hb-Masse: Hb fällt erst später) und in den Verband. `blutung-stillen` (Druckverband, Wirkkurve `blutstillung`) senkt sie um 80 %, eine chirurgische Blutung braucht trotzdem die Ärztin. `verband-unkompliziert`/`verband-kompliziert` setzen den Verband zurück (Wirkkurve `verbandBlutMl` Faktor 0); Blut im Verband vorher dokumentieren.
- **Anzeige**: `wundPhase`, `wundsekret` (keins/serös/blutig/eitrig), `wundInfektZeichen`, `verband` (trocken / leicht durchgeblutet < 15 ml / durchgeblutet < 60 ml / durchnässt), `verbandBlutMl`.
- P16a (Nachblutung): `{ art: 'wundblutung', mlProMin: 1–3 }` ab einem Ereignis; Bedingung z. B. `{ wert: 'verbandBlutMl', vergleich: '>', grenze: 30 }`.
