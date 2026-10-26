import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  base64, gitBlobSha, ladeHoch, ladeOriginal, listeDateien, parseRepo, pruefeRepo, richteEin, sha256, sichererName, slug,
  teilAnzahl, waehleOrdner, type AblageZiel, type Manifest,
} from './ablage';

const Z: AblageZiel = { owner: 'philipp', repo: 'material', token: 't' };

/** Sehr kleines GitHub in Speicher: Blobs, Bäume (flach), Commits, ein Branch, Contents. */
function fakeGitHub(opts: { privat?: boolean; leer?: boolean } = {}) {
  const blobs = new Map<string, Uint8Array>();
  const trees = new Map<string, Map<string, string>>();
  const commits = new Map<string, { tree: string; parents: string[]; message: string }>();
  let head: string | undefined;
  let n = 0;
  const posts: string[] = [];
  const id = () => (++n).toString(16).padStart(40, '0');
  const sha1 = (d: Uint8Array) => createHash('sha1').update(`blob ${d.length}\0`).update(d).digest('hex');
  const json = (body: unknown, status = 200) => new Response(body === undefined ? null : JSON.stringify(body), { status });
  const files = () => (head ? trees.get(commits.get(head)!.tree)! : new Map<string, string>());
  const commit = (entries: Map<string, string>, message: string) => {
    const t = id(); trees.set(t, entries);
    const c = id(); commits.set(c, { tree: t, parents: head ? [head] : [], message });
    head = c;
  };
  if (!opts.leer) {
    const d = new TextEncoder().encode('# x');
    blobs.set(sha1(d), d);
    commit(new Map([['README.md', sha1(d)]]), 'init');
  }

  const f = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input));
    const p = url.pathname.replace(`/repos/${Z.owner}/${Z.repo}`, '');
    const m = init.method ?? 'GET';
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    if (m === 'POST') posts.push(p);
    if (p === '' && m === 'GET') return json({ private: opts.privat ?? true, default_branch: 'main', full_name: 'philipp/material', permissions: { push: true } });
    if (p === '/git/ref/heads/main') return head ? json({ object: { sha: head } }) : json({ message: 'Git Repository is empty.' }, 409);
    let r: RegExpMatchArray | null;
    if ((r = p.match(/^\/git\/blobs\/(\w+)$/))) return json(undefined, blobs.has(r[1]!) ? 200 : 404);
    if (p === '/git/blobs' && m === 'POST') {
      const d = new Uint8Array(Buffer.from(body.content, 'base64'));
      blobs.set(sha1(d), d);
      return json({ sha: sha1(d) }, 201);
    }
    if ((r = p.match(/^\/git\/commits\/(\w+)$/))) return json({ tree: { sha: commits.get(r[1]!)!.tree } });
    if (p === '/git/trees' && m === 'POST') {
      const t = new Map(trees.get(body.base_tree));
      for (const e of body.tree) {
        if (e.content !== undefined) { const d = new TextEncoder().encode(e.content); blobs.set(sha1(d), d); t.set(e.path, sha1(d)); }
        else { if (!blobs.has(e.sha)) return json({ message: 'bad sha' }, 422); t.set(e.path, e.sha); }
      }
      const s = id(); trees.set(s, t); return json({ sha: s }, 201);
    }
    if (p === '/git/commits' && m === 'POST') { const c = id(); commits.set(c, { tree: body.tree, parents: body.parents, message: body.message }); return json({ sha: c }, 201); }
    if (p === '/git/refs/heads/main' && m === 'PATCH') {
      if (commits.get(body.sha)!.parents[0] !== head) return json({ message: 'not fast forward' }, 422);
      head = body.sha; return json({ object: { sha: head } });
    }
    if ((r = p.match(/^\/contents\/(.+)$/))) {
      const pfad = decodeURIComponent(r[1]!.split("?")[0]!);
      const all = files();
      if (m === 'PUT') {
        const d = new Uint8Array(Buffer.from(body.content, 'base64'));
        blobs.set(sha1(d), d);
        const t = new Map(all); t.set(pfad, sha1(d)); commit(t, body.message);
        return json({}, 201);
      }
      if (all.has(pfad)) {
        const raw = String((init.headers as Record<string, string> | undefined)?.Accept ?? '').includes('raw');
        if (!raw) return json({ sha: all.get(pfad), type: 'file' });
        const d = blobs.get(all.get(pfad)!)!;
        return new Response(d as BodyInit, { status: 200 });
      }
      const kinder = new Set([...all.keys()].filter((k) => k.startsWith(pfad + '/')).map((k) => k.slice(pfad.length + 1).split('/')[0]!));
      if (!kinder.size) return json({ message: 'Not Found' }, 404);
      return json([...kinder].map((name) => ({ name, type: all.has(`${pfad}/${name}`) ? 'file' : 'dir' })));
    }
    return json({ message: `unbekannt ${m} ${p}` }, 500);
  }) as typeof fetch;

  const lies = (pfad: string) => blobs.get(files().get(pfad)!)!;
  return { f, files, lies, posts, commits: () => commits, moveHead: () => commit(new Map(files()), 'fremd') };
}

