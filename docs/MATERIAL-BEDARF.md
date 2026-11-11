# Materialbedarf: Grafiken, Medien und Texte, die die App noch braucht

Stand: 11.11.2026 (Lieferungen 1 und 2 eingetragen, Website-Audit SIM-06), geprüft gegen `main` (Commit `3af8530`, nach PR #122), den Projektordner,
das **Visualpaket** und das **Pflegesimulator-Komplettpaket v2**. Diese Liste ist die Bestellliste für die
nächste Materiallieferung. Jede Position hat eine feste ID, damit Dateien eindeutig zugeordnet werden können.

**Prioritäten**

- **P1** schließt eine Lücke, die man heute in der App sieht (Fall zeigt einen unpassenden Raum, Bild fehlt ganz).
- **P2** verbessert ein vorhandenes Modul spürbar (Varianten, Nahansichten, Animationen).
- **P3** gehört zu geplanten Erweiterungen und kann später kommen.

**Spalte „Wer“**: **L** = bitte liefern (KI-Bild, Foto, Video), **F** = frei lizenziert suchen und liefern
(mit Lizenzangaben), **C** = Claude kann es selbst im Code erzeugen (SVG, synthetisch), braucht nur dein OK.

**Status je Datei:** Was schon in der App liegt, wo es erscheint, ob es fachlich geprüft und offline verfügbar ist,
steht automatisch erzeugt in [`docs/ASSET-STATUS.md`](ASSET-STATUS.md) (Test hält die Liste aktuell).

---

## 0. Lieferregeln (für alle Positionen)

### 0.1 Paketaufbau

Bitte als ZIP in derselben Art wie das Komplettpaket v2 liefern:

```
Material_Lieferung_<JJJJ-MM-TT>/
  ASSET_KATALOG.json        ← eine Zeile je Datei (Felder siehe 0.4)
  VORSCHAU.html             ← optional, wie bisher
  raeume/                   ← Raumfotos (Abschnitt 2)
  varianten/                ← Zustandsvarianten bestehender Räume (Abschnitt 3)
  nahansichten/             ← Detailbilder für Hotspots (Abschnitt 4)
  personen/                 ← Patientenporträts (Abschnitt 5)
  animationen/              ← MP4 + 4 Phasenbilder je Handlung (Abschnitt 6)
  bildgebung/               ← Röntgen, CT, Sono, EKG (Abschnitt 7)
  illustrationen/           ← Trainer-Grafiken (Abschnitt 8)
  audio/                    ← Geräusche, Töne (Abschnitt 9)
  texte/                    ← Unterrichtsmaterial, Prüfungen (Abschnitt 10)
```

Dateien über 25 MB oder das ganze ZIP gehen über **Material → Große Dateien** ins private Material-Repo,
kleinere Pakete kannst du hier im Projekt hochladen.

### 0.2 Technische Vorgaben

| Art | Format | Auflösung (Lieferung) | In der App | Weitere Vorgaben |
| --- | --- | --- | --- | --- |
| Raumfoto | WebP oder PNG | mind. 1672 × 941 (16:9), gern 1920 × 1080 | 1280 × 720 WebP | keine Texte, Menüs, Logos, Markennamen; feste Kameraposition; Hotspot-Objekte gut sichtbar und nicht angeschnitten |
| Raumvariante | wie Raumfoto | **identischer Bildausschnitt** wie das Grundbild | 1280 × 720 | nur das Geänderte darf sich unterscheiden (Person, Gerät, Licht), sonst springen die Hotspots |
| Nahansicht | WebP/PNG | mind. 1600 × 900 (16:9) oder 1200 × 1200 | 836 × 470 bzw. 600 × 600 | neutraler Hintergrund, Objekt mittig |
| Porträt | WebP/PNG | 1024 × 1024 | 256 und 512 px | Brustbild, neutraler Hintergrund, gleiche Person in allen Zuständen |
| Handlungsanimation | MP4 (H.264, ohne Ton) + 4 Phasenbilder | 1280 × 720 oder 1672 × 941, 6–15 s | MP4 + 4 × WebP 836 × 470 | wie Insulin-Pen/Kompressionsstrumpf: 4 benannte Phasen, keine eingebrannten Texte |
| Bildgebung | PNG (verlustfrei) oder JPG Qualität ≥ 90; CT als PNG-Folge oder DICOM | Röntgen mind. 1024 px lange Seite; CT 512 × 512 je Schicht | Graustufen | **Lizenz, Urheber, Quell-URL je Bild Pflicht**; anonymisiert, keine Namen/Daten im Bild |
| Illustration | SVG bevorzugt, sonst PNG transparent | Vektor bzw. 2048 px | skalierbar | beschriftbare Teile als eigene Ebenen/IDs, keine eingebrannten Beschriftungen |
| Audio | WAV oder FLAC (Lieferung), MP3/AAC 128 kbit (App) | 44,1 kHz mono | ≤ 30 s je Clip | Lizenz Pflicht; keine Musik |
| Text | PDF, DOCX, Fotos von Seiten | lesbar (mind. 300 dpi bei Scans) | privat im Material-Repo | Unterrichtsmaterial bleibt privat, kommt nie in die öffentliche App |

### 0.3 Inhaltliche Regeln

- **Keine echten Patientinnen und Patienten**, keine erkennbaren Kolleginnen, keine echten Namen auf Armbändern, Akten, Bildschirmen.
- KI-Bilder werden vor dem Lerneinsatz fachlich geprüft (Geräte, Kabelführung, Anatomie, Hygiene). Bitte im Katalog `ki_generiert: true` setzen.
- **Personen müssen zum Fall passen** (Alter, Geschlecht). Die Tabelle in Anhang A nennt für jeden Fall die Person.
- Hygiene im Bild richtig: kein Schmuck, kurze Ärmel, Haare zusammen, Handschuhe nur wo nötig, Bettgitter und Bremsen plausibel.
- Monitore im Bild **ohne Werte** (dunkler oder Standby-Bildschirm, gut sichtbare rechteckige Bildschirmfläche), weil die App die Live-Werte einblendet.
- Nachtvarianten: gleiche Kamera, gedimmtes Licht, Nachtlicht/Leselampe an.

### 0.4 Felder im ASSET_KATALOG.json

```json
{
  "id": "20_paediatrie_kleinkind",
  "datei": "raeume/20_paediatrie_kleinkind.webp",
  "titel": "Kinderstation · Kleinkind mit Mutter",
  "bereich": "Pädiatrie",
  "beschreibung": "Alternativtext, 1–2 Sätze",
  "faelle": ["praxis:kind", "fall:fieberkrampf"],
  "hotspots": [{ "label": "Kind", "x": 0.42, "y": 0.55 }],
  "monitor": { "x": 0.70, "y": 0.12, "width": 0.18, "height": 0.16 },
  "variante_von": null,
  "ki_generiert": true,
  "lizenz": "eigene KI-Erzeugung",
  "urheber": "Philipp",
  "quelle": null,
  "zustand": { "monitor": "laeuft", "nacht": false, "massnahme": null },
  "freigabe": null
}
```

- **Gleiche IDs überall:** Fotos, Varianten und Animationen tragen dieselbe Asset-ID im Dateinamen, im Katalog und in
  `faelle` (z. B. `21b_paediatrie_schulkind_spacer` gehört zu `praxis:asthma`). Fall-IDs wie in Anhang A.
- **`zustand`** sagt, welche Zustandsregel das Bild auswählt: `monitor` (`abwesend`, `standby`, `laeuft`,
  `signalausfall`), `nacht`, `massnahme` (z. B. `orders`, `niedrigbett`). Regeln: `docs/RAEUME.md`.
- **Lizenz und Freigabe pro Datei:** `lizenz`/`urheber` sind Pflicht. `freigabe` bleibt `null`, bis jemand das Motiv
  fachlich geprüft hat; dann `{ "am": "JJJJ-MM-TT", "von": "Rolle" }`. Die App trägt sie in
  `src/features/assetstatus/freigaben.ts` ein.

Hotspots und Monitorfläche sind optional; Claude misst sie sonst selbst nach.

---

## 1. Was schon vorhanden ist (nicht erneut liefern)

| Bereich | Vorhanden | Ort |
| --- | --- | --- |
| Raumfotos | 34 Bilder: 14 Szenen 07–19 inkl. 12a aus Komplettpaket v2, dazu 20 Pädiatrie-, Heim- und Stationsbilder aus Lieferung 1 und 2 (Abschnitt 1.1/1.2) | `public/raeume/`, Katalog `src/ui/sim/raeume/katalog.ts` |
| Patientenporträts | Mila (2) und Ben (7), je nur Zustand „stabil“ | `public/personen/`, `src/ui/sim/personen.ts` |
| Raum-Grundentwürfe | 6 Referenzbilder 01–06 (mit eingebrannten Menüs, nur Vorlage) | Projektordner `pflegesimulator-referenz/bilder/` |
| Handlungsanimationen | Insulin-Pen, Kompressionsstrumpf (MP4 + 4 Phasenbilder) | `public/sim-videos/` |
| Titelbilder | 6 Bereichsmotive (Heute, Lernorganisation, Material, Trainer, Simulation, System) | `public/titelbilder/` (PR #98) |
| Modulkarten, Ansichten, Widgets | 43 Modulkarten, 5 Ansichten, 7 Widget-Karten (Gestaltungsvorlagen) | Visualpaket, nicht in der App nötig |
| Ablaufgrafiken | 12 Graphviz-Abläufe; eingebunden: Diagnostik | Visualpaket, `docs/bilder/` |
| Piktogramme | 37 Symbole (hell/dunkel); in der App als `Icon`-Komponente | `src/ui/icons.tsx` |
| Anatomie | 8 Schemata (Herz, Atmung, Niere, Skelett, Gehirn, Auge, Haut, Hormone) als SVG im Code | `src/features/anatomie/figuren.tsx` |
| Bildgebung echt | Röntgen Pneumonie rechts, Pleuraerguss links (Radiopaedia, CC BY-NC-SA) | `public/bildgebung/` |
| Bildgebung synthetisch | CT/Röntgen-Phantome: Pneumonie, Lungenembolie, Pneumothorax, Erguss, Stauung | `src/ui/sim/bildgebung/phantom.ts` |
| Monitor, Kurven, Alarmton | EKG/Pleth/AF-Kurven und Piepton werden im Code erzeugt | `src/ui/sim/PatientenMonitor.tsx`, `MiniMonitor.tsx` |
| Töne und Geräusche (synthetisch) | Rückmeldetöne, Monitorpiep, Alarme rot/gelb/technisch, Telefon, Patientenruf, Pumpe, NIBP, Rea-Alarm, Defi, 5 Raumklänge, 5 Herz-, 4 Lungen-, 3 Darmgeräusche, Korotkow-Töne | `src/ui/audio/klaenge.ts`, `docs/AUDIO.md` |
| App-Icons | SVG, 192, 512, maskable, Apple-Touch | `public/` |
| Lernskripte | CE01–CE05, CE08, CE09, CE10 (Neugeborenes), LEB5 | Material-Repo `skripte/` |

### 1.1 Lieferung 1 vom 11.11.2026 (P1 Pädiatrie)

| Position | Geliefert | Stand |
| --- | --- | --- |
| `20_paediatrie_kleinkind` | Grundbild, `20a` ohne Monitor, `20m` Sensor am Kind, `20n` Nacht, `20f` Fieberkrampf (Lina) | in der App (PR #103): Praxis `kind`, Fall `fieberkrampf` |
| `21_paediatrie_schulkind` | Grundbild, `21a` ohne Monitor, `21b` Inhalation mit Spacer, `21m` Sensor am Kind | in der App (PR #103): Praxis `asthma` (21b erscheint 15 Minuten nach der Anordnung), Fall `asthma-kind` |
| Porträts | `praxis-kind_stabil`, `praxis-asthma_stabil` | in der App: Praxis `kind`/`asthma`, Fall `asthma-kind`; Zustände `angestrengt`/`kritisch` fehlen |
| `ct_lungenembolie` | 32 Schichten CTPA, CAD-PE 001, CC BY 4.0, 16-Bit-PNG | in der App (PR #105): Diagnostik `lungenembolie`, 16-Bit-Dekoder mit echter HU-Fensterung |
| `rx_pneumothorax` | Spontanpneumothorax links, Hellerhoff, CC BY-SA 3.0 | in der App (PR #105): Diagnostik `pneumothorax`, Befundmarke neu vermessen |
| `txt_ce10` (Teil) | Lernskript Neugeborenes (LEB 6) | Material-Repo: Original unter `dateien/`, Skript `skripte/CE10-Neugeborenes.md` |

### 1.2 Lieferung 2 vom 11.11.2026 (Welle 02, Räume)

| Position | Geliefert | Stand |
| --- | --- | --- |
| `26_pflegeheim_zimmer_tag` | Grundbild (Ilse), `26a` Bernd im Sessel, `26b` Frühstück unberührt, `26h` Frau S., `26p` Herr B. | in der App: Praxis `demenz` (26b), `schlaganfall` (26a); Fall `demenz-verfuegung` (26b), `hypoglykaemie` (26h), `pneumonie` (26p) |
| `27_station_zweibett_nacht` | Grundbild, `27a` Niedrigbett mit Sturzmatte | in der App: Praxis `delir` (27a erscheint nach „Bett in Niedrigstellung“), Fall `delir-nacht` |
| `30_station_zimmer_frau` | Grundbild (Selin), `30a` ohne Monitor, `30m` Sensor am Finger, `30b` Gertrud (Sepsis) | in der App: Praxis/Fall `anaphylaxie` (30/30a/30m je Monitorzustand), `sepsis` (30b) |

Raumbilder werden nicht ins Startpaket gepackt, sondern beim ersten Ansehen geladen (Startgröße unverändert). Fachliche Prüfung offen (Infusionsanschluss, Kabelführung, Niedrigbett-Motiv).

Originale der Lieferungen: Projektordner `material-lieferungen/2026-11-11_P1_Paediatrie/`. Fachliche Prüfung aller Motive und der Bildzuordnung ist offen.

---

## 2. Neue Raumfotos (Simulatoren)

Heute haben **Praxissimulator (17 Fälle)**, **Fallsimulator (17 Fälle)** und **Diagnostik (5 Fälle)** zusammen
39 Fälle. Für viele gibt es keinen passenden Raum, sie werden deshalb auf einen Ersatzraum gelegt
(z. B. das Kinderfall-Zimmer auf das postoperative Erwachsenenzimmer, Psychiatrie auf den Speiseraum
im Pflegeheim). Der Fallsimulator zeigt bisher nur gezeichnete Räume; mit den Fotos unten kann er
ebenfalls auf echte Raumbilder umgestellt werden.

Nummerierung schließt an das Komplettpaket an (07–19).

### 2.1 P1: Räume für vorhandene Fälle ohne passendes Foto

| ID | Raum und Situation | Personen im Bild | Pflicht-Objekte (Hotspots) | Varianten | Für Fälle |
| --- | --- | --- | --- | --- | --- |
| `20_paediatrie_kleinkind` | Kinderstation, Einzelzimmer, Gitterbett, kindgerechte Wand, Tag | Mädchen 2–4 Jahre im Bett, Mutter auf Stuhl am Bett | Kind, Mutter, Monitorwagen mit Kindermanschette, Fingerclip klein, Trinkbecher/Schnabeltasse, Fieberthermometer, Rufanlage | `20a` ohne Monitorwagen, `20n` Nacht | Praxis `kind` (Mila, 4), Fall `fieberkrampf` (Lina, 2) |
| `21_paediatrie_schulkind` | Kinderstation, Bett hochgestellt, Sauerstoffanschluss an der Wand | Junge ca. 7 Jahre sitzend, sichtbar angestrengt, Mutter am Bett | Kind, Mutter, O₂-Wandanschluss mit Flowmeter, Dosieraerosol mit Spacer auf dem Nachttisch, Monitor, Rufanlage | `21a` ohne Monitor, `21b` mit Sauerstoffmaske/Inhalation | Praxis `asthma` (Ben, 7), Fall `asthma-kind` |
| `22_psychiatrie_aufenthaltsraum` | Offener psychiatrischer Wohnbereich, Sofas, Tisch, Fenster, Tag | Mann ca. 32 Jahre, angespannt stehend; 1–2 Mitpatienten im Hintergrund unscharf | Patient, Teamruf/Notrufknopf, Tür zum Rückzugsraum, Stationsstützpunkt-Fenster | `22a` ruhiger Zustand (Patient sitzend) | Praxis `psychiatrie` (Leon, 32) |
| `23_psychiatrie_rueckzugsraum` | Reizarmer Rückzugsraum, weiche Möbel, gedämpftes Licht | Mann ca. 32, sitzend; Pflegekraft in Gesprächsdistanz | Sitzplatz, Tür (offen), Getränk | — | Praxis `psychiatrie` |
| `24_reha_zimmer` | Rehaklinik-Zimmer, Blick durch offene Tür ins barrierefreie Bad | Frau ca. 64, an der Bettkante, Rollator daneben | Patientin, Rollator, Haltegriffe, Rufanlage, Badtür, Nachtlicht | `24b` Patientin im Bad am Haltegriff | Praxis `reha` (Petra, 64) |
| `25_hospiz_zimmer` | Hospiz-/Palliativzimmer, wohnlich, Fotos und Blumen, Abendlicht | Frau ca. 88 im Pflegebett, Tochter am Bett | Patientin, Angehörige, Nachttisch mit Mundpflegeset, Telefon/Rufdienst, Sessel | `25n` Nacht | Praxis `palliativ` (Helene, 88), Fall `palliativ` |
| `26_pflegeheim_zimmer_tag` | Bewohnerzimmer im Pflegeheim, Tag, Pflegebett, Sessel, persönliche Möbel | Frau ca. 85–89 im Bett, halb aufgerichtet | Bewohnerin, Nachttisch mit Rufanlage und Trinkbecher, Rollstuhl, Lagerungskissen, Pflegedokumentation | `26a` Bewohner männlich ca. 76 im Sessel mit hängendem Mundwinkel (Schlaganfall), `26b` leerer Teller/Tablett unberührt | Praxis `demenz` (Ilse, 89), `schlaganfall` (Bernd, 76), Fall `hypoglykaemie`, `pneumonie`, `demenz-verfuegung` |
| `27_station_zweibett_nacht` | Internistisches Zweibettzimmer nachts, Nachtlicht | Mann ca. 84 unruhig an der Bettkante, will aufstehen; Nachbar schläft im zweiten Bett | Patient, Nachbar, Bettgitter, Rufanlage, Tür, Monitorwagen (aus), Platz für Niedrigbett/Sturzmatte | `27a` mit Niedrigbett und Sturzmatte | Praxis `delir` (Heinrich, 84), Fall `delir-nacht` |
| `28_ambulant_schlafzimmer` | Häusliches Schlafzimmer mit Pflegebett, Wechseldruckmatratze, Tag | Frau ca. 80 liegend, Angehöriger im Türrahmen | Klientin, Pflegebett, Lagerungskissen, Pflegetasche, Inkontinenzmaterial, Dokumentationsmappe | `28a` Klientin in 30°-Seitenlage | Fall `dekubitus`, Praxis `hausbesuch` (Erika, 79, Ausweichraum) |
| `29_ambulant_wohnzimmer_copd` | Wohnzimmer, Sessel, Sauerstoffkonzentrator mit Schlauch | Mann ca. 70, in Kutschersitz vornübergebeugt | Klient, O₂-Konzentrator, Inhalator, Peak-Flow-Meter, Telefon | `29a` ruhig atmend | Fall `copd` |
| `30_station_zimmer_frau` | Internistisches Einzelzimmer, Tag, Infusionsständer mit laufender Kurzinfusion | Frau ca. 34 im Bett, kratzt sich am Arm | Patientin, Infusion/Zugang, Monitorwagen, Rufanlage, Notfallwagen-Hinweis an der Tür | `30a` ohne Monitor, `30b` ältere Frau ca. 81 im Bett, verwirrt (Sepsis) | Praxis `anaphylaxie` (Selin, 34), `sepsis` (Gertrud, 81), Fall `anaphylaxie`, `sepsis` |
| `42_station_bewusstlos` | Stationszimmer (Normalstation), Bett flach gestellt, Kopfteil abnehmbar, Tag | Erwachsene Person ca. 70 Jahre bewusstlos in Rückenlage im Bett, Augen geschlossen, Arme neben dem Körper, keine Pflegekraft im Bild | Person (Brustkorb frei zugänglich), Rufanlage/Notrufknopf, Bettbedienung (Flachstellung), Reanimationsbrett am Bett oder an der Wand, Monitorwagen | `42a` mit Monitorwagen am Bett, `42n` Nacht, `42b` mit Reanimationsbrett unter dem Oberkörper | Notfall-Trainer „Reanimation üben“ (läuft heute im Schockraum 18) |

### 2.2 P3: Räume für geplante Einsatzbereiche

Aus `docs/PRAXISSIMULATOR.md` (Einsatzgebiete, P2 „Versorgungsverlauf“). Gleiche Vorgaben wie oben.

| ID | Raum | Wichtige Objekte |
| --- | --- | --- |
| `31_station_dienstzimmer` | Pflegestützpunkt/Dienstzimmer mit Telefon, Kurvenwagen, PC (Bildschirm leer) | Telefon (SBAR), Übergabetisch, Medikamentenschrank, Whiteboard ohne Schrift |
| `32_station_medikamentenraum` | Medikamentenraum, Stellen von Tabletten, Kühlschrank, BtM-Schrank | Dispenser, Kühlschrank, BtM-Buch, Arbeitsfläche |
| `33_station_flur` | Stationsflur mit Notfallwagen und Defibrillator | Notfallwagen, Defi, Händedesinfektion, Patientenzimmertüren |
| `34_aufwachraum` | Aufwachraum mit 2 Bettplätzen, Monitore | Patient, Monitor, O₂, Absaugung, Wärmedecke |
| `35_imc_platz` | IMC-Bettplatz, Monitor, Perfusoren, kein Beatmungsgerät | Monitor, Perfusoren, NIV-Maske |
| `36_stroke_unit` | Stroke-Unit-Bettplatz, Monitor, Schluckscreening-Material | Patient mit Hemiparese, Monitor, Andickungsmittel |
| `37_rtw_innen` | Rettungswagen innen, Trage, Monitor/Defi | Trage, Monitor, Absaugung, O₂ |
| `38_dialyse` | Dialyseplatz mit Gerät und Liegesessel | Gerät (Display leer), Shuntarm, Waage |
| `39_gerontopsychiatrie` | Beschützter Wohnbereich, Orientierungshilfen | Uhr, Kalender, Bilder, Tür mit Code |
| `40_betreutes_wohnen` | Appartement im betreuten Wohnen mit Notrufsystem | Hausnotruf, Kochnische, Medikamentenbox |
| `41_kreisssaal_wochenbett` | Wochenbettzimmer mit Neugeborenenbettchen (Geburtshilfe, später) | Mutter, Neugeborenes, Stillkissen |

---

## 3. Varianten bestehender Räume (P2)

Wichtig: **exakt gleicher Bildausschnitt** wie das Grundbild (am besten mit demselben Ausgangsbild erzeugen).

### 3.0 Zuerst: Zustandslücken in Fällen, die es schon gibt (Website-Audit SIM-06)

Vor neuen Räumen bitte die Bilder liefern, mit denen schon laufende Fälle ihren Zustand sichtbar wechseln. Die App
wählt die Variante selbst aus Zustandsregeln (Gerät aus/an, Sensor angelegt/abgefallen, Tag/Nacht, Maßnahme). Fehlt
das Bild, fällt sie auf ein Ersatzbild zurück. Die vollständige, automatisch erzeugte Lückenliste steht in
[`docs/ASSET-STATUS.md`](ASSET-STATUS.md); die wichtigsten:

| ID | Grundbild | Änderung | Zustandsregel | Fälle |
| --- | --- | --- | --- | --- |
| `21s_paediatrie_schulkind_sensor_ab` | 21 | Fingersensor liegt neben der Hand, Kabel hängt lose | `sensorAb` (Signalausfall) | Diagnostik `asthma-kind`, Praxis `asthma` |
| `20s_paediatrie_kleinkind_sensor_ab` | 20 | Sensor am Fuß gelöst | `sensorAb` | Praxis `kind` |
| `30s_station_zimmer_frau_sensor_ab` | 30 | Fingerclip abgefallen | `sensorAb` | Praxis/Fall `anaphylaxie` |
| `12m_station_kardiologie_verbunden` + `12s` | 12 | Elektroden und Fingerclip sichtbar angelegt / Clip abgefallen | `verbunden` / `sensorAb` | Praxis `nachtwache`, `lungenembolie`; Diagnostik (2 Fälle) |
| `21n_paediatrie_schulkind_nacht` | 21 | Nachtlicht, Kind schläft halb sitzend | `nacht` | Praxis `asthma` im Nachtdienst |
| `12n`, `13n` | 12, 13 | Nachtvariante | `nacht` | Praxis `nachtwache` (2 Uhr), Diagnostik postoperativ |
| `21c_paediatrie_schulkind_nach_inhalation` | 21 | Kind sitzt entspannter, Spacer weggelegt | Maßnahme `orders` beendet | Praxis `asthma`: sichtbare Besserung nach der Inhalation |
| `30c_station_zimmer_frau_nach_adrenalin` | 30 | Beine hochgelagert, Infusion läuft, Gesicht weniger gerötet | Maßnahme | Praxis/Fall `anaphylaxie` |
| `20g_paediatrie_kleinkind_fieberkrampf_seitenlage` | 20f | Kind in stabiler Seitenlage nach dem Krampf | Maßnahme | Fall `fieberkrampf` |
| Porträts `angestrengt`, `kritisch` | Mila, Ben | gleiche Person, gleicher Ausschnitt | Patientenzustand | Fall `asthma-kind`, Praxis `kind`/`asthma` |

Die Inhalation mit Spacer (`21b`) ist schon im passenden Fall eingebunden (Praxis `asthma`). Nicht erreichbar sind
derzeit nur `14_station_isolation`, `19_krankenhaus_materialraum` und `26_pflegeheim_zimmer_tag` (kein Fall nutzt sie;
14 und 19 brauchen die Varianten `14a`/`19a` unten, 26 ist Grundbild zu 26a/26b).

| ID | Grundbild | Änderung | Wofür |
| --- | --- | --- | --- |
| `13a_station_postop_ohne_monitor` | 13 postop | Monitor und Sensoren weg | „Monitor anschließen“ wie bei 12/12a (Diagnostik `lungenembolie`, Praxis `nachblutung`) |
| `13b_station_postop_nachblutung` | 13 | Verband sichtbar durchgeblutet, Patient blass | Praxis/Fall `nachblutung` (Jonas, 58) |
| `13c_station_postop_mobilisation` | 13 | Patient ca. 67 an der Bettkante, erschrocken, Hand an der Brust | Praxis/Fall `lungenembolie` (Werner, 67) |
| `13d_station_postop_hueft_tep` | 13 | Patientin ca. 75, Abduktionskissen, Drainage, Gehwagen | Fall `hueft-tep` |
| `10a_pflegeheim_nacht_sturz` | 10 Nacht | Bewohner am Boden neben dem Bett, Rollator umgekippt | Fall `sturz-nacht` |
| `10b_pflegeheim_nacht_sterbend` | 10 | ruhige Sterbesituation, Kerze aus LED, Angehörige | Fall `palliativ` (Ausweichraum) |
| `11a_pflegeheim_speiseraum_schlaganfall` | 11 | Bewohner mit hängendem Mundwinkel, Kaffee läuft aus dem Mund | Praxis `schlaganfall` |
| `09a_ambulant_kueche_hypoglykaemie` | 09 | Person schwitzig, zittrig, Traubenzucker auf dem Tisch | Hypoglykämie-Verläufe |
| `07a_ambulant_wohnzimmer_still` | 07 | Klientin im Sessel in sich gesunken, Licht aus | Praxis `hausbesuch` („ungewohnt still“) |
| `16a_notaufnahme_triage_brustdruck` | 16 | Mann ca. 59, Hand auf der Brust, schweißig | Praxis `zna` (Andreas, 59) |
| `17a_notaufnahme_untersuchung_ohne_monitor` | 17 | Monitor aus/weg | Diagnostik `pneumothorax` (Anschließen) |
| `18a_schockraum_patient` | 18 | Patient auf der Trage, Rettungsdienst übergibt, Team am Tisch | Diagnostik `herzinsuffizienz`, Schockraum-Übergabe |
| `15a_intensiv_beatmung_alarm` | 15 | Pflegekraft am Beatmungsgerät, Patientin ca. 67 | Praxis `its` (Sabine, 67) |
| `14a_station_isolation_vorraum` | 14 | Blick nur in den Vorraum mit Schutzkittel, Masken, Desinfektion | Hygiene-Trainer, PSA an-/ablegen |
| `19a_materialraum_fach_leer` | 19 | ein Fach sichtbar leer | „Material fehlt“ laut Komplettpaket-Anleitung |
| Tag/Nacht | 12, 13, 14, 15 | je eine Nachtvariante `…n` | Nachtdienst-Fälle (Praxis `nachtwache` 2 Uhr nachts) |

---

## 4. Nahansichten für Hotspots (P2)

Beim Antippen eines Hotspots soll statt nur Text eine Nahansicht erscheinen. Format 16:9, 1600 × 900, ohne Text.

| ID | Motiv | Zustände (je ein Bild) | Genutzt in |
| --- | --- | --- | --- |
| `na_wunde_op_verband` | OP-Verband Hüfte/Knie | trocken · leicht durchgeblutet · stark durchgeblutet | Nachblutung, Hüft-TEP |
| `na_redon_drainage` | Redon-Flasche | wenig · viel hellrot · Vakuum verloren | Postop, Nachblutung |
| `na_urinbeutel` | Urinbeutel am Bett | hell · konzentriert dunkel · trüb/flockig · blutig | HWI, Exsikkose, Sepsis, Bilanz |
| `na_haut_steiss` | Steißregion (Modellhaut, KI) | Dekubitus Kategorie 1 · 2 · 3 · 4 · Fingertest | Dekubitus, Expertenstandard |
| `na_haut_zeichen` | Hautbefunde | Zyanose Lippen · Marmorierung Knie · Ödem mit Dellen · stehende Hautfalte · Ikterus Skleren · Exanthem/Quaddeln | Sepsis, Herzinsuffizienz, Exsikkose, Leberzirrhose, Anaphylaxie |
| `na_gesicht_fazialis` | Gesicht | Mundwinkel hängt einseitig · normal | Schlaganfall, FAST |
| `na_pupillen` | Augenpaar | normal · eng · weit · seitendifferent | GCS, Notfall |
| `na_infusion` | Infusionsständer mit Schwerkraftinfusion | läuft · Tropfkammer leer · Zugang paravasal (Schwellung) | Anaphylaxie, Infusionen |
| `na_perfusor` | Spritzenpumpe | Display leer (Werte kommen aus der App) | ITS, IMC |
| `na_beatmungsgeraet` | Beatmungsgerät | Display leer | ITS |
| `na_notfallwagen` | Notfallwagen, Schubladen | geschlossen · Schublade Atemweg offen · Schublade Medikamente offen | Notfall, Anaphylaxie |
| `na_defi_aed` | AED mit Klebepads | Pads verpackt · Pads am Oberkörper (Puppe) | Notfall-Trainer |
| `na_bz_messgeraet` | Blutzuckermessgerät mit Teststreifen | Display leer | Diabetes, Hypoglykämie |
| `na_o2_flowmeter` | O₂-Wandanschluss mit Flowmeter und Nasenbrille | — | Asthma, COPD, Pneumonie |
| `na_spacer` | Dosieraerosol mit Spacer und Kindermaske | — | Asthma-Kind |
| `na_roehrchen` | Blutentnahmeröhrchen in Abnahmereihenfolge | — | Labor-Trainer (Präanalytik) |
| `na_medikamentenplan` | Medikamentenplan/Dispenser (fiktive Namen) | korrekt · Fehler gestellt | Arzneimittel, Schlaganfall-Heim |
| `na_trinkprotokoll` | Trinkbecher mit Skala, Trinkprotokoll leer | — | Exsikkose, Demenz |
| `na_pflegebett_lagerung` | Pflegebett mit Lagerungsmaterial | 30°-Lagerung · 135° · Oberkörper hoch | Dekubitus, Pneumonieprophylaxe |

---

## 5. Patientenporträts (P2)

Für Fallkarten, Akte und Übergabe. Gleiche Person wie im Raumfoto, 1024 × 1024, je **3 Zustände**:
`stabil`, `angestrengt` (schwitzig, unruhig), `kritisch` (blass/zyanotisch, Augen halb geschlossen).
Dateiname: `personen/<fall-id>_<zustand>.webp`, z. B. `personen/praxis-kind_angestrengt.webp`.

Die Liste der Personen (Name, Alter, Fall) steht in **Anhang A**. Mindestens die 17 Praxisfälle (P2),
die Fallsimulator- und Diagnostikfälle danach (P3).

---

## 6. Handlungsanimationen (P2, wichtigste zuerst)

**Hinweis zur nächsten Welle (Audit):** Welle 1 und 2 sind gegen `public/raeume/`, `public/personen/`,
`public/sim-videos/` und die Fallkataloge geprüft (Ergebnis: `docs/ASSET-STATUS.md`). Neue Animationen bitte mit
derselben Fall-ID wie das Foto liefern, in dem sie spielen (z. B. `dosieraerosol_spacer` zu `21b`/Praxis `asthma`),
und je Datei Lizenz und fachliche Freigabe angeben (Abschnitt 0.4). Zuerst die Zustandslücken aus Abschnitt 3.0.

Format wie vorhanden: MP4 6–15 s ohne Ton + **4 Phasenbilder** mit Namen. Dateiname
`animationen/<id>.mp4` und `animationen/<id>-1.webp` … `-4.webp`. Keine Dosen, keine Präparatenamen im Bild.

| ID | Handlung | 4 Phasen | Fälle/Module |
| --- | --- | --- | --- |
| `haendedesinfektion` | Hygienische Händedesinfektion | Mittel entnehmen · Handflächen/Handrücken · Fingerkuppen/Daumen · trocken | Hygiene-Trainer, vor jeder Handlung |
| `psa_anlegen` | Schutzkittel, Maske, Brille, Handschuhe anlegen | Kittel · Maske/Fit-Check · Brille · Handschuhe über Bündchen | Hygiene, Isolation (Raum 14) |
| `psa_ablegen` | Schutzausrüstung ablegen | Handschuhe · Kittel nach innen rollen · Brille · Maske, Händedesinfektion | Hygiene, Isolation |
| `rr_manuell` | Blutdruck manuell messen | Manschette anlegen · aufpumpen · ablassen mit Stethoskop · ablesen | Vitalzeichen, Normwerte |
| `bz_kapillar` | Kapillare Blutzuckermessung | Finger seitlich stechen · ersten Tropfen verwerfen · Streifen ansaugen · Ergebnis | Diabetes, Hypoglykämie |
| `sc_injektion` | s.c.-Injektion mit Fertigspritze (Heparin) | Hautfalte · Einstich 90° · injizieren · Kanüle in Abwurf | Thromboseprophylaxe, Rechentrainer |
| `dosieraerosol_spacer` | Dosieraerosol mit Spacer beim Kind | schütteln · aufsetzen · Hub · 5–6 Atemzüge | Asthma-Kind |
| `o2_nasenbrille` | Sauerstoffgabe über Nasenbrille | Flowmeter einstellen · Brille einsetzen · Schlauch hinter Ohren · Kontrolle | COPD, Pneumonie, LE |
| `lagerung_30grad` | 30°-Seitenlagerung | Ausgangslage · Kissen am Rücken · Becken drehen · Endlage | Dekubitus |
| `mobilisation_bettkante` | Mobilisation an die Bettkante | Seitenlage · Beine aus dem Bett · aufrichten · sitzen, Vitalzeichen | Hüft-TEP, LE, Reha |
| `transfer_rollstuhl` | Transfer Bett → Rollstuhl | Rollstuhl stellen/Bremsen · aufstehen · drehen · hinsetzen | Mobilität, Heim |
| `anreichen` | Essen anreichen | Oberkörper hoch · kleine Portion · Schlucken abwarten · Mundkontrolle | Demenz, Schlaganfall |
| `mundpflege` | Spezielle Mundpflege | Inspektion · Tupfer befeuchten · auswischen · Lippen pflegen | Palliativ |
| `stabile_seitenlage` | Stabile Seitenlage | Arm anwinkeln · Knie beugen · drehen · Kopf überstrecken | Notfall, Fieberkrampf |
| `hlw_aed` | Herzdruckmassage und AED | Druckpunkt · Kompression · Pads kleben · Analyse | Notfall-Trainer |
| `blutentnahme_reihenfolge` | Blutentnahme, Röhrchen-Reihenfolge | Stauen · punktieren · Röhrchen in Reihenfolge · Stauung lösen | Labor-Trainer |
| `blutkultur` | Blutkulturen abnehmen | Flaschen desinfizieren · aerob · anaerob · beschriften | Sepsis, Labor |
| `verbandwechsel` | Aseptischer Verbandwechsel | alten Verband entfernen · Wunde beurteilen · reinigen · neu verbinden | Postop, Dekubitus |
| `dk_pflege` | Katheterpflege | Inspektion · Reinigung Meatus · Beutel unter Blasenniveau · Dokumentation | HWI, Hygiene |
| `pupillenkontrolle` | Pupillenkontrolle | Licht von außen · Reaktion · anderes Auge · Vergleich | Neuro, GCS |
| `fast_test` | FAST-Test | Face · Arms · Speech · Time | Schlaganfall |
| `tug_test` | Timed Up and Go | aufstehen · 3 m gehen · wenden · hinsetzen | Assessment (TUG) |

---

## 7. Bildgebung und Diagnostik

Echte Bilder nur **frei lizenziert** (CC BY, CC BY-SA, CC BY-NC-SA, gemeinfrei) mit Urheber, Lizenz, Quell-URL.
Keine MIMIC- oder anderen zugangsbeschränkten Daten. Private Unterrichtsbilder gehen ins Material-Repo
(`bildgebung/<name>/serie.json`, siehe `docs/DIAGNOSTIK.md`).

| ID | Inhalt | Format | Prio | Wer | Fall |
| --- | --- | --- | --- | --- | --- |
| `ct_lungenembolie` | CT-Pulmonalisangiographie mit zentraler Lungenembolie, axiale Schichtfolge (ideal 20–40 Schichten) | PNG-Folge 512 × 512 oder DICOM | **P1** | F | Diagnostik `lungenembolie` |
| `rx_pneumothorax` | Röntgen-Thorax p.a. mit Mantelpneumothorax (sichtbare Pleuralinie) | PNG/JPG ≥ 1024 px | **P1** | F | Diagnostik `pneumothorax` |
| `rx_stauung_herzinsuffizienz` | Röntgen-Thorax mit Kardiomegalie, Stauung, beidseitigem Erguss | PNG/JPG | P2 | F | Diagnostik `herzinsuffizienz` (heute nur Erguss bei Pneumonie) |
| `ct_pneumonie` | CT-Thorax nativ mit Lobärpneumonie, Schichtfolge | PNG-Folge | P2 | F | Diagnostik `sepsis-pneumonie` |
| `ct_pneumothorax` | CT-Thorax mit Pneumothorax, Schichtfolge | PNG-Folge | P2 | F | Diagnostik `pneumothorax` |
| `rx_normal` | Normaler Röntgen-Thorax als Vergleich | PNG/JPG | P2 | F | alle Thorax-Fälle |
| `rx_lagekontrolle` | Röntgen mit ZVK-Spitze und Magensonde (Lagekontrolle) | PNG/JPG | P2 | F | Pflegeblick Bildgebung |
| `cct_schlaganfall` | CCT nativ: Blutung und Infarkt im Vergleich | PNG-Folge | P3 | F | Schlaganfall-Fälle |
| `rx_huefte_femurfraktur` | Röntgen Hüfte mit Schenkelhalsfraktur, dazu postop. TEP | PNG/JPG | P3 | F | Sturz, Hüft-TEP |
| `rx_abdomen_ileus` | Röntgen Abdomen mit Spiegeln | PNG/JPG | P3 | F | Gastro |
| `sono_blase` | Blasenscan/Sonografie Harnverhalt | PNG | P3 | F | HWI, Postop |
| `ekg_12kanal` | 12-Kanal-EKG: Sinusrhythmus, STEMI, Vorhofflimmern, Hyperkaliämie, Kammerflimmern | SVG/PNG | P2 | **C** (synthetisch) oder F | ZNA Brustdruck, Notfall, Labor (Kalium) |
| `bga_geraet_ausdruck` | BGA-Ausdruck als Bild | — | P3 | **C** | BGA-Trainer |

---

## 8. Illustrationen für Trainer und Lernmodule

| ID | Modul | Inhalt | Format | Prio | Wer |
| --- | --- | --- | --- | --- | --- |
| `anat_verdauung` | Anatomie-Trainer | Verdauungstrakt mit Markerpunkten (Magen, Leber, Galle, Pankreas, Dünn-/Dickdarm) | SVG mit IDs | P2 | C oder L |
| `anat_kreislauf_gefaesse` | Anatomie | Großer/kleiner Kreislauf, Arterien/Venen (Pulsorte) | SVG | P2 | C |
| `anat_injektionsorte` | Anatomie/Arzneimittel | s.c.-Orte (Bauch, Oberschenkel), i.m. ventrogluteal nach Hochstetter | SVG | P2 | C |
| `anat_dekubitusstellen` | Expertenstandard Dekubitus | Gefährdete Körperstellen in Rücken-, Seiten-, Sitzlage | SVG | P2 | C |
| `anat_wirbelsaeule`, `anat_ohr`, `anat_lymphe`, `anat_geschlechtsorgane` | Anatomie | weitere Organsysteme | SVG | P3 | C |
| `hyg_5_momente` | Hygiene-Trainer | 5 Momente der Händehygiene (eigene Darstellung, nicht WHO-Logo) | SVG | P2 | C |
| `hyg_haendedesinfektion_schritte` | Hygiene | Einreibeschritte als Bildfolge | SVG/PNG | P2 | C oder L |
| `hyg_isolationsschilder` | Hygiene | Türschilder Kontakt-/Tröpfchen-/aerogene Isolierung | SVG | P3 | C |
| `not_rettungskette`, `not_abcde` | Notfall-Trainer | Rettungskette, ABCDE-Schema | SVG | P2 | C |
| `arz_darreichungsformen` | Arzneimittel-Trainer | Tablette, Retard, Brausetablette, Tropfen, Pflaster, Zäpfchen, Pen, Ampulle, Infusion (ohne Markennamen) | Fotos/KI 1200 × 1200 je Objekt | P2 | L |
| `rech_spritzenskalen` | Rechentrainer | 1-, 2-, 5-, 10-, 20-, 50-ml-Spritze und Insulinspritze mit Skala, Kolben einstellbar | SVG | **P2** | C |
| `rech_infusion_tropfen` | Rechentrainer | Tropfkammer/Rollenklemme für Tropfenrechnung | SVG | P3 | C |
| `ass_nrs_skala`, `ass_gcs` | Assessments | NRS-Leiste, GCS-Tabelle mit Pupillen | SVG | P2 | C |
| `ass_gesichterskala_kind` | Assessments | Gesichter-Schmerzskala für Kinder (nur eigene, lizenzfreie Gesichter, nicht Wong-Baker/FPS-R) | SVG | P3 | C |
| `kh_steckbrief_motive` | Krankheitsbilder | Titelbild je Steckbrief (35 Stück, z. B. Herzinsuffizienz, COPD, Demenz) im Stil der Titelbilder | WebP 1200 × 675 | P3 | L |
| `es_motive` | Expertenstandards | Symbolbild je Expertenstandard (Dekubitus, Sturz, Schmerz, Ernährung, Kontinenz, Wunde, Mobilität, Demenz, Mundgesundheit, Entlassung, Hautintegrität) | WebP 1200 × 675 | P3 | L |
| `leer_zustaende` | alle Module | 6 kleine Illustrationen für leere Zustände (keine Karten, keine Dokumente, keine Fälle, kein Ergebnis, offline, Fehler) | SVG | P3 | C |
| `pwa_splash` | App | iOS-Startbilder (hell/dunkel) und Screenshots fürs Installationsfenster | PNG | P3 | C |

---

## 9. Audio (P3, optional)

Seit 2026-11-11 erzeugt die App alle Töne selbst (`docs/AUDIO.md`): Monitor, Alarme, Telefon, Ruf, Raumklang
und vereinfachte Herz-, Lungen- und Darmgeräusche im Hör-Trainer. **Nichts davon ist dringend.** Echte Aufnahmen
würden nur die Körpergeräusche realistischer machen, denn synthetisch lassen sich Merkmale zeigen, aber nicht die
Vielschichtigkeit echter Auskultation. Nur mit Lizenz (z. B. CC BY, CC0) oder selbst aufgenommen am Simulator-Dummy.
Ablage: Material-Repo `audio/`, ein Clip je ID, Format siehe 0.2. Nach Lieferung wird der Clip im Hör-Trainer
neben bzw. statt der Nachbildung eingebaut (Abspielen von Dateien ist noch nicht gebaut).

| ID | Inhalt | Priorität | Ersetzt im Code |
| --- | --- | --- | --- |
| `aus_lunge_vesikulaer`, `aus_lunge_giemen`, `aus_lunge_rg_fein`, `aus_lunge_rg_grob`, `aus_lunge_stridor`, `aus_lunge_abgeschwaecht` | vesikulär, Giemen/Brummen (Asthma, COPD), fein- und grobblasige RG (Lungenödem, Pneumonie), Stridor (Pseudokrupp), abgeschwächt (Erguss, Pneumothorax; fehlt heute ganz) | P2 | `atem-*` |
| `aus_herz_normal`, `aus_herz_tachy`, `aus_herz_aa`, `aus_herz_s3`, `aus_herz_systolikum` | normale Herztöne, Tachykardie, absolute Arrhythmie, 3. Herzton, Systolikum (Aortenstenose) | P2 | `herz-*` |
| `aus_darm_normal`, `aus_darm_hoch`, `aus_darm_still` | normal, hochgestellt/klingend (mech. Ileus), Stille (je 60 s) | P3 | `darm-*` |
| `rr_korotkow` | Korotkow-Töne einer echten manuellen RR-Messung mit bekanntem Wert (z. B. 140/85), ganze Ablasskurve | P2 | Hör-Trainer „Blutdruck nach Gehör“ |
| `ger_beatmung_alarm`, `ger_absaugung` | Beatmungsgerät-Alarm, Absauggerät | P3 | fehlt heute |
| `stimme_*` | kurze Patientensätze (Atemnot, Verwirrtheit, Schmerz, Kind weint), optional, nur mit Einwilligung der Sprechenden | P3 | Vorlesestimme |

Nicht nötig (macht die App besser selbst): Monitorpiep, Alarmmelodien, Telefon, Rufanlage, Pumpenalarm, Raumklang, UI-Töne.

---

## 10. Texte und fachliche Materialien

| ID | Inhalt | Prio | Wofür |
| --- | --- | --- | --- |
| `txt_ce06`, `txt_ce07`, `txt_ce11` | Unterrichtsmaterial zu den CEs, für die noch keine Zusammenfassung existiert (vorhanden: CE01–05, 08, 09, 10, LEB5) | **P1** | Skript, Belegprüfung, Lernpfade |
| `txt_ce10_weitere` | CE10 zweite Lernsituation (individueller Entwicklungsstand des Kindes) | P2 | Skript |
| `txt_ce03_ce04_mehr` | Weitere Unterlagen zu CE03 (2 Skripte) und CE04 (1 Skript) | P2 | Lücken in Belegen |
| `txt_pruefungen_alt` | Alte Klausuren/Examensaufgaben, Bewertungsbögen, Erwartungshorizonte | P2 | Examen, Prüfungssimulation |
| `txt_termine` | Stundenplan, Praxiseinsatzplan, Prüfungstermine | P2 | Lernplan |
| `txt_hygieneplan` | Hygieneplan/Standards der Schule oder des Trägers | P3 | Hygiene-Trainer (Belege) |
| `txt_formulare` | Leere Vordrucke: SIS, Pflegeplanung, Überleitungsbogen, Vitalzeichenkurve, Bilanzbogen, Wunddoku | P2 | SIS-, Bericht-, Übergabe-Trainer |
| `txt_freigabe` | Name einer Pflegefachperson für die fachliche Freigabe der Simulator-Fälle (`kern.freigabe` steht überall auf „ausstehend“) | **P1** (Entscheidung) | Praxissimulator |

---

## 11. Kurzfassung: Die wichtigsten Positionen

1. ~~`20_paediatrie_kleinkind` + `20a`~~ geliefert 11.11.
2. ~~`21_paediatrie_schulkind` + `21a`~~ geliefert 11.11.
3. ~~`ct_lungenembolie`~~ geliefert 11.11.
4. ~~`rx_pneumothorax`~~ geliefert 11.11.
5. ~~`26_pflegeheim_zimmer_tag` + `26a`~~ geliefert 11.11. (5 Heimfälle ohne passendes Zimmer)
6. ~~`30_station_zimmer_frau` + `30b`~~ geliefert 11.11. (Anaphylaxie, Sepsis)
7. ~~`27_station_zweibett_nacht`~~ geliefert 11.11. (Delir)
8. **Zustandslücken aus Abschnitt 3.0** (Sensor ab, Nacht, Bilder nach der Maßnahme, Porträtzustände)
8a. `22_psychiatrie_aufenthaltsraum` + `23_psychiatrie_rueckzugsraum`
9. `24_reha_zimmer`
10. `25_hospiz_zimmer`
11. `28_ambulant_schlafzimmer` und `29_ambulant_wohnzimmer_copd`
12. Varianten `13a`–`13c` (postoperativ: ohne Monitor, Nachblutung, Mobilisation)
13. Animationen `haendedesinfektion`, `psa_anlegen`/`psa_ablegen`, `dosieraerosol_spacer`
14. Unterrichtsmaterial CE06, CE07, CE11 (CE10 Neugeborenes geliefert)
15. Nahansichten `na_wunde_op_verband`, `na_urinbeutel`, `na_haut_steiss`
16. `42_station_bewusstlos` (bewusstlose Person im Bett für „Reanimation üben“)

---

## Anhang A: Fälle, Personen und heutiger Raum

### Praxissimulator (`src/features/praxis/scenarios.json`, Raumzuordnung `raumfotos.ts`)

| Fall | Titel | Person, Alter | Umgebung laut Fall | Raum heute | Gewünscht |
| --- | --- | --- | --- | --- | --- |
| hausbesuch | Die Wohnung ist heute ungewohnt still | Erika Sommer, 79 | Privatwohnung, enger Flur | 07 Wohnzimmer | 07a |
| pflegeheim | Unruhe vor dem Mittagessen | Karl Winter, 83 | Wohnbereich, BZ-Gerät | 11 Speiseraum | 11 passt, Person prüfen |
| nachtwache | Atemnot in der Nacht | Martin Keller, 78 | Internistische Station, Monitorwagen | 12 Kardiologie | 12n (Nacht) |
| zna | Brustdruck am Empfang | Andreas Brandt, 59 | ZNA Triageplatz, EKG | 16 Triage | 16a |
| its | Ein Alarm während der Übergabe | Sabine Fuchs, 67 | ITS, Beatmung, Perfusoren | 15 Intensiv | 15a |
| kind | Ein Kind möchte nicht mehr trinken | Mila Berg, 4 | Kinderstation, Mutter am Bett | **20** (seit 11.11.) | erledigt |
| psychiatrie | Unruhe im Aufenthaltsraum | Leon Weber, 32 | Psychiatrischer Wohnbereich, Rückzugsraum | 11 Speiseraum Heim | **22, 23** |
| reha | Der erste Weg zum Bad | Petra Lind, 64 | Rehazimmer, Rollator, Haltegriffe | 08 Pflegebad ambulant | **24** |
| palliativ | Zeit für ein schwieriges Gespräch | Helene Roth, 88 | Hospizzimmer, Angehörige | 10 Heim nachts | **25** |
| sepsis | Gestern war sie noch klar | Gertrud Hahn, 81 | Internistische Station | **30b** (seit 11.11.) | erledigt |
| nachblutung | Der Verband wird rot | Jonas Wendt, 58 | Unfallchirurgie | 13 postop | 13b |
| schlaganfall | Der Kaffee läuft aus dem Mundwinkel | Bernd Albers, 76 | Wohnbereich, Speisesaal | **26a** (seit 11.11.) | 11a für das Frühstücksereignis |
| anaphylaxie | Juckreiz nach der ersten Infusion | Selin Kaya, 34 | Internistische Station | **30** (seit 11.11.) | erledigt |
| lungenembolie | Plötzlich keine Luft beim ersten Aufstehen | Werner Brandt, 67 | Unfallchirurgie | 12 Kardiologie | 13c |
| delir | Er will mitten in der Nacht nach Hause | Heinrich Vogt, 84 | Zweibettzimmer, Nachbar schläft | **27/27a** (seit 11.11.) | erledigt |
| asthma | Das Spray hilft heute nicht | Ben Yilmaz, 7 | Kinderzimmer, O₂-Anschluss | **21** (seit 11.11.) | erledigt |
| demenz | Frau Kühn isst seit gestern nichts | Ilse Kühn, 89 | Einzelzimmer Wohnbereich | **26b** (seit 11.11.) | erledigt |

### Fallsimulator (`src/features/fall/faelle.ts`, Fotoräume seit PR #101 in `fotoraeume.ts`)

| Fall | Titel | Setting | Gewünschter Raum |
| --- | --- | --- | --- |
| herzinsuffizienz | Atemnot in der Nacht | Krankenhaus | 12n |
| hueft-tep | Erster Tag nach der Hüft-OP | Krankenhaus | 13d |
| hypoglykaemie | Unruhe vor dem Mittagessen | Langzeitpflege | 26h (erledigt) |
| pneumonie | Fieber und Husten | Langzeitpflege | 26p (erledigt) |
| schlaganfall | Plötzlich hängt der Mundwinkel | Krankenhaus | 36 (P3) oder 30 |
| dekubitus | Rötung am Steiß | ambulant | **28** |
| fieberkrampf | Ein Kind mit hohem Fieber (Lina, 2) | Pädiatrie | 20f (erledigt) |
| palliativ | Die letzten Tage | Langzeitpflege | 25 / 10b |
| sepsis | Gestern war sie noch klar | Krankenhaus | 30b (erledigt) |
| nachblutung | Der Verband wird rot | Krankenhaus | 13b |
| copd | Luft holen fällt schwer | ambulant | **29** |
| sturz-nacht | Gefunden neben dem Bett | Langzeitpflege | 10a |
| anaphylaxie | Juckreiz nach der ersten Infusion | Krankenhaus | 30 (erledigt) |
| lungenembolie | Keine Luft beim ersten Aufstehen | Krankenhaus | 13c |
| delir-nacht | Er will mitten in der Nacht nach Hause | Krankenhaus | 27 (erledigt) |
| asthma-kind | Das Spray hilft heute nicht | Pädiatrie | 21 (erledigt) |
| demenz-verfuegung | Frau K. isst seit gestern nichts | Langzeitpflege | 26b (erledigt) |

### Diagnostik (`src/features/diagnostik/faelle.ts`)

| Fall | Raum | Bildgebung heute | Fehlt |
| --- | --- | --- | --- |
| sepsis-pneumonie (Herr Heinz M.) | 12 | Phantom Rx + CT, echtes Rx | echtes CT (P2) |
| lungenembolie | 13 | Phantom CT-Angio, echtes CT-Angio (seit 11.11.) | Raum 13a |
| herzinsuffizienz | 18 | Phantom Rx, echtes Rx (nur Erguss) | Rx mit Stauung (P2), 18a |
| pneumothorax | 17 | Phantom Rx + CT, echtes Rx (seit 11.11.) | echtes CT (P2), 17a |
| ketoazidose (Leon T.) | 16 | Labor/BGA | — |

---

Fragen zur Liste oder Ergänzungen bitte im Projekt-Thread „Fehlende Grafiken und Materialien auflisten“.
Nach einer Lieferung wird diese Datei aktualisiert (gelieferte Positionen nach Abschnitt 1 verschieben).
