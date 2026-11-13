import { useEffect, useMemo, useState } from 'react';
import { DatenHinweis } from '../../ui/DatenHinweis';
import { storage } from '../../ui/lib/store';
import { navigate, useRoute } from '../../ui/shell/router';
import { pruefeAntwort } from '../klasse/auswertung';
import { rueckmeldungLink } from '../klasse/kodierung';
import { qrPfad, QrVollbild } from '../klasse/qr';
import { abgabenZu, eigeneFaelle, speichereEigenen } from '../klasse/speicher';
import { appBasis, dateiname, datumText, fristText, kopiere, speichereDatei, teile } from '../klasse/teilen';
import { istWahl, type Abgabe, type Aufgabe, type KlassenFall } from '../klasse/typen';
import { buchstabe, leseWahl } from '../klasse/wahl';
import { ergebnis, leereBewertung, mitVorschlaegen, rueckmeldungAus, rueckmeldungText, vorschlag } from './bewertung';
import { NOTE_TEXT, zahl } from './noten';
import { bausteine, bewertungenZu, bewertungVon, klassenVonFall, markiereGesendet, notenschluessel, speichereBewertung } from './speicher';
import { prozentText, Seite, StatusMarke } from './teile';
import { nameSchluessel, type Bewertung, type Notenstufe } from './typen';
import { aufgabenStatistik, status } from './uebersicht';

const MIT_NOTE = 'lernstoff.lehrer.mitNote';
const mitNoteLesen = () => storage.read<boolean>(MIT_NOTE, true);

/** Rückmeldung als Link teilen, kopieren oder als QR-Code zeigen. */
function RueckmeldungTeilen({ fall, b, schluessel, fertig }: { fall: KlassenFall; b: Bewertung; schluessel: Notenstufe[]; fertig: () => void }) {
  const [mitNote, setMitNote] = useState(mitNoteLesen);
  const [link, setLink] = useState('');
  const [qr, setQr] = useState(false);
  const r = useMemo(() => rueckmeldungAus(fall, b, schluessel, mitNote), [fall, b, schluessel, mitNote]);
  useEffect(() => {
    let aktiv = true;
    void rueckmeldungLink(r, appBasis()).then((l) => { if (aktiv) setLink(l); });
    return () => { aktiv = false; };
  }, [r]);
  const gesendet = () => { markiereGesendet(fall.id, b.name); fertig(); };
  return (
    <div className="lehrer__teilen">
      <label className="lehrer__haken">
        <input type="checkbox" checked={mitNote} onChange={(e) => { setMitNote(e.target.checked); storage.write(MIT_NOTE, e.target.checked); }} />
        <span>Note in der Rückmeldung zeigen</span>
      </label>
      <div className="row klasse__knoepfe">
        <button type="button" className="primary" disabled={!link} onClick={async () => { if (await teile({ title: `Rückmeldung: ${fall.titel}`, text: rueckmeldungText(r, link) }, 'Rückmeldung')) gesendet(); }}>Rückmeldung an {b.name} teilen …</button>
        <button type="button" disabled={!link} onClick={async () => { if (await kopiere(rueckmeldungText(r, link), 'Rückmeldung')) gesendet(); }}>Kopieren</button>
        <button type="button" className="ghost" disabled={!link || !qrPfad(link)} onClick={() => setQr(true)}>QR-Code</button>
      </div>
      {link && !qrPfad(link) && <p className="muted">Für einen QR-Code ist die Rückmeldung zu lang (lange Kommentare).</p>}
      {qr && <QrVollbild text={link} titel={`Rückmeldung für ${b.name}`} onClose={() => { setQr(false); gesendet(); }} />}
      {b.gesendet && <p className="muted">Zuletzt geteilt am {datumText(b.gesendet)}{b.gesendet < b.bewertet ? ', danach geändert: bitte neu schicken' : ''}.</p>}
      <DatenHinweis art="bewertung" fiktiv={false} kompakt />
    </div>
  );
}

