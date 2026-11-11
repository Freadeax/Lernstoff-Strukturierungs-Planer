// Diagnostik-Fälle. Fiktiv, didaktisch vereinfacht, fachlich ungeprüft.
// Bilder sind synthetische Phantome (siehe src/ui/sim/bildgebung/phantom.ts).

import type { DiagnostikFall, Pruefpunkt } from './typen';

const v = (basis: number, extra: Partial<{ proStunde: number; grenze: number; therapie: { flag: string; ziel: number; tauMin: number }[]; vorwerte: { minute: number; wert: number }[] }> = {}) => ({ basis, ...extra });
const VORGESTERN = -2880;

/** Echte, frei lizenzierte Bilder (CC BY-NC-SA 3.0, Radiopaedia, über den offenen Datensatz ieee8023/covid-chestxray-dataset). Zugeschnitten und verkleinert. */
const RADIOPAEDIA = 'CC BY-NC-SA 3.0';


/** Vorbereitung einer CT mit jodhaltigem Kontrastmittel. Fallabhängig: Metformin, Schwangerschaft, Transport. */
function kmCt(o: { metformin?: boolean; gebaerfaehig?: boolean; instabil?: boolean }): Pruefpunkt[] {
  return [
    { id: 'niere', text: 'Aktuelles Kreatinin/eGFR liegt vor', noetig: true, warum: 'Jodhaltiges Kontrastmittel kann die Niere belasten; bei eingeschränkter Funktion ärztliche Nutzen-Risiko-Abwägung und ggf. Flüssigkeitsgabe.' },
    { id: 'tsh', text: 'Schilddrüsenwert (TSH) bzw. bekannte Überfunktion erfragt', noetig: true, warum: 'Bei Überfunktion kann Jod eine thyreotoxische Krise auslösen.' },
    { id: 'allergie', text: 'Allergien und frühere Kontrastmittelreaktion erfragt', noetig: true, warum: 'Frühere Reaktion = Risiko; Arzt entscheidet über Vorbereitung, Notfallausrüstung bereit.' },
    { id: 'zugang', text: 'Gut liegender venöser Zugang (mind. 20 G) geprüft', noetig: true, warum: 'Kontrastmittel wird mit hohem Fluss injiziert; ein dünner oder paravenöser Zugang führt zu Extravasat.' },
    { id: 'aufklaerung', text: 'Ärztliche Aufklärung/Einwilligung dokumentiert', noetig: true, warum: 'Aufklärung ist ärztliche Aufgabe; die Pflege prüft, ob sie vorliegt.' },
    { id: 'metall', text: 'Metall im Untersuchungsbereich entfernt (Ketten, BH mit Bügel, EKG-Kabel ordnen)', noetig: true, warum: 'Metall erzeugt Streifenartefakte im Bild.' },
    { id: 'metformin', text: 'Metformin-Einnahme an Arzt gemeldet', noetig: !!o.metformin, warum: o.metformin ? 'Bei eingeschränkter Nierenfunktion wird Metformin nach Anordnung pausiert (Laktatazidose-Risiko).' : 'Nimmt kein Metformin, hier nicht relevant.' },
    { id: 'schwanger', text: 'Schwangerschaft ausgeschlossen bzw. erfragt', noetig: !!o.gebaerfaehig, warum: o.gebaerfaehig ? 'Strahlenschutz: bei Frauen im gebärfähigen Alter vor jeder Röntgenuntersuchung klären.' : 'Nicht im gebärfähigen Alter.' },
    { id: 'monitor', text: 'Transport mit Monitor und Begleitung organisiert', noetig: !!o.instabil, warum: o.instabil ? 'Instabile Patienten nie allein transportieren: Monitor, Sauerstoff, Notfallausrüstung, qualifizierte Begleitung.' : 'Stabil, Begleitung nach Hausstandard.' },
    { id: 'nuechtern', text: 'Patient 12 Stunden nüchtern lassen', noetig: false, warum: 'Für eine CT mit intravenösem Kontrastmittel ist langes Nüchternsein meist nicht nötig und schadet (Exsikkose). Hausstandard beachten.' },
    { id: 'schrittmacher', text: 'Herzschrittmacher-Ausweis anfordern', noetig: false, warum: 'Wichtig beim MRT, nicht bei der CT.' },
  ];
}

function roentgen(o: { gebaerfaehig?: boolean; bett?: boolean }): Pruefpunkt[] {
  return [
    { id: 'metall', text: 'Schmuck und Metall im Brustbereich entfernt', noetig: true, warum: 'Überlagert sonst Lungenfelder.' },
    { id: 'schwanger', text: 'Schwangerschaft ausgeschlossen bzw. erfragt', noetig: !!o.gebaerfaehig, warum: o.gebaerfaehig ? 'Strahlenschutz bei Frauen im gebärfähigen Alter.' : 'Nicht im gebärfähigen Alter.' },
    { id: 'bett', text: 'Aufnahme im Bett (Liegendaufnahme) anmelden', noetig: !!o.bett, warum: o.bett ? 'Kann nicht stehen: Liegendaufnahme a.p.; Herz wirkt darauf größer.' : 'Kann stehen: Standardaufnahme p.a. im Stehen ist aussagekräftiger.' },
    { id: 'nuechtern', text: 'Patient nüchtern lassen', noetig: false, warum: 'Für ein Röntgenbild des Thorax nicht nötig.' },
  ];
}

