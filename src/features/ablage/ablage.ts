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

export interface RepoInfo { privat: boolean; branch: string; schreiben: boolean; leer: boolean; eingerichtet: boolean; vollerName: string }

export class AblageFehler extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

// ---------- Einstellungen (nur dieses Gerät, nie im Datenexport) ----------

const KEY = 'lernstoff.ablage';

export function ladeZiel(): AblageZiel {
  try { return { owner: '', repo: '', token: '', ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; }
  catch { return { owner: '', repo: '', token: '' }; }
}

export function speichereZiel(z: AblageZiel | null) {
  try {
    if (z) localStorage.setItem(KEY, JSON.stringify({ owner: z.owner.trim(), repo: z.repo.trim(), token: z.token.trim() }));
    else localStorage.removeItem(KEY);
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

export function formatGroesse(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2).replace('.', ',')} GB`;
}

// ---------- GitHub-API ----------

type Fetch = typeof fetch;

async function gh<T = unknown>(z: AblageZiel, pfad: string, init: RequestInit = {}, f: Fetch = fetch): Promise<T> {
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
  if (init.method === 'HEAD' || res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function fehlerText(status: number, text: string): string {
  if (status === 401) return 'Der Token ist ungültig oder abgelaufen.';
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
  const r = await gh<{ private: boolean; default_branch: string; full_name: string; permissions?: { push?: boolean } }>(z, '', {}, f);
  let leer = false;
  try { await gh(z, `/git/ref/heads/${r.default_branch}`, {}, f); }
  catch (e) { if (e instanceof AblageFehler && (e.status === 409 || e.status === 404)) leer = true; else throw e; }
  const eingerichtet = !leer && await existiert(z, `/contents/abholen.py?ref=${r.default_branch}`, f);
  return { privat: r.private, branch: r.default_branch, schreiben: r.permissions?.push !== false, leer, eingerichtet, vollerName: r.full_name };
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

  const { ordner, schonDa } = waehleOrdner(datei, o.vorhanden);
  if (schonDa) {
    melde('uebersprungen', datei.size, anzahl);
    return { ordner, manifest: o.vorhanden.find((e) => e.ordner === ordner)!.manifest!, uebersprungen: true };
  }

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
    ...teile.map((t) => ({ path: `dateien/${ordner}/${t.datei}`, mode: '100644', type: 'blob', sha: t.git })),
    { path: `dateien/${ordner}/manifest.json`, mode: '100644', type: 'blob', content: JSON.stringify(manifest, null, 2) + '\n' },
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
  return { ordner, manifest, uebersprungen: false };
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
