import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { LernstoffDB } from '../../core/db';
import { pflegeModule } from '../../modules/pflege';
import { definitionen, fragen, istFragenAbschnitt, kartenAusAbschnitt, punkte } from './karten';
import { findeBelege, gruppenRang, leseBelegKlammer, parseSkript, skriptId, teileTitel } from './parser';
import { begriffe, klartext, markiere, suche } from './suche';
import { schlageThemenVor } from './themen';
import { bildVerweise, holeBilder, repoPfad, speicherImArbeitsspeicher } from './bilder';
import { holeAusRepo, ladeSkriptBilder, markiereGelesen, merkeZuletzt, ladeLesestaende, uebernehmeDateien } from './store';
import { bloecke } from './ui/Markdown';

// Erfundene Beispiel-Zusammenfassung im Format der echten Lernzusammenfassungen (keine Originalinhalte).
const BEISPIEL = `---
themen: [thema.kl.demenz, gibt.es.nicht]
---
# CE 09 · Menschen mit Demenz begleiten

Kurze Einleitung. Was nicht belegt ist, ist mit ⚠ markiert.

**Quellen (Kürzel · Datei · Seite = PDF-Seite)**
- **[D]** Lernsituation Demenz.pdf (40 S.)
- **[ENP]** Praxisleitlinien, Buchseite

## Der Fall: Frau Beispiel [D, S. 1–2]

- Frau Beispiel ist 80 Jahre alt.

## 1 · Verstehenshypothese

**P2 · Verstehenshypothese** [D, S. 21]
- Sie wird vor der Maßnahmenplanung formuliert.
- Sie ist immer **subjektiv** und wird angepasst.
  - Unterpunkt ohne eigenen Beleg.
- ⚠ Diese Aussage steht nicht im Material.

- **Biografiearbeit**: aktive Erinnerungsarbeit, die die Identität stärkt [D, S. 47].

| Gruppe | Wirkstoff |
|---|---|
| Cholinesterase-Hemmer | Donepezil [D, S. 26] |

> ⚠ Die Einteilung nach Schweregrad steht nicht im Material.

## 2 · Mehrere Belege [D, S. 5; ENP, S. 977]

Text mit [Link](https://example.org) und [x] ohne Beleg.
`;

describe('Parser', () => {
  const s = parseSkript('CE09-Demenz-Beispiel.md', BEISPIEL, { herkunft: 'datei', jetzt: '2026-10-27T10:00:00Z' });

  it('liest Gruppe, Titel, Quellen und Themen aus dem Kopf', () => {
    expect(s.id).toBe('ce09-demenz-beispiel');
    expect(s.gruppe).toBe('CE 09');
    expect(s.titel).toBe('Menschen mit Demenz begleiten');
    expect(s.quellen.map((q) => q.kuerzel)).toEqual(['D', 'ENP']);
    expect(s.quellen[0]!.text).toBe('Lernsituation Demenz.pdf (40 S.)');
    expect(s.topicIds).toEqual(['thema.kl.demenz', 'gibt.es.nicht']);
    expect(s.einleitung).toContain('Kurze Einleitung');
    expect(s.einleitung).not.toContain('Quellen');
  });

  it('teilt an ## in Abschnitte mit Nummer, Titel ohne Beleg und Belegen', () => {
    expect(s.abschnitte.map((a) => [a.nummer, a.titel])).toEqual([[undefined, 'Der Fall: Frau Beispiel'], ['1', 'Verstehenshypothese'], ['2', 'Mehrere Belege']]);
    expect(s.abschnitte[0]!.belege).toEqual([{ kuerzel: 'D', stelle: 'S. 1–2' }]);
    expect(s.abschnitte[2]!.belege).toEqual([{ kuerzel: 'D', stelle: 'S. 5' }, { kuerzel: 'ENP', stelle: 'S. 977' }]);
    expect(s.abschnitte[1]!.luecken).toBe(2);
  });

  it('erkennt Belege, aber keine Links oder Kästchen', () => {
    expect(leseBelegKlammer('D, S. 23–25, 38–41')).toEqual([{ kuerzel: 'D', stelle: 'S. 23–25, 38–41' }]);
    expect(leseBelegKlammer('N-1')).toEqual([{ kuerzel: 'N-1' }]);
    expect(leseBelegKlammer('x')).toBeNull();
    expect(leseBelegKlammer('Q, S. 1', new Set(['D']))).toBeNull();
    expect(findeBelege('[Link](https://x.de) und [D, S. 2]')).toEqual([{ kuerzel: 'D', stelle: 'S. 2' }]);
  });

  it('ordnet Gruppen CE vor LEB und rät die Gruppe aus dem Dateinamen', () => {
    expect(['LEB 5', 'Weitere', 'CE 09', 'CE 01'].sort((a, b) => gruppenRang(a).localeCompare(gruppenRang(b)))).toEqual(['CE 01', 'CE 09', 'LEB 5', 'Weitere']);
    expect(teileTitel('Herzinsuffizienz', 'LEB5-1-Herzinsuffizienz.md')).toEqual({ gruppe: 'LEB 5', titel: 'Herzinsuffizienz' });
    expect(teileTitel('CE 5 · Blut', 'x.md').gruppe).toBe('CE 05');
    expect(skriptId('Ordner/CE02-Ernährung.md')).toBe('ce02-ernaehrung');
  });

  it('wirft bei Dateien ohne Überschrift', () => {
    expect(() => parseSkript('leer.md', 'nur Text', { herkunft: 'datei' })).toThrow(/Überschrift/);
  });
});

