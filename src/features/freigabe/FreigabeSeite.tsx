// Fachliche Freigabe (#/system/freigabe, Audit F-1): Welche Inhalte sind geprüft, welche nicht, und
// ein Prüfbogen je Inhalt zum Ausfüllen am Gerät oder auf Papier. Das Ergebnis geht als Freigabe-Code
// zurück in die App. Erst nach der Übernahme in den Code gilt ein Inhalt überall als geprüft.

import { useMemo, useState } from 'react';
import '../qm/qm.css';
import './freigabe.css';
import { PageHeading } from '../../ui/PageHeading';
import { notify } from '../../ui/shell/notifications';
import { useRoute } from '../../ui/shell/router';
import { kopiere } from '../klasse/teilen';
import { freigabeDatum, RISIKO_TEXT, ZIELGRUPPE_TEXT, type PruefArt } from '../../ui/sim/freigabe';
import { erteilungFuer, URTEIL_TEXT, type Urteil } from '../../ui/sim/freigabe-erteilt';
import { neuereFassungFuer } from '../quellen/register-basis';
import { heuteTag } from '../../ui/lib/time';
import { alleInhalte, BEREICHE, FREIGABE_STATUS_TEXT, freigabeStatus, risikoGewicht, type FreigabeStatus, type PruefInhalt } from './inhalte';
import {
  ALLGEMEINE_PUNKTE, alsErteilung, entferneBogen, freigabeCode, ladeBoegen, leseCode, PUNKT_TEXT, ROLLEN, speichereBogen, uebernimmBoegen,
  type Pruefbogen, type PunktErgebnis,
} from './ablauf';

const heute = () => heuteTag();
const TON: Record<FreigabeStatus, string> = { offen: 'tag--warning', geaendert: 'tag--critical', nachbessern: 'tag--critical', abgeglichen: '', geprueft: 'tag--wissen-sicher' };

type Filter = 'tun' | 'alle' | 'erfasst';

function Zahl({ label, wert, t }: { label: string; wert: number; t?: 'gut' | 'warn' | 'kritisch' }) {
  return <div className={`qm-zahl${t ? ` qm-zahl--${t}` : ''}`}><dt>{label}</dt><dd>{wert}</dd></div>;
}

function Zeile({ i, bogen }: { i: PruefInhalt; bogen?: Pruefbogen }) {
  const st = freigabeStatus(i);
  return (
    <li className="card qm-eintrag freigabe-zeile">
      <div className="qm-eintrag__kopf">
        <h3><a href={`#/system/freigabe?id=${encodeURIComponent(i.id)}`}>{i.name}</a></h3>
        <span className={`tag ${TON[st]}`}>{FREIGABE_STATUS_TEXT[st]}</span>
        {bogen && <span className="tag">Bogen auf diesem Gerät: {URTEIL_TEXT[bogen.urteil]}</span>}
      </div>
      <p className="muted">{i.bereich} · {ZIELGRUPPE_TEXT[i.freigabe.zielgruppe]}{i.freigabe.risiken.length ? ` · besonders prüfen: ${i.freigabe.risiken.map((r) => RISIKO_TEXT[r]).join(', ')}` : ''} · {i.freigabe.pruefpunkte.length} Prüfpunkte</p>
    </li>
  );
}

