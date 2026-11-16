// Ablauf-Werkbank: pflegerische Handlungsabläufe Schritt für Schritt, mit typischen Fehlern („Fallen“).
// Grundlagen stehen je Ablauf unter `quellen`. Einrichtungen haben eigene Standards: die Seite sagt das.
// Schritte mit derselben `gruppe` dürfen in beliebiger Reihenfolge kommen.

export interface Schritt {
  id: string;
  text: string;
  /** Sicherheitsrelevant: Fehlen oder falsche Reihenfolge gefährdet die Person oder dich. */
  kritisch?: boolean;
  /** Schritte derselben Gruppe sind untereinander austauschbar. */
  gruppe?: string;
  /** Warum der Schritt hier steht. */
  warum: string;
}

export interface Falle {
  id: string;
  text: string;
  /** Was daran falsch ist. */
  fehler: string;
  /** Was im echten Leben passieren kann. */
  folge: string;
  kritisch?: boolean;
}

export interface Ablauf {
  id: string;
  titel: string;
  kurz: string;
  topicIds: string[];
  /** Situation am Bett. */
  lage: string;
  material: string[];
  schritte: Schritt[];
  fallen: Falle[];
  quellen: string[];
}

const T = {
  injektion: 'thema.ph.injektion',
  medikamente: 'thema.ph.medikamente',
  wunde: 'thema.ph.wunde',
  ausscheidung: 'thema.ph.ausscheidung',
  hygiene: 'thema.ph.hygiene',
} as const;

