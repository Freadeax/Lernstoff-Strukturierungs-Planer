# Konsolidierung auf main

Stand: 26. Oktober 2026. Ausgangspunkt: `4a9a1b1401e6dc16db034c7c4330eeacbc915249`.

## Ergebnis und Vorgehen

- Alle entfernten Branches wurden nach Commit-Abstammung, Patch-Gleichheit und bei abweichenden Patches anhand der betroffenen Dateien geprüft.
- Die meisten Funktionen waren bereits per Squash-Merge auf main enthalten. Ihre ursprünglichen Branch-Commits werden zusätzlich als Merge-Eltern in der Historie erhalten; neuere Implementierungen auf main bleiben maßgeblich.
- Tatsächlich fehlend: Klassenmodus mit QR-Codes und Vorlagen aus Übergabe- und Pflegebericht-Trainer. Dieser Stand wurde regulär gemerged.
- Zusätzlich übernommen: geprüfter lokaler Zwischenstand für ZIP-/Materialimport, Themenzuordnung mit Kapitelstruktur, eigene Themen in Board und Lernplan sowie abschnittsweise Zusammenfassung großer Quellen. Lokale Ausgangsdateien werden nicht überschrieben.
- gh-pages enthält generierte Veröffentlichungen, keinen zusätzlichen App-Quellcode. Seine Historie bleibt erhalten, die Veröffentlichung erfolgt künftig als Pages-Artefakt direkt von main.
- Vor der Bereinigung wurden alle Git-Referenzen in einem lokalen Git-Bundle und uncommittete Dateien separat unter `.qa/main-konsolidierung-2026-10-26/` außerhalb des öffentlichen Repositorys gesichert.

## Geprüfte Branches

