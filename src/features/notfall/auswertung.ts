// Adapter Notfall-Trainer (ABCDE-Übung, Reanimationsübung) → gemeinsame Auswertung.

import type { AuswertungsPunkt, SimAuswertung } from '../../ui/sim/auswertung';
import { bewerte, type Stand } from './abcde';
import { hinweise, type Auswertung, type ReaProfil } from './rea';

const WARUM: [RegExp, string][] = [
  [/^(Alle fünf|Nicht eingeschätzt)/, 'Nur wer alle Bereiche prüft, übersieht kein lebensbedrohliches Problem.'],
  [/^Reihenfolge/, 'Probleme in Atemweg und Atmung töten am schnellsten. Deshalb immer bei A beginnen.'],
  [/(Hilfe|Keine Hilfe)/, 'Einen kritisch kranken Menschen versorgt man nicht allein. Früh gerufene Hilfe ist früher da.'],
  [/^(Erledigt|Fehlt):/, 'Diese Maßnahme behandelt ein Hauptproblem dieses Notfalls.'],
  [/^(Ungünstig|Keine gefährlichen)/, 'Falsche Maßnahmen kosten Zeit oder schaden direkt.'],
  [/^Nach den Maßnahmen/, 'Nur die erneute Einschätzung zeigt, ob eine Maßnahme wirkt.'],
  [/(Zustand)/, 'Ziel der Übung: stabilisieren oder rechtzeitig an das Team übergeben.'],
];
const warumAbcde = (text: string) => WARUM.find(([r]) => r.test(text))?.[1] ?? 'Teil des ABCDE-Vorgehens.';

export function abcdeAuswertung(s: Stand): SimAuswertung {
  const b = bewerte(s);
  const punkte: AuswertungsPunkt[] = b.zeilen.map((z, i) => ({ id: `abcde:${i}`, titel: z.text, urteil: z.ok ? 'gut' : 'fehler', warum: warumAbcde(z.text) }));
  const falsch = s.verlauf.filter((e) => e.art === 'falsch');
  falsch.forEach((e, i) => punkte.push({ id: `falsch:${i}`, titel: e.titel, urteil: 'fehler', warum: e.text }));
  const quote = b.punkte / b.max;
  return {
    quelle: 'ABCDE-Übung',
    ergebnis: {
      stufe: s.ende === 'kritisch' ? 'kritisch' : quote >= 0.85 && !falsch.length ? 'stabil' : 'unsicher',
      text: `${b.punkte} von ${b.max} Punkten. ${s.ende === 'kritisch' ? 'Der Zustand wurde kritisch, bevor die wirksamen Maßnahmen liefen.' : 'Die Lage wurde beherrscht oder rechtzeitig übergeben.'}`,
    },
    punkte,
    merksaetze: [`Lernziel: ${s.fall.lernziel}`, 'Immer A bis E in dieser Reihenfolge, jedes Problem sofort behandeln, danach wieder bei A beginnen.', 'Früh Hilfe holen und nach SBAR übergeben.'],
  };
}

export function reaAuswertung(a: Auswertung, profil: ReaProfil): SimAuswertung {
  const h = hinweise(a, profil);
  const sauber = h.length === 1 && h[0]!.startsWith('Sauber');
  const punkte: AuswertungsPunkt[] = [];
  const ziel = profil.ziel;
  if (a.mittel !== null) punkte.push({ id: 'takt', titel: 'Takt', urteil: a.mittel >= ziel.min && a.mittel <= ziel.max ? 'gut' : 'fehler', deine: `${a.mittel} im Mittel, ${Math.round(a.imZiel * 100)} % im Ziel`, warum: `Ziel ${profil.zielText}. Zu langsam pumpt zu wenig, zu schnell lässt das Herz nicht füllen.` });
  punkte.push({ id: 'ccf', titel: 'Kompressionsanteil', urteil: a.ccf >= 0.8 ? 'gut' : a.ccf >= 0.6 ? 'teilweise' : 'fehler', deine: `${Math.round(a.ccf * 100)} %`, warum: 'Über 80 % der Zeit sollte gedrückt werden. Jede Pause lässt den aufgebauten Druck zusammenfallen.' });
  punkte.push({ id: 'pause', titel: 'Längste Unterbrechung', urteil: a.laengstePause <= 10 ? 'gut' : 'fehler', deine: `${a.laengstePause.toLocaleString('de-DE')} s`, warum: 'Unterbrechungen höchstens 10 Sekunden, rund um den Schock möglichst unter 5 Sekunden.' });
  if (a.analysen) punkte.push({ id: 'analyse', titel: profil.defi ? 'Rhythmusanalysen' : 'Herzfrequenz eingeordnet', urteil: a.richtigeAnalysen === a.analysen ? 'gut' : 'fehler', deine: `${a.richtigeAnalysen} von ${a.analysen} richtig`, warum: profil.defi ? 'Schockbar sind nur Kammerflimmern und pulslose Kammertachykardie.' : 'Unter 60/min weiter drücken, ab 60/min Kompressionen beenden und weiter beatmen.' });
  if (a.bisDruck !== null && profil.id !== 'neugeborene') punkte.push({ id: 'start', titel: 'Bis zur ersten Kompression', urteil: a.bisDruck <= 30 ? 'gut' : 'fehler', deine: `${a.bisDruck} s`, warum: 'Erkennen in unter 10 Sekunden, dann sofort beginnen. Jede Minute ohne Kompression senkt die Überlebenschance.' });
  if (a.falscheSchritte) punkte.push({ id: 'umweg', titel: 'Umwege beim Erkennen', urteil: 'fehler', deine: `${a.falscheSchritte}`, warum: 'Keine Reaktion und keine normale Atmung: sofort Hilfe und Kompressionen, nicht erst weiter untersuchen.' });
  const fehler = punkte.filter((p) => p.urteil === 'fehler').length;
  return {
    quelle: 'Reanimationsübung',
    ergebnis: { stufe: sauber ? 'stabil' : fehler >= 3 ? 'kritisch' : 'unsicher', text: h[0]! },
    punkte,
    merksaetze: h.slice(sauber ? 0 : 1),
  };
}
