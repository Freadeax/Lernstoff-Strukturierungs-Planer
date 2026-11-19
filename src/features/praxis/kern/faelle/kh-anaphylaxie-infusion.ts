// Fallwelle P16a (CE05 Patientensicherheit) · Krankenhaus, Innere: Anaphylaxie bei der ersten Antibiotika-Kurzinfusion
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Neu geschrieben aus Altfall „anaphylaxie“ (scenarios.json).
// Modell: Treiber anaphylaxie (P16a), Adrenalin i. m. über G1 (durch die Ärztin, Ereignis).

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const ATMUNG_ERHOBEN: Bedingung = { eine: [{ getan: 'af-zaehlen' }, { getan: 'atmung-beobachten' }, { getan: 'atemgeraeusche-hoeren' }] };
const RR_BEKANNT: Bedingung = { eine: [{ getan: 'rr-messen' }, { getan: 'monitor-anlegen' }] };
const HAUT_GESEHEN: Bedingung = { eine: [{ getan: 'haut-beobachten' }, { getan: 'ersteindruck-abcde' }] };
/** Die Ärztin gibt Adrenalin i. m., sobald sie da ist (Ereignis e-aerztin-da, gleiche Bedingung). */
const ADRENALIN_DA: Bedingung = { alle: [{ flag: 'arzt-kommt' }, { eine: [{ getan: 'notfallmedikament-vorbereiten' }, { ab: 600 }] }] };

const ANAPHYLAXIE_ANTWORT = '„Das ist eine Anaphylaxie. Infusion bleibt aus, Zugang offen lassen. Ich komme sofort und alarmiere das Notfallteam. Legen Sie mir Adrenalin 0,5 mg zur i. m.-Gabe aus dem Notfallwagen bereit, Sauerstoff über die Maske, 500 ml Vollelektrolyt im Schuss. Wenn ihr schwindelig wird, flach mit Beinen hoch; wenn die Luftnot führt, Oberkörper hoch. Und nicht allein lassen.“';
const ANAPHYLAXIE_REGEL: ArztRegel = {
  id: 'r-anaphylaxie', wenn: { gemeldet: ['s-reaktion', 'a-atmung'] }, antwort: ANAPHYLAXIE_ANTWORT,
  anordnungen: ['an-adrenalin', 'an-o2', 'an-infusion'], kommtNachSek: 120, setzt: ['arzt-kommt'], auftraege: ['af-nach-adrenalin'],
};