describe('Markdown-Blöcke', () => {
  it('erkennt verschachtelte Listen, Tabellen und Warnzitate', () => {
    const b = bloecke('- a\n  - b\n- c\n\n| x | y |\n|---|---|\n| 1 | 2 |\n\n> ⚠ fehlt');
    expect(b.map((x) => x.art)).toEqual(['liste', 'tabelle', 'zitat']);
    const liste = b[0] as Extract<(typeof b)[number], { art: 'liste' }>;
    expect(liste.punkte.map((p) => p.text)).toEqual(['a', 'c']);
    expect(liste.punkte[0]!.kinder[0]).toMatchObject({ art: 'liste' });
    expect(b[2]).toMatchObject({ art: 'zitat', warnung: true });
  });
});

describe('Suche', () => {
  const s = parseSkript('CE09-Demenz-Beispiel.md', BEISPIEL, { herkunft: 'datei' });
  it('findet Abschnitte, in denen alle Begriffe vorkommen, Überschrift zuerst', () => {
    const t = suche([s], 'verstehenshypothese');
    expect(t[0]!.abschnitt.titel).toBe('Verstehenshypothese');
    expect(suche([s], 'Donepezil Maßnahmenplanung')).toHaveLength(1);
    expect(suche([s], 'Donepezil Delir')).toHaveLength(0);
  });
  it('normalisiert Umlaute und Phrasen', () => {
    expect(begriffe('„Maßnahmen planen“ Ärzte')).toEqual(['massnahmen planen', 'aerzte']);
    expect(markiere('Die Maßnahme', ['massnahme'])).toEqual([[4, 12]]);
    expect(klartext('**fett** | a |')).toBe('fett · a ·');
  });
});

