// Hinweise auf echte Personendaten in Freitexten (Audit: „Warnung für personenbezogene Freitexte direkt
// am Eingabefeld und vor optionalem KI-Feedback“). Reine Stichwortsuche: findet typische Muster, kann
// echte Daten übersehen und erkennt erfundene Namen des Übungsfalls als erlaubt.

export interface PersonenFund { art: 'name' | 'geburtsdatum' | 'datum' | 'zimmer' | 'nummer' | 'kontakt'; text: string }

export const PERSONEN_TEXT: Record<PersonenFund['art'], string> = {
  name: 'Name, der nicht im Übungsfall steht',
  geburtsdatum: 'Geburtsdatum',
  datum: 'Datum mit Jahr',
  zimmer: 'Zimmer- oder Bettnummer',
  nummer: 'Versicherten- oder Fallnummer',
  kontakt: 'Telefonnummer oder E-Mail',
};

const ANREDE = /(?<![\p{L}])(?:Herr|Herrn|Frau|Hr\.|Fr\.|Patient(?:in)?|Bewohner(?:in)?)\s+(\p{Lu}[\p{Ll}-]+(?:\s+\p{Lu}[\p{Ll}-]+)?)/gu;

/**
 * Sucht nach Mustern, die auf echte Personen hinweisen können.
 * erlaubt: Namen aus dem Übungsfall (z. B. „Erna Kaiser“); einzelne Wörter daraus gelten ebenfalls.
 */
export function personenbezug(text: string, erlaubt: string[] = []): PersonenFund[] {
  const ok = new Set(erlaubt.flatMap((n) => n.split(/[\s,]+/)).filter((w) => /^\p{Lu}/u.test(w)).map((w) => w.toLowerCase()));
  const funde: PersonenFund[] = [];
  for (const m of text.matchAll(ANREDE)) {
    const woerter = m[1]!.split(/\s+/);
    if (!woerter.every((w) => ok.has(w.toLowerCase()))) funde.push({ art: 'name', text: m[0] });
  }
  for (const m of text.matchAll(/(?:geb\.|geboren(?:\s+am)?)\s*\d{1,2}\.\s?\d{1,2}\.\s?(?:19|20)?\d{2}/giu)) funde.push({ art: 'geburtsdatum', text: m[0] });
  for (const m of text.matchAll(/(?<!\d)\d{1,2}\.\s?\d{1,2}\.\s?(?:19|20)\d{2}(?!\d)/gu)) if (!funde.some((f) => f.text.includes(m[0]))) funde.push({ art: 'datum', text: m[0] });
  for (const m of text.matchAll(/(?<![\p{L}])(?:Zimmer|Zi\.|Zi|Bett)\s*(?:Nr\.?\s*)?\d+[a-z]?/giu)) funde.push({ art: 'zimmer', text: m[0] });
  for (const m of text.matchAll(/(?<![\p{L}\d])\p{Lu}\d{9}(?!\d)|(?:Fall|Patienten|Versicherten)(?:-|\s)?(?:nr\.?|nummer)\s*\d{4,}/giu)) funde.push({ art: 'nummer', text: m[0] });
  for (const m of text.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+|(?<!\d)(?:\+49|0)\d{2,5}[\s/-]?\d{3,}(?:[\s-]?\d+)?/gu)) funde.push({ art: 'kontakt', text: m[0] });
  return funde;
}
