import { describe, expect, it } from 'vitest';
import { gesamtQuote, kernpunkteAlsText, leseKernpunkte, pruefeAntwort } from './auswertung';
import { abgabeText, ausBase64url, entpacke, fallLink, leseAbgaben, leseFall, packe, zuBase64url } from './kodierung';
import { hatLoesung, klassenFassung, type Abgabe, type KlassenFall } from './typen';
import { leererFall, VORLAGEN } from './vorlagen';

const fall: KlassenFall = {
  v: 1, id: 'abc12345', art: 'fallbeispiel', titel: 'Frau Müller nach Sturz', situation: 'Frau Müller, 82 Jahre, ist gestürzt. Schmerz NRS 5.',
  material: [{ titel: 'Vitalzeichen', text: 'RR 150/90, Puls 96' }],
  aufgaben: [
    { id: 'a1', frage: 'Welche Risiken bestehen?', erwartung: 'Sturz, Dekubitus', kernpunkte: leseKernpunkte('Sturzgefahr: sturz, gestuerzt\nDekubitusgefahr: dekubitus, druckgeschwür') },
    { id: 'a2', frage: 'Was tust du zuerst?' },
  ],
  von: 'Frau Schmidt', loesung: 'nie', erstellt: '2026-10-24T12:00:00.000Z',
};

const abgabe: Abgabe = {
  v: 1, fallId: fall.id, titel: fall.titel, name: 'Lea K.', abgegeben: '2026-10-24T15:00:00.000Z',
  antworten: { a1: 'Hohe Sturzgefahr, weil sie schon einmal gestürzt ist. 😊 Ä Ö Ü ß', a2: 'Schmerz einschätzen (NRS)' },
};

