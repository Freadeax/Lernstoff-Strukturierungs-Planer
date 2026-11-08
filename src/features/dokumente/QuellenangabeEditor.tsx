// Quellenangabe eines Dokuments: Art (Expertenstandard, Gesetz, Schule, Einrichtung …), Herausgeber, Fassung,
// Geltungsbereich und Prüfdatum. Sie erscheint an jeder Aussage, die sich auf dieses Dokument stützt.
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { db } from '../../core/db';
import type { Document, QuellenArt, Quellenangabe } from '../../core/types';
import { PRUEFDATUM_HOECHSTENS_MONATE, QUELLENART_GELTUNG, QUELLENART_TEXT, quellenLuecken } from '../qualitaet/belegstufen';

const ARTEN = Object.keys(QUELLENART_TEXT) as QuellenArt[];
const BEISPIEL: Partial<Record<QuellenArt, { herausgeber: string; fassung: string; geltungsbereich: string }>> = {
  expertenstandard: { herausgeber: 'DNQP', fassung: 'z. B. 2. Aktualisierung 2017', geltungsbereich: 'bundesweit' },
  gesetz: { herausgeber: 'z. B. Bundesgesetzgeber', fassung: 'z. B. Stand 01.01.2024', geltungsbereich: 'z. B. Deutschland' },
  fachinformation: { herausgeber: 'Hersteller', fassung: 'z. B. Stand 03/2025', geltungsbereich: 'zugelassenes Präparat' },
  schule: { herausgeber: 'Name der Pflegeschule', fassung: 'z. B. Skript Kurs 2025', geltungsbereich: 'z. B. Kurs 2025, Unterricht und Prüfung' },
  einrichtung: { herausgeber: 'Name der Einrichtung', fassung: 'z. B. Hausstandard Version 3', geltungsbereich: 'z. B. Klinikum Musterstadt, alle Stationen' },
};

/** Schnelle Vorauswahl aus dem Titel, damit Expertenstandards und Gesetze nicht ohne Angabe bleiben. */
export function vermuteArt(titel: string): QuellenArt | undefined {
  if (/DNQP|Expertenstandard/i.test(titel)) return 'expertenstandard';
  if (/§|Gesetz|Verordnung|PflBG|PflAPrV|SGB/i.test(titel)) return 'gesetz';
  if (/Fachinformation|Beipackzettel|Gebrauchsinformation/i.test(titel)) return 'fachinformation';
  if (/Leitlinie|AWMF/i.test(titel)) return 'leitlinie';
  if (/Hausstandard|Verfahrensanweisung|SOP|Dienstanweisung/i.test(titel)) return 'einrichtung';
  return undefined;
}

export function QuellenangabeEditor({ document: d, offen }: { document: Document; offen?: boolean }) {
  const start: Quellenangabe = d.quelle ?? { art: vermuteArt(d.title) ?? 'fachbuch' };
  const [q, setQ] = useState<Quellenangabe>(start);
  const [gespeichert, setGespeichert] = useState(false);
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (offen) ref.current?.scrollIntoView({ block: 'center' }); }, [offen]);
  const bsp = BEISPIEL[q.art];
  const luecken = d.quelle ? quellenLuecken(d.quelle, { chapter: 'x' }).filter((l) => l.feld !== 'abschnitt') : [];
  const feld = (k: keyof Omit<Quellenangabe, 'art'>) => (e: ChangeEvent<HTMLInputElement>) => { setGespeichert(false); setQ({ ...q, [k]: e.target.value || undefined }); };

  async function speichern(e: FormEvent) {
    e.preventDefault();
    const sauber = Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && String(v).trim() !== '')) as unknown as Quellenangabe;
    await db.documents.update(d.id, { quelle: sauber });
    setGespeichert(true);
  }

  return (
    <details ref={ref} className="card" open={offen} id={`quelle-${d.id}`}>
      <summary>Quellenangabe · {d.quelle ? QUELLENART_TEXT[d.quelle.art] : 'nicht angegeben'}{d.quelle && luecken.length ? ` · ${luecken.length} ${luecken.length === 1 ? 'Angabe fehlt' : 'Angaben fehlen'}` : ''}</summary>
      <p className="muted">Bei Expertenstandards, Recht, Arzneimitteln und Normwerten zeigt die App diese Angaben an jeder Aussage. So siehst du, ob eine Aussage aus dem DNQP-Standard, aus deiner Schule oder aus dem Hausstandard deiner Einrichtung kommt und wie aktuell sie ist.</p>
      <form onSubmit={speichern}>
        <label className="field">Art der Quelle
          <select value={q.art} onChange={(e) => { setGespeichert(false); setQ({ ...q, art: e.target.value as QuellenArt }); }}>
            {ARTEN.map((a) => <option key={a} value={a}>{QUELLENART_TEXT[a]}</option>)}
          </select>
        </label>
        <p className="field-hint">{QUELLENART_GELTUNG[q.art]}</p>
        <label className="field">Herausgeber<input value={q.herausgeber ?? ''} onChange={feld('herausgeber')} placeholder={bsp?.herausgeber ?? 'z. B. Verlag, Autorin, Schule'} /></label>
        <label className="field">Fassung oder Stand<input value={q.fassung ?? ''} onChange={feld('fassung')} placeholder={bsp?.fassung ?? 'z. B. 5. Auflage 2023'} /></label>
        <label className="field">Geltungsbereich<input value={q.geltungsbereich ?? ''} onChange={feld('geltungsbereich')} placeholder={bsp?.geltungsbereich ?? 'z. B. bundesweit, nur diese Station'} /></label>
        <label className="field">Zuletzt auf Aktualität geprüft am<input type="date" value={q.geprueftAm ?? ''} onChange={feld('geprueftAm')} /></label>
        <p className="field-hint">Älter als {PRUEFDATUM_HOECHSTENS_MONATE} Monate gilt als veraltet. Den Abschnitt liest die App aus der Belegstelle (Kapitel und Seite).</p>
        <div className="form-actions">
          <button type="submit" className="small">Quellenangabe speichern</button>
          <button type="button" className="link" onClick={() => setQ({ ...q, geprueftAm: new Date().toISOString().slice(0, 10) })}>heute geprüft</button>
          {gespeichert && <span role="status" className="muted">Gespeichert.</span>}
        </div>
      </form>
    </details>
  );
}
