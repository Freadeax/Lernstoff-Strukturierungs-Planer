// Bestellliste für die nächste Materiallieferung, automatisch aus dem Code abgeleitet (Ausbau SIM-06):
// 1. Mängel aus der Bildprüfung (freigaben.ts)               → Ersatzbild
// 2. Fälle, die ein Beispielfoto mit falscher Person zeigen  → passender Raum oder Variante
// 3. Zustandslücken, die ein Simulator wirklich anfragt      → Variante desselben Ausschnitts
// 4. Fehlende Porträtzustände                                → gleiche Person, anderer Zustand
// 5. Zustandslücken ohne heutige Anfrage                     → auf Vorrat (P3)
// Jede Position hat eine feste ID nach den Lieferregeln und einen fertigen Bild-Prompt.
// Bericht: docs/BESTELLUNG.md (Test hält ihn aktuell, `npm run assets:status` erzeugt neu).

import { FAELLE as DX_FAELLE } from '../diagnostik/faelle';
import { SZENARIEN } from '../fall/faelle';
import { FOTORAEUME, fotoRaumFuer, RAUM_FUER_FALL } from '../fall/fotoraeume';
import { FALL_RAUM, RAUMFOTOS } from '../praxis/raumfotos';
import { SCENARIOS } from '../praxis/catalog';
import { istNachtFall } from '../praxis/szene';
import { PERSONEN, type PortraetZustand } from '../../ui/sim/personen';
import { RAEUME, type RaumId } from '../../ui/sim/raeume/katalog';
import { FREIGABEN } from './freigaben';

export type Achse = 'ohne_monitor' | 'sensor_an' | 'sensor_ab' | 'nacht';
export type Prioritaet = 'P1' | 'P2' | 'P3';

export interface Position {
  id: string;
  prioritaet: Prioritaet;
  art: 'ersatz' | 'raum' | 'variante' | 'portraet';
  titel: string;
  /** Referenzbild unter public/, falls die Position darauf aufbaut */
  referenz?: string;
  grund: string;
  faelle: string[];
  prompt: string;
}

const ACHSE_TEXT: Record<Achse, string> = {
  ohne_monitor: 'Gerät aus: ohne Monitor', sensor_an: 'Sensor angelegt', sensor_ab: 'Sensor abgefallen', nacht: 'Nacht',
};

const ACHSE_PROMPT: Record<Achse, string> = {
  ohne_monitor: 'Der Monitorwagen mit dem Patientenmonitor ist entfernt, am Patienten sind keine Kabel und keine Sensoren. Der Platz des Wagens bleibt frei.',
  sensor_an: 'Die Überwachung ist angelegt: Pulsoxymeter-Clip am Zeigefinger (beim Kleinkind Sensor am Fuß), Blutdruckmanschette am Oberarm, EKG-Kabel unter der Kleidung zum Brustkorb. Alle Kabel laufen ordentlich zum Monitor.',
  sensor_ab: 'Der Pulsoxymeter-Clip (beim Kleinkind der Fußsensor) ist abgerutscht und liegt neben Hand oder Fuß auf der Bettdecke, das Kabel hängt lose. Alles andere wie im Ausgangsbild, auch die übrigen Kabel.',
  nacht: 'Nachtsituation: Deckenlicht aus, nur gedämpftes Nachtlicht, Fenster dunkel. Die Person schläft oder ruht. Ein vorhandener Monitor leuchtet.',
};

const RAHMEN = 'Fotorealistisch, 16:9, mindestens 1280 × 720 px. Keine lesbare Schrift, keine Logos, keine Menüs, keine realen Personen. Fachlich korrekt: Hygiene, Gerätedetails, Hände und Anatomie.';
const GLEICH = (datei: string) => `Referenzbild public/${datei} anhängen. Exakt derselbe Bildausschnitt, dieselbe Kameraposition, dieselben Personen, Möbel und Geräte.`;

