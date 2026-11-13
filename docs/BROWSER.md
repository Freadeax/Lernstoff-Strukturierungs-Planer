# Browser-Unterstützung

Der Lernstoff-Planer läuft vor allem auf iPhone und iPad (Safari, auch als App auf dem Home-Bildschirm),
außerdem in Chrome, Edge und Firefox auf dem Rechner.

## Mindeststand

| Browser | ab |
| --- | --- |
| Safari auf iPhone/iPad | iOS/iPadOS 16.4 |
| Safari auf dem Mac | 16.4 (macOS 13.3) |
| Chrome, Edge | 111 |
| Firefox | 114 |

Das ist das Build-Ziel von Vite 8 („baseline widely available“). Ältere Browser sehen statt einer leeren Seite
einen Hinweis: `public/browser-pruefung.js` läuft als klassisches Skript vor der App, prüft ein paar Kernfunktionen
(Module, Regex-Lookbehind, `structuredClone`, IndexedDB, `CompressionStream`, `:focus-visible`) und startet die App
dann nicht. Bricht das App-Skript beim Einlesen mit einem Syntaxfehler ab, erscheint derselbe Hinweis.

## Safari-Regeln im Code

- Eingabefelder am Touchgerät mindestens 16 px Schrift (sonst zoomt Safari), siehe `@media (pointer: coarse)` in `src/styles.css`.
- `select { contain: layout }`: WebKit machte die ganze Seite seitlich verschiebbar, wenn eine Auswahlliste lange Einträge hatte.
- Aufklapper (`summary`) mit `display: flex/grid`: Safari bis iOS 18.3 zeigt das Dreieck trotzdem (`::-webkit-details-marker`).
  Neue Aufklapper mit eigenem Layout in die Liste in `src/styles.css` aufnehmen.
- Datums- und Zeitfelder: nur auf iPhone/iPad (`@supports (-webkit-touch-callout: none)`) linksbündig und so hoch wie andere Felder.
- Teilen-Menü (`navigator.share`) und Zwischenablage nur direkt aus dem Tipp heraus aufrufen. Muss vorher etwas Langes
  passieren (Sicherung verschlüsseln), gibt `sichereUndGibWeiter` bei `NotAllowedError` die fertige Datei zurück und die
  Seite bietet „Teilen …“ für einen zweiten Tipp an.
- Ton: Web Audio erst nach einer Berührung, `navigator.audioSession` für den Lautlos-Schalter (`src/ui/audio/motor.ts`).
- Höhen mit `100dvh` (mit `100vh` als Rückfall davor), Ränder mit `env(safe-area-inset-*)`.
- CSS-Vorsilben (`-webkit-backdrop-filter`, `-webkit-user-select` …) setzt der Build selbst, im Quelltext reicht die Standardform.

## Prüfen

`npm run check` enthält `scripts/check-browser.mjs`: alle Menüseiten in WebKit (Safari-Kern) und Firefox auf
iPhone- und iPad-Breite, ohne Laufzeitfehler, leere Seiten und seitliches Verrutschen. Die beiden Engines einmalig holen:

```
npx playwright install webkit firefox
```

Fehlt eine Engine, wird sie mit Hinweis übersprungen. Nur eine Engine: `BROWSER=webkit npm run test:browser`.

`scripts/serve-dist.mjs` nimmt lokal `upgrade-insecure-requests` aus der CSP: WebKit schreibt sonst auch
`http://127.0.0.1` auf https um und die Seite bleibt leer. Auf der echten Seite (https) ändert das nichts.

Das Verhalten echter Geräte (Teilen-Menü, Home-Bildschirm-App, Lautlos-Schalter, VoiceOver) lässt sich so nicht
nachstellen, das bleibt ein Test auf dem iPhone.
