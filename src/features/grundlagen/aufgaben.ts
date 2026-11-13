// Grundlagen-Trainer, Teil Fachsprache: Wortbausteine, Lage- und Richtungsbezeichnungen, Abkürzungen in Klinik und Dokumentation.
// Grundlage: übliche Lehrbuchinhalte der medizinischen Terminologie. Abkürzungen unterscheiden sich zwischen
// Einrichtungen; maßgeblich ist die Abkürzungsliste des Hauses. Die Seite sagt das.

import { mitVertiefung, type Aufgabe, type AuswahlAufgabe } from '../quiz/quiz';
import { VERTIEFUNG } from './vertiefung';

export const THEMEN = {
  wortbildung: 'thema.fs.wortbildung',
  lage: 'thema.fs.lage',
  abkuerzungen: 'thema.fs.abkuerzungen',
} as const;

export type BereichId = 'wortbildung' | 'lage' | 'abkuerzungen';
export interface Bereich { id: BereichId; label: string; kurz: string; wissen: string[] }

function frage(id: string, thema: string, titel: string, f: string, optionen: string[], erklaerung: string[], richtig = [0], mehrfach = false): AuswahlAufgabe {
  return { id, art: 'auswahl', topicIds: [thema], titel, frage: f, optionen, richtig, mehrfach, erklaerung };
}

// ---------------------------------------------------------------- Wortbausteine

