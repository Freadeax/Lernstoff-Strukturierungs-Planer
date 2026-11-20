// Praxissimulator: Fallauswahl nach CE und Drittel, Stufe 1 (geführt) und Stufe 2 (Arbeitsplatz) auf dem neuen Kern.
// Der alte Simulator (engine.ts, scenarios.json, Leitfälle) ist mit P10 entfernt. Alte Links (?fall=, ?gefuehrt=<alt>,
// ?neu=<alt>) zeigen über altfaelle.ts auf den Nachfolgefall; das alte Archiv bleibt als Liste lesbar.
//
// Routen: ?neu=<fall> Arbeitsplatz · ?gefuehrt=<fall> Stufe 1 · ?fall=<fall|alt> wie ?neu= · ?thema=<topic> · ?kb=<kh.id> · ?ce=<ce.id>
import { useEffect } from 'react';
import { getModule, modules } from '../../modules/registry';
import type { CatalogModule } from '../../modules/catalog-types';
import { PageHeading } from '../../ui/PageHeading';
import { useStore } from '../../ui/lib/store';
import { navigate, useRoute } from '../../ui/shell/router';
import { session as shellSession } from '../../ui/shell/session';
import { ceListe } from '../ce/modell';
import { faelleZuKrankheit, PRAXIS_KRANKHEITEN } from '../krankheitsbilder/fallbezug';
import { ALT_ZU_NEU, ALTFALL_TITEL, altesArchiv, dauerText, neuerFall } from './altfaelle';
import { Arbeitsplatz } from './arbeitsplatz/Arbeitsplatz';
import { erledigteFaelle } from './erledigt';
import { FallauswahlCe } from './FallauswahlCe';
import { FALL_KOEPFE, type FallKopf } from './kern/faelle/katalog';
import { useFall } from './kern/faelle/laden';
import { Stufe1 } from './stufe1/Stufe1';
import { kernZuThema } from './themen';
import './praxis.css';

const KERN_IDS = FALL_KOEPFE.map((f) => f.id);
const finde = (id: string | undefined) => (id ? FALL_KOEPFE.find((f) => f.id === id) : undefined);
const alterText = (f: FallKopf) => (f.person.alter.jahre !== undefined ? `${f.person.alter.jahre} Jahre` : `${f.person.alter.monate ?? 0} Monate`);

/** Fallzeile für Sprünge (Thema, Krankheitsbild): Titel, Person, beide Stufen. */
function FallZeile({ f, erledigt }: { f: FallKopf; erledigt: boolean }) {
  return <li className="praxis-fall praxis-fall--kern">
    <span className="praxis-fall__ohnebild" aria-hidden="true" />
    <div className="praxis-fall__text"><h3>{f.titel}</h3><p>{f.person.name}, {alterText(f)} · {f.kurz}</p>
      {erledigt && <p className="praxis-fall__marken"><span className="praxis-marke">abgeschlossen</span></p>}</div>
    <div className="praxis-fall__knoepfe"><button className="primary" onClick={() => navigate(`/lernen/praxis?neu=${f.id}`)}>Neu üben</button><button onClick={() => navigate(`/lernen/praxis?gefuehrt=${f.id}`)}>Geführt üben</button></div>
  </li>;
}

/** Abschlüsse aus dem alten Simulator: nur lesen, mit Weg zum Nachfolgefall. */
function AltesArchiv() {
  const liste = altesArchiv();
  if (!liste.length) return null;
  return <details className="card praxis-mehr"><summary>Abgeschlossene Übungen im bisherigen Simulator ({liste.length})</summary>
    <p className="muted">Der bisherige Simulator ist durch den neuen Arbeitsplatz ersetzt. Deine Abschlüsse bleiben auf diesem Gerät und in der Datensicherung erhalten, lassen sich aber nicht mehr öffnen. Jeder Fall hat einen Nachfolger.</p>
    <ul className="praxis-archiv">{liste.map((a) => {
      const neu = finde(ALT_ZU_NEU[a.fall]);
      return <li key={a.id}><span>{a.titel} · {a.fertig ? `abgeschlossen nach ${dauerText(a.sekunden)}` : 'nicht abgeschlossen'}</span>
        {neu && <button type="button" className="link" onClick={() => navigate(`/lernen/praxis?neu=${neu.id}`)}>Nachfolger: {neu.titel.replace(/[„“]/g, '')}</button>}</li>;
    })}</ul>
  </details>;
}

/** Einen Fall öffnen: Nur dieser Fall wird geladen, nicht alle (Audit L-3). */
function FallOeffnen({ id, stufe }: { id: string; stufe: 'neu' | 'gefuehrt' }) {
  const ladung = useFall(id);
  const zurueck = () => navigate('/lernen/praxis');
  if (ladung.status === 'fehler') return <section className="page praxis">
    <p className="note warn" role="alert">Der Fall ließ sich nicht laden. Ohne Netz geht das nur, wenn die App schon einmal vollständig geladen war. <button type="button" className="link" onClick={() => location.reload()}>Neu laden</button></p>
  </section>;
  if (ladung.status !== 'da') return <p className="muted" role="status">Fall wird geöffnet …</p>;
  const fall = ladung.fall;
  return stufe === 'neu'
    ? <section className="page praxis praxis--arbeitsplatz"><Arbeitsplatz key={fall.id} fall={fall} onZurueck={zurueck} /></section>
    : <section className="page praxis praxis--gefuehrt praxis--stufe1">
      <Stufe1 key={fall.id} fall={fall} onZurueck={zurueck} onFrei={() => navigate(`/lernen/praxis?neu=${fall.id}`)} />
    </section>;
}

