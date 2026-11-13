import { liveQuery } from 'dexie';
import { useEffect, useMemo, useState } from 'react';
import { ladeThemen } from '../../core/topics';
import type { ID, Topic } from '../../core/types';
import { getModule } from '../../modules/registry';
import { Baum, Balken } from '../../ui/baum/Baum';
import { elternIds, filtereBlaetter, pfadZu, summiere, anteil, type BaumKnoten } from '../../ui/baum/baum';
import { Icon } from '../../ui/icons';
import { Menu } from '../../ui/Menu';
import { storage, useStore } from '../../ui/lib/store';
import { normalize } from '../../ui/lib/trie';
import { notify } from '../../ui/shell/notifications';
import { navigate, useRoute } from '../../ui/shell/router';
import { session } from '../../ui/shell/session';
import { computeAllProgress } from '../lernplan/progress';
import { assembleInput, heute, leafTopics, loadPlannerData } from '../lernplan/store';
import { resolveSettings } from '../lernplan/types';
import { legeThemaAn, umhaengenVerboten, verschiebeThema } from './pflege';
import { BAUM_FILTER, baueThemenbaum, fachKnoten, naechstesThema, passtFilter, standText, type BaumFilter, type BlattDaten } from './themenbaum';

// Themenbaum unter #/lernen/themen (Ansicht „Baum“): Fach › Bereich › Thema, je Ebene ein Balken
// mit der Verteilung des Wissensstands. Eigene Themen lassen sich anlegen und per Ziehen umhängen.

const OFFEN_KEY = 'lernstoff.themenbaum.offen';

interface Daten { baum: BaumKnoten[]; topics: Topic[] }

async function lade(moduleId: string): Promise<Daten> {
  const mod = getModule(moduleId);
  const topics = await ladeThemen(moduleId);
  const today = heute();
  const d = await loadPlannerData(topics, today);
  const input = assembleInput(d);
  const progress = computeAllProgress(leafTopics(topics), input.studyLogs, input.reviewLogs, today, resolveSettings(input), input.cardEvidence);
  const board = new Map(d.board.map((b) => [b.topicId, b.column]));
  return { topics, baum: baueThemenbaum({ subjects: mod?.subjects ?? [], topics, progress, board, heute: today }) };
}

function useThemenbaum(moduleId: string) {
  const [daten, setDaten] = useState<Daten | null>(null);
  const [fehler, setFehler] = useState<string>();
  useEffect(() => {
    // liveQuery: Baum aktualisiert sich nach Umhängen, Anlegen, Abfragen und Board-Änderungen.
    const sub = liveQuery(() => lade(moduleId)).subscribe({ next: (d) => { setDaten(d); setFehler(undefined); }, error: (e) => setFehler(e instanceof Error ? e.message : String(e)) });
    return () => sub.unsubscribe();
  }, [moduleId]);
  return { daten, fehler };
}

function ThemaAnlegen({ topics, subjects, vorgabe }: { topics: Topic[]; subjects: Array<{ id: ID; name: string; code?: string }>; vorgabe?: { subjectId: ID; parentId?: ID } }) {
  const [subjectId, setSubjectId] = useState(vorgabe?.subjectId ?? subjects[0]?.id ?? '');
  const [parentId, setParentId] = useState(vorgabe?.parentId ?? '');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (vorgabe) { setSubjectId(vorgabe.subjectId); setParentId(vorgabe.parentId ?? ''); } }, [vorgabe]);
  // Mögliche Oberthemen: alles mit Unterthemen und alle eigenen Themen des Fachs.
  const eltern = topics.filter((t) => t.subjectId === subjectId && (topics.some((c) => c.parentId === t.id) || t.id.startsWith('thema.eigen.')))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await legeThemaAn({ name, subjectId, parentId: parentId || undefined });
      notify('info', r.vorhanden ? 'Thema gibt es schon' : 'Thema angelegt', r.vorhanden ? 'Es ist im Baum markiert.' : name.trim());
      setName('');
      navigate(`/lernen/themen?ansicht=baum&thema=${encodeURIComponent(r.id)}`);
    } catch (err) { notify('critical', 'Thema nicht angelegt', err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  }
  return (
    <form className="themenbaum__anlegen" onSubmit={speichern}>
      <label className="field">Fach
        <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setParentId(''); }}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.code ? `${s.code} · ${s.name}` : s.name}</option>)}
        </select>
      </label>
      <label className="field">Oberthema
        <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">Keins (neuer Bereich)</option>
          {eltern.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
      <label className="field">Name des Themas
        <input value={name} onChange={(e) => setName(e.target.value)} minLength={4} maxLength={140} required placeholder="z. B. Wundversorgung bei Dekubitus" />
      </label>
      <button type="submit" className="primary" disabled={busy || name.trim().length < 4}><Icon name="plus" size={16} /> Anlegen</button>
    </form>
  );
}

