// Material-Ablage: große Dateien (Bücher, Skripte) in ein PRIVATES GitHub-Repo hochladen,
// damit Claude-Threads sie per git clone abholen können. Der Chat-Upload ist auf 30 MB begrenzt,
// die GitHub-Weboberfläche auf 25 MB je Datei, ab 100 MB lehnt GitHub Dateien ganz ab.
// Deshalb: jede Datei in Teile zu höchstens 15 MiB zerlegen, ein Commit pro Datei, dazu ein
// manifest.json mit Prüfsummen. abholen.py setzt die Teile wieder zusammen.
//
// Warum nicht Release-Assets (bis 2 GB)? uploads.github.com erlaubt keine Browser-Anfragen
// von fremden Seiten (CORS), api.github.com schon.

export const FORMAT = 'lernstoff-ablage/1';
export const TEIL_GROESSE = 15 * 1024 * 1024;
const API = 'https://api.github.com';

export interface AblageZiel { owner: string; repo: string; token: string }

export interface ManifestTeil { datei: string; groesse: number; sha256: string }
export interface Manifest {
  format: typeof FORMAT;
  name: string;
  groesse: number;
  typ: string;
  hochgeladen: string;
  kategorie?: string;
  notiz?: string;
  teile: ManifestTeil[];
}

export interface RepoInfo {
  privat: boolean; branch: string; schreiben: boolean; leer: boolean; eingerichtet: boolean; vollerName: string;
  /** Der Token darf das Repo verwalten (Einstellungen, Sichtbarkeit, Löschen): mehr als nötig. */
  admin?: boolean;
  tokenArt?: TokenArt;
  /** Berechtigungen eines klassischen Tokens laut GitHub (X-OAuth-Scopes), z. B. „repo, workflow“. */
  scopes?: string;
  /** Ablaufdatum des Tokens, falls GitHub es mitteilt. */
  ablauf?: string;
}

export type TokenArt = 'fein' | 'klassisch' | 'unbekannt';

/** Fine-grained Tokens beginnen mit github_pat_, klassische mit ghp_ (die gelten für alle Repos des Kontos). */
export function tokenArt(token: string): TokenArt {
  const t = token.trim();
  if (t.startsWith('github_pat_')) return 'fein';
  if (/^gh[pousr]_/.test(t)) return 'klassisch';
  return 'unbekannt';
}

