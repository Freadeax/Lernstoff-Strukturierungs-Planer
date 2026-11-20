import { describe, expect, it } from 'vitest';
import { erstelleIndex, suche } from '../../core/abgleich/abgleich';
import { synonyme, woerter } from '../../core/abgleich/normalisieren';
import { DIALOGE, type Knoten } from './dialoge';
import { deute } from './eigene-worte';
import { erkenneTechniken } from './techniken-erkennen';
import { VARIANTEN } from './varianten';

const knoten = (id: string): Knoten => DIALOGE.flatMap((d) => d.knoten).find((k) => k.id === id)!;

/** Formulierungen, die NICHT im Katalog stehen: so tippen Lernende. [Knoten, erwarteter Index, Text] */
const UNBEKANNT: Array<[string, number, string]> = [
  ['a1', 0, 'Ich merke, dass Sie richtig wütend sind. Gehen wir kurz woanders hin?'],
  ['a1', 0, 'das verstehe ich, sie hätten es von uns hören müssen'],
  ['a1', 1, 'ich hatte keinen dienst gestern'],
  ['a1', 2, 'beruhigen sie sich doch'],
  ['a1', 2, 'ist doch nicht so schlimm'],
  ['a1b', 0, 'Sie haben recht. Ich erzähle Ihnen jetzt, was passiert ist.'],
  ['a1b', 2, 'gehen sie zur leitung'],
  ['a1b', 1, 'wenn sie weiter so schreien gehe ich'],
  ['a2', 0, 'Er ist gestern Abend gestürzt, die Ärztin hat ihn untersucht und das Röntgen war gut'],
  ['a2', 1, 'sowas passiert bei alten Leuten häufig'],
  ['a2', 2, 'hat er nicht erzählt dass er nachts aufsteht?'],
  ['a3', 0, 'Entschuldigung, das war ein Fehler. Wie sollen wir Sie künftig informieren?'],
  ['a3', 1, 'weiß ich nicht steht in der doku'],
  ['a4', 0, 'Wir legen eine Klingelmatte vors Bett und machen ein Nachtlicht an. Ich rufe Sie morgen an.'],
  ['a4', 1, 'keine sorge wir passen auf'],
  ['a4', 2, 'wir könnten ihn nachts fixieren'],
  ['b1', 0, 'Was merken Sie denn seit Sie die neue Tablette nehmen?'],
  ['b1', 1, 'sie müssen die tablette nehmen, der arzt hat das angeordnet'],
  ['b1', 2, 'ist ihnen schwindelig?'],
  ['b1b', 0, 'Das ist Ihre Entscheidung. Was stört Sie denn?'],
  ['b1b', 1, 'dann schreib ich auf dass sie nicht mitmachen'],
  ['b2', 0, 'ich messe mal den RR im liegen und stehen und sag der ärztin bescheid'],
  ['b2', 0, 'Ich kontroliere gleich ihren Blutdurck und informiere den Arzt.'],
  ['b2', 2, 'trinken sie mal mehr'],
  ['b2', 1, 'das ist normal am anfang'],
  ['b3', 0, 'Das muss die Ärztin entscheiden, ich frage sie und sie kommt zu Ihnen.'],
  ['b3', 1, 'einmal weglassen ist nicht schlimm'],
  ['b3', 2, 'dann kriegen sie einen schlaganfall'],
  ['b4', 0, 'ich dokumentiere dass sie die tablette nicht genommen haben'],
  ['b4', 1, 'ich lasse ihnen die tablette mal da'],
  ['c1', 0, 'Sie wollen, dass Ihre Kinder etwas Warmes zu essen bekommen.'],
  ['c1', 1, 'aber ihre kinder sind doch erwachsen'],
  ['c1b', 0, 'Ihre Kinder sind Ihnen wichtig.'],
  ['c1b', 2, 'die tür ist zu, da kommen sie nicht raus'],
  ['c2', 0, 'Wie haben Sie denn Ihre Pfannkuchen gemacht?'],
  ['c2', 2, 'wie heißen ihre kinder'],
  ['c3', 0, 'Helfen Sie mir den Tisch zu decken?'],
  ['c3', 2, 'die kinder kommen bestimmt am wochenende'],
  ['d1', 0, 'Sie müssen sich nicht entschuldigen, ich habe Zeit für Sie.'],
  ['d1', 1, 'das wird schon morgen ist es vorbei'],
  ['d1b', 1, 'soll ich ihnen was zum schlafen bringen'],
  ['d1b', 2, 'keine angst ist ein routineeingriff'],
  ['d2', 0, 'Sie haben Angst um Ihre Stimme. Was hat man Ihnen im Aufklärungsgespräch gesagt?'],
  ['d2', 2, 'das hätten sie beim aufklärungsgespräch fragen müssen'],
  ['d3', 0, 'Wollen wir Ihre Fragen aufschreiben? Ich sage dem Arzt Bescheid.'],
  ['d3', 2, 'fragen sie morgen bei der visite'],
];

