// Labor-Trainer: Präanalytik (Blutentnahme), Blutgasanalyse und Laborbefunde richtig einordnen.
// Röhrchenreihenfolge, Fehlerquellen und BGA-Regeln kommen aus denselben Bausteinen wie die
// Diagnostik-Station (src/ui/sim/labor), damit Trainer und Simulator nicht auseinanderlaufen.

import type { Aufgabe, AuswahlAufgabe } from '../quiz/quiz';
import { ROEHRCHEN } from '../../ui/sim/labor/praeanalytik';
import { deuteBga, type Bga } from '../../ui/sim/labor/bga';

export type BereichId = 'praeanalytik' | 'bga' | 'befund';
export interface Bereich { id: BereichId; label: string; kurz: string; wissen: string[] }

export const THEMEN = {
  entnahme: 'thema.ph.injektion',
  atmung: 'thema.ap.atmung',
  blut: 'thema.ap.blut',
  niere: 'thema.ap.niere',
  diabetes: 'thema.kl.diabetes',
  herz: 'thema.kl.herz',
} as const;

const wahl = (id: string, thema: string, titel: string, frage: string, optionen: string[], erklaerung: string[], richtig: number[] = [0]): AuswahlAufgabe =>
  ({ id, art: 'auswahl', topicIds: [thema], titel, frage, optionen, richtig, mehrfach: richtig.length > 1, erklaerung });

// ---------------------------------------------------------------- Präanalytik

