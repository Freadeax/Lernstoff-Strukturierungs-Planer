import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './mindmap.css';
import { logActivity } from '../../core/activity';
import { pflegeModule } from '../../modules/pflege';
import { Icon } from '../../ui/icons';
import { notify } from '../../ui/shell/notifications';
import { navigate, useRoute } from '../../ui/shell/router';
import { relativeTime } from '../../ui/lib/time';
import { usePanZoom } from '../landkarte/usePanZoom';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';
import {
  alleKnoten, alsSvg, alsText, anzahl, ausruecken, ausText, ausVorlage, einruecken, entfernen, erinnern, geschwisterAnhaengen,
  kantenPfad, kindAnhaengen, ladeAlle, layout, MIN_FUER_LERNPLAN, neueMindmap, passt, speichereAlle, umbenennen, verschieben,
  VORLAGEN, vorschlaege, waehleLuecken, zeilen, knoten as neuerKnoten,
  type Erinnerung, type Knoten, type Luecke, type Mindmap, type MindmapLayout, type VorlageId,
} from './modell';

const modul = pflegeModule;
const themen = new Map(modul.topics.map((t) => [t.id, t]));
const themaName = (id?: string) => (id ? themen.get(id)?.name : undefined);

type Markierung = 'ok' | 'falsch' | 'luecke' | 'verpasst';

// ---------------------------------------------------------------- Karte (SVG mit Zoom)

