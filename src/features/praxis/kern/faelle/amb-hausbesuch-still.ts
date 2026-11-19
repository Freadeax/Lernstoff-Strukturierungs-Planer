// P18 · CE09 · ambulante Pflege: „Die Wohnung ist heute ungewohnt still“. Allein lebende Witwe, Trauer und Rückzug,
// Tabletten nicht genommen, wenig getrunken, Schwindel beim Aufstehen. Lebenswelt, Netzwerk, Versorgung zu Hause.
// Migriert aus Altfall „hausbesuch“ und fachlich neu geschrieben (Abgrenzung zu Frau Lindner: kein Sturz, Schwerpunkt Lebenswelt).
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch.

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const TROCKEN: Bedingung = { eine: [{ getan: 'schleimhaut-pruefen' }, { getan: 'urin-beobachten' }] };
const TRAUER: Bedingung = { flag: 'trauer-erkannt' };

const ANTWORT = 'Danke, gut dass Sie so genau hinschauen. Das passt zu zu wenig Trinken, und die Stimmung macht mir Sorgen. Geben Sie ihr jetzt die vergessenen Tabletten von Sonntag bis heute auf einmal, damit der Blutdruck nicht entgleist. Trinken fördern, ich komme heute Nachmittag nach der Sprechstunde. Klären Sie bitte, wer heute Abend nach ihr schaut, und schicken Sie mir Bescheid.';
const REGEL_VOLL: ArztRegel = {
  id: 'r-voll', wenn: { gemeldet: ['a-orthostase', 'a-dosett', 'a-trauer', 'wert:rrSys'] },
  antwort: `„${ANTWORT}“`, anordnungen: ['an-nachholen', 'an-trinken'], setzt: ['arzt-informiert'], auftraege: ['af-abend'],
};

