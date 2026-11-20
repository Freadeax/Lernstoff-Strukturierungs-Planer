import { describe, expect, it } from 'vitest';
import { beobachteGeraetespeicher, istOhneDatenbank, istSpeicherVoll, meldeSpeicherVoll } from './speicherwaechter';
import { notifications } from './notifications';

const fehler = (name: string, message = '', inner?: unknown) => Object.assign(new Error(message), { name, inner });

describe('Speicherwächter', () => {
  it('erkennt vollen Speicher direkt und in Dexie verpackt', () => {
    expect(istSpeicherVoll(new DOMException('x', 'QuotaExceededError'))).toBe(true);
    expect(istSpeicherVoll(fehler('AbortError', 'Transaction aborted', fehler('QuotaExceededError')))).toBe(true);
    expect(istSpeicherVoll(fehler('UnknownError', 'The quota has been exceeded.'))).toBe(true);
    expect(istSpeicherVoll(fehler('ConstraintError', 'Key already exists'))).toBe(false);
    expect(istSpeicherVoll(undefined)).toBe(false);
  });
  it('unterscheidet fehlende Datenbank von einem Versionskonflikt', () => {
    expect(istOhneDatenbank(fehler('MissingAPIError', 'IndexedDB API missing'))).toBe(true);
    expect(istOhneDatenbank(fehler('OpenFailedError', 'InvalidStateError A mutation operation was attempted', fehler('InvalidStateError')))).toBe(true);
    expect(istOhneDatenbank(fehler('OpenFailedError', 'VersionError', fehler('VersionError')))).toBe(false);
  });
  it('meldet vollen Speicher höchstens einmal pro Minute', () => {
    const vorher = notifications.get();
    expect(meldeSpeicherVoll(1_000_000)).toBe(true);
    expect(meldeSpeicherVoll(1_030_000)).toBe(false);
    expect(meldeSpeicherVoll(1_070_000)).toBe(true);
    expect(notifications.get().current?.severity).toBe('critical');
    notifications.set(vorher);
  });
  it('meldet vollen Gerätespeicher auch bei abgefangenen localStorage-Fehlern (Audit R-3)', () => {
    const vorher = notifications.get();
    notifications.set({ ...vorher, current: null });
    const proto = { setItem(_k: string, v: string) { if (v.length > 3) throw new DOMException('voll', 'QuotaExceededError'); } };
    const weg = beobachteGeraetespeicher(proto);
    expect(() => proto.setItem('k', 'ok')).not.toThrow();
    expect(() => proto.setItem('k', 'zu lang')).toThrow();
    expect(notifications.get().current?.severity).toBe('critical');
    weg();
    expect(() => proto.setItem('k', 'zu lang')).toThrow();
    notifications.set(vorher);
  });
});
