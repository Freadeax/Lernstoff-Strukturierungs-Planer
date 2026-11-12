# Veröffentlichung über Cloudflare Pages

Warum: Cloudflare Pages liefert die Sicherheitsheader aus `public/_headers` mit (Content Security Policy,
Schutz vor fremder Einbettung, nosniff, Referrer- und Permissions-Policy). GitHub Pages kann das nicht.
Außerdem bekommt der Planer eine eigene Adresse und teilt den Browser-Speicher nicht mehr mit anderen
Projekten unter `freadeax.github.io`. Cloudflare baut direkt aus dem Repo, es braucht keine GitHub Actions.

## Stand

Eingerichtet am 2026-11-11: Projekt `lernstoff-planer`, Adresse <https://lernstoff-planer.pages.dev/>, verbunden mit
`Freadeax/Lernstoff-Strukturierungs-Planer`, Produktionszweig `main`, Build `npm run build`, Ausgabe `dist`,
`NODE_VERSION` = 22, keine Vorschau-Bereitstellungen für andere Zweige. Angelegt per Cloudflare-API
(`POST /accounts/{id}/pages/projects` mit `source.type = github`); dafür muss die Cloudflare-GitHub-App einmal im
Dashboard verbunden sein. Hinweis: `wrangler pages project create` legt in neueren Versionen stattdessen einen Worker an
und schreibt Projektdateien um, also nicht verwenden.

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
- **Stand 2026-11-12: Beide Adressen laufen vorerst parallel weiter**, beide bekommen jeden Stand von `main`.
  Der Umzugshinweis ist deshalb aus (`UMZUG_HINWEIS_AKTIV = false` in `src/core/hosting.ts`). Für den späteren Umzug
  auf `true` stellen, dann zeigt die github.io-Adresse oben einen Umzugshinweis mit Anleitung.
- **Lernstand mitnehmen (wenn umgezogen wird):** Der Browser trennt die Daten je Adresse, es geht nur über eine Sicherung:
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

## Release prüfen (nach jedem Merge auf `main`)

1. Cloudflare baut den Stand selbst (Dashboard → Workers & Pages → `lernstoff-planer` → Deployments, oder per API
   `GET /accounts/{id}/pages/projects/lernstoff-planer/deployments`). Status muss `deploy: success` sein.
2. **Build-ID vergleichen:** Einstellungen → „Über diese App“ (oder Datensicherung) zeigt `App-Version: <commit> · <datum>`.
   Der Commit muss dem gemergten Stand von `main` entsprechen. Cloudflare setzt ihn aus `CF_PAGES_COMMIT_SHA`.
3. **Header und Offline-Start live:**
   ```bash
   UI_BASE_URL=https://lernstoff-planer.pages.dev/ node scripts/check-csp.mjs
   UI_BASE_URL=https://lernstoff-planer.pages.dev/ node scripts/check-offline.mjs
   ```
   `check-csp.mjs` prüft die Header am Hauptdokument, an `sw.js` und am Manifest (CSP, nosniff, Rahmen-Schutz,
   Permissions-Policy, `no-cache` für Updates) und lädt danach alle Seiten und einen PDF-Scan-Import ohne CSP-Verstoß.
   In Claude-Umgebungen mit Proxy zusätzlich `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` setzen.

## Begründete Ausnahmen

- **Mikrofon** ist für die eigene Adresse erlaubt (mündliche Prüfung, Diktat in der Übergabe), **Kamera** ist aus.
  Begründung steht in `public/_headers`. Der Browser fragt vor jeder Mikrofonnutzung nach.
- **`Access-Control-Allow-Origin: *`** setzt Cloudflare für die öffentlichen Dateien selbst. Das betrifft nur die
  ohnehin öffentlichen App-Dateien. Lerndaten liegen im Browser (IndexedDB) und sind über HTTP gar nicht erreichbar.
- **Netzwerk-Fehlerseiten** von Cloudflare (z. B. bei Störungen) kommen von Cloudflare, nicht aus der App.
  Cloudflare verarbeitet dabei wie jeder Hoster IP-Adresse und Anfrage-Metadaten.
- **`npm audit`: 4 niedrige Einträge zu `deepmerge`** (GHSA-gcqx-w48m-w2h4, Prototyp-Manipulation in `mergeObject`).
  Kette: `vite-plugin-pwa` → `workbox-build` → `@rollup/plugin-node-resolve` → `deepmerge` 4.3.1. Es gibt keine
  korrigierte Version; `npm audit fix --force` würde `vite-plugin-pwa` auf 0.2.1 zurückwerfen und die PWA zerlegen.
  `deepmerge` läuft nur beim Bauen und verarbeitet dort ausschließlich unsere eigene `vite.config.ts`, nichts aus dem
  Netz und keine Nutzereingaben. Es landet nicht in der ausgelieferten App. Bewertung: kein Handlungsbedarf, bei
  jedem Update von `vite-plugin-pwa`/`workbox-build` erneut `npm audit` ansehen.
