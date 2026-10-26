# Praxissimulator: Architektur, Stand und Entwicklungsregister

Stand: 26.10.2026. Dieses Dokument ist das zentrale Register für den neuen Praxissimulator und die Anforderungen des ergänzenden Master-Prompts. Es ersetzt keine medizinische Freigabe. Der bestehende Claude-Text-Fallsimulator und die schriftliche Prüfungssimulation bleiben eigenständige, unveränderte Module.

## Bestandsaufnahme und abgeschlossenes Arbeitspaket

Die Anwendung besteht bereits aus React, TypeScript, Vite, Dexie/IndexedDB, lokaler Datensicherung, Vitest, Playwright und einer über `main` veröffentlichten GitHub-Pages-PWA. Es gibt Lernplan, Rechentrainer, Pflegeplanung, Assessment-, Berichts-, SIS- und Übergabetrainer. Diese Angebote werden nicht durch einen zweiten Anwendungsrahmen ersetzt. Der vorhandene Text-Fallsimulator erzeugt seine Welt über Claude; die Prüfungssimulation kombiniert vorhandene Lernquellen. Beides ist keine autonome Patienten-Engine.

Das erste neue Arbeitspaket heißt **KI-freier Simulationskern und technischer Referenzfall**. Der Einstieg ist `#/lernen/praxis`. Enthalten sind ein Einzelpatient, eine explizite Uhr, deterministische Zustandsänderungen, verzögerte Aufträge, Medikamenten-Rechenprüfung, Protokoll, Wiederherstellung, Replay, Dokumentation und Debriefing. „Atemnot in der Nacht“ ist der technische Referenzfall. Acht weitere Fälle erschließen unterschiedliche Arbeitsumgebungen als **fachlich ungeprüfte Szenariovorschauen**, nicht als vollständig validierte Fachmodule.

**Statusbegriffe:** Implementiert bedeutet im Code nutzbar. Technisch getestet bezieht sich ausschließlich auf tatsächlich ausgeführte technische Prüfungen. Fachlich ungeprüft ist der Status aller derzeitigen medizinischen Modelle. Fachlich freigegeben ist derzeit kein Fall. Geplant bezeichnet unten beschriebene, noch nicht verfügbare Funktionen.

## Modulgrenzen und Zielarchitektur

Der vorhandene modulare Monolith wird erweitert. Heute läuft der neue Core lokal und benötigt keine KI, Terminologie-API oder Netzwerkverbindung für Entscheidungen. Ein späteres Backend wird denselben Core serverseitig ausführen; der Browser wird dann nur eine zulässige Projektion des verbindlichen Zustands erhalten.

- `src/features/praxis/types.ts`: versionierte Szenario-, Patienten-, Befehls-, Ereignis- und Sitzungsverträge.
- `scenarios.json`: synthetische Ausgangsfälle und einrichtungsspezifische Erzähl- und Befunddaten.
- `catalog.ts`: Ressourcenprofile, Zusammenstellung der Aktionsmodule, Lernkriterien und begrenzte Fallmodelle.
- `engine.ts`: virtueller Einsekunden-Takt, Command-Verarbeitung, Berechtigungsbedingungen im Übungsfall, Warteschlange, Reaktionen, Ereignisse, Replay und Bewertung.
- `quantity.ts`: ganzzahlige Dezimalbruchrechnung für die Dosis-/Volumenprüfung.
- `storage.ts`: JSON-Validierung, Referenzprüfung, lokale Snapshots, Archiv und Dateiexport. Schema-Prüfung und Persistenz werden bei Erweiterung der Formate in separate Dateien aufgeteilt.
- `tracking.ts`: lokaler, pseudonymer xAPI-Statement-Entwurf ohne LRS-Verbindung.
- `Praxissimulator.tsx` / `praxis.css`: austauschbare 2D-Oberfläche; verändert den Patienten ausschließlich über Commands.

Die nächste fachliche Erweiterung trennt den Core weiter in Patientenmodell, medizinische Regeln, Diagnostik, Arzneimittel, Pflegeplanung, Kommunikation, Dokumentation und Bewertung. Keine dieser Schichten darf React oder einen Cloudanbieter voraussetzen. Keine KI darf verbindliche Zustände direkt schreiben.

### ADR-001: Bestehenden Stack erhalten