- `claude/project-thread-2gzi8b` (`8908861583ef7dd8ef5e8b50fa73ea6bb5032bb8`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-6ke157` (`4eb6e77b2e1aecd7eb821ff064e1c18401e4b859`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-6osm6b` (`5441a2400deb19b02ea6546204fc9a3cafebe141`): Dateiunterschiede geprüft: Funktionen enthalten, spätere Erweiterungen auf main erhalten.
- `claude/project-thread-741teh` (`b57bc1d210e62eea9ae75c6208cbe4533a12db71`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-9l7wxz` (`473ea268cbb66604f99aa9adaca3e521438ed780`): Dateiunterschiede geprüft: Funktionen enthalten, spätere Erweiterungen auf main erhalten.
- `claude/project-thread-a5t2wl` (`b216c04947ba0f18ca129dd45df42945e7e7befc`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-artbz6` (`feb717d35ed9cc47f117a69f19bf6d28b43321c9`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-c9md9g` (`748d0cf542aa901bcead5b0c8916cc73e8901114`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-hmi9aj` (`8aebe09f81d95d63c60820a161f24999debcf357`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-hskyst` (`abc4e55fe03c1697f31ddeb69c63b067a60096ee`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-icejpk` (`3eac689eec5bcb596ff4d6ef6d66902ccebf6691`): Dateiunterschiede geprüft: Funktionen enthalten, spätere Erweiterungen auf main erhalten.
- `claude/project-thread-k21l9z` (`4ebe41c04eb60511be5badfd9d805949236d5180`): Fehlende QR-Codes und zusätzliche Trainervorlagen integriert.
- `claude/project-thread-kvx2nk` (`745c63fcc2eeeadbd84ff70fdbc1ac04daf50419`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-mtixy9` (`5ed0d0b10889d9638642fff7d6dce6890facdc7b`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-oimj6q` (`da3912fee2b8a7815b46acc405d744aeb839a68f`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-qxm58q` (`2589776ac93cbb57a8d3f4bd9802718e782711d8`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-s2kjs5` (`e67c6810c5a1405e56dbf335ae57d9f5a209f396`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-sjrl0s` (`4465c437341d632c83bebc6fede6cbbbc802c2b3`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-xbenwk` (`412c1ca11e0dc86e312456296c18b2cdfcbac951`): Vollständig enthalten oder patchgleich bereits übernommen.
- `claude/project-thread-xdb6hw` (`e2ecf4b587e96c56b7098cb3c217631681a7f2ef`): Dateiunterschiede geprüft: Funktionen enthalten, spätere Erweiterungen auf main erhalten.
- `feat/lernarbeitsplatz-ui` (`149375869715ac38f5a5ab74f1c8a2b613d33a3b`): Dateistand identisch mit dem ursprünglichen main; kein zusätzlicher Quellcode.
- `feature/dokumentimport` (`96433957394ad36b73a018a90135c31ba3622522`): Vollständig enthalten oder patchgleich bereits übernommen.
- `feature/lernplan-logik` (`7dfe20ed8aa1686409bd78b9975c0936c657882b`): Vollständig enthalten oder patchgleich bereits übernommen.
- `feature/oberflaeche-integration` (`310786f625c1f768f308757698a5c41f05500c3b`): Vollständig enthalten oder patchgleich bereits übernommen.
- `feature/zusammenfasser-qualitaet` (`f7383d93dd6c94379ecbfe17889cd84f58177e2b`): Dateiunterschiede geprüft: Funktionen enthalten, spätere Erweiterungen auf main erhalten.
- `fix/mindmap-ueberlauf` (`731cb40716797c94341d82cbcc76fda66b396927`): Vollständig enthalten oder patchgleich bereits übernommen.
- `gh-pages` (`7c673eb7d2382e3a12c60856783609ec1661fe25`): Generierte Website; ersetzt durch Veröffentlichung direkt von main.
- `pflege-fachkatalog` (`19984c15e155d3148e98a1dc2841424e7671ad15`): Vollständig enthalten oder patchgleich bereits übernommen.
- `release/lernarbeitsplatz-ui` (`979fc525843e981bbd2b8f12eb73a7b2beec975b`): Vollständig enthalten oder patchgleich bereits übernommen.

## Weiterentwicklung

- main ist der einzige dauerhafte Branch und der Standardbranch.
- Keine parallelen Release-, Publish- oder gh-pages-Branches nötig.
- Vor Integration Tests und Produktionsbuild ausführen; Änderungen an der Oberfläche zusätzlich für Handy, iPad und Desktop prüfen.
- GitHub Pages wird über `.github/workflows/pages.yml` nach einem Push auf main aktualisiert. Veröffentlichungsfehler sind im Actions-Lauf sichtbar; nach erfolgreichem Deployment die Live-Seite prüfen.
- Das private Material-Repository bleibt eigenständig. Keine Material-Originale oder Zugangsdaten in dieses öffentliche Repository aufnehmen.

## Validierung

- `npm test`: 37 Testdateien, 411 Tests bestanden.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich, PWA generiert. Vite meldet weiterhin große JavaScript-Bundles als Optimierungshinweis.
- `npm run test:ui`: alle geprüften Desktop-/Handy-Abläufe erfolgreich; keine Laufzeitfehler und keine automatisiert erkannten WCAG-Verstöße auf den geprüften Seiten.
- `npm run test:material`: Browserimport, Themenpool, Zusammenfasser-Verlinkung, privater Repo-Abruf und Assistent-Sicherung bei 390, 820 und 1280 Pixeln bestanden. GitHub-Schreibzugriffe dabei ausschließlich simuliert.
- Parallel auf main fertiggestellter Material-Stand ab0f06 regulär nachgezogen; zusätzliche Kapitelhierarchie-Prüfung und Sammelimport neuer Repo-Dateien erhalten. Der Sammelimport wurde im iPad-Ablauf geprüft.
- Zusätzliche QR-Prüfung bei 390, 820 und 1440 Pixeln: Fall anlegen, Code anzeigen, SVG-Inhalt prüfen, Escape schließen; ohne Überlauf oder Laufzeitfehler.
- Browserprüfungen mit installiertem Chrome in neuen, isolierten Browserkontexten.
