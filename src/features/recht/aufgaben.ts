// Recht-Trainer: Schweigepflicht, Strafrecht in der Pflege, Delegation, freiheitsentziehende
// Maßnahmen, Betreuung und Vorsorge, Pflegeversicherung und Arbeitsrecht.
// Grundlage sind die Gesetzestexte (StGB, BGB, PflBG, SGB V, SGB XI, ArbZG, MuSchG) und
// übliche Lehrbuchinhalte. Alle Fälle sind erfunden. Keine Rechtsberatung: Im Einzelfall
// gelten Hausregelungen, Rechtsprechung und die Auskunft von Vorgesetzten oder Rechtsabteilung.

import { mitVertiefung, type Aufgabe, type AuswahlAufgabe } from '../quiz/quiz';
import { VERTIEFUNG } from './vertiefung';

export type BereichId = 'schweigepflicht' | 'strafrecht' | 'delegation' | 'fem' | 'vorsorge' | 'sozialrecht' | 'arbeitsrecht';
export interface Bereich { id: BereichId; label: string; kurz: string; wissen: string[] }

export const RE_THEMEN = {
  schweigepflicht: 'thema.re.schweigepflicht',
  haftung: 'thema.re.haftung',
  berufsrecht: 'thema.re.berufsrecht',
  fem: 'thema.re.fem',
  betreuung: 'thema.re.betreuung',
  pflegegrade: 'thema.re.pflegegrade',
  sgb11: 'thema.re.sgb11',
  sgb5: 'thema.re.sgb5',
  arbeitsrecht: 'thema.re.arbeitsrecht',
} as const;

/** Welcher Bereich ein Thema am besten abfragt (für Sprünge aus Lernplan und Fehlerheft). */
export const BEREICH_ZU_THEMA: Record<string, BereichId> = {
  [RE_THEMEN.schweigepflicht]: 'schweigepflicht',
  [RE_THEMEN.haftung]: 'strafrecht',
  [RE_THEMEN.berufsrecht]: 'delegation',
  [RE_THEMEN.fem]: 'fem',
  [RE_THEMEN.betreuung]: 'vorsorge',
  [RE_THEMEN.pflegegrade]: 'sozialrecht',
  [RE_THEMEN.sgb11]: 'sozialrecht',
  [RE_THEMEN.sgb5]: 'sozialrecht',
  [RE_THEMEN.arbeitsrecht]: 'arbeitsrecht',
};

function frage(id: string, themen: string[], titel: string, f: string, optionen: string[], erklaerung: string[], richtig = [0], mehrfach = false): AuswahlAufgabe {
  return { id, art: 'auswahl', topicIds: themen, titel, frage: f, optionen, richtig, mehrfach, erklaerung };
}

const SP = [RE_THEMEN.schweigepflicht];
const HA = [RE_THEMEN.haftung];
const FEM = [RE_THEMEN.fem];

// ---------------------------------------------------------------- Schweigepflicht