/** GitHub meldet das Ablaufdatum als „2026-12-01 10:00:00 UTC“. */
export function ablaufText(roh: string | undefined): string | undefined {
  if (!roh) return undefined;
  const d = new Date(roh.trim().replace(/ UTC$/, 'Z').replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? undefined : d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Hinweise, wenn der Token mehr darf als nötig. Leere Liste: passt. */
export function tokenWarnungen(i: Pick<RepoInfo, 'admin' | 'tokenArt' | 'scopes'>): string[] {
  const w: string[] = [];
  if (i.tokenArt === 'klassisch') w.push(`Das ist ein klassischer Token${i.scopes ? ` (${i.scopes})` : ''}. Er gilt für alle Repositories deines Kontos, nicht nur für die Ablage. Besser: einen Fine-grained Token nur für dieses Repository anlegen und den klassischen widerrufen.`);
  if (i.admin) w.push('Der Token hat Verwaltungsrechte für das Repository (z. B. Sichtbarkeit ändern oder löschen). Für die Ablage reicht „Contents: Read and write“.');
  return w;
}

export class AblageFehler extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

// ---------- Einstellungen (nur dieses Gerät, nie im Datenexport) ----------

const KEY = 'lernstoff.ablage';           // owner/repo (und Token nur, wenn „merken“ gewählt)
const SITZUNG = 'lernstoff.ablage.token'; // Token nur für diese Sitzung (sessionStorage)

export function ladeZiel(): AblageZiel {
  let z: AblageZiel = { owner: '', repo: '', token: '' };
  try { z = { ...z, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { /* kaputt oder gesperrt */ }
  if (!z.token) { try { z.token = sessionStorage.getItem(SITZUNG) ?? ''; } catch { /* gesperrt */ } }
  return z;
}

/** „Zugang vergessen“: Token aus Sitzung und Gerät entfernen, Repo-Name bleibt stehen. */
export function vergissToken() {
  try { sessionStorage.removeItem(SITZUNG); } catch { /* gesperrt */ }
  try {
    const z = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<AblageZiel>;
    if (z.token !== undefined) { delete z.token; localStorage.setItem(KEY, JSON.stringify(z)); }
  } catch { /* kaputt oder gesperrt */ }
}

/** Wo liegt der Token gerade? */
export function tokenOrt(): 'keiner' | 'sitzung' | 'dauerhaft' {
  if (tokenDauerhaft()) return 'dauerhaft';
  try { return sessionStorage.getItem(SITZUNG) ? 'sitzung' : 'keiner'; } catch { return 'keiner'; }
}

/** Liegt der Token dauerhaft auf dem Gerät? */
export function tokenDauerhaft(): boolean {
  try { return !!JSON.parse(localStorage.getItem(KEY) ?? '{}').token; } catch { return false; }
}

/** Standard: Token nur für diese Sitzung. `merken` legt ihn dauerhaft in diesem Browser ab. */
export function speichereZiel(z: AblageZiel | null, merken = false) {
  try { sessionStorage.removeItem(SITZUNG); } catch { /* gesperrt */ }
  try {
    if (!z) { localStorage.removeItem(KEY); return; }
    const token = z.token.trim();
    localStorage.setItem(KEY, JSON.stringify({ owner: z.owner.trim(), repo: z.repo.trim(), ...(merken ? { token } : {}) }));
    if (!merken) sessionStorage.setItem(SITZUNG, token);
  } catch { /* privater Modus */ }
}

/** Akzeptiert „name/repo“ oder eine github.com-Adresse. */
export function parseRepo(eingabe: string): { owner: string; repo: string } | null {
  const m = eingabe.trim().replace(/\.git$/, '').match(/^(?:https?:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+)\/?$/i);
  return m ? { owner: m[1]!, repo: m[2]! } : null;
}

// ---------- Hilfsfunktionen ----------

/** Ordnername aus dem Dateinamen: klein, ohne Umlaute und Sonderzeichen. */
export function slug(dateiname: string): string {
  const ohneEndung = dateiname.replace(/\.[^.]+$/, '');
  // iOS liefert Dateinamen oft zerlegt (a + Trema), daher erst zusammensetzen.
  const s = ohneEndung.normalize('NFC').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60).replace(/-+$/, '');
  return s || 'datei';
}

/** Dateiname, der in git und in jeder Shell harmlos ist. */
export function sichererName(dateiname: string): string {
  const endung = (dateiname.match(/\.([A-Za-z0-9]{1,8})$/)?.[1] ?? '').toLowerCase();
  return slug(dateiname) + (endung ? `.${endung}` : '');
}

export function teilAnzahl(groesse: number, teil = TEIL_GROESSE): number {
  return Math.max(1, Math.ceil(groesse / teil));
}

export function teilName(index: number, anzahl: number, dateiname: string): string {
  return anzahl === 1 ? sichererName(dateiname) : `teil-${String(index + 1).padStart(3, '0')}`;
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256(daten: Uint8Array): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', daten as BufferSource));
}

/** Git-Objekt-ID eines Blobs: sha1("blob <länge>\0" + inhalt). */
export async function gitBlobSha(daten: Uint8Array): Promise<string> {
  const kopf = new TextEncoder().encode(`blob ${daten.length}\0`);
  const alles = new Uint8Array(kopf.length + daten.length);
  alles.set(kopf);
  alles.set(daten, kopf.length);
  return hex(await crypto.subtle.digest('SHA-1', alles));
}

export function base64(daten: Uint8Array): string {
  let s = '';
  for (let i = 0; i < daten.length; i += 0x8000) s += String.fromCharCode(...daten.subarray(i, i + 0x8000));
  return btoa(s);
}

function base64Text(text: string): string {
  return base64(new TextEncoder().encode(text));
}

/** Grenze, bis zu der die App eine Datei wieder als Dokument einlesen kann (wie beim Import, siehe dokumente/import/grenzen.ts). */
export const EINLESEN_MAX = 512 * 1024 * 1024;
/** Ab hier lohnt beim Wiedereinlesen auf dem Handy ein WLAN. */
export const MOBIL_GROSS = 100 * 1024 * 1024;

/** Hinweis zur Größe direkt bei der Auswahl: Ablage geht immer, Wiedereinlesen hat Grenzen. */
export function groessenHinweis(dateien: Array<{ name: string; size: number }>): string[] {
  const out: string[] = [];
  const zuGross = dateien.filter((d) => d.size > EINLESEN_MAX);
  const gross = dateien.filter((d) => d.size > MOBIL_GROSS && d.size <= EINLESEN_MAX);
  if (zuGross.length) out.push(`${zuGross.map((d) => d.name).join(', ')}: über ${formatGroesse(EINLESEN_MAX)}. Wird abgelegt (für Claude), kann in der App aber nicht als Dokument eingelesen werden.`);
  if (gross.length) out.push(`${gross.map((d) => `${d.name} (${formatGroesse(d.size)})`).join(', ')}: Zum Wiedereinlesen auf iPhone oder iPad werden alle Teile heruntergeladen. Am besten im WLAN und mit genug freiem Speicher.`);
  return out;
}

export function formatGroesse(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2).replace('.', ',')} GB`;
}

// ---------- GitHub-API ----------

type Fetch = typeof fetch;

async function gh<T = unknown>(z: AblageZiel, pfad: string, init: RequestInit = {}, f: Fetch = fetch, kopf?: (h: Headers) => void): Promise<T> {
  let res: Response;
  try {
    res = await f(`${API}/repos/${z.owner}/${z.repo}${pfad}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${z.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new AblageFehler('Keine Verbindung zu GitHub. Internet prüfen und erneut versuchen.');
  }
  if (!res.ok) {
    let text = '';
    try { text = ((await res.json()) as { message?: string }).message ?? ''; } catch { /* kein JSON */ }
    throw new AblageFehler(fehlerText(res.status, text), res.status);
  }
  kopf?.(res.headers);
  if (init.method === 'HEAD' || res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function fehlerText(status: number, text: string): string {
  if (status === 401) return 'Der Token ist ungültig, abgelaufen oder widerrufen. Erzeuge in GitHub einen neuen (Anleitung unter „So richtest du es ein“), trage ihn hier ein und lösche den alten.';
  if (status === 403) return `GitHub verweigert den Zugriff${text ? ` (${text})` : ''}. Hat der Token „Contents: Read and write“ für dieses Repo?`;
  if (status === 404) return 'Repo nicht gefunden. Name prüfen und ob der Token Zugriff auf genau dieses Repo hat.';
  return `GitHub-Fehler ${status}${text ? `: ${text}` : ''}`;
}

async function existiert(z: AblageZiel, pfad: string, f: Fetch): Promise<boolean> {
  try { await gh(z, pfad, { method: 'HEAD' }, f); return true; }
  catch (e) { if (e instanceof AblageFehler && e.status === 404) return false; throw e; }
}

/** Prüft Zugriff, ob das Repo privat ist und ob abholen.py schon darin liegt. */
export async function pruefeRepo(z: AblageZiel, f: Fetch = fetch): Promise<RepoInfo> {
  let scopes: string | undefined, ablauf: string | undefined;
  const r = await gh<{ private: boolean; default_branch: string; full_name: string; permissions?: { push?: boolean; admin?: boolean } }>(z, '', {}, f, (h) => {
    scopes = h.get('x-oauth-scopes') ?? undefined;
    ablauf = h.get('github-authentication-token-expiration') ?? undefined;
  });
  let leer = false;
  try { await gh(z, `/git/ref/heads/${r.default_branch}`, {}, f); }
  catch (e) { if (e instanceof AblageFehler && (e.status === 409 || e.status === 404)) leer = true; else throw e; }
  const eingerichtet = !leer && await existiert(z, `/contents/abholen.py?ref=${r.default_branch}`, f);
  return {
    privat: r.private, branch: r.default_branch, schreiben: r.permissions?.push !== false, leer, eingerichtet, vollerName: r.full_name,
    admin: r.permissions?.admin === true, tokenArt: tokenArt(z.token), scopes: scopes || undefined, ablauf: ablauf || undefined,
  };
}

/** Legt README.md und abholen.py an (beides klein, per Contents-API, geht auch im leeren Repo). */
export async function richteEin(z: AblageZiel, info: RepoInfo, readme: string, skript: string, f: Fetch = fetch) {
  for (const [pfad, inhalt] of [['README.md', readme], ['abholen.py', skript]] as const) {
    let sha: string | undefined;
    if (!info.leer) {
      try { sha = (await gh<{ sha: string }>(z, `/contents/${pfad}?ref=${info.branch}`, {}, f)).sha; }
      catch (e) { if (!(e instanceof AblageFehler && e.status === 404)) throw e; }
    }
    await gh(z, `/contents/${pfad}`, {
      method: 'PUT',
      body: JSON.stringify({ message: `Ablage: ${pfad} aktualisieren`, content: base64Text(inhalt), branch: info.branch, ...(sha ? { sha } : {}) }),
    }, f);
    info.leer = false;
  }
  info.eingerichtet = true;
}

export interface Eintrag { ordner: string; manifest?: Manifest }

/** Ordner unter dateien/ samt Manifest. */
export async function listeDateien(z: AblageZiel, f: Fetch = fetch): Promise<Eintrag[]> {
  let ordner: { name: string; type: string }[];
  try { ordner = await gh(z, '/contents/dateien', {}, f); }
  catch (e) { if (e instanceof AblageFehler && e.status === 404) return []; throw e; }
  const dirs = ordner.filter((o) => o.type === 'dir');
  return Promise.all(dirs.map(async (d) => ({ ordner: d.name, manifest: await ladeManifest(z, d.name, f) })));
}

async function ladeManifest(z: AblageZiel, ordner: string, f: Fetch): Promise<Manifest | undefined> {
  try {
    const m = await gh<Manifest>(z, `/contents/dateien/${ordner}/manifest.json`, { headers: { Accept: 'application/vnd.github.raw+json' } }, f);
    return m?.format === FORMAT ? m : undefined;
  } catch { return undefined; }
}

/** Ziel-Ordner: gleicher Name und gleiche Größe = schon da (überspringen), sonst freien Namen wählen. */
export function waehleOrdner(datei: { name: string; size: number }, vorhanden: Eintrag[]): { ordner: string; schonDa: boolean } {
  const gleich = vorhanden.find((e) => e.manifest && e.manifest.name.normalize('NFC') === datei.name.normalize('NFC') && e.manifest.groesse === datei.size);
  if (gleich) return { ordner: gleich.ordner, schonDa: true };
  const basis = slug(datei.name);
  const belegt = new Set(vorhanden.map((e) => e.ordner));
  for (let n = 1; ; n++) {
    const kandidat = n === 1 ? basis : `${basis}-${n}`;
    if (!belegt.has(kandidat)) return { ordner: kandidat, schonDa: false };
  }
}

export interface Fortschritt { phase: 'pruefen' | 'hochladen' | 'speichern' | 'fertig' | 'uebersprungen'; bytes: number; teil: number; teile: number }

export interface HochladenOptionen {
  branch: string;
  vorhanden: Eintrag[];
  kategorie?: string;
  notiz?: string;
  teilGroesse?: number;
  signal?: AbortSignal;
  onFortschritt?: (p: Fortschritt) => void;
  fetch?: Fetch;
}

/**
 * Lädt eine Datei hoch: jedes Teil als Git-Blob, dann ein Commit mit allen Teilen und dem Manifest.
 * Teile, die GitHub schon kennt (z. B. nach einem Abbruch), werden nicht erneut gesendet.
 */
export async function ladeHoch(z: AblageZiel, datei: File, o: HochladenOptionen): Promise<{ ordner: string; manifest: Manifest; uebersprungen: boolean }> {
  const f = o.fetch ?? fetch;
  const groesse = o.teilGroesse ?? TEIL_GROESSE;
  const anzahl = teilAnzahl(datei.size, groesse);
  const melde = (phase: Fortschritt['phase'], bytes: number, teil: number) => o.onFortschritt?.({ phase, bytes, teil, teile: anzahl });

  // Privatstatus bei jedem Upload frisch prüfen, nicht auf früher geladene Repo-Infos verlassen:
  // ein inzwischen öffentlich gestelltes Repo bekommt keine Bücher und Skripte.
  const repo = await gh<{ private?: boolean; full_name?: string }>(z, '', {}, f);
  if (repo.private !== true) throw new AblageFehler(`${repo.full_name ?? `${z.owner}/${z.repo}`} ist nicht privat. Es wurde nichts hochgeladen. Bitte ein privates Repository verwenden.`);

  const { ordner, schonDa } = waehleOrdner(datei, o.vorhanden);
  let identisch = schonDa;
  if (schonDa) {
    const m = o.vorhanden.find((e) => e.ordner === ordner)!.manifest!;
    let start = 0;
    for (const t of m.teile) {
      o.signal?.throwIfAborted();
      if (await sha256(new Uint8Array(await datei.slice(start, start + t.groesse).arrayBuffer())) !== t.sha256) { identisch = false; break; }
      start += t.groesse;
    }
    if (start !== datei.size) identisch = false;
  }
  if (identisch) {
    melde('uebersprungen', datei.size, anzahl);
    return { ordner, manifest: o.vorhanden.find((e) => e.ordner === ordner)!.manifest!, uebersprungen: true };
  }

  const zielOrdner = schonDa ? waehleOrdner(datei, o.vorhanden.map((e) => ({ ordner: e.ordner }))).ordner : ordner;
  const teile: (ManifestTeil & { git: string })[] = [];
  for (let i = 0; i < anzahl; i++) {
    o.signal?.throwIfAborted();
    const start = i * groesse;
    melde('pruefen', start, i);
    const daten = new Uint8Array(await datei.slice(start, Math.min(datei.size, start + groesse)).arrayBuffer());
    const [git, pruef] = await Promise.all([gitBlobSha(daten), sha256(daten)]);
    o.signal?.throwIfAborted();
    if (!(await existiert(z, `/git/blobs/${git}`, f))) {
      melde('hochladen', start, i);
      const r = await gh<{ sha: string }>(z, '/git/blobs', { method: 'POST', body: JSON.stringify({ content: base64(daten), encoding: 'base64' }), signal: o.signal }, f);
      if (r.sha !== git) throw new AblageFehler(`Teil ${i + 1} kam beschädigt bei GitHub an. Bitte erneut versuchen.`);
    }
    teile.push({ datei: teilName(i, anzahl, datei.name), groesse: daten.length, sha256: pruef, git });
  }

  const manifest: Manifest = {
    format: FORMAT,
    name: datei.name,
    groesse: datei.size,
    typ: datei.type || 'application/octet-stream',
    hochgeladen: new Date().toISOString(),
    ...(o.kategorie ? { kategorie: o.kategorie } : {}),
    ...(o.notiz ? { notiz: o.notiz } : {}),
    teile: teile.map(({ git: _git, ...t }) => t),
  };

  melde('speichern', datei.size, anzahl);
  const baum = [
    ...teile.map((t) => ({ path: `dateien/${zielOrdner}/${t.datei}`, mode: '100644', type: 'blob', sha: t.git })),
    { path: `dateien/${zielOrdner}/manifest.json`, mode: '100644', type: 'blob', content: JSON.stringify(manifest, null, 2) + '\n' },
  ];
  // Commit; falls der Branch inzwischen weitergezogen ist, neu aufsetzen.
  for (let versuch = 1; ; versuch++) {
    const ref = await gh<{ object: { sha: string } }>(z, `/git/ref/heads/${o.branch}`, {}, f);
    const eltern = await gh<{ tree: { sha: string } }>(z, `/git/commits/${ref.object.sha}`, {}, f);
    const tree = await gh<{ sha: string }>(z, '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: eltern.tree.sha, tree: baum }) }, f);
    const commit = await gh<{ sha: string }>(z, '/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message: `Ablage: ${datei.name} (${formatGroesse(datei.size)}, ${anzahl} Teil${anzahl === 1 ? '' : 'e'})`, tree: tree.sha, parents: [ref.object.sha] }),
    }, f);
    try {
      await gh(z, `/git/refs/heads/${o.branch}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) }, f);
      break;
    } catch (e) {
      if (!(e instanceof AblageFehler && e.status === 422) || versuch >= 3) throw e;
    }
  }
  melde('fertig', datei.size, anzahl);
  return { ordner: zielOrdner, manifest, uebersprungen: false };
}

/** Original aus dem privaten Repo holen, jedes Teil vor dem Import prüfen. */
export async function ladeOriginal(z: AblageZiel, eintrag: Eintrag, f: Fetch = fetch): Promise<File> {
  const info = await pruefeRepo(z, f);
  if (!info.privat) throw new AblageFehler('Bitte ein privates Material-Repository verwenden.');
  const ref = await gh<{ object: { sha: string } }>(z, `/git/ref/heads/${encodeURIComponent(info.branch)}`, {}, f);
  const basis = `/contents/dateien/${encodeURIComponent(eintrag.ordner)}/`;
  const manifest = await gh<Manifest>(z, `${basis}manifest.json?ref=${ref.object.sha}`, { headers: { Accept: 'application/vnd.github.raw+json' } }, f);
  if (manifest.format !== FORMAT || !Array.isArray(manifest.teile) || !manifest.teile.length || manifest.teile.some((t) => !/^[\w.-]+$/.test(t.datei) || t.datei === '..' || !Number.isSafeInteger(t.groesse) || t.groesse < 0) || manifest.teile.reduce((s, t) => s + t.groesse, 0) !== manifest.groesse) {
    throw new AblageFehler('Das Datei-Manifest ist unvollständig oder beschädigt.');
  }
  if (manifest.groesse > 512 * 1024 * 1024) throw new AblageFehler('Diese Datei ist für das Einlesen auf Handy/iPad zu groß (über 512 MB). Bitte benötigte Kapitel oder Dokumente einzeln hochladen. Das Original bleibt im Material-Repo.');
  const teile: BlobPart[] = [];
  for (const t of manifest.teile) {
    const res = await f(`${API}/repos/${z.owner}/${z.repo}${basis}${encodeURIComponent(t.datei)}?ref=${ref.object.sha}`, {
      headers: { Authorization: `Bearer ${z.token}`, Accept: 'application/vnd.github.raw+json', 'X-GitHub-Api-Version': '2022-11-28' },
    });
    if (!res.ok) throw new AblageFehler(fehlerText(res.status, 'Dateiteil konnte nicht geladen werden.'));
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength !== t.groesse || await sha256(new Uint8Array(bytes)) !== t.sha256) throw new AblageFehler('Prüfsumme stimmt nicht. Die Datei wurde nicht importiert.');
    teile.push(bytes);
  }
  return new File(teile, manifest.name, { type: manifest.typ, lastModified: Date.parse(manifest.hochgeladen) || 0 });
}

// ---------- Anleitung im Material-Repo ----------

export function readmeText(z: { owner: string; repo: string }): string {
  return `# Material-Ablage (privat)

Schulmaterial für den Lernstoff-Planer. **Dieses Repo muss privat bleiben**, es enthält
urheberrechtlich geschützte Bücher und Skripte.

Hochgeladen wird mit der Lernstoff-App: Material → Große Dateien. Jede Datei liegt in einem
eigenen Ordner unter \`dateien/\`. Dateien über 15 MiB sind in Teile zerlegt
(\`teil-001\`, \`teil-002\`, …), \`manifest.json\` nennt Originalname, Größe und die
SHA-256-Prüfsumme jedes Teils.


## In der Lernstoff-App verwenden

- Unter **Material → Import-Assistent** oder **Dokumente** können kleine Dateien und ZIP-Sammlungen direkt eingelesen werden. „Originale auch im privaten Material-Repo speichern“ sichert sie zusätzlich hier. Die Option ist nie vorausgewählt; hochgeladen wird erst, nachdem die Datei lokal eingelesen wurde.
- Unter **Material → Große Dateien** werden Originale hier abgelegt. „Nach dem Upload Text einlesen und Themen abgleichen“ übernimmt unterstützte Dateien außerdem in die Dokumente des aktuellen Geräts.
- Bereits hier liegende Dateien lassen sich mit **Als Dokument einlesen / Themen abgleichen** übernehmen. Die App setzt Teile am festen Commit zusammen und prüft Größe und SHA-256 jedes Teils vor dem Import.
- Bei ZIP-Sammlungen werden unterstützte Dokumente einzeln eingelesen und mit dem ZIP-Original verknüpft. Die Browser-Verarbeitung ist auf 512 MiB komprimiert/entpackt, 128 MiB je ZIP-Eintrag und 500 Dokumente begrenzt. Größere Sammlungen bleiben hier erhalten; benötigte Dokumente oder Kapitel bitte in kleineren Einheiten importieren.
- Unter **Dokumente → Themen zuordnen** werden erkannte bestehende Themen verknüpft. Neue Themen aus Kapitelüberschriften (bei unstrukturierten Texten aus dem Dokumenttitel) sind Vorschläge. Vor der Übernahme können Name und Oberthema geprüft werden; bestätigte Themen erscheinen in Themenansicht, Themenpool und Lernplan. Eigene Abwahlen werden beim erneuten Abgleich berücksichtigt.
- **Wichtigste Inhalte zusammenfassen** öffnet das Dokument im Zusammenfasser mit „kurz“. Große Texte werden vollständig in Teilabschnitten zusammengefasst; Originalbelege und Qualitätsprüfung bleiben erhalten. Dafür wird wie bisher ein Claude-API-Schlüssel benötigt und Quelltext an Claude übertragen.

Originale liegen geräteübergreifend in diesem privaten Repo. Eingelesene Texte, Themenzuordnung, Zusammenfassungen und Lernstand liegen weiterhin im jeweiligen Browser. Auf einem anderen Gerät Originale erneut einlesen oder **Datensicherung** exportieren und importieren. GitHub-Zugangsdaten und API-Schlüssel bleiben auf dem jeweiligen Gerät (standardmäßig nur bis zum Schließen der App) und sind nicht in der Sicherung.

## Für Claude: Dateien abholen

Voraussetzung: das Repo \`${z.owner}/${z.repo}\` ist in den Projekteinstellungen unter
den Repositories eingetragen.

\`\`\`sh
# Nur die Liste holen, ohne die großen Teile herunterzuladen
git clone --filter=blob:none --sparse https://github.com/${z.owner}/${z.repo}.git material
cd material
git sparse-checkout set --no-cone '/*' '!/dateien/' '/dateien/*/manifest.json'
python3 abholen.py                         # Übersicht: Ordner, Name, Größe

# Eine Datei holen und zusammensetzen (Ordnername aus der Übersicht)
git sparse-checkout add /dateien/pflege-heute/
python3 abholen.py pflege-heute            # -> ausgabe/<Originalname>, Prüfsummen geprüft
\`\`\`

Ohne Sparse-Checkout geht auch \`git clone\` komplett und dann \`python3 abholen.py --alle\`.
`;
}
