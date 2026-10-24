// Übungsfälle für den SBAR-Übergabe-Trainer. Alle Personen und Werte sind frei erfunden.
//
// Muster für die Prüfung per Code (siehe pruefung.ts):
// - `muster` sind Alternativen; eine reicht.
// - Eine Alternative mit „ + “ verlangt alle Teile (z. B. 'bz + 48').
// - Text wird vorher vereinfacht: klein, ä→ae, ß→ss, „38 Komma 9“→„38,9“, „92 zu 55“→„92/55“.
// - Wortteile genügen („verwirr“ trifft „verwirrt“ und „Verwirrung“), reine Zahlen nur als ganze Zahl.

export type Teil = 'S' | 'B' | 'A' | 'R';
export type Anlass = 'telefon' | 'schicht' | 'notfall';

export interface Kernpunkt {
  id: string;
  teil: Teil;
  text: string;        // was erwartet wird, so wird es auch angezeigt
  muster: string[];
  pflicht: boolean;
}

export interface Fall {
  id: string;
  titel: string;
  bereich: string;     // Versorgungsbereich
  anlass: Anlass;
  empfaenger: string;  // an wen die Übergabe geht
  rolle: string;       // wer du in der Übung bist
  lage: string;        // Einstieg in die Situation
  daten: { label: string; wert: string }[];
  kernpunkte: Kernpunkt[];
  muster: string;      // Beispiel-Übergabe, die alle Kernpunkte enthält
}

export const TEIL_LABEL: Record<Teil, string> = {
  S: 'Situation', B: 'Hintergrund', A: 'Einschätzung', R: 'Empfehlung',
};

export const TEIL_HILFE: Record<Teil, string> = {
  S: 'Wer ruft an, um wen geht es, was ist das akute Problem?',
  B: 'Diagnose, Aufnahmegrund, relevante Vorerkrankungen, Medikamente, Allergien, Verlauf.',
  A: 'Aktuelle Werte und Beobachtungen, deine eigene Einschätzung, was du schon getan hast.',
  R: 'Was brauchst du konkret, bis wann? Rückfrage, Absprache, nächste Kontrolle.',
};

export const ANLASS_LABEL: Record<Anlass, string> = {
  telefon: 'Telefonat', schicht: 'Schichtübergabe', notfall: 'Notfall',
};

/** Allgemeine Punkte, die je nach Anlass zu jeder Übergabe gehören. */
export function allgemeinePunkte(anlass: Anlass): Kernpunkt[] {
  const p: Kernpunkt[] = [];
  if (anlass !== 'schicht') {
    p.push({
      id: 'vorstellung', teil: 'S', pflicht: true,
      text: 'Dich vorstellen (Name, Funktion, Station oder Einrichtung)',
      muster: ['ich bin', 'mein name', 'hier ist', 'hier spricht', 'ich heisse', 'am apparat', 'ich rufe'],
    });
  }
  p.push({
    id: 'bitte', teil: 'R', pflicht: true,
    text: 'Konkrete Bitte oder Frage formulieren',
    muster: ['bitte', 'koennen sie', 'koenntest', 'koennten sie', 'kannst du', 'ich moechte', 'ich wuerde', 'ich schlage', 'ich empfehle', 'ich brauche', 'soll ich', 'sollen wir', 'wuensche', '?'],
  });
  if (anlass !== 'schicht') {
    p.push({
      id: 'zeit', teil: 'R', pflicht: false,
      text: 'Zeitrahmen nennen (sofort, in 10 Minuten, heute)',
      muster: ['sofort', 'umgehend', 'jetzt', 'gleich', 'minuten', 'innerhalb', 'heute', 'so schnell', 'zeitnah', 'bis ', ' uhr', 'nachts', 'morgen'],
    });
    p.push({
      id: 'rueckversicherung', teil: 'R', pflicht: false,
      text: 'Absprache zurückspiegeln (Closed Loop) oder Kontrolle vereinbaren',
      muster: ['wiederhole', 'zusammengefasst', 'richtig verstanden', 'habe ich notiert', 'ich melde mich', 'melde mich wieder', 'rufe wieder an', 'rufe sie', 'kontrolliere', 'kontrolle in', 'erneut', 'nochmal', 'noch einmal', 'messe weiter', 'bleibe bei'],
    });
  } else {
    p.push({
      id: 'naechste', teil: 'R', pflicht: true,
      text: 'Was in der nächsten Schicht zu tun ist (Kontrollen, Termine)',
      muster: ['bitte', 'weiter', 'kontrolle', 'kontrollieren', 'achten', 'beobachten', 'morgen', 'naechste', 'im blick'],
    });
  }
  return p;
}