const schweigepflicht: Aufgabe[] = [
  frage('sp.norm', SP, '§ 203 StGB', 'Welches Gesetz stellt die Verletzung der Schweigepflicht durch Pflegefachpersonen unter Strafe?',
    ['§ 203 StGB (Verletzung von Privatgeheimnissen)', '§ 223 StGB (Körperverletzung)', '§ 37 SGB V (häusliche Krankenpflege)', '§ 4 PflBG (vorbehaltene Tätigkeiten)'],
    ['Strafe: Freiheitsstrafe bis zu einem Jahr oder Geldstrafe. Die Schweigepflicht gilt auch nach dem Tod der Person weiter.']),
  frage('sp.wer', SP, 'Wer ist schweigepflichtig?', 'Wer unterliegt in einer Klinik der Schweigepflicht? Wähle alle zutreffenden.',
    ['Pflegefachpersonen', 'Auszubildende in der Pflege', 'Mitarbeitende, die dort als Gehilfen tätig sind, z. B. Stationssekretariat', 'Niemand, solange nichts aufgeschrieben wird'],
    ['Auch Auszubildende und berufsmäßig tätige Gehilfen sind nach § 203 StGB zur Verschwiegenheit verpflichtet, nicht nur Ärztinnen und Pflegefachpersonen.'],
    [0, 1, 2], true),
  frage('sp.was', SP, 'Was ist geschützt?', 'Was fällt unter die Schweigepflicht? Wähle alle zutreffenden.',
    ['Diagnosen und Befunde', 'Schon die Tatsache, dass jemand im Krankenhaus liegt', 'Private Dinge, die du bei der Pflege erfährst, z. B. Schulden', 'Was eine Patientin dir über ihren Partner erzählt'],
    ['Geschützt ist alles, was dir beruflich anvertraut oder bekannt wird, auch Geheimnisse über Dritte („Drittgeheimnisse“).'],
    [0, 1, 2, 3], true),
  frage('sp.telefon', SP, 'Auskunft am Telefon', 'Ein Anrufer stellt sich als Hausarzt von Herrn Lenz vor und fragt nach den heutigen Laborwerten. Was tust du?',
    ['Keine Auskunft, weil die Identität nicht sicher ist: Rückruf über die bekannte Praxisnummer oder an die Stationsärztin weitergeben', 'Die Werte vorlesen, weil Ärzte immer Auskunft bekommen', 'Nur die auffälligen Werte nennen', 'Den Anrufer bitten, sein Geburtsdatum zu nennen, und dann Auskunft geben'],
    ['Am Telefon kannst du nicht prüfen, wer spricht. Ein Rückruf über eine bekannte Nummer schützt den Patienten und dich.']),
  frage('sp.angehoerige', SP, 'Angehörige', 'Die Tochter eines Patienten fragt dich auf dem Flur nach seiner Diagnose. Der Patient ist wach und orientiert. Was gilt?',
    ['Auskunft nur, wenn der Patient eingewilligt hat; über die Diagnose informiert ohnehin die Ärztin', 'Angehörige ersten Grades dürfen immer alles erfahren', 'Du darfst Auskunft geben, wenn sie sich ausweist', 'Du darfst nur sagen, dass es ihm schlecht geht'],
    ['Auch gegenüber Angehörigen gilt die Schweigepflicht. Frag den Patienten, wen er informiert haben möchte, und dokumentiere das.']),
  frage('sp.unterricht', SP, 'Fallbesprechung', 'Du möchtest in der Pflegeschule einen Fall aus deinem Einsatz vorstellen. Was ist richtig?',
    ['Den Fall anonymisieren: kein Name, keine Station, Alter und Details so verändern, dass niemand die Person erkennt', 'Den Namen weglassen reicht immer', 'Im Unterricht gilt keine Schweigepflicht', 'Vorher nur die Stationsleitung fragen, dann sind alle Angaben erlaubt'],
    ['Schon Station, Alter und eine seltene Diagnose zusammen können eine Person erkennbar machen.']),
  frage('sp.befugnis', SP, 'Offenbarungsbefugnis', 'Wann darfst du ein Geheimnis befugt weitergeben? Wähle alle zutreffenden.',
    ['Die Person hat wirksam eingewilligt', 'Im Notfall, wenn eine Einwilligung mutmaßlich vorliegt, z. B. Angehörige einer bewusstlosen Patientin informieren', 'Ein Gesetz schreibt eine Meldung vor, z. B. das Infektionsschutzgesetz', 'Die Polizei fragt nach einer bereits begangenen Tat'],
    ['Zur Aufklärung einer schon begangenen Tat darfst du die Schweigepflicht grundsätzlich nicht brechen. Anders bei einer geplanten schweren Straftat, die noch verhindert werden kann (§ 138 StGB), oder einer akuten Gefahr für andere (§ 34 StGB).'],
    [0, 1, 2], true),
  frage('sp.gefahr', SP, 'Gefahr für andere', 'Eine Patientin erzählt dir glaubhaft, dass ihr Partner ihr Kind zu Hause schlägt. Was ist richtig?',
    ['Ernst nehmen, nichts versprechen, sofort Vorgesetzte und Ärztin einbeziehen; zum Schutz des Kindes darf die Schweigepflicht durchbrochen werden', 'Schweigen, weil die Schweigepflicht immer Vorrang hat', 'Selbst den Partner anrufen und zur Rede stellen', 'Erst einmal abwarten, ob sie es noch einmal erzählt'],
    ['Eine gegenwärtige Gefahr für Leib und Leben eines Kindes kann die Weitergabe rechtfertigen (rechtfertigender Notstand, § 34 StGB). Das entscheidet das Team mit der Ärztin, nicht du allein.']),
  frage('sp.mehrbett', SP, 'Mehrbettzimmer', 'Im Dreibettzimmer möchtest du mit einer Patientin über ihr neues HIV-Testergebnis sprechen. Was tust du?',
    ['Ein Gespräch an einem ungestörten Ort anbieten, nicht vor den Mitpatienten', 'Leise sprechen reicht', 'Die Mitpatienten kurz bitten, nicht zuzuhören', 'Das ist kein Problem, solange du nur Fakten nennst'],
    ['Beschämende oder sensible Themen gehören nicht vor andere. Auch die Pflegeanamnese erhebst du möglichst ohne Zuhörer.']),
];

// ---------------------------------------------------------------- Strafrecht