React/Vite bleibt bestehen. Ein Wechsel zu Next.js, Tailwind, shadcn oder einer weiteren State-Bibliothek bietet für das erste lokale Arbeitspaket keinen ausreichenden Nutzen. Das vorhandene Designsystem, Routing, PWA und die Tests werden weiterverwendet. Ein zukünftiges API-Backend wird getrennt deployt; GitHub Pages kann kein Authentifizierungs- oder Datenbankbackend ausführen.

### ADR-002: Öffentliche technische Vorschau ist keine Fachfreigabe

Das neue Modul bezeichnet sich in Auswahl, laufender Sitzung und Datenmodell als fachlich ungeprüft. Technische Tests dürfen den fachlichen Status nicht erhöhen. Eine spätere geprüfte Bibliothek benötigt eine separate Veröffentlichungsfreigabe. Alle aktuellen Fälle sind synthetisch; Originalmaterial des privaten Material-Repositories wird weder importiert noch veröffentlicht.

### ADR-003: Kein vorgetäuschtes Backend

Der aktuelle Gastmodus speichert auf dem Gerät. Es gibt keine Konten, Organisationen, Rollenprüfung auf einem Server, Cloudverschlüsselung oder Mandantenfähigkeit. Lokale Freigabe-Flags simulieren Arbeitsabläufe und sind **keine Sicherheitsgrenze**. Der öffentliche Organisationsbetrieb wird erst nach Implementierung und Prüfung seiner gesamten Vertrauenskette aktiviert.

## Patienten- und Szenariodatenmodell

`Scenario.version = 1` enthält ID, Titel, Einrichtung, Lernfokus, Pseudonym, Alter, Gewicht, Anamnese, SBAR-Ausgangsübergabe, Allergien, Organfunktionshinweis, Startparameter, zeitliche Veränderungen, Untersuchungsbefunde, Gesprächsantworten, Aktionen, Medikamentenauftrag, Quellen und Bewertungskriterien.

Die physiologischen Zahlen sind typisierte Werte für Puls, systolischen und diastolischen RR, SpO₂, AF, Temperatur, BZ und Schmerz. `Session.vitals` ist der interne Zustand; `Session.measured` ist der zuletzt erhobene Befund mit Messzeitpunkt. Ohne Messung wird kein Zahlenwert angezeigt. Ein angeschlossenes Monitoring aktualisiert die sichtbaren Messwerte mit dem Takt.

Das Modell besitzt eine Kennung, eine Modellversion, Genauigkeitsgrad `didactic`, Prüfstatus `unreviewed` und Quellen. Ein lokaler Import kann keine Fachfreigabe behaupten. Die spätere redaktionelle Statusmaschine wird Entwurf, technisch geprüft, fachlich ungeprüft, fachlich freigegeben, Überarbeitung erforderlich und zurückgezogen mit Autor, Prüfer, Datum und Quellenversion abbilden.

Die aktuelle Modellversion ist bewusst begrenzt. **Noch nicht strukturiert vorhanden:** Geschlecht, Größe, Pflegegrad, Diagnoselisten, vollständige Medikamentenanamnese, Bewusstsein, Pupillen, Bilanz, Ausscheidung, gerätespezifischer Zustand und organspezifische Funktionen. Pflegerische Ressourcen und Ziele stehen teilweise in Falltext und Kriterien; ein vollständiger Pflegeplan ist noch nicht Teil des Patientenaggregats.

Für Version 2 werden getrennte Bereiche `identity`, `history`, `physiology`, `nursing`, `orders`, `observations`, `devices` und `careLocation` benötigt. Beobachtungen unterscheiden Wert, Einheit, Methode, Probe, Erhebungszeit, Befundzeit und Quelle. Verordnungen und Gaben werden getrennte Entitäten mit stabilen IDs. Bei einer Verlegung ändert sich der Versorgungsort, nicht die Patientenidentität oder bisherige Historie. Die Migration muss bestehende Version-1-Sitzungen ausdrücklich behandeln; stilles Umdeuten gespeicherter Daten ist ausgeschlossen.

## Zeit, Ereignisse, Kausalität und API-Vertrag

