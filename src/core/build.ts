// Build-ID der laufenden App (Commit und Datum), eingesetzt von vite.config.ts. Hilft bei Fehlerberichten
// und zeigt, ob iPhone und Rechner dieselbe Version haben (PWA-Aktualisierung angekommen?).
declare const __BUILD_ID__: string | undefined;
export const BUILD_ID: string = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'Entwicklung';
