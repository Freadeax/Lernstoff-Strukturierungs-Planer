// Verbindung zum privaten Material-Repo für Bildserien. Ordner `bildgebung/<serie>/` mit `serie.json`
// (Bildserie mit quelle.art 'material') und den Bilddateien. Zugang wie unter Material → Große Dateien.
//
// Sicherheit (Audit SEC-03):
// - Je Laden einmal prüfen, dass das Repo wirklich privat ist; ein öffentliches Repo wird abgelehnt.
// - Der Lader bleibt an das Ziel gebunden, mit dem er verbunden wurde. Ändert sich das Ziel (anderes Repo
//   oder anderer Token), wird nichts mehr geladen, bis die Seite neu verbunden ist.
// - Grenzen für Anzahl der Serien und Bilder, Dateigröße, serie.json und Wertebereiche der Befundmarken.
//   Bildpunkte begrenzt der Betrachter (MAX_PIXEL in serie.ts).
// - Diese Seite lädt nur herunter, sie lädt nie etwas hoch.

import { ladeZiel, type AblageZiel } from '../ablage/ablage';
import { setzeMaterialLader, type Befundmarke, type Bildserie } from '../../ui/sim/bildgebung/serie';

export const BILD_ORDNER = 'bildgebung';
type Fetch = typeof fetch;

export const GRENZEN = {
  serien: 40,
  bilderJeSerie: 400,
  /** Bytes je Bilddatei */
  dateiBytes: 15 * 1024 * 1024,
  /** Bytes je serie.json */
  serieBytes: 200 * 1024,
  befundeJeSerie: 60,
  textZeichen: 2000,
} as const;

