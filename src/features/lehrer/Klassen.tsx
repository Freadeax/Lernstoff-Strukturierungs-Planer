import { useMemo, useState } from 'react';
import { navigate, useRoute } from '../../ui/shell/router';
import { abgabenZu, eigeneFaelle } from '../klasse/speicher';
import { dateiname, fristText, speichereDatei } from '../klasse/teilen';
import { ART_LABEL } from '../klasse/typen';
import { bewertungenZu, klasseMitId, klassen, loescheKlasse, neueKlasse, notenschluessel, speichereKlasse } from './speicher';
import { prozentText, Seite, StatusMarke } from './teile';
import { STATUS_LABEL, type Klasse } from './typen';
import { klassenMatrix, matrixCsv } from './uebersicht';

function Liste() {
  const ks = klassen();
  return (
    <Seite titel="Klassen" intro="Eine Klasse bündelt Fälle und zeigt in einer Übersicht, wer abgegeben hat, was bewertet ist und wie es der Klasse insgesamt geht."
      aktion={<button type="button" className="primary" onClick={() => navigate('/lehren/klassen?neu=1')}>Neue Klasse</button>}>
      {!ks.length
        ? <div className="card"><p className="muted">Noch keine Klasse. Lege eine an, zum Beispiel „Kurs 2024 A“ oder „Praxisanleitung Station 3“.</p></div>
        : (
          <div className="lehrer__karten">
            {ks.map((k) => {
              const abg = k.faelle.reduce((s, f) => s + abgabenZu(f).length, 0);
              return (
                <button key={k.id} type="button" className="card lehrer__karte" onClick={() => navigate(`/lehren/klassen?id=${k.id}`)}>
                  <strong>{k.name}</strong>
                  <span className="muted">{k.lernende.length} Lernende · {k.faelle.length} Fälle · {abg} Abgaben</span>
                </button>
              );
            })}
          </div>
        )}
    </Seite>
  );
}

function Bearbeiten({ start, neu, fertig }: { start: Klasse; neu: boolean; fertig?: () => void }) {
  const [k, setK] = useState(start);
  const [namen, setNamen] = useState(start.lernende.join('\n'));
  const faelle = eigeneFaelle();
  const [fehler, setFehler] = useState('');

  function speichern(e: React.FormEvent) {
    e.preventDefault();
    if (!k.name.trim()) { setFehler('Bitte einen Namen eingeben.'); return; }
    const lernende = namen.split(/\n|;/).map((x) => x.trim()).filter(Boolean).slice(0, 200);
    if (!speichereKlasse({ ...k, lernende })) { setFehler('Speichern nicht möglich (privater Modus oder Speicher voll).'); return; }
    if (fertig) fertig(); else navigate(`/lehren/klassen?id=${k.id}`);
  }

  return (
    <form className="card lehrer__form" onSubmit={speichern}>
      <h2 className="lehrer__h">{neu ? 'Neue Klasse' : 'Klasse bearbeiten'}</h2>
      <label className="field"><span>Name der Klasse</span>
        <input value={k.name} onChange={(e) => setK({ ...k, name: e.target.value })} placeholder="z. B. Kurs 2024 A" required />
      </label>
      <label className="field"><span>Lernende (optional): ein Name oder Kürzel je Zeile, so wie sie bei der Abgabe eingeben</span>
        <textarea rows={6} value={namen} onChange={(e) => setNamen(e.target.value)} placeholder={'Lea K.\nTom B.\nAyşe Y.'} />
      </label>
      <p className="muted">Mit Liste siehst du, wer noch fehlt. Kürzel oder Vornamen reichen. Die Liste bleibt auf diesem Gerät und kommt in keinen Link.</p>
      {faelle.length > 0 && (
        <fieldset className="klasse__teil">
          <legend>Fälle dieser Klasse</legend>
          {faelle.map((f) => (
            <label key={f.id} className="lehrer__haken">
              <input type="checkbox" checked={k.faelle.includes(f.id)} onChange={(e) => setK({ ...k, faelle: e.target.checked ? [...k.faelle, f.id] : k.faelle.filter((x) => x !== f.id) })} />
              <span>{f.titel} <span className="muted">· {ART_LABEL[f.art]}{f.frist ? ` · bis ${fristText(f.frist)}` : ''}</span></span>
            </label>
          ))}
        </fieldset>
      )}
      {fehler && <div className="note warn" role="alert">{fehler}</div>}
      <div className="row klasse__knoepfe">
        <button type="submit" className="primary">Speichern</button>
        <button type="button" className="ghost" onClick={() => (fertig ? fertig() : history.back())}>Abbrechen</button>
      </div>
    </form>
  );
}

function Detail({ id }: { id: string }) {
  const [stand, setStand] = useState(0);
  const klasse = useMemo(() => { void stand; return klasseMitId(id); }, [id, stand]);
  if (!klasse) return <Seite titel="Klasse"><div className="card"><div className="note warn" role="alert">Diese Klasse gibt es auf diesem Gerät nicht.</div></div></Seite>;
  return <DetailAnsicht klasse={klasse} neuLaden={() => setStand((n) => n + 1)} />;
}

