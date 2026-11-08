// Belegprüfung je Aussage in drei getrennten Stufen (statt pauschal „belegt“):
//   1. Zitat gefunden   – der Code findet das wörtliche Zitat auf der angegebenen Seite (Q1).
//   2. Sinn geprüft     – der KI-Prüfer (K1/K3/K5) und die Zahlenprüfung (Q2) bestätigen, dass das Zitat die Aussage trägt.
//   3. Fachlich freigegeben – ein Mensch (du, Lehrkraft, Praxisanleitung) hat die Aussage abgenommen.
// Dazu Quellenangaben für sensible Inhalte: Expertenstandards, Recht, Arzneimittel, Normwerte brauchen
// Herausgeber, Fassung, Abschnitt, Geltungsbereich und Prüfdatum direkt an der Aussage.
import type { Belegpruefung, Claim, Document, QuellenArt, Quellenangabe, SourceChunk, Summary } from '../../core/types';
import type { PruefBefund } from './deterministisch';

type Stufen = Omit<Belegpruefung, 'freigabe'>;

/** Arten, die ohne eigenen Beleg auskommen; für sie entfallen Zitat- und Sinnstufe. */
const OHNE_BELEG = new Set(['struktur', 'lernhilfe', 'ergaenzung', 'fehlt', 'rueckfrage', 'widerspruch', 'unleserlich']);

/**
 * Stufen 1 und 2 aus den Befunden. `kiGeprueft` enthält die Aussagen, zu denen der KI-Prüfer ein Urteil
 * abgegeben hat; ohne KI-Prüfer (null) bleibt der Sinn „nicht geprüft“, außer der Code findet selbst eine Abweichung.
 */
export function stufenAusBefunden(c: Pick<Claim, 'id' | 'kind' | 'citations'>, befunde: Array<Pick<PruefBefund, 'pruefung' | 'schwere' | 'claimId'>>, kiGeprueft: Set<string> | null): Stufen {
  if (OHNE_BELEG.has(c.kind ?? 'fakt')) return { zitat: 'entfaellt', sinn: 'entfaellt' };
  const eigene = befunde.filter((b) => b.claimId === c.id);
  const hat = (p: string, s?: string) => eigene.some((b) => b.pruefung === p && (!s || b.schwere === s));

  let zitat: Stufen['zitat'];
  if (hat('Q1c') || !c.citations.length) zitat = 'ohne_beleg';
  else if (hat('Q1d') || hat('Q1a', 'blocker')) zitat = 'nicht_gefunden';
  else if (hat('Q1a', 'warnung')) zitat = 'aehnlich';
  else zitat = 'gefunden';

  let sinn: Stufen['sinn'];
  if (zitat === 'ohne_beleg' || zitat === 'nicht_gefunden') sinn = 'nicht_gestuetzt';
  else if (hat('K1', 'blocker') || hat('K3') || hat('K5') || hat('Q2', 'blocker')) sinn = 'nicht_gestuetzt';
  else if (hat('K1', 'warnung') || hat('Q2')) sinn = 'teilweise';
  else if (kiGeprueft?.has(c.id)) sinn = 'gestuetzt';
  else sinn = 'nicht_geprueft';
  return { zitat, sinn };
}

/** Stufen einer gespeicherten Aussage; ältere Zusammenfassungen ohne `pruefung` werden aus den Befunden abgeleitet. */
export function stufenVon(c: Claim, s: Pick<Summary, 'qa'>): Belegpruefung {
  if (c.pruefung) return c.pruefung;
  const befunde = s.qa?.befunde ?? [];
  // Ob der KI-Prüfer lief, ist bei alten Ständen nicht gespeichert: K-Befunde in der Zusammenfassung sind ein Hinweis darauf, ein Urteil je Aussage aber nicht.
  return stufenAusBefunden(c, befunde, null);
}

export const ZITAT_TEXT: Record<Belegpruefung['zitat'], string> = {
  gefunden: 'Zitat gefunden', aehnlich: 'Zitat nur ähnlich gefunden', nicht_gefunden: 'Zitat nicht gefunden', ohne_beleg: 'kein Zitat angegeben', entfaellt: 'kein Beleg nötig',
};
export const SINN_TEXT: Record<Belegpruefung['sinn'], string> = {
  gestuetzt: 'Sinn geprüft', teilweise: 'Sinn nur teilweise gestützt', nicht_gestuetzt: 'Sinn nicht gestützt', nicht_geprueft: 'Sinn nicht geprüft', entfaellt: '–',
};

export type StufenAmpel = 'ok' | 'warn' | 'fehler' | 'offen' | 'leer';
export const zitatAmpel = (z: Belegpruefung['zitat']): StufenAmpel => z === 'gefunden' ? 'ok' : z === 'aehnlich' ? 'warn' : z === 'entfaellt' ? 'leer' : 'fehler';
export const sinnAmpel = (z: Belegpruefung['sinn']): StufenAmpel => z === 'gestuetzt' ? 'ok' : z === 'teilweise' ? 'warn' : z === 'nicht_gestuetzt' ? 'fehler' : z === 'entfaellt' ? 'leer' : 'offen';
export const freigabeAmpel = (f?: Belegpruefung['freigabe']): StufenAmpel => !f ? 'offen' : f.urteil === 'freigegeben' ? 'ok' : 'fehler';

