import { useMemo, useState } from 'react';
import { db } from '../../../core/db';
import type { ID, SourceChunk, Summary } from '../../../core/types';
import { notify } from '../../../ui/shell/notifications';
import { navigate } from '../../../ui/shell/router';
import { formatDay } from '../../../ui/lib/time';
import { modulKarten, vorschlaege } from '../erzeugen';
import { abruf, istGefestigt, prognose, trefferquote } from '../planung';
import { loescheKarte, setzeAus, speichereConfig, speichereKarte, uebernehme } from '../store';
import { QUELLE_LABEL, type Karte, type KartenConfig, type Richtung } from '../typen';
import { alleThemen, blaetter, fachVon, modul, type KartenCtx } from './kontext';
import { Rueckseite } from './Sitzung';

async function sicher(fn: () => Promise<unknown>, ok: string, ctx: KartenCtx) {
  try { await fn(); notify('info', ok); await ctx.neuLaden(); } catch (e) { notify('critical', 'Nicht gespeichert', e instanceof Error ? e.message : String(e)); }
}

const RICHTUNGEN: { id: Richtung; label: string; hinweis: string }[] = [
  { id: 'vorwaerts', label: 'Begriff → Definition', hinweis: 'Begriff lesen, Definition im Kopf formulieren, aufdecken.' },
  { id: 'rueckwaerts', label: 'Definition → Begriff', hinweis: 'Fachbegriff eintippen, die App prüft die Schreibweise.' },
  { id: 'abkuerzung', label: 'Abkürzung → Bedeutung', hinweis: 'Nur Einträge mit Abkürzung.' },
];

const MODUS_LABEL: Record<Summary['mode'], string> = {
  originalgetreu: 'Originalgetreu', lernen: 'Lernmodus', arbeitsauftrag: 'Arbeitsauftrag', pruefung: 'Prüfungsfragen', vergleich: 'Vergleich',
};

// ---------------------------------------------------------------- Stapel

function Vorschlaege({ ctx, summary }: { ctx: KartenCtx; summary: Summary }) {
  const [karten, setKarten] = useState<Karte[] | null>(null);
  const [aus, setAus] = useState<Set<ID>>(new Set());
  const vorhanden = new Set(ctx.daten.gespeichert.filter((k) => k.ref === summary.id).map((k) => k.id));

  async function lade() {
    let chunks = new Map<ID, SourceChunk>();
    if (summary.mode === 'pruefung') {
      const cs = await db.chunks.where('documentId').anyOf(summary.sourceDocumentIds).toArray();
      chunks = new Map(cs.map((c) => [c.id, c]));
    }
    setKarten(vorschlaege(summary, chunks, fachVon));
  }
  const name = summary.topicIds.map((t) => alleThemen.get(t)?.name).filter(Boolean).join(', ') || ('pruefungName' in summary ? String(summary.pruefungName) : 'Zusammenfassung');
  const gewaehlt = karten?.filter((k) => !aus.has(k.id)) ?? [];

  return (
    <li className="karten__summary">
      <div className="karten__summary-kopf">
        <div>
          <strong>{name}</strong>
          <div className="muted">{MODUS_LABEL[summary.mode]} · {formatDay(summary.createdAt.slice(0, 10))}{vorhanden.size ? ` · ${vorhanden.size} Karten übernommen` : ''}{summary.needsReview ? ' · Quelle geändert, bitte prüfen' : ''}</div>
        </div>
        {!karten && <button type="button" className="small" onClick={lade}>Karten ansehen</button>}
      </div>
      {karten && !karten.length && <p className="muted">Daraus lassen sich keine Karten bauen (keine belegten Aussagen mit Überschrift).</p>}
      {karten && karten.length > 0 && (
        <>
          <ul className="karten__vorschlaege">
            {karten.map((k) => (
              <li key={k.id}>
                <label>
                  <input type="checkbox" checked={!aus.has(k.id)} onChange={() => setAus((s) => { const n = new Set(s); if (n.has(k.id)) n.delete(k.id); else n.add(k.id); return n; })} />
                  <span>
                    <span className="karte__vorne-klein">{k.vorne}</span>
                    {vorhanden.has(k.id) && <span className="muted"> · schon übernommen</span>}
                  </span>
                </label>
                <details><summary className="muted">Rückseite</summary><Rueckseite karte={k} titles={ctx.titles} /></details>
              </li>
            ))}
          </ul>
          <div className="row">
            <button type="button" className="primary small" disabled={!gewaehlt.length}
              onClick={() => sicher(() => uebernehme(gewaehlt, name), `${gewaehlt.length} Karten übernommen`, ctx).then(() => setKarten(null))}>
              {gewaehlt.length} {gewaehlt.length === 1 ? 'Karte' : 'Karten'} übernehmen
            </button>
            <button type="button" className="small ghost" onClick={() => setKarten(null)}>Schließen</button>
          </div>
        </>
      )}
    </li>
  );
}