describe('Karteikarten aus Abschnitten', () => {
  const s = parseSkript('CE09-Demenz-Beispiel.md', BEISPIEL, { herkunft: 'datei' });
  const a = s.abschnitte[1]!;
  it('nimmt nur belegte Punkte, ⚠-Punkte bleiben draußen, Unterpunkte erben den Beleg', () => {
    const ps = punkte(a.markdown, new Set(['D', 'ENP']));
    expect(ps.some((p) => p.text.includes('nicht im Material'))).toBe(false);
    expect(ps.find((p) => p.unterpunkt)?.belege).toEqual([{ kuerzel: 'D', stelle: 'S. 21' }]);
    expect(ps[0]!.gruppe).toBe('P2 · Verstehenshypothese');
  });
  it('übernimmt Belege aus der ##-Überschrift für Punkte ohne eigenen Beleg', () => {
    const fall = s.abschnitte[0]!;
    expect(fall.kopfBelege).toEqual([{ kuerzel: 'D', stelle: 'S. 1–2' }]);
    const karten = kartenAusAbschnitt(s, fall);
    expect(karten).toHaveLength(1);
    expect(karten[0]!.belege![0]).toMatchObject({ printedPage: 'D, S. 1–2' });
  });
  it('baut Kernaussagen- und Definitionskarten mit Belegen', () => {
    const karten = kartenAusAbschnitt(s, a, ['fach.x']);
    const kern = karten.find((k) => k.art === 'Abschnitt → Kernaussagen')!;
    expect(kern.vorne).toContain('P2 · Verstehenshypothese');
    expect(kern.liste).toContain('Sie wird vor der Maßnahmenplanung formuliert.');
    expect(kern.belege![0]).toMatchObject({ documentId: 'skript:ce09-demenz-beispiel', page: 21, printedPage: 'D, S. 21' });
    expect(definitionen(a.markdown)[0]!.begriff).toBe('Biografiearbeit');
    expect(karten.find((k) => k.art === 'Definition')).toMatchObject({ vorne: 'Was ist Biografiearbeit?', subjectIds: ['fach.x'] });
    expect(new Set(karten.map((k) => k.id)).size).toBe(karten.length);
  });
});

describe('Themenvorschlag', () => {
  it('schlägt Demenz vor, wenn die Datei keine Themen nennt', () => {
    const s = parseSkript('x.md', BEISPIEL.replace(/^---[\s\S]*?---\n/, ''), { herkunft: 'datei' });
    expect(schlageThemenVor(s, pflegeModule.topics)).toContain('thema.kl.demenz');
  });
});

describe('Speichern und Import', () => {
  let db: LernstoffDB;
  beforeEach(() => {
    db = new LernstoffDB(`skript-${Math.random()}`);
    const m = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k),
    };
  });

  it('übernimmt neu, erkennt Unverändertes, behält manuelle Themen und filtert unbekannte Themen', async () => {
    let e = await uebernehmeDateien([{ name: 'a.md', text: BEISPIEL }, { name: 'kaputt.md', text: 'ohne Titel' }], 'datei', db);
    expect(e.neu).toHaveLength(1);
    expect(e.fehler).toHaveLength(1);
    expect((await db.skripte.get('a'))!.topicIds).toEqual(['thema.kl.demenz']);
    await db.skripte.update('a', { topicIds: ['thema.ap.nerven'], themenManuell: true });
    e = await uebernehmeDateien([{ name: 'a.md', text: BEISPIEL }], 'repo', db);
    expect(e.unveraendert).toHaveLength(1);
    e = await uebernehmeDateien([{ name: 'a.md', text: `${BEISPIEL}\nNeu.` }], 'repo', db);
    expect(e.aktualisiert).toHaveLength(1);
    expect((await db.skripte.get('a'))!.topicIds).toEqual(['thema.ap.nerven']);
    expect(await db.skripte.where('topicIds').equals('thema.ap.nerven').count()).toBe(1);
  });

  it('holt .md-Dateien aus skripte/ im Material-Repo', async () => {
    const aufrufe: string[] = [];
    const f = (async (url: string) => {
      aufrufe.push(url);
      if (url.endsWith('/contents/skripte')) return new Response(JSON.stringify([
        { name: 'CE09.md', type: 'file', path: 'skripte/CE09.md' }, { name: 'README.md', type: 'file', path: 'skripte/README.md' }, { name: 'bild.png', type: 'file', path: 'skripte/bild.png' },
      ]));
      return new Response(BEISPIEL);
    }) as typeof fetch;
    const d = await holeAusRepo({ owner: 'o', repo: 'r', token: 't' }, f);
    expect(d).toEqual([{ name: 'CE09.md', text: BEISPIEL }]);
    expect(aufrufe).toContain('https://api.github.com/repos/o/r/contents/skripte/CE09.md');
  });

  it('merkt den Lesestand', () => {
    markiereGelesen('a', 'a1', true);
    markiereGelesen('a', 'a2', true);
    markiereGelesen('a', 'a1', false);
    expect(ladeLesestaende().a!.gelesen).toEqual(['a2']);
    expect(merkeZuletzt('a', 'a3').a).toMatchObject({ gelesen: ['a2'], zuletzt: 'a3' });
  });
});

