// Teile einer Fachmodul-JSON, erzeugt vom Vite-Plugin „fachmodul-teilen“ (vite.config.ts).
declare module '*.json?kern' { const kern: Record<string, unknown>; export default kern; }
declare module '*.json?gross' { const gross: Record<string, unknown[]>; export default gross; }
