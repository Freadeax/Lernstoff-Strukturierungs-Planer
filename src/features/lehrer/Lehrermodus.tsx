import { useMemo, useState } from 'react';
import '../klasse/klasse.css';
import './lehrer.css';
import { navigate, useRoute } from '../../ui/shell/router';
import { abgabenZu, eigeneFaelle } from '../klasse/speicher';
import { fristText } from '../klasse/teilen';
import { bewertungenZu, klassen, klassenVonFall } from './speicher';
import { AbgabenEinlesen, Seite } from './teile';
import { nameSchluessel } from './typen';
import { fristVorbei, status } from './uebersicht';

import Abgaben from './Abgaben';
import Aufgaben from './Aufgaben';
import Bewerten from './Bewerten';
import Einstellungen from './Einstellungen';
import Klassen from './Klassen';

// Routen: /lehren (Übersicht), /lehren/klassen, /lehren/aufgaben, /lehren/abgaben,
// /lehren/bewerten?fall=…[&name=…], /lehren/einstellungen.

const SCHRITTE = [
  { nr: 1, titel: 'Klasse anlegen', text: 'Name und, wenn du willst, die Namensliste.', ziel: '/lehren/klassen' },
  { nr: 2, titel: 'Fall verteilen', text: 'Eigener Fall oder Vorlage, Link oder QR-Code an die Klasse.', ziel: '/lehren/aufgaben' },
  { nr: 3, titel: 'Abgaben einlesen', text: 'Nachrichten einfügen, Abgabe-Links öffnen oder Dateien wählen.', ziel: '/lehren/abgaben' },
  { nr: 4, titel: 'Bewerten', text: 'Punkte mit Vorschlag aus dem Code, Kommentare, Note.', ziel: '/lehren/aufgaben' },
  { nr: 5, titel: 'Rückmeldung geben', text: 'Jede Person bekommt ihren eigenen Link mit Punkten und Kommentaren.', ziel: '/lehren/aufgaben' },
] as const;