describe('Datenbank-Version 7', () => {
  it('legt die Tabelle skripte auch auf Geräten an, die schon Version 6 haben', async () => {
    const name = 'skript-v6-upgrade';
    const { default: Dexie } = await import('dexie');
    const alt = new Dexie(name);
    alt.version(6).stores({ pipelineRuns: 'id, startedAt, ergebnisSummaryId' });
    await alt.table('pipelineRuns').add({ id: 'r1', startedAt: '2026-10-27T10:00:00Z' });
    alt.close();
    const db = new LernstoffDB(name);
    await db.skripte.put(parseSkript('a.md', BEISPIEL, { herkunft: 'datei' }));
    expect(await db.skripte.count()).toBe(1);
    expect(await db.pipelineRuns.count()).toBe(1);
    expect(db.verno).toBe(7);
  });
});

describe('Eigene Gruppen und Abbildungen', () => {
  it('nimmt die Gruppe aus dem Dateikopf und zeigt sie im Titel nicht doppelt', () => {
    const s = parseSkript('AML-15-Herz.md', '---\ngruppe: Arzneimittellehre\n---\n# Arzneimittellehre · Kap. 15 Herz\n\n## 1 · A [B]\n- x [B]', { herkunft: 'datei' });
    expect(s.gruppe).toBe('Arzneimittellehre');
    expect(s.titel).toBe('Kap. 15 Herz');
    expect(parseSkript('x.md', '# Arzneimittellehre · Kap. 1\n\n## 1 · A\n- y', { herkunft: 'datei' }).gruppe).toBe('Weitere');
    expect(['Weitere', 'Arzneimittellehre', 'CE 05'].sort((a, b) => gruppenRang(a).localeCompare(gruppenRang(b)))).toEqual(['CE 05', 'Arzneimittellehre', 'Weitere']);
  });

  it('löst Bildpfade gegen skripte/ auf und lässt Netz- und SVG-Bilder weg', () => {
    expect(repoPfad('bilder/aml/abb-15-01.jpg')).toBe('skripte/bilder/aml/abb-15-01.jpg');
    expect(repoPfad('./bilder/../bilder/a.png')).toBe('skripte/bilder/a.png');
    expect(repoPfad('../dateien/x.webp')).toBe('dateien/x.webp');
    expect(repoPfad('../../x.png')).toBeUndefined();
    expect(repoPfad('https://x.de/a.png')).toBeUndefined();
    expect(repoPfad('bild.svg')).toBeUndefined();
    expect(bildVerweise('- Abbildung [AML, S. 3] ![Abb. 1](bilder/a.png "Abb. 1 [AML, S. 3]")\n![b](bilder/a.png) ![c](https://x.de/c.png)')).toEqual(['skripte/bilder/a.png']);
    expect(klartext('Text ![Abb. 2 Herz](bilder/b.png) Ende')).toBe('Text Abb. 2 Herz Ende');
    expect(punkte('- Abb. 2 zeigt das Herz [B, S. 1] ![Abb. 2](bilder/b.png)')[0]!.text).toBe('Abb. 2 zeigt das Herz');
  });

  it('holt nur neue oder geänderte Bilder, meldet fehlende und räumt verwaiste auf', async () => {
    const db = new LernstoffDB(`skript-bild-${Math.random()}`);
    await uebernehmeDateien([{ name: 'a.md', text: `${BEISPIEL}\n- Bild [D, S. 1] ![Abb](bilder/a.png)\n- ![Fehlt](bilder/fehlt.jpg)` }], 'repo', db);
    const speicher = speicherImArbeitsspeicher();
    await speicher.lege('skripte/bilder/alt.png', new Blob(['x']));
    let sha = 's1';
    const aufrufe: string[] = [];
    const f = (async (url: string) => {
      aufrufe.push(url);
      if (url.endsWith('/skripte/bilder/a.png')) return new Response(JSON.stringify({ type: 'file', sha, encoding: 'base64', content: btoa('PNGDATA') }));
      return new Response('{}', { status: 404 });
    }) as typeof fetch;
    const z = { owner: 'o', repo: 'r', token: 't' };
    let e = await ladeSkriptBilder(z, speicher, db, f);
    expect(e).toMatchObject({ neu: 1, aktualisiert: 0, fehlend: ['skripte/bilder/fehlt.jpg'], entfernt: 1 });
    const b = await speicher.hole('skripte/bilder/a.png');
    expect(b!.blob.type).toBe('image/png');
    expect(await b!.blob.text()).toBe('PNGDATA');
    e = await ladeSkriptBilder(z, speicher, db, f);
    expect(e).toMatchObject({ neu: 0, unveraendert: 1 });
    sha = 's2';
    e = await ladeSkriptBilder(z, speicher, db, f);
    expect(e.aktualisiert).toBe(1);
    expect(await speicher.pfade()).toEqual(['skripte/bilder/a.png']);
  });

  it('bricht bei ungültigem Token ab', async () => {
    const f = (async () => new Response('', { status: 401 })) as unknown as typeof fetch;
    await expect(holeBilder(['skripte/a.png'], { owner: 'o', repo: 'r', token: 't' }, speicherImArbeitsspeicher(), f)).rejects.toThrow(/Token/);
  });
});

