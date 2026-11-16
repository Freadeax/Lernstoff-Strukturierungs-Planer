import './physiologie.css';
import { useState, type ReactNode } from 'react';
import { PageHeading } from '../../ui/PageHeading';
import { navigate, useRoute } from '../../ui/shell/router';
import {
  AUFTRAEGE, BEFUND_LABEL, blutzucker, DAUER_MIN, haut, herz, KAPILLARDRUCK, KATEGORIE_TEXT, LAGE_LABEL, lunge, REGIONEN, SCHRITT_MIN,
  START, STOFFWECHSEL_LABEL, type Befund, type Lage, type ModellId, type Region, type Stoffwechsel, type Zustand,
} from './modelle';

const MODELLE: Array<{ id: ModellId; label: string; thema: string; themaName: string }> = [
  { id: 'herz', label: 'Herz und Kreislauf', thema: 'thema.ap.herz', themaName: 'Herz und Blutkreislauf' },
  { id: 'haut', label: 'Haut und Dekubitus', thema: 'thema.pro.dekubitus', themaName: 'Dekubitusprophylaxe' },
  { id: 'lunge', label: 'Lunge und Lagerung', thema: 'thema.pro.pneumonie', themaName: 'Pneumonieprophylaxe' },
  { id: 'zucker', label: 'Blutzucker', thema: 'thema.kl.diabetes', themaName: 'Diabetes mellitus' },
];

const GESCHAFFT_KEY = 'lernstoff.physiologie.auftraege';
function ladeGeschafft(): string[] {
  try { const x = JSON.parse(localStorage.getItem(GESCHAFFT_KEY) ?? '[]'); return Array.isArray(x) ? x.filter((s) => typeof s === 'string') : []; } catch { return []; }
}
function speichereGeschafft(ids: string[]) {
  try { localStorage.setItem(GESCHAFFT_KEY, JSON.stringify(ids)); } catch { /* privat: nur diese Sitzung */ }
}

function Regler({ label, wert, min, max, step = 1, einheit, onChange, hilfe }: {
  label: string; wert: number; min: number; max: number; step?: number; einheit: string; onChange: (n: number) => void; hilfe?: string;
}) {
  return (
    <label className="field phy__regler">
      <span className="phy__regler-kopf"><span>{label}</span><strong>{wert} {einheit}</strong></span>
      <input type="range" min={min} max={max} step={step} value={wert} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={`${wert} ${einheit}`} />
      {hilfe && <span className="muted phy__hilfe">{hilfe}</span>}
    </label>
  );
}

function Schalter({ label, an, onChange }: { label: string; an: boolean; onChange: (b: boolean) => void }) {
  return <label className="phy__schalter"><input type="checkbox" checked={an} onChange={(e) => onChange(e.target.checked)} /> {label}</label>;
}

function Wert({ label, wert, warn }: { label: string; wert: string; warn?: boolean }) {
  return <div className={warn ? 'phy__wert phy__wert--warn' : 'phy__wert'}><span className="muted">{label}</span><strong>{wert}</strong></div>;
}

function Hinweise({ liste }: { liste: string[] }) {
  if (!liste.length) return null;
  return <ul className="phy__hinweise" aria-live="polite">{liste.map((h) => <li key={h}>{h}</li>)}</ul>;
}

