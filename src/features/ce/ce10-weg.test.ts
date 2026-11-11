// CE 10 „Neugeborenes“: vollständiger Weg von der Quelle bis zur Abfrage (Audit 11.11.2026).
// Skript (Quelle mit Belegen) → Zuordnung zur CE → Karteikarten aus dem Skript → Selbsttest möglich
// → Lernplan plant das Thema → gebuchte Abfrage zählt, setzt die nächste Fälligkeit und erscheint in der Matrix.
// Der Text unten ist synthetisch im Format der Skripte; das echte Skript liegt nur im privaten Material-Repo
// und wird zusätzlich geprüft, wenn es neben dem App-Repo liegt (MATERIAL_REPO=Pfad).
import 'fake-indexeddb/auto';
import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, deleteAll } from '../../core/db';
import { modules } from '../../modules/registry';
import { buildPlan } from '../lernplan';
import { bucheErgebnis } from '../lernplan/ergebnis';
import { assembleInput, loadPlannerData, saveConfig, saveExam } from '../lernplan/store';
import { kartenAusAbschnitt } from '../skript/karten';
import { parseSkript } from '../skript/parser';
import { abschnitteDerCe, ceMatrix, istWegVollstaendig, nachAbschnitt, alleCeMatrix } from './matrix';
import { ceListe } from './modell';
import { testbareThemen } from './selbsttest';

const modul = modules[0]!;
const liste = ceListe(modul);
const ce10 = liste.find((c) => c.id === 'ce.10')!;
const NEU = 'thema.ph.neugeborenes';

const SKRIPT = `---
themen: [thema.ap.fortpflanzung, thema.ph.neugeborenes, thema.fa.paediatrie]
---
# CE 10 · Testskript Neugeborenes

**Quellen**
- **[T]** Testmaterial.pdf (2 S.)

## 1 · Anpassung nach der Geburt [T, S. 1]

- Atmung setzt ein, der Lungenkreislauf öffnet sich [T, S. 1].
- Wärmeverlust vermeiden [T, S. 1].

## 2 · Erste Untersuchung [T, S. 1]

- Punktwert nach 1, 5 und 10 Minuten [T, S. 1].
- **Ablauf:**
  - Atmung, Puls, Grundtonus, Aussehen, Reflexe [T, S. 1].

## 3 · Pflege im Wochenbett [T, S. 2]

- Rückbildung beobachten [T, S. 2].
- Stillen unterstützen [T, S. 2].

## 4 · Ergänzende Fachquellen

- Lehrbuch Pflege, Kapitel Wochenbett [T, S. 2].
`;

const HEUTE = '2026-11-11';

