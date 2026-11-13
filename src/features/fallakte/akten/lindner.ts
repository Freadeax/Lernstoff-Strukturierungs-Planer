// Fallakte „Frau Lindner zieht ein“: eine Person vom Erstgespräch bis zum Anruf bei der Hausärztin.
// Alle Personen, Einrichtungen und Werte sind frei erfunden.
//
// Jeder Teilfall steht zusätzlich in der Liste seines Trainers (SIS, Assessment, Pflegeplanung,
// Pflegebericht, Übergabe) und wird dort mit derselben Prüfung per Code bewertet wie jeder andere Fall.
// Die Werte müssen über alle Teilfälle zusammenpassen (akten.test.ts prüft die wichtigsten).
// Nur Typen importieren: die Trainer-Listen importieren diese Datei.
import type { SisFall } from '../../sis/faelle';
import type { Vignette } from '../../assessment/vignetten';
import type { PlanFall } from '../../pflegeplanung/faelle';
import type { BerichtFall } from '../../bericht/faelle';
import type { Fall as UebergabeFall } from '../../uebergabe/faelle';
import type { SbarEreignis } from '../../uebergabe/grundkriterien';
import type { Fallakte } from '../typen';

const NAME = 'Margarete Lindner';

export const LINDNER_SIS: SisFall = {
  id: 'lindner',
  titel: 'Fallakte: Einzug mit Herzschwäche',
  setting: 'stationaer',
  anlass: 'Einzug in die stationäre Langzeitpflege nach Krankenhausaufenthalt wegen Herzinsuffizienz',
  person: [
    { label: 'Name', wert: `${NAME}, 82 Jahre` },
    { label: 'Gespräch', wert: 'Am Einzugstag mit Frau Lindner und ihrem Sohn Thomas Lindner' },
  ],
  gespraech: [
    { wer: 'Frau Lindner', text: 'Ich bekomme so schnell keine Luft. Nach ein paar Schritten muss ich stehen bleiben, und das macht mir Angst.' },
    { wer: 'Frau Lindner', text: 'Ins Bett will ich tagsüber nicht. Am liebsten sitze ich im Sessel am Fenster, da sehe ich die Vögel.' },
    { wer: 'Frau Lindner', text: 'Flach liegen geht nachts nicht mehr, ich brauche zwei Kissen im Rücken.' },
    { wer: 'Frau Lindner', text: 'Mit der Wassertablette muss ich ständig rennen. Manchmal schaffe ich es nicht, dann ist die Einlage nass. Darüber rede ich nicht gern.' },
    { wer: 'Frau Lindner', text: 'Die Knie tun beim Aufstehen weh, so eine Fünf. Wenn ich erst stehe, geht es.' },
    { wer: 'Frau Lindner', text: 'Beim Waschen komme ich an die Beine nicht mehr ran, dann fehlt mir die Luft.' },
    { wer: 'Frau Lindner', text: 'Ich war Schneiderin. Handarbeiten mache ich immer noch gern, mit Lesebrille geht das.' },
    { wer: 'Frau Lindner', text: 'Um sieben stehe ich auf, das war immer so. Und morgens brauche ich meinen Kaffee, auch wenn ich nicht so viel trinken darf.' },
    { wer: 'Sohn', text: 'Ich komme jeden Sonntag. Meine Mutter ist allein in der Wohnung zweimal gestürzt, so ging es nicht mehr.' },
    { wer: 'Frau Lindner', text: 'Mein Nähkorb und das Bild von meinem Mann sollen mit ins Zimmer.' },
  ],
  beobachtungen: [
    'Geht mit dem Rollator etwa 30 Meter über den Flur, dann bleibt sie stehen und atmet schwer (Atemfrequenz 24/min, in Ruhe 18/min).',
    'Beim Aufstehen aus dem Sessel stützt sie sich ab und braucht einen Moment; sie möchte, dass jemand daneben steht.',
    'Beide Unterschenkel sind geschwollen, nach Fingerdruck bleibt eine Delle stehen. Gewicht bei Einzug 71,4 kg.',
    'Wach, zu allen Qualitäten orientiert, hört gut, liest mit Lesebrille.',
    'Haut am Gesäß intakt, am Steiß eine wegdrückbare Rötung. Sie sitzt viele Stunden im Sessel.',
    'Sie isst etwa zwei Drittel der Portionen und sagt, mit Atemnot schmecke nichts.',
  ],
  unterlagen: [
    { label: 'Diagnosen', wert: 'Herzinsuffizienz NYHA III nach Dekompensation, Vorhofflimmern, Diabetes mellitus Typ 2, Gonarthrose beidseits' },
    { label: 'Medikamente', wert: 'Torasemid 10 mg morgens, Bisoprolol, Ramipril, Apixaban, Metformin, Metamizol bei Bedarf' },
    { label: 'Ärztliche Vorgabe', wert: 'Täglich morgens vor dem Frühstück wiegen. Mehr als 1 kg an einem Tag oder mehr als 2 kg in drei Tagen sofort der Hausärztin melden. Trinkmenge höchstens 1,5 l am Tag.' },
    { label: 'Hilfsmittel', wert: 'Rollator, Lesebrille, Duschhocker' },
  ],
  kernpunkte: [
    { id: 'b-luft', feld: 'B', pflicht: true, text: 'Angst, weil sie schnell keine Luft bekommt', muster: ['luft', 'atem', 'angst'] },
    { id: 'b-sessel', feld: 'B', pflicht: true, text: 'Möchte tagsüber nicht ins Bett, sitzt gern im Sessel am Fenster', muster: ['sessel', 'fenster', 'bett'] },
    { id: 'b-sachen', feld: 'B', pflicht: false, text: 'Nähkorb und Bild ihres Mannes sollen mit', muster: ['naehkorb', 'bild', 'mann'] },
    { id: 'tf1-orientiert', feld: 'TF1', pflicht: true, text: 'Orientiert, entscheidet selbst', muster: ['orientiert', 'klar', 'entscheid'] },
    { id: 'tf1-brille', feld: 'TF1', pflicht: false, text: 'Hört gut, liest mit Lesebrille', muster: ['lesebrille', 'brille', 'hoert'] },
    { id: 'tf2-rollator', feld: 'TF2', pflicht: true, text: 'Geht mit Rollator etwa 30 m, dann Pause wegen Atemnot', muster: ['rollator', '30 m'] },
    { id: 'tf2-aufstehen', feld: 'TF2', pflicht: true, text: 'Aufstehen aus dem Sessel mit Abstützen, möchte jemanden daneben', muster: ['aufstehen', 'abstuetz', 'transfer'] },
    { id: 'tf2-sturz', feld: 'TF2', pflicht: true, text: 'Zweimal zu Hause gestürzt', muster: ['sturz', 'gestuerzt', 'gefallen'] },
    { id: 'tf3-herz', feld: 'TF3', pflicht: true, text: 'Herzinsuffizienz mit Atemnot bei Belastung, Ödeme an beiden Unterschenkeln', muster: ['herzinsuff', 'herzschwaech', 'oedem', 'geschwollen'] },
    { id: 'tf3-gewicht', feld: 'TF3', pflicht: true, text: 'Täglich wiegen mit Meldegrenzen, Trinkmenge höchstens 1,5 l', muster: ['wieg', 'gewicht', '1,5'] },
    { id: 'tf3-knie', feld: 'TF3', pflicht: true, text: 'Knieschmerz NRS 5 beim Aufstehen (Arthrose)', muster: ['knie', 'arthrose'], auchIn: ['TF2'], begruendung: 'Schmerz ist krankheitsbezogen (TF3). Weil er vor allem beim Aufstehen stört, ist er in TF2 ebenfalls vertretbar.' },
    { id: 'tf3-blutverduennung', feld: 'TF3', pflicht: false, text: 'Blutverdünnung mit Apixaban (Blutungsgefahr bei Sturz)', muster: ['apixaban', 'blutverduenn', 'antikoag', 'gerinnung'] },
    { id: 'tf3-schlafen', feld: 'TF3', pflicht: false, text: 'Kann nur mit erhöhtem Oberkörper schlafen', muster: ['kissen', 'erhoeht', 'flach'], auchIn: ['TF6'], begruendung: 'Die Atemnot im Liegen gehört zur Herzerkrankung (TF3). Als Schlafgewohnheit ist sie auch in TF6 vertretbar.' },
    { id: 'tf4-waschen', feld: 'TF4', pflicht: true, text: 'Wäscht Oberkörper selbst, Hilfe an Rücken, Beinen und Füßen (Atemnot beim Bücken)', muster: ['beine', 'fuesse', 'ruecken', 'unterkoerper'] },
    { id: 'tf4-kontinenz', feld: 'TF4', pflicht: true, text: 'Schafft es durch die Wassertablette nicht immer zur Toilette, Einlage, spricht ungern darüber', muster: ['einlage', 'toilette', 'inkontinen', 'harndrang', 'rechtzeitig'], auchIn: ['TF3'], begruendung: 'Kontinenz gehört zur Selbstversorgung (TF4). Als Folge des Diuretikums ist sie in TF3 ebenfalls vertretbar.' },
    { id: 'tf4-essen', feld: 'TF4', pflicht: true, text: 'Isst etwa zwei Drittel, wenig Appetit bei Atemnot', muster: ['zwei drittel', '2/3', 'appetit', 'schmeckt'] },
    { id: 'tf5-sohn', feld: 'TF5', pflicht: true, text: 'Sohn kommt jeden Sonntag', muster: ['sohn'] },
    { id: 'tf5-handarbeit', feld: 'TF5', pflicht: true, text: 'War Schneiderin, macht gern Handarbeiten', muster: ['schneider', 'handarbeit', 'naeh'] },
    { id: 'tf6-zimmer', feld: 'TF6', pflicht: true, text: 'Sessel am Fenster, Nähkorb und Bild des Mannes im Zimmer', muster: ['sessel', 'fenster', 'naehkorb', 'bild'] },
    { id: 'tf6-morgens', feld: 'TF6', pflicht: true, text: 'Steht um 7 Uhr auf, möchte morgens Kaffee', muster: ['7 uhr', 'sieben', 'kaffee'] },
  ],
  matrix: [
    { risiko: 'dekubitus', vorhanden: 'ja', weitere: 'ja', themenfelder: ['TF2', 'TF3', 'TF4'], begruendung: 'Sitzt viele Stunden im Sessel, Ödeme, wegdrückbare Rötung am Steiß, Feuchtigkeit durch die Einlage. Braden-Skala erheben und die Haut täglich ansehen.' },
    { risiko: 'sturz', vorhanden: 'ja', weitere: 'ja', themenfelder: ['TF2', 'TF3'], begruendung: 'Zwei Stürze zu Hause, Atemnot beim Gehen, Knieschmerz beim Aufstehen, Harndrang durch das Diuretikum. Wegen der Blutverdünnung sind Sturzfolgen schwerer.' },
    { risiko: 'inkontinenz', vorhanden: 'ja', weitere: 'ja', themenfelder: ['TF4', 'TF3'], begruendung: 'Kommt unter Torasemid nicht immer rechtzeitig zur Toilette. Kontinenzprofil erheben (Expertenstandard Kontinenzförderung).' },
    { risiko: 'schmerz', vorhanden: 'ja', weitere: 'beides', themenfelder: ['TF3', 'TF2'], begruendung: 'Knieschmerz NRS 5 beim Aufstehen. Sie kann ihn selbst gut einschätzen; ob eine ausführlichere Schmerzeinschätzung nötig ist, regelt der Hausstandard.' },
    { risiko: 'ernaehrung', vorhanden: 'beides', weitere: 'ja', themenfelder: ['TF4', 'TF3'], begruendung: 'Isst nur zwei Drittel, die Trinkmenge ist begrenzt. Das Gewicht taugt wegen der Ödeme nicht als Ernährungshinweis, ein Ernährungsscreening ist sinnvoll.' },
    { risiko: 'sonstiges', vorhanden: 'ja', weitere: 'ja', themenfelder: ['TF3'], welches: ['herz', 'atem', 'luft', 'dekompens', 'gewicht', 'oedem', 'wasser'], begruendung: 'Erneute Verschlechterung der Herzinsuffizienz: täglich Gewicht, Ödeme und Atemnot beobachten, die Meldegrenzen der Hausärztin einhalten.' },
  ],
  muster: {
    B: '„Ich bekomme so schnell keine Luft, nach ein paar Schritten muss ich stehen bleiben. Das macht mir Angst.“ „Ins Bett will ich tagsüber nicht, am liebsten sitze ich im Sessel am Fenster.“ „Mein Nähkorb und das Bild von meinem Mann sollen mit.“',
    TF1: 'Frau Lindner ist wach und orientiert und entscheidet selbst. Sie hört gut und liest mit Lesebrille. Sie möchte bei allen Absprachen zu ihrer Behandlung dabei sein.',
    TF2: 'Mit dem Rollator schafft sie etwa 30 m, dann muss sie wegen der Atemnot stehen bleiben. Aus dem Sessel kommt sie nur hoch, wenn sie sich mit beiden Händen abstützt. Zu Hause ist sie zweimal gestürzt. Vereinbart: Auf dem Flur steht ein Stuhl für Pausen, beim Aufstehen bleibt jemand von uns dabei.',
    TF3: 'Herzinsuffizienz mit Atemnot bei Belastung, beide Unterschenkel sind geschwollen (Ödeme). Nachts schläft sie nur mit erhöhtem Oberkörper auf zwei Kissen. Die Hausärztin hat tägliches Wiegen am Morgen angeordnet; eine Zunahme über den Grenzwerten wird gemeldet, getrunken werden höchstens 1,5 l. Knieschmerzen durch Arthrose beim Aufstehen (NRS 5). Blutverdünnung mit Apixaban, Diabetes Typ 2 mit Tabletten. Sie ist einverstanden, dass wir Gewicht und Trinkmenge jeden Tag festhalten.',
    TF4: 'Gesicht und Oberkörper wäscht sie selbst am Waschbecken; Rücken, Beine und Füße übernehmen wir, weil ihr beim Bücken die Luft fehlt. Geduscht wird mit Hilfe auf dem Duschhocker. Sie isst etwa zwei Drittel der Portionen und sagt, bei Atemnot schmecke nichts. Durch die Wassertablette kommt sie nicht immer rechtzeitig zur Toilette und trägt Einlagen; darüber spricht sie ungern. Gewünscht: Wir bieten ihr die Toilette vor und nach den Mahlzeiten an.',
    TF5: 'Der Sohn kommt jeden Sonntag. Frau Lindner war Schneiderin und macht gern Handarbeiten; sie möchte an der Handarbeitsgruppe im Haus teilnehmen.',
    TF6: 'Ihr Sessel steht am Fenster, Nähkorb und das Bild ihres Mannes sind im Zimmer. Sie steht gewohnt um 7 Uhr auf und möchte morgens ihren Kaffee, der in die Trinkmenge eingerechnet wird. Klingel und Rollator stehen in Reichweite.',
  },
};