const W = THEMEN.wortbildung;
const wortbildung: Aufgabe[] = [
  {
    id: 'wort.zu.suffixe', art: 'zuordnen', topicIds: [W], titel: 'Endungen (Suffixe)',
    frage: 'Ordne jeder Endung ihre Bedeutung zu.',
    paare: [
      { links: '-itis', rechts: 'Entzündung' },
      { links: '-ektomie', rechts: 'Operative Entfernung' },
      { links: '-tomie', rechts: 'Operativer Schnitt, Eröffnung' },
      { links: '-skopie', rechts: 'Spiegelung, Betrachtung' },
      { links: '-algie', rechts: 'Schmerz' },
      { links: '-om', rechts: 'Geschwulst, Tumor' },
      { links: '-ose', rechts: 'Nicht entzündlicher Zustand oder Erkrankung' },
    ],
    erklaerung: ['Mit wenigen Endungen lassen sich sehr viele Fachwörter erschließen: Appendizitis, Appendektomie, Laparotomie, Gastroskopie, Neuralgie, Lipom, Arthrose.'],
  },
  {
    id: 'wort.zu.vorsilben', art: 'zuordnen', topicIds: [W], titel: 'Vorsilben (Präfixe)',
    frage: 'Ordne jeder Vorsilbe ihre Bedeutung zu.',
    paare: [
      { links: 'hyper-', rechts: 'über, zu viel' },
      { links: 'hypo-', rechts: 'unter, zu wenig' },
      { links: 'tachy-', rechts: 'schnell' },
      { links: 'brady-', rechts: 'langsam' },
      { links: 'dys-', rechts: 'gestört, schwierig' },
      { links: 'a-/an-', rechts: 'ohne, fehlend' },
      { links: 'poly-', rechts: 'viel' },
      { links: 'oligo-', rechts: 'wenig' },
    ],
    erklaerung: ['Vorsilben verändern die Bedeutung eines Wortstamms: Hypertonie und Hypotonie, Tachykardie und Bradykardie, Dyspnoe und Apnoe, Polyurie und Oligurie.'],
  },
  {
    id: 'wort.zu.staemme', art: 'zuordnen', topicIds: [W], titel: 'Wortstämme: Organe',
    frage: 'Ordne jedem Wortstamm das Organ zu.',
    paare: [
      { links: 'kardi-', rechts: 'Herz' },
      { links: 'hepat-', rechts: 'Leber' },
      { links: 'nephr-', rechts: 'Niere' },
      { links: 'gastr-', rechts: 'Magen' },
      { links: 'pneum-/pulmo-', rechts: 'Lunge' },
      { links: 'derm-', rechts: 'Haut' },
      { links: 'oste-', rechts: 'Knochen' },
      { links: 'cyst-/zyst-', rechts: 'Blase' },
    ],
    erklaerung: ['Viele Organe haben einen griechischen und einen lateinischen Stamm: Niere nephr- und ren-, Lunge pneum- und pulmo-, Haut derm- und cutis.'],
  },
  frage('wort.hepatitis', W, 'Wort zerlegen', 'Was bedeutet „Hepatitis“?',
    ['Entzündung der Leber', 'Vergrößerung der Leber', 'Operative Entfernung der Leber', 'Schmerz in der Leber'],
    ['hepat- = Leber, -itis = Entzündung.']),
  frage('wort.cholezystektomie', W, 'Wort zerlegen', 'Was bedeutet „Cholezystektomie“?',
    ['Operative Entfernung der Gallenblase', 'Spiegelung der Gallenblase', 'Entzündung der Gallenblase', 'Gallenstein im Gallengang'],
    ['chole- = Galle, zyst- = Blase, -ektomie = operative Entfernung.']),
  frage('wort.dyspnoe', W, 'Wort zerlegen', 'Eine Patientin hat „Dyspnoe“. Was beobachtest du?',
    ['Erschwerte Atmung, Atemnot', 'Atemstillstand', 'Beschleunigte, aber unauffällige Atmung', 'Schmerzen beim Schlucken'],
    ['dys- = gestört, -pnoe = Atmung. Atemstillstand heißt Apnoe, beschleunigte Atmung Tachypnoe, Schluckstörung Dysphagie.']),
  frage('wort.paerese', W, 'Plegie oder Parese', 'Was ist der Unterschied zwischen einer Hemiparese und einer Hemiplegie?',
    ['Parese ist eine unvollständige, Plegie eine vollständige Lähmung, beide jeweils einer Körperhälfte', 'Parese betrifft die Arme, Plegie die Beine', 'Es gibt keinen Unterschied', 'Plegie ist eine Lähmung beider Körperhälften'],
    ['hemi- = halb. Die Parese ist eine Schwäche mit Restbewegung, die Plegie eine vollständige Lähmung. Beide Beine gelähmt heißt Paraplegie, alle vier Gliedmaßen Tetraplegie.']),
  frage('wort.mehrfach', W, 'Wörter erschließen', 'Welche Wörter beschreiben eine Entzündung? Wähle alle zutreffenden.',
    ['Zystitis', 'Gastritis', 'Arthrose', 'Lipom', 'Pneumonie'],
    ['Zystitis (Blasenentzündung) und Gastritis (Magenschleimhautentzündung) tragen -itis.', 'Die Pneumonie ist eine Lungenentzündung, obwohl sie auf -ie endet: Manche Begriffe muss man einfach kennen. Arthrose ist ein Gelenkverschleiß, ein Lipom eine gutartige Fettgeschwulst.'],
    [0, 1, 4], true),
  {
    id: 'wort.fall.arztbrief', art: 'fall', topicIds: [W], titel: 'Fall: Den Arztbrief verstehen', stufe: 3,
    frage: 'Kannst du einen Arztbrief mit Wortbausteinen entschlüsseln?',
    einstieg: 'Frau O., 71 Jahre, wird aus dem Krankenhaus zurück ins Pflegeheim verlegt. Im Arztbrief stehen mehrere Fachbegriffe, die du für die Pflegeplanung brauchst.',
    schritte: [
      {
        lage: 'Diagnose: „Akute Pyelonephritis rechts“.',
        frage: 'Was bedeutet das?', optionen: ['Plötzlich aufgetretene Entzündung des rechten Nierenbeckens und der Niere', 'Nierenstein rechts', 'Chronisches Nierenversagen', 'Operative Entfernung der rechten Niere'],
        richtig: [0], mehrfach: false,
        warum: 'pyel- = Nierenbecken, nephr- = Niere, -itis = Entzündung. Akut heißt plötzlich und heftig.',
      },
      {
        lage: 'Nebenbefund: „Leichte Hyponatriämie, Exsikkose bei Aufnahme“.',
        frage: 'Was beobachtest du deshalb besonders? Wähle alle zutreffenden.', optionen: ['Trinkmenge und Ausscheidung', 'Verwirrtheit und Schwäche als Zeichen niedrigen Natriums', 'Hautturgor und Schleimhäute', 'Nur das Körpergewicht einmal im Monat'],
        richtig: [0, 1, 2], mehrfach: true,
        warum: 'hypo- = zu wenig, natri- = Natrium, -ämie = im Blut. Exsikkose ist die Austrocknung. Beides zeigt sich an Bewusstsein, Haut und Ausscheidung.',
      },
      {
        lage: 'Empfehlung: „Bei Rezidiv Urindiagnostik und Sonographie der Nieren“.',
        frage: 'Was ist ein Rezidiv?', optionen: ['Ein Rückfall, also ein erneutes Auftreten der Erkrankung', 'Eine Nebenwirkung', 'Eine Vorsorgeuntersuchung', 'Eine Verlegung in ein anderes Krankenhaus'],
        richtig: [0], mehrfach: false,
        warum: 'Rezidiv kommt vom lateinischen recidere, zurückfallen. Sonographie (sono- = Schall, -graphie = Aufzeichnung) ist der Ultraschall.',
      },
    ],
    erklaerung: ['Unbekannte Fachwörter in Bausteine zerlegen: Vorsilbe, Stamm, Endung.', 'Was sich nicht sicher erschließen lässt, nachschlagen oder ärztlich nachfragen, bevor es in die Pflegeplanung geht.'],
  },
];

