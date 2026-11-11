// „Mehr verstehen“ im Anatomie-Trainer: Bau und Funktion mit Bezug zur Pflege.
// Übliches Lehrbuchwissen (Anatomie/Physiologie für Pflegeberufe), ohne Beleg aus eigenem Material.

export const VERTIEFUNG: Record<string, string[]> = {
  'herz.beschriften': [
    'Die Klappen sind Ventile: Segelklappen werden in der Systole von Sehnenfäden und Papillarmuskeln gehalten, damit sie nicht in die Vorhöfe durchschlagen. Taschenklappen schließen sich passiv, wenn das Blut zurückfließen will.',
    'Pflegebezug: Eine undichte oder verengte Klappe (Insuffizienz bzw. Stenose) hört man als Herzgeräusch. Eine Mitralinsuffizienz staut Blut zurück in die Lunge, typisch sind Atemnot und Rasselgeräusche.',
  ],
  'herz.blutfluss': [
    'Der Lungenkreislauf arbeitet mit niedrigem Druck (systolisch etwa 25 mmHg), der Körperkreislauf mit hohem (etwa 120 mmHg). Darum versagt bei einer Linksherzschwäche zuerst die Lunge (Stauung, Lungenödem), bei einer Rechtsherzschwäche staut sich das Blut in Beinen, Leber und Halsvenen.',
    'Herzzeitvolumen = Schlagvolumen (etwa 70 ml) × Herzfrequenz. In Ruhe pumpt das Herz so rund 5 Liter pro Minute.',
  ],
  'herz.erregung': [
    'Das Herz erregt sich selbst (Autorhythmie). Das vegetative Nervensystem ändert nur das Tempo: Sympathikus schneller, Parasympathikus (Vagusnerv) langsamer.',
    'Im EKG entspricht die P-Welle der Vorhoferregung, der QRS-Komplex der Kammererregung und die T-Welle der Rückbildung. Beim Vorhofflimmern fehlt die geordnete P-Welle, der Puls ist unregelmäßig.',
  ],
  'herz.koerperkreislauf': [
    'Die linke Kammer erzeugt den systolischen Blutdruck. Ein dauerhaft hoher Blutdruck lässt ihre Wand weiter wachsen (Hypertrophie), bis sie steif wird und schlechter füllt. Das ist ein Weg zur Herzinsuffizienz.',
    'Die rechte Kammer ist dünnwandiger, weil der Lungenkreislauf nur einen geringen Widerstand hat.',
  ],
  'herz.lungenvenen': [
    'Merke: Arterie und Vene sagen etwas über die Richtung, nicht über den Sauerstoff. Im Lungenkreislauf ist es deshalb umgekehrt: Die Lungenarterie führt sauerstoffarmes, die Lungenvenen führen sauerstoffreiches Blut.',
    'Beim Neugeborenen gibt es zusätzlich Kurzschlüsse (Foramen ovale, Ductus arteriosus), die vor der Geburt die noch nicht belüftete Lunge umgehen und sich danach schließen.',
  ],
  'herz.koronar': [
    'Die Herzkranzgefäße werden vor allem in der Diastole durchblutet, weil der angespannte Herzmuskel sie in der Systole zusammendrückt. Bei hoher Herzfrequenz wird die Diastole kürzer, der Herzmuskel bekommt weniger Sauerstoff.',
    'Verengungen der Koronararterien (koronare Herzkrankheit) zeigen sich zuerst als Brustenge bei Belastung (Angina pectoris). Ein vollständiger Verschluss ist ein Herzinfarkt und braucht sofort ärztliche Hilfe.',
  ],
  'herz.systole': [
    'In Ruhe dauert die Diastole etwa doppelt so lange wie die Systole. In dieser Zeit füllen sich die Kammern und das Herz selbst wird durchblutet.',
    'Messpraxis: Beim Ablassen der Manschette ist der erste hörbare Ton (Korotkow-Ton) der systolische, das Verschwinden der Töne der diastolische Wert.',
  ],
  'atmung.beschriften': [
    'Die Luftröhre wird von hufeisenförmigen Knorpelspangen offen gehalten. Hinten ist sie weich und grenzt an die Speiseröhre. Die Atemwege sind mit Flimmerepithel ausgekleidet, das Schleim und Staub nach oben befördert.',
    'Die Lungen sind von zwei Häuten (Pleura) umgeben. Zwischen ihnen herrscht ein Unterdruck, der die Lunge an der Brustwand hält. Dringt Luft ein (Pneumothorax), fällt die Lunge zusammen.',
  ],
  'atmung.luftweg': [
    'Die Nase wärmt, befeuchtet und reinigt die Luft. Wer durch den Mund oder über einen Tubus bzw. eine Trachealkanüle atmet, verliert diesen Schutz. Deshalb braucht es dann Anfeuchtung.',
    'Der anatomische Totraum beträgt beim Erwachsenen etwa 150 ml. Bei sehr flacher, schneller Atmung wird vor allem Totraum bewegt, der Gasaustausch sinkt.',
  ],
  'atmung.gasaustausch': [
    'Rund 300 Millionen Alveolen bieten eine Austauschfläche von etwa 100 Quadratmetern. Diffusion gelingt, weil der Sauerstoffdruck in der Alveole höher ist als im Blut und der Kohlendioxiddruck umgekehrt.',
    'Wird die Wand dicker (Lungenödem, Lungenfibrose) oder die Fläche kleiner (Emphysem), sinkt die Sauerstoffsättigung, oft zuerst unter Belastung.',
  ],
  'atmung.aspiration': [
    'Aspiration ist das Eindringen von Material unter die Stimmbänder. Bei liegenden Patienten sind auch die hinteren Lungenabschnitte betroffen, weil Flüssigkeit der Schwerkraft folgt.',
    'Stille Aspiration (ohne Husten) ist häufig nach Schlaganfall oder bei Demenz. Hinweise sind Fieber, gurgelnde Stimme nach dem Essen und neue Rasselgeräusche.',
  ],
  'atmung.atemmuskel': [
    'Die Ausatmung in Ruhe ist passiv: Lunge und Brustkorb federn zurück. Bei Atemnot werden Atemhilfsmuskeln eingesetzt, sichtbar an hochgezogenen Schultern und eingezogenen Zwischenrippenräumen.',
    'Pflegebezug: Im Kutschersitz oder mit aufgestützten Armen können die Atemhilfsmuskeln besser arbeiten. Ein gefüllter Bauch drückt das Zwerchfell nach oben und erschwert die Atmung.',
  ],
  'atmung.kehldeckel': [
    'Schlucken ist ein fein abgestimmter Reflex mit über 50 Muskeln. Der Kehlkopf hebt sich, der Kehldeckel klappt über den Eingang und die Atmung setzt kurz aus.',
    'Pflegebezug: Aufrecht sitzen, Kopf leicht nach vorn, kleine Bissen, Zeit lassen. Bei Dysphagie wird oft angedickte Kost nach logopädischer Einschätzung gegeben.',
  ],
  'atmung.atemzentrum': [
    'Chemorezeptoren melden den Gehalt von Kohlendioxid und Sauerstoff an das Atemzentrum. Bei Menschen mit schwerer COPD und dauerhaft hohem Kohlendioxid kann der Sauerstoffmangel zum wichtigeren Atemantrieb werden. Deshalb wird Sauerstoff dort nach ärztlich festgelegtem Zielbereich gegeben.',
    'Opioide und Beruhigungsmittel verlangsamen die Atmung. Eine Atemfrequenz unter 8 pro Minute ist ein Warnzeichen.',
  ],
  'niere.beschriften': [
    'Die Nieren erhalten rund ein Fünftel des Herzzeitvolumens. Fällt der Blutdruck stark ab (Schock), werden sie schlecht durchblutet, die Urinausscheidung sinkt als frühes Zeichen.',
    'Die Harnblase fasst etwa 300 bis 500 ml. Harndrang setzt meist ab etwa 150 bis 250 ml ein.',
  ],
  'niere.harnweg': [
    'Im Glomerulus werden Wasser und kleine Moleküle abgefiltert, Blutzellen und große Eiweiße bleiben im Blut. Eiweiß oder Blut im Urin weisen deshalb auf einen Schaden am Filter hin.',
    'Die Feinsteuerung im Tubulus übernehmen Hormone: ADH für Wasser, Aldosteron für Natrium und Kalium.',
  ],
  'niere.nephron': [
    'Nephrone wachsen nicht nach. Ab etwa 40 Jahren nimmt ihre Zahl langsam ab. Deshalb werden viele Medikamente bei älteren Menschen nach der Nierenfunktion (GFR) dosiert.',
    'Die glomeruläre Filtrationsrate (GFR) wird meist aus dem Kreatinin im Blut geschätzt (eGFR) und beschreibt, wie viel Blut die Nieren pro Minute filtern.',
  ],
  'niere.primaerharn': [
    'Weniger als 500 ml Urin am Tag heißt Oligurie, weniger als 100 ml Anurie. Bei Bilanzierung zählt die Ausfuhr pro Stunde: unter etwa 0,5 ml pro kg Körpergewicht über mehrere Stunden ist ein Warnzeichen.',
    'Konzentrierter, dunkler Urin zeigt, dass die Niere Wasser spart, etwa bei zu geringer Trinkmenge.',
  ],
  'niere.hormone': [
    'Renin startet das Renin-Angiotensin-Aldosteron-System (RAAS): Es verengt Gefäße und hält Natrium und Wasser zurück, der Blutdruck steigt. ACE-Hemmer setzen genau hier an.',
    'Calcitriol fördert die Aufnahme von Calcium aus dem Darm. Bei Niereninsuffizienz fehlt es, Knochenschäden sind möglich.',
  ],
  'verdauung.weg': [
    'Die Nahrung wird durch Peristaltik transportiert, wellenförmige Kontraktionen der glatten Muskulatur. Bewegungsmangel, wenig Flüssigkeit und Opioide verlangsamen sie, Obstipation ist die Folge.',
    'Der Dickdarm entzieht dem Stuhl vor allem Wasser und Elektrolyte. Je länger der Stuhl dort bleibt, desto härter wird er.',
  ],
  'verdauung.fett': [
    'Bei einem Gallenstau gelangt Bilirubin ins Blut statt in den Darm: Haut und Augen werden gelb, der Urin dunkel, der Stuhl hell (entfärbt). Diese Kombination spricht für eine Abflussstörung.',
    'Gallenkoliken treten typisch nach fettreichem Essen auf, weil sich die Gallenblase gegen den Stein zusammenzieht.',
  ],
  'verdauung.resorption': [
    'Das Blut aus dem Darm fließt über die Pfortader zuerst durch die Leber. Viele Medikamente werden dabei schon teilweise abgebaut (First-Pass-Effekt), bevor sie den Körper erreichen.',
    'Vitamin B12 wird erst im letzten Dünndarmabschnitt (Ileum) aufgenommen und braucht dafür den Intrinsic Factor aus dem Magen.',
  ],
  'verdauung.galle': [
    'Gallensäuren zerlegen Fett in kleine Tröpfchen (Emulgieren), damit die Enzyme der Bauchspeicheldrüse es spalten können. Ohne Galle werden Fett und fettlösliche Vitamine (A, D, E, K) schlecht aufgenommen.',
    'Die Galle transportiert auch Abbauprodukte wie Bilirubin aus dem Hämoglobinabbau, das dem Stuhl die braune Farbe gibt.',
  ],
  'verdauung.pankreas': [
    'Exokrin heißt nach außen (in den Darm), endokrin heißt nach innen (ins Blut). Die Inselzellen machen nur etwa 1 bis 2 % des Organs aus.',
    'Bei einer akuten Pankreatitis verdauen aktivierte Enzyme das eigene Organ. Typisch sind gürtelförmige Oberbauchschmerzen und ein erhöhter Lipasewert.',
  ],
  'verdauung.magen': [
    'Der Magensaft hat einen pH-Wert von etwa 1 bis 2. Säurehemmer wie Protonenpumpenhemmer (Endung -prazol) senken diesen Schutz, Infektionen des Darms werden etwas wahrscheinlicher.',
    'Der Magen bildet auch den Intrinsic Factor für die Vitamin-B12-Aufnahme. Nach Magenentfernung muss B12 gespritzt werden.',
  ],
  'bewegung.beschriften': [
    'Knochen sind lebendes Gewebe: Sie werden ständig auf- und abgebaut. Belastung regt den Aufbau an, Bettlägerigkeit führt schon nach Wochen zu messbarem Knochenabbau.',
    'Pflegebezug: Bei einem Schenkelhalsbruch ist das Bein oft verkürzt und nach außen gedreht. Bei Osteoporose kann schon ein leichter Sturz reichen.',
  ],
  'bewegung.wirbelsaeule': [
    'Die Wirbelsäule ist doppelt S-förmig gekrümmt (Hals- und Lendenlordose, Brust- und Sakralkyphose). Die Krümmung federt Stöße ab.',
    'Zwischen den Wirbeln liegen Bandscheiben. Ein Bandscheibenvorfall drückt auf Nervenwurzeln, Schmerzen und Gefühlsstörungen strahlen dann ins Bein oder in den Arm aus.',
  ],
  'bewegung.gelenke': [
    'Gelenktypen nach Bewegungsachsen: Scharniergelenk eine Achse, Eigelenk und Sattelgelenk zwei, Kugelgelenk drei. Die Form der Gelenkflächen bestimmt, was möglich ist.',
    'Die Schulter wird vor allem von Muskeln und Sehnen (Rotatorenmanschette) gehalten. Deshalb beim Mobilisieren nie am Arm ziehen, besonders bei Halbseitenlähmung (Gefahr der Schultersubluxation).',
  ],
  'bewegung.knochenanzahl': [
    'Die meisten Knochen liegen in Händen und Füßen (zusammen über die Hälfte). Das erklärt die feine Beweglichkeit der Hände.',
    'Beim Säugling sind die Schädelknochen noch nicht verwachsen, an den Fontanellen kann man das Gehirn durch die Haut pulsieren fühlen.',
  ],
  'bewegung.kontraktur': [
    'Muskeln und Sehnen passen ihre Länge der Haltung an, in der sie die meiste Zeit verbringen. Wer lange mit angezogenen Knien liegt, verliert die Fähigkeit, sie zu strecken. Gefährdet sind vor allem Hüfte, Knie, Sprunggelenk (Spitzfuß) und Schulter.',
    'Weiche Matratzen und Bettdecken, die auf die Füße drücken, begünstigen einen Spitzfuß. Bewegungsübungen sollen jedes gefährdete Gelenk mehrmals täglich durch seinen Bewegungsumfang führen, ohne Schmerzen zu verursachen.',
  ],
  'bewegung.muskel': [
    'Bei Spastik nach einem Schlaganfall ist dieses Gleichgewicht gestört: Die Grundspannung bestimmter Muskeln ist erhöht, oft Beuger im Arm und Strecker im Bein.',
    'Muskeln bauen bei Bettruhe schnell ab, schätzungsweise 1 bis 3 % Kraft pro Tag. Frühe Mobilisation erhält Kraft und senkt die Sturzgefahr.',
  ],
  'nerven.beschriften': [
    'Grob zugeordnet: Stirnlappen für Bewegung, Planung und Persönlichkeit, Scheitellappen für Körpergefühl, Schläfenlappen für Hören und Gedächtnis, Hinterhauptslappen für Sehen.',
    'Pflegebezug: Nach Schädigung des Stirnlappens fallen oft Antrieb und Impulskontrolle auf. Das ist Krankheitsfolge, kein Charakterzug.',
  ],
  'nerven.reflex': [
    'Der Weg vom Reiz zur Antwort heißt Reflexbogen. Beim Kniesehnenreflex liegen Rezeptor und Erfolgsorgan im selben Muskel (Eigenreflex).',
    'Fehlende oder gesteigerte Reflexe helfen in der Diagnostik, Schäden im Nervensystem einzugrenzen. Bei Bewusstlosen werden Schutzreflexe wie der Husten- und Schluckreflex beobachtet.',
  ],
  'nerven.zns': [
    'Gehirn und Rückenmark sind von Hirnhäuten und Liquor (Hirnwasser) umgeben und durch die Blut-Hirn-Schranke geschützt. Viele Medikamente gelangen deshalb nur schwer ins ZNS.',
    'Nervenzellen im ZNS wachsen kaum nach. Ausfälle nach Schlaganfall oder Rückenmarkverletzung bessern sich vor allem, weil andere Bereiche Aufgaben übernehmen (Neuroplastizität).',
  ],
  'nerven.sympathikus': [
    'Der Sympathikus nutzt Noradrenalin als Botenstoff, das Nebennierenmark schüttet zusätzlich Adrenalin aus. Stress, Schmerz und Angst aktivieren ihn, der Puls steigt und die Haut wird blass und kalt.',
    'Medikamente greifen gezielt ein: Betablocker bremsen die Wirkung am Herzen, Bronchodilatatoren aktivieren gewünschte Effekte an der Lunge.',
  ],
  'nerven.kreuzung': [
    'Die Kreuzung der Pyramidenbahn liegt im verlängerten Mark. Deshalb zeigt sich ein Schaden in einer Hirnhälfte immer auf der Gegenseite des Körpers.',
    'Pflegebezug: Bei einer Halbseitenlähmung wird die betroffene Seite bewusst einbezogen (z. B. Ansprache und Nachttisch zur betroffenen Seite), um Wahrnehmung und Rehabilitation zu fördern. Das ist Teil des Bobath-Konzepts.',
  ],
  'nerven.kleinhirn': [
    'Das Kleinhirn vergleicht ständig geplante mit tatsächlichen Bewegungen und korrigiert sie. Es arbeitet eng mit dem Gleichgewichtsorgan im Innenohr zusammen.',
    'Pflegebezug: Bei Ataxie ist die Sturzgefahr hoch. Hilfsmittel, feste Schuhe und Begleitung beim Gehen sind wichtig.',
  ],
  'sinne.auge': [
    'Die Netzhaut ist Teil des Gehirns, das „nach vorn gewachsen“ ist. Eine Netzhautablösung zeigt sich durch Lichtblitze, Rußregen oder einen Schatten und ist ein augenärztlicher Notfall.',
    'Die Makula ist die Stelle des schärfsten Sehens. Bei der altersbedingten Makuladegeneration fällt deshalb die Mitte des Gesichtsfelds aus, Lesen und Gesichter erkennen werden schwer.',
  ],
  'sinne.licht': [
    'Die Hornhaut leistet den größten Teil der Lichtbrechung, die Linse übernimmt die Feineinstellung. Das Bild auf der Netzhaut steht auf dem Kopf, das Gehirn dreht es um.',
    'Die Katarakt wird durch Austausch der Linse gegen eine Kunstlinse behandelt, eine der häufigsten Operationen überhaupt.',
  ],
  'sinne.schall': [
    'Die Hörschnecke enthält Haarsinneszellen. Lärm und Alter schädigen sie, typisch ist zuerst der Verlust hoher Töne (Altersschwerhörigkeit, Presbyakusis). Konsonanten werden dann schlecht verstanden.',
    'Kommunikation mit schwerhörigen Menschen: Gesicht zuwenden, deutlich und nicht zu schnell sprechen, Störgeräusche reduzieren, Hörgerät prüfen (Batterie, Sitz). Lautes Schreien verzerrt die Sprache eher.',
  ],
  'sinne.akkommodation': [
    'In Ruhe ist der Ziliarmuskel entspannt, die Linse flach, das Auge sieht in die Ferne scharf. Nahsehen ist Muskelarbeit, deshalb ermüden die Augen beim langen Lesen.',
    'Altersweitsichtigkeit (Presbyopie) ist keine Krankheit, sondern natürlicher Elastizitätsverlust der Linse.',
  ],
  'sinne.zapfen': [
    'Es gibt drei Zapfentypen für Rot, Grün und Blau. Fehlt ein Typ oder funktioniert er schlechter, entsteht eine Farbsehschwäche, am häufigsten Rot-Grün bei Männern.',
    'Stäbchen sind viel lichtempfindlicher. Im Halbdunkel sehen wir deshalb kaum Farben. Ältere Menschen brauchen mehr Licht, Nachtlicht senkt die Sturzgefahr.',
  ],
  'sinne.glaukom': [
    'Das Kammerwasser wird ständig gebildet und fließt im Kammerwinkel ab. Ist der Abfluss gestört, steigt der Druck. Das chronische Glaukom verläuft schmerzlos und schränkt das Gesichtsfeld von außen her ein.',
    'Pflegebezug: Manche Medikamente (z. B. bestimmte Anticholinergika) können bei engem Kammerwinkel einen Glaukomanfall auslösen. Augentropfen gegen Glaukom müssen regelmäßig gegeben werden.',
  ],
  'haut.beschriften': [
    'Die Oberhaut erneuert sich etwa alle 4 Wochen von unten nach oben. In der Lederhaut liegen Gefäße, Nerven, Drüsen und Kollagenfasern, die der Haut Festigkeit geben. Die Unterhaut speichert Fett und polstert.',
    'Bei Dekubitus-Kategorien zählt die Tiefe: Kategorie 1 betrifft die intakte Haut (nicht wegdrückbare Rötung), Kategorie 2 die Oberhaut bis Teile der Lederhaut, Kategorie 3 reicht in die Unterhaut, Kategorie 4 bis zu Muskel, Sehne oder Knochen.',
  ],
  'haut.funktionen': [
    'Die Haut regelt die Temperatur über Schwitzen und die Weite der Hautgefäße. Ältere Menschen schwitzen weniger und spüren Durst schlechter, sie überhitzen bei Hitze schneller.',
    'Altershaut ist dünner, trockener und schlechter durchblutet. Sie reißt leichter (Hautrisse beim Transfer) und heilt langsamer.',
  ],
  'haut.saeureschutz': [
    'Der Säureschutzmantel besteht aus Schweiß, Talg und Hornschicht. Er hemmt krankmachende Keime und unterstützt die normale Hautflora.',
    'Bei Inkontinenz greift Urin und Stuhl die Haut an (inkontinenzassoziierte Dermatitis). Schonende Reinigung, Hautschutz und schnelle Versorgung nach Ausscheidung schützen die Haut.',
  ],
  'haut.dekubitus': [
    'Neben Druck wirken Scherkräfte: Rutscht ein Mensch im Bett nach unten, verschieben sich die Hautschichten gegeneinander und Gefäße werden abgeknickt. Deshalb beim Hochlagern nicht ziehen, sondern Hilfsmittel nutzen.',
    'Feuchtigkeit, Mangelernährung, Fieber und verminderte Wahrnehmung erhöhen das Risiko zusätzlich. Fingertest: Lässt sich die Rötung nicht wegdrücken, liegt schon ein Dekubitus Kategorie 1 vor.',
  ],
  'haut.schichten': [
    'Bei subkutanen Injektionen (s. c.) wird in die Unterhaut gespritzt, bei intramuskulären (i. m.) durch alle Hautschichten und die Faszie in den Muskel. Die Schicht bestimmt, wie schnell ein Medikament aufgenommen wird.',
    'Die Unterhaut ist schlecht durchblutet. Bei Kreislaufschock wird ein s. c.-Medikament deshalb unsicher aufgenommen.',
  ],
  'hormone.beschriften': [
    'Hormone sind Botenstoffe, die über das Blut an weit entfernten Organen wirken. Sie wirken nur an Zellen mit passendem Rezeptor.',
    'Die Nebenniere besteht aus zwei verschiedenen Drüsen: Die Rinde bildet Cortisol und Aldosteron, das Mark Adrenalin und Noradrenalin.',
  ],
  'hormone.regelkreis': [
    'Regelkreise funktionieren wie ein Thermostat. Wird dem Körper Hormon von außen gegeben (z. B. L-Thyroxin), sinkt das TSH. So kontrolliert man die richtige Dosis.',
    'Bei der Unterfunktion wird L-Thyroxin morgens nüchtern etwa 30 Minuten vor dem Frühstück gegeben, weil Nahrung die Aufnahme stört.',
  ],
  'hormone.insulin': [
    'Insulin öffnet vor allem Muskel- und Fettzellen für Glukose und fördert die Speicherung als Glykogen in der Leber. Fehlt es, steigt der Blutzucker, obwohl die Zellen hungern.',
    'Pflegebezug: Wer Insulin spritzt und dann nicht isst, rutscht in die Hypoglykämie. Insulin und Mahlzeit gehören deshalb zeitlich zusammen.',
  ],
  'hormone.adh': [
    'ADH wird ausgeschüttet, wenn das Blut zu konzentriert ist oder das Volumen sinkt. Es baut Wasserkanäle in die Sammelrohre ein, der Urin wird konzentrierter.',
    'Fehlt ADH (Diabetes insipidus), scheiden Betroffene viele Liter verdünnten Urin aus und haben starken Durst.',
  ],
  'hormone.cortison': [
    'Cortison als Medikament wirkt wie das körpereigene Cortisol. Bei Langzeittherapie stellt die eigene Nebenniere die Produktion ein. Deshalb darf es nicht plötzlich abgesetzt werden, sonst droht eine Nebennierenkrise.',
    'Pflegebezug: Blutzucker kontrollieren, auf Infektzeichen achten (Entzündung kann verschleiert sein), Haut schonen, Sturzprophylaxe wegen Osteoporose. Gabe meist morgens, passend zum natürlichen Rhythmus.',
  ],
  'hormone.ueberfunktion': [
    'Schilddrüsenhormone stellen die Stoffwechselrate ein. Bei Überfunktion steigen Herzfrequenz und Wärmebildung, bei älteren Menschen ist oft nur Vorhofflimmern oder Gewichtsverlust auffällig.',
    'Jodhaltiges Kontrastmittel kann bei bestehender Überfunktion eine thyreotoxische Krise auslösen. Deshalb wird vor CT-Untersuchungen mit Kontrastmittel nach der Schilddrüse gefragt.',
  ],
};
