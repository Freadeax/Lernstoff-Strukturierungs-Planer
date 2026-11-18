# Praxissimulator neu – Kern (Paket P0)

Reiner, deterministischer Simulationskern für beide Spuren (A Pflege/Generalistik, B Akut/Notfall/Intensiv).
Noch nicht in der Oberfläche eingebunden; die alte Engine (`../engine.ts`) und Stufe 1 (`../gefuehrt`) laufen unverändert.

| Datei | Inhalt |
|---|---|
| `typen.ts` | Datenvertrag: Fallschema v2, Maßnahmen mit Befugnis je Rolle, Bedingungen, Event-Log |
| `bedingung.ts` | `pruefe(bedingung, kontext)` |
| `katalog.ts` | Handlungskatalog (Startbestand; P3 baut aus und belegt Befugnisse mit BW-Lehrplan 3BFP) |
| `modell.ts` | Schnittstelle `PhysiologieModell`, `ModellKontext`, `NORMAL` |
| `physiologie/pflegemodell.ts` | Pflege-Physiologiemodell v2 (P1), Standard im Kern; `atmung()`, `kreislauf()`, `befinden()`, `lagerungsWirkung()` |
| `physiologie/organe.ts` | Herz, Lunge, Blutzucker: dieselben Modelle wie die Lernseite `#/lernen/physiologie` |
| `physiologie/altersprofile.ts` | Ruhewerte Säugling bis Hochbetagte, Alarmfarben (monitor.ts), `fruehwarnung()` (NEWS2/Kinderprofil) |
| `kern.ts` | `start`, `sende`, `vorspulen`, `replay`, `freigabe`, `verfuegbar`, `anzeige` |
| `faelle/` | Fälle im Schema v2 (Pilotstaffel) |

Regeln
- Zustand = Fall + Eingaben. `sende()` gibt immer einen neuen Zustand zurück.
- Logik-Takt 5 s Spielzeit; der Monitor interpoliert selbst (Render-Takt).
- Wartezeiten nie zusammenfassen (Takt-Grenzen ändern sonst das Ergebnis).
- Freigabe: `nur-aerztlich` → Grenze; anordnungspflichtig ohne Anordnung → braucht Anordnung; `mit-anleitung` → mit PA.
  Stufe 2: PA unterstützt bzw. warnt und führt nicht aus. Stufe 3: Knopf bleibt klickbar, `grenzueberschreitung` im Log.
- Neuer Fall: Datei in `faelle/`, in `faelle/index.ts` eintragen. `kern.test.ts` prüft Verweise, Musterweg (keine Fehler,
  alle Pflichthandlungen), Unterlassungsweg, Grenzweg und Replay automatisch.
- Konzept: Projektordner `praxissimulator-neu/KONZEPT.md`.

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
