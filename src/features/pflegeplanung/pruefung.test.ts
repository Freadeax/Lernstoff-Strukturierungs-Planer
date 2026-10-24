import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import { eigenerFall, FAELLE } from './faelle';
import { leererPlan, neueMassnahme, neuesProblem, neuesZiel, ohneProblem, planAlsText, type Plan } from './plan';
import { pruefe, SCHRITT_THEMA } from './pruefung';
import { kiRegeln, leseRueckmeldung } from './claude';
import { lernplanEintraege } from './lernplan';

const fall = (id: string) => FAELLE.find((f) => f.id === id)!;
const regeln = (e: ReturnType<typeof pruefe>) => e.befunde.map((b) => b.regelId);

/** Gute Planung für Herrn Weber (zwei Probleme, je ein Ziel und eine Maßnahme, evaluiert). */
function guterPlan(): Plan {
  const p1 = { ...neuesProblem('aktuell'), p: 'Akute Schmerzen bei Bewegung im rechten Hüftgelenk', e: 'beeinflusst durch OP-Wunde nach Hüft-TEP', s: 'angezeigt durch NRS 6 bei Bewegung', r: 'kann Schmerzen einschätzen, motiviert, Ehefrau besucht täglich' };
  const p2 = { ...neuesProblem('risiko'), p: 'Sturzgefahr', e: 'beeinflusst durch Schmerzen und Angst vor Bewegung', s: '', r: 'orientiert, will in den Garten' };
  const p3 = { ...neuesProblem('risiko'), p: 'Gefahr eines Dekubitus', e: 'aufgrund Immobilität, Braden 14', s: '', r: 'kann sich mit Hilfe drehen' };
  const p4 = { ...neuesProblem('risiko'), p: 'Thrombosegefahr', e: 'aufgrund eingeschränkter Mobilität nach OP', s: '', r: 'kann Füße bewegen' };
  const p5 = { ...neuesProblem('aktuell'), p: 'Beeinträchtigte Mobilität', e: 'beeinflusst durch Schmerzen nach Hüft-TEP', s: 'angezeigt durch Liegen auf dem Rücken, Angst', r: 'Vollbelastung erlaubt, motiviert' };
  const probleme = [p1, p2, p3, p4, p5];
  const ziele = probleme.map((p) => ({ ...neuesZiel(p.id), text: `Herr Weber kann ohne Komplikation gehen (${p.p})`, termin: 'in 3 Tagen' }));
  ziele[0]!.text = 'Herr Weber gibt bei Mobilisation höchstens NRS 3 an';
  const texte = [
    ['Bedarfsmedikation nach AVO 30 Minuten vor der Mobilisation', 'Schmerz mit NRS vorher und nachher erfassen'],
    ['Klingel und Rollator in Reichweite, Bett tief', 'festes Schuhwerk anziehen'],
    ['Positionswechsel und Hautinspektion', 'Fingertest am Sakrum'],
    ['Fußwippe und Venenpumpe üben', 'Kompressionsstrümpfe nach AVO'],
    ['Mobilisation mit Rollator', 'Gehstrecke täglich steigern'],
  ];
  const massnahmen = ziele.map((z, i) => ({ ...neueMassnahme(z.id), was: texte[i]![0]!, wie: texte[i]![1]!, wann: '3 × täglich', wer: 'Pflegefachperson', begruendung: 'Expertenstandard' }));
  return {
    subjektiv: '„Ich hab Angst, dass das Gelenk rausspringt.“ Möchte zurück in den Garten.',
    objektiv: 'NRS 6 bei Bewegung, 2 in Ruhe. Braden 14, Rötung am Sakrum. Kein Stuhlgang seit 3 Tagen. Trinkt etwa 800 ml.',
    probleme, ziele, massnahmen, bericht: '',
    evaluation: Object.fromEntries(ziele.map((z) => [z.id, { erreicht: 'ja' as const, begruendung: 'Laut Verlauf NRS 3', anpassung: '' }])),
  };
}

describe('Fallvorlagen', () => {
  it('verweisen nur auf vorhandene Themen', () => {
    const ids = new Set(pflegeModule.topics.map((t) => t.id));
    for (const f of FAELLE) for (const id of f.topicIds) expect(ids.has(id), `${f.id}: ${id}`).toBe(true);
    for (const id of Object.values(SCHRITT_THEMA)) expect(ids.has(id!)).toBe(true);
    expect(ids.has('thema.pp.prozess')).toBe(true);
  });
  it('haben eindeutige IDs und Pflichtprobleme mit Maßnahmen-Stichworten', () => {
    expect(new Set(FAELLE.map((f) => f.id)).size).toBe(FAELLE.length);
    for (const f of FAELLE) {
      expect(f.probleme.some((p) => p.pflicht && p.art === 'risiko'), f.id).toBe(true);
      expect(f.probleme.every((p) => p.massnahmen.muster.length > 0), f.id).toBe(true);
      expect(f.verlauf.length, f.id).toBeGreaterThan(50);
    }
  });
});

