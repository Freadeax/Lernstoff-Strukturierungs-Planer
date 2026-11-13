// Hygiene-Trainer, Ausbau: Zuordnungen und Fälle in mehreren Schritten (Anwenden und Transfer).
// Grundlage wie aufgaben.ts: KRINKO, Aktion Saubere Hände, TRBA 250, RKI-Ratgeber. Der Hygieneplan der Einrichtung geht vor.

import type { Aufgabe } from '../quiz/quiz';

// Thema als Text, nicht aus aufgaben.ts importiert: aufgaben.ts importiert diese Datei (kein Zyklus).
const T = ['thema.ph.hygiene'];

export const ERWEITERUNG: Partial<Record<'momente' | 'psa' | 'erreger' | 'basis', Aufgabe[]>> = {
  momente: [
    {
      id: 'fall.verbandwechsel', art: 'fall', topicIds: T, titel: 'Fall: Verbandwechsel', stufe: 3,
      frage: 'Welche Händedesinfektion gehört an welche Stelle?',
      einstieg: 'Herr B., 67 Jahre, hat nach einer Hüftoperation eine Wunde mit durchfeuchtetem Verband. Du sollst den Verband wechseln.',
      schritte: [
        { lage: 'Du betrittst das Zimmer, begrüßt Herrn B. und hilfst ihm in die Seitenlage.', frage: 'Welche Indikation liegt vor dem Umlagern vor?', optionen: ['Vor Patientenkontakt', 'Vor aseptischen Tätigkeiten', 'Keine, du trägst gleich Handschuhe'], richtig: [0], mehrfach: false, warum: 'Umlagern ist direkter Körperkontakt. Handschuhe kommen erst später und ersetzen die Desinfektion nicht.' },
        { lage: 'Mit unsterilen Handschuhen entfernst du den alten, durchfeuchteten Verband und wirfst ihn ab.', frage: 'Was folgt direkt danach?', optionen: ['Handschuhe ausziehen und Hände desinfizieren', 'Mit denselben Handschuhen die Wunde reinigen', 'Nur die Handschuhe desinfizieren'], richtig: [0], mehrfach: false, warum: 'Nach Kontakt mit Wundsekret (Indikation 3) wechselst du die Handschuhe und desinfizierst die Hände, bevor es aseptisch weitergeht.' },
        { lage: 'Jetzt reinigst du die Wunde und legst den neuen Verband an.', frage: 'Was gilt unmittelbar vor diesem Schritt?', optionen: ['Händedesinfektion vor aseptischer Tätigkeit, dann sterile Handschuhe oder Non-Touch-Technik', 'Hände waschen genügt', 'Keine Desinfektion nötig, du hast gerade erst desinfiziert'], richtig: [0], mehrfach: false, warum: 'Indikation 2 gilt unmittelbar vor der aseptischen Tätigkeit. Hast du zwischendurch etwas anderes angefasst, wird erneut desinfiziert.' },
        { lage: 'Der Verband sitzt. Du räumst das Material vom Nachttisch und verlässt das Zimmer.', frage: 'Welche Indikationen liegen jetzt vor?', optionen: ['Nach Patientenkontakt', 'Nach Kontakt mit der unmittelbaren Patientenumgebung', 'Vor aseptischen Tätigkeiten'], richtig: [0, 1], mehrfach: true, warum: 'Du hattest Kontakt mit Patient und Umgebung. Eine Desinfektion beim Verlassen deckt beide Indikationen ab.' },
      ],
      erklaerung: ['Bei einem Verbandwechsel wechselt die Indikation mehrfach. Wer die Abfolge kennt, desinfiziert an den richtigen Stellen und nicht wahllos.'],
    },
    {
      id: 'zu.momente', art: 'zuordnen', topicIds: T, titel: 'Indikationen zuordnen', stufe: 2,
      frage: 'Ordne jeder Situation die Indikation zur Händedesinfektion zu.',
      paare: [
        { links: 'Vor dem Anlegen einer Infusion an den Venenkatheter', rechts: 'Vor aseptischen Tätigkeiten' },
        { links: 'Nach dem Ausleeren der Urinflasche', rechts: 'Nach Kontakt mit potenziell infektiösen Materialien' },
        { links: 'Vor dem Anreichen des Essens mit Hilfe beim Aufsetzen', rechts: 'Vor Patientenkontakt' },
        { links: 'Nach dem Wechsel der Bettwäsche, Patientin saß im Stuhl', rechts: 'Nach Kontakt mit der unmittelbaren Patientenumgebung' },
        { links: 'Nach dem Abhören der Lunge', rechts: 'Nach Patientenkontakt' },
      ],
      erklaerung: ['Entscheidend ist, wen die Desinfektion schützt: Vor dem Kontakt den Patienten, nach dem Kontakt dich und die Umgebung.'],
    },
  ],
  erreger: [
    {
      id: 'zu.uebertragung', art: 'zuordnen', topicIds: T, titel: 'Übertragungswege zuordnen', stufe: 2,
      frage: 'Ordne jedem Erreger den wichtigsten Übertragungsweg im Krankenhaus zu.',
      paare: [
        { links: 'MRSA', rechts: 'Kontakt' },
        { links: 'Norovirus', rechts: 'Kontakt' },
        { links: 'Influenza', rechts: 'Tröpfchen' },
        { links: 'Offene Lungentuberkulose', rechts: 'Aerogen (Tröpfchenkerne)' },
        { links: 'Hepatitis B', rechts: 'Blut und Körperflüssigkeiten' },
        { links: 'Clostridioides difficile', rechts: 'Kontakt' },
      ],
      erklaerung: ['Aus dem Übertragungsweg folgt die Schutzmaßnahme: Kontakt → Kittel und Handschuhe, Tröpfchen → Mund-Nasen-Schutz, aerogen → FFP2, Blut → Standardhygiene und sicherer Umgang mit spitzen Gegenständen.'],
    },
    {
      id: 'fall.noro', art: 'fall', topicIds: T, titel: 'Fall: Erbrechen und Durchfall', stufe: 3,
      frage: 'Wie gehst du bei Verdacht auf Norovirus vor?',
      einstieg: 'Frau S., 84 Jahre, liegt im Zweibettzimmer. In der Nacht hat sie zweimal schwallartig erbrochen und hat seit dem Morgen wässrigen Durchfall.',
      schritte: [
        { lage: 'Die Mitpatientin ist gesund, ein Einzelzimmer ist frei.', frage: 'Was ist der erste organisatorische Schritt?', optionen: ['Frau S. nach Hausstandard isolieren, z. B. ins Einzelzimmer mit eigener Toilette', 'Abwarten, bis ein Befund vorliegt', 'Die Mitpatientin bitten, mehr Abstand zu halten'], richtig: [0], mehrfach: false, warum: 'Bei Norovirus-Verdacht wird nicht auf den Befund gewartet. Ausbrüche entstehen in den ersten Stunden.' },
        { lage: 'Du gehst ins Zimmer, um Frau S. nach erneutem Erbrechen zu versorgen.', frage: 'Welche Schutzausrüstung trägst du?', optionen: ['Schutzkittel', 'Einmalhandschuhe', 'Mund-Nasen-Schutz wegen möglicher Tröpfchen beim Erbrechen', 'Nur Handschuhe genügen'], richtig: [0, 1, 2], mehrfach: true, warum: 'Kontakt ist der Hauptweg, beim schwallartigen Erbrechen entstehen zusätzlich virushaltige Tröpfchen.' },
        { lage: 'Du willst dir nach der Versorgung die Hände desinfizieren.', frage: 'Welches Mittel ist geeignet?', optionen: ['Ein Mittel mit Wirksamkeit gegen Noroviren (viruzid oder begrenzt viruzid PLUS)', 'Jedes alkoholische Mittel', 'Nur Händewaschen mit Seife'], richtig: [0], mehrfach: false, warum: 'Noroviren sind unbehüllt. Viele Standardmittel reichen nicht, entscheidend ist die nachgewiesene Wirksamkeit.' },
        { lage: 'Nach drei Tagen sind Erbrechen und Durchfall seit gestern Mittag vorbei.', frage: 'Wann kann die Isolierung frühestens aufgehoben werden?', optionen: ['Frühestens 48 Stunden nach Ende der Symptome, nach Hygieneplan', 'Sofort, sie hat ja keine Beschwerden mehr', 'Erst nach einer negativen Stuhlprobe in jedem Fall'], richtig: [0], mehrfach: false, warum: 'Nach Symptomende werden noch Viren ausgeschieden. Die 48 Stunden sind die übliche Mindestfrist.' },
      ],
      erklaerung: ['Bei Norovirus zählen Tempo und konsequente Barriere: früh isolieren, richtige Schutzausrüstung, wirksame Mittel, ausreichend lange Isolierung.'],
    },
  ],
  psa: [
    {
      id: 'zu.schutz', art: 'zuordnen', topicIds: T, titel: 'Schutzausrüstung zuordnen', stufe: 2,
      frage: 'Welcher Atemschutz passt zur Situation?',
      paare: [
        { links: 'Patient mit Influenza, Bettenmachen', rechts: 'Mund-Nasen-Schutz' },
        { links: 'Patient mit offener Lungentuberkulose, Körperpflege', rechts: 'FFP2-Maske' },
        { links: 'Patient mit MRSA im Nasenvorhof, Absaugen', rechts: 'Mund-Nasen-Schutz' },
        { links: 'Patient ohne bekannte Infektion, Blutdruck messen', rechts: 'Kein Atemschutz nötig' },
        { links: 'Patientin mit Windpocken, Versorgung durch immunes Personal', rechts: 'FFP2-Maske' },
      ],
      erklaerung: ['Tröpfchen fängt ein Mund-Nasen-Schutz ab, aerogen übertragene Erreger nur eine dicht sitzende FFP2-Maske. Der Hygieneplan kann strengere Regeln vorsehen.'],
    },
    {
      id: 'fall.mrsa', art: 'fall', topicIds: T, titel: 'Fall: Zimmer mit MRSA', stufe: 3,
      frage: 'Schützt du dich und andere bei der Versorgung richtig?',
      einstieg: 'Herr F., 77 Jahre, liegt im Einzelzimmer. Im Nasenabstrich wurde MRSA gefunden. Er hat eine Wunde am Unterschenkel, die du heute verbinden sollst. Am Zimmer hängt ein Hinweisschild zur Kontaktisolierung.',
      schritte: [
        {
          lage: 'Vor der Tür steht der Wagen mit Schutzausrüstung.',
          frage: 'Was legst du vor dem Verbandwechsel an? Wähle alle zutreffenden.', optionen: ['Schutzkittel mit langen Ärmeln', 'Einmalhandschuhe', 'Mund-Nasen-Schutz, weil du nah an Nase und Wunde arbeitest', 'Zwei Paar Handschuhe übereinander, damit du sie nicht wechseln musst'],
          richtig: [0, 1, 2], mehrfach: true,
          warum: 'MRSA wird vor allem über Hände und Kontakt übertragen. Kittel und Handschuhe schützen Kleidung und Hände, der Mund-Nasen-Schutz verhindert, dass du dir den Erreger in die eigene Nase bringst. Doppelte Handschuhe ersetzen keinen Handschuhwechsel.',
        },
        {
          lage: 'Du hast den alten Verband abgenommen und willst die Wunde reinigen.',
          frage: 'Was tust du zwischen diesen beiden Schritten?', optionen: ['Handschuhe ausziehen, Hände desinfizieren, frische Handschuhe anziehen', 'Mit denselben Handschuhen weiterarbeiten, du bist ja noch beim selben Patienten', 'Die Handschuhe mit Händedesinfektionsmittel abreiben', 'Nichts, Handschuhe wechselt man erst am Ende'],
          richtig: [0], mehrfach: false,
          warum: 'Vom unreinen zum reinen Arbeitsschritt wird gewechselt, auch beim selben Menschen. Handschuhe desinfiziert man nur in Ausnahmefällen nach Hygieneplan.',
        },
        {
          lage: 'Der Verband ist fertig. Du willst das Zimmer verlassen.',
          frage: 'In welcher Reihenfolge legst du die Schutzausrüstung üblicherweise ab?', optionen: ['Handschuhe aus, Hände desinfizieren, Kittel aus, Mund-Nasen-Schutz ab, Hände desinfizieren', 'Kittel aus, Mund-Nasen-Schutz ab, zuletzt Handschuhe', 'Alles auf dem Flur ablegen', 'Mund-Nasen-Schutz zuerst, damit du besser Luft bekommst'],
          richtig: [0], mehrfach: false,
          warum: 'Am stärksten verschmutzt sind die Handschuhe, sie kommen zuerst weg. Kittel und Maske werden ohne Berührung der Außenseite abgelegt, im Zimmer beziehungsweise in der Schleuse. Danach die Hände desinfizieren.',
        },
        {
          lage: 'Herr F. möchte nachmittags in die Cafeteria.',
          frage: 'Was ist richtig?', optionen: ['Nach Hygieneplan klären; oft ist es möglich mit frischer Kleidung, desinfizierten Händen und abgedeckter Wunde', 'Er darf das Zimmer bis zur Entlassung grundsätzlich nie verlassen', 'Das geht nur mit FFP3-Maske', 'Er muss niemandem Bescheid sagen'],
          richtig: [0], mehrfach: false,
          warum: 'Isolierung soll Übertragung verhindern, nicht Menschen einsperren. Wie streng sie ist, legen Hygieneplan und Hygienefachpersonal fest, abhängig von Erreger, Besiedlungsort und Einrichtung.',
        },
      ],
      erklaerung: ['Kontaktisolierung: Basishygiene plus Kittel und Handschuhe, je nach Tätigkeit Mund-Nasen-Schutz.', 'Vom unreinen zum reinen Schritt Handschuhe wechseln. Ablegen: Handschuhe zuerst, Hände desinfizieren, zuletzt wieder Hände desinfizieren.'],
    },
  ],
  basis: [
    {
      id: 'fall.stich', art: 'fall', topicIds: T, titel: 'Fall: Stichverletzung', stufe: 3,
      frage: 'Wie gehst du nach einer Stichverletzung vor?',
      einstieg: 'Nach einer s. c.-Injektion bei einem Patienten mit bekannter Hepatitis C stichst du dich beim Entsorgen an der Kanüle.',
      schritte: [
        { lage: 'Ein kleiner Blutstropfen tritt aus der Fingerkuppe aus.', frage: 'Was tust du sofort?', optionen: ['Blutung fördern, dann die Stelle mit einem Hautantiseptikum desinfizieren', 'Die Stelle aussaugen', 'Nichts, die Verletzung ist zu klein'], richtig: [0], mehrfach: false, warum: 'Bluten lassen spült Erreger aus, das Antiseptikum reduziert sie. Aussaugen bringt Erreger an die Mundschleimhaut.' },
        { lage: 'Die Wunde ist versorgt, der Dienst läuft weiter.', frage: 'Was folgt als Nächstes?', optionen: ['Sofort der Leitung melden und beim Durchgangsarzt oder Betriebsarzt vorstellen', 'Bis Dienstende warten und dann melden', 'Nur im eigenen Kalender notieren'], richtig: [0], mehrfach: false, warum: 'Für eine mögliche Prophylaxe zählt jede Stunde. Die Meldung sichert außerdem den Versicherungsschutz bei Spätfolgen.' },
        { lage: 'Beim Arzt wird nach dem Indexpatienten gefragt.', frage: 'Welche Angaben sind hilfreich?', optionen: ['Bekannte Infektionen des Patienten (hier Hepatitis C)', 'Art des Instruments und Tiefe der Verletzung', 'Dein eigener Impfstatus gegen Hepatitis B', 'Die Diagnose des Patienten im Stationsflur besprechen'], richtig: [0, 1, 2], mehrfach: true, warum: 'Das Risiko hängt von Erreger, Blutmenge und eigenem Schutz ab. Patientendaten werden dabei nur an die Behandelnden weitergegeben.' },
      ],
      erklaerung: ['Nach Stichverletzungen: bluten lassen, desinfizieren, sofort melden und ärztlich vorstellen, als Arbeitsunfall dokumentieren.'],
    },
  ],
};

