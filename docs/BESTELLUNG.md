# Bestellliste für die nächste Materiallieferung

Automatisch erzeugt aus `src/features/assetstatus/bestellung.ts` (Mängel, Beispielfotos, Zustandslücken, Porträts).
Neu erzeugen mit `npm run assets:status`. Lieferregeln, Dateinamen und `ASSET_KATALOG.json`: `docs/MATERIAL-BEDARF.md`, Abschnitt 0.
Dateiname = Positions-ID (`<id>.webp` bzw. `.png`), Fälle in `faelle` wie angegeben. Nach dem Einbau wird die Position
automatisch aus dieser Liste verschwinden.

**7 Positionen:** 0 × P1 (heute sichtbar falsch oder Ersatzbild), 5 × P2, 2 × P3 (Vorrat).

| Prio | ID | Was | Fälle |
| --- | --- | --- | --- |
| P2 | `20n_paediatrie_kleinkind_nacht_fall_bronchiolitis_ohne_monitor` | Kinderstation · Nacht · Säugling: Gerät aus: ohne Monitor | praxis:bronchiolitis |
| P2 | `20n_paediatrie_kleinkind_nacht_fall_bronchiolitis_sensor_an` | Kinderstation · Nacht · Säugling: Sensor angelegt | praxis:bronchiolitis |
| P2 | `21_paediatrie_schulkind_fall_rausch_nacht` | Kinderstation · Jugendliche: Nacht | praxis:rausch |
| P2 | `21_paediatrie_schulkind_fall_rausch_ohne_monitor` | Kinderstation · Jugendliche: Gerät aus: ohne Monitor | praxis:rausch |
| P2 | `21_paediatrie_schulkind_fall_rausch_sensor_an` | Kinderstation · Jugendliche: Sensor angelegt | praxis:rausch |
| P3 | `20n_paediatrie_kleinkind_nacht_fall_bronchiolitis_sensor_ab` | Kinderstation · Nacht · Säugling: Sensor abgefallen | – |
| P3 | `21_paediatrie_schulkind_fall_rausch_sensor_ab` | Kinderstation · Jugendliche: Sensor abgefallen | – |

## Prompts je Position

### P2 · `20n_paediatrie_kleinkind_nacht_fall_bronchiolitis_ohne_monitor`

Zustandsregel „Gerät aus: ohne Monitor“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/20n_paediatrie_kleinkind_nacht_fall_bronchiolitis.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Monitorwagen mit dem Patientenmonitor ist entfernt, am Patienten sind keine Kabel und keine Sensoren. Der Platz des Wagens bleibt frei. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `20n_paediatrie_kleinkind_nacht_fall_bronchiolitis_sensor_an`

Zustandsregel „Sensor angelegt“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/20n_paediatrie_kleinkind_nacht_fall_bronchiolitis.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Die Überwachung ist angelegt: Pulsoxymeter-Clip am Zeigefinger (beim Kleinkind Sensor am Fuß), Blutdruckmanschette am Oberarm, EKG-Kabel unter der Kleidung zum Brustkorb. Alle Kabel laufen ordentlich zum Monitor. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `21_paediatrie_schulkind_fall_rausch_nacht`

Zustandsregel „Nacht“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/21_paediatrie_schulkind_fall_rausch.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Nachtsituation: Deckenlicht aus, nur gedämpftes Nachtlicht, Fenster dunkel. Die Person schläft oder ruht. Ein vorhandener Monitor leuchtet. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `21_paediatrie_schulkind_fall_rausch_ohne_monitor`

Zustandsregel „Gerät aus: ohne Monitor“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/21_paediatrie_schulkind_fall_rausch.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Monitorwagen mit dem Patientenmonitor ist entfernt, am Patienten sind keine Kabel und keine Sensoren. Der Platz des Wagens bleibt frei. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `21_paediatrie_schulkind_fall_rausch_sensor_an`

Zustandsregel „Sensor angelegt“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/21_paediatrie_schulkind_fall_rausch.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Die Überwachung ist angelegt: Pulsoxymeter-Clip am Zeigefinger (beim Kleinkind Sensor am Fuß), Blutdruckmanschette am Oberarm, EKG-Kabel unter der Kleidung zum Brustkorb. Alle Kabel laufen ordentlich zum Monitor. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

Prompts für P3-Positionen folgen demselben Muster (Referenzbild plus eine Änderung).
