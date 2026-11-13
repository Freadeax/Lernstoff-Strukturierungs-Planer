// „Mehr verstehen“ im Expertenstandards-Trainer.
// Grundlage: veröffentlichte Expertenstandards des DNQP (jeweils aktuelle Aktualisierung). Ohne Beleg aus eigenem Material;
// maßgeblich ist die Fassung, die in Schule und Einrichtung gilt.

import { ERWEITERUNG_VERTIEFUNG } from './erweiterung';

export const VERTIEFUNG: Record<string, string[]> = {
  ...ERWEITERUNG_VERTIEFUNG,
  'aufbau.ebene.wissen': [
    'Jede Standardaussage hat eine Begründung und darunter drei Spalten: Struktur (S), Prozess (P) und Ergebnis (E), nummeriert von 1 bis meist 5 oder 6. S1, P1 und E1 gehören inhaltlich zusammen.',
    'Die Gliederung geht auf das Qualitätsmodell von Avedis Donabedian zurück: Gute Strukturen machen gute Prozesse möglich, gute Prozesse führen zu guten Ergebnissen.',
  ],
  'aufbau.ebene.hilfsmittel': [
    'Strukturkriterien richten sich oft an die Einrichtung: Sie muss Fortbildung, Material, Zeit und schriftliche Regelungen bereitstellen. Die einzelne Pflegefachkraft kann sie einfordern, aber nicht allein erfüllen.',
    'In Qualitätsprüfungen werden Strukturkriterien zum Beispiel über Fortbildungsnachweise, Verfahrensanweisungen und vorhandene Hilfsmittel geprüft.',
  ],
  'aufbau.ebene.einschaetzung': [
    'Typische Verben in Prozesskriterien sind „schätzt ein“, „plant“, „berät“, „führt durch“, „überprüft“. Sie bilden den Pflegeprozess ab: Einschätzung, Planung, Durchführung, Evaluation.',
    'Bei Veränderungen erneut einschätzen heißt zum Beispiel nach einem Sturz, nach einer Operation, bei neuen Medikamenten oder einer akuten Erkrankung.',
  ],
  'aufbau.ebene.beratung': [
    'Information, Schulung und Beratung (Edukation) sind in fast allen Expertenstandards ein eigener Prozessschritt. Ziel ist, dass Betroffene und Angehörige selbst handeln können.',
    'Beratung ist mehr als Information: Sie geht von den Fragen und der Situation der Person aus und sucht mit ihr nach einer passenden Lösung.',
  ],
  'aufbau.ebene.dokumentiert': [
    'Ergebniskriterien beschreiben nachprüfbare Zustände. Manche liegen in der Dokumentation (Einschätzung liegt vor), andere beim Menschen (kein Dekubitus entstanden).',
    'Eine aktuelle Einschätzung heißt: Sie spiegelt die heutige Situation. Eine Einschätzung bei Aufnahme reicht nicht mehr, wenn sich der Zustand verändert hat.',
  ],
  'aufbau.ebene.schmerzarm': [
    'Ergebniskriterien beim Menschen zeigen, ob die Pflege wirkt. Sie sind die Grundlage für die Evaluation im Pflegeprozess.',
    'Eine stabile Schmerzsituation beschreibt die betroffene Person selbst: Die Schmerzen sind für sie akzeptabel und erlauben ihr die Aktivitäten, die ihr wichtig sind.',
  ],
  'aufbau.ebene.verfahren': [
    'Verfahrensregeln legen fest, wer was wann macht, etwa im Entlassungsmanagement die Zusammenarbeit von Pflege, Ärzten, Sozialdienst und Therapie. Sie sind Struktur, weil sie den Rahmen schaffen.',
    'Merkhilfe: Fragt das Kriterium „Was ist vorhanden?“ → Struktur. „Was tut die Pflegefachkraft?“ → Prozess. „Was ist erreicht oder nachweisbar?“ → Ergebnis.',
  ],
  'aufbau.entwicklung': [
    'Die Konsensus-Konferenz ist öffentlich: Pflegefachleute aus Praxis, Wissenschaft und Verbänden diskutieren den Entwurf. Erst danach wird der Standard in Einrichtungen erprobt und auf Praxistauglichkeit geprüft.',
    'Bei der Aktualisierung prüft eine Expertengruppe die neue Literatur. Deshalb gibt es von älteren Standards mehrere Fassungen (z. B. Dekubitusprophylaxe 2000, 2010, 2017).',
  ],
  'aufbau.dnqp': [
    'Das DNQP arbeitet seit den 1990er-Jahren an der Hochschule Osnabrück und entwickelt seit 1999 Expertenstandards mit dem Deutschen Pflegerat. Aktuell sind es zehn: Dekubitusprophylaxe, chronische Wunden, Entlassungsmanagement, Ernährungsmanagement, Schmerzmanagement, Beziehungsgestaltung bei Demenz, Sturzprophylaxe, Mundgesundheit, Kontinenzförderung und Hautintegrität.',
    'Der frühere § 113a SGB XI sah vor, Expertenstandards für Pflegeeinrichtungen verbindlich einzuführen. Der dafür entwickelte Standard zur Mobilität (2014, aktualisiert 2020) wurde nie in Kraft gesetzt, und der Paragraf wurde zum 1. Juli 2023 aufgehoben (PUEG).',
  ],
  'aufbau.bedeutung': [
    'Expertenstandards sind keine Gesetze, gelten aber als vorweggenommenes Sachverständigengutachten. Gerichte orientieren sich daran, was eine sorgfältige Pflegefachkraft wissen und tun musste.',
    'Nach § 11 SGB XI müssen Pflegeeinrichtungen nach dem allgemein anerkannten Stand medizinisch-pflegerischer Erkenntnisse pflegen. Expertenstandards konkretisieren diesen Stand.',
  ],
  'prophylaxe.dekubitus-skala': [
    'Ein Screening ist eine kurze Vorprüfung: Ist die Person in ihrer Mobilität eingeschränkt? Wenn ja, folgt eine differenzierte Einschätzung mit Hautinspektion, Beweglichkeit, Feuchtigkeit, Ernährung und Durchblutung.',
    'Skalen wie Braden, Norton oder Waterlow haben sich als nicht genauer erwiesen als die fachliche Einschätzung. Sie können aber helfen, an alle Risikofaktoren zu denken.',
  ],
  'prophylaxe.dekubitus-massnahme': [
    'Der Druck ist der Hauptfaktor: Er drückt kleine Gefäße zu, das Gewebe bekommt keinen Sauerstoff. Wie lange Haut das aushält, ist individuell. Deshalb gibt es kein festes Zeitintervall, sondern einen Plan nach Hautzustand.',
    'Bei Massage wird gefährdetes Gewebe zusätzlich gequetscht, Eis und Föhn schädigen die Haut durch Temperaturwechsel. Fersen werden am besten frei gelagert, nicht nur gepolstert.',
  ],
  'prophylaxe.fingertest': [
    'Bei einer wegdrückbaren Rötung kehrt das Blut nach dem Loslassen zurück: Die Kapillaren sind noch intakt. Bei Kategorie 1 sind sie bereits geschädigt, Blut ist ins Gewebe ausgetreten.',
    'Bei dunkler Haut ist eine Rötung schwer zu sehen. Dann helfen Temperatur, Konsistenz (verhärtet, teigig) und Schmerz an der Stelle. Alternativ kann der Test mit einem durchsichtigen Spatel gemacht werden.',
  ],
  'prophylaxe.sturz-skala': [
    'Sturzrisikoskalen sagen Stürze nur unzuverlässig voraus. Wichtiger ist die Frage: Welche Risikofaktoren hat diese Person, und welche davon lassen sich beeinflussen?',
    'Personenbezogene Faktoren sind z. B. Gang- und Balancestörungen, Sehstörungen, Inkontinenz, kognitive Einschränkungen, Sturzangst und frühere Stürze. Dazu kommen Medikamente (z. B. Schlafmittel, Blutdrucksenker) und Umgebungsfaktoren.',
  ],
  'prophylaxe.sturz-massnahmen': [
    'Kraft- und Balancetraining gehört zu den wirksamsten Maßnahmen, wenn es regelmäßig über Wochen erfolgt. Auch Hüftprotektoren können bei hohem Risiko Frakturen verhindern.',
    'Nach einem Sturz wird die Situation analysiert: Wann, wo, wie, mit welchen Folgen? Daraus ergeben sich gezielte Anpassungen. Auch Sturzangst wird angesprochen, weil sie zu Bewegungsmangel führt.',
  ],
  'prophylaxe.ernaehrung': [
    'Screening-Instrumente sind z. B. MNA (Mini Nutritional Assessment) oder MUST. Sie fragen nach Gewichtsverlust, Essmenge, Erkrankung und BMI.',
    'Mangelernährung ist im Krankenhaus und Pflegeheim häufig und verschlechtert Wundheilung, Muskelkraft, Abwehr und Sturzrisiko. Sie wird oft übersehen, gerade bei übergewichtigen Menschen.',
  ],
  'prophylaxe.mangel-zeichen': [
    'Ein ungewollter Gewichtsverlust von mehr als 5 % in drei Monaten oder 10 % in sechs Monaten gilt als deutlicher Hinweis. Deshalb regelmäßig wiegen und den Verlauf dokumentieren.',
    'Hinter wenig Essen stecken oft lösbare Ursachen: Zahnprobleme, schlecht sitzende Prothese, Schluckstörung, Einsamkeit, fehlende Hilfe beim Essen oder Medikamente, die den Appetit dämpfen.',
  ],
  'versorgung.kontinenz.selbst-vorlage': [
    'Das Beispiel ist eine Belastungsinkontinenz: Urinverlust bei Druckerhöhung im Bauchraum (Husten, Niesen, Heben), weil der Verschluss nicht hält. Beckenbodentraining kann helfen.',
    'Kontinenzprofile beschreiben die Situation, nicht die Ursache. Sie zeigen, wie selbstständig jemand ist und wohin die Förderung gehen kann, etwa von „abhängig kompensiert“ zu „unabhängig kompensiert“.',
  ],
  'versorgung.kontinenz.toilettentraining': [
    'Begleitete Toilettengänge zu festen Zeiten (Toilettentraining) oder nach dem individuellen Ausscheidungsmuster sind wirksame Maßnahmen, vor allem bei Menschen mit kognitiven Einschränkungen.',
    'Ein Miktionsprotokoll über einige Tage zeigt das persönliche Muster. Daraus lassen sich passende Zeiten ableiten.',
  ],
  'versorgung.kontinenz.selbst-zeiten': [
    'Erreichte Kontinenz heißt: Es geht kein Urin unwillkürlich verloren, aber nur mit Maßnahmen wie festen Zeiten, Medikamenten oder Hilfsmitteln zum Toilettengang. Ohne diese Maßnahmen wäre die Person inkontinent.',
    'Volle Kontinenz bedeutet dagegen, dass gar keine Maßnahmen nötig sind.',
  ],
  'versorgung.kontinenz.pflege-wechselt': [
    'Dranginkontinenz: plötzlicher, starker Harndrang, bevor die Toilette erreicht ist. Ursache ist eine überaktive Blase. Kurze Wege, gut erreichbare Toilette, schnell zu öffnende Kleidung und Blasentraining helfen.',
    'Auch bei kompensierter Inkontinenz bleibt das Ziel, Kontinenz zu fördern. Hilfsmittel sind eine Ergänzung, keine Endlösung.',
  ],
  'versorgung.kontinenz.kein-hilfsmittel': [
    'Ablehnung hat oft Gründe: Scham, Unwissen über diskrete Produkte, schlechte Erfahrungen. Ein vertrauliches Gespräch und Beratung über Alternativen respektieren die Selbstbestimmung.',
    'Nicht kompensierte Inkontinenz gefährdet Haut (inkontinenzassoziierte Dermatitis) und soziale Teilhabe. Die Person entscheidet trotzdem selbst, die Beratung wird dokumentiert.',
  ],
  'versorgung.schmerz-einschaetzung': [
    'Die Numerische Rating-Skala (NRS) reicht von 0 (kein Schmerz) bis 10 (stärkster vorstellbarer Schmerz). Für Kinder oder Menschen mit leichten kognitiven Einschränkungen eignen sich Gesichterskalen oder die Verbale Rating-Skala.',
    'Schmerz ist subjektiv: Was jemand angibt, gilt. Ein Mensch kann lächeln und trotzdem starke Schmerzen haben. Schmerz wird in Ruhe und bei Belastung erfragt.',
  ],
  'versorgung.schmerz-wirkung': [
    'Die Zeit bis zur Kontrolle hängt von der Gabe ab: bei Infusion früher, bei Tabletten meist nach etwa 30 bis 60 Minuten. Der Standard verlangt die Überprüfung, nicht eine feste Minutenzahl.',
    'Bei Opioiden wird Obstipation fast immer erwartet, deshalb wird oft gleich ein Abführmittel mit angeordnet. Müdigkeit und Atemdämpfung müssen besonders zu Beginn beobachtet werden.',
  ],
  'versorgung.wunde-chronisch': [
    'Chronische Wunden haben fast immer eine Grunderkrankung: Druck (Dekubitus), Venenschwäche oder Arterienverschluss (Ulcus cruris), Diabetes mit Nervenschäden (diabetisches Fußulkus). Ohne Behandlung der Ursache heilen sie nicht.',
    'Beim venösen Ulcus ist die Kompressionstherapie zentral, beim arteriellen ist starke Kompression gefährlich. Die Ursache muss deshalb ärztlich geklärt sein.',
  ],
  'versorgung.wunde-lebensqualitaet': [
    'Menschen mit chronischen Wunden leiden oft stärker unter Schmerzen, Geruch, Exsudat und sozialem Rückzug als unter der Wunde selbst. Das wird mit Instrumenten wie dem Wound-QoL erfasst.',
    'Selbstmanagement heißt zum Beispiel: Kompressionsstrümpfe anziehen, Füße täglich kontrollieren, Verband trocken halten, Warnzeichen erkennen.',
  ],
  'versorgung.entlassung': [
    'Ein initiales Assessment fragt nach Selbstversorgung, häuslicher Situation, Angehörigen und Hilfsmitteln. Bei erkennbarem Bedarf folgt ein differenziertes Assessment und ein individueller Entlassungsplan.',
    'Die erste Einschätzung erfolgt innerhalb von 24 Stunden nach Übernahme, spätestens 24 Stunden vor der Entlassung wird überprüft, ob alles organisiert ist. 48 bis 72 Stunden nach der Entlassung wird nachgefragt, ob die Versorgung klappt.',
  ],
  'versorgung.demenz': [
    'Tom Kitwood beschrieb psychische Grundbedürfnisse von Menschen mit Demenz: Trost, Bindung, Einbeziehung, Beschäftigung und Identität. Werden sie nicht erfüllt, zeigt sich das oft als herausforderndes Verhalten.',
    'Herausforderndes Verhalten ist aus dieser Sicht eine Form von Kommunikation. Der Standard arbeitet dafür mit der Verstehenshypothese: einer begründeten Annahme, was die Person erlebt und braucht. Den Umgang mit herausforderndem Verhalten selbst regelt er (Fassung 2018/2019) nicht.',
  ],
};