export const ERWEITERUNG_VERTIEFUNG: Record<string, string[]> = {
  'fall.verbandwechsel': [
    'Das Modell der 5 Momente beschreibt Situationen, nicht Tätigkeiten. Eine Tätigkeit wie der Verbandwechsel enthält deshalb mehrere Momente hintereinander.',
    'Handschuhwechsel und Händedesinfektion gehören zusammen: Erst ausziehen, dann desinfizieren, dann neue Handschuhe. Desinfizierte Handschuhe sind kein Ersatz, außer der Hygieneplan sieht es für Ausnahmen ausdrücklich vor.',
  ],
  'zu.momente': [
    'Merkhilfe: Die Momente 1 und 2 stehen vor etwas und schützen den Patienten, die Momente 3, 4 und 5 stehen nach etwas und schützen dich und die Umgebung.',
    'Fallen zwei Momente zusammen (z. B. nach Patientenkontakt und vor dem nächsten Patienten), genügt eine Desinfektion.',
  ],
  'zu.uebertragung': [
    'Viele Erreger haben mehrere Wege. Norovirus etwa wird beim Erbrechen auch über Tröpfchen übertragen, Influenza zusätzlich über Hände. Die Zuordnung nennt den wichtigsten Weg im Krankenhaus.',
    'Die KRINKO unterscheidet Basishygiene (für alle) und übertragungsbasierte Maßnahmen (zusätzlich, je nach Weg). Diese bauen auf der Basishygiene auf und ersetzen sie nie.',
  ],
  'fall.noro': [
    'Ein Ausbruch liegt vor, wenn zwei oder mehr Erkrankungen mit wahrscheinlichem Zusammenhang auftreten. Dann wird das Hygienefachpersonal informiert, und es gelten Meldepflichten nach Infektionsschutzgesetz.',
    'Ältere Menschen sind bei Norovirus vor allem durch den Flüssigkeitsverlust gefährdet. Trinkmenge, Ausscheidung und Kreislauf werden deshalb eng beobachtet.',
  ],
  'zu.schutz': [
    'Die Wahl des Atemschutzes hängt vom Übertragungsweg und der Tätigkeit ab. Tätigkeiten, bei denen Aerosole entstehen (Absaugen, Bronchoskopie), brauchen oft einen höheren Schutz als einfacher Kontakt.',
    'Atemschutzmasken sind Arbeitsschutz. Sie müssen passen, richtig sitzen und dürfen nicht unter das Kinn geschoben und wieder aufgesetzt werden.',
  ],
  'fall.stich': [
    'Das Übertragungsrisiko nach einer Stichverletzung ist für Hepatitis B am höchsten (bei fehlender Impfung), deutlich niedriger für Hepatitis C und am niedrigsten für HIV. Tiefe Stiche mit Hohlnadeln und sichtbarem Blut erhöhen das Risiko.',
    'Gegen Hepatitis C gibt es keine Impfung und keine Postexpositionsprophylaxe, aber gut wirksame Behandlungen. Deshalb folgen Kontrolluntersuchungen über mehrere Monate.',
  ],
  'fall.mrsa': [
    'MRSA steht für Methicillin-resistenten Staphylococcus aureus. Viele Menschen tragen ihn unbemerkt in der Nase (Besiedlung). Gefährlich wird er, wenn er in Wunden, Blut oder Lunge gelangt, weil viele Antibiotika nicht mehr wirken.',
    'Im Krankenhaus gilt meist eine strengere Isolierung als im Pflegeheim, weil dort mehr Menschen mit Wunden, Kathetern und geschwächter Abwehr liegen. Eine Sanierung mit Nasensalbe und antiseptischen Waschungen kann die Besiedlung beseitigen.',
  ],
};
