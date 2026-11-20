// Fallwelle P16a (CE05) · Krankenhaus, Unfallchirurgie/Orthopädie: Lungenembolie bei der ersten Mobilisation am 4. Tag nach Knie-TEP
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch.
// Modell: Treiber lungenembolie (P16a). Nachschub (zweiter, stärkerer Treiber), wenn er nicht sofort hingesetzt und gesichert wird.

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const ATMUNG_ERHOBEN: Bedingung = { eine: [{ getan: 'af-zaehlen' }, { getan: 'atmung-beobachten' }] };
const SPO2_BEKANNT: Bedingung = { eine: [{ getan: 'pulsoxy-anlegen' }, { getan: 'monitor-anlegen' }] };
const KREISLAUF_BEKANNT: Bedingung = { eine: [{ getan: 'rr-messen' }, { getan: 'monitor-anlegen' }] };
const GESICHERT: Bedingung = { eine: [{ getan: 'sitzend-sichern' }, { getan: 'oberkoerper-hoch' }] };
/** Der Stationsarzt ist da und gibt den Heparin-Bolus (Ereignis e-arzt-da, gleiche Bedingung). */
const ARZT_DA: Bedingung = { alle: [{ flag: 'arzt-kommt' }, { eine: [{ getan: 'heparin-richten' }, { ab: 900 }] }] };

