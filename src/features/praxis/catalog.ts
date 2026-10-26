import raw from './scenarios.json';
import type { Action, Criterion, Scenario, Setting, Vitals } from './types';
export const RESOURCES: Record<Setting, { lab: boolean; poc: boolean; imaging: boolean; monitor: boolean; devices: boolean; helpMinutes: number; longVisits: boolean }> = {
  ambulant: { lab: false, poc: false, imaging: false, monitor: false, devices: false, helpMinutes: 15, longVisits: true },
  heim: { lab: false, poc: false, imaging: false, monitor: false, devices: false, helpMinutes: 10, longVisits: true },
  station: { lab: true, poc: false, imaging: true, monitor: true, devices: false, helpMinutes: 3, longVisits: false },
  zna: { lab: true, poc: true, imaging: true, monitor: true, devices: false, helpMinutes: 1, longVisits: false },
  its: { lab: true, poc: true, imaging: true, monitor: true, devices: true, helpMinutes: 1, longVisits: false },
  paediatrie: { lab: true, poc: false, imaging: true, monitor: true, devices: false, helpMinutes: 2, longVisits: false },
  psychiatrie: { lab: true, poc: false, imaging: false, monitor: false, devices: false, helpMinutes: 2, longVisits: false },
  reha: { lab: true, poc: false, imaging: false, monitor: false, devices: false, helpMinutes: 5, longVisits: false },
  palliativ: { lab: false, poc: false, imaging: false, monitor: false, devices: false, helpMinutes: 10, longVisits: true },
};
export const CATEGORIES = { gespraech: 'Gespräch', untersuchung: 'Untersuchung', pflege: 'Pflege & Maßnahmen', diagnostik: 'Diagnostik', kommunikation: 'Team & Übergabe', geraete: 'Geräte' } as const;
const criteria: Criterion[] = [
  { flag: 'assessment', label: 'Zustand strukturiert erfasst', why: 'Beobachtung und wiederholte Beurteilung leiten das weitere Handeln.', source: 'abcde' },
  { flag: 'vitals', label: 'Vitalparameter erhoben', why: 'Messwerte ergänzen die klinische Beobachtung; Einzelwerte ersetzen keine Beurteilung.', source: 'abcde' },
  { flag: 'patient', label: 'Patientenperspektive einbezogen', why: 'Anliegen, Einwilligung und Versorgungsziele gehören zum individuellen Übungsziel.', source: 'scenario' },
  { flag: 'care', label: 'Passende Pflegehandlung umgesetzt', why: 'Die gewählte Maßnahme muss zur konkreten Situation passen.', source: 'scenario' },
  { flag: 'help', label: 'Unterstützung organisiert', why: 'Eigene Grenzen erkennen und bei Bedarf früh qualifizierte Hilfe holen.', source: 'abcde' },
  { flag: 'reassessed', after: 'care', label: 'Wirkung erneut beurteilt', why: 'Nach Interventionen den aktuellen Zustand erneut prüfen.', source: 'abcde' },
  { flag: 'documented', label: 'Pflegebericht erstellt', why: 'Beobachtung, Handlung und Wirkung nachvollziehbar festhalten. Hier wird nur das Vorliegen geprüft.', source: 'scenario' },
  { flag: 'sbar', label: 'SBAR-Übergabe strukturiert', why: 'Situation, Hintergrund, Einschätzung und Empfehlung vollständig übergeben. Freitext wird nicht semantisch bewertet.', source: 'sbar' },
];
export const SCENARIOS: Scenario[] = raw.map(d => {
  const setting = d.setting as Setting;
  const r = RESOURCES[setting];
  const actions: Action[] = [
    { id: 'patient', label: 'Befinden und Wünsche erfragen', category: 'gespraech', seconds: 45, result: d.patientSpeech, flag: 'patient' },
    { id: 'family', label: 'Bezugsperson einbeziehen', category: 'gespraech', seconds: 60, result: d.familySpeech, flag: 'family' },
    { id: 'deescalate', label: 'Ruhig erklären und Einwilligung erfragen', category: 'gespraech', seconds: 30, result: 'Du kündigst dein Vorgehen an, hörst zu und lässt Raum für Rückfragen.', flag: 'consent' },
    { id: 'assessment', label: 'Strukturierte Ersteinschätzung', category: 'untersuchung', seconds: 30, result: d.assessment, flag: 'assessment' },
    { id: 'inspect', label: 'Inspektion', category: 'untersuchung', seconds: 30, result: d.inspect },
    { id: 'palpate', label: 'Palpation nach Einwilligung', category: 'untersuchung', requires: 'consent', seconds: 30, result: d.palpate },
    { id: 'listen', label: 'Auskultation nach Einwilligung', category: 'untersuchung', requires: 'consent', seconds: 45, result: d.listen },
    { id: 'percuss', label: 'Perkussion nach Fragestellung', category: 'untersuchung', requires: 'consent', seconds: 30, result: d.percuss },
    { id: 'vitals', label: 'Vitalparameter einschließlich BZ messen', category: 'untersuchung', seconds: 60, result: 'Messwerte sind im Monitorbereich sichtbar. Werte gelten für den Messzeitpunkt.', flag: 'vitals', repeatable: true, loinc: '59408-5' },
    { id: 'care', label: d.care, category: 'pflege', seconds: 60, result: d.careResult, effect: d.careEffect as Partial<Vitals> | undefined, flag: 'care' },
    { id: 'hygiene', label: 'Händehygiene und Material vorbereiten', category: 'pflege', seconds: 30, result: 'Arbeitsfläche und benötigte Materialien sind vorbereitet.', flag: 'hygiene' },
    { id: 'reassess', label: 'Wirkung und Zustand erneut beurteilen', category: 'untersuchung', seconds: 60, requires: 'care', result: 'Aktuelle Vitalparameter neu erhoben. Mit Vorbefunden und subjektivem Befinden vergleichen.', flag: 'reassessed', repeatable: true },
    { id: 'help', label: setting === 'palliativ' ? 'Palliativteam hinzuziehen' : setting === 'ambulant' || setting === 'heim' ? 'Ärztliche / dringliche Hilfe organisieren' : 'Qualifiziertes Team hinzuziehen', category: 'kommunikation', seconds: 30, result: `Unterstützung ist angefordert (Übungswartezeit: ${r.helpMinutes} Minuten). Bei akuter Gefahr gilt der örtliche Notfallweg.`, flag: 'help' },
    { id: 'orders', label: 'Ärztliche Rücksprache und Anordnung', category: 'kommunikation', requires: 'help', seconds: 30, delay: r.helpMinutes * 60, result: d.furosemide ? 'Fiktive Einzelanordnung: Furosemid 40 mg i.v., 10 mg/ml, langsam über mindestens 10 Minuten. Identität, Allergien, RR und Nierenfunktion prüfen. Wirkung und Bilanz kontrollieren.' : 'Ärztliche Beurteilung liegt vor. Maßnahmen und Diagnostik nach individueller Anordnung; keine Arzneimittelverordnung in diesem Fall.', flag: 'orders' },
  ];
  if (r.monitor) actions.push({ id: 'monitor', label: 'Kontinuierliches Monitoring anschließen', category: 'diagnostik', seconds: 45, result: 'Fortlaufende Messwerte sichtbar. Die Geräteanzeige ersetzt keine klinische Beurteilung.', flag: 'monitor' });
  if (r.lab) actions.push({ id: 'lab', label: 'Zentrallabor nach Anordnung', category: 'diagnostik', requires: 'orders', seconds: 120, delay: 45 * 60, result: d.furosemide ? 'Synthetischer Laborbefund: Kreatinin 1,4 mg/dl, Kalium 4,2 mmol/l. Werte nur im Zusammenhang beurteilen.' : 'Synthetischer Laborbericht: keine zusätzliche wegweisende Veränderung im begrenzten Übungsmodell. Die klinische Beurteilung bleibt entscheidend.', flag: 'lab' });
  if (r.poc) actions.push({ id: 'bga', label: 'BGA als PoCT nach Anordnung', category: 'diagnostik', requires: 'orders', seconds: 60, delay: 120, result: setting === 'its' ? 'Synthetische arterielle BGA: pH 7,31 · pCO₂ 55 mmHg · pO₂ 60 mmHg. Respiratorische Azidose mit Hypoxämie im Übungsbefund.' : 'Synthetische arterielle BGA: pH 7,40 · pCO₂ 40 mmHg · pO₂ 82 mmHg. Keine Entwarnung für die Ursache des Brustschmerzes.', flag: 'bga' });
  if (r.imaging) actions.push({ id: 'imaging', label: 'Bildgebung über ärztliches Team anfordern', category: 'diagnostik', requires: 'orders', seconds: 60, delay: 20 * 60, result: d.furosemide ? 'Synthetischer Röntgen-Textbefund: beidseitige basale Verschattungen und Gefäßzeichnung vermehrt. Kein Originalbild und kein DICOM-Datensatz.' : 'Synthetischer Bildgebungs-Textbefund: keine weitere wegweisende Veränderung im Übungsmodell. Kein Originalbild.', flag: 'imaging' });
  if (setting === 'zna') actions.push({ id: 'ekg', label: '12-Kanal-EKG ableiten und ärztlich vorlegen', category: 'diagnostik', seconds: 120, result: 'Synthetischer Textbefund: ST-Hebungen in II, III und aVF. Sofortige ärztliche Bewertung und weiterer Notfallpfad erforderlich. Kein diagnostisch auswertbares Kurvenbild.', flag: 'ekg' });
  if (r.devices) actions.push({ id: 'devices', label: 'Geräte und Perfusoren im Team prüfen', category: 'geraete', seconds: 45, result: 'Verbindungen, Alarme und angeordnete Laufweiten werden mit der Fachperson abgeglichen. Eigenständige Beatmungs- oder Katecholamintitration ist nicht freigegeben.', flag: 'devices' });
  const medication = d.furosemide ? [{ id: 'furosemide', name: 'Furosemid', atc: 'C03CA01', dose: 40, unit: 'mg', concentration: 10, route: 'i.v.', duration: 10, onset: 15, effect: { resp: -3, spo2: 2, sys: -8 }, targets: { resp: 18, spo2: 96, sys: 120 }, equipment: 'Spritze und i.v.-Zugang', result: 'Didaktische Modellwirkung berechnet: Reaktion hängt vom aktuellen Zustand und dem begrenzten Zielkorridor dieses Falls ab. RR, Bilanz und Symptome kontrollieren. Keine validierte Pharmakokinetik oder berechnete Urinmenge.' }] : [];
  return {
    version: 1, ...d, setting, initial: d.initial, stabilizers: ['care'],
    model: { id: `pflege-${d.id}`, version: '0.1.0', accuracy: 'didactic', review: 'unreviewed', sources: ['https://www.resus.org.uk/library/abcde-approach', 'https://www.ahrq.gov/teamstepps-program/resources/modules/index.html', ...(d.furosemide ? ['https://www.medicines.org.uk/emc/product/14419/smpc', 'https://www.medicines.org.uk/emc/product/101893/smpc'] : []), ...(d.id === 'pflegeheim' ? ['https://www.diabetes.org.uk/sites/default/files/2023-03/JBDS%2001%20Hypo%20Guideline%20with%20qr%20code.pdf'] : [])] },
    ...(setting === 'zna' ? { distraction: { interval: 300, probability: 0.4, text: 'Eine weitere wartende Person bittet um Auskunft. Organisiere Unterstützung, ohne die aktuelle Versorgung zu unterbrechen.' } } : {}),
    findings: { inspect: d.inspect, palpate: d.palpate, listen: d.listen, percuss: d.percuss },
    dialogue: { patient: d.patientSpeech, family: d.familySpeech }, actions, medications: medication,
    criteria: [...criteria.map(c => ({ ...c })), ...(setting === 'zna' ? [{ flag: 'ekg', label: 'EKG zeitnah organisiert', why: 'Zeitfenster von zehn Minuten ist hier eine didaktische Fallvorgabe; keine formale Triageklassifikation.', before: 600, source: 'scenario' as const }] : []), ...(d.furosemide ? [{ flag: 'medication_reviewed', after: 'medication_effect', label: 'Angeordnete Medikation und verzögerte Wirkung kontrolliert', why: 'Nach Eintritt der Modellwirkung erneut beurteilen; bloßes Abwarten erfüllt dieses Kriterium nicht.', source: 'drug' as const }] : [])],
  } satisfies Scenario;
});