function DetailAnsicht({ klasse, neuLaden }: { klasse: Klasse; neuLaden: () => void }) {
  const [bearbeiten, setBearbeiten] = useState(false);
  const schluessel = notenschluessel();
  const faelle = useMemo(() => {
    const alle = eigeneFaelle();
    return klasse.faelle.map((id) => alle.find((f) => f.id === id)).filter((f) => !!f)
      .sort((a, b) => (a.frist ?? a.erstellt).localeCompare(b.frist ?? b.erstellt));
  }, [klasse]);
  const m = useMemo(() => klassenMatrix(klasse, faelle, { abgaben: abgabenZu, bewertungen: bewertungenZu, schluessel, jetzt: new Date() }), [klasse, faelle, schluessel]);

  if (bearbeiten) return <Seite titel={klasse.name}><Bearbeiten start={klasse} neu={false} fertig={() => { setBearbeiten(false); neuLaden(); }} /></Seite>;

  function loeschen() {
    if (!confirm(`Klasse „${klasse.name}“ löschen? Die Fälle und Abgaben bleiben erhalten.`)) return;
    loescheKlasse(klasse.id);
    navigate('/lehren/klassen');
  }

  const fremde = m.zeilen.filter((z) => !z.inListe);
  return (
    <Seite titel={klasse.name} intro={`${klasse.lernende.length} Lernende in der Liste · ${faelle.length} Fälle`}
      aktion={<button type="button" onClick={() => setBearbeiten(true)}>Bearbeiten</button>}>
      {!faelle.length ? (
        <div className="card">
          <p className="muted">Dieser Klasse ist noch kein Fall zugeordnet.</p>
          <div className="row klasse__knoepfe">
            <button type="button" className="primary" onClick={() => setBearbeiten(true)}>Fälle zuordnen</button>
            <button type="button" onClick={() => navigate('/lernen/klasse/neu')}>Neuen Fall schreiben</button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="klasse__kopf">
            <h2 className="lehrer__h">Klassenübersicht</h2>
            <span className="row">
              <button type="button" className="small" onClick={() => speichereDatei(`${dateiname(klasse.name)}-uebersicht.csv`, matrixCsv(m, (s) => STATUS_LABEL[s]), 'text/csv;charset=utf-8')}>Als Tabelle (CSV)</button>
              <button type="button" className="small ghost" onClick={() => window.print()}>Drucken</button>
            </span>
          </div>
          <div className="lehrer__tabelle-rahmen" tabIndex={0} role="region" aria-label="Klassenübersicht, waagrecht scrollbar">
            <table className="lehrer__tabelle">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  {m.spalten.map((s) => (
                    <th key={s.fall.id} scope="col">
                      <button type="button" className="link" onClick={() => navigate(`/lehren/bewerten?fall=${s.fall.id}`)}>{s.fall.titel}</button>
                      <span className="muted lehrer__unter">{s.abgegeben} abgegeben · {s.bewertet} bewertet{s.schnitt !== null ? ` · Ø ${prozentText(s.schnitt)}` : ''}</span>
                    </th>
                  ))}
                  <th scope="col">Ø</th>
                </tr>
              </thead>
              <tbody>
                {m.zeilen.map((z) => (
                  <tr key={z.name}>
                    <th scope="row">{z.name}{!z.inListe && <span className="muted lehrer__unter">nicht in der Liste</span>}</th>
                    {z.zellen.map((c, i) => (
                      <td key={m.spalten[i]!.fall.id}>
                        {c.abgabe
                          ? <button type="button" className="lehrer__zelle" onClick={() => navigate(`/lehren/bewerten?fall=${m.spalten[i]!.fall.id}&name=${encodeURIComponent(c.abgabe!.name)}`)}>
                              <StatusMarke status={c.status} kurz />
                              {c.prozent !== null && <span>{prozentText(c.prozent)}{c.note ? ` · ${c.note}` : ''}</span>}
                            </button>
                          : <StatusMarke status={c.status} kurz />}
                      </td>
                    ))}
                    <td>{prozentText(z.schnitt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!m.zeilen.length && <p className="muted">Noch keine Namensliste und keine Abgaben.</p>}
          {fremde.length > 0 && klasse.lernende.length > 0 && (
            <p className="muted">{fremde.length} Name{fremde.length === 1 ? '' : 'n'} aus Abgaben steh{fremde.length === 1 ? 't' : 'en'} nicht in der Liste. Unter <button type="button" className="link" onClick={() => navigate('/lehren/abgaben')}>Abgaben</button> kannst du sie zuordnen oder aufnehmen.</p>
          )}
        </div>
      )}
      <div className="row klasse__knoepfe">
        <button type="button" onClick={() => navigate('/lehren/klassen')}>Alle Klassen</button>
        <button type="button" className="danger small" onClick={loeschen}>Klasse löschen</button>
      </div>
    </Seite>
  );
}

export default function Klassen() {
  const { params } = useRoute();
  const id = params.get('id');
  if (params.get('neu')) return <Neu />;
  if (id) return <Detail key={id} id={id} />;
  return <Liste />;
}

function Neu() {
  const [k] = useState(() => ({ ...neueKlasse(''), name: '' }));
  return <Seite titel="Neue Klasse"><Bearbeiten start={k} neu /></Seite>;
}
