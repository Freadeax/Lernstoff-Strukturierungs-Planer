# Asset-Status pro Datei

Automatisch erzeugt aus `src/features/assetstatus/inventar.ts`. Neu erzeugen mit `npm run assets:status`;
der normale Testlauf schlägt fehl, wenn diese Datei nicht mehr zum Code passt.

Spalten: **zugeordnet** = steht im Katalog, **erreichbar** = ein Fall oder eine Seite zeigt die Datei
(über Zuordnung und Zustandsregeln), **geprüft** = fachliche BildFreigabe in `src/features/assetstatus/freigaben.ts`,
**offline** = vorab im Service Worker oder nach dem ersten Ansehen im Laufzeit-Cache. „Vorhanden“ prüft der Test:
jede Datei unter `public/{raeume,personen,sim-videos,bildgebung,titelbilder}` steht hier und umgekehrt.

## Übersicht

| Art | Dateien | erreichbar | geprüft |
|---|---|---|---|
| raum | 34 | 34 | 0 |
| portraet | 2 | 2 | 0 |
| handlungsvideo | 10 | 10 | 0 |
| bildgebung | 35 | 35 | 0 |
| titelbild | 6 | 6 | 0 |

## Mängel aus der Bildprüfung

Keine gemeldet. Prüfen in der App unter System → Bildprüfung (`#/system/bilder`).

## Nicht erreichbar

Keine.

## Zustandslücken der genutzten Räume

Fehlt ein Bild, fällt die Regel auf das nächstpassende Bild zurück (Nacht: Filter über dem Tagbild,
Sensor abgefallen: Bild mit Sensor, der Monitor zeigt den Ausfall). Reihenfolge für neue Lieferungen siehe
`docs/MATERIAL-BEDARF.md`, Abschnitt 3.

| Raum | fehlt |
|---|---|
| `07_ambulant_wohnzimmer_kompression` | Nacht |
| `08_ambulant_pflegebad` | Nacht |
| `09_ambulant_kueche_diabetes` | Nacht |
| `11_pflegeheim_speiseraum` | Nacht |
| `12_station_kardiologie_monitoring` | Sensor angelegt, Sensor abgefallen, Nacht |
| `13_station_postop` | Nacht |
| `15_intensiv_beatmung` | Nacht |
| `16_notaufnahme_triage` | Gerät aus (ohne Monitor), Sensor angelegt, Sensor abgefallen, Nacht |
| `17_notaufnahme_untersuchung` | Gerät aus (ohne Monitor), Sensor angelegt, Sensor abgefallen, Nacht |
| `18_notaufnahme_schockraum_nacht` | Gerät aus (ohne Monitor), Sensor angelegt, Sensor abgefallen |
| `20_paediatrie_kleinkind` | Sensor abgefallen |
| `20f_paediatrie_kleinkind_fieberkrampf` | Gerät aus (ohne Monitor), Sensor angelegt, Sensor abgefallen, Nacht |
| `20n_paediatrie_kleinkind_nacht` | Gerät aus (ohne Monitor), Sensor angelegt, Sensor abgefallen |
| `21_paediatrie_schulkind` | Sensor abgefallen, Nacht |
| `26a_pflegeheim_zimmer_schlaganfall` | Nacht |
| `26b_pflegeheim_zimmer_fruehstueck_unberuehrt` | Nacht |
| `26h_pflegeheim_zimmer_hypoglykaemie` | Nacht |
| `26p_pflegeheim_zimmer_pneumonie` | Nacht |
| `27_station_zweibett_nacht` | Gerät aus (ohne Monitor), Sensor angelegt, Sensor abgefallen |
| `30_station_zimmer_frau` | Sensor abgefallen, Nacht |
| `30b_station_zimmer_frau_sepsis` | Gerät aus (ohne Monitor), Sensor angelegt, Sensor abgefallen, Nacht |

**Porträts:** mila ohne angestrengt und kritisch; ben ohne angestrengt und kritisch (Fallsimulator zeigt dann „stabil“).

## Alle Dateien

### raum

