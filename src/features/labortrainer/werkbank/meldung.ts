// Kritischen Wert melden: Anruf des Labors annehmen, zurücklesen, dokumentieren und per SBAR
// ärztlich weitergeben. Jeder Schritt ist eine Entscheidung mit Rückmeldung.

export interface SbarBaustein { id: string; teil: 'S' | 'B' | 'A' | 'R' | 'x'; text: string }

export interface MeldungSzenario {
  id: string;
  titel: string;
  /** Was das Labor am Telefon sagt. */
  anruf: string;
  patient: string;
  wert: string;
  /** Richtige Notiz (Rücklesen) und zwei Fallen. */
  notizen: { text: string; richtig: boolean; warum: string }[];
  bausteine: SbarBaustein[];
  /** Was bis zum Rückruf der Ärztin oder des Arztes zu tun ist (richtige zuerst). */
  bisDahin: { text: string; richtig: boolean; warum: string }[];
}

/** Pflichtangaben einer Telefonnotiz bei kritischen Werten. */
export const DOKU_FELDER = [
  { id: 'uhrzeit', text: 'Uhrzeit des Anrufs', noetig: true },
  { id: 'anrufer', text: 'Name der anrufenden Person im Labor', noetig: true },
  { id: 'patient', text: 'Patientenname und Geburtsdatum', noetig: true },
  { id: 'wert', text: 'Parameter, Wert und Einheit (zurückgelesen)', noetig: true },
  { id: 'weitergabe', text: 'Wem und wann weitergegeben', noetig: true },
  { id: 'zimmer', text: 'Zimmernummer der Nachbarin', noetig: false },
  { id: 'stimmung', text: 'Wie freundlich das Labor war', noetig: false },
] as const;

