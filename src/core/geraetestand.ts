// Gerätestand: große Lernstände liegen seit DB-Version 8 in IndexedDB statt im localStorage (Audit C-3).
//
// Warum: localStorage ist auf rund 5 MB begrenzt, hat keine Versionierung und weiß nichts von anderen Fenstern.
// Wie: Beim Start (main.tsx) werden die Schlüssel aus UMGEZOGEN einmalig aus dem localStorage in die Tabelle
// `geraetestand` übernommen und danach dort entfernt. Ab dann liest die App sie aus einem Zwischenspeicher im
// Arbeitsspeicher (synchron wie bisher, die Module ändern sich nicht) und schreibt im Hintergrund in die Datenbank.
// Andere Fenster erfahren Änderungen sofort über einen BroadcastChannel (Audit C-4).
//
// Zugriff nur über `geraet` (gleiche Methoden wie localStorage) oder `storage` aus ui/lib/store.ts.
// Ohne IndexedDB (alte Browser, gesperrter Speicher) bleibt alles im localStorage wie vorher.
// In der Datensicherung erscheinen die Einträge weiter unter `local`, das Format ändert sich nicht.

import { db as standardDb, type LernstoffDB } from './db';

export const GERAETESTAND_TABELLE = 'geraetestand';

/** Lernstände, die in der Datenbank liegen. Neue große Lernstände hier eintragen (oder gleich eine eigene Tabelle). */
export const UMGEZOGEN: ReadonlySet<string> = new Set([
  // Mindmaps und ihre Fassungen
  'lernstoff.mindmaps', 'lernstoff.mindmaps.fassungen',
  // Lehrermodus (Namen und Noten Lernender) und Klassenmodus
  'lernstoff.lehrer.klassen', 'lernstoff.lehrer.bewertungen', 'lernstoff.lehrer.schluessel', 'lernstoff.lehrer.bausteine',
  'lernstoff.lehrer.mitNote', 'lernstoff.lehrer.radar', 'lernstoff.lehrer.radar.ohneNamen',
  'lernstoff.klasse.eigene', 'lernstoff.klasse.abgaben', 'lernstoff.klasse.erhalten', 'lernstoff.klasse.arbeit', 'lernstoff.klasse.rueckmeldungen',
  // Dokumentation: Entwürfe und beste Ergebnisse (auch Grundlage der Fallakte)
  'lernstoff.sis.entwuerfe', 'lernstoff.sis.beste', 'lernstoff.pflegeplanung.entwuerfe', 'lernstoff.pflegeplanung.beste',
  'lernstoff.bericht.entwuerfe', 'lernstoff.bericht.beste', 'lernstoff.uebergabe.beste',
  'lernstoff.fallakte.evaluation.entwuerfe', 'lernstoff.fallakte.evaluation.beste',
  // Simulatoren und Prüfungen: Archive und Verläufe
  'lernstoff.praxis.arbeitsplatz', 'lernstoff.praxis.archiv', 'lernstoff.fall.archiv', 'lernstoff.simulation.verlauf',
  'lernstoff.diagnostik.laeufe', 'lernstoff.examen.muendlich', 'lernstoff.examen.praktisch', 'lernstoff.qm.meldungen',
  // Praxiseinsatz
  'lernstoff.einsaetze', 'lernstoff.tagebuch', 'lernstoff.nachweis',
]);

type Hoerer = (key: string) => void;

