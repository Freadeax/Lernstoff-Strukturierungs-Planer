// Asset-Status pro Datei (SIM-06): für jede Bild-, Video- und Porträtdatei unter public/
// - vorhanden: Datei liegt im Repo (prüft der Test gegen das Dateisystem)
// - zugeordnet: steht in einem Katalog (Räume, Personen, Handlungsvideos, Bildgebung, Titelbilder)
// - erreichbar: ein Fall oder eine Seite zeigt sie, über Zuordnung und Zustandsregeln
// - geprüft: fachliche BildFreigabe in freigaben.ts
// - offline: vorab im Service Worker oder nach dem ersten Ansehen im Laufzeit-Cache
// Das Modul wird nur von Tests und dem Bericht docs/ASSET-STATUS.md genutzt, nicht von der App.

import { FAELLE as DX_FAELLE } from '../diagnostik/faelle';
import { FOTORAEUME, RAUM_FUER_FALL, RAUM_FUER_SETTING } from '../fall/fotoraeume';
import { FALL_RAUM, RAUMFOTOS } from '../praxis/raumfotos';
import { SUCHBILDER } from '../hygiene/suchbilder';
import { HANDLUNGSVIDEOS, type HandlungsVideoId } from '../../ui/sim/handlungsvideos';
import { PERSONEN, type PortraetZustand } from '../../ui/sim/personen';
import { RAEUME, RAUM_IDS, raumVarianten, type MonitorZustand, type RaumId } from '../../ui/sim/raeume/katalog';
import { TITELBILDER } from '../../ui/Titelbild';
import { FREIGABEN, type BildFreigabe } from './freigaben';

export type AssetArt = 'raum' | 'portraet' | 'handlungsvideo' | 'bildgebung' | 'titelbild';
export type Offline = 'vorab' | 'nach erstem Ansehen';

export interface AssetStatus {
  /** Pfad unter public/ */
  datei: string;
  art: AssetArt;
  /** Asset-ID wie im Katalog (Raum-ID, Person, Video, Bildserie, Motiv) */
  asset: string;
  zugeordnet: boolean;
  /** Wo die Datei erscheint, z. B. „praxis:kind (Nacht)“, „diagnostik:sepsis-pneumonie“ */
  verwendung: string[];
  /** Prüfeinheit, unter der die fachliche Prüfung steht (siehe freigaben.ts) */
  einheit: string;
  freigabe?: BildFreigabe;
  lizenz: string;
  offline: Offline;
}

const KI_PAKET = 'KI-generiert aus Philipps Materialpaket, Nutzung in der App';

/** Wo die Notfall-Trainer einen Raum fest einbinden (src/features/notfall). */
export const NOTFALL_RAEUME: Record<string, RaumId> = { reanimation: '18_notaufnahme_schockraum_nacht' };

const PRAXIS_ZUSTAENDE: MonitorZustand[] = ['abwesend', 'standby', 'laeuft'];
const FALL_ZUSTAENDE: MonitorZustand[] = ['abwesend', 'laeuft'];
const ALLE_ZUSTAENDE: MonitorZustand[] = ['abwesend', 'standby', 'laeuft', 'signalausfall'];

