import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cspAusHeaders } from '../../vite.config';

describe('CSP für index.html (Audit D-1)', () => {
  const csp = cspAusHeaders(fs.readFileSync('public/_headers', 'utf8'));
  it('übernimmt die Regeln aus public/_headers', () => {
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'wasm-unsafe-eval'");
    expect(csp).toContain('https://api.anthropic.com');
    expect(csp).toContain("object-src 'none'");
  });
  it('lässt weg, was im <meta> nicht erlaubt oder lokal hinderlich ist', () => {
    expect(csp).not.toMatch(/frame-ancestors|upgrade-insecure-requests/);
  });
});