// ---------------------------------------------------------------- Lage und Richtung

const L = THEMEN.lage;
const lage: Aufgabe[] = [
  {
    id: 'lage.zu.paare', art: 'zuordnen', topicIds: [L], titel: 'Richtungen am Körper',
    frage: 'Ordne jedem Begriff die Bedeutung zu (Körper in anatomischer Grundstellung).',
    paare: [
      { links: 'kranial', rechts: 'zum Kopf hin' },
      { links: 'kaudal', rechts: 'zum Steiß hin, nach unten' },
      { links: 'ventral', rechts: 'bauchwärts, vorne' },
      { links: 'dorsal', rechts: 'rückenwärts, hinten' },
      { links: 'medial', rechts: 'zur Körpermitte hin' },
      { links: 'lateral', rechts: 'seitlich, von der Mitte weg' },
    ],
    erklaerung: ['Die Begriffe kommen paarweise. Wer einen kennt, kennt das Gegenteil: kranial und kaudal, ventral und dorsal, medial und lateral.'],
  },
  {
    id: 'lage.zu.gliedmassen', art: 'zuordnen', topicIds: [L], titel: 'Richtungen an Armen und Beinen',
    frage: 'Ordne jedem Begriff die Bedeutung zu.',
    paare: [
      { links: 'proximal', rechts: 'zum Rumpf hin' },
      { links: 'distal', rechts: 'vom Rumpf weg' },
      { links: 'palmar', rechts: 'zur Handfläche hin' },
      { links: 'plantar', rechts: 'zur Fußsohle hin' },
      { links: 'dexter', rechts: 'rechts' },
      { links: 'sinister', rechts: 'links' },
    ],
    erklaerung: ['Proximal und distal beziehen sich auf den Ansatz am Rumpf. Rechts und links gelten immer aus Sicht der Patientin, nicht aus deiner Sicht.'],
  },
  frage('lage.radius', L, 'Lage beschreiben', 'Der Bruch liegt „distal am Radius“. Wo genau?',
    ['Am handgelenknahen Ende der Speiche', 'Am ellenbogennahen Ende der Speiche', 'Mitten im Oberarmknochen', 'An der Elle auf der Kleinfingerseite'],
    ['Radius = Speiche. Distal heißt vom Rumpf entfernt, am Arm also Richtung Hand. Die distale Radiusfraktur ist der häufigste Bruch nach einem Sturz auf die ausgestreckte Hand.']),
  frage('lage.sicht', L, 'Rechts und links', 'Du stehst vor einer Patientin und siehst sie an. Im Befund steht „Ödem am Bein links“. Welches Bein ist es?',
    ['Ihr linkes Bein, das von dir aus gesehen rechts liegt', 'Das Bein, das von dir aus links liegt', 'Beide Beine', 'Das hängt vom Untersucher ab'],
    ['Rechts und links werden immer aus Sicht der Person beschrieben. Verwechslungen sind gefährlich, etwa bei Blutdruckmessung, Zugängen oder Operationen.']),
  frage('lage.ipsi', L, 'Ipsilateral und kontralateral', 'Nach einem Schlaganfall in der linken Hirnhälfte ist der rechte Arm gelähmt. Wie nennt man diese Seite im Verhältnis zur Schädigung?',
    ['Kontralateral, also auf der Gegenseite', 'Ipsilateral, also auf derselben Seite', 'Bilateral, also beidseits', 'Medial'],
    ['Die Nervenbahnen kreuzen größtenteils auf die Gegenseite. Deshalb liegt die Lähmung kontralateral zur Schädigung.']),
  frage('lage.supra', L, 'Über und unter', 'Wo liegt ein „suprapubischer“ Blasenkatheter?',
    ['Oberhalb des Schambeins durch die Bauchdecke', 'In der Harnröhre', 'Unterhalb des Nabels in der Leiste', 'Hinter der Blase am Steißbein'],
    ['supra- = oberhalb, pubis = Schambein. Gegenstück ist infra- = unterhalb, etwa infraklavikulär (unterhalb des Schlüsselbeins).']),
  frage('lage.mehrfach', L, 'Lagen in der Pflege', 'Welche Angaben beschreiben eine Lage am Körper und nicht eine Lagerung? Wähle alle zutreffenden.',
    ['Dorsal', 'Proximal', 'Oberkörperhochlagerung', 'Lateral', '30-Grad-Seitenlage'],
    ['Dorsal, proximal und lateral beschreiben Orte und Richtungen am Körper. Oberkörperhochlagerung und 30-Grad-Seitenlage sind Positionierungen der ganzen Person.'],
    [0, 1, 3], true),
  {
    id: 'lage.fall.wunde', art: 'fall', topicIds: [L], titel: 'Fall: Wunde genau beschreiben', stufe: 3,
    frage: 'Beschreibst du Lage und Richtung so, dass jede Kollegin die Stelle findet?',
    einstieg: 'Herr Z., 82 Jahre, hat eine Hautverletzung am rechten Unterschenkel und eine Rötung am Steißbein. Du dokumentierst beides für die Wundversorgung.',
    schritte: [
      {
        lage: 'Die Verletzung liegt vorne am Schienbein, etwa eine Handbreit über dem Sprunggelenk.',
        frage: 'Welche Beschreibung ist am genauesten?', optionen: ['Rechter Unterschenkel, ventral, distales Drittel', 'Rechtes Bein, irgendwo unten', 'Linker Unterschenkel, dorsal', 'Rechter Unterschenkel, proximal am Knie'],
        richtig: [0], mehrfach: false,
        warum: 'Seite, Körperteil, Fläche (ventral = vorne) und Abschnitt (distal = rumpffern) machen die Stelle eindeutig.',
      },
      {
        lage: 'Die Rötung liegt mittig über dem Kreuzbein und lässt sich nicht wegdrücken.',
        frage: 'Wie dokumentierst du sie? Wähle alle zutreffenden.', optionen: ['Lage: sakral, mittig', 'Fingertest: nicht wegdrückbar, Verdacht auf Dekubitus Kategorie 1', 'Größe in Zentimetern', 'Nur „Steiß rot“'],
        richtig: [0, 1, 2], mehrfach: true,
        warum: 'Sakral heißt im Bereich des Kreuzbeins (Os sacrum). Eine nicht wegdrückbare Rötung ist ein Warnzeichen für einen beginnenden Dekubitus.',
      },
      {
        lage: 'Die Kollegin fragt, welche Lagerung du empfiehlst, um das Kreuzbein zu entlasten.',
        frage: 'Was passt?', optionen: ['Wechselnde 30-Grad-Seitenlage', 'Dauerhafte Rückenlage mit erhöhtem Oberkörper', 'Sitzen im Rollstuhl über mehrere Stunden', 'Bauchlage ohne Unterstützung'],
        richtig: [0], mehrfach: false,
        warum: 'In der 30-Grad-Seitenlage liegen Kreuzbein und großer Rollhügel frei. Eine hohe Oberkörperlage verschiebt das Gewicht auf das Kreuzbein und erzeugt Scherkräfte.',
      },
    ],
    erklaerung: ['Seite, Körperteil, Fläche und Abschnitt: So findet jede Person die Stelle wieder.', 'Fachbegriffe machen die Dokumentation kürzer und eindeutiger als Umschreibungen.'],
  },
];