const strafrecht: Aufgabe[] = [
  frage('st.koerperverletzung', HA, 'Körperverletzung', 'Warum ist eine s.c.-Injektion zur Thromboseprophylaxe keine strafbare Körperverletzung?',
    ['Weil sie ärztlich angeordnet, medizinisch begründet und von der aufgeklärten Patientin eingewilligt ist', 'Weil kleine Stiche nie als Körperverletzung zählen', 'Weil Pflegefachpersonen grundsätzlich nicht bestraft werden', 'Weil die Patientin im Krankenhaus liegt'],
    ['Jeder Eingriff in den Körper erfüllt zunächst den Tatbestand des § 223 StGB. Die wirksame Einwilligung nach Aufklärung (§ 228 StGB) rechtfertigt ihn.']),
  frage('st.einwilligung', HA, 'Einwilligung', 'Was braucht eine wirksame Einwilligung? Wähle alle zutreffenden.',
    ['Die Person ist einwilligungsfähig, versteht also Bedeutung und Tragweite', 'Sie wurde vorher verständlich aufgeklärt', 'Sie willigt freiwillig ein', 'Sie hat einmal bei der Aufnahme für alles unterschrieben'],
    ['Eine pauschale Unterschrift bei der Aufnahme ersetzt keine Einwilligung in eine bestimmte Maßnahme. Die Einwilligung kann jederzeit widerrufen werden.'],
    [0, 1, 2], true),
  frage('st.vorsatz', HA, 'Vorsatz und Fahrlässigkeit', 'Was bedeutet Fahrlässigkeit?',
    ['Die erforderliche Sorgfalt außer Acht lassen, obwohl der Schaden vorhersehbar und vermeidbar war', 'Einen Schaden bewusst herbeiführen wollen', 'Jeder Schaden, der im Dienst passiert', 'Eine Handlung ohne ärztliche Anordnung'],
    ['Vorsatz heißt: Wissen und Wollen. Fahrlässig handelt, wer nicht vorsätzlich handelt, aber sorgfaltswidrig. Auch fahrlässige Körperverletzung (§ 229) und fahrlässige Tötung (§ 222) sind strafbar.']),
  frage('st.sturz', HA, 'Fahrlässige Tötung', 'Für eine sturzgefährdete Bewohnerin steht im Plan: „Beim Toilettengang nicht allein lassen.“ Eine Pflegekraft lässt sie trotzdem kurz allein, sie stürzt tödlich. Was kommt strafrechtlich in Betracht?',
    ['Fahrlässige Tötung, weil der Sturz vorhersehbar war und die Anweisung bekannt', 'Mord, weil sie gestorben ist', 'Nichts, weil Stürze im Heim schicksalhaft sind', 'Nur eine Ordnungswidrigkeit'],
    ['Geprüft wird, ob der Tod bei pflichtgemäßem Verhalten vermieden worden wäre. Daneben kann der Träger zivilrechtlich haften, z. B. bei zu wenig Personal (Organisationsverschulden).']),
  frage('st.aussetzung', HA, 'Aussetzung', 'Was ist Aussetzung nach § 221 StGB?',
    ['Jemanden, den man in seiner Obhut hat, in einer hilflosen Lage im Stich lassen, sodass Lebens- oder schwere Gesundheitsgefahr droht', 'Einen Patienten in ein anderes Zimmer verlegen', 'Eine Maßnahme verschieben, weil die Zeit fehlt', 'Einen Dienst tauschen'],
    ['Beispiel: im Nachtdienst die Station verlassen und hilflose Bewohner ohne Aufsicht und Klingel zurücklassen.']),
  frage('st.hilfeleistung', HA, 'Unterlassene Hilfeleistung', 'Auf dem Heimweg siehst du einen Radfahrer gestürzt am Boden liegen. Was gilt nach § 323c StGB?',
    ['Du musst helfen, soweit es erforderlich und zumutbar ist: Eigenschutz, Unfallstelle sichern, Notruf, Erste Hilfe', 'Du musst nur helfen, wenn du im Dienst bist', 'Du darfst weitergehen, wenn schon andere zuschauen', 'Hilfe ist freiwillig'],
    ['Unterlassene Hilfeleistung ist mit bis zu einem Jahr Freiheitsstrafe bedroht. Strafbar ist seit 2017 auch, wer Helfende behindert, z. B. durch Gaffen.']),
  frage('st.doku', HA, 'Dokumentation als Urkunde', 'Du hast gestern vergessen, eine Lagerung einzutragen. Wie gehst du richtig vor?',
    ['Heute als Nachtrag mit aktuellem Datum, Uhrzeit und Handzeichen eintragen', 'Den Eintrag mit gestrigem Datum ergänzen', 'Nichts mehr eintragen', 'Eine Kollegin bitten, mit ihrem Kürzel abzuzeichnen'],
    ['Die ausgefüllte Dokumentation ist eine Urkunde. Nachträgliches Verändern, Abzeichnen für andere oder Abzeichnen nicht erbrachter Leistungen kann Urkundenfälschung (§ 267 StGB) oder Betrug sein.']),
  frage('st.doku-falsch', HA, 'Dokumentation als Urkunde', 'Was ist bei der Pflegedokumentation nicht erlaubt? Wähle alle zutreffenden.',
    ['Mit dem Passwort der Praxisanleiterin dokumentieren', 'Wegen Personalmangel ausgefallene Maßnahmen trotzdem abzeichnen', 'Den Eintrag einer Auszubildenden nachträglich inhaltlich verändern', 'Einen eigenen Fehler mit Datum und Handzeichen richtigstellen, sodass der alte Text lesbar bleibt'],
    ['Eine eigene Korrektur ist erlaubt, wenn sie als solche erkennbar bleibt (durchstreichen, nicht überkleben, mit Datum und Handzeichen).'],
    [0, 1, 2], true),
  frage('st.haftung-arten', HA, 'Haftung', 'Nach einem Pflegefehler mit Schaden: Welche Folgen sind nebeneinander möglich? Wähle alle zutreffenden.',
    ['Strafrechtlich: Geld- oder Freiheitsstrafe', 'Zivilrechtlich: Schadensersatz und Schmerzensgeld', 'Arbeitsrechtlich: Abmahnung bis Kündigung', 'Keine, wenn die Patientin privat versichert ist'],
    ['Die drei Rechtsbereiche stehen nebeneinander. Bei leichter Fahrlässigkeit haftet im Arbeitsverhältnis meist der Arbeitgeber, bei grober Fahrlässigkeit kann er Rückgriff nehmen.'],
    [0, 1, 2], true),
];

// ---------------------------------------------------------------- Delegation und Vorbehaltsaufgaben