| Datei | Asset | zugeordnet | erreichbar über | geprüft | offline | Lizenz |
|---|---|---|---|---|---|---|
| `raeume/07_ambulant_wohnzimmer_kompression.webp` | 07_ambulant_wohnzimmer_kompression | ja | praxis:hausbesuch, fall:ambulant (Thema) | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/08_ambulant_pflegebad.webp` | 08_ambulant_pflegebad | ja | praxis:reha | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/09_ambulant_kueche_diabetes.webp` | 09_ambulant_kueche_diabetes | ja | praxis:herzschwaeche, fall:dekubitus, fall:copd | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/10_pflegeheim_nacht.webp` | 10_pflegeheim_nacht | ja | praxis:palliativ, fall:palliativ, fall:sturz-nacht | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/11_pflegeheim_speiseraum.webp` | 11_pflegeheim_speiseraum | ja | praxis:pflegeheim, praxis:psychiatrie | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/12_station_kardiologie_monitoring.webp` | 12_station_kardiologie_monitoring | ja | praxis:nachtwache, praxis:lungenembolie, fall:demo-atemnot, fall:herzinsuffizienz, fall:lungenembolie, diagnostik:sepsis-pneumonie, diagnostik:hyperkaliaemie | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/12a_station_kardiologie_ohne_monitor.webp` | 12a_station_kardiologie_ohne_monitor | ja | praxis:nachtwache (Variante), praxis:lungenembolie (Variante), fall:demo-atemnot (Variante), fall:herzinsuffizienz (Variante), fall:lungenembolie (Variante), diagnostik:sepsis-pneumonie (Variante), diagnostik:hyperkaliaemie (Variante) | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/13_station_postop.webp` | 13_station_postop | ja | praxis:nachblutung, fall:demo-nachblutung, fall:demo-schlaganfall, fall:hueft-tep, fall:nachblutung, fall:schlaganfall, fall:krankenhaus (Thema), diagnostik:lungenembolie, diagnostik:gi-blutung | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/14_station_isolation.webp` | 14_station_isolation | ja | hygiene:isolierung | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/15_intensiv_beatmung.webp` | 15_intensiv_beatmung | ja | praxis:its | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/16_notaufnahme_triage.webp` | 16_notaufnahme_triage | ja | praxis:zna, diagnostik:ketoazidose | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/17_notaufnahme_untersuchung.webp` | 17_notaufnahme_untersuchung | ja | diagnostik:pneumothorax | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/18_notaufnahme_schockraum_nacht.webp` | 18_notaufnahme_schockraum_nacht | ja | diagnostik:herzinsuffizienz, notfall:reanimation | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/19_krankenhaus_materialraum.webp` | 19_krankenhaus_materialraum | ja | hygiene:material | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/20_paediatrie_kleinkind.webp` | 20_paediatrie_kleinkind | ja | praxis:kind, diagnostik:gastroenteritis-kind | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/20a_paediatrie_kleinkind_ohne_monitor.webp` | 20a_paediatrie_kleinkind_ohne_monitor | ja | praxis:kind (Variante), diagnostik:gastroenteritis-kind (Variante) | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/20m_paediatrie_kleinkind_monitor_verbunden.webp` | 20m_paediatrie_kleinkind_monitor_verbunden | ja | praxis:kind (Variante), diagnostik:gastroenteritis-kind (Variante) | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/20n_paediatrie_kleinkind_nacht.webp` | 20n_paediatrie_kleinkind_nacht | ja | praxis:kind (Variante), praxis:bronchiolitis | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/20f_paediatrie_kleinkind_fieberkrampf.webp` | 20f_paediatrie_kleinkind_fieberkrampf | ja | fall:demo-fieberkrampf, fall:fieberkrampf | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/21_paediatrie_schulkind.webp` | 21_paediatrie_schulkind | ja | praxis:asthma, praxis:rausch, fall:demo-asthma, fall:asthma-kind, fall:paediatrie (Thema), diagnostik:asthma-kind | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/21a_paediatrie_schulkind_ohne_monitor.webp` | 21a_paediatrie_schulkind_ohne_monitor | ja | praxis:asthma (Variante), praxis:asthma (Maßnahme orders) (Variante), praxis:rausch (Variante), fall:demo-asthma (Variante), fall:asthma-kind (Variante), fall:paediatrie (Thema) (Variante), diagnostik:asthma-kind (Variante) | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/21b_paediatrie_schulkind_spacer.webp` | 21b_paediatrie_schulkind_spacer | ja | praxis:asthma (Maßnahme orders) | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/21m_paediatrie_schulkind_monitor_verbunden.webp` | 21m_paediatrie_schulkind_monitor_verbunden | ja | praxis:asthma (Variante), praxis:rausch (Variante), fall:demo-asthma (Variante), fall:asthma-kind (Variante), fall:paediatrie (Thema) (Variante), diagnostik:asthma-kind (Variante) | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/26_pflegeheim_zimmer_tag.webp` | 26_pflegeheim_zimmer_tag | ja | fall:langzeit (Thema) | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/26a_pflegeheim_zimmer_schlaganfall.webp` | 26a_pflegeheim_zimmer_schlaganfall | ja | praxis:schlaganfall | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/26b_pflegeheim_zimmer_fruehstueck_unberuehrt.webp` | 26b_pflegeheim_zimmer_fruehstueck_unberuehrt | ja | praxis:demenz, fall:demenz-verfuegung | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/26h_pflegeheim_zimmer_hypoglykaemie.webp` | 26h_pflegeheim_zimmer_hypoglykaemie | ja | fall:demo-hypo, fall:hypoglykaemie | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/26p_pflegeheim_zimmer_pneumonie.webp` | 26p_pflegeheim_zimmer_pneumonie | ja | fall:pneumonie | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/27_station_zweibett_nacht.webp` | 27_station_zweibett_nacht | ja | praxis:delir, fall:delir-nacht, diagnostik:akutes-nierenversagen | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/27a_station_zweibett_nacht_niedrigbett_sturzmatte.webp` | 27a_station_zweibett_nacht_niedrigbett_sturzmatte | ja | praxis:delir (Maßnahme niedrigbett) | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/30_station_zimmer_frau.webp` | 30_station_zimmer_frau | ja | praxis:anaphylaxie, fall:demo-anaphylaxie, fall:anaphylaxie | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/30a_station_zimmer_frau_ohne_monitor.webp` | 30a_station_zimmer_frau_ohne_monitor | ja | praxis:anaphylaxie (Variante), fall:demo-anaphylaxie (Variante), fall:anaphylaxie (Variante) | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/30m_station_zimmer_frau_monitor_verbunden.webp` | 30m_station_zimmer_frau_monitor_verbunden | ja | praxis:anaphylaxie (Variante), fall:demo-anaphylaxie (Variante), fall:anaphylaxie (Variante) | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `raeume/30b_station_zimmer_frau_sepsis.webp` | 30b_station_zimmer_frau_sepsis | ja | praxis:sepsis, fall:demo-sepsis, fall:sepsis | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |

### portraet

| Datei | Asset | zugeordnet | erreichbar über | geprüft | offline | Lizenz |
|---|---|---|---|---|---|---|
| `personen/praxis-kind_stabil.webp` | mila:stabil | ja | praxis:kind | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `personen/praxis-asthma_stabil.webp` | ben:stabil | ja | praxis:asthma, fall:asthma-kind, fall:demo-asthma | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |

### handlungsvideo

| Datei | Asset | zugeordnet | erreichbar über | geprüft | offline | Lizenz |
|---|---|---|---|---|---|---|
| `sim-videos/insulingabe.mp4` | insulingabe | ja | praxis:lernclips | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `sim-videos/insulingabe-1.webp` | insulingabe:phase1 | ja | praxis:lernclips | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `sim-videos/insulingabe-2.webp` | insulingabe:phase2 | ja | praxis:lernclips | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `sim-videos/insulingabe-3.webp` | insulingabe:phase3 | ja | praxis:lernclips | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `sim-videos/insulingabe-4.webp` | insulingabe:phase4 | ja | praxis:lernclips | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `sim-videos/kompressionsstrumpf.mp4` | kompressionsstrumpf | ja | praxis:hausbesuch, praxis:lernclips | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `sim-videos/kompressionsstrumpf-1.webp` | kompressionsstrumpf:phase1 | ja | praxis:hausbesuch, praxis:lernclips | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `sim-videos/kompressionsstrumpf-2.webp` | kompressionsstrumpf:phase2 | ja | praxis:hausbesuch, praxis:lernclips | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `sim-videos/kompressionsstrumpf-3.webp` | kompressionsstrumpf:phase3 | ja | praxis:hausbesuch, praxis:lernclips | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `sim-videos/kompressionsstrumpf-4.webp` | kompressionsstrumpf:phase4 | ja | praxis:hausbesuch, praxis:lernclips | offen | nach erstem Ansehen | KI-generiert aus Philipps Materialpaket, Nutzung in der App |

### bildgebung

| Datei | Asset | zugeordnet | erreichbar über | geprüft | offline | Lizenz |
|---|---|---|---|---|---|---|
| `bildgebung/pneumonie-rx/rontgen-pa.jpg` | pneumonie-rx | ja | diagnostik:sepsis-pneumonie | offen | nach erstem Ansehen | CC BY-NC-SA 3.0, Case courtesy of Assoc Prof Frank Gaillard, Radiopaedia.org, rID: 11009 |
| lungenembolie-ct (32 Dateien) | lungenembolie-ct | ja | diagnostik:lungenembolie | offen | nach erstem Ansehen | CC BY 4.0, Germán González Serrano, CAD-PE Fall 001 (über CADS-Dataset) |
| `bildgebung/erguss-rx/rontgen-pa.jpg` | erguss-rx | ja | diagnostik:herzinsuffizienz | offen | nach erstem Ansehen | CC BY-NC-SA 3.0, Case courtesy of Dr Henry Knipe, Radiopaedia.org, rID: 44224 |
| `bildgebung/pneumothorax-rx/rontgen-pa.jpg` | pneumothorax-rx | ja | diagnostik:pneumothorax | offen | nach erstem Ansehen | CC BY-SA 3.0, Hellerhoff, Wikimedia Commons |

### titelbild

| Datei | Asset | zugeordnet | erreichbar über | geprüft | offline | Lizenz |
|---|---|---|---|---|---|---|
| `titelbilder/01_heute.webp` | heute | ja | bereich:heute | offen | vorab | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `titelbilder/02_lernorganisation.webp` | lernen | ja | bereich:lernen | offen | vorab | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `titelbilder/03_material.webp` | material | ja | bereich:material | offen | vorab | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `titelbilder/04_trainer.webp` | ueben | ja | bereich:ueben | offen | vorab | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `titelbilder/05_simulation.webp` | simulation | ja | bereich:simulation | offen | vorab | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
| `titelbilder/06_system.webp` | system | ja | bereich:system | offen | vorab | KI-generiert aus Philipps Materialpaket, Nutzung in der App |