export const MELDUNGEN: MeldungSzenario[] = [
  {
    id: 'kalium', titel: 'Kalium kritisch hoch',
    anruf: '„Zentrallabor, Schulz. Ich habe einen kritischen Wert für Herrn Peter Brandt, geboren 03.05.1949: Kalium 6,9 mmol/l. Die Probe ist nicht hämolytisch.“',
    patient: 'Herr Brandt, 76 Jahre, chronische Niereninsuffizienz, Ramipril',
    wert: 'Kalium 6,9 mmol/l',
    notizen: [
      { text: '„Ich wiederhole: Peter Brandt, 03.05.1949, Kalium 6,9 mmol/l, nicht hämolytisch. Richtig?“ und notieren', richtig: true, warum: 'Zurücklesen (Read-back) verhindert Hör- und Zahlendreher: 6,9 und 9,6 klingen am Telefon ähnlich.' },
      { text: '„Alles klar, danke“ und später aus dem Gedächtnis dokumentieren', richtig: false, warum: 'Ohne Zurücklesen und sofortige Notiz gehen Werte und Namen verloren oder werden vertauscht.' },
      { text: 'Bitten, den Befund einfach ins System zu stellen', richtig: false, warum: 'Kritische Werte werden telefonisch gemeldet, damit sie sofort jemand liest. Sie stehen zusätzlich im System.' },
    ],
    bausteine: [
      { id: 's', teil: 'S', text: 'Hier Pflegefachkraft Station 4, ich rufe an wegen Herrn Brandt, Zimmer 12: Kalium 6,9 mmol/l, vom Labor als kritisch gemeldet.' },
      { id: 'b', teil: 'B', text: 'Chronische Niereninsuffizienz, nimmt Ramipril, gestern Kalium 5,6.' },
      { id: 'a', teil: 'A', text: 'Er ist wach, Puls 52 und unregelmäßig, RR 118/70, klagt über schwere Beine.' },
      { id: 'r', teil: 'R', text: 'Bitte kommen Sie sofort. Soll ich ein EKG schreiben und den Monitor anschließen?' },
      { id: 'x1', teil: 'x', text: 'Er hat sich heute über das Mittagessen beschwert.' },
      { id: 'x2', teil: 'x', text: 'Die Nachtschicht war sehr unruhig.' },
    ],
    bisDahin: [
      { text: 'Bei Herrn Brandt bleiben, Vitalzeichen und Monitor nach Anordnung, Notfallwagen in Reichweite', richtig: true, warum: 'Hyperkaliämie kann Bradykardie und Kammerflimmern auslösen. Der langsame, unregelmäßige Puls ist ein Warnzeichen.' },
      { text: 'Eine Banane anbieten, damit er etwas isst', richtig: false, warum: 'Bananen sind kaliumreich.' },
      { text: 'Den Wert bis zur Visite liegen lassen', richtig: false, warum: 'Kritische Werte werden sofort ärztlich weitergegeben.' },
    ],
  },
  {
    id: 'glukose', titel: 'Blutzucker kritisch niedrig',
    anruf: '„Labor, Yilmaz. Kritischer Wert bei Frau Erika Lange, geboren 21.09.1938: Glukose 38 mg/dl.“',
    patient: 'Frau Lange, 87 Jahre, Diabetes Typ 2 mit Insulin, hat heute wenig gegessen',
    wert: 'Glukose 38 mg/dl',
    notizen: [
      { text: '„Ich wiederhole: Erika Lange, 21.09.1938, Glukose 38 mg/dl. Richtig?“ und notieren', richtig: true, warum: 'Zurücklesen und sofort notieren, mit Uhrzeit und Namen der Anruferin.' },
      { text: 'Auflegen und sofort zur Patientin laufen, notieren später', richtig: false, warum: 'Erst zurücklesen (wenige Sekunden), dann handeln. Sonst bleibt unklar, ob der Wert richtig verstanden wurde.' },
      { text: 'Fragen, ob das Labor sich sicher ist, und um Wiederholung der Messung bitten', richtig: false, warum: 'Die Patientin zuerst selbst prüfen: kapillären BZ messen und Zeichen der Unterzuckerung beurteilen.' },
    ],
    bausteine: [
      { id: 's', teil: 'S', text: 'Frau Lange, Zimmer 5: Labor meldet Glukose 38 mg/dl, kapillär eben 41 mg/dl, sie ist schläfrig und schwitzig.' },
      { id: 'b', teil: 'B', text: 'Diabetes Typ 2, Mischinsulin morgens, heute kaum gefrühstückt.' },
      { id: 'a', teil: 'A', text: 'Erweckbar, kann nicht sicher schlucken, Puls 104, RR 150/80.' },
      { id: 'r', teil: 'R', text: 'Bitte sofort kommen; Glukose i. v. nach Notfallstandard vorbereitet. Wie soll ich mit dem Insulin weiter verfahren?' },
      { id: 'x1', teil: 'x', text: 'Ihre Tochter hat gestern angerufen.' },
      { id: 'x2', teil: 'x', text: 'Sie mag keinen Tee.' },
    ],
    bisDahin: [
      { text: 'Bei der Patientin bleiben, nichts Flüssiges einflößen solange sie nicht sicher schluckt, Glukose nach Notfallstandard vorbereiten', richtig: true, warum: 'Wer nicht sicher schluckt, kann aspirieren. Bei sicherem Schlucken: schnell wirksame Kohlenhydrate nach Standard.' },
      { text: 'Das nächste Insulin wie geplant spritzen', richtig: false, warum: 'Insulin senkt den Zucker weiter. Nur nach ärztlicher Anordnung.' },
      { text: 'Sie schlafen lassen, damit sie sich erholt', richtig: false, warum: 'Schläfrigkeit bei Unterzucker ist ein Warnzeichen, kein Erholungsschlaf.' },
    ],
  },
  {
    id: 'hb', titel: 'Hämoglobin kritisch niedrig',
    anruf: '„Labor, Becker. Bei Herrn Jonas Frey, geboren 11.12.1962, Hämoglobin 6,4 g/dl.“',
    patient: 'Herr Frey, 63 Jahre, Tag 1 nach Darmoperation, Drainage am Bauch',
    wert: 'Hb 6,4 g/dl',
    notizen: [
      { text: '„Ich wiederhole: Jonas Frey, 11.12.1962, Hb 6,4 g/dl. Richtig?“ und notieren', richtig: true, warum: 'Zurücklesen mit Name, Geburtsdatum, Parameter, Wert und Einheit.' },
      { text: 'Nur die Zahl notieren, der Name ist ja bekannt', richtig: false, warum: 'Auf einer Station gibt es oft ähnliche Namen. Ohne Geburtsdatum ist die Zuordnung unsicher.' },
      { text: 'Den Wert der Kollegin zurufen, die gerade vorbeigeht', richtig: false, warum: 'Zurufen ist kein sicherer Übermittlungsweg und wird nicht dokumentiert.' },
    ],
    bausteine: [
      { id: 's', teil: 'S', text: 'Herr Frey, Zimmer 8, Tag 1 nach Darm-OP: Hb 6,4 g/dl, gestern 10,2.' },
      { id: 'b', teil: 'B', text: 'Elektive Hemikolektomie gestern, Heparin s. c., keine Vorerkrankungen bekannt.' },
      { id: 'a', teil: 'A', text: 'Blass, Puls 118, RR 96/58, in der Drainage seit zwei Stunden 300 ml frisches Blut.' },
      { id: 'r', teil: 'R', text: 'Bitte sofort kommen. Soll ich Kreuzblut abnehmen und den zweiten Zugang vorbereiten?' },
      { id: 'x1', teil: 'x', text: 'Er möchte gern ein Einzelzimmer.' },
      { id: 'x2', teil: 'x', text: 'Der Fernseher im Zimmer geht nicht.' },
    ],
    bisDahin: [
      { text: 'Vitalzeichen engmaschig, Drainage beobachten und Menge dokumentieren, Kreuzblut-Röhrchen und Anforderung vorbereiten', richtig: true, warum: 'So kann nach der ärztlichen Entscheidung sofort transfundiert werden. Kreuzblut mit besonders sorgfältiger Identitätsprüfung.' },
      { text: 'Die Drainage abklemmen, damit kein Blut mehr verloren geht', richtig: false, warum: 'Abklemmen verschleiert die Blutung nur und ist ohne Anordnung nicht erlaubt.' },
      { text: 'Ihn mobilisieren, damit der Kreislauf in Schwung kommt', richtig: false, warum: 'Bei Blutung und Kreislaufschwäche droht ein Sturz und weitere Verschlechterung.' },
    ],
  },
];