`start(scenario, level, seed)` erzeugt einen unabhängigen Anfangszustand. `dispatch(session, command, commandId?)` ist die gemeinsame Schreibgrenze. `replay(session)` spielt das gespeicherte Befehlsjournal gegen den eingefrorenen Szenariostand erneut ab. Es gibt keine echten REST-Endpunkte; die aktuelle Versionierung bezieht sich auf die internen Datenverträge.

Unterstützte Commands: `action`, `advance`, `medication`, `note`, `sbar`, `finish`. Eine erneut zugestellte explizite Command-ID wird nicht erneut ausgeführt. Einmalige Aktionen und Arzneimittelgaben besitzen zusätzliche fachablaufbezogene Doppelverarbeitungssperren. Wiederholungsmessungen sind ausdrücklich erlaubt.

Zeitfortschritt wird in festen Einsekunden-Schritten verarbeitet. Jeder Schritt prüft fällige Aufträge und Hintergrundereignisse; große Zeitsprünge überspringen daher keine Fälligkeit. Browser-Timer fordern lediglich explizite virtuelle Schritte an. Sie bestimmen keine medizinische Echtzeitgarantie. Gedrosselte oder ausgeschaltete Browser holen keine unkontrollierten Wandzeitintervalle nach. Die Uhr beginnt nach Laden und Wiederaufnehmen pausiert und pausiert bei ausgeblendeter Seite. Handlungen benötigen unabhängig von dieser Pause ihre angezeigte virtuelle Dauer.

Wiederholte reine Zeitbefehle werden im Journal zusammengefasst, maximal bis zur Schrittgrenze von einem Tag pro Command. Der Seed steuert aktuell nur nichtmedizinische Hintergrundablenkungen in der ZNA. Medizinische Komplikationswahrscheinlichkeiten sind noch nicht implementiert. Gleicher Szenariostand, gleicher Seed und gleiche Befehle ergeben gleichen Zustand und Verlauf.

Ereignisse haben fortlaufende IDs, virtuelle Zeit, Typ, Titel und Inhalt. Aufträge speichern ihren Anforderungsbezug und den Zustand beim Anforderungs-/Entnahmezeitpunkt; die Ergebnisverknüpfung ist noch nicht als vollständiger Kausalitätsgraph modelliert. Der komplette Zustand wird lokal gespeichert, einschließlich Aufträgen, Seed und Journal. Das letzte Ergebnis wird nicht durch Öffnen einer Ansicht neu erzeugt.

Der spätere API-Vertrag benötigt `/api/v1/sessions`, serverseitig erzeugte Sitzungen, versionierte Command-Envelopes, Idempotency-Key, erwartete Zustandsrevision, atomare Validierung/Änderung/Event-Commit und eine reine Leseprojektion. Zwei konkurrierende Commands dürfen nicht auf derselben Revision erfolgreich schreiben. Netzwerk-Retries dürfen keine doppelte Gabe erzeugen. WebSocket-Nachrichten informieren über bestätigte Revisionen und ersetzen keine Autorisierung.

## Diagnostik- und Medikamentenkonzept

### Bereits nutzbar

Einrichtungsprofile steuern Monitoring, PoCT, Zentrallabor, Bildgebung und Geräteaktionen. Ärztliche Anordnung ist eine explizite Voraussetzung; Rücksprache und Befunde haben getrennte Fälligkeiten. Zentrallabor benötigt in den Vorschauen 45 virtuelle Minuten, PoCT 2 und Bildgebung 20. Diese Zeiten sind **didaktische Konfigurationen**, keine allgemeinen Versorgungsstandards. Einzelmessungen behalten ihren Erhebungszeitpunkt.

Die BGA-, EKG-, Labor- und Röntgenausgaben sind synthetische Textbefunde. Sie sind im aktuellen Paket keine vollständigen zustandsabhängigen Labor- oder Bildmodelle. Es gibt keine echten Kurvenbilder, Sounds oder DICOM-Daten. Ein gespeicherter Probe-Snapshot ist die Grundlage für die spätere zustandsabhängige Ergebnisberechnung, ersetzt sie aber nicht.

Der Referenzfall enthält eine fiktive, feste ärztliche Einzelanordnung für Furosemid. Geprüft werden Anordnung, vollständige 8-R-Checkliste, dokumentierte identische Wirkstoffallergie, Dosis, Volumen, Applikationsweg, Mindestdauer und Zubehör. Fehler werden sichtbar abgefangen und protokolliert, statt eine beliebige klinische Katastrophe zu erfinden. Das ist ein Sicherheitsworkflow, noch keine Simulation gefährlicher Fehlgaben oder allergischer Kreuzreaktionen.