const r = ROEHRCHEN;
const praeanalytik: Aufgabe[] = [
  { id: 'pa.reihenfolge', art: 'reihenfolge', topicIds: [THEMEN.entnahme], titel: 'Abnahmereihenfolge', frage: 'Bringe die Röhrchen in die empfohlene Abnahmereihenfolge.',
    schritte: [r.blutkultur.name, r.citrat.name, r.serum.name, r.heparin.name, r.edta.name, r.fluorid.name],
    erklaerung: ['Blutkultur zuerst (steril), dann Citrat (Gerinnung, exakte Füllung), dann Serum und Heparin (Chemie), danach EDTA und Fluorid. EDTA vor Serum verschleppt Kalium-EDTA: Kalium falsch hoch, Calcium falsch niedrig.'] },
  { id: 'pa.reihenfolge-klein', art: 'reihenfolge', topicIds: [THEMEN.entnahme], titel: 'Abnahmereihenfolge', frage: 'Angefordert sind Blutbild, Elektrolyte und Gerinnung. In welcher Reihenfolge füllst du?',
    schritte: [r.citrat.name, r.serum.name, r.edta.name],
    erklaerung: ['Citrat vor Serum vor EDTA. Bei einer Flügelkanüle vor dem Citrat ein Leerröhrchen ziehen, weil die Luft im Schlauch sonst das Citratröhrchen unterfüllt.'] },
  wahl('pa.stauen', THEMEN.entnahme, 'Stauen', 'Wie lange darf vor einer Blutentnahme höchstens gestaut werden?',
    ['Etwa 1 Minute, vor dem Füllen lösen', '3 bis 5 Minuten, damit die Vene gut hervortritt', 'So lange, bis alle Röhrchen gefüllt sind', 'Stauen ist nur bei Kindern nötig'],
    ['Längeres Stauen presst Flüssigkeit ins Gewebe: Hämoglobin, Eiweiß und Calcium werden zu hoch gemessen, Hämolyse wird wahrscheinlicher. Pumpen mit der Faust erhöht das Kalium.']),
  wahl('pa.haemolyse', THEMEN.entnahme, 'Hämolyse', 'Der Befund zeigt Kalium 6,4 mmol/l mit dem Kommentar „hämolytisch“. Was ist die wahrscheinlichste Erklärung?',
    ['Zerstörte rote Blutkörperchen haben Kalium in die Probe abgegeben', 'Die Patientin hat sicher eine lebensbedrohliche Hyperkaliämie', 'Das Labor hat Natrium und Kalium vertauscht', 'Die Probe war zu kalt'],
    ['Hämolyse entsteht durch langes Stauen, dünne Kanülen, kräftiges Schütteln oder Aufziehen durch eine Spritze mit Sog. Der Wert ist unsicher: ärztlich melden und schonend neu abnehmen, nicht einfach ignorieren.']),
  wahl('pa.infusion', THEMEN.entnahme, 'Infusionsarm', 'Am linken Arm läuft eine Glukose-Infusion. Wo nimmst du Blut ab?',
    ['Am rechten Arm (Gegenarm)', 'Direkt oberhalb der Infusion am linken Arm', 'Aus dem liegenden Zugang, ohne die Infusion zu stoppen', 'Egal, die Infusion verändert nichts'],
    ['Infusionslösung verdünnt die Probe und verfälscht vor allem Glukose und Elektrolyte. Wenn es nicht anders geht: Infusion nach Hausstandard pausieren und Vorlauf verwerfen.']),
  wahl('pa.ident', THEMEN.entnahme, 'Identität', 'Wann beschriftest du die Röhrchen?',
    ['Am Bett, nachdem die Patientin Name und Geburtsdatum selbst genannt hat bzw. das Armband geprüft ist', 'Vorher im Stützpunkt, damit es schneller geht', 'Nachher im Stützpunkt nach dem Gedächtnis', 'Gar nicht, das Labor ordnet über den Anforderungsschein zu'],
    ['Verwechslungen gehören zu den gefährlichsten Laborfehlern (z. B. bei Kreuzblut). Aktiv erfragen: „Wie heißen Sie, wann sind Sie geboren?“, nicht „Sind Sie Frau M.?“.']),
  wahl('pa.citrat', THEMEN.entnahme, 'Citrat', 'Warum muss das Citratröhrchen genau bis zur Markierung gefüllt sein?',
    ['Das Mischverhältnis Blut zu Citrat (9:1) bestimmt die gemessene Gerinnungszeit', 'Damit das Röhrchen nicht ausläuft', 'Weil sonst die Blutkörperchen zerplatzen', 'Es muss nicht genau gefüllt sein'],
    ['Zu wenig Blut bedeutet zu viel Citrat: Gerinnungszeiten werden falsch lang. Unterfüllte Röhrchen weist das Labor meist zurück.']),
  wahl('pa.liegen', THEMEN.entnahme, 'Transport', 'Ein Serumröhrchen lag ungekühlt 3 Stunden im Stützpunkt. Welche Werte sind am ehesten verfälscht?',
    ['Kalium falsch hoch, Glukose falsch niedrig', 'Kalium falsch niedrig, Glukose falsch hoch', 'Nur das CRP', 'Gar keine, Blut ist stabil'],
    ['Blutzellen verbrauchen weiter Zucker und lassen Kalium austreten. Proben zügig transportieren; für Glukose gibt es Fluorid-Röhrchen.']),
  wahl('pa.bk', THEMEN.entnahme, 'Blutkultur', 'Was ist bei Blutkulturen richtig?',
    ['Vor der ersten Antibiotikagabe abnehmen', 'Erst nach der ersten Antibiotikagabe abnehmen, damit sie aussagekräftiger ist', 'Flaschen sofort in den Kühlschrank stellen', 'Das Septum der Flasche muss nicht desinfiziert werden'],
    ['Nach Antibiotikagabe wachsen Erreger oft nicht mehr an. Hautdesinfektion mit Einwirkzeit, Septum desinfizieren, mindestens zwei Sets (aerob und anaerob), bei Raumtemperatur zügig ins Labor.']),
  wahl('pa.farben', THEMEN.entnahme, 'Röhrchenfarben', 'Eine neue Kollegin sagt: „EDTA ist immer lila.“ Was stimmt?',
    ['Die Farben hängen vom Hersteller ab: z. B. EDTA rot bei S-Monovette, violett bei Vacutainer', 'Stimmt, die Farben sind weltweit einheitlich', 'EDTA ist immer grün', 'Die Farbe ist egal, Hauptsache das Röhrchen ist voll'],
    ['Maßgeblich ist die Röhrchenliste des eigenen Hauses. Wer die Klinik wechselt, lernt die Farben neu.']),
  wahl('pa.bz', THEMEN.entnahme, 'Blutzucker', 'Was verfälscht eine kapilläre Blutzuckermessung?',
    ['Reste von Desinfektionsmittel oder Zucker am Finger', 'Seitliches Stechen an der Fingerbeere', 'Den ersten Tropfen abwischen', 'Hände vorher mit warmem Wasser waschen'],
    ['Hände waschen und trocknen; Desinfektion muss vollständig verdunstet sein. Nicht quetschen: Gewebeflüssigkeit verdünnt den Tropfen.']),
];

