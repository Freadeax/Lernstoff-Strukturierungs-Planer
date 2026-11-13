import { useEffect, useState } from 'react';
import './klasse.css';
import { navigate, useRoute } from '../../ui/shell/router';
import { Bearbeiten } from './Bearbeiten';
import { Editor } from './Editor';
import { findeRueckmeldung, leseAbgabeCode, leseFall, leseRueckmeldung } from './kodierung';
import { Lehrkraft } from './Lehrkraft';
import { Rueckmeldungsansicht } from './Rueckmeldungsansicht';
import { arbeitZu, eigeneFaelle, erhalteneFaelle, merkeErhalten, merkeRueckmeldung, nimmAbgabenAuf, rueckmeldungZu, speichereEigenen, abgabenZu, vergiss } from './speicher';
import { datumText, fristText } from './teilen';
import { ART_LABEL, type Abgabe, type KlassenFall, type Rueckmeldung } from './typen';
import { leererFall, VORLAGE_GRUPPEN, VORLAGEN } from './vorlagen';

// Routen: /lernen/klasse (Start), …/neu (Editor), …/lehrkraft?id|d (Übersicht eines verteilten Falls),
// …/fall?d|id (Bearbeiten für die Klasse). „d“ = gepackter Fall aus dem Link.

function Seite({ titel, intro, children }: { titel: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="page klasse">
      <div className="page__head"><h2>{titel}</h2>{intro && <p className="muted">{intro}</p>}</div>
      {children}
    </section>
  );
}

/** Liest „d“ aus dem Link, speichert den Fall und ersetzt die lange Adresse durch die kurze mit „id“. */
function useFallAusLink(ziel: 'fall' | 'lehrkraft') {
  const { params } = useRoute();
  const d = params.get('d');
  const id = params.get('id');
  const [fehler, setFehler] = useState('');
  useEffect(() => {
    if (!d) return;
    let aktiv = true;
    setFehler('');
    leseFall(d).then((f) => {
      if (!aktiv) return;
      if (ziel === 'lehrkraft') speichereEigenen(f); else merkeErhalten(f);
      // replace: „Zurück“ führt nicht noch einmal über den langen Link
      location.replace(`#/lernen/klasse/${ziel}?id=${f.id}`);
    }).catch((e: Error) => { if (aktiv) setFehler(e.message); });
    return () => { aktiv = false; };
  }, [d, ziel]);
  const liste = ziel === 'lehrkraft' ? eigeneFaelle() : erhalteneFaelle();
  const fall = id ? liste.find((f) => f.id === id) ?? null : null;
  return { laedt: !!d && !fehler, fehler: fehler || (id && !fall ? 'Diesen Fall gibt es auf diesem Gerät nicht (mehr). Bitte den Link noch einmal öffnen.' : ''), fall };
}

function Fehler({ text }: { text: string }) {
  return (
    <div className="card">
      <div className="note warn" role="alert">{text}</div>
      <div className="row"><button type="button" onClick={() => navigate('/lernen/klasse')}>Zum Klassenmodus</button></div>
    </div>
  );
}

function KlasseFall() {
  const { laedt, fehler, fall } = useFallAusLink('fall');
  if (fehler) return <Seite titel="Klassenfall"><Fehler text={fehler} /></Seite>;
  if (laedt || !fall) return <Seite titel="Klassenfall"><p className="muted">Fall wird geöffnet …</p></Seite>;
  return (
    <Seite titel="Klassenfall" intro="Lies den Fall, beantworte die Aufgaben und gib ab. Dein Entwurf bleibt auf diesem Gerät, bis du die Abgabe schickst.">
      <Bearbeiten key={fall.id} fall={fall} />
    </Seite>
  );
}

function LehrkraftFall() {
  const { laedt, fehler, fall } = useFallAusLink('lehrkraft');
  if (fehler) return <Seite titel="Klassenfall verteilen"><Fehler text={fehler} /></Seite>;
  if (laedt || !fall) return <Seite titel="Klassenfall verteilen"><p className="muted">Fall wird geöffnet …</p></Seite>;
  return <Seite titel="Klassenfall verteilen"><Lehrkraft key={fall.id} fall={fall} /></Seite>;
}