/** Raum-ID → Verwendungen (Fall plus Regel, die das Bild auswählt). */
export function raumVerwendungen(): Map<RaumId, string[]> {
  const m = new Map<RaumId, string[]>();
  const add = (id: RaumId, wo: string) => { const l = m.get(id) ?? []; if (!l.includes(wo)) l.push(wo); m.set(id, l); };
  const mitVarianten = (basis: RaumId, wo: string, zustaende: MonitorZustand[], nacht: boolean) => {
    for (const v of raumVarianten(basis, zustaende, nacht)) add(v, v === basis ? wo : `${wo} (Variante)`);
  };
  for (const [fallId, key] of Object.entries(FALL_RAUM)) {
    const rf = RAUMFOTOS[key]!;
    // Praxis: Monitor abwesend/Standby/läuft, Nachtschicht wählt die Nachtvariante.
    mitVarianten(rf.id, `praxis:${fallId}`, PRAXIS_ZUSTAENDE, true);
    if (rf.waehrend) mitVarianten(rf.waehrend.id, `praxis:${fallId} (Maßnahme ${rf.waehrend.flag})`, PRAXIS_ZUSTAENDE, false);
  }
  for (const [fallId, id] of Object.entries(RAUM_FUER_FALL)) mitVarianten(id, `fall:${fallId}`, FOTORAEUME[id].monitor ? FALL_ZUSTAENDE : [], false);
  for (const [setting, id] of Object.entries(RAUM_FUER_SETTING)) {
    if (id) mitVarianten(id, `fall:${setting} (Thema)`, FOTORAEUME[id].monitor ? FALL_ZUSTAENDE : [], false);
  }
  for (const f of DX_FAELLE) mitVarianten(f.raum, `diagnostik:${f.id}`, ALLE_ZUSTAENDE, false);
  for (const [id, raum] of Object.entries(NOTFALL_RAEUME)) add(raum, `notfall:${id}`);
  for (const s of SUCHBILDER) add(s.raum, `hygiene:${s.id}`);
  return m;
}

interface BilderQuelle { art: 'bilder'; basis: string; dateien: string[]; lizenz: string; urheber?: string }
function bilderQuellen(wert: unknown, gefunden: BilderQuelle[] = []): BilderQuelle[] {
  if (Array.isArray(wert)) { for (const w of wert) bilderQuellen(w, gefunden); return gefunden; }
  if (wert && typeof wert === 'object') {
    const o = wert as Record<string, unknown>;
    if (o.art === 'bilder' && typeof o.basis === 'string' && Array.isArray(o.dateien)) gefunden.push(o as unknown as BilderQuelle);
    else for (const w of Object.values(o)) bilderQuellen(w, gefunden);
  }
  return gefunden;
}

export function assetInventar(): AssetStatus[] {
  const liste: AssetStatus[] = [];
  const eintrag = (e: Omit<AssetStatus, 'freigabe' | 'einheit'>) => {
    const einheit = pruefEinheit(e.datei);
    liste.push({ ...e, einheit, freigabe: FREIGABEN[einheit] });
  };

  const verwendung = raumVerwendungen();
  for (const id of RAUM_IDS) {
    eintrag({ datei: RAEUME[id].datei, art: 'raum', asset: id, zugeordnet: true, verwendung: verwendung.get(id) ?? [], lizenz: KI_PAKET, offline: 'nach erstem Ansehen' });
  }

  for (const p of Object.values(PERSONEN)) {
    for (const z of p.zustaende) {
      eintrag({ datei: `personen/${p.datei}_${z}.webp`, art: 'portraet', asset: `${p.id}:${z}`, zugeordnet: true, verwendung: p.faelle, lizenz: KI_PAKET, offline: 'nach erstem Ansehen' });
    }
  }

  const clips = (id: HandlungsVideoId) => Object.entries(FALL_RAUM)
    .filter(([, key]) => RAUMFOTOS[key]!.details?.some((d) => d.id === id)).map(([fallId]) => `praxis:${fallId}`);
  for (const id of Object.keys(HANDLUNGSVIDEOS) as HandlungsVideoId[]) {
    const wo = [...clips(id), 'praxis:lernclips'];
    eintrag({ datei: `sim-videos/${id}.mp4`, art: 'handlungsvideo', asset: id, zugeordnet: true, verwendung: wo, lizenz: KI_PAKET, offline: 'nach erstem Ansehen' });
    for (let i = 1; i <= 4; i++) eintrag({ datei: `sim-videos/${id}-${i}.webp`, art: 'handlungsvideo', asset: `${id}:phase${i}`, zugeordnet: true, verwendung: wo, lizenz: KI_PAKET, offline: 'nach erstem Ansehen' });
  }

  for (const f of DX_FAELLE) {
    for (const q of bilderQuellen(f)) {
      for (const d of q.dateien) {
        const datei = `${q.basis}/${d}`;
        const da = liste.find((e) => e.datei === datei);
        if (da) { if (!da.verwendung.includes(`diagnostik:${f.id}`)) da.verwendung.push(`diagnostik:${f.id}`); continue; }
        eintrag({ datei, art: 'bildgebung', asset: q.basis.replace('bildgebung/', ''), zugeordnet: true, verwendung: [`diagnostik:${f.id}`], lizenz: [q.lizenz, q.urheber].filter(Boolean).join(', '), offline: 'nach erstem Ansehen' });
      }
    }
  }

  for (const [motiv, t] of Object.entries(TITELBILDER)) {
    eintrag({ datei: `titelbilder/${t.datei}.webp`, art: 'titelbild', asset: motiv, zugeordnet: true, verwendung: [`bereich:${motiv}`], lizenz: KI_PAKET, offline: 'vorab' });
  }
  return liste;
}