describe('pruefe', () => {
  it('leerer Plan: 0 % und alle Pflichtschritte fehlen', () => {
    const e = pruefe(fall('huefte'), leererPlan());
    expect(e.prozent).toBe(0);
    const fehlend = e.schritte.filter((s) => s.befunde.some((b) => b.regelId === 'regel.pflegeplanung.durchgaengig')).map((s) => s.schritt);
    expect(fehlend).toEqual(['info', 'probleme', 'ziele', 'massnahmen', 'evaluation']);
    expect(e.schritte.find((s) => s.schritt === 'durchfuehrung')!.bewertet).toBe(false);
  });

  it('gute Planung: hohe Wertung, Probleme und Maßnahmen erkannt', () => {
    const e = pruefe(fall('huefte'), guterPlan());
    expect(e.prozent).toBeGreaterThanOrEqual(85);
    const erkannt = e.fallbezug!.probleme.filter((t) => t.gefunden).map((t) => t.erwartung.id);
    expect(erkannt).toEqual(expect.arrayContaining(['schmerz', 'sturz', 'dekubitus', 'thrombose', 'mobilitaet']));
    expect(e.fallbezug!.probleme.filter((t) => t.gefunden).every((t) => t.massnahme && t.artPasst)).toBe(true);
    expect(e.befunde.filter((b) => b.schwere === 'fehler')).toEqual([]);
  });

  it('PESR: fehlendes S bei aktuellem Problem, S bei Risiko, medizinische Diagnose', () => {
    const plan = leererPlan();
    plan.probleme = [
      { ...neuesProblem('aktuell'), p: 'Diabetes mellitus', e: 'Insulinmangel', s: '', r: '' },
      { ...neuesProblem('risiko'), p: 'Sturz', e: 'beeinflusst durch Schwindel', s: 'schwankt beim Gehen', r: 'Rollator' },
    ];
    const r = regeln(pruefe(fall('diabetes-insulin'), plan));
    expect(r).toContain('regel.pesr.vollstaendig');
    expect(r).toContain('regel.pesr.keine-med-diagnose');
    expect(r).toContain('regel.pesr.risiko-ohne-s');
    expect(r).toContain('pp.pesr.e-formulierung'); // „Insulinmangel“ ohne „beeinflusst durch“
    expect(r).toContain('pp.pesr.risiko-titel');   // „Sturz“ statt „Sturzgefahr“
  });

  it('erkennt „Gefahr“ in einem als aktuell markierten Problem', () => {
    const plan = leererPlan();
    plan.probleme = [{ ...neuesProblem('aktuell'), p: 'Gefahr einer Aspiration', e: 'aufgrund Schluckstörung', s: 'hustet', r: 'wach' }];
    const e = pruefe(fall('schlaganfall'), plan);
    expect(regeln(e)).toContain('pp.pesr.risiko-titel');
    expect(e.befunde.some((b) => b.regelId === 'pp.fall.art')).toBe(true);
  });

  it('SMART: fehlender Termin und Pflegehandlung statt Ziel', () => {
    const plan = leererPlan();
    plan.probleme = [{ ...neuesProblem('aktuell'), p: 'Akute Schmerzen', e: 'durch OP', s: 'NRS 6', r: 'kann sich äußern' }];
    plan.ziele = [{ ...neuesZiel(plan.probleme[0]!.id), text: 'Schmerzmittelgabe nach Plan', termin: '' }];
    const r = regeln(pruefe(fall('huefte'), plan));
    expect(r).toContain('regel.smart.termin');
    expect(r).toContain('regel.smart.patientenperspektive');
    // Termin im Zieltext genügt auch
    plan.ziele[0]!.text = 'Herr Weber gibt innerhalb von 2 Tagen NRS unter 3 an';
    const r2 = regeln(pruefe(fall('huefte'), plan));
    expect(r2).not.toContain('regel.smart.termin');
    expect(r2).not.toContain('regel.smart.patientenperspektive');
    expect(r2).not.toContain('regel.smart.messbar');
  });

  it('Maßnahmen: unvollständig, „regelmäßig“, ohne Begründung, Ziel ohne Maßnahme', () => {
    const plan = leererPlan();
    plan.probleme = [{ ...neuesProblem('risiko'), p: 'Sturzgefahr', e: 'durch Schmerzen', s: '', r: 'motiviert' }];
    plan.ziele = [
      { ...neuesZiel(plan.probleme[0]!.id), text: 'Herr W. stürzt nicht', termin: 'bis Entlassung' },
      { ...neuesZiel(plan.probleme[0]!.id), text: 'Herr W. klingelt vor dem Aufstehen', termin: 'täglich' },
    ];
    plan.massnahmen = [{ ...neueMassnahme(plan.ziele[0]!.id), was: 'Klingel bereitlegen', wie: '', wann: 'regelmäßig', wer: 'Pflege', begruendung: '' }];
    const e = pruefe(fall('huefte'), plan);
    const texte = e.befunde.filter((b) => b.schritt === 'massnahmen').map((b) => `${b.regelId}: ${b.text}`);
    expect(texte.some((t) => t.startsWith('regel.massnahme.konkret') && t.includes('wie'))).toBe(true);
    expect(texte.some((t) => t.includes('ungenau'))).toBe(true);
    expect(texte.some((t) => t.startsWith('regel.massnahme.begruendet'))).toBe(true);
    expect(texte.some((t) => t.startsWith('regel.ziel-passt-zu-problem'))).toBe(true);
  });

  it('Evaluation: nicht erreicht ohne Anpassung', () => {
    const plan = guterPlan();
    const id = plan.ziele[0]!.id;
    plan.evaluation[id] = { erreicht: 'teilweise', begruendung: 'NRS 4', anpassung: '' };
    expect(pruefe(fall('huefte'), plan).befunde.some((b) => b.regelId === 'pp.evaluation.anpassung' && b.ref === id)).toBe(true);
  });

  it('Pflegebericht: wertende Wörter und fehlende Uhrzeit, freiwilliger Schritt zählt nicht zur Gesamtwertung', () => {
    const plan = guterPlan();
    const ohne = pruefe(fall('huefte'), plan).prozent;
    plan.bericht = 'Patient war heute sehr uneinsichtig und wollte nicht aufstehen.';
    const e = pruefe(fall('huefte'), plan);
    const r = e.befunde.filter((b) => b.schritt === 'durchfuehrung').map((b) => b.regelId);
    expect(r).toEqual(expect.arrayContaining(['regel.bericht.wertfrei', 'pp.bericht.zeit']));
    expect(e.prozent).toBe(ohne);
  });

  it('eigener Fall: nur Struktur, kein Fallbezug', () => {
    const e = pruefe(eigenerFall('Frau X, 80 Jahre …'), guterPlan());
    expect(e.fallbezug).toBeNull();
    expect(e.befunde.some((b) => b.regelId.startsWith('pp.fall'))).toBe(false);
    expect(e.prozent).toBeGreaterThan(85);
  });

  it('ohneProblem entfernt abhängige Ziele, Maßnahmen und Evaluationen', () => {
    const plan = guterPlan();
    const p = plan.probleme[0]!;
    const z = plan.ziele.find((x) => x.problemId === p.id)!;
    const neu = ohneProblem(plan, p.id);
    expect(neu.ziele.some((x) => x.id === z.id)).toBe(false);
    expect(neu.massnahmen.some((m) => m.zielId === z.id)).toBe(false);
    expect(neu.evaluation[z.id]).toBeUndefined();
    expect(planAlsText(neu)).not.toContain('Akute Schmerzen');
  });
});

