import { describe, expect, it } from 'vitest';
import type { Document, SourceChunk } from '../../core/types';
import { baueAuftrag, uebernehmeAntwort } from './ohneSchluessel';
import { parseSkript } from './parser';
import { pruefeSkript } from './pruefung';
import { weitergabe } from './weitergabe';

// Erfundenes Beispielmaterial (keine Originalinhalte).
const doc: Document = { id: 'doc-9', title: 'Sturzprophylaxe Unterricht', kind: 'pdf', subjectIds: [], topicIds: ['thema.kl.demenz'], version: 1, contentHash: 'x', importedAt: '2026-11-13T10:00:00Z' };
const chunks: SourceChunk[] = [
  { id: 'a', documentId: 'doc-9', page: 1, printedPage: '5', text: 'Stürze entstehen oft beim Aufstehen.' },
  { id: 'b', documentId: 'doc-9', page: 1, printedPage: '5', text: 'Sprechernotiz', origin: 'notes' },
  { id: 'c', documentId: 'doc-9', page: 2, printedPage: '6', text: 'Hüftprotektoren schützen bei einem Sturz.' },
];

describe('Zusammenfassen ohne API-Schlüssel', () => {
  it('baut den Auftrag mit Regeln, Format und Seitenmarken, ohne Sprechernotizen', () => {
    const a = baueAuftrag(doc, chunks);
    expect(a.text).toContain('[D, S. 12]');
    expect(a.text).toContain('- **[D]** Sturzprophylaxe Unterricht');
    expect(a.text).toContain('⟨S. 5⟩\nStürze entstehen');
    expect(a.text).toContain('⟨S. 6⟩\nHüftprotektoren');
    expect(a.text).not.toContain('Sprechernotiz');
    expect(a).toMatchObject({ seiten: 2, gekuerzt: false });
  });

  it('kürzt zu langes Material und nennt die letzte Seite', () => {
    const lang = baueAuftrag(doc, chunks, baueAuftrag(doc, []).text.length + 60);
    expect(lang).toMatchObject({ gekuerzt: true, bisSeite: '5', seiten: 1 });
  });

  it('übernimmt die Antwort als Skript mit Kopf, Quellenverzeichnis und Seitenprüfung', () => {
    const antwort = 'Gern, hier ist die Zusammenfassung:\n\n```markdown\n# Stürze vermeiden\n\n## 1 · Ursachen\n\n- Aufstehen ist riskant [D, S. 5]\n- Brille fehlt [D, S. 40]\n\n## 2 · Schutz\n\n- **Hüftprotektor**: schützt die Hüfte beim Sturz [D, S. 6]\n```\n\nViel Erfolg!';
    const r = uebernehmeAntwort(doc, chunks, antwort);
    expect(r.name).toBe('ki-sturzprophylaxe-unterricht.md');
    expect(r.hinweise.join(' ')).toMatch(/nicht gibt: 40\./);
    const s = parseSkript(r.name, r.text, { herkunft: 'datei' });
    expect(s).toMatchObject({ gruppe: 'Eigene Unterlagen', titel: 'Stürze vermeiden', dokumentId: 'doc-9', topicIds: ['thema.kl.demenz'] });
    expect(s.quellen.map((q) => q.kuerzel)).toEqual(['D']);
    expect(pruefeSkript(s)).toMatchObject({ ohneSeite: 0, ohneQuelle: [], ohneBeleg: 0 });
    expect(weitergabe(s).darf).toBe(true);
  });

  it('hält Zusammenfassungen aus Fachbüchern privat und meldet unbrauchbare Antworten', () => {
    const buch = { ...doc, quelle: { art: 'fachbuch' as const } };
    const s = parseSkript('x.md', uebernehmeAntwort(buch, chunks, '# T\n\n## 1 · A\n\n- x [D, S. 5]').text, { herkunft: 'datei' });
    expect(weitergabe(s).darf).toBe(false);
    expect(() => uebernehmeAntwort(doc, chunks, 'Ich kann das nicht.')).toThrow(/Überschrift/);
    expect(() => uebernehmeAntwort(doc, chunks, '# Nur Titel\n\nText')).toThrow(/Abschnitte/);
    expect(uebernehmeAntwort(doc, chunks, '# T\n\n## 1 · A\n\n- ohne Beleg').hinweise.join(' ')).toMatch(/keine Belege/);
  });
});
