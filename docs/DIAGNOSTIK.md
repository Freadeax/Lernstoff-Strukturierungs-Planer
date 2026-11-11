# Diagnostik: Labor und Bildgebung

![Ablauf eines Diagnostik-Falls: Labor anfordern, Probe und Präanalytik, Befund und Kumulativverlauf; Bildserie öffnen, Schichten, Fenster und Lupe; beides führt zu Befund einordnen](bilder/ablauf-diagnostik.png)

**Räume:** Jeder Fall hat ein Raumfoto aus dem gemeinsamen Baustein (`src/ui/sim/raeume`, siehe [RAEUME.md](RAEUME.md)). Die Hotspots führen in den passenden Reiter. Im Sepsis-Fall muss erst der Monitor angeschlossen werden (Raum 12a → 12). In zwei Fällen rutscht nach einiger Zeit der Fingersensor ab: SpO₂ fällt aus, EKG und Blutdruck laufen weiter.


Seite `#/lernen/diagnostik` (Fälle, Lernmodus „Befund lesen“, eigene Bilder) und Labor-Trainer `#/lernen/labor`.

## Bausteine (für alle Simulatoren)

| Ort | Inhalt |
| --- | --- |
| `src/ui/sim/bildgebung/phantom.ts` | Synthetische CT-Schichten (Rohwert = HU + 1024) und Röntgen-Thorax, Varianten Pneumonie, Lungenembolie (CT-Angio), Pneumothorax, Erguss, Stauung. Deterministisch, offline. |
| `src/ui/sim/bildgebung/serie.ts` | Bildserie: `phantom`, `bilder` (öffentlich, nur mit Lizenz/Urheber/Quelle) oder `material` (privates Material-Repo). Befundmarken normiert 0..1. |
| `src/ui/sim/bildgebung/BildBetrachter.tsx` | Schichten blättern (Wischen, Rad, Pfeiltasten, Regler), Fenster (Vorgaben, Wischen), Lupe mit HU-Messwert, Markieren, Vollbild, Invertieren. Bei „Bewegung reduzieren“ kein Abspielen. |
| `src/ui/sim/labor/parameter.ts` | Laborparameter mit Referenz, kritischen Grenzen, Material, Laufzeit, Pflegebedeutung. |
| `src/ui/sim/labor/praeanalytik.ts` | Röhrchen (Farben Europa/international), Abnahmereihenfolge, Fehler: Identität, Hämolyse, Stauung, Infusionsarm, EDTA-Verschleppung, Citrat unterfüllt, Liegezeit, Blutkultur nach Antibiose. |
| `src/ui/sim/labor/modell.ts` | Werte aus Verlauf (Basis, Drift pro Stunde, Grenze, Therapie-Flags mit Zielwert und Zeitkonstante), Auftrag → Ergebnis mit Transport und Laufzeit, kritische Anrufe, Kumulativbefund. |
| `src/ui/sim/labor/bga.ts` | BGA-Deutung in Schritten. |
| `src/ui/sim/labor/LaborTafel.tsx` | Kumulativbefund mit Kennzeichen und Mini-Verlauf. |

Praxis- und Fallsimulator können diese Bausteine direkt nutzen (z. B. `labResult` als echter Befund statt Text).

## Neuer Fall

Eintrag in `src/features/diagnostik/faelle.ts` (Format `typen.ts`). `faelle.test.ts` prüft: bekannte Parameter,
Therapie-Flags passen zu Anordnungen, Fragen verweisen auf vorhandene Befunde, BGA-Lösung stimmt mit der Deutung
überein, und jede Befundmarke liegt dort, wo sich das Phantom vom Normalbefund unterscheidet.

## Echte Bilder

- **Öffentlich** (`public/bildgebung/…`, Quelle `bilder`): nur frei lizenziert (CC BY, CC BY-SA, gemeinfrei) mit Urheber,
  Lizenz und Quell-URL. Keine Daten aus zugangsbeschränkten Datensätzen (MIMIC-IV/MIMIC-CXR), keine Bilder mit unklarer
  Lizenz (MedPix je Bild prüfen). CC BY-NC-SA (z. B. Radiopaedia) passt, solange die App kostenlos und
  nicht kommerziell bleibt; Änderungen (Zuschnitt, Verkleinerung) werden unter dem Bild genannt.
- **Bisher eingebunden:** zwei Röntgenbilder aus Radiopaedia (CC BY-NC-SA 3.0), bezogen über den offenen Datensatz
  [ieee8023/covid-chestxray-dataset](https://github.com/ieee8023/covid-chestxray-dataset), dessen `metadata.csv` Lizenz
  und Urheber je Bild nennt: Pneumonie rechts (Gaillard, rID 11009) und Pleuraerguss links (Knipe, rID 44224).
  Wikimedia Commons war aus der Entwicklungsumgebung nicht abrufbar (Drosselung).
- **Von Philipp geliefert (2026-11-11, Materialliste):** Spontanpneumothorax links (Hellerhoff, Wikimedia Commons,
  CC BY-SA 3.0, als JPEG gespeichert) und eine CT-Pulmonalisangiographie aus CAD-PE Fall 001 (Germán González Serrano,
  über das CADS-Dataset, CC BY 4.0): 32 axiale Schichten à 1 mm, oben und unten beschnitten. Beide Befundmarken sind
  fachlich noch ungeprüft.
- **CT als 16-Bit-PNG:** Pixelwert = HU + 1024 (wie die Rohwerte der Phantome). `dekodierePng16` in `serie.ts` liest
  solche Dateien verlustfrei (eigener PNG-Dekoder mit `DecompressionStream`), damit Fenster und HU-Messung echt sind.
  Andere CT-Bilder (8 Bit) laufen weiter über den normalen Bildpfad. `public/bildgebung/` wird nicht vorab gecacht,
  sondern beim ersten Ansehen (CacheFirst).
- Befunde im echten Bild tragen dieselbe ID wie im synthetischen Bild; ein Test prüft Lizenzfelder, Dateien und IDs.
- **Privat** (Material-Repo, Ordner `bildgebung/<name>/serie.json` + Bilder): z. B. Unterrichtsmaterial. Die App lädt
  sie nur mit dem Zugang unter Material → Große Dateien auf dem Gerät, nie in den öffentlichen Build.
