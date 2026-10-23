# Lernstoff-Planer

Modularer Lernstoff-Planer: Lernmaterial importieren, quellengetreu zusammenfassen, Prüfungen vorbereiten und den tatsächlichen Wissensstand verfolgen. Zuerst für die **generalistische Pflegeausbildung**, über Fachmodule auf andere Fachgebiete übertragbar.

## Grundprinzipien

- **Quelle vor KI:** Jede fachliche Aussage ist mit Dokument, Seite und Zitat belegt. Unbelegtes wird markiert.
- **Fachneutraler Kern:** Pflegespezifisches steckt im Fachmodul `src/modules/pflege`.
- **Lokal zuerst:** Alle Daten liegen auf dem Gerät (IndexedDB). Funktioniert offline.
- **Keine CI:** Das Repo nutzt bewusst keine GitHub Actions. Tests laufen lokal mit `npm test`.

## Auf dem Rechner starten

Voraussetzung: [Node.js 22](https://nodejs.org) und Git.

```bash
git clone https://github.com/Freadeax/Lernstoff-Strukturierungs-Planer.git
cd Lernstoff-Strukturierungs-Planer
npm install
npm run dev
```

Dann im Browser `http://localhost:5173` öffnen.

## Auf dem iPhone nutzen

1. Rechner und iPhone im selben WLAN. `npm run dev` zeigt eine Netzwerk-Adresse (z. B. `http://192.168.0.12:5173`).
2. Diese Adresse in Safari auf dem iPhone öffnen.
3. Teilen-Symbol → **Zum Home-Bildschirm**.

Für dauerhafte Offline-Nutzung ohne laufenden Rechner muss die App über HTTPS erreichbar sein (z. B. GitHub Pages oder Netlify). Siehe `docs/ARCHITEKTUR.md`.

## Oberfläche

Modulare Oberfläche mit Seitenleiste (Handy: untere Leiste), Suche (Strg/Cmd+K) und Modulen für Lernfortschritt, Aktivität, Themen-Tabelle, Lernstand-Board und Import-Assistent. Aufbau, Zustände und Design-Tokens: `docs/UI-DESIGNSYSTEM.md`, live unter **System → Designsystem**.

## Erste Schritte in der App

1. **Einstellungen:** Claude-API-Schlüssel eintragen (von [console.anthropic.com](https://console.anthropic.com) → API Keys). Er bleibt nur auf dem Gerät.
2. **Material → Import-Assistent** (oder **Dokumente**): Fach wählen, Dateien hochladen (PDF, Word, PowerPoint, Foto). Scans und Fotos werden auf dem Gerät per Texterkennung gelesen, Handschrift auf Wunsch über Claude.
3. **Zusammenfassen:** Dokumente auswählen, Länge wählen. Jede Aussage wird gegen den Originaltext geprüft: rot = ohne Beleg, gelb = weicht ab. Antippen zeigt die Originalstelle mit Seite.

## Neue Version veröffentlichen (ohne GitHub Actions)

Die App liegt fertig gebaut auf dem Branch `gh-pages`, GitHub Pages zeigt sie unter https://freadeax.github.io/Lernstoff-Strukturierungs-Planer/. Nach Änderungen auf `main`: `npm run build`, dann den Inhalt von `dist/` (plus eine leere `.nojekyll`) auf `gh-pages` pushen.

## Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver (auch im WLAN erreichbar) |
| `npm run build` | Produktionsbuild nach `dist/` |
| `npm run preview` | Build lokal ansehen |
| `npm test` | Tests ausführen |

## Projektstruktur

```
src/
  core/         fachneutraler Kern: Datenmodell (types.ts), lokale Datenbank (db.ts)
  modules/      Fachmodule; pflege/ = generalistische Pflegeausbildung
  features/     Oberfläche und Funktionsbereiche
    dokumente/      Import mit OCR und Seitenzuordnung
    zusammenfasser/ Arbeitsmodi mit Quellenbelegen
    qualitaet/      Quellen-, Begriffs- und Zahlenprüfung
    lernplan/       Stoffverteilung, Wiederholungen, Prognose
docs/           Architektur und Entwicklungsphasen
```

## Entwicklungsphasen

1. Grundsystem: Import, Fächer/Themen, quellengetreue Zusammenfassungen, Qualitätskontrolle
2. Lernorganisation: Prüfungskalender, Lernpläne, Fortschritt, Wiederholungen
3. Aktives Lernen: Karteikarten, Quiz, Prüfungssimulation
4. Erweiterungen: Quellenvergleich, Statistik, Sprache, Synchronisierung
5. Tests und Qualitätssicherung

## Lizenz

MIT, siehe `LICENSE`.