Die Dosis-/Volumenrechnung bildet Dezimalzahlen als BigInt-Brüche ab. Die Trainings-Rundung ist ausdrücklich 0,01 ml, kaufmännisch; sie ist keine Aussage über die Eignung realer Spritzen oder Präparate. Es wird keine Dosis aus Gewicht oder eGFR empfohlen. Applikationswege in der Auswahl sind Distraktoren und keine pauschale Verabreichungsfreigabe.

Die verzögerte Arzneimittelreaktion nutzt einen **szenariobegrenzten, fachlich ungeprüften Zielkorridor**. Veränderung und Richtung hängen vom zum Wirkungseintritt aktuellen Wert ab und sind nach oben begrenzt. Es ist kein universeller Effekt eines Wirkstoffs und kein validiertes PK-/PD-Modell. Wirkeintritt und langsame Anwendung orientieren sich an den unten verlinkten Fachinformationen; konkrete Zielwerte und Reaktionsstärke sind didaktische Modellparameter. Eine Nachkontrolle zählt erst nach Eintritt der Modellwirkung.

### Nächste getrennte Ausbauschritte

Diagnostik erhält Anforderung, Material, Probe, Entnahme, Transport, Analyse, Befund, Einheit, Methoden-/Laborreferenzbereich, Fehlerquelle und didaktische Interpretation als getrennte Daten. Ergebnisse werden aus dem Zustand bei Entnahme abgeleitet und unveränderlich versioniert. Messbedingungen, Fehlmessung, Gerätestörung und Wiederholungsprobe brauchen eigene Ereignisse.

Arzneimittel-Stammdaten, patientenbezogene Verordnungen und tatsächliche Gaben werden getrennt. Stammdaten benötigen Gruppen, Indikationen, Kontraindikationen, Nebenwirkungen, Interaktionen, Organfunktionsbezug, Quellen und Prüfdaten. Gewichtsbezug, mg/g/ml, Infusionsrate, Tropfen, Verdünnung und zeitbezogene Dosierungen erhalten ein Einheitenmodell mit expliziten Rundungsregeln. Bestehende Rechentrainer-Aufgaben werden auf fachliche Wiederverwendbarkeit geprüft.

Infusionen benötigen eigenes Volumen, Lösung, Zugang, Laufgeschwindigkeit, Unterbrechung, Okklusion, Bilanz und Überwachung. Beatmung, Dialyse und Katecholamine dürfen nicht durch ein dekoratives Gerätepanel vorgetäuscht werden. Schwere Fehlgaben, Interaktionen und Anaphylaxie folgen erst mit geprüften, zeitlich plausiblen Regelmodellen. Keine sofortige Katastrophe allein wegen eines einzelnen falschen Klicks.

## Anforderungs- und Modulregister

Die Nummern entsprechen den Themenblöcken des Master-Prompts. Alle Punkte bleiben Bestandteil des Projektziels; dieses erste Paket erhebt keinen Vollständigkeitsanspruch.

