// Fallwelle P17a · CE 02 Bewegung und Selbstversorgung · Krankenhaus (Orthopädie): erste Mobilisation nach Hüft-TEP.
// Migriert und fachlich neu geschrieben aus dem Altfall „reha – Der erste Weg zum Bad“ (scenarios.json).
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch.

import { KATALOG } from '../katalog';
import type { ArztRegel, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const ANTWORT_VOLL = 'Danke. Ein Hb von 9,4 ist nach der Hüfte noch kein Grund für eine Transfusion, das ist der Kreislauf beim ersten Aufstehen. 500 ml Ringer über die Braunüle in einer Stunde, heute nur noch mit der Physiotherapie oder zu zweit mobilisieren. Und geben Sie ihm vor der nächsten Mobilisation 1 g Novaminsulfon als Tablette. Schreiben Sie mir in einer Viertelstunde Blutdruck und Puls.';
const REGEL_VOLL: ArztRegel = {
  id: 'r-voll', wenn: { gemeldet: ['s-kollaps', 'a-rr-puls', 'a-hb'] }, antwort: `„${ANTWORT_VOLL}“`,
  anordnungen: ['an-infusion', 'an-novamin'], setzt: ['arzt-informiert'], auftraege: ['af-rr'],
};

export const KH_REHA_ERSTER_WEG: FallV2 = {
  schema: 2,
  id: 'kh-reha-erster-weg',
  version: '0.1.0',
  spur: 'A',
  setting: 'krankenhaus',
  altersgruppe: 'erwachsen',
  titel: 'Der erste Weg zum Bad',
  kurz: 'Orthopädie, Tag 1 nach Hüft-TEP: Ein 71-Jähriger will allein zur Toilette. Beim ersten Gehen wird ihm schwarz vor Augen.',
  rahmen: 'Du bist im Frühdienst auf einer orthopädischen Station. Herr Brenner wurde gestern an der rechten Hüfte operiert. Die Physiotherapie kommt erst um zehn, aber er muss jetzt zur Toilette.',
  lernziele: [
    'Eine Mobilisation sicher vorbereiten: Schmerz, Kreislauf, Schuhe, Hilfsmittel, Weg, erst an der Bettkante sitzen.',
    'Aktivieren statt übernehmen: so viel Hilfe wie nötig, so wenig wie möglich.',
    'Einen beginnenden Kollaps erkennen und richtig reagieren (hinsetzen, Beine hoch, Hilfe holen, messen).',
    'Die Ärztin mit SBAR informieren, Laborwerte aus der Kurve nennen und eine Anordnung bei bekannter Allergie hinterfragen.',
    'Physiotherapie und Angehörige einbeziehen.',
  ],
  lehrplan: {
    ce: ['ce.02', 'ce.05'], abschnitt: ['ad12'],
    themen: ['thema.ph.mobilisation', 'thema.pro.sturz', 'thema.ph.periop', 'thema.pro.thrombose', 'thema.beo.vitalzeichen'],
    kompetenzen: ['I.1.d', 'I.2.a', 'II.2.a', 'III.1.d'],
  },
  geeignet: { rollen: [1, 2], stufen: [1, 2, 3] },
  dauerMin: [10, 15],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Mobilisation Tag 1 nach Hüft-TEP (schmerzadaptierte Vollbelastung, Rollator) gegen aktuellen Klinikstandard prüfen',
      'Hb-Grenze und Kreislaufreaktion fachlich plausibel?',
      'Remonstration Novaminsulfon bei dokumentierter Metamizol-Allergie (Agranulozytose) korrekt dargestellt?',
      'Quellen: DNQP Mobilität (2020), DNQP Sturzprophylaxe (2022) am Quellenregister prüfen',
    ],
  },
  quellen: [
    { id: 'dnqp-mobilitaet', titel: 'DNQP Expertenstandard Mobilität: Erhaltung und Förderung der Mobilität in der Pflege, Aktualisierung 2020 (nie in Kraft gesetzt, fachlicher Hintergrund)' },
    { id: 'dnqp-sturz', titel: 'DNQP Expertenstandard Sturzprophylaxe in der Pflege, 2. Aktualisierung 2022' },
    { id: 'dnqp-schmerz', titel: 'DNQP Expertenstandard Schmerzmanagement in der Pflege, Aktualisierung 2020' },
    { id: 'fi-metamizol', titel: 'Fachinformation Metamizol (Novaminsulfon): Gegenanzeigen, Agranulozytose' },
  ],

  person: {
    name: 'Herr Brenner',
    alter: { jahre: 71 },
    geschlecht: 'm',
    biografie: ['verheiratet, Ehefrau besucht ihn täglich', 'war Busfahrer, wandert gern', 'will „so schnell wie möglich wieder auf die Beine“'],
    diagnosenBekannt: ['Coxarthrose rechts, Hüft-TEP rechts gestern', 'arterielle Hypertonie', 'Diabetes mellitus Typ 2 (Metformin)'],
    medikamentePlan: ['Paracetamol 1 g 1-1-1-1', 'Enoxaparin 40 mg s. c. 0-0-1', 'Amlodipin 5 mg 1-0-0', 'Metformin 1000 mg 1-0-1', 'Ibuprofen 400 mg bei Bedarf'],
    allergien: ['Metamizol (Agranulozytose 2019)'],
    hilfsmittel: ['Rollator (von der Physiotherapie)', 'Brille'],
    gewichtKg: 86,
  },
  medien: { raum: '13_station_postop' },
  uebernahme: 'Herr Brenner, 71, Zimmer 7, gestern Hüft-TEP rechts. Nacht ruhig, Schmerz in Ruhe 2, bei Bewegung 4–5. Redon gestern Abend gezogen, Verband trocken. Darf schmerzadaptiert voll belasten, Physio kommt um zehn. Hb heute früh im System. Braunüle links. Achtung Allergie, steht in der Kurve.',
  startUhrzeit: '07:40',

  start: {
    // volumen 0.8 (Blutverlust bei der OP, wenig getrunken): Modell zeigt RR um 110 syst., HF um 105
    grund: { volumen: 0.8, hydratation: 0.88, temperatur: 37.4, schmerz: 3, angst: 0.25, blutzucker: 142 },
    treiber: [{ art: 'exsikkose_progressiv', verlustProStunde: 0.04 }],
    bild: { haltung: 'liegt', haut: 'rosig', mimik: 'ruhig' },
    flags: ['zugang-liegt'],
    anordnungen: ['an-plan', 'an-bedarf'],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'beschwerden-erfragen', 'trinkmenge-erfragen', 'wuensche-aushandeln',
    // Beobachten
    'schmerz-nrs', 'wunde-beurteilen', 'haut-beobachten', 'sturzrisiko-einschaetzen', 'patient-identifizieren',
    // Akut
    'umgebung-sichern', 'hilfe-holen', 'flachlagern-beine-hoch',
    // Messen
    'kurve-lesen', 'rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'bz-messen',
    // Versorgen
    'haendedesinfektion', 'bettkante-sitzen', 'gehen-begleiten', 'mobilisieren-transfer', 'koerperpflege-uebernehmen', 'trinken-anbieten',
    'bedarfsmedikation-oral', 'metamizol-oral', 'infusion-anhaengen', 'infusion-ueberwachen',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht', 'sturzprotokoll',
  ],
  massnahmenZusatz: [
    aus('umgebung-sichern', { name: 'Feste Schuhe anziehen, Weg zum Bad frei räumen, Rollator bereitstellen, Stuhl mitnehmen', setzt: ['umgebung-sicher', 'stuhl-dabei'] }),
    aus('mobilisieren-transfer', { name: 'Toilettenstuhl ans Bett holen und Transfer begleiten', setzt: ['toilettenstuhl'] }),
    {
      id: 'koerperpflege-uebernehmen', name: 'Schnell selbst komplett waschen, statt ihn machen zu lassen', reiter: 'versorgen', spur: 'A', zeitbedarfSekunden: 420,
      befugnis: { 1: 'selbst', 2: 'selbst', 3: 'selbst', pflegefachperson: 'selbst' }, setzt: ['uebernommen'], kompetenzbereiche: ['I', 'II'],
    },
    aus('bedarfsmedikation-oral', { name: 'Ibuprofen 400 mg aus dem Bedarfsplan geben', treiber: [{ art: 'wirkstoff', id: 'ibuprofen', dosisMg: 400, weg: 'oral' }] }),
    aus('bedarfsmedikation-oral', { id: 'metamizol-oral', name: 'Novaminsulfon (Metamizol) 1 g als Tablette geben', treiber: [{ art: 'wirkstoff', id: 'metamizol', dosisMg: 1000, weg: 'oral' }] }),
    aus('wunde-beurteilen', { name: 'Verband an der Hüfte ansehen (Durchblutung, Nachblutung)' }),
  ],

  akte: {
    aufnahmegrund: 'Geplante Hüft-TEP rechts bei Coxarthrose, Operation gestern 10:15–11:30, Spinalanästhesie.',
    anamnese: [
      'Vor der OP selbstständig, Gehstrecke zuletzt 300 m mit Schmerzen.',
      'Wohnt mit Ehefrau im ersten Stock, zwölf Stufen, Handlauf rechts.',
      '2019 Agranulozytose unter Metamizol (Intensivstation).',
    ],
    diagnosen: [
      { text: 'Hüft-TEP rechts bei Coxarthrose', icd: 'Z96.64', seit: 'gestern' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2015' },
      { text: 'Diabetes mellitus Typ 2', icd: 'E11.9', seit: '2018' },
    ],
    medikation: [
      { id: 'mp-paracetamol', wirkstoff: 'Paracetamol', staerke: '1 g', form: 'Tbl.', schema: '1-1-1-1', zuletzt: 'heute 06:00', hinweis: 'Basisanalgesie nach Schmerzschema, 6/12/18/24 Uhr.' },
      { id: 'mp-ibuprofen', wirkstoff: 'Ibuprofen', staerke: '400 mg', form: 'Tbl.', massnahme: 'bedarfsmedikation-oral', zuletzt: 'gestern 22:00',
        bedarf: { indikation: 'Schmerz NRS ≥ 4 (Bewegung), möglichst 30 Min. vor Mobilisation', einzeldosis: '400 mg', maxProTag: '3 Gaben', abstandH: 8 } },
      { id: 'mp-enoxaparin', wirkstoff: 'Enoxaparin', staerke: '40 mg', form: 's. c.', schema: '0-0-1-0', zuletzt: 'gestern 18:00', hinweis: 'Thromboseprophylaxe 35 Tage.' },
      { id: 'mp-amlodipin', wirkstoff: 'Amlodipin', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'gestern 08:00', hinweis: 'Um 8 Uhr.' },
      { id: 'mp-metformin', wirkstoff: 'Metformin', staerke: '1000 mg', form: 'Tbl.', schema: '1-0-1-0', zuletzt: 'gestern 18:00', hinweis: 'Zum Essen.' },
    ],
    vorwerte: [
      { zeit: 'gestern 07:00 (präoperativ)', vorH: 24.7, werte: { rrSys: 142, rrDia: 86, hf: 72, temp: 36.6, bz: 128 }, kuerzel: 'AL' },
      { zeit: 'gestern 14:00 (Aufwachraum)', vorH: 17.7, werte: { rrSys: 124, rrDia: 74, hf: 84, spo2: 96, schmerz: 3 }, kuerzel: 'AWR' },
      { zeit: 'gestern 22:00', vorH: 9.7, werte: { rrSys: 126, rrDia: 72, hf: 86, temp: 37.5, schmerz: 4 }, kuerzel: 'ND' },
    ],
    pflegebericht: [
      { zeit: 'gestern 15:00', wer: 'AL', text: 'Aus dem Aufwachraum übernommen. Beine warm, Sensibilität und Motorik rechts regelrecht. Redon 150 ml.' },
      { zeit: 'gestern 22:00', wer: 'ND', text: 'Redon gezogen (insgesamt 280 ml). Ibuprofen 400 mg bei NRS 5. An der Bettkante gesessen, kurz schwindelig. Trinkt wenig, ca. 600 ml seit OP.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'gestern 12:00', wer: 'Dr. Hahn', text: 'Schmerzadaptierte Vollbelastung rechts, Mobilisation mit Rollator ab Tag 1 mit Physiotherapie bzw. Pflege. Kein Hüftbeugeverbot.' },
      { zeit: 'gestern 12:00', wer: 'Dr. Hahn', text: 'Schmerzschema: Paracetamol 1 g alle 6 h, Ibuprofen 400 mg bei Bedarf max. 3×/Tag. Kein Metamizol (Allergie).' },
    ],
    assessments: [
      { name: 'Sturzrisiko (Risikofaktoren nach Expertenstandard)', wert: 'erhöht', datum: 'heute', hinweis: 'Tag 1 nach OP, Schmerz, Kreislauf, ungewohntes Hilfsmittel.' },
      { name: 'Braden-Skala', wert: '18 Punkte', datum: 'gestern' },
      { name: 'Schmerz NRS', wert: 'Ruhe 2, Bewegung 4–5', datum: 'heute 06:00' },
    ],
    labor: [
      { name: 'Hämoglobin', wert: '9,4', einheit: 'g/dl', norm: '13,5–17,5', datum: 'heute 06:00', auffaellig: true },
      { name: 'Hämoglobin (präoperativ)', wert: '13,8', einheit: 'g/dl', norm: '13,5–17,5', datum: 'vor 5 Tagen' },
      { name: 'Kreatinin', wert: '1,0', einheit: 'mg/dl', norm: '0,7–1,2', datum: 'heute 06:00' },
      { name: 'Kalium', wert: '4,2', einheit: 'mmol/l', norm: '3,5–5,0', datum: 'heute 06:00' },
    ],
    pflegeplanung: [
      { problem: 'Eingeschränkte Mobilität nach Hüft-TEP rechts; Ressource: motiviert, darf voll belasten', ziel: 'Geht heute mit Rollator und Begleitung zur Toilette', massnahmen: ['Mobilisation nach Schmerzeinschätzung', 'Schuhe, Rollator, Weg frei', 'erst an der Bettkante sitzen'] },
      { problem: 'Sturzgefahr (Kreislauf Tag 1, Schmerz, Hilfsmittel neu)', ziel: 'Bleibt sturzfrei', massnahmen: ['Klingel in Reichweite', 'nur mit Begleitung aufstehen'] },
    ],
    rechtliches: ['Auskunft an die Ehefrau, Frau Brenner, erlaubt.'],
  },

  befunde: [
    { massnahme: 'haendedesinfektion', varianten: [{ text: 'Du desinfizierst die Hände, 30 Sekunden.' }] },
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Du stellst dich vor und erklärst, dass du ihn heute zur Toilette begleitest. „Begleiten? Ich bin doch nicht krank, nur operiert.“ Er lacht, ist aber einverstanden.' }] },
    { massnahme: 'patient-identifizieren', varianten: [{ text: 'Name und Geburtsdatum stimmen mit dem Armband überein.' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: '„In Ruhe geht es. Wenn ich mich bewege, zieht es ordentlich in der Hüfte. Gestern Abend an der Bettkante war mir kurz schummrig.“' }] },
    { massnahme: 'trinkmenge-erfragen', varianten: [{ text: '„Seit der OP vielleicht zwei Becher Tee. Ich wollte nicht dauernd die Flasche brauchen.“' }] },
    { massnahme: 'wuensche-aushandeln', varianten: [{ text: 'Ihr vereinbart: Er wäscht sich nachher am Waschbecken im Sitzen selbst, du hilfst bei Füßen und Rücken. „Hauptsache, ich mach was selbst.“' }] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'Schmerz in Ruhe NRS {schmerz}, bei Bewegung etwa zwei Punkte mehr. Paracetamol um 6 Uhr bekommen.' }] },
    { massnahme: 'wunde-beurteilen', varianten: [{ text: 'Verband trocken, kein Durchschlag. Bein warm, Fußpulse tastbar, Zehen bewegt er.' }] },
    { massnahme: 'haut-beobachten', varianten: [
      { wenn: { flag: 'kollaps-erlebt' }, text: 'Blass, Stirn feucht, wird langsam wieder rosiger.' },
      { text: 'Haut rosig, warm, trocken.' },
    ] },
    { massnahme: 'sturzrisiko-einschaetzen', varianten: [{ text: 'Tag 1 nach OP, gestern schon schwindelig, Schmerz, neuer Rollator, drängender Harndrang: Sturzrisiko hoch. Nur mit Begleitung, Stuhl in Reichweite.' }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Kurve: RR gestern 22 Uhr 126/72, Puls 86. Labor heute: Hb 9,4 g/dl (präoperativ 13,8). Allergie: Metamizol (Agranulozytose 2019). Anordnung: schmerzadaptierte Vollbelastung, Rollator.' }] },
    { massnahme: 'rr-messen', varianten: [
      { wenn: { flag: 'kollaps-erlebt' }, text: 'Im Sitzen: RR {rrSys}/{rrDia} mmHg, Puls {hf}/min.', zeigt: ['rrSys', 'rrDia', 'hf'] },
      { text: 'Im Liegen: RR {rrSys}/{rrDia} mmHg, Puls {hf}/min (gestern Abend 126/72).', zeigt: ['rrSys', 'rrDia', 'hf'] },
    ] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'umgebung-sichern', varianten: [{ text: 'Feste Hausschuhe mit Fersenkappe an, Rollator eingestellt (Griffe auf Höhe der Handgelenke), Weg zum Bad frei, ein Stuhl kommt mit.' }] },
    { massnahme: 'bettkante-sitzen', varianten: [{ text: 'Er dreht sich mit deiner Hilfe über die gesunde Seite an die Bettkante. Nach einer Minute: „Geht schon, nur ein bisschen flau.“' }] },
    { massnahme: 'gehen-begleiten', varianten: [{ text: 'Er steht mit dem Rollator auf, du gehst rechts neben ihm, eine Hand locker am Becken.' }] },
    { massnahme: 'mobilisieren-transfer', varianten: [{ text: 'Er setzt sich mit deiner Hilfe auf den Toilettenstuhl. Sicher, aber er ist enttäuscht: „Ich wollte doch laufen.“' }] },
    { massnahme: 'koerperpflege-uebernehmen', varianten: [{ text: 'Du wäschst ihn komplett. Es geht schneller, aber er wird still.' }] },
  ],

  gespraech: [
    { id: 'g-ziel', frage: 'Fragen, was er heute selbst schaffen möchte', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Allein zur Toilette. Und in einer Woche die Treppe zu Hause.“', setzt: ['ziel-vereinbart'] }], fakten: ['möchte allein zur Toilette', 'zu Hause zwölf Stufen'] },
    { id: 'g-kollege-infusion', frage: 'Pflegefachmann Ben bitten, die angeordnete Infusion anzuhängen (du schaust zu)', an: 'kollegin', kompetenzbereiche: ['III'],
      nurWenn: { anordnung: 'an-infusion' },
      antwort: [{ text: 'Ben: „Mach ich. Schau zu, beim nächsten Mal machst du es mit mir zusammen.“', setzt: ['infusion-durch-ben', 'infusion-laeuft'] }],
      wirkung: [
        { groesse: 'volumen', delta: 0.1, beginnSek: 60, spitzeSek: 1800, dauerSek: 'dauerhaft' },
        { groesse: 'hydratation', delta: 0.08, beginnSek: 60, spitzeSek: 1800, dauerSek: 'dauerhaft' },
      ] },
    { id: 'g-physio', frage: 'Dem Physiotherapeuten berichten, wie das erste Gehen war', an: 'kollegin', kompetenzbereiche: ['II', 'III'],
      nurWenn: { ab: 900 },
      antwort: [{ text: 'Lukas (Physiotherapie): „Danke für die Info. Dann gehen wir nachher zu zweit und üben erst das Aufstehen. Gut, dass der Stuhl dabei war.“', setzt: ['physio-informiert'] }] },
    { id: 'g-ehefrau', frage: 'Der Ehefrau erklären, wie sie ihn beim Gehen begleitet', an: 'angehoerige', kompetenzbereiche: ['II'],
      nurWenn: { ab: 900 },
      antwort: [{ text: 'Frau Brenner: „Also auf der operierten Seite gehen, nicht am Arm ziehen, erst sitzen lassen und fragen, ob ihm schwindelig ist. Gut, das kann ich.“', setzt: ['ehefrau-angeleitet'] }] },
  ],

  sbar: [
    { id: 's-kollaps', teil: 'S', text: 'Herr Brenner, 71, Zimmer 7: beim ersten Gehen zur Toilette fast kollabiert, jetzt sitzend gesichert.', art: 'kern', bekanntWenn: { flag: 'kollaps-erlebt' } },
    { id: 's-schmerz', teil: 'S', text: 'Herr Brenner hat Schmerzen in der Hüfte.', art: 'hilfreich' },
    { id: 'b-tep', teil: 'B', text: 'Gestern Hüft-TEP rechts, erste Mobilisation mit Pflege, trinkt seit der OP wenig.', art: 'kern' },
    { id: 'b-busfahrer', teil: 'B', text: 'Er war Busfahrer.', art: 'ablenker' },
    { id: 'a-rr-puls', teil: 'A', text: 'Blutdruck niedriger als gestern Abend, Puls schneller, blass und kaltschweißig gewesen.', art: 'kern', bekanntWenn: { getan: 'rr-messen' } },
    { id: 'a-hb', teil: 'A', text: 'Hb heute früh 9,4 g/dl, präoperativ 13,8.', art: 'kern', bekanntWenn: { getan: 'kurve-lesen' } },
    { id: 'a-verband', teil: 'A', text: 'Verband trocken, keine Nachblutung sichtbar.', art: 'hilfreich', bekanntWenn: { getan: 'wunde-beurteilen' } },
    { id: 'a-angst', teil: 'A', text: 'Er stellt sich nur an.', art: 'falsch' },
    { id: 'r-vorgehen', teil: 'R', text: 'Wie sollen wir weiter vorgehen, und was darf er gegen die Schmerzen bekommen?', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-plan', massnahme: 'trinken-anbieten', text: 'Pflegeplanung: Getränke anbieten, Einfuhr dokumentieren.' },
    { id: 'an-bedarf', massnahme: 'bedarfsmedikation-oral', text: 'Ibuprofen 400 mg bei Bedarf (NRS ≥ 4), max. 3×/Tag, Abstand mind. 8 h.' },
    { id: 'an-infusion', massnahme: 'infusion-anhaengen', text: '500 ml Ringer-Lösung i. v. über eine Stunde.' },
    { id: 'an-novamin', massnahme: 'metamizol-oral', text: 'Novaminsulfon 1 g als Tablette vor der nächsten Mobilisation.',
      fehlerhaft: { warum: 'Herr Brenner hat eine dokumentierte Metamizol-Allergie mit Agranulozytose (2019). Novaminsulfon ist Metamizol. Eine erneute Gabe kann lebensbedrohlich sein.',
        korrektur: 'Danke, das habe ich übersehen. Kein Metamizol. Paracetamol läuft weiter, vor der Physiotherapie Ibuprofen 400 mg aus dem Bedarfsplan.' } },
  ],

  arzt: {
    name: 'Stationsarzt Dr. Hahn',
    erreichbar: 'telefon',
    regeln: [
      REGEL_VOLL,
      { id: 'r-hb-frage', wenn: { gemeldet: ['s-kollaps', 'a-rr-puls'] },
        antwort: '„Danke. Nach der Hüfte muss ich zuerst an den Blutverlust denken.“',
        rueckfrage: { text: '„Wie war der Hb heute früh? Steht in der Kurve.“', erwartet: ['a-hb'], auftrag: 'af-hb' } },
      { wenn: { gemeldet: ['s-kollaps'] },
        antwort: '„Haben Sie Blutdruck und Puls gemessen? Lassen Sie ihn sitzen oder liegen und rufen Sie mich mit den Werten an.“' },
      { wenn: { eine: [{ gemeldet: ['s-schmerz'] }, { gemeldet: ['a-angst'] }] },
        antwort: '„Schmerzen am ersten Tag sind normal. Schauen Sie ins Schmerzschema.“', setzt: ['arzt-beruhigt'] },
    ],
    auftraege: [
      { id: 'af-hb', text: 'Hb aus der Kurve nachsehen und dem Arzt melden', erledigt: { getan: 'kurve-lesen' }, meldung: ['a-hb'], meldenBinnenSek: 600,
        folge: [{ ...REGEL_VOLL, wenn: { ab: 0 } }] },
      { id: 'af-rr', text: 'In einer Viertelstunde Blutdruck und Puls messen und dem Arzt schreiben', erledigt: { getan: 'rr-messen' },
        meldung: ['wert:rrSys', 'wert:hf'], meldenBinnenSek: 1500,
        folge: [{ wenn: { ab: 0 }, antwort: '„Danke. Infusion zu Ende laufen lassen, dann mit Lukas zu zweit noch einmal versuchen. Bei erneutem Schwindel melden.“', setzt: ['rr-rueckmeldung'] }] },
    ],
  },

  team: { kollegin: 'Pflegefachmann Ben, Physiotherapeut Lukas', weitere: { angehoerige: 'Ehefrau Frau Brenner (Besuch)' } },

  ereignisse: [
    { id: 'e-dringend', art: 'patient', wann: { ab: 150 },
      text: 'Herr Brenner schiebt die Decke weg: „Ich muss dringend. Ich geh schnell allein, das schaff ich schon.“',
      bild: { haltung: 'sitzt' },
      entscheidung: [
        { id: 'w-begleiten', text: 'Kurz stoppen: Schuhe an, Rollator holen, erst an der Bettkante sitzen, du begleitest ihn', wertung: 'gut',
          warum: 'Dringlichkeit ist kein Grund, auf Sicherheit zu verzichten. Eine Minute für Schuhe, Rollator und Sitzen verhindert den Sturz.' },
        { id: 'w-toilettenstuhl', text: 'Toilettenstuhl ans Bett holen', wertung: 'vertretbar', setzt: ['toilettenstuhl-gewaehlt'],
          warum: 'Sicher, verpasst aber das Mobilisationsziel des Tages. Mit Vorbereitung wäre eine Begleitung möglich gewesen.' },
        { id: 'w-allein', text: '„Gehen Sie schon mal vor, ich komme gleich.“', wertung: 'gefaehrlich', setzt: ['allein-los'],
          warum: 'Allein, in Eile, am ersten Tag nach der OP: das klassische Sturzszenario.' },
      ] },
    { id: 'e-flau', art: 'komplikation', wann: { getan: 'gehen-begleiten' },
      text: 'Nach fünf Schritten bleibt er stehen. „Mir wird ganz flau.“ Er wird blass, auf der Stirn steht Schweiß.',
      bild: { haltung: 'sitzt', haut: 'blass-kaltschweissig', mimik: 'angst' },
      entscheidung: [
        { id: 'w-hinsetzen', text: 'Ihn auf den mitgenommenen Stuhl setzen, Beine hoch, klingeln, bei ihm bleiben', wertung: 'gut', setzt: ['kollaps-erlebt'],
          warum: 'Bei beginnendem Kollaps sofort hinsetzen oder hinlegen, Beine hoch, Hilfe holen, nicht allein lassen. Der Stuhl in Reichweite zahlt sich aus.' },
        { id: 'w-zurueck', text: 'Ihn zurück zum Bett führen', wertung: 'vertretbar', setzt: ['kollaps-erlebt'],
          warum: 'Richtig, ihn hinzulegen, aber jeder Schritt mit Schwindel ist ein Sturzrisiko. Hinsetzen geht schneller.' },
        { id: 'w-weiter', text: '„Gleich geschafft, das Bad ist ja da.“', wertung: 'gefaehrlich', setzt: ['kollaps-erlebt', 'weiter-gegangen'],
          warum: 'Weitergehen mit Kollapszeichen führt zum Sturz, nach Hüft-TEP mit Gefahr für das neue Gelenk.' },
      ] },
    { id: 'e-besuch', art: 'angehoerige', wann: { ab: 900 },
      text: 'Frau Brenner kommt früh zu Besuch: „Darf er schon laufen? Ich will ihm zu Hause helfen, ohne ihm alles abzunehmen.“' },
  ],

  pa: {
    name: 'Praxisanleiter Herr Okafor',
    hilfen: [
      { wenn: { nicht: { getan: 'kurve-lesen' } }, impuls: 'Was musst du wissen, bevor er zum ersten Mal aufsteht?', tipp: 'Schau in die Kurve: Vorwerte, Labor, Anordnung zur Belastung, Allergien.' },
      { wenn: { nicht: { getan: 'umgebung-sichern' } }, impuls: 'Was braucht er für den Weg zum Bad?', tipp: 'Feste Schuhe, Rollator, freier Weg und ein Stuhl, falls ihm schwindelig wird.' },
      { wenn: { nicht: { getan: 'bettkante-sitzen' } }, impuls: 'Er war gestern beim Sitzen schon schwindelig. Was heißt das fürs Aufstehen?', tipp: 'Erst an der Bettkante sitzen lassen, nachfragen, Blutdruck messen.' },
      { wenn: { auftrag: 'af-hb', status: 'offen' }, impuls: 'Was wollte der Arzt noch wissen?', tipp: 'Den Hb von heute früh. Steht im Labor in der Kurve.' },
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { nicht: { flag: 'remonstriert:an-novamin' } }] }, impuls: 'Passt jede Anordnung zu Herrn Brenner?', tipp: 'Novaminsulfon ist Metamizol. Schau in die Allergien.' },
      { wenn: { alle: [{ anordnung: 'an-infusion' }, { nicht: { flag: 'infusion-laeuft' } }] }, impuls: 'Wer hängt die Infusion an?', tipp: 'Im 1. Drittel Ben, im 2. Drittel du mit mir zusammen.' },
      { impuls: 'Wie viel kann er selbst?', tipp: 'Aktivieren statt übernehmen: so viel Hilfe wie nötig, so wenig wie möglich.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-haende', text: 'Hände vor dem Kontakt desinfiziert', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'haendedesinfektion' }, warum: 'Frische Operationswunde: Händehygiene schützt vor Wundinfektion.' },
      { id: 'p-kurve', text: 'Kurve, Labor und Allergien gelesen', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'kurve-lesen' },
        warum: 'Hb, Kreislauf von gestern und die Metamizol-Allergie sind für diesen Morgen entscheidend.' },
      { id: 'p-schmerz', text: 'Schmerz vor der Mobilisation eingeschätzt', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'schmerz-nrs' },
        warum: 'Wer Schmerzen hat, bewegt sich unsicher. Schmerz einschätzen und Bedarfsmedikation rechtzeitig nutzen (Expertenstandard Schmerzmanagement).' },
      { id: 'p-rr', text: 'Blutdruck und Puls gemessen', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'rr-messen' }, warum: 'Tag 1 nach OP, gestern schon schwindelig: Kreislauf prüfen.' },
      { id: 'p-vorbereitet', text: 'Mobilisation sicher vorbereitet (Schuhe, Rollator, Weg, Stuhl, Bettkante)', gewicht: 3, kompetenzbereiche: ['I', 'V'],
        erfuellt: { alle: [{ getan: 'umgebung-sichern' }, { getan: 'bettkante-sitzen' }] },
        warum: 'Die meisten Stürze nach Operationen passieren beim ersten Aufstehen. Vorbereitung ist Sturzprophylaxe.' },
      { id: 'p-aktivieren', text: 'Selbstständigkeit gefördert (Ziel vereinbart, er macht selbst, was er kann)', gewicht: 2, kompetenzbereiche: ['I', 'II'],
        erfuellt: { alle: [{ eine: [{ flag: 'ziel-vereinbart' }, { getan: 'wuensche-aushandeln' }] }, { nicht: { flag: 'uebernommen' } }] },
        warum: 'Aktivieren statt übernehmen erhält Motivation und Mobilität (Expertenstandard Mobilität).' },
      { id: 'p-arzt', text: 'Stationsarzt mit SBAR informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Ein Beinahe-Kollaps nach OP muss ärztlich eingeordnet werden (Blutverlust? Flüssigkeit?).' },
      { id: 'p-allergie', text: 'Anordnung trotz Allergie hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-novamin' },
        warum: 'Sechs-R-Regel: richtiger Patient, richtiges Medikament. Eine dokumentierte Allergie hat Vorrang vor einer mündlichen Anordnung.' },
      { id: 'p-rueckgelesen', text: 'Infusionsanordnung rückgelesen', gewicht: 1, kompetenzbereiche: ['III'], erfuellt: { anordnung: 'an-infusion', rueckgelesen: true }, warum: 'Closed-Loop-Kommunikation.' },
      { id: 'p-infusion', text: 'Infusion läuft (durch Pflegefachperson oder mit Anleitung)', gewicht: 2, kompetenzbereiche: ['I', 'III'],
        erfuellt: { eine: [{ getan: 'infusion-anhaengen' }, { flag: 'infusion-durch-ben' }] }, warum: 'Flüssigkeit stabilisiert den Kreislauf vor der nächsten Mobilisation.' },
      { id: 'p-rueckauftrag', text: 'Kontrolle gemessen und gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-rr', status: 'gemeldet' },
        warum: 'Der Arzt braucht den Verlauf, um über die nächste Mobilisation zu entscheiden.' },
      { id: 'p-team', text: 'Physiotherapie oder Ehefrau einbezogen', gewicht: 1, kompetenzbereiche: ['II'], erfuellt: { eine: [{ flag: 'physio-informiert' }, { flag: 'ehefrau-angeleitet' }] },
        warum: 'Mobilisation ist Teamarbeit; Angehörige brauchen Anleitung für zu Hause.' },
      { id: 'p-doku', text: 'Ereignis und Werte dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'], erfuellt: { dokumentiert: 'a-rr-puls' },
        warum: 'Die nächste Mobilisation baut auf dieser Erfahrung auf.' },
    ],
    fehler: [
      { id: 'f-allein', text: 'Ihn allein zur Toilette gehen lassen', schwere: 'schwer', kompetenzbereiche: ['I', 'V'], wenn: { flag: 'allein-los' },
        folge: { text: 'Im Bad knickt das rechte Bein weg. Er hält sich am Waschbecken fest und rutscht zu Boden. Er ist wach, die Hüfte schmerzt stark.',
          wirkung: [{ groesse: 'schmerz', delta: 4, beginnSek: 0, spitzeSek: 10, dauerSek: 1800 }, { groesse: 'angst', delta: 0.4, beginnSek: 0, spitzeSek: 10, dauerSek: 1800 }] },
        warum: 'Allein, ohne Hilfsmittel und in Eile am ersten Tag nach der OP: Sturz mit Gefahr für das neue Gelenk (Luxation, Fraktur).' },
      { id: 'f-weiter', text: 'Mit Kollapszeichen weitergegangen', schwere: 'schwer', kompetenzbereiche: ['I', 'V'], wenn: { flag: 'weiter-gegangen' },
        folge: { text: 'An der Badtür sackt er zusammen. Du kannst ihn nur noch zu Boden begleiten.',
          wirkung: [{ groesse: 'schmerz', delta: 3, beginnSek: 0, spitzeSek: 10, dauerSek: 1800 }, { groesse: 'angst', delta: 0.4, beginnSek: 0, spitzeSek: 10, dauerSek: 1800 }] },
        warum: 'Bei Kollapszeichen sofort hinsetzen oder hinlegen.' },
      { id: 'f-ohne-rr', text: 'Aufgestanden, ohne vorher Blutdruck und Puls zu messen', schwere: 'leicht', kompetenzbereiche: ['I'],
        wenn: { alle: [{ getan: 'gehen-begleiten' }, { nicht: { getan: 'rr-messen' } }] },
        warum: 'Er war gestern schon an der Bettkante schwindelig. Ein Ausgangswert hilft, die Reaktion einzuordnen.' },
      { id: 'f-metamizol', text: 'Metamizol trotz dokumentierter Allergie gegeben', schwere: 'schwer', kompetenzbereiche: ['I', 'III', 'IV'], wenn: { getan: 'metamizol-oral' },
        folge: { text: 'Eine halbe Stunde später juckt seine Haut, an den Armen erscheinen rote Quaddeln. Er hat Angst.',
          wirkung: [{ groesse: 'angst', delta: 0.4, beginnSek: 600, spitzeSek: 1200, dauerSek: 3600 }] },
        warum: 'Allergie vor jeder Gabe prüfen. Nach einer Agranulozytose darf Metamizol nie wieder gegeben werden.' },
      { id: 'f-uebernommen', text: 'Körperpflege komplett übernommen, obwohl er vieles selbst kann', schwere: 'leicht', kompetenzbereiche: ['I', 'II'], wenn: { flag: 'uebernommen' },
        folge: { text: 'Herr Brenner wird still: „Ich kann ja eh nichts mehr allein.“' },
        warum: 'Übernehmen statt aktivieren untergräbt Selbstständigkeit und Motivation.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { flag: 'rr-rueckmeldung' }, { dokumentiert: 'a-rr-puls' }, { flag: 'remonstriert:an-novamin' },
        { eine: [{ flag: 'physio-informiert' }, { flag: 'ehefrau-angeleitet' }] }] },
        text: 'Die Infusion läuft, Herr Brenner hat wieder Farbe im Gesicht. Um zehn geht er mit Lukas und dir zu zweit zur Toilette, diesmal ohne Schwindel.', ausgang: 'stabil' },
      { wenn: { ab: 2400 }, text: 'Die Physiotherapie ist da, aber die Lage von heute früh ist nicht geklärt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-sturz', text: 'Hohes Sturzrisiko bei der Mobilisation (Kreislauf, Schmerz, neues Hilfsmittel)', richtig: true, prioritaet: 1, warum: 'Beinahe-Kollaps beim ersten Gehen.' },
      { id: 'pb-mobilitaet', text: 'Eingeschränkte Mobilität nach Hüft-TEP; Ressource: motiviert, darf voll belasten', richtig: true, prioritaet: 2, warum: 'Ziel Selbstständigkeit bis zur Entlassung.' },
      { id: 'pb-fluessigkeit', text: 'Gefahr eines Flüssigkeitsdefizits (trinkt wenig seit der OP)', richtig: true, prioritaet: 2, warum: 'Verstärkt den Kreislaufeffekt des Blutverlusts.' },
      { id: 'pb-schmerz', text: 'Akuter Schmerz bei Bewegung', richtig: true, prioritaet: 3, warum: 'Schmerzschema nutzen, Analgesie vor der Mobilisation.' },
      { id: 'pb-immobil', text: 'Bettlägerigkeit', richtig: false, warum: 'Er darf und soll voll belasten. Bettruhe schadet (Thrombose, Pneumonie, Muskelabbau).' },
      { id: 'pb-desorientiert', text: 'Desorientiertheit', richtig: false, warum: 'Er ist voll orientiert.' },
    ],
    ziele: [
      { id: 'z-begleitet', text: 'Herr Brenner geht heute mit Rollator und Begleitung sturzfrei zur Toilette.', passtZu: ['pb-sturz', 'pb-mobilitaet'], richtig: true },
      { id: 'z-treppe', text: 'Herr Brenner steigt bis zur Entlassung mit Handlauf zwölf Stufen.', passtZu: ['pb-mobilitaet'], richtig: true },
      { id: 'z-trinken', text: 'Herr Brenner trinkt heute mindestens 1,5 l.', passtZu: ['pb-fluessigkeit'], richtig: true },
      { id: 'z-liegen', text: 'Herr Brenner bleibt heute zur Sicherheit im Bett.', passtZu: ['pb-sturz'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Die erste Mobilisation vorbereiten', text: 'Schmerz einschätzen (Analgesie rechtzeitig), Kurve lesen (Kreislauf, Hb, Belastung, Allergien), Blutdruck und Puls im Liegen, feste Schuhe, Rollator einstellen, Weg frei, Stuhl in Reichweite. Erst an der Bettkante sitzen lassen und nach Schwindel fragen.', quellen: ['dnqp-mobilitaet', 'dnqp-sturz', 'dnqp-schmerz'] },
    { titel: 'Aktivieren statt übernehmen', text: 'So viel Hilfe wie nötig, so wenig wie möglich. Ein eigenes Ziel („allein zur Toilette“) motiviert. Wer alles abgenommen bekommt, zieht sich zurück und verliert Kraft.', quellen: ['dnqp-mobilitaet'] },
    { titel: 'Kollaps beim Aufstehen', text: 'Blass, Schweiß, „flau“: sofort hinsetzen oder hinlegen, Beine hoch, klingeln, nicht allein lassen, messen. Nach OP an Blutverlust und Flüssigkeitsmangel denken. Ein Beinahe-Sturz wird gemeldet und dokumentiert.' },
    { titel: 'Allergie vor jeder Gabe', text: 'Vor jeder Medikamentengabe Allergien prüfen (Sechs-R-Regel). Handelsname und Wirkstoff vergleichen: Novaminsulfon ist Metamizol. Eine dokumentierte schwere Reaktion hat Vorrang vor einer mündlichen Anordnung, du darfst und musst nachfragen.', quellen: ['fi-metamizol'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'haendedesinfektion' },
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'massnahme', id: 'schmerz-nrs' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'frage', id: 'g-ziel' },
      { art: 'massnahme', id: 'umgebung-sichern' },
      { art: 'massnahme', id: 'bettkante-sitzen' },
      { art: 'massnahme', id: 'gehen-begleiten' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'haut-beobachten' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-kollaps', 'b-tep', 'a-rr-puls', 'a-hb', 'r-vorgehen'] },
      { art: 'rueckmelden', anordnung: 'an-infusion', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-novamin', grund: 'Metamizol-Allergie mit Agranulozytose in der Kurve.' },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'frage', id: 'g-kollege-infusion' },
      { art: 'massnahme', id: 'trinken-anbieten' },
      { art: 'massnahme', id: 'wuensche-aushandeln' },
      { art: 'dokumentieren', bausteine: ['wert:rrSys', 'a-rr-puls', 'a-hb'], freitext: 'Beinahe-Kollaps beim ersten Gehen, auf Stuhl gesetzt, kein Sturz. Novaminsulfon wegen Allergie nicht gegeben (Rücksprache Dr. Hahn).' },
      { art: 'warten', sek: 300 },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:rrSys', 'wert:hf'] },
      { art: 'warten', sek: 120 },
      { art: 'frage', id: 'g-physio' },
      { art: 'abschluss', probleme: ['pb-sturz', 'pb-mobilitaet', 'pb-fluessigkeit', 'pb-schmerz'], ziele: ['z-begleitet', 'z-treppe', 'z-trinken'],
        sbar: ['s-kollaps', 'b-tep', 'a-rr-puls', 'a-hb'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'volumen', vergleich: '<', grenze: 0.79 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'infusion-anhaengen' }], erwartet: 'pa-eingriff' },
  },
};
