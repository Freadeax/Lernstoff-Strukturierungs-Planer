// „Mehr verstehen“ im Normwerte-Trainer: Was hinter einem Wert steckt und was Pflege daraus macht.
// Übliche Lehrbuch-Richtwerte; maßgeblich bleiben Referenzbereich des Labors und ärztliche Zielwerte.

import { ERWEITERUNG_VERTIEFUNG } from './erweiterung';

export const VERTIEFUNG: Record<string, string[]> = {
  ...ERWEITERUNG_VERTIEFUNG,
  'vital.puls': [
    'Beim Pulsmessen zählt nicht nur die Frequenz, sondern auch Rhythmus (regelmäßig oder unregelmäßig) und Qualität (kräftig, schwach, fadenförmig). Ein unregelmäßiger Puls wird eine volle Minute gezählt.',
    'Bei Vorhofflimmern kann der am Handgelenk getastete Puls niedriger sein als die Herzfrequenz am Herzen (Pulsdefizit), weil nicht jeder Schlag genug Blut auswirft.',
  ],
  'vital.atmung': [
    'Die Atemfrequenz wird unauffällig gezählt, zum Beispiel während man den Puls tastet. Wer weiß, dass seine Atmung beobachtet wird, atmet anders.',
    'Neben der Frequenz zählen Tiefe, Rhythmus, Geräusche und Atemarbeit. Eine Atemfrequenz über 20 kann einer Verschlechterung um Stunden vorausgehen, wird aber am häufigsten nicht gemessen.',
  ],
  'vital.rr': [
    'Richtig messen: nach etwa 5 Minuten Ruhe im Sitzen, Arm auf Herzhöhe, passende Manschettengröße. Eine zu kleine Manschette misst falsch hoch.',
    'Bluthochdruck macht lange keine Beschwerden, schädigt aber Gefäße, Herz, Nieren und Gehirn. Er ist ein Hauptrisikofaktor für Schlaganfall und Herzinfarkt.',
  ],
  'vital.temp': [
    'Fieber ist eine gesteuerte Erhöhung des Sollwerts im Temperaturzentrum (Hypothalamus), meist durch Entzündungsbotenstoffe. Im Fieberanstieg friert der Mensch und hat Schüttelfrost, im Abfall schwitzt er.',
    'Ältere und immungeschwächte Menschen entwickeln bei Infektionen oft kein hohes Fieber. Verwirrtheit oder Schwäche können dann das einzige Zeichen sein.',
  ],
  'vital.spo2': [
    'Das Pulsoxymeter misst über Licht, wie viel Hämoglobin Sauerstoff trägt. Kalte Finger, Nagellack, Bewegung und schlechte Durchblutung verfälschen das Ergebnis.',
    'Bei einer Kohlenmonoxidvergiftung zeigt das Pulsoxymeter fälschlich gute Werte, weil es Kohlenmonoxid-Hämoglobin nicht unterscheiden kann.',
  ],
  'vital.wert.puls48': [
    'Ob eine Bradykardie gefährlich ist, entscheidet sich an den Folgen: Schwindel, Synkope, Blutdruckabfall, Verwirrtheit. Eine Sportlerin mit 48 und ohne Beschwerden ist anders zu bewerten als ein älterer Mensch mit Schwindel.',
    'Häufige Ursachen im Alter sind Medikamente (Betablocker, Digitalis, manche Antiarrhythmika) und Erregungsleitungsstörungen. Vor der nächsten Gabe solcher Medikamente wird ärztlich Rücksprache gehalten.',
  ],
  'vital.wert.af26': [
    'Eine schnelle Atmung kann auch Ausgleich sein: Bei einer Übersäuerung des Blutes (z. B. diabetische Ketoazidose) atmet der Körper verstärkt Kohlendioxid ab.',
    'Mit NEWS2 werden Atemfrequenz, Sauerstoffsättigung, Sauerstoffgabe, Blutdruck, Puls, Bewusstsein und Temperatur zu einem Punktwert zusammengefasst. Hohe Werte lösen eine schnellere ärztliche Einschätzung aus.',
  ],
  'vital.wert.temp369': [
    'Die Körpertemperatur schwankt im Tagesverlauf um etwa 0,5 bis 1 °C: morgens am niedrigsten, am späten Nachmittag am höchsten.',
    'Messorte liefern unterschiedliche Werte: rektal am höchsten, axillär am niedrigsten (etwa 0,5 °C darunter). Für den Verlauf möglichst immer am selben Ort messen und den Ort dokumentieren.',
  ],
  'vital.wert.rr90': [
    'Orthostatische Hypotonie: Beim Aufstehen sackt Blut in die Beine, der Kreislauf gleicht nicht schnell genug aus. Ein Abfall um mindestens 20 mmHg systolisch innerhalb von 3 Minuten gilt als auffällig.',
    'Vorbeugen: langsam aufsetzen, an der Bettkante Beine bewegen, ausreichend trinken. Risikofaktoren sind Blutdrucksenker, Diuretika, Flüssigkeitsmangel und lange Bettruhe.',
  ],
  'labor.bz': [
    'Der HbA1c-Wert zeigt den durchschnittlichen Blutzucker der letzten etwa 8 bis 12 Wochen, weil Zucker sich an rote Blutkörperchen bindet. Ab 6,5 % spricht man von Diabetes.',
    'Umrechnung: mg/dl geteilt durch etwa 18 ergibt mmol/l. Auf Blutzuckermessgeräten ist die Einheit eingestellt, darauf beim Ablesen achten.',
  ],
  'labor.wert.bz55': [
    'Bei Unterzuckerung schüttet der Körper Adrenalin aus: Schwitzen, Zittern, Herzrasen und Heißhunger sind die Warnzeichen. Fehlt Zucker im Gehirn, kommen Verwirrtheit, Wesensänderung und Bewusstlosigkeit dazu.',
    'Betablocker können die Warnzeichen verschleiern. Bei bewusstlosen Menschen nichts in den Mund geben (Aspiration), sondern Notruf, ärztlich Glukose i. v. oder Glukagon.',
  ],
  'labor.kalium': [
    'Kalium liegt zu fast 98 % in den Zellen. Kleine Verschiebungen zwischen innen und außen verändern deshalb deutlich den Blutwert und die Erregbarkeit von Herz und Muskeln.',
    'Falsch hohe Werte entstehen bei der Blutentnahme, wenn Blutkörperchen zerstört werden (Hämolyse), etwa durch langes Stauen, Pumpen mit der Faust oder zu dünne Kanülen.',
  ],
  'labor.natrium': [
    'Natrium bestimmt, wohin Wasser im Körper verteilt wird. Bei zu wenig Natrium im Blut strömt Wasser in die Zellen, auch in die Hirnzellen: Kopfschmerz, Verwirrtheit, im Extremfall Krampfanfälle.',
    'Häufige Ursachen der Hyponatriämie im Alter sind Diuretika, bestimmte Antidepressiva und zu viel salzarme Flüssigkeit. Ein Mangel darf nur langsam ausgeglichen werden.',
  ],
  'labor.hb': [
    'Hämoglobin ist das sauerstofftragende Eiweiß in den roten Blutkörperchen. Bei Anämie bekommt das Gewebe weniger Sauerstoff, das Herz gleicht mit höherem Puls aus.',
    'Häufige Ursachen sind Eisenmangel (z. B. durch Blutverlust im Darm), chronische Erkrankungen und Niereninsuffizienz (Mangel an Erythropoetin). Teerstuhl ist ein Hinweis auf Blutung im oberen Verdauungstrakt.',
  ],
  'labor.leuko': [
    'Leukozyten sind die weißen Blutkörperchen der Abwehr. Erniedrigte Werte (Leukopenie), etwa nach Chemotherapie, bedeuten hohe Infektionsgefahr. Dann gelten oft besondere Schutzmaßnahmen (Umkehrisolierung).',
    'Auch Stress, Cortison und starke körperliche Belastung können die Leukozyten erhöhen, ohne dass eine Infektion vorliegt.',
  ],
  'labor.thrombo': [
    'Thrombozyten (Blutplättchen) verschließen kleine Gefäßverletzungen als Erstes. Petechien sind punktförmige Hautblutungen, die bei sehr niedrigen Werten auftreten.',
    'Medikamente wie ASS oder Clopidogrel hemmen die Funktion der Thrombozyten, ohne ihre Zahl zu senken. Die Blutungsneigung ist dann trotz normalem Wert erhöht.',
  ],
  'labor.wert.crp': [
    'Das C-reaktive Protein wird in der Leber gebildet, wenn im Körper eine Entzündung abläuft. Es steigt nach 6 bis 12 Stunden an. Ein normaler Wert ganz am Anfang schließt eine Infektion deshalb nicht aus.',
    'CRP ist unspezifisch: Auch nach Operationen, bei Rheuma oder Tumoren ist es erhöht. Wichtig ist der Verlauf, etwa ob es unter Antibiotika sinkt.',
  ],
  'labor.wert.kalium': [
    'Schleifendiuretika (z. B. Furosemid) und Thiaziddiuretika schwemmen mit dem Wasser auch Kalium aus. Kaliumsparende Diuretika oder ACE-Hemmer können es dagegen erhöhen.',
    'Kaliummangel verstärkt die Wirkung von Digitalis am Herzen, die Gefahr von Rhythmusstörungen steigt. Kaliumhaltige Infusionen nur langsam und nach Anordnung, nie als schnelle Injektion.',
  ],
  'ausscheidung.urin': [
    'Für die Beurteilung zählt neben der Menge auch das Aussehen: hell und klar bei guter Flüssigkeitszufuhr, dunkel und konzentriert bei Mangel, trüb und übelriechend eventuell bei Infektion, rot bei Blut.',
    'Bei Flüssigkeitsbilanz werden Ein- und Ausfuhr in 24 Stunden gegenübergestellt. Unsichtbare Verluste über Haut und Atmung betragen rund 800 bis 1.000 ml, bei Fieber mehr.',
  ],
  'ausscheidung.oligurie': [
    'Ursachen einer Oligurie lassen sich nach Ort einteilen: vor der Niere (zu wenig Blut, z. B. Flüssigkeitsmangel, Schock), in der Niere (Nierenschaden) oder nach der Niere (Abflusshindernis, z. B. Prostata, verstopfter Katheter).',
    'Ein Harnverhalt (volle Blase, kein Wasserlassen möglich) sieht aus wie Anurie, ist aber eine Abflussstörung. Ultraschall der Blase (Blasenscan) klärt das schnell.',
  ],
  'ausscheidung.stuhl': [
    'Die Bristol-Stuhlformen-Skala beschreibt Stuhl in sieben Typen von harten Kügelchen (Typ 1) bis flüssig (Typ 7). Typ 3 und 4 gelten als ideal.',
    'Warnzeichen: Blut im Stuhl, Teerstuhl, plötzliche Änderung der Stuhlgewohnheiten im Alter, Wechsel von Verstopfung und Durchfall. Diese Veränderungen werden ärztlich abgeklärt.',
  ],
  'ausscheidung.trinken': [
    'Ältere Menschen spüren Durst schlechter und haben weniger Körperwasser. Zusätzlich trinken viele aus Angst vor Inkontinenz oder nächtlichem Aufstehen bewusst wenig.',
    'Hinweise auf Exsikkose sind trockene Schleimhäute, stehende Hautfalten (bei Altershaut unzuverlässig), dunkler Urin, Verwirrtheit und Verstopfung. Ein Trinkprotokoll macht die tatsächliche Menge sichtbar.',
  ],
  'ausscheidung.wert.dk': [
    'Rechnung: 0,5 ml × 70 kg = 35 ml pro Stunde, mal 6 Stunden = 210 ml. Gemessen wurden 90 ml, also deutlich weniger als die Hälfte.',
    'Vor der Meldung prüfen: Ist der Katheter abgeknickt oder verstopft, hängt der Beutel richtig, ist die Blase prall? Dann Vitalzeichen und Trinkmenge mit melden, das erleichtert die ärztliche Einschätzung.',
  ],
  'ausscheidung.wert.urin': [
    'Die Perspiratio insensibilis ist die unmerkliche Wasserabgabe über Haut und Atemluft. Sie ist nicht messbar und wird in der Bilanz geschätzt.',
    'Dazu kommt Oxidationswasser aus dem Stoffwechsel (etwa 300 ml am Tag) und Wasser aus fester Nahrung. Eine Bilanz ist deshalb immer ein Näherungswert.',
  ],
};
