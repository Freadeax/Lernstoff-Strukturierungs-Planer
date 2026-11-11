// Recht-Trainer, Ausbau: Fälle mit mehreren Entscheidungen und Zuordnungen zu Gesetzen.
// Eigene Fälle nach Gesetzestext (StGB, BGB, PflBG, SGB V, SGB XI, ArbZG), kein Text aus privatem Material. Keine Rechtsberatung.
// Themen als Text (aufgaben.ts importiert diese Datei, kein Zyklus).

import type { Aufgabe } from '../quiz/quiz';

type B = 'schweigepflicht' | 'strafrecht' | 'delegation' | 'fem' | 'vorsorge' | 'sozialrecht' | 'arbeitsrecht';

export const ERWEITERUNG: Partial<Record<B, Aufgabe[]>> = {
  schweigepflicht: [
    {
      id: 'fall.auskunft', art: 'fall', topicIds: ['thema.re.schweigepflicht'], titel: 'Fall: Wer darf was erfahren?', stufe: 3,
      frage: 'Wie gehst du mit Anfragen zu einer Patientin um?',
      einstieg: 'Frau G., 58 Jahre, liegt nach einem Suizidversuch auf deiner Station. Sie ist wach und orientiert.',
      schritte: [
        { lage: 'Ihr Arbeitgeber ruft an und fragt, wann sie wieder arbeiten kann.', frage: 'Was antwortest du?', optionen: ['Keine Auskunft, nicht einmal, dass sie hier liegt', 'Nur die ungefähre Dauer nennen', 'Den Grund nennen, aber keine Details'], richtig: [0], mehrfach: false, warum: 'Schon der Aufenthalt ist ein Geheimnis. Arbeitgeber haben keinen Anspruch auf Auskunft, die Arbeitsunfähigkeit bescheinigt die Ärztin.' },
        { lage: 'Ihr Ehemann kommt auf Station und möchte wissen, was passiert ist.', frage: 'Was ist richtig?', optionen: ['Frau G. fragen, ob und was er erfahren soll, und das dokumentieren', 'Als Ehemann hat er ein Recht auf alle Informationen', 'Ihn an die Polizei verweisen'], richtig: [0], mehrfach: false, warum: 'Auch gegenüber Ehepartnern gilt die Schweigepflicht. Frau G. ist einwilligungsfähig und entscheidet selbst.' },
        { lage: 'Eine Kollegin von einer anderen Station fragt in der Kantine, „was die Frau G. eigentlich hat“.', frage: 'Wie reagierst du?', optionen: ['Freundlich ablehnen: Wer nicht an der Behandlung beteiligt ist, bekommt keine Informationen', 'Erzählen, sie arbeitet ja auch im Haus', 'Nur andeuten, worum es geht'], richtig: [0], mehrfach: false, warum: 'Die Schweigepflicht gilt auch im Haus. Weitergegeben wird nur, was für die Behandlung nötig ist.' },
      ],
      erklaerung: ['Schweigepflicht gilt gegenüber allen, die nicht an der Behandlung beteiligt sind, auch gegenüber Angehörigen, Arbeitgebern und Kolleginnen.'],
    },
  ],
  strafrecht: [
    {
      id: 'zu.straftaten', art: 'zuordnen', topicIds: ['thema.re.haftung'], titel: 'Situation und Straftatbestand', stufe: 2,
      frage: 'Ordne jeder Situation den Straftatbestand zu, der in Betracht kommt.',
      paare: [
        { links: 'Bettgitter gegen den Willen ohne Genehmigung', rechts: 'Freiheitsberaubung (§ 239 StGB)' },
        { links: 'Diagnose im Bus laut am Telefon erzählt', rechts: 'Verletzung von Privatgeheimnissen (§ 203 StGB)' },
        { links: 'Injektion ohne Einwilligung', rechts: 'Körperverletzung (§ 223 StGB)' },
        { links: 'Nicht erbrachte Lagerung als erledigt abgezeichnet', rechts: 'Urkundenfälschung (§ 267 StGB)' },
        { links: 'Am Unfallort vorbeigegangen, obwohl Hilfe zumutbar war', rechts: 'Unterlassene Hilfeleistung (§ 323c StGB)' },
      ],
      erklaerung: ['Ob eine Straftat vorliegt, hängt im Einzelfall auch von Vorsatz, Rechtfertigung und Schuld ab. Die Zuordnung zeigt, welcher Tatbestand geprüft wird.'],
    },
  ],
  delegation: [
    {
      id: 'fall.delegation', art: 'fall', topicIds: ['thema.re.berufsrecht'], titel: 'Fall: Eine mündliche Anordnung', stufe: 3,
      frage: 'Wie gehst du mit einer delegierten Aufgabe um?',
      einstieg: 'Im Spätdienst ruft der Stationsarzt an: „Geben Sie Herrn P. bitte 40 mg Furosemid i. v., ich komme später vorbei.“',
      schritte: [
        { lage: 'Du hast i. v.-Gaben in der Ausbildung gelernt und schon mehrfach unter Aufsicht gemacht. Dein Haus erlaubt sie examinierten Pflegefachpersonen.', frage: 'Was tust du am Telefon?', optionen: ['Die Anordnung wiederholen (Patient, Medikament, Dosis, Weg) und bestätigen lassen', 'Einfach auflegen und vorbereiten', 'Die Anordnung ablehnen, weil sie mündlich ist'], richtig: [0], mehrfach: false, warum: 'Mündliche Anordnungen sind im Notfall oder bei Dringlichkeit möglich, wenn sie zurückgelesen und zeitnah schriftlich bestätigt werden.' },
        { lage: 'Du bist Auszubildende im zweiten Jahr und allein im Zimmer.', frage: 'Darfst du die Injektion allein geben?', optionen: ['Nein, nur unter Anleitung und Aufsicht einer Pflegefachperson nach Hausregel', 'Ja, die Anordnung ist ja klar', 'Ja, wenn der Patient einverstanden ist'], richtig: [0], mehrfach: false, warum: 'Auszubildende lernen delegierbare Tätigkeiten unter Anleitung. Eigenständige Übernahme ohne Aufsicht wäre ein Übernahmeverschulden.' },
        { lage: 'Die Gabe ist erfolgt.', frage: 'Was gehört danach dazu?', optionen: ['Gabe mit Uhrzeit dokumentieren', 'Wirkung und Nebenwirkungen beobachten, z. B. Ausscheidung und Blutdruck', 'Für die schriftliche Bestätigung der Anordnung sorgen', 'Nichts weiter, die Verantwortung liegt beim Arzt'], richtig: [0, 1, 2], mehrfach: true, warum: 'Die Durchführungsverantwortung umfasst auch Dokumentation und Beobachtung nach der Gabe.' },
      ],
      erklaerung: ['Delegation verteilt Verantwortung: Die Ärztin trägt die Anordnung, du die Übernahme und die sorgfältige Durchführung.'],
    },
  ],
  fem: [
    {
      id: 'fall.fem', art: 'fall', topicIds: ['thema.re.fem'], titel: 'Fall: Nächtliche Unruhe', stufe: 3,
      frage: 'Wie gehst du rechtlich und pflegerisch richtig vor?',
      einstieg: 'Herr N., 86 Jahre, mit Demenz und rechtlicher Betreuung, steht nachts mehrfach auf und ist sturzgefährdet. Die Tochter verlangt: „Machen Sie das Bettgitter hoch!“',
      schritte: [
        { lage: 'Es gibt keine Vorsorgevollmacht für die Tochter. Die Betreuerin ist ein Berufsbetreuer.', frage: 'Kann die Tochter wirksam in das Bettgitter einwilligen?', optionen: ['Nein, ohne Vollmacht oder Betreuung kann sie nicht für ihn entscheiden', 'Ja, als nächste Angehörige', 'Ja, wenn sie es schriftlich verlangt'], richtig: [0], mehrfach: false, warum: 'Angehörige sind nicht automatisch rechtliche Vertreter. Zuständig wäre der Betreuer, und auch er braucht für regelmäßige FEM die Genehmigung des Betreuungsgerichts.' },
        { lage: 'Das Team bespricht die Situation.', frage: 'Was versucht ihr vor jeder FEM?', optionen: ['Ursachen der Unruhe klären (Schmerz, Harndrang, Hunger, Delir)', 'Niederflurbett und Sturzmatte', 'Nachtlicht und Toilettengang vor dem Schlafen', 'Ein Schlafmittel zur Ruhigstellung ohne ärztliche Indikation'], richtig: [0, 1, 2], mehrfach: true, warum: 'Es gilt das mildeste wirksame Mittel. Ein Medikament nur zur Ruhigstellung wäre selbst eine FEM.' },
        { lage: 'In einer Nacht steigt Herr N. auf eine Fensterbank und droht zu stürzen.', frage: 'Was ist zulässig?', optionen: ['Ihn zur Abwehr der akuten Gefahr kurz festhalten und zurückbegleiten, dokumentieren und informieren', 'Ihn bis zum Morgen fixieren', 'Nichts tun, ohne Genehmigung darf man nicht eingreifen'], richtig: [0], mehrfach: false, warum: 'Bei akuter Gefahr ist ein kurzes Eingreifen als Notstand gerechtfertigt. Eine längere Maßnahme braucht eine Genehmigung.' },
      ],
      erklaerung: ['FEM brauchen eine Rechtsgrundlage, und vorher werden Alternativen gesucht. Angehörige ohne Vollmacht können nicht einwilligen.'],
    },
  ],
  vorsorge: [
    {
      id: 'zu.vorsorge', art: 'zuordnen', topicIds: ['thema.re.betreuung'], titel: 'Vorsorgeinstrumente', stufe: 2,
      frage: 'Ordne jeder Beschreibung das passende Instrument zu.',
      paare: [
        { links: 'Legt fest, welche Behandlungen jemand für später wünscht oder ablehnt', rechts: 'Patientenverfügung' },
        { links: 'Bestimmt eine Vertrauensperson, die stellvertretend entscheiden darf', rechts: 'Vorsorgevollmacht' },
        { links: 'Schlägt dem Gericht eine Person als Betreuer vor, falls eine Betreuung nötig wird', rechts: 'Betreuungsverfügung' },
        { links: 'Wird vom Betreuungsgericht für bestimmte Aufgabenbereiche eingerichtet', rechts: 'Rechtliche Betreuung' },
        { links: 'Erlaubt Ehepartnern eine Vertretung in Gesundheitsfragen für bis zu sechs Monate', rechts: 'Ehegattennotvertretungsrecht' },
      ],
      erklaerung: ['Vorsorge ist abgestuft: Was die Person selbst festgelegt hat, geht vor. Eine Betreuung wird nur eingerichtet, wenn es keine passende Vollmacht gibt.'],
    },
  ],
  sozialrecht: [
    {
      id: 'zu.kostentraeger', art: 'zuordnen', topicIds: ['thema.re.sgb5', 'thema.re.sgb11'], titel: 'Wer bezahlt was?', stufe: 2,
      frage: 'Ordne jede Leistung dem Gesetzbuch zu, nach dem sie in der Regel bezahlt wird.',
      paare: [
        { links: 'Verbandwechsel zu Hause nach ärztlicher Verordnung', rechts: 'SGB V (Krankenversicherung)' },
        { links: 'Pflegegeld für pflegende Angehörige', rechts: 'SGB XI (Pflegeversicherung)' },
        { links: 'Krankenhausbehandlung', rechts: 'SGB V (Krankenversicherung)' },
        { links: 'Kurzzeitpflege nach einem Krankenhausaufenthalt bei Pflegegrad 3', rechts: 'SGB XI (Pflegeversicherung)' },
        { links: 'Behandlung nach einem Arbeitsunfall', rechts: 'SGB VII (Unfallversicherung)' },
      ],
      erklaerung: ['Behandlung und Behandlungspflege zahlt die Krankenkasse, Hilfe im Alltag bei Pflegebedürftigkeit die Pflegekasse, Arbeitsunfälle die Unfallversicherung.'],
    },
  ],
  arbeitsrecht: [
    {
      id: 'fall.dienstplan', art: 'fall', topicIds: ['thema.re.arbeitsrecht'], titel: 'Fall: Der Dienstplan', stufe: 3,
      frage: 'Ist der Dienstplan mit dem Arbeitszeitgesetz vereinbar?',
      einstieg: 'Du bist 22 Jahre alt und arbeitest in einem Krankenhaus. Dein Dienstplan zeigt Spätdienst bis 21:30 Uhr und am nächsten Tag Frühdienst ab 6:00 Uhr.',
      schritte: [
        { lage: 'Zwischen den Diensten liegen achteinhalb Stunden.', frage: 'Ist das zulässig?', optionen: ['Nein, auch die verkürzte Ruhezeit im Krankenhaus beträgt mindestens 10 Stunden', 'Ja, im Krankenhaus gibt es keine Ruhezeit', 'Ja, wenn du einverstanden bist'], richtig: [0], mehrfach: false, warum: 'Grundsätzlich 11 Stunden, in Krankenhäusern und Pflegeeinrichtungen um bis zu eine Stunde verkürzbar, wenn es ausgeglichen wird.' },
        { lage: 'Am Wochenende sollst du 11 Stunden am Stück arbeiten, mit 30 Minuten Pause.', frage: 'Was stimmt?', optionen: ['Bei mehr als 9 Stunden Arbeit sind 45 Minuten Pause vorgeschrieben', 'Über 10 Stunden werktäglich sind nur in Ausnahmefällen oder nach Tarifvertrag zulässig', '30 Minuten reichen immer'], richtig: [0, 1], mehrfach: true, warum: 'Pausen und Höchstarbeitszeit regeln §§ 3 und 4 ArbZG. Tarifverträge können für Bereitschaft Abweichungen erlauben.' },
        { lage: 'Du möchtest den Dienstplan klären.', frage: 'An wen wendest du dich?', optionen: ['An die Stationsleitung oder Pflegedienstleitung', 'An den Betriebsrat bzw. die Personalvertretung, wenn es nicht geklärt wird', 'An die Patientinnen und Patienten'], richtig: [0, 1], mehrfach: true, warum: 'Die Personalvertretung hat bei Dienstplänen Mitbestimmungsrechte. Die Aufsichtsbehörde ist eine weitere Stelle bei anhaltenden Verstößen.' },
      ],
      erklaerung: ['Arbeitszeitschutz ist Gesundheitsschutz und Patientensicherheit. Übermüdung erhöht Fehler.'],
    },
  ],
};

