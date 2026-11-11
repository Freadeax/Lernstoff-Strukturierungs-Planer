// „Mehr verstehen“ im Arzneimittel-Trainer: Wirkprinzip, Risiken, Beobachtung.
// Übliches Lehrbuchwissen (Arzneimittellehre für Pflegeberufe), ohne Beleg aus eigenem Material.
// Im Einzelfall gelten Fachinformation, ärztliche Anordnung und Hausstandard.

export const VERTIEFUNG: Record<string, string[]> = {
  'sicherheit.6r': [
    'Medikationsfehler entstehen meist an Schnittstellen: beim Übertragen von Anordnungen, beim Richten und bei Verwechslungen ähnlich klingender oder aussehender Präparate (Look-alike, Sound-alike).',
    'Den richtigen Patienten prüft man mit zwei unabhängigen Merkmalen, etwa Name und Geburtsdatum, die der Mensch selbst nennt, oder über das Patientenarmband. Die Zimmernummer ist kein sicheres Merkmal.',
  ],
  'sicherheit.richten': [
    'Gerichtet wird in Ruhe und ohne Unterbrechung, wenn möglich. Unterbrechungen beim Richten gehören zu den häufigsten Ursachen von Fehlern.',
    'Wer ein Medikament nicht eingenommen hat (abgelehnt, erbrochen, nüchtern), wird ebenfalls dokumentiert, mit Grund. Nur so weiß das Team, was tatsächlich gewirkt haben kann.',
  ],
  'sicherheit.retard': [
    'Retard heißt verzögert: Die Tablette gibt den Wirkstoff über viele Stunden ab. Zerstört man diese Hülle oder Matrix, kommt die Tagesdosis auf einmal. Bei Opioiden kann das lebensbedrohlich sein.',
    'Magensaftresistente Tabletten schützen den Wirkstoff vor der Säure oder den Magen vor dem Wirkstoff. Für Menschen mit Schluckstörungen gibt es oft Tropfen, Schmelztabletten, Pflaster oder teilbare Alternativen.',
  ],
  'sicherheit.btm': [
    'Betäubungsmittel sind stark wirksame Mittel mit Missbrauchs- und Abhängigkeitspotenzial, z. B. Morphin, Oxycodon, Fentanyl. Sie brauchen ein besonderes Rezept bzw. eine besondere Anforderung.',
    'Der Nachweis zeigt für jede Einheit, wann sie wem gegeben wurde. Fehlbestände werden sofort gemeldet. Bei Pflastern wird auch die Entsorgung gebrauchter Pflaster geregelt, weil sie noch Wirkstoff enthalten.',
  ],
  'sicherheit.unklar': [
    'Typische Fehlerquellen sind Kommastellen (2,5 statt 25), Einheiten (mg statt µg) und verwechselte Präparate. Eine ungewöhnliche Dosis ist ein Grund innezuhalten.',
    'Rechtlich gilt: Die Ärztin trägt die Anordnungsverantwortung, du die Durchführungsverantwortung. Wer eine offensichtlich falsche Anordnung ausführt, haftet mit.',
  ],
  'applikation.sc': [
    'Das Unterhautfettgewebe ist mäßig durchblutet. Deshalb wird der Wirkstoff gleichmäßig und etwas verzögert aufgenommen, was für Insulin und Heparin erwünscht ist.',
    'Bei Insulin-Pens wird die Nadel nach der Injektion einige Sekunden in der Haut gelassen, damit die volle Dosis abgegeben wird. Niedermolekulares Heparin wird nicht aspiriert und die Stelle nicht massiert (Hämatomgefahr).',
  ],
  'applikation.sublingual': [
    'Nitrate erweitern die Gefäße, vor allem die Venen. Das Herz muss weniger Blut pumpen und gegen weniger Widerstand arbeiten. Deshalb lindern sie Angina-pectoris-Beschwerden in wenigen Minuten.',
    'Typische Nebenwirkungen sind Kopfschmerzen und Blutdruckabfall. Nicht zusammen mit Potenzmitteln wie Sildenafil, der Blutdruck kann gefährlich abfallen.',
  ],
  'applikation.pflaster': [
    'Fentanyl ist ein sehr starkes Opioid. Das Pflaster gibt über etwa 72 Stunden gleichmäßig ab. Nach dem Aufkleben dauert es 12 bis 24 Stunden, bis der volle Spiegel erreicht ist, nach dem Entfernen wirkt es noch viele Stunden nach.',
    'Klebestelle: unbehaarte, unverletzte, saubere Haut am Oberkörper oder Oberarm, Stelle wechseln. Gebrauchte Pflaster zusammenkleben und sicher entsorgen, sie enthalten noch Wirkstoff.',
  ],
  'applikation.wirkeintritt': [
    'Bioverfügbarkeit heißt: Wie viel des Wirkstoffs erreicht unverändert den Blutkreislauf? Bei i. v. sind es 100 %. Bei Tabletten geht ein Teil schon im Darm oder in der Leber verloren.',
    'Eine i. m.-Injektion wirkt schneller als s. c., weil der Muskel stärker durchblutet ist. Im Schock ist die Aufnahme über Muskel und Haut unsicher, deshalb wird dann i. v. gegeben.',
  ],
  'applikation.augentropfen': [
    'Der Druck auf den inneren Lidwinkel verschließt den Tränenkanal. So bleibt der Wirkstoff länger im Auge und gelangt weniger über die Nase ins Blut (wichtig z. B. bei Betablocker-Augentropfen).',
    'Bei Tropfen und Salbe zusammen zuerst die Tropfen, dann die Salbe, weil die Salbe einen Film bildet, durch den Tropfen schlecht eindringen.',
  ],
  'gruppen.ramipril': [
    'ACE-Hemmer blockieren das Angiotensin-Konversionsenzym im Renin-Angiotensin-Aldosteron-System. Weniger Angiotensin II heißt: Gefäße weiten sich und die Niere hält weniger Salz und Wasser zurück.',
    'Der Reizhusten entsteht, weil ACE auch Bradykinin abbaut. Seltene, aber gefährliche Nebenwirkung ist eine Schwellung von Gesicht und Zunge (Angioödem).',
  ],
  'gruppen.metoprolol': [
    'Betablocker besetzen die Beta-Rezeptoren, an denen Adrenalin und Noradrenalin das Herz antreiben. Das Herz schlägt langsamer und braucht weniger Sauerstoff. Das schützt nach Herzinfarkt und bei Herzinsuffizienz.',
    'Bei Asthma können nicht selektive Betablocker die Bronchien verengen. Metoprolol und Bisoprolol wirken vorwiegend am Herzen (beta-1-selektiv).',
  ],
  'gruppen.candesartan': [
    'Sartane blockieren den Rezeptor für Angiotensin II (AT1-Rezeptor). Die Wirkung ähnelt der von ACE-Hemmern, Bradykinin wird aber normal abgebaut, deshalb kaum Husten.',
    'Wie bei ACE-Hemmern werden Kalium und Nierenwerte kontrolliert. Beide Gruppen werden in der Regel nicht kombiniert.',
  ],
  'gruppen.simvastatin': [
    'Statine hemmen ein Enzym der Cholesterinbildung in der Leber. Sie senken das LDL-Cholesterin und schützen so vor Herzinfarkt und Schlaganfall.',
    'Die gefürchtete Muskelschädigung (Rhabdomyolyse) ist selten. Sie zeigt sich mit Muskelschmerzen, Schwäche und dunklem Urin. Einige Statine werden abends gegeben, weil die Cholesterinbildung nachts am höchsten ist.',
  ],
  'gruppen.pantoprazol': [
    'Protonenpumpenhemmer blockieren die Säurepumpe in den Belegzellen des Magens. Sie wirken am besten, wenn die Pumpen aktiv werden, also kurz vor einer Mahlzeit.',
    'Bei Langzeiteinnahme sind Magnesium- und Vitamin-B12-Mangel sowie ein etwas höheres Infektionsrisiko möglich. Die Indikation wird deshalb regelmäßig überprüft.',
  ],
  'gruppen.amoxicillin': [
    'Penicilline stören den Aufbau der Bakterienzellwand. Gegen Viren wirken Antibiotika nicht.',
    'Antibiotika werden in festen Abständen gegeben, damit der Wirkspiegel nicht abfällt. Häufige Nebenwirkung ist Durchfall, weil auch die Darmflora geschädigt wird. Schwerer, wässriger Durchfall kann auf Clostridioides difficile hinweisen.',
  ],
  'gruppen.bisoprolol': [
    'Nach längerer Gabe bildet der Körper mehr Beta-Rezeptoren. Fällt der Betablocker plötzlich weg, reagiert das Herz überempfindlich auf Adrenalin (Rebound): Herzrasen, Blutdruckspitzen, bei KHK Angina pectoris.',
    'Betablocker können Warnzeichen einer Unterzuckerung (Herzrasen, Zittern) abschwächen. Bei Menschen mit Diabetes auf andere Zeichen wie Schwitzen und Verwirrtheit achten.',
  ],
  'gruppen.enalapril': [
    'ACE-Hemmer verringern die Aldosteronwirkung. Aldosteron sorgt normalerweise für die Ausscheidung von Kalium, deshalb kann das Kalium steigen, besonders zusammen mit kaliumsparenden Diuretika oder bei Niereninsuffizienz.',
    'Die erste Dosis kann den Blutdruck stark senken, besonders bei Flüssigkeitsmangel. Nach Beginn der Therapie auf Schwindel achten und Blutdruck kontrollieren.',
  ],
  'beobachtung.opioid': [
    'Opioide binden an Opioidrezeptoren im Darm und verlangsamen die Peristaltik. Gegen diesen Effekt entwickelt der Körper kaum Gewöhnung, gegen Übelkeit und Müdigkeit schon.',
    'Bei Atemdepression wird die Atmung langsam und flach, die Person ist schwer weckbar, die Pupillen sind eng. Ärztlich kann Naloxon die Wirkung aufheben, wirkt aber kürzer als viele Opioide.',
  ],
  'beobachtung.antikoag': [
    'Gerinnungshemmer sind zum Beispiel Vitamin-K-Antagonisten (Phenprocoumon), direkte orale Antikoagulanzien (Endungen -xaban, -gatran) und Heparine. Plättchenhemmer wie ASS wirken anders, erhöhen aber ebenfalls die Blutungsneigung.',
    'Nach einem Sturz unter Gerinnungshemmern kann sich eine Hirnblutung auch Stunden später zeigen. Deshalb Bewusstsein, Kopfschmerzen und neurologische Zeichen engmaschig beobachten und ärztlich abklären lassen.',
  ],
  'beobachtung.diuretika': [
    'Schleifendiuretika wie Furosemid wirken stark und schnell: Die Ausscheidung beginnt oral nach etwa 30 bis 60 Minuten und hält einige Stunden an.',
    'Tägliches Wiegen zeigt Wassereinlagerungen früh: Eine Zunahme von mehr als 1 kg an einem Tag oder 2 kg in drei Tagen bei Herzinsuffizienz wird gemeldet. Gewogen wird morgens, nüchtern, mit gleicher Kleidung.',
  ],
  'beobachtung.nsar': [
    'NSAR hemmen das Enzym Cyclooxygenase und damit Prostaglandine. Prostaglandine lösen Schmerz und Entzündung aus, schützen aber auch die Magenschleimhaut und halten die Nierendurchblutung aufrecht.',
    'Die PRISCUS-Liste nennt Medikamente, die für ältere Menschen potenziell ungeeignet sind. Viele NSAR stehen darauf, besonders bei längerer Anwendung.',
  ],
  'beobachtung.insulin': [
    'Kurz wirksames Insulin (Normalinsulin oder schnelle Analoga) wirkt nach 10 bis 30 Minuten, das Maximum liegt nach 1 bis 3 Stunden. In dieser Zeit braucht der Körper die Kohlenhydrate aus der Mahlzeit.',
    'Lang wirksames Basalinsulin deckt den Grundbedarf und wird unabhängig vom Essen gegeben. Es wird in der Regel nicht weggelassen, nur weil jemand nicht isst, sondern nach Anordnung angepasst.',
  ],
};