function Neu() {
  const { params } = useRoute();
  const id = params.get('id');
  const vorlage = params.get('vorlage');
  const [start] = useState<KlassenFall | null>(() => {
    if (id) return eigeneFaelle().find((f) => f.id === id) ?? null;
    if (vorlage) return VORLAGEN.find((v) => v.id === vorlage)?.baue() ?? null;
    return leererFall();
  });
  if (!start) return <Seite titel="Klassenfall"><Fehler text="Fall oder Vorlage nicht gefunden." /></Seite>;
  return (
    <Seite titel={id ? 'Klassenfall bearbeiten' : 'Neuer Klassenfall'} intro="Fall und Aufgaben eingeben. Danach bekommst du einen Link für die Klasse.">
      <Editor key={start.id} start={start} />
    </Seite>
  );
}

/** Abgabe-Link (QR-Code der Lernenden): auf dem Gerät der Lehrkraft mit einem Tippen einlesen. */
function AbgabeAusLink() {
  const { params } = useRoute();
  const d = params.get('d');
  const [abgabe, setAbgabe] = useState<Abgabe | null>(null);
  const [fehler, setFehler] = useState('');
  const [fertig, setFertig] = useState('');
  useEffect(() => {
    if (!d) { setFehler('Der Link enthält keine Abgabe.'); return; }
    let aktiv = true;
    leseAbgabeCode(d).then((a) => { if (aktiv) setAbgabe(a); }).catch((e: Error) => { if (aktiv) setFehler(e.message); });
    return () => { aktiv = false; };
  }, [d]);
  if (fehler) return <Seite titel="Abgabe einlesen"><Fehler text={fehler} /></Seite>;
  if (!abgabe) return <Seite titel="Abgabe einlesen"><p className="muted">Abgabe wird gelesen …</p></Seite>;
  const fall = eigeneFaelle().find((f) => f.id === abgabe.fallId);
  const beantwortet = Object.values(abgabe.antworten).filter((x) => x.trim()).length;
  function einlesen() {
    const r = nimmAbgabenAuf([abgabe!]);
    setFertig(r.neu ? 'Abgabe eingelesen.' : r.ersetzt ? 'Neuere Abgabe übernommen, die ältere ist ersetzt.' : 'Diese Abgabe war schon da.');
  }
  return (
    <Seite titel="Abgabe einlesen" intro="Eine Abgabe aus dem Klassenmodus. Einlesen nur auf dem Gerät der Lehrkraft.">
      <div className="card">
        <h3>{abgabe.name}</h3>
        <p className="muted">{fall?.titel ?? abgabe.titel} · {beantwortet} Antworten · abgegeben {datumText(abgabe.abgegeben)}</p>
        {!fall && <div className="note warn" role="status">Diesen Fall hast du auf diesem Gerät nicht verteilt. Du kannst die Abgabe trotzdem einlesen; sie erscheint beim Fall, sobald du dessen Lehrkraft-Link hier öffnest.</div>}
        {fertig
          ? (
            <>
              <div className="note ok" role="status">{fertig}</div>
              <div className="row klasse__knoepfe">
                {fall && <button type="button" className="primary" onClick={() => navigate(`/lehren/bewerten?fall=${fall.id}&name=${encodeURIComponent(abgabe.name)}`)}>Jetzt bewerten</button>}
                <button type="button" onClick={() => navigate('/lehren/abgaben')}>Alle Abgaben</button>
              </div>
            </>
          )
          : (
            <div className="row klasse__knoepfe">
              <button type="button" className="primary" onClick={einlesen}>Abgabe einlesen</button>
              <button type="button" className="ghost" onClick={() => navigate('/lernen/klasse')}>Abbrechen</button>
            </div>
          )}
      </div>
    </Seite>
  );
}

