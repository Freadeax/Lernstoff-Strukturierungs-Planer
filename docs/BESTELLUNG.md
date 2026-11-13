# Bestellliste für die nächste Materiallieferung

Automatisch erzeugt aus `src/features/assetstatus/bestellung.ts` (Mängel, Beispielfotos, Zustandslücken, Porträts).
Neu erzeugen mit `npm run assets:status`. Lieferregeln, Dateinamen und `ASSET_KATALOG.json`: `docs/MATERIAL-BEDARF.md`, Abschnitt 0.
Dateiname = Positions-ID (`<id>.webp` bzw. `.png`), Fälle in `faelle` wie angegeben. Nach dem Einbau wird die Position
automatisch aus dieser Liste verschwinden.

**39 Positionen:** 22 × P1 (heute sichtbar falsch oder Ersatzbild), 13 × P2, 4 × P3 (Vorrat).

| Prio | ID | Was | Fälle |
| --- | --- | --- | --- |
| P1 | `12_station_kardiologie_monitoring_sensor_an` | Kardiologie · Monitoring am Bett: Sensor angelegt | praxis:nachtwache, praxis:lungenembolie, fall:demo-atemnot, fall:herzinsuffizienz (+3) |
| P1 | `27_station_zweibett_nacht_ohne_monitor` | Zweibettzimmer · Nacht: Gerät aus: ohne Monitor | praxis:delir, fall:delir-nacht, diagnostik:akutes-nierenversagen |
| P1 | `27_station_zweibett_nacht_sensor_an` | Zweibettzimmer · Nacht: Sensor angelegt | praxis:delir, fall:delir-nacht, diagnostik:akutes-nierenversagen |
| P1 | `12_station_kardiologie_monitoring_sensor_ab` | Kardiologie · Monitoring am Bett: Sensor abgefallen | diagnostik:sepsis-pneumonie, diagnostik:hyperkaliaemie |
| P1 | `16_notaufnahme_triage_ohne_monitor` | Triage · Ersteinschätzung: Gerät aus: ohne Monitor | praxis:zna, diagnostik:ketoazidose |
| P1 | `16_notaufnahme_triage_sensor_an` | Triage · Ersteinschätzung: Sensor angelegt | praxis:zna, diagnostik:ketoazidose |
| P1 | `10_pflegeheim_nacht_fall_palliativ` | Passendes Foto für Fall palliativ | fall:palliativ |
| P1 | `10_pflegeheim_nacht_fall_sturz-nacht` | Passendes Foto für Fall sturz-nacht | fall:sturz-nacht |
| P1 | `13_station_postop_fall_hueft-tep` | Passendes Foto für Fall hueft-tep | fall:hueft-tep |
| P1 | `13_station_postop_fall_schlaganfall` | Passendes Foto für Fall schlaganfall | fall:schlaganfall |
| P1 | `16_notaufnahme_triage_sensor_ab` | Triage · Ersteinschätzung: Sensor abgefallen | diagnostik:ketoazidose |
| P1 | `17_notaufnahme_untersuchung_ohne_monitor` | Behandlungsplatz · Untersuchung: Gerät aus: ohne Monitor | diagnostik:pneumothorax |
| P1 | `17_notaufnahme_untersuchung_sensor_ab` | Behandlungsplatz · Untersuchung: Sensor abgefallen | diagnostik:pneumothorax |
| P1 | `17_notaufnahme_untersuchung_sensor_an` | Behandlungsplatz · Untersuchung: Sensor angelegt | diagnostik:pneumothorax |
| P1 | `18_notaufnahme_schockraum_nacht_ohne_monitor` | Schockraum · Ankunft bei Nacht: Gerät aus: ohne Monitor | diagnostik:herzinsuffizienz |
| P1 | `18_notaufnahme_schockraum_nacht_sensor_ab` | Schockraum · Ankunft bei Nacht: Sensor abgefallen | diagnostik:herzinsuffizienz |
| P1 | `18_notaufnahme_schockraum_nacht_sensor_an` | Schockraum · Ankunft bei Nacht: Sensor angelegt | diagnostik:herzinsuffizienz |
| P1 | `20_paediatrie_kleinkind_sensor_ab` | Kinderstation · Kleinkind mit Mutter: Sensor abgefallen | diagnostik:gastroenteritis-kind |
| P1 | `20n_paediatrie_kleinkind_nacht_fall_bronchiolitis` | Passendes Foto für Praxisfall bronchiolitis | praxis:bronchiolitis |
| P1 | `21_paediatrie_schulkind_fall_rausch` | Passendes Foto für Praxisfall rausch | praxis:rausch |
| P1 | `21_paediatrie_schulkind_sensor_ab` | Kinderstation · Schulkind mit Atemnot: Sensor abgefallen | diagnostik:asthma-kind |
| P1 | `27_station_zweibett_nacht_sensor_ab` | Zweibettzimmer · Nacht: Sensor abgefallen | diagnostik:akutes-nierenversagen |
| P2 | `30b_station_zimmer_frau_sepsis_ohne_monitor` | Innere Medizin · ältere Patientin, verwirrt: Gerät aus: ohne Monitor | praxis:sepsis, fall:demo-sepsis, fall:sepsis |
| P2 | `30b_station_zimmer_frau_sepsis_sensor_an` | Innere Medizin · ältere Patientin, verwirrt: Sensor angelegt | praxis:sepsis, fall:demo-sepsis, fall:sepsis |
| P2 | `praxis-asthma_angestrengt` | Porträt Ben, angestrengt | praxis:asthma, fall:asthma-kind, fall:demo-asthma |
| P2 | `praxis-asthma_kritisch` | Porträt Ben, kritisch | praxis:asthma, fall:asthma-kind, fall:demo-asthma |
| P2 | `20f_paediatrie_kleinkind_fieberkrampf_ohne_monitor` | Kinderstation · Kleinkind nach Fieberkrampf: Gerät aus: ohne Monitor | fall:demo-fieberkrampf, fall:fieberkrampf |
| P2 | `20f_paediatrie_kleinkind_fieberkrampf_sensor_an` | Kinderstation · Kleinkind nach Fieberkrampf: Sensor angelegt | fall:demo-fieberkrampf, fall:fieberkrampf |
| P2 | `20n_paediatrie_kleinkind_nacht_ohne_monitor` | Kinderstation · Nacht: Gerät aus: ohne Monitor | praxis:bronchiolitis, fall:demo-bronchiolitis |
| P2 | `20n_paediatrie_kleinkind_nacht_sensor_an` | Kinderstation · Nacht: Sensor angelegt | praxis:bronchiolitis, fall:demo-bronchiolitis |
| P2 | `09_ambulant_kueche_diabetes_nacht` | Küche · Diabetesfall: Nacht | praxis:herzschwaeche |
| P2 | `12_station_kardiologie_monitoring_nacht` | Kardiologie · Monitoring am Bett: Nacht | praxis:nachtwache |
| P2 | `21_paediatrie_schulkind_nacht` | Kinderstation · Schulkind mit Atemnot: Nacht | praxis:rausch |
| P2 | `praxis-kind_angestrengt` | Porträt Mila, angestrengt | praxis:kind |
| P2 | `praxis-kind_kritisch` | Porträt Mila, kritisch | praxis:kind |
| P3 | `20f_paediatrie_kleinkind_fieberkrampf_sensor_ab` | Kinderstation · Kleinkind nach Fieberkrampf: Sensor abgefallen | – |
| P3 | `20n_paediatrie_kleinkind_nacht_sensor_ab` | Kinderstation · Nacht: Sensor abgefallen | – |
| P3 | `30_station_zimmer_frau_sensor_ab` | Innere Medizin · Patientin mit Infusion: Sensor abgefallen | – |
| P3 | `30b_station_zimmer_frau_sepsis_sensor_ab` | Innere Medizin · ältere Patientin, verwirrt: Sensor abgefallen | – |