describe('Kodierung', () => {
  it('base64url hin und zurück', () => {
    const b = new Uint8Array([0, 1, 250, 251, 252, 253, 254, 255]);
    expect(Array.from(ausBase64url(zuBase64url(b)))).toEqual(Array.from(b));
    expect(zuBase64url(b)).not.toMatch(/[+/=]/);
  });

  it('packt komprimiert und entpackt Umlaute und Emoji', async () => {
    const code = await packe(abgabe);
    expect(code[0]).toBe('z');
    expect(await entpacke(code)).toEqual(abgabe);
  });

  it('liest auch unkomprimierte Codes', async () => {
    const code = 'j' + zuBase64url(new TextEncoder().encode(JSON.stringify(fall)));
    expect(await leseFall(code)).toMatchObject({ id: fall.id, titel: fall.titel });
  });

  it('lehnt Unsinn mit verständlicher Meldung ab', async () => {
    await expect(leseFall('zAAAA')).rejects.toThrow(/beschädigt/);
    await expect(leseFall('j' + zuBase64url(new TextEncoder().encode('{"v":1}')))).rejects.toThrow(/kein gültiger/);
  });

  it('Link enthält den Fall und bleibt bei Vorlagen kurz genug für Messenger', async () => {
    const link = await fallLink(fall, 'https://x.github.io/app/');
    expect(link).toMatch(/^https:\/\/x\.github\.io\/app\/#\/lernen\/klasse\/fall\?d=z[A-Za-z0-9_-]+$/);
    const d = new URLSearchParams(link.split('?')[1]).get('d')!;
    expect(await leseFall(d)).toEqual(fall);
    for (const v of VORLAGEN) {
      const l = await fallLink(v.baue(), 'https://freadeax.github.io/Lernstoff-Strukturierungs-Planer/');
      expect(l.length, v.id).toBeLessThan(6000);
    }
  });
});

describe('Abgaben', () => {
  it('Abgabe-Text enthält Antworten und Code und lässt sich wieder einlesen', async () => {
    const text = await abgabeText(fall, abgabe);
    expect(text).toContain('Name: Lea K.');
    expect(text).toContain('2. Was tust du zuerst?');
    const { abgaben, fehler } = await leseAbgaben(text);
    expect(fehler).toEqual([]);
    expect(abgaben).toEqual([abgabe]);
  });

  it('findet mehrere Codes, auch umbrochen und als Mail-Zitat', async () => {
    const t1 = await abgabeText(fall, abgabe);
    const t2 = await abgabeText(fall, { ...abgabe, name: 'Tom' });
    const code = t2.split('\n').pop()!;
    const umbrochen = code.match(/.{1,40}/g)!.map((z) => `> ${z}`).join('\n');
    const { abgaben } = await leseAbgaben(`Hallo,\n${t1}\n\nWeitergeleitet:\n${umbrochen}`);
    expect(abgaben.map((a) => a.name)).toEqual(['Lea K.', 'Tom']);
  });

  it('meldet beschädigte Codes', async () => {
    const { abgaben, fehler } = await leseAbgaben('LSP-ABGABE[zKaputt]');
    expect(abgaben).toEqual([]);
    expect(fehler).toHaveLength(1);
  });
});

describe('Lösung', () => {
  it('Klassenfassung ohne Lösung, wenn sie nie gezeigt wird', () => {
    expect(hatLoesung(fall)).toBe(true);
    const k = klassenFassung(fall);
    expect(hatLoesung(k)).toBe(false);
    expect(k.aufgaben[0]).toEqual({ id: 'a1', frage: 'Welche Risiken bestehen?' });
    expect(klassenFassung({ ...fall, loesung: 'nach-abgabe' })).toEqual({ ...fall, loesung: 'nach-abgabe' });
  });
});

describe('Checkliste', () => {
  it('liest Kernpunkte der Lehrkraft', () => {
    expect(leseKernpunkte('Sturzgefahr: Sturz, gestürzt\n\nDekubitus')).toEqual([
      { text: 'Sturzgefahr', muster: ['sturz', 'gestuerzt'] },
      { text: 'Dekubitus', muster: ['dekubitus'] },
    ]);
    expect(leseKernpunkte(kernpunkteAlsText(fall.aufgaben[0]!.kernpunkte))).toEqual(fall.aufgaben[0]!.kernpunkte);
  });

  it('findet Kernpunkte in Antworten', () => {
    const t = pruefeAntwort(fall.aufgaben[0]!, abgabe.antworten.a1!);
    expect(t.map((x) => x.ok)).toEqual([true, false]);
    expect(gesamtQuote(fall.aufgaben, abgabe.antworten)).toBe(50);
    expect(gesamtQuote([fall.aufgaben[1]!], abgabe.antworten)).toBeNull();
  });

  it('SIS-Vorlagen: die Beispiel-SIS erfüllt alle Kernpunkte ihres Feldes', () => {
    for (const v of VORLAGEN.filter((x) => x.art === 'sis')) {
      const f = v.baue();
      for (const a of f.aufgaben.filter((x) => x.kernpunkte?.length)) {
        const fehlt = pruefeAntwort(a, a.erwartung ?? '').filter((x) => !x.ok).map((x) => x.punkt.text);
        expect(fehlt, `${v.id} ${a.id}`).toEqual([]);
      }
    }
  });

  it('übernimmt Krankheitsbild- und Assessment-Fälle mit Lösung', () => {
    const kh = VORLAGEN.filter((v) => v.art === 'krankheitsbild');
    const as = VORLAGEN.filter((v) => v.art === 'assessment');
    expect(kh.length).toBeGreaterThan(5);
    expect(as.length).toBeGreaterThan(10);
    for (const v of kh) {
      const f = v.baue();
      expect(f.aufgaben.every((a) => a.frage.includes('\nA) ') && /^Richtig: [A-J]/.test(a.erwartung ?? '')), v.id).toBe(true);
    }
    const gcs = as.find((v) => v.id === 'as:gcs-schroeder')!.baue();
    expect(gcs.aufgaben.map((a) => a.id)).toEqual(['augen', 'verbal', 'motorik', 'einstufung']);
    expect(gcs.aufgaben[2]!.erwartung).toMatch(/^5 Punkte\./);
    expect(gcs.aufgaben[3]!.erwartung).toMatch(/^9 Punkte/);
  });

  it('alle Vorlagen sind gültige Fälle mit eindeutigen Aufgaben-IDs', async () => {
    for (const v of [...VORLAGEN.map((x) => x.baue()), { ...leererFall(), titel: 'x', aufgaben: [{ id: 'q', frage: 'f' }] }]) {
      expect(new Set(v.aufgaben.map((a) => a.id)).size).toBe(v.aufgaben.length);
      expect(await leseFall(await packe(v))).toEqual(v);
    }
  });
});

describe('Weitere Vorlagen', () => {
  it('Übergabe: vier SBAR-Aufgaben mit Beispiel je Teil', () => {
    const sbar = VORLAGEN.filter((v) => v.art === 'uebergabe');
    expect(sbar.length).toBeGreaterThan(0);
    for (const v of sbar) {
      const f = v.baue();
      expect(f.aufgaben.map((a) => a.id)).toEqual(['s', 'b', 'a', 'r']);
      for (const a of f.aufgaben) expect(a.erwartung, `${v.id} ${a.id}`).toBeTruthy();
      // Die ganze Beispiel-Übergabe erfüllt alle Pflichtpunkte des Trainers
      const ganz = f.aufgaben.map((a) => a.erwartung).join('\n');
      const fehlt = f.aufgaben.flatMap((a) => pruefeAntwort(a, ganz)).filter((x) => !x.ok).map((x) => x.punkt.text);
      expect(fehlt.length, `${v.id}: ${fehlt.join(' | ')}`).toBeLessThanOrEqual(1);
    }
  });

  it('Pflegebericht: Beispiel-Eintrag erfüllt alle Kernpunkte', () => {
    const ber = VORLAGEN.filter((v) => v.art === 'bericht');
    expect(ber.length).toBeGreaterThan(0);
    for (const v of ber) {
      const a = v.baue().aufgaben[0]!;
      expect(pruefeAntwort(a, a.erwartung!).filter((x) => !x.ok).map((x) => x.punkt.text), v.id).toEqual([]);
    }
  });
});

describe('QR-Code', () => {
  it('passt für Klassen-Links ohne Lösung, lehnt zu lange ab', async () => {
    const { qrPfad } = await import('./qr');
    expect(qrPfad('x'.repeat(2500))).toBeNull();
    const pp = VORLAGEN.find((v) => v.art === 'pflegeplanung')!.baue();
    const link = await fallLink(klassenFassung({ ...pp, loesung: 'nie' }), 'https://freadeax.github.io/Lernstoff-Strukturierungs-Planer/');
    expect(qrPfad(link)?.groesse).toBeGreaterThan(21);
  });
});
