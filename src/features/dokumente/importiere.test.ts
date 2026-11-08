import 'fake-indexeddb/auto';
import JSZip from 'jszip';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db, deleteAll } from '../../core/db';
import { modules } from '../../modules/registry';
import { importiereDateien } from './importiere';
import { ladeHoch, ladeZiel, listeDateien, pruefeRepo } from '../ablage/ablage';

vi.mock('../ablage/ablage', async (original) => ({ ...await original<typeof import('../ablage/ablage')>(), ladeZiel: vi.fn(), ladeHoch: vi.fn(), listeDateien: vi.fn(), pruefeRepo: vi.fn() }));
const subjectId = modules[0]!.subjects[0]!.id;
const opts = { subjectId, handwritten: false, archive: true };
beforeEach(async () => {
  await deleteAll(); vi.clearAllMocks();
  vi.mocked(ladeZiel).mockReturnValue({ owner: 'test', repo: 'material', token: 'test-token' });
  vi.mocked(pruefeRepo).mockResolvedValue({ privat: true, branch: 'main', schreiben: true, leer: false, eingerichtet: true, vollerName: 'test/material' });
  vi.mocked(listeDateien).mockResolvedValue([]);
  vi.mocked(ladeHoch).mockResolvedValue({ ordner: 'skript', manifest: {} as never, uebersprungen: false });
});
describe('gemeinsamer Import für Browser und Repo', () => {
  it('sichert das Original und importiert dieselbe Datei erneut ohne doppelte Dokumente', async () => {
    const f = new File(['Ein neuer Lerninhalt zum Lernen.'], 'Skript.txt');
    const [a] = await importiereDateien([f], opts);
    const [b] = await importiereDateien([f], opts);
    expect(a!.error).toBeUndefined();
    expect(a!.archive).toContain('gespeichert');
    expect(a!.documentId).toBe(b!.documentId);
    expect(await db.documents.count()).toBe(1);
    expect((await db.documents.get(a!.documentId!))!.repository).toEqual({ owner: 'test', repo: 'material', ordner: 'skript' });
  });
  it('behält lokale Dokumente bei fehlgeschlagener Repo-Sicherung', async () => {
    vi.mocked(ladeHoch).mockRejectedValue(new Error('Offline'));
    const [r] = await importiereDateien([new File(['Textinhalt'], 'Skript.txt')], opts);
    expect(r!.documentId).toBeTruthy();
    expect(r!.archiveError).toContain('Offline');
    expect(await db.documents.count()).toBe(1);
  });
  it('speichert keine Originale in öffentlichen Repos', async () => {
    vi.mocked(pruefeRepo).mockResolvedValue({ privat: false } as never);
    const [r] = await importiereDateien([new File(['Textinhalt'], 'Skript.txt')], opts);
    expect(r!.archiveError).toContain('privat');
    expect(ladeHoch).not.toHaveBeenCalled();
    expect(r!.documentId).toBeTruthy();
  });
  it('liest ZIP-Inhalte einzeln und verknüpft sie mit dem einmal gesicherten Original', async () => {
    const zip = new JSZip().file('Ordner/A.txt', 'Inhalt eins').file('B.txt', 'Inhalt zwei').file('unbekannt.bin', 'x');
    const file = new File([await zip.generateAsync({ type: 'uint8array' }) as BlobPart], 'Sammlung.zip');
    const r = await importiereDateien([file], opts);
    expect(r).toHaveLength(3);
    expect(r.slice(0, 2).every((e) => e.documentId && !e.error)).toBe(true);
    expect(r[2]).toMatchObject({ name: 'Sammlung.zip', archive: expect.stringContaining('gespeichert') });
    expect(ladeHoch).toHaveBeenCalledTimes(1);
    expect((await db.documents.toArray()).every((d) => d.repository?.ordner === 'skript')).toBe(true);
  });
  it('lädt ohne ausdrückliche Auswahl nichts hoch, auch mit verbundenem Repo', async () => {
    const [r] = await importiereDateien([new File(['Textinhalt'], 'Skript.txt')], { subjectId, handwritten: false });
    expect(r!.documentId).toBeTruthy();
    expect(r!.archive).toBeUndefined();
    expect(pruefeRepo).not.toHaveBeenCalled();
    expect(ladeHoch).not.toHaveBeenCalled();
  });
  it('lädt erst nach erfolgreichem lokalem Einlesen hoch', async () => {
    const reihenfolge: string[] = [];
    vi.mocked(ladeHoch).mockImplementation(async () => { reihenfolge.push(`upload:${await db.documents.count()}`); return { ordner: 'skript', manifest: {} as never, uebersprungen: false }; });
    await importiereDateien([new File(['Ein Lerninhalt zum Hochladen.'], 'Skript.txt')], opts);
    expect(reihenfolge).toEqual(['upload:1']);
  });
  it('lädt nichts hoch, wenn das Einlesen scheitert', async () => {
    const r = await importiereDateien([new File(['x'], 'Kaputt.zip')], opts);
    expect(r[0]!.error).toBeTruthy();
    expect(r[0]!.archive).toContain('nicht hochgeladen');
    expect(ladeHoch).not.toHaveBeenCalled();
  });
  it('liest Dateien aus der Ablage ohne erneutes Hochladen', async () => {
    const [r] = await importiereDateien([new File(['Textinhalt'], 'Skript.txt')], { ...opts, repository: { owner: 'test', repo: 'material', ordner: 'vorhanden' } });
    expect(r!.documentId).toBeTruthy();
    expect(ladeHoch).not.toHaveBeenCalled();
  });
});
