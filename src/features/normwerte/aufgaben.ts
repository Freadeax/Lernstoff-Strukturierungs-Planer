// Normwerte-Trainer: Vitalzeichen, Blutzucker, Labor und Ausscheidung bei Erwachsenen.
// Werte sind übliche Lehrbuch-Richtwerte. Laborgrenzen unterscheiden sich je Labor und Methode,
// maßgeblich ist immer der Referenzbereich auf dem Befund. Die Seite sagt das.

import { ergaenze, mitVertiefung, type Aufgabe, type AuswahlAufgabe } from '../quiz/quiz';
import { VERTIEFUNG } from './vertiefung';
import { ERWEITERUNG } from './erweiterung';
import { normText, vitalNormal, vitalText, VITAL_SCHWELLEN } from '../../ui/sim/normwerte';

// Zahlen aus dem gemeinsamen Normwert-Vertrag (src/ui/sim/normwerte.ts), damit Trainer, Labor und Monitor
// dieselben Bereiche nennen. Ein Test prüft, dass die richtigen Antworten dazu passen.
const nb = (id: 'puls' | 'af' | 'spo2') => { const b = vitalNormal(id)!; return `${b.min} bis ${b.max}`; };
const proUl = (id: 'leuko' | 'thrombo') => normText(id, { faktor: 1000, nachkomma: 0, einheit: '' });
const fieber = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1 }).format(VITAL_SCHWELLEN.fieber);

export type BereichId = 'vital' | 'labor' | 'ausscheidung';
export interface Bereich { id: BereichId; label: string; kurz: string; wissen: string[] }

export const THEMEN = {
  vital: 'thema.beo.vitalzeichen',
  diabetes: 'thema.kl.diabetes',
  blut: 'thema.ap.blut',
  niere: 'thema.ap.niere',
  ausscheidung: 'thema.beo.haut',
} as const;

const EINSTUFUNG = ['Zu niedrig', 'Im Normbereich', 'Zu hoch'] as const;

function bereich(id: string, thema: string, titel: string, f: string, optionen: string[], erklaerung: string[]): AuswahlAufgabe {
  return { id, art: 'auswahl', topicIds: [thema], titel, frage: f, optionen, richtig: [0], mehrfach: false, erklaerung };
}

function wert(id: string, thema: string, titel: string, f: string, richtig: 0 | 1 | 2, erklaerung: string[]): AuswahlAufgabe {
  return { id, art: 'auswahl', topicIds: [thema], titel, frage: `${f} Wie stufst du den Wert ein?`, optionen: [...EINSTUFUNG], richtig: [richtig], mehrfach: false, erklaerung };
}

// ---------------------------------------------------------------- Vitalzeichen

