# Töne, Geräusche und Vorlesen

Alle Klänge der App entstehen zur Laufzeit im Gerät (Web Audio API). Es gibt keine Audiodateien:
nichts zu laden, offline sofort da, keine Lizenzfragen, kein Einfluss auf die Startgröße.
Vorlesen nutzt die Sprachausgabe des Geräts (Web Speech API), ebenfalls offline.

## Baustein `src/ui/audio`

| Datei | Aufgabe |
| --- | --- |
| `einstellungen.ts` | Store `audioEinstellungen` (Hauptschalter, Lautstärke, Kategorien `ui`/`sim`/`atmo`, Lautlos-Modus, Stimme, Tempo). Schlüssel `lernstoff.audio`, je Gerät, nicht in der Sicherung. |
| `motor.ts` | Ein `AudioContext` für die App, je Kategorie ein Regler, sanfter Begrenzer. Entsperrt bei der ersten Berührung (iOS), pausiert im Hintergrund. |
| `synth.ts` | Bausteine: `ton`, `rauschen`, `dauerRauschen`, `dauerTon`. |
| `klaenge.ts` | Klangbibliothek (Rezepte + Texte). Zeitmuster `ALARM_MUSTER`, `herzZyklus`, `atemZyklus`, `piepFrequenz` sind getestet. Zuordnungen `raumFuerSetting`, `alarmKlang`, `klangZuBefund`. |
| `spieler.ts` | `spiele(id, p?, o?)` einmalig, `starteSchleife(id, p?, o?)` mit Vorausplaner, `.setze(p)` ändert Puls/SpO₂ ohne Neustart. |
| `useKlang.ts` | `useSchleife(id \| null, p)`: läuft, solange `id` gesetzt und die Kategorie hörbar ist. |
| `SimTon.tsx` | Ein Baustein für alle Simulatoren: Monitorpiep, Alarm nach Stufe, Telefon, Patientenruf, technischer Alarm, Raumklang, Schalter „Ton“. |
| `HoerBeispiel.tsx` | Abspielknopf für ein einzelnes Hörbeispiel. |
| `Vorlesen.tsx`, `vorlesen.ts` | Knopf „Vorlesen“, Aufteilung in kurze Abschnitte (iOS bricht lange Texte ab), `sprechbar()` für Abkürzungen, `markdownAlsText()`. |
| `Klangeinstellungen.tsx` | Bereich „Töne und Vorlesen“ in den Einstellungen (nachgeladen). |

## Regeln

- **Abschaltbar:** automatische Töne laufen nur, wenn Hauptschalter und Kategorie an sind. Abspielknöpfe
  (Hör-Trainer, Probehören, „Befund anhören“) spielen mit `{ erzwingen: true }` trotzdem, weil ausdrücklich angetippt.
- **iPhone/iPad:** Ton startet erst nach einer Berührung. Wo Ton direkt auf einen Tipp folgen soll, im Handler
  `entsperre()` aufrufen. Standard ist die Audio-Sitzung `ambient` (Lautlos-Schalter gilt, Musik läuft weiter);
  „Auch im Lautlos-Modus abspielen“ setzt `playback`.
- **Kein Ton ist nie ein Fehler:** ohne Web Audio liefern `spiele`/`starteSchleife` still `null`.
- **Startgröße:** der Baustein wird nur von nachgeladenen Seiten importiert. Nicht in `App.tsx`, `Shell` oder Widgets der Startseite importieren.
- **Körpergeräusche** sind vereinfachte Nachbildungen der Merkmale (immer so kennzeichnen). Echte Aufnahmen: `docs/MATERIAL-BEDARF.md`, Abschnitt 9.

## Wo was klingt

| Ort | Klänge |
| --- | --- |
| Alle Quiz-Trainer (`quiz/Runde.tsx`: Hygiene, Anatomie, Arzneimittel, Normwerte, Notfall, Labor, Recht, Expertenstandards) | richtig, teilweise, falsch, Runde geschafft / Ziel erreicht; Frage und Erklärung vorlesen |
| Karteikarten | Umdrehen, Bewertung, Sitzung fertig; Karte vorlesen |
| Rechentrainer, Fachbegriff-Duell, Prüfungssimulation, mündliches Examen | Rückmeldung, Auflösung, Zeit abgelaufen, Ende der Vorbereitungszeit |
| Praxissimulator | `SimTon` im Arbeitsplatz (Monitor, Alarm aus `szene().alarm`, Telefon, Raumklang je Setting), „Befund anhören“ nach der Auskultation |
| Fallsimulator | `SimTon` (Monitor, Alarm aus `gesamtAlarm`, Telefon, Raumklang je Raumfoto/Setting), Rückmeldeton je Wertung, Situation vorlesen |
| Labor und Bildgebung | `SimTon` (Monitor, Alarm, Telefon Zentrallabor, technischer Alarm bei Sensorausfall) |
| Skript, Krankheitsbilder | Abschnitt / Steckbrief vorlesen |
| Hör-Trainer `#/lernen/hoeren` | Hörbeispiele, Quiz „Was hörst du?“, Blutdruck nach Gehör (Korotkow) |

## Neuen Klang anlegen

Eintrag in `KLAENGE` (klaenge.ts) mit `id`, `titel`, `gruppe`, `kategorie`, `text`, für Lernklänge `merkmal`,
`schleife` und `takt(w, t, p, z)`: plant ein Ereignis ab Zeit `t` und gibt den Abstand zum nächsten zurück.
Dauerklänge (Lüftung, Stethoskop) in `start()` mit `dauerRauschen`/`dauerTon` anlegen, sie werden beim Stoppen beendet.
Neue Lernklänge der Gruppen Herz/Lunge/Darm/Alarm/Gerät erscheinen automatisch im Hör-Trainer.
