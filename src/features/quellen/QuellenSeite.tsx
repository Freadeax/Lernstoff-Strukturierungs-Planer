// Quellen und Aktualität (#/system/quellen): Auf welchen festen Quellen beruhen die Inhalte, welche
// Fassung steht in der App, welche ist die neueste, wann wurde zuletzt nachgesehen und was ist fällig?
// Kein automatischer Abruf fremder Seiten: Die Seite führt zur offiziellen Stelle und erinnert.

import { useEffect, useMemo, useState } from 'react';
import '../qm/qm.css';
import './quellen.css';
import { PageHeading } from '../../ui/PageHeading';
import { notify } from '../../ui/shell/notifications';
import { useRoute } from '../../ui/shell/router';
import { kopiere } from '../klasse/teilen';
import { alleNutzungen, type Nutzung } from './nutzung';
import { ART_LABEL, ART_RANG, type QuellenArt } from './register';
import {
  alleStaende, entferneQuellenVermerk, ladeQuellenVermerke, quellenVermerkText, setzeQuellenVermerk, STATUS_LABEL, STATUS_TON, zaehle,
  type QuellenStand, type QuellenStatus,
} from './status';
import { heuteTag } from '../../ui/lib/time';

const heute = () => heuteTag();
const datum = (iso?: string) => (iso ? iso.slice(0, 10).split('-').reverse().join('.') : '');

type Filter = 'alle' | 'tun' | QuellenArt;
const FILTER: Array<{ id: Filter; label: string }> = [
  { id: 'tun', label: 'Zu tun' },
  { id: 'alle', label: 'Alle' },
  ...ART_RANG.map((a) => ({ id: a as Filter, label: ART_LABEL[a] })),
];
const ZU_TUN: QuellenStatus[] = ['abgleich', 'faellig', 'nie-geprueft'];
const TAG: Record<ReturnType<typeof ton>, string> = { kritisch: 'tag--critical', warn: 'tag--warning', gut: 'tag--wissen-sicher', neutral: '' };
function ton(s: QuellenStatus) { return STATUS_TON[s]; }

function Zahl({ label, wert, t, href }: { label: string; wert: number; t?: 'gut' | 'warn' | 'kritisch'; href: string }) {
  return <div className={`qm-zahl${t ? ` qm-zahl--${t}` : ''}`}><dt><a href={href}>{label}</a></dt><dd>{wert}</dd></div>;
}

/** Inhalte, die eine Quelle nutzen, nach Bereich gebündelt; veraltete zuerst. */
function Nutzungen({ s }: { s: QuellenStand }) {
  const gruppen = useMemo(() => {
    const m = new Map<string, Nutzung[]>();
    for (const n of s.nutzungen) m.set(n.bereich, [...(m.get(n.bereich) ?? []), n]);
    return [...m];
  }, [s]);
  if (!s.nutzungen.length) return <p className="muted">Wird in Texten, Glossar oder Katalog genutzt; keine einzelnen Fälle mit Quellenangabe.</p>;
  const alt = new Set(s.veraltet);
  return (
    <details className="quellen-nutzung" open={s.veraltet.length > 0 && s.veraltet.length <= 6}>
      <summary>Genutzt in {s.nutzungen.length} {s.nutzungen.length === 1 ? 'Inhalt' : 'Inhalten'}{s.veraltet.length ? `, davon ${s.veraltet.length} auf älterem Stand` : ''}</summary>
      <ul>
        {gruppen.map(([bereich, liste]) => (
          <li key={bereich}>
            <strong>{bereich}</strong>{' '}
            {liste.length > 8 && !liste.some((n) => alt.has(n))
              ? <span className="muted">{liste.length} Fälle, Stand {[...new Set(liste.map((n) => n.quelle.stand))].join(', ')}</span>
              : liste.map((n, i) => (
                <span key={`${n.inhalt}-${i}`}>{i > 0 && ' · '}<a href={`#${n.pfad}`}>{n.inhalt.replace(/^(Praxisfall|Fall|Diagnostik|Video|Assessment|ABCDE|Reanimation) /, '')}</a>
                  <span className={alt.has(n) ? 'quellen-alt' : 'muted'}> ({n.quelle.stand}{alt.has(n) ? ', älter' : ''})</span></span>
              ))}
          </li>
        ))}
      </ul>
    </details>
  );
}

