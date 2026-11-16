// Gesprächssimulator, feste Dialoge (offline): verzweigte Gespräche mit Rückmeldung je Antwort.
// Jede Antwort trägt eine Gesprächstechnik, eine Wirkung auf Vertrauen und Anspannung des Gegenübers
// und eine Begründung. Grundlagen je Dialog unter `quellen`.

export type TechnikId =
  | 'zuhoeren' | 'spiegeln' | 'offen' | 'ich' | 'validation' | 'informieren' | 'grenze' | 'vereinbaren'
  | 'beschwichtigen' | 'rechtfertigen' | 'ratschlag' | 'bagatellisieren' | 'geschlossen' | 'korrigieren' | 'drohen';

export const TECHNIK: Record<TechnikId, { name: string; foerderlich: boolean; kurz: string }> = {
  zuhoeren: { name: 'Aktives Zuhören', foerderlich: true, kurz: 'Inhalt mit eigenen Worten zurückgeben und nachfragen.' },
  spiegeln: { name: 'Gefühle ansprechen', foerderlich: true, kurz: 'Das Gefühl hinter der Aussage benennen (Verbalisieren emotionaler Erlebnisinhalte).' },
  offen: { name: 'Offene Frage', foerderlich: true, kurz: 'W-Fragen laden zum Erzählen ein.' },
  ich: { name: 'Ich-Botschaft', foerderlich: true, kurz: 'Eigene Wahrnehmung und Anliegen sagen, ohne Vorwurf.' },
  validation: { name: 'Validation', foerderlich: true, kurz: 'Gefühle und Antrieb eines Menschen mit Demenz ernst nehmen, ohne seine Realität zu korrigieren.' },
  informieren: { name: 'Verständlich informieren', foerderlich: true, kurz: 'Sachlich, in kleinen Schritten, ohne Fachsprache.' },
  grenze: { name: 'Grenze klar benennen', foerderlich: true, kurz: 'Ruhig sagen, was nicht geht und warum.' },
  vereinbaren: { name: 'Vereinbarung treffen', foerderlich: true, kurz: 'Konkret, überprüfbar, mit nächstem Schritt.' },
  beschwichtigen: { name: 'Beschwichtigen', foerderlich: false, kurz: '„Das wird schon“: nimmt das Gefühl nicht ernst (Kommunikationssperre nach Gordon).' },
  rechtfertigen: { name: 'Rechtfertigen', foerderlich: false, kurz: 'Verteidigung lenkt auf dich statt auf das Anliegen.' },
  ratschlag: { name: 'Ungefragter Ratschlag', foerderlich: false, kurz: 'Lösung vor Verständnis: das Gegenüber fühlt sich übergangen.' },
  bagatellisieren: { name: 'Bagatellisieren', foerderlich: false, kurz: 'Spielt das Problem herunter.' },
  geschlossen: { name: 'Geschlossene Frage', foerderlich: false, kurz: 'Ja-Nein-Fragen bremsen das Erzählen. Für Fakten gut, für Gefühle nicht.' },
  korrigieren: { name: 'Realität korrigieren', foerderlich: false, kurz: 'Bei Demenz: Konfrontation mit „Fakten“ macht Angst und Widerstand.' },
  drohen: { name: 'Druck machen', foerderlich: false, kurz: 'Drohung oder Druck verletzt die Selbstbestimmung.' },
};

export type Stimmung = 'aufgebracht' | 'aengstlich' | 'traurig' | 'abweisend' | 'unruhig' | 'ruhiger' | 'offen';
export const STIMMUNG_LABEL: Record<Stimmung, string> = { aufgebracht: 'aufgebracht', aengstlich: 'ängstlich', traurig: 'traurig', abweisend: 'abweisend', unruhig: 'unruhig', ruhiger: 'etwas ruhiger', offen: 'offen' };

export type Urteil = 'gut' | 'teilweise' | 'fehler';

export interface Antwort {
  text: string;
  technik: TechnikId;
  urteil: Urteil;
  /** Veränderung von Vertrauen (−30 … +30). Anspannung sinkt mit Vertrauen, steigt mit Sperren. */
  vertrauen: number;
  warum: string;
  weiter: string;
}

export interface Knoten { id: string; sagt: string; stimmung: Stimmung; antworten: Antwort[] }