describe('CE 10 Neugeborenes: Weg von der Quelle bis zur Abfrage', () => {
  beforeEach(async () => { await deleteAll(); });

  it('Katalog: CE 10 hat ein eigenes Thema Neugeborenes und Wochenbett und liegt in beiden Ausbildungsabschnitten', () => {
    const t = modul.topics.find((x) => x.id === NEU) as (typeof modul.topics)[number] & { competencyIds?: string[] };
    expect(t.competencyIds).toContain('ce.10');
    expect(t.prerequisites).toContain('thema.ap.fortpflanzung');
    expect(abschnitteDerCe(modul, 'ce.10')).toEqual(['ad12', 'ad3']);
    expect(abschnitteDerCe(modul, 'ce.01')).toEqual(['ad12']);
  });

  it('Skript → CE-Zuordnung → Karten → Selbsttest → Lernplan → Abfrage', async () => {
    const skript = parseSkript('CE10-Test.md', SKRIPT, { herkunft: 'datei', jetzt: `${HEUTE}T08:00:00Z` });
    expect(skript.gruppe).toBe('CE 10');
    // Quellenverzeichnis wird kein Lernstoff
    expect(kartenAusAbschnitt(skript, skript.abschnitte[3]!)).toEqual([]);
    const karten = skript.abschnitte.flatMap((a) => kartenAusAbschnitt(skript, a));
    expect(karten.length).toBeGreaterThanOrEqual(3);
    expect(karten.every((k) => k.belege?.length)).toBe(true);

    // Ohne Karten: Quelle da, Zuordnung da, aber für das neue Thema noch keine Abfrage möglich
    let m = ceMatrix(modul, ce10, { skripte: [skript], karten: [] }, liste);
    let z = m.themen.find((x) => x.topicId === NEU)!;
    expect(z.herkunft).toEqual(['katalog', 'skript']);
    expect(z.material).toBe('belegt');
    expect(z.quellen[0]).toMatchObject({ abschnitte: 3, belegt: 3, luecken: 0 });
    expect(z.freigabe).toBe('offen');
    expect(z.fehlt.join(' ')).toMatch(/Karteikarten/);

    // Karten übernommen: Selbsttest möglich, Weg geschlossen
    await db.karten.bulkPut(karten.map((k) => ({ ...k, erstellt: HEUTE, geaendert: HEUTE })));
    expect(testbareThemen(karten, [NEU]).has(NEU)).toBe(true);
    m = ceMatrix(modul, ce10, { skripte: [skript], karten }, liste);
    z = m.themen.find((x) => x.topicId === NEU)!;
    expect(z.selbsttest).toBe(true);
    expect(z.kartenAusSkript).toBe(karten.length);
    expect(istWegVollstaendig(z)).toBe(true);
    expect(z.fehlt).toEqual([]);

    // Lernplan mit CE-10-Prüfung plant das Thema ein
    await saveConfig({ availability: { minutesByWeekday: [60, 60, 60, 60, 60, 60, 60], exceptions: {} } });
    await saveExam({ id: 'ce-pruefung:ce.10', name: 'CE 10', date: '2026-12-04', subjectIds: [], topicIds: [NEU] }, 1);
    const vorher = buildPlan(assembleInput(await loadPlannerData(modul.topics, HEUTE)));
    expect(vorher.days.some((d) => d.blocks.some((b) => b.topicId === NEU))).toBe(true);

    // Abfrage aus dem Selbsttest: zählt einmal, nächste Fälligkeit liegt in der Zukunft
    const r = await bucheErgebnis({ versuchId: 'selbsttest:ce.10:1', herkunft: { modul: 'selbsttest', ref: 'ce.10' }, status: 'abgeschlossen', aussagekraft: 'abruf', ergebnisse: [{ topicId: NEU, scorePercent: 80, anzahl: 3 }], date: HEUTE }, modul.topics);
    expect(r.map((x) => [x.status, x.zaehlt])).toEqual([['gespeichert', true]]);
    const data = await loadPlannerData(modul.topics, HEUTE);
    const nachher = buildPlan(assembleInput(data));
    const p = nachher.progress[NEU]!;
    expect(p.testCount).toBe(1);
    expect(p.status).not.toBe('offen');
    expect(p.nextReview! > HEUTE).toBe(true);
    m = ceMatrix(modul, ce10, { skripte: [skript], karten, reviewLogs: data.reviewLogs }, liste);
    expect(m.themen.find((x) => x.topicId === NEU)!.abfragen).toBe(1);
    expect(m.summe.abgefragt).toBe(1);
  });

  it('Freigabe aus dem Skriptkopf und Matrix je Ausbildungsabschnitt', () => {
    const skript = parseSkript('CE10-Test.md', SKRIPT.replace('---\nthemen', '---\nfreigabe: 2026-11-20, Praxisanleitung\nthemen'), { herkunft: 'datei' });
    expect(skript.freigabe).toEqual({ am: '2026-11-20', von: 'Praxisanleitung' });
    const m = ceMatrix(modul, ce10, { skripte: [skript], karten: [] }, liste);
    expect(m.themen.find((x) => x.topicId === NEU)!.freigabe).toBe('freigegeben');
    expect(m.summe).toMatchObject({ skripte: 1, skripteFreigegeben: 1 });
    const gruppen = nachAbschnitt(alleCeMatrix(modul, { skripte: [skript], karten: [] }));
    expect(gruppen.map((g) => g.abschnitt)).toEqual(['ad12', 'ad3']);
    expect(gruppen[0]!.ces.map((c) => c.ce.code)).toContain('CE 01');
    expect(gruppen[1]!.ces.map((c) => c.ce.code)).not.toContain('CE 01');
    expect(gruppen[1]!.ces.map((c) => c.ce.code)).toContain('CE 10');
  });

  it('Thema ohne Skript wird als „keine Quelle“ ausgewiesen', () => {
    const m = ceMatrix(modul, ce10, { skripte: [], karten: [] }, liste);
    const kl = m.themen.find((x) => x.topicId === 'thema.kl.paediatrie')!;
    expect(kl.material).toBe('keine');
    expect(kl.fehlt[0]).toMatch(/Keine Quelle/);
    expect(kl.abfragbar).toBe(true); // Trainer und Fälle gibt es trotzdem
  });

  const materialRepo = process.env.MATERIAL_REPO ?? path.resolve(__dirname, '../../../../lernstoff-material-');
  const echt = path.join(materialRepo, 'skripte', 'CE10-Neugeborenes.md');
  it.skipIf(!fs.existsSync(echt))('echtes CE-10-Skript aus dem Material-Repo: belegt, zugeordnet, Karten möglich', () => {
    const s = parseSkript('CE10-Neugeborenes.md', fs.readFileSync(echt, 'utf8'), { herkunft: 'repo' });
    expect(s.gruppe).toBe('CE 10');
    const m = ceMatrix(modul, ce10, { skripte: [s], karten: s.abschnitte.flatMap((a) => kartenAusAbschnitt(s, a)) }, liste);
    const mitSkript = m.themen.filter((t) => t.quellen.length);
    expect(mitSkript.length).toBeGreaterThan(0);
    for (const t of mitSkript) {
      expect(t.material).toBe('belegt');
      expect(istWegVollstaendig(t)).toBe(true);
    }
  });
});