const delegation: Aufgabe[] = [
  {
    id: 'de.verantwortung', art: 'reihenfolge', topicIds: HA, titel: 'Die drei Verantwortungen',
    frage: 'Eine Ärztin delegiert eine Injektion an dich. Ordne die Verantwortungen in der Reihenfolge, in der sie zum Tragen kommen.',
    schritte: ['Anordnungsverantwortung (Ärztin: Ist die Aufgabe delegierbar, die Anordnung klar, die Person geeignet?)', 'Übernahmeverantwortung (du: Kann ich das wirklich? Sonst ablehnen)', 'Durchführungsverantwortung (du: sorgfältig und nach aktuellem Fachstand ausführen)'],
    erklaerung: ['Bei einem Schaden werden alle drei Verantwortungen geprüft. Die Anordnung kommt möglichst schriftlich.'],
  },
  frage('de.ablehnen', HA, 'Übernahmeverantwortung', 'Du bist seit zwei Wochen auf der Station. Der Arzt bittet dich, eine Drainage zu ziehen. Das hast du noch nie gemacht. Was tust du?',
    ['Offen sagen, dass du es noch nicht kannst, und ablehnen; anbieten, es unter Anleitung zu lernen', 'Es versuchen, weil der Arzt es angeordnet hat', 'Eine Kollegin fragen, wie es geht, und es dann allein machen', 'Es machen und hinterher nicht dokumentieren'],
    ['Wer eine Aufgabe übernimmt, obwohl er sie nicht beherrscht, haftet selbst (Übernahmeverschulden). Ablehnen ist hier Pflicht, nicht Schwäche.']),
  frage('de.remonstration', HA, 'Remonstration', 'Dir kommt eine angeordnete Dosis ungewöhnlich hoch vor. Was ist richtig?',
    ['Zweifel unverzüglich der anordnenden Ärztin mitteilen und die Rückmeldung dokumentieren, bevor du gibst', 'Die Dosis still halbieren', 'Ohne Rückfrage geben, weil die Ärztin die Verantwortung trägt', 'Das Medikament einfach weglassen'],
    ['Das nennt man Remonstration. Bestätigt die Ärztin die Anordnung nach Prüfung, darfst du in der Regel auf ihre Fachkompetenz vertrauen, außer der Fehler ist offensichtlich.']),
  frage('de.voraussetzungen', HA, 'Delegation', 'Was muss vorliegen, damit du eine ärztliche Tätigkeit übernehmen darfst? Wähle alle zutreffenden.',
    ['Eine ärztliche Anordnung', 'Die Einwilligung der Patientin', 'Deine fachliche Befähigung', 'Die Zustimmung der Angehörigen'],
    ['Dazu kommt deine Bereitschaft zur Übernahme. Angehörige entscheiden nur, wenn sie rechtlich vertreten (Betreuung, Vollmacht).'],
    [0, 1, 2], true),
  frage('de.aerztlich', HA, 'Nicht delegierbar', 'Welche Aufgabe bleibt der Ärztin vorbehalten und darf nicht an Pflegende delegiert werden?',
    ['Die Diagnose stellen und die Patientin über einen Eingriff aufklären', 'Eine s.c.-Injektion verabreichen', 'Eine Infusion nach Anordnung anhängen', 'Einen Verband nach Anordnung wechseln'],
    ['Diagnose, Therapieentscheidung, ärztliche Aufklärung und der Kern eines operativen Eingriffs sind ärztliche Kernaufgaben.']),
  frage('de.vorbehalt', [RE_THEMEN.berufsrecht], 'Vorbehaltene Tätigkeiten', 'Welche Tätigkeiten sind nach § 4 PflBG Pflegefachpersonen vorbehalten? Wähle alle zutreffenden.',
    ['Erhebung und Feststellung des individuellen Pflegebedarfs', 'Organisation, Gestaltung und Steuerung des Pflegeprozesses', 'Analyse, Evaluation, Sicherung und Entwicklung der Qualität der Pflege', 'Verabreichung von Injektionen'],
    ['Diese drei Aufgaben dürfen nur Pflegefachpersonen ausführen, auch Ärztinnen nicht. Injektionen sind delegierbar, aber keine Vorbehaltsaufgabe.'],
    [0, 1, 2], true),
  frage('de.substitution', [RE_THEMEN.berufsrecht], 'Delegation und Substitution', 'Was unterscheidet Substitution von Delegation?',
    ['Bei Substitution übernimmt die Pflege eine Aufgabe eigenverantwortlich, die ärztliche Verantwortung entfällt', 'Substitution heißt, dass die Ärztin daneben steht', 'Es gibt keinen Unterschied', 'Substitution ist nur in der Langzeitpflege erlaubt'],
    ['Substitution braucht eine gesetzliche Grundlage und eine passende Qualifikation, z. B. Zusatzmodule oder ein Studium.']),
  frage('de.ausbildung', [RE_THEMEN.berufsrecht], 'Pflegeberufegesetz', 'Wie ist die generalistische Ausbildung nach dem Pflegeberufegesetz aufgebaut?',
    ['Drei Jahre in Vollzeit, mindestens 2100 Stunden Unterricht und 2500 Stunden Praxis, Abschluss mit staatlicher Prüfung', 'Zwei Jahre, nur in der Praxis', 'Drei Jahre, Prüfung nur schriftlich', 'Ein Jahr Theorie, danach freie Wahl des Einsatzes'],
    ['Die staatliche Prüfung hat einen schriftlichen, einen mündlichen und einen praktischen Teil (PflAPrV). In Teilzeit dauert die Ausbildung höchstens fünf Jahre.']),
  frage('de.bezeichnung', [RE_THEMEN.berufsrecht], 'Berufsbezeichnung', 'Wer darf sich „Pflegefachfrau“ oder „Pflegefachmann“ nennen?',
    ['Nur wer die Erlaubnis zum Führen der Berufsbezeichnung nach dem Pflegeberufegesetz hat', 'Alle, die in der Pflege arbeiten', 'Alle Auszubildenden ab dem zweiten Jahr', 'Alle mit einem Pflegebasiskurs'],
    ['Die Berufsbezeichnung ist geschützt. Die Erlaubnis gibt es nach bestandener Prüfung, wenn auch Zuverlässigkeit, gesundheitliche Eignung und Sprachkenntnisse vorliegen.']),
  frage('de.helfer', HA, 'Delegation an Pflegehilfe', 'Du bist Pflegefachperson und möchtest eine Aufgabe an eine Pflegehilfskraft übertragen. Was ist deine Pflicht?',
    ['Prüfen, ob sie die Aufgabe kann, klar anleiten und die Ausführung überwachen', 'Nichts, die Hilfskraft trägt die volle Verantwortung', 'Die Aufgabe nur mündlich nennen, Kontrolle ist unnötig', 'Die Aufgabe nur übertragen, wenn die Ärztin zustimmt'],
    ['Wer delegiert, trägt die Anordnungsverantwortung: Auswahl, Anleitung und Überwachung.']),
];