function Eintrag({ s, hervor, onVermerk, onEntfernen }: {
  s: QuellenStand; hervor: boolean; onVermerk: (s: QuellenStand) => void; onEntfernen: (s: QuellenStand) => void;
}) {
  const e = s.eintrag;
  const appStaende = [...new Set(s.nutzungen.map((n) => n.quelle.stand))];
  const inApp = e.appStand ?? (appStaende.length ? appStaende.join(', ') : undefined);
  return (
    <li id={`quelle-${e.id}`} className={`card qm-eintrag quellen-eintrag quellen-eintrag--${s.status}${hervor ? ' is-hervor' : ''}`}>
      <div className="qm-eintrag__kopf">
        <h3>{e.titel}</h3>
        <span className={`tag ${TAG[ton(s.status)]}`}>{STATUS_LABEL[s.status]}</span>
      </div>
      <dl className="qm-dl">
        <dt>Herausgeber</dt><dd>{e.herausgeber}</dd>
        <dt>Neueste Fassung</dt><dd>{e.aktuell.stand}{e.aktuell.erschienen ? `, ${e.art === 'gesetz' ? 'gilt ab' : 'erschienen'} ${datum(e.aktuell.erschienen)}` : ''} · <a href={e.aktuell.fundstelle} target="_blank" rel="noreferrer">Fundstelle</a></dd>
        {inApp && <><dt>Stand in der App</dt><dd>{inApp}</dd></>}
        {!e.fest && <><dt>Zuletzt nachgesehen</dt><dd>{s.letztePruefung ? `${datum(s.letztePruefung)}${s.vermerk && s.vermerk.datum === s.letztePruefung ? ' (Vermerk auf diesem Gerät)' : ''}` : 'noch nie'}{s.naechstePruefung ? ` · nächste Prüfung ${datum(s.naechstePruefung)}` : ''}</dd></>}
      </dl>
      {e.kern && <p><strong>Was ist neu:</strong> {e.kern}</p>}
      {e.offen && <p className="quellen-offen"><strong>Abgleich offen:</strong> {e.offen}</p>}
      {!e.offen && s.veraltet.length > 0 && <p className="quellen-offen"><strong>Abgleich offen:</strong> {s.veraltet.length} {s.veraltet.length === 1 ? 'Inhalt nennt' : 'Inhalte nennen'} noch eine ältere Fassung. Inhalte gegen die neue Fassung prüfen, anpassen und die Quellenangabe erhöhen.</p>}
      {e.hinweis && <p className="muted">{e.hinweis}</p>}
      <Nutzungen s={s} />
      {!e.fest && (
        <div className="quellen-knoepfe">
          <a className="button-link" href={e.beobachten} target="_blank" rel="noreferrer">Beim Herausgeber nachsehen</a>
          <button type="button" className="ghost" onClick={() => onVermerk(s)}>Heute nachgesehen</button>
          {s.vermerk && <button type="button" className="ghost small" onClick={() => void kopiere(quellenVermerkText(s), 'Prüfvermerk')}>Vermerk zum Eintragen kopieren</button>}
          {s.vermerk && <button type="button" className="ghost small" onClick={() => onEntfernen(s)}>Vermerk entfernen</button>}
        </div>
      )}
    </li>
  );
}

function SoSichertDieApp() {
  return (
    <section className="card quellen-regeln" aria-labelledby="quellen-regeln-titel">
      <h2 id="quellen-regeln-titel">So sichert die App die Richtigkeit ab</h2>
      <ol>
        <li><strong>Feste Quellen statt Hörensagen.</strong> Jede fachliche Aussage stützt sich auf eine benannte Quelle mit Fassung. Rangfolge der Verbindlichkeit: Gesetz und Verordnung, dann DNQP-Expertenstandard, dann deutsche Leitlinie (NVL, AWMF S3 vor S2k), dann internationale Leitlinie, dann Empfehlung (z. B. KRINKO) und zuletzt Lehrbuch. Im Dienst gehen Anordnung und Standard deiner Einrichtung vor.</li>
        <li><strong>Nur mit Fundstelle.</strong> Eine neue Fassung kommt erst ins Register, wenn sie beim Herausgeber oder in einer zitierfähigen Veröffentlichung belegt ist.</li>
        <li><strong>„Nachgesehen“ heißt nachgesehen.</strong> Ohne Datum steht dort „noch nie nachgesehen“, nicht „aktuell“. Gesetze werden halbjährlich, Leitlinien jährlich wieder fällig, Entwürfe kurz danach.</li>
        <li><strong>Neue Fassung bleibt rot, bis die Inhalte angepasst sind.</strong> Erst wenn die Inhalte abgeglichen sind und ihre Quellenangabe den neuen Stand trägt, verschwindet der Hinweis. Betroffene Fälle zeigen ihn auch am Start („Neue Fassung …“).</li>
        <li><strong>Kein automatischer Abruf.</strong> Die App ruft keine fremden Seiten im Hintergrund ab. So funktioniert sie offline, und es fließen keine Daten ab. Stattdessen erinnert diese Seite und führt mit einem Tipp zur offiziellen Übersicht.</li>
      </ol>
      <h3>Wenn eine neue Fassung erschienen ist</h3>
      <ol>
        <li>Beim Herausgeber nachsehen und Erscheinungsdatum, Fassung und Fundstelle notieren.</li>
        <li>Prüfen, welche Inhalte betroffen sind („Genutzt in …“).</li>
        <li>Kernänderungen mit den Inhalten vergleichen; bei Notfall und Medikamenten zuerst.</li>
        <li>Inhalte anpassen, Quellenangabe erhöhen und im Änderungsverlauf vermerken.</li>
        <li>„Heute nachgesehen“ tippen und den Vermerk weitergeben, damit das Datum dauerhaft ins Register kommt.</li>
      </ol>
      <p className="muted">Mehr dazu: <a href="#/system/freigabe">Fachliche Freigabe mit Prüfbogen</a> · <a href="#/system/qualitaet">Inhaltsqualität</a> (Überarbeitungsliste, fachliche Prüfung je Trainer) · <a href="#/lernen/schnellsuche?ansicht=pruefen">Text gegen Expertenstandards prüfen</a> · Belegprüfung je Aussage unter <a href="#/material/zusammenfassen">Zusammenfassen</a>.</p>
    </section>
  );
}