export interface Dialog {
  id: string;
  titel: string;
  kurz: string;
  topicIds: string[];
  /** Wer spricht: Name und Rolle. */
  gegenueber: string;
  lage: string;
  ziel: string;
  start: string;
  knoten: Knoten[];
  /** Was die KI-Rolle über die Person wissen soll (für das freie Gespräch). */
  rolleKi: string;
  merksaetze: string[];
  quellen: string[];
}

export const ENDE = 'ende';

const T = { gespraech: 'thema.kom.gespraech', beratung: 'thema.kom.beratung', demenz: 'thema.kl.demenz', ethik: 'thema.kom.ethik' } as const;

export const DIALOGE: Dialog[] = [
  {
    id: 'angehoerige', titel: 'Aufgebrachte Tochter', kurz: 'Beschwerde nach einem Sturz im Pflegeheim',
    topicIds: [T.gespraech],
    gegenueber: 'Frau Kessler, Tochter von Herrn Kessler (86)',
    lage: 'Herr Kessler ist gestern Abend im Zimmer gestürzt, er hat ein Hämatom an der Stirn, geröntgt wurde nichts Auffälliges. Die Tochter kommt am Nachmittag auf den Wohnbereich und spricht dich auf dem Flur an.',
    ziel: 'Den Ärger annehmen, das Anliegen verstehen, sachlich informieren und eine konkrete Vereinbarung treffen.',
    start: 'a1',
    knoten: [
      { id: 'a1', stimmung: 'aufgebracht', sagt: 'Mein Vater liegt mit einer Beule im Bett und keiner hat mich angerufen! Ich erfahre das von der Nachbarin im Zimmer. Was ist hier eigentlich los?', antworten: [
        { text: 'Sie sind wütend, weil Sie vom Sturz Ihres Vaters nicht von uns erfahren haben. Das verstehe ich. Wollen wir uns kurz ins Besprechungszimmer setzen?', technik: 'spiegeln', urteil: 'gut', vertrauen: 20, warum: 'Du benennst das Gefühl und den Grund, ohne dich zu verteidigen. Der Ortswechsel schützt die Privatsphäre aller auf dem Flur.', weiter: 'a2' },
        { text: 'Moment, ich hatte gestern gar keinen Dienst. Das war die Spätschicht.', technik: 'rechtfertigen', urteil: 'fehler', vertrauen: -20, warum: 'Rechtfertigen lenkt auf dich und klingt nach Abschieben. Die Tochter fühlt sich nicht gehört.', weiter: 'a1b' },
        { text: 'Beruhigen Sie sich bitte erst einmal, so schlimm ist es ja nicht.', technik: 'bagatellisieren', urteil: 'fehler', vertrauen: -25, warum: '„Beruhigen Sie sich“ und Herunterspielen sind Kommunikationssperren. Die Anspannung steigt.', weiter: 'a1b' },
      ] },
      { id: 'a1b', stimmung: 'aufgebracht', sagt: 'Das ist mir doch egal, wer Dienst hatte! Ich will wissen, was mit meinem Vater passiert ist. So geht man nicht mit alten Menschen um.', antworten: [
        { text: 'Sie haben recht, Sie hätten informiert werden müssen. Ich sehe, wie viel Sorge Sie sich machen. Ich erzähle Ihnen jetzt in Ruhe, was ich weiß. Setzen wir uns kurz?', technik: 'spiegeln', urteil: 'gut', vertrauen: 20, warum: 'Den berechtigten Teil der Kritik anerkennen und die Sorge benennen öffnet das Gespräch wieder.', weiter: 'a2' },
        { text: 'Wenn Sie so laut werden, rede ich nicht weiter mit Ihnen.', technik: 'drohen', urteil: 'teilweise', vertrauen: -5, warum: 'Eine Grenze ist erlaubt, aber als Drohung und ohne Angebot eskaliert sie eher. Besser: „Ich möchte Ihnen helfen. Lassen Sie uns dafür ins Besprechungszimmer gehen.“', weiter: 'a2' },
        { text: 'Da müssen Sie sich an die Wohnbereichsleitung wenden.', technik: 'rechtfertigen', urteil: 'fehler', vertrauen: -15, warum: 'Weiterschicken ohne Zuhören wirkt abweisend. Die Leitung einzubeziehen kann richtig sein, aber erst nach dem ersten Gespräch.', weiter: 'a2' },
      ] },
      { id: 'a2', stimmung: 'unruhig', sagt: 'Also, was ist passiert? Er ist doch nachts nie allein aufgestanden.', antworten: [
        { text: 'Er ist gestern gegen 20 Uhr allein zur Toilette gegangen und neben dem Bett gestürzt. Die Ärztin hat ihn untersucht, das Röntgen war unauffällig. Wir kontrollieren seitdem stündlich Bewusstsein und Schmerzen.', technik: 'informieren', urteil: 'gut', vertrauen: 15, warum: 'Sachlich, konkret, verständlich: Zeitpunkt, Folgen, was getan wurde. Das schafft Vertrauen.', weiter: 'a3' },
        { text: 'Das kommt bei alten Menschen leider öfter vor, das kann man nie ganz verhindern.', technik: 'bagatellisieren', urteil: 'teilweise', vertrauen: -10, warum: 'Fachlich nicht falsch, aber als erste Antwort klingt es nach Ausrede. Erst informieren, dann einordnen.', weiter: 'a3' },
        { text: 'Hat er Ihnen denn nicht erzählt, dass er nachts öfter raus muss?', technik: 'geschlossen', urteil: 'fehler', vertrauen: -10, warum: 'Die Frage klingt nach Schuldzuweisung und weicht der Information aus.', weiter: 'a3' },
      ] },
      { id: 'a3', stimmung: 'ruhiger', sagt: 'Und warum hat mich niemand angerufen? Ich stehe doch als Kontakt in der Akte.', antworten: [
        { text: 'Das hätte passieren müssen, und es tut mir leid, dass es nicht passiert ist. Ich kläre, warum der Anruf fehlte, und gebe das an die Leitung weiter. Wie möchten Sie künftig informiert werden?', technik: 'offen', urteil: 'gut', vertrauen: 20, warum: 'Fehler anerkennen, Klärung zusagen und mit einer offenen Frage die Wünsche der Tochter einholen.', weiter: 'a4' },
        { text: 'Das weiß ich nicht. Steht bestimmt in der Dokumentation.', technik: 'rechtfertigen', urteil: 'fehler', vertrauen: -15, warum: 'Ausweichend, ohne Zusage. Die Tochter bleibt mit ihrer Frage allein.', weiter: 'a4' },
        { text: 'Wir rufen nur bei schweren Stürzen an.', technik: 'rechtfertigen', urteil: 'fehler', vertrauen: -15, warum: 'Eine Regel zur Verteidigung zu nutzen verschärft den Konflikt, zumal die Information bei einem Sturz mit Verletzung erwartbar war.', weiter: 'a4' },
      ] },
      { id: 'a4', stimmung: 'offen', sagt: 'Ich habe einfach Angst, dass er wieder fällt. Was machen Sie denn jetzt?', antworten: [
        { text: 'Wir haben das Sturzrisiko neu eingeschätzt. Heute Nacht bekommt er ein Nachtlicht und eine Klingelmatte vor dem Bett. Morgen spreche ich mit ihm und Ihnen über weitere Maßnahmen, rufe Sie um 15 Uhr an. Passt das?', technik: 'vereinbaren', urteil: 'gut', vertrauen: 20, warum: 'Konkrete Maßnahmen nach dem Expertenstandard Sturzprophylaxe und eine überprüfbare Vereinbarung mit Uhrzeit.', weiter: ENDE },
        { text: 'Machen Sie sich keine Sorgen, wir passen schon auf.', technik: 'beschwichtigen', urteil: 'fehler', vertrauen: -10, warum: 'Beschwichtigen nimmt die Angst nicht ernst und enthält keine Zusage, die man prüfen kann.', weiter: ENDE },
        { text: 'Sollen wir ihn nachts fixieren, damit nichts passiert?', technik: 'ratschlag', urteil: 'fehler', vertrauen: -20, warum: 'Freiheitsentziehende Maßnahmen brauchen eine richterliche Genehmigung (§ 1831 BGB) und erhöhen das Verletzungsrisiko. Kein Angebot im Flurgespräch.', weiter: ENDE },
      ] },
    ],
    rolleKi: 'Du bist Frau Kessler, 54, Tochter von Herrn Kessler (86, leichte Demenz, wohnt im Pflegeheim). Dein Vater ist gestern Abend gestürzt (Beule an der Stirn, Röntgen unauffällig), niemand hat dich angerufen, du hast es von der Mitbewohnerin erfahren. Du bist wütend und hast Angst um deinen Vater. Wirst du ernst genommen und konkret informiert, beruhigst du dich. Bei Rechtfertigungen, Floskeln oder Abwimmeln wirst du lauter und drohst mit Beschwerde bei der Heimaufsicht.',
    merksaetze: ['Erst das Gefühl, dann die Sache: „Sie sind wütend, weil …“', 'Berechtigte Kritik anerkennen statt rechtfertigen.', 'Mit einer konkreten, überprüfbaren Vereinbarung enden.'],
    quellen: ['Rogers: personzentrierte Gesprächsführung (Empathie, Akzeptanz, Echtheit)', 'Gordon: Kommunikationssperren', 'DNQP Expertenstandard Sturzprophylaxe in der Pflege (2. Aktualisierung 2022)'],
  },
  {
    id: 'ablehnung', titel: 'Medikament abgelehnt', kurz: 'Herr Yıldız will seine Tabletten nicht nehmen',
    topicIds: [T.gespraech, T.beratung, T.ethik],
    gegenueber: 'Herr Yıldız (72), internistische Station',
    lage: 'Herr Yıldız hat seit zwei Tagen ein neues Blutdruckmittel. Heute Morgen schiebt er den Becher weg.',
    ziel: 'Gründe verstehen, verständlich informieren, die Entscheidung respektieren und die Ärztin informieren.',
    start: 'b1',
    knoten: [
      { id: 'b1', stimmung: 'abweisend', sagt: 'Die neue Tablette nehme ich nicht mehr. Die tut mir nicht gut.', antworten: [
        { text: 'Die neue Tablette tut Ihnen nicht gut. Was merken Sie denn seit der Einnahme?', technik: 'zuhoeren', urteil: 'gut', vertrauen: 20, warum: 'Paraphrasieren und offene Frage: Du erfährst den Grund, statt zu überreden.', weiter: 'b2' },
        { text: 'Die müssen Sie aber nehmen, die hat der Doktor verschrieben.', technik: 'drohen', urteil: 'fehler', vertrauen: -25, warum: 'Druck missachtet die Selbstbestimmung. Jeder darf eine Behandlung ablehnen, auch eine ärztlich angeordnete.', weiter: 'b1b' },
        { text: 'Ist Ihnen schwindelig?', technik: 'geschlossen', urteil: 'teilweise', vertrauen: 0, warum: 'Die Vermutung kann stimmen, aber eine geschlossene Frage lenkt. Eine offene Frage bringt mehr.', weiter: 'b2' },
      ] },
      { id: 'b1b', stimmung: 'abweisend', sagt: 'Der Doktor nimmt sie ja nicht. Ich bin doch kein Kind.', antworten: [
        { text: 'Sie haben recht, Sie entscheiden das. Ich möchte nur verstehen, was Sie stört. Erzählen Sie mir, was los ist?', technik: 'offen', urteil: 'gut', vertrauen: 20, warum: 'Selbstbestimmung ausdrücklich anerkennen und neu einladen.', weiter: 'b2' },
        { text: 'Dann schreibe ich auf, dass Sie nicht kooperieren.', technik: 'drohen', urteil: 'fehler', vertrauen: -20, warum: 'Dokumentation als Drohung zerstört Vertrauen. Dokumentiert wird sachlich, nicht als Strafe.', weiter: 'b2' },
        { text: 'Gut, dann eben nicht.', technik: 'rechtfertigen', urteil: 'fehler', vertrauen: -5, warum: 'Die Ablehnung ohne Nachfrage hinnehmen lässt ein mögliches Problem (Nebenwirkung) unentdeckt.', weiter: 'b2' },
      ] },
      { id: 'b2', stimmung: 'unruhig', sagt: 'Mir ist morgens beim Aufstehen schwarz vor Augen. Gestern wäre ich fast umgefallen.', antworten: [
        { text: 'Das klingt beunruhigend. Ich messe gleich Ihren Blutdruck im Liegen und im Stehen und sage der Ärztin Bescheid. Bis dahin: bitte langsam aufstehen und klingeln, wenn Sie raus möchten.', technik: 'informieren', urteil: 'gut', vertrauen: 20, warum: 'Du nimmst das Symptom ernst (möglicher orthostatischer Blutdruckabfall), handelst und gibst eine konkrete Sicherheitsregel.', weiter: 'b3' },
        { text: 'Das ist am Anfang normal, das gibt sich.', technik: 'bagatellisieren', urteil: 'fehler', vertrauen: -15, warum: 'Schwindel mit Beinahe-Sturz ist ein Warnzeichen und muss ärztlich bewertet werden.', weiter: 'b3' },
        { text: 'Sie sollten mehr trinken, dann wird das besser.', technik: 'ratschlag', urteil: 'teilweise', vertrauen: -5, warum: 'Trinken kann helfen, aber der Ratschlag kommt vor der Abklärung und übergeht das Anliegen.', weiter: 'b3' },
      ] },
      { id: 'b3', stimmung: 'ruhiger', sagt: 'Und wenn ich die Tablette heute weglasse, passiert dann was?', antworten: [
        { text: 'Das kann ich nicht allein beurteilen. Ich frage die Ärztin gleich. Sie kommt zu Ihnen und bespricht mit Ihnen, ob die Dosis angepasst wird. Ist das für Sie in Ordnung?', technik: 'vereinbaren', urteil: 'gut', vertrauen: 15, warum: 'Ehrlich über die eigene Grenze, ärztliche Aufklärung organisieren und die Zustimmung einholen.', weiter: 'b4' },
        { text: 'Ach, einmal weglassen ist egal.', technik: 'bagatellisieren', urteil: 'fehler', vertrauen: -10, warum: 'Diese Einschätzung ist ärztliche Aufgabe. Eine Pauschalaussage kann falsch sein.', weiter: 'b4' },
        { text: 'Dann steigt Ihr Blutdruck und Sie bekommen einen Schlaganfall.', technik: 'drohen', urteil: 'fehler', vertrauen: -20, warum: 'Angst machen ist keine Information. Risiken erklärt die Ärztin im Aufklärungsgespräch, sachlich und vollständig.', weiter: 'b4' },
      ] },
      { id: 'b4', stimmung: 'offen', sagt: 'Ja, das ist gut. Dann warte ich auf die Ärztin.', antworten: [
        { text: 'Danke. Ich notiere, dass Sie die Tablette heute nicht genommen haben und warum, und lasse den Becher bis zum Gespräch im Dienstzimmer.', technik: 'vereinbaren', urteil: 'gut', vertrauen: 10, warum: 'Sachliche Dokumentation von Ablehnung und Grund, Medikament nicht unbeaufsichtigt stehen lassen.', weiter: ENDE },
        { text: 'Ich lasse Ihnen die Tablette hier, falls Sie es sich anders überlegen.', technik: 'ratschlag', urteil: 'fehler', vertrauen: 0, warum: 'Medikamente nicht unbeaufsichtigt lassen: Einnahme ist nicht mehr nachvollziehbar.', weiter: ENDE },
        { text: 'Gut. Dann ist ja alles geklärt.', technik: 'beschwichtigen', urteil: 'teilweise', vertrauen: 0, warum: 'Freundlich, aber Dokumentation und Information fehlen.', weiter: ENDE },
      ] },
    ],
    rolleKi: 'Du bist Herr Yıldız, 72, auf einer internistischen Station. Seit zwei Tagen bekommst du ein neues Blutdruckmittel, seitdem wird dir morgens beim Aufstehen schwarz vor Augen, gestern bist du fast gestürzt. Du lehnst die Tablette ab. Du bist höflich, aber stur, wenn man dich drängt oder bevormundet. Wenn man dir zuhört und dich ernst nimmt, erzählst du vom Schwindel und bist offen für ein Gespräch mit der Ärztin.',
    merksaetze: ['Ablehnung ist ein Recht: Gründe erfragen statt überreden.', 'Symptome ernst nehmen und ärztlich klären lassen.', 'Ablehnung, Grund und Information der Ärztin sachlich dokumentieren.'],
    quellen: ['Patientenrechte: Einwilligung und Aufklärung (§§ 630d, 630e BGB)', 'Gordon: Kommunikationssperren', 'ICN-Ethikkodex für Pflegefachpersonen (2021)'],
  },
  {
    id: 'demenz', titel: 'Abends nach Hause', kurz: 'Frau Albrecht will zu ihren Kindern',
    topicIds: [T.demenz, T.gespraech],
    gegenueber: 'Frau Albrecht (89), Demenz, Pflegeheim',
    lage: 'Kurz vor 18 Uhr steht Frau Albrecht mit Handtasche und Mantel an der Tür des Wohnbereichs. Sie war früher Hausfrau mit drei Kindern, die heute selbst erwachsen sind.',
    ziel: 'Das Gefühl hinter dem Wunsch erkennen, nicht korrigieren und Sicherheit geben.',
    start: 'c1',
    knoten: [
      { id: 'c1', stimmung: 'unruhig', sagt: 'Ich muss jetzt nach Hause! Die Kinder kommen aus der Schule, und es gibt noch kein Essen.', antworten: [
        { text: 'Sie machen sich Sorgen um Ihre Kinder. Die sollen etwas Warmes bekommen.', technik: 'validation', urteil: 'gut', vertrauen: 20, warum: 'Validation: Du greifst das Gefühl (Sorge, Verantwortung) auf, ohne die Realität zu korrigieren.', weiter: 'c2' },
        { text: 'Frau Albrecht, Ihre Kinder sind doch längst erwachsen. Sie wohnen jetzt hier.', technik: 'korrigieren', urteil: 'fehler', vertrauen: -25, warum: 'Realitätsorientierung in der Unruhe verunsichert und kann Angst und Abwehr auslösen.', weiter: 'c1b' },
        { text: 'Heute nicht mehr, es ist schon spät. Kommen Sie, wir gehen in Ihr Zimmer.', technik: 'ratschlag', urteil: 'fehler', vertrauen: -15, warum: 'Übergeht den Antrieb. Das Bedürfnis bleibt und die Unruhe auch.', weiter: 'c1b' },
      ] },
      { id: 'c1b', stimmung: 'aengstlich', sagt: 'Lassen Sie mich! Ich muss doch zu meinen Kindern, die warten!', antworten: [
        { text: 'Ihre Kinder sind Ihnen sehr wichtig. Sie waren immer für sie da, nicht wahr?', technik: 'validation', urteil: 'gut', vertrauen: 20, warum: 'Den Antrieb wertschätzen (Fürsorge) holt Frau Albrecht dort ab, wo sie gerade ist.', weiter: 'c2' },
        { text: 'Wenn Sie jetzt rausgehen, verlaufen Sie sich.', technik: 'drohen', urteil: 'fehler', vertrauen: -15, warum: 'Warnungen machen mehr Angst. Sicherheit entsteht durch Beziehung, nicht durch Drohung.', weiter: 'c2' },
        { text: 'Die Tür ist abgeschlossen, da kommen Sie nicht raus.', technik: 'drohen', urteil: 'fehler', vertrauen: -20, warum: 'Eine verschlossene Tür ist eine freiheitsentziehende Maßnahme und braucht eine Genehmigung. Als Argument verstärkt sie die Panik.', weiter: 'c2' },
      ] },
      { id: 'c2', stimmung: 'ruhiger', sagt: 'Ja, drei Kinder. Der Kleine isst so gern Pfannkuchen.', antworten: [
        { text: 'Pfannkuchen! Wie haben Sie die denn gemacht? Erzählen Sie mal.', technik: 'offen', urteil: 'gut', vertrauen: 20, warum: 'Eine offene Frage zur Biografie lenkt behutsam um und stärkt die Identität.', weiter: 'c3' },
        { text: 'Hier gibt es heute Abend Brot mit Käse.', technik: 'informieren', urteil: 'teilweise', vertrauen: 0, warum: 'Nicht falsch, aber verpasst die Gelegenheit, an der Erinnerung anzuknüpfen.', weiter: 'c3' },
        { text: 'Wie heißen denn Ihre Kinder? Wissen Sie das noch?', technik: 'geschlossen', urteil: 'fehler', vertrauen: -15, warum: 'Abfragen wie ein Test beschämt, wenn die Antwort nicht kommt.', weiter: 'c3' },
      ] },
      { id: 'c3', stimmung: 'offen', sagt: 'Mit viel Zucker und Apfel. Die haben immer alles aufgegessen.', antworten: [
        { text: 'Da waren Sie eine gute Mutter. Wollen Sie mir in der Küche helfen, den Tisch fürs Abendessen zu decken?', technik: 'validation', urteil: 'gut', vertrauen: 20, warum: 'Wertschätzung plus eine sinnvolle Aufgabe, die zum Antrieb (versorgen) passt. Die Unruhe hat einen Ort.', weiter: ENDE },
        { text: 'Schön. Jetzt ziehen wir aber den Mantel aus.', technik: 'ratschlag', urteil: 'teilweise', vertrauen: -5, warum: 'Der Übergang ist zu abrupt. Erst eine Aufgabe anbieten, dann ergibt sich das Ausziehen oft von selbst.', weiter: ENDE },
        { text: 'Ihre Kinder kommen bestimmt am Wochenende zu Besuch.', technik: 'beschwichtigen', urteil: 'teilweise', vertrauen: 0, warum: 'Gut gemeint, aber unsichere Versprechen können enttäuschen und die Gedanken wieder auf das Gehen lenken.', weiter: ENDE },
      ] },
    ],
    rolleKi: 'Du bist Frau Albrecht, 89, mit mittelschwerer Demenz im Pflegeheim. Gegen 18 Uhr willst du mit Mantel und Handtasche nach Hause, weil du glaubst, deine drei Kinder kommen aus der Schule und brauchen Essen. Du warst Hausfrau, hast gern gekocht (Pfannkuchen mit Apfel). Wenn man dich korrigiert („Ihre Kinder sind erwachsen“) oder drängt, wirst du ängstlich und wehrst dich. Wenn man deine Sorge und Fürsorge würdigt und dich nach früher fragt, wirst du ruhiger und hilfst vielleicht gern bei einer Aufgabe. Sprich in kurzen, einfachen Sätzen.',
    merksaetze: ['Nicht korrigieren: Gefühl und Antrieb hinter dem Wunsch würdigen.', 'Biografie als Brücke: offen nach früher fragen.', 'Eine sinnvolle Aufgabe gibt der Unruhe einen Ort.'],
    quellen: ['Feil: Validation; Richard: Integrative Validation', 'DNQP Expertenstandard Beziehungsgestaltung in der Pflege von Menschen mit Demenz (2018/2019)', '§ 1831 BGB: freiheitsentziehende Maßnahmen'],
  },
  {
    id: 'op-angst', titel: 'Angst vor der Operation', kurz: 'Frau Wagner weint am Vorabend',
    topicIds: [T.gespraech],
    gegenueber: 'Frau Wagner (45), chirurgische Station',
    lage: 'Frau Wagner wird morgen an der Schilddrüse operiert. Beim Abendrundgang sitzt sie weinend auf der Bettkante.',
    ziel: 'Raum für die Angst geben, ernst nehmen, Fragen sammeln und gezielt weiterleiten.',
    start: 'd1',
    knoten: [
      { id: 'd1', stimmung: 'traurig', sagt: '(schluchzt) Entschuldigung. Es ist nichts.', antworten: [
        { text: '(setzt sich dazu) Sie müssen sich nicht entschuldigen. Mir scheint, Sie haben etwas auf dem Herzen. Ich habe ein paar Minuten Zeit.', technik: 'spiegeln', urteil: 'gut', vertrauen: 20, warum: 'Zuwendung auf Augenhöhe, Gefühl behutsam ansprechen und Zeit anbieten.', weiter: 'd2' },
        { text: 'Das wird schon, morgen um die Zeit haben Sie es hinter sich.', technik: 'beschwichtigen', urteil: 'fehler', vertrauen: -20, warum: 'Beschwichtigen beendet das Gespräch, bevor es begonnen hat.', weiter: 'd1b' },
        { text: 'Okay, dann klingeln Sie, wenn was ist.', technik: 'rechtfertigen', urteil: 'fehler', vertrauen: -15, warum: '„Es ist nichts“ ist oft eine Einladung, nachzufragen. Gehen lässt die Patientin allein.', weiter: 'd1b' },
      ] },
      { id: 'd1b', stimmung: 'traurig', sagt: 'Ja ... (weint weiter)', antworten: [
        { text: 'Ich sehe, dass Sie das sehr bewegt. Darf ich mich kurz zu Ihnen setzen?', technik: 'spiegeln', urteil: 'gut', vertrauen: 20, warum: 'Zweite Chance: Gefühl ansprechen und um Erlaubnis bitten.', weiter: 'd2' },
        { text: 'Soll ich Ihnen eine Schlaftablette bringen?', technik: 'ratschlag', urteil: 'teilweise', vertrauen: -5, warum: 'Eine Bedarfsmedikation kann später sinnvoll sein, ersetzt aber nicht das Gespräch.', weiter: 'd2' },
        { text: 'Sie brauchen keine Angst zu haben, das ist ein Routineeingriff.', technik: 'bagatellisieren', urteil: 'fehler', vertrauen: -15, warum: 'Für die Ärzte Routine, für sie nicht. Bagatellisieren verschließt.', weiter: 'd2' },
      ] },
      { id: 'd2', stimmung: 'aengstlich', sagt: 'Ich habe solche Angst, dass ich danach nicht mehr richtig sprechen kann. Ich bin Lehrerin.', antworten: [
        { text: 'Sie haben Angst um Ihre Stimme, weil sie für Ihren Beruf so wichtig ist. Was hat man Ihnen im Aufklärungsgespräch dazu gesagt?', technik: 'zuhoeren', urteil: 'gut', vertrauen: 20, warum: 'Paraphrasieren zeigt Verständnis, die offene Frage klärt den Wissensstand.', weiter: 'd3' },
        { text: 'Das passiert ganz selten, darüber müssen Sie sich keine Gedanken machen.', technik: 'beschwichtigen', urteil: 'fehler', vertrauen: -15, warum: 'Eine Stimmbandnervschädigung ist ein echtes Risiko, über das aufgeklärt wird. Verharmlosen ist fachlich und menschlich falsch.', weiter: 'd3' },
        { text: 'Dann hätten Sie das im Aufklärungsgespräch fragen müssen.', technik: 'rechtfertigen', urteil: 'fehler', vertrauen: -20, warum: 'Vorwurf statt Hilfe. Fragen dürfen jederzeit gestellt werden.', weiter: 'd3' },
      ] },
      { id: 'd3', stimmung: 'ruhiger', sagt: 'Ich war so aufgeregt, ich habe die Hälfte vergessen.', antworten: [
        { text: 'Das geht vielen so. Wollen wir Ihre Fragen zusammen aufschreiben? Ich sage dem Stationsarzt Bescheid, dass Sie heute Abend noch einmal sprechen möchten.', technik: 'vereinbaren', urteil: 'gut', vertrauen: 20, warum: 'Normalisieren, Fragen strukturieren und die ärztliche Aufklärung organisieren: Die Aufklärung über OP-Risiken ist ärztliche Aufgabe.', weiter: ENDE },
        { text: 'Ich erkläre Ihnen schnell, was bei der OP gemacht wird.', technik: 'informieren', urteil: 'teilweise', vertrauen: 0, warum: 'Pflegerische Informationen zum Ablauf sind gut, die Aufklärung über OP-Risiken gehört aber zum ärztlichen Gespräch.', weiter: ENDE },
        { text: 'Morgen früh ist die Visite, da können Sie fragen.', technik: 'rechtfertigen', urteil: 'teilweise', vertrauen: -5, warum: 'Am OP-Morgen ist kaum Zeit. Offene Fragen sollten vorher geklärt sein.', weiter: ENDE },
      ] },
    ],
    rolleKi: 'Du bist Frau Wagner, 45, Lehrerin, morgen wird deine Schilddrüse operiert. Am Abend sitzt du weinend auf dem Bett. Du hast große Angst, danach nicht mehr richtig sprechen zu können (Stimmbandnerv), und hast im Aufklärungsgespräch vor Aufregung vieles vergessen. Zuerst sagst du „Es ist nichts“. Wenn jemand sich Zeit nimmt und nachfragt, öffnest du dich. Floskeln wie „Das wird schon“ machen dich still.',
    merksaetze: ['„Es ist nichts“ ist oft eine Einladung zum Nachfragen.', 'Angst benennen, nicht wegreden.', 'Fragen sammeln und die ärztliche Aufklärung organisieren.'],
    quellen: ['Rogers: personzentrierte Gesprächsführung', 'Gordon: Kommunikationssperren', '§ 630e BGB: Aufklärungspflichten'],
  },
];

export const DIALOG = Object.fromEntries(DIALOGE.map((d) => [d.id, d])) as Record<string, Dialog>;
export const GESPRAECH_THEMEN = [...new Set(DIALOGE.flatMap((d) => d.topicIds))];