function Rahmen({ regler, bild, werte, hinweise }: { regler: ReactNode; bild: ReactNode; werte: ReactNode; hinweise: string[] }) {
  return (
    <div className="phy__rahmen">
      <div className="card phy__regler-spalte">{regler}</div>
      <div className="card phy__bild-spalte">
        {bild}
        <div className="phy__werte">{werte}</div>
        <Hinweise liste={hinweise} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Herz

function HerzModell({ z, setZ }: { z: Zustand; setZ: (z: Zustand) => void }) {
  const e = z.herz;
  const r = herz(e);
  const set = (teil: Partial<typeof e>) => setZ({ ...z, herz: { ...e, ...teil } });
  // Kammergröße zeigt die Füllung, Wanddicke die Kraft, Gefäßweite die Nachlast.
  const kammer = 22 + r.vorlast * 0.22;
  const wand = 4 + r.kraft * 0.08;
  const gefaess = 16 - r.nachlast * 0.1;
  return (
    <Rahmen
      regler={<>
        <Regler label="Herzfrequenz" wert={e.hf} min={40} max={180} einheit="/min" onChange={(n) => set({ hf: n })} />
        <Regler label="Füllung (Vorlast)" wert={e.vorlast} min={10} max={100} einheit="%" onChange={(n) => set({ vorlast: n })} hilfe="Niedrig bei Volumenmangel, hoch bei Überwässerung." />
        <Regler label="Gefäßwiderstand (Nachlast)" wert={e.nachlast} min={10} max={100} einheit="%" onChange={(n) => set({ nachlast: n })} hilfe="Hoch bei enggestellten Gefäßen, z. B. Hypertonie." />
        <Regler label="Kontraktionskraft" wert={e.kraft} min={10} max={100} einheit="%" onChange={(n) => set({ kraft: n })} hilfe="Niedrig bei Herzinsuffizienz." />
        <fieldset className="phy__gruppe"><legend>Medikamente</legend>
          <Schalter label="Betablocker" an={e.betablocker} onChange={(b) => set({ betablocker: b })} />
          <Schalter label="ACE-Hemmer" an={e.aceHemmer} onChange={(b) => set({ aceHemmer: b })} />
          <Schalter label="Diuretikum" an={e.diuretikum} onChange={(b) => set({ diuretikum: b })} />
        </fieldset>
      </>}
      bild={
        <svg className="phy__svg" viewBox="0 0 240 160" role="img" aria-label={`Herz mit Füllung ${r.vorlast} Prozent, Kraft ${r.kraft} Prozent, Gefäßwiderstand ${r.nachlast} Prozent`}>
          <rect x="150" y={80 - gefaess / 2} width="86" height={gefaess} rx={gefaess / 2} className="phy__gefaess" />
          <text x="193" y={80 + gefaess / 2 + 14} textAnchor="middle" className="phy__beschriftung">Arterie</text>
          <ellipse cx="90" cy="80" rx={kammer + wand + 12} ry={kammer + wand + 22} className="phy__muskel" />
          <ellipse cx="90" cy="80" rx={kammer} ry={kammer + 10} className="phy__blut" style={{ opacity: 0.35 + r.fuellung * 0.6 }} />
          <path d={`M ${90 + kammer} 80 L 150 80`} className="phy__fluss" strokeWidth={Math.max(2, r.sv / 8)} />
          <text x="90" y="84" textAnchor="middle" className="phy__beschriftung phy__beschriftung--hell">{r.sv} ml</text>
        </svg>
      }
      werte={<>
        <Wert label="Herzfrequenz" wert={`${r.hf}/min`} warn={r.hf < 50 || r.hf > 100} />
        <Wert label="Schlagvolumen" wert={`${r.sv} ml`} />
        <Wert label="Herzzeitvolumen" wert={`${r.hzv.toLocaleString('de-DE')} l/min`} warn={r.hzv < 4} />
        <Wert label="Blutdruck" wert={`${r.sys}/${r.dia} mmHg`} warn={r.sys >= 140 || r.map < 65} />
        <Wert label="Mitteldruck" wert={`${r.map} mmHg`} warn={r.map < 65} />
      </>}
      hinweise={r.hinweise}
    />
  );
}

// ------------------------------------------------------------------ Haut

const SCHICHTEN = ['Oberhaut (Epidermis)', 'Lederhaut (Dermis)', 'Unterhaut (Subkutis)', 'Muskel'];

function HautModell({ z, setZ }: { z: Zustand; setZ: (z: Zustand) => void }) {
  const e = z.haut;
  const r = haut(e);
  const set = (teil: Partial<typeof e>) => setZ({ ...z, haut: { ...e, ...teil } });
  const hoehe = [14, 26, 34, 34];
  let y = 22;
  return (
    <Rahmen
      regler={<>
        <Regler label="Auflagedruck" wert={e.druck} min={0} max={150} step={5} einheit="mmHg" onChange={(n) => set({ druck: n })}
          hilfe={`Faustwert: Über etwa ${KAPILLARDRUCK} mmHg werden Kapillaren zugedrückt. Weichlagerung senkt den Druck.`} />
        <Regler label="Zeit ohne Entlastung" wert={e.stunden} min={0} max={8} step={0.5} einheit="Std." onChange={(n) => set({ stunden: n })} />
        <fieldset className="phy__gruppe"><legend>Verstärkende Faktoren</legend>
          <Schalter label="Scherkräfte (Rutschen im Bett)" an={e.scherkraefte} onChange={(b) => set({ scherkraefte: b })} />
          <Schalter label="Feuchte Haut (Inkontinenz, Schweiß)" an={e.feuchtigkeit} onChange={(b) => set({ feuchtigkeit: b })} />
        </fieldset>
      </>}
      bild={
        <svg className="phy__svg" viewBox="0 0 240 160" role="img" aria-label={`Hautschichten im Schnitt: ${KATEGORIE_TEXT[r.kategorie].titel}`}>
          <path d={`M 70 4 L 170 4 L 170 ${4 + Math.min(16, e.druck / 10)} L 70 ${4 + Math.min(16, e.druck / 10)} Z`} className="phy__last" />
          {SCHICHTEN.map((s, i) => {
            const y0 = y; y += hoehe[i]!;
            return (
              <g key={s}>
                <rect x="10" y={y0} width="220" height={hoehe[i]} className={`phy__schicht phy__schicht--${i}`} />
                <rect x="70" y={y0} width="100" height={hoehe[i]} className="phy__schaden" style={{ opacity: r.schichten[i]! * 0.85 }} />
                <text x="14" y={y0 + hoehe[i]! / 2 + 4} className="phy__beschriftung">{s}</text>
              </g>
            );
          })}
          <rect x="10" y={y} width="220" height={160 - y} className="phy__knochen" />
          <text x="14" y={y + 16} className="phy__beschriftung">Knochen</text>
        </svg>
      }
      werte={<Wert label="Ergebnis im Modell" wert={KATEGORIE_TEXT[r.kategorie].titel} warn={r.kategorie > 0} />}
      hinweise={[KATEGORIE_TEXT[r.kategorie].text, ...r.hinweise]}
    />
  );
}

// ------------------------------------------------------------------ Lunge

const REGION_ORT: Record<Region, { x: number; y: number }> = {
  'rechts-vorne': { x: 40, y: 30 }, 'links-vorne': { x: 130, y: 30 }, 'rechts-hinten': { x: 40, y: 88 }, 'links-hinten': { x: 130, y: 88 },
};
const REGION_LABEL: Record<Region, string> = { 'rechts-vorne': 'rechts vorne oben', 'links-vorne': 'links vorne oben', 'rechts-hinten': 'rechts hinten unten', 'links-hinten': 'links hinten unten' };

function LungeModell({ z, setZ }: { z: Zustand; setZ: (z: Zustand) => void }) {
  const r = lunge(z.lage, z.befund);
  return (
    <Rahmen
      regler={<>
        <fieldset className="phy__gruppe"><legend>Lagerung</legend>
          {(Object.keys(LAGE_LABEL) as Lage[]).map((l) => (
            <label key={l} className="phy__schalter"><input type="radio" name="phy-lage" checked={z.lage === l} onChange={() => setZ({ ...z, lage: l })} /> {LAGE_LABEL[l]}</label>
          ))}
        </fieldset>
        <fieldset className="phy__gruppe"><legend>Befund</legend>
          {(Object.keys(BEFUND_LABEL) as Befund[]).map((b) => (
            <label key={b} className="phy__schalter"><input type="radio" name="phy-befund" checked={z.befund === b} onChange={() => setZ({ ...z, befund: b })} /> {BEFUND_LABEL[b]}</label>
          ))}
        </fieldset>
      </>}
      bild={<>
        <svg className="phy__svg" viewBox="0 0 240 160" role="img" aria-label="Lunge in vier Bereichen mit Belüftung und Durchblutung">
          <text x="85" y="18" textAnchor="middle" className="phy__beschriftung">rechts</text>
          <text x="175" y="18" textAnchor="middle" className="phy__beschriftung">links</text>
          {REGIONEN.map((reg) => {
            const w = r.regionen[reg];
            const o = REGION_ORT[reg];
            return (
              <g key={reg}>
                <rect x={o.x} y={o.y} width="86" height="52" rx="10" className={w.unten ? 'phy__region phy__region--unten' : 'phy__region'} />
                <rect x={o.x + 10} y={o.y + 40 - Math.min(30, w.belueftung * 20)} width="26" height={Math.min(30, w.belueftung * 20)} className="phy__luft" />
                <rect x={o.x + 50} y={o.y + 40 - Math.min(30, w.durchblutung * 20)} width="26" height={Math.min(30, w.durchblutung * 20)} className="phy__blutbalken" />
              </g>
            );
          })}
          <rect x="40" y="148" width="10" height="8" className="phy__luft" /><text x="54" y="155" className="phy__beschriftung">Belüftung</text>
          <rect x="130" y="148" width="10" height="8" className="phy__blutbalken" /><text x="144" y="155" className="phy__beschriftung">Durchblutung</text>
        </svg>
        <table className="phy__tabelle">
          <caption className="visually-hidden">Belüftung und Durchblutung je Bereich</caption>
          <thead><tr><th scope="col">Bereich</th><th scope="col">liegt</th><th scope="col">Belüftung</th><th scope="col">Durchblutung</th></tr></thead>
          <tbody>{REGIONEN.map((reg) => <tr key={reg}><th scope="row">{REGION_LABEL[reg]}</th><td>{r.regionen[reg].unten ? 'unten' : 'oben'}</td><td>{Math.round(r.regionen[reg].belueftung * 100)} %</td><td>{Math.round(r.regionen[reg].durchblutung * 100)} %</td></tr>)}</tbody>
        </table>
      </>}
      werte={<>
        <Wert label="Gasaustausch im Modell" wert={r.gasaustausch} warn={r.gasaustausch !== 'gut'} />
        <Wert label="Blut an schlecht belüfteten Bereichen vorbei" wert={`${Math.round(r.shunt * 100)} %`} warn={r.shunt >= 0.18} />
      </>}
      hinweise={r.hinweise}
    />
  );
}

// ------------------------------------------------------------------ Blutzucker

function ZuckerModell({ z, setZ }: { z: Zustand; setZ: (z: Zustand) => void }) {
  const e = z.zucker;
  const r = blutzucker(e);
  const set = (teil: Partial<typeof e>) => setZ({ ...z, zucker: { ...e, ...teil } });
  const X = (i: number) => 30 + (i * SCHRITT_MIN * 200) / DAUER_MIN;
  const Y = (g: number) => 140 - (Math.min(g, 400) * 130) / 400;
  const punkte = r.verlauf.map((g, i) => `${X(i).toFixed(1)},${Y(g).toFixed(1)}`).join(' ');
  return (
    <Rahmen
      regler={<>
        <fieldset className="phy__gruppe"><legend>Stoffwechsel</legend>
          {(Object.keys(STOFFWECHSEL_LABEL) as Stoffwechsel[]).map((s) => (
            <label key={s} className="phy__schalter"><input type="radio" name="phy-stoffwechsel" checked={e.stoffwechsel === s} onChange={() => set({ stoffwechsel: s })} /> {STOFFWECHSEL_LABEL[s]}</label>
          ))}
        </fieldset>
        <Regler label="Mahlzeit" wert={e.kohlenhydrate} min={0} max={120} step={10} einheit="g Kohlenhydrate" onChange={(n) => set({ kohlenhydrate: n })} hilfe="Ein Brötchen hat etwa 25 bis 30 g." />
        <Regler label="Normalinsulin zur Mahlzeit" wert={e.insulin} min={0} max={12} einheit="IE" onChange={(n) => set({ insulin: n })} />
        <Schalter label="30 Minuten zügig gehen (nach 1 Stunde)" an={e.bewegung} onChange={(b) => set({ bewegung: b })} />
      </>}
      bild={
        <svg className="phy__svg" viewBox="0 0 240 160" role="img" aria-label={`Blutzuckerverlauf über 6 Stunden, tiefster Wert ${r.min}, höchster ${r.max} mg/dl`}>
          <rect x="30" y={Y(180)} width="200" height={Y(70) - Y(180)} className="phy__zielbereich" />
          <line x1="30" x2="230" y1={Y(70)} y2={Y(70)} className="phy__grenze" />
          <line x1="30" x2="230" y1={Y(250)} y2={Y(250)} className="phy__grenze" />
          <text x="26" y={Y(70) + 4} textAnchor="end" className="phy__beschriftung">70</text>
          <text x="26" y={Y(180) + 4} textAnchor="end" className="phy__beschriftung">180</text>
          <text x="26" y={Y(250) + 4} textAnchor="end" className="phy__beschriftung">250</text>
          {[0, 2, 4, 6].map((h) => <text key={h} x={30 + (h * 200) / 6} y="155" textAnchor="middle" className="phy__beschriftung">{h} h</text>)}
          {e.bewegung && <rect x={X(6)} y="10" width={X(9) - X(6)} height="130" className="phy__bewegung" />}
          <polyline points={punkte} className="phy__kurve" />
        </svg>
      }
      werte={<>
        <Wert label="Tiefster Wert" wert={`${r.min} mg/dl`} warn={r.hypo} />
        <Wert label="Höchster Wert" wert={`${r.max} mg/dl`} warn={r.hyper} />
        <Wert label="Nach 6 Stunden" wert={`${r.verlauf.at(-1)} mg/dl`} />
      </>}
      hinweise={r.hinweise}
    />
  );
}

// ------------------------------------------------------------------ Seite

/**
 * Physiologie-Modelle: an Reglern drehen und die Folge sehen. Vereinfachte Lernmodelle ohne Animation
 * (bei „weniger Bewegung“ ändert sich nichts), zählen nicht im Lernplan.
 */
export default function PhysiologieSeite() {
  const { params } = useRoute();
  const roh = params.get('modell');
  const modell: ModellId = MODELLE.some((m) => m.id === roh) ? (roh as ModellId) : 'herz';
  const [z, setZ] = useState<Zustand>(START);
  const [geschafft, setGeschafft] = useState<string[]>(ladeGeschafft);
  const aktiv = MODELLE.find((m) => m.id === modell)!;
  const auftraege = AUFTRAEGE.filter((a) => a.modell === modell);

  function aendere(neu: Zustand) {
    setZ(neu);
    const jetzt = AUFTRAEGE.filter((a) => !geschafft.includes(a.id) && a.geschafft(neu)).map((a) => a.id);
    if (jetzt.length) { const alle = [...geschafft, ...jetzt]; setGeschafft(alle); speichereGeschafft(alle); }
  }

  return (
    <section className="page phy">
      <PageHeading eyebrow="Lernen" title="Physiologie-Modelle"
        description="An Reglern drehen und die Folge sehen: Herz und Kreislauf, Haut und Dekubitus, Lunge und Lagerung, Blutzucker. Vereinfachte Lernmodelle, keine Messwerte eines Menschen." />
      <div className="pills" role="tablist" aria-label="Modell">
        {MODELLE.map((m, index) => (
          <button key={m.id} id={`phy-tab-${m.id}`} type="button" role="tab" className="pill" aria-selected={modell === m.id} aria-controls="phy-panel" tabIndex={modell === m.id ? 0 : -1}
            onKeyDown={(e) => {
              const n = MODELLE.length;
              const t = e.key === 'ArrowRight' ? (index + 1) % n : e.key === 'ArrowLeft' ? (index + n - 1) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
              if (t < 0) return;
              e.preventDefault();
              navigate(`/lernen/physiologie?modell=${MODELLE[t]!.id}`);
              document.getElementById(`phy-tab-${MODELLE[t]!.id}`)?.focus();
            }}
            onClick={() => navigate(`/lernen/physiologie?modell=${m.id}`)}>{m.label}</button>
        ))}
      </div>
      <div id="phy-panel" role="tabpanel" aria-labelledby={`phy-tab-${modell}`} className="phy__panel">
        {modell === 'herz' && <HerzModell z={z} setZ={aendere} />}
        {modell === 'haut' && <HautModell z={z} setZ={aendere} />}
        {modell === 'lunge' && <LungeModell z={z} setZ={aendere} />}
        {modell === 'zucker' && <ZuckerModell z={z} setZ={aendere} />}

        <div className="card phy__auftraege">
          <h2>Ausprobieren</h2>
          <ul>
            {auftraege.map((a) => {
              const ok = geschafft.includes(a.id);
              return (
                <li key={a.id} className={ok ? 'phy__auftrag phy__auftrag--ok' : 'phy__auftrag'}>
                  <span aria-hidden="true">{ok ? '✓' : '○'}</span>
                  <div><span>{a.text}</span>{ok && <p className="muted">{a.warum}</p>}<span className="visually-hidden">{ok ? ' Geschafft.' : ' Noch offen.'}</span></div>
                </li>
              );
            })}
          </ul>
          <div className="row">
            <button type="button" className="small ghost" onClick={() => setZ(START)}>Regler zurücksetzen</button>
            <button type="button" className="small ghost" onClick={() => navigate(`/lernen/thema?id=${encodeURIComponent(aktiv.thema)}`)}>Zum Thema {aktiv.themaName}</button>
          </div>
        </div>
        <p className="muted phy__modellhinweis">Lernmodell mit Faustwerten aus Lehrbüchern und Schulungen. Es zeigt Richtung und Zusammenhang, nicht den Verlauf bei einem echten Menschen. Für Dosierungen und Entscheidungen gelten ärztliche Anordnung, Standards und dein Unterrichtsmaterial.</p>
      </div>
    </section>
  );
}
