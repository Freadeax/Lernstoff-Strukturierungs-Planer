// Skripte speichern, importieren und Lesestand merken.
// Inhalte kommen nur vom Gerät des Nutzers: aus dem privaten Material-Repo (Ordner skripte/,
// gleicher Token wie bei „Große Dateien“) oder als .md-/.zip-Datei. Nichts davon liegt im App-Bundle.

import { db, type LernstoffDB } from '../../core/db';
import { logActivity } from '../../core/activity';
import { pflegeModule } from '../../modules/pflege';
import { ladeZiel, type AblageZiel } from '../ablage/ablage';
import { parseSkript } from './parser';
import { schlageThemenVor } from './themen';
import type { Lesestand, Skript } from './typen';

export const REPO_ORDNER = 'skripte';

export async function ladeSkripte(database: LernstoffDB = db): Promise<Skript[]> {
  return database.skripte.toArray();
}

export interface ImportErgebnis { neu: string[]; aktualisiert: string[]; unveraendert: string[]; fehler: string[] }

/**
 * Gelesene Dateien übernehmen. Gleiche ID = gleiche Datei: unveränderte bleiben stehen,
 * geänderte werden ersetzt. Von Hand gesetzte Themen bleiben beim Ersetzen erhalten.
 */
export async function uebernehmeDateien(dateien: Array<{ name: string; text: string }>, herkunft: Skript['herkunft'], database: LernstoffDB = db, jetzt = new Date().toISOString()): Promise<ImportErgebnis> {
  const erg: ImportErgebnis = { neu: [], aktualisiert: [], unveraendert: [], fehler: [] };
  const vorhanden = new Map((await database.skripte.toArray()).map((s) => [s.id, s]));
  const speichern: Skript[] = [];
  for (const d of dateien) {
    let s: Skript;
    try { s = parseSkript(d.name, d.text, { herkunft, jetzt }); } catch (e) { erg.fehler.push(e instanceof Error ? e.message : String(e)); continue; }
    if (!s.abschnitte.length) { erg.fehler.push(`${d.name}: keine Abschnitte (## Überschrift) gefunden.`); continue; }
    if (!s.topicIds.length) s.topicIds = schlageThemenVor(s, pflegeModule.topics);
    else s.topicIds = s.topicIds.filter((id) => pflegeModule.topics.some((t) => t.id === id));
    const alt = vorhanden.get(s.id);
    if (alt && alt.hash === s.hash) { erg.unveraendert.push(s.titel); continue; }
    if (alt) {
      s.importiert = alt.importiert;
      if (alt.themenManuell) { s.topicIds = alt.topicIds; s.themenManuell = true; }
      erg.aktualisiert.push(s.titel);
    } else erg.neu.push(s.titel);
    speichern.push(s);
  }
  if (speichern.length) await database.skripte.bulkPut(speichern);
  if (erg.neu.length || erg.aktualisiert.length) {
    await logActivity({
      kind: 'import', severity: 'info', title: 'Skripte übernommen',
      detail: [erg.neu.length && `${erg.neu.length} neu`, erg.aktualisiert.length && `${erg.aktualisiert.length} aktualisiert`].filter(Boolean).join(', '),
    }).catch(() => undefined);
  }
  return erg;
}