// ---------------------------------------------------------------- Freiheitsentziehende Maßnahmen

const fem: Aufgabe[] = [
  frage('fem.was', FEM, 'Was ist eine FEM?', 'Was kann eine freiheitsentziehende Maßnahme sein? Wähle alle zutreffenden.',
    ['Bettgitter bei einer Person, die aufstehen möchte', 'Den Rollator außer Reichweite stellen', 'Ein Medikament nur zur Ruhigstellung', 'Ein Niederflurbett mit Sturzmatte'],
    ['Entscheidend ist, ob die Person sich gegen ihren Willen nicht mehr frei bewegen kann. Ein Niederflurbett ist eine Alternative zur FEM.'],
    [0, 1, 2], true),
  frage('fem.strafbar', FEM, 'Freiheitsberaubung', 'Welche Straftat kann eine nicht gerechtfertigte FEM sein?',
    ['Freiheitsberaubung nach § 239 StGB', 'Urkundenfälschung', 'Unterlassene Hilfeleistung', 'Verletzung von Privatgeheimnissen'],
    ['Daneben drohen zivilrechtliche (Schadensersatz) und arbeitsrechtliche Folgen.']),
  frage('fem.zulaessig', FEM, 'Wann zulässig?', 'Wann ist eine FEM rechtlich zulässig? Wähle alle zutreffenden.',
    ['Die einwilligungsfähige Person willigt selbst ein', 'Das Betreuungsgericht hat sie bei einer betreuten Person vorher genehmigt', 'Im akuten Notfall zur Abwehr einer gegenwärtigen Gefahr, kurz und mit unverzüglicher Einholung der Genehmigung', 'Die Angehörigen wünschen es'],
    ['Angehörige können ohne Vollmacht oder Betreuung nicht einwilligen, und auch Bevollmächtigte und Betreuer brauchen für längere oder regelmäßige FEM die Genehmigung des Betreuungsgerichts.'],
    [0, 1, 2], true),
  frage('fem.mildestes', FEM, 'Alternativen', 'Ein Bewohner mit Demenz steht nachts oft auf und ist sturzgefährdet. Was versuchst du vor jeder FEM?',
    ['Alternativen wie Niederflurbett, Sturzmatte, Nachtlicht, Sensormatte, Toilettengang vor dem Schlafen und Ursachen der Unruhe klären', 'Das Bettgitter hochziehen, weil das am sichersten ist', 'Ihn abends früher ins Bett bringen', 'Die Zimmertür abschließen'],
    ['Bettgitter verhindern Stürze oft nicht, sondern machen sie gefährlicher (Übersteigen, Einklemmen). Es gilt immer das mildeste wirksame Mittel.']),
  frage('fem.fixierung', FEM, 'Fixierung', 'Was gilt für eine 5- oder 7-Punkt-Fixierung, die absehbar länger als eine halbe Stunde dauert?',
    ['Sie braucht eine richterliche Genehmigung und eine ständige 1:1-Betreuung', 'Eine Anordnung der Stationsleitung reicht', 'Sie ist erlaubt, wenn sie dokumentiert wird', 'Sie ist nie erlaubt'],
    ['Das hat das Bundesverfassungsgericht 2018 entschieden. Die Fixierung muss engmaschig überprüft und beendet werden, sobald sie nicht mehr nötig ist.']),
  frage('fem.risiken', FEM, 'Risiken', 'Welche Folgen können FEM haben? Wähle alle zutreffenden.',
    ['Angst und Unruhe', 'Verletzungen bis zur Strangulation', 'Abbau von Mobilität und Muskelkraft', 'Sicherer Schutz vor jedem Sturz'],
    ['FEM schützen nicht zuverlässig. Deshalb regelmäßig prüfen, ob sie noch nötig sind, und Alternativen suchen (z. B. Werdenfelser Weg).'],
    [0, 1, 2], true),
];

// ---------------------------------------------------------------- Betreuung und Vorsorge

const BT = [RE_THEMEN.betreuung];