describe('Lernfragen', () => {
  const md = '---\ngruppe: Arzneimittellehre\n---\n# Arzneimittellehre · Kap. 15 Herz\n\n**Quellen**\n- **[AML]** Buch\n- **[WC]** Wissenscheck\n\n## 1 · Nitrate [AML, S. 214]\n- Nitrate erweitern Venen [AML, S. 214]\n\n## 2 · Selbstcheck [AML, S. 209]\n- Wann ist Nitrat verboten? Bei RR unter 90 mmHg [AML, S. 214].\n- Ohne Antwort?\n- Was hilft sonst? ⚠ Lehrbuch: Ruhe.\n\n## 3 · Wissenscheck des Buchs [WC, S. 1]\nFragen aus dem Buch.\n- **Nennen Sie 2 Wirkstoffe.** Nitrate und Betablocker [AML, S. 213]\n  - dazu ASS [AML, S. 217]\n';
  it('liest beide Fragenformen und macht je eine Karte mit Frage vorn', () => {
    const s = parseSkript('AML-15.md', md, { herkunft: 'repo' });
    expect(istFragenAbschnitt(s.abschnitte[1]!)).toBe(true);
    expect(istFragenAbschnitt(s.abschnitte[0]!)).toBe(false);
    const f = fragen(s.abschnitte[2]!.markdown);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ frage: 'Nennen Sie 2 Wirkstoffe.', unbelegt: false });
    expect(f[0]!.antwort).toContain('\n- dazu ASS');
    expect(fragen(s.abschnitte[1]!.markdown).map((x) => x.frage)).toEqual(['Wann ist Nitrat verboten?', 'Was hilft sonst?']);
    const k1 = kartenAusAbschnitt(s, s.abschnitte[1]!);
    expect(k1).toHaveLength(1);
    expect(k1[0]).toMatchObject({ id: 'skf:aml-15:n2:1', art: 'Lernfrage', vorne: 'Wann ist Nitrat verboten?', hinten: 'Bei RR unter 90 mmHg.' });
    const k2 = kartenAusAbschnitt(s, s.abschnitte[2]!);
    expect(k2[0]).toMatchObject({ hinten: 'Nitrate und Betablocker', liste: ['dazu ASS'] });
    expect((k2[0]!.belege ?? []).map((b) => b.printedPage)).toEqual(['AML, S. 213', 'AML, S. 217']);
  });
});