export const FAELLE: DiagnostikFall[] = [
  {
    id: 'sepsis-pneumonie',
    raum: '12_station_kardiologie_monitoring',
    monitor: { start: 'abwesend', sensorAusfallNach: 25 },
    titel: 'Fieber, Atemnot, verwirrt',
    kurz: 'Pneumonie mit Sepsisverdacht: Laktat, Blutkulturen vor Antibiose, Röntgen und CT',
    bereich: 'Innere Station, Frühdienst',
    startzeit: '07:40',
    patient: {
      name: 'Herr Heinz M.', alter: 78, geschlecht: 'm', gewicht: 72,
      anlass: 'Seit gestern Husten mit gelblichem Auswurf, heute früh verwirrt, 39,1 °C, atmet schnell.',
      vorgeschichte: ['Diabetes mellitus Typ 2', 'Arterielle Hypertonie', 'Leichte Niereninsuffizienz'],
      medikamente: ['Metformin 1000 mg 1-0-1', 'Ramipril 5 mg 1-0-0'], allergien: 'keine bekannt',
      infusion: 'Vollelektrolytlösung am linken Unterarm',
    },
    vital: {
      puls: v(112, { proStunde: 6, grenze: 132, therapie: [{ flag: 'volumen', ziel: 96, tauMin: 60 }] }),
      af: v(26, { proStunde: 1, grenze: 32, therapie: [{ flag: 'o2', ziel: 22, tauMin: 40 }] }),
      spo2: v(89, { proStunde: -1, grenze: 84, therapie: [{ flag: 'o2', ziel: 95, tauMin: 15 }] }),
      sys: v(98, { proStunde: -5, grenze: 78, therapie: [{ flag: 'volumen', ziel: 112, tauMin: 45 }] }),
      dia: v(58, { proStunde: -3, grenze: 45, therapie: [{ flag: 'volumen', ziel: 66, tauMin: 45 }] }),
      temp: v(39.1, { therapie: [{ flag: 'antibiose', ziel: 37.8, tauMin: 360 }] }),
    },
    labor: {
      leuko: v(16.8, { vorwerte: [{ minute: -60 * 24 * 30, wert: 7.2 }] }),
      hb: v(12.4), thrombo: v(168, { proStunde: -2, grenze: 120 }),
      crp: v(148, { proStunde: 3, grenze: 260, therapie: [{ flag: 'antibiose', ziel: 60, tauMin: 1800 }], vorwerte: [{ minute: -60 * 24 * 30, wert: 3 }] }),
      pct: v(3.4, { proStunde: 0.2, grenze: 8, therapie: [{ flag: 'antibiose', ziel: 1.2, tauMin: 1800 }] }),
      na: v(134), k: v(4.4), ca: v(2.3),
      krea: v(1.6, { proStunde: 0.03, grenze: 2.2, therapie: [{ flag: 'volumen', ziel: 1.2, tauMin: 360 }], vorwerte: [{ minute: -60 * 24 * 30, wert: 1.1 }] }),
      egfr: v(30, { proStunde: -1, grenze: 22, therapie: [{ flag: 'volumen', ziel: 42, tauMin: 360 }], vorwerte: [{ minute: -60 * 24 * 30, wert: 48 }] }),
      harnstoff: v(68), glukose: v(212), bz: v(208),
      laktat: v(2.9, { proStunde: 0.5, grenze: 6.5, therapie: [{ flag: 'volumen', ziel: 1.5, tauMin: 90 }] }),
      ph: v(7.31, { proStunde: -0.02, grenze: 7.18, therapie: [{ flag: 'volumen', ziel: 7.38, tauMin: 120 }] }),
      pco2: v(31), po2: v(56, { therapie: [{ flag: 'o2', ziel: 82, tauMin: 15 }] }), hco3: v(16.5, { therapie: [{ flag: 'volumen', ziel: 22, tauMin: 180 }] }), be: v(-8, { therapie: [{ flag: 'volumen', ziel: -2, tauMin: 180 }] }), sao2: v(88, { therapie: [{ flag: 'o2', ziel: 95, tauMin: 15 }] }),
      inr: v(1.1), aptt: v(31), ddimer: v(1.4), tsh: v(1.8),
      bk: v(1),
      'u-leuko': v(0), 'u-nitrit': v(0), 'u-keton': v(1), 'u-glukose': v(2),
    },
    empfohlen: ['leuko', 'crp', 'pct', 'laktat', 'krea', 'bk', 'bz'],
    bildgebung: [
      {
        serie: { id: 'sp-rx', titel: 'Röntgen-Thorax', untersuchung: 'Röntgen-Thorax p.a. im Stehen', quelle: { art: 'phantom', modalitaet: 'roentgen', variante: 'pneumonie' }, befunde: [{ id: 'infiltrat', x: 0.275, y: 0.56, r: 0.1, titel: 'Verschattung rechts basal', text: 'Unscharf begrenzte Verdichtung im rechten Unterfeld (im Bild links).' }], befundtext: 'Infiltrat im rechten Unterfeld, vereinbar mit Pneumonie. Kein Pneumothorax. Herz normal groß.' },
        echt: { id: 'sp-rx-echt', titel: 'Röntgen-Thorax (echtes Bild)', untersuchung: 'Röntgen-Thorax a.p. im Sitzen (Vergleichsbild eines anderen Patienten)', quelle: { art: 'bilder', modalitaet: 'roentgen', basis: 'bildgebung/pneumonie-rx', dateien: ['rontgen-pa.jpg'], lizenz: RADIOPAEDIA, urheber: 'Case courtesy of Assoc Prof Frank Gaillard, Radiopaedia.org, rID: 11009', quelleUrl: 'https://radiopaedia.org/cases/pneumonia-7' }, befunde: [{ id: 'infiltrat', x: 0.27, y: 0.6, r: 0.15, titel: 'Konsolidierung rechts', text: 'Dichte Verschattung im rechten Mittel- und Unterfeld (im Bild links), die rechte Zwerchfellkontur ist nicht mehr abgrenzbar.' }], befundtext: 'Ausgedehnte Konsolidierung rechts mit Luftbronchogramm und Verlust der rechten Zwerchfellkontur, vereinbar mit einer Pneumonie im rechten Unterlappen. Echtes Vergleichsbild, nicht von Herrn M.' },
        dauer: 30, befundNach: 30, kontrastmittel: false, vorbereitung: roentgen({}),
      },
      {
        serie: { id: 'sp-ct', titel: 'CT-Thorax nativ', untersuchung: 'CT-Thorax ohne Kontrastmittel', quelle: { art: 'phantom', modalitaet: 'ct', variante: 'pneumonie', schichten: 40 }, schichtdicke: 5, befunde: [{ id: 'konsolidierung', schichten: [24, 34], x: 0.275, y: 0.62, r: 0.11, titel: 'Konsolidierung rechter Unterlappen', text: 'Verdichtung mit Luftbronchogramm (dunkle Bronchien in hellem Lungengewebe), Milchglas am Rand.' }], befundtext: 'Konsolidierung im rechten Unterlappen mit Aerobronchogramm, typisch für eine Lobärpneumonie. Kein Abszess, kein relevanter Erguss.' },
        dauer: 40, befundNach: 30, kontrastmittel: false,
        vorbereitung: [
          { id: 'metall', text: 'Metall im Untersuchungsbereich entfernt', noetig: true, warum: 'Streifenartefakte.' },
          { id: 'monitor', text: 'Transport mit Monitor und Begleitung', noetig: true, warum: 'Sepsisverdacht, niedriger Blutdruck: instabil, nie allein transportieren.' },
          { id: 'niere', text: 'Aktuelles Kreatinin/eGFR liegt vor', noetig: false, warum: 'Ohne Kontrastmittel nicht nötig, auch wenn der Wert hier ohnehin wichtig ist.' },
          { id: 'nuechtern', text: 'Patient nüchtern lassen', noetig: false, warum: 'Nicht nötig; bei Fieber und Sepsis zählt jede Flüssigkeit.' },
        ],
      },
    ],
    sbar: [
      { id: 's1', text: 'S: Herr M., 78, zunehmende Atemnot, verwirrt, Verdacht auf Sepsis', relevant: true },
      { id: 'b1', text: 'B: Diabetes, Niereninsuffizienz, nimmt Metformin', relevant: true },
      { id: 'a1', text: 'A: AF 26, SpO₂ 89 %, RR 98/58, Puls 112, 39,1 °C', relevant: true },
      { id: 'a2', text: 'A: Laktat erhöht, CRP und Leukozyten erhöht', relevant: true },
      { id: 'a3', text: 'A: Röntgen mit Verschattung rechts basal', relevant: true },
      { id: 'x1', text: 'Er hat heute kaum gefrühstückt', relevant: false },
      { id: 'x2', text: 'Die Tochter ruft am Nachmittag an', relevant: false },
      { id: 'r1', text: 'R: Bitte kommen Sie sofort, ich brauche Anordnungen für Sauerstoff, Volumen und Antibiose', relevant: true },
    ],
    anordnungen: [
      { id: 'o2', label: 'Sauerstoff über Nasenbrille 2–4 l/min', text: 'O₂ nach SpO₂-Ziel 92–96 %.', flag: 'o2', dauer: 3 },
      { id: 'bk', label: 'Blutkulturen abnehmen (2 Sets)', text: 'Zwei Blutkultursets vor der ersten Antibiotikagabe.', flag: 'bk-abgenommen', dauer: 10 },
      { id: 'volumen', label: 'Infusion nach Anordnung (Bolus)', text: 'Vollelektrolytlösung als Bolus, danach nach Kreislauf. Bilanz.', flag: 'volumen', dauer: 5 },
      { id: 'antibiose', label: 'Antibiotikum i.v. verabreichen', text: 'Fiktiv: Antibiotikum i.v. sofort nach Abnahme der Blutkulturen.', flag: 'antibiose', dauer: 10 },
      { id: 'metformin', label: 'Metformin pausieren', text: 'Metformin bis auf Weiteres pausieren (Sepsis, Niere).', flag: 'metformin-pause', dauer: 1 },
    ],
    reihenfolge: [['bk-abgenommen', 'antibiose', 'Blutkulturen gehören vor die erste Antibiotikagabe, sonst wachsen die Erreger oft nicht mehr an.']],
    fragen: [
      { id: 'sp-f1', art: 'befund', frage: 'Tippe im Röntgenbild auf die Verschattung.', serie: 'sp-rx', befund: 'infiltrat', erklaerung: 'Patientenrechts liegt im Bild links. Die Verschattung ist unscharf und überdeckt die Gefäßzeichnung.' },
      { id: 'sp-f2', art: 'befund', frage: 'Blättere im CT zur Konsolidierung und tippe darauf.', serie: 'sp-ct', befund: 'konsolidierung', erklaerung: 'Im Lungenfenster ist gesunde Lunge fast schwarz. Die Konsolidierung ist weichteildicht, darin dunkle Bronchien (Aerobronchogramm).' },
      { id: 'sp-f3', art: 'wahl', frage: 'Laktat 2,9 mmol/l bei Fieber und niedrigem Blutdruck. Was folgt daraus für dich?', optionen: [
        { text: 'Sofort ärztlich melden (Sepsisverdacht), Vitalzeichen engmaschig', richtig: true, warum: 'Laktat über 2 mmol/l mit Infektzeichen ist ein Warnzeichen für Sepsis; jede Stunde bis zur Therapie zählt.' },
        { text: 'Bis zur Visite abwarten, der Wert ist nur leicht erhöht', richtig: false, warum: 'Leicht erhöhtes Laktat bei Infekt ist kein Grund zur Entwarnung, sondern zum Handeln.' },
        { text: 'Laktat in 24 h kontrollieren', richtig: false, warum: 'Viel zu spät; Laktat wird nach Therapie früh (nach 2–4 h) kontrolliert.' },
      ] },
      { id: 'sp-f4', art: 'bga', frage: 'Deute die BGA: pH 7,31, pCO₂ 31 mmHg, HCO₃⁻ 16,5 mmol/l, Laktat 2,9.', werte: { ph: 7.31, pco2: 31, hco3: 16.5, po2: 56, laktat: 2.9 }, stoerung: 'metabolische Azidose', kompensation: 'teilweise', erklaerung: 'pH sauer, HCO₃⁻ niedrig = metabolisch (Laktat). Die schnelle Atmung senkt das pCO₂ und gleicht teilweise aus.' },
    ],
    aufloesung: { diagnose: 'Ambulant erworbene Pneumonie rechts mit Sepsis', kernaussage: 'Laktat, Atemfrequenz, Bewusstsein und Blutdruck zeigen die Sepsis früh. Blutkulturen vor der ersten Antibiotikagabe, dann ohne Verzögerung behandeln.', pflege: ['Engmaschige Vitalzeichen und NEWS2, Bewusstsein (ACVPU)', 'Sauerstoff nach Anordnung, Oberkörper hoch, Atemübungen und Pneumonieprophylaxe', 'Bilanz und Urinausscheidung, Zeichen der Volumenüberladung', 'Metformin nach Anordnung pausieren, Blutzucker kontrollieren', 'Verwirrtheit: Sturz- und Delirprophylaxe'] },
    bezug: ['pneumonie', 'sepsis'],
  },
  {
    id: 'lungenembolie',
    raum: '13_station_postop',
    titel: 'Plötzliche Atemnot nach Knie-OP',
    kurz: 'Lungenembolie: D-Dimere, BGA, CT-Angiographie mit Kontrastmittel-Vorbereitung',
    bereich: 'Unfallchirurgie, Spätdienst',
    startzeit: '15:20',
    patient: {
      name: 'Herr Bernd K.', alter: 64, geschlecht: 'm', gewicht: 96,
      anlass: 'Fünfter Tag nach Knie-TEP rechts. Beim ersten Gang zur Toilette plötzlich Atemnot und stechender Brustschmerz beim Einatmen.',
      vorgeschichte: ['Adipositas', 'Raucher (30 Packungsjahre)', 'Thromboseprophylaxe am OP-Wochenende zweimal ausgelassen'],
      medikamente: ['Enoxaparin 40 mg s.c. abends', 'Metformin 850 mg 1-0-1', 'Metamizol bei Bedarf'], allergien: 'Pflaster',
    },
    vital: {
      puls: v(118, { proStunde: 4, grenze: 135, therapie: [{ flag: 'heparin', ziel: 98, tauMin: 180 }] }),
      af: v(28, { therapie: [{ flag: 'o2', ziel: 22, tauMin: 30 }] }),
      spo2: v(87, { proStunde: -1, grenze: 83, therapie: [{ flag: 'o2', ziel: 94, tauMin: 15 }] }),
      sys: v(124, { proStunde: -4, grenze: 98 }), dia: v(80, { proStunde: -2, grenze: 60 }),
      temp: v(37.4),
    },
    labor: {
      leuko: v(9.8), hb: v(11.6, { vorwerte: [{ minute: VORGESTERN, wert: 11.9 }] }), thrombo: v(242, { vorwerte: [{ minute: VORGESTERN, wert: 251 }] }),
      crp: v(38, { vorwerte: [{ minute: VORGESTERN, wert: 64 }] }),
      na: v(139), k: v(4.2), ca: v(2.35),
      krea: v(0.96), egfr: v(84), harnstoff: v(31), tsh: v(1.2),
      trop: v(38, { proStunde: 6, grenze: 70 }), ntprobnp: v(980),
      ddimer: v(4.8), inr: v(1.0), aptt: v(30, { therapie: [{ flag: 'heparin', ziel: 68, tauMin: 120 }] }),
      glukose: v(146), bz: v(150),
      ph: v(7.48), pco2: v(30), po2: v(56, { therapie: [{ flag: 'o2', ziel: 78, tauMin: 15 }] }), hco3: v(22.4), be: v(-0.5), sao2: v(87, { therapie: [{ flag: 'o2', ziel: 94, tauMin: 15 }] }), laktat: v(1.6),
    },
    empfohlen: ['ddimer', 'trop', 'krea', 'egfr', 'ph', 'po2', 'pco2', 'aptt', 'inr', 'hb'],
    bildgebung: [
      {
        serie: { id: 'le-ct', titel: 'CT-Angiographie', untersuchung: 'CT-Thorax mit Kontrastmittel (CT-Pulmonalisangiographie)', quelle: { art: 'phantom', modalitaet: 'ct', variante: 'lungenembolie', schichten: 40, kontrast: true }, schichtdicke: 5, befunde: [{ id: 'thrombus', schichten: [14, 19], x: 0.45, y: 0.48, r: 0.06, titel: 'Füllungsdefekt rechte Pulmonalarterie', text: 'Das Kontrastmittel macht Gefäße hell; der Thrombus ist eine dunkle Aussparung im hellen Gefäß.' }], befundtext: 'Zentrale Lungenembolie der rechten Pulmonalarterie. Rechtes Herz leicht erweitert. Kein Infiltrat.' },
        dauer: 35, befundNach: 20, kontrastmittel: true, vorbereitung: kmCt({ metformin: true, instabil: true }),
      },
    ],
    sbar: [
      { id: 's1', text: 'S: Herr K., 5. Tag nach Knie-TEP, plötzliche Atemnot und atemabhängiger Brustschmerz', relevant: true },
      { id: 'b1', text: 'B: Thromboseprophylaxe zweimal ausgelassen, Raucher, Adipositas', relevant: true },
      { id: 'a1', text: 'A: SpO₂ 87 %, AF 28, Puls 118, RR 124/80', relevant: true },
      { id: 'a2', text: 'A: D-Dimere deutlich erhöht, Troponin leicht erhöht, pO₂ niedrig', relevant: true },
      { id: 'x1', text: 'Er möchte heute noch duschen', relevant: false },
      { id: 'x2', text: 'Die Wunde am Knie ist reizlos', relevant: false },
      { id: 'r1', text: 'R: Bitte sofort kommen, Verdacht auf Lungenembolie. Soll ich die CT vorbereiten?', relevant: true },
    ],
    anordnungen: [
      { id: 'o2', label: 'Sauerstoff nach SpO₂-Ziel', text: 'O₂ über Maske/Nasenbrille, Ziel SpO₂ 92–96 %.', flag: 'o2', dauer: 3 },
      { id: 'bettruhe', label: 'Oberkörper hoch, nicht mobilisieren', text: 'Bettruhe bis zur Diagnostik, Oberkörper erhöht.', flag: 'bettruhe', dauer: 2 },
      { id: 'heparin', label: 'Heparin i.v. nach Anordnung', text: 'Fiktiv: Heparin-Bolus und Perfusor nach Schema; aPTT-Kontrolle nach 6 h.', flag: 'heparin', dauer: 10 },
      { id: 'metformin', label: 'Metformin pausieren', text: 'Wegen Kontrastmittel Metformin nach Hausstandard pausieren.', flag: 'metformin-pause', dauer: 1 },
    ],
    fragen: [
      { id: 'le-f1', art: 'befund', frage: 'Blättere zur Höhe der Pulmonalarterien und tippe auf den Thrombus.', serie: 'le-ct', befund: 'thrombus', erklaerung: 'In der CT-Angiographie sind Gefäße hell. Ein Thrombus spart das Kontrastmittel aus und erscheint als dunkler Fleck im Gefäß.' },
      { id: 'le-f2', art: 'bga', frage: 'Deute die BGA: pH 7,48, pCO₂ 30 mmHg, HCO₃⁻ 22,4 mmol/l, pO₂ 56 mmHg.', werte: { ph: 7.48, pco2: 30, hco3: 22.4, po2: 56 }, stoerung: 'respiratorische Alkalose', kompensation: 'keine', erklaerung: 'Er atmet schnell und tief: CO₂ wird abgeatmet, der pH steigt. Trotzdem ist der Sauerstoff niedrig: typisch für die Lungenembolie.' },
      { id: 'le-f3', art: 'wahl', frage: 'Was gehört vor die CT-Angiographie?', optionen: [
        { text: 'Kreatinin/eGFR, Schilddrüse und Allergien klären, großlumiger Zugang', richtig: true, warum: 'Jodhaltiges Kontrastmittel: Niere, Schilddrüse und Allergie sind die drei Risiken, dazu ein Zugang, der den Injektionsfluss verträgt.' },
        { text: 'Patient 12 Stunden nüchtern lassen', richtig: false, warum: 'Unnötige Verzögerung bei einem Notfall.' },
        { text: 'Zur Toilette mobilisieren, damit er im CT liegen bleiben kann', richtig: false, warum: 'Bei Verdacht auf Lungenembolie nicht mobilisieren.' },
      ] },
    ],
    aufloesung: { diagnose: 'Zentrale Lungenembolie rechts', kernaussage: 'Plötzliche Atemnot nach OP und ausgelassener Thromboseprophylaxe ist bis zum Beweis des Gegenteils eine Lungenembolie. D-Dimere sind nur hilfreich, wenn sie normal sind.', pflege: ['Nicht mobilisieren, Oberkörper hoch, Monitor', 'Sauerstoff nach Anordnung, engmaschig SpO₂, AF, RR', 'Kontrastmittel vorbereiten: Niere, Schilddrüse, Allergie, Zugang', 'Heparin nach Schema, Blutungszeichen beobachten, aPTT-Kontrollen', 'Thromboseprophylaxe nie stillschweigend auslassen: Gründe dokumentieren und melden'] },
    bezug: ['lungenembolie', 'thrombose'],
  },
  {
    id: 'herzinsuffizienz',
    raum: '18_notaufnahme_schockraum_nacht',
    titel: 'Wasser in den Beinen, kaum Luft',
    kurz: 'Dekompensierte Herzinsuffizienz: NT-proBNP, Kalium-Falle durch Hämolyse, Röntgen mit Stauung',
    bereich: 'Pflegeheim → Notaufnahme',
    startzeit: '10:15',
    patient: {
      name: 'Frau Klara S.', alter: 84, geschlecht: 'w', gewicht: 71,
      anlass: 'Seit einer Woche 4 kg zugenommen, Beine geschwollen, nachts nur sitzend schlafen, heute Atemnot schon beim Sprechen.',
      vorgeschichte: ['Herzinsuffizienz (Pumpfunktion eingeschränkt)', 'Vorhofflimmern', 'Chronische Niereninsuffizienz'],
      medikamente: ['Ramipril 5 mg', 'Spironolacton 25 mg', 'Torasemid 10 mg', 'Apixaban 2,5 mg 1-0-1'], allergien: 'keine bekannt',
    },
    vital: {
      puls: v(104), af: v(28, { therapie: [{ flag: 'diuretikum', ziel: 20, tauMin: 120 }] }),
      spo2: v(88, { therapie: [{ flag: 'o2', ziel: 93, tauMin: 15 }, { flag: 'diuretikum', ziel: 95, tauMin: 120 }] }),
      sys: v(162, { therapie: [{ flag: 'diuretikum', ziel: 138, tauMin: 120 }] }), dia: v(92, { therapie: [{ flag: 'diuretikum', ziel: 78, tauMin: 120 }] }), temp: v(36.8),
    },
    labor: {
      leuko: v(8.2), hb: v(11.2), thrombo: v(210),
      na: v(131, { vorwerte: [{ minute: -60 * 24 * 14, wert: 136 }] }),
      k: v(5.3, { therapie: [{ flag: 'diuretikum', ziel: 4.6, tauMin: 600 }], vorwerte: [{ minute: -60 * 24 * 14, wert: 4.9 }] }),
      ca: v(2.25),
      krea: v(1.7, { vorwerte: [{ minute: -60 * 24 * 14, wert: 1.4 }] }), egfr: v(27, { vorwerte: [{ minute: -60 * 24 * 14, wert: 34 }] }), harnstoff: v(88),
      ntprobnp: v(6800, { vorwerte: [{ minute: -60 * 24 * 90, wert: 1900 }] }), trop: v(24),
      crp: v(6), inr: v(1.3), aptt: v(34), ddimer: v(0.9), glukose: v(118), bz: v(121), tsh: v(2.1),
      ph: v(7.37), pco2: v(41), po2: v(58, { therapie: [{ flag: 'o2', ziel: 72, tauMin: 15 }] }), hco3: v(23.5), be: v(-0.5), sao2: v(88), laktat: v(1.4),
    },
    empfohlen: ['ntprobnp', 'na', 'k', 'krea', 'egfr', 'trop', 'hb'],
    bildgebung: [
      {
        serie: { id: 'hi-rx', titel: 'Röntgen-Thorax', untersuchung: 'Röntgen-Thorax im Sitzen/Liegen (a.p.)', quelle: { art: 'phantom', modalitaet: 'roentgen', variante: 'stauung' }, befunde: [
          { id: 'herz', x: 0.55, y: 0.58, r: 0.17, titel: 'Vergrößertes Herz', text: 'Herzschatten breiter als die Hälfte des Brustkorbs.' },
          { id: 'erguss', x: 0.85, y: 0.66, r: 0.09, titel: 'Pleuraerguss', text: 'Stumpfer Rippen-Zwerchfell-Winkel mit nach außen ansteigendem Spiegel.' },
        ], befundtext: 'Kardiomegalie, zentrale Stauung mit Zeichnungsvermehrung um die Hili, Kerley-B-Linien, beidseitige Pleuraergüsse.' },
        echt: { id: 'hi-rx-echt', titel: 'Röntgen-Thorax (echtes Bild)', untersuchung: 'Röntgen-Thorax p.a. (Vergleichsbild: Pleuraerguss eines anderen Patienten)', quelle: { art: 'bilder', modalitaet: 'roentgen', basis: 'bildgebung/erguss-rx', dateien: ['rontgen-pa.jpg'], lizenz: RADIOPAEDIA, urheber: 'Case courtesy of Dr Henry Knipe, Radiopaedia.org, rID: 44224', quelleUrl: 'https://radiopaedia.org/cases/parapneumonic-effusion-1' }, befunde: [{ id: 'erguss', x: 0.75, y: 0.55, r: 0.13, titel: 'Pleuraerguss links', text: 'Homogene Verschattung unten links (im Bild rechts) mit nach außen ansteigendem Rand (Meniskuszeichen), der Winkel zwischen Rippen und Zwerchfell ist verstrichen.' }], befundtext: 'Pleuraerguss links mit Meniskuszeichen. Das Bild zeigt einen Erguss bei Pneumonie, keine Herzinsuffizienz: das Herz ist hier normal groß. Zum Vergleich mit dem synthetischen Bild, nicht von Frau S.' },
        dauer: 20, befundNach: 30, kontrastmittel: false, vorbereitung: roentgen({ bett: true }),
      },
    ],
    sbar: [
      { id: 's1', text: 'S: Frau S., 84, Atemnot in Ruhe, SpO₂ 88 %', relevant: true },
      { id: 'b1', text: 'B: Herzinsuffizienz, 4 kg Gewichtszunahme in einer Woche, Ödeme', relevant: true },
      { id: 'a1', text: 'A: AF 28, RR 162/92, Puls 104 unregelmäßig, feuchte Rasselgeräusche', relevant: true },
      { id: 'a2', text: 'A: NT-proBNP stark erhöht, Natrium niedrig, Kreatinin gestiegen', relevant: true },
      { id: 'x1', text: 'A: Kalium 6,7 mmol/l aus hämolytischer Probe', relevant: false },
      { id: 'x2', text: 'Sie trägt eine Brille', relevant: false },
      { id: 'r1', text: 'R: Bitte Anordnung für Sauerstoff und Diuretikum, Gewicht und Bilanz?', relevant: true },
    ],
    anordnungen: [
      { id: 'o2', label: 'Sauerstoff nach SpO₂-Ziel', text: 'O₂ nach Ziel 92–96 %.', flag: 'o2', dauer: 3 },
      { id: 'lagerung', label: 'Herzbettlage (Oberkörper hoch, Beine tief)', text: 'Oberkörper hoch, Beine tief lagern.', flag: 'lagerung', dauer: 3 },
      { id: 'diuretikum', label: 'Diuretikum i.v. nach Anordnung', text: 'Fiktiv: Furosemid i.v. nach Anordnung, Bilanz, Gewicht täglich, Kalium-Kontrolle.', flag: 'diuretikum', dauer: 5 },
    ],
    fragen: [
      { id: 'hi-f1', art: 'befund', frage: 'Tippe auf den Pleuraerguss.', serie: 'hi-rx', befund: 'erguss', erklaerung: 'Flüssigkeit sammelt sich unten außen: der spitze Winkel zwischen Rippen und Zwerchfell wird stumpf.' },
      { id: 'hi-f2', art: 'wahl', frage: 'Der Befund meldet Kalium 6,7 mmol/l mit dem Kommentar „Probe hämolytisch“. Was tust du?', optionen: [
        { text: 'Arzt informieren, Wert als unsicher kennzeichnen, schonend neu abnehmen (kurz stauen, nicht schütteln)', richtig: true, warum: 'Hämolyse setzt Kalium aus den roten Blutkörperchen frei. Ob die Patientin wirklich ein hohes Kalium hat, zeigt erst eine saubere Probe; bis dahin ernst nehmen.' },
        { text: 'Den Wert ignorieren, er ist sowieso falsch', richtig: false, warum: 'Bei Spironolacton, Ramipril und Niereninsuffizienz ist ein echtes hohes Kalium möglich: nie ignorieren, sondern kontrollieren.' },
        { text: 'Sofort Kalium-senkende Maßnahmen selbst einleiten', richtig: false, warum: 'Therapie ist ärztliche Anordnung; zuerst klären, ob der Wert echt ist.' },
      ] },
      { id: 'hi-f3', art: 'befund', frage: 'Tippe auf das vergrößerte Herz.', serie: 'hi-rx', befund: 'herz', erklaerung: 'Der Herzschatten ist breiter als die Hälfte des Thorax (Herz-Thorax-Quotient über 0,5). Im Liegen wirkt das Herz zusätzlich größer.' },
    ],
    aufloesung: { diagnose: 'Akut dekompensierte Herzinsuffizienz mit Lungenstauung', kernaussage: 'Gewicht ist der beste Frühwarnwert. NT-proBNP und Röntgen bestätigen die Stauung; Kalium unter ACE-Hemmer, Spironolacton und Diuretikum regelmäßig kontrollieren.', pflege: ['Herzbettlage, Sauerstoff nach Anordnung', 'Tägliches Gewicht (gleiche Waage, morgens), Bilanz, Trinkmenge nach Anordnung', 'Kalium und Natrium im Blick, Präanalytik sauber (kurz stauen)', 'Hautpflege bei Ödemen, Dekubitusprophylaxe', 'Schulung: Gewichtstagebuch, Warnzeichen'] },
    bezug: ['herzinsuffizienz'],
  },
  {
    id: 'pneumothorax',
    raum: '17_notaufnahme_untersuchung',
    monitor: { start: 'laeuft', sensorAusfallNach: 40 },
    titel: 'Stich in der Brust beim Sport',
    kurz: 'Spontanpneumothorax: Röntgen-Pleuralinie und CT, Lupe und Fensterung',
    bereich: 'Notaufnahme, Nachtdienst',
    startzeit: '23:05',
    patient: {
      name: 'Herr Jonas P.', alter: 22, geschlecht: 'm', gewicht: 68,
      anlass: 'Beim Basketball plötzlich stechender Schmerz links, seitdem Luftnot bei Belastung.',
      vorgeschichte: ['Raucher', 'Groß und schlank (1,92 m)'], medikamente: ['keine'], allergien: 'keine bekannt',
    },
    vital: {
      puls: v(102), af: v(22), spo2: v(94, { proStunde: -0.5, grenze: 90, therapie: [{ flag: 'drainage', ziel: 98, tauMin: 30 }] }),
      sys: v(128), dia: v(76), temp: v(36.6),
    },
    labor: {
      leuko: v(7.9), hb: v(15.1), thrombo: v(260), crp: v(2), na: v(141), k: v(4.0), krea: v(0.9), egfr: v(110),
      inr: v(1.0), aptt: v(29), ddimer: v(0.3), trop: v(5),
      ph: v(7.44), pco2: v(36), po2: v(74), hco3: v(24), be: v(0.5), sao2: v(94), laktat: v(1.1),
    },
    empfohlen: ['hb', 'inr', 'aptt', 'thrombo'],
    bildgebung: [
      {
        serie: { id: 'pt-rx', titel: 'Röntgen-Thorax', untersuchung: 'Röntgen-Thorax p.a. im Stehen', quelle: { art: 'phantom', modalitaet: 'roentgen', variante: 'pneumothorax' }, befunde: [{ id: 'pleuralinie', x: 0.84, y: 0.42, r: 0.09, titel: 'Pneumothorax links', text: 'Feine Pleuralinie, außerhalb davon keine Lungengefäße mehr: dort ist nur Luft.' }], befundtext: 'Mantelpneumothorax links, Lunge etwa 3 cm von der Thoraxwand abgehoben. Keine Mediastinalverlagerung.' },
        dauer: 20, befundNach: 15, kontrastmittel: false, vorbereitung: roentgen({}),
      },
      {
        serie: { id: 'pt-ct', titel: 'CT-Thorax nativ', untersuchung: 'CT-Thorax ohne Kontrastmittel', quelle: { art: 'phantom', modalitaet: 'ct', variante: 'pneumothorax', schichten: 40 }, schichtdicke: 5, befunde: [{ id: 'luft', schichten: [8, 36], x: 0.83, y: 0.5, r: 0.1, titel: 'Freie Luft im Pleuraspalt', text: 'Ganz schwarzer Raum ohne Gefäßpunkte zwischen Lunge und Brustwand.' }], befundtext: 'Pneumothorax links mit teilkollabierter Lunge, apikale Bullae nicht ausgeschlossen.' },
        dauer: 30, befundNach: 20, kontrastmittel: false,
        vorbereitung: [
          { id: 'metall', text: 'Metall im Untersuchungsbereich entfernt', noetig: true, warum: 'Streifenartefakte.' },
          { id: 'niere', text: 'Kreatinin/eGFR abwarten', noetig: false, warum: 'Native CT braucht keinen Nierenwert.' },
        ],
      },
    ],
    sbar: [
      { id: 's1', text: 'S: Herr P., 22, plötzlicher Brustschmerz links und Luftnot', relevant: true },
      { id: 'b1', text: 'B: Raucher, groß und schlank, keine Vorerkrankungen', relevant: true },
      { id: 'a1', text: 'A: SpO₂ 94 %, AF 22, Puls 102, Atemgeräusch links abgeschwächt', relevant: true },
      { id: 'a2', text: 'A: Röntgen mit Pleuralinie links', relevant: true },
      { id: 'x1', text: 'Er hat sein Handy-Ladekabel vergessen', relevant: false },
      { id: 'r1', text: 'R: Bitte zur Beurteilung kommen, Material für Drainage vorbereiten?', relevant: true },
    ],
    anordnungen: [
      { id: 'o2', label: 'Sauerstoff nach Anordnung', text: 'O₂ hochdosiert über Maske (beschleunigt die Resorption der Luft).', flag: 'o2', dauer: 3 },
      { id: 'drainage', label: 'Thoraxdrainage assistieren', text: 'Fiktiv: Anlage einer Thoraxdrainage links durch den Arzt; Pflege assistiert, Sog nach Anordnung.', flag: 'drainage', dauer: 30 },
    ],
    fragen: [
      { id: 'pt-f1', art: 'befund', frage: 'Nutze Lupe oder Kontrast und tippe auf den Pneumothorax.', serie: 'pt-rx', befund: 'pleuralinie', erklaerung: 'Die Pleuralinie ist sehr fein. Mit höherem Kontrast und der Lupe sieht man: außen fehlt jede Gefäßzeichnung.' },
      { id: 'pt-f2', art: 'wahl', frage: 'Welches CT-Fenster zeigt den Pneumothorax am besten?', optionen: [
        { text: 'Lungenfenster (W 1500 / L −600)', richtig: true, warum: 'Unterscheidet Luft (−1000 HU) von belüfteter Lunge (−850 HU) mit Gefäßen.' },
        { text: 'Weichteilfenster (W 400 / L 40)', richtig: false, warum: 'Darin ist alles unter −160 HU schwarz: Lunge und freie Luft sehen gleich aus.' },
        { text: 'Knochenfenster (W 2000 / L 500)', richtig: false, warum: 'Für Knochen gedacht, Lunge und Luft sind schwarz.' },
      ] },
      { id: 'pt-f3', art: 'befund', frage: 'Blättere durch das CT und tippe auf die freie Luft.', serie: 'pt-ct', befund: 'luft', erklaerung: 'Freie Luft ist rein schwarz und ohne Gefäßpunkte. Die Lunge ist zum Hilus hin zusammengefallen.' },
    ],
    aufloesung: { diagnose: 'Primärer Spontanpneumothorax links', kernaussage: 'Junge, große, schlanke Raucher mit plötzlichem Thoraxschmerz: an Pneumothorax denken. Verschlechterung mit Blutdruckabfall und Halsvenenstauung = Spannungspneumothorax, sofort Notruf.', pflege: ['Oberkörper hoch, Monitor, engmaschig SpO₂, AF, RR', 'Warnzeichen Spannungspneumothorax kennen', 'Drainage: Material, Assistenz, Fixierung, Sog/Wasserschloss kontrollieren, Schläuche nie abklemmen ohne Anordnung', 'Schmerzmanagement, Atemtherapie', 'Rauchstopp ansprechen'] },
    bezug: ['pneumothorax'],
  },
  {
    id: 'ketoazidose',
    raum: '16_notaufnahme_triage',
    titel: 'Erbrechen, Durst, tiefe Atmung',
    kurz: 'Diabetische Ketoazidose: BZ kritisch, BGA, Urinstix, Kalium fällt unter Insulin',
    bereich: 'Notaufnahme, Frühdienst',
    startzeit: '06:50',
    patient: {
      name: 'Leon T.', alter: 19, geschlecht: 'm', gewicht: 66,
      anlass: 'Seit zwei Tagen Magen-Darm-Infekt, Insulin weggelassen „weil er nichts gegessen hat“. Jetzt schläfrig, tiefe schnelle Atmung, Geruch nach Aceton.',
      vorgeschichte: ['Diabetes mellitus Typ 1 seit 8 Jahren'], medikamente: ['Insulin glargin abends', 'Insulin lispro zu den Mahlzeiten'], allergien: 'keine bekannt',
      infusion: 'NaCl 0,9 % am rechten Handrücken',
    },
    vital: {
      puls: v(124, { therapie: [{ flag: 'volumen', ziel: 98, tauMin: 120 }] }), af: v(30, { therapie: [{ flag: 'insulin', ziel: 18, tauMin: 360 }] }),
      spo2: v(98), sys: v(96, { therapie: [{ flag: 'volumen', ziel: 112, tauMin: 90 }] }), dia: v(54, { therapie: [{ flag: 'volumen', ziel: 68, tauMin: 90 }] }), temp: v(37.6),
    },
    labor: {
      bz: v(486, { therapie: [{ flag: 'volumen', ziel: 380, tauMin: 120 }, { flag: 'insulin', ziel: 200, tauMin: 240 }] }),
      glukose: v(492, { therapie: [{ flag: 'volumen', ziel: 385, tauMin: 120 }, { flag: 'insulin', ziel: 200, tauMin: 240 }] }),
      ph: v(7.12, { therapie: [{ flag: 'insulin', ziel: 7.34, tauMin: 480 }] }), pco2: v(22, { therapie: [{ flag: 'insulin', ziel: 36, tauMin: 480 }] }),
      hco3: v(8.5, { therapie: [{ flag: 'insulin', ziel: 20, tauMin: 480 }] }), be: v(-20, { therapie: [{ flag: 'insulin', ziel: -4, tauMin: 480 }] }), po2: v(102), sao2: v(98), laktat: v(1.9),
      k: v(5.4, { therapie: [{ flag: 'insulin', ziel: 3.1, tauMin: 180 }, { flag: 'kalium', ziel: 4.0, tauMin: 180 }] }),
      na: v(131), ca: v(2.3), krea: v(1.3, { therapie: [{ flag: 'volumen', ziel: 0.8, tauMin: 360 }] }), egfr: v(58, { therapie: [{ flag: 'volumen', ziel: 95, tauMin: 360 }] }), harnstoff: v(52),
      leuko: v(14.6), hb: v(15.8), thrombo: v(320), crp: v(9),
      'u-keton': v(4), 'u-glukose': v(4), 'u-leuko': v(0), 'u-nitrit': v(0),
    },
    empfohlen: ['bz', 'ph', 'pco2', 'hco3', 'k', 'na', 'krea', 'u-keton'],
    bildgebung: [],
    sbar: [
      { id: 's1', text: 'S: Leon T., 19, Typ-1-Diabetes, schläfrig, Kussmaul-Atmung', relevant: true },
      { id: 'b1', text: 'B: Insulin seit zwei Tagen ausgelassen, Erbrechen', relevant: true },
      { id: 'a1', text: 'A: BZ 486 mg/dl, pH 7,12, HCO₃⁻ 8,5, Ketone +++', relevant: true },
      { id: 'a2', text: 'A: Puls 124, RR 96/54, Kalium 5,4', relevant: true },
      { id: 'x1', text: 'Er hat sein Ladegerät für die Insulinpumpe nicht dabei', relevant: false },
      { id: 'r1', text: 'R: Bitte sofort kommen, Verdacht auf Ketoazidose; Anordnung für Volumen und Insulin?', relevant: true },
    ],
    anordnungen: [
      { id: 'volumen', label: 'Infusion nach Anordnung (Volumen zuerst)', text: 'Fiktiv: NaCl 0,9 % 1000 ml in der ersten Stunde.', flag: 'volumen', dauer: 5 },
      { id: 'insulin', label: 'Insulin-Perfusor nach Schema starten', text: 'Fiktiv: Normalinsulin i.v. über Perfusor nach Schema, BZ stündlich, Kalium alle 2 h.', flag: 'insulin', dauer: 10 },
      { id: 'kalium', label: 'Kaliumzusatz nach Anordnung', text: 'Fiktiv: Kalium in die Infusion nach Kaliumspiegel.', flag: 'kalium', dauer: 5 },
    ],
    reihenfolge: [['volumen', 'insulin', 'Volumen kommt zuerst; Insulin erst nach Anordnung und mit Blick aufs Kalium, weil Insulin Kalium in die Zellen verschiebt.']],
    fragen: [
      { id: 'ka-f1', art: 'bga', frage: 'Deute die BGA: pH 7,12, pCO₂ 22 mmHg, HCO₃⁻ 8,5 mmol/l.', werte: { ph: 7.12, pco2: 22, hco3: 8.5, be: -20 }, stoerung: 'metabolische Azidose', kompensation: 'teilweise', erklaerung: 'Ketonsäuren verbrauchen Bikarbonat (metabolisch). Die tiefe Kussmaul-Atmung bläst CO₂ ab und gleicht teilweise aus.' },
      { id: 'ka-f2', art: 'wahl', frage: 'Unter Insulin fällt das Kalium von 5,4 auf 3,1 mmol/l. Warum?', optionen: [
        { text: 'Insulin verschiebt Kalium aus dem Blut in die Zellen', richtig: true, warum: 'Der Körper hatte insgesamt zu wenig Kalium; der hohe Startwert täuschte. Deshalb Kalium engmaschig kontrollieren und nach Anordnung ersetzen.' },
        { text: 'Laborfehler durch Hämolyse', richtig: false, warum: 'Hämolyse macht Kalium falsch hoch, nicht niedrig.' },
        { text: 'Kalium wird mit dem Atem abgegeben', richtig: false, warum: 'Über die Atmung wird CO₂ abgegeben, kein Kalium.' },
      ] },
      { id: 'ka-f3', art: 'wahl', frage: 'Der kapilläre BZ zeigt 486 mg/dl, Leon hat eine Glukose-haltige Infusion am selben Arm laufen. Was beachtest du bei der Abnahme?', optionen: [
        { text: 'Am anderen Arm abnehmen bzw. den Finger der Gegenseite nehmen', richtig: true, warum: 'Infusionslösung verfälscht Glukose und Elektrolyte; immer am Gegenarm abnehmen.' },
        { text: 'Infusion kurz schneller laufen lassen, dann abnehmen', richtig: false, warum: 'Das verdünnt die Probe noch mehr.' },
        { text: 'Egal, der Wert ist sowieso hoch', richtig: false, warum: 'Auch hohe Werte steuern die Insulindosis; falsche Werte gefährden.' },
      ] },
    ],
    aufloesung: { diagnose: 'Diabetische Ketoazidose', kernaussage: 'Insulin nie ganz weglassen, auch wenn man nichts isst. In der Therapie zählt: Volumen zuerst, Insulin nach Schema, Kalium und BZ engmaschig, weil das Kalium unter Insulin fällt.', pflege: ['BZ stündlich, Kalium nach Anordnung alle 1–2 h, Monitor (Rhythmus)', 'Bewusstsein, Aspirationsschutz bei Erbrechen', 'Bilanz, Zeichen der Exsikkose', 'Abnahme nie am Infusionsarm', 'Schulung: Sick-Day-Regeln (Insulin weiter, BZ und Ketone messen)'] },
    bezug: ['diabetes'],
  },
];

export const FALL_NACH_ID: Record<string, DiagnostikFall> = Object.fromEntries(FAELLE.map((f) => [f.id, f]));
