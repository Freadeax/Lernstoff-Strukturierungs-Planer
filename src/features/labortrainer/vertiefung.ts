// „Mehr verstehen“ im Labor-Trainer: Präanalytik, Blutgase und Befunde.
// Übliches Lehrbuchwissen ohne Beleg aus eigenem Material. Röhrchenfarben, Abnahmereihenfolge und
// Referenzbereiche richten sich nach Labor und Hausstandard.

import { KINDER_VERTIEFUNG } from './kinder';

export const VERTIEFUNG: Record<string, string[]> = {
  ...KINDER_VERTIEFUNG,
  'pa.reihenfolge': [
    'Präanalytik umfasst alles vor der eigentlichen Messung: Vorbereitung der Person, Entnahme, Beschriftung, Lagerung und Transport. Ein großer Teil aller Laborfehler entsteht in dieser Phase, nicht im Labor.',
    'Die Röhrchen enthalten Zusätze: Citrat und EDTA binden Calcium und verhindern so die Gerinnung, Heparin hemmt sie direkt, Fluorid stoppt den Zuckerabbau der Blutzellen. Ein Tropfen Zusatz im falschen Röhrchen verfälscht die Werte dort.',
  ],
  'pa.reihenfolge-klein': [
    'Der Schlauch einer Flügelkanüle enthält Luft. Das erste Röhrchen saugt diese Luft mit an und füllt sich zu wenig. Beim Citratröhrchen stimmt dann das Mischverhältnis nicht.',
    'Die Reihenfolge ist auch bei kleinen Abnahmen gleich, nur fallen nicht benötigte Röhrchen weg. Das macht die Regel leicht merkbar.',
  ],
  'pa.stauen': [
    'Gestaut wird so, dass die Venen hervortreten, der arterielle Puls aber tastbar bleibt (etwa 50 bis 100 mmHg Druck). Zu starke Stauung unterbricht den Zufluss.',
    'Durch Stauen tritt Wasser aus dem Gefäß ins Gewebe, große Moleküle und Zellen bleiben im Blut. Man nennt das Hämokonzentration: Werte wie Eiweiß, Hb und an Eiweiß gebundenes Calcium steigen scheinbar.',
  ],
  'pa.haemolyse': [
    'Hämolyse heißt Zerfall roter Blutkörperchen. Sie enthalten viel mehr Kalium als das Plasma, schon geringe Hämolyse hebt den Wert deutlich. Auch LDH und freies Hämoglobin steigen, das Serum sieht rötlich aus.',
    'Es gibt auch eine echte Hämolyse im Körper, etwa bei Transfusionsreaktionen. Deshalb wird nicht einfach ein Abnahmefehler angenommen, sondern neu abgenommen und ärztlich bewertet.',
  ],
  'pa.infusion': [
    'Schon kleine Mengen Infusionslösung verfälschen die Probe stark. Bei Glukose-Infusion zeigt der Befund dann einen sehr hohen Blutzucker, bei Elektrolytlösung passende Elektrolytveränderungen.',
    'Unplausible Werte, die nicht zum Zustand passen, sind ein Hinweis auf eine verunreinigte Probe. Dann ist Rückfrage und Wiederholung besser als eine Behandlung nach falschem Wert.',
  ],
  'pa.ident': [
    'Beim Kreuzblut für eine Transfusion kann eine Verwechslung tödlich sein: Bekommt jemand Blut der falschen Blutgruppe, zerstört das Immunsystem die fremden Blutkörperchen (ABO-Unverträglichkeit).',
    'Offene Fragen zwingen zur aktiven Antwort. Auf geschlossene Fragen („Sind Sie Frau M.?“) nicken verwirrte oder schwerhörige Menschen oft einfach.',
  ],
  'pa.citrat': [
    'Citrat bindet Calcium, das für die Gerinnung nötig ist. Im Labor wird Calcium wieder zugegeben und die Zeit bis zur Gerinnung gemessen. Ist zu viel Citrat im Röhrchen, reicht das zugegebene Calcium nicht, die Zeit wird falsch lang.',
    'Gemessene Werte sind zum Beispiel Quick bzw. INR (äußeres System, wichtig bei Phenprocoumon) und aPTT (inneres System, wichtig bei Heparin).',
  ],
  'pa.liegen': [
    'Blutzellen leben im Röhrchen weiter: Sie verbrauchen Glukose (etwa 5 bis 10 % pro Stunde bei Raumtemperatur) und die Natrium-Kalium-Pumpe versagt mit der Zeit, Kalium tritt aus.',
    'Wie lange eine Probe stehen darf, hängt vom Wert ab. Das Laborhandbuch des Hauses nennt Höchstzeiten und Lagertemperatur.',
  ],
  'pa.bk': [
    'Blutkulturen sollen Erreger im Blut (Bakteriämie) nachweisen. Die aerobe Flasche fördert Erreger, die Sauerstoff brauchen, die anaerobe solche, die ohne Sauerstoff wachsen. Mehrere Sets erhöhen die Trefferquote.',
    'Hautkeime, die bei der Abnahme in die Flasche gelangen, führen zu einem falsch positiven Befund (Kontamination). Deshalb gründliche Desinfektion und keine Abnahme aus liegenden Zugängen ohne Anordnung.',
  ],
  'pa.farben': [
    'Es gibt verschiedene Farbsysteme, z. B. nach Herstellern oder nach internationaler Norm. Was gleich bleibt, ist der Zusatz im Röhrchen: Er steht auf dem Etikett.',
    'Im Zweifel am Etikett lesen statt nach Farbe greifen. Das gilt besonders bei Aushilfen auf fremden Stationen.',
  ],
  'pa.bz': [
    'Zucker an den Fingern, etwa nach dem Obstessen, erhöht den Wert stark. Alkohol kann das Messfeld beeinflussen und verdünnt den Tropfen, wenn er noch feucht ist.',
    'Seitlich an der Fingerbeere stechen ist weniger schmerzhaft als mittig. Den ersten Tropfen wegwischen, wenn der Hausstandard es vorsieht. Messgeräte werden regelmäßig mit Kontrolllösung geprüft.',
  ],
  'bga.schritte': [
    'Der Körper hält den pH-Wert des Blutes eng zwischen 7,35 und 7,45. Zwei Systeme steuern: die Lunge über das Abatmen von Kohlendioxid (schnell, Minuten) und die Niere über Bikarbonat und Säureausscheidung (langsam, Tage).',
    'pCO₂ steht für die Atmung: Viel CO₂ macht sauer, wenig macht basisch. HCO₃⁻ (Bikarbonat) steht für den Stoffwechsel: Viel macht basisch, wenig sauer. Normwerte etwa pCO₂ 35 bis 45 mmHg, HCO₃⁻ 22 bis 26 mmol/l.',
  ],
  'bga.copd': [
    'Bei COPD mit chronisch hohem CO₂ kann zu viel Sauerstoff den Atemantrieb senken und das Verhältnis von Belüftung und Durchblutung in der Lunge verschieben. Das CO₂ steigt weiter, die Person wird schläfrig bis bewusstlos.',
    'Pflegerisch heißt das: Sauerstoff nach dem angeordneten Zielbereich steuern, Bewusstsein und Atmung beobachten. Sauerstoff wird bei Atemnot trotzdem nie vorenthalten, sondern angepasst.',
  ],
  'bga.copd-chron': [
    'Die Niere braucht Tage, um auf eine Atemstörung zu reagieren. Ein hohes Bikarbonat bei hohem CO₂ und normalem pH zeigt deshalb, dass die Störung schon länger besteht.',
    'Für diese Menschen ist ein erhöhtes CO₂ der gewohnte Zustand. Gefährlich wird es, wenn bei einem Infekt das CO₂ noch weiter steigt und der pH abfällt (akut auf chronisch).',
  ],
  'bga.panik': [
    'Das Kribbeln und die Pfötchenstellung der Hände entstehen, weil bei Alkalose mehr Calcium an Eiweiß gebunden wird. Das freie Calcium sinkt, Nerven werden übererregbar.',
    'Rückatmung in eine Tüte wird nicht mehr empfohlen, weil sie bei anderen Ursachen (z. B. Lungenembolie) gefährlich ist. Ruhige Anleitung zum langsamen Ausatmen hilft meist.',
  ],
  'bga.dka': [
    'Die Kussmaul-Atmung ist tief und regelmäßig. Sie bläst CO₂ ab, um die Säure auszugleichen. Die Ausatemluft kann nach Aceton (Nagellackentferner, faules Obst) riechen.',
    'Behandelt wird mit Flüssigkeit, Insulin und Kaliumersatz. Ohne Insulin kann der Körper Zucker nicht verwerten und baut weiter Fett zu Ketonkörpern ab.',
  ],
  'bga.erbrechen': [
    'Magensaft enthält Salzsäure. Wer viel davon erbricht, verliert Säure und Chlorid, das Blut wird basischer. Oft fehlen zusätzlich Kalium und Flüssigkeit.',
    'Auch Diuretika und Kaliummangel können eine metabolische Alkalose fördern. Behandelt wird meist mit Flüssigkeit, Elektrolyten und der Ursache.',
  ],
  'bga.sepsis': [
    'Laktat entsteht, wenn Zellen ohne ausreichend Sauerstoff Energie gewinnen müssen. Bei Sepsis ist die Durchblutung kleiner Gefäße gestört, das Laktat steigt.',
    'Ein Laktat über 2 mmol/l bei Infektion gehört zu den Warnzeichen. Der Verlauf unter Behandlung zeigt, ob der Kreislauf sich erholt.',
  ],
  'bga.opiat': [
    'Bei akuter Hypoventilation steigt das CO₂ sofort. Das Bikarbonat ist noch normal, weil die Niere Tage zum Ausgleich braucht. Ein normales HCO₃⁻ zeigt deshalb, dass das Problem neu ist.',
    'Erste Schritte: Ansprechen, Atemweg sichern, Atmung unterstützen, Notruf. Ärztlich kann Naloxon gegeben werden, danach weiter überwachen, weil viele Opioide länger wirken als Naloxon.',
  ],
  'bga.normal': [
    'Normwerte arteriell (etwa): pH 7,35 bis 7,45, pCO₂ 35 bis 45 mmHg, HCO₃⁻ 22 bis 26 mmol/l, pO₂ 75 bis 100 mmHg, Base Excess −2 bis +2 mmol/l. Im Alter sinkt der pO₂ physiologisch etwas.',
    'Eine Ausgangs-BGA vor einer Operation dient als Vergleich, falls später Atem- oder Stoffwechselprobleme auftreten.',
  ],
  'bga.kompensation': [
    'Kompensation ist der Gegenzug der anderen Seite: Bei einer Atemstörung reagiert der Stoffwechsel, bei einer Stoffwechselstörung die Atmung. Sie verringert die pH-Verschiebung, schießt aber nicht über.',
    'Liegen beide Seiten gegen den pH verschoben (z. B. CO₂ hoch und HCO₃⁻ niedrig), handelt es sich nicht um Kompensation, sondern um eine gemischte Störung.',
  ],
  'bga.arteriell': [
    'Raumluft hat einen hohen Sauerstoff- und fast keinen CO₂-Gehalt. Luftblasen in der Probe ziehen deshalb den pO₂ in Richtung Raumluft und senken den pCO₂.',
    'Vor einer arteriellen Punktion am Handgelenk prüft man ärztlich oft mit dem Allen-Test, ob die Hand auch über die Elle versorgt wird. Danach mehrere Minuten fest komprimieren, besonders unter Gerinnungshemmern.',
  ],
  'bf.kritisch': [
    'Kritische Werte (Alarmwerte) sind Befunde, die sofort lebensbedrohlich sein können, etwa ein sehr hohes Kalium oder ein sehr niedriger Blutzucker. Das Labor meldet sie telefonisch, um Zeit zu sparen.',
    'Das Zurücklesen ist eine Form der geschlossenen Kommunikation (Closed Loop). Es gehört auch bei mündlichen Anordnungen zum sicheren Umgang.',
  ],
  'bf.crp': [
    'CRP-Spitzenwerte werden meist nach 2 bis 3 Tagen erreicht. Procalcitonin steigt früher und spricht stärker für eine bakterielle Infektion, wird aber nicht überall bestimmt.',
    'Für die Pflege zählen in den ersten Stunden die Vitalzeichen und der klinische Eindruck: Fieberverlauf, Atemfrequenz, Bewusstsein, Blutdruck.',
  ],
  'bf.laktat': [
    'Sepsis ist eine lebensbedrohliche Organfunktionsstörung durch eine fehlgesteuerte Reaktion auf eine Infektion. Als schnelles Warnzeichen dient z. B. der qSOFA: Atemfrequenz ab 22, systolischer Blutdruck bis 100 mmHg, veränderter Bewusstseinszustand.',
    'Jede Stunde Verzögerung bis zur Antibiotikagabe verschlechtert die Überlebenschancen. Blutkulturen werden möglichst vorher abgenommen, aber die Therapie wird deshalb nicht lange verschoben.',
  ],
  'bf.kalium-insulin': [
    'Insulin aktiviert die Natrium-Kalium-Pumpe in den Zellen, Kalium wandert mit Glukose aus dem Blut in die Zellen. Bei Ketoazidose ist der Gesamtkörperbestand an Kalium oft niedrig, auch wenn der Blutwert anfangs normal oder hoch wirkt.',
    'Dieser Effekt wird bei gefährlich hohem Kalium therapeutisch genutzt: Insulin mit Glukose senkt den Wert vorübergehend.',
  ],
  'bf.km': [
    'Jodhaltiges Kontrastmittel wird über die Niere ausgeschieden. Bei eingeschränkter Nierenfunktion kann es eine kontrastmittelinduzierte Nierenschädigung auslösen. Ausreichend Flüssigkeit vor und nach der Untersuchung schützt.',
    'Metformin wird bei eingeschränkter Nierenfunktion und jodhaltigem Kontrastmittel häufig pausiert, weil sonst eine Laktatazidose droht. Das entscheidet die Ärztin nach Nierenwert.',
  ],
  'bf.ddimer': [
    'D-Dimere sind Spaltprodukte, die beim Abbau von Gerinnseln entstehen. Sie sind nach Operationen, bei Entzündungen, Tumoren, in der Schwangerschaft und im Alter oft erhöht.',
    'Ein normaler Wert macht eine Thrombose oder Lungenembolie bei niedriger Wahrscheinlichkeit sehr unwahrscheinlich (hoher negativer Vorhersagewert). Ein erhöhter Wert beweist nichts.',
  ],
  'bf.troponin': [
    'Troponin ist ein Eiweiß aus dem Herzmuskel. Es gelangt ins Blut, wenn Herzmuskelzellen geschädigt werden. Hochsensitive Tests erkennen schon kleine Anstiege nach wenigen Stunden.',
    'Bestimmte Formen des Herzinfarkts (STEMI) erkennt man am EKG, ohne auf das Troponin zu warten. Deshalb wird bei Brustschmerz sofort ein EKG geschrieben.',
  ],
  'bf.ntprobnp': [
    'NT-proBNP wird von gedehnten Herzkammern freigesetzt. Je stärker die Kammer überlastet ist, desto höher der Wert. Er ist auch bei Niereninsuffizienz und im Alter höher.',
    'Eine schnelle Gewichtszunahme bei Herzinsuffizienz ist meist Wasser, nicht Fett. Sie kündigt eine Verschlechterung oft vor der Atemnot an.',
  ],
  'bf.hb': [
    'Nach Operationen sinkt das Hb auch durch Infusionen (Verdünnung). Ein starker Abfall zusammen mit Kreislaufzeichen (Puls steigt, Blutdruck sinkt) spricht eher für eine Blutung.',
    'Ob transfundiert wird, hängt nicht nur vom Hb ab, sondern auch von Beschwerden und Vorerkrankungen. Bei einer Transfusion gelten besondere Sicherheitsregeln (Bedside-Test, Überwachung).',
  ],
  'bf.krea-anstieg': [
    'Kreatinin entsteht im Muskel und wird über die Niere ausgeschieden. Es steigt erst, wenn ein großer Teil der Nierenfunktion ausgefallen ist. Bei Menschen mit wenig Muskelmasse kann ein normales Kreatinin eine eingeschränkte Funktion verbergen.',
    'Häufige Auslöser einer akuten Nierenschädigung sind Flüssigkeitsmangel, Sepsis, Kontrastmittel und Medikamente wie NSAR, bestimmte Antibiotika oder die Kombination aus ACE-Hemmer und Diuretikum.',
  ],
  'bf.kalium-niere': [
    'Bei Hyperkaliämie zeigt das EKG typische Veränderungen (hohe, spitze T-Wellen). Bei sehr hohen Werten drohen Kammerflimmern oder Herzstillstand.',
    'Kaliumreich sind zum Beispiel Bananen, Trockenobst, Kartoffeln, Nüsse und Säfte. Ernährungsempfehlungen bei Niereninsuffizienz gibt die Ärztin oder Ernährungsberatung.',
  ],
  'bf.hba1c': [
    'Zielwerte werden individuell festgelegt. Bei älteren, gebrechlichen Menschen liegt das Ziel oft höher (z. B. bis 8 %), weil Unterzuckerungen für sie gefährlicher sind als etwas höhere Werte.',
    'Bei Anämie oder nach Bluttransfusion ist der HbA1c weniger aussagekräftig, weil sich die Lebensdauer der roten Blutkörperchen verändert.',
  ],
  'bf.keton': [
    'Typisch für die Ketoazidose sind Durst, viel Wasserlassen, Übelkeit, Bauchschmerzen und eine schnelle Verschlechterung. Sie tritt vor allem bei Typ-1-Diabetes auf, etwa bei vergessenem Insulin oder Infekten.',
    'Bei Typ-2-Diabetes droht eher das hyperosmolare Koma: sehr hohe Blutzucker, starke Austrocknung, aber kaum Ketone. Auch dabei ist der Flüssigkeitsmangel lebensgefährlich.',
  ],
  'pa.fluegel': [
    "Flügelkanülen werden bei schwierigen oder dünnen Venen genutzt. Der Schlauch enthält einige Zehntelmilliliter Luft, die das erste Vakuumröhrchen ansaugt.",
    "Bei Blutkulturen mit Flügelkanüle kommt deshalb die aerobe Flasche zuerst: so landet die Luft aus dem Schlauch nicht in der anaeroben Flasche.",
  ],
  'pa.mischen': [
    "Jeder Zusatz muss sich sofort mit dem Blut verbinden. Die Herstellerangaben nennen meist fünf bis zehn Mal Schwenken.",
    "Kleine Gerinnsel im EDTA-Röhrchen verbrauchen Thrombozyten: der Befund zeigt dann eine falsch niedrige Thrombozytenzahl.",
  ],
  'pa.faust': [
    "Bei Muskelarbeit strömt Kalium aus den Muskelzellen ins Blut. Zusammen mit langem Stauen ist das eine häufige Ursache scheinbar hoher Kaliumwerte.",
    "Ein unerwartet hoher Kaliumwert ohne Hämolyse sollte deshalb immer auch an die Abnahmetechnik denken lassen, bevor behandelt wird.",
  ],
  'pa.beschriften': [
    "Viele Häuser nutzen Barcode-Etiketten und mobile Scanner am Bett. Das senkt Verwechslungen, ersetzt aber nicht die offene Frage nach Name und Geburtsdatum.",
    "Proben ohne eindeutige Zuordnung werden vom Labor nicht bearbeitet. Eine Neuentnahme ist unangenehm, aber sicherer als ein vertauschter Befund.",
  ],
  'pa.nuechtern': [
    "Auch Kaffee, Rauchen und körperliche Anstrengung können Werte verändern. Deshalb finden Routineabnahmen meist morgens vor dem Frühstück statt.",
    "Bei Menschen mit Diabetes muss die Nüchternphase mit der Insulingabe abgestimmt sein, sonst droht eine Unterzuckerung.",
  ],
  'bga.niere': [
    "Die gesunde Niere scheidet täglich Säuren aus und bildet neues Bikarbonat. Fällt sie aus, sammeln sich Säuren an: metabolische Azidose.",
    "Die Lunge kompensiert durch schnelleres und tieferes Atmen. Gleichzeitig steigt oft das Kalium, weil Säure Kalium aus den Zellen verdrängt.",
  ],
  'bga.diuretika': [
    "Schleifen- und Thiaziddiuretika führen zu Verlusten von Wasser, Chlorid und Kalium. Die Niere hält im Gegenzug Bikarbonat zurück.",
    "Die Lunge kompensiert eine Alkalose durch flachere Atmung, das CO₂ steigt leicht. Diese Kompensation ist begrenzt, weil der Körper Sauerstoff braucht.",
  ],
  'bga.po2': [
    "Der pO₂ zeigt, wie viel Sauerstoff im arteriellen Blut gelöst ist. Die Sättigung (SpO₂) hängt über die Sauerstoffbindungskurve davon ab.",
    "Die Kurve ist oben flach und fällt unter etwa 60 mmHg steil: kleine Verschlechterungen führen dann zu großen Sättigungsabfällen.",
  ],
  'bga.laktat': [
    "Laktat entsteht, wenn Zellen ohne genug Sauerstoff Energie gewinnen müssen. Erhöhte Werte sind ein Zeichen, dass Gewebe zu wenig durchblutet ist.",
    "In Sepsis-Leitlinien wird Laktat zu Beginn und im Verlauf gemessen. Ein fallender Wert spricht für eine bessere Gewebedurchblutung.",
  ],
  'bf.verlauf-hb': [
    "Im Kumulativbefund stehen die Werte mehrerer Tage nebeneinander. So erkennt man Trends, die ein einzelner Wert nicht zeigt.",
    "Harnstoff steigt bei oberer GI-Blutung oft an, weil das Blut im Darm wie Eiweiß verdaut wird. Das Kreatinin bleibt dabei oft gleich.",
  ],
  'bf.natrium': [
    "Natrium bestimmt, wie Wasser zwischen Zellen und Blut verteilt ist. Sinkt es, strömt Wasser in die Zellen, besonders gefährlich im Gehirn.",
    "Häufige Ursachen im Alter sind Diuretika, Antidepressiva und Herz- oder Niereninsuffizienz. Verwirrtheit, Stürze und Übelkeit können frühe Zeichen sein.",
  ],
  'bf.thrombo': [
    "HIT ist eine Immunreaktion gegen Heparin, die typischerweise 5 bis 14 Tage nach Beginn auftritt. Paradoxerweise führt sie nicht zu Blutungen, sondern zu Thrombosen.",
    "Deshalb werden Thrombozyten unter Heparin regelmäßig kontrolliert. Ein Abfall um mehr als die Hälfte ist ein Warnzeichen.",
  ],
  'bf.inr': [
    "Der INR misst, wie stark die Gerinnung durch Vitamin-K-Antagonisten gehemmt ist. Viele Medikamente und Nahrungsmittel mit Vitamin K verändern den Wert.",
    "Bei erhöhtem INR sind Stürze, Injektionen in den Muskel und Rasur mit Klinge riskant. Blutungszeichen: Hämatome, Nasenbluten, roter oder schwarzer Stuhl, Blut im Urin.",
  ],
  'bf.glukose-hypo': [
    "Typische Zeichen einer Hypoglykämie sind Schwitzen, Zittern, Heißhunger, Herzklopfen, Verwirrtheit bis zur Bewusstlosigkeit. Bei älteren Menschen sind die Zeichen oft weniger deutlich.",
    "Nach der Gabe von Kohlenhydraten wird nach etwa 15 Minuten nachgemessen. Bei Bewusstlosigkeit gibt ärztliches Personal Glukose in die Vene.",
  ],
  'bf.rueckruf': [
    "Kritische Werte (Panikwerte) sind Grenzen, ab denen sofort gehandelt werden muss. Jedes Labor hat eine eigene Liste, etwa für Kalium, Natrium, Glukose oder Hb.",
    "Die Meldung an die Ärztin oder den Arzt folgt am besten dem SBAR-Schema: Situation, Hintergrund, Einschätzung, Empfehlung.",
  ],
  'bf.pct': [
    "Procalcitonin ist eine Vorstufe eines Hormons, das bei bakteriellen Infektionen im ganzen Körper gebildet wird. Es steigt nach wenigen Stunden.",
    "Auch nach großen OPs, Verbrennungen oder Traumen kann PCT steigen, ohne dass eine Infektion vorliegt. Deshalb zählt immer das Gesamtbild.",
  ],
};
