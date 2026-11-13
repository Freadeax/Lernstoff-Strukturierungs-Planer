// Fachliche Freigabe je Praxisfall (Audit SIM-02). Alle Fälle sind didaktische Modelle und fachlich
// ungeprüft, bis eine Pflegefachperson sie prüft und hier Rolle und Datum einträgt.
// Neue Fälle: Eintrag ergänzen (Test prüft Vollständigkeit). Änderungen am Fall unten im Verlauf notieren.

import type { Freigabe, Risiko } from '../../ui/sim/freigabe';
import type { Scenario } from './types';

const ROLLE = 'Pflegefachperson mit Praxisanleitung; bei Medikamenten- und Notfallinhalten zusätzlich ärztliche Durchsicht';
const ABCDE = { titel: 'Resuscitation Council UK: The ABCDE approach', stand: '2021' };
const SBAR = { titel: 'AHRQ TeamSTEPPS (SBAR)', stand: '2023' };
const NEWS2 = { titel: 'Royal College of Physicians: NEWS2', stand: '2017' };
const VERLAUF = [{ datum: '2026-10-20', text: 'Fall angelegt (Version 0.1.0)' }, { datum: '2026-11-11', text: 'Freigabefelder ergänzt, Prüfung ausstehend' }];

type Eintrag = { lernziele: string[]; geltung: string; risiken: Risiko[]; pruefpunkte?: string[]; quellen?: Freigabe['quellen'] };