1. **Einsatzgebiete und Zielgruppen:** Neun Pflegebereiche als Vorschau vorhanden. Betreutes Wohnen, spezialisierte Stationen, IMC, OP/Aufwachraum, Präklinik und Gerontopsychiatrie erhalten eigenständige Ressourcenprofile und Referenzfälle; Geburtshilfe später. Verlegungen, multiprofessionelle Zielgruppen und personen-/organisationsbezogene Kompetenzprofile sind geplant. Heute wird ausschließlich eine angeleitete Pflegeausbildungssituation simuliert, keine allgemeine gesetzliche Befugnis aus einer Berufsbezeichnung abgeleitet.
2. **Gesamtarchitektur:** Bestehender modularer Monolith, strenge TS-Typen, Lazy Loading und reine Engine implementiert. API, DB-Migrationen, Transaktionen, serverseitige Rollen, Umgebungen und zentrale Observability sind Backend-Arbeitspakete. Die Oberfläche nutzt vorhandene lokal gebündelte Schriften und Hell-/Dunkel-Tokens. WCAG 2.2 AA ist das Ziel; automatisierte Axe-Prüfungen sind nur ein Teilnachweis, keine Zertifizierung. Inhalte liegen zentral, eine vollständige i18n-Schicht ist noch offen.
3. **Simulationskern:** Virtuelle Uhr, Schrittverarbeitung, Warteschlange, Journal, Snapshot, Seed, idempotente IDs und Replay implementiert. Einsekunden-Schritte sind keine physiologische Hochfrequenzsimulation. Verzweigungen entstehen aktuell aus Zeit, Versorgung, Anordnungen und Modellwirkung; eine deklarative allgemeine medizinische Regel-/Komplikationssprache und ein erweitertes Patientenmodell fehlen noch.
4. **Szenarien:** Versioniertes JSON, Modellmetadaten, Import/Export und lokale Vorschau vorhanden. Import prüft Werte, Größen, doppelte IDs, unbekannte Voraussetzungen, zyklische Abhängigkeiten und doppelte Kriterien. Endbedingungen, allgemeine Regelgraphen, Multimorbiditätsmodelle, formale Prüfungsvarianten und mehrere Patienten sind weitere Pakete.
5. **Diagnostik:** Messwerte, verzögerte Anordnungen und synthetische Textbefunde vorhanden. Vollständige Laborkataloge mit Transport-/Probenworkflow, Methodenreferenzen, dynamischen Ergebnissen, EKG-/Bildbibliothek und später DICOM sind offen. Rechtmäßige Lizenzierung und Anonymisierung sind Freigabebedingungen für Bildinhalte.
6. **Medikamente:** Ein vollständiger technischer Rechen-/Gabe-/Nachkontrollworkflow vorhanden. Umfassende Arzneimitteldatenbank, getrennte Verordnungsaggregate, vollständige Einheitenbibliothek, Infusionen, Interaktionen und organabhängige Pharmakologie sind offen. Quellenprüfung und Fachfreigabe sind zwingende Abhängigkeiten.
7. **Pflege:** Fallbezogene Positionierung, Mobilisation, Trinken, Mundpflege, Deeskalation, Hygiene und Evaluation vorhanden. Vollständiger Pflegeprozess und Katalog für Körperpflege, Ernährung, Ausscheidung, Inkontinenz, Wunden, Kompression, Hautbeobachtung, Schmerz, Delir und alle genannten Prophylaxen folgen als versionierte Maßnahmenmodule. Vorhandene Pflegeplanung und Assessment-Trainer werden vor Doppelimplementierung geprüft. Braden, Barthel, Ernährungs- und Delirinstrumente sowie DNQP-Inhalte benötigen Lizenz-/Versionsprüfung; es wird keine gültige Integration behauptet.
8. **Kommunikation:** Strukturierte Patient-/Angehörigenantworten, Einwilligung, Teamkontakt und SBAR-Eingaben vorhanden. Freitext ist dokumentierbar, wird aber nicht als klinisch verstanden ausgegeben. Semantische Bewertung, ISBAR, emotionale Zustände, Rückfragen, Sprachbarrieren und weitere Berufsgruppen sind offen. Optionale spätere KI bleibt ein kontrollierter Dialogadapter ohne Schreibzugriff auf den Patienten-Core.
9. **Arbeitsumgebung:** Responsiver 2D-Arbeitsplatz, Monitor, Akte, Aktionsgruppen, Medikation, Zeit, Aufträge und Timeline vorhanden. Die Zimmergrafik ist schematisch; funktionale Buttons öffnen/bedienen die echten Aktionen. 3D und VR sind optionale spätere Oberflächenadapter, kein aktuelles Versprechen.
10. **Dokumentation:** Zeitgestempelte, additive Berichte, SBAR, Anordnungen, Befunde und Gaben vorhanden. Noch keine Benutzeridentität: Urheberschaft ergibt sich nur aus der lokalen Sitzung. Korrekturen/Nachträge mit Referenz zum Original, strukturierte Diagnosen, Wund- und Bilanzdokumentation, Entlassung und Verlegung fehlen. Bestehende Notizen werden nicht unbemerkt überschrieben.
11. **Lernsystem:** Drei Ausbildungsstufen steuern Tempo und sichtbare Lernziele. Reproduzierbare Kriterien mit Zeitbezug, Fehlerprotokoll, Reflexionsfragen, Quellen und Wiederholungsmöglichkeit vorhanden. Keine Prüfungstauglichkeit oder Kompetenzzertifizierung. Fachliche Priorisierung, verschiedene zulässige Lösungspfade, Alternativen, Team-/Prüfungsmodus und individualisierte Lernempfehlungen brauchen geprüfte Bewertungsmodelle.
12. **Konten und Organisationen:** Lokaler Gastmodus und gerätebezogenes Archiv vorhanden. Alle serverseitigen Rollen von Gast bis Plattformverwaltung sind geplant; eine Person kann mehrere organisationsbezogene Rollen haben. Cloudsync, Gruppen und Fallbibliotheken benötigen echte Authentifizierung, serverseitige Autorisierung und DB-Zugriffsschutz.
13. **Fall-Editor:** Funktionierende JSON-Werkstatt, Vorlagen, Dateieinlesen, Schema-/Referenzprüfung und Teststart vorhanden. Ein visueller Editor mit grafischen Ereignissen, medizinischer Regelkonfliktprüfung und redaktioneller Veröffentlichung ist geplant. Die JSON-Werkstatt wird nicht als fertiges visuelles CMS bezeichnet.
14. **Standards:** Interne Version 1, ATC am Beispiel und LOINC für Pulsoximetrie vorhanden. xAPI-Entwurf exportiert pseudonyme Ereignisse ohne Berichtstexte; keine geprüfte LRS-/SCORM-Konformität. ICD-10-GM, FHIR, weitere LOINC-Zuordnungen und DICOM werden erst mit konkretem Nutzen, passender Version und geprüften Nutzungsrechten angebunden. Keine Laufzeitabhängigkeit von externen Terminologiediensten.
15. **Sicherheit und Validierung:** Synthetische Patienten, lokale Datenminimierung, begrenzter JSON-Import, React-Textdarstellung und manuelle Exporte vorhanden. Lokale Daten sind nicht verschlüsselt und nicht manipulationssicher. Die Anwendung darf keine realen Patientendaten aufnehmen. Auth, API-/DB-Autorisierung, RLS, Rate Limits, verschlüsselte Speicherung, Löschfristen, verlässliche Audit-Urheber und sichere Administration sind Voraussetzungen des späteren öffentlichen Kontobetriebs.
16. **Tests:** Vitest für Engine, Replay, Idempotenz, Seed, Grenzen, Gates, Medikationsfehler und Dezimalrechnung. Playwright für den vollständigen Referenzworkflow bei 390, 820 und 1440 Pixeln, Hell/Dunkel, Axe, Wiederaufnahme, Export und bestehenden Text-Fallsimulator. API-, DB-, Migration-, Mandanten- und Berechtigungstests können erst gegen ihre echten Implementierungen erfolgen. Fachliche Referenztests und Prüfung durch Fachpersonen stehen aus.
17. **Dokumentation und Organisation:** Dieses zentrale Register enthält Bestandsaufnahme, ADRs, Datenmodell, API-Ziel, Zeitkonzept, Freigaben, Roadmap und Akzeptanzkriterien. Zusätzliche Einzeldokumente entstehen erst, wenn sie eigenständige Inhalte haben. Status bleibt am Code nachvollziehbar.
18. **Arbeits- und Git-Regeln:** Aktuelles `origin/main`, beide Remotes abrufen, fremde Arbeitskopien erhalten, technische Prüfungen, nachvollziehbarer Commit, Integration/Push nach `main` und Überprüfung der Pages-Auslieferung. Keine privaten Originale im öffentlichen Build.
19. **Erweiterungen:** KI-Varianten, Patientengespräche, Multiplayer, Schicht-/Ressourcenplanung, Stationsübersicht, Körpermodelle, EKG-/Wundbibliothek, Dokumentationsprüfung, Lehrer-Liveansicht, alternative Replays, Fallpakete, Mehrsprachigkeit und Fachmoduladapter bleiben im Register. Priorisierung erfolgt nach Lernnutzen, medizinischer Relevanz, Abhängigkeiten, Risiko und Wartungsaufwand. Offlinefähigkeit ist durch die vorhandene PWA und die netzunabhängige Engine vorbereitet; explizite Offline-End-to-End-Prüfung bleibt ein eigener Nachweis.
20. **Startanweisung:** Bestandsaufnahme, Zielarchitektur, Modulregister, Version-1-Modell, Zeit-/Ereigniskonzept, Diagnose-/Medikationskonzept, Roadmap und erstes begrenztes Arbeitspaket sind hier verbunden. Neue Anforderungen erweitern diese Grundlage und lösen keine isolierte zweite Simulator-App aus.