// ---------------------------------------------------------------- Blutgasanalyse

const BGA_FAELLE: { id: string; text: string; werte: Bga; hinweis: string }[] = [
  { id: 'copd', text: 'COPD-Patient, schläfrig, unter hochdosiertem Sauerstoff.', werte: { ph: 7.29, pco2: 64, hco3: 30 }, hinweis: 'Zu viel Sauerstoff kann bei COPD die Atmung dämpfen: CO₂ steigt (CO₂-Narkose). Ziel-SpO₂ oft 88–92 % nach Anordnung.' },
  { id: 'copd-chron', text: 'Bekannte COPD, stabil, Kontrolle in der Sprechstunde.', werte: { ph: 7.37, pco2: 56, hco3: 32 }, hinweis: 'Die Niere hat über Tage Bikarbonat zurückgehalten und gleicht das hohe CO₂ vollständig aus.' },
  { id: 'panik', text: 'Junge Frau, Panikattacke, Kribbeln in den Händen.', werte: { ph: 7.52, pco2: 28, hco3: 23 }, hinweis: 'Hyperventilation bläst CO₂ ab. Beruhigen, langsam atmen lassen; vorher organische Ursachen ausschließen lassen.' },
  { id: 'dka', text: 'Typ-1-Diabetes, Erbrechen, tiefe Atmung.', werte: { ph: 7.12, pco2: 22, hco3: 8.5 }, hinweis: 'Ketoazidose: Säuren verbrauchen Bikarbonat, die Kussmaul-Atmung gleicht teilweise aus.' },
  { id: 'erbrechen', text: 'Seit Tagen starkes Erbrechen von Magensaft.', werte: { ph: 7.51, pco2: 47, hco3: 34 }, hinweis: 'Verlust von Magensäure: metabolische Alkalose. Die Atmung wird flacher und hält CO₂ zurück (teilweise Kompensation).' },
  { id: 'sepsis', text: 'Sepsis, Laktat 4,2 mmol/l, Atemfrequenz 30/min.', werte: { ph: 7.28, pco2: 30, hco3: 14 }, hinweis: 'Laktatazidose bei Minderdurchblutung; schnelle Atmung gleicht teilweise aus.' },
  { id: 'opiat', text: 'Nach Opioidgabe kaum erweckbar, Atemfrequenz 6/min.', werte: { ph: 7.24, pco2: 62, hco3: 25 }, hinweis: 'Akute Hypoventilation: CO₂ steigt sofort, die Niere hatte noch keine Zeit zu reagieren. Notfall: Atmung sichern, ärztlich melden.' },
  { id: 'normal', text: 'Gesunde Person vor einer Operation.', werte: { ph: 7.41, pco2: 39, hco3: 24 }, hinweis: 'Alle Werte im Normbereich.' },
];

const STOERUNGEN = ['respiratorische Azidose', 'metabolische Azidose', 'respiratorische Alkalose', 'metabolische Alkalose', 'normal'] as const;
const fmt = (n: number, d = 0) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

