import { describe, expect, it } from 'vitest';
import { abstand, ausschnitt, baueIndex, falte, markierungen, stamm, suche, vorschlaege, zerlege, type SuchDok } from './suchkern';

const DOKS: SuchDok[] = [
  { id: 'std', art: 'standard', titel: 'Expertenstandard Dekubitusprophylaxe in der Pflege', text: 'Ziel ist, einen Dekubitus zu verhindern.', standardIds: ['es.dekubitus'] },
  { id: 'k1s', art: 'kriterium', titel: 'S1 · Risikoeinschätzung', text: 'Die Pflegefachkraft verfügt über Wissen zur Einschätzung des Dekubitusrisikos.', standardIds: ['es.dekubitus'], ebene: 'S', kriterium: 1, pfad: 'Dekubitusprophylaxe · Struktur' },
  { id: 'k1p', art: 'kriterium', titel: 'P1 · Risikoeinschätzung', text: 'Die Pflegefachkraft schätzt das Risiko zu Beginn und bei Veränderungen ein.', standardIds: ['es.dekubitus'], ebene: 'P', kriterium: 1, pfad: 'Dekubitusprophylaxe · Prozess' },
  { id: 'k3p', art: 'kriterium', titel: 'P3 · Bewegungsförderung', text: 'Die Pflegefachkraft fördert Bewegung und plant Positionswechsel.', standardIds: ['es.dekubitus'], ebene: 'P', kriterium: 3 },
  { id: 'sturz', art: 'kriterium', titel: 'P3 · Maßnahmen', text: 'Stürze werden mit Angehörigen besprochen. Die Schmerzen werden beachtet.', standardIds: ['es.sturz'], ebene: 'P', kriterium: 3 },
  { id: 'schmerz', art: 'kernaussage', titel: 'Schmerz bei Demenz', text: 'Bei Demenz die Schmerzen mit der BESD einschätzen.', standardIds: ['es.schmerz'] },
  { id: 'iad', art: 'begriff', titel: 'Inkontinenzassoziierte Dermatitis', text: 'Hautschaden durch Urin oder Stuhl.', standardIds: ['es.hautintegritaet'] },
  { id: 'konsens', art: 'uebung', titel: 'Entstehung', text: 'Nach dem Entwurf folgt die Konsensus-Konferenz in der Fachöffentlichkeit.', standardIds: [] },
];
const INDEX = baueIndex(DOKS, [['Dekubitus', 'Druckgeschwür'], ['IAD', 'inkontinenzassoziierte Dermatitis']]);
const ids = (q: string, f = {}) => suche(INDEX, q, f).treffer.map((t) => t.dok.id);

describe('Normalisieren', () => {
  it('behandelt Umlaute, ß und Endungen gleich', () => {
    expect(falte('Stürze')).toBe('sturze');
    expect(ids('stuerze')).toEqual(['sturz']);
    expect(falte('Fußpflege')).toBe('fusspflege');
    expect(stamm(falte('Schmerzen'))).toBe(stamm(falte('Schmerz')));
  });
  it('misst Tippfehler mit Vertauschung als einen Fehler', () => {
    expect(abstand('dekubitus', 'dekubitsu', 2)).toBe(1);
    expect(abstand('sturz', 'stutz', 1)).toBe(1);
    expect(abstand('abc', 'xyzxyz', 1)).toBe(2);
  });
});

describe('Anfrage zerlegen', () => {
  it('erkennt Phrasen, Ausschluss, Ebene und Kriterium', () => {
    const a = zerlege('„Konsensus Konferenz“ Sturz -Demenz P3 art:uebung');
    expect(a.phrasen).toEqual(['Konsensus Konferenz']);
    expect(a.begriffe).toEqual(['Sturz']);
    expect(a.ohne).toEqual(['Demenz']);
    expect(a).toMatchObject({ ebene: 'P', kriterium: 3, art: 'uebung' });
    expect(zerlege('k2 ebene:ergebnis')).toMatchObject({ kriterium: 2, ebene: 'E' });
  });
});

describe('Suchen', () => {
  it('findet trotz Tippfehler und schlägt die Korrektur vor', () => {
    const e = suche(INDEX, 'dekubitis');
    expect(e.treffer[0]?.dok.id).toBe('std');
    expect(e.korrekturen[0]?.zu.toLowerCase()).toContain('dekubitus');
  });
  it('findet Wortteile in zusammengesetzten Wörtern', () => {
    expect(ids('prophylaxe')).toContain('std');
    expect(ids('einschätzung')).toEqual(expect.arrayContaining(['k1s', 'k1p']));
  });
  it('nutzt Synonyme und Abkürzungen', () => {
    expect(ids('Druckgeschwür')).toContain('std');
    expect(ids('IAD')).toEqual(['iad']);
    expect(suche(INDEX, 'Druckgeschwür').treffer[0]?.guete).toBe('synonym');
  });
  it('verlangt alle Begriffe und fällt sonst auf Teiltreffer zurück', () => {
    expect(ids('Schmerzen Demenz')).toEqual(['schmerz']);
    const e = suche(INDEX, 'Demenz Bewegung');
    expect(e.teilweise).toBe(true);
    expect(e.treffer.length).toBeGreaterThan(1);
  });
  it('sucht Phrasen genau und schließt Wörter aus', () => {
    expect(ids('"Konsensus-Konferenz"')).toEqual(['konsens']);
    expect(ids('Schmerzen -Demenz')).toEqual(['sturz']);
  });
  it('springt mit P3 und Standardfilter zum Kriterium', () => {
    expect(ids('P3')).toEqual(expect.arrayContaining(['k3p', 'sturz']));
    expect(ids('P3', { standardIds: ['es.dekubitus'] })).toEqual(['k3p']);
    expect(ids('dekubitus k1').sort()).toEqual(['k1p', 'k1s']);
  });
  it('zählt Facetten ohne den eigenen Filter', () => {
    const e = suche(INDEX, 'Pflegefachkraft', { ebene: 'S' });
    expect(e.treffer.map((t) => t.dok.id)).toEqual(['k1s']);
    expect(e.facetten.ebene.get('P')).toBe(2);
    expect(e.facetten.standard.get('es.dekubitus')).toBe(1);
  });
  it('liefert ohne Eingabe und Filter nichts', () => {
    expect(suche(INDEX, '   ').treffer).toEqual([]);
  });
});

describe('Anzeige', () => {
  it('schlägt Wörter zum Wortanfang vor', () => {
    expect(vorschlaege(INDEX, 'risi')).toContain('risikoeinschätzung');
  });
  it('markiert ganze Wörter und kürzt lange Texte um die Treffer', () => {
    expect(markierungen('Die Schmerzen, Schmerz!', ['schmerzen'])).toEqual([[4, 13]]);
    const lang = `${'Füllsatz ohne Bezug. '.repeat(20)}Hier steht Dekubitus im Satz. ${'Noch ein Satz. '.repeat(10)}`;
    expect(ausschnitt(lang, ['dekubitus'])).toContain('Dekubitus');
    expect(ausschnitt(lang, ['dekubitus']).length).toBeLessThan(260);
  });
});