function datei(name: string, groesse: number, saat = 1): File {
  const d = new Uint8Array(groesse);
  for (let i = 0; i < groesse; i++) d[i] = (i * 31 + saat) & 0xff;
  return new File([d], name, { type: 'application/pdf' });
}

describe('Hilfsfunktionen', () => {
  it('bildet Ordnernamen ohne Umlaute und Sonderzeichen', () => {
    expect(slug('Pflege Heute – 8. Auflage.pdf')).toBe('pflege-heute-8-auflage');
    expect(slug('Größe & Gewicht.PDF')).toBe('groesse-gewicht');
    expect(slug('***.pdf')).toBe('datei');
    expect(slug('Verst\u0061\u0308ndigung.pdf')).toBe('verstaendigung');
    expect(sichererName('Anatomie für Pflege.PDF')).toBe('anatomie-fuer-pflege.pdf');
  });
  it('liest Repo-Angaben', () => {
    expect(parseRepo('Freadeax/lernstoff-material')).toEqual({ owner: 'Freadeax', repo: 'lernstoff-material' });
    expect(parseRepo('https://github.com/Freadeax/lernstoff-material.git')).toEqual({ owner: 'Freadeax', repo: 'lernstoff-material' });
    expect(parseRepo('nur-ein-name')).toBeNull();
  });
  it('rechnet Teile und Prüfsummen wie git und sha256sum', async () => {
    expect(teilAnzahl(0)).toBe(1);
    expect(teilAnzahl(15 * 1024 * 1024)).toBe(1);
    expect(teilAnzahl(15 * 1024 * 1024 + 1)).toBe(2);
    const d = new TextEncoder().encode('hallo\n');
    expect(await gitBlobSha(d)).toBe(createHash('sha1').update('blob 6\0hallo\n').digest('hex'));
    expect(await sha256(d)).toBe(createHash('sha256').update(d).digest('hex'));
    const gross = new Uint8Array(100_000).map((_, i) => i & 0xff);
    expect(base64(gross)).toBe(Buffer.from(gross).toString('base64'));
  });
  it('überspringt Dateien, die schon vollständig da sind, und weicht sonst aus', () => {
    const m = { name: 'Buch.pdf', groesse: 10 } as Manifest;
    expect(waehleOrdner({ name: 'Buch.pdf', size: 10 }, [{ ordner: 'buch', manifest: m }])).toEqual({ ordner: 'buch', schonDa: true });
    expect(waehleOrdner({ name: 'Buch.pdf', size: 11 }, [{ ordner: 'buch', manifest: m }])).toEqual({ ordner: 'buch-2', schonDa: false });
    expect(waehleOrdner({ name: 'Buch.pdf', size: 11 }, [])).toEqual({ ordner: 'buch', schonDa: false });
    // Ordner aus älterer Namensregel: trotzdem als vorhanden erkennen
    expect(waehleOrdner({ name: 'Grö\u00dfe.pdf', size: 5 }, [{ ordner: 'gro-sse', manifest: { name: 'Gro\u0308\u00dfe.pdf', groesse: 5 } as Manifest }])).toEqual({ ordner: 'gro-sse', schonDa: true });
  });
});