/** Prüfeinheit einer Datei: Phasenbilder gehören zum Video, Schichten zur Bildserie. */
export function pruefEinheit(datei: string): string {
  const video = /^sim-videos\/(.+)-\d\.webp$/.exec(datei);
  if (video) return `sim-videos/${video[1]}.mp4`;
  const serie = /^(bildgebung\/[^/]+)\//.exec(datei);
  if (serie) return serie[1]!;
  return datei;
}

/** Prüfpunkte je Art, aus den Hinweisen „vor Lerneinsatz fachlich prüfen“ in den Katalogen. */
export const PRUEFPUNKTE: Record<AssetArt, { id: string; text: string }[]> = {
  raum: [
    { id: 'geraete', text: 'Geräte und Monitor realistisch (Anschlüsse, Infusion, Absaugung, Rufanlage)' },
    { id: 'kabel', text: 'Kabel- und Sensorlage stimmen (Fingerclip, Elektroden, Blutdruckmanschette)' },
    { id: 'anatomie', text: 'Anatomie unauffällig (Hände, Gesichter, Körperhaltung, Bettlage)' },
    { id: 'hygiene', text: 'Hygiene korrekt (kein Schmuck, Haare, Handschuhe nur wo nötig, saubere Ablage)' },
    { id: 'fall', text: 'Passt zum Fall (Alter, Geschlecht, Setting, Tageszeit, Zustand)' },
    { id: 'schrift', text: 'Keine lesbare Fantasieschrift, keine Marken, keine echten Personen erkennbar' },
  ],
  portraet: [
    { id: 'person', text: 'Alter und Erscheinung passen zur Person im Fall' },
    { id: 'zustand', text: 'Zustand (stabil, angestrengt, kritisch) ist erkennbar, ohne zu übertreiben' },
    { id: 'anatomie', text: 'Anatomie unauffällig (Augen, Zähne, Hände)' },
    { id: 'echt', text: 'Keine reale, wiedererkennbare Person' },
  ],
  handlungsvideo: [
    { id: 'ablauf', text: 'Reihenfolge der Schritte fachlich richtig (vier Phasen)' },
    { id: 'hygiene', text: 'Händedesinfektion und Handschuhe wie im Standard' },
    { id: 'material', text: 'Material korrekt, keine Präparatenamen oder Dosen im Bild' },
    { id: 'anatomie', text: 'Hände und Körper unauffällig, keine Bildfehler im Bewegungsablauf' },
  ],
  bildgebung: [
    { id: 'befund', text: 'Befund im Bild sichtbar und passt zur Lösung im Fall' },
    { id: 'lizenz', text: 'Lizenz, Urheber und Quelle stimmen mit der Angabe überein' },
    { id: 'anonym', text: 'Keine Patientendaten im Bild' },
  ],
  titelbild: [
    { id: 'motiv', text: 'Motiv passt zum Bereich' },
    { id: 'schrift', text: 'Keine lesbare Schrift, keine Marken' },
  ],
};