const vital: Aufgabe[] = [
  bereich('vital.puls', THEMEN.vital, 'Puls', 'Welcher Ruhepuls gilt bei Erwachsenen als normal?',
    [`${nb('puls')} Schläge pro Minute`, '40 bis 60 Schläge pro Minute', '100 bis 140 Schläge pro Minute', '20 bis 40 Schläge pro Minute'],
    ['Unter 60 pro Minute: Bradykardie, über 100 pro Minute: Tachykardie. Gut trainierte Menschen haben oft einen Ruhepuls unter 60.']),
  bereich('vital.atmung', THEMEN.vital, 'Atmung', 'Welche Atemfrequenz ist bei Erwachsenen in Ruhe normal?',
    [`${nb('af')} Atemzüge pro Minute`, '4 bis 8 Atemzüge pro Minute', '25 bis 35 Atemzüge pro Minute', '40 bis 60 Atemzüge pro Minute'],
    ['Die Atemfrequenz ist der empfindlichste frühe Hinweis auf eine Verschlechterung. Im NEWS2 gibt es ab 21 pro Minute Punkte.']),
  bereich('vital.rr', THEMEN.vital, 'Blutdruck', 'Ab welchem in der Praxis gemessenen Wert spricht man bei Erwachsenen von Bluthochdruck?',
    ['Ab 140/90 mmHg', 'Ab 120/80 mmHg', 'Ab 160/110 mmHg', 'Ab 100/60 mmHg'],
    ['Optimal ist unter 120/80 mmHg. Werte zwischen 130/85 und 139/89 gelten als hochnormal. Eine Diagnose braucht mehrere Messungen.']),
  bereich('vital.temp', THEMEN.vital, 'Temperatur', 'Ab welcher Körpertemperatur spricht man von Fieber?',
    [`Über ${fieber} °C`, 'Über 37,0 °C', 'Über 39,5 °C', 'Über 36,5 °C'],
    ['37,5 bis 38,0 °C gelten als subfebril (erhöhte Temperatur). Unter 36,0 °C liegt eine Untertemperatur vor.']),
  bereich('vital.spo2', THEMEN.vital, 'Sauerstoffsättigung', 'Welche Sauerstoffsättigung (SpO2) ist bei gesunden Erwachsenen normal?',
    [`${nb('spo2')} %`, '80 bis 85 %', '70 bis 80 %', '88 bis 92 %'],
    ['88 bis 92 % ist der übliche Zielbereich bei Menschen mit COPD und Gefahr einer CO2-Retention, wenn ärztlich so festgelegt (NEWS2-Skala 2).']),
  wert('vital.wert.puls48', THEMEN.vital, 'Puls', 'Ein 78-jähriger Patient hat einen Ruhepuls von 48 pro Minute.', 0,
    ['Unter 60 pro Minute ist eine Bradykardie. Auf Schwindel, Verwirrtheit und Medikamente wie Betablocker achten und ärztlich melden.']),
  wert('vital.wert.af26', THEMEN.vital, 'Atmung', 'Eine Patientin atmet 26-mal pro Minute.', 2,
    ['Tachypnoe. Sie kann auf Fieber, Schmerzen, Angst, eine Lungenentzündung oder eine Sepsis hinweisen und gibt im NEWS2 3 Punkte.']),
  wert('vital.wert.temp369', THEMEN.vital, 'Temperatur', 'Die Temperatur im Ohr beträgt 36,9 °C.', 1,
    [`Normale Körpertemperatur liegt etwa bei ${vitalText('temp')}, je nach Messort und Tageszeit.`]),
  wert('vital.wert.rr90', THEMEN.vital, 'Blutdruck', 'Nach dem Aufstehen misst du 85/50 mmHg, der Patient klagt über Schwindel.', 0,
    ['Hypotonie, hier am ehesten orthostatisch. Sofort hinsetzen oder hinlegen lassen (Sturzgefahr), Werte kontrollieren und melden.']),
];

// ---------------------------------------------------------------- Labor

