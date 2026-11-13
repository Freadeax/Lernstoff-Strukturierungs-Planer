# Raumfotos für die Simulatoren

Gemeinsamer Baustein für Praxis-, Fall- und Diagnostik-Simulator: `src/ui/sim/raeume/`.

- **Bilder:** 34 Bilder (14 Szenen aus Philipps Komplettpaket v2, 20 aus den Lieferungen vom 11.11.2026; KI-generiert, ohne eingebrannte Menüs), verkleinert auf
  1280 × 720 WebP unter `public/raeume/`. Sie werden nicht vorab gecacht, sondern beim ersten Ansehen geladen
  und danach offline vorgehalten (Workbox `CacheFirst`, Cache `raeume`). Vor dem Lerneinsatz fachlich prüfen
  (Gerätedetails, Kabelführung, Anatomie).
- **Katalog** (`katalog.ts`): `RAEUME[id]` mit Titel, Bereich, Beschreibung (alt-Text), Monitorfläche
  (`monitor`, relativ 0…1), Varianten (`ohneMonitor`/`mitMonitor`, `verbunden`, `sensorAb`, `nacht`) und vorgeschlagenen Hotspots.
- **Zustandsregeln** (`raumFuerZustand(id, { monitor, nacht })`), in dieser Reihenfolge:
  1. Nacht → `nacht`-Variante desselben Ausschnitts (20 → 20n); fehlt sie, legt der Simulator einen Nachtfilter über das Tagbild.
  2. Gerät abwesend → `ohneMonitor` (12 → 12a, 20 → 20a, 21 → 21a, 30 → 30a).
  3. Gerät an/Standby → `mitMonitor` (Gegenstück).
  4. Überwachung läuft → `verbunden`, Sensor am Patienten (20m, 21m, 30m).
  5. Signalausfall → `sensorAb` (Sensor abgefallen; noch nicht geliefert), sonst wie „läuft“, der Monitor zeigt den Ausfall.
  6. Patientenzustand und Maßnahmen wählen die Simulatoren über ihre Zuordnung: Praxis `waehrend` (21 → 21b nach der
     Anordnung, 27 → 27a nach „Niedrigbett“), Fall-Räume je Szenario (26h, 26p, 30b), Porträts `stabil`/`angestrengt`/`kritisch`.
  `raumVarianten(id)` listet alle Bilder, die diese Regeln von einem Raum aus erreichen.
- **Asset-Status:** `src/features/assetstatus/inventar.ts` prüft je Datei: vorhanden, zugeordnet, im Fall erreichbar,
  fachlich geprüft (`freigaben.ts`), offline. Bericht und Lückenliste: [`ASSET-STATUS.md`](ASSET-STATUS.md),
  neu erzeugen mit `npm run assets:status`. Fachliche Bildprüfung in der App: System → Bildprüfung (`#/system/bilder`),
  Export übernehmen mit `npm run assets:freigaben -- <datei>`. Neue Lieferungen vorher mit `npm run material:pruefen -- <ordner>`.
- **Bildmängel:** Steht eine Datei in `src/ui/sim/bildfreigaben.ts` mit Status „mangel“, zeigt die Raumbühne unter dem Bild
  „Bekannter Bildmangel, Ersatz ist bestellt“. Die Bestellliste dazu: [`BESTELLUNG.md`](BESTELLUNG.md).
- **Weitere Nutzer:** Hygiene-Trainer (Suchbilder 14 und 19, `src/features/hygiene/suchbilder.ts`).
- **Bühne** (`RaumBuehne.tsx`):
  - `raum`, `hotspots` (`{id, label, kurz?, x, y, gedrueckt?, aktiv?, onClick}`, echte Buttons mit aria-label, mind. 44 px)
  - `monitor` (`{werte, zustand: 'abwesend'|'standby'|'laeuft'|'signalausfall', ausfall?, titel?}`): PatientenMonitor
    kompakt, in fester Grundgröße gezeichnet und per `transform` ins Monitorrechteck skaliert, bleibt so am Gerät.
    Signalausfall betrifft nur die genannten Kanäle (EKG → HF, SpO₂, AF).
  - `monitorInhalt`: eigener Inhalt statt des Standardmonitors (wird genauso skaliert)
  - `children`: Overlay-Ebene im selben Bezugsrahmen (Prozentwerte)
  - `fokus` (`{x, y, zoom}`): ruhiger Kamerazoom, bei „Bewegung reduzieren“ ohne Übergang; Hotspots bleiben gleich groß
  - `fallback`/`onError`: Ersatz, wenn das Bild nicht lädt
- **Vorschau:** System → Designsystem, Abschnitt „Raumbühne der Simulatoren“.

Die Animationen aus dem Paket (Insulinpen, Kompressionsstrumpf) gehören zum Praxissimulator.