/** Quellen und Aktualität: Register aller festen Quellen mit Stand, Prüfdatum und Erinnerung. */
export default function QuellenSeite() {
  const { params } = useRoute();
  const ziel = params.get('quelle') ?? '';
  const [vermerke, setVermerke] = useState(ladeQuellenVermerke);
  const nutzungen = useMemo(alleNutzungen, []);
  const staende = useMemo(() => alleStaende(nutzungen, heute(), vermerke), [nutzungen, vermerke]);
  const z = zaehle(staende);
  const vorgabe: Filter = ziel ? 'alle' : (params.get('filter') as Filter) ?? 'tun';
  const filter = FILTER.some((f) => f.id === vorgabe) ? vorgabe : 'tun';
  const sichtbar = staende.filter((s) => filter === 'alle' || (filter === 'tun' ? ZU_TUN.includes(s.status) : s.eintrag.art === filter));

  useEffect(() => {
    if (!ziel) return;
    const t = window.setTimeout(() => document.getElementById(`quelle-${ziel}`)?.scrollIntoView({ block: 'start' }), 150);
    return () => window.clearTimeout(t);
  }, [ziel]);

  const vermerk = (s: QuellenStand) => {
    setVermerke(setzeQuellenVermerk({ id: s.eintrag.id, datum: heute() }));
    notify('info', 'Als nachgesehen vermerkt', s.status === 'abgleich'
      ? 'Die Erinnerung beginnt neu. Der offene Abgleich bleibt, bis die Inhalte angepasst sind.'
      : `${s.eintrag.titel}: nächste Prüfung in ${s.eintrag.intervallMonate} Monaten.`);
  };

  return (
    <section className="page quellen-seite">
      <PageHeading eyebrow="System" title="Quellen und Aktualität"
        description="Auf welchen Gesetzen, Expertenstandards und Leitlinien die Inhalte beruhen, welcher Stand in der App steckt und wann wieder nachgesehen werden muss." />
      <section className="card" aria-label="Stand aller Quellen">
        <dl className="qm-zahlen">
          <Zahl label="Neue Fassung, abgleichen" wert={z.abgleich} t={z.abgleich ? 'kritisch' : 'gut'} href="#/system/quellen?filter=tun" />
          <Zahl label="Erneut nachsehen" wert={z.faellig} t={z.faellig ? 'warn' : 'gut'} href="#/system/quellen?filter=tun" />
          <Zahl label="Noch nie nachgesehen" wert={z['nie-geprueft']} t={z['nie-geprueft'] ? 'warn' : 'gut'} href="#/system/quellen?filter=tun" />
          <Zahl label="Aktuell" wert={z.aktuell} t="gut" href="#/system/quellen?filter=alle" />
          <Zahl label="Originalquellen" wert={z.fest} href="#/system/quellen?filter=instrument" />
        </dl>
        <p className="muted">Stand des Registers: Fassungen zuletzt recherchiert am {datum(staende.map((s) => s.eintrag.geprueftAm ?? '').sort().pop())}. Vermerke „heute nachgesehen“ gelten nur auf diesem Gerät, bis sie ins Register übernommen sind.</p>
      </section>
      <nav className="qm__wahl quellen-filter" aria-label="Quellen filtern">
        {FILTER.map((f) => <a key={f.id} className="pill" href={`#/system/quellen?filter=${f.id}`} aria-current={f.id === filter ? 'page' : undefined}>{f.label}</a>)}
      </nav>
      {sichtbar.length === 0
        ? <p className="card">Nichts zu tun: alle Quellen sind abgeglichen und nachgesehen.</p>
        : <ul className="qm-liste quellen-liste">{sichtbar.map((s) => (
          <Eintrag key={s.eintrag.id} s={s} hervor={s.eintrag.id === ziel} onVermerk={vermerk}
            onEntfernen={(x) => setVermerke(entferneQuellenVermerk(x.eintrag.id))} />
        ))}</ul>}
      <SoSichertDieApp />
    </section>
  );
}
