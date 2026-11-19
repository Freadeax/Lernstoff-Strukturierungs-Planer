// Fallwelle P17a · CE 02 Menschen in der Mobilität und Selbstversorgung unterstützen · Krankenhaus, Chirurgie:
// Harnverhalt nach der OP mit Überlaufinkontinenz. Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch.
// Physiologie G2 (niere.ts): Treiber `harnverhalt` füllt die Blase weiter, Schmerz und Unruhe steigen; die
// Einmalkatheterisierung (Katalog blasenkatheter-legen, beendet: harnverhalt) entleert sie. Blasenscan zeigt {blaseMl}.

import { KATALOG } from '../katalog';
import type { ArztRegel, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const KOLLEGE_KOMMT = 300;
const ALLE = { 1: 'selbst', 2: 'selbst', 3: 'selbst', pflegefachperson: 'selbst' } as const;
/** Entleerte Blase: der Druckschmerz und die Unruhe gehen zurück */
const ERLEICHTERUNG = [
  { groesse: 'schmerz', delta: -2.5, beginnSek: 0, spitzeSek: 120, dauerSek: 'dauerhaft' },
  { groesse: 'unruhe', delta: -0.25, beginnSek: 0, spitzeSek: 120, dauerSek: 'dauerhaft' },
] as const satisfies MassnahmeDefinition['wirkung'];

const REGEL_VOLL: ArztRegel = {
  id: 'r-voll', wenn: { gemeldet: ['s-kein-urin', 'a-blasenscan'] },
  antwort: '„Danke, das ist ein Harnverhalt, typisch nach Spinalanästhesie, bei ihm mit der Prostata erst recht. Bitte einmal steril katheterisieren, keinen Dauerkatheter. Messen Sie die Menge und schicken Sie sie mir. Danach Bilanz, und in sechs Stunden noch einmal scannen.“',
  anordnungen: ['an-einmalkatheter', 'an-bilanz'], setzt: ['arzt-informiert'], auftraege: ['af-menge'],
};

export const KH_HARNVERHALT_POSTOP: FallV2 = {
  schema: 2,
  id: 'kh-harnverhalt-postop',
  version: '0.1.0',
  spur: 'A',
  setting: 'krankenhaus',
  altersgruppe: 'hochbetagt',
  titel: '„Es tröpfelt nur“',
  kurz: 'Chirurgie, Spätdienst: Ein 76-jähriger Patient hat seit der Leisten-OP am Vormittag nicht Wasser gelassen. Das Laken ist feucht.',
  rahmen: 'Du bist im Spätdienst auf der chirurgischen Station und betreust Herrn Kraus, operiert heute um 10:30 Uhr. Deine Praxisanleiterin ist auf Station und kommt, wenn du sie rufst.',
  lernziele: [
    'Harnverhalt nach der OP erkennen: Zeit seit der letzten Miktion, Unterbauch, Unruhe, Harnträufeln.',
    'Überlaufinkontinenz von „Inkontinenz nach der Narkose“ unterscheiden und nicht mit einer Vorlage zudecken.',
    'Erst nicht-invasiv helfen (Intimsphäre, im Stehen, Wasser laufen lassen), dann die Blasenfüllung mit dem Blasenscanner messen.',
    'Strukturiert melden, Einmalkatheterisierung nach Anordnung unterstützen, Menge und Bilanz zurückmelden.',
  ],
  lehrplan: {
    ce: ['ce.02', 'ce.05'], abschnitt: ['ad12'],
    themen: ['thema.ph.ausscheidung', 'thema.ph.periop', 'thema.ph.hygiene', 'thema.beo.vitalzeichen', 'thema.pro.delir'],
    kompetenzen: ['I.1.d', 'I.2.a', 'II.1.a', 'III.1.d'],
  },
  geeignet: { rollen: [1, 2], stufen: [1, 2, 3] },
  dauerMin: [10, 15],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Schwelle für Katheterisierung (Blasenscan, Symptome) gegen Klinikstandard und S2k-Leitlinie Harnverhalt prüfen',
      'Einmalkatheter vor Dauerkatheter: KRINKO-Empfehlung Prävention katheterassoziierter Harnwegsinfektionen (2015)',
      'Befugnis: Einmalkatheter im 1. Drittel nur Assistenz, im 2. Drittel mit Anleitung (Katalog blasenkatheter-legen)',
      'Überlaufinkontinenz und Expertenstandard Kontinenzförderung (2024): Formulierung prüfen',
    ],
  },
  quellen: [
    { id: 'dnqp-kontinenz', titel: 'DNQP: Expertenstandard Kontinenzförderung in der Pflege (2024)' },
    { id: 'krinko-cauti', titel: 'KRINKO: Prävention und Kontrolle katheterassoziierter Harnwegsinfektionen (Bundesgesundheitsblatt 2015)' },
    { id: 'lehrplan-ce02', titel: 'Landeslehrplan BW 3BFP, CE 02 Zu pflegende Menschen in der Bewegung und Selbstversorgung unterstützen' },
  ],

  person: {
    name: 'Herr Kraus',
    alter: { jahre: 76 },
    geschlecht: 'm',
    biografie: ['pensionierter Busfahrer', 'lebt mit seiner Frau im eigenen Haus', 'spricht ungern über „so was“'],
    diagnosenBekannt: ['Leistenhernie rechts, heute operiert (Netzplastik, Spinalanästhesie)', 'benigne Prostatahyperplasie', 'arterielle Hypertonie'],
    medikamentePlan: ['Tamsulosin 0,4 mg 0-0-1', 'Amlodipin 5 mg 1-0-0'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Brille'],
    gewichtKg: 82,
  },
  medien: { raum: '13_station_postop' },
  uebernahme: 'Herr Kraus, Zimmer 13, 76 Jahre, Leistenhernie rechts, heute 10:30 operiert in Spinalanästhesie. Kreislauf stabil, Wunde trocken, Schmerz NRS 2 um 15 Uhr. Er war seit der OP noch nicht auf Toilette, sagt aber, er muss nicht. Infusion ist durch.',
  startUhrzeit: '17:30',

  start: {
    // Seit 7 h kein Wasserlassen: Blase prall gefüllt, Harnträufeln; Schmerz und Unruhe steigen mit dem Harnverhalt
    grund: { blaseMl: 610, schmerz: 4, unruhe: 0.45, angst: 0.35, hydratation: 0.95 },
    treiber: [{ art: 'harnverhalt' }, { art: 'delir_trigger', ausloeser: ['harnverhalt'] }],
    bild: { haltung: 'liegt', haut: 'rosig', mimik: 'schmerz' },
    sichtbar: [],
    anordnungen: ['an-plan'],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'beschwerden-erfragen', 'trinkmenge-erfragen',
    // Beobachten
    'schmerz-nrs', 'urin-beobachten', 'blase-tasten', 'delir-screening-4at', 'haut-beobachten',
    // Messen
    'kurve-lesen', 'rr-messen', 'puls-zaehlen', 'blasenscan', 'bilanz-fuehren',
    // Versorgen
    'haendedesinfektion', 'privatsphaere-wahren', 'miktion-foerdern', 'vorlage-anlegen', 'katheter-assistieren', 'einmalkatheter', 'trinken-anbieten',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht', 'pflegeplanung-anpassen',
  ],
  massnahmenZusatz: [
    aus('urin-beobachten', { name: 'Bett, Laken und Urinflasche ansehen' }),
    aus('blasenkatheter-legen', { id: 'einmalkatheter', name: 'Einmalkatheterisierung (steril) selbst durchführen', setzt: ['katheterisiert'], beendet: ['harnverhalt'], wirkung: [...ERLEICHTERUNG] }),
    {
      id: 'katheter-assistieren', name: 'Einmalkatheterisierung vorbereiten und der Pflegefachperson assistieren', reiter: 'versorgen', spur: 'A', zeitbedarfSekunden: 600,
      anordnungspflichtig: true, befugnis: ALLE, setzt: ['katheterisiert'], beendet: ['harnverhalt'], wirkung: [...ERLEICHTERUNG], kompetenzbereiche: ['I', 'III'],
    },
    {
      id: 'blase-tasten', name: 'Unterbauch ansehen und vorsichtig tasten', reiter: 'beobachten', spur: 'A', zeitbedarfSekunden: 30,
      befugnis: ALLE, kompetenzbereiche: ['I'],
    },
    {
      id: 'blasenscan', name: 'Blasenfüllung mit dem Ultraschall-Blasenscanner messen', reiter: 'messen', spur: 'A', zeitbedarfSekunden: 90,
      befugnis: { 1: 'mit-anleitung', 2: 'selbst', 3: 'selbst', pflegefachperson: 'selbst' }, kompetenzbereiche: ['I'],
    },
    {
      id: 'miktion-foerdern', name: 'Wasserlassen erleichtern: Sichtschutz, im Stehen an der Bettkante, Wasser laufen lassen, Zeit geben', reiter: 'versorgen', spur: 'A', zeitbedarfSekunden: 300,
      befugnis: ALLE, setzt: ['miktion-versucht'], kompetenzbereiche: ['I', 'II'],
    },
    {
      id: 'vorlage-anlegen', name: 'Inkontinenzvorlage anlegen', reiter: 'versorgen', spur: 'A', zeitbedarfSekunden: 120,
      befugnis: ALLE, setzt: ['vorlage'], kompetenzbereiche: ['I'],
    },
  ],

  akte: {
    aufnahmegrund: 'Elektive Operation einer Leistenhernie rechts (offene Netzplastik nach Lichtenstein), heute 10:30–11:20 in Spinalanästhesie.',
    anamnese: [
      'Prostatavergrößerung seit Jahren, nachts zweimal Wasserlassen, schwacher Strahl.',
      'Letzte Miktion heute 07:00 vor der OP.',
      'Perioperativ 1.500 ml Ringer-Lösung.',
      'Mobilisation an der Bettkante um 16 Uhr ohne Probleme.',
    ],
    diagnosen: [
      { text: 'Leistenhernie rechts, operiert', icd: 'K40.90', seit: 'heute' },
      { text: 'Benigne Prostatahyperplasie', icd: 'N40', seit: '2016' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2010' },
    ],
    medikation: [
      { id: 'mp-tamsulosin', wirkstoff: 'Tamsulosin', staerke: '0,4 mg', form: 'Kps.', schema: '0-0-1-0', zuletzt: 'gestern 20:00', hinweis: 'Nach dem Abendessen.' },
      { id: 'mp-amlodipin', wirkstoff: 'Amlodipin', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'heute 06:30' },
      { id: 'mp-metamizol', wirkstoff: 'Metamizol', staerke: '500 mg', form: 'Tbl.', schema: '1-1-1-1', zuletzt: 'heute 14:00', hinweis: 'Schmerztherapie nach OP-Standard.' },
    ],
    vorwerte: [
      { zeit: 'heute 12:00 (Aufwachraum)', vorH: 5.5, werte: { rrSys: 132, rrDia: 78, hf: 72, spo2: 96, schmerz: 1 }, kuerzel: 'AWR' },
      { zeit: 'heute 15:00', vorH: 2.5, werte: { rrSys: 138, rrDia: 82, hf: 78, schmerz: 2 }, kuerzel: 'LM' },
    ],
    pflegebericht: [
      { zeit: 'heute 12:30', wer: 'LM (Frühdienst)', text: 'Aus dem Aufwachraum übernommen. Beine wieder voll beweglich. Wunde trocken.' },
      { zeit: 'heute 16:00', wer: 'LM (Frühdienst)', text: 'An der Bettkante mobilisiert, kreislaufstabil. Urinflasche angeboten, „muss nicht“.' },
    ],
    assessments: [
      { name: 'Sturzrisiko', wert: 'erhöht', datum: 'heute', hinweis: 'Spinalanästhesie, erster Tag nach OP.' },
    ],
    pflegeplanung: [
      { problem: 'Postoperativ: Schmerz, Mobilität, Ausscheidung', ziel: 'Wasserlassen spätestens 6–8 h nach der OP', massnahmen: ['Urinflasche anbieten', 'Miktion dokumentieren', 'bei Bedarf Blasenscan'] },
    ],
  },

  befunde: [
    { massnahme: 'haendedesinfektion', varianten: [{ text: 'Du desinfizierst die Hände, 30 Sekunden.' }] },
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Du stellst dich vor. Herr Kraus rutscht im Bett hin und her: „Gut, dass Sie kommen. Mir ist so komisch im Bauch.“' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: '„Ich muss dauernd, aber es kommt nichts. Nur ein bisschen, das geht dann ins Bett. Das ist mir so peinlich.“ Er zeigt auf den Unterbauch.' }] },
    { massnahme: 'trinkmenge-erfragen', varianten: [{ text: '„Seit Mittag zwei Becher Tee und Wasser. Und die Infusion.“' }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Letzte Miktion heute 07:00, seitdem keine dokumentiert. Perioperativ 1.500 ml Infusion. Pflegeplanung: Wasserlassen spätestens 6–8 h nach der OP, bei Bedarf Blasenscan. Prostatavergrößerung bekannt.' }] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'Unterbauch NRS {schmerz}, drückend. Die Wunde selbst tut kaum weh.' }] },
    { massnahme: 'urin-beobachten', varianten: [
      { wenn: { flag: 'katheterisiert' }, text: 'Im Messbecher klarer, hellgelber Urin. Das Bett ist trocken.' },
      { text: 'Das Laken unter ihm ist feucht, immer wieder tröpfelt etwas Urin nach. Die Urinflasche ist leer. Kein richtiger Strahl seit der OP.' },
    ] },
    { massnahme: 'blase-tasten', varianten: [
      { wenn: { flag: 'katheterisiert' }, text: 'Unterbauch weich, keine Vorwölbung mehr.' },
      { text: 'Über dem Schambein eine pralle, druckempfindliche Vorwölbung. Er stöhnt beim Tasten.' },
    ] },
    { massnahme: 'blasenscan', varianten: [{ text: 'Blasenscanner: {blaseMl} ml in der Blase.', zeigt: ['blaseMl'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg, Puls {hf}/min.', zeigt: ['rrSys', 'rrDia', 'hf'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig.', zeigt: ['hf'] }] },
    { massnahme: 'delir-screening-4at', varianten: [{ text: '4AT: wach (0), AMT4 richtig (0), Monate rückwärts richtig (0), keine akute Veränderung (0) = 0 Punkte. Kein Delir, aber unruhig.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Haut warm, leicht schwitzig. Leistenverband trocken.' }] },
    { massnahme: 'privatsphaere-wahren', varianten: [{ text: 'Du ziehst den Vorhang zum Nachbarbett zu und schließt die Tür.' }] },
    { massnahme: 'miktion-foerdern', varianten: [{ text: 'Er steht mit deiner Hilfe an der Bettkante, du lässt am Waschbecken Wasser laufen und gehst kurz hinaus. Nach fünf Minuten: „Nur ein paar Tropfen. Es geht einfach nicht.“' }] },
    { massnahme: 'vorlage-anlegen', varianten: [{ text: 'Du legst eine Vorlage an. Herr Kraus schaut weg. Das Drücken im Bauch bleibt.' }] },
    { massnahme: 'katheter-assistieren', varianten: [{ text: 'Du richtest das sterile Katheterset, Pflegefachmann Jonas katheterisiert mit Gleitmittel und Lokalanästhetikum. Du hältst den Messbecher: Es läuft deutlich mehr als ein halber Liter klarer Urin ab. Herr Kraus atmet hörbar aus: „Oh, ist das eine Erleichterung.“' }] },
    { massnahme: 'einmalkatheter', varianten: [{ text: 'Unter Anleitung katheterisierst du steril. Es läuft deutlich mehr als ein halber Liter klarer Urin ab. Herr Kraus atmet hörbar aus.' }] },
    { massnahme: 'bilanz-fuehren', varianten: [{ text: 'Einfuhr seit 07:00: 1.500 ml Infusion, 500 ml Tee und Wasser. Ausfuhr bis jetzt nur der Katheterurin. Bilanzbogen angelegt.' }] },
    { massnahme: 'trinken-anbieten', varianten: [{ text: 'Du stellst ihm Wasser hin. „Später, erst muss das raus.“' }] },
  ],

  gespraech: [
    { id: 'g-scham', frage: 'Ohne Wertung erklären, dass das Tröpfeln von einer zu vollen Blase kommen kann', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: '„Also bin ich nicht inkontinent? Da bin ich aber froh.“', setzt: ['scham-genommen'] }],
      wirkung: [{ groesse: 'angst', delta: -0.15, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] },
    { id: 'g-katheter-erklaeren', frage: 'Den Einmalkatheter erklären und sein Einverständnis einholen', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { flag: 'arzt-informiert' },
      antwort: [{ text: '„Wenn’s hilft, ja. Hauptsache, der Druck ist weg. Aber bitte nicht so viele Leute im Zimmer.“', setzt: ['eingewilligt'] }] },
    { id: 'g-jonas', frage: 'Pflegefachmann Jonas bitten, den Einmalkatheter zu legen', an: 'kollegin', kompetenzbereiche: ['III'],
      nurWenn: { flag: 'arzt-informiert' },
      antwort: [{ text: 'Jonas: „Mach ich. Richte schon mal das Set, ich komme in zwei Minuten.“', setzt: ['jonas-kommt'] }] },
  ],

  sbar: [
    { id: 's-kein-urin', teil: 'S', text: 'Herr Kraus, 76, Zimmer 13, Leistenhernien-OP heute 10:30 in Spinalanästhesie: seit der OP kein Wasserlassen, Druck im Unterbauch, es tröpfelt nur.', art: 'kern' },
    { id: 's-inkontinent', teil: 'S', text: 'Herr Kraus ist seit der OP inkontinent.', art: 'falsch' },
    { id: 'b-prostata', teil: 'B', text: 'Bekannte Prostatavergrößerung, nimmt Tamsulosin. 1.500 ml Infusion während der OP, letzte Miktion 07:00.', art: 'kern' },
    { id: 'b-busfahrer', teil: 'B', text: 'Er war Busfahrer.', art: 'ablenker' },
    { id: 'a-blasenscan', teil: 'A', text: 'Blasenscan deutlich über 500 ml, Blase über dem Schambein tastbar.', art: 'kern', bekanntWenn: { getan: 'blasenscan' } },
    { id: 'a-miktion', teil: 'A', text: 'Im Stehen mit Wasser laufen lassen nur wenige Tropfen.', art: 'hilfreich', bekanntWenn: { flag: 'miktion-versucht' } },
    { id: 'a-menge', teil: 'A', text: 'Über den Einmalkatheter mehr als 500 ml klarer Urin, danach deutlich weniger Druck.', art: 'kern', bekanntWenn: { flag: 'katheterisiert' } },
    { id: 'r-katheter', teil: 'R', text: 'Bitte ordnen Sie eine Einmalkatheterisierung an.', art: 'kern' },
    { id: 'r-abwarten', teil: 'R', text: 'Sollen wir bis heute Nacht abwarten?', art: 'falsch' },
  ],

  anordnungen: [
    { id: 'an-plan', massnahme: 'tabletten-wie-geplant-geben', text: 'Medikationsplan: Metamizol 500 mg 1-1-1-1, Amlodipin 5 mg morgens, Tamsulosin abends.' },
    { id: 'an-einmalkatheter', massnahme: 'einmalkatheter', auchFuer: ['katheter-assistieren'], text: 'Einmalkatheterisierung steril, Menge messen und melden. Kein Dauerkatheter.' },
    { id: 'an-bilanz', massnahme: 'bilanz-fuehren', text: 'Ein- und Ausfuhr bilanzieren, Blasenscan in 6 Stunden.' },
  ],

  arzt: {
    name: 'Stationsarzt Dr. Neumann',
    erreichbar: 'telefon',
    regeln: [
      REGEL_VOLL,
      { id: 'r-scanfrage', wenn: { gemeldet: ['s-kein-urin'] },
        antwort: '„Seit sieben Uhr nichts? Das klingt nach Harnverhalt.“',
        rueckfrage: { text: '„Wie voll ist die Blase? Scannen Sie bitte und schicken Sie mir den Wert.“', erwartet: ['a-blasenscan'], auftrag: 'af-scan' } },
      { wenn: { eine: [{ gemeldet: ['s-inkontinent'] }, { gemeldet: ['r-abwarten'] }] },
        antwort: '„Dann machen Sie ihm eine Vorlage, ich schaue nachher vorbei.“', setzt: ['arzt-vertroestet'] },
    ],
    auftraege: [
      { id: 'af-scan', text: 'Blasenscan machen und dem Stationsarzt schicken', erledigt: { getan: 'blasenscan' }, meldung: ['a-blasenscan'], meldenBinnenSek: 600,
        folge: [{ ...REGEL_VOLL, wenn: { ab: 0 } }] },
      { id: 'af-menge', text: 'Katheterurin-Menge messen und dem Stationsarzt melden', erledigt: { flag: 'katheterisiert' }, meldung: ['a-menge'], meldenBinnenSek: 1500,
        folge: [{ wenn: { ab: 0 }, antwort: '„Danke. Tamsulosin heute Abend wie geplant. Wenn er bis Mitternacht nicht spontan kann, wieder scannen und melden.“', setzt: ['menge-rueckmeldung'] }] },
    ],
  },

  team: { kollegin: 'Pflegefachmann Jonas' },

  ereignisse: [
    { id: 'e-vorlage', art: 'team', wann: { ab: KOLLEGE_KOMMT },
      text: 'Kollege Tim schaut herein: „Bett nass? Der ist nach der Narkose halt inkontinent. Mach ihm eine Vorlage drunter, dann ist Ruhe.“',
      entscheidung: [
        { id: 'w-ueberlauf', text: 'Erklären, dass es eine Überlaufblase sein kann, und erst die Blase prüfen', wertung: 'gut', setzt: ['ueberlauf-bedacht'],
          warum: 'Tröpfeln bei voller Blase ist eine Überlaufinkontinenz. Eine Vorlage würde den Harnverhalt verdecken.' },
        { id: 'w-beides', text: 'Vorlage drunter und trotzdem die Blase prüfen', wertung: 'vertretbar',
          warum: 'Schützt das Bett, aber zuerst kommt die Ursache. Die Vorlage darf den Blick nicht ersetzen.' },
        { id: 'w-nur-vorlage', text: 'Vorlage anlegen, er ist eben inkontinent', wertung: 'gefaehrlich', setzt: ['nur-vorlage'],
          warum: 'Der Harnverhalt bleibt unbemerkt, die Blase dehnt sich weiter, Schmerz und Delirgefahr steigen.' },
      ] },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Yıldız',
    hilfen: [
      { wenn: { nicht: { getan: 'kurve-lesen' } }, impuls: 'Wann hat er zuletzt Wasser gelassen?', tipp: 'Schau in die Kurve: Seit der OP-Vorbereitung ist nichts dokumentiert.' },
      { wenn: { nicht: { getan: 'blasenscan' } }, impuls: 'Wie findest du heraus, wie voll die Blase ist?', tipp: 'Unterbauch tasten und mit dem Blasenscanner messen.' },
      { wenn: { auftrag: 'af-scan', status: 'offen' }, impuls: 'Was wollte der Arzt noch wissen?', tipp: 'Den Wert vom Blasenscan. Scanne und schick ihn ihm.' },
      { wenn: { nicht: { flag: 'miktion-versucht' } }, impuls: 'Was kannst du selbst tun, damit er Wasser lassen kann?', tipp: 'Sichtschutz, im Stehen an der Bettkante, Wasser laufen lassen und ihm Zeit geben.' },
      { wenn: { nicht: { flag: 'katheterisiert' } }, impuls: 'Wer darf den Einmalkatheter legen, und was ist dein Teil?', tipp: 'Nach Anordnung: Im 1. Drittel richtest du und assistierst, im 2. Drittel mit Anleitung.' },
      { impuls: 'Was zeigt dir, dass es geholfen hat?', tipp: 'Menge messen, Unterbauch tasten, Schmerz erneut erfragen, Bilanz führen.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-haende', text: 'Hände vor dem Kontakt desinfiziert', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'haendedesinfektion' }, warum: 'Vor jeder Pflegehandlung, vor dem Katheter erst recht.' },
      { id: 'p-letzte-miktion', text: 'Letzte Miktion in der Kurve nachgesehen', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'kurve-lesen' },
        warum: 'Mehr als 6–8 Stunden ohne Wasserlassen nach der OP ist ein Warnzeichen.' },
      { id: 'p-tasten', text: 'Unterbauch getastet', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'blase-tasten' }, warum: 'Eine pralle Vorwölbung über dem Schambein spricht für eine volle Blase.' },
      { id: 'p-scan', text: 'Blasenfüllung gemessen (Blasenscan)', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: { getan: 'blasenscan' },
        warum: 'Der Blasenscan macht aus einer Vermutung einen Befund und entscheidet über den Katheter.' },
      { id: 'p-miktion', text: 'Wasserlassen zuerst ohne Katheter erleichtert', gewicht: 2, kompetenzbereiche: ['I', 'II'], erfuellt: { flag: 'miktion-versucht' },
        warum: 'Sichtschutz, aufrechte Haltung und Zeit reichen manchmal schon. Jeder Katheter ist ein Infektionsrisiko.' },
      { id: 'p-intim', text: 'Intimsphäre geschützt', gewicht: 1, kompetenzbereiche: ['I', 'II'], erfuellt: { getan: 'privatsphaere-wahren' },
        warum: 'Er schämt sich. Mit Zuschauern klappt Wasserlassen noch schlechter.' },
      { id: 'p-scham', text: 'Tröpfeln ohne Wertung erklärt', gewicht: 1, kompetenzbereiche: ['II'], erfuellt: { flag: 'scham-genommen' },
        warum: 'Er hält sich für inkontinent. Die Erklärung nimmt Scham und Angst.' },
      { id: 'p-arzt', text: 'Stationsarzt strukturiert informiert', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Der Katheter braucht eine Anordnung.' },
      { id: 'p-einwilligung', text: 'Katheter erklärt, Einwilligung eingeholt', gewicht: 1, kompetenzbereiche: ['II', 'IV'], erfuellt: { flag: 'eingewilligt' },
        warum: 'Auch eine angeordnete Maßnahme braucht sein Einverständnis.' },
      { id: 'p-entlastet', text: 'Blase entlastet (Einmalkatheter nach Anordnung)', gewicht: 3, kompetenzbereiche: ['I', 'III'], erfuellt: { flag: 'katheterisiert' },
        warum: 'Eine überdehnte Blase schädigt den Blasenmuskel und kann bei Älteren ein Delir auslösen.' },
      { id: 'p-rueckauftrag', text: 'Menge gemessen und gemeldet', gewicht: 1, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-menge', status: 'gemeldet' },
        warum: 'Die Menge zeigt, wie ausgeprägt der Verhalt war, und bestimmt das weitere Vorgehen.' },
      { id: 'p-bilanz', text: 'Bilanz begonnen', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'bilanz-fuehren' }, warum: 'Ein- und Ausfuhr zeigen, ob er wieder selbst ausscheidet.' },
      { id: 'p-doku', text: 'Miktion, Scan und Katheter dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'], erfuellt: { dokumentiert: 'a-menge' },
        warum: 'Damit der Nachtdienst weiß, wann er wieder scannen muss.' },
    ],
    fehler: [
      { id: 'f-nur-vorlage', text: 'Tröpfeln mit einer Vorlage versorgt, Blase nicht geprüft', schwere: 'schwer', kompetenzbereiche: ['I'],
        // Vorlage zum Schutz ist in Ordnung, solange die Blase danach noch geprüft wird (vgl. Entscheidung w-beides)
        wenn: { eine: [{ flag: 'nur-vorlage' }, { alle: [{ getan: 'vorlage-anlegen' }, { nicht: { getan: 'blasenscan' } }, { ab: 900 }] }] },
        warum: 'Eine Überlaufinkontinenz bei Harnverhalt wird mit einer Vorlage verdeckt. Die Blase dehnt sich weiter.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'katheterisiert' }, { flag: 'menge-rueckmeldung' }, { getan: 'bilanz-fuehren' }] },
        text: 'Herr Kraus liegt entspannt im trockenen Bett. Der Bilanzbogen liegt am Bett, der Nachtdienst scannt um Mitternacht.', ausgang: 'stabil' },
      { wenn: { ab: 2700 }, text: 'Die Schicht ist halb um. Herr Kraus ist unruhig, zieht am Verband und weiß nicht mehr genau, wo er ist.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-harnverhalt', text: 'Harnverhalt nach Spinalanästhesie bei Prostatavergrößerung', richtig: true, prioritaet: 1, warum: 'Die volle Blase verursacht Schmerz, Unruhe und Tröpfeln.' },
      { id: 'pb-scham', text: 'Scham wegen des nassen Bettes', richtig: true, prioritaet: 2, warum: 'Erschwert das Wasserlassen und das Gespräch.' },
      { id: 'pb-delir', text: 'Delirgefahr (Alter, OP, volle Blase)', richtig: true, prioritaet: 2, warum: 'Ein Harnverhalt ist ein häufiger Delir-Auslöser bei Älteren.' },
      { id: 'pb-infekt', text: 'Infektionsgefahr durch Katheterisierung', richtig: true, prioritaet: 3, warum: 'Darum steril, so selten wie möglich und kein Dauerkatheter ohne Grund.' },
      { id: 'pb-inkontinenz', text: 'Harninkontinenz nach Narkose', richtig: false, warum: 'Das Tröpfeln ist eine Überlaufinkontinenz, die Ursache ist der Harnverhalt.' },
    ],
    ziele: [
      { id: 'z-spontan', text: 'Herr Kraus lässt bis morgen früh spontan Wasser, Restharn im Scan unter 100 ml.', passtZu: ['pb-harnverhalt'], richtig: true },
      { id: 'z-scham', text: 'Herr Kraus kann sagen, wenn er Druck spürt, und nutzt die Urinflasche hinter dem Vorhang.', passtZu: ['pb-scham'], richtig: true },
      { id: 'z-orientiert', text: 'Herr Kraus bleibt orientiert.', passtZu: ['pb-delir'], richtig: true },
      { id: 'z-trocken-vorlage', text: 'Herr Kraus ist mit Vorlage trocken.', passtZu: ['pb-inkontinenz'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Harnverhalt nach der OP', text: 'Spinalanästhesie, Opioide, viel Infusion und eine große Prostata machen einen Harnverhalt wahrscheinlich. Warnzeichen: kein Wasserlassen 6–8 h nach der OP, Druck im Unterbauch, Unruhe, häufiger Drang mit wenig Urin.', quellen: ['dnqp-kontinenz'] },
    { titel: 'Überlaufinkontinenz', text: 'Wenn die Blase übervoll ist, tröpfelt Urin ständig nach. Das sieht aus wie Inkontinenz, ist aber ein Harnverhalt. Erst die Blase prüfen (tasten, Blasenscan), dann handeln.', quellen: ['dnqp-kontinenz'] },
    { titel: 'Erst nicht-invasiv', text: 'Sichtschutz, Männer möglichst im Stehen, Wasser laufen lassen, warmes Wasser über den Damm, Zeit geben. Hilft das nicht, nach Anordnung einmal steril katheterisieren.', quellen: ['krinko-cauti'] },
    { titel: 'Einmal statt dauerhaft', text: 'Ein Einmalkatheter ist bei postoperativem Harnverhalt meist besser als ein Dauerkatheter: weniger Infektionen. Menge messen, dokumentieren, Bilanz führen und nach einigen Stunden erneut scannen.', quellen: ['krinko-cauti'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'haendedesinfektion' },
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'beschwerden-erfragen' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'massnahme', id: 'urin-beobachten' },
      { art: 'massnahme', id: 'blase-tasten' },
      { art: 'frage', id: 'g-scham' },
      { art: 'massnahme', id: 'privatsphaere-wahren' },
      { art: 'massnahme', id: 'miktion-foerdern' },
      { art: 'massnahme', id: 'blasenscan' },
      { art: 'massnahme', id: 'schmerz-nrs' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-kein-urin', 'b-prostata', 'a-blasenscan', 'a-miktion', 'r-katheter'] },
      { art: 'rueckmelden', anordnung: 'an-einmalkatheter', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-bilanz', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'frage', id: 'g-katheter-erklaeren' },
      { art: 'frage', id: 'g-jonas' },
      { art: 'massnahme', id: 'haendedesinfektion' },
      { art: 'massnahme', id: 'katheter-assistieren' },
      { art: 'massnahme', id: 'blase-tasten' },
      { art: 'massnahme', id: 'bilanz-fuehren' },
      { art: 'dokumentieren', bausteine: ['a-blasenscan', 'a-menge', 'massnahme:katheter-assistieren'], freitext: 'Seit 07:00 keine Miktion, Harnträufeln (Überlauf). Miktion im Stehen erfolglos. Einmalkatheter nach Anordnung, Bilanz begonnen, Scan um Mitternacht.' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['a-menge'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-harnverhalt', 'pb-scham', 'pb-delir', 'pb-infekt'], ziele: ['z-spontan', 'z-scham', 'z-orientiert'],
        sbar: ['s-kein-urin', 'b-prostata', 'a-blasenscan'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'schmerz', vergleich: '>=', grenze: 5.3 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'einmalkatheter' }], erwartet: 'pa-eingriff' },
  },
};
