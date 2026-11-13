// Prüfregeln für Materiallieferungen (docs/MATERIAL-BEDARF.md, Abschnitt 0). Ohne Abhängigkeiten,
// damit es auf jedem Rechner mit Node läuft. Genutzt von scripts/lieferung-pruefen.mjs und vom Test.

/** Breite und Höhe aus dem Dateikopf von PNG, JPEG und WebP; null, wenn unbekannt. */
export function bildMasse(buf) {
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) return { breite: buf.readUInt32BE(16), hoehe: buf.readUInt32BE(20), typ: 'png' };
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { breite: buf.readUInt16BE(i + 7), hoehe: buf.readUInt16BE(i + 5), typ: 'jpeg' };
      i += 2 + buf.readUInt16BE(i + 2);
    }
    return null;
  }
  if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const art = buf.toString('ascii', 12, 16);
    if (art === 'VP8X') return { breite: 1 + buf.readUIntLE(24, 3), hoehe: 1 + buf.readUIntLE(27, 3), typ: 'webp' };
    if (art === 'VP8 ') return { breite: buf.readUInt16LE(26) & 0x3fff, hoehe: buf.readUInt16LE(28) & 0x3fff, typ: 'webp' };
    if (art === 'VP8L') { const b = buf.readUInt32LE(21); return { breite: (b & 0x3fff) + 1, hoehe: ((b >> 14) & 0x3fff) + 1, typ: 'webp' }; }
  }
  return null;
}

const BILD = /\.(png|jpe?g|webp)$/i;
const RAUM = /^\d{2}[a-z]?_[a-z0-9_]+$/;
const PORTRAET = /^[a-z0-9-]+_(stabil|angestrengt|kritisch)$/;
const VIDEO_PHASE = /^([a-z0-9_]+)-([1-4])$/;
const FALL = /^(praxis|fall|diagnostik|notfall):[a-z0-9-]+$/;

/**
 * Prüft eine Lieferung.
 * @param {{pfad: string, groesse: number, masse: ReturnType<typeof bildMasse>}[]} dateien relative Pfade
 * @param {{katalog?: unknown, vorhandeneIds: string[], bestellteIds: string[]}} kontext
 * @returns {{datei: string, art: string, id: string, stufe: 'fehler'|'warnung'|'ok', meldungen: string[]}[]}
 */