/** Bewertet die gebaute SBAR-Meldung: richtige Teile, richtige Reihenfolge, keine Füllsätze. */
export function bewerteSbar(s: MeldungSzenario, auswahl: string[]): { punkte: number; max: number; hinweise: string[] } {
  const teile = auswahl.map((id) => s.bausteine.find((b) => b.id === id)!).filter(Boolean);
  const hinweise: string[] = [];
  const relevant = s.bausteine.filter((b) => b.teil !== 'x');
  const fehlend = relevant.filter((b) => !auswahl.includes(b.id));
  const unnoetig = teile.filter((b) => b.teil === 'x');
  const ordnung = teile.filter((b) => b.teil !== 'x').map((b) => b.teil).join('');
  if (fehlend.length) hinweise.push(`Es fehlt: ${fehlend.map((b) => b.teil).join(', ')}.`);
  if (unnoetig.length) hinweise.push('Unwichtiges verlängert den Anruf und lenkt vom Wesentlichen ab.');
  const ordnungOk = ordnung === 'SBAR';
  if (!ordnungOk && !fehlend.length) hinweise.push('Reihenfolge S, B, A, R: erst Anlass, dann Hintergrund, dann deine Einschätzung, zuletzt die konkrete Bitte.');
  const punkte = (relevant.length - fehlend.length) + (ordnungOk ? 2 : 0) + (unnoetig.length ? 0 : 1);
  return { punkte, max: relevant.length + 3, hinweise };
}
