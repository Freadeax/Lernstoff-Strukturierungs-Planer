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
| `kern.ts` | `start`, `sende`, `vorspulen`, `replay`, `freigabe`, `verfuegbar`, `anzeige` |
| `faelle/` | Fälle im Schema v2 (Pilotstaffel) |
| `spur-b/` | Spur B (P1b): `modul.ts` Hülle `spurB(basis)` mit Beatmung, Perfusoren, arterieller Messung, Rhythmus, Sedierung (RASS), Laktat, Bilanz; `perfusor.ts` Laufrate ↔ Dosis; `bga.ts` BGA aus dem Modell; `standard.ts` `SPUR_B_MODELL` (Standard im Kern); `katalog.ts` fehlende Spur-B-Maßnahmen mit Beleg; `monitor.ts` Anzeige → `MonitorWerte` |

Regeln
- Zustand = Fall + Eingaben. `sende()` gibt immer einen neuen Zustand zurück.
- Logik-Takt 5 s Spielzeit; der Monitor interpoliert selbst (Render-Takt).
- Wartezeiten nie zusammenfassen (Takt-Grenzen ändern sonst das Ergebnis).
- Freigabe: `nur-aerztlich` und `gesperrt` → Grenze (gesperrt = in diesem Drittel nicht, keine ärztliche Aufgabe); anordnungspflichtig ohne Anordnung → braucht Anordnung; `mit-anleitung` → mit PA.
  Stufe 2: PA unterstützt bzw. warnt und führt nicht aus. Stufe 3: Knopf bleibt klickbar, `grenzueberschreitung` im Log.
- Neuer Fall: Datei in `faelle/`, in `faelle/index.ts` eintragen. `kern.test.ts` prüft Verweise, Musterweg (keine Fehler,
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