export const LINDNER_BRADEN: Vignette = {
  id: 'br-lindner', gruppe: 'braden', instrument: 'braden', titel: 'Frau Lindner, 82 Jahre (Fallakte)', setting: 'Stationäre Langzeitpflege, zweiter Tag nach dem Einzug',
  text: [
    'Frau Lindner ist wach und orientiert. Sie sagt deutlich, wenn etwas drückt oder wehtut.',
    'Wegen der Wassertablette ist die Einlage oft nass. Einlage und Unterwäsche werden etwa einmal pro Schicht zusätzlich gewechselt.',
    'Tagsüber geht sie mit dem Rollator kurze Strecken zur Toilette und zum Essen, die meiste Zeit sitzt sie im Sessel.',
    'Im Sessel und im Bett verändert sie ihre Position häufig selbst, aber nur wenig, weil größere Bewegungen sie außer Atem bringen.',
    'Sie isst meist etwa zwei Drittel ihrer Mahlzeiten, Zwischenmahlzeiten lehnt sie ab.',
    'Nachts schläft sie mit erhöhtem Oberkörper und rutscht dabei gelegentlich nach unten. Hochrutschen gelingt ihr mit wenig Hilfe.',
  ],
  loesung: { sensorik: 4, feuchtigkeit: 2, aktivitaet: 3, mobilitaet: 3, ernaehrung: 3, reibung: 2 },
  begruendung: {
    sensorik: 'Reagiert auf Ansprache und teilt Unbehagen mit, Empfinden ungestört: nicht eingeschränkt.',
    feuchtigkeit: 'Zusätzlicher Wechsel etwa einmal pro Schicht: oft feucht.',
    aktivitaet: 'Geht tagsüber kurze Strecken, verbringt die meiste Zeit im Sessel: geht wenig.',
    mobilitaet: 'Verändert die Position häufig selbst, aber nur geringfügig: gering eingeschränkt.',
    ernaehrung: 'Isst mehr als die Hälfte der meisten Mahlzeiten: adäquate Ernährung.',
    reibung: 'Rutscht gelegentlich nach unten, braucht wenig Hilfe beim Hochrutschen: potenzielles Problem.',
  },
  fazit: '17 Punkte, geringes Risiko. Die Skala allein unterschätzt sie: Rötung am Steiß, Ödeme und Feuchtigkeit sprechen dafür, die Haut täglich anzusehen, Nässe schnell zu beseitigen und das Rutschen im Bett zu vermeiden.',
};

