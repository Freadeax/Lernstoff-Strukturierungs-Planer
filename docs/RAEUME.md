# Raumfotos für die Simulatoren

Gemeinsamer Baustein für Praxis-, Fall- und Diagnostik-Simulator: `src/ui/sim/raeume/`.

- **Bilder:** 14 Szenen aus Philipps Komplettpaket v2 (KI-generiert, ohne eingebrannte Menüs), verkleinert auf
  1280 × 720 WebP unter `public/raeume/`. Sie werden nicht vorab gecacht, sondern beim ersten Ansehen geladen
  und danach offline vorgehalten (Workbox `CacheFirst`, Cache `raeume`). Vor dem Lerneinsatz fachlich prüfen
  (Gerätedetails, Kabelführung, Anatomie).
- **Katalog** (`katalog.ts`): `RAEUME[id]` mit Titel, Bereich, Beschreibung (alt-Text), Monitorfläche
  (`monitor`, relativ 0…1), Varianten (`ohneMonitor`/`mitMonitor`, Raum 12/12a) und vorgeschlagenen Hotspots.
  `raumFuerZustand(id, zustand)` wählt bei „Gerät abwesend“ die Variante ohne Monitor.
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