const bga: Aufgabe[] = [
  { id: 'bga.schritte', art: 'reihenfolge', topicIds: [THEMEN.atmung], titel: 'BGA lesen', frage: 'In welcher Reihenfolge liest du eine Blutgasanalyse?',
    schritte: ['pH: Azidose oder Alkalose?', 'pCO₂: passt die Atmung dazu (respiratorisch)?', 'HCO₃⁻ bzw. BE: passt der Stoffwechsel dazu (metabolisch)?', 'Kompensation: steuert die andere Seite gegen?', 'pO₂ und Laktat: Sauerstoffversorgung'],
    erklaerung: ['Immer zuerst der pH. Die Seite, die in dieselbe Richtung zeigt, ist die Ursache; die andere Seite zeigt die Kompensation.'] },
  ...BGA_FAELLE.map((f): AuswahlAufgabe => {
    const d = deuteBga(f.werte);
    const richtig = STOERUNGEN.indexOf(d.stoerung as typeof STOERUNGEN[number]);
    return wahl(`bga.${f.id}`, THEMEN.atmung, 'BGA deuten', `${f.text} pH ${fmt(f.werte.ph, 2)}, pCO₂ ${fmt(f.werte.pco2)} mmHg, HCO₃⁻ ${fmt(f.werte.hco3, 1)} mmol/l. Welche Störung liegt vor?`,
      [...STOERUNGEN], [`${d.stoerung === 'normal' ? 'Normalbefund' : `${d.stoerung[0].toUpperCase()}${d.stoerung.slice(1)}, Kompensation: ${d.kompensation}`}. ${f.hinweis}`, ...d.schritte], [richtig]);
  }),
  wahl('bga.kompensation', THEMEN.atmung, 'Kompensation', 'Woran erkennst du eine vollständig kompensierte Störung?',
    ['pH normal, aber pCO₂ und HCO₃⁻ beide in dieselbe Richtung verschoben', 'pH außerhalb der Norm, nur ein Wert verschoben', 'Alle Werte im Normbereich', 'pO₂ ist normal'],
    ['Die Kompensation bringt den pH zurück, aber nie ganz darüber hinaus. Die pH-Hälfte (unter oder über 7,40) verrät meist die ursprüngliche Störung.']),
  wahl('bga.arteriell', THEMEN.atmung, 'Probe', 'Was ist bei einer BGA-Probe wichtig?',
    ['Luftblasen sofort entfernen und die Probe ohne Verzögerung messen', 'Die Probe 30 Minuten liegen lassen, damit sie sich setzt', 'Kräftig schütteln, damit Luft hineinkommt', 'Die Spritze offen transportieren'],
    ['Luft verändert pO₂ und pCO₂, Liegezeit verändert pO₂ und Laktat. Heparinisierte Spritze sanft rollen, verschließen, sofort messen.']),
];

// ---------------------------------------------------------------- Befunde einordnen