export function pruefeLieferung(dateien, { katalog, vorhandeneIds, bestellteIds }) {
  const eintraege = Array.isArray(katalog) ? katalog : Array.isArray(katalog?.assets) ? katalog.assets : [];
  const nachDatei = new Map();
  for (const e of eintraege) if (e && typeof e.datei === 'string') nachDatei.set(e.datei.split('/').pop(), e);
  const namen = new Set(dateien.map((d) => d.pfad.split('/').pop()));
  const aus = [];
  for (const d of dateien) {
    const name = d.pfad.split('/').pop();
    if (/^(.*\.(json|md|html?|txt|pdf|csv)|\.DS_Store)$/i.test(name)) continue; // Beilagen
    const id = name.replace(/\.[^.]+$/, '');
    const m = [];
    let fehler = false; let warnung = false;
    const f = (t) => { m.push(t); fehler = true; };
    const w = (t) => { m.push(t); warnung = true; };
    let art = 'sonstiges';
    if (name !== name.toLowerCase() || /[äöüß\s]/.test(name)) f('Dateiname nur klein, ohne Umlaute und Leerzeichen');
    if (/\.mp4$/i.test(name)) {
      art = 'video';
      for (let i = 1; i <= 4; i++) if (![...namen].some((n) => n.startsWith(`${id}-${i}.`))) f(`Phasenbild ${id}-${i} fehlt`);
      if (d.groesse > 15e6) w(`groß (${(d.groesse / 1e6).toFixed(1)} MB), Ziel unter 5 MB`);
    } else if (BILD.test(name)) {
      const mm = d.masse;
      if (!mm) f('Bildformat nicht lesbar');
      if (VIDEO_PHASE.test(id)) art = 'videophase';
      else if (PORTRAET.test(id)) {
        art = 'portraet';
        if (mm && Math.abs(mm.breite - mm.hoehe) > 2) w(`nicht quadratisch (${mm.breite} × ${mm.hoehe})`);
        if (mm && Math.min(mm.breite, mm.hoehe) < 512) f(`zu klein (${mm.breite} × ${mm.hoehe}, mind. 512 px)`);
      } else if (RAUM.test(id)) {
        art = 'raum';
        if (mm) {
          const v = mm.breite / mm.hoehe;
          if (Math.abs(v - 16 / 9) > 0.04) f(`kein 16:9 (${mm.breite} × ${mm.hoehe})`);
          if (mm.breite < 1280) f(`zu klein (${mm.breite} px breit, mind. 1280)`);
        }
      } else art = 'bild';
      if (d.groesse > 8e6) w(`groß (${(d.groesse / 1e6).toFixed(1)} MB)`);
    } else { art = 'unbekannt'; w('Dateityp wird nicht verarbeitet'); }

    const basisId = art === 'videophase' ? VIDEO_PHASE.exec(id)[1] : art === 'portraet' ? id : id;
    if (vorhandeneIds.includes(basisId)) w('ersetzt eine vorhandene Datei (gewollt?)');
    else if (art !== 'portraet' && art !== 'videophase' && !bestellteIds.includes(basisId)) w('ID steht nicht in der Bestellliste (MATERIAL-BEDARF.md, BESTELLUNG.md)');

    if (art !== 'videophase') {
      const k = nachDatei.get(name);
      if (!eintraege.length) w('kein ASSET_KATALOG.json in der Lieferung');
      else if (!k) f('fehlt im ASSET_KATALOG.json');
      else {
        if (!k.lizenz) f('Lizenz fehlt');
        if (!k.urheber) f('Urheber fehlt');
        if (!k.beschreibung) w('Beschreibung (Alternativtext) fehlt');
        const faelle = Array.isArray(k.faelle) ? k.faelle : [];
        if (!faelle.length) w('keine Fälle angegeben');
        for (const x of faelle) if (!FALL.test(x)) f(`Fall-ID „${x}“ hat nicht das Format praxis:id, fall:id, diagnostik:id`);
      }
    }
    aus.push({ datei: d.pfad, art, id: basisId, stufe: fehler ? 'fehler' : warnung ? 'warnung' : 'ok', meldungen: m });
  }
  for (const e of eintraege) {
    const n = typeof e?.datei === 'string' ? e.datei.split('/').pop() : '';
    if (n && !namen.has(n)) aus.push({ datei: e.datei, art: 'katalog', id: e.id ?? n, stufe: 'fehler', meldungen: ['im Katalog, aber Datei fehlt'] });
  }
  return aus;
}

/** IDs, die in MATERIAL-BEDARF.md in Backticks stehen (Bestellliste). */
export function bestellteIds(markdown) {
  return [...new Set([...markdown.matchAll(/`([a-z0-9][a-z0-9_]+)`/g)].map((m) => m[1]))];
}

export function berichtMarkdown(ergebnis, titel) {
  const z = (s) => ergebnis.filter((e) => e.stufe === s).length;
  const zeilen = [`# Lieferprüfung ${titel}`, '', `${ergebnis.length} Dateien: ${z('ok')} in Ordnung, ${z('warnung')} mit Hinweis, ${z('fehler')} mit Fehler.`, '',
    '| Datei | Art | Stand | Hinweise |', '| --- | --- | --- | --- |'];
  const rang = { fehler: 0, warnung: 1, ok: 2 };
  for (const e of [...ergebnis].sort((a, b) => rang[a.stufe] - rang[b.stufe] || a.datei.localeCompare(b.datei))) {
    zeilen.push(`| \`${e.datei}\` | ${e.art} | ${e.stufe === 'fehler' ? '**Fehler**' : e.stufe === 'warnung' ? 'Hinweis' : 'ok'} | ${e.meldungen.join('; ') || ''} |`);
  }
  return zeilen.join('\n') + '\n';
}