describe('Abgleich (Kern)', () => {
  it('faltet Umlaute, ersetzt Synonyme, lässt Stoppwörter weg', () => {
    const syn = synonyme([['blutdruck', 'RR'], ['aerztin', 'Arzt', 'Doktor']]);
    const w = woerter('Ich messe den RR und sage dem Doktor Bescheid', syn);
    expect(w).toEqual(woerter('ich messe blutdruck sage Ärztin bescheid'));
    expect(w).not.toContain('den');
    expect(w).toContain('blutdruck');
  });
  it('findet trotz Tippfehler', () => {
    const ix = erstelleIndex([{ id: 'rr', texte: ['Blutdruck kontrollieren'] }, { id: 'bz', texte: ['Blutzucker messen'] }]);
    expect(suche(ix, 'Blutdurck kontrolieren').treffer[0]!.id).toBe('rr');
  });
  it('meldet „keiner“, wenn nichts passt', () => {
    const ix = erstelleIndex([{ id: 'a', texte: ['Pfannkuchen mit Apfel'] }]);
    expect(suche(ix, 'Fahrrad reparieren').sicherheit).toBe('keiner');
  });
});

describe('Gesprächssimulator, eigene Worte', () => {
  it('jede feste Antwort hat mindestens drei Varianten', () => {
    for (const d of DIALOGE) for (const k of d.knoten) k.antworten.forEach((_, i) => {
      expect(VARIANTEN[`${k.id}.${i}`]?.length ?? 0, `${k.id}.${i}`).toBeGreaterThanOrEqual(3);
    });
  });
  it('keine verwaisten Varianten', () => {
    const gueltig = new Set(DIALOGE.flatMap((d) => d.knoten.flatMap((k) => k.antworten.map((_, i) => `${k.id}.${i}`))));
    for (const s of Object.keys(VARIANTEN)) expect(gueltig.has(s), s).toBe(true);
  });
  it('die festen Antworten selbst werden sicher erkannt', () => {
    for (const d of DIALOGE) for (const k of d.knoten) k.antworten.forEach((a, i) => {
      const e = deute(k, a.text);
      expect(e.rangfolge[0]!.index, `${k.id}.${i}`).toBe(i);
      expect(e.sicherheit, `${k.id}.${i}`).toBe('sicher');
    });
  });
  it('unbekannte Formulierungen: mindestens 85 % richtig auf Platz 1, nie sicher falsch', () => {
    let richtig = 0;
    const falsch: string[] = [];
    for (const [kid, soll, text] of UNBEKANNT) {
      const e = deute(knoten(kid), text);
      if (e.rangfolge[0]!.index === soll) richtig++;
      else {
        falsch.push(`${kid} „${text}“ → ${e.rangfolge[0]!.index} (${e.sicherheit})`);
        expect(e.sicherheit, `sicher falsch: ${kid} „${text}“`).not.toBe('sicher');
      }
    }
    expect(richtig / UNBEKANNT.length, falsch.join('\n')).toBeGreaterThanOrEqual(0.85);
  });
  it('richtige Antwort ist bei „unsicher“ unter den ersten drei Vorschlägen', () => {
    for (const [kid, soll, text] of UNBEKANNT) {
      const e = deute(knoten(kid), text);
      expect(e.rangfolge.slice(0, 3).map((r) => r.index), `${kid} „${text}“`).toContain(soll);
    }
  });
  it('Themenfremdes wird nicht zugeordnet', () => {
    expect(deute(knoten('c2'), 'Die Bundesliga war gestern spannend').sicherheit).not.toBe('sicher');
    expect(deute(knoten('b2'), 'asdf').sicherheit).toBe('keiner');
  });
  it('erkennt typische Sperren und förderliche Techniken', () => {
    expect(erkenneTechniken('Machen Sie sich keine Sorgen.')).toContain('beschwichtigen');
    expect(erkenneTechniken('Sie wirken sehr traurig.')).toContain('spiegeln');
    expect(erkenneTechniken('Was genau merken Sie?')).toContain('offen');
    expect(erkenneTechniken('Ist Ihnen schwindelig?')).toContain('geschlossen');
    expect(erkenneTechniken('Darf ich mich zu Ihnen setzen?')).not.toContain('geschlossen');
  });
});