export const LINDNER_BARTHEL: Vignette = {
  id: 'ba-lindner', gruppe: 'barthel', instrument: 'barthel', titel: 'Frau Lindner, 82 Jahre (Fallakte)', setting: 'Stationäre Langzeitpflege, zweiter Tag nach dem Einzug',
  text: [
    'Frau Lindner isst und trinkt selbstständig, ihr Brot streicht sie sich selbst.',
    'Vom Bett in den Sessel kommt sie ohne Anfassen, aber jemand muss daneben stehen, weil ihr beim Aufstehen die Luft knapp wird. Dafür reicht auch ihr Sohn.',
    'Gesicht und Oberkörper wäscht sie selbst. Rücken, Beine und Füße wäscht die Pflege, weil sie sich nicht bücken kann, ohne außer Atem zu kommen.',
    'Zur Toilette geht sie tagsüber allein mit dem Rollator, richtet ihre Kleidung und reinigt sich selbst.',
    'Geduscht wird sie zweimal pro Woche von der Pflege auf dem Duschhocker.',
    'Mit dem Rollator kommt sie in den Stand und geht im Wohnbereich etwa 30 Meter, dann braucht sie eine Pause. 50 Meter am Stück schafft sie nicht.',
    'Treppen steigt sie nicht, auch nicht mit Hilfe.',
    'Oberteile zieht sie selbst an und aus, wenn die Sachen bereitliegen. Hose, Socken und Schuhe zieht ihr die Pflege an.',
    'Sie ist stuhlkontinent.',
    'Etwa jeden zweiten Tag schafft sie es nicht rechtzeitig zur Toilette. Die nasse Einlage wechselt sie selbst.',
  ],
  loesung: { essen: 10, transfer: 10, waschen: 0, toilette: 10, baden: 0, gehen: 5, treppe: 0, kleiden: 5, stuhl: 10, harn: 5 },
  begruendung: {
    essen: 'Isst komplett selbstständig: 10.',
    transfer: 'Braucht Aufsicht, ungeschulte Laienhilfe reicht: 10.',
    waschen: 'Nicht komplett selbstständig (Rücken, Beine, Füße): 0.',
    toilette: 'Toilette vor Ort komplett selbstständig: 10.',
    baden: 'Duschen nur mit Hilfe: 0.',
    gehen: 'Kommt mit Gehwagen in den Stand, schafft keine 50 m: 5.',
    treppe: 'Steigt keine Treppen: 0.',
    kleiden: 'Nur den Oberkörper selbst: 5.',
    stuhl: 'Kontinent: 10.',
    harn: 'Kompensiert selbst mit überwiegendem Erfolg, höchstens einmal am Tag Einnässen: 5.',
  },
  fazit: '55 Punkte, hilfebedürftig. Hilfe vor allem beim Waschen, Duschen und Ankleiden der unteren Körperhälfte; Gehen mit Pausen fördern, Toilettengänge vor und nach den Mahlzeiten anbieten.',
};