/** Rückmeldelink der Lehrkraft: merken und neben den eigenen Antworten zeigen. */
function RueckmeldungAusLink() {
  const { params } = useRoute();
  const d = params.get('d');
  const id = params.get('id');
  const [fehler, setFehler] = useState('');
  useEffect(() => {
    if (!d) return;
    let aktiv = true;
    leseRueckmeldung(d).then((r) => {
      if (!aktiv) return;
      merkeRueckmeldung(r);
      const bekannt = erhalteneFaelle().some((f) => f.id === r.fallId);
      location.replace(bekannt ? `#/lernen/klasse/fall?id=${r.fallId}` : `#/lernen/klasse/rueckmeldung?id=${r.fallId}`);
    }).catch((e: Error) => { if (aktiv) setFehler(e.message); });
    return () => { aktiv = false; };
  }, [d]);
  if (fehler) return <Seite titel="Rückmeldung"><Fehler text={fehler} /></Seite>;
  const r = id ? rueckmeldungZu(id) : null;
  if (!r) return <Seite titel="Rückmeldung"><p className="muted">{d ? 'Rückmeldung wird geöffnet …' : 'Diese Rückmeldung gibt es auf diesem Gerät nicht.'}</p></Seite>;
  return (
    <Seite titel={r.titel || 'Rückmeldung'} intro="Den Fall selbst hast du auf diesem Gerät nicht geöffnet. Öffnest du den Link zum Fall hier, steht die Rückmeldung neben deinen Antworten.">
      <Rueckmeldungsansicht r={r} />
    </Seite>
  );
}

/** Rückmeldung, die als Text (Mail, Lernplattform) kam: einfügen statt Link öffnen. */
function RueckmeldungEinfuegen({ fertig }: { fertig: (r: Rueckmeldung) => void }) {
  const [text, setText] = useState('');
  const [fehler, setFehler] = useState('');
  async function los() {
    setFehler('');
    try {
      const r = await findeRueckmeldung(text);
      if (!r) { setFehler('Keine Rückmeldung gefunden. Sie steht als Link mit „rueckmeldung“ oder als „LSP-BEWERTUNG[…]“ im Text.'); return; }
      merkeRueckmeldung(r);
      setText('');
      fertig(r);
    } catch (e) { setFehler((e as Error).message); }
  }
  return (
    <details className="klasse__block">
      <summary>Rückmeldung als Text bekommen?</summary>
      <label className="field"><span>Text der Lehrkraft einfügen</span><textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <button type="button" disabled={!text.trim()} onClick={los}>Rückmeldung öffnen</button>
      {fehler && <div className="note warn" role="alert">{fehler}</div>}
    </details>
  );
}

const fristTage = (frist: string) => Math.ceil((new Date(`${frist}T23:59:59`).getTime() - Date.now()) / 864e5);