const labor: Aufgabe[] = [
  bereich('labor.bz', THEMEN.diabetes, 'Blutzucker', 'Welcher Nüchternblutzucker ist normal?',
    ['Unter 100 mg/dl (5,6 mmol/l)', 'Unter 200 mg/dl (11,1 mmol/l)', 'Über 150 mg/dl (8,3 mmol/l)', 'Unter 40 mg/dl (2,2 mmol/l)'],
    ['Ab 126 mg/dl (7,0 mmol/l) nüchtern, mehrfach gemessen, spricht man von Diabetes mellitus.']),
  wert('labor.wert.bz55', THEMEN.diabetes, 'Blutzucker', 'Ein Bewohner mit Insulintherapie ist schweißig und zittrig, der Blutzucker liegt bei 55 mg/dl.', 0,
    ['Unter 70 mg/dl (3,9 mmol/l) besteht eine Hypoglykämie. Bei erhaltenem Bewusstsein schnell wirksame Kohlenhydrate geben (z. B. Traubenzucker), dann nachmessen und melden.']),
  bereich('labor.kalium', THEMEN.niere, 'Elektrolyte', 'In welchem Bereich liegt das Kalium im Blut normalerweise?',
    [normText('k'), normText('na'), '0,5 bis 1,0 mmol/l', '8 bis 12 mmol/l'],
    ['Schon kleine Abweichungen sind gefährlich: Zu viel und zu wenig Kalium können Herzrhythmusstörungen auslösen. Diuretika senken oft das Kalium.']),
  bereich('labor.natrium', THEMEN.niere, 'Elektrolyte', 'In welchem Bereich liegt das Natrium im Blut normalerweise?',
    [normText('na'), normText('k'), '90 bis 110 mmol/l', '160 bis 180 mmol/l'],
    ['Ein zu niedriges Natrium (Hyponatriämie) zeigt sich bei älteren Menschen oft durch Verwirrtheit und Stürze.']),
  bereich('labor.hb', THEMEN.blut, 'Blutbild', 'Welcher Hämoglobinwert (Hb) liegt bei einer erwachsenen Frau etwa im Normbereich?',
    [`Etwa ${normText('hb', { geschlecht: 'w', nachkomma: 0 })}`, 'Etwa 4 bis 6 g/dl', 'Etwa 20 bis 25 g/dl', 'Etwa 135 bis 145 g/dl'],
    [`Bei Männern liegt der Bereich etwas höher (etwa ${normText('hb', { geschlecht: 'm' })}).`+' Ein niedriger Hb heißt Anämie: Blässe, Müdigkeit, Belastungsatemnot.']),
  bereich('labor.leuko', THEMEN.blut, 'Blutbild', 'Wie viele Leukozyten pro Mikroliter Blut sind normal?',
    [`Etwa ${proUl('leuko')}`, `Etwa ${proUl('thrombo')}`, 'Etwa 4 bis 6 Millionen', 'Etwa 100 bis 500'],
    ['Erhöhte Leukozyten (Leukozytose) sprechen oft für eine Infektion. 150.000 bis 400.000 ist der Bereich der Thrombozyten, 4 bis 6 Millionen der der Erythrozyten.']),
  bereich('labor.thrombo', THEMEN.blut, 'Blutbild', 'Wie viele Thrombozyten pro Mikroliter Blut sind normal?',
    [`Etwa ${proUl('thrombo')}`, `Etwa ${proUl('leuko')}`, 'Etwa 1.000 bis 5.000', 'Etwa 1 bis 2 Millionen'],
    ['Bei stark erniedrigten Thrombozyten besteht Blutungsgefahr: keine i. m.-Injektionen, weiche Zahnbürste, auf Petechien achten.']),
  wert('labor.wert.crp', THEMEN.blut, 'Entzündungswerte', 'Das CRP einer Patientin mit Fieber liegt bei 120 mg/l.', 2,
    [`Normal ist ein CRP ${normText('crp', { nachkomma: 0 })}.`+' Ein deutlich erhöhter Wert spricht für eine Entzündung, oft eine bakterielle Infektion.']),
  wert('labor.wert.kalium', THEMEN.niere, 'Elektrolyte', 'Ein Patient unter hochdosierten Diuretika hat ein Kalium von 2,9 mmol/l.', 0,
    ['Hypokaliämie: Muskelschwäche, Verstopfung und Herzrhythmusstörungen drohen. Sofort ärztlich melden.']),
];

// ---------------------------------------------------------------- Ausscheidung