const vorsorge: Aufgabe[] = [
  frage('vo.pv', BT, 'Patientenverfügung', 'Was regelt eine Patientenverfügung?',
    ['Welche medizinischen Maßnahmen jemand für den Fall wünscht oder ablehnt, dass er nicht mehr selbst entscheiden kann', 'Wer das Vermögen erbt', 'Wer die Wohnung kündigen darf', 'Welcher Pflegegrad bewilligt wird'],
    ['Sie muss schriftlich sein (§ 1827 BGB). Liegt sie vor und passt sie zur Situation, ist sie für alle bindend.']),
  frage('vo.vollmacht', BT, 'Vorsorgevollmacht', 'Was ist eine Vorsorgevollmacht?',
    ['Eine selbst ausgewählte Vertrauensperson darf für jemanden entscheiden, wenn er es nicht mehr kann', 'Eine Anordnung der Ärztin für den Notfall', 'Eine Genehmigung des Gerichts', 'Ein Antrag bei der Pflegekasse'],
    ['Liegt eine passende Vorsorgevollmacht vor, ist eine rechtliche Betreuung in diesen Bereichen meist nicht nötig.']),
  frage('vo.betreuung', BT, 'Rechtliche Betreuung', 'Wer bestellt eine rechtliche Betreuerin?',
    ['Das Betreuungsgericht', 'Die Pflegedienstleitung', 'Die Hausärztin', 'Die Angehörigen untereinander'],
    ['Eine Betreuung gibt es nur für die Aufgabenbereiche, in denen sie wirklich nötig ist. Wünsche der betreuten Person haben Vorrang.']),
  frage('vo.ehegatten', BT, 'Ehegattennotvertretung', 'Ein Mann ist nach einem Unfall bewusstlos, es gibt weder Vollmacht noch Betreuung. Was gilt seit 2023 für seine Ehefrau?',
    ['Sie darf ihn in Gesundheitsfragen für längstens sechs Monate vertreten, wenn kein Widerspruch bekannt ist', 'Sie darf alles entscheiden, auch über das Vermögen', 'Sie hat ohne Vollmacht nie ein Recht zu entscheiden', 'Sie muss erst beim Gericht einen Antrag stellen'],
    ['Das Ehegattennotvertretungsrecht (§ 1358 BGB) gilt nur für die Gesundheitssorge und eng verbundene Fragen. Die Ärztin bestätigt die Voraussetzungen schriftlich.']),
  frage('vo.wille', BT, 'Wille der Person', 'Wonach richtet sich eine Entscheidung, wenn keine passende Patientenverfügung vorliegt?',
    ['Nach dem mutmaßlichen Willen der Person, ermittelt aus früheren Äußerungen, Werten und Überzeugungen', 'Nach dem Wunsch der Angehörigen', 'Nach dem, was medizinisch am meisten möglich ist', 'Nach der Meinung der Pflegekraft'],
    ['Bevollmächtigte oder Betreuer ermitteln den mutmaßlichen Willen gemeinsam mit der Ärztin. Pflegende tragen bei, was sie von der Person wissen.']),
];

// ---------------------------------------------------------------- Pflegeversicherung und Krankenversicherung

const PG = [RE_THEMEN.pflegegrade];