export interface PruefEinheit {
  schluessel: string;
  art: AssetArt;
  asset: string;
  /** Bild für die Vorschau (bei Videos Phasenbild 1, bei Serien die mittlere Schicht) */
  vorschau: string;
  video?: string;
  dateien: string[];
  verwendung: string[];
  lizenz: string;
  freigabe?: BildFreigabe;
}

/** Alle Prüfeinheiten in Inventar-Reihenfolge (für die Seite Bildprüfung). */
export function pruefEinheiten(inv: AssetStatus[] = assetInventar()): PruefEinheit[] {
  const map = new Map<string, PruefEinheit>();
  for (const e of inv) {
    const u = map.get(e.einheit);
    if (u) {
      u.dateien.push(e.datei);
      for (const w of e.verwendung) if (!u.verwendung.includes(w)) u.verwendung.push(w);
      continue;
    }
    map.set(e.einheit, {
      schluessel: e.einheit, art: e.art, asset: e.art === 'handlungsvideo' ? e.asset.split(':')[0]! : e.asset,
      vorschau: e.datei, video: e.datei.endsWith('.mp4') ? e.datei : undefined,
      dateien: [e.datei], verwendung: [...e.verwendung], lizenz: e.lizenz, freigabe: e.freigabe,
    });
  }
  for (const u of map.values()) {
    const bilder = u.dateien.filter((d) => !d.endsWith('.mp4'));
    u.vorschau = u.art === 'bildgebung' ? bilder[Math.floor(bilder.length / 2)]! : bilder[0] ?? u.vorschau;
  }
  return [...map.values()];
}

/** Zustandslücken je genutztem Raum: welche Regel mangels Bild auf ein Ersatzbild fällt. */
export interface ZustandsLuecke { raum: RaumId; fehlt: string[] }

export function zustandsLuecken(): ZustandsLuecke[] {
  const genutzt = new Set<RaumId>();
  for (const key of Object.values(FALL_RAUM)) genutzt.add(RAUMFOTOS[key]!.id);
  for (const id of Object.values(RAUM_FUER_FALL)) genutzt.add(id);
  for (const f of DX_FAELLE) genutzt.add(f.raum);
  const luecken: ZustandsLuecke[] = [];
  for (const id of [...genutzt].sort()) {
    const r = RAEUME[id];
    const fehlt: string[] = [];
    const mitMonitor = !!(r.monitor || r.mitMonitor);
    if (mitMonitor) {
      const mit = RAEUME[r.mitMonitor ?? id];
      if (!r.ohneMonitor && !r.mitMonitor) fehlt.push('Gerät aus (ohne Monitor)');
      if (!mit.verbunden) fehlt.push('Sensor angelegt');
      if (!mit.sensorAb) fehlt.push('Sensor abgefallen');
    }
    if (!r.nacht && !/nacht/.test(id)) fehlt.push('Nacht');
    if (fehlt.length) luecken.push({ raum: id, fehlt });
  }
  return luecken;
}

/** Fehlende Porträtzustände je Person. */
export function portraetLuecken(): { person: string; fehlt: PortraetZustand[] }[] {
  const alle: PortraetZustand[] = ['stabil', 'angestrengt', 'kritisch'];
  return Object.values(PERSONEN).map((p) => ({ person: p.id, fehlt: alle.filter((z) => !p.zustaende.includes(z)) })).filter((l) => l.fehlt.length);
}

const ja = (b: boolean) => (b ? 'ja' : '**nein**');