## Roadmap und Abhängigkeiten

**P0 – Technischer Kern und Referenzfall (dieses Paket):** oben beschriebene lokale Funktionen, Testläufe, klarer Prüfstatus, Dokumentation und Veröffentlichung als technische Vorschau. Keine medizinische Freigabe.

**P1 – Fachlich prüfbarer Referenzfall:** qualifizierte pflegerische und medizinische Prüfer, versionierte Modellparameter und Quellen; strukturierter Bewusstseinszustand, Bilanz und pflegerische Ziele; getrennte Arzneimittel-/Verordnungs-/Gabeaggregate; zustandsabhängige Laborergebnisse; mehrere vertretbare Wege und klinisch begründete Eskalation. Abnahme: fachlich unterschriebene Referenzverläufe, inklusive Verzögerung, Fehlentscheidung und Wiederherstellung. Keine bloße technische Umbenennung von `unreviewed` nach `approved`.

**P2 – Gemeinsamer Versorgungsverlauf:** vollständige Ressourcen-/Kompetenz-/Dokumentationsprofile für alle 15 genannten Einsatzbereiche; Übergaben erhalten Patienten-ID, Medikamente, Proben, offene Aufgaben und Historie. Abnahme: ambulant → Rettungsdienst → ZNA → Station/ITS als zusammenhängender Verlauf; keine Doppelgabe nach Transfer. Geburtshilfe bleibt spätere Erweiterung mit eigenen geprüften Modellen.

