import { describe, expect, it } from 'vitest';
import { parseSkript } from './parser';
import { alsMarkdown, verlagErwaehnt, weitergabe } from './weitergabe';

// Erfundene Beispiele (keine Originalinhalte).
const EIGEN = `---
themen: [thema.kl.demenz]
gruppe: CE 09
---
# Demenz begleiten

Meine Mitschrift.

- **[M]** Mitschrift Unterricht 3. November

## 1 · Kommunikation [M, S. 1]

- Kurze Sätze ![Bild](bilder/x.jpg)
- **Validation**: Gefühle ernst nehmen [M, S. 2]
`;
const lies = (text: string, herkunft: 'datei' | 'repo' | 'dokument' = 'datei') => parseSkript('ce09-demenz.md', text, { herkunft });

describe('Weitergabe von Skripten', () => {
  it('sperrt Repo-Skripte, wörtliche Dokumente, Verlagsinhalte und „weitergabe: nein“', () => {
    expect(weitergabe(lies(EIGEN, 'repo')).darf).toBe(false);
    expect(weitergabe(lies(EIGEN, 'dokument')).darf).toBe(false);
    const buch = lies(EIGEN.replace('Mitschrift Unterricht 3. November', 'Pflege Heute, 8. Aufl., Elsevier'));
    expect(verlagErwaehnt(buch)).toMatch(/Pflege Heute/i);
    const st = weitergabe(buch);
    expect(st.darf).toBe(false);
    expect(!st.darf && st.grund).toMatch(/Fachbüchern/);
    expect(weitergabe(lies(EIGEN.replace('gruppe: CE 09', 'gruppe: CE 09\nweitergabe: erlaubt').replace('Mitschrift Unterricht', 'Thieme I care'))).darf).toBe(false);
    expect(weitergabe(lies(EIGEN.replace('gruppe: CE 09', 'gruppe: CE 09\nweitergabe: nein'))).darf).toBe(false);
  });

  it('erlaubt eigene Dateien nach Bestätigung, mit „weitergabe: erlaubt“ ohne', () => {
    expect(weitergabe(lies(EIGEN))).toEqual({ darf: true, bestaetigt: false });
    expect(weitergabe(lies(EIGEN.replace('gruppe: CE 09', 'gruppe: CE 09\nweitergabe: erlaubt')))).toEqual({ darf: true, bestaetigt: true });
  });

  it('schreibt das Skript verlustfrei zurück, ohne Abbildungen und mit Weitergabe-Vermerk', () => {
    const s = lies(EIGEN);
    const md = alsMarkdown(s);
    expect(md).not.toContain('bilder/x.jpg');
    const zurueck = parseSkript(`${s.id}.md`, md, { herkunft: 'datei' });
    expect(zurueck.id).toBe(s.id);
    expect(zurueck.gruppe).toBe('CE 09');
    expect(zurueck.titel).toBe('Demenz begleiten');
    expect(zurueck.topicIds).toEqual(['thema.kl.demenz']);
    expect(zurueck.weitergabe).toBe('erlaubt');
    expect(zurueck.quellen).toEqual(s.quellen);
    expect(zurueck.abschnitte.map((a) => [a.nummer, a.titel, a.belege])).toEqual(s.abschnitte.map((a) => [a.nummer, a.titel, a.belege]));
  });
});
