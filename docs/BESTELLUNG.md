# Bestellliste für die nächste Materiallieferung

Automatisch erzeugt aus `src/features/assetstatus/bestellung.ts` (Mängel, Beispielfotos, Zustandslücken, Porträts).
Neu erzeugen mit `npm run assets:status`. Lieferregeln, Dateinamen und `ASSET_KATALOG.json`: `docs/MATERIAL-BEDARF.md`, Abschnitt 0.
Dateiname = Positions-ID (`<id>.webp` bzw. `.png`), Fälle in `faelle` wie angegeben. Nach dem Einbau wird die Position
automatisch aus dieser Liste verschwinden.

**0 Positionen:** 0 × P1 (heute sichtbar falsch oder Ersatzbild), 0 × P2, 0 × P3 (Vorrat).

| Prio | ID | Was | Fälle |
| --- | --- | --- | --- |

## Prompts je Position

Prompts für P3-Positionen folgen demselben Muster (Referenzbild plus eine Änderung).