const sozialrecht: Aufgabe[] = [
  {
    id: 'so.grade', art: 'reihenfolge', topicIds: PG, titel: 'Pflegegrade',
    frage: 'Ordne die Gesamtpunkte im Begutachtungsinstrument den Pflegegraden 1 bis 5 zu, vom niedrigsten Pflegegrad aufwärts.',
    schritte: ['12,5 bis unter 27 Punkte', '27 bis unter 47,5 Punkte', '47,5 bis unter 70 Punkte', '70 bis unter 90 Punkte', '90 bis 100 Punkte'],
    erklaerung: ['Unter 12,5 Punkten gibt es keinen Pflegegrad. Die Schwellen stehen in § 15 SGB XI.'],
  },
  frage('so.module', PG, 'Module der Begutachtung', 'Welches Modul geht mit dem größten Anteil (40 %) in die Gesamtpunkte ein?',
    ['Selbstversorgung', 'Mobilität', 'Gestaltung des Alltagslebens und sozialer Kontakte', 'Umgang mit krankheits- und therapiebedingten Anforderungen'],
    ['Gewichtung: Mobilität 10 %, kognitive und kommunikative Fähigkeiten oder Verhaltensweisen und psychische Problemlagen (der höhere Wert) 15 %, Selbstversorgung 40 %, krankheits- und therapiebedingte Anforderungen 20 %, Alltagsleben und soziale Kontakte 15 %.']),
  frage('so.module2', PG, 'Module der Begutachtung', 'Welche Bereiche gehören zu den sechs Modulen des Begutachtungsinstruments? Wähle alle zutreffenden.',
    ['Mobilität', 'Kognitive und kommunikative Fähigkeiten', 'Verhaltensweisen und psychische Problemlagen', 'Haushaltsführung und Einkommen'],
    ['Haushaltsführung wird erfasst, fließt aber nicht in den Pflegegrad ein. Das Einkommen spielt für den Pflegegrad keine Rolle.'],
    [0, 1, 2], true),
  frage('so.antrag', [RE_THEMEN.sgb11], 'Antrag und Begutachtung', 'Wie kommt eine gesetzlich versicherte Person zu einem Pflegegrad?',
    ['Antrag bei der Pflegekasse, dann Begutachtung durch den Medizinischen Dienst, die Pflegekasse entscheidet', 'Die Hausärztin stellt den Pflegegrad fest', 'Das Pflegeheim legt den Pflegegrad fest', 'Antrag beim Sozialamt, das Amtsgericht entscheidet'],
    ['Bei privat Versicherten begutachtet Medicproof. Gegen den Bescheid ist ein Widerspruch möglich.']),
  frage('so.leistungen', [RE_THEMEN.sgb11], 'Leistungen der Pflegeversicherung', 'Was ist der Unterschied zwischen Pflegegeld und Pflegesachleistung?',
    ['Pflegegeld bekommt die Person, wenn Angehörige pflegen; Sachleistung bezahlt einen ambulanten Pflegedienst', 'Pflegegeld gibt es nur im Heim', 'Sachleistung ist ein Zuschuss für Hilfsmittel', 'Es gibt keinen Unterschied'],
    ['Beides lässt sich als Kombinationsleistung verbinden. Pflegegeld gibt es ab Pflegegrad 2.']),
  frage('so.hkp', [RE_THEMEN.sgb5], 'Häusliche Krankenpflege', 'Wer bezahlt die ärztlich verordnete Behandlungspflege zu Hause, z. B. Insulin spritzen oder Verband wechseln?',
    ['Die Krankenkasse nach SGB V (häusliche Krankenpflege, § 37)', 'Die Pflegekasse aus dem Pflegegeld', 'Immer die Person selbst', 'Das Sozialamt'],
    ['Grundpflege und Hilfe im Alltag gehören zur Pflegeversicherung (SGB XI), ärztlich verordnete Behandlungspflege zur Krankenversicherung (SGB V).']),
  frage('so.hkp-weg', [RE_THEMEN.sgb5], 'Häusliche Krankenpflege', 'Wie kommt eine Patientin zu Hause zu häuslicher Krankenpflege?',
    ['Die Ärztin verordnet sie, die Krankenkasse genehmigt sie, ein Pflegedienst führt sie aus', 'Der Pflegedienst entscheidet allein und rechnet mit der Pflegekasse ab', 'Die Pflegekasse verordnet sie nach der Begutachtung', 'Angehörige beantragen sie beim Sozialamt'],
    ['Die Verordnung ist zeitlich begrenzt. Ohne Verordnung darf der Pflegedienst Behandlungspflege nicht mit der Krankenkasse abrechnen.']),
  frage('so.zuzahlung', [RE_THEMEN.sgb5], 'Zuzahlung', 'Wie hoch ist die gesetzliche Zuzahlung für ein verschreibungspflichtiges Medikament in der Regel?',
    ['10 % des Preises, mindestens 5 und höchstens 10 Euro, nie mehr als der Preis selbst', 'Immer 20 Euro', 'Die Hälfte des Preises', 'Es gibt keine Zuzahlung'],
    ['So steht es in § 61 SGB V. Kinder und Jugendliche unter 18 sind befreit, außerdem gibt es eine Belastungsgrenze.']),
  frage('so.saeule', [RE_THEMEN.sgb11], 'Sozialversicherung', 'Seit wann gibt es die soziale Pflegeversicherung als fünfte Säule der Sozialversicherung?',
    ['Seit 1995', 'Seit 1883', 'Seit 2017', 'Seit 1949'],
    ['Seit 2017 gilt der neue Pflegebedürftigkeitsbegriff mit fünf Pflegegraden statt drei Pflegestufen.']),
];

// ---------------------------------------------------------------- Arbeitsrecht und Arbeitsschutz

const AR = [RE_THEMEN.arbeitsrecht];

const arbeitsrecht: Aufgabe[] = [
  frage('ar.pause', AR, 'Pausen', 'Wie lange muss die Pause bei einer Arbeitszeit von mehr als sechs bis neun Stunden mindestens sein?',
    ['30 Minuten', '15 Minuten', '45 Minuten', '60 Minuten'],
    ['Bei mehr als neun Stunden sind es 45 Minuten (§ 4 ArbZG). Pausen lassen sich in Abschnitte von mindestens 15 Minuten teilen.']),
  frage('ar.arbeitszeit', AR, 'Arbeitszeit', 'Wie lang darf die werktägliche Arbeitszeit nach dem Arbeitszeitgesetz höchstens sein?',
    ['8 Stunden, verlängerbar auf 10 Stunden, wenn im Schnitt 8 Stunden eingehalten werden', '12 Stunden ohne Ausgleich', '6 Stunden', 'Es gibt keine Grenze im Gesundheitswesen'],
    ['Der Ausgleich muss innerhalb von sechs Kalendermonaten oder 24 Wochen erfolgen. Tarifverträge können Abweichungen regeln.']),
  frage('ar.ruhezeit', AR, 'Ruhezeit', 'Wie lange muss die Ruhezeit zwischen zwei Diensten grundsätzlich sein?',
    ['11 Stunden', '8 Stunden', '6 Stunden', '24 Stunden'],
    ['In Krankenhäusern und Pflegeeinrichtungen darf sie um bis zu eine Stunde verkürzt werden, wenn das an anderer Stelle ausgeglichen wird (§ 5 ArbZG).']),
  frage('ar.mutterschutz', AR, 'Mutterschutz', 'Wie lange dauert die Schutzfrist nach dem Mutterschutzgesetz in der Regel?',
    ['6 Wochen vor und 8 Wochen nach der Geburt', '2 Wochen vor und 2 Wochen nach der Geburt', '3 Monate nach der Geburt', 'Ein Jahr'],
    ['Nach der Geburt besteht ein Beschäftigungsverbot. Bei Früh- oder Mehrlingsgeburten verlängert sich die Frist auf 12 Wochen.']),
  frage('ar.schwanger', AR, 'Mutterschutz', 'Eine schwangere Pflegefachfrau soll weiter arbeiten. Was gehört zum Schutz am Arbeitsplatz? Wähle alle zutreffenden.',
    ['Keine Tätigkeiten mit erhöhter Infektionsgefahr ohne Schutzmaßnahmen', 'Kein schweres Heben und Tragen', 'Eine Gefährdungsbeurteilung durch den Arbeitgeber', 'Mehr Nachtdienste, weil es ruhiger ist'],
    ['Nachtarbeit zwischen 20 und 6 Uhr ist für Schwangere grundsätzlich verboten, Ausnahmen nur unter engen Voraussetzungen.'],
    [0, 1, 2], true),
  frage('ar.arbeitsunfall', AR, 'Arbeitsunfall', 'Du stichst dich nach einer Blutzuckermessung an der benutzten Lanzette. Was ist richtig? Wähle alle zutreffenden.',
    ['Blutung fördern, desinfizieren und sofort beim Durchgangsarzt bzw. Betriebsarzt vorstellen', 'Als Arbeitsunfall melden und dokumentieren', 'Die Patientin nach Einwilligung auf Hepatitis und HIV testen lassen, wie es der Hausstandard vorsieht', 'Nur ein Pflaster aufkleben und weiterarbeiten'],
    ['Nadelstichverletzungen sind Arbeitsunfälle. Zuständig ist die gesetzliche Unfallversicherung (Berufsgenossenschaft). Eine HIV-Prophylaxe wirkt am besten innerhalb von Stunden.'],
    [0, 1, 2], true),
];

