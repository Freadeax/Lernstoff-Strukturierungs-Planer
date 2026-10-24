// Bestätigung der erkannten Aufgaben (Schritt [2] → [3]): Nummer, Wortlaut, geforderte Anzahl und Format korrigieren.
import type { CatalogModule } from '../../../modules/catalog-types';
import type { Aufgabe } from '../typen';

export function AufgabenEditor({ aufgaben, onChange, modul }: { aufgaben: Aufgabe[]; onChange: (a: Aufgabe[]) => void; modul: CatalogModule }) {
  const setze = (i: number, teil: Partial<Aufgabe>) => onChange(aufgaben.map((a, k) => (k === i ? { ...a, ...teil } : a)));
  return (
    <div className="aufgaben">
      {aufgaben.map((a, i) => (
        <div key={i} className={`aufgabe ${a.unsicher ? 'unsicher' : ''}`}>
          <div className="row">
            <label className="aufgabe__nr">Nr. <input value={a.nr} onChange={(e) => setze(i, { nr: e.target.value })} size={3} /></label>
            <label>Anzahl <input type="number" min={1} value={a.geforderteAnzahl ?? ''} placeholder="–" style={{ width: '4.5em' }}
              onChange={(e) => setze(i, { geforderteAnzahl: e.target.value ? Math.max(1, Number(e.target.value)) : undefined })} /></label>
            <select value={a.aufgabenformatId ?? ''} onChange={(e) => setze(i, { aufgabenformatId: e.target.value || undefined })} aria-label="Aufgabenformat">
              <option value="">kein Format</option>
              {modul.taskFormats.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <button className="small ghost" onClick={() => onChange(aufgaben.filter((_, k) => k !== i))} aria-label={`Aufgabe ${a.nr} entfernen`}>Entfernen</button>
          </div>
          <textarea className="wide" rows={2} value={a.wortlaut} onChange={(e) => setze(i, { wortlaut: e.target.value, unsicher: false })} aria-label={`Wortlaut Aufgabe ${a.nr}`} />
          <div className="muted">
            {a.operatoren.length ? `Operator: ${a.operatoren.join(', ')}` : 'Kein Operator erkannt'}
            {a.bestandteile.length ? ` · ${a.bestandteile.join(', ')}` : ''}
            {a.quellenvorgabe ? ` · Quelle: ${a.quellenvorgabe}` : ''}
          </div>
          {a.unsicher && <div className="note warn">Unsicher gelesen{a.unsicherGrund ? `: ${a.unsicherGrund}` : ''}. Bitte den Wortlaut prüfen.</div>}
        </div>
      ))}
      <button className="small" onClick={() => onChange([...aufgaben, { nr: String(aufgaben.length + 1), wortlaut: '', operatoren: [], bestandteile: [], unsicher: false }])}>Aufgabe hinzufügen</button>
    </div>
  );
}