**P3 – Öffentliche Lernplattform:** Backend-/Hostingentscheidung, PostgreSQL-Schema und Migrationen, Auth, Organisationen und Mitgliedschaften, Rollen je Einrichtung, serververbindlicher Zustand, atomare Commands, RLS/gleichwertige Zugriffssicherung, Löschung/Export, Audit, Rate Limits und Sync-Konflikte. Abnahme: automatisierte Negativtests zwischen zwei Organisationen; kein Client kann eigene Rollen setzen, fremde Sitzungen lesen oder verborgene Falllösungen abrufen. Keine Secrets im Browser. Infrastruktur mit Kosten oder Kontobindung wird erst nach konkreter Auswahl eingerichtet.

**P4 – Redaktions- und Lernbetrieb:** visueller Editor, technische/medizinische Prüfstrecke, versionierte Fallbibliothek, Lehrkraftansicht, Prüfungsmodus, differenzierte Bewertung und echte LMS-Adapter. Abnahme: veröffentlichte Fallversion unveränderlich, Rückzug möglich, laufende Sitzungen behalten ihre freigegebene Version, LRS-/SCORM-Integration gegen reale Zielsysteme getestet.

**P5 – Komplexe Simulation:** mehrere Patienten, Teamzustand, Ressourcenplanung, Gerätemodelle, Pumpen/Beatmung/Dialyse, interprofessionelle Zusammenarbeit und kontrollierte Dialogadapter. Abnahme umfasst Konkurrenz, Wiederverbindung, Berechtigungen, Gerätefehler und fachliche Plausibilität. 3D/VR und zusätzliche Sprache nur bei erhaltenem Core-Vertrag.

## Akzeptanzkriterien des ersten technischen Referenzfalls