function Start() {
  const [eigene] = useState(eigeneFaelle);
  const [erhalten, setErhalten] = useState(erhalteneFaelle);
  const [vorlage, setVorlage] = useState('');
  const [, setNeu] = useState(0);
  // Offene zuerst, nach Frist; abgegebene danach
  const sortiert = [...erhalten].sort((x, y) => {
    const ax = arbeitZu(x.id).abgegeben ? 1 : 0; const ay = arbeitZu(y.id).abgegeben ? 1 : 0;
    if (ax !== ay) return ax - ay;
    return (x.frist ?? '9999').localeCompare(y.frist ?? '9999');
  });

  return (
    <Seite titel="Klassenmodus" intro="Eine Lehrkraft verteilt einen Fall per Link, alle bearbeiten ihn auf ihrem Handy, Tablet oder Rechner und schicken die Abgabe zurück. Ohne Anmeldung und ohne Server: Der Fall steckt im Link, die Abgaben kommen als Nachricht.">
      <div className="klasse__start">
        <div className="card">
          <h3>Fälle, die ich bearbeite</h3>
          {erhalten.length === 0
            ? <p className="muted">Noch keiner. Öffne den Link, den du von deiner Lehrkraft bekommen hast.</p>
            : (
              <ul className="klasse__liste">
                {sortiert.map((f) => {
                  const a = arbeitZu(f.id);
                  const r = rueckmeldungZu(f.id);
                  const tage = f.frist && !a.abgegeben ? fristTage(f.frist) : null;
                  const stand = r ? `Rückmeldung${r.max ? `: ${r.punkte ?? 0}/${r.max} P.` : ''}${r.note ? `, Note ${r.note}` : ''}`
                    : a.abgegeben ? 'abgegeben'
                    : tage === null ? 'offen' : tage < 0 ? 'Frist vorbei' : tage === 0 ? 'heute fällig' : tage === 1 ? 'morgen fällig' : `noch ${tage} Tage`;
                  return (
                    <li key={f.id}>
                      <button type="button" className="link" onClick={() => navigate(`/lernen/klasse/fall?id=${f.id}`)}>{f.titel}</button>
                      <span className="muted">{ART_LABEL[f.art]}{f.frist ? ` · bis ${fristText(f.frist)}` : ''} · <span className={tage !== null && tage <= 1 ? 'klasse__dringend' : ''}>{stand}</span></span>
                      <button type="button" className="ghost small" onClick={() => { if (confirm(`„${f.titel}“ und deine Antworten von diesem Gerät löschen?`)) { vergiss(f.id); setErhalten(erhalteneFaelle()); } }}>Entfernen</button>
                    </li>
                  );
                })}
              </ul>
            )}
          <RueckmeldungEinfuegen fertig={(r) => { setNeu((n) => n + 1); navigate(erhalten.some((f) => f.id === r.fallId) ? `/lernen/klasse/fall?id=${r.fallId}` : `/lernen/klasse/rueckmeldung?id=${r.fallId}`); }} />
        </div>

        <div className="card">
          <h3>Fall an die Klasse verteilen</h3>
          <p className="muted">Für Lehrkräfte und Praxisanleitung, oder um mit der Lerngruppe zu üben. Klassen, Bewertung mit Punkten und Noten und Rückmeldungen findest du im <button type="button" className="link" onClick={() => navigate('/lehren')}>Lehrermodus</button>.</p>
          <div className="row klasse__knoepfe">
            <button type="button" className="primary" onClick={() => navigate('/lernen/klasse/neu')}>Eigenen Fall schreiben</button>
          </div>
          <label className="field klasse__vorlage">
            <span>Oder aus einer Vorlage (mit Lösung und Checkliste)</span>
            <select value={vorlage} onChange={(e) => setVorlage(e.target.value)}>
              <option value="">Vorlage wählen …</option>
              {VORLAGE_GRUPPEN.map((g) => (
                <optgroup key={g.art} label={g.label}>
                  {VORLAGEN.filter((v) => v.art === g.art).map((v) => <option key={v.id} value={v.id}>{v.titel}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <button type="button" disabled={!vorlage} onClick={() => navigate(`/lernen/klasse/neu?vorlage=${encodeURIComponent(vorlage)}`)}>Vorlage anpassen</button>

          {eigene.length > 0 && (
            <>
              <h4>Verteilte Fälle</h4>
              <ul className="klasse__liste">
                {eigene.map((f) => (
                  <li key={f.id}>
                    <button type="button" className="link" onClick={() => navigate(`/lernen/klasse/lehrkraft?id=${f.id}`)}>{f.titel}</button>
                    <span className="muted">{ART_LABEL[f.art]} · {abgabenZu(f.id).length} Abgaben</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Seite>
  );
}

export default function Klassenmodus() {
  const { segments } = useRoute();
  switch (segments[2]) {
    case 'fall': return <KlasseFall />;
    case 'lehrkraft': return <LehrkraftFall />;
    case 'neu': return <Neu />;
    case 'abgabe': return <AbgabeAusLink />;
    case 'rueckmeldung': return <RueckmeldungAusLink />;
    default: return <Start />;
  }
}
