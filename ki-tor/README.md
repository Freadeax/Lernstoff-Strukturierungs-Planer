# KI-Tor

Kleiner Cloudflare Worker, über den der Lernstoff-Planer KI anbieten kann, **ohne dass Nutzer einen eigenen Schlüssel brauchen**. Er nutzt das kostenlose Tageskontingent von Cloudflare Workers AI (offene Modelle, Standard: Mistral Small 3.1).

## Schutz und Kosten

- Nur feste Aufgaben (`src/aufgaben.ts`): Rolle im Gesprächssimulator, Freitext zuordnen, Rückmeldung. Die Systemanweisungen stehen hier, nicht in der App. Ein allgemeiner Chatbot ist das Tor nicht.
- Nur Anfragen von den Adressen in `ERLAUBTE_HERKUNFT`.
- Limit je Gerät und Tag (`LIMIT_GERAET`, Standard 20) und gesamt je Tag (`LIMIT_GESAMT`, Standard 300). Zähler in einem Durable Object (SQLite), ohne Inhalte, Geräte-Kennung nur gehasht.
- Optional: Klassen-Zugangscode (`ZUGANGSCODE`) und Cloudflare Turnstile (`TURNSTILE_SECRET`), beide als Secret.
- Ist das Gratis-Kontingent von Workers AI aufgebraucht, antwortet das Tor mit „Kontingent für heute aufgebraucht“. Auf dem kostenlosen Workers-Tarif entsteht dabei keine Rechnung. Bei einem bezahlten Workers-Tarif deckelt `LIMIT_GESAMT` den Verbrauch.
- Keine Protokolle (`observability` aus), keine Speicherung von Texten.

## Veröffentlichen

Einmalig, aus diesem Ordner, mit einem Cloudflare-Konto:

```
npx wrangler@4 login        # oder CLOUDFLARE_API_TOKEN setzen
npx wrangler@4 deploy
```

Danach in `src/core/ki/tor.ts` `KI_TOR_AKTIV = true` setzen (Adresse prüfen) und `public/_headers` (connect-src) muss die Worker-Adresse enthalten.

Zugangscode setzen (optional): `npx wrangler@4 secret put ZUGANGSCODE`.

## Testen

`npx vitest run ki-tor` (Kontingent mit `node:sqlite`, Workers AI als Attrappe).