## Prompts je Position

### P1 · `12_station_kardiologie_monitoring_sensor_an`

Zustandsregel „Sensor angelegt“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/12_station_kardiologie_monitoring.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Die Überwachung ist angelegt: Pulsoxymeter-Clip am Zeigefinger (beim Kleinkind Sensor am Fuß), Blutdruckmanschette am Oberarm, EKG-Kabel unter der Kleidung zum Brustkorb. Alle Kabel laufen ordentlich zum Monitor. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `27_station_zweibett_nacht_ohne_monitor`

Zustandsregel „Gerät aus: ohne Monitor“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/27_station_zweibett_nacht.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Monitorwagen mit dem Patientenmonitor ist entfernt, am Patienten sind keine Kabel und keine Sensoren. Der Platz des Wagens bleibt frei. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `27_station_zweibett_nacht_sensor_an`

Zustandsregel „Sensor angelegt“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/27_station_zweibett_nacht.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Die Überwachung ist angelegt: Pulsoxymeter-Clip am Zeigefinger (beim Kleinkind Sensor am Fuß), Blutdruckmanschette am Oberarm, EKG-Kabel unter der Kleidung zum Brustkorb. Alle Kabel laufen ordentlich zum Monitor. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `12_station_kardiologie_monitoring_sensor_ab`

