# Diagnostik: Labor und Bildgebung

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
  Lizenz (MedPix je Bild prüfen).
- **Privat** (Material-Repo, Ordner `bildgebung/<name>/serie.json` + Bilder): z. B. Unterrichtsmaterial. Die App lädt
  sie nur mit dem Zugang unter Material → Große Dateien auf dem Gerät, nie in den öffentlichen Build.