/** Welche Achsen ein Simulator für einen Raum anfragt (wie die Zustandsregeln in raumFuerZustand). */
export function zustandsAnfragen(): Map<RaumId, Map<Achse, Set<string>>> {
  const m = new Map<RaumId, Map<Achse, Set<string>>>();
  const frag = (id: RaumId, achsen: Achse[], wo: string) => {
    const r = m.get(id) ?? new Map<Achse, Set<string>>();
    for (const a of achsen) r.set(a, (r.get(a) ?? new Set()).add(wo));
    m.set(id, r);
  };
  for (const [fallId, key] of Object.entries(FALL_RAUM)) {
    const rf = RAUMFOTOS[key]!;
    // Praxis: Monitor fehlt bis zum Anschließen, läuft danach; ein Nachtfall wählt die Nachtvariante.
    const sc = SCENARIOS.find((x) => x.id === fallId);
    const nacht = !rf.nacht && !!sc && istNachtFall(sc);
    frag(rf.id, ['ohne_monitor', 'sensor_an', ...(nacht ? ['nacht' as const] : [])], `praxis:${fallId}`);
  }
  for (const [fallId, id] of Object.entries(RAUM_FUER_FALL)) if (FOTORAEUME[id].monitor) frag(id, ['ohne_monitor', 'sensor_an'], `fall:${fallId}`);
  for (const f of DX_FAELLE) frag(f.raum, ['ohne_monitor', 'sensor_an', 'sensor_ab'], `diagnostik:${f.id}`);
  return m;
}

function hatAchse(id: RaumId, a: Achse): boolean {
  const r = RAEUME[id];
  const mit = RAEUME[r.mitMonitor ?? id];
  if (a === 'ohne_monitor') return !!(r.ohneMonitor || r.mitMonitor) || !(r.monitor || r.mitMonitor);
  if (a === 'sensor_an') return !!mit.verbunden || !(r.monitor || r.mitMonitor);
  if (a === 'sensor_ab') return !!mit.sensorAb || !(r.monitor || r.mitMonitor);
  return !!r.nacht || /nacht/.test(id);
}

/** Positions-ID nach Lieferregel: Grund-ID plus Zustand, z. B. 21_paediatrie_schulkind_sensor_ab. */
export const variantenId = (raum: RaumId, a: Achse) => `${raum}_${a}`;

const ZUSTAND_PROMPT: Record<Exclude<PortraetZustand, 'stabil'>, string> = {
  angestrengt: 'angestrengt: schnellere Atmung, leicht geöffneter Mund, besorgter Blick, Haut etwas blasser',
  kritisch: 'kritisch krank: deutlich blass bis grau, erschöpft, Lippen leicht bläulich, Sauerstoffbrille. Nicht dramatisiert',
};