// ---------------------------------------------------------------- Abkürzungen

const A = THEMEN.abkuerzungen;
const abkuerzungen: Aufgabe[] = [
  {
    id: 'abk.zu.applikation', art: 'zuordnen', topicIds: [A], titel: 'Zugänge und Ableitungen',
    frage: 'Ordne jeder Abkürzung die Bedeutung zu.',
    paare: [
      { links: 'PVK', rechts: 'Peripherer Venenkatheter' },
      { links: 'ZVK', rechts: 'Zentraler Venenkatheter' },
      { links: 'DK', rechts: 'Blasenkatheter durch die Harnröhre' },
      { links: 'SPK', rechts: 'Blasenkatheter durch die Bauchdecke' },
      { links: 'PEG', rechts: 'Ernährungssonde durch die Bauchwand in den Magen' },
      { links: 'MS', rechts: 'Magensonde durch Nase oder Mund' },
    ],
    erklaerung: ['Zugänge und Ableitungen werden täglich in Übergabe und Dokumentation genannt. Jede Art hat eigene Hygiene- und Beobachtungsregeln.'],
  },
  {
    id: 'abk.zu.dokumentation', art: 'zuordnen', topicIds: [A], titel: 'Abkürzungen im Befund',
    frage: 'Ordne jeder Abkürzung die Bedeutung zu.',
    paare: [
      { links: 'V. a.', rechts: 'Verdacht auf' },
      { links: 'Z. n.', rechts: 'Zustand nach' },
      { links: 'DD', rechts: 'Differenzialdiagnose' },
      { links: 'o. B.', rechts: 'ohne Befund, unauffällig' },
      { links: 'AZ', rechts: 'Allgemeinzustand' },
      { links: 'EZ', rechts: 'Ernährungszustand' },
      { links: 'KI', rechts: 'Kontraindikation' },
    ],
    erklaerung: ['„V. a.“ ist noch keine gesicherte Diagnose. „Z. n.“ beschreibt etwas Vergangenes, etwa eine frühere Operation. „KI“ kann je nach Zusammenhang auch künstliche Intelligenz heißen, im Befund ist die Kontraindikation gemeint.'],
  },
  {
    id: 'abk.zu.vital', art: 'zuordnen', topicIds: [A], titel: 'Messwerte',
    frage: 'Ordne jeder Abkürzung die Bedeutung zu.',
    paare: [
      { links: 'RR', rechts: 'Blutdruck' },
      { links: 'HF', rechts: 'Herzfrequenz' },
      { links: 'AF', rechts: 'Atemfrequenz' },
      { links: 'SpO2', rechts: 'Sauerstoffsättigung am Finger gemessen' },
      { links: 'BZ', rechts: 'Blutzucker' },
      { links: 'GCS', rechts: 'Skala für die Bewusstseinslage' },
    ],
    erklaerung: ['RR steht für Riva-Rocci, den Erfinder der Manschettenmessung. GCS heißt Glasgow Coma Scale und vergibt 3 bis 15 Punkte für Augenöffnen, Sprache und Bewegung.'],
  },
  frage('abk.applikation', A, 'Arzneiform und Weg', 'Was bedeutet „1-0-1 p. o.“ in einer Anordnung?',
    ['Morgens und abends je eine Einheit, über den Mund einzunehmen', 'Morgens, mittags und abends je eine Einheit, unter die Haut', 'Einmal am Tag eine Einheit, in die Vene', 'Nur bei Bedarf eine Einheit'],
    ['Die Ziffern stehen für morgens, mittags, abends (manchmal mit vierter Ziffer für nachts). p. o. = per os, über den Mund. Bei Bedarf heißt b. B. oder „bei Bedarf“.']),
  frage('abk.verwechslung', A, 'Missverständnisse vermeiden', 'Warum gelten manche Abkürzungen als gefährlich, etwa „IE“ oder „U“ für Einheiten?',
    ['Sie können verwechselt oder falsch gelesen werden, z. B. „U“ als Null, was zu einer zehnfachen Dosis führt', 'Sie sind gesetzlich verboten', 'Sie sind zu lang', 'Sie gelten nur in Arztbriefen'],
    ['Viele Einrichtungen schreiben bei Insulin und Heparin „Einheiten“ aus. Grundsatz: nur Abkürzungen aus der hauseigenen Liste, im Zweifel ausschreiben.']),
  frage('abk.nuechtern', A, 'Vor Untersuchungen', 'Auf dem Plan steht „ab 0 Uhr nüchtern“ für eine Magenspiegelung am Morgen. Was heißt das für dich?',
    ['Ab Mitternacht nichts essen, Trinken und Medikamente nach Anordnung beziehungsweise Hausstandard klären', 'Ab Mitternacht gar keine Medikamente mehr, auch keine lebenswichtigen', 'Nur auf Kaffee verzichten', 'Normales Frühstück, nüchtern bezieht sich auf Alkohol'],
    ['Wie lange vorher noch klare Flüssigkeit erlaubt ist und welche Medikamente gegeben werden, legt die Anordnung fest. Insulin ohne Essen kann eine Unterzuckerung auslösen.']),
  frage('abk.mehrfach', A, 'Abkürzungen erkennen', 'Welche Abkürzungen bezeichnen Erkrankungen? Wähle alle zutreffenden.',
    ['COPD', 'KHK', 'MRSA', 'PVK', 'pAVK'],
    ['COPD (chronisch obstruktive Lungenerkrankung), KHK (koronare Herzkrankheit) und pAVK (periphere arterielle Verschlusskrankheit) sind Erkrankungen.', 'MRSA ist ein Erreger, der auch ohne Erkrankung als Besiedlung vorkommen kann. PVK ist ein Zugang.'],
    [0, 1, 4], true),
  {
    id: 'abk.fall.uebergabe', art: 'fall', topicIds: [A], titel: 'Fall: Übergabe mit Abkürzungen', stufe: 3,
    frage: 'Verstehst du eine Übergabe voller Abkürzungen und gibst du sie sicher weiter?',
    einstieg: 'Frühdienst. In der Übergabe hörst du: „Herr R., 77, Z. n. TEP rechts vorgestern, V. a. HWI, PVK links, DK seit OP, BZ heute früh 212, AZ reduziert.“',
    schritte: [
      {
        lage: 'Du willst sicher sein, dass du alles verstanden hast.',
        frage: 'Was bedeutet „Z. n. TEP rechts“?', optionen: ['Er hat vor kurzem einen vollständigen Gelenkersatz rechts bekommen, meist an Hüfte oder Knie', 'Er hat eine Thrombose rechts', 'Er hat eine Prellung am rechten Bein', 'Er hat eine Thoraxdrainage rechts'],
        richtig: [0], mehrfach: false,
        warum: 'TEP = Totalendoprothese, Z. n. = Zustand nach. Welches Gelenk es ist, steht in der Dokumentation. Im Zweifel gehört das Gelenk in die Übergabe dazu.',
      },
      {
        lage: '„V. a. HWI“ und „DK seit OP“ stehen nebeneinander.',
        frage: 'Welcher Zusammenhang ist für die Pflege wichtig? Wähle alle zutreffenden.', optionen: ['Ein Dauerkatheter erhöht das Risiko für einen Harnwegsinfekt', 'Täglich prüfen, ob der Katheter noch nötig ist, und das ansprechen', 'Urin auf Farbe, Trübung und Geruch beobachten, Temperatur messen', 'Der Verdacht ist bestätigt, weitere Beobachtung ist unnötig'],
        richtig: [0, 1, 2], mehrfach: true,
        warum: 'HWI = Harnwegsinfekt. Katheterassoziierte Infekte gehören zu den häufigsten Krankenhausinfektionen. Jeder Tag ohne Katheter senkt das Risiko.',
      },
      {
        lage: 'Du übergibst später an eine Kollegin aus der Zeitarbeit, die neu im Haus ist.',
        frage: 'Wie gehst du mit den Abkürzungen um?', optionen: ['Gängige, hauseigene Abkürzungen nutzen, Unklares ausschreiben und Rückfragen zulassen', 'Möglichst viele Abkürzungen nutzen, damit es schnell geht', 'Gar keine Fachwörter verwenden', 'Nur die Zimmernummer nennen, den Rest steht in der Akte'],
        richtig: [0], mehrfach: false,
        warum: 'Abkürzungen sparen Zeit nur, wenn alle sie gleich verstehen. Hauseigene Kürzel kennen Neue oft nicht.',
      },
    ],
    erklaerung: ['Abkürzungen auflösen, Zusammenhänge erkennen, verständlich weitergeben.', 'Was nicht in der Abkürzungsliste des Hauses steht, wird ausgeschrieben.'],
  },
];