export const ERWEITERUNG_VERTIEFUNG: Record<string, string[]> = {
  'fall.auskunft': [
    'Nach einem Suizidversuch ist besondere Vertraulichkeit wichtig, weil Stigmatisierung droht. Psychische Diagnosen gehören zu den sensibelsten Gesundheitsdaten.',
    'Viele Kliniken fragen bei Aufnahme, wer Auskunft erhalten darf, und vergeben ein Kennwort. Das erleichtert Anrufe und schützt zugleich.',
  ],
  'zu.straftaten': [
    'Eine Straftat setzt voraus: Tatbestand erfüllt, rechtswidrig (keine Rechtfertigung wie Einwilligung oder Notstand) und schuldhaft. Die Zuordnung prüft nur die erste Stufe.',
    'Viele dieser Taten sind auch fahrlässig strafbar, zum Beispiel die Körperverletzung (§ 229 StGB). Bei der Freiheitsberaubung reicht Fahrlässigkeit nicht.',
  ],
  'fall.delegation': [
    'Für i. v.-Injektionen gibt es kein Gesetz, das sie Pflegefachpersonen erlaubt oder verbietet. Die Grenzen ergeben sich aus Ausbildung, Hausregeln und Rechtsprechung.',
    'Das Zurücklesen nennt man Closed-Loop-Kommunikation. Es senkt Hörfehler bei Dosis und Medikament deutlich.',
  ],
  'fall.fem': [
    'Ohne Betreuung und Vollmacht kann ein Arzt in Notfällen nach dem mutmaßlichen Willen handeln. Für dauerhafte Entscheidungen wird beim Betreuungsgericht eine Betreuung angeregt.',
    'Das Gericht prüft bei FEM-Anträgen, ob Alternativen ausgeschöpft sind. Eine gute Dokumentation der versuchten Alternativen ist deshalb wichtig.',
  ],
  'zu.vorsorge': [
    'Die Betreuungsverfügung ist kein Ersatz für eine Vollmacht: Sie gibt dem Gericht nur einen Wunsch vor, wer Betreuer werden soll, und was er beachten soll.',
    'Alle Vorsorgedokumente können im Zentralen Vorsorgeregister erfasst werden, damit sie im Ernstfall gefunden werden.',
  ],
  'zu.kostentraeger': [
    'Das Sozialgesetzbuch hat zwölf Bücher. Für die Pflege besonders wichtig sind SGB V (Kranken), SGB IX (Rehabilitation und Teilhabe), SGB XI (Pflege) und SGB XII (Sozialhilfe, Hilfe zur Pflege).',
    'Manche Leistungen liegen an der Grenze, etwa Hilfsmittel: Rollstuhl oder Inkontinenzmaterial zur Behandlung zahlt meist die Krankenkasse, Pflegehilfsmittel wie Bettschutzeinlagen die Pflegekasse.',
  ],
  'fall.dienstplan': [
    'Für Auszubildende über 18 gilt das Arbeitszeitgesetz, für Jüngere das strengere Jugendarbeitsschutzgesetz. Unterrichtszeiten in der Schule zählen als Arbeitszeit.',
    'Wer übermüdet arbeitet, gefährdet sich und andere. Eine Überlastungsanzeige an die Leitung dokumentiert Risiken, wenn sich der Dienstplan nicht anders lösen lässt.',
  ],
};
