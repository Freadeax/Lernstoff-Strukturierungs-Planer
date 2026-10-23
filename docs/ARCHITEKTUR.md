# Architektur

Ausführliche Fassung mit Diagramm: https://claude.ai/artifact/HrsJYuzKtmhcm4WABznGsH

## Schichten

- **Oberfläche (PWA):** React + TypeScript + Vite, installierbar auf PC, Tablet und Smartphone.
- **Kern (fachneutral):** Import, Wissensbasis (Fächer, Themen, Dokumente, Textabschnitte mit Seite), Zusammenfasser, Qualitätskontrolle.
- **Fachmodule:** liefern Fächer, Themenbaum, Begriffe, Aufgabenformate (PESR, SMART, SIS) und Prüfregeln als Daten.
- **Speicher:** IndexedDB über Dexie, offline.
- **KI:** Claude API mit Quellenbelegen (Citations). Es werden nur die nötigen Textabschnitte gesendet.

## Datenvertrag

`src/core/types.ts` ist für alle Teilbereiche verbindlich.
- Katalog-IDs aus Fachmodulen: stabile Präfix-IDs, z. B. `thema.pflege.prophylaxe.dekubitus`.
- Vom Nutzer erzeugte Daten: UUID v4.
- Datumsangaben `YYYY-MM-DD`, Zeitpunkte ISO-8601.

## Qualitätskontrolle

1. Dokumente in Abschnitte mit Seite zerlegen.
2. KI fasst nur ausgewählte Abschnitte zusammen und belegt jede Aussage mit Zitat.
3. Code prüft: Zitat steht auf der angegebenen Seite.
4. Code prüft: Zahlen, Einheiten, Fachbegriffe stimmen mit der Quelle überein.
5. Unbelegtes, Unleserliches und Widersprüche werden sichtbar gekennzeichnet.

## Hosting fürs iPhone (später)

Eine PWA braucht HTTPS für Offline-Betrieb auf dem iPhone. Optionen ohne GitHub Actions: Netlify oder Cloudflare Pages (bauen selbst), oder `dist/` manuell auf einen `gh-pages`-Branch legen.
