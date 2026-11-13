// „Mehr verstehen“ im Grundlagen-Trainer. Übliches Lehrbuchwissen zur medizinischen Terminologie;
// die Abkürzungsliste der Einrichtung geht vor.

import { PFLEGEBERUF_VERTIEFUNG } from './pflegeberuf';

export const VERTIEFUNG: Record<string, string[]> = {
  ...PFLEGEBERUF_VERTIEFUNG,
  'wort.zu.suffixe': [
    'Die meisten Bausteine stammen aus dem Griechischen oder Lateinischen. Griechische Stämme werden eher für Krankheiten und Eingriffe benutzt (Nephritis), lateinische eher für Anatomie (Arteria renalis).',
    'Vorsicht bei -ose: Arthrose ist Verschleiß, Thrombose ein Blutgerinnsel, Tuberkulose dagegen eine Infektion. Die Endung beschreibt oft nur „krankhafter Zustand“ ohne Entzündung als Hauptmerkmal.',
  ],
  'wort.zu.vorsilben': [
    'Viele Vitalzeichen-Begriffe sind so gebaut: Tachypnoe, Bradypnoe, Hypertonie, Hypotonie, Hyperthermie, Hypothermie. Wer die Vorsilben kennt, braucht für die Übergabe kaum neue Wörter.',
    'Hypo und Hyper werden beim Sprechen leicht verwechselt. In Übergaben deshalb den Wert dazu nennen („Hypoglykämie, BZ 52“), dann ist die Richtung eindeutig.',
  ],
  'wort.zu.staemme': [
    'Lateinische Organnamen tauchen vor allem in der Anatomie auf: Cor (Herz), Hepar (Leber), Ren (Niere), Ventriculus (Magen), Pulmo (Lunge), Cutis (Haut), Os (Knochen), Vesica (Blase).',
    'Zusammengesetzte Wörter verbinden mehrere Stämme mit einem Bindevokal, meist o: Gastr-o-enter-itis ist die Entzündung von Magen und Darm.',
  ],
  'wort.hepatitis': [
    'Eine Hepatitis kann durch Viren (Hepatitis A bis E), Alkohol, Medikamente oder das eigene Immunsystem entstehen. Typische Beobachtungen sind Müdigkeit, Gelbfärbung von Haut und Augen und dunkler Urin.',
    'Bei Virushepatitis B und C ist Blut der Übertragungsweg. Deshalb sind Schutzimpfung gegen Hepatitis B und sicherer Umgang mit Kanülen in der Pflege so wichtig.',
  ],
  'wort.cholezystektomie': [
    'Die Gallenblase wird heute meist minimalinvasiv mit einer Bauchspiegelung entfernt, abgekürzt lap. CHE (laparoskopische Cholezystektomie).',
    'Nach der Operation fließt die Galle direkt in den Darm. Sehr fette Mahlzeiten können in der ersten Zeit Durchfall oder Völlegefühl auslösen.',
  ],
  'wort.dyspnoe': [
    'Dyspnoe ist ein Gefühl, das die Person selbst beschreibt. Messbar wird sie über Atemfrequenz, Sättigung, Sprechen in Sätzen und den Einsatz der Atemhilfsmuskulatur.',
    'Orthopnoe heißt Atemnot im Liegen, die im Sitzen besser wird. Sie ist typisch für Herzinsuffizienz, weil im Liegen mehr Blut zum Herzen zurückfließt.',
  ],
  'wort.paerese': [
    'Nach einem Schlaganfall ist meist eine Hemiparese zu sehen. Pflegerisch wichtig sind Lagerung nach Bobath-Prinzipien, Schutz der betroffenen Schulter und Ansprechen von der betroffenen Seite.',
    'Die Endung -plegie kommt vom griechischen plēgē, Schlag. Paraplegie und Tetraplegie entstehen meist durch Verletzungen des Rückenmarks.',
  ],
  'wort.mehrfach': [
    'Im Englischen heißt die Lungenentzündung ebenfalls pneumonia. Ältere Begriffe wie Pneumonitis meinen eher Entzündungen ohne Erreger, etwa nach Bestrahlung.',
    'Bei einem Lipom ist -om gutartig. Bösartige Geschwülste heißen oft Karzinom (aus Deckgewebe) oder Sarkom (aus Binde- und Stützgewebe).',
  ],
  'wort.fall.arztbrief': [
    'Arztbriefe folgen meist einem festen Aufbau: Diagnosen, Anamnese, Befunde, Verlauf, Therapie, Empfehlungen. Für die Pflege sind Diagnosen, Medikation und Empfehlungen besonders wichtig.',
    'Pflegende dürfen nachfragen, wenn sie etwas nicht verstehen. Eine missverstandene Empfehlung kann in der Weiterversorgung mehr schaden als eine kurze Rückfrage beim Krankenhaus.',
  ],
  'lage.zu.paare': [
    'Alle Angaben beziehen sich auf die anatomische Grundstellung: aufrecht stehend, Arme hängend, Handflächen nach vorne. Deshalb bleibt ventral auch im Liegen „bauchwärts“.',
    'Anterior und posterior werden oft gleichbedeutend mit ventral und dorsal benutzt, superior und inferior mit kranial und kaudal.',
  ],
  'lage.zu.gliedmassen': [
    'Für den Handrücken sagt man dorsal, für den Fußrücken ebenfalls dorsal. Deshalb heißt das Anwinkeln des Fußes nach oben Dorsalextension und das Strecken nach unten Plantarflexion.',
    'Dexter und sinister stehen oft abgekürzt als re. und li. oder auf Englisch R und L, etwa auf Röntgenbildern.',
  ],
  'lage.radius': [
    'Am Unterarm liegt der Radius auf der Daumenseite, die Ulna (Elle) auf der Kleinfingerseite. Merkhilfe: Mit dem Daumen dreht man am Radio.',
    'Bei älteren Menschen mit Osteoporose bricht der distale Radius schon bei leichten Stürzen. Ein solcher Bruch ist oft der erste Hinweis auf brüchige Knochen.',
  ],
  'lage.sicht': [
    'Seitenverwechslungen bei Operationen gelten als vermeidbare Fehler. Deshalb wird die richtige Seite vor einer OP mit der Person besprochen und auf der Haut markiert.',
    'Beim Blutdruck, bei Zugängen und bei Lagerungen gilt dasselbe: in der Dokumentation immer die Seite der Person, nicht die eigene Blickrichtung.',
  ],
  'lage.ipsi': [
    'Die Kreuzung der motorischen Bahnen liegt im verlängerten Mark (Pyramidenkreuzung). Das Gesicht kann je nach Ort der Schädigung anders betroffen sein als Arm und Bein.',
    'Bilateral heißt beidseits, unilateral einseitig. Ein beidseitiges Ödem spricht eher für eine Ursache im ganzen Körper wie Herzinsuffizienz, ein einseitiges eher für eine lokale wie eine Thrombose.',
  ],
  'lage.supra': [
    'Ein suprapubischer Katheter wird durch die Bauchdecke direkt in die Blase gelegt. Er schont die Harnröhre und senkt bei längerer Ableitung das Risiko von Verletzungen und Infektionen.',
    'Weitere Lagebegriffe mit Vorsilben: subkutan (unter der Haut), intramuskulär (im Muskel), retrosternal (hinter dem Brustbein), periumbilikal (um den Nabel herum).',
  ],
  'lage.mehrfach': [
    'Lagerungen heißen in neueren Lehrbüchern oft Positionierungen, weil die Person aktiv beteiligt wird und nicht nur „gelagert“ wird.',
    'In der Dokumentation werden beide Ebenen gebraucht: Wo liegt das Problem (Lage am Körper), und welche Positionierung hilft dagegen (Lagerung).',
  ],
  'lage.fall.wunde': [
    'Für Wunden nutzt man zusätzlich die Uhrzeigermethode: Kopfwärts ist 12 Uhr. So lassen sich Taschen oder Unterminierungen am Wundrand genau beschreiben.',
    'Ein Foto mit Maßband und Datum ergänzt die Beschreibung, wenn die Einrichtung es erlaubt und die Person eingewilligt hat.',
  ],
  'abk.zu.applikation': [
    'Ein ZVK endet in einer großen Vene kurz vor dem Herzen. Über ihn können auch Lösungen gegeben werden, die periphere Venen reizen würden. Die Infektionsgefahr ist höher als beim PVK.',
    'Eine PEG wird endoskopisch angelegt, eine Magensonde durch die Nase gelegt. Eine PEG eignet sich für längere Ernährung, eine Magensonde eher für kurze Zeiträume.',
  ],
  'abk.zu.dokumentation': [
    'Eine Differenzialdiagnose ist eine andere Erkrankung, die ähnliche Beschwerden macht und ausgeschlossen werden muss. Brustschmerz hat etwa die DD Herzinfarkt, Lungenembolie oder Muskelschmerz.',
    'Auch in der Pflegedokumentation gilt: Beobachtungen beschreiben, Deutungen kennzeichnen. „V. a.“ zeigt, dass etwas noch nicht gesichert ist.',
  ],
  'abk.zu.vital': [
    'Je nach Haus steht P oder HF für den Puls. Genau genommen misst man am Handgelenk den Puls und am Monitor die Herzfrequenz. Bei Rhythmusstörungen können beide Werte voneinander abweichen (Pulsdefizit).',
    'Die GCS wird vor allem nach Kopfverletzungen und auf Intensivstationen verwendet. Ein Wert von 8 oder weniger gilt als schwere Bewusstseinsstörung mit gefährdetem Atemweg.',
  ],
  'abk.applikation': [
    'Weitere übliche Kürzel: s. l. (sublingual, unter die Zunge), i. c. (intrakutan), rekt. (rektal), inh. (inhalativ), Gtt. (Tropfen), Supp. (Zäpfchen).',
    'Unklare oder schwer lesbare Anordnungen werden nicht geraten, sondern vor der Gabe ärztlich geklärt. Das gehört zu den 6 R: richtige Dosierung und richtige Applikationsart.',
  ],
  'abk.verwechslung': [
    'Weitere bekannte Fehlerquellen: „µg“ wird als „mg“ gelesen (tausendfache Dosis), ein fehlender Nullpunkt vor dem Komma („,5 mg“) wird übersehen, eine Null nach dem Komma („5,0 mg“) wird als 50 gelesen.',
    'Elektronische Verordnungssysteme verringern solche Fehler, ersetzen aber nicht das bewusste Lesen und Gegenprüfen.',
  ],
  'abk.nuechtern': [
    'Lange Nüchternzeiten belasten vor allem ältere Menschen: Sie trocknen aus, werden verwirrt oder unterzuckern. Moderne Empfehlungen erlauben oft klare Flüssigkeit bis kurz vor dem Eingriff.',
    'Patienten mit Diabetes stehen bei Untersuchungen möglichst früh auf dem Plan. Die Insulingabe am Untersuchungstag wird ärztlich angepasst.',
  ],
  'abk.mehrfach': [
    'Bei der pAVK sind die Beinarterien verengt. Typisch ist die Schaufensterkrankheit: Schmerzen beim Gehen, die nach kurzem Stehenbleiben nachlassen. Die Beine werden nicht hochgelagert.',
    'Weitere häufige Krankheitskürzel: HWI (Harnwegsinfekt), TIA (vorübergehende Durchblutungsstörung des Gehirns), DM (Diabetes mellitus), AP (Angina pectoris).',
  ],
  'abk.fall.uebergabe': [
    'Totalendoprothesen gibt es an Hüfte (Hüft-TEP) und Knie (Knie-TEP). Nach einer Hüft-TEP gelten je nach Zugang und Operateur Bewegungseinschränkungen, die in der Übergabe genannt werden.',
    'Ein erhöhter Blutzucker nach Operationen ist häufig, auch ohne bekannten Diabetes. Stress, Schmerzen und Infekte treiben den Zucker hoch. Werte werden gemeldet und weiter kontrolliert.',
  ],
};