// ---------------------------------------------------------------------------
// Quellenart und sensible Inhalte
// ---------------------------------------------------------------------------

export const QUELLENART_TEXT: Record<QuellenArt, string> = {
  expertenstandard: 'Expertenstandard (DNQP)', gesetz: 'Gesetz oder Verordnung', leitlinie: 'Leitlinie (z. B. AWMF)',
  fachinformation: 'Fachinformation / Beipackzettel', fachbuch: 'Fachbuch', schule: 'Vorgabe der Pflegeschule',
  einrichtung: 'Vorgabe der Einrichtung (Hausstandard)', mitschrift: 'Eigene Mitschrift', sonstige: 'Sonstige Quelle',
};

/** Kurzer Hinweis, wie verbindlich die Quellenart ist. */
export const QUELLENART_GELTUNG: Record<QuellenArt, string> = {
  expertenstandard: 'bundesweiter Fachstandard, nach SGB XI für Pflegeeinrichtungen verbindlich',
  gesetz: 'rechtlich verbindlich im genannten Geltungsbereich',
  leitlinie: 'Empfehlung der Fachgesellschaften',
  fachinformation: 'Herstellerangaben zum Arzneimittel, maßgeblich ist die aktuelle Fassung',
  fachbuch: 'Lehrbuchwissen, kann hinter aktuellen Standards zurückliegen',
  schule: 'gilt für Unterricht und Prüfungen deiner Schule',
  einrichtung: 'gilt nur in dieser Einrichtung und kann vom Expertenstandard abweichen',
  mitschrift: 'eigene Notiz, nicht als Quelle für Prüfungen geeignet',
  sonstige: 'Verbindlichkeit unklar',
};

export type SensibleKategorie = 'expertenstandard' | 'recht' | 'arzneimittel' | 'normwert';
export const KATEGORIE_TEXT: Record<SensibleKategorie, string> = {
  expertenstandard: 'Expertenstandard', recht: 'Recht', arzneimittel: 'Arzneimittel', normwert: 'Normwert',
};

const MUSTER: Array<[SensibleKategorie, RegExp]> = [
  ['expertenstandard', /\b(DNQP|Expertenstandards?)\b/i],
  ['recht', /§|\b(Art\.\s*\d|PflBG|PflAPrV|SGB|BGB|StGB|IfSG|BtMG|Betreuungsrecht|Patientenverfügung|Haftung|Schweigepflicht|freiheitsentziehend)/i],
  ['arzneimittel', /\b\d+([.,]\d+)?\s*(mg|µg|mcg|IE)\b(?!\s*\/\s*dl)|\b(Dosis|Dosierung|Tageshöchstdosis|Applikation|Wirkstoff|Antikoagul|Insulin|Opioid|Heparin)/i],
  ['normwert', /mmHg|mmol\/l|mg\/dl|g\/dl|Normwert|Normbereich|Referenzbereich|Schläge\/min|Atemzüge|\/min\b|°C|SpO2|Sauerstoffsättigung/i],
];
const ART_ZU_KATEGORIE: Partial<Record<QuellenArt, SensibleKategorie>> = { expertenstandard: 'expertenstandard', gesetz: 'recht', fachinformation: 'arzneimittel' };

/** Sensible Kategorien einer Aussage aus Quellenart und Text. Ergänzungen und Lernhilfen zählen mit, sie sind ja ungeprüft. */
export function sensibleKategorien(c: Pick<Claim, 'text' | 'citations' | 'kind'>, docs: Map<string, Document>): SensibleKategorie[] {
  if (c.kind === 'struktur' || c.kind === 'rueckfrage') return [];
  const k = new Set<SensibleKategorie>();
  for (const z of c.citations) {
    const art = docs.get(z.documentId)?.quelle?.art;
    const kat = art && ART_ZU_KATEGORIE[art];
    if (kat) k.add(kat);
  }
  for (const [kat, re] of MUSTER) if (re.test(c.text)) k.add(kat);
  return [...k];
}

export const PRUEFDATUM_HOECHSTENS_MONATE = 24;

export interface QuellenLuecke { feld: 'art' | 'herausgeber' | 'fassung' | 'abschnitt' | 'geltungsbereich' | 'geprueftAm' | 'veraltet'; text: string }