function Antwort({ a, antwort }: { a: Aufgabe; antwort: string }) {
  if (istWahl(a)) {
    const gew = new Set(leseWahl(antwort, a.optionen!.length));
    return (
      <ul className="lehrer__wahl">
        {a.optionen!.map((o, i) => {
          const richtig = a.richtig?.includes(i);
          const markiert = gew.has(i);
          return (
            <li key={i} className={`${markiert ? 'is-gewaehlt' : ''} ${richtig ? 'is-richtig' : ''}`}>
              <span aria-hidden>{markiert ? (richtig ? '✓' : '✗') : richtig ? '○' : ''}</span> {buchstabe(i)}) {o}
              <span className="visually-hidden">{markiert ? ' (gewählt' : ' (nicht gewählt'}{richtig ? ', richtig)' : ')'}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  return <p className={`klasse__text lehrer__antwort${antwort.trim() ? '' : ' muted'}`}>{antwort.trim() || 'keine Antwort'}</p>;
}

function Einzeln({ fall, abgabe, abgaben, aendereFall }: { fall: KlassenFall; abgabe: Abgabe; abgaben: Abgabe[]; aendereFall: (f: KlassenFall) => void }) {
  const schluessel = useMemo(notenschluessel, []);
  const bs = useMemo(bausteine, []);
  const [b, setB] = useState<Bewertung>(() => bewertungVon(fall.id, abgabe.name) ?? leereBewertung(fall, abgabe));
  const [, setGesendet] = useState(0);
  const e = ergebnis(fall, b, schluessel);
  const veraltet = !!b.bewertet && b.abgabeVom < abgabe.abgegeben;

  // Entwurf sofort sichern: nichts geht verloren, „bewertet“ setzt erst „Bewertung abschließen“.
  const [speicherFehler, setSpeicherFehler] = useState(false);
  useEffect(() => {
    const leer = !b.bewertet && !Object.keys(b.punkte).length && !Object.values(b.kommentare).some((k) => k.trim()) && !b.kommentar.trim();
    if (!leer || bewertungVon(fall.id, b.name)) setSpeicherFehler(!speichereBewertung(b));
  }, [b, fall.id]);

  const setzePunkte = (id: string, wert: string) => setB((x) => {
    const p = { ...x.punkte };
    if (wert === '') delete p[id]; else p[id] = Math.max(0, Number(wert.replace(',', '.')));
    return { ...x, punkte: p };
  });
  const setzeKommentar = (id: string, t: string) => setB((x) => ({ ...x, kommentare: { ...x.kommentare, [id]: t } }));
  const haenge = (alt: string | undefined, t: string) => (alt?.trim() ? `${alt.trim()} ${t}` : t);

  const sortiert = [...abgaben].sort((x, y) => x.name.localeCompare(y.name, 'de'));
  const i = sortiert.findIndex((x) => x.name === abgabe.name);
  const zu = (a: Abgabe | undefined) => a && navigate(`/lehren/bewerten?fall=${fall.id}&name=${encodeURIComponent(a.name)}`);
  const naechsteOffene = () => {
    const bw = bewertungenZu(fall.id);
    const jetzt = new Date();
    return [...sortiert.slice(i + 1), ...sortiert.slice(0, i)].find((x) => ['abgegeben', 'verspaetet', 'neu'].includes(status(fall, x, bw[nameSchluessel(x.name)], jetzt)));
  };

  function abschliessen(weiter: boolean) {
    const fertig = { ...b, abgabeVom: abgabe.abgegeben, bewertet: new Date().toISOString() };
    setB(fertig);
    // Nicht weiterspringen, wenn nicht gespeichert werden konnte: sonst wären Punkte und Kommentare weg
    if (!speichereBewertung(fertig)) { setSpeicherFehler(true); return; }
    if (weiter) { const n = naechsteOffene(); if (n) zu(n); else navigate(`/lehren/bewerten?fall=${fall.id}`); }
  }

  function setzeMax(a: Aufgabe, wert: string) {
    const n = Number(wert.replace(',', '.'));
    aendereFall({ ...fall, aufgaben: fall.aufgaben.map((x) => (x.id === a.id ? { ...x, punkte: n > 0 ? Math.min(1000, n) : undefined } : x)) });
  }

  const ohnePunkte = fall.aufgaben.every((a) => !a.punkte);

  return (
    <>
      <div className="card lehrer__kopf">
        <div className="klasse__kopf">
          <h2 className="lehrer__h">{abgabe.name}</h2>
          <span className="muted">abgegeben {datumText(abgabe.abgegeben)}{fall.frist && new Date(abgabe.abgegeben) > new Date(`${fall.frist}T23:59:59`) ? ' · nach der Frist' : ''}</span>
        </div>
        {veraltet && <div className="note warn" role="status">Seit deiner Bewertung kam eine neuere Abgabe. Bitte prüfen und erneut abschließen.</div>}
        {ohnePunkte && <p className="muted">Dieser Fall hat noch keine Punkte. Trage bei jeder Aufgabe ein, wie viele Punkte es gibt, dann rechnet die App Summe, Prozent und Note. Ohne Punkte kannst du trotzdem kommentieren.</p>}
        <div className="row klasse__knoepfe">
          <button type="button" className="ghost small" disabled={i <= 0} onClick={() => zu(sortiert[i - 1])}>← Vorherige</button>
          <span className="muted">{i + 1} von {sortiert.length}</span>
          <button type="button" className="ghost small" disabled={i >= sortiert.length - 1} onClick={() => zu(sortiert[i + 1])}>Nächste →</button>
          <button type="button" className="small" onClick={() => setB(mitVorschlaegen(fall, abgabe, b))}>Alle Vorschläge übernehmen</button>
        </div>
      </div>

      {fall.aufgaben.map((a, nr) => {
        const antwort = abgabe.antworten[a.id] ?? '';
        const v = vorschlag(a, antwort);
        const treffer = istWahl(a) ? [] : pruefeAntwort(a, antwort);
        return (
          <section key={a.id} className="card lehrer__aufgabe">
            <h3><span className="klasse__nr">{nr + 1}</span> {a.frage}</h3>
            <Antwort a={a} antwort={antwort} />
            {treffer.length > 0 && (
              <ul className="klasse__punkte">
                {treffer.map((t, j) => <li key={j} className={t.ok ? 'is-ok' : 'is-fehlt'}><span aria-hidden>{t.ok ? '✓' : '✗'}</span> {t.punkt.text}<span className="visually-hidden">{t.ok ? ' (gefunden)' : ' (nicht gefunden)'}</span></li>)}
              </ul>
            )}
            {a.erwartung && <details className="klasse__block"><summary>Erwartungshorizont</summary><p className="klasse__text klasse__erwartung">{a.erwartung}</p></details>}
            <div className="lehrer__punkte">
              {a.punkte ? (
                <label className="field lehrer__punktfeld"><span>Punkte (max. {zahl(a.punkte)})</span>
                  <input type="number" inputMode="decimal" min={0} max={a.punkte} step={0.5} value={b.punkte[a.id] ?? ''} onChange={(ev) => setzePunkte(a.id, ev.target.value)} />
                </label>
              ) : (
                <label className="field lehrer__punktfeld"><span>Punkte für diese Aufgabe festlegen</span>
                  <input type="number" inputMode="decimal" min={0} step={0.5} placeholder="z. B. 4" onBlur={(ev) => ev.target.value && setzeMax(a, ev.target.value)} />
                </label>
              )}
              {v && (
                <span className="muted lehrer__vorschlag">
                  Vorschlag: {zahl(v.punkte)} ({v.grund}){' '}
                  {b.punkte[a.id] !== v.punkte && <button type="button" className="link" onClick={() => setzePunkte(a.id, String(v.punkte))}>übernehmen</button>}
                </span>
              )}
              {b.punkte[a.id] !== undefined && a.punkte && b.punkte[a.id]! > a.punkte && <span className="note warn" role="status">Mehr als die Höchstpunktzahl, gezählt werden {zahl(a.punkte)}.</span>}
            </div>
            <label className="field"><span>Kommentar zu dieser Aufgabe</span>
              <textarea rows={2} value={b.kommentare[a.id] ?? ''} onChange={(ev) => setzeKommentar(a.id, ev.target.value)} />
            </label>
            <div className="lehrer__bausteine" role="group" aria-label="Kommentar-Bausteine">
              {bs.map((t) => <button key={t} type="button" className="pill" onClick={() => setzeKommentar(a.id, haenge(b.kommentare[a.id], t))}>{t}</button>)}
            </div>
          </section>
        );
      })}

      <div className="card lehrer__ergebnis">
        <h3>Gesamt</h3>
        {e.max > 0 && (
          <p className="lehrer__summe">
            <strong>{zahl(e.punkte)} von {zahl(e.max)} Punkten</strong>
            {e.prozent !== null && <> · {prozentText(e.prozent)}</>}
            {e.note ? <> · Note <strong>{e.note}</strong>{NOTE_TEXT[e.note] ? ` (${NOTE_TEXT[e.note]})` : ''}</> : <span className="muted"> · Note, sobald alle Aufgaben Punkte haben</span>}
          </p>
        )}
        <label className="field"><span>Gesamtkommentar</span>
          <textarea rows={3} value={b.kommentar} onChange={(ev) => setB((x) => ({ ...x, kommentar: ev.target.value }))} placeholder="Was ist gut gelungen, woran weiterarbeiten?" />
        </label>
        <div className="lehrer__bausteine" role="group" aria-label="Kommentar-Bausteine für den Gesamtkommentar">
          {bs.map((t) => <button key={t} type="button" className="pill" onClick={() => setB((x) => ({ ...x, kommentar: haenge(x.kommentar, t) }))}>{t}</button>)}
        </div>
        <div className="row klasse__knoepfe">
          <button type="button" className="primary" onClick={() => abschliessen(true)}>Abschließen und weiter</button>
          <button type="button" onClick={() => abschliessen(false)}>Abschließen</button>
          <span className="muted">{b.bewertet ? `Abgeschlossen am ${datumText(b.bewertet)}` : 'Entwurf, wird laufend gespeichert'}</span>
        </div>
        {speicherFehler && <div className="note warn" role="alert">Speichern nicht möglich (privater Modus oder Speicher voll). Bitte die Seite nicht verlassen: Punkte und Kommentare abschreiben oder Speicher freigeben (z. B. alte Abgaben löschen) und erneut abschließen.</div>}
        {b.bewertet && !veraltet && <RueckmeldungTeilen fall={fall} b={b} schluessel={schluessel} fertig={() => { setB((x) => ({ ...x, gesendet: new Date().toISOString() })); setGesendet((n) => n + 1); }} />}
      </div>
    </>
  );
}

function FallUebersicht({ fall, abgaben }: { fall: KlassenFall; abgaben: Abgabe[] }) {
  const schluessel = useMemo(notenschluessel, []);
  const bw = useMemo(() => bewertungenZu(fall.id), [fall.id]);
  const jetzt = new Date();
  const zeilen = [...abgaben].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((a) => {
    const b = bw[nameSchluessel(a.name)] ?? null;
    return { a, b, s: status(fall, a, b, jetzt), e: b?.bewertet ? ergebnis(fall, b, schluessel) : null };
  });
  const stat = useMemo(() => aufgabenStatistik(fall, abgaben, bw), [fall, abgaben, bw]);
  const liste = new Set(klassenVonFall(fall.id).flatMap((k) => k.lernende));
  const fehlen = [...liste].filter((n) => !abgaben.some((a) => nameSchluessel(a.name) === nameSchluessel(n))).sort((x, y) => x.localeCompare(y, 'de'));
  const fertig = zeilen.filter((z) => z.s === 'bewertet' && z.b);
  const [links, setLinks] = useState(false);

  async function alleLinks() {
    setLinks(true);
    const zeilenText = await Promise.all(fertig.map(async ({ b }) => {
      const r = rueckmeldungAus(fall, b!, schluessel, mitNoteLesen());
      return `${b!.name}\n${await rueckmeldungLink(r, appBasis())}\n`;
    }));
    speichereDatei(`${dateiname(fall.titel)}-rueckmeldungen.txt`, `Rückmeldungen zu „${fall.titel}“. Jeden Link nur an die genannte Person schicken.\n\n${zeilenText.join('\n')}`);
    for (const { b } of fertig) markiereGesendet(fall.id, b!.name);
    setLinks(false);
  }

  return (
    <>
      <div className="card">
        <div className="klasse__kopf">
          <h2 className="lehrer__h">Abgaben ({abgaben.length})</h2>
          <button type="button" className="small ghost" onClick={() => navigate(`/lernen/klasse/lehrkraft?id=${fall.id}`)}>Verteilen und einlesen</button>
        </div>
        {!abgaben.length && <p className="muted">Noch keine Abgaben. Unter <button type="button" className="link" onClick={() => navigate('/lehren/abgaben')}>Abgaben</button> einlesen.</p>}
        <ul className="klasse__liste">
          {zeilen.map(({ a, b, s, e }) => (
            <li key={a.name}>
              <button type="button" className="link" onClick={() => navigate(`/lehren/bewerten?fall=${fall.id}&name=${encodeURIComponent(a.name)}`)}>{a.name}</button>
              <span className="muted">{e && e.max ? `${zahl(e.punkte)}/${zahl(e.max)} P.${e.note ? ` · Note ${e.note}` : ''}` : datumText(a.abgegeben)}{b?.bewertet && (!b.gesendet || b.gesendet < b.bewertet) ? ' · Rückmeldung offen' : ''}</span>
              <StatusMarke status={s} kurz />
            </li>
          ))}
        </ul>
        {fehlen.length > 0 && <p className="muted"><strong>Fehlt noch{fall.frist ? ` (Frist ${fristText(fall.frist)})` : ''}:</strong> {fehlen.join(', ')}</p>}
        {fertig.length > 1 && (
          <div className="row klasse__knoepfe">
            <button type="button" className="small" disabled={links} onClick={alleLinks}>Alle {fertig.length} Rückmeldelinks als Datei</button>
            <span className="muted">Zum Verschicken über Mail oder Lernplattform, je Person ein Link.</span>
          </div>
        )}
      </div>

      {abgaben.length > 0 && (
        <div className="card">
          <h2 className="lehrer__h">Für die Nachbesprechung</h2>
          <p className="muted">Wie gut jede Aufgabe gelöst wurde ({stat.some((s) => s.quelle === 'bewertung') ? 'aus deinen Punkten' : 'Schätzung aus Kernpunkten und Auswahl'}) und was oft fehlt.</p>
          <ol className="lehrer__statistik">
            {stat.map((s) => (
              <li key={s.id}>
                <div className="lehrer__stat-kopf">
                  <span className="klasse__nr">{s.nr}</span>
                  <span className="lehrer__stat-frage">{s.frage}</span>
                  {s.schnitt !== null && <span className="klasse__quote">Ø {prozentText(s.schnitt)}</span>}
                </div>
                {s.schnitt !== null && <div className="lehrer__balken" aria-hidden><span style={{ width: `${s.schnitt}%` }} /></div>}
                {s.leer > 0 && <p className="muted">{s.leer} ohne Antwort</p>}
                {s.fehlend.length > 0 && <p className="muted">Oft fehlt: {s.fehlend.slice(0, 4).map((f) => `${f.text} (${f.fehlt}×)`).join(' · ')}</p>}
                {s.wahl && <p className="muted">Gewählt: {s.wahl.map((w, j) => `${buchstabe(j)}${w.richtig ? '✓' : ''} ${w.anzahl}×`).join(' · ')}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}

export default function Bewerten() {
  const { params } = useRoute();
  const fallId = params.get('fall') ?? '';
  const name = params.get('name');
  const [fall, setFall] = useState<KlassenFall | null>(() => eigeneFaelle().find((f) => f.id === fallId) ?? null);
  useEffect(() => { setFall(eigeneFaelle().find((f) => f.id === fallId) ?? null); }, [fallId]);
  const abgaben = useMemo(() => (fall ? abgabenZu(fall.id) : []), [fall]);

  if (!fall) {
    return <Seite titel="Bewerten"><div className="card"><div className="note warn" role="alert">Diesen Fall gibt es auf diesem Gerät nicht.</div><button type="button" onClick={() => navigate('/lehren/aufgaben')}>Alle Fälle</button></div></Seite>;
  }
  const aendereFall = (f: KlassenFall) => { if (speichereEigenen(f)) setFall(f); };
  const abgabe = name ? abgaben.find((a) => a.name === name) ?? abgaben.find((a) => nameSchluessel(a.name) === nameSchluessel(name)) : undefined;

  return (
    <Seite titel={fall.titel} intro={name ? 'Abgabe bewerten. Vorschläge kommen aus Kernpunkten und Auswahlaufgaben, entscheiden tust du.' : 'Abgaben, Bewertungen und Rückmeldungen zu diesem Fall.'}
      aktion={name ? <button type="button" onClick={() => navigate(`/lehren/bewerten?fall=${fall.id}`)}>Alle Abgaben</button> : undefined}>
      {name && !abgabe && <div className="card"><div className="note warn" role="alert">Keine Abgabe von „{name}“ zu diesem Fall.</div></div>}
      {abgabe ? <Einzeln key={`${fall.id}-${abgabe.name}`} fall={fall} abgabe={abgabe} abgaben={abgaben} aendereFall={aendereFall} /> : <FallUebersicht fall={fall} abgaben={abgaben} />}
    </Seite>
  );
}