export const LINDNER_PLAN: PlanFall = {
  id: 'lindner-herz',
  titel: 'Fallakte: Frau Lindner mit Herzschwäche',
  setting: 'langzeit',
  bereich: 'Stationäre Langzeitpflege, Wohnbereich 2',
  person: `${NAME}, 82 Jahre`,
  text: 'Frau Lindner ist vor drei Tagen ins Pflegeheim eingezogen, nach einem Krankenhausaufenthalt wegen dekompensierter Herzinsuffizienz. Nach etwa 30 Metern mit dem Rollator muss sie stehen bleiben, weil sie keine Luft bekommt: „Das macht mir Angst.“ Beide Unterschenkel sind geschwollen, sie schläft nur mit erhöhtem Oberkörper. Zu Hause ist sie zweimal gestürzt. Durch die Wassertablette schafft sie es nicht immer rechtzeitig zur Toilette, darüber spricht sie ungern. Beim Aufstehen schmerzen die Knie. Sie sitzt am liebsten im Sessel am Fenster und macht gern Handarbeiten, ihr Sohn kommt jeden Sonntag.',
  daten: [
    { label: 'Diagnosen', wert: 'Herzinsuffizienz NYHA III, Vorhofflimmern, Diabetes mellitus Typ 2, Gonarthrose beidseits' },
    { label: 'Medikamente', wert: 'Torasemid 10 mg morgens, Bisoprolol, Ramipril, Apixaban, Metformin, Metamizol bei Bedarf' },
    { label: 'Ärztliche Vorgabe', wert: 'Täglich morgens wiegen; mehr als 1 kg an einem Tag oder mehr als 2 kg in drei Tagen melden; Trinkmenge höchstens 1,5 l' },
    { label: 'Vitalzeichen', wert: 'RR 128/76 mmHg, Puls 82/min unregelmäßig, Atemfrequenz 18/min in Ruhe und 24/min nach 30 m, SpO₂ 94 %' },
    { label: 'Gewicht', wert: '71,4 kg bei Einzug, heute 71,5 kg' },
    { label: 'Assessments', wert: 'Braden 17, Barthel 55, Knieschmerz NRS 5 beim Aufstehen' },
    { label: 'Haut', wert: 'Wegdrückbare Rötung am Steiß, Ödeme an beiden Unterschenkeln (Delle bleibt stehen)' },
    { label: 'Ausscheidung', wert: 'Etwa jeden zweiten Tag Einlage nass, kommt nicht rechtzeitig zur Toilette' },
  ],
  verlauf: 'Eine Woche später: Nach einer nächtlichen Atemnot am fünften Tag hat die Hausärztin Torasemid erhöht. Frau Lindner wiegt jetzt 69,8 kg, die Ödeme sind deutlich zurückgegangen. Mit einer Pause auf dem Stuhl im Flur geht sie bis in den Speisesaal (etwa 50 m). Gestürzt ist sie nicht, nachts klingelt sie vor dem Aufstehen. Die Rötung am Steiß ist verschwunden. Mit Toilettengängen vor und nach den Mahlzeiten ist die Einlage nur noch etwa einmal pro Woche nass. Sie trinkt 1,3 bis 1,5 l, der Kaffee ist eingerechnet. Bei der Handarbeitsgruppe war sie zweimal.',
  topicIds: ['thema.kl.herz', 'thema.pro.sturz', 'thema.pro.dekubitus', 'thema.ph.ausscheidung'],
  info: [
    { id: 'atemnot', text: 'Atemnot nach etwa 30 m, Atemfrequenz 24/min', muster: ['atemnot', 'luft', 'dyspnoe', '30 m'], pflicht: true },
    { id: 'oedeme', text: 'Ödeme an beiden Unterschenkeln', muster: ['oedem', 'geschwollen', 'wasser in den beinen'], pflicht: true },
    { id: 'gewicht', text: 'Tägliches Wiegen mit Meldegrenzen, Trinkmenge höchstens 1,5 l', muster: ['wieg', 'gewicht', '1,5', 'trinkmenge'], pflicht: true },
    { id: 'sturz', text: 'Zwei Stürze zu Hause, Blutverdünnung', muster: ['sturz', 'gestuerzt', 'apixaban'], pflicht: true },
    { id: 'kontinenz', text: 'Kommt durch die Wassertablette nicht immer rechtzeitig zur Toilette', muster: ['einlage', 'toilette', 'inkontinen', 'harndrang', 'rechtzeitig'], pflicht: true },
    { id: 'haut', text: 'Braden 17, Rötung am Steiß', muster: ['braden', 'roetung', 'steiss', 'sakrum'], pflicht: true },
    { id: 'knie', text: 'Knieschmerz NRS 5 beim Aufstehen', muster: ['knie', 'nrs'], pflicht: false },
    { id: 'angst', text: 'Angst wegen der Luftnot', muster: ['angst'], pflicht: false },
  ],
  probleme: [
    { id: 'atmung', art: 'aktuell', pflicht: true, text: 'Beeinträchtigte Atmung und verminderte Belastbarkeit bei Herzinsuffizienz',
      muster: ['atem', 'atmung', 'luft', 'dyspnoe', 'belastbar', 'kurzatmig'],
      massnahmen: { text: 'Oberkörper hoch, Pausen und Sitzgelegenheiten einplanen, Belastung dosieren, Atemfrequenz und SpO₂ beobachten', muster: ['oberkoerper', 'pause', 'sitzgelegenheit', 'stuhl im flur', 'dosier', 'lippenbremse', 'atemfrequenz', 'sauerstoffsaett', 'spo2', 'saettigung'] },
      alternativen: [{ text: 'Ruhig begleiten, Angst ansprechen, bei Atemnot bei ihr bleiben', muster: ['beruhig', 'angst', 'dabei bleiben', 'bei ihr bleiben', 'ruhig begleit'], begruendung: 'Atemnot und Angst verstärken sich gegenseitig. Ruhige Begleitung entlastet die Atmung und ist eine eigenständige pflegerische Maßnahme.' }] },
    { id: 'dekompensation', art: 'risiko', pflicht: true, text: 'Gefahr einer erneuten Verschlechterung der Herzinsuffizienz (Wassereinlagerung)',
      muster: ['dekompens', 'verschlechter', 'wassereinlager', 'oedem', 'ueberwaesser', 'fluessigkeitsueberschuss', 'gewichtszunahme', 'herzinsuff'],
      massnahmen: { text: 'Täglich morgens wiegen, Trinkmenge erfassen (höchstens 1,5 l), Ödeme beobachten, Grenzwerte der Hausärztin melden', muster: ['wieg', 'gewicht', 'trinkprotokoll', 'einfuhr', 'bilanz', 'trinkmenge', '1,5', 'hausaerzt', 'melden'] },
      auchArt: 'Mit den geschwollenen Unterschenkeln ist Wasser schon eingelagert. Als aktuelles Problem („Ödeme, angezeigt durch Dellen an beiden Unterschenkeln“) ist es ebenso tragfähig.' },
    { id: 'sturz', art: 'risiko', pflicht: true, text: 'Sturzgefahr',
      muster: ['sturz'],
      massnahmen: { text: 'Klingel und Rollator in Reichweite, festes Schuhwerk, Licht nachts, beim Aufstehen dabei sein', muster: ['klingel', 'rollator', 'schuh', 'licht', 'bett tief', 'begleit', 'dabei', 'reichweite', 'toilettenstuhl', 'sturzprophyl'] },
      alternativen: [{ text: 'Über das Sturzrisiko und die Blutverdünnung informieren, Klingeln vor dem Aufstehen vereinbaren', muster: ['informier', 'aufklaer', 'vereinbar', 'besprech'], begruendung: 'Information und Beratung sind im Expertenstandard Sturzprophylaxe eigene Maßnahmen.' }] },
    { id: 'dekubitus', art: 'risiko', pflicht: true, text: 'Dekubitusgefahr',
      muster: ['dekubitus', 'druckgeschw', 'haut'],
      massnahmen: { text: 'Haut täglich ansehen (Fingertest am Steiß), Positionswechsel im Sessel, Nässe schnell entfernen, Rutschen vermeiden', muster: ['hautinspekt', 'haut kontroll', 'haut ansehen', 'haut taeglich', 'fingertest', 'positionswechsel', 'umlager', 'druckentlast', 'sitzkissen', 'mikrolager', 'einlage wechseln'] } },
    { id: 'kontinenz', art: 'aktuell', pflicht: true, text: 'Dranginkontinenz (Harninkontinenz)',
      muster: ['inkontinen', 'kontinenz', 'harndrang', 'einlage'],
      massnahmen: { text: 'Toilettengänge zu festen Zeiten (vor und nach den Mahlzeiten), Miktionsprotokoll, passende Einlage, Weg zur Toilette frei', muster: ['toilettengang', 'toilettentraining', 'feste zeiten', 'festen zeiten', 'miktionsprotokoll', 'kontinenzprofil', 'mahlzeiten', 'toilettenstuhl', 'vorlage'] } },
    { id: 'schmerz', art: 'aktuell', pflicht: false, text: 'Chronische Knieschmerzen beim Aufstehen',
      muster: ['schmerz', 'knie'],
      massnahmen: { text: 'Schmerz mit NRS erfassen, Bedarfsmedikation vor dem Aufstehen anbieten, Wärme nach Wunsch', muster: ['nrs', 'bedarf', 'metamizol', 'schmerzmittel', 'waerme', 'schmerzeinsch', 'schmerzerfass'] } },
    { id: 'ernaehrung', art: 'risiko', pflicht: false, text: 'Gefahr einer Mangelernährung',
      muster: ['ernaehr', 'mangel', 'appetit'],
      massnahmen: { text: 'Kleine Portionen, Wunschkost, Tellerprotokoll, Ernährungsscreening', muster: ['kleine portion', 'zwischenmahlzeit', 'wunsch', 'vorlieb', 'tellerprotokoll', 'ernaehrungsprotokoll', 'screening', 'mna'] } },
  ],
  ressourcen: [
    { id: 'orientiert', text: 'Orientiert, äußert Wünsche klar', muster: ['orientiert', 'mitteil', 'klar', 'entscheid', 'aeussert'], pflicht: true },
    { id: 'sohn', text: 'Sohn kommt jeden Sonntag', muster: ['sohn', 'angehoer', 'familie'], pflicht: true },
    { id: 'handarbeit', text: 'Macht gern Handarbeiten, war Schneiderin', muster: ['handarbeit', 'schneider', 'naeh'], pflicht: false },
    { id: 'rollator', text: 'Geht mit Rollator, möchte mobil bleiben', muster: ['rollator', 'geht', 'motiv', 'moechte'], pflicht: false },
  ],
  beispiel: `P: Beeinträchtigte Atmung und verminderte Belastbarkeit
E: beeinflusst durch Herzinsuffizienz NYHA III
S: angezeigt durch Atemnot nach 30 m (AF 24/min), schläft nur mit erhöhtem Oberkörper, Angst
R: orientiert, sagt selbst, wann sie Pause braucht, geht mit Rollator

Ziel: Frau Lindner erreicht mit einer Pause den Speisesaal und gibt dabei keine Angst an. Überprüfung: täglich, Ziel in 7 Tagen.
Maßnahme: Stuhl für Pausen im Flur, Wege mit ihr vorher absprechen (Pflegefachperson, bei jedem Gang); Oberkörper im Bett erhöht; Atemfrequenz und SpO₂ einmal täglich und bei Atemnot.

P: Gefahr einer erneuten Verschlechterung der Herzinsuffizienz
E: beeinflusst durch Wassereinlagerung (Ödeme), Kaffee als Gewohnheit bei Trinkmengengrenze
R: einverstanden mit täglichem Wiegen, kennt ihre Tabletten

Ziel: Gewichtszunahme über den Meldegrenzen wird am selben Morgen erkannt und gemeldet.
Maßnahme: Täglich um 7 Uhr vor dem Frühstück wiegen und dokumentieren, Trinkmenge erfassen (höchstens 1,5 l, Kaffee eingerechnet), Unterschenkel ansehen; mehr als 1 kg an einem Tag oder 2 kg in drei Tagen sofort der Hausärztin melden.

P: Sturzgefahr
E: beeinflusst durch Atemnot, Knieschmerzen beim Aufstehen, Harndrang durch Torasemid, zwei Stürze zu Hause
R: klingelt zuverlässig, nutzt den Rollator

Ziel: Frau Lindner stürzt nicht und klingelt nachts vor dem Aufstehen.
Maßnahme: Klingel und Rollator in Reichweite, Nachtlicht, festes Schuhwerk; beim Aufstehen aus dem Sessel bleibt jemand dabei.`,
};