export const AMB_HAUSBESUCH_STILL: FallV2 = {
  schema: 2,
  id: 'amb-hausbesuch-still',
  version: '0.1.0',
  spur: 'A',
  setting: 'ambulant',
  altersgruppe: 'hochbetagt',
  titel: '„Die Wohnung ist heute ungewohnt still“',
  kurz: 'Hausbesuch: 79-jährige Witwe sitzt im Morgenmantel im Sessel, Radio aus, Vorhänge zu, Tabletten seit drei Tagen im Dosett.',
  rahmen: 'Du bist mit deiner Praxisanleiterin auf der Vormittagstour des ambulanten Pflegedienstes. Bei Frau Sommer steht heute Duschen und das Wochendosett auf dem Plan.',
  lernziele: [
    'Veränderungen in der Lebenswelt wahrnehmen (Stille, Vorhänge, leerer Kühlschrank, volles Dosett) und als Hinweis ernst nehmen.',
    'Trauer und Rückzug ansprechen und Gedanken an den Tod offen nachfragen.',
    'Flüssigkeitsmangel und Kreislauf beim Aufstehen (Orthostase) einschätzen und Stürze verhindern.',
    'Vergessene Tabletten nicht einfach nachholen lassen und eine solche Anordnung hinterfragen.',
    'Mit Klientin, Tochter, Nachbarin und Pflegedienstleitung die Versorgung zu Hause absprechen und die Schweigepflicht wahren.',
  ],
  lehrplan: {
    ce: ['ce.09', 'ce.02'], abschnitt: ['ad12'],
    themen: ['thema.fa.ambulant', 'thema.pro.dehydratation', 'thema.pro.sturz', 'thema.ph.medikamente', 'thema.re.versorgung'],
    kompetenzen: ['I.5.a', 'I.5.c', 'II.1.b', 'III.3.a'],
  },
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Remonstration „vergessene Tabletten nachholen“: Formulierung gegen Fachinformation Ramipril/HCT und Medikationsplan-Standards prüfen',
      'Schellong-/Orthostase-Kriterium (Abfall systolisch ≥ 20 mmHg) und Durchführung im häuslichen Setting prüfen',
      'Gesprächsführung bei Todeswunsch im Alter (offen nachfragen, Hausärztin informieren) mit S3-Leitlinie Unipolare Depression abgleichen',
      'Leistungen (Pflegeberatung § 7a SGB XI, Entlastungsbetrag, Hausnotruf) aktuell?',
    ],
  },
  quellen: [
    { id: 'dnqp-sturz', titel: 'DNQP: Expertenstandard Sturzprophylaxe in der Pflege, 2. Aktualisierung 2022' },
    { id: 'dnqp-ernaehrung', titel: 'DNQP: Expertenstandard Ernährungsmanagement zur Sicherung und Förderung der oralen Ernährung in der Pflege, 1. Aktualisierung 2017' },
    { id: 's3-depression', titel: 'S3-Leitlinie/Nationale VersorgungsLeitlinie Unipolare Depression, Version 3.2, 2022' },
    { id: 'priscus', titel: 'PRISCUS 2.0 – potenziell inadäquate Medikation für ältere Menschen (2023)' },
    { id: 'sgb-xi', titel: 'SGB XI §§ 7a (Pflegeberatung), 45b (Entlastungsbetrag)' },
  ],

  person: {
    name: 'Frau Sommer',
    alter: { jahre: 79 },
    geschlecht: 'w',
    biografie: ['Witwe seit drei Monaten, ihr Mann Herbert hat jeden Morgen Frühstück gemacht und das Radio angestellt', 'war Schneiderin, hat bis vor einem Jahr für die Nachbarschaft genäht', 'Tochter Sabine wohnt in Stuttgart, ruft sonntags an', 'Nachbarin Frau Öztürk hat einen Wohnungsschlüssel'],
    diagnosenBekannt: ['arterielle Hypertonie', 'Arthrose der Hüfte', 'Pflegegrad 2'],
    medikamentePlan: ['Ramipril 5 mg 1-0-0', 'Hydrochlorothiazid 12,5 mg 1-0-0', 'Simvastatin 20 mg 0-0-1'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Gehstock', 'Hausnotruf (liegt in der Schublade)'],
    gewichtKg: 60,
  },
  medien: {
    raum: '07_ambulant_wohnzimmer_kompression',   // Beispielbild: Wohnzimmer mit Klientin im Sessel
    raumVarianten: [],
  },
  uebernahme: 'Frau Sommer, 79, Pflegegrad 2. Wir kommen dienstags und freitags zum Duschen und richten freitags das Wochendosett. Ihr Mann ist im Sommer gestorben. Sonst läuft bei ihr immer das Radio und sie öffnet uns schon an der Tür. Heute hat es lange gedauert, bis sie aufgemacht hat.',
  startUhrzeit: '09:40',

  start: {
    // leichter Flüssigkeitsmangel (wenig getrunken), Tabletten seit drei Tagen nicht genommen; gedrückte Stimmung
    grund: { volumen: 0.87, hydratation: 0.83, gefaesstonus: 1.02, orientierung: 0.9, delir: 0.1, angst: 0.3, unruhe: 0.05, schmerz: 2, temperatur: 36.9, blutzucker: 94 },
    treiber: [
      { art: 'exsikkose_progressiv', verlustProStunde: 0.015 },
      { art: 'delir_trigger', ausloeser: ['exsikkose'] },
    ],
    bild: { haltung: 'sitzt', haut: 'trocken', mimik: 'schlaefrig' },
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'ansprechen-orientierung', 'beschwerden-erfragen', 'biografie-erfragen', 'trinkmenge-erfragen',
    'trinken-beraten', 'beruhigen-zusprechen', 'versorgung-zuhause-absprechen',
    // Beobachten
    'ersteindruck-abcde', 'schleimhaut-pruefen', 'hautturgor-pruefen', 'urin-beobachten', 'sturzrisiko-einschaetzen',
    // Akut & Sicherheit
    'umgebung-sichern', 'hausnotruf-anlegen', 'notruf-112',
    // Messen (Pflegetasche)
    'rr-messen', 'puls-zaehlen', 'orthostase-pruefen', 'temperatur-ohr', 'bz-messen', 'dosett-pruefen',
    // Versorgen
    'trinken-anbieten', 'fruehstueck-richten', 'tabletten-nachholen', 'tabletten-wie-geplant-geben', 'koerperpflege',
    // Melden
    'tochter-informieren', 'pdl-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('trinken-anbieten', {
      name: 'Gemeinsam ein Glas Holundersaft-Schorle trinken (ihr Lieblingsgetränk)',
      wirkung: [{ groesse: 'hydratation', delta: 0.05, beginnSek: 0, spitzeSek: 1800, dauerSek: 'dauerhaft' }, { groesse: 'volumen', delta: 0.05, beginnSek: 0, spitzeSek: 1800, dauerSek: 'dauerhaft' }],
    }),
    aus('essen-anreichen', {
      id: 'fruehstueck-richten', name: 'Mit ihr zusammen Frühstück richten, Radio an, Vorhänge auf', reiter: 'versorgen', setzt: ['fruehstueck'],
      treiber: [{ art: 'kohlenhydrate', gramm: 30 }],
      wirkung: [{ groesse: 'angst', delta: -0.1, beginnSek: 0, spitzeSek: 300, dauerSek: 'dauerhaft' }],
    }),
    aus('tabletten-wie-geplant-geben', { id: 'tabletten-nachholen', name: 'Vergessene Tabletten von Sonntag bis heute auf einmal geben' }),
    aus('tabletten-wie-geplant-geben', { name: 'Nur die heutigen Morgentabletten geben (nach Anordnung)' }),
    aus('koerperpflege', { name: 'Duschen wie geplant' }),
  ],

  akte: {
    aufnahmegrund: 'Ambulante Pflege seit 2024 nach Hüftarthrose: Duschen dienstags und freitags, Wochendosett freitags richten. Pflegegrad 2.',
    anamnese: [
      'Lebt allein im Erdgeschoss, seit dem Tod ihres Mannes im August. Er hat Frühstück gemacht und eingekauft.',
      'War Schneiderin, hat bis vor einem Jahr für die Nachbarschaft genäht. Hört morgens immer Radio.',
      'Tochter Sabine Sommer wohnt in Stuttgart, kommt einmal im Monat. Nachbarin Frau Öztürk hat einen Schlüssel.',
      'Hausnotruf seit 2025, trägt ihn ungern.',
    ],
    diagnosen: [
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2010' },
      { text: 'Koxarthrose rechts', icd: 'M16.1', seit: '2021' },
      { text: 'Hypercholesterinämie', icd: 'E78.0', seit: '2015' },
    ],
    medikation: [
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'Samstag morgens', hinweis: 'Fächer Sonntag bis Dienstag morgens noch voll.' },
      { id: 'mp-hct', wirkstoff: 'Hydrochlorothiazid', staerke: '12,5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'Samstag morgens', hinweis: 'Entwässernd: bei wenig Trinken Schwindel und Stürze möglich.' },
      { id: 'mp-simva', wirkstoff: 'Simvastatin', staerke: '20 mg', form: 'Tbl.', schema: '0-0-1-0', zuletzt: 'Samstag abends' },
    ],
    vorwerte: [
      { zeit: 'vor 2 Wochen', vorH: 336, werte: { rrSys: 138, rrDia: 82, hf: 72, gewicht: 61.5 }, kuerzel: 'AK' },
      { zeit: 'Freitag', vorH: 96, werte: { rrSys: 132, rrDia: 80, hf: 76 }, kuerzel: 'AK' },
    ],
    pflegebericht: [
      { zeit: 'vor 2 Wochen', wer: 'AK', text: 'Frau Sommer erzählt viel von ihrem Mann, weint zwischendurch. Isst weniger, „für mich allein lohnt sich das Kochen nicht“.' },
      { zeit: 'Freitag 09:30', wer: 'AK', text: 'Geduscht, Dosett gerichtet. Wirkt müde, Kühlschrank fast leer. Tochter angerufen? Nicht erreicht.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'vor 6 Monaten', wer: 'Dr. Brenner', text: 'Ramipril 5 mg und HCT 12,5 mg morgens, Simvastatin abends. RR einmal pro Woche.' },
    ],
    assessments: [
      { name: 'Sturzrisiko', wert: 'erhöht', datum: 'vor 3 Monaten', hinweis: 'Hüftarthrose, Diuretikum, lebt allein.' },
    ],
    pflegeplanung: [
      { problem: 'Eingeschränkte Selbstversorgung beim Duschen (Hüfte)', ziel: 'Duscht sicher mit Unterstützung', massnahmen: ['Duschen dienstags und freitags', 'Duschhocker'] },
    ],
    rechtliches: [
      'Keine Vorsorgevollmacht. Frau Sommer ist voll geschäftsfähig und entscheidet selbst.',
      'Auskünfte an Tochter und Nachbarin nur mit ihrer Einwilligung (noch nicht schriftlich vereinbart).',
    ],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Sie sitzt im Morgenmantel im Sessel, die Vorhänge sind zu, das Radio ist aus. „Ach, Sie sind’s. Ist schon Dienstag?“' }] },
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: 'Sie weiß, wer sie ist und wo sie ist, beim Wochentag muss sie überlegen. Spricht leise und langsam.' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: '„Mir wird schwarz vor Augen, wenn ich aufstehe. Seit Sonntag. Und ich mag nichts essen.“' }] },
    { massnahme: 'trinkmenge-erfragen', varianten: [{ text: '„Eine Tasse Tee gestern, vielleicht zwei. Ich hab keinen Durst. Und dann muss ich nicht so oft aufs Klo.“' }] },
    { massnahme: 'ersteindruck-abcde', varianten: [{ text: 'Atmet ruhig, Haut blass und trocken, wach und ansprechbar, keine Verletzung sichtbar.' }] },
    { massnahme: 'schleimhaut-pruefen', varianten: [{ text: 'Zunge trocken und belegt, Lippen rissig.' }] },
    { massnahme: 'hautturgor-pruefen', varianten: [{ text: 'Hautfalte am Handrücken bleibt kurz stehen. Im Alter allein wenig aussagekräftig.' }] },
    { massnahme: 'urin-beobachten', varianten: [{ text: 'Im Toilettenstuhl wenig dunkler Urin.' }] },
    { massnahme: 'sturzrisiko-einschaetzen', varianten: [{ text: 'Sturzrisiko hoch: Schwindel beim Aufstehen, wenig getrunken, Teppichkante im Flur, Licht im Flur kaputt, Hausnotruf in der Schublade.' }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'Im Sitzen RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig.', zeigt: ['hf'] }] },
    { massnahme: 'orthostase-pruefen', varianten: [{ text: 'Im Sitzen RR {rrSys}/{rrDia} mmHg, Puls {hf}/min. Nach einer Minute Stehen (du stützt sie) fällt der obere Wert um mehr als 20 mmHg, der Puls steigt deutlich, sie hält sich am Sessel fest. Orthostatische Reaktion, passend zu Flüssigkeitsmangel.', zeigt: ['rrSys', 'rrDia', 'hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'dosett-pruefen', varianten: [{ text: 'Die Fächer Sonntag, Montag und Dienstag sind morgens und abends noch voll. Samstag ist leer. Sie hat seit drei Tagen keine Tabletten genommen.' }] },
    { massnahme: 'umgebung-sichern', varianten: [{ text: 'Teppichkante im Flur abgeklebt, Ersatzbirne eingedreht, Weg zum Bad frei, Gehstock am Sessel.' }] },
    { massnahme: 'hausnotruf-anlegen', varianten: [{ text: 'Du holst den Hausnotruf aus der Schublade, sie legt ihn ums Handgelenk und probiert ihn mit dir aus.' }] },
    { massnahme: 'trinken-anbieten', varianten: [{ text: 'Mit dir zusammen trinkt sie ein ganzes Glas Holunderschorle. „Den hat Herbert immer gemacht.“' }] },
    { massnahme: 'fruehstueck-richten', varianten: [{ text: 'Ihr zieht die Vorhänge auf, stellt das Radio an und richtet ein Brot mit Käse. Sie isst die Hälfte und erzählt vom Nähen.' }] },
    { massnahme: 'tabletten-nachholen', varianten: [{ text: 'Du gibst ihr neun Tabletten aus drei Tagesfächern auf einmal.' }] },
    { massnahme: 'tabletten-wie-geplant-geben', varianten: [{ text: 'Sie nimmt die Ramipril-Tablette von heute mit einem Glas Wasser. Die übrigen Fächer bleiben, bis die Hausärztin den Plan ansieht.' }] },
    { massnahme: 'koerperpflege', varianten: [{ text: 'Beim Aufstehen zum Duschen wird ihr schwarz vor Augen, sie sackt auf den Duschhocker.' }] },
  ],

  gespraech: [
    { id: 'g-herbert', frage: 'Fragen, wie es ihr seit dem Tod ihres Mannes geht', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: '„Es ist so still. Herbert hat jeden Morgen das Radio angemacht und Frühstück gemacht. Für mich allein lohnt sich das alles nicht mehr.“ Sie schaut auf seinen Sessel.', setzt: ['trauer-erkannt'] }],
      wirkung: [{ groesse: 'angst', delta: -0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }],
      fakten: ['Mann Herbert vor drei Monaten gestorben', 'er machte Frühstück und Radio'] },
    { id: 'g-einwilligung', frage: 'Fragen, ob du mit ihrer Tochter und der Nachbarin über die Versorgung sprechen darfst', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      antwort: [{ text: '„Ja, sprechen Sie mit Sabine. Und Frau Öztürk ist eine Gute, die darf das wissen. Aber machen Sie meiner Tochter keine Angst.“', setzt: ['einwilligung-tochter', 'einwilligung-nachbarin'] }] },
    { id: 'g-tochter', frage: 'Tochter Sabine anrufen: Was du beobachtet hast und was heute geplant ist', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      schweigepflicht: { erlaubtWenn: { flag: 'einwilligung-tochter' },
        fehlerText: 'Frau Sommer ist geschäftsfähig und entscheidet selbst, wer was erfährt. Erst ihre Einwilligung einholen, dann die Tochter informieren.' },
      antwort: [{ text: '„Oh nein, das wusste ich nicht. Am Telefon sagt sie immer, alles ist gut. Ich komme am Wochenende und rufe ab jetzt jeden Abend an.“', setzt: ['tochter-informiert'] }],
      fakten: ['Tochter wohnt in Stuttgart', 'kommt am Wochenende'] },
    { id: 'g-nachbarin', frage: 'Frau Öztürk fragen, ob sie heute Abend und in den nächsten Tagen kurz nach Frau Sommer schauen kann', an: 'angehoerige', nurWenn: { ab: 600 }, kompetenzbereiche: ['II', 'III'],
      schweigepflicht: { erlaubtWenn: { flag: 'einwilligung-nachbarin' },
        fehlerText: 'Die Nachbarin darf nur mit Einwilligung von Frau Sommer erfahren, wie es ihr gesundheitlich geht.' },
      antwort: [{ text: '„Natürlich, ich bring ihr abends Suppe und schau, ob sie getrunken hat. Ich hab mich schon gewundert, dass das Radio aus ist.“', setzt: ['nachbarin-hilft'] }] },
  ],

  sbar: [
    { id: 's-sommer', teil: 'S', text: 'Frau Sommer, 79: seit Sonntag Schwindel beim Aufstehen, trinkt und isst kaum, wirkt zurückgezogen.', art: 'kern' },
    { id: 's-muede', teil: 'S', text: 'Frau Sommer ist heute müde.', art: 'ablenker' },
    { id: 'b-witwe', teil: 'B', text: 'Lebt allein, Ehemann vor drei Monaten gestorben. Ramipril und Hydrochlorothiazid morgens.', art: 'kern' },
    { id: 'b-schneiderin', teil: 'B', text: 'Sie war Schneiderin.', art: 'ablenker' },
    { id: 'a-orthostase', teil: 'A', text: 'Beim Aufstehen fällt der Blutdruck deutlich, Puls steigt, ihr wird schwarz vor Augen. Zunge trocken.', art: 'kern', bekanntWenn: { getan: 'orthostase-pruefen' } },
    { id: 'a-dosett', teil: 'A', text: 'Seit drei Tagen keine Tabletten genommen, Dosett-Fächer Sonntag bis heute voll.', art: 'kern', bekanntWenn: { getan: 'dosett-pruefen' } },
    { id: 'a-trauer', teil: 'A', text: 'Gedrückte Stimmung, sozialer Rückzug seit dem Tod des Mannes: „Für mich allein lohnt sich das nicht.“', art: 'kern', bekanntWenn: TRAUER },
    { id: 'a-gedanken', teil: 'A', text: 'Sie hat Gedanken, lieber nicht mehr da zu sein, aber keine Pläne. Ich habe nachgefragt.', art: 'hilfreich', bekanntWenn: { flag: 'todeswunsch-nachgefragt' } },
    { id: 'a-versorgung', teil: 'A', text: 'Versorgung abgesprochen: Nachbarin schaut abends, Tochter ruft täglich an, Hausnotruf trägt sie.', art: 'kern', bekanntWenn: { flag: 'versorgung-abgesprochen' } },
    { id: 'a-alter', teil: 'A', text: 'Sie ist halt alt und müde, das wird schon wieder.', art: 'falsch' },
    { id: 'r-besuch', teil: 'R', text: 'Bitte heute einen Hausbesuch: Kreislauf, Medikamente und Stimmung ansehen. Wie gehe ich mit den vergessenen Tabletten um?', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-nachholen', massnahme: 'tabletten-nachholen', text: 'Vergessene Tabletten von Sonntag bis heute jetzt auf einmal geben.',
      fehlerhaft: {
        warum: 'Vergessene Tagesdosen werden nicht nachgeholt. Dreimal Ramipril und dreimal Hydrochlorothiazid auf einmal würden den Blutdruck stark senken und noch mehr entwässern: Sturz, Kollaps, Nierenschaden. Sie hat schon jetzt Schwindel beim Aufstehen.',
        korrektur: 'Stimmt, das war falsch. Nur Ramipril von heute, das Hydrochlorothiazid lassen wir weg, bis ich da war. Die alten Fächer bitte nicht geben.',
        ersatz: 'an-heute',
      } },
    { id: 'an-heute', massnahme: 'tabletten-wie-geplant-geben', text: 'Heute nur Ramipril 5 mg. Hydrochlorothiazid pausieren bis zum Hausbesuch, vergessene Fächer nicht nachgeben.' },
    { id: 'an-trinken', massnahme: 'trinken-anbieten', text: 'Trinken fördern, Ziel 1,5 l am Tag, Trinkplan mit Lieblingsgetränken.' },
  ],

  arzt: {
    name: 'Hausärztin Dr. Brenner',
    erreichbar: 'hausarzt-praxis',
    regeln: [
      REGEL_VOLL,
      { id: 'r-stimmung', wenn: { gemeldet: ['a-orthostase', 'a-dosett', 'wert:rrSys'] },
        antwort: '„Das passt zu wenig Trinken. Aber warum nimmt sie auf einmal ihre Tabletten nicht?“',
        rueckfrage: { text: '„Wie wirkt sie sonst auf Sie? Hat sich bei ihr etwas verändert?“', erwartet: ['a-trauer'], auftrag: 'af-stimmung' } },
      { wenn: { gemeldet: ['a-alter'] }, antwort: '„Dann soll sie mehr trinken, ich schaue nächste Woche mal vorbei.“', setzt: ['arzt-beruhigt'] },
      { wenn: { gemeldet: ['s-sommer'] }, antwort: '„Haben Sie den Blutdruck im Sitzen und im Stehen gemessen? Nimmt sie ihre Tabletten? Melden Sie sich mit genaueren Beobachtungen.“' },
    ],
    auftraege: [
      { id: 'af-stimmung', text: 'Mit Frau Sommer sprechen, wie es ihr geht, und der Hausärztin schreiben', erledigt: TRAUER, meldung: ['a-trauer'], meldenBinnenSek: 900, folge: [REGEL_VOLL] },
      { id: 'af-abend', text: 'Klären, wer heute Abend nach Frau Sommer schaut, und der Hausärztin Bescheid geben', erledigt: { flag: 'versorgung-abgesprochen' },
        meldung: ['a-versorgung'], meldenBinnenSek: 2100,
        folge: [{ wenn: { ab: 0 }, antwort: '„Sehr gut, dann bin ich beruhigt. Ich komme um 15 Uhr und spreche mit ihr auch über die Stimmung.“', setzt: ['abend-gemeldet'] }] },
    ],
  },

  ereignisse: [
    { id: 'e-gedanken', art: 'patient', wann: { alle: [TRAUER, { ab: 120 }] },
      text: 'Frau Sommer schaut aus dem Fenster und sagt leise: „Manchmal denke ich, es wäre besser, ich wäre auch nicht mehr da.“',
      entscheidung: [
        { id: 'w-nachfragen', text: 'Ruhig und direkt nachfragen: „Denken Sie daran, sich etwas anzutun?“ Zuhören, ernst nehmen', wertung: 'gut', setzt: ['todeswunsch-nachgefragt'],
          warum: 'Offenes Nachfragen erhöht das Risiko nicht, es entlastet. Sie antwortet: „Nein, so was mache ich nicht. Ich will ja meine Enkelin noch aufwachsen sehen.“ Die Hausärztin muss davon wissen.' },
        { id: 'w-ablenken', text: '„Ach, sagen Sie doch so was nicht. Das wird schon wieder.“', wertung: 'falsch', warum: 'Beschwichtigen schließt das Thema. Todeswünsche im Alter werden oft übersehen und brauchen Nachfragen und ärztliche Abklärung.' },
        { id: 'w-weiter', text: 'Nicht darauf eingehen und mit dem Dosett weitermachen', wertung: 'gefaehrlich', warum: 'Eine solche Äußerung zu überhören ist gefährlich. Nachfragen, dokumentieren, weitergeben.' },
      ] },
    { id: 'e-toilette', art: 'patient', wann: { ab: 900 },
      text: '„Ich muss mal schnell aufs Klo.“ Sie stemmt sich aus dem Sessel hoch.',
      entscheidung: [
        { id: 'w-begleiten', text: 'Erst einen Moment auf der Sesselkante sitzen lassen, dann mit Gehstock begleiten', wertung: 'gut', warum: 'Bei orthostatischer Reaktion langsam aufstehen, kurz sitzen, Füße bewegen, begleiten.' },
        { id: 'w-allein', text: 'Sie allein gehen lassen, du schreibst weiter', wertung: 'gefaehrlich', warum: 'Mit Schwindel beim Aufstehen und Flüssigkeitsmangel ist das Sturzrisiko hoch.', setzt: ['allein-gegangen'] },
      ] },
    { id: 'e-sturz', art: 'komplikation', wann: { flag: 'allein-gegangen' }, verhindertDurch: { getan: 'umgebung-sichern' },
      text: 'Aus dem Flur ein dumpfer Schlag: Frau Sommer ist an der Teppichkante gestürzt und hält sich die Hüfte.',
      bild: { haltung: 'am-boden', mimik: 'schmerz' } },
    { id: 'e-nachbarin', art: 'angehoerige', wann: { ab: 600 },
      text: 'Es klingelt. Frau Öztürk von nebenan: „Ist alles gut bei Frau Sommer? Das Radio ist seit Tagen aus.“' },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Keßler',
    hilfen: [
      { wenn: { nicht: { getan: 'dosett-pruefen' } }, impuls: 'Freitag habt ihr das Dosett gerichtet. Was erzählt es dir heute?', tipp: 'Schau, welche Fächer leer und welche noch voll sind.' },
      { wenn: { nicht: { getan: 'orthostase-pruefen' } }, impuls: 'Ihr wird schwarz vor Augen beim Aufstehen. Wie kannst du das messen?', tipp: 'Blutdruck und Puls im Sitzen und nach einer Minute Stehen vergleichen, dabei stützen.' },
      { wenn: { nicht: TRAUER }, impuls: 'Radio aus, Vorhänge zu, Morgenmantel. Was hat sich in ihrem Leben verändert?', tipp: 'Sprich sie auf ihren Mann an und hör zu.' },
      { wenn: { auftrag: 'af-stimmung', status: 'offen' }, impuls: 'Die Hausärztin wollte wissen, wie Frau Sommer sonst wirkt.', tipp: 'Sprich mit ihr über die Zeit seit dem Tod ihres Mannes und schreib der Ärztin.' },
      { wenn: { alle: [{ auftrag: 'af-abend', status: 'offen' }, { nicht: { auftrag: 'af-abend', status: 'gemeldet' } }] }, impuls: 'Wer ist heute Abend für sie da?', tipp: 'Mit Frau Sommer, der Tochter und der Nachbarin die Versorgung absprechen und der Ärztin Bescheid geben.' },
      { impuls: 'Wer muss noch Bescheid wissen?', tipp: 'Pflegedienstleitung (Einsätze anpassen, Pflegeberatung), und alles in den Pflegebericht.' },
    ],
  },
  team: { kollegin: 'Pflegedienstleitung Frau Arndt (Telefon)', weitere: { angehoerige: 'Tochter Sabine (Telefon), Nachbarin Frau Öztürk' } },

  bewertung: {
    pflicht: [
      { id: 'p-dosett', text: 'Dosett geprüft: drei Tage Tabletten nicht genommen', gewicht: 3, kompetenzbereiche: ['I', 'IV'], erfuellt: { getan: 'dosett-pruefen' },
        warum: 'Das volle Dosett ist ein klares Zeichen, dass die Selbstversorgung gerade nicht gelingt.' },
      { id: 'p-orthostase', text: 'Kreislauf beim Aufstehen geprüft (Orthostase)', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'orthostase-pruefen' },
        warum: 'Schwindel beim Aufstehen braucht eine Messung im Sitzen und Stehen, nicht nur einen Wert im Sitzen.' },
      { id: 'p-trocken', text: 'Zeichen von Flüssigkeitsmangel geprüft', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: TROCKEN,
        warum: 'Trockene Zunge und wenig dunkler Urin sind im Alter verlässlicher als die Hautfalte.' },
      { id: 'p-trauer', text: 'Trauer und Rückzug angesprochen', gewicht: 3, kompetenzbereiche: ['I', 'II'], erfuellt: TRAUER,
        warum: 'Hinter Stille, Appetitlosigkeit und vergessenen Tabletten steht der Verlust ihres Mannes. Lebensweltorientiert pflegen heißt, das zu sehen.' },
      { id: 'p-todeswunsch', text: 'Todesgedanken offen nachgefragt', gewicht: 3, kompetenzbereiche: ['I', 'II'], erfuellt: { flag: 'todeswunsch-nachgefragt' },
        warum: 'Hochbetagte, verwitwete, allein lebende Menschen haben ein erhöhtes Suizidrisiko. Nachfragen schützt.' },
      { id: 'p-trinken', text: 'Trinken angeboten (Lieblingsgetränk)', gewicht: 2, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'trinken-anbieten' },
        warum: 'Gemeinsam und mit dem, was sie mag, trinkt sie eher.' },
      { id: 'p-arzt', text: 'Hausärztin mit Kreislauf, Dosett und Stimmung informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Medikation, Flüssigkeitsmangel und gedrückte Stimmung gehören ärztlich abgeklärt.' },
      { id: 'p-remonstration', text: 'Anordnung „vergessene Tabletten nachholen“ hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-nachholen' },
        warum: 'Mehrere Tagesdosen Blutdrucksenker und Entwässerung auf einmal können zum Kollaps führen.' },
      { id: 'p-versorgung', text: 'Versorgung zu Hause abgesprochen (Nachbarin, Tochter, Hausnotruf)', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'versorgung-abgesprochen' },
        warum: 'Sie lebt allein. Das Netz aus Nachbarschaft, Familie und Dienst muss heute Abend tragen.' },
      { id: 'p-einwilligung', text: 'Einwilligung eingeholt, bevor Tochter und Nachbarin einbezogen wurden', gewicht: 2, kompetenzbereiche: ['II', 'IV'], erfuellt: { alle: [{ flag: 'einwilligung-tochter' }, { flag: 'tochter-informiert' }] },
        warum: 'Frau Sommer ist geschäftsfähig und bestimmt selbst, wer was über sie erfährt.' },
      { id: 'p-rueckauftrag', text: 'Rückauftrag erledigt und gemeldet (wer schaut heute Abend)', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-abend', status: 'gemeldet' },
        warum: 'Die Ärztin muss wissen, dass sie nicht allein bleibt.' },
      { id: 'p-pdl', text: 'Pflegedienstleitung informiert (Einsätze, Pflegeberatung)', gewicht: 1, kompetenzbereiche: ['III'], erfuellt: { getan: 'pdl-informieren' },
        warum: 'Häufigere Besuche, Pflegeberatung und Entlastungsangebote organisiert die PDL.' },
      { id: 'p-doku', text: 'Pflegebericht mit Orthostase, Dosett und hinterfragter Anordnung', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ getan: 'pflegebericht' }, { dokumentiert: 'a-dosett' }, { dokumentiert: 'anordnung:an-nachholen' }] },
        warum: 'Beobachtungen, Todesgedanken, Absprachen und die Rückfrage zur Medikation müssen nachvollziehbar sein.' },
    ],
    fehler: [
      { id: 'f-nachholen', text: 'Vergessene Tabletten auf einmal gegeben', schwere: 'schwer', kompetenzbereiche: ['I', 'III'], wenn: { getan: 'tabletten-nachholen' },
        folge: { text: 'Eine halbe Stunde später ist ihr selbst im Sitzen schwindlig.', wirkung: [{ groesse: 'gefaesstonus', delta: -0.12, beginnSek: 600, spitzeSek: 3600, dauerSek: 'dauerhaft' }, { groesse: 'volumen', delta: -0.04, beginnSek: 600, spitzeSek: 3600, dauerSek: 'dauerhaft' }] },
        warum: 'Mehrere Tagesdosen auf einmal senken den Blutdruck stark und entwässern weiter.' },
      { id: 'f-duschen', text: 'Duschen wie geplant trotz Schwindel und Flüssigkeitsmangel', schwere: 'mittel', kompetenzbereiche: ['I', 'V'], wenn: { getan: 'koerperpflege' },
        warum: 'Warmes Wasser weitet die Gefäße; mit Orthostase droht ein Kollaps. Heute lieber am Waschbecken im Sitzen.' },
      { id: 'f-alter', text: 'Veränderung als „alt und müde“ gemeldet', schwere: 'mittel', kompetenzbereiche: ['I', 'II'], wenn: { flag: 'arzt-beruhigt' },
        warum: 'Rückzug und Selbstvernachlässigung nach einem Verlust brauchen Aufmerksamkeit und ärztliche Abklärung.' },
      { id: 'f-112', text: 'Rettungsdienst gerufen ohne akuten Notfall', schwere: 'leicht', kompetenzbereiche: ['III'], wenn: { getan: 'notruf-112' },
        warum: 'Die Lage ist ernst, aber nicht akut lebensbedrohlich. Hausärztin und Netzwerk sind der richtige Weg.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { flag: 'versorgung-abgesprochen' }, { getan: 'pflegebericht' }, { flag: 'abend-gemeldet' }] },
        text: 'Das Radio läuft, die Vorhänge sind offen. Frau Sommer trägt den Hausnotruf, Frau Öztürk kommt am Abend, die Hausärztin um 15 Uhr.', ausgang: 'stabil' },
      { wenn: { ab: 2700 }, text: 'Die Tour muss weiter. Frau Sommer bleibt allein im dunklen Wohnzimmer, das Glas steht unberührt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-trauer', text: 'Trauer und sozialer Rückzug nach dem Tod des Ehemanns, Selbstvernachlässigung', richtig: true, prioritaet: 1, warum: 'Isst und trinkt kaum, nimmt keine Tabletten, Radio und Vorhänge bleiben zu.' },
      { id: 'pb-fluessigkeit', text: 'Flüssigkeitsdefizit mit Schwindel beim Aufstehen', richtig: true, prioritaet: 1, warum: 'Trockene Zunge, dunkler Urin, orthostatische Reaktion.' },
      { id: 'pb-sturz', text: 'Erhöhtes Sturzrisiko', richtig: true, prioritaet: 2, warum: 'Orthostase, Teppichkante, kaputtes Flurlicht, lebt allein.' },
      { id: 'pb-medikation', text: 'Medikamente werden nicht zuverlässig eingenommen', richtig: true, prioritaet: 2, warum: 'Drei Tage volle Dosettfächer.' },
      { id: 'pb-demenz', text: 'Beginnende Demenz', richtig: false, warum: 'Dafür gibt es keine Hinweise; sie ist orientiert. Rückzug und Vergessen erklären sich durch Trauer und Flüssigkeitsmangel.' },
    ],
    ziele: [
      { id: 'z-kontakt', text: 'Frau Sommer hat täglich Kontakt (Nachbarin, Tochter, Pflegedienst) und nimmt ein Gesprächsangebot an.', passtZu: ['pb-trauer'], richtig: true },
      { id: 'z-trinken', text: 'Frau Sommer trinkt täglich mindestens 1,5 l, ihr ist beim Aufstehen nicht mehr schwindlig.', passtZu: ['pb-fluessigkeit'], richtig: true },
      { id: 'z-sturz', text: 'Frau Sommer stürzt nicht und trägt den Hausnotruf.', passtZu: ['pb-sturz'], richtig: true },
      { id: 'z-heim', text: 'Frau Sommer zieht in ein Pflegeheim.', passtZu: ['pb-trauer'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Die Wohnung erzählt mit', text: 'Ambulante Pflege sieht die Lebenswelt: Radio, Vorhänge, Kühlschrank, Dosett, Post. Veränderungen gegenüber dem Gewohnten sind oft das erste Zeichen, dass die Selbstversorgung nicht mehr gelingt.', quellen: ['dnqp-ernaehrung'] },
    { titel: 'Trauer, Rückzug und Todesgedanken im Alter', text: 'Nach dem Verlust des Partners ist Trauer normal. Wenn Essen, Trinken, Medikamente und Kontakte wegbrechen, braucht es Begleitung und ärztliche Abklärung (Depression). Äußerungen wie „besser nicht mehr da“ offen nachfragen, ernst nehmen, dokumentieren und an die Hausärztin weitergeben.', quellen: ['s3-depression'] },
    { titel: 'Orthostase und Stürze', text: 'Blutdruck im Sitzen und nach einer Minute Stehen vergleichen. Fällt der obere Wert um 20 mmHg oder mehr, langsam aufstehen, kurz sitzen bleiben, ausreichend trinken, Stolperfallen beseitigen, Hausnotruf tragen.', quellen: ['dnqp-sturz'] },
    { titel: 'Vergessene Tabletten', text: 'Vergessene Tagesdosen werden in der Regel nicht nachgeholt, schon gar nicht mehrere auf einmal. Bei Blutdrucksenkern und Entwässerung drohen Kollaps und Nierenschaden. Immer ärztlich rückfragen, Plan anpassen lassen.', quellen: ['priscus'] },
    { titel: 'Netz knüpfen', text: 'Mit Einwilligung der Klientin Familie, Nachbarschaft und Dienste einbinden: Pflegeberatung (§ 7a SGB XI), Entlastungsbetrag für Besuchsdienste, Essen auf Rädern, Hausnotruf, Trauercafé.', quellen: ['sgb-xi'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'ersteindruck-abcde' },
      { art: 'massnahme', id: 'beschwerden-erfragen' },
      { art: 'massnahme', id: 'schleimhaut-pruefen' },
      { art: 'massnahme', id: 'trinken-anbieten' },
      { art: 'frage', id: 'g-herbert' },
      { art: 'massnahme', id: 'dosett-pruefen' },
      { art: 'pflegetasche', geraet: 'rr-geraet' },
      { art: 'massnahme', id: 'orthostase-pruefen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-sommer', 'b-witwe', 'a-orthostase', 'a-dosett', 'a-trauer', 'a-gedanken', 'wert:rrSys', 'r-besuch'] },
      { art: 'remonstrieren', anordnung: 'an-nachholen', grund: 'Drei Tage Blutdrucktabletten und Entwässerung auf einmal? Sie hat schon Schwindel beim Aufstehen.' },
      { art: 'rueckmelden', anordnung: 'an-heute', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-trinken', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'tabletten-wie-geplant-geben' },
      { art: 'massnahme', id: 'fruehstueck-richten' },
      { art: 'frage', id: 'g-einwilligung' },
      { art: 'frage', id: 'g-tochter' },
      { art: 'frage', id: 'g-nachbarin' },
      { art: 'massnahme', id: 'umgebung-sichern' },
      { art: 'massnahme', id: 'hausnotruf-anlegen' },
      { art: 'massnahme', id: 'versorgung-zuhause-absprechen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['a-versorgung'] },
      { art: 'massnahme', id: 'pdl-informieren' },
      { art: 'dokumentieren', bausteine: ['a-orthostase', 'a-dosett', 'a-trauer', 'a-gedanken', 'anordnung:an-nachholen', 'anordnung:an-heute'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-trauer', 'pb-fluessigkeit', 'pb-sturz', 'pb-medikation'], ziele: ['z-kontakt', 'z-trinken', 'z-sturz'],
        sbar: ['s-sommer', 'b-witwe', 'a-orthostase', 'a-dosett', 'a-trauer'] },
    ],
    unterlassung: { bisSek: 2400, erwartet: { wert: 'hydratation', vergleich: '<', grenze: 0.825 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'tabletten-nachholen' }], erwartet: 'pa-eingriff' },
  },
};
