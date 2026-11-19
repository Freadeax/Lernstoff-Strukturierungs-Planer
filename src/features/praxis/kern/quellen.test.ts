import { describe, expect, it } from 'vitest';
import { alleNutzungen } from '../../quellen/nutzung';
import { eintraegeFuer, jahr } from '../../quellen/register';

// Audit P20: Quellen des neuen Praxissimulators hängen am Quellenregister (#/system/quellen).
const KERN = alleNutzungen().filter((n) => n.bereich === 'Praxissimulator (neu)');
const ohneFassung = (titel: string) => /^Fachinformation/.test(titel);

describe('Praxissimulator neu: Quellen und Aktualität (P20)', () => {
  it('Fälle und Katalog liefern Quellenangaben', () => {
    expect(KERN.length).toBeGreaterThan(40);
  });

  it('jede Quellenangabe gehört zu einem Registereintrag', () => {
    expect(KERN.filter((n) => !ohneFassung(n.quelle.titel) && !eintraegeFuer(n.quelle.titel).length).map((n) => `${n.inhalt}: ${n.quelle.titel}`)).toEqual([]);
  });

  it('Leitlinien, Standards und Empfehlungen nennen ihre Fassung (Jahr im Titel)', () => {
    const ohne = KERN.filter((n) => !ohneFassung(n.quelle.titel) && Number.isNaN(jahr(n.quelle.stand))
      && eintraegeFuer(n.quelle.titel).some((e) => e.art !== 'gesetz' && e.art !== 'instrument' && Number.isFinite(jahr(e.aktuell.stand))));
    expect(ohne.map((n) => `${n.inhalt}: ${n.quelle.titel}`)).toEqual([]);
  });

  it('ältere Fassung nur, wenn das Register den Abgleich als offen führt', () => {
    const still = KERN.filter((n) => eintraegeFuer(n.quelle.titel).some((e) =>
      e.art !== 'gesetz' && jahr(n.quelle.stand) < jahr(e.aktuell.stand) && !e.offen));
    expect(still.map((n) => `${n.inhalt}: ${n.quelle.titel} (${n.quelle.stand})`)).toEqual([]);
  });

  it('Sepsis: Surviving Sepsis Campaign 2026 in beiden Sepsisfällen', () => {
    const ssc = KERN.filter((n) => /Surviving Sepsis/.test(n.quelle.titel));
    expect(ssc.length).toBeGreaterThanOrEqual(2);
    for (const n of ssc) expect(jahr(n.quelle.stand), n.inhalt).toBe(2026);
  });
});