export const FAELLE: Fall[] = [
  {
    id: 'sepsis',
    titel: 'Fieber und Verwirrtheit nach OP',
    bereich: 'Akutpflege, Chirurgie',
    anlass: 'telefon',
    empfaenger: 'Diensthabende Ärztin, telefonisch (Nachtdienst)',
    rolle: 'Pflegefachkraft (in Ausbildung) im Nachtdienst, Station 4B',
    lage: 'Bei deiner Runde um 2:30 Uhr ist Herr Berger neu verwirrt und zittert. Er war am Abend noch klar.',
    daten: [
      { label: 'Patient', wert: 'Klaus Berger, 72 Jahre, Zimmer 12' },
      { label: 'Aufnahme', wert: 'Hemikolektomie rechts vor 2 Tagen' },
      { label: 'Vorerkrankungen', wert: 'Diabetes mellitus Typ 2, arterielle Hypertonie' },
      { label: 'Allergie', wert: 'Penicillin' },
      { label: 'Vitalzeichen', wert: 'Temperatur 38,9 °C, Puls 118/min, RR 92/55 mmHg, Atemfrequenz 26/min, SpO₂ 93 % ohne O₂' },
      { label: 'Abends (22 Uhr)', wert: 'Temperatur 37,4 °C, Puls 88/min, RR 128/76 mmHg' },
      { label: 'Sonstiges', wert: 'Urin seit 4 Stunden ca. 80 ml, Wunde gerötet' },
    ],
    kernpunkte: [
      { id: 'patient', teil: 'S', pflicht: true, text: 'Patient benennen (Herr Berger, Zimmer 12)', muster: ['berger'] },
      { id: 'problem', teil: 'S', pflicht: true, text: 'Akutes Problem: neu verwirrt, Fieber', muster: ['verwirr', 'desorient', 'fieber', 'deliri'] },
      { id: 'op', teil: 'B', pflicht: true, text: 'Hemikolektomie vor 2 Tagen', muster: ['hemikolektomie', 'kolektomie', 'darm-op', 'darmop', 'darm op', 'darmoperation', 'operiert', 'postoperativ', 'tag 2', '2. tag', 'vor 2 tagen', 'vor zwei tagen'] },
      { id: 'diabetes', teil: 'B', pflicht: false, text: 'Diabetes Typ 2 als Vorerkrankung', muster: ['diabet'] },
      { id: 'allergie', teil: 'B', pflicht: true, text: 'Penicillin-Allergie (wichtig für Antibiotika)', muster: ['penicillin', 'allergi'] },
      { id: 'temp', teil: 'A', pflicht: true, text: 'Temperatur 38,9 °C', muster: ['38,9'] },
      { id: 'puls', teil: 'A', pflicht: true, text: 'Puls 118/min', muster: ['118'] },
      { id: 'rr', teil: 'A', pflicht: true, text: 'Blutdruck 92/55 mmHg (Abfall)', muster: ['92/55', '92'] },
      { id: 'af', teil: 'A', pflicht: false, text: 'Atemfrequenz 26/min', muster: ['26'] },
      { id: 'urin', teil: 'A', pflicht: false, text: 'Wenig Urin (80 ml in 4 h)', muster: ['80 ml', 'urin', 'ausscheidung', 'oligur'] },
      { id: 'einschaetzung', teil: 'A', pflicht: true, text: 'Eigene Einschätzung: Verdacht auf Infektion oder Sepsis, Zustand verschlechtert sich', muster: ['sepsis', 'septisch', 'infekt', 'verschlechter', 'mache mir sorgen', 'besorg', 'kritisch', 'instabil'] },
      { id: 'kommen', teil: 'R', pflicht: true, text: 'Ärztin bitten, den Patienten zeitnah anzusehen', muster: ['vorbeikommen', 'kommen sie', 'ansehen', 'anschauen', 'begutacht', 'untersuch', ' kommen'] },
      { id: 'anordnung', teil: 'R', pflicht: false, text: 'Mögliche Anordnungen erfragen (Blutkulturen, Labor, Infusion)', muster: ['blutkultur', 'labor', 'blutabnahme', 'laktat', 'infusion', 'volumen', 'anordnung'] },
    ],
    muster: `S: Hier ist Mara Lenz, Pflege in Ausbildung, Station 4B. Ich rufe an wegen Herrn Klaus Berger, 72 Jahre, Zimmer 12. Er ist seit etwa einer halben Stunde neu verwirrt und hat Fieber.
B: Er hatte vor 2 Tagen eine Hemikolektomie rechts. Vorerkrankungen sind Diabetes Typ 2 und Bluthochdruck. Er hat eine Penicillin-Allergie. Um 22 Uhr war er noch klar, Temperatur 37,4, Puls 88, Blutdruck 128/76.
A: Jetzt: Temperatur 38,9, Puls 118, Blutdruck 92/55, Atemfrequenz 26, Sättigung 93 % ohne Sauerstoff. Seit 4 Stunden nur etwa 80 ml Urin, die Wunde ist gerötet. Ich mache mir Sorgen, ich vermute eine Infektion bis hin zur Sepsis.
R: Bitte kommen Sie in den nächsten 10 Minuten und sehen ihn sich an. Soll ich schon Blutkulturen und Labor vorbereiten und eine Infusion richten? Ich wiederhole: Sie kommen in 10 Minuten, ich bereite Blutkulturen vor und kontrolliere die Vitalzeichen alle 15 Minuten.`,
  },
  {
    id: 'hypo',
    titel: 'Unterzucker am Abend',
    bereich: 'Stationäre Langzeitpflege',
    anlass: 'telefon',
    empfaenger: 'Hausarzt, telefonisch (Bereitschaft)',
    rolle: 'Auszubildende im Spätdienst, Wohnbereich 2 im Seniorenzentrum',
    lage: 'Frau Mahler ist um 20:15 Uhr kaltschweißig und zittrig. Der Blutzucker ist niedrig. Du hast schon Traubenzucker gegeben.',
    daten: [
      { label: 'Bewohnerin', wert: 'Ingrid Mahler, 81 Jahre, Zimmer 7' },
      { label: 'Diagnosen', wert: 'Diabetes mellitus Typ 2 mit Insulin, leichte Demenz' },
      { label: 'Medikation', wert: 'Mischinsulin 18 IE abends, um 18 Uhr gespritzt' },
      { label: 'Ernährung', wert: 'Abendessen kaum gegessen (ein halbes Brot)' },
      { label: 'Messung 20:15', wert: 'Blutzucker 48 mg/dl, Puls 96/min, RR 135/80 mmHg, wach und ansprechbar' },
      { label: 'Maßnahme', wert: '20 g Glukose oral gegeben (Traubenzucker in Wasser)' },
      { label: 'Messung 20:30', wert: 'Blutzucker 92 mg/dl, Schwitzen lässt nach' },
    ],
    kernpunkte: [
      { id: 'patient', teil: 'S', pflicht: true, text: 'Bewohnerin benennen (Frau Mahler)', muster: ['mahler'] },
      { id: 'problem', teil: 'S', pflicht: true, text: 'Problem: Unterzucker', muster: ['unterzucker', 'hypogly', 'blutzucker', 'zucker'] },
      { id: 'insulin', teil: 'B', pflicht: true, text: 'Insulinpflichtiger Diabetes, 18 IE Mischinsulin um 18 Uhr', muster: ['insulin'] },
      { id: 'essen', teil: 'B', pflicht: true, text: 'Abendessen kaum gegessen', muster: ['gegessen', 'abendessen', 'wenig ge', 'kaum', 'nahrung'] },
      { id: 'demenz', teil: 'B', pflicht: false, text: 'Leichte Demenz', muster: ['demenz', 'dement'] },
      { id: 'bz1', teil: 'A', pflicht: true, text: 'Blutzucker 48 mg/dl', muster: ['48'] },
      { id: 'glukose', teil: 'A', pflicht: true, text: 'Maßnahme: 20 g Glukose gegeben', muster: ['traubenzucker', 'glukose', 'glucose', 'dextro', 'zucker gegeben', '20 g'] },
      { id: 'bz2', teil: 'A', pflicht: true, text: 'Kontrolle: jetzt 92 mg/dl', muster: ['92'] },
      { id: 'bewusstsein', teil: 'A', pflicht: false, text: 'Wach und ansprechbar', muster: ['ansprechbar', ' wach', 'bewusst', 'orientiert'] },
      { id: 'dosis', teil: 'R', pflicht: true, text: 'Insulindosis überprüfen lassen (morgen früh, weitere Abende)', muster: ['dosis', 'insulin', 'anpass', 'reduz', 'ueberpruef'] },
      { id: 'kontrolle', teil: 'R', pflicht: false, text: 'Weitere BZ-Kontrollen absprechen (z. B. 22 Uhr, nachts)', muster: ['kontroll', 'nachmessen', 'messen', '22 uhr', 'nachts'] },
    ],
    muster: `S: Guten Abend, mein Name ist Jonas Peters, Auszubildender im Seniorenzentrum, Wohnbereich 2. Es geht um Frau Ingrid Mahler, 81 Jahre. Sie hatte eben eine Unterzuckerung.
B: Sie hat einen insulinpflichtigen Diabetes Typ 2 und eine leichte Demenz. Um 18 Uhr hat sie 18 IE Mischinsulin bekommen, aber das Abendessen kaum gegessen.
A: Um 20:15 war sie kaltschweißig, Blutzucker 48 mg/dl, wach und ansprechbar. Ich habe 20 g Traubenzucker gegeben. Um 20:30 lag der Blutzucker bei 92, sie schwitzt weniger. Sie ist jetzt stabil.
R: Können Sie bitte die Insulindosis überprüfen, falls sie abends wenig isst? Ich schlage vor, ich messe um 22 Uhr und nachts noch einmal. Ist das so in Ordnung? Ich melde mich, wenn der Wert unter 70 fällt.`,
  },
  {
    id: 'sturz',
    titel: 'Sturz in der Nacht unter Blutverdünnung',
    bereich: 'Akutpflege, Innere Medizin',
    anlass: 'telefon',
    empfaenger: 'Diensthabender Arzt, telefonisch',
    rolle: 'Pflegefachkraft (in Ausbildung) im Nachtdienst, Station 2A',
    lage: 'Um 3:10 Uhr findest du Herrn Schulz neben dem Bett auf dem Boden. Er wollte allein zur Toilette.',
    daten: [
      { label: 'Patient', wert: 'Werner Schulz, 85 Jahre, Zimmer 5' },
      { label: 'Aufnahme', wert: 'Pneumonie, Tag 3' },
      { label: 'Vorerkrankungen', wert: 'Vorhofflimmern, Arthrose' },
      { label: 'Medikation', wert: 'Phenprocoumon (Marcumar), letzter INR 2,8' },
      { label: 'Befund', wert: 'Platzwunde an der Stirn, blutet leicht. Schmerzen in der rechten Hüfte, Bein wirkt verkürzt und nach außen gedreht' },
      { label: 'Vitalzeichen', wert: 'RR 145/85 mmHg, Puls 92/min unregelmäßig, wach, orientiert, Schmerz NRS 7' },
      { label: 'Maßnahme', wert: 'Nicht mobilisiert, mit Kissen gelagert, Wunde steril abgedeckt' },
    ],
    kernpunkte: [
      { id: 'patient', teil: 'S', pflicht: true, text: 'Patient benennen (Herr Schulz)', muster: ['schulz'] },
      { id: 'problem', teil: 'S', pflicht: true, text: 'Problem: Sturz', muster: ['sturz', 'gestuerzt', 'gefallen', 'am boden', 'auf dem boden'] },
      { id: 'antikoag', teil: 'B', pflicht: true, text: 'Blutverdünnung mit Phenprocoumon (Marcumar), INR 2,8', muster: ['marcumar', 'phenprocoumon', 'blutverduenn', 'antikoag', 'gerinnungshemm', 'inr'] },
      { id: 'aufnahme', teil: 'B', pflicht: false, text: 'Aufnahme wegen Pneumonie', muster: ['pneumonie', 'lungenentzuendung'] },
      { id: 'vhf', teil: 'B', pflicht: false, text: 'Vorhofflimmern', muster: ['vorhofflimmern', 'vhf', 'absolute arrhythmie'] },
      { id: 'kopf', teil: 'A', pflicht: true, text: 'Platzwunde an der Stirn (Kopfverletzung)', muster: ['platzwunde', 'stirn', 'kopf'] },
      { id: 'huefte', teil: 'A', pflicht: true, text: 'Hüftschmerz rechts, Bein verkürzt und außenrotiert', muster: ['huefte', 'verkuerzt', 'aussenrot', 'nach aussen', 'schenkelhals', 'fraktur', 'bein'] },
      { id: 'bewusstsein', teil: 'A', pflicht: true, text: 'Wach und orientiert', muster: ['orientiert', ' wach', 'ansprechbar', 'bewusst', 'gcs'] },
      { id: 'vital', teil: 'A', pflicht: false, text: 'Vitalzeichen (RR 145/85, Puls 92)', muster: ['145', '92'] },
      { id: 'untersuchung', teil: 'R', pflicht: true, text: 'Ärztliche Untersuchung anfordern', muster: ['ansehen', 'anschauen', 'untersuch', ' kommen', 'vorbeikommen', 'begutacht'] },
      { id: 'diagnostik', teil: 'R', pflicht: false, text: 'Röntgen oder CT, Schmerzmittel, Gerinnung erfragen', muster: ['roentgen', ' ct ', 'bildgebung', 'schmerzmittel', 'analges', 'gerinnung', 'inr'] },
    ],
    muster: `S: Hier spricht Lea Wolf, Pflege in Ausbildung, Station 2A. Ich rufe an wegen Herrn Werner Schulz, 85 Jahre, Zimmer 5. Er ist um 3:10 Uhr gestürzt, ich habe ihn neben dem Bett gefunden.
B: Er liegt seit 3 Tagen wegen einer Pneumonie bei uns. Er hat Vorhofflimmern und bekommt Marcumar, letzter INR 2,8.
A: Er hat eine Platzwunde an der Stirn, die leicht blutet. Er hat starke Schmerzen in der rechten Hüfte, NRS 7, das Bein wirkt verkürzt und nach außen gedreht. Blutdruck 145/85, Puls 92 unregelmäßig, er ist wach und orientiert. Ich habe ihn nicht mobilisiert und die Wunde steril abgedeckt. Ich denke an eine Schenkelhalsfraktur und wegen Marcumar an eine Blutung im Kopf.
R: Bitte kommen Sie sofort und untersuchen ihn. Brauchen wir ein Röntgen der Hüfte und ein CT vom Kopf? Was darf ich ihm gegen die Schmerzen geben? Bis dahin kontrolliere ich Bewusstsein und Vitalzeichen alle 15 Minuten.`,
  },
  {
    id: 'atemnot',
    titel: 'Atemnot bei Herzschwäche',
    bereich: 'Akutpflege, Kardiologie',
    anlass: 'telefon',
    empfaenger: 'Stationsärztin, telefonisch',
    rolle: 'Auszubildende im Frühdienst, Station 6 Kardiologie',
    lage: 'Frau Brandt klingelt um 9:40 Uhr. Sie sitzt aufrecht im Bett und ringt nach Luft. Man hört ein Rasseln beim Atmen.',
    daten: [
      { label: 'Patientin', wert: 'Helga Brandt, 78 Jahre, Zimmer 3' },
      { label: 'Aufnahme', wert: 'Dekompensierte Herzinsuffizienz, vor 1 Tag' },
      { label: 'Medikation', wert: 'Furosemid 40 mg morgens oral (heute gegeben), Ramipril' },
      { label: 'Vitalzeichen', wert: 'Atemfrequenz 30/min, SpO₂ 86 % ohne O₂, Puls 112/min, RR 160/95 mmHg' },
      { label: 'Beobachtung', wert: 'Feuchte Rasselgeräusche hörbar, Unterschenkelödeme beidseits, Gewicht +2 kg seit gestern' },
      { label: 'Maßnahme', wert: 'Oberkörper hoch, Beine tief gelagert, Sauerstoff 2 l/min nach Bedarfsanordnung, jetzt SpO₂ 89 %' },
    ],
    kernpunkte: [
      { id: 'patient', teil: 'S', pflicht: true, text: 'Patientin benennen (Frau Brandt)', muster: ['brandt'] },
      { id: 'problem', teil: 'S', pflicht: true, text: 'Problem: akute Atemnot', muster: ['atemnot', 'luftnot', 'dyspnoe', 'bekommt schlecht luft', 'keine luft', 'ringt nach luft'] },
      { id: 'hi', teil: 'B', pflicht: true, text: 'Herzinsuffizienz als Aufnahmegrund', muster: ['herzinsuff', 'herzschwaech', 'herzschwach'] },
      { id: 'furo', teil: 'B', pflicht: false, text: 'Furosemid 40 mg heute früh gegeben', muster: ['furosemid', 'lasix', 'diuretik', 'wassertablette'] },
      { id: 'spo2', teil: 'A', pflicht: true, text: 'SpO₂ 86 % ohne, 89 % mit 2 l O₂', muster: ['86', '89'] },
      { id: 'af', teil: 'A', pflicht: true, text: 'Atemfrequenz 30/min', muster: ['30'] },
      { id: 'rasseln', teil: 'A', pflicht: true, text: 'Rasselgeräusche, Ödeme, +2 kg', muster: ['rassel', 'brodel', 'oedem', 'kg', 'gewicht'] },
      { id: 'massnahme', teil: 'A', pflicht: false, text: 'Bereits: Herzbettlage, 2 l O₂', muster: ['sauerstoff', 'o2', '2 l', 'oberkoerper', 'herzbett', 'gelagert'] },
      { id: 'einschaetzung', teil: 'A', pflicht: false, text: 'Einschätzung: Verdacht auf Lungenödem', muster: ['lungenoedem', 'wasser in der lunge', 'dekompens', 'verschlechter', 'sorge'] },
      { id: 'kommen', teil: 'R', pflicht: true, text: 'Ärztin sofort zur Patientin bitten', muster: [' kommen', 'ansehen', 'anschauen', 'vorbeikommen', 'untersuch'] },
      { id: 'anordnung', teil: 'R', pflicht: false, text: 'Anordnung erfragen (Diuretikum i. v., mehr O₂)', muster: [' i v ', ' iv ', 'intraven', 'mehr sauerstoff', 'sauerstoff erhoeh', 'anordnung', 'furosemid'] },
    ],
    muster: `S: Hallo, hier ist Selin Arslan, Auszubildende auf der Station 6. Ich rufe an wegen Frau Helga Brandt, 78 Jahre, Zimmer 3. Sie hat seit ein paar Minuten akute Atemnot.
B: Sie ist gestern mit einer dekompensierten Herzinsuffizienz gekommen. Heute früh hat sie 40 mg Furosemid oral bekommen.
A: Atemfrequenz 30, Sättigung 86 % ohne Sauerstoff, Puls 112, Blutdruck 160/95. Man hört feuchte Rasselgeräusche, sie hat Ödeme an beiden Unterschenkeln und 2 kg mehr als gestern. Ich habe sie in Herzbettlage gebracht und nach Bedarfsanordnung 2 l Sauerstoff gegeben, jetzt 89 %. Ich vermute ein beginnendes Lungenödem.
R: Bitte kommen Sie sofort. Soll ich Furosemid i.v. vorbereiten und den Sauerstoff erhöhen? Ich bleibe bei ihr und messe weiter.`,
  },
  {
    id: 'kind',
    titel: 'Schichtübergabe: Kind mit Magen-Darm-Infekt',
    bereich: 'Pädiatrie',
    anlass: 'schicht',
    empfaenger: 'Kollegin aus dem Nachtdienst, Übergabe am Bett',
    rolle: 'Auszubildende im Spätdienst, Kinderstation',
    lage: 'Es ist 21 Uhr, Schichtwechsel. Du übergibst Lena, die du heute betreut hast.',
    daten: [
      { label: 'Kind', wert: 'Lena Hoffmann, 4 Jahre, Zimmer 9, Mutter ist dabei' },
      { label: 'Aufnahme', wert: 'Heute 11 Uhr, Gastroenteritis mit leichter Exsikkose' },
      { label: 'Gewicht', wert: '15,2 kg bei Aufnahme (zu Hause vor einer Woche 16 kg)' },
      { label: 'Infusion', wert: 'Vollelektrolytlösung 60 ml/h über die Braunüle links, läuft gut' },
      { label: 'Verlauf', wert: 'Seit 15 Uhr kein Erbrechen mehr, 2-mal dünner Stuhl, letzte nasse Windel 19:30 Uhr' },
      { label: 'Trinken', wert: 'Tee und Elektrolytlösung, 250 ml seit Aufnahme' },
      { label: 'Vitalzeichen 20 Uhr', wert: 'Temperatur 37,8 °C, Puls 110/min, munterer als mittags' },
      { label: 'Plan', wert: 'Trinkprotokoll und Ausscheidung weiterführen, Wiegen morgen 6 Uhr, Labor morgen früh' },
    ],
    kernpunkte: [
      { id: 'patient', teil: 'S', pflicht: true, text: 'Kind benennen (Lena, 4 Jahre)', muster: ['lena', 'hoffmann'] },
      { id: 'zustand', teil: 'S', pflicht: true, text: 'Kurz: Gastroenteritis, aktuell stabil', muster: ['gastroenter', 'magen-darm', 'magen darm', 'brechdurchfall', 'durchfall', 'stabil'] },
      { id: 'exsikkose', teil: 'B', pflicht: true, text: 'Leichte Exsikkose, Aufnahme heute', muster: ['exsikk', 'ausgetrocknet', 'fluessigkeitsmangel', 'dehydr'] },
      { id: 'gewicht', teil: 'B', pflicht: false, text: 'Gewicht 15,2 kg', muster: ['15,2', 'kg'] },
      { id: 'mutter', teil: 'B', pflicht: false, text: 'Mutter ist dabei', muster: ['mutter', 'mama', 'eltern'] },
      { id: 'infusion', teil: 'A', pflicht: true, text: 'Infusion 60 ml/h läuft über die Braunüle links', muster: ['infusion', 'braunuele', 'zugang', 'tropf'] },
      { id: 'erbrechen', teil: 'A', pflicht: true, text: 'Seit 15 Uhr kein Erbrechen, 2-mal Stuhl', muster: ['erbrech', 'gebrochen', 'stuhl', 'durchfall'] },
      { id: 'ausscheidung', teil: 'A', pflicht: true, text: 'Letzte nasse Windel 19:30 Uhr', muster: ['windel', 'urin', 'ausscheid', 'pipi'] },
      { id: 'trinken', teil: 'A', pflicht: true, text: 'Trinkmenge 250 ml', muster: ['250', 'getrunken', 'trinkmenge', 'trinkt'] },
      { id: 'temp', teil: 'A', pflicht: false, text: 'Temperatur 37,8 °C', muster: ['37,8'] },
      { id: 'protokoll', teil: 'R', pflicht: true, text: 'Trinkprotokoll und Ausscheidung weiterführen', muster: ['protokoll', 'bilanz', 'ein- und aus', 'ausfuhr'] },
      { id: 'morgen', teil: 'R', pflicht: false, text: 'Wiegen um 6 Uhr, Labor morgen früh', muster: ['wiegen', 'gewicht', 'labor', 'blutabnahme', '6 uhr'] },
    ],
    muster: `S: Ich übergebe Lena Hoffmann, 4 Jahre, Zimmer 9. Sie hat eine Gastroenteritis und ist im Moment stabil.
B: Sie ist heute um 11 Uhr mit einer leichten Exsikkose gekommen, die Mutter ist bei ihr. Aufnahmegewicht 15,2 kg, vor einer Woche waren es zu Hause 16 kg.
A: Die Infusion mit Vollelektrolytlösung läuft mit 60 ml/h über die Braunüle links, ohne Probleme. Seit 15 Uhr kein Erbrechen mehr, zweimal dünner Stuhl. Letzte nasse Windel um 19:30. Sie hat seit Aufnahme 250 ml getrunken. Um 20 Uhr 37,8 Grad, Puls 110, sie ist munterer als mittags.
R: Bitte das Trinkprotokoll und die Ausscheidung weiterführen und auf die nächste nasse Windel achten. Morgen um 6 Uhr wiegen, das Labor ist für morgen früh angemeldet.`,
  },
  {
    id: 'schmerz',
    titel: 'Starke Schmerzen nach Hüft-OP',
    bereich: 'Akutpflege, Orthopädie',
    anlass: 'telefon',
    empfaenger: 'Stationsarzt, telefonisch',
    rolle: 'Pflegefachkraft (in Ausbildung) im Spätdienst, Station 3 Orthopädie',
    lage: 'Frau Vogel klagt um 17 Uhr über sehr starke Schmerzen. Die Bedarfsmedikation ist für heute schon ausgeschöpft.',
    daten: [
      { label: 'Patientin', wert: 'Renate Vogel, 67 Jahre, Zimmer 14' },
      { label: 'OP', wert: 'Hüft-TEP links gestern' },
      { label: 'Schmerzmittel', wert: 'Metamizol 1 g 4-mal täglich, letzte Gabe 14 Uhr. Bedarf: Piritramid 7,5 mg s.c., schon 2-mal gegeben (max. 2-mal)' },
      { label: 'Schmerz', wert: 'NRS 8 in Ruhe, bei Bewegung 9, im Bereich der Wunde' },
      { label: 'Befund', wert: 'Verband trocken, Bein warm, rosig, Fußpulse tastbar, Sensibilität normal' },
      { label: 'Vitalzeichen', wert: 'RR 150/90 mmHg, Puls 98/min, Temperatur 37,2 °C' },
      { label: 'Mobilisation', wert: 'Morgen früh Physiotherapie geplant' },
    ],
    kernpunkte: [
      { id: 'patient', teil: 'S', pflicht: true, text: 'Patientin benennen (Frau Vogel)', muster: ['vogel'] },
      { id: 'problem', teil: 'S', pflicht: true, text: 'Problem: starke Schmerzen', muster: ['schmerz'] },
      { id: 'op', teil: 'B', pflicht: true, text: 'Hüft-TEP links gestern', muster: [' tep', 'hueft', 'endoprothese', 'operiert', ' op '] },
      { id: 'medikation', teil: 'B', pflicht: true, text: 'Metamizol, Bedarfsmedikation Piritramid schon 2-mal gegeben', muster: ['metamizol', 'novalgin', 'piritramid', 'dipidolor', 'bedarf'] },
      { id: 'nrs', teil: 'A', pflicht: true, text: 'Schmerzstärke NRS 8 in Ruhe', muster: ['nrs', 'skala', '8 von 10', 'acht von zehn'] },
      { id: 'befund', teil: 'A', pflicht: true, text: 'Wunde und Durchblutung unauffällig (Verband trocken, Pulse tastbar)', muster: ['verband', 'wunde', 'fusspuls', 'pulse', 'durchblut', 'sensib', ' warm'] },
      { id: 'vital', teil: 'A', pflicht: false, text: 'Vitalzeichen (RR 150/90, Puls 98)', muster: ['150', '98'] },
      { id: 'ausgeschoepft', teil: 'A', pflicht: true, text: 'Bedarfsmedikation ausgeschöpft', muster: ['ausgeschoepft', 'maximal', 'keine weitere', 'nichts mehr', 'schon zweimal', 'schon 2'] },
      { id: 'anpassung', teil: 'R', pflicht: true, text: 'Schmerztherapie anpassen lassen (neue Anordnung)', muster: ['anpass', 'anordnung', 'anordnen', 'erhoeh', 'zusaetzlich', 'weiteres schmerzmittel', 'schmerzmittel'] },
    ],
    muster: `S: Hier ist Tim Becker, Pflege in Ausbildung, Station 3. Es geht um Frau Renate Vogel, 67 Jahre, Zimmer 14. Sie hat sehr starke Schmerzen.
B: Sie hat gestern eine Hüft-TEP links bekommen. Sie bekommt Metamizol 1 g viermal täglich, zuletzt um 14 Uhr. Piritramid nach Bedarf hat sie heute schon zweimal bekommen, das ist das Maximum.
A: Schmerz NRS 8 in Ruhe, 9 bei Bewegung, im Bereich der Wunde. Der Verband ist trocken, das Bein ist warm und rosig, Fußpulse tastbar, Sensibilität normal. Blutdruck 150/90, Puls 98, Temperatur 37,2. Die Bedarfsmedikation ist ausgeschöpft, die Schmerzen sind nicht ausreichend behandelt.
R: Können Sie bitte die Schmerztherapie anpassen und mir eine neue Anordnung geben? Morgen früh ist Physiotherapie geplant. Ich frage in 30 Minuten nach der Gabe noch einmal nach den Schmerzen.`,
  },
  {
    id: 'delir',
    titel: 'Plötzlich verwirrt mit trübem Urin',
    bereich: 'Ambulante Pflege',
    anlass: 'telefon',
    empfaenger: 'Hausärztin, telefonisch (Praxis)',
    rolle: 'Auszubildende im ambulanten Pflegedienst, Frühtour',
    lage: 'Bei deinem Besuch um 8:30 Uhr erkennt Herr Krüger dich nicht. Seine Tochter sagt, er sei seit gestern Abend durcheinander.',
    daten: [
      { label: 'Klient', wert: 'Otto Krüger, 88 Jahre, lebt allein, Tochter wohnt nebenan' },
      { label: 'Diagnosen', wert: 'Benigne Prostatahyperplasie, Herzinsuffizienz, keine Demenz bekannt' },
      { label: 'Beobachtung', wert: 'Desorientiert zu Ort und Zeit, unruhig. Urin trüb und riecht stark, Brennen beim Wasserlassen laut Tochter' },
      { label: 'Trinken', wert: 'Laut Tochter gestern nur etwa 600 ml' },
      { label: 'Vitalzeichen', wert: 'Temperatur 37,9 °C, Puls 94/min, RR 118/70 mmHg' },
      { label: 'Medikation', wert: 'Tamsulosin, Torasemid' },
    ],
    kernpunkte: [
      { id: 'patient', teil: 'S', pflicht: true, text: 'Klienten benennen (Herr Krüger)', muster: ['krueger'] },
      { id: 'problem', teil: 'S', pflicht: true, text: 'Problem: seit gestern akut verwirrt', muster: ['verwirr', 'desorient', 'durcheinander', 'deliri'] },
      { id: 'neu', teil: 'B', pflicht: true, text: 'Neu aufgetreten, keine Demenz bekannt', muster: ['keine demenz', 'sonst orientiert', 'sonst klar', ' neu ', 'seit gestern', 'normalerweise'] },
      { id: 'prostata', teil: 'B', pflicht: false, text: 'Prostatavergrößerung, Herzinsuffizienz', muster: ['prostata', 'herzinsuff', 'herzschwaech'] },
      { id: 'urin', teil: 'A', pflicht: true, text: 'Urin trüb, riecht, Brennen', muster: ['trueb', 'riecht', 'brenn', 'urin'] },
      { id: 'trinken', teil: 'A', pflicht: true, text: 'Trinkmenge nur 600 ml', muster: ['600', 'wenig getrunken', 'trinkmenge'] },
      { id: 'temp', teil: 'A', pflicht: true, text: 'Temperatur 37,9 °C', muster: ['37,9'] },
      { id: 'einschaetzung', teil: 'A', pflicht: false, text: 'Einschätzung: Verdacht auf Harnwegsinfekt mit Delir', muster: ['harnwegsinf', 'hwi', 'blasenentz', 'zystitis', 'infekt', 'delir'] },
      { id: 'besuch', teil: 'R', pflicht: true, text: 'Hausbesuch oder Abklärung heute', muster: ['hausbesuch', 'vorbeikommen', 'ansehen', ' kommen', 'einweis', 'abklaer'] },
      { id: 'urinprobe', teil: 'R', pflicht: false, text: 'Urinprobe oder Urinstix anbieten', muster: ['urinstix', 'urinprobe', 'stix', 'kultur', 'probe'] },
    ],
    muster: `S: Guten Morgen, mein Name ist Paula Kern, Auszubildende beim Pflegedienst Sonnenweg. Ich rufe an wegen Herrn Otto Krüger, 88 Jahre. Er ist seit gestern Abend verwirrt.
B: Er hat eine Prostatavergrößerung und eine Herzinsuffizienz, eine Demenz ist nicht bekannt. Normalerweise ist er völlig klar. Er nimmt Tamsulosin und Torasemid.
A: Heute ist er zu Ort und Zeit desorientiert und unruhig. Der Urin ist trüb und riecht stark, laut Tochter hat er Brennen beim Wasserlassen. Er hat gestern nur etwa 600 ml getrunken. Temperatur 37,9, Puls 94, Blutdruck 118/70. Ich vermute einen Harnwegsinfekt mit Delir.
R: Könnten Sie bitte heute noch einen Hausbesuch machen? Ich kann eine Urinprobe für einen Stix oder eine Kultur mitbringen. Die Tochter achtet aufs Trinken, ich melde mich, wenn es schlechter wird.`,
  },
  {
    id: 'schlaganfall',
    titel: 'Plötzliche Sprachstörung',
    bereich: 'Akutpflege, Innere Medizin',
    anlass: 'notfall',
    empfaenger: 'Notfallteam (Reanimations- und Notfallnummer der Klinik)',
    rolle: 'Pflegefachkraft (in Ausbildung) im Spätdienst, Station 1C',
    lage: 'Um 14:25 Uhr bemerkst du beim Kaffee, dass Frau Lang verwaschen spricht und ihr die Tasse aus der rechten Hand rutscht.',
    daten: [
      { label: 'Patientin', wert: 'Monika Lang, 63 Jahre, Zimmer 8' },
      { label: 'Aufnahme', wert: 'Entgleister Bluthochdruck, seit gestern' },
      { label: 'Symptombeginn', wert: 'Um 14:20 Uhr war sie noch unauffällig (Besuch der Tochter)' },
      { label: 'FAST', wert: 'Rechter Mundwinkel hängt, rechter Arm sinkt ab, Sprache verwaschen' },
      { label: 'Messung', wert: 'RR 190/105 mmHg, Puls 84/min, SpO₂ 96 %, Blutzucker 112 mg/dl' },
      { label: 'Medikation', wert: 'Amlodipin, Ramipril, keine Blutverdünnung' },
    ],
    kernpunkte: [
      { id: 'patient', teil: 'S', pflicht: true, text: 'Patientin und Ort nennen (Frau Lang, Station 1C, Zimmer 8)', muster: [' lang ', 'zimmer 8', ' 1c '] },
      { id: 'problem', teil: 'S', pflicht: true, text: 'Problem: Verdacht auf Schlaganfall', muster: ['schlaganfall', 'apoplex', 'insult', 'stroke'] },
      { id: 'beginn', teil: 'B', pflicht: true, text: 'Symptombeginn 14:20 Uhr (zuletzt gesund gesehen)', muster: ['14:20', '14 uhr 20', '1420', 'seit 5 minuten', 'vor 5 minuten', 'zuletzt'] },
      { id: 'hypertonie', teil: 'B', pflicht: false, text: 'Aufnahme wegen entgleistem Bluthochdruck', muster: ['bluthochdruck', 'hypertens', 'hyperton', 'blutdruck'] },
      { id: 'antikoag', teil: 'B', pflicht: false, text: 'Keine Blutverdünnung', muster: ['keine blutverd', 'keine antikoag', 'kein marcumar', 'keine gerinnung'] },
      { id: 'fast', teil: 'A', pflicht: true, text: 'FAST: Mundwinkel, Arm rechts, Sprache', muster: ['mundwinkel', 'gesicht', ' arm', 'sprach', 'verwaschen'] },
      { id: 'rr', teil: 'A', pflicht: true, text: 'Blutdruck 190/105 mmHg', muster: ['190'] },
      { id: 'bz', teil: 'A', pflicht: true, text: 'Blutzucker 112 mg/dl (Unterzucker ausgeschlossen)', muster: ['112', 'blutzucker'] },
      { id: 'sofort', teil: 'R', pflicht: true, text: 'Sofort kommen, Stroke-Unit oder CT veranlassen', muster: ['sofort', 'stroke', ' ct ', 'schnell'] },
    ],
    muster: `S: Hier ist Ben Yilmaz, Pflege in Ausbildung, Station 1C, Zimmer 8. Wir haben einen Verdacht auf Schlaganfall bei Frau Monika Lang, 63 Jahre.
B: Symptombeginn 14:20 Uhr, da war sie noch unauffällig. Sie liegt seit gestern wegen entgleistem Bluthochdruck bei uns und nimmt keine Blutverdünnung.
A: Der rechte Mundwinkel hängt, der rechte Arm sinkt ab, die Sprache ist verwaschen. Blutdruck 190/105, Puls 84, Sättigung 96 %, Blutzucker 112.
R: Bitte kommen Sie sofort, sie braucht schnell ein CT und die Stroke-Unit. Ich bleibe bei ihr und halte sie nüchtern.`,
  },
];