const befund: Aufgabe[] = [
  wahl('bf.kritisch', THEMEN.blut, 'Kritischer Wert', 'Das Labor ruft an und meldet einen kritischen Wert. Was tust du zuerst?',
    ['Wert, Einheit, Patientin, Uhrzeit notieren und zurücklesen, dann sofort ärztlich melden', 'Nur in die Kurve schreiben, die Visite sieht es morgen', 'Das Labor bitten, ein Fax zu schicken, und auflegen', 'Selbst eine Therapie beginnen'],
    ['Zurücklesen („read back“) verhindert Hörfehler. Danach unverzüglich per SBAR weitergeben und die Meldung mit Uhrzeit und Namen dokumentieren.']),
  wahl('bf.crp', THEMEN.blut, 'CRP', 'Eine Patientin hat seit 3 Stunden Fieber, das CRP ist noch normal. Was folgt daraus?',
    ['Eine Infektion ist nicht ausgeschlossen: CRP steigt erst nach 6–12 Stunden', 'Eine Infektion ist ausgeschlossen', 'Das Fieber ist sicher gemessen falsch', 'Antibiotika sind sicher nötig'],
    ['CRP reagiert verzögert und fällt nach erfolgreicher Therapie langsam. Der Verlauf und die Klinik zählen mehr als ein Einzelwert.']),
  wahl('bf.laktat', THEMEN.blut, 'Laktat', 'Fieber 39,2 °C, Blutdruck 92/55 mmHg, Laktat 3,1 mmol/l. Was ist richtig?',
    ['Verdacht auf Sepsis: sofort ärztlich melden, engmaschige Überwachung', 'Laktat ist nur bei Sportlern wichtig', 'Erst in 24 Stunden kontrollieren', 'Normalbefund bei Fieber'],
    ['Laktat über 2 mmol/l bei Infektion ist ein Warnzeichen. Früh erkennen und melden rettet Leben.']),
  wahl('bf.kalium-insulin', THEMEN.diabetes, 'Kalium', 'Unter einem Insulin-Perfusor bei Ketoazidose fällt das Kalium. Warum?',
    ['Insulin verschiebt Kalium in die Zellen', 'Insulin enthält Kalium', 'Das Labor misst unter Insulin ungenau', 'Kalium wird abgeatmet'],
    ['Deshalb wird Kalium unter Insulin engmaschig kontrolliert und nach Anordnung ersetzt. Zu wenig Kalium kann gefährliche Rhythmusstörungen auslösen.']),
  wahl('bf.km', THEMEN.niere, 'Kontrastmittel', 'Welche Werte sind vor einer CT mit jodhaltigem Kontrastmittel besonders wichtig?',
    ['Kreatinin/eGFR und TSH bzw. bekannte Schilddrüsenüberfunktion', 'Nur das Blutbild', 'CRP und Leukozyten', 'Keine, Kontrastmittel ist harmlos'],
    ['Jod kann die Niere belasten und bei Überfunktion eine thyreotoxische Krise auslösen. Dazu Allergien erfragen und Metformin der Ärztin melden.']),
  wahl('bf.ddimer', THEMEN.herz, 'D-Dimere', 'Was sagt ein erhöhter D-Dimer-Wert nach einer Hüft-OP?',
    ['Wenig: nach OP sind D-Dimere oft erhöht, nur ein normaler Wert hilft beim Ausschluss', 'Er beweist eine Lungenembolie', 'Er beweist eine Blutung', 'Er zeigt eine Infektion an'],
    ['D-Dimere sind empfindlich, aber unspezifisch. Bei Verdacht entscheidet die Bildgebung (z. B. CT-Angiographie).']),
  wahl('bf.troponin', THEMEN.herz, 'Troponin', 'Brustschmerz seit 30 Minuten, Troponin noch normal. Was gilt?',
    ['Kontrolle nach Anordnung (meist 1–3 h): entscheidend ist der Anstieg', 'Herzinfarkt ausgeschlossen, Patient kann gehen', 'Troponin ist nur bei Kindern aussagekräftig', 'Ein normaler Wert ist immer ein Laborfehler'],
    ['Troponin steigt mit Verzögerung. EKG, Klinik und Verlauf gehören zusammen; Schmerzen und Vitalzeichen engmaschig beobachten.']),
  wahl('bf.ntprobnp', THEMEN.herz, 'NT-proBNP', 'Eine 84-Jährige hat 4 kg in einer Woche zugenommen, NT-proBNP ist deutlich erhöht. Welche Beobachtung ist jetzt besonders wichtig?',
    ['Tägliches Gewicht, Ödeme, Atemnot im Liegen, Bilanz', 'Nur die Körpertemperatur', 'Stuhlfarbe', 'Pupillenreaktion'],
    ['NT-proBNP zeigt die Belastung des Herzens. Das Gewicht ist der beste Frühwarnwert für Wassereinlagerung.']),
  wahl('bf.hb', THEMEN.blut, 'Hämoglobin', 'Am Tag nach einer OP sinkt das Hb von 12,8 auf 8,9 g/dl. Was beobachtest du gezielt?',
    ['Blutungszeichen (Verband, Drainage), Blässe, Puls, Blutdruck, Schwindel beim Aufstehen', 'Nur den Appetit', 'Den Blutzucker', 'Nichts, das ist nach OP immer so'],
    ['Ein Abfall dieser Größe kann Blutung oder starke Verdünnung bedeuten. Sturzgefahr bei Mobilisation; ärztlich melden.']),
  wahl('bf.krea-anstieg', THEMEN.niere, 'Kreatinin', 'Das Kreatinin steigt innerhalb von zwei Tagen von 0,9 auf 1,8 mg/dl. Was beobachtest du jetzt besonders?',
    ['Urinmenge und Bilanz, Gewicht, Ödeme, nierenschädigende Medikamente melden', 'Nur die Körpertemperatur', 'Nichts, Kreatinin schwankt immer so stark', 'Die Trinkmenge auf 500 ml begrenzen, ohne Rücksprache'],
    ['Ein Anstieg auf das Doppelte spricht für eine akute Nierenschädigung. Die Urinausscheidung ist der früheste pflegerische Hinweis; Medikamente wie NSAR oder Metformin ärztlich ansprechen.']),
  wahl('bf.kalium-niere', THEMEN.niere, 'Kalium bei Niereninsuffizienz', 'Bei einer Patientin mit Niereninsuffizienz liegt das Kalium bei 6,3 mmol/l (Probe nicht hämolytisch). Was ist richtig?',
    ['Gefahr von Herzrhythmusstörungen: sofort ärztlich melden, Monitor nach Anordnung', 'Unbedenklich, die Niere scheidet es morgen aus', 'Eine Banane gegen den Hunger anbieten', 'Nur beim nächsten Routinelabor erneut prüfen'],
    ['Die kranke Niere scheidet Kalium schlecht aus. Hohe Werte können das Herz gefährden; kaliumreiche Kost und kaliumsparende Medikamente sind dann Thema für die ärztliche Anordnung.']),
  wahl('bf.hba1c', THEMEN.diabetes, 'HbA1c', 'Was zeigt der HbA1c-Wert?',
    ['Den mittleren Blutzucker der letzten etwa 8–12 Wochen', 'Den Blutzucker im Moment der Abnahme', 'Ob gerade eine Unterzuckerung vorliegt', 'Die Insulinmenge im Blut'],
    ['HbA1c eignet sich zur Verlaufskontrolle der Einstellung. Für akute Entscheidungen (Hypo, Hyper) zählt der aktuelle Blutzucker.']),
  wahl('bf.keton', THEMEN.diabetes, 'Ketone', 'Blutzucker 412 mg/dl, Ketone im Urin stark positiv, tiefe Atmung. Was ist richtig?',
    ['Verdacht auf Ketoazidose: sofort ärztlich melden, BGA und Elektrolyte nach Anordnung', 'Normal nach einer großen Mahlzeit', 'Erst morgen nüchtern nachmessen', 'Mehr Kohlenhydrate geben'],
    ['Bei Insulinmangel verbrennt der Körper Fett, es entstehen Ketone und eine metabolische Azidose. Die tiefe Atmung (Kussmaul) ist der Versuch, CO₂ abzuatmen.']),
];