Zustandsregel „Sensor abgefallen“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/12_station_kardiologie_monitoring.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Pulsoxymeter-Clip (beim Kleinkind der Fußsensor) ist abgerutscht und liegt neben Hand oder Fuß auf der Bettdecke, das Kabel hängt lose. Alles andere wie im Ausgangsbild, auch die übrigen Kabel. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `16_notaufnahme_triage_ohne_monitor`

Zustandsregel „Gerät aus: ohne Monitor“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/16_notaufnahme_triage.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Monitorwagen mit dem Patientenmonitor ist entfernt, am Patienten sind keine Kabel und keine Sensoren. Der Platz des Wagens bleibt frei. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `16_notaufnahme_triage_sensor_an`

Zustandsregel „Sensor angelegt“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/16_notaufnahme_triage.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Die Überwachung ist angelegt: Pulsoxymeter-Clip am Zeigefinger (beim Kleinkind Sensor am Fuß), Blutdruckmanschette am Oberarm, EKG-Kabel unter der Kleidung zum Brustkorb. Alle Kabel laufen ordentlich zum Monitor. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `10_pflegeheim_nacht_fall_palliativ`

Das Foto zeigt eine andere Person als im Fall (Frau H., 92 Jahre).

```text
Referenzbild public/raeume/10_pflegeheim_nacht.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, Möbel und Geräte. Die Hauptperson ersetzen durch: Frau H., 92 Jahre. Situation: Frau H., 92 Jahre, Pflegeheim, fortgeschrittene Herzinsuffizienz, Patientenverfügung liegt vor. Die Tochter ist aufgelöst. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `10_pflegeheim_nacht_fall_sturz-nacht`

Das Foto zeigt eine andere Person als im Fall (Frau D., 86 Jahre).

```text
Referenzbild public/raeume/10_pflegeheim_nacht.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, Möbel und Geräte. Die Hauptperson ersetzen durch: Frau D., 86 Jahre. Situation: Frau D., 86 Jahre, Pflegeheim, Vorhofflimmern mit Blutverdünner. Bei der Nachtrunde um 3 Uhr liegt sie neben ihrem Bett. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `13_station_postop_fall_hueft-tep`

Das Foto zeigt eine andere Person als im Fall (Frau M., 84 Jahre).

