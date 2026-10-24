# Material-Ablage für große Dateien

Stand: 2026-10-24. Seite **Material → Große Dateien** (`#/material/ablage`), Code in `src/features/ablage/`.

## Warum

Der Chat-Upload bei Claude ist auf 30 MB je Datei begrenzt, die GitHub-Weboberfläche auf 25 MB,
und GitHub lehnt Dateien über 100 MB ganz ab. Lehrbücher sind oft größer. Die App lädt deshalb
direkt aus dem Browser (iPhone/iPad genügt) in ein **privates** GitHub-Repo hoch, aus dem
Claude-Threads die Dateien per `git clone` holen.

Urheberrechtlich geschützte Bücher dürfen nie in das öffentliche App-Repo. Die Seite verweigert
den Upload, wenn das Ziel-Repo öffentlich ist.

## Ablauf

- Mehrfachauswahl, beliebig viele und beliebig große Dateien, nacheinander in einer Warteschlange.
- Jede Datei wird in Teile zu höchstens 15 MiB zerlegt (`teil-001`, `teil-002`, …). Dateien bis
  15 MiB liegen unter ihrem (bereinigten) Namen.
- Je Datei ein Ordner `dateien/<name>/` mit `manifest.json` (Originalname, Größe, Kategorie,
  Notiz, SHA-256 jedes Teils) und genau ein Commit über die Git-Data-API.
- Abbruch (Gerät gesperrt, Netz weg): dieselben Dateien erneut wählen. Fertige Dateien
  (gleicher Name und Größe) werden übersprungen, Teile, die GitHub schon hat, nicht erneut gesendet
  (Prüfung per Git-Blob-SHA).
- Während des Uploads hält die Seite den Bildschirm wach (Wake Lock, ab iOS 16.4).
- Beim ersten Verbinden mit einem leeren Repo legt die App `README.md` und `abholen.py` an.

Release-Assets (bis 2 GB) gehen aus dem Browser nicht: `uploads.github.com` erlaubt keine
Anfragen von fremden Webseiten (CORS).

## Einrichtung (einmalig)

1. github.com → **+ → New repository**, z. B. `lernstoff-material`, **Private**, „Add a README file“.
2. Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
   Repository access: *Only select repositories* → nur das Material-Repo.
   Permissions → Repository permissions → **Contents: Read and write**.
3. In der App Repo und Token eintragen. Der Token liegt nur im `localStorage` dieses Geräts und
   ist nicht im Datenexport.
4. Das Material-Repo in den Claude-Projekteinstellungen unter Repositories hinzufügen.

## Für Claude-Threads: Dateien abholen

```sh
git clone --filter=blob:none --sparse https://github.com/<owner>/<material-repo>.git material
cd material
git sparse-checkout set --no-cone '/*' '!/dateien/' '/dateien/*/manifest.json'
python3 abholen.py                  # Übersicht
git sparse-checkout add /dateien/<ordner>/
python3 abholen.py <ordner>         # -> ausgabe/<Originalname>, Prüfsummen geprüft
```

So werden nur die Manifeste und die gewünschte Datei geladen. `abholen.py` liegt im
Material-Repo und hier unter `src/features/ablage/abholen.py`.