export const LINDNER_BERICHT: BerichtFall = {
  id: 'lindner-nacht',
  titel: 'Fallakte: Atemnot in der Nacht',
  art: 'schreiben',
  bereich: 'langzeit',
  person: `${NAME}, 82 Jahre, Herzinsuffizienz, fünfter Tag nach dem Einzug`,
  szene: [
    'Um 2:50 Uhr klingelt Frau Lindner. Sie sitzt aufrecht auf der Bettkante, atmet schnell und sagt: „Ich krieg keine Luft, wenn ich liege.“',
    'Du misst: Atemfrequenz 28/min, SpO₂ 89 %, Puls 108/min unregelmäßig, Blutdruck 142/86 mmHg. Beim Atmen ist ein leises Rasseln zu hören.',
    'Du stellst das Kopfteil hoch, sie lässt die Beine aus dem Bett hängen. Du öffnest das Fenster und bleibst bei ihr.',
    'Die Pflegefachkraft im Nachtdienst ruft den ärztlichen Bereitschaftsdienst an. Anordnung: sitzend lassen, Vitalzeichen alle 30 Minuten, bei Verschlechterung 112.',
    'Um 3:30 Uhr: Atemfrequenz 22/min, SpO₂ 93 %, Puls 96/min. Um 4:15 Uhr schläft sie im Sessel mit erhöhtem Oberkörper.',
    'Der Frühdienst soll morgens das Gewicht prüfen und die Hausärztin informieren.',
  ],
  kernpunkte: [
    { id: 'zeit', baustein: 'zeit', pflicht: true, text: 'Uhrzeit (2:50 Uhr)', muster: ['2:50', '2,50', '02:50'] },
    { id: 'haltung', baustein: 'beobachtung', pflicht: true, text: 'Sitzt aufrecht auf der Bettkante, Rasseln beim Atmen', muster: ['bettkante', 'aufrecht', 'rassel', 'brodel'] },
    { id: 'werte', baustein: 'beobachtung', pflicht: true, text: 'Atemfrequenz 28/min, SpO₂ 89 %', muster: ['89'] },
    { id: 'kreislauf', baustein: 'beobachtung', pflicht: false, text: 'Puls 108/min unregelmäßig, RR 142/86 mmHg', muster: ['108', '142/86'] },
    { id: 'aussage', baustein: 'aussage', pflicht: true, text: 'Aussage zur Luftnot wörtlich', muster: ['luft'] },
    { id: 'lagerung', baustein: 'massnahme', pflicht: true, text: 'Oberkörper hoch, Beine tief, Fenster geöffnet, bei ihr geblieben', muster: ['oberkoerper', 'kopfteil', 'beine', 'fenster'] },
    { id: 'wirkung', baustein: 'wirkung', pflicht: true, text: '3:30 Uhr SpO₂ 93 %, um 4:15 Uhr schlafend', muster: ['93', '4:15', 'schlaeft', 'eingeschlafen'] },
    { id: 'arzt', baustein: 'weitergabe', pflicht: true, text: 'Pflegefachkraft und ärztlicher Bereitschaftsdienst informiert', muster: ['bereitschaft', 'aerzt', 'arzt'] },
    { id: 'frueh', baustein: 'weitergabe', pflicht: false, text: 'Frühdienst: Gewicht prüfen, Hausärztin informieren', muster: ['fruehdienst', 'hausaerzt'] },
  ],
  muster: '2:50 Uhr: Frau Lindner klingelt, sitzt aufrecht auf der Bettkante und atmet schnell. Sie sagt: „Ich krieg keine Luft, wenn ich liege.“ AF 28/min, SpO₂ 89 %, Puls 108/min unregelmäßig, RR 142/86 mmHg, beim Atmen Rasseln hörbar. Kopfteil hochgestellt, Beine aus dem Bett hängen lassen, Fenster geöffnet, bei ihr geblieben. Pflegefachkraft im Nachtdienst hat den ärztlichen Bereitschaftsdienst angerufen: sitzend lassen, Vitalzeichen alle 30 Minuten, bei Verschlechterung 112. 3:30 Uhr AF 22/min, SpO₂ 93 %, Puls 96/min. 4:15 Uhr schläft sie im Sessel mit erhöhtem Oberkörper. Frühdienst prüft das Gewicht und informiert die Hausärztin.',
};