export const BEREICHE: Bereich[] = [
  {
    id: 'wortbildung', label: 'Wortbausteine', kurz: 'Vorsilben, Wortstämme, Endungen',
    wissen: [
      'Vorsilbe + Stamm + Endung: hypo-glyk-ämie = zu wenig Zucker im Blut.',
      '-itis Entzündung, -ektomie Entfernung, -tomie Schnitt, -skopie Spiegelung, -algie Schmerz, -om Geschwulst.',
      'hyper/hypo, tachy/brady, poly/oligo, a-/an- ohne, dys- gestört.',
    ],
  },
  {
    id: 'lage', label: 'Lage und Richtung', kurz: 'kranial, distal, ventral, lateral …',
    wissen: [
      'Paarweise lernen: kranial/kaudal, ventral/dorsal, medial/lateral, proximal/distal.',
      'Rechts und links immer aus Sicht der Patientin.',
      'supra- oberhalb, infra- unterhalb, ipsilateral dieselbe, kontralateral die Gegenseite.',
    ],
  },
  {
    id: 'abkuerzungen', label: 'Abkürzungen', kurz: 'Zugänge, Befunde, Messwerte, Anordnungen',
    wissen: [
      'V. a. Verdacht auf, Z. n. Zustand nach, o. B. ohne Befund, DD Differenzialdiagnose.',
      'PVK, ZVK, DK, SPK, PEG: Zugänge und Ableitungen.',
      'Nur Abkürzungen aus der Liste des Hauses verwenden, im Zweifel ausschreiben.',
    ],
  },
];

export const AUFGABEN: Record<BereichId, Aufgabe[]> = mitVertiefung({ wortbildung, lage, abkuerzungen }, VERTIEFUNG);
export const ALLE_AUFGABEN: Aufgabe[] = Object.values(AUFGABEN).flat();
/** Thema → Bereich, für Lernplan-Links. */
export const BEREICH_ZU_THEMA: Record<string, BereichId> = { [THEMEN.wortbildung]: 'wortbildung', [THEMEN.lage]: 'lage', [THEMEN.abkuerzungen]: 'abkuerzungen' };