function Bogen({ i, gespeichert, onSpeichern, onEntfernen }: {
  i: PruefInhalt; gespeichert?: Pruefbogen; onSpeichern: (b: Pruefbogen) => void; onEntfernen: () => void;
}) {
  const punkte = [...i.freigabe.pruefpunkte, ...ALLGEMEINE_PUNKTE];
  const alt = gespeichert && gespeichert.fp === i.fp ? gespeichert : undefined;
  const [rolle, setRolle] = useState(alt?.rolle ?? ROLLEN[0]!.rolle);
  const [name, setName] = useState(alt?.name ?? '');
  const [datum, setDatum] = useState(alt?.datum ?? heute());
  const [urteil, setUrteil] = useState<Urteil>(alt?.urteil ?? 'freigegeben');
  const [ergebnis, setErgebnis] = useState<Record<string, PunktErgebnis>>(alt?.punkte ?? {});
  const [notizen, setNotizen] = useState<Record<string, string>>(alt?.notizen ?? {});
  const [bemerkung, setBemerkung] = useState(alt?.bemerkung ?? '');
  const art: PruefArt = ROLLEN.find((r) => r.rolle === rolle)?.art ?? 'fachperson';
  const fehlt = punkte.filter((p) => !ergebnis[p]);
  const erteilt = erteilungFuer(i.id, i.fp);
  const st = freigabeStatus(i);

  const speichern = () => {
    if (fehlt.length) { notify('warning', 'Noch nicht vollständig', `${fehlt.length} Punkte haben noch kein Ergebnis.`); return; }
    if (urteil === 'freigegeben' && punkte.some((p) => ergebnis[p] === 'aendern')) {
      notify('warning', 'Urteil passt nicht', 'Mindestens ein Punkt ist auf „Ändern“. Dann bitte „Freigegeben nach Änderungen“ oder „Nicht freigegeben“ wählen.'); return;
    }
    const b: Pruefbogen = { id: i.id, fp: i.fp, art, rolle, ...(name.trim() ? { name: name.trim() } : {}), datum, urteil, punkte: ergebnis, notizen, ...(bemerkung.trim() ? { bemerkung: bemerkung.trim() } : {}) };
    onSpeichern(b);
  };

  return (
    <article className="card freigabe-bogen" aria-labelledby="bogen-titel">
      <div className="qm-eintrag__kopf">
        <h2 id="bogen-titel">Prüfbogen: {i.name}</h2>
        <span className={`tag ${TON[st]}`}>{FREIGABE_STATUS_TEXT[st]}</span>
      </div>
      <dl className="qm-dl">
        <dt>Bereich</dt><dd>{i.bereich} · <a href={`#${i.pfad}`}>Inhalt öffnen</a></dd>
        <dt>Gilt für</dt><dd>{i.freigabe.geltung} · {ZIELGRUPPE_TEXT[i.freigabe.zielgruppe]}</dd>
        <dt>Prüfen sollte</dt><dd>{i.freigabe.prueferrolle}</dd>
        {i.freigabe.risiken.length > 0 && <><dt>Risiken</dt><dd>{i.freigabe.risiken.map((r) => RISIKO_TEXT[r]).join(', ')}</dd></>}
        <dt>Fassung</dt><dd><code>{i.id}</code> · Fingerabdruck <code>{i.fp}</code></dd>
        {erteilt && <><dt>Letzte Prüfung</dt><dd>{freigabeDatum(erteilt.erteilung.datum)}, {erteilt.erteilung.rolle}: {URTEIL_TEXT[erteilt.erteilung.urteil]}{erteilt.aktuell ? '' : ' (für eine ältere Fassung)'}</dd></>}
      </dl>
      <h3>Lernziele</h3>
      <ul>{i.freigabe.lernziele.map((z) => <li key={z}>{z}</li>)}</ul>
      <h3>Quellen</h3>
      <ul>{i.freigabe.quellen.map((q) => {
        const neu = neuereFassungFuer(q);
        return <li key={q.titel}>{q.titel} (Stand {q.stand}){neu && <strong className="quellen-alt"> · neue Fassung {neu.aktuell.stand}, erst abgleichen</strong>}</li>;
      })}</ul>
      <form className="freigabe-form" onSubmit={(e) => { e.preventDefault(); speichern(); }}>
        <fieldset>
          <legend>Prüfpunkte</legend>
          <ol className="freigabe-punkte">
            {punkte.map((p, n) => (
              <li key={p} className={n >= i.freigabe.pruefpunkte.length ? 'is-allgemein' : undefined}>
                <p>{p}</p>
                <div className="freigabe-wahl" role="radiogroup" aria-label={`Ergebnis: ${p}`}>
                  {(Object.keys(PUNKT_TEXT) as PunktErgebnis[]).map((e) => (
                    <label key={e} className="check">
                      <input type="radio" name={`p-${n}`} checked={ergebnis[p] === e} onChange={() => setErgebnis({ ...ergebnis, [p]: e })} /> {PUNKT_TEXT[e]}
                    </label>
                  ))}
                </div>
                {ergebnis[p] && ergebnis[p] !== 'passt' && (
                  <label className="freigabe-notiz">Was genau?
                    <input type="text" value={notizen[p] ?? ''} onChange={(e) => setNotizen({ ...notizen, [p]: e.target.value })} />
                  </label>
                )}
                <span className="freigabe-linie" aria-hidden="true" />
              </li>
            ))}
          </ol>
        </fieldset>
        <fieldset className="freigabe-pruefer">
          <legend>Prüferin oder Prüfer</legend>
          <label>Rolle
            <select value={rolle} onChange={(e) => setRolle(e.target.value)}>
              {ROLLEN.map((r) => <option key={r.rolle} value={r.rolle}>{r.rolle}</option>)}
            </select>
          </label>
          <label>Name (freiwillig)<input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
          <label>Datum<input type="date" value={datum} onChange={(e) => setDatum(e.target.value || heute())} /></label>
          {art === 'lehrmaterial' && <p className="muted">Ein Abgleich mit Unterrichtsmaterial wird sichtbar vermerkt, ersetzt aber keine Prüfung durch eine Fachperson.</p>}
        </fieldset>
        <fieldset>
          <legend>Gesamturteil</legend>
          <div className="freigabe-wahl">
            {(Object.keys(URTEIL_TEXT) as Urteil[]).map((u) => (
              <label key={u} className="check"><input type="radio" name="urteil" checked={urteil === u} onChange={() => setUrteil(u)} /> {URTEIL_TEXT[u][0]!.toUpperCase() + URTEIL_TEXT[u].slice(1)}</label>
            ))}
          </div>
          <label className="freigabe-notiz">Bemerkung<textarea rows={3} value={bemerkung} onChange={(e) => setBemerkung(e.target.value)} /></label>
          <p className="freigabe-unterschrift">Unterschrift: <span className="freigabe-linie" aria-hidden="true" /></p>
        </fieldset>
        <div className="quellen-knoepfe freigabe-nicht-drucken">
          <button type="submit">Ergebnis speichern</button>
          <button type="button" className="ghost" onClick={() => window.print()}>Drucken oder als PDF sichern</button>
          {gespeichert && <button type="button" className="ghost" onClick={() => void kopiere(freigabeCode([gespeichert]), 'Freigabe-Code')}>Freigabe-Code kopieren</button>}
          {gespeichert && <button type="button" className="ghost small" onClick={onEntfernen}>Gespeicherten Bogen löschen</button>}
        </div>
        {gespeichert && gespeichert.fp !== i.fp && <p className="quellen-offen">Der gespeicherte Bogen gehört zu einer älteren Fassung dieses Inhalts. Bitte neu prüfen.</p>}
      </form>
    </article>
  );
}