export function Stapel({ ctx }: { ctx: KartenCtx }) {
  const { config } = ctx.daten;
  const [neue, setNeue] = useState(String(config.neueProTag));
  const [groesse, setGroesse] = useState(String(config.sitzungsGroesse));
  const proFach = useMemo(() => {
    const alle = modulKarten(modul, { ...config, faecher: [] });
    const m = new Map<ID, number>();
    for (const k of alle) for (const s of k.subjectIds) m.set(s, (m.get(s) ?? 0) + 1);
    return m;
  }, [config.richtungen, config.katalog, config.arzneimittel]);
  const setze = (patch: Partial<Omit<KartenConfig, 'id'>>) => sicher(() => speichereConfig(patch), 'Stapel gespeichert', ctx);
  const toggleFach = (id: ID) => {
    const aktiv = config.faecher.length ? config.faecher : [];
    void setze({ faecher: aktiv.includes(id) ? aktiv.filter((x) => x !== id) : [...aktiv, id] });
  };
  const toggleRichtung = (r: Richtung) => {
    const n = config.richtungen.includes(r) ? config.richtungen.filter((x) => x !== r) : [...config.richtungen, r];
    if (n.length) void setze({ richtungen: n });
  };
  const lernbar = ctx.summaries.filter((s) => s.mode !== 'vergleich');

  return (
    <div className="stack-2">
      <div className="card">
        <h3>Fächer aus dem Fachmodul</h3>
        <p className="muted">{ctx.daten.modul.length} Karten aus Glossar{config.katalog ? ', Themenkatalog' : ''}{config.arzneimittel ? ', Medikamenten-Steckbriefen' : ''} aktiv. Ohne Auswahl sind alle Fächer dabei.</p>
        <div className="pills" role="group" aria-label="Fächer">
          <button type="button" className="pill" aria-pressed={!config.faecher.length} onClick={() => setze({ faecher: [] })}>Alle Fächer</button>
          {modul.subjects.filter((s) => proFach.get(s.id)).map((s) => (
            <button key={s.id} type="button" className="pill" aria-pressed={config.faecher.includes(s.id)} onClick={() => toggleFach(s.id)}>
              {s.name} <span className="muted">{proFach.get(s.id)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Kartenarten</h3>
        <ul className="karten__optionen">
          {RICHTUNGEN.map((r) => (
            <li key={r.id}>
              <label><input type="checkbox" checked={config.richtungen.includes(r.id)} onChange={() => toggleRichtung(r.id)} /> {r.label}</label>
              <span className="muted">{r.hinweis}</span>
            </li>
          ))}
          <li>
            <label><input type="checkbox" checked={config.katalog} onChange={() => setze({ katalog: !config.katalog })} /> Themenkatalog</label>
            <span className="muted">Gesetze, Expertenstandards und Assessments, Aufgabenformate wie PESR oder SMART, Operatoren.</span>
          </li>
          <li>
            <label><input type="checkbox" checked={config.arzneimittel} onChange={() => setze({ arzneimittel: !config.arzneimittel })} /> Medikamenten-Steckbriefe</label>
            <span className="muted">{modul.drugProfiles?.length ?? 0} häufige Wirkstoffe: Gruppe und Wirkung, Anwendung, Nebenwirkungen, Pflegerelevanz, Antidot, Handelsname. Mit Quellenangabe.</span>
          </li>
        </ul>
      </div>

      <div className="card">
        <h3>Tempo</h3>
        <form className="karten__tempo" onSubmit={(e) => { e.preventDefault(); const n = Math.round(Number(neue)); const g = Math.round(Number(groesse)); if (n >= 0 && g >= 5) void setze({ neueProTag: n, sitzungsGroesse: g }); }}>
          <label className="field">Neue Karten pro Tag<input inputMode="numeric" value={neue} onChange={(e) => setNeue(e.target.value)} size={4} /></label>
          <label className="field">Karten pro Sitzung höchstens<input inputMode="numeric" value={groesse} onChange={(e) => setGroesse(e.target.value)} size={4} /></label>
          <label className="field">Ziel beim Wiederholen
            <select value={config.retention} onChange={(e) => setze({ retention: Number(e.target.value) })}>
              <option value={0.85}>85 % gewusst (weniger Wiederholungen)</option>
              <option value={0.9}>90 % gewusst (empfohlen)</option>
              <option value={0.95}>95 % gewusst (vor der Prüfung)</option>
            </select>
          </label>
          <button type="submit" className="small">Übernehmen</button>
        </form>
        <p className="muted">Faustregel: jede neue Karte bringt in den nächsten Wochen etwa fünf bis zehn Wiederholungen mit. 15 neue pro Tag sind gut 15 bis 20 Minuten täglich.</p>
      </div>

      <div className="card">
        <h3>Aus deinen Zusammenfassungen</h3>
        {lernbar.length ? (
          <>
            <p className="muted">Jeder Abschnitt wird eine Karte, Definitionen eigene Karten, Prüfungsfragen mit Musterlösung. Nur belegte Aussagen, mit Seitenangabe auf der Rückseite.</p>
            <ul className="karten__summaries">{lernbar.map((s) => <Vorschlaege key={s.id} ctx={ctx} summary={s} />)}</ul>
          </>
        ) : (
          <p className="muted">Noch keine Zusammenfassung. <button type="button" className="link" onClick={() => navigate('/material/zusammenfassen')}>Zusammenfassen</button></p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Eigene Karten

function KartenForm({ ctx, karte, onDone }: { ctx: KartenCtx; karte?: Karte; onDone: () => void }) {
  const [vorne, setVorne] = useState(karte?.vorne ?? '');
  const [hinten, setHinten] = useState(karte?.hinten ?? karte?.liste?.join('\n') ?? '');
  const [thema, setThema] = useState(karte?.topicIds[0] ?? '');
  const ok = vorne.trim() && hinten.trim();
  function speichern(e: React.FormEvent) {
    e.preventDefault();
    if (!ok) return;
    const topicIds = thema ? [thema] : [];
    const liste = karte?.liste && !karte.hinten ? hinten.split('\n').map((x) => x.trim()).filter(Boolean) : undefined;
    const k: Karte = karte
      ? { ...karte, vorne: vorne.trim(), hinten: liste ? '' : hinten.trim(), liste, topicIds, subjectIds: fachVon(topicIds) }
      : { id: `eigen:${crypto.randomUUID()}`, quelle: 'eigen', art: 'Eigene Karte', vorne: vorne.trim(), hinten: hinten.trim(), topicIds, subjectIds: fachVon(topicIds) };
    void sicher(() => speichereKarte(k), karte ? 'Karte geändert' : 'Karte angelegt', ctx).then(() => {
      if (karte) onDone(); else { setVorne(''); setHinten(''); }
    });
  }
  return (
    <form className="karten__form" onSubmit={speichern}>
      <label className="field">Vorderseite (Frage)<textarea rows={2} value={vorne} onChange={(e) => setVorne(e.target.value)} placeholder="z. B. Nenne vier Dekubitus-Prädilektionsstellen in Rückenlage." /></label>
      <label className="field">Rückseite (Antwort)<textarea rows={3} value={hinten} onChange={(e) => setHinten(e.target.value)} placeholder="z. B. Hinterkopf, Schulterblätter, Kreuzbein, Fersen" /></label>
      <label className="field">Thema (für den Lernplan)
        <select value={thema} onChange={(e) => setThema(e.target.value)}>
          <option value="">ohne Thema</option>
          {modul.subjects.map((s) => {
            const ts = [...blaetter.values()].filter((t) => t.subjectId === s.id);
            return ts.length ? <optgroup key={s.id} label={s.name}>{ts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup> : null;
          })}
        </select>
      </label>
      <div className="row">
        <button type="submit" className="primary small" disabled={!ok}>{karte ? 'Speichern' : 'Karte anlegen'}</button>
        {karte && <button type="button" className="small ghost" onClick={onDone}>Abbrechen</button>}
      </div>
    </form>
  );
}

export function Eigene({ ctx }: { ctx: KartenCtx }) {
  const [suche, setSuche] = useState('');
  const [bearbeite, setBearbeite] = useState<ID | null>(null);
  const q = suche.trim().toLowerCase();
  const liste = ctx.daten.gespeichert
    .filter((k) => !q || `${k.vorne} ${k.hinten} ${(k.liste ?? []).join(' ')}`.toLowerCase().includes(q))
    .sort((a, b) => (b.geaendert ?? '').localeCompare(a.geaendert ?? ''));
  return (
    <div className="stack-2">
      <div className="card">
        <h3>Neue Karte</h3>
        <KartenForm ctx={ctx} onDone={() => undefined} />
      </div>
      <div className="card">
        <div className="karten__liste-kopf">
          <h3>Gespeicherte Karten ({ctx.daten.gespeichert.length})</h3>
          <input type="search" placeholder="Suchen" value={suche} onChange={(e) => setSuche(e.target.value)} aria-label="Karten suchen" />
        </div>
        {!liste.length && <p className="muted">{q ? 'Nichts gefunden.' : 'Noch keine eigenen oder übernommenen Karten.'}</p>}
        <ul className="karten__eigene">
          {liste.map((k) => (
            <li key={k.id}>
              {bearbeite === k.id ? <KartenForm ctx={ctx} karte={k} onDone={() => setBearbeite(null)} /> : (
                <>
                  <div className="karte__vorne-klein">{k.vorne}</div>
                  <div className="muted">{QUELLE_LABEL[k.quelle]}{k.topicIds[0] ? ` · ${alleThemen.get(k.topicIds[0])?.name ?? ''}` : ''}{ctx.daten.staende.get(k.id)?.reps ? ` · nächste Abfrage ${formatDay(ctx.daten.staende.get(k.id)!.due)}` : ' · neu'}</div>
                  <div className="row">
                    <button type="button" className="small" onClick={() => setBearbeite(k.id)}>Bearbeiten</button>
                    <button type="button" className="small ghost" onClick={() => { if (confirm('Karte und ihren Lernstand löschen?')) void sicher(() => loescheKarte(k.id), 'Karte gelöscht', ctx); }}>Löschen</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Statistik

export function Statistik({ ctx }: { ctx: KartenCtx }) {
  const { daten, heute } = ctx;
  const nachId = new Map(daten.alle.map((k) => [k.id, k]));
  const staende = [...daten.staende.values()].filter((s) => nachId.has(s.cardId));
  const gelernt = staende.filter((s) => s.reps > 0 && !s.ausgesetzt);
  const gefestigt = gelernt.filter(istGefestigt);
  const ausgesetzt = staende.filter((s) => s.ausgesetzt);
  const seit30 = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const quote = trefferquote(daten.logs.filter((l) => l.date >= seit30));
  const woche = prognose(gelernt, heute, 7);
  const maxWoche = Math.max(1, ...woche.map((x) => x.anzahl));
  const schwer = gelernt.filter((s) => s.lapses > 0).sort((a, b) => b.lapses - a.lapses || abruf(a, heute) - abruf(b, heute)).slice(0, 10);
  const lernTage = new Set(daten.logs.map((l) => l.date));
  let serie = 0;
  for (let d = new Date(`${heute}T12:00:00Z`); lernTage.has(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() - 1)) serie++;

  const proFach = modul.subjects.map((s) => {
    const ks = daten.alle.filter((k) => k.subjectIds.includes(s.id));
    return { s, gesamt: ks.length, gelernt: ks.filter((k) => daten.staende.get(k.id)?.reps).length, fest: ks.filter((k) => { const st = daten.staende.get(k.id); return st && istGefestigt(st); }).length };
  }).filter((x) => x.gesamt);

  return (
    <div className="stack-2">
      <div className="card karten__zahlen karten__zahlen--4">
        <div><strong>{gelernt.length}</strong><span className="muted">von {daten.alle.length} gelernt</span></div>
        <div><strong>{gefestigt.length}</strong><span className="muted">gefestigt (≥ 3 Wochen)</span></div>
        <div><strong>{quote === null ? '–' : `${Math.round(quote * 100)} %`}</strong><span className="muted">gewusst, 30 Tage</span></div>
        <div><strong>{serie}</strong><span className="muted">{serie === 1 ? 'Tag' : 'Tage'} in Folge</span></div>
      </div>

      <div className="card">
        <h3>Fällig in den nächsten 7 Tagen</h3>
        <ol className="karten__prognose">
          {woche.map((d, i) => (
            <li key={d.date}>
              <span className="muted">{i === 0 ? 'heute' : formatDay(d.date)}</span>
              <span className="karten__balken"><span style={{ width: `${(d.anzahl / maxWoche) * 100}%` }} /></span>
              <span>{d.anzahl}</span>
            </li>
          ))}
        </ol>
      </div>

      {proFach.length > 0 && (
        <div className="card">
          <h3>Je Fach</h3>
          <ul className="karten__faecher">
            {proFach.map(({ s, gesamt, gelernt: g, fest }) => (
              <li key={s.id}>
                <span>{s.name}</span>
                <span className="karten__balken karten__balken--doppelt" role="img" aria-label={`${g} von ${gesamt} gelernt, ${fest} gefestigt`}>
                  <span style={{ width: `${(g / gesamt) * 100}%` }} /><span style={{ width: `${(fest / gesamt) * 100}%` }} />
                </span>
                <span className="muted">{g}/{gesamt}</span>
              </li>
            ))}
          </ul>
          <p className="muted">Hell: gelernt, kräftig: gefestigt. Gefestigte Karten sagen etwas über Begriffe, nicht über ein ganzes Thema; das zeigt der Lernplan.</p>
        </div>
      )}

      {schwer.length > 0 && (
        <div className="card">
          <h3>Hartnäckige Karten</h3>
          <p className="muted">Oft vergessen. Hilft eine Eselsbrücke? Oder die Karte in kleinere aufteilen.</p>
          <ul className="karten__eigene">
            {schwer.map((s) => {
              const k = nachId.get(s.cardId)!;
              return (
                <li key={s.cardId}>
                  <div className="karte__vorne-klein">{k.vorne}</div>
                  <div className="muted">{s.lapses}× vergessen · nächste Abfrage {formatDay(s.due)}</div>
                  <details><summary className="muted">Rückseite</summary><Rueckseite karte={k} titles={ctx.titles} /></details>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {ausgesetzt.length > 0 && (
        <div className="card">
          <h3>Ausgesetzt ({ausgesetzt.length})</h3>
          <ul className="karten__eigene">
            {ausgesetzt.map((s) => (
              <li key={s.cardId} className="karten__ausgesetzt">
                <span className="karte__vorne-klein">{nachId.get(s.cardId)!.vorne}</span>
                <button type="button" className="small" onClick={() => sicher(() => setzeAus(s.cardId, false), 'Karte wieder aufgenommen', ctx)}>Wieder aufnehmen</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