export const KH_ANAPHYLAXIE_INFUSION: FallV2 = {
  schema: 2,
  id: 'kh-anaphylaxie-infusion',
  version: '0.1.0',
  spur: 'A',
  setting: 'krankenhaus',
  altersgruppe: 'erwachsen',
  titel: '„Mein Hals wird so eng“',
  kurz: 'Innere Station: 34-Jährige bekommt die erste Antibiotika-Infusion, kratzt sich, Quaddeln, Luftnot, der Blutdruck fällt.',
  rahmen: 'Du arbeitest mit deiner Praxisanleiterin im Spätdienst. Frau Kaya klingelt zehn Minuten nach dem Anhängen ihrer ersten Antibiotika-Kurzinfusion.',
  lernziele: [
    'Eine Anaphylaxie früh erkennen: Haut, Atmung, Kreislauf nach Gabe eines neuen Arzneimittels.',
    'Den Auslöser sofort stoppen, Zugang offen halten und Hilfe rufen, ohne die Patientin allein zu lassen.',
    'Nach Atmung und Kreislauf lagern; nicht aufstehen lassen.',
    'Notfallmedikament nach Anordnung vorbereiten, Wirkung kontrollieren und melden (Closed Loop).',
    'Patientensicherheit: Unverträglichkeit dokumentieren, Allergie kennzeichnen und ein erneutes Anhängen des Auslösers hinterfragen.',
  ],
  lehrplan: {
    ce: ['ce.05'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.ph.medikamente', 'thema.beo.notfall', 'thema.beo.haut', 'thema.beo.vitalzeichen', 'thema.kl.infektion', 'thema.re.schweigepflicht'],
    kompetenzen: ['I.2.a', 'I.2.b', 'II.1.d', 'III.2.b', 'III.2.c', 'IV.1.a'],
  },
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Ablauf gegen S2k-Leitlinie Anaphylaxie (AWMF 061-025) prüfen: Auslöser stoppen, Hilfe, Lagerung nach Leitsymptom, Adrenalin i. m. 0,5 mg (Erwachsene), O₂, Volumen',
      'Befugnis: Adrenalin bereitlegen 1. Drittel gesperrt, 2./3. Drittel mit Anleitung; i. m.-Gabe durch Ärztin/Notfallteam bzw. nach Notfallstandard der Einrichtung',
      'Remonstration „Infusion langsam wieder anhängen“ fachlich passend?',
      'Lernmodell: Start etwa HF 105–115, RR um 105 systolisch, AF über 22, Giemen; ohne Hilfe nach 25 Min. RR unter 90 (Test)',
      'Raumfoto 30_station_zimmer_frau zeigt junge Frau mit Infusion, passt; Quaddeln sind im Foto nicht zu sehen',
    ],
  },
  quellen: [
    { id: 's2k-anaphylaxie', titel: 'S2k-Leitlinie Akuttherapie und Management der Anaphylaxie (AWMF 061-025), Aktualisierung 2021', fundstelle: 'Algorithmus Akuttherapie, Lagerung, Adrenalin i. m.' },
    { id: 'erc-2025', titel: 'ERC Leitlinien Reanimation 2025, Kapitel Besondere Umstände: Anaphylaxie' },
    { id: 'fi-adrenalin', titel: 'Fachinformation Adrenalin (Fertigspritze i. m.)', fundstelle: 'Abschnitte 4.2, 4.8' },
    { id: 'aps-arzneimittel', titel: 'Aktionsbündnis Patientensicherheit: Arzneimitteltherapiesicherheit im Krankenhaus, Handlungsempfehlung 2017', fundstelle: 'Allergiedokumentation' },
  ],

  person: {
    name: 'Frau Kaya',
    alter: { jahre: 34 },
    geschlecht: 'w',
    biografie: ['Erzieherin in einer Kita', 'lebt mit Partner, zwei Kinder', 'Schwester Derya ist zu Besuch'],
    diagnosenBekannt: ['Erysipel Unterschenkel links (Aufnahme heute)'],
    medikamentePlan: ['Cefuroxim 1,5 g i. v. alle 8 h (erste Gabe 15:00)', 'Ibuprofen 400 mg bei Bedarf', 'Enoxaparin 40 mg s. c. abends'],
    allergien: ['keine bekannt'],
    gewichtKg: 64,
  },
  medien: {
    raum: '30_station_zimmer_frau',
    raumVarianten: [{ wenn: { getan: 'monitor-anlegen' }, raum: '30m_station_zimmer_frau_monitor_verbunden' }],
  },
  uebernahme: 'Frau Kaya, 34, heute mit einem Erysipel am linken Unterschenkel gekommen. Die erste Cefuroxim-Kurzinfusion hat Jonas um 15 Uhr angehängt, Allergien hat sie keine angegeben. Ihre Schwester ist zu Besuch. Sie hat gerade geklingelt.',
  startUhrzeit: '15:10',

  start: {
    // Anaphylaxie Grad II–III: Tonus sinkt, Bronchospasmus. Modell zu Beginn etwa HF 110, RR 105/60, AF 24, Giemen.
    grund: { gefaesstonus: 0.68, angst: 0.5, unruhe: 0.3, schmerz: 2, temperatur: 37.7, blutzucker: 104 },
    treiber: [{ art: 'anaphylaxie', staerke: 0.6 }],
    bild: { haltung: 'sitzt', haut: 'gerötet-heiss', mimik: 'angst' },
    flags: ['zugang-liegt', 'infusion-laeuft'],
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'ansprechen-orientierung', 'beschwerden-erfragen', 'beruhigen-zusprechen',
    // Beobachten
    'ersteindruck-abcde', 'haut-beobachten', 'atmung-beobachten', 'atemgeraeusche-hoeren', 'bewusstsein-avpu', 'rekap-pruefen', 'news2-berechnen',
    // Akut
    'infusion-stoppen', 'hilfe-holen', 'notfallteam-alarmieren', 'oberkoerper-hoch', 'flachlagern-beine-hoch', 'o2-geben', 'notfallmedikament-vorbereiten', 'adrenalin-im-selbst',
    // Messen
    'af-zaehlen', 'pulsoxy-anlegen', 'rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'kurve-lesen', 'monitor-anlegen', 'medikation-pruefen-6r',
    // Versorgen
    'infusion-anhaengen', 'infusion-ueberwachen', 'cefuroxim-wieder-anhaengen', 'ibuprofen-geben', 'wadenwickel',
    // Melden
    'allergie-kennzeichnen', 'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('rea-team-alarmieren', { id: 'notfallteam-alarmieren', name: 'Innerklinisches Notfallteam alarmieren (Notruf der Klinik)', setzt: ['notfallteam-gerufen'] }),
    aus('infusion-stoppen', { name: 'Antibiotika-Infusion sofort stoppen, abhängen, Zugang belassen' }),
    aus('o2-geben', { name: 'Sauerstoff über Maske mit Reservoir, hoch dosiert (nach Anordnung/Notfallstandard)',
      wirkung: [{ groesse: 'sauerstoff', delta: 10, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] }),
    aus('oberkoerper-hoch', { name: 'Oberkörper hoch, Beine tief (Atemnot führt)',
      wirkung: [{ groesse: 'atemarbeit', delta: -0.15, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] }),
    aus('flachlagern-beine-hoch', { name: 'Flach lagern, Beine hoch (Kreislauf führt)',
      wirkung: [{ groesse: 'volumen', delta: 0.05, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] }),
    aus('notfallmedikament-vorbereiten', { name: 'Adrenalin 0,5 mg zur i. m.-Gabe aus dem Notfallwagen bereitlegen (Closed Loop)', setzt: ['adrenalin-bereit'] }),
    aus('iv-medikament-geben', { id: 'adrenalin-im-selbst', name: 'Adrenalin 0,5 mg i. m. selbst in den Oberschenkel geben',
      treiber: [{ art: 'wirkstoff', id: 'adrenalin', dosisMg: 0.5, weg: 'im' }] }),
    aus('infusion-anhaengen', {
      name: 'Infusion anhängen: 500 ml Vollelektrolyt im Schuss (nach Anordnung)', setzt: ['infusion-laeuft', 'volumen-laeuft'],
      wirkung: [{ groesse: 'volumen', delta: 0.1, beginnSek: 0, spitzeSek: 600, dauerSek: 'dauerhaft' }],
    }),
    aus('infusion-anhaengen', { id: 'cefuroxim-wieder-anhaengen', name: 'Cefuroxim-Kurzinfusion langsam wieder anhängen', setzt: ['ausloeser-wieder'],
      treiber: [{ art: 'anaphylaxie', staerke: 1 }] }),
    aus('bedarfsmedikation-oral', { id: 'ibuprofen-geben', name: 'Ibuprofen 400 mg oral (Bedarfsplan)', treiber: [{ art: 'wirkstoff', id: 'ibuprofen', dosisMg: 400, weg: 'oral' }] }),
  ],

  akte: {
    aufnahmegrund: 'Aufnahme heute 11:30 über die Notaufnahme mit Erysipel Unterschenkel links seit 2 Tagen, Fieber bis 38,6 °C. Ambulant keine Antibiotika. Stationär Cefuroxim i. v.',
    anamnese: [
      'Kleine Verletzung beim Gärtnern, seit 2 Tagen Rötung und Schwellung bis zum Knie.',
      'Allergien: keine bekannt. Hat „früher mal Penicillin-Saft“ als Kind bekommen, Reaktion erinnert sie nicht.',
      'Asthma als Kind, seit Jahren ohne Beschwerden, kein Spray.',
    ],
    diagnosen: [
      { text: 'Erysipel Unterschenkel links', icd: 'A46', seit: 'heute' },
      { text: 'Asthma bronchiale in der Kindheit, aktuell beschwerdefrei', icd: 'J45.9', seit: 'Kindheit' },
    ],
    medikation: [
      { id: 'mp-cefuroxim', wirkstoff: 'Cefuroxim', staerke: '1,5 g', form: 'i. v. (Kurzinfusion 30 Min.)', schema: '1-1-0-1', massnahme: 'cefuroxim-wieder-anhaengen', zuletzt: 'heute 15:00',
        hinweis: 'Um 7, 15, 23 Uhr. Erste Gabe heute 15:00 (JK). Bei erster Gabe 30 Min. auf Unverträglichkeit achten.' },
      { id: 'mp-ibuprofen', wirkstoff: 'Ibuprofen', staerke: '400 mg', form: 'Tbl.', massnahme: 'ibuprofen-geben', zuletzt: 'heute 12:00',
        bedarf: { indikation: 'Schmerz oder Fieber über 38,5 °C', einzeldosis: '400 mg', maxProTag: '3 Gaben', abstandH: 6 } },
      { id: 'mp-enoxaparin', wirkstoff: 'Enoxaparin', staerke: '40 mg', form: 's. c.', schema: '0-0-1-0', hinweis: 'Ab heute Abend.' },
    ],
    vorwerte: [
      { zeit: 'heute 11:30 (Notaufnahme)', vorH: 3.7, werte: { rrSys: 124, rrDia: 76, hf: 96, af: 16, spo2: 98, temp: 38.4 }, kuerzel: 'NA' },
      { zeit: 'heute 14:00', vorH: 1.2, werte: { rrSys: 122, rrDia: 74, hf: 88, af: 16, spo2: 98, temp: 37.9, schmerz: 3 }, kuerzel: 'JK' },
    ],
    pflegebericht: [
      { zeit: 'heute 12:10', wer: 'JK', text: 'Aufnahme aus der Notaufnahme. Rötung Unterschenkel links mit Stift markiert. Bein hochgelagert, kühlende Umschläge. PVK 20 G rechter Unterarm.' },
      { zeit: 'heute 15:00', wer: 'JK', text: 'Cefuroxim 1,5 g als Kurzinfusion angehängt (erste Gabe). Patientin über mögliche Unverträglichkeit informiert, soll klingeln.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'heute 12:30', wer: 'Dr. Haas', text: 'Cefuroxim 1,5 g i. v. alle 8 h. Bein hochlagern, Rötung markieren. Ibuprofen 400 mg bei Bedarf, max. 3×/Tag.' },
      { zeit: 'Stationsstandard', wer: 'Notfallplan', text: 'Bei Verdacht auf Anaphylaxie: Zufuhr stoppen, Notfallteam rufen, Adrenalin 0,5 mg i. m. nach ärztlicher Anordnung bzw. durch das Notfallteam.' },
    ],
    assessments: [
      { name: 'NEWS2', wert: '1 Punkt (14:00)', datum: 'heute 14:00' },
    ],
    labor: [
      { name: 'CRP', wert: '96', einheit: 'mg/l', norm: 'unter 5', datum: 'heute', auffaellig: true },
      { name: 'Leukozyten', wert: '13,2', einheit: '/nl', norm: '4–10', datum: 'heute', auffaellig: true },
    ],
    pflegeplanung: [
      { problem: 'Entzündung Unterschenkel links', ziel: 'Rötung geht zurück', massnahmen: ['Hochlagern, Rötung markieren', 'Antibiotikum nach Plan, Unverträglichkeit beobachten'] },
    ],
    rechtliches: ['Auskunft an Angehörige: im Aufnahmebogen nicht festgelegt, Patientin selbst fragen.'],
  },

  befunde: [
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: '„Mir ist so komisch … der Hals … wird eng.“ Sie ist wach und orientiert, sehr ängstlich.' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: 'Seit ein paar Minuten juckt es am Hals und an den Armen, dann kam das Engegefühl im Hals und Schwindel. „Ist das von der Infusion?“' }] },
    { massnahme: 'ersteindruck-abcde', varianten: [
      { text: 'A: Stimme etwas belegt, Lippen geschwollen. B: atmet schnell, pfeifendes Ausatmen. C: Puls schnell, Haut gerötet und warm. D: wach, ängstlich. E: Quaddeln an Hals, Brust und Unterarmen; die Infusion läuft noch.' },
    ] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Quaddeln und flächige Rötung an Hals, Brust und Unterarmen, Lippen und Augenlider geschwollen.' }] },
    { massnahme: 'atmung-beobachten', varianten: [{ text: 'Schnelle Atmung, {af}/min, verlängertes Ausatmen, setzt die Schultern ein.', zeigt: ['af'] }] },
    { massnahme: 'atemgeraeusche-hoeren', varianten: [{ text: 'Giemen und Brummen beidseits beim Ausatmen.', ton: 'atem-giemen' }] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'AVPU: {avpu}, GCS {gcs}.', zeigt: ['avpu', 'gcs'] }] },
    { massnahme: 'rekap-pruefen', varianten: [{ text: 'Rekapillarisierung {rekapSek} Sekunden.', zeigt: ['rekapSek'] }] },
    { massnahme: 'news2-berechnen', varianten: [
      { wenn: { nicht: { alle: [ATMUNG_ERHOBEN, RR_BEKANNT] } }, text: 'Für den NEWS2 fehlen dir noch Werte.' },
      { text: 'NEWS2 im mittleren bis roten Bereich. Bei Anaphylaxie entscheidet aber das Bild: Haut plus Atem- oder Kreislaufproblem nach einem neuen Arzneimittel ist ein Notfall.' },
    ] },
    { massnahme: 'infusion-stoppen', varianten: [{ text: 'Rollenklemme zu, Infusion abgehängt. Der Zugang bleibt liegen und ist offen für die Notfalltherapie. Etwa ein Drittel der Kurzinfusion war durchgelaufen.' }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %, Puls {hf}/min.', zeigt: ['spo2', 'hf'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg. Um 14 Uhr lag er deutlich höher.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, schnell und eher schwach.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Cefuroxim 1,5 g erste Gabe 15:00. Allergien „keine bekannt“, als Kind Penicillin-Saft, Reaktion unbekannt. Asthma in der Kindheit. Notfallplan: Zufuhr stoppen, Notfallteam, Adrenalin i. m. nach Anordnung.' }] },
    { massnahme: 'medikation-pruefen-6r', varianten: [{ text: 'Richtige Patientin, richtiges Arzneimittel und Dosis laut Anordnung. Es war die erste Gabe eines neuen Antibiotikums: Die Reaktion passt zeitlich genau.' }] },
    { massnahme: 'monitor-anlegen', varianten: [{ text: 'Monitor läuft: HF {hf}/min, RR {rrSys}/{rrDia}, SpO₂ {spo2} %, AF {af}/min.', zeigt: ['hf', 'rrSys', 'rrDia', 'spo2', 'af'] }] },
    { massnahme: 'o2-geben', varianten: [{ text: 'Maske mit Reservoir sitzt, Sauerstoff hoch dosiert.' }] },
    { massnahme: 'infusion-anhaengen', varianten: [{ text: 'Vollelektrolyt läuft im Schuss über den liegenden Zugang.' }] },
    { massnahme: 'allergie-kennzeichnen', varianten: [{ text: 'Uhrzeit, Präparat, Zeichen und Maßnahmen dokumentiert. Allergie-Hinweis „Cefuroxim: Anaphylaxie“ im System und am Bett, Allergiepass wird ärztlich ausgestellt.' }] },
    { massnahme: 'cefuroxim-wieder-anhaengen', varianten: [{ text: 'Kaum läuft die Infusion wieder, kratzt sie sich, die Stimme wird heiser.' }] },
  ],

  gespraech: [
    { id: 'g-dabei', frage: 'Ruhig erklären, was du tust, und sagen, dass du bei ihr bleibst', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Sie hält deine Hand: „Bitte gehen Sie nicht weg.“' }],
      wirkung: [{ groesse: 'angst', delta: -0.15, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
    { id: 'g-einwilligung', frage: 'Frau Kaya fragen, ob ihre Schwester informiert werden darf', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      antwort: [{ text: '„Ja, natürlich, Derya darf alles wissen.“', setzt: ['einwilligung-schwester'] }] },
    { id: 'g-schwester', frage: 'Schwester sagen, was passiert und was sie tun kann', an: 'angehoerige', kompetenzbereiche: ['II', 'IV'],
      schweigepflicht: { erlaubtWenn: { flag: 'einwilligung-schwester' },
        fehlerText: 'Im Aufnahmebogen ist keine Auskunft an Angehörige festgelegt. Frau Kaya ist wach und kann selbst entscheiden: erst kurz fragen, dann informieren.' },
      antwort: [{ text: '„Sie hat noch nie auf irgendwas allergisch reagiert! … Gut, ich warte draußen und rufe ihren Mann an.“', setzt: ['schwester-informiert'] }],
      wirkung: [{ groesse: 'unruhe', delta: -0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
    { id: 'g-kindheit', frage: 'Schwester fragen, ob Frau Kaya schon einmal so reagiert hat', an: 'angehoerige', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Als Kind hatte sie mal Ausschlag nach einem Saft, Mama meinte, das war Penicillin.“' }],
      fakten: ['als Kind Ausschlag nach Penicillin-Saft'] },
  ],

  sbar: [
    { id: 's-reaktion', teil: 'S', text: 'Frau Kaya, 34, Zimmer 12: Verdacht auf Anaphylaxie zehn Minuten nach der ersten Cefuroxim-Infusion.', art: 'kern' },
    { id: 's-juckreiz', teil: 'S', text: 'Frau Kaya hat Juckreiz und Ausschlag.', art: 'hilfreich' },
    { id: 'b-erste-gabe', teil: 'B', text: 'Erysipel links, heute 15 Uhr erste Gabe Cefuroxim 1,5 g. Infusion ist gestoppt, Zugang offen. Als Kind Ausschlag nach Penicillin, Asthma in der Kindheit.', art: 'kern', bekanntWenn: { getan: 'infusion-stoppen' } },
    { id: 'b-erzieherin', teil: 'B', text: 'Sie arbeitet als Erzieherin.', art: 'ablenker' },
    { id: 'a-haut', teil: 'A', text: 'Quaddeln an Hals, Brust und Armen, Lippen geschwollen.', art: 'kern', bekanntWenn: HAUT_GESEHEN },
    { id: 'a-atmung', teil: 'A', text: 'Atemnot mit Engegefühl im Hals, schnelle Atmung, Giemen.', art: 'kern', bekanntWenn: ATMUNG_ERHOBEN },
    { id: 'a-kreislauf', teil: 'A', text: 'Puls schnell, Blutdruck deutlich niedriger als um 14 Uhr, Schwindel.', art: 'kern', bekanntWenn: RR_BEKANNT },
    { id: 'a-harmlos', teil: 'A', text: 'Wahrscheinlich nur eine leichte Hautreaktion.', art: 'falsch' },
    { id: 'r-kommen', teil: 'R', text: 'Bitte kommen Sie sofort. Soll ich Adrenalin bereitlegen und das Notfallteam rufen?', art: 'kern' },
    { id: 'r-antihistamin', teil: 'R', text: 'Kann sie eine Tablette gegen den Juckreiz bekommen?', art: 'ablenker' },
  ],

  anordnungen: [
    { id: 'an-adrenalin', massnahme: 'notfallmedikament-vorbereiten', auchFuer: ['adrenalin-im-selbst'], text: 'Adrenalin 0,5 mg i. m. aus dem Notfallwagen bereitlegen (Gabe durch die Ärztin bzw. das Notfallteam).' },
    { id: 'an-o2', massnahme: 'o2-geben', text: 'Sauerstoff über Maske mit Reservoir, hoch dosiert.' },
    { id: 'an-infusion', massnahme: 'infusion-anhaengen', text: '500 ml Vollelektrolytlösung im Schuss über den liegenden Zugang.' },
    { id: 'an-wieder', massnahme: 'cefuroxim-wieder-anhaengen', text: 'Wenn sie stabil ist, hängen Sie den Rest der Cefuroxim-Infusion langsam wieder an. Sie braucht das Antibiotikum.',
      fehlerhaft: { warum: 'Cefuroxim hat gerade eine Anaphylaxie ausgelöst. Erneute Gabe des Auslösers kann eine noch schwerere Reaktion auslösen.',
        korrektur: 'Cefuroxim ist ab jetzt eine Allergie. Ich setze auf Clindamycin um. Bitte kennzeichnen Sie die Allergie.', ersatz: 'an-allergie' } },
    { id: 'an-allergie', massnahme: 'allergie-kennzeichnen', text: 'Cefuroxim als Allergie (Anaphylaxie) kennzeichnen, Allergiepass vorbereiten.' },
    { id: 'an-ibuprofen', massnahme: 'ibuprofen-geben', text: 'Ibuprofen 400 mg nach Bedarfsplan.' },
  ],

  arzt: {
    name: 'Stationsärztin Dr. Haas',
    erreichbar: 'telefon',
    regeln: [
      { ...ANAPHYLAXIE_REGEL, wenn: { alle: [{ gemeldet: ['s-reaktion'] }, { eine: [{ gemeldet: ['a-atmung'] }, { gemeldet: ['a-kreislauf'] }, { gemeldet: ['wert:rrSys'] }] }] } },
      { id: 'r-frage', wenn: { eine: [{ gemeldet: ['s-reaktion'] }, { gemeldet: ['a-haut'] }] },
        antwort: '„Haut allein wäre noch keine Anaphylaxie. Ist die Infusion aus?“',
        rueckfrage: { text: '„Wie sind Atmung und Blutdruck?“', erwartet: ['a-atmung'] } },
      { wenn: { eine: [{ gemeldet: ['s-juckreiz'] }, { gemeldet: ['a-harmlos'] }, { gemeldet: ['r-antihistamin'] }] },
        antwort: '„Juckreiz kommt vor. Lassen Sie die Infusion etwas langsamer laufen, ich schaue nach der Visite vorbei.“', setzt: ['arzt-beruhigt'] },
    ],
    auftraege: [
      { id: 'af-nach-adrenalin', text: 'Fünf Minuten nach Adrenalin Blutdruck und Atemfrequenz messen und melden (Zweitgabe ja/nein)',
        erledigt: { alle: [ADRENALIN_DA, { getan: 'rr-messen' }, { getan: 'af-zaehlen' }] }, meldung: ['wert:rrSys', 'wert:af'], meldenBinnenSek: 1200,
        folge: [
          { id: 'r-folge', wenn: { ab: 0 }, antwort: '„Gut, das Adrenalin wirkt, keine Zweitgabe. Monitor bleibt dran, sie bleibt mindestens zwölf Stunden zur Beobachtung, eine Spätreaktion ist möglich. Wenn sie stabil ist, hängen Sie den Rest der Cefuroxim-Infusion langsam wieder an, sie braucht das Antibiotikum.“',
            anordnungen: ['an-wieder'], setzt: ['folge-erhalten'] },
        ] },
    ],
  },

  ereignisse: [
    { id: 'e-zunahme', art: 'komplikation', wann: { ab: 240 }, verhindertDurch: { getan: 'infusion-stoppen' },
      text: 'Die Infusion läuft weiter. Frau Kaya wird heiser, die Lippen schwellen weiter an, sie ringt nach Luft.',
      treiber: [{ art: 'anaphylaxie', staerke: 0.9 }], bild: { haltung: 'sitzt-ringt', mimik: 'angst' } },
    { id: 'e-aufstehen', art: 'patient', wann: { ab: 180 },
      text: 'Frau Kaya will aufstehen: „Ich brauch Luft, ich muss ans Fenster!“ Sie schwankt beim Aufsetzen.',
      bild: { haltung: 'sitzt', mimik: 'angst' },
      entscheidung: [
        { id: 'w-bleiben', text: 'Nicht aufstehen lassen: im Bett sitzend lagern, Fenster öffnen lassen, bei ihr bleiben', wertung: 'gut', warum: 'Bei Anaphylaxie kann Aufstehen den Kreislauf zusammenbrechen lassen. Sitzen hilft der Atmung, Liegen dem Kreislauf.' },
        { id: 'w-fenster', text: 'Sie zum Fenster begleiten, damit sie Luft bekommt', wertung: 'gefaehrlich', warum: 'Aufrechte Haltung bei Anaphylaxie: Das Blut sackt in die weiten Gefäße, plötzlicher Kreislaufstillstand ist möglich.' },
        { id: 'w-allein', text: 'Kurz rausgehen und den Notfallwagen holen', wertung: 'falsch', warum: 'Nicht allein lassen. Hilfe über Klingel oder Notruf holen und bleiben.' },
      ] },
    { id: 'e-aerztin-da', art: 'visite', wann: ADRENALIN_DA,
      text: 'Dr. Haas ist da, kurz darauf das Notfallteam. Sie liest die Spritze zurück („Adrenalin 0,5 mg i. m.“) und spritzt in den seitlichen Oberschenkel. Danach Antihistaminikum und Kortison i. v.',
      treiber: [{ art: 'wirkstoff', id: 'adrenalin', dosisMg: 0.5, weg: 'im' }, { art: 'wirkstoff', id: 'prednisolon', dosisMg: 250, weg: 'iv' }] },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Roth',
    hilfen: [
      { wenn: { nicht: { getan: 'infusion-stoppen' } }, impuls: 'Was läuft gerade in ihre Vene, und seit wann?', tipp: 'Infusion sofort stoppen, Zugang liegen lassen.' },
      { wenn: { nicht: { alle: [ATMUNG_ERHOBEN, RR_BEKANNT] } }, impuls: 'Haut allein oder mehr? Was entscheidet über die Schwere?', tipp: 'Atmung und Blutdruck prüfen.' },
      { wenn: { nicht: { flag: 'arzt-kommt' } }, impuls: 'Wer muss jetzt sofort kommen?', tipp: 'Ärztin mit SBAR anrufen: Reaktion nach der ersten Gabe, Atmung, Kreislauf.' },
      { wenn: { alle: [{ flag: 'folge-erhalten' }, { nicht: { flag: 'remonstriert:an-wieder' } }] }, impuls: 'Passt die letzte Anordnung zu dem, was gerade passiert ist?', tipp: 'Was hat die Reaktion ausgelöst?' },
      { impuls: 'Was muss die nächste Schicht unbedingt wissen?', tipp: 'Allergie kennzeichnen und dokumentieren.' },
    ],
  },
  team: { kollegin: 'Pflegefachmann Jonas', weitere: { angehoerige: 'Schwester Derya Kaya' } },

  bewertung: {
    pflicht: [
      { id: 'p-stopp', text: 'Infusion sofort gestoppt, Zugang belassen', gewicht: 3, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'infusion-stoppen', bis: 300 },
        warum: 'Jede weitere Minute bringt mehr Auslöser in den Körper. Der Zugang wird für die Notfalltherapie gebraucht.' },
      { id: 'p-einschaetzung', text: 'Haut, Atmung und Kreislauf eingeschätzt', gewicht: 3, kompetenzbereiche: ['I'],
        erfuellt: { alle: [HAUT_GESEHEN, ATMUNG_ERHOBEN, RR_BEKANNT] }, warum: 'Erst Atem- oder Kreislaufbeteiligung macht aus einer Hautreaktion eine Anaphylaxie.' },
      { id: 'p-arzt', text: 'Ärztin sofort mit SBAR informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { alle: [{ flag: 'arzt-kommt' }, { getan: 'anruf-aerztin', bis: 480 }] },
        warum: 'Adrenalin i. m. ist das wichtigste Medikament und muss schnell kommen.' },
      { id: 'p-lagerung', text: 'Nach Leitsymptom gelagert, nicht aufstehen lassen', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { eine: [{ getan: 'oberkoerper-hoch' }, { getan: 'flachlagern-beine-hoch' }] }, warum: 'Atemnot: sitzend. Schwindel/Schock: flach mit Beinen hoch. Nie aufstehen.' },
      { id: 'p-rueckgelesen', text: 'Anordnungen Adrenalin, Sauerstoff und Infusion rückgelesen', gewicht: 2, kompetenzbereiche: ['III'],
        erfuellt: { alle: [{ anordnung: 'an-adrenalin', rueckgelesen: true }, { anordnung: 'an-o2', rueckgelesen: true }, { anordnung: 'an-infusion', rueckgelesen: true }] },
        warum: 'Bei Adrenalin entscheidet die richtige Dosis und der richtige Weg (i. m., nicht i. v. unverdünnt).' },
      { id: 'p-o2', text: 'Sauerstoff hoch dosiert gegeben', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'o2-geben' }, warum: 'Bronchospasmus und Schock senken die Sauerstoffversorgung.' },
      { id: 'p-monitor', text: 'Monitor angelegt', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'monitor-anlegen' }, warum: 'Kontinuierliche Überwachung zeigt, ob Adrenalin wirkt.' },
      { id: 'p-rueckauftrag', text: 'Rückauftrag erledigt: Werte nach Adrenalin gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-nach-adrenalin', status: 'gemeldet' },
        warum: 'Die Ärztin entscheidet mit deinen Werten über eine zweite Adrenalingabe.' },
      { id: 'p-remonstration', text: 'Anordnung „Cefuroxim wieder anhängen“ hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-wieder' },
        warum: 'Der Auslöser darf nach einer Anaphylaxie nicht erneut gegeben werden.' },
      { id: 'p-allergie', text: 'Allergie gekennzeichnet und dokumentiert', gewicht: 2, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ getan: 'allergie-kennzeichnen' }, { getan: 'pflegebericht' }] }, warum: 'Sonst bekommt sie das Mittel beim nächsten Mal wieder (Patientensicherheit).' },
      { id: 'p-schwester', text: 'Schwester nach Einwilligung einbezogen', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { alle: [{ flag: 'einwilligung-schwester' }, { flag: 'schwester-informiert' }] }, warum: 'Die Patientin ist wach und entscheidet selbst, wer informiert wird.' },
    ],
    fehler: [
      { id: 'f-weiter', text: 'Infusion weiterlaufen lassen', schwere: 'schwer', kompetenzbereiche: ['I', 'III'], wenn: { nichtGetan: 'infusion-stoppen', bis: 300 },
        warum: 'Die Zufuhr des Auslösers muss als Erstes gestoppt werden. Dafür brauchst du keine Anordnung.' },
      { id: 'f-wieder', text: 'Cefuroxim wieder angehängt', schwere: 'schwer', kompetenzbereiche: ['III', 'IV'], wenn: { getan: 'cefuroxim-wieder-anhaengen' },
        warum: 'Erneute Gabe des Auslösers. Eine fehlerhafte Anordnung musst du hinterfragen.' },
      { id: 'f-nur-haut', text: 'Nur Juckreiz gemeldet, Atmung und Kreislauf verschwiegen', schwere: 'mittel', kompetenzbereiche: ['II', 'III'], wenn: { flag: 'arzt-beruhigt' },
        warum: 'So erkennt die Ärztin die Anaphylaxie nicht und lässt die Infusion sogar weiterlaufen.' },
      { id: 'f-wickel', text: 'Wadenwickel in der Notfallsituation', schwere: 'leicht', kompetenzbereiche: ['I'], wenn: { getan: 'wadenwickel' },
        warum: 'Das Fieber ist jetzt nicht das Problem; Kühlen bei Schock verschlechtert die Durchblutung.' },
      { id: 'f-spaet', text: 'Bis 8 Minuten niemanden informiert', schwere: 'schwer', kompetenzbereiche: ['I', 'III'], wenn: { alle: [{ ab: 480 }, { nicht: { flag: 'arzt-kommt' } }] },
        warum: 'Eine Anaphylaxie kann in Minuten zum Kreislaufstillstand führen.' },
    ],
    ende: [
      { wenn: { alle: [ADRENALIN_DA, { flag: 'remonstriert:an-wieder' }, { getan: 'allergie-kennzeichnen' }, { getan: 'pflegebericht' }, { ab: 840 }] },
        text: 'Nach Adrenalin, Sauerstoff und Volumen atmet Frau Kaya freier, die Quaddeln blassen ab. Sie bleibt am Monitor; Cefuroxim ist als Allergie gekennzeichnet.', ausgang: 'stabil' },
      { wenn: { ab: 2100 }, text: 'Frau Kaya wird bewusstlos, der Puls ist kaum tastbar. Das Notfallteam beginnt mit der Reanimation.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-anaphylaxie', text: 'Lebensbedrohliche allergische Reaktion mit Atemnot und Kreislaufschwäche', richtig: true, prioritaet: 1, warum: 'Bestimmt alle Sofortmaßnahmen.' },
      { id: 'pb-spaet', text: 'Gefahr einer Spätreaktion in den nächsten Stunden', richtig: true, prioritaet: 2, warum: 'Biphasische Verläufe sind möglich: Überwachung.' },
      { id: 'pb-angst', text: 'Starke Angst, Erstickungsgefühl', richtig: true, prioritaet: 2, warum: 'Dabeibleiben und erklären senkt die Angst.' },
      { id: 'pb-allergie', text: 'Neu bekannte Arzneimittelallergie (Wiederholungsgefahr)', richtig: true, prioritaet: 2, warum: 'Kennzeichnen und Information der Patientin.' },
      { id: 'pb-mobil', text: 'Eingeschränkte Mobilität durch das Erysipel', richtig: false, warum: 'Jetzt nicht vorrangig.' },
    ],
    ziele: [
      { id: 'z-stabil', text: 'Atmung frei, Blutdruck stabil, Quaddeln rückläufig.', passtZu: ['pb-anaphylaxie'], richtig: true },
      { id: 'z-ueberwacht', text: 'Eine Spätreaktion wird am Monitor früh erkannt.', passtZu: ['pb-spaet'], richtig: true },
      { id: 'z-weiss', text: 'Frau Kaya kennt ihre Allergie und hat einen Allergiepass.', passtZu: ['pb-allergie', 'pb-angst'], richtig: true },
      { id: 'z-antibiotikum', text: 'Frau Kaya bekommt das Cefuroxim heute noch vollständig.', passtZu: ['pb-anaphylaxie'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Was im Körper passiert', text: 'Bei einer Anaphylaxie setzen Abwehrzellen in Minuten große Mengen Histamin und andere Botenstoffe frei. Gefäße werden weit und durchlässig (Blutdruckabfall, Schwellungen), die Bronchien verkrampfen (Giemen), die Haut reagiert mit Quaddeln. Die erste Gabe eines neuen Arzneimittels ist ein typischer Zeitpunkt.', quellen: ['s2k-anaphylaxie'] },
    { titel: 'Sofort', text: 'Zufuhr stoppen, Zugang belassen, Hilfe rufen (Notfallteam), nicht allein lassen. Lagerung nach Leitsymptom: Atemnot sitzend, Kreislauf flach mit Beinen hoch, bewusstlos stabile Seitenlage. Nie aufstehen lassen.', quellen: ['s2k-anaphylaxie', 'erc-2025'] },
    { titel: 'Adrenalin zuerst', text: 'Adrenalin 0,5 mg i. m. in den seitlichen Oberschenkel (Erwachsene) ist das wichtigste Medikament; bei fehlender Besserung nach 5 Minuten wiederholen. Antihistaminika und Kortison wirken langsamer und ersetzen Adrenalin nicht.', quellen: ['s2k-anaphylaxie', 'fi-adrenalin'] },
    { titel: 'Patientensicherheit', text: 'Reaktion mit Uhrzeit, Präparat und Verlauf dokumentieren, Allergie kennzeichnen, Allergiepass. Den Auslöser nie wieder anhängen, auch nicht „langsamer“. Eine Spätreaktion ist möglich: Überwachung nach Anordnung.', quellen: ['aps-arzneimittel', 's2k-anaphylaxie'] },
    { titel: 'Deine Grenzen', text: 'Infusion stoppen darfst und musst du sofort. Adrenalin bereitlegen: im 1. Drittel nicht, danach mit Anleitung. Die Gabe übernehmen Ärztin oder Notfallteam bzw. eine Pflegefachperson nach Notfallstandard.', quellen: ['s2k-anaphylaxie'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'beschwerden-erfragen' },
      { art: 'massnahme', id: 'infusion-stoppen' },
      { art: 'massnahme', id: 'ersteindruck-abcde' },
      { art: 'massnahme', id: 'atmung-beobachten' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'oberkoerper-hoch' },
      { art: 'anruf', an: 'aerztin', sbar: ['s-reaktion', 'b-erste-gabe', 'a-haut', 'a-atmung', 'a-kreislauf', 'r-kommen'] },
      { art: 'rueckmelden', anordnung: 'an-adrenalin', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-o2', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-infusion', rueckgelesen: true },
      { art: 'massnahme', id: 'o2-geben' },
      { art: 'massnahme', id: 'notfallmedikament-vorbereiten' },
      { art: 'massnahme', id: 'monitor-anlegen' },
      { art: 'massnahme', id: 'infusion-anhaengen' },
      { art: 'frage', id: 'g-dabei' },
      { art: 'warten', sek: 240 },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'af-zaehlen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['wert:rrSys', 'wert:af'] },
      { art: 'remonstrieren', anordnung: 'an-wieder', grund: 'Cefuroxim hat die Anaphylaxie ausgelöst. Das dürfen wir nicht wieder anhängen.' },
      { art: 'massnahme', id: 'allergie-kennzeichnen' },
      { art: 'frage', id: 'g-einwilligung' },
      { art: 'frage', id: 'g-schwester' },
      { art: 'dokumentieren', bausteine: ['b-erste-gabe', 'a-haut', 'a-atmung', 'wert:rrSys', 'anordnung:an-adrenalin'] },
      { art: 'warten', sek: 60 },
      { art: 'abschluss', probleme: ['pb-anaphylaxie', 'pb-spaet', 'pb-angst', 'pb-allergie'], ziele: ['z-stabil', 'z-ueberwacht', 'z-weiss'],
        sbar: ['s-reaktion', 'b-erste-gabe', 'a-haut', 'a-atmung', 'a-kreislauf'] },
    ],
    unterlassung: { bisSek: 1500, erwartet: { wert: 'rrSys', vergleich: '<', grenze: 90 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'notfallmedikament-vorbereiten' }], erwartet: 'pa-eingriff' },
  },
};