/** .md-, .markdown-, .txt-Dateien und .zip-Archive mit solchen Dateien lesen. */
export async function leseDateien(files: File[]): Promise<Array<{ name: string; text: string }>> {
  const out: Array<{ name: string; text: string }> = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name)) {
      const { default: JSZip } = await import('jszip');
      const zip = await JSZip.loadAsync(await f.arrayBuffer());
      for (const e of Object.values(zip.files)) {
        if (e.dir || !/\.(md|markdown)$/i.test(e.name) || /(^|\/)(__MACOSX|\.)/.test(e.name)) continue;
        out.push({ name: e.name.replace(/^.*\//, ''), text: await e.async('string') });
      }
    } else if (/\.(md|markdown|txt)$/i.test(f.name)) {
      out.push({ name: f.name, text: await f.text() });
    }
  }
  return out;
}

// ---------------------------------------------------------------- Material-Repo

type Fetch = typeof fetch;

async function gh(z: AblageZiel, pfad: string, raw: boolean, f: Fetch): Promise<Response> {
  let res: Response;
  try {
    res = await f(`https://api.github.com/repos/${z.owner}/${z.repo}/contents/${pfad}`, {
      headers: { Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', Authorization: `Bearer ${z.token}`, 'X-GitHub-Api-Version': '2022-11-28' },
    });
  } catch { throw new Error('Keine Verbindung zu GitHub. Internet prüfen und erneut versuchen.'); }
  if (res.status === 404) throw Object.assign(new Error(`Im Material-Repo gibt es keinen Ordner „${REPO_ORDNER}“.`), { status: 404 });
  if (res.status === 401) throw new Error('Der Token ist ungültig oder abgelaufen. Unter Material → Große Dateien neu eintragen.');
  if (!res.ok) throw new Error(`GitHub-Fehler ${res.status}`);
  return res;
}

export const repoEingerichtet = (z: AblageZiel = ladeZiel()) => !!(z.owner && z.repo && z.token);

/** Alle .md-Dateien aus skripte/ im privaten Material-Repo holen. */
export async function holeAusRepo(z: AblageZiel = ladeZiel(), f: Fetch = fetch): Promise<Array<{ name: string; text: string }>> {
  if (!repoEingerichtet(z)) throw new Error('Material-Repo ist noch nicht eingerichtet (Material → Große Dateien).');
  const liste = (await (await gh(z, REPO_ORDNER, false, f)).json()) as Array<{ name: string; type: string; path: string }>;
  const md = liste.filter((e) => e.type === 'file' && /\.(md|markdown)$/i.test(e.name) && !/^readme\.md$/i.test(e.name));
  return Promise.all(md.map(async (e) => ({ name: e.name, text: await (await gh(z, e.path.split('/').map(encodeURIComponent).join('/'), true, f)).text() })));
}

// ---------------------------------------------------------------- Ändern

export async function setzeThemen(id: string, topicIds: string[], database: LernstoffDB = db) {
  await database.skripte.update(id, { topicIds, themenManuell: true, geaendert: new Date().toISOString() });
}

export async function loescheSkript(id: string, database: LernstoffDB = db) {
  await database.skripte.delete(id);
  const alle = ladeLesestaende();
  delete alle[id];
  speichereLesestaende(alle);
}

/** Skripte, die einem Thema zugeordnet sind (für Lernplan und Landkarte). */
export async function skripteZuThema(topicId: string, database: LernstoffDB = db): Promise<Skript[]> {
  return database.skripte.where('topicIds').equals(topicId).toArray();
}

// ---------------------------------------------------------------- Lesestand (localStorage)

const KEY = 'lernstoff.skript.lesestand';

export function ladeLesestaende(): Record<string, Lesestand> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Lesestand>; } catch { return {}; }
}

function speichereLesestaende(s: Record<string, Lesestand>) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* privater Modus */ }
}

export function markiereGelesen(skriptId: string, abschnittId: string, gelesen: boolean): Record<string, Lesestand> {
  const alle = ladeLesestaende();
  const st = alle[skriptId] ?? { gelesen: [], geaendert: '' };
  const set = new Set(st.gelesen);
  if (gelesen) set.add(abschnittId); else set.delete(abschnittId);
  alle[skriptId] = { ...st, gelesen: [...set], geaendert: new Date().toISOString() };
  speichereLesestaende(alle);
  return alle;
}

export function merkeZuletzt(skriptId: string, abschnittId: string) {
  const alle = ladeLesestaende();
  const st = alle[skriptId] ?? { gelesen: [], geaendert: '' };
  alle[skriptId] = { ...st, zuletzt: abschnittId, geaendert: new Date().toISOString() };
  speichereLesestaende(alle);
}