function ls(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

function meldeFehler(e: unknown) {
  // Der Speicherwächter (ui/shell/speicherwaechter.ts) hört auf Fehlerereignisse und meldet vollen Speicher.
  try { (globalThis as { reportError?: (e: unknown) => void }).reportError?.(e); } catch { /* nur melden */ }
}

export class Geraetestand {
  /** null: nicht gestartet oder ohne Datenbank, dann gilt der localStorage. */
  private cache: Map<string, string> | null = null;
  private offen = new Map<string, string | null>();
  private kette: Promise<void> = Promise.resolve();
  private geplant = false;
  private kanal: BroadcastChannel | null = null;
  private hoerer = new Set<Hoerer>();
  private start: Promise<void> | null = null;

  private readonly kanalName: string;
  constructor(private readonly database: LernstoffDB = standardDb) { this.kanalName = `lernstoff-geraetestand:${database.name}`; }

  /** Liegt dieser Schlüssel gerade in der Datenbank? */
  zustaendig(key: string): boolean { return this.cache !== null && UMGEZOGEN.has(key); }
  get aktiv(): boolean { return this.cache !== null; }

  getItem(key: string): string | null {
    if (this.zustaendig(key)) return this.cache!.get(key) ?? null;
    return ls()?.getItem(key) ?? null;
  }

  setItem(key: string, wert: string): void {
    if (!this.zustaendig(key)) { const s = ls(); if (!s) throw new Error('Kein Gerätespeicher'); s.setItem(key, wert); return; }
    if (this.cache!.get(key) === wert) return;
    this.cache!.set(key, wert);
    this.vormerken(key, wert);
  }

  removeItem(key: string): void {
    if (!this.zustaendig(key)) { ls()?.removeItem(key); return; }
    if (!this.cache!.has(key)) return;
    this.cache!.delete(key);
    this.vormerken(key, null);
  }

  /** Alle Schlüssel: localStorage und Datenbank (für Datensicherung und „alles löschen“). */
  schluessel(): string[] {
    const out = new Set<string>();
    const s = ls();
    try { if (s) for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k) out.add(k); } } catch { /* privater Modus */ }
    if (this.cache) for (const k of this.cache.keys()) out.add(k);
    return [...out];
  }

  /** Wird aufgerufen, wenn ein anderes Fenster einen Lernstand geändert hat (Datenbank oder localStorage). */
  beiFremderAenderung(h: Hoerer): () => void {
    this.hoerer.add(h);
    return () => { this.hoerer.delete(h); };
  }

  /** Wartet, bis alle Änderungen in der Datenbank stehen (vor dem Neuladen nach dem Einspielen einer Sicherung). */
  async gespeichert(): Promise<void> {
    while (this.offen.size || this.geplant) { this.schreibe(); await this.kette; }
    await this.kette;
  }

  /** Einmal beim Start: Datenbank öffnen, alte Einträge übernehmen, alles in den Zwischenspeicher laden. */
  starte(): Promise<void> {
    this.start ??= this.starteIntern().catch((e: unknown) => { this.cache = null; meldeFehler(e); });
    return this.start;
  }

  private async starteIntern() {
    if (typeof indexedDB === 'undefined') return;
    const tabelle = this.database.table<{ key: string; wert: string; geaendert: number }, string>(GERAETESTAND_TABELLE);
    const s = ls();
    const alt = new Map<string, string>();
    try { if (s) for (const k of UMGEZOGEN) { const v = s.getItem(k); if (v !== null) alt.set(k, v); } } catch { /* privater Modus */ }

    const vorhanden = new Map((await tabelle.toArray()).map((r) => [r.key, r.wert]));
    const neu: Array<{ key: string; wert: string; geaendert: number }> = [];
    let zusammen: ((a: unknown, b: unknown) => unknown) | null = null;
    for (const [k, v] of alt) {
      const db = vorhanden.get(k);
      let wert = v;
      if (db !== undefined && db !== v) {
        // Beides da (z. B. ein Fenster mit älterer App-Version hat nach dem Umzug noch geschrieben): zusammenführen
        // wie beim Einspielen einer Sicherung, damit nichts verloren geht.
        zusammen ??= (await import('./sicherung')).fuehreWertZusammen;
        try { wert = JSON.stringify(zusammen(JSON.parse(db), JSON.parse(v))); } catch { wert = db; }
      }
      if (db !== wert) neu.push({ key: k, wert, geaendert: Date.now() });
      vorhanden.set(k, wert);
    }
    if (neu.length) await tabelle.bulkPut(neu);
    // Erst nach dem erfolgreichen Schreiben aus dem localStorage entfernen.
    try { for (const k of alt.keys()) s?.removeItem(k); } catch { /* bleibt liegen und wird beim nächsten Start erneut zusammengeführt */ }

    this.cache = new Map([...vorhanden].filter(([k]) => UMGEZOGEN.has(k)));
    this.verbinde();
  }

  private verbinde() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.kanal = new BroadcastChannel(this.kanalName);
      this.kanal.onmessage = (ev: MessageEvent<{ key?: unknown; wert?: unknown }>) => {
        const { key, wert } = ev.data ?? {};
        if (typeof key !== 'string' || !this.zustaendig(key)) return;
        if (typeof wert === 'string') this.cache!.set(key, wert); else this.cache!.delete(key);
        this.melde(key);
      };
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (ev) => { if (ev.storageArea === ls() && ev.key && !UMGEZOGEN.has(ev.key)) this.melde(ev.key); });
    }
  }

  private melde(key: string) { for (const h of this.hoerer) { try { h(key); } catch (e) { meldeFehler(e); } } }

  private vormerken(key: string, wert: string | null) {
    this.offen.set(key, wert);
    try { this.kanal?.postMessage({ key, wert }); } catch { /* nur Benachrichtigung */ }
    if (!this.geplant) { this.geplant = true; queueMicrotask(() => this.schreibe()); }
  }

  private schreibe() {
    this.geplant = false;
    if (!this.offen.size) return;
    const stapel = [...this.offen];
    this.offen.clear();
    const tabelle = this.database.table(GERAETESTAND_TABELLE);
    this.kette = this.kette.then(() => this.database.transaction('rw', tabelle, async () => {
      for (const [key, wert] of stapel) {
        if (wert === null) await tabelle.delete(key);
        else await tabelle.put({ key, wert, geaendert: Date.now() });
      }
    })).catch(meldeFehler);
  }
}

export const geraet = new Geraetestand();
export const starteGeraetestand = () => geraet.starte();
