// Verbindung zum privaten Material-Repo für Bildserien. Ordner `bildgebung/<serie>/` mit `serie.json`
// (Bildserie mit quelle.art 'material') und den Bilddateien. Zugang wie unter Material → Große Dateien.

import { ladeZiel, type AblageZiel } from '../ablage/ablage';
import { setzeMaterialLader, type Bildserie } from '../../ui/sim/bildgebung/serie';

export const BILD_ORDNER = 'bildgebung';
type Fetch = typeof fetch;

async function gh(z: AblageZiel, pfad: string, raw: boolean, f: Fetch): Promise<Response> {
  let res: Response;
  try {
    res = await f(`https://api.github.com/repos/${z.owner}/${z.repo}/contents/${pfad.split('/').map(encodeURIComponent).join('/')}`, {
      headers: { Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', Authorization: `Bearer ${z.token}`, 'X-GitHub-Api-Version': '2022-11-28' },
    });
  } catch { throw new Error('Keine Verbindung zu GitHub. Internet prüfen und erneut versuchen.'); }
  if (res.status === 404) throw Object.assign(new Error(`Im Material-Repo gibt es „${pfad}“ nicht.`), { status: 404 });
  if (res.status === 401) throw new Error('Der Token ist ungültig oder abgelaufen. Unter Material → Große Dateien neu eintragen.');
  if (!res.ok) throw new Error(`GitHub-Fehler ${res.status}`);
  return res;
}

export const materialVerbunden = (z: AblageZiel = ladeZiel()) => !!(z.owner && z.repo && z.token);

/** Meldet dem Bildbetrachter, wie er private Bilder holt. Einmal beim Öffnen der Seite aufrufen. */
export function verbindeMaterial(z: AblageZiel = ladeZiel(), f: Fetch = fetch) {
  setzeMaterialLader(materialVerbunden(z) ? async (pfad) => (await gh(z, `${BILD_ORDNER}/${pfad}`, true, f)).blob() : null);
}

/** Prüft eine serie.json: Form, Pflichtangabe Herkunft, nur Bilddateien ohne Pfadsprünge. */
export function pruefeSerie(wert: unknown, ordner: string): Bildserie {
  const s = wert as Omit<Partial<Bildserie>, 'quelle'> & { quelle?: Record<string, unknown> };
  if (!s || typeof s !== 'object' || typeof s.id !== 'string' || typeof s.titel !== 'string') throw new Error(`${ordner}: id und titel fehlen`);
  const q: Record<string, unknown> = s.quelle ?? {};
  const dateien = Array.isArray(q.dateien) ? (q.dateien as unknown[]).filter((d): d is string => typeof d === 'string' && /^[\w.\- ]+\.(png|jpe?g|webp)$/i.test(d)) : [];
  if (!dateien.length) throw new Error(`${ordner}: keine Bilddateien (png, jpg, webp)`);
  if (typeof q.herkunft !== 'string' || !q.herkunft.trim()) throw new Error(`${ordner}: Herkunft fehlt`);
  const modalitaet = q.modalitaet === 'ct' ? 'ct' : 'roentgen';
  return {
    id: `material:${s.id}`, titel: s.titel, untersuchung: typeof s.untersuchung === 'string' ? s.untersuchung : s.titel,
    quelle: { art: 'material', modalitaet, ordner, dateien, herkunft: q.herkunft as string, lizenz: typeof q.lizenz === 'string' ? q.lizenz : undefined, quelleUrl: typeof q.quelleUrl === 'string' && q.quelleUrl.startsWith('https://') ? q.quelleUrl : undefined },
    befunde: Array.isArray(s.befunde) ? s.befunde.filter((b) => b && typeof b.id === 'string' && [b.x, b.y, b.r].every((n) => typeof n === 'number')) : [],
    befundtext: typeof s.befundtext === 'string' ? s.befundtext : '',
    schichtdicke: typeof s.schichtdicke === 'number' ? s.schichtdicke : undefined,
  };
}

/** Alle Bildserien aus `bildgebung/` im Material-Repo. Kaputte Ordner werden gemeldet, nicht übersprungen. */
export async function holeSerien(z: AblageZiel = ladeZiel(), f: Fetch = fetch): Promise<{ serien: Bildserie[]; fehler: string[] }> {
  if (!materialVerbunden(z)) throw new Error('Material-Repo ist noch nicht verbunden (Material → Große Dateien).');
  let liste: Array<{ name: string; type: string }>;
  try { liste = await (await gh(z, BILD_ORDNER, false, f)).json(); } catch (e) {
    if ((e as { status?: number }).status === 404) return { serien: [], fehler: [] };
    throw e;
  }
  const serien: Bildserie[] = [], fehler: string[] = [];
  for (const e of liste.filter((x) => x.type === 'dir')) {
    try { serien.push(pruefeSerie(await (await gh(z, `${BILD_ORDNER}/${e.name}/serie.json`, true, f)).json(), e.name)); } catch (err) { fehler.push(String((err as Error).message)); }
  }
  return { serien, fehler };
}