async function gh(z: AblageZiel, pfad: string, raw: boolean, f: Fetch): Promise<Response> {
  let res: Response;
  try {
    res = await f(`https://api.github.com/repos/${encodeURIComponent(z.owner)}/${encodeURIComponent(z.repo)}${pfad === '' ? '' : `/contents/${pfad.split('/').map(encodeURIComponent).join('/')}`}`, {
      headers: { Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', Authorization: `Bearer ${z.token}`, 'X-GitHub-Api-Version': '2022-11-28' },
    });
  } catch { throw new Error('Keine Verbindung zu GitHub. Internet prüfen und erneut versuchen.'); }
  if (res.status === 404) throw Object.assign(new Error(pfad ? `Im Material-Repo gibt es „${pfad}“ nicht.` : 'Material-Repo nicht gefunden oder kein Zugriff.'), { status: 404 });
  if (res.status === 401) throw new Error('Der Token ist ungültig oder abgelaufen. Unter Material → Große Dateien neu eintragen.');
  if (!res.ok) throw new Error(`GitHub-Fehler ${res.status}`);
  return res;
}

export const materialVerbunden = (z: AblageZiel = ladeZiel()) => !!(z.owner && z.repo && z.token);
const gleichesZiel = (a: AblageZiel, b: AblageZiel) => a.owner === b.owner && a.repo === b.repo && a.token === b.token;

/** Prüft, dass das Repo privat ist. Wirft, wenn es öffentlich ist oder die Angabe fehlt. */
export async function pruefeSichtbarkeit(z: AblageZiel, f: Fetch = fetch): Promise<void> {
  const info = await (await gh(z, '', false, f)).json() as { private?: unknown };
  if (info.private !== true) throw new Error('Das Material-Repo ist nicht privat. Private Bilder werden nur aus einem privaten Repo geladen. Bitte das Repo auf GitHub auf „Private“ stellen.');
}

/** Ergebnis der Sichtbarkeitsprüfung je Ziel, einmal je Verbindung (also je Laden der Seite). */
let pruefung: { ziel: AblageZiel; ergebnis: Promise<void> } | null = null;
function sichtbarkeitEinmal(z: AblageZiel, f: Fetch): Promise<void> {
  if (!pruefung || !gleichesZiel(pruefung.ziel, z)) {
    const ergebnis = pruefeSichtbarkeit(z, f);
    pruefung = { ziel: z, ergebnis };
    ergebnis.catch(() => { if (pruefung?.ergebnis === ergebnis) pruefung = null; });
  }
  return pruefung.ergebnis;
}

/** Meldet dem Bildbetrachter, wie er private Bilder holt. Einmal beim Öffnen der Seite aufrufen. */
export function verbindeMaterial(z: AblageZiel = ladeZiel(), f: Fetch = fetch, aktuell: () => AblageZiel = ladeZiel) {
  pruefung = null;
  if (!materialVerbunden(z)) { setzeMaterialLader(null); return; }
  setzeMaterialLader(async (pfad) => {
    if (!gleichesZiel(aktuell(), z)) throw new Error('Das Material-Repo wurde geändert. Seite neu öffnen, damit die neue Verbindung geprüft wird.');
    await sichtbarkeitEinmal(z, f);
    const blob = await (await gh(z, `${BILD_ORDNER}/${pfad}`, true, f)).blob();
    if (blob.size > GRENZEN.dateiBytes) throw new Error(`${pfad}: Datei zu groß (höchstens ${GRENZEN.dateiBytes / 1024 / 1024} MB).`);
    return blob;
  });
}

const zahlIn = (n: unknown, min: number, max: number): n is number => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
const text = (t: unknown, fallback = '') => (typeof t === 'string' ? t.slice(0, GRENZEN.textZeichen) : fallback);

/** Prüft eine serie.json: Form, Pflichtangabe Herkunft, nur Bilddateien ohne Pfadsprünge, Grenzen und Wertebereiche. */
export function pruefeSerie(wert: unknown, ordner: string): Bildserie {
  const s = wert as Omit<Partial<Bildserie>, 'quelle'> & { quelle?: Record<string, unknown> };
  if (!s || typeof s !== 'object' || typeof s.id !== 'string' || typeof s.titel !== 'string') throw new Error(`${ordner}: id und titel fehlen`);
  if (!/^[\w.-]{1,80}$/.test(s.id)) throw new Error(`${ordner}: id darf nur Buchstaben, Ziffern, Punkt, Binde- und Unterstrich enthalten`);
  const q: Record<string, unknown> = s.quelle ?? {};
  const roh = Array.isArray(q.dateien) ? (q.dateien as unknown[]) : [];
  if (roh.length > GRENZEN.bilderJeSerie) throw new Error(`${ordner}: zu viele Bilder (${roh.length}, höchstens ${GRENZEN.bilderJeSerie})`);
  const dateien = roh.filter((d): d is string => typeof d === 'string' && /^[\w.\- ]+\.(png|jpe?g|webp)$/i.test(d) && !d.includes('..'));
  if (!dateien.length) throw new Error(`${ordner}: keine Bilddateien (png, jpg, webp)`);
  if (typeof q.herkunft !== 'string' || !q.herkunft.trim()) throw new Error(`${ordner}: Herkunft fehlt`);
  const modalitaet = q.modalitaet === 'ct' ? 'ct' : 'roentgen';
  const befundeRoh = Array.isArray(s.befunde) ? s.befunde : [];
  if (befundeRoh.length > GRENZEN.befundeJeSerie) throw new Error(`${ordner}: zu viele Befundmarken (höchstens ${GRENZEN.befundeJeSerie})`);
  const befunde: Befundmarke[] = [];
  for (const b of befundeRoh) {
    if (!b || typeof b.id !== 'string' || !zahlIn(b.x, 0, 1) || !zahlIn(b.y, 0, 1) || !zahlIn(b.r, 0.005, 0.5)) continue;
    let schichten: [number, number] | undefined;
    if (b.schichten !== undefined) {
      const [a, e] = (Array.isArray(b.schichten) ? b.schichten : []) as unknown[];
      if (typeof a !== 'number' || typeof e !== 'number' || !Number.isInteger(a) || !Number.isInteger(e) || a < 0 || e < a || e >= dateien.length) continue;
      schichten = [a, e];
    }
    befunde.push({ id: b.id.slice(0, 80), x: b.x, y: b.y, r: b.r, schichten, titel: text(b.titel, b.id).slice(0, 200), text: text(b.text) });
  }
  return {
    id: `material:${s.id}`, titel: text(s.titel).slice(0, 200), untersuchung: text(s.untersuchung, s.titel).slice(0, 200),
    quelle: { art: 'material', modalitaet, ordner, dateien, herkunft: (q.herkunft as string).slice(0, 500), lizenz: typeof q.lizenz === 'string' ? q.lizenz.slice(0, 200) : undefined, quelleUrl: typeof q.quelleUrl === 'string' && q.quelleUrl.startsWith('https://') ? q.quelleUrl : undefined },
    befunde,
    befundtext: text(s.befundtext),
    schichtdicke: zahlIn(s.schichtdicke, 0.1, 20) ? s.schichtdicke : undefined,
    pixelMm: zahlIn((s as { pixelMm?: unknown }).pixelMm, 0.01, 5) ? (s as { pixelMm: number }).pixelMm : undefined,
  };
}

/** Alle Bildserien aus `bildgebung/` im Material-Repo. Kaputte Ordner werden gemeldet, nicht übersprungen. */
export async function holeSerien(z: AblageZiel = ladeZiel(), f: Fetch = fetch): Promise<{ serien: Bildserie[]; fehler: string[] }> {
  if (!materialVerbunden(z)) throw new Error('Material-Repo ist noch nicht verbunden (Material → Große Dateien).');
  await sichtbarkeitEinmal(z, f);
  let liste: Array<{ name: string; type: string }>;
  try { liste = await (await gh(z, BILD_ORDNER, false, f)).json(); } catch (e) {
    if ((e as { status?: number }).status === 404) return { serien: [], fehler: [] };
    throw e;
  }
  const ordner = liste.filter((x) => x.type === 'dir');
  const serien: Bildserie[] = [], fehler: string[] = [];
  if (ordner.length > GRENZEN.serien) fehler.push(`Nur die ersten ${GRENZEN.serien} von ${ordner.length} Ordnern geladen.`);
  for (const e of ordner.slice(0, GRENZEN.serien)) {
    try {
      const res = await gh(z, `${BILD_ORDNER}/${e.name}/serie.json`, true, f);
      const roh = await res.text();
      if (roh.length > GRENZEN.serieBytes) throw new Error(`${e.name}: serie.json zu groß`);
      serien.push(pruefeSerie(JSON.parse(roh), e.name));
    } catch (err) { fehler.push(String((err as Error).message)); }
  }
  return { serien, fehler };
}