function CodeUebernehmen({ onUebernommen }: { onUebernommen: (n: number) => void }) {
  const [text, setText] = useState('');
  return (
    <section className="card freigabe-nicht-drucken" aria-labelledby="code-titel">
      <h2 id="code-titel">Freigabe-Code von einem anderen Gerät übernehmen</h2>
      <p className="muted">Hat eine Lehrkraft oder Praxisanleitung den Bogen auf ihrem Gerät ausgefüllt, schickt sie dir den Code. Hier einfügen, dann stehen die Ergebnisse auch auf diesem Gerät.</p>
      <label className="freigabe-notiz">Code<textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="FREIGABE1:…" /></label>
      <button type="button" onClick={() => {
        const b = leseCode(text);
        if (!b) { notify('warning', 'Code nicht lesbar', 'Bitte den ganzen Code mit „FREIGABE1:“ am Anfang einfügen.'); return; }
        uebernimmBoegen(b); setText(''); onUebernommen(b.length);
      }}>Übernehmen</button>
    </section>
  );
}

function SoLaeuftEs() {
  return (
    <section className="card quellen-regeln freigabe-nicht-drucken" aria-labelledby="ablauf-titel">
      <h2 id="ablauf-titel">So läuft die Freigabe</h2>
      <ol>
        <li><strong>Reihenfolge:</strong> Medikamente, Notfall und Kinder zuerst. Die Liste „Zu prüfen“ ist schon so sortiert.</li>
        <li><strong>Quellen zuerst:</strong> Steht bei einer Quelle „neue Fassung“, wird der Inhalt vorher abgeglichen (<a href="#/system/quellen">Quellen und Aktualität</a>).</li>
        <li><strong>Bogen ausfüllen:</strong> am Gerät oder ausgedruckt. Jeder Prüfpunkt bekommt „Passt“, „Ändern“ oder „Unklar“, bei Bedarf mit einer Notiz.</li>
        <li><strong>Code weitergeben:</strong> „Freigabe-Code kopieren“ und im Projekt-Chat einfügen. Claude übernimmt die Prüfung in den Code und arbeitet Änderungswünsche ein.</li>
        <li><strong>Gültig nur für diese Fassung:</strong> Ändert sich der Inhalt später, zeigt die App „Seit der Prüfung geändert“ und der Inhalt muss neu geprüft werden.</li>
        <li><strong>Wer prüft:</strong> „Fachlich geprüft“ setzt die Inhaltsverantwortung oder eine Fachperson (Lehrkraft, Praxisanleitung, Pflegefachperson, bei Medikamenten auch ärztlich) mit dem Urteil „freigegeben“.</li>
      </ol>
      <p className="muted">Fragen der Wissenstrainer prüft man einzeln im <a href="#/system/qualitaet">Prüfstand der Inhaltsqualität</a>; der Bogen hier gilt für den Trainer als Ganzes.</p>
    </section>
  );
}