// ---------------------------------------------------------------- Bereiche

export const BEREICHE: Bereich[] = [
  {
    id: 'schweigepflicht', label: 'Schweigepflicht', kurz: 'Wer, was, gegenüber wem, und wann du sie brechen darfst',
    wissen: [
      '§ 203 StGB: Geheimnisse aus dem Beruf nicht unbefugt weitergeben, auch nicht an Angehörige.',
      'Befugt: Einwilligung, mutmaßliche Einwilligung im Notfall, gesetzliche Meldepflicht, akute Gefahr für andere.',
      'Am Telefon keine Auskunft ohne sichere Identität.',
    ],
  },
  {
    id: 'strafrecht', label: 'Strafrecht und Haftung', kurz: 'Körperverletzung, Einwilligung, Fahrlässigkeit, Dokumentation',
    wissen: [
      'Ein Eingriff ist gerechtfertigt durch wirksame Einwilligung nach Aufklärung.',
      'Fahrlässig = Sorgfalt außer Acht gelassen, Schaden war vorhersehbar und vermeidbar.',
      'Dokumentation ist eine Urkunde: nie nachträglich verändern, Nachträge kennzeichnen.',
    ],
  },
  {
    id: 'delegation', label: 'Delegation und Vorbehaltsaufgaben', kurz: 'Anordnung, Übernahme, Durchführung, § 4 PflBG',
    wissen: [
      'Anordnungs-, Übernahme- und Durchführungsverantwortung.',
      'Was du nicht kannst, lehnst du ab. Zweifel meldest du (Remonstration).',
      '§ 4 PflBG: Pflegebedarf, Pflegeprozess und Qualität sind Pflegefachpersonen vorbehalten.',
    ],
  },
  {
    id: 'fem', label: 'Freiheitsentziehende Maßnahmen', kurz: 'Was zählt, wann zulässig, Alternativen',
    wissen: [
      'Zulässig nur mit Einwilligung, gerichtlicher Genehmigung oder im akuten Notfall.',
      'Fixierung über eine halbe Stunde braucht den Richter und 1:1-Betreuung.',
      'Immer das mildeste Mittel, Alternativen zuerst.',
    ],
  },
  {
    id: 'vorsorge', label: 'Betreuung und Vorsorge', kurz: 'Patientenverfügung, Vollmacht, Betreuung, mutmaßlicher Wille',
    wissen: [
      'Patientenverfügung: schriftlich, bindend, wenn sie zur Situation passt.',
      'Vorsorgevollmacht geht der gerichtlichen Betreuung vor.',
      'Ehegatten dürfen seit 2023 im Notfall bis zu sechs Monate in Gesundheitsfragen vertreten.',
    ],
  },
  {
    id: 'sozialrecht', label: 'Pflege- und Krankenversicherung', kurz: 'Pflegegrade, Begutachtung, Leistungen, Behandlungspflege',
    wissen: [
      'Pflegegrad 1 ab 12,5 Punkten, Pflegegrad 5 ab 90 Punkten.',
      'Selbstversorgung zählt mit 40 % am meisten.',
      'Behandlungspflege zu Hause zahlt die Krankenkasse (§ 37 SGB V).',
    ],
  },
  {
    id: 'arbeitsrecht', label: 'Arbeitsrecht und Arbeitsschutz', kurz: 'Arbeitszeit, Pausen, Ruhezeit, Mutterschutz, Arbeitsunfall',
    wissen: [
      'Pause: 30 Minuten ab sechs Stunden, 45 Minuten ab neun Stunden.',
      'Ruhezeit 11 Stunden, in der Pflege mit Ausgleich 10 Stunden.',
      'Nadelstich ist ein Arbeitsunfall: sofort melden.',
    ],
  },
];

export const AUFGABEN: Record<BereichId, Aufgabe[]> = mitVertiefung({ schweigepflicht, strafrecht, delegation, fem, vorsorge, sozialrecht, arbeitsrecht }, VERTIEFUNG);
export const ALLE_AUFGABEN: Aufgabe[] = Object.values(AUFGABEN).flat();