export const LINDNER_UEBERGABE: UebergabeFall = {
  id: 'lindner-hausaerztin',
  titel: 'Fallakte: Gewichtszunahme nach nächtlicher Atemnot',
  bereich: 'Stationäre Langzeitpflege',
  anlass: 'telefon',
  empfaenger: 'Hausärztin Dr. Brenner, telefonisch in der Praxis',
  rolle: 'Auszubildende im Frühdienst, Wohnbereich 2, Haus am Mühlbach',
  lage: 'Am Morgen nach der Nacht mit Atemnot wiegst du Frau Lindner um 7:15 Uhr. Die Pflegefachkraft bittet dich, die Hausärztin anzurufen.',
  daten: [
    { label: 'Bewohnerin', wert: `${NAME}, 82 Jahre, Zimmer 12, seit 5 Tagen im Haus` },
    { label: 'Diagnosen', wert: 'Herzinsuffizienz NYHA III, Vorhofflimmern, Diabetes mellitus Typ 2' },
    { label: 'Medikation', wert: 'Torasemid 10 mg morgens, Bisoprolol, Ramipril, Apixaban, Metformin' },
    { label: 'Ärztliche Vorgabe', wert: 'Melden bei mehr als 1 kg an einem Tag oder mehr als 2 kg in drei Tagen; Trinkmenge höchstens 1,5 l' },
    { label: 'Gewicht', wert: 'Heute 73,6 kg, vor drei Tagen 71,5 kg, bei Einzug 71,4 kg' },
    { label: 'Nacht', wert: '2:50 Uhr Atemnot im Liegen, AF 28/min, SpO₂ 89 %; im Sitzen besser; Bereitschaftsdienst telefonisch informiert' },
    { label: 'Jetzt', wert: 'Sitzt im Sessel, AF 22/min, SpO₂ 93 %, RR 138/84 mmHg, Puls 98/min unregelmäßig; Unterschenkel stärker geschwollen als gestern' },
    { label: 'Trinkmenge gestern', wert: '1,4 l' },
  ],
  kernpunkte: [
    { id: 'patient', teil: 'S', pflicht: true, text: 'Bewohnerin benennen (Frau Lindner)', muster: ['lindner'] },
    { id: 'problem', teil: 'S', pflicht: true, text: 'Problem: Gewichtszunahme und Atemnot', muster: ['zugenommen', 'gewichtszunahme', 'atemnot', 'luftnot', 'keine luft', 'schlechter luft'] },
    { id: 'herz', teil: 'B', pflicht: true, text: 'Herzinsuffizienz', muster: ['herzinsuff', 'herzschwaech'] },
    { id: 'einzug', teil: 'B', pflicht: false, text: 'Seit 5 Tagen im Haus, vorher im Krankenhaus', muster: ['5 tagen', 'fuenf tagen', 'eingezogen', 'krankenhaus'] },
    { id: 'diuretikum', teil: 'B', pflicht: false, text: 'Torasemid 10 mg morgens', muster: ['torasemid', 'diuret', 'wassertablette'] },
    { id: 'vorgabe', teil: 'B', pflicht: false, text: 'Ihre Meldegrenze (2 kg in drei Tagen)', muster: ['2 kg', 'meldegrenze', 'vorgabe'] },
    { id: 'gewicht', teil: 'A', pflicht: true, text: 'Gewicht 73,6 kg, plus 2,1 kg in drei Tagen', muster: ['73,6', '2,1'] },
    { id: 'nacht', teil: 'A', pflicht: true, text: 'Nachts Atemnot im Liegen, SpO₂ 89 %', muster: ['89', 'nacht'] },
    { id: 'jetzt', teil: 'A', pflicht: true, text: 'Jetzt sitzend AF 22/min, SpO₂ 93 %', muster: ['93'] },
    { id: 'oedeme', teil: 'A', pflicht: true, text: 'Unterschenkel stärker geschwollen', muster: ['oedem', 'geschwollen', 'schwellung'] },
    { id: 'einschaetzung', teil: 'A', pflicht: false, text: 'Eigene Einschätzung: Verschlechterung der Herzinsuffizienz', muster: ['verdacht', 'verschlechter', 'dekompens', 'ich vermute', 'ich denke'] },
    { id: 'anordnung', teil: 'R', pflicht: true, text: 'Hausbesuch oder Anordnung zum Diuretikum erbitten', muster: ['hausbesuch', 'vorbeikommen', 'ansehen', 'dosis', 'anpass', 'anordnung'] },
  ],
  muster: `S: Guten Morgen, hier spricht Jana Becker, Auszubildende im Haus am Mühlbach, Wohnbereich 2. Ich rufe an wegen Frau Margarete Lindner, 82 Jahre, Zimmer 12. Sie hat deutlich zugenommen und bekommt schlechter Luft.
B: Sie ist vor 5 Tagen nach dem Krankenhaus mit Herzinsuffizienz bei uns eingezogen und bekommt Torasemid 10 mg morgens. Sie hatten angeordnet, dass wir ab 2 kg in drei Tagen anrufen.
A: Heute wiegt sie 73,6 kg, vor drei Tagen waren es 71,5 kg, also 2,1 kg mehr. Heute Nacht hatte sie im Liegen Atemnot mit einer Sättigung von 89 %, im Sitzen wurde es besser, der Bereitschaftsdienst war informiert. Jetzt sitzt sie im Sessel, Atemfrequenz 22, Sättigung 93 %, Blutdruck 138/84, Puls 98 unregelmäßig. Beide Unterschenkel sind stärker geschwollen als gestern. Ich vermute, dass sich die Herzinsuffizienz verschlechtert.
R: Können Sie bitte heute Vormittag zum Hausbesuch kommen, oder sollen wir die Dosis von Torasemid anpassen? Bis dahin bleibt sie sitzend, ich kontrolliere Atmung und Sättigung jede Stunde und melde mich sofort, wenn die Sättigung unter 90 % fällt.`,
};