export default function ThemenBaum() {
  const moduleId = useStore(session, (s) => s.moduleId);
  const { params } = useRoute();
  const markiert = params.get('thema') ?? undefined;
  const { daten, fehler } = useThemenbaum(moduleId);
  const [filter, setFilter] = useState<BaumFilter>('alle');
  const [suche, setSuche] = useState('');
  const [offen, setOffen] = useState<Set<string>>(() => new Set(storage.list<string>(OFFEN_KEY, (x) => typeof x === 'string')));
  const [anlegenBei, setAnlegenBei] = useState<{ subjectId: ID; parentId?: ID }>();
  const mod = getModule(moduleId);

  const merkeOffen = (n: Set<string>) => { setOffen(n); storage.write(OFFEN_KEY, n.size ? [...n] : null); };
  const umschalten = (id: string, auf: boolean) => { const n = new Set(offen); if (auf) n.add(id); else n.delete(id); merkeOffen(n); };

  // Beim ersten Besuch die Fächer aufklappen, beim Springen den Weg zum Thema.
  useEffect(() => {
    if (!daten) return;
    const pfad = markiert ? pfadZu(daten.baum, markiert) : undefined;
    if (pfad?.length && pfad.some((p) => !offen.has(p))) merkeOffen(new Set([...offen, ...pfad]));
    else if (!offen.size) setOffen(new Set(daten.baum.map((k) => k.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daten, markiert]);

  const nq = normalize(suche.trim());
  const gefiltert = useMemo(() => {
    if (!daten) return [];
    if (filter === 'alle' && !nq) return daten.baum;
    return filtereBlaetter(daten.baum, (k) => passtFilter(k, filter) && (!nq || normalize(k.label).includes(nq)));
  }, [daten, filter, nq]);
  // Bei Suche oder Filter alles Gefundene aufklappen, ohne die gemerkte Auswahl zu ändern.
  const sichtbarOffen = useMemo(() => (filter === 'alle' && !nq ? offen : new Set(elternIds(gefiltert))), [filter, nq, offen, gefiltert]);

  const zaehler = useMemo(() => {
    const c = new Map<BaumFilter, number>();
    if (daten) for (const f of BAUM_FILTER) c.set(f.id, filtereBlaetter(daten.baum, (k) => passtFilter(k, f.id)).reduce(function z(a: number, k: BaumKnoten): number { return k.kinder?.length ? k.kinder.reduce(z, a) : a + 1; }, 0));
    return c;
  }, [daten]);

  const gesamtSeg = useMemo(() => (daten ? summiere({ id: 'alle', label: 'Alle', kinder: daten.baum }) : []), [daten]);
  const weiter = useMemo(() => (daten ? naechstesThema(daten.baum) : undefined), [daten]);
  const topicById = useMemo(() => new Map((daten?.topics ?? []).map((t) => [t.id, t])), [daten]);

  async function verschiebe(id: string, zielId: string) {
    const parentId = zielId.startsWith('fach:') ? undefined : zielId;
    const topic = topicById.get(id);
    if (zielId.startsWith('fach:') && topic && fachKnoten(topic.subjectId) !== zielId) { notify('warning', 'Nicht umgehängt', 'Nur innerhalb desselben Fachs.'); return; }
    try {
      await verschiebeThema(id, parentId);
      if (parentId) umschalten(parentId, true);
      notify('info', 'Thema umgehängt', `${topic?.name ?? ''} → ${parentId ? topicById.get(parentId)?.name : 'oberste Ebene'}`);
    } catch (e) { notify('warning', 'Nicht umgehängt', e instanceof Error ? e.message : String(e)); }
  }

  /** Tastatur- und Touch-Alternative zum Ziehen: Menü mit erlaubten Zielen. */
  function umhaengenMenue(k: BaumKnoten) {
    const t = topicById.get(k.id);
    if (!t || !daten) return null;
    const ziele = [{ id: undefined as ID | undefined, label: 'Oberste Ebene des Fachs' },
      ...daten.topics.filter((z) => z.subjectId === t.subjectId).map((z) => ({ id: z.id as ID | undefined, label: z.name }))]
      .filter((z) => !umhaengenVerboten(t, z.id, daten.topics)).slice(0, 30);
    if (!ziele.length) return null;
    return <Menu label={`${t.name} umhängen`} className="small ghost" trigger={<span>Umhängen</span>}
      items={ziele.map((z) => ({ id: z.id ?? 'oben', label: z.label, onSelect: () => void verschiebe(t.id, z.id ?? fachKnoten(t.subjectId)) }))} />;
  }

  // Zusätze an den Zeilen: Umhängen für eigene Themen, „+“ an Bereichen.
  const mitZusatz = useMemo(() => {
    const ergaenze = (ks: BaumKnoten[]): BaumKnoten[] => ks.map((k) => {
      const d = k.daten as (Partial<BlattDaten> & { fach?: boolean }) | undefined;
      const plus = k.kinder?.length
        ? <button type="button" className="small ghost" aria-label={`Thema unter ${k.label} anlegen`} title="Thema hier anlegen"
            onClick={() => { setAnlegenBei({ subjectId: String(d?.subjectId ?? ''), parentId: d?.fach ? (typeof (d as { bereich?: string }).bereich === 'string' ? (d as { bereich?: string }).bereich : undefined) : k.id }); requestAnimationFrame(() => document.getElementById('themenbaum-anlegen')?.scrollIntoView({ block: 'center' })); }}>
            <Icon name="plus" size={16} />
          </button>
        : null;
      const zusatz = <>{d?.eigen ? umhaengenMenue(k) : null}{plus}</>;
      return { ...k, zusatz, ...(k.kinder ? { kinder: ergaenze(k.kinder) } : {}) };
    });
    return ergaenze(gefiltert);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gefiltert, daten]);

  if (fehler) return <p className="note warn" role="alert">Themenbaum konnte nicht geladen werden: {fehler}</p>;
  if (!daten) return <p className="muted" role="status">Themenbaum wird geladen …</p>;
  if (!daten.baum.length) return <p className="note">Für dieses Fachmodul sind noch keine Themen hinterlegt.</p>;

  return (
    <div className="themenbaum stack-3">
      <div className="card themenbaum__kopf">
        <div className="themenbaum__gesamt">
          <strong>{gesamtSeg.some((s) => s.key !== 'offen' && s.wert > 0)
            ? `${anteil(gesamtSeg, 'sicher')} % sicher · ${gesamtSeg.find((s) => s.key === 'offen')?.wert ?? 0} Themen noch offen`
            : 'Noch nichts begonnen: Alle Themen sind offen.'}</strong>
          <Balken segmente={gesamtSeg} />
          <ul className="statusliste" aria-label="Farben">
            {gesamtSeg.map((s) => <li key={s.key}><span className={`punkt baum-ton--${s.ton}`} aria-hidden="true" />{s.label} {s.wert}</li>)}
          </ul>
        </div>
        {weiter && (
          <div className="themenbaum__weiter">
            <span className="muted">Als Nächstes</span>
            <a className="button-link primary" href={`#${weiter.knoten.href}`}>{weiter.knoten.label} <Icon name="chevronRight" size={16} /></a>
            <small className="muted">{weiter.grund}</small>
          </div>
        )}
      </div>

      <div className="themenbaum__werkzeug">
        <label className="themen__search">
          <Icon name="search" size={16} />
          <span className="visually-hidden">Themen durchsuchen</span>
          <input type="search" value={suche} placeholder="Themen durchsuchen" onChange={(e) => setSuche(e.target.value)} />
        </label>
        <div className="pills" role="group" aria-label="Nach Stand filtern">
          {BAUM_FILTER.map((f) => (
            <button key={f.id} type="button" className="pill" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}<span className="pill__count">{zaehler.get(f.id) ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="themenbaum__knoepfe">
          <button type="button" className="small" onClick={() => merkeOffen(new Set(elternIds(daten.baum)))}>Alle aufklappen</button>
          <button type="button" className="small" onClick={() => merkeOffen(new Set())}>Alle zuklappen</button>
        </div>
      </div>

      {gefiltert.length === 0
        ? <p className="themen__none">Keine Themen passen zu Suche und Filter.</p>
        : <Baum knoten={mitZusatz} label={`Themenbaum ${mod?.name ?? ''}`.trim()} offen={sichtbarOffen} onOffen={umschalten}
            zahl={standText} onVerschiebe={(id, ziel) => void verschiebe(id, ziel)} markiert={markiert}
            darfAblegen={(id, ziel) => {
              const t = topicById.get(id);
              if (ziel.startsWith('fach:')) return !!t && fachKnoten(t.subjectId) === ziel && !umhaengenVerboten(t, undefined, daten.topics);
              return !umhaengenVerboten(t, ziel, daten.topics);
            }} />}

      <details className="card themenbaum__eigen" id="themenbaum-anlegen" open={!!anlegenBei || undefined}>
        <summary><strong>Eigenes Thema anlegen</strong></summary>
        <p className="muted">Für Stoff, der im Katalog fehlt. Eigene Themen kannst du am Griff <Icon name="grip" size={14} /> in einen anderen Bereich ziehen oder über „Umhängen“ verschieben. Katalogthemen bleiben fest.</p>
        <ThemaAnlegen topics={daten.topics} subjects={mod?.subjects ?? []} vorgabe={anlegenBei} />
      </details>
    </div>
  );
}