describe('Lernplan-Anbindung', () => {
  it('meldet Gesamtwert, Schritte und Fallthemen, Claude hat Vorrang', () => {
    const f = fall('huefte');
    const e = pruefe(f, guterPlan());
    const ohneKi = lernplanEintraege(pflegeModule.topics, f, e);
    const ids = ohneKi.map((x) => x.topic.id);
    expect(ids).toEqual(expect.arrayContaining(['thema.pp.prozess', 'thema.pp.diagnosen', 'thema.pp.evaluation', 'thema.pro.sturz']));
    expect(ohneKi.find((x) => x.topic.id === 'thema.pp.prozess')!.prozent).toBe(e.prozent);
    expect(new Set(ids).size).toBe(ids.length);

    const ki = leseRueckmeldung(JSON.stringify({ note: 3, prozent: 62, schritte: [{ schritt: 'ziele', prozent: 40, kommentar: 'x' }], regeln: [] }), []);
    const mitKi = lernplanEintraege(pflegeModule.topics, f, e, ki);
    expect(mitKi.find((x) => x.topic.id === 'thema.pp.prozess')!.prozent).toBe(62);
    expect(mitKi.find((x) => x.topic.id === 'thema.pp.ziele')!.prozent).toBe(40);
    expect(mitKi.find((x) => x.topic.id === 'thema.pro.sturz')!.prozent).toBe(62);
  });
});

describe('Claude-Rückmeldung', () => {
  it('nimmt nur Katalogregeln, die Code nicht prüfen kann', () => {
    const ids = kiRegeln(pflegeModule).map((r) => r.id);
    expect(ids).toContain('regel.pesr.keine-med-diagnose');
    expect(ids).toContain('regel.smart.messbar');
    expect(ids).not.toContain('regel.pflegeplanung.durchgaengig');
    expect(ids).not.toContain('regel.zahlen.quelle');
  });
  it('liest unvollständige Antworten robust', () => {
    const r = leseRueckmeldung('Text {"note": 9, "prozent": 120, "regeln": [{"regelId": "regel.x", "erfuellt": true}, {"regelId": "regel.smart.messbar", "erfuellt": false, "kommentar": "k"}], "staerken": ["a", 3]} Ende', ['regel.smart.messbar']);
    expect(r.note).toBe(6);
    expect(r.prozent).toBe(100);
    expect(r.schritte).toHaveLength(6);
    expect(r.regeln).toEqual([{ regelId: 'regel.smart.messbar', erfuellt: false, kommentar: 'k' }]);
    expect(r.staerken).toEqual(['a']);
    expect(() => leseRueckmeldung('kein json', [])).toThrow();
  });
});