/** Ereignisse für die SBAR-Grundkriterien (Rufgrund, Priorität, Rückfrage), siehe uebergabe/ereignisse.ts. */
export const LINDNER_EREIGNISSE: SbarEreignis[] = [
  { minute: 0, stufe: 'info', text: 'Ärztliche Vorgabe: täglich wiegen, ab 2 kg in drei Tagen melden' },
  { minute: 290, stufe: 'auffaellig', text: 'Gewicht 73,6 kg (plus 2,1 kg in drei Tagen), nachts Atemnot im Liegen, jetzt SpO₂ 93 % im Sitzen', muster: ['zugenommen', 'gewichtszunahme', 'atemnot', 'luftnot', 'keine luft', 'schlechter luft'],
    empfehlung: 'Hausbesuch heute oder Anordnung zur Dosis des Diuretikums erbitten', rueckfrage: 'Ab welchem Wert soll ich erneut anrufen oder den Notruf wählen?' },
];

export const LINDNER: Fallakte = {
  id: 'lindner',
  titel: 'Frau Lindner zieht ein',
  person: `${NAME}, 82 Jahre`,
  setting: 'Stationäre Langzeitpflege, Wohnbereich 2',
  kurz: 'Herzschwäche, Sturzgefahr und eine Nacht mit Atemnot: eine Bewohnerin vom Einzug bis zum Anruf bei der Hausärztin.',
  einstieg: [
    'Frau Lindner ist 82 Jahre alt und hat bisher allein in ihrer Wohnung gelebt. Nach einem Krankenhausaufenthalt wegen dekompensierter Herzinsuffizienz zieht sie ins Pflegeheim. Zu Hause ist sie zweimal gestürzt.',
    'Du begleitest sie durch ihre erste Woche: Du führst das Erstgespräch, schätzt Risiken ein, planst die Pflege, dokumentierst eine schwierige Nacht und meldest dich danach bei der Hausärztin.',
  ],
  schritte: [
    { id: 'sis', art: 'sis', fallId: 'lindner', wann: 'Tag 1, Einzug', titel: 'Erstgespräch und SIS', auftrag: 'Führe das Erstgespräch aus und fülle die SIS mit Risikomatrix. Wo die Matrix eine weitere Einschätzung verlangt, folgen die Assessments.' },
    { id: 'braden', art: 'assessment', fallId: 'br-lindner', wann: 'Tag 2', titel: 'Braden-Skala', auftrag: 'Die Matrix zeigt ein Dekubitusrisiko. Schätze es mit der Braden-Skala ein und vergleiche das Ergebnis mit deinem klinischen Blick.' },
    { id: 'barthel', art: 'assessment', fallId: 'ba-lindner', wann: 'Tag 2', titel: 'Barthel-Index', auftrag: 'Wie selbstständig ist Frau Lindner im Alltag? Bewerte, was sie tatsächlich tut.' },
    { id: 'planung', art: 'pflegeplanung', fallId: 'lindner-herz', wann: 'Tag 3', titel: 'Pflegeplanung', auftrag: 'Plane mit allem, was du bisher weißt: Probleme, Ziele, Maßnahmen. Die Evaluation zeigt den Verlauf eine Woche später.' },
    { id: 'bericht', art: 'bericht', fallId: 'lindner-nacht', wann: 'Tag 5, Nachtdienst', titel: 'Pflegebericht', auftrag: 'In der Nacht bekommt Frau Lindner im Liegen keine Luft. Schreib den Eintrag in den Pflegebericht.' },
    { id: 'uebergabe', art: 'uebergabe', fallId: 'lindner-hausaerztin', wann: 'Tag 6, Frühdienst', titel: 'Anruf bei der Hausärztin (SBAR)', auftrag: 'Am Morgen hat sie 2,1 kg zugenommen. Ruf die Hausärztin an und übergib nach SBAR.' },
  ],  rueckblick: [
    { frage: 'Die Braden-Skala ergab 17 Punkte, also nur geringes Risiko. Warum stand in der SIS trotzdem „Dekubitus: ja“?', antwort: 'Die Skala ergänzt den klinischen Blick, sie ersetzt ihn nicht. Rötung am Steiß, Ödeme, Feuchtigkeit und langes Sitzen sind eigene Warnzeichen. Deshalb bleibt die Haut täglich im Blick.' },
    { frage: 'Wo in deiner SIS stand schon, was am sechsten Tag den Anruf auslöste?', antwort: 'In Themenfeld 3 und unter „Sonstiges“ in der Matrix: tägliches Wiegen mit den Meldegrenzen der Hausärztin. Ohne diese Absprache wäre die Zunahme von 2,1 kg niemandem aufgefallen.' },
    { frage: 'Welche Maßnahme aus deiner Pflegeplanung hat in der Nacht geholfen?', antwort: 'Oberkörper hoch und Beine tief entlasten das Herz. Wer die Atemnot im Liegen schon in der Informationssammlung notiert hatte, konnte nachts gezielt handeln.' },
    { frage: 'Was braucht die Hausärztin von deinem Bericht in der Übergabe, und was nicht?', antwort: 'Werte mit Verlauf (Gewicht, SpO₂ nachts und jetzt), die Wirkung der Lagerung und deine Einschätzung. Nicht nötig sind Einzelheiten wie das geöffnete Fenster oder wer wen angerufen hat.' },
  ],
};