```text
Referenzbild public/raeume/13_station_postop.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, Möbel und Geräte. Die Hauptperson ersetzen durch: Frau M., 84 Jahre. Situation: Frau M., 84 Jahre, Unfallchirurgie, gestern Hüft-TEP rechts nach Sturz. Sie wirkt heute Morgen anders als gestern. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `13_station_postop_fall_schlaganfall`

Das Foto zeigt eine andere Person als im Fall (Frau R., 67 Jahre).

```text
Referenzbild public/raeume/13_station_postop.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, Möbel und Geräte. Die Hauptperson ersetzen durch: Frau R., 67 Jahre. Situation: Frau R., 67 Jahre, orthopädische Station, Knie-OP vor 2 Tagen. Beim Frühstück fällt dir ihre verwaschene Sprache auf. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `16_notaufnahme_triage_sensor_ab`

Zustandsregel „Sensor abgefallen“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/16_notaufnahme_triage.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Pulsoxymeter-Clip (beim Kleinkind der Fußsensor) ist abgerutscht und liegt neben Hand oder Fuß auf der Bettdecke, das Kabel hängt lose. Alles andere wie im Ausgangsbild, auch die übrigen Kabel. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `17_notaufnahme_untersuchung_ohne_monitor`

Zustandsregel „Gerät aus: ohne Monitor“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/17_notaufnahme_untersuchung.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Monitorwagen mit dem Patientenmonitor ist entfernt, am Patienten sind keine Kabel und keine Sensoren. Der Platz des Wagens bleibt frei. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `17_notaufnahme_untersuchung_sensor_ab`

Zustandsregel „Sensor abgefallen“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/17_notaufnahme_untersuchung.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Pulsoxymeter-Clip (beim Kleinkind der Fußsensor) ist abgerutscht und liegt neben Hand oder Fuß auf der Bettdecke, das Kabel hängt lose. Alles andere wie im Ausgangsbild, auch die übrigen Kabel. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `17_notaufnahme_untersuchung_sensor_an`

Zustandsregel „Sensor angelegt“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/17_notaufnahme_untersuchung.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Die Überwachung ist angelegt: Pulsoxymeter-Clip am Zeigefinger (beim Kleinkind Sensor am Fuß), Blutdruckmanschette am Oberarm, EKG-Kabel unter der Kleidung zum Brustkorb. Alle Kabel laufen ordentlich zum Monitor. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `18_notaufnahme_schockraum_nacht_ohne_monitor`

Zustandsregel „Gerät aus: ohne Monitor“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/18_notaufnahme_schockraum_nacht.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Monitorwagen mit dem Patientenmonitor ist entfernt, am Patienten sind keine Kabel und keine Sensoren. Der Platz des Wagens bleibt frei. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `18_notaufnahme_schockraum_nacht_sensor_ab`

Zustandsregel „Sensor abgefallen“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/18_notaufnahme_schockraum_nacht.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Pulsoxymeter-Clip (beim Kleinkind der Fußsensor) ist abgerutscht und liegt neben Hand oder Fuß auf der Bettdecke, das Kabel hängt lose. Alles andere wie im Ausgangsbild, auch die übrigen Kabel. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `18_notaufnahme_schockraum_nacht_sensor_an`

Zustandsregel „Sensor angelegt“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/18_notaufnahme_schockraum_nacht.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Die Überwachung ist angelegt: Pulsoxymeter-Clip am Zeigefinger (beim Kleinkind Sensor am Fuß), Blutdruckmanschette am Oberarm, EKG-Kabel unter der Kleidung zum Brustkorb. Alle Kabel laufen ordentlich zum Monitor. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `20_paediatrie_kleinkind_sensor_ab`

Zustandsregel „Sensor abgefallen“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/20_paediatrie_kleinkind.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Pulsoxymeter-Clip (beim Kleinkind der Fußsensor) ist abgerutscht und liegt neben Hand oder Fuß auf der Bettdecke, das Kabel hängt lose. Alles andere wie im Ausgangsbild, auch die übrigen Kabel. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `20n_paediatrie_kleinkind_nacht_fall_bronchiolitis`

Beispielfoto: Das Bild zeigt ein Kleinkind. Im Fall liegt Mila, ein Säugling von 4 Monaten.