const ausscheidung: Aufgabe[] = [
  bereich('ausscheidung.urin', THEMEN.ausscheidung, 'Urin', 'Wie viel Urin scheidet ein Erwachsener normalerweise am Tag aus?',
    ['Etwa 1.000 bis 2.000 ml', 'Etwa 100 bis 300 ml', 'Etwa 3.000 bis 5.000 ml', 'Etwa 500 ml'],
    ['Faustregel: mindestens etwa 0,5 ml je Kilogramm Körpergewicht und Stunde. Die Menge hängt von der Trinkmenge ab.']),
  bereich('ausscheidung.oligurie', THEMEN.ausscheidung, 'Urin', 'Ab welcher Tagesmenge spricht man von Oligurie?',
    ['Unter 500 ml in 24 Stunden', 'Unter 1.500 ml in 24 Stunden', 'Unter 100 ml in 24 Stunden', 'Über 3.000 ml in 24 Stunden'],
    ['Unter 100 ml in 24 Stunden heißt Anurie, über 3.000 ml Polyurie (z. B. bei entgleistem Diabetes).']),
  bereich('ausscheidung.stuhl', THEMEN.ausscheidung, 'Stuhl', 'Welche Stuhlhäufigkeit gilt bei Erwachsenen noch als normal?',
    ['Von dreimal täglich bis dreimal pro Woche', 'Genau einmal täglich', 'Höchstens einmal pro Woche', 'Mindestens fünfmal täglich'],
    ['Wichtig ist die Veränderung gegenüber den eigenen Gewohnheiten. Obstipation: seltener als dreimal pro Woche, harter Stuhl, starkes Pressen.']),
  bereich('ausscheidung.trinken', THEMEN.ausscheidung, 'Flüssigkeit', 'Wie viel sollte ein gesunder älterer Mensch ungefähr am Tag trinken, wenn ärztlich nichts anderes festgelegt ist?',
    ['Etwa 1,5 Liter', 'Etwa 0,5 Liter', 'Etwa 4 Liter', 'So wenig wie möglich, um Inkontinenz zu vermeiden'],
    ['Bei Herz- oder Niereninsuffizienz kann eine Trinkmengenbegrenzung angeordnet sein. Trinkmenge zu reduzieren, um Inkontinenz zu vermeiden, fördert Exsikkose und Harnwegsinfektionen.']),
  wert('ausscheidung.wert.dk', THEMEN.ausscheidung, 'Urin', 'Ein 70 kg schwerer Patient mit Blasenkatheter hat in den letzten 6 Stunden 90 ml Urin ausgeschieden.', 0,
    ['Erwartet wären mindestens etwa 0,5 ml/kg/h, also rund 35 ml pro Stunde und 210 ml in 6 Stunden. Erst Katheter auf Abknicken prüfen, dann ärztlich melden.']),
  wert('ausscheidung.wert.urin', THEMEN.ausscheidung, 'Urin', 'Eine Bewohnerin hat in 24 Stunden 1.400 ml Urin ausgeschieden und 1.600 ml getrunken.', 1,
    ['Die Ausfuhr passt zur Einfuhr. Der Rest geht über Haut, Atmung und Stuhl verloren (Perspiratio insensibilis).']),
];

export const BEREICHE: Bereich[] = [
  {
    id: 'vital', label: 'Vitalzeichen', kurz: 'Puls, Atmung, Blutdruck, Temperatur, SpO2',
    wissen: [`Puls ${nb('puls')}/min, Atmung ${nb('af')}/min.`, `Blutdruck optimal unter 120/80, Hypertonie ab ${VITAL_SCHWELLEN.hypertonie.join('/')} mmHg.`, `Fieber über ${fieber} °C. SpO2 ${nb('spo2')} %.`],
  },
  {
    id: 'labor', label: 'Blutzucker und Labor', kurz: 'Blutzucker, Elektrolyte, Blutbild, CRP',
    wissen: ['Nüchternblutzucker unter 100 mg/dl, Hypoglykämie unter 70 mg/dl.', `Kalium ${normText('k')}, Natrium ${normText('na')}.`, `Leukozyten ${proUl('leuko')}, Thrombozyten ${proUl('thrombo')} pro µl.`],
  },
  {
    id: 'ausscheidung', label: 'Ausscheidung', kurz: 'Urinmenge, Stuhl, Flüssigkeit',
    wissen: ['Urin etwa 1.000 bis 2.000 ml am Tag, mindestens etwa 0,5 ml/kg/h.', 'Oligurie unter 500 ml, Anurie unter 100 ml in 24 Stunden.', 'Stuhl: dreimal täglich bis dreimal pro Woche.'],
  },
];

export const AUFGABEN: Record<BereichId, Aufgabe[]> = mitVertiefung(ergaenze({ vital, labor, ausscheidung }, ERWEITERUNG), VERTIEFUNG);
export const ALLE_AUFGABEN: Aufgabe[] = Object.values(AUFGABEN).flat();