const FAELLE: Record<string, Eintrag> = {
  hausbesuch: { geltung: 'Ambulante Pflege, Hausbesuch, ab 1. Ausbildungsjahr', risiken: ['medikament'], pruefpunkte: ['Exsikkose-Zeichen und Diuretikum'],
    lernziele: ['Neue Verwirrtheit als möglichen Flüssigkeitsmangel erkennen', 'Sturzrisiko aus Schwindel, Diuretikum und Trinkmenge ableiten', 'Angehörige konkret einbinden und mit der Person gemeinsam entscheiden'] },
  pflegeheim: { geltung: 'Stationäre Langzeitpflege, ab 1. Ausbildungsjahr', risiken: ['medikament', 'notfall'], pruefpunkte: ['Hypoglykämie-SOP, Glukosegabe nur bei sicherem Schlucken'],
    quellen: [{ titel: 'JBDS: Hospital management of hypoglycaemia', stand: '2023' }],
    lernziele: ['Unruhe vor dem Essen als möglichen Unterzucker erkennen und BZ messen', 'Orale Glukose nur bei Wachheit und sicherem Schlucken geben', 'Insulinplan und Essprotokoll prüfen, bevor Insulin gegeben wird'] },
  nachtwache: { geltung: 'Erwachsene, Normalstation, Nachtdienst, ab 2. Ausbildungsjahr', risiken: ['medikament', 'geraet'], pruefpunkte: ['Furosemid-Dosis, Applikationsdauer, Monitoringgrenzen'],
    quellen: [{ titel: 'Furosemid Fachinformation (emc)', stand: '2024' }],
    lernziele: ['Atemnot bei Herzinsuffizienz strukturiert einschätzen und atemerleichternd lagern', 'Angeordnetes Furosemid sicher vorbereiten (6R, Volumen, Dauer)', 'Wirkung und Bilanz kontrollieren und nach SBAR übergeben'] },
  zna: { geltung: 'Erwachsene, Notaufnahme, ab 2. Ausbildungsjahr', risiken: ['notfall', 'geraet'], pruefpunkte: ['EKG-Zeitfenster als didaktische Vorgabe'],
    lernziele: ['Brustschmerz strukturiert ersteinschätzen', 'EKG zeitnah organisieren und Befunde weitergeben', 'Verschlechterung erkennen und eskalieren'] },
  its: { geltung: 'Erwachsene, Intensivstation, ab 3. Ausbildungsjahr, nur mit Fachperson', risiken: ['geraet'], pruefpunkte: ['Keine eigenständige Beatmungs- oder Katecholamintitration'],
    lernziele: ['Geräte, Alarme und Perfusoren im Team prüfen', 'Eigene Grenzen bei Beatmung und Katecholaminen kennen', 'Beobachtungen strukturiert an die Fachperson übergeben'] },
  kind: { geltung: 'Kinder (4 Jahre), Pädiatrie, ab 2. Ausbildungsjahr', risiken: ['kinder'], pruefpunkte: ['Kinder-Normwerte und -Alarmgrenzen statt Erwachsenen-NEWS2', 'Flüssigkeitsbilanz nach Körpergewicht'],
    lernziele: ['Dehydratationszeichen beim Kleinkind erkennen', 'Eltern als Partner einbeziehen', 'Flüssigkeitsbilanz kindgerecht führen'] },
  psychiatrie: { geltung: 'Erwachsene, Psychiatrie, ab 2. Ausbildungsjahr', risiken: [], pruefpunkte: ['Deeskalationsstufen, freiheitsentziehende Maßnahmen'],
    lernziele: ['Deeskalierend kommunizieren und Abstand wahren', 'Beziehung aufbauen statt Konfrontation', 'Rechtliche Grenzen von Zwangsmaßnahmen kennen'] },
  reha: { geltung: 'Erwachsene, Rehabilitation, ab 1. Ausbildungsjahr', risiken: [],
    lernziele: ['Mobilisation an Ressourcen ausrichten', 'Teilhabe- und Alltagsziele gemeinsam festlegen', 'Kreislaufreaktion bei Mobilisation beobachten'] },
  palliativ: { geltung: 'Erwachsene, Palliativversorgung, ab 2. Ausbildungsjahr', risiken: ['medikament'], pruefpunkte: ['Symptomkontrolle nur nach Anordnung'],
    lernziele: ['Patientenwillen erfragen und respektieren', 'Angehörige begleiten', 'Symptome erfassen und an das Team weitergeben'] },
  sepsis: { geltung: 'Erwachsene, Normalstation, ab 2. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['Sepsis-Kriterien, Eskalationszeitpunkt'],
    lernziele: ['Sepsis an Atemfrequenz, Blutdruck, Bewusstsein und Fieber erkennen', 'Sofort eskalieren und Maßnahmen im Team vorbereiten', 'Verlauf engmaschig dokumentieren'] },
  nachblutung: { geltung: 'Erwachsene, Unfallchirurgie, ab 2. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['Schockzeichen, Lagerung, Kompression'],
    lernziele: ['Nachblutung und Schockzeichen nach OP erkennen', 'Sofortmaßnahmen und Eskalation einleiten', 'Blutverlust und Vitalzeichen dokumentieren'] },
  schlaganfall: { geltung: 'Erwachsene, Langzeitpflege, ab 1. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['FAST/BE-FAST, Zeitfenster'],
    lernziele: ['Schlaganfallzeichen mit BE-FAST erkennen', 'Zeitpunkt des Symptombeginns sichern', 'Notruf ohne Verzögerung absetzen'] },
  anaphylaxie: { geltung: 'Erwachsene, Normalstation, ab 2. Ausbildungsjahr', risiken: ['notfall', 'medikament'], pruefpunkte: ['Adrenalin i.m. nach SOP, Lagerung'],
    quellen: [{ titel: 'Resuscitation Council UK: Emergency treatment of anaphylaxis', stand: '2021' }],
    lernziele: ['Anaphylaxie an Atemwegs-, Atem- oder Kreislaufproblem plus Hautzeichen erkennen', 'Auslöser stoppen und sofort Hilfe holen', 'Adrenalin i.m. als Mittel der ersten Wahl kennen'] },
  lungenembolie: { geltung: 'Erwachsene, Chirurgie, ab 2. Ausbildungsjahr', risiken: ['notfall'], pruefpunkte: ['Thromboseprophylaxe, Eskalation'],
    lernziele: ['Plötzliche Atemnot nach OP als mögliche Lungenembolie erkennen', 'Oberkörper hoch lagern, Sauerstoff, Hilfe holen', 'Thromboseprophylaxe als Vorbeugung einordnen'] },
  delir: { geltung: 'Erwachsene, Normalstation, ab 2. Ausbildungsjahr', risiken: [], pruefpunkte: ['Freiheitsentziehende Maßnahmen nur rechtlich zulässig'],
    lernziele: ['Delir von Demenz unterscheiden', 'Auslöser systematisch suchen', 'Alternativen zu freiheitsentziehenden Maßnahmen nutzen'] },
  asthma: { geltung: 'Kinder (7 Jahre), Pädiatrie, ab 2. Ausbildungsjahr', risiken: ['kinder', 'notfall', 'medikament'], pruefpunkte: ['Kinder-Normwerte und -Alarmgrenzen statt Erwachsenen-NEWS2', 'Inhalation mit Spacer, Notfallplan'],
    lernziele: ['Schweren Asthmaanfall beim Kind erkennen (Sprechdyspnoe, Einziehungen)', 'Atemerleichternd lagern und Notfallplan klären', 'Eltern einbeziehen und Schweigepflicht beachten'] },
  demenz: { geltung: 'Erwachsene, Langzeitpflege, ab 2. Ausbildungsjahr', risiken: [], pruefpunkte: ['Patientenverfügung, Pneumoniezeichen'],
    lernziele: ['Pneumoniezeichen bei Demenz trotz untypischer Symptome erkennen', 'Patientenverfügung und mutmaßlichen Willen beachten', 'Angehörige und Hausarzt einbeziehen'] },
  bronchiolitis: { geltung: 'Säugling (4 Monate), Pädiatrie, ab 2. Ausbildungsjahr', risiken: ['kinder', 'notfall'], pruefpunkte: ['Säuglings-Normwerte und -Alarmgrenzen statt Erwachsenen-NEWS2', 'Ziel-SpO₂ und Indikation Magensonde/Infusion nach Hausstandard', 'Kontaktisolierung bei RSV'],
    quellen: [{ titel: 'NICE NG9: Bronchiolitis in children', stand: '2021' }],
    lernziele: ['Erschöpfungszeichen und Atempausen beim Säugling erkennen und sofort eskalieren', 'Trinkmenge und Ausscheidung als Warnzeichen einordnen', 'Nase freimachen, sicher lagern und RSV-Kontaktisolierung einhalten'] },
  herzschwaeche: { geltung: 'Erwachsene, Ambulante Pflege, ab 2. Ausbildungsjahr', risiken: ['medikament', 'notfall'], pruefpunkte: ['Gewichtsgrenze 2 kg in 3 Tagen, Trinkmengenvorgabe', 'Kontraindikation Kompression bei dekompensierter Herzinsuffizienz', 'Telefonische Anordnung im ambulanten Dienst'],
    quellen: [{ titel: 'ESC Guidelines for heart failure', stand: '2021' }],
    lernziele: ['Dekompensation an Gewicht, Ödemen und Orthopnoe erkennen', 'Medikamenteneinnahme prüfen und Hausärztin einbinden', 'Selbstbestimmung respektieren und einen Notfallplan vereinbaren'] },
  rausch: { geltung: 'Jugendliche (15 Jahre), Kinder- und Jugendstation, ab 2. Ausbildungsjahr', risiken: ['kinder', 'notfall'], pruefpunkte: ['Überwachungsintervalle bei Alkoholintoxikation', 'Glukosegabe nur nach Anordnung, nichts oral bei Bewusstseinstrübung', 'Information der Sorgeberechtigten'],
    lernziele: ['Atemweg bei Bewusstseinstrübung sichern (Seitenlage, Absaugbereitschaft)', 'Unterzucker, Unterkühlung und Kopfverletzung als Gefahren erkennen', 'Jugendliche und Eltern ohne Beschämung begleiten'] },
};

export function freigabeFuer(s: Pick<Scenario, 'id' | 'age'>): Freigabe | undefined {
  const e = FAELLE[s.id];
  if (!e) return undefined;
  const zielgruppe = s.age < 1 ? 'neugeborene' : s.age < 18 ? 'kinder' : 'erwachsene';
  return {
    status: 'ungeprueft', lernziele: e.lernziele, geltung: e.geltung, zielgruppe,
    quellen: [ABCDE, SBAR, ...(zielgruppe === 'erwachsene' ? [NEWS2] : []), ...(e.quellen ?? [])],
    prueferrolle: ROLLE, aenderungen: VERLAUF, risiken: e.risiken, pruefpunkte: e.pruefpunkte ?? [],
  };
}

export const FREIGABE_FAELLE = Object.keys(FAELLE);