```text
Referenzbild public/raeume/20n_paediatrie_kleinkind_nacht.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, Möbel und Geräte. Die Person im Bett so ändern, dass sie zum Fall passt: Das Bild zeigt ein Kleinkind. Im Fall liegt Mila, ein Säugling von 4 Monaten. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `21_paediatrie_schulkind_fall_rausch`

Beispielfoto: Das Bild zeigt ein jüngeres Kind mit Mutter. Im Fall liegt Lea, 15 Jahre.

```text
Referenzbild public/raeume/21_paediatrie_schulkind.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, Möbel und Geräte. Die Person im Bett so ändern, dass sie zum Fall passt: Das Bild zeigt ein jüngeres Kind mit Mutter. Im Fall liegt Lea, 15 Jahre. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `21_paediatrie_schulkind_sensor_ab`

Zustandsregel „Sensor abgefallen“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/21_paediatrie_schulkind.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Pulsoxymeter-Clip (beim Kleinkind der Fußsensor) ist abgerutscht und liegt neben Hand oder Fuß auf der Bettdecke, das Kabel hängt lose. Alles andere wie im Ausgangsbild, auch die übrigen Kabel. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P1 · `27_station_zweibett_nacht_sensor_ab`

Zustandsregel „Sensor abgefallen“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/27_station_zweibett_nacht.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Pulsoxymeter-Clip (beim Kleinkind der Fußsensor) ist abgerutscht und liegt neben Hand oder Fuß auf der Bettdecke, das Kabel hängt lose. Alles andere wie im Ausgangsbild, auch die übrigen Kabel. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `30b_station_zimmer_frau_sepsis_ohne_monitor`

Zustandsregel „Gerät aus: ohne Monitor“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/30b_station_zimmer_frau_sepsis.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Monitorwagen mit dem Patientenmonitor ist entfernt, am Patienten sind keine Kabel und keine Sensoren. Der Platz des Wagens bleibt frei. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `30b_station_zimmer_frau_sepsis_sensor_an`

Zustandsregel „Sensor angelegt“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/30b_station_zimmer_frau_sepsis.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Die Überwachung ist angelegt: Pulsoxymeter-Clip am Zeigefinger (beim Kleinkind Sensor am Fuß), Blutdruckmanschette am Oberarm, EKG-Kabel unter der Kleidung zum Brustkorb. Alle Kabel laufen ordentlich zum Monitor. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `praxis-asthma_angestrengt`

Der Fallsimulator zeigt bei Verschlechterung sonst das stabile Porträt.

```text
Referenzbild public/personen/praxis-asthma_stabil.webp anhängen. Dieselbe Person (Ben, ein Schulkind mit dunkelbraunem, gewelltem Haar und hellblauem Oberteil.), gleicher Ausschnitt, gleicher Hintergrund, quadratisch, mindestens 512 × 512 px. Zustand angestrengt: schnellere Atmung, leicht geöffneter Mund, besorgter Blick, Haut etwas blasser. Keine Schrift, keine reale Person.
```

### P2 · `praxis-asthma_kritisch`

Der Fallsimulator zeigt bei Verschlechterung sonst das stabile Porträt.

```text
Referenzbild public/personen/praxis-asthma_stabil.webp anhängen. Dieselbe Person (Ben, ein Schulkind mit dunkelbraunem, gewelltem Haar und hellblauem Oberteil.), gleicher Ausschnitt, gleicher Hintergrund, quadratisch, mindestens 512 × 512 px. Zustand kritisch krank: deutlich blass bis grau, erschöpft, Lippen leicht bläulich, Sauerstoffbrille. Nicht dramatisiert. Keine Schrift, keine reale Person.
```

### P2 · `20f_paediatrie_kleinkind_fieberkrampf_ohne_monitor`