export const BEREICHE: Bereich[] = [
  { id: 'praeanalytik', label: 'Blutentnahme und Präanalytik', kurz: 'Reihenfolge, Stauen, Hämolyse, Identität, Transport', wissen: ['Reihenfolge: Blutkultur → Citrat → Serum → Heparin → EDTA → Fluorid.', 'Höchstens etwa 1 Minute stauen, nicht am Infusionsarm abnehmen.', 'Identität aktiv erfragen, am Bett beschriften, zügig transportieren.'] },
  { id: 'bga', label: 'Blutgasanalyse', kurz: 'pH, pCO₂, HCO₃⁻, Kompensation', wissen: ['pH 7,35–7,45, pCO₂ 35–45 mmHg, HCO₃⁻ 22–26 mmol/l.', 'Zuerst pH, dann: welche Achse zeigt in dieselbe Richtung?', 'Die Gegenseite zeigt die Kompensation.'] },
  { id: 'befund', label: 'Befunde einordnen', kurz: 'Kritische Werte, CRP, Laktat, Troponin, D-Dimere', wissen: ['Kritischer Wert: zurücklesen, dokumentieren, sofort melden.', 'Verlauf zählt mehr als ein Einzelwert.', 'Vor Kontrastmittel: Niere, Schilddrüse, Allergien, Metformin.'] },
];

export const AUFGABEN: Record<BereichId, Aufgabe[]> = { praeanalytik, bga, befund };
export const ALLE_AUFGABEN: Aufgabe[] = Object.values(AUFGABEN).flat();