/** Bericht für docs/ASSET-STATUS.md (wird vom Test erzeugt und verglichen). */
export function assetBericht(): string {
  const inv = assetInventar();
  const zeilen: string[] = [
    '# Asset-Status pro Datei',
    '',
    'Automatisch erzeugt aus `src/features/assetstatus/inventar.ts`. Neu erzeugen mit `npm run assets:status`;',
    'der normale Testlauf schlägt fehl, wenn diese Datei nicht mehr zum Code passt.',
    '',
    'Spalten: **zugeordnet** = steht im Katalog, **erreichbar** = ein Fall oder eine Seite zeigt die Datei',
    '(über Zuordnung und Zustandsregeln), **geprüft** = fachliche BildFreigabe in `src/ui/sim/bildfreigaben.ts`,',
    '**offline** = vorab im Service Worker oder nach dem ersten Ansehen im Laufzeit-Cache. „Vorhanden“ prüft der Test:',
    'jede Datei unter `public/{raeume,personen,sim-videos,bildgebung,titelbilder}` steht hier und umgekehrt.',
    '',
    '## Übersicht',
    '',
    '| Art | Dateien | erreichbar | geprüft |',
    '|---|---|---|---|',
  ];
  const arten: AssetArt[] = ['raum', 'portraet', 'handlungsvideo', 'bildgebung', 'titelbild'];
  for (const a of arten) {
    const l = inv.filter((e) => e.art === a);
    zeilen.push(`| ${a} | ${l.length} | ${l.filter((e) => e.verwendung.length).length} | ${l.filter((e) => e.freigabe?.status === 'freigegeben').length} |`);
  }
  const maengel = Object.entries(FREIGABEN).filter(([, f]) => f.status === 'mangel');
  zeilen.push('', '## Mängel aus der Bildprüfung', '');
  zeilen.push(maengel.length ? maengel.map(([k, f]) => `- \`${k}\` (${f.am}, ${f.von}): ${f.hinweis ?? 'ohne Hinweis'}`).join('\n')
    : 'Keine gemeldet. Prüfen in der App unter System → Bildprüfung (`#/system/bilder`).');
  const unerreichbar = inv.filter((e) => !e.verwendung.length);
  zeilen.push('', '## Nicht erreichbar', '');
  zeilen.push(unerreichbar.length ? unerreichbar.map((e) => `- \`${e.datei}\``).join('\n') : 'Keine.');
  zeilen.push('', '## Zustandslücken der genutzten Räume', '',
    'Fehlt ein Bild, fällt die Regel auf das nächstpassende Bild zurück (Nacht: Filter über dem Tagbild,',
    'Sensor abgefallen: Bild mit Sensor, der Monitor zeigt den Ausfall). Reihenfolge für neue Lieferungen siehe',
    '`docs/MATERIAL-BEDARF.md`, Abschnitt 3.', '',
    '| Raum | fehlt |', '|---|---|');
  for (const l of zustandsLuecken()) zeilen.push(`| \`${l.raum}\` | ${l.fehlt.join(', ')} |`);
  const pl = portraetLuecken();
  if (pl.length) {
    zeilen.push('', '**Porträts:** ' + pl.map((l) => `${l.person} ohne ${l.fehlt.join(' und ')}`).join('; ') + ' (Fallsimulator zeigt dann „stabil“).');
  }
  zeilen.push('', '## Alle Dateien', '');
  for (const a of arten) {
    const l = inv.filter((e) => e.art === a);
    if (!l.length) continue;
    zeilen.push(`### ${a}`, '', '| Datei | Asset | zugeordnet | erreichbar über | geprüft | offline | Lizenz |', '|---|---|---|---|---|---|---|');
    // Bildserien mit vielen Schichten zusammenfassen
    const serien = new Map<string, AssetStatus[]>();
    for (const e of l) { const k = a === 'bildgebung' ? e.asset : e.datei; serien.set(k, [...(serien.get(k) ?? []), e]); }
    for (const [k, es] of serien) {
      const e = es[0]!;
      const datei = es.length > 1 ? `${k} (${es.length} Dateien)` : `\`${e.datei}\``;
      const f = e.freigabe;
      const geprueft = f?.status === 'freigegeben' ? `ja (${f.am})` : f?.status === 'mangel' ? '**Mangel**' : 'offen';
      zeilen.push(`| ${datei} | ${e.asset} | ${ja(e.zugeordnet)} | ${e.verwendung.length ? e.verwendung.join(', ') : '**nein**'} | ${geprueft} | ${e.offline} | ${e.lizenz} |`);
    }
    zeilen.push('');
  }
  return zeilen.join('\n').replace(/\n+$/, '') + '\n';
}