function Start() {
  const [stand, setStand] = useState(0);
  const daten = useMemo(() => {
    void stand;
    const jetzt = new Date();
    const faelle = eigeneFaelle();
    const ks = klassen();
    const jeFall = faelle.map((f) => {
      const ab = abgabenZu(f.id);
      const bw = bewertungenZu(f.id);
      const st = ab.map((a) => ({ a, s: status(f, a, bw[nameSchluessel(a.name)], jetzt), b: bw[nameSchluessel(a.name)] }));
      const liste = new Set(klassenVonFall(f.id).flatMap((k) => k.lernende.map(nameSchluessel)));
      const fehlen = [...liste].filter((n) => !ab.some((a) => nameSchluessel(a.name) === n)).length;
      return {
        f, abgaben: ab.length, fehlen,
        zuBewerten: st.filter((x) => x.s === 'abgegeben' || x.s === 'verspaetet' || x.s === 'neu').length,
        ungesendet: st.filter((x) => x.s === 'bewertet' && (!x.b?.gesendet || x.b.gesendet < x.b.bewertet)).length,
      };
    });
    const bald = jeFall.filter((x) => x.f.frist && !fristVorbei(x.f.frist, jetzt) && new Date(`${x.f.frist}T23:59:59`).getTime() - jetzt.getTime() < 8 * 864e5);
    return { faelle, ks, jeFall, bald };
  }, [stand]);

  const zuTun = daten.jeFall.filter((x) => x.zuBewerten || x.ungesendet);
  const leer = !daten.faelle.length && !daten.ks.length;

  return (
    <Seite titel="Lehrermodus" intro="Für Lehrkräfte und Praxisanleitung: Klassen führen, Fälle verteilen, Abgaben sammeln, bewerten und Rückmeldungen geben. Ohne Server und ohne Konten, alles bleibt auf diesem Gerät."
      aktion={<button type="button" className="primary" onClick={() => navigate('/lernen/klasse/neu')}>Neuer Fall</button>}>
      <ol className="lehrer__schritte" aria-label="So läuft es ab">
        {SCHRITTE.map((s) => (
          <li key={s.nr}>
            <button type="button" className="lehrer__schritt" onClick={() => navigate(s.ziel)}>
              <span className="klasse__nr" aria-hidden>{s.nr}</span>
              <span><strong>{s.titel}</strong><span className="muted"> {s.text}</span></span>
            </button>
          </li>
        ))}
      </ol>

      <div className="lehrer__raster">
        <div className="card">
          <h2 className="lehrer__h">Zu tun</h2>
          {leer && <p className="muted">Noch nichts angelegt. Beginne mit einer Klasse oder direkt mit einem Fall.</p>}
          {!leer && !zuTun.length && !daten.bald.length && <p className="muted">Alles erledigt: keine unbewerteten Abgaben, keine offenen Rückmeldungen.</p>}
          <ul className="klasse__liste">
            {zuTun.map(({ f, zuBewerten, ungesendet }) => (
              <li key={f.id}>
                <button type="button" className="link" onClick={() => navigate(`/lehren/bewerten?fall=${f.id}`)}>{f.titel}</button>
                <span className="muted">
                  {zuBewerten > 0 && `${zuBewerten} zu bewerten`}{zuBewerten > 0 && ungesendet > 0 && ' · '}{ungesendet > 0 && `${ungesendet} Rückmeldung${ungesendet === 1 ? '' : 'en'} noch nicht geschickt`}
                </span>
              </li>
            ))}
            {daten.bald.map(({ f, abgaben, fehlen }) => (
              <li key={`frist-${f.id}`}>
                <button type="button" className="link" onClick={() => navigate(`/lernen/klasse/lehrkraft?id=${f.id}`)}>{f.titel}</button>
                <span className="muted">Frist {fristText(f.frist!)} · {abgaben} abgegeben{fehlen ? ` · ${fehlen} fehlen noch` : ''}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="lehrer__h">Abgaben schnell einlesen</h2>
          <AbgabenEinlesen kompakt fertig={() => setStand((n) => n + 1)} />
        </div>

        <div className="card">
          <div className="klasse__kopf"><h2 className="lehrer__h">Klassen</h2><button type="button" className="small" onClick={() => navigate('/lehren/klassen?neu=1')}>+ Klasse</button></div>
          {!daten.ks.length
            ? <p className="muted">Eine Klasse bündelt Fälle und zeigt, wer abgegeben hat. Die Namensliste ist freiwillig.</p>
            : (
              <ul className="klasse__liste">
                {daten.ks.map((k) => (
                  <li key={k.id}>
                    <button type="button" className="link" onClick={() => navigate(`/lehren/klassen?id=${k.id}`)}>{k.name}</button>
                    <span className="muted">{k.lernende.length} Lernende · {k.faelle.length} Fälle</span>
                  </li>
                ))}
              </ul>
            )}
        </div>

        <div className="card">
          <div className="klasse__kopf"><h2 className="lehrer__h">Fälle</h2><button type="button" className="small" onClick={() => navigate('/lehren/aufgaben')}>Alle</button></div>
          {!daten.faelle.length
            ? <p className="muted">Noch kein Fall verteilt. Vorlagen aus SIS, Pflegeplanung, Übergabe, Pflegebericht, Krankheitsbildern und Assessments bringen Lösung und Checkliste schon mit.</p>
            : (
              <ul className="klasse__liste">
                {daten.jeFall.slice(0, 6).map(({ f, abgaben }) => (
                  <li key={f.id}>
                    <button type="button" className="link" onClick={() => navigate(`/lehren/bewerten?fall=${f.id}`)}>{f.titel}</button>
                    <span className="muted">{abgaben} Abgaben{f.frist ? ` · bis ${fristText(f.frist)}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          <div className="row klasse__knoepfe">
            <button type="button" onClick={() => navigate('/lernen/klasse/neu')}>Eigenen Fall schreiben</button>
            <button type="button" className="ghost" onClick={() => navigate('/lehren/aufgaben?vorlage=1')}>Aus Vorlage</button>
          </div>
        </div>
      </div>

      <p className="muted lehrer__fuss">
        Namen, Abgaben und Noten liegen nur in diesem Browser und in Datensicherungen dieses Geräts.{' '}
        <button type="button" className="link" onClick={() => navigate('/lehren/einstellungen')}>Notenschlüssel, Kommentar-Bausteine und Datenschutz</button>
      </p>
    </Seite>
  );
}

export default function Lehrermodus() {
  const { segments } = useRoute();
  switch (segments[1]) {
    case 'klassen': return <Klassen />;
    case 'aufgaben': return <Aufgaben />;
    case 'abgaben': return <Abgaben />;
    case 'bewerten': return <Bewerten />;
    case 'einstellungen': return <Einstellungen />;
    default: return <Start />;
  }
}
