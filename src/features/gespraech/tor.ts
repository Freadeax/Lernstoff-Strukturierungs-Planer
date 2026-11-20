// Gesprächssimulator über das KI-Tor (ohne eigenen Schlüssel): Rolle spielen, Freitext zuordnen, Rückmeldung.
import { torAntwort, type TorNachricht } from '../../core/ki/tor';
import type { SimAuswertung } from '../../ui/sim/auswertung';
import { TECHNIK, type Dialog, type Knoten } from './dialoge';
import type { Nachricht } from './gespraech';
import { leseRueckmeldung } from './rueckmeldung-lesen';

const alsTor = (v: Nachricht[]): TorNachricht[] => v.map((n) => ({ rolle: n.von === 'ich' ? 'nutzer' : 'ki', text: n.text }));

export async function gegenueberSagtTor(d: Dialog, verlauf: Nachricht[]): Promise<{ text: string; rest: number }> {
  const r = await torAntwort({ aufgabe: 'rolle', kontext: `${d.rolleKi}\nOrt und Lage: ${d.lage}`, verlauf: alsTor(verlauf) });
  return { text: r.text.slice(0, 600), rest: r.restGeraet };
}

export async function rueckmeldungTor(d: Dialog, verlauf: Nachricht[]): Promise<SimAuswertung> {
  const techniken = Object.entries(TECHNIK).map(([id, t]) => `${id}: ${t.name} (${t.foerderlich ? 'förderlich' : 'Sperre'})`).join('\n');
  const r = await torAntwort({ aufgabe: 'rueckmeldung', kontext: `Ziel: ${d.ziel}\nLage: ${d.lage}\nTechniken (Kennung: Name):\n${techniken}`, verlauf: alsTor(verlauf) });
  const a = leseRueckmeldung(r.text, verlauf);
  return { ...a, quelle: 'Gesprächssimulator (eingebaute KI)', grenzen: 'Rückmeldung eines offenen KI-Modells, ein Vorschlag zum Nachdenken. Sie zählt nicht im Lernplan.' };
}

/** Freitext von der KI einer vorbereiteten Antwort zuordnen lassen. -1 = keine passt. */
export async function zuordnenTor(d: Dialog, k: Knoten, text: string): Promise<{ index: number; begruendung: string }> {
  const kontext = `Lage: ${d.lage}\nDas Gegenüber sagt: „${k.sagt}“\nVorbereitete Antworten:\n${k.antworten.map((a, i) => `${i}: ${a.text}`).join('\n')}`;
  const r = await torAntwort({ aufgabe: 'zuordnen', kontext, verlauf: [{ rolle: 'nutzer', text: text.slice(0, 800) }] });
  const s = r.text.indexOf('{'), e = r.text.lastIndexOf('}');
  if (s < 0 || e < s) throw new Error('Die Antwort der KI war nicht lesbar. Bitte noch einmal versuchen.');
  const roh = JSON.parse(r.text.slice(s, e + 1)) as { index?: unknown; begruendung?: unknown };
  const index = Number.isInteger(roh.index) && (roh.index as number) >= 0 && (roh.index as number) < k.antworten.length ? (roh.index as number) : -1;
  return { index, begruendung: typeof roh.begruendung === 'string' ? roh.begruendung.slice(0, 300) : '' };
}
