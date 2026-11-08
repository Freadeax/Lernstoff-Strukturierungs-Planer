import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiKeyDauerhaft, getApiKey, setApiKey } from './settings';
import { ladeZiel, speichereZiel, tokenDauerhaft } from '../features/ablage/ablage';

function speicher(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; }, clear: () => m.clear(), key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, String(v)); }, removeItem: (k: string) => { m.delete(k); },
  };
}
beforeEach(() => { vi.stubGlobal('localStorage', speicher()); vi.stubGlobal('sessionStorage', speicher()); });

describe('Zugangsdaten', () => {
  it('hält den API-Schlüssel standardmäßig nur für die Sitzung', () => {
    setApiKey('sk-ant-test');
    expect(getApiKey()).toBe('sk-ant-test');
    expect(localStorage.getItem('lernstoff.apiKey')).toBeNull();
    expect(apiKeyDauerhaft()).toBe(false);
  });
  it('merkt den Schlüssel nur auf ausdrücklichen Wunsch und entfernt ihn überall', () => {
    setApiKey('sk-ant-test', true);
    expect(apiKeyDauerhaft()).toBe(true);
    expect(sessionStorage.getItem('lernstoff.apiKey')).toBeNull();
    setApiKey('sk-ant-neu');
    expect(apiKeyDauerhaft()).toBe(false);
    expect(getApiKey()).toBe('sk-ant-neu');
    setApiKey('');
    expect(getApiKey()).toBe('');
  });
  it('legt den GitHub-Token standardmäßig nicht dauerhaft ab', () => {
    speichereZiel({ owner: 'p', repo: 'material', token: 'github_pat_x' });
    expect(JSON.parse(localStorage.getItem('lernstoff.ablage')!)).toEqual({ owner: 'p', repo: 'material' });
    expect(ladeZiel()).toEqual({ owner: 'p', repo: 'material', token: 'github_pat_x' });
    expect(tokenDauerhaft()).toBe(false);
    speichereZiel({ owner: 'p', repo: 'material', token: 'github_pat_x' }, true);
    expect(tokenDauerhaft()).toBe(true);
    expect(sessionStorage.getItem('lernstoff.ablage.token')).toBeNull();
    speichereZiel(null);
    expect(ladeZiel().token).toBe('');
  });
});