/** Fachliche Freigabe: Übersicht, Prüfbogen je Inhalt und Freigabe-Code. */
export default function FreigabeSeite() {
  const { params } = useRoute();
  const id = params.get('id') ?? '';
  const filter = (['tun', 'alle', 'erfasst'] as Filter[]).find((f) => f === params.get('filter')) ?? 'tun';
  const bereich = BEREICHE.find((b) => b === params.get('bereich'));
  const [boegen, setBoegen] = useState(ladeBoegen);
  const inhalte = useMemo(alleInhalte, []);
  const status = useMemo(() => new Map(inhalte.map((i) => [i.id, freigabeStatus(i)])), [inhalte]);
  const bogenVon = new Map(boegen.map((b) => [b.id, b]));
  const z = { offen: 0, geaendert: 0, abgeglichen: 0, nachbessern: 0, geprueft: 0 } as Record<FreigabeStatus, number>;
  for (const s of status.values()) z[s]++;
  const aktiv = inhalte.find((i) => i.id === id);

  const sichtbar = inhalte
    .filter((i) => !bereich || i.bereich === bereich)
    .filter((i) => filter === 'alle' || (filter === 'erfasst' ? bogenVon.has(i.id) : status.get(i.id) !== 'geprueft'))
    .sort((a, b) => (filter === 'tun' ? risikoGewicht(b.freigabe) - risikoGewicht(a.freigabe) : 0) || BEREICHE.indexOf(a.bereich) - BEREICHE.indexOf(b.bereich));
  const href = (f: Filter, b?: string) => `#/system/freigabe?filter=${f}${b ? `&bereich=${encodeURIComponent(b)}` : ''}`;

  return (
    <section className="page freigabe-seite">
      <PageHeading eyebrow="System" title="Fachliche Freigabe"
        description="Welche Inhalte eine Fachperson geprüft hat, welche noch nicht, und ein Prüfbogen je Inhalt zum Ausfüllen am Gerät oder auf Papier." />
      {aktiv ? (
        <>
          <p className="freigabe-nicht-drucken"><a href="#/system/freigabe">← Zur Übersicht</a></p>
          <Bogen key={`${aktiv.id}-${aktiv.fp}`} i={aktiv} gespeichert={bogenVon.get(aktiv.id)}
            onSpeichern={(b) => { setBoegen(speichereBogen(b)); notify('info', 'Prüfbogen gespeichert', 'Mit „Freigabe-Code kopieren“ gibst du das Ergebnis weiter.'); }}
            onEntfernen={() => setBoegen(entferneBogen(aktiv.id))} />
        </>
      ) : (
        <>
          <section className="card" aria-label="Stand der Freigabe">
            <dl className="qm-zahlen">
              <Zahl label="Noch nicht geprüft" wert={z.offen} t={z.offen ? 'warn' : 'gut'} />
              <Zahl label="Seit Prüfung geändert" wert={z.geaendert} t={z.geaendert ? 'kritisch' : 'gut'} />
              <Zahl label="Änderungswunsch offen" wert={z.nachbessern} t={z.nachbessern ? 'kritisch' : 'gut'} />
              {z.abgeglichen > 0 && <Zahl label="Mit Unterrichtsmaterial abgeglichen" wert={z.abgeglichen} />}
              <Zahl label="Fachlich geprüft" wert={z.geprueft} t="gut" />
            </dl>
            <p className="muted">{inhalte.length} Inhalte mit Freigabe. Auf diesem Gerät erfasste Bögen: {boegen.length}. Sie gelten erst überall, wenn der Freigabe-Code in die App übernommen ist.</p>
            {boegen.length > 0 && (
              <div className="quellen-knoepfe">
                <button type="button" onClick={() => void kopiere(freigabeCode(boegen), 'Freigabe-Code')}>Alle erfassten Bögen als Code kopieren</button>
                <button type="button" className="ghost small" onClick={() => void kopiere(boegen.map((b) => JSON.stringify(alsErteilung(b))).join('\n'), 'Ergebnisse als Text')}>Als Text kopieren</button>
              </div>
            )}
          </section>
          <nav className="qm__wahl quellen-filter" aria-label="Inhalte filtern">
            <a className="pill" href={href('tun', bereich)} aria-current={filter === 'tun' ? 'page' : undefined}>Zu prüfen</a>
            <a className="pill" href={href('erfasst', bereich)} aria-current={filter === 'erfasst' ? 'page' : undefined}>Auf diesem Gerät erfasst</a>
            <a className="pill" href={href('alle', bereich)} aria-current={filter === 'alle' ? 'page' : undefined}>Alle</a>
          </nav>
          <nav className="qm__wahl quellen-filter" aria-label="Bereich wählen">
            <a className="pill" href={href(filter)} aria-current={!bereich ? 'page' : undefined}>Alle Bereiche</a>
            {BEREICHE.map((b) => <a key={b} className="pill" href={href(filter, b)} aria-current={bereich === b ? 'page' : undefined}>{b}</a>)}
          </nav>
          {sichtbar.length === 0
            ? <p className="card">Hier ist nichts offen.</p>
            : <ul className="qm-liste">{sichtbar.map((i) => <Zeile key={i.id} i={i} bogen={bogenVon.get(i.id)} />)}</ul>}
          <CodeUebernehmen onUebernommen={(n) => { setBoegen(ladeBoegen()); notify('info', 'Code übernommen', `${n} ${n === 1 ? 'Bogen' : 'Bögen'} gespeichert.`); }} />
          <SoLaeuftEs />
        </>
      )}
    </section>
  );
}
