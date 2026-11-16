// Adapter: Blutentnahme an der Werkbank → gemeinsame Auswertung mit Begründung.
// Ein Punkt je Entnahmekriterium; bei Fehlern kommt die Folgehandlung als „besser“ dazu.

import type { AuswertungsPunkt, ErgebnisStufe, SimAuswertung } from '../../../ui/sim/auswertung';
import { ENTNAHME_KRITERIEN, FOLGEHANDLUNG, type EntnahmeErgebnis } from './entnahme';
import type { FehlerArt } from '../../../ui/sim/labor/praeanalytik';

const WARUM = [
  'Verwechslungen sind der folgenschwerste Präanalytikfehler. Eine offene Frage nach Name und Geburtsdatum plus Armband schützt auch bei verwirrten oder schwerhörigen Menschen.',
  'Blut vom Infusionsarm ist mit der Infusion verdünnt oder versetzt: Elektrolyte und Glukose stimmen dann nicht.',
  'Länger als eine Minute stauen lässt Flüssigkeit ins Gewebe treten. Kalium, Eiweiß und Calcium steigen scheinbar.',
  'Jedes angeforderte Röhrchen braucht die Ärztin oder der Arzt für die Entscheidung. Fehlt eins, muss erneut gestochen werden.',
  'Zusätze aus einem Röhrchen können ins nächste verschleppt werden, zum Beispiel EDTA mit Kalium. Deshalb gilt die feste Abnahmereihenfolge.',
  'Im Citratröhrchen ist das Mischverhältnis Blut zu Citrat genau festgelegt. Unterfüllt ist die Gerinnung nicht auswertbar.',
  'Kräftiges Schütteln zerstört rote Blutkörperchen (Hämolyse). Dadurch steigt Kalium scheinbar.',
  'Lange Liegezeit lässt Glukose sinken und Kalium steigen, weil die Zellen weiterarbeiten.',
];

/** Welcher Präanalytikfehler zu welchem Kriterium gehört (für die Folgehandlung). */
const FEHLER_ZU: (FehlerArt | undefined)[] = ['identitaet', 'infusion', 'stauung', undefined, 'verschleppung', 'citrat', 'haemolyse', 'liegezeit'];

export function entnahmeAuswertung(e: EntnahmeErgebnis): SimAuswertung {
  const punkte: AuswertungsPunkt[] = ENTNAHME_KRITERIEN.map((titel, i) => {
    const ok = e.checks[i] ?? true;
    const art = FEHLER_ZU[i];
    return {
      id: `entnahme:${i}`,
      titel,
      urteil: ok ? 'gut' : 'fehler',
      ...(!ok && art ? { besser: FOLGEHANDLUNG[art] } : {}),
      warum: WARUM[i] ?? '',
    };
  });
  const abgelehnt = e.fehler.some((f) => f.abgelehnt);
  const verfaelscht = e.werte.some((w) => w.verfaelscht);
  const stufe: ErgebnisStufe = abgelehnt || e.checks[0] === false ? 'kritisch' : e.punkte < e.max ? 'unsicher' : 'stabil';
  const text = abgelehnt ? 'Das Labor hat die Probe abgelehnt. Es muss neu abgenommen werden.'
    : e.checks[0] === false ? 'Die Identität war nicht sicher geprüft. Eine Verwechslung kann zu falscher Behandlung führen.'
    : verfaelscht ? 'Die Probe kam an, aber einzelne Werte im Befund sind verfälscht.'
    : stufe === 'unsicher' ? 'Die Werte stimmen, einzelne Schritte waren aber nicht sauber.'
    : 'Saubere Entnahme: Die Werte im Befund entsprechen dem wahren Zustand.';
  return {
    quelle: 'Blutentnahme',
    ergebnis: { stufe, text },
    punkte,
    merksaetze: [
      'Offen nach Name und Geburtsdatum fragen und das Armband prüfen.',
      'Höchstens eine Minute stauen, nie am Infusionsarm abnehmen.',
      'Röhrchen in der Reihenfolge des Hausstandards füllen, Citrat bis zur Marke, sanft schwenken, sofort ins Labor.',
      'Bei verfälschtem Wert nicht behandeln, sondern ärztlich auf den Präanalytikfehler hinweisen und neu abnehmen.',
    ],
    grenzen: 'Didaktisches Modell der Präanalytik. Abnahmereihenfolge und Röhrchen richten sich nach dem Hausstandard.',
  };
}
