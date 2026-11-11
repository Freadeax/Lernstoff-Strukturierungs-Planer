// Fallereignisse der Übergabe-Übungen: daraus leitet rufanlass() Rufgrund, Priorität, Empfehlung und
// Rückfrage ab (gemeinsame SBAR-Grundkriterien, siehe grundkriterien.ts). Alle Angaben frei erfunden.
import type { SbarEreignis } from './grundkriterien';

export const EREIGNISSE: Record<string, SbarEreignis[]> = {
  sepsis: [
    { minute: 0, stufe: 'info', text: '22 Uhr: wach und klar, Temperatur 37,4 °C' },
    { minute: 270, stufe: 'kritisch', text: 'Neu verwirrt mit Fieber 38,9 °C, Puls 118, RR 92/55, AF 26 (Verdacht auf Sepsis)', muster: ['verwirr', 'desorient', 'fieber', 'sepsis', 'deliri'],
      empfehlung: 'Ärztin bittet, in den nächsten Minuten zu kommen; Blutkulturen, Labor und Infusion vorbereiten', rueckfrage: 'Soll ich Blutkulturen und Labor schon vorbereiten? Absprache zurücklesen.' },
  ],
  hypo: [
    { minute: 0, stufe: 'info', text: '18 Uhr: 18 IE Mischinsulin, Abendessen kaum gegessen' },
    { minute: 135, stufe: 'auffaellig', text: 'Blutzucker 48 mg/dl, kaltschweißig, Traubenzucker gegeben, wach und ansprechbar', muster: ['unterzucker', 'hypogly', 'blutzucker', 'zucker', '48'],
      empfehlung: 'Insulindosis für morgen überprüfen lassen, weitere BZ-Kontrollen absprechen', rueckfrage: 'Wann soll ich erneut messen, und ab welchem Wert rufe ich wieder an?' },
  ],
  sturz: [
    { minute: 0, stufe: 'kritisch', text: 'Sturz unter Phenprocoumon: Platzwunde an der Stirn, Bein rechts verkürzt und außenrotiert', muster: ['sturz', 'gestuerzt', 'gefallen', 'am boden', 'auf dem boden'],
      empfehlung: 'Ärztliche Untersuchung jetzt, Bildgebung und Gerinnung abklären', rueckfrage: 'Soll ich bis dahin Schmerzmittel geben oder die Neuro-Kontrollen dokumentieren?' },
  ],
  atemnot: [
    { minute: 0, stufe: 'info', text: 'Aufnahme vor 1 Tag mit dekompensierter Herzinsuffizienz' },
    { minute: 60, stufe: 'kritisch', text: 'Akute Atemnot, SpO₂ 86 %, AF 30, feuchte Rasselgeräusche', muster: ['atemnot', 'luftnot', 'dyspnoe', 'keine luft', 'ringt nach luft', 'schlecht luft'],
      empfehlung: 'Ärztin sofort zur Patientin bitten, Anordnung für Diuretikum i. v. und Sauerstoff', rueckfrage: 'Wie viel Sauerstoff soll ich bis zu Ihrem Eintreffen geben?' },
  ],
  kind: [
    { minute: 0, stufe: 'info', text: 'Schichtübergabe: Lena, Gastroenteritis mit leichter Exsikkose, seit 15 Uhr kein Erbrechen', muster: ['lena', 'gastroenteritis', 'brech', 'durchfall', 'exsikkose'],
      empfehlung: 'Trinkprotokoll und Ausscheidung weiterführen, um 6 Uhr wiegen', rueckfrage: 'Gibt es noch Fragen zu Lena?' },
  ],
  schmerz: [
    { minute: 0, stufe: 'auffaellig', text: 'Schmerz NRS 8 in Ruhe, Bedarfsmedikation für heute ausgeschöpft', muster: ['schmerz', 'nrs'],
      empfehlung: 'Schmerztherapie anpassen lassen (neue Anordnung)', rueckfrage: 'Ab welcher Schmerzstärke soll ich erneut anrufen?' },
  ],
  delir: [
    { minute: 0, stufe: 'auffaellig', text: 'Seit gestern Abend akut verwirrt, Urin trüb, Temperatur 37,9 °C, wenig getrunken', muster: ['verwirr', 'desorient', 'durcheinander', 'deliri'],
      empfehlung: 'Hausbesuch oder Abklärung heute, Urinprobe anbieten', rueckfrage: 'Wann können Sie heute kommen, und was soll die Tochter bis dahin tun?' },
  ],
  schlaganfall: [
    { minute: 0, stufe: 'kritisch', text: 'Seit 14:25 Uhr hängender Mundwinkel, Armschwäche rechts, verwaschene Sprache (FAST positiv)', muster: ['schlaganfall', 'apoplex', 'insult', 'stroke', 'fast', 'verwaschen', 'mundwinkel'],
      empfehlung: 'Sofort kommen, Stroke-Unit oder CT veranlassen', rueckfrage: 'Soll ich schon einen Zugang legen lassen und den Transport vorbereiten?' },
  ],
};
