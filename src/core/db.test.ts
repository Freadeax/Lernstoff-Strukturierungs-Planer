import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { LernstoffDB, deleteAll, exportAll } from './db';

describe('lokale Datenbank', () => {
  it('speichert, exportiert und löscht Daten', async () => {
    const db = new LernstoffDB('test-db');
    await db.subjects.add({ id: 's1', name: 'Recht' });
    const dump = await exportAll(db);
    expect(dump.data.subjects).toHaveLength(1);
    await deleteAll(db);
    expect(await db.subjects.count()).toBe(0);
  });
});
