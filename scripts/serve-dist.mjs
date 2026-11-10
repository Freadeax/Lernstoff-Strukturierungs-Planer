// Kleiner Server für dist/, der die Header aus dist/_headers so setzt wie Cloudflare Pages.
// Damit laufen alle Browser-Prüfungen mit derselben Content Security Policy wie die echte Seite.
//   node scripts/serve-dist.mjs [port]       (Standard 4173)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const port = Number(process.argv[2] || process.env.PORT || 4173);

const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.wasm': 'application/wasm',
  '.gz': 'application/gzip', '.txt': 'text/plain; charset=utf-8', '.traineddata': 'application/octet-stream',
};

/** Liest das Cloudflare-Format: Pfadzeile ohne Einrückung, darunter eingerückte „Name: Wert“-Zeilen. */
export function leseHeaderRegeln(text) {
  const regeln = [];
  let aktuell = null;
  for (const zeile of text.split('\n')) {
    if (!zeile.trim() || zeile.trim().startsWith('#')) continue;
    if (!/^\s/.test(zeile)) { aktuell = { muster: zeile.trim(), header: [] }; regeln.push(aktuell); continue; }
    const i = zeile.indexOf(':');
    if (aktuell && i > 0) aktuell.header.push([zeile.slice(0, i).trim(), zeile.slice(i + 1).trim()]);
  }
  return regeln.map((r) => ({ ...r, re: new RegExp('^' + r.muster.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$') }));
}

const regeln = fs.existsSync(path.join(root, '_headers')) ? leseHeaderRegeln(fs.readFileSync(path.join(root, '_headers'), 'utf8')) : [];

http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  let datei = path.join(root, decodeURIComponent(url.pathname));
  if (!datei.startsWith(root)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(datei) && fs.statSync(datei).isDirectory()) datei = path.join(datei, 'index.html');
  if (!fs.existsSync(datei) || path.basename(datei) === '_headers') { res.writeHead(404).end('nicht gefunden'); return; }
  const header = { 'Content-Type': TYPEN[path.extname(datei)] ?? 'application/octet-stream' };
  for (const r of regeln) if (r.re.test(url.pathname)) for (const [k, v] of r.header) header[k] = v;
  res.writeHead(200, header);
  fs.createReadStream(datei).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`dist/ mit _headers auf http://127.0.0.1:${port}/`));