describe('Upload ins Material-Repo', () => {
  it('erkennt öffentliche Repos', async () => {
    const gh = fakeGitHub({ privat: false });
    expect((await pruefeRepo(Z, gh.f)).privat).toBe(false);
  });

  it('richtet ein leeres Repo mit README und Skript ein', async () => {
    const gh = fakeGitHub({ leer: true });
    const info = await pruefeRepo(Z, gh.f);
    expect(info.leer).toBe(true);
    await richteEin(Z, info, '# Ablage', 'print(1)', gh.f);
    expect(new TextDecoder().decode(gh.lies('abholen.py'))).toBe('print(1)');
    expect([...gh.files().keys()].sort()).toEqual(['README.md', 'abholen.py']);
    expect(info.eingerichtet).toBe(true);
  });

  it('richtet auch ein Repo mit GitHub-README ein und ersetzt die README', async () => {
    const gh = fakeGitHub();
    const info = await pruefeRepo(Z, gh.f);
    expect(info).toMatchObject({ leer: false, eingerichtet: false });
    await richteEin(Z, info, '# Ablage', 'print(1)', gh.f);
    expect(new TextDecoder().decode(gh.lies('README.md'))).toBe('# Ablage');
    expect((await pruefeRepo(Z, gh.f)).eingerichtet).toBe(true);
  });

  it('zerlegt große Dateien, legt ein Manifest an und setzt sie wieder richtig zusammen', async () => {
    const gh = fakeGitHub();
    const d = datei('Pflege Heute.pdf', 2500, 7);
    const phasen: string[] = [];
    const r = await ladeHoch(Z, d, { branch: 'main', vorhanden: [], teilGroesse: 1000, kategorie: 'Pflege', fetch: gh.f, onFortschritt: (p) => phasen.push(p.phase) });
    expect(r.ordner).toBe('pflege-heute');
    expect(r.manifest.teile.map((t) => t.datei)).toEqual(['teil-001', 'teil-002', 'teil-003']);
    expect(r.manifest.teile.map((t) => t.groesse)).toEqual([1000, 1000, 500]);
    expect(phasen.at(-1)).toBe('fertig');

    const zusammen = Buffer.concat(r.manifest.teile.map((t) => gh.lies(`dateien/pflege-heute/${t.datei}`)));
    expect(zusammen.equals(Buffer.from(await d.arrayBuffer()))).toBe(true);
    const manifest = JSON.parse(new TextDecoder().decode(gh.lies('dateien/pflege-heute/manifest.json'))) as Manifest;
    expect(manifest).toMatchObject({ format: 'lernstoff-ablage/1', name: 'Pflege Heute.pdf', groesse: 2500, kategorie: 'Pflege' });
    expect(manifest.teile[0]!.sha256).toBe(createHash('sha256').update(gh.lies('dateien/pflege-heute/teil-001')).digest('hex'));

    // Ein Commit pro Datei
    expect([...gh.commits().values()].filter((c) => c.message.startsWith('Ablage: Pflege Heute.pdf'))).toHaveLength(1);
    const liste = await listeDateien(Z, gh.f);
    expect(liste).toEqual([{ ordner: 'pflege-heute', manifest }]);
  });

  it('liest Repo-Originale am festen Commit und prüft alle Teile', async () => {
    const gh = fakeGitHub();
    const original = datei('Gross.pdf', 2500, 11);
    const r = await ladeHoch(Z, original, { branch: 'main', vorhanden: [], teilGroesse: 1000, fetch: gh.f });
    const refs: string[] = [];
    const f = (async (u, o) => { if (String(u).includes('/contents/dateien/')) refs.push(new URL(String(u)).searchParams.get('ref')!); return gh.f(u, o); }) as typeof fetch;
    const file = await ladeOriginal(Z, r, f);
    expect(file.name).toBe(original.name);
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array(await original.arrayBuffer()));
    expect(refs).toHaveLength(4);
    expect(new Set(refs).size).toBe(1);
    expect(refs[0]).toMatch(/^[a-f0-9]{40}$/);
  });

  it('weist beschädigte Dateiteile zurück', async () => {
    const gh = fakeGitHub();
    const r = await ladeHoch(Z, datei('A.pdf', 100), { branch: 'main', vorhanden: [], fetch: gh.f });
    const f = (async (u, o) => String(u).includes('/a.pdf?') ? new Response(new Uint8Array(100)) : gh.f(u, o)) as typeof fetch;
    await expect(ladeOriginal(Z, r, f)).rejects.toThrow('Prüfsumme');
  });

  it('bewahrt gleich große Dateien gleichen Namens mit anderem Inhalt als eigene Originale', async () => {
    const gh = fakeGitHub();
    await ladeHoch(Z, datei('A.pdf', 100, 1), { branch: 'main', vorhanden: [], fetch: gh.f });
    const r = await ladeHoch(Z, datei('A.pdf', 100, 2), { branch: 'main', vorhanden: await listeDateien(Z, gh.f), fetch: gh.f });
    expect(r.uebersprungen).toBe(false);
    expect(r.ordner).toBe('a-2');
    expect(await listeDateien(Z, gh.f)).toHaveLength(2);
  });

  it('legt kleine Dateien unter ihrem Namen ab', async () => {
    const gh = fakeGitHub();
    const r = await ladeHoch(Z, datei('Skript Anatomie.pdf', 300), { branch: 'main', vorhanden: [], teilGroesse: 1000, fetch: gh.f });
    expect(r.manifest.teile.map((t) => t.datei)).toEqual(['skript-anatomie.pdf']);
    expect(gh.files().has('dateien/skript-anatomie/skript-anatomie.pdf')).toBe(true);
  });

  it('sendet Teile, die GitHub nach einem Abbruch schon hat, nicht noch einmal', async () => {
    const gh = fakeGitHub();
    const d = datei('Buch.pdf', 3000);
    const ctrl = new AbortController();
    await expect(ladeHoch(Z, d, {
      branch: 'main', vorhanden: [], teilGroesse: 1000, fetch: gh.f, signal: ctrl.signal,
      onFortschritt: (p) => { if (p.phase === 'pruefen' && p.teil === 2) ctrl.abort(); },
    })).rejects.toThrow();
    expect(gh.posts.filter((p) => p === '/git/blobs')).toHaveLength(2);
    expect(gh.files().has('dateien/buch/manifest.json')).toBe(false);

    await ladeHoch(Z, d, { branch: 'main', vorhanden: [], teilGroesse: 1000, fetch: gh.f });
    expect(gh.posts.filter((p) => p === '/git/blobs')).toHaveLength(3);
    const vorhanden = await listeDateien(Z, gh.f);
    const nochmal = await ladeHoch(Z, d, { branch: 'main', vorhanden, teilGroesse: 1000, fetch: gh.f });
    expect(nochmal.uebersprungen).toBe(true);
  });

  it('setzt den Commit neu auf, wenn der Branch inzwischen weitergezogen ist', async () => {
    const gh = fakeGitHub();
    let einmal = true;
    const f = (async (u: RequestInfo | URL, i?: RequestInit) => {
      if (einmal && String(u).endsWith('/git/commits') && i?.method === 'POST') { einmal = false; const res = await gh.f(u, i); gh.moveHead(); return res; }
      return gh.f(u, i);
    }) as typeof fetch;
    await ladeHoch(Z, datei('A.pdf', 10), { branch: 'main', vorhanden: [], fetch: f });
    expect(gh.files().has('dateien/a/manifest.json')).toBe(true);
  });

  it('meldet fehlende Rechte verständlich', async () => {
    const f = (async () => new Response(JSON.stringify({ message: 'Bad credentials' }), { status: 401 })) as unknown as typeof fetch;
    await expect(pruefeRepo(Z, f)).rejects.toThrow('Token ist ungültig');
  });
});
