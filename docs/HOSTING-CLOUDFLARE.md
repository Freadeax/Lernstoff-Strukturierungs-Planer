# Veröffentlichung über Cloudflare Pages

Warum: Cloudflare Pages liefert die Sicherheitsheader aus `public/_headers` mit (Content Security Policy,
Schutz vor fremder Einbettung, nosniff, Referrer- und Permissions-Policy). GitHub Pages kann das nicht.
Außerdem bekommt der Planer eine eigene Adresse und teilt den Browser-Speicher nicht mehr mit anderen
Projekten unter `freadeax.github.io`. Cloudflare baut direkt aus dem Repo, es braucht keine GitHub Actions.

## Einrichtung (einmalig, ca. 10 Minuten)

1. Auf <https://dash.cloudflare.com> ein kostenloses Konto anlegen.
2. **Workers & Pages → Erstellen → Pages → Mit Git verbinden** (engl. „Connect to Git“).
   GitHub anmelden und der Cloudflare-App **nur** das Repository `Lernstoff-Strukturierungs-Planer` freigeben.
   Heißt der Bereich anders, unter „Pages“ nach „Import an existing Git repository“ suchen.
3. Einstellungen:
   - Projektname: `lernstoff-planer` (ergibt `https://lernstoff-planer.pages.dev`; ist er vergeben, einen anderen wählen)
   - Produktionszweig: `main`
   - Framework: keins oder „Vite“
   - Build-Befehl: `npm run build`
   - Ausgabeverzeichnis: `dist`
   - Node-Version kommt aus `.nvmrc` (22). Falls Cloudflare eine ältere nimmt: Umgebungsvariable `NODE_VERSION` = `22`.
4. **Speichern und bereitstellen.** Der erste Build dauert ein paar Minuten.
5. Empfohlen: unter **Einstellungen → Builds → Branch-Bereitstellungen** nur `main` bereitstellen,
   damit Arbeitszweige keine eigenen öffentlichen Vorschau-Adressen bekommen.
6. Die neue Adresse an Claude geben. Dann wird sie in `src/core/hosting.ts` (`NEUE_ADRESSE`) eingetragen.

## Was danach passiert

- Claude prüft auf der neuen Adresse, ob alle Header ankommen und die App offline startet.
- Mit `NEUE_ADRESSE` zeigt die alte Adresse oben einen Umzugshinweis mit Anleitung.
- **Lernstand mitnehmen:** Der Browser trennt die Daten je Adresse, es geht nur über eine Sicherung:
  alte Adresse → Datensicherung → Sicherung erstellen (gern mit Passwort) → neue Adresse öffnen,
  zum Home-Bildschirm hinzufügen → Sicherung einspielen → API-Schlüssel und „Große Dateien“ neu eintragen
  → alte App vom Home-Bildschirm löschen.
- Wenn alle Geräte umgezogen sind, kann GitHub Pages abgeschaltet werden (`.github/workflows/pages.yml` löschen,
  Settings → Pages → deaktivieren). Bis dahin bleibt die alte Adresse erreichbar.

## Prüfen

`npm run check` liefert `dist/` über `scripts/serve-dist.mjs` aus, der die Header aus `_headers` genau wie Cloudflare
setzt. Alle Browser-Prüfungen laufen damit unter der echten CSP, `scripts/check-csp.mjs` prüft zusätzlich alle
Seiten und einen PDF-Scan-Import (pdf.js-Worker, Tesseract-WASM im Blob-Worker) auf Verstöße.
Neue externe Dienste müssen in `connect-src` in `public/_headers` stehen, sonst blockiert der Browser sie.