export function bestellung(): Position[] {
  const aus: Position[] = [];

  for (const [einheit, f] of Object.entries(FREIGABEN)) {
    if (f.status !== 'mangel') continue;
    const name = einheit.split('/').pop()!.replace(/\.[^.]+$/, '');
    aus.push({
      id: `${name}_ersatz`, prioritaet: 'P1', art: 'ersatz', titel: `Ersatz für ${name}`, referenz: einheit,
      grund: `Mangel aus der Bildprüfung (${f.am}, ${f.von}): ${f.hinweis}`, faelle: [],
      prompt: `${GLEICH(einheit)} Den Mangel beheben: ${f.hinweis} ${RAHMEN}`,
    });
  }

  for (const [fallId, key] of Object.entries(FALL_RAUM)) {
    const rf = RAUMFOTOS[key]!;
    if (!rf.beispiel) continue;
    aus.push({
      id: `${rf.id}_fall_${fallId}`, prioritaet: 'P1', art: 'variante', titel: `Passendes Foto für Praxisfall ${fallId}`, referenz: RAEUME[rf.id].datei,
      grund: rf.beispiel, faelle: [`praxis:${fallId}`],
      prompt: `${GLEICH(RAEUME[rf.id].datei).replace('dieselben Personen, ', '')} Die Person im Bett so ändern, dass sie zum Fall passt: ${rf.beispiel.replace(/^Beispielfoto: /, '')} ${RAHMEN}`,
    });
  }
  for (const s of SZENARIEN) {
    const r = fotoRaumFuer(s.id, s.setting, s.kurz);
    if (!r || r.personPasst) continue;
    const person = s.kurz.split(',').slice(0, 2).join(',');
    aus.push({
      id: `${r.id}_fall_${s.id}`, prioritaet: 'P1', art: 'variante', titel: `Passendes Foto für Fall ${s.id}`, referenz: RAEUME[r.id].datei,
      grund: `Das Foto zeigt eine andere Person als im Fall (${person}).`, faelle: [`fall:${s.id}`],
      prompt: `${GLEICH(RAEUME[r.id].datei).replace('dieselben Personen, ', '')} Die Hauptperson ersetzen durch: ${person}. Situation: ${s.kurz} ${RAHMEN}`,
    });
  }

  const anfragen = zustandsAnfragen();
  const achsen: Achse[] = ['ohne_monitor', 'sensor_an', 'sensor_ab', 'nacht'];
  const vorrat: Position[] = [];
  for (const id of [...anfragen.keys()].sort()) {
    for (const a of achsen) {
      if (hatAchse(id, a)) continue;
      const wer = [...(anfragen.get(id)?.get(a) ?? [])];
      // Nachtbilder nur, wenn ein Fall wirklich nachts spielt (kein Vorrat).
      if (a === 'nacht' && !wer.length) continue;
      const datei = RAEUME[id].datei;
      const p: Position = {
        id: variantenId(id, a), prioritaet: wer.length ? (a === 'nacht' ? 'P2' : wer.some((w) => w.startsWith('diagnostik:')) ? 'P1' : 'P2') : 'P3',
        art: 'variante', titel: `${RAEUME[id].titel}: ${ACHSE_TEXT[a]}`, referenz: datei,
        grund: wer.length ? `Zustandsregel „${ACHSE_TEXT[a]}“ fällt heute auf ein Ersatzbild zurück.` : 'Kein Simulator fragt diesen Zustand heute an (Vorrat).',
        faelle: wer, prompt: `${GLEICH(datei)} Einzige Änderung: ${ACHSE_PROMPT[a]} ${RAHMEN}`,
      };
      (wer.length ? aus : vorrat).push(p);
    }
  }

  for (const p of Object.values(PERSONEN)) {
    for (const z of ['angestrengt', 'kritisch'] as const) {
      if (p.zustaende.includes(z)) continue;
      const ref = `personen/${p.datei}_stabil.webp`;
      aus.push({
        id: `${p.datei}_${z}`, prioritaet: 'P2', art: 'portraet', titel: `Porträt ${p.name}, ${z}`, referenz: ref,
        grund: 'Der Fallsimulator zeigt bei Verschlechterung sonst das stabile Porträt.', faelle: p.faelle,
        prompt: `Referenzbild public/${ref} anhängen. Dieselbe Person (${p.beschreibung}), gleicher Ausschnitt, gleicher Hintergrund, quadratisch, mindestens 512 × 512 px. Zustand ${ZUSTAND_PROMPT[z]}. Keine Schrift, keine reale Person.`,
      });
    }
  }

  const rang: Record<Prioritaet, number> = { P1: 0, P2: 1, P3: 2 };
  return [...aus, ...vorrat].sort((a, b) => rang[a.prioritaet] - rang[b.prioritaet] || b.faelle.length - a.faelle.length || a.id.localeCompare(b.id));
}

export function bestellBericht(liste: Position[] = bestellung()): string {
  const z = (p: Prioritaet) => liste.filter((x) => x.prioritaet === p).length;
  const zeilen = [
    '# Bestellliste für die nächste Materiallieferung',
    '',
    'Automatisch erzeugt aus `src/features/assetstatus/bestellung.ts` (Mängel, Beispielfotos, Zustandslücken, Porträts).',
    'Neu erzeugen mit `npm run assets:status`. Lieferregeln, Dateinamen und `ASSET_KATALOG.json`: `docs/MATERIAL-BEDARF.md`, Abschnitt 0.',
    'Dateiname = Positions-ID (`<id>.webp` bzw. `.png`), Fälle in `faelle` wie angegeben. Nach dem Einbau wird die Position',
    'automatisch aus dieser Liste verschwinden.',
    '',
    `**${liste.length} Positionen:** ${z('P1')} × P1 (heute sichtbar falsch oder Ersatzbild), ${z('P2')} × P2, ${z('P3')} × P3 (Vorrat).`,
    '',
    '| Prio | ID | Was | Fälle |', '| --- | --- | --- | --- |',
    ...liste.map((p) => `| ${p.prioritaet} | \`${p.id}\` | ${p.titel} | ${p.faelle.length ? p.faelle.slice(0, 4).join(', ') + (p.faelle.length > 4 ? ` (+${p.faelle.length - 4})` : '') : '–'} |`),
    '',
    '## Prompts je Position',
    '',
  ];
  for (const p of liste.filter((x) => x.prioritaet !== 'P3')) {
    zeilen.push(`### ${p.prioritaet} · \`${p.id}\``, '', `${p.grund}`, '', '```text', p.prompt, '```', '');
  }
  zeilen.push('Prompts für P3-Positionen folgen demselben Muster (Referenzbild plus eine Änderung).');
  return zeilen.join('\n') + '\n';
}
