# Testdateien

Synthetische Lehrtexte (keine echten Schulbuchinhalte, keine personenbezogenen Daten).

| Datei | Zweck |
| --- | --- |
| `skript_v1.docx` | Word mit Überschriften und harten Seitenumbrüchen, nie in Word gespeichert (Seiten geschätzt) |
| `skript_v2.docx` | wie v1 plus ein neuer Absatz ("Auflage 2") – Versionserkennung |
| `skript_word_gespeichert.docx` | v1 mit `w:lastRenderedPageBreak` wie nach Speichern in Word, Seitenzählung ab 17 |
| `skript_v1.pdf` | v1 als PDF aus LibreOffice, mit Lesezeichen und Seitenzahlen in der Fußzeile |
| `skript_v1_ohne_lesezeichen.pdf` | dasselbe ohne Lesezeichen – Schriftgrößen-Heuristik |
| `pflegeprozess.pptx` | drei Folien mit Titeln und Sprechernotizen |
| `scan_seite1.png` | Seite 1 des PDFs als leicht gedrehtes, unscharfes Bild – OCR |
| `scan.pdf` | dasselbe Bild als PDF ohne Textebene – Scan-Erkennung, Rendern, OCR |

Erzeugt mit python-docx, python-pptx, LibreOffice und Pillow.