1. Neue Route und Navigation ohne API-Schlüssel; alter Text-Fallsimulator unverändert erreichbar.
2. Anfang ohne verratene Messwerte; Messung und Dauermonitor unterscheiden Zeitpunkt und Aktualisierung.
3. Gleiche Startdaten, Seed und Commands ergeben nach Replay denselben Zustand, Verlauf und Bewertung.
4. Pause/Wiederaufnahme ohne unkontrollierte Wandzeitfortschreibung; Zeitraffer verarbeitet jede Fälligkeit.
5. Keine Diagnostik oder Gabe ohne hinterlegte Freigabe; Ergebnisse kommen genau einmal.
6. Medikationsfehler bei Dosis, Volumen, Weg, Dauer, Zubehör oder 8-R-Prüfung verändern den Patienten nicht und bleiben nachvollziehbar.
7. Korrekte Gabe nur einmal; Modellwirkung verzögert, kontextabhängig und begrenzt; Nachkontrolle zählt erst danach.
8. SBAR und Bericht werden mit virtueller Zeit additiv gespeichert; fehlende semantische Bewertung ist sichtbar.
9. Abschluss sperrt weitere Commands; Debriefing zeigt erfüllte, verspätete und offene Kriterien, Warnungen und offene Aufträge.
10. Speichern/Wiederaufnahme, Archiv, JSON-Export und ein lokal angepasster Fall funktionieren; ungültige bzw. zyklische Daten werden verworfen.
11. Technische Browserprüfung bei 390/820/1440 Pixeln, Hell/Dunkel, ohne Seitenüberlauf und ohne Axe-Befunde in den geprüften Zuständen.
12. Alle klinischen Modelle tragen einen ungeprüften Status. Die Vorschau darf nicht als validierter Goldstandard oder Prüfungssystem ausgegeben werden.

## Ausführbare Prüfungen und Grenzen

`npm test`, `npm run typecheck`, `npm run build`, `npm run test:ui` und `npm run test:praxis` sind die lokalen Prüfungen. Für Browserprüfungen muss der Server laufen; `UI_BASE_URL` setzt die Zieladresse. Die Praxissuite verwendet standardmäßig Port 5187 und legt Screenshots und Axe-Berichte unter `.ui-check/praxis/` ab. Testresultate werden im Entwicklungsabschluss mit tatsächlichen Zahlen berichtet, nicht vorab in dieser Architekturdatei behauptet.

Der neue Code enthält keine Benutzerkonten, kein LRS, keinen klinischen KI-Dienst und keinen Zugriff auf privates Material. Das lokale Journal ist für Reproduzierbarkeit gedacht, nicht als fälschungssicherer Prüfungsnachweis. Freitexte können versehentlich persönliche Daten enthalten; beim vollständigen JSON-Export werden sie mitgesichert, beim xAPI-Entwurf nicht.

## Quellen und fachliche Freigaben

Quellenabruf: 26.10.2026. Quellen unterstützen einzelne Grundprinzipien; sie validieren nicht das gesamte Modell. Das konkrete Reaktionsmodell muss vor fachlicher Freigabe unabhängig geprüft werden.

- [Resuscitation Council UK: ABCDE Approach](https://www.resus.org.uk/library/abcde-approach), dort ausgewiesen aktualisiert Juli 2024: strukturiertes Beurteilen, erneute Beurteilung und frühzeitige Unterstützung.
- [AHRQ: TeamSTEPPS Tools](https://www.ahrq.gov/teamstepps-program/resources/modules/index.html): SBAR und strukturierte Kommunikation.
- [emc: Furosemide 20 mg/2 ml, SmPC](https://www.medicines.org.uk/emc/product/14419/smpc): produktspezifische langsame Anwendung. Kein allgemeines Dosierungsschema für die App.
- [emc: Furosemide 20 mg/2 ml, SmPC](https://www.medicines.org.uk/emc/product/101893/smpc): produktbezogene Angaben zum Wirkungseintritt und zur Elimination.
- [JBDS: Management of Hypoglycaemia in Adults with Diabetes, 2023](https://www.diabetes.org.uk/sites/default/files/2023-03/JBDS%2001%20Hypo%20Guideline%20with%20qr%20code.pdf): Ausgangspunkt für spätere fachliche Prüfung des Hypoglykämiefalls, nicht für pädiatrische Übertragung.
- [LOINC 59408-5](https://loinc.org/59408-5): Terminologiebezug der Pulsoximetrie. Keine umfassende LOINC-Lizenz-/Versionsintegration behauptet.
- [ADL: xAPI Data Specification](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md): Struktur des Statement-Entwurfs. Kein Interoperabilitätsnachweis gegen ein LRS.

Ausstehende Freigaben: alle Fallverläufe, Ziel-/Grenzwerte, Pflegehandlungen, Kompetenzauslegung, Medikamentenwirkungen, Eskalationsregeln und klinische Bewertung. Prüfer und Prüfdaten dürfen erst nach tatsächlicher Prüfung ergänzt werden.
