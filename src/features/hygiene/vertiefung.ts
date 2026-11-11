// „Mehr verstehen“ im Hygiene-Trainer: Hintergrund zu jeder Aufgabe, über die kurze Begründung hinaus.
// Grundlage wie aufgaben.ts: KRINKO-Empfehlungen, Aktion Saubere Hände (WHO-Modell), TRBA 250, RKI-Ratgeber.
// Ergänzendes Lehrbuchwissen ohne Beleg aus eigenem Material; der Hygieneplan der Einrichtung geht vor.

export const VERTIEFUNG: Record<string, string[]> = {
  'momente.begruessung': [
    'Das WHO-Modell denkt in zwei Zonen: die Patientenzone (Person plus unmittelbare Umgebung) und die Umgebung außerhalb. Indikation 1 schützt die Patientenzone vor Erregern aus dem Rest der Station, die du an den Händen trägst.',
    'Handschütteln zählt als direkter Hautkontakt. Viele Einrichtungen verzichten deshalb auf die Begrüßung per Hand, sobald die Händedesinfektion nicht gleich möglich ist.',
  ],
  'momente.mobilisation': [
    'Beim Mobilisieren berührst du große Hautflächen, Kleidung und oft Zugänge oder Drainagen. Gerade auf der Haut älterer oder immungeschwächter Menschen siedeln sich mitgebrachte Erreger leicht an.',
    'Wenn du zwischen dem Desinfizieren und dem Kontakt noch etwas außerhalb der Patientenzone anfasst (Tür, Telefon), musst du erneut desinfizieren.',
  ],
  'momente.zvk': [
    'Ein zentraler Venenkatheter endet kurz vor dem rechten Vorhof. Erreger, die beim Konnektieren eingebracht werden, gelangen direkt in den Blutkreislauf und können eine katheterassoziierte Blutstrominfektion bis zur Sepsis auslösen.',
    'Zur Asepsis gehören neben der Händedesinfektion auch die Wischdesinfektion des Konnektors (Einwirkzeit abwarten) und ein Arbeiten ohne Berührung der sterilen Teile („Non-Touch-Technik“).',
  ],
  'momente.mundpflege': [
    'Aseptisch heißt hier nicht steril: Ziel ist, keine fremden Erreger auf Schleimhäute zu bringen. Schleimhäute haben keine Hornschicht als Barriere und sind deshalb leichter zu besiedeln als Haut.',
    'Bei beatmeten oder schluckgestörten Menschen ist Mundpflege zugleich Pneumonieprophylaxe, weil Keime aus dem Mund-Rachen-Raum in die Lunge aspiriert werden können.',
  ],
  'momente.absaugen': [
    'Beim endotrachealen Absaugen gelangt der Katheter unter die Stimmbänder in die sonst keimarmen unteren Atemwege. Eingebrachte Erreger können eine beatmungsassoziierte Pneumonie verursachen.',
    'Geschlossene Absaugsysteme (bei Beatmung) senken das Risiko, ersetzen aber nicht die Händedesinfektion vor dem Eingriff.',
  ],
  'momente.augentropfen': [
    'Die Bindehaut ist Schleimhaut. Zusätzlich darf die Tropferspitze weder Auge noch Wimpern berühren, sonst wird das ganze Fläschchen kontaminiert.',
    'Angebrochene Augentropfen sind meist nur begrenzt haltbar (oft 4 Wochen, Angabe des Herstellers). Anbruchdatum auf die Flasche schreiben.',
  ],
  'momente.urinbeutel': [
    'Urin aus Kathetersystemen enthält oft Bakterien, auch multiresistente. Beim Entleeren entstehen Spritzer, die Handschuhe und Hände unbemerkt kontaminieren.',
    'Handschuhe schützen nicht vollständig: Sie haben Mikroperforationen, und beim Ausziehen berührt die Hand die Außenseite. Deshalb gilt die Händedesinfektion nach dem Ablegen als eigener Moment.',
  ],
  'momente.verband': [
    'Beim Verbandwechsel wechselt die Indikation mehrfach: Nach dem Entfernen des alten Verbands (Indikation 3) folgt vor dem Anlegen des neuen eine aseptische Tätigkeit (Indikation 2). Dazwischen Handschuhe wechseln und desinfizieren.',
    'Wundsekret kann Erreger wie Staphylococcus aureus oder Pseudomonas enthalten, die sich über Hände auf andere Wunden übertragen.',
  ],
  'momente.erbrochenes': [
    'Erbrochenes kann Noroviren enthalten. Beim schwallartigen Erbrechen entstehen Tröpfchen, die Flächen in der Umgebung kontaminieren.',
    'Bei Verdacht auf Norovirus braucht die Händedesinfektion ein Mittel mit Wirksamkeit gegen unbehüllte Viren (viruzid oder begrenzt viruzid PLUS).',
  ],
  'momente.blutdruck': [
    'Nach dem Patientenkontakt tragen deine Hände die Erreger dieses Menschen. Ohne Desinfektion überträgst du sie auf die nächste Person oder auf Flächen außerhalb der Patientenzone, etwa den Stationscomputer.',
    'Die Blutdruckmanschette gehört zur Patientenumgebung. Bei Mehrfachnutzung wird sie nach Hygieneplan desinfiziert, bei Isolierung bleibt sie im Zimmer.',
  ],
  'momente.puls': [
    'Auf intakter Haut leben auch bei gesunden Menschen Erreger (Hautflora). Bei Trägern multiresistenter Keime genügt schon ein kurzer Handkontakt, um sie weiterzugeben.',
    'Studien zur Händehygiene zeigen: Gerade die kurzen, „unwichtig“ wirkenden Kontakte werden am häufigsten ohne Desinfektion beendet.',
  ],
  'momente.nachttisch': [
    'Die Patientenzone umfasst alles, was die Person berührt oder was direkt mit ihr in Kontakt steht: Bett, Nachttisch, Klingel, Monitor, Infusionsständer. Diese Flächen tragen die Erreger dieses Menschen.',
    'Indikation 5 gilt nur, wenn du die Person selbst nicht berührt hast. Hattest du auch Patientenkontakt, ist es Indikation 4.',
  ],
  'momente.pumpe': [
    'Bedienflächen von Pumpen und Monitoren werden sehr oft angefasst und selten gereinigt. Sie gehören deshalb zu den „Hand-Kontaktflächen“, die bei der Flächendesinfektion besonders beachtet werden.',
    'Steht die Pumpe zwischen zwei Betten und wird von beiden genutzt, kann sie Erreger zwischen den Patienten tragen. Darum gehört jedes Gerät nach Möglichkeit fest zu einer Patientenzone.',
  ],
  'psa.anlegen': [
    'PSA steht für persönliche Schutzausrüstung. Sie schützt dich selbst (Arbeitsschutz nach TRBA 250) und verhindert, dass deine Kleidung Erreger zu anderen Patienten trägt.',
    'Bei Influenza reicht in der Regel ein Mund-Nasen-Schutz gegen Tröpfchen. Bei Tätigkeiten mit Aerosolbildung (Absaugen, Bronchoskopie) sieht der Hygieneplan meist FFP2 vor.',
  ],
  'psa.ablegen': [
    'Beim Ablegen geschehen die meisten Selbstkontaminationen. Deshalb legt man in einer festen Reihenfolge ab und fasst nur Innenseiten, Bänder und Bügel an.',
    'Der Kittel wird beim Ausziehen nach innen gerollt, damit die verschmutzte Außenseite eingeschlossen ist, und direkt im Zimmer oder in der Schleuse entsorgt.',
  ],
  'psa.einreiben': [
    'Alkoholische Händedesinfektionsmittel töten Bakterien und behüllte Viren in Sekunden ab, brauchen aber Zeit und Flüssigkeit: Trocknen die Hände zu früh, endet die Wirkung. Deshalb ausreichend Mittel nehmen (meist 3 bis 5 ml).',
    'Untersuchungen mit fluoreszierendem Mittel zeigen typische Benetzungslücken an Fingerkuppen, Daumen und Fingerzwischenräumen. Darauf achtet man beim eigenverantwortlichen Einreiben gezielt.',
  ],
  'psa.handschuhe-ersetzen': [
    'Unter Handschuhen entsteht ein feuchtwarmes Milieu, in dem sich die Hautflora vermehrt. Das ist ein weiterer Grund, nach dem Ausziehen zu desinfizieren.',
    'Handschuhe sind kein Freibrief: Werden sie zu lange getragen, überträgt man mit ihnen Erreger von Fläche zu Fläche genauso wie mit bloßen Händen.',
  ],
  'psa.wann-kittel': [
    'Standardhygiene (auch Basishygiene) gilt bei allen Patienten, unabhängig von einer bekannten Infektion. Sie geht davon aus, dass jede Körperflüssigkeit Erreger enthalten kann.',
    'Die Schürze wird patientenbezogen getragen und danach entsorgt. Mit derselben Schürze zum nächsten Patienten zu gehen, überträgt Erreger.',
  ],
  'psa.ffp2': [
    'FFP2-Masken (filtering face piece) filtern mindestens 94 % der Partikel und schließen bei richtigem Sitz dicht ab. Ein Mund-Nasen-Schutz schützt vor allem andere vor deinen Tröpfchen und lässt seitlich Luft vorbei.',
    'Vor dem Betreten wird der Dichtsitz geprüft: beim Ausatmen soll keine Luft am Rand entweichen. Bart verhindert den Dichtsitz.',
  ],
  'erreger.mrsa.weg': [
    'MRSA steht für methicillinresistenten Staphylococcus aureus. Viele Menschen tragen ihn unbemerkt im Nasenvorhof (Besiedlung, Kolonisation). Gefährlich wird er, wenn er in Wunden, Blut oder Lunge gelangt.',
    'Ein Screening bei Aufnahme (Abstrich aus Nase, Rachen, Wunden) findet Träger mit Risikofaktoren, zum Beispiel nach Krankenhausaufenthalt oder mit chronischen Wunden.',
  ],
  'erreger.influenza.weg': [
    'Tröpfchen sind größer als etwa 5 µm und sinken innerhalb von 1 bis 2 Metern zu Boden. Deshalb schützen Abstand und Mund-Nasen-Schutz.',
    'Die jährliche Grippeimpfung wird Beschäftigten im Gesundheitswesen von der STIKO empfohlen. Sie schützt dich und senkt die Übertragung auf geschwächte Patienten.',
  ],
  'erreger.tbc.weg': [
    'Tröpfchenkerne sind kleiner als 5 µm, trocknen aus und bleiben stundenlang in der Raumluft. Sie gelangen bis in die Lungenbläschen. Deshalb braucht es Atemschutz, der auch feine Partikel filtert.',
    'Offen heißt: Erreger sind im Sputum nachweisbar. Eine geschlossene Tuberkulose ohne Anschluss an die Atemwege ist praktisch nicht ansteckend.',
  ],
  'erreger.hbv.weg': [
    'Hepatitis B ist sehr leicht über Blut übertragbar: Schon winzige Mengen bei einer Nadelstichverletzung können reichen. Die Impfung ist für Beschäftigte im Gesundheitswesen empfohlen, der Impferfolg wird über den Anti-HBs-Wert kontrolliert.',
    'Nach einer Stichverletzung: bluten lassen, desinfizieren, sofort dem D-Arzt bzw. Betriebsarzt melden. Eine Postexpositionsprophylaxe wirkt nur, wenn sie früh beginnt.',
  ],
  'erreger.noro.weg': [
    'Noroviren sind sehr umweltstabil und hoch ansteckend: Schon 10 bis 100 Viruspartikel können eine Infektion auslösen. Ausbrüche auf Stationen und in Pflegeheimen sind deshalb häufig.',
    'Erkranktes Personal bleibt bis mindestens 48 Stunden nach Symptomende zu Hause, weil auch danach noch Viren ausgeschieden werden.',
  ],
  'erreger.cdiff.haende': [
    'Clostridioides difficile verursacht vor allem nach Antibiotikatherapie Durchfälle bis zur schweren Kolitis, weil Antibiotika die schützende Darmflora zerstören.',
    'Sporen sind Dauerformen der Bakterien. Sie überstehen Alkohol, Trockenheit und viele Desinfektionsmittel und können monatelang auf Flächen überleben.',
  ],
  'erreger.noro.mittel': [
    'Viren mit Hülle (z. B. Influenza, Coronaviren) werden durch Alkohol leicht zerstört, weil die Hülle aus Fett besteht. Unbehüllte Viren wie Noro- oder Adenoviren sind deutlich widerstandsfähiger.',
    '„Begrenzt viruzid“ wirkt nur gegen behüllte Viren, „begrenzt viruzid PLUS“ zusätzlich gegen Noro-, Adeno- und Rotaviren, „viruzid“ gegen alle Viren. Die Angabe steht auf dem Präparat.',
  ],
  'erreger.noro.dauer': [
    'Die Ausscheidung von Noroviren im Stuhl kann noch Wochen nach der Erkrankung andauern. Die 48-Stunden-Regel ist ein Kompromiss zwischen Infektionsschutz und Versorgung.',
    'Während der Isolierung: eigene Toilette oder Toilettenstuhl, Wischdesinfektion der Kontaktflächen mit wirksamem Mittel, Wäsche als infektiös behandeln.',
  ],
  'erreger.mrgn': [
    'MRGN heißt multiresistente gramnegative Stäbchen (z. B. E. coli, Klebsiella, Pseudomonas, Acinetobacter). Die Zahl 3 oder 4 gibt an, gegen wie viele der vier wichtigen Antibiotikagruppen (Penicilline, Cephalosporine, Carbapeneme, Fluorchinolone) sie resistent sind.',
    'Bei 4MRGN bleiben kaum noch wirksame Antibiotika. Deshalb schützt die KRINKO alle Bereiche vor einer Weiterverbreitung, nicht nur Risikobereiche.',
  ],
  'erreger.mrsa.massnahmen': [
    'Isolierung heißt nicht Bettruhe: Menschen mit MRSA dürfen nach Absprache das Zimmer verlassen, wenn Wunden abgedeckt sind und sie die Hände desinfizieren. Soziale Isolation kann Rehabilitation und Psyche schaden.',
    'Eine Sanierung (z. B. Nasensalbe, antiseptische Waschungen über mehrere Tage) kann eine Besiedlung beseitigen. Erfolg wird mit Kontrollabstrichen geprüft.',
  ],
  'erreger.varizellen': [
    'Varizellen werden durch das Varizella-Zoster-Virus verursacht. Nach der Windpocken-Erkrankung bleibt es in Nervenknoten und kann später als Gürtelrose (Herpes zoster) wieder auftreten. Auch Zoster-Bläschen sind ansteckend.',
    'Für Schwangere ohne Immunität besteht Gefahr für das Ungeborene. Deshalb wird der Immunstatus bei Beschäftigten vor dem Einsatz geprüft (Impfung oder Antikörpernachweis).',
  ],
  'basis.einwirkzeit': [
    'Die Einwirkzeit ist die Zeit, in der das Mittel tatsächlich wirkt. Sie wird in Prüfverfahren für jedes Präparat ermittelt und kann je nach Wirkspektrum (z. B. gegen Noroviren) länger als 30 Sekunden sein.',
    'Häufige Desinfektion ist hautschonender als häufiges Waschen, weil rückfettende Zusätze enthalten sind und kein Wasser die Hautbarriere aufweicht. Hautpflege nach Hautschutzplan gehört trotzdem dazu.',
  ],
  'basis.schmuck': [
    'Unter einem Ring ist die Keimzahl deutlich höher als auf der übrigen Haut, und das Desinfektionsmittel erreicht die Haut darunter nicht. Auch Nagellack kann rissig werden und Erreger beherbergen.',
    'Das Verbot ist Arbeitsschutz (TRBA 250) und Patientenschutz (KRINKO) zugleich. Die Einrichtung muss es durchsetzen, auch bei Eheringen.',
  ],
  'basis.recapping': [
    'Beim Recapping führt die freie Hand die Kappe auf die Nadel zu. Rutscht man ab, sticht man sich in die Hand. Das ist einer der häufigsten Wege zu Stichverletzungen.',
    'Nach TRBA 250 sollen, wo möglich, Sicherheitsgeräte verwendet werden, bei denen die Nadel nach Gebrauch automatisch abgedeckt wird. Der Abwurfbehälter wird höchstens bis zur Markierung gefüllt.',
  ],
  'basis.waschen': [
    'Waschen entfernt Schmutz und Sporen mechanisch, tötet Erreger aber kaum ab. Desinfektion tötet ab, entfernt aber keinen Schmutz. Bei sichtbarer Verschmutzung braucht es deshalb beides: erst waschen, gut trocknen, dann desinfizieren.',
    'Auf nasse Hände aufgetragen wird das Desinfektionsmittel verdünnt und wirkt schlechter. Deshalb nach dem Waschen gründlich abtrocknen.',
  ],
  'basis.nosokomial': [
    'Nosokomial kommt von griechisch nosokomeion (Krankenhaus). Typisch sind Harnwegsinfektionen, Pneumonien, Wundinfektionen und Blutstrominfektionen, oft im Zusammenhang mit Kathetern, Beatmung oder Operationen.',
    'Krankenhäuser müssen nosokomiale Infektionen und Erreger mit besonderen Resistenzen nach § 23 IfSG aufzeichnen und bewerten. Ein Teil gilt als vermeidbar durch gute Hygiene.',
  ],
  'basis.flaechen': [
    'Die Schlussdesinfektion nach Entlassung umfasst alle Flächen der Patientenzone. Bei bestimmten Erregern (C. difficile, Noroviren) braucht es ein Mittel mit passendem Wirkspektrum.',
    'Richtige Konzentration und Einwirkzeit stehen im Hygieneplan. Zu schwach dosiert wirkt nicht, zu stark schadet Material und Atemwegen.',
  ],
  'basis.katheter': [
    'Katheterassoziierte Harnwegsinfektionen gehören zu den häufigsten nosokomialen Infektionen. Erreger wandern außen am Katheter oder innen im System aufwärts, deshalb bleibt das System geschlossen.',
    'Die Probenentnahme erfolgt nach Desinfektion über die dafür vorgesehene Entnahmestelle, nie durch Diskonnektion. Ein fester Wechselrhythmus wird nicht empfohlen, gewechselt wird nach Bedarf (z. B. Verstopfung, Infektion).',
  ],
  'basis.bereichskleidung': [
    'Dienstkleidung kann im Laufe der Schicht unbemerkt mit Erregern besiedelt werden, besonders an Bauch und Ärmeln. Kurze Ärmel erleichtern die Händedesinfektion bis zum Unterarm.',
    'Waschen bei mindestens 60 °C mit desinfizierendem Waschverfahren erfolgt in der Einrichtung. Zu Hause würde man Erreger in den privaten Bereich tragen.',
  ],
};
