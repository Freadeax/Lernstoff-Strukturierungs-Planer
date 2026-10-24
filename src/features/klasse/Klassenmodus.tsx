import { useEffect, useState } from 'react';
import './klasse.css';
import { navigate, useRoute } from '../../ui/shell/router';
import { Bearbeiten } from './Bearbeiten';
import { Editor } from './Editor';
import { leseFall } from './kodierung';
import { Lehrkraft } from './Lehrkraft';
import { arbeitZu, eigeneFaelle, erhalteneFaelle, merkeErhalten, speichereEigenen, abgabenZu, vergiss } from './speicher';
import { fristText } from './teilen';
import { ART_LABEL, type KlassenFall } from './typen';
import { leererFall, VORLAGEN } from './vorlagen';

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

function Start() {
  const [eigene] = useState(eigeneFaelle);
  const [erhalten, setErhalten] = useState(erhalteneFaelle);
  const [vorlage, setVorlage] = useState('');

  return (
    <Seite titel="Klassenmodus" intro="Eine Lehrkraft verteilt einen Fall per Link, alle bearbeiten ihn auf ihrem Handy, Tablet oder Rechner und schicken die Abgabe zurück. Ohne Anmeldung und ohne Server: Der Fall steckt im Link, die Abgaben kommen als Nachricht.">
      <div className="klasse__start">
        <div className="card">
          <h3>Fälle, die ich bearbeite</h3>
          {erhalten.length === 0
            ? <p className="muted">Noch keiner. Öffne den Link, den du von deiner Lehrkraft bekommen hast.</p>
            : (
              <ul className="klasse__liste">
                {erhalten.map((f) => {
                  const a = arbeitZu(f.id);
                  return (
                    <li key={f.id}>
                      <button type="button" className="link" onClick={() => navigate(`/lernen/klasse/fall?id=${f.id}`)}>{f.titel}</button>
                      <span className="muted">{ART_LABEL[f.art]}{f.frist ? ` · bis ${fristText(f.frist)}` : ''} · {a.abgegeben ? 'abgegeben' : 'offen'}</span>
                      <button type="button" className="ghost small" onClick={() => { if (confirm(`„${f.titel}“ und deine Antworten von diesem Gerät löschen?`)) { vergiss(f.id); setErhalten(erhalteneFaelle()); } }}>Entfernen</button>
                    </li>
                  );
                })}
              </ul>
            )}
        </div>

        <div className="card">
          <h3>Fall an die Klasse verteilen</h3>
          <p className="muted">Für Lehrkräfte und Praxisanleitung, oder um mit der Lerngruppe zu üben.</p>
          <div className="row klasse__knoepfe">
            <button type="button" className="primary" onClick={() => navigate('/lernen/klasse/neu')}>Eigenen Fall schreiben</button>
          </div>
          <label className="field klasse__vorlage">
            <span>Oder aus einer Vorlage (mit Lösung und Checkliste)</span>
            <select value={vorlage} onChange={(e) => setVorlage(e.target.value)}>
              <option value="">Vorlage wählen …</option>
              <optgroup label="SIS">
                {VORLAGEN.filter((v) => v.art === 'sis').map((v) => <option key={v.id} value={v.id}>{v.titel}</option>)}
              </optgroup>
              <optgroup label="Pflegeplanung">
                {VORLAGEN.filter((v) => v.art === 'pflegeplanung').map((v) => <option key={v.id} value={v.id}>{v.titel}</option>)}
              </optgroup>
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
    default: return <Start />;
  }
}