export default function Praxissimulator() {
  const { params } = useRoute();
  const moduleId = useStore(shellSession, (x) => x.moduleId);
  const modul = (getModule(moduleId) ?? modules[0]) as CatalogModule | undefined;

  // Alte Links: ?fall=<alt|neu> und alte IDs in ?neu=/?gefuehrt= auf die kanonische Adresse umschreiben.
  const fallParam = params.get('fall') ?? '';
  const neuRoh = params.get('neu') ?? '';
  const gefuehrtRoh = params.get('gefuehrt') ?? '';
  const umleitung = fallParam ? `neu=${neuerFall(fallParam, KERN_IDS) ?? ''}`
    : ALT_ZU_NEU[neuRoh] ? `neu=${ALT_ZU_NEU[neuRoh]}`
      : ALT_ZU_NEU[gefuehrtRoh] ? `gefuehrt=${ALT_ZU_NEU[gefuehrtRoh]}` : '';
  useEffect(() => {
    if (!umleitung) return;
    const ziel = umleitung.endsWith('=') ? '#/lernen/praxis' : `#/lernen/praxis?${umleitung}`;
    try { location.replace(ziel); } catch { navigate(ziel.slice(1)); }
  }, [umleitung]);
  if (umleitung && !umleitung.endsWith('=')) return <p className="muted" role="status">Fall wird geöffnet …</p>;

  const neuFall = finde(neuRoh);
  if (neuFall) return <FallOeffnen key={`neu:${neuFall.id}`} id={neuFall.id} stufe="neu" />;
  const gefuehrtFall = finde(gefuehrtRoh);
  if (gefuehrtFall) return <FallOeffnen key={`gefuehrt:${gefuehrtFall.id}`} id={gefuehrtFall.id} stufe="gefuehrt" />;

  const thema = params.get('thema') ?? '';
  const kb = params.get('kb') ?? '';
  const ceParam = params.get('ce') ?? '';
  const erledigt = erledigteFaelle();
  const zumKb = kb ? faelleZuKrankheit(PRAXIS_KRANKHEITEN, kb).map(finde).filter((f): f is FallKopf => !!f) : [];
  const kbName = kb ? modul?.diseaseProfiles?.find((p) => p.id === kb)?.name ?? kb : '';
  const zumThema = thema && !kb ? kernZuThema(thema).map(finde).filter((f): f is FallKopf => !!f) : [];
  const themaName = thema ? modul?.topics.find((t) => t.id === thema)?.name ?? thema : '';
  const sprung = kb ? zumKb : thema ? zumThema : null;
  const alleZeigen = <button type="button" className="link" onClick={() => navigate('/lernen/praxis')}>Alle Fälle zeigen</button>;
  const unbekannt = (neuRoh && !neuFall) || (gefuehrtRoh && !gefuehrtFall) || (fallParam && umleitung.endsWith('='));

  return <section className="page praxis">
    <PageHeading eyebrow="Generalistische Pflegeausbildung" title="Praxissimulator" description="Beobachten. Entscheiden. Handeln. Ein eigener Übungsraum mit regelbasiertem Patientenverlauf – ohne KI und ohne API-Schlüssel." />
    {unbekannt && <p className="note warn" role="alert">Diesen Fall gibt es nicht (mehr). {ALTFALL_TITEL[fallParam || neuRoh || gefuehrtRoh] ? 'Er wurde ersetzt; wähle unten den passenden neuen Fall.' : 'Wähle unten einen Fall.'}</p>}
    <div className="praxis-stufen">
      <div><span className="praxis-stufen__marke">Stufe 1</span><h2>Geführt</h2><p>Schritt für Schritt durch den Fall. Je Schritt wenige Möglichkeiten und sofort eine Rückmeldung mit Begründung. Empfohlen im 1. Ausbildungsdrittel.</p></div>
      <div><span className="praxis-stufen__marke">Stufe 2</span><h2>Frei</h2><p>Derselbe Patient am Arbeitsplatz: Du entscheidest selbst, was du wann tust. Die Uhr läuft, die Auswertung kommt am Ende.</p></div>
    </div>
    {sprung ? <>
      <p className="note" role="status">{kb
        ? (sprung.length ? <>Fälle zum Krankheitsbild <strong>{kbName}</strong>. </> : <>Zum Krankheitsbild <strong>{kbName}</strong> gibt es noch keinen Praxisfall. </>)
        : (sprung.length ? <>Fälle zum Thema <strong>{themaName}</strong>. </> : <>Zum Thema <strong>{themaName}</strong> gibt es noch keinen Praxisfall. </>)}{alleZeigen}</p>
      {sprung.length > 0 && <ul className="praxis-fallliste">{sprung.map((f) => <FallZeile key={f.id} f={f} erledigt={erledigt.has(f.id)} />)}</ul>}
    </> : <FallauswahlCe ces={modul ? ceListe(modul) : []} kern={FALL_KOEPFE} nurCe={ceParam || undefined} erledigt={erledigt} />}
    <p className="praxis-disclaimer">Fiktive Fälle mit vereinfachtem Verlauf, fachlich noch nicht freigegeben. Speicherung nur auf diesem Gerät.</p>
    <AltesArchiv />
  </section>;
}