export const KH_LUNGENEMBOLIE: FallV2 = {
  schema: 2,
  id: 'kh-lungenembolie',
  version: '0.1.0',
  spur: 'A',
  setting: 'krankenhaus',
  altersgruppe: 'erwachsen',
  titel: '„Ich krieg auf einmal keine Luft“',
  kurz: 'Unfallchirurgie: Am 4. Tag nach der Knieprothese wird Herr Brandt auf dem Weg zum Bad plötzlich luftnötig, hat Brustschmerz und Herzrasen.',
  rahmen: 'Frühdienst. Du hast Herrn Brandt zum ersten Mal ohne Physiotherapie zum Bad begleitet. Nach fünf Schritten bleibt er stehen und hält sich an dir fest.',
  lernziele: [
    'Plötzliche Luftnot mit Brustschmerz nach Operation und Immobilität als mögliche Lungenembolie erkennen.',
    'Sofort hinsetzen, sichern, nicht allein lassen und nicht weiter mobilisieren.',
    'Atmung, Sauerstoffsättigung und Kreislauf einschätzen, Thrombosezeichen am Bein prüfen.',
    'Risikofaktoren aus der Akte (Operation, ausgelassene Thromboseprophylaxe) in der SBAR-Meldung nennen.',
    'Einen ungesicherten Transport eines instabilen Patienten hinterfragen.',
  ],
  lehrplan: {
    ce: ['ce.05'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.ph.periop', 'thema.pro.thrombose', 'thema.ph.mobilisation', 'thema.beo.notfall', 'thema.beo.vitalzeichen', 'thema.kl.atmung'],
    kompetenzen: ['I.2.a', 'I.2.b', 'I.2.c', 'II.1.d', 'III.2.b', 'III.2.c'],
  },
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Ablauf gegen ESC-Leitlinie Lungenembolie 2019 und S2k-Leitlinie VTE (AWMF 065-002, 2023) prüfen: Verdacht, Wells/Geneva durch Ärztin, Heparin, CT-Angiografie',
      'Nicht weiter mobilisieren, sitzend lagern: passt so? (keine strikte Bettruhe-Empfehlung mehr bei TVT, aber akute Luftnot)',
      'Remonstration „allein mit Transportdienst ins CT“: Begleitung mit Monitor und Sauerstoff durch Ärztin',
      'Lernmodell: Start etwa HF 110–120, SpO₂ um 90 %, AF über 24; ohne Sichern nach 5 Min. Nachschub, SpO₂ unter 88 %, dann Schock (Test SpO₂ nach 25 Min.)',
      'Raumfoto 13_station_postop mit Rollstuhl passt; Befunde nur Platzhalter',
    ],
  },
  quellen: [
    { id: 'esc-le-2019', titel: 'ESC Guidelines for the diagnosis and management of acute pulmonary embolism 2019 (gültige Fassung)', fundstelle: 'Diagnostik, Risikostratifizierung' },
    { id: 's2k-vte', titel: 'S2k-Leitlinie Diagnostik und Therapie der Venenthrombose und Lungenembolie (AWMF 065-002), 2023' },
    { id: 's3-vte-prophylaxe', titel: 'S3-Leitlinie Prophylaxe der venösen Thromboembolie (AWMF 003-001), Version 4.0, 2026', fundstelle: 'Endoprothetik; Basismaßnahmen (Frühmobilisation, Bewegungsübungen, Flüssigkeit) für alle, medikamentöse und physikalische Prophylaxe kombinierbar' },
    { id: 'aps-uebergabe', titel: 'Aktionsbündnis Patientensicherheit: Handlungsempfehlung sicherer innerklinischer Transport' },
  ],

  person: {
    name: 'Herr Brandt',
    alter: { jahre: 67 },
    geschlecht: 'm',
    biografie: ['Rentner, früher Busfahrer', 'verheiratet, Sohn Tobias wohnt in der Nähe', 'raucht seit 40 Jahren, „nur noch wenig“'],
    diagnosenBekannt: ['Gonarthrose rechts, Knie-TEP vor 4 Tagen', 'Adipositas', 'Hypertonie'],
    medikamentePlan: ['Enoxaparin 40 mg s. c. abends', 'Ramipril 5 mg morgens', 'Metamizol 1 g bis 4× täglich'],
    allergien: ['keine bekannt'],
    gewichtKg: 104,
  },
  medien: { raum: '13_station_postop' },
  uebernahme: 'Herr Brandt, 67, Knie-TEP rechts am Montag, heute Tag 4. Bisher nur mit Physio an der Bettkante und zwei Schritte am Rollator. Heute will er selbst ins Bad. Vitalwerte heute früh unauffällig.',
  startUhrzeit: '09:40',

  start: {
    // Lernmodell: mittelschwere Lungenembolie. Etwa HF 115, SpO₂ 90 %, AF 26, RR noch normal.
    grund: { gasaustausch: 0.8, angst: 0.7, unruhe: 0.3, schmerz: 5, temperatur: 37.4, blutzucker: 112 },
    treiber: [{ art: 'lungenembolie', staerke: 0.6 }],
    bild: { haltung: 'sitzt-ringt', haut: 'blass', mimik: 'angst' },
    flags: ['zugang-liegt'],
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'ansprechen-orientierung', 'beschwerden-erfragen', 'beruhigen-zusprechen',
    // Sofort
    'sitzend-sichern', 'hilfe-holen', 'gehen-begleiten', 'oberkoerper-hoch', 'flachlagern-beine-hoch', 'o2-geben', 'rea-team-alarmieren',
    // Beobachten und Messen
    'ersteindruck-abcde', 'atmung-beobachten', 'atemgeraeusche-hoeren', 'haut-beobachten', 'schmerz-nrs', 'beine-vergleichen', 'bewusstsein-avpu',
    'af-zaehlen', 'pulsoxy-anlegen', 'rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'schockindex-berechnen', 'news2-berechnen', 'kurve-lesen', 'monitor-anlegen', 'ekg-12-kanal',
    // Versorgen
    'heparin-richten', 'enoxaparin-nachgeben', 'bedarfsmedikation-oral', 'kompression-anziehen',
    // Melden
    'transport-vorbereiten', 'transport-allein', 'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('sitzend-sichern', { name: 'Sofort hinsetzen (Rollstuhl/Bett), Oberkörper hoch, nicht allein lassen', setzt: ['gesichert'] }),
    aus('gehen-begleiten', { name: 'Weiter bis ins Bad begleiten, „gleich geschafft“',
      treiber: [{ art: 'lungenembolie', staerke: 0.9 }] }),
    aus('o2-geben', { name: 'Sauerstoff über Nasenbrille/Maske nach Anordnung (Ziel SpO₂ ≥ 92 %)',
      wirkung: [{ groesse: 'sauerstoff', delta: 6, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] }),
    aus('iv-medikament-vorbereiten', { id: 'heparin-richten', name: 'Heparin 5000 IE als Bolus i. v. richten und beschriften (nach Anordnung)', setzt: ['heparin-bereit'] }),
    aus('sc-injektion', { id: 'enoxaparin-nachgeben', name: 'Ausgelassene Enoxaparin-Prophylaxe 40 mg s. c. jetzt nachgeben' }),
    aus('verlegung-uebergabe', { id: 'transport-vorbereiten', name: 'Transport ins CT vorbereiten: Transportmonitor, Sauerstoff, Notfallrucksack, ärztliche Begleitung', spur: 'A', setzt: ['transport-sicher'] }),
    aus('mobilisieren-transfer', { id: 'transport-allein', name: 'Herrn Brandt mit dem Transportdienst im Rollstuhl ins CT schicken', setzt: ['transport-allein'],
      treiber: [{ art: 'lungenembolie', staerke: 0.8 }] }),
  ],

  akte: {
    aufnahmegrund: 'Elektive Aufnahme vor 5 Tagen zur Knie-TEP rechts bei Gonarthrose. OP am Montag ohne Komplikationen, Spinalanästhesie.',
    anamnese: [
      'Raucher, 30 Packungsjahre. Adipositas (BMI 34). Hypertonie.',
      'Bisher kaum mobil: Schmerzen, Angst vor dem Auftreten, viel im Bett.',
      'Gestern Abend Enoxaparin nicht gegeben: „Patient schlief, nicht geweckt“, nicht nachgeholt.',
    ],
    diagnosen: [
      { text: 'Knie-TEP rechts, postoperativer Tag 4', icd: 'Z96.65', seit: 'Montag' },
      { text: 'Adipositas Grad I', icd: 'E66.0', seit: 'Jahren' },
      { text: 'Arterielle Hypertonie', icd: 'I10', seit: 'Jahren' },
    ],
    medikation: [
      { id: 'mp-enoxa', wirkstoff: 'Enoxaparin', staerke: '40 mg', form: 's. c.', schema: '0-0-1-0', massnahme: 'enoxaparin-nachgeben', zuletzt: 'vorgestern 20:00',
        hinweis: 'Gestern 20:00 nicht gegeben (Patient schlief). Nicht nachgeholt.' },
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'heute 08:00' },
      { id: 'mp-metamizol', wirkstoff: 'Metamizol', staerke: '1 g', form: 'Tbl.', massnahme: 'bedarfsmedikation-oral', zuletzt: 'heute 07:30',
        bedarf: { indikation: 'Schmerz ab NRS 4', einzeldosis: '1 g', maxProTag: '4 g', abstandH: 6 } },
    ],
    vorwerte: [
      { zeit: 'gestern 18:00', vorH: 15.7, werte: { rrSys: 138, rrDia: 82, hf: 84, af: 15, spo2: 96, temp: 37.3, schmerz: 3 }, kuerzel: 'MS' },
      { zeit: 'heute 07:00', vorH: 2.7, werte: { rrSys: 142, rrDia: 84, hf: 86, af: 16, spo2: 95, temp: 37.4, schmerz: 3 }, kuerzel: 'MS' },
    ],
    pflegebericht: [
      { zeit: 'gestern 20:15', wer: 'NB', text: 'Patient schläft. Enoxaparin nicht verabreicht, um nicht zu wecken.' },
      { zeit: 'heute 07:00', wer: 'MS', text: 'Gut geschlafen. Wunde trocken. Wadenumfang rechts wegen OP-Schwellung nicht beurteilbar. Mobilisation heute mit Begleitung zum Bad geplant.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'Montag', wer: 'Dr. Krüger', text: 'Enoxaparin 40 mg s. c. täglich abends bis 5 Wochen postop. Vollbelastung erlaubt, Mobilisation nach Physio. Kompressionsstrumpf links.' },
    ],
    assessments: [
      { name: 'Thromboserisiko', wert: 'hoch (Endoprothetik, Adipositas, Rauchen, Immobilität)', datum: 'Montag' },
      { name: 'NEWS2', wert: '1 Punkt (07:00)', datum: 'heute 07:00' },
    ],
    labor: [
      { name: 'Hb', wert: '11,6', einheit: 'g/dl', norm: '13,5–17,5', datum: 'gestern', auffaellig: true },
      { name: 'Thrombozyten', wert: '248', einheit: '/nl', norm: '150–400', datum: 'gestern' },
    ],
    pflegeplanung: [
      { problem: 'Thrombosegefahr nach Endoprothetik', ziel: 'Keine Thrombose, Prophylaxe vollständig', massnahmen: ['Enoxaparin nach Plan', 'Frühmobilisation', 'Kompressionsstrumpf links', 'Beine täglich vergleichen'] },
    ],
    rechtliches: ['Auskunft an Ehefrau erlaubt. Sohn nicht eingetragen.'],
  },

  befunde: [
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: '„Ich krieg keine Luft … und hier drückt es.“ Er zeigt auf die rechte Brustseite. Wach und orientiert, sehr ängstlich.' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: 'Ganz plötzlich nach ein paar Schritten: Luftnot, stechender Schmerz rechts beim Einatmen, Herzrasen. „Die Wade rechts zieht schon seit gestern, ich dachte, das ist von der OP.“' }] },
    { massnahme: 'ersteindruck-abcde', varianten: [
      { text: 'A: frei, spricht in kurzen Sätzen. B: schnelle, flache Atmung. C: Puls schnell, Haut blass und feucht. D: wach, ängstlich. E: rechtes Bein mit Verband, Wade dick.' },
    ] },
    { massnahme: 'atmung-beobachten', varianten: [{ text: 'Schnelle, flache Atmung, {af}/min, atmet wegen des Stechens nicht tief ein.', zeigt: ['af'] }] },
    { massnahme: 'atemgeraeusche-hoeren', varianten: [{ text: 'Beidseits Atemgeräusch, kaum Nebengeräusche. Unauffällige Lunge bei schwerer Luftnot ist ein Warnzeichen.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Blass, kalter Schweiß auf der Stirn, Lippen leicht bläulich.' }] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'Brustschmerz rechts NRS 6, stechend beim Einatmen. Knie NRS 3.' }] },
    { massnahme: 'beine-vergleichen', varianten: [{ text: 'Rechte Wade deutlich dicker als links, gespannt, warm, Druckschmerz in der Wade. Links unauffällig mit Kompressionsstrumpf.' }] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'AVPU: {avpu}.', zeigt: ['avpu'] }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %, Puls {hf}/min. Heute früh waren es 95 %.', zeigt: ['spo2', 'hf'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig, schnell.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'schockindex-berechnen', varianten: [
      { wenn: { nicht: KREISLAUF_BEKANNT }, text: 'Dafür brauchst du Puls und Blutdruck.' },
      { text: 'Schockindex: Puls geteilt durch systolischen Druck. Über 1 spricht für Schock.' },
    ] },
    { massnahme: 'news2-berechnen', varianten: [
      { wenn: { nicht: { alle: [ATMUNG_ERHOBEN, SPO2_BEKANNT, KREISLAUF_BEKANNT] } }, text: 'Für den NEWS2 fehlen dir noch Werte.' },
      { text: 'NEWS2 deutlich erhöht (Atemfrequenz, Sättigung, Puls): sofort ärztlich abklären.' },
    ] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Knie-TEP vor 4 Tagen, kaum mobil, Raucher, Adipositas. Enoxaparin gestern Abend NICHT gegeben, nicht nachgeholt. Heute 07:00: SpO₂ 95 %, Puls 86.' }] },
    { massnahme: 'monitor-anlegen', varianten: [{ text: 'Monitor: HF {hf}/min Sinusrhythmus, RR {rrSys}/{rrDia}, SpO₂ {spo2} %, AF {af}/min.', zeigt: ['hf', 'rrSys', 'rrDia', 'spo2', 'af'] }] },
    { massnahme: 'ekg-12-kanal', varianten: [{ text: 'EKG geschrieben und dem Arzt hingelegt: schneller Sinusrhythmus. Die Deutung übernimmt der Arzt.' }] },
    { massnahme: 'o2-geben', varianten: [{ text: 'Sauerstoff läuft über die Maske.' }] },
    { massnahme: 'sitzend-sichern', varianten: [{ text: 'Er sitzt im Rollstuhl, Oberkörper aufrecht, Bremsen fest. Du bleibst bei ihm und klingelst.' }] },
    { massnahme: 'gehen-begleiten', varianten: [{ text: 'Nach zwei weiteren Schritten sackt er zusammen, du fängst ihn mit Mühe ab. Er ist grau im Gesicht.' }] },
    { massnahme: 'heparin-richten', varianten: [{ text: 'Heparin 5000 IE aufgezogen, beschriftet, mit Anordnung abgeglichen und für den Arzt bereitgelegt.' }] },
    { massnahme: 'transport-vorbereiten', varianten: [{ text: 'Transportmonitor, Sauerstoffflasche und Notfallrucksack am Bett. Dr. Krüger begleitet, das CT ist informiert.' }] },
  ],

  gespraech: [
    { id: 'g-dabei', frage: 'Ruhig sagen, dass du bei ihm bleibst und Hilfe kommt', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Er nickt und versucht, langsamer zu atmen.' }],
      wirkung: [{ groesse: 'angst', delta: -0.15, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
    { id: 'g-kollegin', frage: 'Kollegin Melanie bitten: Monitor, Sauerstoff und Notfallwagen bringen', an: 'kollegin', kompetenzbereiche: ['III'],
      antwort: [{ text: '„Bin sofort da. Bleib bei ihm.“', setzt: ['kollegin-hilft'] }] },
    { id: 'g-sohn-erlaubnis', frage: 'Herrn Brandt fragen, ob du seinem Sohn Auskunft geben darfst', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: 300 },
      antwort: [{ text: '„Ja … sagen Sie Tobias Bescheid … und meiner Frau.“', setzt: ['einwilligung-sohn'] }] },
    { id: 'g-sohn', frage: 'Dem Sohn am Telefon sagen, was los ist', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: 300 },
      schweigepflicht: { erlaubtWenn: { flag: 'einwilligung-sohn' },
        fehlerText: 'Der Sohn ist nicht als auskunftsberechtigt eingetragen. Herr Brandt ist wach: erst ihn fragen.' },
      antwort: [{ text: '„Eine Lungenembolie? … Ich komme und bringe Mama mit.“', setzt: ['sohn-informiert'] }] },
  ],

  sbar: [
    { id: 's-luftnot', teil: 'S', text: 'Herr Brandt, 67, Zimmer 4: plötzliche Luftnot mit Brustschmerz und Herzrasen bei der Mobilisation, Verdacht auf Lungenembolie.', art: 'kern' },
    { id: 's-kreislauf', teil: 'S', text: 'Herrn Brandt geht es nicht gut.', art: 'hilfreich' },
    { id: 'b-tep', teil: 'B', text: 'Knie-TEP rechts vor 4 Tagen, bisher kaum mobil, Raucher, Adipositas.', art: 'kern' },
    { id: 'b-heparin', teil: 'B', text: 'Enoxaparin gestern Abend nicht gegeben und nicht nachgeholt.', art: 'kern', bekanntWenn: { getan: 'kurve-lesen' } },
    { id: 'b-busfahrer', teil: 'B', text: 'Er war früher Busfahrer.', art: 'ablenker' },
    { id: 'a-atmung', teil: 'A', text: 'Schnelle flache Atmung, Sättigung deutlich niedriger als heute früh, stechender Schmerz rechts beim Einatmen.', art: 'kern', bekanntWenn: { alle: [ATMUNG_ERHOBEN, SPO2_BEKANNT] } },
    { id: 'a-kreislauf', teil: 'A', text: 'Puls schnell, Haut blass und kaltschweißig, Blutdruck noch gehalten.', art: 'kern', bekanntWenn: KREISLAUF_BEKANNT },
    { id: 'a-bein', teil: 'A', text: 'Rechte Wade dicker, gespannt, warm und druckschmerzhaft, zieht seit gestern.', art: 'kern', bekanntWenn: { getan: 'beine-vergleichen' } },
    { id: 'a-panik', teil: 'A', text: 'Er ist wohl einfach aufgeregt, weil er das erste Mal läuft.', art: 'falsch' },
    { id: 'r-kommen', teil: 'R', text: 'Bitte kommen Sie sofort. Sauerstoff und Monitor lege ich an, er sitzt und bleibt sitzen.', art: 'kern' },
    { id: 'r-schmerzmittel', teil: 'R', text: 'Kann er etwas gegen die Schmerzen bekommen?', art: 'ablenker' },
  ],

  anordnungen: [
    { id: 'an-o2', massnahme: 'o2-geben', text: 'Sauerstoff über Maske, Ziel SpO₂ über 92 %.' },
    { id: 'an-monitor', massnahme: 'monitor-anlegen', text: 'Monitor anlegen, nicht mehr aufstehen.' },
    { id: 'an-ekg', massnahme: 'ekg-12-kanal', text: '12-Kanal-EKG schreiben.' },
    { id: 'an-heparin', massnahme: 'heparin-richten', text: 'Heparin 5000 IE als Bolus i. v. richten, ich gebe es.' },
    { id: 'an-ct-allein', massnahme: 'transport-allein', text: 'Ich melde ein CT an. Schicken Sie ihn mit dem Transportdienst im Rollstuhl runter, ich muss in den OP.',
      fehlerhaft: { warum: 'Herr Brandt ist instabil (Luftnot, Sauerstoffbedarf, schneller Puls). Ohne Monitor, Sauerstoff und ärztliche Begleitung kann er auf dem Weg kollabieren.',
        korrektur: 'Stimmt. Ich begleite ihn selbst, mit Transportmonitor und Sauerstoff. Bereiten Sie bitte alles vor.', ersatz: 'an-ct-begleitet' } },
    { id: 'an-ct-begleitet', massnahme: 'transport-vorbereiten', text: 'Transport ins CT vorbereiten: Transportmonitor, Sauerstoff, Notfallrucksack; ärztliche Begleitung.' },
  ],

  arzt: {
    name: 'Stationsarzt Dr. Krüger',
    erreichbar: 'telefon',
    regeln: [
      { id: 'r-le', wenn: { alle: [{ gemeldet: ['s-luftnot'] }, { gemeldet: ['b-tep'] }, { eine: [{ gemeldet: ['a-atmung'] }, { gemeldet: ['wert:spo2'] }] }] },
        antwort: '„Das kann eine Lungenembolie sein. Er bleibt sitzen, nicht mehr laufen. Sauerstoff über Maske, Ziel über 92 %, Monitor dran, ein EKG schreiben. Richten Sie mir 5000 Einheiten Heparin als Bolus. Ich bin in drei Minuten da. Und schauen Sie sich die Beine an und sagen Sie mir, was Sie sehen.“',
        anordnungen: ['an-o2', 'an-monitor', 'an-ekg', 'an-heparin'], kommtNachSek: 180, setzt: ['arzt-kommt'], auftraege: ['af-beine'] },
      { id: 'r-frage', wenn: { gemeldet: ['s-luftnot'] },
        antwort: '„Luftnot nach vier Tagen Knie-TEP ist ein Alarmzeichen.“',
        rueckfrage: { text: '„Wie ist die Thromboseprophylaxe gelaufen? Hat er sein Heparin regelmäßig bekommen?“', erwartet: ['b-heparin'] } },
      { wenn: { eine: [{ gemeldet: ['a-panik'] }, { gemeldet: ['r-schmerzmittel'] }, { gemeldet: ['s-kreislauf'] }] },
        antwort: '„Geben Sie ihm sein Metamizol und lassen Sie ihn sich ausruhen. Ich schaue nach der Visite.“', setzt: ['arzt-beruhigt'] },
    ],
    auftraege: [
      { id: 'af-beine', text: 'Beine vergleichen und Befund melden', erledigt: { getan: 'beine-vergleichen' }, meldung: ['a-bein'], meldenBinnenSek: 1200,
        folge: [
          { id: 'r-folge', wenn: { ab: 0 }, antwort: '„Passt zur tiefen Beinvenenthrombose rechts. Ich melde eine CT-Angiografie an. Schicken Sie ihn mit dem Transportdienst im Rollstuhl runter, ich muss gleich in den OP.“',
            anordnungen: ['an-ct-allein'], setzt: ['folge-erhalten'] },
        ] },
    ],
  },

  ereignisse: [
    { id: 'e-weiter', art: 'patient', wann: { ab: 60 },
      text: 'Herr Brandt keucht: „Geht schon … nur noch bis zum Bad. Ich muss so dringend.“',
      entscheidung: [
        { id: 'w-hinsetzen', text: 'Nicht weitergehen: stehen bleiben, festhalten, laut um Hilfe rufen, Urinflasche versprechen', wertung: 'gut', warum: 'Bei Verdacht auf Lungenembolie jede Belastung sofort stoppen. Weitere Thromben können sich lösen. Als Nächstes: hinsetzen und sichern.' },
        { id: 'w-bad', text: 'Ihn langsam bis ins Bad bringen, dort kann er sich setzen', wertung: 'gefaehrlich', warum: 'Jeder Schritt belastet das Herz weiter, im Bad droht der Kollaps ohne Hilfe in Reichweite.', setzt: ['weitergelaufen'] },
        { id: 'w-holen', text: 'Ihn an die Wand lehnen und den Rollstuhl holen', wertung: 'falsch', warum: 'Nicht allein stehen lassen. Er kann jederzeit kollabieren. Hilfe über Klingel oder Rufen holen.' },
      ] },
    { id: 'e-nachschub', art: 'komplikation', wann: { ab: 300 }, verhindertDurch: GESICHERT,
      text: 'Herr Brandt wird grau, die Lippen blau, er ringt nach Luft und sackt in sich zusammen.',
      treiber: [{ art: 'lungenembolie', staerke: 0.9 }], bild: { haltung: 'sitzt-ringt', haut: 'zyanotisch', mimik: 'angst' } },
    { id: 'e-kollaps-bad', art: 'komplikation', wann: { flag: 'weitergelaufen' },
      text: 'Im Bad sackt Herr Brandt auf dem Toilettenstuhl zusammen, grau im Gesicht. Du bist allein mit ihm.',
      treiber: [{ art: 'lungenembolie', staerke: 0.9 }], bild: { haltung: 'sitzt-ringt', haut: 'zyanotisch', mimik: 'angst' } },
    { id: 'e-arzt-da', art: 'visite', wann: ARZT_DA,
      text: 'Dr. Krüger ist da, sieht sich EKG und Bein an, gleicht die Spritze mit dir ab („Heparin 5000 Einheiten i. v.“) und gibt den Bolus. „Wells-Score hoch. Wir machen eine CT-Angiografie.“' },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Roth',
    hilfen: [
      { wenn: { nicht: GESICHERT }, impuls: 'Darf er weiterlaufen?', tipp: 'Sofort hinsetzen und sichern, nicht allein lassen.' },
      { wenn: { nicht: { alle: [ATMUNG_ERHOBEN, SPO2_BEKANNT] } }, impuls: 'Wie viel Sauerstoff kommt bei ihm an?', tipp: 'Atmung zählen, Sättigung messen, mit heute früh vergleichen.' },
      { wenn: { nicht: { getan: 'kurve-lesen' } }, impuls: 'Welche Risikofaktoren stehen in seiner Akte?', tipp: 'Schau in die Medikation von gestern Abend.' },
      { wenn: { nicht: { flag: 'arzt-kommt' } }, impuls: 'Wer muss das sofort wissen, und was braucht er von dir?', tipp: 'SBAR: Luftnot nach OP, Risikofaktoren, Sättigung, Kreislauf.' },
      { wenn: { alle: [{ flag: 'folge-erhalten' }, { nicht: { flag: 'remonstriert:an-ct-allein' } }] }, impuls: 'Wer passt im Aufzug auf ihn auf?', tipp: 'Ist ein instabiler Patient beim Transportdienst sicher?' },
      { impuls: 'Was gehört in den Bericht?', tipp: 'Zeitpunkt, Zeichen, Maßnahmen, ausgelassene Prophylaxe.' },
    ],
  },
  team: { kollegin: 'Pflegefachfrau Melanie', weitere: { angehoerige: 'Sohn Tobias Brandt' } },

  bewertung: {
    pflicht: [
      { id: 'p-stopp', text: 'Mobilisation sofort gestoppt, hingesetzt und gesichert', gewicht: 3, kompetenzbereiche: ['I'],
        erfuellt: { eine: [{ getan: 'sitzend-sichern', bis: 240 }, { getan: 'oberkoerper-hoch', bis: 240 }] }, warum: 'Weitere Belastung kann mehr Thromben lösen und das rechte Herz überfordern.' },
      { id: 'p-einschaetzung', text: 'Atmung, Sättigung und Kreislauf eingeschätzt', gewicht: 3, kompetenzbereiche: ['I'],
        erfuellt: { alle: [ATMUNG_ERHOBEN, SPO2_BEKANNT, KREISLAUF_BEKANNT] }, warum: 'Die Werte zeigen, wie bedrohlich die Embolie ist.' },
      { id: 'p-akte', text: 'Risikofaktoren aus der Akte erfasst (ausgelassenes Enoxaparin)', gewicht: 2, kompetenzbereiche: ['I', 'II'],
        erfuellt: { getan: 'kurve-lesen' }, warum: 'Die ausgelassene Prophylaxe macht die Lungenembolie noch wahrscheinlicher.' },
      { id: 'p-arzt', text: 'Arzt sofort mit SBAR informiert, Rückfrage beantwortet', gewicht: 3, kompetenzbereiche: ['II', 'III'],
        erfuellt: { alle: [{ flag: 'arzt-kommt' }, { gemeldet: ['b-heparin'] }] }, warum: 'Schnelle Diagnostik und Heparin verhindern weitere Embolien.' },
      { id: 'p-rueckgelesen', text: 'Anordnungen Sauerstoff und Heparin rückgelesen', gewicht: 2, kompetenzbereiche: ['III'],
        erfuellt: { alle: [{ anordnung: 'an-o2', rueckgelesen: true }, { anordnung: 'an-heparin', rueckgelesen: true }] }, warum: 'Heparin ist ein Hochrisiko-Arzneimittel.' },
      { id: 'p-o2', text: 'Sauerstoff gegeben', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'o2-geben' }, warum: 'Die Sättigung ist zu niedrig.' },
      { id: 'p-monitor', text: 'Monitor angelegt', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'monitor-anlegen' }, warum: 'Er kann jederzeit kreislaufinstabil werden.' },
      { id: 'p-beine', text: 'Rückauftrag erledigt: Beine verglichen und gemeldet', gewicht: 2, kompetenzbereiche: ['I', 'II'], erfuellt: { auftrag: 'af-beine', status: 'gemeldet' },
        warum: 'Eine Beinvenenthrombose als Quelle stützt den Verdacht.' },
      { id: 'p-remonstration', text: 'Ungesicherten Transport hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-ct-allein' },
        warum: 'Instabile Patienten werden mit Monitor, Sauerstoff und ärztlicher Begleitung transportiert.' },
      { id: 'p-transport', text: 'Sicheren Transport vorbereitet', gewicht: 1, kompetenzbereiche: ['III'], erfuellt: { getan: 'transport-vorbereiten' }, warum: 'Monitor, O₂, Notfallrucksack und Begleitung.' },
      { id: 'p-bericht', text: 'Verlauf dokumentiert', gewicht: 1, kompetenzbereiche: ['IV'], erfuellt: { getan: 'pflegebericht' }, warum: 'Zeitpunkt, Zeichen, Maßnahmen und ausgelassene Prophylaxe gehören in den Bericht.' },
    ],
    fehler: [
      { id: 'f-weiter', text: 'Weiter mobilisiert', schwere: 'schwer', kompetenzbereiche: ['I'], wenn: { getan: 'gehen-begleiten' },
        warum: 'Bei Verdacht auf Lungenembolie sofort hinsetzen.' },
      { id: 'f-allein', text: 'Ohne Monitor und Begleitung ins CT geschickt', schwere: 'schwer', kompetenzbereiche: ['III', 'IV'], wenn: { getan: 'transport-allein' },
        warum: 'Eine fehlerhafte Anordnung musst du hinterfragen. Er kann im Aufzug kollabieren.' },
      { id: 'f-nachgeben', text: 'Enoxaparin eigenmächtig nachgegeben', schwere: 'mittel', kompetenzbereiche: ['III'], wenn: { getan: 'enoxaparin-nachgeben' },
        warum: 'Jetzt entscheidet der Arzt über die Antikoagulation (therapeutische Dosis). Eine zusätzliche Gabe ohne Anordnung kann zu Blutungen führen.' },
      { id: 'f-kompression', text: 'Kompressionsstrumpf rechts angezogen', schwere: 'leicht', kompetenzbereiche: ['I'], wenn: { getan: 'kompression-anziehen' },
        warum: 'Bei akutem Verdacht hat das jetzt keine Priorität und bewegt das betroffene Bein.' },
      { id: 'f-beruhigt', text: 'Als Aufregung oder Schmerz gemeldet', schwere: 'mittel', kompetenzbereiche: ['II', 'III'], wenn: { flag: 'arzt-beruhigt' },
        warum: 'Ohne Risikofaktoren und Werte erkennt der Arzt die Gefahr nicht.' },
    ],
    ende: [
      { wenn: { alle: [ARZT_DA, { flag: 'remonstriert:an-ct-allein' }, { getan: 'transport-vorbereiten' }, { getan: 'pflegebericht' }, { ab: 900 }] },
        text: 'Herr Brandt fährt mit Monitor, Sauerstoff und Dr. Krüger ins CT. Das Heparin läuft. Die CT-Angiografie zeigt Embolien in beiden Lungen, er kommt zur Überwachung auf die IMC.', ausgang: 'verlegt' },
      { wenn: { ab: 2100 }, text: 'Herr Brandt wird bewusstlos, der Puls ist nicht mehr tastbar. Reanimation, das Notfallteam übernimmt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-le', text: 'Lebensbedrohliche Störung von Atmung und Kreislauf durch Verdacht auf Lungenembolie', richtig: true, prioritaet: 1, warum: 'Bestimmt alle Sofortmaßnahmen.' },
      { id: 'pb-tvt', text: 'Tiefe Beinvenenthrombose rechts (Quelle weiterer Embolien)', richtig: true, prioritaet: 2, warum: 'Nicht mobilisieren bis zur ärztlichen Entscheidung.' },
      { id: 'pb-angst', text: 'Todesangst und Atemnot', richtig: true, prioritaet: 2, warum: 'Dabeibleiben, erklären, Sauerstoff.' },
      { id: 'pb-prophylaxe', text: 'Lücke in der Thromboseprophylaxe (Patientensicherheit)', richtig: true, prioritaet: 3, warum: 'Ausgelassene Gabe melden und Ursache klären.' },
      { id: 'pb-wunde', text: 'Wundheilungsstörung am Knie', richtig: false, warum: 'Kein Hinweis darauf.' },
    ],
    ziele: [
      { id: 'z-sat', text: 'SpO₂ über 92 % mit Sauerstoff, Kreislauf überwacht.', passtZu: ['pb-le'], richtig: true },
      { id: 'z-sicher', text: 'Er kommt sicher und begleitet zur Diagnostik.', passtZu: ['pb-le', 'pb-tvt'], richtig: true },
      { id: 'z-ruhig', text: 'Er fühlt sich begleitet und weiß, was passiert.', passtZu: ['pb-angst'], richtig: true },
      { id: 'z-laufen', text: 'Er geht heute Nachmittag wieder selbstständig ins Bad.', passtZu: ['pb-tvt'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Was im Körper passiert', text: 'Ein Blutgerinnsel, meist aus einer Bein- oder Beckenvene, löst sich und verstopft Lungenarterien. Ein Teil der Lunge wird belüftet, aber nicht durchblutet: Die Sättigung fällt, das rechte Herz muss gegen einen hohen Widerstand pumpen. Typisch: plötzliche Luftnot, Brustschmerz beim Einatmen, Herzrasen, Angst.', quellen: ['esc-le-2019'] },
    { titel: 'Warum gerade jetzt', text: 'Operation an Knie oder Hüfte, Immobilität, Übergewicht, Rauchen und eine ausgelassene Prophylaxe erhöhen das Risiko. Die erste Mobilisation nach Tagen im Bett ist ein typischer Auslöser.', quellen: ['s3-vte-prophylaxe', 's2k-vte'] },
    { titel: 'Sofort', text: 'Belastung stoppen, hinsetzen mit Oberkörper hoch, nicht allein lassen, Hilfe holen. Atmung, Sättigung, Puls und Blutdruck messen, Beine vergleichen. Arzt mit SBAR: Situation, Risikofaktoren, Werte. Sauerstoff und Monitor nach Anordnung.', quellen: ['esc-le-2019'] },
    { titel: 'Transport und Patientensicherheit', text: 'Instabile Patienten werden mit Monitor, Sauerstoff, Notfallausrüstung und ärztlicher Begleitung transportiert. Ausgelassene Prophylaxe wird dokumentiert und gemeldet, damit die Ursache geklärt wird.', quellen: ['aps-uebergabe'] },
    { titel: 'Deine Grenzen', text: 'Heparin richten: im 3. Drittel mit Anleitung, die Gabe macht der Arzt. Antikoagulation nicht eigenmächtig nachholen; die Dosis ist jetzt eine therapeutische Entscheidung.', quellen: ['s2k-vte'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'beschwerden-erfragen' },
      { art: 'massnahme', id: 'sitzend-sichern' },
      { art: 'frage', id: 'g-kollegin' },
      { art: 'massnahme', id: 'atmung-beobachten' },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'anruf', an: 'aerztin', sbar: ['s-luftnot', 'b-tep', 'b-heparin', 'a-atmung', 'a-kreislauf', 'r-kommen'] },
      { art: 'rueckmelden', anordnung: 'an-o2', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-monitor', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-ekg', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-heparin', rueckgelesen: true },
      { art: 'massnahme', id: 'o2-geben' },
      { art: 'massnahme', id: 'monitor-anlegen' },
      { art: 'massnahme', id: 'heparin-richten' },
      { art: 'massnahme', id: 'beine-vergleichen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['a-bein'] },
      { art: 'remonstrieren', anordnung: 'an-ct-allein', grund: 'Er ist instabil und braucht Monitor, Sauerstoff und ärztliche Begleitung.' },
      { art: 'massnahme', id: 'ekg-12-kanal' },
      { art: 'massnahme', id: 'transport-vorbereiten' },
      { art: 'frage', id: 'g-dabei' },
      { art: 'frage', id: 'g-sohn-erlaubnis' },
      { art: 'frage', id: 'g-sohn' },
      { art: 'dokumentieren', bausteine: ['s-luftnot', 'b-heparin', 'a-atmung', 'a-bein', 'wert:spo2', 'anordnung:an-heparin'] },
      { art: 'warten', sek: 60 },
      { art: 'abschluss', probleme: ['pb-le', 'pb-tvt', 'pb-angst', 'pb-prophylaxe'], ziele: ['z-sat', 'z-sicher', 'z-ruhig'],
        sbar: ['s-luftnot', 'b-tep', 'b-heparin', 'a-atmung', 'a-bein'] },
    ],
    unterlassung: { bisSek: 1500, erwartet: { wert: 'spo2', vergleich: '<', grenze: 88 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'heparin-richten' }], erwartet: 'pa-eingriff' },
  },
};