Zustandsregel „Gerät aus: ohne Monitor“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/20f_paediatrie_kleinkind_fieberkrampf.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Monitorwagen mit dem Patientenmonitor ist entfernt, am Patienten sind keine Kabel und keine Sensoren. Der Platz des Wagens bleibt frei. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `20f_paediatrie_kleinkind_fieberkrampf_sensor_an`

Zustandsregel „Sensor angelegt“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/20f_paediatrie_kleinkind_fieberkrampf.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Die Überwachung ist angelegt: Pulsoxymeter-Clip am Zeigefinger (beim Kleinkind Sensor am Fuß), Blutdruckmanschette am Oberarm, EKG-Kabel unter der Kleidung zum Brustkorb. Alle Kabel laufen ordentlich zum Monitor. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `20n_paediatrie_kleinkind_nacht_ohne_monitor`

Zustandsregel „Gerät aus: ohne Monitor“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/20n_paediatrie_kleinkind_nacht.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Der Monitorwagen mit dem Patientenmonitor ist entfernt, am Patienten sind keine Kabel und keine Sensoren. Der Platz des Wagens bleibt frei. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `20n_paediatrie_kleinkind_nacht_sensor_an`

Zustandsregel „Sensor angelegt“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/20n_paediatrie_kleinkind_nacht.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Die Überwachung ist angelegt: Pulsoxymeter-Clip am Zeigefinger (beim Kleinkind Sensor am Fuß), Blutdruckmanschette am Oberarm, EKG-Kabel unter der Kleidung zum Brustkorb. Alle Kabel laufen ordentlich zum Monitor. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `09_ambulant_kueche_diabetes_nacht`

Zustandsregel „Nacht“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/09_ambulant_kueche_diabetes.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Nachtsituation: Deckenlicht aus, nur gedämpftes Nachtlicht, Fenster dunkel. Die Person schläft oder ruht. Ein vorhandener Monitor leuchtet. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `12_station_kardiologie_monitoring_nacht`

Zustandsregel „Nacht“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/12_station_kardiologie_monitoring.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Nachtsituation: Deckenlicht aus, nur gedämpftes Nachtlicht, Fenster dunkel. Die Person schläft oder ruht. Ein vorhandener Monitor leuchtet. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `21_paediatrie_schulkind_nacht`

Zustandsregel „Nacht“ fällt heute auf ein Ersatzbild zurück.

```text
Referenzbild public/raeume/21_paediatrie_schulkind.webp anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte. Einzige Änderung: Nachtsituation: Deckenlicht aus, nur gedämpftes Nachtlicht, Fenster dunkel. Die Person schläft oder ruht. Ein vorhandener Monitor leuchtet. Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.
```

### P2 · `praxis-kind_angestrengt`

Der Fallsimulator zeigt bei Verschlechterung sonst das stabile Porträt.

```text
Referenzbild public/personen/praxis-kind_stabil.webp anhängen. Dieselbe Person (Mila, ein Kleinkind mit braunem Bob und türkisfarbenem Schlafoberteil.), gleicher Ausschnitt, gleicher Hintergrund, quadratisch, mindestens 512 × 512 px. Zustand angestrengt: schnellere Atmung, leicht geöffneter Mund, besorgter Blick, Haut etwas blasser. Keine Schrift, keine reale Person.
```

### P2 · `praxis-kind_kritisch`

Der Fallsimulator zeigt bei Verschlechterung sonst das stabile Porträt.

```text
Referenzbild public/personen/praxis-kind_stabil.webp anhängen. Dieselbe Person (Mila, ein Kleinkind mit braunem Bob und türkisfarbenem Schlafoberteil.), gleicher Ausschnitt, gleicher Hintergrund, quadratisch, mindestens 512 × 512 px. Zustand kritisch krank: deutlich blass bis grau, erschöpft, Lippen leicht bläulich, Sauerstoffbrille. Nicht dramatisiert. Keine Schrift, keine reale Person.
```

Prompts für P3-Positionen folgen demselben Muster (Referenzbild plus eine Änderung).