/** Was an einer Belegstelle für eine sensible Aussage fehlt. `heute` als YYYY-MM-DD, für Tests einstellbar. */
export function quellenLuecken(q: Quellenangabe | undefined, chunk: Pick<SourceChunk, 'chapter'> | undefined, heute = new Date().toISOString().slice(0, 10)): QuellenLuecke[] {
  const l: QuellenLuecke[] = [];
  if (!q) return [{ feld: 'art', text: 'Quellenart und Angaben zur Fassung fehlen' }];
  if (!q.herausgeber?.trim()) l.push({ feld: 'herausgeber', text: 'Herausgeber fehlt' });
  if (!q.fassung?.trim()) l.push({ feld: 'fassung', text: 'Fassung oder Stand fehlt' });
  if (!chunk?.chapter?.trim()) l.push({ feld: 'abschnitt', text: 'Abschnitt nicht erkannt, nur Seite bekannt' });
  if (!q.geltungsbereich?.trim()) l.push({ feld: 'geltungsbereich', text: 'Geltungsbereich fehlt' });
  if (!q.geprueftAm) l.push({ feld: 'geprueftAm', text: 'Prüfdatum fehlt' });
  else if (monateZwischen(q.geprueftAm, heute) > PRUEFDATUM_HOECHSTENS_MONATE) l.push({ feld: 'veraltet', text: `zuletzt vor mehr als ${PRUEFDATUM_HOECHSTENS_MONATE} Monaten auf Aktualität geprüft` });
  return l;
}

function monateZwischen(von: string, bis: string): number {
  const [y1, m1, d1] = von.split('-').map(Number), [y2, m2, d2] = bis.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
}

/** Hinweis, wenn eine Aussage zugleich aus Fachstandard und Haus- oder Schulvorgabe stammt. */
export function geltungsHinweis(c: Pick<Claim, 'citations'>, docs: Map<string, Document>): string | null {
  const arten = new Set(c.citations.map((z) => docs.get(z.documentId)?.quelle?.art).filter(Boolean) as QuellenArt[]);
  const fach = arten.has('expertenstandard') || arten.has('gesetz') || arten.has('leitlinie');
  const lokal = arten.has('einrichtung') || arten.has('schule');
  if (fach && lokal) return 'Diese Aussage stützt sich auf einen Fachstandard und auf eine Vorgabe von Schule oder Einrichtung. Prüfe, ob beide übereinstimmen: die Hausvorgabe gilt nur dort.';
  if (arten.has('einrichtung')) return 'Nur eine Hausvorgabe belegt diese Aussage. Sie gilt in dieser Einrichtung und muss nicht dem Expertenstandard entsprechen.';
  return null;
}

// ---------------------------------------------------------------------------
// Übersicht für eine Zusammenfassung
// ---------------------------------------------------------------------------

export interface StufenUebersicht {
  aussagen: number;          // Aussagen mit Belegpflicht
  zitatGefunden: number;
  sinnGeprueft: number;
  sinnOffen: number;         // KI-Prüfer lief nicht oder hat nicht geurteilt
  freigegeben: number;
  abgelehnt: number;
  sensibel: number;
  sensibelUnvollstaendig: number;
}

export function stufenUebersicht(s: Summary, docs: Map<string, Document>, chunks: Map<string, SourceChunk>, heute?: string): StufenUebersicht {
  const u: StufenUebersicht = { aussagen: 0, zitatGefunden: 0, sinnGeprueft: 0, sinnOffen: 0, freigegeben: 0, abgelehnt: 0, sensibel: 0, sensibelUnvollstaendig: 0 };
  for (const c of s.claims) {
    const st = stufenVon(c, s);
    if (st.zitat !== 'entfaellt') {
      u.aussagen++;
      if (st.zitat === 'gefunden' || st.zitat === 'aehnlich') u.zitatGefunden++;
      if (st.sinn === 'gestuetzt') u.sinnGeprueft++;
      if (st.sinn === 'nicht_geprueft') u.sinnOffen++;
      if (st.freigabe?.urteil === 'freigegeben') u.freigegeben++;
      if (st.freigabe?.urteil === 'abgelehnt') u.abgelehnt++;
    }
    if (sensibleKategorien(c, docs).length) {
      u.sensibel++;
      const luecken = c.citations.length
        ? c.citations.some((z) => quellenLuecken(docs.get(z.documentId)?.quelle, chunks.get(z.chunkId), heute).length)
        : true;
      if (luecken) u.sensibelUnvollstaendig++;
    }
  }
  return u;
}

/** Kopfzeile statt „Alle Aussagen belegt“: was der Code, der KI-Prüfer und ein Mensch jeweils bestätigt haben. */
export function uebersichtText(u: StufenUebersicht): string {
  if (!u.aussagen) return 'Keine Aussagen mit Belegpflicht.';
  const teile = [
    `Zitat gefunden: ${u.zitatGefunden} von ${u.aussagen}`,
    u.sinnOffen === u.aussagen ? 'Sinn: nicht geprüft (KI-Prüfer war aus)' : `Sinn geprüft: ${u.sinnGeprueft} von ${u.aussagen}`,
    `fachlich freigegeben: ${u.freigegeben} von ${u.aussagen}`,
  ];
  return teile.join(' · ');
}

/** Freigabe setzen oder zurücknehmen, ohne die übrigen Stufen zu verändern. */
export function mitFreigabe(s: Summary, claimId: string, freigabe: Belegpruefung['freigabe'] | null): Summary {
  return {
    ...s,
    claims: s.claims.map((c) => {
      if (c.id !== claimId) return c;
      const st = stufenVon(c, s);
      const { freigabe: _alt, ...rest } = st;
      return { ...c, pruefung: freigabe ? { ...rest, freigabe } : rest };
    }),
  };
}