function Karte({ l, auswahl, onSelect, markierung, verdeckt, hoehe = 'normal' }: {
  l: MindmapLayout;
  auswahl?: string;
  onSelect?: (id: string) => void;
  markierung?: Map<string, Markierung>;
  verdeckt?: Map<string, string>;   // Knoten-ID → angezeigter Platzhalter
  hoehe?: 'normal' | 'klein';
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const pz = usePanZoom(viewport, world, { w: l.breite, h: l.hoehe });
  const groesse = `${Math.round(l.breite / 40)}x${Math.round(l.hoehe / 40)}`;
  // Beim ersten Zeichnen und wenn die Karte deutlich wächst: einpassen
  useEffect(() => { pz.fit(false); }, [groesse]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`mm__rahmen mm__rahmen--${hoehe}`}>
      <div ref={viewport} className="mm__viewport" tabIndex={0} onKeyDown={pz.onKeyDown}
        role="group" aria-roledescription="Mindmap" aria-label="Mindmap. Pfeiltasten verschieben, Plus und Minus zoomen, 0 passt ein. Bearbeiten in der Gliederung.">
        <div ref={world} className="mm__welt" style={{ width: l.breite, height: l.hoehe }}>
          <svg width={l.breite} height={l.hoehe} viewBox={`0 0 ${l.breite} ${l.hoehe}`} aria-hidden="true">
            {l.kanten.map((k) => (
              <path key={k.nach.k.id} d={kantenPfad(k.von, k.nach)} className={`mm__kante mm__ast--${k.nach.ast % 8} mm__kante--t${Math.min(k.nach.tiefe, 2)}`} />
            ))}
            {l.knoten.map((n) => {
              const platz = verdeckt?.get(n.k.id);
              const zeilen = platz !== undefined ? [platz] : n.zeilen;
              const m = markierung?.get(n.k.id);
              const fs = n.tiefe === 0 ? 17 : n.tiefe === 1 ? 14.5 : 13;
              const zh = fs * 1.35;
              const y0 = n.y - ((zeilen.length - 1) * zh) / 2;
              return (
                <g key={n.k.id}
                  className={`mm__knoten karte__node mm__knoten--t${Math.min(n.tiefe, 2)} ${n.ast >= 0 ? `mm__ast--${n.ast % 8}` : ''}${auswahl === n.k.id ? ' is-auswahl' : ''}${m ? ` is-${m}` : ''}`}
                  onClick={onSelect ? () => onSelect(n.k.id) : undefined}>
                  <rect x={n.x - n.w / 2} y={n.y - n.h / 2} width={n.w} height={n.h} rx={n.tiefe === 0 ? 14 : 8} />
                  <text textAnchor="middle" dominantBaseline="central" fontSize={fs}>
                    {zeilen.map((z, i) => <tspan key={i} x={n.x} y={y0 + i * zh}>{z || ' '}</tspan>)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <div className="mm__zoom" role="group" aria-label="Zoom">
        <button type="button" className="icon ghost small" onClick={() => pz.zoomBy(1.25)} disabled={pz.zoom >= pz.maxZoom} aria-label="Hineinzoomen"><Icon name="plus" /></button>
        <button type="button" className="icon ghost small" onClick={() => pz.zoomBy(0.8)} disabled={pz.zoom <= pz.minZoom} aria-label="Herauszoomen"><Icon name="minus" /></button>
        <button type="button" className="icon ghost small" onClick={() => pz.fit()} aria-label="Ganze Mindmap zeigen"><Icon name="maximize" /></button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Liste und Anlegen

function ThemaAuswahl({ wert, onChange, id }: { wert: string; onChange: (id: string) => void; id?: string }) {
  return (
    <select id={id} value={wert} onChange={(e) => onChange(e.target.value)}>
      <option value="">Ohne Thema</option>
      {modul.subjects.map((s) => {
        const liste = modul.topics.filter((t) => t.subjectId === s.id).sort((a, b) => a.name.localeCompare(b.name, 'de'));
        return liste.length ? (
          <optgroup key={s.id} label={s.name}>
            {liste.map((t) => <option key={t.id} value={t.id}>{t.parentId ? t.name : `${t.name} (Überblick)`}</option>)}
          </optgroup>
        ) : null;
      })}
    </select>
  );
}

function Anlegen({ startThema, onAnlegen }: { startThema: string; onAnlegen: (m: Mindmap) => void }) {
  const [thema, setThema] = useState(startThema);
  const [titel, setTitel] = useState(themaName(startThema) ?? '');
  const [vorlage, setVorlage] = useState<VorlageId>(startThema ? 'katalog' : 'leer');
  const [art, setArt] = useState<'vorlage' | 'text'>('vorlage');
  const [text, setText] = useState('');

  function waehleThema(id: string) {
    // Titel folgt dem Thema, solange er nicht selbst geändert wurde
    if (!titel.trim() || titel === themaName(thema)) setTitel(themaName(id) ?? '');
    setThema(id);
    if (!id && vorlage === 'katalog') setVorlage('leer');
  }

  function anlegen() {
    const t = titel.trim() || themaName(thema) || 'Neue Mindmap';
    const wurzel = art === 'text' ? ausText(text, t) : ausVorlage(vorlage, t, modul, thema || undefined);
    if (!wurzel) { notify('warning', 'Kein Text gefunden', 'Eine Zeile je Begriff, Unterpunkte eingerückt.'); return; }
    onAnlegen(neueMindmap(wurzel, thema || undefined));
  }

  return (
    <form className="card mm__neu" onSubmit={(e) => { e.preventDefault(); anlegen(); }}>
      <h3>Neue Mindmap</h3>
      <div className="mm__neu-felder">
        <label className="field"><span className="muted">Thema aus dem Katalog (optional)</span><ThemaAuswahl wert={thema} onChange={waehleThema} /></label>
        <label className="field"><span className="muted">Titel (Mitte der Mindmap)</span><input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="z. B. Herzinsuffizienz" /></label>
      </div>
      <div className="pills" role="group" aria-label="Start">
        <button type="button" className="pill" aria-pressed={art === 'vorlage'} onClick={() => setArt('vorlage')}>Mit Vorlage</button>
        <button type="button" className="pill" aria-pressed={art === 'text'} onClick={() => setArt('text')}>Aus Text (Notizen)</button>
      </div>
      {art === 'vorlage' ? (
        <div className="mm__vorlagen" role="radiogroup" aria-label="Vorlage">
          {VORLAGEN.map((v) => (
            <label key={v.id} className={`mm__vorlage${vorlage === v.id ? ' is-aktiv' : ''}${v.id === 'katalog' && !thema ? ' is-aus' : ''}`}>
              <input type="radio" name="vorlage" value={v.id} checked={vorlage === v.id} disabled={v.id === 'katalog' && !thema} onChange={() => setVorlage(v.id)} />
              <strong>{v.label}</strong>
              <span className="muted">{v.id === 'katalog' && !thema ? 'Erst ein Thema wählen.' : v.text}</span>
            </label>
          ))}
        </div>
      ) : (
        <label className="field">
          <span className="muted">Eine Zeile je Begriff, Unterpunkte mit Leerzeichen oder „-“ einrücken. Funktioniert mit Listen aus der Notizen-App.</span>
          <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Herzinsuffizienz\n  Symptome\n    Atemnot\n    Ödeme\n  Therapie'} />
        </label>
      )}
      <div className="row"><span /><button type="submit" className="primary">Mindmap anlegen</button></div>
    </form>
  );
}

function Liste({ maps, startThema, onAnlegen, onLoeschen }: { maps: Mindmap[]; startThema: string; onAnlegen: (m: Mindmap) => void; onLoeschen: (m: Mindmap) => void }) {
  const sortiert = [...maps].sort((a, b) => b.geaendert.localeCompare(a.geaendert));
  return (
    <>
      <Anlegen key={startThema} startThema={startThema} onAnlegen={onAnlegen} />
      {sortiert.length > 0 && (
        <div className="mm__liste">
          {sortiert.map((m) => {
            const n = anzahl(m.wurzel) - 1;
            return (
              <article key={m.id} className="card mm__eintrag">
                <button type="button" className="mm__eintrag-titel link" onClick={() => navigate(`/lernen/mindmap?id=${m.id}`)}>{m.wurzel.text || 'Ohne Titel'}</button>
                <p className="muted">{n} {n === 1 ? 'Begriff' : 'Begriffe'}{m.topicId ? ` · ${themaName(m.topicId) ?? 'Thema'}` : ''} · geändert {relativeTime(m.geaendert)}</p>
                <div className="row">
                  <button type="button" className="small" onClick={() => navigate(`/lernen/mindmap?id=${m.id}`)}>Bearbeiten</button>
                  <button type="button" className="small" disabled={n < 1} onClick={() => navigate(`/lernen/mindmap?id=${m.id}&modus=luecken`)}>Lücken füllen</button>
                  <button type="button" className="small" disabled={n < 1} onClick={() => navigate(`/lernen/mindmap?id=${m.id}&modus=erinnern`)}>Aus dem Gedächtnis</button>
                  <button type="button" className="small ghost" onClick={() => onLoeschen(m)} aria-label={`${m.wurzel.text} löschen`}><Icon name="trash" /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Bearbeiten

function Gliederung({ w, auswahl, fokus, onSelect, onChange, onFokusErledigt }: {
  w: Knoten; auswahl: string; fokus?: string;
  onSelect: (id: string) => void;
  onChange: (w: Knoten, fokus?: string) => void;
  onFokusErledigt: () => void;
}) {
  const liste = useRef<HTMLOListElement>(null);
  const z = zeilen(w);

  useEffect(() => {
    if (!fokus) return;
    const el = liste.current?.querySelector<HTMLInputElement>(`input[data-id="${fokus}"]`);
    if (el) { el.focus(); el.select(); }
    onFokusErledigt();
  }, [fokus, onFokusErledigt]);

  useEffect(() => {
    liste.current?.querySelector(`[data-zeile="${auswahl}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [auswahl]);

  function taste(e: React.KeyboardEvent<HTMLInputElement>, k: Knoten, i: number) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const r = k.id === w.id ? kindAnhaengen(w, k.id) : geschwisterAnhaengen(w, k.id);
      onChange(r.w, r.neu.id);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onChange(e.shiftKey ? ausruecken(w, k.id) : einruecken(w, k.id), k.id);
    } else if (e.key === 'Backspace' && !k.text && k.id !== w.id) {
      e.preventDefault();
      const vor = z[i - 1]?.k.id;
      onChange(entfernen(w, k.id), vor);
    } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      onChange(verschieben(w, k.id, e.key === 'ArrowUp' ? -1 : 1), k.id);
    } else if (!e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      const ziel = z[i + (e.key === 'ArrowUp' ? -1 : 1)];
      if (ziel) { e.preventDefault(); onChange(w, ziel.k.id); }
    }
  }

  return (
    <ol ref={liste} className="mm__gliederung" aria-label="Gliederung der Mindmap">
      {z.map((x, i) => (
        <li key={x.k.id} data-zeile={x.k.id} className={`mm__zeile${auswahl === x.k.id ? ' is-auswahl' : ''}`} style={{ '--tiefe': x.tiefe } as React.CSSProperties}>
          <span className={`mm__punkt ${x.ast >= 0 ? `mm__ast--${x.ast % 8}` : 'mm__punkt--wurzel'}`} aria-hidden="true" />
          <input data-id={x.k.id} value={x.k.text} aria-label={x.tiefe === 0 ? 'Thema in der Mitte' : `Ebene ${x.tiefe}`}
            placeholder={x.tiefe === 0 ? 'Thema' : 'Begriff'} enterKeyHint="next"
            onFocus={() => onSelect(x.k.id)}
            onChange={(e) => onChange(umbenennen(w, x.k.id, e.target.value))}
            onKeyDown={(e) => taste(e, x.k, i)} />
        </li>
      ))}
    </ol>
  );
}

function Werkzeuge({ w, auswahl, onChange }: { w: Knoten; auswahl: string; onChange: (w: Knoten, fokus?: string) => void }) {
  const istWurzel = auswahl === w.id;
  const zeile = zeilen(w).find((z) => z.k.id === auswahl);
  return (
    <div className="mm__werkzeuge" role="toolbar" aria-label="Ausgewählten Begriff bearbeiten">
      <button type="button" className="small" onClick={() => { const r = kindAnhaengen(w, auswahl); onChange(r.w, r.neu.id); }}><Icon name="plus" /> Unterpunkt</button>
      <button type="button" className="small" disabled={istWurzel} onClick={() => { const r = geschwisterAnhaengen(w, auswahl); onChange(r.w, r.neu.id); }}><Icon name="plus" /> Daneben</button>
      <button type="button" className="small icon" disabled={istWurzel || (zeile?.tiefe ?? 0) < 2} onClick={() => onChange(ausruecken(w, auswahl), auswahl)} aria-label="Ausrücken (eine Ebene höher)"><Icon name="chevronLeft" /></button>
      <button type="button" className="small icon" disabled={istWurzel} onClick={() => onChange(einruecken(w, auswahl), auswahl)} aria-label="Einrücken (unter den Begriff darüber)"><Icon name="chevronRight" /></button>
      <button type="button" className="small icon" disabled={istWurzel} onClick={() => onChange(verschieben(w, auswahl, -1), auswahl)} aria-label="Nach oben"><span aria-hidden="true">↑</span></button>
      <button type="button" className="small icon" disabled={istWurzel} onClick={() => onChange(verschieben(w, auswahl, 1), auswahl)} aria-label="Nach unten"><span aria-hidden="true">↓</span></button>
      <button type="button" className="small icon ghost" disabled={istWurzel} onClick={() => {
        const z = zeilen(w); const i = z.findIndex((x) => x.k.id === auswahl);
        const n = alleKnoten(z[i]!.k).length - 1;
        if (n > 0 && !confirm(`„${z[i]!.k.text || 'Begriff'}“ mit ${n} Unterpunkten löschen?`)) return;
        onChange(entfernen(w, auswahl), z[i - 1]?.k.id);
      }} aria-label="Löschen"><Icon name="trash" /></button>
    </div>
  );
}

function speichereDatei(name: string, inhalt: string, typ: string) {
  const url = URL.createObjectURL(new Blob([inhalt], { type: typ }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const dateiname = (t: string) => (t.trim() || 'mindmap').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'mindmap';

function Bearbeiten({ m, onSpeichern }: { m: Mindmap; onSpeichern: (m: Mindmap) => void }) {
  const [auswahl, setAuswahl] = useState(m.wurzel.id);
  const [fokus, setFokus] = useState<string>();
  const l = useMemo(() => layout(m.wurzel), [m.wurzel]);
  const vorschlag = useMemo(() => (m.topicId ? vorschlaege(m.wurzel, modul, m.topicId).slice(0, 12) : []), [m.wurzel, m.topicId]);
  const [zeigeVorschlaege, setZeigeVorschlaege] = useState(false);
  const fokusErledigt = useCallback(() => setFokus(undefined), []);

  const aendern = (w: Knoten, f?: string) => {
    onSpeichern({ ...m, wurzel: w, geaendert: new Date().toISOString() });
    if (f) { setAuswahl(f); setFokus(f); }
    else if (!alleKnoten(w).some((k) => k.id === auswahl)) setAuswahl(w.id);
  };

  function uebernehmen(text: string) {
    const ziel = alleKnoten(m.wurzel).some((k) => k.id === auswahl) ? auswahl : m.wurzel.id;
    const r = kindAnhaengen(m.wurzel, ziel, neuerKnoten(text));
    onSpeichern({ ...m, wurzel: r.w, geaendert: new Date().toISOString() });
  }

  async function kopieren() {
    try { await navigator.clipboard.writeText(alsText(m.wurzel)); notify('info', 'Gliederung kopiert', 'Zum Beispiel in Notizen einfügen.'); }
    catch { notify('warning', 'Kopieren nicht möglich', 'Der Browser hat den Zugriff auf die Zwischenablage verweigert.'); }
  }

  const n = anzahl(m.wurzel) - 1;

  return (
    <>
      <div className="card mm__kopfzeile">
        <div className="mm__titelzeile">
          <button type="button" className="ghost small" onClick={() => navigate('/lernen/mindmap')}><Icon name="chevronLeft" /> Alle Mindmaps</button>
          <span className="muted">{n} {n === 1 ? 'Begriff' : 'Begriffe'} · gespeichert auf diesem Gerät</span>
        </div>
        <div className="row">
          <label className="field mm__thema"><span className="muted">Thema (für den Lernplan)</span>
            <ThemaAuswahl wert={m.topicId ?? ''} onChange={(id) => onSpeichern({ ...m, topicId: id || undefined, geaendert: new Date().toISOString() })} />
          </label>
          <div className="row mm__aktionen">
            <button type="button" disabled={n < 1} onClick={() => navigate(`/lernen/mindmap?id=${m.id}&modus=luecken`)}>Lücken füllen</button>
            <button type="button" disabled={n < 1} onClick={() => navigate(`/lernen/mindmap?id=${m.id}&modus=erinnern`)}>Aus dem Gedächtnis</button>
            <button type="button" className="ghost" onClick={() => speichereDatei(`${dateiname(m.wurzel.text)}.svg`, alsSvg(l), 'image/svg+xml')}>Als Bild (SVG)</button>
            <button type="button" className="ghost" onClick={kopieren}>Als Text kopieren</button>
          </div>
        </div>
      </div>

      <div className="mm__editor">
        <Karte l={l} auswahl={auswahl} onSelect={setAuswahl} />
        <div className="card mm__seite">
          <Werkzeuge w={m.wurzel} auswahl={auswahl} onChange={aendern} />
          <Gliederung w={m.wurzel} auswahl={auswahl} fokus={fokus} onSelect={setAuswahl} onChange={aendern} onFokusErledigt={fokusErledigt} />
          <p className="muted mm__tasten">Tastatur: Eingabe = neuer Begriff, Tab = einrücken, Umschalt+Tab = ausrücken, Alt+↑/↓ = verschieben.</p>
          {m.topicId && (
            <details className="mm__vorschlaege" open={zeigeVorschlaege} onToggle={(e) => setZeigeVorschlaege((e.target as HTMLDetailsElement).open)}>
              <summary>Abgleich mit dem Katalog {vorschlag.length ? `(${vorschlag.length} Vorschläge)` : '(alles drin)'}</summary>
              {vorschlag.length ? (
                <>
                  <p className="muted">Begriffe zum Thema, die noch fehlen. Tipp fügt sie unter dem ausgewählten Begriff ein. Erst selbst überlegen, dann nachsehen.</p>
                  <div className="mm__chips">
                    {vorschlag.map((v) => <button key={v} type="button" className="pill" onClick={() => uebernehmen(v)}><Icon name="plus" /> {v}</button>)}
                  </div>
                </>
              ) : <p className="muted">Alle Unterthemen und Glossarbegriffe zu diesem Thema stehen in deiner Mindmap.</p>}
            </details>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Üben

function Zurueck({ m }: { m: Mindmap }) {
  return (
    <div className="mm__titelzeile">
      <button type="button" className="ghost small" onClick={() => navigate(`/lernen/mindmap?id=${m.id}`)}><Icon name="chevronLeft" /> Zur Mindmap</button>
      <span className="muted">{m.topicId ? themaName(m.topicId) : 'Ohne Thema, zählt nicht im Lernplan'}</span>
    </div>
  );
}

function useLernplanFuer(m: Mindmap) {
  const lp = useLernplanUebernahme('mindmap');
  const melde = (prozent: number, abgefragt: number) => {
    if (m.topicId && abgefragt >= MIN_FUER_LERNPLAN) lp.uebernimm([{ topicId: m.topicId, scorePercent: prozent, anzahl: abgefragt }]);
  };
  const leerText = !m.topicId ? undefined : 'Zählt nicht im Lernplan: Das Thema ist ein Überblick (Oberthema). Für den Lernplan ein Unterthema verknüpfen.';
  return { ...lp, melde, leerText };
}

function LernplanZeile({ m, abgefragt, lp }: { m: Mindmap; abgefragt: number; lp: ReturnType<typeof useLernplanFuer> }) {
  if (!m.topicId) return <p className="muted">Mit einem Thema verknüpft, zählt diese Übung als Abfrage im Lernplan.</p>;
  if (abgefragt < MIN_FUER_LERNPLAN) return <p className="muted">Für den Lernplan zählt die Übung ab {MIN_FUER_LERNPLAN} abgefragten Begriffen.</p>;
  return <LernplanHinweis uebernahme={lp.uebernahme} fehler={lp.fehler} leer={lp.leerText} />;
}

function Luecken({ m }: { m: Mindmap }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const luecken = useMemo(() => waehleLuecken(m.wurzel, seed), [m.wurzel, seed]);
  const [antworten, setAntworten] = useState<Record<string, string>>({});
  const [geprueft, setGeprueft] = useState(false);
  const lp = useLernplanFuer(m);
  const l = useMemo(() => layout(m.wurzel), [m.wurzel]);
  const nummer = new Map(luecken.map((x, i) => [x.id, i + 1]));
  const richtig = (x: Luecke) => passt(antworten[x.id] ?? '', x.soll);
  const anzahlRichtig = luecken.filter(richtig).length;
  const prozent = luecken.length ? Math.round((anzahlRichtig / luecken.length) * 100) : 0;

  const verdeckt = new Map(geprueft ? [] : luecken.map((x) => [x.id, `${nummer.get(x.id)} ?`] as const));
  const markierung = new Map<string, Markierung>(luecken.map((x) => [x.id, geprueft ? (richtig(x) ? 'ok' : 'falsch') : 'luecke']));

  function pruefen() {
    setGeprueft(true);
    lp.melde(prozent, luecken.length);
    void logActivity({ kind: 'uebung', severity: prozent >= 80 ? 'info' : 'warning', title: `Mindmap „${m.wurzel.text}“: ${anzahlRichtig} von ${luecken.length} Lücken`, ref: m.topicId });
  }
  function neu() { setSeed((s) => s + 1); setAntworten({}); setGeprueft(false); lp.zuruecksetzen(); }

  return (
    <>
      <div className="card"><Zurueck m={m} /><h3>Lücken füllen: {m.wurzel.text}</h3><p className="muted">{luecken.length} Begriffe sind verdeckt. Schreib zu jeder Nummer den fehlenden Begriff. Kleine Tippfehler sind erlaubt.</p></div>
      <div className="mm__editor">
        <Karte l={l} verdeckt={verdeckt} markierung={markierung} />
        <form className="card mm__seite" onSubmit={(e) => { e.preventDefault(); if (!geprueft) pruefen(); }}>
          <ol className="mm__luecken">
            {luecken.map((x) => (
              <li key={x.id} className={geprueft ? (richtig(x) ? 'is-ok' : 'is-falsch') : ''}>
                <label>
                  <span className="mm__pfad"><span className="mm__nr">{nummer.get(x.id)}</span> {x.pfad.length > 1 ? `unter ${x.pfad.slice(1).join(' › ')}` : 'Hauptast'}</span>
                  <input value={antworten[x.id] ?? ''} disabled={geprueft} enterKeyHint="next" autoComplete="off" autoCapitalize="off"
                    onChange={(e) => setAntworten((a) => ({ ...a, [x.id]: e.target.value }))} />
                </label>
                {geprueft && !richtig(x) && <span className="mm__loesung">Richtig: <strong>{x.soll}</strong></span>}
              </li>
            ))}
          </ol>
          {!geprueft
            ? <div className="row"><span /><button type="submit" className="primary">Prüfen</button></div>
            : (
              <div aria-live="polite">
                <p className="mm__ergebnis"><strong>{anzahlRichtig} von {luecken.length}</strong> richtig ({prozent} %)</p>
                <LernplanZeile m={m} abgefragt={luecken.length} lp={lp} />
                <div className="row"><span /><button type="button" className="primary" onClick={neu}>Neue Lücken</button></div>
              </div>
            )}
        </form>
      </div>
    </>
  );
}

function Erinnern({ m }: { m: Mindmap }) {
  const [text, setText] = useState('');
  const [ergebnis, setErgebnis] = useState<Erinnerung | null>(null);
  const lp = useLernplanFuer(m);
  const soll = anzahl(m.wurzel) - 1;
  const nurWurzel = useMemo(() => layout(neuerKnoten(m.wurzel.text)), [m.wurzel.text]);
  const voll = useMemo(() => layout(m.wurzel), [m.wurzel]);
  const markierung = useMemo(() => {
    const x = new Map<string, Markierung>();
    if (ergebnis) { for (const k of ergebnis.getroffen) x.set(k.id, 'ok'); for (const k of ergebnis.verpasst) x.set(k.id, 'verpasst'); }
    return x;
  }, [ergebnis]);

  function pruefen() {
    const e = erinnern(m.wurzel, text);
    setErgebnis(e);
    lp.melde(e.prozent, soll);
    void logActivity({ kind: 'uebung', severity: e.prozent >= 70 ? 'info' : 'warning', title: `Mindmap „${m.wurzel.text}“ aus dem Gedächtnis: ${e.getroffen.length} von ${soll}`, ref: m.topicId });
  }
  function nochmal() { setText(''); setErgebnis(null); lp.zuruecksetzen(); }

  return (
    <>
      <div className="card"><Zurueck m={m} /><h3>Aus dem Gedächtnis: {m.wurzel.text}</h3>
        <p className="muted">Deine Mindmap hat {soll} Begriffe. Schreib alle auf, die dir einfallen, einen je Zeile (oder mit Komma getrennt). Danach siehst du, was gefehlt hat.</p>
      </div>
      <div className="mm__editor">
        <Karte l={ergebnis ? voll : nurWurzel} markierung={markierung} hoehe={ergebnis ? 'normal' : 'klein'} />
        <form className="card mm__seite" onSubmit={(e) => { e.preventDefault(); pruefen(); }}>
          {!ergebnis ? (
            <>
              <label className="field"><span className="muted">Deine Begriffe</span>
                <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} autoCapitalize="sentences" placeholder={'Begriff\nnoch ein Begriff\n…'} />
              </label>
              <div className="row"><span className="muted">{text.split(/[\n,;]+/).filter((x) => x.trim()).length} eingegeben</span><button type="submit" className="primary" disabled={!text.trim()}>Prüfen</button></div>
            </>
          ) : (
            <div aria-live="polite">
              <p className="mm__ergebnis"><strong>{ergebnis.getroffen.length} von {soll}</strong> Begriffen erinnert ({ergebnis.prozent} %)</p>
              {ergebnis.verpasst.length > 0 && <div className="note warn"><strong>Gefehlt</strong><ul>{ergebnis.verpasst.map((k) => <li key={k.id}>{k.text}</li>)}</ul></div>}
              {ergebnis.falsch.length > 0 && <div className="note"><strong>Nicht in deiner Mindmap</strong><p className="muted">Vielleicht anders geschrieben oder eine gute Ergänzung?</p><ul>{ergebnis.falsch.map((t, i) => <li key={i}>{t}</li>)}</ul></div>}
              <LernplanZeile m={m} abgefragt={soll} lp={lp} />
              <div className="row"><button type="button" className="ghost" onClick={() => navigate(`/lernen/mindmap?id=${m.id}`)}>Mindmap ergänzen</button><button type="button" className="primary" onClick={nochmal}>Noch einmal</button></div>
            </div>
          )}
        </form>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Seite

export default function Mindmaps() {
  const { params } = useRoute();
  const id = params.get('id') ?? '';
  const modus = params.get('modus') ?? '';
  const thema = params.get('thema') ?? '';
  const [maps, setMaps] = useState<Mindmap[]>(ladeAlle);
  const warnung = useRef(false);

  // Sprung aus dem Lernplan: vorhandene Mindmap zum Thema öffnen, sonst Anlegen mit dem Thema
  useEffect(() => {
    if (!thema || id) return;
    const vorhanden = maps.filter((m) => m.topicId === thema).sort((a, b) => b.geaendert.localeCompare(a.geaendert))[0];
    if (vorhanden) navigate(`/lernen/mindmap?id=${vorhanden.id}&modus=erinnern`);
  }, [thema, id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Speichern leicht verzögert, damit Tippen flüssig bleibt
  useEffect(() => {
    const t = setTimeout(() => {
      if (!speichereAlle(maps) && !warnung.current) {
        warnung.current = true;
        notify('warning', 'Mindmaps nicht gespeichert', 'Der Speicher dieses Browsers ist voll oder gesperrt (privates Surfen?).');
      }
    }, 300);
    return () => clearTimeout(t);
  }, [maps]);
  // Beim Verlassen sofort sichern
  const aktuell = useRef(maps);
  aktuell.current = maps;
  useEffect(() => () => { speichereAlle(aktuell.current); }, []);

  const m = maps.find((x) => x.id === id);
  const speichern = useCallback((neu: Mindmap) => setMaps((alle) => alle.map((x) => (x.id === neu.id ? neu : x))), []);

  function anlegen(neu: Mindmap) {
    setMaps((alle) => [...alle, neu]);
    speichereAlle([...maps, neu]);
    void logActivity({ kind: 'uebung', severity: 'info', title: `Mindmap „${neu.wurzel.text}“ angelegt`, ref: neu.topicId });
    navigate(`/lernen/mindmap?id=${neu.id}`);
  }
  function loeschen(x: Mindmap) {
    if (!confirm(`Mindmap „${x.wurzel.text}“ löschen? Das lässt sich nicht rückgängig machen.`)) return;
    setMaps((alle) => alle.filter((y) => y.id !== x.id));
  }

  return (
    <section className="page mm">
      <div className="page__head">
        <h2>Mindmaps</h2>
        <p className="muted">Wissen als Mindmap ordnen, dann abrufen: Lücken füllen oder alles aus dem Gedächtnis aufschreiben. Mit einem Thema verknüpft, zählt das Abrufen im Lernplan.</p>
      </div>
      {id && !m ? (
        <div className="card">
          <p>Diese Mindmap gibt es auf diesem Gerät nicht (mehr).</p>
          <button type="button" className="primary" onClick={() => navigate('/lernen/mindmap')}>Zu allen Mindmaps</button>
        </div>
      ) : m ? (
        modus === 'luecken' && anzahl(m.wurzel) > 1 ? <Luecken key={m.id} m={m} />
          : modus === 'erinnern' && anzahl(m.wurzel) > 1 ? <Erinnern key={m.id} m={m} />
            : <Bearbeiten key={m.id} m={m} onSpeichern={speichern} />
      ) : (
        <Liste maps={maps} startThema={themen.has(thema) ? thema : ''} onAnlegen={anlegen} onLoeschen={loeschen} />
      )}
    </section>
  );
}