export const ABLAEUFE: Ablauf[] = [
  {
    id: 'sc-injektion', titel: 's.c.-Injektion mit Fertigspritze', kurz: 'Heparin-Fertigspritze in den Bauch',
    topicIds: [T.injektion, T.medikamente],
    lage: 'Herr Brandt, 71 Jahre, zweiter Tag nach Hüft-TEP. Angeordnet ist niedermolekulares Heparin einmal täglich s.c. als Fertigspritze.',
    material: ['Fertigspritze laut Anordnung', 'Hautantiseptikum', 'Trockene Tupfer', 'Einmalhandschuhe', 'Durchstichsicherer Abwurfbehälter'],
    schritte: [
      { id: 'anordnung', text: 'Anordnung prüfen: richtige Person, richtiges Arzneimittel, Dosis, Applikationsart, Zeitpunkt', kritisch: true, warum: 'Die 6-R-Regel beginnt vor dem Richten. Bei Heparin sind Dosis und Zeitpunkt (Abstand zur OP, Nierenfunktion) besonders wichtig.' },
      { id: 'hd1', text: 'Hände desinfizieren und Material richten, Abwurfbehälter in Reichweite stellen', warum: 'Der Abwurfbehälter muss direkt erreichbar sein, damit die Kanüle sofort entsorgt werden kann (TRBA 250).' },
      { id: 'ident', text: 'Herrn Brandt offen nach Name und Geburtsdatum fragen, Armband prüfen und die Injektion erklären', kritisch: true, warum: 'Offene Fragen verhindern Verwechslungen. Information und Einverständnis gehören vor jede Maßnahme.' },
      { id: 'stelle', text: 'Injektionsstelle am Bauch wählen: mindestens zwei Querfinger Abstand zum Nabel, keine Narben, Hämatome oder Entzündung, Stelle wechseln', warum: 'Wechselnde, intakte Stellen beugen Hämatomen und Lipodystrophie vor und sichern eine gleichmäßige Aufnahme.' },
      { id: 'hd2', text: 'Hände desinfizieren und Einmalhandschuhe anziehen', warum: 'Vor einer aseptischen Tätigkeit wird desinfiziert (Moment 2). Handschuhe schützen dich vor Blutkontakt.' },
      { id: 'haut', text: 'Haut mit dem Antiseptikum desinfizieren und die Einwirkzeit abwarten, die Stelle danach nicht mehr berühren', kritisch: true, warum: 'Erst nach der Einwirkzeit sind die Keime reduziert. Berühren oder Abwischen macht die Desinfektion zunichte.' },
      { id: 'falte', text: 'Mit Daumen und Zeigefinger eine Hautfalte abheben', warum: 'Die Falte hebt das Unterhautfettgewebe vom Muskel ab, damit das Arzneimittel sicher subkutan landet.' },
      { id: 'stechen', text: 'Kanüle zügig senkrecht (90°) in die Hautfalte einstechen, bei sehr schlanken Menschen schräg', warum: 'Fertigspritzen haben kurze Kanülen: senkrecht erreicht die Subkutis. Bei wenig Fettgewebe vermeidet der flachere Winkel eine i.m.-Gabe.' },
      { id: 'injizieren', text: 'Langsam injizieren, die Hautfalte dabei halten, die Luftblase in der Fertigspritze bleibt drin', warum: 'Das Luftpolster der Fertigspritze schiebt den Rest des Wirkstoffs aus der Kanüle. Langsames Spritzen ist weniger schmerzhaft.' },
      { id: 'ziehen', text: 'Kanüle herausziehen, dann die Hautfalte loslassen, Einstichstelle nur kurz mit Tupfer abdecken, nicht reiben', warum: 'Reiben und Massieren fördert Hämatome an der Einstichstelle.' },
      { id: 'abwurf', text: 'Kanüle sofort in den Abwurfbehälter, Schutzmechanismus nutzen, keine Schutzkappe aufsetzen', kritisch: true, warum: 'Recapping ist nach TRBA 250 verboten: Die meisten Nadelstichverletzungen entstehen genau dabei.' },
      { id: 'hd3', text: 'Handschuhe ausziehen und Hände desinfizieren', warum: 'Nach Kontakt mit potenziell infektiösem Material und nach dem Patientenkontakt (Momente 3 und 4).' },
      { id: 'doku', text: 'Dokumentieren: Uhrzeit, Präparat, Dosis, Injektionsstelle, Handzeichen, Auffälligkeiten', warum: 'Nur dokumentierte Gaben sind nachvollziehbar. Die Stelle hilft beim Wechsel am nächsten Tag.' },
    ],
    fallen: [
      { id: 'luft', text: 'Die Luftblase vor dem Einstechen aus der Fertigspritze herausdrücken', fehler: 'Bei Heparin-Fertigspritzen bleibt das Luftpolster drin.', folge: 'Wirkstoff tritt vorher aus und landet an der Hautoberfläche: Dosis zu niedrig, Hämatom am Stichkanal.' },
      { id: 'massieren', text: 'Die Einstichstelle danach kräftig massieren, damit es sich verteilt', fehler: 'Massieren fördert Blutungen im Gewebe.', folge: 'Großflächige Hämatome, schlechtere Beurteilbarkeit der Stelle.' },
      { id: 'recap', text: 'Die Kanüle mit beiden Händen in die Schutzkappe zurückstecken', fehler: 'Recapping ist nach TRBA 250 nicht erlaubt.', folge: 'Nadelstichverletzung mit Risiko für Hepatitis B, C oder HIV.', kritisch: true },
      { id: 'einwirk', text: 'Direkt nach dem Sprühen einstechen, damit es schneller geht', fehler: 'Die Einwirkzeit des Antiseptikums wurde nicht abgewartet.', folge: 'Hautkeime gelangen in den Stichkanal, Infektion der Einstichstelle.', kritisch: true },
      { id: 'geschlossen', text: 'Fragen: „Sie sind doch Herr Brandt, oder?“', fehler: 'Geschlossene Fragen werden oft einfach bejaht, gerade bei Schwerhörigkeit oder Verwirrtheit.', folge: 'Verwechslung: Die falsche Person bekommt ein gerinnungshemmendes Mittel.', kritisch: true },
      { id: 'aspirieren', text: 'Vor dem Injizieren aspirieren', fehler: 'Bei s.c.-Injektionen wird nicht aspiriert.', folge: 'Die Kanüle bewegt sich im Gewebe, mehr Schmerz und Hämatome.' },
      { id: 'narbe', text: 'Direkt in das Hämatom von gestern stechen, da ist die Haut schon weich', fehler: 'Hämatome und Narben sind keine geeigneten Stellen.', folge: 'Unsichere Aufnahme, Schmerzen, größeres Hämatom.' },
    ],
    quellen: ['KRINKO: Anforderungen an die Hygiene bei Punktionen und Injektionen (2011)', 'TRBA 250: Biologische Arbeitsstoffe im Gesundheitswesen und in der Wohlfahrtspflege', 'Fachinformationen der Heparin-Fertigspritzen (Anwendungshinweise)'],
  },
  {
    id: 'medikamente', titel: 'Medikamente richten und verabreichen', kurz: 'Orale Medikamente im Tagesdispenser',
    topicIds: [T.medikamente],
    lage: 'Frühdienst im Pflegeheim. Du richtest die Mittagsmedikamente für Frau Yilmaz, 84 Jahre, nach ihrem Medikationsplan.',
    material: ['Aktueller Medikationsplan mit ärztlicher Anordnung', 'Beschrifteter Dispenser', 'Originalpackungen', 'Ggf. Tablettenteiler'],
    schritte: [
      { id: 'hd', text: 'Hände desinfizieren', gruppe: 'vorbereitung', warum: 'Tabletten gehen in den Mund: Keime von den Händen sollen nicht mitgehen.' },
      { id: 'ruhe', text: 'Ruhigen Arbeitsplatz suchen und Störungen vermeiden', gruppe: 'vorbereitung', warum: 'Unterbrechungen sind eine Hauptursache für Fehler beim Richten.' },
      { id: 'plan', text: 'Aktuellen Medikationsplan bereitlegen und auf Änderungen prüfen', kritisch: true, warum: 'Gerichtet wird nur nach gültiger Anordnung, nie aus dem Gedächtnis.' },
      { id: 'dispenser', text: 'Dispenser mit Name, Geburtsdatum und Zeitpunkt beschriften', warum: 'So lässt sich der Dispenser eindeutig zuordnen, auch wenn jemand anderes verabreicht.' },
      { id: 'abgleich', text: 'Jedes Präparat beim Entnehmen mit dem Plan abgleichen: Name, Wirkstoff, Stärke, Darreichungsform, Verfallsdatum', kritisch: true, warum: 'Erste Kontrolle des Drei-Kontrollen-Prinzips. Ähnliche Namen und Stärken sind häufige Verwechslungen.' },
      { id: 'entnehmen', text: 'Tabletten direkt aus dem Blister in den Dispenser drücken, ohne Hautkontakt', warum: 'Hygiene, und manche Wirkstoffe (z. B. Zytostatika, Hormone) sollen nicht über die Haut aufgenommen werden.' },
      { id: 'teilen', text: 'Nur teilen oder mörsern, wenn es laut Fachinformation erlaubt ist', warum: 'Retard- und magensaftresistente Formen verlieren sonst ihre Wirkweise.' },
      { id: 'zurueck', text: 'Beim Zurückstellen der Packung noch einmal mit dem Plan vergleichen', warum: 'Dritte Kontrolle: Fehler beim Richten fallen hier noch auf.' },
      { id: 'ident', text: 'Beim Verabreichen Frau Yilmaz offen nach dem Namen fragen und den Dispenser abgleichen', kritisch: true, warum: 'Richtige Person ist das erste R. Im Heim tragen viele kein Armband: Foto in der Akte nutzen.' },
      { id: 'einnahme', text: 'Getränk anbieten und die Einnahme abwarten oder unterstützen', warum: 'Nur so ist sicher, dass die Tabletten genommen und nicht gesammelt oder verloren werden.' },
      { id: 'doku', text: 'Gabe dokumentieren, Auffälligkeiten (Ablehnung, Schluckprobleme) melden', warum: 'Dokumentation ist das sechste R und Grundlage für die ärztliche Rückmeldung.' },
    ],
    fallen: [
      { id: 'gedaechtnis', text: 'Die Medikamente aus dem Gedächtnis richten, die Pläne ändern sich ja selten', fehler: 'Ohne aktuellen Plan fallen Änderungen nicht auf.', folge: 'Abgesetzte Mittel werden weiter gegeben oder neue fehlen.', kritisch: true },
      { id: 'retard', text: 'Die Retardtablette halbieren, damit sie leichter zu schlucken ist', fehler: 'Retardtabletten dürfen meist nicht geteilt werden.', folge: 'Der Wirkstoff wird auf einmal frei: Überdosierung, z. B. Blutdruckabfall.', kritisch: true },
      { id: 'hand', text: 'Die Tabletten in die Hand drücken und dann in den Dispenser legen', fehler: 'Hautkontakt ist unhygienisch und bei manchen Wirkstoffen gefährlich.', folge: 'Keimübertragung, Aufnahme von Wirkstoff über deine Haut.' },
      { id: 'stehen', text: 'Den Becher auf den Nachttisch stellen, Frau Yilmaz nimmt das später', fehler: 'Die Einnahme ist nicht gesichert.', folge: 'Tabletten werden vergessen, gesammelt oder von Mitbewohnenden genommen.' },
      { id: 'aehnlich', text: 'Die Packung mit ähnlichem Namen nehmen, weil die richtige leer ist', fehler: 'Austausch nur nach Rücksprache und mit gleichem Wirkstoff und gleicher Stärke.', folge: 'Falscher Wirkstoff oder falsche Dosis.', kritisch: true },
      { id: 'vorab', text: 'Die Gabe schon beim Richten als verabreicht abzeichnen', fehler: 'Dokumentiert wird erst nach der Gabe.', folge: 'Die Akte zeigt eine Gabe, die vielleicht nie stattfand.' },
    ],
    quellen: ['Aktionsbündnis Patientensicherheit: Handlungsempfehlungen zur Arzneimitteltherapiesicherheit', 'Fachinformationen der Präparate (Teilbarkeit)', 'Lehrbuchstandard 6-R-Regel und Drei-Kontrollen-Prinzip'],
  },
  {
    id: 'verbandwechsel', titel: 'Aseptischer Verbandwechsel', kurz: 'Primär heilende OP-Wunde, Non-Touch-Technik',
    topicIds: [T.wunde, T.hygiene],
    lage: 'Frau Lange, 58 Jahre, dritter Tag nach Appendektomie. Der Verbandwechsel ist angeordnet, die Wunde gilt als aseptisch.',
    material: ['Sterile Pinzetten', 'Sterile Tupfer oder Kompressen', 'Wundantiseptikum oder sterile Spüllösung nach Standard', 'Steriler Wundverband', 'Einmalhandschuhe', 'Abwurf', 'Flächendesinfektion'],
    schritte: [
      { id: 'info', text: 'Wunddokumentation und Anordnung ansehen, Frau Lange informieren und nach Schmerzen fragen', warum: 'Bei Schmerzen wird vorher ein Schmerzmittel angeboten, damit es rechtzeitig wirkt.' },
      { id: 'flaeche', gruppe: 'vorbereitung', text: 'Hände desinfizieren, Arbeitsfläche desinfizieren und Material richten, Abwurf in Reichweite', warum: 'Eine saubere Ablage und kurze Wege verhindern, dass Sterilgut kontaminiert wird.' },
      { id: 'lagern', gruppe: 'vorbereitung', text: 'Frau Lange bequem positionieren und für Sichtschutz sorgen', warum: 'Intimsphäre und eine gute Sicht auf die Wunde.' },
      { id: 'hd1', text: 'Hände desinfizieren und Einmalhandschuhe anziehen', warum: 'Der alte Verband ist potenziell infektiös: Handschuhe schützen dich.' },
      { id: 'alt', text: 'Alten Verband von außen zur Wunde hin lösen und direkt in den Abwurf geben', warum: 'Zur Wunde hin ziehen schont die Wundränder. Der Verband geht sofort weg.' },
      { id: 'beurteilen', text: 'Wunde beurteilen: Rötung, Schwellung, Wärme, Exsudat, Geruch, Wundränder', warum: 'Zeichen einer Wundinfektion früh erkennen und dokumentieren.' },
      { id: 'hd2', text: 'Handschuhe ausziehen und Hände desinfizieren', kritisch: true, warum: 'Die Handschuhe sind jetzt kontaminiert. Vor der aseptischen Tätigkeit wird desinfiziert (Moment 2).' },
      { id: 'reinigen', text: 'Mit steriler Pinzette und sterilem Tupfer die Wunde von innen nach außen reinigen, jeden Tupfer nur einmal', kritisch: true, warum: 'Bei aseptischen Wunden geht es von der saubersten Stelle (Wunde) nach außen, damit Hautkeime nicht in die Wunde gelangen.' },
      { id: 'verband', kritisch: true, text: 'Sterilen Verband mit der Pinzette auflegen, ohne die Wundauflage zu berühren', warum: 'Non-Touch: Die Wundseite der Auflage bleibt steril.' },
      { id: 'hd3', text: 'Material entsorgen, Pinzetten zur Aufbereitung geben, Hände desinfizieren', warum: 'Nach Kontakt mit potenziell infektiösem Material (Moment 3).' },
      { id: 'doku', text: 'Wundzustand, Material und Befinden dokumentieren', warum: 'Der Verlauf zeigt, ob die Wunde heilt. Grundlage für den nächsten Wechsel.' },
    ],
    fallen: [
      { id: 'handschuh', text: 'Mit denselben Handschuhen vom alten Verband direkt weiter die Wunde reinigen', fehler: 'Die Handschuhe sind durch den alten Verband kontaminiert.', folge: 'Keime aus dem alten Verband gelangen in die Wunde: Wundinfektion.', kritisch: true },
      { id: 'aussen', text: 'Die Wunde von außen nach innen reinigen', fehler: 'Bei aseptischen Wunden wird von innen nach außen gereinigt.', folge: 'Hautkeime werden in die Wunde getragen.', kritisch: true },
      { id: 'tupfer', text: 'Einen Tupfer mehrmals über die Wunde führen, um Material zu sparen', fehler: 'Jeder Tupfer wird nur einmal benutzt.', folge: 'Keime werden über die Wunde verteilt.' },
      { id: 'bett', text: 'Die sterile Kompresse kurz auf der Bettdecke ablegen', fehler: 'Die Bettdecke ist nicht steril.', folge: 'Die Kompresse ist kontaminiert und darf nicht mehr auf die Wunde.', kritisch: true },
      { id: 'nachttisch', text: 'Den alten Verband auf dem Nachttisch ablegen', fehler: 'Infektiöses Material gehört direkt in den Abwurf.', folge: 'Die Patientenumgebung wird kontaminiert.' },
      { id: 'reissen', text: 'Den alten Verband mit einem Ruck von der Wunde weg abziehen', fehler: 'Abreißen von der Wunde weg zerrt an den Wundrändern.', folge: 'Schmerz, Wundränder reißen auf.' },
    ],
    quellen: ['KRINKO: Prävention postoperativer Wundinfektionen (2018)', 'Hygieneplan der Einrichtung (Antiseptikum, Wechselintervall)', 'Lehrbuchstandard aseptischer Verbandwechsel (Non-Touch-Technik)'],
  },
  {
    id: 'katheter', titel: 'Blasenverweilkatheter bei der Frau', kurz: 'Transurethral legen, steril, geschlossenes System',
    topicIds: [T.ausscheidung, T.hygiene],
    lage: 'Frau Peters, 67 Jahre, Harnverhalt nach OP. Ärztlich angeordnet ist ein transurethraler Blasenverweilkatheter.',
    material: ['Steriles Katheterset (Lochtuch, Tupfer, sterile Handschuhe)', 'Katheter möglichst dünn (z. B. Ch 12 bis 14)', 'Schleimhautantiseptikum', 'Steriles Gleitmittel', 'Blockerspritze mit sterilem Wasser oder 8- bis 10-%-Glycerinlösung nach Hersteller', 'Geschlossenes Ablaufsystem', 'Einmalhandschuhe, Abwurf'],
    schritte: [
      { id: 'anordnung', text: 'Anordnung und Indikation prüfen, Frau Peters informieren und Sichtschutz herstellen', warum: 'Ein Verweilkatheter braucht eine Indikation und so kurze Liegezeit wie möglich (KRINKO).' },
      { id: 'lagern', text: 'Rückenlage, Beine angewinkelt und gespreizt, wasserdichte Unterlage', warum: 'Gute Sicht auf die Harnröhrenöffnung, das Bett bleibt trocken.' },
      { id: 'intim', text: 'Mit Einmalhandschuhen den Intimbereich reinigen, dann Handschuhe ausziehen und Hände desinfizieren', warum: 'Grobe Verschmutzung kommt vor der Antiseptik. Danach Moment 2: vor aseptischer Tätigkeit.' },
      { id: 'set', text: 'Set steril öffnen und sterile Handschuhe anziehen', kritisch: true, warum: 'Ab jetzt wird steril gearbeitet: Katheterassoziierte Harnwegsinfekte gehören zu den häufigsten Krankenhausinfektionen.' },
      { id: 'vorbereiten', text: 'Lochtuch auflegen, Katheter mit dem Ablaufsystem verbinden und Material im sterilen Feld ordnen', warum: 'Das System bleibt von Anfang an geschlossen. Alles liegt griffbereit, bevor eine Hand unsteril wird.' },
      { id: 'spreizen', text: 'Mit der nicht dominanten Hand die Labien spreizen, diese Hand bleibt dort und gilt als unsteril', kritisch: true, warum: 'Die spreizende Hand berührt die Haut. Sie darf danach nichts Steriles mehr anfassen.' },
      { id: 'antiseptik', text: 'Labien und Harnröhrenöffnung von vorn nach hinten antiseptisch reinigen, jeden Tupfer einmal, Einwirkzeit abwarten', kritisch: true, warum: 'Von vorn nach hinten trägt keine Darmkeime zur Harnröhre. Ohne Einwirkzeit wirkt das Antiseptikum nicht.' },
      { id: 'gleit', text: 'Steriles Gleitmittel in die Harnröhre geben oder auf die Katheterspitze', warum: 'Schont die Schleimhaut und erleichtert das Einführen.' },
      { id: 'einfuehren', text: 'Katheter mit der sterilen Hand einführen, bis Urin fließt, dann noch einige Zentimeter weiter', warum: 'Erst dann liegt der Ballon sicher in der Blase und nicht in der Harnröhre.' },
      { id: 'blocken', text: 'Ballon mit der vom Hersteller angegebenen Menge Blockflüssigkeit füllen', kritisch: true, warum: 'Steriles Wasser oder Glycerinlösung, kein NaCl: Kochsalz kann auskristallisieren und den Ballon verstopfen.' },
      { id: 'zurueck', text: 'Katheter vorsichtig zurückziehen, bis ein Widerstand spürbar ist, Beutel unter Blasenniveau ohne Bodenkontakt befestigen', kritisch: true, warum: 'Der Ballon liegt dann am Blasenausgang. Unter Blasenniveau verhindert Rückfluss, ohne Bodenkontakt keine Keime am Ablass.' },
      { id: 'abschluss', text: 'Material entsorgen, Hände desinfizieren, Frau Peters bequem lagern', warum: 'Nach Kontakt mit Körperflüssigkeit (Moment 3).' },
      { id: 'doku', text: 'Dokumentieren: Datum, Kathetergröße und -material, Blockmenge, Urinmenge und -aussehen', warum: 'Wichtig für Wechselintervall, Bilanz und Infektionsbeobachtung.' },
    ],
    fallen: [
      { id: 'nacl', text: 'Den Ballon mit NaCl 0,9 % blocken', fehler: 'Kochsalzlösung ist zum Blocken nicht geeignet.', folge: 'Kristalle verstopfen den Blockkanal, der Ballon lässt sich später nicht entleeren.', kritisch: true },
      { id: 'hintenvorn', text: 'Die Antiseptik vom After Richtung Harnröhre führen', fehler: 'Immer von vorn nach hinten reinigen.', folge: 'Darmkeime werden zur Harnröhre getragen: Harnwegsinfekt.', kritisch: true },
      { id: 'vagina', text: 'Nach einem Fehlversuch in der Vagina denselben Katheter gleich in die Harnröhre schieben', fehler: 'Der Katheter ist nicht mehr steril.', folge: 'Keime aus der Vagina in die Blase. Den Katheter dort lassen als Markierung und einen neuen nehmen.', kritisch: true },
      { id: 'zu-frueh', text: 'Den Ballon blocken, bevor Urin fließt', fehler: 'Der Ballon liegt dann eventuell noch in der Harnröhre.', folge: 'Harnröhrenverletzung, Blutung, starke Schmerzen.', kritisch: true },
      { id: 'beutel', text: 'Den Beutel auf das Bett neben die Patientin legen', fehler: 'Der Beutel muss unter Blasenniveau hängen.', folge: 'Urin fließt zurück in die Blase: Infektionsrisiko.' },
      { id: 'hand', text: 'Mit der spreizenden Hand kurz den Katheter nachfassen', fehler: 'Die spreizende Hand ist unsteril.', folge: 'Der Katheter ist kontaminiert.', kritisch: true },
      { id: 'dick', text: 'Einen möglichst dicken Katheter nehmen, damit er sicher liegt', fehler: 'So dünn wie möglich, so dick wie nötig.', folge: 'Mehr Druck auf die Harnröhrenschleimhaut, Verletzungen und Strikturen.' },
    ],
    quellen: ['KRINKO: Prävention und Kontrolle Katheter-assoziierter Harnwegsinfektionen (2015)', 'Herstellerangaben zu Kathetern (Blockflüssigkeit, Füllmenge)', 'Lehrbuchstandard transurethraler Katheterismus der Frau'],
  },
];

export const ABLAUF = Object.fromEntries(ABLAEUFE.map((a) => [a.id, a])) as Record<string, Ablauf>;
export const ABLAUF_THEMEN = [...new Set(ABLAEUFE.flatMap((a) => a.topicIds))];
